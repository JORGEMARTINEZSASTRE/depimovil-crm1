# parche: editar roles de usuarios internos (prod)
set -e
TS=$(date +%Y%m%d%H%M)
R=/root/ops-runner/ops
API=/opt/depimovil-api/src/routes/permisos.js
FE=/app3/assets/js/modules/usuarios.js
IDX=/app3/index.html
cp $API $API.bak-roles-$TS; cp $FE $FE.bak-roles-$TS; cp $IDX $IDX.bak-roles-$TS
# API
grep -q "usuarios/:id/rol" $API || python3 - "$API" "$R/permisos_rol.js" <<'PY'
import sys
p,add=sys.argv[1],open(sys.argv[2]).read()
s=open(p).read()
assert s.count('module.exports = router;')==1
s=s.replace('module.exports = router;', add.rstrip()+'\n')
open(p,'w').write(s)
PY
node --check $API
# Frontend
cp $R/usuarios.js $FE
python3 - "$IDX" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
s=s.replace('<th>Rol</th><th>Estado</th></tr></thead>\n              <tbody id="usuariosTableBody">','<th>Rol</th><th>Estado</th><th>Cambiar rol</th></tr></thead>\n              <tbody id="usuariosTableBody">',1)
s=s.replace('usuarios.js?v=20260919-usuarios','usuarios.js?v=20261008-roles')
open(p,'w').write(s)
PY
grep -c "Cambiar rol</th>\|20261008-roles" $IDX
pm2 restart depimovil-api >/dev/null; sleep 4
pm2 jlist | python3 -c "import json,sys;[print(p['name'],p['pm2_env']['status'],'restarts',p['pm2_env']['restart_time']) for p in json.load(sys.stdin)]"
echo "PUT sin token -> $(curl -s -o /dev/null -w '%{http_code}' -X PUT http://127.0.0.1:3004/api/permisos/usuarios/1/rol)"
echo "login page -> $(curl -s -o /dev/null -w '%{http_code}' https://crm.depimovil.live/)"
pm2 logs depimovil-api --lines 8 --nostream 2>&1 | tail -8
