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
  #tickets{overflow-y:auto;height:100%}

  @keyframes sIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .og{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;align-content:start}

  .tc{background:var(--sur);border:1px solid var(--brd);border-radius:10px;overflow:hidden;display:flex;flex-direction:column;transition:border-color .2s;animation:sIn .25s ease}
  .tc:hover{border-color:var(--brd2)} .tc.printing{border-color:var(--blue)}

  .tc-head{padding:10px 14px;background:var(--sur2);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--brd)}
  .tc-num{font-family:var(--mono);font-size:13px;font-weight:700;color:var(--amber)}
  .tc-tbl{font-size:34px;font-weight:700;color:var(--txt)}
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
  .pv{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;padding:16px;align-content:start;overflow-y:auto;flex:1}
  .pg{background:var(--sur);border:1px solid var(--brd);border-radius:10px;overflow:hidden;animation:sIn .25s ease;display:flex;flex-direction:column}
  .pgh{padding:10px 12px 10px 12px;background:var(--sur2);display:flex;justify-content:space-between;align-items:flex-start;gap:8px;border-radius:10px;position:relative;min-height:64px}
  .pgn{font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--txt);flex:1;line-height:1.35;word-break:break-word;padding-right:52px;padding-top:4px}
  .pgt{font-family:var(--mono);font-size:48px;font-weight:700;color:var(--amber);line-height:1;position:absolute;top:8px;right:10px}
  [data-theme=light] .pgt{color:#111}
  [data-theme=light] .pgn{color:#111}
  .prs{padding:4px 0;flex:1}
  .pg-footer{display:flex;align-items:center;justify-content:space-between;padding:4px 6px;background:rgba(0,0,0,.15);border-top:1px solid rgba(255,255,255,.08);min-height:30px}
  .pg-footer-center{display:flex;align-items:center;gap:6px}
  .pr{display:grid;grid-template-columns:1fr 50px;align-items:center;padding:7px 16px;border-bottom:1px solid var(--brd)}
  .pr:last-child{border-bottom:none}
  .pr-tbl{font-size:15px;font-weight:500;color:var(--txt)}
  .pr-qty{font-family:var(--mono);font-size:18px;font-weight:700;color:var(--amber);text-align:right}
  .s-badge{font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:.8px}

  .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:14px;color:var(--muted)}
  #main.products-view{grid-template-columns:1fr}
  #main.products-view aside{display:none}
  .empty-i{font-size:52px} .empty-t{font-size:19px;font-weight:600;letter-spacing:.8px}

  .pin-btn{background:transparent;border:none;cursor:pointer;opacity:.35;font-size:15px;transition:all .2s;padding:2px 5px;line-height:1}
  .pin-btn:hover{opacity:1;transform:scale(1.2)}
  .pin-btn.pinned{opacity:1;filter:drop-shadow(0 0 3px var(--amber))}
  .color-btn{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.4);cursor:pointer;flex-shrink:0;transition:transform .15s}
  .color-btn:hover{transform:scale(1.2)}
  .color-inp{position:absolute;opacity:0;width:0;height:0}
  .pg{position:relative;display:flex;flex-direction:column}
  .pg-footer{display:flex;align-items:center;justify-content:space-between;padding:3px 5px;background:rgba(0,0,0,.15);border-top:1px solid rgba(255,255,255,.07)}
  .pg-center{display:flex;align-items:center;gap:5px}
  .pg.pinned-card{border-width:2px!important}
  .pg.zero{opacity:.45}
  .move-btn{background:rgba(0,0,0,.2);border:none;color:rgba(255,255,255,.6);font-size:11px;cursor:pointer;padding:4px 10px;border-radius:4px;transition:all .15s}
  .move-btn:hover{background:rgba(0,0,0,.5);color:#fff}
  .move-btn.left{}
  .move-btn.right{}
  /* ── Konfig-Button ── */
  .cfg-btn{background:none;border:none;cursor:pointer;color:var(--muted);padding:6px;border-radius:6px;transition:all .2s;display:flex;align-items:center}
  .cfg-btn:hover{background:var(--sur2);color:var(--txt)}
  /* ── Modal ── */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1000;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .25s}
  .modal-overlay.open{opacity:1;pointer-events:all}
  .modal{background:var(--sur);border:1px solid var(--brd);border-radius:12px;width:520px;max-width:95vw;max-height:90vh;overflow-y:auto;transform:translateY(12px);transition:transform .25s;box-shadow:0 24px 60px rgba(0,0,0,.5)}
  .modal-overlay.open .modal{transform:translateY(0)}
  .modal-hdr{display:flex;align-items:center;justify-content:space-between;padding:18px 22px 14px;border-bottom:1px solid var(--brd);position:sticky;top:0;background:var(--sur);z-index:1}
  .modal-title{font-size:14px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
  .modal-close{background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:4px 8px;border-radius:4px;transition:color .15s}
  .modal-close:hover{color:var(--txt)}
  .modal-body{padding:20px 22px}
  .cfg-section{margin-bottom:22px}
  .cfg-sec-title{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;gap:8px}
  .cfg-sec-title::after{content:'';flex:1;height:1px;background:var(--brd)}
  .cfg-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
  .cfg-field{display:flex;flex-direction:column;gap:5px}
  .cfg-lbl{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
  .cfg-inp{background:var(--sur2);border:1px solid var(--brd);border-radius:6px;padding:8px 10px;color:var(--txt);font-family:var(--mono);font-size:13px;outline:none;transition:border-color .15s;width:100%}
  .cfg-inp:focus{border-color:var(--blue)}
  .cfg-preview{background:var(--sur2);border:1px solid var(--brd);border-radius:6px;padding:8px 10px;font-family:var(--mono);font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:6px}
  .cfg-footer{display:flex;gap:10px;padding-top:4px}
  .btn-save{background:var(--blue);color:#fff;border:none;border-radius:6px;padding:9px 20px;font-family:var(--font);font-weight:700;font-size:12px;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;transition:opacity .15s;display:flex;align-items:center;gap:6px}
  .btn-save:hover{opacity:.85}
  .btn-cancel{background:var(--sur2);color:var(--txt);border:1px solid var(--brd);border-radius:6px;padding:9px 16px;font-family:var(--font);font-weight:600;font-size:12px;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;transition:all .15s}
  .btn-cancel:hover{border-color:var(--brd2)}
  .btn-test{background:var(--sur2);color:var(--txt);border:1px solid var(--brd);border-radius:6px;padding:7px 12px;font-family:var(--font);font-weight:600;font-size:11px;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;transition:all .15s;white-space:nowrap}
  .btn-test:hover{border-color:var(--amber);color:var(--amber)}
  .cfg-msg{font-size:11px;padding:7px 10px;border-radius:5px;margin-top:10px;display:none}
  .cfg-msg.ok{display:block;background:rgba(16,185,129,.12);color:#10b981;border:1px solid rgba(16,185,129,.25)}
  .cfg-msg.err{display:block;background:rgba(239,68,68,.12);color:#ef4444;border:1px solid rgba(239,68,68,.25)}
  .cfg-msg.info{display:block;background:rgba(59,130,246,.12);color:#93c5fd;border:1px solid rgba(59,130,246,.25)}
  /* ── Virtuell Tab ── */
  #virtView{height:100%;overflow-y:auto;padding:20px;display:none}
  #virtView.active{display:block}
  .virt-toolbar{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap}
  .v-toggle{display:flex;background:var(--sur2);border:1px solid var(--brd);border-radius:8px;overflow:hidden}
  .v-tog-btn{background:none;border:none;cursor:pointer;font-family:var(--font);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:8px 18px;transition:all .15s}
  .v-tog-btn.active{background:var(--amber);color:#000}
  .v-pp-btn{background:var(--sur2);border:1px solid var(--brd);border-radius:8px;cursor:pointer;font-family:var(--font);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--txt);padding:8px 16px;display:flex;align-items:center;gap:6px;transition:all .15s}
  .v-pp-btn.paused{border-color:var(--amber);color:var(--amber)}
  .v-clr-btn{margin-left:auto;background:none;border:1px solid var(--brd);border-radius:8px;cursor:pointer;font-family:var(--font);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:8px 14px;transition:all .15s}
  .v-clr-btn:hover{border-color:var(--red);color:var(--red)}
  .bon-list{display:flex;flex-direction:column;gap:14px;max-width:440px}
  .bon-card{background:#f5f4ef;border-radius:8px 8px 2px 2px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.4);animation:bonPop .3s ease}
  @keyframes bonPop{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
  .bon-head{background:#e8e5dd;padding:8px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px dashed #ccc}
  .bon-meta{display:flex;flex-direction:column;gap:2px}
  .bon-badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;letter-spacing:.04em;align-self:flex-start}
  .bon-badge.in{background:#dcfce7;color:#166534}
  .bon-badge.out{background:#dbeafe;color:#1e40af}
  .bon-time{font-family:var(--mono);font-size:10px;color:#888}
  .bon-del{background:none;border:none;cursor:pointer;color:#bbb;font-size:16px;line-height:1;padding:0 4px;transition:color .15s}
  .bon-del:hover{color:#ef4444}
  .bon-body{padding:12px 16px;font-family:'Courier New',monospace;font-size:12px;color:#333;line-height:1.7;background:#f9f8f4}
  .bon-item{font-size:15px;font-weight:700;color:#111;padding:1px 0}
  .bon-small{color:#888;font-size:11px}
  .bon-cut{height:6px;background:repeating-linear-gradient(90deg,#ddd 0 5px,transparent 5px 10px)}
  .bon-card{background:#f9f8f4;border-radius:6px 6px 0 0;overflow:hidden;animation:bonPop .3s ease;box-shadow:0 2px 12px rgba(0,0,0,.35)}
  @keyframes bonPop{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
  .bon-tape{background:#e8e6e0;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed #ccc}
  .bon-id{font-family:monospace;font-size:10px;color:#777}
  .bon-ts{font-family:monospace;font-size:10px;color:#999}
  .bon-badge2{font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;letter-spacing:.04em}
  .bon-badge2.in{background:#dcfce7;color:#166534}
  .bon-badge2.out{background:#dbeafe;color:#1e40af}
  .bon-body2{padding:12px 16px;font-family:'Courier New',Courier,monospace;font-size:13px;color:#111;line-height:1.7;background:#f9f8f4}
  .bon-item2{font-weight:700;font-size:14px;color:#111}
  .bon-small2{color:#888;font-size:11px}
  .bon-del2{background:none;border:none;cursor:pointer;color:#bbb;font-size:16px;line-height:1;padding:0 4px;transition:color .15s}
  .bon-zeit{font-family:monospace;font-size:11px;padding:2px 0}
  .in-zeit{color:#166534;font-weight:700}
  .dauer-zeit{color:#92400e;font-weight:700;font-size:13px}
  .out-zeit{color:#1e40af;font-weight:700}
  .bon-tisch{font-family:monospace;font-size:15px;font-weight:700;color:#111;padding:2px 0;border-bottom:1px solid #ddd;margin-bottom:4px}
  .bon-raw-line{font-family:'Courier New',Courier,monospace;font-size:12px;color:#111;white-space:pre-wrap;word-break:break-all;line-height:1.5}
  .bon-del2:hover{color:#ef4444}
  .bon-list2{display:flex;flex-direction:column;gap:14px;padding:16px;max-width:500px}
  /* ── Bestellverlauf ── */
  #histView{display:none;overflow-y:auto;height:calc(100vh - var(--hh));padding:0}
  #histView.active{display:flex;flex-direction:column}
  .hist-toolbar{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--brd);flex-shrink:0;flex-wrap:wrap}
  .hist-toolbar-title{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
  .kl-btn{background:var(--sur2);border:1px solid var(--brd);border-radius:20px;cursor:pointer;font-family:var(--font);font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);padding:4px 12px;transition:all .15s;white-space:nowrap}
  .kl-btn.active{background:var(--amber);color:#000;border-color:var(--amber)}
  .kl-btn:hover{border-color:var(--amber);color:var(--amber)}
  .hist-list{flex:1;overflow-y:auto;padding:8px 12px;display:flex;flex-direction:column;gap:4px}
  .hr{background:var(--sur);border:1px solid var(--brd);border-radius:6px;padding:7px 10px;font-size:11px;line-height:1.5}
  .hr-head{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .hr-tisch{font-size:13px;font-weight:700;color:var(--txt);min-width:70px}
  .hr-kel{font-size:10px;color:var(--muted);font-weight:600;letter-spacing:.04em}
  .hr-bon{font-size:10px;color:var(--muted);font-family:var(--mono)}
  .hr-time{font-size:10px;font-family:var(--mono);color:var(--muted);margin-left:auto}
  .hr-badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;letter-spacing:.04em}
  .hr-badge.sent{background:rgba(34,197,94,.15);color:#16a34a}
  .hr-badge.open{background:rgba(251,191,36,.15);color:#d97706}
  .hr-dauer{font-size:10px;color:var(--muted);font-family:var(--mono)}
  .hr-items{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
  .hr-item{font-size:10px;background:var(--sur2);border-radius:4px;padding:2px 7px;color:var(--txt);font-weight:600}
  .hist-empty{padding:40px;text-align:center;color:var(--muted);font-size:13px}
  .v-empty{color:var(--muted);font-size:14px;padding:40px;text-align:center;border:1px dashed var(--brd);border-radius:8px;max-width:440px}
  /* ── Virtual Printer ── */
  #vp-view{display:none;flex-direction:column;overflow-y:auto;height:calc(100vh - var(--hh));padding:20px;width:100%}
  #vp-view.active{display:flex;flex-direction:column}
  .vp-toolbar{display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--sur);border-bottom:1px solid var(--brd);flex-shrink:0}
  .vp-title{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
  .vp-seg{display:flex;background:var(--sur2);border-radius:6px;padding:2px;gap:2px}
  .vp-seg-btn{background:none;border:none;color:var(--muted);font-family:var(--font);font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 12px;border-radius:4px;cursor:pointer;transition:all .15s}
  .vp-seg-btn.active{background:var(--blue);color:#fff}
  .vp-play{background:none;border:1px solid var(--brd);border-radius:6px;padding:5px 12px;color:var(--txt);font-family:var(--font);font-size:11px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px;margin-left:auto}
  .vp-play.playing{border-color:var(--green);color:var(--green)}
  .vp-play.paused{border-color:var(--amber);color:var(--amber)}
  .vp-bons{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px}
  .vp-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--muted);gap:8px;font-size:13px}
  .bon-card{background:var(--sur);border:1px solid var(--brd);border-radius:8px;padding:12px 14px;display:flex;align-items:flex-start;gap:12px;transition:border-color .15s}
  .bon-card:hover{border-color:var(--brd2)}
  .bon-card-body{flex:1;min-width:0}
  .bon-card-hdr{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .bon-num{font-size:11px;font-weight:700;color:var(--muted);font-family:var(--mono)}
  .bon-time{font-size:10px;color:var(--muted);margin-left:auto}
  .bon-items{font-size:13px;font-weight:600;color:var(--txt);line-height:1.5}
  .bon-table{font-size:10px;color:var(--muted);margin-top:3px}
  .bon-del{background:none;border:none;color:var(--muted);cursor:pointer;padding:4px 8px;border-radius:4px;font-size:14px;transition:color .15s;flex-shrink:0}
  .bon-del:hover{color:var(--red)}
  .pi-ip-display{user-select:none;-webkit-user-select:none;pointer-events:none;opacity:.85}
  .accordion-btn{width:100%;background:var(--sur2);border:1px solid var(--brd);border-radius:6px;padding:9px 12px;color:var(--txt);font-family:var(--font);font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all .15s;margin-bottom:0}
  .accordion-btn:hover{border-color:var(--brd2)}
  .accordion-btn .arr{transition:transform .2s;font-size:10px}
  .accordion-btn.open .arr{transform:rotate(180deg)}
  .accordion-body{overflow:hidden;max-height:0;transition:max-height .3s ease}
  .accordion-body.open{max-height:400px}
  .asello-table{width:100%;border-collapse:collapse;margin-top:8px;font-size:11px}
  .asello-table tr{border-bottom:1px solid var(--brd)}
  .asello-table tr:last-child{border-bottom:none}
  .asello-table td{padding:6px 8px}
  .asello-table td:first-child{color:var(--muted);width:55%;font-weight:600}
  .asello-table td:last-child{font-family:var(--mono);color:var(--txt)}
  .asello-table .tag-on{background:rgba(16,185,129,.15);color:#10b981;border:1px solid rgba(16,185,129,.3);border-radius:3px;padding:1px 6px;font-family:var(--font);font-size:10px;font-weight:700}
  .asello-table .tag-off{background:var(--sur2);color:var(--muted);border:1px solid var(--brd);border-radius:3px;padding:1px 6px;font-family:var(--font);font-size:10px}
  .pip-lbl{font-size:16px;line-height:1}
  .pip-inp{background:var(--bg);border:1px solid var(--brd);color:var(--txt);font-family:var(--mono);font-size:12px;padding:4px 7px;border-radius:5px;width:140px;outline:none}
  .pip-inp:focus{border-color:var(--amber)}
  .pip-btn{background:transparent;border:1px solid var(--brd);color:var(--muted);padding:4px 7px;border-radius:5px;cursor:pointer;font-size:13px;transition:all .15s}
  .pip-btn:hover{border-color:var(--green);color:var(--green)}
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
        <button class="cfg-btn" onclick="openCfg()" title="Drucker-Konfiguration">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
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
      <button class="tab"        id="tV" onclick="sv('virtual')">Virtuell</button>
      <button class="tab"        id="tH" onclick="sv('history')">Verlauf</button>
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
<div id="vp-view">
  <div class="vp-toolbar">
    <span class="vp-title">🖨 Virtueller Drucker</span>
    <div class="vp-seg">
      <button class="vp-seg-btn active" id="vpIn" onclick="vpType('in')">📥 Einkommend</button>
      <button class="vp-seg-btn" id="vpOut" onclick="vpType('out')">📤 Ausgehend</button>
    </div>
    <button class="vp-play playing" id="vpPlay" onclick="vpTogglePlay()">
      <span id="vpPlayIcon">▶</span><span id="vpPlayLabel">AKTIV</span>
    </button>
  </div>
  <div class="vp-bons" id="vpBons">
    <div class="vp-empty">⏳ Lade Bons…</div>
  </div>
</div>
</div>

<div id="histView">
  <div class="hist-toolbar" id="histToolbar">
    <span class="hist-toolbar-title">Kellner</span>
  </div>
  <div class="hist-list" id="histList"><div class="hist-empty">Lade Verlauf…</div></div>
</div>

<!-- Drucker-Konfigurations-Modal -->
<div class="modal-overlay" id="cfgModal" onclick="if(event.target===this)closeCfg()">
  <div class="modal">
    <div class="modal-hdr">
      <span class="modal-title">⚙ Drucker-Konfiguration</span>
      <button class="modal-close" onclick="closeCfg()">✕</button>
    </div>
    <div class="modal-body">
      <div class="cfg-section">
        <div class="cfg-sec-title">🏷 Anzeigename</div>
        <div class="cfg-field">
          <label class="cfg-lbl">Name im Header</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="text" id="cfgDisplayName" class="cfg-input" style="flex:1"
              placeholder="z.B. küchenmonitor" maxlength="30">
            <button class="btn-save" onclick="saveDisplayName()" style="padding:6px 14px;font-size:12px">💾 Speichern</button>
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">Wird im Header statt des Domain-Namens angezeigt</div>
        </div>
      </div>
      <div class="cfg-section">
        <div class="cfg-sec-title">📥 Eingehender Drucker (Raspberry Pi)</div>
        <div class="cfg-field" style="margin-bottom:10px">
          <label class="cfg-lbl">Pi IP-Adresse <span style="color:var(--amber);font-size:9px;letter-spacing:.04em">(fix im Router vergeben)</span></label>
          <div class="cfg-preview pi-ip-display" id="piIpDisplay" style="cursor:default;font-size:13px;color:var(--txt)">wird geladen…</div>
        </div>
        <div class="cfg-field">
          <label class="cfg-lbl">asello Drucker-Einstellung</label>
          <div class="cfg-preview" id="proxyPreview" style="color:var(--muted)">—</div>
        </div>
        <div style="margin-top:10px">
          <button class="accordion-btn" id="aselloAccBtn" onclick="toggleAsello()">
            <span>📋 asello Drucker-Einstellungen anzeigen</span>
            <span class="arr">▼</span>
          </button>
          <div class="accordion-body" id="aselloAccBody">
            <table class="asello-table">
              <tr><td>Typ</td><td>Epson TM-T88V/TM-T70II Ethernet</td></tr>
              <tr><td>IP-Adresse</td><td id="aselloIp"><b style="color:var(--amber)">print.team24.training</b></td></tr>
              <tr><td>Port</td><td>80</td></tr>
              <tr><td style="color:var(--amber)">⚡ IMMER GÜLTIG</td><td style="font-size:10px;color:var(--muted)">Tunnel – funktioniert in jedem Netzwerk</td></tr>
              <tr><td>HTTPS verwenden</td><td><span class="tag-off">AUS</span></td></tr>
              <tr><td>Ohne Warten fortfahren</td><td><span class="tag-on">AN</span></td></tr>
              <tr><td>E-POS Device verwenden</td><td><span class="tag-off">AUS</span></td></tr>
              <tr><td>Netzwerk Timeout</td><td>20 Sek.</td></tr>
              <tr><td>Wartezeit nach Druck</td><td>7,5 Sek.</td></tr>
            </table>
          </div>
        </div>
        <input type="hidden" id="cfgProxyIp" value="192.168.192.70">
        <input type="hidden" id="cfgProxyPort" value="8009">
      </div>

      <div class="cfg-section">
        <div class="cfg-sec-title">📤 Ausgehender Drucker (Physisch)</div>
        <div class="cfg-grid">
          <div class="cfg-field">
            <label class="cfg-lbl">Drucker IP-Adresse <span style="font-size:10px;color:var(--muted)">(auto-erkannt bei Netzwechsel)</span></label>
            <div style="display:flex;gap:6px">
              <input class="cfg-inp" id="cfgPrinterIp" placeholder="192.168.192.202" style="flex:1">
              <button class="btn-test" id="scanBtn" onclick="doScanPrinter()" style="padding:6px 10px;font-size:11px">🔍</button>
            </div>
          </div>
          <div class="cfg-field">
            <label class="cfg-lbl">Drucker Port</label>
            <input class="cfg-inp" id="cfgPrinterPort" placeholder="9100" type="number">
          </div>
        </div>
        <div class="cfg-grid" style="margin-top:10px">
          <div class="cfg-field">
            <label class="cfg-lbl">Zeichen pro Zeile</label>
            <input class="cfg-inp" id="cfgChars" placeholder="42" type="number" min="20" max="80" oninput="updateCplPreview()">
          </div>
          <div class="cfg-field">
            <label class="cfg-lbl">&nbsp;</label>
            <button class="btn-test" id="testBtn" onclick="doTestPrint()">🖨 Testdruck</button>
          </div>
        </div>
        <div class="cfg-lbl" style="margin-top:8px;margin-bottom:4px">Vorschau Zeilenbreite</div>
        <div class="cfg-preview" id="cplPreview" style="font-size:10px">1234567890</div>
      </div>

      <div class="cfg-footer">
        <button class="btn-save" onclick="saveCfg()">✓ Speichern</button>
        <button class="btn-cancel" onclick="closeCfg()">Abbrechen</button>
      </div>
      <div style="border-top:1px solid var(--brd);margin-top:16px;padding-top:14px">
        <div class="cfg-sec-title">🗑 Alte Tickets</div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
          <span style="font-size:12px;color:var(--muted)">Tickets älter als</span>
          <input class="cfg-inp" id="clearMinutes" value="60" type="number" min="5" style="width:70px">
          <span style="font-size:12px;color:var(--muted)">Minuten löschen</span>
          <button class="btn-cancel" onclick="clearOldTickets()" style="margin-left:auto;color:var(--red);border-color:var(--red)">Löschen</button>
        </div>
      </div>
      <div class="cfg-msg" id="cfgMsg"></div>
    </div>
  </div>
</div>

<script src="/app.js" defer></script>
</body>
</html>`;
}
