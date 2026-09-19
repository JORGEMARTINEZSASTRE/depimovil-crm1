const pool = require('./db');

async function ensureAuthTables() {
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
