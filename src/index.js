// ════════════════════════════════════════════════
//  KDS Worker – Haupt-Entry-Point
// ════════════════════════════════════════════════
import { KDSRoom }    from './kds-room.js';
import { getHTML }    from './frontend.js';
import { getPrinterHTML } from './printer.js';

export { KDSRoom };

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

export default {
  async fetch(request, env, ctx) {
    const url    = new URL(request.url);
    const method = request.method;

    // Preflight
    if (method === 'OPTIONS') return new Response(null, { headers: CORS });

    // ── WebSocket → Durable Object ─────────────────
    if (url.pathname.startsWith('/ws')) {
      const stationId = url.searchParams.get('station') || 'all';
      const id   = env.KDS_ROOM.idFromName(stationId);
      const room = env.KDS_ROOM.get(id);
      return room.fetch(request);
    }

    // ── API ────────────────────────────────────────
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env, url, method);
    }

    // ── Frontend ───────────────────────────────────
    return new Response(getHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};

// ════════════════════════════════════════════════
//  API Router
// ════════════════════════════════════════════════
async function handleAPI(request, env, url, method) {
  const path = url.pathname.replace('/api', '');
  try {
    // ── Teildruck ────────────────────────────────────────────
    const partialMatch = path.match(/^\/tickets\/(\d+)\/partial-print$/);
    if (partialMatch && method === 'POST') {
      const id     = parseInt(partialMatch[1]);
      const body   = await request.json();
      const result = await partialPrintTicket(env, id, body.items || []);
      await broadcastUpdate(env, result.station_id, { type: 'ticket_partial_printed', ticketId: id });
      return jsonResponse(result);
    }

    const doneMatch = path.match(/^\/tickets\/(\d+)\/done$/);
    if (doneMatch && method === 'POST') {
      const id     = parseInt(doneMatch[1]);
      const result = await markDone(env, id);
      await broadcastUpdate(env, result.station_id, { type: 'ticket_done', ticketId: id });
      return jsonResponse(result);
    }

    // ── Druck-Jobs (für Print-Agent) ─────────────
    if (path === '/print-jobs/pending' && method === 'GET') {
      requireApiKey(request, env);
      return jsonResponse(await getPendingJobs(env));
    }

    // Virtueller Drucker: letzte Jobs anzeigen ohne sie zu konsumieren
    if (path === '/print-jobs/recent' && method === 'GET') {
      requireApiKey(request, env);
      return jsonResponse(await getRecentJobs(env));
    }

    if (path.match(/^\/print-jobs\/\d+\/complete$/) && method === 'POST') {
      requireApiKey(request, env);
      const jobId = parseInt(path.split('/')[2]);
      return jsonResponse(await completeJob(env, jobId));
    }

    // ── Client-IP (für Monitor-Anzeige) ─────────
    // ── Drucker-Discovery ─────────────────────────────────
    // Einmaliger DB-Setup
    if (path === '/setup-db' && method === 'GET') {
      await env.DB.prepare('CREATE TABLE IF NOT EXISTS printers (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT NOT NULL UNIQUE, name TEXT DEFAULT 'Drucker', port INTEGER DEFAULT 9100, active INTEGER DEFAULT 0, last_seen DATETIME DEFAULT CURRENT_TIMESTAMP, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)').run();
      return jsonResponse({ ok: true, msg: 'printers table created' });
    }

    if (path === '/printers' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM printers ORDER BY active DESC, last_seen DESC').all();
      return jsonResponse(results);
    }

    if (path === '/printers' && method === 'POST') {
      requireApiKey(request, env);
      const { ip, port, name } = await request.json();
      await env.DB.prepare(
        'INSERT INTO printers (ip, port, name, last_seen) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(ip) DO UPDATE SET last_seen=CURRENT_TIMESTAMP, port=excluded.port, name=excluded.name'
      ).bind(ip, port || 9100, name || 'Drucker').run();
      return jsonResponse({ ok: true });
    }

    if (path === '/printers/select' && method === 'POST') {
      const { ip } = await request.json();
      await env.DB.prepare('UPDATE printers SET active=0').run();
      await env.DB.prepare('UPDATE printers SET active=1 WHERE ip=?').bind(ip).run();
      return jsonResponse({ ok: true });
    }

    if (path === '/printers/active' && method === 'GET') {
      requireApiKey(request, env);
      const printer = await env.DB.prepare('SELECT * FROM printers WHERE active=1 LIMIT 1').first();
      return jsonResponse(printer || null);
    }

    if (path.match(/^\/printers\/[^/]+$/) && method === 'DELETE') {
      const ip = decodeURIComponent(path.split('/')[2]);
      await env.DB.prepare('DELETE FROM printers WHERE ip=?').bind(ip).run();
      return jsonResponse({ ok: true });
    }

    if (path === '/client-ip' && method === 'GET') {
      const ip = request.headers.get('CF-Connecting-IP') ||
                 request.headers.get('X-Forwarded-For') || 'unbekannt';
      return jsonResponse({ ip });
    }

    // ── Live-Summen ──────────────────────────────
    if (path === '/totals' && method === 'GET') {
      const stationId = url.searchParams.get('station');
      return jsonResponse(await getTotals(env, stationId));
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (err) {
    if (err.status === 401) return jsonResponse({ error: 'Unauthorized' }, 401);
    console.error(err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}
nv, ticketId) {
  const ticket = await env.DB.prepare(
    'SELECT t.*, s.name as station_name FROM tickets t LEFT JOIN stations s ON t.station_id = s.id WHERE t.id = ?'
  ).bind(ticketId).first();

  if (!ticket) throw Object.assign(new Error('Not found'), { status: 404 });

  // Print-Job anlegen
  const { results: items } = await env.DB.prepare(
    'SELECT * FROM ticket_items WHERE ticket_id = ?'
  ).bind(ticketId).all();

  // Prüfen ob vorher schon Teildrucke waren (original_items vorhanden)
  const originalItems = ticket.original_items ? JSON.parse(ticket.original_items) : null;
  const hadPartialPrints = originalItems && originalItems.length > 0;

  const payload = JSON.stringify({
    ticket_number: ticket.ticket_number,
    table_number:  ticket.table_number,
    station_name:  ticket.station_name,
    items:         items.map(i => ({ ...i, extras: JSON.parse(i.extras || '[]') })),
    created_at:    ticket.created_at,
    all_items:     hadPartialPrints ? originalItems : null,
    is_last:       hadPartialPrints,
    partial:       hadPartialPrints,
    printed_at:    new Date().toISOString(),
  });

  await env.DB.prepare(
    'INSERT INTO print_jobs (ticket_id, payload) VALUES (?, ?)'
  ).bind(ticketId, payload).run();

  await env.DB.prepare(
    "UPDATE tickets SET status = 'printing', printed_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(ticketId).run();

  return { ...ticket, status: 'printing' };
}


async function partialPrintTicket(env, ticketId, selectedItems) {
  const ticket = await env.DB.prepare(
    'SELECT t.*, s.name as station_name FROM tickets t LEFT JOIN stations s ON t.station_id = s.id WHERE t.id = ?'
  ).bind(ticketId).first();

  if (!ticket) throw Object.assign(...);
  if (!selectedItems || selectedItems.length === 0) throw Object.assign(...);
  const { results: currentItems } = await env.DB.prepare('SELECT id, product_name, quantity FROM ticket_items WHERE ticket_id = ?').bind(ticketId).all();
  const batchStmts = [];
  for (const sel of selectedItems) {
    const existing = currentItems.find(i => i.product_name === sel.product_name);
    if (!existing) continue;
    const newQty = existing.quantity - sel.quantity;
    if (newQty <= 0) { batchStmts.push(env.DB.prepare('DELETE FROM ticket_items WHERE id = ?').bind(existing.id)); }
    else { batchStmts.push(env.DB.prepare('UPDATE ticket_items SET quantity = ? WHERE id = ?').bind(newQty, existing.id)); }
  }
  if (batchStmts.length > 0) await env.DB.batch(batchStmts);
  const originalItems = JSON.parse(ticket.original_items || '[]');
  let allItemsForVon = originalItems;
  if (!allItemsForVon.length) {
    const { results: cur } = await env.DB.prepare('SELECT * FROM ticket_items WHERE ticket_id = ?').bind(ticketId).all();
    allItemsForVon = cur.map(i => ({ ...i, extras: JSON.parse(i.extras || '[]') }));
  }
  const { results: afterRemaining } = await env.DB.prepare('SELECT id FROM ticket_items WHERE ticket_id = ?').bind(ticketId).all();
  const isLastPartial = afterRemaining.length === 0;
  const payload = JSON.stringify({ ticket_number: ticket.ticket_number, table_number: ticket.table_number, station_name: ticket.station_name, items: selectedItems, all_items: allItemsForVon, partial: true, is_last: isLastPartial, created_at: ticket.created_at, printed_at: new Date().toISOString() });
  await env.DB.prepare('INSERT INTO print_jobs (ticket_id, payload) VALUES (?, ?)').bind(ticketId, payload).run();
  if (isLastPartial) { await env.DB.prepare("UPDATE tickets SET status = 'done' WHERE id = ?").bind(ticketId).run(); }
  return { ...ticket, partial: true };
}

async function markDone(env, ticketId) {
  const ticket = await env.DB.prepare('SELECT * FROM tickets WHERE id = ?').bind(ticketId).first();
  if (!ticket) throw Object.assign(...);
  await env.DB.prepare("UPDATE tickets SET status = 'done' WHERE id = ?").bind(ticketId).run();
  return { ...ticket, status: 'done' };
}

async function getTotals(env, stationId) {
  let query = `SELECT ti.product_name, SUM(ti.quantity) as total FROM ticket_items ti JOIN tickets t ON ti.ticket_id = t.id WHERE t.status != 'done'`;
  const params = [];
  if (stationId) { query += ' AND t.station_id = ?'; params.push(stationId); }
  query += ' GROUP BY ti.product_name ORDER BY total DESC';
  const { results } = await env.DB.prepare(query).bind(...params).all();
  return results;
}

async function getRecentJobs(env) {
  const { results } = await env.DB.prepare("SELECT pj.*, t.table_number FROM print_jobs pj JOIN tickets t ON pj.ticket_id = t.id ORDER BY pJ/created_at DESC LIMIT 20").all();
  return results.map(j => ({ ...j, payload: JSON.parse(j.payload) }));
}

async function getPendingJobs(env) {
  const { results } = await env.DB.prepare("SELECT pj.*, t.table_number FROM print_jobs pj JOIN tickets t ON pj.ticket_id = t.id WHERE pj.status = 'pending' ORDER BY pj.created_at ASC").all();
  return results.map(j => ({ ...j, payload: JSON.parse(j.payload) }));
}

async function completeJob(env, jobId) {
  await env.DB.prepare("UPDATE print_jobs SET status = 'done', completed_at = CURRENT_TIMESTAMP WHERE id = ?").bind(jobId).run();
  return { id: jobId, status: 'done' };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

function requireApiKey(request, env) {
  const key = request.headers.get('X-API-Key');
  if (!env.API_KEY || key !== env.API_KEY) { throw Object.assign(new Error('Unauthorized'), { status: 401 }); }
}
