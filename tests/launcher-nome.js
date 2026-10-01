// Nome del giocatore: obbligatorio prima di giocare, salvato sul dispositivo, presente nei testi condivisi, assente dalle statistiche.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html'); await sleep(600);
  console.log('campo nome visibile:', await page.isVisible('#lx-name'), '| saluto nascosto:', !(await page.isVisible('#lx-hello')));
  await page.screenshot({ path: 'shots/n-home.png' });
  await page.click('[data-game="bilancia"]'); await sleep(300);
  console.log('senza nome il gioco non parte:', !(await page.isVisible('#menu')), '| messaggio:', await page.textContent('#lx-nameerr'));
  await page.fill('#lx-name', '   '); await page.click('#lx-namesave');
  console.log('nome vuoto rifiutato:', await page.textContent('#lx-nameerr'));
  await page.fill('#lx-name', '  Maria\u0007   <b>Rossi</b> è molto lungo  '); await page.click('#lx-namesave'); await sleep(400);
  console.log('dopo il nome parte il gioco richiesto (pendente):', await page.isVisible('#menu'));
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('nit_name')));
  console.log('nome salvato ripulito e al massimo 20 caratteri:', JSON.stringify(saved), saved.length <= 20, !/[<>]/.test(saved));
  await page.keyboard.press('Escape'); await sleep(300);
  console.log('saluto:', (await page.textContent('#lx-hello')).replace(/\s+/g, ' ').trim());
  // testi condivisi con il nome
  const name = 'Luca';
  await page.click('#lx-namechange'); await page.fill('#lx-name', name); await page.click('#lx-namesave'); await sleep(200);
  const shares = {};
  for (const g of ['bilancia', 'quadrante', 'primo', 'resto', 'raddoppio', 'sentiero']) {
    await page.click(`[data-game="${g}"]`); await sleep(300);
    shares[g] = await page.evaluate(async (g) => {
      const w = ms => new Promise(r => setTimeout(r, ms));
      const box = () => { const b = document.getElementById('shareBox'); return b && !b.hidden ? b.value : null; };
      // forza il ripiego (textarea) togliendo la clipboard
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('no')) }, configurable: true });
      if (g === 'sentiero') { const S = window.__SN; S.setTimescale(0.05); S.start('free'); for (let i = 0; i < 5; i++) { const p = S.solve(S.grids[S.state.gi]).path; for (let k = 1; k < p.length; k++) S.tap(p[k][0], p[k][1]); await w(80); document.getElementById('next').click(); await w(60); } await w(400); document.getElementById('share').click(); await w(200); return box(); }
      if (g === 'raddoppio') { const R = window.__R; R.setTimescale(0.03); R.start('daily'); R.setGrid([[8,16,8,16],[16,8,16,8],[8,16,8,16],[8,16,8,0]]); R.move('right'); await w(600); document.getElementById('share').click(); await w(200); return box(); }
      return 'n/d';
    }, g);
    await page.keyboard.press('Escape'); await sleep(250);
  }
  console.log('Sentiero:', JSON.stringify(shares.sentiero));
  console.log('Raddoppio:', JSON.stringify(shares.raddoppio));
  // i giochi con sfida del giorno condividono dopo il game over: controllo diretto sul codice
  const src = await page.evaluate(() => document.documentElement.innerHTML);
  console.log('testi con withName nel codice:', (src.match(/withName\(/g) || []).length);
  // statistiche anonime
  await page.evaluate(() => { document.getElementById('lx-copystats').hidden = false; document.getElementById('lx-copystats').click(); });
  await sleep(300);
  const stats = await page.evaluate(() => { const b = document.getElementById('lx-statsbox'); return b.hidden ? '(copiato)' : b.value; });
  console.log('le statistiche NON contengono il nome:', !/Luca/.test(stats) && !/Luca/.test(await page.evaluate(() => localStorage.getItem('nit_stats'))));
  // sfida via link con nome
  await page.goto('file://' + __dirname + '/../index.html#sentiero?c=SEN-abc12-400&n=Giulia'); await sleep(600);
  console.log('link: gioco aperto e nome sfidante:', await page.isVisible('#menu'), '|', await page.textContent('#codeErr'));
  // nuova sessione senza nome + link diretto: resta in home finche' non si scrive il nome
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } }); const p2 = await ctx2.newPage();
  await p2.goto('file://' + __dirname + '/../index.html#sentiero?c=SEN-abc12-400&n=Giulia'); await sleep(600);
  console.log('link senza nome: resta in home:', await p2.isVisible('#lx-launcher'), '| menu gioco nascosto:', !(await p2.isVisible('#menu')));
  await p2.fill('#lx-name', 'Anna'); await p2.click('#lx-namesave'); await sleep(500);
  console.log('dopo il nome si apre la sfida:', await p2.isVisible('#menu'), '|', await p2.textContent('#codeErr'));
  await page.setViewportSize({ width: 1280, height: 800 }); await page.goto('file://' + __dirname + '/../index.html'); await sleep(500); await page.screenshot({ path: 'shots/n-desktop.png' });
  console.log('errori:', JSON.stringify(errs)); await b.close();
})();
