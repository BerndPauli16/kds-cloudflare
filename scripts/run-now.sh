#!/bin/bash
echo "=== KDS Agent Status ==="
systemctl status kds-agent --no-pager | head -20
echo ""
echo "=== Letzte Logs ==="
journalctl -u kds-agent -n 30 --no-pager
echo ""
echo "=== .env Inhalt ==="
cat /home/monitor2/kds-cloudflare/print-agent/.env 2>/dev/null || echo "ENV FEHLT!"
echo ""
echo "=== Node Version ==="
node -v
echo ""
echo "=== Neu starten ==="
systemctl restart kds-agent
sleep 3
systemctl status kds-agent --no-pager | head -10
echo ""
echo "=== HTTP Test ==="
curl -s http://localhost:80/ | head -5 || echo "Port 80 antwortet nicht"