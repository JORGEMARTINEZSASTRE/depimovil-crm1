#!/bin/bash
# Corre en el servidor por cron cada minuto. Si ops/run.sh cambió, lo ejecuta
# y sube la salida a ops/out.txt (rama 'ops').
cd /root/ops-runner || exit 1
git fetch -q origin ops || exit 1
git reset -q --hard origin/ops
ID=$(sha1sum ops/run.sh | cut -c1-12)
[ "$ID" = "$(cat /root/.ops_last 2>/dev/null)" ] && exit 0
echo "$ID" > /root/.ops_last
{ echo "# run $ID $(date -u +%FT%TZ)"; timeout 900 bash ops/run.sh 2>&1 | tail -c 200000; echo "# exit ${PIPESTATUS[0]}"; } > ops/out.txt
git add ops/out.txt
git -c user.name=servidor -c user.email=servidor@depimovil.live commit -qm "ops: salida $ID"
git push -q origin HEAD:ops
