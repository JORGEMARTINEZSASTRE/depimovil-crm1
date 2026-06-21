// routes/maquinas/helpers.js — funciones compartidas
const pool = require('../../utils/db');

function normalizarLocalidad(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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

function localidadesOperadora(row) {
  const values = [row?.ciudad, row?.localidad];
  parseJsonArray(row?.direcciones_entrega).forEach(d => {
    values.push(d.localidad, d.ciudad, d.departamento);
  });
  return Array.from(new Set(values.map(normalizarLocalidad).filter(Boolean)));
}

function localidadMaquina(row) {
  const tipo = row?.tipo_operativo === 'alquiler' ? 'viajera' : (row?.tipo_operativo || (row?.es_viajera ? 'viajera' : 'base_ciudad'));
  return normalizarLocalidad(tipo === 'base_ciudad' ? (row?.ciudad_base || row?.ubicacion) : (row?.ubicacion || row?.ciudad_base));
}

function maquinaVisibleParaLocalidades(row, localidades) {
  if (!row || row.tipo_operativo === 'solo_venta') return false;
  const loc = localidadMaquina(row);
  return !!(localidades.length && loc && localidades.includes(loc));
}

function isViajera(row) {
  const tipo = row?.tipo_operativo === 'alquiler' ? 'viajera' : (row?.tipo_operativo || (row?.es_viajera ? 'viajera' : 'base_ciudad'));
  return tipo === 'viajera' || tipo === 'alquiler' || !!row?.es_viajera;
}

function incidenciaBloqueaReservas(gravedad, bloquea) {
  return bloquea === true || ['alta', 'critica'].includes(String(gravedad || '').toLowerCase());
}

function normalizarChecklistPuestaPunto(value) {
  const raw = value && typeof value === 'object' ? value : {};
  const items = [
    ['limpieza_exterior', 'Limpieza exterior realizada'],
    ['limpieza_cabezales', 'Cabezales y accesorios limpios'],
    ['cables_conectores', 'Cableado y conectores revisados'],
    ['prueba_encendido', 'Prueba de encendido correcta'],
    ['prueba_funcional', 'Prueba funcional básica correcta'],
    ['accesorios_controlados', 'Piezas y accesorios controlados'],
    ['foto_post_limpieza', 'Foto post limpieza cargada o verificada'],
  ];
  const checklist = {};
  const faltantes = [];
  for (const [key, label] of items) {
    checklist[key] = raw[key] === true || raw[key] === 'true' || raw[key] === 1 || raw[key] === '1';
    if (!checklist[key]) faltantes.push(label);
  }
  return { checklist, faltantes };
}

async function getTransportistaPersonaFisica(id) {
  const { rows } = await pool.query(
    `SELECT id, nombre, whatsapp, telefono, tipo, estado
     FROM transportistas
     WHERE id=$1 AND tipo='persona_fisica' AND estado='activo'`,
    [id]
  );
  return rows[0] || null;
}

async function registrarMovimientoMaquina(client, { maquinaId, tipo, estadoAnterior, estadoNuevo, ubicacion, gestorId, tecnicoNombre, detalle, metadata, user }) {
  await client.query(
    `INSERT INTO maquina_movimientos (
       maquina_id, tipo, estado_anterior, estado_nuevo, ubicacion,
       gestor_id, tecnico_nombre, detalle, metadata, usuario_id, usuario_email
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)`,
    [
      maquinaId, tipo,
      estadoAnterior || null, estadoNuevo || null,
      ubicacion || null, gestorId || null, tecnicoNombre || null,
      detalle || null, JSON.stringify(metadata || {}),
      user?.id || null, user?.email || null,
    ]
  );
}

async function assertCanViewMachine(req, maquinaId, scope = 'máquinas') {
  const { isOpsRole, isOperadoraRole } = require('../../middleware/auth');
  if (req.user.rol === 'transportista' && !req.user.transportista_id) {
    const err = new Error(`Sin permisos para ${scope}`);
    err.status = 403;
    throw err;
  }
  if (!isOpsRole(req.user.rol) && !isOperadoraRole(req.user.rol) && req.user.rol !== 'transportista') {
    const err = new Error(`Sin permisos para ${scope}`);
    err.status = 403;
    throw err;
  }
  const { rows } = await pool.query('SELECT * FROM maquinas WHERE id=$1', [maquinaId]);
  if (!rows.length) {
    const err = new Error('Máquina no encontrada');
    err.status = 404;
    throw err;
  }
  const maquina = rows[0];
  if (req.user.rol === 'transportista') {
    const visible = parseInt(maquina.gestor_puesta_punto_id, 10) === parseInt(req.user.transportista_id, 10)
      && maquina.disponibilidad_visible_gestor;
    if (!visible) {
      const err = new Error('Máquina no asignada a este gestor');
      err.status = 403;
      throw err;
    }
  }
  if (isOperadoraRole(req.user.rol)) {
    if (!req.user.operadora_id) {
      const err = new Error(`Sin permisos para ${scope}`);
      err.status = 403;
      throw err;
    }
    const { rows: opRows } = await pool.query(
      `SELECT ciudad, direcciones_entrega FROM operadoras WHERE id=$1`,
      [req.user.operadora_id]
    );
    if (!maquinaVisibleParaLocalidades(maquina, localidadesOperadora(opRows[0]))) {
      const err = new Error('Máquina no disponible para tus localidades declaradas');
      err.status = 403;
      throw err;
    }
  }
  return maquina;
}

module.exports = {
  normalizarLocalidad, parseJsonArray, localidadesOperadora,
  localidadMaquina, maquinaVisibleParaLocalidades, isViajera,
  incidenciaBloqueaReservas, normalizarChecklistPuestaPunto,
  getTransportistaPersonaFisica, registrarMovimientoMaquina, assertCanViewMachine,
};
