# 1) anular llave github_actions expuesta
sed -i '/github-actions$/d' /root/.ssh/authorized_keys; rm -f /root/.ssh/github_actions /root/.ssh/github_actions.pub
echo "llaves github-actions restantes: $(grep -c github-actions /root/.ssh/authorized_keys)"
# 2) estructura real de la API
echo ---SRC---; ls /opt/depimovil-api/src /opt/depimovil-api/src/*/ | head -80
# 3) comparar API en produccion vs GitHub (server-src)
cd /root && rm -rf cmp && git clone -q --depth 1 git@github.com:JORGEMARTINEZSASTRE/depimovil-crm1.git cmp
echo ---DIFF-API-vs-GITHUB---; diff -rq /opt/depimovil-api/src /root/cmp/server-src | head -40
echo ---DIFF-FRONT-vs-GITHUB---; diff -rq --exclude=.git /app3 /root/cmp | grep -v "^Only in /root/cmp: .github" | head -40
