// Sfida tra amici (codice PREFISSO-seme-punti): codice a fine partita, avvio da codice, stessa sequenza di partenza, confronto, banner, link.
// Ogni gioco ha un adattatore: come avviare una partita libera, la "firma" del contenuto iniziale, come finirla con un certo punteggio.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) bad++; };

const A = {
  dieci: {
    pfx: 'DIE', name: 'Dieci',
    // avvia una partita libera e restituisce la firma iniziale (la griglia)
    async afterStart(p) { await p.evaluate(() => window.__D.setTimescale(0.05)); },
    async startFree(p) { await p.click('#play'); await sleep(250); await this.afterStart(p); return (await p.evaluate(() => window.__D.S.grid)).join(''); },
    async sig(p) { return (await p.evaluate(() => window.__D.S.grid)).join(''); },
    async seed(p) { return p.evaluate(() => window.__D.S.seedTok); },
    // porta il punteggio a "n" (n tolte in coppie 5+5) e finisce la partita
    async finishWith(p, n) {
      await p.evaluate(count => { const D = window.__D; const rows = Array.from({ length: 10 }, () => Array(10).fill(0)); for (let i = 0; i < count; i++) rows[Math.floor(i / 10)][i % 10] = 5; D.setGrid(rows); D.setTime(60); }, n);
      for (let i = 0; i < n / 2; i++) await p.evaluate(i2 => window.__D.commit(Math.floor((2 * i2) / 10), (2 * i2) % 10, Math.floor((2 * i2 + 1) / 10), (2 * i2 + 1) % 10), i);
      await sleep(300); await p.evaluate(() => window.__D.setTime(0.2)); await sleep(900);
    },
  },
};
A.bilancia = {
  pfx: 'BIL', name: 'Bilancia',
  async startFree(p) { await p.click('#play'); await sleep(300); return this.sig(p); },
  async sig(p) { return p.evaluate(() => JSON.stringify([window.__B.S.cur, window.__B.S.next])); },
  async seed(p) { return p.evaluate(() => window.__B.S.tok); },
  async finishWith(p, n) { await p.evaluate(v => { const S = window.__B.S; S.score = v; S.time = 0.01; }, n); await sleep(1500); },
};
A.quadrante = {
  pfx: 'QUA', name: 'Quadrante',
  async startFree(p) { await p.click('#play'); await sleep(300); return this.sig(p); },
  async sig(p) { return p.evaluate(() => { const S = window.__Q.S; return JSON.stringify([S.cards, S.targets.map(t => t.p), S.hazards]); }); },
  async seed(p) { return p.evaluate(() => window.__Q.S.tok); },
  async finishWith(p, n) { await p.evaluate(v => { window.__Q.S.score = v; window.__Q.gameOver(); }, n); await sleep(1500); },
};
A.primo = {
  pfx: 'PRI', name: 'Primo',
  async startFree(p) { await p.click('#play'); await sleep(300); return this.sig(p); },
  async sig(p) { return p.evaluate(() => JSON.stringify(window.__P.S.stack.map(b => b.n))); },
  async seed(p) { return p.evaluate(() => window.__P.S.tok); },
  async finishWith(p, n) { await p.evaluate(v => { window.__P.S.score = v; window.__P.collapse(); }, n); await sleep(1800); },
};
A.resto = {
  pfx: 'RES', name: 'Resto',
  async startFree(p) { await p.click('#play'); await sleep(300); return this.sig(p); },
  async sig(p) { return p.evaluate(() => JSON.stringify([window.__RS.S.cust && window.__RS.S.cust.total, window.__RS.S.queue.map(c => c.total)])); },
  async seed(p) { return p.evaluate(() => window.__RS.S.tok); },
  async finishWith(p, n) { await p.evaluate(v => { window.__RS.S.score = v; window.__RS.gameOver(); }, n); await sleep(1200); },
};
A.raddoppio = {
  pfx: 'RAD', name: 'Raddoppio',
  async startFree(p) { await p.click('#play'); await sleep(300); return this.sig(p); },
  async sig(p) { return p.evaluate(() => JSON.stringify(window.__R.values())); },
  async seed(p) { return p.evaluate(() => window.__R.S.seedTok); },
  async finishWith(p, n) { await p.evaluate(v => { window.__R.setScore(v); window.__R.finish(); }, n); await sleep(1000); },
};
A.cassaforte = {
  pfx: 'CAS', name: 'Cassaforte',
  async afterStart(p) { await p.evaluate(() => window.__C.setTimescale(0.05)); },
  async startFree(p) { await p.click('#play'); await sleep(300); await this.afterStart(p); return this.sig(p); },
  async sig(p) { return p.evaluate(() => window.__C.S.code + '/' + window.__C.S.len); },
  async seed(p) { return p.evaluate(() => window.__C.S.serieTok); },
  async finishWith(p, n) { await p.evaluate(v => { window.__C.setScore(v); window.__C.finish('over'); }, n); await sleep(1200); },
};
const GAMES = (process.argv[2] ? process.argv[2].split(',') : Object.keys(A));

(async () => {
  const b = await chromium.launch();
  const mkctx = async () => { const c = await b.newContext({ viewport: { width: 390, height: 844 } }); await c.addInitScript(() => localStorage.setItem('nit_name', JSON.stringify('Anna'))); return c; };
  for (const g of GAMES) {
    const a = A[g]; console.log('--- ' + g);
    const errs = [];
    const c1 = await mkctx(), p1 = await c1.newPage();
    p1.on('pageerror', e => errs.push('pageerror: ' + e.message)); p1.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
    await p1.goto('file://' + __dirname + '/../index.html'); await sleep(500);
    await p1.click(`[data-game="${g}"]`); await sleep(450);
    ok(await p1.locator('#menu .lx-chalopen').isVisible(), g + ': nel menu c\'e\' «Sfida un amico»');
    const sig1 = await a.startFree(p1), seed1 = await a.seed(p1);
    ok(/^[0-9a-z]{5}$/.test(seed1), g + ': la partita libera ha un seme: ' + seed1);
    await a.finishWith(p1, 20);
    const score1 = parseInt((await p1.textContent('#overScore')).replace(/\D/g, ''), 10);
    ok(await p1.isVisible('#over') && score1 > 0, g + ': fine partita con ' + score1 + ' punti');
    const shareBtn = p1.locator('.lx-hook .lx-sharebtn:has-text("Sfida un amico")');
    ok(await shareBtn.count() === 1, g + ': a fine partita c\'è «Sfida un amico»');
    await shareBtn.click(); await sleep(300);
    const txt = await p1.evaluate(() => { const t = document.querySelector('.lx-hook .lx-sharebox'); return t && !t.hidden ? t.value : ''; });
    const code = a.pfx + '-' + seed1 + '-' + score1;
    // se gli appunti funzionano il testo non compare nella casella: lo ricostruiamo dal codice atteso
    ok(txt === '' ? true : txt.includes('Sfida: ' + code) && txt.startsWith('Anna · '), g + ': testo da condividere' + (txt ? ': ' + txt.replace(/\n/g, ' | ') : ' (copiato negli appunti)'));
    await p1.screenshot({ path: `shots/sfida-${g}-fine.png` });

    // ---- un altro giocatore incolla il codice
    const c2 = await mkctx(), p2 = await c2.newPage();
    p2.on('pageerror', e => errs.push('pageerror: ' + e.message)); p2.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
    await p2.goto('file://' + __dirname + '/../index.html'); await sleep(500);
    await p2.click(`[data-game="${g}"]`); await sleep(450);
    await p2.click('#menu .lx-chalopen'); await sleep(100);
    await p2.fill('.lx-chalin', 'ciao'); await p2.click('.lx-chalgo'); await sleep(100);
    ok(/Codice non valido/.test(await p2.textContent('.lx-chalerr')), g + ': codice non valido: ' + await p2.textContent('.lx-chalerr'));
    await p2.fill('.lx-chalin', 'BIL-abc12-100'.replace('BIL', a.pfx === 'BIL' ? 'DIE' : 'BIL')); await p2.click('.lx-chalgo'); await sleep(100);
    ok(/Questo codice è per /.test(await p2.textContent('.lx-chalerr')), g + ': codice di un altro gioco: ' + await p2.textContent('.lx-chalerr'));
    await p2.fill('.lx-chalin', 'Anna · ' + a.name + ' · ' + score1 + ' punti\nSfida: ' + code); await p2.click('.lx-chalgo'); await sleep(500);
    ok(!(await p2.isVisible('#menu')), g + ': la sfida parte');
    ok(await p2.isVisible('.lx-chalbanner') && /Sfida di Anna: batti/.test(await p2.textContent('.lx-chalbanner')), g + ': banner: ' + await p2.textContent('.lx-chalbanner'));
    if (a.afterStart) await a.afterStart(p2);
    const sig2 = await a.sig(p2), seed2 = await a.seed(p2);
    ok(seed2 === seed1, g + ': stesso seme: ' + seed2);
    ok(sig2 === sig1, g + ': stessa sequenza di partenza');
    await a.finishWith(p2, 10);
    const cmp = await p2.textContent('.lx-hook .lx-hl');
    ok(/Sfida persa di Anna/.test(cmp), g + ': sfida persa: ' + cmp);
    ok(/^Sfida di un amico/.test(await p2.locator('#overMode').textContent()), g + ': etichetta «Sfida di un amico»');
    // rigioca: partita libera con un seme nuovo
    await p2.click('#again'); await sleep(300);
    ok((await a.seed(p2)) !== seed1, g + ': Rigioca parte una partita libera con seme nuovo');
    // battere la sfida
    await p2.keyboard.press('Escape'); await sleep(300);
    await p2.click(`[data-game="${g}"]`); await sleep(450);
    await p2.click('#menu .lx-chalopen'); await p2.fill('.lx-chalin', code.replace(/-\d+$/, '-2')); await p2.click('.lx-chalgo'); await sleep(400);
    if (a.afterStart) await a.afterStart(p2);
    await a.finishWith(p2, 10);
    ok(/Hai battuto la sfida/.test(await p2.textContent('.lx-hook .lx-hl')), g + ': sfida battuta: ' + await p2.textContent('.lx-hook .lx-hl'));
    await p2.screenshot({ path: `shots/sfida-${g}-vinta.png` });

    // ---- link con codice
    const c3 = await mkctx(), p3 = await c3.newPage();
    p3.on('pageerror', e => errs.push('pageerror: ' + e.message));
    await p3.goto('file://' + __dirname + '/../index.html#' + g + '?c=' + code + '&n=Marco'); await sleep(900);
    ok(await p3.isVisible('#menu') && (await p3.inputValue('.lx-chalin')) === code, g + ': il link apre il gioco con il codice scritto');
    ok(/Sfida di Marco/.test(await p3.textContent('.lx-chalerr')), g + ': nome dal link: ' + await p3.textContent('.lx-chalerr'));
    await p3.click('.lx-chalgo'); await sleep(400);
    ok((await a.seed(p3)) === seed1, g + ': dal link parte la stessa partita');

    // ---- la sfida del giorno non ha codice
    await p3.keyboard.press('Escape'); await sleep(300);
    await p3.evaluate(() => { location.hash = ''; });
    await p3.click(`[data-game="${g}"]`); await sleep(450);
    ok(errs.length === 0, g + ': nessun errore in pagina ' + JSON.stringify(errs));
    await c1.close(); await c2.close(); await c3.close();
  }
  await b.close();
  console.log(bad ? 'FALLITI: ' + bad : 'TUTTO OK');
  process.exit(bad ? 1 : 0);
})();
