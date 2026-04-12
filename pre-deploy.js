#!/usr/bin/env node
// ════════════════════════════════════════════════
//  pre-deploy.js – Vor jedem `wrangler deploy`
//  ausführen: node pre-deploy.js
//
//  Prüft:
//   1. Versionsnummer wurde seit letztem Deploy erhöht
//   2. version.json ist konsistent
//   3. wrangler.toml hat eine database_id eingetragen
//   4. Kein "DEIN_" Platzhalter mehr vorhanden
// ════════════════════════════════════════════════

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname);
let errors   = 0;
let warnings = 0;

function ok(msg)   { console.log('  ✅  ' + msg); }
function warn(msg) { console.warn('  ⚠️   ' + msg); warnings++; }
function fail(msg) { console.error('  ❌  ' + msg); errors++; }
function section(title) { console.log('\n── ' + title + ' ' + '─'.repeat(50 - title.length)); }

// ────────────────────────────────────────────────
section('Version prüfen');
// ────────────────────────────────────────────────

const versionFile    = path.join(ROOT, 'version.json');
const lastDeployFile = path.join(ROOT, '.last-deploy-version');

if (!fs.existsSync(versionFile)) {
  fail('version.json fehlt!');
  process.exit(1);
}

const current = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
console.log(`  Aktuelle Version: ${current.version}  (Build: ${current.build})`);

if (fs.existsSync(lastDeployFile)) {
  const lastDeployed = fs.readFileSync(lastDeployFile, 'utf8').trim();
  if (lastDeployed === current.version) {
    fail(`Version ${current.version} wurde bereits deployed! Bitte version.json aktualisieren.`);
    fail('  Beispiel: "version": "1.0.1"  oder  "version": "1.1.0"');
  } else {
    ok(`Neue Version erkannt: ${lastDeployed} → ${current.version}`);
  }
} else {
  ok('Erster Deploy – kein vorheriger Stand vorhanden.');
}

// Semver Format prüfen
if (!/^\d+\.\d+\.\d+$/.test(current.version)) {
  fail(`Ungültiges Versionformat: "${current.version}" (erwartet: MAJOR.MINOR.PATCH)`);
} else {
  ok('Versionformat (MAJOR.MINOR.PATCH) korrekt');
}

// Datum prüfen
const today = new Date().toISOString().split('T')[0];
if (current.date !== today) {
  warn(`version.json "date" ist nicht heute (${current.date} ≠ ${today}). Bitte aktualisieren.`);
} else {
  ok(`Versionsdatum ist aktuell (${today})`);
}

// Notes vorhanden?
if (!current.notes || current.notes.trim().length < 10) {
  warn('"notes" in version.json fehlt oder zu kurz – Was wurde in dieser Version geändert?');
} else {
  ok(`Release-Notes vorhanden: "${current.notes.substring(0, 60)}…"`);
}

// ────────────────────────────────────────────────
section('wrangler.toml prüfen');
// ────────────────────────────────────────────────

const tomlPath = path.join(ROOT, 'wrangler.toml');
if (!fs.existsSync(tomlPath)) {
  fail('wrangler.toml fehlt!');
} else {
  const toml = fs.readFileSync(tomlPath, 'utf8');

  if (toml.includes('DEINE_D1_DATABASE_ID')) {
    fail('D1 database_id ist noch nicht gesetzt! → wrangler d1 create kds-db ausführen');
  } else {
    ok('D1 database_id ist eingetragen');
  }

  if (toml.includes('DEIN-NAME')) {
    warn('Noch "DEIN-NAME" Platzhalter in wrangler.toml – ist das korrekt für euch?');
  }
}

// ────────────────────────────────────────────────
section('Platzhalter prüfen');
// ────────────────────────────────────────────────

const checkFiles = [
  'src/index.js',
  'src/frontend.js',
  'src/kds-room.js',
  'print-agent/index.js',
];

const PLACEHOLDERS = ['DEIN_API_KEY', 'DEINE_', 'TODO', 'FIXME', 'HACK'];

checkFiles.forEach(f => {
  const fullPath = path.join(ROOT, f);
  if (!fs.existsSync(fullPath)) { fail(`Datei fehlt: ${f}`); return; }

  const content = fs.readFileSync(fullPath, 'utf8');
  const found   = PLACEHOLDERS.filter(p => content.includes(p));
  if (found.length) {
    warn(`${f} enthält Platzhalter: ${found.join(', ')}`);
  } else {
    ok(`${f} – keine Platzhalter`);
  }
});

// ────────────────────────────────────────────────
section('Dateivollständigkeit');
// ────────────────────────────────────────────────

const required = [
  'wrangler.toml',
  'schema.sql',
  'package.json',
  'version.json',
  'src/index.js',
  'src/kds-room.js',
  'src/frontend.js',
  'print-agent/index.js',
];

required.forEach(f => {
  if (fs.existsSync(path.join(ROOT, f))) {
    ok(f);
  } else {
    fail(`Pflichtdatei fehlt: ${f}`);
  }
});

// ────────────────────────────────────────────────
section('Ergebnis');
// ────────────────────────────────────────────────

console.log('');
if (errors > 0) {
  console.error(`\n🚫  Deploy BLOCKIERT – ${errors} Fehler, ${warnings} Warnungen.\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n⚠️   ${warnings} Warnungen – Deploy möglich, aber bitte prüfen.\n`);
  // Version als deployed markieren
  fs.writeFileSync(lastDeployFile, current.version);
  process.exit(0);
} else {
  console.log(`\n🚀  Alles OK! Bereit für: npm run deploy\n`);
  fs.writeFileSync(lastDeployFile, current.version);
  process.exit(0);
}
