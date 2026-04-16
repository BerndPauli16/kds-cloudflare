#!/bin/bash
set -e
echo "=== Fix: PROXY_PORT auf 80 setzen ==="

# .env korrigieren - PROXY_PORT muss 80 sein (Tunnel zeigt auf :80)
cat > /home/monitor2/kds-cloudflare/print-agent/.env <<'ENV'
PRINTER_IP=192.168.192.225
PRINTER_PORT=9100
PROXY_PORT=80
KDS_WORKER_URL=https://kds.team24.training
KDS_API_KEY=kds-smarte-events-2026
KDS_STATION=Küche
KDS_STATION_ID=2
ENV

chown monitor2:monitor2 /home/monitor2/kds-cloudflare/print-agent/.env
echo "Neue .env:"
cat /home/monitor2/kds-cloudflare/print-agent/.env

echo ""
echo "=== Agent neu starten ==="
systemctl restart kds-agent
sleep 3
systemctl status kds-agent --no-pager | head -5

echo ""
echo "=== HTTP Test Port 80 ==="
curl -s http://localhost:80/ | head -3 && echo "PORT 80 OK!" || echo "Port 80 noch nicht da"
sleep 2
curl -s http://localhost:80/api/agent | head -3 || echo "API noch nicht bereit"