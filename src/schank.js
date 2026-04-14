export function getSchankHTML() {
  return `<!DOCTYPE html>
<html lang="de" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Schankmonitor – KDS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root{--bg:#0d0d0d;--sur:#161618;--sur2:#1f1f22;--brd:#2a2a2f;--brd2:#3a3a42;--txt:#ffffff;--muted:#d0d0d8;--amber:#f59e0b;--adim:#7a4f05;--blue:#3b82f6;--green:#10b981;--red:#ef4444;--font:'Barlow Condensed',sans-serif;--mono:'Space Mono',monospace;--hh:56px}
  [data-theme="light"]{--bg:#f5f5f5;--sur:#ffffff;--sur2:#ececec;--brd:#d0d0d0;--brd2:#b0b0b0;--txt:#000000;--muted:#1a1a1a}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{width:100%;height:100%;overflow:hidden}
  body{font-family:var(--font);background:var(--bg);color:var(--txt);font-size:16px}
  #app{width:100vw;height:100vh;display:grid;grid-template-rows:var(--hh) 1fr;overflow:hidden}

  /* ── Header ── */
  header{display:flex;align-items:center;gap:8px;padding:0 16px;background:var(--sur);border-bottom:1px solid var(--brd);height:var(--hh);overflow:hidden}
  .logo-box{width:32px;height:32px;background:#1a1a1a;border-radius:6px;border:1px solid var(--brd);display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .host-info{display:flex;flex-direction:column;line-height:1.2;margin-right:4px}
  .host-name{font-size:13px;font-weight:700;color:var(--amber)}
  .host-ip{font-size:10px;color:var(--muted);font-family:var(--mono)}
  .div{width:1px;height:28px;background:var(--brd);flex-shrink:0}
  .rot-btn{background:none;border:none;cursor:pointer;color:var(--muted);padding:6px;border-radius:6px;transition:all .2s;display:flex;align-items:center}
  .rot-btn:hover{background:var(--sur2);color:var(--txt)}
  .theme-wrap{display:flex;align-items:center;gap:6px;cursor:pointer;padding:0 8px}
  .theme-track{width:32px;height:18px;border-radius:9px;background:var(--sur2);border:1px solid var(--brd);position:relative;transition:background .2s}
  .theme-thumb{width:12px;height:12px;border-radius:50%;background:var(--muted);position:absolute;top:2px;left:2px;transition:transform .2s}
  [data-theme="light"] .theme-thumb{transform:translateX(14px)}
  .theme-lbl{font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--muted)}
  .cfg-btn{background:none;border:none;cursor:pointer;color:var(--muted);padding:6px;border-radius:6px;transition:all .2s;display:flex;align-items:center}
  .cfg-btn:hover{background:var(--sur2);color:var(--txt)}
  .spacer{flex:1}
  .tabs{display:flex;gap:4px;margin-left:auto}
  .tab{background:none;border:none;cursor:pointer;font-family:var(--font);font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:6px 14px;border-radius:6px;transition:all .15s}
  .tab:hover{color:var(--txt);background:var(--sur2)}
  .tab.active{background:var(--amber);color:#000}
  .ws-dot{width:8px;height:8px;border-radius:50%;background:#444;flex-shrink:0;transition:background .3s}
  .ws-dot.ok{background:var(--green);box-shadow:0 0 6px var(--green)}

  /* ── Virtual Printer View ── */
  #virtMain{height:calc(100vh - var(--hh));overflow-y:auto;padding:20px;background:var(--bg)}
  .virt-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap}
  .toggle-group{display:flex;background:var(--sur2);border:1px solid var(--brd);border-radius:8px;overflow:hidden}
  .toggle-btn{background:none;border:none;cursor:pointer;font-family:var(--font);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:8px 18px;transition:all .15s}
  .toggle-btn.active{background:var(--amber);color:#000}
  .pp-btn{background:var(--sur2);border:1px solid var(--brd);border-radius:8px;cursor:pointer;font-family:var(--font);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--txt);padding:8px 16px;display:flex;align-items:center;gap:6px;transition:all .15s}
  .pp-btn:hover{border-color:var(--brd2)}
  .pp-btn.paused{border-color:var(--amber);color:var(--amber)}
  .clear-btn{background:none;border:1px solid var(--brd);border-radius:8px;cursor:pointer;font-family:var(--font);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:8px 14px;transition:all .15s;margin-left:auto}
  .clear-btn:hover{border-color:var(--red);color:var(--red)}

  /* ── Bon Cards ── */
  .bon-list{display:flex;flex-direction:column;gap:14px;max-width:440px}
  .bon-card{background:#f5f4ef;border-radius:8px 8px 2px 2px;overflow:hidden;position:relative;box-shadow:0 2px 12px rgba(0,0,0,.4)}
  .bon-head{background:#e8e5dd;padding:8px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px dashed #ccc}
  .bon-num{font-family:var(--mono);font-size:10px;color:#666}
  .bon-time{font-family:var(--mono);font-size:10px;color:#888}
  .bon-del{background:none;border:none;cursor:pointer;color:#aaa;font-size:16px;line-height:1;padding:0 2px;transition:color .15s}
  .bon-del:hover{color:#ef4444}
  .bon-body{padding:12px 16px;font-family:'Courier New',monospace;font-size:13px;color:#111;line-height:1.7;background:#f9f8f4}
  .bon-item{display:flex;gap:8px}
  .bon-qty{font-weight:700;color:#333;min-width:20px}
  .bon-name{}
  .bon-sep{border:none;border-top:1px dashed #bbb;margin:6px 0}
  .bon-cut{height:6px;background:repeating-linear-gradient(90deg,#ddd 0 5px,transparent 5px 10px);margin-top:0}
  .bon-badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;letter-spacing:.04em}
  .bon-badge.in{background:#dcfce7;color:#166534}
  .bon-badge.out{background:#dbeafe;color:#1e40af}
  .empty-state{color:var(--muted);font-size:14px;padding:40px;text-align:center;border:1px dashed var(--brd);border-radius:8px;max-width:440px}
</style>
</head>
<body>
<div id="app">
  <header>
    <div class="logo-box">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    </div>
    <div class="host-info">
      <span class="host-name" id="hostName">schankmonitor</span>
      <span class="host-ip" id="hostIp">–.–.–.–</span>
    </div>
    <div class="div"></div>
    <div class="theme-wrap" onclick="toggleTheme()">
      <div class="theme-track"><div class="theme-thumb"></div></div>
      <span class="theme-lbl" id="tLbl">DUNKEL</span>
    </div>
    <div class="div"></div>
    <div class="spacer"></div>
    <div class="tabs">
      <button class="tab" onclick="goTo('kds')">Bestellungen</button>
      <button class="tab" onclick="goTo('kds')">Produkte</button>
      <button class="tab active" id="tV">Virtuell</button>
    </div>
    <div class="ws-dot" id="wsDot"></div>
  </header>

  <div id="virtMain">
    <div class="virt-toolbar">
      <div class="toggle-group">
        <button class="toggle-btn active" id="btnIn" onclick="setMode('in')">📥 Einkommend</button>
        <button class="toggle-btn" id="btnOut" onclick="setMode('out')">📤 Ausgehend</button>
      </div>
      <button class="pp-btn" id="ppBtn" onclick="togglePause()">
        <span id="ppIcon">▶</span><span id="ppLabel">LÄUFT</span>
      </button>
      <button class="clear-btn" onclick="clearBons()">✕ Alle löschen</button>
    </div>
    <div class="bon-list" id="bonList">
      <div class="empty-state">Keine Bons vorhanden</div>
    </div>
  </div>
</div>

<script>
const API = 'https://kds.team24.training/api';
const API_KEY = 'kds-smarte-events-2026';
let mode = 'in';
let paused = false;
let bons = [];

// Theme
function toggleTheme() {
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('tLbl').textContent = t === 'dark' ? 'DUNKEL' : 'HELL';
}

// Navigation zurück zu KDS
function goTo(view) { window.location.href = 'https://kds.team24.training'; }

// Play/Pause
async function togglePause() {
  paused = !paused;
  await fetch(API + '/pause-state', {
    method: 'POST', headers: {'Content-Type':'application/json','X-API-Key': API_KEY},
    body: JSON.stringify({ paused })
  }).catch(()=>{});
  updatePauseUI();
}

function updatePauseUI() {
  const btn = document.getElementById('ppBtn');
  document.getElementById('ppIcon').textContent = paused ? '⏸' : '▶';
  document.getElementById('ppLabel').textContent = paused ? 'PAUSIERT' : 'LÄUFT';
  btn.classList.toggle('paused', paused);
}

// Mode toggle
function setMode(m) {
  mode = m;
  document.getElementById('btnIn').classList.toggle('active', m === 'in');
  document.getElementById('btnOut').classList.toggle('active', m === 'out');
  renderBons();
}

// Bons laden
async function loadBons() {
  try {
    const res = await fetch(API + '/bon-log?limit=6');
    const data = await res.json();
    bons = data.bons || data || [];
    renderBons();
  } catch(e) { console.error(e); }
}

// Bon löschen
async function deleteBon(id) {
  await fetch(API + '/bon-log', {
    method: 'DELETE', headers: {'Content-Type':'application/json','X-API-Key': API_KEY},
    body: JSON.stringify({ id })
  }).catch(()=>{});
  loadBons();
}

// Alle löschen
async function clearBons() {
  const filtered = bons.filter(b => b.type === (mode === 'in' ? 'incoming' : 'outgoing'));
  for (const b of filtered) await deleteBon(b.id);
}

// Render
function renderBons() {
  const list = document.getElementById('bonList');
  const filterType = mode === 'in' ? 'incoming' : 'outgoing';
  const filtered = bons.filter(b => b.type === filterType).slice(0, 3);

  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state">Keine Bons vorhanden</div>';
    return;
  }

  list.innerHTML = filtered.map(bon => {
    const data = typeof bon.data === 'string' ? JSON.parse(bon.data) : (bon.data || {});
    const items = data.items || [];
    const time = bon.created_at ? new Date(bon.created_at).toLocaleTimeString('de-AT', {hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '–';
    const num = data.ticketNumber || bon.ticket_number || '–';
    const tisch = data.tableNumber || '–';
    const badge = filterType === 'incoming'
      ? '<span class="bon-badge in">EINGANG</span>'
      : '<span class="bon-badge out">AUSGANG</span>';

    const itemsHtml = items.length
      ? items.map(it => \`<div class="bon-item"><span class="bon-qty">\${it.quantity}×</span><span class="bon-name">\${it.product_name}</span></div>\`).join('')
      : '<div style="color:#888;font-size:11px">Keine Artikel</div>';

    return \`
      <div class="bon-card">
        <div class="bon-head">
          <span class="bon-num">\${badge} #\${num}</span>
          <span class="bon-time">\${time} · Tisch \${tisch}</span>
          <button class="bon-del" onclick="deleteBon(\${bon.id})" title="Löschen">✕</button>
        </div>
        <div class="bon-body">\${itemsHtml}</div>
        <div class="bon-cut"></div>
      </div>\`;
  }).join('');
}

// Pause-State laden
async function loadPauseState() {
  try {
    const res = await fetch(API + '/pause-state');
    const d = await res.json();
    paused = d.paused || false;
    updatePauseUI();
  } catch(e) {}
}

// Pi Info laden
async function loadAgentInfo() {
  try {
    const res = await fetch(API + '/agent');
    const d = await res.json();
    if (d && d.ip) document.getElementById('hostIp').textContent = d.ip;
    if (d && d.hostname) document.getElementById('hostName').textContent = d.hostname;
    document.getElementById('wsDot').classList.add('ok');
  } catch(e) {}
}

// Init
loadAgentInfo();
loadPauseState();
loadBons();
setInterval(loadBons, 5000);
</script>
</body>
</html>`;
}
