# ⚡ QUICK-REFERENCE Monitor2 Setup

**Copy-Paste-Anleitung — alles was du tippen musst**

---

## 📥 1. OS flashen (am Computer)

Im Raspberry Pi Imager:
```
OS:        Raspberry Pi OS Lite (64-bit)
Hostname:  monitor2
User:      pi
Passwort:  So01012022
SSH:       EIN (Passwort)
Zeitzone:  Europe/Vienna
```

---

## 🖥️ 2. SSH-Verbindung (am Computer-Terminal)

```bash
ssh pi@monitor2.local
# Passwort: So01012022
```

---

## 🚀 3. Basis-Installation (im SSH-Fenster)

```bash
wget https://raw.githubusercontent.com/BerndPauli16/kds-cloudflare/main/scripts/install-monitor2.sh && chmod +x install-monitor2.sh && sudo bash install-monitor2.sh
```

---

## 🔐 4. Cloudflare Tunnel (im SSH-Fenster)

### Browser-Login:
```bash
cloudflared tunnel login
```

### Tunnel erstellen:
```bash
cloudflared tunnel delete kds-monitor2-tunnel 2>/dev/null; cloudflared tunnel create kds-monitor2-tunnel
```

**⚠ Die NEUE Tunnel-ID aus der Ausgabe kopieren!**

### Config schreiben (NEUE_ID eintragen):
```bash
NEUE_ID="HIER-DIE-NEUE-TUNNEL-ID-EINFÜGEN"

sudo tee /etc/cloudflared/config.yml > /dev/null <<CFG
tunnel: ${NEUE_ID}
credentials-file: /home/pi/.cloudflared/${NEUE_ID}.json

ingress:
  - hostname: monitor2.team24.training
    service: http://localhost:80
  - service: http_status:404
CFG

cloudflared tunnel route dns kds-monitor2-tunnel monitor2.team24.training
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl restart cloudflared
sudo systemctl status cloudflared
```

---

## 🖥️ 5. Kiosk-Modus (optional, für Monitor-Anzeige)

```bash
wget https://raw.githubusercontent.com/BerndPauli16/kds-cloudflare/main/scripts/setup-kiosk.sh && chmod +x setup-kiosk.sh && sudo bash setup-kiosk.sh && sudo reboot
```

---

## ✅ 6. Test

Im Browser am Computer:
```
https://monitor2.team24.training
```
Muss den KDS-Monitor zeigen.

---

## 🔧 Wichtige Befehle zum Debuggen

```bash
# Status alle Services
sudo systemctl status kds-agent cloudflared

# Logs live
sudo journalctl -u cloudflared -f
sudo journalctl -u kds-agent -f

# Neustart
sudo systemctl restart kds-agent cloudflared

# Pi-Neustart
sudo reboot

# IP anzeigen
hostname -I
```

---

## 📋 Alle Werte zum Nachschauen

```
Hostname:       monitor2
User/Pass:      pi / So01012022
Station-ID:     2
API-Key:        kds-smarte-events-2026
Tunnel-Name:    kds-monitor2-tunnel
URL extern:     https://monitor2.team24.training
KDS-URL:        https://kds.team24.training/station/2
GitHub:         https://github.com/BerndPauli16/kds-cloudflare
Worker:         kds-cloudflare
Account:        f1c8788eb10870b12ac498a71b81d1f3
D1-DB:          kds-db
```
