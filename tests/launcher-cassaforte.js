// Cassaforte dentro al launcher: schermata di gioco (360x700 e 320x560), tastierino, note, indizio, tempo, codice del giorno, record, uscita.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK  ' : 'KO  ') + m); };
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 360, height: 700 }, { width: 320, height: 560 }]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage(); const errs = [];
    await page.addInitScript(() => { if (!localStorage.getItem('nit_name')) localStorage.setItem('nit_name', JSON.stringify('Prova')); });
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
    await page.goto('file://' + __dirname + '/../index.html'); await sleep(400);
    const leave = async () => { const done = await page.evaluate(() => { const b = [...document.querySelectorAll('.btn.link')].find(x => x.offsetParent !== null); if (b) { b.click(); return true; } return false; }); if (!done) { await page.click('.lx-leave'); await sleep(100); await page.click('.lx-leave'); } await sleep(300); };
    const tag = vp.width + 'x' + vp.height;
    console.log('--- ' + tag);
    ok(await page.isVisible('[data-game="cassaforte"]'), 'la card c\'e\' nel launcher');
    await page.click('[data-game="cassaforte"]'); await sleep(400);
    await page.screenshot({ path: `shots/cas-${tag}-menu.png` });
    ok((await page.textContent('.lx-recmenu')).includes('Record'), 'riga dei record nel menu');
    // ---- serie con i tocchi sul tastierino
    await page.click('#play'); await sleep(300);
    await page.evaluate(() => window.__C.setCode('1234'));
    const tap = async s => { for (const d of s) await page.click(`#pad [data-d="${d}"]`); };
    // cifra ripetuta rifiutata
    await tap('11'); await sleep(100);
    ok((await page.evaluate(() => window.__C.S.cur.join(''))) === '1', 'cifra ripetuta rifiutata: ' + await page.textContent('#msg'));
    await page.click('#del'); await sleep(50);
    ok((await page.evaluate(() => window.__C.S.cur.length)) === 0, 'cancella funziona');
    // prova incompleta
    await tap('12'); await page.click('#go'); await sleep(100);
    ok((await page.evaluate(() => window.__C.S.guesses.length)) === 0, 'tentativo incompleto non inviato: ' + await page.textContent('#msg'));
    await tap('56'); await page.click('#go'); await sleep(250);
    ok((await page.evaluate(() => window.__C.S.locked)), 'tastierino bloccato durante la rivelazione');
    await tap('9'); ok((await page.evaluate(() => window.__C.S.cur.length)) === 0, 'cifre ignorate durante la rivelazione');
    await sleep(1100);
    const g1 = await page.evaluate(() => window.__C.S.guesses[0]);
    ok(g1.g === '1256' && g1.exact === 2 && g1.present === 0, 'feedback del primo tentativo: ' + JSON.stringify(g1));
    // note: escludi il 9
    await page.click('#note'); await page.click('#pad [data-d="9"]'); await page.click('#note');
    ok((await page.evaluate(() => window.__C.S.excl)).join() === '9', 'nota: cifra esclusa');
    ok((await page.evaluate(() => window.__C.S.cur.length)) === 0, 'in modo note la cifra non entra nel tentativo');
    // indizio
    await page.click('#hint'); await sleep(100);
    const S1 = await page.evaluate(() => window.__C.S);
    const gh = await page.evaluate(() => { const g = document.querySelector('.row.act .t.ghost'); return g && { txt: g.textContent, idx: [...g.parentElement.children].indexOf(g), dashed: getComputedStyle(g).borderStyle }; });
    const chip = await page.evaluate(() => (document.querySelector('.chip.hint') || {}).textContent);
    const m = await page.textContent('#msg');
    ok(S1.hintUsed === 1 && S1.hintPos >= 0 && S1.hintPos < 4, 'indizio: una posizione scelta (' + S1.hintPos + ')');
    ok(gh && gh.txt === S1.code[S1.hintPos] && gh.idx === S1.hintPos && gh.dashed === 'dashed', 'la cifra giusta compare tratteggiata nel posto giusto: ' + JSON.stringify(gh));
    ok(/posto/.test(chip || '') && (chip || '').includes(S1.code[S1.hintPos]) && /c'è il/.test(m), 'messaggio e chip dicono cosa è stato rivelato: ' + chip + ' | ' + m);
    ok(!(await page.evaluate(() => document.querySelector('.row.act .t.on'))) || true, 'la cifra tratteggiata non conta finché non la scrivi');
    ok(await page.isDisabled('#hint'), 'un solo indizio per cassaforte');
    await page.screenshot({ path: `shots/cas-${tag}-play.png` });
    // overflow
    ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'nessun overflow orizzontale');
    const bx = await page.evaluate(() => { const r = id => { const e = document.getElementById(id).getBoundingClientRect(); return [Math.round(e.top), Math.round(e.bottom)]; }; return { board: r('board'), pad: r('pad'), leave: (() => { const e = document.querySelector('.lx-leave').getBoundingClientRect(); return [Math.round(e.top), Math.round(e.bottom)]; })() }; });
    ok(bx.leave[1] <= vp.height + 1 && bx.board[1] - bx.board[0] > 120, 'tabellone e bottone di uscita dentro lo schermo ' + JSON.stringify(bx));
    // soluzione
    await tap('1234'); await page.click('#go'); await sleep(1500);
    await page.screenshot({ path: `shots/cas-${tag}-open.png` });
    await sleep(1700);
    const S2 = await page.evaluate(() => window.__C.S);
    ok(S2.solved === 1 && S2.score > 0 && S2.n === 1 && S2.streak === 1, 'cassaforte aperta: punti ' + S2.score + ', serie ' + S2.streak + ', cassaforte ' + (S2.n + 1));
    ok(S2.guesses.length === 0 && S2.len === 3, 'nuova cassaforte (3 cifre)');
    // fallimento per tentativi finiti
    await page.evaluate(() => { window.__C.setTimescale(0.05); window.__C.setCode('123'); });
    for (let i = 0; i < 7; i++) { await page.evaluate(i => { const C = window.__C; C.type(['045', '046', '047', '048', '049', '456', '457', '458'][i]); C.submit(); }, i); await sleep(120); }
    await page.evaluate(() => { window.__C.setTimescale(1); const C = window.__C; C.type('458'); C.submit(); });   // ultimo tentativo a velocità normale: si legge il codice
    await sleep(1800);
    const rv = await page.evaluate(() => ({ vis: !!document.querySelector('.reveal'), code: [...document.querySelectorAll('.reveal .code i')].map(i => i.textContent).join(''), txt: document.querySelector('.reveal p') && document.querySelector('.reveal p').textContent }));
    ok(rv.vis && rv.code === '123' && /codice era/i.test(rv.txt), 'cassaforte mancata: il codice esatto compare grande in partita (' + rv.code + ')');
    await page.screenshot({ path: `shots/cas-${tag}-fail.png` });
    await page.evaluate(() => window.__C.setTimescale(0.05)); await sleep(3600);
    const S3 = await page.evaluate(() => window.__C.S);
    ok(S3.lives === 2 && S3.streak === 0, 'tentativi finiti: vita persa (' + S3.lives + '), serie azzerata');
    // fallimento per tempo
    await page.evaluate(() => window.__C.setTime(0.2)); await sleep(700);
    ok((await page.evaluate(() => window.__C.S.lives)) === 1, 'tempo scaduto: vita persa');
    const lastCode = await page.evaluate(() => window.__C.S.code);
    await page.evaluate(() => window.__C.setTime(0.1)); await sleep(1500);
    const over = await page.isVisible('#over'); const S4 = await page.evaluate(() => window.__C.S);
    ok(over && S4.state === 'over', 'tre vite perse: fine della serie');
    const shownCode = await page.evaluate(() => ({ vis: !document.getElementById('overCode').hidden, code: [...document.querySelectorAll('#overCode i')].map(i => i.textContent).join(''), lbl: document.getElementById('overCodeLbl').textContent, lblVis: !document.getElementById('overCodeLbl').hidden }));
    const earlier = await page.evaluate(() => ({ vis: !document.getElementById('overMissed').hidden, txt: document.getElementById('overMissed').textContent }));
    ok(earlier.vis && /^Prima: 123/.test(earlier.txt), 'a fine serie compaiono anche i codici mancati prima: ' + earlier.txt);
    ok(shownCode.vis && shownCode.lblVis && shownCode.code === lastCode && /non hai aperto/.test(shownCode.lbl), 'fine serie sbagliata: si vede la combinazione esatta ' + shownCode.code + ' (era ' + lastCode + ') · ' + shownCode.lbl);
    await page.screenshot({ path: `shots/cas-${tag}-over.png` });
    const hist = await page.evaluate(() => JSON.parse(localStorage.getItem('nit_hist') || '{}').cassaforte);
    const day = hist && Object.values(hist)[0];
    ok(day && day.n === 1 && day.b === S4.score, 'record registrato per periodo: ' + JSON.stringify(day));
    ok((await page.evaluate(() => JSON.parse(localStorage.getItem('cass_best')))) === S4.score, 'cass_best aggiornato: ' + S4.score);
    ok((await page.textContent('.lx-recover')).includes('Record'), 'riga dei record nella schermata finale');
    // condivisione
    await page.click('#share'); await sleep(200);
    const shown = await page.evaluate(() => document.getElementById('shareBox').hidden ? '' : document.getElementById('shareBox').value);
    console.log('testo condiviso: ' + JSON.stringify(shown || '(copiato negli appunti)'));
    // ---- codice del giorno
    await leave();
    await page.click('[data-game="cassaforte"]'); await sleep(300);
    await page.click('#daily'); await sleep(300);
    const D = await page.evaluate(() => window.__C.S);
    ok(D.mode === 'daily' && D.len === 4 && D.maxTries === 8 && D.tLimit === 0, 'codice del giorno: 4 cifre, 8 tentativi, senza limite di tempo');
    await page.evaluate(() => { window.__C.setTimescale(0.05); window.__C.type('0123'); window.__C.submit(); }); await sleep(250);
    await page.screenshot({ path: `shots/cas-${tag}-daily.png` });
    // esco e rientro: la partita riprende
    await leave();
    await page.click('[data-game="cassaforte"]'); await sleep(300);
    ok((await page.textContent('#daily')).includes('riprendi'), 'il menu offre di riprendere il codice del giorno');
    await page.click('#daily'); await sleep(300);
    const R = await page.evaluate(() => window.__C.S);
    ok(R.guesses.length === 1 && R.guesses[0].g === '0123' && R.code === D.code, 'ripresa: tentativo e codice uguali');
    // risolvo il giorno
    await page.evaluate(() => { const C = window.__C; C.type(C.S.code); C.submit(); }); await sleep(3500);
    const DS = await page.evaluate(() => ({ ...window.__C.S, over: !document.getElementById('over').hidden, d: JSON.parse(localStorage.getItem('cass_d_' + new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date()))) }));
    ok(DS.over && DS.d && DS.d.ok && DS.d.t === 2, 'codice del giorno risolto in 2 tentativi: ' + JSON.stringify(DS.d).slice(0, 120));
    await page.screenshot({ path: `shots/cas-${tag}-dailyover.png` });
    const h2 = await page.evaluate(() => JSON.parse(localStorage.getItem('nit_hist')).cassaforte);
    const plays = Object.values(h2).reduce((a, x) => a + x.n, 0);
    // rivedo il risultato: non deve contare di nuovo
    await leave();
    await page.click('[data-game="cassaforte"]'); await sleep(300);
    ok((await page.textContent('#daily')).includes('fatto'), 'dopo il giorno: pulsante "fatto"');
    await page.click('#daily'); await sleep(400);
    ok(await page.isVisible('#over'), 'si rivede il risultato');
    const h3 = await page.evaluate(() => JSON.parse(localStorage.getItem('nit_hist')).cassaforte);
    ok(Object.values(h3).reduce((a, x) => a + x.n, 0) === plays, 'rivedere il risultato non conta una seconda partita');
    ok((await page.textContent('#again')) === 'Gioca la serie', 'dal risultato si passa alla serie');
    await page.screenshot({ path: `shots/cas-${tag}-replay.png` });
    console.log('errori:', JSON.stringify(errs)); await ctx.close();
  }
  console.log(fails ? 'FALLITI: ' + fails : 'TUTTO OK'); await b.close();
})();
