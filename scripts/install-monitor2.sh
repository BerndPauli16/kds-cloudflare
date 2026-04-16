#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# KDS Pi monitor2 - MASTER INSTALLATION
# Station 2 - Küchen-Monitor
#
# Aufruf:  sudo bash install-monitor2.sh
# ═══════════════════════════════════════════════════════════════

set -e

# Farben für Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}>>${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC}  $1"; }
err()  { echo -e "${RED}✗${NC} $1"; }

echo "╔══════════════════════════════════════════════════╗"
echo "║    KDS monitor2 - Komplett-Installation          ║"
echo "║    Station 2 - Küchen-Monitor                    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Prüfe Root
if [ "$EUID" -ne 0 ]; then
  err "Bitte mit sudo ausführen: sudo bash $0"
  exit 1
fi

# ═══ 1. System-Update ═══════════════════════════════════════════
log "System-Update..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git wget ca-certificates

# ═══ 2. Node.js 20 ══════════════════════════════════════════════
if ! command -v node &>/dev/null || [ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 20 ]; then
  log "Node.js 20 installieren..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
log "Node.js: $(node -v)"

# ═══ 3. cloudflared ═════════════════════════════════════════════
if ! command -v cloudflared &>/dev/null; then
  log "cloudflared installieren..."
  ARCH=$(dpkg --print-architecture)
  wget -q "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb" -O /tmp/cloudflared.deb
  dpkg -i /tmp/cloudflared.deb
  rm /tmp/cloudflared.deb
fi
log "cloudflared: $(cloudflared --version | head -1)"

# ═══ 4. KDS-Agent Repo ══════════════════════════════════════════
log "KDS-Agent von GitHub klonen..."
cd /home/pi
if [ -d "kds-cloudflare" ]; then
  cd kds-cloudflare
  sudo -u pi git pull
else
  sudo -u pi git clone https://github.com/BerndPauli16/kds-cloudflare.git
  cd kds-cloudflare
fi

cd print-agent
sudo -u pi npm install --production

# ═══ 5. .env-Konfiguration für Station 2 ════════════════════════
log ".env für Station 2 erstellen..."
cat > /home/pi/kds-cloudflare/print-agent/.env <<'ENV'
# ═══════════════════════════════════════════════════
# Pi monitor2 - Station 2 - Küchen-Monitor
# ═══════════════════════════════════════════════════
PRINTER_IP=192.168.1.202
PRINTER_PORT=9100
PROXY_PORT=9100
HTTP_PORT=80
KDS_WORKER_URL=https://kds.team24.training
KDS_API_KEY=kds-smarte-events-2026
KDS_STATION=Küche
KDS_STATION_ID=2
ENV
chown pi:pi /home/pi/kds-cloudflare/print-agent/.env

# ═══ 6. Systemd-Service: kds-agent ══════════════════════════════
log "Systemd-Service kds-agent anlegen..."
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
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SVC

# ═══ 7. Self-Update Script ══════════════════════════════════════
log "Self-Update Script anlegen..."
cat > /usr/local/bin/kds-update.sh <<'UPDATE'
#!/bin/bash
# Zieht alle 5 Minuten Updates von GitHub
cd /home/pi/kds-cloudflare || exit 1
BEFORE=$(sudo -u pi git rev-parse HEAD)
sudo -u pi git fetch origin main >/dev/null 2>&1
sudo -u pi git reset --hard origin/main >/dev/null 2>&1
AFTER=$(sudo -u pi git rev-parse HEAD)
if [ "$BEFORE" != "$AFTER" ]; then
  cd print-agent
  sudo -u pi npm install --production >/dev/null 2>&1
  systemctl restart kds-agent
  logger "KDS-Agent Update: $BEFORE -> $AFTER"
fi
UPDATE
chmod +x /usr/local/bin/kds-update.sh

# Cronjob
(crontab -l 2>/dev/null | grep -v kds-update; echo "*/5 * * * * /usr/local/bin/kds-update.sh >/dev/null 2>&1") | crontab -

# ═══ 8. Services aktivieren ═════════════════════════════════════
log "Services aktivieren..."
systemctl daemon-reload
systemctl enable kds-agent
systemctl restart kds-agent

# ═══ 9. Fertig ══════════════════════════════════════════════════
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✓ BASIS-SETUP FERTIG                           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Pi-IP: $(hostname -I | awk '{print $1}')"
echo ""
warn "NÄCHSTER SCHRITT: Cloudflare Tunnel einrichten!"
echo ""
echo "  Variante A (wenn Credentials-Datei vorhanden):"
echo "    sudo cp /pfad/zu/06b13b38-f1b7-4dd5-b348-255cae6b2974.json /etc/cloudflared/"
echo "    sudo bash /home/pi/kds-cloudflare/scripts/setup-tunnel.sh"
echo ""
echo "  Variante B (neuen Tunnel erstellen):"
echo "    cloudflared tunnel login"
echo "    cloudflared tunnel create kds-monitor2-tunnel"
echo "    → weitere Schritte siehe ANLEITUNG.md"
echo ""
echo "Status:"
systemctl is-active kds-agent && echo "  ✓ kds-agent läuft" || echo "  ✗ kds-agent läuft nicht"
echo ""
