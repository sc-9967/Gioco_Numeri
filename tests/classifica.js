// Classifiche pubbliche: il launcher parla con un "server" che in questo test e' il VERO schema SQL (docs/classifica.sql) su un PostgreSQL locale.
// Richiede PostgreSQL 16 avviato in locale (pg_ctlcluster 16 main start) e i ruoli anon/authenticated (li crea lo script se mancano).
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) bad++; };

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
let requests = [], online = true;
async function mockServer(ctx) {
  await ctx.route('https://jjdykknfepdlpaxgryou.supabase.co/**', async route => {
    const req = route.request(), url = req.url(), m = url.match(/\/rest\/v1\/rpc\/(\w+)/);
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST' } });
    requests.push(m ? m[1] : url);
    if (!online) return route.abort('failed');
    const sql = m && sqlFor(m[1], JSON.parse(req.postData() || '{}'));
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (!sql) return route.fulfill({ status: 404, headers: cors, body: '{"message":"no"}' });
    try { const out = run(sql).trim().split('\n').pop(); let v; try { v = JSON.parse(out); } catch (e) { v = out; } return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(v) }); }   // come PostgREST: un testo diventa una stringa JSON
    catch (e) { const t = String(e.stderr || e.message), mm = t.match(/ERROR:\s+([^\n]+)/); return route.fulfill({ status: 400, headers: cors, body: JSON.stringify({ message: mm ? mm[1] : t, code: 'P0001' }) }); }
  });
}
const count = sql => run(sql).trim().split('\n').pop();

(async () => {
  prepare();
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.addInitScript(() => { localStorage.setItem('nit_name', JSON.stringify('Prova')); localStorage.setItem('nit_pub_test', '1'); });
  await mockServer(ctx);
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html'); await sleep(600);

  // ---- 1) pannello vuoto, nessuna registrazione finche' non si invia un punteggio
  await page.click('#lx-pubbtn'); await sleep(600);
  ok(await page.isVisible('#lx-pubpanel'), 'pannello Classifiche aperto');
  ok(/Nessuno ha ancora un punteggio oggi/.test(await page.textContent('#lx-publist')), 'classifica vuota: invito a essere il primo (nessun finto giocatore)');
  ok(!requests.includes('nit_register'), 'aprire la classifica non registra il giocatore');
  await page.screenshot({ path: 'shots/pub-vuota.png' });
  await page.click('#lx-pubclose');

  // ---- 2) Sentiero: sfida del giorno -> invio -> posizione
  await page.click('[data-game="sentiero"]'); await sleep(500);
  await page.click('#daily'); await sleep(300);
  await page.evaluate(() => window.__SN.setTimescale(0.05));
  for (let g = 0; g < 5; g++) { await page.evaluate(() => { const S = window.__SN, p = S.solve(S.grids[S.state.gi]).path; for (let i = 1; i < p.length; i++) S.tap(p[i][0], p[i][1]); }); await sleep(1200); await page.evaluate(() => { const n = document.getElementById('next'); if (n && !n.closest('[hidden]')) n.click(); }); await sleep(300); }
  await sleep(1500);
  const score = parseInt((await page.textContent('#overScore')).replace(/\D/g, ''), 10);
  ok(score === 500, 'Sentiero: percorso ottimo = 500 punti (' + score + ')');
  const pubTxt = await page.textContent('.lx-hook .lx-pub');
  ok(/sei 1° oggi su 1|Sei 1° oggi su 1/.test(pubTxt), 'fine partita: posizione in classifica: ' + pubTxt);
  ok(count("select score from nit_scores where board='sentiero-giorno';") === '500', 'sul server c\'e\' una riga da 500 punti');
  const nick = JSON.parse(await page.evaluate(() => localStorage.getItem('nit_pub'))).nick;
  ok(/^[A-Za-zàèéìòù]+ [A-Za-zàèéìòù]+ \d{3}$/.test(nick), 'nome generato dal server, senza testo libero: ' + nick);
  await page.screenshot({ path: 'shots/pub-fine-sentiero.png' });
  // un solo giocatore registrato, nessuna chiamata di troppo
  ok(count('select count(*) from nit_players;') === '1', 'un solo giocatore registrato');
  // rivedere il riepilogo del giorno non reinvia
  const before = requests.length;
  await page.keyboard.press('Escape'); await sleep(300);
  await page.click('[data-game="sentiero"]'); await sleep(500); await page.click('#daily'); await sleep(600);
  ok(requests.length === before, 'il riepilogo di una sfida gia\' giocata non invia nulla');
  await page.keyboard.press('Escape'); await sleep(300);

  // ---- 3) pannello con il punteggio, periodi, secondo gioco vuoto
  await page.click('#lx-pubbtn'); await sleep(700);
  const rows = await page.$$eval('#lx-publist li', l => l.map(x => x.textContent));
  ok(rows.length === 1 && /1\..*\(tu\).*500/.test(rows[0]), 'riga in classifica con "(tu)" e 500: ' + JSON.stringify(rows));
  for (const label of ['Settimana', 'Mese', 'Sempre']) {
    await page.click(`#lx-pubperiods button:has-text("${label}")`); await sleep(500);
    ok((await page.$$eval('#lx-publist li.me', l => l.length)) === 1, 'periodo ' + label + ': il punteggio c\'e\'');
  }
  await page.click('#lx-pubboards button:has-text("Cassaforte")'); await sleep(500);
  ok(/Nessun punteggio in questo periodo/.test(await page.textContent('#lx-publist')), 'Cassaforte ancora vuota');
  // scelta del nome: sesso, animale declinato, numero
  const oldNick = nick;
  await page.click('#lx-pubnick'); await sleep(300);
  ok(await page.isVisible('#lx-nickbox'), 'si apre la scelta del nome');
  await page.click('#lx-nicksex button:has-text("Femmina")'); await sleep(100);
  const opts = await page.$$eval('#lx-nickanimal option', o => o.map(x => x.textContent));
  ok(opts.length === 16 && opts.includes('Leonessa') && !opts.includes('Leone'), 'elenco al femminile: ' + opts.slice(0, 6).join(', ') + '…');
  ok(await page.isDisabled('#lx-nicksave'), 'senza numero non si puo\' salvare');
  await page.selectOption('#lx-nickanimal', { label: 'Volpe' }); await page.fill('#lx-nicknum', '27'); await sleep(100);
  ok(/Comparirai come: Volpe 27/.test(await page.textContent('#lx-nickprev')), 'anteprima: ' + await page.textContent('#lx-nickprev'));
  await page.click('#lx-nicksave'); await sleep(800);
  const newNick = JSON.parse(await page.evaluate(() => localStorage.getItem('nit_pub'))).nick;
  ok(newNick === 'Volpe 27' && count("select nick from nit_players;") === 'Volpe 27', 'nome scelto sul server e sul dispositivo: ' + oldNick + ' -> ' + newNick);
  ok(/Volpe 27/.test(await page.textContent('#lx-pubme')) && await page.isHidden('#lx-nickbox'), 'il pannello mostra il nuovo nome');
  // gli elenchi del gioco e quelli del server coincidono per tutte le 32 combinazioni
  const src = fs.readFileSync(__dirname + '/../index.html', 'utf8');
  const lst = k => JSON.parse(new RegExp(k + ": (\\[[^\\]]*\\])").exec(src.slice(src.indexOf('const ANIMALS'))) [1].replace(/'/g, '"'));
  const AN = { m: lst('m'), f: lst('f') };
  const pl0 = JSON.parse(await page.evaluate(() => localStorage.getItem('nit_pub')));
  let same = true;
  for (const sx of ['m', 'f']) for (let i = 0; i < 16; i++) { const r = count(`set role anon; select nit_set_nick('${pl0.id}'::uuid, '${pl0.secret}', '${sx}', ${i}, 5);`); if (r !== AN[sx][i] + ' 5') { same = false; console.log('  diverso:', sx, i, r, AN[sx][i]); } }
  ok(same, 'elenchi uguali tra gioco e server (32 animali)');
  const tryNick = (sx, an, nm) => { try { run(`set role anon; select nit_set_nick('${pl0.id}'::uuid, '${pl0.secret}', ${q(sx)}, ${an}, ${nm});`); return 'accettato'; } catch (e) { return /scelta non valida/.test(String(e.stderr)) ? 'rifiutato' : String(e.stderr); } };
  ok(tryNick('x', 0, 5) === 'rifiutato' && tryNick('m', 16, 5) === 'rifiutato' && tryNick('m', -1, 5) === 'rifiutato' && tryNick('m', 0, 0) === 'rifiutato' && tryNick('m', 0, 1000) === 'rifiutato', 'il server rifiuta sesso, animale o numero fuori elenco');
  run(`update nit_players set nick = 'Volpe 27' where id = '${pl0.id}';`);
  await page.screenshot({ path: 'shots/pub-pannello.png' });
  await page.click('#lx-pubclose');

  // ---- 4) Cassaforte: il codice del giorno aperto va in classifica; la serie no
  run("update nit_players set last_submit = now() - interval '1 minute';");
  await page.click('[data-game="cassaforte"]'); await sleep(400);
  await page.click('#daily'); await sleep(300);
  await page.evaluate(() => { window.__C.setTimescale(0.05); const C = window.__C; C.type(C.S.code); C.submit(); }); await sleep(3500);
  const cs = parseInt((await page.textContent('#overScore')).replace(/\D/g, ''), 10);
  ok(cs >= 100 && cs <= 1400, 'Cassaforte del giorno: punteggio ' + cs);
  ok(/1° oggi su 1/.test(await page.textContent('.lx-hook .lx-pub')), 'Cassaforte: primo nella sua classifica');
  ok(count("select score from nit_scores where board='cassaforte-giorno';") === String(cs), 'sul server: ' + cs);
  await page.click('.lx-hook .lx-sharebtn:has-text("Vedi la classifica")'); await sleep(700);
  ok(await page.isVisible('#lx-pubpanel') && /Cassaforte/.test(await page.textContent('#lx-pubboards button[aria-pressed="true"]')), 'il pulsante apre la classifica della Cassaforte');
  await page.click('#lx-pubclose');
  await page.keyboard.press('Escape'); await sleep(300);
  const nReq = requests.length;
  await page.click('[data-game="cassaforte"]'); await sleep(400);
  await page.click('#play'); await sleep(300);
  await page.evaluate(() => { window.__C.setTimescale(0.05); });
  // la serie (non del giorno) non deve inviare: finisco subito perdendo le vite
  for (let i = 0; i < 40; i++) {
    const done = await page.evaluate(() => !document.getElementById('over').hidden); if (done) break;
    await page.evaluate(() => { const C = window.__C; if (C.S.state === 'play') { const w = ['0000', '9999'].map(x => x.slice(0, C.S.len).padEnd(C.S.len, '1')); C.type('0123456789'.slice(0, C.S.len)); C.submit(); } }); await sleep(200);
  }
  await sleep(1500);
  ok(requests.length === nReq, 'la serie normale non invia nulla alla classifica pubblica');
  await page.keyboard.press('Escape'); await sleep(300);

  // ---- 5) il server sa riconoscere chi barare: punteggio fuori scala, segreto sbagliato, frequenza
  const pl = JSON.parse(await page.evaluate(() => localStorage.getItem('nit_pub')));
  const attempt = sql => { try { run('set role anon; ' + sql); return 'ok'; } catch (e) { return String(e.stderr).match(/ERROR:\s+([^\n]+)/)[1]; } };
  run("update nit_players set last_submit = now() - interval '1 minute';");
  ok(attempt(`select nit_submit('${pl.id}'::uuid, '${pl.secret}', 'sentiero-giorno', 501);`) === 'punteggio fuori scala', 'server: 501 su 500 massimi rifiutato');
  ok(attempt(`select nit_submit('${pl.id}'::uuid, 'ffffffffffffffffffffffffffffffff', 'sentiero-giorno', 100);`) === 'giocatore sconosciuto', 'server: segreto sbagliato rifiutato');
  ok(attempt(`select nit_submit('${pl.id}'::uuid, '${pl.secret}', 'sentiero-giorno', 100);`) === 'ok', 'server: invio valido accettato');
  ok(attempt(`select nit_submit('${pl.id}'::uuid, '${pl.secret}', 'sentiero-giorno', 100);`) === 'troppo veloce', 'server: due invii ravvicinati rifiutati');
  ok(attempt(`select count(*) from nit_scores;`).includes('permission denied'), 'server: lettura diretta delle tabelle vietata');
  ok(count("select score from nit_scores where board='sentiero-giorno';") === '500', 'un punteggio piu\' basso non sostituisce il migliore');
  // escludere un giocatore lo toglie dalle classifiche
  run(`update nit_players set banned = true where id = '${pl.id}';`);
  await page.click('#lx-pubbtn'); await sleep(700); await page.click('#lx-pubboards button:has-text("Sentiero")'); await sleep(500);
  ok(/Nessun/.test(await page.textContent('#lx-publist')), 'giocatore escluso: non compare piu\'');
  await page.click('#lx-pubclose');

  // ---- 6) server irraggiungibile: il gioco funziona, messaggio chiaro
  online = false;
  await page.click('#lx-pubbtn'); await sleep(900);
  ok(/non raggiungibile/.test(await page.textContent('#lx-pubmsg')), 'classifica offline: messaggio chiaro');
  await page.click('#lx-pubclose');
  // segreto non piu' valido sul server (database azzerato) -> nuova registrazione automatica
  online = true;
  run('truncate nit_scores, nit_players cascade;');
  run("select 1;");
  await page.evaluate(() => { localStorage.removeItem('cass_d_x'); });

  // ---- 7) senza nit_pub_test (come un test automatico) non parte nessuna chiamata
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx2.addInitScript(() => localStorage.setItem('nit_name', JSON.stringify('Prova')));
  const before2 = requests.length; await mockServer(ctx2);
  const p2 = await ctx2.newPage(); await p2.goto('file://' + __dirname + '/../index.html'); await sleep(500);
  await p2.click('[data-game="sentiero"]'); await sleep(400); await p2.click('#daily'); await sleep(300);
  await p2.evaluate(() => window.__SN.setTimescale(0.05));
  for (let g = 0; g < 5; g++) { await p2.evaluate(() => { const S = window.__SN, p = S.solve(S.grids[S.state.gi]).path; for (let i = 1; i < p.length; i++) S.tap(p[i][0], p[i][1]); }); await sleep(1200); await p2.evaluate(() => { const n = document.getElementById('next'); if (n && !n.closest('[hidden]')) n.click(); }); await sleep(300); }
  await sleep(1500);
  ok(requests.length === before2, 'sotto automazione senza consenso del test: nessuna chiamata al server vero');

  ok(errs.length === 0, 'nessun errore in pagina ' + JSON.stringify(errs));
  await b.close();
  console.log(bad ? 'FALLITI: ' + bad : 'TUTTO OK');
  process.exit(bad ? 1 : 0);
})();
