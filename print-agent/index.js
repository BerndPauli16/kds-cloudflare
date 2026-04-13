#!/usr/bin/env node
// ════════════════════════════════════════════════
//  KDS Print-Agent – läuft auf dem Raspberry Pi
//  Pollt den Cloudflare Worker und druckt via ESC/POS
//
//  Setup:
//    npm install node-thermal-printer
//    node index.js
// ════════════════════════════════════════════════

const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');

// ── Konfiguration ────────────────────────────────
const CONFIG = {
  workerUrl:   process.env.KDS_WORKER_URL  || 'https://kds-worker.DEIN-NAME.workers.dev',
  apiKey:      process.env.KDS_API_KEY     || 'DEIN_API_KEY',
  printerIp:   process.env.PRINTER_IP      || '192.168.1.100',
  printerPort: parseInt(process.env.PRINTER_PORT) || 9100,
  pollInterval: 3000,   // ms
};

// ── Drucker-Setup ────────────────────────────────
const printer = new ThermalPrinter({
  type:          PrinterTypes.EPSON,
  interface:     \`tcp://\${CONFIG.printerIp}:\${CONFIG.printerPort}\`,
  characterSet:  CharacterSet.SLOVENIA,  // ISO 8859-2 (Umlaute)
  removeSpecialCharacters: false,
  lineCharacter: '─',
  options: { timeout: 5000 },
});

// ── Haupt-Loop ───────────────────────────────────
async function pollAndPrint() {
  try {
    const res  = await fetch(\`\${CONFIG.workerUrl}/api/print-jobs/pending\`, {
      headers: { 'X-API-Key': CONFIG.apiKey },
    });

    if (!res.ok) {
      console.error('API error:', res.status);
      return;
    }

    const jobs = await res.json();

    for (const job of jobs) {
      console.log(\`[JOB \${job.id}] Drucke Ticket #\${job.payload.ticket_number}…\`);

      try {
        await printJob(job);
        await markDone(job.id);
        console.log(\`[JOB \${job.id}] ✓ Erledigt\`);
      } catch (err) {
        console.error(\`[JOB \${job.id}] ✗ Druckfehler:\`, err.message);
      }
    }
  } catch (err) {
    console.error('Poll-Fehler:', err.message);
  }
}

// ── ESC/POS Bon drucken ──────────────────────────
async function printJob(job) {
  const p = job.payload;

  await printer.isPrinterConnected();

  printer.alignCenter();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println(p.station_name || 'BESTELLUNG');
  printer.bold(false);
  printer.drawLine();

  printer.alignLeft();
  printer.bold(true);
  printer.println(\`Tisch: \${p.table_number || '–'}\`);
  printer.bold(false);
  printer.println(\`Bon:   #\${p.ticket_number}\`);

  const time = new Date(p.printed_at || Date.now());
  printer.println(\`Zeit:  \${time.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}\`);
  printer.drawLine();

  for (const item of (p.items || [])) {
    printer.bold(true);
    printer.println(\`\${String(item.quantity).padStart(2)}x  \${item.product_name}\`);
    printer.bold(false);

    if (item.extras && item.extras.length) {
      for (const extra of item.extras) {
        printer.println(\`      → \${extra}\`);
      }
    }
  }

  printer.drawLine();
  printer.alignCenter();
  printer.println(\`Gedruckt: \${time.toLocaleTimeString('de-AT')}\`);
  printer.cut();

  await printer.execute();
  printer.clear();
}

// ── Job als erledigt markieren ───────────────────
async function markDone(jobId) {
  await fetch(\`\${CONFIG.workerUrl}/api/print-jobs/\${jobId}/complete\`, {
    method:  'POST',
    headers: { 'X-API-Key': CONFIG.apiKey },
  });
}

// ── Start ────────────────────────────────────────
console.log(\`KDS Print-Agent gestartet\`);
console.log(\`Worker: \${CONFIG.workerUrl}\`);
console.log(\`Drucker: \${CONFIG.printerIp}:\${CONFIG.printerPort}\`);
console.log(\`Poll-Intervall: \${CONFIG.pollInterval}ms\\n\`);

pollAndPrint();
setInterval(pollAndPrint, CONFIG.pollInterval);
