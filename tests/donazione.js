// Pulsante "Dona": visibile nella home e a fine partita, link sicuro, niente scorrimento orizzontale.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK  ' : 'KO  ') + m); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 700 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  await page.addInitScript(() => localStorage.setItem('nit_name', JSON.stringify('Prova')));
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html'); await sleep(400);
  ok(await page.isVisible('.lx-donate'), 'il riquadro "Dona" è visibile nella home');
  const a = await page.evaluate(() => { const e = document.getElementById('lx-pay'); return { href: e.getAttribute('href'), target: e.target, rel: e.rel, text: e.textContent, off: e.classList.contains('off') }; });
  ok(/^https:\/\/www\.paypal\.com\/donate\/\?hosted_button_id=[A-Z0-9]{6,20}$/i.test(a.href) && a.target === '_blank' && /noopener/.test(a.rel) && !a.off, 'link PayPal valido, si apre in una scheda nuova e sicura: ' + a.href);
  ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'home senza scorrimento orizzontale');
  await page.locator('.lx-donate').scrollIntoViewIfNeeded(); await sleep(200);
  await page.screenshot({ path: 'shots/dona-home.png' });
  // a fine partita (Cassaforte finita al volo)
  await page.click('[data-game="cassaforte"]'); await sleep(300); await page.click('#play'); await sleep(200);
  await page.evaluate(async () => { const C = window.__C; C.setTimescale(0.02); let g = 0; while (C.S.state !== 'over' && g++ < 600) { if (C.S.state === 'play' && !C.S.locked) { let c = C.allCodes(C.S.len); for (const x of C.S.guesses) c = c.filter(y => C.sameFb(C.feedback(y, x.g), x)); C.type(c[0]); C.submit(); } await new Promise(r => setTimeout(r, 12)); } });
  await sleep(500);
  const g = await page.evaluate(() => { const l = document.querySelector('#over .lx-give a'); return l && { href: l.href, target: l.target, rel: l.rel, text: document.querySelector('#over .lx-give').textContent }; });
  ok(g && /paypal\.com\/donate/.test(g.href) && g.target === '_blank' && /noopener/.test(g.rel), 'a fine partita compare il link per il contributo: ' + (g && g.text));
  ok(g && /^Un adulto può/.test(g.text), 'il testo si rivolge a un adulto');
  await page.screenshot({ path: 'shots/dona-over.png' });
  console.log('errori:', JSON.stringify(errs)); await b.close();
  console.log(fails ? 'FALLITI: ' + fails : 'TUTTO OK');
})();
