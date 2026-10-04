// Adattatori per i test dei giochi: come avviare una partita, la "firma" del contenuto iniziale, il seme, come finirla con un punteggio dato.
const sleep = ms => new Promise(r => setTimeout(r, ms));
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
A.girasette = {
  name: 'Girasette',
  async finishWith(p, n) { await p.evaluate(v => { window.__M7.setScore(v); window.__M7.endGame(); }, n); await sleep(1200); },
};
A.lampo = {
  name: 'Lampo',
  async finishWith(p, n) { await p.evaluate(v => { window.__L.setScore(v); window.__L.gameOver(); }, n); await sleep(1500); },
};
module.exports = A;
