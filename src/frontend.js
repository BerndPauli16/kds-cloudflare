// ════════════════════════════════════════════════
//  Frontend HTML – wird vom Worker als String serviert
// ════════════════════════════════════════════════

export function getHTML() {
  return `<!DOCTYPE html>
<html lang="de">
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

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--font-ui);
    background: var(--bg);
    color: var(--text);
    height: 100dvh;
    display: grid;
    grid-template-rows: 52px 1fr;
    overflow: hidden;
  }

  /* ── Header ── */
  header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 16px;
    position: relative;
  }

  .logo {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 2px;
    color: var(--amber);
    text-transform: uppercase;
    user-select: none;
  }

  .logo span { color: var(--muted); }

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

  .station-select {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: .5px;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
    outline: none;
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

  /* ── Sidebar ── */
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

  .total-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
  }

  .total-count {
    font-family: var(--font-mono);
    font-size: 18px;
    font-weight: 700;
    color: var(--amber);
    min-width: 32px;
    text-align: right;
  }

  .total-count.updated {
    animation: pulse .4s ease;
    color: #fff;
  }

  .sidebar-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    font-size: 12px;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
  }

  .sidebar-footer strong {
    font-family: var(--font-mono);
    color: var(--text);
  }

  /* ── Tickets Bereich ── */
  .tickets-area {
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ── Bestellungsansicht ── */
  .order-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
    align-content: start;
  }

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
  .ticket-card.done     { opacity: .4; border-color: var(--green); }

  .ticket-header {
    padding: 10px 12px;
    background: var(--surface2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border);
  }

  .ticket-num {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--amber);
  }

  .ticket-table {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
  }

  .ticket-wait {
    font-size: 12px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 4px;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--muted);
  }
  .ticket-wait.urgent { color: var(--red); border-color: var(--red); }
  .ticket-wait.warn   { color: var(--amber); border-color: var(--amber-dim); }

  .ticket-items {
    flex: 1;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ticket-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .item-qty {
    font-family: var(--font-mono);
    font-size: 16px;
    font-weight: 700;
    color: var(--amber);
    min-width: 22px;
  }

  .item-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
  }

  .item-extras {
    margin-top: 2px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .extra-tag {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 3px;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--muted);
    letter-spacing: .3px;
  }

  .ticket-footer {
    padding: 8px 12px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 6px;
  }

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

  /* ── Produktansicht ── */
  .product-view {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .product-group {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    animation: slideIn .25s ease;
  }

  .product-group-header {
    padding: 12px 16px;
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .product-group-name {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text);
  }

  .product-group-total {
    font-family: var(--font-mono);
    font-size: 24px;
    font-weight: 700;
    color: var(--amber);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .product-group-total span {
    font-size: 12px;
    color: var(--muted);
    font-family: var(--font-ui);
    font-weight: 600;
  }

  .product-rows {
    padding: 4px 0;
  }

  .product-row {
    display: grid;
    grid-template-columns: 1fr 60px;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
    gap: 8px;
  }
  .product-row:last-child { border-bottom: none; }

  .product-row-table {
    font-size: 15px;
    font-weight: 600;
    color: var(--muted);
  }

  .product-row-qty {
    font-family: var(--font-mono);
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
    text-align: right;
  }

  /* ── Empty state ── */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: var(--muted);
  }

  .empty-icon { font-size: 48px; }
  .empty-text { font-size: 18px; font-weight: 600; letter-spacing: 1px; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

  .station-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
</style>
</head>
<body>

<header>
  <div class="logo">KDS<span>●</span>Monitor</div>

  <select class="station-select" id="stationSelect">
    <option value="">Alle Stationen</option>
  </select>

  <div class="view-tabs">
    <button class="tab-btn active" id="tabOrders" onclick="setView('orders')">Bestellungen</button>
    <button class="tab-btn"        id="tabProducts" onclick="setView('products')">Produkte</button>
  </div>

  <div class="ws-dot" id="wsDot" title="WebSocket"></div>
</header>

<div class="main">
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
    view:     'orders',
    station:  '',
    tickets:  [],
    totals:   [],
    ws:       null,
    prevTotals: {},
  };

  // ── Init ────────────────────────────────────────
  async function init() {
    await loadStations();
    await Promise.all([loadTickets(), loadTotals()]);
    connectWS();
    setInterval(loadTickets, 30000);   // Fallback-Refresh alle 30s
  }

  // ── Stationen laden ─────────────────────────────
  async function loadStations() {
    const res  = await fetch('/api/stations');
    const list = await res.json();
    const sel  = document.getElementById('stationSelect');
    list.forEach(s => {
      const o = document.createElement('option');
      o.value = s.id; o.textContent = s.name;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => {
      state.station = sel.value;
      loadTickets(); loadTotals();
      connectWS();
    });
  }

  // ── Tickets laden ────────────────────────────────
  async function loadTickets() {
    const url = state.station ? '/api/tickets?station=' + state.station : '/api/tickets';
    const res     = await fetch(url);
    state.tickets = await res.json();
    renderView();
  }

  // ── Summen laden ─────────────────────────────────
  async function loadTotals() {
    const url = state.station ? '/api/totals?station=' + state.station : '/api/totals';
    const res    = await fetch(url);
    state.totals = await res.json();
    renderTotals();
  }

  // ── WebSocket ────────────────────────────────────
  function connectWS() {
    if (state.ws) state.ws.close();
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const room  = state.station || 'all';
    const ws    = new WebSocket(proto + '://' + location.host + '/ws?station=' + room);
    state.ws    = ws;

    const dot = document.getElementById('wsDot');

    ws.onopen = () => {
      dot.className = 'ws-dot connected';
      setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ type: 'ping' })), 25000);
    };

    ws.onclose = () => {
      dot.className = 'ws-dot disconnected';
      setTimeout(connectWS, 3000);
    };

    ws.onmessage = async ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.type === 'pong') return;

      // Bei jedem Event Tickets + Summen neu laden
      await Promise.all([loadTickets(), loadTotals()]);
    };
  }

  // ── View umschalten ──────────────────────────────
  function setView(v) {
    state.view = v;
    document.getElementById('tabOrders').classList.toggle('active', v === 'orders');
    document.getElementById('tabProducts').classList.toggle('active', v === 'products');
    renderView();
  }

  // ── Render Dispatcher ────────────────────────────
  function renderView() {
    state.view === 'orders' ? renderOrders() : renderProducts();
  }

  // ── Bestellungsansicht ───────────────────────────
  function renderOrders() {
    const area = document.getElementById('ticketsArea');

    if (!state.tickets.length) {
      area.innerHTML = \`<div class="empty">
        <div class="empty-icon">✓</div>
        <div class="empty-text">Keine offenen Bons</div>
      </div>\`;
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
            \${item.extras && item.extras.length ? \`
              <div class="item-extras">
                \${item.extras.map(e => \`<span class="extra-tag">\${e}</span>\`).join('')}
              </div>\` : ''}
          </div>
        </div>
      \`).join('');

      const card = document.createElement('div');
      card.className = 'ticket-card ' + (t.status === 'printing' ? 'printing' : '');
      card.innerHTML = \`
        <div class="ticket-header">
          <div>
            <div class="ticket-num">#\${t.ticket_number}</div>
            <div class="ticket-table">Tisch \${t.table_number || '–'}</div>
          </div>
          <div>
            <span class="ticket-wait \${urgency}">\${t.wait_mins}min</span>
            \${t.station_color ? \`<span class="station-badge" style="background:\${t.station_color}22;color:\${t.station_color};border:1px solid \${t.station_color}44;margin-left:6px">\${t.station_name || ''}</span>\` : ''}
          </div>
        </div>
        <div class="ticket-items">\${itemsHTML}</div>
        <div class="ticket-footer">
          <button class="btn-print" onclick="printTicket(\${t.id})" \${t.status==='printing'?'disabled':''}>
            \${t.status==='printing' ? '⏳ Druckt…' : '🖨 Drucken'}
          </button>
          <button class="btn-done" onclick="markDone(\${t.id})">✓</button>
        </div>
      \`;
      grid.appendChild(card);
    });

    area.innerHTML = '';
    area.appendChild(grid);
  }

  // ── Produktansicht ───────────────────────────────
  function renderProducts() {
    const area = document.getElementById('ticketsArea');

    // Nach Produkt gruppieren
    const map = {};
    state.tickets.forEach(ticket => {
      ticket.items.forEach(item => {
        if (!map[item.product_name]) map[item.product_name] = [];
        map[item.product_name].push({ table: ticket.table_number, qty: item.quantity });
      });
    });

    if (!Object.keys(map).length) {
      area.innerHTML = \`<div class="empty">
        <div class="empty-icon">✓</div>
        <div class="empty-text">Keine offenen Bons</div>
      </div>\`;
      return;
    }

    const view = document.createElement('div');
    view.className = 'product-view';

    Object.entries(map).sort((a,b) => {
      const sumA = a[1].reduce((s,r) => s + r.qty, 0);
      const sumB = b[1].reduce((s,r) => s + r.qty, 0);
      return sumB - sumA;
    }).forEach(([name, rows]) => {
      const total = rows.reduce((s, r) => s + r.qty, 0);
      const group = document.createElement('div');
      group.className = 'product-group';
      group.innerHTML = \`
        <div class="product-group-header">
          <div class="product-group-name">\${name}</div>
          <div class="product-group-total">\${total} <span>Stück</span></div>
        </div>
        <div class="product-rows">
          \${rows.map(r => \`
            <div class="product-row">
              <div class="product-row-table">Tisch \${r.table || '–'}</div>
              <div class="product-row-qty">\${r.qty}×</div>
            </div>
          \`).join('')}
        </div>
      \`;
      view.appendChild(group);
    });

    area.innerHTML = '';
    area.appendChild(view);
  }

  // ── Live-Summen Sidebar ──────────────────────────
  function renderTotals() {
    const list = document.getElementById('totalsList');
    const prev = state.prevTotals;
    const next = {};
    state.totals.forEach(t => next[t.product_name] = t.total);

    list.innerHTML = state.totals.map(t => {
      const changed = prev[t.product_name] !== t.total;
      return \`<div class="total-row">
        <span class="total-name">\${t.product_name}</span>
        <span class="total-count \${changed ? 'updated' : ''}">\${t.total}</span>
      </div>\`;
    }).join('') || \`<div style="padding:16px;color:var(--muted);font-size:14px">Keine offenen Bons</div>\`;

    document.getElementById('totalBons').textContent = state.tickets.length;
    state.prevTotals = next;
  }

  // ── Aktionen ─────────────────────────────────────
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
