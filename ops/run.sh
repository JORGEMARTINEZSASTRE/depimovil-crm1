# leer archivos de produccion para el parche de roles
echo ===USUARIOS_JS===; cat /app3/assets/js/modules/usuarios.js
echo ===INDEX_USUARIOS===; grep -n "usuariosTableBody\|modules/usuarios.js\|<th>Rol</th>" /app3/index.html
echo ===PERMISOS_JS_HEAD===; head -8 /opt/depimovil-api/src/routes/permisos.js
echo ===PERMISOS_JS_TAIL===; tail -30 /opt/depimovil-api/src/routes/permisos.js
echo ===MW_EXPORTS===; grep -n "module.exports\|function requireRole\|isAdminRole" /opt/depimovil-api/src/middleware/auth.js
echo ===SERVER_PERMISOS===; grep -n "permisos" /opt/depimovil-api/src/server.js
echo ===ROLE_LABELS===; grep -n -A12 "const ROLE_LABELS" /app3/assets/js/core/helpers.js
echo ===CURRENTUSER===; grep -n "currentUser *=" /app3/assets/js/core/auth.js | head -5
echo ===USR_ROLES_CHECK===; sudo -u postgres psql depimovil_crm -tAc "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='usuarios_rol_check'"
echo ===AUDIT===; sudo -u postgres psql depimovil_crm -tAc "\d audit_log" | head -12
