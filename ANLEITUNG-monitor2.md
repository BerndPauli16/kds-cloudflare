# 🚨 Monitor 2 – KOMPLETT-Neuinstallation

**Stand:** 16.04.2026
**Ziel:** Pi monitor2 (Station 2, Küche) von Null aufsetzen

---

## 📋 Was du BRAUCHST:

### Hardware
- ✅ Raspberry Pi (vorhanden)
- ✅ **Neue SD-Karte** (min. 16 GB, besser 32 GB, **Class 10** oder A1)
- ✅ SD-Karten-Leser für deinen Computer
- ✅ LAN-Kabel + Strom für Pi
- 💡 Optional: HDMI-Monitor + Tastatur am Pi (nur falls SSH nicht klappt)

### Software auf deinem Computer
- ✅ **Raspberry Pi Imager**: https://www.raspberrypi.com/software/
- ✅ SSH-Client (bei Windows: PowerShell oder PuTTY)

---

## 🎯 SCHRITT 1 — Raspberry Pi Imager installieren

1. https://www.raspberrypi.com/software/ öffnen
2. Version für dein Betriebssystem herunterladen (Windows/macOS)
3. Installieren und **als Administrator starten**

---

## 🎯 SCHRITT 2 — OS auf SD-Karte flashen

1. **SD-Karte in Leser stecken** → in Computer
2. Im Raspberry Pi Imager:
   - **Gerät wählen:** "Raspberry Pi 4" (oder was du hast)
   - **OS wählen:** → "Raspberry Pi OS (other)" → **"Raspberry Pi OS Lite (64-bit)"**
     - ⚠️ "Lite" wählen! (ohne Desktop, schneller)
   - **Speicher wählen:** Deine SD-Karte

3. **⚙ Zahnrad-Symbol** (unten rechts) klicken → "Einstellungen":

   ```
   ☑ Hostname setzen:           monitor2
   ☑ SSH aktivieren:            Passwort-Authentifizierung
   ☑ Benutzername:              pi
   ☑ Passwort:                  So01012022
   ☑ WLAN konfigurieren (falls kein LAN verfügbar):
      SSID:     [dein WLAN]
      Passwort: [WLAN-Passwort]
      Land:     AT
   ☑ Gebietsschema:
      Zeitzone: Europe/Vienna
      Tastatur: de
   ```

4. **"Speichern"** → **"SCHREIBEN"** → warten (~10 Minuten)
5. Karte auswerfen → in monitor2-Pi einsetzen

---

## 🎯 SCHRITT 3 — Pi starten und per SSH verbinden

1. **Pi einschalten** (LAN-Kabel + Strom)
2. **2-3 Minuten warten** (erster Boot dauert etwas)
3. **IP-Adresse finden:**
   - Option A: `monitor2.local` probieren (klappt oft)
   - Option B: Im Router nachschauen unter "verbundene Geräte"
   - Option C: Auf dem anderen KDS-Monitor auf ⚙ → dort steht die IP

4. **Per SSH verbinden** (Windows PowerShell):
   ```powershell
   ssh pi@monitor2.local
   # oder mit IP:
   ssh pi@192.168.1.XXX
   ```
   - Warnung mit "yes" bestätigen
   - Passwort: `So01012022`

---

## 🎯 SCHRITT 4 — Setup-Script ausführen

Auf dem Pi (in der SSH-Sitzung):

```bash
wget https://raw.githubusercontent.com/BerndPauli16/kds-cloudflare/main/scripts/install-monitor2.sh
chmod +x install-monitor2.sh
sudo bash install-monitor2.sh
```

Das Script macht:
- ✅ System-Updates
- ✅ Node.js 20 installieren
- ✅ cloudflared installieren
- ✅ KDS-Agent von GitHub klonen
- ✅ `.env` für Station 2 erstellen
- ✅ Systemd-Services anlegen
- ✅ Self-Update-Cronjob einrichten

**Dauer:** ~10-15 Minuten

---

## 🎯 SCHRITT 5 — Cloudflare Tunnel einrichten

**Hier gibt es 2 Wege. Wähle einen:**

### 🅰️ WEG A — Tunnel-Credentials von alter SD-Karte holen (SCHNELL)

**Wenn die alte SD-Karte noch lesbar ist:**
1. Alte SD-Karte in deinen Computer (auch wenn Pi sie nicht mehr mag — Linux-Partition ist oft noch lesbar)
2. Unter Linux/Mac: Partition `rootfs` mounten
3. Datei kopieren: `/etc/cloudflared/06b13b38-f1b7-4dd5-b348-255cae6b2974.json`
4. Inhalt öffnen (ist JSON)
5. **Auf dem neuen Pi:**
   ```bash
   sudo nano /etc/cloudflared/06b13b38-f1b7-4dd5-b348-255cae6b2974.json
   ```
   Inhalt einfügen, Strg+O, Strg+X
6. Tunnel starten:
   ```bash
   sudo bash /home/pi/kds-cloudflare/scripts/setup-tunnel.sh
   ```

### 🅱️ WEG B — Neuen Tunnel erstellen (EINFACHER, wenn alte SD tot)

**Auf dem neuen Pi in SSH:**

```bash
# 1. Browser-Login (gibt dir einen Link)
cloudflared tunnel login
```
→ Link im Browser öffnen → Team24-Cloudflare-Account einloggen → Domain `team24.training` auswählen → "Authorize"

```bash
# 2. Alten Tunnel löschen (weil wir neuen erstellen)
cloudflared tunnel delete kds-monitor2-tunnel 2>/dev/null || true

# 3. Neuen Tunnel erstellen
cloudflared tunnel create kds-monitor2-tunnel
```
→ gibt neue Tunnel-ID aus — **AUFSCHREIBEN!** (z.B. `a1b2c3d4-...`)

```bash
# 4. Config schreiben (TUNNEL_ID durch deine ersetzen!)
TUNNEL_ID="HIER-NEUE-ID-EINFÜGEN"

sudo tee /etc/cloudflared/config.yml > /dev/null <<CFG
tunnel: ${TUNNEL_ID}
credentials-file: /home/pi/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: monitor2.team24.training
    service: http://localhost:80
  - service: http_status:404
CFG

# 5. DNS-Route setzen
cloudflared tunnel route dns kds-monitor2-tunnel monitor2.team24.training

# 6. Service installieren & starten
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl restart cloudflared

# 7. Status prüfen
sudo systemctl status cloudflared
```

---

## 🎯 SCHRITT 6 — Testen

### Auf dem Pi:
```bash
# Status aller Services
sudo systemctl status kds-agent cloudflared

# Lokal testen
curl http://localhost:80

# Logs live mitlesen
sudo journalctl -u cloudflared -f
```

### Von außen (am Computer):
Im Browser öffnen:
```
https://monitor2.team24.training
```
→ KDS Küchen-Monitor muss erscheinen

### Test-Bestellung:
- Über asello einen Test-Bon mit einem Artikel senden
- Auf monitor2 muss die Karte erscheinen

---

## 🎯 SCHRITT 7 — Kiosk-Modus (Monitor zeigt KDS)

**Wenn der Pi einen Bildschirm hat und den KDS direkt anzeigen soll:**

```bash
# Desktop + Chromium installieren
sudo apt install -y --no-install-recommends xserver-xorg x11-xserver-utils xinit openbox chromium-browser unclutter

# Autostart anlegen
mkdir -p ~/.config/openbox
cat > ~/.config/openbox/autostart <<'AUTO'
xset s off
xset -dpms
xset s noblank
unclutter -idle 1 &
chromium-browser --kiosk --noerrdialogs --disable-infobars --incognito https://kds.team24.training/station/2 &
AUTO

# Autologin aktivieren
sudo raspi-config nonint do_boot_behaviour B2
# B2 = Console Autologin

# Startx nach Login
echo "[ -z \"\$DISPLAY\" ] && [ \$(tty) = /dev/tty1 ] && startx" >> ~/.bash_profile

sudo reboot
```

---

## 🔧 Troubleshooting

### "Pi bootet nicht"
- SD-Karte neu flashen (manchmal beim ersten Mal korrupt)
- Andere SD-Karten-Marke probieren (SanDisk, Samsung)
- Netzteil prüfen: muss min. **3A bei 5V** für Pi 4 liefern

### "monitor2.team24.training zeigt 503"
```bash
sudo systemctl restart cloudflared
sudo journalctl -u cloudflared -n 50 --no-pager
```

### "SSH klappt nicht"
- 3-5 Min. warten nach Boot
- Tunnel prüfen im Router
- Direkt an Pi anschließen: HDMI + USB-Tastatur → `sudo raspi-config`

### "KDS-Monitor zeigt keine Bestellungen"
```bash
# Station-ID prüfen
cat /home/pi/kds-cloudflare/print-agent/.env | grep STATION
# muss sein: KDS_STATION_ID=2

# API-Key prüfen
cat /home/pi/kds-cloudflare/print-agent/.env | grep API
# muss sein: KDS_API_KEY=kds-smarte-events-2026
```

---

## 📂 Wichtige Infos auf einen Blick

| Parameter | Wert |
|---|---|
| Hostname | `monitor2` |
| Login | `pi` / `So01012022` |
| Station-ID | `2` |
| API-Key | `kds-smarte-events-2026` |
| Tunnel-Name | `kds-monitor2-tunnel` |
| Alte Tunnel-ID | `06b13b38-f1b7-4dd5-b348-255cae6b2974` |
| URL | `https://monitor2.team24.training` |
| KDS-URL | `https://kds.team24.training/station/2` |
| GitHub | `https://github.com/BerndPauli16/kds-cloudflare` |

---

## ⏱️ Gesamtdauer: ~30-45 Minuten

1. OS flashen → 10 min
2. Pi booten + SSH → 5 min
3. Install-Script → 15 min
4. Tunnel einrichten → 5-10 min
5. Kiosk-Modus (optional) → 5 min
