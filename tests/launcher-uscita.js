// Uscita dalla partita ("← Tutti i giochi") in ogni gioco e record oggi/settimana/mese/anno/sempre per gioco.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const GAMES = ['bilancia', 'quadrante', 'primo', 'resto', 'girasette', 'raddoppio', 'sentiero', 'lampo'];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 700 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  await page.addInitScript(() => localStorage.setItem('nit_name', JSON.stringify('Prova')));
  page.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | '))); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  const url = 'file://' + __dirname + '/../index.html';
  await page.goto(url); await sleep(500);
  for (const g of GAMES) {
    await page.click(`[data-game="${g}"]`); await sleep(400);
    const line = (await page.textContent('.lx-recmenu')).trim();
    const hasLeave = await page.isVisible('.lx-leave');           // dietro al menu la barra c'e' ma e' coperta: controlliamo dopo Gioca
    await page.click('#play').catch(() => page.click('#daily')); await sleep(600);
    const vis = await page.isVisible('.lx-leave');
    const box = await page.locator('.lx-leave').boundingBox();
    const inView = box && box.y >= 0 && box.y + box.height <= 700 && box.x >= 0 && box.x + box.width <= 360;
    await page.screenshot({ path: `shots/u-${g}.png` });
    await page.click('.lx-leave'); await sleep(150);
    const asked = (await page.textContent('.lx-leave')).startsWith('Sicuro') && !(await page.isVisible('#lx-launcher'));
    await page.click('.lx-leave'); await sleep(300);
    const back = await page.isVisible('#lx-launcher');
    console.log(g.padEnd(10), 'visibile in partita:', vis, '| dentro lo schermo:', inView, '| chiede conferma:', asked, '| torna ai giochi:', back, '| riga record nel menu:', line.slice(0, 60), '| overflow:', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  }
  // timeout della conferma
  await page.click('[data-game="lampo"]'); await sleep(300); await page.click('#play'); await sleep(500);
  await page.click('.lx-leave'); await sleep(2800);
  console.log('la conferma scade dopo 2,5 s:', (await page.textContent('.lx-leave')).startsWith('←'), '| ancora in partita:', !(await page.isVisible('#lx-launcher')));
  await page.keyboard.press('Escape'); await sleep(200);
  // abbandono: la partita non conta nei record
  const after = await page.evaluate(() => (JSON.parse(localStorage.getItem('nit_hist') || '{}').lampo || null));
  console.log('abbandono non registrato nello storico:', after === null);
  // record per periodo: storico costruito a mano (oggi = giorno di Roma)
  const T = await page.evaluate(() => {
    const iso = d => d.toISOString().slice(0, 10), now = new Date(), day = k => { const d = new Date(now); d.setUTCDate(d.getUTCDate() - k); return iso(d); };
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(now);
    const base = new Date(today + 'T00:00:00Z'), at = k => { const d = new Date(base); d.setUTCDate(d.getUTCDate() - k); return iso(d); };
    const mon = (() => { const d = new Date(base); const w = (d.getUTCDay() + 6) % 7; return w; })();
    const h = { resto: {} };
    h.resto[today] = { b: 100, n: 1, s: 100 };
    h.resto[at(mon + 3)] = { b: 400, n: 1, s: 400 };            // settimana scorsa (stesso mese o no)
    h.resto[at(40)] = { b: 700, n: 1, s: 700 };                  // mese precedente
    h.resto[at(400)] = { b: 900, n: 1, s: 900 };                 // anno precedente
    localStorage.setItem('nit_hist', JSON.stringify(h)); localStorage.setItem('resto_best', JSON.stringify(1200));
    return { today, mon };
  });
  await page.reload(); await sleep(400);
  await page.click('#lx-recbtn'); await sleep(200);
  const rows = await page.evaluate(() => [...document.querySelectorAll('#lx-recrows tr')].map(tr => [...tr.children].map(td => td.textContent).join(' | ')));
  console.log('intestazione:', await page.evaluate(() => [...document.querySelectorAll('.lx-rectable th')].map(t => t.textContent).join(' | ')));
  console.log(rows.find(r => r.startsWith('Resto')), '   (attesi: oggi 100, settimana 100, mese >=100, anno >=100, sempre 1.200 grazie al record gia\' salvato)');
  await page.screenshot({ path: 'shots/u-record.png' });
  await page.click('#lx-recclose');
  await page.click('[data-game="resto"]'); await sleep(300);
  console.log('riga nel gioco:', (await page.textContent('.lx-recmenu')).trim());
  console.log('errori:', JSON.stringify(errs)); await b.close();
})();
