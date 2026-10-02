// Lampo: regole, punteggio con tetto, partita che finisce, febbre con pausa, bonus, nome/record nel launcher, schermi.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  await page.addInitScript(() => localStorage.setItem('nit_name', JSON.stringify('Prova')));
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html#lampo'); await sleep(700);
  console.log('menu visibile:', await page.isVisible('#menu'), '| bottone regola del giorno:', (await page.textContent('#daily')).trim());
  await page.screenshot({ path: 'shots/lam-menu.png' });
  const R = await page.evaluate(() => {
    const L = window.__L, o = {};
    o.seq = L.RULES.map(r => r.id + ':' + [0, 1, 2, 3].map(k => L.seqVal(r, k)).join(',') + (r.len ? ' ..' + L.seqVal(r, r.len - 1) + ',' + L.seqVal(r, r.len) : ''));
    o.tetto = [L.comboMult(0), L.comboMult(10), L.comboMult(100)];
    o.daily = L.dailyRule().id;
    return o;
  });
  console.log('sequenze:', JSON.stringify(R.seq), '| moltiplicatore combo 0/10/100:', JSON.stringify(R.tetto), '| regola del giorno:', R.daily);
  // giocatore perfetto a 1,4 colpi/s: la partita deve finire (prima: mai)
  const P = await page.evaluate(() => { const L = window.__L; L.start('free');
    let t = 0, acc = 0, feverTicks = 0, maxMult = 0, snap = {};
    for (let i = 0; i < 20 * 60 * 20 && L.S.state !== 'over'; i++) { L.update(0.05); t += 0.05; acc += 0.05; const S = L.S;
      if (S.fever > 0) feverTicks++;
      if (S.state === 'playing' && acc >= 0.7) { acc = 0; const n = S.numbers.find(n => !n.dead && n.val === L.target() && n.scale > 0.5); if (n) L.hit(n); }
      if (Math.abs(t - 60) < 0.03) snap.s60 = Math.floor(L.S.score); if (Math.abs(t - 120) < 0.03) snap.s120 = Math.floor(L.S.score); }
    const S = L.S; return { stato: S.state, secondi: Math.round(S.elapsed), punti: Math.floor(S.score), colpi: S.hits, combo: S.maxCombo, febbreSec: Math.round(feverTicks * 0.05), ...snap }; });
  console.log('giocatore perfetto 1,4 colpi/s:', JSON.stringify(P));
  const P2 = await page.evaluate(() => { const L = window.__L; L.start('free'); let t = 0, acc = 0, ft = 0;
    for (let i = 0; i < 20 * 60 * 20 && L.S.state !== 'over'; i++) { L.update(0.05); t += 0.05; acc += 0.05; if (L.S.fever > 0) ft++; if (L.S.state === 'playing' && acc >= 0.45) { acc = 0; const n = L.S.numbers.find(n => !n.dead && n.val === L.target() && n.scale > 0.5); if (n) L.hit(n); } }
    const S = L.S; return { stato: S.state, secondi: Math.round(S.elapsed), punti: Math.floor(S.score), febbreSec: Math.round(ft * 0.05) }; });
  console.log('giocatore molto veloce 2,2 colpi/s:', JSON.stringify(P2));
  // febbre: dura 8 s, poi pausa 20 s
  const F = await page.evaluate(() => { const L = window.__L; L.start('free'); for (let i = 0; i < 70; i++) L.update(0.05); let ft = 0, retrig = 0, was = false;
    for (let c = 0; c < 400 && L.S.state !== 'over'; c++) { L.update(0.05); const n = L.S.numbers.find(n => !n.dead && n.val === L.target() && n.scale > 0.5); if (n && c % 6 === 0) L.hit(n); const f = L.S.fever > 0; if (f && !was) retrig++; was = f; if (f) ft++; L.S.timer; L.timer = 100; }
    return { volteScattata: retrig, secondiFebbre: Math.round(ft * 0.05), su: '20 s simulati' }; });
  console.log('febbre in 20 s di gioco con timer sempre pieno:', JSON.stringify(F));
  // scudo, errore, stella
  const B = await page.evaluate(() => { const L = window.__L; L.start('free'); for (let i = 0; i < 70; i++) L.update(0.05);
    const mk = (type, val) => ({ x: 100, y: 200, vx: 0, vy: 0, val, r: 25, type, scale: 1, dead: false, deathT: 0 });
    const out = {}; let n = mk('star', null); L.S.numbers.push(n); const i0 = L.S.idx, t0 = L.S.timer; L.timer = 50; L.hit(n); out.stella = { sequenzaAvanza: L.S.idx !== i0, tempo: L.S.timer };
    n = mk('shield', null); L.S.numbers.push(n); L.hit(n); const wrong = mk('normal', 9999); L.S.numbers.push(wrong); const t1 = L.S.timer; L.hit(wrong); out.scudo = { parato: L.S.timer === t1 && L.S.shield === 0 };
    const w2 = mk('normal', 9999); L.S.numbers.push(w2); L.hit(w2); out.errore = { tempoPersoSec: Math.round(t1 - L.S.timer), comboAzzerata: L.S.combo === 0 }; return out; });
  console.log('bonus:', JSON.stringify(B));
  // regola alla rovescia: giro completo
  const D = await page.evaluate(() => { const L = window.__L; L.start('free'); const r = L.RULES.find(x => x.id === 'dn'); return { prima: L.seqVal(r, 29), dopoGiro: L.seqVal(r, 30) }; });
  console.log('alla rovescia (ultimo 1, poi riparte):', JSON.stringify(D));
  // partita vera con tocchi reali
  await page.evaluate(() => { window.__L.setTimescale(1); window.__L.start('free'); });
  await sleep(3300);
  const pos = async () => page.evaluate(() => { const L = window.__L, S = L.S, n = S.numbers.find(n => !n.dead && n.val === L.target() && n.scale > 0.8); if (!n) return null; const rc = document.getElementById('cv').getBoundingClientRect(); return [rc.left + n.x, rc.top + n.y]; });
  let ok = 0; for (let i = 0; i < 6; i++) { const c = await pos(); if (c) { await page.mouse.click(c[0], c[1]); ok++; } await sleep(300); }
  await page.screenshot({ path: 'shots/lam-play.png' });
  console.log('tocchi reali riusciti:', ok, '| colpi registrati:', await page.evaluate(() => window.__L.S.hits), '| punti:', await page.textContent('#score'));
  await page.evaluate(() => { window.__L.timer = 0.01; }); await sleep(1500);
  console.log('fine partita visibile:', await page.isVisible('#over'), '|', (await page.textContent('#overNear')).trim());
  await page.screenshot({ path: 'shots/lam-over.png' });
  console.log('record sulla carta dopo uscita:'); await page.keyboard.press('Escape'); await sleep(300);
  console.log(' ', await page.textContent('[data-game="lampo"] [data-best]'), '| conteggio:', await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('nit_stats')).games.lampo)), '| storico:', await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('nit_hist')).lampo)));
  for (const [w, h, n] of [[360, 640, 's'], [844, 390, 'l'], [1280, 800, 'd']]) { await page.setViewportSize({ width: w, height: h }); await page.goto('file://' + __dirname + '/../index.html'); await sleep(300); await page.click('[data-game="lampo"]'); await sleep(300); await page.click('#play'); await sleep(1200); await page.screenshot({ path: 'shots/lam-' + n + '.png' }); console.log(n, 'overflow:', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)); }
  console.log('errori:', JSON.stringify(errs)); await b.close();
})();
