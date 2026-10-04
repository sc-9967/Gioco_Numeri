// Pulsante «Record» dentro ogni gioco: tabella con migliore, media e partite per oggi, settimana, mese, anno, sempre.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) bad++; };
const GAMES = ['bilancia', 'quadrante', 'primo', 'resto', 'girasette', 'raddoppio', 'sentiero', 'lampo', 'cassaforte', 'dieci'];
const BEST = { bilancia: 'bil_best', quadrante: 'quad_best', primo: 'primo_best', resto: 'resto_best', girasette: 'girasette_best', raddoppio: 'rad_best', sentiero: 'sent_best', lampo: 'lampo_best', cassaforte: 'cass_best', dieci: 'dieci_best' };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true });
  const rome = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const today = rome(new Date()), old = '2020-03-04';
  // storico: oggi 2 partite (migliore 300, somma 500); una partita molto vecchia da 900 (solo "sempre")
  const hist = {}; GAMES.forEach(g => { hist[g] = { [today]: { b: 300, n: 2, s: 500 }, [old]: { b: 900, n: 1, s: 900 } }; });
  await ctx.addInitScript(([h, best]) => { localStorage.setItem('nit_name', JSON.stringify('Prova')); localStorage.setItem('nit_hist', JSON.stringify(h)); }, [hist, BEST]);
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html'); await sleep(600);
  for (const g of GAMES) {
    await page.click(`[data-game="${g}"]`); await sleep(450);
    const sel = g === 'sentiero' ? '#recBtn' : '.lx-recopen';
    ok(await page.locator('#menu ' + sel).first().isVisible(), g + ': pulsante Record nel menu');
    ok(await page.locator('#over ' + (g === 'sentiero' ? '#recBtn2' : sel)).count() >= 1, g + ': pulsante Record anche a fine partita');
    if (g !== 'sentiero') {
      await page.locator('#menu .lx-recopen').click(); await sleep(250);
      const t = await page.textContent('#lx-grectitle');
      const rows = await page.$$eval('#lx-grecrows tr', r => r.map(x => [...x.children].map(c => c.textContent)));
      ok(await page.isVisible('#lx-grecpanel') && /Record · /.test(t), g + ': pannello aperto: ' + t);
      const r = Object.fromEntries(rows.map(x => [x[0], x.slice(1)]));
      ok(rows.length === 5 && r['Oggi'][0] === '300' && r['Oggi'][1] === '250' && r['Oggi'][2] === '2', g + ': oggi migliore 300, media 250, 2 partite: ' + JSON.stringify(r['Oggi']));
      ok(r['Sempre'][0] === '900' && r['Sempre'][2] === '3' && r['Sempre'][1] === '467', g + ': sempre migliore 900, media 467, 3 partite: ' + JSON.stringify(r['Sempre']));
      ok(r["Quest'anno"][0] === '300' && r['Questo mese'][0] === '300', g + ': anno e mese contano solo le partite recenti');
      await page.keyboard.press('Escape'); await sleep(150);
      ok(!(await page.isVisible('#lx-grecpanel')) && await page.isVisible('#menu'), g + ': Esc chiude il pannello e resta nel gioco');
      const box = await page.evaluate(() => { const m = document.querySelector('#menu .card, #menu > div'); const r = document.querySelector('#menu .lx-brow'); const b = r && r.getBoundingClientRect(); return b ? { r: Math.round(b.right), w: innerWidth } : null; });
      ok(box && box.r <= box.w, g + ': i due pulsanti affiancati stanno nello schermo');
    } else {
      await page.click('#recBtn'); await sleep(200); ok(await page.isVisible('#rec'), 'sentiero: il suo pannello Record si apre'); await page.click('#recClose');
    }
    await page.keyboard.press('Escape'); await sleep(250);
  }
  // dalla schermata finale: Dieci con tempo scaduto
  await page.click('[data-game="dieci"]'); await sleep(450); await page.click('#play'); await sleep(300);
  await page.evaluate(() => window.__D.setTime(0.2)); await sleep(1200);
  ok(await page.isVisible('#over'), 'dieci: fine partita');
  await page.locator('#over .lx-recopen').click(); await sleep(250);
  ok(await page.isVisible('#lx-grecpanel') && await page.isVisible('#over'), 'dieci: il pannello si apre dalla schermata finale');
  await page.screenshot({ path: 'shots/rec-gioco.png' });
  ok(errs.length === 0, 'nessun errore in pagina ' + JSON.stringify(errs));
  await b.close();
  console.log(bad ? 'FALLITI: ' + bad : 'TUTTO OK');
  process.exit(bad ? 1 : 0);
})();
