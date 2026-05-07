/**
 * DepiMóvil — WhatsApp Session Store (in-memory)
 *
 * Almacena el estado de la conversacion por numero de telefono.
 * Las sesiones expiran automaticamente despues de 30 minutos de inactividad.
 *
 * Estructura de sesion:
 * {
 *   step: 'fecha' | 'equipo' | 'confirmar',
 *   operadoraId: number,
 *   fecha?: string,          // YYYY-MM-DD
 *   equipos?: Array,
 *   equipoSeleccionado?: Object,
 *   updatedAt: number        // timestamp ms
 * }
 */

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutos

/** @type {Map<string, {data: Object, timer: NodeJS.Timeout}>} */
const store = new Map();

/**
 * Obtiene la sesion activa de un numero. Devuelve null si no existe o expiró.
 * @param {string} phone
 * @returns {Object|null}
 */
function getSession(phone) {
  const entry = store.get(phone);
  if (!entry) return null;

  // Verificar TTL manual (por si acaso el timer no corrió)
  if (Date.now() - entry.data.updatedAt > SESSION_TTL_MS) {
    clearSession(phone);
    return null;
  }

  return entry.data;
}

/**
 * Guarda o actualiza la sesion de un numero.
 * Reinicia el timer de expiración.
 * @param {string} phone
 * @param {Object} data
 */
function setSession(phone, data) {
  // Cancelar timer anterior si existe
  const prev = store.get(phone);
  if (prev?.timer) clearTimeout(prev.timer);

  const sessionData = { ...data, updatedAt: Date.now() };

  const timer = setTimeout(() => {
    store.delete(phone);
    console.log(`🕐 Sesión WA expirada: ${phone}`);
  }, SESSION_TTL_MS);

  // Evitar que el timer bloquee el proceso al cerrar
  if (timer.unref) timer.unref();

  store.set(phone, { data: sessionData, timer });
}

/**
 * Elimina la sesion de un numero.
 * @param {string} phone
 */
function clearSession(phone) {
  const entry = store.get(phone);
  if (entry?.timer) clearTimeout(entry.timer);
  store.delete(phone);
}

/**
 * Devuelve la cantidad de sesiones activas (útil para debug).
 * @returns {number}
 */
function sessionCount() {
  return store.size;
}

module.exports = { getSession, setSession, clearSession, sessionCount };
