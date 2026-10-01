const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type()==='error' && errs.push(m.text()));
  await page.addInitScript(() => localStorage.setItem('nit_name', JSON.stringify('Prova')));  // il launcher chiede il nome prima di giocare
  await page.goto('file://' + __dirname + '/../index.html#girasette'); await sleep(600);
  const logic = await page.evaluate(() => {
    const M = window.__M7, out = {};
    // anelli: lunghezze, adiacenza consecutiva, copertura completa
    out.lens = [0,1,2,3].map(d => M.ringCells(d).length);
    const adj = (a,b) => { const dq=b[0]-a[0], dr=b[1]-a[1]; return [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]].some(d=>d[0]===dq&&d[1]===dr); };
    out.adjacent = [1,2,3].every(d => { const L = M.ringCells(d); return L.every((c,i)=>adj(c,L[(i+1)%L.length])); });
    out.allInRing = [1,2,3].every(d => M.ringCells(d).every(c => M.ringOf(c[0],c[1])===d));
    // plancia piena: il giro è una permutazione (stesso multiset, nessuna sovrapposizione)
    const full = new Map(M.CELLS.map(([q,r],i)=>[M.key(q,r), (i%6)+1]));
    const mv = M.rotationMap(full);
    const dests = new Set(mv.map(m=>M.key(m.to[0],m.to[1])));
    out.permutation = mv.length===36 && dests.size===36;
    out.centerFixed = !mv.some(m=>m.from[0]===0&&m.from[1]===0);
    // versi opposti tra anelli 1 e 2
    const m1 = mv.find(m=>M.ringOf(m.from[0],m.from[1])===1), m2 = mv.find(m=>M.ringOf(m.from[0],m.from[1])===2);
    out.sample = { ring1: JSON.stringify([m1.from,m1.to]), ring2: JSON.stringify([m2.from,m2.to]) };
    // regressione: le fusioni normali non sono cambiate e mult raddoppia i punti
    const B = a => new Map(a.map(([q,r,v]) => [M.key(q,r), v]));
    let r1 = M.resolve(B([[0,0,1],[1,0,1],[2,0,1]]), [[1,0]]); let r2 = M.resolve(B([[0,0,1],[1,0,1],[2,0,1]]), [[1,0]], 2);
    out.mult = [r1.total, r2.total];
    return out;
  });
  console.log(JSON.stringify(logic, null, 1));

  // Scenario: 2 tessere "1" in cui il giro ne porta una accanto alla terza -> fusione da giro (x2)
  await page.evaluate(() => window.__M7.setTimescale(0.05));
  const sc = await page.evaluate(async () => {
    const M = window.__M7, k = M.key;
    // anello 3 (antiorario +1): (-3,3)->(-2,3). Preparo 1 in (-3,3), 1 in (-1,3)... cella (-2,3) vuota, (-1,3)? verifica adiacenze: dopo il giro un 1 arriva in (-2,3) accanto a (-1,3)=1 e (-2,2)=1 ?
    const bd = new Map(); bd.set(k(-3,3),1); bd.set(k(-1,3),1); bd.set(k(-2,2),1);   // (-2,3) è adiacente a (-1,3) e (-2,2)
    // tessera in anello 2/3 verrà ruotata anch'essa: controllo calcolando a mano con la mappa
    M.board = bd; M.tray = [{ vals:[4], o:0, rot:0, pop:1 }, null, null];
    const before = M.score;
    await M.placePiece(0, 0, 0);               // ultimo pezzo -> giro
    return { board: [...M.board.entries()].map(([a,v])=>a+'='+v).join(' '), gained: M.score - before, over: M.over };
  });
  console.log('scenario giro:', JSON.stringify(sc));
  await page.screenshot({ path: 'shots/g-after-rot.png' });
  console.log('errori', JSON.stringify(errs)); await b.close();
})();
