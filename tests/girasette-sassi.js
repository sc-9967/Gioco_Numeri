// Girasette con i sassi dentro al gioco vero: arrivano, si vedono, si annunciano, la partita finisce, la partita del giorno resta uguale per tutti.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK  ' : 'KO  ') + m); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  await page.addInitScript(() => { localStorage.setItem('nit_name', JSON.stringify('Prova')); localStorage.setItem('nit_howto_girasette', '1'); });
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html#girasette'); await sleep(600);
  await page.evaluate(() => window.__M7.setTimescale(0.02));
  ok(await page.evaluate(() => /sassi/i.test(document.querySelector('.rules').textContent)), 'il menu spiega i sassi');
  await page.click('#play'); await sleep(200);
  ok((await page.textContent('#hint')).includes('Trascina'), 'all\'inizio il suggerimento resta quello di sempre');
  // gioca con "prima mossa valida", annotando quando compare il primo sasso
  const run = () => page.evaluate(async () => {
    const M = window.__M7; M.newGame('free'); let guard = 0, firstRock = null, hintAfter = null, maxRocks = 0, snap = null, trays = 0;
    while (!M.over && guard++ < 60000) {
      if (M.busy) { await new Promise(r => setTimeout(r, 5)); continue; }
      const cands = [];
      M.tray.forEach((p, i) => { if (!p) return; const rots = p.vals.length === 2 ? 6 : 1; for (let o = 0; o < rots; o++) for (const [q, r] of M.CELLS) if (M.canPlaceAt(M.board, { vals: p.vals, o }, q, r)) cands.push({ i, o, q, r }); });
      if (!cands.length) break;
      const c = cands[0]; M.tray[c.i].o = c.o; M.placePiece(c.i, c.q, c.r); await new Promise(r => setTimeout(r, 5));
      const rocks = [...M.board.values()].filter(v => v === M.ROCK).length; maxRocks = Math.max(maxRocks, rocks);
      if (rocks && firstRock === null) { firstRock = { placed: M.placedCount, trays: M.trayNo }; hintAfter = document.getElementById('hint').textContent; }
      if (rocks >= 4 && !snap) { snap = true; window.__snapAt = M.placedCount; }
    }
    await new Promise(r => setTimeout(r, 400));
    return { over: M.over, placed: M.placedCount, firstRock, hintAfter, maxRocks, rocksStat: M.stat.rocks, spins: M.stat.spins, score: M.score };
  });
  const R = await run();
  console.log(JSON.stringify(R));
  ok(R.over, 'la partita (strategia "prima mossa valida") finisce: prima arrivava a 336 giri senza finire (ora ' + R.spins + ' giri, ' + R.placed + ' pezzi)');
  ok(R.firstRock && R.firstRock.trays >= 11 && R.firstRock.trays <= 15, 'il primo sasso arriva dopo ' + (R.firstRock && R.firstRock.trays) + ' riserve');
  ok(R.maxRocks >= 4 && R.rocksStat >= R.maxRocks, 'i sassi si accumulano (massimo ' + R.maxRocks + ' in plancia, ' + R.rocksStat + ' arrivati)');
  ok(await page.isVisible('#over'), 'schermata finale visibile');
  // la riga di annuncio durante una partita nuova
  await page.click('#again'); await sleep(200);
  await page.evaluate(() => { const M = window.__M7; M.trayNo = 12; });
  const t12 = await page.evaluate(() => window.__M7.rockText());
  await page.evaluate(() => { window.__M7.trayNo = 13; });
  const t13 = await page.evaluate(() => window.__M7.rockText());
  console.log(JSON.stringify([t12, t13]));
  ok(/riserv/.test(t12) && /^🪨/.test(t13), 'testo di annuncio dei sassi');
  // disegno: una plancia con sassi e tessere
  await page.evaluate(() => { const M = window.__M7, k = M.key; const bd = new Map(); [[1, 0], [-1, 1], [0, -2], [2, -1], [-2, 0]].forEach(([q, r]) => bd.set(k(q, r), M.ROCK)); [[0, 1, 1], [1, 1, 2], [-1, 0, 3], [0, -1, 7], [2, 0, 4]].forEach(([q, r, v]) => bd.set(k(q, r), v)); M.board = bd; });
  await sleep(300); await page.screenshot({ path: 'shots/gir-sassi.png' });
  ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'nessuno scorrimento orizzontale');
  console.log('errori:', JSON.stringify(errs)); await b.close();
  console.log(fails ? 'FALLITI: ' + fails : 'TUTTO OK');
})();
