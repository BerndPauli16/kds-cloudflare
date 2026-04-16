#!/bin/bash
echo "=== Hosts-Eintrag für kds.team24.training ==="
# DNS Problem umgehen via /etc/hosts
grep -v "kds.team24.training" /etc/hosts > /tmp/hosts.tmp
echo "undefined kds.team24.training" >> /tmp/hosts.tmp
cp /tmp/hosts.tmp /etc/hosts
echo "Hosts-Eintrag gesetzt: undefined kds.team24.training"

echo ""
echo "=== Test ==="
curl -s --max-time 5 https://kds.team24.training/ | head -3 && echo "ERREICHBAR!" || echo "FEHLER"

echo ""
echo "=== .env aktualisieren ==="
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

echo ""
echo "=== Agent neu starten ==="
systemctl restart kds-agent
sleep 8
journalctl -u kds-agent -n 8 --no-pager