const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html'); await sleep(700);
  console.log('carte:', await page.evaluate(() => [...document.querySelectorAll('.lx-grid [data-game]')].map(b => b.dataset.game).join(',')));
  console.log('ultima carta a tutta riga:', await page.evaluate(() => { const g = document.querySelector('.lx-grid'); const l = g.lastElementChild; return Math.round(l.getBoundingClientRect().width) > g.getBoundingClientRect().width * 0.9 || g.children.length % 2 === 0; }));
  await page.screenshot({ path: 'shots/l5-phone.png', fullPage: true });
  await page.click('[data-game="girasette"]'); await sleep(600);
  console.log('menu visibile:', await page.isVisible('#menu'), '| bottone "Tutti i giochi" nel menu:', await page.locator('#menu .btn.link').count());
  await page.screenshot({ path: 'shots/l5-menu.png' });
  await page.click('#play'); await sleep(300);
  console.log('menu nascosto dopo Gioca:', !(await page.isVisible('#menu')));
  await page.evaluate(() => window.__M7.setTimescale(0.03));
  let moves = 0;
  while (moves < 1500) {
    if (await page.isVisible('#over')) break;
    const st = await page.evaluate(() => window.__M7.busy);
    if (st) { await sleep(8); continue; }
    const did = await page.evaluate(() => { const M = window.__M7; for (let i = 0; i < 3; i++) { const p = M.tray[i]; if (!p) continue; const rots = p.vals.length === 2 ? 6 : 1; for (let o = 0; o < rots; o++) for (const [q, r] of M.CELLS) { if (M.canPlaceAt(M.board, { vals: p.vals, o }, q, r)) { p.o = o; M.placePiece(i, q, r); return true; } } } return false; });
    if (did) moves++; else await sleep(10);
  }
  await sleep(400);
  console.log('mosse giocate:', moves, '| game over visibile:', await page.isVisible('#over'));
  await page.screenshot({ path: 'shots/l5-over.png' });
  const score = await page.textContent('#overScore');
  await page.click('#again'); await sleep(300);
  console.log('rigioca ok (over nascosto):', !(await page.isVisible('#over')));
  await page.keyboard.press('Escape'); await sleep(300);
  console.log('tornato al launcher:', await page.isVisible('#lx-launcher'), '| record sulla carta:', await page.textContent('[data-game="girasette"] [data-best]'), '| punteggio finale:', score);
  console.log('conteggio girasette:', await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('nit_stats')).games.girasette)));
  // route #girasette diretta
  await page.goto('file://' + __dirname + '/../index.html#girasette'); await sleep(600);
  console.log('hash #girasette apre il gioco:', await page.isVisible('#menu'));
  // desktop largo
  await page.setViewportSize({ width: 1280, height: 800 }); await page.goto('file://' + __dirname + '/../index.html'); await sleep(600);
  await page.screenshot({ path: 'shots/l5-desktop.png' });
  console.log('errori:', JSON.stringify(errs)); await b.close();
})();
