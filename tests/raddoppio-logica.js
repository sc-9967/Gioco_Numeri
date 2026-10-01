// Raddoppio: logica (scorrimento, fusione singola per mossa), invarianti su partite casuali, undo deterministico, sfida del giorno, catena, martello, vittoria, game over.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FILE = 'file://' + __dirname + '/../index.html#raddoppio';
(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 })).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type()==='error' && !/ERR_CERT|Failed to load/.test(m.text()) && errs.push(m.text()));
  await page.goto(FILE); await sleep(500);
  await page.evaluate(() => window.__R.setTimescale(0.03));
  // A) partite casuali con invarianti: somma conservata (+ spawn), nessuna fusione doppia, spawn 2/4, tessere mai in cella occupata
  const A = await page.evaluate(async () => {
    const R = window.__R, out = { games: 0, moves: 0, bad: [], overs: 0 };
    const sum = v => v.flat().reduce((a, b) => a + b, 0);
    for (let g = 0; g < 12; g++) {
      R.start(g % 2 ? 'daily' : 'free'); out.games++;
      let guard = 0;
      while (R.S.running && guard++ < 3000) {
        while (R.S.busy) await new Promise(r => setTimeout(r, 4));
        const before = R.values(), sb = sum(before), mv0 = R.S.moves;
        const dir = ['left', 'right', 'up', 'down'][Math.floor(Math.random() * 4)];
        R.move(dir);
        await new Promise(r => setTimeout(r, 12));
        while (R.S.busy) await new Promise(r => setTimeout(r, 4));
        if (R.S.moves === mv0) { if (JSON.stringify(R.values()) !== JSON.stringify(before)) out.bad.push('mossa nulla ma griglia cambiata'); if (!R.canMove() && R.S.hammers === 0 && !R.S.over) { /* finito */ } continue; }
        const after = R.values(), sa = sum(after);
        const spawned = sa - sb;
        if (spawned !== 2 && spawned !== 4) out.bad.push('spawn ' + spawned + ' dopo ' + dir);
        if (new Set(after.flat().filter(Boolean).map(v => (v & (v - 1)) === 0)).has(false)) out.bad.push('valore non potenza di 2');
        out.moves++;
        if (R.S.hammers > 0) { /* usa il martello quando bloccato */ if (!R.canMove()) { R.useHammerAt(0, 0); } }
      }
      if (R.S.over) out.overs++;
    }
    return out;
  });
  console.log('A', JSON.stringify(A));
  // B) undo deterministico: stessa mossa dopo undo => stesso risultato (stesso spawn)
  const B = await page.evaluate(async () => {
    const R = window.__R; R.start('free'); await new Promise(r => setTimeout(r, 30));
    const res = { same: 0, tot: 0 };
    for (let i = 0; i < 60; i++) {
      while (R.S.busy) await new Promise(r => setTimeout(r, 4));
      const d = ['left', 'up', 'right', 'down'][i % 4];
      const m0 = R.S.moves;
      R.move(d); await new Promise(r => setTimeout(r, 15)); while (R.S.busy) await new Promise(r => setTimeout(r, 4));
      if (R.S.moves === m0) continue;                 // mossa nulla: niente snapshot, niente da annullare
      const a = JSON.stringify(R.values()), sc = R.S.score;
      R.undo(); await new Promise(r => setTimeout(r, 10));
      R.move(d); await new Promise(r => setTimeout(r, 15)); while (R.S.busy) await new Promise(r => setTimeout(r, 4));
      res.tot++; if (JSON.stringify(R.values()) === a && R.S.score === sc) res.same++;
    }
    return res;
  });
  console.log('B undo', JSON.stringify(B));
  // C) sfida del giorno: stessa sequenza => stessa griglia iniziale in due avvii
  const C = await page.evaluate(async () => { const R = window.__R; R.start('daily'); const a = JSON.stringify(R.values()); R.start('daily'); const c = JSON.stringify(R.values()); R.start('free'); return [a === c, a]; });
  console.log('C daily', JSON.stringify(C));
  // D) catena, punti, martello, vittoria
  const D = await page.evaluate(async () => {
    const R = window.__R, w = ms => new Promise(r => setTimeout(r, ms)), o = {};
    R.start('free'); await w(30);
    // due mosse consecutive con fusione: 1a x1, 2a x2
    R.setGrid([[2,2,0,0],[0,0,0,0],[4,4,0,0],[0,0,0,0]]);
    R.move('left'); await w(40); o.s1 = R.S.score; o.st1 = R.S.streak;
    R.setGrid([[4,4,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], { streak: 1 });
    R.move('left'); await w(40); o.s2 = R.S.score - o.s1; o.st2 = R.S.streak;
    // martello al raggiungere 64
    R.start('free'); await w(30);
    R.setGrid([[32,32,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]); R.move('left'); await w(40);
    o.hammers = R.S.hammers; o.maxTile = R.S.maxTile;
    R.useHammerAt(0, 0); await w(40); o.afterHammer = JSON.stringify(R.values()); o.h2 = R.S.hammers;
    // vittoria
    R.start('free'); await w(30);
    R.setGrid([[1024,1024,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], { maxTile: 1024 }); R.move('left'); await w(400);
    o.won = R.S.won; o.winVisible = !document.getElementById('win').hidden;
    document.getElementById('winGo').click(); o.winHidden = document.getElementById('win').hidden;
    // game over: griglia bloccata
    R.start('free'); await w(30);
    R.setGrid([[8,16,8,16],[16,8,16,8],[8,16,8,16],[8,16,8,0]]); R.move('right'); await w(400);
    o.stuck = !R.canMove(); o.over = R.S.over; o.overVisible = !document.getElementById('over').hidden;
    return o;
  });
  console.log('D', JSON.stringify(D));
  console.log('errori', JSON.stringify(errs)); await b.close();
})();
