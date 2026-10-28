'use strict';
// Grades 6, 7 and 8: the Common Core middle-school banks (ratios, the number system, expressions and equations, functions, geometry, statistics).
(() => {
  const { textual, signed, term, lin } = Questions.kit, F = Figures, { INK, DIM, GRID, HOT, RED, GRN, BLU, BG } = F.C;

  // ---- Numbers and words
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  const lcm = (a, b) => a / gcd(a, b) * b;
  const sample = (a, k) => shuffle(a.slice()).slice(0, k);
  const NAMES = ['Ana', 'Jamal', 'Mei', 'Leo', 'Priya', 'Sam', 'Diego', 'Zoe', 'Omar', 'Kai', 'Lila', 'Noah', 'Ava', 'Ravi', 'Ruby', 'Theo', 'Nia', 'Max', 'Iris', 'Ben', 'Rosa', 'Tariq'];
  const who = () => pick(NAMES);
  const round = (v, p = 2) => { const k = 10 ** p, r = Math.round(v * k + (v >= 0 ? 1e-7 : -1e-7)) / k; return r === 0 ? 0 : r; };
  const num = (v, p = 3) => round(v, p).toLocaleString('en-US', { maximumFractionDigits: p });
  const money = v => (v < -1e-9 ? '-$' : '$') + Math.abs(round(v, 2)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = v => num(v, 1) + '%';
  // A value as a fraction in lowest terms ("-3/4"), or a whole number.
  function fs(v) {
    if (Math.abs(v - Math.round(v)) < 1e-9) return num(Math.round(v));
    for (let d = 2; d <= 1000; d++) { const n = v * d; if (Math.abs(n - Math.round(n)) < 1e-6) return (v < 0 ? '-' : '') + Math.abs(Math.round(n)) + '/' + d; }
    return num(v);
  }
  // The same as a mixed number: "2 1/2".
  function mixed(v) {
    if (Math.abs(v - Math.round(v)) < 1e-9 || Math.abs(v) < 1) return fs(v);
    const a = Math.abs(v), w = Math.floor(a + 1e-9);
    return (v < 0 ? '-' : '') + w + ' ' + fs(a - w);
  }
  const pt = (x, y) => `(${x}, ${y})`;
  const SING = { feet: 'foot', inches: 'inch', yards: 'yard', pounds: 'pound', ounces: 'ounce', gallons: 'gallon', quarts: 'quart', pints: 'pint', cups: 'cup', meters: 'meter',
    centimeters: 'centimeter', kilometers: 'kilometer', kilograms: 'kilogram', grams: 'gram', liters: 'liter', milliliters: 'milliliter', hours: 'hour', minutes: 'minute' };
  // Four numeric choices, smallest first: the answer, the mistakes that fit, then near misses (which keep the answer's sign).
  function nums(ans, wrongs, fmt = num, step = 1, ok = null) {
    const vals = [ans], seen = new Set([fmt(ans)]);
    const add = (v, near) => {
      if (vals.length >= 4 || !Number.isFinite(v) || (near && ans > 0 && v <= 0) || (ok && !ok(v))) return;
      const s = fmt(v); if (!seen.has(s)) { seen.add(s); vals.push(v); }
    };
    wrongs.forEach(v => add(v, false));
    for (let k = 1; vals.length < 4 && k < 80; k++) for (const v of [ans + k * step, ans - k * step, ans + 2 * k * step]) add(v, true);
    vals.sort((a, b) => a - b);
    return { choices: vals.map(v => fmt(v)), answer: vals.indexOf(ans) };
  }
  // The same for probabilities: every choice between 0 and 1.
  const pnums = (ans, wrongs, fmt = fs, step = .1) => nums(ans, wrongs, fmt, step, v => v > 0 && v <= 1 + 1e-9);
  // Exactly these four, in this order (letters, quadrants, "Point A"...).
  const fixed = (list, right) => ({ choices: list.slice(), answer: list.indexOf(right) });
  const ints = list => list.filter(v => Number.isInteger(v));

  // ---- Drawing
  const L = F.label;
  // A number line from lo to hi at height y: ticks every `step`, numbers every `every` ticks. Returns v => x.
  function nline(c, w, y, lo, hi, o = {}) {
    const step = o.step || 1, every = o.every || 1, fmt = o.fmt || num, x0 = o.x0 ?? 9, x1 = o.x1 ?? w - 10;
    const X = v => Math.round(x0 + (v - lo) / (hi - lo) * (x1 - x0));
    if (o.arrows === false) F.line(c, x0, y, x1, y, INK);
    else {
      F.line(c, x0 - 6, y, x1 + 6, y, INK);
      F.line(c, x0 - 6, y, x0 - 4, y - 2, INK); F.line(c, x0 - 6, y, x0 - 4, y + 2, INK);
      F.line(c, x1 + 6, y, x1 + 4, y - 2, INK); F.line(c, x1 + 6, y, x1 + 4, y + 2, INK);
    }
    const n = Math.round((hi - lo) / step);
    for (let i = 0; i <= n; i++) {
      const v = lo + i * step, x = X(v), major = i % every === 0;
      F.line(c, x, y - (major ? 3 : 2), x, y + (major ? 3 : 2), INK);
      if (major && o.labels !== false) L(c, fmt(round(v, 6)), x, y + 10, DIM);
    }
    return X;
  }
  // A point on a number line: filled, or a ring for "not included".
  function nlDot(c, x, y, open, col = HOT) { F.disc(c, x, y, 3, col); if (open) F.disc(c, x, y, 1, BG); }
  // A square-celled coordinate plane from -n to n, centred in the box. Returns (x, y) => [px, py].
  function plane(c, w, h, n, o = {}) {
    const nx = o.nx || n, ny = o.ny || n, s = Math.floor(Math.min((w - 1) / (2 * nx), (h - 1) / (2 * ny)));
    const ox = Math.floor((w - 1) / 2), oy = Math.floor((h - 1) / 2);
    const P = (x, y) => [ox + Math.round(x * s), oy - Math.round(y * s)];
    for (let i = -nx; i <= nx; i++) F.line(c, ...P(i, -ny), ...P(i, ny), GRID);
    for (let j = -ny; j <= ny; j++) F.line(c, ...P(-nx, j), ...P(nx, j), GRID);
    F.line(c, ...P(-nx, 0), ...P(nx, 0), DIM); F.line(c, ...P(0, -ny), ...P(0, ny), DIM);
    if (o.labels !== false) {
      const k = o.every || 2;
      for (let i = k; i <= nx; i += k) for (const v of [i, -i]) L(c, String(v), P(v, 0)[0], oy + 7, DIM);
      for (let j = k; j <= ny; j += k) for (const v of [j, -j]) L(c, String(v), ox - 3, P(0, v)[1] + 1, DIM, 'right');
    }
    P.s = s;
    return P;
  }
  // A first-quadrant graph, 0 to xm by 0 to ym: grid lines every xs / ys, numbers every xl / yl.
  function quad1(c, w, h, xm, ym, o = {}) {
    const left = o.left ?? 16, bottom = o.bottom ?? 10, top = 4, right = 5;
    const X = x => Math.round(left + x / xm * (w - left - right - 1)), Y = y => Math.round(h - bottom - 1 - y / ym * (h - bottom - top - 1));
    const xs = o.xs || 1, ys = o.ys || 1, xl = o.xl || xs, yl = o.yl || ys;
    for (let x = 0; x <= xm + 1e-9; x += xs) F.line(c, X(x), Y(0), X(x), Y(ym), GRID);
    for (let y = 0; y <= ym + 1e-9; y += ys) F.line(c, X(0), Y(y), X(xm), Y(y), GRID);
    F.line(c, X(0), Y(0), X(xm), Y(0), DIM); F.line(c, X(0), Y(0), X(0), Y(ym), DIM);
    if (o.labels !== false) {
      for (let x = 0; x <= xm + 1e-9; x += xl) L(c, num(x), X(x), h - bottom + 6, DIM);
      for (let y = yl; y <= ym + 1e-9; y += yl) L(c, num(y), left - 3, Y(y) + 1, DIM, 'right');
    }
    return (x, y) => [X(x), Y(y)];
  }
  // A table of strings; the first row (and with headCol the first column) in gold, "?" in red.
  function table(c, w, h, rows, o = {}) {
    const nr = rows.length, nc = rows[0].length, first = o.first || 0;
    const rest = Math.floor((w - 1 - first) / (nc - (first ? 1 : 0))), xs = [0];
    for (let j = 0; j < nc; j++) xs.push(xs[j] + (j === 0 && first ? first : rest));
    const rh = Math.floor((h - 1) / nr);
    for (let i = 0; i <= nr; i++) F.line(c, 0, i * rh, xs[nc], i * rh, DIM);
    for (let j = 0; j <= nc; j++) F.line(c, xs[j], 0, xs[j], nr * rh, DIM);
    rows.forEach((r, i) => r.forEach((s, j) => {
      const head = (o.headRow !== false && i === 0) || (o.headCol && j === 0);
      L(c, String(s), Math.round((xs[j] + xs[j + 1]) / 2) + 1, i * rh + Math.round(rh / 2) + 2, s === '?' ? RED : head ? HOT : INK);
    }));
  }
  // A dot plot: a column of dots over each value from lo to hi.
  function dotPlot(c, w, h, lo, hi, counts, o = {}) {
    const y = h - 13, X = nline(c, w, y, lo, hi, { arrows: false, every: o.every || 1, x0: 10, x1: w - 11 });
    counts.forEach((k, i) => { for (let j = 0; j < k; j++) F.disc(c, X(lo + i), y - 6 - j * 6, 2, o.col || BLU); });
    return X;
  }
  // A box plot at height y over an axis X: f = [min, Q1, median, Q3, max].
  function boxPlot(c, X, y, f, col = HOT) {
    const [a, b, m, d, e] = f.map(X);
    F.line(c, a, y, b, y, INK); F.line(c, d, y, e, y, INK);
    F.line(c, a, y - 3, a, y + 3, INK); F.line(c, e, y - 3, e, y + 3, INK);
    F.outlinePoly(c, [[b, y - 6], [d, y - 6], [d, y + 6], [b, y + 6]], col);
    F.line(c, m, y - 6, m, y + 6, col);
  }
  // Where a ray from (vx, vy) at deg degrees (counterclockwise from east) is r pixels out.
  const at = (vx, vy, deg, r) => [Math.round(vx + Math.cos(deg * DEG) * r), Math.round(vy - Math.sin(deg * DEG) * r)];
  const ray = (c, vx, vy, deg, r, col = INK) => { const e = at(vx, vy, deg, r); F.line(c, vx, vy, ...e, col); return e; };
  // A box in perspective with its length, height and width written on it.
  function prism(c, w, h, labs, o = {}) {
    const dx = o.dx ?? 16, dy = o.dy ?? 11, x0 = 6, bw = o.bw ?? w - dx - 44, bh = o.bh ?? h - dy - 18, y0 = 4 + dy + bh;
    const f = [[x0, y0], [x0 + bw, y0], [x0 + bw, y0 - bh], [x0, y0 - bh]], b = f.map(([x, y]) => [x + dx, y - dy]);
    F.line(c, ...b[0], ...b[1], DIM, 2); F.line(c, ...b[0], ...b[3], DIM, 2); F.line(c, ...b[0], ...f[0], DIM, 2);
    for (let i = 0; i < 4; i++) F.line(c, ...f[i], ...f[(i + 1) % 4], INK);
    F.line(c, ...f[1], ...b[1], INK); F.line(c, ...f[2], ...b[2], INK); F.line(c, ...f[3], ...b[3], INK);
    F.line(c, ...b[1], ...b[2], INK); F.line(c, ...b[2], ...b[3], INK);
    if (labs) {
      L(c, labs[0], x0 + bw / 2, y0 + 7);
      L(c, labs[1], x0 + bw + dx + 4, y0 - dy - bh / 2 + 1, INK, 'left');
      L(c, labs[2], x0 + bw + dx / 2 + 5, y0 - dy / 2 + 3, INK, 'left');
    }
  }
  // An ellipse, pixel by pixel; dashed for the hidden back half when `back` is set.
  function ellipse(c, cx, cy, rx, ry, col, back = false) {
    c.fillStyle = col;
    const n = Math.max(24, Math.round((rx + ry) * 4));
    for (let i = 0; i < n; i++) {
      const t = i / n * 2 * Math.PI, x = Math.round(cx + Math.cos(t) * rx), y = Math.round(cy - Math.sin(t) * ry);
      if (back && Math.sin(t) > 0 && i % 4 > 1) continue;
      c.fillRect(x, y, 1, 1);
    }
  }

  // ======================================================================
  // 6th grade
  // ======================================================================
  const ICONS2 = ['apple', 'star', 'ball', 'fish', 'cookie', 'flower', 'heart', 'balloon'];
  const rt = (a, b) => `${a}:${b}`;
  // Every ratio of two of the counts except the right one and anything equal to it.
  const ratioPool = (p, q, counts, fr = rt) => {
    const out = [];
    for (const x of counts) for (const y of counts) if (x !== y && x * q !== y * p) out.push(fr(x, y));
    return shuffle([...new Set(out)]);
  };
  const SHELTER = [['at the shelter', 'cats', 'dogs', 'pets'], ['in the art box', 'markers', 'crayons', 'art tools'], ['on the bus', 'boys', 'girls', 'kids'],
    ['in the fish tank', 'goldfish', 'guppies', 'fish'], ['at the arcade', 'racing games', 'pinball games', 'games'], ['in the garden', 'tulips', 'daisies', 'flowers']];

  const g6 = {
    // 6.RP.1
    ratioWords: d => {
      const f = pick(d < 2 ? ['pic', 'pic', 'words'] : ['pic', 'words', 'simplest', 'equiv']);
      if (f === 'pic') {
        const [i1, i2] = sample(ICONS2, 2), [a, b] = sample([2, 3, 4, 5, 6], 2), n1 = F.ICON_NAMES[i1], n2 = F.ICON_NAMES[i2];
        const ask = pick(['AB', 'BA', 'AW']);
        const [p, q, X, Y] = ask === 'AB' ? [a, b, n1, n2] : ask === 'BA' ? [b, a, n2, n1] : [a, a + b, n1, 'all the pictures'];
        return {
          topic: 'RATIOS', text: `What is the ratio of ${X} to ${Y}?`, ...textual(rt(p, q), ratioPool(p, q, [a, b, a + b])),
          steps: [`Count: ${a} ${n1} and ${b} ${n2}${ask === 'AW' ? `, ${a + b} in all` : ''}.`, `${X} first, then ${Y}.`, `The ratio is ${rt(p, q)}.`],
          size: [74, 26], fig: c => { for (let i = 0; i < a; i++) F.icon(c, i1, 4 + i * 11, 3); for (let i = 0; i < b; i++) F.icon(c, i2, 4 + i * 11, 14); },
        };
      }
      if (f === 'words') {
        const [a, b] = sample([2, 3, 4, 5, 6, 7, 8, 9], 2), [place, A, B, all] = pick(SHELTER), ask = pick(['AB', 'BA', 'AW', 'BW']);
        const [p, q, X, Y] = ask === 'AB' ? [a, b, A, B] : ask === 'BA' ? [b, a, B, A] : ask === 'AW' ? [a, a + b, A, 'all the ' + all] : [b, a + b, B, 'all the ' + all];
        const fr = pick([rt, (m, n) => `${m} to ${n}`]);
        return {
          topic: 'RATIOS', text: `There are ${a} ${A} for every ${b} ${B} ${place}. What is the ratio of ${X} to ${Y}?`,
          ...textual(fr(p, q), ratioPool(p, q, [a, b, a + b], fr)),
          steps: [`${A}: ${a}. ${B}: ${b}.${ask[1] === 'W' ? ` Together: ${a + b}.` : ''}`, `Write ${X} first, then ${Y}.`, `The ratio is ${fr(p, q)}.`],
        };
      }
      if (f === 'simplest') {
        const g = randInt(2, 6), [m, n] = shuffle(pick([[1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [1, 4], [3, 7], [5, 6], [4, 7]]).slice());
        const A = g * m, B = g * n, [S, X, Y] = pick([[`The chess club has ${A} girls and ${B} boys.`, 'girls', 'boys'],
          [`${who()} has ${A} red pens and ${B} blue pens.`, 'red pens', 'blue pens'], [`A pizza has ${A} cheese slices and ${B} veggie slices.`, 'cheese slices', 'veggie slices'],
          [`The class pet ate ${A} carrots and ${B} apples this week.`, 'carrots', 'apples']]);
        const rev = rand() < .5, [p, q] = rev ? [n, m] : [m, n];
        return {
          topic: 'RATIOS', text: `${S} What is the ratio of ${rev ? Y : X} to ${rev ? X : Y} in simplest form?`,
          ...textual(rt(p, q), ratioPool(p, q, [m, n, m + n])),
          steps: [`${rev ? Y : X} to ${rev ? X : Y} is ${rt(rev ? B : A, rev ? A : B)}.`, `Divide both by ${g}, the GCF.`, `${rt(rev ? B : A, rev ? A : B)} = ${rt(p, q)}`],
        };
      }
      const [a, b] = sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 2), k = randInt(2, 5);
      const cand = [[a + k, b + k], [b * k, a * k], [a * k, b + k], [a + k, b * k], [a * k, b * k + 1], [a * k + 1, b * k], [a * k + k, b * k]];
      return {
        topic: 'RATIOS', text: `Which ratio is equivalent to ${rt(a, b)}?`,
        ...textual(rt(a * k, b * k), shuffle(cand.filter(([p, q]) => p * b !== q * a).map(([p, q]) => rt(p, q)))),
        steps: ['Multiply both parts by the same number.', `${a} × ${k} = ${a * k} and ${b} × ${k} = ${b * k}`, `So ${rt(a, b)} = ${rt(a * k, b * k)}.`],
      };
    },

    // 6.RP.2, 6.RP.3b
    unitRate: d => {
      const f = pick(['price', 'rate', 'best', 'scale']);
      if (f === 'price') {
        const n = randInt(3, d < 3 ? 8 : 12), u = randInt(d < 2 ? 4 : 7, d < 2 ? 15 : 45) * 5, tot = n * u / 100;
        const [pl, sg] = pick([['juice boxes', 'juice box'], ['granola bars', 'granola bar'], ['pencils', 'pencil'], ['tennis balls', 'tennis ball'], ['tacos', 'taco'], ['comic books', 'comic book']]);
        return {
          topic: 'UNIT RATES', text: `${n} ${pl} cost ${money(tot)}. What is the price of 1 ${sg}?`,
          ...nums(u / 100, [round(tot / (n - 1)), round(tot / (n + 1)), (u + 10) / 100, tot - n].filter(v => v > 0), money, .05),
          steps: ['Unit price = total cost ÷ number of items', `${money(tot)} ÷ ${n} = ${money(u / 100)}`],
        };
      }
      if (f === 'rate') {
        const [verb, A, B] = pick([['reads', 'pages', 'hours'], ['types', 'words', 'minutes'], ['bikes', 'miles', 'hours'], ['earns', 'dollars', 'hours'], ['scores', 'points', 'games'], ['folds', 'paper cranes', 'minutes']]);
        const n = randInt(2, d < 2 ? 5 : 9), r = randInt(3, d < 2 ? 12 : 30), T = r * n, sg = B.replace(/s$/, '');
        return {
          topic: 'UNIT RATES', text: `${who()} ${verb} ${T} ${A} in ${n} ${B}. What is the unit rate in ${A} per ${sg}?`,
          ...nums(r, [T - n, T * n, T + n, r + n]),
          steps: [`Unit rate: ${A} ÷ ${B}`, `${T} ÷ ${n} = ${r} ${A} per ${sg}`],
        };
      }
      if (f === 'best') {
        const ns = sample([4, 5, 6, 8, 10, 12, 15, 20], 4), us = sample([20, 25, 30, 35, 40, 45, 50, 55, 60, 75], 4);
        const opts = ns.map((n, i) => ({ n, u: us[i], s: `${n} for ${money(n * us[i] / 100)}` }));
        const best = opts.reduce((a, b) => b.u < a.u ? b : a), item = pick(['trading cards', 'markers', 'bouncy balls', 'erasers', 'glow sticks']);
        return {
          topic: 'UNIT RATES', text: `Which pack of ${item} is the best buy?`, ...textual(best.s, opts.filter(o => o !== best).map(o => o.s)),
          steps: ['Divide each price by the count to get the price of 1:', opts.map(o => `${o.n} → ${money(o.u / 100)}`).join(',  '), `${best.s} costs least per item: ${money(best.u / 100)}.`],
        };
      }
      const a = randInt(2, 9) * (d < 3 ? 5 : 3), m = randInt(2, 5), k = m + randInt(1, 6);
      const [S, Q] = pick([[`A car goes ${a * m} miles on ${m} gallons of gas.`, `how far can it go on ${k} gallons?`],
        [`${who()} earns $${a * m} for ${m} hours of dog walking.`, `how many dollars for ${k} hours?`],
        [`A printer prints ${a * m} pages in ${m} minutes.`, `how many pages in ${k} minutes?`],
        [`A robot kit uses ${a * m} bolts for ${m} robots.`, `how many bolts for ${k} robots?`]]);
      return {
        topic: 'UNIT RATES', text: `${S} At this rate, ${Q}`, ...nums(a * k, [a * m + (k - m), a * m * k, a * (k - 1)]),
        steps: [`Unit rate: ${a * m} ÷ ${m} = ${a} for each 1.`, `${a} × ${k} = ${a * k}`],
      };
    },

    // 6.RP.3a
    ratioTable: d => {
      const [L1, L2] = pick([['CUPS', 'COOKIES'], ['LAPS', 'MINUTES'], ['HOURS', 'DOLLARS'], ['PACKS', 'STICKERS'], ['GALLONS', 'MILES'], ['BOXES', 'CRAYONS']]);
      let a = randInt(1, d < 2 ? 4 : 6), b = randInt(2, d < 2 ? 6 : 12); if (a === b) b++;
      const ms = d < 2 ? [1, 2, 3, 4] : pick([[1, 2, 4, 5], [2, 3, 5, 8], [1, 3, 4, 6], [2, 4, 6, 10], [3, 5, 6, 9]]);
      const top = ms.map(m => a * m), bot = ms.map(m => b * m), l1 = L1.toLowerCase(), l2 = L2.toLowerCase();
      if (d >= 3 && rand() < .35) {
        const k = ms[3] + randInt(1, 3), right = `${a * k} ${l1}, ${b * k} ${l2}`;
        const wr = [[a * k, b * k + b], [a * k + 1, b * k + 1], [b * k, a * k], [a * k, b * k - 1], [top[3] + a, bot[3] + a]].filter(([p, q]) => p * b !== q * a).map(([p, q]) => `${p} ${l1}, ${q} ${l2}`);
        return {
          topic: 'RATIO TABLES', text: `The table shows equal ratios of ${l1} to ${l2}. Which pair could be added to the table?`, ...textual(right, shuffle(wr)),
          steps: [`Every column is ${l1}:${l2} = ${a}:${b}, times the same number.`, `${k} × ${a} = ${a * k} and ${k} × ${b} = ${b * k}`, `So ${right} fits.`],
          size: [140, 30], fig: (c, w, h) => table(c, w, h, [[L1, ...top], [L2, ...bot]], { first: 52, headCol: true, headRow: false }),
        };
      }
      const col = randInt(1, 3), row = randInt(0, 1), same = row ? bot : top, other = row ? top : bot, ans = same[col];
      const add = same[col - 1] + (other[col] - other[col - 1]);
      const shown = [top.slice(), bot.slice()]; shown[row][col] = '?';
      return {
        topic: 'RATIO TABLES', text: `The table shows equal ratios of ${l1} to ${l2}. What number goes where the ? is?`,
        ...nums(ans, [add, ans + (row ? b : a), other[col], ans - (row ? b : a)]),
        steps: [`Every column is ${l1}:${l2} = ${a}:${b}, times the same number.`, `${other[col]} = ${ms[col]} × ${row ? a : b}, so multiply by ${ms[col]}.`, `${ms[col]} × ${row ? b : a} = ${ans}`],

        size: [140, 30], fig: (c, w, h) => table(c, w, h, [[L1, ...shown[0]], [L2, ...shown[1]]], { first: 52, headCol: true, headRow: false }),
      };
    },

    // 6.RP.3a: equivalent ratios in words, part to part and part to whole, and tape diagrams
    ratioProblem: d => {
      const [p, q] = sample([1, 2, 3, 4, 5, 6, 7], 2), k = randInt(2, d < 2 ? 5 : 9), f = pick(['part', 'total', 'tape']);
      if (f === 'part') {
        const [place, A, B] = pick(SHELTER);
        return {
          topic: 'RATIOS', text: `The ratio of ${A} to ${B} ${place} is ${rt(p, q)}. There are ${q * k} ${B}. How many ${A} are there?`,
          ...nums(p * k, [q * k - (q - p), (p + q) * k, p * q * k, q * k]),
          steps: [`${q * k} ${B} is ${q} × ${k}.`, `Multiply the other part by ${k} too: ${p} × ${k} = ${p * k}`],
        };
      }
      const N = (p + q) * k, [A, B, thing] = pick([['Ana', 'Leo', 'stickers'], ['Mei', 'Jamal', 'marbles'], ['Zoe', 'Sam', 'baseball cards'], ['Priya', 'Diego', 'game tokens']]);
      const tape = f === 'tape';
      return {
        topic: 'RATIOS', text: tape ? `${A} and ${B} share ${N} ${thing} in the ratio ${rt(p, q)}, as the tape diagram shows. How many does ${B} get?`
          : `${A} and ${B} share ${N} ${thing} in the ratio ${rt(p, q)}. How many does ${B} get?`,
        ...nums(q * k, [p * k, N - q, Math.round(N / 2), q * (k + 1), N / q].filter(Number.isInteger)),
        steps: [`${p} + ${q} = ${p + q} equal parts in all.`, `Each part: ${N} ÷ ${p + q} = ${k}`, `${B} gets ${q} parts: ${q} × ${k} = ${q * k}`],
        size: tape ? [124, 44] : undefined,
        fig: tape ? (c, w) => {
          const x0 = 34, u = Math.min(12, Math.floor((w - x0 - 2) / Math.max(p, q)));
          L(c, A, 1, 9, INK, 'left'); L(c, B, 1, 24, INK, 'left');
          for (let i = 0; i < p; i++) { F.box(c, x0 + i * u, 3, u, 11, BLU); F.outlinePoly(c, [[x0 + i * u, 3], [x0 + i * u + u, 3], [x0 + i * u + u, 14], [x0 + i * u, 14]], INK); }
          for (let i = 0; i < q; i++) { F.box(c, x0 + i * u, 18, u, 11, GRN); F.outlinePoly(c, [[x0 + i * u, 18], [x0 + i * u + u, 18], [x0 + i * u + u, 29], [x0 + i * u, 29]], INK); }
          L(c, `${N} in all`, x0 + Math.max(p, q) * u / 2, 38, HOT);
        } : undefined,
      };
    },

    // 6.RP.3b: constant speed and other rates
    rateWord: d => {
      const f = pick(['time', 'dist', 'speed', 'work']), half = d >= 2;
      if (f === 'time' || f === 'dist') {
        const r = pick([40, 45, 50, 55, 60, 65, 70]), t = half ? randInt(4, 16) / 2 : randInt(2, 8), D = r * t;
        const [veh, verb] = pick([['A train', 'travels'], ['A bus', 'drives'], ['A race car', 'drives'], ['A ferry', 'sails']]);
        if (f === 'time') return {
          topic: 'RATES', text: `${veh} ${verb} at ${r} miles per hour. How many hours does it take to go ${num(D)} miles?`,
          ...nums(t, [D - r, t * 2, t + 1, t - .5].filter(v => v > 0), num, .5),
          steps: ['time = distance ÷ speed', `${num(D)} ÷ ${r} = ${num(t)} hours`],
        };
        return {
          topic: 'RATES', text: `${veh} ${verb} at ${r} miles per hour for ${num(t)} hours. How far does it go?`,
          ...nums(D, [r + t, r * (t + 1), r * Math.floor(t), D / 2].filter(v => v !== D), num, 5),
          steps: ['distance = speed × time', `${r} × ${num(t)} = ${num(D)} miles`],
        };
      }
      if (f === 'speed') {
        const r = randInt(3, 9), t = randInt(4, 12) * (half ? 5 : 1), D = r * t;
        return {
          topic: 'RATES', text: `${who()} runs ${D} meters in ${t} seconds. What is the speed in meters per second?`,
          ...nums(r, [D - t, r + 2, t, r * 10].filter(v => v > 0 && v !== r)),
          steps: ['speed = distance ÷ time', `${D} ÷ ${t} = ${r} meters per second`],
        };
      }
      const p = randInt(2, 6), h = p + randInt(1, 5), k = randInt(2, d < 3 ? 4 : 8), H = h * k;
      return {
        topic: 'RATES', text: `${who()} mowed ${p} lawns in ${h} hours. At that rate, how many lawns can be mowed in ${H} hours?`,
        ...nums(p * k, [p + H - h, p * H, H - h, p * k + p]),
        steps: [`${H} hours is ${k} times ${h} hours.`, `So the lawns are ${k} times as many: ${k} × ${p} = ${p * k}`],
      };
    },

    // 6.RP.3c
    percentOf: d => {
      const f = pick(d < 2 ? ['grid', 'of', 'of', 'convert'] : ['grid', 'of', 'whole', 'what', 'convert']);
      // IXL's "convert between percents, fractions and decimals".
      if (f === 'convert') {
        const [p, q] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [3, 20], [1, 25], [6, 25]]), P = p / q * 100, g0 = pick(['f2p', 'p2d', 'd2p']);
        if (g0 === 'f2p') return { topic: 'PERCENTS', text: `What is ${p}/${q} as a percent?`, ...textual(pct(P), [`${p}${q}%`, `${num(p / q)}%`, pct(q / p > 10 ? P * 10 : P / 2), pct(100 - P), pct(P + 10)].filter(s => s !== pct(P))),
          steps: [`Percent means out of 100.`, `${p}/${q} = ${P}/100`, `= ${pct(P)}`] };
        if (g0 === 'p2d') return { topic: 'PERCENTS', text: `What is ${pct(P)} as a decimal?`, ...nums(P / 100, [P / 10, P, P / 1000], num, .1),
          steps: ['Percent means hundredths: divide by 100.', `${P} ÷ 100 = ${num(P / 100)}`] };
        return { topic: 'PERCENTS', text: `What is ${num(P / 100)} as a percent?`, ...textual(pct(P), [pct(P / 10), pct(P / 100), pct(P * 10), `${num(P / 100)}%`].filter(s => s !== pct(P))),
          steps: ['Multiply by 100 to get a percent.', `${num(P / 100)} × 100 = ${pct(P)}`] };
      }
      if (f === 'grid') {
        const N = randInt(1, 19) * 5 + (d >= 2 ? randInt(-2, 2) : 0), not = rand() < .4, ans = not ? 100 - N : N;
        return {
          topic: 'PERCENTS', text: `What percent of the grid is ${not ? 'not ' : ''}shaded?`, ...nums(ans, [100 - ans, ans / 10, ans + 10], pct),
          steps: ['The grid has 100 squares, so each is 1%.', `${N} are shaded${not ? `, ${100 - N} are not` : ''}.`, `${ans} out of 100 = ${ans}%`],
          size: [56, 56], fig: c => { for (let i = 0; i < 100; i++) F.box(c, 3 + (i % 10) * 5, 3 + Math.floor(i / 10) * 5, 4, 4, i < N ? HOT : GRID); },
        };
      }
      const p = pick([10, 20, 25, 30, 40, 50, 60, 75, 80, 5, 15, 35]), unit = 100 / gcd(p, 100), N = unit * randInt(1, Math.max(1, Math.floor(240 / unit))), part = p * N / 100;
      if (f === 'of') {
        const S = pick([[`What is ${p}% of ${N}?`, ''], [`${who()} has ${N} songs. ${p}% of them are pop songs. How many pop songs are there?`, ''],
          [`There are ${N} seats at the arcade. ${p}% are taken. How many seats are taken?`, '']]);
        return {
          topic: 'PERCENTS', text: S[0], ...nums(part, [N - p, part * 10, N - part, part / 10].filter(v => v > 0 && v !== part)),
          steps: [`${p}% = ${p}/100`, `${p}/100 × ${N} = ${num(part)}`],
        };
      }
      if (f === 'whole') {
        const S = pick([`${num(part)} is ${p}% of what number?`, `${who()} has read ${num(part)} pages, which is ${p}% of the book. How many pages long is the book?`,
          `${num(part)} students walk to school. That is ${p}% of the class. How many students are in the class?`]);
        return {
          topic: 'PERCENTS', text: S, ...nums(N, [part * p / 100, part + p, N / 10, part * 100 / (100 - p)].filter(v => v > 0 && v !== N)),
          steps: [`${p}% of the whole is ${num(part)}.`, `1% is ${num(part)} ÷ ${p} = ${num(part / p)}`, `100% is ${num(part / p)} × 100 = ${num(N)}`],
        };
      }
      const T = pick([20, 25, 40, 50, 10]), r = randInt(1, T - 1), ans = r / T * 100;
      return {
        topic: 'PERCENTS', text: `${who()} got ${r} out of ${T} questions right on a quiz. What percent is that?`,
        ...nums(ans, [r, T - r, 100 - ans, r * 2].filter(v => v !== ans), pct),
        steps: [`${r} out of ${T} = ${r}/${T}`, `Make the bottom 100: × ${100 / T}`, `${r}/${T} = ${num(ans)}/100 = ${num(ans)}%`],
      };
    },

    // 6.RP.3d
    unitConvert: d => {
      const [big, small, k] = pick([['feet', 'inches', 12], ['yards', 'feet', 3], ['pounds', 'ounces', 16], ['gallons', 'quarts', 4], ['quarts', 'pints', 2],
        ['pints', 'cups', 2], ['meters', 'centimeters', 100], ['kilometers', 'meters', 1000], ['kilograms', 'grams', 1000], ['liters', 'milliliters', 1000], ['hours', 'minutes', 60]]);
      const f = pick(d < 3 ? ['down', 'up'] : ['down', 'up', 'part']);
      if (f === 'down') {
        const n = randInt(2, d < 2 ? 9 : 25);
        return {
          topic: 'MEASUREMENT', text: `How many ${small} are in ${n} ${big}?`, ...nums(n * k, [n + k, round(n / k), n * k * 10, n * (k - 1)].filter(v => v !== n * k)),
          steps: [`1 ${SING[big]} = ${num(k)} ${small}`, `Multiply: ${n} × ${num(k)} = ${num(n * k)} ${small}`],
        };
      }
      if (f === 'up') {
        const n = randInt(2, d < 2 ? 9 : 25), S = n * k;
        return {
          topic: 'MEASUREMENT', text: `${num(S)} ${small} is how many ${big}?`, ...nums(n, [S * k, S - k, S + k, n * 10]),
          steps: [`1 ${SING[big]} = ${num(k)} ${small}`, `Divide: ${num(S)} ÷ ${num(k)} = ${n} ${big}`],
        };
      }
      const u = pick([[12, 'inches', 'feet', 2], [12, 'inches', 'feet', 4], [3, 'feet', 'yards', 3], [16, 'ounces', 'pounds', 4], [4, 'quarts', 'gallons', 4], [60, 'minutes', 'hours', 4]]);
      const parts = u[3], whole = randInt(1, 6), part = randInt(1, parts - 1), S = whole * u[0] + part * u[0] / parts, ans = S / u[0];
      return {
        topic: 'MEASUREMENT', text: `${S} ${u[1]} is how many ${u[2]}? Write it as a decimal.`,
        ...nums(ans, [whole + (S - whole * u[0]) / 10, S * u[0], whole, ans + .25].filter(v => v !== ans), num, .25),
        steps: [`${u[0]} ${u[1]} = 1 ${SING[u[2]]}`, `${S} ÷ ${u[0]} = ${num(ans)}`, `(${whole} ${u[2]} and ${S - whole * u[0]} ${u[1]} is not ${whole}.${S - whole * u[0]}!)`],
      };
    },

    // 6.NS.1
    divideFractions: d => {
      const fr = () => { const q = randInt(2, d < 3 ? 9 : 12), n = randInt(1, q - 1), g = gcd(n, q); return [n / g, q / g]; };
      let A, B, sa, sb;
      const f = pick(d < 2 ? ['ff', 'wf', 'fw'] : d < 3 ? ['ff', 'ff', 'wf', 'fw'] : ['ff', 'mm', 'mm', 'wf']);
      if (f === 'ff') { A = fr(); B = fr(); if (A[0] === B[0] && A[1] === B[1]) B = A[1] === 2 ? [1, 3] : [1, 2]; }
      else if (f === 'wf') { A = [randInt(2, 9), 1]; B = fr(); }
      else if (f === 'fw') { A = fr(); B = [randInt(2, 6), 1]; }
      else { A = fr(); A[0] += A[1] * randInt(1, 3); B = fr(); B[0] += B[1] * randInt(1, 2); }
      sa = mixed(A[0] / A[1]); sb = mixed(B[0] / B[1]);
      const ans = (A[0] * B[1]) / (A[1] * B[0]), imp = ([n, q]) => q === 1 ? `${n}/1` : `${n}/${q}`;
      const steps = [];
      if (f === 'mm') steps.push(`Make improper fractions: ${imp(A)} ÷ ${imp(B)}`);
      steps.push(`Keep, change, flip: ${imp(A)} × ${B[1]}/${B[0]}`, `= ${A[0] * B[1]}/${A[1] * B[0]}${mixed(ans) !== `${A[0] * B[1]}/${A[1] * B[0]}` ? ` = ${mixed(ans)}` : ''}`);
      return {
        topic: 'FRACTIONS', text: `What is ${sa} ÷ ${sb}?`,
        ...nums(ans, [(A[0] * B[0]) / (A[1] * B[1]), (A[1] * B[0]) / (A[0] * B[1]), (A[1] * B[1]) / (A[0] * B[0]), A[0] / A[1] - B[0] / B[1]].filter(v => v > 0), mixed, .5),
        steps,
      };
    },

    // 6.NS.1: word problems and models
    fractionWord: d => {
      const f = pick(d < 2 ? ['model', 'model', 'servings'] : ['model', 'servings', 'share', 'area', 'ribbon']);
      if (f === 'model') {
        const q = randInt(2, 5);
        let p = d < 2 ? 1 : randInt(1, q - 1), Ws = [2, 3, 4].filter(w => w * q % p === 0);
        if (!Ws.length) { p = 1; Ws = [2, 3, 4]; }
        const W = pick(Ws);
        const ans = W * q / p;
        return {
          topic: 'FRACTIONS', text: `How many ${p}/${q}s are in ${W}? Use the model.`, ...nums(ans, [W * p / q, W + q, W * q, q / W, ans + 1].filter(v => v !== ans), mixed),
          steps: [`Each whole bar has ${q} parts of 1/${q}: ${W} × ${q} = ${W * q} parts.`, p > 1 ? `Groups of ${p} parts: ${W * q} ÷ ${p} = ${ans}` : `So there are ${ans} of them.`, `${W} ÷ ${p}/${q} = ${ans}`],
          size: [110, W * 12 + 2], fig: (c, w) => {
            const bw = Math.floor((w - 4) / q) * q, u = bw / q;
            for (let b = 0; b < W; b++) for (let i = 0; i < q; i++) {
              const g = Math.floor((b * q + i) / p), x = 2 + i * u, y = 2 + b * 12;
              F.box(c, x, y, u, 10, g % 2 ? GRN : BLU); F.outlinePoly(c, [[x, y], [x + u, y], [x + u, y + 10], [x, y + 10]], INK);
            }
          },
        };
      }
      if (f === 'servings') {
        const [p, q] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [3, 8], [5, 8]]), k = q * randInt(1, 4) / gcd(p, q) * (rand() < .5 ? 1 : 2), W = k * p / q;
        const [thing, unit] = pick([['trail mix', 'cup'], ['lemonade', 'cup'], ['clay', 'pound'], ['rice', 'cup']]);
        return {
          topic: 'FRACTIONS', text: `How many ${p}/${q}-${unit} servings are in ${mixed(W)} ${unit}s of ${thing}?`,
          ...nums(k, [W * p / q, W + p / q, W * q, k / 2].filter(v => v !== k), mixed),
          steps: [`Servings = ${mixed(W)} ÷ ${p}/${q}`, `= ${fs(W)} × ${q}/${p}`, `= ${k}`],
        };
      }
      if (f === 'share') {
        const [p, q] = pick([[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [3, 8], [7, 8]]), N = randInt(2, 6), ans = p / (q * N);
        return {
          topic: 'FRACTIONS', text: `${N} friends share ${p}/${q} pound of fudge equally. What fraction of a pound does each friend get?`,
          ...nums(ans, [N * p / q, q * N / p, p / (q + N), p / q].filter(v => v !== ans), mixed, 1 / (q * N)),
          steps: [`${p}/${q} ÷ ${N} = ${p}/${q} × 1/${N}`, `= ${fs(ans)} pound each`],
        };
      }
      if (f === 'area') {
        const [a, b] = pick([[1, 2], [2, 3], [3, 4], [1, 3], [3, 5], [5, 6]]), [e, g] = pick([[1, 2], [3, 4], [2, 3], [3, 2], [5, 4], [4, 3]]);
        const wdt = a / b, len = Math.abs(e / g - wdt) < 1e-9 ? 5 / 4 : e / g, A = wdt * len;
        return {
          topic: 'FRACTIONS', text: `A rectangular rug has an area of ${fs(A)} square yard. It is ${fs(wdt)} yard wide. How long is it, in yards?`,
          ...nums(len, [A * wdt, wdt / A, A + wdt, len + .5].filter(v => v > 0 && Math.abs(v - len) > 1e-9), mixed, .25),
          steps: ['length = area ÷ width', `${fs(A)} ÷ ${fs(wdt)} = ${fs(A)} × ${b}/${a}`, `= ${mixed(len)} yards`],
        };
      }
      const [p, q] = pick([[1, 2], [1, 3], [2, 3], [3, 4], [1, 4]]), k = randInt(3, 10), Lr = k * p / q;
      return {
        topic: 'FRACTIONS', text: `${who()} cuts a ${mixed(Lr)}-foot ribbon into pieces that are each ${p}/${q} foot long. How many pieces are there?`,
        ...nums(k, [Lr * p / q, Math.round(Lr * q), Lr + p / q, k - 1].filter(v => v !== k), mixed),
        steps: [`${mixed(Lr)} ÷ ${p}/${q}`, `= ${fs(Lr)} × ${q}/${p}`, `= ${k} pieces`],
      };
    },

    // 6.NS.2
    longDivision: d => {
      const dv = randInt(d < 2 ? 11 : 12, d < 2 ? 25 : 99);
      let q = randInt(d < 3 ? 21 : 101, d < 3 ? 99 : 999);
      if (d >= 3 && rand() < .4) q = randInt(1, 9) * 100 + randInt(1, 9);
      const N = dv * q, dz = /0/.test(String(q).slice(1)) ? Number(String(q).replace(/0/g, '')) : q + 100;
      const f = pick(d < 2 ? ['plain', 'word'] : ['plain', 'word', 'rem']);
      if (f === 'rem') {
        const r = randInt(1, dv - 1), M = N + r;
        const [S, ask] = pick([[`${num(M)} fans are going to the game on buses that each hold ${dv} people.`, 'How many buses are needed?'],
          [`${num(M)} cupcakes are packed in boxes of ${dv}.`, 'How many boxes are needed to pack them all?']]);
        return {
          topic: 'DIVISION', text: `${S} ${ask}`, ...nums(q + 1, [q, q + 2, q - 1]),
          steps: [`${num(M)} ÷ ${dv} = ${q} R ${r}`, `${q} full ones leave ${r} more.`, `So you need ${q + 1}.`],
        };
      }
      const S = f === 'plain' ? `What is ${num(N)} ÷ ${dv}?` : pick([`A school orders ${num(N)} pencils in boxes of ${dv}. How many boxes is that?`,
        `A robot club raises $${num(N)} selling ${dv}-dollar raffle tickets. How many tickets did they sell?`, `${num(N)} chairs are set up in rows of ${dv}. How many rows are there?`]);
      return {
        topic: 'DIVISION', text: S, ...nums(q, [dz, q + 10, q - 1, q + 1]),
        steps: [`${num(N)} ÷ ${dv}`, `Check: ${dv} × ${q} = ${num(N)}`, `So the answer is ${q}.`],
      };
    },

    // 6.NS.3
    decimals: d => {
      const f = pick(d < 2 ? ['add', 'sub', 'mul'] : ['add', 'sub', 'mul', 'div', 'money']);
      if (f === 'add') {
        const a = randInt(11, 199) / 10, b = randInt(101, 1999) / 100, ans = round(a + b);
        return {
          topic: 'DECIMALS', text: `What is ${num(a)} + ${num(b)}?`, ...nums(ans, [round(a / 10 + b), round(a + b / 10), round(ans + 1), round(ans - .1)], num, .1),
          steps: ['Line up the decimal points.', `${a.toFixed(2)} + ${b.toFixed(2)}`, `= ${num(ans)}`],
        };
      }
      if (f === 'sub') {
        const a = randInt(10, 40), b = randInt(101, a * 100 - 101) / 100, ans = round(a - b);
        const dig = (x, y) => { const s = x.toFixed(2).padStart(6, '0'), t = y.toFixed(2).padStart(6, '0'); return Number([...s].map((ch, i) => ch === '.' ? '.' : Math.abs(ch - t[i])).join('')); };
        return {
          topic: 'DECIMALS', text: `What is ${a} - ${num(b)}?`, ...nums(ans, [dig(a, b), round(ans + 1), round(ans - 1), round(ans + .1)], num, .1),
          steps: [`Write ${a} as ${a}.00 and line up the points.`, `${a}.00 - ${b.toFixed(2)}`, `= ${num(ans)}`],
        };
      }
      if (f === 'mul') {
        let a10 = randInt(11, 99); if (a10 % 10 === 0) a10++;
        const bi = randInt(2, 9), dp = d < 2 ? 1 : 2, a = a10 / 10, b = d < 2 ? bi : bi / 10, ans = round(a10 * bi / 10 ** dp, 3);
        return {
          topic: 'DECIMALS', text: `What is ${num(a)} × ${num(b)}?`, ...nums(ans, [round(ans * 10, 3), round(ans / 10, 3), round(a + b, 3)], num, .1),
          steps: [`Multiply as whole numbers: ${a10} × ${bi} = ${a10 * bi}`, `There ${dp === 1 ? 'is 1 decimal place' : `are ${dp} decimal places`} in all.`, `So the answer is ${num(ans)}.`],
        };
      }
      if (f === 'div') {
        const b = pick([0.2, 0.4, 0.5, 0.6, 0.8, 1.5, 2.5, 0.25, 1.2]), q = randInt(3, 40) / (rand() < .5 ? 1 : 2), a = round(b * q, 3);
        return {
          topic: 'DECIMALS', text: `What is ${num(a)} ÷ ${num(b)}?`, ...nums(q, [round(q * 10, 3), round(q / 10, 3), round(a * b, 3)], num, .5),
          steps: [`Move both decimal points ${String(b).split('.')[1].length === 1 ? 'one place' : 'two places'} right.`, `${num(a * 10 ** String(b).split('.')[1].length)} ÷ ${num(b * 10 ** String(b).split('.')[1].length)}`, `= ${num(q)}`],
        };
      }
      const n = randInt(3, 8), p = randInt(105, 899) / 100;
      if (rand() < .5) return {
        topic: 'DECIMALS', text: `${who()} buys ${n} notebooks at ${money(p)} each. What is the total cost?`,
        ...nums(round(n * p), [round(n + p), round(n * p * 10) / 100 * 10, round(n * p + 1), round(n * p - p)], money, .1),
        steps: [`${n} × ${money(p)}`, `= ${money(n * p)}`],
      };
      const T = round(n * p);
      return {
        topic: 'DECIMALS', text: `${n} friends split a pizza bill of ${money(T)} equally. How much does each friend pay?`,
        ...nums(p, [round(T - n), round(p * 10) > 99 ? round(p / 10) : round(p + 1), round(T / (n + 1)), round(p + .1)], money, .05),
        steps: [`${money(T)} ÷ ${n}`, `= ${money(p)} each`],
      };
    },

    // 6.NS.4
    factors: d => {
      const f = pick(d < 2 ? ['gcf', 'lcm'] : ['gcf', 'lcm', 'gcfWord', 'lcmWord', 'dist']);
      const pair = () => { const [m, n] = shuffle(pick([[1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [3, 7], [5, 6], [4, 7], [5, 7], [2, 7], [4, 9]]).slice()); return [m, n]; };
      if (f === 'gcf' || f === 'gcfWord' || f === 'dist') {
        let g = randInt(2, d < 2 ? 6 : 12), [m, n] = pair();
        while (g * Math.max(m, n) > 100) g--;
        const a = g * m, b = g * n, sub = [6, 4, 3, 2].find(k => g % k === 0 && k < g) || 1;
        if (f === 'gcf') return {
          topic: 'FACTORS', text: `What is the greatest common factor of ${a} and ${b}?`, ...nums(g, [sub, Math.min(a, b), lcm(a, b), g * 2].filter(v => v !== g)),
          steps: [`Factors of ${a} and ${b} that they share: ${[...Array(g + 1).keys()].filter(k => k && g % k === 0).join(', ')}`, `The greatest is ${g}.`],
        };
        if (f === 'gcfWord') {
          const [S, T] = pick([[`${who()} has ${a} red beads and ${b} blue beads for bracelets that are all the same, with none left over.`, 'bracelets'],
            [`The art club has ${a} markers and ${b} glue sticks to pack into identical kits, with none left over.`, 'kits'],
            [`A teacher has ${a} stickers and ${b} pencils to share into matching goodie bags, with none left over.`, 'goodie bags']]);
          return {
            topic: 'FACTORS', text: `${S} What is the greatest number of ${T} that can be made?`, ...nums(g, [sub, a / g, b / g, lcm(a, b), a + b].filter(v => v !== g)),
            steps: [`The number of ${T} must divide both ${a} and ${b}.`, `The greatest common factor of ${a} and ${b} is ${g}.`, `So ${g} ${T}.`],
          };
        }
        const right = `${g}(${m} + ${n})`, wr = shuffle([`${g}(${m} + ${b})`, `${g}(${a} + ${n})`, `${g + 1}(${m} + ${n})`, `${g}(${m + 1} + ${n})`, `${g * m}(1 + ${b})`]);
        if (sub > 1) wr.unshift(`${sub}(${a / sub} + ${b / sub})`);
        return {
          topic: 'FACTORS', text: `Which shows ${a} + ${b} with the greatest common factor factored out?`,
          ...textual(right, wr),
          steps: [`The GCF of ${a} and ${b} is ${g}.`, `${a} = ${g} × ${m} and ${b} = ${g} × ${n}`, `So ${a} + ${b} = ${right}`],
        };
      }
      let [a, b] = sample([2, 3, 4, 5, 6, 8, 9, 10, 12], 2); if (a % b === 0 || b % a === 0) { a = pick([4, 6, 8]); b = a === 4 ? 6 : a === 6 ? 8 : 12; }
      const L0 = lcm(a, b);
      if (f === 'lcm') return {
        topic: 'FACTORS', text: `What is the least common multiple of ${a} and ${b}?`, ...nums(L0, [a * b, gcd(a, b), 2 * L0, a + b].filter(v => v !== L0)),
        steps: [`Multiples of ${a}: ${[1, 2, 3, 4, 5].map(k => a * k).join(', ')}...`, `Multiples of ${b}: ${[1, 2, 3, 4, 5].map(k => b * k).join(', ')}...`, `The first one they share is ${L0}.`],
      };
      const [S, T] = pick([[`Hot dogs come in packs of ${a} and buns come in packs of ${b}.`, `What is the fewest hot dogs you can buy to have exactly one bun for each?`],
        [`One bus leaves every ${a} minutes and another every ${b} minutes. They both just left.`, `In how many minutes will they next leave together?`],
        [`Juice comes in packs of ${a} and cups come in packs of ${b}.`, `What is the fewest juice boxes you can buy to have exactly one cup for each?`]]);
      return {
        topic: 'FACTORS', text: `${S} ${T}`, ...nums(L0, [a * b, gcd(a, b), a + b, 2 * L0].filter(v => v !== L0)),
        steps: [`You need a number that is a multiple of both ${a} and ${b}.`, `The least common multiple of ${a} and ${b} is ${L0}.`],
      };
    },

    // 6.NS.5
    integerStories: d => {
      const S = [[n => `a temperature ${Math.min(40, parseInt(n))} degrees below zero`, -1], [n => `a gain of ${n} yards in football`, 1], [n => `a loss of ${n} yards in football`, -1],
        [n => `a deposit of $${n}`, 1], [n => `a withdrawal of $${n}`, -1], [n => `${n} feet below sea level`, -1], [n => `${n} feet above sea level`, 1],
        [n => `losing ${n} points`, -1], [n => `winning ${n} points`, 1], [n => `going down ${n} floors`, -1], [n => `going up ${n} floors`, 1],
        [n => `a temperature ${Math.min(90, parseInt(n))} degrees above zero`, 1], [n => `spending $${n}`, -1], [n => `earning $${n}`, 1]];
      const n = randInt(2, d < 2 ? 20 : 90), f = pick(['which', 'match', 'zero']);
      if (f === 'which') {
        const [t, s] = pick(S);
        return {
          topic: 'INTEGERS', text: `Which number stands for ${t(num(n))}?`, ...nums(s * n, [-s * n, 0, s * n * 10]),
          steps: [s < 0 ? 'Below zero, a loss, going down or spending: negative.' : 'Above zero, a gain, going up or earning: positive.', `So it is ${s * n}.`],
        };
      }
      if (f === 'match') {
        const s = pick([-1, 1]), right = pick(S.filter(x => x[1] === s))[0](num(n)), wr = sample(S.filter(x => x[1] === -s), 4).map(x => x[0](num(n)));
        return {
          topic: 'INTEGERS', text: `Which could the number ${s * n} stand for?`, ...textual(right, wr),
          steps: [`${s * n} is ${s < 0 ? 'negative: below zero, a loss, or going down' : 'positive: above zero, a gain, or going up'}.`, `So: ${right}.`],
        };
      }
      const [q, right, wr] = pick([[`A diver is at -${n} feet. What does 0 stand for?`, 'sea level', ['the sea floor', `${n} feet deep`, 'the top of a cliff', 'the deepest point']],
        [`In golf, a score of -${n % 9 + 1} means ${n % 9 + 1} strokes under par. What does a score of 0 mean?`, 'exactly par', ['a hole in one', 'no strokes at all', `${n % 9 + 1} over par`, 'last place']],

        [`${who()}'s bank balance is -$${n}. What does a balance of $0 mean?`, 'no money and no debt', ['owing a lot', 'a big savings account', `$${n} saved`, 'a closed bank']]]);
      return {
        topic: 'INTEGERS', text: q, ...textual(right, wr),
        steps: ['0 is the starting point between positive and negative.', `Here 0 means ${right}.`],
      };
    },

    // 6.NS.6a, 6.NS.6c, 6.NS.7a
    numberLine: d => {
      const halves = d >= 3 && rand() < .6, lo = halves ? -3 : d < 2 ? -5 : -10, hi = -lo, step = halves ? .5 : 1, every = halves ? 2 : d < 2 ? 1 : 5;
      const k = randInt(1, Math.round((hi - lo) / step) - 1);
      let v = lo + k * step; if (v === 0) v = step * (rand() < .5 ? 1 : -1) * (halves ? 3 : 3);
      const fm = halves ? mixed : num, f = pick(['read', 'read', 'opp', 'compare']);
      const fig = (c, w, h) => { const X = nline(c, w, 12, lo, hi, { step, every }); nlDot(c, X(v), 12, false, HOT); L(c, 'P', X(v), 4, HOT); };
      if (f === 'read') return {
        topic: 'NUMBER LINES', text: 'What number is at point P on the number line?', ...nums(v, [-v, v + step, v - step, v + 2 * step], fm, step),
        steps: [`Find the nearest labeled number, then count the ticks.`, `Each tick is ${fm(step)}.`, `P is at ${fm(v)}.`], size: [168, 26], fig,
      };
      if (f === 'opp') return {
        topic: 'NUMBER LINES', text: 'What is the opposite of the number at point P?', ...nums(-v, [v, -v + step, -v - step, v + step], fm, step),
        steps: [`P is at ${fm(v)}.`, 'Opposites are the same distance from 0 on the other side.', `The opposite is ${fm(-v)}.`], size: [168, 26], fig,
      };
      const a = v, b = (() => { let u = lo + randInt(1, Math.round((hi - lo) / step) - 1) * step; if (u === a) u = a > 0 ? a - 2 * step : a + 2 * step; return u; })();
      const lo2 = Math.min(a, b), hi2 = Math.max(a, b), A = fm(a), B = fm(b);
      const right = a < b ? `${A} < ${B}` : `${A} > ${B}`, wr = [a < b ? `${A} > ${B}` : `${A} < ${B}`, a < b ? `${B} < ${A}` : `${B} > ${A}`, `${A} = ${B}`, `${fm(-hi2)} > ${fm(-lo2)}`];
      return {
        topic: 'NUMBER LINES', text: `Points P and Q are at ${A} and ${B}. Which statement is true?`, ...textual(right, wr.filter(s => s !== right)),
        steps: ['On a number line, numbers grow to the right.', `${fm(lo2)} is left of ${fm(hi2)}, so ${fm(lo2)} < ${fm(hi2)}.`],
        size: [168, 26], fig: (c, w) => { const X = nline(c, w, 12, lo, hi, { step, every });
 nlDot(c, X(a), 12, false, HOT); L(c, 'P', X(a), 4, HOT); nlDot(c, X(b), 12, false, BLU); L(c, 'Q', X(b), 4, BLU); },
      };
    },

    // 6.NS.7
    absoluteValue: d => {
      const f = pick(d < 2 ? ['abs', 'order', 'true'] : ['abs', 'order', 'true', 'context', 'greatest']);
      if (f === 'abs') {
        const a = -randInt(2, d < 2 ? 20 : 60), b = randInt(2, 30) * pick([1, -1]);
        if (d < 2) return { topic: 'ABSOLUTE VALUE', text: `What is |${a}|?`, ...nums(-a, [a, 0, -a + 1]), steps: ['Absolute value is the distance from 0.', `${a} is ${-a} away from 0, so |${a}| = ${-a}.`] };
        const g = pick(['plus', 'minus', 'neg']);
        if (g === 'plus') return { topic: 'ABSOLUTE VALUE', text: `What is |${a}| + |${b}|?`, ...nums(-a + Math.abs(b), [a + b, Math.abs(a + b), a + Math.abs(b), -(-a + Math.abs(b))]), steps: [`|${a}| = ${-a} and |${b}| = ${Math.abs(b)}`, `${-a} + ${Math.abs(b)} = ${-a + Math.abs(b)}`] };
        if (g === 'minus') return { topic: 'ABSOLUTE VALUE', text: `What is |${a}| - |${b}|?`, ...nums(-a - Math.abs(b), [a - b, Math.abs(a - b), -a + Math.abs(b), a - Math.abs(b)]), steps: [`|${a}| = ${-a} and |${b}| = ${Math.abs(b)}`, `${-a} - ${Math.abs(b)} = ${-a - Math.abs(b)}`] };
        return { topic: 'ABSOLUTE VALUE', text: `What is -|${a}|?`, ...nums(a, [-a, 0, a - 1]), steps: [`|${a}| = ${-a}`, `The minus sign outside makes it ${a}.`] };
      }
      if (f === 'order') {
        const vals = shuffle([...sample([-12, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1], randInt(2, 3)), ...sample([0, 1, 2, 3, 4, 5, 6, 7, 9, 11], 2)]).slice(0, 4);
        const up = vals.slice().sort((a, b) => a - b), js = a => a.join(', ');
        const byAbs = vals.slice().sort((a, b) => Math.abs(a) - Math.abs(b) || a - b), negFlip = [...up.filter(v => v < 0).reverse(), ...up.filter(v => v >= 0)];
        return {
          topic: 'INTEGERS', text: 'Which list is in order from least to greatest?',
          ...textual(js(up), [js(byAbs), js(negFlip), js(up.slice().reverse()), js([up[1], up[0], up[2], up[3]]), js([up[0], up[1], up[3], up[2]]), js([...up.filter(v => v >= 0), ...up.filter(v => v < 0)])].filter(s => s !== js(up))),

          steps: ['Negative numbers are less than 0 and less than positives.', `The farther left on the number line, the less: ${up[0]} is the least.`, js(up)],
        };
      }
      if (f === 'greatest') {
        const vals = sample([-15, -12, -9, -7, -4, 3, 5, 8, 10, 13, 14], 4), best = vals.reduce((a, b) => Math.abs(b) > Math.abs(a) ? b : a);
        return { topic: 'ABSOLUTE VALUE', text: `Which number has the greatest absolute value: ${vals.join(', ')}?`, ...fixed(vals.map(String), String(best)),
          steps: ['Absolute value is distance from 0, ignoring the sign.', vals.map(v => `|${v}| = ${Math.abs(v)}`).join(', '), `The farthest from 0 is ${best}.`] };
      }
      if (f === 'context') {
        const [A, B] = sample(['Fargo', 'Duluth', 'Nome', 'Butte', 'Bangor'], 2), [a, b] = sample([...Array(24).keys()].map(k => -k - 1), 2);
        const cold = a < b ? A : B, warm = a < b ? B : A, lo = Math.min(a, b), hi = Math.max(a, b);
        return {
          topic: 'INTEGERS', text: `It is ${a}°F in ${A} and ${b}°F in ${B}. Which statement is true?`,
          ...textual(`It is colder in ${cold}.`, [`It is colder in ${warm}.`, `${lo} > ${hi}`, `It is the same in both.`, `|${lo}| < |${hi}|`]),
          steps: [`${lo} is farther below zero than ${hi}.`, `${lo} < ${hi}, so ${cold} is colder.`],
        };
      }
      const a = nz2(-12, 12), b = (() => { let u = nz2(-12, 12); if (u === a) u = a > 0 ? a - 5 : a + 5; return u; })();
      const S = [[`${a} < ${b}`, a < b], [`${a} > ${b}`, a > b], [`|${a}| < |${b}|`, Math.abs(a) < Math.abs(b)], [`|${a}| > |${b}|`, Math.abs(a) > Math.abs(b)],
        [`${-a} < ${-b}`, -a < -b], [`${-a} > ${-b}`, -a > -b], [`|${a}| = ${-Math.abs(a)}`, false], [`-${Math.abs(b)} > ${Math.abs(b)}`, false]];
      const T = S.filter(s => s[1]), Fa = S.filter(s => !s[1]);
      const right = pick(T)[0];
      return {
        topic: 'INTEGERS', text: 'Which statement is true?', ...textual(right, shuffle(Fa.map(s => s[0]))),
        steps: ['Less means farther left on the number line.', 'Absolute value is the distance from 0.', `${right} is true.`],
      };
    },

    // 6.NS.6b, 6.NS.6c, 6.NS.8
    coordinatePlane: d => {
      let x = randInt(1, 4), y = randInt(1, 4); if (x === y) y = x === 4 ? 2 : x + 1;
      x *= pick([1, -1]); y *= pick([1, -1]);
      const pts = shuffle([[x, y], [y, x], [-x, y], [x, -y]]), names = ['P', 'Q', 'R', 'S'];
      const fig = (c, w, h) => {
        const P = plane(c, w, h, 5);
        pts.forEach(([px, py], i) => { const p = P(px, py); F.dot(c, p, HOT); L(c, names[i], p[0] + 6 * Math.sign(px), p[1] - 5 * Math.sign(py) + 1, INK); });
      };
      const quad = (px, py) => px > 0 ? (py > 0 ? 'Quadrant I' : 'Quadrant IV') : (py > 0 ? 'Quadrant II' : 'Quadrant III');
      const f = pick(d < 2 ? ['coords', 'which', 'quad', 'move'] : ['coords', 'which', 'quad', 'reflect', 'dist', 'move']);
      const i = randInt(0, 3), [px, py] = pts[i];
      // IXL's "directions on a coordinate plane": start somewhere and move.
      if (f === 'move') {
        const x0 = randInt(-4, 4), y0 = randInt(-4, 4), mx = nz2(-5, 5), my = nz2(-5, 5), E = [x0 + mx, y0 + my];
        const dir = (v, a, b) => `${Math.abs(v)} ${plural(v, 'unit', 'units')} ${v > 0 ? a : b}`;
        return {
          topic: 'COORDINATES', text: `${who()} starts at ${pt(x0, y0)}, moves ${dir(mx, 'right', 'left')}, then ${dir(my, 'up', 'down')}. Where does ${pick(['the robot', 'the game piece', 'the treasure hunter'])} end up?`,
          ...textual(pt(...E), [pt(x0 - mx, y0 + my), pt(x0 + mx, y0 - my), pt(x0 + my, y0 + mx), pt(x0 - mx, y0 - my), pt(E[1], E[0])]),
          steps: [`Right and left change x: ${x0} ${mx > 0 ? '+' : '-'} ${Math.abs(mx)} = ${E[0]}`, `Up and down change y: ${y0} ${my > 0 ? '+' : '-'} ${Math.abs(my)} = ${E[1]}`, `It ends at ${pt(...E)}.`],
        };
      }
      if (f === 'coords') return {
        topic: 'COORDINATES', text: `What are the coordinates of point ${names[i]}?`, ...textual(pt(px, py), [pt(py, px), pt(-px, py), pt(px, -py), pt(-px, -py), pt(-py, px)]),
        steps: [`Start at the origin. Go ${Math.abs(px)} ${px > 0 ? 'right' : 'left'} (x = ${px}).`, `Then ${Math.abs(py)} ${py > 0 ? 'up' : 'down'} (y = ${py}).`, `Point ${names[i]} is at ${pt(px, py)}.`],
        size: [100, 92], fig,
      };
      if (f === 'which') return {
        topic: 'COORDINATES', text: `Which point is at ${pt(px, py)}?`, ...fixed(names.map(n => 'Point ' + n), 'Point ' + names[i]),
        steps: ['The first number is x: left or right.', `x = ${px}: go ${px > 0 ? 'right' : 'left'} ${Math.abs(px)}. y = ${py}: go ${py > 0 ? 'up' : 'down'} ${Math.abs(py)}.`, `That is point ${names[i]}.`],
        size: [100, 92], fig,
      };
      if (f === 'quad') return {
        topic: 'COORDINATES', text: `In which quadrant is point ${names[i]}?`, ...fixed(['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'], quad(px, py)),
        steps: ['I is top right, II top left, III bottom left, IV bottom right.', `Point ${names[i]} is ${pt(px, py)}: x is ${px > 0 ? 'positive' : 'negative'}, y is ${py > 0 ? 'positive' : 'negative'}.`, `So it is in ${quad(px, py)}.`],
        size: [100, 92], fig,
      };
      if (f === 'reflect') {
        const ax = pick(['x-axis', 'y-axis']), img = ax === 'x-axis' ? [px, -py] : [-px, py];
        return {
          topic: 'COORDINATES', text: `The point ${pt(px, py)} is reflected across the ${ax}. Where is its image?`,
          ...textual(pt(...img), [pt(...(ax === 'x-axis' ? [-px, py] : [px, -py])), pt(-px, -py), pt(py, px), pt(px, py)]),
          steps: [`Across the ${ax}, the ${ax === 'x-axis' ? 'y' : 'x'}-coordinate changes sign.`, `The ${ax === 'x-axis' ? 'x' : 'y'}-coordinate stays the same.`, `${pt(px, py)} → ${pt(...img)}`],
        };
      }
      const a = randInt(-8, -1), b = randInt(1, 9), c0 = nz2(-7, 7), horiz = rand() < .5;
      const P1 = horiz ? pt(a, c0) : pt(c0, a), P2 = horiz ? pt(b, c0) : pt(c0, b);
      return {
        topic: 'COORDINATES', text: `How far apart are the points ${P1} and ${P2}?`, ...nums(b - a, [b + a, Math.abs(b + a), b - a + 1, b - a - 1].filter(v => v > 0)),
        steps: [`They share ${horiz ? 'y' : 'x'} = ${c0}, so count along the ${horiz ? 'x' : 'y'}-axis.`, `From ${a} to 0 is ${-a}; from 0 to ${b} is ${b}.`, `${-a} + ${b} = ${b - a}`],
      };
    },

    // 6.G.3, 6.NS.8
    polygonGrid: d => {
      const x1 = randInt(-5, -1), x2 = randInt(1, 5), y1 = randInt(-4, 0), y2 = randInt(1, 4), W = x2 - x1, H = y2 - y1;
      const verts = [[x1, y2], [x2, y2], [x2, y1], [x1, y1]];
      const f = pick(d < 2 ? ['per', 'area'] : ['per', 'area', 'fourth']);
      if (f === 'fourth') {
        const miss = randInt(0, 3), shown = verts.filter((_, i) => i !== miss), m = verts[miss];
        return {
          topic: 'COORDINATES', text: `Three corners of a rectangle are ${shown.map(p => pt(...p)).join(', ')}. Where is the fourth corner?`,
          ...textual(pt(...m), [pt(m[1], m[0]), pt(-m[0], m[1]), pt(m[0], -m[1]), pt(-m[0], -m[1]), pt(m[0] + 1, m[1])]),
          steps: ['A rectangle\'s corners line up in pairs.', `The missing corner shares its x with one corner and its y with another.`, `It is ${pt(...m)}.`],
        };
      }
      const wrongW = Math.abs(Math.abs(x2) - Math.abs(x1)) || 1, ans = f === 'per' ? 2 * (W + H) : W * H;
      return {
        topic: 'COORDINATES', text: `A rectangle has corners at ${verts.map(p => pt(...p)).join(', ')}. What is its ${f === 'per' ? 'perimeter' : 'area'}?`,
        ...nums(ans, f === 'per' ? [W * H, W + H, 2 * (wrongW + H)] : [2 * (W + H), wrongW * H, W * H + W]),
        steps: [`Width: from x = ${x1} to x = ${x2} is ${W}.`, `Height: from y = ${y1} to y = ${y2} is ${H}.`, f === 'per' ? `Perimeter = 2 × (${W} + ${H}) = ${ans}` : `Area = ${W} × ${H} = ${ans}`],
        size: d < 3 ? [100, 92] : undefined,
        fig: d < 3 ? (c, w, h) => { const P = plane(c, w, h, 5); F.outlinePoly(c, verts.map(p => P(...p)), HOT); verts.forEach(p => F.dot(c, P(...p), RED)); } : undefined,
      };
    },

    // 6.EE.1
    exponents: d => {
      const f = pick(d < 2 ? ['eval', 'write', 'ten'] : ['eval', 'write', 'frac', 'dec', 'missing', 'ten']);
      if (f === 'eval' || f === 'missing') {
        let b = randInt(2, 9), e = randInt(2, b < 5 ? 5 : b < 7 ? 4 : 3); if (d < 2) e = Math.min(e, 3);
        const v = b ** e;
        if (f === 'missing') return { topic: 'EXPONENTS', text: `${b} to what power equals ${num(v)}?`, ...nums(e, [v / b, e + 1, b, e - 1].filter(x => x > 0 && x !== e)), steps: [`Multiply ${b}s until you get ${num(v)}:`, Array(e).fill(b).join(' × ') + ` = ${num(v)}`, `That is ${e} of them, so ${b}^${e} = ${num(v)}.`] };
        return { topic: 'EXPONENTS', text: `What is ${b}^${e}?`, ...nums(v, [b * e, e ** b <= 99999 ? e ** b : b + e, b + e, b ** (e - 1)].filter(x => x !== v)), steps: [`${b}^${e} means ${e} ${b}s multiplied.`, `${Array(e).fill(b).join(' × ')} = ${num(v)}`, `Not ${b} × ${e} = ${b * e}.`] };
      }
      if (f === 'write') {
        const b = randInt(2, 9), e = randInt(3, 6), sym = pick(['×', '·']);
        return { topic: 'EXPONENTS', text: `How do you write ${Array(e).fill(b).join(` ${sym} `)} with an exponent?`, ...textual(`${b}^${e}`, [`${e}^${b}`, `${b} × ${e}`, `${b}^${e + 1}`, `${b * e}`, `${b}^${e - 1}`]), steps: [`There are ${e} factors of ${b}.`, `The base is ${b}; the exponent counts them: ${b}^${e}.`] };
      }
      if (f === 'ten') {
        const e = randInt(2, 7);
        return { topic: 'EXPONENTS', text: `What is 10^${e}?`, ...nums(10 ** e, [10 * e, 10 ** (e - 1), 10 ** (e + 1)]), steps: [`10^${e} is 1 followed by ${e} zeros.`, `= ${num(10 ** e)}`] };
      }
      if (f === 'frac') {
        const [p, q] = pick([[1, 2], [2, 3], [1, 3], [3, 4], [2, 5], [1, 4], [3, 5]]), e = q <= 3 && rand() < .5 ? 3 : 2, ans = p ** e / q ** e;
        return { topic: 'EXPONENTS', text: `What is (${p}/${q})^${e}?`, ...nums(ans, [p * e / q, p / q ** e, p ** e / q, p / (q * e)].filter(v => Math.abs(v - ans) > 1e-9), fs, ans),
          steps: [`Multiply ${p}/${q} by itself ${e} times.`, `Tops: ${Array(e).fill(p).join(' × ')} = ${p ** e}. Bottoms: ${Array(e).fill(q).join(' × ')} = ${q ** e}.`, `= ${fs(ans)}`] };
      }
      const t = pick([.2, .3, .4, .5, .6, .8, .9, 1.1, 1.2, 1.5]), ans = round(t * t, 4);
      return { topic: 'EXPONENTS', text: `What is ${num(t)}^2?`, ...nums(ans, [round(t * 2, 4), round(ans * 10, 4), round(ans / 10, 4), round(t + t * t, 4)].filter(v => v !== ans), v => num(v, 4), .01),
        steps: [`${num(t)}^2 = ${num(t)} × ${num(t)}`, `${Math.round(t * 10)} × ${Math.round(t * 10)} = ${Math.round(t * t * 100)}, with 2 decimal places.`, `= ${num(ans, 4)}`] };
    },

    // 6.EE.1, 6.EE.2c
    orderOfOps: d => {
      const T = [
        () => { const a = randInt(2, 20), b = randInt(2, 9), c = randInt(2, 9); return [`${a} + ${b} × ${c}`, a + b * c, [(a + b) * c, a + b + c], [`Multiply first: ${b} × ${c} = ${b * c}`, `Then add: ${a} + ${b * c} = ${a + b * c}`]]; },
        () => { const a = randInt(2, 9), b = randInt(2, 9), e = randInt(2, 6), q = randInt(2, Math.min(9, a * b - 1)), cc = e * q; return [`${a} × ${b} - ${cc} ÷ ${e}`, a * b - q, ints([(a * b - cc) / e, a * (b - q), a * b - cc]).filter(v => v > 0), [`Multiply and divide first: ${a} × ${b} = ${a * b}, ${cc} ÷ ${e} = ${q}`, `Then subtract: ${a * b} - ${q} = ${a * b - q}`]]; },
        () => { const a = randInt(1, 12), b = randInt(2, 5), c = randInt(2, 4); return [`${a} + ${b}^2 × ${c}`, a + b * b * c, [(a + b) ** 2 * c, a + 2 * b * c, a + (b * c) ** 2], [`Exponent first: ${b}^2 = ${b * b}`, `Then multiply: ${b * b} × ${c} = ${b * b * c}`, `Then add: ${a} + ${b * b * c} = ${a + b * b * c}`]]; },
        () => { const a = randInt(2, 9), b = randInt(2, 9), c = randInt(2, 6), e = randInt(1, 9); return [`(${a} + ${b}) × ${c} - ${e}`, (a + b) * c - e, ints([a + b * c - e, c > e ? (a + b) * (c - e) : (a + b) * c + e]), [`Parentheses first: ${a} + ${b} = ${a + b}`, `Multiply: ${a + b} × ${c} = ${(a + b) * c}`, `Subtract: ${(a + b) * c} - ${e} = ${(a + b) * c - e}`]]; },
        () => { const q = randInt(2, 6), r = randInt(2, 5), k = randInt(2, 6), p = q * r * k; return [`${p} ÷ ${q} × ${r}`, p / q * r, [p / (q * r), p / q + r], ['× and ÷ go in order from left to right.', `${p} ÷ ${q} = ${p / q}`, `${p / q} × ${r} = ${p / q * r}`]]; },
        () => { const a = randInt(2, 4), b = randInt(1, 4), c = randInt(1, 3); return [`${a} × (${b} + ${c})^2`, a * (b + c) ** 2, [(a * (b + c)) ** 2, a * (b * b + c * c), a * (b + c) * 2], [`Parentheses: ${b} + ${c} = ${b + c}`, `Exponent: ${b + c}^2 = ${(b + c) ** 2}`, `Multiply: ${a} × ${(b + c) ** 2} = ${a * (b + c) ** 2}`]]; },
        () => { const b = randInt(2, 5), c = randInt(4, 9), e = randInt(1, c - 2), f = randInt(2, 5), k = randInt(Math.ceil((b * (c - e) + 1) / f), Math.ceil((b * (c - e) + 1) / f) + 4), a = f * k - b * (c - e), ans = k; return [`[${a} + ${b} × (${c} - ${e})] ÷ ${f}`, ans, ints([(a + b) * (c - e) / f, (a + b * c - e) / f, a + b * (c - e)]), [`Parentheses: ${c} - ${e} = ${c - e}`, `In the brackets: ${b} × ${c - e} = ${b * (c - e)}, + ${a} = ${a + b * (c - e)}`, `${a + b * (c - e)} ÷ ${f} = ${ans}`]]; },
      ];
      const [e, ans, wr, steps] = T[randInt(0, d < 2 ? 3 : d < 3 ? 5 : 6)]();
      return { topic: 'ORDER OF OPS', text: `What is the value of ${e}?`, ...nums(ans, wr.filter(v => v !== ans)), steps };
    },

    // 6.EE.2b
    expressionParts: d => {
      const vs = sample(['x', 'y', 'n', 'm', 'a', 'b', 'k', 'p'], 3), co = [randInt(2, 9), d >= 2 && rand() < .4 ? 1 : randInt(2, 9), randInt(2, 9)], k = randInt(1, 20);
      const nT = d < 2 ? 3 : randInt(3, 4), parts = [`${co[0]}${vs[0]}`, `${co[1] === 1 ? '' : co[1]}${vs[1]}`, `${co[2]}${vs[2]}`].slice(0, nT - 1);
      const e = parts.join(' + ') + ' + ' + k, f = pick(['terms', 'coef', 'const', 'words']);
      if (f === 'terms') return { topic: 'EXPRESSIONS', text: `How many terms are in ${e}?`, ...nums(nT, [nT - 1, nT + 1, nT - 1 + parts.length]), steps: ['Terms are the parts joined by + or -.', `${[...parts, k].join(',  ')}`, `That is ${nT} terms.`] };
      if (f === 'coef') {
        const i = randInt(0, parts.length - 1);
        return { topic: 'EXPRESSIONS', text: `What is the coefficient of ${vs[i]} in ${e}?`, ...nums(co[i], [co[(i + 1) % parts.length], k, co[i] + 1, 0].filter(v => v !== co[i])),
          steps: ['The coefficient is the number multiplying the variable.', co[i] === 1 ? `${vs[i]} means 1${vs[i]}, so it is 1.` : `In ${parts[i]}, it is ${co[i]}.`] };
      }
      if (f === 'const') return { topic: 'EXPRESSIONS', text: `What is the constant term in ${e}?`, ...nums(k, [co[0], co[1], nT]), steps: ['The constant is the term with no variable.', `In ${e}, it is ${k}.`] };
      const [a, b] = [randInt(2, 9), randInt(2, 9)], v = vs[0];
      return {
        topic: 'EXPRESSIONS', text: `Which words describe ${a}(${v} + ${b})?`,
        ...textual(`${a} times the sum of ${v} and ${b}`, [`the sum of ${a}${v} and ${b}`, `${a} plus the product of ${v} and ${b}`, `${b} times the sum of ${v} and ${a}`, `the product of ${a} and ${v}, plus ${b}`]),
        steps: [`(${v} + ${b}) is a sum: "the sum of ${v} and ${b}".`, `${a} next to the parentheses multiplies it.`, `So: ${a} times the sum of ${v} and ${b}.`],
      };
    },

    // 6.EE.2a, 6.EE.6
    writeExpression: d => {
      const v = pick(['x', 'n', 'y', 'm', 't', 'p']), n = randInt(2, 12), m = randInt(2, 9), N = who();
      const T = [
        [`${n} less than ${v}`, `${v} - ${n}`, [`${n} - ${v}`, `${v} + ${n}`, `${n}${v}`, `${v} ÷ ${n}`]],
        [`${n} more than ${v}`, `${v} + ${n}`, [`${v} - ${n}`, `${n}${v}`, `${n} - ${v}`, `${v} ÷ ${n}`]],
        [`the product of ${n} and ${v}`, `${n}${v}`, [`${n} + ${v}`, `${v} ÷ ${n}`, `${v} - ${n}`, `${v}^{${n}}`]],
        [`${v} divided by ${n}`, `${v} ÷ ${n}`, [`${n} ÷ ${v}`, `${n}${v}`, `${v} - ${n}`, `${n} - ${v}`]],
        [`${m} more than ${n} times ${v}`, `${n}${v} + ${m}`, [`${m}${v} + ${n}`, `${n}(${v} + ${m})`, `${n} + ${m}${v}`, `${m} + ${n} + ${v}`]],
        [`${n} times the sum of ${v} and ${m}`, `${n}(${v} + ${m})`, [`${n}${v} + ${m}`, `${n} + ${v} + ${m}`, `${m}(${v} + ${n})`, `${v} + ${n}${m}`]],
        [`${m} less than the quotient of ${v} and ${n}`, `${v} ÷ ${n} - ${m}`, [`${m} - ${v} ÷ ${n}`, `${n} ÷ ${v} - ${m}`, `(${v} - ${m}) ÷ ${n}`, `${n}${v} - ${m}`]],
      ];
      const W = [
        [`${N} has ${v} stickers and gives away ${n}. Which expression shows how many are left?`, `${v} - ${n}`, [`${n} - ${v}`, `${v} + ${n}`, `${n}${v}`, `${v} ÷ ${n}`]],
        [`Each box holds ${n} crayons. Which expression shows the crayons in ${v} boxes?`, `${n}${v}`, [`${v} + ${n}`, `${v} ÷ ${n}`, `${n} ÷ ${v}`, `${n} - ${v}`]],
        [`Arcade tickets cost $${n} each, plus a $${m} fee per order. Which expression is the cost of ${v} tickets?`, `${n}${v} + ${m}`, [`${m}${v} + ${n}`, `${n}(${v} + ${m})`, `${n} + ${m} + ${v}`, `${n}${m}${v}`]],
        [`A pizza is cut into ${n} slices shared equally by ${v} friends. Which expression shows each friend's slices?`, `${n} ÷ ${v}`, [`${v} ÷ ${n}`, `${n}${v}`, `${n} - ${v}`, `${v} - ${n}`]],
        [`${N} had ${v} dollars, spent ${n}, then doubled what was left. Which expression shows the money now?`, `2(${v} - ${n})`, [`2${v} - ${n}`, `${v} - 2 × ${n}`, `2(${n} - ${v})`, `${v} - ${n} + 2`]],
      ];
      const word = d >= 2 && rand() < .5, [s, right, wr] = word ? pick(W) : pick(T.slice(0, d < 2 ? 4 : 7));
      return {
        topic: 'EXPRESSIONS', text: word ? s : `Which expression means "${s}"?`, ...textual(right, wr),
        steps: word ? ['Turn each action into math: gives away is -, each is ×, shared is ÷.', `So the expression is ${right}.`]
          : ['"Less than" and "more than" put the number after the variable.', 'Product is ×, quotient is ÷, sum is +.', `"${s}" is ${right}.`],
      };
    },

    // 6.EE.2c
    evaluate: d => {
      const v = pick(['x', 'n', 'y', 'm']), x = randInt(2, 9), a = randInt(2, 9), b = randInt(1, 15), f = pick(d < 2 ? ['one', 'one', 'formula'] : ['one', 'two', 'formula']);
      if (f === 'one') {
        const T = [[`${a}${v} + ${b}`, a * x + b, [Number(`${a}${x}`) + b, a + x + b, a * (x + b)]], [`${a}${v} - ${Math.min(b, a * x - 1)}`, a * x - Math.min(b, a * x - 1), [Number(`${a}${x}`) - Math.min(b, a * x - 1), a + x - Math.min(b, a * x - 1), a * (x - Math.min(b, a * x - 1))]],
          [`${v}^2 + ${b}`, x * x + b, [2 * x + b, (x + b) ** 2, x + 2 + b]], [`${a}(${v} + ${b})`, a * (x + b), [a * x + b, a + x + b, Number(`${a}${x}`) + b]]];
        const [e, ans, wr] = pick(T);
        return { topic: 'EXPRESSIONS', text: `What is the value of ${e} when ${v} = ${x}?`, ...nums(ans, wr.filter(w => w !== ans && w > 0)), steps: [`Put ${x} in for ${v}: ${e.replace(new RegExp(`(\\d)${v}`, 'g'), `$1(${x})`).replace(new RegExp(`\\b${v}\\b`, 'g'), String(x))}`, `= ${ans}`] };
      }
      if (f === 'two') {
        const p = randInt(2, 6), q = randInt(2, 6), ans = a * p + q * q;
        return { topic: 'EXPRESSIONS', text: `What is the value of ${a}a + b^2 when a = ${p} and b = ${q}?`, ...nums(ans, [a * p + 2 * q, a + p + q * q, a * q + p * p, a * p + q].filter(w => w !== ans)),
          steps: [`${a}(${p}) + ${q}^2`, `= ${a * p} + ${q * q}`, `= ${ans}`] };
      }
      const s = randInt(2, 9), r = randInt(3, 12) * 5, t = randInt(2, 6), l = randInt(5, 15), w = randInt(2, l - 1), C = randInt(1, 8) * 5;
      const [S, ans, wr, st] = pick([[`A square's area is A = s^2. What is A when s = ${s}?`, s * s, [2 * s, 4 * s, s + 2], [`A = ${s}^2 = ${s} × ${s}`, `= ${s * s}`]],
        [`A cube's volume is V = s^3. What is V when s = ${s}?`, s ** 3, [3 * s, s * s, s ** 3 - s * s], [`V = ${s}^3 = ${s} × ${s} × ${s}`, `= ${s ** 3}`]],
        [`Distance is d = rt. What is d when r = ${r} mph and t = ${t} hours?`, r * t, [r + t, r * t / 2, r * (t + 1)], [`d = ${r} × ${t}`, `= ${r * t} miles`]],
        [`A rectangle's perimeter is P = 2L + 2W. What is P when L = ${l} and W = ${w}?`, 2 * l + 2 * w, [l * w, l + w, 2 * l + w], [`P = 2(${l}) + 2(${w})`, `= ${2 * l} + ${2 * w} = ${2 * l + 2 * w}`]],
        [`F = 1.8C + 32 changes Celsius to Fahrenheit. What is F when C = ${C}?`, 1.8 * C + 32, [1.8 * C, C + 32, round(1.8 * (C + 32))], [`F = 1.8(${C}) + 32`, `= ${num(1.8 * C)} + 32 = ${num(1.8 * C + 32)}`]]]);
      return { topic: 'FORMULAS', text: S, ...nums(ans, wr.filter(w => w !== ans)), steps: st };
    },

    // 6.EE.3, 6.EE.4
    equivalent: d => {
      const v = pick(['x', 'y', 'n', 'a', 'm']), f = pick(d < 2 ? ['expand', 'same', 'combine'] : d < 3 ? ['expand', 'factor', 'combine'] : ['expand', 'factor', 'combine', 'mix']);
      if (f === 'expand') {
        const k = randInt(2, 9), a = d < 3 ? 1 : randInt(2, 5), c = randInt(1, 9), right = lin(k * a, k * c, v);
        return { topic: 'EXPRESSIONS', text: `Which expression is equivalent to ${k}(${lin(a, c, v)})?`, ...textual(right, [lin(k * a, c, v), lin(a, k * c, v), term(k * a + k * c, v), lin(k + a, k + c, v)]),
          steps: [`Distribute: multiply ${k} by each term inside.`, `${k} × ${term(a, v)} = ${term(k * a, v)} and ${k} × ${c} = ${k * c}`, `= ${right}`] };
      }
      if (f === 'factor') {
        const g = randInt(2, 6), [m, n] = pick([[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [1, 3], [4, 5], [5, 2], [3, 2]]), right = `${g}(${lin(m, n, v)})`;
        const wr = [`${g}(${lin(m, g * n, v)})`, `${g * m}(${v} + ${g * n})`, `${g}(${lin(m * g, n, v)})`, `${term(g * m + g * n, v)}`];
        if (m !== g) wr.push(`${m}(${lin(g, n, v)})`);
        return { topic: 'EXPRESSIONS', text: `Which expression is equivalent to ${lin(g * m, g * n, v)}?`, ...textual(right, wr),
          steps: [`${g} is a factor of both ${g * m} and ${g * n}.`, `${term(g * m, v)} = ${g} × ${term(m, v)} and ${g * n} = ${g} × ${n}`, `So ${lin(g * m, g * n, v)} = ${right}`] };
      }
      if (f === 'same') {
        const k = randInt(3, 5), e = Array(k).fill(v).join(' + ');
        return { topic: 'EXPRESSIONS', text: `Which expression is equivalent to ${e}?`, ...textual(`${k}${v}`, [`${v}^${k}`, `${v} + ${k}`, `${k}${v}^${k}`, `${k + 1}${v}`]),
          steps: [`Adding ${v} ${k} times is ${k} × ${v}.`, `${e} = ${k}${v}`, `(${v}^${k} would be multiplying, not adding.)`] };
      }
      if (f === 'combine') {
        const a = randInt(2, 9), b = randInt(1, 9), c = randInt(2, 9), right = lin(a + c, b, v);
        return { topic: 'EXPRESSIONS', text: `Which expression is equivalent to ${term(a, v)} + ${b} + ${term(c, v)}?`, ...textual(right, [term(a + b + c, v), lin(a * c, b, v), lin(a, b + c, v), `${a + c}${v}^2 + ${b}`]),
          steps: [`Combine the like terms: ${term(a, v)} + ${term(c, v)} = ${term(a + c, v)}`, `The ${b} has no ${v}, so it stays.`, `= ${right}`] };
      }
      const k = randInt(2, 5), a = randInt(2, 4), c = randInt(1, 9), e = randInt(1, 5), right = lin(k * a + e, k * c, v);
      return { topic: 'EXPRESSIONS', text: `Which expression is equivalent to ${k}(${lin(a, c, v)}) + ${term(e, v)}?`,
        ...textual(right, [lin(k * a + e, c, v), lin(k * a, k * c + e, v), lin(k * a + e, k * c + e, v), lin(a + e, k * c, v)]),
        steps: [`Distribute: ${k}(${lin(a, c, v)}) = ${lin(k * a, k * c, v)}`, `Add ${term(e, v)}: ${term(k * a, v)} + ${term(e, v)} = ${term(k * a + e, v)}`, `= ${right}`] };
    },

    // 6.EE.5, 6.EE.7
    oneStep: d => {
      const v = pick(['x', 'n', 'y', 'm', 'k']), f = pick(d < 3 ? ['add', 'sub', 'mul', 'div', 'model'] : ['add', 'sub', 'mul', 'div', 'frac', 'dec', 'model']);
      const x = randInt(2, d < 2 ? 20 : 60), p = randInt(2, d < 2 ? 12 : 25);
      if (f === 'add') return { topic: 'EQUATIONS', text: `What value of ${v} makes ${v} + ${p} = ${x + p} true?`, ...nums(x, [x + 2 * p, x + p, p]), steps: [`Subtract ${p} from both sides.`, `${v} = ${x + p} - ${p} = ${x}`] };
      if (f === 'sub') return { topic: 'EQUATIONS', text: `What value of ${v} makes ${v} - ${p} = ${x} true?`, ...nums(x + p, [x - p, x, p - x].filter(w => w > 0)), steps: [`Add ${p} to both sides.`, `${v} = ${x} + ${p} = ${x + p}`] };
      if (f === 'mul') { const q = randInt(2, 12), y = randInt(2, 15); return { topic: 'EQUATIONS', text: `Solve for ${v}: ${q}${v} = ${q * y}`, ...nums(y, [q * y - q, q * q * y, q * y + q]), steps: [`${q}${v} means ${q} × ${v}.`, `Divide both sides by ${q}: ${v} = ${q * y} ÷ ${q} = ${y}`] }; }
      if (f === 'div') { const q = randInt(2, 9), y = randInt(2, 12); return { topic: 'EQUATIONS', text: `Solve for ${v}: ${v} ÷ ${q} = ${y}`, ...nums(q * y, ints([y / q, y + q, y - q]).filter(w => w > 0)), steps: [`Multiply both sides by ${q}.`, `${v} = ${y} × ${q} = ${q * y}`] }; }
      if (f === 'frac') {
        const [a, b] = pick([[2, 3], [3, 4], [1, 2], [2, 5], [3, 5], [1, 3], [5, 6]]), k = randInt(2, 8), y = b * k, c = a * k;
        return { topic: 'EQUATIONS', text: `Solve for ${v}: (${a}/${b})${v} = ${c}`, ...nums(y, [c * a / b, c * b, c - a / b, c / b].filter(w => Math.abs(w - y) > 1e-9), mixed),
          steps: [`Multiply both sides by ${b}/${a}, the reciprocal.`, `${v} = ${c} × ${b}/${a}`, `= ${y}`] };
      }
      if (f === 'dec') {
        const y = randInt(101, 999) / 100, q = randInt(11, 99) / 10, r = round(y + q);
        return { topic: 'EQUATIONS', text: `Solve for ${v}: ${v} + ${num(q)} = ${num(r)}`, ...nums(y, [round(r + q), round(r - q / 10), round(y + 1), round(y - .1)], num, .1), steps: [`Subtract ${num(q)} from both sides.`, `${v} = ${num(r)} - ${num(q)} = ${num(y)}`] };
      }
      const N = who(), [S, right, wr] = pick([[`${N} had some baseball cards. After getting ${p} more, ${N} has ${x + p}. Which equation shows this?`, `c + ${p} = ${x + p}`, [`c - ${p} = ${x + p}`, `${p}c = ${x + p}`, `c + ${x + p} = ${p}`, `${p} - c = ${x + p}`]],
        [`${N} bought ${p} packs of gum, all the same price, for $${p * 3}. Which equation finds the price g of 1 pack?`, `${p}g = ${p * 3}`, [`g + ${p} = ${p * 3}`, `g ÷ ${p} = ${p * 3}`, `${p * 3}g = ${p}`, `g - ${p} = ${p * 3}`]],
        [`A class pet lizard is ${p} inches long. That is ${x} inches shorter than the snake. Which equation finds the snake's length s?`, `s - ${x} = ${p}`, [`s + ${x} = ${p}`, `${x}s = ${p}`, `s - ${p} = ${x + p}`, `${p} - s = ${x}`]]]);
      return { topic: 'EQUATIONS', text: S, ...textual(right, wr), steps: ['Name the unknown with the letter.', 'Turn the words into = with the right operation.', `So: ${right}`] };
    },

    // 6.EE.5, 6.EE.8
    inequalities: d => {
      const v = pick(['x', 'n', 'y', 'a']), c = randInt(-5, 5), ops = ['>', '≥', '<', '≤'], f = pick(d < 2 ? ['graph', 'words'] : ['graph', 'sol', 'words']);
      if (f === 'graph') {
        const op = pick(ops), open = op === '>' || op === '<', right = op === '>' || op === '≥';
        return {
          topic: 'INEQUALITIES', text: 'Which inequality does the number line show?', ...textual(`${v} ${op} ${c}`, ops.filter(o => o !== op).map(o => `${v} ${o} ${c}`)),
          steps: [open ? `The circle at ${c} is open: ${c} is not included.` : `The circle at ${c} is filled in: ${c} is included.`, `The arrow points ${right ? 'right, to bigger numbers' : 'left, to smaller numbers'}.`, `So: ${v} ${op} ${c}`],
          size: [150, 26], fig: (c2, w) => {
            const X = nline(c2, w, 10, c - 4, c + 4), x0 = X(c), x1 = right ? w - 2 : 1;
            F.box(c2, Math.min(x0, x1), 9, Math.abs(x1 - x0), 3, HOT); nlDot(c2, x0, 10, open);
            if (right) { F.line(c2, w - 2, 10, w - 6, 6, HOT); F.line(c2, w - 2, 10, w - 6, 14, HOT); } else { F.line(c2, 1, 10, 5, 6, HOT); F.line(c2, 1, 10, 5, 14, HOT); }
          },
        };
      }
      if (f === 'sol') {
        const op = pick(ops), ok = x => op === '>' ? x > c : op === '≥' ? x >= c : op === '<' ? x < c : x <= c;
        const cand = shuffle([c - 3, c - 2, c - 1, c, c + 1, c + 2, c + 3]), yes = cand.find(ok), no = cand.filter(x => !ok(x)).slice(0, 3);
        const vals = [yes, ...no].sort((p, q) => p - q);
        return { topic: 'INEQUALITIES', text: `Which number is a solution of ${v} ${op} ${c}?`, ...fixed(vals.map(String), String(yes)),
          steps: [`${v} ${op} ${c} means ${v} is ${op === '>' ? 'greater than' : op === '≥' ? 'greater than or equal to' : op === '<' ? 'less than' : 'less than or equal to'} ${c}.`, `${yes} ${op} ${c} is true.`, op === '>' || op === '<' ? `${c} itself does not count.` : `The others are on the wrong side of ${c}.`] };
      }
      const n = randInt(3, 60), [S, u, op] = pick([[`You must be at least ${n} inches tall to ride the coaster.`, 'h', '≥'], [`No more than ${n} people can ride the elevator.`, 'p', '≤'],
        [`Fewer than ${n} tickets are left for the show.`, 't', '<'], [`More than ${n} fans came to the game.`, 'f', '>'], [`A video game costs at most $${n}.`, 'c', '≤'],
        [`You need at least ${n} points to win a prize.`, 'p', '≥'], [`The robot weighs less than ${n} pounds.`, 'w', '<'], [`It snowed more than ${n} inches.`, 's', '>']]);
      return { topic: 'INEQUALITIES', text: `${S} Which inequality shows this?`, ...textual(`${u} ${op} ${n}`, ops.filter(o => o !== op).map(o => `${u} ${o} ${n}`)),
        steps: ['"At least" is ≥, "at most" and "no more than" are ≤.', '"More than" is >, "less than" and "fewer than" are <.', `So: ${u} ${op} ${n}`] };
    },

    // 6.EE.9
    variables: d => {
      const f = pick(['table', 'table', 'context', 'which', 'next']), add = rand() < .4, k = randInt(2, 9);
      const xs = d < 3 ? [1, 2, 3, 4] : pick([[1, 2, 4, 5], [2, 3, 5, 6], [0, 1, 3, 6]]), rule = x => add ? x + k : k * x, ys = xs.map(rule);
      const fig = (c, w, h) => table(c, w, h, [['x', ...xs], ['y', ...ys]], { first: 20, headCol: true, headRow: false });
      if (f === 'table') {
        const eqs = add ? [[`y = x + ${k}`, x => x + k], [`y = ${k}x`, x => k * x], [`y = ${ys[0] === 0 ? k + 1 : ys[0]}x`, x => (ys[0] || k + 1) * x], [`x = y + ${k}`, x => x - k], [`y = x - ${k}`, x => x - k]]
          : [[`y = ${k}x`, x => k * x], [`y = x + ${ys[1] - xs[1]}`, x => x + ys[1] - xs[1]], [`x = ${k}y`, x => x / k], [`y = ${k}x + 1`, x => k * x + 1], [`y = ${k + 1}x`, x => (k + 1) * x]];
        const fits = g => xs.every((x, i) => Math.abs(g(x) - ys[i]) < 1e-9), right = eqs[0][0];
        return { topic: 'VARIABLES', text: 'Which equation matches the table?', ...textual(right, eqs.slice(1).filter(e => !fits(e[1]) && e[0] !== right).map(e => e[0])),
          steps: [add ? `Each y is ${k} more than x.` : `Each y is ${k} times x.`, `Check: x = ${xs[2]} gives y = ${ys[2]}.`, `So ${right}`], size: [110, 30], fig };
      }
      if (f === 'next') {
        const X = xs[3] + randInt(2, 5);
        return { topic: 'VARIABLES', text: `The table follows one rule. What is y when x = ${X}?`, ...nums(rule(X), [ys[3] + (ys[3] - ys[2]), add ? k * X : X + k, rule(X) + 1].filter(w => w !== rule(X))),
          steps: [add ? `The rule is y = x + ${k}.` : `The rule is y = ${k}x.`, `y = ${add ? `${X} + ${k}` : `${k} × ${X}`} = ${rule(X)}`], size: [110, 30], fig };
      }
      if (f === 'context') {
        const [S, dv, iv] = pick([[`${who()} earns $${k} for each hour of babysitting. Which equation shows her pay p for h hours?`, 'p', 'h'],
          [`Each pack has ${k} trading cards. Which equation shows the cards c in n packs?`, 'c', 'n'], [`A robot walks ${k} feet each second. Which equation shows the distance d after t seconds?`, 'd', 't']]);
        return { topic: 'VARIABLES', text: S, ...textual(`${dv} = ${k}${iv}`, [`${iv} = ${k}${dv}`, `${dv} = ${iv} + ${k}`, `${dv} = ${iv} ÷ ${k}`, `${dv} = ${k}`]),
          steps: [`${dv} depends on ${iv}: each 1 adds ${k}.`, `So ${dv} = ${k} × ${iv}: ${dv} = ${k}${iv}`] };
      }
      const [S, dv, iv, dw, iw] = pick([[`The cost c of t movie tickets is c = ${k}t.`, 'c', 't', 'the cost', 'the tickets'], [`A plant grows g = ${k}w centimeters in w weeks.`, 'g', 'w', 'the growth', 'the weeks'],
        [`The distance d a bus goes in h hours is d = ${k * 10}h.`, 'd', 'h', 'the distance', 'the hours'], [`The points p for answering q questions is p = ${k}q.`, 'p', 'q', 'the points', 'the questions']]);
      const askDep = rand() < .5;
      return { topic: 'VARIABLES', text: `${S} Which is the ${askDep ? 'dependent' : 'independent'} variable?`, ...textual(askDep ? `${dv}, ${dw}` : `${iv}, ${iw}`, [askDep ? `${iv}, ${iw}` : `${dv}, ${dw}`, `${S.match(/= (\d+)/)[1]}, the rate`, 'both of them']),
        steps: [`${dv} depends on ${iv}: change ${iv} and ${dv} changes.`, `Dependent: ${dv}. Independent: ${iv}.`] };
    },

    // 6.G.1
    area: d => {
      const f = pick(d < 3 ? ['tri', 'para', 'trap', 'rt'] : ['tri', 'para', 'trap', 'rt', 'missing']);
      const half = d >= 3 && rand() < .4 ? .5 : 0, u = pick(['in.', 'ft', 'cm', 'm']), uu = { 'in.': 'inches', ft: 'feet', cm: 'centimeters', m: 'meters' }[u];
      if (f === 'missing') {
        const b = randInt(4, 16), h = randInt(2, 12) * (b % 2 ? 2 : 1), A = b * h / 2;
        return { topic: 'AREA', text: `A triangle has an area of ${A} square ${uu} and a base of ${b} ${uu}. What is its height?`, ...nums(h, [A / b, A - b, 2 * A * b, h / 2].filter(w => w > 0 && w !== h)),
          steps: ['A = 1/2 × b × h', `${A} = 1/2 × ${b} × h, so ${A} = ${b / 2}h`, `h = ${A} ÷ ${b / 2} = ${h}`] };
      }
      if (f === 'tri' || f === 'rt') {
        const b = randInt(4, 16) + half, h = randInt(3, 12), A = b * h / 2, t = f === 'rt' ? 0 : pick([.25, .35, .6, .75]);
        return { topic: 'AREA', text: `What is the area of the triangle, in square ${uu}?`, ...nums(A, [b * h, b + h, round(A + b), round(A - h)].filter(w => w > 0 && w !== A), num, .5),
          steps: ['Area of a triangle = 1/2 × base × height', `= 1/2 × ${num(b)} × ${h}`, `= ${num(A)} square ${uu}`],
          size: [120, 64], fig: (c, w, H) => {
            const s = Math.min((w - 30) / b, (H - 18) / h), x0 = 8, y0 = H - 12, A0 = [x0, y0], B0 = [x0 + Math.round(b * s), y0], C0 = [x0 + Math.round(t * b * s), y0 - Math.round(h * s)];
            F.outlinePoly(c, [A0, B0, C0], INK);
            if (f === 'rt') F.rightMark(c, A0[0], A0[1], 1, -1); else { F.line(c, C0[0], C0[1], C0[0], y0, HOT, 2); F.rightMark(c, C0[0], y0, 1, -1); }
            L(c, num(b), (A0[0] + B0[0]) / 2, y0 + 7); L(c, String(h), C0[0] + 4, (C0[1] + y0) / 2, HOT, 'left');
          } };
      }
      if (f === 'para') {
        const [o, h, sd] = pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [9, 12, 15], [2.5, 6, 6.5]]), b = randInt(Math.max(5, Math.ceil(o)), 15) + half, A = b * h;
        return { topic: 'AREA', text: `What is the area of the parallelogram, in square ${uu}?`, ...nums(A, [b * sd, A / 2, 2 * (b + sd), b + h].filter(w => w !== A), num, .5),
          steps: ['Area of a parallelogram = base × height', `Use the height (${h}), not the slanted side (${num(sd)}).`, `${num(b)} × ${h} = ${num(A)} square ${uu}`],
          size: [130, 64], fig: (c, w, H) => {
            const s = Math.min((w - 20) / (b + o), (H - 18) / h), y0 = H - 12, x0 = 6, ox = Math.round(o * s), bw = Math.round(b * s), hh = Math.round(h * s);
            const P = [[x0, y0], [x0 + bw, y0], [x0 + bw + ox, y0 - hh], [x0 + ox, y0 - hh]];
            F.outlinePoly(c, P, INK); F.line(c, P[3][0], P[3][1], P[3][0], y0, HOT, 2); F.rightMark(c, P[3][0], y0, 1, -1);
            L(c, num(b), x0 + bw / 2, y0 + 7); L(c, String(h), P[3][0] + 4, y0 - hh / 2, HOT, 'left'); L(c, num(sd), x0 + bw + ox / 2 + 4, y0 - hh / 2, DIM, 'left');
          } };
      }
      const b1 = randInt(6, 16), b2 = randInt(3, b1 - 2), h = randInt(3, 10) + (d >= 3 ? 0 : 0), A = (b1 + b2) * h / 2;
      return { topic: 'AREA', text: `What is the area of the trapezoid, in square ${uu}?`, ...nums(A, [(b1 + b2) * h, b1 * h, b2 * h, b1 * b2 * h / 2].filter(w => w !== A), num, .5),
        steps: ['Area of a trapezoid = 1/2 × (base 1 + base 2) × height', `= 1/2 × (${b1} + ${b2}) × ${h}`, `= 1/2 × ${b1 + b2} × ${h} = ${num(A)}`],
        size: [120, 64], fig: (c, w, H) => {
          const s = Math.min((w - 16) / b1, (H - 24) / h), y0 = H - 12, x0 = 6, bw = Math.round(b1 * s), tw = Math.round(b2 * s), hh = Math.round(h * s), off = Math.round((bw - tw) / 3);
          const P = [[x0, y0], [x0 + bw, y0], [x0 + off + tw, y0 - hh], [x0 + off, y0 - hh]];
          F.outlinePoly(c, P, INK); F.line(c, P[3][0], P[3][1], P[3][0], y0, HOT, 2); F.rightMark(c, P[3][0], y0, 1, -1);
          L(c, String(b1), x0 + bw / 2, y0 + 7); L(c, String(b2), x0 + off + tw / 2, y0 - hh - 6); L(c, String(h), P[3][0] + 4, y0 - hh / 2 + 2, HOT, 'left');
        } };
    },

    // 6.G.1: shapes made of rectangles and triangles
    compositeArea: d => {
      const f = pick(['L', 'house']), u = pick(['feet', 'meters', 'yards']);
      if (f === 'L') {
        const W = randInt(8, 14), H = randInt(6, 10), a = randInt(3, W - 3), b = randInt(2, H - 3), A = W * H - (W - a) * (H - b);
        return { topic: 'AREA', text: `What is the area of the shape, in square ${u}? All the corners are right angles.`, ...nums(A, [W * H, 2 * (W + H), W * b + a * H, a * b].filter(w => w !== A)),
          steps: [`Split it into two rectangles.`, `Bottom: ${W} × ${b} = ${W * b}. Top: ${a} × ${H - b} = ${a * (H - b)}`, `${W * b} + ${a * (H - b)} = ${A} square ${u}`],
          size: [110, 70], fig: (c, w, h) => {
            const s = Math.min((w - 24) / W, (h - 24) / H), x0 = 14, y0 = h - 11, X = v => x0 + Math.round(v * s), Y = v => y0 - Math.round(v * s);
            F.outlinePoly(c, [[X(0), Y(0)], [X(W), Y(0)], [X(W), Y(b)], [X(a), Y(b)], [X(a), Y(H)], [X(0), Y(H)]], INK);
            L(c, String(W), (X(0) + X(W)) / 2, y0 + 7); L(c, String(H), x0 - 3, (Y(0) + Y(H)) / 2, INK, 'right');
            L(c, String(a), (X(0) + X(a)) / 2, Y(H) - 6); L(c, String(b), X(W) + 3, (Y(0) + Y(b)) / 2, INK, 'left');
          } };
      }
      const W = randInt(3, 8) * 2, H = randInt(3, 7), r = randInt(3, 6), A = W * H + W * r / 2;
      return { topic: 'AREA', text: `The shape is a rectangle with a triangle on top. What is its area, in square ${u}?`, ...nums(A, [W * H + W * r, W * (H + r), W * H, W * H + r].filter(w => w !== A)),
        steps: [`Rectangle: ${W} × ${H} = ${W * H}`, `Triangle: 1/2 × ${W} × ${r} = ${W * r / 2}`, `Total: ${W * H} + ${W * r / 2} = ${A}`],
        size: [100, 72], fig: (c, w, h) => {
          const s = Math.min((w - 30) / W, (h - 14) / (H + r)), x0 = 6, y0 = h - 11, X = v => x0 + Math.round(v * s), Y = v => y0 - Math.round(v * s);
          F.outlinePoly(c, [[X(0), Y(0)], [X(W), Y(0)], [X(W), Y(H)], [X(W / 2), Y(H + r)], [X(0), Y(H)]], INK); F.line(c, X(0), Y(H), X(W), Y(H), DIM, 2);
          F.line(c, X(W / 2), Y(H + r), X(W / 2), Y(H), HOT, 2);
          L(c, String(W), (X(0) + X(W)) / 2, y0 + 7); L(c, String(H), X(W) + 3, (Y(0) + Y(H)) / 2, INK, 'left'); L(c, String(r), X(W / 2) + 3, (Y(H) + Y(H + r)) / 2 + 1, HOT, 'left');
        } };
    },

    // 6.G.2
    volume: d => {
      const pool = d < 2 ? [2, 3, 4, 5, 6] : [1.5, 2, 2.5, 3, 4, 3.5, 5, 1, .5];
      let [l, w, h] = [pick(pool), pick(pool), pick(pool)]; if (d >= 2 && [l, w, h].every(Number.isInteger)) l += .5;
      const V = l * w * h, f = pick(d < 2 ? ['vol'] : d < 4 ? ['vol', 'vol', 'cubes'] : ['vol', 'cubes', 'missing']), u = pick(['feet', 'inches', 'meters']);
      const fig = (c, W, H) => prism(c, W, H, [mixed(l), mixed(h), mixed(w)]);
      if (f === 'cubes') {
        const n = V * 8;
        return { topic: 'VOLUME', text: `How many 1/2-inch cubes fill a box ${mixed(l)} by ${mixed(w)} by ${mixed(h)} inches?`, ...nums(n, [V, V * 2, V * 4, n / 2].filter(x => x !== n), num, 4),
          steps: [`Each 1/2-inch cube has volume 1/2 × 1/2 × 1/2 = 1/8 cubic inch.`, `The box: ${mixed(l)} × ${mixed(w)} × ${mixed(h)} = ${mixed(V)} cubic inches`, `${mixed(V)} ÷ 1/8 = ${num(n)} cubes`] };
      }
      if (f === 'missing') return { topic: 'VOLUME', text: `A box holds ${mixed(V)} cubic ${u}. It is ${mixed(l)} ${u} long and ${mixed(w)} ${u} wide. How tall is it?`,
        ...nums(h, [V - l - w, V / l, l * w, h + 1].filter(x => x > 0 && x !== h), mixed, .5), steps: ['V = length × width × height', `${mixed(V)} = ${mixed(l)} × ${mixed(w)} × h = ${mixed(l * w)}h`, `h = ${mixed(V)} ÷ ${mixed(l * w)} = ${mixed(h)}`] };
      return { topic: 'VOLUME', text: `What is the volume of the box, in cubic ${u}?`, ...nums(V, [l + w + h, l * w, 2 * (l * w + l * h + w * h), V * 2].filter(x => x !== V), mixed, .5),
        steps: ['Volume = length × width × height', `= ${mixed(l)} × ${mixed(w)} × ${mixed(h)}`, `= ${mixed(V)} cubic ${u}`], size: [120, 60], fig };
    },

    // 6.G.4
    nets: d => {
      const f = pick(d < 2 ? ['which', 'cube'] : d < 3 ? ['which', 'cube', 'rect'] : ['which', 'rect', 'rect', 'pyramid']);
      const sq = (c, x, y, a, b) => { F.box(c, x, y, a, b, '#1c2c60'); F.outlinePoly(c, [[x, y], [x + a, y], [x + a, y + b], [x, y + b]], INK); };
      const tri = (c, pts) => { F.fillPoly(c, pts, '#1c2c60'); F.outlinePoly(c, pts, INK); };
      if (f === 'which') {
        const kinds = ['cube', 'rectangular prism', 'triangular prism', 'square pyramid', 'triangular pyramid'], k = pick(kinds);
        return { topic: 'NETS', text: 'What solid does this net fold into?', ...textual(k, shuffle(kinds.filter(x => x !== k))),
          steps: [{ cube: '6 squares, all the same size.', 'rectangular prism': '6 rectangles, in matching pairs.', 'triangular prism': '2 triangles and 3 rectangles.', 'square pyramid': '1 square and 4 triangles.', 'triangular pyramid': '4 triangles.' }[k], `That folds into a ${k}.`],
          size: [100, 72], fig: (c, w, h) => {
            if (k === 'cube') { const s = 16, x0 = 18, y0 = 4; for (let i = 0; i < 4; i++) sq(c, x0 + i * s, y0 + s, s, s); sq(c, x0 + s, y0, s, s); sq(c, x0 + s, y0 + 2 * s, s, s); }
            else if (k === 'rectangular prism') { const a = 22, b = 12, hh = 18, x0 = 4, y0 = 6; sq(c, x0, y0 + b, b, hh); sq(c, x0 + b, y0 + b, a, hh); sq(c, x0 + b + a, y0 + b, b, hh); sq(c, x0 + 2 * b + a, y0 + b, a, hh); sq(c, x0 + b, y0, a, b); sq(c, x0 + b, y0 + b + hh, a, b); }
            else if (k === 'triangular prism') { const a = 18, hh = 26, x0 = 23, y0 = 18; for (let i = 0; i < 3; i++) sq(c, x0 + i * a, y0, a, hh); tri(c, [[x0 + a, y0], [x0 + 2 * a, y0], [x0 + 1.5 * a, y0 - 15]]); tri(c, [[x0 + a, y0 + hh], [x0 + 2 * a, y0 + hh], [x0 + 1.5 * a, y0 + hh + 15]]); }
            else if (k === 'square pyramid') { const s = 22, cx = 50, cy = 36, x0 = cx - s / 2, y0 = cy - s / 2; sq(c, x0, y0, s, s); tri(c, [[x0, y0], [x0 + s, y0], [cx, y0 - 16]]); tri(c, [[x0, y0 + s], [x0 + s, y0 + s], [cx, y0 + s + 16]]); tri(c, [[x0, y0], [x0, y0 + s], [x0 - 16, cy]]); tri(c, [[x0 + s, y0], [x0 + s, y0 + s], [x0 + s + 16, cy]]); }
            else { const A = [50, 4], B = [14, 66], C = [86, 66], m = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; tri(c, [A, B, C]); F.outlinePoly(c, [m(A, B), m(B, C), m(C, A)], INK); }
          } };
      }
      if (f === 'cube') {
        const s = randInt(2, 9), SA = 6 * s * s;
        return { topic: 'SURFACE AREA', text: `The net folds into a cube with edges of ${s} cm. What is its surface area, in square centimeters?`, ...nums(SA, [s ** 3, 4 * s * s, 6 * s, 5 * s * s].filter(x => x !== SA)),
          steps: ['A cube has 6 square faces.', `Each face: ${s} × ${s} = ${s * s}`, `6 × ${s * s} = ${SA} square cm`],
          size: [92, 56], fig: c => { const q = 13, x0 = 18, y0 = 2; for (let i = 0; i < 4; i++) sq(c, x0 + i * q, y0 + q, q, q); sq(c, x0 + q, y0, q, q); sq(c, x0 + q, y0 + 2 * q, q, q); L(c, String(s), x0 - 4, y0 + 1.5 * q + 1, HOT, 'right'); } };
      }
      if (f === 'pyramid') {
        const s = randInt(3, 10), l = randInt(4, 12), SA = s * s + 2 * s * l;
        return { topic: 'SURFACE AREA', text: `The net folds into a square pyramid. What is its surface area, in square inches?`, ...nums(SA, [s * s + 4 * s * l, 2 * s * l, s * s * l, s * s + s * l].filter(x => x !== SA)),
          steps: [`Square base: ${s} × ${s} = ${s * s}`, `4 triangles: 4 × 1/2 × ${s} × ${l} = ${2 * s * l}`, `Total: ${s * s} + ${2 * s * l} = ${SA} square inches`],
          size: [100, 76], fig: (c, w, h) => {
            const S = 22, cx = 50, cy = 38, x0 = cx - S / 2, y0 = cy - S / 2, T = 16;
            sq(c, x0, y0, S, S); tri(c, [[x0, y0], [x0 + S, y0], [cx, y0 - T]]); tri(c, [[x0, y0 + S], [x0 + S, y0 + S], [cx, y0 + S + T]]); tri(c, [[x0, y0], [x0, y0 + S], [x0 - T, cy]]); tri(c, [[x0 + S, y0], [x0 + S, y0 + S], [x0 + S + T, cy]]);
            F.line(c, x0 + S + 1, cy, x0 + S + T - 1, cy, HOT, 1); L(c, String(l), x0 + S + T / 2 + 1, cy - 6, HOT); L(c, String(s), cx, y0 + S / 2 + 1, INK);
          } };
      }
      const l = randInt(3, 8), w = randInt(2, 5), h = randInt(2, 6), SA = 2 * (l * w + l * h + w * h);
      return { topic: 'SURFACE AREA', text: 'The net folds into a box. What is the surface area of the box, in square units?', ...nums(SA, [l * w * h, l * w + l * h + w * h, 6 * l * w, 2 * l * w + l * h + w * h].filter(x => x !== SA)),
        steps: [`Two of each face: ${l} × ${w} = ${l * w}, ${l} × ${h} = ${l * h}, ${w} × ${h} = ${w * h}`, `2 × (${l * w} + ${l * h} + ${w * h})`, `= ${SA} square units`],
        size: [150, 78], fig: (c, W, H) => {
          const s = Math.floor(Math.min((W - 14) / (2 * (l + w)), (H - 12) / (h + 2 * w))), x0 = 10, y0 = 2;
          sq(c, x0, y0 + w * s, w * s, h * s); sq(c, x0 + w * s, y0 + w * s, l * s, h * s); sq(c, x0 + (w + l) * s, y0 + w * s, w * s, h * s); sq(c, x0 + (2 * w + l) * s, y0 + w * s, l * s, h * s);
          sq(c, x0 + w * s, y0, l * s, w * s); sq(c, x0 + w * s, y0 + (w + h) * s, l * s, w * s);
          L(c, String(l), x0 + w * s + l * s / 2, y0 + (2 * w + h) * s + 6, HOT); L(c, String(w), x0 + w * s - 3, y0 + w * s / 2 + 1, HOT, 'right'); L(c, String(h), x0 - 3, y0 + w * s + h * s / 2 + 1, HOT, 'right');
        } };
    },

    // 6.SP.1
    statQuestion: () => {
      const P = [['How long do the kids in my class sleep each night?', 'How long did Leo sleep last night?'], ['How tall are the sixth graders at our school?', 'How tall is the school flagpole?'],
        ['How many pets do the families on my street have?', 'How many pets does Mei have?'], ['How long does it take our class to get to school?', 'What time does school start?'],
        ['How many books did each student read this summer?', 'How many books are on this shelf?'], ['How old are the people at the skate park?', 'How old is my grandma?'],
        ['How many points did our team score in each game?', 'How many points is a touchdown worth?'], ['What are the shoe sizes of the kids in my class?', 'What is my shoe size?']];
      const not = rand() < .4, s = shuffle(P.slice()), right = not ? s[0][1] : s[0][0], wr = s.slice(1, 5).map(p => not ? p[0] : p[1]);
      return { topic: 'STATISTICS', text: not ? 'Which is NOT a statistical question?' : 'Which is a statistical question?', ...textual(right, wr),
        steps: ['A statistical question expects answers that vary.', not ? `"${right}" has just one answer.` : `"${right}" has many different answers.`] };
    },

    // 6.SP.5c: mean, median, mode, range
    centerStats: d => {
      const [ctx, lo] = pick([['Goals in each soccer game', 0], ['Minutes spent reading', 10], ['Quiz scores', 4], ['Hours of video games each week', 1], ['Books read by each friend', 1], ['Pets in each home', 0]]);
      const f = pick(['mean', 'median', 'mode', 'range']), n = d < 3 ? 5 : randInt(6, 8), m = lo + randInt(3, 9);
      let data;
      if (f === 'mean') data = dataWithMean(n, m, 4, lo);
      else if (f === 'mode') { const M = m, others = sample([...Array(12).keys()].map(k => lo + k).filter(x => x !== M), n - 3); data = shuffle([M, M, M, ...others]); }
      else data = Array.from({ length: f === 'median' && n % 2 === 0 && d < 3 ? n + 1 : n }, () => lo + randInt(0, 12));
      const s = data.slice().sort((a, b) => a - b), N = data.length, sum = data.reduce((a, b) => a + b, 0), mean = sum / N;
      const med = N % 2 ? s[(N - 1) / 2] : (s[N / 2 - 1] + s[N / 2]) / 2, range = s[N - 1] - s[0];
      const text = `${ctx}: ${data.join(', ')}. What is the ${f}?`;
      if (f === 'mean') return { topic: 'STATISTICS', text, ...nums(mean, [med, round(sum / (N - 1), 1), range, mean + 1].filter(v => v !== mean)), steps: [`Add them: ${sum}`, `Divide by how many (${N}): ${sum} ÷ ${N} = ${num(mean)}`] };
      if (f === 'median') {
        const mid = N % 2 ? data[(N - 1) / 2] : (data[N / 2 - 1] + data[N / 2]) / 2;
        return { topic: 'STATISTICS', text, ...nums(med, [mid, round(mean, 1), range, s[Math.floor(N / 2) + 1]].filter(v => v !== med), num, .5),
          steps: ['Put them in order first:', s.join(', '), N % 2 ? `The middle one is ${med}.` : `Middle two: ${s[N / 2 - 1]} and ${s[N / 2]}. Halfway: ${num(med)}`] };
      }
      if (f === 'mode') return { topic: 'STATISTICS', text, ...nums(m, [s[N - 1], med, 3, range].filter(v => v !== m)), steps: ['The mode is the value that shows up most.', `${m} appears 3 times.`] };
      return { topic: 'STATISTICS', text, ...nums(range, [s[N - 1], s[N - 1] - s[1], s[N - 2] - s[0], med].filter(v => v !== range)), steps: ['Range = greatest - least', `${s[N - 1]} - ${s[0]} = ${range}`] };
    },

    // 6.SP.4, 6.SP.5
    dotPlots: d => {
      const [ctx, unit, who0] = pick([['pets each student has', 'pets', 'students'], ['books each friend read', 'books', 'friends'], ['goals the team scored in each game', 'goals', 'games'],
        ['siblings each student has', 'siblings', 'students'], ['hours each player practiced', 'hours', 'players']]);
      const lo = pick([0, 0, 1, 2]), counts = Array.from({ length: 6 }, () => randInt(0, 6));
      const top = counts.indexOf(Math.max(...counts)); counts[top] = Math.min(8, counts[top] + 2);
      let n = counts.reduce((a, b) => a + b, 0); const f = pick(d < 2 ? ['total', 'mode', 'atleast'] : ['total', 'mode', 'median', 'atleast', 'range']);
      if (f === 'median' && n % 2 === 0) { const i = counts.findIndex((k, j) => j !== top && k < 8); counts[i]++; n++; }
      const vals = []; counts.forEach((k, i) => { for (let j = 0; j < k; j++) vals.push(lo + i); });
      const fig = (c, w, h) => dotPlot(c, w, h, lo, lo + 5, counts);
      const base = { topic: 'DOT PLOTS', size: [120, 64], fig }, intro = `The dot plot shows the ${ctx}.`;
      if (f === 'total') return { ...base, text: `${intro} How many ${who0} are shown?`, ...nums(n, [6, Math.max(...counts), vals.reduce((a, b) => a + b, 0)].filter(v => v !== n)), steps: ['Each dot is one.', `Add the columns: ${counts.join(' + ')} = ${n}`] };
      if (f === 'mode') return { ...base, text: `${intro} What is the mode?`, ...nums(lo + top, [counts[top], lo + 5, vals[Math.floor(n / 2)]].filter(v => v !== lo + top)), steps: ['The mode has the tallest column of dots.', `That is ${lo + top}, with ${counts[top]} dots.`, `(${counts[top]} is how many, not the value.)`] };
      if (f === 'median') { const med = vals[(n - 1) / 2]; return { ...base, text: `${intro} What is the median?`, ...nums(med, [lo + 2.5, lo + top, med + 1, med - 1].filter(v => v !== med && Number.isInteger(v))), steps: [`There are ${n} dots. The middle one is number ${(n + 1) / 2}.`, `Count from the left: dot ${(n + 1) / 2} is at ${med}.`] }; }
      if (f === 'range') { const r = vals[n - 1] - vals[0]; return { ...base, text: `${intro} What is the range?`, ...nums(r, [vals[n - 1], 5, Math.max(...counts) - Math.min(...counts)].filter(v => v !== r)), steps: [`Greatest value with a dot: ${vals[n - 1]}. Least: ${vals[0]}.`, `${vals[n - 1]} - ${vals[0]} = ${r}`] }; }
      const k = lo + randInt(1, 4), ans = vals.filter(v => v >= k).length, exact = vals.filter(v => v === k).length;
      return { ...base, text: `${intro} How many ${who0} had at least ${k} ${unit}?`, ...nums(ans, [exact, vals.filter(v => v > k).length, n - ans].filter(v => v !== ans)),
        steps: [`"At least ${k}" means ${k} or more.`, `Add the dots from ${k} up: ${counts.slice(k - lo).join(' + ')} = ${ans}`] };
    },

    // 6.SP.4, 6.SP.5c
    boxPlots: d => {
      const u = d < 2 ? 1 : pick([1, 2, 5]), f5 = [...Array(19).keys()].map(k => k + 1);
      const five = sample(f5, 5).sort((a, b) => a - b).map(k => k * u), [mn, q1, md, q3, mx] = five;
      const ctx = u === 5 ? 'test scores' : pick(['minutes it took students to walk to school', 'points scored in each game', 'ages of the people at a party', 'laps each swimmer finished']);
      const f = pick(d < 2 ? ['median', 'range', 'q'] : ['median', 'iqr', 'range', 'q', 'pct']);
      const base = { topic: 'BOX PLOTS', size: [164, 44], fig: (c, w) => { const X = nline(c, w, 30, 0, 20 * u, { step: u, every: u === 5 ? 4 : 5, arrows: false, x0: 8, x1: w - 9 }); boxPlot(c, X, 13, five); } };
      const intro = `The box plot shows ${ctx}.`;
      if (f === 'median') return { ...base, text: `${intro} What is the median?`, ...nums(md, [q1, q3, (mn + mx) / 2].filter(v => v !== md && v % u === 0), num, u), steps: ['The line inside the box is the median.', `It is at ${md}.`] };
      if (f === 'iqr') return { ...base, text: `${intro} What is the interquartile range?`, ...nums(q3 - q1, [mx - mn, q3, md - q1].filter(v => v !== q3 - q1), num, u), steps: ['IQR = Q3 - Q1: the width of the box.', `Q3 = ${q3}, Q1 = ${q1}`, `${q3} - ${q1} = ${q3 - q1}`] };
      if (f === 'range') return { ...base, text: `${intro} What is the range?`, ...nums(mx - mn, [q3 - q1, mx, q3 - mn].filter(v => v !== mx - mn), num, u), steps: ['Range = maximum - minimum: the ends of the whiskers.', `${mx} - ${mn} = ${mx - mn}`] };
      if (f === 'q') { const up = rand() < .5, a = up ? q3 : q1; return { ...base, text: `${intro} What is the ${up ? 'upper' : 'lower'} quartile?`, ...nums(a, [md, up ? mx : mn, up ? q1 : q3].filter(v => v !== a), num, u), steps: [`The box goes from the lower quartile to the upper quartile.`, `The ${up ? 'right' : 'left'} edge of the box is at ${a}.`] }; }
      const [S, ans] = pick([[`greater than ${q3}`, '25%'], [`less than ${md}`, '50%'], [`between ${q1} and ${q3}`, '50%'], [`greater than ${q1}`, '75%'], [`less than ${q3}`, '75%'], [`less than ${q1}`, '25%']]);
      return { ...base, text: `${intro} About what percent of the data is ${S}?`, ...fixed(['25%', '50%', '75%', '100%'], ans), steps: ['A box plot splits the data into 4 parts, 25% each.', `${S}: that is ${ans}.`] };
    },

    // 6.SP.5c, 6.SP.3
    spread: d => {
      const f = pick(d < 3 ? ['iqr', 'which'] : ['iqr', 'mad', 'mad', 'which']);
      if (f === 'which') {
        const ctr = rand() < .5, V = ['the range', 'the interquartile range', 'the mean absolute deviation'], C = ['the mean', 'the median', 'the mode'];
        return { topic: 'STATISTICS', text: `Which is a measure of ${ctr ? 'center' : 'variability (spread)'}?`, ...textual(pick(ctr ? C : V), shuffle(ctr ? V : C)),
          steps: ['Mean, median and mode tell where the middle is.', 'Range, IQR and MAD tell how spread out the data is.'] };
      }
      if (f === 'iqr') {
        const n = pick([7, 8, 9, 11]), data = Array.from({ length: n }, () => randInt(1, 30)), s = data.slice().sort((a, b) => a - b);
        const med = arr => arr.length % 2 ? arr[(arr.length - 1) / 2] : (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2;
        const h = Math.floor(n / 2), lower = s.slice(0, h), upper = s.slice(n - h), Q1 = med(lower), Q3 = med(upper), iqr = Q3 - Q1;
        return { topic: 'STATISTICS', text: `Find the interquartile range: ${(d < 2 ? s : data).join(', ')}`, ...nums(iqr, [s[n - 1] - s[0], Q3, Q1, Q3 - med(s)].filter(v => v !== iqr), num, .5),
          steps: [`In order: ${s.join(', ')}`, `Lower half's median Q1 = ${num(Q1)}. Upper half's median Q3 = ${num(Q3)}.`, `IQR = ${num(Q3)} - ${num(Q1)} = ${num(iqr)}`] };
      }
      const n = pick([4, 5, 6]), m = randInt(5, 15), data = dataWithMean(n, m, 5, 0), dev = data.map(x => Math.abs(x - m)), tot = dev.reduce((a, b) => a + b, 0), mad = tot / n;
      return { topic: 'STATISTICS', text: `The mean of ${data.join(', ')} is ${m}. What is the mean absolute deviation?`, ...nums(mad, [tot, Math.max(...data) - Math.min(...data), round(tot / (n - 1), 2), m].filter(v => Math.abs(v - mad) > 1e-9), v => num(v, 2), .5),
        steps: [`Distance of each from ${m}: ${dev.join(', ')}`, `Add them: ${tot}`, `Divide by ${n}: ${tot} ÷ ${n} = ${num(mad, 2)}`] };
    },

    // 6.SP.4
    histograms: d => {
      const [ctx, w0, who0] = pick([['minutes spent on homework', 10, 'students'], ['ages of the people at the arcade', 10, 'people'], ['points scored in each game', 10, 'games'], ['hours each kid spent outside this week', 5, 'kids']]);
      const counts = [randInt(1, 12), randInt(2, 12), randInt(2, 12), randInt(1, 12)], labs = counts.map((_, i) => `${i * w0}-${i * w0 + w0 - 1}`), n = counts.reduce((a, b) => a + b, 0);
      const f = pick(d < 2 ? ['read', 'total'] : ['read', 'total', 'atleast', 'most']), i = randInt(0, 3);
      const base = { topic: 'HISTOGRAMS', size: [164, 70], fig: (c, w, h) => {

        const left = 16, y0 = h - 11, top = 12, s = (y0 - 4) / top, bw = Math.floor((w - left - 2) / 4);
        for (let v = 0; v <= top; v += 4) { const y = Math.round(y0 - v * s); F.line(c, left, y, w - 1, y, GRID); L(c, String(v), left - 3, y + 1, DIM, 'right'); }
        counts.forEach((k, j) => { const x = left + j * bw, y = Math.round(y0 - k * s); F.box(c, x, y, bw, y0 - y, j % 2 ? BLU : '#4880d0'); F.outlinePoly(c, [[x, y], [x + bw, y], [x + bw, y0], [x, y0]], INK); L(c, labs[j], x + bw / 2, y0 + 6, DIM); });
      } };
      const intro = `The histogram shows the ${ctx}.`;
      if (f === 'read') return { ...base, text: `${intro} How many are in the ${labs[i]} group?`, ...nums(counts[i], [counts[(i + 1) % 4], n, i * w0].filter(v => v !== counts[i])), steps: [`Find the ${labs[i]} bar.`, `Its top is at ${counts[i]}.`] };
      if (f === 'total') return { ...base, text: `${intro} How many ${who0} are shown in all?`, ...nums(n, [4, Math.max(...counts), n - counts[0]].filter(v => v !== n)), steps: ['Add the heights of all the bars.', `${counts.join(' + ')} = ${n}`] };
      if (f === 'atleast') { const k = randInt(1, 2), ans = counts.slice(k).reduce((a, b) => a + b, 0); return { ...base, text: `${intro} How many are ${k * w0} or more?`, ...nums(ans, [counts[k], n - ans, counts.slice(k + 1).reduce((a, b) => a + b, 0)].filter(v => v !== ans)), steps: [`${k * w0} or more: the bars from ${labs[k]} on.`, `${counts.slice(k).join(' + ')} = ${ans}`] }; }
      const best = counts.indexOf(Math.max(...counts));
      counts.forEach((k, j) => { if (j !== best && k >= counts[best]) counts[j] = Math.max(1, counts[best] - randInt(1, 3)); });
      return { ...base, text: `${intro} Which group has the most?`, ...fixed(labs, labs[best]), steps: ['The tallest bar has the most.', `That is ${labs[best]}, with ${counts[best]}.`] };
    },

    // 6.SP.2, 6.SP.3, 6.SP.5d
    describeData: d => {
      const f = pick(d < 2 ? ['outlier', 'shape'] : ['outlier', 'remove', 'shape']);
      if (f === 'shape') {
        const k = pick(['symmetric', 'skewed right', 'skewed left']);
        const counts = k === 'symmetric' ? pick([[1, 3, 5, 7, 5, 3, 1], [1, 2, 4, 6, 4, 2, 1], [2, 3, 6, 7, 6, 3, 2]]) : k === 'skewed right' ? pick([[3, 7, 6, 4, 2, 1, 1], [5, 7, 4, 3, 2, 1, 0], [2, 6, 7, 4, 2, 1, 1]]) : pick([[1, 1, 2, 4, 6, 7, 3], [0, 1, 2, 3, 4, 7, 5], [1, 1, 2, 4, 7, 6, 2]]);
        return { topic: 'DOT PLOTS', text: 'Which word best describes the shape of the dot plot?', ...fixed(['symmetric', 'skewed left', 'skewed right', 'uniform (flat)'], k),
          steps: ['Symmetric: both sides match. Uniform: all the same height.', 'Skewed: a long tail on one side, named for the tail.', `This one is ${k}.`], size: [120, 64], fig: (c, w, h) => dotPlot(c, w, h, 1, 7, counts) };
      }
      const base = randInt(10, 20), data = shuffle([base, base + 1, base + 1, base + 2, base + 3, base + 2, base - 1].slice(0, randInt(5, 7))), out = base + randInt(30, 60), all = shuffle([...data, out]);
      if (f === 'outlier') return { topic: 'STATISTICS', text: `${who()}'s scores: ${all.join(', ')}. Which best describes a typical score?`, ...textual('the median', ['the mean', 'the range', 'the greatest score']),
        steps: [`${out} is an outlier, far from the rest.`, 'It pulls the mean up, but barely moves the median.', 'So the median describes a typical score best.'] };
      return { topic: 'STATISTICS', text: `The data: ${all.join(', ')}. If ${out} is removed, which changes the most?`, ...fixed(['the mean', 'the median', 'the mode', 'none of them'], 'the mean'),
        steps: [`${out} is far from the others: an outlier.`, 'Taking it away pulls the mean down a lot.', 'The median and mode barely move.'] };
    },
  };
  // n whole numbers, each at least lo, whose mean is exactly m.
  function dataWithMean(n, m, spread, lo = 0) {
    for (let t = 0; t < 60; t++) {
      const v = Array.from({ length: n - 1 }, () => Math.max(lo, m + randInt(-spread, spread))), last = n * m - v.reduce((s, x) => s + x, 0);
      if (last >= lo && Math.abs(last - m) <= spread) return shuffle([...v, last]);
    }
    return Array.from({ length: n }, (_, i) => m + (i === n - 1 && n % 2 ? 0 : i % 2 ? 1 : -1));
  }
  function nz2(a, b) { const v = randInt(a, b - 1); return v >= 0 ? v + 1 : v; }

  Questions.grade({ id: '6', n: 6, label: '6TH GRADE', short: '6TH', clock: [45, 42, 38, 35, 32], kinds: g6,
    min: { compositeArea: 2, spread: 2, describeData: 1, histograms: 2, polygonGrid: 2 } });

  // ======================================================================
  // 7th grade
  // ======================================================================
  const par = (v, fmt = num) => v < 0 ? `(${fmt(v)})` : fmt(v);       // "(-5)" inside an expression
  const plural = (v, sg, pl) => Math.abs(v) <= 1 ? sg : pl;
  // p/q as a decimal: "0.375", or a repeating one with the repeat shown and "...": "0.4545...".
  function decStr(p, q) {
    const digits = [], seen = new Map();
    let r = p % q, i = 0;
    while (r && !seen.has(r) && i < 24) { seen.set(r, i); r *= 10; digits.push(Math.floor(r / q)); r %= q; i++; }
    const w = Math.floor(p / q);
    if (!r) return digits.length ? w + '.' + digits.join('') : String(w);
    const s = seen.get(r), pre = digits.slice(0, s).join(''), rep = digits.slice(s).join('');
    let body = pre + rep; while (body.length - pre.length < 3) body += rep;
    return w + '.' + body + '...';
  }
  // A spinner: sectors [{ n: share of the circle, col, lab }], drawn pixel by pixel.
  function spinner(c, cx, cy, r, sectors) {
    const tot = sectors.reduce((s, x) => s + x.n, 0), edges = [];
    let acc = 0; for (const s of sectors) { acc += s.n; edges.push(acc / tot); }
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      const t = ((Math.atan2(x, -y) / (2 * Math.PI)) + 1) % 1, k = edges.findIndex(e => t < e - 1e-9);
      c.fillStyle = sectors[k < 0 ? sectors.length - 1 : k].col; c.fillRect(cx + x, cy + y, 1, 1);
    }
    F.circle(c, cx, cy, r, INK);
    let a0 = 0;
    sectors.forEach(s => {
      F.line(c, cx, cy, ...at(cx, cy, 90 - a0 * 360, r), INK);
      const mid = 90 - (a0 + s.n / tot / 2) * 360;
      if (s.lab) L(c, s.lab, ...((p) => [p[0], p[1] + 1])(at(cx, cy, mid, r * .6)), INK);
      a0 += s.n / tot;
    });
    F.line(c, cx, cy, ...at(cx, cy, 75, r * .38), HOT); F.disc(c, cx, cy, 1, HOT);
  }
  const COLORS = { red: '#d84040', blue: '#4878e0', green: '#40a850', yellow: '#d8b030', purple: '#9050c8' };

  const g7 = {
    // 7.RP.1
    complexRates: d => {
      const T = [[1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [3, 2], [5, 4]], [tn, td] = pick(d < 2 ? T.slice(0, 3) : T), t = tn / td;
      const r = d < 3 ? randInt(2, 12) : pick([randInt(2, 12), randInt(3, 15) / 2]), D = r * t, f = pick(['walk', 'snail', 'paint', 'price']);
      if (f === 'price') {
        const w = pick([.5, 1.5, 2.5, .75, 1.25, 2]), u = round(randInt(8, 40) * .2), T0 = round(w * u);
        return { topic: 'UNIT RATES', text: `${mixed(w)} ${plural(w, 'pound', 'pounds')} of grapes cost ${money(T0)}. What is the price per pound?`,
          ...nums(u, [round(T0 * w), round(w / T0), round(T0 - w), round(u + .5)].filter(v => v > 0 && Math.abs(v - u) > 1e-9), money, .2),
          steps: ['Price per pound = cost ÷ pounds', `${money(T0)} ÷ ${mixed(w)} = ${money(u)}`] };
      }
      const [S, Q] = f === 'walk' ? [`${who()} walks ${mixed(D)} ${plural(D, 'mile', 'miles')} in ${mixed(t)} ${plural(t, 'hour', 'hours')}.`, 'How many miles per hour is that?']
        : f === 'snail' ? [`A robot rolls ${mixed(D)} ${plural(D, 'foot', 'feet')} in ${mixed(t)} ${plural(t, 'minute', 'minutes')}.`, 'How many feet per minute is that?']
          : [`${who()} fills ${mixed(D)} ${plural(D, 'bucket', 'buckets')} of sand in ${mixed(t)} ${plural(t, 'minute', 'minutes')}.`, 'How many buckets per minute is that?'];
      return { topic: 'UNIT RATES', text: `${S} ${Q}`, ...nums(r, [t / D, D * t, D + t, D].filter(v => Math.abs(v - r) > 1e-9), mixed, .5),
        steps: ['Unit rate = amount ÷ time', `${mixed(D)} ÷ ${mixed(t)} = ${fs(D)} × ${td}/${tn}`, `= ${mixed(r)}`] };
    },

    // 7.RP.2a, 7.RP.2b
    proportionalTables: d => {
      const K = d < 2 ? [[2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1]] : [[1.5, 2], [2.5, 2], [.5, 2], [3.5, 2], [.25, 4], [.75, 4], [1.25, 4], [2, 1], [3, 1], [4, 1], [6, 1], [1 / 3, 3], [2 / 3, 3], [4 / 3, 3]];
      const [k, unit] = pick(K);
      const xs = sample([1, 2, 3, 4, 5, 6, 8, 10], 4).sort((a, b) => a - b).map(x => x * unit), ys = xs.map(x => round(k * x, 4)), fk = unit === 3 ? fs : num;
      const fig = (c, w, h) => table(c, w, h, [['x', ...xs.map(num)], ['y', ...ys.map(num)]], { first: 18, headCol: true, headRow: false });
      const f = pick(d < 2 ? ['k', 'missing', 'which'] : ['k', 'missing', 'which', 'isProp']);
      if (f === 'k') return { topic: 'PROPORTIONS', text: 'y is proportional to x. What is the constant of proportionality?', ...nums(k, [1 / k, ys[0] - xs[0], k + 1, ys[1] - ys[0]].filter(v => v > 0 && Math.abs(v - k) > 1e-9), fk, .5),
        steps: ['The constant of proportionality is k = y ÷ x.', `${num(ys[0])} ÷ ${num(xs[0])} = ${fk(k)}`, `Check: ${num(ys[2])} ÷ ${num(xs[2])} = ${fk(k)} too.`], size: [116, 30], fig };
      if (f === 'missing') {
        const i = randInt(1, 3), sh = ys.map(num); sh[i] = '?';
        return { topic: 'PROPORTIONS', text: 'y is proportional to x. What number goes where the ? is?', ...nums(ys[i], [ys[i - 1] + (xs[i] - xs[i - 1]), xs[i] / k, ys[i] + k, xs[i] + k].filter(v => v > 0 && Math.abs(v - ys[i]) > 1e-9 && Math.abs(round(v, 2) - v) < 1e-9), num, k),
          steps: [`k = ${num(ys[0])} ÷ ${num(xs[0])} = ${fk(k)}`, `y = ${fk(k)} × ${num(xs[i])} = ${num(ys[i])}`], size: [116, 30], fig: (c, w, h) => table(c, w, h, [['x', ...xs.map(num)], ['y', ...sh]], { first: 18, headCol: true, headRow: false }) };
      }
      if (f === 'which') {
        const a = randInt(2, 6), xx = sample([1, 2, 3, 4, 5, 6], 3).sort((p, r) => p - r), P = g => xx.map(x => pt(x, g(x))).join(', '), b = randInt(1, 4);
        return { topic: 'PROPORTIONS', text: 'Which set of (x, y) pairs shows a proportional relationship?',
          ...textual(P(x => a * x), [P(x => x + a), P(x => a * x + b), P(x => x * x), P(x => a * x - (x > xx[0] ? 1 : 0))]),
          steps: ['Proportional means y ÷ x is the same for every pair.', `In ${P(x => a * x)}, y ÷ x is always ${a}.`] };
      }
      const prop = rand() < .5, b = randInt(1, 5), yy = prop ? ys : xs.map(x => round(k * x + b, 4)), r0 = yy[0] / xs[0];
      return { topic: 'PROPORTIONS', text: 'Is y proportional to x in this table?',
        ...textual(prop ? `Yes: y ÷ x is always ${fk(k)}` : 'No: y ÷ x keeps changing', prop ? ['No: y ÷ x keeps changing', 'No: it must start at x = 0', `No: y - x is always ${num(ys[1] - xs[1])}`] : [`Yes: y ÷ x is always ${num(r0)}`, 'Yes: y gets bigger as x does', `Yes: y - x is always ${num(yy[0] - xs[0])}`]),
        steps: ['Proportional means y ÷ x never changes.', xs.slice(0, 3).map((x, i) => `${num(yy[i])} ÷ ${num(x)} = ${num(yy[i] / x)}`).join(',  '), prop ? 'Always the same: yes.' : 'Not the same: no.'],
        size: [116, 30], fig: (c, w, h) => table(c, w, h, [['x', ...xs.map(num)], ['y', ...yy.map(num)]], { first: 18, headCol: true, headRow: false }) };
    },

    // 7.RP.2a, 7.RP.2b, 7.RP.2d
    proportionalGraphs: d => {
      const f = pick(d < 2 ? ['k', 'which'] : ['k', 'meaning', 'which']);
      if (f === 'which') {
        const kinds = shuffle(['prop', ...sample(['icpt', 'curve', 'down', 'flat'], 3)]), names = ['1', '2', '3', '4'], ans = names[kinds.indexOf('prop')];
        return { topic: 'PROPORTIONS', text: 'Which graph shows a proportional relationship?', ...fixed(names.map(n => 'Graph ' + n), 'Graph ' + ans),
          steps: ['A proportional graph is a straight line', 'that goes through the origin (0, 0).', `That is graph ${ans}.`],
          size: [168, 50], fig: (c, w, h) => kinds.forEach((k, i) => {
            const x0 = 4 + i * 42, y0 = h - 11, s = 32, P = (u, v) => [x0 + Math.round(u * s), y0 - Math.round(v * s)];
            F.line(c, x0, y0, x0 + s + 2, y0, DIM); F.line(c, x0, y0, x0, y0 - s - 2, DIM);
            const g = { prop: u => .9 * u, icpt: u => .3 + .6 * u, curve: u => u * u, down: u => .9 - .7 * u, flat: () => .55 }[k];
            for (let j = 0; j < 32; j++) F.line(c, ...P(j / 32, g(j / 32)), ...P((j + 1) / 32, g((j + 1) / 32)), HOT);
            L(c, names[i], x0 + s / 2 + 2, h - 4, INK);
          }) };
      }
      const [X, Y, xs, ys, who0] = pick([['HOURS', 'DOLLARS', 'hour', 'dollars', `the money ${who()} earns`], ['MINUTES', 'FEET', 'minute', 'feet', 'how far a robot rolls'], ['MINUTES', 'PAGES', 'minute', 'pages', 'the pages a printer prints'], ['BOXES', 'COOKIES', 'box', 'cookies', 'the cookies in boxes']]);
      const k = d < 3 ? randInt(2, 9) : pick([1.5, 2.5, 3.5, 4.5, randInt(2, 9)]), a = Number.isInteger(k) ? randInt(2, 5) : 2 * randInt(1, 2), xm = 6, ym = Math.ceil(k * xm / 5) * 5;
      const pa = f === 'meaning' ? 1 : a;
      const fig = (c, w, h) => { const P = quad1(c, w, h, xm, ym, { xs: 1, ys: ym / 5, yl: ym, left: 14 }), q = P(pa, k * pa); F.line(c, ...P(0, 0), ...P(xm, k * xm), HOT); F.dot(c, q, RED);
        if (pa <= 3) L(c, pt(pa, num(k * pa)), q[0] + 4, q[1] + 3, INK, 'left'); else L(c, pt(pa, num(k * pa)), q[0] - 4, q[1] - 1, INK, 'right'); };
      if (f === 'k') return { topic: 'PROPORTIONS', text: `The graph shows ${who0}. What is the constant of proportionality (the ${ys} per ${xs})?`, ...nums(k, [1 / k, k * a, a, k + 1].filter(v => Math.abs(v - k) > 1e-9), num, .5),
        steps: ['The line goes through (0, 0), so y = kx.', `k = y ÷ x = ${num(k * a)} ÷ ${a}`, `= ${num(k)} ${ys} per ${xs}`], size: [92, 64], fig };
      return { topic: 'PROPORTIONS', text: `The graph shows ${who0}. What does the point (1, ${num(k)}) mean?`,
        ...textual(`1 ${xs} gives ${num(k)} ${ys}`, [`${num(k)} ${X.toLowerCase()} give 1 of the ${ys}`, `The line starts at ${num(k)} ${ys}`, `It takes ${num(k + 1)} ${X.toLowerCase()} in all`]),
        steps: ['On a proportional graph, the point (1, r) shows the unit rate.', `Here: ${num(k)} ${ys} for each 1 ${xs}.`], size: [92, 64], fig };
    },

    // 7.RP.2c
    proportionalEquations: d => {
      const f = pick(['write', 'use', 'which']);
      if (f === 'write') {
        const n = randInt(2, 9), k = d < 3 ? randInt(3, 12) : pick([randInt(3, 12), randInt(5, 25) / 2]);
        const [S, y, x] = pick([[`${n} movie tickets cost $${num(n * k)}.`, 'c', 't'], [`A car goes ${num(n * k * 5)} miles on ${n} gallons.`, 'm', 'g'], [`${who()} earns $${num(n * k)} for ${n} hours of work.`, 'p', 'h'], [`${n} pounds of apples cost $${num(n * k)}.`, 'c', 'p']]);
        const kk = S.startsWith('A car') ? k * 5 : k, tot = kk * n, eq = `${y} = ${num(kk)}${x}`;
        return { topic: 'PROPORTIONS', text: `${S} The relationship is proportional. Which equation shows it?`, ...textual(eq, [`${x} = ${num(kk)}${y}`, `${y} = ${num(tot)}${x}`, `${y} = ${x} + ${num(tot - n)}`, `${y} = ${n}${x}`]),
          steps: [`k = ${num(tot)} ÷ ${n} = ${num(kk)}`, `A proportional equation is y = kx.`, `So ${eq}.`] };
      }
      if (f === 'use') {
        const [p, q] = pick(d < 2 ? [[2, 1], [3, 1], [5, 1]] : [[3, 4], [2, 3], [5, 2], [3, 2], [4, 5], [7, 4]]), X = q * randInt(2, 9), Yv = p * X / q, K = q === 1 ? String(p) : `(${p}/${q})`;
        return { topic: 'PROPORTIONS', text: `y = ${K}x. What is y when x = ${X}?`, ...nums(Yv, [X * q / p, X * p, X + p / q, X / q].filter(v => Math.abs(v - Yv) > 1e-9), mixed),
          steps: [`y = ${K} × ${X}`, q === 1 ? `= ${Yv}` : `${X} ÷ ${q} = ${X / q}, × ${p} = ${Yv}`] };
      }
      const k = randInt(2, 9), b = randInt(1, 9);
      return { topic: 'PROPORTIONS', text: 'Which equation shows a proportional relationship?', ...textual(`y = ${k}x`, [`y = ${k}x + ${b}`, `y = x + ${k}`, `y = ${k}/x`, `y = x^2`, `y = ${k}x - ${b}`]),
        steps: ['Proportional: y = kx, with nothing added.', `y = ${k}x has k = ${k} and goes through (0, 0).`] };
    },

    // 7.RP.3
    percentChange: d => {
      const f = pick(d < 2 ? ['inc', 'dec', 'new'] : d < 4 ? ['inc', 'dec', 'new', 'error'] : ['inc', 'dec', 'error', 'original']);
      const pp = () => { for (let t = 0; t < 40; t++) { const P = pick([20, 25, 40, 50, 60, 75, 80, 100, 120, 150, 200]), p = pick([10, 20, 25, 30, 40, 50, 75]); if (P * p % 100 === 0) return [P, p]; } return [40, 25]; };
      const [P, p] = pp(), ch = P * p / 100, thing = pick(['a video game', 'a skateboard', 'a pair of sneakers', 'a concert ticket', 'a bike helmet']);
      if (f === 'inc' || f === 'dec') {
        const up = f === 'inc', N = up ? P + ch : P - ch;
        return { topic: 'PERCENTS', text: `The price of ${thing} went ${up ? 'up' : 'down'} from $${P} to $${N}. What is the percent ${up ? 'increase' : 'decrease'}?`,
          ...nums(p, [ch / N * 100, ch, up ? 100 + p : 100 - p, p / 2].filter(v => Math.abs(v - p) > .05), pct, 5),
          steps: [`Change: $${up ? N : P} - $${up ? P : N} = $${ch}`, `Divide by the ORIGINAL price: ${ch} ÷ ${P} = ${num(ch / P)}`, `= ${p}%`] };
      }
      if (f === 'new') {
        const up = rand() < .5, N = up ? P + ch : P - ch;
        return { topic: 'PERCENTS', text: `${thing[0].toUpperCase() + thing.slice(1)} costs $${P}. The price goes ${up ? 'up' : 'down'} ${p}%. What is the new price?`,
          ...nums(N, [ch, up ? P + p : P - p, up ? P - ch : P + ch].filter(v => v > 0), v => '$' + num(v), 5),
          steps: [`${p}% of $${P} = ${num(p / 100)} × ${P} = $${ch}`, `$${P} ${up ? '+' : '-'} $${ch} = $${N}`] };
      }
      if (f === 'error') {
        const A = pick([20, 25, 40, 50, 80, 100, 200]), pe = pick([5, 10, 20, 25].filter(x => A * x % 100 === 0)), E = A + A * pe / 100 * pick([1, -1]);
        const [S] = pick([[`${who()} guessed there were ${E} jelly beans in a jar. There were really ${A}.`], [`${who()} estimated a hallway was ${E} feet long. It is really ${A} feet.`]]);
        return { topic: 'PERCENTS', text: `${S} What is the percent error?`, ...nums(pe, [Math.abs(E - A) / E * 100, Math.abs(E - A), 100 - pe].filter(v => Math.abs(v - pe) > .05), pct, 5),
          steps: ['Percent error = |guess - actual| ÷ actual', `|${E} - ${A}| ÷ ${A} = ${Math.abs(E - A)} ÷ ${A}`, `= ${num(Math.abs(E - A) / A)} = ${pe}%`] };
      }
      const N = P - ch;
      return { topic: 'PERCENTS', text: `After a ${p}% discount, ${thing} costs $${N}. What was the original price?`, ...nums(P, [N + N * p / 100, N + p, N - N * p / 100].filter(v => v > 0), v => '$' + num(v), 5),
        steps: [`After ${p}% off, you pay ${100 - p}% of the original.`, `${num((100 - p) / 100)} × price = $${N}`, `price = ${N} ÷ ${num((100 - p) / 100)} = $${P}`] };
    },

    // 7.RP.3, 7.EE.3
    taxTipDiscount: d => {
      const f = pick(d < 2 ? ['tax', 'tip', 'disc'] : d < 3 ? ['tax', 'tip', 'disc', 'markup', 'comm'] : ['tax', 'tip', 'disc', 'markup', 'comm', 'multi', 'multi']);
      const P = randInt(8, 60) + (d >= 2 && rand() < .5 ? pick([.5, .25, .75]) : 0);
      if (f === 'tax') {
        const r = pick([5, 6, 7, 8, 10]), t = round(P * r / 100);
        return { topic: 'MONEY', text: `A ${pick(['board game', 'jacket', 'backpack', 'pair of headphones'])} costs ${money(P)}. Sales tax is ${r}%. What is the total cost?`,
          ...nums(round(P + t), [t, P + r, round(P - t), round(P + t * 10)], money, .1), steps: [`Tax: ${r}% of ${money(P)} = ${money(t)}`, `Total: ${money(P)} + ${money(t)} = ${money(P + t)}`] };
      }
      if (f === 'tip') {
        const r = pick([15, 18, 20, 25]), B = randInt(12, 90), t = round(B * r / 100), total = rand() < .5;
        return { topic: 'MONEY', text: `${who()}'s family's dinner bill is $${B}. They leave a ${r}% tip. ${total ? 'What is the total with the tip?' : 'How much is the tip?'}`,
          ...nums(total ? round(B + t) : t, total ? [t, B + r, round(B + B * r / 1000)] : [round(B + t), r, round(t * 10)], money, .5),
          steps: [`Tip: ${r}% of $${B} = ${num(r / 100)} × ${B} = ${money(t)}`, total ? `Total: $${B} + ${money(t)} = ${money(B + t)}` : `So the tip is ${money(t)}.`] };
      }
      if (f === 'disc') {
        const r = pick([10, 15, 20, 25, 30, 40, 50]), off = round(P * r / 100);
        return { topic: 'MONEY', text: `A ${money(P)} ${pick(['video game', 'scooter', 'telescope', 'robot kit'])} is ${r}% off. What is the sale price?`,
          ...nums(round(P - off), [off, round(P - r), round(P + off)].filter(v => v > 0), money, .5), steps: [`Discount: ${r}% of ${money(P)} = ${money(off)}`, `Sale price: ${money(P)} - ${money(off)} = ${money(P - off)}`] };
      }
      if (f === 'markup') {
        const C = randInt(4, 40) * 5, r = pick([20, 25, 30, 40, 50, 60]), m = C * r / 100;
        return { topic: 'MONEY', text: `A shop pays $${C} for each skateboard and marks the price up ${r}%. What does the shop sell it for?`,
          ...nums(C + m, [m, C + r, C - m], money, 5), steps: [`Markup: ${r}% of $${C} = $${num(m)}`, `Price: $${C} + $${num(m)} = ${money(C + m)}`] };
      }
      if (f === 'comm') {
        const S = randInt(5, 40) * 100, r = pick([2, 3, 4, 5, 6, 8, 10]), cm = S * r / 100;
        return { topic: 'MONEY', text: `${who()} sells $${num(S)} of phones this week and earns a ${r}% commission. How much is the commission?`,
          ...nums(cm, [cm * 10, S - cm, cm / 10, S * r].filter(v => v > 0), money, 10), steps: [`${r}% of $${num(S)} = ${num(r / 100)} × ${num(S)}`, `= ${money(cm)}`] };
      }
      const Q = randInt(4, 16) * 5, r = pick([20, 25, 40, 50]), t = pick([5, 8, 10]), sale = Q * (100 - r) / 100, fin = round(sale * (100 + t) / 100);
      return { topic: 'MONEY', text: `A $${Q} game is ${r}% off. Then ${t}% sales tax is added to the sale price. What is the final cost?`,
        ...nums(fin, [sale, round(Q * (100 - r + t) / 100), round(Q * (100 + t) / 100), round(sale - sale * t / 100)].filter(v => Math.abs(v - fin) > .005), money, .5),
        steps: [`Sale price: $${Q} - ${r}% = ${money(sale)}`, `Tax: ${t}% of ${money(sale)} = ${money(sale * t / 100)}`, `Final: ${money(fin)}`] };
    },

    // 7.RP.3
    simpleInterest: d => {
      const P = pick([200, 300, 400, 500, 800, 1000, 1200, 1500, 2000]), r = d < 4 ? randInt(2, 6) : pick([2.5, 3.5, 4.5, 3, 5]), t = randInt(2, 6), I = P * r * t / 100;
      const f = pick(d < 3 ? ['int', 'total'] : ['int', 'total', 'rate']), N = who();
      if (f === 'int') return { topic: 'INTEREST', text: `${N} puts $${num(P)} in a savings account that pays ${num(r)}% simple interest a year. How much interest is earned in ${t} years?`,
        ...nums(I, [P * r / 100, P + I, P * r * t, I / 2].filter(v => v !== I), money, 5), steps: ['Simple interest: I = P × r × t', `= ${num(P)} × ${num(r / 100)} × ${t}`, `= ${money(I)}`] };
      if (f === 'total') return { topic: 'INTEREST', text: `${N} saves $${num(P)} at ${num(r)}% simple interest a year. How much is in the account after ${t} years?`,
        ...nums(P + I, [I, P + P * r / 100, round(P * (1 + r / 100) ** t), P + P * r * t / 10].filter(v => Math.abs(v - P - I) > .005), money, 5),
        steps: [`Interest: ${num(P)} × ${num(r / 100)} × ${t} = ${money(I)}`, `Total: $${num(P)} + ${money(I)} = ${money(P + I)}`] };
      return { topic: 'INTEREST', text: `$${num(P)} earned $${num(I)} in simple interest over ${t} years. What was the yearly interest rate?`,
        ...nums(r, [I / P * 100, r * t, I / t].filter(v => Math.abs(v - r) > .01), pct, .5), steps: ['I = P × r × t, so r = I ÷ (P × t)', `r = ${num(I)} ÷ (${num(P)} × ${t}) = ${num(r / 100, 4)}`, `= ${num(r)}%`] };
    },

    // 7.G.1
    scaleDrawings: d => {
      const f = pick(d < 2 ? ['map', 'plan'] : d < 3 ? ['map', 'plan', 'model'] : ['map', 'plan', 'model', 'area']);
      if (f === 'map') {
        const s = pick([5, 10, 20, 25, 50]), m = d < 2 ? randInt(2, 9) : randInt(3, 18) / 2, A = m * s;
        return { topic: 'SCALE', text: `On a map, 1 inch stands for ${s} miles. Two towns are ${num(m)} inches apart on the map. How far apart are they really?`,
          ...nums(A, [m + s, round(s / m), A * 10, A / 2].filter(v => v !== A), num, s), steps: ['Each inch on the map is ' + s + ' miles.', `${num(m)} × ${s} = ${num(A)} miles`] };
      }
      if (f === 'plan') {
        const k = pick([2, 4, 5, 8, 10]), n = randInt(3, 12), Lf = n * k;
        return { topic: 'SCALE', text: `A floor plan uses 1 inch for ${k} feet. A room is ${Lf} feet long. How long is it on the plan, in inches?`,
          ...nums(n, [Lf * k, Lf - k, Lf / 2].filter(v => v !== n)), steps: ['Divide the real length by the scale.', `${Lf} ÷ ${k} = ${n} inches`] };
      }
      if (f === 'model') {
        const sc = pick([12, 18, 24, 36]), ft = pick([6, 9, 12, 15, 18, 24]), inches = ft * 12 / sc;
        return { topic: 'SCALE', text: `A model car is built at a scale of 1:${sc}. The real car is ${ft} feet long. How long is the model, in inches?`,
          ...nums(inches, [ft / sc * 10, ft * sc, ft * 12, ft / 2].filter(v => v > 0 && Math.abs(v - inches) > 1e-9), num, .5),
          steps: [`${ft} feet = ${ft * 12} inches`, `1:${sc} means the model is 1/${sc} as long.`, `${ft * 12} ÷ ${sc} = ${num(inches)} inches`] };
      }
      const a = randInt(2, 6), b = randInt(3, 8), s = pick([2, 3, 4, 5]), A = a * s * b * s;
      return { topic: 'SCALE', text: `The garden drawing uses 1 cm for ${s} meters. What is the real garden's area, in square meters?`,
        ...nums(A, [a * b * s, a * b, 2 * (a + b) * s, A / 2].filter(v => v !== A)), steps: [`Real size: ${a} × ${s} = ${a * s} m by ${b} × ${s} = ${b * s} m`, `Area: ${a * s} × ${b * s} = ${A} square meters`, `(Not ${a} × ${b} × ${s}: both sides scale.)`],
        size: [100, 56], fig: (c, w, h) => { const u = Math.min(Math.floor((w - 32) / b), Math.floor((h - 26) / a)), x0 = 4, y0 = 4; F.box(c, x0, y0, b * u, a * u, '#1c4430'); F.outlinePoly(c, [[x0, y0], [x0 + b * u, y0], [x0 + b * u, y0 + a * u], [x0, y0 + a * u]], GRN); L(c, b + ' cm', x0 + b * u / 2, y0 + a * u + 7); L(c, a + ' cm', x0 + b * u + 3, y0 + a * u / 2 + 1, INK, 'left'); L(c, `1 cm : ${s} m`, w / 2, h - 4, HOT); } };
    },

    // 7.NS.1
    addSubtract: d => {
      const R = d < 2 ? 15 : 60, gen = () => d < 3 ? nz2(-R, R) : d < 4 ? nz2(-90, 90) / 10 : pick([-1, 1]) * pick([1 / 2, 1 / 4, 3 / 4, 1 / 3, 2 / 3, 5 / 6, 3 / 2, 5 / 4]);
      const fm = d < 4 ? num : mixed, f = pick(d < 2 ? ['add', 'sub', 'line'] : ['add', 'sub', 'line', 'dist', 'inverse']);
      let a = gen(), b = gen(); if (f !== 'inverse' && a > 0 && b > 0) a = -a;
      if (f === 'line') {
        const A = randInt(-7, 7), B0 = nz2(-8, 8), B = Math.abs(A + B0) > 10 ? -B0 : B0, S = A + B;
        return { topic: 'INTEGERS', text: `The arrow starts at ${A} and moves ${Math.abs(B)} to the ${B > 0 ? 'right' : 'left'}. What is ${A} + ${par(B)}?`,
          ...nums(S, [A - B, -S, B - A].filter(v => v !== S)), steps: [`Start at ${A}.`, `Adding ${B} moves ${Math.abs(B)} ${B > 0 ? 'right' : 'left'}.`, `You land on ${S}.`],
          size: [168, 30], fig: (c, w) => { const X = nline(c, w, 18, -10, 10, { every: 5 }); F.line(c, X(A), 9, X(S), 9, HOT); F.line(c, X(A), 7, X(A), 11, HOT); const dir = Math.sign(B); F.line(c, X(S), 9, X(S) - 3 * dir, 6, HOT); F.line(c, X(S), 9, X(S) - 3 * dir, 12, HOT); F.dot(c, [X(A), 18], RED); } };
      }
      if (f === 'dist') {
        const lo = Math.min(a, b), hi = Math.max(a, b);
        return { topic: 'RATIONAL NUMS', text: `How far apart are ${fm(a)} and ${fm(b)} on a number line?`, ...nums(hi - lo, [Math.abs(a + b), Math.abs(Math.abs(a) - Math.abs(b)), hi - lo + 1].filter(v => v > 0 && Math.abs(v - (hi - lo)) > 1e-9), fm, d < 3 ? 1 : .5),
          steps: ['Distance = |a - b|', `|${fm(hi)} - ${par(lo, fm)}| = ${fm(hi - lo)}`] };
      }
      if (f === 'inverse') {
        const [S, ans] = pick([[`What number added to ${fm(a)} makes 0?`, -a], [`A balloon rises ${fm(Math.abs(a))} feet and then sinks ${fm(Math.abs(a))} feet. How far is it from where it started?`, 0],
          [`${who()} owes $${num(Math.abs(round(a)))} and then earns $${num(Math.abs(round(a)))}. What is the balance now?`, 0]]);
        return { topic: 'RATIONAL NUMS', text: S, ...nums(ans, ans === 0 ? [Math.abs(a) * 2, Math.abs(a), -Math.abs(a)] : [a, 0, 1 / a].filter(v => Math.abs(v - ans) > 1e-9), fm, d < 3 ? 1 : .5),
          steps: ['A number and its opposite add to 0.', ans === 0 ? 'Going up and then down the same amount: back to 0.' : `${fm(a)} + ${par(-a, fm)} = 0`] };
      }
      const add = f === 'add', ans = add ? a + b : a - b;
      return { topic: 'RATIONAL NUMS', text: `What is ${fm(a)} ${add ? '+' : '-'} ${par(b, fm)}?`,
        ...nums(ans, [add ? a - b : a + b, -ans, add ? Math.abs(a) + Math.abs(b) : -(Math.abs(a) + Math.abs(b)), add ? -(Math.abs(a) - Math.abs(b)) : b - a].filter(v => Math.abs(v - ans) > 1e-9), fm, d < 4 ? 1 : .5),
        steps: add ? [Math.sign(a) === Math.sign(b) ? 'Same signs: add and keep the sign.' : 'Different signs: subtract and use the sign of the bigger one.', `${fm(a)} + ${par(b, fm)} = ${fm(ans)}`]
          : ['Subtracting is adding the opposite.', `${fm(a)} - ${par(b, fm)} = ${fm(a)} + ${par(-b, fm)}`, `= ${fm(ans)}`] };
    },

    // 7.NS.2
    multiplyDivide: d => {
      const f = pick(d < 2 ? ['mul', 'div'] : d < 3 ? ['mul', 'div', 'three', 'equal'] : ['mul', 'div', 'three', 'frac', 'frac', 'equal']);
      if (f === 'mul' || f === 'div') {
        const a = nz2(-12, 12), b0 = nz2(-12, 12), b = Math.abs(b0) === 1 ? 7 * b0 : b0, A = a < 0 || b < 0 ? a : -a, p = A * b;
        if (f === 'mul') return { topic: 'INTEGERS', text: `What is ${A} × ${par(b)}?`, ...nums(p, [-p, A + b, -(A + b), A - b].filter(v => v !== p)),
          steps: [Math.sign(A) === Math.sign(b) ? 'Same signs: the product is positive.' : 'Different signs: the product is negative.', `${Math.abs(A)} × ${Math.abs(b)} = ${Math.abs(p)}, so ${p}`] };
        return { topic: 'INTEGERS', text: `What is ${p} ÷ ${par(b)}?`, ...nums(A, [-A, p - b, p + b].filter(v => v !== A && Math.abs(v) < 200)),
          steps: [Math.sign(p) === Math.sign(b) ? 'Same signs: the quotient is positive.' : 'Different signs: the quotient is negative.', `${Math.abs(p)} ÷ ${Math.abs(b)} = ${Math.abs(A)}, so ${A}`] };
      }
      if (f === 'three') {
        const v = [nz2(-6, 6), nz2(-6, 6), nz2(-5, 5)], p = v[0] * v[1] * v[2], negs = v.filter(x => x < 0).length;
        return { topic: 'INTEGERS', text: `What is ${v.map(x => `(${x})`).join('')}?`, ...nums(p, [-p, v[0] + v[1] + v[2], Math.abs(p) * (negs ? -1 : 1) * -1].filter(x => x !== p)),
          steps: [`Multiply the sizes: ${v.map(Math.abs).join(' × ')} = ${Math.abs(p)}`, `${negs} negative ${negs === 1 ? 'sign' : 'signs'}: ${negs % 2 ? 'odd, so negative' : 'even, so positive'}.`, `= ${p}`] };
      }
      if (f === 'equal') {
        const [p, q] = pick([[3, 5], [2, 7], [4, 9], [5, 8], [1, 6], [7, 3]]), right = pick([`${p}/(-${q})`, `(-${p})/${q}`]);
        return { topic: 'RATIONAL NUMS', text: `Which is equal to -${p}/${q}?`, ...textual(right, [`(-${p})/(-${q})`, `${q}/(-${p})`, `${p}/${q}`, `-(-${p}/${q})`]),
          steps: ['One negative sign makes a negative number,', 'no matter whether it is on the top or the bottom.', `So -${p}/${q} = (-${p})/${q} = ${p}/(-${q}).`] };
      }
      const P = [[1, 2], [2, 3], [3, 4], [1, 3], [2, 5], [3, 5], [5, 6], [4, 3], [5, 2]], [a, b] = pick(P), [c, e] = pick(P.filter(([x, y]) => x !== a || y !== b)), mul = rand() < .5, s = pick([-1, 1]);
      const x = -a / b, y = s * c / e, ans = mul ? x * y : x / y;
      return { topic: 'RATIONAL NUMS', text: `What is (-${a}/${b}) ${mul ? '×' : '÷'} (${s < 0 ? '-' : ''}${c}/${e})?`,
        ...nums(ans, [-ans, mul ? x / y : x * y, mul ? -(a + c) / (b + e) : -(a * e) / (b * c) * -s].filter(v => Math.abs(v - ans) > 1e-9), fs, .25),
        steps: [mul ? `Multiply across: ${a * c}/${b * e}` : `Multiply by the reciprocal: ${a}/${b} × ${e}/${c} = ${a * e}/${b * c}`, `${s < 0 ? 'Two negatives: positive.' : 'One negative: negative.'}`, `= ${fs(ans)}`] };
    },

    // 7.NS.1d, 7.NS.2c, 7.NS.3: expressions with rational numbers
    rationalExpressions: d => {
      if (d < 3 || rand() < .5) {
        const a = nz2(-9, 9), b = nz2(-9, 9), c = nz2(-6, 6), A = d < 3 ? a : a / 2, B = d < 3 ? b : b / 2, ans = A + B * c;
        return { topic: 'RATIONAL NUMS', text: `What is ${num(A)} + ${par(B)} × ${par(c)}?`, ...nums(ans, [(A + B) * c, A - B * c, -(ans), A + B + c].filter(v => Math.abs(v - ans) > 1e-9), num, d < 3 ? 1 : .5),
          steps: [`Multiply first: ${par(B)} × ${par(c)} = ${num(B * c)}`, `Then add: ${num(A)} + ${par(B * c)} = ${num(ans)}`] };
      }
      const P = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 6], [5, 6], [2, 5], [3, 8]], [a, b] = pick(P), [c, e] = pick(P.filter(([x, y]) => x * b !== y * a)), sub = rand() < .5, x = -a / b, y = c / e, ans = sub ? x - y : x + y;
      return { topic: 'RATIONAL NUMS', text: `What is -${a}/${b} ${sub ? '-' : '+'} ${c}/${e}?`,
        ...nums(ans, [(sub ? -(a + c) : c - a) / (b + e), -ans, sub ? x + y : x - y, -(a + c) / (b * e)].filter(v => Math.abs(v - ans) > 1e-9), fs, 1 / 12),
        steps: [`Common denominator ${lcm(b, e)}: -${a * lcm(b, e) / b}/${lcm(b, e)} ${sub ? '-' : '+'} ${c * lcm(b, e) / e}/${lcm(b, e)}`, `= ${fs(ans)}`] };
    },

    // 7.NS.2d
    fractionsToDecimals: d => {
      const f = pick(d < 2 ? ['term', 'term', 'which'] : ['term', 'repeat', 'which', 'neg']);
      if (f === 'term' || f === 'neg') {
        const [p, q] = pick([[1, 4], [3, 4], [1, 8], [3, 8], [5, 8], [7, 8], [2, 5], [3, 5], [4, 5], [1, 20], [7, 20], [3, 25], [9, 16], [3, 16], [1, 40]]), v = p / q, sg = f === 'neg' ? '-' : '';
        const right = sg + decStr(p, q), wr = [sg + '0.' + p + q, sg + decStr(q, p), sg + num(p / q * 10), sg + num(round(v, 1)), sg + '0.' + q + p];
        return { topic: 'DECIMALS', text: `Write ${sg}${p}/${q} as a decimal.`, ...textual(right, wr.filter(s => s !== right && s !== sg + '0')),
          steps: [`${p}/${q} means ${p} ÷ ${q}.`, `${p} ÷ ${q} = ${decStr(p, q)}`, sg ? 'Keep the negative sign.' : 'It stops, so it terminates.'] };
      }
      if (f === 'repeat') {
        const [p, q] = pick([[1, 3], [2, 3], [1, 6], [5, 6], [1, 9], [4, 9], [7, 9], [2, 11], [5, 11], [7, 12], [5, 12], [8, 11]]), right = decStr(p, q);
        const wr = [`0.${p}${q}`, num(round(p / q, 2)), decStr((p % (q - 1)) + 1, q), decStr(q - p, q), `0.${q}${p}`];
        return { topic: 'DECIMALS', text: `Write ${p}/${q} as a decimal.`, ...textual(right, wr.filter(s => s !== right)),
          steps: [`${p} ÷ ${q}: the remainders start repeating.`, `So the digits repeat: ${right}`] };
      }
      const T = [[3, 8], [7, 20], [9, 16], [2, 5], [11, 25], [3, 4]], Rp = [[5, 12], [2, 9], [4, 11], [1, 6], [2, 3], [7, 15]], term = rand() < .5;
      const right = pick(term ? T : Rp), wr = sample(term ? Rp : T, 3), s = ([p, q]) => `${p}/${q}`;
      return { topic: 'DECIMALS', text: `Which fraction is a ${term ? 'terminating' : 'repeating'} decimal?`, ...textual(s(right), wr.map(s)),
        steps: ['A fraction in lowest terms terminates when its denominator', 'has no prime factors but 2 and 5.', `${s(right)} ${term ? 'terminates' : 'repeats'}: ${decStr(...right)}`] };
    },

    // 7.NS.3
    rationalWord: d => {
      const f = pick(['temp', 'sub', 'bank', 'avg', 'dive']);
      if (f === 'temp') {
        const a = -randInt(2, 15), b = randInt(5, 25), c = randInt(2, 12), ans = a + b - c;
        return { topic: 'INTEGERS', text: `At 6 a.m. it was ${a}°F. By noon it rose ${b}°F, then it fell ${c}°F by night. What was the temperature at night?`,
          ...nums(ans, [a - b + c, -a + b - c, a + b + c, b - c].filter(v => v !== ans)), steps: [`${a} + ${b} = ${a + b}`, `${a + b} - ${c} = ${ans}°F`] };
      }
      if (f === 'sub') {
        const a = -randInt(10, 60) * 5, b = randInt(2, Math.floor(-a / 5) - 1) * 5;
        return { topic: 'INTEGERS', text: `A submarine is at ${a} feet. It rises ${b} feet. What is its new depth?`,
          ...nums(a + b, [a - b, -(a + b), b - a].filter(v => v !== a + b)), steps: ['Rising adds to the depth.', `${a} + ${b} = ${a + b} feet`] };
      }
      if (f === 'bank') {
        const a = randInt(10, 60), b = round(a + randInt(5, 40) + pick([0, .5, .25, .75])), ans = round(a - b);
        return { topic: 'MONEY', text: `${who()}'s account has $${a}. A ${money(b)} purchase goes through. What is the balance now?`,
          ...nums(ans, [round(b - a), round(a + b), -round(a + b)], money, 1), steps: [`$${a} - ${money(b)}`, `= ${money(ans)}: the account is overdrawn.`] };
      }
      if (f === 'avg') {
        const per = -randInt(2, 6), h = randInt(3, 8), tot = per * h;
        return { topic: 'INTEGERS', text: `The temperature changed ${tot}°F over ${h} hours, the same amount each hour. What was the change each hour?`,
          ...nums(per, [-per, tot + h, tot - h].filter(v => v !== per)), steps: [`${tot} ÷ ${h}`, `= ${per}°F each hour`] };
      }
      const r = randInt(5, 15), t = d < 3 ? randInt(2, 6) : randInt(3, 13) / 2, ans = -r * t;
      return { topic: 'RATIONAL NUMS', text: `A diver starts at the surface and goes down ${r} feet each minute for ${num(t)} minutes. What is her position in feet?`,
        ...nums(ans, [-ans, -r - t, -r * Math.floor(t)].filter(v => v !== ans), num, 5), steps: ['Going down is negative: -' + r + ' feet a minute.', `${num(t)} × (-${r}) = ${num(ans)} feet`] };
    },

    // 7.EE.1
    combineTerms: d => {
      const v = pick(['x', 'y', 'n', 'a', 'm']), f = pick(d < 2 ? ['simplify', 'subtract'] : d < 3 ? ['simplify', 'subtract', 'subtract'] : ['simplify', 'subtract', 'decimal', 'fraction']);
      if (f === 'simplify') {
        let a = randInt(2, 9), c = (d < 2 ? 1 : pick([1, -1])) * randInt(1, 8); if (a + c === 0) c++;
        const b = (d < 2 ? 1 : pick([1, -1])) * randInt(1, 9), e = (d < 2 ? 1 : pick([1, -1])) * randInt(1, 9), right = lin(a + c, b + e, v);
        return { topic: 'EXPRESSIONS', text: `Simplify: ${lin(a, b, v)} ${c < 0 ? '- ' + term(-c, v) : '+ ' + term(c, v)} ${signed(e)}`,
          ...textual(right, [term(a + b + c + e, v), lin(a - c, b + e, v), lin(a + c, b - e, v), lin(a + c + b, e, v), lin(a * c, b + e, v)].filter(s => s !== right)),
          steps: [`Like terms: ${term(a, v)} and ${term(c, v)} → ${term(a + c, v)}`, `Numbers: ${b} and ${e} → ${b + e}`, `= ${right}`] };
      }
      if (f === 'subtract') {
        const a = randInt(3, 9), c0 = randInt(1, a + 3), c = c0 === a ? a + 1 : c0, b = nz2(-9, 9), e = nz2(-9, 9);
        const right = lin(a - c, b - e, v);
        return { topic: 'EXPRESSIONS', text: `Simplify: (${lin(a, b, v)}) - (${lin(c, e, v)})`,
          ...textual(right, [lin(a - c, b + e, v), lin(a + c, b + e, v), lin(a - c, e - b, v), lin(c - a, b - e, v)].filter(s => s !== right)),
          steps: [`The minus changes every sign in the second group:`, `${lin(a, b, v)} ${c < 0 ? '+' : '-'} ${term(Math.abs(c), v)} ${signed(-e)}`, `= ${right}`] };
      }
      if (f === 'decimal') {
        const a = randInt(1, 9) / 2, c = randInt(1, 12) / 4, b = nz2(-9, 9), right = lin(round(a + c), b, v);
        return { topic: 'EXPRESSIONS', text: `Simplify: ${term(a, v)} + ${term(c, v)} ${signed(b)}`,
          ...textual(right, [term(round(a + c + b), v), lin(round(a * c), b, v), lin(round(a + c), -b, v), lin(round(a + c + 1), b, v)].filter(s => s !== right)),
          steps: [`${num(a)} + ${num(c)} = ${num(a + c)}`, `= ${right}`] };
      }
      const [p, q] = pick([[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [1, 6]]), [r, s] = pick([[1, 2], [1, 3], [1, 4], [1, 5], [2, 5], [1, 6]].filter(([x, y]) => x * q !== y * p)), sum = p / q + r / s, F2 = x => `(${fs(x)})${v}`;
      return { topic: 'EXPRESSIONS', text: `Simplify: ${F2(p / q)} + ${F2(r / s)}`, ...textual(F2(sum), [F2((p + r) / (q + s)), F2(p * r / (q * s)), `(${fs(sum)})${v}^2`, F2(Math.abs(p / q - r / s))].filter(x => x !== F2(sum))),
        steps: [`Add the coefficients: ${fs(p / q)} + ${fs(r / s)}`, `Common denominator ${lcm(q, s)}: ${p * lcm(q, s) / q}/${lcm(q, s)} + ${r * lcm(q, s) / s}/${lcm(q, s)} = ${fs(sum)}`, `= ${F2(sum)}`] };
    },

    // 7.EE.1
    expandFactor: d => {
      const v = pick(['x', 'y', 'n', 'a']), f = pick(d < 2 ? ['expand', 'factor'] : d < 3 ? ['expand', 'factor', 'mix'] : ['expand', 'factor', 'mix', 'half']);
      if (f === 'expand') {
        const k0 = nz2(-9, 9), k = Math.abs(k0) === 1 ? 3 * k0 : k0, a = randInt(1, d < 2 ? 1 : 5), b = nz2(-9, 9), right = lin(k * a, k * b, v);
        return { topic: 'EXPRESSIONS', text: `Expand: ${k}(${lin(a, b, v)})`, ...textual(right, [lin(k * a, b, v), lin(k * a, -k * b, v), lin(-k * a, k * b, v), lin(a, k * b, v), lin(k * a, k + b, v)].filter(s => s !== right)),
          steps: [`Multiply ${k} by each term.`, `${k} × ${term(a, v)} = ${term(k * a, v)}, ${k} × ${par(b)} = ${k * b}`, `= ${right}`] };
      }
      if (f === 'factor') {
        const g = randInt(2, 8), [m, n0] = pick([[2, 3], [3, 4], [2, 5], [4, 5], [3, 5], [1, 3], [1, 4], [5, 2], [3, 2]]), n = n0 * pick([1, -1]), right = `${g}(${lin(m, n, v)})`;
        const wr = [`${g}(${lin(m, g * n, v)})`, `${g}(${lin(m, -n, v)})`, `${g * m}(${lin(1, n, v)})`, `${g + 1}(${lin(m, n, v)})`];
        if (m !== g) wr.push(`${m}(${lin(g, n, v)})`);
        return { topic: 'EXPRESSIONS', text: `Factor: ${lin(g * m, g * n, v)}`, ...textual(right, wr.filter(s => s !== right)),
          steps: [`The greatest common factor is ${g}.`, `${term(g * m, v)} ÷ ${g} = ${term(m, v)} and ${g * n} ÷ ${g} = ${n}`, `= ${right}`] };
      }
      if (f === 'half') {
        const [k, ks] = pick([[1 / 2, '1/2'], [1 / 3, '1/3'], [1 / 4, '1/4'], [.5, '0.5']]), q = Math.round(1 / k), a = q * randInt(1, 4), b = q * nz2(-5, 5), right = lin(a * k, b * k, v);
        return { topic: 'EXPRESSIONS', text: `Expand: ${ks}(${lin(a, b, v)})`, ...textual(right, [lin(a * k, b, v), lin(a, b * k, v), lin(a * k, -b * k, v), lin(a * k + 1, b * k, v)].filter(s => s !== right)),
          steps: [`${ks} of each term: ${ks} × ${term(a, v)} = ${term(a * k, v)}`, `${ks} × ${par(b)} = ${b * k}`, `= ${right}`] };
      }
      const k = randInt(2, 6), b = randInt(1, 9), c0 = randInt(1, k + 4), c = c0 === k ? k + 1 : c0, right = lin(k - c, -k * b, v);
      return { topic: 'EXPRESSIONS', text: `Which is equivalent to ${k}(${v} - ${b}) - ${term(c, v)}?`, ...textual(right, [lin(k - c, -b, v), lin(k + c, -k * b, v), lin(k - c, k * b, v), lin(k - c, -k * b + c, v)].filter(s => s !== right)),
        steps: [`Distribute: ${k}(${v} - ${b}) = ${lin(k, -k * b, v)}`, `Then ${term(k, v)} - ${term(c, v)} = ${term(k - c, v)}`, `= ${right}`] };
    },

    // 7.EE.2
    rewriting: d => {
      const p = pick([5, 6, 8, 10, 15, 20, 25, 30, 40]), f = pick(d < 2 ? ['up', 'down'] : ['up', 'down', 'perim', 'meaning']), dec = num(p / 100), v = pick(['p', 'c', 'x']);
      if (f === 'up') return { topic: 'EXPRESSIONS', text: `A price ${v} goes up ${p}%. Which expression shows the new price?`, ...textual(`${num(1 + p / 100)}${v}`, [`${dec}${v}`, `${v} + ${p}`, `${num(1 - p / 100)}${v}`, `${p}${v}`]),
        steps: [`New price = ${v} + ${p}% of ${v}`, `= ${v} + ${dec}${v}`, `= ${num(1 + p / 100)}${v}`] };
      if (f === 'down') return { topic: 'EXPRESSIONS', text: `A price ${v} is ${p}% off. Which expression shows the sale price?`, ...textual(`${num(1 - p / 100)}${v}`, [`${dec}${v}`, `${v} - ${p}`, `${num(1 + p / 100)}${v}`, `${100 - p}${v}`]),
        steps: [`Sale price = ${v} - ${p}% of ${v}`, `= ${v} - ${dec}${v}`, `= ${num(1 - p / 100)}${v}`] };
      if (f === 'perim') {
        const k = randInt(2, 9), w = pick(['w', 'n', 'x']);
        return { topic: 'EXPRESSIONS', text: `A rectangle's length is ${k} more than its width ${w}. Which expression is its perimeter?`, ...textual(`4${w} + ${2 * k}`, [`2${w} + ${k}`, `4${w} + ${k}`, `2${w} + ${2 * k}`, `${w}^2 + ${k}${w}`]),
          steps: [`Length: ${w} + ${k}`, `Perimeter: 2(${w}) + 2(${w} + ${k})`, `= 2${w} + 2${w} + ${2 * k} = 4${w} + ${2 * k}`] };
      }
      return { topic: 'EXPRESSIONS', text: `What does ${v} + ${dec}${v} mean?`, ...textual(`${v} increased by ${p}%`, [`${v} decreased by ${p}%`, `${v} increased by ${dec}%`, `${v} plus ${p} dollars`, `${p}% of ${v}`]),
        steps: [`${dec}${v} is ${p}% of ${v}.`, `Adding it to ${v} means ${v} went up ${p}%.`, `(It also equals ${num(1 + p / 100)}${v}.)`] };
    },

    // 7.EE.4a
    twoStep: d => {
      const v = pick(['x', 'n', 'y', 'm']), f = pick(d < 2 ? ['pxq', 'pxq', 'div'] : d < 3 ? ['pxq', 'paren', 'div'] : ['pxq', 'paren', 'frac', 'dec']);
      const x = d < 2 ? randInt(1, 12) : nz2(-10, 12), p = d < 2 ? randInt(2, 9) : nz2(-8, 9) || 2, q = nz2(-15, 15);
      const P = p === 1 || p === -1 ? 3 : p, fm = num;
      if (f === 'pxq') {
        const r = P * x + q;
        return { topic: 'EQUATIONS', text: `Solve: ${lin(P, q, v)} = ${r}`, ...nums(x, [(r + q) / P, r - q, r / P - q, -x].filter(w => Number.isInteger(w) && w !== x)),
          steps: [`${q > 0 ? 'Subtract ' + q + ' from' : 'Add ' + -q + ' to'} both sides: ${term(P, v)} = ${r - q}`, `Divide by ${P}: ${v} = ${x}`] };
      }
      if (f === 'paren') {
        const r = P * (x + q);
        return { topic: 'EQUATIONS', text: `Solve: ${P}(${lin(1, q, v)}) = ${r}`, ...nums(x, [(r - q) / P, r / P + q, r - P * q - q, -x].filter(w => Number.isInteger(w) && w !== x)),
          steps: [`Divide both sides by ${P}: ${lin(1, q, v)} = ${r / P}`, `${q > 0 ? 'Subtract ' + q : 'Add ' + -q}: ${v} = ${x}`] };
      }
      if (f === 'div') {
        const k = randInt(2, 6), y = x * k, r = x + q;
        return { topic: 'EQUATIONS', text: `Solve: ${v}/${k} ${signed(q)} = ${r}`, ...nums(y, [(r + q) * k, (r - q) / k, r * k - q, -y].filter(w => Number.isInteger(w) && w !== y)),
          steps: [`${q > 0 ? 'Subtract ' + q : 'Add ' + -q}: ${v}/${k} = ${r - q}`, `Multiply by ${k}: ${v} = ${y}`] };
      }
      if (f === 'frac') {
        const [a, b] = pick([[2, 3], [3, 4], [1, 2], [3, 5], [2, 5], [5, 6]]), y = b * nz2(-5, 6), r = a * y / b + q;
        return { topic: 'EQUATIONS', text: `Solve: (${a}/${b})${v} ${signed(q)} = ${r}`, ...nums(y, [(r - q) * a / b, (r + q) * b / a, (r - q) * b, -y].filter(w => Math.abs(w - y) > 1e-9), mixed),
          steps: [`${q > 0 ? 'Subtract ' + q : 'Add ' + -q}: (${a}/${b})${v} = ${r - q}`, `Multiply by ${b}/${a}: ${v} = ${r - q} × ${b}/${a} = ${y}`] };
      }
      const a = pick([.5, 1.5, 2.5, .2, .4, 1.2]), y = randInt(-6, 12) * 2, qd = nz2(-20, 20) / 4, r = round(a * y + qd);
      return { topic: 'EQUATIONS', text: `Solve: ${term(a, v)} ${signed(qd)} = ${num(r)}`, ...nums(y, [round((r + qd) / a), round(r - qd), round((r - qd) * a), -y].filter(w => Math.abs(w - y) > 1e-9)),
        steps: [`${qd > 0 ? 'Subtract ' + num(qd) : 'Add ' + num(-qd)}: ${term(a, v)} = ${num(r - qd)}`, `Divide by ${num(a)}: ${v} = ${y}`] };
    },

    // 7.EE.4a
    twoStepWord: d => {
      const f = pick(d < 2 ? ['buy', 'arcade', 'model'] : ['buy', 'perim', 'arcade', 'model']);
      if (f === 'buy') {
        const n = randInt(2, 5), c = d < 2 ? randInt(3, 15) : randInt(30, 150) / 10, left = d < 2 ? randInt(2, 20) : randInt(10, 99) / 10, M = round(n * c + left);
        return { topic: 'EQUATIONS', text: `${who()} has ${money(M)}, buys ${n} comic books that cost the same, and has ${money(left)} left. How much did each comic cost?`,
          ...nums(c, [round((M + left) / n), round(M / n), round(M - left), round(c + 1)], money, .5), steps: [`${n}c + ${money(left)} = ${money(M)}`, `${n}c = ${money(M - left)}`, `c = ${money(c)}`] };
      }
      if (f === 'perim') {
        const Lg = randInt(8, 25), W0 = randInt(3, Lg - 1), P = 2 * (Lg + W0);
        return { topic: 'EQUATIONS', text: `A rectangle's perimeter is ${P} cm. Its length is ${Lg} cm. How wide is it?`, ...nums(W0, [P - Lg, (P - Lg) / 2, P - 2 * Lg, P / 4].filter(w => w > 0 && w !== W0), num, 1),
          steps: [`2L + 2W = P: 2(${Lg}) + 2W = ${P}`, `2W = ${P} - ${2 * Lg} = ${P - 2 * Lg}`, `W = ${W0} cm`] };
      }
      if (f === 'arcade') {
        const F0 = pick([3, 4, 5, 6, 8]), r = pick([.5, .75, 1.25, 1.5, 2]), g = randInt(4, 16), T0 = F0 + r * g;
        return { topic: 'EQUATIONS', text: `The arcade charges $${F0} to get in plus ${money(r)} a game. ${who()} spent ${money(T0)}. How many games did they play?`,
          ...nums(g, [T0 / r, (T0 + F0) / r, T0 - F0, g + 2].filter(w => Number.isInteger(w) && w !== g)), steps: [`${F0} + ${num(r)}g = ${num(T0)}`, `${num(r)}g = ${num(T0 - F0)}`, `g = ${g} games`] };
      }
      const k = randInt(2, 6), b = randInt(2, 15), t = randInt(20, 60), op = pick(['more', 'less']);
      const right = op === 'more' ? `${k}n + ${b} = ${t}` : `${k}n - ${b} = ${t}`;
      return { topic: 'EQUATIONS', text: `Which equation means "${b} ${op} than ${k} times a number is ${t}"?`,
        ...textual(right, [op === 'more' ? `${k}(n + ${b}) = ${t}` : `${k}(n - ${b}) = ${t}`, op === 'more' ? `${b}n + ${k} = ${t}` : `${b} - ${k}n = ${t}`, op === 'more' ? `${k}n = ${t} + ${b}` : `${k}n = ${t} - ${b}`, op === 'more' ? `${k} + ${b}n = ${t}` : `${k}n + ${b} = ${t}`]),
        steps: [`"${k} times a number" is ${k}n.`, `"${b} ${op} than" that is ${k}n ${op === 'more' ? '+' : '-'} ${b}.`, `So ${right}`] };
    },

    // 7.EE.4b
    twoStepInequalities: d => {
      const v = pick(['x', 'n', 'y']), ops = ['>', '≥', '<', '≤'], flip = o => ({ '>': '<', '<': '>', '≥': '≤', '≤': '≥' })[o], strict = o => ({ '>': '≥', '≥': '>', '<': '≤', '≤': '<' })[o];
      const f = pick(d < 2 ? ['solve', 'word'] : ['solve', 'word', 'graph']);
      const k = randInt(-6, 6), p = d < 2 ? randInt(2, 6) : nz2(-6, 6) || 2, P = Math.abs(p) === 1 ? 2 * Math.sign(p) : p, q = nz2(-12, 12), r = P * k + q, sol = pick(ops), orig = P > 0 ? sol : flip(sol);
      if (f === 'solve') {
        const right = `${v} ${sol} ${k}`;
        return { topic: 'INEQUALITIES', text: `Solve: ${lin(P, q, v)} ${orig} ${r}`, ...textual(right, [`${v} ${flip(sol)} ${k}`, `${v} ${sol} ${Number.isInteger((r + q) / P) && (r + q) / P !== k ? (r + q) / P : k + 2}`, `${v} ${strict(sol)} ${k}`, `${v} ${sol} ${r - q}`].filter(s => s !== right)),
          steps: [`${q > 0 ? 'Subtract ' + q : 'Add ' + -q}: ${term(P, v)} ${orig} ${r - q}`, P > 0 ? `Divide by ${P}: ${right}` : `Divide by ${P} and FLIP the sign: ${right}`] };
      }
      if (f === 'word') {
        const c = randInt(6, 15), s = randInt(3, 9), n = randInt(2, 7), B = s + c * n + randInt(1, c - 1);
        return { topic: 'INEQUALITIES', text: `${who()} has $${B} for T-shirts that cost $${c} each, plus $${s} shipping for the order. What is the most shirts they can buy?`,
          ...nums(n, [n + 1, Math.floor(B / c) === n ? n + 2 : Math.floor(B / c), Math.floor((B + s) / c) === n ? n - 1 : Math.floor((B + s) / c)].filter(w => w > 0 && w !== n)),
          steps: [`${c}t + ${s} ≤ ${B}`, `${c}t ≤ ${B - s}, so t ≤ ${num((B - s) / c)}`, `Whole shirts only: ${n}.`] };
      }
      const right = `${lin(P, q, v)} ${orig} ${r}`, open = sol === '>' || sol === '<', toRight = sol === '>' || sol === '≥';
      return { topic: 'INEQUALITIES', text: 'Which inequality has the solution shown on the number line?',
        ...textual(right, [`${lin(P, q, v)} ${flip(orig)} ${r}`, `${lin(P, q, v)} ${strict(orig)} ${r}`, `${lin(-P, q, v)} ${orig} ${r}`, `${lin(P, -q, v)} ${orig} ${r}`].filter(s => s !== right)),
        steps: [`The graph shows ${v} ${sol} ${k}.`, `Solve ${right}: ${term(P, v)} ${orig} ${r - q}`, P > 0 ? `÷ ${P}: ${v} ${sol} ${k}` : `÷ ${P}, flip: ${v} ${sol} ${k}`],
        size: [150, 26], fig: (c, w) => {
          const X = nline(c, w, 10, k - 4, k + 4), x0 = X(k), x1 = toRight ? w - 2 : 1;
          F.box(c, Math.min(x0, x1), 9, Math.abs(x1 - x0), 3, HOT); nlDot(c, x0, 10, open);
          if (toRight) { F.line(c, w - 2, 10, w - 6, 6, HOT); F.line(c, w - 2, 10, w - 6, 14, HOT); } else { F.line(c, 1, 10, 5, 6, HOT); F.line(c, 1, 10, 5, 14, HOT); }
        } };
    },

    // 7.EE.3
    multiStepProblems: d => {
      const f = pick(['raise', 'shelf', 'recipe', 'save']);
      if (f === 'raise') {
        const w = randInt(12, 30), p = pick([5, 10, 20]), nw = round(w * (1 + p / 100));
        return { topic: 'WORD PROBLEMS', text: `${who()} earns $${w} an hour and gets a ${p}% raise. What is the new hourly pay?`,
          ...nums(nw, [w + p, round(w * p / 100), round(w * (1 - p / 100)), w + 1], money, .5), steps: [`${p}% of $${w} = ${money(w * p / 100)}`, `$${w} + ${money(w * p / 100)} = ${money(nw)}`] };
      }
      if (f === 'shelf') {
        const W = randInt(40, 60) + pick([0, .5]), s = randInt(10, 30) + pick([.25, .75, .5]), gap = (W - s) / 2;
        return { topic: 'WORD PROBLEMS', text: `A ${mixed(s)}-inch shelf is centered on a wall ${mixed(W)} inches wide. How far is the shelf from each end of the wall?`,
          ...nums(gap, [W - s, (W + s) / 2, gap + .5, W / 2].filter(v => Math.abs(v - gap) > 1e-9), mixed, .25),
          steps: [`Space left over: ${mixed(W)} - ${mixed(s)} = ${mixed(W - s)}`, `Split it between the two ends: ${mixed(W - s)} ÷ 2`, `= ${mixed(gap)} inches`] };
      }
      if (f === 'recipe') {
        const fl = pick([1.5, 2.25, 2.5, .75, 1.25]), n = pick([12, 8, 16, 24]), m = n * pick([1.5, 2.5, .5, 3]), ans = fl * m / n;
        return { topic: 'WORD PROBLEMS', text: `A recipe uses ${mixed(fl)} ${plural(fl, 'cup', 'cups')} of flour for ${n} cookies. How much flour is needed for ${m} cookies?`,
          ...nums(ans, [fl + m - n, fl * m, fl * n / m, ans + 1].filter(v => v > 0 && Math.abs(v - ans) > 1e-9), mixed, .25),
          steps: [`${m} cookies is ${num(m / n)} times ${n}.`, `${mixed(fl)} × ${num(m / n)} = ${mixed(ans)} cups`] };
      }
      const s = pick([7.5, 12.5, 15, 8.25, 10.5]), cost = randInt(80, 200), have = randInt(10, 60), need = Math.ceil((cost - have) / s - 1e-9);
      return { topic: 'WORD PROBLEMS', text: `A bike costs $${cost}. ${who()} has $${have} and saves ${money(s)} a week. How many weeks until there is enough?`,
        ...nums(need, [Math.ceil(cost / s), need - 1, Math.floor((cost + have) / s)].filter(v => v > 0 && v !== need)),
        steps: [`Still needed: $${cost} - $${have} = $${cost - have}`, `${cost - have} ÷ ${num(s)} = ${num((cost - have) / s)}`, `Round up to whole weeks: ${need}`] };
    },

    // 7.G.5
    angles: d => {
      const f = pick(d < 2 ? ['comp', 'supp', 'vert'] : ['comp', 'supp', 'vert', 'algebra', 'name']);
      if (f === 'name') {
        const [q, right] = pick([['Two angles add up to 90°. What are they called?', 'complementary'], ['Two angles add up to 180°. What are they called?', 'supplementary'],
          ['Two lines cross. What are the angles across from each other called?', 'vertical angles']]);
        return { topic: 'ANGLES', text: q, ...textual(right, ['complementary', 'supplementary', 'vertical angles', 'acute angles', 'right angles'].filter(s => s !== right)),
          steps: ['Complementary: add to 90°. Supplementary: add to 180°.', 'Vertical angles: across from each other where two lines cross. They are equal.'] };
      }
      if (f === 'algebra') {
        const g = pick(['supp', 'comp', 'vert']);
        for (let t = 0; t < 40; t++) {
          const a = randInt(2, 5), b = randInt(1, 6), c = nz2(-15, 25), e = nz2(-20, 30);
          const tot = g === 'supp' ? 180 : 90;
          if (g === 'vert') { if (a === b) continue; const x = (e - c) / (a - b); if (!Number.isInteger(x) || x <= 0 || a * x + c <= 0 || a * x + c >= 180) continue;
            return { topic: 'ANGLES', text: `Two lines cross. Vertical angles measure (${lin(a, c)})° and (${lin(b, e)})°. What is x?`, ...nums(x, [(e + c) / (a + b), (180 - c - e) / (a + b), x + 5].filter(w => Number.isInteger(w) && w !== x)),
              steps: ['Vertical angles are equal.', `${lin(a, c)} = ${lin(b, e)}`, `${term(a - b)} = ${e - c}, so x = ${x}`] }; }
          const x = (tot - c - e) / (a + b);
          if (!Number.isInteger(x) || x <= 0 || a * x + c <= 0 || b * x + e <= 0) continue;
          return { topic: 'ANGLES', text: `Two ${g === 'supp' ? 'supplementary' : 'complementary'} angles measure (${lin(a, c)})° and (${lin(b, e)})°. What is x?`,
            ...nums(x, [(270 - tot - c - e) / (a + b), (tot + c + e) / (a + b), (tot - c - e) / a].filter(w => Number.isInteger(w) && w > 0 && w !== x)),
            steps: [`They add to ${tot}°: ${lin(a, c)} + ${lin(b, e)} = ${tot}`, `${lin(a + b, c + e)} = ${tot}`, `${term(a + b)} = ${tot - c - e}, so x = ${x}`] };
        }
        return g7.angles(1);
      }
      if (f === 'comp') {
        const a = randInt(5, 13) * 5 + (d >= 2 ? randInt(0, 4) : 0), low = rand() < .5;
        return { topic: 'ANGLES', text: 'The angle shown is a right angle. What is the value of x?', ...nums(90 - a, [180 - a, a, 90 + a, 360 - a].filter(w => w !== 90 - a)),
          steps: ['The two parts make a right angle: they add to 90°.', `x + ${a} = 90`, `x = 90 - ${a} = ${90 - a}`],
          size: [90, 64], fig: (c, w, h) => { const V = [12, h - 8], R = h - 14; ray(c, ...V, 0, R + 10); ray(c, ...V, 90, R); ray(c, ...V, low ? a : 90 - a, R + 4); F.rightMark(c, V[0], V[1], 1, -1, DIM);
            const A0 = low ? a : 90 - a; L(c, low ? a + '°' : 'x°', ...at(...V, A0 / 2, R * .62), low ? INK : HOT); L(c, low ? 'x°' : a + '°', ...at(...V, (A0 + 90) / 2, R * .62), low ? HOT : INK); } };
      }
      if (f === 'supp') {
        const a = randInt(6, 30) * 5 + (d >= 2 ? randInt(0, 4) : 0), left = rand() < .5;
        return { topic: 'ANGLES', text: 'The angles sit on a straight line. What is the value of x?', ...nums(180 - a, [90 - a, a, 360 - a, 180 + a].filter(w => w > 0 && w !== 180 - a)),
          steps: ['Angles on a straight line add to 180°.', `x + ${a} = 180`, `x = 180 - ${a} = ${180 - a}`],
          size: [110, 52], fig: (c, w, h) => { const V = [Math.round(w / 2), h - 10], R = Math.min(w / 2 - 4, h - 14); ray(c, ...V, 0, w / 2 - 3); ray(c, ...V, 180, w / 2 - 3); const t = left ? 180 - a : a; ray(c, ...V, t, R);
            L(c, left ? 'x°' : a + '°', ...at(...V, t / 2, R * .55), left ? HOT : INK); L(c, left ? a + '°' : 'x°', ...at(...V, (t + 180) / 2, R * .55), left ? INK : HOT); } };
      }
      const a = randInt(7, 30) * 5, t0 = randInt(-15, 15), opp = rand() < .5, ans = opp ? a : 180 - a;
      return { topic: 'ANGLES', text: 'Two straight lines cross. What is the value of x?', ...nums(ans, [opp ? 180 - a : a, 90 - a, 360 - a].filter(w => w > 0 && w !== ans)),
        steps: opp ? ['x is across from the angle: vertical angles.', `Vertical angles are equal, so x = ${a}.`] : ['x is next to the angle on a straight line.', `They add to 180°: x = 180 - ${a} = ${180 - a}`],
        size: [100, 64], fig: (c, w, h) => { const V = [Math.round(w / 2), Math.round(h / 2)], R = h / 2 - 2; for (const t of [t0, t0 + a]) { F.line(c, ...at(...V, t, R + 14), ...at(...V, t + 180, R + 14), INK); }
          L(c, a + '°', ...at(...V, t0 + a / 2, 17), INK); const xm = opp ? t0 + 180 + a / 2 : t0 + a + (180 - a) / 2; L(c, 'x°', ...at(...V, xm, 17), HOT); } };
    },

    // 7.G.4
    circles: d => {
      const r = randInt(2, d < 2 ? 9 : 15), f = pick(d < 2 ? ['area', 'circ'] : d < 3 ? ['area', 'circ', 'back'] : ['area', 'circ', 'back', 'semi', 'pi']), useD = rand() < .5, pi = 3.14;
      const fig = (c, w, h) => { const R = Math.min(w, h) / 2 - 4, cx = Math.round(w / 2), cy = Math.round(h / 2); F.circle(c, cx, cy, R, INK); F.dot(c, [cx, cy], HOT);
        if (useD) { F.line(c, cx - R, cy, cx + R, cy, HOT); L(c, String(2 * r), cx, cy - 6, HOT); } else { F.line(c, cx, cy, cx + R, cy, HOT); L(c, String(r), cx + R / 2, cy - 6, HOT); } };
      const given = useD ? `diameter ${2 * r}` : `radius ${r}`;
      if (f === 'area') return { topic: 'CIRCLES', text: `The circle has a ${given} cm. What is its area? Use 3.14 for π.`, ...nums(round(pi * r * r), [round(2 * pi * r), round(pi * 4 * r * r), round(pi * r), round(pi * 2 * r * 2 * r / 2)].filter(v => Math.abs(v - pi * r * r) > .01), num, 1),
        steps: ['Area = π r^2' + (useD ? `, and r = ${2 * r} ÷ 2 = ${r}` : ''), `= 3.14 × ${r}^2 = 3.14 × ${r * r}`, `= ${num(pi * r * r)} square cm`], size: [64, 64], fig };
      if (f === 'circ') return { topic: 'CIRCLES', text: `The circle has a ${given} inches. What is its circumference? Use 3.14 for π.`, ...nums(round(2 * pi * r), [round(pi * r * r), round(pi * r), round(4 * pi * r), round(2 * pi * r + 2 * r)].filter(v => Math.abs(v - 2 * pi * r) > .01), num, 1),
        steps: ['Circumference = π d = 2π r', `= 3.14 × ${2 * r}`, `= ${num(2 * pi * r)} inches`], size: [64, 64], fig };
      if (f === 'back') { const C = round(2 * pi * r); return { topic: 'CIRCLES', text: `A circular rug has a circumference of ${num(C)} feet. What is its diameter? Use 3.14 for π.`, ...nums(2 * r, [r, round(C / 2), round(C * pi), 2 * r + 2].filter(v => v !== 2 * r)),
        steps: ['C = π d, so d = C ÷ π', `d = ${num(C)} ÷ 3.14`, `= ${2 * r} feet`] }; }
      if (f === 'semi') { const A = round(pi * r * r / 2); return { topic: 'CIRCLES', text: `A half-circle garden has a radius of ${r} meters. What is its area? Use 3.14 for π.`, ...nums(A, [round(pi * r * r), round(pi * r), round(pi * r * r / 4)].filter(v => Math.abs(v - A) > .01), num, 1),
        steps: [`Whole circle: 3.14 × ${r}^2 = ${num(pi * r * r)}`, `Half of it: ${num(A)} square meters`] }; }
      return { topic: 'CIRCLES', text: `A circle's circumference is ${2 * r}π. What is its area?`, ...textual(`${r * r}π`, [`${4 * r * r}π`, `${2 * r}π`, `${r}π`, `${2 * r * r}π`].filter(s => s !== `${r * r}π`)),
        steps: [`C = 2π r = ${2 * r}π, so r = ${r}.`, `A = π r^2 = π × ${r * r}`, `= ${r * r}π`] };
    },

    // 7.G.2
    triangleRules: d => {
      const f = pick(d < 2 ? ['which', 'third'] : ['which', 'third', 'unique', 'angle']);
      if (f === 'which') {
        const ok = () => { const a = randInt(3, 9), b = randInt(3, 9); return [a, b, randInt(Math.abs(a - b) + 1, a + b - 1)].sort((p, q) => p - q); };
        const bad = () => { const a = randInt(2, 7), b = randInt(2, 7); return [a, b, a + b + randInt(0, 4)].sort((p, q) => p - q); };
        const s = t => t.join(', '), right = s(ok());
        return { topic: 'TRIANGLES', text: 'Which three side lengths can make a triangle?', ...textual(right, [s(bad()), s(bad()), s(bad()), s(bad()), s(bad())].filter(x => x !== right)),
          steps: ['The two shorter sides must add to MORE than the longest.', `${right}: ${right.split(', ').slice(0, 2).join(' + ')} > ${right.split(', ')[2]}`] };
      }
      if (f === 'third') {
        const a = randInt(3, 9), b = randInt(a + 1, 15), lo = b - a, hi = a + b, good = randInt(lo + 1, hi - 1);
        return { topic: 'TRIANGLES', text: `Two sides of a triangle are ${a} and ${b} inches long. Which could be the length of the third side?`,
          ...fixed([lo - 1 > 0 ? lo - 1 : lo + 0, lo, good, hi].filter((v, i, arr) => arr.indexOf(v) === i).concat(hi + 1).slice(0, 4).sort((p, q) => p - q).map(String), String(good)),
          steps: [`The third side must be more than ${b} - ${a} = ${lo}`, `and less than ${b} + ${a} = ${hi}.`, `Only ${good} fits.`] };
      }
      if (f === 'unique') {
        const [q, ans] = pick([['How many different triangles have angles of 40°, 60° and 80°?', 'more than one'], ['How many triangles have angles of 50°, 70° and 80°?', 'none'],
          ['How many different triangles have sides of 5, 7 and 9 cm?', 'exactly one'], ['How many triangles have sides of 2, 3 and 8 cm?', 'none'],
          ['How many different triangles have angles of 30°, 60° and 90°?', 'more than one'], ['How many different triangles have sides of 6, 6 and 10 inches?', 'exactly one']]);
        return { topic: 'TRIANGLES', text: q, ...fixed(['none', 'exactly one', 'exactly two', 'more than one'], ans),
          steps: ['Three angles that add to 180° fit many sizes of triangle.', 'Three sides that can make a triangle fit just one.', `So: ${ans}.`] };
      }
      const a = randInt(25, 80), b = randInt(20, 150 - a);
      return { topic: 'TRIANGLES', text: `Two angles of a triangle are ${a}° and ${b}°. What is the third angle?`, ...nums(180 - a - b, [360 - a - b, a + b, 90 - a].filter(v => v > 0 && v !== 180 - a - b)),
        steps: ['The angles of a triangle add to 180°.', `180 - ${a} - ${b} = ${180 - a - b}°`] };
    },

    // 7.G.3
    crossSections: () => {
      const S = [['rectangular prism', 'parallel to its base', 'rectangle'], ['rectangular prism', 'straight down, parallel to its front', 'rectangle'], ['cube', 'parallel to one face', 'square'],
        ['cylinder', 'parallel to its base', 'circle'], ['cylinder', 'straight down through its center', 'rectangle'], ['cone', 'parallel to its base', 'circle'],
        ['cone', 'straight down through its tip', 'triangle'], ['square pyramid', 'parallel to its base', 'square'], ['square pyramid', 'straight down through its tip', 'triangle'],
        ['sphere', 'anywhere', 'circle'], ['triangular prism', 'parallel to its triangle faces', 'triangle']];
      const [solid, how, ans] = pick(S), shapes = ['circle', 'rectangle', 'triangle', 'square', 'trapezoid', 'hexagon'];
      const wr = shapes.filter(s => s !== ans && !(ans === 'square' && s === 'rectangle'));
      return { topic: 'CROSS SECTIONS', text: `A ${solid} is sliced ${how}, as shown. What shape is the cross section?`, ...textual(ans, shuffle(wr)),
        steps: [`Picture the flat face the cut leaves.`, `A ${solid} cut ${how} leaves a ${ans}.`],
        size: [96, 72], fig: (c, w, h) => {
          const D = (pts) => { for (let i = 0; i < pts.length; i++) F.line(c, ...pts[i], ...pts[(i + 1) % pts.length], HOT, 2); };
          if (solid === 'rectangular prism' || solid === 'cube') {
            const cube = solid === 'cube', bw = cube ? 40 : 54, bh = cube ? 40 : 30, dx = 18, dy = 13, x0 = 6;
            prism(c, w, h, null, { dx, dy, bw, bh });
            const py0 = 4 + dy + bh;
            if (how.startsWith('parallel to its base')) { const y = py0 - bh / 2; D([[x0 - 4, y], [x0 + bw + 2, y], [x0 + bw + dx + 4, y - dy], [x0 + dx - 2, y - dy]]); }
            else { const ox = dx / 2, oy = dy / 2; D([[x0 + ox - 4, py0 - oy + 3], [x0 + bw + ox + 4, py0 - oy + 3], [x0 + bw + ox + 4, py0 - oy - bh - 3], [x0 + ox - 4, py0 - oy - bh - 3]]); }
          } else if (solid === 'cylinder') {
            const cx = Math.round(w / 2), rx = 22, ry = 7, top = 12, bot = h - 10;
            ellipse(c, cx, top, rx, ry, INK); ellipse(c, cx, bot, rx, ry, INK, true); F.line(c, cx - rx, top, cx - rx, bot, INK); F.line(c, cx + rx, top, cx + rx, bot, INK);
            if (how.startsWith('parallel')) ellipse(c, cx, Math.round((top + bot) / 2), rx + 3, ry + 1, HOT);
            else { const t = 62 * DEG, ex = Math.round(Math.cos(t) * rx), ey = Math.round(Math.sin(t) * ry); D([[cx + ex, top - ey], [cx - ex, top + ey], [cx - ex, bot + ey], [cx + ex, bot - ey]]); }
          } else if (solid === 'cone') {
            const cx = Math.round(w / 2), rx = 26, ry = 8, tip = 5, bot = h - 11;
            ellipse(c, cx, bot, rx, ry, INK, true); F.line(c, cx, tip, cx - rx, bot, INK); F.line(c, cx, tip, cx + rx, bot, INK);
            if (how.startsWith('parallel')) { const m = .55, y = Math.round(tip + (bot - tip) * m); ellipse(c, cx, y, Math.round(rx * m) + 3, Math.round(ry * m) + 1, HOT); }
            else { const t = 62 * DEG, ex = Math.round(Math.cos(t) * rx), ey = Math.round(Math.sin(t) * ry); D([[cx, tip], [cx - ex, bot + ey], [cx + ex, bot - ey]]); }
          } else if (solid === 'square pyramid') {
            const cx = Math.round(w / 2), bw = 50, dx = 16, dy = 10, x0 = cx - (bw + dx) / 2, y0 = h - 8, A = [cx, 5];
            const B = [[x0, y0], [x0 + bw, y0], [x0 + bw + dx, y0 - dy], [x0 + dx, y0 - dy]];
            F.line(c, ...B[0], ...B[1], INK); F.line(c, ...B[1], ...B[2], INK); F.line(c, ...B[2], ...B[3], DIM, 2); F.line(c, ...B[3], ...B[0], DIM, 2);
            F.line(c, ...A, ...B[0], INK); F.line(c, ...A, ...B[1], INK); F.line(c, ...A, ...B[2], INK); F.line(c, ...A, ...B[3], DIM, 2);
            if (how.startsWith('parallel')) { const m = .5, P = B.map(([x, y]) => [Math.round(A[0] + (x - A[0]) * m), Math.round(A[1] + (y - A[1]) * m)]); D(P); }
            else { const mid = (p, q) => [Math.round((p[0] + q[0]) / 2), Math.round((p[1] + q[1]) / 2)]; D([A, mid(B[0], B[1]), mid(B[2], B[3])]); }
          } else if (solid === 'sphere') {
            const cx = Math.round(w / 2), cy = Math.round(h / 2), R = h / 2 - 4;
            F.circle(c, cx, cy, R, INK); ellipse(c, cx, cy, R, 7, DIM, true); ellipse(c, cx, cy - 13, Math.round(Math.sqrt(R * R - 169)) + 2, 5, HOT);
          } else {
            const x0 = 12, y0 = h - 10, b = 34, dx = 32, dy = 14, T = [[x0, y0], [x0 + b, y0], [x0 + b / 2, y0 - 30]], Bk = T.map(([x, y]) => [x + dx, y - dy]);
            F.outlinePoly(c, T, INK); F.line(c, ...Bk[1], ...Bk[2], INK); F.line(c, ...Bk[0], ...Bk[1], DIM, 2); F.line(c, ...Bk[0], ...Bk[2], DIM, 2);
            T.forEach((p, i) => F.line(c, ...p, ...Bk[i], i === 0 ? DIM : INK, i === 0 ? 2 : 0));
            D(T.map(([x, y]) => [Math.round(x + dx / 2), Math.round(y - dy / 2)]));
          }
        } };
    },

    // 7.G.6
    compositeArea: d => {
      const f = pick(d < 3 ? ['semi', 'frame'] : ['semi', 'frame', 'missing']);
      if (f === 'semi') {
        const W = randInt(2, 6) * 2, Lg = randInt(6, 14), r = W / 2, A = round(Lg * W + 3.14 * r * r / 2);
        return { topic: 'AREA', text: `The shape is a rectangle with a half circle on one end. What is its area, in square feet? Use 3.14 for π.`,
          ...nums(A, [round(Lg * W + 3.14 * r * r), round(Lg * W + 3.14 * W * W / 2), Lg * W, round(Lg * W + 3.14 * r)].filter(v => Math.abs(v - A) > .01), num, 1),
          steps: [`Rectangle: ${Lg} × ${W} = ${Lg * W}`, `Half circle, r = ${r}: 3.14 × ${r}^2 ÷ 2 = ${num(3.14 * r * r / 2)}`, `Total: ${num(A)} square feet`],
          size: [110, 56], fig: (c, w, h) => { const s = Math.min((w - 12) / (Lg + r), (h - 16) / W), x0 = 4, y0 = 4, rw = Math.round(Lg * s), rh = Math.round(W * s), R = rh / 2;
            F.line(c, x0, y0, x0 + rw, y0, INK); F.line(c, x0, y0 + rh, x0 + rw, y0 + rh, INK); F.line(c, x0, y0, x0, y0 + rh, INK); F.line(c, x0 + rw, y0, x0 + rw, y0 + rh, DIM, 2);
            F.arc(c, x0 + rw, y0 + R, R, -Math.PI / 2, Math.PI / 2, INK); L(c, String(Lg), x0 + rw / 2, y0 + rh + 7); L(c, String(W), x0 + rw - 6, y0 + R + 1, DIM); } };
      }
      if (f === 'frame') {
        const W = randInt(8, 14), H = randInt(6, 10), a = randInt(2, W - 4), b = randInt(2, H - 4), A = W * H - a * b;
        return { topic: 'AREA', text: `A ${W} by ${H} inch poster has a ${a} by ${b} inch hole cut out of it. What area is left, in square inches?`,
          ...nums(A, [W * H + a * b, W * H, (W - a) * (H - b), 2 * (W + H) - 2 * (a + b)].filter(v => v > 0 && v !== A)),
          steps: [`Whole poster: ${W} × ${H} = ${W * H}`, `Hole: ${a} × ${b} = ${a * b}`, `${W * H} - ${a * b} = ${A} square inches`],
          size: [100, 64], fig: (c, w, h) => { const s = Math.min((w - 20) / W, (h - 14) / H), x0 = 14, y0 = 2, X = v => x0 + Math.round(v * s), Y = v => y0 + Math.round(v * s);
            F.box(c, X(0), Y(0), Math.round(W * s), Math.round(H * s), '#1c2c60'); F.outlinePoly(c, [[X(0), Y(0)], [X(W), Y(0)], [X(W), Y(H)], [X(0), Y(H)]], INK);
            const hx = (W - a) / 2, hy = (H - b) / 2; F.box(c, X(hx), Y(hy), Math.round(a * s), Math.round(b * s), BG); F.outlinePoly(c, [[X(hx), Y(hy)], [X(hx + a), Y(hy)], [X(hx + a), Y(hy + b)], [X(hx), Y(hy + b)]], DIM);
            L(c, String(W), (X(0) + X(W)) / 2, Y(H) + 6); L(c, String(H), x0 - 3, (Y(0) + Y(H)) / 2 + 1, INK, 'right'); L(c, `${a}×${b}`, (X(hx) + X(hx + a)) / 2, (Y(hy) + Y(hy + b)) / 2 + 1, DIM); } };
      }
      const h0 = randInt(3, 10), b1 = randInt(6, 14), b2 = randInt(2, b1 - 2), A = (b1 + b2) * h0 / 2;
      return { topic: 'AREA', text: `A trapezoid has an area of ${num(A)} square cm. Its bases are ${b1} cm and ${b2} cm. What is its height?`, ...nums(h0, [A / (b1 + b2), 2 * A / b1, A - b1 - b2, A / b1].filter(v => v > 0 && Math.abs(v - h0) > 1e-9 && Math.abs(v * 10 - Math.round(v * 10)) < 1e-9), num, 1),
        steps: ['A = 1/2 × (b1 + b2) × h', `${num(A)} = 1/2 × ${b1 + b2} × h = ${num((b1 + b2) / 2)}h`, `h = ${num(A)} ÷ ${num((b1 + b2) / 2)} = ${h0} cm`] };
    },

    // 7.G.6
    prisms: d => {
      const f = pick(d < 2 ? ['rect', 'cube'] : d < 3 ? ['rect', 'tri', 'sa'] : ['rect', 'tri', 'sa', 'base', 'edge']);
      if (f === 'rect' || f === 'sa') {
        const l = randInt(3, 10), w = randInt(2, 7), h = randInt(2, 8), V = l * w * h, SA = 2 * (l * w + l * h + w * h), sa = f === 'sa';
        return { topic: sa ? 'SURFACE AREA' : 'VOLUME', text: `What is the ${sa ? 'surface area, in square feet,' : 'volume, in cubic feet,'} of the box?`,
          ...nums(sa ? SA : V, sa ? [V, l * w + l * h + w * h, 6 * l * w] : [SA, l * w, l + w + h].filter(v => v !== (sa ? SA : V))),
          steps: sa ? [`Faces: ${l}×${w} = ${l * w}, ${l}×${h} = ${l * h}, ${w}×${h} = ${w * h}`, `Two of each: 2 × ${l * w + l * h + w * h} = ${SA}`] : [`V = length × width × height`, `= ${l} × ${w} × ${h} = ${V}`],
          size: [120, 60], fig: (c, W, H) => prism(c, W, H, [String(l), String(h), String(w)]) };
      }
      if (f === 'cube') { const s = randInt(2, 9); return { topic: 'VOLUME', text: `A cube has edges ${s} cm long. What is its volume, in cubic cm?`, ...nums(s ** 3, [3 * s, s * s, 6 * s * s, 12 * s].filter(v => v !== s ** 3)), steps: ['V = s × s × s', `= ${s} × ${s} × ${s} = ${s ** 3}`] }; }
      if (f === 'tri') {
        const b = randInt(3, 10), th = randInt(2, 8) * (b % 2 ? 2 : 1), Lg = randInt(4, 12), B = b * th / 2, V = B * Lg;
        return { topic: 'VOLUME', text: `The prism's ends are triangles with base ${b} m and height ${th} m. It is ${Lg} m long. What is its volume, in cubic meters?`,
          ...nums(V, [b * th * Lg, B + Lg, b + th + Lg].filter(v => v !== V)), steps: [`Triangle area: 1/2 × ${b} × ${th} = ${B}`, `V = base area × length = ${B} × ${Lg}`, `= ${V} cubic meters`],
          size: [100, 56], fig: (c, w, h) => { const x0 = 8, y0 = h - 10, bw = 34, th0 = 28, dx = 40, dy = 14, T = [[x0, y0], [x0 + bw, y0], [x0 + 6, y0 - th0]], Bk = T.map(([x, y]) => [x + dx, y - dy]);
            F.outlinePoly(c, T, INK); F.line(c, ...Bk[1], ...Bk[2], INK); F.line(c, ...Bk[0], ...Bk[1], DIM, 2); F.line(c, ...Bk[0], ...Bk[2], DIM, 2);
            T.forEach((p, i) => F.line(c, ...p, ...Bk[i], i === 0 ? DIM : INK, i === 0 ? 2 : 0)); F.line(c, T[2][0], T[2][1], T[2][0], y0, HOT, 2);
            L(c, String(b), x0 + bw / 2, y0 + 6); L(c, String(th), T[2][0] - 2, y0 - th0 / 2, HOT, 'right'); L(c, String(Lg), x0 + bw + dx / 2 + 4, y0 - dy / 2 + 2, INK, 'left'); } };
      }
      if (f === 'base') { const B = randInt(6, 40), hh = randInt(3, 15) + pick([0, .5]), V = B * hh; return { topic: 'VOLUME', text: `A prism's base has an area of ${B} square inches. The prism is ${num(hh)} inches tall. What is its volume?`, ...nums(V, [B + hh, V / 2, B * hh * 2].filter(v => v !== V), num, 5), steps: ['V = base area × height', `= ${B} × ${num(hh)} = ${num(V)} cubic inches`] }; }
      const s = randInt(2, 9);
      return { topic: 'VOLUME', text: `A cube has a volume of ${s ** 3} cubic inches. How long is each edge?`, ...nums(s, [s ** 3 / 3, s * s, s + 1].filter(v => v !== s && Number.isInteger(v))), steps: [`Find the number that times itself 3 times makes ${s ** 3}.`, `${s} × ${s} × ${s} = ${s ** 3}, so ${s} inches`] };
    },

    // 7.SP.1
    sampling: () => {
      const T = [['The principal wants to know which lunch the students like best.', ['40 students picked at random from the school list', 'every 10th name on the school list', '5 random students from each class'], ['the 40 students in the chess club', 'the first 40 students in the pizza line', 'the 40 students in her own class', 'the 40 teachers']],
        ['The town wants to know if people want a new skate park.', ['200 people picked at random from the town', 'every 20th house on the town map', '200 random names from the town voter list'], ['200 people at the skate shop', '200 people at the senior center', 'the 200 people who ask first', 'the town council']],
        ['A game maker wants to know how long kids play each day.', ['100 kids picked at random from all its players', 'every 50th player on its list', '100 players a computer draws at random'], ['the 100 kids at a gaming contest', 'the 100 kids who play the most', 'the 100 kids on one street', 'the 100 kids who email the company']],
        ['The coach wants to know what the whole school thinks of the new uniforms.', ['50 students chosen at random from the school', 'every 10th student in the school list', '10 random students from each grade'], ['the 50 players on the team', '50 students from the art club', 'the 50 students in 8th grade', 'the 50 students who wrote in']]];
      const [S, goods, bads] = pick(T), inv = rand() < .35;
      if (inv) { const right = pick(bads); return { topic: 'SAMPLING', text: `${S} Which sample is biased?`, ...textual(right, shuffle(goods.slice())),
        steps: ['A biased sample picks a special group or leaves people out.', `${right[0].toUpperCase() + right.slice(1)} is not everyone.`, 'Random picks from the whole group are fair.'] }; }
      const good = pick(goods);
      return { topic: 'SAMPLING', text: `${S} Which sample is most likely to represent everyone?`, ...textual(good, shuffle(bads.slice())),
        steps: ['A fair sample is chosen at random from the whole group.', 'Special groups (a club, one class, volunteers) are biased.', `So: ${good}.`] };

    },

    // 7.SP.2
    inference: d => {
      const f = pick(d < 3 ? ['predict', 'predict', 'defect'] : ['predict', 'defect', 'capture']);
      if (f === 'predict') {
        const n = pick([20, 25, 40, 50, 60]), pop = n * randInt(5, 30), k = randInt(2, n - 3), ans = k * pop / n;
        const [S] = pick([[`In a random sample of ${n} students, ${k} walk to school. About how many of the ${num(pop)} students walk to school?`], [`A random sample of ${n} fans found ${k} who want a new team logo. About how many of ${num(pop)} fans want a new logo?`]]);
        return { topic: 'SAMPLING', text: S, ...nums(ans, [k, pop - ans, k * n, ans / 2].filter(v => v > 0 && Number.isInteger(v) && v !== ans), num, pop / n),
          steps: [`In the sample: ${k} out of ${n} = ${num(k / n)}`, `${num(k / n)} × ${num(pop)} = ${num(ans)}`] };
      }
      if (f === 'defect') {
        const n = pick([50, 100, 200]), k = randInt(1, 6), lot = n * randInt(10, 50), ans = k * lot / n;
        return { topic: 'SAMPLING', text: `A factory checks ${n} light bulbs at random and finds ${k} broken. About how many of the ${num(lot)} bulbs made today are broken?`,
          ...nums(ans, [k, lot - ans, k * 10].filter(v => v > 0 && v !== ans), num, Math.max(1, ans / 4)), steps: [`${k} out of ${n} is broken.`, `${k}/${n} × ${num(lot)} = ${num(ans)}`] };
      }
      const tag = pick([20, 30, 40, 50]), catch2 = pick([40, 50, 60]), m = pick([4, 5, 6, 8, 10].filter(x => tag * catch2 % x === 0)), ans = tag * catch2 / m;
      return { topic: 'SAMPLING', text: `Rangers tag ${tag} fish in a lake. Later they catch ${catch2} fish and ${m} have tags. About how many fish are in the lake?`,
        ...nums(ans, [tag + catch2, tag * m, catch2 * m, tag * catch2].filter(v => v !== ans), num, 10), steps: [`Tagged in the catch: ${m}/${catch2}. That matches ${tag}/N.`, `${m}/${catch2} = ${tag}/N`, `N = ${tag} × ${catch2} ÷ ${m} = ${ans}`] };
    },

    // 7.SP.3, 7.SP.4
    compareData: d => {
      const f = pick(d < 2 ? ['box', 'box'] : ['box', 'mad', 'spread']);
      if (f === 'mad') {
        const mad = randInt(2, 5), k = randInt(2, 4), mA = randInt(40, 70), mB = mA + k * mad;
        const [A, B, what, u] = pick([['the basketball team', 'the soccer team', 'height', 'inches'], ['Class A', 'Class B', 'test score', 'points'], ["Team 1's robots", "Team 2's robots", 'race time', 'seconds']]);
        return { topic: 'COMPARING DATA', text: `The mean ${what} for ${A} is ${mA} ${u}. For ${B} it is ${mB} ${u}. Both have a MAD of ${mad}. The difference in means is how many MADs?`,
          ...nums(k, [mB - mA, mad, k * mad + 1, k + 1].filter(v => v !== k)), steps: [`Difference: ${mB} - ${mA} = ${mB - mA}`, `${mB - mA} ÷ ${mad} = ${k} MADs`] };
      }
      const gen = () => sample([...Array(19).keys()].map(k => k + 1), 5).sort((a, b) => a - b);
      let A = gen(), B = gen(); if (A[2] === B[2]) B = B.map(v => Math.min(20, v + 1));
      if (f === 'spread') { for (let t = 0; t < 10 && (A[3] - A[1]) === (B[3] - B[1]); t++) B = gen(); }
      const fig = (c, w, h) => { const X = nline(c, w, 40, 0, 20, { every: 5, arrows: false, x0: 16, x1: w - 7 }); L(c, 'X', 4, 10, INK, 'left'); L(c, 'Y', 4, 27, INK, 'left'); boxPlot(c, X, 9, A, HOT); boxPlot(c, X, 26, B, BLU); };
      const base = { topic: 'COMPARING DATA', size: [164, 52], fig };
      if (f === 'spread') { const ia = A[3] - A[1], ib = B[3] - B[1], more = ia > ib ? 'X' : 'Y'; return { ...base, text: 'The box plots show scores for groups X and Y. Which group\'s middle half is more spread out?',
        ...fixed(['group X', 'group Y', 'they are the same', 'you cannot tell'], 'group ' + more), steps: ['Compare the IQRs: the widths of the boxes.', `X: ${A[3]} - ${A[1]} = ${ia}. Y: ${B[3]} - ${B[1]} = ${ib}.`, `Group ${more} is more spread out.`] }; }
      const diff = Math.abs(A[2] - B[2]);
      return { ...base, text: 'The box plots show scores for groups X and Y. How much greater is the larger median than the smaller one?',
        ...nums(diff, [Math.abs(A[4] - B[4]), Math.abs(A[3] - B[3]), Math.abs(A[2] + B[2]) / 2].filter(v => v !== diff && Number.isInteger(v))),
        steps: [`Median of X: ${A[2]}. Median of Y: ${B[2]}.`, `${Math.max(A[2], B[2])} - ${Math.min(A[2], B[2])} = ${diff}`] };
    },

    // 7.SP.5, 7.SP.7a
    probability: d => {
      const f = pick(d < 2 ? ['bag', 'words', 'spin'] : ['bag', 'words', 'spin', 'die']);
      if (f === 'words') {
        const [v, w] = pick([[0, 'impossible'], [1, 'certain'], [.5, 'as likely as not'], [pick([.05, .1, .15, .2]), 'unlikely'], [pick([.8, .85, .9, .95]), 'likely']]);
        const ALL = ['impossible', 'unlikely', 'as likely as not', 'likely', 'certain'], drop = pick(ALL.filter(x => x !== w));
        return { topic: 'PROBABILITY', text: `An event has a probability of ${num(v)}. How likely is it?`, ...fixed(ALL.filter(x => x !== drop), w),
          steps: ['0 is impossible, 1 is certain, 1/2 is as likely as not.', `Near 0: unlikely. Near 1: likely.`, `${num(v)} is ${w}.`] };
      }
      if (f === 'bag') {
        const cols = sample(['red', 'blue', 'green', 'yellow', 'purple'], 3), ns = [randInt(1, 8), randInt(1, 8), randInt(1, 8)], tot = ns[0] + ns[1] + ns[2], i = randInt(0, 2), ans = ns[i] / tot, not = d >= 3 && rand() < .4;
        const A = not ? 1 - ans : ans;
        return { topic: 'PROBABILITY', text: `A bag has ${ns.map((n, j) => `${n} ${cols[j]}`).join(', ')} marbles. You pick one without looking. What is P(${not ? 'not ' : ''}${cols[i]})?`,
          ...pnums(A, [not ? ans : 1 - ans, ns[i] / (tot - ns[i]), 1 / 3, ns[(i + 1) % 3] / tot, ns[i] / 10].filter(v => v > 0 && Math.abs(v - A) > 1e-9), fs, 1 / tot),
          steps: [`Total marbles: ${tot}`, not ? `Not ${cols[i]}: ${tot - ns[i]} of them` : `${cols[i]}: ${ns[i]} of them`, `P = ${not ? tot - ns[i] : ns[i]}/${tot}${fs(A) !== `${not ? tot - ns[i] : ns[i]}/${tot}` ? ' = ' + fs(A) : ''}`] };
      }
      if (f === 'spin') {
        const n = pick([4, 5, 6, 8]), labs = Array.from({ length: n }, (_, i) => String(i + 1)), [S, ok] = pick([['an even number', x => x % 2 === 0], ['a number greater than 2', x => x > 2], ['a 1', x => x === 1], ['an odd number', x => x % 2 === 1], ['a number less than 4', x => x < 4]]);
        const k = labs.filter(x => ok(+x)).length, ans = k / n;
        return { topic: 'PROBABILITY', text: `The spinner has ${n} equal parts. What is the probability of spinning ${S}?`, ...pnums(ans, [k / (n - k || 1), 1 / n, (n - k) / n, k / 10].filter(v => v > 0 && Math.abs(v - ans) > 1e-9), fs, 1 / n),
          steps: [`${n} equal outcomes.`, `${S}: ${labs.filter(x => ok(+x)).join(', ')}, that is ${k}.`, `P = ${k}/${n}${fs(ans) !== `${k}/${n}` ? ' = ' + fs(ans) : ''}`],
          size: [60, 60], fig: (c, w, h) => spinner(c, Math.round(w / 2), Math.round(h / 2), Math.min(w, h) / 2 - 3, labs.map((l, i) => ({ n: 1, col: i % 2 ? '#283c88' : '#1c2c60', lab: l }))) };
      }
      const [S, k] = pick([['a number greater than 4', 2], ['an even number', 3], ['a 6', 1], ['a number less than 3', 2], ['a 1 or a 2', 2], ['not a 6', 5]]), ans = k / 6;
      return { topic: 'PROBABILITY', text: `You roll a number cube (1 to 6). What is the probability of rolling ${S}?`, ...pnums(ans, [k / (6 - k || 1), 1 / 6, (6 - k) / 6, k / 10].filter(v => v > 0 && Math.abs(v - ans) > 1e-9), fs, 1 / 6),
        steps: ['6 equally likely outcomes.', `${k} of them work.`, `P = ${k}/6${fs(ans) !== `${k}/6` ? ' = ' + fs(ans) : ''}`] };
    },

    // 7.SP.6, 7.SP.7b
    experimental: d => {
      const f = pick(d < 2 ? ['expect', 'exp'] : ['expect', 'exp', 'predict', 'table']);
      if (f === 'expect') {
        const [S, p] = pick([['A coin is flipped', 1 / 2], ['A number cube is rolled', 1 / 6], ['A spinner with 4 equal parts is spun', 1 / 4], ['A spinner with 5 equal parts is spun', 1 / 5]]), n = Math.round(1 / p) * randInt(5, 50), ans = n * p;
        const what = p === 1 / 2 ? 'heads' : p === 1 / 6 ? 'a 3' : 'the red part';
        return { topic: 'PROBABILITY', text: `${S} ${num(n)} times. About how many times should it land on ${what}?`, ...nums(ans, [n, n / 2 === ans ? n / 4 : n / 2, Math.round(n * p * 2)].filter(v => v !== ans && Number.isInteger(v)), num, Math.max(1, Math.round(ans / 5))),
          steps: [`P(${what}) = ${fs(p)}`, `${fs(p)} × ${num(n)} = ${num(ans)}`] };
      }
      if (f === 'exp') {
        const n = pick([20, 25, 40, 50, 60, 100]), k = randInt(1, n - 1), ans = k / n;
        return { topic: 'PROBABILITY', text: `A spinner landed on red ${k} times in ${n} spins. What is the experimental probability of red?`, ...pnums(ans, [k / (n - k), (n - k) / n, 1 / k, k / 100].filter(v => v > 0 && v < 2 && Math.abs(v - ans) > 1e-9), fs, 1 / n),
          steps: ['Experimental probability = times it happened ÷ tries', `${k}/${n}${fs(ans) !== `${k}/${n}` ? ' = ' + fs(ans) : ''}`] };
      }
      if (f === 'predict') {
        const n = pick([20, 25, 30, 40]), k = randInt(Math.ceil(n / 3), n - 2), m = pick([50, 60, 80, 100, 120].filter(x => x * k % n === 0)) || n * 2, ans = m * k / n;
        return { topic: 'PROBABILITY', text: `${who()} made ${k} of ${n} free throws. At that rate, about how many of ${m} would ${pick(['she', 'he', 'they'])} make?`,
          ...nums(ans, [k, m - (n - k), m - ans, k + m - n].filter(v => v > 0 && v !== ans)), steps: [`Rate: ${k}/${n} = ${num(k / n)}`, `${num(k / n)} × ${m} = ${num(ans)}`] };
      }
      const cols = ['RED', 'BLUE', 'GREEN', 'YELLOW'], cnt = [randInt(3, 15), randInt(3, 15), randInt(3, 15), randInt(3, 15)], tot = cnt.reduce((a, b) => a + b, 0), i = randInt(0, 3), m = tot * pick([2, 4, 5, 10]), ans = cnt[i] * m / tot;
      return { topic: 'PROBABILITY', text: `${who()} pulled a cube from a bag and put it back ${tot} times. The table shows the results. Predict how many ${cols[i].toLowerCase()} in ${m} pulls.`,
        ...nums(ans, [cnt[i], m / 4, cnt[i] * 10, ans + cnt[i]].filter(v => v !== ans && Number.isInteger(v))),
        steps: [`${cols[i].toLowerCase()}: ${cnt[i]} of ${tot}`, `${cnt[i]}/${tot} × ${m} = ${num(ans)}`],
        size: [164, 30], fig: (c, w, h) => table(c, w, h, [cols, cnt.map(String)]) };
    },

    // 7.SP.8
    compound: d => {
      const f = pick(d < 2 ? ['count', 'coins'] : d < 3 ? ['count', 'coins', 'coinDie', 'tree', 'sim'] : ['count', 'coinDie', 'dice', 'tree', 'replace', 'sim']);
      if (f === 'count') {
        const a = randInt(2, 6), b = randInt(2, 6), [A, B] = pick([['sandwiches', 'drinks'], ['shirts', 'pairs of shorts'], ['pizza toppings', 'crusts'], ['ice cream flavors', 'toppings']]);
        return { topic: 'PROBABILITY', text: `A menu has ${a} ${A} and ${b} ${B}. How many ways can you pick one of each?`, ...nums(a * b, [a + b, a * b / 2, a * b + a].filter(v => Number.isInteger(v) && v !== a * b)),
          steps: [`Each of the ${a} ${A} goes with each of the ${b} ${B}.`, `${a} × ${b} = ${a * b}`] };
      }
      if (f === 'coins') {
        const n = pick([2, 3]), ans = 1 / 2 ** n;
        return { topic: 'PROBABILITY', text: `You flip ${n} coins. What is the probability that ${n === 2 ? 'both' : 'all 3'} land heads?`, ...pnums(ans, [1 / 2, 1 / n, 1 / (2 * n), n / 2 ** n].filter(v => Math.abs(v - ans) > 1e-9), fs, ans),
          steps: [`Each coin: P(heads) = 1/2`, `${Array(n).fill('1/2').join(' × ')} = ${fs(ans)}`] };
      }
      if (f === 'coinDie') {
        const [S, k] = pick([['heads and a 6', 1], ['tails and an even number', 3], ['heads and a number less than 3', 2]]), ans = k / 12;
        return { topic: 'PROBABILITY', text: `You flip a coin and roll a number cube. What is P(${S})?`, ...pnums(ans, [1 / 2 + k / 6, k / 6, 1 / 8, k / 8].filter(v => Math.abs(v - ans) > 1e-9), fs, 1 / 12),
          steps: ['2 × 6 = 12 equally likely outcomes.', `P = 1/2 × ${k}/6 = ${k}/12${k > 1 ? ' = ' + fs(ans) : ''}`] };
      }
      if (f === 'dice') {
        const s = randInt(2, 12), ways = 6 - Math.abs(7 - s), ans = ways / 36;
        return { topic: 'PROBABILITY', text: `You roll two number cubes and add them. What is the probability the sum is ${s}?`, ...pnums(ans, [1 / 11, s / 36, 1 / 6 === ans ? 1 / 12 : 1 / 6, ways / 12].filter(v => Math.abs(v - ans) > 1e-9), fs, 1 / 36),
          steps: ['6 × 6 = 36 equally likely outcomes.', `Ways to make ${s}: ${ways}`, `P = ${ways}/36${fs(ans) !== `${ways}/36` ? ' = ' + fs(ans) : ''}`] };
      }
      if (f === 'replace') {
        const r = randInt(2, 5), b = randInt(2, 5), t = r + b, ans = r / t * (r - 1) / (t - 1);
        return { topic: 'PROBABILITY', text: `A bag has ${r} red and ${b} blue marbles. You pick one, keep it, then pick another. What is P(both red)?`,
          ...pnums(ans, [(r / t) ** 2, r / t, (r - 1) / (t - 1), 2 * r / t].filter(v => v <= 1 && Math.abs(v - ans) > 1e-9), fs, .05),
          steps: [`First red: ${r}/${t}. Then ${r - 1} red left of ${t - 1}.`, `${r}/${t} × ${r - 1}/${t - 1} = ${r * (r - 1)}/${t * (t - 1)}`, `= ${fs(ans)}`] };
      }
      if (f === 'sim') {
        const [p, right, wr] = pick([['1/2', 'flip a coin', ['roll a number cube', 'spin a spinner with 3 equal parts', 'pick a card from 10']], ['1/6', 'roll a number cube', ['flip a coin', 'spin a spinner with 4 equal parts', 'pick a day of the week']],
          ['1/4', 'spin a spinner with 4 equal parts', ['flip a coin', 'roll a number cube', 'spin a spinner with 5 equal parts']]]);
        return { topic: 'PROBABILITY', text: `A player makes ${p} of her shots. Which could simulate one shot?`, ...textual(right, wr), steps: [`You need something with a ${p} chance.`, `${right[0].toUpperCase() + right.slice(1)}: one outcome out of ${p.split('/')[1]}.`] };
      }
      const A = sample(['RED', 'BLUE', 'GREEN'], 2), B = sample(['JEANS', 'SHORTS', 'SKIRT'], d < 3 ? 2 : 3), tot = A.length * B.length, a = randInt(0, A.length - 1), b = randInt(0, B.length - 1), ans = 1 / tot;
      return { topic: 'PROBABILITY', text: `The tree shows outfits: a shirt then pants, all equally likely. What is P(${A[a].toLowerCase()} shirt and ${B[b].toLowerCase()})?`,
        ...pnums(ans, [1 / A.length, 1 / B.length, 2 / tot, 1 / (A.length + B.length)].filter(v => Math.abs(v - ans) > 1e-9), fs, 1 / tot),
        steps: [`${A.length} shirts × ${B.length} pants = ${tot} outfits.`, `Just one is ${A[a].toLowerCase()} with ${B[b].toLowerCase()}.`, `P = 1/${tot}`],
        size: [118, B.length === 3 ? 80 : 60], fig: (c, w, h) => {
          const rows = A.length * B.length, gap = (h - 4) / rows;
          A.forEach((s, i) => { const y = Math.round(2 + gap * B.length * (i + .5)); F.line(c, 3, Math.round(h / 2), 13, y, DIM); L(c, s, 15, y + 1, HOT, 'left');
            B.forEach((t, j) => { const y2 = Math.round(2 + gap * (i * B.length + j + .5)); F.line(c, 47, y, 66, y2, DIM); L(c, t, 68, y2 + 1, INK, 'left'); }); });
          F.dot(c, [3, Math.round(h / 2)], INK);
        } };
    },

    // 7.SP.7
    probabilityModels: d => {
      const f = pick(['spin', 'letters', 'fair']);
      if (f === 'spin') {
        const shares = pick([[2, 1, 1], [3, 2, 1], [4, 2, 1, 1], [2, 2, 1, 3], [3, 1]]), names = sample(['red', 'blue', 'green', 'yellow', 'purple'], shares.length), tot = shares.reduce((a, b) => a + b, 0), i = randInt(0, shares.length - 1), ans = shares[i] / tot;
        return { topic: 'PROBABILITY', text: `The spinner's parts are not all the same size. What is the probability of landing on ${names[i]}?`,
          ...pnums(ans, [1 / shares.length, shares[i] / (tot - shares[i]), (tot - shares[i]) / tot, 1 / tot].filter(v => v > 0 && v <= 1 && Math.abs(v - ans) > 1e-9), fs, 1 / tot),
          steps: [`Think of the spinner as ${tot} equal slices.`, `${names[i]} covers ${shares[i]} of them.`, `P = ${shares[i]}/${tot}${fs(ans) !== `${shares[i]}/${tot}` ? ' = ' + fs(ans) : ''}`],
          size: [60, 60], fig: (c, w, h) => spinner(c, Math.round(w / 2), Math.round(h / 2), Math.min(w, h) / 2 - 3, shares.map((s, j) => ({ n: s, col: COLORS[names[j]] }))) };
      }
      if (f === 'letters') {
        const word = pick(['MISSISSIPPI', 'BANANA', 'BOOKKEEPER', 'TENNESSEE', 'COMMITTEE', 'GIRAFFE', 'PEPPER']), counts = {};
        for (const ch of word) counts[ch] = (counts[ch] || 0) + 1;
        const ch = pick(Object.keys(counts)), ans = counts[ch] / word.length, uniq = Object.keys(counts).length;
        return { topic: 'PROBABILITY', text: `Each letter of ${word} is on a card. You pick one card at random. What is P(${ch})?`, ...pnums(ans, [1 / uniq, 1 / word.length, counts[ch] / uniq, counts[ch] / (word.length - counts[ch])].filter(v => v <= 1 && Math.abs(v - ans) > 1e-9), fs, 1 / word.length),
          steps: [`${word.length} cards in all.`, `${counts[ch]} of them are ${ch}.`, `P = ${counts[ch]}/${word.length}${fs(ans) !== `${counts[ch]}/${word.length}` ? ' = ' + fs(ans) : ''}`] };
      }
      const n = pick([50, 60, 100]), fair = rand() < .5, heads = fair ? Math.round(n / 2) + randInt(-3, 3) : Math.round(n * pick([.8, .85, .15, .2]));
      return { topic: 'PROBABILITY', text: `A coin landed heads ${heads} times in ${n} flips. Which is the best conclusion?`,
        ...textual(fair ? 'It is probably fair: close to half.' : 'It is probably not fair.', fair ? ['It is probably not fair.', 'Heads will come up next.', 'Tails is now more likely.'] : ['It is probably fair: close to half.', 'Heads will always come up.', 'It must be fair: coins always are.']),
        steps: [`A fair coin should land heads about half the time: ${n / 2}.`, `${heads} is ${fair ? 'close to' : 'far from'} ${n / 2}.`] };
    },
  };

  Questions.grade({ id: '7', n: 7, label: '7TH GRADE', short: '7TH', clock: [42, 40, 36, 33, 30], kinds: g7,
    min: { simpleInterest: 2, rationalExpressions: 2, multiStepProblems: 2, twoStepInequalities: 2, crossSections: 2, compositeArea: 2, compareData: 2, inference: 2, compound: 1, probabilityModels: 2 } });

  // ======================================================================
  // 8th grade
  // ======================================================================
  const sup = e => e < 0 || e > 9 ? `^{${e}}` : `^${e}`;
  const pw = (b, e) => `${b}${sup(e)}`;
  const sci = (m, e) => `${num(m, 3)} × 10${sup(e)}`;
  const toSci = v => { let e = Math.floor(Math.log10(Math.abs(v)) + 1e-9), m = round(v / 10 ** e, 6); if (Math.abs(m) >= 10) { m = round(m / 10, 6); e++; } return [m, e]; };
  const std = v => Math.abs(v) >= 1 ? num(v, 3) : Number(v.toPrecision(10)).toLocaleString('en-US', { maximumFractionDigits: 15 });
  // "y = 3x - 2", "y = (2/3)x + 1", "y = -x".
  const coef = m => m === 1 ? '' : m === -1 ? '-' : Number.isInteger(m) ? String(m) : `${m < 0 ? '-' : ''}(${fs(Math.abs(m))})`;
  const yeq = (m, b) => m === 0 ? `y = ${fs(b)}` : `y = ${coef(m)}x${b ? (b < 0 ? ' - ' + fs(-b) : ' + ' + fs(b)) : ''}`;
  // Four little graphs side by side, A to D: each a function of t in [-1, 1] giving [x, y] in [-1, 1].
  const SHAPES = {
    line: t => [t, .7 * t], parab: t => [t, t * t - .6], abs: t => [t, Math.abs(t) - .5], cubic: t => [t, t * t * t * .9], down: t => [t, .3 - .6 * t],
    circle: t => [.7 * Math.cos(Math.PI * t), .7 * Math.sin(Math.PI * t)], sideways: t => [t * t - .6, t], vert: t => [.3, t], sideV: t => [Math.abs(t) - .5, t],
  };
  function miniGraphs(c, h, kinds) {
    kinds.forEach((k, i) => {
      const x0 = 4 + i * 42, s = 17, cx = x0 + 18, cy = 20, P = ([u, v]) => [Math.round(cx + u * s), Math.round(cy - v * s)];
      F.line(c, x0, cy, x0 + 36, cy, DIM); F.line(c, cx, 2, cx, 38, DIM);
      for (let j = 0; j < 40; j++) F.line(c, ...P(SHAPES[k](-1 + j / 20)), ...P(SHAPES[k](-1 + (j + 1) / 20)), HOT);
      L(c, '1234'[i], cx, h - 4, INK);
    });
  }
  // A right triangle with legs a (across) and b (up), labels as given.
  function rightTri(c, w, h, a, b, la, lb, lc) {
    const s = Math.min((w - 30) / a, (h - 18) / b), x0 = 8, y0 = h - 10, A = [x0, y0], B = [x0 + Math.round(a * s), y0], C = [x0 + Math.round(a * s), y0 - Math.round(b * s)];
    F.outlinePoly(c, [A, B, C], INK); F.rightMark(c, B[0], B[1], -1, -1);
    L(c, la, (A[0] + B[0]) / 2, y0 + 7, la === '?' ? HOT : INK); L(c, lb, B[0] + 4, (B[1] + C[1]) / 2 + 1, lb === '?' ? HOT : INK, 'left');
    L(c, lc, (A[0] + C[0]) / 2 - 5, (A[1] + C[1]) / 2 - 4, lc === '?' ? HOT : INK, 'right');
  }

  const g8 = {
    // 8.NS.1
    rationalIrrational: d => {
      const RAT = ['√16', '√49', '√81', '√100', '0.333...', '5/8', '-12', '3.14', '0.25', '√4', '0.1212...', '7', '-2/3', '√64', '1.5', '√36'];
      const IRR = ['√2', '√7', '√15', '√20', 'π', '√50', '√3', '√10', '√99', '√8', '√30'];
      if (d >= 2 && rand() < .4) {
        const S = shuffle([[`${pick(['√25', '√9', '√144'])} is rational.`, 1], [`${pick(['√12', '√5', '√40'])} is irrational.`, 1], ['π is rational.', 0], [`${pick(['√18', '√6', '√11'])} is rational.`, 0],
          [`${pick(['0.777...', '0.4545...'])} is irrational.`, 0], [`${pick(['-9', '2/7'])} is irrational.`, 0]]), right = S.find(s => s[1])[0];
        return { topic: 'REAL NUMBERS', text: 'Which statement is true?', ...textual(right, S.filter(s => !s[1]).map(s => s[0])),
          steps: ['Rational: a fraction of integers. Its decimal ends or repeats.', 'The square root of a perfect square is rational; of any other whole number, irrational.', `So: ${right}`] };
      }
      const inv = rand() < .4, right = pick(inv ? RAT : IRR);
      return { topic: 'REAL NUMBERS', text: `Which number is ${inv ? 'rational' : 'irrational'}?`, ...textual(right, sample(inv ? IRR : RAT, 4)),
        steps: ['Rational numbers can be written as a fraction of integers.', 'Their decimals end or repeat. √ of a perfect square is rational.', `${right} is ${inv ? 'rational' : 'irrational: its decimal never ends or repeats'}.`] };
    },

    // 8.NS.1
    repeatingDecimals: d => {
      const f = pick(d < 2 ? ['one'] : d < 3 ? ['one', 'two'] : ['one', 'two', 'mixed', 'delay']);
      let v, wr, sh, shown;
      if (f === 'one') { const a = randInt(1, 8); v = a / 9; shown = decStr(a, 9); wr = [a / 10, 11 * a / 100, a / 99, 1 / a]; sh = [`Let n = ${decStr(a, 9)}. Then 10n = ${a}.${String(a).repeat(3)}...`, `10n - n = ${a}, so 9n = ${a}`, `n = ${a}/9${fs(v) !== `${a}/9` ? ' = ' + fs(v) : ''}`]; }
      else if (f === 'two') { let ab = randInt(10, 98); if (ab % 11 === 0) ab++; v = ab / 99; shown = decStr(ab, 99); wr = [ab / 100, ab / 999, Math.floor(ab / 10) / (ab % 10 || 1), ab / 10]; sh = [`Two digits repeat, so use 100n.`, `100n - n = ${ab}, so 99n = ${ab}`, `n = ${ab}/99${fs(v) !== `${ab}/99` ? ' = ' + fs(v) : ''}`]; }
      else if (f === 'mixed') { const a = randInt(1, 8), w = randInt(1, 3); v = w + a / 9; shown = decStr(9 * w + a, 9); wr = [w + a / 10, w + a / 99, a / 9, w * a / 9]; sh = [`The part after the point, 0.${String(a).repeat(3)}..., is ${a}/9.`, `So it is ${w} and ${fs(a / 9)}.`, `= ${mixed(v)}`]; }
      else { const [p, q] = pick([[1, 6], [5, 6], [1, 12], [7, 12], [1, 15], [7, 30]]); v = p / q; const s = decStr(p, q); shown = s; wr = [Number(s.slice(0, 4)), Number(s.slice(0, 5)), (p + 1) / q, p / (q + 1)]; sh = [`${s} = ${p} ÷ ${q}`, `So it is ${fs(v)}.`]; }
      return { topic: 'REAL NUMBERS', text: `Which fraction equals ${shown}?`, ...nums(v, wr.filter(x => x > 0 && Math.abs(x - v) > 1e-9), f === 'mixed' ? mixed : fs, 1 / 9), steps: sh };
    },

    // 8.NS.2
    estimateRoots: d => {
      const f = pick(d < 2 ? ['between', 'nearest', 'line'] : d < 3 ? ['between', 'nearest', 'line'] : ['between', 'tenth', 'line', 'order']);
      const sq = new Set([...Array(15).keys()].map(k => k * k));
      let n = randInt(3, d < 2 ? 80 : 150); if (sq.has(n)) n++;
      const r = Math.sqrt(n), k = Math.floor(r);
      if (f === 'between') return { topic: 'SQUARE ROOTS', text: `√${n} is between which two whole numbers?`,
        ...textual(`${k} and ${k + 1}`, [`${k - 1} and ${k}`, `${k + 1} and ${k + 2}`, `${Math.floor(n / 2)} and ${Math.floor(n / 2) + 1}`, `${n - 1} and ${n + 1}`]),
        steps: [`${k}^2 = ${k * k} and ${k + 1}^2 = ${(k + 1) * (k + 1)}`, `${n} is between ${k * k} and ${(k + 1) * (k + 1)},`, `so √${n} is between ${k} and ${k + 1}.`] };
      if (f === 'nearest') { const a = Math.round(r), o = a === k ? k + 1 : k; return { topic: 'SQUARE ROOTS', text: `What is √${n} to the nearest whole number?`, ...nums(a, [o, Math.round(n / 2), a + 2].filter(v => v !== a)),
        steps: [`${k}^2 = ${k * k} and ${k + 1}^2 = ${(k + 1) ** 2}`, `${n} is closer to ${a * a}.`, `So √${n} is about ${a}`] }; }
      if (f === 'tenth') { const a = round(r, 1); return { topic: 'SQUARE ROOTS', text: `What is √${n} to the nearest tenth?`, ...nums(a, [round(a + .1, 1), round(a - .1, 1), round(n / 2, 1), round(k + (n - k * k) / 10, 1)].filter(v => Math.abs(v - a) > 1e-9), num, .1),
        steps: [`√${n} is between ${k} and ${k + 1}.`, `${num(a)}^2 = ${num(a * a, 2)}, which is the closest to ${n}.`, `So √${n} is about ${num(a)}`] }; }
      if (f === 'order') {
        const c = randInt(2, 6), vals = shuffle([[`√${c * c + 1}`, Math.sqrt(c * c + 1)], [`${c}.2`, c + .2], [`${3 * c + 1}/3`, (3 * c + 1) / 3], [`√${c * c + 2 * c - 1}`, Math.sqrt(c * c + 2 * c - 1)]]);
        if (c === 3) vals[0] = ['π', Math.PI];
        const up = vals.slice().sort((a, b) => a[1] - b[1]), js = a => a.map(x => x[0]).join(', ');
        return { topic: 'REAL NUMBERS', text: 'Which list is in order from least to greatest?', ...textual(js(up), [js(up.slice().reverse()), js([up[1], up[0], up[2], up[3]]), js([up[0], up[2], up[1], up[3]]), js([up[0], up[1], up[3], up[2]])]),
          steps: ['Write each as a decimal (rounded):', up.map(x => `${x[0]} = ${num(x[1], 2)}`).join(',  '), `In order: ${js(up)}`] };
      }
      let m = randInt(3, 95); if (sq.has(m)) m++;
      const t = Math.sqrt(m), cand = [t + 1.1, t - 1.1, m / 10, t + 2.2, t - 2.3, m / 2].filter(x => x > .4 && x < 9.6);
      const pts = [t]; for (const x of shuffle(cand)) if (pts.length < 4 && pts.every(p => Math.abs(p - x) > .8)) pts.push(x);
      void 0;
      for (let x = .5; pts.length < 4 && x < 9.6; x += .9) if (pts.every(p => Math.abs(p - x) > .8)) pts.push(x);
      pts.sort((a, b) => a - b);
      const ans = 'Point ' + 'PQRS'[pts.indexOf(t)];
      return { topic: 'SQUARE ROOTS', text: `Which point is closest to √${m} on the number line?`, ...fixed(['Point P', 'Point Q', 'Point R', 'Point S'], ans),
        steps: [`${Math.floor(t)}^2 = ${Math.floor(t) ** 2} and ${Math.floor(t) + 1}^2 = ${(Math.floor(t) + 1) ** 2}`, `So √${m} is a bit more than ${Math.floor(t)}: about ${num(t, 1)}.`, `That is ${ans.toLowerCase()}.`],
        size: [168, 28], fig: (c, w) => { const X = nline(c, w, 14, 0, 10); pts.forEach((p, i) => { F.dot(c, [X(p), 14], i % 2 ? BLU : HOT); L(c, 'PQRS'[i], X(p), 6, i % 2 ? BLU : HOT); }); } };
    },

    // 8.EE.1
    exponentRules: d => {
      const b = pick(d < 2 ? ['2', '3', '5', '7', '4'] : ['2', '3', '5', '7', 'x', 'a', 'n', 'y']), f = pick(d < 2 ? ['mul', 'div', 'pow'] : ['mul', 'div', 'pow', 'neg', 'neg']);
      const m = randInt(2, 9), n = randInt(2, 6);
      let q, E, wr, st;
      if (f === 'mul') { q = `${pw(b, m)} · ${pw(b, n)}`; E = m + n; wr = [m * n, m - n, Math.abs(m - n) + 1]; st = ['Same base, multiplying: ADD the exponents.', `${m} + ${n} = ${m + n}`]; }
      else if (f === 'div') { const M = m + n; q = `${pw(b, M)} ÷ ${pw(b, n)}`; E = m; wr = [M + n, M * n, M / n]; st = ['Same base, dividing: SUBTRACT the exponents.', `${M} - ${n} = ${m}`]; }
      else if (f === 'pow') { q = `(${pw(b, m)})${sup(n)}`; E = m * n; wr = [m + n, m ** 2, m * n + 1]; st = ['A power of a power: MULTIPLY the exponents.', `${m} × ${n} = ${m * n}`]; }
      else { const p = randInt(2, 7), r = -randInt(2, 9), g = pick(['mul', 'pow']); if (g === 'mul') { q = `${pw(b, p)} · ${pw(b, r)}`; E = p + r; wr = [p * r, p - r, -(p + r)]; st = ['Add the exponents.', `${p} + (${r}) = ${p + r}`]; } else { q = `(${pw(b, r)})${sup(p % 4 + 2)}`; E = r * (p % 4 + 2); wr = [r + p % 4 + 2, -E, r - (p % 4 + 2)]; st = ['Multiply the exponents.', `${r} × ${p % 4 + 2} = ${E}`]; } }
      const right = pw(b, E), choices = [...new Set(wr.filter(Number.isInteger).map(e => pw(b, e)))].filter(s => s !== right);
      if (/\d/.test(b) && f === 'mul') choices.push(pw(Number(b) * Number(b), E));
      choices.push(pw(b, E + 1), pw(b, E - 1), pw(b, E + 2), pw(b, 2 * E + 1));
      return { topic: 'EXPONENTS', text: `Which is equal to ${q}?`, ...textual(right, choices), steps: [...st, `= ${right}`] };
    },

    // 8.EE.1
    exponentValues: d => {
      const f = pick(d < 2 ? ['neg', 'zero', 'negbase'] : ['neg', 'zero', 'quot', 'negbase', 'combo']);
      if (f === 'neg') { const b = randInt(2, 5), e = randInt(1, b < 4 ? 4 : 3), v = 1 / b ** e; return { topic: 'EXPONENTS', text: `What is ${pw(b, -e)}?`, ...nums(v, [-(b ** e), -(b * e), 1 / (b * e), b ** e], fs, v),
        steps: ['A negative exponent means 1 over the positive power.', `${pw(b, -e)} = 1/${pw(b, e)} = 1/${b ** e}`, 'It is positive and small, not negative.'] }; }
      if (f === 'zero') { const inner = pick([String(randInt(2, 99)), String(-randInt(2, 9)), `${randInt(1, 5)}/${randInt(6, 9)}`, `${randInt(2, 9)}x`]), B = /^\d+$/.test(inner) ? inner : `(${inner})`;
        return { topic: 'EXPONENTS', text: `What is ${B}^0?${inner.includes('x') ? ' (x is not 0.)' : ''}`, ...fixed(['-1', '0', '1', inner], '1'),
          steps: ['Any nonzero number to the 0 power is 1.', `${B}^0 = 1`] }; }
      if (f === 'quot') { const b = randInt(2, 4), m = randInt(1, 4), n = m + randInt(1, 3), v = 1 / b ** (n - m); return { topic: 'EXPONENTS', text: `What is ${pw(b, m)} ÷ ${pw(b, n)}?`, ...nums(v, [b ** (n - m), -(b ** (n - m)), 1 / b ** (m + n), b ** (m - n) * -1], fs, v),
        steps: [`Subtract the exponents: ${m} - ${n} = ${m - n}`, `${pw(b, m - n)} = 1/${pw(b, n - m)}`, `= ${fs(v)}`] }; }
      if (f === 'negbase') { const b = randInt(2, 5), e = pick([2, 3, 4]), paren = rand() < .5, v = paren ? (-b) ** e : -(b ** e);
        return { topic: 'EXPONENTS', text: `What is ${paren ? `(-${b})` : `-${b}`}${sup(e)}?`, ...nums(v, [-v, b * e * (v < 0 ? -1 : 1), -b * e], num),
          steps: paren ? [`(-${b})${sup(e)} multiplies -${b} by itself ${e} times.`, `${e % 2 ? 'Odd' : 'Even'} number of negatives: ${v < 0 ? 'negative' : 'positive'}.`, `= ${v}`] : [`-${b}${sup(e)} means -(${b}${sup(e)}): the exponent goes with ${b} only.`, `${b}${sup(e)} = ${b ** e}, so the answer is ${v}.`] }; }
      const b = pick([2, 3]), p = randInt(1, 4), q = -randInt(p + 1, p + 3), v = b ** (p + q);
      return { topic: 'EXPONENTS', text: `What is ${pw(b, p)} · ${pw(b, q)}?`, ...nums(v, [b ** -(p + q), -(b ** -(p + q)), b ** (p * q), 1 / b ** (p - q)], fs, v),
        steps: [`Add the exponents: ${p} + (${q}) = ${p + q}`, `${pw(b, p + q)} = 1/${b ** -(p + q)}`] };
    },

    // 8.EE.2
    roots: d => {
      const f = pick(d < 2 ? ['sq', 'cube', 'area'] : ['sq', 'cube', 'solve2', 'solve3', 'area']);
      const k = randInt(2, d < 2 ? 12 : 15);
      if (f === 'sq') return { topic: 'ROOTS', text: `What is √${k * k}?`, ...nums(k, [k * k / 2, k + 1, 2 * k, k - 1].filter(v => Number.isInteger(v) && v !== k)), steps: [`Which number times itself is ${k * k}?`, `${k} × ${k} = ${k * k}, so √${k * k} = ${k}`] };
      const c = randInt(2, d < 2 ? 5 : 10), C3 = c ** 3;
      if (f === 'cube') return { topic: 'ROOTS', text: `What is the cube root of ${num(C3)}?`, ...nums(c, [C3 / 3, c * c, Math.round(Math.sqrt(C3)), c + 1].filter(v => Number.isInteger(v) && v !== c)), steps: [`Which number times itself 3 times is ${num(C3)}?`, `${c} × ${c} × ${c} = ${num(C3)}, so it is ${c}.`] };
      if (f === 'solve2') return { topic: 'ROOTS', text: `Solve: x^2 = ${k * k}`, ...textual(`x = ${k} or x = -${k}`, [`x = ${k} only`, `x = ${k * k / 2}`, `x = -${k} only`, `x = ${k * k * k * k}`]),
        steps: [`Both ${k} × ${k} and (-${k}) × (-${k}) are ${k * k}.`, `So x = ${k} or x = -${k}.`] };
      if (f === 'solve3') { const neg = rand() < .4, v = neg ? -C3 : C3, ans = neg ? -c : c; return { topic: 'ROOTS', text: `Solve: x^3 = ${num(v)}`, ...textual(`x = ${ans}`, [`x = ${c} or x = -${c}`, `x = ${neg ? c : -c}`, `x = ${num(v / 3)}`, `x = ${neg ? -c * c : c * c}`]),
        steps: [`Take the cube root of both sides.`, `${ans} × ${ans} × ${ans} = ${num(v)}`, `x = ${ans} (a cube root has just one answer).`] }; }
      const cube = rand() < .4;
      return cube ? { topic: 'ROOTS', text: `A cube has a volume of ${num(C3)} cubic inches. How long is each edge?`, ...nums(c, [C3 / 3, C3 / 6, c * c, Math.round(Math.sqrt(C3))].filter(v => Number.isInteger(v) && v !== c)), steps: ['V = s^3, so s is the cube root.', `${c}^3 = ${num(C3)}, so s = ${c} inches`] }
        : { topic: 'ROOTS', text: `A square garden has an area of ${k * k} square feet. How long is each side?`, ...nums(k, [k * k / 2, k * k / 4, k + 2].filter(v => Number.isInteger(v) && v !== k)), steps: ['A = s^2, so s is the square root.', `√${k * k} = ${k} feet`] };
    },

    // 8.EE.3, 8.EE.4
    scientificNotation: d => {
      const f = pick(d < 2 ? ['big', 'standard'] : ['big', 'small', 'standard', 'standard']);
      const m = pick([randInt(11, 99) / 10, randInt(2, 9), randInt(101, 999) / 100]);
      if (f === 'big') {
        const e = randInt(3, 9), v = m * 10 ** e, [S] = pick([[`Write ${num(v)} in scientific notation.`], [`A city has about ${num(v)} people. Which is this in scientific notation?`], [`A star is about ${num(v)} miles away. Which is this in scientific notation?`]]);
        return { topic: 'SCI NOTATION', text: S, ...textual(sci(m, e), [sci(m, e - 1), sci(m, e + 1), sci(m * 10, e - 1), sci(m, -e)]),
          steps: [`Move the decimal point to just after the first digit: ${num(m)}`, `It moved ${e} places left, so the power is 10${sup(e)}.`, `= ${sci(m, e)}`] };
      }
      if (f === 'small') {
        const e = -randInt(2, 6), v = m * 10 ** e;
        return { topic: 'SCI NOTATION', text: `Write ${std(v)} in scientific notation.`, ...textual(sci(m, e), [sci(m, e + 1), sci(m, -e), sci(m * 10, e - 1), sci(m, e - 1)]),
          steps: [`Move the decimal point right to just after the first nonzero digit: ${num(m)}`, `It moved ${-e} places right, so the power is 10${sup(e)}.`, `= ${sci(m, e)}`] };
      }
      const e = d < 3 ? randInt(2, 7) : pick([randInt(2, 7), -randInt(2, 5)]), v = m * 10 ** e;
      return { topic: 'SCI NOTATION', text: `What is ${sci(m, e)} in standard form?`, ...textual(std(v), [std(v * 10), std(v / 10), std(m * 10 ** -e), std(m * 10 ** (e + 2))]),
        steps: [e > 0 ? `10${sup(e)}: move the decimal point ${e} places right.` : `10${sup(e)}: move the decimal point ${-e} places left.`, `${num(m)} → ${std(v)}`] };
    },

    // 8.EE.3
    sciCompare: d => {
      const f = pick(d < 3 ? ['times', 'estimate'] : ['times', 'estimate', 'greatest']);
      if (f === 'times') {
        const b = randInt(1, 4), q = randInt(2, 9 / b | 0) || 2, a = b * q, P = randInt(5, 12), Q = randInt(2, P - 2);
        const [S] = pick([[`About how many times greater is ${sci(a, P)} than ${sci(b, Q)}?`], [`A galaxy has about ${sci(a, P)} stars and a star cluster about ${sci(b, Q)}. About how many times as many stars does the galaxy have?`]]);
        const right = sci(q, P - Q);
        return { topic: 'SCI NOTATION', text: S, ...textual(right, [sci(q, P + Q), sci(a - b, P - Q), sci(q, Q - P), sci(a * b, P - Q), sci(q, P - Q + 1)].filter(s => s !== right)),
          steps: ['Divide the numbers and subtract the exponents.', `${a} ÷ ${b} = ${q} and ${P} - ${Q} = ${P - Q}`, `= ${right}`] };
      }
      if (f === 'estimate') {
        const e = randInt(5, 10), lead = randInt(1, 8), rest = randInt(55, 98), v = (lead + rest / 100) * 10 ** e, up = Math.round(lead + rest / 100);
        return { topic: 'SCI NOTATION', text: `Estimate ${num(v)} as a single digit times a power of 10.`,
          ...textual(up === 10 ? `1 × 10${sup(e + 1)}` : `${up} × 10${sup(e)}`, [`${lead} × 10${sup(e)}`, `${up} × 10${sup(e + 1)}`, `${up} × 10${sup(e - 1)}`, `${lead} × 10${sup(e - 1)}`]),
          steps: [`${num(v)} is about ${num(up * 10 ** e)}.`, `That is ${up} followed by ${e} zeros: ${up} × 10${sup(e)}.`] };
      }
      const P = randInt(4, 8), vals = shuffle([[randInt(11, 39) / 10, P + 1], [randInt(60, 99) / 10, P], [randInt(40, 99) / 10, P - 1], [randInt(11, 99) / 10, P - 2]]), best = vals[0][1] === P + 1 ? vals[0] : vals.find(v => v[1] === P + 1);
      return { topic: 'SCI NOTATION', text: 'Which number is greatest?', ...textual(sci(...best), vals.filter(v => v !== best).map(v => sci(...v))),
        steps: ['Compare the powers of 10 first.', `The biggest power is 10${sup(P + 1)}, so ${sci(...best)} is greatest,`, 'even though another has a bigger first number.'] };
    },

    // 8.EE.4
    sciOperations: d => {
      const f = pick(d < 2 ? ['mul', 'div'] : d < 3 ? ['mul', 'div', 'word'] : ['mul', 'div', 'add', 'word']);
      if (f === 'mul') {
        const a = randInt(2, d < 3 ? 4 : 9), b = randInt(2, d < 3 ? 2 : 9), p = randInt(2, 9), q = randInt(2, 9), [m, e] = toSci(a * b * 10 ** (p + q));
        const right = sci(m, e);
        return { topic: 'SCI NOTATION', text: `What is (${sci(a, p)}) × (${sci(b, q)})? Write it in scientific notation.`,
          ...textual(right, [sci(m, p * q), sci(a + b > 9 ? m : a + b, p + q), sci(m, e + 1), sci(m, e - 1), sci(a * b, p * q), sci(m, e + 2), sci(a + b, p * q)].filter(s => s !== right)),
          steps: [`Multiply the numbers: ${a} × ${b} = ${a * b}`, `Add the exponents: ${p} + ${q} = ${p + q}`, a * b >= 10 ? `${a * b} × 10${sup(p + q)} = ${right}` : `= ${right}`] };
      }
      if (f === 'div') {
        const b = randInt(2, 4), q0 = randInt(2, 9 / b | 0), a = b * q0, p = randInt(6, 12), q = randInt(2, p - 1), right = sci(q0, p - q);
        return { topic: 'SCI NOTATION', text: `What is (${sci(a, p)}) ÷ (${sci(b, q)})?`, ...textual(right, [sci(q0, p + q), sci(a - b, p - q), sci(q0, q - p), sci(q0, p - q + 1)].filter(s => s !== right)),
          steps: [`Divide the numbers: ${a} ÷ ${b} = ${q0}`, `Subtract the exponents: ${p} - ${q} = ${p - q}`, `= ${right}`] };
      }
      if (f === 'add') {
        const a = randInt(11, 59) / 10, b = randInt(11, 39) / 10, p = randInt(3, 8), [m, e] = toSci((a + b) * 10 ** p), right = sci(m, e);
        return { topic: 'SCI NOTATION', text: `What is (${sci(a, p)}) + (${sci(b, p)})?`, ...textual(right, [sci(m, 2 * p), sci(round(a * b, 2), p), sci(m, e + 1), sci(round(a + b, 2), p - 1)].filter(s => s !== right)),
          steps: [`Same power of 10: add the numbers. ${num(a)} + ${num(b)} = ${num(a + b)}`, 'Keep the power: do not add the exponents.', `= ${right}`] };
      }
      const [S, a, p, b, q] = pick([['A hard drive holds', 2, 12, 4, 6], ['A server holds', 8, 12, 2, 6], ['A memory card holds', 6, 10, 3, 6]]);
      const [m, e] = toSci(a / b * 10 ** (p - q)), right = sci(m, e);
      return { topic: 'SCI NOTATION', text: `${S} ${sci(a, p)} bytes. Each photo is ${sci(b, q)} bytes. How many photos fit?`, ...textual(right, [sci(m, p + q), sci(a * b, p - q), sci(m, e + 1), sci(m, e - 1)].filter(s => s !== right)),
        steps: [`Divide: (${sci(a, p)}) ÷ (${sci(b, q)})`, `${a} ÷ ${b} = ${num(a / b)}, ${p} - ${q} = ${p - q}`, `= ${right}`] };
    },

    // 8.EE.5, 8.EE.6, 8.F.4
    slope: d => {
      const f = pick(d < 2 ? ['graph', 'points'] : ['graph', 'points', 'rate', 'similar']);
      if (f === 'graph' || f === 'points') {
        const dx = randInt(1, d < 3 ? 3 : 5) * pick([1, 1, -1]), dy = d < 2 ? dx * nz2(-3, 3) : nz2(-6, 6), m = dy / dx;
        const x1 = dx > 0 ? randInt(-5, 5 - dx) : randInt(-5 - dx, 5), y1 = clamp(randInt(-5, 5), -5 + Math.max(0, -dy), 5 - Math.max(0, dy)), x2 = x1 + dx, y2 = y1 + dy;
        const ok = Math.abs(x2) <= 6 && Math.abs(y2) <= 6;
        const fig = f === 'graph' && ok ? (c, w, h) => { const P = plane(c, w, h, 6); F.plot(c, P, x => y1 + m * (x - x1), [-6, 6], HOT); F.dot(c, P(x1, y1), RED); F.dot(c, P(x2, y2), RED); } : undefined;
        return { topic: 'SLOPE', text: f === 'graph' && ok ? 'What is the slope of the line? (The red points are on the grid.)' : `What is the slope of the line through ${pt(x1, y1)} and ${pt(x2, y2)}?`,
          ...nums(m, [dx / dy, -m, (y2 + y1) / (x2 + x1 || 1), dy].filter(v => Math.abs(v - m) > 1e-9), fs, .5),
          steps: ['slope = rise ÷ run = (change in y) ÷ (change in x)', `= (${y2} - ${par(y1)}) ÷ (${x2} - ${par(x1)}) = ${dy} ÷ ${dx}`, `= ${fs(m)}`], size: fig ? [100, 92] : undefined, fig };
      }
      if (f === 'rate') {
        const k = pick([1.5, 2.5, 3, 4, 5, 6, 7.5, 8]), a = Number.isInteger(k) ? randInt(2, 4) : 2, xm = 6, ym = Math.ceil(k * xm / 10) * 10;
        return { topic: 'SLOPE', text: `The graph shows the miles a cyclist rides over time. What is her speed in miles per hour (the slope)?`, ...nums(k, [1 / k, k * a, a, k + 1].filter(v => Math.abs(v - k) > 1e-9), num, .5),
          steps: ['The slope of a distance-time graph is the speed.', `${num(k * a)} miles ÷ ${a} hours`, `= ${num(k)} miles per hour`],
          size: [92, 64], fig: (c, w, h) => { const P = quad1(c, w, h, xm, ym, { xs: 1, ys: ym / 5, yl: ym, left: 14 }), q = P(a, k * a); F.line(c, ...P(0, 0), ...P(xm, k * xm), HOT); F.dot(c, q, RED); L(c, pt(a, num(k * a)), q[0] - 4, q[1] - 1, INK, 'right'); } };
      }
      const r = randInt(1, 4), u = r + randInt(1, 3), k = randInt(2, 4);
      return { topic: 'SLOPE', text: `On a line, a slope triangle has a rise of ${r} and a run of ${u}. A bigger slope triangle on the same line has a run of ${u * k}. What is its rise?`,
        ...nums(r * k, [r + u * k - u, u * k, r * k + 1].filter(v => v !== r * k)), steps: ['All slope triangles on one line are similar: same slope.', `${r}/${u} = rise/${u * k}`, `rise = ${r} × ${k} = ${r * k}`] };
    },

    // 8.EE.5, 8.F.2
    compareRates: d => {
      const kA = randInt(2, 8), kB0 = kA + pick([-2, -1, 1, 2, 3]) * (d >= 3 ? .5 : 1), kB = kB0 > 0 ? kB0 : kA + 1, a = randInt(2, 4), xm = 6, ym = Math.ceil(kA * xm / 10) * 10;
      const fig = (c, w, h) => { const P = quad1(c, w, h, xm, ym, { xs: 1, ys: ym / 5, yl: ym, left: 14 }), q = P(a, kA * a); F.line(c, ...P(0, 0), ...P(xm, kA * xm), HOT); F.dot(c, q, RED); L(c, pt(a, kA * a), q[0] - 4, q[1] - 1, INK, 'right'); };
      const text0 = `Robot X's distance in feet is graphed over seconds. Robot Y goes d = ${num(kB)}t.`;
      if (d < 2 || rand() < .5) return { topic: 'RATES', text: `${text0} Which robot is faster?`, ...fixed(['Robot X', 'Robot Y', 'They are the same', 'You cannot tell'], kA > kB ? 'Robot X' : 'Robot Y'),
        steps: [`Robot X: ${kA * a} ÷ ${a} = ${kA} feet per second.`, `Robot Y: ${num(kB)} feet per second (the number times t).`, `Robot ${kA > kB ? 'X' : 'Y'} is faster.`], size: [92, 64], fig };
      return { topic: 'RATES', text: `${text0} How much faster is the faster robot, in feet per second?`, ...nums(Math.abs(kA - kB), [kA * a - kB, kA + kB, Math.abs(kA * a - kB * a)].filter(v => v > 0 && Math.abs(v - Math.abs(kA - kB)) > 1e-9), num, .5),
        steps: [`Robot X: ${kA * a} ÷ ${a} = ${kA} feet per second.`, `Robot Y: ${num(kB)} feet per second.`, `Difference: ${num(Math.abs(kA - kB))}`], size: [92, 64], fig };
    },

    // 8.EE.6, 8.F.3, 8.F.4
    lineEquations: d => {
      const f = pick(d < 2 ? ['slopeInt', 'onLine', 'graph'] : ['twoPoints', 'onLine', 'graph', 'intercept']);
      const m = d < 3 ? nz2(-4, 4) : pick([nz2(-4, 4), .5, -.5, 2 / 3, -2 / 3, 1.5]), b = randInt(-5, 5), right = yeq(m, b);
      const wr = [Number.isInteger(m) ? yeq(b || 1, m) : yeq(m, b - 2), yeq(m, -b), yeq(-m, b), yeq(1 / m, b), yeq(m, b + 1), yeq(-m, -b), yeq(m + 1, b), yeq(2 * m, b - 1)].filter(s => s !== right);
      if (f === 'slopeInt') return { topic: 'LINES', text: `Which equation is a line with slope ${fs(m)} and y-intercept ${b}?`, ...textual(right, wr), steps: ['Slope-intercept form: y = mx + b.', `m = ${fs(m)}, b = ${b}`, `So ${right}`] };
      if (f === 'twoPoints') {
        const x1 = (Number.isInteger(m) ? 1 : m * 2 % 1 === 0 ? 2 : 3) * randInt(1, 2), x2 = x1 * 2, P1 = [x1, m * x1 + b], P2 = [x2, m * x2 + b];
        return { topic: 'LINES', text: `A line passes through ${pt(...P1)} and ${pt(...P2)}. Which equation describes it?`, ...textual(right, wr),
          steps: [`Slope: (${P2[1]} - ${par(P1[1])}) ÷ (${x2} - ${x1}) = ${fs(m)}`, `Use ${pt(...P1)}: ${P1[1]} = ${fs(m)}(${x1}) + b, so b = ${b}`, `${right}`] };
      }
      if (f === 'intercept') {
        const x1 = randInt(1, 4) * (Number.isInteger(m) ? 1 : 6), y1 = m * x1 + b;
        return { topic: 'LINES', text: `A line has slope ${fs(m)} and passes through ${pt(x1, y1)}. What is its y-intercept?`, ...nums(b, [y1 - x1, y1 + m * x1, y1, -b].filter(v => Math.abs(v - b) > 1e-9), num),
          steps: [`y = mx + b: ${y1} = ${fs(m)}(${x1}) + b`, `${y1} = ${num(m * x1)} + b`, `b = ${b}`] };
      }
      if (f === 'onLine') {
        const xs = shuffle([-2, -1, 1, 2, 3]).slice(0, 4), mi = Number.isInteger(m) ? m : 2, yy = x => mi * x + b, R = pt(xs[0], yy(xs[0]));
        const off = [[xs[1], yy(xs[1]) + 1], [yy(xs[2]), xs[2]], [xs[3], yy(xs[3]) - 2], [xs[0], -yy(xs[0])], [xs[2], yy(xs[2]) + 3], [-xs[1], yy(xs[1])]].filter(([p, q]) => q !== yy(p)).map(p => pt(...p));
        return { topic: 'LINES', text: `Which point is on the line ${yeq(mi, b)}?`, ...textual(R, off),
          steps: ['Put the x into the equation and see if you get the y.', `x = ${xs[0]}: y = ${mi}(${xs[0]}) ${signed(b)} = ${yy(xs[0])}`, `So ${R} is on the line.`] };
      }
      const mm = Number.isInteger(m) ? m : (m > 0 ? 1 / 2 : -1 / 2);
      return { topic: 'LINES', text: 'Which equation describes the line in the graph?', ...textual(yeq(mm, b), [Number.isInteger(mm) ? yeq(b || 2, mm) : yeq(mm, b - 2), yeq(mm, -b), yeq(-mm, b), yeq(1 / mm, b), yeq(mm, b + 1), yeq(mm + 1, b)].filter(s => s !== yeq(mm, b))),
        steps: [`It crosses the y-axis at ${b}: b = ${b}.`, `Count rise over run: slope ${fs(mm)}.`, `${yeq(mm, b)}`], size: [100, 92],
        fig: (c, w, h) => { const P = plane(c, w, h, 6); F.plot(c, P, x => mm * x + b, [-6, 6], HOT); F.dot(c, P(0, b), RED); } };
    },

    // 8.EE.7b
    multiStepEquations: d => {
      const f = pick(d < 2 ? ['dist', 'both'] : d < 3 ? ['dist', 'both', 'distBoth'] : ['dist', 'both', 'distBoth', 'frac', 'dec']);
      const x = d < 2 ? randInt(1, 10) : nz2(-9, 10);
      if (f === 'dist') {
        const a = randInt(2, 6), b = nz2(-8, 8), c0 = nz2(-4, 5), c = a + c0 === 0 ? c0 + 1 : c0, D = a * (x + b) + c * x, k = a + c;
        return { topic: 'EQUATIONS', text: `Solve: ${a}(x ${signed(b)}) ${c < 0 ? '- ' + term(-c) : '+ ' + term(c)} = ${D}`, ...nums(x, [(D - b) / k, (D + a * b) / k, (D - a * b) / a, -x].filter(v => Number.isInteger(v) && v !== x)),
          steps: [`Distribute: ${lin(a, a * b)} ${c < 0 ? '- ' + term(-c) : '+ ' + term(c)} = ${D}`, `Combine: ${lin(k, a * b)} = ${D}`, `${term(k)} = ${D - a * b}, x = ${x}`] };
      }
      if (f === 'both') {
        const c = randInt(1, 6), a0 = c + nz2(-3, 4), a = a0 <= 0 ? c + randInt(1, 3) : a0, b = nz2(-12, 12), e = (a - c) * x + b;
        return { topic: 'EQUATIONS', text: `Solve: ${lin(a, b)} = ${lin(c, e)}`, ...nums(x, [(e - b) / (a + c), (e + b) / (a - c), e - b, -x].filter(v => Number.isInteger(v) && v !== x)),
          steps: [`Get x on one side: subtract ${term(c)}`, `${lin(a - c, b)} = ${e}`, a - c === 1 ? `x = ${e} ${signed(-b)} = ${x}` : `${term(a - c)} = ${e - b}, so x = ${x}`] };
      }
      if (f === 'distBoth') {
        const a = randInt(2, 6), c0 = randInt(1, 5), c = c0 === a ? a + 1 : c0, k = a - c;
        let b = 1, e = 0;
        for (const bb of shuffle([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6])) { const ee = (a * (x + bb) - c * x) / c; if (Number.isInteger(ee) && ee !== 0) { b = bb; e = ee; break; } }
        if (!e) return g8.multiStepEquations(1);
        return { topic: 'EQUATIONS', text: `Solve: ${a}(x ${signed(b)}) = ${c}(x ${signed(e)})`, ...nums(x, [-x, (c * e - b) / k, (e - b) / k, x + 2].filter(v => Number.isInteger(v) && v !== x)),
          steps: [`Distribute: ${lin(a, a * b)} = ${lin(c, c * e)}`, `${term(k)} = ${c * e - a * b}`, `x = ${x}`] };
      }
      if (f === 'frac') {
        const k = randInt(2, 4), r0 = nz2(-5, 5), r = x * (k - 1) - k * r0 === 0 ? (r0 === -1 ? 1 : r0 + 1) : r0, q = x * (k - 1) - k * r;
        return { topic: 'EQUATIONS', text: `Solve: (x ${signed(q)})/${k} = x ${signed(-r)}`, ...nums(x, [(q + r) / (k - 1), -x, q - k * r, (q - r) / (k + 1)].filter(v => Number.isInteger(v) && v !== x)),
          steps: [`Multiply both sides by ${k}: x ${signed(q)} = ${lin(k, -k * r)}`, `${q + k * r} = ${term(k - 1)}`, `x = ${x}`] };
      }
      const a = randInt(3, 9) / 10, c0 = randInt(1, 9) / 10, c = Math.abs(c0 - a) < 1e-9 ? round(a - .2, 1) : c0, b = randInt(1, 30) / 10, e = round((a - c) * x + b, 3);
      return { topic: 'EQUATIONS', text: `Solve: ${term(a)} ${signed(b)} = ${term(c)} ${signed(e)}`, ...nums(x, [round((e + b) / (a - c), 3), round((e - b) / (a + c), 3), -x, x * 10].filter(v => Math.abs(v - x) > 1e-9 && Math.abs(round(v, 1) - v) < 1e-9)),
        steps: [`Multiply everything by 10: ${lin(round(a * 10), round(b * 10))} = ${lin(round(c * 10), round(e * 10))}`, `${term(round((a - c) * 10))} = ${round((e - b) * 10)}`, `x = ${x}`] };
    },

    // 8.EE.7a
    numberOfSolutions: d => {
      const type = pick(['none', 'one', 'inf']), a = randInt(2, 6), b = nz2(-7, 7), f = pick(d < 2 ? ['how'] : d < 3 ? ['how', 'which'] : ['how', 'which', 'value']);
      const eqOf = t => {
        if (t === 'none') { const c = a * b + nz2(-5, 5); return `${a}(x ${signed(b)}) = ${lin(a, c)}`; }
        if (t === 'inf') return pick([`${a}(x ${signed(b)}) = ${lin(a, a * b)}`, `${lin(a, b)} + x = ${lin(a + 1, b)}`]);
        const c = a + nz2(-2, 3); return `${lin(a, b)} = ${lin(c === a ? a + 1 : c, b + randInt(1, 6))}`;
      };
      const NAME = { none: 'no solution', one: 'exactly one', inf: 'infinitely many' };
      if (f === 'how') { const e = eqOf(type); return { topic: 'EQUATIONS', text: `How many solutions does ${e} have?`, ...fixed(['no solution', 'exactly one', 'exactly two', 'infinitely many'], NAME[type]),
        steps: ['Simplify both sides.', type === 'none' ? 'Same x terms, different numbers: it can never be true.' : type === 'inf' ? 'Both sides are exactly the same: every x works.' : 'Different x terms: you can solve for one x.', `So: ${NAME[type]}.`] }; }
      if (f === 'which') { const want = pick(['none', 'inf']), others = ['none', 'one', 'inf'].filter(t => t !== want), right = eqOf(want), wr = new Set();
        for (let t = 0; t < 16 && wr.size < 4; t++) { const e = eqOf(others[t % 2]); if (e !== right) wr.add(e); }
        return { topic: 'EQUATIONS', text: `Which equation has ${NAME[want] === 'no solution' ? 'no solution' : 'infinitely many solutions'}?`, ...textual(right, [...wr]),
          steps: ['Distribute and simplify each side.', want === 'none' ? 'No solution: same x terms but different numbers.' : 'Infinitely many: both sides match exactly.'] }; }
      const c = a * b;
      return { topic: 'EQUATIONS', text: `For what value of k does ${a}(x ${signed(b)}) = ${a}x + k have infinitely many solutions?`, ...nums(c, [b, a + b, -c, a].filter(v => v !== c)),
        steps: [`${a}(x ${signed(b)}) = ${lin(a, a * b)}`, `The sides match when k = ${c}.`] };
    },

    // 8.EE.8a
    systemGraphs: d => {
      let x0 = nz2(-3, 3), y0 = nz2(-3, 3); if (x0 === y0) y0 = -y0;
      const m1 = nz2(-2, 2), m2b = nz2(-2, 2), m2 = m2b === m1 ? -m1 : m2b, parallel = d >= 2 && rand() < .3;
      if (parallel) { const b1 = randInt(-3, 0), b2 = b1 + randInt(2, 4);
        return { topic: 'SYSTEMS', text: 'How many solutions does the system of equations graphed here have?', ...fixed(['no solution', 'exactly one', 'exactly two', 'infinitely many'], 'no solution'),
          steps: ['The solution is where the lines cross.', 'These lines are parallel: they never cross.', 'So there is no solution.'], size: [100, 92],
          fig: (c, w, h) => { const P = plane(c, w, h, 6); F.plot(c, P, x => m1 * x + b1, [-6, 6], HOT); F.plot(c, P, x => m1 * x + b2, [-6, 6], BLU); } }; }
      return { topic: 'SYSTEMS', text: 'The graph shows two lines. What is the solution of the system?', ...textual(pt(x0, y0), [pt(y0, x0), pt(-x0, y0), pt(x0, -y0), pt(0, y0 - m1 * x0), pt(x0 + 1, y0)]),
        steps: ['The solution is the point where the lines cross.', `They cross at x = ${x0}, y = ${y0}.`, `So the solution is ${pt(x0, y0)}.`], size: [100, 92],
        fig: (c, w, h) => { const P = plane(c, w, h, 6); F.plot(c, P, t => y0 + m1 * (t - x0), [-6, 6], HOT); F.plot(c, P, t => y0 + m2 * (t - x0), [-6, 6], BLU); F.dot(c, P(x0, y0), RED); } };
    },

    // 8.EE.8b
    systemsAlgebra: d => {
      let x = nz2(-6, 8), y = nz2(-6, 8); if (x === y) y = x + 2;
      const f = pick(d < 2 ? ['sub', 'elim'] : d < 3 ? ['sub', 'elim', 'count'] : ['sub', 'elim', 'elim2', 'count']), wr = [pt(y, x), pt(-x, y), pt(x, -y), pt(x + 1, y - 1)];
      if (f === 'sub') { const m1 = nz2(-3, 3), m2 = m1 === 2 ? -1 : (m1 + randInt(1, 2) * pick([1, -1])) || 2, b1 = y - m1 * x, b2 = y - m2 * x;
        return { topic: 'SYSTEMS', text: `Solve the system: ${yeq(m1, b1)} and ${yeq(m2, b2)}`, ...textual(pt(x, y), wr),
          steps: [`Set them equal: ${lin(m1, b1)} = ${lin(m2, b2)}`, `${term(m1 - m2)} = ${b2 - b1}, so x = ${x}`, `y = ${m1}(${x}) ${signed(b1)} = ${y}`] }; }
      if (f === 'elim') return { topic: 'SYSTEMS', text: `Solve the system: x + y = ${x + y} and x - y = ${x - y}`, ...textual(pt(x, y), wr),
        steps: [`Add the equations: 2x = ${2 * x}, so x = ${x}`, `Then y = ${x + y} - ${par(x)} = ${y}`, `Solution: ${pt(x, y)}`] };
      if (f === 'elim2') { const a = randInt(2, 4), b = randInt(1, 3), c = randInt(1, 3);
        return { topic: 'SYSTEMS', text: `Solve the system: ${a}x + ${term(b, 'y')} = ${a * x + b * y} and ${term(c)} - ${term(b, 'y')} = ${c * x - b * y}`, ...textual(pt(x, y), wr),
          steps: [`Add them: the y terms cancel. ${a + c}x = ${(a + c) * x}`, `x = ${x}`, `Then ${b}y = ${a * x + b * y} - ${a * x}, so y = ${y}`] }; }
      const m = nz2(-3, 3), b = randInt(-5, 5), kind = pick(['none', 'inf', 'one']), NAME = { none: 'no solution', one: 'exactly one', inf: 'infinitely many' };
      const second = kind === 'none' ? yeq(m, b + randInt(1, 4)) : kind === 'inf' ? `2y = ${lin(2 * m, 2 * b)}` : yeq(m === 3 ? 1 : m + 1, b);
      return { topic: 'SYSTEMS', text: `How many solutions does this system have? ${yeq(m, b)} and ${second}`, ...fixed(['no solution', 'exactly one', 'exactly two', 'infinitely many'], NAME[kind]),
        steps: [kind === 'none' ? 'Same slope, different y-intercepts: parallel lines.' : kind === 'inf' ? 'Divide the second by 2: it is the same line.' : 'Different slopes: the lines cross once.', `So: ${NAME[kind]}.`] };
    },

    // 8.EE.8c
    systemsWord: d => {
      const f = pick(['plans', 'tickets', 'sumdiff', 'ages']);
      if (f === 'plans') { const a = randInt(2, 6), b = a + randInt(2, 6), n = randInt(4, 15), F0 = n * (b - a);
        return { topic: 'SYSTEMS', text: `Gym A charges $${F0} to join plus $${a} a visit. Gym B charges $${b} a visit and no fee. After how many visits do they cost the same?`,
          ...nums(n, [Math.round(F0 / b), Math.round(F0 / a), F0 / (a + b), n + 2].filter(v => Number.isInteger(v) && v !== n && v > 0)),
          steps: [`${F0} + ${a}v = ${b}v`, `${F0} = ${b - a}v`, `v = ${n} visits`] }; }
      if (f === 'tickets') { const pa = randInt(7, 12), pc = randInt(3, pa - 2), na = randInt(4, 20), nc = randInt(4, 20), N = na + nc, T0 = pa * na + pc * nc;
        return { topic: 'SYSTEMS', text: `A show sold ${N} tickets for $${num(T0)}. Adult tickets cost $${pa} and kid tickets $${pc}. How many adult tickets were sold?`,
          ...nums(na, [nc, Math.round(N / 2), Math.floor(T0 / pa), na + 1].filter(v => v !== na)),
          steps: [`a + k = ${N} and ${pa}a + ${pc}k = ${num(T0)}`, `${pa}a + ${pc}(${N} - a) = ${num(T0)}`, `${pa - pc}a = ${num(T0 - pc * N)}, so a = ${na}`] }; }
      if (f === 'sumdiff') { const big = randInt(10, 40), small = randInt(2, big - 2), S = big + small, D = big - small;
        return { topic: 'SYSTEMS', text: `Two numbers add up to ${S}. Their difference is ${D}. What is the larger number?`, ...nums(big, [small, S - D, S / 2, D].filter(v => Number.isInteger(v) && v !== big)),
          steps: [`x + y = ${S} and x - y = ${D}`, `Add: 2x = ${S + D}`, `x = ${big}`] }; }
      const k = randInt(2, 9), ben = randInt(5, 20), ana = ben + k, S = ana + ben, [A, B] = sample(NAMES, 2);
      return { topic: 'SYSTEMS', text: `${A} is ${k} years older than ${B}. Their ages add up to ${S}. How old is ${A}?`, ...nums(ana, [ben, S / 2, S - k, ana + k].filter(v => Number.isInteger(v) && v !== ana)),
        steps: [`a = b + ${k} and a + b = ${S}`, `(b + ${k}) + b = ${S}, so 2b = ${S - k}, b = ${ben}`, `${A}: ${ben} + ${k} = ${ana}`] };
    },

    // 8.F.1
    functions: d => {
      const f = pick(d < 2 ? ['pairs', 'eval', 'graph'] : ['pairs', 'table', 'graph', 'eval']);
      if (f === 'pairs') {
        const xs = sample([-3, -2, -1, 0, 1, 2, 3, 4, 5], 4), ys = () => xs.map(() => randInt(-5, 9)), S = (X, Y) => X.map((x, i) => pt(x, Y[i])).join(', ');
        const bad = () => { const X = xs.slice(); X[3] = X[randInt(0, 2)]; const Y = ys(); if (Y[3] === Y[X.indexOf(X[3])]) Y[3]++; return S(X, Y); };
        const Y0 = ys(); Y0[1] = Y0[0];
        return { topic: 'FUNCTIONS', text: 'Which set of ordered pairs is a function?', ...textual(S(xs, Y0), [bad(), bad(), bad(), bad()]),
          steps: ['A function gives each x exactly one y.', 'Look for an x that shows up twice with different y-values.', `${S(xs, Y0)} has no repeated x. (A repeated y is fine.)`] };
      }
      if (f === 'table') {
        const isF = rand() < .5, xs = sample([0, 1, 2, 3, 4, 5, 6], 5).sort((a, b) => a - b), ys = xs.map(() => randInt(1, 9));
        if (!isF) { xs[4] = xs[1]; if (ys[4] === ys[1]) ys[4] = ys[1] % 9 + 1; } else ys[3] = ys[0];
        const rx = xs[1];
        return { topic: 'FUNCTIONS', text: 'Is y a function of x in this table?',
          ...textual(isF ? 'Yes: each x has just one y' : `No: x = ${rx} has two y-values`, isF ? [`No: y = ${ys[0]} shows up twice`, 'No: the x-values skip numbers', 'No: the points are not on a line'] : ['Yes: each x has just one y', 'Yes: there are 5 pairs', 'Yes: every y is 9 or less']),
          steps: ['A function: every x goes with exactly one y.', isF ? 'No x repeats, so yes. (A repeated y is allowed.)' : `x = ${rx} goes with ${ys[1]} and ${ys[4]}: not a function.`],
          size: [130, 30], fig: (c, w, h) => table(c, w, h, [['x', ...xs], ['y', ...ys]], { first: 18, headCol: true, headRow: false }) };
      }
      if (f === 'graph') {
        const one = rand() < .5, F0 = ['line', 'parab', 'abs', 'cubic'], N0 = ['circle', 'sideways', 'vert', 'sideV'], pickK = one ? pick(F0) : pick(N0);
        const kinds = shuffle([pickK, ...sample(one ? N0 : F0, 3)]), ans = 'Graph ' + '1234'[kinds.indexOf(pickK)];
        return { topic: 'FUNCTIONS', text: `Which graph ${one ? 'shows' : 'does NOT show'} y as a function of x?`, ...fixed(['Graph 1', 'Graph 2', 'Graph 3', 'Graph 4'], ans),
          steps: ['Vertical line test: a function never has two points above each other.', one ? `Only ${ans.toLowerCase()} passes.` : `${ans} fails: a vertical line hits it twice.`], size: [168, 50], fig: (c, w, h) => miniGraphs(c, h, kinds) };
      }
      const a = nz2(-5, 6), b = nz2(-9, 9), k = nz2(-4, 5), v = a * k + b;
      return { topic: 'FUNCTIONS', text: `f(x) = ${lin(a, b)}. What is f(${k})?`, ...nums(v, [a * -k + b, a * k - b, a + k + b, a * k].filter(x => x !== v)), steps: [`Put ${k} in for x: ${a}(${k}) ${signed(b)}`, `= ${a * k} ${signed(b)} = ${v}`] };
    },

    // 8.F.4
    rateOfChange: d => {
      const m = d < 3 ? nz2(-4, 6) : pick([nz2(-4, 6), 1.5, 2.5, -1.5, .5]), b = randInt(-5, 10), s = d < 2 ? 1 : pick([1, 2, 3]), x0 = d < 2 ? 0 : randInt(0, 2);
      const xs = [0, 1, 2, 3].map(i => x0 + i * s), ys = xs.map(x => m * x + b), f = pick(d < 2 ? ['rate', 'eq'] : d < 3 ? ['rate', 'initial', 'eq'] : ['rate', 'initial', 'eq', 'story']);
      const fig = (c, w, h) => table(c, w, h, [['x', ...xs], ['y', ...ys.map(v => num(v))]], { first: 18, headCol: true, headRow: false });
      if (f === 'rate') return { topic: 'FUNCTIONS', text: 'The table shows a linear function. What is its rate of change?', ...nums(m, [m * s === m ? m + 1 : m * s, b, ys[0] / (xs[0] || 1), -m].filter(v => Math.abs(v - m) > 1e-9), num, .5),
        steps: ['Rate of change = change in y ÷ change in x', `(${num(ys[1])} - ${par(ys[0])}) ÷ (${xs[1]} - ${xs[0]}) = ${num(ys[1] - ys[0])} ÷ ${s}`, `= ${num(m)}`], size: [116, 30], fig };
      if (f === 'initial') return { topic: 'FUNCTIONS', text: 'The table shows a linear function. What is its initial value (y when x = 0)?', ...nums(b, [ys[0] === b ? b + m : ys[0], m, b - m, -b].filter(v => Math.abs(v - b) > 1e-9), num),
        steps: [`Rate of change: ${num(m)} for each 1 in x.`, x0 ? `Go back from x = ${xs[0]} to 0: ${num(ys[0])} - ${x0} × ${par(m)} = ${b}` : `At x = 0, y = ${b}.`, `Initial value: ${b}`], size: [116, 30], fig };
      if (f === 'eq') return { topic: 'FUNCTIONS', text: 'Which equation fits the table?', ...textual(yeq(m, b), [Number.isInteger(m) ? yeq(b || 1, m) : yeq(m, b - 2), yeq(m, -b), yeq(-m, b), yeq(m, b + 1), yeq(m * s, b), yeq(m + 1, b), yeq(m, b - 1)].filter(e => e !== yeq(m, b))),
        steps: [`Rate of change: ${num(m)}`, `Initial value (x = 0): ${b}`, yeq(m, b)], size: [116, 30], fig };
      const r = pick([1.5, 2, 2.5, .5, 3]), h0 = randInt(2, 12), [S, y, x] = pick([[`A plant is ${h0} cm tall and grows ${num(r)} cm each week.`, 'h', 'w'], [`A pool has ${h0 * 10} gallons and fills at ${num(r * 10)} gallons a minute.`, 'g', 'm']]);
      const k = S.startsWith('A pool') ? r * 10 : r, c0 = S.startsWith('A pool') ? h0 * 10 : h0, right = `${y} = ${num(k)}${x} + ${c0}`;
      return { topic: 'FUNCTIONS', text: `${S} Which equation gives ${y} after ${x} ${x === 'w' ? 'weeks' : 'minutes'}?`, ...textual(right, [`${y} = ${c0}${x} + ${num(k)}`, `${y} = ${num(k + c0)}${x}`, `${y} = ${num(k)}(${x} + ${c0})`, `${y} = ${num(k)}${x} - ${c0}`]),
        steps: [`The starting amount is the initial value: ${c0}.`, `The rate of change is ${num(k)} each ${x === 'w' ? 'week' : 'minute'}.`, right] };
    },

    // 8.F.2
    compareFunctions: d => {
      const mA = randInt(1, 6), bA = randInt(-4, 8), mB0 = mA + nz2(-2, 2), mB = mB0 === 0 ? mA + 2 : mB0, bB = bA + nz2(-5, 5);
      const xs = [0, 1, 2, 3], fig = (c, w, h) => table(c, w, h, [['x', ...xs], ['y', ...xs.map(x => mA * x + bA)]], { first: 18, headCol: true, headRow: false });
      const ask = pick(d < 3 ? ['rate', 'rate', 'init'] : ['rate', 'init', 'diff']);
      const intro = `Function f is in the table. Function g is ${yeq(mB, bB)}.`;
      if (ask === 'diff') return { topic: 'FUNCTIONS', text: `${intro} How much greater is the greater rate of change?`, ...nums(Math.abs(mA - mB), [Math.abs(bA - bB), mA + mB, Math.abs(mA * 3 + bA - mB)].filter(v => v !== Math.abs(mA - mB) && v > 0)),
        steps: [`f: y goes up ${mA} each time x goes up 1.`, `g: the slope is ${mB}.`, `Difference: ${Math.abs(mA - mB)}`], size: [100, 30], fig };
      const rate = ask === 'rate', a = rate ? mA : bA, bv = rate ? mB : bB, ans = a > bv ? 'Function f' : 'Function g';
      return { topic: 'FUNCTIONS', text: `${intro} Which has the greater ${rate ? 'rate of change' : 'initial value'}?`, ...fixed(['Function f', 'Function g', 'They are the same', 'You cannot tell'], ans),
        steps: rate ? [`f: from the table, y goes up ${mA} for each 1 in x.`, `g: slope ${mB}.`, `${ans} has the greater rate of change.`] : [`f: at x = 0, y = ${bA}.`, `g: the y-intercept is ${bB}.`, `${ans} has the greater initial value.`],
        size: [100, 30], fig };
    },

    // 8.F.3
    linearOrNot: d => {
      const a = randInt(2, 9), b = randInt(1, 9), f = pick(d < 2 ? ['eq'] : ['eq', 'table', 'context']);
      if (f === 'eq') {
        const LIN = [`y = ${a}x + ${b}`, `y = -${a}x`, `y = x/${a} + ${b}`, `${a}x + y = ${b}`, `y = ${b} - x`], NON = [`y = x^2 + ${b}`, `y = ${a}/x`, `y = ${a}x^2`, `y = 2^x`, `y = x^3`], inv = rand() < .5;
        const right = pick(inv ? LIN : NON);
        return { topic: 'FUNCTIONS', text: `Which equation is ${inv ? '' : 'NOT '}a linear function?`, ...textual(right, sample(inv ? NON : LIN, 4)),
          steps: ['A linear function can be written y = mx + b.', 'x squared, x cubed, x in an exponent or dividing by x are not linear.', `So: ${right}`] };
      }
      if (f === 'table') {
        const P = (g) => [1, 2, 3, 4].map(x => pt(x, g(x))).join(', ');
        return { topic: 'FUNCTIONS', text: 'Which set of points lies on a straight line?', ...textual(P(x => a * x + b), [P(x => x * x + b), P(x => 2 ** x), P(x => a * x + (x > 2 ? b + 1 : b)), P(x => x * x * a)]),
          steps: ['On a line, y changes by the same amount each step.', `${P(x => a * x + b)}: y goes up ${a} each time.`] };
      }
      const L0 = ['the perimeter of a square and its side length', 'the cost of apples at $2 a pound and the pounds bought', 'the distance a car goes at 50 mph and the time'];
      const N0 = ['the area of a square and its side length', 'money that doubles every year and the years', 'the height of a tossed ball and the time', 'the volume of a cube and its edge'];
      const inv = rand() < .5, right = pick(inv ? N0 : L0);
      return { topic: 'FUNCTIONS', text: `Which relationship is ${inv ? 'NOT ' : ''}linear?`, ...textual(right, sample(inv ? L0 : N0, 3)),
        steps: ['Linear: the same change each step, like adding a fixed amount.', 'Squares, cubes, doubling and tossed balls curve.', `So: ${right}.`] };
    },

    // 8.F.5
    graphStories: d => {
      const SL = [2, 1, 0, -1, -2];
      for (let t = 0; t < 60; t++) {
        const seg = [pick([2, 1]), pick(SL), pick(SL), pick(SL)];
        let y = 0; const ys = [0]; for (const s of seg) { y += s; ys.push(y); }
        if (Math.min(...ys) < 0) continue;
        const Q = [['decreasing', s => s < 0, 'getting closer to home'], ['stopped', s => s === 0, 'not moving'], ['fastest away from home', s => s === 2, 'the steepest climb']];
        const opts = Q.filter(([, test]) => seg.filter(test).length === 1 && (test !== Q[2][1] || seg.filter(s => s === 2).length === 1));
        if (!opts.length) continue;
        const [name, test, why] = pick(opts), i = seg.findIndex(test), top = Math.max(...ys, 1);
        const q = name === 'decreasing' ? 'During which part is the distance from home decreasing?' : name === 'stopped' ? 'During which part is the rider stopped?' : 'During which part is the rider moving away from home the fastest?';

        return { topic: 'GRAPHS', text: `The graph shows ${who()}'s distance from home during a bike ride. ${q}`, ...fixed(['part 1', 'part 2', 'part 3', 'part 4'], 'part ' + '1234'[i]),
          steps: [`${name === 'decreasing' ? 'Going down' : name === 'stopped' ? 'Flat' : 'Steepest going up'} means ${why}.`, `That is part ${'1234'[i]}.`],
          size: [120, 64], fig: (c, w, h) => {
            const x0 = 8, y0 = h - 6, sw = Math.floor((w - 14) / 4), sy = (h - 22) / top;
            F.line(c, x0, y0, w - 2, y0, DIM); F.line(c, x0, y0, x0, 2, DIM);
            for (let j = 0; j < 4; j++) { const p = [x0 + j * sw, Math.round(y0 - ys[j] * sy)], q2 = [x0 + (j + 1) * sw, Math.round(y0 - ys[j + 1] * sy)]; F.line(c, ...p, ...q2, HOT); F.dot(c, q2, INK); L(c, '1234'[j], (p[0] + q2[0]) / 2, Math.min(p[1], q2[1]) - 6, INK); }
          } };
      }
      return g8.functions(1);
    },

    // 8.G.3
    transformRules: d => {
      let x = nz2(-6, 6), y = nz2(-6, 6); if (Math.abs(x) === Math.abs(y)) y = y > 0 ? y - 1 || 2 : y + 1 || -2;
      const a = nz2(-5, 5), b = nz2(-5, 5), k = pick([2, 3]);
      const OPS = [[`translated ${Math.abs(a)} ${a > 0 ? 'right' : 'left'} and ${Math.abs(b)} ${b > 0 ? 'up' : 'down'}`, [x + a, y + b], `(x, y) → (x ${signed(a)}, y ${signed(b)})`],
        ['reflected across the x-axis', [x, -y], '(x, y) → (x, -y)'], ['reflected across the y-axis', [-x, y], '(x, y) → (-x, y)'],
        ['rotated 90° counterclockwise about the origin', [-y, x], '(x, y) → (-y, x)'], ['rotated 90° clockwise about the origin', [y, -x], '(x, y) → (y, -x)'],
        ['rotated 180° about the origin', [-x, -y], '(x, y) → (-x, -y)'], [`dilated by a scale factor of ${k} from the origin`, [k * x, k * y], `(x, y) → (${k}x, ${k}y)`]];
      const pool = d < 2 ? OPS.slice(0, 3) : d < 3 ? OPS.slice(0, 6) : OPS, [desc, img, rule] = pick(pool);
      if (d >= 2 && rand() < .3) {
        const [desc2, , rule2] = pick(pool.filter(o => o[0].startsWith('translated') || o[0].startsWith('reflected')));
        return { topic: 'TRANSFORMATIONS', text: `Which rule describes a point being ${desc2}?`, ...textual(rule2, OPS.map(o => o[2]).filter(r => r !== rule2).concat([`(x, y) → (x ${signed(b)}, y ${signed(a)})`, `(x, y) → (x ${signed(-a)}, y ${signed(-b)})`])),
          steps: ['Right/left changes x; up/down changes y.', 'Across the x-axis flips y; across the y-axis flips x.', `So: ${rule2}`] };
      }
      return { topic: 'TRANSFORMATIONS', text: `The point ${pt(x, y)} is ${desc}. Where does it land?`, ...textual(pt(...img), shuffle(OPS.map(o => pt(...o[1]))).concat([pt(y, x), pt(x - a, y - b)]).filter(s => s !== pt(...img))),
        steps: [`Rule: ${rule}`, `${pt(x, y)} → ${pt(...img)}`] };
    },

    // 8.G.1, 8.G.2, 8.G.4
    transformations: d => {
      const f = pick(d < 2 ? ['which', 'which', 'keep'] : ['which', 'keep', 'scale']);
      if (f === 'keep') {
        const dil = rand() < .5, t = dil ? `a dilation with scale factor ${pick([2, 3, '1/2'])}` : pick(['a rotation', 'a reflection', 'a translation']);
        return { topic: 'TRANSFORMATIONS', text: `A triangle is moved by ${t}. Which is always true about the image?`,
          ...textual(dil ? 'The angles stay the same.' : 'It is congruent to the original.', dil ? ['The side lengths stay the same.', 'The area stays the same.', 'It is congruent to the original.'] : ['It is bigger than the original.', 'Its angles change.', 'Its sides get longer.']),
          steps: ['Rotations, reflections and translations keep size and shape: congruent.', 'A dilation changes the size but keeps the angles: similar.'] };
      }
      if (f === 'scale') { const s = pick([1.5, 2, 3, .5, 2.5]), p0 = randInt(2, 5), q0 = randInt(p0 + 1, 7), sides = [p0, q0, randInt(q0 + 1, p0 + q0 - 1)].map(v => v * 2), L0 = sides[2];
        return { topic: 'TRANSFORMATIONS', text: `A triangle with sides ${sides.join(', ')} is dilated by a scale factor of ${num(s)}. How long is the longest side of the image?`,
          ...nums(L0 * s, [L0 + s, L0, L0 / s, sides[0] * s].filter(v => Math.abs(v - L0 * s) > 1e-9), num, 2), steps: ['A dilation multiplies every length by the scale factor.', `${L0} × ${num(s)} = ${num(L0 * s)}`] }; }
      const base = pick([[[1, 1], [4, 1], [1, 3]], [[1, 1], [3, 1], [3, 4]], [[1, 2], [4, 1], [2, 4]]]), kind = pick(d < 2 ? ['translation', 'reflection', 'rotation'] : ['translation', 'reflection', 'rotation', 'dilation']);
      let S0 = base, I;
      if (kind === 'translation') { const dx = -randInt(4, 6), dy = -randInt(3, 5); I = S0.map(([x, y]) => [x + dx, y + dy]); }
      else if (kind === 'reflection') { const ax = pick(['x', 'y']); I = S0.map(([x, y]) => ax === 'x' ? [x, -y] : [-x, y]); }
      else if (kind === 'rotation') { const r = pick([90, 180]); I = S0.map(([x, y]) => r === 180 ? [-x, -y] : [-y, x]); }
      else { S0 = pick([[[1, 1], [3, 1], [1, 2]], [[1, 1], [2, 1], [2, 3]], [[1, 2], [3, 1], [1, 1]]]); I = S0.map(([x, y]) => [x * 2, y * 2]); }
      return { topic: 'TRANSFORMATIONS', text: 'Which transformation moves the gold triangle onto the blue one?', ...fixed(['a translation', 'a reflection', 'a rotation', 'a dilation'], 'a ' + kind),
        steps: [{ translation: 'Same size, same direction, just slid over: a translation.', reflection: 'Same size but flipped like a mirror image: a reflection.', rotation: 'Same size, turned around the origin: a rotation.', dilation: 'Same shape but a different size: a dilation.' }[kind]],
        size: [100, 92], fig: (c, w, h) => { const P = plane(c, w, h, 6, { labels: false }); F.outlinePoly(c, S0.map(p => P(...p)), HOT); F.outlinePoly(c, I.map(p => P(...p)), BLU); F.dot(c, P(...S0[0]), HOT); F.dot(c, P(...I[0]), BLU); } };
    },

    // 8.G.5
    triangleAngles: d => {
      const f = pick(d < 2 ? ['exterior', 'algebra'] : d < 3 ? ['exterior', 'algebra', 'similar'] : ['exterior', 'algebra', 'similar', 'polygon']);
      if (f === 'exterior') {
        const a = randInt(30, 75), b = randInt(Math.max(30, 92 - a), 140 - a), x = a + b;
        return { topic: 'ANGLES', text: 'In the figure, what is the value of x, the exterior angle?', ...nums(x, [180 - a - b, 180 - a, 180 - b, 360 - a - b].filter(v => v !== x)),
          steps: ['An exterior angle equals the sum of the two far inside angles.', `x = ${a} + ${b} = ${x}`],
          size: [130, 64], fig: (c, w, h) => {
            const ta = Math.tan(a * DEG), B = 180 - a - b, tb = Math.tan(B * DEG), cx = tb / (ta + tb), cy = cx * ta, s = Math.min(w - 50, (h - 16) / cy);
            const A0 = [6, h - 8], B0 = [6 + Math.round(s), h - 8], C0 = [6 + Math.round(cx * s), h - 8 - Math.round(cy * s)];
            F.outlinePoly(c, [A0, B0, C0], INK); F.line(c, ...B0, w - 2, h - 8, INK);
            L(c, a + '°', A0[0] + 14, A0[1] - 5); L(c, b + '°', C0[0] + (B0[0] < C0[0] ? -3 : 1), C0[1] + 12); L(c, 'x°', B0[0] + 13, B0[1] - 6, HOT);
          } };
      }
      if (f === 'algebra') {
        for (let t = 0; t < 40; t++) {
          const cs = [1, randInt(1, 3), randInt(2, 4)], es = [randInt(-10, 20), randInt(-10, 20), randInt(-20, 10)], sc = cs[0] + cs[1] + cs[2], se = es[0] + es[1] + es[2], x = (180 - se) / sc;
          if (!Number.isInteger(x) || x <= 0 || cs.some((cc, i) => cc * x + es[i] <= 0)) continue;
          const angs = cs.map((cc, i) => `(${lin(cc, es[i])})°`);
          return { topic: 'ANGLES', text: `A triangle's angles are ${angs.join(', ')}. What is x?`, ...nums(x, [(360 - se) / sc, (180 + se) / sc, 180 / sc, x + 5].filter(v => Number.isInteger(v) && v > 0 && v !== x)),
            steps: ['The angles add to 180°.', `${term(sc)} ${signed(se)} = 180`, `${term(sc)} = ${180 - se}, so x = ${x}`] };
        }
        return g8.parallelLines(1);
      }
      if (f === 'similar') {
        const a = randInt(35, 70), b = randInt(40, 80), c3 = 180 - a - b, same = rand() < .5, other = same ? [b, c3] : [b, c3 + randInt(4, 12)];
        return { topic: 'SIMILARITY', text: `One triangle has angles of ${a}° and ${b}°. Another has angles of ${other[0]}° and ${other[1]}°. Are the triangles similar?`,
          ...textual(same ? 'Yes: all three angles match' : 'No: the angles do not all match', same ? ['No: the angles do not all match', 'Only if the sides are equal', 'No: they are in a different order'] : ['Yes: all three angles match', 'Yes: one angle matches', 'Only if the sides are equal']),
          steps: [`First triangle's third angle: 180 - ${a} - ${b} = ${c3}°.`, same ? `Both have ${a}°, ${b}° and ${c3}°: similar by angle-angle.` : `The second has ${other[0]}°, ${other[1]}° and ${180 - other[0] - other[1]}°: not the same.`] };
      }
      const n = randInt(5, 10), NAMES2 = { 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon' };
      return { topic: 'ANGLES', text: `What is the sum of the inside angles of a ${NAMES2[n]} (${n} sides)?`, ...nums((n - 2) * 180, [n * 180, (n - 1) * 180, 360, (n - 3) * 180].filter(v => v !== (n - 2) * 180), num, 180),
        steps: [`A ${n}-sided shape splits into ${n - 2} triangles from one corner.`, `${n - 2} × 180 = ${num((n - 2) * 180)}°`] };
    },

    // 8.G.5
    parallelLines: d => {
      const th = pick([randInt(40, 80), randInt(100, 140)]), V = { 1: 180 - th, 2: th, 3: th, 4: 180 - th, 5: 180 - th, 6: th, 7: th, 8: 180 - th };
      const fig = (c, w, h) => {
        const y1 = 14, y2 = h - 14, run = (y2 - y1) / Math.tan(th * DEG), xT = Math.round(w / 2 + run / 2), xB = Math.round(w / 2 - run / 2);
        F.line(c, 2, y1, w - 12, y1, INK); F.line(c, 2, y2, w - 12, y2, INK); L(c, 'm', w - 6, y1 + 1, DIM); L(c, 'n', w - 6, y2 + 1, DIM);
        const ex = Math.round(12 / Math.tan(th * DEG)); F.line(c, xT + ex, y1 - 12, xB - ex, y2 + 12, INK);
        [[xT, y1, 1], [xB, y2, 5]].forEach(([vx, vy, n0]) => { const B = [(th + 180) / 2, th / 2, 180 + th / 2, 270 + th / 2]; B.forEach((ang, i) => L(c, String(n0 + i), ...((p) => [p[0], p[1] + 1])(at(vx, vy, ang, 9)), HOT)); });
      };
      const f = pick(d < 2 ? ['measure'] : d < 3 ? ['measure', 'name'] : ['measure', 'name', 'algebra']);
      if (f === 'name') {
        const P = [[[3, 6], 'alternate interior angles'], [[4, 5], 'alternate interior angles'], [[1, 8], 'alternate exterior angles'], [[2, 7], 'alternate exterior angles'], [[1, 5], 'corresponding angles'], [[2, 6], 'corresponding angles'], [[3, 7], 'corresponding angles'], [[4, 8], 'corresponding angles'], [[1, 4], 'vertical angles'], [[6, 7], 'vertical angles'], [[3, 5], 'same-side interior angles'], [[4, 6], 'same-side interior angles']];
        const [[i, j], name] = pick(P), all = ['alternate interior angles', 'alternate exterior angles', 'corresponding angles', 'vertical angles', 'same-side interior angles'];
        return { topic: 'ANGLES', text: `Lines m and n are parallel. What kind of angle pair are angles ${i} and ${j}?`, ...textual(name, shuffle(all.filter(s => s !== name))),
          steps: ['Interior: between m and n. Exterior: outside them.', 'Alternate: opposite sides of the crossing line. Corresponding: same spot at each crossing.', `${i} and ${j}: ${name}.`], size: [120, 72], fig };
      }
      const i = randInt(1, 8), js = [1, 2, 3, 4, 5, 6, 7, 8].filter(k => k !== i), j = pick(js), eq = V[i] === V[j];
      if (f === 'algebra') {
        for (let t = 0; t < 40; t++) {
          const a = randInt(2, 5), c = randInt(1, 4), x = randInt(5, 30); if (a === c && eq) continue;
          const A = V[i], e1 = A - a * x, e2 = V[j] - c * x;
          if (a * x + e1 <= 0) continue;
          return { topic: 'ANGLES', text: `Lines m and n are parallel. Angle ${i} is (${lin(a, e1)})° and angle ${j} is (${lin(c, e2)})°. What is x?`,
            ...nums(x, [eq ? (180 - e1 - e2) / (a + c) : (e2 - e1) / (a - c || 1), x + 5, x * 2].filter(v => Number.isInteger(v) && v > 0 && v !== x)),
            steps: [eq ? `Angles ${i} and ${j} are equal.` : `Angles ${i} and ${j} add to 180°.`, eq ? `${lin(a, e1)} = ${lin(c, e2)}` : `${lin(a, e1)} + ${lin(c, e2)} = 180`, `x = ${x}`], size: [120, 72], fig };
        }
      }
      return { topic: 'ANGLES', text: `Lines m and n are parallel. Angle ${i} measures ${V[i]}°. What is the measure of angle ${j}?`, ...nums(V[j], [180 - V[j], 90 - Math.min(V[j], 180 - V[j]), 360 - V[j]].filter(v => v > 0 && v !== V[j])),
        steps: ['A line crossing parallel lines makes just two angle sizes.', `Here they are ${th}° and ${180 - th}°, which add to 180°.`, `Angle ${j} is ${eq ? 'the same size as' : 'the partner of'} angle ${i}: ${V[j]}°.`], size: [120, 72], fig };
    },

    // 8.G.7
    pythagorean: d => {
      const T = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [20, 21, 29], [9, 40, 41], [15, 20, 25]];
      const f = pick(d < 2 ? ['hyp', 'leg'] : d < 3 ? ['hyp', 'leg', 'word'] : ['hyp', 'leg', 'word', 'approx', 'box']);
      const [a, b, c] = pick(T);
      if (f === 'hyp') return { topic: 'PYTHAGOREAN', text: 'What is the length of the hypotenuse?', ...nums(c, [a + b, a * a + b * b, b - a, c + 1].filter(v => v !== c)),
        steps: ['a^2 + b^2 = c^2', `${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${c * c}`, `c = √${c * c} = ${c}`], size: [110, 64], fig: (cx, w, h) => rightTri(cx, w, h, b, a, String(b), String(a), '?') };
      if (f === 'leg') return { topic: 'PYTHAGOREAN', text: 'What is the length of the missing side?', ...nums(a, [c - b, c + b, c * c - b * b, a + 1].filter(v => v !== a)),
        steps: ['a^2 + b^2 = c^2', `a^2 = ${c}^2 - ${b}^2 = ${c * c} - ${b * b} = ${a * a}`, `a = √${a * a} = ${a}`], size: [110, 64], fig: (cx, w, h) => rightTri(cx, w, h, b, a, String(b), '?', String(c)) };
      if (f === 'word') {
        const [S, ans, st] = pick([[`A ${c}-foot ladder leans on a wall. Its foot is ${a} feet from the wall. How high up the wall does it reach?`, b, [`${a}^2 + h^2 = ${c}^2`, `h^2 = ${c * c} - ${a * a} = ${b * b}`, `h = ${b} feet`]],
          [`A TV screen is ${b} inches wide and ${a} inches tall. How long is its diagonal?`, c, [`${a}^2 + ${b}^2 = ${a * a + b * b}`, `diagonal = √${c * c} = ${c} inches`]],
          [`${who()} walks ${a} blocks north and then ${b} blocks east. How far is that in a straight line from the start?`, c, [`${a}^2 + ${b}^2 = ${c * c}`, `distance = √${c * c} = ${c} blocks`]]]);
        return { topic: 'PYTHAGOREAN', text: S, ...nums(ans, [a + b, c - a, ans === c ? c + 2 : c + a, Math.round(Math.sqrt(a + b))].filter(v => v !== ans)), steps: st };
      }
      if (f === 'approx') { const p = randInt(2, 9), q0 = randInt(p + 1, 12), q = Number.isInteger(Math.sqrt(p * p + q0 * q0)) ? q0 + 1 : q0, h2 = p * p + q * q, v = round(Math.sqrt(h2), 1);
        return { topic: 'PYTHAGOREAN', text: `A right triangle has legs ${p} and ${q}. How long is the hypotenuse, to the nearest tenth?`, ...nums(v, [p + q, round(Math.sqrt(q * q - p * p), 1), h2, round(v + .4, 1)].filter(x => Math.abs(x - v) > 1e-9), num, .1),
          steps: [`c^2 = ${p}^2 + ${q}^2 = ${h2}`, `c = √${h2}`, `= ${num(v)} to the nearest tenth`] }; }
      const [l, w, h, D] = pick([[2, 3, 6, 7], [1, 4, 8, 9], [4, 4, 7, 9], [2, 6, 9, 11], [6, 6, 7, 11], [3, 4, 12, 13], [2, 10, 11, 15]]);
      return { topic: 'PYTHAGOREAN', text: `A box is ${l} by ${w} by ${h} inches. How long is the longest straight rod that fits inside, corner to corner?`, ...nums(D, [l + w + h, Math.round(Math.sqrt(l * l + w * w)), h + 1, D + 2].filter(v => v !== D)),
        steps: [`Floor diagonal: ${l}^2 + ${w}^2 = ${l * l + w * w}`, `Then with the height: ${l * l + w * w} + ${h}^2 = ${D * D}`, `√${D * D} = ${D} inches`] };
    },

    // 8.G.6
    rightTriangleTest: d => {
      const T = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20]], [a, b, c] = pick(T);
      if (d < 3 || rand() < .5) {
        const s = t => t.join(', '), NOT = [[6, 8, 11], [5, 6, 7], [4, 5, 6], [7, 8, 10], [5, 11, 12], [3, 5, 6], [9, 12, 16], [8, 14, 17]];
        return { topic: 'PYTHAGOREAN', text: 'Which side lengths make a right triangle?', ...textual(s([a, b, c]), sample(NOT, 4).map(s)),
          steps: ['Check whether a^2 + b^2 = c^2 for the longest side c.', `${a}^2 + ${b}^2 = ${a * a + b * b} = ${c}^2`, `So ${s([a, b, c])} is a right triangle.`] };
      }
      const yes = rand() < .5, cc = yes ? c : c + 1, sum = a * a + b * b;
      return { topic: 'PYTHAGOREAN', text: `A triangle has sides ${a}, ${b} and ${cc}. Is it a right triangle?`,
        ...textual(yes ? `Yes: ${a}^2 + ${b}^2 = ${cc}^2` : `No: ${a}^2 + ${b}^2 ≠ ${cc}^2`, yes ? [`No: ${a}^2 + ${b}^2 ≠ ${cc}^2`, `No: ${a} + ${b} ≠ ${cc}`, `Yes: ${a} + ${b} > ${cc}`] : [`Yes: ${a}^2 + ${b}^2 = ${cc}^2`, `Yes: ${a} + ${b} > ${cc}`, `No: ${a} + ${b} ≠ ${cc}`]),
        steps: [`${a}^2 + ${b}^2 = ${sum}`, `${cc}^2 = ${cc * cc}`, yes ? 'They match: right triangle.' : 'They do not match: not a right triangle.'] };
    },

    // 8.G.8
    distance: d => {
      const [p, q] = d < 3 ? pick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [0, 5], [6, 0]]) : [randInt(1, 6), randInt(1, 7)];
      const sx = pick([1, -1]), sy = pick([1, -1]), x1 = sx > 0 ? randInt(-6, 6 - p) : randInt(-6 + p, 6), y1 = sy > 0 ? randInt(-6, 6 - q) : randInt(-6 + q, 6), x2 = x1 + sx * p, y2 = y1 + sy * q, s2 = p * p + q * q, exact = Number.isInteger(Math.sqrt(s2));
      const fig = (c, w, h) => { const P = plane(c, w, h, 6); if (d < 2) { F.line(c, ...P(x1, y1), ...P(x2, y1), BLU, 2); F.line(c, ...P(x2, y1), ...P(x2, y2), BLU, 2); } F.line(c, ...P(x1, y1), ...P(x2, y2), HOT); F.dot(c, P(x1, y1), RED); F.dot(c, P(x2, y2), RED);
        for (const [lx, ly, ch] of [[x1, y1, 'A'], [x2, y2, 'B']]) { const q = P(lx, ly); L(c, ch, q[0] + (lx > 3 ? -6 : 6), q[1] + (ly > 3 ? 7 : -4)); } };
      const intro = `What is the distance between A${pt(x1, y1)} and B${pt(x2, y2)}?`;
      if (exact) return { topic: 'DISTANCE', text: intro, ...nums(Math.sqrt(s2), [p + q, s2, Math.abs(p - q) || p + 1, Math.sqrt(s2) + 1].filter(v => v !== Math.sqrt(s2))),
        steps: [`Across: ${p}. Up or down: ${q}.`, `d^2 = ${p}^2 + ${q}^2 = ${s2}`, `d = ${Math.sqrt(s2)}`], size: [100, 92], fig };
      return { topic: 'DISTANCE', text: intro, ...textual(`√${s2}`, [`${p + q}`, `${s2}`, `√${p + q}`, `√${s2 + 2}`, `√${Math.abs(q * q - p * p) || s2 - 1}`].filter(s => s !== `√${s2}`)),
        steps: [`Across: ${p}. Up or down: ${q}.`, `d^2 = ${p}^2 + ${q}^2 = ${s2}`, `d = √${s2}`], size: [100, 92], fig };
    },

    // 8.G.9
    volume: d => {
      const f = pick(d < 2 ? ['cyl', 'cone'] : d < 3 ? ['cyl', 'cone', 'sphere', 'compare'] : ['cyl', 'cone', 'sphere', 'missing', 'dec']);
      const pi = v => `${num(v)}π`, r = randInt(2, 6), h = randInt(3, 10);
      const cylFig = (c, w, H) => { const cx = Math.round(w / 2), rx = 20, ry = 6, top = 10, bot = H - 10; ellipse(c, cx, top, rx, ry, INK); ellipse(c, cx, bot, rx, ry, INK, true); F.line(c, cx - rx, top, cx - rx, bot, INK); F.line(c, cx + rx, top, cx + rx, bot, INK); F.line(c, cx, bot, cx + rx, bot, HOT); L(c, String(r), cx + rx / 2, bot - 5, HOT); L(c, String(h), cx + rx + 3, (top + bot) / 2, INK, 'left'); };
      const coneFig = hh => (c, w, H) => { const cx = Math.round(w / 2), rx = 22, ry = 7, tip = 4, bot = H - 9; ellipse(c, cx, bot, rx, ry, INK, true); F.line(c, cx, tip, cx - rx, bot, INK); F.line(c, cx, tip, cx + rx, bot, INK); F.line(c, cx, tip, cx, bot, DIM, 2); F.line(c, cx, bot, cx + rx, bot, HOT); L(c, String(r), cx + rx / 2 + 1, bot - 5, HOT); L(c, String(hh), cx - 3, (tip + bot) / 2 + 4, INK, 'right'); };
      if (f === 'cyl') return { topic: 'VOLUME', text: 'What is the volume of the cylinder? Leave the answer in terms of π.', ...textual(pi(r * r * h), [pi(2 * r * h), pi(r * h), pi(4 * r * r * h), pi(r * r * h / 3), pi(2 * r * r * h)]),
        steps: ['V = π r^2 h', `= π × ${r}^2 × ${h} = π × ${r * r} × ${h}`, `= ${pi(r * r * h)}`], size: [70, 64], fig: cylFig };
      if (f === 'cone') { const H = 3 * randInt(1, 4); return { topic: 'VOLUME', text: 'What is the volume of the cone? Leave the answer in terms of π.', ...textual(pi(r * r * H / 3), [pi(r * r * H), pi(r * H), pi(2 * r * H / 3), pi(r * r * H / 2), pi(4 * r * r * H / 3)]),
        steps: ['V = 1/3 π r^2 h', `= 1/3 × π × ${r * r} × ${H}`, `= ${pi(r * r * H / 3)}`], size: [70, 64], fig: coneFig(H) }; }
      if (f === 'sphere') { const R = pick([3, 6]); return { topic: 'VOLUME', text: `A ball has a radius of ${R} inches. What is its volume, in terms of π?`, ...textual(pi(4 * R ** 3 / 3), [pi(4 * R * R), pi(R ** 3), pi(4 * R ** 3), pi(2 * R ** 3 / 3), pi(4 * (2 * R) ** 3 / 3)]),
        steps: ['V = 4/3 π r^3', `= 4/3 × π × ${R ** 3}`, `= ${pi(4 * R ** 3 / 3)}`], size: [64, 64],
        fig: (c, w, H) => { const cx = Math.round(w / 2), cy = Math.round(H / 2), RR = Math.min(w, H) / 2 - 4; F.circle(c, cx, cy, RR, INK); ellipse(c, cx, cy, RR, 6, DIM, true); F.line(c, cx, cy, cx + RR, cy, HOT); F.dot(c, [cx, cy], HOT); L(c, String(R), cx + RR / 2, cy - 6, HOT); } }; }
      if (f === 'compare') { const C = randInt(2, 10) * 3; return { topic: 'VOLUME', text: `A cone and a cylinder have the same base and height. The cylinder holds ${C} cups. How many cups does the cone hold?`,
        ...nums(C / 3, [C * 3, C / 2, C, C * 2 / 3].filter(v => v !== C / 3)), steps: ['A cone holds 1/3 as much as the cylinder with the same base and height.', `${C} ÷ 3 = ${C / 3} cups`] }; }
      if (f === 'missing') { const V = r * r * h; return { topic: 'VOLUME', text: `A cylinder has a volume of ${V}π cubic cm and a radius of ${r} cm. What is its height?`, ...nums(h, [V / r, V / (2 * r), V - r * r, h * 3].filter(v => Number.isInteger(v) && v !== h)),
        steps: ['V = π r^2 h', `${V}π = π × ${r * r} × h`, `h = ${V} ÷ ${r * r} = ${h} cm`] }; }
      const V = round(3.14 * r * r * h, 2);
      return { topic: 'VOLUME', text: `A can has a radius of ${r} inches and a height of ${h} inches. What is its volume? Use 3.14 for π.`, ...nums(V, [round(3.14 * 2 * r * h, 2), round(3.14 * r * h, 2), round(3.14 * 4 * r * r * h, 2), round(V / 3, 2)].filter(v => Math.abs(v - V) > .01), num, 1),
        steps: ['V = π r^2 h', `= 3.14 × ${r * r} × ${h}`, `= ${num(V)} cubic inches`], size: [70, 64], fig: cylFig };
    },

    // 8.SP.1
    scatterPlots: d => {
      const f = pick(d < 2 ? ['assoc', 'assoc', 'context'] : ['assoc', 'outlier', 'context']);
      if (f === 'context') {
        const POS = ['hours of practice and points scored', 'a person\'s height and shoe size', 'miles driven and gas used'], NEG = ['outside temperature and hot cocoa sold', 'minutes on the phone and battery left', 'a car\'s age and its price'], NONE = ['shoe size and test score', 'birthday month and height', 'hair length and math grade'];
        const want = pick(['positive', 'negative', 'no']), right = pick(want === 'positive' ? POS : want === 'negative' ? NEG : NONE), others = [...(want === 'positive' ? [] : POS), ...(want === 'negative' ? [] : NEG), ...(want === 'no' ? [] : NONE)];
        return { topic: 'SCATTER PLOTS', text: `Which pair would most likely show ${want === 'no' ? 'no' : 'a ' + want} association?`, ...textual(right, sample(others, 4)),
          steps: ['Positive: both go up together. Negative: one goes up as the other goes down.', 'No association: no pattern.', `${right}: ${want} association.`] };
      }
      const kind = f === 'outlier' ? 'positive linear' : pick(['positive linear', 'negative linear', 'nonlinear', 'no association']);
      const pts = [];
      for (let i = 0; i < 14; i++) { const x = .5 + i * .65 + rand() * .3, j = (rand() - .5) * 1.6;
        pts.push([x, kind === 'positive linear' ? .8 + .8 * x + j : kind === 'negative linear' ? 9 - .8 * x + j : kind === 'nonlinear' ? 1 + (x - 5) * (x - 5) / 3 + j * .5 : 1 + rand() * 8]); }
      const lab = [];
      let outLetter = 'P';
      if (f === 'outlier') { const ix = shuffle([2, 5, 8, 11]), o = pick(ix); pts[o] = [pts[o][0], pts[o][1] > 5 ? 1 : 9.2]; ix.forEach(k => lab.push(k)); outLetter = 'PQRS'[ix.indexOf(o)]; }
      const fig = (c, w, h) => { const P = quad1(c, w, h, 10, 10, { xs: 2, ys: 2, labels: false, left: 4, bottom: 4 }); pts.forEach(p => F.dot(c, P(...p.map(v => clamp(v, .2, 9.8))), BLU));
        lab.forEach((k, i) => { const q = P(...pts[k].map(v => clamp(v, .2, 9.8))); F.dot(c, q, HOT); L(c, 'PQRS'[i], q[0] + 5, q[1] - 4, HOT); }); };
      if (f === 'outlier') { const ans = 'Point ' + outLetter;
        return { topic: 'SCATTER PLOTS', text: 'Which labeled point is an outlier?', ...fixed(['Point P', 'Point Q', 'Point R', 'Point S'], ans),
          steps: ['An outlier is far from the pattern of the other points.', `${ans} sits far from the rising trend.`], size: [100, 72], fig }; }
      return { topic: 'SCATTER PLOTS', text: 'What kind of association does the scatter plot show?', ...fixed(['positive linear', 'negative linear', 'nonlinear', 'no association'], kind),
        steps: ['Up to the right: positive. Down to the right: negative.', 'A curve: nonlinear. A cloud with no pattern: no association.', `This one: ${kind}.`], size: [100, 72], fig };
    },

    // 8.SP.2, 8.SP.3
    lineOfFit: d => {
      const f = pick(d < 2 ? ['predict', 'slope'] : ['predict', 'slope', 'intercept', 'which']);
      const [ctx, xU, xUs, yU, m, b] = pick([["a plant's height in cm after x weeks", 'week', 'weeks', 'cm', pick([1.5, 2, 2.5, 3]), randInt(2, 12)], ["a phone's battery left (%) after x hours", 'hour', 'hours', 'percent', -pick([5, 8, 10, 12]), 100],
        ['the price of a pizza in dollars with x toppings', 'topping', 'toppings', 'dollars', pick([1.25, 1.5, 2]), randInt(8, 12)], ['test score after x hours of study', 'hour of study', 'hours of study', 'points', pick([4, 5, 6]), randInt(50, 65)]]);
      const eq = `y = ${num(m)}x + ${b}`;
      if (f === 'predict') { const X = randInt(3, 8), Y = round(m * X + b); return { topic: 'LINE OF FIT', text: `The line of fit ${eq} models ${ctx}. What does it predict when x = ${X}?`,
        ...nums(Y, [round(m * X), round(m + X + b), round(m * (X + 1) + b), round(b - m * X)].filter(v => Math.abs(v - Y) > 1e-9), num, Math.abs(m)),
        steps: [`Put ${X} in for x: y = ${num(m)}(${X}) + ${b}`, `= ${num(m * X)} + ${b} = ${num(Y)}`] }; }
      if (f === 'slope' || f === 'intercept') {
        const sl = f === 'slope', right = sl ? `${m > 0 ? 'Up' : 'Down'} ${num(Math.abs(m))} ${yU} for each ${xU}` : `${b} ${yU} when x = 0`;
        return { topic: 'LINE OF FIT', text: `The line ${eq} models ${ctx}. What does the ${sl ? num(m) : b} mean?`,
          ...textual(right, sl ? [`${num(Math.abs(m))} ${yU} at the start`, `${num(Math.abs(m))} ${xUs} in all`, `${m > 0 ? 'Down' : 'Up'} ${num(Math.abs(m))} ${yU} for each ${xU}`] : [`Up ${b} ${yU} for each ${xU}`, `${b} ${xUs} in all`, `The most it can ever be`]),
          steps: ['In y = mx + b, m is the change for each 1 of x (the slope).', 'b is the value when x = 0 (the start).', `So the ${sl ? num(m) : b} means: ${right}.`] };
      }
      const x1 = 0, y1 = randInt(1, 4), x2 = randInt(2, 4), s = randInt(1, 3), y2 = y1 + s * x2;
      return { topic: 'LINE OF FIT', text: `A line of fit passes through (${x1}, ${y1}) and (${x2}, ${y2}). Which is its equation?`, ...textual(yeq(s, y1), [yeq(y1, s), yeq(s, y2), yeq(y2 / x2, 0), yeq(-s, y1)].filter(e => e !== yeq(s, y1))),
        steps: [`Slope: (${y2} - ${y1}) ÷ (${x2} - 0) = ${s}`, `y-intercept: ${y1}`, yeq(s, y1)] };
    },

    // 8.SP.4
    twoWayTables: d => {
      const [R1, R2, C1, C2, rq, cq, t1, t2] = pick([['CITY', 'FARM', 'SOCCER', 'CHESS', 'live in the city', 'play soccer', 'where students live', 'the game they play'],
        ['BUS', 'WALK', 'LUNCH', 'SNACK', 'ride the bus', 'buy lunch', 'how students get to school', 'what they eat'], ['6TH', '7TH', 'BAND', 'ART', 'are in 6th grade', 'chose band', 'grade', 'class choice']]);
      const f = pick(d < 2 ? ['cell', 'total'] : d < 3 ? ['cell', 'row'] : ['row', 'col', 'assoc']), linked = rand() < .5;
      const r1 = pick([20, 25, 40, 50]), r2 = pick([20, 25, 40, 50]), pA = pick([20, 40, 60, 80].filter(p => r1 * p % 100 === 0));
      const okB = [20, 40, 60, 80].filter(p => r2 * p % 100 === 0 && (f !== 'assoc' || (linked ? Math.abs(p - pA) >= 40 : p === pA)));
      const pB = okB.length ? pick(okB) : f === 'assoc' && !linked ? pA : pick([20, 40, 60, 80].filter(p => r2 * p % 100 === 0));
      const R2n = r2 * pB % 100 === 0 ? r2 : 50;
      const a = r1 * pA / 100, b = r1 - a, c = R2n * pB / 100, e = R2n - c, N = r1 + R2n;
      const fig = (cx, w, h) => table(cx, w, h, [['', C1, C2, 'TOTAL'], [R1, a, b, r1], [R2, c, e, R2n], ['TOTAL', a + c, b + e, N]], { headCol: true, first: 44 });
      const base = { topic: 'TWO-WAY TABLES', size: [164, 60], fig };
      if (f === 'cell') return { ...base, text: `How many students ${rq} and ${cq}?`, ...nums(a, [b, a + c, r1, c].filter(v => v !== a)), steps: [`Find row ${R1}, column ${C1}.`, `The number there is ${a}.`] };
      if (f === 'total') return { ...base, text: `How many students ${cq} in all?`, ...nums(a + c, [a, c, N, r1].filter(v => v !== a + c)), steps: [`Add the ${C1} column: ${a} + ${c}`, `= ${a + c}`] };
      if (f === 'row') return { ...base, text: `What percent of the students who ${rq} ${cq}?`, ...nums(pA, [a / N * 100, a / (a + c) * 100, 100 - pA].filter(v => Math.abs(v - pA) > .05), pct, 5),
        steps: [`Only the ${R1} row: ${r1} in all.`, `${a} of them are ${C1}.`, `${a} ÷ ${r1} = ${num(pA / 100)} = ${pA}%`] };
      if (f === 'col') { const v = a / (a + c); return { ...base, text: `What fraction of the students who ${cq} ${rq}?`, ...pnums(v, [a / r1, a / N, c / (a + c)].filter(x => Math.abs(x - v) > 1e-9), fs, .05),
        steps: [`The ${C1} column has ${a + c}.`, `${a} of them are in ${R1}.`, `${a}/${a + c}${fs(v) !== `${a}/${a + c}` ? ' = ' + fs(v) : ''}`] }; }
      const assoc = pA !== pB;
      return { ...base, text: `Is there an association between ${t1} and ${t2}?`,
        ...textual(assoc ? `Yes: ${pA}% vs ${pB}% is a big gap` : `No: both rows are ${pA}%`, assoc ? [`No: ${pA}% and ${pB}% are close`, 'No: the totals are different', 'No: only the totals matter'] : ['Yes: the totals are different', 'Yes: every number is different', 'Yes: one row has more students']),
        steps: [`Row percents in ${C1}: ${R1} ${pA}%, ${R2} ${pB}%.`, assoc ? 'Very different: an association.' : 'The same in both rows: no association.'] };
    },
  };

  Questions.grade({ id: '8', n: 8, label: '8TH GRADE', short: '8TH', clock: [40, 38, 35, 32, 30], kinds: g8,
    min: { repeatingDecimals: 2, sciCompare: 2, sciOperations: 2, compareRates: 2, numberOfSolutions: 2, systemsAlgebra: 2, systemsWord: 3, compareFunctions: 2, linearOrNot: 1, graphStories: 1, parallelLines: 2, rightTriangleTest: 2, scatterPlots: 1, lineOfFit: 2, twoWayTables: 2 } });

  // ======================================================================
  // Beyond the Common Core: the extra topics in IXL's grade plans and most state standards.
  // Each generator takes the grade too, so one bank serves 6th, 7th and 8th at their own level.
  // ======================================================================
  const clockStr = m => { m = ((m % 1440) + 1440) % 1440; const h = Math.floor(m / 60), mm = m % 60; return `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${h < 12 ? 'a.m.' : 'p.m.'}`; };
  const dur = m => m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m / 60} hr`;
  const fact = n => n <= 1 ? 1 : n * fact(n - 1);
  const choose = (n, k) => fact(n) / (fact(k) * fact(n - k));
  // A pie chart drawn pixel by pixel, with a legend to its right: parts [{ n, col, lab }].
  function pieChart(c, cx, cy, r, parts, lx) {
    const tot = parts.reduce((s, p) => s + p.n, 0), edges = []; let acc = 0;
    for (const p of parts) { acc += p.n; edges.push(acc / tot); }
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      const t = ((Math.atan2(x, -y) / (2 * Math.PI)) + 1) % 1, k = edges.findIndex(e => t < e - 1e-9);
      c.fillStyle = parts[k < 0 ? parts.length - 1 : k].col; c.fillRect(cx + x, cy + y, 1, 1);
    }
    F.circle(c, cx, cy, r, INK);
    let a0 = 0; parts.forEach(p => { F.line(c, cx, cy, ...at(cx, cy, 90 - a0 * 360, r), INK); a0 += p.n / tot; });
    parts.forEach((p, i) => { F.box(c, lx, 6 + i * 12, 6, 6, p.col); L(c, p.lab, lx + 9, 10 + i * 12, INK, 'left'); });
  }
  // A cylinder or cone outline, the radius in gold.
  function drawCylinder(c, w, h, lr, lh) {
    const cx = Math.round(w / 2), rx = 20, ry = 6, top = 10, bot = h - 10;
    ellipse(c, cx, top, rx, ry, INK); ellipse(c, cx, bot, rx, ry, INK, true); F.line(c, cx - rx, top, cx - rx, bot, INK); F.line(c, cx + rx, top, cx + rx, bot, INK);
    F.line(c, cx, bot, cx + rx, bot, HOT); L(c, lr, cx + rx / 2, bot - 5, HOT); L(c, lh, cx + rx + 3, (top + bot) / 2, INK, 'left');
  }
  function drawCone(c, w, h, lr, lside, slant) {
    const cx = Math.round(w / 2) - 4, rx = 22, ry = 7, tip = 4, bot = h - 9;
    ellipse(c, cx, bot, rx, ry, INK, true); F.line(c, cx, tip, cx - rx, bot, INK); F.line(c, cx, tip, cx + rx, bot, INK); F.line(c, cx, bot, cx + rx, bot, HOT);
    L(c, lr, cx + rx / 2 + 1, bot - 5, HOT);
    if (slant) L(c, lside, cx + rx / 2 + 8, (tip + bot) / 2 - 2, INK, 'left'); else { F.line(c, cx, tip, cx, bot, DIM, 2); L(c, lside, cx - 3, (tip + bot) / 2 + 4, INK, 'right'); }
  }

  // ---- Problem solving: Venn diagrams and logical reasoning
  const VENN = [['SOCCER', 'BAND', 'play soccer', 'are in band', 'are not in band'], ['DOG', 'CAT', 'have a dog', 'have a cat', 'do not have a cat'],
    ['PIZZA', 'TACOS', 'like pizza', 'like tacos', 'do not like tacos'], ['CHESS', 'ART', 'are in chess club', 'are in art club', 'are not in art club']];
  function vennLogic(d, g) {
    const f = pick(g === 6 ? (d < 3 ? ['venn', 'venn', 'logic'] : ['venn', 'logic', 'puzzle']) : d < 3 ? ['venn', 'totals', 'logic'] : ['venn', 'totals', 'logic', 'puzzle']);
    if (f === 'venn' || f === 'totals') {
      const [A, B, a1, b1, nb] = pick(VENN), oa = randInt(3, 15), both = randInt(2, 10), ob = randInt(3, 15), nei = randInt(1, 9), N = oa + both + ob + nei;
      if (f === 'totals') return { topic: 'VENN DIAGRAMS', text: `Of ${N} students, ${oa + both} ${a1}, ${ob + both} ${b1}, and ${both} do both. How many do neither?`,
        ...nums(nei, [nei - both, nei + both, both, N - oa - both].filter(v => v >= 0 && v !== nei)),
        steps: [`At least one: ${oa + both} + ${ob + both} - ${both} = ${oa + both + ob}`, `(The ${both} who do both were counted twice.)`, `Neither: ${N} - ${oa + both + ob} = ${nei}`] };
      const q = pick(['both', 'onlyA', 'totalA', 'either', 'neither']), hide = q === 'neither';
      const [text, ans, wr, st] = {
        both: [`How many students ${a1} and ${b1}?`, both, [oa, ob, oa + ob], ['Both: the middle, where the circles overlap.', `That is ${both}.`]],
        onlyA: [`How many students ${a1} but ${nb}?`, oa, [oa + both, both, ob], ['Only the left circle, not the middle.', `That is ${oa}.`]],
        totalA: [`How many students ${a1} in all?`, oa + both, [oa, both, oa + both + ob], [`The whole ${A} circle: ${oa} + ${both}`, `= ${oa + both}`]],
        either: [`How many students ${a1}, ${b1}, or both?`, oa + both + ob, [oa + ob + 2 * both, oa + ob, N], ['Add the three parts inside the circles:', `${oa} + ${both} + ${ob} = ${oa + both + ob}`]],
        neither: ['How many do neither?', nei, [N - oa - ob, oa + ob + both, nei + both], [`Inside the circles: ${oa} + ${both} + ${ob} = ${oa + both + ob}`, `Neither: ${N} - ${oa + both + ob} = ${nei}`]],
      }[q];
      return { topic: 'VENN DIAGRAMS', text: `The Venn diagram shows what ${N} students do. ${text}`,
        ...nums(ans, wr.filter(v => v >= 0 && v !== ans)), steps: st,
        size: [120, 66], fig: (c, w, h) => {
          F.outlinePoly(c, [[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]], DIM);
          const y = 38, r = 21, xa = 47, xb = 73;
          F.circle(c, xa, y, r, HOT); F.circle(c, xb, y, r, BLU); L(c, A, xa - 8, 9, HOT); L(c, B, xb + 8, 9, BLU);
          L(c, String(oa), xa - 11, y + 1); L(c, String(both), 60, y + 1); L(c, String(ob), xb + 11, y + 1); L(c, hide ? '?' : String(nei), w - 9, h - 6, hide ? RED : INK);
        } };
    }
    if (f === 'logic') {
      const n = who(), Q = pick([
        ['All squares are rectangles. Shape K is a square. Which must be true?', 'Shape K is a rectangle.', ['Shape K is not a rectangle.', 'Every rectangle is a square.', 'Shape K is a triangle.'], 'K is a square, and every square is a rectangle.'],
        [`Everyone in the robot club is in 7th grade. ${n} is not in 7th grade. Which must be true?`, `${n} is not in the robot club.`, [`${n} is in the robot club.`, `${n} is in 8th grade.`, 'Every 7th grader is in the robot club.'], `If ${n} were in the club, ${n} would be in 7th grade.`],
        ['If it rains, the game is called off. The game was not called off. Which must be true?', 'It did not rain.', ['It rained.', 'The game was moved inside.', 'It will rain tomorrow.'], 'Rain would have called the game off.'],
        ['No fish can fly. A sunfish is a fish. Which must be true?', 'A sunfish cannot fly.', ['A sunfish can fly.', 'Some fish can fly.', 'Anything that cannot fly is a fish.'], 'A sunfish is a fish, and no fish can fly.'],
        ['Every card in the box is red or blue. This card came from the box and is not red. Which must be true?', 'The card is blue.', ['The card is red.', 'The card is green.', 'Every card in the box is blue.'], 'A card from the box is red or blue.'],
        [`If a number ends in 0, it is divisible by 10. ${n}'s number is not divisible by 10. Which must be true?`, 'It does not end in 0.', ['It ends in 0.', 'It is odd.', 'It ends in 5.'], 'Ending in 0 would make it divisible by 10.']]);
      return { topic: 'LOGIC', text: Q[0], ...textual(Q[1], Q[2]), steps: [Q[3], `So: ${Q[1]}`] };
    }
    const [things, intro, has, not, art] = pick([[['cat', 'dog', 'fish'], 'own a different pet: a cat, a dog or a fish', 'owns', 'does not own', 'the '],
      [['soccer', 'tennis', 'chess'], 'play a different game: soccer, tennis or chess', 'plays', 'does not play', ''], [['drums', 'piano', 'violin'], 'play a different instrument: drums, piano or violin', 'plays', 'does not play', 'the ']]);
    const P = sample(NAMES, 3), t = shuffle(things.slice()), ask = randInt(0, 2);
    return { topic: 'LOGIC', text: `${P[0]}, ${P[1]} and ${P[2]} each ${intro}. ${P[0]} ${not} ${art}${t[1]} or ${art}${t[2]}. ${P[1]} ${not} ${art}${t[2]}. Who ${has} ${art}${t[ask]}?`,
      ...textual(P[ask], [...P.filter((_, i) => i !== ask), 'You cannot tell']),
      steps: [`${P[0]} has neither of those, so ${P[0]} ${has} ${art}${t[0]}.`, `${P[1]} ${not} ${art}${t[2]}, so ${P[1]} ${has} ${art}${t[1]}.`, `That leaves ${art}${t[2]} for ${P[2]}.`] };
  }

  // ---- Estimation
  function estimation(d, g) {
    const f = pick(g === 6 ? ['product', 'quotient', 'money', 'decimal'] : g === 7 ? ['tip', 'percent', 'product', 'money'] : ['root', 'tip', 'percent', 'sci']);
    const r10 = v => Math.round(v / 10) * 10, avoid5 = v => v % 10 === 5 ? v + 1 : v;
    if (f === 'product') { const a = avoid5(randInt(21, 98)), b = avoid5(randInt(21, 98)), ra = r10(a), rb = r10(b), e = ra * rb;
      return { topic: 'ESTIMATION', text: `Which is the best estimate of ${a} × ${b}?`, ...nums(e, [e * 10, e / 10, ra + rb], num, 100),
        steps: [`Round to the nearest ten: ${a} → ${ra}, ${b} → ${rb}`, `${ra} × ${rb} = ${num(e)}`, `(The exact answer, ${num(a * b)}, is close.)`] }; }
    if (f === 'quotient') { const dv = randInt(3, 9), q = randInt(2, 9) * 10, n = dv * q + randInt(1, dv - 1) * pick([1, -1]);
      return { topic: 'ESTIMATION', text: `Which is the best estimate of ${num(n)} ÷ ${dv}?`, ...nums(q, [q * 10, q / 10, n - dv], num, 10),
        steps: [`Pick a nearby number that ${dv} divides evenly: ${num(dv * q)}`, `${num(dv * q)} ÷ ${dv} = ${q}`] }; }
    if (f === 'decimal') { const X = round(10 * randInt(1, 9) + pick([-.3, -.2, -.1, .1, .2, .3]), 1), Y = round(randInt(2, 9) + pick([-.2, -.1, .1, .2]), 1), e = Math.round(X) * Math.round(Y);
      return { topic: 'ESTIMATION', text: `Which is the best estimate of ${num(X)} × ${num(Y)}?`, ...nums(e, [e * 10, e / 10, Math.round(X) + Math.round(Y)], num, 10),
        steps: [`Round each to a whole number: ${num(X)} → ${Math.round(X)}, ${num(Y)} → ${Math.round(Y)}`, `${Math.round(X)} × ${Math.round(Y)} = ${e}`] }; }
    if (f === 'money') { const ps = [0, 1, 2].map(() => randInt(1, 12) + pick([.05, .1, .15, .2, .8, .85, .9, .95])), e = ps.reduce((s, p) => s + Math.round(p), 0);
      return { topic: 'ESTIMATION', text: `${who()} buys things that cost ${ps.map(p => money(p)).join(', ')}. About how much is that in all?`, ...nums(e, [e - 4, e + 4, e * 10].filter(v => v > 0), v => '$' + num(v), 1),

        steps: [`Round each to the nearest dollar: ${ps.map(p => '$' + Math.round(p)).join(' + ')}`, `= $${e}`, `(Exactly: ${money(ps.reduce((s, p) => s + p, 0))}.)`] }; }
    if (f === 'tip') { const B = round(randInt(2, 9) * 10 + pick([-.35, -.25, .2, .45, -1.05, 1.1, .8]), 2), R = Math.round(B / 10) * 10, p = pick([10, 15, 20]), e = R * p / 100;
      return { topic: 'ESTIMATION', text: `A meal costs ${money(B)}. About how much is a ${p}% tip?`, ...nums(e, [e / 10, p === 10 ? R / 5 : R / 10, p, e * 2].filter(v => Math.abs(v - e) > 1e-9), v => money(v), .5),
        steps: [`Round the bill: ${money(B)} is about $${R}.`, `10% of $${R} is ${money(R / 10)}.`, p === 10 ? `So the tip is about ${money(e)}.` : p === 15 ? `15% is 10% plus half of that: ${money(R / 10)} + ${money(R / 20)} = ${money(e)}` : `20% is double that: ${money(e)}`] }; }
    if (f === 'percent') { const [sp, np] = pick([[49, 50], [51, 50], [24, 25], [26, 25], [9, 10], [11, 10], [74, 75], [19, 20], [21, 20]]), Nn = 20 * randInt(2, 10), N = Nn + pick([-2, -1, 1, 2]), e = Nn * np / 100;
      return { topic: 'ESTIMATION', text: `Which is the best estimate of ${sp}% of ${N}?`, ...nums(e, [Nn * np / 10, Nn - e, e + Nn / 10].filter(v => v !== e), num, 1),
        steps: [`${sp}% is close to ${np}%, and ${N} is close to ${Nn}.`, `${np}% of ${Nn} = ${num(e)}`] }; }
    if (f === 'root') { const k1 = randInt(3, 9), k2 = randInt(2, 8), n1 = k1 * k1 + pick([-1, 1, 2]), n2 = k2 * k2 + pick([-1, 1]), e = k1 + k2;
      return { topic: 'ESTIMATION', text: `Which is the best estimate of √${n1} + √${n2}?`, ...nums(e, [Math.round(Math.sqrt(n1 + n2)), Math.round((n1 + n2) / 2), e + 3].filter(v => v !== e)),
        steps: [`√${n1} is about ${k1}, since ${k1}^2 = ${k1 * k1}.`, `√${n2} is about ${k2}, since ${k2}^2 = ${k2 * k2}.`, `${k1} + ${k2} = ${e}`] }; }
    const a = round(randInt(2, 4) + pick([-.2, -.1, .1, .2]), 1), b = round(randInt(2, 3) + pick([-.1, .1]), 1), p = randInt(2, 6), q = randInt(2, 5), m = Math.round(a) * Math.round(b), [mm, ee] = toSci(m * 10 ** (p + q)), right = sci(mm, ee);
    return { topic: 'ESTIMATION', text: `Which is the best estimate of (${sci(a, p)}) × (${sci(b, q)})?`, ...textual(right, [sci(mm, p * q), sci(Math.round(a) + Math.round(b), p + q), sci(mm, ee + 1), sci(mm, ee - 1), sci(mm, ee + 2)].filter(s => s !== right)),

      steps: [`Round: ${num(a)} → ${Math.round(a)} and ${num(b)} → ${Math.round(b)}`, `${Math.round(a)} × ${Math.round(b)} = ${m}; add the exponents: ${p} + ${q} = ${p + q}`, `= ${right}`] };
  }

  // ---- Time and money: elapsed time, time zones, pay
  const ZONES = [['Eastern', 'New York', 0], ['Central', 'Chicago', -1], ['Mountain', 'Denver', -2], ['Pacific', 'Los Angeles', -3]];
  // A time can end a sentence ("10:45 p.m."), so drop the doubled period that follows.
  function timeAndPay(d, g) {
    const q = timePay0(d, g), fix = s => s.replace(/m\.\./g, 'm.');
    q.text = fix(q.text); q.steps = q.steps.map(fix);
    return q;
  }
  function timePay0(d, g) {
    const f = pick(g === 6 ? (d < 2 ? ['end', 'elapsed', 'pay'] : ['end', 'elapsed', 'zone', 'pay', 'weekly']) : ['elapsed', 'zone', 'flight', 'pay', 'overtime', 'rate']);
    const S = randInt(7, 19) * 60 + 5 * randInt(0, 11), D = randInt(1, 3) * 60 + 5 * randInt(1, 11), E = S + D;
    if (f === 'end') return { topic: 'TIME', text: `${who()}'s ${pick(['movie', 'soccer practice', 'road trip', 'robot contest'])} starts at ${clockStr(S)} and lasts ${dur(D)}. When does it end?`,
      ...textual(clockStr(E), [clockStr(E + 60), clockStr(E - 60), clockStr(E + 40), clockStr(E - 20), clockStr(E + 10)]),
      steps: [`Add the hours: ${clockStr(S)} + ${Math.floor(D / 60)} hr = ${clockStr(S + Math.floor(D / 60) * 60)}`, `Add the minutes: + ${D % 60} min = ${clockStr(E)}`] };
    if (f === 'elapsed') {
      const naive = (Math.floor(E / 60) - Math.floor(S / 60)) * 60 + Math.abs(E % 60 - S % 60);
      return { topic: 'TIME', text: `${who()} started a ${pick(['hike', 'science fair', 'video game marathon', 'trip to the zoo'])} at ${clockStr(S)} and finished at ${clockStr(E)}. How long did it take?`,
        ...textual(dur(D), [dur(naive), dur(D + 60), dur(Math.max(5, D - 60)), dur(D + 40), dur(D - 5)].filter(s => s !== dur(D))),
        steps: [`From ${clockStr(S)} to ${clockStr(S + Math.floor(D / 60) * 60)} is ${Math.floor(D / 60)} hr.`, `Then ${D % 60} more minutes to ${clockStr(E)}.`, `Total: ${dur(D)}`] };
    }
    if (f === 'zone' || f === 'flight') {
      const [i, j] = sample([0, 1, 2, 3], 2), [zi, ci, oi] = ZONES[i], [zj, cj, oj] = ZONES[j], T = randInt(6, 18) * 60 + pick([0, 15, 30, 45]), diff = oj - oi, H = Math.abs(diff);
      if (f === 'zone') return { topic: 'TIME ZONES', text: `It is ${clockStr(T)} in ${ci} (${zi} time). What time is it in ${cj} (${zj} time)?`,
        ...textual(clockStr(T + diff * 60), [clockStr(T - diff * 60), clockStr(T), clockStr(T + diff * 60 + 60), clockStr(T + diff * 60 - 60)]),
        steps: [`Going west, clocks are earlier; going east, later.`, `${cj} is ${H} ${plural(H, 'hour', 'hours')} ${diff < 0 ? 'behind' : 'ahead of'} ${ci}.`, `${clockStr(T)} ${diff < 0 ? '-' : '+'} ${H} = ${clockStr(T + diff * 60)}`] };
      const fl = randInt(2, 5) * 60 + pick([0, 15, 30]), land = T + fl + diff * 60;
      return { topic: 'TIME ZONES', text: `A flight leaves ${ci} at ${clockStr(T)} ${zi} time and takes ${dur(fl)}. What time is it in ${cj} (${zj} time) when it lands?`,
        ...textual(clockStr(land), [clockStr(T + fl), clockStr(T + fl - diff * 60), clockStr(land + 60), clockStr(land - 60)]),
        steps: [`In ${ci} time it lands at ${clockStr(T)} + ${dur(fl)} = ${clockStr(T + fl)}.`, `${cj} is ${H} ${plural(H, 'hour', 'hours')} ${diff < 0 ? 'behind' : 'ahead'}.`, `So it is ${clockStr(land)} there.`] };
    }
    if (f === 'pay') { const h = randInt(3, 9) + pick([0, .5]), w = randInt(9, 20) + pick(h % 1 ? [0, .5] : [0, .25, .5, .75]), T = round(w * h);
      return { topic: 'MONEY', text: `${who()} earns ${money(w)} an hour and works ${num(h)} hours. How much is that?`, ...nums(T, [round(w + h), round(w * Math.floor(h)), round(T + w)].filter(v => Math.abs(v - T) > .005), money, 1),
        steps: ['Pay = hourly rate × hours', `${money(w)} × ${num(h)} = ${money(T)}`] }; }
    if (f === 'weekly') { const w = randInt(9, 15), hs = [randInt(2, 5), randInt(2, 6) + .5, randInt(3, 8)], H = hs[0] + hs[1] + hs[2], T = w * H;
      return { topic: 'MONEY', text: `${who()} earns $${w} an hour at the pet shop and works ${num(hs[0])}, ${num(hs[1])} and ${num(hs[2])} hours this week. What is the pay for the week?`,
        ...nums(T, [w * (H - .5), w + H, w * hs[2]].filter(v => v !== T), money, w), steps: [`Hours: ${hs.map(num).join(' + ')} = ${num(H)}`, `${num(H)} × $${w} = ${money(T)}`] }; }
    if (f === 'overtime') { const w = randInt(10, 20) * (d >= 3 ? 1 : 1), H = randInt(42, 50), T = 40 * w + (H - 40) * w * 1.5;
      return { topic: 'MONEY', text: `${who()} earns $${w} an hour and 1.5 times that for each hour over 40. How much is the pay for a ${H}-hour week?`,
        ...nums(T, [H * w, 40 * w + (H - 40) * w * 2, 40 * w, H * w * 1.5].filter(v => v !== T), money, w),
        steps: [`First 40 hours: 40 × $${w} = ${money(40 * w)}`, `Overtime: ${H - 40} × ${money(w * 1.5)} = ${money((H - 40) * w * 1.5)}`, `Total: ${money(T)}`] }; }
    const h = randInt(4, 9) + pick([0, .5]), w = randInt(9, 20) + pick(h % 1 ? [0, .5] : [0, .25, .5]), T = round(w * h);
    return { topic: 'MONEY', text: `${who()} earned ${money(T)} for ${num(h)} hours of work. What is the hourly rate?`, ...nums(w, [round(T - h), round(T / (h + 1)), round(w + 1)], money, .25),
      steps: ['Hourly rate = pay ÷ hours', `${money(T)} ÷ ${num(h)} = ${money(w)}`] };
  }

  // ---- Data: choosing a measure or a graph, misleading graphs, circle graphs
  function dataChoices(d, g) {
    const f = pick(g === 6 ? ['measure', 'graph', 'misleading'] : ['measure', 'graph', 'misleading', 'circle', 'circle']);
    if (f === 'measure') {
      const [S, ans] = pick([['A shoe store wants to know which shoe size it sells the most.', 'mode'], ['House prices on a street, in thousands: 210, 225, 230, 240 and one mansion at 1,200. Which best shows a typical price?', 'median'],
        [`Quiz scores with no outliers: 82, 85, 88, 90, 85. ${who()} wants one number that uses every score.`, 'mean'], ['A coach wants to know the gap between the shortest and tallest players.', 'range'],
        ['The ages at a party: 10, 11, 11, 12, 12, 13, 45. Which best describes a typical age?', 'median'], ['A pizza place wants to know which topping people order most.', 'mode']]);
      return { topic: 'DATA', text: `${S} Which measure fits best?`, ...fixed(['mean', 'median', 'mode', 'range'], ans),
        steps: ['Mode: the most common value. Range: the spread from least to greatest.', 'Mean: uses every value; an outlier pulls it. Median: the middle; outliers barely move it.', `So: the ${ans}.`] };
    }
    if (f === 'graph') {
      const T = [["how a puppy's weight changed each month", 'line graph'], ['how many students chose each kind of pizza', 'bar graph'], ['what part of a budget goes to rent, food and fun', 'circle graph'],
        ['how many test scores fall in each 10-point range', 'histogram'], ...(g >= 7 ? [['whether taller players score more points', 'scatter plot']] : [])];
      const [S, ans] = pick(T), all = ['line graph', 'bar graph', 'circle graph', 'histogram', ...(g >= 7 ? ['scatter plot'] : ['pictograph'])];
      return { topic: 'DATA', text: `Which kind of graph would best show ${S}?`, ...textual(ans, shuffle(all.filter(s => s !== ans))),
        steps: ['Change over time: line graph. Compare groups: bar graph. Parts of a whole: circle graph.', 'Counts in number ranges: histogram. Two number variables: scatter plot.', `So: a ${ans}.`] };
    }
    if (f === 'misleading') {
      const a0 = pick([20, 40, 50, 80, 100]), vA = a0 + randInt(1, 2), vB = vA + randInt(2, 3), [what] = pick([['juice boxes sold'], ['votes for class president'], ['goals scored']]);
      return { topic: 'DATA', text: `The bar graph shows ${what} by teams X and Y. Why does it make Y look much bigger than X?`,
        ...textual(`The scale starts at ${a0}, not at 0.`, ['The bars are different colors.', 'The bars are too wide.', 'Y really is 3 times as big.', 'The graph has no title.']),
        steps: [`The scale starts at ${a0}, so only the tops of the bars show.`, `Really X is ${vA} and Y is ${vB}: only ${vB - vA} apart.`],
        size: [96, 56], fig: (c, w, h) => {
          const base = h - 10, top = 4, left = 20, vmax = a0 + 6, Y = v => Math.round(base - (v - a0) / (vmax - a0) * (base - top));
          for (let v = a0; v <= vmax; v += 2) { F.line(c, left, Y(v), w - 2, Y(v), GRID); L(c, String(v), left - 3, Y(v) + 1, DIM, 'right'); }
          [[vA, 'X', BLU], [vB, 'Y', HOT]].forEach(([v, lab, col], i) => { const x = left + 10 + i * 32; F.box(c, x, Y(v), 20, base - Y(v), col); L(c, lab, x + 10, base + 6, DIM); });
        } };
    }
    const shares = pick([[50, 25, 15, 10], [40, 30, 20, 10], [45, 25, 20, 10], [35, 30, 25, 10], [60, 20, 15, 5]]), N = pick([40, 60, 80, 100, 120, 200, 300]);
    const cats = [['BUS', 'ride the bus'], ['WALK', 'walk'], ['CAR', 'come by car'], ['BIKE', 'bike']], i = randInt(0, 3), cols = [BLU, GRN, HOT, '#d05050'];
    const angle = d >= 3 && rand() < .4, ans = angle ? shares[i] * 3.6 : N * shares[i] / 100;
    return { topic: 'CIRCLE GRAPHS', text: angle ? `The circle graph shows how students get to school. How many degrees is the ${cats[i][0].toLowerCase()} section?` : `The circle graph shows how ${N} students get to school. How many ${cats[i][1]}?`,
      ...nums(ans, angle ? [shares[i], 360 - ans, shares[i] * 3] : [shares[i], N - ans, ans * 2].filter(v => v !== ans), num, angle ? 18 : 2),
      steps: angle ? [`The whole circle is 360°.`, `${shares[i]}% of 360 = ${num(shares[i] / 100)} × 360 = ${num(ans)}°`] : [`${cats[i][0]} is ${shares[i]}% of the circle.`, `${shares[i]}% of ${N} = ${num(ans)}`],
      size: [128, 56], fig: (c) => pieChart(c, 28, 28, 25, shares.map((s, k) => ({ n: s, col: cols[k], lab: `${cats[k][0]} ${s}%` })), 62) };
  }

  // ---- Stem-and-leaf plots
  function stemLeaf(d, g) {
    const lo = randInt(1, g === 8 ? 6 : 5), nS = randInt(3, 4), data = [];
    for (let s = lo; s < lo + nS; s++) { const k = randInt(1, 5); for (let i = 0; i < k; i++) data.push(s * 10 + randInt(0, 9)); }
    if (data.length % 2 === 0) data.push(lo * 10 + randInt(0, 9));
    data.sort((a, b) => a - b);
    const n = data.length, [ctx, unit] = pick([['points scored in each game', 'points'], ['minutes each student read', 'minutes'], ['ages of the people at the pool', 'years old'], ['test scores', 'points']]);
    const f = pick(d < 2 ? ['count', 'max', 'meaning'] : ['count', 'range', 'median', 'atleast', 'meaning']);
    const base = { topic: 'STEM AND LEAF', size: [100, 26 + nS * 10], fig: (c, w, h) => {
      L(c, 'STEM', 24, 5, HOT, 'right'); L(c, 'LEAF', 32, 5, HOT, 'left'); F.line(c, 28, 1, 28, 10 + nS * 10, DIM); F.line(c, 2, 10, w - 2, 10, DIM);
      for (let s = lo; s < lo + nS; s++) { const y = 16 + (s - lo) * 10; L(c, String(s), 24, y, INK, 'right'); L(c, data.filter(v => Math.floor(v / 10) === s).map(v => v % 10).join(' '), 32, y, INK, 'left'); }
      L(c, `KEY: ${lo}|${data[0] % 10} = ${lo}${data[0] % 10}`, w / 2, h - 5, DIM);
    } }, intro = `The stem-and-leaf plot shows ${ctx}.`;
    if (f === 'count') return { ...base, text: `${intro} How many values are there?`, ...nums(n, [nS, n - 1, n + nS].filter(v => v !== n)), steps: ['Each leaf is one value.', `Count the leaves: ${n}`] };
    if (f === 'max') return { ...base, text: `${intro} What is the greatest value?`, ...nums(data[n - 1], [data[n - 1] % 10, lo + nS - 1, data[n - 2]].filter(v => v !== data[n - 1])), steps: ['The greatest is the last leaf on the last stem.', `${Math.floor(data[n - 1] / 10)}|${data[n - 1] % 10} = ${data[n - 1]}`] };
    if (f === 'meaning') { const v = pick(data); return { ...base, text: `${intro} What does ${Math.floor(v / 10)}|${v % 10} stand for?`, ...textual(`${v} ${unit}`, [`${v % 10}${Math.floor(v / 10)} ${unit}`, `${Math.floor(v / 10) + v % 10} ${unit}`, `${Math.floor(v / 10)}.${v % 10} ${unit}`, `${v + 10} ${unit}`, `${Math.floor(v / 10)} ${unit}`].filter(s => s !== `${v} ${unit}`)),
      steps: ['The stem is the tens digit; the leaf is the ones digit.', `${Math.floor(v / 10)}|${v % 10} means ${v}.`] }; }
    if (f === 'range') { const r = data[n - 1] - data[0]; return { ...base, text: `${intro} What is the range?`, ...nums(r, [data[n - 1], nS, (lo + nS - 1) - lo].filter(v => v !== r)), steps: [`Greatest: ${data[n - 1]}. Least: ${data[0]}.`, `${data[n - 1]} - ${data[0]} = ${r}`] }; }
    if (f === 'median') { const m = data[(n - 1) / 2]; return { ...base, text: `${intro} What is the median?`, ...nums(m, [data[(n - 1) / 2 + 1], data[(n - 1) / 2 - 1], Math.round((data[0] + data[n - 1]) / 2)].filter(v => v !== m)), steps: [`There are ${n} values; the middle one is number ${(n + 1) / 2}.`, `Counting leaves in order, it is ${m}.`] }; }
    const k = (lo + 1) * 10 + randInt(0, 9), ans = data.filter(v => v >= k).length;
    return { ...base, text: `${intro} How many are ${k} or more?`, ...nums(ans, [data.filter(v => v > k).length, n - ans, ans + 1].filter(v => v !== ans)), steps: [`Count the values from ${k} up.`, `There are ${ans}.`] };
  }

  // ---- Counting, permutations, combinations and odds
  function countingOdds(d, g) {
    const f = pick(g === 7 ? (d < 3 ? ['principle', 'odds', 'arrange'] : ['principle', 'odds', 'arrange', 'places', 'oddsProb']) : d < 3 ? ['principle', 'arrange', 'places', 'odds', 'code'] : ['places', 'choose', 'choose', 'oddsProb', 'code']);
    if (f === 'principle') { const a = randInt(2, 6), b = randInt(2, 5), c = randInt(2, 6);
      return { topic: 'COUNTING', text: `A combo meal has a choice of ${a} burgers, ${b} sides and ${c} drinks. How many different meals are there?`, ...nums(a * b * c, [a + b + c, a * b, a * b + c].filter(v => v !== a * b * c)),
        steps: ['Counting principle: multiply the number of choices.', `${a} × ${b} × ${c} = ${a * b * c}`] }; }
    if (f === 'arrange') { const n = randInt(3, 6);
      return { topic: 'COUNTING', text: `In how many different orders can ${n} friends line up for a photo?`, ...nums(fact(n), [n * n, n * (n - 1), n * (n + 1) / 2, n].filter(v => v !== fact(n))),
        steps: [`${n} choices for 1st, ${n - 1} for 2nd, and so on.`, `${[...Array(n).keys()].map(k => n - k).join(' × ')} = ${fact(n)}`] }; }
    if (f === 'places') { const n = randInt(5, 10), k = d < 3 ? 2 : 3, P = fact(n) / fact(n - k);
      return { topic: 'COUNTING', text: `${n} runners are in a race. In how many ways can ${k === 2 ? '1st and 2nd' : '1st, 2nd and 3rd'} place be given out?`, ...nums(P, [n ** k, n * k, choose(n, k)].filter(v => v !== P)),
        steps: [`${n} choices for 1st, then ${n - 1} for 2nd${k === 3 ? `, then ${n - 2} for 3rd` : ''}.`, `${[...Array(k).keys()].map(i => n - i).join(' × ')} = ${P}`] }; }
    if (f === 'choose') { const n = randInt(5, 9), k = pick([2, 3]), Cn = choose(n, k), Pn = fact(n) / fact(n - k);
      return { topic: 'COUNTING', text: `A club of ${n} must pick ${k} members to plan a party. Order does not matter. How many different groups are possible?`, ...nums(Cn, [Pn, n * k, n ** k].filter(v => v !== Cn)),
        steps: [`In order there would be ${[...Array(k).keys()].map(i => n - i).join(' × ')} = ${Pn} ways.`, `Each group is counted ${fact(k)} times (its orders), so ${Pn} ÷ ${fact(k)}.`, `= ${Cn}`] }; }
    if (f === 'code') { const digits = randInt(2, 4), letter = rand() < .5, N = (letter ? 26 : 1) * 10 ** digits;
      return { topic: 'COUNTING', text: letter ? `A locker code is 1 letter followed by ${digits} digits (0 to 9). Repeats are allowed. How many codes are possible?` : `A lock code uses ${digits} digits (0 to 9), and digits can repeat. How many codes are possible?`,
        ...nums(N, letter ? [26 + 10 * digits, 26 * 10 * digits, 26 * fact(10) / fact(10 - digits)] : [10 * digits, fact(10) / fact(10 - digits), 9 ** digits].filter(v => v !== N)),
        steps: [letter ? '26 choices for the letter, 10 for each digit.' : '10 choices for each digit.', `${letter ? '26 × ' : ''}${Array(digits).fill(10).join(' × ')} = ${num(N)}`] }; }
    const r = randInt(2, 7), b0 = randInt(2, 9), b = b0 === r ? r + 1 : b0;
    if (f === 'oddsProb') { const p = r / (r + b);
      return { topic: 'ODDS', text: `The odds in favor of winning a prize are ${r}:${b}. What is the probability of winning?`, ...pnums(p, [r / b, b / (r + b), 1 / r].filter(v => Math.abs(v - p) > 1e-9), fs, .05),
        steps: [`Odds ${r}:${b} means ${r} wins for every ${b} losses.`, `That is ${r} out of ${r + b} in all.`, `P = ${r}/${r + b}${fs(p) !== `${r}/${r + b}` ? ' = ' + fs(p) : ''}`] }; }
    const favor = rand() < .6, right = favor ? `${r}:${b}` : `${b}:${r}`;
    return { topic: 'ODDS', text: `A bag has ${r} red and ${b} blue marbles. What are the odds ${favor ? 'in favor of' : 'against'} picking red?`, ...textual(right, [favor ? `${b}:${r}` : `${r}:${b}`, `${r}:${r + b}`, `${b}:${r + b}`, `${r + b}:${r}`]),
      steps: ['Odds in favor = ways to win : ways to lose. Odds against flips it.', `Red: ${r}. Not red: ${b}.`, `So the odds ${favor ? 'in favor' : 'against'} are ${right}.`] };
  }

  // ---- Similar figures and indirect measurement
  function similarFigures(d, g) {
    const f = pick(g === 7 ? (d < 2 ? ['missing', 'shadow'] : ['missing', 'shadow', 'factor', 'check']) : d < 3 ? ['missing', 'shadow', 'factor'] : ['missing', 'shadow', 'area', 'check']);
    if (f === 'missing') {
      const k = d < 2 ? pick([2, 3]) : pick([2, 3, 1.5, 2.5]), a = randInt(2, 6) * (k % 1 ? 2 : 1), b = randInt(2, 5) * (k % 1 ? 2 : 1), A = a * k, B = b * k;
      return { topic: 'SIMILARITY', text: 'The two right triangles are similar. What is the length of side x?', ...nums(B, [b + (A - a), A, B + 2, b * A].filter(v => v > 0 && Math.abs(v - B) > 1e-9), num, 1),
        steps: [`Scale factor: ${num(A)} ÷ ${a} = ${num(k)}`, `x = ${b} × ${num(k)} = ${num(B)}`, `(Not ${b} + ${num(A - a)}: similar shapes multiply.)`],
        size: [140, 64], fig: (c, w, h) => {
          const s = Math.min(100 / (a + A), 46 / Math.max(b, B)), y0 = h - 10;
          const tri = (x0, p, q, lp, lq) => { const P = [[x0, y0], [x0 + Math.round(p * s), y0], [x0 + Math.round(p * s), y0 - Math.round(q * s)]]; F.outlinePoly(c, P, INK); F.rightMark(c, P[1][0], y0, -1, -1); L(c, lp, (P[0][0] + P[1][0]) / 2, y0 + 7); L(c, lq, P[1][0] + 4, y0 - q * s / 2 + 1, lq === 'x' ? HOT : INK, 'left'); return P[1][0]; };
          const e = tri(4, a, b, String(a), String(b)); tri(e + 18, A, B, num(A), 'x');
        } };
    }
    if (f === 'shadow') { const h1 = pick([4, 5, 6]), s1 = pick([2, 3, 4, 8].filter(x => x !== h1)), m = randInt(2, 8), s2 = s1 * m, h2 = h1 * m, [thing] = pick([['tree'], ['flagpole'], ['building'], ['giraffe statue']]);
      return { topic: 'SIMILARITY', text: `A ${h1}-foot person casts a ${s1}-foot shadow. At the same time, a ${thing} casts a ${s2}-foot shadow. How tall is the ${thing}?`,
        ...nums(h2, [s2 + (h1 - s1), s2 * s1 / h1, h1 * s2].filter(v => v > 0 && v !== h2 && Number.isInteger(v)), num, h1),
        steps: ['Heights and shadows make similar triangles.', `${h1}/${s1} = h/${s2}`, `h = ${h1} × ${s2} ÷ ${s1} = ${h2} feet`] }; }
    if (f === 'factor') { const a = randInt(2, 8), b = a + randInt(1, 6), k = pick([2, 3, 1.5, 2.5, 4]);
      return { topic: 'SIMILARITY', text: `Rectangle A is ${a} by ${b}. Rectangle B is similar and is ${num(a * k)} by ${num(b * k)}. What is the scale factor from A to B?`,
        ...nums(k, [1 / k, a * k - a, b * k - b].filter(v => v > 0 && Math.abs(v - k) > 1e-9), v => Math.abs(round(v, 2) - v) < 1e-9 ? num(v) : fs(v), .5), steps: ['Scale factor = new length ÷ old length', `${num(a * k)} ÷ ${a} = ${num(k)}`] }; }
    if (f === 'area') { const k = pick([2, 3, 4, 1.5]), A = randInt(3, 20) * (k === 1.5 ? 4 : 1);
      return { topic: 'SIMILARITY', text: `Two similar triangles have a scale factor of ${num(k)}. The smaller one has an area of ${A} square inches. What is the area of the larger one?`,
        ...nums(A * k * k, [A * k, A + k, A * k * 3].filter(v => v !== A * k * k), num, A), steps: ['Areas grow by the scale factor squared.', `${num(k)}^2 = ${num(k * k)}`, `${A} × ${num(k * k)} = ${num(A * k * k)}`] }; }
    const a = randInt(2, 6), b = a + randInt(1, 5), k = pick([1.5, 2, 3]), yes = rand() < .5, c2 = a * k, d2 = yes ? b * k : b * k + pick([1, 2, -1]);
    return { topic: 'SIMILARITY', text: `Is a ${a} by ${b} rectangle similar to a ${num(c2)} by ${num(d2)} rectangle?`,
      ...textual(yes ? `Yes: both sides grow by ${num(k)}` : 'No: the sides grow by different amounts', yes ? ['No: the sides grow by different amounts', 'No: one is bigger', `Yes: both add ${num(c2 - a)}`] : [`Yes: both sides grow by ${num(k)}`, `Yes: both add ${num(c2 - a)}`, 'Yes: all rectangles are similar']),
      steps: [`${num(c2)} ÷ ${a} = ${num(k)}`, `${num(d2)} ÷ ${b} = ${num(d2 / b)}`, yes ? 'Same factor: similar.' : 'Different factors: not similar.'] };
  }

  // ---- Classifying angles, triangles, quadrilaterals and polygons
  const PNAME = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' };
  function classifyShapes(d, g) {
    const f = pick(g === 6 ? (d < 2 ? ['angle', 'polygon', 'triSides'] : ['angle', 'triSides', 'triAngles', 'quad', 'polygon']) : ['triSides', 'triAngles', 'quad', 'always', 'angle']);
    if (f === 'angle') {
      const kind = pick(['acute', 'right', 'obtuse', 'straight']), m = { acute: randInt(3, 16) * 5, right: 90, obtuse: randInt(20, 34) * 5, straight: 180 }[kind];
      return { topic: 'ANGLES', text: 'What kind of angle is shown?', ...fixed(['acute', 'right', 'obtuse', 'straight'], kind),
        steps: ['Acute: less than 90°. Right: exactly 90°.', 'Obtuse: between 90° and 180°. Straight: exactly 180°.', `This one is ${m}°: ${kind}.`],
        size: [96, 52], fig: (c, w, h) => {
          const V = [kind === 'straight' || kind === 'obtuse' ? 54 : 18, h - 10], R = kind === 'straight' ? 40 : 34; ray(c, ...V, 0, R); ray(c, ...V, m, R);
          if (kind === 'right') F.rightMark(c, V[0], V[1], 1, -1, HOT); else F.arc(c, V[0], V[1], 9, 0, m * DEG, HOT);
          L(c, m + '°', ...((p) => [p[0], p[1] + 1])(at(...V, m / 2, kind === 'straight' ? 14 : 20)), HOT);
        } };
    }
    if (f === 'triSides') {
      const kind = pick(['equilateral', 'isosceles', 'scalene', 'none']), s = randInt(3, 12);
      let sides = kind === 'equilateral' ? [s, s, s] : kind === 'isosceles' ? [s, s, randInt(Math.max(1, s - 4), Math.min(2 * s - 1, s + 4))] : kind === 'scalene' ? (() => { const a = randInt(3, 9), b = a + randInt(1, 4); return [a, b, b + randInt(1, a - 1)]; })() : (() => { const a = randInt(2, 6), b = randInt(2, 6); return [a, b, a + b + randInt(1, 5)]; })();
      if (kind === 'isosceles' && sides[2] === s) sides[2] = s - 1;
      sides = shuffle(sides);
      const ans = kind === 'none' ? 'not a triangle' : kind;
      return { topic: 'TRIANGLES', text: `Sticks of ${sides.join(', ')} cm are joined end to end. What kind of triangle do they make?`, ...fixed(['equilateral', 'isosceles', 'scalene', 'not a triangle'], ans),
        steps: ['Equilateral: 3 equal sides. Isosceles: 2 equal sides. Scalene: none equal.', 'The two shorter sides must add to more than the longest.', `So: ${ans}.`] };
    }
    if (f === 'triAngles') {
      const kind = pick(['acute', 'right', 'obtuse', 'none']);
      let A = kind === 'acute' ? (() => { const a = randInt(50, 80), b = randInt(100 - a + 1, 89); return [a, b, 180 - a - b]; })() : kind === 'right' ? (() => { const a = randInt(15, 75); return [90, a, 90 - a]; })()
        : kind === 'obtuse' ? (() => { const o = randInt(95, 150), a = randInt(5, 180 - o - 5); return [o, a, 180 - o - a]; })() : (() => { const a = randInt(40, 80), b = randInt(40, 80); return [a, b, 180 - a - b + pick([10, 20, -10, 15])]; })();
      if (kind === 'acute' && A[2] >= 90) A = [60, 70, 50];
      A = shuffle(A); const ans = kind === 'none' ? 'not possible' : kind;
      return { topic: 'TRIANGLES', text: `A triangle has angles of ${A.join('°, ')}°. What kind of triangle is it?`, ...fixed(['acute', 'right', 'obtuse', 'not possible'], ans),
        steps: [`The angles of a triangle must add to 180°: ${A.join(' + ')} = ${A[0] + A[1] + A[2]}.`, kind === 'none' ? 'They do not, so it is not possible.' : 'Acute: all under 90°. Right: one is 90°. Obtuse: one is over 90°.', `So: ${ans}.`] };
    }
    if (f === 'quad') {
      const Q = [['exactly one pair of parallel sides', 'trapezoid'], ['four right angles and four equal sides', 'square'], ['four right angles, but sides that are not all equal', 'rectangle'],
        ['four equal sides, but no right angles', 'rhombus'], ['two pairs of equal sides next to each other, and no parallel sides', 'kite'], ['two pairs of parallel sides, no right angles, and sides not all equal', 'parallelogram']];
      const [S, ans] = pick(Q);
      return { topic: 'QUADRILATERALS', text: `Which quadrilateral has ${S}?`, ...textual(ans, shuffle(Q.map(q => q[1]).filter(n => n !== ans))),
        steps: ['Parallelograms have 2 pairs of parallel sides; trapezoids have 1.', 'Rectangles have right angles, rhombuses equal sides, squares both.', `So: a ${ans}.`] };
    }
    if (f === 'polygon') { const n = pick([3, 4, 5, 6, 7, 8, 9, 10]), right = PNAME[n];
      return { topic: 'POLYGONS', text: `What do we call a polygon with ${n} sides?`, ...textual(right, shuffle(Object.values(PNAME).filter(s => s !== right))),
        steps: ['tri = 3, quad = 4, penta = 5, hexa = 6, hepta = 7, octa = 8, nona = 9, deca = 10', `${n} sides: ${right}`] }; }
    const T = ['Every square is a rectangle.', 'Every square is a rhombus.', 'Every rectangle is a parallelogram.', 'An equilateral triangle is also isosceles.'];
    const Fa = ['Every rectangle is a square.', 'Every rhombus is a square.', 'Every trapezoid is a parallelogram.', 'A right triangle can have two right angles.', 'Every parallelogram is a rectangle.', 'A triangle can have two obtuse angles.'];
    const right = pick(T);
    return { topic: 'SHAPES', text: 'Which statement is always true?', ...textual(right, sample(Fa, 4)), steps: ['Check each one against the definitions.', `${right} That one always works.`] };
  }

  // ---- Polygon angle sums
  function polygonAngles(d, g) {
    const f = pick(g === 7 ? (d < 3 ? ['quad', 'sum'] : ['quad', 'sum', 'regular']) : d < 2 ? ['quad', 'sum', 'regular'] : ['sum', 'regular', 'exterior', 'sides', 'missing']);
    if (f === 'quad') { const a = randInt(60, 120), b = randInt(60, 120), c = randInt(50, Math.min(130, 330 - a - b)), x = 360 - a - b - c;
      return { topic: 'POLYGONS', text: `Three angles of a quadrilateral are ${a}°, ${b}° and ${c}°. What is the fourth angle?`, ...nums(x, [180 - (a + b + c) + 360 > 0 ? Math.abs(180 - a - b - c) : x + 10, x + 10, 540 - a - b - c].filter(v => v > 0 && v !== x)),
        steps: ['The angles of a quadrilateral add to 360°.', `${a} + ${b} + ${c} = ${a + b + c}`, `360 - ${a + b + c} = ${x}°`] }; }
    if (f === 'sum') { const n = randInt(5, 12) === 11 ? 12 : randInt(5, 10), S = (n - 2) * 180;
      return { topic: 'POLYGONS', text: `What is the sum of the inside angles of ${n === 8 ? 'an' : 'a'} ${PNAME[n]} (${n} sides)?`, ...nums(S, [n * 180, (n - 1) * 180, 360].filter(v => v !== S), num, 180),
        steps: [`From one corner, a ${n}-gon splits into ${n - 2} triangles.`, `(${n} - 2) × 180 = ${num(S)}°`] }; }
    const n = pick([5, 6, 8, 9, 10, 12]), I = (n - 2) * 180 / n, E = 360 / n;
    if (f === 'regular') return { topic: 'POLYGONS', text: `What is the measure of each inside angle of a regular ${PNAME[n]}?`, ...nums(I, [(n - 2) * 180, E, 180 - I / 2].filter(v => Number.isInteger(v) && v !== I), num, 10),
      steps: [`Sum of the angles: (${n} - 2) × 180 = ${num((n - 2) * 180)}°`, `All ${n} are equal: ${num((n - 2) * 180)} ÷ ${n} = ${num(I)}°`] };
    if (f === 'exterior') return { topic: 'POLYGONS', text: `What is the measure of each outside (exterior) angle of a regular ${PNAME[n]}?`, ...nums(E, [I, 360, 180 / n].filter(v => Number.isInteger(v) && v !== E), num, 5),
      steps: ['The exterior angles of any polygon add to 360°.', `360 ÷ ${n} = ${num(E)}°`] };
    if (f === 'sides') return { topic: 'POLYGONS', text: `Each inside angle of a regular polygon is ${num(I)}°. How many sides does it have?`, ...nums(n, [n - 1, n + 1, Math.round(I / 10)].filter(v => v > 2 && v !== n)),
      steps: [`Each outside angle: 180 - ${num(I)} = ${num(E)}°`, `They add to 360°: 360 ÷ ${num(E)} = ${n} sides`] };
    for (let t = 0; t < 30; t++) { const A = [randInt(90, 130), randInt(90, 130), randInt(95, 140), randInt(85, 125)], x = 540 - A.reduce((s, v) => s + v, 0);
      if (x < 60 || x > 170) continue;
      return { topic: 'POLYGONS', text: `Four angles of a pentagon are ${A.join('°, ')}°. What is the fifth angle?`, ...nums(x, [360 - A.reduce((s, v) => s + v, 0) + 180 > 0 ? x - 180 + 360 : x + 20, x + 20, 720 - A.reduce((s, v) => s + v, 0)].filter(v => v > 0 && v !== x && v < 400)),
        steps: ['A pentagon\'s angles add to (5 - 2) × 180 = 540°.', `${A.join(' + ')} = ${540 - x}`, `540 - ${540 - x} = ${x}°`] }; }
    return polygonAngles(1, 8);
  }

  // ---- Parts of a circle
  function circleParts(d) {
    const f = pick(d < 2 ? ['name', 'name', 'rd'] : ['name', 'rd', 'central']);
    if (f === 'name') {
      const ask = pick([['a radius', 'segment OP'], ['a diameter', 'segment QR'], ['a chord that is not a diameter', 'segment ST'], ['the center', 'point O']]);
      return { topic: 'CIRCLES', text: `In the circle, which is ${ask[0]}?`, ...fixed(['segment OP', 'segment QR', 'segment ST', 'point O'], ask[1]),
        steps: ['Radius: center to the circle. Diameter: across through the center.', 'Chord: any segment with both ends on the circle.', `So ${ask[0]} is ${ask[1]}.`],
        size: [80, 64], fig: (c, w, h) => {
          const cx = 40, cy = 32, r = 25, A = t => at(cx, cy, t, r), B = t => at(cx, cy, t, r + 7);
          F.circle(c, cx, cy, r, INK); F.line(c, cx, cy, ...A(70), HOT); F.line(c, ...A(195), ...A(15), BLU); F.line(c, ...A(240), ...A(320), GRN); F.dot(c, [cx, cy], INK);
          [['O', [cx - 1, cy + 7]], ['P', B(70)], ['Q', B(195)], ['R', B(15)], ['S', B(240)], ['T', B(320)]].forEach(([s, p]) => L(c, s, p[0], p[1] + 1, INK));
        } };
    }
    if (f === 'rd') { const r = randInt(2, 25), toD = rand() < .5;
      return { topic: 'CIRCLES', text: toD ? `A circle's radius is ${r} cm. How long is its diameter?` : `A circle's diameter is ${2 * r} cm. How long is its radius?`, ...nums(toD ? 2 * r : r, toD ? [r / 2, r + 2, r * r] : [4 * r, 2 * r - 2, r + 2].filter(v => Number.isInteger(v)), num),
        steps: ['The diameter is twice the radius.', toD ? `2 × ${r} = ${2 * r} cm` : `${2 * r} ÷ 2 = ${r} cm`] }; }
    const n = pick([3, 4, 5, 6, 8, 9, 10, 12]);
    return { topic: 'CIRCLES', text: `A pizza is cut from the center into ${n} equal slices. What angle does each slice make at the center?`, ...nums(360 / n, [180 / n, (n - 2) * 180 / n, 360 - 360 / n].filter(v => Number.isInteger(v) && v !== 360 / n), num, 5),
      steps: ['All the way around the center is 360°.', `360 ÷ ${n} = ${360 / n}°`] };
  }

  // ---- Measurement: customary and metric, temperature, dimensional analysis, precision
  function unitConversions(d, g) {
    const f = pick(g === 7 ? (d < 2 ? ['temp', 'metric'] : ['temp', 'metric', 'rate', 'precision']) : ['rate', 'area', 'temp', 'precision', 'metric']);
    if (f === 'temp') { const toF = rand() < .5, C = randInt(-4, 20) * 5, Fv = 9 * C / 5 + 32;
      if (toF) return { topic: 'TEMPERATURE', text: `It is ${C}°C. What is that in °F? Use F = (9/5)C + 32.`, ...nums(Fv, [9 * C / 5, round(5 * C / 9 + 32, 1), 9 * (C + 32) / 5, C + 32].filter(v => v !== Fv), num, 1),
        steps: [`F = (9/5)(${C}) + 32`, `= ${num(9 * C / 5)} + 32 = ${num(Fv)}°F`] };
      return { topic: 'TEMPERATURE', text: `It is ${Fv}°F. What is that in °C? Use C = (5/9)(F - 32).`, ...nums(C, [round(5 * Fv / 9 - 32, 1), Fv - 32, round(9 * (Fv - 32) / 5, 1)].filter(v => v !== C), num, 1),
        steps: [`Subtract 32 first: ${Fv} - 32 = ${Fv - 32}`, `(5/9) × ${Fv - 32} = ${C}°C`] }; }
    if (f === 'metric') {
      const n = randInt(2, 12) * 5, m = randInt(2, 20), [S, ans, wr, st] = pick([
        [`1 inch is 2.54 cm. How many centimeters is ${m} inches?`, round(2.54 * m, 2), [round(m / 2.54, 2), round(m + 2.54, 2), round(25.4 * m, 1)], [`${m} × 2.54`, `= ${num(2.54 * m)} cm`]],
        [`1 mile is about 1.6 km. About how many kilometers is ${n} miles?`, round(1.6 * n, 1), [round(n / 1.6, 1), n + 1.6, 16 * n], [`${n} × 1.6`, `= ${num(1.6 * n)} km`]],
        [`1 kilogram is about 2.2 pounds. About how many pounds is ${n} kg?`, round(2.2 * n, 1), [round(n / 2.2, 1), n + 2.2, 22 * n], [`${n} × 2.2`, `= ${num(2.2 * n)} pounds`]],
        [`1 meter is about 3.28 feet. About how many feet is ${m} meters?`, round(3.28 * m, 2), [round(m / 3.28, 2), round(m + 3.28, 2), round(32.8 * m, 1)], [`${m} × 3.28`, `= ${num(3.28 * m)} feet`]]]);
      return { topic: 'MEASUREMENT', text: S, ...nums(ans, wr.filter(v => Math.abs(v - ans) > 1e-9), num, 1), steps: st };
    }
    if (f === 'rate') {
      const [S, ans, wr, st] = pick([
        (() => { const v = pick([15, 30, 45, 60, 75]); return [`A car goes ${v} miles per hour. How many feet per second is that? (1 mile = 5,280 feet)`, v * 22 / 15, [v * 88, v / 60, v * 5280 / 60], [`${v} miles/hour × 5,280 feet/mile = ${num(v * 5280)} feet/hour`, `÷ 3,600 seconds/hour = ${v * 22 / 15} feet per second`]]; })(),
        (() => { const v = pick([5, 10, 15, 20, 25, 30]); return [`A robot rolls ${v} feet per minute. How many inches per second is that?`, v / 5, [v * 12, v * 60 / 12, v / 12], [`${v} feet/minute × 12 inches/foot = ${v * 12} inches/minute`, `÷ 60 seconds/minute = ${num(v / 5)} inches per second`]]; })(),
        (() => { const v = pick([2, 4, 6, 8]); return [`A leaky faucet drips ${v} cups an hour. How many gallons is that in a day? (16 cups = 1 gallon)`, v * 1.5, [v * 24, v * 24 / 4, v / 16], [`${v} cups/hour × 24 hours = ${v * 24} cups a day`, `÷ 16 cups/gallon = ${num(v * 1.5)} gallons`]]; })(),
        (() => { const v = pick([3.2, 4.8, 6.4, 8]); return [`Cheese costs ${money(v)} a pound. How many cents is that per ounce? (16 ounces = 1 pound)`, v * 100 / 16, [v * 16, v * 100, v / 16 * 10], [`${money(v)} = ${num(v * 100)}¢ per pound`, `÷ 16 ounces = ${num(v * 100 / 16)}¢ per ounce`]]; })(),
        (() => { const v = pick([5, 10, 15, 20, 25]); return [`A cyclist goes ${v} meters per second. How many kilometers per hour is that?`, v * 3.6, [v * 60, v * 3600, round(v / 3.6, 2)], [`${v} m/s × 3,600 s/hour = ${num(v * 3600)} m/hour`, `÷ 1,000 m/km = ${num(v * 3.6)} km per hour`]]; })()]);
      return { topic: 'UNIT RATES', text: S, ...nums(ans, wr.filter(v => Math.abs(v - ans) > 1e-9), num, 1), steps: st };
    }
    if (f === 'area') { const n = randInt(2, 9), [S, k, lin1, big, small] = pick([['square yards', 9, 3, 'square yard', 'square feet'], ['square feet', 144, 12, 'square foot', 'square inches'], ['cubic yards', 27, 3, 'cubic yard', 'cubic feet']]);
      return { topic: 'MEASUREMENT', text: `How many ${small} are in ${n} ${S}?`, ...nums(n * k, [n * lin1, n * lin1 * 2, n * k / lin1].filter(v => v !== n * k)),
        steps: [`1 ${big} = ${lin1} × ${lin1}${k === 27 ? ` × ${lin1}` : ''} = ${k} ${small}`, `${n} × ${k} = ${n * k}`] }; }
    const X = randInt(20, 99) / 10, right = round(X + pick([-.04, -.03, .02, .04]), 2), wr = [round(X + .06, 2), round(X - .07, 2), round(X + .15, 2), round(X - .12, 2)];
    return { topic: 'MEASUREMENT', text: `A pencil is measured as ${num(X)} cm, to the nearest tenth. Which could be its exact length?`, ...nums(right, wr, v => num(v, 2) + ' cm', .1),
      steps: [`To the nearest tenth, ${num(X)} covers ${num(round(X - .05, 2), 2)} up to (not including) ${num(round(X + .05, 2), 2)}.`, `Only ${num(right, 2)} rounds to ${num(X)}.`] };
  }

  // ---- Compound interest
  function compoundInterest(d, g) {
    const P = pick([500, 800, 1000, 1200, 2000, 2500]), r = pick([2, 4, 5, 10]), t = g === 7 || d < 3 ? 2 : pick([2, 3]);
    const bal = [P]; for (let i = 0; i < t; i++) bal.push(round(bal[i] * (1 + r / 100), 2));
    const A = bal[t], simple = P + P * r * t / 100, f = pick(d < 4 ? ['balance', 'balance', 'diff'] : ['balance', 'diff', 'interest']);
    const steps = bal.slice(1).map((b, i) => `Year ${i + 1}: ${money(bal[i])} × ${num(1 + r / 100)} = ${money(b)}`);
    const intro = `${who()} puts ${money(P)} in an account that earns ${r}% interest, compounded once a year.`;
    if (f === 'balance') return { topic: 'INTEREST', text: `${intro} How much is in the account after ${t} years?`, ...nums(A, [simple, bal[t - 1], round(A + P * r / 100), round(A - 1)].filter(v => Math.abs(v - A) > .005), money, 5), steps };
    if (f === 'interest') return { topic: 'INTEREST', text: `${intro} How much interest does it earn in ${t} years?`, ...nums(round(A - P), [simple - P, A, round(P * r / 100)].filter(v => Math.abs(v - (A - P)) > .005), money, 5), steps: [...steps, `Interest: ${money(A)} - ${money(P)} = ${money(A - P)}`] };
    return { topic: 'INTEREST', text: `${intro} How much more is that after ${t} years than simple interest at ${r}% would give?`, ...nums(round(A - simple), [round(A - P), round(simple - P), round((A - simple) * 2)].filter(v => Math.abs(v - (A - simple)) > .005), money, .5),
      steps: [...steps.slice(-1), `Simple interest total: ${money(P)} + ${t} × ${money(P * r / 100)} = ${money(simple)}`, `Difference: ${money(A - simple)}`] };
  }

  // ---- Money: price lists, budgets, saving
  const MENU = [['TACO', 'taco', 'tacos', 2.25], ['BURRITO', 'burrito', 'burritos', 6.5], ['SALAD', 'salad', 'salads', 5.25], ['JUICE', 'juice', 'juices', 1.5],
    ['COOKIE', 'cookie', 'cookies', .95], ['PRETZEL', 'pretzel', 'pretzels', 1.75], ['HOT DOG', 'hot dog', 'hot dogs', 3.25], ['NACHOS', 'nachos', 'nachos', 4.5]];
  function moneyMatters(d) {
    const f = pick(d < 2 ? ['menu', 'budget'] : ['menu', 'change', 'budget', 'save']);
    if (f === 'menu' || f === 'change') {
      const items = sample(MENU, 4), [a, b] = sample(items, 2), n = randInt(2, 4), T = round(n * a[3] + b[3]), pay = Math.ceil((T + 1) / 10) * 10, ch = f === 'change';
      const fig = (c, w, h) => table(c, w, h, [['ITEM', 'PRICE'], ...items.map(it => [it[0], money(it[3])])], { first: 58 });
      return { topic: 'MONEY', text: `${who()} buys ${n} ${a[2]} and 1 ${b[1]}.${ch ? ` She pays with $${pay}. How much change does she get?` : ' How much does that cost?'}`,
        ...nums(ch ? round(pay - T) : T, ch ? [round(pay - a[3] - b[3]), T, round(pay - T - 1)] : [round(a[3] + b[3]), round(n * (a[3] + b[3])), round(T + 1)], money, .5),
        steps: [`${n} × ${money(a[3])} = ${money(n * a[3])}`, `+ ${money(b[3])} = ${money(T)}`, ...(ch ? [`$${pay} - ${money(T)} = ${money(pay - T)}`] : [])], size: [110, 56], fig };
    }
    if (f === 'budget') { const g1 = randInt(800, 2400) / 100, c1 = randInt(150, 900) / 100, k = randInt(2, 3), B = Math.ceil((g1 + k * c1 + randInt(2, 20)) / 10) * 10, left = round(B - g1 - k * c1);
      return { topic: 'MONEY', text: `${who()} has $${B}. She buys a ${money(g1)} game and ${k} comics at ${money(c1)} each. How much money is left?`,
        ...nums(left, [round(B - g1 - c1), round(B - g1 + k * c1), round(g1 + k * c1)].filter(v => v >= 0 && Math.abs(v - left) > .005), money, .5),
        steps: [`Comics: ${k} × ${money(c1)} = ${money(k * c1)}`, `Spent: ${money(g1)} + ${money(k * c1)} = ${money(g1 + k * c1)}`, `Left: $${B} - ${money(g1 + k * c1)} = ${money(left)}`] }; }
    const s = pick([4.5, 6, 7.5, 8, 12.5]), G = randInt(4, 12) * 10, wk = Math.ceil(G / s - 1e-9);
    return { topic: 'MONEY', text: `${who()} saves ${money(s)} a week for a $${G} skateboard. How many weeks until there is enough?`, ...nums(wk, [Math.floor(G / s), wk + 1, Math.round(G / 10)].filter(v => v > 0 && v !== wk)),
      steps: [`$${G} ÷ ${money(s)} = ${num(G / s)}`, Number.isInteger(G / s) ? `Exactly ${wk} weeks.` : `Round up to whole weeks: ${wk}`] };
  }

  // ---- Consumer math: coupons, commission with salary, percent markup, budgets, markdowns
  function consumerMath(d, g) {
    const f = pick(g === 7 ? ['coupon', 'commission', 'markupPct'] : ['coupon', 'commission', 'markupPct', 'successive', 'budget']);
    if (f === 'coupon') { const P = randInt(3, 15) * 10 + pick([0, 5]), pc = pick([10, 15, 20, 25, 30]), off0 = randInt(1, 6) * 5;
      const savePc = P * pc / 100, off = off0 === savePc ? off0 + 5 : off0;
      const better = savePc > off ? `${pc}% off, by ${money(savePc - off)}` : `$${off} off, by ${money(off - savePc)}`;
      return { topic: 'MONEY', text: `A $${P} jacket. Which coupon saves more: ${pc}% off, or $${off} off?`,
        ...textual(better, [savePc > off ? `$${off} off, by ${money(savePc - off)}` : `${pc}% off, by ${money(off - savePc)}`, 'They save the same', savePc > off ? `${pc}% off, by ${money(savePc)}` : `$${off} off, by $${off}`]),
        steps: [`${pc}% of $${P} = ${money(savePc)}`, `The other coupon saves ${money(off)}.`, `So ${better}.`] }; }
    if (f === 'commission') { const B = pick([300, 350, 400, 500]), r = pick([3, 4, 5, 6, 8, 10]), S = randInt(10, 60) * 100, T = B + S * r / 100;
      return { topic: 'MONEY', text: `${who()} earns $${B} a week plus ${r}% commission on sales. This week's sales were $${num(S)}. What is the pay?`,
        ...nums(T, [S * r / 100, B + S * r / 10, B + S].filter(v => v !== T), money, 10), steps: [`Commission: ${r}% of $${num(S)} = ${money(S * r / 100)}`, `Pay: $${B} + ${money(S * r / 100)} = ${money(T)}`] }; }
    if (f === 'markupPct') { const C = randInt(4, 30) * 5, m = pick([20, 25, 30, 40, 50, 60]), Pr = C * (1 + m / 100);
      return { topic: 'PERCENTS', text: `A store buys a bike helmet for $${C} and sells it for ${money(Pr)}. What is the percent markup?`,
        ...nums(m, [round((Pr - C) / Pr * 100, 1), Pr - C, 100 + m].filter(v => Math.abs(v - m) > .05), pct, 5), steps: [`Markup: ${money(Pr)} - $${C} = ${money(Pr - C)}`, `Divide by the cost: ${num(Pr - C)} ÷ ${C} = ${num(m / 100)}`, `= ${m}%`] }; }
    if (f === 'successive') { const P = randInt(4, 20) * 10, p1 = pick([20, 25, 40, 50]), p2 = pick([10, 20]), fin = round(P * (1 - p1 / 100) * (1 - p2 / 100));
      return { topic: 'PERCENTS', text: `A $${P} game is marked down ${p1}%. Then it gets another ${p2}% off the sale price. What is the final price?`,
        ...nums(fin, [round(P * (1 - (p1 + p2) / 100)), round(P * (1 - p1 / 100)), round(P * p1 / 100 * p2 / 100)].filter(v => Math.abs(v - fin) > .005), money, 1),
        steps: [`After ${p1}% off: ${money(P * (1 - p1 / 100))}`, `Then ${p2}% off that: ${money(P * (1 - p1 / 100))} × ${num(1 - p2 / 100)} = ${money(fin)}`, `(Not ${p1 + p2}% off: the second discount is of a smaller price.)`] }; }
    const I = pick([2400, 3000, 3200, 4000, 4500]), p = pick([10, 15, 20, 25, 30, 35]), amt = I * p / 100, cat = pick(['rent', 'food', 'savings', 'the car']), ask = rand() < .5;
    return { topic: 'MONEY', text: ask ? `A family's monthly budget is $${num(I)}. They spend ${money(amt)} on ${cat}. What percent of the budget is that?` : `A family's monthly budget is $${num(I)}, and ${p}% goes to ${cat}. How much is that?`,
      ...(ask ? nums(p, [round(I / amt, 1), p * 10, 100 - p].filter(v => v !== p), pct, 5) : nums(amt, [I - amt, p * 10, amt / 10], money, 10)),
      steps: ask ? [`${num(amt)} ÷ ${num(I)} = ${num(p / 100)}`, `= ${p}%`] : [`${p}% of $${num(I)} = ${num(p / 100)} × ${num(I)}`, `= ${money(amt)}`] };
  }

  // ---- Mixed customary units
  const MIX = [['ft', 'in', 12], ['lb', 'oz', 16], ['hr', 'min', 60], ['gal', 'qt', 4], ['yd', 'ft', 3]];
  function mixedUnits(d) {
    const [B, S, k] = pick(MIX), f = pick(['add', 'sub', 'convert', 'compare']), m = (a, b) => `${a} ${B} ${b} ${S}`;
    if (f === 'add') { const a1 = randInt(1, 8), a2 = randInt(1, 6), b1 = randInt(1, k - 2), b2 = randInt(k - b1 + 1, k - 1), T = (a1 + a2) * k + b1 + b2;
      return { topic: 'MEASUREMENT', text: `What is ${m(a1, b1)} + ${m(a2, b2)}?`, ...textual(m(Math.floor(T / k), T % k), [m(a1 + a2, T % k), m(a1 + a2 + 1, b1 + b2), m(Math.floor(T / k) + 1, T % k), m(Math.floor(T / k), (T % k) + 1)]),
        steps: [`Add: ${a1 + a2} ${B} ${b1 + b2} ${S}`, `${b1 + b2} ${S} = 1 ${B} ${b1 + b2 - k} ${S}`, `= ${m(Math.floor(T / k), T % k)}`] }; }
    if (f === 'sub') { const a2 = randInt(1, 5), a1 = a2 + randInt(2, 6), b1 = randInt(0, k - 3), b2 = randInt(b1 + 1, k - 1), D = (a1 * k + b1) - (a2 * k + b2);
      return { topic: 'MEASUREMENT', text: `What is ${m(a1, b1)} - ${m(a2, b2)}?`, ...textual(m(Math.floor(D / k), D % k), [m(a1 - a2, b2 - b1), m(a1 - a2 - 1, b2 - b1), m(a1 - a2, D % k), m(Math.floor(D / k) + 1, D % k), m(Math.floor(D / k), D % k + 1), m(Math.floor(D / k), Math.max(0, D % k - 1))].filter(s => s !== m(Math.floor(D / k), D % k))),
        steps: [`${b1} ${S} is less than ${b2}, so trade 1 ${B} for ${k} ${S}:`, `${m(a1 - 1, b1 + k)} - ${m(a2, b2)}`, `= ${m(Math.floor(D / k), D % k)}`] }; }
    if (f === 'convert') { const a = randInt(2, 9), b = randInt(1, k - 1), T = a * k + b;
      if (rand() < .5) return { topic: 'MEASUREMENT', text: `How many ${S} is ${m(a, b)}?`, ...nums(T, [a * 10 + b, a + b, a * k - b].filter(v => v > 0 && v !== T)), steps: [`${a} ${B} = ${a} × ${k} = ${a * k} ${S}`, `${a * k} + ${b} = ${T} ${S}`] };
      return { topic: 'MEASUREMENT', text: `What is ${T} ${S} in ${B} and ${S}?`, ...textual(m(a, b), [m(Math.floor(T / 10), T % 10), m(a, b + 1), m(a + 1, b), m(a - 1, b + k)].filter(s => s !== m(a, b))),
        steps: [`${T} ÷ ${k} = ${a} remainder ${b}`, `= ${m(a, b)}`] }; }
    const a = randInt(2, 6), n = a * k + pick([-2, -1, 1, 2, 3]), bigger = a * k > n ? `${a} ${B} is more` : `${n} ${S} is more`;
    return { topic: 'MEASUREMENT', text: `Which is more: ${a} ${B} or ${n} ${S}?`, ...textual(bigger, [a * k > n ? `${n} ${S} is more` : `${a} ${B} is more`, 'They are equal', 'They cannot be compared']),
      steps: [`${a} ${B} = ${a} × ${k} = ${a * k} ${S}`, `Compare ${a * k} with ${n}: ${bigger}.`] };
  }

  // ---- Number theory: primes, prime factorization, divisibility
  const PRIMES = [23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97], TRICK = [21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93];
  const factorize = n => { const out = []; for (let p = 2; n > 1 && p <= n; p++) while (n % p === 0) { out.push(p); n /= p; } return out; };
  const expForm = list => { const m = new Map(); list.forEach(p => m.set(p, (m.get(p) || 0) + 1)); return [...m].map(([p, e]) => e > 1 ? `${p}^${e}` : String(p)).join(' × '); };
  function primeFactors(d, g) {
    const f = pick(d < 2 && g === 6 ? ['prime', 'divisible', 'factorize'] : ['prime', 'divisible', 'factorize', 'factorize', 'notFactor']);
    if (f === 'prime') { const inv = rand() < .35, right = pick(inv ? TRICK : PRIMES), wr = sample(inv ? PRIMES : TRICK, 3);
      return { topic: 'PRIMES', text: `Which number is ${inv ? 'composite' : 'prime'}?`, ...nums(right, wr),
        steps: inv ? [`${right} = ${factorize(right).join(' × ')}: it has factors besides 1 and itself.`, 'The other three are prime.'] : [`${right} has no factors but 1 and ${right}.`, wr.map(w => `${w} = ${factorize(w).join(' × ')}`).join(',  ')] }; }
    if (f === 'divisible') { const k = pick(d < 2 && g === 6 ? [2, 3, 5] : [3, 4, 6, 9]), lo = d < 2 ? 100 : 1000, yes = k * randInt(Math.ceil(lo / k), Math.floor((lo * 10 - 1) / k)), no = [];
      for (let t = 0; t < 40 && no.length < 3; t++) { const v = randInt(lo, lo * 10 - 1); if (v % k && !no.includes(v)) no.push(v); }
      const RULE = { 2: 'it ends in 0, 2, 4, 6 or 8', 3: 'its digits add to a multiple of 3', 4: 'its last two digits make a multiple of 4', 5: 'it ends in 0 or 5', 6: 'it is even and its digits add to a multiple of 3', 9: 'its digits add to a multiple of 9' };
      const ds = String(yes).split('').reduce((s, ch) => s + +ch, 0);
      return { topic: 'DIVISIBILITY', text: `Which number is divisible by ${k}?`, ...nums(yes, no), steps: [`A number is divisible by ${k} when ${RULE[k]}.`, `${num(yes)}: ${k === 3 || k === 6 || k === 9 ? `digits add to ${ds}` : k === 4 ? `last two digits ${String(yes).slice(-2)}` : `ends in ${yes % 10}`}.`, `${num(yes)} ÷ ${k} = ${num(yes / k)}`] }; }
    if (f === 'notFactor') { const n = pick([36, 48, 60, 72, 84, 90, 96]), facs = [...Array(n).keys()].filter(k => k > 1 && k < n && n % k === 0), non = pick([7, 9, 14, 16, 18, 20, 24, 25, 27, 32, 35, 40, 45].filter(k => n % k && k < n));
      return { topic: 'FACTORS', text: `Which is NOT a factor of ${n}?`, ...nums(non, sample(facs.filter(k => k > 2), 3)), steps: [`Factors of ${n}: ${facs.join(', ')}`, `${n} ÷ ${non} is not a whole number.`] }; }
    let n = 12;
    for (let t = 0; t < 30; t++) { const e2 = randInt(1, 4), e3 = randInt(0, 2), e5 = randInt(0, d < 3 ? 1 : 2), e7 = d >= 3 && rand() < .3 ? 1 : 0; n = 2 ** e2 * 3 ** e3 * 5 ** e5 * 7 ** e7; if (n >= 12 && n <= (d < 3 ? 200 : 600) && e3 + e5 + e7 > 0) break; }
    const ps = factorize(n), useExp = d >= 2 || g > 6, F0 = useExp ? expForm : list => list.join(' × '), right = F0(ps);
    const wr = [F0([2, ...ps]), ps.length > 2 ? F0(ps.slice(1)) : `1 × ${n}`, ps.length > 2 ? `${ps[0] * ps[1]} × ${F0(ps.slice(2))}` : `${n / ps[0]} × ${ps[0]}`, F0([...ps, 3]), `1 × ${n}`];
    return { topic: 'PRIMES', text: `What is the prime factorization of ${n}?`, ...textual(right, wr.filter(s => s !== right)),
      steps: [`Divide by primes until you reach 1: ${n} = ${ps.join(' × ')}`, useExp ? `With exponents: ${right}` : 'Every factor is prime.'] };
  }

  // ---- Number sets: whole numbers, integers, rational and irrational numbers
  function numberSets(d, g) {
    const POOL = [[String(randInt(2, 40)), 'W'], ['0', 'W'], [String(-randInt(1, 30)), 'I'], [pick(['3/4', '-2/5', '7/3', '-1 1/2']), 'R'], [pick(['0.6', '-2.5', '0.333...', '-0.75', '4.2']), 'R'],
      ...(g >= 7 ? [['√9', 'W'], ['-√16', 'I'], ['√5', 'X'], ['π', 'X']] : [])];
    const LAST = g >= 7 ? 'irrational' : 'whole numbers only', SETS = { W: 'whole, integer and rational', I: 'integer and rational only', R: 'rational only', X: 'irrational' };
    if (rand() < .6) { const [v, t] = pick(POOL);
      return { topic: 'NUMBER SETS', text: `Which sets does ${v} belong to?`, ...fixed(['whole, integer and rational', 'integer and rational only', 'rational only', LAST], SETS[t]),
        steps: ['Whole numbers: 0, 1, 2, 3, ... Integers add the negatives.', 'Rational: any fraction of integers. Irrational: decimals that never end or repeat.', `${v}: ${SETS[t]}.`] }; }
    const [q, test] = pick([['an integer but not a whole number', t => t === 'I'], ['a rational number but not an integer', t => t === 'R'], ['a whole number', t => t === 'W']]);
    const right = pick(POOL.filter(([, t]) => test(t)))[0], wr = shuffle(POOL.filter(([, t]) => !test(t)).map(p => p[0]));
    return { topic: 'NUMBER SETS', text: `Which number is ${q}?`, ...textual(right, wr), steps: ['Whole: 0, 1, 2, ... Integers: whole numbers and their opposites.', 'Rational: fractions and decimals that end or repeat.', `${right} is ${q}.`] };
  }

  // ---- Powers with negative bases, and order of operations with integers
  function powersAndOrder(d) {
    const f = pick(d < 2 ? ['neg', 'paren'] : ['neg', 'paren', 'frac', 'eval']), b = randInt(2, 5), e = pick([2, 3, 4, 5].filter(x => b ** x <= 400));
    if (f === 'neg' || f === 'paren') { const paren = f === 'paren', v = paren ? (-b) ** e : -(b ** e);
      return { topic: 'EXPONENTS', text: `What is ${paren ? `(-${b})` : `-${b}`}${sup(e)}?`, ...nums(v, [-v, -b * e, b * e, paren ? -(b ** e) : (-b) ** e].filter(x => x !== v)),
        steps: paren ? [`(-${b})${sup(e)}: multiply -${b} by itself ${e} times.`, `${e % 2 ? 'An odd' : 'An even'} number of negatives makes it ${v < 0 ? 'negative' : 'positive'}.`, `= ${v}`] : [`-${b}${sup(e)} means -(${b}${sup(e)}): the exponent belongs to the ${b} only.`, `${b}${sup(e)} = ${b ** e}, so the answer is ${v}.`] }; }
    if (f === 'frac') { const [p, q] = pick([[1, 2], [2, 3], [1, 3], [3, 4], [2, 5]]), k = pick([2, 3]), v = (-p / q) ** k;
      return { topic: 'EXPONENTS', text: `What is (-${p}/${q})${sup(k)}?`, ...nums(v, [-v, -p * k / q, (-p) ** k / q].filter(x => Math.abs(x - v) > 1e-9), fs, Math.abs(v)),
        steps: [`Multiply -${p}/${q} by itself ${k} times.`, `Tops: ${(-p) ** k}; bottoms: ${q ** k}.`, `= ${fs(v)}`] }; }
    const A = randInt(2, 6), B = randInt(2, 6), v = -(A * A) + B * B;
    return { topic: 'EXPONENTS', text: `What is -${A}^2 + (-${B})^2?`, ...nums(v, [A * A + B * B, -(A * A) - B * B, A * A - B * B].filter(x => x !== v)),
      steps: [`-${A}^2 = -${A * A} (the minus is not squared).`, `(-${B})^2 = ${B * B}`, `-${A * A} + ${B * B} = ${v}`] };
  }

  // ---- Sequences: arithmetic, and geometric in 8th grade
  function sequences(d, g) {
    const f = pick(g === 7 ? (d < 3 ? ['next', 'nth'] : ['next', 'nth', 'rule']) : d < 2 ? ['next', 'nth', 'type'] : ['next', 'gnext', 'nth', 'rule', 'type', 'gnth']);
    const a = g === 7 ? randInt(1, 20) : randInt(-8, 20), k = g === 7 && d < 3 ? randInt(2, 9) : nz2(-7, 9), T = [0, 1, 2, 3].map(i => a + i * k);
    if (f === 'next') return { topic: 'SEQUENCES', text: `What is the next term? ${T.join(', ')}, ...`, ...nums(a + 4 * k, [a + 4 * k + 1, a + 5 * k, T[3] * 2, T[3] - k].filter(v => v !== a + 4 * k)),
      steps: [`Each term is ${k > 0 ? k + ' more' : -k + ' less'} than the one before.`, `${T[3]} ${k > 0 ? '+' : '-'} ${Math.abs(k)} = ${a + 4 * k}`] };
    if (f === 'nth') { const n = randInt(10, 30), v = a + (n - 1) * k;
      return { topic: 'SEQUENCES', text: `The sequence ${T.join(', ')}, ... keeps going the same way. What is term number ${n}?`, ...nums(v, [a + n * k, n * k, a + (n - 1) * (k + 1)].filter(x => x !== v)),
        steps: [`From term 1 to term ${n} is ${n - 1} steps of ${k}.`, `${a} + ${n - 1} × ${par(k)} = ${v}`] }; }
    if (f === 'rule') { const right = `${lin(k, a - k, 'n')}`;
      return { topic: 'SEQUENCES', text: `Which expression gives term number n of ${T.join(', ')}, ...?`, ...textual(right, [lin(k, a, 'n'), lin(a, k, 'n'), lin(1, k, 'n'), lin(k, a + k, 'n'), lin(k, 0, 'n'), lin(k + 1, a - k - 1, 'n'), lin(2 * k, a - 2 * k, 'n')].filter(s => s !== right)),
        steps: [`The terms go up by ${k}, so the rule has ${term(k, 'n')}.`, `For n = 1: ${k} + ? = ${a}, so the number is ${a - k}.`, `Term n = ${right}`] }; }
    const g0 = randInt(1, 5), r = pick([2, 3, -2, -3]), G = [0, 1, 2, 3].map(i => g0 * r ** i);
    if (f === 'gnext') return { topic: 'SEQUENCES', text: `What is the next term? ${G.join(', ')}, ...`, ...nums(G[3] * r, [G[3] + (G[3] - G[2]), G[3] * r * r, -G[3] * r].filter(v => v !== G[3] * r)),
      steps: [`Each term is ${r} times the one before.`, `${G[3]} × ${par(r)} = ${G[3] * r}`] };
    if (f === 'gnth') { const n = randInt(5, 7), v = g0 * r ** (n - 1);
      return { topic: 'SEQUENCES', text: `A sequence starts at ${g0}, and each term is ${r} times the one before. What is term number ${n}?`, ...nums(v, [g0 * r ** n, g0 * r * (n - 1), g0 + r * (n - 1)].filter(x => x !== v)),
        steps: [`From term 1 to term ${n}, multiply by ${par(r)} ${n - 1} times.`, `${par(r)}${sup(n - 1)} = ${r ** (n - 1)}`, `${g0} × ${par(r ** (n - 1))} = ${v}`] }; }
    const kind = pick(['arithmetic', 'geometric', 'neither']), S0 = kind === 'arithmetic' ? T : kind === 'geometric' ? G : pick([[1, 4, 9, 16], [1, 2, 4, 7], [2, 3, 5, 8], [1, 3, 7, 13]]);
    return { topic: 'SEQUENCES', text: `Is ${S0.join(', ')}, ... arithmetic, geometric or neither?`, ...fixed(['arithmetic', 'geometric', 'neither', 'both'], kind),
      steps: ['Arithmetic: add the same number each time. Geometric: multiply by the same number.', kind === 'arithmetic' ? `It adds ${k} each time.` : kind === 'geometric' ? `It multiplies by ${r} each time.` : 'The steps change and the ratios change.', `So: ${kind}.`] };
  }

  // ---- Monomials and polynomials
  const polyStr = terms => { let s = ''; terms.filter(([c]) => c !== 0).forEach(([c, p], i) => { const v = p === 0 ? String(Math.abs(c)) : (Math.abs(c) === 1 ? '' : Math.abs(c)) + (p === 1 ? 'x' : `x${sup(p)}`); s += i === 0 ? (c < 0 ? '-' + v : v) : (c < 0 ? ' - ' : ' + ') + v; }); return s || '0'; };
  const q3 = (a, b, c) => polyStr([[a, 2], [b, 1], [c, 0]]);
  function polynomials(d) {
    const f = pick(d < 3 ? ['degree', 'add', 'sub', 'mono', 'dist'] : ['add', 'sub', 'mono', 'dist', 'foil', 'foil']);
    if (f === 'degree') { const deg = randInt(2, 5), nt = randInt(1, 3), pows = [deg, ...sample([...Array(deg).keys()], nt - 1)].sort((x, y) => y - x), P = polyStr(pows.map(p => [nz2(-9, 9), p])), name = ['monomial', 'binomial', 'trinomial'][nt - 1];
      if (rand() < .5) return { topic: 'POLYNOMIALS', text: `What is the degree of ${P}?`, ...nums(deg, [nt, deg + 1, pows.reduce((s, p) => s + p, 0)].filter(v => v !== deg)), steps: ['The degree is the highest power of x.', `In ${P}, that is ${deg}.`] };
      return { topic: 'POLYNOMIALS', text: `What kind of polynomial is ${P}?`, ...fixed(['monomial', 'binomial', 'trinomial', 'not a polynomial'], name), steps: ['Count the terms: 1 is a monomial, 2 a binomial, 3 a trinomial.', `${P} has ${nt} ${nt === 1 ? 'term' : 'terms'}: a ${name}.`] }; }
    const A = [randInt(1, 6), nz2(-9, 9), nz2(-9, 9)], B = [randInt(1, 5), nz2(-9, 9), nz2(-9, 9)];
    if (f === 'add') { const S = A.map((v, i) => v + B[i]), right = q3(...S);
      return { topic: 'POLYNOMIALS', text: `Add: (${q3(...A)}) + (${q3(...B)})`, ...textual(right, [polyStr([[S[0], 4], [S[1], 2], [S[2], 0]]), q3(S[0], A[1] - B[1], S[2]), q3(S[0], S[1], A[2] - B[2]), q3(S[0] + S[1], 0, S[2])].filter(s => s !== right)),
        steps: [`Add like terms: ${A[0]} + ${B[0]} = ${S[0]} (x^2), ${A[1]} + ${par(B[1])} = ${S[1]} (x)`, `${A[2]} + ${par(B[2])} = ${S[2]}`, `= ${right}`] }; }
    if (f === 'sub') { const S = A.map((v, i) => v - B[i]), right = q3(...S);
      return { topic: 'POLYNOMIALS', text: `Subtract: (${q3(...A)}) - (${q3(...B)})`, ...textual(right, [q3(S[0], A[1] + B[1], A[2] + B[2]), q3(A[0] + B[0], A[1] + B[1], A[2] + B[2]), q3(S[0], S[1], A[2] + B[2]), q3(-S[0], -S[1], -S[2])].filter(s => s !== right)),
        steps: ['The minus changes the sign of every term in the second group.', `${q3(...A)} ${polyStr([[-B[0], 2], [-B[1], 1], [-B[2], 0]]).replace(/^-/, '- ').replace(/^(\d|x)/, '+ $1')}`, `= ${right}`] }; }
    if (f === 'mono') { const a = randInt(2, 9), b = randInt(2, 9), m = randInt(2, 6), n = randInt(2, 6), right = polyStr([[a * b, m + n]]);
      return { topic: 'POLYNOMIALS', text: `Multiply: (${polyStr([[a, m]])})(${polyStr([[b, n]])})`, ...textual(right, [polyStr([[a * b, m * n]]), polyStr([[a + b, m + n]]), polyStr([[a * b, m + n + 1]]), polyStr([[a + b, m * n]]), polyStr([[a * b, m + n - 1]]), polyStr([[2 * a * b, m + n]])].filter(s => s !== right)),
        steps: [`Multiply the numbers: ${a} × ${b} = ${a * b}`, `Add the exponents: ${m} + ${n} = ${m + n}`, `= ${right}`] }; }
    if (f === 'dist') { const a = nz2(-5, 6), b = randInt(2, 6), c = nz2(-9, 9), right = polyStr([[a * b, 2], [a * c, 1]]);
      return { topic: 'POLYNOMIALS', text: `Multiply: ${polyStr([[a, 1]])}(${polyStr([[b, 1], [c, 0]])})`, ...textual(right, [polyStr([[a * b, 2], [c, 0]]), polyStr([[a * b, 1], [a * c, 1]]), polyStr([[a * b, 2], [a * c, 0]]), polyStr([[a + b, 2], [a * c, 1]])].filter(s => s !== right)),
        steps: [`Multiply ${polyStr([[a, 1]])} by each term.`, `${polyStr([[a, 1]])} × ${polyStr([[b, 1]])} = ${polyStr([[a * b, 2]])}, ${polyStr([[a, 1]])} × ${par(c)} = ${polyStr([[a * c, 1]])}`, `= ${right}`] }; }
    const p = nz2(-7, 7), q = nz2(-7, 7), right = q3(1, p + q, p * q), bn = v => `(x ${signed(v)})`;
    return { topic: 'POLYNOMIALS', text: `Multiply: ${bn(p)}${bn(q)}`, ...textual(right, [q3(1, 0, p * q), q3(1, p * q, p + q), q3(1, p + q, p + q), q3(1, p - q, p * q), q3(2, p + q, p * q), q3(1, 2 * (p + q), p * q), q3(1, p + q, 2 * p * q)].filter(s => s !== right)),
      steps: [`x times x = x^2. The middle: ${polyStr([[p, 1], [q, 1]])} = ${polyStr([[p + q, 1]])}`, `The last: ${par(p)} × ${par(q)} = ${p * q}`, `= ${right}`] };
  }

  // ---- Surface area of cylinders, cones, spheres and pyramids
  function surfaceArea(d) {
    const f = pick(d < 3 ? ['cyl', 'sphere', 'pyramid'] : ['cyl', 'cone', 'coneH', 'sphere', 'pyramid']), pi = v => `${num(v)}π`;
    if (f === 'cyl') { const r = randInt(2, 6), h = randInt(3, 10), right = pi(2 * r * r + 2 * r * h);
      return { topic: 'SURFACE AREA', text: 'What is the surface area of the cylinder, in terms of π?', ...textual(right, [pi(2 * r * h), pi(r * r * h), pi(r * r + r * h), pi(2 * r * r + r * h), pi(r * r + 2 * r * h), pi(2 * r + 2 * h), pi(4 * r * r + 2 * r * h)].filter(s => s !== right)),
        steps: ['Two circles plus the side: 2πr^2 + 2πrh', `= 2π(${r * r}) + 2π(${r})(${h})`, `= ${pi(2 * r * r)} + ${pi(2 * r * h)} = ${right}`], size: [70, 64], fig: (c, w, h0) => drawCylinder(c, w, h0, String(r), String(h)) }; }
    if (f === 'cone' || f === 'coneH') { const [r, hh, l] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]), right = pi(r * r + r * l), useH = f === 'coneH';
      return { topic: 'SURFACE AREA', text: useH ? `A cone has radius ${r} and height ${hh}. What is its surface area, in terms of π?` : 'What is the surface area of the cone, in terms of π?',
        ...textual(right, [pi(r * l), pi(r * r + r * hh), pi(r * r + 2 * r * l), pi(r * r * hh / 3), pi(2 * r * r + r * l)].filter(s => s !== right)),
        steps: [...(useH ? [`Slant height: √(${r}^2 + ${hh}^2) = √${r * r + hh * hh} = ${l}`] : []), 'Base plus side: πr^2 + πrl', `= π(${r * r}) + π(${r})(${l}) = ${right}`],
        size: [80, 64], fig: (c, w, h0) => drawCone(c, w, h0, String(r), useH ? String(hh) : String(l), !useH) }; }
    if (f === 'sphere') { const r = randInt(2, 9), right = pi(4 * r * r);
      return { topic: 'SURFACE AREA', text: `A ball has a radius of ${r} cm. What is its surface area, in terms of π?`, ...textual(right, [pi(4 * r ** 3 / 3), pi(2 * r * r), pi(r * r), pi(4 * r), pi(8 * r * r)].filter(s => s !== right && !s.includes('.'))),
        steps: ['Surface area of a sphere = 4πr^2', `= 4π × ${r * r}`, `= ${right}`] }; }
    const s = randInt(3, 10), l = randInt(4, 12), SA = s * s + 2 * s * l;
    return { topic: 'SURFACE AREA', text: `A square pyramid has a base ${s} cm on a side. Each triangle face has a slant height of ${l} cm. What is its surface area?`,
      ...nums(SA, [s * s + 4 * s * l, 2 * s * l, s * s * l / 3, s * s + s * l].filter(v => Number.isInteger(v) && v !== SA)),
      steps: [`Base: ${s} × ${s} = ${s * s}`, `4 triangles: 4 × 1/2 × ${s} × ${l} = ${2 * s * l}`, `Total: ${SA} square cm`] };
  }

  Questions.extend('6', {
    primeFactors: d => primeFactors(d, 6), integerOps: d => rand() < .6 ? g7.addSubtract(Math.min(d, 2)) : g7.multiplyDivide(1),
    timeAndPay: d => timeAndPay(d, 6), moneyMatters, mixedUnits, classifyShapes: d => classifyShapes(d, 6), stemLeaf: d => stemLeaf(d, 6),
    dataChoices: d => dataChoices(d, 6), vennLogic: d => vennLogic(d, 6), estimation: d => estimation(d, 6), numberSets: d => numberSets(d, 6),
    probabilityIntro: d => g7.probability(Math.min(d, 2)),
  }, { integerOps: 2, mixedUnits: 2, stemLeaf: 2, dataChoices: 2, vennLogic: 2, numberSets: 2, probabilityIntro: 3 });
  Questions.extend('7', {
    compoundInterest: d => compoundInterest(d, 7), unitConversions: d => unitConversions(d, 7), classifyShapes: d => classifyShapes(d, 7), polygonAngles: d => polygonAngles(d, 7),
    circleParts, similarFigures: d => similarFigures(d, 7), countingOdds: d => countingOdds(d, 7), dataChoices: d => dataChoices(d, 7), stemLeaf: d => stemLeaf(d, 7),
    histograms: g6.histograms, vennLogic: d => vennLogic(d, 7), estimation: d => estimation(d, 7), powersAndOrder, sequences: d => sequences(d, 7),
    primeFactors: d => primeFactors(d, 7), timeAndPay: d => timeAndPay(d, 7), consumerMath: d => consumerMath(d, 7),
  }, { compoundInterest: 3, polygonAngles: 2, similarFigures: 2, countingOdds: 2, vennLogic: 2, sequences: 2, timeAndPay: 2, consumerMath: 2 });
  Questions.extend('8', {
    polynomials, sequences: d => sequences(d, 8), surfaceArea, similarFigures: d => similarFigures(d, 8), countingOdds: d => countingOdds(d, 8),
    compoundInterest: d => compoundInterest(d, 8), unitConversions: d => unitConversions(d, 8), polygonAngles: d => polygonAngles(d, 8), dataChoices: d => dataChoices(d, 8),
    vennLogic: d => vennLogic(d, 8), estimation: d => estimation(d, 8), consumerMath: d => consumerMath(d, 8), timeAndPay: d => timeAndPay(d, 8),
  }, { polynomials: 2, surfaceArea: 2, countingOdds: 2, compoundInterest: 2, unitConversions: 2, dataChoices: 2, vennLogic: 2, consumerMath: 2, timeAndPay: 3 });
})();
