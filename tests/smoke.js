// Smoke test di Numeri in Tasca: ogni gioco dal launcher, input simulati fino al game over.
const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../index.html');
const OUT = path.resolve(__dirname, 'shots');
require('fs').mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CAP = +(process.env.CAP || 120000);

const bots = {
  async bilancia(page) { await page.keyboard.press(Math.random() < .5 ? 'ArrowLeft' : 'ArrowRight'); await sleep(350); },
  async quadrante(page) {
    const cards = page.locator('#cards .card-btn'); const n = await cards.count();
    if (n) await cards.nth(Math.floor(Math.random() * n)).click({ timeout: 1000 }).catch(() => {});
    await sleep(600);
  },
  async primo(page) {
    const keys = page.locator('#primes .key, #isPrime'); const n = await keys.count();
    if (n) await keys.nth(Math.floor(Math.random() * n)).click({ timeout: 1000 }).catch(() => {});
    await sleep(500);
  },
  async resto(page) {
    // cassiere perfetto: legge scontrino, calcola il resto, lo dà in modo greedy
    const parse = s => { const m = s.replace('€', '').trim().split('+').map(x => Math.round(parseFloat(x.trim().replace(',', '.')) * 100)); return m.reduce((a, b) => a + b, 0); };
    const total = parse(await page.textContent('#rTotal')), paid = parse(await page.textContent('#rPaid'));
    let ch = paid - total;
    for (const v of [2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1]) while (ch >= v) { await page.click('#p' + v, { timeout: 1000 }).catch(() => {}); ch -= v; await sleep(120); }
    await sleep(1500);
  },
};

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const vp of [{ width: 390, height: 844, tag: 'phone' }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.addInitScript(() => localStorage.setItem('nit_name', JSON.stringify('Prova')));  // il launcher chiede il nome prima di giocare
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.goto(FILE, { waitUntil: 'load', timeout: 20000 }).catch(e => errs.push('goto ' + e.message));
    await sleep(800);
    await page.screenshot({ path: `${OUT}/${vp.tag}-launcher.png` });
    for (const g of (process.env.GAMES || 'bilancia,quadrante,primo,resto').split(',')) {
      const r = { game: g, errors: [] }; const e0 = errs.length;
      await page.click(`[data-game="${g}"]`);
      await sleep(500);
      await page.screenshot({ path: `${OUT}/${vp.tag}-${g}-menu.png` });
      r.hOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      await page.click('#play');
      const t0 = Date.now(); let shot = false, moves = 0;
      while (Date.now() - t0 < CAP) {
        if (await page.isVisible('#over')) break;
        await bots[g](page); moves++;
        if (!shot && Date.now() - t0 > 8000) { await page.screenshot({ path: `${OUT}/${vp.tag}-${g}-play.png` }); shot = true; }
      }
      r.secs = Math.round((Date.now() - t0) / 1000); r.moves = moves;
      r.over = await page.isVisible('#over');
      await sleep(600);
      r.score = r.over ? await page.textContent('#overScore') : await page.textContent('#score');
      await page.screenshot({ path: `${OUT}/${vp.tag}-${g}-over.png` });
      if (r.over) {
        await page.click('#again'); await sleep(700);
        r.replayOk = !(await page.isVisible('#over')) && !(await page.isVisible('#menu'));
        await page.evaluate(() => location.hash = ''); // torna al launcher
        await sleep(300);
      }
      // uscita pulita dal gioco
      await page.keyboard.press('Escape'); await sleep(400);
      r.backToLauncher = await page.isVisible('#lx-launcher');
      r.launcherRecord = await page.textContent(`[data-game="${g}"] [data-best]`);
      r.errors = errs.slice(e0);
      results.push(r); console.log(JSON.stringify(r));
    }
    console.log('STATS', await page.evaluate(()=>localStorage.getItem('nit_stats')));
    console.log('ORDER', await page.evaluate(()=>[...document.querySelectorAll('.lx-grid [data-game]')].map(b=>b.dataset.game).join(',')));
    await page.screenshot({ path: `${OUT}/${vp.tag}-launcher2.png`, fullPage: true });
    await ctx.close();
  }
  await browser.close();
})();
