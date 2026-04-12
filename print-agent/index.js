#!/usr/bin/env node
// ════════════════════════════════════════════════
//  KDS Print-Agent – Raspberry Pi
//
//  Zwei Aufgaben:
//  1. TCP-Proxy: POS → Pi:9100 → Drucker:9100
//     (Pi gibt sich als Drucker aus)
//  2. ESC/POS Parser: extrahiert Klartext
//     und schickt Ticket an Cloudflare Worker
//
//  Umgebungsvariablen (oder .env):
//    PRINTER_IP       IP des echten Druckers
//    PRINTER_PORT     Port des Druckers (default 9100)
//    PROXY_PORT       Port auf dem Pi horcht (default 9100)
//    KDS_WORKER_URL   https://kds-cloudflare.XXX.workers.dev
//    KDS_API_KEY      API-Key für den Worker
// ════════════════════════════════════════════════

require('dotenv').config();
const net  = require('net');
const http = require('http');

const CFG = {
  printerIp:   process.env.PRINTER_IP      || '192.168.1.100',
  printerPort: parseInt(process.env.PRINTER_PORT)  || 9100,
  proxyPort:   parseInt(process.env.PROXY_PORT)    || 9100,
  workerUrl:   process.env.KDS_WORKER_URL  || '',
  apiKey:      process.env.KDS_API_KEY     || '',
  station:     process.env.KDS_STATION     || 'Küche',
  stationId:   parseInt(process.env.KDS_STATION_ID) || 1,
};

let jobCounter = 0;

// ════════════════════════════════════════════════
//  1. TCP-PROXY SERVER
// ════════════════════════════════════════════════
const server = net.createServer((posSocket) => {
  const clientIp = posSocket.remoteAddress;
  console.log(`[PROXY] Verbindung von ${clientIp}`);

  // Verbindung zum echten Drucker öffnen
  const printerSocket = new net.Socket();
  const chunks = [];

  printerSocket.connect(CFG.printerPort, CFG.printerIp, () => {
    console.log(`[PROXY] Verbunden mit Drucker ${CFG.printerIp}:${CFG.printerPort}`);
  });

  // POS → Pi → Drucker (rohe Bytes 1:1 durchleiten)
  posSocket.on('data', (data) => {
    chunks.push(data);           // Für Parser speichern
    printerSocket.write(data);   // Direkt an Drucker weiterleiten
  });

  // Drucker → Pi → POS (Antworten zurückleiten, z.B. Status)
  printerSocket.on('data', (data) => {
    posSocket.write(data);
  });

  // Verbindung geschlossen: gesammelten Job parsen + an Worker schicken
  posSocket.on('end', () => {
    console.log(`[PROXY] POS-Verbindung beendet`);
    printerSocket.end();

    if (CFG.workerUrl && chunks.length > 0) {
      const raw = Buffer.concat(chunks);
      parseAndForward(raw);
    }
  });

  // Fehlerbehandlung
  posSocket.on('error',    (e) => console.error('[PROXY] POS-Fehler:', e.message));
  printerSocket.on('error',(e) => console.error('[PROXY] Drucker-Fehler:', e.message));

  printerSocket.on('close', () => posSocket.destroy());
  posSocket.on('close',     () => printerSocket.destroy());
});

server.listen(CFG.proxyPort, '0.0.0.0', () => {
  console.log(`[PROXY] Horcht auf Port ${CFG.proxyPort}`);
  console.log(`[PROXY] Leite weiter an ${CFG.printerIp}:${CFG.printerPort}`);
});

// ════════════════════════════════════════════════
//  2. ESC/POS PARSER → Cloudflare Worker
// ════════════════════════════════════════════════

// Alle ESC/POS-Steuerzeichen entfernen → reinen Text extrahieren
function stripEscPos(buf) {
  const lines = [];
  let current = '';
  let i = 0;

  while (i < buf.length) {
    const b = buf[i];

    // ESC-Sequenzen überspringen
    if (b === 0x1b) {
      i++;
      if (i >= buf.length) break;
      const next = buf[i];

      // ESC @ (Init), ESC a n (Align), ESC ! n (Font) usw. → überspringen
      if ([0x40, 0x61, 0x21, 0x45, 0x47, 0x4d, 0x52, 0x74, 0x7b].includes(next)) {
        i += 2; continue;
      }
      // ESC * (Bitmap) → viele Bytes
      if (next === 0x2a) { i += 4; continue; }
      i++; continue;
    }

    // GS-Sequenzen überspringen
    if (b === 0x1d) {
      i += 3; continue;
    }

    // DLE, STX, ETX, ENQ usw.
    if (b < 0x20 && b !== 0x0a && b !== 0x0d) { i++; continue; }

    // Zeilenumbruch
    if (b === 0x0a || b === 0x0d) {
      const trimmed = current.trim();
      if (trimmed) lines.push(trimmed);
      current = '';
      i++; continue;
    }

    current += String.fromCharCode(b);
    i++;
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

// Aus Textzeilen ein strukturiertes Ticket bauen
function parseTicket(lines) {
  let tableNumber  = null;
  let ticketNumber = null;
  const items      = [];

  for (const line of lines) {
    // Tisch erkennen (z.B. "Tisch 5", "Table 3", "Tisch: 12")
    const tischMatch = line.match(/(?:tisch|table)[:\s#]*(\d+)/i);
    if (tischMatch) { tableNumber = tischMatch[1]; continue; }

    // Bon-Nummer (z.B. "Bon #42", "#0042", "Nr. 15")
    const bonMatch = line.match(/(?:bon|nr|#)[:\s#]*(\d+)/i) || line.match(/^#(\d+)/);
    if (bonMatch) { ticketNumber = bonMatch[1]; continue; }

    // Artikel erkennen (z.B. "2x Bier", "1 Schnitzel", "3  Cola")
    const itemMatch = line.match(/^(\d+)\s*[xX×]?\s+(.+)$/);
    if (itemMatch) {
      const qty  = parseInt(itemMatch[1]);
      const name = itemMatch[2].trim();
      if (qty > 0 && qty < 100 && name.length > 0 && name.length < 60) {
        items.push({ product_name: name, quantity: qty, extras: [] });
      }
    }
  }

  return { tableNumber, ticketNumber, items };
}

async function parseAndForward(rawBuf) {
  const lines  = stripEscPos(rawBuf);
  const parsed = parseTicket(lines);

  // Kein erkennbarer Inhalt → überspringen
  if (parsed.items.length === 0 && !parsed.tableNumber) {
    console.log('[PARSER] Kein auswertbarer Inhalt erkannt, übersprungen');
    return;
  }

  jobCounter++;
  const ticketId = `PI-${Date.now()}-${jobCounter}`;

  const body = {
    ticket_number: parsed.ticketNumber || ticketId,
    table_number:  parsed.tableNumber  || '?',
    station_id:    CFG.stationId,
    items:         parsed.items.length > 0
      ? parsed.items
      : [{ product_name: lines.slice(0, 3).join(' / '), quantity: 1, extras: [] }],
  };

  console.log(`[PARSER] Ticket: Tisch ${body.table_number} | ${body.items.length} Artikel`);

  try {
    const url  = `${CFG.workerUrl}/api/tickets`;
    const res  = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key':    CFG.apiKey,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log(`[WORKER] Ticket erstellt:`, data.id || data);
  } catch (err) {
    console.error('[WORKER] Fehler beim Weiterleiten:', err.message);
  }
}

// ════════════════════════════════════════════════
//  Start-Info
// ════════════════════════════════════════════════
console.log('╔══════════════════════════════════════╗');
console.log('║   KDS Print-Agent – Raspberry Pi     ║');
console.log('╚══════════════════════════════════════╝');
console.log(`Proxy Port : ${CFG.proxyPort}`);
console.log(`Drucker    : ${CFG.printerIp}:${CFG.printerPort}`);
console.log(`Station    : ${CFG.station} (ID: ${CFG.stationId})`);
console.log(`Worker     : ${CFG.workerUrl || '(nicht konfiguriert)'}`);
console.log('');
