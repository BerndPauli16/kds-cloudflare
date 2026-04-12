// ════════════════════════════════════════════════
//  Frontend HTML – wird vom Worker als String serviert
// ════════════════════════════════════════════════

const LOGO_B64 = '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';

export function getHTML() {
  return `<!DOCTYPE html>
<html lang="de" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KDS – Küchenmonitor</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg:        #080809;
    --surface:   #111113;
    --surface2:  #1a1a1e;
    --border:    #26262c;
    --border2:   #35353d;
    --text:      #e2e2e8;
    --muted:     #5c5c6e;
    --amber:     #f59e0b;
    --amber-dim: #92610a;
    --blue:      #3b82f6;
    --green:     #10b981;
    --red:       #ef4444;
    --font-ui:   'Barlow Condensed', sans-serif;
    --font-mono: 'Space Mono', monospace;
  }

  [data-theme="light"] {
    --bg:       #f4f4f0;
    --surface:  #ffffff;
    --surface2: #ebebeb;
    --border:   #d0d0cc;
    --border2:  #b8b8b4;
    --text:     #1a1a1e;
    --muted:    #888880;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--font-ui);
    background: var(--bg);
    color: var(--text);
    height: 100dvh;
    display: grid;
    grid-template-rows: 52px 1fr;
    overflow: hidden;
    transition: background .2s, color .2s;
  }

  /* ── Header ── */
  header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 10px;
  }

  .logo-img {
    height: 32px;
    width: auto;
    object-fit: contain;
    flex-shrink: 0;
    filter: none;
  }

  [data-theme="dark"] .logo-img {
    filter: brightness(0) invert(1);
  }

  /* ── Monitor-Info (Hostname + IP) ── */
  .monitor-info {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
    border-left: 1px solid var(--border);
    padding-left: 10px;
    margin-left: 2px;
  }
  .monitor-hostname {
    font-size: 13px;
    font-weight: 700;
    color: var(--amber);
    letter-spacing: .5px;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }
  .monitor-ip {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    letter-spacing: .3px;
  }

  /* ── Rotation Buttons ── */
  .rot-group {
    display: flex;
    gap: 3px;
    margin-left: 4px;
  }
  .rot-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
    padding: 5px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all .15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .rot-btn:hover { border-color: var(--border2); color: var(--text); }
  .rot-btn.active { border-color: var(--amber); color: var(--amber); background: rgba(245,158,11,.1); }
  .rot-btn svg { display: block; }

  /* ── Dark/Light Toggle ── */
  .theme-toggle {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 20px;
    width: 44px;
    height: 24px;
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
    transition: background .2s;
  }
  .theme-toggle::after {
    content: '';
    position: absolute;
    top: 3px; left: 3px;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: var(--amber);
    transition: transform .2s;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  [data-theme="light"] .theme-toggle::after {
    transform: translateX(20px);
  }
  .theme-label {
    font-size: 11px;
    color: var(--muted);
    letter-spacing: .5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    line-height: 1;
  }

  .view-tabs {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }

  .tab-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 6px 14px;
    border-radius: 4px;
    cursor: pointer;
    transition: all .15s;
  }
  .tab-btn.active {
    background: var(--amber);
    border-color: var(--amber);
    color: #000;
  }
  .tab-btn:not(.active):hover {
    border-color: var(--border2);
    color: var(--text);
  }

  .ws-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--muted);
    transition: background .3s;
    flex-shrink: 0;
  }
  .ws-dot.connected    { background: var(--green); box-shadow: 0 0 6px var(--green); }
  .ws-dot.disconnected { background: var(--red); }

  /* ── Layout ── */
  .main {
    display: grid;
    grid-template-columns: 220px 1fr;
    overflow: hidden;
  }

  aside {
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-header {
    padding: 14px 16px 10px;
    border-bottom: 1px solid var(--border);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--muted);
    text-transform: uppercase;
  }

  .totals-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
    transition: background .2s;
    animation: fadeIn .3s ease;
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }
  @keyframes pulse  { 0%,100% { opacity: 1; } 50% { opacity: .4; } }

  .total-row:hover { background: var(--surface2); }
  .total-name { font-size: 16px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
  .total-count { font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: var(--amber); min-width: 32px; text-align: right; }
  .total-count.updated { animation: pulse .4s ease; color: #fff; }

  .sidebar-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    font-size: 12px;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
  }
  .sidebar-footer strong { font-family: var(--font-mono); color: var(--text); }

  .tickets-area { overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 0; }

  .order-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; align-content: start; }

  .ticket-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: border-color .2s;
    animation: slideIn .25s ease;
  }

  @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

  .ticket-card:hover { border-color: var(--border2); }
  .ticket-card.printing { border-color: var(--blue); }

  .ticket-header {
    padding: 10px 12px;
    background: var(--surface2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border);
  }

  .ticket-num { font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: var(--amber); }
  .ticket-table { font-size: 15px; font-weight: 700; color: var(--text); }
  .ticket-wait { font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: var(--bg); border: 1px solid var(--border); color: var(--muted); }
  .ticket-wait.urgent { color: var(--red); border-color: var(--red); }
  .ticket-wait.warn   { color: var(--amber); border-color: var(--amber-dim); }

  .ticket-items { flex: 1; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
  .ticket-item  { display: flex; align-items: flex-start; gap: 8px; }
  .item-qty  { font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: var(--amber); min-width: 22px; }
  .item-name { font-size: 16px; font-weight: 600; color: var(--text); }
  .item-extras { margin-top: 2px; display: flex; flex-wrap: wrap; gap: 4px; }
  .extra-tag { font-size: 11px; font-weight: 500; padding: 2px 6px; border-radius: 3px; background: var(--surface2); border: 1px solid var(--border); color: var(--muted); letter-spacing: .3px; }

  .ticket-footer { padding: 8px 12px; border-top: 1px solid var(--border); display: flex; gap: 6px; }

  .btn-print {
    flex: 1;
    background: var(--amber);
    color: #000;
    border: none;
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 8px;
    border-radius: 5px;
    cursor: pointer;
    transition: all .15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .btn-print:hover:not(:disabled) { background: #fbbf24; }
  .btn-print:disabled { opacity: .4; cursor: default; }

  .btn-done {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 8px 12px;
    border-radius: 5px;
    cursor: pointer;
    transition: all .15s;
  }
  .btn-done:hover { border-color: var(--green); color: var(--green); }

  .product-view { display: flex; flex-direction: column; gap: 12px; }
  .product-group { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; animation: slideIn .25s ease; }
  .product-group-header { padding: 12px 16px; background: var(--surface2); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .product-group-name { font-size: 20px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: var(--text); }
  .product-group-total { font-family: var(--font-mono); font-size: 24px; font-weight: 700; color: var(--amber); display: flex; align-items: center; gap: 6px; }
  .product-group-total span { font-size: 12px; color: var(--muted); font-family: var(--font-ui); font-weight: 600; }
  .product-rows { padding: 4px 0; }
  .product-row { display: grid; grid-template-columns: 1fr 60px; align-items: center; padding: 8px 16px; border-bottom: 1px solid var(--border); gap: 8px; }
  .product-row:last-child { border-bottom: none; }
  .product-row-table { font-size: 15px; font-weight: 600; color: var(--muted); }
  .product-row-qty { font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: var(--text); text-align: right; }

  .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: var(--muted); }
  .empty-icon { font-size: 48px; }
  .empty-text { font-size: 18px; font-weight: 600; letter-spacing: 1px; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

  .station-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 3px; text-transform: uppercase; letter-spacing: 1px; }

  /* ── Rotation Wrapper ── */
  .rot-landscape  { /* default */ }
  .rot-left  { transform: rotate(-90deg) translateX(-100%); transform-origin: top left; position: fixed; top: 52px; left: 0; width: 100vh; height: calc(100vw - 52px); }
  .rot-right { transform: rotate(90deg) translateY(-100%);  transform-origin: top left; position: fixed; top: 52px; left: 0; width: 100vh; height: calc(100vw - 52px); }
</style>
</head>
<body>

<header>
  <img class="logo-img" src="data:image/png;base64,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" alt="Smarte Events">

  <div class="monitor-info">
    <div class="monitor-hostname" id="monitorHostname">–</div>
    <div class="monitor-ip" id="monitorIp">–.–.–.–</div>
  </div>

  <div class="rot-group">
    <button class="rot-btn" id="rot-left"  onclick="setRotation('left')"  title="Hochformat links">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="5" y="1" width="8" height="14" rx="2" stroke="currentColor" stroke-width="1.3"/>
        <path d="M9 8 L5 4 L9 0" stroke="#f59e0b" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="5" y1="4" x2="13" y2="4" stroke="#f59e0b" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
    </button>
    <button class="rot-btn active" id="rot-up" onclick="setRotation('landscape')" title="Querformat">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="5" width="16" height="9" rx="2" stroke="currentColor" stroke-width="1.3"/>
        <path d="M9 2 L12 5 M9 2 L6 5" stroke="#f59e0b" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <button class="rot-btn" id="rot-right" onclick="setRotation('right')" title="Hochformat rechts">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="5" y="1" width="8" height="14" rx="2" stroke="currentColor" stroke-width="1.3"/>
        <path d="M9 8 L13 4 L9 0" stroke="#f59e0b" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="13" y1="4" x2="5" y2="4" stroke="#f59e0b" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
    </button>
  </div>

  <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()" title="Dark/Light Mode"></button>

  <div class="view-tabs">
    <button class="tab-btn active" id="tabOrders"   onclick="setView('orders')">Bestellungen</button>
    <button class="tab-btn"        id="tabProducts" onclick="setView('products')">Produkte</button>
  </div>

  <div class="ws-dot" id="wsDot" title="WebSocket"></div>
</header>

<div class="main" id="mainContent">
  <aside>
    <div class="sidebar-header">Live-Summen</div>
    <div class="totals-list" id="totalsList"></div>
    <div class="sidebar-footer">
      <span>Offene Bons</span>
      <strong id="totalBons">0</strong>
    </div>
  </aside>
  <div class="tickets-area" id="ticketsArea"></div>
</div>

<script>
  let state = {
    view: 'orders', station: '',
    tickets: [], totals: [],
    ws: null, prevTotals: {},
  };

  // ── Theme ──────────────────────────────────────
  function toggleTheme() {
    const html = document.documentElement;
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    localStorage.setItem('kds_theme', next);
  }

  (function initTheme() {
    const saved = localStorage.getItem('kds_theme') || 'dark';
    document.documentElement.dataset.theme = saved;
  })();

  // ── Rotation ───────────────────────────────────
  function setRotation(mode) {
    const main = document.getElementById('mainContent');
    main.className = 'main rot-' + mode;
    ['left','up','right'].forEach(d => {
      const id = d === 'up' ? 'rot-up' : 'rot-' + d;
      document.getElementById(id).classList.toggle('active',
        (mode === 'landscape' && d === 'up') ||
        (mode === 'left'  && d === 'left') ||
        (mode === 'right' && d === 'right')
      );
    });
    localStorage.setItem('kds_rot', mode);
  }

  (function initRotation() {
    const saved = localStorage.getItem('kds_rot') || 'landscape';
    setRotation(saved);
  })();

  // ── Monitor-Info ───────────────────────────────
  (function initMonitorInfo() {
    document.getElementById('monitorHostname').textContent = location.hostname;
    // Client-IP via Cloudflare Worker-Header (wird vom Worker als Meta gesetzt)
    const ip = document.querySelector('meta[name="client-ip"]');
    if (ip) document.getElementById('monitorIp').textContent = ip.content;
    else {
      // Fallback: eigene IP laden
      fetch('/api/client-ip').then(r => r.json()).then(d => {
        if (d.ip) document.getElementById('monitorIp').textContent = d.ip;
      }).catch(() => {});
    }
  })();

  // ── Init ────────────────────────────────────────
  async function init() {
    await loadTickets();
    await loadTotals();
    connectWS();
    setInterval(loadTickets, 30000);
  }

  async function loadTickets() {
    const url = state.station ? '/api/tickets?station=' + state.station : '/api/tickets';
    const res = await fetch(url);
    state.tickets = await res.json();
    renderView();
  }

  async function loadTotals() {
    const url = state.station ? '/api/totals?station=' + state.station : '/api/totals';
    const res = await fetch(url);
    state.totals = await res.json();
    renderTotals();
  }

  function connectWS() {
    if (state.ws) state.ws.close();
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(proto + '://' + location.host + '/ws?station=' + (state.station || 'all'));
    state.ws = ws;
    const dot = document.getElementById('wsDot');
    ws.onopen = () => {
      dot.className = 'ws-dot connected';
      setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ type: 'ping' })), 25000);
    };
    ws.onclose = () => { dot.className = 'ws-dot disconnected'; setTimeout(connectWS, 3000); };
    ws.onmessage = async ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.type === 'pong') return;
      await Promise.all([loadTickets(), loadTotals()]);
    };
  }

  function setView(v) {
    state.view = v;
    document.getElementById('tabOrders').classList.toggle('active', v === 'orders');
    document.getElementById('tabProducts').classList.toggle('active', v === 'products');
    renderView();
  }

  function renderView() {
    state.view === 'orders' ? renderOrders() : renderProducts();
  }

  function renderOrders() {
    const area = document.getElementById('ticketsArea');
    if (!state.tickets.length) {
      area.innerHTML = \`<div class="empty"><div class="empty-icon">✓</div><div class="empty-text">Keine offenen Bons</div></div>\`;
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'order-grid';
    state.tickets.forEach(t => {
      const urgency = t.wait_mins >= 15 ? 'urgent' : t.wait_mins >= 8 ? 'warn' : '';
      const itemsHTML = t.items.map(item => \`
        <div class="ticket-item">
          <div>
            <div style="display:flex;gap:8px;align-items:baseline">
              <span class="item-qty">\${item.quantity}×</span>
              <span class="item-name">\${item.product_name}</span>
            </div>
            \${item.extras && item.extras.length ? \`<div class="item-extras">\${item.extras.map(e => \`<span class="extra-tag">\${e}</span>\`).join('')}</div>\` : ''}
          </div>
        </div>\`).join('');
      const card = document.createElement('div');
      card.className = 'ticket-card ' + (t.status === 'printing' ? 'printing' : '');
      card.innerHTML = \`
        <div class="ticket-header">
          <div>
            <div class="ticket-num">#\${t.ticket_number}</div>
            <div class="ticket-table">Tisch \${t.table_number || '–'}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="ticket-wait \${urgency}">\${t.wait_mins}min</span>
            \${t.station_color ? \`<span class="station-badge" style="background:\${t.station_color}22;color:\${t.station_color};border:1px solid \${t.station_color}44">\${t.station_name || ''}</span>\` : ''}
          </div>
        </div>
        <div class="ticket-items">\${itemsHTML}</div>
        <div class="ticket-footer">
          <button class="btn-print" onclick="printTicket(\${t.id})" \${t.status==='printing'?'disabled':''}>
            \${t.status==='printing' ? '⏳ Druckt…' : '🖨 Drucken'}
          </button>
          <button class="btn-done" onclick="markDone(\${t.id})">✓</button>
        </div>\`;
      grid.appendChild(card);
    });
    area.innerHTML = '';
    area.appendChild(grid);
  }

  function renderProducts() {
    const area = document.getElementById('ticketsArea');
    const map = {};
    state.tickets.forEach(ticket => {
      ticket.items.forEach(item => {
        if (!map[item.product_name]) map[item.product_name] = [];
        map[item.product_name].push({ table: ticket.table_number, qty: item.quantity });
      });
    });
    if (!Object.keys(map).length) {
      area.innerHTML = \`<div class="empty"><div class="empty-icon">✓</div><div class="empty-text">Keine offenen Bons</div></div>\`;
      return;
    }
    const view = document.createElement('div');
    view.className = 'product-view';
    Object.entries(map).sort((a,b) => b[1].reduce((s,r)=>s+r.qty,0) - a[1].reduce((s,r)=>s+r.qty,0))
      .forEach(([name, rows]) => {
        const total = rows.reduce((s,r)=>s+r.qty,0);
        const group = document.createElement('div');
        group.className = 'product-group';
        group.innerHTML = \`
          <div class="product-group-header">
            <div class="product-group-name">\${name}</div>
            <div class="product-group-total">\${total} <span>Stück</span></div>
          </div>
          <div class="product-rows">
            \${rows.map(r=>\`<div class="product-row"><div class="product-row-table">Tisch \${r.table||'–'}</div><div class="product-row-qty">\${r.qty}×</div></div>\`).join('')}
          </div>\`;
        view.appendChild(group);
      });
    area.innerHTML = '';
    area.appendChild(view);
  }

  function renderTotals() {
    const list = document.getElementById('totalsList');
    const prev = state.prevTotals;
    const next = {};
    state.totals.forEach(t => next[t.product_name] = t.total);
    list.innerHTML = state.totals.map(t => {
      const changed = prev[t.product_name] !== t.total;
      return \`<div class="total-row">
        <span class="total-name">\${t.product_name}</span>
        <span class="total-count \${changed?'updated':''}">\${t.total}</span>
      </div>\`;
    }).join('') || \`<div style="padding:16px;color:var(--muted);font-size:14px">Keine offenen Bons</div>\`;
    document.getElementById('totalBons').textContent = state.tickets.length;
    state.prevTotals = next;
  }

  async function printTicket(id) {
    await fetch('/api/tickets/' + id + '/print', { method: 'POST' });
    await Promise.all([loadTickets(), loadTotals()]);
  }

  async function markDone(id) {
    await fetch('/api/tickets/' + id + '/done', { method: 'POST' });
    await Promise.all([loadTickets(), loadTotals()]);
  }

  init();
</script>
</body>
</html>`;
}
