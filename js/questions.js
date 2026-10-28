'use strict';
// SAT-style math questions. They're written here rather than taken from College Board tests,
// which are copyrighted. Each generator draws fresh numbers, builds the wrong answers from the
// classic mistakes (a flipped sign, forgetting to divide, answering for x when they asked for
// 2x), lists numeric choices smallest first the way the SAT does, and carries the worked solution
// the chalkboard shows when you get shot.

const Questions = (() => {
  const nz = (a, b) => { let v; do v = randInt(a, b); while (v === 0); return v; };
  const signed = n => n < 0 ? '- ' + (-n) : '+ ' + n;            // "+ 7" or "- 7", after a term
  const minus = (a, b) => b < 0 ? `${a} + ${-b}` : `${a} - ${b}`;  // "a - b" without "- -3"
  const term = (a, v = 'x') => a === 1 ? v : a === -1 ? '-' + v : a + v;
  const lin = (a, b, v = 'x') => b === 0 ? term(a, v) : `${term(a, v)} ${signed(b)}`;
  const poly = (p, q) => 'x^2' + (p ? ' ' + (p < 0 ? '- ' : '+ ') + term(Math.abs(p)) : '') + (q ? ' ' + signed(q) : '');
  const solveStep = b => b > 0 ? `Subtract ${b} from both sides` : `Add ${-b} to both sides`;
  function show(v) {
    if (Number.isInteger(v)) return String(v);
    for (let d = 2; d <= 24; d++) {
      const n = v * d;
      if (Math.abs(n - Math.round(n)) < 1e-9) return (n < 0 ? '-' : '') + Math.abs(Math.round(n)) + '/' + d;
    }
    return String(Math.round(v * 100) / 100);
  }

  // Four numeric choices, smallest first: the answer, the mistakes that fit, then near misses.
  function numeric(answer, wrongs, fmt = show) {
    const vals = [answer];
    const ints = Number.isInteger(answer);
    // A wrong answer has to print exactly: show() rounds to 2 places when nothing else fits.
    const exact = v => fmt !== show || Number.isInteger(v) || Math.abs(Math.round(v * 100) / 100 - v) < 1e-9 ||
      [...Array(23)].some((_, i) => Math.abs(v * (i + 2) - Math.round(v * (i + 2))) < 1e-9);
    const ok = v => Number.isFinite(v) && (!ints || Number.isInteger(v)) && exact(v) &&
      !vals.some(u => Math.abs(u - v) < 1e-9 || fmt(u) === fmt(v));
    for (const w of wrongs) if (vals.length < 4 && ok(w)) vals.push(w);
    for (let k = 1; vals.length < 4; k++) for (const w of [answer + k, answer - k, answer + 2 * k]) if (vals.length < 4 && ok(w)) vals.push(w);
    vals.sort((a, b) => a - b);
    return { choices: vals.map(fmt), answer: vals.indexOf(answer) };
  }
  function textual(right, wrongs) {
    const all = [right];
    for (const w of wrongs) if (all.length < 4 && !all.includes(w)) all.push(w);
    shuffle(all);
    return { choices: all, answer: all.indexOf(right) };
  }

  const G = {};

  G.linear = d => {
    const x = d < 2 ? randInt(2, 9) : nz(-9, 12), a = randInt(2, d < 2 ? 6 : 9);
    const b = randInt(1, 15) * (d >= 2 && rand() < .4 ? -1 : 1), c = a * x + b;
    return {
      topic: 'ALGEBRA', text: `If ${lin(a, b)} = ${c}, what is the value of x?`,
      ...numeric(x, [(c + b) / a, c - b, c / a - b, -x, x + 1]),
      steps: [`${lin(a, b)} = ${c}`, `${solveStep(b)}: ${a}x = ${c - b}`, `Divide both sides by ${a}: x = ${x}`],
    };
  };

  // The SAT's favorite trap: they ask for something other than x.
  G.linearExpr = () => {
    const x = randInt(2, 9), a = randInt(2, 5), b = randInt(1, 12), c = a * x + b;
    if (rand() < .5) {
      const k = randInt(2, 4), ans = k * c;
      return {
        topic: 'ALGEBRA', text: `If ${lin(a, b)} = ${c}, what is the value of ${lin(k * a, k * b)}?`,
        ...numeric(ans, [x, k * x, c, c + k]),
        steps: [`${lin(k * a, k * b)} is ${k} times ${lin(a, b)}.`, `So it equals ${k} × ${c} = ${ans}.`, `No need to find x (it's ${x}). They didn't ask for x.`],
      };
    }
    const m = randInt(2, 6), n = nz(-9, 9), ans = m * x + n;
    return {
      topic: 'ALGEBRA', text: `If ${lin(a, b)} = ${c}, what is the value of ${lin(m, n)}?`,
      ...numeric(ans, [x, m * x, x + n, c]),
      steps: [`First solve: ${a}x = ${c - b}, so x = ${x}.`, `Then ${lin(m, n)} = ${m}(${x}) ${signed(n)} = ${ans}.`, `They asked for ${lin(m, n)}, not x.`],
    };
  };

  G.bothSides = d => {
    const x = d < 3 ? randInt(1, 9) : nz(-8, 10), c = randInt(1, 6), a = c + randInt(1, 5);
    const b = nz(-12, 12), e = a * x + b - c * x, k = a - c;
    const steps = [`Subtract ${c}x from both sides: ${lin(k, b)} = ${e}`, `${solveStep(b)}: ${term(k)} = ${e - b}`];
    if (k !== 1) steps.push(`Divide both sides by ${k}: x = ${x}`);
    return {
      topic: 'ALGEBRA', text: `If ${lin(a, b)} = ${lin(c, e)}, what is the value of x?`,
      ...numeric(x, [(e - b) / (a + c), (e + b) / k, -x, e - b, x + 2]), steps,
    };
  };

  G.funcEval = d => {
    if (d >= 3 && rand() < .5) {
      const p = nz(-6, 6), q = nz(-9, 9), k = nz(-4, -1), ans = k * k + p * k + q;
      return {
        topic: 'FUNCTIONS', text: `If f(x) = ${poly(p, q)}, what is the value of f(${k})?`,
        ...numeric(ans, [-k * k + p * k + q, k * k - p * k + q, 2 * k + p * k + q]),
        steps: [`Put ${k} in for x: (${k})^2 ${p < 0 ? '- ' + -p : '+ ' + p}(${k}) ${signed(q)}`,
          `(${k})^2 is ${k * k}, not ${-k * k}: a negative squared is positive.`, `${k * k} ${signed(p * k)} ${signed(q)} = ${ans}`],
      };
    }
    const m = nz(-6, 6), b = nz(-10, 10), k = d < 2 ? randInt(1, 6) : nz(-5, 6), ans = m * k + b;
    return {
      topic: 'FUNCTIONS', text: `If f(x) = ${lin(m, b)}, what is the value of f(${k})?`,
      ...numeric(ans, [m * -k + b, m * k - b, m + k + b, m * k]),
      steps: [`Put ${k} in for x: f(${k}) = ${m}(${k}) ${signed(b)}`, `= ${m * k} ${signed(b)}`, `= ${ans}`],
    };
  };

  G.lineEq = d => {
    const m = nz(-5, 5);
    let b; do b = nz(-9, 9); while (b === m);
    const right = `y = ${lin(m, b)}`;
    const ch = textual(right, [`y = ${lin(b, m)}`, `y = ${lin(m, -b)}`, `y = ${lin(-m, b)}`, `y = ${lin(-m, -b)}`]);
    if (d >= 2 && rand() < .6) {
      const x1 = randInt(1, 4), y1 = b + m * x1;
      return {
        topic: 'LINES', text: `A line passes through (0, ${b}) and (${x1}, ${y1}). Which equation describes the line?`, ...ch,
        steps: [`Slope = (${minus(y1, b)}) / (${x1} - 0) = ${m}`, `It crosses the y-axis at (0, ${b}), so b = ${b}.`, `y = mx + b gives ${right}`],
      };
    }
    return {
      topic: 'LINES', text: `Which equation describes a line with a slope of ${m} and a y-intercept of ${b}?`, ...ch,
      steps: ['Slope-intercept form: y = mx + b', `m is the slope (${m}); b is the y-intercept (${b}).`, `So ${right}`],
    };
  };

  G.slope = d => {
    let dx, dy;
    if (d < 2) { dx = randInt(1, 5); dy = dx * nz(-4, 4); } else { dx = nz(-6, 6); dy = nz(-9, 9); }
    const x1 = randInt(-5, 5), y1 = randInt(-5, 5), x2 = x1 + dx, y2 = y1 + dy, s = dy / dx;
    return {
      topic: 'LINES', text: `What is the slope of the line that passes through (${x1}, ${y1}) and (${x2}, ${y2})?`,
      ...numeric(s, [dx / dy, -s, -dx / dy, (y2 + y1) / (x2 + x1)]),
      steps: ['Slope = (change in y) / (change in x)', `= (${minus(y2, y1)}) / (${minus(x2, x1)})`, `= ${dy} / ${dx} = ${show(s)}`],
    };
  };

  const WORK = [
    { f: [35, 40, 45, 50, 60], r: [3, 4, 5, 6], n: [4, 15], t: (F, R, T) => `A tow truck charges $${F} plus $${R} per mile. The bill was $${T}. How many miles was the car towed?` },
    { f: [50, 75, 100], r: [5, 10, 15, 20], n: [3, 12], t: (F, R, T) => `A getaway driver charges $${F} up front plus $${R} per block. The getaway cost $${T}. How many blocks long was it?` },
    { f: [10, 15, 20], r: [3, 4, 5], n: [3, 12], t: (F, R, T) => `A video store charges a $${F} membership fee plus $${R} per movie. Vinny paid $${T}. How many movies did he rent?` },
    { f: [3, 4, 5], r: [2, 3], n: [4, 20], t: (F, R, T) => `A cab charges $${F} plus $${R} per mile. Your ride cost $${T}. How many miles long was the ride?` },
    { f: [40, 60, 80], r: [15, 20, 25], n: [2, 9], t: (F, R, T) => `A locksmith charges $${F} to show up plus $${R} per lock. The bill was $${T}. How many locks did he change?` },
    { f: [8, 10, 12], r: [1, 2], n: [2, 8], t: (F, R, T) => `A large pizza costs $${F} plus $${R} per topping. Yours cost $${T}. How many toppings were on it?` },
  ];
  G.wordLinear = () => {
    const w = pick(WORK), F = pick(w.f), R = pick(w.r), n = randInt(w.n[0], w.n[1]), T = F + R * n;
    return {
      topic: 'WORD PROBLEM', text: w.t(F, R, T),
      ...numeric(n, [T / R, (T + F) / R, T - F, n + 1, n - 1]),
      steps: [`Fee + rate × n = total: ${F} + ${R}n = ${T}`, `Subtract ${F}: ${R}n = ${T - F}`, `Divide by ${R}: n = ${n}`],
    };
  };

  const MODELS = [
    { what: 'to rent a moped for h hours', v: 'h', unit: 'hour', units: 'hours', fee: 'flat fee', F: [15, 20, 25, 30], R: [6, 8, 9, 12] },
    { what: 'for m months at a gym', v: 'm', unit: 'month', units: 'months', fee: 'sign-up fee', F: [49, 50, 75, 99], R: [19, 25, 30, 35] },
    { what: 'to park for h hours', v: 'h', unit: 'hour', units: 'hours', fee: 'flat fee', F: [5, 8, 10], R: [3, 4, 6] },
    { what: 'to bowl g games, with shoe rental', v: 'g', unit: 'game', units: 'games', fee: 'shoe rental', F: [3, 4, 5], R: [6, 7, 8] },
  ];
  G.interpret = () => {
    const m = pick(MODELS), F = pick(m.F), R = pick(m.R), rate = rand() < .55;
    const right = rate ? `The cost per ${m.unit}` : `The ${m.fee}`;
    const wrongs = rate
      ? [`The ${m.fee}`, `The total cost for ${R} ${m.units}`, `The number of ${m.units}`]
      : [`The cost per ${m.unit}`, `The total cost for ${F} ${m.units}`, `The number of ${m.units}`];
    return {
      topic: 'MODELS', text: `C = ${F} + ${R}${m.v} gives the cost, in dollars, ${m.what}. What does the ${rate ? R : F} in the equation represent?`,
      ...textual(right, wrongs),
      steps: [`The ${R} multiplies ${m.v}: C goes up $${R} for every ${m.unit}.`, `So ${R} is the cost per ${m.unit}.`, `The ${F} is paid no matter what: the ${m.fee}.`],
    };
  };

  G.system = d => {
    let x, y; do { x = randInt(1, 12); y = randInt(1, 12); } while (x === y);
    if (d < 3) {
      const s = x + y, e = x - y;
      return {
        topic: 'SYSTEMS', text: `If x + y = ${s} and x - y = ${e}, what is the value of x?`,
        ...numeric(x, [y, s, e, s / 2]),
        steps: ['Add the two equations; the y terms cancel.', `2x = ${s} ${signed(e)} = ${s + e}`, `x = ${x}`],
      };
    }
    const a = randInt(2, 4), b = randInt(2, 5), c = a * x + b * y, e = x - y;
    return {
      topic: 'SYSTEMS', text: `If ${a}x + ${b}y = ${c} and x - y = ${e}, what is the value of y?`,
      ...numeric(y, [x, -y, y + e, c - a * e]),
      steps: [`From x - y = ${e}: x = y ${signed(e)}`, `Substitute: ${a}(y ${signed(e)}) + ${b}y = ${c}`, `${a + b}y ${signed(a * e)} = ${c}`, `${a + b}y = ${c - a * e}, so y = ${y}`],
    };
  };

  const MIXES = [
    { a: 'adult tickets', b: 'kid tickets', pa: [9, 10, 12], pb: [5, 6], t: (N, T, pa, pb) => `A movie theater sold ${N} tickets for $${T}. Adult tickets cost $${pa} and kid tickets cost $${pb}. How many adult tickets were sold?` },
    { a: 'hero sandwiches', b: 'sodas', pa: [6, 7, 8], pb: [2, 3], t: (N, T, pa, pb) => `At the bodega you bought ${N} things for $${T}: heroes at $${pa} each and sodas at $${pb} each. How many heroes did you buy?` },
    { a: 'large shirts', b: 'small shirts', pa: [15, 18, 20], pb: [10, 12], t: (N, T, pa, pb) => `A street vendor sold ${N} T-shirts for $${T}. Large ones cost $${pa} and small ones $${pb}. How many large shirts were sold?` },
  ];
  G.mixture = () => {
    const m = pick(MIXES), pa = pick(m.pa), pb = pick(m.pb);
    let na, nb; do { na = randInt(2, 12); nb = randInt(2, 12); } while (na === nb);
    const N = na + nb, T = pa * na + pb * nb;
    return {
      topic: 'SYSTEMS', text: m.t(N, T, pa, pb),
      ...numeric(na, [nb, Math.round(N / 2), Math.floor(T / pa), na + 1]),
      steps: [`Call the first kind a; then the rest is ${N} - a.`, `${pa}a + ${pb}(${N} - a) = ${T}`, `${pa - pb}a + ${pb * N} = ${T}`, `${pa - pb}a = ${T - pb * N}, so a = ${na}`],
    };
  };

  G.inequality = d => {
    const flip = d >= 3 && rand() < .5, a = randInt(2, 6) * (flip ? -1 : 1), k = randInt(-4, 8), b = nz(-10, 10), c = a * k + b;
    const right = a > 0 ? k + randInt(1, 3) : k - randInt(1, 3);
    const wrongs = a > 0 ? [k, k - 1, k - 2] : [k, k + 1, k + 2];
    return {
      topic: 'INEQUALITIES', text: `If ${lin(a, b)} > ${c}, which of the following could be the value of x?`,
      ...numeric(right, wrongs),
      steps: [`${solveStep(b)}: ${term(a)} > ${c - b}`,
        a > 0 ? `Divide by ${a}: x > ${k}` : `Divide by ${a} and FLIP the sign: x < ${k}`,
        `${k} itself doesn't work. Only ${right} does.`],
    };
  };

  G.percent = () => {
    if (rand() < .5) {
      let P, p; do { P = pick([20, 40, 60, 80, 100, 120, 160, 200]); p = pick([10, 20, 25, 30, 40, 50, 75]); } while (P * p % 100);
      const off = P * p / 100, ans = P - off;
      return {
        topic: 'PERCENTS', text: `A pair of sneakers costs $${P}. They're on sale for ${p}% off. What is the sale price?`,
        ...numeric(ans, [off, P - p, P + off], v => '$' + v),
        steps: [`${p}% of $${P} is ${p / 100} × ${P} = $${off}`, `$${P} - $${off} = $${ans}`],
      };
    }
    let P0, pct; do { P0 = pick([4, 5, 8, 10, 20, 40]); pct = pick([10, 20, 25, 50, 75]); } while (P0 * pct % 100);
    const P1 = P0 + P0 * pct / 100;
    return {
      topic: 'PERCENTS', text: `The bodega raised the price of a sandwich from $${P0} to $${P1}. By what percent did the price go up?`,
      ...numeric(pct, [(P1 - P0) / P1 * 100, P1 - P0, 100 + pct, pct / 2], v => v + '%'),
      steps: [`Change: $${P1} - $${P0} = $${P1 - P0}`, `Divide by the OLD price: ${P1 - P0} / ${P0} = ${(P1 - P0) / P0}`, `= ${pct}%`],
    };
  };

  G.mean = () => {
    let n, mean, known, last;
    do {
      n = randInt(4, 6); mean = randInt(8, 20);
      known = []; for (let i = 0; i < n - 1; i++) known.push(mean + randInt(-6, 6));
      last = n * mean - known.reduce((s, v) => s + v, 0);
    } while (last < 1 || last > 40 || known.includes(last));
    const sum = n * mean - last;
    return {
      topic: 'STATISTICS', text: `The mean of ${n} numbers is ${mean}. ${n - 1} of them are ${known.join(', ')}. What is the other number?`,
      ...numeric(last, [mean, Math.round(sum / (n - 1)), last + mean, n * mean - sum - n]),
      steps: [`All ${n} add up to ${n} × ${mean} = ${n * mean}.`, `The ${n - 1} you know add up to ${sum}.`, `${n * mean} - ${sum} = ${last}`],
    };
  };

  G.pythag = () => {
    const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [12, 16, 20]]);
    if (rand() < .5) {
      return {
        topic: 'GEOMETRY', text: `A right triangle has legs of length ${a} and ${b}. How long is its hypotenuse?`,
        ...numeric(c, [a + b, b - a, c + 2, a * b / 2]),
        steps: ['a^2 + b^2 = c^2', `${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${c * c}`, `c = √${c * c} = ${c}`],
      };
    }
    return {
      topic: 'GEOMETRY', text: `A ${c}-foot ladder leans against a wall. Its foot is ${a} feet from the wall. How high up the wall does it reach?`,
      ...numeric(b, [c - a, c + a, a, b + 2]),
      steps: [`${a}^2 + h^2 = ${c}^2`, `h^2 = ${c * c} - ${a * a} = ${b * b}`, `h = √${b * b} = ${b}`],
    };
  };

  G.exponents = () => {
    const a = randInt(2, 5), b = randInt(2, 4), c = randInt(2, 4), ans = a * b + c;
    const xp = n => `x^{${n}}`;
    const vals = [ans];
    for (const w of [a + b + c, a * b * c, a * c + b, ans + 1, ans - 1]) if (vals.length < 4 && !vals.includes(w)) vals.push(w);
    vals.sort((p, q) => p - q);
    return {
      topic: 'EXPONENTS', text: `Which of the following is equivalent to (x^${a})^${b} · x^${c}?`,
      choices: vals.map(xp), answer: vals.indexOf(ans),
      steps: [`A power of a power: multiply. (x^${a})^${b} = ${xp(a * b)}`, `Same base: add the exponents. ${xp(a * b)} · x^${c} = ${xp(ans)}`],
    };
  };

  G.quadratic = () => {
    let r1, r2; do { r1 = nz(-6, 6); r2 = nz(-6, 6); } while (r1 === r2 || r1 === -r2);
    const lo = Math.min(r1, r2), hi = Math.max(r1, r2), pair = (p, q) => `x = ${Math.min(p, q)} and x = ${Math.max(p, q)}`;
    return {
      topic: 'QUADRATICS', text: `What are the solutions of ${poly(-(r1 + r2), r1 * r2)} = 0?`,
      ...textual(pair(lo, hi), [pair(-lo, -hi), pair(lo, -hi), pair(-lo, hi), pair(1, r1 * r2)]),
      steps: [`Find two numbers that multiply to ${r1 * r2} and add to ${r1 + r2}: ${lo} and ${hi}.`,
        `(x ${signed(-lo)})(x ${signed(-hi)}) = 0`, `So x = ${lo} or x = ${hi}.`],
    };
  };

  // Diagram questions live in figures.js.
  Object.assign(G, Figures.G);
  const POOLS = [null,
    ['linear', 'linear', 'linearExpr', 'funcEval', 'lineEq', 'slope', 'wordLinear', 'interpret', 'triangleAngles', 'graphLine', 'bars', 'box'],
    ['linear', 'linearExpr', 'bothSides', 'funcEval', 'slope', 'wordLinear', 'system', 'inequality', 'percent', 'interpret', 'mixture', 'lineEq',
      'parallelLines', 'circle', 'graphSystem', 'table', 'scatter', 'graphLine', 'triangleAngles'],
    ['bothSides', 'funcEval', 'system', 'inequality', 'percent', 'mixture', 'mean', 'pythag', 'exponents', 'slope', 'linearExpr',
      'rightTrig', 'similar', 'parabola', 'scatter', 'table', 'circle', 'graphSystem'],
    ['system', 'inequality', 'mixture', 'mean', 'pythag', 'exponents', 'quadratic', 'funcEval', 'percent', 'bothSides',
      'rightTrig', 'similar', 'parabola', 'graphSystem', 'parallelLines', 'graphLine'],
  ];

  // ---- Grades. Each one is a bank of generators, d => question, where d (1 to 4) is how hard
  // within the grade: it climbs with each lap of the block. A kind can wait for a harder lap with
  // `min: { kind: d }`. The files in js/grades/ add the banks; SAT prep is the generators above.
  const GRADES = [];
  function grade(def) {
    def = Object.assign({ min: {}, clock: [30, 25, 22, 18, 15] }, def);
    const at = GRADES.findIndex(g => g.id === def.id);
    if (at >= 0) GRADES[at] = def; else GRADES.push(def);
    GRADES.sort((a, b) => a.n - b.n);
    return def;
  }
  grade({ id: 'sat', n: 100, label: 'SAT PREP', short: 'SAT', kinds: G, pools: POOLS });
  const byId = id => GRADES.find(g => g.id === id) || GRADES[GRADES.length - 1];
  // More kinds for a grade already defined. For SAT prep, `levels` says which laps each kind joins
  // (all four if left out); for the others it's the same as `min`.
  function extend(id, kinds, levels = {}) {
    const g = byId(id);
    Object.assign(g.kinds, kinds);
    if (g.pools) for (const k in kinds) for (const d of levels[k] || [1, 2, 3, 4]) g.pools[d].push(k);
    else Object.assign(g.min, levels);
  }
  function pool(g, d) { return g.pools ? g.pools[d] : Object.keys(g.kinds).filter(k => (g.min[k] || 1) <= d); }

  let recent = [];
  function make(id, level) {
    const g = byId(id);
    level = clamp(level, 1, 4);
    const p = pool(g, level);
    let kind, tries = 0; do kind = pick(p); while (recent.includes(kind) && ++tries < 40);
    recent = [kind, ...recent].slice(0, Math.min(6, p.length >> 1));
    // The right answer goes in a slot picked at random, so no letter is a safe guess. Numbers come
    // smallest first, which puts the right one in the middle more often than not, so draw again a
    // few times for one that lands there; failing that, swap it into the slot.
    const slot = randInt(0, 3);
    let q;
    for (let i = 0; i < 8; i++) { q = g.kinds[kind](level); if (q.answer === slot) break; }
    // Choices that name pictures 1 to 4 stay in order: which picture is right is already random.
    const pictures = q.choices.every((c, i) => c === String(i + 1));
    if (q.answer !== slot && !pictures) {
      [q.choices[slot], q.choices[q.answer]] = [q.choices[q.answer], q.choices[slot]];
      q.answer = slot;
    }
    return Object.assign(q, { kind, level, grade: g.id });
  }

  // Generate many of every kind and report anything malformed: not four different choices, a bad
  // answer index, NaN and friends, a letter the arcade font can't draw, or (with Quiz loaded) a
  // question that doesn't fit the quiz panel or the chalkboard. Figures are drawn once each too.
  const DRAWABLE = ch => ch in GLYPHS;
  const markup = s => String(s).replace(/\^\{([^}]*)\}/g, '$1').replace(/\^(.)/g, '$1');
  function check(q) {
    if (!q || !Array.isArray(q.choices) || q.choices.length !== 4) return 'count';
    if (new Set(q.choices).size !== 4) return 'duplicate';
    if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4)) return 'answer';
    if (q.choices.some(c => typeof c !== 'string' || !c || /NaN|undefined|Infinity|null|\[object/.test(c))) return 'value';
    if (!q.text || !Array.isArray(q.steps) || !q.steps.length) return 'missing';
    const all = [q.text, q.topic, ...q.choices, ...q.steps].join('\n');
    if (/NaN|undefined|Infinity|\[object/.test(all)) return 'text';
    const bad = [...markup(all)].filter(ch => ch !== '\n' && !DRAWABLE(ch));
    if (bad.length) return 'glyph ' + [...new Set(bad)].join('');
    // Raised characters come from their own small set.
    const raised = [...all.matchAll(/\^\{([^}]*)\}|\^(.)/g)].flatMap(m => [...(m[1] || m[2])]).filter(ch => !(ch in SUP));
    if (raised.length) return 'raised glyph ' + [...new Set(raised)].join('');
    if (typeof Quiz !== 'undefined') { const why = Quiz.check(q); if (why) return why; }
    return null;
  }
  function selfTest(n = 300, ids = null) {
    const bad = [], test = canvas(160, 90);
    for (const g of GRADES) {
      if (ids && !ids.includes(g.id)) continue;
      for (const kind in g.kinds) for (let level = 1; level <= 4; level++) {
        if (g.pools ? !g.pools[level].includes(kind) && level > 1 : (g.min[kind] || 1) > level) continue;
        for (let i = 0; i < n; i++) {
          let q, why;
          try {
            q = g.kinds[kind](level);
            if (q && q.fig && i < 3) { const [w, h] = q.size || [100, 56]; q.fig(test.getContext('2d'), w, h); }
            why = check(q);
          } catch (e) { why = 'throws ' + e.message; }
          if (why) { bad.push({ grade: g.id, kind, level, why, q }); if (bad.length > 60) return bad; break; }
        }
      }
    }
    return bad;
  }
  const kit = { nz, signed, minus, term, lin, poly, solveStep, show, numeric, textual };
  return { make, selfTest, check, grade, extend, grades: GRADES, byId, kit, kinds: Object.keys(G), G };
})();
