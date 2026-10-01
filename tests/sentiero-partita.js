// Sentiero: partita completa con tocchi reali, indietro/da capo/tastiera, una sola sfida al giorno, record, condivisione, codice sfida, ricarica, schermi.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FILE = 'file://' + __dirname + '/../index.html#sentiero';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type()==='error' && !/ERR_CERT|Failed to load/.test(m.text()) && errs.push(m.text()));
  await page.goto(FILE); await sleep(500);
  await page.evaluate(() => window.__SN.setTimescale(0.05));
  // tocchi reali: serie giornaliera giocata col percorso ottimo
  await page.click('#daily'); await sleep(200);
  const cell = (r, c) => page.click(`.cell[data-r="${r}"][data-c="${c}"]`);
  const optPath = () => page.evaluate(() => { const S = window.__SN; return S.solve(S.grids[S.state.gi]).path; });
  let first = true;
  for (let g = 0; g < 5; g++) {
    const p = await optPath();
    for (let i = 1; i < p.length; i++) { await cell(p[i][0], p[i][1]); if (first && i === 3) { await page.screenshot({ path: 'shots/sn-play.png' }); first = false; } }
    await sleep(150);
    if (g === 0) await page.screenshot({ path: 'shots/sn-sheet.png' });
    console.log('griglia', g + 1, 'pct:', await page.textContent('#pct'), '| foglio visibile:', await page.isVisible('#sheet'));
    await page.click('#next'); await sleep(150);
  }
  await sleep(300);
  console.log('totale:', await page.textContent('#overScore'), '| titolo:', await page.textContent('#overTitle'), '| record nuovo:', await page.isVisible('#newRecord'));
  await page.screenshot({ path: 'shots/sn-over.png' });
  console.log('share:', JSON.stringify(await page.evaluate(async () => { document.getElementById('share').click(); await new Promise(r => setTimeout(r, 200)); const b = document.getElementById('shareBox'); return b.hidden ? document.getElementById('share').textContent : b.value; })));
  // seconda sfida del giorno: nessun nuovo tentativo
  await page.click('#toMenu'); await sleep(100);
  console.log('menu:', await page.textContent('#daily'), '|', await page.textContent('#menuInfo'));
  await page.click('#daily'); await sleep(300);
  console.log('riepilogo mostrato (nessun nuovo tentativo):', await page.isVisible('#over'), await page.textContent('#overScore'), '| running:', await page.evaluate(() => window.__SN.state.running));
  // record
  await page.click('#recBtn2'); await sleep(150); await page.screenshot({ path: 'shots/sn-rec.png' });
  console.log('record:', (await page.textContent('#recRows')).replace(/\s+/g, ' '));
  await page.click('#recClose');
  // allenamento: indietro, da capo, tastiera, mossa non valida
  await page.click('#again'); await sleep(200);
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
  let st = await page.evaluate(() => window.__SN.state.path.length); await page.keyboard.press('Backspace'); await page.keyboard.press('ArrowLeft');
  const st2 = await page.evaluate(() => window.__SN.state.path.length);
  await cell(3, 3); // non adiacente
  const st3 = await page.evaluate(() => window.__SN.state.path.length);
  await page.click('#reset'); const st4 = await page.evaluate(() => window.__SN.state.path.length);
  console.log('percorso: dopo 3 passi', st, '| dopo 2 indietro', st2, '| mossa non valida', st3, '| da capo', st4);
  // serie libera con percorsi casuali -> codice sfida -> sfida
  for (let g = 0; g < 5; g++) { await page.evaluate(() => { const S = window.__SN, ps = S.allPaths(), p = ps[Math.floor(Math.random() * ps.length)]; if (S.state.path.length > 1) S.back(); }); await page.click('#reset').catch(() => {});
    await page.evaluate(() => { const S = window.__SN, ps = S.allPaths(), p = ps[Math.floor(Math.random() * ps.length)]; for (let i = 1; i < p.length; i++) S.tap(p[i][0], p[i][1]); }); await sleep(100); await page.click('#next'); await sleep(100); }
  await sleep(300);
  const free = await page.textContent('#overScore'); console.log('serie libera casuale:', free, '/500');
  await page.click('#share'); await sleep(200);
  const txt = await page.evaluate(() => document.getElementById('shareBox').hidden ? '(clipboard)' : document.getElementById('shareBox').value);
  console.log('testo condivisione libera:', JSON.stringify(txt));
  const code = await page.evaluate(() => { const S = window.__SN; return S.encodeCode(S.state.seed36, 400); });
  await page.click('#toMenu'); await page.fill('#codeIn', 'guarda ' + code + ' ok'); await page.click('#codeGo'); await sleep(200);
  const same = await page.evaluate(() => JSON.stringify(window.__SN.grids[0]) === JSON.stringify(window.__SN.gridsFor('x' + window.__SN.state.seed36)[0]));
  console.log('sfida avviata:', await page.evaluate(() => window.__SN.state.mode), '| stessa griglia del codice:', same);
  for (let g = 0; g < 5; g++) { await page.evaluate(() => { const S = window.__SN, p = S.solve(S.grids[S.state.gi]).path; for (let i = 1; i < p.length; i++) S.tap(p[i][0], p[i][1]); }); await sleep(100); await page.click('#next'); await sleep(100); }
  await sleep(300); console.log('confronto:', await page.textContent('#cmp'));
  await page.click('#toMenu'); await page.fill('#codeIn', 'sbagliato'); await page.click('#codeGo'); console.log('errore codice:', await page.textContent('#codeErr'));
  // persistenza dopo ricarica
  await page.reload(); await sleep(500);
  console.log('dopo ricarica:', await page.textContent('#menuInfo'));
  for (const [w, h, n] of [[360, 640, 's'], [844, 390, 'l'], [1280, 800, 'd']]) { await page.setViewportSize({ width: w, height: h }); await page.evaluate(() => window.__SN.start('free')); await sleep(300); await page.screenshot({ path: 'shots/sn-' + n + '.png' }); console.log(n, 'overflow:', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)); }
  console.log('errori', JSON.stringify(errs)); await b.close();
})();
