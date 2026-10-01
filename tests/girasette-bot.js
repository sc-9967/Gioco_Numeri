const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CAP = +(process.env.CAP || 400), N = +(process.env.N || 6), RANDOM = process.env.RANDOM_BOT === '1';
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + __dirname + '/../girasette.html'); await sleep(400);
  await page.evaluate(() => window.__M7.setTimescale(0.02));
  const runs = [];
  for (let g = 0; g < N; g++) {
    await page.evaluate(() => window.__M7.newGame()); await sleep(80);
    let moves = 0;
    while (moves < CAP) {
      const st = await page.evaluate(() => ({ over: window.__M7.over, busy: window.__M7.busy }));
      if (st.over) break;
      if (st.busy) { await sleep(8); continue; }
      const did = await page.evaluate((RANDOM) => {
        const M = window.__M7; const cands = [];
        M.tray.forEach((p, i) => { if (!p) return; const rots = p.vals.length === 2 ? 6 : 1;
          for (let o = 0; o < rots; o++) { const t = { vals: p.vals, o };
            for (const [q, r] of M.CELLS) { if (!M.canPlaceAt(M.board, t, q, r)) continue;
              const sim = new Map(M.board); M.pieceCells(t, q, r).forEach(c => sim.set(M.key(c[0], c[1]), c[2]));
              const res = M.resolve(sim, M.pieceCells(t, q, r).map(c => [c[0], c[1]]));
              cands.push({ sc: RANDOM ? Math.random() : res.total * 10 - sim.size + Math.random(), i, o, q, r }); } } });
        if (!cands.length) return false;
        const best = cands.sort((a, b) => b.sc - a.sc)[0];
        M.tray[best.i].o = best.o; M.placePiece(best.i, best.q, best.r); return true;
      }, RANDOM);
      if (did) moves++; else await sleep(10);
    }
    const r = await page.evaluate(() => ({ score: window.__M7.score, over: window.__M7.over, tiles: window.__M7.board.size }));
    runs.push({ moves, ...r }); console.log(JSON.stringify(runs[runs.length - 1]));
  }
  console.log('ERRORI', JSON.stringify(errs)); await b.close();
})();
