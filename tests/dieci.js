// Dieci: logica pura, trascinamento del rettangolo, tempo, aiuto, fine partita, record, sfida del giorno, tastiera e integrazione nel launcher.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) bad++; };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: false });
  await ctx.addInitScript(() => { localStorage.setItem('nit_name', JSON.stringify('Prova')); });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html'); await sleep(600);

  // ---- scheda e menu
  ok(await page.locator('.lx-grid [data-game]').count() === 10, 'la home ha 10 giochi');
  ok(/Dieci giochi/.test(await page.textContent('.lx-eyebrow')), 'titolo della home: ' + await page.textContent('.lx-eyebrow'));
  await page.screenshot({ path: 'shots/die-home.png', fullPage: true });
  await page.click('[data-game="dieci"]'); await sleep(500);
  ok(await page.isVisible('#menu') && await page.isVisible('#play') && await page.isVisible('#daily'), 'menu con Gioca e Sfida del giorno');
  await page.screenshot({ path: 'shots/die-menu.png' });

  // ---- logica pura nel browser
  const L = await page.evaluate(() => {
    const D = window.__D, rnd = D.mulberry(12345);
    let sumsOk = true, digitsOk = true;
    for (let k = 0; k < 400; k++) { const g = D.makeGrid(D.mulberry(k)); if (g.length !== 100) digitsOk = false; if (g.reduce((a, b) => a + b, 0) % 10) sumsOk = false; if (g.some(v => v < 1 || v > 9)) digitsOk = false; }
    // allMoves contro la forza bruta, su griglie con buchi
    let same = true;
    for (let k = 0; k < 30; k++) {
      const g = D.makeGrid(D.mulberry(1000 + k)).map(v => (rnd() < 0.35 ? 0 : v));
      const fast = D.allMoves(g).length; let brute = 0;
      for (let r1 = 0; r1 < 10; r1++) for (let c1 = 0; c1 < 10; c1++) for (let r2 = r1; r2 < 10; r2++) for (let c2 = c1; c2 < 10; c2++) if (D.rectInfo(g, r1, c1, r2, c2).sum === 10) brute++;
      if (fast !== brute) same = false;
    }
    const t0 = performance.now(); for (let i = 0; i < 50; i++) D.allMoves(D.makeGrid(D.mulberry(i))); const ms = (performance.now() - t0) / 50;
    return { sumsOk, digitsOk, same, ms: +ms.toFixed(2), a: D.makeGrid(D.mulberry(D.hashStr('dieci-2026-10-05'))).join(''), b: D.makeGrid(D.mulberry(D.hashStr('dieci-2026-10-05'))).join('') };
  });
  ok(L.sumsOk && L.digitsOk, 'griglie: 100 cifre da 1 a 9, somma multipla di 10 (400 semi)');
  ok(L.same, 'allMoves coincide con la forza bruta (30 griglie con buchi)');
  ok(L.ms < 20, 'trovare tutte le mosse costa ' + L.ms + ' ms');
  ok(L.a === L.b, 'stesso seme = stessa griglia');

  // ---- partita: trascinamento reale col mouse
  await page.click('#play'); await sleep(300);
  await page.evaluate(() => window.__D.setTimescale(0.05));
  const cellBox = async (r, c) => { const bx = await page.locator('#grid .t').nth(r * 10 + c).boundingBox(); return { x: bx.x + bx.width / 2, y: bx.y + bx.height / 2 }; };
  const dragRect = async (r1, c1, r2, c2, release = true) => { const a = await cellBox(r1, c1), z = await cellBox(r2, c2); await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move((a.x + z.x) / 2, (a.y + z.y) / 2, { steps: 3 }); await page.mouse.move(z.x, z.y, { steps: 3 }); if (release) await page.mouse.up(); };
  const base0 = () => Array.from({ length: 10 }, () => Array(10).fill(9));
  const base = () => { const g = base0(); g[9][8] = 1; g[9][9] = 9; return g; };   // 1 e 9 in un angolo: c'e' sempre almeno una mossa, la partita non finisce da sola
  let g = base(); g[2][2] = 3; g[2][3] = 7; g[5][1] = 4; g[5][2] = 5; g[6][4] = 1;      // 3+7=10, 4+5=9, 9+1 (verticale 5,?)
  await page.evaluate(rows => window.__D.setGrid(rows), g);
  await dragRect(5, 1, 5, 2, false); await sleep(100);
  let cls = await page.getAttribute('#sel', 'class'), sum = await page.textContent('#selSum');
  ok(sum === '9' && !/ok|bad/.test(cls), 'rettangolo con somma 9: neutro, cerchietto ' + sum);
  await page.mouse.up(); await sleep(300);
  let S = await page.evaluate(() => window.__D.S);
  ok(S.score === 0 && S.grid[5 * 10 + 1] === 4, 'somma 9: non succede nulla');
  await dragRect(2, 2, 2, 3, false); await sleep(100);
  cls = await page.getAttribute('#sel', 'class'); sum = await page.textContent('#selSum');
  ok(/ok/.test(cls) && sum === '10', 'rettangolo con somma 10: verde, cerchietto ' + sum);
  await page.screenshot({ path: 'shots/die-sel.png' });
  await page.mouse.up(); await sleep(400);
  S = await page.evaluate(() => window.__D.S);
  ok(S.score === 2 && S.grid[2 * 10 + 2] === 0 && S.grid[2 * 10 + 3] === 0 && S.moves === 1, 'somma 10: due numeri tolti, punti ' + S.score);
  await dragRect(2, 2, 3, 3, false); await sleep(100);   // 0+0+9+9: sopra il 10
  ok(/bad/.test(await page.getAttribute('#sel', 'class')), 'somma oltre 10: rosso');
  await page.mouse.up(); await sleep(300);
  // i buchi contano zero: rettangolo che include il buco e fa 10 (9 + 1 con un buco in mezzo)
  g = base(); g[4][4] = 9; g[4][5] = 0; g[4][6] = 1;
  await page.evaluate(rows => window.__D.setGrid(rows), g);
  const before = (await page.evaluate(() => window.__D.S)).score;
  await dragRect(4, 4, 4, 6); await sleep(400);
  S = await page.evaluate(() => window.__D.S);
  ok(S.score - before === 2, 'un buco in mezzo vale zero: 9+_+1 = 10');
  // bonus tempo: 4 numeri insieme (1+2+3+4)
  g = base(); g[7][0] = 1; g[7][1] = 2; g[7][2] = 3; g[7][3] = 4;
  await page.evaluate(rows => { window.__D.setGrid(rows); window.__D.setTime(50); }, g);
  await dragRect(7, 0, 7, 3); await sleep(300);
  S = await page.evaluate(() => window.__D.S);
  ok(S.tLeft > 50.5 && S.tLeft < 51.5, 'togliere 4 numeri in una volta regala 1 secondo: ' + S.tLeft.toFixed(2));
  // aiuto: mostra un rettangolo valido e costa 6 secondi
  await page.evaluate(() => window.__D.setTime(60));
  const tBefore = (await page.evaluate(() => window.__D.S)).tLeft;
  await page.click('#hint'); await sleep(40);
  const hs = await page.evaluate(() => ({ cls: document.getElementById('sel').className, hid: document.getElementById('sel').hidden, t: window.__D.S.tLeft, hints: window.__D.S.hints }));
  ok(!hs.hid && /hint/.test(hs.cls) && tBefore - hs.t > 5.5 && tBefore - hs.t < 6.6 && hs.hints === 1, 'aiuto: rettangolo giallo e −6 s (' + (tBefore - hs.t).toFixed(2) + ')');
  await sleep(2500);
  ok(await page.getAttribute('#sel', 'hidden') !== null, 'il suggerimento sparisce da solo');

  // ---- fine: nessuna somma rimasta, tabellone pulito, tempo scaduto
  g = base0(); g[1][1] = 3; g[1][2] = 7;                // restano molti 9: 9+9... non fa 10; 3+7 si toglie e poi nessuna mossa
  await page.evaluate(rows => { window.__D.setGrid(rows); window.__D.setTime(60); }, g);
  await dragRect(1, 1, 1, 2); await sleep(1500);
  ok(await page.isVisible('#over') && /Nessuna somma 10/.test(await page.textContent('#overTitle')), 'senza mosse possibili la partita finisce: ' + await page.textContent('#overTitle'));
  ok(await page.textContent('#overScore') === (await page.evaluate(() => String(window.__D.S.score))), 'punteggio finale mostrato');
  await page.screenshot({ path: 'shots/die-over.png' });
  const rec = await page.evaluate(() => ({ best: JSON.parse(localStorage.getItem('dieci_best')), hist: JSON.parse(localStorage.getItem('nit_hist') || '{}').dieci }));
  ok(rec.best > 0 && rec.hist && Object.values(rec.hist)[0].n === 1, 'record salvato (' + rec.best + ') e registrato nello storico del launcher');
  ok(await page.isVisible('.lx-hook .lx-hl'), 'gancio di fine partita nel launcher: ' + (await page.textContent('.lx-hook .lx-hl')));
  await page.click('#again'); await sleep(300);
  g = Array.from({ length: 10 }, () => Array(10).fill(0)); g[0][0] = 4; g[0][1] = 6;
  await page.evaluate(rows => { window.__D.setGrid(rows); }, g);
  await dragRect(0, 0, 0, 1); await sleep(1500);
  ok(/Tabellone pulito/.test(await page.textContent('#overTitle')), 'tutto tolto: «Tabellone pulito!»');
  await page.click('#again'); await sleep(300);
  await page.evaluate(() => window.__D.setTime(0.2)); await sleep(800);
  ok(await page.isVisible('#over') && /Tempo scaduto/.test(await page.textContent('#overTitle')), 'tempo scaduto');

  // ---- sfida del giorno: stessa griglia, migliore del giorno separato dal record
  await page.click('#toMenu'); await sleep(200);
  await page.click('#daily'); await sleep(300);
  const d1 = (await page.evaluate(() => window.__D.S)).grid.join('');
  await page.click('#restart'); await sleep(200);
  const d2 = (await page.evaluate(() => window.__D.S)).grid.join('');
  ok(d1 === d2 && (await page.evaluate(() => window.__D.S.mode)) === 'daily', 'sfida del giorno: stessa griglia a ogni tentativo');
  const dm = await page.evaluate(() => window.__D.allMoves(window.__D.S.grid).length);
  ok(dm > 20, 'la griglia del giorno ha ' + dm + ' mosse possibili');

  // ---- tastiera: frecce, Spazio, Spazio
  g = base(); g[0][0] = 3; g[0][1] = 7;
  await page.evaluate(rows => window.__D.setGrid(rows), g);
  const k0 = (await page.evaluate(() => window.__D.S)).score;
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('Space'); await sleep(300);
  ok((await page.evaluate(() => window.__D.S.score)) - k0 === 2, 'tastiera: Spazio, freccia, Spazio toglie 3+7');

  // ---- uscita e rientro senza residui
  await page.keyboard.press('Escape'); await sleep(300);
  ok(await page.isVisible('#lx-launcher') && await page.locator('#grid').count() === 0, 'uscita: nessun residuo del gioco');
  ok(/^\d+$/.test(await page.textContent('[data-game="dieci"] [data-best]')) && +(await page.textContent('[data-game="dieci"] [data-best]')) > 0, 'record sulla carta in home');
  await page.setViewportSize({ width: 320, height: 560 });
  await page.click('[data-game="dieci"]'); await sleep(400); await page.click('#play'); await sleep(300);
  await page.screenshot({ path: 'shots/die-320.png' });
  const fit = await page.evaluate(() => { const bd = document.getElementById('board').getBoundingClientRect(); return { r: Math.round(bd.right), b: Math.round(bd.bottom), w: innerWidth, h: innerHeight, sx: document.documentElement.scrollWidth }; });
  ok(fit.r <= fit.w && fit.b <= fit.h && fit.sx <= fit.w, 'a 320x560 il tabellone sta nello schermo ' + JSON.stringify(fit));
  ok(errs.length === 0, 'nessun errore in pagina ' + JSON.stringify(errs));
  await b.close();
  console.log(bad ? 'FALLITI: ' + bad : 'TUTTO OK');
  process.exit(bad ? 1 : 0);
})();
