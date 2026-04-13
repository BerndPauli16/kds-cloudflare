// ════════════════════════════════════════════════
//  Frontend HTML
// ════════════════════════════════════════════════

export function getHTML() {
  return `<!DOCTYPE html>
<html lang="de" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KDS Monitor</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg:    #0d0d0d; --sur:  #161618; --sur2: #1f1f22;
    --brd:   #2a2a2f; --brd2: #3a3a42; --txt:  #ffffff;
    --muted: #d0d0d8; --amber:#f59e0b; --adim: #7a4f05;
    --blue:  #3b82f6; --green:#10b981; --red:  #ef4444;
    --font:  'Barlow Condensed', sans-serif; --mono: 'Space Mono', monospace; --hh: 56px;
  }
  [data-theme="light"] {
    --bg:#f5f5f5; --sur:#ffffff; --sur2:#ececec;
    --brd:#d0d0d0; --brd2:#b0b0b0; --txt:#000000; --muted:#1a1a1a;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{width:100%;height:100%;overflow:hidden}
  body{font-family:var(--font);background:var(--bg);color:var(--txt);font-size:16px;transition:background .2s,color .2s}

  #app{width:100vw;height:100vh;display:grid;grid-template-rows:var(--hh) 1fr;overflow:hidden}

  header{
    background:var(--sur);border-bottom:1px solid var(--brd);
    display:flex;align-items:center;padding:0 14px;gap:11px;height:var(--hh);flex-shrink:0
  }
  .logo-img{height:34px;width:auto;object-fit:contain;flex-shrink:0}
  [data-theme="dark"]  .logo-img{filter:brightness(0) invert(1)}
  [data-theme="light"] .logo-img{filter:none}
  .div{width:1px;height:28px;background:var(--brd);flex-shrink:0}

  .mon-info{display:flex;flex-direction:column;line-height:1.25}
  .mon-host{font-size:13px;font-weight:700;color:var(--amber);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:190px}
  .mon-ip{font-family:var(--mono);font-size:11px;color:var(--muted)}

  .rot-grp{display:flex;gap:3px}
  .rot-btn{background:transparent;border:1px solid var(--brd);color:var(--muted);padding:5px 9px;border-radius:5px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center}
  .rot-btn:hover{border-color:var(--brd2);color:var(--txt)}
  .rot-btn.active{border-color:var(--amber);color:var(--amber);background:rgba(245,158,11,.12)}

  .theme-wrap{display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer}
  .theme-track{width:42px;height:22px;background:var(--sur2);border:1px solid var(--brd);border-radius:11px;position:relative;transition:background .2s}
  .theme-thumb{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--amber);transition:transform .2s}
  [data-theme="light"] .theme-thumb{transform:translateX(20px)}
  .theme-lbl{font-size:10px;color:var(--muted);letter-spacing:.5px;font-weight:700;text-transform:uppercase}

  .tabs{display:flex;gap:4px;margin-left:auto}
  .tab{background:transparent;border:1px solid var(--brd);color:var(--muted);font-family:var(--font);font-size:13px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:6px 16px;border-radius:5px;cursor:pointer;transition:all .15s}
  .tab.active{background:var(--amber);border-color:var(--amber);color:#000}
  .tab:not(.active):hover{border-color:var(--brd2);color:var(--txt)}

  .ws-dot{width:9px;height:9px;border-radius:50%;background:var(--muted);flex-shrink:0;transition:background .3s}
  .ws-dot.ok{background:var(--green);box-shadow:0 0 7px var(--green)}
  .ws-dot.err{background:var(--red)}

  #main{display:grid;grid-template-columns:230px 1fr;overflow:hidden}
  .ta{overflow-y:auto;padding:14px}

  aside{background:var(--sur);border-right:1px solid var(--brd);display:flex;flex-direction:column;overflow:hidden}

  .sb-head{padding:12px 16px 8px;border-bottom:1px solid var(--brd);font-size:11px;font-weight:700;letter-spacing:2px;color:var(--muted);text-transform:uppercase;flex-shrink:0}

  .totals-list{flex:1;overflow-y:auto;padding:6px 0}

  .tot-row{display:flex;justify-content:space-between;align-items:center;padding:9px 16px;border-bottom:1px solid var(--brd);transition:background .2s}
  .tot-row:hover{background:var(--sur2)}

  .tot-name{font-size:16px;font-weight:600;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
  .tot-num{font-family:var(--mono);font-size:22px;font-weight:700;color:var(--amber);min-width:36px;text-align:right}

  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  .tot-num.up{animation:pulse .5s ease}

  .sb-foot{padding:10px 16px;border-top:1px solid var(--brd);font-size:13px;color:var(--muted);display:flex;justify-content:space-between;flex-shrink:0}
  .sb-foot strong{font-family:var(--mono);color:var(--txt)}

  .ta{overflow-y:auto;padding:14px;order:1}

  @keyframes sIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .og{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;align-content:start}

  .tc{background:var(--sur);border:1px solid var(--brd);border-radius:10px;overflow:hidden;display:flex;flex-direction:column;transition:border-color .2s;animation:sIn .25s ease}
  .tc:hover{border-color:var(--brd2)} .tc.printing{border-color:var(--blue)}

  .tc-head{padding:10px 14px;background:var(--sur2);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--brd)}
  .tc-num{font-family:var(--mono);font-size:13px;font-weight:700;color:var(--amber)}
  .tc-tbl{font-size:17px;font-weight:700;color:var(--txt)}
  .tc-wait{font-size:13px;font-weight:600;padding:3px 9px;border-radius:5px;background:var(--bg);border:1px solid var(--brd);color:var(--muted)}
  .tc-wait.urg{color:var(--red);border-color:var(--red)} .tc-wait.wrn{color:var(--amber);border-color:var(--adim)}

  .tc-items{flex:1;padding:10px 14px;display:flex;flex-direction:column;gap:7px}
  .t-item{display:flex;gap:10px;align-items:flex-start}
  .t-qty{font-family:var(--mono);font-size:17px;font-weight:700;color:var(--amber);min-width:24px}
  .t-name{font-size:17px;font-weight:500;color:var(--txt)}
  .t-extras{margin-top:3px;display:flex;flex-wrap:wrap;gap:4px}
  .t-extra{font-size:12px;font-weight:500;padding:2px 7px;border-radius:4px;background:var(--sur2);border:1px solid var(--brd);color:var(--muted)}

  .tc-foot{padding:9px 14px;border-top:1px solid var(--brd);display:flex;gap:7px}
  .btn-p{flex:1;background:var(--amber);color:#000;border:none;font-family:var(--font);font-size:14px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:9px;border-radius:6px;cursor:pointer;transition:all .15s}
  .btn-p:hover:not(:disabled){background:#fbbf24} .btn-p:disabled{opacity:.35;cursor:default}
  .btn-d{background:transparent;border:1px solid var(--brd);color:var(--muted);font-family:var(--font);font-size:13px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:9px 14px;border-radius:6px;cursor:pointer;transition:all .15s}
  .btn-d:hover{border-color:var(--green);color:var(--green)}
  .t-item{cursor:pointer;border-radius:5px;padding:3px 5px;margin:-3px -5px;transition:background .15s;user-select:none}
  .t-item:hover{background:var(--sur2)}
  .t-item.sel{background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.4)}
  .t-item.done{opacity:.4;cursor:not-allowed;text-decoration:line-through;pointer-events:none}
  .t-item .sel-badge{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;border-radius:11px;background:var(--amber);color:#000;font-size:12px;font-weight:800;margin-left:6px;flex-shrink:0}
  .btn-partial{flex:1;background:transparent;color:var(--amber);border:2px solid var(--amber);font-family:var(--font);font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:9px;border-radius:6px;cursor:pointer;transition:all .15s}
  .btn-partial:hover:not(:disabled){background:rgba(245,158,11,.12)}
  .btn-partial:disabled{opacity:.25;cursor:default;border-color:var(--brd);color:var(--muted)}

  /* ── Produkt-Ansicht ── */
  .pv-wrap{display:flex;flex-direction:column;gap:0;height:100%}
  .pv-header{padding:14px 16px 10px;border-bottom:2px solid var(--amber);display:flex;align-items:baseline;gap:10px;flex-shrink:0}
  .pv-bons-num{font-family:var(--mono);font-size:42px;font-weight:700;color:var(--amber);line-height:1}
  .pv-bons-lbl{font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--txt)}
  .pv{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;padding:14px;align-content:start;overflow-y:auto;flex:1}
  .pg{background:var(--sur);border:1px solid var(--brd);border-radius:10px;overflow:hidden;animation:sIn .25s ease;display:flex;flex-direction:column}
  .pgh{padding:20px 20px;background:var(--sur2);display:flex;justify-content:space-between;align-items:center;gap:8px;border-radius:10px}
  .pgn{font-size:22px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--txt);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pgt{font-family:var(--mono);font-size:48px;font-weight:700;color:var(--amber);line-height:1;flex-shrink:0}
  .prs{padding:4px 0;flex:1}
  .pr{display:grid;grid-template-columns:1fr 50px;align-items:center;padding:7px 16px;border-bottom:1px solid var(--brd)}
  .pr:last-child{border-bottom:none}
  .pr-tbl{font-size:15px;font-weight:500;color:var(--txt)}
  .pr-qty{font-family:var(--mono);font-size:18px;font-weight:700;color:var(--amber);text-align:right}
  .s-badge{font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:.8px}

  .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:14px;color:var(--muted)}
  #main.products-view{grid-template-columns:1fr}
  #main.products-view aside{display:none}
  .empty-i{font-size:52px} .empty-t{font-size:19px;font-weight:600;letter-spacing:.8px}

  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--brd2);border-radius:3px}
</style>
</head>
<body>
<div id="app">
  <header>
    <img class="logo-img" src="data:image/png;base64,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" alt="Smarte Events">
    <div class="div"></div>
    <div class="mon-info">
      <div class="mon-host" id="mHost">–</div>
      <div class="mon-ip"   id="mIp">–.–.–.–</div>
    </div>
    <div class="div"></div>
    <div class="rot-grp">
      <button class="rot-btn" id="rL" onclick="rot('left')" title="Hochformat links">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="5" y="1" width="8" height="14" rx="2" stroke="currentColor" stroke-width="1.3"/>
          <path d="M9 8L5 4L9 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="5" y1="4" x2="13" y2="4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="rot-btn active" id="rU" onclick="rot('landscape')" title="Querformat">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="5" width="16" height="9" rx="2" stroke="currentColor" stroke-width="1.3"/>
          <path d="M9 2L12 5M9 2L6 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
      </button>
      <button class="rot-btn" id="rR" onclick="rot('right')" title="Hochformat rechts">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="5" y="1" width="8" height="14" rx="2" stroke="currentColor" stroke-width="1.3"/>
          <path d="M9 8L13 4L9 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="13" y1="4" x2="5" y2="4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div class="div"></div>
    <div class="theme-wrap" onclick="toggleTheme()">
      <div class="theme-track"><div class="theme-thumb"></div></div>
      <span class="theme-lbl" id="tLbl">DUNKEL</span>
    </div>
    <div class="tabs">
      <button class="tab active" id="tO" onclick="sv('orders')">Bestellungen</button>
      <button class="tab"        id="tP" onclick="sv('products')">Produkte</button>
    </div>
    <div class="ws-dot" id="wsDot"></div>
  </header>

  <div id="main">
    <aside>
      <div class="sb-head">Live-Summe</div>
      <div class="totals-list" id="totList"></div>
      <div class="sb-foot"><span>Offene Bons</span><strong id="totBons">0</strong></div>
    </aside>
    <div id="tickets"></div>
  </div>
</div>

<script>
const S={view:'orders',tickets:[],totals:[],ws:null,prev:{},sel:{}};
let curRot='landscape';

function toggleTheme(){
  const n=document.documentElement.dataset.theme==='dark'?'light':'dark';
  document.documentElement.dataset.theme=n;
  document.getElementById('tLbl').textContent=n==='dark'?'DUNKEL':'HELL';
  localStorage.setItem('kt',n);
}
(()=>{const s=localStorage.getItem('kt')||'dark';document.documentElement.dataset.theme=s;document.getElementById('tLbl').textContent=s==='dark'?'DUNKEL':'HELL';})();

function rot(mode){
  curRot=mode;
  // Layout bleibt immer Landscape (sidebar links → physisch unten bei Linksdrehung)
  ['rL','rU','rR'].forEach((id,i)=>document.getElementById(id).classList.toggle('active',mode===['left','landscape','right'][i]));
  applyT();
  localStorage.setItem('kr',mode);
}
function applyT(){
  const app=document.getElementById('app');
  const vw=window.innerWidth,vh=window.innerHeight;
  if(curRot==='left')       app.style.cssText='width:'+vh+'px;height:'+vw+'px;position:fixed;top:0;left:0;transform:rotate(-90deg) translateX(-100%);transform-origin:top left';
  else if(curRot==='right') app.style.cssText='width:'+vh+'px;height:'+vw+'px;position:fixed;top:0;left:0;transform:rotate(90deg) translateY(-100%);transform-origin:top left';
  else                      app.style.cssText='';
}
window.addEventListener('resize',applyT);
(()=>{const s=localStorage.getItem('kr')||'landscape';rot(s);})();

(()=>{
  document.getElementById('mHost').textContent=location.hostname;
  fetch('/api/client-ip').then(r=>r.json()).then(d=>{if(d.ip)document.getElementById('mIp').textContent=d.ip;}).catch(()=>{});
})();

async function init(){await Promise.all([loadT(),loadTot()]);connectWS();setInterval(loadT,30000);}
async function loadT(){S.tickets=await fetch(S.station?'/api/tickets?station='+S.station:'/api/tickets').then(r=>r.json());render();}
async function loadTot(){S.totals=await fetch(S.station?'/api/totals?station='+S.station:'/api/totals').then(r=>r.json());renderTot();}

function connectWS(){
  if(S.ws)S.ws.close();
  const ws=new WebSocket((location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/ws?station='+(S.station||'all'));
  S.ws=ws;
  const dot=document.getElementById('wsDot');
  ws.onopen=()=>{dot.className='ws-dot ok';setInterval(()=>ws.readyState===1&&ws.send('{"type":"ping"}'),25000);};
  ws.onclose=()=>{dot.className='ws-dot err';setTimeout(connectWS,3000);};
  ws.onmessage=async({data})=>{const m=JSON.parse(data);if(m.type==='pong')return;await Promise.all([loadT(),loadTot()]);};
}

function sv(v){
  S.view=v;
  document.getElementById('tO').classList.toggle('active',v==='orders');
  document.getElementById('tP').classList.toggle('active',v==='products');
  document.getElementById('main').classList.toggle('products-view',v==='products');
  render();
}
function render(){S.view==='orders'?rOrders():rProducts();}

function rOrders(){
  const ta=document.getElementById('tickets');
  if(!S.tickets.length){ta.innerHTML='<div class="empty"><div class="empty-i">✓</div><div class="empty-t">Keine offenen Bons</div></div>';return;}
  const g=document.createElement('div');g.className='og';
  S.tickets.forEach(t=>{
    const urg=t.wait_mins>=15?'urg':(t.wait_mins>=8?'wrn':'');
    const card=document.createElement('div');card.className='tc'+(t.status==='printing'?' printing':'');card.id='card-'+t.id;
    const itemsHtml=t.items.map((i,idx)=>{
      const k=t.id+'-'+idx; const sq=S.sel[k]||0;
      const done=i.quantity<=0;
      const cls='t-item'+(done?' done':sq>0?' sel':'');
      const badge=sq>0?'<span class="sel-badge">'+sq+'</span>':'';
      const extras=i.extras&&i.extras.length?'<div class="t-extras">'+i.extras.map(e=>'<span class="t-extra">'+e+'</span>').join('')+'</div>':'';
      const click=done?'':' onclick="selItem('+t.id+','+idx+','+i.quantity+')"';
      return '<div class="'+cls+'"'+click+'><div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap"><span class="t-qty">'+i.quantity+'×</span><span class="t-name">'+i.product_name+'</span>'+badge+'</div>'+extras+'</div>';
    }).join('');
    const hasSel=t.items.some((_,idx)=>(S.sel[t.id+'-'+idx]||0)>0);
    card.innerHTML='<div class="tc-head"><div><div class="tc-num">#'+t.ticket_number+'</div><div class="tc-tbl">Tisch '+(t.table_number||'–')+'</div></div><div style="display:flex;align-items:center;gap:6px"><span class="tc-wait '+urg+'">'+t.wait_mins+'min</span>'+(t.station_color?'<span class="s-badge" style="background:'+t.station_color+'22;color:'+t.station_color+';border:1px solid '+t.station_color+'44">'+t.station_name+'</span>':'')+'</div></div><div class="tc-items">'+itemsHtml+'</div><div class="tc-foot"><button class="btn-p" onclick="prt('+t.id+')" '+(t.status==='printing'?'disabled':'')+'>🖨 '+(t.status==='printing'?'Druckt…':'Drucken')+'</button><button class="btn-partial" id="bp-'+t.id+'" onclick="partPrt('+t.id+')" '+(hasSel?'':'disabled')+'>✂ Teildruck</button></div>';
    g.appendChild(card);
  });
  ta.innerHTML='';ta.appendChild(g);
}

function rProducts(){
  const ta=document.getElementById('tickets');
  const map={};
  S.tickets.forEach(t=>t.items.forEach(i=>{if(!map[i.product_name])map[i.product_name]=[];map[i.product_name].push({table:t.table_number,qty:i.quantity});}));

  const wrap=document.createElement('div');wrap.className='pv-wrap';

  // Bon-Zähler oben
  const hdr=document.createElement('div');hdr.className='pv-header';
  hdr.innerHTML='<span class="pv-bons-num">'+S.tickets.length+'</span><span class="pv-bons-lbl">Offene&nbsp;Bons</span>';
  wrap.appendChild(hdr);

  if(!Object.keys(map).length){
    const emp=document.createElement('div');emp.className='empty';
    emp.innerHTML='<div class="empty-i">✓</div><div class="empty-t">Keine offenen Produkte</div>';
    wrap.appendChild(emp);
    ta.innerHTML='';ta.appendChild(wrap);return;
  }

  const grid=document.createElement('div');grid.className='pv';
  Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([n,rows])=>{
    const tot=rows.reduce((s,r)=>s+r.qty,0);
    const g=document.createElement('div');g.className='pg';
    // Nur Produktname + Gesamtzahl, keine Tisch-Aufschlüsselung
    g.innerHTML='<div class="pgh"><div class="pgn">'+n+'</div><div class="pgt">'+tot+'</div></div>';
    grid.appendChild(g);
  });
  wrap.appendChild(grid);
  ta.innerHTML='';ta.appendChild(wrap);
}

function renderTot(){
  const list=document.getElementById('totList');
  const prev=S.prev;const next={};
  S.totals.forEach(t=>next[t.product_name]=t.total);
  list.innerHTML=S.totals.map(t=>'<div class="tot-row"><span class="tot-name">'+t.product_name+'</span><span class="tot-num'+(prev[t.product_name]!==t.total?' up':'')+'" >'+t.total+'</span></div>').join('')||'<div style="padding:14px;color:var(--muted);font-size:15px">Keine offenen Bons</div>';
  document.getElementById('totBons').textContent=S.tickets.length;
  S.prev=next;
}

function selItem(tid,idx,maxQty){
  if(maxQty<=0) return;
  const k=tid+'-'+idx;
  S.sel[k]=((S.sel[k]||0)+1)>maxQty?0:(S.sel[k]||0)+1;
  // Nur diese Karte neu rendern
  const t=S.tickets.find(x=>x.id===tid);if(!t)return;
  const card=document.getElementById('card-'+tid);if(!card)return;
  const itemsDiv=card.querySelector('.tc-items');
  itemsDiv.innerHTML=t.items.map((i,i2)=>{
    const sk=tid+'-'+i2; const sq=S.sel[sk]||0;
    const done=i.quantity<=0;
    const cls='t-item'+(done?' done':sq>0?' sel':'');
    const badge=sq>0?'<span class="sel-badge">'+sq+'</span>':'';
    const extras=i.extras&&i.extras.length?'<div class="t-extras">'+i.extras.map(e=>'<span class="t-extra">'+e+'</span>').join('')+'</div>':'';
    const click=done?'':' onclick="selItem('+tid+','+i2+','+i.quantity+')"';
    return '<div class="'+cls+'"'+click+'><div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap"><span class="t-qty">'+i.quantity+'×</span><span class="t-name">'+i.product_name+'</span>'+badge+'</div>'+extras+'</div>';
  }).join('');
  const hasSel=t.items.some((_,i2)=>(S.sel[tid+'-'+i2]||0)>0);
  const bp=document.getElementById('bp-'+tid);if(bp)bp.disabled=!hasSel;
}

async function partPrt(tid){
  const t=S.tickets.find(x=>x.id===tid);if(!t)return;
  const items=t.items.map((i,idx)=>({...i,quantity:S.sel[tid+'-'+idx]||0})).filter(i=>i.quantity>0);
  if(!items.length)return;
  const bp=document.getElementById('bp-'+tid);if(bp){bp.disabled=true;bp.textContent='⏳ Druckt…';}
  // Sofort State aktualisieren
  items.forEach(sel=>{
    const item=t.items.find(i=>i.product_name===sel.product_name);
    if(item) item.quantity-=sel.quantity;
  });
  t.items=t.items.filter(i=>i.quantity>0);
  const ticketGone=t.items.length===0;
  if(ticketGone) S.tickets=S.tickets.filter(x=>x.id!==tid);
  t.items.forEach((_,idx)=>delete S.sel[tid+'-'+idx]);

  // Nur die eine Karte updaten (kein Full-Rerender)
  if(ticketGone){
    const card=document.getElementById('card-'+tid);
    if(card) card.parentElement&&card.parentElement.removeChild(card);
    if(!S.tickets.length) document.getElementById('tickets').innerHTML='<div class="empty"><div class="empty-i">✓</div><div class="empty-t">Keine offenen Bons</div></div>';
  } else {
    // Nur Items dieser Karte neu rendern
    const card=document.getElementById('card-'+tid);
    if(card){
      const itemsDiv=card.querySelector('.tc-items');
      if(itemsDiv) itemsDiv.innerHTML=t.items.map((i,i2)=>{
        const cls='t-item'+(i.quantity<=0?' done':'');
        const click=i.quantity<=0?'':' onclick="selItem('+tid+','+i2+','+i.quantity+')"';
        const extras=i.extras&&i.extras.length?'<div class="t-extras">'+i.extras.map(e=>'<span class="t-extra">'+e+'</span>').join('')+'</div>':'';
        return '<div class="'+cls+'"'+click+'><div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap"><span class="t-qty">'+i.quantity+'×</span><span class="t-name">'+i.product_name+'</span></div>'+extras+'</div>';
      }).join('');
      const bp2=card.querySelector('[id^="bp-"]');
      if(bp2) bp2.disabled=true;
    }
  }

  // Live-Summe sofort aktualisieren
  rebuildTotals();
  renderTot();
  // Wenn Produktansicht aktiv: auch dort sofort updaten
  if(S.view==='products') rProducts();

  // API im Hintergrund — kein await, kein Warten
  fetch('/api/tickets/'+tid+'/partial-print',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})})
    .then(()=>Promise.all([loadT(),loadTot()]))
    .catch(()=>{if(bp){bp.disabled=false;bp.textContent='✂ Teildruck';}});
}

function rebuildTotals(){
  const map={};
  S.tickets.forEach(t=>t.items.forEach(i=>{
    if(!map[i.product_name])map[i.product_name]=0;
    map[i.product_name]+=i.quantity;
  }));
  S.totals=Object.entries(map).map(([product_name,total])=>({product_name,total}))
    .sort((a,b)=>b.total-a.total);
}

async function prt(id){
  const btn=document.querySelector('[onclick="prt('+id+')"]');
  if(btn){btn.disabled=true;btn.textContent='⏳ Druckt…';}
  // Sofort aus lokalem State entfernen → UI aktualisiert sich instant
  S.tickets=S.tickets.filter(t=>t.id!==id);
  rebuildTotals();
  render();
  renderTot();
  // API im Hintergrund
  fetch('/api/tickets/'+id+'/print',{method:'POST'}).then(()=>
    fetch('/api/tickets/'+id+'/done',{method:'POST'})
  ).then(()=>Promise.all([loadT(),loadTot()]));
}

async function don(id){await fetch('/api/tickets/'+id+'/done',{method:'POST'});await Promise.all([loadT(),loadTot()]);}

init();
</script>
</body>
</html>`;
}
