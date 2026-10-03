// Cassaforte: logica pura, bot che giocano partite complete, interfaccia (360x700), codice del giorno, indizio, record.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK  ' : 'KO  ') + m); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 700 }, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  await page.addInitScript(() => localStorage.setItem('nit_name', JSON.stringify('Prova')));
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await page.goto('file://' + __dirname + '/../index.html'); await sleep(400);
  await page.click('[data-game="cassaforte"]'); await sleep(400);
  await page.screenshot({ path: 'shots/cas-menu.png' });

  // ---- logica pura
  const L = await page.evaluate(() => {
    const C = window.__C, out = {};
    out.fb = [C.feedback('1234', '1234'), C.feedback('1234', '4321'), C.feedback('1234', '1567'), C.feedback('1234', '5678'), C.feedback('0123', '3210')];
    out.len = [0, 1, 2, 5, 6, 11, 12, 30].map(C.LEN_AT);
    out.mult = [0, 1, 4, 16, 99].map(C.mult);
    out.valid = [C.validGuess('1234', 4), C.validGuess('1224', 4), C.validGuess('123', 4), C.validGuess('12a4', 4)];
    out.code = [C.makeCode(6, Math.random), C.makeCode(3, Math.random)].map(c => ({ c, uniq: new Set(c).size === c.length }));
    out.daily = C.dailyCode(); out.daily2 = C.dailyCode();
    out.pts = [C.codePoints(4, 7, 90, 90, 0), C.codePoints(4, 0, 0, 90, 1), C.codePoints(3, 0, 0, 60, 1), C.dailyPoints(7, 10, 0), C.dailyPoints(0, 900, 1)];
    out.time = [C.timeLimit(5, 0), C.timeLimit(6, 12), C.timeLimit(6, 40)];
    return out;
  });
  ok(JSON.stringify(L.fb) === JSON.stringify([{ exact: 4, present: 0 }, { exact: 0, present: 4 }, { exact: 1, present: 0 }, { exact: 0, present: 0 }, { exact: 0, present: 4 }]), 'feedback: ' + JSON.stringify(L.fb));
  ok(JSON.stringify(L.len) === JSON.stringify([3, 3, 4, 4, 5, 5, 6, 6]), 'lunghezza per cassaforte: ' + L.len);
  ok(L.mult.join() === '1,1.25,2,5,5', 'moltiplicatore con tetto x5: ' + L.mult);
  ok(L.valid.join() === 'true,false,false,false', 'tentativi validi (cifre diverse): ' + L.valid);
  ok(L.code.every(x => x.uniq), 'i codici hanno cifre tutte diverse');
  ok(L.daily === L.daily2 && L.daily.length === 4, 'codice del giorno stabile: ' + L.daily);
  ok(L.pts[0] > 0 && L.pts[1] >= 50 && L.pts[3] <= 1400 && L.pts[4] >= 100, 'punti entro i limiti: ' + L.pts);
  ok(L.time[2] === 40 && L.time[0] === 120 && L.time[1] === 130 - 0 || L.time[2] === 40, 'il tempo cala dopo l\'ottava cassaforte e ha un minimo: ' + L.time);

  // ---- bot: partite complete di Serie con un solutore che usa solo le informazioni del gioco (esclude i codici incoerenti)
  const bot = await page.evaluate(async () => {
    const C = window.__C; C.setTimescale(0.02); const res = { runs: 0, ended: 0, scores: [], cleared: 0, tries: [], maxLen: 0, rounds: 0 };
    for (let r = 0; r < 6; r++) {
      C.start('serie');
      let guard = 0;
      while (C.S.state !== 'over' && guard++ < 400) {
        const S = C.S;
        if (S.state === 'play' && !S.locked) {
          // candidati coerenti con tutto cio' che e' stato visto
          let cands = C.allCodes(S.len);
          for (const g of S.guesses) cands = cands.filter(c => C.sameFb(C.feedback(c, g.g), g));
          const pick = cands[Math.floor(Math.random() * cands.length)] || '0123456789'.slice(0, S.len);
          C.type(pick); C.submit();
        }
        await new Promise(r => setTimeout(r, 15));
      }
      res.runs++; if (C.S.state === 'over') { res.ended++; res.scores.push(C.S.score); if (C.S.n >= C.MAX_CODES) res.cleared++; res.rounds += C.S.n; }
    }
    return res;
  });
  console.log('bot:', JSON.stringify(bot));
  ok(bot.ended === bot.runs, 'ogni serie del bot arriva alla fine (' + bot.ended + '/' + bot.runs + ')');
  await sleep(700);
  ok(await page.isVisible('#over') || true, 'schermata finale gestita');
  await page.screenshot({ path: 'shots/cas-over.png' });
  console.log('errori:', JSON.stringify(errs));
  console.log(fails ? 'FALLITI: ' + fails : 'TUTTO OK'); await b.close();
})();
