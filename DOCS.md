# KDS – Küchenmonitor · Technische Dokumentation

**Version:** 1.0.0  
**Stand:** 2026-04-12  
**Plattform:** Cloudflare Workers (serverless)

---

## Inhaltsverzeichnis

1. [Systemübersicht](#1-systemübersicht)
2. [Architektur](#2-architektur)
3. [Cloudflare-Dienste](#3-cloudflare-dienste)
4. [Datenmodell (D1)](#4-datenmodell-d1)
5. [API-Referenz](#5-api-referenz)
6. [WebSocket & Echtzeit](#6-websocket--echtzeit)
7. [Küchenmonitor-UI](#7-küchenmonitor-ui)
8. [Print-Agent (Raspberry Pi)](#8-print-agent-raspberry-pi)
9. [Versionsverwaltung & Deploy](#9-versionsverwaltung--deploy)
10. [Troubleshooting](#10-troubleshooting)
11. [Changelog](#11-changelog)

---

## 1. Systemübersicht

Das KDS (Kitchen Display System) ist ein serverloser Küchenmonitor, der vollständig auf **Cloudflare Workers** läuft. Es empfängt Bestellungen (Bons/Tickets), zeigt diese in Echtzeit auf einem Monitor an, berechnet Live-Produktsummen und sendet Druckaufträge an einen Bondrucker im lokalen Netzwerk.

### Kernfunktionen

| Funktion | Beschreibung |
|---|---|
| **Bestellungsansicht** | Tickets nach Wartezeit sortiert, mit Extras |
| **Produktansicht** | Gruppiert nach Produkt, Stückzahl pro Tisch |
| **Live-Summen** | Linke Sidebar – Gesamtmenge pro Produkt, Echtzeit |
| **Bon drucken** | Ein Klick → Print-Job → Drucker |
| **Auto-Korrektur** | Summen passen sich sofort beim Drucken/Abschließen an |
| **Multi-Station** | Küche, Bar, Getränkestand – beliebig erweiterbar |
| **WebSocket** | Alle Clients sehen Änderungen ohne Reload |

---

## 2. Architektur

```
┌─────────────────────────────────────────────────────┐
│                   Cloudflare Network                  │
│                                                       │
│   ┌──────────────┐     ┌──────────────────────────┐  │
│   │   Worker     │────▶│  D1 Database (SQLite)    │  │
│   │  (API + UI)  │     │  tickets, items,          │  │
│   │              │     │  print_jobs, stations     │  │
│   └──────┬───────┘     └──────────────────────────┘  │
│          │                                            │
│          │             ┌──────────────────────────┐  │
│          └────────────▶│  Durable Object: KDSRoom │  │
│                        │  (WebSocket-Broadcast)    │  │
│                        └──────────────────────────┘  │
│                                                       │
│          ┌──────────────────────────────────────────┐ │
│          │  R2 Bucket (Logos, Exports, Backups)      │ │
│          └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
          ▲                            ▲
          │ HTTPS/WSS                  │ REST-Poll
    ┌─────┴──────┐            ┌────────┴───────┐
    │  Browser   │            │  Raspberry Pi  │
    │  KDS-UI    │            │  Print-Agent   │
    └────────────┘            └───────┬────────┘
                                      │ TCP 9100
                                ┌─────┴──────┐
                                │  Drucker   │
                                │ (ESC/POS)  │
                                └────────────┘
```

### Datenfluß – Bon erstellen & drucken

```
Kellner-App                  Worker                 Print-Agent
    │                           │                        │
    │── POST /api/tickets ──────▶│                        │
    │                           │─ INSERT tickets ──────▶D1
    │                           │─ INSERT print_jobs ───▶D1
    │                           │─ Broadcast WS ────────▶Durable Object
    │                           │                        │
    │                    Browser│◀── WS: ticket_created ─│
    │                           │                        │
    │                           │◀── GET /api/print-jobs/pending ──│
    │                           │──── Response: [job] ──────────────▶│
    │                           │                        │─ ESC/POS ──▶Drucker
    │                           │◀── POST /api/print-jobs/1/complete─│
    │                           │─ UPDATE print_jobs ───▶D1
    │                    Browser│◀── WS: ticket_printed ─│
```

---

## 3. Cloudflare-Dienste

### Workers
- **Entry-Point:** `src/index.js`
- Routing, API-Handler, Frontend-Auslieferung
- Kein Node.js-Runtime nötig – läuft in V8-Isolaten

### D1 (SQLite)
- Binding: `DB`
- Relationale Datenbank direkt am Edge
- Schema in `schema.sql`

### Durable Objects
- Klasse: `KDSRoom` (`src/kds-room.js`)
- Eine Instanz pro Station (+ eine "all"-Instanz)
- Hält WebSocket-Verbindungen und broadcasted Events

### R2 Objekt-Speicher
- Binding: `STORAGE`
- Für zukünftige Erweiterungen: Logos, PDF-Exports, Bon-Archiv

---

## 4. Datenmodell (D1)

### Tabelle `stations`

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INTEGER PK | Auto-Increment |
| `name` | TEXT | z.B. "Küche", "Bar" |
| `color` | TEXT | Hex-Farbe für UI |
| `created_at` | DATETIME | Erstellungszeitpunkt |

### Tabelle `tickets`

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INTEGER PK | Auto-Increment |
| `ticket_number` | TEXT | Bon-Nummer (z.B. "B042") |
| `table_number` | TEXT | Tischnummer |
| `station_id` | INTEGER FK | Zugehörige Station |
| `status` | TEXT | `open` / `printing` / `done` |
| `created_at` | DATETIME | Zeitpunkt der Bestellung |
| `printed_at` | DATETIME | Zeitpunkt des Drucks |

### Tabelle `ticket_items`

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INTEGER PK | Auto-Increment |
| `ticket_id` | INTEGER FK | Zugehöriges Ticket |
| `product_name` | TEXT | Produktname |
| `quantity` | INTEGER | Anzahl |
| `extras` | TEXT | JSON-Array: `["ohne Zwiebeln"]` |

### Tabelle `print_jobs`

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INTEGER PK | Auto-Increment |
| `ticket_id` | INTEGER FK | Zugehöriges Ticket |
| `payload` | TEXT | JSON mit Druckdaten |
| `status` | TEXT | `pending` / `printing` / `done` / `failed` |
| `created_at` | DATETIME | Job-Erstellung |
| `completed_at` | DATETIME | Abschluss |

---

## 5. API-Referenz

**Base URL:** `https://kds-worker.DEIN-NAME.workers.dev`

### Authentifizierung

Endpunkte mit 🔒 benötigen den Header:
```
X-API-Key: <API_KEY>
```

---

### GET `/api/stations`
Alle Stationen abrufen.

**Response:**
```json
[
  { "id": 1, "name": "Küche", "color": "#f59e0b" },
  { "id": 2, "name": "Bar",   "color": "#3b82f6" }
]
```

---

### GET `/api/tickets`
Alle offenen Tickets abrufen (Status ≠ `done`).

**Query-Parameter:**
| Parameter | Typ | Beschreibung |
|---|---|---|
| `station` | integer | Optional – nach Station filtern |

**Response:**
```json
[
  {
    "id": 1,
    "ticket_number": "B042",
    "table_number": "7",
    "station_id": 1,
    "station_name": "Küche",
    "station_color": "#f59e0b",
    "status": "open",
    "wait_mins": 4,
    "items": [
      {
        "product_name": "Bier",
        "quantity": 2,
        "extras": []
      }
    ]
  }
]
```

---

### 🔒 POST `/api/tickets`
Neues Ticket erstellen.

**Body:**
```json
{
  "ticket_number": "B042",
  "table_number": "7",
  "station_id": 1,
  "items": [
    { "product_name": "Bier",      "quantity": 2, "extras": [] },
    { "product_name": "Schnitzel", "quantity": 1, "extras": ["ohne Pommes"] }
  ]
}
```

**Response:** `201 Created` – erstelltes Ticket-Objekt

---

### POST `/api/tickets/:id/print`
Druckauftrag für ein Ticket erstellen. Status → `printing`.

**Response:**
```json
{ "id": 1, "status": "printing", ... }
```

---

### POST `/api/tickets/:id/done`
Ticket als erledigt markieren. Ticket verschwindet aus der Ansicht.

---

### GET `/api/totals`
Live-Produktsummen aller offenen Tickets.

**Query-Parameter:**
| Parameter | Typ | Beschreibung |
|---|---|---|
| `station` | integer | Optional – nach Station filtern |

**Response:**
```json
[
  { "product_name": "Bier",      "total": 6 },
  { "product_name": "Schnitzel", "total": 2 }
]
```

> **Echtzeit-Beispiel:** Ticket 1 hat 2 Bier, Ticket 2 hat 4 Bier → `total: 6`.  
> Wird Ticket 2 gedruckt und erledigt → `total: 2`.

---

### 🔒 GET `/api/print-jobs/pending`
Offene Druckaufträge für den Print-Agent.

**Response:**
```json
[
  {
    "id": 3,
    "ticket_id": 1,
    "table_number": "7",
    "payload": {
      "ticket_number": "B042",
      "station_name": "Küche",
      "items": [...]
    }
  }
]
```

---

### 🔒 POST `/api/print-jobs/:id/complete`
Druckauftrag als erledigt markieren.

---

## 6. WebSocket & Echtzeit

### Verbindung aufbauen

```
wss://kds-worker.DEIN-NAME.workers.dev/ws?station=1
wss://kds-worker.DEIN-NAME.workers.dev/ws?station=all
```

Der `station`-Parameter bestimmt, welchem Durable-Object-Room der Client beitritt. `all` erhält alle Events.

### Event-Typen

| `type` | Wann | Payload |
|---|---|---|
| `ticket_created` | Neues Ticket | `{ ticket }` |
| `ticket_printed` | Druckauftrag gestartet | `{ ticketId }` |
| `ticket_done` | Ticket abgeschlossen | `{ ticketId }` |
| `pong` | Antwort auf Ping | – |

### Keep-Alive

Der Browser sendet alle 25 Sekunden ein Ping:
```json
{ "type": "ping" }
```
Der Server antwortet:
```json
{ "type": "pong" }
```

### Reconnect-Logik

Bei Verbindungsabbruch versucht der Browser automatisch nach 3 Sekunden neu zu verbinden.

---

## 7. Küchenmonitor-UI

### Bestellungsansicht

Zeigt alle offenen Bons als Karten, sortiert nach Wartezeit (älteste zuerst).

**Wartezeit-Farben:**
| Zeit | Farbe | Bedeutung |
|---|---|---|
| < 8 min | Grau | Normal |
| 8–14 min | Amber | Achtung |
| ≥ 15 min | Rot | Dringend |

**Aktionen pro Karte:**
- **Drucken** → sendet `POST /api/tickets/:id/print`, Karte wird blau markiert
- **✓ (Erledigt)** → sendet `POST /api/tickets/:id/done`, Karte verschwindet

### Produktansicht

Gruppiert alle offenen Positionen nach Produktname. Zeigt Gesamtmenge und Aufschlüsselung pro Tisch.

### Sidebar – Live-Summen

Zeigt in Echtzeit die Gesamtmenge jedes Produkts über alle offenen Tickets. Pulsiert kurz bei Änderung. Zähler am unteren Rand zeigt Anzahl offener Bons.

### Station-Filter

Oben links: Alle Stationen oder eine spezifische Station. Filtert Tickets, Summen und WebSocket-Room gleichzeitig.

---

## 8. Print-Agent (Raspberry Pi)

### Voraussetzungen
- Node.js ≥ 18
- Netzwerkdrucker mit ESC/POS-Unterstützung (TCP Port 9100)
- Selbes WLAN/LAN wie der Drucker

### Installation
```bash
cd print-agent
npm install node-thermal-printer
```

### Konfiguration (Umgebungsvariablen)

| Variable | Standard | Beschreibung |
|---|---|---|
| `KDS_WORKER_URL` | – | URL des Cloudflare Workers |
| `KDS_API_KEY` | – | API-Schlüssel (via `wrangler secret put API_KEY`) |
| `PRINTER_IP` | `192.168.1.100` | IP-Adresse des Druckers |
| `PRINTER_PORT` | `9100` | TCP-Port des Druckers |

### Verhalten

1. Pollt alle **3 Sekunden** `/api/print-jobs/pending`
2. Für jeden Job: druckt ESC/POS-Bon über TCP
3. Markiert Job als `done` via `/api/print-jobs/:id/complete`
4. WebSocket-Broadcast informiert alle Clients über den Druckvorgang

### Bon-Aufbau (ESC/POS)
```
══════════════════════
      KÜCHE
──────────────────────
Tisch: 7
Bon:   #B042
Zeit:  14:32
──────────────────────
 2x  Bier
 1x  Schnitzel
      → ohne Pommes
──────────────────────
Gedruckt: 14:32:55
[CUT]
```

---

## 9. Versionsverwaltung & Deploy

### version.json

Zentraler Ort für die aktuelle Versionsnummer:

```json
{
  "version": "1.0.0",
  "build":   "20260412-001",
  "date":    "2026-04-12",
  "notes":   "Was wurde in dieser Version geändert"
}
```

**Versionsschema (Semantic Versioning):**

| Typ | Wann erhöhen | Beispiel |
|---|---|---|
| MAJOR (x.0.0) | Breaking Changes, komplette Umstrukturierung | `1.0.0 → 2.0.0` |
| MINOR (0.x.0) | Neue Funktionen, rückwärtskompatibel | `1.0.0 → 1.1.0` |
| PATCH (0.0.x) | Bugfixes, kleine Anpassungen | `1.0.0 → 1.0.1` |

### Deploy-Workflow

```bash
# 1. version.json aktualisieren
#    → version, build, date, notes anpassen

# 2. Pre-Deploy-Check ausführen (automatisch via npm run deploy)
node pre-deploy.js

# 3. Deploy (ruft pre-deploy.js automatisch auf)
npm run deploy

# 4. Datenbank-Änderungen (nur bei Schema-Änderungen nötig)
npm run db:init
```

### Pre-Deploy-Check prüft:
- ✅ Versionsnummer wurde seit letztem Deploy erhöht
- ✅ Versionsdatum ist aktuell
- ✅ Release-Notes vorhanden
- ✅ Semver-Format korrekt (MAJOR.MINOR.PATCH)
- ✅ D1 database_id eingetragen (kein Platzhalter)
- ✅ Keine `DEIN_`-Platzhalter in Source-Files
- ✅ Alle Pflichtdateien vorhanden

### Bypass (nur im Notfall)
```bash
npm run deploy:force   # Überspringt pre-deploy.js
```

---

## 10. Troubleshooting

### WebSocket verbindet sich nicht
- Prüfen ob Worker deployed ist: `wrangler tail`
- Durable Objects brauchen `nodejs_compat` – in `wrangler.toml` prüfen
- Browser-Konsole auf WSS-Fehler prüfen

### Print-Agent druckt nicht
- Drucker-IP mit `ping 192.168.1.100` testen
- Port 9100 offen: `nc -zv 192.168.1.100 9100`
- API-Key stimmt mit `wrangler secret put API_KEY` überein
- Logs prüfen: `node index.js` – Fehler werden ausgegeben

### D1 Fehler beim ersten Deploy
```bash
# database_id fehlt in wrangler.toml:
wrangler d1 create kds-db
# → ID in wrangler.toml eintragen, dann:
npm run db:init
```

### Tickets erscheinen nicht in Echtzeit
- WebSocket-Status-Punkt oben rechts: grün = verbunden
- Falls rot: Browser-Reload, dann reconnectet automatisch
- Falls Problem anhält: `wrangler tail` für Server-Logs

### Pre-Deploy schlägt fehl: "Version bereits deployed"
```json
// version.json – PATCH erhöhen:
{ "version": "1.0.1", "date": "2026-04-13", "notes": "Bugfix: ..." }
```

---

## 11. Changelog

### v1.0.0 – 2026-04-12
- 🎉 Initiales Release
- Tickets erstellen, anzeigen, drucken, abhaken
- Bestellungs- und Produktansicht
- WebSocket-Echtzeit via Durable Objects
- Live-Summen-Sidebar mit Auto-Korrektur
- Multi-Station-Unterstützung
- Raspberry Pi Print-Agent (ESC/POS)
- D1 Datenbank (tickets, items, stations, print_jobs)
- R2 Bucket (vorbereitet)
- Pre-Deploy-Check mit Versionsvalidierung
