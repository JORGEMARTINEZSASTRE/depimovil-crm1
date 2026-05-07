/**
 * DepiMóvil — Pool de conexiones PostgreSQL
 * Usado por todas las rutas y módulos del servidor.
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ Pool PostgreSQL error:', err.message);
});

module.exports = pool;
