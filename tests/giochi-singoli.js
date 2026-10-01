const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  for (const f of ['bilancia','quadrante','primo','resto','girasette']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + require('path').resolve(__dirname, '..', f + '.html')); await sleep(700);
    const menu = await page.isVisible('#menu');
    await page.click('#play'); await sleep(400);
    const afterPlay = !(await page.isVisible('#menu'));
    // qualche input
    if (f === 'bilancia') { for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowLeft'); await sleep(250); } }
    if (f === 'quadrante') { await page.click('#card0'); await sleep(300); }
    if (f === 'primo') { await page.click('#k2'); await sleep(300); }
    if (f === 'resto') { await page.click('#p100'); await sleep(300); }
    if (f === 'girasette') { await page.evaluate(() => window.__M7.placePiece(0, 0, 0)); await sleep(500); }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    const mode = await page.evaluate(() => document.compatMode);
    console.log(f.padEnd(10), 'menu:', menu, '| dopo Gioca:', afterPlay, '| overflow:', overflow, '| modalità:', mode, '| errori:', JSON.stringify(errs));
    await ctx.close();
  }
  await b.close();
})();
