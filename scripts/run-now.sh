#!/bin/bash
echo "=== /etc/hosts Fix ==="
grep -v "kds.team24.training" /etc/hosts > /tmp/hosts.tmp
echo "104.21.42.248 kds.team24.training" >> /tmp/hosts.tmp
cp /tmp/hosts.tmp /etc/hosts
cat /etc/hosts | tail -3

echo ""
echo "=== DNS resolv.conf ==="
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 1.1.1.1" >> /etc/resolv.conf

echo ""
echo "=== Test HTTPS ==="
curl -s --max-time 8 -H "Host: kds.team24.training" https://kds.team24.training/ | head -3 && echo "OK!" || echo "FEHLER"

echo ""
echo "=== .env ==="
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
cat /home/monitor2/kds-cloudflare/print-agent/.env

echo ""
echo "=== Neustart ==="
systemctl restart kds-agent
sleep 10
journalctl -u kds-agent -n 6 --no-pager | grep -v "POLLER|retry|wieder"