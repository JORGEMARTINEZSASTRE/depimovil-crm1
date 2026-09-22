const pool = require('./db');

async function ensureAuthTables() {
  // La base de producción es anterior al código: se agregan (sin tocar datos) las columnas que el sistema usa y faltan.
  // Sin esto no se podían crear envíos, guardar reglas logísticas ni registrar pagos.
  const columnasFaltantes = [
    'ALTER TABLE envios ADD COLUMN IF NOT EXISTS departamento_destino VARCHAR(100)',
    'ALTER TABLE envios ADD COLUMN IF NOT EXISTS observacion TEXT',
    'ALTER TABLE envios ADD COLUMN IF NOT EXISTS pago_id INTEGER',
    // Ciudad asignada a una coordinadora: acota qué operadoras y máquinas ve (ej. Paula = Salto)
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ciudad_base VARCHAR(60)',
    'ALTER TABLE reglas_logisticas ADD COLUMN IF NOT EXISTS obs TEXT',
    'ALTER TABLE pagos ADD COLUMN IF NOT EXISTS codigo VARCHAR(50)',
    "ALTER TABLE pagos ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'jornada'",
    'ALTER TABLE pagos ADD COLUMN IF NOT EXISTS sena_requerida NUMERIC(12,2) DEFAULT 0',
    'ALTER TABLE pagos ADD COLUMN IF NOT EXISTS sena_abonada NUMERIC(12,2) DEFAULT 0',
    'ALTER TABLE pagos ADD COLUMN IF NOT EXISTS fecha_pago DATE',
    'ALTER TABLE reglas_logisticas ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()',
    'ALTER TABLE reglas_logisticas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()',
    // costo_total era una columna calculada (costo_envio + costo_limpieza) y la base rechaza que el sistema la escriba
    'ALTER TABLE envios ALTER COLUMN costo_total DROP EXPRESSION IF EXISTS',
    // La base aceptaba solo estados de envío antiguos; se aceptan también los que usa el sistema y la pantalla
    'ALTER TABLE envios DROP CONSTRAINT IF EXISTS envios_estado_check',
    "ALTER TABLE envios ADD CONSTRAINT envios_estado_check CHECK (estado IN ('pendiente','pendiente_envio','preparando','en_camino','en_transito','entregado','retiro_pendiente','retiro_en_camino','retirado','retornado','incidencia','cancelado'))",
  ];
  for (const sql of columnasFaltantes) {
    try { await pool.query(sql); }
    catch (err) { console.warn('[schema] no se pudo aplicar:', sql, '-', err.message); }
  }

  // Permitir el rol 'coordinadora' en usuarios (idempotente; ver migrations/015)
  try {
    await pool.query('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check');
    await pool.query(`
      ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN (
        'superadmin','administrador','operaciones','coordinadora','comercial',
        'operadora','operadora_habilitada','operadora_limitada','transportista'
      ))
    `);
  } catch (err) {
    console.warn('[auth] No se pudo actualizar usuarios_rol_check:', err.message);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sesiones_whatsapp (
      id SERIAL PRIMARY KEY,
      whatsapp VARCHAR(30) NOT NULL,
      codigo_hash TEXT NOT NULL,
      rol_solicitado VARCHAR(50) NOT NULL DEFAULT 'operadora',
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      attempts INTEGER NOT NULL DEFAULT 0,
      ip VARCHAR(80),
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_sesiones_whatsapp_lookup ON sesiones_whatsapp (whatsapp, rol_solicitado, used_at, expires_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_sesiones_whatsapp_recent ON sesiones_whatsapp (whatsapp, created_at DESC) WHERE used_at IS NULL');

  const cleanup = await pool.query(`
    DELETE FROM wa_queue
    WHERE enviado = false
      AND tipo IN ('codigo_login', 'codigo_login_operadora')
      AND creado_en < NOW() - INTERVAL '10 minutes'
  `).catch(err => {
    console.warn('No se pudo limpiar cola WhatsApp vencida:', err.message);
    return { rowCount: 0 };
  });

  if (cleanup.rowCount) {
    console.log(`[auth] Codigos WhatsApp vencidos limpiados de cola: ${cleanup.rowCount}`);
  }
}

module.exports = ensureAuthTables;
