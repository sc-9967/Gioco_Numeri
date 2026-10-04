// Primo: a fine partita si mostra il blocco su cui il gioco si è fermato (non l'ultimo riuscito), con la scomposizione completa.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK  ' : 'KO  ') + m); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 700 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  await page.addInitScript(() => { localStorage.setItem('nit_name', JSON.stringify('Prova')); localStorage.setItem('nit_howto_primo', '1'); });
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html'); await sleep(400);
  await page.click('[data-game="primo"]'); await sleep(400); await page.click('#play'); await sleep(400);
  const prod = a => a.reduce((x, y) => x * y, 1);
  // 1) nessun blocco finito: la torre sale per errori ("È primo!" su un non primo)
  for (let i = 0; i < 60 && !(await page.isVisible('#over')); i++) { await page.click('#isPrime').catch(() => {}); await sleep(250); }
  await sleep(1500);
  ok(await page.isVisible('#over'), 'la torre tocca il soffitto: schermata finale');
  const t1 = await page.evaluate(() => document.getElementById('stLast').innerText);
  console.log(JSON.stringify(t1));
  const m1 = /sul blocco (\d+)\..*Scomposizione: (\d+) = ([\d × ]+)\./.exec(t1);
  ok(m1 && +m1[1] === +m1[2] && prod(m1[3].split(' × ').map(Number)) === +m1[1], 'mostra il blocco rimasto e la scomposizione corretta (' + (m1 && m1[1] + ' = ' + m1[3]) + ')');
  ok(!/Ultimo blocco:/.test(t1), 'non propone più "l\'ultimo blocco riuscito"');
  await page.screenshot({ path: 'shots/primo-ultimo.png' });
  // 2) con blocchi finiti prima: continua a mostrare quello rimasto, non l'ultimo riuscito
  await page.click('#again'); await sleep(400);
  const keys = await page.evaluate(() => [...document.querySelectorAll('.pk')].map(x => +x.textContent));
  const t0 = Date.now();
  while (!(await page.isVisible('#over')) && Date.now() - t0 < 90000) {       // gioca "alla meglio": prima i primi piccoli, poi "È primo!"; gli errori fanno salire la torre
    for (const p of keys) await page.click('#k' + p, { timeout: 1500 }).catch(() => {});
    await page.click('#isPrime', { timeout: 1500 }).catch(() => {});
  }
  await sleep(1500);
  const t2 = await page.evaluate(() => ({ txt: document.getElementById('stLast').innerText, blocks: document.getElementById('stBlocks').textContent }));
  console.log(JSON.stringify(t2));
  const m2 = /sul blocco (\d+)/.exec(t2.txt) || /sul blocco (\d+)\: era già/.exec(t2.txt);
  ok(m2 && /sul blocco/.test(t2.txt) && !/Ultimo blocco:/.test(t2.txt), 'dopo ' + t2.blocks + ' blocchi finiti, la schermata finale mostra il blocco rimasto');
  ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'nessuno scorrimento orizzontale');
  console.log('errori:', JSON.stringify(errs)); await b.close();
  console.log(fails ? 'FALLITI: ' + fails : 'TUTTO OK');
})();
