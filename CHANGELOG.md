# KDS Küchenmonitor – Changelog

## v1.2.0 – 2026-04-15

### 🐛 Bugfixes
- **Doppeldruck behoben** – Beide Pis holten alle Jobs. Fix: jeder Pi pollt nur `?station=X`-eigene Jobs
- **Falsche Drucker-IP** – Config-Polling las globalen Key statt stationsspezifischem. Fix: Pi übergibt `?station=X` beim Config-Abruf
- **Drucker-Timeout 5s → 8s** – ESC/POS-Daten kamen bei langsamem Drucker zu spät → Fallback auf Auto-Discovery
- **Auto-Discovery überschrieb Config** – Scan-Ergebnis wurde in DB zurückgeschrieben und überschrieb manuelle Einstellung. Behoben
- **Doppelte nftables-Regel** – Port-80-Redirect war 2x eingetragen. Bereinigt + persistent gespeichert
- **cloudflared QUIC blockiert** – monitor1: UDP/QUIC im Netzwerk blockiert. Fix: `--protocol http2` erzwungen
- **monitor1 IP-Wechsel (DHCP)** – IP wechselte .70 → .100. Agent-IP in DB aktualisiert; Monitor zeigt immer aktuelle IP
- **Duplikat-Tickets** – asello-Fehlkonfiguration schickte Bon an beide Pis. Fix: Worker ignoriert Duplikate (gleiche ticket_number + station_id)
- **Config-Änderungen nicht sofort wirksam** – UI speicherte in stationsspezifischen Key, Pi las globalen Key. Jetzt konsistent
- **ws-Package Delay** – WebSocket-Package wurde beim ersten Start auto-installiert (10s). Fix: ws jetzt fix in package.json

### ✨ Features
- **Pi-Offline-Anzeige** – Zahnrad blinkt rot + „OFFLINE" wenn Heartbeat >90s
- **Heartbeat alle 30s** – Pi meldet IP+Hostname; Header zeigt immer aktuelle Pi-IP
- **DB-Cleanup täglich** – 03:00 UTC: Tickets/Jobs/Items/Bon-Logs >24h werden gelöscht. Manuell: `POST /api/admin/cleanup`
- **WebSocket Push** – Pi hält WS-Verbindung zum Worker. Druckauftrag wird sofort gepusht (~50ms)
- **Self-Update package.json** – Self-Update prüft auch package.json und führt `npm install` bei neuen Packages aus
- **Stationen umbenannt** – Schankmonitor (#1), Küchenmonitor (#2), To Go (#3)

### ⚡ Performance
- **Poll-Intervall 3s → 1s** – Max. Druckverzögerung halbiert
- **Config-Reload 5s → 30s** – 6x weniger Worker-Requests pro Minute
- **WebSocket Push** – Direktdruck ~50ms statt bis zu 1s

---

## v1.0.0 – 2026-04-12 (Initiales Release)

- Cloudflare Worker mit D1, R2, Durable Objects (WebSocket-Echtzeit)
- Raspberry Pi Print-Agent: ePOS-Proxy, ESC/POS-Parser, Job-Poller
- Custom Domains: monitor1.team24.training, monitor2.team24.training
- Auto-Deploy GitHub → Cloudflare Build
- Self-Update: Pi holt Code alle 5 Min von GitHub
- Bon-Log, virtuelle Bon-Vorschau, Verlauf-Tab mit Filtern
- Bonierbon-Parser (asello ePOS XML), Backup-Drucker + Auto-Discovery

---

## System-Übersicht

### Infrastruktur
| Komponente | Wert |
|---|---|
| Cloudflare Worker | kds-cloudflare |
| Custom Domains | monitor1.team24.training, monitor2.team24.training |
| D1 Datenbank | kds-db (b76c3d0e-43ec-42cb-9a63-bd3d68c92b15) |
| R2 Storage | kds-storage |
| Account-ID | f1c8788eb10870b12ac498a71b81d1f3 |
| API-Key | kds-smarte-events-2026 |
| GitHub Repo | BerndPauli16/kds-cloudflare |

### Raspberry Pis
| | monitor1 | monitor2 |
|---|---|---|
| Name | Schankmonitor | Küchenmonitor |
| Hostname | schankmonitor | monitor2 |
| User / PW | schankmonitor / So01012022 | monitor2 / So01012022 |
| Station-ID | 1 | 2 |
| Drucker-IP | 192.168.192.136 | 192.168.192.127 |
| Proxy-Port | 8009 (Port 80 via nftables) | 8009 (Port 80 via nftables) |
| Tunnel | kds-printer-tunnel (http2) | kds-monitor2-tunnel |
| IP | DHCP – im Monitor ablesen | 192.168.192.232 (DHCP) |

### Nächste Schritte (offen)
- [ ] Auto-Print – Bon automatisch drucken ohne manuellen Klick
- [ ] Stale-Jobs – Pending-Jobs >10min automatisch zurücksetzen
