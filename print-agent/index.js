#!/usr/bin/env node
// ════════════════════════════════════════════════
//  KDS Print-Agent – Raspberry Pi
//  HTTP-Proxy: ePOS (asello) → Pi:8009 → Drucker
//  TCP-Proxy:  RAW ESC/POS   → Pi:8009 → Drucker
// ════════════════════════════════════════════════

require('dotenv').config();
const net  = require('net');
const http = require('http');

const CFG = {
  printerIp:    process.env.PRINTER_IP       || '192.168.1.100',
  printerPort:  parseInt(process.env.PRINTER_PORT)  || 9100,
  proxyPort:    parseInt(process.env.PROXY_PORT)    || 9100,
  workerUrl:    (process.env.KDS_WORKER_URL  || '').replace(/\/$/, ''),
  apiKey:       process.env.KDS_API_KEY      || '',
  stationId:    parseInt(process.env.KDS_STATION_ID) || 1,
  charsPerLine: 42,
  paused: false,
};

let jobCounter = 0;

// ═══════════════════════════════════════════════
//  ePOS XML → ESC/POS Buffer konvertieren
// ═══════════════════════════════════════════════
function eposXmlToEscpos(xmlStr) {
  const ESC = 0x1b, GS = 0x1d, LF = 0x0a;
  const parts = [Buffer.from([ESC, 0x40])]; // Init

  // Texte aus <text>...</text> extrahieren
  const textMatches = xmlStr.match(/<text[^>]*>([\s\S]*?)<\/text>/gi) || [];
  for (const m of textMatches) {
    const inner = m.replace(/<[^>]+>/g, '')
      .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')
      .replace(/&#10;/g,'\n').replace(/&#13;/g,'\r');
    parts.push(Buffer.from(inner, 'utf8'));
  }

  // Cut-Befehl
  parts.push(Buffer.from([GS, 0x56, 0x42, 0x00]));
  return Buffer.concat(parts);
}

// ═══════════════════════════════════════════════
//  ESC/POS direkt zum Drucker schicken
// ═══════════════════════════════════════════════
function sendToPrinterRaw(buf) {
  return new Promise((resolve, reject) => {
    const sock = new net.Socket();
    const timer = setTimeout(() => { sock.destroy(); reject(new Error('Drucker Timeout')); }, 6000);
    sock.connect(CFG.printerPort, CFG.printerIp, () => {
      sock.write(buf, () => { clearTimeout(timer); sock.end(); resolve(); });
    });
    sock.on('error', e => { clearTimeout(timer); reject(e); });
  });
}

// ═══════════════════════════════════════════════
//  HTTP-Server für ePOS-Requests (asello)
// ═══════════════════════════════════════════════
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, SOAPAction',
  'Access-Control-Allow-Private-Network': 'true',
};

const httpServer = http.createServer((req, res) => {
  let body = '';

  // OPTIONS Preflight (Private Network Access + CORS)
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { ...CORS_HEADERS, 'Content-Length': '0' });
    res.end();
    return;
  }

  req.on('data', chunk => body += chunk.toString());
  req.on('end', async () => {
    console.log(`[ePOS] ${req.method} ${req.url}`);

    // ── TEST-PRINT Route ─────────────────────────
    if (req.url === '/test-print' && req.method === 'POST') {
      let cfg = {};
      try { cfg = JSON.parse(body); } catch(e) {}
      const cpl = parseInt(cfg.charsPerLine) || 42;
      console.log(`[TEST] Kalibrierungsdruck – ${cpl} Zeichen/Zeile`);
      const ESC = 0x1b, GS = 0x1d;
      const b = [];
      const add = (...bytes) => bytes.forEach(x => b.push(x));
      const txt = (s) => { for(const c of s) b.push(c.charCodeAt(0)&0xff); b.push(0x0a); };
      add(ESC,0x40); add(ESC,0x74,0x11);
      add(ESC,0x61,0x01); add(ESC,0x45,0x01); txt('=== KALIBRIERUNG ==='); add(ESC,0x45,0x00);
      add(ESC,0x61,0x00); txt('');
      const nums = '1234567890';
      // Größe A – Normal
      add(GS,0x21,0x00); txt('GROESSE A (1x Normal):');
      txt((nums.repeat(8)).substring(0,70)); txt('');
      // Größe B – 2x Breite
      add(GS,0x21,0x10); txt('GROESSE B (2x Breite):');
      txt((nums.repeat(4)).substring(0,35)); add(GS,0x21,0x00); txt('');
      // Größe C – 2x Breite+Höhe
      add(GS,0x21,0x11); txt('GROESSE C (3x):');
      txt((nums.repeat(3)).substring(0,22)); add(GS,0x21,0x00); txt('');
      txt('--------------------------------');
      txt('Zeichen in GROESSE A zaehlen:');
      txt('');
      txt('Zeichen/Zeile: [        ]');
      txt(''); txt(`Aktuell: ${cpl} Zeichen/Zeile`); txt('');
      add(GS,0x56,0x42,0x00);
      try {
        await sendToPrinterRaw(Buffer.from(b));
        console.log('[TEST] OK');
        const ok = JSON.stringify({ok:true});
        res.writeHead(200,{...CORS_HEADERS,'Content-Type':'application/json','Content-Length':String(ok.length)});
        res.end(ok);
      } catch(e) {
        console.error('[TEST] Fehler:', e.message);
        const err = JSON.stringify({ok:false,error:e.message});
        res.writeHead(500,{...CORS_HEADERS,'Content-Type':'application/json','Content-Length':String(err.length)});
        res.end(err);
      }
      return;
    }

    // Status-Anfrage (GET oder leerer POST)
    if (req.method === 'GET' || body.length < 20) {
      const resp = '<?xml version="1.0" encoding="utf-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Body><response xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print" success="true" code="SUCCESS" status="1814789376" battery="0"/></SOAP-ENV:Body></SOAP-ENV:Envelope>';
      res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'text/xml; charset=utf-8', 'Content-Length': Buffer.byteLength(resp), 'Connection': 'close' });
      res.end(resp);
      return;
    }

    // Druck-Anfrage (POST mit XML)
    console.log(`[ePOS] Druckjob empfangen (${body.length} bytes)`);


    // SOFORT antworten – asello nicht warten lassen
    const soapResp = '<?xml version="1.0" encoding="utf-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Body><response xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print" success="true" code="SUCCESS" status="1814789376" battery="0"/></SOAP-ENV:Body></SOAP-ENV:Envelope>';
    res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'text/xml; charset=utf-8', 'Content-Length': Buffer.byteLength(soapResp), 'Connection': 'close' });
    res.end(soapResp);

    // Nur noch KDS Worker — kein automatischer Druck mehr!
    setImmediate(async () => {
      if (CFG.workerUrl) {
        parseAndForward(Buffer.from(body)).catch(e => console.error('[PARSER]', e.message));
      }
    });
  });
});

httpServer.listen(CFG.proxyPort, '0.0.0.0', () => {
  console.log(`[ePOS]  HTTP-Proxy auf Port ${CFG.proxyPort}`);
});

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
function parseEposXml(xmlStr) {
  const items = [];
  let tableNumber = null, ticketNumber = null, datum = null, uhrzeit = null, senderName = null;

  // ── Format 1: Bonierbon (Küchen-/Schankbon) ──────────────────────────────
  // Erkennungsmerkmal: "Bonierbon" im Header
  if (xmlStr.includes('Bonierbon') || xmlStr.includes('bonierbon')) {
    // Bon-Nummer: <text>Nummer  R2026...</text>
    const numM = xmlStr.match(/Nummer\s+([A-Z0-9]+)/);
    if (numM) ticketNumber = numM[1];

    // Zeit + Datum: <text>16:51:44   14.04.2026</text>
    const timeM = xmlStr.match(/(\d{2}:\d{2}:\d{2})\s+(\d{2}\.\d{2}\.\d{4})/);
    if (timeM) { uhrzeit = timeM[1]; datum = timeM[2]; }

    // Benutzer
    const userM = xmlStr.match(/Benutzer:\s*(.+?)&#10;/);
    if (userM) senderName = userM[1].trim();

    // Artikel: <text width="2" height="2">1 Spritzer&#10;</text>
    // Format: Zahl + Leerzeichen + Produktname
    const bigTextRe = /<text[^>]*width="2"[^>]*height="2"[^>]*>([^<]+)<\/text>/gi;
    let m;
    while ((m = bigTextRe.exec(xmlStr)) !== null) {
      const txt = m[1].replace(/&#10;/g,'').trim();
      const itemM = txt.match(/^(\d+)\s+(.+)$/);
      if (itemM) {
        const qty = parseInt(itemM[1]);
        const name = itemM[2].trim();
        if (qty > 0 && qty < 1000 && name.length > 0 && name.length < 80)
          items.push({ product_name: name, quantity: qty, extras: [] });
      }
    }
    return { items, tableNumber, ticketNumber, datum, uhrzeit, senderName };
  }

  // ── Format 2: Rechnung / Barrechnung ─────────────────────────────────────
  const textMatches = xmlStr.match(/<text[^>]*>([\s\S]*?)<\/text>/gi) || [];
  const lines = textMatches
    .map(m => m.replace(/<[^>]+>/g,'').replace(/&#10;/g,'').replace(/&amp;/g,'&')
               .replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim())
    .filter(l => l.length > 0);

  let inItemBlock = false;
  for (const line of lines) {
    const datumM = line.match(/Datum\s+([\d.]+)\s+([\d:]+)/i);
    if (datumM) { datum = datumM[1]; uhrzeit = datumM[2]; continue; }
    const refM = line.match(/Referenznummer[:\s]+(.+)/i) || line.match(/Bon[:\s#]+(\d+)/i);
    if (refM) { ticketNumber = refM[1].trim(); continue; }
    const tischM = line.match(/Tisch[:\s]*(\d+)/i);
    if (tischM) { tableNumber = tischM[1]; continue; }
    const bereichM = line.match(/Bereich:\s*(.+)/i);
    if (bereichM && !tableNumber) { tableNumber = bereichM[1].trim(); continue; }
    const sellerM = line.match(/Verk[äa]ufer:\s*(.+)/i);
    if (sellerM) { senderName = sellerM[1].trim(); continue; }
    if (/Anz\.?\s+Artikel/i.test(line) || /^ARTIKEL\s+MENGE/i.test(line)) { inItemBlock = true; continue; }
    if (/^[-─═*]{4,}$/.test(line)) continue;
    if (/Zwischensumme|^SUMME|^Gesamt|^GESAMT/i.test(line)) { inItemBlock = false; continue; }
    if (inItemBlock) {
      const m1 = line.match(/^(\d+)\s+([^\d].+?)(?:\s{3,}.*)?$/);
      if (m1) {
        const qty = parseInt(m1[1]), name = m1[2].trimEnd();
        if (qty>0 && qty<1000 && name.length>1 && name.length<80 && !/Rabatt|Nachlass/i.test(name))
          { items.push({product_name:name, quantity:qty, extras:[]}); continue; }
      }
      const m2 = line.match(/^(.+?)\s{2,}(\d+)\s*$/);
      if (m2) {
        const name = m2[1].trim(), qty = parseInt(m2[2]);
        if (qty>0 && qty<1000 && name.length>1 && name.length<80)
          { items.push({product_name:name, quantity:qty, extras:[]}); continue; }
      }
    }
  }
  return { items, tableNumber, ticketNumber, datum, uhrzeit, senderName };
}


async function parseAndForward(rawBuf) {
  const xmlStr = rawBuf.toString('utf8');
  const parsed = parseEposXml(xmlStr);

  if (parsed.items.length === 0) {
    console.log('[PARSER] Keine Artikel gefunden – übersprungen');
    return;
  }

  // Pause-Check
  if (CFG.paused) {
    console.log('[PARSER] ⏸ Pausiert – Bon verworfen');
    return;
  }

  // Eingehenden Bon loggen
  logBon('in', parsed);

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

  const line  = () => parts.push(Buffer.from('-'.repeat(Math.min(CFG.charsPerLine, 48)) + '\n'));
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
  txt(`Zeit:  ${printTime.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}`);
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
  txt(`Gedruckt: ${printTime.toLocaleTimeString('de-AT')}`);
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


async function loadRemoteConfig() {
  if (!CFG.workerUrl) return;
  try {
    const [cfgRes, stateRes] = await Promise.all([
      fetch(`${CFG.workerUrl}/api/config`),
      fetch(`${CFG.workerUrl}/api/bons/state`),
    ]);
    const d = await cfgRes.json();
    if (d && d.printerIp && d.printerIp !== CFG.printerIp) {
      console.log(`[CONFIG] Drucker-IP: ${CFG.printerIp} → ${d.printerIp}`);
      CFG.printerIp = d.printerIp;
    }
    if (d && d.printerPort) CFG.printerPort = d.printerPort;
    if (d && d.charsPerLine) CFG.charsPerLine = d.charsPerLine;
    const state = await stateRes.json();
    if (CFG.paused !== state.paused) {
      CFG.paused = state.paused;
      console.log(`[CONFIG] ${CFG.paused ? '⏸ PAUSIERT' : '▶ AKTIV'}`);
    }
  } catch(e) {}
}

async function logBon(type, parsed) {
  if (!CFG.workerUrl || !parsed) return;
  try {
    await fetch(`${CFG.workerUrl}/api/bons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': CFG.apiKey },
      body: JSON.stringify({
        type,
        ticketNumber: parsed.ticketNumber || '—',
        table: parsed.tableNumber || '—',
        items: (parsed.items || []).map(i => i.quantity + 'x ' + i.product_name).join(', '),
        time: new Date().toISOString(),
      }),
    });
  } catch(e) {}
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
  loadRemoteConfig();
  setInterval(loadRemoteConfig, 5000);
  console.log(`[POLLER] Startet – alle 3s`);
  pollJobs();
  setInterval(pollJobs, 3000);
} else {
  console.log('[POLLER] Kein Worker-URL/API-Key – Poller deaktiviert');
}
