// Istruzioni per bambini: compaiono da sole la prima volta, si riaprono dal menu, si leggono ad alta voce, frasi corte.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK  ' : 'KO  ') + m); };
const GAMES = ['bilancia', 'quadrante', 'primo', 'resto', 'girasette', 'raddoppio', 'sentiero', 'lampo', 'cassaforte'];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 700 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  await page.addInitScript(() => {
    localStorage.setItem('nit_name', JSON.stringify('Prova')); localStorage.setItem('nit_howto_test', '1');
    window.__said = []; window.speechSynthesis && (window.speechSynthesis.speak = u => { window.__said.push({ text: u.text, lang: u.lang, rate: u.rate }); });
  });
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html'); await sleep(400);
  const stats = [];
  for (const g of GAMES) {
    await page.click(`[data-game="${g}"]`); await sleep(400);
    const o = await page.evaluate(() => { const h = document.querySelector('.lx-howto'); if (!h) return null; const card = h.querySelector('.lx-howcard'), r = card.getBoundingClientRect(); const go = h.querySelector('.lx-howgo').getBoundingClientRect();
      return { title: h.querySelector('.lx-howtitle').textContent, steps: [...h.querySelectorAll('.lx-howsteps .lx-t')].map(x => x.textContent), intro: h.querySelector('.lx-howintro').textContent, tip: h.querySelector('.lx-howtip').textContent, say: !!h.querySelector('.lx-howsay'),
        inView: r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1, scrolls: card.scrollHeight > card.clientHeight + 1, goVisible: go.bottom <= innerHeight + 1 && go.top >= 0 && h.querySelector('.lx-howtitle').getBoundingClientRect().top >= 0, hOverflow: document.documentElement.scrollWidth > innerWidth }; });
    ok(!!o, g + ': le istruzioni compaiono da sole la prima volta');
    if (!o) continue;
    const col = await page.evaluate(() => { const x = document.querySelector('.lx-howsteps .lx-t'); return getComputedStyle(x).color; });
    ok(col === 'rgb(43, 37, 64)', g + ': testo dei passi scuro e leggibile (' + col + ')');
    const words = o.steps.concat([o.intro]).map(t => t.split(/\s+/).length);
    const longw = [...new Set(o.steps.concat([o.intro, o.tip]).join(' ').toLowerCase().replace(/[^a-zàèéìòù' ]/g, ' ').split(/\s+/).filter(w => w.length >= 11))];
    stats.push({ g, passi: o.steps.length, maxParole: Math.max(...words), parolePerFrase: +(words.reduce((a, b) => a + b, 0) / words.length).toFixed(1), parolePiuLunghe: longw });
    ok(o.title.endsWith('Come si gioca a ' + (g[0].toUpperCase() + g.slice(1))) && o.steps.length >= 4 && o.steps.length <= 6, g + ': titolo e ' + o.steps.length + ' passi');
    ok(o.goVisible && !o.hOverflow, g + ': il pulsante "Ho capito" si vede e non c\'è scorrimento orizzontale (' + (o.scrolls ? 'la scheda scorre' : 'tutta in vista') + ')');
    if (['resto', 'cassaforte', 'girasette'].includes(g)) await page.screenshot({ path: `shots/ist-${g}.png` });
    if (g === 'bilancia') {
      ok(o.say, 'pulsante "Leggi per me" presente');
      await page.click('.lx-howsay'); await sleep(100);
      const said = await page.evaluate(() => window.__said);
      ok(said.length === 1 && said[0].lang === 'it-IT' && said[0].text.includes('Come si gioca a Bilancia') && said[0].text.includes('Trucco'), 'la lettura parte in italiano: ' + JSON.stringify(said[0] && said[0].text.slice(0, 60)));
    }
    await page.click('.lx-howgo'); await sleep(150);
    ok(!(await page.evaluate(() => !!document.querySelector('.lx-howto'))), g + ': si chiude con "Ho capito! Giochiamo"');
    // si riapre dal menu
    await page.click('.lx-help'); await sleep(150);
    ok(await page.evaluate(() => !!document.querySelector('.lx-howto')), g + ': "Come si gioca" nel menu riapre le istruzioni');
    await page.keyboard.press('Escape'); await sleep(100);
    ok(!(await page.evaluate(() => !!document.querySelector('.lx-howto'))), g + ': Esc chiude');
    // uscita e secondo ingresso: non compare più da sola
    await page.evaluate(() => { const b = [...document.querySelectorAll('.btn.link')].find(x => x.offsetParent !== null); b && b.click(); }); await sleep(250);
    await page.click(`[data-game="${g}"]`); await sleep(350);
    ok(!(await page.evaluate(() => !!document.querySelector('.lx-howto'))), g + ': la seconda volta non compare da sola');
    await page.evaluate(() => { const b = [...document.querySelectorAll('.btn.link')].find(x => x.offsetParent !== null); b && b.click(); }); await sleep(250);
  }
  console.table(stats.map(s => ({ gioco: s.g, passi: s.passi, 'max parole in un passo': s.maxParole, 'media parole': s.parolePerFrase, 'parole >= 11 lettere': s.parolePiuLunghe.join(', ') })));
  // il pulsante nella schermata finale (Cassaforte, finita al volo)
  await page.click('[data-game="cassaforte"]'); await sleep(300); await page.click('#play'); await sleep(200);
  await page.evaluate(async () => { const C = window.__C; C.setTimescale(0.02); let g = 0; while (C.S.state !== 'over' && g++ < 600) { if (C.S.state === 'play' && !C.S.locked) { let c = C.allCodes(C.S.len); for (const x of C.S.guesses) c = c.filter(y => C.sameFb(C.feedback(y, x.g), x)); C.type(c[0]); C.submit(); } await new Promise(r => setTimeout(r, 12)); } });
  await sleep(500);
  ok(await page.isVisible('#over .lx-help'), 'il pulsante "Come si gioca" c\'è anche a fine partita');
  await page.click('#over .lx-help'); await sleep(200);
  ok(await page.evaluate(() => !!document.querySelector('.lx-howto')), 'e apre le istruzioni');
  await page.click('.lx-howgo');
  // uscire dal gioco ferma la voce
  await page.evaluate(() => { window.__cancel = 0; window.speechSynthesis.cancel = () => { window.__cancel++; }; });
  await page.evaluate(() => { const b = [...document.querySelectorAll('.btn.link')].find(x => x.offsetParent !== null); b && b.click(); }); await sleep(250);
  ok((await page.evaluate(() => window.__cancel)) >= 1, 'uscendo dal gioco la lettura viene fermata');
  console.log('errori:', JSON.stringify(errs)); await b.close();
  console.log(fails ? 'FALLITI: ' + fails : 'TUTTO OK');
})();
