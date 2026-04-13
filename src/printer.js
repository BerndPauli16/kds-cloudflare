export function getPrinterHTML() {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Virtueller Drucker – KDS</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:sans-serif;background:#1a1a1a;color:#ccc;min-height:100vh;padding:20px}
  h1{font-size:16px;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:16px;display:flex;align-items:center;gap:10px}
  .dot{width:10px;height:10px;border-radius:50%;background:#444;transition:background .3s,box-shadow .3s;flex-shrink:0}
  .dot.ok{background:#22c55e;box-shadow:0 0 8px #22c55e}
  .dot.err{background:#ef4444}
  .dot.blink{background:#f59e0b;box-shadow:0 0 10px #f59e0b}
  #statusText{font-size:12px;color:#666}
  .toolbar{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;align-items:center}
  button{background:#2a2a2a;border:1px solid #444;border-radius:6px;color:#aaa;font-size:12px;padding:7px 16px;cursor:pointer;letter-spacing:.5px;transition:all .15s}
  button:hover{background:#333;color:#fff}
  button.danger{border-color:#ef4444;color:#ef4444}
  button.danger:hover{background:#ef444422}
  #feed{display:flex;flex-direction:column;gap:16px;max-width:380px}
  .receipt{background:#f9f8f4;border-radius:6px 6px 0 0;overflow:hidden;animation:pop .3s ease}
  @keyframes pop{from{opacity:0;transform:translateY(-10px) scaleY(.95)}to{opacity:1;transform:none}}
  .r-tape{background:#e8e6e0;padding:6px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed #ccc}
  .r-id{font-family:monospace;font-size:10px;color:#888}
  .r-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px}
  .r-badge.full{background:#dcfce7;color:#166534}
  .r-badge.part{background:#fef3c7;color:#92400e}
  .r-body{padding:14px 16px;font-family:'Courier New',Courier,monospace;font-size:13px;color:#111;line-height:1.6;background:#f9f8f4}
  .r-sep{border:none;border-top:1px dashed #aaa;margin:5px 0}
  .r-center{text-align:center;display:block}
  .r-bold{font-weight:700}
  .r-big{font-size:16px;font-weight:700}
  .r-von{text-align:center;font-weight:700;font-size:15px;letter-spacing:3px;padding:3px 0;display:block}
  .r-muted{color:#888;font-size:11px}
  .r-cut{height:8px;background:repeating-linear-gradient(90deg,#e0ddd5 0 6px,transparent 6px 12px);margin-top:0}
  .empty{color:#555;font-size:13px;padding:30px;text-align:center;border:1px dashed #333;border-radius:8px;max-width:380px}
</style>
</head>
<body>
<h1><span class="dot" id="dot"></span>Virtueller Drucker<span id="statusText" style="font-size:11px;color:#555;font-weight:400;letter-spacing:0;text-transform:none">– verbinde…</span></h1>

<div class="toolbar">
  <button onclick="poll()">↺ Jetzt holen</button>
  <button onclick="togglePause()" id="pauseBtn">⏸ Pause</button>
  <button class="danger" onclick="clearAll()">✕ Alle löschen</button>
</div>

<div id="feed"><div class="empty">Warte auf Druckjobs…</div></div>

<script>
const W='https://kds-cloudflare.b-mayr.workers.dev';
const K='kds-smarte-events-2026';
const seen=[];
let paused=false;
let timer=null;

function setStatus(ok,msg){
  document.getElementById('dot').className='dot '+(ok?'ok':'err');
  document.getElementById('statusText').textContent=msg;
}

function togglePause(){
  paused=!paused;
  document.getElementById('pauseBtn').textContent=paused?'▶ Weiter':'⏸ Pause';
  if(!paused) poll();
}

function clearAll(){
  seen.length=0;
  document.getElementById('feed').innerHTML='<div class="empty">Warte auf Druckjobs…</div>';
}

function renderJob(job){
  const p=job.payload;
  const isP=!!p.partial;
  const t=new Date(p.printed_at||Date.now());
  const ts=t.toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit',second:'2-digit'});

  let rows='';
  const sep=()=>'<hr class="r-sep">';
  const center=s=>'<span class="r-center">'+s+'</span>';
  const bold=s=>'<span class="r-bold">'+s+'</span>';
  const big=s=>'<span class="r-big">'+s+'</span>';
  const von=s=>'<span class="r-von">'+s+'</span>';
  const muted=s=>'<span class="r-muted">'+s+'</span>';
  const line=s=>'<span>'+s+'</span>';

  rows+=center(p.station_name||'BESTELLUNG');
  rows+=sep();
  rows+=bold('Tisch: '+(p.table_number||'–'));
  rows+=line('Bon:   #'+p.ticket_number);
  rows+=line('Zeit:  '+ts);
  rows+=sep();

  for(const i of(p.items||[])){
    rows+=big(String(i.quantity).padStart(2)+'x  '+i.product_name);
    if(i.extras&&i.extras.length) for(const e of i.extras) rows+=muted('      → '+e);
  }

  if(isP&&p.all_items&&p.all_items.length){
    rows+=sep();
    rows+=von('EIN TEIL VON');
    rows+=sep();
    for(const i of p.all_items){
      rows+=line(String(i.quantity).padStart(2)+'x  '+i.product_name);
      if(i.extras&&i.extras.length) for(const e of i.extras) rows+=muted('      → '+e);
    }
  }

  rows+=sep();
  rows+=center('Gedruckt: '+ts);

  const div=document.createElement('div');
  div.innerHTML='<div class="receipt"><div class="r-tape"><span class="r-id">Job #'+job.id+' · '+ts+'</span><span class="r-badge '+(isP?'part':'full')+'">'+(isP?'TEILDRUCK':'VOLLSTÄNDIG')+'</span></div><div class="r-body">'+rows+'</div></div><div class="r-cut"></div>';

  const feed=document.getElementById('feed');
  if(feed.querySelector('.empty')) feed.innerHTML='';
  feed.insertBefore(div,feed.firstChild);
}

async function poll(){
  if(paused) return;
  const dot=document.getElementById('dot');
  try{
    const res=await fetch(W+'/api/print-jobs/pending',{headers:{'X-API-Key':K}});
    if(!res.ok){setStatus(false,'Worker Fehler '+res.status);return;}
    setStatus(true,'Verbunden · pollt alle 3s');
    const jobs=await res.json();
    for(const job of jobs){
      if(seen.includes(job.id)) continue;
      seen.push(job.id);
      dot.className='dot blink';
      setTimeout(()=>dot.className='dot ok',1000);
      renderJob(job);
      await fetch(W+'/api/print-jobs/'+job.id+'/complete',{method:'POST',headers:{'X-API-Key':K}});
    }
  }catch(e){setStatus(false,'Fehler: '+e.message);}
}

poll();
setInterval(poll,3000);
</script>
</body>
</html>`;
}
