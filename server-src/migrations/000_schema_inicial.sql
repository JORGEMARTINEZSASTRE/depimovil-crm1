-- ══════════════════════════════════════════════════════════════
-- DepiMóvil — Schema inicial completo
-- Ejecutar UNA SOLA VEZ en una base de datos vacía.
-- Incluye todas las tablas base + migración 001.
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- USUARIOS & AUTH
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id                        SERIAL PRIMARY KEY,
  nombre                    VARCHAR(200) NOT NULL,
  email                     VARCHAR(200) NOT NULL UNIQUE,
  password_hash             TEXT,
  rol                       VARCHAR(50)  NOT NULL DEFAULT 'operadora'
                            CHECK (rol IN ('superadmin','operaciones','comercial','operadora','transportista')),
  whatsapp                  VARCHAR(50),
  status                    VARCHAR(20)  NOT NULL DEFAULT 'activo'
                            CHECK (status IN ('activo','inactivo','suspendido')),
  operadora_id              INTEGER,
  transportista_id          INTEGER,
  registro_origen           VARCHAR(50)  DEFAULT 'admin',
  requiere_revision_admin   BOOLEAN      DEFAULT false,
  revision_admin_estado     VARCHAR(50)  DEFAULT 'no_requiere',
  revision_admin_obs        TEXT,
  ultimo_login              TIMESTAMP,
  ultimo_login_whatsapp     TIMESTAMP,
  created_at                TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sesiones_whatsapp (
  id            SERIAL PRIMARY KEY,
  whatsapp      VARCHAR(50)  NOT NULL,
  codigo_hash   TEXT         NOT NULL,
  intentos      INTEGER      NOT NULL DEFAULT 0,
  expira_en     TIMESTAMP    NOT NULL,
  usado         BOOLEAN      NOT NULL DEFAULT false,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- OPERADORAS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operadoras (
  id                SERIAL PRIMARY KEY,
  nombre            VARCHAR(200) NOT NULL,
  apellido          VARCHAR(200),
  gabinete          VARCHAR(200),
  ciudad            VARCHAR(100),
  departamento      VARCHAR(100),
  pais              VARCHAR(100) DEFAULT 'Uruguay',
  whatsapp          VARCHAR(50),
  telefono          VARCHAR(50),
  email             VARCHAR(200),
  fecha_alta        DATE,
  estado            VARCHAR(50)  NOT NULL DEFAULT 'prospecto'
                    CHECK (estado IN ('activa','prospecto','inactiva','suspendida')),
  nivel             VARCHAR(50)  DEFAULT 'Inicial',
  obs               TEXT,
  direccion_entrega TEXT,
  tipo_direccion    VARCHAR(20)  DEFAULT 'trabajo',
  portal_token      VARCHAR(100) UNIQUE,
  created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- FK diferida para evitar dependencia circular con usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS operadora_id_fk INTEGER REFERENCES operadoras(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS habilitaciones (
  id                   SERIAL PRIMARY KEY,
  operadora_id         INTEGER      NOT NULL REFERENCES operadoras(id) ON DELETE CASCADE,
  categoria            VARCHAR(100) NOT NULL,
  estado               VARCHAR(20)  NOT NULL DEFAULT 'activa'
                       CHECK (estado IN ('activa','suspendida','vencida')),
  fecha_habilitacion   DATE,
  fecha_vencimiento    DATE,
  obs                  TEXT,
  created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE (operadora_id, categoria)
);

CREATE TABLE IF NOT EXISTS documentos_operadora (
  id            SERIAL PRIMARY KEY,
  operadora_id  INTEGER     NOT NULL REFERENCES operadoras(id) ON DELETE CASCADE,
  tipo          VARCHAR(50) NOT NULL,
  archivo_url   TEXT,
  meta          JSONB,
  created_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_documentos_operadora_tipo
  ON documentos_operadora (operadora_id, tipo);

-- ─────────────────────────────────────────────
-- MÁQUINAS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maquinas (
  id          SERIAL PRIMARY KEY,
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  nombre      VARCHAR(200) NOT NULL,
  categoria   VARCHAR(100) DEFAULT 'Láser Depilación',
  ubicacion   VARCHAR(200),
  estado      VARCHAR(50)  NOT NULL DEFAULT 'disponible'
              CHECK (estado IN ('disponible','reservada','mantenimiento','fuera_servicio','en_viaje')),
  serial_num  VARCHAR(100),
  marca       VARCHAR(100),
  modelo      VARCHAR(100),
  dept_base   VARCHAR(100) DEFAULT 'Uruguay',
  ult_mant    DATE,
  prox_mant   DATE,
  obs         TEXT,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- RESERVAS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservas (
  id                          SERIAL PRIMARY KEY,
  codigo                      VARCHAR(50)   NOT NULL UNIQUE,
  operadora_id                INTEGER       REFERENCES operadoras(id) ON DELETE SET NULL,
  maquina_id                  INTEGER       REFERENCES maquinas(id) ON DELETE SET NULL,
  tipo                        VARCHAR(20)   NOT NULL DEFAULT 'jornada'
                              CHECK (tipo IN ('jornada','semanal','mensual')),
  estado                      VARCHAR(50)   NOT NULL DEFAULT 'solicitud_recibida'
                              CHECK (estado IN ('solicitud_recibida','pendiente_aprobacion','aprobada','confirmada','rechazada','cancelada','reprogramada')),
  fecha_jornada               DATE,
  fecha_inicio                DATE,
  fecha_fin                   DATE,
  dept_logistica              VARCHAR(100),
  bloque_logistico            BOOLEAN       DEFAULT false,
  monto                       NUMERIC(12,2) DEFAULT 0,
  moneda                      VARCHAR(10)   DEFAULT 'UYU',
  notas                       TEXT,
  recordatorio_24h_enviado    BOOLEAN       DEFAULT false,
  recordatorio_2h_enviado     BOOLEAN       DEFAULT false,
  created_at                  TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservas_recordatorios
  ON reservas (estado, recordatorio_24h_enviado, recordatorio_2h_enviado, fecha_inicio);

CREATE TABLE IF NOT EXISTS reserva_historial (
  id            SERIAL PRIMARY KEY,
  reserva_id    INTEGER      REFERENCES reservas(id) ON DELETE CASCADE,
  estado_previo VARCHAR(50),
  estado_nuevo  VARCHAR(50),
  motivo        TEXT,
  usuario_id    INTEGER,
  usuario_email VARCHAR(200),
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PAGOS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pagos (
  id               SERIAL PRIMARY KEY,
  codigo           VARCHAR(50)   NOT NULL,
  reserva_id       INTEGER       REFERENCES reservas(id) ON DELETE SET NULL,
  operadora_id     INTEGER       REFERENCES operadoras(id) ON DELETE SET NULL,
  tipo             VARCHAR(50)   DEFAULT 'jornada',
  estado           VARCHAR(50)   NOT NULL DEFAULT 'pendiente'
                   CHECK (estado IN ('pendiente','sena_pendiente','sena_abonada','validado','rechazado','deuda_vencida')),
  monto_total      NUMERIC(12,2) DEFAULT 0,
  moneda           VARCHAR(10)   DEFAULT 'UYU',
  sena_requerida   NUMERIC(12,2) DEFAULT 0,
  sena_abonada     NUMERIC(12,2) DEFAULT 0,
  saldo_pendiente  NUMERIC(12,2) DEFAULT 0,
  fecha_pago       DATE,
  comprobante      TEXT,
  obs              TEXT,
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- LEADS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(200) NOT NULL,
  apellido      VARCHAR(200),
  gabinete      VARCHAR(200),
  ciudad        VARCHAR(100),
  departamento  VARCHAR(100),
  pais          VARCHAR(100) DEFAULT 'Uruguay',
  telefono      VARCHAR(50),
  email         VARCHAR(200),
  canal         VARCHAR(50)  DEFAULT 'otro',
  estado        VARCHAR(50)  NOT NULL DEFAULT 'nuevo'
                CHECK (estado IN ('nuevo','contactado','interesado','presupuesto_enviado','seguimiento','ganado','perdido','reactivar_luego')),
  temperatura   VARCHAR(20)  DEFAULT 'frio',
  interes       TEXT,
  tecnologia    VARCHAR(200),
  obs           TEXT,
  prox_accion   TEXT,
  prox_fecha    DATE,
  operadora_id  INTEGER      REFERENCES operadoras(id) ON DELETE SET NULL,
  convertido_en  TIMESTAMP,
  convertido_por VARCHAR(200),
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads_notas (
  id            SERIAL PRIMARY KEY,
  lead_id       INTEGER      REFERENCES leads(id) ON DELETE CASCADE,
  tipo          VARCHAR(50)  DEFAULT 'otro',
  texto         TEXT         NOT NULL,
  resultado     TEXT,
  prox_accion   TEXT,
  prox_fecha    DATE,
  usuario_email VARCHAR(200),
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads_estado_historial (
  id            SERIAL PRIMARY KEY,
  lead_id       INTEGER      REFERENCES leads(id) ON DELETE CASCADE,
  estado_previo VARCHAR(50),
  estado_nuevo  VARCHAR(50),
  motivo        TEXT,
  usuario_email VARCHAR(200),
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ENVÍOS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS envios (
  id                   SERIAL PRIMARY KEY,
  codigo               VARCHAR(50)   NOT NULL,
  reserva_id           INTEGER       REFERENCES reservas(id) ON DELETE SET NULL,
  operadora_id         INTEGER       REFERENCES operadoras(id) ON DELETE SET NULL,
  maquina_id           INTEGER       REFERENCES maquinas(id) ON DELETE SET NULL,
  transportista_id     INTEGER,
  departamento         VARCHAR(100),
  direccion            TEXT,
  transportista        VARCHAR(200),
  tracking             VARCHAR(200),
  numero_rastreo       VARCHAR(200),
  rastreo_notificado   BOOLEAN       DEFAULT false,
  fecha_notificacion   TIMESTAMP,
  estado               VARCHAR(50)   NOT NULL DEFAULT 'pendiente_envio'
                       CHECK (estado IN ('pendiente_envio','preparando','en_transito','entregado','retiro_pendiente','retirado','cancelado')),
  tipo_envio           VARCHAR(50)   DEFAULT 'ida',
  tipo_maquina         VARCHAR(50)   DEFAULT 'chica',
  departamento_destino VARCHAR(100),
  fecha_salida         DATE,
  fecha_envio_est      DATE,
  fecha_envio_real     DATE,
  fecha_retiro_est     DATE,
  fecha_retiro_real    DATE,
  incluye_limpieza     BOOLEAN       DEFAULT false,
  costo_envio          NUMERIC(10,2) DEFAULT 0,
  costo_retiro         NUMERIC(10,2) DEFAULT 0,
  costo_limpieza       NUMERIC(10,2) DEFAULT 0,
  costo_total          NUMERIC(10,2) DEFAULT 0,
  moneda               VARCHAR(10)   DEFAULT 'UYU',
  observacion          TEXT,
  obs                  TEXT,
  tiene_rastreo        BOOLEAN       DEFAULT true,
  created_at           TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TRANSPORTISTAS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transportistas (
  id                     SERIAL PRIMARY KEY,
  tipo                   VARCHAR(50)   NOT NULL DEFAULT 'empresa'
                         CHECK (tipo IN ('empresa','persona_fisica')),
  nombre                 VARCHAR(200)  NOT NULL,
  telefono               VARCHAR(50),
  whatsapp               VARCHAR(50),
  direccion              TEXT,
  ciclo_pago             VARCHAR(20)   DEFAULT 'mensual',
  departamentos          TEXT[]        DEFAULT '{}',
  tarifa_envio_chica     NUMERIC(10,2) DEFAULT 0,
  tarifa_envio_grande    NUMERIC(10,2) DEFAULT 0,
  tarifa_limpieza_chica  NUMERIC(10,2) DEFAULT 0,
  tarifa_limpieza_grande NUMERIC(10,2) DEFAULT 0,
  sin_rastreo_siempre    BOOLEAN       DEFAULT false,
  estado                 VARCHAR(20)   DEFAULT 'activo',
  notas                  TEXT,
  created_at             TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transportistas_incidentes (
  id                SERIAL PRIMARY KEY,
  transportista_id  INTEGER REFERENCES transportistas(id) ON DELETE CASCADE,
  fecha             DATE    NOT NULL,
  descripcion       TEXT    NOT NULL,
  resuelto          BOOLEAN DEFAULT false,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transportistas_pagos (
  id                SERIAL PRIMARY KEY,
  transportista_id  INTEGER       REFERENCES transportistas(id) ON DELETE CASCADE,
  periodo_desde     DATE,
  periodo_hasta     DATE,
  total_envios      INTEGER       DEFAULT 0,
  total_limpiezas   INTEGER       DEFAULT 0,
  monto_envios      NUMERIC(10,2) DEFAULT 0,
  monto_limpiezas   NUMERIC(10,2) DEFAULT 0,
  monto_total       NUMERIC(10,2) DEFAULT 0,
  estado            VARCHAR(20)   DEFAULT 'pendiente',
  fecha_pago        DATE,
  notas             TEXT,
  created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CONTRATOS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos (
  id                  SERIAL PRIMARY KEY,
  operadora_id        INTEGER       REFERENCES operadoras(id) ON DELETE SET NULL,
  maquina_id          INTEGER       REFERENCES maquinas(id) ON DELETE SET NULL,
  reserva_id          INTEGER       REFERENCES reservas(id) ON DELETE SET NULL,
  nombre              VARCHAR(200),
  ci                  VARCHAR(50),
  domicilio           TEXT,
  ciudad              VARCHAR(100),
  maquina             VARCHAR(200),
  serial              VARCHAR(100),
  fecha_inicio        DATE,
  fecha_fin           DATE,
  monto               NUMERIC(12,2) DEFAULT 0,
  moneda              VARCHAR(10)   DEFAULT 'UYU',
  forma_pago          VARCHAR(100)  DEFAULT 'Transferencia bancaria',
  garantia            NUMERIC(12,2) DEFAULT 0,
  estado              VARCHAR(50)   NOT NULL DEFAULT 'activo'
                      CHECK (estado IN ('activo','pendiente','firmado','finalizado','anulado')),
  firmado_en          TIMESTAMP,
  cedula_frente_meta  JSONB,
  cedula_dorso_meta   JSONB,
  obs                 TEXT,
  contenido           TEXT,
  token               VARCHAR(100),
  created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- LOGÍSTICA
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reglas_logisticas (
  id            SERIAL PRIMARY KEY,
  departamento  VARCHAR(100) NOT NULL UNIQUE,
  activa        BOOLEAN      NOT NULL DEFAULT true,
  mismo_dia     BOOLEAN      NOT NULL DEFAULT false,
  dias_antes    INTEGER      NOT NULL DEFAULT 2,
  dias_despues  INTEGER      NOT NULL DEFAULT 2,
  obs           TEXT,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- FINANZAS (caja, proveedores, compras, ventas)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caja_cuentas (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  tipo        VARCHAR(50),
  activa      BOOLEAN DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caja_categorias (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  tipo        VARCHAR(20) CHECK (tipo IN ('ingreso','egreso','ambos')),
  activa      BOOLEAN DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proveedores (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(200) NOT NULL,
  contacto    VARCHAR(200),
  telefono    VARCHAR(50),
  email       VARCHAR(200),
  pais        VARCHAR(100) DEFAULT 'Uruguay',
  obs         TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compras (
  id              SERIAL PRIMARY KEY,
  codigo          VARCHAR(50),
  proveedor_id    INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
  maquina_id      INTEGER REFERENCES maquinas(id) ON DELETE SET NULL,
  concepto        TEXT,
  estado          VARCHAR(50) DEFAULT 'pendiente',
  moneda          VARCHAR(10) DEFAULT 'USD',
  monto_total     NUMERIC(12,2) DEFAULT 0,
  saldo           NUMERIC(12,2) DEFAULT 0,
  fecha_compra    DATE,
  fecha_llegada   DATE,
  obs             TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ventas_maquinas (
  id              SERIAL PRIMARY KEY,
  codigo          VARCHAR(50),
  maquina_id      INTEGER REFERENCES maquinas(id) ON DELETE SET NULL,
  comprador_nombre VARCHAR(200),
  comprador_doc   VARCHAR(100),
  monto_total     NUMERIC(12,2) DEFAULT 0,
  saldo           NUMERIC(12,2) DEFAULT 0,
  moneda          VARCHAR(10) DEFAULT 'UYU',
  fecha_venta     DATE,
  obs             TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caja_movimientos (
  id              SERIAL PRIMARY KEY,
  codigo          VARCHAR(50),
  tipo            VARCHAR(20) CHECK (tipo IN ('ingreso','egreso')),
  cuenta_id       INTEGER REFERENCES caja_cuentas(id) ON DELETE SET NULL,
  categoria_id    INTEGER REFERENCES caja_categorias(id) ON DELETE SET NULL,
  operadora_id    INTEGER REFERENCES operadoras(id) ON DELETE SET NULL,
  reserva_id      INTEGER REFERENCES reservas(id) ON DELETE SET NULL,
  maquina_id      INTEGER REFERENCES maquinas(id) ON DELETE SET NULL,
  proveedor_id    INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
  compra_id       INTEGER REFERENCES compras(id) ON DELETE SET NULL,
  venta_id        INTEGER REFERENCES ventas_maquinas(id) ON DELETE SET NULL,
  concepto        TEXT,
  monto           NUMERIC(12,2) DEFAULT 0,
  moneda          VARCHAR(10) DEFAULT 'UYU',
  fecha           DATE,
  confirmado      BOOLEAN DEFAULT false,
  confirmado_por  VARCHAR(200),
  confirmado_en   TIMESTAMP,
  obs             TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caja_cierres (
  id              SERIAL PRIMARY KEY,
  codigo          VARCHAR(50),
  cuenta_id       INTEGER REFERENCES caja_cuentas(id) ON DELETE SET NULL,
  fecha_desde     DATE,
  fecha_hasta     DATE,
  saldo_inicial   NUMERIC(12,2) DEFAULT 0,
  total_ingresos  NUMERIC(12,2) DEFAULT 0,
  total_egresos   NUMERIC(12,2) DEFAULT 0,
  saldo_final     NUMERIC(12,2) DEFAULT 0,
  obs             TEXT,
  usuario_email   VARCHAR(200),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- AUDITORÍA Y CONFIG
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id            SERIAL PRIMARY KEY,
  usuario_id    INTEGER,
  usuario_email VARCHAR(200),
  accion        VARCHAR(100) NOT NULL,
  entidad       VARCHAR(100),
  entidad_id    INTEGER,
  detalle       TEXT,
  ip            VARCHAR(50),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracion (
  id      SERIAL PRIMARY KEY,
  clave   VARCHAR(100) NOT NULL UNIQUE,
  valor   TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- WHATSAPP QUEUE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wa_queue (
  id           SERIAL       PRIMARY KEY,
  reserva_id   INTEGER      REFERENCES reservas(id)   ON DELETE SET NULL,
  operadora_id INTEGER      REFERENCES operadoras(id) ON DELETE SET NULL,
  tipo         VARCHAR(50)  NOT NULL,
  mensaje      TEXT         NOT NULL,
  telefono     VARCHAR(30)  NOT NULL,
  enviado      BOOLEAN      NOT NULL DEFAULT false,
  creado_en    TIMESTAMP    NOT NULL DEFAULT NOW(),
  enviado_en   TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wa_queue_pendientes
  ON wa_queue (enviado, creado_en)
  WHERE enviado = false;

-- ─────────────────────────────────────────────
-- USUARIO SUPERADMIN INICIAL
-- Contraseña: depimovil2026 (cambiarla después del primer login)
-- Hash bcrypt de 'depimovil2026'
-- ─────────────────────────────────────────────
INSERT INTO usuarios (nombre, email, password_hash, rol, status)
VALUES (
  'Admin DepiMóvil',
  'admin@depimovil.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniW9FG5FbH8w.L3qxZEP0x6Ci',
  'superadmin',
  'activo'
) ON CONFLICT (email) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- FIN DEL SCHEMA INICIAL
-- ══════════════════════════════════════════════════════════════
