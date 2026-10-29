'use strict';
// Diagram questions: the SAT's geometry figures, graphs, charts and tables, drawn as crisp pixel
// art. Each generator returns a question like the ones in questions.js plus `fig`, a function that
// draws the diagram into a box. Lines are plotted pixel by pixel so nothing blurs.

const Figures = (() => {
  const INK = '#e8ecf8', DIM = '#5a6488', GRID = '#262e50', HOT = '#f8d040', RED = '#f05a5a', GRN = '#60e080', BLU = '#60a8f8';
  const nz = (a, b) => { let v; do v = randInt(a, b); while (v === 0); return v; };

  // Bresenham line, optionally dashed.
  function line(c, x0, y0, x1, y1, col, dash = 0) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, n = 0;
    c.fillStyle = col;
    for (;;) {
      if (!dash || (n++ % (dash * 2)) < dash) c.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  function circle(c, cx, cy, r, col) {
    c.fillStyle = col;
    let x = r, y = 0, err = 1 - r;
    while (x >= y) {
      for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) c.fillRect(Math.round(cx + a), Math.round(cy + b), 1, 1);
      y++;
      if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
    }
  }
  function arc(c, cx, cy, r, a0, a1, col) {
    c.fillStyle = col;
    const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) * r));
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; c.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy - Math.sin(a) * r), 1, 1); }
  }
  const label = (c, s, x, y, col = INK, align = 'center') => Font.draw(c, s, x, y - 4, col, { align, outline: '#0c1028' });
  const rightMark = (c, x, y, sx, sy, col = DIM) => { line(c, x + 5 * sx, y, x + 5 * sx, y + 5 * sy, col); line(c, x, y + 5 * sy, x + 5 * sx, y + 5 * sy, col); };

  // A coordinate grid in a w x h box: returns a mapper from math to pixel coordinates.
  function grid(c, w, h, xr, yr, xs = 1, ys = 1) {
    const [x0, x1] = xr, [y0, y1] = yr;
    const sx = (w - 1) / (x1 - x0), sy = (h - 1) / (y1 - y0);
    const P = (x, y) => [Math.round((x - x0) * sx), Math.round((y1 - y) * sy)];
    for (let x = Math.ceil(x0 / xs) * xs; x <= x1; x += xs) line(c, P(x, 0)[0], 0, P(x, 0)[0], h - 1, GRID);
    for (let y = Math.ceil(y0 / ys) * ys; y <= y1; y += ys) line(c, 0, P(0, y)[1], w - 1, P(0, y)[1], GRID);
    const [ox, oy] = P(0, 0);
    if (ox >= 0 && ox < w) line(c, ox, 0, ox, h - 1, DIM);
    if (oy >= 0 && oy < h) line(c, 0, oy, w - 1, oy, DIM);
    return P;
  }
  // Plot y = f(x) across the grid.
  function plot(c, P, f, xr, col) {
    let prev = null;
    for (let x = xr[0]; x <= xr[1] + 1e-9; x += (xr[1] - xr[0]) / 160) {
      const p = P(x, f(x));
      if (prev && Math.abs(p[1] - prev[1]) < 60) line(c, prev[0], prev[1], p[0], p[1], col);
      prev = p;
    }
  }
  const dot = (c, p, col) => { c.fillStyle = col; c.fillRect(p[0] - 1, p[1] - 1, 3, 3); };
  const box = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  // Filled shapes, a row of pixels at a time, so the edges stay crisp.
  function disc(c, cx, cy, r, col) {
    c.fillStyle = col;
    for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(Math.max(0, r * r - y * y))); c.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); }
  }
  function fillPoly(c, pts, col) {
    c.fillStyle = col;
    const ys = pts.map(p => p[1]), top = Math.round(Math.min(...ys)), bot = Math.round(Math.max(...ys));
    for (let y = top; y <= bot; y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
        if ((y0 <= y + .5 && y1 > y + .5) || (y1 <= y + .5 && y0 > y + .5)) xs.push(x0 + (y + .5 - y0) / (y1 - y0) * (x1 - x0));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) c.fillRect(Math.round(xs[i]), y, Math.max(1, Math.round(xs[i + 1]) - Math.round(xs[i])), 1);
    }
  }
  const outlinePoly = (c, pts, col) => pts.forEach((p, i) => line(c, ...p, ...pts[(i + 1) % pts.length], col));
  // Little pictures to count: 9 x 9 pixel art, one letter per colour.
  const PAL = { k: '#101018', r: '#e83838', g: '#48c048', y: '#f8d840', b: '#4890f0', o: '#f89030', w: '#f8f8f8', n: '#c88a48', c: '#4a2410', p: '#f070c0', v: '#a060e0', s: '#a8b0c0' };
  const ICONS = {
    apple: ['....cg...', '...cg....', '.krrkrrk.', 'krwrrrrrk', 'krwrrrrrk', 'krrrrrrrk', 'krrrrrrrk', '.krrrrrk.', '..kk.kk..'],
    star: ['....y....', '....y....', '...yyy...', 'yyyyyyyyy', '.yyyyyyy.', '..yyyyy..', '..yyyyy..', '.yy...yy.', 'y.......y'],
    ball: ['..kkkkk..', '.kbbwrrk.', 'kbbbwrrrk', 'kbbbwrrrk', 'kwwwwwwwk', 'kyyywgggk', 'kyyywgggk', '.kyywggk.', '..kkkkk..'],
    fish: ['.........', '...ooo..o', '.oooooooo', 'okoooooo.', 'oooooooo.', '.oooooooo', '...ooo..o', '.........', '.........'],
    cookie: ['..nnnnn..', '.nnnnnnn.', 'nncnnnnnn', 'nnnnncnnn', 'ncnnnnnnn', 'nnnnnnncn', 'nnnncnnnn', '.nnnnnnn.', '..nnnnn..'],
    flower: ['...ppp...', '..ppppp..', '.pppyppp.', '..ppppp..', '...ppp...', '....g....', '..g.g....', '...gg.g..', '....gg...'],
    heart: ['.rr...rr.', 'rrrr.rrrr', 'rrrrrrrrr', 'rrrrrrrrr', '.rrrrrrr.', '..rrrrr..', '...rrr...', '....r....', '.........'],
    block: ['kkkkkkkkk', 'kbbbbbbwk', 'kbbbbbbbk', 'kbbbbbbbk', 'kbbbbbbbk', 'kbbbbbbbk', 'kbbbbbbbk', 'kbbbbbbbk', 'kkkkkkkkk'],
    balloon: ['..vvvv...', '.vvvvvv..', 'vvwvvvvv.', 'vvwvvvvv.', 'vvvvvvvv.', '.vvvvvv..', '..vvvv...', '...vv....', '....s....'],
  };
  const ICON_NAMES = { apple: 'apples', star: 'stars', ball: 'balls', fish: 'fish', cookie: 'cookies', flower: 'flowers', heart: 'hearts', block: 'blocks', balloon: 'balloons' };
  function icon(c, name, x, y) {
    ICONS[name].forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') { c.fillStyle = PAL[row[i]]; c.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1); } });
  }

  // Same choice builders as questions.js: numeric choices smallest first.
  function numeric(answer, wrongs, fmt = String) {
    const vals = [answer];
    const ok = v => Number.isFinite(v) && (!Number.isInteger(answer) || Number.isInteger(v)) && !vals.some(u => Math.abs(u - v) < 1e-9 || fmt(u) === fmt(v));
    for (const w of wrongs) if (vals.length < 4 && ok(w)) vals.push(w);
    for (let k = 1; vals.length < 4; k++) for (const w of [answer + k, answer - k]) if (vals.length < 4 && ok(w)) vals.push(w);
    vals.sort((a, b) => a - b);
    return { choices: vals.map(fmt), answer: vals.indexOf(answer) };
  }
  function textual(right, wrongs) {
    const all = [right];
    for (const w of wrongs) if (all.length < 4 && !all.includes(w)) all.push(w);
    shuffle(all);
    return { choices: all, answer: all.indexOf(right) };
  }
  function frac(n, d) {
    const g = (a, b) => b ? g(b, a % b) : a, k = g(Math.abs(n), Math.abs(d));
    return `${n / k}/${d / k}`;
  }

  const F = {};

  F.triangleAngles = () => {
    const a = randInt(4, 9) * 5 + randInt(0, 4), b = randInt(5, 11) * 5 + randInt(0, 4), x = 180 - a - b;
    return {
      topic: 'GEOMETRY', text: 'In the triangle shown, what is the value of x?',
      ...numeric(x, [a + b, 180 - a, 90 - a, 360 - a - b, x + 10]),
      steps: ['The angles of a triangle add up to 180°.', `${a} + ${b} + x = 180`, `x = 180 - ${a + b} = ${x}`],
      fig: (c, w, h) => {
        // Drawn to scale: the apex is where the two base angles' sides meet.
        const ta = Math.tan(a * DEG), tb = Math.tan(b * DEG), cx = tb / (ta + tb), cy = cx * ta;
        const s = Math.min(w - 16, (h - 16) / cy), x0 = Math.round((w - s) / 2);
        const A = [x0, h - 6], B = [x0 + s, h - 6], C = [x0 + cx * s, h - 6 - cy * s];
        line(c, ...A, ...B, INK); line(c, ...B, ...C, INK); line(c, ...C, ...A, INK);
        // A flat triangle has no room for x inside it, by the base angles: it goes just above the apex.
        const inside = cy * s > 28;
        label(c, a + '°', A[0] + 16, A[1] - 6); label(c, b + '°', B[0] - 16, B[1] - 6); label(c, 'x°', C[0], inside ? C[1] + 14 : C[1] - 7, HOT);
      },
    };
  };

  F.parallelLines = () => {
    const a = randInt(8, 16) * 5, same = rand() < .4, x = same ? a : 180 - a;
    return {
      topic: 'GEOMETRY', text: 'In the figure, lines m and n are parallel. What is the value of x?',
      ...numeric(x, [180 - x, 90 - a / 2, 360 - a, a / 2]),
      steps: same
        ? ['A line crossing two parallel lines makes', 'matching angles in the same spot: they are equal.', `x = ${a}`]
        : ['Angles on the same side of the crossing line', `between the parallels add to 180°.`, `x = 180 - ${a} = ${x}`],
      fig: (c, w, h) => {
        // The crossing line leaves m at a° measured up from the right, so the picture matches the numbers.
        const y1 = 16, y2 = h - 16, run = 1 / Math.tan(a * DEG), xa = Math.round(w / 2 + (y2 - y1) * run / 2), xb = xa - (y2 - y1) * run;
        line(c, 2, y1, w - 12, y1, INK); line(c, 2, y2, w - 12, y2, INK);
        label(c, 'm', w - 6, y1, DIM); label(c, 'n', w - 6, y2, DIM);
        line(c, xa + 12 * run, y1 - 12, xb - 12 * run, y2 + 12, INK);
        label(c, a + '°', xa + 13, y1 - 6);
        if (same) label(c, 'x°', xb + 13, y2 - 6, HOT); else label(c, 'x°', xb - 11, y2 - 6, HOT);
      },
    };
  };

  F.rightTrig = () => {
    const [p, q, r] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]);
    const fn = pick(['sin', 'cos', 'tan']);
    const right = fn === 'sin' ? frac(p, r) : fn === 'cos' ? frac(q, r) : frac(p, q);
    return {
      topic: 'TRIGONOMETRY', text: `In right triangle ABC, what is ${fn} A?`,
      ...textual(right, [frac(q, r), frac(p, r), frac(p, q), frac(q, p), frac(r, p)].filter(v => v !== right)),
      steps: ['SOH CAH TOA. From angle A:', `opposite = ${p}, adjacent = ${q}, hypotenuse = ${r}`,
        `${fn} A = ${fn === 'sin' ? 'opp/hyp' : fn === 'cos' ? 'adj/hyp' : 'opp/adj'} = ${right}`],
      fig: (c, w, h) => {
        const A = [6, h - 8], B = [w - 14, h - 8], C = [w - 14, 8];
        line(c, ...A, ...B, INK); line(c, ...B, ...C, INK); line(c, ...C, ...A, INK);
        rightMark(c, B[0], B[1], -1, -1);
        label(c, 'A', A[0] - 2, A[1] + 6, HOT); label(c, 'B', B[0] + 6, B[1] + 4); label(c, 'C', C[0] + 6, C[1]);
        label(c, String(q), (A[0] + B[0]) / 2, B[1] + 6); label(c, String(p), B[0] + 8, (B[1] + C[1]) / 2);
        label(c, String(r), (A[0] + C[0]) / 2 - 6, (A[1] + C[1]) / 2 - 6);
      },
    };
  };

  F.circle = () => {
    const r = randInt(2, 9), area = rand() < .6;
    const pi = n => n + 'π';
    return {
      topic: 'GEOMETRY', text: `The circle shown has center O and radius ${r}. What is its ${area ? 'area' : 'circumference'}?`,
      ...numeric(area ? r * r : 2 * r, area ? [2 * r, 4 * r * r, r, 2 * r * r] : [r * r, r, 4 * r], pi),
      steps: area ? ['Area = π r^2', `= π × ${r}^2`, `= ${r * r}π`] : ['Circumference = 2π r', `= 2π × ${r}`, `= ${2 * r}π`],
      fig: (c, w, h) => {
        const R = Math.min(w, h) / 2 - 4, cx = Math.round(w / 2), cy = Math.round(h / 2);
        circle(c, cx, cy, R, INK);
        dot(c, [cx, cy], HOT); line(c, cx, cy, cx + R, cy, HOT);
        label(c, 'O', cx - 6, cy + 2); label(c, String(r), cx + R / 2, cy - 5, HOT);
      },
    };
  };

  F.box = () => {
    const l = randInt(3, 9), wd = randInt(2, 6), ht = randInt(2, 7), v = l * wd * ht;
    return {
      topic: 'GEOMETRY', text: 'What is the volume, in cubic units, of the box shown?',
      ...numeric(v, [l + wd + ht, 2 * (l * wd + wd * ht + l * ht), l * wd, v / 2]),
      steps: ['Volume = length × width × height', `= ${l} × ${wd} × ${ht}`, `= ${v}`],
      fig: (c, w, h) => {
        const dx = 14, dy = 10, x0 = 8, y0 = h - 10, bw = w - dx - 22, bh = h - dy - 22;
        const f = [[x0, y0], [x0 + bw, y0], [x0 + bw, y0 - bh], [x0, y0 - bh]];
        const b = f.map(([x, y]) => [x + dx, y - dy]);
        line(c, ...b[0], ...b[1], DIM, 2); line(c, ...b[0], ...b[3], DIM, 2); line(c, ...b[0], ...f[0], DIM, 2);
        for (let i = 0; i < 4; i++) line(c, ...f[i], ...f[(i + 1) % 4], INK);
        line(c, ...f[1], ...b[1], INK); line(c, ...f[2], ...b[2], INK); line(c, ...f[3], ...b[3], INK);
        line(c, ...b[1], ...b[2], INK); line(c, ...b[2], ...b[3], INK);
        label(c, String(l), x0 + bw / 2, y0 + 6); label(c, String(ht), x0 - 4, y0 - bh / 2); label(c, String(wd), x0 + bw + dx / 2 + 6, y0 - dy / 2 + 2);
      },
    };
  };

  F.similar = () => {
    const k = randInt(2, 3), ad = randInt(2, 6), de = randInt(2, 7), ab = ad * k, bc = de * k;
    return {
      topic: 'GEOMETRY', text: `In the figure, DE is parallel to BC. AD = ${ad}, AB = ${ab} and DE = ${de}. What is BC?`,
      ...numeric(bc, [de + (ab - ad), de * ad, ab, de + k]),
      steps: ['DE parallel to BC makes the triangles similar.', `AB is ${ab} / ${ad} = ${k} times AD.`, `So BC = ${k} × ${de} = ${bc}`],
      fig: (c, w, h) => {
        const A = [Math.round(w / 2), 4], B = [6, h - 6], C = [w - 6, h - 6], t = 1 / k;
        const D = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t], E = [A[0] + (C[0] - A[0]) * t, A[1] + (C[1] - A[1]) * t];
        line(c, ...A, ...B, INK); line(c, ...A, ...C, INK); line(c, ...B, ...C, INK); line(c, ...D, ...E, BLU);
        label(c, 'A', A[0] + 7, A[1] + 3); label(c, 'B', B[0], B[1] + 6); label(c, 'C', C[0], C[1] + 6);
        label(c, 'D', D[0] - 7, D[1]); label(c, 'E', E[0] + 7, E[1]);
      },
    };
  };

  F.graphLine = d => {
    const m = d < 2 ? nz(-3, 3) : pick([-3, -2, -1, -1 / 2, 1 / 2, 1, 2, 3, 2 / 3, -2 / 3]), b = randInt(-3, 3);
    const show = v => Number.isInteger(v) ? String(v) : (v < 0 ? '-' : '') + frac(Math.abs(Math.round(v * 6)), 6);
    const coef = mm => mm === 1 ? '' : mm === -1 ? '-' : Number.isInteger(mm) ? show(mm) : mm < 0 ? `-(${show(-mm)})` : `(${show(mm)})`;
    const eq = (mm, bb) => `y = ${coef(mm)}x${bb ? (bb < 0 ? ' - ' + -bb : ' + ' + bb) : ''}`;
    const askEq = d >= 2 && rand() < .5;
    const base = {
      topic: 'LINES',
      fig: (c, w, h) => { const P = grid(c, w, h, [-6, 6], [-5, 5]); plot(c, P, x => m * x + b, [-6, 6], HOT); dot(c, P(0, b), RED); },
    };
    if (askEq) {
      return Object.assign(base, {
        text: 'Which equation describes the line in the graph?',
        ...textual(eq(m, b), [eq(-m, b), eq(m, -b), eq(1 / m, b), eq(-m, -b), eq(m, b + 2), eq(-1 / m, b), eq(m, b - 2), eq(-m, b + 1), eq(m + 1, b)].filter(e => e !== eq(m, b))),
        steps: [`It crosses the y-axis at ${b}, so b = ${b}.`, `Rise over run between two grid points: ${show(m)}`, `So ${eq(m, b)}`],
      });
    }
    return Object.assign(base, {
      text: 'What is the slope of the line shown in the graph?',
      ...numeric(m, [-m, 1 / m, -1 / m, b], show),
      steps: ['Pick two points where the line crosses the grid.', 'Slope = rise / run', `= ${show(m)}`],
    });
  };

  F.graphSystem = () => {
    let x, y; do { x = nz(-3, 3); y = nz(-3, 3); } while (x === y || x === -y);
    let m1, m2; do { m1 = nz(-2, 2); m2 = nz(-2, 2); } while (m1 === m2);
    const pt = (a, b) => `(${a}, ${b})`;
    return {
      topic: 'SYSTEMS', text: 'The graph shows a system of two linear equations. What is the solution (x, y) of the system?',
      ...textual(pt(x, y), [pt(y, x), pt(-x, y), pt(x, -y), pt(0, y - m1 * x), pt(x + 1, y)].filter(s => s !== pt(x, y))),
      steps: ['The solution of a system is where the lines cross.', `They cross at x = ${x}, y = ${y}.`, `So the solution is ${pt(x, y)}.`],
      fig: (c, w, h) => {
        const P = grid(c, w, h, [-6, 6], [-5, 5]);
        plot(c, P, t => y + m1 * (t - x), [-6, 6], HOT); plot(c, P, t => y + m2 * (t - x), [-6, 6], BLU); dot(c, P(x, y), RED);
      },
    };
  };

  F.parabola = () => {
    const hx = randInt(-3, 3), k = randInt(-4, 3), a = rand() < .5 ? 1 : -1;
    const ask = pick(['vertex', 'min']);
    const pt = (p, q) => `(${p}, ${q})`;
    const isMin = a > 0;
    if (ask === 'vertex') {
      return {
        topic: 'QUADRATICS', text: 'What are the coordinates of the vertex of the parabola shown?',
        ...textual(pt(hx, k), [pt(k, hx), pt(-hx, k), pt(hx, -k), pt(0, k), pt(hx + 1, k), pt(hx, k + 1), pt(hx - 1, k - 2)].filter(s => s !== pt(hx, k))),
        steps: [`The vertex is the turning point: the ${isMin ? 'lowest' : 'highest'} point.`, `It sits at x = ${hx}, y = ${k}.`, `Vertex: ${pt(hx, k)}`],
        fig: (c, w, h) => { const P = grid(c, w, h, [-6, 6], [-6, 6]); plot(c, P, x => a * (x - hx) ** 2 + k, [-6, 6], HOT); dot(c, P(hx, k), RED); },
      };
    }
    return {
      topic: 'QUADRATICS', text: `The graph of y = f(x) is shown. What is the ${isMin ? 'minimum' : 'maximum'} value of f(x)?`,
      ...numeric(k, [hx, -k, k + a, 0]),
      steps: [`The ${isMin ? 'minimum' : 'maximum'} value is the y at the vertex.`, `The vertex is (${hx}, ${k}).`, `So the ${isMin ? 'minimum' : 'maximum'} is ${k}. (Not ${hx}: that's x.)`],
      fig: (c, w, h) => { const P = grid(c, w, h, [-6, 6], [-6, 6]); plot(c, P, x => a * (x - hx) ** 2 + k, [-6, 6], HOT); },
    };
  };

  F.scatter = () => {
    const m = pick([1.5, 2, 2.5, 3]), b = randInt(2, 10), X = randInt(7, 9) * 2, ans = Math.round(m * X + b);
    const pts = [];
    for (let i = 0; i < 12; i++) { const x = randInt(1, 14); pts.push([x, m * x + b + randInt(-4, 4)]); }
    const top = Math.ceil((m * 20 + b) / 10) * 10;
    return {
      topic: 'DATA', text: `The scatterplot shows hours studied (x) and test score gain (y), with a line of best fit. Using the line, what gain is predicted for ${X} hours?`,
      ...numeric(ans, [Math.round(m * X), Math.round(m * (X / 2) + b), ans + 10, ans - 10]),
      steps: [`The line goes through (0, ${b}) and rises ${m} per hour.`, `At x = ${X}: ${b} + ${m} × ${X}`, `= ${ans}`],
      fig: (c, w, h) => {
        const P = grid(c, w, h, [0, 20], [0, top], 2, 10);
        for (const p of pts) dot(c, P(...p), BLU);
        plot(c, P, x => m * x + b, [0, 20], HOT);
        label(c, '0', 4, h - 6, DIM); label(c, String(top), 9, 5, DIM); label(c, '20', w - 8, h - 6, DIM);
      },
    };
  };

  F.bars = () => {
    // One- or two-letter labels, so they fit under the bars.
    const [names, where] = pick([[['MO', 'TU', 'WE', 'TH', 'FR'], 'day'], [['A', 'B', 'C', 'D', 'E'], 'store'], [['1', '2', '3', '4', '5'], 'week']]);
    // At least two different heights, or there's no pair to compare (and the pick below never ends).
    let vals; do vals = names.map(() => randInt(2, 9) * 5); while (new Set(vals).size < 2);
    let i, j; do { i = randInt(0, 4); j = randInt(0, 4); } while (vals[i] <= vals[j]);
    const what = pick(['slices of pizza sold', 'cars that drove by', 'quizzes failed']);
    const DAYS = { MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday', FR: 'Friday' };
    const at = k => where === 'day' ? DAYS[names[k]] : `${where} ${names[k]}`;
    return {
      topic: 'DATA', text: `The bar graph shows the number of ${what} by ${where}. How many more for ${at(i)} than for ${at(j)}?`,
      ...numeric(vals[i] - vals[j], [vals[i] + vals[j], vals[i], vals[j], vals[i] - vals[j] + 5]),
      steps: [`${at(i)}: ${vals[i]}.  ${at(j)}: ${vals[j]}.`, `${vals[i]} - ${vals[j]} = ${vals[i] - vals[j]}`],
      fig: (c, w, h) => {
        const base = h - 10, top = 50, bw = Math.floor((w - 20) / 5);
        for (let v = 0; v <= top; v += 10) { const y = Math.round(base - v / top * (base - 4)); line(c, 16, y, w - 1, y, GRID); label(c, String(v), 8, y + 1, DIM); }
        vals.forEach((v, k) => {
          const x = 18 + k * bw, y = Math.round(base - v / top * (base - 4));
          c.fillStyle = k === i || k === j ? HOT : BLU; c.fillRect(x, y, bw - 4, base - y);
          label(c, names[k], x + (bw - 4) / 2, base + 6, DIM);
        });
      },
    };
  };

  F.table = () => {
    const rows = ['9th', '10th'], cols = pick([['PIZZA', 'TACOS'], ['CATS', 'DOGS'], ['MATH', 'GYM']]);
    // No row splits evenly, or the wrong answers collapse into one another.
    let v; do v = [[randInt(8, 30), randInt(8, 30)], [randInt(8, 30), randInt(8, 30)]]; while (v[0][0] === v[0][1] || v[1][0] === v[1][1]);
    const r = randInt(0, 1), k = randInt(0, 1), rowTot = v[r][0] + v[r][1];
    const total = v[0][0] + v[0][1] + v[1][0] + v[1][1], colTot = v[0][k] + v[1][k];
    const right = frac(v[r][k], rowTot);
    return {
      topic: 'DATA', text: `The table shows survey answers by grade. What fraction of the ${rows[r]} graders chose ${cols[k]}?`,
      ...textual(right, [frac(v[r][k], total), frac(v[r][k], colTot), frac(v[r][1 - k], rowTot), frac(rowTot - v[r][k] + 1, rowTot), frac(v[r][k] + 1, rowTot), frac(colTot, total), frac(v[r][k] - 1, rowTot), frac(rowTot, total)].filter(s => s !== right)),
      steps: [`Only the ${rows[r]} graders count: ${v[r][0]} + ${v[r][1]} = ${rowTot}.`, `${v[r][k]} of them chose ${cols[k]}.`,
        right === `${v[r][k]}/${rowTot}` ? `So the fraction is ${right}.` : `${v[r][k]}/${rowTot} = ${right}`],
      fig: (c, w, h) => {
        const cw = Math.floor(w / 3), rh = Math.floor(h / 3);
        for (let i = 0; i <= 3; i++) { line(c, 0, Math.min(h - 1, i * rh), w - 1, Math.min(h - 1, i * rh), DIM); line(c, Math.min(w - 1, i * cw), 0, Math.min(w - 1, i * cw), h - 1, DIM); }
        cols.forEach((s, i) => label(c, s, cw * (i + 1.5), rh / 2 + 1, HOT));
        rows.forEach((s, i) => label(c, s, cw / 2, rh * (i + 1.5) + 1, HOT));
        v.forEach((row, i) => row.forEach((n, j) => label(c, String(n), cw * (j + 1.5), rh * (i + 1.5) + 1)));
      },
    };
  };

  const C = { INK, DIM, GRID, HOT, RED, GRN, BLU, BG: '#0c1028' };
  return { G: F, C, line, circle, arc, label, rightMark, grid, plot, dot, box, disc, fillPoly, outlinePoly, icon, ICONS, ICON_NAMES, PAL, numeric, textual, frac };
})();
