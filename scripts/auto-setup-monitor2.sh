#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# KDS Monitor2 - ALL-IN-ONE AUTO-SETUP
# Basis + Tunnel + Kiosk komplett automatisch
# Einzige Interaktion: Cloudflare-Login im Browser
# ═══════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

log()   { echo -e "${GREEN}>>${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $1"; }
info()  { echo -e "${CYAN}ℹ${NC}  $1"; }
err()   { echo -e "${RED}✗${NC} $1"; }

clear
echo "╔══════════════════════════════════════════════════╗"
echo "║   KDS Monitor2 - AUTO-SETUP                      ║"
echo "║   Alles wird automatisch installiert             ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

if [ "$EUID" -ne 0 ]; then
  err "Bitte mit sudo ausführen: sudo bash $0"
  exit 1
fi

# ═══ PHASE 1: Basis-System ════════════════════════════════════
log "[1/7] System-Update..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git wget ca-certificates

log "[2/7] Node.js 20..."
if ! command -v node &>/dev/null || [ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
info "Node: $(node -v)"

log "[3/7] cloudflared..."
if ! command -v cloudflared &>/dev/null; then
  ARCH=$(dpkg --print-architecture)
  wget -q "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb" -O /tmp/cloudflared.deb
  dpkg -i /tmp/cloudflared.deb >/dev/null
  rm /tmp/cloudflared.deb
fi
info "cloudflared: $(cloudflared --version | head -1)"

log "[4/7] KDS-Agent klonen..."
cd /home/monitor2
if [ -d "kds-cloudflare" ]; then
  cd kds-cloudflare && sudo -u monitor2 git pull
else
  sudo -u monitor2 git clone -q https://github.com/BerndPauli16/kds-cloudflare.git
  cd kds-cloudflare
fi
cd print-agent
sudo -u monitor2 npm install --production --silent

cat > /home/monitor2/kds-cloudflare/print-agent/.env <<'ENV'
PRINTER_IP=192.168.192.203
PRINTER_PORT=9100
PROXY_PORT=8009
HTTP_PORT=80
KDS_WORKER_URL=https://kds.team24.training
KDS_API_KEY=kds-smarte-events-2026
KDS_STATION=Küche
KDS_STATION_ID=2
ENV
chown monitor2:monitor2 /home/monitor2/kds-cloudflare/print-agent/.env

# KDS-Agent Service
cat > /etc/systemd/system/kds-agent.service <<'SVC'
[Unit]
Description=KDS Print-Agent (monitor2)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=monitor2
WorkingDirectory=/home/monitor2/kds-cloudflare/print-agent
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10
EnvironmentFile=/home/monitor2/kds-cloudflare/print-agent/.env

[Install]
WantedBy=multi-user.target
SVC

# Self-Update Script
cat > /usr/local/bin/kds-update.sh <<'UPDATE'
#!/bin/bash
cd /home/monitor2/kds-cloudflare || exit 1
BEFORE=$(sudo -u monitor2 git rev-parse HEAD)
sudo -u monitor2 git fetch origin main >/dev/null 2>&1
sudo -u monitor2 git reset --hard origin/main >/dev/null 2>&1
AFTER=$(sudo -u monitor2 git rev-parse HEAD)
if [ "$BEFORE" != "$AFTER" ]; then
  cd print-agent
  sudo -u monitor2 npm install --production >/dev/null 2>&1
  systemctl restart kds-agent
  logger "KDS Update: $BEFORE -> $AFTER"
fi
UPDATE
chmod +x /usr/local/bin/kds-update.sh
(crontab -l 2>/dev/null | grep -v kds-update; echo "*/5 * * * * /usr/local/bin/kds-update.sh >/dev/null 2>&1") | crontab -

systemctl daemon-reload
systemctl enable -q kds-agent
systemctl restart kds-agent

# ═══ PHASE 2: Cloudflare Tunnel ═══════════════════════════════
echo ""
log "[5/7] Cloudflare Tunnel einrichten..."
echo ""
warn "JETZT WIRD CLOUDFLARE-LOGIN GESTARTET"
echo ""
info "Ein Link wird gleich angezeigt."
info "Kopiere den Link und öffne ihn im Browser AUF DEINEM COMPUTER."
info "Dort loggst du dich ins Cloudflare-Konto ein und autorisierst die Domain team24.training."
echo ""
read -p "Drücke ENTER um fortzufahren..."
echo ""

# Login als pi user (wichtig!)
sudo -u monitor2 cloudflared tunnel login

# Prüfen ob Login erfolgreich
if [ ! -f /home/monitor2/.cloudflared/cert.pem ]; then
  err "Cloudflare-Login nicht erfolgreich. Abbruch."
  err "Die Datei /home/monitor2/.cloudflared/cert.pem fehlt."
  exit 1
fi
log "Cloudflare-Login erfolgreich!"
echo ""

# Alten Tunnel löschen (falls vorhanden)
log "Alten Tunnel aufräumen..."
sudo -u monitor2 cloudflared tunnel delete -f kds-monitor2-tunnel 2>/dev/null || true

# Neuen Tunnel erstellen
log "Neuen Tunnel 'kds-monitor2-tunnel' erstellen..."
CREATE_OUT=$(sudo -u monitor2 cloudflared tunnel create kds-monitor2-tunnel 2>&1)
echo "$CREATE_OUT"

# Tunnel-ID extrahieren
TUNNEL_ID=$(echo "$CREATE_OUT" | grep -oP '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)

if [ -z "$TUNNEL_ID" ]; then
  err "Tunnel-ID konnte nicht extrahiert werden!"
  exit 1
fi

info "Neue Tunnel-ID: $TUNNEL_ID"
echo ""

# Config schreiben
log "Tunnel-Config erstellen..."
mkdir -p /etc/cloudflared
cat > /etc/cloudflared/config.yml <<CFG
tunnel: ${TUNNEL_ID}
credentials-file: /home/monitor2/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: monitor2.team24.training
    service: http://localhost:80
  - service: http_status:404
CFG

# DNS-Route setzen
log "DNS-Route für monitor2.team24.training setzen..."
sudo -u monitor2 cloudflared tunnel route dns -f kds-monitor2-tunnel monitor2.team24.training

# Service installieren
log "Tunnel-Service installieren..."
cloudflared service uninstall 2>/dev/null || true
cloudflared service install
systemctl enable -q cloudflared
systemctl restart cloudflared

sleep 5

# ═══ PHASE 3: Kiosk-Modus (optional) ══════════════════════════
log "[6/7] Status prüfen..."
echo ""
systemctl is-active --quiet cloudflared && info "✓ cloudflared läuft" || warn "✗ cloudflared läuft nicht"
systemctl is-active --quiet kds-agent && info "✓ kds-agent läuft" || warn "✗ kds-agent läuft nicht"
echo ""

log "[7/7] Tunnel-Test..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://monitor2.team24.training/ --max-time 10 || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  info "✓ Tunnel erreichbar! HTTP $HTTP_CODE"
else
  warn "Tunnel antwortet noch nicht (HTTP $HTTP_CODE) - kann 1-2 Min dauern bis DNS propagiert"
fi

# ═══ FERTIG ════════════════════════════════════════════════════
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✓ SETUP KOMPLETT                               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Pi-IP:       $(hostname -I | awk '{print $1}')"
echo "Tunnel-ID:   ${TUNNEL_ID}"
echo "URL:         https://monitor2.team24.training"
echo "KDS-Monitor: https://kds.team24.training/station/2"
echo ""
echo "Nächster Schritt (optional):"
echo "  Kiosk-Modus installieren → sudo bash /home/monitor2/kds-cloudflare/scripts/setup-kiosk.sh"
echo ""
echo "Logs:"
echo "  sudo journalctl -u cloudflared -f"
echo "  sudo journalctl -u kds-agent -f"
echo ""
