# leer: modal usuario, estilos de acciones, FKs y status
echo ===MODAL===; grep -n -A34 'id="modalUsuario"' /app3/partials/modals.html
echo ===MODALS_LOAD===; grep -rn "partials/modals.html" /app3/index.html /app3/assets/js/core/*.js | head -3
echo ===ACTION_BTNS===; grep -rhoE 'class="(btn-icon|btn-edit|btn-del|btn-danger|action-btn|btn-sm)[^"]*"' /app3/assets/js/modules/*.js | sort | uniq -c | sort -rn | head -8
grep -n -m3 -B1 -A3 "btn-icon" /app3/assets/js/modules/transportistas.js
echo ===CSS===; grep -nE "^\.(btn-icon|btn-danger|btn-sm|actions-cell|row-actions)" /app3/assets/css/*.css | head
echo ===STATUS===; sudo -u postgres psql depimovil_crm -tAc "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='usuarios'::regclass AND contype='c'"
sudo -u postgres psql depimovil_crm -tAc "SELECT DISTINCT status FROM usuarios"
echo ===FKS===; sudo -u postgres psql depimovil_crm -tAc "SELECT conrelid::regclass, a.attname, confdeltype FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=ANY(c.conkey) WHERE confrelid='usuarios'::regclass"
echo ===LOGIN_STATUS===; grep -n "status" /opt/depimovil-api/src/routes/auth.js | head -12; grep -n "status" /opt/depimovil-api/src/middleware/auth.js | head
echo ===REGISTER===; grep -n -A40 "router.post('/register'" /opt/depimovil-api/src/routes/auth.js | head -45
