// "← Tutti i giochi": bordo blu elettrico in partita, nel menu e nella schermata finale, in tutti i giochi, a 360x700.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK  ' : 'KO  ') + m); };
const GAMES = ['bilancia', 'quadrante', 'primo', 'resto', 'girasette', 'raddoppio', 'sentiero', 'lampo', 'cassaforte'];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 700 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  await page.addInitScript(() => localStorage.setItem('nit_name', JSON.stringify('Prova')));
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html'); await sleep(400);
  const blue = el => page.evaluate(sel => { const e = [...document.querySelectorAll(sel)].find(x => x.offsetParent !== null); if (!e) return null; const c = getComputedStyle(e), r = e.getBoundingClientRect(); return { w: c.borderTopWidth, style: c.borderTopStyle, color: c.borderTopColor, vis: r.width > 0 && r.bottom <= innerHeight + 1 && r.top >= 0 && r.right <= innerWidth + 1, text: e.textContent }; }, el);
  const isBlue = o => o && o.w === '2px' && o.style === 'solid' && o.color === 'rgb(30, 107, 255)';
  for (const g of GAMES) {
    await page.click(`[data-game="${g}"]`); await sleep(450);
    const m = await blue('#menu .lx-back'); ok(isBlue(m) && m.vis, g + ': menu, bordo blu elettrico e dentro lo schermo senza scorrere');
    const top = await page.evaluate(() => { const b = document.querySelector('#menu .lx-back'), c = document.querySelector('#menu').firstElementChild; return b.getBoundingClientRect().top - c.getBoundingClientRect().top < 40 && c.scrollTop === 0; });
    ok(top, g + ': il pulsante sta in cima alla scheda del menu');
    await page.click('#play').catch(() => page.click('#daily')); await sleep(600);
    const l = await blue('.lx-leave'); ok(isBlue(l) && l.vis && /Tutti i giochi/.test(l.text), g + ': in partita, bordo blu elettrico e dentro lo schermo');
    if (['cassaforte', 'resto', 'girasette'].includes(g)) await page.screenshot({ path: `shots/blu-${g}.png` });
    ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), g + ': nessuno scorrimento orizzontale');
    // conferma: due tocchi
    await page.click('.lx-leave'); await sleep(120);
    const ask = await page.evaluate(() => { const e = document.querySelector('.lx-leave'); return { t: e.textContent, c: getComputedStyle(e).borderTopColor }; });
    ok(/Sicuro/.test(ask.t), g + ': il primo tocco chiede conferma (' + ask.c + ')');
    await page.click('.lx-leave'); await sleep(300);
    ok(await page.isVisible('#lx-launcher'), g + ': il secondo tocco torna ai giochi');
  }
  // schermata finale (Cassaforte finita al volo)
  await page.click('[data-game="cassaforte"]'); await sleep(300); await page.click('#play'); await sleep(200);
  await page.evaluate(async () => { const C = window.__C; C.setTimescale(0.02); let g = 0; while (C.S.state !== 'over' && g++ < 600) { if (C.S.state === 'play' && !C.S.locked) { let c = C.allCodes(C.S.len); for (const x of C.S.guesses) c = c.filter(y => C.sameFb(C.feedback(y, x.g), x)); C.type(c[0]); C.submit(); } await new Promise(r => setTimeout(r, 12)); } });
  await sleep(500);
  const o = await blue('#over .lx-back'); ok(isBlue(o) && o.vis, 'schermata finale: bordo blu elettrico e visibile');
  await page.screenshot({ path: 'shots/blu-over.png' });
  console.log('errori:', JSON.stringify(errs)); await b.close();
  console.log(fails ? 'FALLITI: ' + fails : 'TUTTO OK');
})();
