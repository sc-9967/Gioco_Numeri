// Sentiero: il percorso di chi gioca e' rosa tenue (anelli e numeri d'ordine, senza linee), visibile su ogni colore di casella, a 390x844 e 320x560.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK  ' : 'KO  ') + m); };
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 390, height: 844 }, { width: 320, height: 560 }]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage(); const errs = [];
    await page.addInitScript(() => { localStorage.setItem('nit_name', JSON.stringify('Prova')); localStorage.setItem('nit_howto_sentiero', '1'); });
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load/.test(m.text()) && errs.push(m.text()));
    await page.goto('file://' + __dirname + '/../index.html#sentiero'); await sleep(500);
    const tag = vp.width + 'x' + vp.height; console.log('--- ' + tag);
    await page.evaluate(() => window.__SN.setTimescale(0.05));
    await page.click('#play'); await sleep(200);
    const cell = (r, c) => page.click(`.cell[data-r="${r}"][data-c="${c}"]`);
    const info = () => page.evaluate(() => {
      const cs = [...document.querySelectorAll('.cell')], on = cs.filter(c => c.classList.contains('on') || c.classList.contains('cur'));
      return { svg: document.querySelectorAll('.trail, #board svg').length, ringed: on.length, ring: on[0] && getComputedStyle(on[0]).boxShadow, badges: cs.filter(c => c.dataset.s).map(c => c.dataset.s).join(','),
        badgeBg: (() => { const c = cs.find(x => x.dataset.s); return c && getComputedStyle(c, '::before').backgroundColor; })() };
    });
    let i0 = await info();
    ok(i0.ringed === 1 && i0.svg === 0, 'inizio: solo la casella di partenza segnata, nessuna linea');
    // percorso: destra, destra, giu, giu, destra
    const moves = [[0, 1], [0, 2], [1, 2], [2, 2], [2, 3]];
    for (const [r, c] of moves) await cell(r, c);
    await sleep(200);
    const i1 = await info();
    ok(i1.svg === 0, 'nessuna linea disegnata sopra la griglia');
    ok(i1.ringed === 6 && /233, 138, 171/.test(i1.ring), 'anello rosa tenue sulle 6 caselle del percorso: ' + i1.ring);
    ok(/233, 138, 171/.test(i1.badgeBg), 'numeri d\'ordine su fondo rosa tenue: ' + i1.badgeBg);
    ok(i1.badges === '1,2,3,4,5', 'numeri d\'ordine 1-5 sulle caselle: ' + i1.badges);
    await page.screenshot({ path: `shots/sp-${tag}-meta.png` });
    // indietro: sparisce l'ultimo tratto
    await page.click('#back'); await sleep(100);
    const i2 = await info();
    ok(i2.ringed === 5 && i2.badges === '1,2,3,4', 'Indietro toglie l\'ultima casella e il numero');
    await cell(0, 1); await sleep(100);   // torna alla casella 1
    const i3 = await info();
    ok(i3.ringed === 2 && i3.badges === '1', 'toccare una casella già percorsa riporta lì il percorso rosa');
    // fine griglia: percorso rosa e percorso ottimo blu insieme
    const p = await page.evaluate(() => { const S = window.__SN; return S.solve(S.grids[S.state.gi]).path; });
    await page.click('#reset'); await sleep(100);
    for (let i = 1; i < p.length; i++) await cell(p[i][0], p[i][1]);
    await sleep(300);
    const i4 = await info();
    ok(i4.badges.split(',').length === 8, 'percorso completo: 8 caselle numerate');
    ok(await page.isVisible('#sheet') && (await page.textContent('#msg')).includes('In rosa il tuo percorso, in blu il percorso ottimo'), 'il foglio finale spiega i colori');
    const both = await page.evaluate(() => { const c = [...document.querySelectorAll('.cell.opt.on, .cell.opt.cur')][0]; return c && getComputedStyle(c).boxShadow; });
    ok(both && /233, 138, 171/.test(both) && /43, 111, 214/.test(both), 'dove il percorso coincide con l\'ottimo si vedono entrambi gli anelli (rosa fuori, blu dentro)');
    await page.screenshot({ path: `shots/sp-${tag}-fine.png` });
    // nuova griglia: il disegno riparte pulito
    await page.click('#next'); await sleep(200);
    const i5 = await info();
    ok(i5.ringed === 1 && i5.badges === '', 'nuova griglia: nessun segno del percorso precedente');
    ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'nessuno scorrimento orizzontale');
    console.log('errori:', JSON.stringify(errs)); await ctx.close();
  }
  console.log(fails ? 'FALLITI: ' + fails : 'TUTTO OK'); await b.close();
})();
