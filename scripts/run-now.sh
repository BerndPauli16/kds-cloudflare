#!/bin/bash
echo "=== .env korrigieren ==="
cat > /home/monitor2/kds-cloudflare/print-agent/.env <<'ENV'
PRINTER_IP=192.168.192.225
PRINTER_PORT=9100
PROXY_PORT=9100
KDS_WORKER_URL=https://kds.team24.training
KDS_API_KEY=kds-smarte-events-2026
KDS_STATION=Küche
KDS_STATION_ID=2
ENV
chown monitor2:monitor2 /home/monitor2/kds-cloudflare/print-agent/.env

echo "=== Git Pull (neuer DNS-Override Code) ==="
cd /home/monitor2/kds-cloudflare
sudo -u monitor2 git pull

echo "=== Agent neu starten ==="
systemctl restart kds-agent
sleep 10
journalctl -u kds-agent -n 8 --no-pager | grep -v "POLLER|retry"