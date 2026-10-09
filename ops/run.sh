# parche v2: editar / eliminar / reactivar usuarios internos (prod)
set -e
TS=$(date +%Y%m%d%H%M)
R=/root/ops-runner/ops
API=/opt/depimovil-api/src/routes/permisos.js
FE=/app3/assets/js/modules/usuarios.js
IDX=/app3/index.html
cp $API $API.bak-usuarios2-$TS; cp $FE $FE.bak-usuarios2-$TS; cp $IDX $IDX.bak-usuarios2-$TS
python3 - "$API" "$R/permisos_usuarios.js" <<'PY'
import sys
p,add=sys.argv[1],open(sys.argv[2]).read()
s=open(p).read()
mark='// ─────────────────────────────────────────────\n// PUT /api/permisos/usuarios/:id/rol'
i=s.index(mark)
s=s[:i]+add
s=s.replace('SELECT id, nombre, email, rol, status, operadora_id, transportista_id,','SELECT id, nombre, email, whatsapp, rol, status, operadora_id, transportista_id,',1)
open(p,'w').write(s)
PY
node --check $API
cp $R/usuarios.js $FE
sed -i 's#<th>Estado</th><th>Cambiar rol</th>#<th>Estado</th><th style="text-align:right">Acciones</th>#; s#usuarios.js?v=20261008-roles#usuarios.js?v=20261008-usuarios2#' $IDX
grep -c 'Acciones</th>\|20261008-usuarios2' $IDX
pm2 restart depimovil-api >/dev/null; sleep 4
pm2 jlist | python3 -c "import json,sys;[print(p['name'],p['pm2_env']['status']) for p in json.load(sys.stdin)]"
for m in "PUT /api/permisos/usuarios/1" "DELETE /api/permisos/usuarios/1" "POST /api/permisos/usuarios/1/reactivar" "GET /api/permisos/usuarios"; do set -- $m; echo "$m -> $(curl -s -o /dev/null -w '%{http_code}' -X $1 http://127.0.0.1:3004$2)"; done
echo "crm -> $(curl -s -o /dev/null -w '%{http_code}' https://crm.depimovil.live/)"
pm2 logs depimovil-api --err --lines 5 --nostream 2>&1 | tail -5
