#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# KDS Monitor2 - VOLLAUTOMATISCHES SETUP
# Kein Browser-Login nötig - Token wird direkt übergeben
# Aufruf: sudo bash setup-monitor2-auto.sh <TUNNEL_TOKEN>
# ═══════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}>>${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
info() { echo -e "${CYAN}ℹ${NC}  $1"; }
err()  { echo -e "${RED}✗${NC} $1"; }

TUNNEL_TOKEN="$1"

clear
echo "╔══════════════════════════════════════════════════╗"
echo "║   KDS Monitor2 - VOLLAUTOMATISCHES SETUP         ║"
echo "║   Kein Browser-Login nötig                       ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

if [ "$EUID" -ne 0 ]; then err "sudo erforderlich: sudo bash $0 <TOKEN>"; exit 1; fi
if [ -z "$TUNNEL_TOKEN" ]; then err "Kein Token übergeben! Aufruf: sudo bash $0 <TOKEN>"; exit 1; fi

# ═══ 1. System ════════════════════════════════════════════════
log "[1/6] System-Update..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl git wget ca-certificates

# ═══ 2. Node.js 20 ════════════════════════════════════════════
log "[2/6] Node.js 20..."
if ! command -v node &>/dev/null || [ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
info "Node: $(node -v)"

# ═══ 3. cloudflared ═══════════════════════════════════════════
log "[3/6] cloudflared..."
if ! command -v cloudflared &>/dev/null; then
  ARCH=$(dpkg --print-architecture)
  wget -q "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb" -O /tmp/cloudflared.deb
  dpkg -i /tmp/cloudflared.deb >/dev/null && rm /tmp/cloudflared.deb
fi
info "cloudflared: $(cloudflared --version | head -1)"

# ═══ 4. KDS-Agent ═════════════════════════════════════════════
log "[4/6] KDS-Agent..."
cd /home/pi
if [ -d "kds-cloudflare" ]; then
  cd kds-cloudflare && sudo -u pi git pull -q
else
  sudo -u pi git clone -q https://github.com/BerndPauli16/kds-cloudflare.git
  cd kds-cloudflare
fi
cd print-agent && sudo -u pi npm install --production --silent

# .env mit echten Werten aus D1
cat > /home/pi/kds-cloudflare/print-agent/.env <<'ENV'
PRINTER_IP=192.168.192.203
PRINTER_PORT=9100
PROXY_PORT=8009
HTTP_PORT=80
KDS_WORKER_URL=https://kds.team24.training
KDS_API_KEY=kds-smarte-events-2026
KDS_STATION=Küche
KDS_STATION_ID=2
ENV
chown pi:pi /home/pi/kds-cloudflare/print-agent/.env

# Systemd kds-agent
cat > /etc/systemd/system/kds-agent.service <<'SVC'
[Unit]
Description=KDS Print-Agent (monitor2)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/kds-cloudflare/print-agent
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10
EnvironmentFile=/home/pi/kds-cloudflare/print-agent/.env

[Install]
WantedBy=multi-user.target
SVC

# Self-Update
cat > /usr/local/bin/kds-update.sh <<'UPDATE'
#!/bin/bash
cd /home/pi/kds-cloudflare || exit 1
BEFORE=$(sudo -u pi git rev-parse HEAD)
sudo -u pi git fetch origin main >/dev/null 2>&1
sudo -u pi git reset --hard origin/main >/dev/null 2>&1
AFTER=$(sudo -u pi git rev-parse HEAD)
if [ "$BEFORE" != "$AFTER" ]; then
  cd print-agent && sudo -u pi npm install --production >/dev/null 2>&1
  systemctl restart kds-agent
  logger "KDS Update: $BEFORE -> $AFTER"
fi
UPDATE
chmod +x /usr/local/bin/kds-update.sh
(crontab -l 2>/dev/null | grep -v kds-update; echo "*/5 * * * * /usr/local/bin/kds-update.sh >/dev/null 2>&1") | crontab -

systemctl daemon-reload
systemctl enable -q kds-agent
systemctl restart kds-agent

# ═══ 5. Cloudflare Tunnel via Token ═══════════════════════════
log "[5/6] Cloudflare Tunnel mit Token..."

# Tunnel service via Token (kein Browser-Login nötig!)
cloudflared service uninstall 2>/dev/null || true

cat > /etc/systemd/system/cloudflared.service <<SVC
[Unit]
Description=Cloudflare Tunnel (monitor2)
After=network-online.target
Wants=network-online.target

[Service]
TimeoutStartSec=0
Type=notify
ExecStart=/usr/bin/cloudflared tunnel --no-autoupdate run --token ${TUNNEL_TOKEN}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SVC

systemctl daemon-reload
systemctl enable -q cloudflared
systemctl restart cloudflared

sleep 5

# ═══ 6. Status prüfen ═════════════════════════════════════════
log "[6/6] Status..."
echo ""
systemctl is-active --quiet cloudflared && info "✓ cloudflared läuft" || warn "✗ cloudflared läuft nicht"
systemctl is-active --quiet kds-agent   && info "✓ kds-agent läuft"   || warn "✗ kds-agent läuft nicht"

echo ""
info "Tunnel-Test..."
sleep 3
HTTP=$(curl -s -o /dev/null -w "%{http_code}" https://monitor2.team24.training/ --max-time 15 || echo "000")
[ "$HTTP" = "200" ] && info "✓ monitor2.team24.training → HTTP $HTTP" || warn "Tunnel antwortet noch nicht (HTTP $HTTP) — kurz warten"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✓ SETUP KOMPLETT                               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Pi-IP:       $(hostname -I | awk '{print $1}')"
echo "URL:         https://monitor2.team24.training"
echo "KDS-Monitor: https://kds.team24.training/station/2"
echo ""
echo "Logs:"
echo "  sudo journalctl -u cloudflared -f"
echo "  sudo journalctl -u kds-agent -f"
