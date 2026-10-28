'use strict';
// Kindergarten, 1st and 2nd grade: counting pictures, ten frames, base-ten blocks, number lines, clocks, coins, rulers, graphs, shapes, fractions.
(() => {
  const { textual } = Questions.kit, F = Figures, { INK, DIM, GRID, HOT, RED, GRN, BLU } = F.C;
  const { line, box, disc, circle, label, fillPoly, outlinePoly } = F;
  const LITE = '#b0bce0', PLAIN = '#28305e';

  // ---- Choices and words
  // Four numbers, smallest first, none below lo: the answer and the likeliest mistakes, then near misses.
  // Kids spot patterns, so the answer lands in a random slot: t wrong answers come from below it, 3 - t from above,
  // each side taking its planned mistakes first.
  function nums(right, wrongs, fmt = String, lo = 0) {
    const seen = new Set([fmt(right)]), below = [], above = [];
    const add = v => { if (!Number.isInteger(v) || v < lo || seen.has(fmt(v))) return; seen.add(fmt(v)); (v < right ? below : above).push(v); };
    wrongs.forEach(add);
    for (let k = 1; k <= 12 && (below.length < 3 || above.length < 3); k++) { add(right - k); add(right + k); }
    const t = pick([0, 1, 2, 3].filter(t => below.length >= t && above.length >= 3 - t));
    const vals = [...below.slice(0, t), right, ...above.slice(0, 3 - t)].sort((a, b) => a - b);
    return { choices: vals.map(fmt), answer: vals.indexOf(right) };
  }
  // Money read aloud: "$1.25" as 1 dollar and 25 cents, "35¢" as 35 cents.
  const sayMoney = s => s.replace(/\$(\d+)\.(\d\d)/g, (_, d, c) => `${d} ${d === '1' ? 'dollar' : 'dollars'}${+c ? ` and ${+c} cents` : ''}`)
    .replace(/\$(\d+)/g, (_, d) => `${d} ${d === '1' ? 'dollar' : 'dollars'}`).replace(/(\d+)¢/g, (_, c) => `${c} ${c === '1' ? 'cent' : 'cents'}`);
  // The same in a jumbled order, for "which is biggest?", where smallest-first would give it away.
  // Only the wrongs given, never fillers: a filler could be bigger than "the biggest", a second right answer.
  function jumble(right, wrongs, fmt = String) {
    const all = [right];
    for (const v of wrongs) if (all.length < 4 && !all.some(u => fmt(u) === fmt(v))) all.push(v);
    shuffle(all);
    return { choices: all.map(fmt), answer: all.indexOf(right) };
  }
  const opts = (right, wrongs) => textual(right, wrongs.filter(w => w !== right));
  const which = i => ({ choices: ['1', '2', '3', '4'], answer: i });
  const range = (a, b) => { const r = []; for (let v = a; v <= b; v++) r.push(v); return r; };
  const pickN = (a, k) => shuffle(a.slice()).slice(0, k);
  const upto = n => range(1, n).join(', ');
  const cap = s => s[0].toUpperCase() + s.slice(1);

  const PEOPLE = 'Ana she,Jamal he,Mei she,Leo he,Priya she,Sam he,Diego he,Zoe she,Omar he,Lily she,Kai he,Rosa she,Ben he,Maya she,Noah he,Ivy she,Theo he,Nia she'
    .split(',').map(s => s.split(' '));
  const person = ([n, s]) => ({ n, he: s, He: cap(s), his: s === 'he' ? 'his' : 'her', him: s === 'he' ? 'him' : 'her' });
  const kids = k => pickN(PEOPLE, k).map(person);

  const comma = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const money = v => v < 100 ? v + '¢' : '$' + Math.floor(v / 100) + '.' + String(v % 100).padStart(2, '0');
  const hm = (h, m) => h + ':' + String(m).padStart(2, '0');
  const ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ');
  const TENS = ',,twenty,thirty,forty,fifty,sixty,seventy,eighty,ninety'.split(',');
  const words99 = n => n < 20 ? ONES[n] : TENS[n / 10 | 0] + (n % 10 ? '-' + ONES[n % 10] : '');
  const wordsOf = n => n >= 1000 ? 'one thousand' : n < 100 ? words99(n) : ONES[n / 100 | 0] + ' hundred' + (n % 100 ? ' ' + words99(n % 100) : '');

  // The column slips: adding without carrying, and taking the smaller digit from the bigger one.
  function colwise(a, b, f) { let r = 0, p = 1; while (a || b) { r += f(a % 10, b % 10) * p; a = Math.floor(a / 10); b = Math.floor(b / 10); p *= 10; } return r; }
  const noCarry = (a, b) => colwise(a, b, (x, y) => (x + y) % 10);
  const noBorrow = (a, b) => colwise(a, b, (x, y) => Math.abs(x - y));
  const carries = (a, b) => noCarry(a, b) !== a + b;
  const borrows = (a, b) => noBorrow(a, b) !== a - b;

  // ---- Drawing kit
  const ink = (c, s, x, y, col = INK) => Font.draw(c, String(s), x, y - 3, col, { align: 'center' });
  const frame = (c, x, y, w, h, col) => { box(c, x, y, w, 1, col); box(c, x, y + h - 1, w, 1, col); box(c, x, y, 1, h, col); box(c, x + w - 1, y, 1, h, col); };
  const ICONS = Object.keys(F.ICON_NAMES);
  const plural = (name, n = 2) => n === 1 ? name : F.ICON_NAMES[name];
  // The kit's 9 x 9 pictures, drawn s pixels to a dot (s = 2 for the youngest players).
  function icon(c, name, x, y, s = 1) {
    if (s === 1) return F.icon(c, name, x, y);
    F.ICONS[name].forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') { c.fillStyle = F.PAL[row[i]]; c.fillRect(Math.round(x) + i * s, Math.round(y) + j * s, s, s); } });
  }
  const cross = (c, x, y, s = 1) => { const e = 9 * s; for (let o = 0; o <= s; o++) { line(c, x - 1 + o, y - 1, x + e + o - 1, y + e, RED); line(c, x + e + o - 1, y - 1, x - 1 + o, y + e, RED); } };
  // A big plus or minus sign, 7 (or 7s) pixels across.
  const sign = (c, x, y, plus, col = HOT, s = 1) => { box(c, x, y + 3 * s, 7 * s, s, col); if (plus) box(c, x + 3 * s, y, s, 7 * s, col); };

  // Where n little pictures go: in a line, rows of 5, rows of 10, a ring, or scattered. Top-left corners, s pixels to a dot.
  function spread(n, how, s = 1) {
    let pts = [];
    const P = 11 * s;
    if (how === 'line') for (let i = 0; i < n; i++) pts.push([i * P, 0]);
    else if (how === 'ring') {
      const R = Math.max(12 * s, Math.ceil(n * P / (2 * Math.PI)) + 1);
      for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n; pts.push([Math.round(R + R * Math.sin(a)), Math.round(R - R * Math.cos(a))]); }
    } else if (how === 'scatter') {
      for (const k of pickN(range(0, (s === 2 ? 18 : 24) - 1), n)) pts.push([(k % 6) * 13 * s + randInt(0, 4) * s, (k / 6 | 0) * 13 * s + randInt(0, 4) * s]);
    } else {
      const per = how === 'tens' ? 10 : 5;
      for (let i = 0; i < n; i++) pts.push([(i % per) * P + (per === 10 && i % 10 >= 5 ? 3 * s : 0), (i / per | 0) * P]);
    }
    const mx = Math.min(...pts.map(p => p[0])), my = Math.min(...pts.map(p => p[1]));
    pts = pts.map(([x, y]) => [x - mx, y - my]);
    return { pts, s, w: Math.max(...pts.map(p => p[0])) + 9 * s, h: Math.max(...pts.map(p => p[1])) + 9 * s };
  }
  // The biggest layout that fits the figure box: double size if it can, else single.
  const spreadFit = (n, how) => { const L = spread(n, how, 2); return L.w + 10 <= 168 && L.h + 8 <= 96 ? L : spread(n, how, 1); };
  const pics = (c, w, h, name, L) => { const x0 = Math.round((w - L.w) / 2), y0 = Math.round((h - L.h) / 2); for (const [x, y] of L.pts) icon(c, name, x0 + x, y0 + y, L.s); };
  // n pictures in rows of up to `per`, top-left at (x, y).
  function picRows(c, name, n, x, y, per = 5, s = 1) { for (let i = 0; i < n; i++) icon(c, name, x + (i % per) * 11 * s, y + (i / per | 0) * 11 * s, s); }

  // A ten frame: 2 rows of 5 boxes, the first n filled (the first `split` in col, the rest in col2).
  function tenFrame(c, x, y, n, col = RED, cs = 10, split = 10, col2 = BLU) {
    for (let i = 0; i < 10; i++) {
      const bx = x + (i % 5) * cs, by = y + (i / 5 | 0) * cs;
      box(c, bx, by, cs + 1, cs + 1, LITE); box(c, bx + 1, by + 1, cs - 1, cs - 1, '#0c1028');
      if (i >= n) continue;
      const k = i < split ? col : col2;
      if (cs >= 10) disc(c, bx + cs / 2, by + cs / 2, cs / 2 - 2, k);
      else { box(c, bx + 2, by + 3, cs - 3, cs - 5, k); box(c, bx + 3, by + 2, cs - 5, cs - 3, k); }
    }
  }
  // Number boxes in a row; null is the yellow "?" box.
  function tiles(vals) {
    const tw = Math.max(...vals.map(v => v === null ? 5 : Font.width(comma(v)))) + 9, w = vals.length * (tw + 3) - 3;
    return { size: [w + 6, 22], fig: (c, W) => {
      let x = Math.round((W - w) / 2);
      for (const v of vals) { box(c, x, 3, tw, 16, v === null ? HOT : LITE); box(c, x + 1, 4, tw - 2, 14, '#141c48'); ink(c, v === null ? '?' : comma(v), x + tw / 2, 11, v === null ? HOT : INK); x += tw + 3; }
    } };
  }
  // Four little pictures in a row, numbered 1 to 4 underneath. fn(i, x, y, w, h) draws one.
  function four(c, w, h, fn) {
    const cw = Math.floor((w - 9) / 4);
    for (let i = 0; i < 4; i++) { const x = i * (cw + 3); fn(i, x, 0, cw, h - 11); label(c, String(i + 1), x + cw / 2, h - 4, HOT); }
  }
  // Four bigger pictures, two by two, numbered in their top-left corners. fn(i, x, y, w, h) draws one (the number takes the left 12 pixels).
  function grid4(c, w, h, fn) {
    const cw = Math.floor(w / 2), ch = Math.floor(h / 2);
    line(c, cw, 2, cw, h - 3, GRID); line(c, 2, ch, w - 3, ch, GRID);
    for (let i = 0; i < 4; i++) { const x = (i % 2) * cw, y = (i >> 1) * ch; fn(i, x + 12, y, cw - 12, ch); label(c, String(i + 1), x + 6, y + 8, HOT); }
  }

  // ---- Base-ten blocks: hundreds flats, tens rods and ones cubes, at the biggest unit that fits 168 x 96.
  const BT = { fill: '#60b8f8', edge: '#16407e' };
  function unitGrid(c, x, y, cols, rows, u) {
    box(c, x, y, cols * u + 1, rows * u + 1, BT.edge);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) box(c, x + 1 + i * u, y + 1 + j * u, u - 1, u - 1, BT.fill);
  }
  function blocks(H, T, O) {
    for (const u of [4, 3]) for (const rr of [1, 2]) {
      const s = 10 * u + 1, parts = [];
      if (H) { const fc = H <= 3 ? H : H === 4 ? 2 : 3, fr = Math.ceil(H / fc), g = fr > 2 ? 1 : 2; parts.push({ k: 'H', w: fc * s + (fc - 1) * g, h: fr * s + (fr - 1) * g, fc, g }); }
      if (T) { const rows = T > 5 ? rr : 1, per = Math.ceil(T / rows); parts.push({ k: 'T', w: per * (u + 4) - 3, h: rows * s + (rows - 1) * 3, per }); }
      if (O) parts.push({ k: 'O', w: Math.ceil(O / 5) * (u + 3) - 2, h: Math.min(O, 5) * (u + 3) - 2 });
      const w = parts.reduce((a, p) => a + p.w, 0) + 8 * (parts.length - 1), h = Math.max(...parts.map(p => p.h));
      if (w > 164 || h > 96) continue;
      return { size: [Math.max(48, w + 4), Math.max(24, h)], fig: (c, W, Hh) => {
        let x = Math.round((W - w) / 2);
        for (const p of parts) {
          const y = Math.round((Hh - p.h) / 2);
          if (p.k === 'H') for (let i = 0; i < H; i++) unitGrid(c, x + (i % p.fc) * (s + p.g), y + (i / p.fc | 0) * (s + p.g), 10, 10, u);
          if (p.k === 'T') for (let i = 0; i < T; i++) unitGrid(c, x + (i % p.per) * (u + 4), y + (i / p.per | 0) * (s + 3), 1, 10, u);
          if (p.k === 'O') for (let i = 0; i < O; i++) unitGrid(c, x + (i / 5 | 0) * (u + 3), y + (i % 5) * (u + 3), 1, 1, u);
          x += p.w + 8;
        }
      } };
    }
    throw new Error(`blocks ${H} ${T} ${O} do not fit`);
  }

  // ---- Clocks. The hour hand moves between the numbers as the minutes pass: (h % 12) * 30 + m / 2 degrees.
  const FACE = '#f4eed8', RIM = '#4a5488', TICK = '#9aa0b8', NUM = '#262c50', HOURC = '#e03c30', MINC = '#2858d0';
  function hand(c, cx, cy, deg, len, col, fat) {
    const ex = cx + Math.sin(deg * DEG) * len, ey = cy - Math.cos(deg * DEG) * len;
    for (const [ox, oy] of fat ? [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] : [[0, 0], [1, 0], [0, 1]]) line(c, cx + ox, cy + oy, ex + ox, ey + oy, col);
  }
  // A big face (r 34) shows every number and minute; a small one (r 19) shows 12, 3, 6 and 9 and the hour marks.
  function clock(c, cx, cy, r, h, m) {
    const big = r >= 26;
    disc(c, cx, cy, r, RIM); disc(c, cx, cy, r - 2, FACE);
    for (let k = 0; k < 60; k++) {
      const five = k % 5 === 0;
      if (big ? false : !five || k % 15 === 0) continue;
      const a = k * 6 * DEG, r1 = r - 3, r0 = five ? r - 4 : r - 3;
      line(c, cx + Math.sin(a) * r0, cy - Math.cos(a) * r0, cx + Math.sin(a) * r1, cy - Math.cos(a) * r1, five ? NUM : TICK);
    }
    const nr = big ? r - 11 : r - 10;
    for (let k = 1; k <= 12; k++) if (big || k % 3 === 0) ink(c, k, cx + Math.sin(k * 30 * DEG) * nr, cy - Math.cos(k * 30 * DEG) * nr, NUM);
    hand(c, cx, cy, (h % 12) * 30 + m / 2, big ? 15 : 8, HOURC, true);
    hand(c, cx, cy, m * 6, big ? 24 : 13, MINC, false);
    disc(c, cx, cy, 1, '#181818');
  }
  const bigClock = (h, m) => ({ size: [84, 80], fig: c => clock(c, 42, 40, 38, h, m) });
  const fourClocks = times => ({ size: [168, 52], fig: (c, w, h) => four(c, w, h, (i, x, y, cw) => clock(c, x + Math.round(cw / 2), y + 20, 19, ...times[i])) });

  // ---- Coins and bills. A copper penny, a large silver nickel, a small silver dime, a larger silver quarter.
  const COIN = {
    p: { v: 1, r: 8, fill: '#cf7f42', rim: '#7a3a12', ring: '#a85c28', hi: '#f6b47c', name: 'penny', many: 'pennies' },
    n: { v: 5, r: 10, fill: '#b8bcc6', rim: '#5a6070', ring: '#8a909e', hi: '#eef0f6', name: 'nickel', many: 'nickels' },
    d: { v: 10, r: 7, fill: '#d2d6de', rim: '#646a7a', ring: '#a0a6b4', hi: '#f8f9fc', name: 'dime', many: 'dimes' },
    q: { v: 25, r: 12, fill: '#c6cad4', rim: '#5a6070', ring: '#9298a8', hi: '#f4f6fa', name: 'quarter', many: 'quarters' },
  };
  // A plain disc with a raised rim and a shine: size and color tell the coins apart, and the value sits underneath.
  function coin(c, cx, cy, k) {
    const C = COIN[k], r = C.r;
    disc(c, cx, cy, r, C.rim); disc(c, cx, cy, r - 1, C.fill); circle(c, cx, cy, r - 3, C.ring);
    for (let a = 285; a <= 345; a += 6) { c.fillStyle = C.hi; c.fillRect(Math.round(cx + Math.sin(a * DEG) * (r - 2)), Math.round(cy - Math.cos(a * DEG) * (r - 2)), 1, 1); }
  }
  function bill(c, x, y, v) {
    box(c, x, y, 34, 16, '#24502a'); box(c, x + 1, y + 1, 32, 14, '#a8d498'); frame(c, x + 3, y + 3, 28, 10, '#5e9a5c');
    disc(c, x + 17, y + 8, 3, '#4f8a50');
    ink(c, v, x + 8, y + 8, '#24502a'); ink(c, v, x + 26, y + 8, '#24502a');
  }
  // Money in rows: bills first, then coins, the value under each one.
  const slot = k => { const it = k[0] === '$' ? { w: 34, lab: k } : { w: 2 * COIN[k].r + 1, lab: COIN[k].v + '¢' }; return { k, lab: it.lab, sw: Math.max(it.w, Font.width(it.lab)) + 4 }; };
  const rowW = items => items.reduce((a, k) => a + slot(k).sw, 0);
  // One row of money centred on cx, coins centred on row cy, values underneath.
  function coinRow(c, cx, cy, items) {
    let x = Math.round(cx - rowW(items) / 2);
    for (const k of items) { const s = slot(k), mx = Math.round(x + s.sw / 2); if (k[0] === '$') bill(c, mx - 17, cy - 8, k.slice(1)); else coin(c, mx, cy, k); label(c, s.lab, mx, cy + 20, INK); x += s.sw; }
  }
  function cash(items) {
    const rows = [[]]; let x = 0;
    for (const k of items) { const sw = slot(k).sw; if (x + sw > 164 && rows[rows.length - 1].length) { rows.push([]); x = 0; } rows[rows.length - 1].push(k); x += sw; }
    const w = Math.max(...rows.map(rowW)), h = rows.length * 36;
    if (rows.length > 2) throw new Error('too much money to draw');
    return { size: [Math.max(48, w + 4), h + 1], fig: (c, W, Hh) => rows.forEach((r, j) => coinRow(c, W / 2, Math.round((Hh - h) / 2) + j * 36 + 13, r)) };
  }
  const worth = items => items.reduce((a, k) => a + (k[0] === '$' ? 100 * +k.slice(1) : COIN[k].v), 0);

  // ---- Rulers and things to measure.
  const WOOD = '#ecd070', WOOD_EDGE = '#8a6420', WOOD_INK = '#3c2c10';
  // A ruler n units long, its 0 mark at x0, top at y, ppu pixels to a unit. Returns unit -> pixel x.
  function ruler(c, x0, y, n, ppu, unit, halves = true, every = 1) {
    const X = k => Math.round(x0 + k * ppu), end = X(n) + (unit ? 22 : 6);
    box(c, x0 - 5, y, end - x0 + 5, 16, WOOD_EDGE); box(c, x0 - 4, y + 1, end - x0 + 3, 14, WOOD);
    for (let k = 0; k <= n; k++) {
      box(c, X(k), y + 1, 1, 5, WOOD_INK);
      if (k % every === 0) ink(c, k, X(k), y + 10, WOOD_INK);
      if (halves && k < n) box(c, X(k + .5), y + 1, 1, 3, WOOD_INK);
    }
    if (unit) ink(c, unit, X(n) + 13, y + 10, '#8a6420');
    return X;
  }
  const THING_COL = { pencil: '#f8c838', crayon: '#f05a5a', ribbon: '#f070c0', caterpillar: '#60e080', nail: '#a8b0c0', straw: '#60a8f8' };
  // Draws a thing lying from pixel x0 to x1 (both ends exact), centred on row cy.
  function thing(c, kind, x0, x1, cy, col = THING_COL[kind]) {
    const L = x1 - x0;
    if (kind === 'pencil') {
      box(c, x0, cy - 3, 3, 7, '#f080a0'); box(c, x0 + 3, cy - 3, 2, 7, '#a0a8b8'); box(c, x0 + 5, cy - 3, L - 11, 7, col); box(c, x0 + 5, cy - 1, L - 11, 1, shade(col, .8));
      for (let j = 0; j <= 6; j++) { const hh = Math.round(3 * (6 - j) / 6); box(c, x1 - 6 + j, cy - hh, 1, 2 * hh + 1, j < 4 ? '#e8c090' : '#383838'); }
    } else if (kind === 'crayon') {
      box(c, x0, cy - 3, L - 4, 7, col); box(c, x0 + 2, cy - 3, 1, 7, shade(col, .6)); box(c, x1 - 8, cy - 3, 1, 7, shade(col, .6)); box(c, x0, cy - 3, L - 4, 1, shade(col, 1.3));
      for (let j = 0; j <= 4; j++) { const hh = [2, 2, 1, 1, 0][j]; box(c, x1 - 4 + j, cy - hh, 1, 2 * hh + 1, shade(col, .85)); }
    } else if (kind === 'ribbon' || kind === 'straw') {
      box(c, x0, cy - 2, L + 1, 5, col); box(c, x0, cy - 2, L + 1, 1, shade(col, 1.35)); box(c, x0, cy + 2, L + 1, 1, shade(col, .7));
    } else if (kind === 'caterpillar') {
      const k = Math.max(1, Math.round((L - 6) / 5));
      for (let i = 0; i <= k; i++) disc(c, x0 + 3 + Math.round(i * (L - 6) / k), cy, 3, i === k ? shade(col, .75) : i % 2 ? col : shade(col, .9));
      box(c, x1 - 3, cy - 1, 1, 1, '#101018'); box(c, x1 - 4, cy - 5, 1, 2, '#101018'); box(c, x1 - 2, cy - 5, 1, 2, '#101018');
    } else {
      box(c, x0, cy - 4, 2, 9, shade(col, .7)); box(c, x0 + 2, cy - 1, L - 4, 3, col); box(c, x0 + 2, cy - 1, L - 4, 1, shade(col, 1.25));
      box(c, x1 - 2, cy - 1, 2, 2, col); box(c, x1, cy, 1, 1, col);
    }
  }

  // ---- Number lines. Ticks every `tick`, labels every `lab` (0 for none). Returns value -> pixel x.
  function numLine(c, x0, x1, y, a, b, tick, lab, hide = []) {
    const X = v => Math.round(x0 + (v - a) * (x1 - x0) / (b - a));
    line(c, x0 - 6, y, x1 + 6, y, INK);
    for (const [e, s] of [[x0 - 6, 1], [x1 + 6, -1]]) { line(c, e, y, e + 2 * s, y - 2, INK); line(c, e, y, e + 2 * s, y + 2, INK); }
    for (let i = 0; a + i * tick <= b + 1e-9; i++) {
      const v = a + i * tick; line(c, X(v), y - 2, X(v), y + 2, INK);
      if (lab && Math.round(v - a) % lab === 0 && !hide.includes(v)) ink(c, comma(v), X(v), y + 9, LITE);
    }
    return X;
  }
  // A hop from xa to xb, ht pixels high, ending in an arrowhead.
  function hop(c, xa, xb, y, ht, col = HOT) {
    let px = xa, py = y - 2; const n = Math.max(2, Math.abs(xb - xa));
    for (let i = 1; i <= n; i++) { const t = i / n, x = xa + (xb - xa) * t, yy = y - 2 - ht * 4 * t * (1 - t); line(c, px, py, x, yy, col); px = x; py = yy; }
    line(c, xb - 2, y - 5, xb, y - 3, col); line(c, xb + 2, y - 5, xb, y - 3, col);
  }
  const qbox = (c, x, y) => { box(c, x - 5, y - 6, 11, 13, HOT); box(c, x - 4, y - 5, 9, 11, '#141c48'); ink(c, '?', x + 1, y + 1, HOT); };

  // ---- Shapes. Points go clockwise from the top; jit (per corner [angle, radius]) makes them irregular.
  const ngon = (cx, cy, r, n, rot = 0, jit = null) => range(0, n - 1).map(i => {
    const a = rot + i * 2 * Math.PI / n + (jit ? jit[i][0] : 0), rr = r * (jit ? jit[i][1] : 1);
    return [cx + rr * Math.sin(a), cy - rr * Math.cos(a)];
  });
  const jitter = n => range(1, n).map(() => [(rand() - .5) * .6 * Math.PI / n, 1 - rand() * .22]);
  const turn = (pts, cx, cy, a) => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
  const poly = (c, pts, fill, edge = INK) => { fillPoly(c, pts, fill); outlinePoly(c, pts, edge); };
  const COLS = ['#f05a5a', '#60a8f8', '#60e080', '#f8d040', '#f090d8', '#f8a040'];
  // The flat shapes young kids name. o: { r, rot, v (which triangle) }.
  function flatPts(name, cx, cy, o) {
    const r = o.r, rot = o.rot || 0;
    if (name === 'triangle') {
      const T = [[[0, -1], [.95, .7], [-.95, .7]], [[-.8, -.9], [.9, .8], [-.8, .8]], [[.2, -1], [.9, .75], [-.9, .75]], [[0, -.75], [1, .6], [-1, .6]]][o.v || 0];
      return turn(T.map(([x, y]) => [cx + x * r, cy + y * r]), cx, cy, rot);
    }
    if (name === 'square') return ngon(cx, cy, r, 4, rot + Math.PI / 4);
    if (name === 'rectangle') return turn([[-1, -.55], [1, -.55], [1, .55], [-1, .55]].map(([x, y]) => [cx + x * r, cy + y * r]), cx, cy, rot);
    if (name === 'trapezoid') return turn([[-.5, -.55], [.5, -.55], [1, .55], [-1, .55]].map(([x, y]) => [cx + x * r, cy + y * r]), cx, cy, rot);
    return ngon(cx, cy, r, { pentagon: 5, hexagon: 6, octagon: 8 }[name], rot, o.jit);
  }
  function flat(c, name, cx, cy, o) {
    if (name === 'circle') { disc(c, cx, cy, o.r, o.col); circle(c, cx, cy, o.r, INK); return; }
    poly(c, flatPts(name, cx, cy, o), o.col);
  }
  // Filled ellipse, a row of pixels at a time.
  function oval(c, cx, cy, a, b, col) { for (let y = -b; y <= b; y++) { const w = Math.round(a * Math.sqrt(Math.max(0, 1 - y * y / (b * b)))); box(c, cx - w, cy + y, 2 * w + 1, 1, col); } }
  function ovalLine(c, cx, cy, a, b, col, half = false) {
    for (let i = 0; i <= 64; i++) { const t = i / 64 * 2 * Math.PI; if (half && Math.sin(t) < 0) continue; c.fillStyle = col; c.fillRect(Math.round(cx + a * Math.cos(t)), Math.round(cy + b * Math.sin(t)), 1, 1); }
  }
  // Solid shapes, about s pixels tall, centred at (cx, cy).
  function solid(c, name, cx, cy, s, col) {
    const lo = shade(col, .68), hi = shade(col, 1.3), e = '#e8ecf8';
    if (name === 'cube' || name === 'box') {
      const fw = name === 'cube' ? Math.round(s * .66) : Math.round(s * .95), fh = name === 'cube' ? fw : Math.round(s * .5), dd = Math.round(s * .3);
      const x = Math.round(cx - (fw + dd) / 2), y = Math.round(cy - (fh - dd) / 2);
      const F0 = [[x, y], [x + fw, y], [x + fw, y + fh], [x, y + fh]], top = [[x, y], [x + dd, y - dd], [x + fw + dd, y - dd], [x + fw, y]], side = [[x + fw, y], [x + fw + dd, y - dd], [x + fw + dd, y + fh - dd], [x + fw, y + fh]];
      poly(c, F0, col, e); poly(c, top, hi, e); poly(c, side, lo, e);
    } else if (name === 'cylinder') {
      const a = Math.round(s * .38), b = Math.max(3, Math.round(s * .14)), t = Math.round(cy - s / 2 + b), bt = Math.round(cy + s / 2 - b);
      oval(c, cx, bt, a, b, lo); box(c, cx - a, t, 2 * a + 1, bt - t, col); box(c, cx + Math.round(a * .4), t, Math.round(a * .3), bt - t, hi);
      oval(c, cx, t, a, b, hi); ovalLine(c, cx, t, a, b, e); ovalLine(c, cx, bt, a, b, e, true); line(c, cx - a, t, cx - a, bt, e); line(c, cx + a, t, cx + a, bt, e);
    } else if (name === 'cone') {
      const a = Math.round(s * .42), b = Math.max(3, Math.round(s * .14)), ty = Math.round(cy - s / 2), by = Math.round(cy + s / 2 - b);
      oval(c, cx, by, a, b, lo); fillPoly(c, [[cx, ty], [cx + a, by], [cx - a, by]], col); fillPoly(c, [[cx, ty], [cx + a, by], [cx + Math.round(a * .4), by + 1]], hi);
      ovalLine(c, cx, by, a, b, e, true); line(c, cx, ty, cx - a, by, e); line(c, cx, ty, cx + a, by, e);
    } else if (name === 'sphere') {
      const r = Math.round(s / 2); disc(c, cx, cy, r, lo); disc(c, cx - 1, cy - 1, r - 2, col); disc(c, cx - Math.round(r / 3), cy - Math.round(r / 3), Math.max(2, Math.round(r / 3)), hi); circle(c, cx, cy, r, e);
    } else if (name === 'pyramid') {
      const a = Math.round(s * .48), ty = Math.round(cy - s / 2), by = Math.round(cy + s / 2 - 4);
      const L = [cx - a, by], R = [cx + a - 10, by], B = [cx + a, by - 8], T = [cx - 1, ty];
      poly(c, [T, L, R], col, e); poly(c, [T, R, B], lo, e);
    } else if (name === 'triPrism') {
      const a = Math.round(s * .36), hg = Math.round(s * .55), dd = Math.round(s * .32), bx = Math.round(cx - dd / 2), by = Math.round(cy + (hg + dd) / 2 - 1);
      const F0 = [[bx - a, by], [bx + a, by], [bx, by - hg]], Bk = F0.map(([x, y]) => [x + dd, y - dd]);
      poly(c, [F0[1], Bk[1], Bk[2], F0[2]], lo, e); poly(c, [F0[2], Bk[2], Bk[0], F0[0]], hi, e); poly(c, F0, col, e);
    }
  }

  // ---- Fractions. A circle cut at the given angles (degrees clockwise from the top); `shaded` lists sectors to fill.
  function pie(c, cx, cy, r, cuts, shaded, col = HOT) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r + r) continue;
      const a = (Math.atan2(x, -y) / DEG + 360) % 360;
      let k = cuts.length - 1; for (let i = 0; i < cuts.length; i++) if (a >= cuts[i]) k = i;
      c.fillStyle = shaded.includes(k) ? col : PLAIN; c.fillRect(cx + x, cy + y, 1, 1);
    }
    for (const a of cuts) line(c, cx, cy, cx + Math.sin(a * DEG) * r, cy - Math.cos(a * DEG) * r, INK);
    circle(c, cx, cy, r, INK);
  }
  // A rectangle cut into parts: 'cols', 'rows', 'grid' (2 x 2), 'diag' (two triangles), 'x' (four triangles), or columns at the given cut fractions.
  function rectParts(x, y, w, h, how, n) {
    const P = (a, b) => [x + a * w, y + b * h];
    if (how === 'diag') return [[P(0, 0), P(1, 0), P(0, 1)], [P(1, 0), P(1, 1), P(0, 1)]];
    if (how === 'x') return [[P(0, 0), P(1, 0), P(.5, .5)], [P(1, 0), P(1, 1), P(.5, .5)], [P(1, 1), P(0, 1), P(.5, .5)], [P(0, 1), P(0, 0), P(.5, .5)]];
    if (how === 'grid') return [[0, 0], [.5, 0], [0, .5], [.5, .5]].map(([a, b]) => [P(a, b), P(a + .5, b), P(a + .5, b + .5), P(a, b + .5)]);
    const cuts = Array.isArray(n) ? [0, ...n, 1] : range(0, n).map(i => i / n), out = [];
    for (let i = 0; i + 1 < cuts.length; i++) {
      const [a, b] = [cuts[i], cuts[i + 1]];
      out.push(how === 'rows' ? [P(0, a), P(1, a), P(1, b), P(0, b)] : [P(a, 0), P(b, 0), P(b, 1), P(a, 1)]);
    }
    return out;
  }
  const parts = (c, polys, shaded, col = HOT) => { polys.forEach((p, i) => fillPoly(c, p, shaded.includes(i) ? col : PLAIN)); polys.forEach(p => outlinePoly(c, p, INK)); };

  // ---- Graphs
  function picGraph(c, w, h, cats, vals, ic) {
    const lw = Math.max(...cats.map(s => Font.width(s))) + 6, rh = Math.floor((h - 13) / cats.length);
    cats.forEach((s, i) => {
      const y = i * rh; Font.draw(c, s, lw - 4, y + Math.round(rh / 2) - 4, INK, { align: 'right' });
      if (i) line(c, 0, y, w - 1, y, GRID);
      for (let k = 0; k < vals[i]; k++) icon(c, ic, lw + 3 + k * 10, y + Math.round((rh - 9) / 2));
    });
    line(c, lw, 0, lw, rh * cats.length - 1, DIM); line(c, 0, rh * cats.length, w - 1, rh * cats.length, DIM);
    icon(c, ic, lw + 3, h - 10); Font.draw(c, '= 1', lw + 15, h - 10, LITE);
  }
  function barGraph(c, w, h, cats, vals, top) {
    const left = 16, base = h - 12, unit = Math.floor((base - 3) / top), step = unit >= 9 ? 1 : 2;
    for (let v = 0; v <= top; v++) { const y = base - v * unit; line(c, left, y, w - 1, y, v ? GRID : DIM); if (v % step === 0) ink(c, v, 8, y, LITE); }
    line(c, left, base - top * unit, left, base, DIM);
    const slot = Math.floor((w - left - 2) / cats.length), bw = Math.min(18, slot - 8);
    cats.forEach((s, i) => { const cx = left + 2 + slot * i + Math.round(slot / 2), y = base - vals[i] * unit; box(c, cx - Math.round(bw / 2), y, bw, base - y, COLS[i]); ink(c, s, cx, base + 7, INK); });
  }
  function tallyMarks(c, x, y, n, col = INK) {
    for (let i = 0; i < n; i++) { const gx = x + Math.floor(i / 5) * 13, k = i % 5; if (k < 4) box(c, gx + k * 2, y, 1, 8, col); else line(c, gx - 1, y + 6, gx + 7, y + 1, HOT); }
  }
  // ---- Pictures several grades share
  const v1 = (k, one, many) => k === 1 ? one : many;
  // How big a block of n pictures in rows of `per` is, s pixels to a dot.
  const block = (n, per, s) => [Math.min(n, per) * 11 * s - 2 * s, Math.ceil(n / per) * 11 * s - 2 * s];
  // Two groups of pictures, with a plus sign between them or just a gap: double size when it fits.
  function twoGroups(name, a, b, plus) {
    let s, per, wa, ha, wb, hb, gap;
    for ([s, per] of [[2, 5], [2, 3], [1, 5]]) {
      [wa, ha] = block(a, per, s); [wb, hb] = block(b, per, s); gap = (plus ? 13 : 8) * s;
      if (wa + wb + gap + 10 <= 168 && Math.max(ha, hb) + 8 <= 96) break;
    }
    const w = wa + wb + gap, h = Math.max(ha, hb);
    return { size: [Math.max(60, w + 10), h + 10], fig: (c, W, H) => {
      const x = Math.round((W - w) / 2), y = Math.round((H - h) / 2);
      picRows(c, name, a, x, y, per, s); if (plus) sign(c, x + wa + 3 * s, Math.round(H / 2 - 3.5 * s), true, HOT, s); picRows(c, name, b, x + wa + gap, y, per, s);
    } };
  }
  // n pictures, the last k crossed out (or not, when crossed is false).
  function takeFig(name, n, k, crossed = true) {
    const s = 2, [w, hh] = block(n, 5, s);
    return { size: [Math.max(60, w + 10), hh + 10], fig: (c, W, H) => {
      const x = Math.round((W - w) / 2), y = Math.round((H - hh) / 2);
      picRows(c, name, n, x, y, 5, s); if (crossed) for (let i = n - k; i < n; i++) cross(c, x + (i % 5) * 11 * s, y + (i / 5 | 0) * 11 * s, s);
    } };
  }
  // Counters: big ones (r 5, 13 apart) for kindergarten, small ones (r 3, 9 apart) otherwise.
  const dots = (c, x, y, n, col, big = false) => { const p = big ? 13 : 9, r = big ? 5 : 3; for (let i = 0; i < n; i++) disc(c, x + r + (i % 5) * p, y + r + (i / 5 | 0) * p, r, col); };
  const FLAT = ['circle', 'square', 'triangle', 'rectangle', 'hexagon'];
  const SOLIDS = ['cube', 'cone', 'cylinder', 'sphere'];
  const SHAPE_FACTS = {
    circle: 'It is round. It has no sides and no corners.', square: 'It has 4 sides, all the same length, and 4 corners.',
    triangle: 'It has 3 straight sides and 3 corners.', rectangle: 'It has 4 sides and 4 square corners. 2 sides are longer.',
    hexagon: 'It has 6 sides and 6 corners.', pentagon: 'It has 5 sides and 5 corners.', trapezoid: 'It has 4 sides. Only 2 of them are parallel.',
  };
  const SOLID_FACTS = {
    cube: 'It is like a box with 6 square faces.', cone: 'It has a round, flat bottom and a point on top.',
    cylinder: 'It is like a can: round and flat on the top and bottom.', sphere: 'It is round all over, like a ball.',
  };
  const shapeOpt = r => ({ r, rot: pick([0, 0, rand() * 2 * Math.PI]), v: randInt(0, 3), col: pick(COLS) });
  // Wrong names for a shape: never "rectangle" for a square, since a square is a rectangle too.
  const notIt = (name, from) => from.filter(s => s !== name && !(name === 'square' && s === 'rectangle'));
  const drawAny = (c, name, cx, cy, o, s = 28) => SOLIDS.includes(name) ? solid(c, name, cx, cy, s, o.col) : flat(c, name, cx, cy, o);
  // Big shapes made of smaller ones, in a 64 x 48 box.
  const COMPOSE = [
    { n: 2, part: 'triangle', make: 'square', polys: () => [[[14, 6], [50, 6], [14, 42]], [[50, 6], [50, 42], [14, 42]]] },
    { n: 2, part: 'square', make: 'rectangle', polys: () => rectParts(8, 12, 48, 24, 'cols', 2) },
    { n: 3, part: 'square', make: 'rectangle', polys: () => rectParts(5, 15, 54, 18, 'cols', 3) },
    { n: 6, part: 'triangle', make: 'hexagon', polys: () => { const v = ngon(32, 24, 21, 6, Math.PI / 6); return range(0, 5).map(i => [[32, 24], v[i], v[(i + 1) % 6]]); } },
    { n: 2, part: 'triangle', make: 'triangle', polys: () => [[[32, 6], [32, 42], [10, 42]], [[32, 6], [54, 42], [32, 42]]] },
    { n: 4, part: 'square', make: 'square', polys: () => rectParts(14, 6, 36, 36, 'grid') },
    { n: 4, part: 'triangle', make: 'triangle', polys: () => { const A = [32, 5], B = [54, 43], C = [10, 43], m = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], ab = m(A, B), bc = m(B, C), ca = m(C, A); return [[A, ab, ca], [ab, B, bc], [ca, bc, C], [ab, bc, ca]]; } },
    { n: 3, part: 'triangle', make: 'trapezoid', polys: () => { const v = ngon(32, 36, 26, 6, Math.PI / 6); return [[[32, 36], v[4], v[5]], [[32, 36], v[5], v[0]], [[32, 36], v[0], v[1]]]; } },
  ];
  // Drawn half as big again: a 96 x 72 box.
  const composeFig = (C, cols) => { const P = C.polys().map(p => p.map(([x, y]) => [x * 1.5, y * 1.5])); return { size: [96, 72], fig: c => { P.forEach((p, i) => fillPoly(c, p, cols[i % 2])); P.forEach(p => outlinePoly(c, p, INK)); } }; };

  // ======================================================== KINDERGARTEN
  const K = {};
  function countSteps(n, how) {
    if (n <= 10) return ['Touch each one as you count it.', upto(n) + '.', `The last number you say is how many: ${n}.`];
    if (how === 'rows') {
      const f = Math.floor(n / 5), fives = range(1, f).map(k => 5 * k);
      return ['Each full row has 5.', 'Count by fives: ' + fives.join(', ') + (n % 5 ? ', then ' + range(5 * f + 1, n).join(', ') : '') + '.', `There are ${n}.`];
    }
    return ['The top row has 10.', 'Count on from 10: ' + range(11, n).join(', ') + '.', `There are ${n}.`];
  }

  K.countPics = d => {
    const n = randInt(d === 1 ? 1 : 4, [0, 5, 10, 15, 20][d]), name = pick(ICONS);
    const how = n > 10 ? 'rows' : pick(['line', 'rows', 'ring', 'scatter']), L = spreadFit(n, how);
    return { topic: 'COUNTING', text: `How many ${plural(name)}?`, ...nums(n, [n - 1, n + 1, n + 2, n - 2], String, 1),
      steps: countSteps(n, how), size: [Math.max(48, L.w + 10), Math.max(24, L.h + 8)], fig: (c, w, h) => pics(c, w, h, name, L) };
  };

  K.tenFrame = d => {
    const n = d <= 2 ? randInt(d === 1 ? 1 : 4, 10) : randInt(11, 20), col = pick([RED, BLU, GRN, HOT]), two = n > 10;
    const steps = two ? ['The top frame is full: that is 10.', `The bottom frame has ${n - 10}.`, `10 and ${n - 10} make ${n}.`]
      : n >= 5 ? ['The top row is full: that is 5.', `The bottom row has ${n - 5}.`, `5 and ${n - 5} make ${n}.`] : [`Count the dots: ${upto(n)}.`, `There are ${n}.`];
    return { topic: 'TEN FRAMES', text: 'How many dots?', ...nums(n, [n - 1, n + 1, two ? n - 10 : 10 - n, n + 2]), steps,
      size: [84, two ? 66 : 35], fig: c => { tenFrame(c, 6, 3, Math.min(n, 10), col, 14); if (two) tenFrame(c, 6, 35, n - 10, col, 14); } };
  };

  K.showNumber = d => {
    const n = randInt(2, d === 1 ? 6 : 10), col = pick([RED, BLU, GRN]);
    const set = shuffle([n, ...pickN(range(Math.max(0, n - 3), Math.min(10, n + 3)).filter(v => v !== n), 3)]), at = set.indexOf(n);
    return { topic: 'COUNTING', text: `Which ten frame shows ${n}?`, ...which(at),
      steps: ['Count the dots in each ten frame.', `Frames 1 to 4 have ${set.join(', ')} dots.`, `Frame ${at + 1} shows ${n}.`],
      size: [168, 64], fig: (c, w, h) => grid4(c, w, h, (i, x, y, cw) => tenFrame(c, x + Math.round((cw - 61) / 2), y + 3, set[i], col, 12)) };
  };

  K.nextNumber = d => {
    const top = [0, 10, 20, 50, 100][d], missing = d >= 2 && rand() < .4;
    let a = randInt(1, top - 3);
    if (d >= 3 && rand() < .5) a = Math.min(top - 3, 10 * randInt(1, top / 10 - 1) - randInt(1, 3));
    const seq = [a, a + 1, a + 2, a + 3], k = missing ? randInt(1, 2) : 3, ans = seq[k];
    return { topic: 'COUNTING', text: missing ? 'What number is missing?' : 'What number comes next?',
      ...nums(ans, [ans + 1, ans - 1, ans + 10, Math.floor(ans / 10) * 10 - 10], String, 1),
      steps: ['Count up by ones.', seq.join(', ') + '.', `The ${missing ? 'missing' : 'next'} number is ${ans}.`], ...tiles(seq.map((v, i) => i === k ? null : v)) };
  };

  K.countTens = d => {
    if (rand() < .55) {
      const a = 10 * randInt(1, d <= 2 ? 4 : 7), ans = a + 30;
      return { topic: 'COUNT BY TENS', text: 'Count by tens. What comes next?', ...nums(ans, [a + 21, a + 40, ans + 1, a + 25]),
        steps: ['Counting by tens adds 10 each time.', [a, a + 10, a + 20, ans].join(', ') + '.', `Next is ${ans}.`], ...tiles([a, a + 10, a + 20, null]) };
    }
    const t = randInt(2, d <= 2 ? 4 : 9), n = t * 10 - 1, ans = t * 10;
    return { topic: 'COUNTING', text: `What number comes after ${n}?`, ...nums(ans, [n - 9, n + 10, ans + 1]),
      steps: [`${n - 2}, ${n - 1}, ${n}, ...`, 'After a 9 comes the next ten.', `After ${n} comes ${ans}.`], ...tiles([n - 1, n, null]) };
  };

  K.oneMoreLess = d => {
    if (rand() < .3) {
      const top = d <= 2 ? 10 : 20, n = randInt(1, top - 1);
      return { topic: 'IN BETWEEN', text: `What number comes between ${n - 1} and ${n + 1}?`, ...nums(n, [n + 2, n - 2, n + 1, n - 1]),
        steps: [`Count: ${n - 1}, ${n}, ${n + 1}.`, `${n} is in the middle.`], ...tiles([n - 1, null, n + 1]) };
    }
    const top = d <= 2 ? 10 : 20, more = rand() < .5, n = more ? randInt(0, top - 1) : randInt(1, top), ans = more ? n + 1 : n - 1;
    const text = pick(more ? [`What number is 1 more than ${n}?`, `What number comes just after ${n}?`] : [`What number is 1 less than ${n}?`, `What number comes just before ${n}?`]);
    const hide = top === 10 ? [n] : [n - 2, n - 1, n, n + 1, n + 2];
    return { topic: more ? 'ONE MORE' : 'ONE LESS', text, ...nums(ans, [more ? n - 1 : n + 1, n, more ? ans + 1 : ans - 1]),
      steps: [`Find ${n} on the number line.`, `Take one step to the ${more ? 'right' : 'left'}.`, `${more ? '1 more' : '1 less'} than ${n} is ${ans}.`],
      size: [168, 30], fig: (c, w) => { const X = numLine(c, 10, w - 11, 10, 0, top, 1, top === 10 ? 1 : 5, hide); disc(c, X(n), 10, 2, HOT); ink(c, n, X(n), 19, HOT); } };
  };

  K.compareGroups = d => {
    const names = pickN(ICONS, 3), max = [0, 5, 7, 10, 10][d], same = rand() < .12, most = rand() < .55;
    const vals = same ? Array(3).fill(randInt(2, max)) : pickN(range(1, max), 3), best = most ? Math.max(...vals) : Math.min(...vals);
    const NAME = s => plural(s).toUpperCase(), win = names[vals.indexOf(best)], right = same ? 'ALL THE SAME' : NAME(win), sz = Math.max(...vals) <= 7 ? 2 : 1;
    return { topic: 'MORE OR FEWER', text: `Which row has the ${most ? 'most' : 'fewest'}?`, ...opts(right, [...names.map(NAME), 'ALL THE SAME']),
      steps: [`Count each row: ${vals.join(', ')}.`, same ? 'Every row has the same number.' : `${best} is the ${most ? 'biggest' : 'smallest'} number.`,
        same ? 'So they are all the same.' : `So the ${plural(win)} have the ${most ? 'most' : 'fewest'}.`],
      size: [Math.max(...vals) * 11 * sz + 10, 36 * sz - 2 * sz + 8], fig: c => names.forEach((s, i) => picRows(c, s, vals[i], 6, 4 + i * 12 * sz, 10, sz)) };
  };

  K.compareNumbers = d => {
    const set = pickN(range(d <= 2 ? 1 : 0, d <= 2 ? 10 : 20), 4), big = rand() < .6, ans = big ? Math.max(...set) : Math.min(...set);
    return { topic: 'NUMBERS', text: `Which number is the ${big ? 'biggest' : 'smallest'}?`, ...jumble(ans, set.filter(v => v !== ans)),
      steps: ['When you count, bigger numbers come later.', `In counting order: ${set.slice().sort((a, b) => a - b).join(', ')}.`, `${ans} is the ${big ? 'biggest' : 'smallest'}.`] };
  };

  K.orderNumbers = d => {
    const a = randInt(1, d <= 2 ? 8 : 18), s = v => v.join(', ');
    return { topic: 'NUMBERS', text: 'Which numbers are in counting order?', ...opts(s([a, a + 1, a + 2]), [s([a, a + 2, a + 1]), s([a + 1, a, a + 2]), s([a + 2, a, a + 1]), s([a + 1, a + 2, a])]),
      steps: ['In counting order, each number is 1 more.', `${a}, then ${a + 1}, then ${a + 2}.`] };
  };

  K.numberLine10 = d => {
    const top = d <= 2 ? 10 : 20, n = randInt(1, top - 1), every = d === 1 ? 1 : top === 10 ? 2 : 5, from = Math.floor((n - 1) / every) * every;
    return { topic: 'NUMBER LINE', text: 'What number goes in the box?', ...nums(n, [n + 1, n - 1, n + 2, n - 2]),
      steps: ['Each tick is 1 more than the one before.', from ? `From ${from}, count on: ${range(from + 1, n).join(', ')}.` : `From 0, count: ${upto(n)}.`, `The box is at ${n}.`],
      size: [168, 40], fig: (c, w) => { const X = numLine(c, 10, w - 11, 22, 0, top, 1, every, [n]); qbox(c, X(n), 9); line(c, X(n), 16, X(n), 19, HOT); } };
  };

  K.addPics = d => {
    const s = randInt(2, [0, 5, 7, 10, 10][d]), a = randInt(1, s - 1), b = s - a, name = pick(ICONS);
    return { topic: 'ADDING', text: d >= 3 ? `${a} + ${b} = ?` : 'How many in all?', say: `${a} ${plural(name, a)} and ${b} more. How many in all?`,
      ...nums(s, [s - 1, s + 1, a, b, s + 2]), steps: [`${a} and ${b} more.`, `Count them all: ${upto(s)}.`, `${a} + ${b} = ${s}`], ...twoGroups(name, a, b, true) };
  };

  K.takeAway = d => {
    const n = randInt(2, [0, 5, 7, 10, 10][d]), k = randInt(1, n - 1), left = n - k, name = pick(ICONS);
    return { topic: 'TAKE AWAY', text: d >= 3 ? `${n} - ${k} = ?` : 'How many are left?', say: `There are ${n} ${plural(name, n)}. Take away ${k}. How many are left?`,
      ...nums(left, [n + k, k, n, left + 1, left - 1]), steps: [`Start with ${n}.`, `${k} ${v1(k, 'is', 'are')} crossed out.`, `Count the rest: ${left}. ${n} - ${k} = ${left}`], ...takeFig(name, n, k) };
  };

  const K_ADD = [
    ['balloon', (P, a, b) => `${P.n} has ${a} ${v1(a, 'balloon', 'balloons')}. ${P.He} gets ${b} more. How many now?`],
    ['fish', (P, a, b) => `${a} fish ${v1(a, 'swims', 'swim')} in a pond. ${b} more ${v1(b, 'comes', 'come')}. How many fish now?`],
    ['flower', (P, a, b) => `${P.n} picks ${a} ${v1(a, 'flower', 'flowers')}. Then ${P.he} picks ${b} more. How many flowers?`],
    ['cookie', (P, a, b) => `${P.n} bakes ${a} ${v1(a, 'cookie', 'cookies')}, then ${b} more. How many cookies?`],
    ['ball', (P, a, b) => `${a} ${v1(a, 'ball is', 'balls are')} in a box. ${P.n} puts in ${b} more. How many balls now?`],
    ['star', (P, a, b) => `${P.n} has ${a} star ${v1(a, 'sticker', 'stickers')}. ${P.He} gets ${b} more. How many stars?`],
    ['apple', (P, a, b) => `${P.n} has ${a} ${v1(a, 'apple', 'apples')}. A friend gives ${P.him} ${b} more. How many apples?`],
  ];
  const K_SUB = [
    ['balloon', (P, n, k) => `${P.n} has ${n} balloons. ${k} ${v1(k, 'floats', 'float')} away. How many are left?`],
    ['cookie', (P, n, k) => `There are ${n} cookies. ${P.n} eats ${k}. How many are left?`],
    ['fish', (P, n, k) => `${n} fish are in a pond. ${k} ${v1(k, 'swims', 'swim')} away. How many are left?`],
    ['apple', (P, n, k) => `${P.n} has ${n} apples. ${P.He} gives ${k} away. How many are left?`],
    ['ball', (P, n, k) => `There are ${n} balls. ${k} ${v1(k, 'rolls', 'roll')} away. How many are left?`],
    ['star', (P, n, k) => `${n} stars are in the sky. ${k} ${v1(k, 'hides', 'hide')} behind a cloud. How many can you see?`],
  ];
  K.addWord = d => {
    const s = randInt(3, d <= 2 ? 7 : 10), a = randInt(1, s - 1), b = s - a, [name, t] = pick(K_ADD), [P] = kids(1);
    return { topic: 'ADDING', text: t(P, a, b), ...nums(s, [s - 1, s + 1, a, b, Math.abs(a - b)]),
      steps: ['More are coming, so add.', `${a} and ${b} more: ${upto(s)}.`, `${a} + ${b} = ${s}`], ...twoGroups(name, a, b, false) };
  };
  K.subWord = d => {
    const n = randInt(3, d <= 2 ? 7 : 10), k = randInt(1, n - 1), [name, t] = pick(K_SUB), [P] = kids(1);
    return { topic: 'TAKE AWAY', text: t(P, n, k), ...nums(n - k, [n + k, k, n, n - k + 1, n - k - 1]),
      steps: ['Some go away, so take away.', `Start with ${n}. Take away ${k}.`, `${n} - ${k} = ${n - k}`], ...takeFig(name, n, k, d <= 2) };
  };

  K.makeTen = d => {
    const n = randInt(d === 1 ? 5 : 1, 9), need = 10 - n, col = pick([RED, BLU, GRN]), sym = d >= 3 && rand() < .5;
    return { topic: 'MAKE 10', text: sym ? `${n} + ? = 10` : 'How many more dots make 10?', ...(sym ? { say: `${n} and what number make 10?` } : {}),
      ...nums(need, [n, need + 1, need - 1, 10]), steps: ['A ten frame has 10 boxes.', `${n} are full. Count the empty ones: ${need}.`, `${n} and ${need} make 10.`],
      size: [84, 35], fig: c => tenFrame(c, 6, 3, n, col, 14) };
  };

  K.decompose = d => {
    const n = randInt(d <= 2 ? 3 : 5, d <= 2 ? 6 : 10), a = randInt(1, n - 1), b = n - a;
    if (rand() < .55) {
      const eq = (t, x, y) => `${t} = ${x} + ${y}`, w = n * 15 - 1, wrongs = [eq(n + 1, a + 1, b), eq(n + 1, a, b + 1)];
      if (a > 1) wrongs.push(eq(n - 1, a - 1, b)); if (b > 1) wrongs.push(eq(n - 1, a, b - 1));
      return { topic: 'MAKE A NUMBER', text: 'Which number sentence matches the cubes?', say: 'Which number sentence matches the red and blue cubes?', ...opts(eq(n, a, b), wrongs),
        steps: [`Count the red cubes: ${a}. Count the blue: ${b}.`, `There are ${n} cubes in all.`, `${n} = ${a} + ${b}`],
        size: [w + 12, 26], fig: (c, W) => { const x = Math.round((W - w) / 2); for (let i = 0; i < n; i++) { box(c, x + i * 15, 6, 14, 14, i < a ? '#8a2020' : '#1c4c90'); box(c, x + i * 15 + 1, 7, 12, 12, i < a ? RED : BLU); box(c, x + i * 15 + 2, 8, 10, 2, i < a ? '#ff9090' : '#a0d0ff'); } } };
    }
    const pr = (x, y) => `${x} and ${y}`;
    return { topic: 'MAKE A NUMBER', text: `Which two numbers make ${n}?`, ...opts(pr(a, b), [pr(a, b + 1), pr(a + 1, b + 1), b > 1 ? pr(a, b - 1) : pr(a + 2, b), pr(a + 1, b), pr(a, b + 2)]),
      steps: ['Add up each pair.', `${a} and ${b} make ${n}.`, `${n} = ${a} + ${b}`] };
  };

  K.facts5 = d => {
    const plus = rand() < .55; let a, b, ans;
    if (plus) { ans = randInt(1, 5); a = randInt(0, ans); b = ans - a; } else { a = randInt(1, 5); b = randInt(0, a); ans = a - b; }
    const pic = d <= 2 ? { size: [plus ? 160 : 76, 26], fig: (c, w) => {
      if (plus) { const x = 6; dots(c, x, 8, a, RED, true); sign(c, x + 70, 6, true, HOT, 2); dots(c, x + 90, 8, b, BLU, true); }
      else { const x = Math.round((w - 62) / 2); dots(c, x, 8, a, RED, true); for (let i = a - b; i < a; i++) { line(c, x + i * 13 - 1, 6, x + i * 13 + 11, 20, HOT); line(c, x + i * 13 + 11, 6, x + i * 13 - 1, 20, HOT); } }
    } } : {};
    return { topic: plus ? 'ADDING' : 'TAKE AWAY', text: `${a} ${plus ? '+' : '-'} ${b} = ?`, say: plus ? `What is ${a} plus ${b}?` : `What is ${a} take away ${b}?`,
      ...nums(ans, plus ? [ans + 1, ans - 1, Math.abs(a - b)] : [a + b, ans + 1, ans - 1]),
      steps: plus ? [`Start at ${a}. Count on ${b}.`, `${a} + ${b} = ${ans}`] : [`Start at ${a}. Count back ${b}.`, `${a} - ${b} = ${ans}`], ...pic };
  };

  K.teens = d => {
    const o = randInt(1, 9), n = 10 + o, f = pick(d <= 2 ? ['count', 'count', 'ten'] : ['count', 'ten', 'split']), rods = rand() < .5;
    const pic = rods ? blocks(0, 1, o) : { size: [84, 66], fig: c => { tenFrame(c, 6, 3, 10, RED, 14); tenFrame(c, 6, 35, o, BLU, 14); } };
    const wrongs = [o, n + 1, n - 1, 1 + o, Number(o + '1')], on = `Count on from 10: ${range(11, n).join(', ')}.`;
    if (f === 'count') return { topic: 'TEEN NUMBERS', text: rods ? 'How many cubes in all?' : 'How many dots in all?', ...(rods ? { say: 'How many cubes in all? The long stick has 10 cubes.' } : {}),
      ...nums(n, wrongs), steps: [rods ? 'The long stick is 10 cubes.' : 'The full frame is 10.', on, `10 and ${o} make ${n}.`], ...pic };
    if (f === 'ten') return { topic: 'TEEN NUMBERS', text: `10 + ${o} = ?`, say: `What is 10 and ${o} more?`, ...nums(n, wrongs), steps: ['Start at 10.', on, `10 + ${o} = ${n}`], ...pic };
    return { topic: 'TEEN NUMBERS', text: `${n} is 10 and how many more?`, ...nums(o, [n, o + 1, o - 1, 1, 10]), steps: [`${n} is 1 ten and some ones.`, `The ones: ${o}.`, `${n} = 10 + ${o}`], ...pic };
  };

  const KCOL = [['RED', '#f05a5a'], ['BLUE', '#60a8f8'], ['GREEN', '#60e080'], ['YELLOW', '#f8d040']];
  K.longest = d => {
    const tower = rand() < .4, most = rand() < .55;
    const ls = tower ? pickN(range(2, 7), 4) : d <= 2 ? pickN(range(2, 8), 4).map(v => v * 18) : pickN(range(4, 16), 4).map(v => v * 9);
    const best = most ? Math.max(...ls) : Math.min(...ls), right = KCOL[ls.indexOf(best)][0], word = most ? (tower ? 'tallest' : 'longest') : 'shortest';
    const fig = tower
      ? { size: [118, 92], fig: (c, w, h) => { box(c, 0, h - 3, w, 1, DIM); ls.forEach((n, i) => { for (let k = 0; k < n; k++) { box(c, 10 + i * 27, h - 16 - k * 12, 18, 12, shade(KCOL[i][1], .6)); box(c, 11 + i * 27, h - 15 - k * 12, 16, 10, KCOL[i][1]); } }); } }
      : { size: [160, 60], fig: (c, w, h) => { line(c, 6, 2, 6, h - 3, DIM, 1); ls.forEach((L, i) => thing(c, 'crayon', 7, 7 + L, 9 + i * 14, KCOL[i][1])); } };
    return { topic: tower ? 'TALLER' : 'LONGER', text: `Which ${tower ? 'tower' : 'crayon'} is the ${word}?`, ...opts(right, KCOL.map(k => k[0])),
      steps: tower ? [`Count the blocks: ${ls.join(', ')}.`, `The ${right.toLowerCase()} tower has ${best}.`, `It is the ${word}.`]
        : ['They all start at the same line.', 'Look at where each one ends.', `The ${right.toLowerCase()} crayon is the ${word}.`], ...fig };
  };

  const WEIGHT = { balloon: 1, flower: 2, cookie: 2, apple: 3, fish: 3, ball: 4, block: 5 };
  K.heavier = d => {
    const objs = Object.keys(WEIGHT), same = rand() < .15, heavyQ = rand() < .6;
    const light = pick(objs.slice(0, 5)), heavy = same ? light : pick(objs.filter(o => WEIGHT[o] > WEIGHT[light])), heavyLeft = rand() < .5;
    const [L, R] = heavyLeft ? [heavy, light] : [light, heavy], t = same ? 0 : heavyLeft ? 6 : -6;
    const SAME = 'they weigh the same', right = same ? SAME : `the ${heavyQ ? heavy : light}`;
    const wrongs = same ? [`the ${light}`, "can't tell", `the ${pick(objs.filter(o => o !== light))}`] : [`the ${heavy}`, `the ${light}`, SAME, "can't tell"];
    return { topic: 'HEAVY OR LIGHT', text: `Which is ${heavyQ ? 'heavier' : 'lighter'}?`, ...opts(right, wrongs),
      steps: ['On a balance, the heavier side goes down.', same ? 'Both sides are level.' : `The ${heavy} side is down. The ${light} side is up.`, same ? 'So they weigh the same.' : `So the ${heavyQ ? heavy : light} is ${heavyQ ? 'heavier' : 'lighter'}.`],
      size: [160, 64], fig: (c, w, h) => {
        const cx = Math.round(w / 2), py = 22, tt = t * 1.2;
        box(c, cx - 1, py, 3, h - py - 6, '#a07850'); box(c, cx - 18, h - 6, 37, 3, '#a07850');
        line(c, cx - 52, py + tt, cx + 52, py - tt, INK); line(c, cx - 52, py + tt + 1, cx + 52, py - tt + 1, INK);
        for (const [ex, ey, ob] of [[cx - 52, Math.round(py + tt), L], [cx + 52, Math.round(py - tt), R]]) { line(c, ex, ey + 1, ex - 14, ey + 19, LITE); line(c, ex, ey + 1, ex + 14, ey + 19, LITE); box(c, ex - 17, ey + 19, 35, 2, LITE); icon(c, ob, ex - 9, ey + 1, 2); }
        disc(c, cx, py, 2, HOT);
      } };
  };

  K.sortCount = d => {
    const kinds = pickN(ICONS, d <= 2 ? 2 : 3), counts = kinds.map(() => randInt(1, d <= 2 ? 5 : 6)), t = randInt(0, kinds.length - 1), n = counts[t];
    const items = shuffle(kinds.flatMap((k, i) => Array(counts[i]).fill(k))), L = spreadFit(items.length, 'scatter');
    return { topic: 'SORTING', text: `How many ${plural(kinds[t])} are there?`, ...nums(n, [n + 1, n - 1, items.length, ...counts.filter((_, i) => i !== t)], String, 1),
      steps: [`Look only at the ${plural(kinds[t])}.`, `Count them: ${upto(n)}.`, `There ${v1(n, 'is', 'are')} ${n}.`],
      size: [L.w + 10, L.h + 8], fig: (c, w, h) => { const x0 = Math.round((w - L.w) / 2), y0 = Math.round((h - L.h) / 2); L.pts.forEach(([x, y], i) => icon(c, items[i], x0 + x, y0 + y, L.s)); } };
  };

  K.shapeName = d => {
    const name = pick(FLAT), o = shapeOpt(randInt(d <= 2 ? 26 : 18, 30));
    return { topic: 'SHAPES', text: 'What shape is this?', ...opts(name, shuffle(notIt(name, [...FLAT, 'oval']))),
      steps: [SHAPE_FACTS[name], `Big or small, turned or not, it is a ${name}.`], size: [76, 68], fig: c => flat(c, name, 38, 34, o) };
  };

  K.findShape = () => {
    const name = pick(FLAT), others = pickN(notIt(name, FLAT).filter(s => !(name === 'rectangle' && s === 'square')), 3), set = shuffle([name, ...others]), os = set.map(() => shapeOpt(19));
    return { topic: 'SHAPES', text: `Which one is a ${name}?`, ...which(set.indexOf(name)), steps: [SHAPE_FACTS[name], `Shape ${set.indexOf(name) + 1} is the ${name}.`],
      size: [168, 92], fig: (c, w, h) => grid4(c, w, h, (i, x, y, cw, ch) => flat(c, set[i], x + Math.round(cw / 2), y + Math.round(ch / 2), os[i])) };
  };

  K.flatSolid = () => {
    if (rand() < .5) {
      const wantSolid = rand() < .5, odd = wantSolid ? pick(SOLIDS) : pick(FLAT), set = shuffle([odd, ...(wantSolid ? pickN(FLAT, 3) : pickN(SOLIDS, 3))]), os = set.map(() => shapeOpt(18)), at = set.indexOf(odd);
      return { topic: 'FLAT OR SOLID', text: `Which shape is ${wantSolid ? 'solid' : 'flat'}?`, ...which(at),
        steps: ['A flat shape lies flat, like a drawing on paper.', 'A solid shape you can hold, like a ball or a box.', `Shape ${at + 1} is the ${wantSolid ? 'solid' : 'flat'} one: a ${odd}.`],
        size: [168, 92], fig: (c, w, h) => grid4(c, w, h, (i, x, y, cw, ch) => drawAny(c, set[i], x + Math.round(cw / 2), y + Math.round(ch / 2), os[i], 36)) };
    }
    const name = pick(SOLIDS), col = pick(COLS);
    const wr = { cube: ['square', 'cone', 'sphere', 'cylinder'], cone: ['triangle', 'cylinder', 'cube', 'sphere'], cylinder: ['circle', 'cone', 'cube', 'rectangle'], sphere: ['circle', 'cube', 'cone', 'cylinder'] }[name];
    return { topic: 'SOLID SHAPES', text: 'What is this solid shape called?', ...opts(name, wr), steps: [SOLID_FACTS[name], `It is a ${name}.`], size: [76, 68], fig: c => solid(c, name, 38, 34, 54, col) };
  };

  K.sides = () => {
    const name = pick(['triangle', 'square', 'rectangle', 'hexagon']), n = { triangle: 3, square: 4, rectangle: 4, hexagon: 6 }[name], what = pick(['corners', 'sides']), o = shapeOpt(28);
    return { topic: 'SHAPES', text: `How many ${what} does this shape have?`, ...nums(n, [n - 1, n + 1, n + 2], String, 1),
      steps: [`Count the ${what} as you go around: ${upto(n)}.`, `A ${name} has ${n} sides and ${n} corners.`], size: [76, 68], fig: c => flat(c, name, 38, 34, o) };
  };

  K.position = d => {
    if (d >= 2 && rand() < .5) {
      const where = pick(['in front of', 'behind', 'next to', 'on top of']), [x, y] = { 'in front of': [58, 56], behind: [34, 46], 'next to': [116, 58], 'on top of': [62, 14] }[where];
      const crate = c => { box(c, 46, 40, 44, 36, '#b07840'); frame(c, 46, 40, 44, 36, '#6a4420'); box(c, 50, 50, 36, 2, '#8a5a30'); box(c, 50, 64, 36, 2, '#8a5a30');
        fillPoly(c, [[46, 40], [56, 32], [100, 32], [90, 40]], '#d09858'); fillPoly(c, [[90, 40], [100, 32], [100, 68], [90, 76]], '#80542a'); };
      return { topic: 'POSITION', text: 'Where is the ball?', ...opts(`${where} the box`, ['in front of the box', 'behind the box', 'next to the box', 'on top of the box']),
        steps: ['Look at the ball. Then look at the box.', where === 'behind' ? 'The box hides part of the ball: it is behind the box.' : `The ball is ${where} the box.`], size: [150, 80], fig: c => {
          box(c, 0, 76, 150, 1, DIM); if (where === 'behind') icon(c, 'ball', x, y, 2); crate(c); if (where !== 'behind') icon(c, 'ball', x, y, 2);
        } };
    }
    const where = pick(['on', 'under', 'next to', 'above']), [x, y] = { on: [56, 22], under: [56, 58], 'next to': [120, 58], above: [56, 1] }[where];
    return { topic: 'POSITION', text: 'Where is the ball?', ...opts(`${where} the table`, ['on the table', 'under the table', 'next to the table', 'above the table']),
      steps: ['Look at the ball. Then look at the table.', `The ball is ${where} the table.`], size: [150, 80], fig: c => {
        box(c, 0, 76, 150, 1, DIM); box(c, 26, 40, 76, 6, '#a0683c'); box(c, 26, 40, 76, 1, '#c88a58'); box(c, 31, 46, 4, 30, '#80502c'); box(c, 93, 46, 4, 30, '#80502c');
        icon(c, 'ball', x, y, 2); if (where === 'above') for (const dx of [4, 9, 14]) box(c, x + dx, y + 22, 1, 4, LITE);
      } };
  };

  K.composeShapes = () => {
    const C = pick(COMPOSE.filter(s => FLAT.includes(s.make))), cols = pickN(COLS, 2);
    return { topic: 'MAKING SHAPES', text: `${C.n} ${C.part}s are put together. What shape do they make?`, ...opts(C.make, notIt(C.make, FLAT)),
      steps: ['Look at the outside edge of the big shape.', SHAPE_FACTS[C.make], `They make a ${C.make}.`], ...composeFig(C, cols) };
  };

  Questions.grade({ id: 'k', n: 0, label: 'KINDERGARTEN', short: 'K', clock: [75, 70, 65, 60, 60], kinds: K,
    min: { countTens: 2, orderNumbers: 2, decompose: 2, teens: 2, sortCount: 2, composeShapes: 2 } });

  // ---- Story problems, unknown in any spot: a + b = t. The wrong answers do the other operation or slip a column.
  const ITEMS = ['stickers', 'marbles', 'toy cars', 'crayons', 'shells', 'cards', 'beads', 'stamps', 'rocks', 'books', 'blocks', 'robots'];
  const TINTED = ['marbles', 'crayons', 'beads', 'blocks', 'balloons', 'toy cars'];
  function story(type, t, a) {
    const [P, Q] = kids(2), b = t - a, it = pick(ITEMS), col = pick(TINTED), one = k => v1(k, col.replace(/s$/, ''), col);
    const S = (text, ans, x, op, y, hint) => ({ text, ans, x, op, y, hint });
    switch (type) {
      case 'join': return S(`${P.n} has ${a} ${it}. ${P.He} gets ${b} more. How many ${it} does ${P.he} have now?`, t, a, '+', b, 'More are added, so add.');
      case 'together': return S(`${P.n} has ${a} red ${one(a)} and ${b} blue ${one(b)}. How many ${col} does ${P.he} have in all?`, t, a, '+', b, 'Put the two groups together: add.');
      case 'take': return S(`${P.n} has ${t} ${it}. ${P.He} gives ${a} to ${Q.n}. How many does ${P.he} have left?`, b, t, '-', a, 'Some are given away, so subtract.');
      case 'apart': return S(`${P.n} has ${t} ${col}. ${a} ${v1(a, 'is', 'are')} red. The rest are blue. How many are blue?`, b, t, '-', a, 'Take the red ones out of the total.');
      case 'change+': return S(`${P.n} had ${a} ${it}. ${P.He} got some more. Now ${P.he} has ${t}. How many did ${P.he} get?`, b, t, '-', a, `Think: ${a} + ? = ${t}. Subtract to find it.`);
      case 'change-': return S(`${P.n} had ${t} ${it}. ${P.He} gave some away. Now ${P.he} has ${a}. How many did ${P.he} give away?`, b, t, '-', a, `Think: ${t} - ? = ${a}.`);
      case 'start+': return S(`${P.n} had some ${it}. ${P.He} got ${b} more. Now ${P.he} has ${t}. How many did ${P.he} have at first?`, a, t, '-', b, `Some + ${b} = ${t}. Work backward: subtract.`);
      case 'start-': return S(`${P.n} had some ${it}. ${P.He} gave away ${a}. Now ${P.he} has ${b}. How many did ${P.he} have at first?`, t, b, '+', a, `Some - ${a} = ${b}. Work backward: add.`);
      case 'more': return S(`${P.n} has ${t} ${it}. ${Q.n} has ${a}. How many more ${it} does ${P.n} have?`, b, t, '-', a, 'Compare: find the difference.');
      case 'fewer': return S(`${P.n} has ${t} ${it}. ${Q.n} has ${a}. How many fewer ${it} does ${Q.n} have?`, b, t, '-', a, 'Compare: find the difference.');
      case 'bigger': return S(`${Q.n} has ${a} ${it}. ${P.n} has ${b} more than ${Q.n}. How many ${it} does ${P.n} have?`, t, a, '+', b, `${P.n} has more, so add.`);
      case 'smaller': return S(`${P.n} has ${t} ${it}. ${Q.n} has ${b} fewer than ${P.n}. How many ${it} does ${Q.n} have?`, a, t, '-', b, `${Q.n} has fewer, so subtract.`);
      case 'trickFewer': return S(`${Q.n} has ${a} ${it}. That is ${b} fewer than ${P.n} has. How many does ${P.n} have?`, t, a, '+', b, `${Q.n} has fewer, so ${P.n} has more: add.`);
      default: return S(`${P.n} has ${t} ${it}. That is ${b} more than ${Q.n} has. How many does ${Q.n} have?`, a, t, '-', b, `${P.n} has more, so ${Q.n} has less: subtract.`);
    }
  }
  function storyQ(type, t, a, topic = 'WORD PROBLEM') {
    const s = story(type, t, a), other = s.op === '+' ? Math.abs(s.x - s.y) : s.x + s.y, slip = s.op === '+' ? noCarry(s.x, s.y) : noBorrow(s.x, s.y);
    return { topic, text: s.text, ...nums(s.ans, [other, slip, s.ans + 10, s.ans - 10, s.ans + 1, s.ans - 1]), steps: [s.hint, `${s.x} ${s.op} ${s.y} = ${s.ans}`, `The answer is ${s.ans}.`] };
  }
  // A part a of t; regroup true/false asks for (or rules out) a carry or a borrow in t - a and a + (t - a).
  const splitT = (t, regroup) => { const all = t >= 4 ? range(2, t - 2) : range(1, t - 1), c = all.filter(a => regroup == null || ((a % 10) > (t % 10)) === regroup); return pick(c.length ? c : all); };

  // ---- Survey graphs: tally charts, picture graphs, bar graphs.
  const SURVEYS = [
    { what: 'favorite pets', cats: ['CATS', 'DOGS', 'FISH', 'BIRDS'], ic: 'heart' },
    { what: 'favorite fruits', cats: ['APPLE', 'PEAR', 'PLUM', 'GRAPE'], ic: 'apple' },
    { what: 'favorite colors', cats: ['RED', 'BLUE', 'GREEN', 'PINK'], ic: 'star' },
    { what: 'favorite sports', cats: ['RUN', 'SWIM', 'BIKE', 'SKATE'], ic: 'ball' },
    { what: 'favorite snacks', cats: ['CHIPS', 'FRUIT', 'NUTS', 'CAKE'], ic: 'cookie' },
    { what: 'favorite flowers', cats: ['ROSE', 'LILY', 'DAISY', 'TULIP'], ic: 'flower' },
  ];
  function survey(n, lo, hi) { const S = pick(SURVEYS), k = pickN(range(0, 3), n).sort(); return { S, cats: k.map(i => S.cats[i]), vals: pickN(range(lo, hi), n) }; }
  function graphQ(kind, S, cats, vals) {
    const lc = cats.map(s => s.toLowerCase()), [i, j] = pickN(range(0, cats.length - 1), 2), big = vals[i] > vals[j] ? i : j, small = big === i ? j : i;
    const diff = vals[big] - vals[small], sum = vals[i] + vals[j], total = vals.reduce((a, v) => a + v, 0), pre = `The ${kind} shows ${S.what}. `;
    const read = `${cap(lc[big])}: ${vals[big]}. ${cap(lc[small])}: ${vals[small]}.`;
    switch (pick(['read', 'more', 'fewer', 'both', 'all', 'most'])) {
      case 'read': return { text: pre + `How many kids chose ${lc[i]}?`, ...nums(vals[i], [vals[i] + 1, vals[i] - 1, vals[j], sum], String, 1),
        steps: [kind === 'bar graph' ? `Go across from the top of the ${lc[i]} bar to the numbers.` : `Find the ${lc[i]} row and count.`, `${vals[i]} kids chose ${lc[i]}.`] };
      case 'more': return { text: pre + `How many more kids chose ${lc[big]} than ${lc[small]}?`, ...nums(diff, [vals[big] + vals[small], vals[big], vals[small], diff + 1]), steps: [read, `${vals[big]} - ${vals[small]} = ${diff}`, `${diff} more chose ${lc[big]}.`] };
      case 'fewer': return { text: pre + `How many fewer kids chose ${lc[small]} than ${lc[big]}?`, ...nums(diff, [vals[big] + vals[small], vals[big], vals[small], diff + 1]), steps: [read, `${vals[big]} - ${vals[small]} = ${diff}`, `${diff} fewer chose ${lc[small]}.`] };
      case 'both': return { text: pre + `How many kids chose ${lc[i]} or ${lc[j]}?`, ...nums(sum, [diff, sum + 1, sum - 1, vals[i]]), steps: [read, `Put them together: ${vals[i]} + ${vals[j]} = ${sum}`] };
      case 'all': return { text: pre + 'How many kids voted in all?', ...nums(total, [total + 1, total - 1, total - vals[0], total + 2]), steps: [`Add them all up: ${vals.join(' + ')}`, `= ${total}`] };
      default: { const m = vals.indexOf(Math.max(...vals)); return { text: pre + 'Which one did the most kids choose?', ...opts(lc[m], [...lc, 'all the same', 'none of them']), steps: [`Counts: ${vals.join(', ')}.`, `${vals[m]} is the most: ${lc[m]}.`] }; }
    }
  }

  // ---- Equal and unequal shares, for the halves, thirds and fourths questions.
  const UNEQUAL_CUTS = { 2: [0, 130], 3: [0, 90, 200], 4: [0, 60, 150, 270] }, UNEQUAL_RECT = { 2: [.32], 3: [.2, .55], 4: [.15, .4, .7] };
  function shareSpec(n, equal, circ = rand() < .5) {
    const off = n === 4 && rand() < .5 ? 45 : 0;
    return circ ? { circ, cuts: equal ? range(0, n - 1).map(i => i * 360 / n + off) : UNEQUAL_CUTS[n] } : { circ, how: pick(['cols', 'rows']), at: equal ? n : UNEQUAL_RECT[n] };
  }
  const isEqualShare = (s, n) => s.circ ? s.cuts.length === n && s.cuts[1] - s.cuts[0] === 360 / n : s.at === n;
  const drawShare = (c, s, cx, cy, sh = [], big = false) => s.circ ? pie(c, cx, cy, big ? 20 : 15, s.cuts, sh)
    : parts(c, big ? rectParts(cx - 24, cy - 16, 48, 32, s.how, s.at) : rectParts(cx - 18, cy - 12, 36, 24, s.how, s.at), sh);

  // ======================================================== 1ST GRADE
  const G1 = {};
  function strategy(a, b) {
    const s = a + b, big = Math.max(a, b), small = Math.min(a, b);
    if (a === b) return `It's a double: ${a} + ${a} = ${s}.`;
    if (big - small === 1) return `Near double: ${small} + ${small} = ${2 * small}, and 1 more is ${s}.`;
    if (s > 10) return `Make a ten: ${big} + ${10 - big} = 10, then ${small - (10 - big)} more is ${s}.`;
    return `Start at ${big} and count on ${small}: ${range(big + 1, s).join(', ')}.`;
  }
  const addSteps = (a, b) => {
    const ao = a % 10, bo = b % 10, os = ao + bo, cy = os >= 10, ta = Math.floor(a / 10), tb = Math.floor(b / 10);
    return [`Ones: ${ao} + ${bo} = ${os}.${cy ? ` That's 1 ten and ${os - 10} ${v1(os - 10, 'one', 'ones')}.` : ''}`, `Tens: ${ta} + ${tb}${cy ? ' + 1' : ''} = ${ta + tb + (cy ? 1 : 0)} tens.`, `${a} + ${b} = ${a + b}`];
  };

  G1.addFacts = d => {
    const s = randInt(d === 1 ? 2 : 6, [0, 10, 14, 18, 18][d]), a = randInt(Math.max(1, s - 9), Math.min(9, s - 1)), b = s - a;
    return { topic: 'ADDITION', text: `${a} + ${b} = ?`, say: `What is ${a} plus ${b}?`, ...nums(s, [s + 1, s - 1, Math.abs(a - b), s + 10]),
      steps: [strategy(a, b), `${a} + ${b} = ${s}`], ...(d === 1 ? { size: [64, 28], fig: c => tenFrame(c, 7, 4, s, RED, 10, a, BLU) } : {}) };
  };

  G1.subFacts = d => {
    const a = randInt(d === 1 ? 3 : 8, [0, 10, 14, 18, 18][d]), b = randInt(1, Math.min(9, a - 1)), r = a - b;
    return { topic: 'SUBTRACTION', text: `${a} - ${b} = ?`, say: `What is ${a} minus ${b}?`, ...nums(r, [a + b, r + 1, r - 1, a >= 10 ? noBorrow(a, b) : r + 2]),
      steps: [`Think addition: ${b} + ? = ${a}.`, `${b} + ${r} = ${a}`, `So ${a} - ${b} = ${r}.`] };
  };

  G1.makeTen = () => {
    const a = randInt(6, 9), b = randInt(11 - a, 9), s = a + b, e = s - 10, move = 10 - a, total = rand() < .4;
    return { topic: 'MAKE A TEN', text: total ? `Make a ten to add. ${a} + ${b} = ?` : `${a} + ${b} is the same as 10 + ?`,
      say: total ? `Make a ten to add. What is ${a} plus ${b}?` : `${a} plus ${b} is the same as 10 plus what number?`,
      ...(total ? nums(s, [s - 1, s + 1, e, s + 10]) : nums(e, [b, move, e + 1, e - 1, s])),
      steps: [`${a} needs ${move} more to make 10.`, `Move ${move} from the ${b}. ${e} ${v1(e, 'is', 'are')} left.`, `${a} + ${b} = 10 + ${e} = ${s}`],
      size: [64, 50], fig: c => { tenFrame(c, 7, 4, a, RED); tenFrame(c, 7, 27, b, BLU, 10, 0); } };
  };

  G1.doubles = d => {
    const n = randInt(d === 1 ? 1 : 2, d <= 2 ? 6 : 9), kind = d === 1 ? 'double' : pick(['double', 'plus', 'minus']), name = pick(ICONS);
    if (kind === 'double') return { topic: 'DOUBLES', text: `${n} + ${n} = ?`, say: `What is ${n} plus ${n}?`, ...nums(2 * n, [2 * n + 1, 2 * n - 1, n, n + 1]),
      steps: ['A double is the same number twice.', `${n} + ${n} = ${2 * n}`], size: [Math.max(48, Math.min(n, 9) * 11 + 10), 30], fig: (c, w) => { const x = Math.round((w - (n * 11 - 2)) / 2); picRows(c, name, n, x, 5, 9); picRows(c, name, n, x, 16, 9); } };
    const m = kind === 'plus' ? n + 1 : n - 1, s = n + m, word = kind === 'plus' ? 'more' : 'less';
    return { topic: 'DOUBLES', text: `${n} + ${n} = ${2 * n}. So what is ${n} + ${m}?`, say: `${n} plus ${n} is ${2 * n}. So what is ${n} plus ${m}?`,
      ...nums(s, [2 * n, 2 * n + (kind === 'plus' ? 2 : -2), s + 1, s - 1]),
      steps: [`${m} is 1 ${word} than ${n}.`, `So the answer is 1 ${word} than ${2 * n}.`, `${n} + ${m} = ${s}`] };
  };

  G1.wordResult = d => { const t = randInt(d === 1 ? 4 : 8, d === 1 ? 10 : 20); return storyQ(pick(['join', 'together', 'take', 'apart']), t, splitT(t)); };
  G1.wordUnknown = d => { const t = randInt(6, d === 1 ? 10 : 20); return storyQ(pick(['change+', 'change-', 'start+', 'start-'].slice(0, d + 1)), t, splitT(t)); };
  G1.wordCompare = d => { const t = randInt(6, d === 1 ? 10 : 20); return storyQ(pick(['more', 'fewer', 'bigger', 'smaller', ...(d >= 3 ? ['trickFewer', 'trickMore'] : [])]), t, splitT(t), 'COMPARING'); };

  G1.threeAdd = () => {
    const a = randInt(1, 8), b = randInt(1, 8), c3 = randInt(1, Math.min(9, 20 - a - b)), s = a + b + c3, [P] = kids(1), marbles = rand() < .6;
    const ten = a + c3 === 10 ? [a, c3] : b + c3 === 10 ? [b, c3] : a + b === 10 ? [a, b] : null;
    const text = marbles ? `${P.n} has ${a} red, ${b} blue and ${c3} green marbles. How many marbles in all?`
      : pick([`${P.n} reads ${a} books in June, ${b} in July and ${c3} in August. How many books is that?`, `A pet shop has ${a} cats, ${b} dogs and ${c3} rabbits. How many pets in all?`]);
    return { topic: 'ADD 3 NUMBERS', text, ...nums(s, [a + b, b + c3, a + c3, s + 1, s - 1]),
      steps: [ten ? `Find a ten first: ${ten[0]} + ${ten[1]} = 10.` : `First ${a} + ${b} = ${a + b}.`, ten ? `10 + ${s - 10} = ${s}` : `Then ${a + b} + ${c3} = ${s}.`, `${a} + ${b} + ${c3} = ${s}`],
      ...(marbles ? { size: [84, 32], fig: c => [[a, RED], [b, BLU], [c3, GRN]].forEach(([n, col], r) => { for (let i = 0; i < n; i++) disc(c, 9 + i * 8, 6 + r * 10, 3, col); }) } : {}) };
  };

  G1.properties = () => {
    let a = randInt(2, 9), b = randInt(1, 9); if (a === b) b = a - 1;
    const s = a + b, f = pick(['turn', 'same', 'ten']);
    if (f === 'turn') return { topic: 'ADD IN ANY ORDER', text: `${a} + ${b} = ${s}. What is ${b} + ${a}?`, say: `${a} plus ${b} is ${s}. What is ${b} plus ${a}?`,
      ...nums(s, [s + 1, s - 1, Math.abs(a - b), b]), steps: ['You can add in any order.', `${b} + ${a} is the same as ${a} + ${b}.`, `So ${b} + ${a} = ${s}.`] };
    if (f === 'same') return { topic: 'ADD IN ANY ORDER', text: `Which is the same as ${a} + ${b}?`, say: `Which one is the same as ${a} plus ${b}?`,
      ...opts(`${b} + ${a}`, [`${a} - ${b}`, `${a} + ${b + 1}`, `${a + 1} + ${b + 1}`, `${a} + ${a}`]), steps: ['Adding in any order gives the same answer.', `${a} + ${b} = ${s}, and ${b} + ${a} = ${s} too.`] };
    const x = randInt(1, 9), y = randInt(1, 9), z = 10 - x;
    return { topic: 'ADD 3 NUMBERS', text: `${x} + ${y} + ${z} = ?`, say: `What is ${x} plus ${y} plus ${z}?`, ...nums(10 + y, [x + y, 10, 11 + y, 9 + y]),
      steps: [`Look for a ten: ${x} + ${z} = 10.`, `Then 10 + ${y} = ${10 + y}.`] };
  };

  G1.missing = d => {
    const s = randInt(d === 1 ? 5 : 8, d === 1 ? 10 : 20), a = randInt(1, Math.min(9, s - 1)), b = s - a;
    const f = pick(d === 1 ? ['a+?', '?+b'] : ['a+?', '?+b', 's-?', '?-b', 's=a+?']);
    const F = {
      'a+?': [`${a} + ? = ${s}`, `${a} plus what number makes ${s}?`, b, `Count on from ${a} to ${s}.`, `${a} + ${b} = ${s}`],
      '?+b': [`? + ${b} = ${s}`, `What number plus ${b} makes ${s}?`, a, `Think: ${s} - ${b} = ?`, `${a} + ${b} = ${s}`],
      's-?': [`${s} - ? = ${a}`, `${s} minus what number leaves ${a}?`, b, `Count up from ${a} to ${s}.`, `${s} - ${b} = ${a}`],
      '?-b': [`? - ${b} = ${a}`, `What number minus ${b} leaves ${a}?`, s, `Think: ${a} + ${b} = ?`, `${s} - ${b} = ${a}`],
      's=a+?': [`${s} = ${a} + ?`, `${s} is the same as ${a} plus what number?`, b, 'The = sign means both sides are the same.', `${s} = ${a} + ${b}`],
    }[f];
    return { topic: 'MISSING NUMBER', text: F[0], say: F[1], ...nums(F[2], [s, s + a, F[2] + 1, F[2] - 1]), steps: [F[3], F[4], `The missing number is ${F[2]}.`] };
  };

  G1.trueFalse = () => {
    const a = randInt(2, 9), b = randInt(3, 9), s = a + b, c = pick(range(1, s - 1).filter(v => v !== a && v !== b));
    const T = pick([
      [`${a} + ${b} = ${s}`, `${a} + ${b} makes ${s}.`], [`${s} = ${a} + ${b}`, `${a} + ${b} makes ${s}, the same as the left side.`],
      [`${a} + ${b} = ${b} + ${a}`, 'Adding in any order gives the same answer.'], [`${a} + ${b} = ${c} + ${s - c}`, `Both sides make ${s}.`],
      [`${s} - ${b} = ${a}`, `${b} + ${a} = ${s}, so ${s} - ${b} = ${a}.`], [`${s} = ${s}`, `${s} is the same as ${s}.`],
    ]);
    const falses = [`${a} + ${b} = ${s + 1}`, `${s} = ${a} + ${b + 1}`, `${a} + ${b} = ${s} + ${b}`, `${a} + ${b} = ${c} + ${s - c + 1}`, `${s} - ${b} = ${a + 1}`, `${a} = ${a} + ${b}`];
    if (a !== b) falses.push(`${s} - ${b} = ${b}`);
    return { topic: 'TRUE OR FALSE', text: 'Which number sentence is true?', ...opts(T[0], shuffle(falses)), steps: ['The = sign means both sides are worth the same.', `${T[0]}: ${T[1]}`] };
  };

  G1.countOn = d => {
    const back = d >= 2 && rand() < .4, b = randInt(1, d === 1 ? 3 : 5), a = back ? randInt(b + 1, 20) : randInt(0, 20 - b), end = back ? a - b : a + b;
    const L = Math.max(0, Math.min(10, Math.min(a, end) - randInt(1, 3))), showHops = rand() < .5, path = back ? range(end, a - 1).reverse() : range(a + 1, end);
    return { topic: 'COUNT ON', text: `Start at ${a}. Count ${back ? 'back' : 'on'} ${b}. Where do you land?`, ...nums(end, [back ? a + b : a - b, end + 1, end - 1, a]),
      steps: [`Start at ${a}.`, `Count ${back ? 'back' : 'on'} ${b}: ${path.join(', ')}.`, `${a} ${back ? '-' : '+'} ${b} = ${end}`],
      size: [168, 44], fig: (c, w) => {
        const X = numLine(c, 12, w - 13, 30, L, L + 10, 1, 1, showHops ? [end] : []); disc(c, X(a), 30, 2, HOT);
        if (showHops) { for (let i = 0; i < b; i++) { const p = back ? a - i : a + i; hop(c, X(p), X(back ? p - 1 : p + 1), 30, 6); } qbox(c, X(end), 10); }
      } };
  };

  G1.factFamily = () => {
    let a = randInt(2, 9), b = randInt(1, 9); if (a === b) b = a - 1;
    const s = a + b, E = (x, o, y, z) => `${x} ${o} ${y} = ${z}`, right = pick([E(s, '-', a, b), E(s, '-', b, a), E(b, '+', a, s)]);
    return { topic: 'FACT FAMILIES', text: `${a} + ${b} = ${s}. Which fact uses the same 3 numbers?`, say: `${a} plus ${b} equals ${s}. Which fact uses the same three numbers?`,
      ...opts(right, [E(s, '+', a, s + a), E(s + 1, '-', a, b + 1), E(b, '+', s, b + s), E(a, '+', b + 1, s + 1)]),
      steps: [`The numbers are ${a}, ${b} and ${s}.`, `${s} - ${a} = ${b} and ${s} - ${b} = ${a} use them too.`, `So: ${right}`] };
  };

  G1.count120 = d => {
    const top = [0, 50, 100, 120, 120][d], f = pick(d >= 3 ? ['after', 'before', 'seq', 'words'] : ['after', 'before', 'seq']);
    if (f === 'words') {
      const n = randInt(101, 120), swap = 100 + (n % 10) * 10 + Math.floor(n / 10) % 10;
      return { topic: 'NUMBERS TO 120', text: `Which number is ${wordsOf(n)}?`, ...nums(n, [Number('100' + (n - 100)), swap, n + 10, n - 10], comma),
        steps: ['One hundred is 100.', `Then ${words99(n - 100)} is ${n - 100}.`, `So the number is ${n}.`] };
    }
    if (f === 'after') {
      const n = rand() < .5 ? 10 * randInt(1, top / 10 - 1) + 9 : randInt(5, top - 1);
      return { topic: 'NUMBERS TO 120', text: `What number comes right after ${n}?`, ...nums(n + 1, [n - 1, n + 10, Math.floor(n / 10) * 10, n + 2]),
        steps: ['Right after means 1 more.', `${n} + 1 = ${n + 1}`] };
    }
    if (f === 'before') {
      const n = rand() < .5 ? 10 * randInt(2, top / 10) : randInt(5, top);
      return { topic: 'NUMBERS TO 120', text: `What number comes right before ${n}?`, ...nums(n - 1, [n + 1, n - 10, n - 2, n + 9]),
        steps: ['Right before means 1 less.', `${n} - 1 = ${n - 1}`] };
    }
    const a = rand() < .5 ? Math.min(top - 3, 10 * randInt(1, top / 10) - randInt(1, 3)) : randInt(1, top - 3), seq = [a, a + 1, a + 2, a + 3];
    return { topic: 'COUNTING', text: 'What number comes next?', ...nums(a + 3, [a + 4, a + 2, a + 13, Math.floor((a + 3) / 10) * 10 - 10], String, 1),
      steps: ['Count up by ones.', seq.join(', ') + '.'], ...tiles([a, a + 1, a + 2, null]) };
  };

  G1.hundredChart = d => {
    const top = d <= 2 ? 100 : 120, v = 10 * randInt(1, top / 10 - 2) + randInt(2, 9), off = [-11, -10, -9, -1, 0, 1, 9, 10, 11], k = randInt(0, 8), ans = v + off[k];
    return { topic: 'HUNDRED CHART', text: 'This is part of a hundred chart. What number goes in the ? box?', say: 'This is part of a hundred chart. What number goes in the question mark box?',
      ...nums(ans, [ans + 1, ans - 1, ans + 10, ans - 10]),
      steps: ['Going right, numbers go up by 1.', 'Going down, numbers go up by 10.', `So the ? box is ${ans}.`],
      size: [84, 46], fig: c => off.forEach((o, i) => {
        const x = 3 + (i % 3) * 26, y = 2 + (i / 3 | 0) * 14; box(c, x, y, 27, 15, DIM); box(c, x + 1, y + 1, 25, 13, i === k ? '#3a3008' : '#141c48');
        ink(c, i === k ? '?' : v + o, x + 14, y + 8, i === k ? HOT : INK);
      }) };
  };

  G1.blocksTens = d => {
    let H = 0, T, O;
    if (d === 4 && rand() < .4) { H = 1; T = randInt(0, 2); O = T === 2 ? 0 : randInt(0, 9); }
    else if (d >= 3 && rand() < .35) { T = randInt(1, 6); O = randInt(10, 14); }
    else { T = randInt(1, d === 1 ? 5 : 9); O = randInt(0, 9); }
    const n = 100 * H + 10 * T + O;
    return { topic: 'TENS AND ONES', text: 'What number do the blocks show?', ...nums(n, [O < 10 ? 10 * O + T : n - 10, H + T + O, 10 * T + 100 * H, n + 10, n - 10]),
      steps: H ? ['The big flat is 100.', `${T} tens is ${10 * T}. ${O} ones is ${O}.`, `100 + ${10 * T} + ${O} = ${n}`]
        : O >= 10 ? [`${O} ones is 1 ten and ${O - 10} ${v1(O - 10, 'one', 'ones')}.`, `So it is ${T + 1} tens and ${O - 10} ${v1(O - 10, 'one', 'ones')}.`, `That is ${n}.`]
          : [`Each long rod is a ten: ${T} ${v1(T, 'ten', 'tens')} = ${10 * T}.`, `Each small cube is a one: ${O} ${v1(O, 'one', 'ones')}.`, `${10 * T} + ${O} = ${n}`], ...blocks(H, T, O) };
  };

  G1.tensOnes = () => {
    const T = randInt(1, 9), O = randInt(0, 9), n = 10 * T + O, f = pick(['tens', 'ones', 'build', 'decade', 'teen']);
    if (f === 'tens') return { topic: 'TENS AND ONES', text: `${n} is how many tens and ${O} ${v1(O, 'one', 'ones')}?`, ...nums(T, [O, n, T + 1, T - 1]), steps: [`The tens digit of ${n} is ${T}.`, `${n} = ${T} tens and ${O} ones.`] };
    if (f === 'ones') return { topic: 'TENS AND ONES', text: `${n} is ${T} tens and how many ones?`, ...nums(O, [T, n, O + 1, O + 10]), steps: [`The ones digit of ${n} is ${O}.`, `${n} = ${T} tens and ${O} ones.`] };
    if (f === 'build') return { topic: 'TENS AND ONES', text: `What number is ${T} ${v1(T, 'ten', 'tens')} and ${O} ${v1(O, 'one', 'ones')}?`, ...nums(n, [10 * O + T, T + O, 10 * T, n + 10]), steps: [`${T} tens is ${10 * T}.`, `${10 * T} + ${O} = ${n}`] };
    if (f === 'decade') return { topic: 'TENS AND ONES', text: `What number is ${T} tens?`, ...nums(10 * T, [T, T + 10, 10 * T + T, 10 * T + 10]), steps: ['Each ten is 10.', `${T} tens: ${range(1, T).map(k => 10 * k).join(', ')}.`, `${T} tens = ${10 * T}`] };
    return { topic: 'TEEN NUMBERS', text: `${10 + O} is 1 ten and how many ones?`, ...nums(O, [10 + O, O + 1, 10, 1]), steps: [`${10 + O} = 10 + ${O}`, `So it is 1 ten and ${O} ones.`] };
  };

  G1.compare = d => {
    let a, b;
    const mode = d === 1 ? 'tens' : pick(['tens', 'same', 'flip']);
    if (mode === 'flip') { const x = randInt(1, 9); let y = randInt(1, 8); if (y >= x) y++; a = 10 * x + y; b = 10 * y + x; }
    else if (mode === 'same') { const t = randInt(1, 9), [p, q] = pickN(range(0, 9), 2); a = 10 * t + p; b = 10 * t + q; }
    else { const [p, q] = pickN(range(1, 9), 2); a = 10 * p + randInt(0, 9); b = 10 * q + randInt(0, 9); }
    const big = Math.max(a, b), small = Math.min(a, b), why = Math.floor(big / 10) !== Math.floor(small / 10) ? `${big} has more tens than ${small}.` : `Same tens, so look at the ones: ${big % 10} > ${small % 10}.`;
    if (rand() < .6) return { topic: 'COMPARE', text: 'Which is true?', ...opts(rand() < .5 ? `${big} > ${small}` : `${small} < ${big}`, [`${big} < ${small}`, `${small} > ${big}`, `${small} = ${big}`]),
      steps: ['Compare the tens first, then the ones.', why, `The open side of > or < faces the bigger number.`] };
    const greater = rand() < .5, n = randInt(25, 85), right = greater ? n + randInt(1, Math.min(12, 99 - n)) : n - randInt(1, 12);
    const others = shuffle(greater ? [n - 1, n - 10, n - randInt(2, 9), n] : [n + 1, n + 10, n + randInt(2, 9), n]);
    return { topic: 'COMPARE', text: `Which number is ${greater ? 'greater' : 'less'} than ${n}?`, ...jumble(right, others),
      steps: ['Compare the tens first, then the ones.', `${right} is ${greater ? 'greater' : 'less'} than ${n}.`] };
  };

  G1.add2digit = d => {
    let a, b;
    if (d === 1) { a = 10 * randInt(1, 8) + randInt(0, 8); b = randInt(1, 9 - a % 10); }
    else if (d === 2) { a = randInt(11, 79); b = 10 * randInt(1, 9 - Math.floor(a / 10)); }
    else if (d === 3) { a = 10 * randInt(1, 8) + randInt(1, 9); b = randInt(10 - a % 10, 9); }
    else { a = randInt(11, 78); b = randInt(11, 99 - a); }
    const s = a + b;
    return { topic: 'ADDITION', text: `${a} + ${b} = ?`, say: `What is ${a} plus ${b}?`, ...nums(s, [noCarry(a, b), b < 10 ? a + 10 * b : s + 10, s + 10, s - 10, s + 1]), steps: addSteps(a, b) };
  };

  G1.tenMore = d => {
    const more = rand() < .5, hi = d >= 3, n = more ? randInt(11, hi ? 110 : 89) : randInt(21, hi ? 120 : 99), ans = more ? n + 10 : n - 10;
    return { topic: '10 MORE, 10 LESS', text: `What is 10 ${more ? 'more' : 'less'} than ${n}?`, ...nums(ans, [more ? n + 1 : n - 1, more ? n - 10 : n + 10, ans + 1, ans - 1]),
      steps: [`10 ${more ? 'more' : 'less'} is 1 ${more ? 'more' : 'less'} ten. The ones stay the same.`, `${n} ${more ? '+' : '-'} 10 = ${ans}`] };
  };

  G1.subTens = () => {
    const A = randInt(2, 9), B = randInt(1, A - 1), a = 10 * A, b = 10 * B, r = a - b;
    return { topic: 'SUBTRACT TENS', text: `${a} - ${b} = ?`, say: `What is ${a} minus ${b}?`, ...nums(r, [a + b, A - B, r + 10, r - 10]),
      steps: [`${a} is ${A} tens. ${b} is ${B} ${v1(B, 'ten', 'tens')}.`, `${A} tens - ${B} ${v1(B, 'ten', 'tens')} = ${A - B} ${v1(A - B, 'ten', 'tens')}.`, `${a} - ${b} = ${r}`],
      size: [84, 46], fig: (c, w) => { const x0 = Math.round((w - (A * 8 - 3)) / 2); for (let i = 0; i < A; i++) { unitGrid(c, x0 + i * 8, 2, 1, 10, 4); if (i >= A - B) { line(c, x0 + i * 8 - 1, 2, x0 + i * 8 + 5, 42, RED); line(c, x0 + i * 8 + 5, 2, x0 + i * 8 - 1, 42, RED); } } } };
  };

  G1.orderLength = () => {
    if (rand() < .55) {
      const cols = pickN(KCOL, 3), ls = pickN(range(3, 12), 3).map(v => v * 8), long = rand() < .5, idx = [0, 1, 2].sort((p, q) => long ? ls[q] - ls[p] : ls[p] - ls[q]);
      const name = o => o.map(i => cols[i][0]).join(', '), right = name(idx), perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
      return { topic: 'ORDER BY LENGTH', text: `Which list goes from ${long ? 'longest to shortest' : 'shortest to longest'}?`, ...opts(right, shuffle(perms.map(name))),
        steps: ['The ribbons all start at the same line.', `${long ? 'Longest' : 'Shortest'} first: ${right.toLowerCase()}.`],
        size: [112, 44], fig: (c, w, h) => { line(c, 6, 2, 6, h - 3, DIM, 1); ls.forEach((L, i) => thing(c, 'ribbon', 7, 7 + L, 9 + i * 13, cols[i][1])); } };
    }
    const [A, B, C] = pickN(['red', 'blue', 'green', 'yellow'], 3), long = rand() < .5;
    return { topic: 'COMPARE LENGTH', text: `The ${A} rope is longer than ${B}. ${cap(B)} is longer than ${C}. Which rope is ${long ? 'longest' : 'shortest'}?`,
      ...opts(long ? A : C, [A, B, C, "can't tell"]), steps: [`${cap(A)} is longer than ${B}, and ${B} is longer than ${C}.`, `So ${A} is the longest and ${C} is the shortest.`] };
  };

  G1.measureUnits = d => {
    const clip = rand() < .45, u = clip ? 14 : 10, k = randInt(2, clip ? 6 : 8), kind = pick(['pencil', 'crayon', 'ribbon', 'caterpillar', 'straw']), extra = d >= 3 ? randInt(1, 2) : 0;
    const unit = clip ? 'paper clips' : 'cubes', n = k + extra, w = n * u;
    return { topic: 'MEASURING', text: `How many ${unit} long is the ${kind}?`, ...nums(k, [k + 1, k - 1, n + 1, k + 2], String, 1),
      steps: [`The first ${unit.slice(0, -1)} starts where the ${kind} starts.`, `Count up to where it ends: ${upto(k)}.`, `It is ${k} ${unit} long.`],
      size: [w + 16, 30], fig: (c, W) => {
        const x0 = Math.round((W - w) / 2); thing(c, kind, x0, x0 + k * u - 1, 8);
        for (let i = 0; i < n; i++) {
          const x = x0 + i * u;
          if (clip) { const s = '#b8c0d0'; box(c, x + 1, 17, 12, 1, s); box(c, x + 1, 22, 12, 1, s); box(c, x, 18, 1, 4, s); box(c, x + 13, 18, 1, 4, s); box(c, x + 3, 19, 8, 1, s); box(c, x + 3, 20, 1, 1, s); }
          else { box(c, x, 16, 10, 10, i % 2 ? '#1c4c90' : '#8a2020'); box(c, x + 1, 17, 8, 8, i % 2 ? BLU : RED); }
        }
      } };
  };

  G1.clockHour = d => {
    const h = randInt(1, 12), m = d === 1 ? 0 : pick([0, 30, 30]), next = h % 12 + 1, prev = h === 1 ? 12 : h - 1, right = hm(h, m);
    const wrongs = m === 0 ? [hm(12, (h % 12) * 5), hm(h, 30), hm(next, 0), hm(h, 12), hm(prev, 0)] : [hm(next, 30), hm(h, 0), hm(6, (h % 12) * 5), hm(h, 6), hm(prev, 30)];
    return { topic: 'TIME', text: 'What time does the clock show?', ...opts(right, wrongs),
      steps: m === 0 ? ["The long minute hand points to 12: o'clock.", `The short hour hand points to ${h}.`, `It is ${right}.`]
        : ['The long minute hand points to 6: 30 minutes.', `The short hour hand is halfway from ${h} to ${next}.`, `It is ${right}, half past ${h}.`], ...bigClock(h, m) };
  };

  G1.clockMatch = () => {
    const h = randInt(1, 12), m = pick([0, 30]), next = h % 12 + 1, prev = h === 1 ? 12 : h - 1, words = rand() < .5;
    const cand = [[next, m], [h, m ? 0 : 30], m === 0 ? [12, (h % 12) * 5] : [6, (h % 12) * 5], [prev, m]];
    const times = shuffle([[h, m], ...cand.filter(([a, b]) => !(a === h && b === m)).slice(0, 3)]), at = times.findIndex(([a, b]) => a === h && b === m);
    return { topic: 'TIME', text: words ? (m ? `Which clock shows half past ${h}?` : `Which clock shows ${h} o'clock?`) : `Which clock shows ${hm(h, m)}?`, ...which(at),
      steps: [m ? 'Half past: the minute hand points to 6.' : "O'clock: the minute hand points to 12.", m ? `The hour hand is halfway past ${h}.` : `The hour hand points to ${h}.`, `That is clock ${at + 1}.`], ...fourClocks(times) };
  };

  G1.tally = d => {
    const { S, cats, vals } = survey(3, 1, [0, 8, 10, 12, 15][d]), lw = Math.max(...cats.map(s => Font.width(s))) + 6;
    return { topic: 'TALLY CHART', ...graphQ('tally chart', S, cats, vals), size: [lw + 50, 44], fig: (c, w) => cats.forEach((s, i) => {
      const y = 1 + i * 14; Font.draw(c, s, lw - 4, y + 3, INK, { align: 'right' }); tallyMarks(c, lw + 5, y + 3, vals[i]); if (i) line(c, 0, y, w - 1, y, GRID);
    }) };
  };

  G1.picGraph = d => {
    const { S, cats, vals } = survey(3, 1, d <= 2 ? 7 : 9), lw = Math.max(...cats.map(s => Font.width(s))) + 6;
    return { topic: 'PICTURE GRAPH', ...graphQ('picture graph', S, cats, vals), size: [lw + 10 * Math.max(...vals) + 8, 49], fig: (c, w, h) => picGraph(c, w, h, cats, vals, S.ic) };
  };

  G1.attributes = () => {
    if (rand() < .5) {
      const DEF = {
        triangle: ['It has 3 sides.', ['It is red.', 'It points up.', 'It is big.', 'It has 4 corners.']],
        square: ['It has 4 sides the same length.', ['It is blue.', 'It is small.', 'It has 3 corners.', 'It stands on a corner.']],
        rectangle: ['It has 4 square corners.', ['It is green.', 'It is long and thin.', 'It has 5 sides.', 'It is big.']],
        circle: ['It is round, with no corners.', ['It is yellow.', 'It is big.', 'It has 1 corner.', 'It is small.']],
        hexagon: ['It has 6 sides.', ['It is orange.', 'It has 5 corners.', 'It is big.', 'It is small.']],
      };
      const name = pick(Object.keys(DEF)), [right, wrongs] = DEF[name];
      return { topic: 'SHAPES', text: `Which is true about every ${name}?`, ...opts(right, wrongs), steps: ['Color, size and which way it turns can change.', `Every ${name} is the same in one way: ${right.toLowerCase()}`] };
    }
    const sq = rand() < .4, col = pick(COLS), o = shapeOpt(14), tilt = pick([0, .25, -.25]);
    // A real one and three look-alikes: open, curved, or the wrong number of sides.
    const draws = sq ? [
      (c, x, y) => poly(c, ngon(x, y, 15, 4, Math.PI / 4 + tilt), col), (c, x, y) => poly(c, [[x - 16, y - 8], [x + 16, y - 8], [x + 16, y + 8], [x - 16, y + 8]], col),
      (c, x, y) => poly(c, [[x, y - 15], [x + 10, y], [x, y + 15], [x - 10, y]], col), (c, x, y) => poly(c, [[x - 8, y - 11], [x + 8, y - 11], [x + 15, y + 11], [x - 15, y + 11]], col),
    ] : [
      (c, x, y) => poly(c, flatPts('triangle', x, y, Object.assign({}, o, { r: 15 })), col),
      (c, x, y) => { line(c, x - 2, y - 14, x - 15, y + 11, INK); line(c, x - 15, y + 11, x + 15, y + 11, INK); line(c, x + 15, y + 11, x + 4, y - 9, INK); },
      (c, x, y) => poly(c, [[x, y - 14], ...range(0, 8).map(i => { const t = i / 8, px = x + 15 - 30 * t; return [px, y + 11 - 6 * Math.sin(Math.PI * t) * -1]; }), [x - 15, y + 11]], col),
      (c, x, y) => poly(c, [[x - 6, y - 13], [x + 9, y - 10], [x + 15, y + 11], [x - 15, y + 11]], col),
    ];
    const order = shuffle([0, 1, 2, 3]), at = order.indexOf(0), name = sq ? 'square' : 'triangle';
    return { topic: 'SHAPES', text: `Which one is a ${name}?`, ...which(at),
      steps: [sq ? 'A square has 4 equal sides and 4 square corners.' : 'A triangle is closed and has 3 straight sides.', `Shape ${at + 1} is the only one that does.`],
      size: [168, 46], fig: (c, w, h) => four(c, w, h, (i, x, y, cw, ch) => draws[order[i]](c, x + Math.round(cw / 2), y + Math.round(ch / 2))) };
  };

  G1.composite = () => {
    const C = pick(COMPOSE), cols = pickN(COLS, 2);
    return { topic: 'MAKING SHAPES', text: `How many ${C.part}s make this ${C.make}?`, ...nums(C.n, [C.n + 1, C.n - 1, C.n + 2], String, 1),
      steps: [`Count the small ${C.part}s inside: ${upto(C.n)}.`, `${C.n} ${C.part}s make the ${C.make}.`], ...composeFig(C, cols) };
  };

  G1.halvesFourths = () => {
    const f = pick(['shaded', 'shaded', 'name', 'bigger', 'whole']), n = pick([2, 4]), word = n === 2 ? 'half' : 'fourth';
    if (f === 'shaded') {
      const s = shareSpec(n, true), sh = [randInt(0, n - 1)];
      if (!s.circ) s.how = n === 2 ? pick(['cols', 'rows', 'diag']) : pick(['cols', 'rows', 'grid', 'x']);
      return { topic: 'HALVES, FOURTHS', text: 'What part is shaded?', ...opts(`one ${word}`, ['one half', 'one fourth', 'one third', 'the whole']),
        steps: [`It is cut into ${n} equal parts.`, '1 part is shaded.', `1 of ${n} equal parts is one ${word}.`], size: [64, 48], fig: c => drawShare(c, s, 32, 24, sh, true) };
    }
    if (f === 'name') return { topic: 'HALVES, FOURTHS', text: `A pizza is cut into ${n} equal slices. What is each slice called?`, ...opts(`a ${word}`, ['a half', 'a fourth', 'a third', 'a whole']),
      steps: [`${n} equal parts are ${n === 2 ? 'halves' : 'fourths (or quarters)'}.`, `Each slice is a ${word}.`] };
    if (f === 'bigger') return { topic: 'HALVES, FOURTHS', text: 'Which is bigger: half of a pizza, or a fourth of the same pizza?', ...opts('the half', ['the half', 'the fourth', 'they are the same', "can't tell"]),
      steps: ['Cut into more pieces, each piece gets smaller.', 'A fourth is half of a half.', 'So the half is bigger.'],
      size: [100, 48], fig: c => { pie(c, 25, 24, 20, [0, 180], [0]); pie(c, 75, 24, 20, [0, 90, 180, 270], [0]); } };
    return { topic: 'HALVES, FOURTHS', text: `How many ${n === 2 ? 'halves' : 'fourths'} make a whole?`, ...nums(n, [n + 1, n - 1, n === 2 ? 4 : 2, 1], String, 1),
      steps: [`A whole cut into ${n === 2 ? 'halves' : 'fourths'} has ${n} equal parts.`, `${n} ${n === 2 ? 'halves' : 'fourths'} make 1 whole.`] };
  };

  G1.equalShares = () => {
    const n = pick([2, 4]), word = n === 2 ? 'halves' : 'fourths';
    const specs = shuffle([shareSpec(n, true), shareSpec(n, false), shareSpec(n === 2 ? 4 : 2, true), shareSpec(3, rand() < .5)]), at = specs.findIndex(s => isEqualShare(s, n));
    return { topic: 'EQUAL SHARES', text: `Which shape is cut into ${word}?`, ...which(at),
      steps: [`${cap(word)} means ${n} equal parts.`, `Shape ${at + 1} has ${n} parts, all the same size.`], size: [168, 48],
      fig: (c, w, h) => four(c, w, h, (i, x, y, cw, ch) => drawShare(c, specs[i], x + Math.round(cw / 2), y + Math.round(ch / 2))) };
  };

  Questions.grade({ id: '1', n: 1, label: '1ST GRADE', short: '1ST', clock: [65, 60, 55, 50, 50], kinds: G1,
    min: { makeTen: 2, properties: 2, trueFalse: 2, factFamily: 2, hundredChart: 2, tenMore: 2, subTens: 2, composite: 2 } });

  // Number words spelled right, next to the slips kids really make.
  const MISSPELL = {
    0: ['zeroe', 'ziro', 'zerro'], 1: ['won', 'wun', 'onne'], 2: ['tow', 'twoo', 'tu'], 3: ['tree', 'thre', 'threee'], 4: ['for', 'fore', 'fourr'],
    5: ['fiv', 'fife', 'fyve'], 6: ['sicks', 'sixe', 'siks'], 7: ['sevin', 'sevan', 'sevenn'], 8: ['eigth', 'ate', 'eiht'], 9: ['nin', 'nien', 'nyne'],
    10: ['tenn', 'tin', 'tehn'], 11: ['elevin', 'leven', 'elevun'], 12: ['twelf', 'twelv', 'tweleve'], 13: ['threeteen', 'thirdteen', 'thurteen'],
    14: ['forteen', 'fourten', 'fortean'], 15: ['fiveteen', 'fifeteen', 'fiftean'], 16: ['sixten', 'sicksteen', 'sixtean'], 17: ['seventen', 'sevinteen', 'seaventeen'],
    18: ['eightteen', 'eighten', 'aighteen'], 19: ['ninteen', 'nineten', 'nientean'], 20: ['twenny', 'twinty', 'tweny'], 30: ['thirdy', 'thurty', 'threety'],
    40: ['fourty', 'fortie', 'fourtee'], 50: ['fivty', 'fifdy', 'fiftey'], 60: ['sixdy', 'sixtee', 'sicksty'], 70: ['sevendy', 'seventee', 'sevinty'],
    80: ['eighdy', 'eightty', 'aighty'], 90: ['ninty', 'ninedy', 'nientee'],
  };
  function spellQ(top) {
    const n = pick(Object.keys(MISSPELL).map(Number).filter(v => v <= top && (top <= 10 || v > 0)));
    return { topic: 'NUMBER WORDS', text: `Which is the right way to spell ${n}?`, say: `Which word spells the number ${n} the right way?`, ...opts(words99(n), MISSPELL[n]),
      steps: [`${n} is spelled ${words99(n).toUpperCase().split('').join('-')}.`, `The answer is ${words99(n)}.`] };
  }
  // Even and odd on a number line, or the next even or odd number.
  function evenOddMoreQ(top) {
    if (rand() < .5) {
      const a = randInt(0, Math.max(0, top - 10)), v = a + randInt(1, 9), even = v % 2 === 0, E = w => w ? 'even' : 'odd';
      return { topic: 'EVEN AND ODD', text: 'Is the number at the dot even or odd?', ...opts(`${v}, ${E(even)}`, [`${v}, ${E(!even)}`, `${v + 1}, ${E(!even)}`, `${v - 1}, ${E(!even)}`]),
        steps: ['Read the number at the dot first.', `It is ${v}. It ends in ${v % 10}.`, `${v} is ${E(even)}.`],
        size: [168, 34], fig: (c, w) => { const X = numLine(c, 12, w - 13, 16, a, a + 10, 1, 1, [v]); disc(c, X(v), 16, 2, HOT); line(c, X(v), 3, X(v), 11, HOT); line(c, X(v) - 2, 9, X(v), 11, HOT); line(c, X(v) + 2, 9, X(v), 11, HOT); } };
    }
    const n = randInt(5, top - 3), even = rand() < .5, after = rand() < .5, w = even ? 'even' : 'odd';
    let ans = after ? n + 1 : n - 1; if ((ans % 2 === 0) !== even) ans += after ? 1 : -1;
    return { topic: 'EVEN AND ODD', text: `Which ${w} number comes right ${after ? 'after' : 'before'} ${n}?`, ...nums(ans, [after ? ans + 1 : ans - 1, n, after ? ans + 2 : ans - 2, after ? ans - 1 : ans + 1], String, 0),
      steps: [`${cap(w)} numbers end in ${even ? '0, 2, 4, 6 or 8' : '1, 3, 5, 7 or 9'}.`, `Counting ${after ? 'up' : 'down'} from ${n}, the first ${w} number is ${ans}.`] };
  }

  // ======================================================== 2ND GRADE
  const G2 = {};
  const digits = n => [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100)];
  const PLACE = ['Ones', 'Tens', 'Hundreds'], ONE = ['one', 'ten', 'hundred'];
  const pv = (k, p) => `${k} ${ONE[p]}${k === 1 ? '' : 's'}`;
  // The worked columns for a + b or a - b, ones first, trades and all.
  function colSteps(a, b, op) {
    const A = digits(a), B = digits(b), places = Math.max(String(a).length, String(b).length), out = [];
    let carry = 0;
    for (let p = 0; p < places; p++) {
      if (op === '+') {
        const s = A[p] + B[p] + carry;
        out.push(`${PLACE[p]}: ${A[p]} + ${B[p]}${carry ? ' + 1' : ''} = ${s}${s >= 10 && p < places - 1 ? `. Trade 10 ${ONE[p]}s for 1 ${ONE[p + 1]}.` : ''}`);
        carry = s >= 10 && p < places - 1 ? 1 : 0;
      } else {
        const x = A[p] - carry;
        if (x < B[p] && x >= 0 && p === 0 && places === 3 && A[1] === 0) { out.push(`Ones: no tens to trade, so 1 hundred becomes 9 tens and 10 ones. ${x + 10} - ${B[p]} = ${x + 10 - B[p]}`); carry = 1; }
        else if (x < 0) { out.push(`${PLACE[p]}: ${x + 10} - ${B[p]} = ${x + 10 - B[p]}`); carry = 1; }
        else if (x < B[p]) { out.push(`${PLACE[p]}: trade 1 ${ONE[p + 1]} for 10 ${ONE[p]}s. ${x + 10} - ${B[p]} = ${x + 10 - B[p]}`); carry = 1; }
        else { out.push(`${PLACE[p]}: ${x} - ${B[p]} = ${x - B[p]}`); carry = 0; }
      }
    }
    out.push(`${a} ${op} ${b} = ${op === '+' ? a + b : a - b}`);
    return out;
  }
  // a and b written in a column, big digits, ready to add or subtract.
  function columnFig(a, b, op) {
    const W = 32 + 14 * String(Math.max(a, b)).length, B = ['#ffffff', '#e8ecf8', '#b8c4f0'];
    return { size: [W, 44], fig: (c, w) => {
      const ra = Font.big(String(a), 2, B), rb = Font.big(String(b), 2, B), sg = Font.big(op, 2, ['#f8d040', '#f8d040', '#e0a020']);
      c.drawImage(ra, w - 4 - ra.width, 0); c.drawImage(rb, w - 4 - rb.width, 18); c.drawImage(sg, 0, 18); box(c, 4, 39, w - 8, 2, INK);
    } };
  }
  // A bar model: the whole on top, its two parts underneath.
  function tapeFig(t, a, labs) {
    return { size: [150, 40], fig: (c, w) => {
      const x0 = 4, x1 = w - 5, L = x1 - x0, xa = x0 + Math.max(28, Math.min(L - 28, Math.round(L * a / t)));
      const bar = (x, y, ww, edge, fill, s) => { box(c, x, y, ww, 15, edge); box(c, x + 1, y + 1, ww - 2, 13, fill); ink(c, s, x + ww / 2, y + 8, s === '?' ? HOT : INK); };
      bar(x0, 3, L + 1, '#5a6cc8', '#1c2660', labs[0]); bar(x0, 21, xa - x0 + 1, '#c85a5a', '#4a1818', labs[1]); bar(xa, 21, x1 - xa + 1, '#5a8ac8', '#16284e', labs[2]);
    } };
  }

  G2.wordOneStep = d => { const t = d === 1 ? randInt(25, 69) : randInt(30, 99); return storyQ(pick(['join', 'together', 'take', 'apart']), t, splitT(t, d === 1 ? false : d === 2 ? null : true)); };
  G2.wordUnknown = d => { const t = d === 1 ? randInt(20, 59) : randInt(30, 99); return storyQ(pick(['change+', 'change-', 'start+', 'start-']), t, splitT(t, d === 1 ? false : null)); };
  G2.wordCompare = d => {
    const t = d === 1 ? randInt(20, 59) : randInt(30, 99);
    return storyQ(pick(['more', 'fewer', 'bigger', 'smaller', ...(d >= 3 ? ['trickFewer', 'trickMore', 'trickFewer', 'trickMore'] : [])]), t, splitT(t, d === 1 ? false : null), 'COMPARING');
  };

  G2.wordTwoStep = d => {
    const [P, Q] = kids(2), it = pick(ITEMS), top = d <= 2 ? 60 : 99, f = pick(['getGive', 'giveGive', 'moreTotal', 'bus']);
    let text, ans, one, wrong, steps;
    if (f === 'getGive') {
      const a = randInt(10, top - 20), b = randInt(5, top - a), c3 = randInt(5, a + b - 1); ans = a + b - c3; one = a + b; wrong = a + b + c3;
      text = `${P.n} has ${a} ${it}. ${P.He} gets ${b} more, then gives ${c3} to ${Q.n}. How many does ${P.he} have now?`;
      steps = [`First add: ${a} + ${b} = ${a + b}.`, `Then subtract: ${a + b} - ${c3} = ${ans}.`];
    } else if (f === 'giveGive') {
      const a = randInt(30, top), b = randInt(5, a - 15), c3 = randInt(3, a - b - 1); ans = a - b - c3; one = a - b; wrong = a - b + c3;
      text = `${P.n} has ${a} ${it}. ${P.He} gives ${b} to ${Q.n} and ${c3} to a friend. How many are left?`;
      steps = [`First: ${a} - ${b} = ${a - b}.`, `Then: ${a - b} - ${c3} = ${ans}.`];
    } else if (f === 'moreTotal') {
      const a = randInt(8, d <= 2 ? 25 : 40), b = randInt(3, d <= 2 ? 10 : 20); ans = 2 * a + b; one = a + b; wrong = a + b + b;
      text = `${P.n} has ${a} ${it}. ${Q.n} has ${b} more than ${P.n}. How many do they have in all?`;
      steps = [`${Q.n} has ${a} + ${b} = ${a + b}.`, `Together: ${a} + ${a + b} = ${ans}.`];
    } else {
      const a = randInt(15, d <= 2 ? 35 : 60), b = randInt(3, a - 2), c3 = randInt(3, d <= 2 ? 15 : 30); ans = a - b + c3; one = a - b; wrong = a + b + c3;
      text = `${a} kids are on a bus. At a stop, ${b} get off and ${c3} get on. How many kids are on the bus now?`;
      steps = [`${b} get off: ${a} - ${b} = ${a - b}.`, `${c3} get on: ${a - b} + ${c3} = ${ans}.`];
    }
    return { topic: 'TWO STEPS', text, ...nums(ans, [one, wrong, ans + 10, ans - 10, ans + 1]), steps: [...steps, `The answer is ${ans}.`] };
  };

  G2.tapeDiagram = d => {
    const t = randInt(d <= 2 ? 20 : 40, d <= 2 ? 60 : 99), a = splitT(t, d === 1 ? false : null), b = t - a, whole = rand() < .35, [P] = kids(1), it = pick(TINTED);
    return { topic: 'BAR MODEL', text: whole ? `${P.n} has ${a} red ${it} and ${b} blue ${it}. How many in all?` : `${P.n} has ${t} ${it}. ${a} are red. The rest are blue. How many are blue?`,
      ...(whole ? nums(t, [Math.abs(a - b), noCarry(a, b), t + 10, t - 10]) : nums(b, [t + a, noBorrow(t, a), b + 10, b - 10])),
      steps: ['The top bar is the whole. The two bars under it are the parts.', whole ? `Whole = part + part: ${a} + ${b} = ${t}` : `Part = whole - part: ${t} - ${a} = ${b}`],
      ...tapeFig(t, a, whole ? ['?', a, b] : [t, a, '?']) };
  };

  G2.facts20 = d => {
    const a = randInt(2, 9), b = randInt(2, 9), s = a + b, f = pick(d === 1 ? ['add', 'sub'] : ['add', 'sub', 'miss+', 'miss-']);
    if (f === 'add') return { topic: 'ADD AND SUBTRACT', text: `${a} + ${b} = ?`, say: `What is ${a} plus ${b}?`, ...nums(s, [s + 1, s - 1, s + 10, Math.abs(a - b)]), steps: [strategy(a, b), `${a} + ${b} = ${s}`] };
    if (f === 'sub') return { topic: 'ADD AND SUBTRACT', text: `${s} - ${b} = ?`, say: `What is ${s} minus ${b}?`, ...nums(a, [s + b, a + 1, a - 1, s >= 10 ? noBorrow(s, b) : a + 2]),
      steps: [`Think addition: ${b} + ? = ${s}.`, `${b} + ${a} = ${s}, so ${s} - ${b} = ${a}.`] };
    if (f === 'miss+') return { topic: 'MISSING NUMBER', text: `${a} + ? = ${s}`, say: `${a} plus what number makes ${s}?`, ...nums(b, [s, s + a, b + 1, b - 1]), steps: [`Think: ${s} - ${a} = ?`, `${s} - ${a} = ${b}, so ${a} + ${b} = ${s}.`] };
    return { topic: 'MISSING NUMBER', text: `${s} - ? = ${a}`, say: `${s} minus what number leaves ${a}?`, ...nums(b, [s, s + a, b + 1, b - 1]), steps: [`Think: ${a} + ? = ${s}`, `${a} + ${b} = ${s}, so ${s} - ${b} = ${a}.`] };
  };

  G2.mentalMath = () => {
    const f = pick(['ten', 'double', 'helper', 'back']);
    if (f === 'ten') {
      const a = randInt(7, 9), b = randInt(11 - a, 9), e = a + b - 10;
      return { topic: 'MENTAL MATH', text: `Make a ten: ${a} + ${b} = 10 + ?`, say: `Make a ten. ${a} plus ${b} is the same as 10 plus what number?`, ...nums(e, [b, 10 - a, e + 1, e - 1, a + b]),
        steps: [`${a} + ${10 - a} = 10.`, `${b} - ${10 - a} = ${e} is left over.`, `${a} + ${b} = 10 + ${e} = ${a + b}`] };
    }
    if (f === 'double') {
      const n = randInt(3, 9), m = pick([n - 1, n + 1]), s = n + m;
      return { topic: 'MENTAL MATH', text: `Use a double: ${n} + ${n} = ${2 * n}. What is ${n} + ${m}?`, say: `Use a double. ${n} plus ${n} is ${2 * n}. What is ${n} plus ${m}?`,
        ...nums(s, [2 * n, 2 * n + 2 * (m - n), s + 1, s - 1]), steps: [`${m} is 1 ${m > n ? 'more' : 'less'} than ${n}.`, `So ${n} + ${m} is 1 ${m > n ? 'more' : 'less'} than ${2 * n}: ${s}.`] };
    }
    if (f === 'helper') {
      const a = randInt(3, 9), b = randInt(Math.max(2, 11 - a), 9), s = a + b, E = (x, y, z) => `${x} + ${y} = ${z}`;
      return { topic: 'MENTAL MATH', text: `Which addition fact helps you solve ${s} - ${b}?`, say: `Which addition fact helps you solve ${s} minus ${b}?`,
        ...opts(E(b, a, s), [E(b, b, 2 * b), E(s, b, s + b), E(a, a, 2 * a), E(b, s, s + b), E(10, s - 10, s)]),
        steps: [`${s} - ${b} asks: ${b} plus what makes ${s}?`, `${b} + ${a} = ${s}, so ${s} - ${b} = ${a}.`] };
    }
    const s = randInt(11, 17), k = s - 10, b = randInt(k + 1, 9), e = b - k;
    return { topic: 'MENTAL MATH', text: `${s} - ${b} is the same as ${s} - ${k} - ?`, say: `${s} minus ${b} is the same as ${s} minus ${k} minus what number?`, ...nums(e, [b, k, e + 1, s - b]),
      steps: [`First go back to 10: ${s} - ${k} = 10.`, `${b} is ${k} + ${e}, so take away ${e} more.`, `10 - ${e} = ${s - b}`] };
  };

  G2.evenOddPics = d => {
    const n = randInt(d === 1 ? 4 : 6, d === 1 ? 10 : 20), even = n % 2 === 0, name = pick(ICONS), E = w => w ? 'even' : 'odd', top = Math.ceil(n / 2);
    return { topic: 'EVEN AND ODD', text: `Count the ${plural(name)}. Is the number even or odd?`,
      ...opts(`${n}, ${E(even)}`, [`${n}, ${E(!even)}`, `${n + 1}, ${E(!even)}`, `${n - 1}, ${E(!even)}`]),
      steps: ['Pair them up, two by two.', even ? `Every one has a partner, so ${n} is even.` : `One is left without a partner, so ${n} is odd.`,
        even ? `${n} = ${n / 2} + ${n / 2}` : `${n} = ${(n - 1) / 2} + ${(n - 1) / 2} + 1`],
      size: [top * 11 + 10, 30], fig: (c, w) => { const x = Math.round((w - (top * 11 - 2)) / 2); for (let i = 0; i < n; i++) icon(c, name, x + (i >> 1) * 11, 5 + (i & 1) * 11); } };
  };

  G2.evenOddNum = d => {
    const top = [0, 20, 50, 100, 100][d];
    if (rand() < .35) return evenOddMoreQ(top);
    if (rand() < .65) {
      const odd = rand() < .5, right = pick(range(1, top).filter(v => v % 2 === (odd ? 1 : 0))), others = pickN(range(1, top).filter(v => v % 2 === (odd ? 0 : 1)), 3);
      return { topic: 'EVEN AND ODD', text: `Which number is ${odd ? 'odd' : 'even'}?`, ...jumble(right, others),
        steps: ['Look at the ones digit.', 'Even numbers end in 0, 2, 4, 6 or 8. Odd ones end in 1, 3, 5, 7 or 9.', `${right} ends in ${right % 10}, so it is ${odd ? 'odd' : 'even'}.`] };
    }
    const k = randInt(2, d <= 2 ? 10 : 20), n = 2 * k, P = (x, y) => `${x} + ${y}`;
    return { topic: 'EVEN AND ODD', text: `Which shows ${n} as the sum of two equal numbers?`, say: `Which one shows ${n} as two equal numbers added together?`,
      ...opts(P(k, k), [P(k - 1, k + 1), P(k + 1, k + 1), P(n, n), P(k, k + 1), P(k - 1, k - 1)]),
      steps: ['Two equal numbers means the same number twice.', `${k} + ${k} = ${n}`, `${n} can be split into two equal groups, so it is even.`] };
  };

  G2.arrays = d => {
    const R = randInt(2, d === 1 ? 3 : 5), C = randInt(2, d === 1 ? 4 : 5), n = R * C, name = pick(ICONS), f = pick(['total', 'total', 'sum', 'count']), rowSum = Array(R).fill(C).join(' + ');
    const pic = { size: [C * 11 + 12, R * 11 + 8], fig: (c, w, h) => { const x = Math.round((w - (C * 11 - 2)) / 2), y = Math.round((h - (R * 11 - 2)) / 2); for (let i = 0; i < n; i++) icon(c, name, x + (i % C) * 11, y + Math.floor(i / C) * 11); } };
    if (f === 'total') return { topic: 'ARRAYS', text: `How many ${plural(name)} are in the array?`, ...nums(n, [R + C, n + C, n - C, n + 1], String, 1), steps: [`There are ${R} rows of ${C}.`, `${rowSum} = ${n}`], ...pic };
    if (f === 'sum') return { topic: 'ARRAYS', text: 'Which addition adds up the rows?', say: 'Which addition sentence adds up the rows of the array?',
      ...opts(rowSum, [Array(C).fill(R).join(' + '), `${C} + ${R}`, Array(R + 1).fill(C).join(' + '), Array(R).fill(C + 1).join(' + '), R > 2 ? Array(R - 1).fill(C).join(' + ') : `${C} + ${C + 1}`]),
      steps: [`Each row has ${C}. There are ${R} rows.`, `Add ${C} for each row: ${rowSum} = ${n}`], ...pic };
    const rows = rand() < .5;
    return { topic: 'ARRAYS', text: `How many ${rows ? 'rows' : 'columns'} does the array have?`, ...nums(rows ? R : C, [rows ? C : R, n, (rows ? R : C) + 1], String, 1),
      steps: [rows ? 'Rows go across, side to side.' : 'Columns go up and down.', `There are ${rows ? R : C} ${rows ? 'rows' : 'columns'}.`], ...pic };
  };

  G2.blocksRead = d => {
    const H = randInt(1, d === 1 ? 4 : 9), zt = d >= 3 && rand() < .3, zo = d >= 3 && !zt && rand() < .3, T = zt ? 0 : randInt(1, 9), O = zo ? 0 : randInt(1, 9), n = 100 * H + 10 * T + O;
    return { topic: 'PLACE VALUE', text: 'What number do the blocks show?', ...nums(n, [100 * O + 10 * T + H, Number(`${H}${T || ''}${O || ''}`), H + T + O, 100 * T + 10 * H + O, n + 10, n + 100], comma),
      steps: [`Flats are hundreds: ${H} ${v1(H, 'hundred', 'hundreds')} = ${100 * H}.`, `Rods are tens: ${10 * T}. Cubes are ones: ${O}.`, `${100 * H} + ${10 * T} + ${O} = ${n}`], ...blocks(H, T, O) };
  };

  G2.placeValue = d => {
    const H = randInt(1, 9), [T, O] = pickN(range(0, 9).filter(v => v !== H), 2), n = 100 * H + 10 * T + O, f = pick(['value', 'digit', 'build', 'build']);
    const D = [O, T, H];
    if (f === 'value') {
      const p = pick([0, 1, 2].filter(i => D[i])), dg = D[p], ans = dg * 10 ** p, others = D.filter((_, i) => i !== p);
      return { topic: 'PLACE VALUE', text: `What is the value of the ${dg} in ${n}?`, ...nums(ans, [dg, dg * 10, dg * 100, dg * 1000, ...others, ...others.map(v => v * 10 ** p)], comma),
        steps: [`The ${dg} is in the ${PLACE[p].toLowerCase()} place.`, `${dg} ${ONE[p]}${dg > 1 ? 's' : ''} = ${ans}`] };
    }
    if (f === 'digit') {
      const p = randInt(0, 2);
      return { topic: 'PLACE VALUE', text: `What digit is in the ${PLACE[p].toLowerCase()} place in ${n}?`, ...nums(D[p], D.filter((_, i) => i !== p).concat([D[p] + 1])),
        steps: ['From the right: ones, tens, hundreds.', `${n}: ${H} hundreds, ${T} tens, ${O} ones.`, `The ${PLACE[p].toLowerCase()} digit is ${D[p]}.`] };
    }
    const mixed = d >= 3 && rand() < .5, partsTxt = [[H, 'hundreds'], [T, 'tens'], [O, 'ones']], order = mixed ? shuffle([0, 1, 2]) : [0, 1, 2];
    const said = order.map(i => `${partsTxt[i][0]} ${partsTxt[i][0] === 1 ? partsTxt[i][1].slice(0, -1) : partsTxt[i][1]}`), asRead = Number(order.map(i => partsTxt[i][0]).join(''));
    return { topic: 'PLACE VALUE', text: `What number is ${said[0]}, ${said[1]} and ${said[2]}?`, ...nums(n, [asRead, 100 * O + 10 * T + H, H + T + O, n + 10, 100 * T + 10 * H + O], comma),
      steps: [mixed ? 'Put each digit in its own place, whatever order they are said in.' : 'Write each digit in its place.', `${pv(H, 2)} = ${100 * H}, ${pv(T, 1)} = ${10 * T}, ${pv(O, 0)} = ${O}`, `${100 * H} + ${10 * T} + ${O} = ${n}`] };
  };

  G2.hundredsTens = d => {
    const f = pick(['tenTens', 'hundreds', 'picture', ...(d >= 2 ? ['howManyTens', 'tensToNum'] : [])]), H = randInt(2, 9);
    if (f === 'tenTens') return { topic: 'HUNDREDS', text: '10 tens make what number?', ...nums(100, [10, 1000, 20, 110], comma), steps: ['10 tens: 10, 20, 30, ... 100.', 'A bundle of 10 tens is 1 hundred: 100.'] };
    if (f === 'hundreds') return { topic: 'HUNDREDS', text: `What number is ${H} hundreds?`, ...nums(100 * H, [H, 10 * H, 1000 * H, 100 * H + 10], comma), steps: [`1 hundred is 100.`, `${H} hundreds: ${range(1, H).map(k => 100 * k).join(', ')}.`, `So ${H} hundreds = ${100 * H}.`] };
    if (f === 'howManyTens') return { topic: 'HUNDREDS', text: `How many tens make ${100 * H}?`, ...nums(10 * H, [H, 100 * H, 10 * H + 10, H + 10], comma), steps: ['10 tens make 1 hundred.', `${H} hundreds is ${H} groups of 10 tens.`, `That is ${10 * H} tens.`] };
    if (f === 'tensToNum') { const k = randInt(11, 45); return { topic: 'HUNDREDS', text: `What number is ${k} tens?`, ...nums(10 * k, [k, 100 * k, 10 * k + 10, k + 10], comma), steps: [`${k} tens = ${Math.floor(k / 10)} hundreds and ${k % 10} tens.`, `= ${10 * k}`] }; }
    const T = pick([10, 10, 20]);
    return { topic: 'HUNDREDS', text: `There are ${T} tens. What number do they make?`, ...nums(10 * T, [T, 10, 10 * T + 10, 1000], comma), steps: ['Count the rods by tens: 10, 20, 30 ...', `${T} tens = ${10 * T}.`, T === 10 ? '10 tens is 1 hundred.' : '20 tens is 2 hundreds.'], ...blocks(0, T, 0) };
  };

  G2.skipCount = d => {
    const step = pick(d === 1 ? [2, 5, 10] : [5, 10, 100, 2]), back = d >= 2 && rand() < .4;
    let a = step === 100 ? 100 * randInt(1, 6) + (d >= 2 ? 10 * randInt(0, 9) : 0) : step === 10 ? (d >= 3 ? randInt(100, 690) : 10 * randInt(1, 65)) : step === 5 ? 5 * randInt(1, d === 1 ? 30 : 180) : 2 * randInt(1, d === 1 ? 50 : 300);
    const seq = back ? [a + 3 * step, a + 2 * step, a + step] : [a, a + step, a + 2 * step], ans = back ? a : a + 3 * step;
    return { topic: 'SKIP COUNTING', text: `Count ${back ? 'back ' : ''}by ${step}s. What comes next?`,
      ...nums(ans, [ans + step, ans - step, ans + 1, ans - 1, ans + (step === 100 ? 10 : 100), ans - (step === 100 ? 10 : 100)], comma),
      steps: [`Each number is ${step} ${back ? 'less' : 'more'} than the one before.`, `${seq.map(comma).join(', ')}, ${comma(ans)}`], ...tiles([...seq, null]) };
  };

  G2.count1000 = d => {
    const f = pick(['after', 'before', 'between', 'line', 'back']);
    if (f === 'back') {
      const a = rand() < .5 ? 100 * randInt(1, 9) + randInt(1, 3) : randInt(104, 999), seq = [a, a - 1, a - 2], ans = a - 3;
      return { topic: 'COUNTING TO 1,000', text: 'Count backward by ones. What comes next?', ...nums(ans, [ans + 1, ans - 1, Math.floor(a / 100) * 100 - 10, ans + 10, ans - 10], comma),
        steps: ['Counting backward, each number is 1 less.', [...seq, ans].map(comma).join(', ')], ...tiles([...seq, null]) };
    }
    if (f === 'after') {
      const n = rand() < .5 ? 100 * randInt(1, 9) - 1 : rand() < .5 ? 10 * randInt(11, 99) - 1 : randInt(100, 998);
      return { topic: 'COUNTING TO 1,000', text: `What number comes right after ${comma(n)}?`, ...nums(n + 1, [n - 1, n + 10, n + 2, n + 100, Math.floor(n / 100) * 100], comma), steps: ['Right after means 1 more.', `${n} + 1 = ${n + 1}`] };
    }
    if (f === 'before') {
      const n = rand() < .5 ? 100 * randInt(2, 10) : rand() < .5 ? 10 * randInt(11, 99) : randInt(101, 999);
      return { topic: 'COUNTING TO 1,000', text: `What number comes right before ${comma(n)}?`, ...nums(n - 1, [n + 1, n - 10, n - 11, n - 2, n - 100], comma), steps: ['Right before means 1 less.', `${comma(n)} - 1 = ${n - 1}`] };
    }
    if (f === 'between') {
      const n = rand() < .5 ? 100 * randInt(1, 9) + pick([0, 9, 10]) : randInt(101, 998);
      return { topic: 'COUNTING TO 1,000', text: `What number is between ${n - 1} and ${n + 1}?`, ...nums(n, [n + 2, n - 2, n + 10, n - 10], comma), steps: [`Count: ${n - 1}, ${n}, ${n + 1}.`, `${n} is in the middle.`] };
    }
    const a = 100 * randInt(1, 8), j = pick([1, 2, 3, 4, 6, 7, 8, 9]), v = a + 10 * j;
    return { topic: 'NUMBER LINE', text: 'What number is at the dot?', ...nums(v, [a + j, v + 10, v - 10, v + 1], comma),
      steps: [`The line goes from ${a} to ${a + 100} in 10 equal jumps.`, 'Each tick is 10 more.', `Count by tens from ${a}: the dot is at ${v}.`],
      size: [168, 32], fig: (c, w) => { const X = numLine(c, 14, w - 15, 12, a, a + 100, 10, 50); disc(c, X(v), 12, 2, HOT); ink(c, '?', X(v), 4, HOT); } };
  };

  G2.numberNames = d => {
    if (d <= 2 && rand() < .3) return spellQ(90);
    const H = randInt(1, 9), T = rand() < .2 ? 0 : randInt(1, 9), O = rand() < .2 ? 0 : randInt(d === 1 ? 1 : 0, 9), n = 100 * H + 10 * T + O, r = 10 * T + O;
    if (rand() < .55) return { topic: 'NUMBER NAMES', text: `Which number is ${wordsOf(n)}?`, ...nums(n, [Number(`${100 * H}${r || ''}`), 100 * H + 10 * O + T, r >= 10 ? r : n - 100, n + 10, n + 100], comma),
      steps: [`${ONES[H]} hundred = ${100 * H}`, r ? `${words99(r)} = ${r}` : 'Nothing more: 0 tens, 0 ones.', `${100 * H} + ${r} = ${n}`] };
    const swap = 100 * H + 10 * O + T;
    return { topic: 'NUMBER NAMES', text: `How do you write ${n} in words?`, ...opts(wordsOf(n), [swap !== n ? wordsOf(swap) : wordsOf(n + 1), wordsOf(n + 10 > 999 ? n - 20 : n + 10), wordsOf(n > 199 ? n - 100 : n + 100), wordsOf(10 * H + O > 0 ? 10 * H + O : n + 2)]),
      steps: [`${n} = ${100 * H}${r ? ' + ' + r : ''}`, `${100 * H} is ${ONES[H]} hundred${r ? `; ${r} is ${words99(r)}` : ''}.`] };
  };

  G2.expandedForm = d => {
    const H = randInt(1, 9), T = d >= 2 && rand() < .25 ? 0 : randInt(1, 9), O = d >= 2 && T && rand() < .25 ? 0 : randInt(1, 9), n = 100 * H + 10 * T + O;
    const ex = (h, t, o) => [h, t, o].filter(v => v).join(' + '), f = pick(['toStd', 'toExp', ...(d >= 3 ? ['mixed'] : [])]);
    if (f === 'toExp') return { topic: 'EXPANDED FORM', text: `Which is ${n} in expanded form?`,
      ...opts(ex(100 * H, 10 * T, O), [[H, T, O].join(' + '), ex(100 * H, T, O), ex(100 * H, 10 * O, T), ex(10 * H, 10 * T, O), ex(100 * H, 100 * T, O)]),
      steps: ['Expanded form shows what each digit is worth.', `${pv(H, 2)} = ${100 * H}, ${pv(T, 1)} = ${10 * T}, ${pv(O, 0)} = ${O}`, `${n} = ${ex(100 * H, 10 * T, O)}`] };
    const parts = f === 'mixed' ? shuffle([100 * H, 10 * T, O].filter(v => v)) : [100 * H, 10 * T, O].filter(v => v), txt = parts.join(' + ');
    return { topic: 'EXPANDED FORM', text: `What number is ${txt}?`, say: `What number is ${parts.join(' plus ')}?`,
      ...nums(n, [H + T + O, 100 * H + 10 * O + T, n + 100, 10 * H + O, n + 10], comma),
      steps: ['Put each part in its place: hundreds, tens, ones.', `${100 * H} + ${10 * T} + ${O}`, `= ${n}`] };
  };

  G2.compare3 = d => {
    const H = randInt(1, 9), mode = d === 1 ? 'hundreds' : pick(['hundreds', 'tens', 'ones', 'flip']);
    let a, b;
    if (mode === 'flip') { const [x, y, z] = pickN(range(1, 9), 3); a = 100 * x + 10 * y + z; b = 100 * z + 10 * y + x; }
    else if (mode === 'ones') { const t = randInt(0, 9), [p, q] = pickN(range(0, 9), 2); a = 100 * H + 10 * t + p; b = 100 * H + 10 * t + q; }
    else if (mode === 'tens') { const [p, q] = pickN(range(0, 9), 2); a = 100 * H + 10 * p + randInt(0, 9); b = 100 * H + 10 * q + randInt(0, 9); }
    else { const [p, q] = pickN(range(1, 9), 2); a = 100 * p + randInt(0, 99); b = 100 * q + randInt(0, 99); }
    const big = Math.max(a, b), small = Math.min(a, b), [B, S] = [digits(big), digits(small)], p = B[2] !== S[2] ? 2 : B[1] !== S[1] ? 1 : 0;
    const why = `Same ${['hundreds and tens', 'hundreds', ''][p]}`.trim();
    return { topic: 'COMPARE', text: 'Which is true?', ...opts(rand() < .5 ? `${big} > ${small}` : `${small} < ${big}`, [`${big} < ${small}`, `${small} > ${big}`, `${small} = ${big}`]),
      steps: ['Compare hundreds first, then tens, then ones.', p === 2 ? `${pv(B[2], 2)} is more than ${pv(S[2], 2)}.` : `${why}, so look at the ${PLACE[p].toLowerCase()}: ${B[p]} > ${S[p]}.`, `So ${big} > ${small}, and ${small} < ${big}.`] };
  };

  G2.order3 = d => {
    const [x, y, z] = pickN(range(1, 9), 3), perms = [[x, y, z], [x, z, y], [y, x, z], [y, z, x], [z, x, y], [z, y, x]].map(p => 100 * p[0] + 10 * p[1] + p[2]);
    const f = pick(['greatest', 'least', 'list']);
    if (f !== 'list') {
      const set = pickN(perms, 4), ans = f === 'greatest' ? Math.max(...set) : Math.min(...set);
      return { topic: 'ORDER NUMBERS', text: `Which number is the ${f}?`, ...jumble(ans, set.filter(v => v !== ans)),
        steps: ['Compare the hundreds first, then the tens.', `From least to greatest: ${set.slice().sort((p, q) => p - q).join(', ')}.`, `The ${f} is ${ans}.`] };
    }
    const three = d <= 2 ? pickN(perms, 3) : pickN(range(100, 999), 3), up = three.slice().sort((p, q) => p - q), s = v => v.join(', ');
    const [p, q, r] = up;
    return { topic: 'ORDER NUMBERS', text: 'Which list goes from least to greatest?', ...opts(s(up), shuffle([s([p, r, q]), s([q, p, r]), s([r, q, p]), s([q, r, p]), s([r, p, q])])),
      steps: ['Least to greatest: smallest number first.', `Compare hundreds, then tens, then ones.`, s(up)] };
  };

  G2.add2digit = d => {
    let a, b;
    if (d === 1) { a = 10 * randInt(1, 7) + randInt(0, 8); const ao = a % 10; b = 10 * randInt(1, 8 - Math.floor(a / 10)) + randInt(0, 9 - ao); }
    else { a = 10 * randInt(1, 7) + randInt(1, 9); b = 10 * randInt(1, 8 - Math.floor(a / 10)) + randInt(10 - a % 10, 9); }
    const s = a + b, ao = a % 10, bo = b % 10, col = rand() < .5;
    return { topic: 'ADDITION', text: col ? 'Add.' : `${a} + ${b} = ?`, say: `What is ${a} plus ${b}?`,
      ...nums(s, [noCarry(a, b), Number(`${Math.floor(a / 10) + Math.floor(b / 10)}${ao + bo}`), s + 10, s - 10, s + 1], comma), steps: colSteps(a, b, '+'), ...(col ? columnFig(a, b, '+') : {}) };
  };

  G2.sub2digit = d => {
    let a, b;
    if (d === 1) { a = 10 * randInt(3, 9) + randInt(2, 9); b = 10 * randInt(1, Math.floor(a / 10) - 1) + randInt(0, a % 10); }
    else { a = 10 * randInt(3, 9) + randInt(0, 8); b = 10 * randInt(1, Math.floor(a / 10) - 2) + randInt(a % 10 + 1, 9); }
    const r = a - b, col = rand() < .5;
    return { topic: 'SUBTRACTION', text: col ? 'Subtract.' : `${a} - ${b} = ?`, say: `What is ${a} minus ${b}?`,
      ...nums(r, [noBorrow(a, b), a + b, r + 10, r - 10, r + 1]), steps: colSteps(a, b, '-'), ...(col ? columnFig(a, b, '-') : {}) };
  };

  G2.addFour = d => {
    const k = d <= 2 ? 3 : 4, ns = range(1, k).map(() => randInt(10, d <= 2 ? 30 : 45)), s = ns.reduce((p, q) => p + q, 0);
    const os = ns.reduce((p, q) => p + q % 10, 0), ts = s - os, [P] = kids(1), story = rand() < .5;
    const text = story ? (k === 3 ? `${P.n} read ${ns[0]}, ${ns[1]} and ${ns[2]} pages on 3 days. How many pages in all?` : `${P.n} scored ${ns[0]}, ${ns[1]}, ${ns[2]} and ${ns[3]} points in 4 games. How many points in all?`) : `${ns.join(' + ')} = ?`;
    return { topic: 'ADD 3 OR 4', text, say: story ? text : `What is ${ns.join(' plus ')}?`, ...nums(s, [ts + os % 10, s - ns[k - 1], s + 10, s - 10, s + 1], comma),
      steps: [`Add the ones: ${ns.map(v => v % 10).join(' + ')} = ${os}.`, `Add the tens: ${ns.map(v => v - v % 10).join(' + ')} = ${ts}.`, `${ts} + ${os} = ${s}`] };
  };

  // Two 3-digit numbers whose ones and tens carry (or borrow) as asked: pattern [ones, tens], null for either.
  function pairFor(op, pat) {
    let a, b;
    for (let i = 0; i < 60; i++) {
      if (op === '+') { a = randInt(100, 799); b = randInt(100, 999 - a); } else { a = randInt(200, 999); b = randInt(100, a - 50); }
      const A = digits(a), B = digits(b), c1 = op === '+' ? A[0] + B[0] >= 10 : A[0] < B[0], c2 = op === '+' ? A[1] + B[1] + (c1 ? 1 : 0) >= 10 : A[1] - (c1 ? 1 : 0) < B[1];
      if ((pat[0] == null || pat[0] === c1) && (pat[1] == null || pat[1] === c2)) break;
    }
    return [a, b];
  }
  G2.add3digit = d => {
    const [a, b] = pairFor('+', d <= 2 ? [false, false] : d === 3 ? pick([[true, false], [false, true]]) : [null, null]), s = a + b, col = rand() < .6;
    return { topic: 'ADD TO 1,000', text: col ? 'Add.' : `${a} + ${b} = ?`, say: `What is ${a} plus ${b}?`, ...nums(s, [noCarry(a, b), s + 10, s + 100, s - 10, s - 100], comma),
      steps: colSteps(a, b, '+'), ...(col ? columnFig(a, b, '+') : {}) };
  };
  G2.sub3digit = d => {
    let a, b;
    if (d === 4 && rand() < .5) { a = 100 * randInt(3, 9) + randInt(0, 8); b = randInt(101, a - 60); if (b % 10 <= a % 10) b = Math.min(a - 2, b - b % 10 + a % 10 + 1); }
    else [a, b] = pairFor('-', d <= 2 ? [false, false] : d === 3 ? pick([[true, false], [false, true]]) : [null, null]);
    const r = a - b, col = rand() < .6;
    return { topic: 'SUBTRACT', text: col ? 'Subtract.' : `${a} - ${b} = ?`, say: `What is ${a} minus ${b}?`, ...nums(r, [noBorrow(a, b), r + 10, r + 100, r - 10, a + b], comma),
      steps: colSteps(a, b, '-'), ...(col ? columnFig(a, b, '-') : {}) };
  };

  G2.regroup = d => {
    const f = pick(['tens', 'ones', 'picture', 'trade']);
    if (f === 'tens') {
      const H = randInt(1, 7), T = randInt(10, 19), O = randInt(0, 9), n = 100 * H + 10 * T + O;
      return { topic: 'REGROUPING', text: `What number is ${H} ${v1(H, 'hundred', 'hundreds')}, ${T} tens and ${O} ones?`, ...nums(n, [Number(`${H}${T}${O}`), 100 * H + 10 * (T - 10) + O, 100 * H + T + O, n + 100], comma),
        steps: [`${T} tens is 1 hundred and ${pv(T - 10, 1)}.`, `So it is ${pv(H + 1, 2)}, ${pv(T - 10, 1)}, ${pv(O, 0)}.`, `That is ${n}.`] };
    }
    if (f === 'ones') {
      const T = randInt(1, 8), O = randInt(10, 19), n = 10 * T + O;
      return { topic: 'REGROUPING', text: `What number is ${T} tens and ${O} ones?`, ...nums(n, [Number(`${T}${O}`), 10 * T + O - 10, T + O, n + 10], comma),
        steps: [`${O} ones is 1 ten and ${pv(O - 10, 0)}.`, `So it is ${pv(T + 1, 1)} and ${pv(O - 10, 0)}.`, `That is ${n}.`] };
    }
    if (f === 'picture') {
      const H = randInt(1, 2), T = randInt(3, 9), O = randInt(11, 15), n = 100 * H + 10 * T + O;
      return { topic: 'REGROUPING', text: 'What number do the blocks show?', ...nums(n, [100 * H + 10 * T + O - 10, Number(`${H}${T}${O}`) < 1e5 ? Number(`${H}${T}${O}`) : n + 100, H + T + O, n + 10], comma),
        steps: [`There are ${O} cubes: that is 1 ten and ${pv(O - 10, 0)}.`, `${pv(H, 2)}, ${pv(T + 1, 1)}, ${pv(O - 10, 0)}.`, `${100 * H} + ${10 * (T + 1)} + ${O - 10} = ${n}`], ...blocks(H, T, O) };
    }
    const H = randInt(1, 9), T = randInt(1, 9), O = randInt(0, 9), n = 100 * H + 10 * T + O;
    return { topic: 'REGROUPING', text: `${n} is ${H} ${v1(H, 'hundred', 'hundreds')}, ${T - 1} ${v1(T - 1, 'ten', 'tens')} and how many ones?`, ...nums(10 + O, [O, O + 1, 10, 9 + O]),
      steps: [`Trade 1 of the ${T} tens for 10 ones.`, `${O} + 10 = ${O + 10} ones.`, `${100 * H} + ${10 * (T - 1)} + ${10 + O} = ${n}`] };
  };

  G2.tenHundredMore = d => {
    const step = pick([10, 100]), more = rand() < .5, cross = d >= 3 && step === 10 && rand() < .5;
    let n = more ? randInt(100, 999 - step) : randInt(100 + step, 999);
    if (cross) n = more ? 100 * randInt(1, 8) + 90 + randInt(0, 9) : 100 * randInt(2, 9) + randInt(0, 9);
    const ans = more ? n + step : n - step, sym = rand() < .4, slip = cross ? (more ? n - 90 : n + 90) : ans + (more ? 1 : -1);
    return { topic: '10 OR 100 MORE', text: sym ? `${n} ${more ? '+' : '-'} ${step} = ?` : `What is ${step} ${more ? 'more' : 'less'} than ${n}?`, ...(sym ? { say: `What is ${n} ${more ? 'plus' : 'minus'} ${step}?` } : {}),
      ...nums(ans, [slip, more ? n + (110 - step) : n - (110 - step), more ? n - step : n + step, ans + 1, ans - 1, more ? ans + step : ans - step], comma),
      steps: [`${step} ${more ? 'more' : 'less'} changes the ${step === 10 ? 'tens' : 'hundreds'} digit by 1.`, cross ? (more ? '9 tens and 1 more ten make a new hundred.' : '0 tens: trade 1 hundred for 10 tens first.') : 'The other digits stay the same.', `${n} ${more ? '+' : '-'} ${step} = ${ans}`] };
  };

  G2.strategyWhy = () => {
    const [P] = kids(1), f = pick(['split', 'compensate', 'related', 'places']);
    if (f === 'split') {
      const a = 10 * randInt(1, 5) + randInt(2, 9), b = 10 * randInt(1, 3) + randInt(10 - a % 10, 9), T = a - a % 10 + b - b % 10, O = a % 10 + b % 10;
      return { topic: 'WHY IT WORKS', text: `To add ${a} + ${b}, ${P.n} does ${a - a % 10} + ${b - b % 10} = ${T} and ${a % 10} + ${b % 10} = ${O}. What next?`,
        say: `To add ${a} plus ${b}, ${P.n} adds the tens, ${T}, and the ones, ${O}. What should ${P.he} do next?`,
        ...opts(`${T} + ${O} = ${T + O}`, [`${T} + ${O} = ${T / 10}${O}`, `${T} - ${O} = ${T - O}`, `${a - a % 10} + ${O} = ${a - a % 10 + O}`, `${T} + ${a % 10} = ${T + a % 10}`]),
        steps: ['Tens plus tens, ones plus ones, then put them together.', `${T} + ${O} = ${T + O}`, `So ${a} + ${b} = ${a + b}.`] };
    }
    if (f === 'compensate') {
      const a = 10 * randInt(1, 6) + pick([8, 9]), k = 10 - a % 10, b = randInt(12, 40);
      return { topic: 'WHY IT WORKS', text: `Which has the same answer as ${a} + ${b}?`, say: `Which one has the same answer as ${a} plus ${b}?`,
        ...opts(`${a + k} + ${b - k}`, [`${a + k} + ${b}`, `${a + k} + ${b + k}`, `${a - k} + ${b}`, `${a} + ${b - k}`]),
        steps: [`Move ${k} from ${b} to ${a}: ${a} + ${k} = ${a + k}.`, `Then ${b} - ${k} = ${b - k}. The total stays the same.`, `${a + k} + ${b - k} = ${a + b}`] };
    }
    if (f === 'related') {
      const s = randInt(40, 99), b = randInt(11, s - 11), r = s - b, E = (x, y, z) => `${x} + ${y} = ${z}`;
      return { topic: 'WHY IT WORKS', text: `Which addition fact helps solve ${s} - ${b}?`, say: `Which addition fact helps solve ${s} minus ${b}?`,
        ...opts(E(b, r, s), [E(s, b, s + b), E(b, s, s + b), E(b, r + 10, s + 10), E(r, r, 2 * r)]),
        steps: [`${s} - ${b} asks: ${b} plus what makes ${s}?`, `${b} + ${r} = ${s}`, `So ${s} - ${b} = ${r}.`] };
    }
    const [a, b] = pairFor('+', [false, false]), A = digits(a), B = digits(b);
    return { topic: 'WHY IT WORKS', text: `To add ${a} + ${b}, what do you add to the ${A[2]} hundreds?`, say: `To add ${a} plus ${b}, what do you add to the ${A[2]} hundreds?`,
      ...opts(`the ${B[2]} ${v1(B[2], 'hundred', 'hundreds')}`, [`the ${B[1]} ${v1(B[1], 'ten', 'tens')}`, `the ${B[0]} ${v1(B[0], 'one', 'ones')}`, `the ${A[1]} ${v1(A[1], 'ten', 'tens')}`, `all of ${b}`]),
      steps: ['Add hundreds to hundreds, tens to tens, ones to ones.', `${A[2]} hundreds + ${B[2]} ${v1(B[2], 'hundred', 'hundreds')} = ${A[2] + B[2]} hundreds.`, `${a} + ${b} = ${a + b}`] };
  };

  // ---- 2nd grade: measuring
  const UNIT = { in: ['inch', 'inches'], cm: ['centimeter', 'centimeters'] };
  const unitFmt = cm => { const [one, many] = UNIT[cm ? 'cm' : 'in']; return v => `${v} ${v === 1 ? one : many}`; };
  function rulerQ(d, cm) {
    const ppu = cm ? 13 : 22, max = cm ? 10 : 6, start = d >= 3 && rand() < .45 ? randInt(1, 2) : 0, len = randInt(cm ? 3 : 1, max - start);
    const near = d === 4 && rand() < .4, off = near ? pick([-1, 1]) * randInt(Math.round(ppu * .15), Math.round(ppu * .3)) : 0;
    const kind = pick(['pencil', 'crayon', 'ribbon', 'caterpillar', 'nail', 'straw']), u = unitFmt(cm), one = UNIT[cm ? 'cm' : 'in'][0];
    return { topic: 'MEASURING', text: near ? `About how long is the ${kind}, to the nearest ${one}?` : `How long is the ${kind}?`,
      ...nums(len, [start + len, len + 1, len - 1, len + 2], u, 1),
      steps: start ? [`The ${kind} starts at ${start}, not at 0.`, `It ends ${near ? 'closest to' : 'at'} ${start + len}.`, `${start + len} - ${start} = ${len}. It is ${near ? 'about ' : ''}${u(len)} long.`]
        : [`The ${kind} starts at 0.`, near ? `Its end is closest to the ${len}.` : `It ends at ${len}.`, `It is ${near ? 'about ' : ''}${u(len)} long.`],
      size: [168, 34], fig: c => { const X = ruler(c, 8, 16, max, ppu, cm ? 'cm' : 'in'); thing(c, kind, X(start), X(start + len) + off, 8); } };
  }
  G2.rulerInches = d => rulerQ(d, false);
  G2.rulerCm = d => rulerQ(d, true);

  G2.inchVsCm = () => {
    const inches = pick([2, 3, 4]), cmv = Math.round(inches * 2.54), kind = pick(['pencil', 'crayon', 'ribbon', 'straw']), f = pick(['cm', 'cm', 'why', 'more']), [P] = kids(1);
    const pic = { size: [160, 52], fig: c => {
      const XI = ruler(c, 8, 12, 4, 27.94, 'in'), x1 = XI(inches); ruler(c, 8, 34, 11, 11, 'cm', true, 2);
      thing(c, kind, 8, x1, 5); line(c, x1, 9, x1, 33, HOT, 1);
    } };
    if (f === 'cm') return { topic: 'INCHES AND CM', text: `The ${kind} is ${inches} inches long. About how many centimeters long is it?`, ...nums(cmv, [inches, 2 * inches, cmv + 2, cmv - 2], v => v + ' cm', 1),
      steps: ['Follow the dotted line down to the centimeter ruler.', `It ends near ${cmv}.`, `${inches} inches is about ${cmv} centimeters.`], ...pic };
    if (f === 'why') return { topic: 'INCHES AND CM', text: `The ${kind} is ${inches} inches, or about ${cmv} centimeters. Why is ${cmv} more than ${inches}?`,
      ...opts('A centimeter is shorter.', ['A centimeter is longer.', 'An inch is shorter.', `The ${kind} grew.`, 'They are the same size.']),
      steps: ['A centimeter is shorter than an inch.', 'It takes more short units to cover the same length.', `So about ${cmv} centimeters = ${inches} inches.`], ...pic };
    return { topic: 'INCHES AND CM', text: `${P.n} measures a ${pick(['book', 'desk', 'shoe', 'lunch box'])} in inches, then in centimeters. Which number is bigger?`,
      ...opts('the centimeters', ['the inches', 'they are the same', "can't tell"]), steps: ['A centimeter is shorter than an inch.', 'Shorter units: you need more of them.', 'So the number of centimeters is bigger.'], ...pic };
  };

  const ESTIMATE = [
    ['a new crayon', 'long', '9 centimeters', ['9 meters', '9 feet', '90 centimeters']], ['a new pencil', 'long', '7 inches', ['7 feet', '7 meters', '70 inches']],
    ['a classroom door', 'tall', '7 feet', ['7 inches', '7 centimeters', '70 feet']], ['a classroom door', 'tall', '2 meters', ['2 centimeters', '2 inches', '20 meters']],
    ['a school bus', 'long', '12 meters', ['12 centimeters', '12 inches', '120 meters']], ['a car', 'long', '4 meters', ['4 centimeters', '4 inches', '40 meters']],
    ['a paper clip', 'long', '3 centimeters', ['3 meters', '3 feet', '30 centimeters']], ['a bed', 'long', '2 meters', ['2 centimeters', '2 inches', '20 meters']],
    ['a spoon', 'long', '6 inches', ['6 feet', '6 meters', '60 inches']], ['a giraffe', 'tall', '5 meters', ['5 centimeters', '5 inches', '50 meters']],
    ['a second grader', 'tall', '4 feet', ['4 inches', '4 centimeters', '40 feet']], ['a sneaker', 'long', '20 centimeters', ['20 meters', '20 feet', '2 centimeters']],
    ['an ant', 'long', '1 centimeter', ['1 meter', '1 foot', '10 meters']], ['a book', 'long', '10 inches', ['10 feet', '10 meters', '100 inches']],
  ];
  const UNIT_HINT = { centimeter: 'A centimeter is about as wide as your little finger.', inch: 'An inch is about as wide as a quarter.', foot: 'A foot is as long as a school ruler.', meter: 'A meter is about one big step.' };
  G2.estimateLength = () => {
    if (rand() < .25) {
      const longest = rand() < .5, U = ['1 centimeter', '1 inch', '1 foot', '1 meter'];
      return { topic: 'ESTIMATE LENGTH', text: `Which is the ${longest ? 'longest' : 'shortest'}?`, ...opts(U[longest ? 3 : 0], U),
        steps: ['From shortest to longest:', '1 centimeter, 1 inch, 1 foot, 1 meter.'] };
    }
    const [what, dim, right, wrongs] = pick(ESTIMATE);
    const key = /centi/.test(right) ? 'centimeter' : /inch/.test(right) ? 'inch' : /f(oo|ee)t/.test(right) ? 'foot' : 'meter';
    return { topic: 'ESTIMATE LENGTH', text: `About how ${dim} is ${what}?`, ...opts(right, wrongs), steps: [UNIT_HINT[key], `${cap(what)} is about ${right} ${dim}.`] };
  };

  G2.howMuchLonger = () => {
    const cm = rand() < .5, ppu = cm ? 13 : 22, max = cm ? 10 : 6, [s, l] = pickN(range(cm ? 3 : 1, max), 2).sort((p, q) => p - q), [A, B] = pickN(['pencil', 'crayon', 'ribbon', 'straw', 'nail'], 2), u = unitFmt(cm);
    return { topic: 'HOW MUCH LONGER', text: `How much longer is the ${B} than the ${A}?`, ...nums(l - s, [l, s, l + s, l - s + 1], u, 1),
      steps: [`The ${B} is ${u(l)}. The ${A} is ${u(s)}.`, `${l} - ${s} = ${l - s}`, `The ${B} is ${u(l - s)} longer.`],
      size: [168, 44], fig: c => { const X = ruler(c, 8, 26, max, ppu, cm ? 'cm' : 'in'); thing(c, A, X(0), X(s), 6); thing(c, B, X(0), X(l), 17); } };
  };

  const LEN_STORIES = [
    ['-', 'inches', (P, a, b) => `A green ribbon is ${a} inches long. A red one is ${b} inches. How much longer is the green one?`],
    ['+', 'feet', (P, a, b) => `${P.n}'s paper plane flew ${a} feet, then ${b} more feet. How far did it fly in all?`],
    ['+', 'centimeters', (P, a, b) => `A snake was ${a} centimeters long. It grew ${b} centimeters. How long is it now?`],
    ['-', 'feet', (P, a, b) => `${P.n} has a rope ${a} feet long. ${P.He} cuts off ${b} feet. How long is the rope now?`],
    ['+', 'meters', (P, a, b) => `${P.n} runs ${a} meters, then ${b} more meters. How far does ${P.he} run?`],
    ['-', 'inches', (P, a, b) => `${P.n}'s block tower is ${a} inches tall. A toy box is ${b} inches. How much taller is the tower?`],
    ['-', 'centimeters', (P, a, b) => `A board is ${a} centimeters long. ${P.n} needs ${b} centimeters. How much should ${P.he} cut off?`],
  ];
  G2.lengthWord = d => {
    const [op, unit, t] = pick(LEN_STORIES), [P] = kids(1), big = randInt(d === 1 ? 25 : 30, d === 1 ? 59 : 99), part = splitT(big, d === 1 ? false : null);
    const [a, b] = op === '+' ? [part, big - part] : [big, part], ans = op === '+' ? a + b : a - b;
    return { topic: 'LENGTH PROBLEMS', text: t(P, a, b), ...nums(ans, [op === '+' ? Math.abs(a - b) : a + b, op === '+' ? noCarry(a, b) : noBorrow(a, b), ans + 10, ans - 10, ans + 1], v => `${v} ${unit}`, 1),
      steps: [op === '+' ? 'Put the two lengths together: add.' : 'Find the difference: subtract.', `${a} ${op} ${b} = ${ans}`, `${ans} ${unit}`] };
  };

  G2.numberLineSum = d => {
    const tens = d >= 3 && rand() < .5, back = rand() < .4, f = pick(['land', 'equation']);
    let L, R, tick, lab, a, b, k = 1;
    if (tens) { L = 0; R = 100; tick = 10; lab = 10; k = randInt(2, 4); b = 10 * k; a = 10 * (back ? randInt(k, 10) : randInt(0, 10 - k)); }
    else { L = 5 * randInt(0, 16); R = L + 20; tick = 1; lab = 5; b = randInt(2, d <= 2 ? 9 : 12); a = back ? randInt(L + b, R) : randInt(L, R - b); }
    const end = back ? a - b : a + b, sg = back ? '-' : '+', eq = `${a} ${sg} ${b} = ${end}`;
    const wr = (back ? [[a, '+', b], [a, '-', b + 1], [end, '-', b], [a + 1, '-', b], [a, '-', b - 1]] : [[a, '-', b], [a, '+', b + 1], [end, '+', b], [a + 1, '+', b], [a, '+', b - 1]])
      .map(([x, o, y]) => [x, o, y, o === '+' ? x + y : x - y]).filter(w => w[3] >= 0).map(([x, o, y, z]) => `${x} ${o} ${y} = ${z}`);
    const text = f === 'equation' ? 'Which number sentence does the number line show?'
      : tens ? `The hops start at ${a} and jump ${back ? 'back ' : ''}by 10, ${k} times. Where do they land?` : `The hop starts at ${a} and jumps ${back ? 'back ' : ''}${b}. Where does it land?`;
    return { topic: 'NUMBER LINE', text, ...(f === 'equation' ? opts(eq, wr) : nums(end, tens ? [end + 10, end - 10, a + k, end + 1, end - 1] : [back ? a + b : a - b, end + 1, end - 1, end + 2, end - 2])),
      steps: [`Start at ${a}.`, tens ? `${k} jumps of 10 ${back ? 'back' : 'forward'} is ${b}.` : `Jump ${back ? 'back' : 'forward'} ${b}.`, eq],
      size: [168, 50], fig: (c, w) => {
        const X = numLine(c, 12, w - 13, 32, L, R, tick, lab, f === 'land' ? [end] : []); disc(c, X(a), 32, 2, HOT);
        if (tens) for (let i = 0; i < k; i++) hop(c, X(a + (back ? -10 : 10) * i), X(a + (back ? -10 : 10) * (i + 1)), 32, 7);
        else { hop(c, X(a), X(end), 32, 13); ink(c, sg + b, Math.round((X(a) + X(end)) / 2), 10, HOT); }
        if (f === 'land') qbox(c, X(end), 42);
      } };
  };

  G2.numberLinePoint = d => {
    const S = [{ a: 0, b: 20, t: 1, l: 5 }, { a: 0, b: 100, t: 10, l: 50 }];
    if (d >= 2) S.push({ a: 0, b: 100, t: 5, l: 50 }, { a: 0, b: 50, t: 5, l: 10 });
    if (d >= 3) { const h = 100 * randInt(1, 8); S.push({ a: h, b: h + 100, t: 10, l: 50 }, { a: 0, b: 1000, t: 100, l: 500 }); }
    const s = pick(S), j = pick(range(1, (s.b - s.a) / s.t - 1).filter(i => (i * s.t) % s.l)), v = s.a + j * s.t, base = s.a + Math.floor(j * s.t / s.l) * s.l;
    return { topic: 'NUMBER LINE', text: 'What number is at the dot?', ...nums(v, [v + s.t, v - s.t, s.t === 1 ? v + 2 : s.a + j, v + 2 * s.t], comma),
      steps: [`Each tick is ${s.t} more than the one before.`, `Count by ${s.t}s from ${comma(base)}: ${range(1, (v - base) / s.t).map(i => comma(base + i * s.t)).join(', ')}.`, `The dot is at ${comma(v)}.`],
      size: [168, 34], fig: (c, w) => { const X = numLine(c, 14, w - 15, 16, s.a, s.b, s.t, s.l); disc(c, X(v), 16, 2, HOT); line(c, X(v), 3, X(v), 10, HOT); line(c, X(v) - 2, 8, X(v), 10, HOT); line(c, X(v) + 2, 8, X(v), 10, HOT); } };
  };

  // ---- 2nd grade: time
  G2.clock5 = d => {
    const h = randInt(1, 12), m = d === 1 ? pick([0, 15, 30, 45]) : d === 2 ? 5 * randInt(0, 11) : pick([5 * randInt(0, 11), 5 * randInt(8, 11)]);
    const next = h % 12 + 1, prev = h === 1 ? 12 : h - 1, mh = m / 5 || 12, right = hm(h, m);
    return { topic: 'TIME', text: 'What time does the clock show?',
      ...opts(right, [hm(m >= 30 ? next : prev, m), hm(mh, (h % 12) * 5), m ? hm(h, m / 5) : hm(h, 12), m % 30 ? hm(h, 60 - m) : hm(h, (m + 30) % 60), hm(h, (m + 5) % 60), hm(next, m)]),
      steps: [m ? `The long minute hand points to ${mh}. Count by 5s: ${m} minutes.` : "The long minute hand points to 12: o'clock.",
        m ? `The short hour hand is past ${h}, not yet at ${next}.` : `The short hour hand points to ${h}.`, `It is ${right}.`], ...bigClock(h, m) };
  };

  G2.timeWords = d => {
    const h = randInt(1, 12), m = pick([0, 15, 30, 45]), next = h % 12 + 1;
    const W = { 0: `${h} o'clock`, 15: `quarter past ${h}`, 30: `half past ${h}`, 45: `quarter to ${next}` }[m];
    const why = { 0: "O'clock means 0 minutes after the hour.", 15: 'A quarter hour is 15 minutes. Quarter past is 15 minutes after.', 30: 'Half past is 30 minutes after the hour.', 45: `Quarter to ${next} is 15 minutes before ${next}.` }[m];
    if (rand() < .5) {
      const wr = { 0: [hm(h, 30), hm(next, 0), hm(h, 12)], 15: [hm(h, 45), hm(next, 15), hm(h, 25)], 30: [hm(h, 0), hm(next, 30), hm(h, 3)], 45: [hm(next, 45), hm(h, 15), hm(next, 15)] }[m];
      return { topic: 'TIME WORDS', text: `What time is ${W}?`, ...opts(hm(h, m), wr), steps: [why, `${cap(W)} is ${hm(h, m)}.`] };
    }
    return { topic: 'TIME WORDS', text: `What is another way to say ${hm(h, m)}?`, ...opts(W, shuffle([`quarter past ${h}`, `quarter to ${h}`, `half past ${h}`, `${h} o'clock`, `quarter to ${next}`, `half past ${next}`])),
      steps: [why, `${hm(h, m)} is ${W}.`], ...(d <= 2 ? bigClock(h, m) : {}) };
  };

  G2.clockMatch5 = () => {
    const h = randInt(1, 12), m = 5 * randInt(1, 11), next = h % 12 + 1, prev = h === 1 ? 12 : h - 1, mh = m / 5, key = t => t.join(':');
    const cand = [[m >= 30 ? next : prev, m], [mh, (h % 12) * 5], [h, (60 - m) % 60], [h, (m + 15) % 60], [next, m], [h, (m + 30) % 60], [prev, m]];
    const seen = new Set([key([h, m])]), others = [];
    for (const t of cand) if (others.length < 3 && !seen.has(key(t))) { seen.add(key(t)); others.push(t); }
    const times = shuffle([[h, m], ...others]), at = times.findIndex(t => key(t) === key([h, m]));
    return { topic: 'TIME', text: `Which clock shows ${hm(h, m)}?`, ...which(at),
      steps: [`${m} minutes: the minute hand points to ${mh}.`, `The hour hand is past ${h}, not yet at ${next}.`, `That is clock ${at + 1}.`], ...fourClocks(times) };
  };

  const DAY = [
    ['wakes up', 'wake up', [6, 7], 'AM'], ['eats breakfast', 'eat breakfast', [7, 8], 'AM'], ['gets to school', 'get to school', [8, 8], 'AM'],
    ['goes out to recess', 'go out to recess', [10, 10], 'AM'], ['eats lunch at school', 'eat lunch', [12, 12], 'PM'], ['goes home from school', 'go home from school', [3, 3], 'PM'],
    ['goes to soccer practice', 'go to soccer practice', [4, 5], 'PM'], ['eats dinner', 'eat dinner', [6, 6], 'PM'], ['takes a bath', 'take a bath', [7, 7], 'PM'], ['goes to bed', 'go to bed', [8, 9], 'PM'],
  ];
  G2.amPm = () => {
    const [P] = kids(1), A = pick(DAY), h = randInt(A[2][0], A[2][1]), m = 5 * randInt(0, 11), t = hm(h, m), ap = A[3], other = ap === 'AM' ? 'PM' : 'AM';
    const part = ap === 'AM' ? 'morning' : h === 12 ? 'middle of the day' : h < 5 ? 'afternoon' : 'evening';
    const steps = ['AM is the morning: from midnight to noon.', 'PM is after noon: the afternoon and night.', `${P.n} ${A[0]} in the ${part}: ${t} ${ap}.`];
    if (rand() < .55) return { topic: 'AM AND PM', text: `${P.n} ${A[0]}. What time is it?`,
      ...opts(`${t} ${ap}`, [`${t} ${other}`, `${hm(h % 12 + 1, m)} ${ap}`, `${hm(h % 12 + 1, m)} ${other}`, `${hm(m / 5 || 12, (h % 12) * 5)} ${ap}`]), steps, ...bigClock(h, m) };
    const wrongs = DAY.filter(B => B[3] !== ap || Math.abs(B[2][0] - h) >= 3).map(B => B[1]);
    return { topic: 'AM AND PM', text: `Which would you most likely do at ${t} ${ap}?`, ...opts(A[1], pickN(wrongs, 3)), steps };
  };

  // ---- 2nd grade: money
  G2.coinCount = d => {
    const types = d === 1 ? ['d', 'n', 'p'] : ['q', 'd', 'n', 'p'], cap = d <= 2 ? 99 : 199;
    let items = [];
    for (let i = 0; i < 40; i++) { items = range(1, randInt(3, [0, 6, 7, 8, 9][d])).map(() => pick(types)); if (worth(items) <= cap && new Set(items).size >= 2) break; }
    items.sort((a, b) => COIN[b].v - COIN[a].v);
    const v = worth(items), run = []; let acc = 0; for (const k of items) run.push(acc += COIN[k].v);
    const swapND = items.reduce((a, k) => a + (k === 'n' ? 10 : k === 'd' ? 5 : COIN[k].v), 0);
    return { topic: 'MONEY', text: 'How much money is shown?', ...nums(v, [items.length, swapND, v + 5, v - 5, v + 10, v + 1], money, 1),
      steps: ['Start with the coins worth the most.', `Count on: ${run.join(', ')}.`, `That is ${money(v)}.`], ...cash(items) };
  };

  G2.billsCoins = d => {
    const bills = range(1, randInt(1, 3)).map(() => pick(d >= 4 ? ['$1', '$5', '$10'] : ['$1', '$1', '$5'])).sort((a, b) => +b.slice(1) - +a.slice(1));
    const coins = range(1, randInt(1, 5)).map(() => pick(['q', 'd', 'n', 'p'])).sort((a, b) => COIN[b].v - COIN[a].v), items = [...bills, ...coins];
    const v = worth(items), bv = worth(bills), cv = v - bv;
    return { topic: 'MONEY', text: 'How much money is shown?', ...nums(v, [bv, v - 100, v + 100, cv + 100 * bills.length, v + 10, v - 5], money, 1),
      steps: ['Count the dollar bills first, then the coins.', `Bills: ${money(bv)}. Coins: ${money(cv)}.`, `${money(bv)} + ${money(cv)} = ${money(v)}`], ...cash(items) };
  };

  const SHOP = [['sticker', 5, 30], ['pencil', 10, 40], ['eraser', 10, 35], ['yo-yo', 30, 75], ['bouncy ball', 20, 60], ['cookie', 25, 60], ['juice box', 30, 70], ['comic book', 40, 95], ['toy car', 35, 90], ['kite', 50, 95]];
  const art = w => (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w;
  const price = (A, d) => { const p = randInt(A[1], A[2]); return d === 1 ? Math.max(5, p - p % 5) : p; };
  G2.moneyWord = d => { const q = moneyStory(d); q.say = sayMoney(q.text); return q; };
  function moneyStory(d) {
    const [P] = kids(1), f = pick(['buyTwo', 'change', 'coinsTotal', 'dollars']);
    if (f === 'buyTwo') {
      const [A, B] = pickN(SHOP, 2), a = price(A, d); let b = price(B, d); if (d <= 2 && a + b > 99) b = Math.max(1, 99 - a - (d === 1 ? (99 - a) % 5 : 0));
      return { topic: 'MONEY', text: `${P.n} buys ${art(A[0])} for ${a}¢ and ${art(B[0])} for ${b}¢. How much does ${P.he} spend?`,
        ...nums(a + b, [Math.abs(a - b), noCarry(a, b), a + b + 10, a + b - 10, a + b + 1], money, 1), steps: ['Spend on both: add.', `${a}¢ + ${b}¢ = ${money(a + b)}`] };
    }
    if (f === 'change') {
      const A = pick(SHOP), cost = price(A, d), has = Math.min(d <= 2 ? 99 : 199, cost + randInt(5, 60)), left = has - cost;
      return { topic: 'MONEY', text: `${P.n} has ${money(has)}. ${P.He} buys ${art(A[0])} for ${money(cost)}. How much money is left?`,
        ...nums(left, [has + cost, noBorrow(has, cost), left + 10, left - 10, left + 1], money, 1), steps: ['Money is spent: subtract.', `${money(has)} - ${money(cost)} = ${money(left)}`] };
    }
    if (f === 'coinsTotal') {
      const q = randInt(d === 1 ? 0 : 1, 3), dd = randInt(1, 4), nn = randInt(1, 3), v = 25 * q + 10 * dd + 5 * nn, pl = (k, w) => `${k} ${COIN[w][k === 1 ? 'name' : 'many']}`;
      const list = [q ? pl(q, 'q') : null, pl(dd, 'd'), pl(nn, 'n')].filter(Boolean);
      return { topic: 'MONEY', text: `${P.n} has ${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}. How much money is that?`,
        ...nums(v, [q + dd + nn, 25 * q + 5 * dd + 10 * nn, 25 * q + 10 * dd, v + 5, v - 5], money, 1),
        steps: ['A quarter is 25¢, a dime 10¢, a nickel 5¢.', `${[...Array(q).fill(25), ...Array(dd).fill(10), ...Array(nn).fill(5)].join(' + ')} = ${money(v)}`] };
    }
    if (d >= 3 && rand() < .5) {
      const c3 = 5 * randInt(3, 19), toy = pick(['pack of gum', 'pencil', 'sticker sheet', 'bag of chips']);
      return { topic: 'MONEY', text: `${cap(art(toy))} costs ${c3}¢. ${P.n} pays with a $1 bill. How much change does ${P.he} get?`,
        ...nums(100 - c3, [c3, 100 + c3, 100 - c3 + 10, 100 - c3 - 5], money, 1), steps: ['$1 is 100¢.', `100¢ - ${c3}¢ = ${100 - c3}¢`] };
    }
    const y = pick([5, 10]), x = randInt(1, y - 1), toy = pick(['book', 'toy robot', 'puzzle', 'dinosaur toy', 'ball']);
    return { topic: 'MONEY', text: `${cap(art(toy))} costs $${x}. ${P.n} pays with a $${y} bill. How much change does ${P.he} get?`,
      ...nums(y - x, [y + x, x, y - x + 1, y - x - 1], v => '$' + v, 1), steps: [`Change is what you pay minus the cost.`, `$${y} - $${x} = $${y - x}`] };
  }

  // Every group of 2 to 4 coins that fits a quarter of the coin picture, biggest coin first.
  const GROUPS = (() => { const out = [], T = ['q', 'd', 'n', 'p'], rec = (g, from) => { if (g.length >= 2 && rowW(g) <= 72) out.push(g.slice()); if (g.length === 4) return; for (let i = from; i < 4; i++) { g.push(T[i]); rec(g, i); g.pop(); } }; rec([], 0); return out; })();
  G2.coinsMake = d => {
    const pool = GROUPS.filter(g => d >= 3 || !g.includes('p')), right = pick(pool.filter(g => worth(g) >= 15 && worth(g) <= (d >= 3 ? 99 : 80))), T = worth(right);
    const near = shuffle(pool.filter(g => worth(g) !== T && Math.abs(worth(g) - T) <= 25)), far = shuffle(pool.filter(g => worth(g) !== T)), wrongs = [];
    for (const g of [...near, ...far]) if (wrongs.length < 3 && !wrongs.some(w => worth(w) === worth(g))) wrongs.push(g);
    const groups = shuffle([right, ...wrongs]), at = groups.indexOf(right), run = []; let acc = 0; for (const k of right) run.push(acc += COIN[k].v);
    return { topic: 'MONEY', text: `Which group of coins makes ${money(T)}?`, say: sayMoney(`Which group of coins makes ${money(T)}?`), ...which(at),
      steps: ['Count each group, biggest coin first.', `Group ${at + 1}: ${run.join(', ')}. That is ${money(T)}.`],
      size: [168, 96], fig: c => groups.forEach((g, i) => { const x = (i % 2) * 84, y = (i >> 1) * 48; if (i % 2) line(c, x, y + 2, x, y + 45, GRID); if (i > 1) line(c, x + 2, y, x + 81, y, GRID); label(c, String(i + 1), x + 5, y + 8, HOT); coinRow(c, x + 46, y + 15, g); }) };
  };

  // ---- 2nd grade: data
  G2.linePlot = d => {
    const [P] = kids(1), [what, unit] = pick([['pencils', 'inches'], ['crayons', 'inches'], ['leaves', 'inches'], ['shells', 'centimeters'], ['worms', 'centimeters'], ['toy cars', 'inches']]);
    const a = randInt(2, 6), vals = range(a, a + 5);
    let cnt = [];
    for (let i = 0; i < 30; i++) { cnt = vals.map(() => randInt(0, d <= 2 ? 3 : 5)); const mx = Math.max(...cnt); if (cnt.reduce((p, q) => p + q, 0) >= 5 && cnt.filter(v => v === mx).length === 1) break; }
    const mx = Math.max(...cnt); if (cnt.filter(v => v === mx).length > 1) cnt[cnt.indexOf(mx)]++;
    const total = cnt.reduce((p, q) => p + q, 0), u = v => `${v} ${unit}`, pre = `${P.n} measured ${what} in ${unit}. `, f = pick(['at', 'total', 'most', 'longer', 'diff']);
    const pic = { size: [160, 62], fig: (c, w) => {
      const X = numLine(c, 12, w - 13, 48, a, a + 5, 1, 1);
      cnt.forEach((n, i) => { for (let k = 0; k < n; k++) { const x = X(a + i), y = 41 - k * 7; line(c, x - 2, y - 2, x + 2, y + 2, HOT); line(c, x + 2, y - 2, x - 2, y + 2, HOT); } });
    } };
    let q;
    if (f === 'at') { const v = pick(vals), n = cnt[v - a]; q = { text: pre + `How many ${what} are ${u(v)} long?`, ...nums(n, [n + 1, v, n - 1, total]), steps: ['Each X is one thing measured.', `Count the X's above ${v}: ${n}.`] }; }
    else if (f === 'total') q = { text: pre + `How many ${what} did ${P.he} measure?`, ...nums(total, [vals.length, total - 1, total + 1, mx], String, 1), steps: ['Each X is one thing measured.', `Count all the X's: ${cnt.filter(n => n).join(' + ')} = ${total}.`] };
    else if (f === 'most') { const v = a + cnt.indexOf(mx); q = { text: pre + 'Which length did the most of them have?', ...nums(v, [mx, v + 1, v - 1], u, 1), steps: ['Find the tallest stack of X\'s.', `${mx} X's are above ${v}.`, `The most common length is ${u(v)}.`] }; }
    else if (f === 'longer') { const v = pick(vals.slice(1, 4)), n = cnt.slice(v - a + 1).reduce((p, q) => p + q, 0); q = { text: pre + `How many ${what} are longer than ${u(v)}?`, ...nums(n, [n + cnt[v - a], cnt[v - a], n + 1, n - 1]), steps: [`Longer than ${v} means ${v + 1} and up. Don't count ${v}.`, `Add the X's from ${v + 1} on: ${n}.`] }; }
    else { const lo = a + cnt.findIndex(n => n), hi = a + 5 - cnt.slice().reverse().findIndex(n => n); q = { text: pre + 'How much longer is the longest one than the shortest one?', ...nums(hi - lo, [hi, lo, hi + lo, hi - lo + 1], u, 1), steps: [`The longest is ${u(hi)}. The shortest is ${u(lo)}.`, `${hi} - ${lo} = ${hi - lo}`] }; }
    return { topic: 'LINE PLOT', ...q, ...pic };
  };

  G2.picGraph2 = d => {
    const { S, cats, vals } = survey(4, 1, d <= 2 ? 6 : 9), lw = Math.max(...cats.map(s => Font.width(s))) + 6;
    return { topic: 'PICTURE GRAPH', ...graphQ('picture graph', S, cats, vals), size: [lw + 10 * Math.max(...vals) + 8, 61], fig: (c, w, h) => picGraph(c, w, h, cats, vals, S.ic) };
  };
  G2.barGraph = d => {
    const top = d <= 2 ? 10 : 12, { S, cats, vals } = survey(4, 1, top);
    return { topic: 'BAR GRAPH', ...graphQ('bar graph', S, cats, vals), size: [150, top === 10 ? 80 : 86], fig: (c, w, h) => barGraph(c, w, h, cats, vals, top) };
  };

  // ---- 2nd grade: shapes and shares
  const POLY_N = { triangle: 3, quadrilateral: 4, pentagon: 5, hexagon: 6, octagon: 8 };
  const anA = w => /^[aeiou]/.test(w) ? 'an' : 'a';
  // The sharpest turn at any corner and the shortest side, so an irregular shape never hides a corner.
  function cornersOK(pts, r) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i + pts.length - 1) % pts.length], b = pts[i], e = pts[(i + 1) % pts.length];
      let t = Math.abs(Math.atan2(e[1] - b[1], e[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0])); if (t > Math.PI) t = 2 * Math.PI - t;
      if (t < .5 || Math.hypot(e[0] - b[0], e[1] - b[1]) < r * .5) return false;
    }
    return true;
  }
  function polyPts(n, cx, cy, r, irr) {
    const rot = rand() * 2 * Math.PI;
    if (irr && n < 8) for (let i = 0; i < 20; i++) { const p = ngon(cx, cy, r, n, rot, jitter(n)); if (cornersOK(p, r)) return p; }
    return ngon(cx, cy, r, n, rot);
  }
  G2.shapeName2 = d => {
    const name = pick(d >= 3 ? Object.keys(POLY_N) : ['triangle', 'quadrilateral', 'pentagon', 'hexagon']), n = POLY_N[name], pts = polyPts(n, 32, 28, 25, d >= 2 && rand() < .65), col = pick(COLS);
    return { topic: 'SHAPES', text: 'What is the name of this shape?', ...opts(name, shuffle(Object.keys(POLY_N))),
      steps: [`Count the sides: ${upto(n)}.`, `A shape with ${n} sides is ${anA(name)} ${name}.`],
      size: [64, 56], fig: c => { poly(c, pts, col); if (d <= 2) pts.forEach(p => disc(c, Math.round(p[0]), Math.round(p[1]), 1, HOT)); } };
  };

  G2.sidesAngles = d => {
    const f = pick(['count', 'which', 'riddle']), names = Object.keys(POLY_N);
    if (f === 'count') {
      const name = pick(names), n = POLY_N[name], what = pick(['sides', 'angles', 'vertices']), pts = polyPts(n, 32, 28, 25, rand() < .6), col = pick(COLS);
      return { topic: 'SHAPES', text: `How many ${what} does this shape have?`, ...(what === 'vertices' ? { say: 'How many vertices, or corners, does this shape have?' } : {}),
        ...nums(n, [n - 1, n + 1, n + 2], String, 1), steps: [`Count the ${what} as you go around: ${upto(n)}.`, `${cap(anA(name))} ${name} has ${n} sides, ${n} angles and ${n} vertices.`],
        size: [64, 56], fig: c => poly(c, pts, col) };
    }
    if (f === 'which') {
      const set = shuffle([3, 4, 5, 6]), n = pick(set), P = set.map(k => polyPts(k, 0, 0, 15, rand() < .6)), cols = set.map(() => pick(COLS)), what = pick(['sides', 'angles']);
      return { topic: 'SHAPES', text: `Which shape has ${n} ${what}?`, ...which(set.indexOf(n)), steps: [`Count the ${what} of each shape.`, `Shape ${set.indexOf(n) + 1} has ${n}.`],
        size: [168, 46], fig: (c, w, h) => four(c, w, h, (i, x, y, cw, ch) => poly(c, P[i].map(([px, py]) => [px + x + cw / 2, py + y + ch / 2]), cols[i])) };
    }
    const name = pick(names), n = POLY_N[name];
    return { topic: 'SHAPES', text: `I have ${n} sides and ${n} angles. What shape am I?`, ...opts(name, shuffle(names)), steps: [`${n} sides and ${n} angles: that is ${anA(name)} ${name}.`, 'Tri- is 3, quad- is 4, penta- is 5, hexa- is 6, octa- is 8.'] };
  };

  G2.cubeFaces = d => {
    const f = pick(['faces', 'edges', 'vertices', 'faceShape', 'which']), col = pick(COLS), cube = { size: [70, 60], fig: c => solid(c, 'cube', 35, 30, 50, col) };
    if (f === 'faces') return { topic: 'SOLID SHAPES', text: 'How many faces does a cube have?', ...nums(6, [3, 4, 8, 12]), steps: ['You can see 3 faces. 3 more are hidden: the back, the bottom and one side.', 'A cube has 6 square faces, all the same size.'], ...cube };
    if (f === 'edges') return { topic: 'SOLID SHAPES', text: 'How many edges does a cube have?', ...nums(12, [8, 6, 9, 10]), steps: ['An edge is where two faces meet.', '4 around the top, 4 around the bottom, 4 going up and down.', '4 + 4 + 4 = 12'], ...cube };
    if (f === 'vertices') return { topic: 'SOLID SHAPES', text: 'How many vertices (corners) does a cube have?', say: 'How many vertices, or corners, does a cube have?', ...nums(8, [6, 7, 4, 12]), steps: ['A vertex is a corner, where edges meet.', '4 on the top and 4 on the bottom: 4 + 4 = 8.'], ...cube };
    if (f === 'faceShape') return { topic: 'SOLID SHAPES', text: 'What shape is each face of a cube?', ...opts('square', ['triangle', 'circle', 'hexagon', 'pentagon']), steps: ['Each face is flat, with 4 equal sides and square corners.', 'So each face is a square.'], ...cube };
    const set = shuffle(['cube', 'box', 'cylinder', pick(['pyramid', 'cone'])]), at = set.indexOf('cube'), cs = set.map(() => pick(COLS));
    return { topic: 'SOLID SHAPES', text: 'Which solid shape is a cube?', ...which(at), steps: ['A cube has 6 faces, and all of them are equal squares.', 'The box has faces that are long rectangles.', `Shape ${at + 1} is the cube.`],
      size: [168, 48], fig: (c, w, h) => four(c, w, h, (i, x, y, cw, ch) => solid(c, set[i], x + Math.round(cw / 2), y + Math.round(ch / 2), 30, cs[i])) };
  };

  G2.rowsColumns = d => {
    const R = randInt(2, d === 1 ? 3 : 5), C = randInt(2, d === 1 ? 4 : 6), n = R * C, f = pick(d >= 3 ? ['total', 'partial', 'count'] : ['total', 'total', 'count']), col = pick(COLS), rowSum = Array(R).fill(C).join(' + ');
    const pic = { size: [C * 11 + 14, R * 11 + 8], fig: (c, W, H) => {
      const x = Math.round((W - C * 11 - 1) / 2), y = Math.round((H - R * 11 - 1) / 2);
      if (f === 'partial') frame(c, x, y, C * 11 + 1, R * 11 + 1, INK);
      for (let i = 0; i < C; i++) for (let j = 0; j < R; j++) if (f !== 'partial' || i === 0 || j === 0) { box(c, x + i * 11, y + j * 11, 12, 12, INK); box(c, x + i * 11 + 1, y + j * 11 + 1, 10, 10, col); }
    } };
    if (f === 'count') { const rows = rand() < .5; return { topic: 'ROWS AND COLUMNS', text: `How many ${rows ? 'rows' : 'columns'} of squares are there?`, ...nums(rows ? R : C, [rows ? C : R, n, (rows ? R : C) + 1], String, 1), steps: [rows ? 'Rows go across.' : 'Columns go up and down.', `There are ${rows ? R : C}.`], ...pic }; }
    return { topic: 'ROWS AND COLUMNS', text: f === 'partial' ? 'Fill the rectangle with squares like these. How many squares in all?' : 'How many small squares make up the rectangle?',
      ...nums(n, [R + C, 2 * (R + C), n + C, n - R, R + C - 1], String, 1), steps: [`${R} rows, with ${C} squares in each row.`, `${rowSum} = ${n}`], ...pic };
  };

  const FW = ['', 'one', 'two', 'three', 'four'], FP = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['fourth', 'fourths'] };
  const fname = (k, n) => `${FW[k]} ${k === 1 ? FP[n][0] : FP[n][1]}`;
  G2.fractionName = d => {
    const n = pick([2, 3, 4]), k = d <= 2 ? 1 : randInt(1, n), s = shareSpec(n, true), sh = pickN(range(0, n - 1), k), right = fname(k, n);
    if (!s.circ && n === 4 && rand() < .5) s.how = pick(['grid', 'x']);
    const wr = [n - k >= 1 ? fname(n - k, n) : null, ...[2, 3, 4].filter(m => m !== n && k <= m).map(m => fname(k, m)), k < n ? fname(k + 1, n) : null, k > 1 ? fname(k - 1, n) : null, 'one half', 'one third', 'one fourth'].filter(Boolean);
    return { topic: 'FRACTIONS', text: 'What part of the shape is shaded?', ...opts(right, wr),
      steps: [`The shape has ${n} equal parts.`, `${k} ${v1(k, 'part is', 'parts are')} shaded.`, k === n ? `All ${n} are shaded: ${right} make one whole.` : `So ${right} ${v1(k, 'is', 'are')} shaded.`],
      size: [64, 48], fig: c => drawShare(c, s, 32, 24, sh, true) };
  };

  G2.equalShares3 = () => {
    const n = pick([2, 3, 4]), word = FP[n][1], [m1, m2] = shuffle([2, 3, 4].filter(m => m !== n));
    const specs = shuffle([shareSpec(n, true), shareSpec(n, false), shareSpec(m1, true), shareSpec(m2, rand() < .5)]), at = specs.findIndex(s => isEqualShare(s, n));
    return { topic: 'EQUAL SHARES', text: `Which shape is cut into ${word}?`, ...which(at),
      steps: [`${cap(word)} means ${n} equal parts.`, `Shape ${at + 1} has ${n} parts, all the same size.`], size: [168, 48],
      fig: (c, w, h) => four(c, w, h, (i, x, y, cw, ch) => drawShare(c, specs[i], x + Math.round(cw / 2), y + Math.round(ch / 2))) };
  };

  G2.wholeShares = () => {
    const f = pick(['howMany', 'slice', 'same', 'eat']), [P] = kids(1);
    if (f === 'same') {
      const n = pick([2, 4]), one = FP[n][0], [h1, h2] = n === 2 ? ['cols', 'diag'] : ['grid', 'x'];
      return { topic: 'EQUAL SHARES', text: 'Both squares are the same size. Which is true about the shaded parts?',
        ...opts(`Both are one ${one}.`, ['The triangle is bigger.', `Only one is a ${one}.`, `Neither is a ${one}.`]),
        steps: [`Each square is cut into ${n} equal parts.`, `The parts have different shapes, but each is one ${one} of the same square.`, 'So the shaded parts are the same size.'],
        size: [100, 44], fig: c => { parts(c, rectParts(10, 4, 36, 36, h1, n), [0]); parts(c, rectParts(54, 4, 36, 36, h2, n), [0]); } };
    }
    const n = pick([2, 3, 4]), [one, many] = FP[n];
    if (f === 'howMany') return { topic: 'FRACTIONS', text: `How many ${many} make one whole?`, ...nums(n, [n + 1, n - 1, 1, 2 * n], String, 1),
      steps: [`A whole cut into ${many} has ${n} equal parts.`, `${cap(FW[n])} ${many} make one whole.`], size: [64, 48], fig: (spec => c => drawShare(c, spec, 32, 24, range(0, n - 1), true))(shareSpec(n, true)) };
    if (f === 'slice') return { topic: 'FRACTIONS', text: `A pizza is cut into ${n} equal slices. What is each slice called?`, ...opts(`a ${one}`, ['a half', 'a third', 'a fourth', 'a whole']),
      steps: [`${n} equal parts are called ${many}.`, `Each slice is a ${one} of the pizza.`] };
    return { topic: 'FRACTIONS', text: `${P.n} cuts a sandwich into ${n} equal parts and eats ${n === 2 ? 'both' : `all ${n}`}. How much did ${P.he} eat?`,
      ...opts('the whole sandwich', [`one ${one} of it`, `${n} sandwiches`, n === 2 ? 'a fourth of it' : 'half of it', 'none of it']), steps: [`${cap(FW[n])} ${many} make one whole.`, `So ${P.he} ate the whole sandwich.`] };
  };

  Questions.grade({ id: '2', n: 2, label: '2ND GRADE', short: '2ND', clock: [60, 55, 50, 45, 45], kinds: G2,
    min: { wordTwoStep: 2, add3digit: 2, sub3digit: 2, regroup: 2, strategyWhy: 2, billsCoins: 2, addFour: 2 } });

  // ======================================================== WIDER THAN THE COMMON CORE
  // IXL's plans mix in state standards: calendars, temperature, weight and capacity, patterns, chance,
  // symmetry, ordinals, Roman numerals and more. The shared ones are written once; gr (0 = K, 1, 2) sets
  // the numbers and the words, and each grade picks them up at the bottom of the file.
  const CNAME = { red: RED, blue: BLU, green: GRN, yellow: HOT };
  const DAYS = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' ');
  const MONTHS = 'January February March April May June July August September October November December'.split(' ');
  const ORD = n => n + ([, 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] || 'th');
  const ORDW = ',first,second,third,fourth,fifth,sixth,seventh,eighth,ninth,tenth'.split(',');
  const wrapAt = (a, i) => a[((i % a.length) + a.length) % a.length];

  // A table with a header row. ws: column widths. hl: a row to highlight.
  function table(c, x, y, ws, rows, rh = 12, hl = -1) {
    const W = ws.reduce((a, b) => a + b, 0);
    rows.forEach((r, j) => {
      const yy = y + j * rh;
      box(c, x, yy, W + 1, rh + 1, DIM); box(c, x + 1, yy + 1, W - 1, rh - 1, j === 0 ? '#22306a' : j === hl ? '#3a3008' : '#141c48');
      let xx = x; r.forEach((s, i) => { if (i) box(c, xx, yy, 1, rh, DIM); ink(c, s, xx + ws[i] / 2, yy + rh / 2 + 1, j === 0 || s === '?' ? HOT : INK); xx += ws[i]; });
    });
  }
  // A price tag with its price; returns its width.
  function tag(c, x, y, s) {
    const w = Font.width(s) + 11, p = [[x, y + 6], [x + 5, y], [x + w, y], [x + w, y + 12], [x + 5, y + 12]];
    fillPoly(c, p, '#f8e8b0'); outlinePoly(c, p, '#8a6420'); disc(c, x + 5, y + 6, 1, '#8a6420'); ink(c, s, x + 6 + (w - 6) / 2, y + 7, '#3c2c10');
    return w;
  }
  // A game spinner: equal sectors in the colors given, and a fixed pointer at the top.
  function spinner(c, cx, cy, r, cols) {
    const n = cols.length;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r + r) continue;
      c.fillStyle = CNAME[cols[Math.floor(((Math.atan2(x, -y) / DEG + 360) % 360) / (360 / n)) % n]]; c.fillRect(cx + x, cy + y, 1, 1);
    }
    for (let i = 0; i < n; i++) { const a = i * 360 / n * DEG; line(c, cx, cy, cx + Math.sin(a) * r, cy - Math.cos(a) * r, '#101830'); }
    circle(c, cx, cy, r, INK); disc(c, cx, cy, 2, INK); fillPoly(c, [[cx - 4, cy - r - 6], [cx + 4, cy - r - 6], [cx, cy - r + 1]], INK);
  }
  // A glass jar of marbles, colors in the order given.
  function jar(c, cx, by, cols) {
    const per = 5, rows = Math.ceil(cols.length / per), w = per * 9 + 9, h = rows * 9 + 14, x = cx - Math.round(w / 2), y = by - h;
    box(c, x, y + 4, w, h - 4, '#1c2a50'); frame(c, x, y + 4, w, h - 4, LITE); box(c, x + 3, y, w - 6, 5, '#8a6420');
    cols.forEach((k, i) => disc(c, x + 8 + (i % per) * 9, by - 6 - Math.floor(i / per) * 9, 3, CNAME[k]));
  }
  // A thermometer in degrees Fahrenheit: the tube at x, lo to hi, a mark every `tick`, the red column up to v.
  function thermo(c, x, H, lo, hi, tick, v, labEvery = 10) {
    const top = 5, bot = H - 17, Y = t => Math.round(bot - (t - lo) * (bot - top) / (hi - lo));
    box(c, x - 3, top - 2, 7, bot - top + 8, '#a8b0c0'); box(c, x - 2, top - 1, 5, bot - top + 7, '#e8ecf4');
    disc(c, x, H - 8, 6, '#a8b0c0'); disc(c, x, H - 8, 4, RED); box(c, x - 1, Y(v), 3, H - 8 - Y(v), RED);
    for (let t = lo; t <= hi; t += tick) { const y = Y(t), big = t % 10 === 0; box(c, x + 5, y, big ? 4 : 2, 1, INK); if (t % labEvery === 0) Font.draw(c, `${t}°`, x - 6, y - 4, LITE, { align: 'right' }); }
  }
  // One month of a calendar, the month and year on top.
  function calPage(c, w, year, m) {
    const first = new Date(Date.UTC(year, m, 1)).getUTCDay(), days = new Date(Date.UTC(year, m + 1, 0)).getUTCDate(), cw = 22, x0 = Math.round((w - 7 * cw) / 2);
    ink(c, `${MONTHS[m].toUpperCase()} ${year}`, w / 2, 4, HOT);
    'SMTWTFS'.split('').forEach((s, i) => ink(c, s, x0 + i * cw + cw / 2, 13, LITE));
    for (let dd = 1; dd <= days; dd++) { const k = first + dd - 1, x = x0 + (k % 7) * cw, y = 18 + Math.floor(k / 7) * 11; frame(c, x, y, cw + 1, 12, GRID); ink(c, dd, x + cw / 2, y + 6, INK); }
  }
  const monthInfo = (y, m) => ({ first: new Date(Date.UTC(y, m, 1)).getUTCDay(), days: new Date(Date.UTC(y, m + 1, 0)).getUTCDate() });
  // Containers to compare, bottom-centred at (cx, by), from small to big inside.
  const CONT_ORDER = ['cup', 'bowl', 'pitcher', 'bucket', 'bathtub'];
  function container(c, kind, cx, by) {
    const W = '#9ccff0';
    if (kind === 'cup') { poly(c, [[cx - 6, by - 12], [cx + 6, by - 12], [cx + 6, by], [cx - 6, by]], W); line(c, cx + 6, by - 9, cx + 9, by - 9, INK); line(c, cx + 9, by - 9, cx + 9, by - 4, INK); line(c, cx + 9, by - 4, cx + 6, by - 4, INK); }
    else if (kind === 'bowl') poly(c, [[cx - 14, by - 10], [cx + 14, by - 10], ...range(1, 7).map(t => [cx + 14 * Math.cos(Math.PI * t / 8), by - 10 + 10 * Math.sin(Math.PI * t / 8)]), [cx - 14, by - 10]], W);
    else if (kind === 'pitcher') { poly(c, [[cx - 8, by - 26], [cx + 7, by - 26], [cx + 11, by - 30], [cx + 9, by - 22], [cx + 9, by], [cx - 9, by]], W); line(c, cx - 9, by - 22, cx - 13, by - 18, INK); line(c, cx - 13, by - 18, cx - 13, by - 8, INK); line(c, cx - 13, by - 8, cx - 9, by - 6, INK); }
    else if (kind === 'bucket') { poly(c, [[cx - 12, by - 22], [cx + 12, by - 22], [cx + 9, by], [cx - 9, by]], '#b8c0d0'); F.arc(c, cx, by - 22, 12, 0, Math.PI, LITE); box(c, cx - 11, by - 16, 22, 1, '#8890a0'); }
    else { poly(c, [[cx - 20, by - 16], [cx + 20, by - 16], [cx + 18, by - 3], [cx - 18, by - 3]], '#f0f2f8'); box(c, cx - 17, by - 3, 3, 3, LITE); box(c, cx + 14, by - 3, 3, 3, LITE); box(c, cx + 15, by - 22, 2, 6, LITE); box(c, cx + 11, by - 22, 5, 2, LITE); box(c, cx - 18, by - 15, 36, 3, W); }
  }
  // A level balance with words on each pan, for "8 + 5 = ? + 7".
  const scaleFig = (L, R) => ({ size: [164, 46], fig: (c, w, h) => {
    const cx = Math.round(w / 2), py = 8;
    box(c, cx - 1, py, 3, h - py - 5, '#a07850'); box(c, cx - 16, h - 5, 33, 3, '#a07850'); line(c, cx - 50, py, cx + 50, py, INK); line(c, cx - 50, py + 1, cx + 50, py + 1, INK);
    for (const [ex, s] of [[cx - 50, L], [cx + 50, R]]) { line(c, ex, py + 2, ex - 28, py + 24, LITE); line(c, ex, py + 2, ex + 28, py + 24, LITE); box(c, ex - 30, py + 24, 61, 2, LITE); label(c, s, ex, py + 18, HOT); }
    disc(c, cx, py, 2, HOT);
  } });

  function ordinalQ(gr, d) {
    const n = gr === 0 ? randInt(4, 5) : randInt(6, 9), row = pickN(ICONS, n), k = randInt(1, n), fromEnd = gr === 2 && d >= 3 && rand() < .4;
    const place = fromEnd ? n - k + 1 : k, s = n <= 6 ? 2 : 1, P = s === 2 ? 22 : 15, w = 18 + n * P - (P - 9 * s), where = fromEnd ? 'from the end of the line' : 'in line';
    const pic = { size: [Math.max(80, w + 8), s === 2 ? 32 : 26], fig: (c, W, H) => {
      const x0 = Math.round((W - w) / 2), by = H - 3;
      box(c, x0 + 2, by - 22, 1, 22, LITE); fillPoly(c, [[x0 + 3, by - 22], [x0 + 12, by - 18], [x0 + 3, by - 14]], RED); box(c, x0, by, w, 1, DIM);
      row.forEach((nm, i) => icon(c, nm, x0 + 18 + i * P, by - 9 * s, s));
    } };
    const count = fromEnd ? 'Count from the far end of the line.' : 'Count from the flag: first, second, third and on.';
    if (rand() < .5) return { topic: 'ORDINAL NUMBERS', text: `The line starts at the flag. What place is the ${row[k - 1]} ${where}?`,
      ...nums(place, [place + 1, place - 1, n - place + 1], ORD, 1), steps: [count, `The ${row[k - 1]} is number ${place}.`, `So it is ${ORD(place)}: ${ORDW[place]}.`], ...pic };
    const nb = [k - 2, k, n - k].filter(i => i >= 0 && i < n && i !== k - 1).map(i => row[i]);
    return { topic: 'ORDINAL NUMBERS', text: `The line starts at the flag. Which one is ${ORD(place)} ${where}?`, say: `The line starts at the flag. Which one is ${ORDW[place]} ${where}?`,
      ...opts(row[k - 1], [...nb, ...shuffle(row.slice())]), steps: [count, `Number ${place} is the ${row[k - 1]}.`, `The ${row[k - 1]} is ${ORD(place)}.`], ...pic };
  }

  function patternQ(gr, d) {
    const f = gr === 0 ? 'repeat' : pick(gr === 1 ? ['repeat', 'repeat', 'number'] : ['repeat', 'number', 'grow', 'rule']);
    if (f === 'repeat') {
      const unit = pick(gr === 0 ? ['AB', 'AB', 'AAB', 'ABC'] : gr === 1 ? ['AB', 'AAB', 'ABB', 'ABC'] : ['AAB', 'ABB', 'ABC', 'AABB', 'ABCD']), syms = pickN(ICONS, new Set(unit).size);
      const len = gr === 0 ? Math.max(4, unit.length * 2) : Math.min(10, unit.length * 2 + randInt(1, unit.length)), at = i => syms[unit.charCodeAt(i % unit.length) - 65];
      const seq = range(0, len - 1).map(at), ans = at(len), s = (len + 1) * 22 + 8 <= 168 ? 2 : 1, P = 11 * s, w = (len + 1) * P - 2 * s;
      return { topic: 'PATTERNS', text: 'What comes next in the pattern?', ...opts(ans, [...syms, ...pickN(ICONS.filter(x => !syms.includes(x)), 3)]),
        steps: [`The part that repeats: ${range(0, unit.length - 1).map(at).join(', ')}.`, `It goes on: after ${seq[len - 1]} comes ${ans}.`],
        size: [Math.max(60, w + 10), 9 * s + 12], fig: (c, W, H) => {
          const x0 = Math.round((W - w) / 2), y = Math.round((H - 9 * s) / 2);
          seq.forEach((nm, i) => icon(c, nm, x0 + i * P, y, s)); qbox(c, x0 + len * P + Math.round(4 * s), y + Math.round(4.5 * s));
        } };
    }
    if (f === 'number' || f === 'rule') {
      const back = gr === 2 && rand() < .35, k = gr === 1 ? pick([1, 2, 5, 10]) : pick([2, 3, 4, 5, 10, randInt(6, 9)]), a = back ? randInt(4 * k + 1, 4 * k + 60) : randInt(0, gr === 1 ? 20 : 60);
      const seq = range(0, 4).map(i => back ? a - i * k : a + i * k), ans = seq[4], shown = seq.slice(0, 4), sg = back ? -1 : 1;
      if (f === 'number') return { topic: 'PATTERNS', text: 'What number comes next in the pattern?', ...nums(ans, [ans + sg, ans - sg, seq[3], ans + sg * k, ans - 2 * sg * k]),
        steps: [`Each number is ${k} ${back ? 'less' : 'more'} than the one before.`, `${shown.join(', ')}, ${ans}`], ...tiles([...shown, null]) };
      const op = back ? 'subtract' : 'add', other = back ? 'add' : 'subtract', rule = `${op} ${k}`;
      return { topic: 'PATTERNS', text: `What is the rule? ${shown.join(', ')}`, say: `What is the rule for the numbers ${shown.join(', ')}?`,
        ...opts(rule, [`${other} ${k}`, `${op} ${k + 1}`, `${op} ${2 * k}`, ...(k > 1 ? [`${op} ${k - 1}`] : []), `${other} ${k + 1}`]),
        steps: [`${shown[0]} to ${shown[1]}: ${back ? 'down' : 'up'} ${k}.`, `It keeps going ${back ? 'down' : 'up'} by ${k}.`, `The rule is ${rule}.`] };
    }
    const a = randInt(1, 3), k = randInt(1, 3), cnt = range(0, 3).map(i => a + i * k), ans = a + 4 * k;
    return { topic: 'PATTERNS', text: 'The pattern grows the same way each time. How many dots will the next one have?', ...nums(ans, [cnt[3] + 1, cnt[3], ans + k, ans + 1, ans - 1]),
      steps: [`The dots go ${cnt.join(', ')}: ${k} more each time.`, `${cnt[3]} + ${k} = ${ans}`],
      size: [150, 56], fig: (c, w, h) => { cnt.forEach((n, i) => { for (let j = 0; j < n; j++) disc(c, 14 + i * 30 + (j % 2) * 7, h - 6 - Math.floor(j / 2) * 7, 2, BLU); }); qbox(c, 140, h - 12); } };
  }

  const SEASONS = ['winter', 'spring', 'summer', 'fall'];
  function calendarQ(gr, d) {
    const fs = gr === 0 ? ['dayAfter', 'dayBefore', 'week', 'tomorrow'] : gr === 1 ? ['dayAfter', 'dayBefore', 'monthAfter', 'week', 'year', 'later', 'season']
      : ['later', 'monthAfter', 'monthsLater', 'monthDays', 'season', 'season2', 'dayBefore'];
    const f = pick(fs), i = randInt(0, 6), mi = randInt(0, 11), dayOpts = j => opts(wrapAt(DAYS, j), [wrapAt(DAYS, j - 2), wrapAt(DAYS, j + 1), wrapAt(DAYS, j - 1), wrapAt(DAYS, i)]);
    const monOpts = j => opts(wrapAt(MONTHS, j), [wrapAt(MONTHS, j + 1), wrapAt(MONTHS, j - 1), wrapAt(MONTHS, j - 2), wrapAt(MONTHS, j + 2)]);
    const wk = 'Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.';
    if (f === 'dayAfter') return { topic: 'CALENDAR', text: `What day comes right after ${DAYS[i]}?`, ...dayOpts(i + 1), steps: ['The days go in order:', wk, `After ${DAYS[i]} comes ${wrapAt(DAYS, i + 1)}.`] };
    if (f === 'dayBefore') return { topic: 'CALENDAR', text: `What day comes right before ${DAYS[i]}?`, ...dayOpts(i - 1), steps: ['The days go in order:', wk, `Before ${DAYS[i]} comes ${wrapAt(DAYS, i - 1)}.`] };
    if (f === 'tomorrow') return { topic: 'CALENDAR', text: `Today is ${DAYS[i]}. What day will tomorrow be?`, ...dayOpts(i + 1), steps: ['Tomorrow is the next day.', `After ${DAYS[i]} comes ${wrapAt(DAYS, i + 1)}.`] };
    if (f === 'week') return { topic: 'CALENDAR', text: 'How many days are in one week?', ...nums(7, [5, 6, 10, 12], String, 1), steps: [wk, 'That is 7 days.'] };
    if (f === 'year') return { topic: 'CALENDAR', text: 'How many months are in one year?', ...nums(12, [7, 10, 11, 30], String, 1), steps: ['January to December.', 'That is 12 months.'] };
    if (f === 'later') { const k = randInt(2, 5); return { topic: 'CALENDAR', text: `Today is ${DAYS[i]}. What day will it be in ${k} days?`, ...dayOpts(i + k), steps: [`Count on ${k} days from ${DAYS[i]}.`, range(1, k).map(j => wrapAt(DAYS, i + j)).join(', ') + '.', `In ${k} days it will be ${wrapAt(DAYS, i + k)}.`] }; }
    if (f === 'monthAfter') return { topic: 'CALENDAR', text: `What month comes right after ${MONTHS[mi]}?`, ...monOpts(mi + 1), steps: ['The months go January, February, March, and on to December.', `After ${MONTHS[mi]} comes ${wrapAt(MONTHS, mi + 1)}.`] };
    if (f === 'monthsLater') { const k = randInt(2, 4); return { topic: 'CALENDAR', text: `What month is ${k} months after ${MONTHS[mi]}?`, ...monOpts(mi + k), steps: [`Count on ${k} months from ${MONTHS[mi]}.`, range(1, k).map(j => wrapAt(MONTHS, mi + j)).join(', ') + '.', `It is ${wrapAt(MONTHS, mi + k)}.`] }; }
    if (f === 'monthDays') { const m = pick([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), n = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m]; return { topic: 'CALENDAR', text: `How many days are in ${MONTHS[m]}?`, ...nums(n, [n === 31 ? 30 : 31, 28, 7, 12]), steps: ['30 days have September, April, June and November.', `All the rest have 31, but February has 28 or 29.`, `${MONTHS[m]} has ${n} days.`] }; }
    const s = randInt(0, 3);
    if (f === 'season') return { topic: 'SEASONS', text: `Which season comes right after ${SEASONS[s]}?`, ...opts(wrapAt(SEASONS, s + 1), SEASONS), steps: ['The seasons go winter, spring, summer, fall.', `After ${SEASONS[s]} comes ${wrapAt(SEASONS, s + 1)}.`] };
    const Q = pick([['In which season is it usually hottest?', 'summer'], ['In which season do leaves fall off the trees?', 'fall'], ['In which season does it usually snow?', 'winter'], ['In which season do flowers start to grow?', 'spring']]);
    return { topic: 'SEASONS', text: Q[0], ...opts(Q[1], SEASONS), steps: ['Winter is cold. Spring brings flowers. Summer is hot. In fall, leaves drop.', `The answer is ${Q[1]}.`] };
  }

  function calendarPageQ(gr, d) {
    const y = pick([2026, 2027]), m = randInt(0, 11), { first, days } = monthInfo(y, m), M = MONTHS[m], f = pick(gr === 1 ? ['weekday', 'firstDay', 'next'] : ['weekday', 'weekLater', 'count', 'nth']);
    const wd = dd => DAYS[(first + dd - 1) % 7], fmt = v => `${M} ${v}`, pic = { size: [160, 86], fig: (c, w) => calPage(c, w, y, m) };
    const look = 'Find the date on the calendar, then look up to the top of its column.';
    if (f === 'weekday') { const dd = randInt(1, days), j = DAYS.indexOf(wd(dd)); return { topic: 'CALENDAR', text: `What day of the week is ${M} ${dd}?`, ...opts(DAYS[j], [wrapAt(DAYS, j + 1), wrapAt(DAYS, j - 1), wrapAt(DAYS, j + 2)]), steps: [look, `${M} ${dd} is a ${DAYS[j]}.`], ...pic }; }
    if (f === 'next') { const dd = randInt(1, days - 1); return { topic: 'CALENDAR', text: `What is the date the day after ${M} ${dd}?`, ...nums(dd + 1, [dd - 1, dd + 7, dd + 2], fmt, 1), steps: ['The day after is the next square.', `${M} ${dd} + 1 day = ${M} ${dd + 1}.`], ...pic }; }
    const w = randInt(0, 6), d1 = 1 + (w - first + 7) % 7;
    if (f === 'firstDay') return { topic: 'CALENDAR', text: `What is the date of the first ${DAYS[w]} in ${M}?`, ...nums(d1, [d1 + 7, d1 + 1, d1 - 1], fmt, 1), steps: [`Find the ${DAYS[w]} column: ${DAYS[w][0]}.`, `The first date in it is ${d1}.`], ...pic };
    if (f === 'weekLater') { const dd = randInt(1, days - 7); return { topic: 'CALENDAR', text: `What date is 1 week after ${M} ${dd}?`, ...nums(dd + 7, [dd + 1, dd + 6, dd + 8, dd + 14], fmt, 1), steps: ['A week is 7 days: the square right below.', `${dd} + 7 = ${dd + 7}`, `${M} ${dd + 7}`], ...pic }; }
    if (f === 'count') { const n = Math.floor((days - d1) / 7) + 1; return { topic: 'CALENDAR', text: `How many ${DAYS[w]}s are in ${M} ${y}?`, ...nums(n, [n === 5 ? 4 : 5, 3, 6, 7], String, 1), steps: [`Count down the ${DAYS[w]} column.`, `${range(0, n - 1).map(i => d1 + 7 * i).join(', ')}: ${n} of them.`], ...pic }; }
    const k = randInt(2, 4), dk = d1 + 7 * (k - 1);
    return { topic: 'CALENDAR', text: `What is the date of the ${ORDW[k]} ${DAYS[w]} in ${M}?`, ...nums(dk, [dk + 7, dk - 7, dk + 1, dk - 1], fmt, 1), steps: [`The ${DAYS[w]}s are ${d1}, ${d1 + 7}, ${d1 + 14} and on.`, `The ${ORDW[k]} one is ${M} ${dk}.`], ...pic };
  }

  const WEATHER = [
    ['build a snowman', 25, [65, 80, 95]], ['swim in a pool outside', 90, [20, 35, 50]], ['wear a light jacket', 55, [10, 95, 105]],
    ['go sledding', 20, [60, 75, 90]], ['play at the beach', 92, [15, 30, 45]], ['drink hot cocoa by the fire', 30, [80, 90, 100]],
  ];
  function thermometerQ(gr, d) {
    if (gr === 1 && rand() < .55) {
      const [hot, cold] = [randInt(7, 9) * 10, randInt(1, 4) * 10], hotFirst = rand() < .5, askHot = rand() < .5, vals = hotFirst ? [hot, cold] : [cold, hot], right = (askHot === hotFirst) ? '1' : '2';
      return { topic: 'TEMPERATURE', text: `Which thermometer shows a ${askHot ? 'hotter' : 'colder'} day?`, ...opts(right, ['1', '2', 'they are the same', "can't tell"]),
        steps: [`The red line is higher when it is hotter.`, `Thermometer 1 shows ${vals[0]}°F. Thermometer 2 shows ${vals[1]}°F.`, `Thermometer ${right} is ${askHot ? 'hotter' : 'colder'}.`],
        size: [124, 96], fig: (c, w, h) => { [0, 1].forEach(i => { thermo(c, 34 + i * 60, h, 0, 100, 10, vals[i], 20); label(c, String(i + 1), 46 + i * 60, h - 8, HOT); }); } };
    }
    if (gr === 1 || rand() < .4) {
      const [act, t, wr] = pick(WEATHER), f = v => `${v}°F`;
      return { topic: 'TEMPERATURE', text: `Which temperature is best to ${act}?`, ...opts(f(t), wr.map(f)), say: `Which temperature is best to ${act}? The numbers are in degrees.`,
        steps: ['Under 40 degrees is cold. Over 80 degrees is hot.', `To ${act}, ${t}°F fits best.`] };
    }
    const tick = [0, 10, 5, 2, 2][d], lo = 10 * randInt(0, 5), v = lo + tick * randInt(1, 50 / tick - 1);
    return { topic: 'TEMPERATURE', text: 'What temperature does the thermometer show?', say: 'What temperature does the thermometer show, in degrees?',
      ...nums(v, [v + tick, v - tick, v + 10, v - 10, v + 2 * tick], x => `${x}°F`), steps: [`Each small mark is ${tick} degrees.`, `The red line stops at ${v}.`, `It is ${v}°F.`],
      size: [64, 96], fig: (c, w, h) => thermo(c, 36, h, lo, lo + 50, tick, v) };
  }

  function probabilityQ(gr, d) {
    const [P] = kids(1), spin = gr === 2 && rand() < .5, N = spin ? pick([4, 6, 8]) : randInt(6, 10), cs = pickN(Object.keys(CNAME), 3);
    const pic = cols => spin ? { size: [70, 70], fig: c => spinner(c, 35, 38, 28, cols) } : { size: [80, 60], fig: (c, w, h) => jar(c, w / 2, h - 3, cols) };
    const how = spin ? 'the spinner lands on' : `${P.n} picks without looking, gets`, what = spin ? 'Spin the spinner.' : `${P.n} picks a marble without looking.`;
    if (rand() < .6) {
      const kind = pick(gr === 1 && d <= 2 ? ['certain', 'impossible', 'certain', 'impossible', 'likely'] : ['certain', 'likely', 'unlikely', 'impossible']), t = cs[0];
      const k = { certain: N, impossible: 0, likely: N - pick([1, 2]), unlikely: pick([1, N >= 8 ? 2 : 1]) }[kind];
      const cols = shuffle([...Array(k).fill(t), ...range(1, N - k).map(i => cs[1 + (i % 2)])]);
      const why = { certain: `Every one is ${t}. It has to happen.`, impossible: `None of them are ${t}. It cannot happen.`, likely: `${k} of ${N} are ${t}: most of them.`, unlikely: `Only ${k} of ${N} ${v1(k, 'is', 'are')} ${t}.` }[kind];
      return { topic: 'CHANCE', text: `${what} How likely is it to be ${t}?`, ...opts(kind, ['certain', 'likely', 'unlikely', 'impossible']), steps: [why, `So it is ${kind}.`], ...pic(cols) };
    }
    const most = spin || rand() < .55, used = spin ? cs : pickN(Object.keys(CNAME), 4);
    const cnt = spin ? shuffle(N === 4 ? [2, 1, 1] : N === 6 ? [3, 2, 1] : [5, 2, 1]) : shuffle([4, 3, 2, 1]);
    const cols = shuffle(used.flatMap((col, i) => Array(cnt[i]).fill(col))), best = used[cnt.indexOf(most ? Math.max(...cnt) : Math.min(...cnt))];
    return { topic: 'CHANCE', text: `${what} Which color is it ${most ? 'most' : 'least'} likely to be?`, ...opts(best, [...used, ...Object.keys(CNAME)]),
      steps: [`Count each color: ${used.map((col, i) => `${col} ${cnt[i]}`).join(', ')}.`, `The ${most ? 'most' : 'fewest'} is ${best}, so it is ${most ? 'most' : 'least'} likely.`], ...pic(cols) };
  }

  // Shapes for symmetry, centred on (0, 0), and which lines through them fold into matching halves.
  const HEART = [[0, -6], [-4, -11], [-10, -12], [-14, -7], [-13, 0], [0, 13], [13, 0], [14, -7], [10, -12], [4, -11]];
  const SYM = {
    rectangle: [[[-16, -10], [16, -10], [16, 10], [-16, 10]], 'vh'], square: [[[-12, -12], [12, -12], [12, 12], [-12, 12]], 'vhd'],
    triangle: [[[0, -13], [14, 11], [-14, 11]], 'v'], heart: [HEART, 'v'], house: [[[0, -14], [13, -3], [13, 12], [-13, 12], [-13, -3]], 'v'],
    arrow: [[[0, -14], [12, -2], [5, -2], [5, 13], [-5, 13], [-5, -2], [-12, -2]], 'v'],
    parallelogram: [[[-10, -10], [16, -10], [10, 10], [-16, 10]], ''], scalene: [[[-14, 11], [14, 11], [-12, -13]], ''],
    quad: [[[-15, 12], [-10, -6], [6, -13], [15, 12]], ''], lshape: [[[-12, -12], [-4, -12], [-4, 4], [14, 4], [14, 12], [-12, 12]], ''],
  };
  const SYM_LINE = { v: [0, -17, 0, 17], h: [-19, 0, 19, 0], d: [-15, -15, 15, 15], o: [9, -17, 9, 17] };   // o: off centre, far enough to see
  function symmetryQ(gr, d) {
    const sym = Object.keys(SYM).filter(k => SYM[k][1]), asym = Object.keys(SYM).filter(k => !SYM[k][1]), col = pick(COLS);
    const draw = (c, x, y, [shape, ln]) => { poly(c, SYM[shape][0].map(([a, b]) => [x + a, y + b]), col); if (ln) { const [a, b, e, f] = SYM_LINE[ln]; line(c, x + a, y + b, x + e, y + f, HOT, 2); } };
    if (rand() < .55) {
      const lines = gr === 1 || d <= 2 ? 'vh' : 'vhd', good = pick(sym.flatMap(k => [...SYM[k][1]].filter(l => lines.includes(l)).map(l => [k, l])));
      const bad = shuffle(Object.keys(SYM).flatMap(k => [...lines + 'o'].filter(l => !SYM[k][1].includes(l)).map(l => [k, l]))).slice(0, 3), set = shuffle([good, ...bad]), at = set.indexOf(good);
      return { topic: 'SYMMETRY', text: 'Which dashed line is a line of symmetry?', ...which(at),
        steps: ['A line of symmetry cuts a shape into two halves that match.', 'If you fold on the line, the halves land on each other.', `Shape ${at + 1}: the halves match.`],
        size: [168, 52], fig: (c, w, h) => four(c, w, h, (i, x, y, cw, ch) => draw(c, x + Math.round(cw / 2), y + Math.round(ch / 2), set[i])) };
    }
    const good = pick(sym), set = shuffle([good, ...pickN(asym, 3)]), at = set.indexOf(good);
    return { topic: 'SYMMETRY', text: 'Which shape has a line of symmetry?', ...which(at),
      steps: ['Look for a line that folds the shape into two matching halves.', `Shape ${at + 1}, the ${good}, folds in half down the middle.`],
      size: [168, 52], fig: (c, w, h) => four(c, w, h, (i, x, y, cw, ch) => draw(c, x + Math.round(cw / 2), y + Math.round(ch / 2), [set[i], null])) };
  }

  const FW8 = ',one,two,three,four,five,six,seven,eight'.split(','), FP8 = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['fourth', 'fourths'], 6: ['sixth', 'sixths'], 8: ['eighth', 'eighths'] };
  const fname8 = (k, n) => `${FW8[k]} ${k === 1 ? FP8[n][0] : FP8[n][1]}`;
  function fractionGroupQ(gr, d) {
    const [P, Q] = kids(2);
    if (rand() < .6) {
      const n = pick(gr === 1 ? [2, 4] : d >= 3 ? [2, 3, 4, 6, 8] : [2, 3, 4]), k = randInt(1, n - 1), [cA, cB] = pickN(Object.keys(CNAME), 2), val = k / n;
      const wr = [[n - k, n], ...(gr === 1 ? [2, 3, 4] : [2, 3, 4, 6, 8]).filter(m => m !== n && k < m).map(m => [k, m]), [k + 1, n], [k - 1, n], [1, 2], [1, 3], [1, 4]]
        .filter(([a, b]) => a >= 1 && a < b && Math.abs(a / b - val) > 1e-9).map(([a, b]) => fname8(a, b)).concat([fname8(n, n), 'none of them']);
      const order = d >= 3 ? shuffle(range(0, n - 1)) : range(0, n - 1), w = n * 16;
      return { topic: 'FRACTIONS', text: `What fraction of the balls are ${cA}?`, ...opts(fname8(k, n), wr),
        steps: [`There are ${n} balls. ${k} ${v1(k, 'is', 'are')} ${cA}.`, `${k} out of ${n} equal parts is ${fname8(k, n)}.`],
        size: [Math.max(60, w + 10), 24], fig: (c, W) => { const x0 = Math.round((W - w) / 2) + 8; order.forEach((o, i) => { disc(c, x0 + i * 16, 12, 6, CNAME[o < k ? cA : cB]); disc(c, x0 + i * 16 - 2, 10, 1, '#ffffff'); }); } };
    }
    const n = pick(gr === 1 ? [2, 2, 4] : [2, 3, 4]), each = randInt(2, gr === 1 ? 4 : 5), total = n * each, word = { 2: 'half', 3: 'a third', 4: 'a fourth' }[n], name = pick(ICONS);
    return { topic: 'FRACTIONS', text: `${P.n} has ${total} ${plural(name)}. ${P.He} gives ${word} of them to ${Q.n}. How many does ${P.he} give?`,
      ...nums(each, [total - each, n, each + 1, total], String, 1), steps: [`Split ${total} into ${n} equal groups.`, `Each group has ${each}.`, `${cap(word)} of ${total} is ${each}.`],
      size: [each * 11 + 12, n * 11 + 6], fig: (c, w, h) => { for (let r = 0; r < n; r++) picRows(c, name, each, Math.round((w - (each * 11 - 2)) / 2), 4 + r * 11, 9); } };
  }

  // Solid shapes: flat faces, edges and corners (vertices), the way grade-school books count them.
  const SOL = {
    cube: ['cube', 6, 12, 8, 'square'], box: ['rectangular prism', 6, 12, 8, 'rectangle'], triPrism: ['triangular prism', 5, 9, 6, 'triangle'],
    pyramid: ['square pyramid', 5, 8, 5, 'triangle'], cylinder: ['cylinder', 2, null, 0, 'circle'], cone: ['cone', 1, null, 1, 'circle'], sphere: ['sphere', 0, null, 0, null],
  };
  const FACE_OF = { cube: 'each face', box: 'each long side face', triPrism: 'each end face', pyramid: 'each side face', cylinder: 'each flat face', cone: 'the flat face' };
  function solidsQ(gr, d) {
    const keys = gr === 1 ? ['cube', 'box', 'pyramid', 'cylinder', 'cone', 'sphere'] : Object.keys(SOL), col = pick(COLS);
    const f = pick(gr === 1 ? ['faces', 'face', 'roll', 'roll'] : ['count', 'count', 'which', 'face', 'roll']);
    const one = k => ({ size: [76, 64], fig: c => solid(c, k, 38, 34, 48, col) });
    if (f === 'faces' || f === 'count') {
      const k = pick(keys.filter(x => x !== 'sphere' || f === 'faces')), [name, fc, ed, vx] = SOL[k];
      const what = f === 'faces' ? 'faces' : pick(ed == null ? ['faces', 'vertices'] : ['faces', 'edges', 'vertices']), n = { faces: fc, edges: ed, vertices: vx }[what];
      const word = what === 'faces' ? 'flat faces' : what === 'vertices' ? 'vertices (corners)' : 'edges';
      return { topic: 'SOLID SHAPES', text: `How many ${word} does this ${name} have?`, ...(what === 'vertices' ? { say: `How many vertices, or corners, does this ${name} have?` } : {}),
        ...nums(n, [fc, ed, vx, n + 1, n - 1, Math.ceil(n / 2)].filter(v => v != null && v !== n)), steps: [`Count the hidden ones too, at the back and bottom.`, `A ${name} has ${fc} flat faces${ed != null ? `, ${ed} edges` : ''} and ${vx} vertices.`], ...one(k) };
    }
    if (f === 'face') {
      const k = pick(keys.filter(x => SOL[x][4])), [name, , , , shp] = SOL[k];
      return { topic: 'SOLID SHAPES', text: `What shape is ${FACE_OF[k]} of a ${name}?`, ...opts(shp, ['square', 'rectangle', 'triangle', 'circle', 'hexagon'].filter(s => !(shp === 'square' && s === 'rectangle'))),
        steps: [`Look at the flat parts of the ${name}.`, `${cap(FACE_OF[k])} is a ${shp}.`], ...one(k) };
    }
    if (f === 'which') {
      const k = pick(['triPrism', 'pyramid', 'cylinder', 'cone', 'sphere']), [name, fc, , vx] = SOL[k];
      return { topic: 'SOLID SHAPES', text: `Which solid has ${fc} flat ${v1(fc, 'face', 'faces')} and ${vx} ${v1(vx, 'vertex', 'vertices')}?`,
        ...opts(name, shuffle(keys.map(x => SOL[x][0]))), steps: ['Count the flat faces and the corners of each solid.', `A ${name} has ${fc} flat ${v1(fc, 'face', 'faces')} and ${vx} ${v1(vx, 'vertex', 'vertices')}.`] };
    }
    const canRoll = rand() < .6, curved = ['cylinder', 'cone', 'sphere'], flatOnes = keys.filter(x => !curved.includes(x));
    const odd = pick(canRoll ? curved : flatOnes), set = shuffle([odd, ...pickN(canRoll ? flatOnes : curved, 3)]), at = set.indexOf(odd), cs = set.map(() => pick(COLS));
    return { topic: 'SOLID SHAPES', text: `Which solid can ${canRoll ? '' : 'NOT '}roll?`, ...which(at),
      steps: ['A curved surface can roll. Flat faces only slide or stack.', `Shape ${at + 1}, the ${SOL[odd][0]}, ${canRoll ? 'has a curved surface' : 'has only flat faces'}.`],
      size: [168, 48], fig: (c, w, h) => four(c, w, h, (i, x, y, cw, ch) => solid(c, set[i], x + Math.round(cw / 2), y + Math.round(ch / 2), 30, cs[i])) };
  }

  function inOutQ(gr, d) {
    const add = rand() < .6, k = gr === 1 ? randInt(1, 5) : d <= 2 ? randInt(2, 9) : pick([5, 10, 20, randInt(11, 25)]), top = gr === 1 ? 20 : 100;
    const ins = pickN(range(add ? 0 : k, add ? top - k : top), 4).sort((a, b) => a - b), outs = ins.map(v => add ? v + k : v - k), sg = add ? '+' : '-';
    const f = pick(gr === 1 ? ['out', 'out', 'rule'] : ['out', 'rule', ...(d >= 3 ? ['in'] : [])]), rule = `${add ? 'add' : 'subtract'} ${k}`;
    const rows = [['IN', 'OUT'], ...ins.map((v, i) => [i === 3 && f === 'in' ? '?' : v, i === 3 && f === 'out' ? '?' : outs[i]])];
    const pic = { size: [72, 64], fig: c => table(c, 6, 2, [30, 30], rows) };
    const steps = [`Each row: ${ins[0]} ${sg} ${k} = ${outs[0]}, ${ins[1]} ${sg} ${k} = ${outs[1]}.`, `The rule is ${rule}.`];
    if (f === 'rule') return { topic: 'IN AND OUT', text: 'What is the rule for this table?', ...opts(rule, [`${add ? 'subtract' : 'add'} ${k}`, `add ${k + 1}`, `subtract ${k + 1}`, ...(k > 1 ? [`add ${k - 1}`, `subtract ${k - 1}`] : [])]), steps, ...pic };
    const ans = f === 'out' ? outs[3] : ins[3], other = f === 'out' ? (add ? ins[3] - k : ins[3] + k) : (add ? outs[3] + k : outs[3] - k);
    return { topic: 'IN AND OUT', text: 'The table follows a rule. What number goes in the ? box?', say: 'The table follows a rule. What number goes in the empty box?',
      ...nums(ans, [other, ans + 1, ans - 1, ans + k, ans - k]), steps: [...steps, f === 'out' ? `${ins[3]} ${sg} ${k} = ${outs[3]}` : `${ins[3]} ${sg} ${k} = ${outs[3]}, so the IN is ${ins[3]}.`], ...pic };
  }

  const CONTESTS = [['cans', 'collected'], ['points', 'scored'], ['pages', 'read'], ['stickers', 'saved'], ['jumps', 'made']];
  function greatestLeastQ(gr, d) {
    const [what, verb] = pick(CONTESTS), ks = kids(4), most = rand() < .5;
    let vals;
    if (gr === 1) { const t = randInt(2, 8); vals = d === 1 ? pickN(range(1, 9), 4).map(x => 10 * x + randInt(0, 9)) : pickN(range(0, 9), 4).map((o, i) => 10 * (i < 2 ? t : t + pick([-1, 1])) + o); }
    else if (d === 1) vals = pickN(range(1, 9), 4).map(x => 100 * x + randInt(0, 99));
    else { const [x, y, z] = pickN(range(1, 9), 3); vals = pickN([[x, y, z], [x, z, y], [y, x, z], [y, z, x], [z, x, y], [z, y, x]], 4).map(p => 100 * p[0] + 10 * p[1] + p[2]); }
    if (new Set(vals).size < 4) vals = vals.map((v, i) => v + i);
    const best = most ? Math.max(...vals) : Math.min(...vals), win = ks[vals.indexOf(best)].n, order = vals.map((v, i) => [v, ks[i].n]).sort((a, b) => a[0] - b[0]);
    return { topic: 'GREATEST, LEAST', text: `The table shows how many ${what} each kid ${verb}. Who ${verb} the ${most ? 'most' : 'fewest'}?`, ...opts(win, ks.map(k => k.n)),
      steps: [gr === 1 ? 'Compare the tens first, then the ones.' : 'Compare hundreds, then tens, then ones.', `Least to most: ${order.map(o => o[0]).join(', ')}.`, `${win} ${verb} the ${most ? 'most' : 'fewest'}: ${best}.`],
      size: [96, 62], fig: c => table(c, 4, 1, [44, 44], [['KID', 'HOW MANY'], ...ks.map((k, i) => [k.n, vals[i]])]) };
  }

  function balanceQ(gr, d) {
    const f = pick(gr === 1 ? ['balance', 'balance', 'sign'] : ['balance', 'sign', ...(d >= 3 ? ['signs2', 'signs2'] : [])]), top = gr === 1 ? (d <= 2 ? 10 : 20) : d <= 2 ? 20 : 99;
    if (f === 'balance') {
      const s = randInt(gr === 1 ? 5 : 10, top), a = randInt(1, s - 1), b = s - a, c3 = pick(range(1, s - 1).filter(v => v !== a && v !== b).concat([a])), ans = s - c3, front = rand() < .5;
      const R = front ? `? + ${c3}` : `${c3} + ?`;
      return { topic: 'BALANCE', text: `${a} + ${b} = ${R}`, say: `${a} plus ${b} equals ${front ? `what number plus ${c3}` : `${c3} plus what number`}?`,
        ...nums(ans, [s, s + c3, ans + 1, ans - 1, Math.abs(c3 - a)]), steps: [`The left side is ${a} + ${b} = ${s}.`, `The right side must make ${s} too.`, `${s} - ${c3} = ${ans}, so ? = ${ans}.`], ...scaleFig(`${a} + ${b}`, R) };
    }
    if (f === 'sign') {
      const x = randInt(gr === 1 ? 3 : 8, top), y = randInt(1, Math.min(x - 1, gr === 1 ? 9 : 40)), plus = rand() < .5, z = plus ? x + y : x - y, sg = plus ? '+' : '-';
      return { topic: 'WHICH SIGN?', text: `Which sign makes it true? ${x} _ ${y} = ${z}`, say: `Which sign goes in the blank? ${x}, blank, ${y}, equals ${z}.`,
        ...opts(sg, ['+', '-', 'either one', 'neither one']), steps: [`Try +: ${x} + ${y} = ${x + y}.`, `Try -: ${x} - ${y} = ${x - y}.`, `So it is ${x} ${sg} ${y} = ${z}.`] };
    }
    let a, b, c3, combo, r;
    for (let i = 0; i < 20; i++) {
      a = randInt(20, 60); [b, c3] = pickN(range(2, 19), 2); combo = pick([[1, 1], [1, -1], [-1, 1], [-1, -1]]); r = a + combo[0] * b + combo[1] * c3;
      if (r >= 0) break;
    }
    const S = s => s > 0 ? '+' : '-', right = `${S(combo[0])} and ${S(combo[1])}`;
    return { topic: 'WHICH SIGN?', text: `Which signs make it true? ${a} _ ${b} _ ${c3} = ${r}`, say: `Which two signs go in the blanks? ${a}, blank, ${b}, blank, ${c3}, equals ${r}.`,
      ...opts(right, ['+ and +', '+ and -', '- and +', '- and -']), steps: ['Try the signs one way at a time.', `${a} ${S(combo[0])} ${b} = ${a + combo[0] * b}.`, `${a + combo[0] * b} ${S(combo[1])} ${c3} = ${r}`] };
  }

  // A handful of coins under `cap`, biggest first, no wider than one row of the picture.
  function coinSet(types, n, cap, maxW = 120) {
    let s = [];
    for (let i = 0; i < 30; i++) { s = range(1, n).map(() => pick(types)).sort((a, b) => COIN[b].v - COIN[a].v); if (worth(s) <= cap && rowW(s) <= maxW) break; }
    return s;
  }
  const runOf = items => { let acc = 0; return items.map(k => acc += COIN[k].v).join(', '); };
  function moneyCompareQ(gr, d) {
    const types = gr === 1 ? ['d', 'n', 'p'] : ['q', 'd', 'n', 'p'], [P, Q] = kids(2), trick = rand() < .5;
    let A, B;
    for (let i = 0; i < 40; i++) {
      A = coinSet(types, randInt(3, 5), 99, 116); B = coinSet(types, randInt(2, 4), 99, 116);
      if (worth(A) !== worth(B) && (!trick || (A.length > B.length && worth(A) < worth(B)))) break;
    }
    if (worth(A) === worth(B)) B = B.concat(['p']);
    const vA = worth(A), vB = worth(B), big = vA > vB ? P : Q, small = big === P ? Q : P, diff = Math.abs(vA - vB);
    const pic = { size: [168, 74], fig: c => [[P, A], [Q, B]].forEach(([K, S], j) => { Font.draw(c, K.n, 3, 9 + j * 37, INK); coinRow(c, 104, 13 + j * 37, S); }) };
    const steps = [`${P.n}: ${runOf(A)}. That is ${money(vA)}.`, `${Q.n}: ${runOf(B)}. That is ${money(vB)}.`, A.length > B.length && vA < vB || B.length > A.length && vB < vA ? `More coins is not always more money. ${big.n} has more.` : `${big.n} has more.`];
    if (gr === 2 && d >= 3 && rand() < .45) return { topic: 'MONEY', text: `How much more money does ${big.n} have than ${small.n}?`, ...nums(diff, [vA + vB, diff + 5, diff - 5, diff + 10], money, 1), steps: [steps[0], steps[1], `${money(Math.max(vA, vB))} - ${money(Math.min(vA, vB))} = ${money(diff)}`], ...pic };
    return { topic: 'MONEY', text: 'Who has more money?', ...opts(big.n, [P.n, Q.n, 'they have the same', "can't tell"]), steps, ...pic };
  }
  function moneyEnoughQ(gr, d) {
    const types = gr === 1 ? ['d', 'n', 'p'] : ['q', 'd', 'n', 'p'], [P] = kids(1), S = coinSet(types, randInt(2, 5), 99, 118), v = worth(S), item = pick(SHOP)[0];
    const price = Math.max(5, v + pick([-15, -10, -5, 0, 5, 10]) + (gr === 2 && d >= 3 ? randInt(-3, 3) : 0)), gap = Math.abs(v - price), he = P.he;
    const right = v > price ? `yes, with ${gap}¢ left` : v === price ? 'yes, with no money left' : `no, ${he} needs ${gap}¢ more`;
    const wrongs = v > price ? [`no, ${he} needs ${gap}¢ more`, `yes, with ${gap + 5}¢ left`, `no, ${he} needs 5¢ more`, 'yes, with no money left']
      : v === price ? ['yes, with 5¢ left', `no, ${he} needs 5¢ more`, `no, ${he} needs 10¢ more`] : [`yes, with ${gap}¢ left`, `no, ${he} needs ${gap + 5}¢ more`, 'yes, with no money left', `yes, with 5¢ left`];
    const text = `${P.n} has these coins. Can ${he} buy the ${item} for ${price}¢?`;
    return { topic: 'MONEY', text, say: sayMoney(text), ...opts(right, wrongs),
      steps: [`Count the coins: ${runOf(S)}. That is ${money(v)}.`, `The ${item} costs ${price}¢.`, v >= price ? `${v}¢ - ${price}¢ = ${gap}¢ left.` : `${price}¢ - ${v}¢ = ${gap}¢ short.`],
      size: [168, 38], fig: c => { coinRow(c, 64, 13, S); tag(c, 130, 7, `${price}¢`); } };
  }

  const HEAVY_PAIRS = [['a car', 'a bike'], ['an elephant', 'a mouse'], ['a bowling ball', 'a balloon'], ['a watermelon', 'a grape'], ['a backpack of books', 'a pencil'], ['a brick', 'a feather'], ['a horse', 'a cat'], ['a big rock', 'a leaf']];
  function weighQ() {
    const [heavy, light] = pick(HEAVY_PAIRS), hv = rand() < .55, [A, B] = rand() < .5 ? [heavy, light] : [light, heavy];
    return { topic: 'HEAVY OR LIGHT', text: `Which is ${hv ? 'heavier' : 'lighter'}: ${A} or ${B}?`, ...opts(hv ? heavy : light, [A, B, 'they weigh the same', "can't tell"]),
      steps: [`Think about lifting each one.`, `${cap(heavy)} is much heavier than ${light}.`, `So ${hv ? heavy : light} is ${hv ? 'heavier' : 'lighter'}.`] };
  }
  function holdsQ(gr, d) {
    if (gr === 0 || rand() < .5) {
      const [sm, bg] = pickN(range(0, 4), 2).sort((a, b) => a - b).map(i => CONT_ORDER[i]), more = rand() < .55, [L, R] = rand() < .5 ? [sm, bg] : [bg, sm];
      return { topic: 'HOLDS MORE', text: `Which holds ${more ? 'more' : 'less'} water?`, ...opts(`the ${more ? bg : sm}`, [`the ${bg}`, `the ${sm}`, 'they hold the same', "can't tell"]),
        steps: [`The ${bg} is bigger inside than the ${sm}.`, `So the ${more ? bg : sm} holds ${more ? 'more' : 'less'}.`],
        size: [130, 50], fig: (c, w, h) => [L, R].forEach((k, i) => { container(c, k, 35 + i * 60, h - 12); ink(c, k, 35 + i * 60, h - 4, LITE); }) };
    }
    const set = shuffle(pickN(CONT_ORDER, 4)), most = rand() < .55, best = set.slice().sort((a, b) => CONT_ORDER.indexOf(a) - CONT_ORDER.indexOf(b))[most ? 3 : 0];
    return { topic: 'HOLDS MORE', text: `Which holds the ${most ? 'most' : 'least'} water?`, ...opts(best, set),
      steps: ['A bigger inside holds more water.', `From least to most: ${CONT_ORDER.filter(k => set.includes(k)).join(', ')}.`, `The ${best} holds the ${most ? 'most' : 'least'}.`],
      size: [168, 50], fig: (c, w, h) => set.forEach((k, i) => { container(c, k, 21 + i * 42, h - 12); ink(c, k, 21 + i * 42, h - 4, LITE); }) };
  }

  // ======================================================== 2ND GRADE, WIDER
  const W2 = {};
  const SKIPS = [[2, 'wheels', 'bike', 'bikes'], [2, 'eyes', 'owl', 'owls'], [2, 'shoes', 'kid', 'kids'], [5, 'arms', 'starfish', 'starfish'], [5, 'fingers', 'glove', 'gloves'],
    [10, 'legs', 'crab', 'crabs'], [10, 'crayons', 'box', 'boxes'], [100, 'stickers', 'roll', 'rolls']];
  W2.skipStories = d => {
    if (rand() < .6) {
      const [step, things, one, many] = pick(SKIPS.filter(s => s[0] < 100 || d >= 3)), k = randInt(3, d <= 2 ? 6 : 9), ans = step * k;
      return { topic: 'SKIP COUNTING', text: `Each ${one} has ${step} ${things}. How many ${things} do ${k} ${many} have?`, ...nums(ans, [ans + step, ans - step, k + step, ans + 1, ans - 1], comma),
        steps: [`Count by ${step}s, once for each ${one}.`, range(1, k).map(i => comma(step * i)).join(', ') + '.', `${k} ${many} have ${comma(ans)} ${things}.`] };
    }
    const step = pick([2, 5, 10, ...(d >= 2 ? [100] : [])]), back = d >= 3 && rand() < .4, a = step === 100 ? 100 * randInt(0, 4) + 10 * randInt(0, 9) : step * randInt(1, 40), k = randInt(1, 3);
    const seq = range(0, 4).map(i => back ? a + (4 - i) * step : a + i * step), ans = seq[k];
    return { topic: 'SKIP COUNTING', text: `Count by ${step}s${back ? ' backward' : ''}. What number is missing?`, ...nums(ans, [ans + 1, ans - 1, ans + step, ans - step, ans + 10], comma),
      steps: [`Each number is ${step} ${back ? 'less' : 'more'} than the one before.`, seq.map(comma).join(', ')], ...tiles(seq.map((v, i) => i === k ? null : v)) };
  };

  const ROMAN = n => { let s = ''; for (const [v, r] of [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { s += r; n -= v; } return s; };
  const LONG_ROMAN = n => 'X'.repeat(Math.floor(n / 10)) + (n % 10 >= 5 ? 'V' : '') + 'I'.repeat(n % 5);
  const romanParts = n => { const out = []; for (const [v, r] of [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { out.push([r, v]); n -= v; } return out; };
  W2.roman = d => {
    const n = randInt(1, d <= 2 ? 12 : 39), r = ROMAN(n), parts = romanParts(n), sub = /IV|IX/.test(r), spell = s => s.split('').join(' ');
    const rule = ['I is 1, V is 5 and X is 10.', sub ? 'A smaller numeral before a bigger one is taken away: IV is 4, IX is 9.' : 'Add the numerals from left to right.'];
    if (rand() < .5) {
      const addAll = [...r].reduce((a, ch) => a + { I: 1, V: 5, X: 10 }[ch], 0);
      return { topic: 'ROMAN NUMERALS', text: `What number is the Roman numeral ${r}?`, say: `What number is the Roman numeral ${spell(r)}?`, ...nums(n, [addAll, n + 1, n - 1, n + 10, n - 10], String, 1),
        steps: [...rule, `${r} = ${parts.map(p => p[1]).join(' + ')} = ${n}`] };
    }
    const swapped = r.replace(/IV|VI|IX|XI/, m => m[1] + m[0]);
    return { topic: 'ROMAN NUMERALS', text: `Which Roman numeral means ${n}?`, ...opts(r, [LONG_ROMAN(n), swapped, ROMAN(n + 1), ROMAN(n === 1 ? 2 : n - 1), ROMAN(n + 5), ROMAN(n + 10)]),
      steps: [...rule, `${n} = ${parts.map(p => p[1]).join(' + ')}, so ${n} is ${r}.`] };
  };

  W2.balance = d => balanceQ(2, d);

  W2.compareExpr = d => {
    const a = d <= 2 ? randInt(10, 60) : randInt(30, 90), b = randInt(3, d <= 2 ? 9 : 40), plus = rand() < .55 || a - b < 5, lv = plus ? a + b : a - b, L = `${a} ${plus ? '+' : '-'} ${b}`;
    let R = String(Math.max(1, lv + pick([-3, -2, -1, 0, 0, 1, 2, 3]))), rv = +R;
    if (d === 4 && rand() < .5) { const c3 = pick(range(10, 40).filter(v => v !== b)); rv = lv + pick([-2, 0, 2]); R = `${rv + c3} - ${c3}`; }
    const holds = (x, s, y) => s === '<' ? x < y : s === '>' ? x > y : x === y, all = [];
    for (const s of ['<', '>', '=']) { all.push([`${L} ${s} ${R}`, holds(lv, s, rv), 0]); all.push([`${R} ${s} ${L}`, holds(rv, s, lv), 1]); }
    const right = all.find(t => t[1] && !t[2])[0], wrongs = shuffle(all.filter(t => !t[1]).map(t => t[0]));
    const rel = lv < rv ? 'less than' : lv > rv ? 'greater than' : 'equal to';
    return { topic: 'COMPARE', text: 'Which is true?', say: 'Which number sentence is true?', ...opts(right, wrongs),
      steps: [`Work out each side first: ${L} = ${lv}.`, R.includes('-') ? `${R} = ${rv}.` : `The other side is ${rv}.`, `${lv} is ${rel} ${rv}, so ${right}.`] };
  };

  W2.inOut = d => inOutQ(2, d);
  W2.greatestLeast = d => greatestLeastQ(2, d);

  const TOYS = ['ball', 'kite', 'yo-yo', 'robot', 'top', 'car'];
  W2.guessCheck = d => {
    const f = pick(['sumDiff', 'pets', 'prices']), [P] = kids(1);
    if (f === 'prices') {
      let pr, total, pair;
      for (let i = 0; i < 30; i++) {
        pr = pickN(range(d >= 4 ? 11 : 3, d >= 4 ? 45 : 19), 4); const sums = []; for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) sums.push([pr[x] + pr[y], x, y]);
        pair = pick(sums); total = pair[0]; if (sums.filter(s => s[0] === total).length === 1) break;
      }
      const toys = pickN(TOYS, 4), name = (x, y) => `the ${toys[x]} and the ${toys[y]}`, pairs = []; for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) pairs.push([x, y]);
      const text = `${P.n} spent ${total}¢ on two different toys. Which two did ${P.he} buy?`;
      return { topic: 'GUESS AND CHECK', text, say: sayMoney(text), ...opts(name(pair[1], pair[2]), shuffle(pairs.filter(([x, y]) => pr[x] + pr[y] !== total).map(([x, y]) => name(x, y)))),
        steps: ['Guess a pair, add the prices, and check.', `${toys[pair[1]]}: ${pr[pair[1]]}¢, ${toys[pair[2]]}: ${pr[pair[2]]}¢.`, `${pr[pair[1]]} + ${pr[pair[2]]} = ${total}. That works.`],
        size: [168, 40], fig: c => toys.forEach((t, i) => { const x = 4 + i * 41; ink(c, t, x + 18, 6, INK); tag(c, x + 2, 16, `${pr[i]}¢`); }) };
    }
    const top = d >= 4 ? 50 : 20, x = randInt(2, top / 2 - 2), diff = randInt(1, Math.min(9, top - 2 * x)), y = x + diff, s = x + y;
    if (f === 'pets') return { topic: 'GUESS AND CHECK', text: `A pet shop has ${s} cats and dogs. There are ${diff} more dogs than cats. How many dogs are there?`,
      ...nums(y, [x, s - diff, y + 1, y - 1, s], String, 1), steps: ['Guess, then check both clues.', `Try ${x} cats and ${y} dogs: ${x} + ${y} = ${s}.`, `${y} - ${x} = ${diff}. Both clues work: ${y} dogs.`] };
    const pr = (p, q) => `${p} and ${q}`;
    return { topic: 'GUESS AND CHECK', text: `Two numbers add up to ${s}. One is ${diff} more than the other. What are the two numbers?`,
      ...opts(pr(x, y), [pr(x - 1, y + 1), pr(x + 1, y + 1), pr(diff, s - diff), pr(x, y + diff), ...(diff > 1 ? [pr(x + 1, y - 1)] : [])].filter(t => t !== pr(diff, s - diff) || diff !== x)),
      steps: [`Guess pairs that add to ${s}, and check the difference.`, `${x - 1} and ${y + 1}: the difference is ${diff + 2}. Too big.`, `${x} and ${y}: ${x} + ${y} = ${s} and ${y} - ${x} = ${diff}.`] };
  };

  W2.waysToMake = d => {
    const n = randInt(d === 1 ? 21 : 31, 99), f = pick(['add', 'sub', 'tensOnes']);
    if (f === 'add') {
      const a = d === 1 ? 10 * randInt(1, Math.floor(n / 10) - 1) : randInt(11, n - 11), b = n - a, P = (x, y) => `${x} + ${y}`;
      return { topic: 'MAKE A NUMBER', text: `Which is another way to make ${n}?`, ...opts(P(a, b), [P(a, b + 1), P(a + 1, b + 1), P(a + 10, b), P(a, b - 10 >= 0 ? b - 10 : b + 10)]),
        steps: ['Add each one and look for the total.', `${a} + ${b} = ${n}`] };
    }
    if (f === 'sub') {
      const k = randInt(3, d === 1 ? 9 : 40), M = (x, y) => `${x} - ${y}`;
      return { topic: 'MAKE A NUMBER', text: `Which subtraction makes ${n}?`, ...opts(M(n + k, k), [M(n + k, k + 1), M(n + k + 10, k), M(n + k, k + 10), M(n + k - 1, k)]),
        steps: ['Work out each one.', `${n + k} - ${k} = ${n}`] };
    }
    const T = Math.floor(n / 10), O = n % 10, S = (t, o) => `${t} ${v1(t, 'ten', 'tens')}, ${o} ${v1(o, 'one', 'ones')}`;
    return { topic: 'MAKE A NUMBER', text: `Which is the same as ${n}?`, ...opts(S(T - 1, O + 10), [S(T - 1, O), S(T, O + 10), S(T + 1, O), S(T - 1, O + 1)]),
      steps: [`${n} is ${S(T, O)}.`, `Trade 1 ten for 10 ones: ${S(T - 1, O + 10)}.`, `${10 * (T - 1)} + ${O + 10} = ${n}`] };
  };

  W2.placeConvert = d => {
    const f = pick(['hToT', 'hToO', 'tToH', 'mixToT', 'oToH']), H = randInt(2, 9), T = randInt(1, 9);
    const Q = {
      hToT: [`${H} hundreds = how many tens?`, 10 * H, [H, 100 * H, 10 * H + 10], `1 hundred is 10 tens.`, `${H} hundreds is ${H} groups of 10 tens: ${10 * H} tens.`],
      hToO: [`${H} hundreds = how many ones?`, 100 * H, [H, 10 * H, 1000 * H], `1 hundred is 100 ones.`, `${H} hundreds is ${100 * H} ones.`],
      tToH: [`${10 * H} tens = how many hundreds?`, H, [10 * H, 100 * H, H + 10], `10 tens make 1 hundred.`, `${10 * H} tens is ${H} groups of 10 tens: ${H} hundreds.`],
      mixToT: [`${H} hundreds and ${T} tens = how many tens?`, 10 * H + T, [H + T, 100 * H + T, 10 * T + H], `${H} hundreds is ${10 * H} tens.`, `${10 * H} + ${T} = ${10 * H + T} tens.`],
      oToH: [`${100 * H} ones = how many hundreds?`, H, [10 * H, 100 * H, H + 1], `100 ones make 1 hundred.`, `${100 * H} ones is ${H} hundreds.`],
    }[f];
    return { topic: 'PLACE VALUE', text: Q[0], say: Q[0].replace('=', 'equals'), ...nums(Q[1], Q[2], comma, 1), steps: [Q[3], Q[4]] };
  };

  W2.riddle = d => {
    if (rand() < .5) {
      const H = randInt(1, 9), O = randInt(0, 7), rel = pick([[2, '2 more than'], [1, '1 more than'], [0, 'the same as']]), T = O + rel[0], n = 100 * H + 10 * T + O;
      return { topic: 'GUESS THE NUMBER', text: `I have ${H} ${v1(H, 'hundred', 'hundreds')}. My ones digit is ${O}. My tens digit is ${rel[1]} that. What number am I?`,
        ...nums(n, [100 * H + 10 * O + T, 100 * H + T + O, n + 10, n + 1, 100 * O + 10 * T + H], comma), steps: [`Hundreds: ${H}. Ones: ${O}.`, `Tens: ${rel[1]} ${O} is ${T}.`, `The number is ${n}.`] };
    }
    const n = 10 * randInt(2, 9) + randInt(1, 9), lo = n - n % 10, sum = Math.floor(n / 10) + n % 10, even = n % 2 === 0;
    return { topic: 'GUESS THE NUMBER', text: `I am between ${lo} and ${lo + 10}. I am ${even ? 'even' : 'odd'}. My two digits add up to ${sum}. What number am I?`,
      ...nums(n, [n + 2, n - 2, (n % 10) * 10 + Math.floor(n / 10), n + 10, n - 1], String, 1),
      steps: [`Between ${lo} and ${lo + 10}: ${lo + 1} to ${lo + 9}.`, `Its tens digit is ${lo / 10}, so its ones digit is ${sum} - ${lo / 10} = ${n % 10}.`, `${n} is ${even ? 'even' : 'odd'}. It works.`] };
  };

  // Hops on a bare number line: breaking a number apart, or jumping past a ten and back.
  function hopsFig(start, hops) {
    const pts = [start]; hops.forEach(h => pts.push(pts[pts.length - 1] + h));
    const lo = Math.min(...pts), hi = Math.max(...pts);
    return { size: [168, 50], fig: (c, w) => {
      const X = v => Math.round(12 + (v - lo) * (w - 24) / (hi - lo)), y = 36;
      line(c, 4, y, w - 5, y, INK);
      const endX = X(pts[pts.length - 1]);
      pts.forEach((v, i) => { line(c, X(v), y - 2, X(v), y + 2, INK); if (i < pts.length - 1 && Math.abs(X(v) - endX) >= 18) ink(c, v, X(v), y + 9, i ? LITE : INK); });
      qbox(c, X(pts[pts.length - 1]), y + 9);
      hops.forEach((h, i) => { const a = X(pts[i]), b = X(pts[i + 1]), ht = Math.min(16, 4 + Math.abs(b - a) / 5); hop(c, a, b, y, ht, h > 0 ? HOT : BLU); label(c, (h > 0 ? '+' : '') + h, (a + b) / 2, y - ht - 7, h > 0 ? HOT : BLU); });
    } };
  }
  W2.breakApart = d => {
    const f = pick(['add', 'sub', 'comp', 'text']), [P] = kids(1);
    if (f === 'add' || f === 'sub') {
      const add = f === 'add', b = 10 * randInt(1, 3) + randInt(3, 9), a = add ? randInt(15, 99 - b) : randInt(b + 10, 99), t = b - b % 10, o = b % 10, end = add ? a + b : a - b, sg = add ? '+' : '-';
      return { topic: 'BREAK APART', text: `${P.n} finds ${a} ${sg} ${b} by breaking ${b} into ${t} and ${o}. Where does ${P.he} land?`, say: `${P.n} finds ${a} ${add ? 'plus' : 'minus'} ${b} by breaking ${b} into ${t} and ${o}. Where does ${P.he} land?`,
        ...nums(end, [add ? a + t : a - t, end + 10, end - 10, end + 1, end - 1]), steps: [`${a} ${sg} ${t} = ${add ? a + t : a - t}`, `${add ? a + t : a - t} ${sg} ${o} = ${end}`, `So ${a} ${sg} ${b} = ${end}.`], ...hopsFig(a, add ? [t, o] : [-t, -o]) };
    }
    if (f === 'comp') {
      const k = randInt(1, 2), b = 10 * randInt(1, 4) + 10 - k, a = randInt(12, 99 - b), end = a + b;
      return { topic: 'BREAK APART', text: `To add ${a} + ${b}, ${P.n} jumps ${b + k}, then back ${k}. Where does ${P.he} land?`, say: `To add ${a} plus ${b}, ${P.n} jumps ${b + k}, then back ${k}. Where does ${P.he} land?`,
        ...nums(end, [a + b + k, a + b + 2 * k, end - 10, end + 1, end - 2]), steps: [`${b} is ${b + k} take away ${k}.`, `${a} + ${b + k} = ${a + b + k}, then back ${k}: ${end}.`, `So ${a} + ${b} = ${end}.`], ...hopsFig(a, [b + k, -k]) };
    }
    const b = 10 * randInt(1, 4) + randInt(2, 9), a = randInt(b + 10, 99), t = b - b % 10, o = b % 10, mid = a - t, E = (x, s, y, z) => `${x} ${s} ${y} = ${z}`;
    return { topic: 'BREAK APART', text: `To find ${a} - ${b}, ${P.n} takes away ${t} first: ${a} - ${t} = ${mid}. What is the next step?`, say: `To find ${a} minus ${b}, ${P.n} takes away ${t} first, which leaves ${mid}. What is the next step?`,
      ...opts(E(mid, '-', o, mid - o), [E(mid, '+', o, mid + o), E(a, '-', o, a - o), E(mid, '-', 10 - o, mid - 10 + o), E(mid, '-', b, mid - b)]),
      steps: [`${b} is ${t} and ${o}.`, `${t} is gone. Now take away the ${o}: ${mid} - ${o} = ${mid - o}.`, `So ${a} - ${b} = ${mid - o}.`] };
  };

  W2.rounding = d => {
    const to = d <= 2 ? 10 : pick([10, 100]), n = to === 10 ? (d <= 2 ? randInt(11, 99) : randInt(101, 989)) : randInt(101, 949);
    let v = n; if (v % to === 0) v += randInt(1, to - 1);
    const lo = v - v % to, hi = lo + to, ans = v - lo >= to / 2 ? hi : lo, other = ans === lo ? hi : lo;
    return { topic: 'ROUNDING', text: `Round ${comma(v)} to the nearest ${to}.`, ...nums(ans, [other, v, to === 100 ? v - v % 10 : ans + 10, to === 100 ? (v - v % 10) + 10 : ans - 10], comma),
      steps: [`${comma(v)} is between ${comma(lo)} and ${comma(hi)}.`, v - lo === to / 2 ? `It is right in the middle, and the middle rounds up.` : `It is closer to ${comma(ans)}.`, `${comma(v)} rounds to ${comma(ans)}.`],
      size: [168, 34], fig: (c, w) => { const X = numLine(c, 16, w - 17, 14, lo, hi, to / 10, to / 2); disc(c, Math.round(16 + (v - lo) * (w - 33) / to), 14, 2, HOT); ink(c, comma(v), Math.round(16 + (v - lo) * (w - 33) / to), 5, HOT); } };
  };

  W2.estimate = d => {
    const r10 = v => Math.round(v / 10) * 10, plus = rand() < .55;
    let a, b;
    for (let i = 0; i < 20; i++) { a = randInt(d >= 4 ? 120 : 12, d >= 4 ? 480 : 89); b = randInt(d >= 4 ? 110 : 11, d >= 4 ? 450 : 79); if (![a % 10, b % 10].some(o => o === 0 || o === 5)) break; }
    if (!plus && b > a) [a, b] = [b, a];
    const ea = r10(a), eb = r10(b), est = plus ? ea + eb : ea - eb, exact = plus ? a + b : a - b, sg = plus ? '+' : '-';
    return { topic: 'ESTIMATE', text: `Estimate ${a} ${sg} ${b} by rounding each number to the nearest ten.`, say: `Estimate ${a} ${plus ? 'plus' : 'minus'} ${b} by rounding each number to the nearest ten.`,
      ...nums(est, [exact, plus ? ea + b : ea - b, est + 10, est - 10, plus ? a - a % 10 + b - b % 10 : (a - a % 10) - (b - b % 10)], comma),
      steps: [`${a} rounds to ${ea}. ${b} rounds to ${eb}.`, `${ea} ${sg} ${eb} = ${comma(est)}`, `The real answer, ${comma(exact)}, is close to ${comma(est)}.`] };
  };

  W2.equalGroups = d => {
    const g = randInt(2, d <= 2 ? 4 : 5), n = randInt(2, 5), total = g * n, name = pick(ICONS), f = pick(['total', 'sentence', 'each']), rep = Array(g).fill(n).join(' + ');
    const pw = 28, w = g * (pw + 3) - 3, pic = { size: [Math.max(60, w + 8), 36], fig: (c, W) => {
      const x0 = Math.round((W - w) / 2);
      for (let i = 0; i < g; i++) { const x = x0 + i * (pw + 3); box(c, x, 2, pw, 32, '#3a4470'); box(c, x + 1, 3, pw - 2, 30, '#1c2450'); for (let j = 0; j < n; j++) icon(c, name, x + 3 + (j % 2) * 12, 5 + Math.floor(j / 2) * 9); }
    } };
    if (f === 'total') return { topic: 'EQUAL GROUPS', text: `There are ${g} equal groups of ${n} ${plural(name)}. How many ${plural(name)} in all?`, ...nums(total, [g + n, total + n, total - n, total + 1], String, 1), steps: [`Add ${n} for each group: ${rep}.`, `= ${total}`], ...pic };
    if (f === 'sentence') return { topic: 'EQUAL GROUPS', text: 'Which addition sentence matches the groups?', say: 'Which addition sentence matches the equal groups?',
      ...opts(`${rep} = ${total}`, [`${g} + ${n} = ${g + n}`, `${Array(g + 1).fill(n).join(' + ')} = ${total + n}`, `${Array(g).fill(n + 1).join(' + ')} = ${total + g}`, `${n} + ${n} = ${2 * n}`, `${Array(g + 2).fill(n).join(' + ')} = ${total + 2 * n}`, `${Array(g).fill(n + 2).join(' + ')} = ${total + 2 * g}`]), steps: [`There are ${g} groups with ${n} in each.`, `${rep} = ${total}`], ...pic };
    return { topic: 'EQUAL GROUPS', text: `${total} ${plural(name)} are in ${g} equal groups. How many are in each group?`, ...nums(n, [g, total, n + 1, n - 1], String, 1), steps: [`Each group has the same number.`, `${rep} = ${total}, so each has ${n}.`], ...pic };
  };

  W2.shareEqually = d => {
    const k = randInt(2, d <= 3 ? 4 : 5), e = randInt(2, 5), total = k * e, name = pick(['cookie', 'apple', 'star', 'ball', 'flower']), [P] = kids(1);
    return { topic: 'SHARING', text: `${P.n} shares ${total} ${plural(name)} equally with ${k - 1} ${v1(k - 1, 'friend', 'friends')}. How many does each of the ${k} get?`,
      ...nums(e, [total - k, k, e + 1, e - 1, total], String, 1), steps: [`${k} people share: ${P.n} and ${k - 1} more.`, `Deal them out one at a time: ${Array(k).fill(e).join(' + ')} = ${total}.`, `Each person gets ${e}.`],
      size: [Math.min(total, 10) * 11 + 12, Math.ceil(total / 10) * 11 + 8], fig: (c, w) => picRows(c, name, total, Math.round((w - (Math.min(total, 10) * 11 - 2)) / 2), 4, 10) };
  };

  W2.fractionGroup = d => fractionGroupQ(2, d);
  W2.moneyCompare = d => moneyCompareQ(2, d);
  W2.moneyEnough = d => moneyEnoughQ(2, d);

  W2.makeChange = d => {
    const from = d <= 2 ? 100 : pick([100, 500]), price = from === 100 ? 5 * randInt(3, 19) - (d >= 3 ? randInt(0, 4) : 0) : 5 * randInt(30, 95), change = from - price, [P] = kids(1), item = pick(SHOP)[0];
    const path = [price]; for (const step of [10, 50, 100]) { const last = path[path.length - 1]; if (last % step) path.push(last + step - last % step); }
    while (path[path.length - 1] < from) path.push(path[path.length - 1] + 100);
    const text = `${cap(art(item))} costs ${money(price)}. ${P.n} pays with a $${from / 100} bill. How much change does ${P.he} get?`;
    return { topic: 'MAKING CHANGE', text, say: sayMoney(text), ...nums(change, [price, change + 10, change - 10, change + 5, from - change + 10], money, 1),
      steps: [`Count up from ${money(price)} to ${money(from)}.`, path.map(money).join(', '), `That is ${money(change)} in change.`],
      size: [110, 34], fig: c => { tag(c, 6, 11, money(price)); bill(c, 66, 9, from / 100); } };
  };

  // Every way to make change with up to 6 coins, so "which coins" questions have one answer only.
  const COMBOS = (() => { const out = [], T = ['q', 'd', 'n', 'p'], rec = (g, from) => { if (g.length) out.push(g.slice()); if (g.length === 6) return; for (let i = from; i < 4; i++) { g.push(T[i]); rec(g, i); g.pop(); } }; rec([], 0); return out; })();
  const describe = g => ['q', 'd', 'n', 'p'].map(k => [k, g.filter(x => x === k).length]).filter(([, n]) => n).map(([k, n]) => `${n} ${COIN[k][n === 1 ? 'name' : 'many']}`).join(', ');
  const fewest = v => { const out = []; for (const k of ['q', 'd', 'n', 'p']) while (v >= COIN[k].v) { out.push(k); v -= COIN[k].v; } return out; };
  W2.fewestCoins = d => {
    const T = d <= 2 ? 5 * randInt(3, 19) : randInt(11, 99), g = fewest(T), n = g.length;
    if (rand() < .5) return { topic: 'FEWEST COINS', text: `What is the fewest coins that make ${money(T)}?`, say: `What is the fewest number of coins that make ${T} cents?`,
      ...nums(n, [n + 1, n + 2, n - 1, Math.min(T, 20)], String, 1), steps: ['Use the biggest coin you can, again and again.', `${describe(g)}.`, `That is ${n} ${v1(n, 'coin', 'coins')}.`] };
    const T2 = pick(range(10, 99).filter(v => (d >= 3 || v % 5 === 0) && fewest(v).length <= 4)), right = pick(COMBOS.filter(x => worth(x) === T2 && x.length > 1)), K = right.length;
    const wrongs = [...shuffle(COMBOS.filter(x => (x.length === K) !== (worth(x) === T2) && Math.abs(worth(x) - T2) <= 15 && Math.abs(x.length - K) <= 1)), ...shuffle(COMBOS.filter(x => x.length === K && worth(x) !== T2))].map(describe);
    const text = `${kids(1)[0].n} makes ${money(T2)} with exactly ${K} coins. Which coins could they be?`;
    return { topic: 'MAKE AN AMOUNT', text, say: sayMoney(text), ...opts(describe(right), wrongs),
      steps: ['Check two things: the total and the number of coins.', `${describe(right)}: ${runOf(right)}.`, `That is ${money(T2)} with ${K} coins.`] };
  };

  const durWords = k => k === 1 ? '30 minutes' : k % 2 ? `${(k - 1) / 2} ${v1((k - 1) / 2, 'hour', 'hours')} 30 minutes` : `${k / 2} ${v1(k / 2, 'hour', 'hours')}`;
  const addHalf = (h, m, k) => { const t = ((h % 12) * 60 + m + 30 * k) % 720; return [Math.floor(t / 60) || 12, t % 60]; };
  const ACTS = ['Soccer practice', 'The movie', 'The party', 'The field trip', 'The swim lesson', 'The art class'];
  W2.elapsed = d => {
    const h = randInt(1, 11), m = d <= 2 ? 0 : pick([0, 30]), k = d <= 2 ? 2 * randInt(1, 3) : randInt(1, 6), [eh, em] = addHalf(h, m, k), act = pick(ACTS), f = pick(['end', 'length', ...(d >= 4 ? ['start'] : [])]);
    const count = range(1, Math.floor(k / 2)).map(i => hm(...addHalf(h, m, 2 * i))).join(', '), more = k % 2 ? ', then 30 more minutes' : '';
    if (f === 'length') return { topic: 'ELAPSED TIME', text: `${act} starts and ends at the times on the clocks. How long does it last?`, ...opts(durWords(k), shuffle(range(1, 7).filter(x => x !== k).map(durWords))),
      steps: [`It starts at ${hm(h, m)} and ends at ${hm(eh, em)}.`, `Count on by hours from ${hm(h, m)}${count ? ': ' + count : ''}${more}.`, `That is ${durWords(k)}.`],
      size: [168, 86], fig: c => { clock(c, 42, 39, 36, h, m); clock(c, 126, 39, 36, eh, em); ink(c, 'START', 42, 81, HOT); ink(c, 'END', 126, 81, HOT); } };
    const wr = [hm(...addHalf(h, m, k + 1)), hm(...addHalf(h, m, k - 1)), hm(...addHalf(h, m, k + 2)), hm(h, (m + 30 * k) % 60 || 30)];
    if (f === 'start') return { topic: 'ELAPSED TIME', text: `${act} ended at ${hm(eh, em)}. It lasted ${durWords(k)}. When did it start?`, ...opts(hm(h, m), [hm(...addHalf(eh, em, k)), hm(...addHalf(h, m, 1)), hm(...addHalf(h, m, -1)), hm(...addHalf(h, m, 2))]),
      steps: [`Count back ${durWords(k)} from ${hm(eh, em)}.`, `It started at ${hm(h, m)}.`] };
    return { topic: 'ELAPSED TIME', text: `${act} starts at ${hm(h, m)}. It lasts ${durWords(k)}. What time does it end?`, ...opts(hm(eh, em), wr),
      steps: [`Start at ${hm(h, m)}.`, `Count on by hours${count ? ': ' + count : ''}${more}.`, `It ends at ${hm(eh, em)}.`], ...bigClock(h, m) };
  };

  const SCHOOL = ['Reading', 'Math', 'Recess', 'Science', 'Lunch', 'Art', 'Music', 'Gym'];
  W2.schedule = d => {
    const drop = pickN([0, 1, 2, 3, 5, 6, 7], 3), evs = SCHOOL.filter((_, j) => !drop.includes(j)), starts = [[8, 30]]; for (let i = 1; i < 5; i++) starts.push(addHalf(...starts[i - 1], randInt(1, 3)));
    const times = starts.map(t => hm(...t)), i = randInt(0, 3), f = pick(['what', 'when', 'after', 'howLong']);
    const pic = { size: [104, 62], fig: c => table(c, 4, 1, [54, 42], [['CLASS', 'STARTS'], ...evs.map((e, j) => [e, times[j]])]) };
    if (f === 'what') return { topic: 'SCHEDULE', text: `The schedule shows the school day. What starts at ${times[i]}?`, ...opts(evs[i], evs), steps: [`Find ${times[i]} in the STARTS column.`, `${evs[i]} starts at ${times[i]}.`], ...pic };
    if (f === 'when') return { topic: 'SCHEDULE', text: `The schedule shows the school day. When does ${evs[i]} start?`, ...opts(times[i], [...times, hm(...addHalf(...starts[i], 1))]), steps: [`Find ${evs[i]} in the CLASS column.`, `It starts at ${times[i]}.`], ...pic };
    if (f === 'after') return { topic: 'SCHEDULE', text: `The schedule shows the school day. What comes right after ${evs[i]}?`, ...opts(evs[i + 1], evs), steps: ['The schedule goes in order, top to bottom.', `After ${evs[i]} comes ${evs[i + 1]}.`], ...pic };
    const k = Math.round((((starts[i + 1][0] % 12) * 60 + starts[i + 1][1]) - ((starts[i][0] % 12) * 60 + starts[i][1]) + 720) % 720 / 30);
    return { topic: 'SCHEDULE', text: `How long is it from the start of ${evs[i]} to the start of ${evs[i + 1]}?`, ...opts(durWords(k), shuffle(range(1, 6).filter(x => x !== k).map(durWords))),
      steps: [`${evs[i]} starts at ${times[i]}. ${evs[i + 1]} starts at ${times[i + 1]}.`, `From ${times[i]} to ${times[i + 1]} is ${durWords(k)}.`], ...pic };
  };

  W2.calendar = d => calendarQ(2, d);
  W2.calendarPage = d => calendarPageQ(2, d);
  W2.thermometer = d => thermometerQ(2, d);

  const WEIGHTS = [
    ['an apple', '6 ounces', ['6 pounds', '60 pounds', '600 pounds']], ['a dog', '30 pounds', ['3 ounces', '1 ounce', '3,000 pounds']],
    ['a slice of bread', '1 ounce', ['1 pound', '10 pounds', '100 pounds']], ['a bike', '25 pounds', ['2 ounces', '1 ounce', '2,500 pounds']],
    ['a car', '3,000 pounds', ['3 ounces', '30 ounces', '3 pounds']], ['a paper clip', '1 gram', ['1 kilogram', '10 kilograms', '100 kilograms']],
    ['a cat', '4 kilograms', ['4 grams', '40 grams', '400 kilograms']], ['a bag of flour', '2 kilograms', ['2 grams', '20 grams', '200 kilograms']],
    ['a strawberry', '10 grams', ['10 kilograms', '50 kilograms', '100 kilograms']], ['a watermelon', '5 kilograms', ['5 grams', '50 grams', '500 kilograms']],
  ];
  const CAPACITY = [
    ['a glass of milk', '1 cup', ['1 gallon', '10 gallons', '100 cups']], ['a bathtub', '40 gallons', ['4 cups', '40 cups', '4,000 gallons']],
    ['a pot of soup', '4 quarts', ['400 quarts', '40 gallons', '400 gallons']], ['a water bottle', '1 liter', ['50 liters', '100 liters', '1,000 liters']],
    ['a big jug of milk', '1 gallon', ['100 gallons', '1,000 gallons', '50 gallons']], ['a kitchen sink', '20 liters', ['1,000 liters', '20,000 liters', '200,000 liters']],
    ['a juice box', '1 cup', ['1 gallon', '10 quarts', '10 gallons']], ['a fish bowl', '4 liters', ['400 liters', '4,000 liters', '40,000 liters']],
  ];
  function unitsQ(kind, d) {
    const weight = kind === 'weight', f = pick(['estimate', 'estimate', 'unit', 'compare', ...(d >= 4 && !weight ? ['convert'] : [])]);
    if (f === 'estimate') { const [what, right, wrongs] = pick(weight ? WEIGHTS : CAPACITY); return { topic: weight ? 'WEIGHT' : 'CAPACITY', text: weight ? `About how much does ${what} weigh?` : `About how much does ${what} hold?`, ...opts(right, wrongs),
      steps: [weight ? 'Ounces and grams are light. Pounds and kilograms are heavier.' : 'A cup is small, a quart is 4 cups, a gallon is 4 quarts. A liter is about a quart.', `${cap(what)} ${weight ? 'weighs' : 'holds'} about ${right}.`] }; }
    if (f === 'unit') { const right = pick(weight ? ['pounds', 'ounces', 'grams', 'kilograms'] : ['cups', 'quarts', 'gallons', 'liters']);
      return { topic: weight ? 'WEIGHT' : 'CAPACITY', text: weight ? 'Which unit is used to measure how heavy something is?' : 'Which unit is used to measure how much a container holds?',
        ...opts(right, shuffle(['inches', 'feet', 'meters', 'centimeters', ...(weight ? ['cups', 'liters'] : ['pounds', 'grams'])])), steps: [weight ? 'Weight is how heavy: pounds, ounces, grams, kilograms.' : 'Capacity is how much it holds: cups, quarts, gallons, liters.', `So the answer is ${right}.`] }; }
    if (f === 'convert') { const [q, a, wr, st] = pick([['How many cups make 1 quart?', 4, [2, 3, 8], '4 cups make 1 quart.'], ['How many quarts make 1 gallon?', 4, [2, 8, 10], '4 quarts make 1 gallon.'], ['How many cups make 2 quarts?', 8, [4, 6, 10], '4 cups make 1 quart, so 2 quarts is 4 + 4 = 8 cups.']]);
      return { topic: 'CAPACITY', text: q, ...nums(a, wr, String, 1), steps: [st] }; }
    return weight ? weighQ() : holdsQ(1, d);
  }
  W2.weight = d => unitsQ('weight', d);
  W2.capacity = d => unitsQ('capacity', d);

  W2.patterns = d => patternQ(2, d);
  W2.probability = d => probabilityQ(2, d);
  W2.symmetry = d => symmetryQ(2, d);
  W2.solids = d => solidsQ(2, d);
  W2.ordinal = d => ordinalQ(2, d);

  W2.area = d => {
    const R = randInt(2, d <= 3 ? 4 : 5), C = randInt(2, 6), cut = d >= 4 && rand() < .5 ? [randInt(1, R - 1), randInt(1, C - 1)] : null;
    const cells = []; for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) if (!cut || j >= cut[0] || i >= cut[1]) cells.push([i, j]);
    const n = cells.length, per = 2 * (R + C), col = pick(COLS);
    return { topic: 'AREA', text: 'Each small square is 1 square unit. How many square units cover the shape?', ...nums(n, [per, R + C, n + 1, n - 1, n + C], String, 1),
      steps: cut ? ['Count the squares row by row.', `${range(0, R - 1).map(j => cells.filter(p => p[1] === j).length).join(' + ')} = ${n}`, `The area is ${n} square units.`]
        : [`${R} rows of ${C} squares.`, `${Array(R).fill(C).join(' + ')} = ${n}`, `The area is ${n} square units.`],
      size: [C * 11 + 14, R * 11 + 8], fig: (c, W, H) => { const x = Math.round((W - C * 11 - 1) / 2), y = Math.round((H - R * 11 - 1) / 2); for (const [i, j] of cells) { box(c, x + i * 11, y + j * 11, 12, 12, INK); box(c, x + i * 11 + 1, y + j * 11 + 1, 10, 10, col); } } };
  };

  W2.perimeter = d => {
    const unit = pick(['inches', 'centimeters', 'feet']), kind = pick(d <= 3 ? ['rect', 'tri'] : ['rect', 'tri', 'five']);
    let pts, sides;
    if (kind === 'rect') { const a = randInt(3, 9), b = randInt(2, a); sides = [a, b, a, b]; pts = [[16, 8], [136, 8], [136, 50], [16, 50]]; }
    else if (kind === 'tri') { sides = [randInt(4, 9), randInt(4, 9), randInt(3, 8)]; pts = [[20, 50], [134, 50], [70, 7]]; }
    else { sides = range(1, 5).map(() => randInt(2, 9)); pts = [[30, 50], [120, 50], [140, 24], [80, 7], [14, 22]]; }
    const p = sides.reduce((a, b) => a + b, 0), shown = kind === 'rect' && d >= 3 ? [sides[0], sides[1], null, null] : sides;
    return { topic: 'PERIMETER', text: `The sides are in ${unit}. What is the perimeter of the shape?${shown.includes(null) ? ' Opposite sides are the same.' : ''}`,
      ...nums(p, [p - sides[sides.length - 1], kind === 'rect' ? sides[0] * sides[1] : p + 1, sides[0] + sides[1], p + 2, p - 1], v => `${v} ${unit}`, 1),
      steps: ['Perimeter is the distance all the way around.', `Add every side: ${sides.join(' + ')}`, `= ${p} ${unit}`],
      size: [154, 62], fig: c => { poly(c, pts, '#1c3a2e', GRN); pts.forEach((a, i) => { if (shown[i] == null) return; const b = pts[(i + 1) % pts.length], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, cx = pts.reduce((s, q) => s + q[0], 0) / pts.length, cy = pts.reduce((s, q) => s + q[1], 0) / pts.length, l = Math.hypot(mx - cx, my - cy) || 1; label(c, String(shown[i]), mx + (mx - cx) / l * 7, my + (my - cy) / l * 7, HOT); }); } };
  };

  Questions.extend('2', W2, { roman: 2, balance: 2, compareExpr: 2, guessCheck: 3, riddle: 2, breakApart: 2, rounding: 2, estimate: 3, equalGroups: 2, shareEqually: 3,
    fractionGroup: 2, makeChange: 2, fewestCoins: 2, elapsed: 2, schedule: 2, probability: 2, symmetry: 2, area: 3, perimeter: 3, placeConvert: 2, weight: 2, capacity: 2 });

  // ======================================================== KINDERGARTEN, WIDER
  const WK = {};
  WK.numberWords = d => {
    const n = randInt(d === 1 ? 1 : 0, 10), f = pick(['toWord', 'toNum', 'count', ...(d >= 2 ? ['spell'] : [])]), near = [n + 1, n - 1, n + 2, n - 2, n + 3].filter(v => v >= 0 && v <= 12);
    if (f === 'spell') return spellQ(10);
    if (f === 'toNum') return { topic: 'NUMBER WORDS', text: `What number is ${ONES[n]}?`, ...nums(n, near), steps: [`${cap(ONES[n])} is the word for ${n}.`] };
    if (f === 'toWord') return { topic: 'NUMBER WORDS', text: `Which word is ${n}?`, say: `Which word means the number ${n}?`, ...opts(ONES[n], near.map(v => ONES[v])), steps: [`${n} is written ${ONES[n]}.`] };
    const name = pick(ICONS), m = Math.max(1, n), L = spreadFit(m, 'rows');
    return { topic: 'NUMBER WORDS', text: 'Which word tells how many?', ...opts(ONES[m], [m + 1, m - 1, m + 2].filter(v => v >= 0).map(v => ONES[v])),
      steps: [`Count them: ${upto(m)}.`, `${m} is the word ${ONES[m]}.`], size: [L.w + 10, L.h + 8], fig: (c, w, h) => pics(c, w, h, name, L) };
  };
  WK.ordinal = d => ordinalQ(0, d);
  WK.patterns = d => patternQ(0, d);
  WK.calendar = d => calendarQ(0, d);
  WK.holdsMore = d => holdsQ(0, d);

  WK.classify = () => {
    const f = pick(['kind', 'color', 'shape']);
    let draws, at, text, why;
    if (f === 'kind') {
      const [a, b] = pickN(ICONS, 2), set = shuffle([a, a, a, b]); at = set.indexOf(b); text = 'Which one does not belong?';
      draws = set.map(nm => (c, x, y) => icon(c, nm, x - 13, y - 13, 3)); why = `Three are ${plural(a)}. One is a ${b}.`;
    } else if (f === 'color') {
      const shp = pick(['circle', 'square', 'triangle', 'hexagon']), [ca, cb] = pickN(COLS, 2), cols = shuffle([ca, ca, ca, cb]); at = cols.indexOf(cb); text = 'Which one is a different color?';
      draws = cols.map(col => (c, x, y) => flat(c, shp, x, y, { r: 14, rot: 0, v: 0, col })); why = 'Three are the same color. One is not.';
    } else {
      const [sa, sb] = pickN(['circle', 'square', 'triangle', 'hexagon'], 2), shapes = shuffle([sa, sa, sa, sb]), cols = pickN(COLS, 4); at = shapes.indexOf(sb); text = 'Which one is a different shape?';
      draws = shapes.map((shp, i) => (c, x, y) => flat(c, shp, x, y, { r: 14, rot: 0, v: 0, col: cols[i] })); why = `Three are ${sa}s. One is a ${sb}.`;
    }
    return { topic: 'SORTING', text, ...which(at), steps: [why, `It is number ${at + 1}.`], size: [168, 46], fig: (c, w, h) => four(c, w, h, (i, x, y, cw, ch) => draws[i](c, x + Math.round(cw / 2), y + Math.round(ch / 2))) };
  };

  WK.coins = d => {
    const k = pick(d === 1 ? ['p', 'n', 'd'] : ['p', 'n', 'd', 'q']), C = COIN[k], f = pick(['name', 'name', 'value', 'pennies']);
    const looks = { p: 'copper colored, not silver', n: 'silver and bigger than a dime', d: 'silver and the smallest coin', q: 'silver and the biggest coin' }[k];
    const big = { size: [60, 56], fig: c => { const off = canvas(25, 25), x = off.getContext('2d'); coin(x, 12, 12, k); c.drawImage(off, 5, 3, 50, 50); } };
    if (f === 'name') {
      const set = shuffle(['p', 'n', 'd', 'q']), at = set.indexOf(k);
      return { topic: 'COINS', text: `Which coin is the ${C.name}?`, ...which(at), steps: [`A ${C.name} is ${looks}.`, `Coin ${at + 1} is the ${C.name}. It is worth ${C.v}¢.`],
        size: [168, 46], fig: (c, w, h) => four(c, w, h, (i, x, y, cw, ch) => { const off = canvas(25, 25); coin(off.getContext('2d'), 12, 12, set[i]); c.drawImage(off, x + Math.round(cw / 2) - 17, y + Math.round(ch / 2) - 17, 34, 34); }) };
    }
    if (f === 'value') return { topic: 'COINS', text: `This is a ${C.name}. How much is it worth?`, say: `This is a ${C.name}. How many cents is it worth?`, ...opts(`${C.v}¢`, ['1¢', '5¢', '10¢', '25¢']), steps: [`A ${C.name} is ${looks}.`, `It is worth ${C.v}¢.`], ...big };
    const n = randInt(2, d <= 2 ? 6 : 10), items = Array(n).fill('p');
    return { topic: 'COINS', text: 'How many cents are there?', ...nums(n, [n + 1, n - 1, n + 2], v => v + '¢', 1), steps: ['Each penny is 1 cent.', `Count them: ${upto(n)}.`, `That is ${n}¢.`], ...cash(items) };
  };

  const WHEN = [['eat breakfast', 'in the morning'], ['wake up', 'in the morning'], ['see the moon and stars', 'at night'], ['go to sleep', 'at night'], ['go home from school', 'in the afternoon'], ['see the sun come up', 'in the morning']];
  WK.dayTime = d => {
    if (rand() < .5) {
      const night = rand() < .5;
      return { topic: 'DAY AND NIGHT', text: 'Is it day or night in the picture?', ...opts(night ? 'night' : 'day', ['day', 'night', 'both', "can't tell"]),
        steps: [night ? 'The sky is dark. The moon and stars are out.' : 'The sky is light. The sun is out.', `It is ${night ? 'night' : 'day'}.`],
        size: [120, 60], fig: c => {
          box(c, 0, 0, 120, 46, night ? '#101838' : '#78b8f0'); box(c, 0, 46, 120, 14, '#48a048');
          box(c, 66, 26, 30, 20, '#d0b080'); fillPoly(c, [[62, 27], [81, 12], [100, 27]], '#c04040'); box(c, 76, 34, 8, 12, '#6a4420'); box(c, 68, 30, 6, 6, night ? HOT : '#a8d8f8');
          if (night) { disc(c, 24, 14, 8, '#f0f0d0'); disc(c, 28, 11, 7, '#101838'); for (const [sx, sy] of [[44, 8], [10, 30], [52, 20], [104, 8], [36, 32]]) box(c, sx, sy, 1, 1, '#ffffff'); }
          else { disc(c, 24, 16, 8, HOT); for (let a = 0; a < 360; a += 45) line(c, 24 + Math.sin(a * DEG) * 11, 16 - Math.cos(a * DEG) * 11, 24 + Math.sin(a * DEG) * 14, 16 - Math.cos(a * DEG) * 14, HOT); }
        } };
    }
    const [act, when] = pick(WHEN);
    return { topic: 'TIME OF DAY', text: `When do you ${act}?`, ...opts(when, ['in the morning', 'in the afternoon', 'at night', 'never']),
      steps: ['Morning is when the day starts. Afternoon is after lunch. Night is dark.', `You ${act} ${when}.`] };
  };

  WK.measureCubes = d => {
    const k = randInt(2, d <= 2 ? 5 : 7), kind = pick(['pencil', 'crayon', 'straw', 'ribbon']), extra = d >= 3 ? 1 : 0, u = 14, w = (k + extra) * u;
    return { topic: 'MEASURING', text: `How many cubes long is the ${kind}?`, ...nums(k, [k + 1, k - 1, k + 2], String, 1),
      steps: [`Line up the cubes under the ${kind}.`, `Count the cubes to its end: ${upto(k)}.`, `It is ${k} cubes long.`],
      size: [w + 16, 36], fig: (c, W) => { const x0 = Math.round((W - w) / 2); thing(c, kind, x0, x0 + k * u - 1, 9); for (let i = 0; i < k + extra; i++) { box(c, x0 + i * u, 17, 14, 14, i % 2 ? '#1c4c90' : '#8a2020'); box(c, x0 + i * u + 1, 18, 12, 12, i % 2 ? BLU : RED); } } };
  };

  WK.shapeAttr = d => {
    const f = pick(['corners', 'noCorners', 'roll', 'notRoll']);
    if (f === 'corners' || f === 'noCorners') {
      const set = shuffle(['circle', 'triangle', pick(['square', 'rectangle']), 'hexagon']), n = f === 'noCorners' ? 0 : pick([3, 4, 6]), CN = { circle: 0, triangle: 3, square: 4, rectangle: 4, hexagon: 6 };
      const at = set.findIndex(s => CN[s] === n), os = set.map(() => shapeOpt(15));
      return { topic: 'SHAPES', text: n ? `Which shape has ${n} corners?` : 'Which shape has no corners?', ...which(at),
        steps: [n ? 'Count the corners of each shape.' : 'A round shape has no corners.', `Shape ${at + 1}, the ${set[at]}, has ${n || 'no'} corners.`], size: [168, 46], fig: (c, w, h) => four(c, w, h, (i, x, y, cw, ch) => flat(c, set[i], x + Math.round(cw / 2), y + Math.round(ch / 2), os[i])) };
    }
    const roll = f === 'roll', odd = roll ? 'sphere' : 'cube', set = shuffle([odd, ...(roll ? ['cube', 'box', 'pyramid'] : ['sphere', 'cylinder', 'cone'])]), at = set.indexOf(odd), cs = set.map(() => pick(COLS));
    return { topic: 'SOLID SHAPES', text: roll ? 'Which shape can roll?' : 'Which shape can NOT roll?', ...which(at),
      steps: ['Round, curved shapes roll. Shapes with only flat sides do not.', `Shape ${at + 1}, the ${odd === 'box' ? 'box' : odd}, ${roll ? 'is round all over' : 'has only flat sides'}.`],
      size: [168, 48], fig: (c, w, h) => four(c, w, h, (i, x, y, cw, ch) => solid(c, set[i], x + Math.round(cw / 2), y + Math.round(ch / 2), 30, cs[i])) };
  };

  WK.shareFair = d => {
    const [P, Q] = kids(2);
    if (rand() < .5) {
      const n = 2 * randInt(2, d <= 2 ? 4 : 5), L = spreadFit(n, 'rows');
      return { topic: 'SHARING', text: `${P.n} shares ${n} cookies fairly with ${Q.n}. How many does each one get?`, ...nums(n / 2, [n, n / 2 + 1, n / 2 - 1, 2], String, 1),
        steps: ['Fair means both get the same.', `Give one to each, again and again: ${n / 2} each.`, `${n / 2} and ${n / 2} make ${n}.`], size: [L.w + 10, L.h + 8], fig: (c, w, h) => pics(c, w, h, 'cookie', L) };
    }
    const fair = randInt(1, 4), splits = shuffle([[fair, fair], ...pickN([[1, 3], [3, 1], [2, 4], [4, 2], [1, 2], [2, 1], [3, 4], [4, 3]], 3)]), at = splits.findIndex(([a, b]) => a === b);
    return { topic: 'SHARING', text: 'Two friends share cookies. Which picture is fair?', ...which(at),
      steps: ['Fair means each plate has the same number.', `Plate picture ${at + 1} has ${splits[at][0]} and ${splits[at][1]}.`],
      size: [168, 40], fig: (c, w, h) => four(c, w, h, (i, x, y, cw, ch) => splits[i].forEach((k, j) => { const px = x + 10 + j * 19, py = y + Math.round(ch / 2); disc(c, px, py, 9, '#e8ecf8'); disc(c, px, py, 7, '#c8ccd8'); for (let q = 0; q < k; q++) disc(c, px - 3 + (q % 2) * 6, py - 3 + Math.floor(q / 2) * 6, 2, '#a86a30'); })) };
  };

  Questions.extend('k', WK, { ordinal: 2, calendar: 2, classify: 1, coins: 2, dayTime: 1, shareFair: 2 });

  // ======================================================== 1ST GRADE, WIDER
  const W1 = {};
  W1.numberWords = d => {
    if (rand() < .25) return spellQ(20);
    const n = d === 1 ? randInt(11, 20) : randInt(21, 99), w = words99(n), sw = n % 10 ? 10 * (n % 10) + Math.floor(n / 10) : n + 1;
    if (rand() < .55) return { topic: 'NUMBER WORDS', text: `Which number is ${w}?`, ...nums(n, [sw, n + 10, n - 10, n + 1].filter(v => v > 0 && v < 100)), steps: [w.includes('-') ? `${w.split('-')[0]} is ${n - n % 10}, ${w.split('-')[1]} is ${n % 10}.` : `${cap(w)} is ${n}.`, `So the number is ${n}.`] };
    return { topic: 'NUMBER WORDS', text: `How do you write ${n} in words?`, ...opts(w, [sw, n <= 89 ? n + 10 : n - 10, n + 1, n - 1, n + 2, n - 2, n - 11].filter(v => v >= 1 && v <= 99 && v !== n).map(words99)),
      steps: [n > 20 && n % 10 ? `${n} is ${n - n % 10} and ${n % 10}.` : `${n} is said ${w}.`, `So it is ${w}.`] };
  };
  W1.ordinal = d => ordinalQ(1, d);
  W1.skipCount = d => {
    const step = pick([2, 5, 10]), a = step * randInt(0, d <= 2 ? 8 : 16), miss = d >= 3 && rand() < .5, seq = range(0, 4).map(i => a + i * step), k = miss ? randInt(1, 3) : 4, ans = seq[k];
    return { topic: 'SKIP COUNTING', text: `Count by ${step}s. What number is ${miss ? 'missing' : 'next'}?`, ...nums(ans, [ans + 1, ans - 1, ans + step, ans - step, ans + 10]),
      steps: [`Counting by ${step}s adds ${step} each time.`, seq.join(', ')], ...tiles(seq.map((v, i) => i === k ? null : v)) };
  };
  W1.evenOdd = d => (rand() < .5 ? G2.evenOddPics : G2.evenOddNum)(1);
  W1.balance = d => balanceQ(1, d);
  W1.moneyCount = () => G2.coinCount(1);
  W1.moneyCompare = d => moneyCompareQ(1, d);
  W1.moneyEnough = d => moneyEnoughQ(1, d);
  W1.digitalClock = d => {
    const h = randInt(1, 12), m = d === 1 ? 0 : pick([0, 30]), next = h % 12 + 1, prev = h === 1 ? 12 : h - 1, key = t => t.join(':');
    const cand = [[next, m], [h, m ? 0 : 30], m ? [6, (h % 12) * 5] : [12, (h % 12) * 5], [prev, m], [h, 15]], seen = new Set([key([h, m])]), others = [];
    for (const t of cand) if (others.length < 3 && !seen.has(key(t))) { seen.add(key(t)); others.push(t); }
    const times = shuffle([[h, m], ...others]), at = times.findIndex(t => key(t) === key([h, m])), LED = ['#b0ffb0', '#60f070', '#30c040'];
    return { topic: 'TIME', text: 'Which clock shows the same time as the digital clock?', ...which(at),
      steps: [`The digital clock says ${hm(h, m)}.`, m ? `Half past ${h}: the minute hand on 6, the hour hand between ${h} and ${next}.` : `${h} o'clock: the minute hand on 12, the hour hand on ${h}.`, `That is clock ${at + 1}.`],
      size: [168, 80], fig: (c, w, h2) => { box(c, w / 2 - 34, 1, 68, 26, '#202020'); box(c, w / 2 - 32, 3, 64, 22, '#081008'); const t = Font.big(hm(h, m), 2, LED); c.drawImage(t, Math.round(w / 2 - t.width / 2), 3); four(c, w, h2, (i, x, y, cw) => clock(c, x + Math.round(cw / 2), y + 48, 19, ...times[i])); } };
  };
  W1.calendar = d => calendarQ(1, d);
  W1.calendarPage = d => calendarPageQ(1, d);
  W1.temperature = d => thermometerQ(1, d);
  W1.weightCap = d => rand() < .5 ? weighQ() : holdsQ(1, d);
  W1.patterns = d => patternQ(1, d);
  W1.probability = d => probabilityQ(1, d);
  W1.symmetry = d => symmetryQ(1, d);
  W1.fractionGroup = d => fractionGroupQ(1, d);
  W1.solids = d => solidsQ(1, d);
  W1.inOut = d => inOutQ(1, d);
  W1.greatestLeast = d => greatestLeastQ(1, d);

  Questions.extend('1', W1, { balance: 2, moneyCompare: 2, moneyEnough: 3, calendarPage: 2, probability: 2, symmetry: 2, fractionGroup: 2, inOut: 2, greatestLeast: 2, digitalClock: 2 });
})();
