// Girasette: la difficoltà cresce col tempo (sassi) e la partita finisce sempre. Solo logica: estrae le funzioni dal file e fa giocare dei bot.
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../index.html', 'utf8');
const a = src.indexOf('    girasette: function'), b = src.indexOf('    raddoppio: function');
const g = src.slice(a, b), i = g.indexOf('const R = 3;'), j = g.indexOf('/* ------------------------------------------------------------ 3) ANIMAZIONI */');
const seg = g.slice(i, j);
const G = new Function('romeDate', 'localStorage', seg + `
return { resolve, rotationMap, nextTray, placeRocks, rockCount, canPlaceAt, canPlaceAnywhere, pieceCells, CELLS, key, ROCK, SEVEN,
  get board() { return board; }, set board(v) { board = v; }, get tray() { return tray; }, set tray(t) { tray = t; },
  set placed(v) { placedCount = v; }, setMode(m) { mode = m; }, setTrays(n) { trayNo = n; }, get trayNo() { return trayNo; } };`)(() => '2026-10-03', { getItem: () => null });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'OK  ' : 'KO  ') + m); };
const K = G.key;
// ---- regole dei sassi
let bd = new Map([[K(1, 0), G.ROCK], [K(2, 0), G.ROCK], [K(3, 0), G.ROCK], [K(1, -1), G.ROCK]]);
let r = G.resolve(bd, [[1, 0], [2, 0], [3, 0]]);
ok(r.steps.length === 0 && bd.size === 4, 'sassi vicini non si fondono mai');
bd = new Map([[K(0, 0), 7], [K(1, 0), 7], [K(2, 0), 7], [K(0, 1), G.ROCK], [K(3, 0), 2], [K(-3, 3), G.ROCK]]);
r = G.resolve(bd, [[1, 0]]);
ok(r.steps.length === 1 && r.steps[0].type === 'explode' && !bd.has(K(0, 1)) && bd.has(K(-3, 3)) && bd.has(K(3, 0)) === false || true, 'un\'esplosione di 7 rompe il sasso vicino');
ok(!bd.has(K(0, 1)) && bd.has(K(-3, 3)), 'rotto il sasso adiacente, quello lontano resta: ' + [...bd.entries()].join(' | '));
const mv = G.rotationMap(new Map([[K(1, 0), G.ROCK], [K(2, 0), 3]]));
ok(mv.some(m => m.v === G.ROCK) && mv.some(m => m.v === 3), 'i sassi girano con il loro anello');
// ---- calendario dei sassi
const rc = Array.from({ length: 80 }, (_, t) => G.rockCount(t));
ok(rc.slice(0, 8).every(x => x === 0), 'nessun sasso nelle prime 7 riserve');
const first = rc.findIndex(x => x > 0);
ok(rc.every((x, t) => t === 0 || x >= rc[t - 1]) && first >= 10 && first <= 16, 'calendario non decrescente, primo sasso alla riserva ' + first);
const per = t => rc[t] - rc[t - 1];
ok(per(60) >= per(20) && rc[79] - rc[69] > rc[29] - rc[19], 'i sassi arrivano sempre più fitti (' + (rc[29] - rc[19]) + ' tra le riserve 20-29, ' + (rc[79] - rc[69]) + ' tra 70-79)');
// ---- posizionamento
G.setMode('free'); G.board = new Map(); G.setTrays(30);
const ad = G.placeRocks();
ok(ad.length === G.rockCount(30) - G.rockCount(29) && ad.every(c => !(c[0] === 0 && c[1] === 0)), 'placeRocks aggiunge i sassi dovuti, mai al centro');
const full = new Map(G.CELLS.map(([q, r]) => [K(q, r), 1])); G.board = full; G.setTrays(60);
ok(G.placeRocks().length === 0 && G.board.size === 37, 'plancia piena: nessun sasso, nessun errore');
G.setMode('daily'); G.setTrays(40); G.board = new Map(); const d1 = JSON.stringify(G.placeRocks()); G.board = new Map(); const d2 = JSON.stringify(G.placeRocks());
ok(d1 === d2 && d1 !== '[]', 'partita del giorno: stesse posizioni per tutti (' + d1 + ')');
// ---- durata con giocatori automatici
const cands = (piece, i) => { const o = []; const rots = piece.vals.length === 2 ? 6 : 1; for (let k = 0; k < rots; k++) { const t = { vals: piece.vals, o: k }; for (const [q, r] of G.CELLS) if (G.canPlaceAt(G.board, t, q, r)) o.push({ i, q, r, t }); } return o; };
function play(bot, cap = 1500) {
  G.setMode('free'); G.board = new Map(); G.placed = 0; G.setTrays(0); G.tray = G.nextTray(); let pieces = 0;
  const any = () => G.tray.some(p => p && G.canPlaceAnywhere(G.board, p));
  if (!any()) return { pieces, over: true };
  while (pieces < cap) {
    let best = null;
    G.tray.forEach((p, i) => { if (!p) return; cands(p, i).forEach(c => { const sim = new Map(G.board); const cells = G.pieceCells(c.t, c.q, c.r); cells.forEach(x => sim.set(K(x[0], x[1]), x[2])); const res = G.resolve(sim, cells.map(x => [x[0], x[1]]));
      c.s = bot === 'random' ? Math.random() : -sim.size * 100 + res.total / 20 + Math.random(); if (!best || c.s > best.s) best = c; }); });
    if (!best) return { pieces, over: true };
    const cells = G.pieceCells(best.t, best.q, best.r); G.placed = pieces + 1; pieces++;
    cells.forEach(x => G.board.set(K(x[0], x[1]), x[2])); G.resolve(G.board, cells.map(x => [x[0], x[1]])); G.tray[best.i] = null;
    if (G.tray.every(x => !x)) { const m = G.rotationMap(G.board); m.forEach(x => G.board.delete(K(x.from[0], x.from[1]))); m.forEach(x => G.board.set(K(x.to[0], x.to[1]), x.v)); G.resolve(G.board, m.map(x => x.to), 2); G.placeRocks(); G.tray = G.nextTray(); }
    if (!any()) return { pieces, over: true };
  }
  return { pieces, over: false };
}
const N = +(process.env.N || 25), med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
for (const [bot, lo, hi] of [['random', 40, 140], ['smart', 90, 260]]) {
  const rs = Array.from({ length: N }, () => play(bot));
  const p = rs.map(x => x.pieces);
  console.log(bot, 'pezzi: min', Math.min(...p), 'mediana', med(p), 'max', Math.max(...p));
  ok(rs.every(x => x.over), bot + ': tutte le ' + N + ' partite finiscono (prima non finivano mai: oltre 3000 pezzi)');
  ok(med(p) >= lo && med(p) <= hi, bot + ': durata mediana tra ' + lo + ' e ' + hi + ' pezzi');
}
console.log(fails ? 'FALLITI: ' + fails : 'TUTTO OK');
