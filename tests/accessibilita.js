// Accessibilita': struttura del documento, finestre che trattengono il fuoco, nomi dei campi di gioco, annunci, contrasto e bersagli di tocco.
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) bad++; };
// contrasto del testo (sfondi sfumati: caso peggiore tra i colori dello sfumato), bersagli di tocco, testo piccolo
const probe = () => {
  const parse = c => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(c); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage && cs.backgroundImage !== 'none' && /gradient/.test(cs.backgroundImage)) { const cols = [...cs.backgroundImage.matchAll(/rgba?\([^)]*\)/g)].map(m => parse(m[0])).filter(c => c && c[3] > 0.5); if (cols.length) return { cols, grad: true }; } const c = parse(cs.backgroundColor); if (c && c[3] > 0.5) return { cols: [c], grad: false }; } return { cols: [[255, 255, 255, 1]], grad: false }; };
  const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05 && r.bottom > 0 && r.right > 0 && r.left < innerWidth + 1; };
  const low = [], small = [], tiny = [];
  const root = document.querySelector('.lx-holder #menu') || document.querySelector('.lx-page') || document.body;
  root.querySelectorAll('*').forEach(el => {
    if (!vis(el) || el.closest('[aria-hidden="true"]')) return;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (own) {
      const cs = getComputedStyle(el), fg = parse(cs.color), { cols, grad } = bgOf(el);
      if (fg) {
        const op = fg[3] * (+cs.opacity || 1);
        const fs = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700, large = fs >= 24 || (fs >= 18.66 && bold);
        const r = Math.min(...cols.map(bg => ratio([0, 1, 2].map(i => Math.round(fg[i] * op + bg[i] * (1 - op))), bg)));
        if (r < (large ? 3 : 4.5)) low.push({ t: el.textContent.trim().slice(0, 40), r: +r.toFixed(2), fs, grad, cls: (el.className || el.tagName).toString().slice(0, 30) });
        if (fs < 12) tiny.push({ t: el.textContent.trim().slice(0, 30), fs });
      }
    }
    if (el.matches('button, a[href], input, select, textarea, [role=button]')) {
      const r = el.getBoundingClientRect();
      if (r.width < 44 || r.height < 44) small.push({ t: (el.textContent || el.placeholder || el.id || el.tagName).trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
    }
  });
  return { low, small, tiny, ox: document.documentElement.scrollWidth - innerWidth };
};

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 } });
  await ctx.addInitScript(() => localStorage.setItem('nit_name', JSON.stringify('Prova')));
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => m.type() === 'error' && !/ERR_CERT|Failed to load resource/.test(m.text()) && errs.push(m.text()));
  await p.route('**/fonts.*/**', r => r.abort()); await p.route('**/supabase.co/**', r => r.abort());
  await p.goto('file://' + __dirname + '/../index.html'); await sleep(500);

  // ---- 1) struttura del documento
  const st = await p.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, bodyTitle: !!document.body.querySelector('title'), bodyMeta: document.body.querySelectorAll('meta').length, bodyStyle: document.body.querySelectorAll(':scope > style').length, theme: document.querySelectorAll('meta[name="theme-color"]').length, icon: !!document.querySelector('link[rel="icon"]'), docType: document.doctype && document.doctype.name }));
  ok(st.lang === 'it' && st.docType === 'html', 'lingua del documento: ' + st.lang);
  ok(st.title === 'Numeri in Tasca' && !st.bodyTitle && st.bodyMeta === 0 && st.bodyStyle === 0, 'titolo, meta e stili stanno nell\'head, non nel body');
  ok(st.theme === 2 && st.icon, 'colore della barra del browser e icona del sito presenti');

  // ---- 2) finestre: il fuoco non esce, il resto e' inerte, il fuoco torna all'apertura
  const trap = async (openSel, panel, label) => {
    await p.focus(openSel); await p.click(openSel); await sleep(600);
    let out = 0, seen = new Set();
    for (let i = 0; i < 30; i++) { await p.keyboard.press(i % 7 === 6 ? 'Shift+Tab' : 'Tab'); const r = await p.evaluate(sel => { const a = document.activeElement; return { inside: !!a.closest(sel), id: a.id || a.className }; }, panel); if (!r.inside) out++; seen.add(r.id); }
    ok(out === 0 && seen.size >= 2, label + ': 30 pressioni di Tab/Maiusc+Tab, fuori dalla finestra: ' + out + ' (elementi raggiunti: ' + seen.size + ')');
    ok(await p.evaluate(() => document.getElementById('lx-launcher').inert === true), label + ': la home dietro e\' inerte');
    await p.keyboard.press('Escape'); await sleep(250);
    ok(await p.evaluate(() => document.getElementById('lx-launcher').inert === false), label + ': chiusa la finestra la home torna attiva');
    ok(await p.evaluate(s => document.activeElement === document.querySelector(s), openSel), label + ': il fuoco torna sul pulsante che l\'ha aperta');
  };
  await trap('#lx-pubbtn', '#lx-pubpanel', 'Classifiche');
  await trap('#lx-recbtn', '#lx-recpanel', 'I miei record');

  // ---- 3) dentro i giochi: istruzioni con fuoco trattenuto, pannello Record, nomi dei campi di gioco
  await p.click('[data-game="bilancia"]'); await sleep(450);
  await p.click('#menu .lx-help:not(.lx-recopen)'); await sleep(300);
  let out2 = 0; for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); if (!(await p.evaluate(() => !!document.activeElement.closest('.lx-howto')))) out2++; }
  ok(out2 === 0, 'istruzioni: il fuoco resta nella finestra (' + out2 + ' uscite su 12)');
  ok(await p.evaluate(() => [...document.querySelector('.lx-holder').children].filter(c => !c.classList.contains('lx-howto')).every(c => c.inert)), 'istruzioni: il gioco dietro e\' inerte');
  await p.keyboard.press('Escape'); await sleep(250);
  ok(await p.evaluate(() => [...document.querySelector('.lx-holder').children].every(c => !c.inert)), 'istruzioni chiuse: il gioco torna attivo');
  await p.keyboard.press('Escape'); await sleep(300);
  for (const g of ['bilancia', 'quadrante', 'primo', 'girasette', 'lampo']) {
    await p.click(`[data-game="${g}"]`); await sleep(450);
    const cv = await p.evaluate(() => [...document.querySelectorAll('.lx-holder canvas')].map(c => ({ n: c.getAttribute('aria-label'), r: c.getAttribute('role') })));
    ok(cv.length >= 1 && cv.every(c => c.n && c.n.length > 20 && c.r === 'img'), g + ': il campo di gioco ha un nome: ' + (cv[0] && cv[0].n));
    await p.keyboard.press('Escape'); await sleep(250);
  }

  // ---- 4) annuncio dell'esito a fine partita (Dieci: tempo scaduto)
  await p.click('[data-game="dieci"]'); await sleep(450); await p.click('#play'); await sleep(300);
  await p.evaluate(() => { window.__D.setScore ? 0 : 0; window.__D.setTime(0.2); }); await sleep(1800);
  const said = await p.textContent('#lx-live');
  ok(/Tempo scaduto/.test(said) && /Dieci/.test(said) && /punti/.test(said), 'a fine partita i lettori di schermo ricevono: «' + said + '»');
  await p.keyboard.press('Escape'); await sleep(250);

  // ---- 5) contrasto e bersagli di tocco
  const home = await p.evaluate(probe);
  ok(home.low.length === 0, 'home: nessun testo sotto il contrasto minimo ' + JSON.stringify(home.low.map(x => [x.r, x.fs, x.t])));
  for (const g of ['resto', 'bilancia', 'raddoppio', 'sentiero', 'dieci']) {
    await p.click(`[data-game="${g}"]`); await sleep(450);
    const m = await p.evaluate(probe);
    ok(m.low.length === 0, g + ': menu senza testo sotto il contrasto minimo ' + JSON.stringify(m.low.map(x => [x.r, x.fs, x.t])));
    const back = await p.evaluate(() => { const r = document.querySelector('.lx-holder .lx-backtop').getBoundingClientRect(); return Math.round(r.height); });
    ok(back >= 44, g + ': «← Tutti i giochi» alto ' + back + ' px');
    await p.keyboard.press('Escape'); await sleep(250);
  }
  await p.reload(); await sleep(500);
  const ch = await p.evaluate(() => { const r = document.getElementById('lx-namechange').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
  ok(ch.h >= 44 && ch.w >= 44, '«Cambia» (nome) ' + ch.w + 'x' + ch.h + ' px');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'nessuno scorrimento orizzontale');
  ok(errs.length === 0, 'nessun errore in pagina ' + JSON.stringify(errs));
  await b.close();
  console.log(bad ? 'FALLITI: ' + bad : 'TUTTO OK');
  process.exit(bad ? 1 : 0);
})();
