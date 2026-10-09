echo ===NORM===; grep -n -A14 "^function normalizeWhatsapp\|^const normalizeWhatsapp" /opt/depimovil-api/src/routes/auth.js | head -20
grep -rn "normalizeWhatsapp" /opt/depimovil-api/src/utils/*.js | head -3
echo ===ACTIONBTN===; grep -n -m2 "action-btn danger" /app3/assets/js/modules/*.js
grep -nE "^\.action-btn" /app3/assets/css/*.css
echo ===WAUSERS===; sudo -u postgres psql depimovil_crm -tAc "SELECT whatsapp FROM usuarios WHERE whatsapp IS NOT NULL LIMIT 3"
