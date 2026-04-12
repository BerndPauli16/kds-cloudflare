// ════════════════════════════════════════════════
//  KDSRoom – Durable Object für WebSocket Echtzeit
//  Jede Station hat einen eigenen Room via idFromName(stationId)
// ════════════════════════════════════════════════

export class KDSRoom {
  constructor(state, env) {
    this.state = state;
    this.env   = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    // ── WebSocket-Verbindung vom Browser ──────────
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.state.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    // ── Broadcast-Endpunkt (intern von API gerufen) ─
    if (request.method === 'POST' && url.pathname.endsWith('/broadcast')) {
      const data = await request.json();
      this.#broadcast(data);
      return new Response('ok', { status: 200 });
    }

    return new Response('Not found', { status: 404 });
  }

  webSocketMessage(ws, message) {
    // Ping/Pong für Keep-Alive
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
    } catch {}
  }

  webSocketClose(ws, code, reason) {
    ws.close(code, reason);
  }

  webSocketError(ws, error) {
    console.error('WebSocket error:', error);
    ws.close(1011, 'Internal error');
  }

  #broadcast(data) {
    const msg = JSON.stringify(data);
    for (const ws of this.state.getWebSockets()) {
      try { ws.send(msg); } catch (_) {}
    }
  }
}
