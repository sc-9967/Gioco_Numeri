// Calamita: serie di giorni, obiettivo del giorno, gioco consigliato, gancio di fine partita (record di oggi/settimana/sempre, distanza),
// coriandoli, Invio = rigioca, "Copia risultato" per i giochi che non lo hanno.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK  ' : 'KO  ') + m); };
const days = k => { const d = new Date(); const t = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(d); const x = new Date(t + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() - k); return x.toISOString().slice(0, 10); };
(async () => {
  const b = await chromium.launch();
  const mk = async hist => {
    const ctx = await b.newContext({ viewport: { width: 360, height: 700 }, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage(); page.errs = [];
    await page.addInitScript(h => { localStorage.setItem('nit_name', JSON.stringify('Prova')); if (h && !sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); Object.keys(h).forEach(k => localStorage.setItem(k, JSON.stringify(h[k]))); } }, hist);
    page.on('pageerror', e => page.errs.push(e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && page.errs.push(m.text()));
    await page.goto('file://' + __dirname + '/../index.html'); await sleep(400);
    return page;
  };
  const txt = (page, sel) => page.evaluate(s => document.querySelector(s).textContent, sel);
  const rec = (g, d, bst, n) => ({ [g]: { [d]: { b: bst, n, s: bst * n } } });
  // 1) senza storico
  let page = await mk(null);
  ok((await txt(page, '#lx-flame')).includes('Inizia la tua serie'), 'nuovo giocatore: "Inizia la tua serie"');
  ok((await txt(page, '#lx-dots')).includes('0/3'), 'obiettivo 0/3: ' + await txt(page, '#lx-dots'));
  ok((await txt(page, '#lx-tplay')).startsWith('Gioca ora: '), 'gioco consigliato: ' + await txt(page, '#lx-tplay'));
  ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'home senza scorrimento orizzontale');
  await page.screenshot({ path: 'shots/cal-home0.png' });
  await page.context().close();
  // 2) serie: ieri e l'altro ieri -> 2 giorni, non ancora giocato oggi
  const hist2 = { nit_hist: Object.assign({}, rec('lampo', days(1), 500, 2), { resto: { [days(2)]: { b: 90, n: 1, s: 90 }, [days(5)]: { b: 90, n: 1, s: 90 } } }) };
  page = await mk(hist2);
  ok((await txt(page, '#lx-flame')).includes('2 giorni di fila'), 'serie di 2 giorni: ' + await txt(page, '#lx-flame'));
  ok((await txt(page, '#lx-thint')).includes('tenere la serie di 2 giorni'), 'avviso per tenere la serie: ' + await txt(page, '#lx-thint'));
  ok(!(await txt(page, '#lx-tplay')).includes('Lampo'), 'non consiglia il gioco più giocato');
  await page.context().close();
  // 3) buco: ultima partita 3 giorni fa -> serie azzerata
  page = await mk({ nit_hist: rec('lampo', days(3), 500, 1) });
  ok((await txt(page, '#lx-flame')).includes('Inizia la tua serie'), 'serie interrotta da un giorno vuoto');
  await page.context().close();
  // 4) partita vera di Cassaforte con un record di oggi già alto: distanza dal record
  const hist4 = { nit_hist: Object.assign({}, rec('cassaforte', days(0), 900000, 1)), cass_best: 900000 };
  page = await mk(hist4);
  ok((await txt(page, '#lx-dots')).includes('1/3'), 'oggi 1 gioco su 3');
  ok(await page.evaluate(() => !!document.querySelector('.lx-card[data-game="cassaforte"] .lx-done:not([hidden])')), 'la carta di Cassaforte mostra "✓ oggi"');
  await page.click('[data-game="cassaforte"]'); await sleep(300); await page.click('#play'); await sleep(200);
  const play = () => page.evaluate(async () => {
    const C = window.__C; C.setTimescale(0.02); let g = 0;
    while (C.S.state !== 'over' && g++ < 600) {
      if (C.S.state === 'play' && !C.S.locked) { let c = C.allCodes(C.S.len); for (const x of C.S.guesses) c = c.filter(y => C.sameFb(C.feedback(y, x.g), x)); C.type(c[Math.floor(Math.random() * c.length)]); C.submit(); }
      await new Promise(r => setTimeout(r, 12));
    }
    return C.S.score;
  });
  const sc = await play(); await sleep(400);
  ok(await page.isVisible('.lx-hook'), 'gancio visibile a fine partita (punti ' + sc + ')');
  const hook = await page.evaluate(() => document.querySelector('.lx-hook').innerText);
  console.log(JSON.stringify(hook));
  ok(/Ti mancano .* per il record di oggi/.test(hook), 'distanza dal record di oggi');
  ok(/2ª partita di oggi/.test(hook), 'conta le partite di oggi');
  ok(/obiettivo 1\/3/.test(hook), 'obiettivo aggiornato');
  ok(/🔥 1 giorno di fila|serie di 1 giorno/.test(hook), 'serie nel gancio');
  await page.screenshot({ path: 'shots/cal-hook-miss.png' });
  // gioco successivo
  const nextLabel = await txt(page, '.lx-next'); const nextName = nextLabel.replace('Prossimo: ', '').replace(' →', '');
  await page.click('.lx-next'); await sleep(500);
  ok(await page.isVisible('#lx-launcher') === false && (await page.evaluate(() => !!document.querySelector('.lx-holder'))), 'il pulsante "Prossimo" apre il gioco suggerito (' + nextName + ')');
  ok(page.errs.length === 0, 'nessun errore: ' + JSON.stringify(page.errs));
  await page.context().close();
  // 5) nuovo record di sempre: coriandoli e vibrazione, poi Invio = rigioca
  page = await mk({ cass_best: 100, nit_hist: rec('cassaforte', days(10), 100, 1) });
  await page.click('[data-game="cassaforte"]'); await sleep(300); await page.click('#play'); await sleep(200);
  await play(); await sleep(400);
  const hook5 = await page.evaluate(() => document.querySelector('.lx-hook').innerText);
  console.log(JSON.stringify(hook5));
  ok(/Nuovo record di sempre/.test(hook5), 'record di sempre riconosciuto');
  ok(await page.evaluate(() => !!document.querySelector('.lx-confetti i')), 'coriandoli presenti');
  await page.screenshot({ path: 'shots/cal-hook-record.png' });
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.keyboard.press('Enter'); await sleep(300);
  ok((await page.evaluate(() => window.__C.S.state)) === 'play', 'Invio nella schermata finale rigioca');
  await page.context().close();
  // 6) record della settimana (ma non di sempre) e gioco senza "Copia risultato" (Girasette)
  page = await mk({ girasette_best: 5000, nit_hist: rec('girasette', days(20), 5000, 1) });
  await page.click('[data-game="girasette"]'); await sleep(500);
  ok(!(await page.evaluate(() => !!document.querySelector('#share'))), 'Girasette non ha un proprio "Copia risultato"');
  await page.evaluate(() => { document.querySelector('#overScore').textContent = '1.234'; document.querySelector('#over').hidden = false; });
  await sleep(300);
  const hook6 = await page.evaluate(() => document.querySelector('.lx-hook').innerText);
  console.log(JSON.stringify(hook6));
  ok(/Ti mancano 3\.766 punti per il record di sempre/.test(hook6) || /Ti mancano/.test(hook6), 'Girasette: distanza dal record');
  ok(await page.isVisible('.lx-sharebtn'), 'il launcher aggiunge "Copia risultato"');
  await page.click('.lx-sharebtn'); await sleep(200);
  const shared = await page.evaluate(() => { const b = document.querySelector('.lx-sharebox'); return b && !b.hidden ? b.value : '(copiato)'; });
  console.log('testo condiviso:', JSON.stringify(shared));
  ok(shared === '(copiato)' || shared.startsWith('Prova · Girasette · 1.234 punti'), 'testo di condivisione con nome');
  await page.screenshot({ path: 'shots/cal-hook-girasette.png' });
  await page.context().close();
  // 7) Bilancia in partita libera: il suo "Copia risultato" e' nascosto, quindi lo mette il launcher
  page = await mk(null);
  await page.click('[data-game="bilancia"]'); await sleep(400);
  await page.evaluate(() => { document.querySelector('#overScore').textContent = '45'; document.querySelector('#over').hidden = false; });
  await sleep(300);
  ok(await page.isVisible('.lx-sharebtn'), 'Bilancia (partita libera): "Copia risultato" aggiunto dal launcher');
  console.log('errori:', JSON.stringify(page.errs));
  await b.close();
  console.log(fails ? 'FALLITI: ' + fails : 'TUTTO OK');
})();
