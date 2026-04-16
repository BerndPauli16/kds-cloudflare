#!/bin/bash
set -e
HOMEDIR=$(eval echo ~$(logname))
USERNAME=$(logname)
echo ">> User: $USERNAME | Home: $HOMEDIR"
cd $HOMEDIR
[ -d "kds-cloudflare" ] || sudo -u $USERNAME git clone -q https://github.com/BerndPauli16/kds-cloudflare.git
cd kds-cloudflare && sudo -u $USERNAME git pull -q
cd print-agent && sudo -u $USERNAME npm install --production --silent
printf 'PRINTER_IP=192.168.192.202\nPRINTER_PORT=9100\nPROXY_PORT=9100\nHTTP_PORT=80\nKDS_WORKER_URL=https://kds.team24.training\nKDS_API_KEY=kds-smarte-events-2026\nKDS_STATION=Kueche\nKDS_STATION_ID=2\n' > $HOMEDIR/kds-cloudflare/print-agent/.env
chown $USERNAME:$USERNAME $HOMEDIR/kds-cloudflare/print-agent/.env
cat > /etc/systemd/system/kds-agent.service <<SVC
[Unit]
Description=KDS Agent monitor2
After=network-online.target
[Service]
Type=simple
User=$USERNAME
WorkingDirectory=$HOMEDIR/kds-cloudflare/print-agent
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10
EnvironmentFile=$HOMEDIR/kds-cloudflare/print-agent/.env
[Install]
WantedBy=multi-user.target
SVC
cat > /usr/local/bin/kds-update.sh <<'UPD'
#!/bin/bash
U=monitor2; H=/home/monitor2
cd $H/kds-cloudflare || exit 1
B=$(sudo -u $U git rev-parse HEAD 2>/dev/null)
sudo -u $U git fetch origin main >/dev/null 2>&1
sudo -u $U git reset --hard origin/main >/dev/null 2>&1
A=$(sudo -u $U git rev-parse HEAD 2>/dev/null)
[ "$B" != "$A" ] && cd print-agent && sudo -u $U npm install --production >/dev/null 2>&1 && systemctl restart kds-agent
UPD
chmod +x /usr/local/bin/kds-update.sh
(crontab -l 2>/dev/null | grep -v kds-update; echo "*/5 * * * * /usr/local/bin/kds-update.sh >/dev/null 2>&1") | crontab -
systemctl daemon-reload && systemctl enable -q kds-agent && systemctl restart kds-agent
echo "kds-agent: $(systemctl is-active kds-agent)"
cloudflared service uninstall 2>/dev/null || true
cloudflared service install eyJhIjoiZjFjODc4OGViMTA4NzBiMTJhYzQ5OGE3MWI4MWQxZjMiLCJ0IjoiMDZiMTNiMzgtZjFiNy00ZGQ1LWIzNDgtMjU1Y2FlNmIyOTc0IiwicyI6IklDMEo5WDI1d2xyQ0JURnBKNE5EU2htNjk4NTZJVkFFRGlFb3pTSHlZcEhCSVMrN2JQR0dRUlJsT29EdGZnUkdsK0VaYkFLM281aVRqS1dRdjRHSnFRPT0ifQ==
systemctl enable -q cloudflared && systemctl restart cloudflared
sleep 5
echo "cloudflared: $(systemctl is-active cloudflared)"
echo "FERTIG! https://monitor2.team24.training"