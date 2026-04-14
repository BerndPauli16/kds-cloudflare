export function getSchankHTML() {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Schankmonitor – Virtueller Drucker</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{--bg:#0a0a0a;--sur:#111113;--sur2:#1a1a1d;--brd:#2a2a2f;--txt:#f0f0f0;--muted:#888;--amber:#f59e0b;--green:#10b981;--red:#ef4444;--blue:#3b82f6;--font:'Barlow Condensed',sans-serif;--mono:'Space Mono',monospace}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{width:100%;height:100%;background:var(--bg);color:var(--txt);font-family:var(--font);overflow:hidden}
  #app{display:grid;grid-template-rows:56px 1fr;height:100vh}

  /* Header */
  header{background:var(--sur);border-bottom:1px solid var(--brd);display:flex;align-items:center;gap:12px;padding:0 16px}
  .logo{font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--amber)}
  .logo span{color:var(--muted);font-weight:400}
  .hdr-right{margin-left:auto;display:flex;align-items:center;gap:8px}

  /* Play/Pause */
  .pp-btn{display:flex;align-items:center;gap:6px;background:var(--green);color:#000;border:none;border-radius:6px;padding:7px 14px;font-family:var(--font);font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:all .2s}
  .pp-btn.paused{background:var(--red)}
  .pp-btn svg{width:14px;height:14px}
  .pp-dot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulse 1.5s infinite}
  .pp-dot.paused{background:var(--red);animation:none}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

  /* Toggle */
  .toggle-wrap{display:flex;background:var(--sur2);border:1px solid var(--brd);border-radius:8px;padding:3px;gap:3px}
  .tog-btn{padding:6px 16px;border:none;border-radius:5px;font-family:var(--font);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:all .2s;background:transparent;color:var(--muted)}
  .tog-btn.active{background:var(--sur);color:var(--txt);box-shadow:0 1px 3px rgba(0,0,0,.4)}

  /* Main */
  main{display:flex;flex-direction:column;gap:0;overflow:hidden;padding:0}
  .bons-list{display:flex;flex-direction:column;gap:0;overflow-y:auto;flex:1;padding:12px 16px;gap:10px}

  /* Bon Card */
  .bon-card{background:var(--sur);border:1px solid var(--brd);border-radius:10px;overflow:hidden;transition:border-color .2s}
  .bon-card:hover{border-color:var(--brd2,#3a3a42)}
  .bon-hdr{display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--sur2);border-bottom:1px solid var(--brd)}
  .bon-type{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:4px}
  .bon-type.in{background:rgba(59,130,246,.15);color:#60a5fa}
  .bon-type.out{background:rgba(16,185,129,.15);color:#34d399}
  .bon-time{font-size:11px;color:var(--muted);font-family:var(--mono)}
  .bon-del{margin-left:auto;background:none;border:none;color:var(--muted);cursor:pointer;padding:4px 6px;border-radius:4px;font-size:14px;transition:color .15s}
  .bon-del:hover{color:var(--red)}
  .bon-body{padding:10px 12px}
  .bon-receipt{font-family:var(--mono);font-size:11px;line-height:1.6;color:var(--txt);white-space:pre;background:var(--sur2);border-radius:6px;padding:10px 12px;overflow-x:auto;border:1px solid var(--brd)}
  .bon-receipt .big{font-size:14px;font-weight:700;color:var(--amber)}

  /* Empty */
  .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--muted);font-size:13px;padding:40px;text-align:center}
  .empty svg{width:40px;height:40px;opacity:.3}

  /* Status bar */
  .status-bar{background:var(--sur2);border-top:1px solid var(--brd);padding:8px 16px;display:flex;align-items:center;gap:10px;font-size:11px;color:var(--muted)}
  .status-dot{width:6px;height:6px;border-radius:50%;background:var(--green)}
  .status-dot.off{background:var(--muted)}
</style>
</head>
<body>
<div id="app">
  <header>
    <div class="pp-dot" id="ppDot"></div>
    <div class="logo">Schankmonitor <span>team24</span></div>
    <div class="toggle-wrap" style="margin-left:16px">
      <button class="tog-btn active" id="togIn" onclick="setType('incoming')">📥 Einkommend</button>
      <button class="tog-btn" id="togOut" onclick="setType('outgoing')">📤 Ausgehend</button>
    </div>
    <div class="hdr-right">
      <button class="pp-btn" id="ppBtn" onclick="togglePause()">
        <svg viewBox="0 0 24 24" fill="currentColor" id="ppIcon"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        <span id="ppLabel">PAUSE</span>
      </button>
    </div>
  </header>
  <main>
    <div class="bons-list" id="bonsList"></div>
    <div class="status-bar">
      <div class="status-dot" id="statusDot"></div>
      <span id="statusText">Lädt…</span>
      <span style="margin-left:auto" id="lastUpdate"></span>
    </div>
  </main>
</div>

<script>
const API = '';
const KEY = 'kds-smarte-events-2026';
let curType = 'incoming';
let paused = false;
let pollTimer = null;

async function api(path, opts={}) {
  const res = await fetch(API + '/api' + path, {
    headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json', ...opts.headers },
    ...opts
  });
  return res.json().catch(() => ({}));
}

function setType(t) {
  curType = t;
  document.getElementById('togIn').classList.toggle('active', t==='incoming');
  document.getElementById('togOut').classList.toggle('active', t==='outgoing');
  loadBons();
}

async function loadBons() {
  const bons = await api('/bon-log?type=' + curType + '&limit=3');
  const list = document.getElementById('bonsList');
  if (!Array.isArray(bons) || bons.length === 0) {
    list.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h7"/></svg>Keine Bons vorhanden</div>';
    document.getElementById('statusText').textContent = 'Keine Bons – ' + (curType==='incoming'?'Einkommend':'Ausgehend');
    return;
  }
  list.innerHTML = bons.map(bon => {
    const time = new Date(bon.created_at).toLocaleTimeString('de-AT', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const date = new Date(bon.created_at).toLocaleDateString('de-AT', {day:'2-digit',month:'2-digit'});
    const lines = (bon.preview||'').split('\n').map(l => {
      if (l.startsWith('##')) return '<span class="big">' + l.replace(/^##\s*/,'') + '</span>';
      return escHtml(l);
    }).join('\n');
    return \`<div class="bon-card">
      <div class="bon-hdr">
        <span class="bon-type \${bon.type==='incoming'?'in':'out'}">\${bon.type==='incoming'?'📥 Einkommend':'📤 Ausgehend'}</span>
        <span class="bon-time">\${time} · \${date}</span>
        <button class="bon-del" onclick="deleteBon(\${bon.id})" title="Löschen">✕</button>
      </div>
      <div class="bon-body">
        <div class="bon-receipt">\${lines}</div>
      </div>
    </div>\`;
  }).join('');
  document.getElementById('statusText').textContent = bons.length + ' Bon' + (bons.length!==1?'s':'') + ' · ' + (curType==='incoming'?'Einkommend':'Ausgehend');
  document.getElementById('lastUpdate').textContent = 'Aktualisiert: ' + new Date().toLocaleTimeString('de-AT');
}

async function deleteBon(id) {
  await api('/bon-log', { method:'DELETE', body: JSON.stringify({id}) });
  loadBons();
}

async function togglePause() {
  paused = !paused;
  await api('/pause-state', { method:'POST', body: JSON.stringify({paused}) });
  updatePauseUI();
}

function updatePauseUI() {
  const btn = document.getElementById('ppBtn');
  const dot = document.getElementById('ppDot');
  const icon = document.getElementById('ppIcon');
  const lbl = document.getElementById('ppLabel');
  if (paused) {
    btn.classList.add('paused');
    dot.classList.add('paused');
    lbl.textContent = 'PLAY';
    icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    document.getElementById('statusDot').classList.add('off');
  } else {
    btn.classList.remove('paused');
    dot.classList.remove('paused');
    lbl.textContent = 'PAUSE';
    icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    document.getElementById('statusDot').classList.remove('off');
  }
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function init() {
  // Pause-State laden
  const ps = await api('/pause-state');
  paused = ps.paused || false;
  updatePauseUI();
  loadBons();
  // Alle 4s aktualisieren
  pollTimer = setInterval(loadBons, 4000);
}

init();
</script>
</body>
</html>`;
}
