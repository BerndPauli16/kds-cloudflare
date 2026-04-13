-- ════════════════════════════════════════════════
--  KDS – Küchenmonitor D1 Schema
--  Deployment: wrangler d1 execute kds-db --file=schema.sql
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  color      TEXT    DEFAULT '#f59e0b',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tickets (Bons)
CREATE TABLE IF NOT EXISTS tickets (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_number  TEXT    NOT NULL,
  table_number   TEXT,
  station_id     INTEGER,
  status         TEXT    DEFAULT 'open',   -- open | printing | done
  show_extras    INTEGER DEFAULT 1,        -- 0 = Extras ausblenden
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  printed_at     DATETIME,
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

-- Positionen pro Ticket
CREATE TABLE IF NOT EXISTS ticket_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id    INTEGER NOT NULL,
  product_name TEXT    NOT NULL,
  quantity     INTEGER NOT NULL DEFAULT 1,
  extras       TEXT    DEFAULT '[]',  -- JSON Array: ["ohne Zwiebeln", ...]
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Druck-Jobs (für den Raspberry Pi Print-Agent)
CREATE TABLE IF NOT EXISTS print_jobs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id    INTEGER NOT NULL,
  payload      TEXT    NOT NULL,  -- JSON mit Ticket-Daten für ESC/POS
  status       TEXT    DEFAULT 'pending',  -- pending | printing | done | failed
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

-- Demo-Daten
INSERT OR IGNORE INTO stations (id, name, color) VALUES
  (1, 'Küche',         '#f59e0b'),
  (2, 'Bar',           '#3b82f6'),
  (3, 'Getränkestand', '#10b981');
