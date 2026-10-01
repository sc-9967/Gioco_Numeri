// Raddoppio dentro il launcher: scheda, menu, partita, game over, record, ritorno, rotta #raddoppio, statistiche.
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
  await page.screenshot({ path: 'shots/l6-phone.png', fullPage: true });
  await page.click('[data-game="raddoppio"]'); await sleep(500);
  console.log('menu visibile:', await page.isVisible('#menu'), '| "Tutti i giochi":', await page.locator('#menu .btn.link').count());
  await page.click('#play'); await sleep(300);
  console.log('menu nascosto dopo Gioca:', !(await page.isVisible('#menu')));
  await page.evaluate(() => window.__R.setTimescale(0.03));
  let moves = 0;
  while (moves < 4000 && !(await page.isVisible('#over'))) {
    const d = await page.evaluate(async () => { const R = window.__R; if (R.S.busy) return 0; const dirs = ['left', 'down', 'right', 'up']; R.move(dirs[Math.floor(Math.random() * 4)]); if (R.S.hammers > 0 && !R.canMove()) R.useHammerAt(0, 0); return 1; });
    moves += d; await sleep(12);
  }
  await sleep(600);
  console.log('partita finita:', await page.isVisible('#over'), '| punteggio:', await page.textContent('#overScore'));
  await page.screenshot({ path: 'shots/l6-over.png' });
  const score = await page.textContent('#overScore');
  await page.click('#again'); await sleep(300);
  console.log('rigioca ok:', !(await page.isVisible('#over')) && !(await page.isVisible('#menu')));
  await page.keyboard.press('Escape'); await sleep(300);
  console.log('tornato al launcher:', await page.isVisible('#lx-launcher'), '| record sulla carta:', await page.textContent('[data-game="raddoppio"] [data-best]'), '| finale:', score);
  console.log('conteggio:', await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('nit_stats')).games.raddoppio)));
  console.log('stili del gioco rimossi (nessun .tile):', await page.evaluate(() => !document.querySelector('.tile') && !document.getElementById('board')));
  await page.screenshot({ path: 'shots/l6-launcher-after.png', fullPage: true });
  await page.goto('file://' + __dirname + '/../index.html#raddoppio'); await sleep(600);
  console.log('hash #raddoppio apre il gioco:', await page.isVisible('#menu'));
  await page.setViewportSize({ width: 1280, height: 800 }); await page.goto('file://' + __dirname + '/../index.html'); await sleep(600);
  await page.screenshot({ path: 'shots/l6-desktop.png' });
  console.log('errori:', JSON.stringify(errs)); await b.close();
})();
