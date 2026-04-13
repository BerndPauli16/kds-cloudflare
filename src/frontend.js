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
    --muted: #d0d0d8; --amber:#f59e0b; --adim:  #7a4f05;
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
  .logo-img{height:34px;width:auto;o