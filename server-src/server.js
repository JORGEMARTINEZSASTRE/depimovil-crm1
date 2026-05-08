/**
 * DepiMóvil API — Servidor principal
 * 
 * Ejecutar:
 *   npm start        (producción)
 *   npm run dev      (desarrollo con auto-reload)
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1); // Trust Nginx proxy
const PORT = process.env.PORT || 3004;

// ══════════════════════════════════
// SEGURIDAD
// ══════════════════════════════════
app.use(helmet({
  // El CRM usa onclick="..." y scripts inline — CSP estricto los bloquea
  contentSecurityPolicy: false,
  // Permite cargar el CRM en iframes del mismo origen (portal)
  crossOriginEmbedderPolicy: false,
}));

// CORS — permitir CRM admin y portal de operadoras
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // Permitir requests sin origin (apps móviles, curl, etc.)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // En desarrollo, permitir localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) return cb(null, true);
    cb(new Error('Bloqueado por CORS'));
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // máximo 200 requests por IP
  message: { error: 'Demasiadas solicitudes, intentá en unos minutos' },
});
app.use('/api/', limiter);

// Rate limit más estricto para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login' },
});
app.use('/api/auth/login', loginLimiter);

// Body parsing
app.use(express.json({ limit: '5mb' }));

// Archivos estáticos — frontend CRM (index.html, assets/, portal.html)
const path = require('path');
const ROOT = path.join(__dirname, '..');
app.use(express.static(ROOT, {
  index: false, // no servir index.html automáticamente para que /api/* funcione primero
}));
app.use('/uploads', express.static(path.join(ROOT, 'uploads')));

// ══════════════════════════════════
// RUTAS
// ══════════════════════════════════
app.use('/api/auth', require('./routes/auth'));
app.use('/api/operadoras', require('./routes/operadoras'));
app.use('/api/portal', require('./routes/portal'));
app.use('/api/maquinas', require('./routes/maquinas'));
app.use('/api/reservas', require('./routes/reservas'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/finanzas', require('./routes/finanzas'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/envios', require('./routes/envios'));
app.use('/api/transportistas', require('./routes/transportistas'));
app.use('/api/webhook/whatsapp', require('./routes/whatsapp'));
app.use('/api/contratos', require('./routes/contratos'));
app.use('/api/permisos', require('./routes/permisos'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'depimovil-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 para rutas API no encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// ── Frontend SPA ─────────────────────────────────────────────
// Favicon — evita 404 en consola del browser
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Portal de operadoras
app.get('/portal.html', (req, res) => {
  res.sendFile(path.join(ROOT, 'portal.html'));
});

// CRM admin — cualquier ruta no-API devuelve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ══════════════════════════════════
// INICIO
// ══════════════════════════════════
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   DepiMóvil API v1.0                  ║
  ║   Puerto: ${PORT}                         ║
  ║   Entorno: ${process.env.NODE_ENV || 'development'}             ║
  ╚═══════════════════════════════════════╝
  `);

  // Iniciar tabla de cola WA y cron de recordatorios
  try {
    const { ensureTable } = require('./utils/wa_queue');
    await ensureTable();
    console.log('✅ Tabla wa_queue lista');
  } catch (err) {
    console.error('⚠️ wa_queue:', err.message);
  }

  try {
    const { iniciarRecordatorios } = require('./recordatorios');
    iniciarRecordatorios();
  } catch (err) {
    console.error('⚠️ Recordatorios:', err.message);
  }
});

module.exports = app;
