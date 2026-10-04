// Classifiche pubbliche della sfida del giorno negli altri giochi: invio a fine partita, posizione, pulsante dal pannello Record, menu delle classifiche.
const { chromium } = require('playwright');
const A = require('./adattatori');
const pg = require('./_pg');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) bad++; };
const GAMES = (process.argv[2] ? process.argv[2].split(',') : ['bilancia', 'quadrante', 'primo', 'resto', 'girasette', 'raddoppio', 'lampo', 'dieci']);
A.dieci.finishDaily = A.dieci.finishWith;

(async () => {
  pg.prepare();
  const b = await chromium.launch();
  const mk = async name => { const c = await b.newContext({ viewport: { width: 390, height: 844 } }); await c.addInitScript(n => { localStorage.setItem('nit_name', JSON.stringify(n)); localStorage.setItem('nit_pub_test', '1'); }, name); await pg.mockServer(c); return c; };
  for (const g of GAMES) {
    const a = A[g], errs = [];
    const c1 = await mk('Anna'), p1 = await c1.newPage();
    p1.on('pageerror', e => errs.push('pageerror: ' + e.message)); p1.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
    await p1.goto('file://' + __dirname + '/../index.html'); await sleep(500);
    await p1.click(`[data-game="${g}"]`); await sleep(450);
    ok(await p1.locator('#menu .lx-pubopen, #menu .lx-recopen').count() >= 1, g + ': nel menu c\'è il pulsante dei record');
    await p1.click('#daily'); await sleep(400);
    if (a.afterStart) await a.afterStart(p1);
    await a.finishWith(p1, 40);
    const sc = parseInt((await p1.textContent('#overScore')).replace(/\D/g, ''), 10);
    await sleep(900);
    const line = await p1.locator('.lx-hook .lx-pub').first().textContent().catch(() => '');
    ok(/Sei 1° oggi su 1/.test(line), g + ': sfida del giorno con ' + sc + ' punti, posizione: ' + line);
    ok(pg.count(`select score from nit_scores where board='${g}-giorno';`) === String(sc), g + ': sul server la classifica ' + g + '-giorno ha ' + sc);
    // un secondo giocatore con un punteggio più basso
    const c2 = await mk('Bruno'), p2 = await c2.newPage();
    p2.on('pageerror', e => errs.push('pageerror: ' + e.message));
    await p2.goto('file://' + __dirname + '/../index.html'); await sleep(500);
    await p2.click(`[data-game="${g}"]`); await sleep(450); await p2.click('#daily'); await sleep(400);
    if (a.afterStart) await a.afterStart(p2);
    await a.finishWith(p2, 20); await sleep(900);
    const line2 = await p2.locator('.lx-hook .lx-pub').first().textContent().catch(() => '');
    ok(/2° su 2|2° oggi su 2/.test(line2) || /sei 2° su 2/.test(line2), g + ': il secondo giocatore è 2° su 2: ' + line2);
    // dal pannello Record del gioco alla classifica pubblica
    await p2.locator('#over .lx-recopen').click(); await sleep(250);
    ok(/I TUOI record/.test(await p2.textContent('#lx-grecwho')), g + ': il pannello dice che sono i tuoi record');
    ok(await p2.isVisible('#lx-grecpub'), g + ': il pannello Record ha il pulsante «Classifica pubblica»');
    await p2.click('#lx-grecpub'); await sleep(900);
    const rows = await p2.$$eval('#lx-publist li', l => l.map(x => x.textContent));
    ok(await p2.isVisible('#lx-pubpanel') && rows.length === 2 && /Anna|Volpe|Lupo|Gatt|Orso|Leone|Cervo|Gufo|Falco|Delfino|Riccio|Tasso|\d{3}/.test(rows[0]) && /\(tu\)/.test(rows[1]), g + ': classifica pubblica con due giocatori e «(tu)»: ' + JSON.stringify(rows));
    ok((await p2.inputValue('#lx-pubboardsel')) === g + '-giorno', g + ': si apre sulla classifica giusta');
    ok(errs.length === 0, g + ': nessun errore ' + JSON.stringify(errs));
    await c1.close(); await c2.close();
  }
  // menu delle classifiche
  const c3 = await mk('Carla'), p3 = await c3.newPage();
  await p3.goto('file://' + __dirname + '/../index.html'); await sleep(500);
  await p3.click('#lx-pubbtn'); await sleep(700);
  const opts = await p3.$$eval('#lx-pubboardsel option', o => o.map(x => x.value));
  ok(opts.length === 10 && opts.includes('dieci-giorno') && opts.includes('sentiero-giorno'), 'il menu ha 10 classifiche: ' + opts.join(', '));
  await p3.screenshot({ path: 'shots/pub-menu10.png' });
  // Sentiero: «Classifica» accanto a «Come si gioca»
  await p3.click('#lx-pubclose'); await p3.click('[data-game="sentiero"]'); await sleep(450);
  ok(await p3.locator('#menu .lx-pubopen').isVisible(), 'sentiero: pulsante «Classifica» nel menu');
  await p3.click('#menu .lx-pubopen'); await sleep(700);
  ok((await p3.inputValue('#lx-pubboardsel')) === 'sentiero-giorno' && await p3.isVisible('#lx-pubpanel'), 'sentiero: apre la sua classifica');
  await b.close();
  console.log(bad ? 'FALLITI: ' + bad : 'TUTTO OK');
  process.exit(bad ? 1 : 0);
})();
