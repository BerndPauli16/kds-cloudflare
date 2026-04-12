// ════════════════════════════════════════════════
//  KDS Worker – Haupt-Entry-Point
// ════════════════════════════════════════════════
import { KDSRoom }    from './kds-room.js';
import { getHTML }    from './frontend.js';

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
    // ── Stationen ────────────────────────────────
    if (path === '/stations' && method === 'GET') {
      return jsonResponse(await getStations(env));
    }

    // ── Tickets ──────────────────────────────────
    if (path === '/tickets' && method === 'GET') {
      const stationId = url.searchParams.get('station');
      return jsonResponse(await getTickets(env, stationId));
    }

    if (path === '/tickets' && method === 'POST') {
      requireApiKey(request, env);
      const body   = await request.json();
      const ticket = await createTicket(env, body);
      await broadcastUpdate(env, ticket.station_id, { type: 'ticket_created', ticket });
      return jsonResponse(ticket, 201);
    }

    // ── Ticket drucken ───────────────────────────
    const printMatch = path.match(/^\/tickets\/(\d+)\/print$/);
    if (printMatch && method === 'POST') {
      const id     = parseInt(printMatch[1]);
      const result = await printTicket(env, id);
      await broadcastUpdate(env, result.station_id, { type: 'ticket_printed', ticketId: id });
      return jsonResponse(result);
    }

    // ── Ticket als erledigt markieren ────────────
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

    if (path.match(/^\/print-jobs\/\d+\/complete$/) && method === 'POST') {
      requireApiKey(request, env);
      const jobId = parseInt(path.split('/')[2]);
      return jsonResponse(await completeJob(env, jobId));
    }

    // ── Client-IP (für Monitor-Anzeige) ─────────
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

// ════════════════════════════════════════════════
//  DB Funktionen
// ════════════════════════════════════════════════

async function getStations(env) {
  const { results } = await env.DB.prepare('SELECT * FROM stations ORDER BY name').all();
  return results;
}

async function getTickets(env, stationId) {
  let query = `
    SELECT t.*, s.name as station_name, s.color as station_color
    FROM tickets t
    LEFT JOIN stations s ON t.station_id = s.id
    WHERE t.status != 'done'
  `;
  const params = [];
  if (stationId) { query += ' AND t.station_id = ?'; params.push(stationId); }
  query += ' ORDER BY t.created_at ASC';

  const { results: tickets } = await env.DB.prepare(query).bind(...params).all();

  // Items für jeden Ticket laden
  for (const ticket of tickets) {
    const { results: items } = await env.DB.prepare(
      'SELECT * FROM ticket_items WHERE ticket_id = ?'
    ).bind(ticket.id).all();
    ticket.items     = items.map(i => ({ ...i, extras: JSON.parse(i.extras || '[]') }));
    ticket.wait_mins = Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 60000);
  }

  return tickets;
}

async function createTicket(env, body) {
  const { ticket_number, table_number, station_id, items } = body;

  const { meta } = await env.DB.prepare(
    'INSERT INTO tickets (ticket_number, table_number, station_id) VALUES (?, ?, ?)'
  ).bind(ticket_number, table_number, station_id).run();

  const ticketId = meta.last_row_id;

  // Items einfügen
  for (const item of (items || [])) {
    await env.DB.prepare(
      'INSERT INTO ticket_items (ticket_id, product_name, quantity, extras) VALUES (?, ?, ?, ?)'
    ).bind(ticketId, item.product_name, item.quantity, JSON.stringify(item.extras || [])).run();
  }

  // Print-Job erstellen
  const payload = JSON.stringify({ ticket_number, table_number, items });
  await env.DB.prepare(
    'INSERT INTO print_jobs (ticket_id, payload) VALUES (?, ?)'
  ).bind(ticketId, payload).run();

  return { id: ticketId, ticket_number, table_number, station_id, items };
}

async function printTicket(env, ticketId) {
  const ticket = await env.DB.prepare(
    'SELECT t.*, s.name as station_name FROM tickets t LEFT JOIN stations s ON t.station_id = s.id WHERE t.id = ?'
  ).bind(ticketId).first();

  if (!ticket) throw Object.assign(new Error('Not found'), { status: 404 });

  // Print-Job anlegen
  const { results: items } = await env.DB.prepare(
    'SELECT * FROM ticket_items WHERE ticket_id = ?'
  ).bind(ticketId).all();

  const payload = JSON.stringify({
    ticket_number: ticket.ticket_number,
    table_number:  ticket.table_number,
    station_name:  ticket.station_name,
    items:         items.map(i => ({ ...i, extras: JSON.parse(i.extras || '[]') })),
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

async function markDone(env, ticketId) {
  const ticket = await env.DB.prepare('SELECT * FROM tickets WHERE id = ?').bind(ticketId).first();
  if (!ticket) throw Object.assign(new Error('Not found'), { status: 404 });
  await env.DB.prepare("UPDATE tickets SET status = 'done' WHERE id = ?").bind(ticketId).run();
  return { ...ticket, status: 'done' };
}

async function getTotals(env, stationId) {
  let query = `
    SELECT ti.product_name, SUM(ti.quantity) as total
    FROM ticket_items ti
    JOIN tickets t ON ti.ticket_id = t.id
    WHERE t.status != 'done'
  `;
  const params = [];
  if (stationId) { query += ' AND t.station_id = ?'; params.push(stationId); }
  query += ' GROUP BY ti.product_name ORDER BY total DESC';

  const { results } = await env.DB.prepare(query).bind(...params).all();
  return results;
}

async function getPendingJobs(env) {
  const { results } = await env.DB.prepare(
    "SELECT pj.*, t.table_number FROM print_jobs pj JOIN tickets t ON pj.ticket_id = t.id WHERE pj.status = 'pending' ORDER BY pj.created_at ASC"
  ).all();
  return results.map(j => ({ ...j, payload: JSON.parse(j.payload) }));
}

async function completeJob(env, jobId) {
  await env.DB.prepare(
    "UPDATE print_jobs SET status = 'done', completed_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(jobId).run();
  return { id: jobId, status: 'done' };
}

// ════════════════════════════════════════════════
//  Helpers
// ════════════════════════════════════════════════

async function broadcastUpdate(env, stationId, data) {
  // An den station-spezifischen Room und den "all" Room broadcasten
  const rooms = ['all'];
  if (stationId) rooms.push(String(stationId));

  for (const roomName of rooms) {
    try {
      const id   = env.KDS_ROOM.idFromName(roomName);
      const room = env.KDS_ROOM.get(id);
      await room.fetch(new Request('https://internal/broadcast', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      }));
    } catch (e) {
      console.error('Broadcast error:', e);
    }
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function requireApiKey(request, env) {
  const key = request.headers.get('X-API-Key');
  if (!env.API_KEY || key !== env.API_KEY) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
}
