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

    if (method === 'OPTIONS') return new Response(null, { headers: CORS });

    if (url.pathname.startsWith('/ws')) {
      const stationId = url.searchParams.get('station') || 'all';
      const id   = env.KDS_ROOM.idFromName(stationId);
      const room = env.KDS_ROOM.get(id);
      return room.fetch(request);
    }

    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env, url, method);
    }

    return new Response(getHTML/(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};

async function handleAPI(request, env, url, method) {
  const path = url.pathname.replace('/api', '');
  try {
    if (path === '/stations' && method === 'GET') return jsonResponse(await getStations(env));
    if (path === '/tickets' && method === 'GET') return jsonResponse(await getTickets(env, url.searchParams.get('station')));
    if (path === '/tickets' && method === 'POST') { requireApiKey(request, env); const ticket = await createTicket(env, await request.json()); await broadcastUpdate(env, ticket.station_id, { type: 'ticket_created', ticket }); return jsonResponse(ticket, 201); }
    const printM = path.match(/^\/tickets\/(\d+)\/print$/);
    if (printM && method === 'POST') { const r = await printTicket(env, parseInt(printM[1])); await broadcastUpdate(env, r.station_id, { type: 'ticket_printed', ticketId: parseInt(printM[1]) }); return jsonResponse(r); }
    const partM = path.match(/^\/tickets\/(\d+)\/partial-print$/);
    if (partM && method === 'POST') { const body = await request.json(); const r = await partialPrintTicket(env, parseInt(partM[1]), body.items || []); await broadcastUpdate(env, r.station_id, { type: 'ticket_partial_printed', ticketId: parseInt(partM[1]) }); return jsonResponse(r); }
    const doneM = path.match(/^\/tickets\/(\d+)\/done$/);
    if (doneM && method === 'POST') { const r = await markDone(env, parseInt(doneM[1])); await broadcastUpdate(env, r.station_id, { type: 'ticket_done', ticketId: parseInt(doneM[1]) }); return jsonResponse(r); }
    if (path === '/print-jobs/pending' && method === 'GET') { requireApiKey(request, env); return jsonResponse(await getPendingJobs(env)); }
    if (path === '/print-jobs/recent' && method === 'GET') { requireApiKey(request, env); return jsonResponse(await getRecentJobs(env)); }
    const compM = path.match(/^\/print-jobs\/\d+\/complete$/);
    if (compM && method === 'POST') { requireApiKey(request, env); return jsonResponse(await completeJob(env, parseInt(path.split('/')[2]))); }
    if (path === '/agent' && method === 'POST') {
      requireApiKey(request, env);
      const { hostname, ip } = await request.json();
      await env.DB.prepare("INSERT INTO kv_store (key, value) VALUES ('agent_info', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify({ hostname, ip, updated_at: new Date().toISOString() })).run().catch(async () => {
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value TEXT)").run();
        await env.DB.prepare("INSERT INTO kv_store (key, value) VALUES ('agent_info', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify({ hostname, ip, updated_at: new Date().toISOString() })).run();
      });
      return jsonResponse({ ok: true });
    }
    if (path === '/agent' && method === 'GET') {
      const row = await env.DB.prepare("SELECT value FROM kv_store WHERE key='agent_info'").first().catch(() => null);
      return jsonResponse(row ? JSON.parse(row.value) : null);
    }
    if (path === '/client-ip' && method === 'GET') { return jsonResponse({ ip: request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unbekannt' }); }
    if (path === '/totals' && method === 'GET') return jsonResponse(await getTotals(env, url.searchParams.get('station')));
    return jsonResponse({ error: 'Not found' }, 404);
  } catch (err) {
    if (err.status === 401) return jsonResponse({ error: 'Unauthorized' }, 401);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

async function getStations(env) { const { results } = await env.DB.prepare('SELECT * FROM stations ORDER BY name').all(); return results; }

async function getTickets(env, stationId) {
  let query = `SELECT t.*, s.name as station_name, s.color as station_color FROM tickets t LEFT JOIN stations s ON t.station_id = s.id WHERE t.status != 'done'`;
  const params = [];
  if (stationId) { query += ' AND t.station_id = ?'; params.push(stationId); }
  query += ' ORDER BY t.created_at ASC';
  const { results: tickets } = await env.DB.prepare(query).bind(...params).all();
  if (!tickets.length) return [];
  const ids = tickets.map(t => t.id);
  const { results: allItems } = await env.DB.prepare('SELECT * FROM ticket_items WHERE ticket_id IN (' + ids.map(() => '?').join(',') + ')').bind(...ids).all();
  const itemsByTicket = {};
  for (const item of allItems) { if (!itemsByTicket[item.ticket_id]) itemsByTicket[item.ticket_id] = []; itemsByTicket[item.ticket_id].push({ ...item, extras: JSON.parse(item.extras || '[]') }); }
  const now = Date.now();
  for (const ticket of tickets) { ticket.items = itemsByTicket[ticket.id] || []; ticket.wait_mins = Math.floor((now - new Date(ticket.created_at).getTime()) / 60000); }
  return tickets;
}

all other functions as before..