// Bot "bravi" a velocità umana: misurano quanto dura una partita giocata bene.
const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, 'nit-test.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CAP = +(process.env.CAP || 240000);
const SPEED = +(process.env.SPEED || 1); // >1 = giocatore più lento
const S = page => page.evaluate(() => { const s = window.__S; return JSON.parse(JSON.stringify(s, (k, v) => ['particles', 'shards', 'popups', 'rnd', 'clearing'].includes(k) ? undefined : v)); });
const isPrime = n => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };

const bots = {
  async bilancia(page) {
    const s = await S(page); if (!s.cur) return sleep(200);
    const sums = s.plates.map(p => p.sum);
    for (const f of s.flights || []) { if (f.w.k === 'x2') sums[f.side] *= 2; else sums[f.side] += f.w.v; }
    const after = side => { const t = sums.slice(); if (s.cur.k === 'x2') t[side] *= 2; else t[side] += s.cur.v; return t[0] - t[1]; };
    const d0 = after(0), d1 = after(1);
    const side = d0 === 0 ? 0 : d1 === 0 ? 1 : Math.abs(d0) <= Math.abs(d1) ? 0 : 1;
    await page.keyboard.press(side ? 'ArrowRight' : 'ArrowLeft');
    await sleep(700 * SPEED);
  },
  async quadrante(page) {
    const s = await S(page);
    const m = x => ((x % 12) + 12) % 12;
    const tg = new Set(s.targets.map(t => t.p)), hz = new Set(s.hazards);
    let pick = s.cards.findIndex(c => tg.has(m(s.pos + c)));
    if (pick < 0) {
      // nessun colpo diretto: carta sicura che porta a un'ora da cui un'altra carta colpisce
      const safe = s.cards.map((c, i) => i).filter(i => !hz.has(m(s.pos + s.cards[i])));
      pick = safe.find(i => s.cards.some((c, j) => j !== i && tg.has(m(s.pos + s.cards[i] + c)))) ?? safe[0] ?? 0;
      await sleep(600 * SPEED);
    }
    await page.click('#card' + pick, { timeout: 1000 }).catch(() => {});
    await sleep(900 * SPEED);
  },
  async primo(page) {
    const s = await S(page); if (!s.stack.length) return sleep(100);
    const n = s.stack[0].n;
    if (isPrime(n)) await page.click('#isPrime', { timeout: 1000 }).catch(() => {});
    else { const p = [2, 3, 5, 7, 11, 13].find(p => n % p === 0); await page.click('#k' + p, { timeout: 1000 }).catch(() => {}); }
    await sleep(550 * SPEED);
  },
  async resto(page) {
    const s = await S(page); if (!s.cust || s.busy) return sleep(150);
    await sleep(2500 * SPEED);
    let ch = s.cust.change;
    for (const v of [2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1]) while (ch >= v) { await page.click('#p' + v, { timeout: 1000 }).catch(() => {}); ch -= v; await sleep(450 * SPEED); }
    await sleep(900);
  },
};

(async () => {
  const browser = await chromium.launch();
  const games = (process.env.GAMES || 'bilancia,quadrante,primo,resto').split(',');
  await Promise.all(games.map(async g => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(FILE + '#' + g); await sleep(600);
    await page.click('#play'); await sleep(300);
    const t0 = Date.now(), trace = [];
    while (Date.now() - t0 < CAP && !(await page.isVisible('#over'))) {
      await bots[g](page);
      const s = await S(page); const sec = Math.round((Date.now() - t0) / 1000);
      if (!trace.length || sec - trace[trace.length - 1].t >= 30) trace.push({ t: sec, score: s.score, level: s.level, time: s.time, rubies: s.rubies, stars: s.stars, stack: s.stack && s.stack.length });
    }
    const s = await S(page);
    console.log(JSON.stringify({ game: g, speed: SPEED, secs: Math.round((Date.now() - t0) / 1000), over: await page.isVisible('#over'), score: s.score, level: s.level, perfects: s.perfects, trace, errs }));
    await ctx.close();
  }));
  await browser.close();
})();
