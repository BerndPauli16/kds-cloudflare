# KDS – Küchenmonitor

**Version:** 1.0.0 · **Plattform:** Cloudflare Workers · **Stand:** 2026-04-12

> Vollständige technische Dokumentation: [DOCS.md](./DOCS.md)

---

## Schnellstart

### 1. Cloudflare einrichten
```bash
npm install -g wrangler
wrangler login
```

### 2. D1 Datenbank erstellen
```bash
wrangler d1 create kds-db
# Gibt database_id aus → in wrangler.toml bei `database_id` eintragen
```

### 3. R2 Bucket erstellen
```bash
wrangler r2 bucket create kds-storage
```

### 4. Schema deployen
```bash
npm run db:init
```

### 5. API-Key setzen
```bash
wrangler secret put API_KEY
# Sicheres Passwort eingeben (wird vom Print-Agent verwendet)
```

### 6. Deployen
```bash
npm run deploy
# Führt automatisch den Pre-Deploy-Check aus
# Gibt Worker-URL aus: https://kds-worker.DEIN-NAME.workers.dev
```

---

## Versionsverwaltung & Pre-Deploy-Check

**Vor jedem Deploy** wird `pre-deploy.js` automatisch ausgeführt.

| Prüfung | Bei Fehler |
|---|---|
| Versionsnummer erhöht | Deploy blockiert |
| Semver-Format korrekt | Deploy blockiert |
| D1 database_id eingetragen | Deploy blockiert |
| Pflichtdateien vorhanden | Deploy blockiert |
| Versionsdatum aktuell | Warnung |
| Keine Platzhalter im Code | Warnung |
| Release-Notes vorhanden | Warnung |

### Vor jedem Deploy: version.json aktualisieren

```json
{
  "version": "1.0.1",
  "build":   "20260413-001",
  "date":    "2026-04-13",
  "notes":   "Beschreibung der Änderungen"
}
```

**Versionsschema:**
- PATCH (1.0.x) für Bugfixes
- MINOR (1.x.0) für neue Funktionen
- MAJOR (x.0.0) für Breaking Changes

```bash
# Standard-Deploy (mit Check):
npm run deploy

# Nur im Notfall (ohne Check):
npm run deploy:force
```

---

## Raspberry Pi – Print-Agent

```bash
cd print-agent
npm install node-thermal-printer

export KDS_WORKER_URL="https://kds-worker.DEIN-NAME.workers.dev"
export KDS_API_KEY="dein_api_key"
export PRINTER_IP="192.168.1.100"

node index.js
```

### Autostart (systemd)
```ini
[Unit]
Description=KDS Print Agent
After=network.target

[Service]
ExecStart=/usr/bin/node /home/pi/kds/print-agent/index.js
Restart=always
Environment=KDS_WORKER_URL=https://kds-worker.DEIN-NAME.workers.dev
Environment=KDS_API_KEY=dein_api_key
Environment=PRINTER_IP=192.168.1.100

[Install]
WantedBy=multi-user.target
```

---

## Dateistruktur

```
kds-cloudflare/
├── wrangler.toml     ← Cloudflare Konfiguration
├── package.json      ← Scripts inkl. deploy mit Pre-Check
├── schema.sql        ← D1 Datenbank-Schema
├── version.json      ← VOR JEDEM DEPLOY aktualisieren!
├── pre-deploy.js     ← Automatischer Versions-Check
├── README.md         ← Diese Datei
├── DOCS.md           ← Vollständige technische Dokumentation
├── src/
│   ├── index.js      ← Worker Entry-Point + API
│   ├── kds-room.js   ← Durable Object (WebSocket)
│   └── frontend.js   ← KDS Web-UI
└── print-agent/
    └── index.js      ← Raspberry Pi Drucker-Agent
```

---

## Nützliche Befehle

```bash
npm run dev           # Lokaler Dev-Server
npm run deploy        # Deploy mit Pre-Check
npm run version:show  # Aktuelle Version anzeigen
npm run db:init       # DB-Schema auf Cloudflare deployen
npm run db:local      # DB-Schema lokal (wrangler dev)
wrangler tail         # Live-Logs vom Worker
```
