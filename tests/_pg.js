// PostgreSQL locale con lo schema vero (docs/classifica.sql) come "server" delle classifiche; richiede PostgreSQL 16 avviato (pg_ctlcluster 16 main start).
const { execFileSync } = require('child_process');
const fs = require('fs');
const DB = 'nitdb';
const psql = (sql, db = DB) => execFileSync('su', ['postgres', '-c', `psql -d ${db} -t -A -v ON_ERROR_STOP=1 -f /tmp/nit_q.sql`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const run = sql => { fs.writeFileSync('/tmp/nit_q.sql', sql); fs.chmodSync('/tmp/nit_q.sql', 0o644); return psql(sql); };
const q = v => v === null || v === undefined ? 'null' : "'" + String(v).replace(/'/g, "''") + "'";

function prepare() {
  fs.copyFileSync(__dirname + '/../docs/classifica.sql', '/tmp/classifica.sql'); fs.chmodSync('/tmp/classifica.sql', 0o644);
  fs.writeFileSync('/tmp/nit_q.sql', "drop database if exists nitdb;\n"); fs.chmodSync('/tmp/nit_q.sql', 0o644);
  execFileSync('su', ['postgres', '-c', 'psql -q -f /tmp/nit_q.sql postgres'], { stdio: 'pipe' });
  fs.writeFileSync('/tmp/nit_q.sql', "create database nitdb;\n"); execFileSync('su', ['postgres', '-c', 'psql -q -f /tmp/nit_q.sql postgres'], { stdio: 'pipe' });
  fs.writeFileSync('/tmp/nit_q.sql', "do $$ begin if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if; if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; end $$;\n\\i /tmp/classifica.sql\n");
  execFileSync('su', ['postgres', '-c', 'psql -q -d nitdb -f /tmp/nit_q.sql'], { stdio: 'pipe' });
}

// il "server": traduce la chiamata REST /rest/v1/rpc/<funzione> in una chiamata SQL vera, eseguita come ruolo anon
function sqlFor(fn, b) {
  const calls = {
    nit_register: () => `nit_register(${q(b.p_secret)})`,
    nit_set_nick: () => `nit_set_nick(${q(b.p_id)}::uuid, ${q(b.p_secret)}, ${q(b.p_sex)}, ${q(b.p_animal)}::int, ${q(b.p_num)}::int)`,
    nit_submit: () => `nit_submit(${q(b.p_id)}::uuid, ${q(b.p_secret)}, ${q(b.p_board)}, ${q(b.p_score)}::int)`,
    nit_board: () => `nit_board(${q(b.p_board)}, ${q(b.p_period)}, ${q(b.p_player)}::uuid)`,
  };
  return calls[fn] ? `set role anon; select ${calls[fn]()};` : null;
}
const state = { requests: [], online: true };
async function mockServer(ctx) {
  await ctx.route('https://jjdykknfepdlpaxgryou.supabase.co/**', async route => {
    const req = route.request(), url = req.url(), m = url.match(/\/rest\/v1\/rpc\/(\w+)/);
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST' } });
    state.requests.push(m ? m[1] : url);
    if (!state.online) return route.abort('failed');
    const sql = m && sqlFor(m[1], JSON.parse(req.postData() || '{}'));
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (!sql) return route.fulfill({ status: 404, headers: cors, body: '{"message":"no"}' });
    try { const out = run(sql).trim().split('\n').pop(); let v; try { v = JSON.parse(out); } catch (e) { v = out; } return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(v) }); }   // come PostgREST: un testo diventa una stringa JSON
    catch (e) { const t = String(e.stderr || e.message), mm = t.match(/ERROR:\s+([^\n]+)/); return route.fulfill({ status: 400, headers: cors, body: JSON.stringify({ message: mm ? mm[1] : t, code: 'P0001' }) }); }
  });
}
const count = sql => run(sql).trim().split('\n').pop();

module.exports = { prepare, mockServer, run, count, state };
