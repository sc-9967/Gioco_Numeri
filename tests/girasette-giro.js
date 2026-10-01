const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + __dirname + '/../girasette.html'); await sleep(600);
  // schermata con frecce (un pezzo rimasto) su una plancia realistica
  await page.evaluate(() => {
    const M = window.__M7, k = M.key; const bd = new Map();
    [[0,0,3],[1,0,1],[0,1,2],[-1,1,4],[-2,1,1],[2,-1,5],[3,-2,2],[-3,2,6],[0,-2,3],[1,-3,1],[-1,3,2],[2,1,4]].forEach(([q,r,v]) => bd.set(k(q,r), v));
    M.board = bd; M.tray = [null, { vals:[2,5], o:1, rot:0, pop:1 }, null]; M.select(1);
  });
  await sleep(300); await page.screenshot({ path: 'shots/g-arrows.png' });
  // scenario: fusione causata dal giro
  await page.evaluate(() => window.__M7.setTimescale(0.05));
  const sc = await page.evaluate(async () => {
    const M = window.__M7, k = M.key; const L = M.ringCells(1);
    const idx = c => L.findIndex(x => x[0]===c[0] && x[1]===c[1]);
    const pre = c => L[(idx(c) - 1 + 6) % 6];                 // ring1 gira +1: chi arriva in c partiva da L[i-1]
    const bd = new Map(); bd.set(k(0,0), 1); bd.set(k(...pre([1,0])), 1); bd.set(k(...pre([0,1])), 1);
    M.board = bd; M.tray = [{ vals:[4], o:0, rot:0, pop:1 }, null, null];
    const before = M.score;
    await M.placePiece(0, 3, -3);                              // ultimo pezzo, lontano: scatta il giro
    return { start: [pre([1,0]), pre([0,1])], board: [...M.board.entries()].map(([a,v])=>a+'='+v).join(' '), gained: M.score - before };
  });
  console.log('fusione da giro:', JSON.stringify(sc), '(atteso: tre 1 diventano un 2 + la tessera 4; punti = 5 + 2*10*3*1*2 = 125)');
  console.log('errori', JSON.stringify(errs.filter(e=>!/ERR_CERT/.test(e)))); await b.close();
})();
