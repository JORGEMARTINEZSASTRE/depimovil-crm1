const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole, isOperadoraRole, isOpsRole } = require('../middleware/auth');
const { enviarMensaje } = require('../utils/wa_sender');
// wa_queue stub — Evolution API deshabilitado, Meta Cloud API es el canal principal
const encolar = async (opts) => { console.log('[wa_queue stub]', opts?.tipo); return { ok: false }; };
const { emitAutomationEvent } = require('../utils/automation_engine');

const router = express.Router();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function nextCodigo() {
  // Generado en DB mediante secuencia o conteo
  return null; // se calcula en el INSERT
}

async function generarCodigo(client) {
  const { rows } = await client.query(
    `SELECT COUNT(*) AS cnt FROM reservas`
  );
  const n = parseInt(rows[0].cnt, 10) + 1;
  return `RES-${String(n).padStart(5, '0')}`;
}

async function generarCodigoEnvio(client) {
  const { rows } = await client.query('SELECT COUNT(*) AS cnt FROM envios');
  const n = parseInt(rows[0].cnt, 10) + 1;
  return `ENV-${String(n).padStart(3, '0')}`;
}

async function ensureReservaHistorial(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS reserva_historial (
      id SERIAL PRIMARY KEY,
      reserva_id INTEGER REFERENCES reservas(id) ON DELETE CASCADE,
      estado_previo VARCHAR(50),
      estado_nuevo VARCHAR(50),
      motivo TEXT,
      usuario_id INTEGER,
      usuario_email VARCHAR(150),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await client.query('ALTER TABLE reserva_historial ADD COLUMN IF NOT EXISTS estado_previo VARCHAR(50)');
  await client.query('ALTER TABLE reserva_historial ADD COLUMN IF NOT EXISTS estado_nuevo VARCHAR(50)');
  await client.query('ALTER TABLE reserva_historial ADD COLUMN IF NOT EXISTS motivo TEXT');
  await client.query('ALTER TABLE reserva_historial ADD COLUMN IF NOT EXISTS usuario_id INTEGER');
  await client.query('ALTER TABLE reserva_historial ADD COLUMN IF NOT EXISTS usuario_email VARCHAR(150)');
  await client.query('ALTER TABLE reserva_historial ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()');
}

ensureReservaHistorial(pool).catch(err => console.error('Error preparando tabla reserva_historial:', err.message));

function dateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return String(value).split('T')[0];
}

function addDays(dateValue, days) {
  const base = dateOnly(dateValue);
  if (!base) return null;
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatDateOnlyEs(value) {
  if (value instanceof Date && hasMeaningfulTime(value)) {
    return new Intl.DateTimeFormat('es-UY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Montevideo',
    }).format(value);
  }
  const iso = dateOnly(value);
  if (!iso || iso === '—') return '—';
  const [year, month, day] = iso.split('-').map(n => parseInt(n, 10));
  if (!year || !month || !day) return String(value);
  return new Intl.DateTimeFormat('es-UY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Montevideo',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function hasMeaningfulTime(value) {
  if (!value) return false;
  if (value instanceof Date) {
    return value.getUTCHours() !== 0 || value.getUTCMinutes() !== 0 || value.getUTCSeconds() !== 0;
  }
  const str = String(value);
  const match = str.match(/T(\d{2}):(\d{2})/);
  return !!(match && !(match[1] === '00' && match[2] === '00'));
}

function formatTimeMontevideo(value) {
  if (!value || !hasMeaningfulTime(value)) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-UY', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Montevideo',
  }).format(d);
}

function formatReservaFecha(row) {
  const inicio = row.tipo === 'jornada'
    ? (row.fecha_jornada || row.fecha_inicio)
    : (row.fecha_inicio || row.fecha_jornada);
  const fin = row.tipo === 'jornada' ? null : row.fecha_fin;
  const fechaInicio = formatDateOnlyEs(inicio);
  const fechaFin = fin && dateOnly(fin) !== dateOnly(inicio) ? formatDateOnlyEs(fin) : '';
  const hora = formatTimeMontevideo(inicio);
  const rango = fechaFin ? `${fechaInicio} al ${fechaFin}` : fechaInicio;
  return hora ? `${rango}, hora ${hora} de Montevideo` : rango;
}

function inferMachineFormat(row) {
  const raw = normalizeText([
    row.maq_nombre, row.maq_marca, row.maq_modelo, row.maq_categoria, row.maq_obs,
  ].filter(Boolean).join(' '));
  if (/(de pie|vertical|torre|floor|standing)/.test(raw)) return 'de pie';
  if (/(escritorio|desktop|mesa|portatil|portátil)/.test(raw)) return 'de escritorio';
  return '';
}

function technicalMachineName(row) {
  const raw = normalizeText([
    row.maq_nombre, row.maq_marca, row.maq_modelo, row.maq_categoria,
  ].filter(Boolean).join(' '));
  if (/(soprano|titanium|ice|laser|láser|depil|depi)/.test(raw)) {
    return ['Soprano Titanium Ice', inferMachineFormat(row)].filter(Boolean).join(' ');
  }
  return [row.maq_marca, row.maq_modelo, row.maq_categoria].filter(Boolean).join(' ').trim() || row.maq_categoria || 'Equipo profesional';
}

function formatMachineForOperator(row) {
  const tecnico = technicalMachineName(row);
  const fantasia = String(row.maq_nombre || '').trim();
  if (!fantasia || normalizeText(fantasia) === normalizeText(tecnico)) return tecnico;
  return `${tecnico} "${fantasia}"`;
}

const ESTADOS_RESERVA_BLOQUEANTES = ['solicitud_recibida', 'pendiente_aprobacion', 'aprobada', 'confirmada'];
const ESTADOS_MAQUINA_NO_ALQUILABLE = ['mantenimiento', 'fuera_servicio', 'en_viaje'];

function rangoReserva({ tipo, fecha_jornada, fecha_inicio, fecha_fin }) {
  const inicio = tipo === 'jornada'
    ? dateOnly(fecha_jornada || fecha_inicio)
    : dateOnly(fecha_inicio || fecha_jornada);
  const fin = tipo === 'jornada'
    ? inicio
    : dateOnly(fecha_fin || fecha_inicio || fecha_jornada);
  return { inicio, fin };
}

function rangoBloqueado({ tipo, fecha_jornada, fecha_inicio, fecha_fin, bloque_logistico }) {
  const rango = rangoReserva({ tipo, fecha_jornada, fecha_inicio, fecha_fin });
  if (!rango.inicio || !rango.fin) return { ...rango, bloqueDesde: null, bloqueHasta: null };
  return {
    ...rango,
    bloqueDesde: bloque_logistico ? addDays(rango.inicio, -2) : rango.inicio,
    bloqueHasta: bloque_logistico ? addDays(rango.fin, 2) : rango.fin,
  };
}

function rangosSeCruzan(a, b) {
  return !!(a?.bloqueDesde && a?.bloqueHasta && b?.bloqueDesde && b?.bloqueHasta &&
    a.bloqueDesde <= b.bloqueHasta && a.bloqueHasta >= b.bloqueDesde);
}

async function validarReservaOperativa(client, {
  maquina_id,
  tipo,
  fecha_jornada,
  fecha_inicio,
  fecha_fin,
  bloque_logistico,
  excluirReservaId,
}) {
  const maquinaId = parseInt(maquina_id, 10);
  if (!maquinaId) {
    return { ok: false, status: 400, error: 'maquina_id es obligatorio' };
  }

  const { rows: maquinas } = await client.query(
    `SELECT id, codigo, nombre, estado, tipo_operativo
     FROM maquinas
     WHERE id = $1
     FOR UPDATE`,
    [maquinaId]
  );
  if (!maquinas.length) {
    return { ok: false, status: 404, error: 'Máquina no encontrada' };
  }
  const maquina = maquinas[0];
  if (maquina.tipo_operativo === 'solo_venta') {
    return { ok: false, status: 409, error: 'Máquina marcada como solo venta: no disponible para alquiler' };
  }
  if (ESTADOS_MAQUINA_NO_ALQUILABLE.includes(maquina.estado)) {
    return {
      ok: false,
      status: 409,
      error: `La máquina ${maquina.codigo || maquina.id} — ${maquina.nombre} no se puede reservar porque está en estado "${maquina.estado}"`,
    };
  }

  const tipoReserva = tipo || 'jornada';
  const nuevoRango = rangoBloqueado({
    tipo: tipoReserva,
    fecha_jornada,
    fecha_inicio,
    fecha_fin,
    bloque_logistico: !!bloque_logistico,
  });
  if (!nuevoRango.inicio || !nuevoRango.fin) {
    return { ok: false, status: 400, error: tipoReserva === 'jornada' ? 'fecha_jornada es obligatoria' : 'fecha_inicio y fecha_fin son obligatorias' };
  }
  if (nuevoRango.fin < nuevoRango.inicio) {
    return { ok: false, status: 400, error: 'La fecha de fin no puede ser anterior a la fecha de inicio' };
  }

  const params = [maquinaId, ESTADOS_RESERVA_BLOQUEANTES];
  let excluirSql = '';
  if (excluirReservaId) {
    params.push(parseInt(excluirReservaId, 10));
    excluirSql = `AND r.id <> $${params.length}`;
  }

  const { rows: reservas } = await client.query(`
    SELECT r.id, r.codigo, r.estado, r.tipo, r.fecha_jornada, r.fecha_inicio, r.fecha_fin,
           r.bloque_logistico, o.nombre AS op_nombre, o.apellido AS op_apellido
    FROM reservas r
    LEFT JOIN operadoras o ON o.id = r.operadora_id
    WHERE r.maquina_id = $1
      AND r.estado = ANY($2)
      ${excluirSql}
    FOR UPDATE OF r
  `, params);

  const conflicto = reservas.find(r => rangosSeCruzan(nuevoRango, rangoBloqueado(r)));
  if (conflicto) {
    const rangoExistente = rangoBloqueado(conflicto);
    const op = [conflicto.op_nombre, conflicto.op_apellido].filter(Boolean).join(' ');
    return {
      ok: false,
      status: 409,
      error: `Conflicto de disponibilidad: ${maquina.codigo || maquina.id} — ${maquina.nombre} ya está bloqueada por ${conflicto.codigo || `reserva #${conflicto.id}`} (${rangoExistente.bloqueDesde} a ${rangoExistente.bloqueHasta}${op ? `, ${op}` : ''})`,
    };
  }

  return { ok: true, maquina, rango: nuevoRango };
}

function normalizarCiudad(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizarTextoPrecio(value) {
  return normalizarCiudad(value).replace(/[^a-z0-9]+/g, ' ').trim();
}

function localidadTarifaBase(value) {
  const norm = normalizarCiudad(value);
  if (!norm) return '';
  if (norm.includes('montevideo')) return 'montevideo';
  if (norm.includes('canelones')) return 'canelones';
  if (norm.includes('maldonado') || norm.includes('punta del este')) return 'maldonado';
  if (norm.includes('salto')) return 'salto';
  if (norm.includes('tacuarembo')) return 'tacuarembo';
  if (norm.includes('todo el pais') || norm.includes('uruguay')) return 'todo el pais';
  return 'interior';
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

async function ensureMaquinaTarifas(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS maquina_tarifas (
      id SERIAL PRIMARY KEY,
      equipo VARCHAR(160) NOT NULL,
      formato VARCHAR(80) NOT NULL DEFAULT '',
      localidad VARCHAR(120) NOT NULL,
      localidad_norm VARCHAR(140) NOT NULL,
      modalidad VARCHAR(60) NOT NULL DEFAULT 'jornada',
      jornadas INTEGER NOT NULL DEFAULT 1,
      precio NUMERIC(12,2) NOT NULL,
      moneda VARCHAR(10) NOT NULL DEFAULT 'UYU',
      condicion TEXT,
      inicio_suave BOOLEAN NOT NULL DEFAULT FALSE,
      disparos_incluidos INTEGER,
      excedente_precio NUMERIC(12,2),
      activa BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (equipo, formato, localidad_norm, modalidad)
    )
  `);
  await client.query("ALTER TABLE maquina_tarifas ADD COLUMN IF NOT EXISTS modalidad VARCHAR(60) NOT NULL DEFAULT 'jornada'");
  await client.query("ALTER TABLE maquina_tarifas ADD COLUMN IF NOT EXISTS inicio_suave BOOLEAN NOT NULL DEFAULT FALSE");
  await client.query('ALTER TABLE maquina_tarifas ADD COLUMN IF NOT EXISTS disparos_incluidos INTEGER');
  await client.query('ALTER TABLE maquina_tarifas ADD COLUMN IF NOT EXISTS excedente_precio NUMERIC(12,2)');
  await client.query("UPDATE maquina_tarifas SET formato = '' WHERE formato IS NULL");
  await client.query("ALTER TABLE maquina_tarifas ALTER COLUMN formato SET DEFAULT ''");
  await client.query("ALTER TABLE maquina_tarifas ALTER COLUMN formato SET NOT NULL");
  await client.query('ALTER TABLE maquina_tarifas DROP CONSTRAINT IF EXISTS maquina_tarifas_equipo_formato_localidad_norm_jornadas_key');
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS maquina_tarifas_equipo_formato_localidad_norm_modalidad_key
    ON maquina_tarifas (equipo, formato, localidad_norm, modalidad)
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_maquina_tarifas_lookup
    ON maquina_tarifas (activa, localidad_norm, modalidad)
  `);
}

function jornadasReserva({ tipo, fecha_jornada, fecha_inicio, fecha_fin }) {
  if ((tipo || 'jornada') === 'jornada') return 1;
  const inicio = dateOnly(fecha_inicio || fecha_jornada);
  const fin = dateOnly(fecha_fin || fecha_inicio || fecha_jornada);
  if (!inicio || !fin) return 1;
  const a = new Date(`${inicio}T12:00:00Z`);
  const b = new Date(`${fin}T12:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)) + 1);
}

function inferirEquipoTarifa(row) {
  const raw = normalizarTextoPrecio([
    row.maquina_nombre, row.maquina_marca, row.maquina_modelo, row.maquina_categoria, row.maquina_obs,
  ].filter(Boolean).join(' '));
  if (/22d/.test(raw) || /liposonix/.test(raw)) return 'HIFU 22D MAX con Liposonix';
  if (/hifu/.test(raw) && /(12d max|12 d max|max)/.test(raw)) return 'HIFU 12D MAX';
  if (/hifu/.test(raw) || /12d/.test(raw)) return 'HIFU 12D';
  if (/pressoterapia|presoterapia|botas/.test(raw)) return 'Pressoterapia';
  if (/exilis/.test(raw)) return 'Exilis';
  if (/hidrofacial|hydrafacial|facial/.test(raw)) return 'Hidrofacial';
  if (/\bems\b|electroestimulacion|electro estimulacion/.test(raw)) return 'EMS / Electroestimulación';
  if (/(soprano|titanium|ice|laser|depil|depi)/.test(raw)) return 'Soprano Titanium Ice';
  return row.maquina_categoria || row.maquina_nombre || '';
}

function inferirFormatoTarifa(row) {
  const raw = normalizarTextoPrecio([
    row.maquina_nombre, row.maquina_marca, row.maquina_modelo, row.maquina_categoria, row.maquina_obs,
  ].filter(Boolean).join(' '));
  if (/(de pie|vertical|torre|grande|standing|floor|ndyag|ndyac)/.test(raw)) return 'de pie';
  if (/(escritorio|desktop|mesa|portatil|portátil|chica)/.test(raw)) return 'de escritorio';
  return null;
}

function modalidadTarifaReserva(reserva = {}) {
  const tipo = reserva.tipo || 'jornada';
  if (tipo === 'semanal') return 'semana';
  if (tipo === 'mensual') return 'mensual';
  const jornadas = jornadasReserva(reserva);
  if (jornadas === 2) return '2_jornadas';
  if (jornadas === 3) return '3_jornadas';
  return 'jornada';
}

function localidadesTarifaCandidatas(row, reserva = {}) {
  const raw = [
    reserva.dept_logistica,
    row.operadora_ciudad,
    row.operadora_departamento,
  ];
  parseJsonArray(row.direcciones_entrega).forEach(d => {
    raw.push(d.localidad, d.ciudad, d.departamento);
  });
  const exactas = raw.map(localidadTarifaBase).filter(Boolean);
  const candidates = [];
  exactas.forEach(loc => {
    if (!candidates.includes(loc)) candidates.push(loc);
    if (!['montevideo', 'canelones', 'maldonado', 'todo el pais', 'interior'].includes(loc) && !candidates.includes('interior')) {
      candidates.push('interior');
    }
  });
  if (!candidates.includes('todo el pais')) candidates.push('todo el pais');
  return candidates;
}

async function precioMatrizMaquina(client, row, reserva = {}) {
  await ensureMaquinaTarifas(client);
  const equipo = inferirEquipoTarifa(row);
  const formato = inferirFormatoTarifa(row);
  const modalidad = modalidadTarifaReserva(reserva);
  const localidadNorms = localidadesTarifaCandidatas(row, reserva);
  if (!equipo || !localidadNorms.length) return null;
  const { rows: tarifas } = await client.query(`
    SELECT *
    FROM maquina_tarifas
    WHERE activa = TRUE
      AND localidad_norm = ANY($1)
      AND modalidad = $2
      AND lower(equipo) = lower($3)
      AND ($4::text IS NULL OR formato = '' OR lower(formato) = lower($4))
    ORDER BY array_position($1::text[], localidad_norm),
      CASE WHEN $4::text IS NOT NULL AND formato <> '' THEN 0 ELSE 1 END,
      updated_at DESC
    LIMIT 1
  `, [localidadNorms, modalidad, equipo, formato]);
  const tarifa = tarifas[0];
  const precio = parseFloat(tarifa?.precio);
  return Number.isFinite(precio) && precio > 0 ? { valor: precio, tarifa } : null;
}

async function precioReservaParaOperadora(client, operadoraId, maquinaId, reserva = {}) {
  const { rows } = await client.query(`
    SELECT o.equipos_alquila, o.ciudad AS operadora_ciudad, o.departamento AS operadora_departamento,
           o.direcciones_entrega,
           m.codigo AS maquina_codigo,
           m.nombre AS maquina_nombre,
           m.categoria AS maquina_categoria,
           m.marca AS maquina_marca,
           m.modelo AS maquina_modelo,
           m.obs AS maquina_obs
    FROM operadoras o
    CROSS JOIN maquinas m
    WHERE o.id=$1 AND m.id=$2
  `, [operadoraId, maquinaId]);
  if (!rows.length) return null;
  const row = rows[0];
  const tarifas = parseJsonArray(row.equipos_alquila);
  const claves = [
    normalizarTextoPrecio(row.maquina_nombre),
    normalizarTextoPrecio(row.maquina_categoria),
    normalizarTextoPrecio(row.maquina_codigo),
  ].filter(Boolean);
  const tarifa = tarifas.find(t => {
    const equipo = normalizarTextoPrecio(t.equipo || t.nombre || t.categoria);
    if (!equipo) return false;
    return claves.some(k => equipo.includes(k) || k.includes(equipo));
  });
  const valor = parseFloat(tarifa?.valor);
  if (Number.isFinite(valor) && valor > 0) return valor;
  const matriz = await precioMatrizMaquina(client, row, reserva);
  return matriz?.valor || null;
}

function localidadesOperadora(row) {
  const values = [row?.operadora_ciudad, row?.ciudad, row?.localidad];
  parseJsonArray(row?.direcciones_entrega).forEach(d => {
    values.push(d.localidad, d.ciudad, d.departamento);
  });
  return Array.from(new Set(values.map(normalizarCiudad).filter(Boolean)));
}

async function validarCiudadReserva(client, operadoraId, maquinaId) {
  const { rows } = await client.query(`
    SELECT o.ciudad AS operadora_ciudad,
           o.direcciones_entrega,
           m.ubicacion AS maquina_ciudad,
           (COALESCE(m.es_viajera, FALSE) OR COALESCE(m.tipo_operativo, 'viajera') = 'viajera' OR COALESCE(m.tipo_operativo, 'viajera') = 'alquiler') AS es_viajera,
           COALESCE(m.tipo_operativo, 'alquiler') AS tipo_operativo,
           m.ciudad_base
    FROM operadoras o
    CROSS JOIN maquinas m
    WHERE o.id = $1 AND m.id = $2
  `, [operadoraId, maquinaId]);
  if (!rows.length) {
    return { ok: false, status: 404, error: 'Operadora o máquina no encontrada' };
  }
  const row = rows[0];
  if (row.tipo_operativo === 'solo_venta') {
    return { ok: false, status: 409, error: 'Máquina marcada como solo venta: no disponible para alquiler' };
  }
  const opLocalidades = localidadesOperadora(row);
  const maqCiudad = normalizarCiudad(row.tipo_operativo === 'base_ciudad' ? (row.ciudad_base || row.maquina_ciudad) : row.maquina_ciudad);
  if (!opLocalidades.length) {
    return { ok: false, status: 409, error: 'La operadora no tiene localidades/direcciones declaradas para alquilar máquinas' };
  }
  if (!maqCiudad || !opLocalidades.includes(maqCiudad)) {
    return { ok: false, status: 409, error: 'Máquina no disponible para las localidades declaradas por la operadora' };
  }
  return { ok: true };
}

async function crearEnvioAutomaticoSiCorresponde(client, reservaId, usuarioEmail = 'sistema') {
  const { rows } = await client.query(`
    SELECT r.*,
           o.direccion_entrega, o.ciudad AS op_ciudad, o.departamento AS op_departamento,
           m.categoria AS maquina_categoria
    FROM reservas r
    LEFT JOIN operadoras o ON o.id = r.operadora_id
    LEFT JOIN maquinas m ON m.id = r.maquina_id
    WHERE r.id = $1
    FOR UPDATE OF r
  `, [reservaId]);
  if (!rows.length) return null;

  const r = rows[0];
  if (r.estado !== 'confirmada' || !r.bloque_logistico) return null;

  const existe = await client.query('SELECT id FROM envios WHERE reserva_id=$1 LIMIT 1', [reservaId]);
  if (existe.rows.length) return existe.rows[0];

  const departamento = r.dept_logistica || r.op_departamento || null;
  const direccion = r.direccion_entrega || [r.op_ciudad, r.op_departamento].filter(Boolean).join(', ') || departamento;
  const transportista = departamento
    ? await client.query(`
        SELECT id, nombre
        FROM transportistas
        WHERE estado = 'activo'
          AND ($1 = ANY(departamentos) OR COALESCE(array_length(departamentos, 1), 0) = 0)
        ORDER BY CASE WHEN $1 = ANY(departamentos) THEN 0 ELSE 1 END, nombre
        LIMIT 1
      `, [departamento])
    : { rows: [] };
  const t = transportista.rows[0] || {};
  const fechaBase = r.fecha_inicio || r.fecha_jornada;
  const fechaFin = r.fecha_fin || r.fecha_jornada || r.fecha_inicio;
  const codigo = await generarCodigoEnvio(client);

  const { rows: envios } = await client.query(`
    INSERT INTO envios (
      codigo, reserva_id, operadora_id, maquina_id, transportista_id,
      departamento, direccion, transportista, estado, tipo_envio, tipo_maquina,
      departamento_destino, fecha_envio_est, fecha_retiro_est, moneda, obs
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pendiente_envio','ida',$9,$10,$11,$12,$13,$14)
    RETURNING *
  `, [
    codigo,
    r.id,
    r.operadora_id,
    r.maquina_id,
    t.id || null,
    departamento,
    direccion || null,
    t.nombre || null,
    r.maquina_categoria || 'chica',
    departamento,
    dateOnly(fechaBase),
    addDays(fechaFin, 2),
    r.moneda || 'UYU',
    `Creado automáticamente al confirmar reserva ${r.codigo}`
  ]);

  await client.query(`
    INSERT INTO audit_log (usuario_email, accion, entidad, entidad_id, detalle)
    VALUES ($1,'CREATE_AUTO','envio',$2,$3)
  `, [usuarioEmail, envios[0].id, `Envío automático para reserva ${r.codigo}`]);

  return envios[0];
}

const WA_PLANTILLAS = {
  solicitud_recibida: (op, r) =>
    `¡Hola ${op.nombre}! 📥 Recibimos tu solicitud de reserva.\n📌 Equipo: ${r.maquina||'—'}\n📅 Fecha: ${r.fecha}\n🔖 Código: ${r.codigo}\n\nLa revisaremos pronto.`,
  aprobada: (op, r) =>
    `¡Hola ${op.nombre}! ✅ Tu reserva fue aprobada.\n📌 Equipo: ${r.maquina||'—'}\n📅 Fecha: ${r.fecha}\n🔖 Código: ${r.codigo}`,
  confirmada: (op, r) =>
    `Hola ${op.nombre}, tu reserva en DepiMóvil quedó confirmada.\n\nEquipo reservado: *${r.maquina||'—'}*\nFecha de la reserva: *${r.fecha}*\nCódigo de reserva: *${r.codigo}*\n\nNuestro equipo coordinará los detalles operativos necesarios. Gracias por trabajar con DepiMóvil.`,
  rechazada: (op, r) =>
    `¡Hola ${op.nombre}! ❌ Tu reserva no pudo ser procesada.\n📌 Equipo: ${r.maquina||'—'}\n🔖 Código: ${r.codigo}\n\nContactanos para más información.`,
  cancelada: (op, r) =>
    `¡Hola ${op.nombre}! 🚫 Tu reserva fue cancelada.\n🔖 Código: ${r.codigo}`,
};

async function notificarWA(reservaId, nuevoEstado, client) {
  try {
    if (!WA_PLANTILLAS[nuevoEstado]) {
      console.log(`📱 notificarWA: sin plantilla para estado "${nuevoEstado}"`);
      return;
    }
    const { rows } = await pool.query(`
      SELECT r.*, o.nombre AS op_nombre, o.apellido AS op_apellido, o.whatsapp AS op_wa,
             m.nombre AS maq_nombre, m.codigo AS maq_codigo, m.categoria AS maq_categoria,
             m.marca AS maq_marca, m.modelo AS maq_modelo, m.obs AS maq_obs
      FROM reservas r
      LEFT JOIN operadoras o ON o.id = r.operadora_id
      LEFT JOIN maquinas m ON m.id = r.maquina_id
      WHERE r.id = $1
    `, [reservaId]);
    if (!rows.length) {
      console.warn(`📱 notificarWA: reserva ${reservaId} no encontrada`);
      return;
    }
    const row = rows[0];
    if (!row.op_wa) {
      console.warn(`📱 notificarWA: operadora sin WhatsApp (reserva ${reservaId})`);
      return;
    }
    const op = { nombre: row.op_nombre || '' };
    const fecha = formatReservaFecha(row);
    const texto = WA_PLANTILLAS[nuevoEstado](op, {
      maquina: formatMachineForOperator(row),
      fecha,
      codigo: row.codigo,
    });
    console.log(`📱 notificarWA: enviando a ${row.op_wa} — ${nuevoEstado} — ${row.codigo}`);
    const resultado = await enviarMensaje(row.op_wa, texto);
    if (resultado.ok) {
      console.log(`✅ notificarWA: enviado OK a ${row.op_wa}`);
      await pool.query(
        `INSERT INTO audit_log (usuario_email, accion, entidad, entidad_id, detalle)
         VALUES ($1,$2,$3,$4,$5)`,
        ['sistema', 'WA_SEND_AUTO', 'reserva', reservaId, `${nuevoEstado} → ${row.op_wa} — ${row.codigo}`]
      );
    } else {
      console.warn(`⚠️ notificarWA: fallo envío a ${row.op_wa} — ${resultado.error}`);
      await encolar({
        reservaId: reservaId,
        operadoraId: row.operadora_id,
        tipo: `estado_${nuevoEstado}`,
        mensaje: texto,
        telefono: row.op_wa,
      });
    }
  } catch (e) {
    console.error('notificarWA reservas error:', e.message);
  }
}

// ─────────────────────────────────────────────
// GET /api/reservas — listar todas
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { estado } = req.query;
    const where = [];
    const params = [];
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.json([]);
      params.push(req.user.operadora_id);
      where.push(`r.operadora_id = $${params.length}`);
    } else if (req.user.rol === 'transportista') {
      if (!req.user.transportista_id) return res.json([]);
      params.push(req.user.transportista_id);
      where.push(`EXISTS (SELECT 1 FROM envios e WHERE e.reserva_id = r.id AND e.transportista_id = $${params.length})`);
    } else if (!isOpsRole(req.user.rol)) {
      return res.json([]);
    }
    let query = `
      SELECT r.*
      FROM reservas r
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY COALESCE(r.fecha_jornada, r.fecha_inicio) DESC NULLS LAST
    `;
    if (estado === 'activa') {
      const activeWhere = [...where, `r.estado IN ('solicitud_recibida','pendiente_aprobacion','aprobada','confirmada')`];
      query = `
        SELECT r.* FROM reservas r
        WHERE ${activeWhere.join(' AND ')}
        ORDER BY COALESCE(r.fecha_jornada, r.fecha_inicio) DESC NULLS LAST
      `;
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/reservas error:', err);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// ─────────────────────────────────────────────
// GET /api/reservas/:id — obtener una
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const params = [req.params.id];
    let query = 'SELECT * FROM reservas WHERE id = $1';
    if (isOperadoraRole(req.user.rol)) {
      params.push(req.user.operadora_id || 0);
      query += ` AND operadora_id = $${params.length}`;
    } else if (req.user.rol === 'transportista') {
      params.push(req.user.transportista_id || 0);
      query += ` AND EXISTS (SELECT 1 FROM envios e WHERE e.reserva_id = reservas.id AND e.transportista_id = $${params.length})`;
    } else if (!isOpsRole(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos para reservas' });
    }
    const { rows } = await pool.query(query, params);
    if (!rows.length) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/reservas/:id error:', err);
    res.status(500).json({ error: 'Error al obtener reserva' });
  }
});

// ─────────────────────────────────────────────
// POST /api/reservas — crear nueva
// ─────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const {
    operadora_id, maquina_id, tipo, estado,
    fecha_jornada, fecha_inicio, fecha_fin,
    dept_logistica, bloque_logistico,
    monto, moneda, notas
  } = req.body;

  if (!isOpsRole(req.user.rol) && !isOperadoraRole(req.user.rol)) {
    return res.status(403).json({ error: 'Sin permisos para crear reservas' });
  }

  const operadoraIdFinal = isOperadoraRole(req.user.rol)
    ? parseInt(req.user.operadora_id || 0, 10)
    : parseInt(operadora_id, 10);
  const estadoFinal = isOperadoraRole(req.user.rol) ? 'solicitud_recibida' : (estado || 'solicitud_recibida');
  const bloqueoFinal = isOperadoraRole(req.user.rol) ? false : (bloque_logistico || false);

  if (!operadoraIdFinal || !maquina_id) {
    return res.status(400).json({ error: 'operadora_id y maquina_id son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const codigo = await generarCodigo(client);
    const ciudadOk = await validarCiudadReserva(client, operadoraIdFinal, parseInt(maquina_id));
    if (!ciudadOk.ok) {
      await client.query('ROLLBACK');
      return res.status(ciudadOk.status || 400).json({ error: ciudadOk.error });
    }
    const disponibilidadOk = await validarReservaOperativa(client, {
      maquina_id,
      tipo: tipo || 'jornada',
      fecha_jornada,
      fecha_inicio,
      fecha_fin,
      bloque_logistico: bloqueoFinal,
    });
    if (!disponibilidadOk.ok) {
      await client.query('ROLLBACK');
      return res.status(disponibilidadOk.status || 400).json({ error: disponibilidadOk.error });
    }
    const montoFinal = isOperadoraRole(req.user.rol)
      ? (await precioReservaParaOperadora(client, operadoraIdFinal, parseInt(maquina_id, 10), {
        tipo: tipo || 'jornada',
        fecha_jornada,
        fecha_inicio,
        fecha_fin,
        dept_logistica,
      }) || 0)
      : (parseFloat(monto) || 0);
    const monedaFinal = isOperadoraRole(req.user.rol) ? 'UYU' : (moneda || 'UYU');

    const { rows } = await client.query(`
      INSERT INTO reservas (
        codigo, operadora_id, maquina_id, tipo, estado,
        fecha_jornada, fecha_inicio, fecha_fin,
        dept_logistica, bloque_logistico,
        monto, moneda, notas, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
      RETURNING *
    `, [
      codigo,
      operadoraIdFinal, parseInt(maquina_id),
      tipo || 'jornada', estadoFinal,
      fecha_jornada || null,
      fecha_inicio || null, fecha_fin || null,
      dept_logistica || null, bloqueoFinal,
      montoFinal, monedaFinal, notas || null
    ]);

    const reserva = rows[0];

    await client.query(`
      INSERT INTO reserva_historial (reserva_id, estado_previo, estado_nuevo, motivo, usuario_id, usuario_email)
      VALUES ($1, NULL, $2, 'Creación de reserva', $3, $4)
    `, [reserva.id, reserva.estado, req.user.id, req.user.email]);

    await client.query(`
      INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
      VALUES ($1,$2,$3,$4,$5,$6)
    `, [req.user.id, req.user.email, 'CREATE', 'reserva', reserva.id, codigo]);

    await crearEnvioAutomaticoSiCorresponde(client, reserva.id, req.user.email);
    await emitAutomationEvent(client, {
      event: 'booking.created',
      entity: 'reserva',
      entityId: reserva.id,
      dedupeKey: `booking.created:reserva:${reserva.id}`,
      payload: { reserva },
      user: req.user,
    });
    if (reserva.estado === 'confirmada') {
      await emitAutomationEvent(client, {
        event: 'booking.confirmed',
        entity: 'reserva',
        entityId: reserva.id,
        dedupeKey: `booking.confirmed:reserva:${reserva.id}`,
        payload: { reserva },
        user: req.user,
      });
    }

    await client.query('COMMIT');

    // Notificar por WA fuera de la transacción
    notificarWA(reserva.id, reserva.estado, null).catch(() => {});

    res.status(201).json(reserva);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/reservas error:', err);
    res.status(500).json({ error: 'Error al crear reserva' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// PUT /api/reservas/:id — actualizar
// ─────────────────────────────────────────────
router.put('/:id', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    operadora_id, maquina_id, tipo, estado,
    fecha_jornada, fecha_inicio, fecha_fin,
    dept_logistica, bloque_logistico,
    monto, moneda, notas
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: prev } = await client.query('SELECT estado FROM reservas WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!prev.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    const estadoPrevio = prev[0].estado;
    const ciudadOk = await validarCiudadReserva(client, parseInt(operadora_id), parseInt(maquina_id));
    if (!ciudadOk.ok) {
      await client.query('ROLLBACK');
      return res.status(ciudadOk.status || 400).json({ error: ciudadOk.error });
    }
    const disponibilidadOk = await validarReservaOperativa(client, {
      maquina_id,
      tipo: tipo || 'jornada',
      fecha_jornada,
      fecha_inicio,
      fecha_fin,
      bloque_logistico: bloque_logistico || false,
      excluirReservaId: req.params.id,
    });
    if (!disponibilidadOk.ok) {
      await client.query('ROLLBACK');
      return res.status(disponibilidadOk.status || 400).json({ error: disponibilidadOk.error });
    }

    const { rows } = await client.query(`
      UPDATE reservas SET
        operadora_id=$1, maquina_id=$2, tipo=$3, estado=$4,
        fecha_jornada=$5, fecha_inicio=$6, fecha_fin=$7,
        dept_logistica=$8, bloque_logistico=$9,
        monto=$10, moneda=$11, notas=$12, updated_at=NOW()
      WHERE id=$13
      RETURNING *
    `, [
      parseInt(operadora_id), parseInt(maquina_id), tipo || 'jornada', estado || estadoPrevio,
      fecha_jornada || null, fecha_inicio || null, fecha_fin || null,
      dept_logistica || null, bloque_logistico || false,
      parseFloat(monto) || 0, moneda || 'UYU', notas || null,
      req.params.id
    ]);

    if (estado && estado !== estadoPrevio) {
      await client.query(`
        INSERT INTO reserva_historial (reserva_id, estado_previo, estado_nuevo, motivo, usuario_id, usuario_email)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [req.params.id, estadoPrevio, estado, 'Edición de reserva', req.user.id, req.user.email]);
    }

    if (rows[0].estado === 'confirmada') {
      await crearEnvioAutomaticoSiCorresponde(client, req.params.id, req.user.email);
      if (estado && estado !== estadoPrevio) {
        await emitAutomationEvent(client, {
          event: 'booking.confirmed',
          entity: 'reserva',
          entityId: parseInt(req.params.id, 10),
          dedupeKey: `booking.confirmed:reserva:${req.params.id}`,
          payload: { reserva: rows[0], estadoPrevio },
          user: req.user,
        });
      }
    }

    await client.query('COMMIT');

    if (estado && estado !== estadoPrevio) {
      notificarWA(parseInt(req.params.id), estado, null).catch(() => {});
    }

    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PUT /api/reservas/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar reserva' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// PATCH /api/reservas/:id/estado — cambio de estado
// ─────────────────────────────────────────────
router.patch('/:id/estado', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const { estado, motivo } = req.body;
  if (!estado) return res.status(400).json({ error: 'estado es requerido' });
  if (!motivo) return res.status(400).json({ error: 'motivo es requerido' });

  const ESTADOS_VALIDOS = ['solicitud_recibida', 'pendiente_aprobacion', 'aprobada', 'confirmada', 'rechazada', 'cancelada', 'reprogramada'];
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido: ${estado}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: prev } = await client.query('SELECT * FROM reservas WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!prev.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    const estadoPrevio = prev[0].estado;
    if (estadoPrevio === estado) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El estado es igual al actual' });
    }
    if (ESTADOS_RESERVA_BLOQUEANTES.includes(estado)) {
      const disponibilidadOk = await validarReservaOperativa(client, {
        maquina_id: prev[0].maquina_id,
        tipo: prev[0].tipo,
        fecha_jornada: prev[0].fecha_jornada,
        fecha_inicio: prev[0].fecha_inicio,
        fecha_fin: prev[0].fecha_fin,
        bloque_logistico: prev[0].bloque_logistico,
        excluirReservaId: req.params.id,
      });
      if (!disponibilidadOk.ok) {
        await client.query('ROLLBACK');
        return res.status(disponibilidadOk.status || 400).json({ error: disponibilidadOk.error });
      }
    }

    const { rows } = await client.query(
      'UPDATE reservas SET estado=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [estado, req.params.id]
    );

    await client.query(`
      INSERT INTO reserva_historial (reserva_id, estado_previo, estado_nuevo, motivo, usuario_id, usuario_email)
      VALUES ($1,$2,$3,$4,$5,$6)
    `, [req.params.id, estadoPrevio, estado, motivo, req.user.id, req.user.email]);

    await client.query(`
      INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
      VALUES ($1,$2,$3,$4,$5,$6)
    `, [req.user.id, req.user.email, 'ESTADO', 'reserva', req.params.id, `${estadoPrevio} → ${estado}: ${motivo}`]);

    await crearEnvioAutomaticoSiCorresponde(client, req.params.id, req.user.email);
    if (estado === 'confirmada') {
      await emitAutomationEvent(client, {
        event: 'booking.confirmed',
        entity: 'reserva',
        entityId: parseInt(req.params.id, 10),
        dedupeKey: `booking.confirmed:reserva:${req.params.id}`,
        payload: { reserva: rows[0], estadoPrevio },
        user: req.user,
      });
    }

    await client.query('COMMIT');

    notificarWA(parseInt(req.params.id), estado, null).catch(() => {});

    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PATCH /api/reservas/:id/estado error:', err);
    res.status(500).json({ error: 'Error al cambiar estado' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// DELETE /api/reservas/:id — eliminar
// ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM reservas WHERE id=$1 RETURNING id, codigo', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Reserva no encontrada' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'DELETE', 'reserva', req.params.id, rows[0].codigo]
    );
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/reservas/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar reserva' });
  }
});

module.exports = router;
