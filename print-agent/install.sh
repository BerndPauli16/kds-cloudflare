#!/bin/bash
set -e
echo "╔══════════════════════════════════════╗"
echo "║   KDS Print-Agent – Setup Script     ║"
echo "╚══════════════════════════════════════╝"

DIR="$(cd "$(dirname "$0")" && pwd)"

# Node.js installieren
if ! command -v node &>/dev/null; then
  echo ">> Node.js installieren..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo ">> Node $(node -v)"

# Abhängigkeiten
cd "$DIR"
npm install

# .env anlegen falls nicht vorhanden
if [ ! -f .env ]; then
  echo ">> .env Datei anlegen..."
  cat > .env << ENV
# Raspberry Pi – Konfiguration
PRINTER_IP=192.168.1.100       # IP des ESC/POS-Druckers
PRINTER_PORT=9100               # Standard ESC/POS Port
PROXY_PORT=9100                 # Port auf dem Pi (POS sendet hierhin)
KDS_WORKER_URL=https://kds-cloudflare.DEIN-NAME.workers.dev
KDS_API_KEY=DEIN_API_KEY
KDS_STATION=Küche
KDS_STATION_ID=1
ENV
  echo ">> WICHTIG: .env anpassen! (nano $DIR/.env)"
fi

# Systemd-Service
SERVICE=/etc/systemd/system/kds-agent.service
echo ">> Systemd-Service anlegen..."
sudo tee "$SERVICE" > /dev/null << SVC
[Unit]
Description=KDS Print-Agent
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=$DIR
ExecStart=$(which node) index.js
Restart=on-failure
RestartSec=5
EnvironmentFile=$DIR/.env

[Install]
WantedBy=multi-user.target
SVC

sudo systemctl daemon-reload
sudo systemctl enable kds-agent
sudo systemctl restart kds-agent

echo ""
echo "✓ Fertig!"
echo ""
echo "Nächste Schritte:"
echo "  1. nano $DIR/.env  →  IPs und Worker-URL eintragen"
echo "  2. sudo systemctl restart kds-agent"
echo "  3. sudo journalctl -u kds-agent -f  →  Logs beobachten"
echo ""
echo "POS-Kassenprogramm auf diese IP zeigen lassen:"
ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v 127.0.0.1 | head -1
echo ":${PROXY_PORT:-9100}"
