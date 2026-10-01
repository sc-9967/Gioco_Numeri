// Sentiero: percorso ottimo (programmazione dinamica contro tutti i 70 percorsi), generatore, determinismo, codici sfida, date, record per periodo, serie.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FILE = 'file://' + __dirname + '/../index.html#sentiero';
(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 })).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type()==='error' && !/ERR_CERT|Failed to load/.test(m.text()) && errs.push(m.text()));
  await page.goto(FILE); await sleep(500);
  await page.screenshot({ path: 'shots/sn-menu.png' });
  const A = await page.evaluate(() => {
    const S = window.__SN, o = { n: 0, dpBad: 0, ties: 0, unique: 0, optMin: 1e9, optMax: 0, optSum: 0, greedyRatio: 0, paths: S.allPaths().length, slow: 0 };
    const t0 = performance.now();
    for (let i = 0; i < 300; i++) {
      const g = S.makeGrid(S.mulberry(S.hashStr('t' + i)));
      const sol = S.solve(g), vals = S.allPaths().map(p => S.valueOfPath(g, p));
      const mx = Math.max(...vals);
      if (mx !== sol.opt || S.valueOfPath(g, sol.path) !== sol.opt) o.dpBad++;
      const cnt = vals.filter(v => v === mx).length; if (cnt === 1) o.unique++; else o.ties++;
      o.optMin = Math.min(o.optMin, sol.opt); o.optMax = Math.max(o.optMax, sol.opt); o.optSum += sol.opt; o.greedyRatio += S.greedy(g) / sol.opt; o.n++;
    }
    o.ms = Math.round(performance.now() - t0); o.avgOpt = Math.round(o.optSum / o.n); o.greedyRatio = +(o.greedyRatio / o.n).toFixed(2);
    // determinismo
    const a = JSON.stringify(S.gridsFor('sentiero-2026-10-01')), c = JSON.stringify(S.gridsFor('sentiero-2026-10-01')), d = JSON.stringify(S.gridsFor('sentiero-2026-10-02'));
    o.det = a === c && a !== d;
    // percorso casuale medio
    let rs = 0, rn = 0; for (let i = 0; i < 100; i++) { const g = S.makeGrid(S.mulberry(S.hashStr('r' + i))), ps = S.allPaths(), opt = S.solve(g).opt; const p = ps[Math.floor(Math.random() * ps.length)]; rs += S.pctOf(S.valueOfPath(g, p), opt); rn++; }
    o.randomPct = Math.round(rs / rn);
    return o;
  });
  console.log('A', JSON.stringify(A));
  const B = await page.evaluate(() => {
    const S = window.__SN, o = {};
    o.codes = [S.parseCode('SEN-k3f9a-412'), S.parseCode('ciao https://x/#sentiero?c=SEN-ABC-500 ok'), S.parseCode('SEN-k3-501'), S.parseCode('niente')];
    o.rt = S.parseCode(S.encodeCode('abc12', 333));
    o.week = [S.weekStart('2026-10-01'), S.weekStart('2026-10-05'), S.weekStart('2026-10-04')];
    const h = { '2026-09-29': { t: 400 }, '2026-09-30': { t: 300 }, '2026-10-01': { t: 450 }, '2025-12-31': { t: 100 }, '2026-10-05': { t: 200 } };
    o.agg = S.aggregate(h, '2026-10-01'); o.streak = [S.streakOf(h, '2026-10-01'), S.streakOf(h, '2026-10-02'), S.streakOf(h, '2026-10-04')];
    o.date = S.dateStr(new Date('2026-12-31T23:30:00Z')) + ' ' + S.dateStr(new Date('2026-07-01T22:30:00Z'));
    return o;
  });
  console.log('B', JSON.stringify(B));
  console.log('errori', JSON.stringify(errs)); await b.close();
})();
