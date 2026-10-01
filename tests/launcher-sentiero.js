// Sentiero dentro il launcher: scheda, menu, sfida del giorno, conteggio, record sulla carta, ritorno, rotta con parametri #sentiero?c=...
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  await page.addInitScript(() => localStorage.setItem('nit_name', JSON.stringify('Prova')));  // il launcher chiede il nome prima di giocare
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html'); await sleep(700);
  console.log('carte:', await page.evaluate(() => [...document.querySelectorAll('.lx-grid [data-game]')].map(b => b.dataset.game).join(',')));
  await page.screenshot({ path: 'shots/l8-phone.png', fullPage: true });
  await page.click('[data-game="sentiero"]'); await sleep(500);
  console.log('menu visibile:', await page.isVisible('#menu'), '| "Tutti i giochi":', await page.locator('#menu .btn.link').count());
  await page.click('#daily'); await sleep(300);
  console.log('menu nascosto dopo la sfida:', !(await page.isVisible('#menu')));
  await page.evaluate(() => window.__SN.setTimescale(0.05));
  for (let g = 0; g < 5; g++) { await page.evaluate(() => { const S = window.__SN, p = S.solve(S.grids[S.state.gi]).path; for (let i = 1; i < p.length; i++) S.tap(p[i][0], p[i][1]); }); await sleep(120); await page.click('#next'); await sleep(100); }
  await sleep(400);
  console.log('serie finita:', await page.isVisible('#over'), '| punteggio:', await page.textContent('#overScore'));
  await page.screenshot({ path: 'shots/l8-over.png' });
  await page.click('#again'); await sleep(300);
  console.log('altra serie libera ok:', !(await page.isVisible('#over')) && !(await page.isVisible('#menu')));
  await page.keyboard.press('Escape'); await sleep(300);
  console.log('tornato al launcher:', await page.isVisible('#lx-launcher'), '| record sulla carta:', await page.textContent('[data-game="sentiero"] [data-best]'));
  console.log('conteggio:', await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('nit_stats')).games.sentiero)));
  console.log('nessun residuo del gioco:', await page.evaluate(() => !document.getElementById('board') && !document.querySelector('.cell')));
  await page.goto('file://' + __dirname + '/../index.html#sentiero?c=SEN-abc12-400'); await sleep(700);
  console.log('rotta con parametri apre il gioco:', await page.isVisible('#menu'), '| codice precompilato:', await page.inputValue('#codeIn'));
  await page.setViewportSize({ width: 1280, height: 800 }); await page.goto('file://' + __dirname + '/../index.html'); await sleep(600);
  await page.screenshot({ path: 'shots/l8-desktop.png' });
  console.log('errori:', JSON.stringify(errs)); await b.close();
})();
