#!/bin/bash
echo "=== .env Fix: KDS_WORKER_URL auf monitor2.team24.training ==="
cat > /home/monitor2/kds-cloudflare/print-agent/.env <<'ENV'
PRINTER_IP=192.168.192.225
PRINTER_PORT=9100
PROXY_PORT=9100
KDS_WORKER_URL=https://monitor2.team24.training
KDS_API_KEY=kds-smarte-events-2026
KDS_STATION=Küche
KDS_STATION_ID=2
ENV
chown monitor2:monitor2 /home/monitor2/kds-cloudflare/print-agent/.env
echo "Neue .env:"
cat /home/monitor2/kds-cloudflare/print-agent/.env

echo ""
echo "=== Test DNS ==="
curl -s --max-time 5 https://monitor2.team24.training/ | head -3 && echo "ERREICHBAR!" || echo "FEHLER"

echo ""
echo "=== Agent neu starten ==="
systemctl restart kds-agent
sleep 8
journalctl -u kds-agent -n 8 --no-pager | grep -v "POLLER|retry"