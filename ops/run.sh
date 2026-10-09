# diagnóstico inicial
cd /app3; git log --oneline -1; git status --short | head -40
echo ---API---; ls -la /opt/depimovil-api; git -C /opt/depimovil-api log --oneline -1 2>&1 | head -1
echo ---DIFF---; diff -rq /opt/depimovil-api/routes /app3/server-src/routes | head -30
echo ---PM2---; pm2 jlist 2>/dev/null | python3 -c "import json,sys;[print(p['name'],p['pm2_env'].get('pm_cwd'),p['pm2_env'].get('pm_exec_path'),p['pm2_env']['status']) for p in json.load(sys.stdin)]"
echo ---NGINX---; grep -rhE "server_name|root |proxy_pass" /etc/nginx/sites-enabled/ 2>/dev/null | sort -u | head -30
