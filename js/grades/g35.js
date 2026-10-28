'use strict';
// 3rd, 4th and 5th grade: every Common Core cluster in OA, NBT, NF, MD and G, with fresh numbers and figures.
(() => {
  const F = Figures, { INK, DIM, GRID, HOT, RED, GRN, BLU } = F.C, R = randInt;
  const EMPTY = '#1e2858', FACE = '#151c40', SOFT = '#a8b4d8', PINK = '#f08cd0', FILL = '#24306a', FILL2 = '#3a2a5a';
  const BARS = [BLU, GRN, HOT, PINK, RED];

  // ---- Numbers, words and answer choices.
  const range = n => [...Array(n).keys()];
  const sum = a => a.reduce((s, v) => s + v, 0);
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  const lcm = (a, b) => a / gcd(a, b) * b;
  const comma = s => { const [i, f] = String(s).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f === undefined ? '' : '.' + f); };
  const N = v => comma(Math.round(v * 1000) / 1000);
  const usd = c => '$' + comma((Math.round(c) / 100).toFixed(2));
  const dol = v => '$' + N(v);
  const fr = (n, d) => n + '/' + d;
  const coprime = b => { const ok = range(b - 1).map(i => i + 1).filter(a => gcd(a, b) === 1); return pick(ok.length ? ok : [1]); };
  function rf(n, d) { const g = gcd(n, d) || 1; return d / g === 1 ? String(n / g) : fr(n / g, d / g); }
  // A mixed number: 9/4 is "2 1/4". reduce=false keeps the denominator ("2 2/4").
  function mx(n, d, reduce = true) {
    if (reduce) { const g = gcd(n, d) || 1; n /= g; d /= g; }
    const w = Math.floor(n / d), r = n % d;
    return r === 0 ? comma(w) : w === 0 ? fr(r, d) : `${comma(w)} ${fr(r, d)}`;
  }
  const tm = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
  const NAMES = ['Ana', 'Jamal', 'Mei', 'Leo', 'Priya', 'Sam', 'Diego', 'Zoe', 'Omar', 'Lily', 'Kai', 'Rosa', 'Ben', 'Nia', 'Theo', 'Aisha', 'Max', 'Ivy', 'Raj', 'Elena', 'Malik', 'Hana'];
  const people = k => shuffle(NAMES.slice()).slice(0, k);
  const who = () => pick(NAMES);
  const pl = (n, one, many = one + 's') => n === 1 ? one : many;
  const rnd = (n, p) => Math.round(n / p) * p;

  // Numbers: the answer, the mistakes that fit, then near misses `step` apart. Never negative, smallest first.
  function nums(ans, wrongs, fmt = N, step = 1, whole = Number.isInteger(ans) && Number.isInteger(step)) {
    const vals = [ans];
    // With the plain number format, a wrong answer must show exactly (no 0.0007 printed as 0.001).
    const exact = v => fmt !== N || Math.abs(Number(N(v).replace(/,/g, '')) - v) < 1e-9;
    const ok = v => Number.isFinite(v) && v >= 0 && (!whole || Number.isInteger(v)) && exact(v) && !vals.some(u => Math.abs(u - v) < 1e-9 || fmt(u) === fmt(v));
    for (const w of wrongs) if (vals.length < 4 && ok(w)) vals.push(w);
    for (let k = 1; vals.length < 4 && k < 99; k++) for (const w of [ans + k * step, ans - k * step, ans + 2 * k * step]) if (vals.length < 4 && ok(w)) vals.push(w);
    vals.sort((a, b) => a - b);
    return { choices: vals.map(fmt), answer: vals.indexOf(ans) };
  }
  // Fractions as [n, d]: no wrong choice is worth the same as another, smallest first.
  function fracs(ans, wrongs, fmt = p => fr(p[0], p[1])) {
    const v = p => p[0] / p[1], out = [ans];
    const ok = p => p && Number.isInteger(p[0]) && Number.isInteger(p[1]) && p[1] > 0 && (p[0] > 0 || ans[0] === 0) &&
      !out.some(q => Math.abs(v(q) - v(p)) < 1e-9 || fmt(q) === fmt(p));
    const [n, d] = ans;
    for (const p of wrongs) if (out.length < 4 && ok(p)) out.push(p);
    for (let k = 1; out.length < 4 && k < 40; k++) for (const p of [[n + k, d], [n, d + k], [n + k, d + k]]) if (out.length < 4 && ok(p)) out.push(p);
    out.sort((a, b) => v(a) - v(b));
    return { choices: out.map(fmt), answer: out.indexOf(ans) };
  }
  function txt(right, wrongs) {
    const all = [right];
    for (const w of wrongs) if (all.length < 4 && w != null && !all.includes(w)) all.push(w);
    shuffle(all);
    return { choices: all, answer: all.indexOf(right) };
  }
  // Answer boxes are lettered A) to D), so pictures in a figure are numbered 1 to 4 (the game keeps
  // choices that are just "1" to "4" in order) and points are labeled P to S.
  const PICS = '1234', POINTS = 'PQRS';
  const picChoice = k => ({ choices: PICS.split(''), answer: k }), pointChoice = k => ({ choices: POINTS.split(''), answer: k });

  // ---- The drawing kit on top of Figures.
  const lbl = (c, s, x, y, col = INK, al = 'center') => F.label(c, String(s), Math.round(x), Math.round(y), col, al);
  const tw = s => Font.width(String(s));
  const hl = (c, x, y, w, col) => F.box(c, x, y, w, 1, col);
  const vl = (c, x, y, h, col) => F.box(c, x, y, 1, h, col);
  function frame(c, x, y, w, h, col) { hl(c, x, y, w, col); hl(c, x, y + h - 1, w, col); vl(c, x, y, h, col); vl(c, x + w - 1, y, h, col); }
  function roundBox(c, x, y, w, h, col) {
    hl(c, x + 2, y, w - 4, col); hl(c, x + 2, y + h - 1, w - 4, col); vl(c, x, y + 2, h - 4, col); vl(c, x + w - 1, y + 2, h - 4, col);
    for (const [a, b] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]]) F.box(c, x + a, y + b, 1, 1, col);
  }
  function thick(c, x0, y0, x1, y1, col) {
    F.line(c, x0, y0, x1, y1, col);
    if (Math.abs(x1 - x0) > Math.abs(y1 - y0)) F.line(c, x0, y0 + 1, x1, y1 + 1, col); else F.line(c, x0 + 1, y0, x1 + 1, y1, col);
  }
  function arrowHead(c, x, y, dx, dy, col, s = 4) {
    const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    for (const k of [1, -1]) F.line(c, x, y, x - s * ux - k * s * .6 * uy, y - s * uy + k * s * .6 * ux, col);
  }
  const xMark = (c, x, y, col) => { F.line(c, x - 2, y - 2, x + 2, y + 2, col); F.line(c, x - 2, y + 2, x + 2, y - 2, col); };
  const dot3 = (c, x, y, col) => F.box(c, Math.round(x) - 1, Math.round(y) - 1, 3, 3, col);
  const tick = (c, x, y, len = 3, col = INK) => F.box(c, x, y - len, 1, len * 2 + 1, col);
  function iconPart(c, name, x, y, cols = 9) {
    F.ICONS[name].forEach((row, j) => { for (let i = 0; i < Math.min(cols, row.length); i++) if (row[i] !== '.') F.box(c, x + i, y + j, 1, 1, F.PAL[row[i]]); });
  }
  // A number line from x0 to x1 at height y, with arrows; returns value -> x.
  function nline(c, x0, x1, y, lo, hi) {
    F.line(c, x0 - 7, y, x1 + 7, y, INK);
    arrowHead(c, x0 - 7, y, -1, 0, INK, 3); arrowHead(c, x1 + 7, y, 1, 0, INK, 3);
    return v => Math.round(x0 + (v - lo) / (hi - lo) * (x1 - x0));
  }
  // A bar cut into n equal parts (make w - 1 a multiple of n); `on` is a count from the left or a list of parts.
  function fbar(c, x, y, w, h, n, on, col = HOT) {
    const set = Array.isArray(on) ? on : range(on);
    for (let i = 0; i < n; i++) {
      const a = x + Math.round(i * (w - 1) / n), b = x + Math.round((i + 1) * (w - 1) / n);
      F.box(c, a, y, b - a, h, set.includes(i) ? col : EMPTY);
    }
    frame(c, x, y, w, h, INK);
    for (let i = 1; i < n; i++) vl(c, x + Math.round(i * (w - 1) / n), y, h, INK);
  }
  // A bar cut at the given fractions of its length (for unequal parts).
  function cutBar(c, x, y, w, h, parts, on, col = HOT) {
    let t = 0;
    const xs = [x, ...parts.map(p => x + Math.round((t += p) * (w - 1)))];
    parts.forEach((p, i) => F.box(c, xs[i], y, xs[i + 1] - xs[i], h, on.includes(i) ? col : EMPTY));
    frame(c, x, y, w, h, INK);
    for (let i = 1; i < parts.length; i++) vl(c, xs[i], y, h, INK);
  }
  // A circle cut into parts (fractions of the whole, clockwise from the top).
  function pie(c, cx, cy, r, parts, on, col = HOT) {
    F.disc(c, cx, cy, r, EMPTY);
    const ang = [Math.PI / 2];
    for (const p of parts) ang.push(ang[ang.length - 1] - p * 2 * Math.PI);
    for (const i of on) {
      const pts = [[cx, cy]];
      for (let k = 0; k <= 20; k++) { const a = ang[i] + (ang[i + 1] - ang[i]) * k / 20; pts.push([cx + Math.cos(a) * r, cy - Math.sin(a) * r]); }
      F.fillPoly(c, pts, col);
    }
    if (parts.length > 1) for (let i = 0; i < parts.length; i++) F.line(c, cx, cy, cx + Math.cos(ang[i]) * r, cy - Math.sin(ang[i]) * r, INK);
    F.circle(c, cx, cy, r, INK);
  }
  const equal = n => Array(n).fill(1 / n);
  // A rows x cols block of s-pixel cells; on(i, j) says which are shaded.
  function cellGrid(c, x, y, cols, rows, s, on, col = HOT, off = EMPTY) {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) F.box(c, x + i * s, y + j * s, s, s, on(i, j) ? col : off);
    for (let i = 0; i <= cols; i++) vl(c, x + i * s, y, rows * s + 1, INK);
    for (let j = 0; j <= rows; j++) hl(c, x, y + j * s, cols * s + 1, INK);
  }
  function inside(pts, x, y) {
    let k = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) k = !k;
    }
    return k;
  }
  // Scale a shape given in units (y down) to fill a w x h box.
  function fit(pts, w, h, px = 24, py = 12) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min((w - 2 * px) / (x1 - x0 || 1), (h - 2 * py) / (y1 - y0 || 1));
    const ox = (w - (x1 - x0) * s) / 2, oy = (h - (y1 - y0) * s) / 2;
    return pts.map(([x, y]) => [Math.round(ox + (x - x0) * s), Math.round(oy + (y - y0) * s)]);
  }
  // Label each side of a polygon just outside its middle; a null label skips that side. A label that would
  // bump into one already placed (or the edge of the box) slides along its side or steps further out.
  function sideLabels(c, pts, labs, col = INK) {
    const W = c.canvas ? c.canvas.width : 999, H = c.canvas ? c.canvas.height : 999, placed = [];
    const hit = b => b[0] < 0 || b[1] < 0 || b[2] > W || b[3] > H || placed.some(q => b[0] < q[2] && q[0] < b[2] && b[1] < q[3] && q[1] < b[3]);
    pts.forEach((p, i) => {
      const s = labs[i];
      if (s == null || s === '') return;
      const q = pts[(i + 1) % pts.length], ax = (p[0] + q[0]) / 2, ay = (p[1] + q[1]) / 2, len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
      const ux = (q[0] - p[0]) / len, uy = (q[1] - p[1]) / len;
      let nx = uy, ny = -ux;
      if (inside(pts, ax + nx * 2, ay + ny * 2)) { nx = -nx; ny = -ny; }
      const off = Math.abs(nx) * (tw(s) / 2 + 3) + Math.abs(ny) * 6 + 1;
      let best = null;
      for (const [sl, more] of [[0, 0], [.3, 0], [-.3, 0], [0, 7], [.3, 7], [-.3, 7], [0, 14]]) {
        const x = ax + ux * sl * len + nx * (off + more), y = ay + uy * sl * len + ny * (off + more) + 1, b = [x - tw(s) / 2 - 1, y - 5, x + tw(s) / 2 + 1, y + 3];
        if (!best) best = [x, y, b];
        if (!hit(b)) { best = [x, y, b]; break; }
      }
      lbl(c, s, best[0], best[1], col); placed.push(best[2]);
    });
  }
  function shape(c, pts, fill = FILL, edge = INK) { F.fillPoly(c, pts, fill); F.outlinePoly(c, pts, edge); }
  // Tick marks across a side show equal sides; a little square shows a right angle.
  function tickSide(c, p, q, n = 1, col = HOT) {
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]), ux = (q[0] - p[0]) / L, uy = (q[1] - p[1]) / L, ax = (p[0] + q[0]) / 2, ay = (p[1] + q[1]) / 2;
    for (let k = 0; k < n; k++) { const o = (k - (n - 1) / 2) * 3, cx = ax + ux * o, cy = ay + uy * o; F.line(c, cx - uy * 3, cy + ux * 3, cx + uy * 3, cy - ux * 3, col); }
  }
  function rightAt(c, v, a, b, col = SOFT, s = 5) {
    const u = p => { const L = Math.hypot(p[0] - v[0], p[1] - v[1]); return [(p[0] - v[0]) / L * s, (p[1] - v[1]) / L * s]; };
    const [ax, ay] = u(a), [bx, by] = u(b);
    F.line(c, v[0] + ax, v[1] + ay, v[0] + ax + bx, v[1] + ay + by, col); F.line(c, v[0] + bx, v[1] + by, v[0] + ax + bx, v[1] + ay + by, col);
  }
  // The angle at each corner, in degrees.
  function corners(pts) {
    return pts.map((v, i) => {
      const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
      const d = Math.atan2(a[1] - v[1], a[0] - v[0]) - Math.atan2(b[1] - v[1], b[0] - v[0]);
      let deg = Math.abs(d / DEG) % 360; if (deg > 180) deg = 360 - deg;
      return deg;
    });
  }
  // Mark the right angles and equal sides of a polygon (in pixel coordinates).
  function marks(c, pts, sideGroups) {
    corners(pts).forEach((a, i) => { if (Math.abs(a - 90) < 1.5) rightAt(c, pts[i], pts[(i + pts.length - 1) % pts.length], pts[(i + 1) % pts.length]); });
    if (sideGroups) sideGroups.forEach((g, i) => { if (g) tickSide(c, pts[i], pts[(i + 1) % pts.length], g); });
  }

  // ---- Figures several kinds share.
  function clockFig(h, m) {
    return { size: [84, 84], fig: (c, w, hh) => {
      const cx = Math.floor(w / 2), cy = Math.floor(hh / 2), r = 39;
      F.disc(c, cx, cy, r, FACE); F.circle(c, cx, cy, r, INK); F.circle(c, cx, cy, r + 1, DIM);
      for (let i = 0; i < 60; i++) {
        const a = i * 6 * DEG, s = Math.sin(a), k = Math.cos(a);
        if (i % 5) F.box(c, Math.round(cx + s * (r - 2)), Math.round(cy - k * (r - 2)), 1, 1, SOFT);
        else F.line(c, cx + s * (r - 1), cy - k * (r - 1), cx + s * (r - 4), cy - k * (r - 4), INK);
      }
      for (let i = 1; i <= 12; i++) { const a = i * 30 * DEG; lbl(c, i, cx + Math.sin(a) * (r - 11), cy - Math.cos(a) * (r - 11) + 1, SOFT); }
      const ha = ((h % 12) + m / 60) * 30 * DEG, ma = m * 6 * DEG;
      thick(c, cx, cy, cx + Math.sin(ha) * 18, cy - Math.cos(ha) * 18, HOT);
      F.line(c, cx, cy, cx + Math.sin(ma) * (r - 5), cy - Math.cos(ma) * (r - 5), INK);
      F.box(c, cx - 1, cy - 1, 3, 3, RED);
    } };
  }
  // Horizontal bar graph: category labels down the left, the scale along the bottom.
  function barFig(cats, vals, step, top) {
    return { size: [168, 18 + cats.length * 14], fig: (c, w, h) => {
      const lw = Math.max(...cats.map(tw)) + 4, x0 = lw + 3, x1 = w - 9, base = cats.length * 14 + 2;
      const X = v => Math.round(x0 + v / top * (x1 - x0)), gap = X(step) - X(0), every = Math.max(1, Math.ceil((tw(N(top)) + 4) / gap));
      for (let v = 0, i = 0; v <= top + 1e-9; v += step, i++) { vl(c, X(v), 0, base, GRID); if (i % every === 0) lbl(c, N(v), X(v), base + 8, SOFT); }
      cats.forEach((s, i) => {
        const y = 3 + i * 14;
        if (vals[i] > 0) F.box(c, X(0) + 1, y, X(vals[i]) - X(0), 10, BARS[i % BARS.length]);
        lbl(c, s, lw, y + 6, INK, 'right');
      });
      vl(c, X(0), 0, base + 1, INK); hl(c, X(0), base, x1 - X(0) + 4, INK);
    } };
  }
  // Picture graph: each row a name and a row of icons (halves allowed), with the key underneath.
  function picFig(cats, counts, ic, key) {
    return { size: [150, cats.length * 12 + 16], fig: (c, w, h) => {
      const lw = Math.max(...cats.map(tw)) + 6;
      cats.forEach((s, i) => {
        const y = 2 + i * 12, whole = Math.floor(counts[i]);
        lbl(c, s, lw - 3, y + 5, INK, 'right');
        hl(c, lw, y + 11, w - lw - 2, GRID);
        for (let k = 0; k < whole; k++) F.icon(c, ic, lw + 3 + k * 11, y + 1);
        if (counts[i] % 1) iconPart(c, ic, lw + 3 + whole * 11, y + 1, 5);
      });
      vl(c, lw, 1, cats.length * 12 + 1, DIM);
      const ky = cats.length * 12 + 9, kx = Math.round(w / 2 - 20);
      F.icon(c, ic, kx, ky - 4); lbl(c, '= ' + key, kx + 12, ky + 1, HOT, 'left');
    } };
  }
  // Line plot: X's stacked over the marks lo, lo + 1/den, ... ; lab(k) names mark k.
  function plotFig(marksN, counts, lab) {
    const crowd = 144 / marksN < 26;
    return { size: [168, Math.max(52, 30 + Math.max(...counts) * 7 + (crowd ? 6 : 0))], fig: (c, w, h) => {
      const x0 = 14, x1 = w - 14, y = h - (crowd ? 23 : 15), X = k => Math.round(x0 + k * (x1 - x0) / marksN);
      F.line(c, x0 - 8, y, x1 + 8, y, INK);
      for (let k = 0; k <= marksN; k++) {
        tick(c, X(k), y, 2);
        lbl(c, lab(k), X(k), y + 9 + (crowd && k % 2 ? 8 : 0), SOFT);
        for (let i = 0; i < counts[k]; i++) xMark(c, X(k), y - 7 - i * 7, HOT);
      }
    } };
  }
  // A rectangle with its two sides labeled, drawn to scale.
  function rectFig(a, b, la, lb, o = {}) {
    return { size: o.size || [112, 64], fig: (c, w, h) => {
      const s = Math.min((w - 20 - tw(lb)) / a, (h - 22) / b), rw = Math.max(6, Math.round(a * s)), rh = Math.max(6, Math.round(b * s));
      const x = Math.round((w - tw(lb) - 6 - rw) / 2), y = Math.round((h - rh) / 2) + 4;
      F.box(c, x, y, rw, rh, o.fill || FILL);
      if (o.grid) { for (let i = 1; i < a; i++) vl(c, x + Math.round(i * rw / a), y, rh, DIM); for (let j = 1; j < b; j++) hl(c, x, y + Math.round(j * rh / b), rw, DIM); }
      frame(c, x, y, rw + 1, rh + 1, INK);
      if (la) lbl(c, la, x + rw / 2, y - 6); if (lb) lbl(c, lb, x + rw + 4 + tw(lb) / 2, y + rh / 2 + 1);
    } };
  }
  // A polygon given in units, scaled to the box, filled, with side labels.
  function polyFig(ptsU, labs, o = {}) {
    return { size: o.size || [120, 64], fig: (c, w, h) => {
      const P = fit(ptsU, w, h, o.px || 26, o.py || 12);
      if (o.cells) { // unit squares inside a rectilinear shape
        const s = (P[1][0] - P[0][0]) / (ptsU[1][0] - ptsU[0][0]) || (P[1][1] - P[0][1]) / (ptsU[1][1] - ptsU[0][1]);
        const xs = ptsU.map(p => p[0]), ys = ptsU.map(p => p[1]), ux = Math.min(...xs), uy = Math.min(...ys), bx = Math.min(...P.map(p => p[0])), by = Math.min(...P.map(p => p[1]));
        for (let j = 0; j < Math.max(...ys) - uy; j++) for (let i = 0; i < Math.max(...xs) - ux; i++)
          if (inside(ptsU, ux + i + .5, uy + j + .5)) { F.box(c, bx + Math.round(i * s), by + Math.round(j * s), Math.round((i + 1) * s) - Math.round(i * s), Math.round((j + 1) * s) - Math.round(j * s), FILL); frame(c, bx + Math.round(i * s), by + Math.round(j * s), Math.round((i + 1) * s) - Math.round(i * s) + 1, Math.round((j + 1) * s) - Math.round(j * s) + 1, DIM); }
        F.outlinePoly(c, P, INK);
      } else shape(c, P, o.fill || FILL);
      if (o.marks) marks(c, P, o.ticks);
      sideLabels(c, P, labs, o.col || INK);
    } };
  }
  // An L-shaped room: a W x H rectangle with a cw x ch corner cut away, flipped at random.
  function lShape(W, H, cw, ch) {
    const fx = rand() < .5, fy = rand() < .5;
    const raw = [[0, 0], [W - cw, 0], [W - cw, ch], [W, ch], [W, H], [0, H]];
    const pts = raw.map(([x, y]) => [fx ? W - x : x, fy ? H - y : y]);
    if (fx !== fy) pts.reverse();
    // side lengths in the same order as pts
    const lens = pts.map((p, i) => { const q = pts[(i + 1) % pts.length]; return Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]); });
    return { pts, lens };
  }

  // ======== 3RD GRADE ========
  const G3 = {};
  const ICONS = Object.keys(F.ICON_NAMES);
  function groupsFig(g, m, ic) {
    const cols = m <= 4 ? 2 : 3, rows = Math.ceil(m / cols), gw = cols * 10 + 5, gh = rows * 10 + 5;
    return { size: [Math.max(100, g * gw + (g - 1) * 5 + 8), Math.max(40, gh + 8)], fig: (c, w, h) => {
      const x0 = Math.round((w - (g * gw + (g - 1) * 5)) / 2), y0 = Math.round((h - gh) / 2);
      for (let k = 0; k < g; k++) {
        const x = x0 + k * (gw + 5);
        roundBox(c, x, y0, gw, gh, SOFT);
        for (let i = 0; i < m; i++) F.icon(c, ic, x + 3 + (i % cols) * 10, y0 + 3 + Math.floor(i / cols) * 10);
      }
    } };
  }
  const rep = (v, k) => Array(k).fill(v).join(' + ');

  // 3.OA.1: equal groups, as multiplication and as repeated addition.
  G3.equalGroups = d => {
    const ic = pick(ICONS), what = F.ICON_NAMES[ic], g = R(2, d < 2 ? 4 : 5), m = R(2, g === 5 ? 4 : [4, 5, 6, 9][d - 1]), t = g * m;
    const base = { topic: 'MULTIPLY', ...groupsFig(g, m, ic) }, form = R(0, d < 2 ? 1 : 2);
    if (form === 0) return { ...base, text: `How many ${what} are there in all?`, ...nums(t, [g + m, t + m, t - m, t + 1]),
      steps: [`There are ${g} groups with ${m} ${what} in each.`, `${g} groups of ${m} is ${g} × ${m}.`, `${g} × ${m} = ${t}`] };
    if (form === 1) return { ...base, text: 'Which multiplication sentence matches the picture?',
      ...txt(`${g} × ${m} = ${t}`, [`${g} + ${m} = ${g + m}`, `${g} × ${m + 1} = ${g * (m + 1)}`, `${g + 1} × ${m} = ${(g + 1) * m}`, `${m} × ${m} = ${m * m}`, `${g} × ${g} = ${g * g}`]),
      steps: [`Count the groups: ${g}. Count one group: ${m}.`, `${g} groups of ${m} is ${g} × ${m} = ${t}.`] };
    return { ...base, text: 'Which addition sentence matches the picture?',
      ...txt(`${rep(m, g)} = ${t}`, [`${g} + ${m} = ${g + m}`, `${rep(m, g + 1)} = ${t + m}`, `${rep(m + 1, g)} = ${t + g}`, g > 2 ? `${rep(m, g - 1)} = ${t - m}` : null, g !== m ? `${rep(g, g)} = ${g * g}` : null, `${rep(m, g + 2)} = ${t + 2 * m}`, `${rep(m + 2, g)} = ${t + 2 * g}`]),
      steps: [`There are ${g} groups of ${m}.`, `Add ${m} once for each group: ${rep(m, g)} = ${t}.`] };
  };

  // 3.OA.1, 3.OA.3: arrays.
  G3.arrays = d => {
    const r = R(2, [4, 5, 7, 9][d - 1]), co = R(2, [5, 6, 8, 10][d - 1]), t = r * co, form = R(0, 3);
    const icon = r <= 6 && co <= 8 && rand() < .6, ic = pick(ICONS), sp = icon ? 11 : 8, what = icon ? F.ICON_NAMES[ic] : 'dots';
    const fig = { size: [Math.max(100, co * sp + 10), Math.max(48, r * sp + 8)], fig: (c, w, h) => {
      const x0 = Math.round((w - co * sp) / 2) + 1, y0 = Math.round((h - r * sp) / 2) + 1;
      for (let j = 0; j < r; j++) for (let i = 0; i < co; i++) icon ? F.icon(c, ic, x0 + i * sp, y0 + j * sp) : F.disc(c, x0 + i * sp + 2, y0 + j * sp + 2, 2, HOT);
    } };
    const steps = [`There are ${r} rows with ${co} in each row.`, `${r} × ${co} = ${t}`];
    if (form === 0) return { topic: 'ARRAYS', ...fig, text: `How many ${what} are in the array?`, ...nums(t, [r + co, t + r, t - co, t + co]), steps };
    if (form === 1) return { topic: 'ARRAYS', ...fig, text: `Which multiplication matches the array?`,
      ...txt(`${r} × ${co}`, [`${r} + ${co}`, `${r} × ${co + 1}`, `${r + 1} × ${co}`, `${r - 1} × ${co}`, `${co} + ${co}`]), steps: [`Count the rows: ${r}.`, `Count one row: ${co}.`, `${r} rows of ${co} is ${r} × ${co}.`] };
    if (form === 2) {
      const S = pick([['The garden has', 'tomato plants', 'plants'], ['A sheet has', 'stickers', 'stickers'], ['The theater has', 'seats', 'seats'], ['A muffin pan has', 'cups', 'cups'], ['The arcade has', 'games', 'games']]);
      return { topic: 'ARRAYS', text: `${S[0]} ${r} rows of ${S[1]}, with ${co} in each row. How many ${S[2]} are there?`, ...nums(t, [r + co, t + r, t - co, t + co]), steps };
    }
    return { topic: 'ARRAYS', text: `An array of ${t} dots has ${r} equal rows. How many dots are in each row?`, ...nums(co, [r, t - r, co + 1, co - 1]),
      steps: [`${r} rows × ? dots = ${t}`, `${r} × ${co} = ${t}`, `So each row has ${co} dots.`] };
  };

  // 3.OA.2: division as sharing and as making groups.
  G3.divideGroups = d => {
    const ic = pick(ICONS), what = F.ICON_NAMES[ic], g = R(2, d < 2 ? 4 : 5), m = R(2, g === 5 ? 4 : [4, 5, 6, 6][d - 1]), t = g * m, form = R(0, 2);
    if (form === 2) return { topic: 'DIVIDE', ...groupsFig(g, m, ic), text: `${t} ${what} are shared equally. Which division sentence matches the picture?`,
      ...txt(`${t} ÷ ${g} = ${m}`, [`${t} - ${g} = ${t - g}`, `${t} + ${g} = ${t + g}`, `${t} ÷ ${g} = ${m + 1}`, `${t} × ${g} = ${t * g}`]),
      steps: [`${t} ${what} in ${g} equal groups.`, `Each group has ${m}.`, `${t} ÷ ${g} = ${m}`] };
    const perRow = t > 12 ? 6 : t > 8 ? 4 : t, rows = Math.ceil(t / perRow);
    const fig = { size: [100, Math.max(40, rows * 11 + 8)], fig: (c, w, h) => {
      const x0 = Math.round((w - perRow * 11) / 2) + 1, y0 = Math.round((h - rows * 11) / 2) + 1;
      for (let i = 0; i < t; i++) F.icon(c, ic, x0 + (i % perRow) * 11, y0 + Math.floor(i / perRow) * 11);
    } };
    if (form === 0) return { topic: 'DIVIDE', ...fig, text: `Share these ${t} ${what} equally among ${g} friends. How many does each friend get?`,
      ...nums(m, [g, m + 1, m - 1, t - g]), steps: [`Hand them out one at a time to ${g} friends.`, `${t} ÷ ${g} = ${m}`, `Check: ${g} × ${m} = ${t}`] };
    return { topic: 'DIVIDE', ...fig, text: `Put these ${t} ${what} into groups of ${m}. How many groups can you make?`,
      ...nums(g, [m, g + 1, g - 1, t - m]), steps: [`Circle ${m} at a time.`, `${t} ÷ ${m} = ${g}`, `Check: ${g} × ${m} = ${t}`] };
  };

  function factPair(d) {
    const P = [[0, 1, 2, 5, 10], [2, 3, 4, 5, 10], [3, 4, 6, 7, 8, 9], [6, 7, 8, 9]][d - 1];
    let a = pick(P), b = d === 4 ? R(4, 9) : R(d === 1 ? 1 : 2, 10);
    if (rand() < .5) [a, b] = [b, a];
    return [a, b];
  }
  function multSteps(a, b) {
    if (a === 0 || b === 0) return ['Zero groups, or groups of zero, make 0.', `${a} × ${b} = 0`];
    if (a === 1 || b === 1) return ['One group of a number is that number.', `${a} × ${b} = ${a * b}`];
    const [s, k] = a <= b ? [a, b] : [b, a];
    return [`${a} × ${b}: skip-count by ${k}, ${s} times.`, range(s).map(i => (i + 1) * k).join(', '), `${a} × ${b} = ${a * b}`];
  }
  // 3.OA.7: multiplication facts.
  G3.multFacts = d => {
    const [a, b] = factPair(d), p = a * b, form = R(0, d < 2 ? 1 : 2), wr = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a + b, p + 10];
    if (form === 0) return { topic: 'MULTIPLY', text: `${a} × ${b} = ?`, ...nums(p, wr), steps: multSteps(a, b) };
    if (form === 1) return { topic: 'MULTIPLY', text: `What is the product of ${a} and ${b}?`, ...nums(p, wr), steps: ['The product is the answer when you multiply.', ...multSteps(a, b).slice(-2)] };
    const wrongs = [];
    for (let i = 0; i < 20 && wrongs.length < 5; i++) {
      const [x, y] = factPair(d), off = pick([x, y, -x, -y, 1, -1, 10].filter(v => v)), v = x * y + off;
      if (v >= 0) wrongs.push(`${x} × ${y} = ${v}`);
    }
    wrongs.push(`${a} × ${b} = ${p + 1}`, `${a} × ${b} = ${p + 2}`, `${a} × ${b} = ${p + 10}`);
    return { topic: 'MULTIPLY', text: 'Which multiplication fact is true?', ...txt(`${a} × ${b} = ${p}`, wrongs), steps: [`${a} × ${b} = ${p}, so that one is true.`, 'Check each of the others: they are off.'] };
  };
  // 3.OA.7: division facts.
  G3.divFacts = d => {
    let [a, b] = factPair(d);
    if (b === 0) [a, b] = [b, a];
    if (b === 0) b = R(2, 9);
    const p = a * b, form = R(0, d < 2 ? 0 : 1);
    const steps = b === 1 ? ['Any number divided by 1 is itself.', `${p} ÷ 1 = ${p}`] : p === 0 ? ['0 shared into any number of groups is 0.', `0 ÷ ${b} = 0`]
      : [`Think: ${b} × ? = ${p}`, `${b} × ${a} = ${p}`, `So ${p} ÷ ${b} = ${a}`];
    if (form === 0) return { topic: 'DIVIDE', text: `${p} ÷ ${b} = ?`, ...nums(a, [a + 1, a - 1, b, p - b, p]), steps };
    const wrongs = [];
    for (let i = 0; i < 20 && wrongs.length < 5; i++) { const [x, y0] = factPair(d), y = y0 || 2, q = x + pick([1, -1, 2]); if (q >= 0 && q !== x) wrongs.push(`${x * y} ÷ ${y} = ${q}`); }
    wrongs.push(`${p} ÷ ${b} = ${a + 1}`, `${p} ÷ ${b} = ${a + 2}`);
    return { topic: 'DIVIDE', text: 'Which division fact is true?', ...txt(`${p} ÷ ${b} = ${a}`, wrongs), steps };
  };
  // 3.OA.4, 3.OA.6: the unknown number in a multiplication or division sentence.
  G3.missingFactor = d => {
    let [a, b] = factPair(Math.min(4, d + 1));
    a = a || 3; b = b || 4;
    const p = a * b, v = pick(['?', 'n', 'm', 'k']), form = R(0, d < 2 ? 1 : 4);
    if (form === 0) return { topic: 'MISSING NUMBER', text: `${a} × ${v} = ${p}. What number is ${v}?`, ...nums(b, [p - a, b + 1, b - 1, a, p + a]),
      steps: [`Think: ${a} times what makes ${p}?`, `${a} × ${b} = ${p}`, `So ${v} = ${b}`] };
    if (form === 1) return { topic: 'MISSING NUMBER', text: `${v} × ${b} = ${p}. What number is ${v}?`, ...nums(a, [p - b, a + 1, a - 1, b]),
      steps: [`What times ${b} makes ${p}?`, `${a} × ${b} = ${p}`, `So ${v} = ${a}`] };
    if (form === 2) return { topic: 'MISSING NUMBER', text: `${p} ÷ ${v} = ${a}. What number is ${v}?`, ...nums(b, [p - a, a, b + 1, b - 1]),
      steps: [`${p} split into ${v} groups gives ${a} in each.`, `${a} × ${b} = ${p}`, `So ${v} = ${b}`] };
    if (form === 3) return { topic: 'MISSING NUMBER', text: `${v} ÷ ${b} = ${a}. What number is ${v}?`, ...nums(p, [a + b, a, p + b, p - a]),
      steps: [`Undo the division: multiply.`, `${v} = ${a} × ${b} = ${p}`] };
    return { topic: 'MISSING NUMBER', text: `Which multiplication fact helps you solve ${p} ÷ ${b}?`,
      ...txt(`${b} × ${a} = ${p}`, [`${b} × ${a + 1} = ${b * (a + 1)}`, `${b} × ${a - 1} = ${b * (a - 1)}`, `${p} × ${b} = ${p * b}`, `${b} × ${b} = ${b * b}`, `${a + 1} × ${a + 1} = ${(a + 1) * (a + 1)}`]),
      steps: [`${p} ÷ ${b} asks: ${b} times what is ${p}?`, `${b} × ${a} = ${p}, so ${p} ÷ ${b} = ${a}.`] };
  };
  // 3.OA.5: the properties of multiplication.
  G3.properties = d => {
    const form = R(0, [1, 2, 3, 4][d - 1]);
    if (form === 0) {
      const a = d === 1 ? R(2, 12) : R(13, 99), v = R(0, 3);
      if (v === 0) return { topic: 'PROPERTIES', text: `${a} × 0 = ?`, ...nums(0, [a, 1, a * 10]), steps: ['Any number times 0 is 0.', `${a} groups of nothing is nothing: ${a} × 0 = 0.`] };
      if (v === 1) return { topic: 'PROPERTIES', text: `${a} × 1 = ?`, ...nums(a, [1, a + 1, 0, a * 10]), steps: ['Any number times 1 is that number.', `${a} × 1 = ${a}`] };
      if (v === 2) return { topic: 'PROPERTIES', text: `0 ÷ ${a} = ?`, ...nums(0, [a, 1, a * 10]), steps: [`0 shared among ${a} groups is 0 in each.`, `0 ÷ ${a} = 0`] };
      return { topic: 'PROPERTIES', text: `${a} ÷ 1 = ?`, ...nums(a, [1, 0, a + 1, a * 10]), steps: ['Any number divided by 1 is that number.', `${a} ÷ 1 = ${a}`] };
    }
    if (form === 1) {
      const a = R(2, 9); let b; do b = R(2, 9); while (b === a);
      return { topic: 'PROPERTIES', text: `${a} × ${b} = ${b} × ?`, ...nums(a, [b, a * b, a + b, a + 1]), steps: ['You can multiply in any order.', `${a} × ${b} and ${b} × ${a} both make ${a * b}.`, `So ? = ${a}`] };
    }
    if (form === 2) {
      const [a, b, c] = shuffle([2, 3, 4, 5, 6].slice()).slice(0, 3);
      return { topic: 'PROPERTIES', text: `(${a} × ${b}) × ${c} = ${a} × (? × ${c})`, ...nums(b, [a, c, a * b, b * c]),
        steps: ['You can group the factors either way.', `(${a} × ${b}) × ${c} = ${a} × (${b} × ${c})`, `Both make ${a * b * c}. ? = ${b}`] };
    }
    const a = R(3, 9), b = R(6, 9), b1 = R(2, b - 2), b2 = b - b1;
    if (form === 3) return { topic: 'PROPERTIES', text: `${a} × ${b} = ${a} × ${b1} + ${a} × ?`, ...nums(b2, [b, b1, a * b2, b2 + 1]),
      steps: [`Break ${b} into ${b1} + ${b2}.`, `${a} × ${b} = ${a} × ${b1} + ${a} × ${b2}`, `${a * b1} + ${a * b2} = ${a * b}`] };
    const cands = [[`${a} × ${b1} + ${b2}`, a * b1 + b2], [`${a} × ${b1} × ${b2}`, a * b1 * b2], [`${a} + ${b1} + ${b2}`, a + b1 + b2], [`${a} × ${b1} + ${a}`, a * b1 + a], [`${a} × ${b2} + ${b1}`, a * b2 + b1]];
    return { topic: 'PROPERTIES', text: `Which is equal to ${a} × ${b}?`, ...txt(`${a} × ${b1} + ${a} × ${b2}`, cands.filter(x => x[1] !== a * b).map(x => x[0])),
      steps: [`Break ${b} into ${b1} + ${b2}.`, `${a} × ${b} = ${a} × ${b1} + ${a} × ${b2}`, `${a * b1} + ${a * b2} = ${a * b}`] };
  };

  const MULT = [
    [(n, a, b) => `${n} has ${a} packs of cards. Each pack has ${b} cards. How many cards does ${n} have?`, N],
    [(n, a, b) => `The arcade has ${a} rows of games, with ${b} games in each row. How many games are there?`, N],
    [(n, a, b) => `Each robot ${n} builds needs ${b} wheels. How many wheels does ${n} need for ${a} robots?`, N],
    [(n, a, b) => `A box holds ${b} crayons. How many crayons are in ${a} boxes?`, N],
    [(n, a, b) => `${n} reads ${b} pages every day for ${a} days. How many pages is that?`, N],
    [(n, a, b) => `There are ${a} tables at the party, and ${b} kids sit at each one. How many kids are there?`, N],
    [(n, a, b) => `Each ribbon is ${b} feet long. ${n} has ${a} ribbons. How many feet of ribbon is that?`, N],
    [(n, a, b) => `A comic book costs $${b}. How much do ${a} comic books cost?`, dol],
    [(n, a, b) => `The class pet hamster eats ${b} seeds a day. How many seeds does it eat in ${a} days?`, N],
  ];
  // 3.OA.3: multiplication word problems.
  G3.multWord = d => {
    const [t, fmt] = pick(MULT), n = who(), a = R(2, [5, 7, 9, 10][d - 1]), b = R(2, [5, 8, 9, 10][d - 1]), p = a * b;
    return { topic: 'WORD PROBLEM', text: t(n, a, b), ...nums(p, [a + b, p + b, p - b, p + a], fmt), steps: [`${a} groups of ${b}.`, `${a} × ${b} = ${p}`] };
  };
  const DIV = [
    [(n, t, b) => `${n} shares ${t} stickers equally among ${b} friends. How many stickers does each friend get?`, 0],
    [(n, t, b) => `${t} kids split into ${b} equal teams. How many kids are on each team?`, 0],
    [(n, t, b) => `A ${t}-inch ribbon is cut into ${b} equal pieces. How many inches long is each piece?`, 0],
    [(n, t, b) => `${n} puts ${t} cupcakes on trays, ${b} on each tray. How many trays does ${n} fill?`, 1],
    [(n, t, b) => `A video game costs ${b} tokens. ${n} has ${t} tokens. How many games can ${n} play?`, 1],
    [(n, t, b) => `${n} has $${t}. Each toy dinosaur costs $${b}. How many dinosaurs can ${n} buy?`, 1],
    [(n, t, b) => `${t} soccer balls are packed ${b} to a bag. How many bags are there?`, 1],
  ];
  // 3.OA.3: division word problems, both kinds.
  G3.divWord = d => {
    const [f, how] = pick(DIV), n = who(), b = R(2, [5, 6, 9, 9][d - 1]), q = R(2, [5, 8, 9, 10][d - 1]), t = b * q;
    return { topic: 'WORD PROBLEM', text: f(n, t, b), ...nums(q, [q + 1, q - 1, t - b, b, t + b]),
      steps: [how ? `How many groups of ${b} are in ${t}?` : `Split ${t} into ${b} equal groups.`, `${t} ÷ ${b} = ${q}`, `Check: ${b} × ${q} = ${t}`] };
  };
  // 3.OA.8: two-step word problems, some with a letter for the unknown.
  G3.twoStep = d => {
    const n = who(), T = R(0, 5), eq = d >= 3 && rand() < .4;
    if (T === 0) {
      const a = R(12, 60), g = R(2, 6), m = R(3, 9), ans = a + g * m;
      const text = `${n} has ${a} stickers and buys ${g} packs with ${m} stickers in each. How many stickers does ${n} have now?`;
      if (eq) return { topic: 'WORD PROBLEM', text: `${n} has ${a} stickers and buys ${g} packs with ${m} stickers in each. Which equation finds s, the number of stickers ${n} has now?`,
        ...txt(`s = ${a} + ${g} × ${m}`, [`s = ${a} + ${g} + ${m}`, `s = ${a} - ${g} × ${m}`, `s = ${a} × ${g} + ${m}`, `s = ${g} × ${m} - ${a}`]),
        steps: [`The packs make ${g} × ${m} stickers.`, `Add the ${a} ${n} already had: s = ${a} + ${g} × ${m}.`, `s = ${a} + ${g * m} = ${ans}`] };
      return { topic: 'WORD PROBLEM', text, ...nums(ans, [a + g + m, g * m, a + m, ans + m]), steps: [`The packs: ${g} × ${m} = ${g * m}`, `Add them on: ${a} + ${g * m} = ${ans}`] };
    }
    if (T === 1) {
      const g = R(2, 5), m = R(3, 9), sp = g * m, a = sp + R(3, 40), ans = a - sp;
      return { topic: 'WORD PROBLEM', text: `${n} has $${a} and buys ${g} books that cost $${m} each. How much money is left?`,
        ...nums(ans, [sp, a - m, a - g - m, ans + m], dol), steps: [`The books cost ${g} × $${m} = $${sp}.`, `$${a} - $${sp} = $${ans}`] };
    }
    if (T === 2) {
      const m = R(3, 6), q = R(3, 9), t = m * q, a = R(Math.ceil(t / 2), t - 2), b = t - a;
      return { topic: 'WORD PROBLEM', text: `There are ${a} kids in the gym, and ${b} more come in. They make teams of ${m}. How many teams are there?`,
        ...nums(q, [t, q + 1, q - 1, Math.floor(a / m) + b]), steps: [`First: ${a} + ${b} = ${t} kids.`, `Then: ${t} ÷ ${m} = ${q} teams.`] };
    }
    if (T === 3) {
      const m = R(3, 6), q = R(3, 8), b = R(2, 9), a = m * q + b;
      return { topic: 'WORD PROBLEM', text: `${n} bakes ${a} cookies and eats ${b}. The rest go in bags of ${m}. How many bags does ${n} fill?`,
        ...nums(q, [Math.round(a / m), q + 1, q - 1, a - b, q + b]), steps: [`Cookies left: ${a} - ${b} = ${a - b}`, `Bags: ${a - b} ÷ ${m} = ${q}`] };
    }
    if (T === 4) {
      const r = R(3, 8), co = R(4, 9), e = R(3, 15), ans = r * co - e;
      const text = `A room has ${r} rows of ${co} chairs. ${e} chairs are empty.`;
      if (eq) return { topic: 'WORD PROBLEM', text: text + ' Which equation finds k, the number of chairs with kids in them?',
        ...txt(`${r} × ${co} - ${e} = k`, [`${r} + ${co} - ${e} = k`, `${r} × ${co} + ${e} = k`, `${r} × ${e} - ${co} = k`, `${co} - ${e} × ${r} = k`]),
        steps: [`All the chairs: ${r} × ${co} = ${r * co}.`, `Take away the ${e} empty ones: ${r} × ${co} - ${e} = k.`, `k = ${ans}`] };
      return { topic: 'WORD PROBLEM', text: text + ' How many chairs have kids in them?', ...nums(ans, [r * co + e, r * co, ans - co, ans + 10]),
        steps: [`All the chairs: ${r} × ${co} = ${r * co}`, `Take away the empty ones: ${r * co} - ${e} = ${ans}`] };
    }
    const p = R(3, 9), q = p + R(2, 6), k = R(2, 5), ans = k * p + q;
    return { topic: 'WORD PROBLEM', text: `At the zoo, kid tickets cost $${p} and grown-up tickets cost $${q}. What do ${k} kid tickets and 1 grown-up ticket cost?`,
      ...nums(ans, [k * (p + q), k + p + q, k * p, (k + 1) * q], dol), steps: [`Kids: ${k} × $${p} = $${k * p}`, `Add the grown-up: $${k * p} + $${q} = $${ans}`] };
  };
  // 3.OA.8 and 3.NBT.1: estimating by rounding first.
  G3.estimate = d => {
    const p = d >= 2 && rand() < .6 ? 100 : 10, word = p === 100 ? 'hundred' : 'ten', add = rand() < .55;
    const mk = () => p === 100 ? R(1, 8) * 100 + R(1, 99) : (d === 1 ? R(1, 9) * 10 : R(10, 89) * 10) + R(1, 9);
    let a = mk(), b = mk();
    if (!add && a < b) [a, b] = [b, a];
    if (!add && rnd(a, p) === rnd(b, p)) a += p;
    const ra = rnd(a, p), rb = rnd(b, p), ans = add ? ra + rb : ra - rb, exact = add ? a + b : a - b, op = add ? '+' : '-';
    const tr = v => Math.floor(v / p) * p, wr = [exact, add ? tr(a) + tr(b) : tr(a) - tr(b), ans + p, ans - p, add ? rnd(a, p * 10) + rnd(b, p * 10) : rnd(a, p * 10) - rnd(b, p * 10)];
    const n = who(), S = add ? pick([`The school library has ${a} books and gets ${b} more.`, `${n} scored ${a} points in one game and ${b} in the next.`, `A farm stand sold ${a} apples on Saturday and ${b} on Sunday.`])
      : pick([`The arcade had ${a} prizes and gave away ${b}.`, `A pool held ${a} balls, and kids took out ${b}.`, `${n} had ${a} tickets and spent ${b}.`]);
    const ask = add ? 'About how many in all?' : 'About how many are left?';
    return { topic: 'ESTIMATE', text: rand() < .5 ? `Estimate ${a} ${op} ${b} by rounding each number to the nearest ${word}.` : `${S} ${ask} Round each number to the nearest ${word}.`,
      ...nums(ans, wr), steps: [`${a} rounds to ${ra}. ${b} rounds to ${rb}.`, `${ra} ${op} ${rb} = ${ans}`, `(The exact answer is ${exact}: close!)`] };
  };
  const RULES_T = ['Any number times 2 is even.', 'Any number times 4 is even.', 'Any number times 10 ends in 0.', 'Even + even is always even.', 'Odd + odd is always even.',
    'Odd × odd is always odd.', 'Even × any number is even.', 'Multiples of 5 end in 0 or 5.', 'Odd + even is always odd.', 'Any number times 6 is even.'];
  const RULES_F = ['Any number times 3 is odd.', 'Any number times 5 is odd.', 'Odd + odd is always odd.', 'Even + odd is always even.', 'Odd × odd is always even.',
    'Multiples of 4 end in 4 or 8.', 'Any number times 9 is odd.', 'Multiples of 3 are always odd.', 'Even × even is always odd.', 'Any number times 7 is odd.'];
  const WHY_T = { 'Any number times 2 is even.': 'Doubles are always even: 2, 4, 6, 8...', 'Any number times 4 is even.': '4 is 2 + 2, so its products are doubles: even.',
    'Any number times 10 ends in 0.': '10, 20, 30, 40...: every one ends in 0.', 'Even + even is always even.': 'Pairs plus pairs leave no one out: 4 + 6 = 10.',
    'Odd + odd is always even.': 'The two leftovers pair up: 3 + 5 = 8.', 'Odd × odd is always odd.': '3 × 5 = 15, 7 × 9 = 63: odd every time.',
    'Even × any number is even.': 'Groups of an even number always pair up.', 'Multiples of 5 end in 0 or 5.': '5, 10, 15, 20, 25...',
    'Odd + even is always odd.': 'The odd one has one left over: 3 + 4 = 7.', 'Any number times 6 is even.': '6 is even, so 6, 12, 18, 24... are all even.' };
  // 3.OA.9: patterns in counting and in the times tables.
  G3.patterns = d => {
    const form = R(0, d < 2 ? 1 : 2);
    if (form === 0) {
      const k = R(2, d < 2 ? 5 : 10), down = d >= 2 && rand() < .35, s = down ? R(4 * k + 2, 4 * k + 40) : R(1, 25), seq = range(5).map(i => down ? s - i * k : s + i * k);
      const miss = d >= 3 ? R(1, 4) : 4, ans = seq[miss];
      return { topic: 'PATTERNS', text: `What number is missing from the pattern?  ${seq.map((v, i) => i === miss ? '?' : v).join(', ')}`,
        ...nums(ans, [ans + 1, ans - 1, down ? ans - k : ans + k, down ? ans + k : ans - k]),
        steps: [`Each number is ${k} ${down ? 'less' : 'more'} than the one before.`, `${seq[miss - 1]} ${down ? '-' : '+'} ${k} = ${ans}`] };
    }
    if (form === 1) {
      const right = pick(RULES_T);
      return { topic: 'PATTERNS', text: 'Which of these is always true?', ...txt(right, shuffle(RULES_F.slice())), steps: [right, WHY_T[right]] };
    }
    const b = R(3, 9), a = R(2, 8), dbl = rand() < .4 && a <= 5;
    if (dbl) return { topic: 'PATTERNS', text: `${a} × ${b} = ${a * b}. What is ${2 * a} × ${b}?`, ...nums(2 * a * b, [a * b + a, a * b + b, a * b + 2, a * b * 4]),
      steps: [`${2 * a} is double ${a}, so the answer is double ${a * b}.`, `${a * b} + ${a * b} = ${2 * a * b}`] };
    return { topic: 'PATTERNS', text: `${a} × ${b} = ${a * b}. What is ${a + 1} × ${b}?`, ...nums((a + 1) * b, [a * b + 1, a * b + a, (a + 2) * b, a * b + 10]),
      steps: [`${a + 1} × ${b} is one more group of ${b} than ${a} × ${b}.`, `${a * b} + ${b} = ${(a + 1) * b}`] };
  };
  // 3.NBT.1: rounding to the nearest 10 or 100.
  G3.round = d => {
    const p = d === 1 ? 10 : pick([10, 100, 100]), word = p === 10 ? 'ten' : 'hundred';
    const n = p === 10 ? (d === 1 ? R(1, 9) * 10 : R(10, 99) * 10) + R(1, 9) : R(1, 9) * 100 + R(1, 99), ans = rnd(n, p);
    const lo = Math.floor(n / p) * p, other = ans === lo ? lo + p : lo, form = R(0, d < 2 ? 1 : 3);
    const why = [`${n} is between ${lo} and ${lo + p}.`, n % p === p / 2 ? `It is exactly halfway, and halfway rounds up.` : n % p > p / 2 ? `It is closer to ${lo + p}, so round up.` : `It is closer to ${lo}, so round down.`, `${n} rounds to ${ans}.`];
    if (form === 1) return { topic: 'ROUNDING', text: `Round the number on the number line to the nearest ${word}.`, ...nums(ans, [other, rnd(n, p === 10 ? 100 : 10), ans + p, n]), steps: why,
      size: [168, 40], fig: (c, w, h) => {
        const y = 20, X = nline(c, 14, w - 14, y, lo, lo + p);
        for (let k = 0; k <= 10; k++) tick(c, X(lo + k * p / 10), y, k % 5 ? 2 : 4);
        lbl(c, lo, X(lo), y + 11, SOFT); lbl(c, lo + p, X(lo + p), y + 11, SOFT); lbl(c, lo + p / 2, X(lo + p / 2), y + 11, DIM);
        F.disc(c, X(n), y, 2, HOT); lbl(c, n, X(n), y - 10, HOT);
      } };
    if (form === 2) {
      const X0 = R(p === 10 ? 3 : 2, 9) * p + (p === 10 && d > 1 ? R(1, 8) * 100 : 0), h = p / 2;
      const right = X0 - h + R(0, p - 1);
      const wr = [X0 - h - R(1, Math.min(4, h)), X0 + h + R(0, Math.min(4, h - 1)), X0 + p + R(1, h - 1), X0 - p + R(1, h - 1)];
      if (p === 100) wr.unshift(X0 - h - R(1, 4));   // the trap: 347 rounds to 350 and then 400, but to the nearest hundred it is 300
      return { topic: 'ROUNDING', text: `Which number rounds to ${N(X0)} when rounded to the nearest ${word}?`, ...nums(right, wr.filter(v => rnd(v, p) !== X0)),
        steps: [`Numbers from ${N(X0 - h)} up to ${N(X0 + h - 1)} round to ${N(X0)}.`, `${N(right)} is in that range.`, `${N(X0 + h)} would round up; ${N(X0 - h - 1)} would round down.`] };
    }
    if (form === 3) {
      const S = pick([[`There are ${n} kids at Oak Street School.`, 'kids'], [`The robot club has ${n} parts.`, 'parts'], [`A jar holds ${n} jelly beans.`, 'jelly beans']]);
      return { topic: 'ROUNDING', text: `${S[0]} About how many ${S[1]} is that, to the nearest ${word}?`, ...nums(ans, [other, rnd(n, p === 10 ? 100 : 10), ans + p]), steps: why };
    }
    return { topic: 'ROUNDING', text: `Round ${n} to the nearest ${word}.`, ...nums(ans, [other, rnd(n, p === 10 ? 100 : 10), ans + p, ans - p]), steps: why };
  };

  const dig = (n, k) => range(k).map(i => Math.floor(n / 10 ** i) % 10);       // ones first
  const undig = a => a.reduceRight((s, v) => s * 10 + v, 0);
  const width = n => String(n).length;
  const noCarry = (a, b) => { const k = Math.max(width(a), width(b)), x = dig(a, k), y = dig(b, k); return undig(x.map((v, i) => (v + y[i]) % 10)); };
  const smallFromBig = (a, b) => { const k = width(a), x = dig(a, k), y = dig(b, k); return undig(x.map((v, i) => Math.abs(v - y[i]))); };
  const noBorrowDown = (a, b) => { const k = width(a), x = dig(a, k), y = dig(b, k); return undig(x.map((v, i) => (v - y[i] + 10) % 10)); };
  const carries = (a, b) => { let c = 0, n = 0; for (let i = 0; i < 8; i++) { c = (Math.floor(a / 10 ** i) % 10 + Math.floor(b / 10 ** i) % 10 + c) >= 10 ? 1 : 0; n += c; } return n; };
  const borrows = (a, b) => { let c = 0, n = 0; for (let i = 0; i < 8; i++) { c = (Math.floor(a / 10 ** i) % 10 - Math.floor(b / 10 ** i) % 10 - c) < 0 ? 1 : 0; n += c; } return n; };
  // Two numbers with digits lo..hi digits long and about `want` regroupings.
  function addPair(dA, dB, want, sub, max = Infinity) {
    let a, b;
    for (let i = 0; i < 60; i++) {
      a = R(10 ** (dA - 1), 10 ** dA - 1); b = R(10 ** (dB - 1), 10 ** dB - 1);
      if (sub && a < b) [a, b] = [b, a];
      if (sub && a === b) continue;
      if (!sub && a + b > max) continue;
      if ((sub ? borrows(a, b) : carries(a, b)) === want) break;
    }
    return [a, b];
  }
  function acrossZero(dA) {
    const a = R(1, 9) * 10 ** (dA - 1) + R(0, 9) * (dA > 3 ? 10 ** (dA - 2) : 0) + R(1, 9), b = R(10 ** (dA - 2), Math.floor(a * .9));
    return [a, b];
  }
  // Addition and subtraction with the slips kids make: no carrying, small-from-big, borrowing without paying back.
  function addSubQ(a, b, sub, word, fmt = N) {
    const ans = sub ? a - b : a + b, op = sub ? '-' : '+';
    const wr = sub ? [smallFromBig(a, b), noBorrowDown(a, b), ans + 10, ans - 10, ans + 100, a + b] : [noCarry(a, b), ans + 10, ans - 10, ans + 100, ans - 100, a - b];
    const steps = sub ? [`Line up the places and subtract from the ones.`, borrows(a, b) ? `Regroup when the top digit is smaller.` : 'No regrouping needed.', `${fmt(a)} - ${fmt(b)} = ${fmt(ans)}`]
      : ['Line up the places and add from the ones.', carries(a, b) ? 'When a place makes 10 or more, carry 1 to the next place.' : 'No regrouping needed.', `${fmt(a)} + ${fmt(b)} = ${fmt(ans)}`];
    return { topic: 'ADD & SUBTRACT', text: word || `${fmt(a)} ${op} ${fmt(b)} = ?`, ...nums(ans, wr, fmt), steps };
  }
  // 3.NBT.2: adding and subtracting within 1,000.
  G3.addSub = d => {
    const sub = rand() < .5, form = R(0, d < 2 ? 1 : 2), n = who();
    const [a, b] = sub && d === 4 && rand() < .6 ? acrossZero(3) : addPair(3, d < 2 ? 2 : 3, [0, 1, 2, 2][d - 1], sub, 999);
    if (form === 2) {
      if (sub) return { topic: 'ADD & SUBTRACT', text: `${N(a)} - ? = ${N(a - b)}. What is the missing number?`, ...nums(b, [a + (a - b), smallFromBig(a, a - b), b + 10, b - 10]),
        steps: [`${N(a)} take away what leaves ${N(a - b)}?`, `${N(a)} - ${N(a - b)} = ${N(b)}`, `Check: ${N(a)} - ${N(b)} = ${N(a - b)}`] };
      return { topic: 'ADD & SUBTRACT', text: `${N(a)} + ? = ${N(a + b)}. What is the missing number?`, ...nums(b, [2 * a + b, smallFromBig(a + b, a), b + 10, b - 10]),
        steps: [`Subtract to find it: ${N(a + b)} - ${N(a)}.`, `${N(a + b)} - ${N(a)} = ${N(b)}`, `Check: ${N(a)} + ${N(b)} = ${N(a + b)}`] };
    }
    if (form === 1) {
      const T = sub ? pick([`A video game level has ${a} coins. ${n} collects ${b}. How many coins are left?`, `The school has ${a} pencils and hands out ${b}. How many are left?`,
        `${n} needs ${a} points to win and has ${b}. How many more points does ${n} need?`]) : pick([`The library has ${a} books and gets ${b} more. How many books does it have now?`,
        `${n} rode ${a} miles in spring and ${b} miles in summer. How many miles in all?`, `A zoo had ${a} visitors on Monday and ${b} on Tuesday. How many in all?`]);
      return addSubQ(a, b, sub, T);
    }
    return addSubQ(a, b, sub);
  };
  // 3.NBT.3: a one-digit number times a multiple of 10.
  G3.times10 = d => {
    const a = R(2, 9), t = R(1, 9), b = t * 10, p = a * b, form = R(0, d < 2 ? 1 : 3), n = who();
    const wr = [a * t, p * 10, a + b, a * (b + 10), p + 10];
    const steps = [`${a} × ${b} is ${a} × ${t} tens.`, `${a} × ${t} = ${a * t}, so it's ${a * t} tens.`, `${a * t} tens = ${N(p)}`];
    if (form === 0) return { topic: 'MULTIPLY', text: `${a} × ${b} = ?`, ...nums(p, wr), steps };
    if (form === 1) return { topic: 'MULTIPLY', text: `${b} × ${a} = ?`, ...nums(p, wr), steps };
    if (form === 2) return { topic: 'MULTIPLY', text: pick([`${n} buys ${a} boxes of ${b} crayons. How many crayons is that?`, `Each bus holds ${b} kids. How many kids fit on ${a} buses?`, `A bag holds ${b} marbles. How many marbles are in ${a} bags?`]),
      ...nums(p, wr), steps };
    return { topic: 'MULTIPLY', text: `? × ${b} = ${N(p)}. What is the missing number?`, ...nums(a, [a * 10, t, a + 1, a - 1]), steps: [`${N(p)} is ${a * t} tens.`, `? × ${t} tens = ${a * t} tens, so ? = ${a}.`, `${a} × ${b} = ${N(p)}`] };
  };

  // ---- 3.NF fractions
  const DEN3 = [2, 3, 4, 6, 8];
  // 3.NF.1, 3.G.2: what fraction is shaded?
  G3.fracShaded = d => {
    const n = pick(d < 2 ? [2, 3, 4] : d < 3 ? DEN3 : [3, 4, 6, 8]), not = d >= 3 && rand() < .4, mix = d === 4 && rand() < .5;
    const k = d === 1 && rand() < .5 ? 1 : R(1, n - 1), set = mix ? shuffle(range(n)).slice(0, k) : range(k), ans = not ? n - k : k;
    if (d >= 2 && rand() < .2) {
      const b = pick(DEN3), a = R(2, b);
      return { topic: 'FRACTIONS', text: `How many 1/${b}s make ${fr(a, b)}?`, ...nums(a, [b, b - a, a + b, 1, a + 1]),
        steps: [`${fr(a, b)} means ${a} parts, each 1/${b} of the whole.`, `So ${a} pieces of 1/${b} make ${fr(a, b)}.`] };
    }
    const form = pick(n % 2 === 0 && n > 2 ? ['bar', 'pie', 'grid'] : ['bar', 'pie']);
    return { topic: 'FRACTIONS', text: not ? 'What fraction of the shape is NOT shaded?' : 'What fraction of the shape is shaded?',
      ...fracs([ans, n], [[n - ans, n], [ans, n - ans], [n, ans], [ans, n + 1], [ans + 1, n]]),
      steps: [`The shape has ${n} equal parts.`, `${ans} ${pl(ans, 'part is', 'parts are')} ${not ? 'not ' : ''}shaded.`, `So the fraction is ${fr(ans, n)}.`],
      size: [100, 56], fig: (c, w, h) => {
        if (form === 'bar') { const bw = n * Math.floor(84 / n) + 1; fbar(c, Math.round((w - bw) / 2), 18, bw, 20, n, set); }
        else if (form === 'pie') pie(c, Math.floor(w / 2), Math.floor(h / 2), 24, equal(n), set);
        else { const co = n / 2, s = 16; cellGrid(c, Math.round((w - co * s) / 2), Math.round((h - 2 * s) / 2), co, 2, s, (i, j) => set.includes(j * co + i)); }
      } };
  };
  // 3.G.2: which shape is cut into equal parts?
  G3.equalParts = d => {
    const n = pick(d < 2 ? [2, 3, 4] : [2, 3, 4, 6, 8]), shade = d >= 2 && rand() < .5, right = R(0, 3);
    const NAME = { 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 8: 'eighths', 10: 'tenths' };
    const uneven = k => { for (let t = 0; t < 30; t++) { const w = range(k).map(() => pick([1, 1, 2, 3])); if (w.includes(1) && Math.max(...w) >= 2) { const s = sum(w); return w.map(v => v / s); } } return k === 2 ? [.25, .75] : [...equal(k - 1).map(v => v / 2), .5]; };
    const wrongs = shuffle(['uneven', 'fewer', 'more', shade ? 'two' : 'uneven']);
    const panels = range(4).map(i => {
      const t = i === right ? 'right' : wrongs.pop(), kind = rand() < .5 ? 'bar' : 'pie';
      if (t === 'right') return { kind, parts: equal(n), on: shade ? [0] : [] };
      if (t === 'uneven') return { kind, parts: uneven(n), on: shade ? [0] : [] };
      if (t === 'two') return { kind, parts: equal(n), on: [0, 1] };
      const m = t === 'fewer' ? (n > 2 ? n - 1 : n + 2) : n + 1;
      return { kind, parts: equal(m), on: shade ? [0] : [] };
    });
    return { topic: 'FRACTIONS', text: shade ? `Which shape has 1/${n} shaded?` : `Which shape is split into ${NAME[n]}?`, ...picChoice(right),
      steps: [`${NAME[n][0].toUpperCase() + NAME[n].slice(1)} means ${n} equal parts.`, shade ? `Shape ${PICS[right]} has ${n} equal parts with 1 shaded.` : `Only shape ${PICS[right]} has ${n} parts that are all the same size.`],
      size: [168, 52], fig: (c, w, h) => panels.forEach((p, i) => {
        const cx = Math.round(w / 8 + i * w / 4);
        lbl(c, PICS[i], cx, 6, HOT);
        if (p.kind === 'bar') cutBar(c, cx - 17, 20, 35, 22, p.parts, p.on); else pie(c, cx, 31, 15, p.parts, p.on);
      }) };
  };
  function fracLine(den, wholes, draw) {
    return { size: [168, 42], fig: (c, w, h) => {
      const y = 25, top = den * wholes, X = nline(c, 14, w - 14, y, 0, top);
      for (let k = 0; k <= top; k++) { tick(c, X(k), y, k % den ? 2 : 4); if (k % den === 0) lbl(c, k / den, X(k), y + 11); }
      draw(c, X, y);
    } };
  }
  // 3.NF.2: fractions on a number line.
  G3.fracNumberLine = d => {
    let b = pick(d < 2 ? [2, 3, 4] : DEN3);
    const wholes = d >= 3 && b <= 4 && rand() < .5 ? 2 : 1, form = d >= 2 && rand() < .45 ? 1 : 0;
    if (form === 1 && b * wholes < 4) b = 4;
    const top = b * wholes;
    let a = R(1, top - 1); if (a === b && wholes > 1) a++;
    if (form === 0) return { topic: 'FRACTIONS', text: 'What fraction is at point P on the number line?',
      ...fracs([a, b], [[a, b + 1], [a + 1, b], [a - 1, b], [b, a], [a, top]]),
      steps: [`From 0 to 1 is cut into ${b} equal parts, so each jump is 1/${b}.`, `P is ${a} jumps from 0.`, `So P is at ${fr(a, b)}.`],
      ...fracLine(b, wholes, (c, X, y) => { F.disc(c, X(a), y, 2, HOT); lbl(c, 'P', X(a), y - 9, HOT); }) };
    const pos = [a];
    for (const v of shuffle([a - 1, a + 1, b - a, a + 2, a - 2, 2 * a, ...range(top + 1)])) if (pos.length < 4 && v >= 0 && v <= top && !pos.includes(v)) pos.push(v);
    pos.sort((p, q) => p - q);
    return { topic: 'FRACTIONS', text: `Which point is at ${fr(a, b)} on the number line?`, ...pointChoice(pos.indexOf(a)),
      steps: [`Each jump between marks is 1/${b}.`, `Count ${a} jumps from 0.`, `That's point ${POINTS[pos.indexOf(a)]}.`],
      ...fracLine(b, wholes, (c, X, y) => pos.forEach((v, i) => { F.disc(c, X(v), y, 2, HOT); lbl(c, POINTS[i], X(v), y - 9, HOT); })) };
  };
  // Equivalent fractions with bars, missing numbers and "which equals" (3.NF.3a,b and 4.NF.1).
  function equivPair(dens, maxDen) {
    for (let t = 0; t < 40; t++) {
      const b = pick(dens), a = R(1, b - 1), k = pick([2, 2, 3, 4, 5, 10]);
      if (gcd(a, b) === 1 && b * k <= maxDen && dens.includes(b * k)) return [a, b, k];
    }
    return [1, 2, 2];
  }
  function fracEquivKind(dens, maxDen, g4) {
    return d => {
      const [a, b, k] = equivPair(dens, maxDen), A = a * k, B = b * k, form = R(0, g4 ? (d < 2 ? 2 : 4) : (d < 2 ? 0 : 2));
      const why = [`Multiply the top and bottom by the same number.`, `${fr(a, b)} = ${fr(a + ' × ' + k, b + ' × ' + k)} = ${fr(A, B)}`];
      if (form === 0) {
        const bw = B * Math.floor(140 / B) + 1;
        return { topic: 'FRACTIONS', text: `The bars show ${fr(a, b)} = ?/${B}. Find the missing number.`, ...nums(A, [a + B - b, a, B - A, A + 1, A - 1]),
          steps: [`Both bars have the same amount shaded.`, `The bottom bar has ${A} of ${B} parts shaded.`, `So ${fr(a, b)} = ${fr(A, B)}.`],
          size: [168, 44], fig: (c, w, h) => { const x = Math.round((w - bw) / 2); fbar(c, x, 5, bw, 14, b, a); fbar(c, x, 25, bw, 14, B, A, GRN); } };
      }
      if (form === 1) return { topic: 'FRACTIONS', text: `Which fraction is equal to ${fr(a, b)}?`, ...fracs([A, B], [[a + k, b + k], [A, b], [a, B], [A + 1, B], [B - A, B], [b, a]]), steps: why };
      if (form === 2) return rand() < .5 ? { topic: 'FRACTIONS', text: `Find the missing number: ${fr(a, b)} = ?/${B}`, ...nums(A, [a + B - b, a, B - A, A + 1, A - 1]), steps: why }
        : { topic: 'FRACTIONS', text: `Find the missing number: ${fr(a, b)} = ${A}/?`, ...nums(B, [b + A - a, b, B + 1, B - 1, A + b]), steps: why };
      if (form === 3) {
        const eq = [2, 3, 4, 5].map(m => fr(a * m, b * m)).filter(s => Number(s.split('/')[1]) <= Math.max(maxDen, 24));
        return { topic: 'FRACTIONS', text: `Which fraction is NOT equal to ${fr(a, b)}?`, ...txt(fr(a + 1, b + 1), shuffle(eq)),
          steps: [`${eq.slice(0, 3).join(', ')}: top and bottom multiplied by the same number.`, `${fr(a + 1, b + 1)} adds 1 to each instead. That changes the size.`] };
      }
      const g = gcd(A, B), best = fr(A / g, B / g), w = [];
      for (const q of [2, 3, 5]) if (q < g && g % q === 0) w.push(fr(A / q, B / q));
      w.push(fr(A / g, B), fr(B / g, A / g), fr(A - 1, B - 1), fr(A / g + 1, B / g), fr(A, B / g), fr(A / g, B / g + 1));
      return { topic: 'FRACTIONS', text: `What is ${fr(A, B)} in simplest form?`, ...txt(best, w.filter(x => x !== best)),
        steps: [`Divide the top and bottom by ${g}, the biggest number that goes into both.`, `${A} ÷ ${g} = ${A / g} and ${B} ÷ ${g} = ${B / g}.`, `${fr(A, B)} = ${best}`] };
    };
  }
  G3.fracEquiv = fracEquivKind(DEN3, 8, false);
  // 3.NF.3c: whole numbers as fractions.
  G3.fracWhole = d => {
    const b = pick([2, 3, 4, 6]), k = R(2, d < 3 ? 3 : 4), form = R(0, 3);
    if (form === 0) {
      const bw = b * Math.floor(44 / b) + 1;
      return { topic: 'FRACTIONS', text: 'Each bar is 1 whole. What fraction names the shaded part?', ...fracs([k * b, b], [[k * b, k * b], [b, k * b], [k, b], [b, b], [k * b, b + 1]]),
        steps: [`Each whole is cut into ${b} parts.`, `${k} wholes have ${k} × ${b} = ${k * b} parts shaded.`, `That's ${fr(k * b, b)}, which equals ${k}.`],
        size: [168, k > 3 ? 40 : 22], fig: (c, w, h) => range(k).forEach(i => fbar(c, 4 + (i % 3) * (bw + 9), 4 + Math.floor(i / 3) * 18, bw, 13, b, b)) };
    }
    if (form === 1) return { topic: 'FRACTIONS', text: `${fr(k * b, b)} is equal to what whole number?`, ...nums(k, [k * b, b, k * b - b, k + 1, 1]),
      steps: [`${fr(b, b)} makes 1 whole.`, `${k * b} parts of size 1/${b} make ${k * b} ÷ ${b} = ${k} wholes.`] };
    if (form === 2) return { topic: 'FRACTIONS', text: 'Which fraction is equal to 1?', ...txt(fr(b, b), [fr(1, b), fr(b, 1), fr(b - 1, b), fr(b + 1, b), fr(0, b)]),
      steps: ['A fraction is 1 whole when the top equals the bottom.', `${fr(b, b)}: all ${b} parts of ${b}.`] };
    return { topic: 'FRACTIONS', text: `Find the missing number: ${k} = ?/${b}`, ...nums(k * b, [k + b, k, b, k * b + b]),
      steps: [`Each whole has ${b} parts of 1/${b}.`, `${k} wholes have ${k} × ${b} = ${k * b} parts.`, `So ${k} = ${fr(k * b, b)}.`] };
  };
  // 3.NF.3d: comparing fractions with the same top or the same bottom.
  G3.fracCompare = d => {
    const sameDen = rand() < .5, form = R(0, d < 2 ? 0 : 2);
    const pair = () => {
      if (sameDen) { const b = pick([3, 4, 6, 8]); const [x, y] = shuffle(range(b - 1).map(i => i + 1)).slice(0, 2); return [[x, b], [y, b]]; }
      const a = pick([1, 1, 2, 3]), ds = shuffle(DEN3.filter(v => v > a)).slice(0, 2); return [[a, ds[0]], [a, ds[1]]];
    };
    if (form === 0) {
      const [p, q] = pair(), sym = p[0] / p[1] < q[0] / q[1] ? '<' : '>', opp = sym === '<' ? '>' : '<', [p2, q2] = pair();
      const s2 = p2[0] / p2[1] < q2[0] / q2[1] ? '>' : '<', P = fr(...p), Q = fr(...q);
      const fig = d < 3 ? { size: [100, 44], fig: (c, w, h) => { const bw = 97; fbar(c, 1, 4, bw, 14, p[1], p[0]); fbar(c, 1, 25, bw, 14, q[1], q[0], GRN); } } : {};
      return { topic: 'FRACTIONS', text: d < 3 ? `The bars show ${P} and ${Q}. Which is true?` : 'Which is true?', ...fig,
        ...txt(`${P} ${sym} ${Q}`, [`${P} ${opp} ${Q}`, `${P} = ${Q}`, `${fr(...p2)} ${s2} ${fr(...q2)}`, `${Q} ${sym} ${P}`]),
        steps: sameDen ? [`Both wholes are cut into ${p[1]} same-size parts.`, `${p[0]} ${pl(p[0], 'part')} is ${sym === '<' ? 'less' : 'more'} than ${q[0]} ${pl(q[0], 'part')}.`, `${P} ${sym} ${Q}`]
          : [`Same top number (${p[0]}), but different-size pieces.`, `More pieces in a whole means smaller pieces: 1/${Math.max(p[1], q[1])} < 1/${Math.min(p[1], q[1])}.`, `${P} ${sym} ${Q}`] };
    }
    let set;
    if (sameDen) { const b = pick([6, 8]); set = shuffle(range(b - 1).map(i => i + 1)).slice(0, 4).map(a => [a, b]); }
    else { const a = pick([1, 2]); set = shuffle(DEN3.filter(v => v > a)).slice(0, 4).map(b => [a, b]); }
    const most = rand() < .6, val = p => p[0] / p[1], best = set.reduce((m, p) => (most ? val(p) > val(m) : val(p) < val(m)) ? p : m);
    const why = sameDen ? `Same-size parts, so the ${most ? 'biggest' : 'smallest'} top wins: ${fr(...best)}.` : `Same top, so the ${most ? 'smallest' : 'biggest'} bottom means ${most ? 'bigger' : 'smaller'} pieces: ${fr(...best)}.`;
    if (form === 1) return { topic: 'FRACTIONS', text: `Which fraction is the ${most ? 'greatest' : 'least'}?`, ...txt(fr(...best), set.filter(p => p !== best).map(p => fr(...p))),
      steps: [why, sameDen ? `The parts are all ${set[0][1] === 6 ? 'sixths' : 'eighths'} of the same whole.` : `1/${Math.min(...set.map(p => p[1]))} is the biggest piece; 1/${Math.max(...set.map(p => p[1]))} the smallest.`] };
    const kids = people(4), food = pick(['pizza', 'pan of brownies', 'sandwich', 'pie']);
    const right = kids[set.indexOf(best)];
    return { topic: 'FRACTIONS', text: `${kids.map((k, i) => `${k} ate ${fr(...set[i])}`).join(', ')} of the same size ${food}. Who ate the ${most ? 'most' : 'least'}?`,
      ...txt(right, kids.filter(k => k !== right)), steps: [why, `So ${right} ate the ${most ? 'most' : 'least'}.`] };
  };

  // ---- 3.MD
  // 3.MD.1: telling time to the minute.
  G3.clockRead = d => {
    const h = R(1, 12), m = d === 1 ? R(0, 11) * 5 : d === 2 ? R(0, 11) * 5 + (rand() < .3 ? R(1, 4) : 0) : R(0, 59);
    const wr = [tm(h, (m + (d > 2 ? 1 : 5)) % 60), tm(h, (m + 55) % 60), tm(h % 12 + 1, m), tm((h + 10) % 12 + 1, m), tm(Math.floor(m / 5) || 12, (h % 12) * 5), tm(h, (60 - m) % 60), tm(h, (m + 10) % 60)];
    return { topic: 'TIME', text: 'What time does the clock show?', ...clockFig(h, m), ...txt(tm(h, m), wr),
      steps: [m === 0 ? `The short hand points to ${h}.` : `The short hand is past the ${h}${m >= 30 ? `, not yet at ${h % 12 + 1}` : ''}: the hour is ${h}.`,
        m % 5 === 0 ? `The long hand points to the ${m / 5 || 12}. Count by 5s: ${m} minutes.` : `The long hand is ${m % 5} ${pl(m % 5, 'mark')} past the ${Math.floor(m / 5) || 12}: ${Math.floor(m / 5) * 5} + ${m % 5} = ${m} ${pl(m, 'minute')}.`,
        `The time is ${tm(h, m)}.`] };
  };
  const addMin = (h, m, k) => { let t = (h % 12) * 60 + m + k; t = ((t % 720) + 720) % 720; return [Math.floor(t / 60) || 12, t % 60]; };
  // 3.MD.1: elapsed time in minutes.
  G3.elapsed = d => {
    const ACT = ['Soccer practice', 'The movie', 'The bus ride', 'Art class', 'Recess', 'The baking show', 'The field trip tour'];
    const act = pick(ACT), h = R(1, 11), m = R(0, 11) * 5, dur = d < 3 ? R(2, 11) * 5 : R(4, 18) * 5, [h2, m2] = addMin(h, m, dur), form = R(0, 2), n = who();
    if (form === 0) return { topic: 'TIME', text: `${act} starts at ${tm(h, m)} and ends at ${tm(h2, m2)}. How many minutes long is it?`,
      ...nums(dur, [h2 > h ? (h2 * 100 + m2) - (h * 100 + m) : dur + 15, dur + 5, dur - 5, dur + 10, Math.abs(m2 - m)], v => v + ' minutes'),
      steps: m2 >= m && h2 === h ? [`From ${tm(h, m)} to ${tm(h2, m2)}: ${m2} - ${m} minutes.`, `That's ${dur} minutes.`]
        : [`From ${tm(h, m)} to ${tm(h % 12 + 1, 0)} is ${60 - m} minutes.`, `From ${tm(h % 12 + 1, 0)} to ${tm(h2, m2)} is ${dur - 60 + m} more.`, `${60 - m} + ${dur - 60 + m} = ${dur} minutes`] };
    if (form === 1) {
      const wrongM = (m + dur) % 60;
      return { topic: 'TIME', text: `${n} starts reading at ${tm(h, m)} and reads for ${dur} minutes. What time does ${n} stop?`,
        ...txt(tm(h2, m2), [tm(h, wrongM), tm(...addMin(h, m, dur + 5)), tm(...addMin(h, m, dur - 5)), tm(...addMin(h, m, dur + 60)), tm(...addMin(h, m, dur - 10))]),
        steps: [`Start at ${tm(h, m)}.`, `Count on ${dur} minutes${m + dur >= 60 ? `, past ${tm(h % 12 + 1, 0)}` : ''}.`, `${n} stops at ${tm(h2, m2)}.`] };
    }
    return { topic: 'TIME', text: `${act} ends at ${tm(h2, m2)}. It lasted ${dur} minutes. What time did it start?`,
      ...txt(tm(h, m), [tm(...addMin(h2, m2, dur)), tm(...addMin(h, m, 5)), tm(...addMin(h, m, -5)), tm(...addMin(h, m, 60)), tm(...addMin(h, m, -10))]),
      steps: [`Count back ${dur} minutes from ${tm(h2, m2)}.`, `${tm(h2, m2)} - ${dur} minutes = ${tm(h, m)}`] };
  };
  // 3.MD.2: liters, grams and kilograms: reading a scale, estimating, word problems.
  G3.liquidMass = d => {
    const form = R(0, 2), n = who();
    if (form === 0) {
      const [cap, step, every] = pick(d < 2 ? [[10, 1, 2], [5, 1, 1]] : [[10, 1, 2], [20, 2, 4], [10, 1, 5]]), level = R(1, cap / step - 1) * step;
      return { topic: 'MEASUREMENT', text: `How many liters of water are in the tank?`, ...nums(level, [level + step, level - step, cap - level, level + 2 * step]),
        steps: [`Each mark on the side is ${step} ${pl(step, 'liter')}.`, `The water comes up to the ${level} mark.`, `So there are ${level} liters.`],
        size: [100, 72], fig: (c, w, h) => {
          const x0 = 38, x1 = 72, yb = h - 5, yt = 5, Y = v => Math.round(yb - v / cap * (yb - yt - 4));
          F.box(c, x0 + 1, Y(level), x1 - x0 - 1, yb - Y(level), BLU);
          vl(c, x0, yt, yb - yt + 1, INK); vl(c, x1, yt, yb - yt + 1, INK); hl(c, x0, yb, x1 - x0 + 1, INK);
          for (let v = 0; v <= cap; v += step) { hl(c, x0 + 1, Y(v), v % every ? 3 : 6, INK); if (v % every === 0) lbl(c, v, x0 - 4, Y(v) + 1, SOFT, 'right'); }
          lbl(c, 'L', x1 + 8, yt + 4, SOFT);
        } };
    }
    if (form === 1) {
      const ITEMS = [['a paper clip', '1 gram', ['1 kilogram', '10 kilograms', '100 grams']], ['a math book', '1 kilogram', ['1 gram', '100 kilograms', '10 grams']],
        ['a grape', '5 grams', ['5 kilograms', '50 kilograms', '500 grams']], ['a bike', '10 kilograms', ['10 grams', '1 gram', '1,000 kilograms']],
        ['a pencil', '5 grams', ['5 kilograms', '50 kilograms', '500 kilograms']], ['a water bottle', '1 liter', ['100 liters', '1,000 liters', '50 liters']],
        ['a bathtub', '200 liters', ['2 liters', '20,000 liters', '1 liter']], ['a bucket', '10 liters', ['1,000 liters', '100 liters', '500 liters']],
        ['a fish tank at school', '40 liters', ['4,000 liters', '1 liter', '400,000 liters']], ['a car', '1,000 kilograms', ['10 kilograms', '1 kilogram', '100 grams']]];
      const [it, right, wrongs] = pick(ITEMS), mass = /gram/.test(right);
      return { topic: 'MEASUREMENT', text: mass ? `Which is the best estimate for the mass of ${it}?` : `Which is the best estimate for how much water ${it} holds?`,
        ...txt(right, wrongs), steps: mass ? ['A paper clip is about 1 gram. A math book is about 1 kilogram.', `So ${it} is about ${right}.`] : ['A big water bottle holds about 1 liter.', `So ${it} holds about ${right}.`] };
    }
    const T = R(0, 3), a = R(2, 9), b = R(2, 9);
    if (T === 0) return { topic: 'MEASUREMENT', text: `A bag of flour has a mass of ${a} kilograms. What is the mass of ${b} bags?`, ...nums(a * b, [a + b, a * b + a, a * b - b], v => v + ' kg'), steps: [`${b} bags of ${a} kg each.`, `${b} × ${a} = ${a * b} kilograms`] };
    if (T === 1) return { topic: 'MEASUREMENT', text: `${n} pours ${a * b} liters of water equally into ${b} buckets. How much is in each bucket?`, ...nums(a, [a * b - b, a + 1, b, a - 1], v => v + ' L'), steps: [`Share ${a * b} liters among ${b} buckets.`, `${a * b} ÷ ${b} = ${a} liters each`] };
    const big = R(20, 60), sm = R(5, big - 5);
    if (T === 2) return { topic: 'MEASUREMENT', text: `A puppy has a mass of ${big} kilograms. A kitten has a mass of ${sm} kilograms. How much more mass does the puppy have?`, ...nums(big - sm, [big + sm, big - sm + 10, big - sm - 1], v => v + ' kg'), steps: [`How much more means subtract.`, `${big} - ${sm} = ${big - sm} kilograms`] };
    return { topic: 'MEASUREMENT', text: `A pitcher holds ${sm} liters of lemonade and a cooler holds ${big} liters. How many liters is that in all?`, ...nums(big + sm, [big - sm, big + sm + 10, big + sm - 1], v => v + ' L'), steps: [`In all means add.`, `${big} + ${sm} = ${big + sm} liters`] };
  };
  const SURVEYS = [
    ['favorite pet', ['Dogs', 'Cats', 'Fish', 'Birds', 'Lizards']], ['favorite sport', ['Soccer', 'Swim', 'Tennis', 'Karate', 'Hockey']],
    ['favorite fruit', ['Apple', 'Mango', 'Grape', 'Pear', 'Banana']], ['favorite dinosaur', ['T. rex', 'Raptor', 'Stego', 'Bronto']],
    ['favorite color', ['Red', 'Blue', 'Green', 'Purple', 'Orange']], ['favorite game', ['Tag', 'Chess', 'Kickball', 'Puzzles']],
  ];
  // Questions about a bar graph or picture graph: read one, how many more, both together.
  // P: { one(c), more(a, b), both(a, b) } phrase the question; key explains the scale.
  function graphQ(cats, vals, ask, P, readW, key) {
    const i = R(0, cats.length - 1); let j; do j = R(0, cats.length - 1); while (j === i);
    const [hi, lo] = vals[i] >= vals[j] ? [i, j] : [j, i];
    if (vals[hi] === vals[lo] || ask === 0) return { text: P.one(cats[i]), ...nums(vals[i], readW(vals[i]).filter(v => v > 0)), steps: [key, `${cats[i]} shows ${vals[i]}.`] };
    if (ask === 1) return { text: P.more(cats[hi], cats[lo]), ...nums(vals[hi] - vals[lo], [vals[hi] + vals[lo], vals[hi], vals[lo], vals[hi] - vals[lo] + 1]),
      steps: [key, `${cats[hi]}: ${vals[hi]}. ${cats[lo]}: ${vals[lo]}.`, `${vals[hi]} - ${vals[lo]} = ${vals[hi] - vals[lo]}`] };
    return { text: P.both(cats[i], cats[j]), ...nums(vals[i] + vals[j], [vals[hi] - vals[lo], vals[i], vals[i] + vals[j] + 1, vals[i] + vals[j] - 2]),
      steps: [key, `${cats[i]}: ${vals[i]}. ${cats[j]}: ${vals[j]}.`, `${vals[i]} + ${vals[j]} = ${vals[i] + vals[j]}`] };
  }
  // 3.MD.3: scaled bar graphs.
  G3.barGraph = d => {
    const [what, all] = pick(SURVEYS), cats = shuffle(all.slice()).slice(0, 4), step = d === 1 ? 2 : pick([2, 5, 10]), half = d >= 3 && step !== 5;
    const top = step * pick([8, 10]), unit = half ? step / 2 : step, vals = cats.map(() => R(step / unit, top / unit - 1) * unit);
    const g = graphQ(cats, vals, R(0, d < 2 ? 1 : 2), { one: c => `How many kids chose ${c}?`, more: (a, b) => `How many more kids chose ${a} than ${b}?`, both: (a, b) => `How many kids chose ${a} or ${b}?` },
      v => [v / step, v + unit, v - unit, v + step], `Each line on the scale is ${step} more than the last.`);
    return { topic: 'BAR GRAPHS', ...barFig(cats, vals, step, top), ...g, text: `The graph shows the kids' ${what}. ${g.text}` };
  };
  // 3.MD.3: scaled picture graphs.
  G3.picGraph = d => {
    const [ic, verb] = pick([['apple', 'picked'], ['star', 'earned'], ['fish', 'caught'], ['cookie', 'sold'], ['balloon', 'sold'], ['flower', 'planted']]);
    const key = d === 1 ? 2 : pick([2, 5, 10]), halves = d >= 3 && key !== 5, cats = people(4);
    const counts = cats.map(() => halves && rand() < .4 ? R(1, 7) + .5 : R(1, 8)), vals = counts.map(c => c * key), what = F.ICON_NAMES[ic];
    const g = graphQ(cats, vals, R(0, d < 2 ? 1 : 2), { one: c => `How many ${what} did ${c} get?`, more: (a, b) => `How many more ${what} did ${a} get than ${b}?`, both: (a, b) => `How many ${what} did ${a} and ${b} get in all?` },
      v => [v / key, v + key, v - key || v + 2 * key, v + key / 2], `Each picture stands for ${key}${halves ? `; half a picture is ${key / 2}` : ''}.`);
    return { topic: 'PICTURE GRAPH', ...picFig(cats, counts, ic, key), ...g, text: `The graph shows the ${what} some kids ${verb}. ${g.text}` };
  };
  const mixIn = q => mx(q, 4);      // quarter inches to "2 1/4"
  // 3.MD.4: measuring to the nearest half or quarter inch.
  G3.ruler = d => {
    const per = d === 1 ? 2 : 1, start = d >= 3 && rand() < .4 ? 4 : 0, len = R(Math.ceil(4 / per), Math.floor((16 - start) / per) - (start ? 0 : 1)) * per;
    const col = pick([RED, GRN, BLU, PINK, HOT]), thing = pick(['crayon', 'crayon', 'pencil']);
    return { topic: 'MEASURING', text: `How many inches long is the ${thing}? Measure to the nearest ${per === 2 ? 'half' : 'quarter'} inch.`,
      ...fracs([len, 4], [start ? [len + start, 4] : null, [len + per, 4], [len - per, 4], [len + 2 * per, 4], [len + 4, 4]].filter(Boolean), p => mixIn(p[0])),
      steps: start ? [`The ${thing} starts at 1, not 0!`, `It ends at ${mixIn(len + 4)}. ${mixIn(len + 4)} - 1 = ${mixIn(len)}.`, `It is ${mixIn(len)} inches long.`]
        : [`The ${thing} starts at 0.`, `Each small mark is ${per === 2 ? '1/2' : '1/4'} inch. It ends at ${mixIn(len)}.`, `It is ${mixIn(len)} inches long.`],
      size: [168, 46], fig: (c, w, h) => {
        const x0 = 10, ry = 26, q = 9;
        F.box(c, x0 - 5, ry, 4 * 36 + 10, 18, '#d8b868');
        for (let k = 0; k <= 16; k++) { const x = x0 + k * q; F.box(c, x, ry, 1, k % 4 === 0 ? 7 : k % 2 === 0 ? 5 : 3, '#3a2810'); if (k % 4 === 0) Font.draw(c, String(k / 4), x + 1, ry + 9, '#3a2810', { align: 'center' }); }
        const xa = x0 + start * q, xb = x0 + (start + len) * q;
        F.box(c, xa, 8, xb - xa - 4, 11, col); F.box(c, xa, 10, xb - xa - 4, 1, '#ffffff40');
        for (let t = 0; t < 5; t++) F.box(c, xb - 4 + t, 8 + t, 1, 11 - 2 * t, t < 2 ? col : '#f0e0c0');
        F.line(c, xa, 20, xa, ry - 1, SOFT, 1); F.line(c, xb, 20, xb, ry - 1, SOFT, 1);
      } };
  };
  // A line plot of lengths lo, lo + 1/den, ... with a question about it.
  function linePlotQ(d, lo, den, marksN, labFmt, things, unit) {
    let counts;
    for (let t = 0; t < 30; t++) { counts = range(marksN + 1).map(() => R(0, d < 3 ? 4 : 5)); if (sum(counts) >= 6 && counts.filter(v => v).length >= 3) break; }
    const lab = k => labFmt(lo * den + k), tot = sum(counts), ask = R(0, d < 2 ? 1 : 4), one = things === 'leaves' ? 'leaf' : things.replace(/s$/, ''), st0 = `Each X is one ${one}.`;
    const base = { topic: 'LINE PLOTS', ...plotFig(marksN, counts, lab) }, intro = `The line plot shows the lengths of some ${things}.`;
    const filled = range(marksN + 1).filter(i => counts[i] > 0), k = pick(filled);
    const total = () => ({ ...base, text: `${intro} How many ${things} were measured in all?`, ...nums(tot, [filled.length, Math.max(...counts), tot + 1, tot - 1, marksN + 1]),
      steps: [st0, `Add the X's at every length: ${counts.filter(v => v).join(' + ')} = ${tot}`] });
    if (ask === 0) return { ...base, text: `${intro} How many are ${lab(k)} ${unit} long?`, ...nums(counts[k], [counts[k] + 1, counts[k] - 1, tot, counts[k + 1] || 0, counts[k - 1] || 0]),
      steps: [st0, `Count the X's above ${lab(k)}: ${counts[k]}.`] };
    if (ask === 1) {
      const at = R(0, marksN - 1), more = sum(counts.slice(at + 1));
      if (more === 0) return total();
      return { ...base, text: `${intro} How many are longer than ${lab(at)} ${unit}?`, ...nums(more, [sum(counts.slice(at)), counts[at], tot - more, more + 1]),
        steps: [st0, `Longer than ${lab(at)} means to the right of it, not on it.`, counts.slice(at + 1).filter(v => v).length > 1 ? `${counts.slice(at + 1).filter(v => v).join(' + ')} = ${more}` : `That's ${more}.`] };
    }
    if (ask === 2) return total();
    if (ask === 3) {
      const [p, q] = shuffle(filled.slice()).slice(0, 2), [hi, lo2] = counts[p] >= counts[q] ? [p, q] : [q, p];
      if (counts[hi] === counts[lo2]) return total();
      return { ...base, text: `${intro} How many more are ${lab(hi)} ${unit} long than ${lab(lo2)} ${unit}?`, ...nums(counts[hi] - counts[lo2], [counts[hi] + counts[lo2], counts[hi], counts[lo2], counts[hi] - counts[lo2] + 1]),
        steps: [st0, `${lab(hi)}: ${counts[hi]} X's. ${lab(lo2)}: ${counts[lo2]} X's.`, `${counts[hi]} - ${counts[lo2]} = ${counts[hi] - counts[lo2]}`] };
    }
    const mxC = Math.max(...counts), modes = range(marksN + 1).filter(i => counts[i] === mxC);
    if (modes.length > 1) return total();
    return { ...base, text: `${intro} Which length is the most common?`, ...txt(lab(modes[0]) + ' ' + unit, shuffle(range(marksN + 1).filter(i => i !== modes[0])).map(i => lab(i) + ' ' + unit)),
      steps: [st0, `The tallest stack is above ${lab(modes[0])}: ${mxC} X's.`] };
  }
  // 3.MD.4: line plots of measurements in halves and quarters of an inch.
  G3.linePlot = d => {
    const den = d < 3 ? 2 : 4, lo = R(2, 6);
    return linePlotQ(d, lo, den, 4, k => mx(k, den), pick(['pencils', 'worms', 'ribbons', 'leaves', 'crayons']), 'inches');
  };
  // 3.MD.5, 3.MD.6: area by counting unit squares.
  G3.areaCount = d => {
    const W = R(3, d < 2 ? 6 : 9), H = R(2, d < 2 ? 4 : 5), cut = d >= 2 && W > 3 && H > 2, cw = cut ? R(1, W - 2) : 0, ch = cut ? R(1, H - 1) : 0;
    const two = d >= 4 && cut && W - 2 * cw >= 1 && rand() < .5;
    const inShape = (i, j) => !((i >= W - cw && j < ch) || (two && i < cw && j < ch));
    let area = 0; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (inShape(i, j)) area++;
    const per = 2 * (W + H), [unit, one] = pick([['square units', 'square unit'], ['square units', 'square unit'], ['square centimeters', 'square centimeter'], ['square inches', 'square inch']]);
    return { topic: 'AREA', text: `Each small square is 1 ${one}. What is the area of the shape, in ${unit}?`,
      ...nums(area, [per, W * H, area + 1, area - 1, W + H]),
      steps: [cut ? 'Count the squares inside the shape, row by row.' : `There are ${H} rows of ${W} squares.`, cut ? `${range(H).map(j => range(W).filter(i => inShape(i, j)).length).join(' + ')} = ${area}` : `${H} × ${W} = ${area}`, `The area is ${area} ${unit}.`],
      size: [100, 56], fig: (c, w, h) => {
        const s = 8, x0 = Math.round((w - W * s) / 2), y0 = Math.round((h - H * s) / 2);
        for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (inShape(i, j)) { F.box(c, x0 + i * s + 1, y0 + j * s + 1, s - 1, s - 1, BLU); frame(c, x0 + i * s, y0 + j * s, s + 1, s + 1, INK); }
      } };
  };
  const UNITS = [['cm', 'centimeters'], ['m', 'meters'], ['in', 'inches'], ['ft', 'feet']];
  // 3.MD.7a,b: area by multiplying side lengths.
  G3.areaMult = d => {
    const a = R(2, d < 2 ? 6 : 10), b = R(2, d < 2 ? 5 : 9), [u, uu] = pick(UNITS), form = R(0, d < 2 ? 1 : 3), A = a * b;
    const wr = [2 * (a + b), a + b, A + a, A - b];
    if (form === 0) return { topic: 'AREA', text: `What is the area of the rectangle, in square ${uu}?`, ...rectFig(a, b, `${a} ${u}`, `${b} ${u}`, { grid: d === 1 }), ...nums(A, wr),
      steps: ['Area of a rectangle = length × width.', `${a} × ${b} = ${A}`, `The area is ${A} square ${uu}.`] };
    if (form === 1) return { topic: 'AREA', text: pick([`A rug is ${a} feet long and ${b} feet wide. What is its area, in square feet?`, `A garden bed is ${a} meters by ${b} meters. What is its area, in square meters?`,
      `A poster is ${a} inches tall and ${b} inches wide. How many square inches is it?`, `How many 1-foot square tiles cover a floor that is ${a} feet by ${b} feet?`]),
      ...nums(A, wr), steps: [`Area = length × width`, `${a} × ${b} = ${A}`] };
    if (form === 2) return { topic: 'AREA', text: `A rectangle has an area of ${A} square ${uu}. One side is ${a} ${uu} long. How long is the other side?`, ...nums(b, [A - a, a, b + 1, b - 1, b + 2], v => `${v} ${u}`),
      steps: [`${a} × ? = ${A}`, `${A} ÷ ${a} = ${b}`, `The other side is ${b} ${uu}.`] };
    return { topic: 'AREA', text: 'Tiles that are 1 foot on each side cover the floor shown. How many tiles is that?', ...rectFig(a, b, `${a} ft`, `${b} ft`, { grid: true }), ...nums(A, wr),
      steps: [`${b} rows of ${a} tiles.`, `${b} × ${a} = ${A} tiles`] };
  };
  // 3.MD.7c: area and the distributive property.
  G3.areaDistrib = d => {
    const a = R(2, 7), b = R(2, 6), c = R(2, 5), A = a * (b + c), form = R(0, d < 2 ? 0 : 1);
    const fig = { size: [120, 76], fig: (ctx, w, h) => {
      const s = Math.min(8, Math.floor((w - 24) / (b + c)), Math.floor((h - 18) / a)), x0 = Math.round((w - (b + c) * s) / 2) + 5, y0 = Math.round((h - a * s) / 2) + 5;
      cellGrid(ctx, x0, y0, b + c, a, s, i => i < b, BLU, GRN);
      vl(ctx, x0 + b * s, y0 - 2, a * s + 5, HOT); vl(ctx, x0 + b * s + 1, y0 - 2, a * s + 5, HOT);
      lbl(ctx, b, x0 + b * s / 2, y0 - 6); lbl(ctx, c, x0 + b * s + c * s / 2, y0 - 6); lbl(ctx, a, x0 - 7, y0 + a * s / 2 + 1);
    } };
    if (form === 1) return { topic: 'AREA', ...fig, text: `What is the area of the whole rectangle, in square units?`, ...nums(A, [a * b + c, a * b, a + b + c, 2 * (a + b + c), A + a]),
      steps: [`Blue: ${a} × ${b} = ${a * b}. Green: ${a} × ${c} = ${a * c}.`, `${a * b} + ${a * c} = ${A} square units`] };
    const cands = [[`${a} × ${b} + ${c}`, a * b + c], [`${a} + ${b} + ${c}`, a + b + c], [`${a} × ${b} × ${c}`, a * b * c], [`${b} × ${c} + ${a}`, b * c + a], [`${a} + ${b} × ${c}`, a + b * c]];
    return { topic: 'AREA', ...fig, text: 'Which expression shows the area of the whole rectangle?', ...txt(`${a} × ${b} + ${a} × ${c}`, cands.filter(x => x[1] !== A).map(x => x[0])),
      steps: [`Blue part: ${a} × ${b}. Green part: ${a} × ${c}.`, `Whole: ${a} × ${b} + ${a} × ${c} = ${A}`, `Same as ${a} × ${b + c} = ${A}.`] };
  };
  // 3.MD.7d: area of rectilinear shapes by splitting them into rectangles.
  G3.areaRectilinear = d => {
    const W = R(5, 10), H = R(4, 8), cw = R(2, W - 2), ch = R(2, H - 2), { pts, lens } = lShape(W, H, cw, ch), [u, uu] = pick(UNITS);
    const area = W * H - cw * ch, hide = d >= 3, labs = lens.map(v => `${v} ${u}`);
    const onBox = i => { const p = pts[i], q = pts[(i + 1) % 6]; return (p[0] === q[0] && (p[0] === 0 || p[0] === W)) || (p[1] === q[1] && (p[1] === 0 || p[1] === H)); };
    if (hide) labs.forEach((v, i) => { if (!onBox(i)) labs[i] = null; });
    const long = W * (H - ch), rest = (W - cw) * ch;
    return { topic: 'AREA', text: `What is the area of the shape, in square ${uu}?`, ...polyFig(pts, labs, { size: [130, 76], cells: d === 1 }),
      ...nums(area, [W * H, 2 * (W + H), W * (H - ch), (W - cw) * H, area + W]),
      steps: ['Split the shape into two rectangles.', ...(hide ? [`The missing sides: ${H} - ${H - ch} = ${ch} and ${W} - ${W - cw} = ${cw}.`] : []),
        `${W} × ${H - ch} = ${long} and ${W - cw} × ${ch} = ${rest}`, `${long} + ${rest} = ${area} square ${uu}`] };
  };
  // 3.MD.8: perimeter, unknown sides, and same perimeter with a different area.
  G3.perimeter = d => {
    const [u, uu] = pick(UNITS), form = R(0, d < 2 ? 1 : d < 3 ? 2 : 3);
    if (form === 0) {
      const sides = pick([3, 4, 5, 6]);
      if (sides === 4) { const a = R(3, 12), b = R(2, 9); return { topic: 'PERIMETER', text: `What is the perimeter of the rectangle?`, ...rectFig(a, b, `${a} ${u}`, `${b} ${u}`), ...nums(2 * (a + b), [a + b, a * b, 2 * a + b, 2 * (a + b) + 2], v => `${v} ${u}`),
        steps: ['Perimeter is the distance all the way around.', `A rectangle has two sides of ${a} and two of ${b}.`, `${a} + ${b} + ${a} + ${b} = ${2 * (a + b)} ${uu}`] }; }
      if (sides === 3) {
        let A, B, C, pts;
        for (let t = 0; t < 40; t++) { A = R(4, 12); B = R(3, 10); C = R(3, 10); const x = (A * A + B * B - C * C) / (2 * A), y2 = B * B - x * x; if (y2 > (A * .35) ** 2) { pts = [[0, 0], [A, 0], [x, -Math.sqrt(y2)]]; break; } }
        if (!pts) { A = 6; B = 5; C = 5; pts = [[0, 0], [6, 0], [3, -4]]; }
        const P = A + B + C;
        return { topic: 'PERIMETER', text: 'What is the perimeter of the triangle?', ...polyFig(pts, [`${A} ${u}`, `${C} ${u}`, `${B} ${u}`]), ...nums(P, [P - A, A * B, P + 1, P - 1], v => `${v} ${u}`),
          steps: ['Add the lengths of all the sides.', `${A} + ${B} + ${C} = ${P} ${uu}`] };
      }
      const s = R(2, 9), P = s * sides, pts = range(sides).map(i => [Math.cos(i * 2 * Math.PI / sides - Math.PI / 2), Math.sin(i * 2 * Math.PI / sides - Math.PI / 2)]);
      const NAME = { 5: 'pentagon', 6: 'hexagon' };
      return { topic: 'PERIMETER', text: `All ${sides} sides of the ${NAME[sides]} are the same length. What is its perimeter?`, ...polyFig(pts, [`${s} ${u}`], { size: [100, 64], marks: true, ticks: Array(sides).fill(1) }),
        ...nums(P, [s * (sides - 1), s + sides, P + s, s * 4], v => `${v} ${u}`), steps: [`${sides} sides, each ${s} ${uu}.`, `${sides} × ${s} = ${P} ${uu}`] };
    }
    if (form === 1) {
      const W = R(5, 10), H = R(4, 8), cw = R(2, W - 2), ch = R(2, H - 2), { pts, lens } = lShape(W, H, cw, ch), P = 2 * (W + H);
      return { topic: 'PERIMETER', text: 'What is the perimeter of the shape?', ...polyFig(pts, lens.map(v => `${v} ${u}`), { size: [130, 76] }), ...nums(P, [W * H - cw * ch, P - cw - ch, W + H, P + 2], v => `${v} ${u}`),
        steps: ['Add all six sides, going around the shape.', `${lens.join(' + ')} = ${P}`, `The perimeter is ${P} ${uu}.`] };
    }
    if (form === 2) {
      const tri = rand() < .5;
      if (tri) { const a = R(4, 12), b = R(4, 12), c = R(Math.abs(a - b) + 1, a + b - 1), P = a + b + c;
        return { topic: 'PERIMETER', text: `A triangle has a perimeter of ${P} ${uu}. Two of its sides are ${a} ${uu} and ${b} ${uu}. How long is the third side?`, ...nums(c, [a + b, P + a + b, c + 1, c - 1, P - a], v => `${v} ${u}`),
          steps: [`${a} + ${b} + ? = ${P}`, `${a} + ${b} = ${a + b}`, `${P} - ${a + b} = ${c} ${uu}`] }; }
      const a = R(4, 12), b = R(2, 10), P = 2 * (a + b);
      return { topic: 'PERIMETER', text: `A rectangle has a perimeter of ${P} ${uu}. Its length is ${a} ${uu}. What is its width?`, ...nums(b, [P - a, P - 2 * a, P / 2, b + 1, b - 1], v => `${v} ${u}`),
        steps: [`The two lengths: ${a} + ${a} = ${2 * a}.`, `The two widths share the rest: ${P} - ${2 * a} = ${P - 2 * a}.`, `${P - 2 * a} ÷ 2 = ${b} ${uu}`] };
    }
    const a = R(2, 6), b = R(a + 1, 9), P = 2 * (a + b), right = [a - 1, b + 1], s = (p, q) => `${p} ft by ${q} ft`;
    const wrongs = [[a, b + 1], [a + 1, b + 1], [a - 1, b], [a + 1, b + 2], [a, b - 1]].filter(([p, q]) => p > 0 && q > 0 && 2 * (p + q) !== P);
    for (let x = 1; x < a * b; x++) if ((a * b) % x === 0 && x !== a && x !== b && 2 * (x + a * b / x) !== P) { wrongs.unshift([x, a * b / x]); break; }
    return { topic: 'PERIMETER', text: `A rectangle is ${a} feet by ${b} feet. Which rectangle has the same perimeter but a different area?`, ...txt(s(...right), wrongs.map(p => s(...p))),
      steps: [`${a} ft by ${b} ft: perimeter ${a} + ${b} + ${a} + ${b} = ${P} ft, area ${a * b}.`, `${s(...right)}: perimeter ${2 * (right[0] + right[1])} ft, area ${right[0] * right[1]}.`, 'Same perimeter, different area!'] };
  };

  // ---- Quadrilaterals (3.G.1, 4.G.2, 5.G.3, 5.G.4).
  // Four sides with no right angles, no parallel sides and no equal sides: only a quadrilateral.
  function oddQuad() {
    for (let t = 0; t < 300; t++) {
      const pts = [[R(0, 2), R(0, 3)], [R(5, 9), R(0, 2)], [R(6, 10), R(4, 7)], [R(0, 3), R(4, 8)]], ang = corners(pts);
      if (Math.abs(sum(ang) - 360) > 1 || ang.some(a => Math.abs(a - 90) < 12 || a < 35)) continue;
      const v = pts.map((p, i) => { const q = pts[(i + 1) % 4]; return [q[0] - p[0], q[1] - p[1]]; }), L = v.map(e => Math.hypot(...e));
      const apart = (a, b) => { const t2 = Math.abs(Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0])) % Math.PI; return Math.min(t2, Math.PI - t2) > 12 * DEG; };
      if (!apart(v[0], v[2]) || !apart(v[1], v[3])) continue;
      if (L.some((a, i) => L.some((b, j) => i < j && Math.abs(a - b) / Math.max(a, b) < .12))) continue;
      return pts;
    }
    return [[0, 3], [5, 0], [10, 4], [2, 7]];
  }
  const QUADS = {
    square: { pts: () => { const s = R(3, 5); return [[0, 0], [s, 0], [s, s], [0, s]]; }, ticks: [1, 1, 1, 1], names: ['square', 'rectangle', 'rhombus', 'parallelogram', 'quadrilateral'] },
    rectangle: { pts: () => { const a = R(5, 8), b = R(2, a - 2); return [[0, 0], [a, 0], [a, b], [0, b]]; }, ticks: [1, 2, 1, 2], names: ['rectangle', 'parallelogram', 'quadrilateral'] },
    rhombus: { pts: () => pick([[[0, 0], [5, 0], [8, 4], [3, 4]], [[3, 0], [6, 4], [3, 8], [0, 4]], [[0, 0], [5, 0], [9, 3], [4, 3]]]), ticks: [1, 1, 1, 1], names: ['rhombus', 'parallelogram', 'quadrilateral'] },
    parallelogram: { pts: () => pick([[[0, 0], [6, 0], [8, 3], [2, 3]], [[0, 0], [7, 0], [9, 4], [2, 4]], [[2, 0], [8, 0], [6, 3], [0, 3]]]), ticks: [1, 2, 1, 2], names: ['parallelogram', 'quadrilateral'] },
    trapezoid: { pts: () => pick([[[2, 0], [6, 0], [8, 4], [0, 4]], [[0, 0], [5, 0], [7, 4], [0, 4]], [[1, 0], [7, 0], [9, 3], [0, 3]]]), ticks: null, names: ['trapezoid', 'quadrilateral'] },
    kite: { pts: () => [[3, 0], [6, 3], [3, 9], [0, 3]], ticks: [1, 2, 2, 1], names: ['kite', 'quadrilateral'] },
    quadrilateral: { pts: () => oddQuad(), ticks: null, names: ['quadrilateral'] },
  };
  const quadFig = (k, pts) => polyFig(pts, [], { size: [100, 60], marks: true, ticks: QUADS[k].ticks, px: 14, py: 8 });
  // 3.G.1: quadrilaterals and their kinds.
  G3.quadrilaterals = d => {
    const form = R(0, d < 2 ? 1 : 3);
    if (form === 0) {
      const k = pick(['square', 'rectangle', 'rhombus', 'quadrilateral', 'rectangle', 'rhombus']), Q = QUADS[k], pts = Q.pts();
      if (k === 'square') return { topic: 'SHAPES', text: 'Which is NOT a name for this shape?', ...quadFig(k, pts), ...txt(pick(['pentagon', 'triangle', 'hexagon']), ['square', 'rectangle', 'rhombus', 'quadrilateral']),
        steps: ['4 equal sides and 4 right angles: a square.', 'A square is also a rectangle, a rhombus and a quadrilateral.', 'It has 4 sides, so it is not a pentagon, triangle or hexagon.'] };
      const why = { rectangle: '4 right angles, but the sides are not all equal: a rectangle.', rhombus: '4 equal sides, but no right angles: a rhombus.', quadrilateral: '4 sides, but no equal sides or right angles.' }[k];
      return { topic: 'SHAPES', text: 'Which name fits this shape?', ...quadFig(k, pts), ...txt(k, ['square', 'rectangle', 'rhombus', 'triangle', 'pentagon'].filter(n => !Q.names.includes(n))),
        steps: ['The tick marks show equal sides. The little squares show right angles.', why] };
    }
    if (form === 1) return { topic: 'SHAPES', text: 'Which shape is NOT a quadrilateral?', ...txt(pick(['triangle', 'pentagon', 'hexagon', 'circle']), shuffle(['square', 'rectangle', 'rhombus', 'trapezoid'])),
      steps: ['A quadrilateral is any shape with 4 straight sides.', 'Squares, rectangles, rhombuses and trapezoids all have 4 sides.'] };
    if (form === 2) {
      const C = pick([['I have 4 equal sides and no right angles. What am I?', 'rhombus', ['square', 'rectangle', 'triangle', 'hexagon']],
        ['I have 4 right angles, but my sides are not all equal. What am I?', 'rectangle', ['square', 'rhombus', 'triangle', 'pentagon']],
        ['I have 4 equal sides and 4 right angles. What am I?', 'square', ['rhombus', 'triangle', 'hexagon', 'trapezoid']],
        ['I have 3 sides and 3 corners. What am I?', 'triangle', ['square', 'rhombus', 'pentagon', 'hexagon']]]);
      return { topic: 'SHAPES', text: C[0], ...txt(C[1], C[2]), steps: ['Square: 4 equal sides AND 4 right angles.', 'Rectangle: 4 right angles. Rhombus: 4 equal sides.', `So the answer is a ${C[1]}.`] };
    }
    return { topic: 'SHAPES', text: 'Which of these is always true?', ...txt(pick(['Every square is a rectangle.', 'Every square is a rhombus.', 'Every rhombus is a quadrilateral.']),
      ['Every rectangle is a square.', 'Every rhombus is a square.', 'Every triangle is a quadrilateral.', 'Every quadrilateral is a rectangle.']),
      steps: ['A square has 4 right angles, so it is a rectangle too.', 'A square has 4 equal sides, so it is a rhombus too.', 'But not every rectangle or rhombus is a square.'] };
  };

  Questions.grade({ id: '3', n: 3, label: '3RD GRADE', short: '3RD', clock: [55, 50, 45, 40, 40], kinds: G3, min: { twoStep: 2, areaRectilinear: 2, estimate: 1 } });

  // ======== 4TH GRADE ========
  const G4 = {};
  const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const w100 = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  const w1000 = n => { const h = Math.floor(n / 100), r = n % 100; return [h ? ONES[h] + ' hundred' : '', r ? w100(r) : ''].filter(Boolean).join(' '); };
  function words(n) {
    if (n === 0) return 'zero';
    const m = Math.floor(n / 1e6), t = Math.floor(n / 1000) % 1000, r = n % 1000, parts = [];
    if (m) parts.push(w1000(m) + ' million'); if (t) parts.push(w1000(t) + ' thousand'); if (r) parts.push(w1000(r));
    return parts.join(', ');
  }
  const factorsOf = n => range(n).map(i => i + 1).filter(i => n % i === 0);
  const isPrime = n => n > 1 && factorsOf(n).length === 2;
  const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  const PLACE = { 1: 'ones', 10: 'tens', 100: 'hundreds', 1000: 'thousands', 10000: 'ten thousands', 100000: 'hundred thousands', 1000000: 'millions' };
  const mkNum = (k, zeros = 0) => {   // k digits, all different, optionally with some zeros inside
    const dg = shuffle(range(9).map(i => i + 1)).slice(0, k);
    for (let z = 0; z < zeros; z++) dg[R(1, k - 1)] = 0;
    return Number(dg.join(''));
  };
  const digitAt = (n, p) => Math.floor(n / p) % 10;
  const DNAME = { 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 8: 'eighths', 10: 'tenths', 9: 'ninths', 12: 'twelfths', 100: 'hundredths' };

  // 4.OA.1, 4.OA.2: comparing with "times as many".
  G4.multCompare = d => {
    const [n1, n2] = people(2), k = R(2, d < 3 ? 6 : 9), a0 = R(3, [9, 12, 12, 25][d - 1]), a = a0 === k ? a0 + 1 : a0, b = a * k, form = R(0, d < 2 ? 1 : 4);
    const things = pick(['stickers', 'baseball cards', 'marbles', 'shells', 'comic books', 'game tokens']);
    if (form === 0) return { topic: 'COMPARE', text: `${n1} has ${a} ${things}. ${n2} has ${k} times as many. How many ${things} does ${n2} have?`,
      ...nums(b, [a + k, b + a, b - k, b - a]), steps: [`${k} times as many as ${a} means ${k} × ${a}.`, `${k} × ${a} = ${b}`] };
    if (form === 1) {
      const S = pick([[`A dog weighs ${b} pounds. That is ${k} times as much as a cat weighs. How many pounds does the cat weigh?`, 'pounds'],
        [`An oak tree is ${b} feet tall. That is ${k} times as tall as a bush. How many feet tall is the bush?`, 'feet'],
        [`${n1} scored ${b} points. That is ${k} times as many as ${n2} scored. How many points did ${n2} score?`, 'points']]);
      return { topic: 'COMPARE', text: S[0], ...nums(a, [b - k, b + k, b * k, a + 1, a - 1]), steps: [`${b} is ${k} times the number we want.`, `? × ${k} = ${b}, so ? = ${b} ÷ ${k}.`, `${b} ÷ ${k} = ${a} ${S[1]}`] };
    }
    if (form === 2) return { topic: 'COMPARE', text: `Which statement matches ${b} = ${k} × ${a}?`,
      ...txt(`${b} is ${k} times as many as ${a}.`, [`${b} is ${k} more than ${a}.`, `${a} is ${k} times as many as ${b}.`, `${k} is ${a} times as many as ${b}.`, `${b} is ${a} more than ${k}.`]),
      steps: [`${k} × ${a} means ${k} groups of ${a}.`, `So ${b} is ${k} times as many as ${a}.`] };
    if (form === 3) return { topic: 'COMPARE', text: `Which equation shows "${b} is ${k} times as many as ${a}"?`,
      ...txt(`${b} = ${k} × ${a}`, [`${b} = ${k} + ${a}`, `${a} = ${k} × ${b}`, `${k} = ${b} × ${a}`, `${b} + ${k} = ${a}`]), steps: ['"Times as many" means multiply.', `${b} = ${k} × ${a}`] };
    return { topic: 'COMPARE', text: `${n1} has ${a} ${things}. ${n2} has ${k} times as many. How many more ${things} does ${n2} have than ${n1}?`,
      ...nums(b - a, [b, a + k, b + a, b - k]), steps: [`${n2} has ${k} × ${a} = ${b}.`, `How many more: ${b} - ${a} = ${b - a}`] };
  };
  // 4.OA.3: multi-step word problems.
  G4.multistep = d => {
    const n = who(), T = R(0, 4);
    if (T === 0) {
      const g = R(4, 9), m = R(12, 36), e = R(10, g * m - 10), ans = g * m - e;
      return { topic: 'WORD PROBLEM', text: `The school buys ${g} boxes of ${m} markers and gives out ${e} of them. How many markers are left?`,
        ...nums(ans, [g * m + e, g * m, ans + 10, ans - 10]), steps: [`Markers bought: ${g} × ${m} = ${g * m}`, `Left: ${g * m} - ${e} = ${ans}`] };
    }
    if (T === 1) {
      const A = R(2, 5), K = R(2, 6), p = R(9, 15), q = R(4, p - 2), ans = A * p + K * q;
      return { topic: 'WORD PROBLEM', text: `Museum tickets cost $${p} for adults and $${q} for kids. What do ${A} adult tickets and ${K} kid tickets cost?`,
        ...nums(ans, [(A + K) * p, (A + K) * q, A * p, ans + p], dol), steps: [`Adults: ${A} × $${p} = $${A * p}`, `Kids: ${K} × $${q} = $${K * q}`, `$${A * p} + $${K * q} = $${ans}`] };
    }
    if (T === 2) {
      const s = R(5, 20), w = R(3, 9), H = R(5, 40), P = H + s * w;
      return { topic: 'WORD PROBLEM', text: `${n} wants a $${P} bike and has $${H} saved. ${n} saves $${s} more each week. How many weeks until ${n} can buy the bike?`,
        ...nums(w, [Math.round(P / s), w + 1, w - 1, w + 2]), steps: [`Still needed: $${P} - $${H} = $${P - H}`, `$${P - H} ÷ $${s} = ${w} weeks`] };
    }
    if (T === 3) {
      const b = pick([6, 8, 12]), q = R(4, 12), total = b * q;
      let t = q, m = b;
      for (const x of shuffle([2, 3, 4, 5, 6, 7, 8, 9])) if (total % x === 0 && total / x >= 6 && total / x <= 40 && x !== b) { t = x; m = total / x; break; }
      return { topic: 'WORD PROBLEM', text: `A baker makes ${t} trays of ${m} muffins and packs them in boxes of ${b}. How many boxes does the baker fill?`,
        ...nums(q, [total, q + 1, q - 1, t + m - b]), steps: [`Muffins: ${t} × ${m} = ${total}`, `Boxes: ${total} ÷ ${b} = ${q}`] };
    }
    const c1 = R(18, 32), cap = pick([10, 12, 15, 20]); let c2 = R(18, 32);
    if ((c1 + c2) % cap === 0) c2++;
    const tot = c1 + c2, q = Math.floor(tot / cap), r = tot % cap;
    return { topic: 'WORD PROBLEM', text: `Two classes, with ${c1} and ${c2} students, go on a field trip. Each van holds ${cap} students. How many vans do they need?`,
      ...nums(q + 1, [q, r, q + 2, Math.ceil(c1 / cap)]), steps: [`Students: ${c1} + ${c2} = ${tot}`, `${tot} ÷ ${cap} = ${q} R${r}`, `The ${r} left over need a van too: ${q + 1} vans.`] };
  };
  // 4.OA.3: what to do with the remainder.
  G4.remainders = d => {
    const dv = R(3, 9), q = R(4, [9, 12, 20, 40][d - 1]), r = R(1, dv - 1), t = dv * q + r, T = R(0, 2), n = who();
    if (T === 0) {
      const S = pick([[`${t} kids are going to the zoo. Each van holds ${dv} kids. How many vans are needed?`, 'vans'], [`${n} has ${t} books to pack. Each box holds ${dv} books. How many boxes does ${n} need?`, 'boxes'],
        [`${t} people are coming to a party. Each table seats ${dv}. How many tables are needed?`, 'tables']]);
      return { topic: 'REMAINDERS', text: S[0], ...nums(q + 1, [q, r, q + 2, dv]), steps: [`${t} ÷ ${dv} = ${q} R${r}`, `The ${r} left over still need one more.`, `${q + 1} ${S[1]}`] };
    }
    if (T === 1) {
      const S = pick([[`${n} has ${t} beads. Each bracelet uses ${dv} beads. How many bracelets can ${n} make?`, 'bracelets'], [`A ribbon is ${t} inches long. How many ${dv}-inch pieces can be cut from it?`, 'pieces'],
        [`${n} has $${t}. Kites cost $${dv} each. How many kites can ${n} buy?`, 'kites']]);
      return { topic: 'REMAINDERS', text: S[0], ...nums(q, [q + 1, r, q - 1, t - dv]), steps: [`${t} ÷ ${dv} = ${q} R${r}`, `The ${r} left over is not enough for another one.`, `${q} ${S[1]}`] };
    }
    return { topic: 'REMAINDERS', text: `${n} shares ${t} stickers equally among ${dv} friends. How many stickers are left over?`, ...nums(r, [q, dv, r + 1, dv - r]),
      steps: [`${t} ÷ ${dv} = ${q} R${r}`, `Each friend gets ${q}, and ${r} ${pl(r, 'is', 'are')} left over.`] };
  };
  const FNUMS = [12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 54, 56, 60, 63, 64, 72, 80, 84, 90, 96, 100];
  // 4.OA.4: factors, factor pairs and multiples.
  G4.factorsMultiples = d => {
    const form = R(0, d < 2 ? 2 : 4), N0 = pick(form === 4 ? FNUMS.filter(v => v <= 40) : FNUMS), fs = factorsOf(N0), non = range(13).map(i => i + 2).filter(i => N0 % i);
    const mid = fs.filter(x => x > 1 && x < N0);
    if (form === 0) { const f = pick(mid); return { topic: 'FACTORS', text: `Which number is a factor of ${N0}?`, ...nums(f, shuffle(non.slice())), steps: [`${N0} ÷ ${f} = ${N0 / f}, with nothing left over.`, `So ${f} is a factor of ${N0}. The others leave remainders.`] }; }
    if (form === 1) { const f = pick(non), ws = shuffle(mid.slice()).slice(0, 3); return { topic: 'FACTORS', text: `Which number is NOT a factor of ${N0}?`, ...nums(f, ws),
      steps: [ws.map(x => `${N0} ÷ ${x} = ${N0 / x}`).join(', '), `${N0} ÷ ${f} leaves a remainder, so ${f} is not a factor.`] }; }
    if (form === 2) {
      const k = R(3, 12), m = k * R(2, 9), wr = [...factorsOf(k).filter(x => x > 1 && x < k), m + 1, m - 1, m + 2, k + 1, m + k - 1].filter(v => v % k !== 0);
      return { topic: 'MULTIPLES', text: `Which number is a multiple of ${k}?`, ...nums(m, shuffle(wr.slice(0, 2)).concat(wr.slice(2))), steps: [`${k} × ${m / k} = ${m}`, `So ${m} is a multiple of ${k}. (A factor of ${k} is not a multiple!)`] };
    }
    const pairs = fs.filter(x => x * x <= N0);
    if (form === 3) return { topic: 'FACTORS', text: `How many factor pairs does ${N0} have?`, ...nums(pairs.length, [fs.length, pairs.length + 1, pairs.length - 1, mid.length]),
      steps: [pairs.map(x => `${x} × ${N0 / x}`).join(', '), `That's ${pairs.length} factor pairs.`] };
    const di = R(1, fs.length - 2), drop = fs.filter((x, i) => i !== di), bad = non.find(x => x > mid[mid.length - 1]) || N0 + 1;
    const swap = fs.map(x => x === mid[mid.length - 1] ? bad : x).sort((p, q) => p - q);
    return { topic: 'FACTORS', text: `Which list shows all the factors of ${N0}?`, ...txt(fs.join(', '), [drop.join(', '), [N0, 2 * N0, 3 * N0, 4 * N0].join(', '), mid.join(', '), swap.join(', ')]),
      steps: [`Find the factor pairs: ${pairs.map(x => `${x} × ${N0 / x}`).join(', ')}.`, `All the factors: ${fs.join(', ')}`] };
  };
  const PRIMES = range(98).map(i => i + 2).filter(isPrime);
  const TRICKY = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 75, 77, 81, 85, 87, 91, 93, 95];
  const split = x => { const f = factorsOf(x)[1]; return `${x} = ${f} × ${x / f}`; };
  // 4.OA.4: prime and composite numbers.
  G4.primeComposite = d => {
    const hi = [20, 50, 100, 100][d - 1], form = R(0, d < 2 ? 1 : 2);
    if (form === 0) {
      const p = pick(PRIMES.filter(x => x <= hi && x > 2)), ws = shuffle(TRICKY.filter(x => x <= hi + 10)).slice(0, 3);
      if (d < 3 && rand() < .4) ws[0] = 1;
      return { topic: 'PRIMES', text: 'Which number is prime?', ...nums(p, ws), steps: [`${p} has exactly two factors: 1 and ${p}.`, ws.filter(x => x > 1).map(split).join(', ') + (ws.includes(1) ? '. And 1 is not prime.' : '.')] };
    }
    if (form === 1) {
      const c = pick(TRICKY.filter(x => x <= hi + 10)), ws = shuffle(PRIMES.filter(x => x <= hi + 10 && x > 2)).slice(0, 3);
      return { topic: 'PRIMES', text: 'Which number is composite?', ...nums(c, ws), steps: [`${split(c)}, so ${c} has more than two factors.`, `${ws.join(', ')} are prime: only 1 and themselves.`] };
    }
    const x = rand() < .15 ? 1 : rand() < .5 ? pick(PRIMES.filter(v => v <= hi)) : pick(TRICKY.filter(v => v <= hi + 10)), C = ['prime', 'composite', 'neither prime nor composite', 'both prime and composite'];
    return { topic: 'PRIMES', text: `Is ${x} prime or composite?`, choices: C, answer: x === 1 ? 2 : isPrime(x) ? 0 : 1,
      steps: x === 1 ? ['1 has only one factor: itself.', 'Prime needs exactly two factors, so 1 is neither.'] : isPrime(x) ? [`The only factors of ${x} are 1 and ${x}.`, `So ${x} is prime.`] : [`${split(x)}`, `${x} has more than two factors, so it is composite.`] };
  };
  // 4.OA.5: number patterns from a rule.
  G4.patternRule = d => {
    const form = R(0, d < 2 ? 1 : 3);
    if (form === 0) {
      const s = R(1, 20), k = R(3, 12), pos = R(5, d < 3 ? 6 : 8), seq = range(pos).map(i => s + i * k), ans = seq[pos - 1];
      return { topic: 'PATTERNS', text: `The rule is "add ${k}." The first number is ${s}. What is the ${ORD[pos]} number?`, ...nums(ans, [ans + k, ans - k, s * pos, ans + 1]),
        steps: [seq.join(', '), `The ${ORD[pos]} number is ${ans}. (Start at ${s}, then add ${k} only ${pos - 1} times.)`] };
    }
    if (form === 1) {
      const k = pick([2, 2, 3, 3, 4]), s = k === 4 ? 1 : R(1, 3), seq = range(5).map(i => s * k ** i);
      return { topic: 'PATTERNS', text: `The rule is "multiply by ${k}." What number comes next?  ${seq.slice(0, 4).join(', ')}, ?`,
        ...nums(seq[4], [seq[3] + k, 2 * seq[3] - seq[2], seq[3] * (k + 1), seq[3] + seq[2]]), steps: [`Each number is ${k} times the one before.`, `${seq[3]} × ${k} = ${seq[4]}`] };
    }
    const s = R(1, 15), k = R(2, 10), terms = range(10).map(i => s + i * k);
    if (form === 2) {
      const rules = [[`Add ${k}.`, v => v + k], [`Add ${k + 1}.`, v => v + k + 1], [`Add ${k - 1}.`, v => v + k - 1], ['Multiply by 2.', v => v * 2], ['Multiply by 3.', v => v * 3], [`Subtract ${k}.`, v => v - k]];
      const fits = f => terms.slice(0, 4).every((v, i) => i === 0 || f(terms[i - 1]) === v);
      return { topic: 'PATTERNS', text: `What is the rule for this pattern?  ${terms.slice(0, 4).join(', ')}, ...`, ...txt(rules[0][0], rules.slice(1).filter(r => !fits(r[1])).map(r => r[0])),
        steps: [`${terms[1]} - ${terms[0]} = ${k}, and ${terms[2]} - ${terms[1]} = ${k}.`, `Each number is ${k} more: add ${k}.`] };
    }
    const facts = [['All the numbers are odd.', terms.every(v => v % 2)], ['All the numbers are even.', terms.every(v => v % 2 === 0)],
      ['They go odd, even, odd, even.', terms.every((v, i) => v % 2 === (i % 2 ? 0 : 1))], ['They go even, odd, even, odd.', terms.every((v, i) => v % 2 === (i % 2 ? 1 : 0))],
      ...[3, 4, 5].map(m => [`Every number is a multiple of ${m}.`, terms.every(v => v % m === 0)]), [`Every number ends in ${s % 10}.`, terms.every(v => v % 10 === s % 10)]];
    const right = facts.slice(0, 4).find(f => f[1])[0];
    return { topic: 'PATTERNS', text: `The rule is "add ${k}," starting at ${s}: ${terms.slice(0, 4).join(', ')}, ... Which is true about the numbers?`,
      ...txt(right, shuffle(facts.filter(f => !f[1]).map(f => f[0]))), steps: [`Keep going: ${terms.slice(0, 7).join(', ')}`, k % 2 ? `Adding an odd number flips between odd and even.` : `Adding an even number never changes odd or even.`, right] };
  };
  // 4.NBT.1, 4.NBT.2: place value, expanded form and number names up to 1,000,000.
  G4.placeValue = d => {
    const k = d < 2 ? 5 : 6, form = R(0, d < 2 ? 3 : 5);
    if (form === 0) {
      const n = mkNum(k), p = 10 ** R(1, k - 1), dg = digitAt(n, p), v = dg * p;
      return { topic: 'PLACE VALUE', text: `What is the value of the ${dg} in ${N(n)}?`, ...nums(v, [v / 10, v * 10, dg, v / 100 >= 1 ? v / 100 : v * 100]),
        steps: [`The ${dg} is in the ${PLACE[p]} place.`, `So it is worth ${dg} × ${N(p)} = ${N(v)}.`] };
    }
    if (form === 1) {
      const x = R(2, 9), p = 10 ** R(1, 3), big = d >= 3 && rand() < .4, q = big ? p * 100 : p * 10, ans = q / p;
      return { topic: 'PLACE VALUE', text: `The ${x} in ${N(x * q)} is worth how many times as much as the ${x} in ${N(x * p)}?`, ...nums(ans, [ans * 10, ans / 10 >= 1 ? ans / 10 : 1, x, ans * 100, x * 10]),
        steps: [`${N(x * q)}: the ${x} is ${x} ${PLACE[q]}. ${N(x * p)}: ${x} ${PLACE[p]}.`, `Each place is 10 times the place to its right.`, `${N(x * q)} ÷ ${N(x * p)} = ${ans}`] };
    }
    if (form === 2) {
      const n = mkNum(k, R(1, 2)), parts = range(k).map(i => digitAt(n, 10 ** i) * 10 ** i).filter(v => v).reverse();
      const nz = Number(String(n).replace(/0/g, '')), shift = n + parts[parts.length - 1] * 9;
      return { topic: 'PLACE VALUE', text: `What number is ${parts.map(N).join(' + ')}?`, ...nums(n, [nz, n * 10, shift, n - parts[0] + parts[0] / 10], N),
        steps: ['Put each digit in its place, with 0 for any empty place.', `${parts.map(N).join(' + ')} = ${N(n)}`] };
    }
    if (form === 3) {
      const n = mkNum(k, R(0, 2)), s = String(n), wr = [];
      if (s.includes('0')) wr.push(Number(s.replace('0', '')));
      wr.push(Number(s.slice(0, -2) + s.slice(-1) + s.slice(-2, -1)), Number(s.slice(0, -3) + '0' + s.slice(-3)), Number(s.slice(0, -3) + s.slice(-2, -1) + s.slice(-3, -2) + s.slice(-1)), n + 9000, n * 10);
      return { topic: 'PLACE VALUE', text: `Which number is ${words(n)}?`, ...nums(n, wr.filter(v => v !== n), N), steps: [`"${words(Math.floor(n / 1000))} thousand" is ${N(Math.floor(n / 1000) * 1000)}.`, `"${words(n % 1000)}" is ${n % 1000}.`, `${N(Math.floor(n / 1000) * 1000)} + ${n % 1000} = ${N(n)}`] };
    }
    if (form === 4) {
      const n = mkNum(k, R(0, 1)), parts = range(k).map(i => digitAt(n, 10 ** i) * 10 ** i).filter(v => v).reverse(), E = a => a.map(N).join(' + ');
      const lead = v => Math.round(v / 10 ** Math.floor(Math.log10(v) + 1e-9));
      return { topic: 'PLACE VALUE', text: `Which shows ${N(n)} in expanded form?`, ...txt(E(parts), [E(parts.map((v, i) => i === 1 ? (v >= 10 ? v / 10 : v * 10) : v)), E(parts.map((v, i) => i === 0 ? v * 10 : v)), E(parts.slice(1)), parts.map(lead).join(' + ')].filter(s => s !== E(parts))),
        steps: [`Write each digit times its place value.`, `${N(n)} = ${E(parts)}`] };
    }
    const n = mkNum(d < 3 ? 4 : 5);
    return { topic: 'PLACE VALUE', text: `What is 10 × ${N(n)}?`, ...nums(10 * n, [100 * n, n + 10, n, n * 10 + 10]), steps: ['Times 10 moves every digit one place to the left.', `10 × ${N(n)} = ${N(10 * n)}`] };
  };
  // 4.NBT.2: comparing and ordering multi-digit numbers.
  G4.compareNumbers = d => {
    const k = d < 2 ? 4 : d < 3 ? 5 : 6, form = R(0, d < 2 ? 1 : 2), base = mkNum(k);
    const variant = () => { const s = String(base).split(''); const i = R(1, k - 2); [s[i], s[i + 1]] = [s[i + 1], s[i]]; return Number(s.join('')); };
    const set = [base]; for (let t = 0; t < 30 && set.length < 4; t++) { const v = rand() < .5 ? variant() : base + pick([1, -1]) * 10 ** R(0, k - 2) * R(1, 3); if (!set.includes(v) && v >= 10 ** (k - 1)) set.push(v); }
    for (let i = 1; set.length < 4; i++) if (!set.includes(base + i * 10)) set.push(base + i * 10);
    if (form === 0) {
      const most = rand() < .5, best = most ? Math.max(...set) : Math.min(...set);
      return { topic: 'COMPARE', text: `Which number is the ${most ? 'greatest' : 'least'}?`, ...txt(N(best), set.filter(v => v !== best).map(N)),
        steps: ['Compare from the left: the biggest place first.', 'The first place where they differ decides.', `The ${most ? 'greatest' : 'least'} is ${N(best)}.`] };
    }
    if (form === 1) {
      const [a, b] = set, sym = a < b ? '<' : '>', opp = sym === '<' ? '>' : '<';
      return { topic: 'COMPARE', text: 'Which is true?', ...txt(`${N(a)} ${sym} ${N(b)}`, [`${N(a)} ${opp} ${N(b)}`, `${N(a)} = ${N(b)}`, `${N(b)} ${sym} ${N(a)}`]),
        steps: ['Compare place by place, starting on the left.', `${N(a)} is ${a < b ? 'less' : 'greater'} than ${N(b)}.`] };
    }
    const three = set.slice(0, 3), up = three.slice().sort((p, q) => p - q), L = a => a.map(N).join(', ');
    const perms = [[up[1], up[0], up[2]], [up[0], up[2], up[1]], [up[2], up[1], up[0]], [up[2], up[0], up[1]], [up[1], up[2], up[0]]];
    return { topic: 'COMPARE', text: 'Which list is in order from least to greatest?', ...txt(L(up), shuffle(perms).map(L)), steps: ['Compare place by place from the left.', `Least to greatest: ${L(up)}`] };
  };
  const PL4 = [[10, 'ten'], [100, 'hundred'], [1000, 'thousand'], [10000, 'ten thousand'], [100000, 'hundred thousand']];
  // 4.NBT.3: rounding to any place.
  G4.round = d => {
    const [p, nm] = pick(PL4.slice(d < 2 ? 1 : 0, d < 2 ? 3 : d < 3 ? 4 : 5));
    let n = R(p === 100000 ? 100001 : Math.max(p * 10, 1000), p === 100000 ? 949999 : Math.min(999999, p * 1000 - 1));
    if (d >= 3 && rand() < .4) { n = n - digitAt(n, p) * p + 9 * p; n = n - digitAt(n, p / 10) * (p / 10) + R(5, 9) * (p / 10); }
    if (n % p === 0) n += p / 10;
    const ans = rnd(n, p), lo = Math.floor(n / p) * p, nd = digitAt(n, p / 10), carry9 = digitAt(n, p) === 9 && nd >= 5;
    const wr = [ans === lo ? lo + p : lo, rnd(n, p * 10), p >= 100 ? rnd(n, p / 10) : n, carry9 && n >= 10 * p ? Math.floor(n / (10 * p)) * 10 * p : ans + p, ans - p];
    const text = rand() < .4 ? `${pick([`A stadium holds ${N(n)} fans.`, `A city has ${N(n)} people.`, `A video has ${N(n)} views.`, `A library has ${N(n)} books.`])} What is that number rounded to the nearest ${nm}?` : `Round ${N(n)} to the nearest ${nm}.`;
    return { topic: 'ROUNDING', text, ...nums(ans, wr.filter(v => v !== ans && v > 0), N, p),
      steps: [`Look at the digit to the right of the ${PLACE[p]} place: ${nd}.`, nd >= 5 ? `It is 5 or more, so round up${carry9 ? ' (the 9 rolls over, carrying 1)' : ''}.` : 'It is less than 5, so round down.', `${N(n)} rounds to ${N(ans)}.`] };
  };
  // 4.NBT.4: adding and subtracting multi-digit numbers.
  G4.addSub = d => {
    const sub = rand() < .5, k = [4, 5, 5, 6][d - 1], form = R(0, d < 2 ? 1 : 2), n = who();
    const [a, b] = sub && d >= 3 && rand() < .5 ? acrossZero(k) : addPair(k, k - R(0, 1), R(1, 3), sub, 999999);
    if (form === 2) {
      if (sub) return { topic: 'ADD & SUBTRACT', text: `${N(a)} - ? = ${N(a - b)}. What is the missing number?`, ...nums(b, [a + (a - b), smallFromBig(a, a - b), b + 10, b - 100]),
        steps: [`${N(a)} - ${N(a - b)} = ${N(b)}`, `Check: ${N(a)} - ${N(b)} = ${N(a - b)}`] };
      return { topic: 'ADD & SUBTRACT', text: `${N(a)} + ? = ${N(a + b)}. What is the missing number?`, ...nums(b, [2 * a + b, smallFromBig(a + b, a), b + 10, b - 100]),
        steps: [`${N(a + b)} - ${N(a)} = ${N(b)}`, `Check: ${N(a)} + ${N(b)} = ${N(a + b)}`] };
    }
    if (form === 1) {
      const T = sub ? pick([`A stadium had ${N(a)} fans on Saturday and ${N(b)} fans on Sunday. How many more came on Saturday?`, `A video game has ${N(a)} coins to find. ${n} has found ${N(b)}. How many are left?`,
        `A school raised $${N(a)} and spent $${N(b)}. How many dollars are left?`]) : pick([`A theater sold ${N(a)} tickets in June and ${N(b)} in July. How many tickets in all?`,
        `${n}'s town has ${N(a)} people, and the next town has ${N(b)}. How many people live in both towns?`]);
      return addSubQ(a, b, sub, T);
    }
    return addSubQ(a, b, sub);
  };
  // The slips kids make multiplying: dropping carries, forgetting the zero on the second partial product.
  function multSlips(a, b) {
    const out = [];
    if (b < 10) { const ds = String(a).split('').map(Number).reverse(); let v = 0; ds.forEach((x, i) => { v += (i === ds.length - 1 ? x * b : (x * b) % 10) * 10 ** i; }); out.push(v); }
    else { const b1 = Math.floor(b / 10), b0 = b % 10; out.push(a * b0 + a * b1); if (a < 100) out.push(Math.floor(a / 10) * b1 * 100 + (a % 10) * b0); }
    out.push(a * b + 10, a * b - 10, a * b + 100);
    return out;
  }
  // 4.NBT.5: multiplying up to 4 digits by 1 digit, and 2 digits by 2 digits.
  G4.multiply = d => {
    const form = R(0, d < 2 ? 2 : 3), two = d >= 3 && rand() < .55, n = who();
    const a = two ? R(12, 99) : R(10 ** [1, 2, 2, 3][d - 1], 10 ** [2, 3, 4, 4][d - 1] - 1), b = two ? R(11, 99) : R(3, 9), p = a * b;
    if (form === 0 && d < 3 && rand() < .4) {
      const x = R(2, 9), z = 10 ** R(1, 3), y = R(2, 9);
      return { topic: 'MULTIPLY', text: `${x} × ${N(y * z)} = ?`, ...nums(x * y * z, [x * y * z / 10, x * y * z * 10, x * y, x + y * z]), steps: [`${x} × ${y} = ${x * y}`, `${N(y * z)} is ${y} × ${N(z)}, so add the zeros back: ${N(x * y * z)}.`] };
    }
    const steps = two ? [`${N(a)} × ${b % 10} = ${N(a * (b % 10))}`, `${N(a)} × ${b - b % 10} = ${N(a * (b - b % 10))}`, `${N(a * (b % 10))} + ${N(a * (b - b % 10))} = ${N(p)}`]
      : [`Multiply each place by ${b}, starting with the ones.`, ...(a >= 100 ? [range(String(a).length).map(i => digitAt(a, 10 ** i) * 10 ** i).filter(v => v).reverse().map(v => `${b} × ${N(v)} = ${N(b * v)}`).join(', ')] : [`${b} × ${a - a % 10} = ${b * (a - a % 10)} and ${b} × ${a % 10} = ${b * (a % 10)}`]), `Add them: ${N(p)}`];
    if (form === 1) {
      const T = two ? pick([`A theater has ${a} rows with ${b} seats in each row. How many seats are there?`, `A farm packs ${a} boxes with ${b} apples in each. How many apples is that?`,
        `${n} rides ${b} miles a week for ${a} weeks. How many miles is that?`]) : pick([`A store sells ${N(a)} packs of gum each day. How many packs does it sell in ${b} days?`,
        `Each robot kit costs $${N(a)}. What do ${b} kits cost?`, `A plane flies ${N(a)} miles each trip. How many miles does it fly in ${b} trips?`]);
      return { topic: 'MULTIPLY', text: T, ...nums(p, multSlips(a, b), T.includes('$') ? dol : N), steps };
    }
    if (form === 2 && !two && a >= 100) {
      const parts = range(String(a).length).map(i => digitAt(a, 10 ** i) * 10 ** i).filter(v => v).reverse();
      const E = f => parts.map(f).join(' + '), right = E(v => `${b} × ${N(v)}`);
      return { topic: 'MULTIPLY', text: `Which is equal to ${b} × ${N(a)}?`, ...txt(right, [E(v => `${b} × ${Math.round(v / 10 ** Math.floor(Math.log10(v)))}`), `${b} × ${N(parts[0])} + ${parts.slice(1).map(N).join(' + ')}`, parts.map(N).join(' + ') + ` + ${b}`, parts.map(v => `${b} + ${N(v)}`).join(' + ')]),
        steps: [`Break ${N(a)} into ${parts.map(N).join(' + ')}.`, `Multiply each part by ${b}: ${right}`, `= ${N(p)}`] };
    }
    return { topic: 'MULTIPLY', text: `${N(a)} × ${b} = ?`, ...nums(p, multSlips(a, b)), steps };
  };
  // 4.NBT.5: area models for multiplication.
  G4.areaModel = d => {
    const two = d >= 2 && rand() < .7, a = two ? R(12, 49) : R(102, 899), b = two ? R(12, 39) : R(3, 9);
    const cols = (two ? [a - a % 10, a % 10] : range(3).map(i => digitAt(a, 10 ** (2 - i)) * 10 ** (2 - i))).filter(v => v), rows = two ? [b - b % 10, b % 10].filter(v => v) : [b];
    const cells = rows.map(r => cols.map(c => r * c)), hr = R(0, rows.length - 1), hc = R(0, cols.length - 1), hide = cells[hr][hc], tot = a * b, ask = rand() < .5;
    const fig = { size: [156, two ? 66 : 44], fig: (c, w, h) => {
      const cw = cols.map(v => v >= 10 ? 46 : 30), rh = rows.map(v => v >= 10 ? 26 : 18), x0 = Math.round((w - sum(cw)) / 2) + 6, y0 = 12;
      let y = y0;
      rows.forEach((r, j) => {
        let x = x0;
        cols.forEach((cv, i) => {
          F.box(c, x, y, cw[i], rh[j], (i + j) % 2 ? FILL : FILL2); frame(c, x, y, cw[i] + 1, rh[j] + 1, INK);
          const s = !ask && j === hr && i === hc ? '?' : N(cells[j][i]);
          lbl(c, s, x + cw[i] / 2 + 1, y + rh[j] / 2 + 2, s === '?' ? HOT : INK);
          if (j === 0) lbl(c, N(cv), x + cw[i] / 2 + 1, y0 - 6, SOFT);
          x += cw[i];
        });
        lbl(c, N(r), x0 - 4, y + rh[j] / 2 + 2, SOFT, 'right');
        y += rh[j];
      });
    } };
    if (ask) return { topic: 'MULTIPLY', ...fig, text: `The area model shows ${N(a)} × ${b}. What is the product?`, ...nums(tot, [sum(cells.map(r => r[0])), tot - hide, tot + 10, cells[0][0]]),
      steps: [`Add all the parts: ${cells.flat().map(N).join(' + ')}`, `= ${N(tot)}`] };
    return { topic: 'MULTIPLY', ...fig, text: `The area model shows ${N(a)} × ${b}. What number goes in the box with the ?`, ...nums(hide, [hide / 10, hide * 10, rows[hr] + cols[hc], (rows[hr] % 10 || rows[hr] / 10) * (cols[hc] % 10 || cols[hc] / 10)]),
      steps: [`That box is ${N(rows[hr])} × ${N(cols[hc])}.`, `${N(rows[hr])} × ${N(cols[hc])} = ${N(hide)}`] };
  };
  const QR = (q, r) => r ? `${N(q)} R${r}` : N(q);
  // 4.NBT.6: dividing up to four digits by one digit, with remainders.
  G4.divide = d => {
    const dv = R(2, 9), form = R(0, d < 2 ? 1 : 2), n = who();
    let q = d === 1 ? R(11, 30) : d === 2 ? R(100, 250) : rand() < .5 ? R(1, 9) * 100 + R(1, 9) : R(Math.ceil(1000 / dv), Math.floor(9999 / dv));
    if (d === 2 && q * dv > 999) q = Math.floor(999 / dv);
    const r = rand() < .6 ? R(1, dv - 1) : 0, t = q * dv + r, right = QR(q, r);
    const wr = [QR(q - 1, r + dv), QR(q + 1, r), r ? QR(q, 0) : QR(q, 1), r < dv - 1 ? QR(q, r + 1) : QR(q - 1, r), QR(q + 10, r)];
    if (String(q).includes('0')) wr.unshift(QR(Number(String(q).replace(/0/g, '')), r));
    const steps = [`${dv} goes into ${N(t)} ${N(q)} times: ${dv} × ${N(q)} = ${N(q * dv)}.`, r ? `${N(t)} - ${N(q * dv)} = ${r} left over.` : 'Nothing is left over.', `${N(t)} ÷ ${dv} = ${right}`];
    if (form === 0) return { topic: 'DIVIDE', text: `${N(t)} ÷ ${dv} = ?`, ...txt(right, wr), steps };
    if (form === 1) return { topic: 'DIVIDE', text: `${n} packs ${N(t)} marbles into ${dv} equal bags. How many go in each bag${r ? ', and how many are left over' : ''}?`, ...txt(right, wr), steps };
    const r2 = r || 1, t2 = q * dv + r2, qr = QR(q, r2);
    const cands = [[`${dv} × ${N(q)} + ${r2}`, t2], [`${dv} × ${N(q)} - ${r2}`, dv * q - r2], [`${dv} + ${N(q)} + ${r2}`, dv + q + r2], [`${N(q)} × ${r2} + ${dv}`, q * r2 + dv], [`${N(q + r2)} × ${dv}`, (q + r2) * dv]];
    return { topic: 'DIVIDE', text: `How can you check that ${N(t2)} ÷ ${dv} = ${qr}?`, ...txt(cands[0][0], cands.slice(1).filter(x => x[1] !== t2).map(x => x[0])),
      steps: ['Multiply the answer by the number you divided by, then add the remainder.', `${dv} × ${N(q)} + ${r2} = ${N(t2)}`] };
  };
  // 4.NF.1
  G4.fracEquiv = fracEquivKind([2, 3, 4, 5, 6, 8, 10, 12, 100], 100, true);
  const FAMS = [[2, 4, 8], [2, 3, 6, 12], [3, 4, 6, 12], [2, 5, 10], [2, 4, 5, 10], [3, 6, 8, 12], [2, 3, 4, 8]];
  // 4.NF.2: comparing fractions with different tops and bottoms.
  G4.fracCompare = d => {
    const fam = pick(FAMS), form = R(0, d < 2 ? 1 : 2), val = p => p[0] / p[1];
    const one = () => { const b = pick(fam); return [R(1, b - 1), b]; };
    if (form === 0) {
      let p, q; for (let t = 0; t < 40; t++) { p = one(); q = one(); if (p[1] !== q[1] && p[0] !== q[0] && Math.abs(val(p) - val(q)) > 1e-9) break; }
      if (Math.abs(val(p) - val(q)) < 1e-9) { p = [1, 2]; q = [2, 3]; }
      const L = lcm(p[1], q[1]), sym = val(p) < val(q) ? '<' : '>', opp = sym === '<' ? '>' : '<', P = fr(...p), Q = fr(...q);
      return { topic: 'FRACTIONS', text: 'Which is true?', ...txt(`${P} ${sym} ${Q}`, [`${P} ${opp} ${Q}`, `${P} = ${Q}`, `${Q} ${sym} ${P}`]),
        steps: [`Use the same bottom number, ${L}.`, `${P} = ${fr(p[0] * L / p[1], L)} and ${Q} = ${fr(q[0] * L / q[1], L)}.`, `${p[0] * L / p[1]} ${sym} ${q[0] * L / q[1]}, so ${P} ${sym} ${Q}.`] };
    }
    if (form === 1) {
      const above = rand() < .5, ok = p => above ? val(p) > .5 : val(p) < .5, bad = p => above ? val(p) < .5 : val(p) > .5;
      const pool = []; for (const b of [3, 4, 5, 6, 8, 10, 12]) for (let a = 1; a < b; a++) if (gcd(a, b) === 1) pool.push([a, b]);
      const right = pick(pool.filter(ok)), wrongs = shuffle(pool.filter(bad)).slice(0, 3);
      return { topic: 'FRACTIONS', text: `Which fraction is ${above ? 'greater' : 'less'} than 1/2?`, ...txt(fr(...right), wrongs.map(p => fr(...p))),
        steps: [`Half of the bottom number is the halfway mark.`, `${fr(...right)}: half of ${right[1]} is ${right[1] / 2}, and ${right[0]} is ${above ? 'more' : 'less'}.`, `So ${fr(...right)} is ${above ? 'greater' : 'less'} than 1/2.`] };
    }
    const set = []; for (let t = 0; t < 60 && set.length < 4; t++) { const p = one(); if (!set.some(q => Math.abs(val(q) - val(p)) < 1e-9)) set.push(p); }
    while (set.length < 4) set.push([set.length, 13]);
    const L = set.reduce((m, p) => lcm(m, p[1]), 1), best = set.reduce((m, p) => val(p) > val(m) ? p : m), kids = people(4), right = kids[set.indexOf(best)];
    return { topic: 'FRACTIONS', text: `${kids.map((k, i) => `${k} ran ${fr(...set[i])} mile`).join(', ')}. Who ran the farthest?`, ...txt(right, kids.filter(k => k !== right)),
      steps: [`Write them all over ${L}: ${set.map(p => fr(p[0] * L / p[1], L)).join(', ')}.`, `The biggest is ${fr(best[0] * L / best[1], L)}${best[1] === L ? '' : ` = ${fr(...best)}`}.`, `${right} ran the farthest.`] };
  };
  // 4.NF.3a,d: adding and subtracting fractions with the same bottom.
  G4.fracAdd = d => {
    const b = pick([3, 4, 5, 6, 8, 10, 12]), sub = rand() < .45, word = d >= 2 && rand() < .5, n = who(), M = p => mx(p[0], p[1], false);
    let a1, a2;
    if (sub) { a1 = R(2, d < 3 ? b - 1 : b + 3); a2 = R(1, a1 - 1); }
    else { a1 = R(1, b - 1); a2 = R(1, d < 3 ? Math.max(1, b - a1) : b - 1); }
    const ans = [sub ? a1 - a2 : a1 + a2, b], wr = sub ? [[a1 + a2, b], [a1 - a2, b * 2], [a1 - a2 + 1, b], [a1 - a2 - 1, b]] : [[a1 + a2, 2 * b], [a1 + a2 + 1, b], [a1 + a2 - 1, b], [a1 * a2, b]];
    const ex = `${M([a1, b])} ${sub ? '-' : '+'} ${M([a2, b])}`;
    const text = !word ? `${ex} = ?` : sub ? pick([`A ribbon is ${M([a1, b])} meter long. ${n} cuts off ${M([a2, b])} meter. How much is left?`, `${n} had ${M([a1, b])} of a pizza and ate ${M([a2, b])} of a pizza. How much pizza is left?`])
      : pick([`${n} walked ${M([a1, b])} mile to school and ${M([a2, b])} mile to the park. How far did ${n} walk?`, `A recipe uses ${M([a1, b])} cup of milk and ${M([a2, b])} cup of water. How much liquid is that?`]);
    return { topic: 'FRACTIONS', text, ...fracs(ans, wr, M),
      steps: [`The parts are all ${DNAME[b]}, so the bottom stays ${b}.`, `${sub ? 'Subtract' : 'Add'} the tops: ${a1} ${sub ? '-' : '+'} ${a2} = ${ans[0]}.`, `${ex} = ${M(ans)}`] };
  };
  // 4.NF.3b: breaking a fraction into a sum of fractions.
  G4.fracDecompose = d => {
    const b = pick([4, 5, 6, 8, 10, 12]), a = R(3, b - 1), x = R(1, a - 1), y = a - x, form = R(0, d < 2 ? 1 : 2), v = (p, q) => p / q;
    if (form === 0) {
      const right = rand() < .7 ? `${fr(x, b)} + ${fr(y, b)}` : `${fr(1, b)} + ${fr(1, b)} + ${fr(a - 2, b)}`;
      const cands = [[`${fr(x, b)} + ${fr(y, b + 1)}`, v(x, b) + v(y, b + 1)], [`${fr(x, 2 * b)} + ${fr(y, 2 * b)}`, v(a, 2 * b)], [`${fr(x + 1, b)} + ${fr(y + 1, b)}`, v(a + 2, b)],
        [`${fr(a, b)} + ${fr(a, b)}`, v(2 * a, b)], [`${fr(x, b)} + ${fr(y + 1, b)}`, v(a + 1, b)], [`${fr(x, a)} + ${fr(y, a)}`, 1]];
      const bw = b * Math.floor(96 / b) + 1;
      return { topic: 'FRACTIONS', text: `Which sum is equal to ${fr(a, b)}?`, ...txt(right, cands.filter(c => Math.abs(c[1] - v(a, b)) > 1e-9).map(c => c[0])),
        steps: [`${fr(a, b)} is ${a} parts of 1/${b}.`, `Split the ${a} parts into groups; keep the bottom ${b}.`, `${right} = ${fr(a, b)}`],
        ...(d < 3 ? { size: [100, 28], fig: (c, w, h) => fbar(c, Math.round((w - bw) / 2), 6, bw, 16, b, a) } : {}) };
    }
    if (form === 1) return { topic: 'FRACTIONS', text: `${fr(x, b)} + ?/${b} = ${fr(a, b)}. What is the missing number?`, ...nums(y, [a + x, a, y + 1, b - a]),
      steps: [`${x} ${pl(x, 'part')} plus how many parts make ${a}?`, `${a} - ${x} = ${y}`, `${fr(x, b)} + ${fr(y, b)} = ${fr(a, b)}`] };
    const w = R(1, 2), r = R(1, b - 1), wholes = Array(w).fill(fr(b, b)).join(' + ');
    const cands = [[`${fr(w, b)} + ${fr(r, b)}`, v(w + r, b)], [fr(w + r, b), v(w + r, b)], [`${Array(w).fill(fr(1, b)).join(' + ')} + ${fr(r, b)}`, v(w + r, b)], [`${wholes} + ${fr(r + 1, b)}`, w + v(r + 1, b)], [`${fr(b, b)} + ${fr(r, b)}`, 1 + v(r, b)]];
    return { topic: 'FRACTIONS', text: `Which is equal to ${w} ${fr(r, b)}?`, ...txt(`${wholes} + ${fr(r, b)}`, cands.filter(c => Math.abs(c[1] - (w + v(r, b))) > 1e-9).map(c => c[0])),
      steps: [`Each whole is ${fr(b, b)}.`, `${w} ${fr(r, b)} = ${wholes} + ${fr(r, b)}`] };
  };
  // 4.NF.3c: mixed numbers: converting, adding and subtracting with the same bottom.
  G4.mixedNumbers = d => {
    const b = pick([2, 3, 4, 5, 6, 8, 10]), form = R(0, d < 2 ? 1 : 4), M = p => mx(p[0], p[1], false), n = who();
    if (form === 0) {
      const w = R(1, 5), r = R(1, b - 1), N1 = w * b + r;
      return { topic: 'MIXED NUMBERS', text: `${w} ${fr(r, b)} = ?/${b}. What is the missing number?`, ...nums(N1, [w + r, w * r + b, w * b, w * r, N1 + b]),
        steps: [`Each whole is ${b}/${b}, so ${w} ${pl(w, 'whole is', 'wholes are')} ${w} × ${b} = ${w * b} ${DNAME[b]}.`, `Add the ${r}: ${w * b} + ${r} = ${N1}.`, `${w} ${fr(r, b)} = ${fr(N1, b)}`] };
    }
    if (form === 1) {
      const w = R(1, 6), r = R(1, b - 1), N1 = w * b + r;
      return { topic: 'MIXED NUMBERS', text: `What is ${fr(N1, b)} as a mixed number?`, ...fracs([N1, b], [w < b && r < b && r > 0 ? [r * b + w, b] : null, [N1 - b, b], [N1 + b, b], [N1 + 1, b], [N1 - 1, b]], M),
        steps: [`${N1} ÷ ${b} = ${w} R${r}.`, `That's ${w} wholes and ${r} ${b === 2 ? 'half' : 'part'}${r > 1 ? 's' : ''} left: ${M([N1, b])}.`] };
    }
    const w1 = R(1, 4), w2 = R(1, 3), r1 = R(1, b - 1), r2 = R(1, b - 1), n1 = w1 * b + r1, n2 = w2 * b + r2;
    if (form === 2 || form === 4) {
      const s = n1 + n2, word = form === 4;
      const text = word ? pick([`A recipe uses ${M([n1, b])} cups of flour for bread and ${M([n2, b])} cups for muffins. How many cups is that?`, `${n} hiked ${M([n1, b])} miles on Saturday and ${M([n2, b])} miles on Sunday. How far is that in all?`])
        : `${M([n1, b])} + ${M([n2, b])} = ?`;
      return { topic: 'MIXED NUMBERS', text, ...fracs([s, b], [r1 + r2 >= b ? [s - b, b] : [s + b, b], [(w1 + w2) * 2 * b + r1 + r2, 2 * b], [s + 1, b], [s - 1, b]], M),
        steps: [`Wholes: ${w1} + ${w2} = ${w1 + w2}. Parts: ${fr(r1, b)} + ${fr(r2, b)} = ${fr(r1 + r2, b)}.`, r1 + r2 >= b ? `${fr(r1 + r2, b)} = ${M([r1 + r2, b])}, so carry the whole.` : 'The parts make less than 1 whole.', `Total: ${M([s, b])}`] };
    }
    let [A, B] = n1 > n2 ? [n1, n2] : [n2, n1];
    if (A === B) A += b;
    const diff = A - B, ra = A % b, rb = B % b, wa = Math.floor(A / b), wb = Math.floor(B / b);
    return { topic: 'MIXED NUMBERS', text: `${M([A, b])} - ${M([B, b])} = ?`, ...fracs([diff, b], [ra < rb ? [(wa - wb) * b + (rb - ra), b] : [diff + b, b], [diff + 1, b], [diff - 1, b], [diff + b, b]], M),
      steps: ra < rb ? [`${fr(ra, b)} is less than ${fr(rb, b)}, so trade 1 whole for ${fr(b, b)}.`, `${M([A, b])} = ${wa - 1} ${fr(ra + b, b)}`, `${wa - 1} ${fr(ra + b, b)} - ${M([B, b])} = ${M([diff, b])}`]
        : [`Wholes: ${wa} - ${wb} = ${wa - wb}.`, `Parts: ${fr(ra, b)} - ${fr(rb, b)} = ${fr(ra - rb, b)}.`, `Answer: ${M([diff, b])}`] };
  };
  // 4.NF.4: a whole number times a fraction.
  G4.fracTimesWhole = d => {
    const b = pick([3, 4, 5, 6, 8, 10]), a = R(1, Math.min(b - 1, 5)), k = R(2, d < 3 ? 6 : 9), n = who();
    let form = R(0, d < 2 ? 1 : 3); if (form === 3 && (k * a) % b === 0) form = 0;
    if (form === 0) return { topic: 'FRACTIONS', text: `${k} × ${fr(a, b)} = ?`, ...fracs([k * a, b], [[k * a, k * b], [a, k * b], [k + a, b], [b, k * a], [k * a, b + k]]),
      steps: [`${k} × ${fr(a, b)} means ${k} groups of ${fr(a, b)}.`, `Multiply the top only: ${k} × ${a} = ${k * a}.`, `${k} × ${fr(a, b)} = ${fr(k * a, b)}`] };
    if (form === 1) {
      const A = Math.max(2, a), cands = [[`${b} × ${fr(1, A)}`, b / A], [`${A} × ${fr(1, A)}`, 1], [`${A} + ${fr(1, b)}`, A + 1 / b], [`${b} × ${fr(A, 1)}`, A * b], [`${A} × ${fr(A, b)}`, A * A / b]];
      return { topic: 'FRACTIONS', text: `Which is equal to ${fr(A, b)}?`, ...txt(`${A} × ${fr(1, b)}`, cands.filter(c => Math.abs(c[1] - A / b) > 1e-9).map(c => c[0])),
        steps: [`${fr(A, b)} is ${A} pieces of size ${fr(1, b)}.`, `So ${fr(A, b)} = ${A} × ${fr(1, b)}.`] };
    }
    if (form === 2) {
      const S = pick([[`Each kid eats ${fr(a, b)} of a pizza. How much pizza do ${k} kids eat?`, 'pizzas'], [`${n} runs ${fr(a, b)} mile each day. How far does ${n} run in ${k} days?`, 'miles'],
        [`A puppy eats ${fr(a, b)} cup of food at each meal. How much food is in ${k} meals?`, 'cups']]);
      const unit = k * a < b ? S[1].replace(/s$/, '') : S[1];
      return { topic: 'FRACTIONS', text: S[0], ...fracs([k * a, b], [[k * a, k * b], [k + a, b], [a, k * b], [k * a + b, b]], p => mx(p[0], p[1])),
        steps: [`${k} groups of ${fr(a, b)}: multiply the top by ${k}.`, `${k} × ${fr(a, b)} = ${fr(k * a, b)}${mx(k * a, b) !== fr(k * a, b) ? ` = ${mx(k * a, b)}` : ''} ${unit}`] };
    }
    const lo = Math.floor(k * a / b), S = x => `${x} and ${x + 1}`;
    return { topic: 'FRACTIONS', text: `${k} × ${fr(a, b)} is between which two whole numbers?`, ...txt(S(lo), [S(lo + 1), lo > 0 ? S(lo - 1) : S(lo + 3), S(lo + 2), S(k), S(k * a)].filter((s, i, A) => A.indexOf(s) === i)),
      steps: [`${k} × ${fr(a, b)} = ${fr(k * a, b)}`, `${fr(k * a, b)} = ${mx(k * a, b)}`, `That is between ${lo} and ${lo + 1}.`] };
  };
  // 4.NF.5: tenths as hundredths, and adding them.
  G4.tenthsHundredths = d => {
    const form = R(0, d < 2 ? 0 : 2), a = R(1, 9), c = R(1, 99 - 10 * a);
    if (form === 0) return { topic: 'FRACTIONS', text: `${fr(a, 10)} = ?/100. What is the missing number?`, ...nums(a * 10, [a, a * 100, a + 90, a + 10]),
      steps: ['10 × 10 = 100, so multiply the top by 10 too.', `${fr(a, 10)} = ${fr(a * 10, 100)}`] };
    if (form === 1) return { topic: 'FRACTIONS', text: `${fr(a, 10)} + ${fr(c, 100)} = ?`, ...fracs([a * 10 + c, 100], [[a + c, 110], [a + c, 100], [a * 10 + c, 1000], [a + c * 10, 100]].filter(p => p[0] <= 100)),
      steps: [`Make the bottoms match: ${fr(a, 10)} = ${fr(a * 10, 100)}.`, `${fr(a * 10, 100)} + ${fr(c, 100)} = ${fr(a * 10 + c, 100)}`] };
    const q = R(1, 9), p = R(1, 9);
    return { topic: 'FRACTIONS', text: `${who()} has ${q} ${pl(q, 'dime')} and ${p} ${pl(p, 'penny', 'pennies')}. What fraction of a dollar is that?`, ...fracs([q * 10 + p, 100], [[q + p, 100], [q + p, 10], [q * 10 + p, 10], [p * 10 + q, 100]]),
      steps: [`A dime is ${fr(10, 100)} of a dollar; a penny is ${fr(1, 100)}.`, `${q} × 10 + ${p} = ${q * 10 + p} cents`, `That's ${fr(q * 10 + p, 100)} of a dollar.`] };
  };
  function decGrid(k, wholes = 0) {
    return { size: [wholes ? 120 : 64, 58], fig: (c, w, h) => {
      const s = 5, x0 = Math.round((w - (wholes ? 2 * 51 + 8 : 51)) / 2), y0 = 3;
      if (wholes) cellGrid(c, x0, y0, 10, 10, s, () => true, HOT);
      cellGrid(c, x0 + (wholes ? 59 : 0), y0, 10, 10, s, (i, j) => i * 10 + j < k, HOT);
    } };
  }
  // 4.NF.6: decimals for tenths and hundredths, and decimals as fractions.
  G4.decimals = d => {
    const form = R(0, d < 2 ? 1 : 4);
    if (form === 0) {
      const k = R(3, 97), two = d >= 3 && rand() < .4, v = (two ? 100 + k : k) / 100, rev = Number(String(k).padStart(2, '0').split('').reverse().join(''));
      return { topic: 'DECIMALS', text: `Each grid is 1 whole. What decimal names the shaded part?`, ...decGrid(k, two ? 1 : 0), ...nums(v, [v * 10, two ? 100 + k : k, (two ? 100 + rev : rev) / 100, v + .1, v - .1], N, .01),
        steps: [two ? `One whole grid is shaded, plus ${k} hundredths.` : `${k} of the 100 squares are shaded.`, `${two ? '1 and ' : ''}${k} hundredths = ${N(v)}`] };
    }
    if (form === 1) {
      const hund = rand() < .6, a = hund ? R(1, 99) : R(1, 9), v = hund ? a / 100 : a / 10;
      return { topic: 'DECIMALS', text: `Write ${fr(a, hund ? 100 : 10)} as a decimal.`, ...nums(v, [hund ? a / 10 : a / 100, a, v / 10, v + 1], N, hund ? .01 : .1),
        steps: [hund ? 'Hundredths go two places after the point.' : 'Tenths go one place after the point.', `${fr(a, hund ? 100 : 10)} = ${N(v)}`] };
    }
    if (form === 2) {
      const hund = rand() < .5, a = hund ? R(11, 99) : R(1, 9), bot = hund ? 100 : 10, v = a / bot;
      if (a % 10 === 0) return G4.decimals(1);
      return { topic: 'DECIMALS', text: `Which fraction is equal to ${N(v)}?`, ...fracs([a, bot], [[a, hund ? 10 : 100], [1, a], [a, 1], [bot, a], [a, 1000]]),
        steps: [`${N(v)} is ${hund ? `${a} hundredths` : `${a} tenths`}.`, `So ${N(v)} = ${fr(a, bot)}`] };
    }
    if (form === 3) {
      const x = R(1, 9), w = R(0, 2);
      return { topic: 'DECIMALS', text: 'What decimal is at point P on the number line?', ...nums(w + x / 10, [w + x / 100, w + (x + 1) / 10, w + (x - 1) / 10, w + x, w + 1 + x / 10].filter(v => v >= 0), N, .1),
        steps: [`From ${w} to ${w + 1} is split into 10 tenths.`, `P is ${x} tenths past ${w}: ${N(w + x / 10)}.`],
        size: [168, 42], fig: (c, wd, h) => {
          const y = 25, X = nline(c, 14, wd - 14, y, 0, 10);
          for (let i = 0; i <= 10; i++) tick(c, X(i), y, i % 10 ? 2 : 4);
          lbl(c, w, X(0), y + 11); lbl(c, w + 1, X(10), y + 11); lbl(c, N(w + .5), X(5), y + 11, DIM);
          F.disc(c, X(x), y, 2, HOT); lbl(c, 'P', X(x), y - 9, HOT);
        } };
    }
    const w = R(1, 9), c = R(11, 99), v = w + c / 100, s = String(c);
    return { topic: 'DECIMALS', text: `Write ${words(w)} and ${w100(c)} hundredths as a decimal.`, ...nums(v, [w + c / 1000, w * 100 + c, w + Number(s[1] + s[0]) / 100, (w * 100 + c) / 10], N, .01),
      steps: [`The whole number ${w} goes before the point.`, `${c} hundredths: two places after the point.`, `${N(v)}`] };
  };
  // 4.NF.7: comparing decimals to hundredths.
  G4.decimalCompare = d => {
    const form = R(0, d < 2 ? 1 : 2), t = R(3, 8);
    const set = [t / 10, (t - 1) / 10 + R(1, 9) / 100, t / 100, (t + 1) / 10 + (d >= 3 ? R(1, 9) / 100 : 0)].map(v => Math.round(v * 100) / 100);
    if (form === 0) {
      const most = rand() < .5, best = most ? Math.max(...set) : Math.min(...set);
      return { topic: 'DECIMALS', text: `Which decimal is the ${most ? 'greatest' : 'least'}?`, ...txt(N(best), set.filter(v => v !== best).map(N)),
        steps: [`Write them all with hundredths: ${set.map(v => v.toFixed(2)).join(', ')}.`, `The ${most ? 'greatest' : 'least'} is ${N(best)}.`, 'More digits does not mean bigger!'] };
    }
    const [a, b] = form === 1 ? [set[0], set[1]] : [set[1], set[2]], sym = a < b ? '<' : '>', opp = sym === '<' ? '>' : '<';
    return { topic: 'DECIMALS', text: 'Which is true?', ...txt(`${N(a)} ${sym} ${N(b)}`, [`${N(a)} ${opp} ${N(b)}`, `${N(a)} = ${N(b)}`, `${N(b)} ${sym} ${N(a)}`]),
      steps: [`Compare as hundredths: ${a.toFixed(2)} and ${b.toFixed(2)}.`, `${Math.round(a * 100)} hundredths ${sym} ${Math.round(b * 100)} hundredths`, `So ${N(a)} ${sym} ${N(b)}.`] };
  };
  const CONV4 = [['feet', 'inches', 12], ['yards', 'feet', 3], ['hours', 'minutes', 60], ['minutes', 'seconds', 60], ['days', 'hours', 24], ['pounds', 'ounces', 16],
    ['kilograms', 'grams', 1000], ['meters', 'centimeters', 100], ['kilometers', 'meters', 1000], ['liters', 'milliliters', 1000], ['weeks', 'days', 7], ['yards', 'inches', 36]];
  const one = u => u === 'feet' ? 'foot' : u === 'inches' ? 'inch' : u.replace(/s$/, '');
  // 4.MD.1: converting to a smaller unit.
  G4.convert = d => {
    const [big, small, f] = pick(CONV4), k = R(2, f >= 100 ? 9 : 12), form = R(0, d < 2 ? 1 : 3);
    const wr = [k + f, f === 10 ? k * 100 : k * 10, f === 100 ? k * 10 : k * 100, k * f + f, f];
    if (form === 0) return { topic: 'MEASUREMENT', text: `${k} ${big} = ? ${small}`, ...nums(k * f, wr), steps: [`1 ${one(big)} = ${N(f)} ${small}`, `${k} × ${N(f)} = ${N(k * f)} ${small}`] };
    if (form === 1) return { topic: 'MEASUREMENT', text: `1 ${one(big)} = ${N(f)} ${small}. A table shows 1 → ${N(f)}, 2 → ${N(2 * f)}, 3 → ${N(3 * f)}. What goes next to ${k}?`, ...nums(k * f, [3 * f + f, k + f, k * 10, (k - 1) * f]),
      steps: [`Each ${one(big)} adds ${N(f)} ${small}.`, `${k} × ${N(f)} = ${N(k * f)}`] };
    if (form === 2) {
      const r = R(1, Math.min(f - 1, 50));
      return { topic: 'MEASUREMENT', text: `${k} ${big} ${r} ${r === 1 ? one(small) : small} = ? ${small}`, ...nums(k * f + r, [k * f, k + r, (k + r) * f, k * f - r, k * 10 + r]),
        steps: [`${k} ${big} = ${k} × ${N(f)} = ${N(k * f)} ${small}`, `Add the ${r}: ${N(k * f)} + ${r} = ${N(k * f + r)}`] };
    }
    const S = pick([[['feet', 12], ['yards', 36], ['inches', 1]], [['hours', 60], ['minutes', 1]], [['pounds', 16], ['ounces', 1]], [['meters', 100], ['centimeters', 1]]]);
    const opts = []; for (let t = 0; t < 40 && opts.length < 4; t++) { const [u, m] = pick(S), q = m === 1 ? R(2, S[0][1] * 5) : R(1, 5), v = q * m; if (!opts.some(o => o[2] === v)) opts.push([q, u, v]); }
    while (opts.length < 4) opts.push([opts.length * 7 + 1, S[S.length - 1][0], opts.length * 7 + 1]);
    const best = opts.reduce((m, o) => o[2] > m[2] ? o : m), s = o => `${o[0]} ${o[0] === 1 ? one(o[1]) : o[1]}`, base = S[S.length - 1][0];
    return { topic: 'MEASUREMENT', text: `Which is the ${base === 'minutes' ? 'longest time' : base === 'ounces' ? 'heaviest' : 'longest'}?`, ...txt(s(best), opts.filter(o => o !== best).map(s)),
      steps: [`Change them all to ${base}: ${opts.map(o => `${s(o)} = ${o[2]}`).join(', ')}.`, `The biggest is ${s(best)}.`] };
  };
  // 4.MD.2: word problems with money, time, distance, liquid volume and mass.
  G4.measureWord = d => {
    const n = who(), T = R(0, d < 2 ? 2 : 5);
    if (T === 0) {
      const k = R(2, 4), pc = R(5, 30) * 25, pay = [500, 1000, 2000, 5000, 10000].find(v => v > k * pc), ch = pay - k * pc;
      return { topic: 'MONEY', text: `${n} buys ${k} notebooks at ${usd(pc)} each and pays with a ${usd(pay)} bill. How much change does ${n} get?`.replace('.00 bill', ' bill'),
        ...nums(ch, [k * pc, pay - pc, ch + 100, ch + 25], usd, 25), steps: [`Cost: ${k} × ${usd(pc)} = ${usd(k * pc)}`, `Change: ${usd(pay)} - ${usd(k * pc)} = ${usd(ch)}`] };
    }
    if (T === 1) {
      const h = R(1, 10), m = R(0, 11) * 5, dh = R(1, 2), dm = R(1, 11) * 5, [h2, m2] = addMin(h, m, dh * 60 + dm), ev = pick(['A movie', 'A soccer tournament', 'The robot contest', 'A road trip']);
      return { topic: 'TIME', text: `${ev} starts at ${tm(h, m)} and lasts ${dh} ${pl(dh, 'hour')} ${dm} minutes. What time does it end?`,
        ...txt(tm(h2, m2), [tm(...addMin(h, m, dh * 60)), tm(...addMin(h, m, dh * 60 + dm + 60)), tm(...addMin(h, m, dh * 60 + dm - 10)), tm(...addMin(h, m, dm)), tm(...addMin(h, m, (dh + 1) * 60 + dm))]),
        steps: [`Add ${dh} ${pl(dh, 'hour')}: ${tm(...addMin(h, m, dh * 60))}.`, `Add ${dm} minutes: ${tm(h2, m2)}.`] };
    }
    if (T === 2) {
      const b = pick([2, 4, 8]), a1 = R(1, 3) * b + R(1, b - 1), a2 = R(1, 2) * b + R(1, b - 1), s = a1 + a2;
      return { topic: 'MEASUREMENT', text: `${n} ran ${mx(a1, b)} miles on Monday and ${mx(a2, b)} miles on Tuesday. How far did ${n} run in all?`,
        ...fracs([s, b], [[s - b, b], [s + b, b], [s + 1, b], [s - 1, b]], p => mx(p[0], p[1])), steps: [`${mx(a1, b)} + ${mx(a2, b)}`, `= ${mx(s, b)} miles`] };
    }
    if (T === 3) {
      const L = R(1, 3), g = pick([200, 250, 500]), q = L * 1000 / g;
      return { topic: 'MEASUREMENT', text: `A jug holds ${L} ${pl(L, 'liter')} of juice. How many ${g}-milliliter glasses can it fill?`, ...nums(q, [L * g, q * 10, Math.round(L * 100 / g * 10) || q + 2, q / 2 >= 1 ? q / 2 : q + 1]),
        steps: [`${L} ${pl(L, 'liter')} = ${N(L * 1000)} milliliters`, `${N(L * 1000)} ÷ ${g} = ${q} glasses`] };
    }
    if (T === 4) {
      const kg = R(2, 6), g1 = R(1, 9) * 100, g2 = R(2, 9) * 100, A = kg * 1000 + g1;
      return { topic: 'MEASUREMENT', text: `A puppy weighs ${kg} kilograms ${g1} grams. A kitten weighs ${g2} grams. How many grams heavier is the puppy?`,
        ...nums(A - g2, [A + g2, kg * 1000 - g2, kg + g1 - g2 > 0 ? kg + g1 - g2 : A, A - g2 + 1000], v => N(v) + ' g'), steps: [`${kg} kg ${g1} g = ${N(A)} grams`, `${N(A)} - ${g2} = ${N(A - g2)} grams`] };
    }
    const c = R(3, 12) * 50, k = R(2, 5), [p1, p2] = people(2);
    return { topic: 'MONEY', text: `${p1} has ${usd(c)}. ${p2} has ${k} times as much money. How much money does ${p2} have?`,
      ...nums(c * k, [c + k * 100, c * (k + 1), c * k + 100, c * k - 50], usd, 50), steps: [`${k} times as much means ${k} × ${usd(c)}.`, `${k} × ${usd(c)} = ${usd(c * k)}`] };
  };
  // 4.MD.3: area and perimeter of rectangles in the real world.
  G4.areaPerim = d => {
    const form = R(0, 4), [u, uu] = pick(UNITS);
    const a = R(6, [12, 20, 30, 40][d - 1]), b = R(3, Math.min(a - 1, 15));
    if (form === 0) return { topic: 'PERIMETER', text: `A garden is ${a} feet long and ${b} feet wide. How many feet of fence go all the way around it?`, ...nums(2 * (a + b), [a * b, a + b, 2 * a + b, 2 * (a + b) + 2]),
      steps: ['Fence goes around: that is the perimeter.', `${a} + ${b} + ${a} + ${b} = ${2 * (a + b)} feet`] };
    if (form === 1) return { topic: 'AREA', text: `A rug has an area of ${a * b} square feet. It is ${b} feet wide. How long is it?`, ...nums(a, [a * b - b, a * b / 2, a + 1, a - 1, 2 * b]),
      steps: [`Area = length × width, so ${b} × ? = ${a * b}.`, `${a * b} ÷ ${b} = ${a} feet`] };
    if (form === 2) return { topic: 'PERIMETER', text: `A rectangle has a perimeter of ${2 * (a + b)} ${uu}. Its length is ${a} ${uu}. What is its width?`, ...nums(b, [2 * (a + b) - a, 2 * b, a + b, b + 1, b - 1]),
      steps: [`Two lengths: ${a} + ${a} = ${2 * a}.`, `The two widths: ${2 * (a + b)} - ${2 * a} = ${2 * b}.`, `One width: ${2 * b} ÷ 2 = ${b} ${uu}`] };
    if (form === 3) { const s = R(3, 12); return { topic: 'AREA', text: `A square has a perimeter of ${4 * s} ${uu}. What is its area, in square ${uu}?`, ...nums(s * s, [4 * s, s, 2 * s, 16 * s * s, s * s + s]),
      steps: [`4 equal sides: ${4 * s} ÷ 4 = ${s} ${uu} each.`, `Area: ${s} × ${s} = ${s * s} square ${uu}`] }; }
    const ar = rand() < .5;
    return { topic: ar ? 'AREA' : 'PERIMETER', text: `What is the ${ar ? 'area' : 'perimeter'} of the rectangle?`, ...rectFig(a, b, `${a} ${u}`, `${b} ${u}`),
      ...nums(ar ? a * b : 2 * (a + b), ar ? [2 * (a + b), a + b, a * b + a] : [a * b, a + b, 2 * a + b], v => ar ? `${N(v)} sq ${u}` : `${v} ${u}`),
      steps: ar ? ['Area = length × width', `${a} × ${b} = ${a * b} square ${uu}`] : ['Perimeter = add all four sides', `${a} + ${b} + ${a} + ${b} = ${2 * (a + b)} ${uu}`] };
  };
  // 4.MD.4: line plots with fractions of an inch, and problems from them.
  G4.linePlot = d => {
    const things = pick(['beetles', 'ladybugs', 'seeds', 'shells', 'snails']), form = R(0, d < 2 ? 0 : 2);
    if (form === 0) return linePlotQ(d, 0, 8, 8, k => rf(k, 8) === '0' ? '0' : rf(k, 8), things, 'inch');
    let counts; for (let t = 0; t < 30; t++) { counts = range(9).map(i => i === 0 ? 0 : R(0, 3)); if (counts.filter(v => v).length >= 3) break; }
    const filled = range(9).filter(i => counts[i]), lo = filled[0], hi = filled[filled.length - 1], base = { topic: 'LINE PLOTS', ...plotFig(8, counts, k => rf(k, 8)) };
    const intro = `The line plot shows the lengths of some ${things}, in inches.`;
    if (form === 1 && hi > lo) return { ...base, text: `${intro} What is the difference between the longest and the shortest?`, ...fracs([hi - lo, 8], [[hi + lo, 8], [hi, 8], [hi - lo + 1, 8], [hi - lo, 16]], p => rf(p[0], p[1])),
      steps: [`Longest: ${rf(hi, 8)}. Shortest: ${rf(lo, 8)}.`, `${fr(hi, 8)} - ${fr(lo, 8)} = ${fr(hi - lo, 8)}${rf(hi - lo, 8) !== fr(hi - lo, 8) ? ` = ${rf(hi - lo, 8)}` : ''} inch`] };
    const many = filled.filter(i => counts[i] >= 2), k = pick(many.length ? many : filled), c = counts[k];
    return { ...base, text: `${intro} Put all the ${things} that are ${rf(k, 8)} inch long end to end. How long is the line?`, ...fracs([c * k, 8], [[k, 8], [c + k, 8], [c * k, 16], [c * k + 1, 8]], p => mx(p[0], p[1])),
      steps: [`There ${c === 1 ? 'is 1' : `are ${c}`} at ${rf(k, 8)} inch.`, `${c} × ${fr(k, 8)} = ${fr(c * k, 8)}${mx(c * k, 8) !== fr(c * k, 8) ? ` = ${mx(c * k, 8)}` : ''} ${c * k > 8 ? 'inches' : 'inch'}`] };
  };
  function protractorFig(deg, flip) {
    return { size: [168, 86], fig: (c, w, h) => {
      const cx = Math.round(w / 2), cy = h - 6, r = 64;
      for (let y = 0; y <= r; y++) { const x = Math.round(Math.sqrt(r * r - y * y)); F.box(c, cx - x, cy - y, 2 * x + 1, 1, '#1a2456'); }
      F.arc(c, cx, cy, r, 0, Math.PI, INK); hl(c, cx - r - 3, cy, 2 * r + 7, INK);
      for (let a = 0; a <= 180; a += 5) { const t = a * DEG, L = a % 30 === 0 ? 7 : a % 10 ? 2 : 4; F.line(c, cx + Math.cos(t) * r, cy - Math.sin(t) * r, cx + Math.cos(t) * (r - L), cy - Math.sin(t) * (r - L), SOFT); }
      for (let a = 0; a <= 180; a += 30) {
        const t = a * DEG, lift = a === 0 || a === 180 ? 6 : 0;
        lbl(c, a, cx + Math.cos(t) * (r - 15), cy - Math.sin(t) * (r - 15) + 1 - lift, INK);
        lbl(c, 180 - a, cx + Math.cos(t) * (r + 9), cy - Math.sin(t) * (r + 9) + 1 - lift, SOFT);
      }
      const t0 = flip ? Math.PI : 0, t1 = (flip ? 180 - deg : deg) * DEG;
      F.line(c, cx, cy, cx + Math.cos(t0) * (r + 3), cy, HOT); F.line(c, cx, cy - 1, cx + Math.cos(t0) * (r + 3), cy - 1, HOT);
      thick(c, cx, cy, cx + Math.cos(t1) * (r + 3), cy - Math.sin(t1) * (r + 3), HOT);
      F.box(c, cx - 1, cy - 1, 3, 3, RED);
    } };
  }
  // 4.MD.5, 4.MD.6: measuring angles with a protractor; angles as turns.
  G4.protractor = d => {
    const step = d < 3 ? 10 : 5, deg = R(Math.ceil(20 / step), Math.floor(160 / step)) * step, flip = d >= 2 && rand() < .5;
    if (d >= 2 && rand() < .25) {
      const C = pick([['The minute hand turns from 12 to 3. How many degrees does it turn?', 90, [180, 30, 45, 360], 'From 12 to 3 is a quarter turn: 360 ÷ 4 = 90°.'],
        ['A pizza is cut into 8 equal slices from the middle. What is the angle of one slice?', 45, [90, 36, 60, 30], '360 ÷ 8 = 45°'],
        ['How many degrees are in a quarter turn?', 90, [180, 45, 360, 25], '360 ÷ 4 = 90°'],
        ['The minute hand turns from 12 to 6. How many degrees does it turn?', 180, [90, 60, 360, 120], 'From 12 to 6 is half a turn: 360 ÷ 2 = 180°.'],
        ['A robot turns 1/3 of the way around a circle. How many degrees does it turn?', 120, [30, 60, 90, 180], '360 ÷ 3 = 120°']]);
      return { topic: 'ANGLES', text: C[0], ...nums(C[1], C[2], v => v + '°'), steps: ['A full turn around a circle is 360°.', C[3]] };
    }
    return { topic: 'ANGLES', text: 'What is the measure of the angle?', ...protractorFig(deg, flip), ...nums(deg, [180 - deg, deg + 10, deg - 10, deg + 5], v => v + '°', step),
      steps: [`One side of the angle points to 0 on the ${flip ? 'outer' : 'inner'} scale.`, `Read that same scale where the other side crosses it.`, `The angle measures ${deg}°.`] };
  };
  function anglePartsFig(total, part, l1, l2) {
    return { size: [120, 70], fig: (c, w, h) => {
      const wide = total > 100, V = [wide ? Math.round(w / 2) : 14, h - 8], L = wide ? Math.min(w / 2 - 8, h - 14) : Math.min(w - 26, h - 14);
      const ray = (a, col) => { const t = a * DEG, x = V[0] + Math.cos(t) * L, y = V[1] - Math.sin(t) * L; F.line(c, V[0], V[1], x, y, col); arrowHead(c, x, y, Math.cos(t), -Math.sin(t), col, 3); };
      F.arc(c, V[0], V[1], 11, 0, part * DEG, SOFT); F.arc(c, V[0], V[1], 15, part * DEG, total * DEG, GRN);
      ray(0, INK); ray(total, INK); ray(part, HOT);
      const at = (a, s, col, sw) => { const rr = sw < 28 ? 36 : 26, t = a * DEG; lbl(c, s, V[0] + Math.cos(t) * rr, V[1] - Math.sin(t) * rr + 1, col); };
      at(part / 2, l1, SOFT, part); at((part + total) / 2, l2, GRN, total - part);
      F.box(c, V[0] - 1, V[1] - 1, 3, 3, RED);
    } };
  }
  // 4.MD.7: angle measures add up; finding an unknown part.
  G4.angleAdd = d => {
    const total = pick(d < 2 ? [90, 180] : [90, 180, R(6, 15) * 10, R(10, 16) * 10 + 5]), part = R(2, total / 5 - 2) * 5 + (d >= 3 ? R(0, 4) : 0), x = total - part, first = rand() < .5;
    const known = first ? part : x, ans = first ? x : part;
    const intro = total === 90 ? 'The whole angle is a right angle.' : total === 180 ? 'The two angles make a straight line.' : `The whole angle measures ${total}°.`;
    return { topic: 'ANGLES', text: `${intro} What is the value of x?`, ...anglePartsFig(total, part, first ? `${part}°` : 'x°', first ? 'x°' : `${x}°`),
      ...nums(ans, [total + known, 180 - known, 90 - known, known, ans + 10].filter(v => v > 0 && v !== ans), v => v + '°'),
      steps: [total === 90 ? 'A right angle is 90°.' : total === 180 ? 'A straight line is 180°.' : `The parts add up to ${total}°.`, `x + ${known} = ${total}`, `x = ${total} - ${known} = ${ans}°`] };
  };
  // Four small pictures A to D side by side; draw(c, cx, cy, i) draws picture i around its center.
  const panels = (draw, h = 54) => ({ size: [168, h], fig: (c, w, hh) => range(4).forEach(i => { const cx = Math.round(w / 8 + i * w / 4); lbl(c, PICS[i], cx, 6, HOT); draw(c, cx, Math.round((hh + 10) / 2), i); }) });
  function lineArrows(c, x0, y0, x1, y1, col, ends = [1, 1]) {
    F.line(c, x0, y0, x1, y1, col);
    if (ends[1]) arrowHead(c, x1, y1, x1 - x0, y1 - y0, col, 3);
    if (ends[0]) arrowHead(c, x0, y0, x0 - x1, y0 - y1, col, 3);
  }
  // 4.G.1: points, lines, rays, segments; parallel and perpendicular lines.
  G4.linesRays = d => {
    const form = R(0, d < 2 ? 0 : 2);
    if (form === 0) {
      const C = ['line', 'ray', 'line segment', 'angle'], k = R(0, 3), t = R(-25, 25) * DEG;
      return { topic: 'LINES', text: 'What is shown?', choices: C, answer: k,
        steps: ['A line goes on forever both ways (two arrows). A ray starts at a point and goes on one way.', 'A line segment has two endpoints. An angle is two rays from one point.', `This is ${k === 0 ? 'a line' : k === 1 ? 'a ray' : k === 2 ? 'a line segment' : 'an angle'}.`],
        size: [100, 50], fig: (c, w, h) => {
          const cx = w / 2, cy = h / 2, ux = Math.cos(t), uy = Math.sin(t), A = [cx - ux * 30, cy - uy * 30], B = [cx + ux * 30, cy + uy * 30];
          if (k === 3) { const V = [cx - 30, cy + 14], P = [V[0] + 58, V[1] - 6], Q = [V[0] + 40, V[1] - 32]; lineArrows(c, ...V, ...P, INK, [0, 1]); lineArrows(c, ...V, ...Q, INK, [0, 1]); dot3(c, ...V, HOT); return; }
          lineArrows(c, ...A, ...B, INK, k === 0 ? [1, 1] : k === 1 ? [0, 1] : [0, 0]);
          const pA = [cx - ux * (k === 0 ? 16 : 30), cy - uy * (k === 0 ? 16 : 30)], pB = [cx + ux * (k === 1 ? 6 : k === 0 ? 16 : 30), cy + uy * (k === 1 ? 6 : k === 0 ? 16 : 30)];
          dot3(c, ...pA, HOT); dot3(c, ...pB, HOT); lbl(c, 'A', pA[0], pA[1] - 7, SOFT); lbl(c, 'B', pB[0], pB[1] - 7, SOFT);
        } };
    }
    if (form === 1) {
      const par = rand() < .5, right = R(0, 3), kinds = shuffle(par ? ['perp', 'cross', 'near'] : ['par', 'cross', 'near2']);
      const types = range(4).map(i => i === right ? (par ? 'par' : 'perp') : kinds.pop()), rot = range(4).map(() => R(-30, 30) * DEG);
      return { topic: 'LINES', text: `Which picture shows ${par ? 'parallel' : 'perpendicular'} lines?`, ...picChoice(right),
        steps: [par ? 'Parallel lines never meet: they stay the same distance apart.' : 'Perpendicular lines cross to make square corners (right angles).', `Picture ${PICS[right]} shows that.`],
        ...panels((c, cx, cy, i) => {
          const t = rot[i], ty = types[i], L = 15, seg = (a, ox, oy) => lineArrows(c, cx + ox - Math.cos(a) * L, cy + oy - Math.sin(a) * L, cx + ox + Math.cos(a) * L, cy + oy + Math.sin(a) * L, INK);
          const nx = -Math.sin(t) * 7, ny = Math.cos(t) * 7;
          if (ty === 'par') { seg(t, nx, ny); seg(t, -nx, -ny); }
          else if (ty === 'near') { seg(t + 9 * DEG, nx, ny); seg(t - 9 * DEG, -nx, -ny); }
          else if (ty === 'perp') { seg(t, 0, 0); seg(t + Math.PI / 2, 0, 0); }
          else if (ty === 'near2') { seg(t, 0, 0); seg(t + 58 * DEG, 0, 0); }
          else { seg(t, 0, 0); seg(t + 45 * DEG, 0, 0); }
        }) };
    }
    const C = pick([['Two lines cross and make 4 right angles. What are they called?', 'perpendicular', ['parallel', 'rays', 'line segments', 'points']],
      ['Two lines on a page never cross, no matter how far they go. What are they called?', 'parallel', ['perpendicular', 'rays', 'line segments', 'angles']],
      ['Which has exactly one endpoint?', 'a ray', ['a line', 'a line segment', 'a point', 'two parallel lines']],
      ['Which has exactly two endpoints?', 'a line segment', ['a line', 'a ray', 'an angle', 'two parallel lines']]]);
    return { topic: 'LINES', text: C[0], ...txt(C[1], C[2]), steps: ['Parallel: never meet. Perpendicular: meet at right angles.', 'A ray has 1 endpoint; a segment has 2; a line has none.'] };
  };
  const ANG = ['acute', 'right', 'obtuse', 'straight'];
  const angType = a => a < 90 ? 0 : a === 90 ? 1 : a < 180 ? 2 : 3;
  // 4.G.1, 4.MD.5: acute, right, obtuse and straight angles.
  G4.angleTypes = d => {
    const k = R(0, 3), deg = [R(20, 75), 90, R(105, 165), 180][k], form = d >= 2 && rand() < .35 ? 1 : 0;
    const why = ['Acute: less than 90°. Right: exactly 90°.', 'Obtuse: between 90° and 180°. Straight: exactly 180°.'];
    if (form === 1) { const v = [R(5, 89), 90, R(91, 179), 180][k]; return { topic: 'ANGLES', text: `An angle measures ${v}°. What kind of angle is it?`, choices: ANG.slice(), answer: angType(v), steps: [...why, `${v}° is ${ANG[angType(v)]}.`] }; }
    const rot = R(-40, 40), V = [50, 34];
    return { topic: 'ANGLES', text: 'What kind of angle is this?', choices: ANG.slice(), answer: k, steps: [...why, `This angle is ${ANG[k]}.`],
      size: [100, 64], fig: (c, w, h) => {
        const L = 27, ray = a => { const t = a * DEG, x = V[0] + Math.cos(t) * L, y = V[1] - Math.sin(t) * L; lineArrows(c, ...V, x, y, INK, [0, 1]); };
        const r0 = k === 3 ? 0 : rot;
        ray(r0); ray(r0 + deg); F.arc(c, V[0], V[1], 8, r0 * DEG, (r0 + deg) * DEG, HOT); F.box(c, V[0] - 1, V[1] - 1, 3, 3, HOT);
      } };
  };
  // Triangles drawn from their angles; the biggest angle on top.
  function triFromAngles(A, B) {
    const ta = Math.tan(A * DEG), tb = Math.tan(B * DEG), cx = tb / (ta + tb), cy = cx * ta;
    return [[0, 0], [1, 0], [cx, -cy]].map(p => [p[0] * 10, p[1] * 10]);
  }
  function triangleFig(angs, o = {}) {
    // angs: [left, right, top]; equal angles mark equal sides (the side across from each).
    return { size: [116, 70], fig: (c, w, h) => {
      const P = fit(triFromAngles(angs[0], angs[1]), w, h, 14, 9);
      shape(c, P, FILL);
      const opp = [[1, 2], [2, 0], [0, 1]], ticks = [0, 0, 0];
      if (o.ticks) { const eq = (i, j) => Math.abs(angs[i] - angs[j]) < .01; if (eq(0, 1) && eq(1, 2)) ticks.fill(1); else for (const [i, j] of [[0, 1], [1, 2], [0, 2]]) if (eq(i, j)) { ticks[i] = 1; ticks[j] = 1; } }
      ticks.forEach((t, i) => { if (t) tickSide(c, P[opp[i][0]], P[opp[i][1]], 1); });
      angs.forEach((a, i) => {
        if (a === 90) rightAt(c, P[i], P[(i + 1) % 3], P[(i + 2) % 3], HOT);
        if (o.labels) { const cg = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3], v = P[i], dx = cg[0] - v[0], dy = cg[1] - v[1], L = Math.hypot(dx, dy); lbl(c, a + '°', v[0] + dx / L * 15, v[1] + dy / L * 11 + 1, SOFT); }
      });
    } };
  }
  function triAngles(kind, sides) {
    // kind: 'acute' | 'right' | 'obtuse'; sides: 'equilateral' | 'isosceles' | 'scalene' | null
    for (let t = 0; t < 80; t++) {
      let top, a, b;
      if (kind === 'right') top = 90; else if (kind === 'obtuse') top = R(20, 28) * 5; else top = R(13, 17) * 5;
      if (sides === 'equilateral') return [60, 60, 60];
      if (sides === 'isosceles') { a = b = (180 - top) / 2; if (!Number.isInteger(a)) continue; if (kind === 'acute' && Math.abs(top - 60) < 1) continue; }
      else { a = R(Math.ceil(Math.max(15, (180 - top) / 2 - 30)), Math.floor((180 - top) / 2 - 6)); b = 180 - top - a; if (a === b || a === top || b === top || b >= top) continue; }
      if (kind === 'acute' && (a >= 90 || b >= 90 || top >= 90 || a > top || b > top)) continue;
      return shuffle([a, b]).concat(top);
    }
    return kind === 'right' ? [45, 45, 90] : kind === 'obtuse' ? [30, 30, 120] : [50, 60, 70];
  }
  // 4.G.2: right, acute and obtuse triangles.
  G4.triangles = d => {
    const form = R(0, d < 2 ? 1 : 2), kinds = ['acute', 'right', 'obtuse'];
    if (form === 0) {
      const k = pick(kinds), angs = triAngles(k, rand() < .4 ? 'isosceles' : 'scalene');
      return { topic: 'TRIANGLES', text: 'What kind of triangle is this?', ...triangleFig(angs, { labels: true }), choices: ['acute', 'right', 'obtuse', 'equilateral'], answer: kinds.indexOf(k),
        steps: ['Right: one 90° angle. Obtuse: one angle bigger than 90°.', 'Acute: all three angles less than 90°.', `The biggest angle is ${angs[2]}°, so it is ${k}.`] };
    }
    if (form === 1) {
      const right = R(0, 3), others = shuffle(['acute', 'obtuse', 'acute', 'obtuse']).slice(0, 3), T = range(4).map(i => i === right ? 'right' : others.pop());
      const A = T.map(k => triAngles(k, rand() < .3 ? 'isosceles' : 'scalene'));
      return { topic: 'TRIANGLES', text: 'Which is a right triangle?', ...picChoice(right), steps: ['A right triangle has one right angle: a square corner.', `Triangle ${PICS[right]} has the right-angle mark.`],
        ...panels((c, cx, cy, i) => { const P = fit(triFromAngles(A[i][0], A[i][1]), 40, 38, 2, 2).map(p => [p[0] + cx - 20, p[1] + cy - 19]); shape(c, P, FILL); if (T[i] === 'right') rightAt(c, P[2], P[0], P[1], HOT); }, 58) };
    }
    const C = pick([['How many right angles can a triangle have?', 1, [0, 2, 3]], ['How many acute angles does a right triangle have?', 2, [0, 1, 3]], ['How many obtuse angles does an obtuse triangle have?', 1, [0, 2, 3]], ['How many acute angles does an acute triangle have?', 3, [0, 1, 2]]]);
    return { topic: 'TRIANGLES', text: C[0], ...nums(C[1], C[2]), steps: ["A triangle's angles add up to 180°.", 'Two right or obtuse angles would already be 180° or more.', `So the answer is ${C[1]}.`] };
  };
  const parallelPairs = pts => { let n = 0; for (const [i, j] of [[0, 2], [1, 3]]) { const a = pts[i], b = pts[(i + 1) % 4], c = pts[j], e = pts[(j + 1) % 4]; if (Math.abs((b[0] - a[0]) * (e[1] - c[1]) - (b[1] - a[1]) * (e[0] - c[0])) < 1e-6) n++; } return n; };
  // 4.G.2: classifying quadrilaterals by parallel sides and right angles.
  G4.quadrilaterals = d => {
    const form = R(0, 3), k = pick(Object.keys(QUADS)), pts = QUADS[k].pts();
    if (form === 0) { const p = parallelPairs(pts); return { topic: 'SHAPES', text: 'How many pairs of parallel sides does this shape have?', ...quadFig(k, pts), ...nums(p, [0, 1, 2, 4].filter(v => v !== p)),
      steps: ['Parallel sides point the same way and never meet.', `This ${k} has ${p} ${pl(p, 'pair')} of parallel sides.`] }; }
    if (form === 1) { const ra = corners(pts).filter(a => Math.abs(a - 90) < 1e-6).length; return { topic: 'SHAPES', text: 'How many right angles does this shape have?', ...quadFig(k, pts), ...nums(ra, [0, 1, 2, 4].filter(v => v !== ra)),
      steps: ['A right angle is a square corner. Look for the little squares.', `This ${k} has ${ra} right ${pl(ra, 'angle')}.`] }; }
    const C = pick([['Which shape has exactly one pair of parallel sides?', 'trapezoid', ['rectangle', 'square', 'rhombus', 'parallelogram']],
      ['Which shape always has 4 right angles?', 'rectangle', ['rhombus', 'trapezoid', 'parallelogram', 'kite']],
      ['Which shape always has 4 equal sides?', 'rhombus', ['rectangle', 'trapezoid', 'parallelogram', 'kite']],
      ['Which shape has 2 pairs of parallel sides but may have no right angles?', 'parallelogram', ['trapezoid', 'kite', 'rectangle', 'square']]]);
    return { topic: 'SHAPES', text: C[0], ...txt(C[1], C[2]), steps: ['Trapezoid: one pair of parallel sides. Parallelogram: two pairs.', 'Rectangle: 4 right angles. Rhombus: 4 equal sides. Square: both.'] };
  };
  // Shapes centred on (0, 0), in pixels, for symmetry.
  const reg = (n, r, off = -90) => range(n).map(i => [Math.cos((off + i * 360 / n) * DEG) * r, Math.sin((off + i * 360 / n) * DEG) * r]);
  const SYM = {
    rectangle: [[-15, -8], [15, -8], [15, 8], [-15, 8]], square: [[-11, -11], [11, -11], [11, 11], [-11, 11]], isosceles: [[0, -13], [11, 11], [-11, 11]],
    scalene: [[-13, 11], [13, 11], [-6, -13]], parallelogram: [[-15, -8], [5, -8], [15, 8], [-5, 8]], trapezoid: [[-7, -9], [7, -9], [14, 9], [-14, 9]],
    arrow: [[0, -14], [12, -1], [5, -1], [5, 13], [-5, 13], [-5, -1], [-12, -1]], lshape: [[-11, -13], [-3, -13], [-3, 5], [11, 5], [11, 13], [-11, 13]],
    rhombus: [[0, -14], [10, 0], [0, 14], [-10, 0]], hexagon: reg(6, 13, 0), kite: [[0, -14], [9, -4], [0, 14], [-9, -4]], equilateral: reg(3, 14), pentagon: reg(5, 14), octagon: reg(8, 13, 22.5),
  };
  const SYM_COUNT = { rectangle: 2, square: 4, isosceles: 1, scalene: 0, parallelogram: 0, trapezoid: 1, arrow: 1, lshape: 0, rhombus: 2, hexagon: 6, kite: 1, equilateral: 3, pentagon: 5, octagon: 8 };
  const reflect = (p, c, u) => { const x = p[0] - c[0], y = p[1] - c[1], t = x * u[0] + y * u[1]; return [c[0] + 2 * t * u[0] - x, c[1] + 2 * t * u[1] - y]; };
  const symOk = (pts, c, u) => pts.every(p => { const q = reflect(p, c, u); return pts.some(r => Math.hypot(r[0] - q[0], r[1] - q[1]) < .6); });
  function symLines(name) {
    const P = SYM[name], diag = P.length === 4 ? [[P[0], P[2]], [P[1], P[3]]].map(([a, b]) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; }) : [];
    return [[[0, 0], [0, 1]], [[0, 0], [1, 0]], ...diag.map(u => [[0, 0], u]), [[7, 0], [0, 1]], [[0, 0], [Math.SQRT1_2, Math.SQRT1_2]]];
  }
  // 4.G.3: lines of symmetry.
  G4.symmetry = d => {
    const names = Object.keys(SYM), pickPair = want => { for (let t = 0; t < 80; t++) { const nm = pick(names), [c, u] = pick(symLines(nm)); if (symOk(SYM[nm], c, u) === want) return [nm, c, u]; } return want ? ['square', [0, 0], [0, 1]] : ['lshape', [0, 0], [0, 1]]; };
    const right = R(0, 3), traps = shuffle([['rectangle', 2], ['parallelogram', 0], ['parallelogram', 1], ['scalene', 0], ['lshape', 0], ['square', 4]]);
    const items = range(4).map(i => {
      if (i === right) return pickPair(true);
      const [nm, li] = traps.pop(), L = symLines(nm)[li];
      return L && !symOk(SYM[nm], ...L) ? [nm, ...L] : pickPair(false);
    });
    return { topic: 'SYMMETRY', text: 'In which picture is the dashed line a line of symmetry?', ...picChoice(right),
      steps: ['A line of symmetry folds the shape into two halves that match exactly.', `Only picture ${PICS[right]} folds into matching halves.`],
      ...panels((c, cx, cy, i) => {
        const [nm, ctr, u] = items[i], P = SYM[nm].map(p => [Math.round(cx + p[0]), Math.round(cy + p[1])]);
        shape(c, P, FILL);
        F.line(c, cx + ctr[0] - u[0] * 19, cy + ctr[1] - u[1] * 19, cx + ctr[0] + u[0] * 19, cy + ctr[1] + u[1] * 19, HOT, 2);
      }, 58) };
  };
  // 4.G.3: how many lines of symmetry.
  G4.symmetryCount = d => {
    const nm = pick(d < 2 ? ['rectangle', 'square', 'isosceles', 'arrow', 'scalene', 'kite', 'lshape'] : Object.keys(SYM_COUNT)), k = SYM_COUNT[nm], sides = SYM[nm].length;
    return { topic: 'SYMMETRY', text: 'How many lines of symmetry does this shape have?', ...nums(k, [sides, k + 1, k === 0 ? 2 : k - 1, k * 2]),
      steps: ['Count every way to fold the shape so the halves match.', k ? `This shape folds ${k} ${pl(k, 'way')}.` : 'No fold makes matching halves.', `It has ${k} ${pl(k, 'line')} of symmetry.`],
      size: [64, 48], fig: (c, w, h) => shape(c, SYM[nm].map(p => [Math.round(w / 2 + p[0] * 1.3), Math.round(h / 2 + p[1] * 1.3)]), FILL) };
  };

  Questions.grade({ id: '4', n: 4, label: '4TH GRADE', short: '4TH', clock: [50, 45, 40, 38, 35], kinds: G4, min: { areaModel: 1 } });

  // ======== 5TH GRADE ========
  const G5 = {};
  const dz = (n, p) => N(n / 10 ** p);                 // n hundredths (p = 2) or tenths (p = 1), shown as a decimal
  const fmix = p => mx(p[0], p[1]);                    // fractions in simplest form, as mixed numbers past 1
  const red = (n, d) => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
  const PT = (x, y) => `(${x}, ${y})`;
  // 5.OA.1: evaluating expressions with parentheses and brackets.
  G5.expressions = d => {
    const form = R(0, d < 2 ? 1 : d < 3 ? 3 : 4), a = R(2, 9), b = R(2, 9), c = R(2, 6), e = R(1, 9);
    if (form === 0) {
      const ans = (a + b) * c;
      return { topic: 'EXPRESSIONS', text: `What is the value of (${a} + ${b}) × ${c}?`, ...nums(ans, [a + b * c, a * c + b, a + b + c, a * b * c]),
        steps: ['Do what is inside the parentheses first.', `${a} + ${b} = ${a + b}`, `${a + b} × ${c} = ${ans}`] };
    }
    if (form === 1) {
      const big = Math.max(b, c) + R(1, 6), ans = a * (big - c) + e;
      return { topic: 'EXPRESSIONS', text: `What is the value of ${a} × (${big} - ${c}) + ${e}?`, ...nums(ans, [a * big - c + e, a * (big - c + e), a * big - c * e, ans + a]),
        steps: [`Parentheses first: ${big} - ${c} = ${big - c}`, `Then multiply: ${a} × ${big - c} = ${a * (big - c)}`, `Then add: ${a * (big - c)} + ${e} = ${ans}`] };
    }
    if (form === 2) {
      const f = R(2, 4), inner = a * (b + c), ans = inner - e > 0 ? f * (inner - e) : f * (inner + e), op = inner - e > 0 ? '-' : '+', mid = op === '-' ? inner - e : inner + e;
      return { topic: 'EXPRESSIONS', text: `What is the value of ${f} × [${a} × (${b} + ${c}) ${op} ${e}]?`, ...nums(ans, [f * a * b + c - e, f * (a * b + c) - e, f * inner, ans + f * e, f * a + b + c]),
        steps: [`Innermost first: ${b} + ${c} = ${b + c}`, `Inside the brackets: ${a} × ${b + c} ${op} ${e} = ${mid}`, `${f} × ${mid} = ${ans}`] };
    }
    if (form === 4) {
      const p = R(2, 20), f = R(2, 4), inner = a * (b + c), e2 = R(1, inner - 1), mid = inner - e2, ans = p + f * mid;
      return { topic: 'EXPRESSIONS', text: `What is the value of ${p} + {${f} × [${a} × (${b} + ${c}) - ${e2}]}?`,
        ...nums(ans, [(p + f) * mid, p + f * a * (b + c) - e2, p + f * (a * b + c - e2), ans + f * e2, p + f + mid]),
        steps: ['Work from the inside out: ( ), then [ ], then { }.', `(${b} + ${c}) = ${b + c}, and [${a} × ${b + c} - ${e2}] = ${mid}`, `{${f} × ${mid}} = ${f * mid}, and ${p} + ${f * mid} = ${ans}`] };
    }
    let x = R(2, 9), y = R(2, 9), z = R(4, 9), w = R(1, z - 1);
    const vals = [[`(${x} + ${y}) × ${z} - ${w}`, (x + y) * z - w], [`${x} + ${y} × (${z} - ${w})`, x + y * (z - w)], [`${x} + ${y} × ${z} - ${w}`, x + y * z - w], [`(${x} + ${y}) × (${z} - ${w})`, (x + y) * (z - w)]];
    const T = vals[0][1];
    return { topic: 'EXPRESSIONS', text: `Where do the parentheses go to make this true?  ${x} + ${y} × ${z} - ${w} = ${T}`, ...txt(vals[0][0], vals.slice(1).filter(v => v[1] !== T).map(v => v[0]).concat([`${x} + (${y} × ${z} - ${w})`].filter(() => x + y * z - w !== T))),
      steps: [`Try (${x} + ${y}) first: ${x + y} × ${z} = ${(x + y) * z}.`, `${(x + y) * z} - ${w} = ${T}. That works.`] };
  };
  // 5.OA.2: writing and reading expressions.
  G5.writeExpr = d => {
    const form = R(0, 2), a = R(2, 9), b = R(2, 9), c = R(2, 6);
    if (form === 0) {
      const C = pick([[`add ${a} and ${b}, then multiply by ${c}`, `(${a} + ${b}) × ${c}`, [`${a} + ${b} × ${c}`, `${a} × ${c} + ${b}`, `${a} + ${b} + ${c}`, `(${a} × ${b}) + ${c}`]],
        [`multiply ${a} by ${b}, then subtract ${c}`, `${a} × ${b} - ${c}`, [`${a} × (${b} - ${c})`, `${a} - ${b} × ${c}`, `(${a} - ${c}) × ${b}`, `${a} + ${b} - ${c}`]],
        [`${c} times the sum of ${a} and ${b}`, `${c} × (${a} + ${b})`, [`${c} × ${a} + ${b}`, `${c} + ${a} × ${b}`, `${c} + (${a} + ${b})`, `(${c} × ${a}) × ${b}`]],
        [`subtract ${c} from ${a + b + c}, then divide by ${b}`, `(${a + b + c} - ${c}) ÷ ${b}`, [`${a + b + c} - ${c} ÷ ${b}`, `${c} - ${a + b + c} ÷ ${b}`, `(${c} - ${a + b + c}) ÷ ${b}`, `${a + b + c} ÷ ${b} - ${c}`]]]);
      return { topic: 'EXPRESSIONS', text: `Which expression means "${C[0]}"?`, ...txt(C[1], C[2]), steps: ['The step done first goes in parentheses.', `"${C[0]}" is ${C[1]}.`] };
    }
    if (form === 1) {
      const x = R(120, 980), y = R(12, 99), k = R(2, 9), times = rand() < .6;
      const E = times ? `${k} × (${N(x)} + ${y})` : `(${N(x)} + ${y}) ÷ ${k}`;
      return { topic: 'EXPRESSIONS', text: `Without working it out, how does ${E} compare with ${N(x)} + ${y}?`,
        ...txt(times ? `It is ${k} times as large.` : `It is 1/${k} as large.`, [times ? `It is 1/${k} as large.` : `It is ${k} times as large.`, `It is ${k} more.`, `It is ${k} less.`, 'They are equal.']),
        steps: [`Both use the same sum, ${N(x)} + ${y}.`, times ? `${E} is that sum, ${k} times over.` : `${E} splits that sum into ${k} equal parts.`] };
    }
    const n = who(), g = R(2, 6), m = R(3, 12), e = R(2, 9);
    const C = pick([[`${n} buys ${g} packs of ${m} stickers and gets ${e} more. Which expression shows how many stickers ${n} has?`, `${g} × ${m} + ${e}`, [`${g} × (${m} + ${e})`, `${g} + ${m} × ${e}`, `(${g} + ${m}) × ${e}`, `${g} + ${m} + ${e}`]],
      [`${g} friends each have ${m} cards, and each gives away ${Math.min(e, m - 1)}. Which expression shows how many cards they have left in all?`, `${g} × (${m} - ${Math.min(e, m - 1)})`, [`${g} × ${m} - ${Math.min(e, m - 1)}`, `${g} - ${m} × ${Math.min(e, m - 1)}`, `(${g} + ${m}) - ${Math.min(e, m - 1)}`, `${g} × ${m} × ${Math.min(e, m - 1)}`]]]);
    return { topic: 'EXPRESSIONS', text: C[0], ...txt(C[1], C[2]), steps: ['Find what happens first, and put it in parentheses if it is not multiplying.', `So the expression is ${C[1]}.`] };
  };
  function qgrid(c, w, h, n, every = 2) {
    const s = Math.floor(Math.min((w - 22) / n, (h - 16) / n)), ox = 15, oy = h - 11, P = (x, y) => [ox + x * s, oy - y * s];
    for (let i = 0; i <= n; i++) { vl(c, ox + i * s, oy - n * s, n * s + 1, GRID); hl(c, ox, oy - i * s, n * s + 1, GRID); }
    vl(c, ox, oy - n * s - 3, n * s + 4, INK); hl(c, ox, oy, n * s + 4, INK);
    for (let i = 0; i <= n; i += every) { lbl(c, i, ox + i * s, oy + 7, SOFT); if (i) lbl(c, i, ox - 3, oy - i * s + 1, SOFT, 'right'); }
    return P;
  }
  // 5.OA.3: two patterns, their relationship, and the ordered pairs they make.
  G5.twoPatterns = d => {
    const form = R(0, d < 2 ? 1 : 2), a = R(1, d < 3 || form === 2 ? 2 : 3), m = R(2, d < 3 || form === 2 ? 3 : 4), b = a * m, A = range(6).map(i => i * a), B = range(6).map(i => i * b);
    const intro = `Pattern X starts at 0 and adds ${a}. Pattern Y starts at 0 and adds ${b}.`;
    if (form === 0) return { topic: 'PATTERNS', text: `${intro} Each number in Y is how many times the matching number in X?`, ...nums(m, [m + 1, b - a, b + a, a]),
      steps: [`X: ${A.slice(0, 5).join(', ')}`, `Y: ${B.slice(0, 5).join(', ')}`, `${B[2]} ÷ ${A[2]} = ${m}, ${B[3]} ÷ ${A[3]} = ${m}: Y is ${m} times X.`] };
    if (form === 1) return { topic: 'PATTERNS', text: `${intro} Which ordered pair (X, Y) uses the 4th number of each?`, ...txt(PT(A[3], B[3]), [PT(B[3], A[3]), PT(A[4], B[4]), PT(A[3], B[4]), PT(A[2], B[2]), PT(3, 4)]),
      steps: [`4th numbers: X is ${A[3]}, Y is ${B[3]}. (0 is the 1st.)`, `The pair is (X, Y) = ${PT(A[3], B[3])}.`] };
    return { topic: 'PATTERNS', text: `The points show pairs (X, Y) from two patterns: X adds ${a}, Y adds ${b}. Which point comes next?`, ...txt(PT(A[4], B[4]), [PT(B[4], A[4]), PT(A[4], B[3] + a), PT(A[3] + b, B[4]), PT(A[5], B[5]), PT(A[4] + 1, B[4] + 1)]),
      steps: [`The points so far: ${range(4).map(i => PT(A[i], B[i])).join(', ')}.`, `Next: X = ${A[3]} + ${a} = ${A[4]} and Y = ${B[3]} + ${b} = ${B[4]}.`, `So ${PT(A[4], B[4])}.`],
      size: [100, 96], fig: (c, w, h) => { const big = B[3] > 10, P = qgrid(c, w, h, big ? 20 : 10, big ? 4 : 2);
        for (let i = 0; i < 4; i++) { const p = P(A[i], B[i]); dot3(c, p[0], p[1], HOT); } } };
  };
  // 5.NBT.1: place value from millions to thousandths.
  G5.placeValue = d => {
    const form = R(0, d < 2 ? 1 : 3);
    if (form === 0) {
      if (rand() < .5) {
        const n = mkNum(7), p = 10 ** R(3, 6), dg = digitAt(n, p), v = dg * p;
        return { topic: 'PLACE VALUE', text: `What is the value of the ${dg} in ${N(n)}?`, ...nums(v, [v / 10, v * 10, dg, v / 100]), steps: [`The ${dg} is in the ${PLACE[p]} place.`, `It is worth ${dg} × ${N(p)} = ${N(v)}.`] };
      }
      const ds = shuffle(range(9).map(i => i + 1)).slice(0, 4), n = ds[0] * 1000 + ds[1] * 100 + ds[2] * 10 + ds[3], k = R(1, 3), dg = ds[k], v = dg / 10 ** k, names = ['', 'tenths', 'hundredths', 'thousandths'];
      return { topic: 'PLACE VALUE', text: `What is the value of the ${dg} in ${N(n / 1000)}?`, ...nums(v, [v * 10, v / 10, dg, v * 100].filter(x => x < 100 && x >= .001), N, v),
        steps: [`The ${dg} is in the ${names[k]} place.`, `It is worth ${dg} ${names[k]} = ${N(v)}.`] };
    }
    if (form === 1) {
      const x = R(2, 9), k = R(1, 3), up = rand() < .5, big = x * 10 ** (1 - k), small = big / 10;
      return { topic: 'PLACE VALUE', text: up ? `The ${x} in ${N(big)} is worth how many times the ${x} in ${N(small)}?` : `The ${x} in ${N(small)} is what fraction of the ${x} in ${N(big)}?`,
        ...(up ? nums(10, [100, 1, 1000, x]) : txt('1/10', ['10', '1/100', '100', '1/2'])),
        steps: ['Each place is 10 times the place to its right,', 'and 1/10 of the place to its left.', up ? `${N(big)} ÷ ${N(small)} = 10` : `${N(small)} is 1/10 of ${N(big)}.`] };
    }
    if (form === 2) {
      const tenth = rand() < .5, v = tenth ? R(2, 9) * 10 ** R(1, 3) : R(11, 99) / 100, ans = tenth ? v / 10 : v * 10;
      return { topic: 'PLACE VALUE', text: tenth ? `What is 1/10 of ${N(v)}?` : `What is 10 times ${N(v)}?`, ...nums(ans, tenth ? [v * 10, v / 100, v - 10] : [v / 10, v * 100, v + 10], N, tenth ? ans / 10 : .1),
        steps: [tenth ? '1/10 of a number moves each digit one place to the right.' : '10 times moves each digit one place to the left.', `${tenth ? '1/10 of' : '10 ×'} ${N(v)} = ${N(ans)}`] };
    }
    const ds = shuffle(range(9).map(i => i + 1)).slice(0, 4), n = ds.join(''), s = `${n[0]}.${n.slice(1)}`, k = R(1, 3), names = ['ones', 'tenths', 'hundredths', 'thousandths'];
    return { topic: 'PLACE VALUE', text: `Which digit is in the ${names[k]} place of ${s}?`, ...nums(ds[k], ds.filter((x, i) => i !== k)),
      steps: ['After the point: tenths, then hundredths, then thousandths.', `In ${s}, the ${names[k]} digit is ${ds[k]}.`] };
  };
  // 5.NBT.2: powers of 10, and multiplying or dividing by them.
  G5.powersOf10 = d => {
    const form = R(0, d < 2 ? 1 : 4), k = R(2, 6);
    if (form === 0) return { topic: 'POWERS OF 10', text: `What is 10^${k}?`, ...nums(10 ** k, [10 * k, 10 ** (k - 1), 10 ** (k + 1), 10 + k]), steps: [`10^${k} means ${k} tens multiplied together.`, `That's 1 followed by ${k} zeros: ${N(10 ** k)}.`] };
    if (form === 1) { const x = R(2, 9), p = R(1, 4); return { topic: 'POWERS OF 10', text: `What is ${x} × 10^${p}?`, ...nums(x * 10 ** p, [x * p, x * 10 ** (p - 1), x * 10 ** (p + 1), 10 ** p + x]), steps: [`10^${p} = ${N(10 ** p)}`, `${x} × ${N(10 ** p)} = ${N(x * 10 ** p)}`] }; }
    const dec = R(1, 2), v = R(11, 999) / 10 ** dec, mul = form === 2 || (form === 4 && rand() < .5), p = mul ? R(1, 3) : R(1, 3 - dec), ans = Math.round((mul ? v * 10 ** p : v / 10 ** p) * 1e6) / 1e6;
    const shown = form === 4 ? `10^${p}` : N(10 ** p);
    return { topic: 'POWERS OF 10', text: `What is ${N(v)} ${mul ? '×' : '÷'} ${shown}?`, ...nums(ans, mul ? [ans / 10, ans * 10, v * p] : [ans * 10, ans / 10, v * 10 ** p], N, ans / 10),
      steps: [`${mul ? 'Multiplying' : 'Dividing'} by ${N(10 ** p)} moves the point ${p} ${pl(p, 'place')} to the ${mul ? 'right' : 'left'}.`, `${N(v)} ${mul ? '×' : '÷'} ${N(10 ** p)} = ${N(ans)}`] };
  };
  const PLACE_D = ['ones', 'tenths', 'hundredths', 'thousandths'];
  // 5.NBT.3a: decimals in expanded form, in words, and as fractions.
  G5.decimalForms = d => {
    const form = R(0, d < 2 ? 2 : 4);
    if (form === 0) {
      const t = R(1, 9), o = R(1, 9), d1 = R(1, 9), d3 = R(1, 9), mid = R(0, 1) ? R(1, 9) : 0, v = (t * 10000 + o * 1000 + d1 * 100 + mid * 10 + d3) / 1000;
      const parts = [`${t} × 10`, `${o} × 1`, `${d1} × (1/10)`, ...(mid ? [`${mid} × (1/100)`] : []), `${d3} × (1/1000)`];
      return { topic: 'DECIMALS', text: `What number is ${parts.join(' + ')}?`, ...nums(v, [(t * 1000 + o * 100 + d1 * 10 + d3) / 100, v * 10, (t * 10000 + o * 1000 + d1 * 100 + d3 * 10 + mid) / 1000, v + 9 * d3 / 1000], N, .001),
        steps: ['Each part goes in its own place.', `tens ${t}, ones ${o}, tenths ${d1}, hundredths ${mid}, thousandths ${d3}`, `= ${N(v)}`] };
    }
    if (form === 1) {
      const w = R(1, 9), th = R(1, 3) === 1 ? R(11, 99) : R(101, 999), v = w + th / 1000;
      return { topic: 'DECIMALS', text: `Write ${words(w)} and ${words(th)} thousandths as a decimal.`, ...nums(v, [w + th / 100, w + th / 10000, w * 1000 + th, w + Number(String(th).split('').reverse().join('')) / 1000], N, .001),
        steps: ['"Thousandths" means three places after the point.', `${th} thousandths = .${String(th).padStart(3, '0')}`, `${words(w)} and ${th} thousandths = ${N(v)}`] };
    }
    if (form === 2) {
      const p = R(1, d < 3 ? 2 : 3), n0 = R(p === 1 ? 1 : 11, 10 ** p - 1), n = n0 % 10 === 0 ? n0 + 1 : n0, bot = 10 ** p, v = n / bot;
      return { topic: 'DECIMALS', text: `Which fraction is equal to ${N(v)}?`, ...fracs([n, bot], [[n, bot * 10], [n, bot / 10 || 1], [1, n], [bot, n], [n, bot * 100]]),
        steps: [`${N(v)} has ${p} ${pl(p, 'digit')} after the point: ${PLACE_D[p]}.`, `So ${N(v)} = ${fr(n, bot)}.`] };
    }
    if (form === 3) {
      const p = R(2, 3), n = R(1, 10 ** (p - 1) - 1), bot = 10 ** p, v = n / bot;
      return { topic: 'DECIMALS', text: `Write ${fr(n, bot)} as a decimal.`, ...nums(v, [v * 10, v / 10, v * 100, n], N, v),
        steps: [`${fr(n, bot)} is ${n} ${PLACE_D[p]}.`, `${PLACE_D[p][0].toUpperCase() + PLACE_D[p].slice(1)} go ${p} places after the point: ${N(v)}`] };
    }
    const ds = [R(1, 9), R(1, 9), 0, R(1, 9)], s = `${ds[0]}.${ds[1]}${ds[2]}${ds[3]}`;
    const E = (o, t, h, th) => [o && `${o} × 1`, t && `${t} × (1/10)`, h && `${h} × (1/100)`, th && `${th} × (1/1000)`].filter(Boolean).join(' + ');
    return { topic: 'DECIMALS', text: `Which is the expanded form of ${s}?`, ...txt(E(ds[0], ds[1], 0, ds[3]), [E(ds[0], ds[1], ds[3], 0), E(ds[0], 0, ds[1], ds[3]), E(0, ds[0], ds[1], ds[3]), `${ds[0]} + ${ds[1]} + ${ds[3]}`]),
      steps: [`${ds[0]} ones, ${ds[1]} tenths, 0 hundredths, ${ds[3]} thousandths.`, `${s} = ${E(ds[0], ds[1], 0, ds[3])}`] };
  };
  // 5.NBT.3b: comparing decimals to thousandths.
  G5.decimalCompare = d => {
    const form = R(0, d < 2 ? 1 : 2), w = R(0, 3), t = R(2, 8);
    const set = [w + t / 10, w + (t - 1) / 10 + R(10, 99) / 1000, w + t / 10 + R(1, 9) / 1000, w + t / 100 + R(1, 9) / 1000].map(v => Math.round(v * 1000) / 1000);
    if (new Set(set).size < 4) set[3] += .5;
    if (form === 0) {
      const most = rand() < .5, best = most ? Math.max(...set) : Math.min(...set);
      return { topic: 'DECIMALS', text: `Which decimal is the ${most ? 'greatest' : 'least'}?`, ...txt(N(best), set.filter(v => v !== best).map(N)),
        steps: [`Give them all three places: ${set.map(v => v.toFixed(3)).join(', ')}.`, `The ${most ? 'greatest' : 'least'} is ${N(best)}. More digits does not mean bigger.`] };
    }
    if (form === 1) {
      const [a, b] = shuffle([set[0], set[1]]), sym = a < b ? '<' : '>', opp = sym === '<' ? '>' : '<';
      return { topic: 'DECIMALS', text: 'Which is true?', ...txt(`${N(a)} ${sym} ${N(b)}`, [`${N(a)} ${opp} ${N(b)}`, `${N(a)} = ${N(b)}`, `${N(b)} ${sym} ${N(a)}`]),
        steps: [`Line up the places: ${a.toFixed(3)} and ${b.toFixed(3)}.`, `Compare from the left: ${N(a)} ${sym} ${N(b)}.`] };
    }
    const three = set.slice(0, 3), up = three.slice().sort((p, q) => p - q), L = a => a.map(N).join(', ');
    return { topic: 'DECIMALS', text: 'Which list is in order from least to greatest?', ...txt(L(up), shuffle([[up[1], up[0], up[2]], [up[0], up[2], up[1]], [up[2], up[1], up[0]], [up[1], up[2], up[0]]]).map(L)),
      steps: [`Give them all three places: ${three.map(v => v.toFixed(3)).join(', ')}.`, `Least to greatest: ${L(up)}`] };
  };
  // 5.NBT.4: rounding decimals.
  G5.roundDecimals = d => {
    const k = R(0, 2), names = ['whole number', 'tenth', 'hundredth'], n = R(1001, d < 3 ? 9999 : 99999), unit = 10 ** (3 - k);
    let m = n; if (m % unit === 0) m += 1;
    const ans = Math.round(m / unit) * unit, lo = Math.floor(m / unit) * unit, other = ans === lo ? lo + unit : lo, show3 = v => N(v / 1000);
    const next = Math.floor(m / (unit / 10)) % 10;
    return { topic: 'ROUNDING', text: `Round ${show3(m)} to the nearest ${names[k]}.`, ...nums(ans / 1000, [other / 1000, Math.round(m / (unit / 10)) * (unit / 10) / 1000, k < 2 ? Math.round(m / (unit * 10)) * unit * 10 / 1000 : m / 1000, (ans + unit) / 1000].filter(v => v !== ans / 1000), N, unit / 1000, false),
      steps: [`Look at the digit just after the ${k === 0 ? 'ones' : PLACE_D[k]} place: ${next}.`, next >= 5 ? '5 or more: round up.' : 'Less than 5: round down.', `${show3(m)} rounds to ${N(ans / 1000)}.`] };
  };
  // 5.NBT.5: multiplying multi-digit whole numbers.
  G5.multiply = d => {
    const a = R(10 ** ([1, 2, 2, 3][d - 1]), 10 ** ([2, 3, 3, 4][d - 1]) - 1), b0r = R(11, d < 3 ? 59 : 99), b = b0r % 10 ? b0r : b0r + 1, p = a * b, n = who(), word = rand() < .4;
    const b0 = b % 10, b1 = b - b0;
    const steps = [`${N(a)} × ${b0} = ${N(a * b0)}`, `${N(a)} × ${b1} = ${N(a * b1)}`, `${N(a * b0)} + ${N(a * b1)} = ${N(p)}`];
    const text = word ? pick([`A stadium has ${b} sections with ${N(a)} seats in each. How many seats is that?`, `A factory makes ${N(a)} toy robots a day. How many does it make in ${b} days?`,
      `Each box holds ${N(a)} paper clips. How many paper clips are in ${b} boxes?`]) : `${N(a)} × ${b} = ?`;
    return { topic: 'MULTIPLY', text, ...nums(p, multSlips(a, b)), steps };
  };
  // 5.NBT.6: dividing by two-digit numbers.
  G5.divide = d => {
    const dv = R(11, d < 3 ? 25 : 49), q = R(d < 2 ? 4 : 12, d < 2 ? 30 : 99), r = d >= 2 && rand() < .5 ? R(1, dv - 1) : 0, t = dv * q + r, form = R(0, d < 2 ? 1 : 2), n = who();
    const right = QR(q, r), wr = [QR(q - 1, r + dv), QR(q + 1, r), r ? QR(q, 0) : QR(q, 1), QR(q + 10, r), QR(q, r ? r - 1 || r + 1 : 2)];
    if (String(q).includes('0') && q > 9) wr.unshift(QR(Number(String(q).replace(/0/g, '')), r));
    const steps = [`Estimate: ${N(t)} ÷ ${dv} is about ${N(Math.round(t / dv / 10) * 10 || q)}.`, `${dv} × ${q} = ${N(dv * q)}`, r ? `${N(t)} - ${N(dv * q)} = ${r} left over, so ${right}.` : `Nothing left over: ${right}.`];
    if (form === 0) return { topic: 'DIVIDE', text: `${N(t)} ÷ ${dv} = ?`, ...txt(right, wr), steps };
    if (form === 1) {
      const T = pick([[`${N(t)} students go on a field trip. Each bus holds ${dv}. How many buses are needed?`, r ? q + 1 : q], [`${n} packs ${N(t)} cookies into boxes of ${dv}. How many boxes can be filled?`, q]]);
      return { topic: 'DIVIDE', text: T[0], ...nums(T[1], [T[1] === q ? q + 1 : q, r || q + 2, q * 10, dv]),
        steps: [`${N(t)} ÷ ${dv} = ${right}`, r ? (T[1] > q ? `The ${r} left over still need a bus: ${T[1]}.` : `The ${r} left over can't fill a box: ${T[1]}.`) : `It comes out even: ${T[1]}.`] };
    }
    const dv2 = pick([19, 21, 29, 31, 39, 41, 49]), q2 = R(30, 90), t2 = dv2 * q2 + R(0, dv2 - 1), ed = Math.round(dv2 / 10) * 10, ans = Math.round(t2 / ed), est = ans * ed;
    return { topic: 'DIVIDE', text: `Which is the best estimate of ${N(t2)} ÷ ${dv2}?`, ...nums(ans, [ans * 10, Math.round(ans / 10), ans + 30, ans - 30]),
      steps: [`Use friendly numbers: ${dv2} is close to ${ed}, and ${N(t2)} is close to ${N(est)}.`, `${N(est)} ÷ ${ed} = ${ans}`, `(The exact answer is ${QR(Math.floor(t2 / dv2), t2 % dv2)}.)`] };
  };
  // 5.NBT.7: adding and subtracting decimals to hundredths.
  G5.decimalAddSub = d => {
    const sub = rand() < .5, pa = R(d < 3 ? 1 : 0, 2), pb = d < 2 ? pa : R(1, 2), P = Math.max(pa, pb), n = who(), money = d >= 2 && rand() < .35;
    let A = pa === 0 ? R(2, 20) : R(d < 3 ? 11 : 101, d < 3 ? 999 : 2999), B = R(11, d < 3 ? 999 : 1999);
    if (money) { A = R(150, 2000); B = R(99, 999); }
    const pA = money ? 2 : pa, pB = money ? 2 : pb, PP = money ? 2 : P;
    let a = A * 10 ** (PP - pA), b = B * 10 ** (PP - pB);
    if (sub && a < b) [a, b] = [b, a];
    if (sub && a === b) a += 10 ** PP;
    const ans = (sub ? a - b : a + b) / 10 ** PP, mis = sub ? Math.abs(A - B) / 10 ** PP : (A + B) / 10 ** PP;
    const show = v => money ? usd(Math.round(v * 100)) : N(v);
    const wr = [pA !== pB ? mis : ans + 1, sub ? smallFromBig(a, b) / 10 ** PP : noCarry(a, b) / 10 ** PP, ans + .1, ans - .1, ans + .01, ans - 1];
    if (money) {
      if (!sub) return { topic: 'DECIMALS', text: `${n} buys a book for ${usd(a)} and a game for ${usd(b)}. How much is that in all?`, ...nums(ans, wr, show, .01), steps: ['Line up the decimal points.', `${usd(a)} + ${usd(b)} = ${usd(a + b)}`] };
      return { topic: 'DECIMALS', text: `${n} has ${usd(a)} and spends ${usd(b)}. How much is left?`, ...nums(ans, wr, show, .01), steps: ['Line up the decimal points.', `${usd(a)} - ${usd(b)} = ${usd(a - b)}`] };
    }
    const sa = dz(a, PP), sb = dz(b, PP);
    return { topic: 'DECIMALS', text: `${sa} ${sub ? '-' : '+'} ${sb} = ?`, ...nums(ans, wr, N, .01),
      steps: ['Line up the decimal points. Fill empty places with 0.', `${(a / 10 ** PP).toFixed(PP)} ${sub ? '-' : '+'} ${(b / 10 ** PP).toFixed(PP)}`, `= ${N(ans)}`] };
  };
  // 5.NBT.7: multiplying and dividing decimals.
  G5.decimalMultDiv = d => {
    const form = R(0, d < 2 ? 1 : 4), n = who();
    if (form === 0) {
      const k = R(2, 9), x = R(2, 9), two = d >= 3 && rand() < .5, X = two ? R(11, 99) : x, p = two ? 2 : 1, ans = k * X / 10 ** p;
      return { topic: 'DECIMALS', text: `${k} × ${dz(X, p)} = ?`, ...nums(ans, [k * X, ans / 10, ans * 10, k + X / 10 ** p], N, 10 ** -p),
        steps: [`Multiply like whole numbers: ${k} × ${X} = ${k * X}.`, `${dz(X, p)} has ${p} decimal ${pl(p, 'place')}, so the answer does too: ${N(ans)}`] };
    }
    if (form === 1) {
      const big = d >= 3 && rand() < .5, A = big ? R(11, 39) : R(1, 9), B = big ? R(11, 29) : R(1, 9), ans = A * B / 100;
      const wrongs = [A * B / 10, A * B / 1000, A * B, big ? (Math.floor(A / 10) * Math.floor(B / 10)) + (A % 10) * (B % 10) / 100 : (A + B) / 10];
      return { topic: 'DECIMALS', text: `${dz(A, 1)} × ${dz(B, 1)} = ?`, ...nums(ans, wrongs, N, .01),
        steps: [`${A} × ${B} = ${A * B}`, 'Each factor has 1 decimal place: 2 in all.', `So ${dz(A, 1)} × ${dz(B, 1)} = ${N(ans)}`] };
    }
    if (form === 2) {
      const k = R(2, 9), q = R(2, 9), ans = q / 10;
      return { topic: 'DECIMALS', text: `${dz(q * k, 1)} ÷ ${k} = ?`, ...nums(ans, [q, q / 100, ans + 1, q * k / 100], N, .1),
        steps: [`${dz(q * k, 1)} is ${q * k} tenths.`, `${q * k} tenths ÷ ${k} = ${q} tenths = ${N(ans)}`] };
    }
    if (form === 3) {
      const B = R(2, 9), k = R(2, 9), A = B * k;
      return { topic: 'DECIMALS', text: `${dz(A, 1)} ÷ ${dz(B, 1)} = ?`, ...nums(k, [k / 10, k * 10, A * B / 100, k + 1]),
        steps: [`How many ${dz(B, 1)}s fit in ${dz(A, 1)}?`, `${A} tenths ÷ ${B} tenths = ${A} ÷ ${B} = ${k}`] };
    }
    const c = R(5, 49) * 25, k = R(3, 8);
    return { topic: 'DECIMALS', text: pick([`Each notebook costs ${usd(c)}. How much do ${k} notebooks cost?`, `A movie ticket costs ${usd(c)}. What do ${k} tickets cost?`]),
      ...nums(c * k / 100, [c * k / 1000, c * k / 10, (c + k) / 100, c * k / 100 + 1], v => usd(Math.round(v * 100)), .25), steps: [`${k} × ${usd(c)}`, `= ${usd(c * k)}`] };
  };
  const UNLIKE = [[2, 3], [2, 5], [3, 4], [2, 4], [3, 6], [4, 8], [2, 6], [4, 6], [3, 5], [2, 8], [5, 10], [4, 5], [6, 8], [3, 8], [2, 12], [4, 12], [3, 12], [6, 12], [2, 10], [3, 9]];
  // 5.NF.1: adding and subtracting fractions with unlike denominators.
  G5.fracAdd = d => {
    let [b1, b2] = shuffle(pick(UNLIKE).slice()), a1 = coprime(b1), a2 = coprime(b2), sub = rand() < .5;
    const L = lcm(b1, b2);
    if (sub && a1 / b1 < a2 / b2) [a1, b1, a2, b2] = [a2, b2, a1, b1];
    if (a1 * b2 === a2 * b1) sub = false;
    const top = sub ? a1 * L / b1 - a2 * L / b2 : a1 * L / b1 + a2 * L / b2;
    const ans = red(top, L), op = sub ? '-' : '+';
    const wr = sub ? [[Math.abs(a1 - a2), Math.abs(b1 - b2) || L], [Math.abs(a1 - a2), L], [top + 1, L], [a1 * b2 - a2 * b1 > 0 ? a1 * b2 - a2 * b1 : 1, b1 * b2 + 1]] : [[a1 + a2, b1 + b2], [a1 + a2, L], [a1 + a2, b1 * b2], [top + 1, L], [top, L + b1]];
    return { topic: 'FRACTIONS', text: `${fr(a1, b1)} ${op} ${fr(a2, b2)} = ?`, ...fracs(ans, wr, fmix),
      steps: [`Use the same bottom number, ${L}.`, `${fr(a1, b1)} = ${fr(a1 * L / b1, L)} and ${fr(a2, b2)} = ${fr(a2 * L / b2, L)}`, `${fr(a1 * L / b1, L)} ${op} ${fr(a2 * L / b2, L)} = ${fr(top, L)}${fmix(ans) !== fr(top, L) ? ` = ${fmix(ans)}` : ''}`] };
  };
  // 5.NF.1: adding and subtracting mixed numbers with unlike denominators.
  G5.mixedAddSub = d => {
    const [b1, b2] = shuffle(pick(UNLIKE.filter(p => lcm(...p) <= 12)).slice()), L = lcm(b1, b2), sub = rand() < .5;
    const w1 = R(2, 5), w2 = R(1, w1 - 1), r1 = coprime(b1), r2 = coprime(b2);
    const n1 = w1 * L + r1 * L / b1, n2 = w2 * L + r2 * L / b2, tot = sub ? n1 - n2 : n1 + n2, ans = red(tot, L), op = sub ? '-' : '+';
    const t1 = r1 * L / b1, t2 = r2 * L / b2;
    const wr = sub ? [[(w1 - w2) * L + Math.abs(t1 - t2), L], [tot + L, L], [tot - 1, L], [(w1 - w2) * (b1 + b2) + Math.abs(r1 - r2), b1 + b2]] : [[(w1 + w2) * (b1 + b2) + r1 + r2, b1 + b2], [tot - L, L], [tot + 1, L], [tot + L, L]];
    return { topic: 'MIXED NUMBERS', text: `${w1} ${fr(r1, b1)} ${op} ${w2} ${fr(r2, b2)} = ?`, ...fracs(ans, wr, fmix),
      steps: [`Rename with bottom ${L}: ${w1} ${fr(t1, L)} ${op} ${w2} ${fr(t2, L)}`, sub && t1 < t2 ? `Not enough ${DNAME[L] || L + 'ths'}: trade 1 whole, so ${w1 - 1} ${fr(t1 + L, L)} - ${w2} ${fr(t2, L)}` : (sub ? `Subtract wholes and parts.` : `Add the wholes and the parts${t1 + t2 >= L ? ', then carry the extra whole' : ''}.`), `= ${fmix(ans)}`] };
  };
  // 5.NF.2: fraction word problems, and checking with benchmark fractions.
  G5.fracWord = d => {
    const form = R(0, d < 2 ? 1 : 3), n = who();
    const [b1, b2] = shuffle(pick(UNLIKE.filter(p => lcm(...p) <= 12)).slice()), a1 = coprime(b1), a2 = coprime(b2), L = lcm(b1, b2), v = a1 / b1 + a2 / b2;
    if (form === 0) {
      const top = a1 * L / b1 + a2 * L / b2;
      return { topic: 'WORD PROBLEM', text: pick([`${n} ate ${fr(a1, b1)} of a pizza and a friend ate ${fr(a2, b2)} of it. How much of the pizza did they eat?`,
        `${n} walked ${fr(a1, b1)} mile, then jogged ${fr(a2, b2)} mile. How far did ${n} go?`, `A recipe needs ${fr(a1, b1)} cup of sugar and ${fr(a2, b2)} cup of honey. How much sweetener is that?`]),
        ...fracs(red(top, L), [[a1 + a2, b1 + b2], [a1 + a2, L], [top + 1, L], [a1 * a2, b1 * b2]], fmix),
        steps: [`${fr(a1, b1)} + ${fr(a2, b2)}: use the bottom ${L}.`, `${fr(a1 * L / b1, L)} + ${fr(a2 * L / b2, L)} = ${fr(top, L)}`, `= ${fmix(red(top, L))}`] };
    }
    if (form === 1) {
      let [p, q] = a1 / b1 >= a2 / b2 ? [[a1, b1], [a2, b2]] : [[a2, b2], [a1, b1]];
      if (p[0] * q[1] === q[0] * p[1]) p = [p[1] - 1 || 1, p[1]];
      const top = p[0] * L / p[1] - q[0] * L / q[1];
      if (top <= 0) return G5.fracWord(0);
      return { topic: 'WORD PROBLEM', text: `A board is ${fr(...p)} yard long. ${n} cuts off ${fr(...q)} yard. How long is the piece that is left?`,
        ...fracs(red(top, L), [[Math.abs(p[0] - q[0]) || 1, Math.abs(p[1] - q[1]) || L], [p[0] + q[0], L], [top + 1, L]], fmix),
        steps: [`${fr(...p)} - ${fr(...q)}: use the bottom ${L}.`, `${fr(p[0] * L / p[1], L)} - ${fr(q[0] * L / q[1], L)} = ${fr(top, L)}`, `= ${fmix(red(top, L))} yard`] };
    }
    const C = ['less than 1/2', 'between 1/2 and 1', 'between 1 and 1 1/2', 'more than 1 1/2'], k = v < .5 ? 0 : v < 1 ? 1 : v < 1.5 ? 2 : 3;
    if (Math.abs(v - .5) < 1e-9 || Math.abs(v - 1) < 1e-9 || Math.abs(v - 1.5) < 1e-9) return G5.fracWord(0);
    if (form === 2) return { topic: 'ESTIMATE', text: `Without adding exactly, which is true about ${fr(a1, b1)} + ${fr(a2, b2)}?`, choices: C.map(s => 'It is ' + s + '.'), answer: k,
      steps: [`${fr(a1, b1)} is ${a1 / b1 < .5 ? 'less' : a1 / b1 > .5 ? 'more' : 'exactly'} ${a1 / b1 === .5 ? '1/2' : 'than 1/2'}; ${fr(a2, b2)} is ${a2 / b2 < .5 ? 'less than' : a2 / b2 > .5 ? 'more than' : 'exactly'} 1/2.`, `The exact sum is ${fmix(red(a1 * L / b1 + a2 * L / b2, L))}: ${C[k]}.`] };
    const wrongSum = fr(a1 + a2, b1 + b2);
    return { topic: 'ESTIMATE', text: `${n} says ${fr(a1, b1)} + ${fr(a2, b2)} = ${wrongSum}. Which shows this can't be right?`,
      ...txt(`${wrongSum} is less than ${fr(a1 >= a2 * b1 / b2 ? a1 : a2, a1 >= a2 * b1 / b2 ? b1 : b2)}, one of the parts.`, [`${wrongSum} is too small to be a fraction.`, `You can never add fractions.`, `The answer must be a whole number.`, `${wrongSum} should be ${fr(a1 + a2, b1 * b2)}.`]),
      steps: ['A sum must be bigger than each of its parts.', `${wrongSum} is smaller than ${fr(a1 >= a2 * b1 / b2 ? a1 : a2, a1 >= a2 * b1 / b2 ? b1 : b2)}, so it can't be the sum.`, `The real sum is ${fmix(red(a1 * L / b1 + a2 * L / b2, L))}.`] };
  };
  // 5.NF.3: a fraction as division.
  G5.fracDivision = d => {
    const form = R(0, d < 2 ? 1 : 4), n = who();
    if (form === 0) {
      const p = R(2, 7), k = R(p + 1, 9), food = pick(['pizzas', 'sandwiches', 'pies', 'cakes']);
      return { topic: 'FRACTIONS', text: `${k} friends share ${p} ${food} equally. How much does each friend get?`, ...fracs([p, k], [[k, p], [1, k], [1, p], [p, k + p]], p2 => fr(p2[0], p2[1])),
        steps: [`Share ${p} among ${k}: that's ${p} ÷ ${k}.`, `${p} ÷ ${k} = ${fr(p, k)}, so each friend gets ${fr(p, k)} of a ${{ pizzas: 'pizza', sandwiches: 'sandwich', pies: 'pie', cakes: 'cake' }[food]}.`] };
    }
    if (form === 1) {
      const b = R(2, 9), a = b * R(1, 5) + R(1, b - 1);
      return { topic: 'FRACTIONS', text: `${a} ÷ ${b} = ? Write it as a mixed number.`, ...fracs(red(a, b), [[b, a], [a - b, b], [Math.floor(a / b) * b + b - a % b, b], [a + b, b]], fmix),
        steps: [`${a} ÷ ${b} = ${Math.floor(a / b)} R${a % b}.`, `The ${a % b} left over is split ${b} ways: ${fr(a % b, b)}.`, `${a} ÷ ${b} = ${mx(a, b, false)}${mx(a, b) !== mx(a, b, false) ? ` = ${mx(a, b)}` : ''}`] };
    }
    if (form === 2) {
      const a = R(2, 9), b = R(2, 9) + (a === 5 ? 1 : 0);
      if (a === b) return G5.fracDivision(1);
      return { topic: 'FRACTIONS', text: `Which is equal to ${fr(a, b)}?`, ...txt(`${a} ÷ ${b}`, [`${b} ÷ ${a}`, `${a} × ${b}`, `${a} - ${b}`, `${b} - ${a}`, `${a} + ${b}`].filter(s => { const [x, o, y] = s.split(' '); const v = o === '÷' ? x / y : o === '×' ? x * y : o === '-' ? x - y : +x + +y; return v >= 0 && Math.abs(v - a / b) > 1e-9; })),
        steps: [`A fraction is a division: the top divided by the bottom.`, `${fr(a, b)} = ${a} ÷ ${b}`] };
    }
    if (form === 3) {
      const b = R(2, 9), w = R(1, 8), a = w * b + R(1, b - 1), S = x => `${x} and ${x + 1}`;
      return { topic: 'FRACTIONS', text: `${fr(a, b)} is between which two whole numbers?`, ...txt(S(w), [S(w + 1), w > 0 ? S(w - 1) : S(w + 2), S(a - b > w + 2 ? a - b : w + 3), S(b)].filter((s, i, A) => A.indexOf(s) === i)),
        steps: [`${a} ÷ ${b} = ${w} R${a - w * b}`, `So ${fr(a, b)} = ${mx(a, b, false)}: between ${w} and ${w + 1}.`] };
    }
    const k = R(2, 6), L = k * R(1, 4) + R(1, k - 1);
    return { topic: 'FRACTIONS', text: `A ${L}-foot rope is cut into ${k} equal pieces. How long is each piece?`, ...fracs([L, k], [[k, L], [L - k, k], [L, k + 1], [L + 1, k]], p => mx(p[0], p[1]) + ' ft'),
      steps: [`${L} ÷ ${k} = ${fr(L, k)}`, `${fr(L, k)} = ${mx(L, k)} feet`] };
  };
  // 5.NF.4a: a fraction times a whole number or a fraction.
  G5.fracTimesFrac = d => {
    const form = R(0, d < 2 ? 1 : 3), n = who();
    if (form === 0 || form === 2) {
      const b = pick([2, 3, 4, 5, 6, 8]), a = coprime(b), W = b * R(2, 8), ans = a * W / b;
      const text = form === 0 ? `${fr(a, b)} × ${W} = ?` : pick([`${fr(a, b)} of the ${W} kids in the club like soccer best. How many kids is that?`, `${n} has ${W} stickers and gives away ${fr(a, b)} of them. How many stickers is that?`]);
      return { topic: 'FRACTIONS', text, ...nums(ans, [W / b, W * b / a === Math.floor(W * b / a) ? W * b / a : W + a, W - ans, a * W, ans + a]),
        steps: [`${fr(1, b)} of ${W} is ${W} ÷ ${b} = ${W / b}.`, `${fr(a, b)} of ${W} is ${a} × ${W / b} = ${ans}.`] };
    }
    const b1 = pick([2, 3, 4, 5, 6]), b2 = pick([2, 3, 4, 5, 8]), a1 = coprime(b1), a2 = coprime(b2), ans = red(a1 * a2, b1 * b2);
    const text = form === 1 ? `${fr(a1, b1)} × ${fr(a2, b2)} = ?` : `What is ${fr(a1, b1)} of ${fr(a2, b2)}?`;
    return { topic: 'FRACTIONS', text, ...fracs(ans, [[a1 + a2, b1 + b2], [a1 * b2, a2 * b1], [a1 * a2, b1 + b2], [a1 * b2 + a2 * b1, b1 * b2], [a1 + a2, b1 * b2]], fmix),
      steps: ['Multiply the tops, and multiply the bottoms.', `${a1} × ${a2} = ${a1 * a2}; ${b1} × ${b2} = ${b1 * b2}.`, `${fr(a1 * a2, b1 * b2)}${fmix(ans) !== fr(a1 * a2, b1 * b2) ? ` = ${fmix(ans)}` : ''}`] };
  };
  // 5.NF.4b: area of a rectangle with fraction sides, by tiling.
  G5.fracArea = d => {
    const b1 = pick([2, 3, 4, 5, 6]), b2 = pick([2, 3, 4, 5, 6]), a1 = R(1, b1 - 1), a2 = R(1, b2 - 1), ans = red(a1 * a2, b1 * b2), text = d >= 3 && rand() < .5;
    const wr = [[a1 * b2 + a2 * b1, b1 * b2], [a1 + a2, b1 + b2], [a1 * a2, b1 + b2], [2 * (a1 * b2 + a2 * b1), b1 * b2], [a1 * a2 + 1, b1 * b2]];
    if (text) return { topic: 'AREA', text: `A garden is ${fr(a1, b1)} mile long and ${fr(a2, b2)} mile wide. What is its area, in square miles?`, ...fracs(ans, wr, fmix),
      steps: ['Area = length × width', `${fr(a1, b1)} × ${fr(a2, b2)} = ${fr(a1 * a2, b1 * b2)}${fmix(ans) !== fr(a1 * a2, b1 * b2) ? ` = ${fmix(ans)}` : ''} square mile`] };
    return { topic: 'AREA', text: `The big square is 1 foot on each side. What is the area of the shaded rectangle, in square feet?`, ...fracs(ans, wr, fmix),
      steps: [`The square is cut into ${b1} × ${b2} = ${b1 * b2} equal pieces.`, `${a1} × ${a2} = ${a1 * a2} of them are shaded: ${fr(a1 * a2, b1 * b2)}.`, `Same as ${fr(a1, b1)} × ${fr(a2, b2)} = ${fmix(ans)} square foot`],
      size: [118, 88], fig: (c, w, h) => {
        const S = 60, x0 = 30, y0 = 13;
        F.box(c, x0, y0, S, S, EMPTY);
        F.box(c, x0, y0, Math.round(S * a1 / b1), Math.round(S * a2 / b2), HOT);
        for (let i = 1; i < b1; i++) vl(c, x0 + Math.round(i * S / b1), y0, S, DIM);
        for (let j = 1; j < b2; j++) hl(c, x0, y0 + Math.round(j * S / b2), S, DIM);
        frame(c, x0, y0, S + 1, S + 1, INK);
        lbl(c, fr(a1, b1), x0 + S * a1 / b1 / 2, y0 - 6, HOT); lbl(c, fr(a2, b2), x0 - 4, y0 + S * a2 / b2 / 2 + 1, HOT, 'right');
        lbl(c, '1 ft', x0 + S / 2, y0 + S + 7, SOFT); lbl(c, '1 ft', x0 + S + 4, y0 + S / 2 + 1, SOFT, 'left');
      } };
  };
  // 5.NF.5: multiplication as scaling.
  G5.scaling = d => {
    const form = R(0, d < 2 ? 0 : 1), W = R(6, 60);
    if (form === 0) {
      const big = rand() < .5, b = R(2, 9), a = big ? b + R(1, 5) : R(1, b - 1), f = fr(a, b);
      return { topic: 'SCALING', text: `Without multiplying, which is true about ${f} × ${W}?`, ...txt(big ? `It is greater than ${W}.` : `It is less than ${W}.`, [big ? `It is less than ${W}.` : `It is greater than ${W}.`, `It is equal to ${W}.`, `It is less than ${f}.`]),
        steps: [`${f} is ${big ? 'more' : 'less'} than 1.`, `Multiplying by a number ${big ? 'more' : 'less'} than 1 makes ${W} ${big ? 'bigger' : 'smaller'}.`] };
    }
    const more = rand() < .5, b = R(3, 9), F1 = more ? fr(b + R(1, 3), b) : fr(R(1, b - 1), b);
    const wr = more ? [`${fr(R(1, b - 1), b)} × ${W}`, `1 × ${W}`, `${fr(b, b)} × ${W}`, `${fr(1, 2)} × ${W}`] : [`${fr(b + 1, b)} × ${W}`, `1 × ${W}`, `${fr(b, b)} × ${W}`, `${fr(3, 2)} × ${W}`];
    return { topic: 'SCALING', text: `Which product is ${more ? 'greater' : 'less'} than ${W}?`, ...txt(`${F1} × ${W}`, wr),
      steps: [`A factor ${more ? 'greater' : 'less'} than 1 makes the product ${more ? 'greater' : 'less'} than ${W}.`, `${F1} is ${more ? 'greater' : 'less'} than 1. (1 and ${fr(b, b)} keep it the same.)`] };
  };
  // 5.NF.6: real-world problems multiplying fractions and mixed numbers.
  G5.mixedMult = d => {
    const form = R(0, d < 2 ? 1 : 2), n = who();
    if (form === 0) {
      const b = pick([2, 3, 4]), w = R(1, 3), r = R(1, b - 1), k = R(2, 4), num = (w * b + r) * k;
      return { topic: 'FRACTIONS', text: `A recipe uses ${w} ${fr(r, b)} cups of flour. How much flour is needed for ${k} batches?`, ...fracs([num, b], [[w * k * b + r, b], [(w + k) * b + r, b], [w * k * b + r * k + b, b], [num, b * k]], fmix),
        steps: [`${w} ${fr(r, b)} = ${fr(w * b + r, b)}`, `${k} × ${fr(w * b + r, b)} = ${fr(num, b)}`, `= ${fmix([num, b])} cups`] };
    }
    if (form === 1) {
      const b = pick([2, 3, 4]), w = R(1, 4), r = R(1, b - 1), b2 = pick([2, 3, 4]), a2 = R(1, b2 - 1), N1 = w * b + r, ans = red(N1 * a2, b * b2);
      return { topic: 'FRACTIONS', text: `A bike trail is ${w} ${fr(r, b)} miles long. ${n} has ridden ${fr(a2, b2)} of it. How many miles has ${n} ridden?`,
        ...fracs(ans, [[w * a2 * b + r * b2, b2 * b], [N1 * b2 + a2 * b, b * b2], [N1 * a2, b + b2], [N1 * b2, b * a2]], fmix),
        steps: [`${fr(a2, b2)} of ${w} ${fr(r, b)} means ${fr(a2, b2)} × ${fr(N1, b)}.`, `${a2} × ${N1} = ${a2 * N1}; ${b2} × ${b} = ${b2 * b}.`, `${fr(a2 * N1, b2 * b)} = ${fmix(ans)} miles`] };
    }
    const b1 = pick([2, 3, 4]), b2 = pick([2, 3, 4]), w1 = R(1, 3), w2 = R(1, 2), r1 = R(1, b1 - 1), r2 = R(1, b2 - 1), N1 = w1 * b1 + r1, N2 = w2 * b2 + r2, ans = red(N1 * N2, b1 * b2);
    return { topic: 'FRACTIONS', text: `A rug is ${w1} ${fr(r1, b1)} yards long and ${w2} ${fr(r2, b2)} yards wide. What is its area, in square yards?`,
      ...fracs(ans, [[w1 * w2 * b1 * b2 + r1 * r2, b1 * b2], [(w1 + w2) * b1 * b2 + r1 * b2 + r2 * b1, b1 * b2], [N1 * N2 + b1 * b2, b1 * b2], [N1 * N2, b1 + b2]], fmix),
      steps: [`Change to fractions: ${fr(N1, b1)} × ${fr(N2, b2)}.`, `${N1} × ${N2} = ${N1 * N2}; ${b1} × ${b2} = ${b1 * b2}.`, `${fr(N1 * N2, b1 * b2)} = ${fmix(ans)} square yards`] };
  };
  // 5.NF.7: dividing unit fractions and whole numbers.
  G5.fracDivide = d => {
    const form = R(0, d < 2 ? 1 : 3), b = R(2, 8), k = R(2, 6);
    if (form === 0) return { topic: 'FRACTIONS', text: `${fr(1, b)} ÷ ${k} = ?`, ...fracs([1, b * k], [[k, b], [b, k], [1, b + k], [k, b * k]], fmix),
      steps: [`Split ${fr(1, b)} into ${k} equal parts.`, `Each part is ${fr(1, b * k)}.`, `Check: ${k} × ${fr(1, b * k)} = ${fr(k, b * k)} = ${fr(1, b)}`] };
    if (form === 1) return { topic: 'FRACTIONS', text: `${k} ÷ ${fr(1, b)} = ?`, ...fracs([k * b, 1], [[k, b], [1, k * b], [k + b, 1], [b, k]], fmix),
      steps: [`How many ${fr(1, b)}s fit in ${k}?`, `Each whole holds ${b} of them, so ${k} × ${b} = ${k * b}.`] };
    if (form === 2) { const what = pick(['trail mix', 'rice', 'juice', 'popcorn']); return { topic: 'FRACTIONS', text: `How many ${fr(1, b)}-cup servings are in ${k} cups of ${what}?`, ...fracs([k * b, 1], [[k, b], [k + b, 1], [b, k], [k * b + b, 1]], fmix),
      steps: [`${k} ÷ ${fr(1, b)}`, `Each cup has ${b} servings: ${k} × ${b} = ${k * b} servings`] }; }
    const kids = k, sweet = pick(['fudge', 'cheese', 'grapes']);
    return { topic: 'FRACTIONS', text: `${fr(1, b)} pound of ${sweet} is shared equally by ${kids} kids. How much does each kid get?`, ...fracs([1, b * kids], [[kids, b], [b, kids], [1, b + kids], [kids, b * kids]], p => fmix(p) + ' lb'),
      steps: [`${fr(1, b)} ÷ ${kids}`, `= ${fr(1, b * kids)} pound each`] };
  };
  const CONV5 = [['kilograms', 'grams', 1000, 'kg', 'g'], ['meters', 'centimeters', 100, 'm', 'cm'], ['liters', 'milliliters', 1000, 'L', 'mL'], ['kilometers', 'meters', 1000, 'km', 'm'], ['centimeters', 'millimeters', 10, 'cm', 'mm']];
  // 5.MD.1: converting units, with decimals and fractions, and multi-step problems.
  G5.convert = d => {
    const form = R(0, d < 2 ? 1 : 4), n = who();
    if (form === 0 || form === 1) {
      const [big, small, f, B, S] = pick(CONV5), v = R(11, 99) / 10, down = form === 0;
      const smallV = Math.round(v * f), ans = down ? smallV : smallV / f;
      if (down) return { topic: 'MEASUREMENT', text: `${N(v)} ${big} = ? ${small}`, ...nums(ans, [ans / 10, ans * 10, v * 10 === ans ? ans + f : v * 10, ans + f], N),
        steps: [`1 ${one(big)} = ${N(f)} ${small}`, `${N(v)} × ${N(f)} = ${N(ans)} ${small}`] };
      return { topic: 'MEASUREMENT', text: `${N(smallV)} ${small} = ? ${big}`, ...nums(v, [v * 10, v / 10, smallV * f, v + 1], N, .1),
        steps: [`${N(f)} ${small} = 1 ${one(big)}`, `${N(smallV)} ÷ ${N(f)} = ${N(v)} ${big}`] };
    }
    if (form === 2) {
      const C = pick([['inches', 'feet', 12], ['ounces', 'pounds', 16], ['minutes', 'hours', 60], ['feet', 'yards', 3]]), b = C[2], q = R(2, 9), r = pick([b / 2, b / 4, b / 3].filter(Number.isInteger)), tot = q * b + r;
      return { topic: 'MEASUREMENT', text: `${tot} ${C[0]} = ? ${C[1]}`, ...fracs(red(tot, b), [[tot * b, 1], [q * b + r + b, b], [q * b, b], [q * b + b - r, b]], fmix),
        steps: [`${b} ${C[0]} = 1 ${one(C[1])}`, `${tot} ÷ ${b} = ${q} R${r}`, `That's ${q} and ${fr(r, b)} = ${fmix(red(tot, b))} ${C[1]}`] };
    }
    if (form === 3) {
      const lb = R(2, 6), oz = pick([4, 8]), ans = lb * 16 / oz;
      return { topic: 'MEASUREMENT', text: `A ${lb}-pound bag of rice is split into ${oz}-ounce bags. How many small bags are there?`, ...nums(ans, [lb * oz, Math.round(lb * 10 / oz) || ans + 1, lb * 16, ans * 2]),
        steps: [`${lb} pounds = ${lb} × 16 = ${lb * 16} ounces`, `${lb * 16} ÷ ${oz} = ${ans} bags`] };
    }
    const m = R(2, 6), cm = pick([20, 25, 50]), ans = m * 100 / cm;
    return { topic: 'MEASUREMENT', text: `A ${m}-meter ribbon is cut into pieces ${cm} centimeters long. How many pieces are there?`, ...nums(ans, [m * cm, Math.round(m * 10 / cm) || ans + 1, m * 100, ans / 2 === Math.floor(ans / 2) ? ans / 2 : ans + 2]),
      steps: [`${m} meters = ${m * 100} centimeters`, `${m * 100} ÷ ${cm} = ${ans} pieces`] };
  };
  // 5.MD.2: line plots of fractions, and sharing the total out equally.
  G5.linePlot = d => {
    const form = R(0, d < 2 ? 1 : 3), what = pick([['beakers', 'liter of water', 'liters'], ['jars', 'cup of rice', 'cups'], ['cups', 'cup of juice', 'cups']]);
    let counts;
    for (let t = 0; t < 80; t++) {
      counts = range(9).map(i => i === 0 ? 0 : (rand() < .5 ? R(1, 3) : 0));
      const n = sum(counts), s = sum(counts.map((c, i) => c * i));
      if (n >= 3 && counts.filter(v => v).length >= 2 && (form !== 3 || s % n === 0)) break;
    }
    const n = sum(counts), s = sum(counts.map((c, i) => c * i)), base = { topic: 'LINE PLOTS', ...plotFig(8, counts, k => rf(k, 8)) };
    const intro = `The line plot shows how much ${what[1].split(' of ')[1]} is in each of some ${what[0]}, in ${what[2]}.`;
    if (form === 0) return { ...base, text: `${intro} How many ${what[0]} are there?`, ...nums(n, [counts.filter(v => v).length, n + 1, n - 1, Math.max(...counts)]), steps: [`Each X is one ${what[0].replace(/s$/, '')}.`, `Count every X: ${n}.`] };
    if (form === 1 || form === 2 || s % n !== 0) {
      return { ...base, text: `${intro} How much is there in all?`, ...fracs(red(s, 8), [[s, 8 * n], [n, 8], [s + 1, 8], [s - 1, 8]].filter(p => p[0] > 0), p => fmix(p)),
        steps: [`Add each X's amount: ${range(9).filter(i => counts[i]).map(i => `${counts[i]} × ${fr(i, 8)}`).join(' + ')}`, `= ${fr(s, 8)} = ${fmix(red(s, 8))} ${what[2]}`] };
    }
    const each = red(s / n, 8);
    return { ...base, text: `${intro} If the total were shared equally among the ${what[0]}, how much would each have?`, ...fracs(each, [red(s, 8), [s, 8 * (n + 1)], [s / n + 1, 8], [Math.max(1, s / n - 1), 8]], fmix),
      steps: [`Total: ${fr(s, 8)} ${what[2]} in ${n} ${what[0]}.`, `${fr(s, 8)} ÷ ${n} = ${fr(s / n, 8)}${fmix(each) !== fr(s / n, 8) ? ` = ${fmix(each)}` : ''}`] };
  };
  // A box seen at an angle: front face, top and right side; with o.grid it shows its unit cubes.
  function prism(c, x0, yb, L, Wd, Hh, s, o = {}) {
    const dx = Math.round(s * .55), dy = Math.round(s * .45), FR = x0 + L * s, FT = yb - Hh * s, ex = Wd * dx, ey = Wd * dy;
    const top = [[x0, FT], [FR, FT], [FR + ex, FT - ey], [x0 + ex, FT - ey]], side = [[FR, yb], [FR + ex, yb - ey], [FR + ex, FT - ey], [FR, FT]];
    F.fillPoly(c, top, o.top || '#7a9cf0'); F.fillPoly(c, side, o.side || '#2c4a9c'); F.box(c, x0, FT, L * s, Hh * s, o.front || '#4670d0');
    const g = o.grid ? '#101838' : null;
    if (g) {
      for (let i = 0; i <= L; i++) { F.line(c, x0 + i * s, yb, x0 + i * s, FT, g); F.line(c, x0 + i * s, FT, x0 + i * s + ex, FT - ey, g); }
      for (let j = 0; j <= Hh; j++) { F.line(c, x0, yb - j * s, FR, yb - j * s, g); F.line(c, FR, yb - j * s, FR + ex, yb - j * s - ey, g); }
      for (let k = 0; k <= Wd; k++) { F.line(c, x0 + k * dx, FT - k * dy, FR + k * dx, FT - k * dy, g); F.line(c, FR + k * dx, yb - k * dy, FR + k * dx, FT - k * dy, g); }
    }
    F.outlinePoly(c, [[x0, yb], [FR, yb], [FR + ex, yb - ey], [FR + ex, FT - ey], [x0 + ex, FT - ey], [x0, FT]], INK);
    F.line(c, x0, FT, FR, FT, INK); F.line(c, FR, FT, FR, yb, INK); F.line(c, FR, FT, FR + ex, FT - ey, INK);
    return { x0, FR, FT, yb, ex, ey };
  }
  const prismSize = (L, Wd, Hh, w, h, pad = 30) => Math.max(4, Math.min(12, Math.floor((w - pad) / (L + Wd * .55)), Math.floor((h - 18) / (Hh + Wd * .45))));
  // 5.MD.3, 5.MD.4: volume by counting unit cubes.
  G5.volumeCubes = d => {
    const L = R(2, [4, 5, 6, 6][d - 1]), Wd = R(2, d < 2 ? 3 : 4), Hh = R(2, d < 3 ? 3 : 4), V = L * Wd * Hh, form = d >= 2 && rand() < .3 ? 1 : 0;
    const vis = L * Hh + L * Wd + Wd * Hh - L - Wd - Hh + 1;
    const fig = { size: [110, 80], fig: (c, w, h) => { const s = prismSize(L, Wd, Hh, w, h); const tw2 = L * s + Wd * Math.round(s * .55); prism(c, Math.round((w - tw2) / 2), h - 8, L, Wd, Hh, s, { grid: true }); } };
    if (form === 1) return { topic: 'VOLUME', ...fig, text: 'The box is filled with unit cubes. How many cubes are in the bottom layer?', ...nums(L * Wd, [L + Wd, L * Hh, V, L * Wd + Wd]),
      steps: [`The bottom layer is ${L} cubes long and ${Wd} cubes deep.`, `${L} × ${Wd} = ${L * Wd} cubes`] };
    return { topic: 'VOLUME', ...fig, text: 'The box is filled with unit cubes. What is its volume, in cubic units?', ...nums(V, [vis, L * Wd, L + Wd + Hh, 2 * (L * Wd + Wd * Hh + L * Hh), V + L * Wd]),
      steps: [`Each layer has ${L} × ${Wd} = ${L * Wd} cubes, even the hidden ones.`, `There are ${Hh} layers: ${L * Wd} × ${Hh} = ${V}.`, `Volume = ${V} cubic units`] };
  };
  // 5.MD.5a,b: volume with V = l × w × h and V = B × h.
  G5.volumeFormula = d => {
    const L = R(2, [6, 9, 12, 20][d - 1]), Wd = R(2, [5, 8, 10, 12][d - 1]), Hh = R(2, [5, 8, 10, 12][d - 1]), V = L * Wd * Hh, [u, uu] = pick(UNITS), form = R(0, d < 2 ? 1 : 3);
    const wr = [L + Wd + Hh, L * Wd, 2 * (L * Wd + Wd * Hh + L * Hh), V + L * Wd, L * Wd + Hh];
    if (form === 0) return { topic: 'VOLUME', text: `What is the volume of the box, in cubic ${uu}?`, ...nums(V, wr),
      steps: ['Volume = length × width × height', `${L} × ${Wd} × ${Hh} = ${V} cubic ${uu}`],
      size: [120, 80], fig: (c, w, h) => {
        const s = prismSize(Math.min(L, 8), Math.min(Wd, 5), Math.min(Hh, 6), w - 30, h, 32);
        const lL = Math.min(L, 8), lW = Math.min(Wd, 5), lH = Math.min(Hh, 6), g = prism(c, 30, h - 12, lL, lW, lH, s);
        lbl(c, `${L} ${u}`, (g.x0 + g.FR) / 2, g.yb + 6); lbl(c, `${Hh} ${u}`, g.x0 - 3 - tw(`${Hh} ${u}`) / 2, (g.FT + g.yb) / 2 + 1); lbl(c, `${Wd} ${u}`, g.FR + g.ex / 2 + 4 + tw(`${Wd} ${u}`) / 2, g.yb - g.ey / 2 + 1);
      } };
    if (form === 1) { const S = pick([[`A fish tank is ${L} inches long, ${Wd} inches wide and ${Hh} inches tall. How many cubic inches of water fill it?`, 'inches'], [`A toy box is ${L} feet long, ${Wd} feet wide and ${Hh} feet tall. What is its volume, in cubic feet?`, 'feet']]);
      return { topic: 'VOLUME', text: S[0], ...nums(V, wr), steps: ['Volume = length × width × height', `${L} × ${Wd} × ${Hh} = ${V} cubic ${S[1]}`] }; }
    if (form === 2) return { topic: 'VOLUME', text: `A box has a base with an area of ${L * Wd} square ${uu}. It is ${Hh} ${uu} tall. What is its volume, in cubic ${uu}?`, ...nums(V, [L * Wd + Hh, L * Wd, L * Wd * Hh * 2, V + Hh]),
      steps: ['Volume = base area × height', `${L * Wd} × ${Hh} = ${V} cubic ${uu}`] };
    return { topic: 'VOLUME', text: `A box has a volume of ${V} cubic ${uu}. It is ${L} ${uu} long and ${Wd} ${uu} wide. How tall is it?`, ...nums(Hh, [V - L * Wd, V / L, L * Wd, Hh + 1, Hh - 1], v => `${N(v)} ${u}`),
      steps: [`The base is ${L} × ${Wd} = ${L * Wd} square ${uu}.`, `${V} ÷ ${L * Wd} = ${Hh} ${uu}`] };
  };
  // 5.MD.5c: volume of a shape made of two boxes.
  G5.volumeAdd = d => {
    const Wd = R(2, 4), L1 = R(2, 5), H1 = R(4, 7), L2 = R(2, 5), H2 = R(1, H1 - 2), V1 = L1 * Wd * H1, V2 = L2 * Wd * H2, [u, uu] = pick(UNITS.slice(2));
    return { topic: 'VOLUME', text: `The shape is made of two boxes, each ${Wd} deep. All lengths are in ${uu}. What is the total volume, in cubic ${uu}?`, ...nums(V1 + V2, [(L1 + L2) * Wd * H1, V1, (L1 + L2) * H1 * Wd - V2, V1 + V2 + Wd, (L1 + L2) * (H1 + H2)]),
      steps: [`Tall box: ${L1} × ${Wd} × ${H1} = ${V1}`, `Short box: ${L2} × ${Wd} × ${H2} = ${V2}`, `${V1} + ${V2} = ${V1 + V2} cubic ${uu}`],
      size: [140, 84], fig: (c, w, h) => {
        const s = prismSize(L1 + L2, Wd, H1, w - 52, h - 4, 0), x0 = 26, yb = h - 12;
        const a = prism(c, x0, yb, L1, Wd, H1, s, { front: '#4670d0' }), b = prism(c, a.FR, yb, L2, Wd, H2, s, { front: '#3aa060', top: '#70d090', side: '#24703c' });
        lbl(c, L1, (a.x0 + a.FR) / 2, yb + 7); lbl(c, L2, (b.x0 + b.FR) / 2, yb + 7);
        lbl(c, H1, a.x0 - 6, (a.FT + yb) / 2 + 1); lbl(c, H2, b.FR + b.ex + 6, (b.FT + yb) / 2 - b.ey / 2 + 1);
      } };
  };
  // 5.G.1: points in the first quadrant.
  G5.coordPoints = d => {
    const pts = [], names = shuffle(POINTS.split('')), form = R(0, d < 2 ? 1 : 2);
    for (let t = 0; t < 80 && pts.length < 4; t++) { const p = [R(1, 9), R(1, 9)]; if (!pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 2.9)) pts.push(p); }
    while (pts.length < 4) pts.push([pts.length * 2, 9 - pts.length * 2]);
    if (pts[0][0] === pts[0][1]) pts[0][1] = pts[0][0] === 9 ? 8 : pts[0][0] + 1;
    const [x0p, y0p] = pts[0];
    if (form === 1) { const sw = [pts[0][1], pts[0][0]]; if (Math.hypot(sw[0] - x0p, sw[1] - y0p) >= 2.9 && !pts.slice(2).some(q => Math.hypot(q[0] - sw[0], q[1] - sw[1]) < 2.9)) pts[1] = sw; }
    const fig = { size: [110, 96], fig: (c, w, h) => { const P = qgrid(c, w, h, 10); pts.forEach((p, i) => { const q = P(...p); dot3(c, q[0], q[1], HOT); lbl(c, names[i], q[0] + 5, q[1] - 5, HOT); }); } };
    const [x, y] = pts[0];
    if (form === 0) return { topic: 'COORDINATES', ...fig, text: `What are the coordinates of point ${names[0]}?`, ...txt(PT(x, y), [PT(y, x), PT(x + 1, y), PT(x, y - 1), PT(x - 1, y + 1)]),
      steps: ['Start at (0, 0). Go across first, then up.', `${names[0]} is ${x} across and ${y} up.`, `So ${names[0]} is at ${PT(x, y)}.`] };
    if (form === 1) return { topic: 'COORDINATES', ...fig, text: `Which point is at ${PT(x, y)}?`, ...txt(names[0], names.slice(1)),
      steps: ['The first number says how far across; the second, how far up.', `${x} across, ${y} up is point ${names[0]}.`] };
    const axis = rand() < .5;
    return { topic: 'COORDINATES', ...fig, text: `How far is point ${names[0]} from the ${axis ? 'x-axis' : 'y-axis'}?`, ...nums(axis ? y : x, [axis ? x : y, x + y, (axis ? y : x) + 1, 10 - (axis ? y : x)], v => `${v} ${pl(v, 'unit')}`),
      steps: [`${names[0]} is at ${PT(x, y)}.`, axis ? `The x-axis is the bottom line, so count up: ${y}.` : `The y-axis is the left line, so count across: ${x}.`] };
  };
  // 5.G.2: problems on a coordinate grid.
  G5.coordWord = d => {
    const form = R(0, 2), n = who();
    if (form === 0) {
      const x = R(1, 6), y = R(1, 5), dx = R(1, 4), dy = R(1, 4);
      return { topic: 'COORDINATES', text: `${n} starts at ${PT(x, y)}, walks ${dx} ${pl(dx, 'unit')} right, then ${dy} ${pl(dy, 'unit')} up. Where does ${n} end up?`, ...txt(PT(x + dx, y + dy), [PT(x + dy, y + dx), PT(dx, dy), PT(x + dx, y), PT(y + dy, x + dx), PT(x - dx > 0 ? x - dx : x + dx + 1, y + dy)]),
        steps: [`Right adds to the first number: ${x} + ${dx} = ${x + dx}.`, `Up adds to the second: ${y} + ${dy} = ${y + dy}.`, `${n} ends at ${PT(x + dx, y + dy)}.`] };
    }
    const places = shuffle(['School', 'Park', 'Library', 'Museum', 'Zoo', 'Gym']).slice(0, 2), same = rand() < .5 ? 0 : 1;
    const a = [R(1, 9), R(1, 9)], b = a.slice(); b[1 - same] = a[1 - same]; b[same] = a[same] > 5 ? a[same] - R(2, 5) : a[same] + R(2, 4);
    const dist = Math.abs(a[same] - b[same]);
    const fig = { size: [110, 96], fig: (c, w, h) => { const P = qgrid(c, w, h, 10); [a, b].forEach((p, i) => { const q = P(...p); dot3(c, q[0], q[1], i ? GRN : HOT); lbl(c, places[i][0], q[0] + 5, q[1] - 5, i ? GRN : HOT); }); } };
    if (form === 1) return { topic: 'COORDINATES', ...fig, text: `On the map, ${places[0]} (${places[0][0]}) is at ${PT(...a)} and ${places[1]} (${places[1][0]}) is at ${PT(...b)}. How many blocks apart are they?`,
      ...nums(dist, [a[same] + b[same], dist + 1, a[1 - same], dist - 1 || dist + 2]), steps: [`They share the ${same ? 'first' : 'second'} number, ${a[1 - same]}, so they are on one straight line.`, `${Math.max(a[same], b[same])} - ${Math.min(a[same], b[same])} = ${dist} blocks`] };
    return { topic: 'COORDINATES', ...fig, text: `What are the coordinates of the ${places[1]} (${places[1][0]})?`, ...txt(PT(...b), [PT(b[1], b[0]), PT(...a), PT(b[0] + 1, b[1]), PT(b[0], b[1] + 1)]),
      steps: ['Across first, then up.', `${places[1]} is ${b[0]} across and ${b[1]} up: ${PT(...b)}.`] };
  };
  // 5.G.3, 5.G.4: classifying triangles by sides and angles.
  G5.triangles = d => {
    const form = R(0, d < 2 ? 1 : 2);
    if (form === 0) {
      const ak = pick(['acute', 'right', 'obtuse']), sk = pick(['isosceles', 'scalene']), angs = triAngles(ak, sk);
      const sides = angs[0] === angs[1] || angs[1] === angs[2] || angs[0] === angs[2] ? 'isosceles' : 'scalene', right = `${ak} ${sides}`, other = s => s === 'isosceles' ? 'scalene' : 'isosceles';
      return { topic: 'TRIANGLES', text: 'Which name fits this triangle best?', ...triangleFig(angs, { labels: true, ticks: true }),
        ...txt(right, [`${ak} ${other(sides)}`, ...['acute', 'right', 'obtuse'].filter(a => a !== ak).map(a => `${a} ${sides}`), `${ak} equilateral`]),
        steps: ['By angles: right has a 90° angle, obtuse one over 90°, acute all under 90°.', 'By sides: tick marks show equal sides. Isosceles has 2 equal; scalene none.', `This one is ${right}.`] };
    }
    if (form === 1) {
      const C = pick([[[5, 5, 8], 'isosceles'], [[4, 6, 7], 'scalene'], [[9, 9, 4], 'isosceles'], [[3, 5, 7], 'scalene'], [[7, 7, 10], 'isosceles'], [[6, 8, 9], 'scalene']]);
      return { topic: 'TRIANGLES', text: `A triangle has sides of ${C[0].join(' cm, ').replace(/, (\d+)$/, ' and $1')} cm. What kind of triangle is it, by its sides?`, choices: ['equilateral', 'isosceles', 'scalene', 'none of these'], answer: C[1] === 'isosceles' ? 1 : 2,
        steps: ['Equilateral: all 3 sides equal. Isosceles: at least 2 equal. Scalene: none equal.', `These sides make it ${C[1]}.`] };
    }
    const T = ['An equilateral triangle is always acute.', 'A right triangle has exactly one right angle.', 'An isosceles triangle has at least two equal sides.', 'Every triangle has at least two acute angles.'];
    const Fa = ['A right triangle can have an obtuse angle.', 'A scalene triangle has two equal sides.', 'An obtuse triangle can have two obtuse angles.', 'An equilateral triangle can be a right triangle.', 'Every isosceles triangle is equilateral.'];
    const right = pick(T);
    return { topic: 'TRIANGLES', text: 'Which statement is true?', ...txt(right, shuffle(Fa.slice())), steps: [right, "A triangle's angles add to 180°, so it can't have two angles of 90° or more."] };
  };
  const HT = ['Every square is a rectangle.', 'Every square is a rhombus.', 'Every rectangle is a parallelogram.', 'Every rhombus is a parallelogram.', 'Every parallelogram is a quadrilateral.', 'Every square is a parallelogram.'];
  const HF = ['Every rectangle is a square.', 'Every rhombus is a square.', 'Every parallelogram is a rectangle.', 'Every quadrilateral is a parallelogram.', 'Every trapezoid is a parallelogram.', 'Every rhombus has 4 right angles.', 'Every kite is a rhombus.'];
  // 5.G.3, 5.G.4: the hierarchy of quadrilaterals.
  G5.shapeHierarchy = d => {
    const form = R(0, d < 2 ? 1 : 3);
    if (form === 0) { const r = pick(HT); return { topic: 'SHAPES', text: 'Which statement is always true?', ...txt(r, shuffle(HF.slice())), steps: ['A square has 4 equal sides and 4 right angles, so it is a rectangle AND a rhombus.', 'Rectangles and rhombuses both have 2 pairs of parallel sides: parallelograms.', r] }; }
    if (form === 1) { const r = pick(HF); return { topic: 'SHAPES', text: 'Which statement is NOT always true?', ...txt(r, shuffle(HT.slice())), steps: ['Going down the family tree adds rules: a square follows every rule of a rectangle.', 'Going up is not always true: a rectangle need not have 4 equal sides.', `So "${r}" is not always true.`] }; }
    if (form === 2) {
      const C = pick([['A quadrilateral has 4 equal sides and 4 right angles. What is the most specific name for it?', 'square', ['rectangle', 'rhombus', 'parallelogram', 'quadrilateral']],
        ['A parallelogram has 4 right angles. Its sides are not all equal. What is the most specific name for it?', 'rectangle', ['square', 'rhombus', 'trapezoid', 'quadrilateral']],
        ['A parallelogram has 4 equal sides but no right angles. What is the most specific name for it?', 'rhombus', ['square', 'rectangle', 'trapezoid', 'kite']]]);
      return { topic: 'SHAPES', text: C[0], ...txt(C[1], C[2]), steps: ['The most specific name has the most rules.', `It fits every rule of a ${C[1]}.`] };
    }
    const k = pick(['rectangle', 'rhombus', 'parallelogram', 'trapezoid']), Q = QUADS[k], pts = Q.pts(), all = Q.names.join(', ');
    const extra = (k === 'trapezoid' ? ['square', 'rectangle', 'rhombus', 'parallelogram'] : ['square', 'rectangle', 'rhombus']).filter(x => !Q.names.includes(x));
    const wrongs = [[...Q.names, extra[0]].join(', '), Q.names.filter(x => x !== 'parallelogram' || k === 'parallelogram').filter((x, i, A) => k !== 'parallelogram' && k !== 'trapezoid' ? true : i === 0).join(', '),
      [extra[0], ...Q.names.slice(1)].join(', '), Q.names[0], [Q.names[0], extra[extra.length - 1]].join(', ')];
    return { topic: 'SHAPES', text: 'Which list gives every name that fits this shape?', ...quadFig(k, pts), ...txt(all, wrongs.filter(s => s !== all)),
      steps: ['Tick marks show equal sides; little squares show right angles.', `A ${k} is also each of these: ${all}.`] };
  };

  Questions.grade({ id: '5', n: 5, label: '5TH GRADE', short: '5TH', clock: [48, 44, 40, 36, 34], kinds: G5, min: { mixedAddSub: 2, fracDivide: 2 } });

  // ======== BEYOND COMMON CORE ========
  // What classrooms and IXL's grade plans add on top of the Common Core: money, calendars and
  // schedules, temperature, Roman numerals, probability, more kinds of data display, 3D shapes and
  // nets, slides, flips and turns, logic, budgeting, and in 5th grade a first look at prime
  // factorization, exponents, integers, percents and ratios. Most are shared by the three grades,
  // built by a function that takes the grade.

  // A table: rows of cells (the first row is the header), columns colW pixels wide.
  function tableFig(rows, colW, o = {}) {
    const TW = sum(colW) + 1, TH = rows.length * 11 + 1;
    return { size: [Math.max(o.minW || 0, TW + 4), TH + 4], fig: (c, w, h) => {
      const x0 = Math.round((w - TW) / 2), y0 = Math.round((h - TH) / 2);
      rows.forEach((r, j) => {
        let x = x0;
        r.forEach((s, i) => {
          const head = j === 0 && o.head !== false;
          if (head) F.box(c, x + 1, y0 + 1, colW[i] - 1, 10, '#1c2c68');
          const al = (o.align && o.align[i]) || 'center', tx = al === 'left' ? x + 3 : al === 'right' ? x + colW[i] - 3 : x + colW[i] / 2;
          if (s !== '' && s != null) lbl(c, s, tx, y0 + j * 11 + 7, head ? HOT : o.hot && o.hot(i, j) ? HOT : INK, al);
          x += colW[i];
        });
      });
      for (let j = 0; j <= rows.length; j++) if (!o.noRows || j <= 1 || j === rows.length) hl(c, x0, y0 + j * 11, TW, DIM);
      let x = x0;
      for (let i = 0; i <= colW.length; i++) { if (!o.noCols || i === 0 || i === colW.length || i === 1) vl(c, x, y0, TH, DIM); x += colW[i] || 0; }
    } };
  }
  function fillEllipse(c, cx, cy, rx, ry, col) {
    c.fillStyle = col;
    for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - y * y / (ry * ry)))); c.fillRect(Math.round(cx - w), Math.round(cy + y), 2 * w + 1, 1); }
  }
  // An ellipse outline from angle a0 to a1 (0 is the right, angles grow downward); dash > 0 dots it.
  function ellipse(c, cx, cy, rx, ry, col, a0 = 0, a1 = 2 * Math.PI, dash = 0) {
    c.fillStyle = col;
    const n = Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) * 1.4);
    for (let i = 0; i <= n; i++) { if (dash && i % (dash * 2) >= dash) continue; const a = a0 + (a1 - a0) * i / n; c.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1); }
  }

  // ---- Money: count it, make change, have enough, compare, price lists, unit price, better buys.
  const COIN = { 1: ['penny', 'pennies', '#c87838', 6], 5: ['nickel', 'nickels', '#b8bcc8', 7], 10: ['dime', 'dimes', '#c8ccd8', 6], 25: ['quarter', 'quarters', '#d8dce8', 8] };
  const coinWord = (v, k) => `${k} ${k === 1 ? COIN[v][0] : COIN[v][1]}`;
  function coinsFig(items) {
    const pos = []; let x = 4, y = 3, rowH = 0;
    for (const v of items) {
      const cw = v >= 100 ? 34 : COIN[v][3] * 2 + 3, ch = v >= 100 ? 17 : COIN[v][3] * 2 + 1;
      if (x + cw > 164) { x = 4; y += rowH + 3; rowH = 0; }
      pos.push([x, y, cw, ch]); x += cw + 2; rowH = Math.max(rowH, ch);
    }
    return { size: [168, Math.max(28, y + rowH + 4)], fig: c => items.forEach((v, i) => {
      const [x, y, cw, ch] = pos[i];
      if (v >= 100) { F.box(c, x, y, cw - 2, ch, '#3c8a4c'); frame(c, x, y, cw - 2, ch, '#a8e8a8'); lbl(c, '$' + v / 100, x + (cw - 2) / 2, y + ch / 2 + 1, '#f0fff0'); return; }
      const r = COIN[v][3];
      F.disc(c, x + r, y + r, r, COIN[v][2]); F.circle(c, x + r, y + r, r, '#5a6070');
      Font.draw(c, String(v), x + r + 1, y + r - 3, '#1c1c24', { align: 'center' });
    }) };
  }
  const ITEMS = ['notebook', 'yo-yo', 'kite', 'comic book', 'puzzle', 'water bottle', 'sticker book', 'toy car', 'jump rope', 'paint set'];
  const BILLS = [100, 500, 1000, 2000, 5000, 10000];
  function moneyKind(g) {
    return d => {
      const n = who(), forms = g === 3 ? [0, 1, 2, 3] : g === 4 ? [0, 1, 2, 3, 4, 5] : [1, 2, 4, 5, 6];
      const form = pick(forms.slice(0, d < 2 ? Math.min(3, forms.length) : forms.length));
      const [it1, it2] = shuffle(ITEMS.slice()).slice(0, 2), big = g === 3 ? 1 : g === 4 ? 2 : 4;
      if (form === 0) {
        const items = range(R(3, d < 2 ? 6 : 9)).map(() => pick(d < 2 ? [25, 10, 5, 1] : [25, 25, 10, 10, 5, 1]));
        if (d >= 2) for (let i = R(0, 2); i > 0; i--) items.push(pick(g === 3 ? [100, 100, 500] : [100, 500, 1000, 2000]));
        items.sort((a, b) => b - a);
        const tot = sum(items), groups = [...new Set(items)].map(v => [v, items.filter(u => u === v).length]);
        return { topic: 'MONEY', text: 'How much money is shown?', ...coinsFig(items),
          ...nums(tot, [tot + 5, tot - 5, tot + 10, sum(items.map(v => v >= 100 ? v : 10)), items.length, tot + 25].filter(v => v > 0), usd, 5),
          steps: ['Count the biggest first.', groups.map(([v, k]) => v >= 100 ? `${k} × $${v / 100}` : `${k} × ${v}¢`).join(' + '), `= ${usd(tot)}`] };
      }
      if (form === 1) {
        const price = R(g === 3 ? 21 : 41, g === 3 ? 190 : 380 * big) * 5, pay = BILLS.find(v => v > price), ch = pay - price;
        return { topic: 'MONEY', text: `${n} buys a ${it1} for ${usd(price)} and pays with a $${pay / 100} bill. How much change does ${n} get?`,
          ...nums(ch, [smallFromBig(pay, price), price, ch + 100, ch - 10, ch + 10].filter(v => v > 0 && v !== ch), usd, 5),
          steps: [`Change = ${usd(pay)} - ${usd(price)}`, `Count up from ${usd(price)} to ${usd(pay)}: that's ${usd(ch)}.`] };
      }
      if (form === 2) {
        const a = R(10, 90 * big) * 5, b = R(10, 60 * big) * 5;
        let has = a + b + pick([-1, 1]) * R(1, 40) * 5; if (has <= 0) has = a + b + 35;
        const diff = has - a - b, D = Math.abs(diff), yes = s => `Yes, ${usd(s)} left`, no = s => `No, ${usd(s)} short`;
        return { topic: 'MONEY', text: `${n} has ${usd(has)}. A ${it1} costs ${usd(a)} and a ${it2} costs ${usd(b)}. Can ${n} buy both?`,
          ...txt(diff >= 0 ? yes(D) : no(D), [diff >= 0 ? no(D) : yes(D), diff >= 0 ? yes(D + 100) : no(D + 100), diff >= 0 ? yes(D + 10) : no(D + 10), yes(has), no(a + b)]),
          steps: [`Both cost ${usd(a)} + ${usd(b)} = ${usd(a + b)}.`, diff >= 0 ? `${usd(has)} - ${usd(a + b)} = ${usd(D)} left over.` : `${usd(a + b)} - ${usd(has)} = ${usd(D)} more is needed.`] };
      }
      if (form === 3) {
        let gr;
        for (let t = 0; t < 40; t++) { gr = [25, 10, 5, 1].map(v => [v, R(2, v === 1 ? 90 : v === 5 ? 18 : 9)]); if (new Set(gr.map(([v, k]) => v * k)).size === 4) break; }
        const most = rand() < .6, best = gr.reduce((m, q) => (most ? q[0] * q[1] > m[0] * m[1] : q[0] * q[1] < m[0] * m[1]) ? q : m);
        return { topic: 'MONEY', text: `Which group of coins is worth the ${most ? 'most' : 'least'}?`, ...txt(coinWord(...best), gr.filter(q => q !== best).map(q => coinWord(...q))),
          steps: [gr.map(([v, k]) => `${coinWord(v, k)} = ${usd(v * k)}`).join(', '), `The ${most ? 'most' : 'least'} is ${coinWord(...best)}. More coins is not always more money!`] };
      }
      if (form === 4) {
        if (rand() < .5) {
          const k = R(3, 8), p = R(21, 160) * 5;
          return { topic: 'MONEY', text: `Movie tickets cost ${usd(p)} each. How much do ${k} tickets cost?`, ...nums(k * p, multSlips(p, k).filter(v => v > 0), usd, 5),
            steps: [`${k} × ${usd(p)}`, `= ${usd(k * p)}`] };
        }
        const k = R(2, 6), each = R(21, 200) * 5, tot = k * each;
        return { topic: 'MONEY', text: `${k} friends split a ${usd(tot)} bill equally. How much does each friend pay?`, ...nums(each, [each + 5, each - 5, tot - k * 100, each * 10, each + 100].filter(v => v > 0), usd, 5),
          steps: [`${usd(tot)} ÷ ${k}`, `= ${usd(each)} each. Check: ${k} × ${usd(each)} = ${usd(tot)}`] };
      }
      if (form === 5 && (g === 4 && d < 4 || rand() < .4)) {
        const k = pick([2, 3, 4, 5, 6, 8, 10]), each = R(9, 99) * 5, tot = k * each, what = pick(['juice boxes', 'pencils', 'granola bars', 'tennis balls']);
        return { topic: 'MONEY', text: `A pack of ${k} ${what} costs ${usd(tot)}. What is the price of one?`, ...nums(each, [tot - k * 5, each + 10, each * 10, Math.round(tot / (k + 1) / 5) * 5].filter(v => v > 0), usd, 5),
          steps: ['The price of one is the unit price.', `${usd(tot)} ÷ ${k} = ${usd(each)}`] };
      }
      if (form === 5) {
        const offers = [];
        for (let t = 0; t < 60 && offers.length < 4; t++) { const k = pick([2, 3, 4, 5, 6, 8, 10, 12]), u = R(12, 60) * 5; if (!offers.some(o => o[0] === k || o[1] === u)) offers.push([k, u]); }
        while (offers.length < 4) offers.push([offers.length + 13, 400 + offers.length * 5]);
        const best = offers.reduce((m, o) => o[1] < m[1] ? o : m), s = o => `${o[0]} for ${usd(o[0] * o[1])}`, what = pick(['markers', 'stickers', 'apples', 'erasers']);
        return { topic: 'MONEY', text: `${what[0].toUpperCase() + what.slice(1)} come in packs. Which pack is the best buy?`, ...txt(s(best), offers.filter(o => o !== best).map(s)),
          steps: ['Find the price of one in each pack.', offers.map(o => `${s(o)}: ${usd(o[1])} each`).join('; '), `The lowest price for one is ${s(best)}.`] };
      }
      const k = R(2, 4), p = R(41, 99) * 5, q = R(21, 79) * 5, cost = k * p + q, pay = BILLS.find(v => v > cost), ch = pay - cost;
      return { topic: 'MONEY', text: `${n} buys ${k} notebooks at ${usd(p)} each and a pen for ${usd(q)}, and pays with a $${pay / 100} bill. How much change?`,
        ...nums(ch, [pay - p - q, pay - k * (p + q), ch + 100, ch - 5].filter(v => v > 0), usd, 5),
        steps: [`Notebooks: ${k} × ${usd(p)} = ${usd(k * p)}`, `Total: ${usd(k * p)} + ${usd(q)} = ${usd(cost)}`, `Change: ${usd(pay)} - ${usd(cost)} = ${usd(ch)}`] };
    };
  }
  const STORES = [['SCHOOL STORE', ['pencil', 'eraser', 'notebook', 'ruler', 'glue stick', 'folder']], ['SNACK BAR', ['pretzel', 'apple', 'juice box', 'taco', 'muffin', 'banana']],
    ['TOY SHOP', ['yo-yo', 'kite', 'puzzle', 'toy car', 'jump rope', 'ball']], ['ARCADE PRIZES', ['slime jar', 'robot', 'whistle', 'bouncy ball', 'sticker pack', 'toy dino']]];
  const art = s => (/^[aeiou]/.test(s) ? 'an ' : 'a ') + s, plural = s => s.endsWith('box') ? s + 'es' : s + 's';
  function priceListKind(g) {
    return d => {
      const [title, all] = pick(STORES), names = shuffle(all.slice()).slice(0, 5), top = g === 3 ? 99 : g === 4 ? 199 : 399;
      let prices; for (let t = 0; t < 30; t++) { prices = names.map(() => R(5, top) * 5); if (new Set(prices).size === 5) break; }
      const fig = tableFig([[title, ''], ...names.map((s, i) => [s, usd(prices[i])])], [96, 44], { align: ['left', 'right'], noCols: true }), n = who();
      const [i, j] = shuffle(range(5)).slice(0, 2), form = R(0, d < 2 ? 1 : g === 3 ? 3 : 4), T = prices[i] + prices[j];
      const total = () => ({ topic: 'MONEY', ...fig, text: `${n} buys ${art(names[i])} and ${art(names[j])}. How much is that in all?`,
        ...nums(T, [Math.abs(prices[i] - prices[j]), noCarry(prices[i], prices[j]), T + 100, T - 10].filter(v => v > 0), usd, 5),
        steps: [`${cap(names[i])}: ${usd(prices[i])}. ${cap(names[j])}: ${usd(prices[j])}.`, `${usd(prices[i])} + ${usd(prices[j])} = ${usd(T)}`] });
      if (form === 0) return total();
      const [hi, lo] = prices[i] > prices[j] ? [i, j] : [j, i], D = prices[hi] - prices[lo];
      if (form === 1) return { topic: 'MONEY', ...fig, text: `How much more does the ${names[hi]} cost than the ${names[lo]}?`, ...nums(D, [prices[hi] + prices[lo], smallFromBig(prices[hi], prices[lo]), D + 10, prices[hi]].filter(v => v > 0 && v !== D), usd, 5),
        steps: [`${usd(prices[hi])} - ${usd(prices[lo])}`, `= ${usd(D)}`] };
      if (form === 2) { const pay = BILLS.find(v => v > prices[i]), ch = pay - prices[i]; return { topic: 'MONEY', ...fig, text: `${n} buys ${art(names[i])} with a $${pay / 100} bill. How much change does ${n} get?`, ...nums(ch, [smallFromBig(pay, prices[i]), prices[i], ch + 100, ch - 10].filter(v => v > 0 && v !== ch), usd, 5),
        steps: [`${usd(pay)} - ${usd(prices[i])}`, `= ${usd(ch)}`] }; }
      if (form === 3) {
        const pairs = []; for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) pairs.push([a, b]);
        if (pairs.filter(([a, b]) => prices[a] + prices[b] === T).length > 1) return total();
        const s = ([a, b]) => `${names[a]} and ${names[b]}`;
        return { topic: 'MONEY', ...fig, text: `${n} spent exactly ${usd(T)} on two different things. What did ${n} buy?`, ...txt(s([Math.min(i, j), Math.max(i, j)]), shuffle(pairs.filter(q => prices[q[0]] + prices[q[1]] !== T)).map(s)),
          steps: ['Try pairs and add their prices.', `${usd(prices[i])} + ${usd(prices[j])} = ${usd(T)}`] };
      }
      const k = R(2, 4), m = R(2, 3), T2 = k * prices[i] + m * prices[j];
      return { topic: 'MONEY', ...fig, text: `How much do ${k} ${plural(names[i])} and ${m} ${plural(names[j])} cost?`,
        ...nums(T2, [T, (k + m) * prices[i], k * prices[i] + prices[j], T2 + 100].filter(v => v !== T2), usd, 5),
        steps: [`${k} × ${usd(prices[i])} = ${usd(k * prices[i])}`, `${m} × ${usd(prices[j])} = ${usd(m * prices[j])}`, `${usd(k * prices[i])} + ${usd(m * prices[j])} = ${usd(T2)}`] };
    };
  }

  // ---- Calendars and units of time.
  const MONTHS = [['JANUARY', 31], ['FEBRUARY', 28], ['MARCH', 31], ['APRIL', 30], ['MAY', 31], ['JUNE', 30], ['JULY', 31], ['AUGUST', 31], ['SEPTEMBER', 30], ['OCTOBER', 31], ['NOVEMBER', 30], ['DECEMBER', 31]];
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const cap = s => s[0] + s.slice(1).toLowerCase();
  function calFig(name, start, len, mark) {
    const rows = Math.ceil((start + len) / 7);
    return { size: [130, 22 + rows * 10], fig: (c, w, h) => {
      const x0 = Math.round((w - 126) / 2) + 9;
      lbl(c, name, w / 2, 5, HOT);
      'SMTWTFS'.split('').forEach((s, i) => lbl(c, s, x0 + i * 18, 15, SOFT));
      hl(c, x0 - 9, 19, 126, DIM);
      for (let dd = 1; dd <= len; dd++) {
        const k = start + dd - 1, x = x0 + (k % 7) * 18, y = 26 + Math.floor(k / 7) * 10;
        if (mark && mark.includes(dd)) F.box(c, x - 7, y - 5, 15, 9, '#3a3410');
        lbl(c, dd, x, y + 1, mark && mark.includes(dd) ? HOT : INK);
      }
    } };
  }
  function calendarKind(g) {
    return d => {
      const form = R(0, d < 2 ? 2 : 4);
      if (form === 4) {
        const C = g === 3 ? pick([['days', 'weeks', 7], ['months', 'years', 12], ['minutes', 'hours', 60]]) : g === 4 ? pick([['hours', 'days', 24], ['days', 'weeks', 7], ['months', 'years', 12], ['seconds', 'minutes', 60]]) : pick([['hours', 'days', 24], ['minutes', 'hours', 60], ['weeks', 'years', 52], ['days', 'weeks', 7]]);
        const k = R(2, g === 3 ? 5 : 9);
        return { topic: 'CALENDAR', text: `How many ${C[0]} are in ${k} ${C[1]}?`, ...nums(k * C[2], [k + C[2], C[2], k * 10, (k + 1) * C[2], (k - 1) * C[2]]),
          steps: [`1 ${C[1].replace(/s$/, '')} = ${C[2]} ${C[0]}`, `${k} × ${C[2]} = ${k * C[2]} ${C[0]}`] };
      }
      const [name, len] = pick(MONTHS), start = R(0, 6), M = cap(name);
      if (form === 0) {
        const dd = R(2, len), wd = (start + dd - 1) % 7;
        return { topic: 'CALENDAR', ...calFig(name, start, len), text: `What day of the week is ${M} ${dd}?`, ...txt(WEEKDAYS[wd], [WEEKDAYS[(wd + 1) % 7], WEEKDAYS[(wd + 6) % 7], WEEKDAYS[(wd + 2) % 7], WEEKDAYS[(wd + 5) % 7]]),
          steps: [`Find ${dd} on the calendar.`, `Look up its column: ${WEEKDAYS[wd]}.`] };
      }
      if (form === 1) {
        const wd = R(0, 6), nth = R(1, 3), first = (wd - start + 7) % 7 + 1, dd = first + (nth - 1) * 7;
        return { topic: 'CALENDAR', ...calFig(name, start, len), text: `What is the date of the ${ORD[nth]} ${WEEKDAYS[wd]} in ${M}?`, ...nums(dd, [dd + 7, dd - 7, dd + 1, dd - 1].filter(v => v >= 1 && v <= len), v => `${M} ${v}`),
          steps: [`The first ${WEEKDAYS[wd]} is ${M} ${first}.`, nth > 1 ? `Add 7 for each week: ${first}${' + 7'.repeat(nth - 1)} = ${dd}` : `So it's ${M} ${dd}.`] };
      }
      if (form === 2) {
        const a = R(1, len - 8), b = R(a + 3, Math.min(len, a + 20));
        return { topic: 'CALENDAR', ...calFig(name, start, len, [a, b]), text: `How many days is it from ${M} ${a} to ${M} ${b}?`, ...nums(b - a, [b - a + 1, b - a - 1, b + a, b - a + 7]),
          steps: [`Count the jumps from ${a} to ${b}, not the boxes.`, `${b} - ${a} = ${b - a} days`] };
      }
      const a = R(1, len - 15), k = R(1, 2), b = a + 7 * k;
      return { topic: 'CALENDAR', ...calFig(name, start, len, [a]), text: `A class trip is ${k} ${pl(k, 'week')} after ${M} ${a}. What is the date of the trip?`, ...nums(b, [b + 1, b - 1, a + k, b + 7].filter(v => v <= len), v => `${M} ${v}`),
        steps: [`1 week = 7 days, so ${k} ${pl(k, 'week')} = ${7 * k} days.`, `${a} + ${7 * k} = ${b}: ${M} ${b}`] };
    };
  }

  // ---- Schedules, a.m. and p.m., and elapsed time read from a table.
  const PROGRAMS = [['FIELD DAY', ['Relay race', 'Tug-of-war', 'Lunch', 'Sack race', 'Water balloons', 'Awards']], ['CAMP DAY', ['Swimming', 'Crafts', 'Lunch', 'Hiking', 'Archery', 'Campfire songs']],
    ['MUSEUM TRIP', ['Dinosaur hall', 'Space show', 'Lunch', 'Bug zoo', 'Robot lab', 'Gift shop']], ['SCIENCE FAIR', ['Set up', 'Judging', 'Lunch', 'Robot demo', 'Rocket launch', 'Prizes']]];
  function scheduleKind(g) {
    return d => {
      const form = R(0, d < 2 ? 1 : 3), n = who();
      if (form === 3) {
        const C = pick([['eats breakfast', [7, 30, 'a.m.']], ['eats dinner', [6, 15, 'p.m.']], ['gets out of school', [3, 10, 'p.m.']], ['goes to bed', [8, 30, 'p.m.']], ['eats lunch at school', [12, 5, 'p.m.']]]);
        const [h, m, ap] = C[1], other = ap === 'a.m.' ? 'p.m.' : 'a.m.', h2 = (h + 5) % 12 || 12, h3 = (h + 8) % 12 || 12;
        return { topic: 'TIME', text: `${n} ${C[0]}. Which time makes the most sense?`, ...txt(`${tm(h, m)} ${ap}`, [`${tm(h, m)} ${other}`, `${tm(h2, m)} a.m.`, `${tm(h2, m)} p.m.`, `${tm(h3, m)} a.m.`, `${tm(h3, m)} p.m.`]),
          steps: ['a.m. runs from midnight to noon. p.m. runs from noon to midnight.', `Someone who ${C[0]} does it at about ${tm(h, m)} ${ap}`] };
      }
      const [title, acts] = pick(PROGRAMS), k = 5, starts = [];
      let t0 = R(16, 20) * 30; // minutes after midnight, 8:00 to 10:00
      for (let i = 0; i < k + 1; i++) { starts.push(t0); t0 += R(d < 3 ? 4 : 5, d < 3 ? 12 : 17) * 5; }
      const show = t => tm(Math.floor(t / 60) % 12 || 12, t % 60), A = acts.slice(0, k);
      const fig = tableFig([[title, 'START'], ...A.map((s, i) => [s, show(starts[i])]), ['Done', show(starts[k])]], [100, 40], { align: ['left', 'right'] });
      if (form === 0) {
        const i = R(0, k - 1), dur = starts[i + 1] - starts[i], naive = (Math.floor(starts[i + 1] / 60) % 12 || 12) * 100 + starts[i + 1] % 60 - ((Math.floor(starts[i] / 60) % 12 || 12) * 100 + starts[i] % 60);
        return { topic: 'TIME', ...fig, text: `${A[i]} lasts until the next thing starts. How long is it?`, ...nums(dur, [naive > 0 ? naive : dur + 15, dur + 5, dur - 5, dur + 10], v => v >= 60 && g > 3 ? `${Math.floor(v / 60)} hr ${v % 60} min` : `${v} minutes`, 5),
          steps: [`${A[i]} starts at ${show(starts[i])}; ${i + 1 < k ? A[i + 1] : 'the day ends'} at ${show(starts[i + 1])}.`, `From ${show(starts[i])} to ${show(starts[i + 1])} is ${dur} minutes.`] };
      }
      if (form === 1) {
        const i = R(1, k - 1), arrive = starts[i - 1] + R(1, (starts[i] - starts[i - 1]) / 5 - 1) * 5;
        return { topic: 'TIME', ...fig, text: `${n} gets there at ${show(arrive)}. What is the next thing to start?`, ...txt(A[i], A.filter((s, j) => j !== i)),
          steps: [`${show(arrive)} is after ${show(starts[i - 1])} and before ${show(starts[i])}.`, `So the next thing to start is ${A[i]}.`] };
      }
      const durs = range(k).map(i => starts[i + 1] - starts[i]), mx2 = Math.max(...durs);
      if (durs.filter(v => v === mx2).length > 1) { const i = durs.indexOf(mx2); return { topic: 'TIME', ...fig, text: `How long does ${A[i]} last?`, ...nums(mx2, [mx2 + 5, mx2 - 5, mx2 + 10], v => `${v} minutes`, 5), steps: [`${show(starts[i])} to ${show(starts[i + 1])}: ${mx2} minutes.`] }; }
      const best = durs.indexOf(mx2);
      return { topic: 'TIME', ...fig, text: 'Which part of the day lasts the longest?', ...txt(A[best], A.filter((s, j) => j !== best)),
        steps: [`Find each length: ${A.map((s, i) => `${durs[i]}`).join(', ')} minutes.`, `The longest is ${A[best]}: ${mx2} minutes.`] };
    };
  }

  // ---- Temperature: reading thermometers, changes, and sensible temperatures.
  function thermoFig(lo, hi, step, lab, val, unit) {
    return { size: [80, 88], fig: (c, w, h) => {
      const tx = 40, top = 6, bot = 68, Y = v => Math.round(bot - (v - lo) / (hi - lo) * (bot - top));
      F.box(c, tx - 3, top - 2, 7, bot - top + 6, '#1a2040'); frame(c, tx - 4, top - 3, 9, bot - top + 7, SOFT);
      F.disc(c, tx, bot + 10, 6, RED); F.circle(c, tx, bot + 10, 6, SOFT);
      F.box(c, tx - 1, Y(val), 3, bot + 8 - Y(val), RED);
      for (let v = lo; v <= hi; v += step) { const y = Y(v), L = (v - lo) % lab === 0 ? 5 : 2; hl(c, tx + 6, y, L, INK); if ((v - lo) % lab === 0) lbl(c, v, tx + 13, y + 1, SOFT, 'left'); }
      lbl(c, unit, tx - 10, top + 3, HOT, 'right');
    } };
  }
  const TEMPS_F = [['a snowy day', 25, [75, 100, 60]], ['a good day to swim outside', 90, [30, 10, 45]], ['inside a classroom', 70, [20, 110, 0]], ['a cup of hot cocoa', 150, [40, 70, 15]], ['a cool fall morning', 50, [5, 100, 130]]];
  const TEMPS_C = [['a snowy day', -3, [25, 40, 60]], ['a hot summer day', 33, [3, 90, -10]], ['inside a classroom', 21, [70, -5, 45]], ['boiling water', 100, [50, 212, 0]], ['ice in a freezer', -18, [18, 30, 50]]];
  function temperatureKind(g) {
    return d => {
      const form = R(0, d < 2 ? 1 : 3), cel = g >= 4 && rand() < .5, unit = cel ? '°C' : '°F';
      if (form === 0) {
        const step = d < 2 ? 2 : pick([2, 5]), lo = cel ? (g === 5 && d >= 3 ? -20 : 0) : pick([0, 20, 40]), hi = lo + (step === 2 ? 40 : 50);
        const val = lo + R(1, (hi - lo) / step - 1) * step;
        return { topic: 'TEMPERATURE', text: 'What temperature does the thermometer show?', ...thermoFig(lo, hi, step, 10, val, unit),
          ...numsSigned(val, [val + step, val - step, val + 10, val - 10, val + 1], v => v + unit),
          steps: [`Each small mark is ${step} degrees; the numbers go up by 10.`, `The red line stops at ${val}${unit}.`] };
      }
      if (form === 1) {
        const neg = g === 5 && d >= 3 && rand() < .6, a = neg ? -R(2, 12) : R(cel ? 2 : 30, cel ? 20 : 70), rise = R(5, 30), b = a + rise, up = rand() < .6;
        const [x, y] = up ? [a, b] : [b, a];
        return { topic: 'TEMPERATURE', text: up ? `It was ${x}${unit} in the morning and ${y}${unit} in the afternoon. How many degrees warmer did it get?` : `It was ${x}${unit} at noon and ${y}${unit} at night. How many degrees colder did it get?`,
          ...nums(rise, [Math.abs(Math.abs(a) - Math.abs(b)), Math.abs(a) + Math.abs(b) + (a < 0 ? 10 : 0), rise + 10, rise - 1].filter(v => v > 0 && v !== rise), v => v + '°'),
          steps: a < 0 && b > 0 ? [`From ${a}${unit} to 0 is ${-a} degrees.`, `From 0 to ${b}${unit} is ${b} more.`, `${-a} + ${b} = ${rise} degrees`] : [`Subtract: ${Math.max(x, y)} - ${Math.min(x, y)}`, `= ${rise} degrees`] };
      }
      if (form === 2) {
        const [what, right, wrongs] = pick(cel ? TEMPS_C : TEMPS_F);
        return { topic: 'TEMPERATURE', text: `Which is the best estimate of the temperature of ${what}?`, ...txt(right + unit, wrongs.map(v => v + unit)),
          steps: cel ? ['Water freezes at 0°C and boils at 100°C.', 'A warm room is about 20°C.', `So ${what}: about ${right}°C.`] : ['Water freezes at 32°F. A warm room is about 70°F.', `So ${what}: about ${right}°F.`] };
      }
      const a = g === 5 ? R(-5, 15) : cel ? R(12, 30) : R(40, 80), drop = R(5, g === 5 ? 20 : cel ? 10 : 25), b = a - drop;
      return { topic: 'TEMPERATURE', text: `It was ${a}${unit} at sunset. By midnight the temperature had dropped ${drop} degrees. What was the temperature at midnight?`,
        ...numsSigned(b, [a + drop, b - 10, b + 10, g === 5 ? -b : b + 1], v => v + unit),
        steps: a > 0 && b < 0 ? ['Dropped means count down.', `From ${a}${unit} down to 0 is ${a} degrees.`, `${drop - a} more below 0 is ${b}${unit}.`] : ['Dropped means subtract.', `${a} - ${drop} = ${b}${unit}`] };
    };
  }
  // Numbers that may be negative, smallest first.
  function numsSigned(ans, wrongs, fmt) {
    const vals = [ans];
    for (const w of [...wrongs, ans + 1, ans - 1, ans + 2, ans - 2, ans + 5]) if (vals.length < 4 && Number.isFinite(w) && !vals.some(u => u === w || fmt(u) === fmt(w))) vals.push(w);
    vals.sort((a, b) => a - b);
    return { choices: vals.map(fmt), answer: vals.indexOf(ans) };
  }

  // ---- Roman numerals.
  const ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  const toRoman = n => { let s = ''; for (const [v, r] of ROMAN) while (n >= v) { s += r; n -= v; } return s; };
  const RV = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const addAll = s => sum(s.split('').map(ch => RV[ch]));
  const romanParts = n => { const out = []; for (const [v, r] of ROMAN) while (n >= v) { out.push([r, v]); n -= v; } return out; };
  function romanKind(g) {
    return d => {
      const hi = g === 3 ? (d < 3 ? 20 : 39) : g === 4 ? (d < 3 ? 50 : 100) : (d < 3 ? 400 : 2030), n = R(g === 5 && d >= 2 ? 40 : 4, hi), r = toRoman(n), form = R(0, 1);
      const parts = romanParts(n), why = [`${parts.map(p => p[0]).join(' + ')} = ${parts.map(p => p[1]).join(' + ')}`, 'A smaller numeral before a bigger one is taken away: IV = 4, IX = 9, XL = 40.'];
      if (form === 0) return { topic: 'ROMAN NUMERALS', text: `What number does the Roman numeral ${r} stand for?`, ...nums(n, [addAll(r), n + 10, n - 10, n + 1, n - 1, n + 100].filter(v => v > 0)),
        steps: [...why.slice(0, d < 2 ? 1 : 2), `${r} = ${n}`] };
      const wr = [r.replace('IV', 'IIII').replace('IX', 'VIIII').replace('XL', 'XXXX').replace('XC', 'LXXXX'), r.replace('IV', 'VI').replace('IX', 'XI').replace('XL', 'LX').replace('XC', 'CX'), toRoman(n + 1), toRoman(n - 1), toRoman(n + 10), toRoman(n + 5)];
      return { topic: 'ROMAN NUMERALS', text: `Which Roman numeral means ${n}?`, ...txt(r, wr.filter(s => s && s !== r)), steps: [`Break ${n} into parts: ${parts.map(p => p[1]).join(' + ')}.`, `${parts.map(p => p[0]).join('')} = ${r}`] };
    };
  }

  // ---- Probability: spinners and bags of marbles.
  const COLORS = [['red', RED], ['blue', BLU], ['green', GRN], ['yellow', HOT], ['purple', '#a060e0']];
  function spinnerFig(secs) {
    return { size: [72, 64], fig: (c, w, h) => {
      const cx = Math.floor(w / 2), cy = Math.floor(h / 2) + 1, r = 27, n = secs.length;
      secs.forEach((col, i) => { const a0 = Math.PI / 2 - i * 2 * Math.PI / n, a1 = Math.PI / 2 - (i + 1) * 2 * Math.PI / n, pts = [[cx, cy]]; for (let k = 0; k <= 16; k++) { const a = a0 + (a1 - a0) * k / 16; pts.push([cx + Math.cos(a) * r, cy - Math.sin(a) * r]); } F.fillPoly(c, pts, COLORS[col][1]); });
      for (let i = 0; i < n; i++) { const a = Math.PI / 2 - i * 2 * Math.PI / n; F.line(c, cx, cy, cx + Math.cos(a) * r, cy - Math.sin(a) * r, '#101830'); }
      F.circle(c, cx, cy, r, INK); thick(c, cx, cy, cx + 10, cy - 14, INK); F.box(c, cx - 1, cy - 1, 3, 3, INK);
    } };
  }
  function marblesFig(counts) {
    const all = []; counts.forEach((k, i) => { for (let j = 0; j < k; j++) all.push(i); }); shuffle(all);
    const per = 6, rows = Math.ceil(all.length / per);
    return { size: [80, Math.max(44, rows * 9 + 18)], fig: (c, w, h) => {
      const x0 = Math.round((w - per * 9) / 2), y0 = h - 6 - rows * 9;
      vl(c, x0 - 4, 8, h - 12, SOFT); vl(c, x0 + per * 9 + 2, 8, h - 12, SOFT); hl(c, x0 - 4, h - 5, per * 9 + 7, SOFT);
      all.forEach((ci, k) => F.disc(c, x0 + (k % per) * 9 + 3, y0 + Math.floor(k / per) * 9 + 4, 3, COLORS[ci][1]));
    } };
  }
  const LIKELY = ['certain', 'likely', 'unlikely', 'impossible'];
  // Distinct counts, one per color, adding up to n.
  function distinctCounts(n, k) {
    for (let t = 0; t < 60; t++) { const c = Array(k).fill(1); for (let i = k; i < n; i++) c[R(0, k - 1)]++; if (new Set(c).size === k) return c; }
    const c = range(k).map(i => i + 1); c[k - 1] += n - k * (k + 1) / 2; return shuffle(c);
  }
  function probabilityKind(g) {
    return d => {
      const forms = g === 3 ? [0, 1] : g === 4 ? [0, 1, 2] : [0, 2, 3, 3, 4];
      const form = pick(forms.slice(0, d < 2 ? 2 : forms.length));
      const marbles = rand() < .45, n = marbles ? R(10, 15) : pick([6, 8, 8]), maxK = n >= 10 ? 4 : 3, kinds = shuffle(range(5)).slice(0, R(2, maxK));
      const counts = distinctCounts(n, kinds.length);
      if (form === 2 && rand() < .3) counts[1] = counts[0];
      const total = sum(counts), all = [].concat(...counts.map((v, i) => Array(v).fill(kinds[i])));
      const fig = marbles ? { size: [80, Math.max(44, Math.ceil(total / 6) * 9 + 18)], fig: marblesByColor(shuffle(all.slice())) } : spinnerFig(rand() < .5 ? all : shuffle(all.slice()));
      const colorOf = i => COLORS[kinds[i]][0], thing = marbles ? 'You pick a marble from the jar without looking.' : 'You spin the spinner.', event = marbles ? 'picking' : 'landing on';
      const absent = COLORS.filter((x, i) => !kinds.includes(i)).map(x => x[0]), base = { topic: 'PROBABILITY', ...fig };
      if (form === 0) {
        const most = kinds.length < 4 || rand() < .6, k = counts.indexOf(most ? Math.max(...counts) : Math.min(...counts));
        return { ...base, text: most ? `${thing} Which color are you most likely to get?` : `${thing} Of the colors you can get, which is least likely?`, ...txt(colorOf(k), [...kinds.map((x, i) => colorOf(i)).filter((x, i) => i !== k), ...(most ? absent : [])]),
          steps: [kinds.map((x, i) => `${colorOf(i)}: ${counts[i]}`).join(', '), `${colorOf(k)} has the ${most ? 'most' : 'fewest'} ${marbles ? 'marbles' : 'spaces'}, so it is ${most ? 'most' : 'least'} likely.`] };
      }
      if (form === 1) {
        const opts = [];
        kinds.forEach((x, i) => { if (counts[i] * 2 > total) opts.push([colorOf(i), 1, counts[i]]); else if (counts[i] * 2 < total) opts.push([colorOf(i), 2, counts[i]]); });
        opts.push([absent[0], 3, 0], [absent[0], 3, 0]);
        if (rand() < .25) opts.push([kinds.map((x, i) => colorOf(i)).join(' or '), 0, total]);
        const [what, k, cnt] = pick(opts);
        return { ...base, text: `${thing} How likely is ${event} ${what}?`, choices: LIKELY.slice(), answer: k,
          steps: ['Certain: it has to happen. Impossible: it can never happen.', 'Likely: more than half the time. Unlikely: less than half.', `${what}: ${cnt} of ${total}, so it is ${LIKELY[k]}.`] };
      }
      if (form === 2) {
        const ci = colorOf(0), cj = colorOf(1), C = ['more likely', 'less likely', 'equally likely', 'impossible'], k = counts[0] > counts[1] ? 0 : counts[0] < counts[1] ? 1 : 2;
        return { ...base, text: `${thing} Compared with ${event} ${cj}, how likely is ${event} ${ci}?`, choices: C, answer: k,
          steps: [`${ci}: ${counts[0]}. ${cj}: ${counts[1]}.`, k === 2 ? 'The same number of each: equally likely.' : `${counts[0]} is ${k === 0 ? 'more' : 'fewer'} than ${counts[1]}, so ${ci} is ${C[k]}.`] };
      }
      const k = R(0, kinds.length - 1), p = [counts[k], total];
      if (form === 3) return { ...base, text: `${thing} What is the probability of ${event} ${colorOf(k)}?`, ...fracs(red(...p), [[counts[k], total - counts[k]], [1, counts[k]], [counts[k], total + 1], [total - counts[k], total], [1, kinds.length]].filter(q => q[1] > 0 && q[0] > 0), q => rf(q[0], q[1])),
        steps: [`There are ${total} ${marbles ? 'marbles' : 'equal spaces'}, and ${counts[k]} ${counts[k] === 1 ? 'is' : 'are'} ${colorOf(k)}.`, `Probability = ${fr(...p)}${rf(...p) !== fr(...p) ? ` = ${rf(...p)}` : ''}`] };
      const times = total * R(2, 6), exp = times * counts[k] / total;
      return { ...base, text: `${thing} You do it ${times} times${marbles ? ', putting the marble back each time' : ''}. About how many times will you get ${colorOf(k)}?`,
        ...nums(exp, [counts[k], times - exp, exp + times / total, Math.round(times / kinds.length)].filter(v => v !== exp && v > 0)),
        steps: [`${colorOf(k)} is ${counts[k]} out of ${total}.`, `${fr(counts[k], total)} of ${times}: ${times} ÷ ${total} × ${counts[k]} = ${exp}`] };
    };
  }
  function marblesByColor(all) {
    const per = 6, rows = Math.ceil(all.length / per);
    return (c, w, h) => {
      const x0 = Math.round((w - per * 9) / 2), y0 = h - 6 - rows * 9;
      vl(c, x0 - 4, 8, h - 12, SOFT); vl(c, x0 + per * 9 + 2, 8, h - 12, SOFT); hl(c, x0 - 4, h - 5, per * 9 + 7, SOFT);
      all.forEach((ci, k) => F.disc(c, x0 + (k % per) * 9 + 3, y0 + Math.floor(k / per) * 9 + 4, 3, COLORS[ci][1]));
    };
  }

  // ---- Data: tally charts, frequency tables, stem-and-leaf plots, line graphs, mean, median, mode, range.
  function tallyMarks(c, x, y, n) { for (let k = 0; k < n; k++) { const gx = x + Math.floor(k / 5) * 17, i = k % 5; if (i < 4) vl(c, gx + i * 3, y, 9, INK); else F.line(c, gx - 2, y + 7, gx + 11, y + 1, HOT); } }
  function tallyFig(cats, vals) {
    return { size: [168, cats.length * 13 + 4], fig: (c, w, h) => {
      const lw = Math.max(...cats.map(tw)) + 8;
      cats.forEach((s, i) => { const y = 3 + i * 13; lbl(c, s, lw - 4, y + 5, INK, 'right'); tallyMarks(c, lw + 5, y, vals[i]); hl(c, 2, y + 11, w - 4, GRID); });
      vl(c, lw, 1, cats.length * 13, DIM);
    } };
  }
  // 3rd grade (IXL data and graphs): tally charts.
  const tallyKind = d => {
    const [what, all] = pick(SURVEYS), cats = shuffle(all.slice()).slice(0, 4);
    let vals; for (let t = 0; t < 30; t++) { vals = cats.map(() => R(2, d < 2 ? 12 : 18)); if (new Set(vals).size === 4) break; }
    const g = graphQ(cats, vals, R(0, d < 2 ? 1 : 2), { one: c => `How many kids chose ${c}?`, more: (a, b) => `How many more kids chose ${a} than ${b}?`, both: (a, b) => `How many kids chose ${a} or ${b}?` },
      v => [v - 5, v + 5, v + 1, Math.floor(v / 5)], 'Each mark is 1 vote. A group of 5 has a line across it.');
    return { topic: 'TALLY CHARTS', ...tallyFig(cats, vals), ...g, text: `The tally chart shows the kids' ${what}. ${g.text}` };
  };
  const FREQ = [['PETS', 'pets', 'kids', 'have'], ['BOOKS', 'books', 'kids', 'read'], ['GOALS', 'goals', 'games', 'had'], ['SIBLINGS', 'brothers and sisters', 'kids', 'have']];
  function freqKind(g) {
    return d => {
      const [head, what, who2, verb] = pick(FREQ), counts = range(5).map(() => R(1, 9)), tot = sum(counts), form = R(0, g === 5 ? 3 : 2);
      const fig = tableFig([[head, who2.toUpperCase()], ...counts.map((c2, v) => [String(v), String(c2)])], [56, 56]);
      const v = R(1, 3), atLeast = sum(counts.slice(v));
      const ask = who2 === 'games' ? `games had` : `${who2} ${verb}`;
      if (form === 0) return { topic: 'DATA', ...fig, text: `The table shows how many ${what} some ${who2} ${verb}. How many ${ask} exactly ${v} ${what}?`, ...nums(counts[v], [v, counts[v] + 1, tot, counts[v - 1]].filter(x => x !== counts[v])),
        steps: [`Find ${v} in the first column.`, `The number next to it is ${counts[v]}.`] };
      if (form === 1) return { topic: 'DATA', ...fig, text: `The table shows how many ${what} some ${who2} ${verb}. How many ${ask} ${v} or more ${what}?`, ...nums(atLeast, [counts[v], atLeast - counts[v], tot - atLeast, atLeast + counts[v - 1]].filter(x => x !== atLeast)),
        steps: [`${v} or more means ${range(5 - v).map(i => v + i).join(', ')}.`, `${counts.slice(v).join(' + ')} = ${atLeast}`] };
      if (form === 2) return { topic: 'DATA', ...fig, text: `The table shows how many ${what} some ${who2} ${verb}. How many ${who2} are in the table?`, ...nums(tot, [10, 5, sum(counts.map((c2, i) => c2 * i)), tot + 1, tot - 1].filter(x => x !== tot)),
        steps: [`Each number in the right column counts ${who2}.`, `${counts.join(' + ')} = ${tot}`] };
      const all = sum(counts.map((c2, i) => c2 * i));
      return { topic: 'DATA', ...fig, text: `The table shows how many ${what} some ${who2} ${verb}. How many ${what} is that in all?`, ...nums(all, [tot, 10, all + counts[1], all - counts[4]].filter(x => x !== all)),
        steps: [`Multiply each row: ${counts.map((c2, i) => `${i} × ${c2}`).join(' + ')}`, `= ${all}`] };
    };
  }
  const STEMS = [['points scored in some games', 'points'], ['minutes some kids read', 'minutes'], ['heights of some plants, in inches', 'inches'], ['scores on a spelling bee', 'points']];
  function stemLeafKind(g) {
    return d => {
      const [what] = pick(STEMS), s0 = R(1, 4), ns = R(3, 4), data = [];
      for (let s = s0; s < s0 + ns; s++) for (let k = R(2, 5); k > 0; k--) data.push(s * 10 + R(0, 9));
      data.sort((a, b) => a - b);
      const rows = range(ns).map(i => [String(s0 + i), data.filter(v => Math.floor(v / 10) === s0 + i).map(v => v % 10).join(' ')]);
      const fig = tableFig([['STEM', 'LEAF'], ...rows], [36, 86], { align: ['center', 'left'] }), mx2 = data[data.length - 1], mn = data[0], n = data.length;
      const forms = g === 4 ? [0, 1, 2, 3] : [0, 2, 3, 4, 5], form = pick(forms.slice(0, d < 2 ? 2 : forms.length)), intro = `The stem-and-leaf plot shows the ${what}.`, key = `${s0} | ${data[0] % 10} means ${data[0]}.`;
      if (form === 0) { const most = rand() < .5, v = most ? mx2 : mn; return { topic: 'DATA', ...fig, text: `${intro} What is the ${most ? 'greatest' : 'least'} value?`, ...nums(v, [most ? data[n - 2] : data[1], v % 10, Math.floor(v / 10) * 10, most ? 9 : mn + 10].filter(x => x !== v)),
        steps: [key, `The ${most ? 'last' : 'first'} row's ${most ? 'last' : 'first'} leaf: ${v}.`] }; }
      if (form === 1) return { topic: 'DATA', ...fig, text: `${intro} How many values are in the plot?`, ...nums(n, [ns, n + 1, n - 1, ns * 10]), steps: ['Each leaf is one value.', `Count the leaves: ${rows.map(r => r[1].split(' ').length).join(' + ')} = ${n}`] };
      if (form === 2) { const T = (s0 + R(1, ns - 1)) * 10, c2 = data.filter(v => v >= T).length; return { topic: 'DATA', ...fig, text: `${intro} How many values are ${T} or more?`, ...nums(c2, [data.filter(v => v > T + 9).length, n - c2, c2 + 1, c2 - 1].filter(x => x !== c2 && x >= 0)),
        steps: [key, `${T} or more: every leaf in the rows with stem ${T / 10} or more.`, `That's ${c2}.`] }; }
      if (form === 3) return { topic: 'DATA', ...fig, text: `${intro} What is the range of the data?`, ...nums(mx2 - mn, [mx2, mx2 % 10 - mn % 10 >= 0 ? mx2 % 10 - mn % 10 : mx2 + mn, mx2 + mn, mx2 - mn + 10].filter(x => x !== mx2 - mn && x >= 0)),
        steps: ['Range = greatest - least', `${mx2} - ${mn} = ${mx2 - mn}`] };
      if (form === 4 && n % 2 === 1) return { topic: 'DATA', ...fig, text: `${intro} What is the median?`, ...nums(data[(n - 1) / 2], [data[(n - 1) / 2 + 1], data[(n - 1) / 2 - 1], Math.round(sum(data) / n), mx2 - mn].filter(x => x !== data[(n - 1) / 2])),
        steps: ['The plot is already in order.', `The middle value of ${n} is number ${(n + 1) / 2}: ${data[(n - 1) / 2]}.`] };
      const counts = {}; data.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
      const top = Math.max(...Object.values(counts)), modes = Object.keys(counts).filter(k => counts[k] === top).map(Number);
      if (top < 2 || modes.length > 1) return { topic: 'DATA', ...fig, text: `${intro} What is the range of the data?`, ...nums(mx2 - mn, [mx2, mx2 + mn, mx2 - mn + 10].filter(x => x !== mx2 - mn)), steps: ['Range = greatest - least', `${mx2} - ${mn} = ${mx2 - mn}`] };
      return { topic: 'DATA', ...fig, text: `${intro} What is the mode?`, ...nums(modes[0], [mx2, mn, data[Math.floor(n / 2)], modes[0] % 10].filter(x => x !== modes[0])), steps: ['The mode is the value that shows up most often.', `${modes[0]} appears ${top} times.`] };
    };
  }
  const STAT_CTX = ['spelling test scores', 'laps run in gym', 'bowling pins knocked down', 'points scored in a video game', 'minutes spent reading'];
  function statsKind(g) {
    return d => {
      const ask = pick(g === 4 ? ['mode', 'median', 'range'] : ['mode', 'median', 'range', 'mean', 'mean']), n = pick([5, 5, 7]), what = pick(STAT_CTX), name = who();
      let data = [];
      if (ask === 'mean') {
        const mean = R(6, 20);
        for (let t = 0; t < 40; t++) { data = range(n - 1).map(() => mean + R(-5, 5)); const last = n * mean - sum(data); if (last >= 1 && last <= 30 && !data.includes(last)) { data.push(last); break; } data = []; }
        if (!data.length) data = [mean - 2, mean - 1, mean, mean + 1, mean + 2];
      } else {
        const pool = shuffle(range(25).map(i => i + 3)); data = pool.slice(0, ask === 'mode' ? n - 1 : n);
        if (ask === 'mode') data.push(data[R(0, n - 2)]);
        shuffle(data);
      }
      const N2 = data.length, srt = data.slice().sort((a, b) => a - b), mean = sum(data) / N2, med = srt[(N2 - 1) / 2], rng = srt[N2 - 1] - srt[0];
      const list = data.join(', '), text = `${name}'s ${what}: ${list}. What is the ${ask}?`;
      if (ask === 'range') return { topic: 'STATISTICS', text, ...nums(rng, [srt[N2 - 1], srt[N2 - 1] + srt[0], Math.abs(data[0] - data[N2 - 1]), med].filter(x => x !== rng)), steps: ['Range = greatest - least', `${srt[N2 - 1]} - ${srt[0]} = ${rng}`] };
      if (ask === 'median') {
        if (data[(N2 - 1) / 2] === med) { const i = data.indexOf(srt[0]); [data[(N2 - 1) / 2], data[i]] = [data[i], data[(N2 - 1) / 2]]; }
        return { topic: 'STATISTICS', text: `${name}'s ${what}: ${data.join(', ')}. What is the median?`, ...nums(med, [data[(N2 - 1) / 2], Math.round(mean), rng, srt[(N2 - 1) / 2 + 1]].filter(x => x !== med)),
          steps: ['Put them in order first:', srt.join(', '), `The middle one is ${med}.`] };
      }
      if (ask === 'mode') { const m = data.find((v, i) => data.indexOf(v) !== i); return { topic: 'STATISTICS', text, ...nums(m, [srt[N2 - 1], med === m ? srt[0] : med, rng, srt[0]].filter(x => x !== m)), steps: ['The mode is the number that shows up most.', `${m} shows up twice.`] }; }
      return { topic: 'STATISTICS', text, ...nums(mean, [med === mean ? mean + 1 : med, sum(data), Number.isInteger(sum(data) / (N2 - 1)) ? sum(data) / (N2 - 1) : mean + 2, rng].filter(x => x !== mean)),
        steps: [`Add them: ${data.join(' + ')} = ${sum(data)}`, `Divide by how many there are: ${sum(data)} ÷ ${N2} = ${mean}`] };
    };
  }
  const DAYNAME = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday' };
  function lineGraphKind(g) {
    return d => {
      const C = pick([['the height of a bean plant each week, in centimeters', ['WK1', 'WK2', 'WK3', 'WK4', 'WK5'], true], ['the tickets sold each day', ['MON', 'TUE', 'WED', 'THU', 'FRI'], false], ['the books returned to the library each day', ['MON', 'TUE', 'WED', 'THU', 'FRI'], false]]);
      const [what, labs, grow] = C, step = pick([2, 5, 10]), top = step * 8;
      let vals; for (let t = 0; t < 40; t++) { vals = labs.map(() => R(1, 8) * step); if (grow) vals.sort((a, b) => a - b); if (new Set(vals).size === 5) break; }
      const nm = s => DAYNAME[s] || `week ${s.slice(2)}`;
      const fig = { size: [168, 76], fig: (c, w, h) => {
        const x0 = 22, x1 = w - 10, yb = h - 13, yt = 5, Y = v => Math.round(yb - v / top * (yb - yt)), X = i => Math.round(x0 + 8 + i * (x1 - x0 - 16) / 4);
        for (let v = 0; v <= top; v += step) { hl(c, x0, Y(v), x1 - x0, GRID); if (v % (2 * step) === 0) lbl(c, v, x0 - 3, Y(v) + 1, SOFT, 'right'); }
        vl(c, x0, yt, yb - yt + 1, INK); hl(c, x0, yb, x1 - x0, INK);
        vals.forEach((v, i) => { if (i) F.line(c, X(i - 1), Y(vals[i - 1]), X(i), Y(v), HOT); lbl(c, labs[i], X(i), yb + 7, SOFT); });
        vals.forEach((v, i) => dot3(c, X(i), Y(v), INK));
      } };
      const form = R(0, d < 2 ? 1 : 3), intro = `The line graph shows ${what}.`;
      if (form === 0) { const i = R(0, 4); return { topic: 'LINE GRAPHS', ...fig, text: `${intro} What was the value for ${nm(labs[i])}?`, ...nums(vals[i], [vals[i] + step, vals[i] - step, vals[i] / step, vals[i] + step / 2].filter(x => x > 0 && Number.isInteger(x))), steps: [`Find ${labs[i]} along the bottom.`, `Go up to the dot and across: ${vals[i]}.`] }; }
      if (form === 1) { let i = R(0, 3), j = R(i + 1, 4); const dv = Math.abs(vals[j] - vals[i]); return { topic: 'LINE GRAPHS', ...fig, text: `${intro} How much did it change from ${nm(labs[i])} to ${nm(labs[j])}?`, ...nums(dv, [vals[i] + vals[j], vals[j], dv + step, dv / step].filter(x => x > 0 && x !== dv && Number.isInteger(x))), steps: [`${labs[i]}: ${vals[i]}. ${labs[j]}: ${vals[j]}.`, `${Math.max(vals[i], vals[j])} - ${Math.min(vals[i], vals[j])} = ${dv}`] }; }
      if (form === 2) {
        const ups = range(4).map(i => vals[i + 1] - vals[i]), best = Math.max(...ups);
        if (best > 0 && ups.filter(u => u === best).length === 1) { const i = ups.indexOf(best), s = k => `${labs[k]} to ${labs[k + 1]}`; return { topic: 'LINE GRAPHS', ...fig, text: `${intro} Between which two dots did it go up the most?`, ...txt(s(i), range(4).filter(k => k !== i).map(s)),
          steps: ['The steepest climb is the biggest increase.', `${s(i)}: up ${best}.`] }; }
      }
      const most = rand() < .5, v = most ? Math.max(...vals) : Math.min(...vals), i = vals.indexOf(v);
      return { topic: 'LINE GRAPHS', ...fig, text: `${intro} When was it ${most ? 'highest' : 'lowest'}?`, ...txt(nm(labs[i]), labs.filter((x, k) => k !== i).map(nm)), steps: [`Look for the ${most ? 'highest' : 'lowest'} dot.`, `It is at ${labs[i]}: ${v}.`] };
    };
  }

  // ---- 3D shapes: names, faces, edges and vertices, and nets.
  const SOLIDS = { cube: [6, 12, 8], 'rectangular prism': [6, 12, 8], 'triangular prism': [5, 9, 6], 'square pyramid': [5, 8, 5], 'triangular pyramid': [4, 6, 4], cylinder: null, cone: null, sphere: null };
  const SFACE = '#4670d0', SIDE = '#2c4a9c', TOPF = '#7a9cf0';
  function drawSolid(c, w, h, kind) {
    const cx = Math.round(w / 2), cy = Math.round(h / 2), dash = (a, b) => F.line(c, ...a, ...b, SOFT, 1), edge = (a, b) => F.line(c, ...a, ...b, INK);
    if (kind === 'cube' || kind === 'rectangular prism') {
      const L = kind === 'cube' ? 1 : 2, s = kind === 'cube' ? 26 : 22, ex = Math.round(s * .55), ey = Math.round(s * .45), x0 = Math.round(cx - (L * s + ex) / 2), yb = Math.round(cy + (s + ey) / 2);
      prism(c, x0, yb, L, 1, 1, s);
      const B = [x0 + ex, yb - ey]; dash(B, [x0, yb]); dash(B, [x0 + L * s + ex, yb - ey]); dash(B, [x0 + ex, yb - ey - s]);
    } else if (kind === 'triangular prism') {
      const Lp = [cx - 26, cy + 16], Rp = [cx + 6, cy + 16], A = [cx - 10, cy - 12], dv = [20, -10], P = p => [p[0] + dv[0], p[1] + dv[1]];
      F.fillPoly(c, [A, Rp, P(Rp), P(A)], SIDE); F.fillPoly(c, [Lp, Rp, A], SFACE);
      dash(Lp, P(Lp)); dash(P(Lp), P(A)); dash(P(Lp), P(Rp));
      edge(Lp, Rp); edge(Rp, A); edge(A, Lp); edge(A, P(A)); edge(P(A), P(Rp)); edge(P(Rp), Rp);
    } else if (kind === 'square pyramid') {
      const B0 = [cx - 24, cy + 18], B1 = [cx + 12, cy + 18], dv = [14, -8], B2 = [B1[0] + dv[0], B1[1] + dv[1]], B3 = [B0[0] + dv[0], B0[1] + dv[1]], T = [cx - 5, cy - 20];
      F.fillPoly(c, [B1, B2, T], SIDE); F.fillPoly(c, [B0, B1, T], SFACE);
      dash(B0, B3); dash(B3, B2); dash(B3, T);
      edge(B0, B1); edge(B1, B2); edge(B2, T); edge(T, B0); edge(T, B1);
    } else if (kind === 'triangular pyramid') {
      const T0 = [cx - 22, cy + 18], T1 = [cx + 20, cy + 18], T2 = [cx + 6, cy + 6], T = [cx - 2, cy - 22];
      F.fillPoly(c, [T0, T1, T], SFACE); dash(T0, T2); dash(T1, T2); dash(T2, T); edge(T0, T1); edge(T1, T); edge(T, T0);
    } else if (kind === 'cylinder') {
      const rx = 18, ry = 6, yt = cy - 14, yb = cy + 14;
      F.box(c, cx - rx, yt, 2 * rx + 1, yb - yt, SFACE); fillEllipse(c, cx, yb, rx, ry, SFACE); fillEllipse(c, cx, yt, rx, ry, TOPF);
      ellipse(c, cx, yt, rx, ry, INK); ellipse(c, cx, yb, rx, ry, INK, 0, Math.PI); ellipse(c, cx, yb, rx, ry, SOFT, Math.PI, 2 * Math.PI, 1);
      vl(c, cx - rx, yt, yb - yt, INK); vl(c, cx + rx, yt, yb - yt, INK);
    } else if (kind === 'cone') {
      const rx = 19, ry = 6, yb = cy + 16, T = [cx, cy - 22];
      fillEllipse(c, cx, yb, rx, ry, SFACE); F.fillPoly(c, [T, [cx - rx, yb], [cx + rx, yb]], SFACE);
      ellipse(c, cx, yb, rx, ry, INK, 0, Math.PI); ellipse(c, cx, yb, rx, ry, SOFT, Math.PI, 2 * Math.PI, 1); edge(T, [cx - rx, yb]); edge(T, [cx + rx, yb]);
    } else {
      F.disc(c, cx, cy, 21, SFACE); F.disc(c, cx - 6, cy - 7, 6, TOPF); F.circle(c, cx, cy, 21, INK);
      ellipse(c, cx, cy, 21, 6, INK, 0, Math.PI); ellipse(c, cx, cy, 21, 6, SOFT, Math.PI, 2 * Math.PI, 1);
    }
  }
  const NETS = {
    cube: [[[1, 0], [2, 0], [2, 1], [1, 1]], [[0, 1], [1, 1], [1, 2], [0, 2]], [[1, 1], [2, 1], [2, 2], [1, 2]], [[2, 1], [3, 1], [3, 2], [2, 2]], [[3, 1], [4, 1], [4, 2], [3, 2]], [[1, 2], [2, 2], [2, 3], [1, 3]]],
    'rectangular prism': [[[1, 0], [3, 0], [3, 1], [1, 1]], [[0, 1], [1, 1], [1, 2], [0, 2]], [[1, 1], [3, 1], [3, 2], [1, 2]], [[3, 1], [4, 1], [4, 2], [3, 2]], [[4, 1], [6, 1], [6, 2], [4, 2]], [[1, 2], [3, 2], [3, 3], [1, 3]]],
    'triangular prism': [[[0, 0], [1, 0], [1, 2], [0, 2]], [[1, 0], [2, 0], [2, 2], [1, 2]], [[2, 0], [3, 0], [3, 2], [2, 2]], [[1, 0], [2, 0], [1.5, -.87]], [[1, 2], [2, 2], [1.5, 2.87]]],
    'square pyramid': [[[1, 1], [2, 1], [2, 2], [1, 2]], [[1, 1], [2, 1], [1.5, 0]], [[2, 1], [2, 2], [3, 1.5]], [[2, 2], [1, 2], [1.5, 3]], [[1, 2], [1, 1], [0, 1.5]]],
    'triangular pyramid': [[[0, 0], [1, 0], [.5, .87]], [[1, 0], [2, 0], [1.5, .87]], [[.5, .87], [1.5, .87], [1, 1.73]], [[1, 0], [1.5, .87], [.5, .87]]],
  };
  function netFig(kind) {
    const polys = NETS[kind], all = [].concat(...polys);
    return { size: [110, 70], fig: (c, w, h) => {
      const xs = all.map(p => p[0]), ys = all.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), sc = Math.min((w - 10) / (Math.max(...xs) - x0), (h - 8) / (Math.max(...ys) - y0));
      const ox = (w - (Math.max(...xs) - x0) * sc) / 2, oy = (h - (Math.max(...ys) - y0) * sc) / 2, P = p => [Math.round(ox + (p[0] - x0) * sc), Math.round(oy + (p[1] - y0) * sc)];
      polys.forEach((q, i) => shape(c, q.map(P), i % 2 ? FILL2 : FILL));
    } };
  }
  const SOLID_THINGS = [['a soup can', 'cylinder'], ['an ice cream cone', 'cone'], ['a basketball', 'sphere'], ['a cereal box', 'rectangular prism'], ['a number cube', 'cube'], ['a tent', 'triangular prism'], ['a party hat', 'cone'], ['a globe', 'sphere']];
  function solidsKind(g) {
    return d => {
      const names = Object.keys(SOLIDS), polys = names.filter(k => SOLIDS[k]), form = R(0, g === 3 ? (d < 2 ? 1 : 2) : (d < 2 ? 1 : 4));
      const others = k => names.filter(x => x !== k && !(k === 'cube' && x === 'rectangular prism'));
      if (form === 0) { const k = pick(names); return { topic: '3D SHAPES', text: 'What is the name of this solid shape?', size: [90, 64], fig: (c, w, h) => drawSolid(c, w, h, k), ...txt(k, shuffle(others(k))),
        steps: [{ cube: '6 square faces, all the same size: a cube.', 'rectangular prism': '6 rectangle faces: a rectangular prism.', 'triangular prism': 'Two triangle ends joined by rectangles: a triangular prism.', 'square pyramid': 'A square base with triangles meeting at a point: a square pyramid.', 'triangular pyramid': 'A triangle base with triangles meeting at a point: a triangular pyramid.', cylinder: 'Two flat circles joined by a curved side: a cylinder.', cone: 'One flat circle and a point: a cone.', sphere: 'Round all over, like a ball: a sphere.' }[k], `It is a ${k}.`] }; }
      if (form === 1) {
        const k = pick(polys), [f, e, v] = SOLIDS[k], what = pick(g === 3 ? ['faces', 'vertices'] : ['faces', 'edges', 'vertices']), ans = { faces: f, edges: e, vertices: v }[what];
        return { topic: '3D SHAPES', text: `How many ${what} does this ${k} have? (Dashed lines are hidden edges.)`, size: [90, 64], fig: (c, w, h) => drawSolid(c, w, h, k), ...nums(ans, [f, e, v, ans + 1, ans - 1, ans + 2].filter(x => x !== ans)),
          steps: ['Faces are the flat sides. Edges are where two faces meet. Vertices are the corners.', `A ${k} has ${f} faces, ${e} edges and ${v} vertices.`] };
      }
      if (form === 2) { const [thing, k] = pick(SOLID_THINGS); return { topic: '3D SHAPES', text: `Which solid shape is ${thing} most like?`, ...txt(k, shuffle(others(k))), steps: [`${cap(thing.replace(/^an? /, ''))}: ${{ cylinder: 'flat circles on top and bottom', cone: 'a circle and a point', sphere: 'round all over', 'rectangular prism': 'six rectangle faces', cube: 'six equal squares', 'triangular prism': 'triangle ends and rectangle sides' }[k]}.`, `So it is a ${k}.`] }; }
      if (form === 3) { const k = pick(polys), [f, e, v] = SOLIDS[k], same = polys.filter(x => SOLIDS[x].join() === SOLIDS[k].join()); return { topic: '3D SHAPES', text: `Which solid has ${f} faces, ${e} edges and ${v} vertices?`, ...txt(pick(same), shuffle(polys.filter(x => !same.includes(x))).concat(['cylinder', 'sphere'])),
        steps: [polys.map(x => `${x}: ${SOLIDS[x].join(', ')}`).slice(1).join('; '), `${f}, ${e}, ${v} matches a ${k}.`] }; }
      const k = pick(Object.keys(NETS));
      return { topic: '3D SHAPES', text: 'Which solid can this net be folded into?', ...netFig(k), ...txt(k, shuffle(polys.filter(x => x !== k && !(k === 'cube' && x === 'rectangular prism')).concat(['cylinder']))),
        steps: [{ cube: '6 squares the same size fold into a cube.', 'rectangular prism': '6 rectangles fold into a rectangular prism.', 'triangular prism': '2 triangles and 3 rectangles fold into a triangular prism.', 'square pyramid': 'A square and 4 triangles fold into a square pyramid.', 'triangular pyramid': '4 triangles fold into a triangular pyramid.' }[k]] };
    };
  }

  // ---- Polygons by name, sides and regularity.
  const POLY = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 10: 'decagon' };
  const lumpy = (n, r) => { const b = R(0, 359); return range(n).map(i => { const a = (b + i * 360 / n + R(-13, 13)) * DEG, rr = r * (.7 + rand() * .32); return [Math.cos(a) * rr, Math.sin(a) * rr]; }); };
  function polygonsKind(g) {
    return d => {
      const ns = d < 2 ? [3, 4, 5, 6, 8] : [3, 4, 5, 6, 7, 8, 10], n = pick(ns), form = R(0, g === 3 ? (d < 2 ? 0 : 1) : (d < 2 ? 1 : 3));
      if (form === 0) { const regular = rand() < .5, pts = regular ? reg(n, 22, R(0, 1) ? -90 : -90 + 180 / n) : lumpy(n, 24); return { topic: 'POLYGONS', text: 'What is the name of this polygon?', size: [80, 56], fig: (c, w, h) => shape(c, pts.map(p => [Math.round(w / 2 + p[0]), Math.round(h / 2 + p[1])]), FILL),
        ...txt(POLY[n], shuffle(Object.values(POLY).filter(x => x !== POLY[n]))), steps: [`Count the sides: ${n}.`, `A polygon with ${n} sides is a ${POLY[n]}.`] }; }
      if (form === 1) { const what = pick(['sides', 'vertices', 'angles']); return { topic: 'POLYGONS', text: `How many ${what} does a ${POLY[n]} have?`, ...nums(n, [n + 1, n - 1, n + 2, n * 2]), steps: [`A ${POLY[n]} has ${n} sides.`, `It has the same number of vertices and angles: ${n}.`] }; }
      if (form === 2) {
        const right = R(0, 3), shapes = range(4).map(i => i === right ? reg(n, 15) : lumpy(pick(ns), 16));
        return { topic: 'POLYGONS', text: 'Which polygon is regular?', ...picChoice(right), steps: ['A regular polygon has all sides the same length and all angles the same size.', `Picture ${PICS[right]} is the regular one.`],
          ...panels((c, cx, cy, i) => shape(c, shapes[i].map(p => [Math.round(cx + p[0]), Math.round(cy + p[1])]), FILL), 52) };
      }
      const s = R(2, 12), u = pick(['cm', 'in', 'ft', 'm']);
      return { topic: 'POLYGONS', text: `A regular ${POLY[n]} has sides that are ${s} ${u} long. What is its perimeter?`, ...nums(n * s, [s * (n - 1), s + n, s * (n + 1), s * 4].filter(v => v !== n * s), v => `${v} ${u}`),
        steps: [`A ${POLY[n]} has ${n} sides, all ${s} ${u} long.`, `${n} × ${s} = ${n * s} ${u}`] };
    };
  }

  // ---- Slides, flips and turns (and in 5th grade, translation, reflection, rotation, dilation).
  const TSHAPES = [[[0, 0], [1, 0], [1, 2], [2, 2], [2, 3], [0, 3]], [[0, 0], [1, 0], [1, 1], [3, 1], [3, 2], [1, 2], [1, 4], [0, 4]], [[0, 0], [2, 0], [2, 1], [1, 1], [1, 3], [0, 3]]];
  const norm = pts => { const x0 = Math.min(...pts.map(p => p[0])), y0 = Math.min(...pts.map(p => p[1])); return pts.map(([x, y]) => [x - x0, y - y0]); };
  function transformKind(g) {
    const NAMES5 = ['translation', 'reflection', 'rotation', 'dilation'], NAMES3 = ['slide', 'flip', 'turn', 'none of these'];
    return d => {
      const sh = pick(TSHAPES), k = g === 5 ? R(0, 3) : (d >= 2 && rand() < .15 ? 3 : R(0, 2)), names = g === 5 ? NAMES5 : NAMES3;
      let img;
      if (k === 0) img = sh;
      else if (k === 1) img = rand() < .6 ? sh.map(([x, y]) => [-x, y]) : sh.map(([x, y]) => [x, -y]);
      else if (k === 2) img = rand() < .6 ? sh.map(([x, y]) => [-y, x]) : rand() < .5 ? sh.map(([x, y]) => [y, -x]) : sh.map(([x, y]) => [-x, -y]);
      else img = sh.map(([x, y]) => [x * 2, y * 2]);
      img = norm(img);
      const A = norm(sh), dy = k === 0 ? R(-1, 1) : 0;
      const why = g === 5 ? ['Translation: slide, same way up. Reflection: a mirror image.', 'Rotation: turned around a point. Dilation: same shape, new size.'] : ['A slide keeps it facing the same way. A flip makes a mirror image.', 'A turn spins it around. If the size changes, it is none of these.'];
      return { topic: 'TRANSFORMATIONS', text: 'The yellow shape moved to make the blue shape. What kind of move was it?', choices: names.slice(), answer: k,
        steps: [...why, `Here it ${['slid without turning', 'flipped into a mirror image', 'turned', 'changed size'][k]}: ${names[k]}.`],
        size: [168, 60], fig: (c, w, h) => {
          const s = 6, cols = 27, rows = 9, gx = Math.round((w - cols * s) / 2), gy = Math.round((h - rows * s) / 2);
          for (let i = 0; i <= cols; i++) vl(c, gx + i * s, gy, rows * s + 1, GRID); for (let j = 0; j <= rows; j++) hl(c, gx, gy + j * s, cols * s + 1, GRID);
          const place = (pts, ox, oy, col) => shape(c, pts.map(([x, y]) => [gx + (ox + x) * s, gy + (oy + y) * s]), col, INK);
          const hA = Math.max(...A.map(p => p[1])), hI = Math.max(...img.map(p => p[1]));
          place(A, 3, Math.round((rows - hA) / 2), HOT); place(img, 15, clamp(Math.round((rows - hI) / 2) + dy, 0, rows - hI), BLU);
        } };
    };
  }
  // ---- Congruent shapes (3rd, 4th) and similar shapes (5th).
  const CSHAPES = [[[0, 0], [3, 0], [0, 2]], [[0, 0], [1, 0], [1, 2], [3, 2], [3, 3], [0, 3]], [[1, 0], [3, 0], [4, 2], [0, 2]], [[0, 0], [2, 0], [3, 1], [2, 2], [0, 2]], [[0, 0], [3, 0], [3, 1], [0, 3]]];
  function congruentKind(similar) {
    return d => {
      const si = R(0, CSHAPES.length - 1), base = CSHAPES[si], ops = [p => p, ([x, y]) => [-y, x], ([x, y]) => [-x, -y], ([x, y]) => [-x, y]], op = pick(ops.slice(1));
      const cand = similar ? [['right', norm(base.map(op)).map(([x, y]) => [x * 1.5, y * 1.5])], ['x', norm(base).map(([x, y]) => [x * 1.6, y])], ['y', norm(base).map(([x, y]) => [x, y * 1.6])], ['other', norm(CSHAPES[(si + R(1, CSHAPES.length - 1)) % CSHAPES.length])]]
        : [['right', norm(base.map(op))], ['big', norm(base).map(([x, y]) => [x * 1.5, y * 1.5])], (rand() < .5 ? ['x', norm(base).map(([x, y]) => [x * 1.6, y])] : ['y', norm(base).map(([x, y]) => [x, y * 1.6])]), ['other', norm(CSHAPES[(si + R(1, CSHAPES.length - 1)) % CSHAPES.length])]];
      shuffle(cand);
      const right = cand.findIndex(q => q[0] === 'right');
      return { topic: similar ? 'SIMILAR' : 'CONGRUENT', text: similar ? 'Which shape is similar to the yellow shape?' : 'Which shape is congruent to the yellow shape?', ...picChoice(right),
        steps: similar ? ['Similar shapes have the same shape but can be a different size.', 'Every side grows by the same amount; turning is fine, stretching one way is not.', `Shape ${PICS[right]} is similar.`]
          : ['Congruent shapes are the same shape AND the same size.', 'They may be turned or flipped.', `Shape ${PICS[right]} is congruent.`],
        size: [168, 52], fig: (c, w, h) => {
          const cell = w / 5, u = 5, draw = (pts, i, col) => { const W2 = Math.max(...pts.map(p => p[0])) * u, H2 = Math.max(...pts.map(p => p[1])) * u, cx = cell * i + cell / 2; shape(c, pts.map(([x, y]) => [Math.round(cx - W2 / 2 + x * u), Math.round(h / 2 + 5 - H2 / 2 + y * u)]), col); };
          draw(norm(base), 0, HOT); vl(c, Math.round(cell), 4, h - 8, DIM);
          cand.forEach((q, i) => { draw(q[1], i + 1, FILL); lbl(c, PICS[i], cell * (i + 1) + cell / 2, 6, HOT); });
        } };
    };
  }
  // 5th grade (IXL triangles): the missing angle of a triangle or a quadrilateral.
  const triangleAngles = d => {
    if (d >= 3 && rand() < .4) {
      let a = [R(14, 26) * 5, R(14, 26) * 5, R(14, 26) * 5]; if (sum(a) >= 345) a = [80, 95, 100];
      const x = 360 - sum(a);
      return { topic: 'ANGLES', text: `A quadrilateral has angles of ${a[0]}°, ${a[1]}° and ${a[2]}°. What is the fourth angle?`, ...nums(x, [180 - a[0] - a[1] > 0 ? 180 - a[0] - a[1] : x + 20, 360 - a[0] - a[1], x + 10, x - 10].filter(v => v > 0 && v !== x), v => v + '°'),
        steps: ["A quadrilateral's angles add up to 360°.", `${a.join(' + ')} = ${sum(a)}`, `360 - ${sum(a)} = ${x}°`] };
    }
    const angs = triAngles(pick(['acute', 'right', 'obtuse']), rand() < .3 ? 'isosceles' : 'scalene'), hide = R(0, 2), x = angs[hide], known = angs.filter((v, i) => i !== hide);
    return { topic: 'ANGLES', text: 'What is the value of x in the triangle?', ...nums(x, [360 - sum(known), 90 - known[0] > 0 ? 90 - known[0] : x + 15, x + 10, sum(known)].filter(v => v > 0 && v !== x), v => v + '°'),
      steps: ["A triangle's angles add up to 180°.", `${known.join(' + ')} + x = 180`, `x = 180 - ${sum(known)} = ${x}°`],
      size: [116, 70], fig: (c, w, h) => {
        const P = fit(triFromAngles(angs[0], angs[1]), w, h, 14, 9), cg = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3];
        shape(c, P, FILL);
        angs.forEach((a, i) => { if (a === 90 && i !== hide) rightAt(c, P[i], P[(i + 1) % 3], P[(i + 2) % 3], SOFT); const v = P[i], dx = cg[0] - v[0], dy = cg[1] - v[1], L = Math.hypot(dx, dy); lbl(c, i === hide ? 'x°' : a + '°', v[0] + dx / L * 15, v[1] + dy / L * 11 + 1, i === hide ? HOT : SOFT); });
      } };
  };

  // ---- Patterns and logic: input/output tables, growing shape patterns, Venn diagrams, riddles.
  function ioRule(g, d) {
    const k = R(2, 9), j = R(2, 12);
    const rules = g === 3 ? [[`add ${j}`, x => x + j], [`subtract ${k}`, x => x - k], [`multiply by ${k}`, x => x * k]]
      : g === 4 ? [[`multiply by ${k}`, x => x * k], [`add ${j + 10}`, x => x + j + 10], [`divide by ${k}`, x => x / k]]
      : [[`multiply by ${k}, then add ${j % 5 + 1}`, x => x * k + j % 5 + 1], [`multiply by ${k}, then subtract 1`, x => x * k - 1], [`multiply by ${k}`, x => x * k]];
    return pick(rules.slice(0, d < 2 ? 2 : 3));
  }
  function inputOutputKind(g) {
    return d => {
      const [name, f] = ioRule(g, d), div = name.startsWith('divide'), k = div ? Number(name.split(' ').pop()) : 1;
      let ins = []; for (let t = 0; t < 40 && ins.length < 4; t++) { const x = div ? k * R(1, 12) : R(name.startsWith('subtract') ? 10 : 1, 15); if (!ins.includes(x) && f(x) >= 0) ins.push(x); }
      while (ins.length < 4) ins.push((ins.length + 2) * k * 3 + 20);
      ins.sort((a, b) => a - b);
      const outs = ins.map(f), form = R(0, d < 2 ? 0 : d < 3 ? 1 : 2), miss = R(1, 3);
      const fig = (hideIn, hideOut) => tableFig([['IN', ...ins.map((x, i) => i === hideIn ? '?' : String(x))], ['OUT', ...outs.map((y, i) => i === hideOut ? '?' : String(y))]], [32, 30, 30, 30, 30], { head: false, hot: (i, j) => i === 0 });
      if (form === 0) return { topic: 'PATTERNS', ...fig(-1, miss), text: `The rule is "${name}." What is the missing number in the table?`, ...nums(outs[miss], [outs[miss] + 1, outs[miss] - 1, ins[miss] + (outs[0] - ins[0]), outs[miss - 1] + (outs[1] - outs[0]) + 1].filter(v => v !== outs[miss])),
        steps: [`Use the rule on ${ins[miss]}: ${name}.`, `The OUT number is ${outs[miss]}.`] };
      if (form === 1) {
        const x0 = ins[0], y0 = outs[0], cands = [[`add ${y0 - x0}`, x => x + y0 - x0], [`multiply by ${y0 / x0}`, x => x * y0 / x0], [`add ${y0 - x0 + 1}`, x => x + y0 - x0 + 1], [`multiply by ${Math.round(y0 / x0) + 1}`, x => x * (Math.round(y0 / x0) + 1)], [`subtract ${Math.abs(x0 - y0) || 2}`, x => x - (Math.abs(x0 - y0) || 2)], [`add ${(outs[1] - outs[0]) || 3}`, x => x + ((outs[1] - outs[0]) || 3)], ['multiply by 2', x => 2 * x], ['add 10', x => x + 10]];
        const fits = r => ins.every((x, i) => Math.abs(r(x) - outs[i]) < 1e-9);
        return { topic: 'PATTERNS', ...fig(-1, -1), text: 'What is the rule for the table?', ...txt(cap(name), cands.filter(c => c[0] !== name && Number.isInteger(Number(c[0].split(' ').pop())) && Number(c[0].split(' ').pop()) > 0 && !fits(c[1])).map(c => cap(c[0]))),
          steps: [`Check the rule on every pair, not just the first.`, ins.map((x, i) => `${x} → ${outs[i]}`).join(', '), `"${cap(name)}" works for all of them.`] };
      }
      return { topic: 'PATTERNS', ...fig(miss, -1), text: `The rule is "${name}." What is the missing IN number?`, ...nums(ins[miss], [outs[miss], f(outs[miss]) >= 0 && Number.isInteger(f(outs[miss])) ? f(outs[miss]) : ins[miss] + 2, ins[miss] + 1, ins[miss] - 1].filter(v => v !== ins[miss])),
        steps: ['Work backward: undo the rule.', `${ins[miss]} gives ${outs[miss]}, so the IN number is ${ins[miss]}.`] };
    };
  }
  // 4th grade (IXL shape patterns): growing patterns of squares.
  const shapePattern = d => {
    const type = pick(['row', 'plus', 'square', 'stairs']), a = R(1, 3), b = R(2, 4);
    const count = n => type === 'row' ? a + b * (n - 1) : type === 'plus' ? 4 * n - 3 : type === 'square' ? n * n : n * (n + 1) / 2;
    const cells = n => { const out = [];
      if (type === 'row') for (let i = 0; i < count(n); i++) out.push([i % 11, Math.floor(i / 11)]);
      else if (type === 'plus') { out.push([n - 1, n - 1]); for (let i = 1; i < n; i++) out.push([n - 1 - i, n - 1], [n - 1 + i, n - 1], [n - 1, n - 1 - i], [n - 1, n - 1 + i]); }
      else if (type === 'square') for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out.push([i, j]);
      else for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) out.push([i, n - 1 - j]);
      return out; };
    const m = d < 3 ? 4 : R(5, 6), ans = count(m), lin = count(3) + (count(3) - count(2)) * (m - 3);
    return { topic: 'PATTERNS', text: `The pattern keeps growing the same way. How many squares will be in figure ${m}?`, ...nums(ans, [lin, count(m - 1), ans + 1, ans - 1, count(m + 1)].filter(v => v !== ans)),
      steps: [`Figures 1, 2, 3 have ${count(1)}, ${count(2)}, ${count(3)} squares.`, type === 'square' ? `Figure n is an n by n square: ${m} × ${m}.` : type === 'stairs' ? `Each new figure adds one more column: ${range(m).map(i => i + 1).join(' + ')}.` : `Each figure adds ${count(2) - count(1)} squares.`, `Figure ${m} has ${ans} squares.`],
      size: [168, 50], fig: (c, w, h) => [1, 2, 3].forEach((n, k) => { const cs = cells(n), s = 4, W2 = (Math.max(...cs.map(p => p[0])) + 1) * s, H2 = (Math.max(...cs.map(p => p[1])) + 1) * s, cx = w / 6 + k * w / 3;
        cs.forEach(([x, y]) => { F.box(c, Math.round(cx - W2 / 2 + x * s), Math.round(h / 2 - 4 - H2 / 2 + y * s), s, s, BLU); frame(c, Math.round(cx - W2 / 2 + x * s), Math.round(h / 2 - 4 - H2 / 2 + y * s), s + 1, s + 1, INK); });
        lbl(c, n, cx, h - 5, HOT); }) };
  };
  const VSETS = [['EVEN', 'even', n => n % 2 === 0], ['ODD', 'odd', n => n % 2 === 1], ['3s', 'a multiple of 3', n => n % 3 === 0], ['5s', 'a multiple of 5', n => n % 5 === 0], ['4s', 'a multiple of 4', n => n % 4 === 0], ['OVER 20', 'more than 20', n => n > 20]];
  function vennFig(la, lb, nums3, outside) {
    return { size: [150, 62], fig: (c, w, h) => {
      const cx = 52, cy = Math.round(h / 2) + 5, r = 21;
      F.circle(c, cx - 13, cy, r, BLU); F.circle(c, cx + 13, cy, r, GRN);
      lbl(c, la, cx - 22, 6, BLU); lbl(c, lb, cx + 22, 6, GRN);
      if (nums3) { lbl(c, nums3[0], cx - 22, cy + 1); lbl(c, nums3[1], cx, cy + 1, HOT); lbl(c, nums3[2], cx + 22, cy + 1); }
      if (outside != null) lbl(c, `NEITHER: ${outside}`, w - 2, h - 5, SOFT, 'right');
    } };
  }
  function vennKind(g) {
    return d => {
      const form = R(0, d < 2 ? 1 : 2);
      if (form === 2 || (g >= 4 && rand() < .3)) {
        const [A, B] = shuffle([['SOCCER', 'soccer'], ['SWIM', 'swim'], ['PIANO', 'play piano'], ['ART', 'do art']]).slice(0, 2), a = R(2, 12), b = R(1, 8), c2 = R(2, 12), e = R(0, 6);
        const ask = R(0, g === 3 ? 2 : 3), verb = x => x[1] === 'soccer' ? 'play soccer' : x[1];
        const fig = vennFig(A[0], B[0], [a, b, c2], e);
        if (ask === 0) return { topic: 'VENN DIAGRAMS', ...fig, text: `The Venn diagram shows what some kids do after school. How many kids ${verb(A)}?`, ...nums(a + b, [a, b, a + b + c2, c2 + b].filter(v => v !== a + b)), steps: [`Everyone inside the ${A[0]} circle counts, the middle too.`, `${a} + ${b} = ${a + b}`] };
        if (ask === 1) return { topic: 'VENN DIAGRAMS', ...fig, text: `The Venn diagram shows what some kids do after school. How many kids ${verb(A)} and ${verb(B)}?`, ...nums(b, [a + b + c2, a + c2, a, c2].filter(v => v !== b)), steps: ['Both circles at once is the middle part where they overlap.', `That's ${b} kids.`] };
        if (ask === 2) return { topic: 'VENN DIAGRAMS', ...fig, text: 'The Venn diagram shows what some kids do after school. How many kids are in the diagram in all?', ...nums(a + b + c2 + e, [a + b + c2, a + 2 * b + c2 + e, a + c2 + e, a + b + c2 + e + 1].filter(v => v !== a + b + c2 + e)), steps: ['Add every part once, including NEITHER.', `${a} + ${b} + ${c2} + ${e} = ${a + b + c2 + e}`] };
        return { topic: 'VENN DIAGRAMS', ...fig, text: `The Venn diagram shows what some kids do after school. How many kids do just one of the two?`, ...nums(a + c2, [a + b + c2, b, a + 2 * b + c2, a].filter(v => v !== a + c2)), steps: ['Just one means not in the middle.', `${a} + ${c2} = ${a + c2}`] };
      }
      let A, B; for (let t = 0; t < 30; t++) { [A, B] = shuffle(VSETS.slice()).slice(0, 2); if (!(A[0] === 'EVEN' && B[0] === 'ODD') && !(A[0] === 'ODD' && B[0] === 'EVEN') && !(A[0] === 'ODD' && B[0] === '4s') && !(A[0] === '4s' && B[0] === 'ODD')) break; }
      const find = test => { for (let t = 0; t < 200; t++) { const x = R(2, 40); if (test(x)) return x; } return null; };
      const both = find(x => A[2](x) && B[2](x)), onlyA = find(x => A[2](x) && !B[2](x)), onlyB = find(x => !A[2](x) && B[2](x)), none = find(x => !A[2](x) && !B[2](x));
      if (form === 0 && both != null && onlyA != null && onlyB != null && none != null) return { topic: 'VENN DIAGRAMS', ...vennFig(A[0], B[0]), text: `Which number belongs where the two circles overlap? (Left: ${A[1]}. Right: ${B[1]}.)`,
        ...txt(String(both), [String(onlyA), String(onlyB), String(none)]), steps: ['The overlap is for numbers that fit BOTH circles.', `${both} is ${A[1]} and ${B[1]}.`] };
      const x = pick([both, onlyA, onlyB, none].filter(v => v != null)), k = A[2](x) && B[2](x) ? 2 : A[2](x) ? 0 : B[2](x) ? 1 : 3;
      return { topic: 'VENN DIAGRAMS', ...vennFig(A[0], B[0]), text: `Where does ${x} go in the Venn diagram? (Left: ${A[1]}. Right: ${B[1]}.)`, choices: ['left circle only', 'right circle only', 'the overlap', 'outside both'], answer: k,
        steps: [`Is ${x} ${A[1]}? ${A[2](x) ? 'Yes' : 'No'}. Is it ${B[1]}? ${B[2](x) ? 'Yes' : 'No'}.`, `So it goes in ${['the left circle only', 'the right circle only', 'the overlap', 'neither circle'][k]}.`] };
    };
  }
  function logicKind(g) {
    return d => {
      const forms = g === 3 ? [0, 1] : [0, 1, 2, 3, 4], form = pick(forms.slice(0, d < 2 ? 2 : forms.length));
      if (form === 0) {
        const lo = g === 5 ? 100 : 10, hi = g === 5 ? 999 : 99, N0 = R(lo + 10, hi - 10), dsum = x => String(x).split('').reduce((s, ch) => s + Number(ch), 0);
        const m = [3, 4, 5].find(k => N0 % k === 0), a0 = Math.max(lo, N0 - R(5, 20)), b0 = Math.min(hi, N0 + R(5, 20));
        const clues = [[N0 % 2 ? 'I am odd.' : 'I am even.', x => x % 2 === N0 % 2], [`I am between ${a0} and ${b0}.`, x => x > a0 && x < b0], [`My digits add up to ${dsum(N0)}.`, x => dsum(x) === dsum(N0)]];
        if (m) clues.push([`I am a multiple of ${m}.`, x => x % m === 0]);
        const use = shuffle(clues.slice()).slice(0, 3), okAll = x => use.every(c => c[1](x));
        const near = []; for (let t = 0; t < 400 && near.length < 3; t++) { const x = R(Math.max(lo, a0 - 15), Math.min(hi, b0 + 15)); if (x !== N0 && !near.includes(x) && !okAll(x) && use.filter(c => c[1](x)).length === 2) near.push(x); }
        for (let t = 0; near.length < 3 && t < 400; t++) { const x = R(lo, hi); if (!okAll(x) && !near.includes(x)) near.push(x); }
        return { topic: 'LOGIC', text: `I am a ${g === 5 ? '3' : '2'}-digit number. ${use.map(c => c[0]).join(' ')} Which number could I be?`, ...nums(N0, near),
          steps: ['Check each choice against every clue.', `${N0} fits all three clues; each other choice breaks at least one.`] };
      }
      if (form === 1) {
        const b = R(3, g === 3 ? 20 : 60), dd = R(1, g === 3 ? 10 : 30), a = b + dd, S = a + b;
        return { topic: 'LOGIC', text: `Two numbers add up to ${S}. One is ${dd} more than the other. What is the larger number?`, ...nums(a, [b, S - dd, Math.round(S / 2), dd, a + 1].filter(v => v !== a)),
          steps: [`Guess and check, or take away the difference first: ${S} - ${dd} = ${S - dd}.`, `Split that in half: ${b}. The larger is ${b} + ${dd} = ${a}.`, `Check: ${a} + ${b} = ${S}`] };
      }
      if (form === 2) {
        const x = R(2, 9), y = R(x + 1, 12), S = x + y, P = x * y, p = (u, v) => `${u} and ${v}`;
        const wr = [p(x - 1, y + 1), p(x + 1, y - 1), p(1, P), p(x, y + 1), p(x + 1, y)].filter(s => { const [u, v] = s.split(' and ').map(Number); return u > 0 && v > 0 && !(u + v === S && u * v === P); });
        return { topic: 'LOGIC', text: `Two numbers have a sum of ${S} and a product of ${P}. What are the two numbers?`, ...txt(p(x, y), wr),
          steps: ['Try pairs that add up to ' + S + '.', `${x} + ${y} = ${S}, and ${x} × ${y} = ${P}.`] };
      }
      if (form === 3) {
        const k = R(2, 4), cous = R(3, 9), T = cous * (k + 1), n = who();
        return { topic: 'LOGIC', text: `${n} is ${k} times as old as a cousin. Together they are ${T} years old. How old is the cousin?`, ...nums(cous, [T / k === Math.round(T / k) ? T / k : cous + 2, T - k, k * cous, cous + 1].filter(v => v !== cous)),
          steps: [`Think of the cousin as 1 part and ${n} as ${k} parts: ${k + 1} parts in all.`, `${T} ÷ ${k + 1} = ${cous}`, `Check: ${cous} + ${k * cous} = ${T}`] };
      }
      const r2 = R(3, 6), per = R(4, 9), age = R(28, 45), n = who();
      return { topic: 'LOGIC', text: `A class of ${r2 * per} kids sits in ${r2} equal rows. Their teacher, ${n}, is ${age} years old. How many kids are in each row? Which fact is NOT needed?`,
        ...txt(`the teacher's age`, [`the ${r2 * per} kids`, `the ${r2} rows`, 'every fact is needed']), steps: [`${r2 * per} ÷ ${r2} = ${per} kids in each row.`, `The teacher's age (${age}) doesn't change that.`] };
    };
  }

  // ---- Budgeting: earning, saving, spending, needs and wants, profit.
  const NEEDS = ['a winter coat', 'healthy food', 'a place to live', 'clean water', 'shoes that fit'], WANTS = ['a video game', 'a toy robot', 'candy', 'a new skateboard', 'movie tickets', 'a phone case'];
  function budgetKind(g) {
    return d => {
      const n = who(), forms = g === 3 ? [0, 1, 2] : g === 4 ? [0, 2, 3, 4] : [3, 4, 5, 6], form = pick(forms.slice(0, d < 2 ? 2 : forms.length));
      if (form === 0) { const w = R(2, g === 3 ? 6 : 15), k = R(3, 9), T = w * k; return { topic: 'BUDGETING', text: `${n} earns $${w} a week walking dogs and saves all of it. How many weeks until ${n} has $${T} for a new bike helmet?`, ...nums(k, [T - w, k + 1, k - 1, T / 2 === Math.round(T / 2) ? T / 2 : k + 2].filter(v => v !== k && v > 0)),
        steps: [`Each week adds $${w}.`, `$${T} ÷ $${w} = ${k} weeks`] }; }
      if (form === 1) { const need = rand() < .5; return { topic: 'BUDGETING', text: need ? 'Which of these is a need, not a want?' : 'Which of these is a want, not a need?', ...txt(need ? pick(NEEDS) : pick(WANTS), shuffle((need ? WANTS : NEEDS).slice())),
        steps: ['A need is something you must have to live and be safe.', 'A want is something nice to have, but you could do without it.'] }; }
      if (form === 2) { const has = R(15, 40), a = R(3, 12), b = R(2, 10); return { topic: 'BUDGETING', text: `${n} gets $${has} for a birthday, then spends $${a} on a book and $${b} on a game. How much money is left to save?`, ...nums(has - a - b, [has - a, has - b, a + b, has + a - b].filter(v => v > 0 && v !== has - a - b), dol),
        steps: [`Spent: $${a} + $${b} = $${a + b}`, `Left: $${has} - $${a + b} = $${has - a - b}`] }; }
      if (form === 3) { const k = R(12, 40), p = pick([25, 50, 75, 100]), cost = R(1, Math.max(1, Math.floor(k * p / 100) - 1)) * 100, profit = k * p - cost; return { topic: 'BUDGETING', text: `A lemonade stand spends ${usd(cost)} on supplies and sells ${k} cups for ${usd(p)} each. What is the profit?`, ...nums(profit, [k * p, k * p + cost, profit + 100, cost].filter(v => v > 0 && v !== profit), usd, 25),
        steps: [`Money in: ${k} × ${usd(p)} = ${usd(k * p)}`, `Profit = money in - money spent: ${usd(k * p)} - ${usd(cost)} = ${usd(profit)}`] }; }
      if (form === 4) { const e = R(8, 20), s = R(2, e - 3), w = R(3, 8); return { topic: 'BUDGETING', text: `${n} earns $${e} each week, spends $${s} and saves the rest. How much does ${n} save in ${w} weeks?`, ...nums((e - s) * w, [e * w, s * w, (e + s) * w, e - s].filter(v => v !== (e - s) * w), dol),
        steps: [`Saved each week: $${e} - $${s} = $${e - s}`, `${w} weeks: ${w} × $${e - s} = $${(e - s) * w}`] }; }
      if (form === 5) { const T = R(3, 10) * 8, food = T / 2, games = T / 4, left = T - food - games; return { topic: 'BUDGETING', text: `${n} has $${T}. Half goes to a class trip and 1/4 goes to games. How much is left to save?`, ...nums(left, [food, games, T - food, T - games].filter(v => v !== left), dol),
        steps: [`Half of $${T} is $${food}. 1/4 of $${T} is $${games}.`, `$${T} - $${food} - $${games} = $${left}`] }; }
      const goal = R(60, 150), has = R(10, 40), w = R(6, 15), weeks = Math.ceil((goal - has) / w);
      return { topic: 'BUDGETING', text: `${n} wants a $${goal} scooter, has $${has} saved, and saves $${w} more each week. How many weeks until ${n} can buy it?`, ...nums(weeks, [Math.floor((goal - has) / w) === weeks ? weeks + 1 : Math.floor((goal - has) / w), Math.ceil(goal / w), weeks + 1, weeks - 1].filter(v => v > 0 && v !== weeks)),
        steps: [`Still needed: $${goal} - $${has} = $${goal - has}`, `$${goal - has} ÷ $${w} = ${Math.floor((goal - has) / w)} R${(goal - has) % w}`, (goal - has) % w ? `Not quite enough after ${weeks - 1} weeks, so ${weeks} weeks.` : `Exactly ${weeks} weeks.`] };
    };
  }

  // ---- Estimating products and quotients.
  // A number close to a round ten (or hundred), so rounding gives a clearly best estimate.
  const closeTen = lo => { const p = lo >= 100 ? 100 : 10; return R(lo / p + 1, 9 * lo / p) * p + pick([-1, 1]) * R(1, p === 10 ? 2 : 20); };
  function estimateKind(g) {
    return d => {
      const form = R(0, d < 2 ? 0 : 2);
      if (form === 0) {
        const two = g === 5 && rand() < .6, a = two ? closeTen(10) : closeTen(d < 3 ? 10 : 100), b = two ? closeTen(10) : R(3, 9), p = a >= 100 ? 100 : 10;
        const ra = rnd(a, p), rb = two ? rnd(b, 10) : b, ans = ra * rb;
        return { topic: 'ESTIMATE', text: `Which is the best estimate of ${N(a)} × ${b}?`, ...nums(ans, two ? [ans * 10, ans / 10, ans * 2, ans / 2] : [(ra - p) * rb, (ra + p) * rb, ans * 10, ans / 10].filter(v => v > 0), N),
          steps: [`Round: ${N(a)} is about ${N(ra)}${two ? ` and ${b} is about ${rb}` : ''}.`, `${N(ra)} × ${rb} = ${N(ans)}`, `(Exact: ${N(a * b)}, close!)`] };
      }
      if (form === 1) {
        const dv = R(3, 9), E = R(12, 98) * (g === 5 ? 100 : 10), t = dv * E + R(-2 * dv, 2 * dv), cmp = E * dv;
        return { topic: 'ESTIMATE', text: `Which is the best estimate of ${N(t)} ÷ ${dv}?`, ...nums(E, [E * 10, E / 10, E + 100, Math.max(10, E - 100)].filter(v => v > 0 && Number.isInteger(v)), N, 10),
          steps: [`Find a friendly number near ${N(t)} that ${dv} divides: ${N(cmp)}.`, `${N(cmp)} ÷ ${dv} = ${N(E)}`] };
      }
      const a = closeTen(10), b = closeTen(10), ans = rnd(a, 10) * rnd(b, 10), C = pick([['A school buys', 'boxes of', 'pencils'], ['A farm packs', 'crates of', 'apples'], ['A theater has', 'rows of', 'seats']]);
      return { topic: 'ESTIMATE', text: `${C[0]} ${a} ${C[1]} ${b} ${C[2]}. About how many ${C[2]} is that?`, ...nums(ans, [ans * 10, ans / 10, ans * 2, ans / 2].filter(v => Number.isInteger(v)), N),
        steps: [`Round both: ${a} is about ${rnd(a, 10)}, ${b} is about ${rnd(b, 10)}.`, `${rnd(a, 10)} × ${rnd(b, 10)} = ${N(ans)}`, `(Exact: ${N(a * b)})`] };
    };
  }

  // ---- 5th grade number theory and pre-algebra.
  const primeFactors = n => { const out = []; let m = n; for (let p = 2; p * p <= m; p++) while (m % p === 0) { out.push(p); m /= p; } if (m > 1) out.push(m); return out; };
  const powForm = fs => { const c2 = {}; fs.forEach(p => { c2[p] = (c2[p] || 0) + 1; }); return Object.keys(c2).map(Number).sort((a, b) => a - b).map(p => c2[p] > 1 ? `${p}^${c2[p]}` : String(p)).join(' × '); };
  const PF = [12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 50, 54, 56, 60, 63, 66, 70, 72, 75, 80, 84, 90, 96, 100, 108, 120];
  const primeFactor = d => {
    const n = pick(d < 2 ? PF.slice(0, 12) : PF), fs = primeFactors(n), form = R(0, d < 2 ? 1 : 2), right = d >= 4 && fs.length > 2 && rand() < .5 ? powForm(fs) : fs.join(' × ');
    if (form === 0) {
      const big = fs.slice(0, -2).concat([fs[fs.length - 2] * fs[fs.length - 1]]), drop = fs.slice(1), swap = fs.slice(0, -1).concat([fs[fs.length - 1] + (fs[fs.length - 1] === 2 ? 1 : 2)]);
      return { topic: 'PRIME FACTORS', text: `What is the prime factorization of ${n}?`, ...txt(right, [big.join(' × '), drop.join(' × '), swap.sort((a, b) => a - b).join(' × '), n % 2 ? `3 × ${n / 3}` : `2 × ${n / 2}`, `${fs[0]} × ${n / fs[0]}`].filter(s => s !== fs.join(' × ') && s !== right)),
        steps: ['Keep splitting until every factor is prime.', `${n} = ${fs.join(' × ')}`, `Check: ${fs.join(' × ')} = ${n}`] };
    }
    if (form === 1) {
      const p = pick([...new Set(fs)]), wr = [4, 6, 8, 9, 10, 12, 15].filter(x => n % x === 0).slice(0, 2).concat([2, 3, 5, 7, 11].filter(x => n % x !== 0));
      return { topic: 'PRIME FACTORS', text: `Which number is a prime factor of ${n}?`, ...nums(p, shuffle(wr.filter(x => x !== p))), steps: [`${n} = ${fs.join(' × ')}`, `${p} is prime and divides ${n}; numbers like 4 or 6 divide it too but are not prime.`] };
    }
    return { topic: 'PRIME FACTORS', text: `Which number has the prime factorization ${fs.join(' × ')}?`, ...nums(n, [n / fs[0], n * 2, sum(fs), n + fs[0]].filter(v => Number.isInteger(v) && v !== n)), steps: [`Multiply: ${fs.join(' × ')}`, `= ${n}`] };
  };
  const RULES = [[2, 'ends in 0, 2, 4, 6 or 8'], [3, 'has digits that add up to a multiple of 3'], [5, 'ends in 0 or 5'], [9, 'has digits that add up to a multiple of 9'], [10, 'ends in 0'], [6, 'is even and its digits add up to a multiple of 3']];
  const divisibility = d => {
    const [k, rule] = pick(RULES.slice(0, d < 2 ? 5 : 6)), digits = d < 3 ? 3 : 4, lo = 10 ** (digits - 1), hi = 10 ** digits - 1;
    let right; for (let t = 0; t < 50; t++) { right = R(lo, hi); if (right % k === 0) break; } if (right % k) right -= right % k;
    const wrongs = []; for (let t = 0; t < 200 && wrongs.length < 3; t++) { const x = rand() < .5 ? right + R(1, 9) : R(lo, hi); if (x % k && x <= hi && !wrongs.includes(x)) wrongs.push(x); }
    while (wrongs.length < 3) wrongs.push(right + wrongs.length + 1);
    return { topic: 'DIVISIBILITY', text: `Which number is divisible by ${k}?`, ...nums(right, wrongs), steps: [`A number is divisible by ${k} if it ${rule}.`, `${N(right)} does: ${N(right)} ÷ ${k} = ${N(right / k)}.`] };
  };
  const gcfLcm = d => {
    const [a, b] = pick([[4, 6], [6, 8], [6, 9], [8, 12], [9, 12], [10, 15], [12, 18], [4, 10], [6, 10], [12, 16], [15, 20], [8, 10], [14, 21], [16, 24]]), G = gcd(a, b), L = a * b / G, form = R(0, d < 3 ? 1 : 3);
    if (form === 0) return { topic: 'FACTORS', text: `What is the least common multiple of ${a} and ${b}?`, ...nums(L, [a * b, G, a + b, L * 2].filter(v => v !== L)), steps: [`Multiples of ${a}: ${range(4).map(i => a * (i + 1)).join(', ')}...`, `Multiples of ${b}: ${range(4).map(i => b * (i + 1)).join(', ')}...`, `The first one in both lists is ${L}.`] };
    if (form === 1) return { topic: 'FACTORS', text: `What is the greatest common factor of ${a} and ${b}?`, ...nums(G, [L, 1, G === 2 ? 4 : 2, Math.min(a, b)].filter(v => v !== G && (v === L || a % v || b % v || v < G))), steps: [`Factors of ${a}: ${factorsOf(a).join(', ')}`, `Factors of ${b}: ${factorsOf(b).join(', ')}`, `The greatest one in both: ${G}.`] };
    if (form === 2) return { topic: 'FACTORS', text: `Hot dogs come in packs of ${a} and buns in packs of ${b}. What is the smallest number of each you can buy to have the same amount?`, ...nums(L, [a * b, a + b, G, L + a].filter(v => v !== L)), steps: ['You need a number that is a multiple of both.', `The least common multiple of ${a} and ${b} is ${L}.`] };
    return { topic: 'FACTORS', text: `What is the least common denominator of 1/${a} and 1/${b}?`, ...nums(L, [a * b, a + b, G, Math.max(a, b)].filter(v => v !== L)), steps: ['The least common denominator is the least common multiple of the bottoms.', `LCM of ${a} and ${b} = ${L}`] };
  };
  const exponents = d => {
    const b = R(2, d < 3 ? 5 : 9), e0 = R(2, b > 5 ? 3 : 4), e = e0 === b || b * e0 === 8 ? 3 : e0, v = b ** e, form = R(0, d < 2 ? 1 : 2);
    if (form === 0) return { topic: 'EXPONENTS', text: `What is the value of ${b}^${e}?`, ...nums(v, [b * e, b + e, e ** b <= 9999 ? e ** b : v + b, b ** (e - 1)].filter(x => x !== v)), steps: [`${b}^${e} means ${Array(e).fill(b).join(' × ')}.`, `= ${N(v)}`] };
    if (form === 1) return { topic: 'EXPONENTS', text: `Which shows ${Array(e).fill(b).join(' × ')} with an exponent?`, ...txt(`${b}^${e}`, [`${e}^${b}`, `${b} × ${e}`, `${b * e}`, `${b}^${e + 1}`]), steps: [`${b} is multiplied ${e} times.`, `The base is ${b} and the exponent is ${e}: ${b}^${e}.`] };
    let set; for (let t = 0; t < 40; t++) { set = range(4).map(() => [R(2, 6), R(2, 4)]); const vals = set.map(([x, y]) => x ** y); if (new Set(vals).size === 4 && new Set(set.map(p => p.join())).size === 4) break; }
    const best = set.reduce((m, p) => p[0] ** p[1] > m[0] ** m[1] ? p : m), s = p => `${p[0]}^${p[1]}`;
    return { topic: 'EXPONENTS', text: 'Which has the greatest value?', ...txt(s(best), set.filter(p => p !== best).map(s)), steps: [set.map(p => `${s(p)} = ${p[0] ** p[1]}`).join(', '), `The greatest is ${s(best)}.`] };
  };
  const integers = d => {
    const form = R(0, 3), sg = v => String(v);
    if (form === 0) {
      const x = -R(1, 7);
      return { topic: 'INTEGERS', text: 'What number is at point P?', ...numsSigned(x, [-x, x + 1, x - 1], sg), steps: ['Numbers left of 0 are negative.', `P is ${-x} ${pl(-x, 'step')} left of 0: ${x}.`],
        size: [168, 40], fig: (c, w, h) => { const y = 22, X = nline(c, 14, w - 14, y, -8, 8); for (let v = -8; v <= 8; v++) { tick(c, X(v), y, v % 4 ? 2 : 4); if (v % 4 === 0) lbl(c, v, X(v), y + 11); } F.disc(c, X(x), y, 2, HOT); lbl(c, 'P', X(x), y - 9, HOT); } };
    }
    if (form === 1) {
      const vals = shuffle([-R(5, 9), -R(1, 4), R(0, 3), R(4, 9)]), most = rand() < .5, best = most ? Math.max(...vals) : Math.min(...vals);
      return { topic: 'INTEGERS', text: `Which number is the ${most ? 'greatest' : 'least'}?`, ...txt(sg(best), vals.filter(v => v !== best).map(sg)), steps: ['On a number line, numbers get bigger to the right.', 'Farther left of 0 is less: -8 is less than -2.', `The ${most ? 'greatest' : 'least'} is ${best}.`] };
    }
    if (form === 2) { const v = R(2, 30) * (rand() < .5 ? 1 : -1); return { topic: 'INTEGERS', text: `What is the opposite of ${v}?`, ...numsSigned(-v, [v, 0, -v + 1, -v - 1], String), steps: ['Opposites are the same distance from 0 on opposite sides.', `The opposite of ${v} is ${-v}.`] }; }
    const s0 = -R(1, 8), m = R(3, 12), e = s0 + m;
    return { topic: 'INTEGERS', text: `Start at ${s0} on a number line and move ${m} steps to the right. Where do you land?`, ...numsSigned(e, [s0 - m, -e, m, e + 1], sg), steps: e >= 0 ? [`From ${s0}, ${-s0} steps right reaches 0.`, `${m + s0} more steps lands on ${e}.`] : ['Moving right means counting up.', `${s0} + ${m} = ${e}: still left of 0.`] };
  };
  const percents = d => {
    const form = R(0, d < 3 ? 2 : 3);
    if (form === 0) { const k = R(5, 95); return { topic: 'PERCENTS', text: 'What percent of the grid is shaded?', ...decGrid(k, 0), ...nums(k, [100 - k, Math.round(k / 10), k + 10, k - 10].filter(v => v > 0 && v !== k), v => v + '%'),
      steps: ['Percent means "out of 100".', `${k} of the 100 squares are shaded: ${k}%.`] }; }
    if (form === 1) { const [n, dd] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [1, 20], [9, 20], [1, 25], [12, 25], [1, 50], [17, 50]]), p = n * 100 / dd;
      return { topic: 'PERCENTS', text: rand() < .5 ? `Write ${fr(n, dd)} as a percent.` : `Write ${N(p / 100)} as a percent.`, ...nums(p, [n * 10, n + dd, 100 - p, p * 10, p / 10].filter(v => v > 0 && v !== p && Number.isInteger(v)), v => v + '%'),
        steps: [`Make it out of 100: ${fr(n, dd)} = ${fr(p, 100)}.`, `${p} out of 100 is ${p}%.`] }; }
    if (form === 2) { const [p, k] = pick([[50, 2], [25, 4], [10, 10], [20, 5], [75, 4]]), base = k * R(2, 12) * (p === 75 ? 1 : 1), ans = base * p / 100;
      return { topic: 'PERCENTS', text: `What is ${p}% of ${base}?`, ...nums(ans, [base - ans, base / 10, p, ans * 2].filter(v => v !== ans && Number.isInteger(v) && v > 0)), steps: [`${p}% is ${rf(p, 100)}.`, `${rf(p, 100)} of ${base} = ${ans}`] }; }
    const price = R(2, 12) * 20, p = pick([10, 25, 50]), off = price * p / 100, sale = rand() < .5;
    return { topic: 'PERCENTS', text: `A $${price} skateboard is ${p}% off. ${sale ? 'What is the sale price?' : 'How much money do you save?'}`, ...nums(sale ? price - off : off, sale ? [off, price - p, price + off] : [price - off, p, off * 2], dol),
      steps: [`${p}% of $${price} = $${off}`, sale ? `$${price} - $${off} = $${price - off}` : `You save $${off}.`] };
  };
  const ratios = d => {
    const form = R(0, 2), a = R(2, 9), b0 = R(2, 8), b = b0 >= a ? b0 + 1 : b0;
    if (form === 0) { const [x, y, where] = pick([['red marbles', 'blue marbles', 'A jar has'], ['cats', 'dogs', 'A pet shelter has'], ['boys', 'girls', 'A chess club has']]); return { topic: 'RATIOS', text: `${where} ${a} ${x} and ${b} ${y}. What is the ratio of ${x} to ${y}?`,
      ...txt(`${a} to ${b}`, [`${b} to ${a}`, `${a} to ${a + b}`, `${a + b} to ${b}`, `${b} to ${a + b}`].filter(s => a !== b || s !== `${b} to ${a}`)), steps: ['A ratio compares two amounts in order.', `${x} first, then ${y}: ${a} to ${b}.`] }; }
    if (form === 1) { const k = R(2, 5); return { topic: 'RATIOS', text: `A recipe uses ${a} cups of flour for every ${b} cups of milk. How many cups of milk go with ${a * k} cups of flour?`, ...nums(b * k, [b + a * k - a, b * k + 1, a * k, b + k].filter(v => v !== b * k)),
      steps: [`${a * k} cups of flour is ${k} times ${a}.`, `So use ${k} times the milk: ${k} × ${b} = ${b * k} cups.`] }; }
    const k = R(2, 4), s = (x, y) => `${x}:${y}`;
    return { topic: 'RATIOS', text: `Which ratio is equivalent to ${s(a, b)}?`, ...txt(s(a * k, b * k), [s(b * k, a * k), s(a + k, b + k), s(a * k, b + k), s(a + 1, b * k)].filter(q => { const [x, y] = q.split(':').map(Number); return x * b !== y * a; })),
      steps: ['Multiply both parts by the same number.', `${s(a, b)} × ${k} = ${s(a * k, b * k)}`] };
  };
  const variableExpr = d => {
    const form = R(0, 2), k = R(2, 9), n = R(2, 9);
    if (form === 0) { const C = pick([[`${k} more than n`, `n + ${k}`, [`n - ${k}`, `${k} × n`, `${k} - n`, `n ÷ ${k}`]], [`${k} less than n`, `n - ${k}`, [`${k} - n`, `n + ${k}`, `${k} × n`, `n ÷ ${k}`]], [`${k} times n`, `${k} × n`, [`${k} + n`, `n - ${k}`, `n ÷ ${k}`, `${k} - n`]], [`n divided by ${k}`, `n ÷ ${k}`, [`${k} ÷ n`, `n × ${k}`, `n - ${k}`, `${k} + n`]], [`2 more than ${k} times n`, `${k} × n + 2`, [`${k} × (n + 2)`, `2 × n + ${k}`, `${k} + n + 2`, `${k} × n - 2`]]]);
      return { topic: 'EXPRESSIONS', text: `Which expression means "${C[0]}"?`, ...txt(C[1], C[2]), steps: [`"${C[0]}" is ${C[1]}.`, '"Less than" flips the order: 5 less than n is n - 5.'] }; }
    if (form === 1) { const b = R(1, 9), v = k * n + b, short = d >= 3; return { topic: 'EXPRESSIONS', text: `What is the value of ${short ? `${k}n` : `${k} × n`} + ${b} when n = ${n}?`, ...nums(v, [k * (n + b), k + n + b, short ? Number(`${k}${n}`) + b : v + k, k * n].filter(x => x !== v)),
      steps: [`Put ${n} in for n: ${k} × ${n} + ${b}`, `${k * n} + ${b} = ${v}`] }; }
    const C = pick([['Each ticket costs $' + k + '. Which expression shows the cost of t tickets?', `${k} × t`, [`${k} + t`, `t ÷ ${k}`, `${k} - t`, `t - ${k}`]], [`${who()} has ${k} more stickers than Ana. Ana has s stickers. Which expression shows how many ${'stickers'} that is?`, `s + ${k}`, [`s - ${k}`, `${k} × s`, `${k} - s`, `s ÷ ${k}`]]]);
    return { topic: 'EXPRESSIONS', text: C[0], ...txt(C[1], C[2]), steps: ['Say it in words first, then write it.', `The expression is ${C[1]}.`] };
  };
  const fracDecimal = d => {
    const P = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [1, 10], [7, 10], [1, 20], [3, 20], [1, 25], [3, 25]], [n, dd] = pick(P), v = n / dd, form = R(0, d < 2 ? 0 : 2);
    if (form === 0) return { topic: 'DECIMALS', text: `Which decimal is equal to ${fr(n, dd)}?`, ...nums(v, [Number(`0.${n}${dd}`), n / 10, Number(`${n}.${dd}`), v + .1, v * 10].filter(x => x !== v && x > 0 && x < 100), N, .01, false),
      steps: [`${fr(n, dd)} means ${n} ÷ ${dd}.`, `${n} ÷ ${dd} = ${N(v)}`] };
    if (form === 1) { const k = R(11, 99) / 100, f = red(Math.round(k * 100), 100); return { topic: 'DECIMALS', text: `Write ${N(k)} as a fraction in simplest form.`, ...fracs(f, [[Math.round(k * 100), 10], [f[1], f[0]], [Math.round(k * 100), 1000], [f[0] + 1, f[1]]], q => rf(q[0], q[1])),
      steps: [`${N(k)} = ${fr(Math.round(k * 100), 100)}`, f[1] !== 100 ? `Simplify: divide by ${100 / f[1]} to get ${rf(...f)}.` : 'It is already in simplest form.'] }; }
    const set = shuffle(P.slice()).slice(0, 4), most = rand() < .5, show = (p, i) => i % 2 ? N(p[0] / p[1]) : fr(...p);
    const vals = set.map(p => p[0] / p[1]); if (new Set(vals).size < 4) return fracDecimal(1);
    const best = vals.indexOf(most ? Math.max(...vals) : Math.min(...vals));
    return { topic: 'DECIMALS', text: `Which is the ${most ? 'greatest' : 'least'}?`, ...txt(show(set[best], best), set.map(show).filter((s, i) => i !== best)),
      steps: [`Write them all as decimals: ${set.map(p => N(p[0] / p[1])).join(', ')}.`, `The ${most ? 'greatest' : 'least'} is ${show(set[best], best)}.`] };
  };
  // 4th grade (IXL Y): adding and subtracting fractions when one bottom is a multiple of the other.
  const fracUnlike4 = d => {
    const [b1, b2] = pick([[2, 4], [2, 8], [4, 8], [3, 6], [5, 10], [2, 6], [2, 10], [3, 12], [4, 12], [10, 100]]), a1 = coprime(b1), a2 = R(1, b2 - 1), k = b2 / b1, sub = rand() < .4 && a1 * k > a2;
    const top = sub ? a1 * k - a2 : a1 * k + a2, ans = [top, b2];
    return { topic: 'FRACTIONS', text: `${fr(a1, b1)} ${sub ? '-' : '+'} ${fr(a2, b2)} = ?`, ...fracs(ans, [[sub ? a1 - a2 : a1 + a2, sub ? b2 - b1 : b1 + b2], [sub ? Math.abs(a1 - a2) : a1 + a2, b2], [top + 1, b2], [top, b2 * 2]].filter(q => q[1] > 0 && q[0] > 0), p => mx(p[0], p[1], false)),
      steps: [`Make the bottoms match: ${fr(a1, b1)} = ${fr(a1 * k, b2)}.`, `${fr(a1 * k, b2)} ${sub ? '-' : '+'} ${fr(a2, b2)} = ${fr(top, b2)}`, mx(top, b2, false) !== fr(top, b2) ? `= ${mx(top, b2, false)}` : 'Done.'] };
  };

  Questions.extend('3', {
    money: moneyKind(3), priceList: priceListKind(3), calendar: calendarKind(3), schedule: scheduleKind(3), temperature: temperatureKind(3), roman: romanKind(3), probability: probabilityKind(3),
    tally: tallyKind, solids: solidsKind(3), polygons: polygonsKind(3), inputOutput: inputOutputKind(3), venn: vennKind(3), logic: logicKind(3), budget: budgetKind(3), transform: transformKind(3), congruent: congruentKind(false),
    placeValue: () => G4.placeValue(1), compareNumbers: d => G4.compareNumbers(Math.min(2, d)), multiply2: () => G4.multiply(1),
  }, { roman: 2, venn: 2, logic: 2, transform: 2, congruent: 2, multiply2: 3 });
  Questions.extend('4', {
    money: moneyKind(4), priceList: priceListKind(4), calendar: calendarKind(4), schedule: scheduleKind(4), temperature: temperatureKind(4), roman: romanKind(4), probability: probabilityKind(4),
    freqTable: freqKind(4), stemLeaf: stemLeafKind(4), stats: statsKind(4), lineGraph: lineGraphKind(4), solids: solidsKind(4), polygons: polygonsKind(4), inputOutput: inputOutputKind(4), shapePattern,
    venn: vennKind(4), logic: logicKind(4), budget: budgetKind(4), estimate: estimateKind(4), transform: transformKind(4), congruent: congruentKind(false),
    coordinates: d => d >= 3 && rand() < .4 ? G5.coordWord(d) : G5.coordPoints(d), decimalAddSub: d => G5.decimalAddSub(Math.min(2, d)), fracUnlike: fracUnlike4,
  }, { stemLeaf: 2, stats: 2, logic: 2, transform: 2, decimalAddSub: 3, fracUnlike: 3 });
  Questions.extend('5', {
    money: moneyKind(5), schedule: scheduleKind(5), temperature: temperatureKind(5), roman: romanKind(5), probability: probabilityKind(5), freqTable: freqKind(5), stemLeaf: stemLeafKind(5), stats: statsKind(5),
    lineGraph: lineGraphKind(5), solids: solidsKind(5), polygons: polygonsKind(5), inputOutput: inputOutputKind(5), logic: logicKind(5), budget: budgetKind(5), estimate: estimateKind(5), transform: transformKind(5),
    similar: congruentKind(true), triangleAngles, primeFactor, divisibility, gcfLcm, exponents, integers, percents, ratios, variableExpr, fracDecimal,
  }, { gcfLcm: 2, exponents: 2, percents: 2, variableExpr: 2, similar: 2, integers: 3, ratios: 3 });
})();
