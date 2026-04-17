var NL=String.fromCharCode(10);

const S={view:'orders',tickets:[],totals:[],ws:null,prev:{},sel:{}};
(function(){var h=location.hostname.split('.')[0];if(h==='monitor2')S.station='2';else if(h==='monitor1')S.station='1';})();
let curRot='landscape';

// ─── Drucker-Konfiguration ───────────────────────────────────────────────
const API_KEY = 'kds-smarte-events-2026';

function saveDisplayName() {
  var name = document.getElementById('cfgDisplayName').value.trim();
  if (name) {
    localStorage.setItem('kds_display_name', name);
    document.getElementById('mHost').textContent = name;
  } else {
    localStorage.removeItem('kds_display_name');
    document.getElementById('mHost').textContent = location.hostname.split('.')[0];
  }
  var btn = document.querySelector('[onclick="saveDisplayName()"]');
  if (btn) { btn.textContent = '✓ Gespeichert'; setTimeout(()=>{ btn.textContent = '💾 Speichern'; }, 1500); }
}
function openCfg() {
  // Input mit aktuellem Namen befüllen
  var inp = document.getElementById('cfgDisplayName');
  if (inp) inp.value = localStorage.getItem('kds_display_name') || '';
  // Pi-IP vom Agent-Endpoint laden (vom Pi selbst gemeldet)
  fetch('/api/agent' + (S.station ? '?station=' + S.station : '')).then(r=>r.json()).then(agent => {
    if (agent && agent.ip) {
      document.getElementById('piIpDisplay').textContent = agent.ip;
      if (document.getElementById('aselloIp')) document.getElementById('aselloIp').textContent = agent.ip;
      document.getElementById('cfgProxyIp').value = agent.ip;
    }
    if (agent && agent.hostname) {
      document.getElementById('piIpDisplay').textContent += '  (' + agent.hostname + ')';
    }
  }).catch(() => {
    document.getElementById('piIpDisplay').textContent = '192.168.192.70 (fix)';
  });

  fetch('/api/config' + (S.station ? '?station=' + S.station : '')).then(r=>r.json()).then(cfg => {
    document.getElementById('cfgProxyIp').value    = cfg.proxyIp      || '192.168.192.70';
    document.getElementById('cfgProxyPort').value  = cfg.proxyPort    || '8009';
    document.getElementById('cfgPrinterIp').value  = cfg.printerIp    || '192.168.192.202';
    document.getElementById('cfgPrinterPort').value= cfg.printerPort  || '9100';
    document.getElementById('cfgChars').value      = cfg.charsPerLine || '42';
    document.getElementById('cfgBackupIp').value   = cfg.backupIp     || '';
    document.getElementById('cfgBackupPort').value = cfg.backupPort   || '9100';
    updateProxyPreview(); updateCplPreview();
    document.getElementById('cfgModal').classList.add('open');
  }).catch(() => {
    document.getElementById('cfgModal').classList.add('open');
    updateCplPreview();
  });
}

function closeCfg() {
  document.getElementById('cfgModal').classList.remove('open');
  cfgMsg('', '');
}

function updateProxyPreview() {
  const ip = document.getElementById('cfgProxyIp').value || '192.168.192.70';
  document.getElementById('proxyPreview').textContent =
    'In asello eintragen: IP = ' + ip + ' | Port = 80 | E-POS: AUS | Ohne Warten: AN';
}

function toggleAsello() {
  const btn = document.getElementById('aselloAccBtn');
  const body = document.getElementById('aselloAccBody');
  btn.classList.toggle('open');
  body.classList.toggle('open');
  btn.querySelector('span:first-child').textContent = btn.classList.contains('open')
    ? '📋 asello Drucker-Einstellungen verbergen'
    : '📋 asello Drucker-Einstellungen anzeigen';
}

function updateCplPreview() {
  const n = parseInt(document.getElementById('cfgChars').value) || 42;
  const nums = '1234567890';
  document.getElementById('cplPreview').textContent = (nums.repeat(10)).substring(0, n) + ' (' + n + ')';
}

async function clearOldTickets() {
  const min = parseInt(document.getElementById('clearMinutes').value) || 60;
  if (!confirm('Alle Tickets älter als ' + min + ' Minuten wirklich löschen?')) return;
  try {
    const res = await fetch('/api/tickets/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body: JSON.stringify({ olderThanMinutes: min })
    });
    const d = await res.json();
    if (d.ok) {
      cfgMsg('✓ Alte Tickets gelöscht!', 'ok');
      setTimeout(() => { closeCfg(); }, 1000);
    } else cfgMsg('Fehler beim Löschen', 'err');
  } catch(e) { cfgMsg('Fehler: ' + e.message, 'err'); }
}

function cfgMsg(text, type) {
  const el = document.getElementById('cfgMsg');
  el.textContent = text;
  el.className = 'cfg-msg' + (type ? ' ' + type : '');
}

async function saveCfg() {
  const body = {
    proxyIp:     document.getElementById('cfgProxyIp').value.trim(),
    proxyPort:   parseInt(document.getElementById('cfgProxyPort').value) || 8009,
    printerIp:   document.getElementById('cfgPrinterIp').value.trim(),
    printerPort: parseInt(document.getElementById('cfgPrinterPort').value) || 9100,
    charsPerLine:parseInt(document.getElementById('cfgChars').value) || 42,
    stationId:   S.station || null,
    backupIp:    document.getElementById('cfgBackupIp').value.trim(),
    backupPort:  parseInt(document.getElementById('cfgBackupPort').value) || 9100,
  };
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      cfgMsg('✓ Gespeichert!', 'ok');
      setTimeout(closeCfg, 1200);
    } else {
      cfgMsg('Fehler beim Speichern', 'err');
    }
  } catch(e) { cfgMsg('Netzwerkfehler: ' + e.message, 'err'); }
}

// Drucker-Scan: Pi triggert Auto-Discovery
async function doScanPrinter() {
  const btn = document.getElementById('scanBtn');
  if(btn) { btn.textContent='⏳'; btn.disabled=true; }
  try {
    // Pi-IP holen
    const agentRes = await fetch('/api/agent' + (S.station ? '?station=' + S.station : ''));
    const agent = await agentRes.json();
    if(!agent || !agent.ip) { alert('Pi nicht erreichbar!'); return; }
    // Pi-Proxy triggern: DELETE request auf /scan-printer
    const piUrl = 'http://' + agent.ip;
    const r = await fetch(piUrl + '/scan-printer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger: true })
    });
    const d = await r.json().catch(()=>({error:'Keine Antwort'}));
    if(d.found) {
      document.getElementById('cfgPrinterIp').value = d.ip;
      if(btn) { btn.textContent='✓'; setTimeout(()=>{btn.textContent='🔍';btn.disabled=false;},2000); }
      showCfgMsg('Drucker gefunden: ' + d.ip, false);
    } else {
      if(btn) { btn.textContent='✗'; setTimeout(()=>{btn.textContent='🔍';btn.disabled=false;},2000); }
      showCfgMsg('Kein Drucker gefunden im Netzwerk', true);
    }
  } catch(e) {
    if(btn) { btn.textContent='🔍'; btn.disabled=false; }
    showCfgMsg('Fehler: ' + e.message, true);
  }
}

async function doTestPrint() {
  const btn = document.getElementById('testBtn');
  btn.textContent = '⏳ Drucke…';
  btn.disabled = true;
  cfgMsg('Testdruck wird gesendet…', 'info');
  // Direkt zum Pi (lokales Netz) - Browser kann lokale IPs erreichen
  const proxyIp   = document.getElementById('cfgProxyIp').value   || '192.168.192.70';
  const charsPerLine = parseInt(document.getElementById('cfgChars').value) || 42;
  try {
    const res = await fetch('http://' + proxyIp + '/test-print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ charsPerLine })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      cfgMsg('✓ Testdruck erfolgreich! Zeichen zählen und eintragen.', 'ok');
    } else {
      cfgMsg('Fehler: ' + (data.error || 'Pi nicht erreichbar?'), 'err');
    }
  } catch(e) {
    cfgMsg('Fehler: Pi nicht erreichbar (' + e.message + ')', 'err');
  } finally {
    btn.textContent = '🖨 Testdruck';
    btn.disabled = false;
  }
}


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
  fetch('/api/config' + (S.station ? '?station=' + S.station : '')).then(r=>r.json()).then(d=>{if(d&&d.printerIp)document.getElementById('pipInp').value=d.printerIp;}).catch(()=>{});

  // Anzeigename: gespeicherter Name aus localStorage oder URL-Hostname
  var _savedName = localStorage.getItem('kds_display_name');
  var _defaultName = location.hostname.split('.')[0];
  document.getElementById('mHost').textContent = _savedName || _defaultName;
  // Pi-IP vom Heartbeat laden (alle 30s aktuell)
  function refreshPiIp(){
    var ipEl  = document.getElementById('mIp');
    var cfgEl = document.querySelector('.cfg-btn');
    fetch('/api/agent' + (S.station ? '?station=' + S.station : ''))
      .then(r=>r.json())
      .then(function(a){
        if (!a || !a.ip) {
          ipEl.textContent = 'OFFLINE'; ipEl.classList.add('pi-offline');
          if(cfgEl) cfgEl.classList.add('pi-offline'); return;
        }
        var ageSec = a.updated_at ? Math.round((Date.now() - new Date(a.updated_at).getTime()) / 1000) : 999;
        if (ageSec > 90) {
          ipEl.textContent = 'OFFLINE  ' + a.ip; ipEl.classList.add('pi-offline');
          if(cfgEl) cfgEl.classList.add('pi-offline');
        } else {
          ipEl.textContent = a.ip; ipEl.classList.remove('pi-offline');
          if(cfgEl) cfgEl.classList.remove('pi-offline');
        }
      })
      .catch(function(){ ipEl.textContent = '–.–.–.–'; });
  }
  refreshPiIp();
  setInterval(()=>{
    fetch('/api/config' + (S.station ? '?station=' + S.station : '')).then(r=>r.json()).then(d=>{if(d&&d.printerIp)document.getElementById('pipInp').value=d.printerIp;}).catch(()=>{});
    refreshPiIp();
  }, 30000);
})();

// Pins: {name: {slot, color}} – localStorage
const PINS = JSON.parse(localStorage.getItem('kds_pins') || '{}');
function savePins(){ localStorage.setItem('kds_pins', JSON.stringify(PINS)); }

// Farben für ALLE Produkte (auch nicht-gepinnte) – bleiben erhalten
const COLORS = JSON.parse(localStorage.getItem('kds_colors') || '{}');
function saveColors(){ localStorage.setItem('kds_colors', JSON.stringify(COLORS)); }

function movePin(name, dir) {
  if (!PINS[name]) return;
  const sorted = Object.entries(PINS).sort((a,b)=>a[1].slot-b[1].slot);
  const idx = sorted.findIndex(([n])=>n===name);
  const swapIdx = idx + dir;
  if (swapIdx < 0 || swapIdx >= sorted.length) return;
  // Slots tauschen
  const tmp = sorted[idx][1].slot;
  PINS[sorted[idx][0]].slot = PINS[sorted[swapIdx][0]].slot;
  PINS[sorted[swapIdx][0]].slot = tmp;
  savePins();
  if (S.view === 'products') rProducts();
}

function togglePin(name) {
  if (PINS[name]) {
    delete PINS[name];
  } else {
    // Nächsten freien Slot am Anfang
    const used = new Set(Object.values(PINS).map(p=>p.slot));
    let slot = 0;
    while (used.has(slot)) slot++;
    PINS[name] = { slot, color: null };
  }
  savePins();
  if (S.view === 'products') rProducts();
}

function setPinColor(name, color) {
  // Farbe für ALLE Produkte speichern (nicht nur gepinnte)
  COLORS[name] = color;
  saveColors();
  if (PINS[name]) {
    PINS[name].color = color;
    savePins();
  }
  const card = document.querySelector('[data-prod="'+name.replace(/"/g,'&quot;')+'"]');
  if (card) applyPinColor(card, color);
}

function applyPinColor(card, color) {
  if (color) {
    card.style.background = color + '33';  // voller Hintergrund, leicht transparent
    card.style.borderColor = color;
    const btn = card.querySelector('.color-btn');
    if (btn) btn.style.background = color;
    const pgh = card.querySelector('.pgh');
    if (pgh) pgh.style.background = color + '55';  // Kopf etwas dunkler
  } else {
    card.style.background = '';
    card.style.borderColor = '';
    const pgh = card.querySelector('.pgh');
    if (pgh) pgh.style.background = '';
  }
}

async function init(){
  await Promise.all([loadT(),loadTot()]);
  connectWS();
  setInterval(loadT,15000); // Alle 15s statt 30s für schnelleres Recover
  // Netzwerkwechsel: sofort neu laden wenn online
  window.addEventListener('online', ()=>{
    console.log('[NET] Online – reconnect WS + reload');
    Promise.all([loadT(),loadTot()]);
    if(!S.ws||S.ws.readyState>1) connectWS();
  });
  // Aus Standby/Hintergrund zurück: Daten sofort aktualisieren
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden){
      Promise.all([loadT(),loadTot()]);
      if(!S.ws||S.ws.readyState>1) connectWS();
    }
  });
}
async function loadT(){
  try{
    const r=await fetch(S.station?'/api/tickets?station='+S.station:'/api/tickets');
    if(r.ok){S.tickets=await r.json();render();}
  }catch(e){/* Netzwerk nicht verfügbar - still fail */}
}
async function loadTot(){
  try{
    const r=await fetch(S.station?'/api/totals?station='+S.station:'/api/totals');
    if(r.ok){S.totals=await r.json();renderTot();}
  }catch(e){}
}

var _wsRetry=1000;
function connectWS(){
  if(S.ws){try{S.ws.close();}catch(e){}}
  const dot=document.getElementById('wsDot');
  dot.className='ws-dot err';
  const ws=new WebSocket((location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/ws?station='+(S.station||'all'));
  S.ws=ws;
  var ping=null;
  ws.onopen=()=>{
    dot.className='ws-dot ok';
    _wsRetry=1000; // Reset Backoff
    if(ping)clearInterval(ping);
    ping=setInterval(()=>{if(ws.readyState===1)ws.send('{"type":"ping"}');},25000);
    // Sofort Daten laden nach Reconnect
    Promise.all([loadT(),loadTot()]);
  };
  ws.onclose=()=>{
    dot.className='ws-dot err';
    if(ping)clearInterval(ping);
    // Exponentielles Backoff: 1s → 2s → 4s → max 30s
    setTimeout(connectWS, _wsRetry);
    _wsRetry=Math.min(_wsRetry*2, 30000);
  };
  ws.onerror=()=>{
    dot.className='ws-dot err';
    try{ws.close();}catch(e){}
  };
  ws.onmessage=({data})=>{
    try{
      const m=JSON.parse(data);
      if(m.type==='pong') return;
      Promise.all([loadT(),loadTot()]);
    }catch(e){}
  };
}

// ─── Virtual Printer ────────────────────────────────────────────────────
let VP={type:'in',paused:false,timer:null};
function vpType(t){
  VP.type=t;
  document.getElementById('vpIn').classList.toggle('active',t==='in');
  document.getElementById('vpOut').classList.toggle('active',t==='out');
  vpLoad();
}
async function vpLoad(){
  try{
    var apiType=VP.type==='in'?'incoming':'outgoing';
    var bRes=await fetch('/api/bon-log?type='+apiType+'&limit=3');
    var sRes=await fetch('/api/bons/state');
    var bons=await bRes.json();
    var state=await sRes.json();
    VP.paused=state.paused||false; vpUpdatePlayBtn();
    var el=document.getElementById('vpBons');
    if(!bons||!bons.length){el.innerHTML='<div class="vp-empty">Keine Bons vorhanden</div>';return;}
    el.innerHTML='<div class="bon-list2">'+bons.map(function(b){
      var t=new Date(b.created_at);
      var ts=t.toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
      var badge=VP.type==='in'?'<span class="bon-badge2 in">EINGANG</span>':'<span class="bon-badge2 out">AUSGANG</span>';
      var lines=(b.preview||'').split(NL);
      var bodyHtml=lines.map(function(l){
        var esc=l.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        if(!esc.trim()) return '';
        if(esc==='---' || esc.match(/^[-=]{3,}$/)) return '<hr style="border:none;border-top:1px dashed #bbb;margin:4px 0">';
        if(esc==='EIN TEIL VON' || esc==='DER REST VON') return '<div style="text-align:center;font-weight:700;font-size:13px;padding:3px 0;letter-spacing:.05em">'+esc+'</div>';
        if(esc.indexOf('## ')===0){
          var itemTxt=esc.slice(3).trim();
          var mI=itemTxt.match(/(\d+)[x]?\s+(.+)/);
          if(mI) return '<div style="font-weight:700;font-size:14px;padding:2px 0">'+mI[1]+'x&nbsp; '+mI[2]+'</div>';
          return '<div style="font-weight:700;font-size:14px;padding:2px 0">'+itemTxt+'</div>';
        }
        if(esc.indexOf('BONIERT:')===0 || esc.indexOf('DAUER:')===0 || esc.indexOf('BIS GEDRUCKT')===0)
          return '<div style="font-family:monospace;font-size:11px;color:#555;padding:1px 0">'+esc+'</div>';
        return '<div class="bon-raw-line">'+esc+'</div>';
      }).join('');
      return '<div class="bon-card" style="position:relative">'+
        '<button class="bon-del2" style="position:absolute;top:6px;right:6px;z-index:1;background:#e8e5dd80;border-radius:50%;width:22px;height:22px;font-size:14px;display:flex;align-items:center;justify-content:center;padding:0" onclick="vpDelete('+b.id+')" title="Loeschen">&times;</button>'+
        '<div class="bon-body2">'+bodyHtml+'</div>'+
        '<div class="bon-cut"></div>'+
      '</div>';
    }).join('')+'</div>';
  }catch(e){document.getElementById('vpBons').innerHTML='<div class="vp-empty">Fehler</div>';}
}

async function vpTogglePlay(){VP.paused=!VP.paused;vpUpdatePlayBtn();await fetch('/api/bons/state',{method:'POST',headers:{'Content-Type':'application/json','X-API-Key':API_KEY},body:JSON.stringify({paused:VP.paused})});}
function vpUpdatePlayBtn(){const btn=document.getElementById('vpPlay');const icon=document.getElementById('vpPlayIcon');const lbl=document.getElementById('vpPlayLabel');if(VP.paused){btn.className='vp-play paused';icon.textContent='⏸';lbl.textContent='PAUSIERT';}else{btn.className='vp-play playing';icon.textContent='▶';lbl.textContent='AKTIV';}}
async function vpDelete(id){await fetch('/api/bons/'+id,{method:'DELETE',headers:{'X-API-Key':API_KEY}});vpLoad();}
function vpStartTimer(){if(VP.timer)clearInterval(VP.timer);VP.timer=setInterval(vpLoad,5000);}

function sv(v){
  S.view=v;
  document.getElementById('tO').classList.toggle('active',v==='orders');
  document.getElementById('tP').classList.toggle('active',v==='products');
  document.getElementById('tV').classList.toggle('active',v==='virtual');
  document.getElementById('tH') && document.getElementById('tH').classList.toggle('active',v==='history');
  var hv=document.getElementById('histView');
  if(hv) hv.classList.toggle('active',v==='history');
  document.getElementById('main').classList.toggle('products-view',v==='products');
  document.getElementById('main').style.display = (v==='virtual'||v==='history') ? 'none' : '';
  if(v==='history') histLoad();
  const vpView=document.getElementById('vp-view');
  if(vpView){vpView.classList.toggle('active',v==='virtual');if(v==='virtual'){vpLoad();vpStartTimer();}else if(VP.timer){clearInterval(VP.timer);VP.timer=null;}}
  render();
}
function render(){S.view==='orders'?rOrders():rProducts();}

function rOrders(){
  const ta=document.getElementById('tickets');
  if(!S.tickets.length){ta.innerHTML='<div class="empty"><div class="empty-i">✓</div><div class="empty-t">Keine offenen Bons</div></div>';return;}
  const g=document.createElement('div');g.className='og';

  S.tickets.forEach(t=>{
    const urg=t.wait_mins>=15?'urg':(t.wait_mins>=8?'wrn':'');
    // Pin-Farbe: höchstpriorisiertes gepinntes Produkt im Bon
    const pinMatch=t.items.map(i=>PINS[i.product_name]).filter(Boolean).sort((a,b)=>a.slot-b.slot)[0];
    const pinColor=pinMatch&&pinMatch.color?pinMatch.color:null;
    const card=document.createElement('div');
    card.className='tc'+(t.status==='printing'?' printing':'');
    card.id='card-'+t.id;

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
    card.innerHTML='<div class="tc-head"><div><div class="tc-num">#'+t.ticket_number+'</div><div class="tc-tbl">'+(t.table_number||'Bon #'+t.ticket_number)+'</div></div><div style="display:flex;align-items:center;gap:6px"><span class="tc-wait '+urg+'">'+t.wait_mins+'min</span>'+(t.station_color?'<span class="s-badge" style="background:'+t.station_color+'22;color:'+t.station_color+';border:1px solid '+t.station_color+'44">'+t.station_name+'</span>':'')+'</div></div><div class="tc-items">'+itemsHtml+'</div><div class="tc-foot"><button class="btn-p" onclick="prt('+t.id+')" '+(t.status==='printing'?'disabled':'')+'>🖨 '+(t.status==='printing'?'Druckt…':'Drucken')+'</button><button class="btn-partial" id="bp-'+t.id+'" onclick="partPrt('+t.id+')" '+(hasSel?'':'disabled')+'>✂ Teildruck</button></div>';
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

  // Produkte mit qty>0
  const prods=Object.entries(map)
    .filter(([,rows])=>rows.reduce((s,r)=>s+r.qty,0)>0)
    .map(([n,rows])=>({n,tot:rows.reduce((s,r)=>s+r.qty,0)}));

  // Gepinnte: auch wenn qty=0 anzeigen (mit zero-Klasse)
  const pinnedNames=Object.keys(PINS);
  const pinnedItems=pinnedNames.map(n=>({
    n, tot:map[n]?map[n].reduce((s,r)=>s+r.qty,0):0
  })).sort((a,b)=>PINS[a.n].slot-PINS[b.n].slot);

  // Ungepinnte: nur qty>0, alphabetisch
  const unpinned=prods.filter(p=>!PINS[p.n]).sort((a,b)=>b.tot-a.tot||a.n.localeCompare(b.n));

  // Gepinnte zuerst, dann Ungepinnte
  const result=[...pinnedItems,...unpinned];

  result.forEach(({n,tot})=>{
    const pin=PINS[n];
    const isPinned=!!pin;
    const isZero=tot<=0;
    const color=COLORS[n]||(pin&&pin.color?pin.color:null);
    const g=document.createElement('div');
    g.className='pg'+(isPinned?' pinned-card':'')+(isZero?' zero':'');
    g.dataset.prod=n;
    const pinnedCount=Object.keys(PINS).length;
    const mySlot=pin?pin.slot:null;
    var pinColor = color || '#f59e0b';
    // Neues Layout: Footer mit ◀ [📌 Farbe] ▶ — immer sichtbar
    g.innerHTML='<div class="pgh"><div class="pgn">'+n+'</div><div class="pgt">'+(isZero?'':Math.round(tot))+'</div></div>'
      +'<div class="pg-footer">'
        +(isPinned?'<button class="move-btn left" title="Nach links">◀</button>':'<div style="width:38px"></div>')
        +'<div class="pg-center">'
          +'<button class="pin-btn'+(isPinned?' pinned':'')+'">📌</button>'
          +'<button class="color-btn" title="Farbe wählen" style="background:'+pinColor+'"></button>'
          +'<input type="color" class="color-inp" value="'+pinColor+'">'
        +'</div>'
        +(isPinned?'<button class="move-btn right" title="Nach rechts">▶</button>':'<div style="width:38px"></div>')
      +'</div>';
    if (color) applyPinColor(g, color);
    g.querySelector('.pin-btn').addEventListener('click',e=>{e.stopPropagation();togglePin(n);});
    const ci=g.querySelector('.color-inp');
    const cb=g.querySelector('.color-btn');
    cb.addEventListener('click',e=>{e.stopPropagation();ci.click();});
    ci.addEventListener('input',e=>{e.stopPropagation();setPinColor(n,e.target.value);});
    if(isPinned){
      g.querySelector('.move-btn.left').addEventListener('click',e=>{e.stopPropagation();movePin(n,-1);});
      g.querySelector('.move-btn.right').addEventListener('click',e=>{e.stopPropagation();movePin(n,1);});
    }
    grid.appendChild(g);
  });
  wrap.appendChild(grid);
  ta.innerHTML='';ta.appendChild(wrap);
}

function renderTot(){
  const list=document.getElementById('totList');
  const prev=S.prev;const next={};
  S.totals.forEach(t=>next[t.product_name]=t.total);

  // Nach Pin-Slot sortieren, dann nach Menge
  const sorted=[...S.totals].sort((a,b)=>{
    const pa=PINS[a.product_name]?PINS[a.product_name].slot:9999;
    const pb=PINS[b.product_name]?PINS[b.product_name].slot:9999;
    if(pa!==pb) return pa-pb;
    return b.total-a.total;
  });

  list.innerHTML='';
  if(!sorted.length){
    list.innerHTML='<div style="padding:14px;color:var(--muted);font-size:15px">Keine offenen Bons</div>';
  } else {
    sorted.forEach(t=>{
      const pin=PINS[t.product_name];
      const col=COLORS[t.product_name]||(pin&&pin.color?pin.color:null);
      const row=document.createElement('div');
      row.className='tot-row';
      if(col) row.style.cssText='background:'+col+'33;border-left:3px solid '+col;
      const nm=document.createElement('span');nm.className='tot-name';nm.textContent=t.product_name;
      const nv=document.createElement('span');nv.className='tot-num'+(prev[t.product_name]!==t.total?' up':'');
      if(col) nv.style.color=col;
      nv.textContent=t.total;
      row.appendChild(nm);row.appendChild(nv);list.appendChild(row);
    });
  }
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

  // API im Hintergrund + direktes Reload nach 500ms (D1 committed dann)
  fetch('/api/tickets/'+tid+'/partial-print',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})})
    .then(()=>setTimeout(()=>Promise.all([loadT(),loadTot()]),10))
    .catch(()=>{if(bp){bp.disabled=false;bp.textContent='✂ Teildruck';}});
}

function rebuildTotals(){
  const map={};
  S.tickets.forEach(t=>t.items.forEach(i=>{
    if(i.quantity<=0) return;
    if(!map[i.product_name])map[i.product_name]=0;
    map[i.product_name]+=i.quantity;
  }));
  S.totals=Object.entries(map)
    .filter(([,total])=>total>0)
    .map(([product_name,total])=>({product_name,total}))
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
  // API + Reload nach 500ms
  fetch('/api/tickets/'+id+'/print',{method:'POST'})
    .then(()=>fetch('/api/tickets/'+id+'/done',{method:'POST'}))
    .then(()=>setTimeout(()=>Promise.all([loadT(),loadTot()]),10));
}

async function don(id){await fetch('/api/tickets/'+id+'/done',{method:'POST'});await Promise.all([loadT(),loadTot()]);}

init();

// ═══════════════════════════════════════════════════════
//  VIRTUELL TAB – Bon-Log
// ═══════════════════════════════════════════════════════
let vMode = 'incoming';
let vPaused = false;

async function vTogglePause() {
  vPaused = !vPaused;
  await fetch('/api/pause-state',{method:'POST',headers:{'Content-Type':'application/json','X-API-Key':API_KEY},body:JSON.stringify({paused:vPaused})}).catch(()=>{});
  vRenderPause();
}
function vRenderPause() {
  document.getElementById('vPpIcon').textContent = vPaused ? '⏸' : '▶';
  document.getElementById('vPpLabel').textContent = vPaused ? 'PAUSIERT' : 'LÄUFT';
  document.getElementById('vPpBtn').classList.toggle('paused', vPaused);
}
function vSetMode(m) {
  vMode = m;
  document.getElementById('vBtnIn').classList.toggle('active', m === 'incoming');
  document.getElementById('vBtnOut').classList.toggle('active', m === 'outgoing');
  vLoadBons();
}
async function vDeleteBon(id) {
  await fetch('/api/bon-log',{method:'DELETE',headers:{'Content-Type':'application/json','X-API-Key':API_KEY},body:JSON.stringify({id})}).catch(()=>{});
  vLoadBons();
}
async function vClearAll() {
  if(!confirm('Alle '+(vMode==='incoming'?'eingehenden':'ausgehenden')+' Bons löschen?')) return;
  await fetch('/api/bon-log',{method:'DELETE',headers:{'Content-Type':'application/json','X-API-Key':API_KEY},body:JSON.stringify({type:vMode})}).catch(()=>{});
  vLoadBons();
}
function vRenderPreview(preview) {
  if(!preview) return '<span class="bon-small">-</span>';
  var NL = String.fromCharCode(10);
  return preview.split(NL).filter(function(l){return l.trim();}).map(function(l){
    if(l.indexOf('## ') === 0) {
      var txt = l.slice(3).trim();
      var m = txt.match(/^(\d+)[x]?\s+(.+)$/) || txt.match(/^(\d+)\s+(.+)$/);
      if(m) return '<div class="bon-item">'+m[1]+'x '+m[2]+'</div>';
      return '<div class="bon-item">'+txt+'</div>';
    }
    return '<div class="bon-small">'+l+'</div>';
  }).join('');
}

// ═══════════════════════════════════════════════════════
//  BESTELLVERLAUF
// ═══════════════════════════════════════════════════════
var HIST = { kellner: null, tisch: null };

// Tisch-Input Event-Listener einmalig setzen
(function() {
  var ti = document.getElementById('histTischInp');
  if (!ti) return;
  var debTimer;
  ti.addEventListener('input', function() {
    HIST.tisch = ti.value.trim() || null;
    if (HIST.tisch) {
      HIST.kellner = null;
      // Kellner-Buttons deaktivieren
      document.querySelectorAll('.kl-btn').forEach(function(b) { b.classList.remove('active'); });
    }
    ti.classList.toggle('active', !!HIST.tisch);
    clearTimeout(debTimer);
    debTimer = setTimeout(histLoad, 400);
  });
})();

async function histLoad() {
  var list = document.getElementById('histList');
  if(!list) return;
  list.innerHTML = '<div class="hist-empty">Lade…</div>';
  try {
    var url = '/api/history?limit=100' + (HIST.tisch ? '&tisch=' + encodeURIComponent(HIST.tisch) : (HIST.kellner ? '&kellner=' + encodeURIComponent(HIST.kellner) : ''));
    var r = await fetch(url);
    var d = await r.json();
    // Kellner-Buttons rendern
    histRenderKellner(d.kellnerList || []);
    // Tickets rendern
    if(!d.tickets || !d.tickets.length) {
      list.innerHTML = '<div class="hist-empty">Keine Bestellungen</div>';
      return;
    }
    list.innerHTML = d.tickets.map(function(t) {
      var isSent = t.printed_at || t.status === 'done';
      var boniert = t.created_at ? new Date(t.created_at).toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '–';
      var datum = t.created_at ? new Date(t.created_at).toLocaleDateString('de-AT',{day:'2-digit',month:'2-digit'}) : '';
      var gedruckt = t.printed_at ? new Date(t.printed_at).toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : null;
      var badge = isSent
        ? '<span class="hr-badge sent">✓ ' + (gedruckt || 'gedruckt') + '</span>'
        : '<span class="hr-badge open">⏳ offen</span>';
      var dauer = isSent && t.wait_mins !== undefined
        ? '<span class="hr-dauer">'+t.wait_mins+' min</span>' : '';
      var tisch = t.table_number || t.ticket_number;
      var kel = t.kellner ? '<span class="hr-kel">'+t.kellner+'</span>' : '';
      var bon = '<span class="hr-bon">#'+t.ticket_number+'</span>';
      var items = (t.items||[]).map(function(i){
        return '<span class="hr-item">'+i.quantity+'× '+i.product_name+'</span>';
      }).join('');
      return '<div class="hr">'+
        '<div class="hr-head">'+
          '<span class="hr-tisch">'+tisch+'</span>'+
          kel+bon+
          '<span class="hr-time">'+datum+' '+boniert+'</span>'+
        '</div>'+
        '<div class="hr-head" style="margin-top:2px">'+
          badge+dauer+
        '</div>'+
        (items ? '<div class="hr-items">'+items+'</div>' : '')+
      '</div>';
    }).join('');
  } catch(e) {
    list.innerHTML = '<div class="hist-empty">Fehler beim Laden</div>';
  }
}

function histRenderKellner(list) {
  var tb = document.getElementById('histToolbar');
  if(!tb) return;
  tb.innerHTML = '<span class="hist-toolbar-title">Kellner:</span>';
  // "Alle" Button
  var allBtn = document.createElement('button');
  allBtn.className = 'kl-btn' + (HIST.kellner === null ? ' active' : '');
  allBtn.textContent = 'Alle';
  allBtn.onclick = function() { HIST.kellner = null; histLoad(); };
  tb.appendChild(allBtn);
  list.forEach(function(k) {
    var btn = document.createElement('button');
    btn.className = 'kl-btn' + (!HIST.tisch && HIST.kellner === k ? ' active' : '');
    btn.textContent = k;
    btn.onclick = function() { HIST.kellner = k; HIST.tisch = null; histLoad(); };
    tb.appendChild(btn);
  });
}

async function vInit() {
  try{var r=await fetch('/api/pause-state');var d=await r.json();vPaused=d.paused||false;vRenderPause();}catch(e){}
}
vInit();
setInterval(function(){ if(S.view==='virtual') vLoadBons(); },5000);

