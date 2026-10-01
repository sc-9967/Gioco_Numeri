// Record salvati: storico per gioco e per giorno, periodi (oggi, settimana, anno, sempre), riepiloghi non contati due volte, backup e ripristino, protezione dell'archiviazione.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.addInitScript(() => { if (!localStorage.getItem('nit_name')) localStorage.setItem('nit_name', JSON.stringify('Rita')); });
  const url = 'file://' + __dirname + '/../index.html';
  await page.goto(url); await sleep(600);
  // 1) partite vere: Sentiero (sfida del giorno + riepilogo + libera) e Raddoppio
  await page.click('[data-game="sentiero"]'); await sleep(300);
  await page.evaluate(() => window.__SN.setTimescale(0.05));
  await page.click('#daily'); await sleep(200);
  const playSeries = async () => { for (let g = 0; g < 5; g++) { await page.evaluate(() => { const S = window.__SN, p = S.solve(S.grids[S.state.gi]).path; for (let i = 1; i < p.length; i++) S.tap(p[i][0], p[i][1]); }); await sleep(100); await page.click('#next'); await sleep(80); } await sleep(350); };
  await playSeries();
  await page.click('#toMenu'); await page.click('#daily'); await sleep(300);   // riepilogo: non deve contare di nuovo
  const afterSummary = await page.evaluate(() => JSON.parse(localStorage.getItem('nit_hist')).sentiero);
  console.log('Sentiero registrato una volta (riepilogo non conta):', JSON.stringify(afterSummary));
  await page.click('#again'); await sleep(200); await playSeries();
  await page.keyboard.press('Escape'); await sleep(300);
  await page.click('[data-game="raddoppio"]'); await sleep(300);
  await page.evaluate(async () => { const R = window.__R, w = ms => new Promise(r => setTimeout(r, ms)); R.setTimescale(0.03); R.start('free'); await w(30);
    for (let i = 0; i < 4000 && R.S.running; i++) { while (R.S.busy) await w(3); R.move(['left', 'down', 'right', 'up'][i % 4]); await w(8); if (R.S.hammers > 0 && !R.canMove()) R.useHammerAt(0, 0); } });
  await sleep(900);
  await page.keyboard.press('Escape'); await sleep(300);
  const h = await page.evaluate(() => JSON.parse(localStorage.getItem('nit_hist')));
  console.log('storico:', JSON.stringify(h));
  // 2) pannello
  await page.click('#lx-recbtn'); await sleep(300);
  console.log('righe:', (await page.textContent('#lx-recrows')).replace(/\s+/g, ' ').trim());
  console.log('nota:', (await page.textContent('#lx-recnote')).trim());
  await page.screenshot({ path: 'shots/r-panel.png' });
  // 3) backup e ripristino in un contesto nuovo (altro dispositivo)
  const code = await page.evaluate(async () => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('no')) }, configurable: true }); document.getElementById('lx-recbackup').click(); await new Promise(r => setTimeout(r, 200)); return document.getElementById('lx-recbox').value; });
  console.log('backup prodotto:', code.startsWith('NIT1.'), '| lunghezza', code.length);
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } }); const p2 = await ctx2.newPage();
  await p2.goto(url); await sleep(500);
  await p2.click('#lx-recbtn'); await sleep(200);
  console.log('dispositivo nuovo: record vuoti:', (await p2.textContent('#lx-recrows')).replace(/[^—]/g, '').length >= 20);
  await p2.fill('#lx-recbox', 'testo prima ' + code + ' testo dopo'); await p2.click('#lx-recrestore'); await sleep(400);
  console.log('ripristino:', await p2.textContent('#lx-recmsg'));
  console.log('righe dopo ripristino:', (await p2.textContent('#lx-recrows')).replace(/\s+/g, ' ').trim());
  console.log('nome ripristinato (era vuoto):', await p2.evaluate(() => localStorage.getItem('nit_name')), '| record sulla carta Sentiero:', await p2.evaluate(() => (document.querySelector('[data-best="sent_best"]')||{}).textContent));
  // 4) il ripristino non abbassa i record
  await p2.evaluate(() => { const h = JSON.parse(localStorage.getItem('nit_hist')); h.sentiero[Object.keys(h.sentiero)[0]].b = 9999; localStorage.setItem('nit_hist', JSON.stringify(h)); });
  await p2.fill('#lx-recbox', code); await p2.click('#lx-recrestore'); await sleep(300);
  console.log('record piu\' alto mantenuto:', await p2.evaluate(() => { const h = JSON.parse(localStorage.getItem('nit_hist')); return Object.values(h.sentiero).some(r => r.b === 9999); }));
  // 5) backup invalidi
  for (const bad of ['NIT1.@@@', 'NIT1.' + Buffer.from('{"v":2}').toString('base64'), 'ciao']) { await p2.fill('#lx-recbox', bad); await p2.click('#lx-recrestore'); console.log('backup non valido ->', await p2.textContent('#lx-recmsg')); }
  // 6) valori truccati nel backup vengono scartati
  const evil = 'NIT1.' + Buffer.from(JSON.stringify({ v: 1, hist: { bilancia: { '2026-10-01': { b: 1e12, n: 1, s: 1 } }, 'x<y>': { '2026-10-01': { b: 5, n: 1, s: 5 } } }, best: { bil_best: -5 }, sent: { '2026-10-01': { t: 9999 } } })).toString('base64');
  await p2.fill('#lx-recbox', evil); await p2.click('#lx-recrestore'); await sleep(200);
  console.log('valori assurdi scartati:', await p2.evaluate(() => { const h = JSON.parse(localStorage.getItem('nit_hist')); return !h.bilancia && !h['x<y>']; }));
  // 7) Escape chiude il pannello senza uscire
  await p2.keyboard.press('Escape'); console.log('Escape chiude il pannello:', !(await p2.isVisible('#lx-recpanel')));
  // 8) archiviazione non disponibile: avviso
  const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 } }); const p3 = await ctx3.newPage();
  await p3.addInitScript(() => { Storage.prototype.setItem = function () { throw new Error('QuotaExceeded'); }; });
  await p3.goto(url); await sleep(500);
  console.log('avviso archiviazione bloccata:', await p3.isVisible('#lx-storewarn'));
  await page.setViewportSize({ width: 1280, height: 800 }); await page.reload(); await sleep(400);
  console.log('errori:', JSON.stringify(errs)); await b.close();
})();
