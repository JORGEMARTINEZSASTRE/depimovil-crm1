const pool = require('./db');

const DEFAULT_RULES = [
  {
    key: 'operator.created.followup',
    event: 'operator.created',
    description: 'Crear seguimiento comercial y mensaje de bienvenida para una operadora nueva',
    active: true,
  },
  {
    key: 'booking.created.deposit_control',
    event: 'booking.created',
    description: 'Crear control interno de seña y alerta operativa cuando se crea una reserva',
    active: true,
  },
  {
    key: 'booking.confirmed.logistics',
    event: 'booking.confirmed',
    description: 'Crear seguimiento de logística cuando una reserva queda confirmada',
    active: true,
  },
  {
    key: 'payment.completed.reserve_confirm',
    event: 'payment.completed',
    description: 'Registrar seguimiento administrativo cuando una seña o pago queda validado',
    active: true,
  },
  {
    key: 'machine.shipped.operator_notice',
    event: 'machine.shipped',
    description: 'Preparar aviso de envío y tarea de confirmación de recepción',
    active: true,
  },
  {
    key: 'machine.received.safe_use',
    event: 'machine.received',
    description: 'Preparar instrucciones de uso y recordatorio de devolución',
    active: true,
  },
  {
    key: 'machine.returned.aftercare',
    event: 'machine.returned',
    description: 'Crear encuesta posterior y recomendación de próxima reserva',
    active: true,
  },
  {
    key: 'operator.inactive.recovery',
    event: 'operator.inactive.detected',
    description: 'Crear tarea comercial para recuperar operadoras inactivas',
    active: true,
  },
];

async function ensureAutomationTables(client = pool) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS automation_rules (
      id SERIAL PRIMARY KEY,
      key VARCHAR(120) UNIQUE NOT NULL,
      event VARCHAR(120) NOT NULL,
      description TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      config JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS automation_events (
      id SERIAL PRIMARY KEY,
      event VARCHAR(120) NOT NULL,
      entity VARCHAR(80),
      entity_id INTEGER,
      dedupe_key VARCHAR(180) UNIQUE,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      status VARCHAR(40) NOT NULL DEFAULT 'processed',
      error TEXT,
      created_by INTEGER,
      created_by_email VARCHAR(150),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS automation_runs (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES automation_events(id) ON DELETE CASCADE,
      rule_key VARCHAR(120) NOT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'pending',
      action VARCHAR(80),
      dedupe_key VARCHAR(220) UNIQUE,
      error TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS automation_tasks (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES automation_events(id) ON DELETE SET NULL,
      rule_key VARCHAR(120),
      area VARCHAR(50) NOT NULL,
      title TEXT NOT NULL,
      detail TEXT,
      entity VARCHAR(80),
      entity_id INTEGER,
      responsible_role VARCHAR(50),
      status VARCHAR(40) NOT NULL DEFAULT 'pendiente',
      due_at TIMESTAMPTZ,
      dedupe_key VARCHAR(220) UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_automation_events_created_at ON automation_events (created_at DESC)
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_automation_tasks_status_due ON automation_tasks (status, due_at)
  `);

  for (const rule of DEFAULT_RULES) {
    await client.query(`
      INSERT INTO automation_rules (key, event, description, active, config)
      VALUES ($1,$2,$3,$4,'{}'::jsonb)
      ON CONFLICT (key) DO UPDATE SET
        event=EXCLUDED.event,
        description=EXCLUDED.description,
        updated_at=NOW()
    `, [rule.key, rule.event, rule.description, rule.active]);
  }
}

ensureAutomationTables().catch(err => {
  console.error('Error preparando automatizaciones:', err.message);
});

function cleanText(value) {
  return String(value || '').trim();
}

function dedupePart(value) {
  return cleanText(value).replace(/\s+/g, '_').slice(0, 80);
}

function firstDate(...values) {
  return values.find(Boolean) || null;
}

function addDays(dateValue, days) {
  if (!dateValue) return null;
  const base = String(dateValue).split('T')[0];
  const d = new Date(`${base}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

async function insertTask(client, eventRow, ruleKey, task) {
  const dedupeKey = task.dedupeKey || `${ruleKey}:task:${task.entity || eventRow.entity}:${task.entityId || eventRow.entity_id}:${dedupePart(task.title)}`;
  const { rows } = await client.query(`
    INSERT INTO automation_tasks (
      event_id, rule_key, area, title, detail, entity, entity_id,
      responsible_role, due_at, dedupe_key
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (dedupe_key) DO UPDATE SET
      detail=EXCLUDED.detail,
      status=CASE WHEN automation_tasks.status='resuelta' THEN automation_tasks.status ELSE 'pendiente' END,
      updated_at=NOW()
    RETURNING *
  `, [
    eventRow.id,
    ruleKey,
    task.area,
    task.title,
    task.detail || null,
    task.entity || eventRow.entity,
    task.entityId || eventRow.entity_id,
    task.responsibleRole || null,
    task.dueAt || null,
    dedupeKey,
  ]);
  return rows[0];
}

async function queueWhatsapp(client, eventRow, ruleKey, msg) {
  if (!msg.telefono || !msg.mensaje) return null;
  const dedupeKey = msg.dedupeKey || `${ruleKey}:wa:${msg.operadoraId || eventRow.entity_id}:${msg.tipo}`;
  const exists = await client.query(
    `SELECT id FROM automation_runs WHERE dedupe_key=$1 AND status IN ('done','pending') LIMIT 1`,
    [dedupeKey]
  );
  if (exists.rows.length) return exists.rows[0];

  await client.query(`
    INSERT INTO wa_queue (reserva_id, operadora_id, tipo, mensaje, telefono)
    VALUES ($1,$2,$3,$4,$5)
  `, [
    msg.reservaId || null,
    msg.operadoraId || null,
    msg.tipo,
    msg.mensaje,
    msg.telefono,
  ]);

  const { rows } = await client.query(`
    INSERT INTO automation_runs (event_id, rule_key, status, action, dedupe_key, attempts)
    VALUES ($1,$2,'done','wa_queue',$3,1)
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING *
  `, [eventRow.id, ruleKey, dedupeKey]);
  return rows[0] || null;
}

async function audit(client, eventRow, ruleKey, detail) {
  await client.query(`
    INSERT INTO audit_log (accion, entidad, entidad_id, detalle, usuario_id)
    VALUES ($1,$2,$3,$4,$5)
  `, [
    'AUTOMATION',
    eventRow.entity || 'automation',
    eventRow.entity_id || null,
    `[${ruleKey}] ${detail}`,
    eventRow.created_by || null,
  ]);
}

async function getReservaContext(client, reservaId) {
  const { rows } = await client.query(`
    SELECT r.*, o.nombre AS op_nombre, o.apellido AS op_apellido, o.whatsapp AS op_whatsapp,
           m.nombre AS maquina_nombre, m.codigo AS maquina_codigo
    FROM reservas r
    LEFT JOIN operadoras o ON o.id = r.operadora_id
    LEFT JOIN maquinas m ON m.id = r.maquina_id
    WHERE r.id=$1
  `, [reservaId]);
  return rows[0] || null;
}

async function getEnvioContext(client, envioId) {
  const { rows } = await client.query(`
    SELECT e.*, o.nombre AS op_nombre, o.apellido AS op_apellido, o.whatsapp AS op_whatsapp,
           r.codigo AS reserva_codigo, r.fecha_jornada, r.fecha_inicio, r.fecha_fin,
           m.nombre AS maquina_nombre, m.codigo AS maquina_codigo
    FROM envios e
    LEFT JOIN operadoras o ON o.id = e.operadora_id
    LEFT JOIN reservas r ON r.id = e.reserva_id
    LEFT JOIN maquinas m ON m.id = e.maquina_id
    WHERE e.id=$1
  `, [envioId]);
  return rows[0] || null;
}

async function runRule(client, eventRow, rule) {
  const payload = eventRow.payload || {};
  const ruleKey = rule.key;

  if (ruleKey === 'operator.created.followup') {
    const op = payload.operadora || payload;
    await insertTask(client, eventRow, ruleKey, {
      area: 'comercial',
      title: `Seguimiento alta operadora: ${cleanText(`${op.nombre || ''} ${op.apellido || ''}`) || `#${eventRow.entity_id}`}`,
      detail: `Confirmar datos, ciudad/departamento, centro estético, capacitación y fuente de captación. Estado inicial: ${op.estado || 'prospecto'}.`,
      responsibleRole: 'comercial',
      dueAt: addDays(new Date().toISOString(), 1),
      dedupeKey: `${ruleKey}:task:operadora:${eventRow.entity_id}`,
    });
    if (op.whatsapp) {
      await queueWhatsapp(client, eventRow, ruleKey, {
        operadoraId: eventRow.entity_id,
        telefono: op.whatsapp,
        tipo: 'bienvenida_operadora',
        mensaje: `Hola ${op.nombre || ''}, bienvenida a DepiMóvil. Recibimos tus datos y el equipo va a revisar tu perfil, documentación, capacitación y equipos habilitados. Te vamos a acompañar paso a paso.`,
        dedupeKey: `${ruleKey}:wa:operadora:${eventRow.entity_id}`,
      });
    }
    await audit(client, eventRow, ruleKey, 'Seguimiento de nueva operadora creado');
    return;
  }

  if (ruleKey === 'booking.created.deposit_control') {
    const r = await getReservaContext(client, eventRow.entity_id);
    if (!r) return;
    await insertTask(client, eventRow, ruleKey, {
      area: 'administracion',
      title: `Controlar seña reserva ${r.codigo}`,
      detail: `Operadora: ${cleanText(`${r.op_nombre || ''} ${r.op_apellido || ''}`)}. Máquina: ${r.maquina_nombre || '—'}. Monto: ${r.monto || 0} ${r.moneda || 'UYU'}.`,
      responsibleRole: 'administrador',
      dueAt: addDays(firstDate(r.fecha_jornada, r.fecha_inicio, new Date().toISOString()), -1),
      dedupeKey: `${ruleKey}:task:reserva:${r.id}`,
    });
    await audit(client, eventRow, ruleKey, `Control de seña creado para ${r.codigo}`);
    return;
  }

  if (ruleKey === 'booking.confirmed.logistics') {
    const r = await getReservaContext(client, eventRow.entity_id);
    if (!r) return;
    await insertTask(client, eventRow, ruleKey, {
      area: 'logistica',
      title: `Coordinar envío reserva ${r.codigo}`,
      detail: `Preparar ${r.maquina_nombre || 'máquina'} para ${r.op_nombre || 'operadora'} en ${r.dept_logistica || 'departamento pendiente'}.`,
      responsibleRole: 'operaciones',
      dueAt: addDays(firstDate(r.fecha_jornada, r.fecha_inicio, new Date().toISOString()), -2),
      dedupeKey: `${ruleKey}:task:reserva:${r.id}`,
    });
    await audit(client, eventRow, ruleKey, `Seguimiento logístico creado para ${r.codigo}`);
    return;
  }

  if (ruleKey === 'payment.completed.reserve_confirm') {
    const pago = payload.pago || payload;
    await insertTask(client, eventRow, ruleKey, {
      area: 'administracion',
      title: `Pago validado ${pago.codigo || `#${eventRow.entity_id}`}`,
      detail: `Revisar saldo pendiente y comprobante. Reserva asociada: ${pago.reserva_id || '—'}.`,
      entity: 'pago',
      entityId: eventRow.entity_id,
      responsibleRole: 'administrador',
      dedupeKey: `${ruleKey}:task:pago:${eventRow.entity_id}`,
    });
    await audit(client, eventRow, ruleKey, 'Seguimiento administrativo de pago creado');
    return;
  }

  if (ruleKey === 'machine.shipped.operator_notice') {
    const e = await getEnvioContext(client, eventRow.entity_id);
    if (!e) return;
    await insertTask(client, eventRow, ruleKey, {
      area: 'logistica',
      title: `Confirmar recepción envío ${e.codigo}`,
      detail: `Tracking: ${e.tracking || e.numero_rastreo || 'sin rastreo'}. Operadora: ${e.op_nombre || '—'}.`,
      responsibleRole: 'operaciones',
      dueAt: addDays(e.fecha_envio_real || new Date().toISOString(), 1),
      dedupeKey: `${ruleKey}:task:envio:${e.id}`,
    });
    await queueWhatsapp(client, eventRow, ruleKey, {
      reservaId: e.reserva_id,
      operadoraId: e.operadora_id,
      telefono: e.op_whatsapp,
      tipo: 'envio_en_transito',
      mensaje: `Hola ${e.op_nombre || ''}, tu equipo ${e.maquina_nombre || ''} ya está en camino.${e.tracking || e.numero_rastreo ? `\nRastreo: ${e.tracking || e.numero_rastreo}` : ''}\nAvisanos cuando lo recibas para activar el checklist de uso seguro.`,
      dedupeKey: `${ruleKey}:wa:envio:${e.id}`,
    });
    await audit(client, eventRow, ruleKey, `Aviso de envío preparado para ${e.codigo}`);
    return;
  }

  if (ruleKey === 'machine.received.safe_use') {
    const e = await getEnvioContext(client, eventRow.entity_id);
    if (!e) return;
    await insertTask(client, eventRow, ruleKey, {
      area: 'logistica',
      title: `Programar devolución/retiro ${e.codigo}`,
      detail: `Fecha estimada de retiro: ${e.fecha_retiro_est || 'pendiente'}. Confirmar estado y accesorios al finalizar.`,
      responsibleRole: 'operaciones',
      dueAt: e.fecha_retiro_est ? addDays(e.fecha_retiro_est, -1) : null,
      dedupeKey: `${ruleKey}:task:envio:${e.id}`,
    });
    await queueWhatsapp(client, eventRow, ruleKey, {
      reservaId: e.reserva_id,
      operadoraId: e.operadora_id,
      telefono: e.op_whatsapp,
      tipo: 'equipo_recibido_instrucciones',
      mensaje: `Hola ${e.op_nombre || ''}, confirmamos la recepción del equipo ${e.maquina_nombre || ''}. Antes de usarlo revisá accesorios, estado general, higiene y parámetros de seguridad. Si ves algo raro, avisá antes de iniciar la jornada.`,
      dedupeKey: `${ruleKey}:wa:envio:${e.id}`,
    });
    await audit(client, eventRow, ruleKey, `Checklist de uso y devolución preparado para ${e.codigo}`);
    return;
  }

  if (ruleKey === 'machine.returned.aftercare') {
    const e = await getEnvioContext(client, eventRow.entity_id);
    if (!e) return;
    await insertTask(client, eventRow, ruleKey, {
      area: 'comercial',
      title: `Encuesta y próxima reserva ${e.codigo}`,
      detail: `Consultar experiencia, incidencias y sugerir próxima fecha para ${e.maquina_nombre || 'el equipo'}.`,
      responsibleRole: 'comercial',
      dueAt: addDays(new Date().toISOString(), 1),
      dedupeKey: `${ruleKey}:task:envio:${e.id}`,
    });
    await queueWhatsapp(client, eventRow, ruleKey, {
      reservaId: e.reserva_id,
      operadoraId: e.operadora_id,
      telefono: e.op_whatsapp,
      tipo: 'encuesta_post_jornada',
      mensaje: `Hola ${e.op_nombre || ''}, gracias por trabajar con DepiMóvil. ¿Cómo fue la jornada con ${e.maquina_nombre || 'el equipo'}? Contanos si hubo incidencias y si querés que reservemos una próxima fecha.`,
      dedupeKey: `${ruleKey}:wa:envio:${e.id}`,
    });
    await audit(client, eventRow, ruleKey, `Encuesta posterior preparada para ${e.codigo}`);
    return;
  }

  if (ruleKey === 'operator.inactive.recovery') {
    const op = payload.operadora || payload;
    await insertTask(client, eventRow, ruleKey, {
      area: 'comercial',
      title: `Recuperar operadora inactiva: ${cleanText(`${op.nombre || ''} ${op.apellido || ''}`) || `#${eventRow.entity_id}`}`,
      detail: `Última actividad: ${op.ultima_actividad || 'sin datos'}. Sugerir equipo usado o promoción por ciudad.`,
      responsibleRole: 'comercial',
      dueAt: addDays(new Date().toISOString(), 2),
      dedupeKey: `${ruleKey}:task:operadora:${eventRow.entity_id}`,
    });
    await audit(client, eventRow, ruleKey, 'Tarea de recuperación comercial creada');
  }
}

async function emitAutomationEvent(clientOrNull, event) {
  const client = clientOrNull || pool;
  await ensureAutomationTables(client);
  const dedupeKey = event.dedupeKey || `${event.event}:${event.entity || 'entity'}:${event.entityId || '0'}:${dedupePart(event.change || '')}`;
  const { rows: eventRows } = await client.query(`
    INSERT INTO automation_events (event, entity, entity_id, dedupe_key, payload, created_by, created_by_email)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (dedupe_key) DO UPDATE SET payload=EXCLUDED.payload
    RETURNING *
  `, [
    event.event,
    event.entity || null,
    event.entityId || null,
    dedupeKey,
    JSON.stringify(event.payload || {}),
    event.user?.id || null,
    event.user?.email || null,
  ]);
  const eventRow = eventRows[0];

  const { rows: rules } = await client.query(
    'SELECT * FROM automation_rules WHERE event=$1 AND active=true ORDER BY id',
    [event.event]
  );

  for (const rule of rules) {
    const runKey = `${eventRow.dedupe_key}:${rule.key}`;
    const existing = await client.query(
      `SELECT id, status FROM automation_runs WHERE dedupe_key=$1 AND status='done' LIMIT 1`,
      [runKey]
    );
    if (existing.rows.length) continue;

    const { rows: runRows } = await client.query(`
      INSERT INTO automation_runs (event_id, rule_key, status, action, dedupe_key, attempts)
      VALUES ($1,$2,'running','rule',$3,1)
      ON CONFLICT (dedupe_key) DO UPDATE SET status='running', attempts=automation_runs.attempts+1, updated_at=NOW()
      RETURNING *
    `, [eventRow.id, rule.key, runKey]);

    try {
      await runRule(client, eventRow, rule);
      await client.query(
        `UPDATE automation_runs SET status='done', error=NULL, updated_at=NOW() WHERE id=$1`,
        [runRows[0].id]
      );
    } catch (err) {
      await client.query(
        `UPDATE automation_runs SET status='error', error=$2, updated_at=NOW() WHERE id=$1`,
        [runRows[0].id, err.message]
      );
      console.error(`Automation ${rule.key} error:`, err.message);
    }
  }

  return eventRow;
}

async function detectInactiveOperators(client = pool, days = 45, user = null) {
  await ensureAutomationTables(client);
  const { rows } = await client.query(`
    SELECT o.id, o.nombre, o.apellido, o.ciudad, o.departamento, o.whatsapp,
           GREATEST(
             COALESCE((SELECT MAX(r.updated_at) FROM reservas r WHERE r.operadora_id=o.id), 'epoch'::timestamp),
             COALESCE((SELECT MAX(p.updated_at) FROM pagos p WHERE p.operadora_id=o.id), 'epoch'::timestamp),
             COALESCE((SELECT MAX(e.updated_at) FROM envios e WHERE e.operadora_id=o.id), 'epoch'::timestamp),
             COALESCE(o.fecha_alta::timestamp, 'epoch'::timestamp)
           ) AS ultima_actividad
    FROM operadoras o
    WHERE COALESCE(o.estado, '') IN ('activa','prospecto','interesada')
  `);
  const cutoff = Date.now() - Number(days || 45) * 24 * 60 * 60 * 1000;
  const emitted = [];
  for (const op of rows) {
    const last = op.ultima_actividad ? new Date(op.ultima_actividad).getTime() : 0;
    if (last && last > cutoff) continue;
    emitted.push(await emitAutomationEvent(client, {
      event: 'operator.inactive.detected',
      entity: 'operadora',
      entityId: op.id,
      dedupeKey: `operator.inactive.detected:operadora:${op.id}:${days}d`,
      payload: { operadora: op, days },
      user,
    }));
  }
  return emitted;
}

module.exports = {
  ensureAutomationTables,
  emitAutomationEvent,
  detectInactiveOperators,
};
