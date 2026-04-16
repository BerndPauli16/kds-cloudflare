#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# KDS Monitor2 - Kiosk-Modus Setup
# Startet Chromium im Vollbild mit KDS-Monitor Station 2
# ═══════════════════════════════════════════════════════════════

set -e

echo "╔══════════════════════════════════════════════════╗"
echo "║   Kiosk-Modus Installation                       ║"
echo "╚══════════════════════════════════════════════════╝"

# Minimal-Desktop + Chromium
echo ">> Installation Desktop + Chromium..."
sudo apt-get update -qq
sudo apt-get install -y --no-install-recommends \
  xserver-xorg \
  x11-xserver-utils \
  xinit \
  openbox \
  chromium-browser \
  unclutter

# Openbox Autostart
echo ">> Kiosk-Autostart anlegen..."
mkdir -p /home/pi/.config/openbox
cat > /home/pi/.config/openbox/autostart <<'AUTO'
# Bildschirmschoner aus
xset s off
xset -dpms
xset s noblank

# Mauszeiger ausblenden
unclutter -idle 1 &

# Kurz warten bis Netzwerk da ist
sleep 5

# Chromium Kiosk
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-translate \
  --incognito \
  --disable-features=TranslateUI \
  --check-for-update-interval=31536000 \
  https://kds.team24.training/station/2 &
AUTO

chown -R pi:pi /home/pi/.config

# Autologin auf tty1
echo ">> Autologin einrichten..."
sudo raspi-config nonint do_boot_behaviour B2

# startx beim Login
if ! grep -q "startx" /home/pi/.bash_profile 2>/dev/null; then
  echo '[ -z "$DISPLAY" ] && [ $(tty) = /dev/tty1 ] && startx -- -nocursor' >> /home/pi/.bash_profile
  chown pi:pi /home/pi/.bash_profile
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✓ Kiosk-Modus installiert                      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Neustart erforderlich:  sudo reboot"
echo ""
