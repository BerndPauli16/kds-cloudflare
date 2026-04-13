#!/usr/bin/env node
// ════════════════════════════════════════════════
//  KDS Print-Agent – Raspberry Pi
//  TCP-Proxy: POS → Pi:9100 → Drucker:9100
//  Parser:    ESC/POS Text → Cloudflare Worker
// ════════════════════════════════════════════════

require('dotenv').config();
const net = require('net');

const CFG = {
  printerIp:    process.env.PRINTER_IP       || '192.168.1.100',
  printerPort:  parseInt(process.env.PRINTER_PORT)  || 9100,
  proxyPort:    parseInt(process.env.PROXY_PORT)    || 9100,
  workerUrl:    (process.env.KDS_WORKER_URL  || '').replace(/\/$/, ''),
  apiKey:       process.env.KDS_API_KEY      || '',
  stationId:    parseInt(process.env.KDS_STATION_ID) || 1,
};

let jobCounter = 0;

// ════════════════════════════════════════════════
//  TCP-PROXY
// ════════════════════════════════════════════════
const server = net.createServer((posSocket) => {
  console.log(`[PROXY] Verbindung von ${posSocket.remoteAddress}`);
  const chunks = [];

  const printerSocket = new net.Socket();
  printerSocket.connect(CFG.printerPort, CFG.printerIp, () => {
    console.log(`[PROXY] → Drucker ${CFG.printerIp}:${CFG.printerPort}`);
  });

  // Bytes 1:1 durchleiten UND für Parser sammeln
  posSocket.on('data', (data) => {
    chunks.push(data);
    printerSocket.write(data);
  });

  printerSocket.on('data', (data) => posSocket.write(data));

  posSocket.on('end', () => {
    printerSocket.end();
    if (CFG.workerUrl && chunks.length > 0) {
      const raw = Buffer.concat(chunks);
      parseAndForward(raw).catch(e => console.error('[PARSER] Fehler:', e.message));
    }
  });

  posSocket.on('error',     e => console.error('[POS]     Fehler:', e.message));
  printerSocket.on('error', e => console.error('[DRUCKER] Fehler:', e.message));
  printerSocket.on('close', () => posSocket.destroy());
  posSocket.on('close',     () => printerSocket.destroy());
});

server.listen(CFG.proxyPort, '0.0.0.0', () => {
  console.log(`[PROXY] Horcht auf Port ${CFG.proxyPort}`);
});

// ════════════════════════════════════════════════
//  ESC/POS → Klartext
//  Entfernt alle Steuerzeichen, gibt Zeilen zurück
// ════════════════════════════════════════════════
function escposToLines(buf) {
  let i = 0;
  let current = '';
  const lines = [];

  while (i < buf.length) {
    const b = buf[i];

    // ESC-Sequenzen (1b xx [optional n])
    if (b === 0x1b) {
      i++;
      if (i >= buf.length) break;
      const cmd = buf[i]; i++;
      // Befehle mit einem weiteren Byte
      if ([0x21,0x2d,0x45,0x47,0x4d,0x52,0x61,0x74,0x7b].includes(cmd)) { i++; }
      // ESC * (Bitmap): n1 n2 data
      else if (cmd === 0x2a && i+1 < buf.length) {
        const n2 = buf[i+1]; i += 2 + (n2 * 3);
      }
      continue;
    }

    // GS-Sequenzen (1d)
    if (b === 0x1d) { i += 4; continue; }

    // Steuerzeichen außer LF/CR
    if (b < 0x20 && b !== 0x0a && b !== 0x0d) { i++; continue; }

    if (b === 0x0a || b === 0x0d) {
      const line = current.trimEnd();
      if (line.length > 0) lines.push(line);
      current = '';
      i++; continue;
    }

    current += String.fromCharCode(b);
    i++;
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

// ════════════════════════════════════════════════
//  Parser: erkennt das Format
//
//  --------------------------------
//  SMARTE EVENTS
//  Ihr Partner für Events
//  --------------------------------
//  Datum: xx.xx.xxxx   Uhrzeit: xx:xx
//  --------------------------------
//  ARTIKEL              MENGE
//  --------------------------------
//  Bier                   2
//  Spritzer               5
//  --------------------------------
//  GESAMT ARTIKEL:       7
//  --------------------------------
//  Vielen Dank!
//  --------------------------------
// ════════════════════════════════════════════════
function parseTicket(lines) {
  const items      = [];
  let tableNumber  = null;
  let ticketNumber = null;
  let inItemBlock  = false;
  let datum        = null;
  let uhrzeit      = null;

  for (const line of lines) {
    // Trennlinien überspringen
    if (/^[-─═=\s]{4,}$/.test(line)) continue;

    // Tisch-Nummer (falls vorhanden, z.B. "Tisch: 5" oder "Tisch 3")
    const tischM = line.match(/tisch[:\s#]*(\d+)/i);
    if (tischM) { tableNumber = tischM[1]; continue; }

    // Bon-/Rechnungsnummer
    const bonM = line.match(/(?:bon|rechnung|beleg|nr)[.:\s#]*(\d+)/i);
    if (bonM) { ticketNumber = bonM[1]; continue; }

    // Datum und Uhrzeit
    const datumM = line.match(/datum[:\s]*([\d.]+)/i);
    if (datumM) { datum = datumM[1]; }
    const zeitM = line.match(/uhrzeit[:\s]*([\d:]+)/i);
    if (zeitM) { uhrzeit = zeitM[1]; }

    // Beginn des Artikel-Blocks
    if (/^ARTIKEL\s+MENGE/i.test(line)) { inItemBlock = true; continue; }

    // Ende des Artikel-Blocks
    if (/^GESAMT/i.test(line)) { inItemBlock = false; continue; }

    // Artikel-Zeile: "Produktname        Menge"
    // Produktname links, Menge (Zahl) rechts durch mind. 2 Leerzeichen getrennt
    if (inItemBlock) {
      const itemM = line.match(/^(.+?)\s{2,}(\d+)\s*$/);
      if (itemM) {
        const name = itemM[1].trim();
        const qty  = parseInt(itemM[2]);
        if (name.length > 0 && name.length < 60 && qty > 0 && qty < 10000) {
          items.push({ product_name: name, quantity: qty, extras: [] });
        }
      }
    }
  }

  // Erste sinnvolle Textzeile = Absender (z.B. "KELLNER MAX", "KASSE 1", "TO GO")
  const senderName = lines.find(l =>
    l.length > 2 &&
    !/^[-─═=\s]{2,}$/.test(l) &&
    !/ARTIKEL|MENGE|GESAMT|DATUM|UHRZEIT|VIELEN|DANK/i.test(l) &&
    !/^\d/.test(l)
  ) || null;

  return { items, tableNumber, ticketNumber, datum, uhrzeit, senderName };
}

// ════════════════════════════════════════════════
//  Parsed Ticket → Cloudflare Worker
// ════════════════════════════════════════════════
async function parseAndForward(rawBuf) {
  const lines  = escposToLines(rawBuf);
  const parsed = parseTicket(lines);

  if (parsed.items.length === 0) {
    console.log('[PARSER] Keine Artikel gefunden – übersprungen');
    return;
  }

  jobCounter++;
  const ticketId = parsed.ticketNumber || `PI-${Date.now()}-${jobCounter}`;

  const body = {
    ticket_number: ticketId,
    table_number:  parsed.tableNumber || '–',
    station_id:    CFG.stationId,
    items:         parsed.items,
  };

  console.log(`[PARSER] Ticket #${ticketId} | Tisch ${body.table_number} | ${body.items.length} Artikel:`);
  parsed.items.forEach(i => console.log(`         ${i.quantity}× ${i.product_name}`));

  try {
    const res = await fetch(`${CFG.workerUrl}/api/tickets`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': CFG.apiKey },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`[WORKER] ✓ Ticket erstellt (ID: ${data.id})`);
    } else {
      console.error(`[WORKER] ✗ Fehler:`, data.error || data);
    }
  } catch (err) {
    console.error('[WORKER] ✗ Netzwerkfehler:', err.message);
  }
}

// ════════════════════════════════════════════════
//  Start
// ════════════════════════════════════════════════
console.log('╔══════════════════════════════════════╗');
console.log('║   KDS Print-Agent – Raspberry Pi     ║');
console.log('╚══════════════════════════════════════╝');
console.log(`Proxy Port : ${CFG.proxyPort}`);
console.log(`Drucker    : ${CFG.printerIp}:${CFG.printerPort}`);
console.log(`Worker     : ${CFG.workerUrl || '(nicht konfiguriert)'}`);
console.log('');

// ════════════════════════════════════════════════
//  3. JOB POLLER – holt KDS-Druckjobs + druckt
//  (für Drucken/Teildruck-Button im Monitor)
// ════════════════════════════════════════════════

// ESC/POS Hilfsfunktionen (raw TCP, kein npm-Paket nötig)
const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

function escBuf(...bytes) { return Buffer.from(bytes); }

function buildTicketBuffer(p) {
  const parts = [];

  const line  = () => parts.push(Buffer.from('--------------------------------\n'));
  const br    = () => parts.push(Buffer.from('\n'));
  const txt   = (s) => parts.push(Buffer.from(s + '\n', 'utf8'));

  // Init + Zeichensatz UTF-8
  parts.push(escBuf(ESC, 0x40));           // ESC @ – Init
  parts.push(escBuf(ESC, 0x74, 0x11));     // ESC t 17 – UTF-8 Code Page

  // ── Kopfzeile ────────────────────────────────
  parts.push(escBuf(ESC, 0x61, 0x01));     // Zentriert
  parts.push(escBuf(ESC, 0x45, 0x01));     // Bold ON
  txt(p.station_name || 'BESTELLUNG');
  parts.push(escBuf(ESC, 0x45, 0x00));     // Bold OFF
  line();

  parts.push(escBuf(ESC, 0x61, 0x00));     // Links
  parts.push(escBuf(GS,  0x21, 0x22));     // 3x Breite + 3x Höhe
  parts.push(escBuf(ESC, 0x45, 0x01));     // Bold ON
  txt(`Tisch ${p.table_number || '–'}`);
  parts.push(escBuf(ESC, 0x45, 0x00));     // Bold OFF
  parts.push(escBuf(GS,  0x21, 0x00));     // Normal
  txt(`Bon:   #${p.ticket_number}`);
  const orderTime = new Date(p.created_at || p.printed_at || Date.now());
  const printTime = new Date(p.printed_at || Date.now());
  txt(`Zeit:  ${time.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}`);
  line();

  // ── Artikel (jetzt gedruckt) ─────────────────
  for (const item of (p.items || [])) {
    parts.push(escBuf(ESC, 0x45, 0x01));   // Bold ON
    parts.push(escBuf(GS,  0x21, 0x11));   // Doppelte Größe
    txt(`${String(item.quantity).padStart(2)}x  ${item.product_name}`);
    parts.push(escBuf(GS,  0x21, 0x00));   // Normal
    parts.push(escBuf(ESC, 0x45, 0x00));   // Bold OFF

    if (item.extras && item.extras.length) {
      for (const extra of item.extras) {
        txt(`      \u2192 ${extra}`);
      }
    }
  }

  // ── VON-Sektion (nur bei Teildruck) ──────────
  if (p.partial && p.all_items && p.all_items.length > 0) {
    line();
    parts.push(escBuf(ESC, 0x61, 0x01));   // Zentriert
    parts.push(escBuf(ESC, 0x45, 0x01));   // Bold ON
    parts.push(escBuf(GS,  0x21, 0x11));   // Doppelte Größe
    txt(p.is_last ? 'DER REST VON' : 'EIN TEIL VON');
    parts.push(escBuf(GS,  0x21, 0x00));   // Normal
    parts.push(escBuf(ESC, 0x45, 0x00));   // Bold OFF
    parts.push(escBuf(ESC, 0x61, 0x00));   // Links
    line();

    for (const item of p.all_items) {
      txt(`${String(item.quantity).padStart(2)}x  ${item.product_name}`);
      if (item.extras && item.extras.length) {
        for (const extra of item.extras) {
          txt(`      \u2192 ${extra}`);
        }
      }
    }
  }

  // ── Fußzeile ─────────────────────────────────
  line();
  parts.push(escBuf(ESC, 0x61, 0x01));     // Zentriert
  txt(`Gedruckt: ${time.toLocaleTimeString('de-AT')}`);
  br(); br(); br();
  parts.push(escBuf(GS, 0x56, 0x42, 0x00)); // Vollschnitt

  return Buffer.concat(parts);
}

function sendToPrinter(buf) {
  return new Promise((resolve, reject) => {
    const sock = new net.Socket();
    const timer = setTimeout(() => { sock.destroy(); reject(new Error('Drucker Timeout')); }, 6000);

    sock.connect(CFG.printerPort, CFG.printerIp, () => {
      sock.write(buf, () => { clearTimeout(timer); sock.end(); resolve(); });
    });
    sock.on('error', e => { clearTimeout(timer); reject(e); });
  });
}

async function pollJobs() {
  if (!CFG.workerUrl) return;
  try {
    const res  = await fetch(`${CFG.workerUrl}/api/print-jobs/pending`, {
      headers: { 'X-API-Key': CFG.apiKey },
    });
    if (!res.ok) return;

    const jobs = await res.json();
    for (const job of jobs) {
      console.log(`[JOB ${job.id}] Drucke #${job.payload.ticket_number}${job.payload.partial ? ' (Teildruck)' : ''}…`);
      try {
        await sendToPrinter(buildTicketBuffer(job.payload));
        await fetch(`${CFG.workerUrl}/api/print-jobs/${job.id}/complete`, {
          method: 'POST',
          headers: { 'X-API-Key': CFG.apiKey },
        });
        console.log(`[JOB ${job.id}] ✓ Gedruckt`);
      } catch (e) {
        console.error(`[JOB ${job.id}] ✗ Fehler:`, e.message);
      }
    }
  } catch (e) {
    console.error('[POLLER] Fehler:', e.message);
  }
}

if (CFG.workerUrl && CFG.apiKey) {
  console.log(`[POLLER] Startet – alle 3s`);
  pollJobs();
  setInterval(pollJobs, 3000);
} else {
  console.log('[POLLER] Kein Worker-URL/API-Key – Poller deaktiviert');
}
