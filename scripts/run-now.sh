#!/bin/bash
echo "=== DNS Test ==="
cat /etc/resolv.conf
echo ""
nslookup kds.team24.training 2>&1 || true
echo ""
ping -c 2 8.8.8.8 2>&1 | head -5
echo ""
ping -c 2 kds.team24.training 2>&1 | head -5

echo ""
echo "=== DNS Fix: Google DNS setzen ==="
# Temporär
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 1.1.1.1" >> /etc/resolv.conf

echo ""
echo "=== DNS Test nach Fix ==="
nslookup kds.team24.training 2>&1 | head -5

echo ""
echo "=== Permanent fix via dhcpcd ==="
if [ -f /etc/dhcpcd.conf ]; then
  grep -q "static domain_name_servers" /etc/dhcpcd.conf || echo "static domain_name_servers=8.8.8.8 1.1.1.1" >> /etc/dhcpcd.conf
  echo "dhcpcd.conf aktualisiert"
fi

echo ""
echo "=== Agent neu starten ==="
systemctl restart kds-agent
sleep 5
journalctl -u kds-agent -n 10 --no-pager | grep -v "retry|wieder"