// Ogni gioco ha il pulsante "Menu principale" sempre visibile, anche durante la partita; nessuna sovrapposizione orizzontale.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 })).newPage(); const errs = [];
  await page.addInitScript(() => localStorage.setItem('nit_name', JSON.stringify('Prova')));
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + __dirname + '/../index.html'); await sleep(500);
  for (const g of ['bilancia', 'quadrante', 'primo', 'resto', 'girasette', 'raddoppio', 'sentiero']) {
    await page.click(`[data-game="${g}"]`); await sleep(350);
    const inMenu = await page.isVisible('#lx-home');
    await page.click('#play').catch(() => page.click('#daily')); await sleep(500);
    const inPlay = await page.isVisible('#lx-home');
    await page.screenshot({ path: `shots/m-${g}.png` });
    await page.click('#lx-home'); await sleep(300);
    console.log(g.padEnd(10), 'nel menu:', inMenu, '| durante la partita:', inPlay, '| torna al launcher:', await page.isVisible('#lx-launcher'), '| overflow:', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  }
  console.log('errori', JSON.stringify(errs)); await b.close();
})();
