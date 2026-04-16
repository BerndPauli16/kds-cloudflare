#!/bin/bash
echo "=== DNS Status ==="
cat /etc/resolv.conf

echo ""
echo "=== DNS Test ==="
curl -s --max-time 5 https://kds.team24.training/ | head -3 && echo "kds.team24.training ERREICHBAR" || echo "kds.team24.training NICHT ERREICHBAR"

echo ""
echo "=== Netzwerk Interface ==="
ip route | head -5

echo ""
echo "=== DNS permanent via systemd-resolved ==="
mkdir -p /etc/systemd/resolved.conf.d/
cat > /etc/systemd/resolved.conf.d/dns.conf <<'DNSCONF'
[Resolve]
DNS=8.8.8.8 1.1.1.1
FallbackDNS=8.8.4.4
DNSCONF

systemctl restart systemd-resolved 2>/dev/null || true
resolvectl dns 2>/dev/null || true

echo ""
echo "=== resolv.conf neu setzen ==="
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 1.1.1.1" >> /etc/resolv.conf
echo "options ndots:0" >> /etc/resolv.conf

echo ""
echo "=== Test nach Fix ==="
curl -s --max-time 5 https://kds.team24.training/ | head -3 && echo "OK!" || echo "FEHLER"

echo ""
echo "=== .env Fix: PROXY_PORT=9100 KDS_WORKER_URL korrekt ==="
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
echo "Letzte Logs:"
journalctl -u kds-agent -n 5 --no-pager | grep -v "POLLER|retry"