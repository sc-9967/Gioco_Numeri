// Girasette: partita del giorno (stessi pezzi per tutti), statistiche di fine partita, condivisione, record separati.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK  ' : 'KO  ') + m); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  await page.addInitScript(() => localStorage.setItem('nit_name', JSON.stringify('Prova')));
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html'); await sleep(400);
  await page.click('[data-game="girasette"]'); await sleep(500);
  await page.screenshot({ path: 'shots/gir-menu.png' });
  ok(await page.isVisible('#daily'), 'il menu offre la partita del giorno');
  await page.evaluate(() => window.__M7.setTimescale(0.02));
  // gioca una partita con la strategia indicata e restituisce le riserve viste (valori e orientamento)
  const run = (daily, pick) => page.evaluate(async ({ daily, pick }) => {
    const M = window.__M7; M.newGame(daily ? 'daily' : 'free');
    const seen = []; let last = null, guard = 0;
    while (!M.over && guard++ < 20000) {
      if (M.busy) { await new Promise(r => setTimeout(r, 6)); continue; }
      const sig = JSON.stringify(M.tray.map(p => p && [p.vals, p.o])); if (M.tray.every(Boolean) && sig !== last) { seen.push(M.tray.map(p => [p.vals.join('-'), p.vals.length])); last = sig; }
      const cands = [];
      M.tray.forEach((p, i) => { if (!p) return; const rots = p.vals.length === 2 ? 6 : 1; for (let o = 0; o < rots; o++) for (const [q, r] of M.CELLS) if (M.canPlaceAt(M.board, { vals: p.vals, o }, q, r)) cands.push({ i, o, q, r }); });
      if (!cands.length) break;
      const c = pick === 'first' ? cands[0] : pick === 'last' ? cands[cands.length - 1] : cands[Math.floor(Math.random() * cands.length)];
      M.tray[c.i].o = c.o; M.placePiece(c.i, c.q, c.r); await new Promise(r => setTimeout(r, 6));
    }
    await new Promise(r => setTimeout(r, 300));
    return { seen, score: M.score, over: M.over, mode: M.mode, stat: { ...M.stat }, share: M.shareText, trayNo: M.trayNo };
  }, { daily, pick });
  const A = await run(true, 'first'), B = await run(true, 'last'), C = await run(true, 'random');
  const n = Math.min(A.seen.length, B.seen.length, C.seen.length);
  ok(n >= 3, 'le tre partite del giorno hanno giocato almeno 3 riserve (' + A.seen.length + ', ' + B.seen.length + ', ' + C.seen.length + ')');
  ok(JSON.stringify(A.seen.slice(0, n)) === JSON.stringify(B.seen.slice(0, n)) && JSON.stringify(A.seen.slice(0, n)) === JSON.stringify(C.seen.slice(0, n)), 'stessi pezzi per tutti, con mosse diverse (' + n + ' riserve confrontate)');
  const F1 = await run(false, 'random'), F2 = await run(false, 'random');
  ok(JSON.stringify(F1.seen.slice(0, 4)) !== JSON.stringify(F2.seen.slice(0, 4)), 'la partita libera resta casuale');
  ok(A.mode === 'daily' && A.over && A.score > 0 && A.stat.tile >= 1 && A.stat.tile <= 7, 'partita del giorno finita: ' + A.score + ' punti, tessera ' + A.stat.tile + ', giri ' + A.stat.spins + ', catena ' + A.stat.chain);
  console.log('testo condiviso:', JSON.stringify(A.share));
  ok(/^Girasette · partita del giorno \d\d\/\d\d\n[\d.]+ punti · tessera \d/.test(A.share), 'testo di condivisione del giorno');
  const day = await page.evaluate(() => ({ free: localStorage.getItem('girasette_best'), keys: Object.keys(localStorage).filter(k => k.startsWith('girasette_d_')) }));
  ok(day.keys.length === 1, 'il record del giorno ha una chiave propria: ' + day.keys);
  // la schermata finale di una partita libera vera
  await page.evaluate(() => window.__M7.setTimescale(0.2));
  const r = await run(false, 'first'); await page.evaluate(() => window.__M7.setTimescale(0.02));
  await sleep(700);
  ok(await page.isVisible('#over'), 'schermata finale visibile');
  const txt = await page.evaluate(() => ({ mode: document.querySelector('#overMode').textContent, lbl: document.querySelector('#finalLbl').textContent, stats: [...document.querySelectorAll('#over .stats b')].map(b => b.textContent), other: document.querySelector('#other').textContent, hook: document.querySelector('.lx-hook') && document.querySelector('.lx-hook').innerText, genericShare: !!document.querySelector('.lx-sharebtn') }));
  console.log(JSON.stringify(txt));
  ok(txt.mode === 'Partita libera' && txt.lbl === 'Record' && txt.other === 'Partita del giorno', 'testi della partita libera');
  ok(!txt.genericShare, 'nessun "Copia risultato" duplicato dal launcher');
  ok(!!txt.hook, 'gancio di fine partita del launcher presente');
  await page.screenshot({ path: 'shots/gir-over.png' });
  await page.click('#other'); await sleep(300);
  ok((await page.evaluate(() => window.__M7.mode)) === 'daily', '"Partita del giorno" dal riepilogo');
  const hist = await page.evaluate(() => JSON.parse(localStorage.getItem('nit_hist') || '{}').girasette);
  ok(hist && Object.values(hist)[0].n >= 2, 'le partite finite entrano nello storico: ' + JSON.stringify(hist));
  ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'nessuno scorrimento orizzontale');
  console.log('errori:', JSON.stringify(errs)); await b.close();
  console.log(fails ? 'FALLITI: ' + fails : 'TUTTO OK');
})();
