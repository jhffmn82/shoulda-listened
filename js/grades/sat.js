'use strict';
// More SAT prep: the digital SAT's blueprint beyond the core bank in questions.js and figures.js.
(() => {
  const { numeric, textual, show, lin, term, signed, nz } = Questions.kit, F = Figures, { INK, DIM, HOT, RED, GRN, BLU } = F.C;
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  const cm = v => { const [i, f] = String(v).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : ''); };
  const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
  const fr = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? String(n) : `${n}/${d}`; };
  function px(cs, v = 'x') {
    let s = '';
    cs.forEach((a, i) => {
      const p = cs.length - 1 - i, m = Math.abs(a);
      if (!a) return;
      const body = p === 0 ? String(m) : (m === 1 ? '' : m) + v + (p > 1 ? '^' + p : '');
      s += s ? (a < 0 ? ' - ' : ' + ') + body : (a < 0 ? '-' : '') + body;
    });
    return s || '0';
  }
  const rad = (c, r) => r === 1 ? String(c) : (c === 1 ? '' : c) + '√' + r;
  function root(n) { let k = 1; for (let f = 2; f * f <= n; f++) while (n % (f * f) === 0) { n /= f * f; k *= f; } return [k, n]; }
  const rt = n => rad(...root(n));
  const pt = (a, b) => `(${a}, ${b})`;
  const money = v => '$' + (Number.isInteger(v) ? cm(v) : cm(v.toFixed(2)));
  const pct = v => cm(r2(v)) + '%';
  // π times a fraction: "3π/4", "π", "12π".
  const pif = v => { const s = show(v); if (s === '1') return 'π'; if (!s.includes('/')) return cm(s) + 'π'; const [n, q] = s.split('/'); return (n === '1' ? '' : n === '-1' ? '-' : cm(n)) + 'π/' + q; };
  const who = () => pick(['Vinny', 'Keisha', 'Rico', 'Tanya', 'Dre', 'Marisol', 'Benny', 'Yolanda', 'Hector', 'Shawn', 'Lupe', 'Tito']);
  function table(c, w, h, rows) {
    const n = rows[0].length, cw = Math.floor((w - 1) / n), rh = Math.floor((h - 1) / rows.length), W2 = cw * n, H2 = rh * rows.length;
    for (let i = 0; i <= rows.length; i++) F.line(c, 0, i * rh, W2, i * rh, DIM);
    for (let j = 0; j <= n; j++) F.line(c, j * cw, 0, j * cw, H2, DIM);
    rows.forEach((r, i) => r.forEach((s, j) => F.label(c, String(s), j * cw + cw / 2 + 1, i * rh + rh / 2 + 1, j === 0 || i === 0 ? HOT : INK)));
  }
  const an = s => { const t = String(s); return (/^8/.test(t) || t === '11' || t === '18' || /^[aeiou]/i.test(t) ? 'an ' : 'a ') + t; }, An = s => an(s).replace(/^a/, 'A');
  const kinds = {}, levels = {};

  // ---- Algebra

  // Linear functions in context: build the model from two data points, then use it.
  const PLANS = [
    ['A pager company charges a monthly fee plus a charge per page', 'pages', 'page', [.1, .2, .25, .5], [8, 10, 12, 15, 20]],
    ['A cab charges a flat fee plus a charge per mile', 'miles', 'mile', [1.5, 2, 2.5, 3], [3, 4, 5]],
    ['A laundromat charges a flat fee plus a charge per pound', 'pounds', 'pound', [.5, .75, 1.25, 1.5], [2, 3, 4]],
    ['A DJ charges a setup fee plus a charge per hour of the block party', 'hours', 'hour', [25, 30, 40, 45], [50, 60, 75, 100]],
  ];
  kinds.satLinModel = d => {
    const [intro, units, unit, rates, fees] = pick(PLANS), r = pick(rates), Fee = pick(fees), step = r < 1 ? 20 : r < 10 ? 4 : 1;
    let n1 = randInt(1, 4) * step, n2; do n2 = randInt(2, 7) * step; while (n2 === n1);
    const T1 = Fee + r * n1, T2 = Fee + r * n2, f = d < 2 ? pick([0, 1]) : randInt(0, 2);
    const lead = `${intro}. ${cm(n1)} ${units} cost ${money(T1)} and ${cm(n2)} ${units} cost ${money(T2)}.`;
    const steps = [`Rate: (${money(T2)} - ${money(T1)}) / (${n2} - ${n1}) = ${money(r)} per ${unit}`, `Fee: ${money(T1)} - ${n1} × ${money(r)} = ${money(Fee)}`];
    if (f === 0) return { topic: 'LINEAR MODELS', text: `${lead} What is the fee?`, ...numeric(Fee, [T1, r, T1 / n1, Math.abs(T2 - T1), Fee + r], money), steps };
    if (f === 1) return { topic: 'LINEAR MODELS', text: `${lead} What is the charge per ${unit}?`, ...numeric(r, [T1 / n1, T2 / n2, Math.abs(T2 - T1), Fee, (T1 + T2) / (n1 + n2)], money), steps: steps.slice(0, 1) };
    const n3 = randInt(8, 12) * step, ans = Fee + r * n3;
    return { topic: 'LINEAR MODELS', text: `${lead} At this rate, what would ${cm(n3)} ${units} cost?`, ...numeric(ans, [r * n3, T1 * n3 / n1, Fee * 2 + r * n3, ans + r * step], money), steps: [...steps, `${money(Fee)} + ${n3} × ${money(r)} = ${money(ans)}`] };
  };
  levels.satLinModel = [1, 2, 3, 4];

  // Interpreting slope, intercept and zero in a decreasing model.
  const DECLINE = [
    ['M = 300 - 12c', 'M', 'c', 'the minutes left on a phone card after c calls', 'Minutes used per call', 'Minutes on the card at first', 'Calls until the card runs out', [300, 12], 'Calls made per minute'],
    ['G = 16 - 0.5h', 'G', 'h', 'the gallons of gas left in a cab after h hours of driving', 'Gallons burned per hour', 'Gallons in the tank at first', 'Hours until the tank is empty', [16, 0.5], 'Miles driven per gallon'],
    ['T = 64 - 4s', 'T', 's', 'the mixtapes left in a bargain bin after s days of sales', 'Tapes sold per day', 'Tapes in the bin at first', 'Days until the bin is empty', [64, 4], 'Days it takes to sell one tape'],
    ['H = 2,400 - 150t', 'H', 't', 'the height, in feet, of a blimp t minutes after it starts down', 'Feet it drops per minute', 'Its starting height, in feet', 'Minutes until it lands', [2400, 150], 'Minutes it takes to drop a foot'],
    ['B = 90 - 7.5w', 'B', 'w', 'the dollars left on a bus pass after w weeks', 'Dollars used per week', 'Dollars on the pass at first', 'Weeks until the pass is used up', [90, 7.5], 'Weeks a dollar lasts'],
  ];
  kinds.satSlopeMeaning = d => {
    const [eq, , v, what, slope, icpt, zero, [b, m], other] = pick(DECLINE), f = d < 3 ? randInt(0, 1) : randInt(0, 2);
    const all = [slope, icpt, zero], right = all[f], q = [`What does the ${cm(m)} represent?`, `What does the ${cm(b)} represent?`, `What does the solution of ${eq.split(' = ')[1]} = 0 represent?`][f];
    return {
      topic: 'LINEAR MODELS', text: `The equation ${eq} models ${what}. ${q}`,
      ...textual(right, [...all.filter(s => s !== right), other]),
      steps: [[`${cm(m)} is multiplied by ${v}: each 1 added to ${v} drops the total by ${cm(m)}.`, 'That is a rate: the slope.'],
        [`When ${v} = 0, the total is ${cm(b)}.`, 'That is the starting amount: the intercept.'],
        [`The solution is the ${v} that makes the total 0.`, `That is ${b} ÷ ${m} = ${cm(r2(b / m))}: ${zero.toLowerCase()}.`]][f],
    };
  };
  levels.satSlopeMeaning = [1, 2, 3, 4];

  // Systems with no solution, infinitely many, or exactly one.
  kinds.satSystemCount = d => {
    let a, b; do { a = nz(-6, 6); b = nz(-6, 6); } while (gcd(a, b) !== 1);
    const c = nz(-12, 12), m = pick([2, 3, 4, -2, -3]), e = m * c, f = d < 2 ? 0 : randInt(0, 2);
    const E = (p, q, r, x = 'x', y = 'y') => `${term(p, x)} ${q < 0 ? '-' : '+'} ${term(Math.abs(q), y)} = ${r}`;
    if (f === 0) {
      const kind = randInt(0, 2), e2 = kind === 1 ? e : e + nz(-5, 5), a2 = kind === 2 ? m * a + pick([-1, 1]) : m * a;
      const right = ['No solution', 'Infinitely many', 'Exactly one'][kind];
      return {
        topic: 'SYSTEMS', text: `How many solutions does this system have?\n${E(a, b, c)}\n${E(a2, m * b, e2)}`,
        ...textual(right, ['No solution', 'Exactly one', 'Exactly two', 'Infinitely many']),
        steps: [`Multiply the first equation by ${m}: ${E(m * a, m * b, m * c)}`,
          kind === 0 ? `Same left side, different right side (${m * c} and ${e2}): parallel lines.` : kind === 1 ? 'It is the second equation exactly: the same line.' : 'The x terms differ, so the slopes differ: the lines cross once.',
          `So: ${right.toLowerCase()}.`],
      };
    }
    if (f === 1) {
      const e2 = e + nz(-4, 4);
      return {
        topic: 'SYSTEMS', text: `In the system below, k is a constant. For what value of k does the system have no solution?\n${E(a, b, c)}\nkx ${m * b < 0 ? '-' : '+'} ${term(Math.abs(m * b), 'y')} = ${e2}`,
        ...numeric(m * a, [a, -m * a, m * b, m, a + m]),
        steps: ['No solution means parallel lines: the same ratio x : y, different constants.', `The y coefficient went from ${b} to ${m * b}: times ${m}.`, `So k = ${m} × ${a < 0 ? '(' + a + ')' : a} = ${m * a}`],
      };
    }
    return {
      topic: 'SYSTEMS', text: `In the system below, c is a constant. For what value of c does the system have infinitely many solutions?\n${E(a, b, c)}\n${E(m * a, m * b, 'c')}`,
      ...numeric(e, [c, -e, m, e + m, c + m]),
      steps: ['Infinitely many solutions means the same line.', `The second equation is ${m} times the first.`, `So c = ${m} × ${c < 0 ? '(' + c + ')' : c} = ${e}`],
    };
  };
  levels.satSystemCount = [2, 3, 4];

  // Linear inequalities and constraints in context.
  kinds.satConstraint = d => {
    const [ctx, A, B, va, vb] = pick([
      ["A bodega's delivery bike can carry at most W pounds. Cases of soda weigh p pounds and sacks of rice weigh q pounds.", 'cases of soda', 'sacks of rice', 's', 'r'],
      ['A food cart needs to take in at least W dollars a day. Hot dogs sell for $p and pretzels for $q.', 'hot dogs', 'pretzels', 'h', 'p'],
      ['A freight elevator can lift at most W pounds. Amps weigh p pounds and speakers weigh q pounds.', 'amps', 'speakers', 'a', 's'],
    ]);
    const atLeast = ctx.includes('at least'), p = randInt(3, 12), q = randInt(2, 9), W = randInt(6, 15) * 10;
    const text0 = ctx.replace('W', W).replace('$p', '$' + p).replace('$q', '$' + q).replace('p pounds', p + ' pounds').replace('q pounds', q + ' pounds');
    const op = atLeast ? '≥' : '≤', f = d < 2 ? 0 : randInt(0, 2);
    if (f === 0) {
      const I = (x, y, o) => `${x}${va} + ${y}${vb} ${o} ${W}`;
      return {
        topic: 'INEQUALITIES', text: `${text0} Which inequality shows the ${A} (${va}) and ${B} (${vb}) that work?`,
        ...textual(I(p, q, op), [I(p, q, atLeast ? '≤' : '≥'), I(q, p, op), `${va} + ${vb} ${op} ${W}`, I(p, q, atLeast ? '>' : '<')]),
        steps: [`Each of the ${A} adds ${p}; each of the ${B} adds ${q}.`, `"${atLeast ? 'At least' : 'At most'}" means ${op}.`, I(p, q, op)],
      };
    }
    if (f === 1) {
      const nb = randInt(1, Math.floor(W / q / 2)), rest = W - q * nb, ans = atLeast ? Math.ceil(rest / p) : Math.floor(rest / p);
      return {
        topic: 'INEQUALITIES', text: `${text0} If ${nb} ${B} ${atLeast ? 'are sold' : 'are loaded'}, what is the ${atLeast ? 'least' : 'greatest'} number of ${A} that ${atLeast ? 'must be sold' : 'can go too'}?`,
        ...numeric(ans, [atLeast ? ans - 1 : ans + 1, Math.floor(W / p), Math.round((W + q * nb) / p), ans + 2]),
        steps: [`${p}${va} + ${q}(${nb}) ${op} ${W}`, `${p}${va} ${op} ${rest}, so ${va} ${op} ${r2(rest / p)}`, `Whole ${A}: ${atLeast ? 'round up' : 'round down'} to ${ans}.`],
      };
    }
    const ok = (x, y) => atLeast ? p * x + q * y >= W : p * x + q * y <= W, lim = randInt(8, 15);
    const good = [], bad = [];
    for (let x = 0; x <= 20; x++) for (let y = 0; y <= 20; y++) { if (x + y > lim + 3) continue; (ok(x, y) && x + y <= lim ? good : bad).push([x, y]); }
    if (!good.length || bad.length < 3) return kinds.satConstraint(1);
    const right = pick(good), wr = shuffle(bad).slice(0, 3);
    return {
      topic: 'INEQUALITIES', text: `${text0} There's room for at most ${lim} items in all. Which (${va}, ${vb}) meets both conditions?`,
      ...textual(pt(...right), wr.map(w => pt(...w))),
      steps: [`Check both: ${va} + ${vb} ≤ ${lim} and ${p}${va} + ${q}${vb} ${op} ${W}.`, `${pt(...right)}: ${right[0] + right[1]} items, and ${p * right[0] + q * right[1]} ${op} ${W}.`, 'The others break one of the rules.'],
    };
  };
  levels.satConstraint = [1, 2, 3, 4];

  // Solving a formula or equation for one variable.
  const SOLVE = [
    ['a = (v - u)/t', 'v', 'v = u + at', ['v = at - u', 'v = u/t + a', 'v = (u + a)t'], 'Multiply by t, then add u.'],
    ['A = P(1 + rt)', 'r', 'r = (A - P)/(Pt)', ['r = (A - P)/t', 'r = A/(Pt) - 1', 'r = (A - 1)/(Pt)'], 'Divide by P, subtract 1, then divide by t.'],
    ['E = (1/2)mv^2', 'm', 'm = 2E/v^2', ['m = E/(2v^2)', 'm = 2Ev^2', 'm = √(2E)/v'], 'Multiply by 2, then divide by v^2.'],
    ['P = I^2R', 'R', 'R = P/I^2', ['R = PI^2', 'R = √P/I', 'R = I^2/P'], 'Divide both sides by I^2.'],
    ['y = (2x + k)/3', 'x', 'x = (3y - k)/2', ['x = (3y + k)/2', 'x = 3y - k/2', 'x = (y - k)/6'], 'Multiply by 3, subtract k, then divide by 2.'],
    ['T = 2h(L + W)', 'h', 'h = T/(2(L + W))', ['h = 2T/(L + W)', 'h = T/2 - (L + W)', 'h = T(L + W)/2'], 'Divide both sides by 2(L + W).'],
    ['V = (1/3)Bh', 'B', 'B = 3V/h', ['B = V/(3h)', 'B = 3Vh', 'B = h/(3V)'], 'Multiply by 3, then divide by h.'],
    ['K = (C + 273)/5', 'C', 'C = 5K - 273', ['C = 5K + 273', 'C = K/5 - 273', 'C = 5(K - 273)'], 'Multiply by 5, then subtract 273.'],
  ];
  kinds.satSolveFor = () => {
    const [f, v, right, wrongs, how] = pick(SOLVE);
    return { topic: 'FORMULAS', text: `The equation ${f} relates the variables shown. Which equation correctly gives ${v} in terms of the others?`, ...textual(right, wrongs), steps: [how, right] };
  };
  levels.satSolveFor = [1, 2, 3, 4];

  // ---- Advanced math

  // Equivalent expressions: matching coefficients, distributing, factoring.
  kinds.satEquivExpr = d => {
    const f = d < 2 ? pick([1, 2]) : randInt(0, 3);
    if (f === 0) {
      const a = randInt(2, 5), b = nz(-7, 7), p = nz(-6, 6), c = randInt(2, 4);
      const A = a * c, B = a * b + p * c, C = p * b;
      return {
        topic: 'EXPRESSIONS', text: `If (ax ${signed(p)})(${c}x + b) = ${px([A, B, C])} for all x, where a and b are constants, what is a + b?`,
        ...numeric(a + b, [a * b, a - b, A + B, c + p, a + b + c]),
        steps: [`x^2 terms: ${c}a = ${A}, so a = ${a}.`, `Constants: ${p}b = ${C}, so b = ${b}.`, `a + b = ${a + b}`],
      };
    }
    if (f === 1) {
      const P = [randInt(1, 4), nz(-9, 9), nz(-9, 9)], k = randInt(2, 4), Q = [1, nz(-6, 6), nz(-9, 9)];
      const R = P.map((v, i) => v - k * Q[i]);
      return {
        topic: 'EXPRESSIONS', text: `Which expression is equivalent to (${px(P)}) - ${k}(${px(Q)})?`,
        ...textual(px(R), [px(P.map((v, i) => i === 0 ? v - k * Q[i] : v - Q[i])), px(P.map((v, i) => v + k * Q[i])), px(P.map((v, i) => i === 2 ? v + k * Q[i] : v - k * Q[i])), px(P.map((v, i) => v - k * Q[i] * (i === 1 ? -1 : 1)))]),
        steps: [`Distribute -${k} to every term: ${px(Q.map(v => -k * v))}`, `Combine like terms with ${px(P)}.`, `= ${px(R)}`],
      };
    }
    if (f === 2) {
      const a = randInt(1, 5), b = randInt(1, 6), A = term(a), B = term(b, 'y');
      if (rand() < .5) {
        const right = `(${A} - ${B})(${A} + ${B})`;
        return {
          topic: 'EXPRESSIONS', text: `Which expression is equivalent to ${a * a === 1 ? '' : a * a}x^2 - ${b * b === 1 ? '' : b * b}y^2?`,
          ...textual(right, [`(${A} - ${B})^2`, `(${A} + ${B})^2`, ...(a > 1 ? [`(${a * a}x - ${B})(x + ${B})`] : []), ...(b > 1 ? [`(${A} - ${b * b}y)(${A} + y)`] : []), `(${A} - ${term(2 * b, 'y')})(${A} + ${term(2 * b, 'y')})`]),
          steps: ['A difference of squares: p^2 - q^2 = (p - q)(p + q)', `Here p = ${A} and q = ${B}.`, right],
        };
      }
      const right = `(${A} + ${B})^2`, mid = 2 * a * b;
      return {
        topic: 'EXPRESSIONS', text: `Which expression is equivalent to ${a * a === 1 ? '' : a * a}x^2 + ${mid}xy + ${b * b === 1 ? '' : b * b}y^2?`,
        ...textual(right, [`(${A} - ${B})^2`, `(${A} + ${B})(${A} - ${B})`, ...(a > 1 ? [`(${a * a}x + ${B})^2`] : []), ...(b > 1 ? [`(${A} + ${b * b}y)^2`] : []), `(${A} + ${term(2 * b, 'y')})^2`]),
        steps: [`${a * a === 1 ? '' : a * a}x^2 = (${A})^2 and ${b * b === 1 ? '' : b * b}y^2 = (${B})^2`, `2 × ${A} × ${B} = ${mid}xy, the middle term.`, `So it's ${right}.`],
      };
    }
    const a = randInt(1, 5), h = randInt(1, 7);
    return {
      topic: 'EXPRESSIONS', text: `In the expression ${px([a * a, -2 * a * h, 0])} + c, c is a constant. For what value of c is the expression a perfect square?`,
      ...numeric(h * h, [2 * h, h, 4 * h * h, a * h * h, a * a * h * h, -h * h]),
      steps: [`A perfect square: (${term(a)} - k)^2 = ${px([a * a, 0, 0])} - ${2 * a}kx + k^2`, `${2 * a}k = ${2 * a * h}, so k = ${h}.`, `c = k^2 = ${h * h}`],
    };
  };
  levels.satEquivExpr = [1, 2, 3, 4];

  // Rational expressions and equations.
  kinds.satRational = d => {
    const f = d < 2 ? 0 : randInt(0, 2);
    if (f === 0) {
      let p, q; do { p = nz(-8, 8); q = nz(-8, 8); } while (p === q);
      const num = px([1, p + q, p * q]);
      return {
        topic: 'RATIONAL EXPR', text: `For x ≠ ${-p}, which expression is equivalent to (${num})/(${lin(1, p)})?`,
        ...textual(lin(1, q), [lin(1, -q), lin(1, p), lin(1, p + q), lin(1, -p), lin(1, p * q), lin(1, q + 1), lin(1, q - 1)].filter(v => v !== lin(1, q))),
        steps: [`Factor the top: ${num} = (${lin(1, p)})(${lin(1, q)})`, `Cancel (${lin(1, p)}) from top and bottom.`, `What's left: ${lin(1, q)}`],
      };
    }
    if (f === 1) {
      let x, b, c, a, tries = 0;
      do { x = nz(-6, 9); b = nz(-6, 6); c = pick([2, 3, 4, -2, -1]); a = c * (x - b) - x; } while ((x === b || a === 0 || -a === b) && ++tries < 30);
      return {
        topic: 'RATIONAL EXPR', text: `What is the solution to (x ${signed(a)})/(x ${signed(-b)}) = ${c}?`,
        ...numeric(x, [(c * b + a) / (1 - c), (a - b) / (c - 1), -x, b, x + 1]),
        steps: [`Multiply both sides by (x ${signed(-b)}): x ${signed(a)} = ${c}(x ${signed(-b)})`, `x ${signed(a)} = ${px([c, -c * b])}`, `${px([1 - c, 0])} = ${-c * b - a}, so x = ${x}`],
      };
    }
    const a = randInt(1, 6), b = randInt(1, 6), p = randInt(1, 6), top = px([a + b, (b - a) * p]), bot = `x^2 - ${p * p}`;
    return {
      topic: 'RATIONAL EXPR', text: `Which is equivalent to ${a}/(x + ${p}) + ${b}/(x - ${p})?`,
      ...textual(`(${top})/(${bot})`, [`${a + b}/(${bot})`, `${a + b}/(2x)`, `(${px([a + b, (a - b) * p])})/(${bot})`, `(${top})/(2x)`]),
      steps: [`Common denominator: (x + ${p})(x - ${p}) = ${bot}`, `Top: ${a}(x - ${p}) + ${b}(x + ${p}) = ${top}`, `So (${top})/(${bot})`],
    };
  };
  levels.satRational = [2, 3, 4];

  // Radical expressions and equations.
  kinds.satRadical = d => {
    const f = d < 2 ? pick([0, 2]) : randInt(0, 2);
    if (f === 0) {
      const a = randInt(2, 5), s = randInt(2, 9), b = randInt(1, 9), c = a * s + b, X = s * s;
      return {
        topic: 'RADICALS', text: `If ${a}√x + ${b} = ${c}, what is the value of x?`,
        ...numeric(X, [s, (c - b) / a * 2, X * a, c - b, (c - b) * (c - b)]),
        steps: [`Subtract ${b}: ${a}√x = ${c - b}`, `Divide by ${a}: √x = ${s}`, `Square: x = ${X}`],
      };
    }
    if (f === 1) {
      let k, s; do { k = randInt(2, 7); s = pick([2, 3, 5, 6, 7]); } while (k === s);
      const N = k * k * s;
      return {
        topic: 'RADICALS', text: `For x > 0, which expression is equivalent to √(${N}x^3)?`,
        ...textual(`${k}x√(${s}x)`, [`${s}x√(${k}x)`, `${k * k}x√(${s}x)`, `${k}x√${s}`, `${k}x^2√(${s}x)`]),
        steps: [`${N}x^3 = ${k * k}x^2 · ${s}x`, `√(${k * k}x^2) = ${k}x`, `So √(${N}x^3) = ${k}x√(${s}x)`],
      };
    }
    const s = pick([2, 3, 5, 6, 7]), m = randInt(2, 6), n = s * m;
    return {
      topic: 'RADICALS', text: `Which is equivalent to ${n}/√${s}?`,
      ...textual(`${m}√${s}`, [`${n}√${s}`, String(m), `${s}√${m}`, `√${n}`, `${n * s}√${s}`].filter(v => v !== `${m}√${s}`)),
      steps: [`Multiply top and bottom by √${s}: ${n}√${s} / ${s}`, `${n} ÷ ${s} = ${m}`, `So it's ${m}√${s}.`],
    };
  };
  levels.satRadical = [2, 3, 4];

  // Exponential functions in context.
  kinds.satExpGrowth = d => {
    const f = d < 2 ? pick([0, 3]) : d < 3 ? randInt(0, 4) : randInt(0, 5);
    if (f === 5) {
      const dbl = rand() < .5, A = pick([50, 80, 120, 300, 500, 800]), k = pick([2, 3, 4, 5, 6, 10]), B = dbl ? '2' : '1/2';
      const [lead, unit] = dbl ? [`A viral dance video has ${A} views, and the number of views doubles every ${k} days.`, 'days'] : [`A ${A}-gram sample of a medicine loses half its mass every ${k} hours.`, 'hours'];
      const right = `f(t) = ${A}(${B})^{t/${k}}`;
      return {
        topic: 'EXPONENTIAL', text: `${lead} Which function gives the amount after t ${unit}?`,
        ...textual(right, [`f(t) = ${A}(${B})^{${k}t}`, `f(t) = ${A}(${B})^t`, `f(t) = ${A}(${dbl ? '1/2' : '2'})^{t/${k}}`, `f(t) = ${A} ${dbl ? '+' : '-'} ${k}t`, `f(t) = ${A}(${B})^{t + ${k}}`]),
        steps: [`Every ${k} ${unit}, the amount is multiplied by ${B}.`, `After t ${unit}, that has happened t/${k} times.`, right],
      };
    }
    if (f === 0) {
      const up = rand() < .5, r = pick(up ? [3, 4, 5, 6, 8, 12] : [4, 6, 8, 15, 20]), k = r2(up ? 1 + r / 100 : 1 - r / 100), A = pick([250, 400, 600, 900, 1200]);
      const [lead, unit] = pick(up ? [[`A sneaker collection is worth $${cm(A)}, and its value grows ${r}% each year.`, 'year'], [`A skate crew's video has ${cm(A)} views, and the views grow ${r}% each day.`, 'day']]
        : [[`A pawn shop guitar is worth $${cm(A)}, and its value drops ${r}% each year.`, 'year'], [`A stack of ${cm(A)} free flyers shrinks by ${r}% each hour.`, 'hour']]);
      const right = `y = ${cm(A)}(${k})^t`;
      return {
        topic: 'EXPONENTIAL', text: `${lead} Which equation gives the amount y after t ${unit}s?`,
        ...textual(right, [`y = ${cm(A)}(${r2(r / 100)})^t`, `y = ${cm(A)}(${r2(up ? 1 - r / 100 : 1 + r / 100)})^t`, `y = ${cm(A)} ${up ? '+' : '-'} ${r}t`, `y = ${cm(A)}(${r})^t`]),
        steps: [up ? `Growing ${r}% means multiplying by 1 + ${r / 100} = ${k}.` : `Dropping ${r}% means multiplying by 1 - ${r / 100} = ${k}.`, `Start times factor^t: ${right}`],
      };
    }
    if (f === 1) {
      const r = pick([10, 20, 30, 50]), k = 1 + r / 100, A = pick([20, 50, 80]), two = Math.round((k * k - 1) * 100);
      return {
        topic: 'EXPONENTIAL', text: `The function f(t) = ${A}(${k})^t models a crowd at a block party t hours after noon. By what percent does the crowd grow every 2 hours?`,
        ...numeric(two, [2 * r, r, Math.round(k * k * 100), r * r], v => v + '%'),
        steps: [`Every 2 hours the crowd is multiplied by ${k} × ${k} = ${r2(k * k)}.`, `${r2(k * k)} = 1 + ${r2(k * k - 1)}`, `That's a ${two}% increase, not ${2 * r}%.`],
      };
    }
    if (f === 2) {
      const a = randInt(2, 9), b = randInt(2, 4), n = randInt(2, 4), ans = a * b ** n;
      return {
        topic: 'EXPONENTIAL', text: `For the function f(x) = ab^x, where a and b are constants, f(0) = ${a} and f(1) = ${a * b}. What is f(${n})?`,
        ...numeric(ans, [a + n * (a * b - a), a * b * n, (a * b) ** n, a * b ** (n - 1)], cm),
        steps: [`f(0) = a = ${a}`, `f(1) = ab = ${a * b}, so b = ${b}.`, `f(${n}) = ${a}(${b})^${n} = ${ans}`],
      };
    }
    if (f === 3) {
      const r = pick([4, 5, 6, 8]), lin0 = rand() < .5, right = lin0 ? 'Grows by the same amount each month' : `Grows by ${r}% each month`;
      return {
        topic: 'EXPONENTIAL', text: `Which description fits a quantity that is ${lin0 ? 'linear' : 'exponential'} in the number of months?`,
        ...textual(right, [`Grows by ${r}% each month`, 'Grows by the same amount each month', `Grows by ${r * 10} units each month`, `Grows by $${r} each month`].filter(s => s !== right)),
        steps: ['Linear: the same amount is added each time.', 'Exponential: the same percent (factor) each time.', right],
      };
    }
    const half = pick([2, 3, 4, 5]), A = pick([80, 160, 320, 640]), n = randInt(2, 4), ans = A / 2 ** n, T = half * n;
    return {
      topic: 'EXPONENTIAL', text: `A lab sample of ${A} grams loses half its mass every ${half} hours. How many grams are left after ${T} hours?`,
      ...numeric(ans, [A / 2 / n, A - A / 2 * n, A / 2 ** T, A / 2 ** (n - 1), A / (2 * T)].filter(v => v > 0), show),
      steps: [`${T} hours is ${T} ÷ ${half} = ${n} half-lives.`, `${A} × (1/2)^${n} = ${A} ÷ ${2 ** n}`, `= ${show(ans)} grams`],
    };
  };
  levels.satExpGrowth = [1, 2, 3, 4];

  // Quadratics in vertex and factored form.
  kinds.satVertexForm = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 3);
    if (f === 0) {
      const t = randInt(1, 4), H = randInt(40, 90), v = randInt(2, 6) * 4, askT = rand() < .4;
      return {
        topic: 'QUADRATICS', text: `h(t) = -16(t - ${t})^2 + ${H} gives the height, in feet, of a ball kicked off a stoop t seconds later. ${askT ? 'How many seconds after the kick does it reach its highest point?' : 'What is its greatest height, in feet?'}`,
        ...numeric(askT ? t : H, askT ? [H, -t, 2 * t, t + 1] : [t, H - 16, H + 16 * t * t, 16 * t + H, H / 2]),
        steps: ['In y = a(x - h)^2 + k with a < 0, the top is at (h, k).', `Here h = ${t} and k = ${H}.`, askT ? `Highest at t = ${t} seconds.` : `Greatest height: ${H} feet.`],
      };
    }
    if (f === 1) {
      let p, q; do { p = nz(-9, 9); q = nz(-9, 9); } while (p === q || (p + q) % 2);
      const v = (p + q) / 2, eq = `y = (x ${signed(-p)})(x ${signed(-q)})`;
      return {
        topic: 'QUADRATICS', text: `What is the x-coordinate of the vertex of the parabola ${eq}?`,
        ...numeric(v, [-v, p + q, p * q, (p - q) / 2, -(p - q) / 2]),
        steps: [`The zeros are x = ${p} and x = ${q}.`, 'The vertex sits halfway between the zeros.', `(${p} + ${q < 0 ? '(' + q + ')' : q}) / 2 = ${v}`],
      };
    }
    if (f === 2) {
      let p, q; do { p = randInt(1, 9); q = randInt(1, 9); } while (p === q || (p + q) % 2);
      const h = (p + q) / 2, k = -(((q - p) / 2) ** 2), std = `y = ${px([1, -(p + q), p * q])}`, vtx = `y = (x - ${h})^2 - ${-k}`, fac = `y = (x - ${p})(x - ${q})`;
      const ask = rand() < .5;
      return {
        topic: 'QUADRATICS', text: `Each choice is an equation of the same parabola. Which one shows the ${ask ? 'minimum value of y' : 'x-intercepts'} as constants?`,
        ...textual(ask ? vtx : fac, [std, ask ? fac : vtx, `y = x(x - ${p + q}) + ${p * q}`]),
        steps: ask ? [`Vertex form y = (x - h)^2 + k shows the vertex (h, k).`, `${vtx} shows the minimum, ${k}.`] : ['Factored form shows the zeros.', `${fac}: x-intercepts at ${p} and ${q}.`],
      };
    }
    const a = nz(-3, 3), h = nz(-5, 5), k = nz(-9, 9), y0 = a * h * h + k;
    return {
      topic: 'QUADRATICS', text: `The graph of y = ${a === 1 ? '' : a === -1 ? '-' : a}(x ${signed(-h)})^2 ${signed(k)} crosses the y-axis at (0, b). What is b?`,
      ...numeric(y0, [k, a * h + k, -a * h * h + k, a * h * h - k, h * h + k]),
      steps: ['On the y-axis, x = 0.', `y = ${a}(0 ${signed(-h)})^2 ${signed(k)} = ${a}(${h * h}) ${signed(k)}`, `= ${y0}`],
    };
  };
  levels.satVertexForm = [1, 2, 3, 4];

  // The discriminant: how many solutions, and the constant that makes exactly one.
  kinds.satDiscK = d => {
    const f = d < 2 ? 0 : randInt(0, 3);
    if (f === 0) {
      const h = nz(-9, 9);
      return {
        topic: 'QUADRATICS', text: `In the equation x^2 ${signed(2 * h)}x + c = 0, c is a constant. For what value of c does the equation have exactly one real solution?`,
        ...numeric(h * h, [2 * h, 4 * h * h, -h * h, h, 2 * h * h]),
        steps: ['Exactly one solution: b^2 - 4ac = 0.', `(${2 * h})^2 - 4(1)(c) = 0, so ${4 * h * h} = 4c`, `c = ${h * h}`],
      };
    }
    if (f === 1) {
      const k = randInt(1, 5), c = k * k;
      const A = [1, 4, 9][randInt(0, 2)], s = Math.sqrt(A), B = 2 * s * k;
      return {
        topic: 'QUADRATICS', text: `In the equation ${A === 1 ? '' : A}x^2 + bx + ${c} = 0, b is a positive constant. If the equation has exactly one real solution, what is b?`,
        ...numeric(B, [B / 2, 2 * c, Math.sqrt(4 * A * c) + 2, A * c, 4 * A * c]),
        steps: ['One solution: b^2 - 4ac = 0, so b^2 = 4ac.', `b^2 = 4(${A})(${c}) = ${4 * A * c}`, `b = ${B}`],
      };
    }
    if (f === 2) {
      const a = randInt(1, 4), b = 2 * nz(-5, 5), lim = b * b / (4 * a);
      const pickAbove = [Math.floor(lim) + 1, Math.floor(lim) + 3, Math.ceil(lim * 2) + 1].filter(v => v > lim);
      const right = pick(pickAbove), wr = [Math.floor(lim), Math.floor(lim) - 2, 0, -Math.floor(lim) - 1, Math.floor(lim) - 1].filter(v => v <= lim);
      return {
        topic: 'QUADRATICS', text: `In ${px([a, b, 0])} + k = 0, k is a constant, and the equation has no real solutions. Which could be the value of k?`,
        ...numeric(right, wr),
        steps: ['No real solutions: b^2 - 4ac < 0.', `${b * b} - ${4 * a}k < 0, so k > ${show(lim)}`, `Only ${right} is greater than ${show(lim)}.`],
      };
    }
    let a, b, c, D, tries = 0, type = randInt(0, 2);
    do { a = randInt(1, 5); b = nz(-10, 10); c = nz(-9, 9); D = b * b - 4 * a * c; } while ((type === 0 ? D >= 0 : type === 1 ? D !== 0 : D <= 0) && ++tries < 80);
    if (tries >= 80) { a = 1; b = 4; c = 4; D = 0; }
    const right = D < 0 ? 'Zero' : D === 0 ? 'Exactly one' : 'Exactly two';
    return {
      topic: 'QUADRATICS', text: `How many distinct real solutions does ${px([a, b, c])} = 0 have?`,
      ...textual(right, ['Zero', 'Exactly one', 'Exactly two', 'Infinitely many']),
      steps: [`b^2 - 4ac = ${b * b} ${signed(-4 * a * c)} = ${D}`, D < 0 ? 'Negative: no real solutions.' : D === 0 ? 'Zero: one solution.' : 'Positive: two solutions.'],
    };
  };
  levels.satDiscK = [2, 3, 4];

  // A line and a parabola.
  kinds.satLineParabola = d => {
    let r, s, m, n, tries = 0;
    do { r = randInt(-3, 3); s = randInt(-3, 3); m = nz(-2, 2); n = randInt(-2, 3); } while ((r === s || Math.abs(m * r + n) > 7 || Math.abs(m * s + n) > 7) && ++tries < 60);
    if (tries >= 60) { r = -1; s = 2; m = 1; n = 1; }
    const b = m - (r + s), c = n + r * s, P = x => `(${x}, ${m * x + n})`, f = d < 2 ? 0 : randInt(0, 2);
    const sys = `y = ${px([1, b, c])}\ny = ${lin(m, n)}`;
    if (f === 2) {
      const type = randInt(0, 2), k = randInt(type === 2 ? 3 : 1, 6), C = type === 0 ? k * k + randInt(1, 6) : type === 1 ? k * k : k * k - randInt(1, Math.min(6, k * k - 1));
      const right = ['No solutions', 'Exactly one', 'Exactly two'][type];
      return {
        topic: 'SYSTEMS', text: `How many solutions does this system have?\ny = x^2 + ${C}\ny = ${2 * k}x`,
        ...textual(right, ['No solutions', 'Exactly one', 'Exactly two', 'Infinitely many']),
        steps: [`Set them equal: x^2 - ${2 * k}x + ${C} = 0`, `b^2 - 4ac = ${4 * k * k} - ${4 * C} = ${4 * k * k - 4 * C}`, `${['Negative', 'Zero', 'Positive'][type]}: ${right.toLowerCase()}.`],
      };
    }
    const right = P(r), wr = [`(${m * r + n}, ${r})`, `(${-r}, ${m * r + n})`, `(${r}, ${-(m * r + n)})`, `(${r}, ${r * r})`, `(${r + 1}, ${m * (r + 1) + n})`, `(${r}, ${m * r + n + 2})`, `(${r - 1}, ${m * (r - 1) + n})`, `(${r + 2}, ${m * r + n})`]
      .filter((v, i, a) => v !== P(s) && v !== right && a.indexOf(v) === i);
    const base = {
      topic: 'SYSTEMS', ...textual(right, wr),
      steps: [`Set them equal: ${px([1, b, c])} = ${lin(m, n)}`, `${px([1, b - m, c - n])} = 0, so x = ${r} or x = ${s}`, `At x = ${r}: y = ${m * r + n}. So ${right} works.`],
    };
    if (f === 1) {
      return Object.assign(base, {
        text: `The graph shows y = ${px([1, b, c])} and y = ${lin(m, n)}. Which point is a solution of the system?`, size: [96, 80],
        steps: ['The solutions are where the graphs cross.', `They cross at ${P(r)} and ${P(s)}.`],
        fig: (cx, w, h) => {
          const G = F.grid(cx, w, h, [-6, 6], [-8, 8], 1, 2);
          F.plot(cx, G, x => x * x + b * x + c, [-6, 6], HOT); F.plot(cx, G, x => m * x + n, [-6, 6], BLU);
          F.dot(cx, G(r, m * r + n), RED); F.dot(cx, G(s, m * s + n), RED);
        },
      });
    }
    return Object.assign(base, { text: `Which ordered pair (x, y) is a solution of the system?\n${sys}` });
  };
  levels.satLineParabola = [2, 3, 4];

  // Transformations of functions: points and graphs.
  const SHAPES = [[[-3, 1], [-1, 3], [1, -1], [2, 0]], [[-3, -2], [-2, 1], [0, 1], [2, -1]], [[-2, 0], [0, 3], [1, 1], [3, 2]]];
  kinds.satTransform = d => {
    const f = d < 2 ? 0 : randInt(0, 2);
    const a = nz(-6, 6), b = nz(-6, 6);
    if (f === 0) {
      let h, k; do { h = nz(-5, 5); k = nz(-5, 5); } while (h === k || h === -k);
      return {
        topic: 'FUNCTIONS', text: `The point (${a}, ${b}) is on the graph of y = f(x). Which point must be on the graph of y = f(x ${signed(-h)}) ${signed(k)}?`,
        ...textual(pt(a + h, b + k), [pt(a - h, b + k), pt(a + h, b - k), pt(a + k, b + h), pt(a - h, b - k)]),
        steps: [`f(x ${signed(-h)}) moves the graph ${Math.abs(h)} ${h > 0 ? 'right' : 'left'}: x becomes ${a} ${signed(h)} = ${a + h}.`, `${signed(k)} moves it ${Math.abs(k)} ${k > 0 ? 'up' : 'down'}: y becomes ${b} ${signed(k)} = ${b + k}.`, pt(a + h, b + k)],
      };
    }
    if (f === 1) {
      const ops = [['-f(x)', [a, -b], 'Flip over the x-axis: y changes sign.'], ['f(-x)', [-a, b], 'Flip over the y-axis: x changes sign.'], ['2f(x)', [a, 2 * b], 'Stretch: y doubles.'], ['f(x) - 3', [a, b - 3], 'Down 3: y drops by 3.'], ['f(x + 3)', [a - 3, b], 'Left 3: x drops by 3.']];
      const [e, p, why] = pick(ops);
      return {
        topic: 'FUNCTIONS', text: `The point (${a}, ${b}) is on the graph of y = f(x). Which point must be on the graph of y = ${e}?`,
        ...textual(pt(...p), ops.filter(o => o[0] !== e).map(o => pt(...o[1])).concat([pt(b, a)])),
        steps: [why, `(${a}, ${b}) becomes ${pt(...p)}.`],
      };
    }
    const shape = pick(SHAPES);
    let h, k; do { h = nz(-3, 3); k = nz(-3, 3); } while (h === k || h === -k);
    const G = (p, q) => `g(x) = f(x ${signed(-p)}) ${signed(q)}`;
    return {
      topic: 'FUNCTIONS', text: 'The graphs of y = f(x) (blue) and y = g(x) (yellow) are shown. Which equation defines g?', size: [96, 80],
      ...textual(G(h, k), [G(-h, k), G(k, h), G(h, -k), G(-h, -k)]),
      steps: [`Each point of f moved ${Math.abs(h)} ${h > 0 ? 'right' : 'left'} and ${Math.abs(k)} ${k > 0 ? 'up' : 'down'}.`, `Right h means x - h inside; up k means + k outside.`, G(h, k)],
      fig: (c, w, h2) => {
        const P = F.grid(c, w, h2, [-7, 7], [-6, 6]);
        for (let i = 0; i < 3; i++) F.line(c, ...P(...shape[i]), ...P(...shape[i + 1]), BLU);
        for (let i = 0; i < 3; i++) F.line(c, ...P(shape[i][0] + h, shape[i][1] + k), ...P(shape[i + 1][0] + h, shape[i + 1][1] + k), HOT);
      },
    };
  };
  levels.satTransform = [2, 3, 4];

  // Polynomial zeros and factors; the remainder theorem.
  kinds.satPolyZeros = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 3);
    if (f === 0) {
      let z; do z = [nz(-6, 6), nz(-6, 6), nz(-6, 6)]; while (new Set(z.map(Math.abs)).size < 3);
      const fac = z.map(v => `(x ${signed(-v)})`).join(''), right = pick(z);
      return {
        topic: 'POLYNOMIALS', text: `The function p is defined by p(x) = ${fac}. Which of the following is a zero of p?`,
        ...numeric(right, z.map(v => -v).concat([0, z[0] * z[1] * z[2]])),
        steps: ['p(x) = 0 when one factor is 0.', `x ${signed(-right)} = 0 gives x = ${right}.`, `The zeros are ${z.join(', ')}; not their opposites.`],
      };
    }
    if (f === 1) {
      const k = nz(-9, 9), right = `x ${signed(-k)}`;
      return {
        topic: 'POLYNOMIALS', text: `For a polynomial p, p(${k}) = 0. Which must be a factor of p(x)?`,
        ...textual(right, [`x ${signed(k)}`, `${k === 1 ? '' : k === -1 ? '-' : k}x`, `x^2 ${signed(k)}`, `x^2 ${signed(-k * k)}`].filter(v => v !== right)),
        steps: ['If p(k) = 0, then x - k is a factor.', k < 0 ? `k = ${k}: x - (${k}) = ${right}` : `k = ${k}: the factor is ${right}.`],
      };
    }
    if (f === 2) {
      const cs = [1, nz(-5, 5), nz(-9, 9), nz(-9, 9)], k = nz(-3, 3), pv = x => cs[0] * x ** 3 + cs[1] * x * x + cs[2] * x + cs[3], R = pv(k);
      return {
        topic: 'POLYNOMIALS', text: `What is the remainder when p(x) = ${px(cs)} is divided by x ${signed(-k)}?`,
        ...numeric(R, [pv(-k), cs[3], R + k, -R]),
        steps: ['The remainder after dividing by x - k is p(k).', `p(${k}) = ${k ** 3} ${signed(cs[1] * k * k)} ${signed(cs[2] * k)} ${signed(cs[3])}`, `= ${R}`],
      };
    }
    let z; do z = [randInt(-4, 4), randInt(-4, 4), randInt(-4, 4)].sort((p, q) => p - q); while (new Set(z).size < 3 || z[2] - z[0] < 4 || z[0] === -z[2] && z[1] === 0);
    const P = s => z.map(v => (s ? -v : v)).map(v => v === 0 ? 'x' : `(x ${signed(-v)})`).join('');
    const sw = [...z]; sw[1] = -sw[1];
    const Q = zz => zz.map(v => v === 0 ? 'x' : `(x ${signed(-v)})`).join('');
    let top = 0; for (let x = z[0] - .6; x <= z[2] + .6; x += .05) top = Math.max(top, Math.abs((x - z[0]) * (x - z[1]) * (x - z[2])));
    const scale = 5 / top;
    return {
      topic: 'POLYNOMIALS', text: 'The graph of y = p(x) is shown. Which of the following could be p(x)?', size: [100, 64],
      ...textual(P(false), [P(true), Q(sw), Q([z[0] - 1, z[1], z[2]]), Q([z[0], z[1], z[2] + 1])].filter(v => v !== P(false))),
      steps: [`The graph crosses the x-axis at ${z.join(', ')}.`, 'A zero at x = a means a factor (x - a).', `p(x) = ${P(false)}`],
      fig: (c, w, h) => { const G = F.grid(c, w, h, [-5, 5], [-6, 6], 1, 2); F.plot(c, G, x => scale * (x - z[0]) * (x - z[1]) * (x - z[2]), [-5, 5], HOT); },
    };
  };
  levels.satPolyZeros = [2, 3, 4];

  // Function notation from tables and graphs.
  kinds.satFuncTable = d => {
    const f = d < 2 ? pick([0, 2]) : randInt(0, 2);
    const xs = [1, 2, 3, 4, 5];
    if (f === 2) {
      const m = pick([-2, -1, 1, 2, 1 / 2, -1 / 2]), b = randInt(-2, 2), X = Number.isInteger(m) ? randInt(-3, 3) : 2 * randInt(-2, 2), Y = m * X + b;
      return {
        topic: 'FUNCTIONS', text: `The graph of the linear function f is shown. What is the value of f(${X})?`, size: [96, 80],
        ...numeric(Y, [X, -Y, m * -X + b, Y + 1, b]),
        steps: [`Find x = ${X} on the line.`, `The line's height there is ${Y}.`, `f(${X}) = ${Y}`],
        fig: (c, w, h) => { const G = F.grid(c, w, h, [-6, 6], [-6, 6]); F.plot(c, G, x => m * x + b, [-6, 6], HOT); F.dot(c, G(0, b), RED); },
      };
    }
    let fv, gv, tries = 0;
    do { fv = xs.map(() => randInt(0, 9)); gv = xs.map(() => pick(xs)); } while ((f === 1 ? xs.filter((x, i) => fv[i] === gv[i]).length !== 1 : false) && ++tries < 80);
    if (tries >= 80) { fv = [3, 5, 2, 7, 1]; gv = [2, 4, 2, 1, 5]; }
    const fig = (c, w, h) => table(c, w, h, [['x', ...xs], ['f(x)', ...fv], ['g(x)', ...gv]]);
    if (f === 1) {
      const i = xs.findIndex((x, j) => fv[j] === gv[j]);
      return {
        topic: 'FUNCTIONS', text: 'The table shows values of f and g. For which value of x is f(x) = g(x)?', size: [130, 42], fig,
        ...numeric(xs[i], [fv[i] === xs[i] ? 0 : fv[i], ...xs.filter(x => x !== xs[i])]),
        steps: ['Look for a column where the f and g rows match.', `At x = ${xs[i]}: f = ${fv[i]} and g = ${gv[i]}.`],
      };
    }
    const k = pick(xs), m = gv[k - 1], ans = fv[m - 1], gf = xs.includes(fv[k - 1]) ? gv[fv[k - 1] - 1] : fv[k - 1] + gv[k - 1];
    return {
      topic: 'FUNCTIONS', text: `The table shows values of f and g. What is f(g(${k}))?`, size: [130, 42], fig,
      ...numeric(ans, [gf, fv[k - 1], m, fv[k - 1] * gv[k - 1], ans + 1]),
      steps: [`Inside first: g(${k}) = ${m}`, `Then f(${m}) = ${ans}`],
    };
  };
  levels.satFuncTable = [1, 2, 3, 4];

  // Absolute value equations, inequalities and graphs.
  kinds.satAbsValue = d => {
    const f = d < 2 ? pick([0, 3]) : randInt(0, 3);
    const a = nz(-9, 9), b = randInt(2, 9);
    if (f === 0) {
      return {
        topic: 'ABSOLUTE VAL', text: `What is the sum of the solutions of |x ${signed(-a)}| = ${b}?`,
        ...numeric(2 * a, [2 * b, a, 0, a + b, -2 * a]),
        steps: [`x ${signed(-a)} = ${b} or x ${signed(-a)} = ${-b}`, `x = ${a + b} or x = ${a - b}`, `Sum: ${a + b} + ${a - b < 0 ? '(' + (a - b) + ')' : a - b} = ${2 * a}`],
      };
    }
    if (f === 1) {
      const inside = shuffle([a - b, a + b, a, a - b + 1, a + b - 1].filter((v, i, s) => s.indexOf(v) === i)).slice(0, 3), out = pick([a - b - 1, a + b + 1, -a, b - a]);
      const outV = Math.abs(out - a) > b ? out : a + b + 2;
      return {
        topic: 'ABSOLUTE VAL', text: `Which value of x is NOT a solution of |x ${signed(-a)}| ≤ ${b}?`,
        ...numeric(outV, inside),
        steps: [`|x ${signed(-a)}| ≤ ${b} means ${a - b} ≤ x ≤ ${a + b}.`, `${outV} is outside that interval.`],
      };
    }
    if (f === 2) {
      let A, m, n, cand, sols, tries = 0;
      const good = (x, A, m, n) => Math.abs(Math.abs(x - A) - (m * x + n)) < 1e-9;
      do {
        A = nz(-6, 6); m = pick([2, 3, -2]); n = nz(-6, 6); cand = [(A + n) / (1 - m), (A - n) / (1 + m)];
        sols = [...new Set(cand.filter(x => good(x, A, m, n)))];
      } while ((sols.length !== 1 || !Number.isInteger(sols[0]) || cand[0] === cand[1]) && ++tries < 100);
      if (tries >= 100) { A = 4; m = 2; n = 1; cand = [-5, 1]; sols = [1]; }
      const x = sols[0], other = cand.find(v => v !== x);
      return {
        topic: 'ABSOLUTE VAL', text: `What is the solution to |x ${signed(-A)}| = ${lin(m, n)}?`,
        ...numeric(x, [other, -x, A, n, x + 2]),
        steps: [`Case 1: x ${signed(-A)} = ${lin(m, n)}. Case 2: x ${signed(-A)} = -(${lin(m, n)}).`, `The cases give x = ${show(cand[0])} and x = ${show(cand[1])}.`, `Check: x = ${show(other)} makes ${lin(m, n)} negative, so only x = ${x} works.`],
      };
    }
    const h = nz(-4, 4), k = nz(-4, 4);
    return {
      topic: 'ABSOLUTE VAL', text: `What is the vertex of the graph of y = |x ${signed(-h)}| ${signed(k)}?`,
      ...textual(pt(h, k), [pt(-h, k), pt(k, h), pt(h, -k), pt(-h, -k)]),
      steps: ['y = |x - h| + k has its corner (vertex) at (h, k).', `h = ${h}, k = ${k}`, pt(h, k)],
    };
  };
  levels.satAbsValue = [1, 2, 3, 4];

  // ---- Problem solving and data analysis

  // Rates and unit conversion.
  kinds.satUnits = d => {
    const f = d < 2 ? pick([1, 2, 4]) : randInt(0, 4);
    if (f === 0) {
      const v = pick([22, 44, 66, 88]), ans = v * 15 / 22;
      return {
        topic: 'UNITS', text: `A skateboarder bombs a hill at ${v} feet per second. What is that speed in miles per hour? (1 mile = 5,280 feet)`,
        ...numeric(ans, [Math.round(v * 22 / 15), v, Math.round(v * 3.6), ans * 2, Math.round(v * 60 / 52.8)]),
        steps: [`${v} ft/s × 3,600 s/hour = ${cm(v * 3600)} feet per hour`, `${cm(v * 3600)} ÷ 5,280 = ${ans}`, `${ans} miles per hour`],
      };
    }
    if (f === 1) {
      const p = pick([12, 15, 18, 20, 25, 30]), t = pick([1.5, 2, 2.5, 3, 4]), N = p * 60 * t;
      return {
        topic: 'UNITS', text: `A copy shop's machine prints ${p} pages a minute. How many hours does it take to print ${cm(N)} flyers for a block party?`,
        ...numeric(t, [N / p / 100, t * 2, t + .5, N / p / 60 / 2, 60 * t], v => String(r2(v))),
        steps: [`${cm(N)} ÷ ${p} = ${cm(N / p)} minutes`, `${cm(N / p)} ÷ 60 = ${t} hours`],
      };
    }
    if (f === 2) {
      let a, b; do { a = randInt(2, 5); b = randInt(3, 6); } while (gcd(a, b) !== 1 || 60 % b);
      const H = randInt(1, 3), ans = a * 60 * H / b;
      return {
        topic: 'UNITS', text: `A tape deck dubs ${a} mixtapes every ${b} minutes. At this rate, how many mixtapes can it dub in ${H} hour${H > 1 ? 's' : ''}?`,
        ...numeric(ans, [b * 60 * H / a, a * H, a * b * H, ans / 2, 60 * H / b]),
        steps: [`${H} hour${H > 1 ? 's' : ''} = ${60 * H} minutes`, `${60 * H} ÷ ${b} = ${60 * H / b} batches of ${a}`, `${60 * H / b} × ${a} = ${ans}`],
      };
    }
    if (f === 3) {
      const L = 3 * randInt(3, 8), W = 3 * randInt(2, 6), ans = L * W / 9;
      return {
        topic: 'UNITS', text: `A basement rec room is ${L} feet by ${W} feet. What is its area in square yards? (1 yard = 3 feet)`,
        ...numeric(ans, [L * W / 3, L * W, 2 * (L + W) / 3, ans * 2]),
        steps: [`In yards: ${L} ÷ 3 = ${L / 3} and ${W} ÷ 3 = ${W / 3}`, `${L / 3} × ${W / 3} = ${ans} square yards`, `(Dividing the square feet by 3 is the trap: 1 square yard is 9 square feet.)`],
      };
    }
    const mpg = pick([18, 20, 24, 25, 30]), trips = randInt(3, 9), miles = mpg * trips, price = pick([1.1, 1.2, 1.25, 1.4]), cost = r2(trips * price);
    return {
      topic: 'UNITS', text: `It's 1994, and gas costs $${price.toFixed(2)} a gallon. A cab gets ${mpg} miles per gallon. What does gas cost for ${an(miles)}-mile day?`,
      ...numeric(cost, [r2(miles * price), r2(mpg * price), r2(cost + price), r2(miles / price / 10)], money),
      steps: [`${miles} ÷ ${mpg} = ${trips} gallons`, `${trips} × $${price.toFixed(2)} = ${money(cost)}`],
    };
  };
  levels.satUnits = [1, 2, 3, 4];

  // Density: people per square mile, grams per cubic centimeter.
  kinds.satDensity = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 2);
    if (f === 0) {
      const A = pick([1.5, 2, 2.5, 3, 3.5, 4]), D = randInt(40, 180) * 100, P = A * D, askP = rand() < .5;
      return {
        topic: 'DENSITY', text: askP ? `A neighborhood covers ${A} square miles and has a population density of ${cm(D)} people per square mile. About how many people live there?`
          : `A neighborhood of ${cm(P)} people has a population density of ${cm(D)} people per square mile. How many square miles does it cover?`,
        ...(askP ? numeric(P, [D / A, D + A, D, P * 2], cm) : numeric(A, [P / D * 2, D / P * 1000, A + 1, A / 2], v => String(r2(v)))),
        steps: ['Density = people ÷ area', askP ? `People = ${cm(D)} × ${A} = ${cm(P)}` : `Area = ${cm(P)} ÷ ${cm(D)} = ${A} square miles`],
      };
    }
    if (f === 1) {
      const [thing, dd] = pick([['brass doorknob', 8.5], ['block of ice', 0.9], ['chunk of granite', 2.7], ['silver chain', 10.5], ['cube of maple wood', 0.7]]), V = randInt(4, 40), m = r1(dd * V);
      const askM = rand() < .5;
      return {
        topic: 'DENSITY', text: askM ? `A ${thing} has a volume of ${V} cubic centimeters and a density of ${dd} grams per cubic centimeter. What is its mass, in grams?`
          : `A ${thing} has a mass of ${m} grams and a volume of ${V} cubic centimeters. What is its density, in grams per cubic centimeter?`,
        ...(askM ? numeric(m, [r1(V / dd), r1(dd + V), V, r1(m * 2)], v => String(v)) : numeric(dd, [r2(V / m), r1(m - V), r1(dd * 2), r1(dd + 1)], v => String(v))),
        steps: ['Density = mass ÷ volume', askM ? `Mass = ${dd} × ${V} = ${m} grams` : `${m} ÷ ${V} = ${dd} grams per cubic centimeter`],
      };
    }
    const dd = randInt(2, 9), e = randInt(2, 5), M = dd * e ** 3;
    return {
      topic: 'DENSITY', text: `A metal cube has a density of ${dd} grams per cubic centimeter and a mass of ${M} grams. What is the length of one edge, in centimeters?`,
      ...numeric(e, [e ** 3, M / dd / 2, e * e, dd, e + 1]),
      steps: [`Volume = mass ÷ density = ${M} ÷ ${dd} = ${e ** 3} cubic cm`, `Edge = cube root of ${e ** 3} = ${e} cm`],
    };
  };
  levels.satDensity = [1, 2, 3, 4];

  // Successive percent changes.
  const change = v => v === 0 ? 'No change' : `${cm(Math.abs(r2(v)))}% ${v > 0 ? 'increase' : 'decrease'}`;
  kinds.satPctChange = d => {
    const f = d < 2 ? pick([1, 3]) : randInt(0, 3);
    if (f === 0) {
      const p = pick([10, 20, 25, 30, 40, 50]), q = pick([10, 20, 25, 30, 40, 50]), net = p - q - p * q / 100;
      return {
        topic: 'PERCENTS', text: `A pawn shop raises the price of a boombox by ${p}%, then a week later cuts the new price by ${q}%. What is the overall change from the original price?`,
        ...textual(change(net), [change(p - q), change(-net), change(p + q), change(p * q / 100), change(net - 5)]),
        steps: [`Multiply: ${1 + p / 100} × ${1 - q / 100} = ${r2((1 + p / 100) * (1 - q / 100))}`, 'The second percent is of the NEW price, so they don\'t just add.', `Overall: ${change(net).toLowerCase()}`],
      };
    }
    if (f === 1) {
      const p = pick([10, 20, 25, 40, 50]), O = randInt(2, 16) * (p === 25 ? 4 : p === 40 ? 5 : 10), Fp = O * (1 + p / 100);
      return {
        topic: 'PERCENTS', text: `After a ${p}% markup, a pair of high-tops sells for $${cm(Fp)}. What was the price before the markup?`,
        ...numeric(O, [r2(Fp * (1 - p / 100)), Fp - p, r2(Fp / (1 - p / 100)), O + p / 10], money),
        steps: [`Marked-up price = ${1 + p / 100} × original`, `Original = ${cm(Fp)} ÷ ${1 + p / 100} = ${O}`, `Not ${money(r2(Fp * (1 - p / 100)))}: the ${p}% was of the original.`],
      };
    }
    if (f === 2) {
      const p = pick([10, 20, 30, 50]), q = pick([10, 20, 50]), net = p + q + p * q / 100;
      return {
        topic: 'PERCENTS', text: `A record store's sales rose ${p}% in one year and ${q}% the next. By what percent did sales rise over the two years?`,
        ...numeric(net, [p + q, p * q, net + 10, (p + q) / 2], v => cm(r2(v)) + '%'),
        steps: [`${1 + p / 100} × ${1 + q / 100} = ${r2((1 + p / 100) * (1 + q / 100))}`, `That's ${an(net)}% increase, more than ${p} + ${q}.`],
      };
    }
    let A, pc, tries = 0; do { A = pick([40, 50, 80, 120, 200, 250]); pc = pick([10, 20, 25, 40, 60, 75]); } while (!Number.isInteger(A * (100 - pc) / 100) && ++tries < 30);
    if (tries >= 30) { A = 80; pc = 25; }
    const B = A * (100 - pc) / 100;
    return {
      topic: 'PERCENTS', text: `A video arcade's token price fell from ${A}¢ to ${B}¢. By what percent did it fall?`,
      ...numeric(pc, [r2((A - B) / B * 100), A - B, 100 - pc, pc / 2], v => cm(r2(v)) + '%'),
      steps: [`Drop: ${A} - ${B} = ${A - B}`, `Divide by the ORIGINAL: ${A - B} ÷ ${A} = ${r2(pc / 100)}`, `= ${pc}%`],
    };
  };
  levels.satPctChange = [1, 2, 3, 4];

  // A percent of a percent.
  kinds.satPctOfPct = d => {
    const f = d < 2 ? pick([0, 3]) : randInt(0, 3);
    if (f === 0) {
      const p = pick([10, 20, 25, 30, 40, 50, 60]), q = pick([10, 20, 25, 40, 50, 80]), N = pick([200, 400, 500, 800, 1000, 1200, 2000]), ans = p * q * N / 10000;
      return {
        topic: 'PERCENTS', text: `What is ${p}% of ${q}% of ${cm(N)}?`,
        ...numeric(ans, [(p + q) * N / 100, p * N / 100, Math.abs(p - q) * N / 100, ans * 10], v => cm(r2(v))),
        steps: [`${q}% of ${cm(N)} = ${cm(q * N / 100)}`, `${p}% of ${cm(q * N / 100)} = ${cm(r2(ans))}`],
      };
    }
    if (f === 1) {
      const p = pick([20, 25, 40, 60, 75]), q = pick([10, 15, 30, 50]), n = randInt(1, 12) * 20, A = p * n / 100, ans = q * n / 100;
      if (!Number.isInteger(A)) return kinds.satPctOfPct(1);
      return {
        topic: 'PERCENTS', text: `If ${p}% of a number is ${cm(A)}, what is ${q}% of the same number?`,
        ...numeric(ans, [n, q * A / 100, A * q / p * 2, A - (p - q)], v => cm(r2(v))),
        steps: [`${p / 100} × n = ${A}, so n = ${n}`, `${q}% of ${n} = ${cm(r2(ans))}`],
      };
    }
    if (f === 2) {
      const a = pick([120, 150, 200, 250, 40, 60, 80]), b = pick([20, 40, 50, 60, 80]), ans = a * b / 100;
      return {
        topic: 'PERCENTS', text: `The number x is ${a}% of y, and y is ${b}% of z. Then x is what percent of z?`,
        ...numeric(ans, [a + b, Math.abs(a - b), a * b, a / b * 100], v => cm(r2(v)) + '%'),
        steps: [`x = ${a / 100}y and y = ${b / 100}z`, `x = ${a / 100} × ${b / 100} z = ${r2(ans / 100)}z`, `So x is ${cm(r2(ans))}% of z.`],
      };
    }
    const p = pick([40, 50, 60, 75, 80]), q = pick([10, 20, 25, 40, 50]), ans = p * q / 100;
    return {
      topic: 'PERCENTS', text: `At a block party, ${p}% of the crowd are kids, and ${q}% of the kids are doing the electric slide. What percent of the whole crowd are kids doing the electric slide?`,
      ...numeric(ans, [q, p + q, p - q, p * q].filter(v => v > 0 && v <= 100), v => cm(r2(v)) + '%'),
      steps: [`${q}% of ${p}% = ${q / 100} × ${p}%`, `= ${cm(r2(ans))}%`],
    };
  };
  levels.satPctOfPct = [1, 2, 3, 4];

  // Two-way tables and conditional probability.
  const TWOWAY = [
    ['A video store tracked its rentals.', ['NEW', 'CLASSIC'], ['a new release', 'a classic'], ['MOVIE', 'GAME'], ['a movie', 'a game'], 'rental'],
    ['A sneaker shop tracked the pairs it sold.', ['HIGH', 'LOW'], ['a high-top', 'a low-top'], ['WHITE', 'BLACK'], ['white', 'black'], 'pair sold'],
    ['A pizza shop tracked its orders.', ['SLICE', 'WHOLE'], ['a slice', 'a whole pie'], ['CHEESE', 'VEGGIE'], ['cheese', 'veggie'], 'order'],
  ];
  kinds.satCondProb = d => {
    const [intro, R, Rw, C, Cw, unit] = pick(TWOWAY), v = [[randInt(8, 60), randInt(8, 60)], [randInt(8, 60), randInt(8, 60)]];
    const rt2 = [v[0][0] + v[0][1], v[1][0] + v[1][1]], ct = [v[0][0] + v[1][0], v[0][1] + v[1][1]], T = rt2[0] + rt2[1], i = randInt(0, 1), j = randInt(0, 1);
    const f = d < 2 ? pick([0, 1]) : randInt(0, 2);
    const Q = [
      [`Given that a randomly chosen ${unit} was ${Cw[j]}, what is the probability it was ${Rw[i]}?`, v[i][j], ct[j], `Only the ${C[j]} column counts: ${ct[j]}.`],
      [`Given that a randomly chosen ${unit} was ${Rw[i]}, what is the probability it was ${Cw[j]}?`, v[i][j], rt2[i], `Only the ${R[i]} row counts: ${rt2[i]}.`],
      [`If one ${unit} is chosen at random, what is the probability it was NOT ${Rw[i]}?`, rt2[1 - i], T, `Everyone counts: ${T}. Not ${R[i]} means the other row.`],
    ][f];
    const right = fr(Q[1], Q[2]);
    return {
      topic: 'PROBABILITY', text: `${intro} ${Q[0]}`, size: [161, 49],
      ...textual(right, [fr(v[i][j], T), fr(v[i][j], ct[j]), fr(v[i][j], rt2[i]), fr(rt2[i], T), fr(ct[j], T), fr(v[1 - i][j], ct[j]), fr(v[i][1 - j], rt2[i]), fr(Q[1], Q[2] + Q[1]), fr(Q[1] + 1, Q[2]), fr(Q[2] - Q[1] + 1, Q[2])].filter(s => s !== right)),
      steps: [Q[3], `The part we want: ${Q[1]}.`, `P = ${Q[1]}/${Q[2]}${fr(Q[1], Q[2]) === Q[1] + '/' + Q[2] ? '' : ' = ' + right}`],
      fig: (c, w, h) => table(c, w, h, [['', ...C, 'TOTAL'], [R[0], v[0][0], v[0][1], rt2[0]], [R[1], v[1][0], v[1][1], rt2[1]], ['TOTAL', ct[0], ct[1], T]]),
    };
  };
  levels.satCondProb = [1, 2, 3, 4];

  // Probability: complements, expected counts, drawing without replacement.
  kinds.satProbability = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 3);
    if (f === 0) {
      const cols = ['cherry', 'grape', 'lime'], n = [randInt(3, 12), randInt(3, 12), randInt(3, 12)], T = n[0] + n[1] + n[2], k = randInt(0, 2), right = fr(T - n[k], T);
      return {
        topic: 'PROBABILITY', text: `A gumball machine holds ${n[0]} cherry, ${n[1]} grape and ${n[2]} lime gumballs. If one comes out at random, what is the probability it is NOT ${cols[k]}?`,
        ...textual(right, [fr(n[k], T), fr(T - n[k], n[k]), fr(n[(k + 1) % 3], T), fr(1, 3), fr(2, 3), fr(T - n[k] - 1, T)].filter(s => s !== right)),
        steps: [`Total: ${T} gumballs.`, `Not ${cols[k]}: ${T} - ${n[k]} = ${T - n[k]}`, `P = ${T - n[k]}/${T}${fr(T - n[k], T) === `${T - n[k]}/${T}` ? '' : ' = ' + right}`],
      };
    }
    if (f === 1) {
      const p = pick([.15, .2, .25, .3, .35, .4, .6, .75]), N = pick([40, 80, 120, 200, 300, 400]), ans = Math.round(p * N);
      return {
        topic: 'PROBABILITY', text: `A pinball machine gives a free game on ${Math.round(p * 100)}% of plays. In ${N} plays, about how many free games should you expect?`,
        ...numeric(ans, [N - ans, Math.round(N / (p * 100)), Math.round(p * 100), ans * 2]),
        steps: [`Expected = probability × plays`, `${p} × ${N} = ${ans}`],
      };
    }
    if (f === 2) {
      const g = randInt(3, 7), s = randInt(2, 6), T = g + s, right = fr(g * (g - 1), T * (T - 1));
      return {
        topic: 'PROBABILITY', text: `A cup holds ${g} gold tokens and ${s} silver ones. Two are drawn at random, without replacement. What is the probability both are gold?`,
        ...textual(right, [fr(g * g, T * T), fr(g, T), fr(2 * g, T), fr(g - 1, T - 1), fr(g * (g - 1), T * T)].filter(v => v !== right)),
        steps: [`First gold: ${g}/${T}. Then ${g - 1} gold are left of ${T - 1}.`, `${g}/${T} × ${g - 1}/${T - 1} = ${g * (g - 1)}/${T * (T - 1)}`, `= ${right}`],
      };
    }
    const p = pick([.1, .2, .3, .4]), q = r2((1 - p) ** 2);
    return {
      topic: 'PROBABILITY', text: `The chance a pager battery dies on any given day is ${p}, independent of other days. What is the probability it survives 2 days in a row?`,
      ...numeric(q, [r2(1 - 2 * p), r2(1 - p), r2(p * p), r2(1 - p * p)], v => String(v)),
      steps: [`Survives one day: 1 - ${p} = ${r2(1 - p)}`, `Two days in a row: ${r2(1 - p)} × ${r2(1 - p)} = ${q}`],
    };
  };
  levels.satProbability = [1, 2, 3, 4];

  // How the mean and median change when a value is added or removed.
  kinds.satMeanChange = d => {
    const f = d < 2 ? pick([0, 3]) : randInt(0, 3);
    if (f === 0) {
      const n = randInt(4, 9), m = randInt(10, 40);
      let m2 = m + nz(-4, 4); if ((n + 1) * m2 - n * m <= 0) m2 = m + 2;
      const add = (n + 1) * m2 - n * m;
      return {
        topic: 'STATISTICS', text: `The mean of ${n} test scores is ${m}. When one more score is added, the mean becomes ${m2}. What score was added?`,
        ...numeric(add, [m2, m2 - m, (m + m2) / 2, add + n, n * m2 - n * m].filter(v => v > 0)),
        steps: [`Old total: ${n} × ${m} = ${n * m}`, `New total: ${n + 1} × ${m2} = ${(n + 1) * m2}`, `Added: ${(n + 1) * m2} - ${n * m} = ${add}`],
      };
    }
    if (f === 1) {
      const n = randInt(5, 9), m2 = randInt(10, 30), v = randInt(2, 60), tot = (n - 1) * m2 + v;
      return {
        topic: 'STATISTICS', text: `A list of ${n} numbers has a sum of ${tot}. If the number ${v} is removed, what is the mean of the numbers left?`,
        ...numeric(m2, [r2(tot / n), r2((tot - v) / n), r2(tot / (n - 1)), m2 + 1]),
        steps: [`Sum left: ${tot} - ${v} = ${tot - v}`, `Numbers left: ${n - 1}`, `Mean: ${tot - v} ÷ ${n - 1} = ${m2}`],
      };
    }
    if (f === 2) {
      const n = pick([5, 7]), data = Array.from({ length: n }, () => randInt(10, 40)).sort((a, b) => a - b), add = randInt(41, 80);
      const all = [...data, add].sort((a, b) => a - b), med = (all[n / 2 - .5] + all[n / 2 + .5]) / 2, old = data[(n - 1) / 2];
      return {
        topic: 'STATISTICS', text: `The data set ${data.join(', ')} gets one more value, ${add}. What is the median of the new data set?`,
        ...numeric(med, [old, (old + add) / 2, add, r2(all.reduce((s, x) => s + x, 0) / (n + 1)), data[(n + 1) / 2]].filter(v => v !== med), v => String(r2(v))),
        steps: [`New list: ${all.join(', ')}`, `${n + 1} values: average the middle two, ${all[n / 2 - .5]} and ${all[n / 2 + .5]}.`, `Median = ${r2(med)}`],
      };
    }
    const k = randInt(2, 9), up = rand() < .6;
    const right = up ? `Mean up ${k}; SD unchanged` : `Mean doubles; SD doubles`;
    return {
      topic: 'STATISTICS', text: up ? `A teacher adds ${k} points to every score on a quiz. How do the mean and standard deviation (SD) change?` : 'Every value in a data set is doubled. How do the mean and standard deviation (SD) change?',
      ...textual(right, (up ? [`Mean up ${k}; SD up ${k}`, `Mean unchanged; SD up ${k}`, 'Both unchanged'] : ['Mean doubles; SD unchanged', 'Mean unchanged; SD doubles', 'Both unchanged'])),
      steps: up ? [`Every score moves up ${k}, so the center moves up ${k}.`, 'The scores are just as spread out, so the SD stays the same.'] : ['Doubling every value doubles the center.', 'It also doubles every distance from the mean: SD doubles.'],
    };
  };
  levels.satMeanChange = [1, 2, 3, 4];

  // Comparing spread: standard deviation and range.
  const SPREADS = [[-1, 0, 0, 1], [-2, -1, 1, 2], [-3, 0, 0, 3], [-5, 0, 0, 5], [-3, -3, 3, 3], [0, 0, 0, 0], [-6, -2, 2, 6]];
  const sd = a => { const m = a.reduce((s, x) => s + x, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };
  kinds.satSpread = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 2);
    if (f === 0) {
      let set, tries = 0; do set = shuffle([...SPREADS]).slice(0, 4); while (new Set(set.map(s => r2(sd(s)))).size < 4 && ++tries < 30);
      const c = randInt(10, 50), lists = set.map(s => s.map(v => v + c)), big = rand() < .5, vals = set.map(sd);
      const target = big ? Math.max(...vals) : Math.min(...vals), k = vals.indexOf(target), L = l => l.join(', ');
      return {
        topic: 'STATISTICS', text: `Each list has a mean of ${c}. Which list has the ${big ? 'greatest' : 'smallest'} standard deviation?`,
        ...textual(L(lists[k]), lists.filter((_, i) => i !== k).map(L)),
        steps: ['Standard deviation measures how far values sit from the mean.', `${L(lists[k])} has values ${big ? 'farthest from' : 'closest to'} ${c}.`],
      };
    }
    if (f === 1) {
      const c = randInt(3, 6), tight = [c - 1, c, c, c, c + 1, c, c - 1, c + 1, c], wide = [c - 3, c - 2, c, c + 2, c + 3, c - 3, c + 3, c, c], aWide = rand() < .5;
      const A = aWide ? wide : tight, B = aWide ? tight : wide, right = aWide ? 'The SD of P is greater' : 'The SD of Q is greater';
      const draw = (c2, w, y0, data, name) => {
        const cnt = {}; data.forEach(v => cnt[v] = (cnt[v] || 0) + 1);
        F.line(c2, 12, y0, w - 3, y0, DIM); F.label(c2, name, 5, y0 - 6, HOT);
        for (let v = 0; v <= 10; v++) { const x = 15 + v * Math.floor((w - 24) / 10); if (cnt[v]) for (let j = 0; j < cnt[v]; j++) F.disc(c2, x, y0 - 4 - j * 5, 2, BLU); if (v % 2 === 0) F.label(c2, String(v), x, y0 + 6, DIM); }
      };
      return {
        topic: 'STATISTICS', text: 'The dot plots show data sets P and Q. Both have the same mean. Which statement is true?', size: [120, 76],
        ...textual(right, ['The SD of P is greater', 'The SD of Q is greater', 'The SDs are equal', 'The SD of each is 0'].filter(s => s !== right)),
        steps: [`${aWide ? 'P' : 'Q'} is spread out; ${aWide ? 'Q' : 'P'} bunches near the middle.`, 'More spread from the mean means a larger SD.'],
        fig: (c2, w, h) => { draw(c2, w, 30, A, 'P'); draw(c2, w, 66, B, 'Q'); },
      };
    }
    const base = Array.from({ length: 6 }, () => randInt(20, 30)), out = randInt(70, 95);
    return {
      topic: 'STATISTICS', text: `In the data set ${shuffle([...base, out]).join(', ')}, the value ${out} is removed. What happens to the standard deviation?`,
      ...textual('It decreases', ['It increases', 'It stays the same', 'It becomes 0']),
      steps: [`${out} is far from the others: it adds a lot of spread.`, 'Without it, the values sit closer to their mean, so the SD decreases.'],
    };
  };
  levels.satSpread = [2, 3, 4];

  // Margin of error and what a sample says about a population.
  kinds.satMargin = d => {
    const f = d < 2 ? pick([0, 2]) : randInt(0, 3), p = randInt(30, 70), e = randInt(2, 5), N = pick([300, 400, 500, 800, 1000, 1200]);
    const what = pick(['want a new skate park', 'listen to the radio every day', 'own a pager', 'would pay more for late bus service']);
    const lead = `A random sample of ${cm(N)} city residents found that ${p}% ${what}, with a margin of error of ${e}%.`;
    if (f === 0) {
      const right = p + randInt(1 - e, e - 1);
      return {
        topic: 'STATISTICS', text: `${lead} Which is a plausible value for the percent of ALL city residents who ${what}?`,
        ...numeric(right, [p - e - randInt(2, 6), p + e + randInt(2, 6), p + 2 * e + randInt(3, 8), p - 2 * e - randInt(3, 8)], v => v + '%'),
        steps: [`Plausible values: ${p} - ${e} to ${p} + ${e}, that is ${p - e}% to ${p + e}%.`, `Only ${right}% is in that range.`],
      };
    }
    if (f === 1) {
      return {
        topic: 'STATISTICS', text: `${lead} Which conclusion is best?`,
        ...textual(`Likely between ${p - e}% and ${p + e}%`, [`Exactly ${p}% of all residents`, `At least ${p + e}% of all residents`, `Between ${p - e}% and ${p + e}%, for sure`]),
        steps: ['The margin of error gives a range of likely values.', `${p}% plus or minus ${e}%: from ${p - e}% to ${p + e}%.`, "It's likely, not certain."],
      };
    }
    if (f === 2) {
      return {
        topic: 'STATISTICS', text: `${lead} Which change would most likely make the margin of error smaller?`,
        ...textual('A larger random sample', ['A smaller random sample', 'Asking only their friends', 'Rounding to whole percents', 'Asking the same people twice']),
        steps: ['Bigger random samples give more precise estimates.', 'So a larger random sample shrinks the margin of error.'],
      };
    }
    const right = 'Only to students at that school';
    return {
      topic: 'STATISTICS', text: `A random sample of 200 students at one high school found that ${p}% ${what}. To which group can this result be generalized?`,
      ...textual(right, ['To all teens in the state', 'To all residents of the city', 'To no one but the 200 students', 'To all students in the U.S.']),
      steps: ['A random sample speaks for the group it was drawn from.', `It was drawn from one school: ${right.toLowerCase()}.`],
    };
  };
  levels.satMargin = [2, 3, 4];

  // Observational studies and randomized experiments: what can be concluded.
  const STUDIES = [
    ['Researchers found 200 volunteers. Half, chosen at random, drank a new sports drink before a race; the rest drank water. The drink group ran faster on average.',
      'Causes faster runs, for volunteers like these', ['Causes faster runs, for all runners', 'Linked to speed, but not a cause', 'Nothing can be concluded'],
      ['Random assignment lets us say the drink caused it.', 'But the volunteers were not a random sample, so it applies to people like them.']],
    ['From a random sample of 400 students at one school, half were randomly picked to use a new study app. Their test scores rose more than the others\'.',
      'Raises scores, for students at that school', ['Raises scores, for all U.S. students', 'Linked to scores, but not a cause', 'Nothing can be concluded'],
      ['Random assignment shows cause.', 'The random sample was from one school, so it applies to that school.']],
    ['A survey of 300 teens found that those who play more video games sleep fewer hours.',
      "Linked, but games may not be the cause", ['Video games cause teens to sleep less', 'Less sleep makes teens play more games', 'There is no link at all'],
      ['This was a survey, not an experiment: nothing was assigned.', 'It shows a link, not a cause.']],
    ['A random sample of 500 city bus riders found that riders with headphones rated their commute as happier.',
      'Linked for city bus riders; cause not shown', ['Music causes happier commutes', 'Linked for all commuters in the U.S.', 'There is no link at all'],
      ['A random sample lets it speak for city bus riders.', 'Nobody was assigned headphones, so it shows a link, not a cause.']],
  ];
  kinds.satStudy = () => {
    const [txt, right, wrongs, steps] = pick(STUDIES);
    return { topic: 'STUDY DESIGN', text: `${txt} Which conclusion is best supported?`, ...textual(right, wrongs), steps };
  };
  levels.satStudy = [2, 3, 4];

  // ---- Geometry and trigonometry

  function ellipse(c, cx, cy, rx, ry, col, backDash = false) {
    c.fillStyle = col;
    const n = Math.ceil((rx + ry) * 4);
    for (let i = 0; i < n; i++) {
      const t = i / n * 2 * Math.PI;
      if (backDash && Math.sin(t) < 0 && i % 4 > 1) continue;
      c.fillRect(Math.round(cx + Math.cos(t) * rx), Math.round(cy + Math.sin(t) * ry), 1, 1);
    }
  }

  // Volumes: composite solids, working backward, scaling.
  kinds.satSolids = d => {
    const f = d < 2 ? pick([0, 2, 4]) : randInt(0, 4);
    if (f === 0) {
      const r = pick([3, 6]), h = randInt(4, 12), V = r * r * h + 2 * r ** 3 / 3;
      return {
        topic: 'VOLUME', text: `A grain silo is a cylinder with a hemisphere on top. The radius is ${r} meters and the cylinder is ${h} meters tall. What is the silo's volume, in cubic meters?`, size: [64, 84],
        ...numeric(V, [r * r * h + 4 * r ** 3 / 3, r * r * h, r * r * h + 2 * r * r / 3, r * r * (h + r)], pif),
        steps: [`Cylinder: π × ${r}^2 × ${h} = ${r * r * h}π`, `Hemisphere: half of (4/3)π × ${r}^3 = ${2 * r ** 3 / 3}π`, `Total: ${pif(V)}`],
        fig: (c, w, hh) => {
          const cx = Math.round(w / 2) - 4, rx = 20, top = 30, bot = hh - 8;
          F.arc(c, cx, top, rx, 0, Math.PI, INK); ellipse(c, cx, top, rx, 5, DIM, true); ellipse(c, cx, bot, rx, 5, INK, true);
          F.line(c, cx - rx, top, cx - rx, bot, INK); F.line(c, cx + rx, top, cx + rx, bot, INK);
          F.line(c, cx, bot, cx + rx, bot, HOT); F.label(c, String(r), cx + rx / 2, bot - 6, HOT); F.label(c, String(h), cx + rx + 7, (top + bot) / 2, HOT);
        },
      };
    }
    if (f === 1) {
      const r = randInt(2, 6), V = 4 * r ** 3 / 3;
      return {
        topic: 'VOLUME', text: `The glass globe of a gumball machine is a sphere with a volume of ${pif(V)} cubic inches. What is its radius, in inches?`,
        ...numeric(r, [2 * r, r * r, Math.round(V / 4), r + 1, 3 * r]),
        steps: [`(4/3)πr^3 = ${pif(V)}`, `r^3 = ${pif(V).replace('π', '')} × 3/4 = ${r ** 3}`, `r = ${r}`],
      };
    }
    if (f === 2) {
      const r = randInt(2, 6), h = randInt(3, 12), V = r * r * h;
      return {
        topic: 'VOLUME', text: `A cylindrical can of spray paint holds ${V}π cubic centimeters and has a radius of ${r} centimeters. How tall is it, in centimeters?`,
        ...numeric(h, [V / r, V / (2 * r), V / r / 3, h * 2, r * h]),
        steps: [`V = πr^2h, so ${V}π = π × ${r * r} × h`, `h = ${V} ÷ ${r * r} = ${h}`],
      };
    }
    if (f === 3) {
      const k = randInt(2, 4), sphere = rand() < .5;
      return {
        topic: 'VOLUME', text: sphere ? `The radius of a sphere is multiplied by ${k}. By what factor is its volume multiplied?` : `Each edge of a box (length, width and height) is multiplied by ${k}. By what factor is its volume multiplied?`,
        ...numeric(k ** 3, [k, k * k, 3 * k, k ** 4]),
        steps: ['Volume uses three lengths multiplied together.', `Each one grows ${k} times: ${k} × ${k} × ${k} = ${k ** 3}`],
      };
    }
    const r = randInt(2, 6), h = 3 * randInt(1, 4), V = r * r * h / 3;
    return {
      topic: 'VOLUME', text: `A cone-shaped paper snow-cone cup has a radius of ${r} cm and a height of ${h} cm. What is its volume, in cubic centimeters?`, size: [64, 72],
      ...numeric(V, [r * r * h, r * h, 2 * r * r * h / 3, r * h * h / 3], pif),
      steps: ['V = (1/3)πr^2h', `(1/3) × π × ${r}^2 × ${h} = ${pif(V)}`],
      fig: (c, w, hh) => {
        const cx = Math.round(w / 2) - 4, rx = 22, top = 8, apex = hh - 6;
        ellipse(c, cx, top + 4, rx, 5, INK); F.line(c, cx - rx, top + 4, cx, apex, INK); F.line(c, cx + rx, top + 4, cx, apex, INK);
        F.line(c, cx, top + 4, cx, apex, DIM, 2); F.line(c, cx, top + 4, cx + rx, top + 4, HOT);
        F.label(c, String(r), cx + rx / 2, top + 11, HOT); F.label(c, String(h), cx - 5, (top + apex) / 2 + 4, HOT);
      },
    };
  };
  levels.satSolids = [1, 2, 3, 4];

  // Special right triangles: equilateral heights, square diagonals, ramps.
  kinds.satSpecialTri = d => {
    const f = d < 2 ? pick([0, 2, 3]) : randInt(0, 4), s = 2 * randInt(2, 9);
    if (f === 0) {
      return {
        topic: 'RIGHT TRIANGLE', text: `In the figure, triangle ABC is equilateral with sides of length ${s}, and BD is an altitude. What is BD?`, size: [76, 64],
        ...textual(`${s / 2}√3`, [`${s}√3`, `${s / 2}√2`, String(s / 2), `${s}√2`, String(s)]),
        steps: ['The altitude splits it into two 30-60-90 triangles.', `Short leg AD = ${s / 2}; hypotenuse AB = ${s}.`, `Long leg BD = ${s / 2}√3`],
        fig: (c, w, h) => {
          const A = [8, h - 8], C = [w - 8, h - 8], B = [Math.round(w / 2), Math.round(h - 8 - (w - 16) * Math.sqrt(3) / 2)], D = [B[0], h - 8];
          F.outlinePoly(c, [A, B, C], INK); F.line(c, ...B, ...D, HOT, 2); F.rightMark(c, D[0], D[1], 1, -1);
          F.label(c, 'A', A[0] - 4, A[1] + 4, DIM); F.label(c, 'C', C[0] + 4, C[1] + 4, DIM); F.label(c, 'B', B[0] + 7, B[1] + 2, DIM); F.label(c, 'D', D[0], D[1] + 6, DIM);
          F.label(c, String(s), (A[0] + B[0]) / 2 - 7, (A[1] + B[1]) / 2 - 2);
        },
      };
    }
    if (f === 1) {
      const a = s * s / 4;
      return {
        topic: 'RIGHT TRIANGLE', text: `What is the area of an equilateral triangle with sides of length ${s}?`,
        ...textual(`${a}√3`, [`${s * s / 2}√3`, `${s * s}√3`, String(a), `${a}√2`, String(s * s / 2)]),
        steps: [`Height = ${s / 2}√3 (a 30-60-90 triangle).`, `Area = (1/2) × ${s} × ${s / 2}√3`, `= ${a}√3`],
      };
    }
    if (f === 2) {
      const area = rand() < .5;
      return {
        topic: 'RIGHT TRIANGLE', text: `A square sticker has a diagonal of ${s} centimeters. What is its ${area ? 'area, in square centimeters' : 'side length, in centimeters'}?`,
        ...(area ? numeric(s * s / 2, [s * s, s * s / 4, 2 * s, s * s / 2 + s]) : textual(`${s / 2}√2`, [`${s}√2`, String(s / 2), `${s / 2}√3`, `${s}`])),
        steps: ['A diagonal cuts a square into two 45-45-90 triangles.', `Side = diagonal ÷ √2 = ${s / 2}√2`, area ? `Area = (${s / 2}√2)^2 = ${s * s / 2}` : `So the side is ${s / 2}√2.`],
      };
    }
    if (f === 3) {
      const ang = pick([30, 45, 60]), L = s, ans = ang === 30 ? String(L / 2) : ang === 45 ? `${L / 2}√2` : `${L / 2}√3`;
      return {
        topic: 'RIGHT TRIANGLE', text: `${An(L)}-foot board makes a skate ramp that rises at a ${ang}° angle to the ground. How high is the top of the ramp, in feet?`,
        ...textual(ans, [String(L / 2), `${L / 2}√2`, `${L / 2}√3`, `${L}√3`, String(L)].filter(v => v !== ans)),
        steps: [`The board is the hypotenuse, ${L}.`, ang === 30 ? `Across from 30° is half the hypotenuse: ${L / 2}.` : ang === 45 ? `In a 45-45-90 triangle, leg = hypotenuse ÷ √2 = ${L / 2}√2.` : `Across from 60° is (hypotenuse ÷ 2) × √3 = ${L / 2}√3.`],
      };
    }
    const leg = randInt(2, 9), right = `${leg}√2`;
    return {
      topic: 'RIGHT TRIANGLE', text: `An isosceles right triangle has legs of length ${leg}. What is the length of its hypotenuse?`,
      ...textual(right, [String(2 * leg), `${leg}√3`, `${2 * leg}√2`, String(leg * leg)]),
      steps: ['Legs a and a: hypotenuse^2 = a^2 + a^2 = 2a^2.', `Hypotenuse = ${leg}√2`],
    };
  };
  levels.satSpecialTri = [1, 2, 3, 4];

  // The complement identity: sin x = cos(90 - x).
  kinds.satComplement = d => {
    const f = d < 2 ? pick([1, 2]) : randInt(0, 2);
    if (f === 0) {
      let k, a, c, A, tries = 0; do { k = randInt(5, 20); a = randInt(1, 4); c = randInt(1, 4); A = randInt(15, 75); } while ((A - a * k === 0 || 90 - A - c * k === 0 || a === c) && ++tries < 40);
      const b = A - a * k, e = 90 - A - c * k;
      return {
        topic: 'TRIGONOMETRY', text: `If sin(${lin(a, b, 'k')})° = cos(${lin(c, e, 'k')})°, where both angles are acute, what is the value of k?`,
        ...numeric(k, [(180 - b - e) / (a + c), (e - b) / (a - c), (90 + b + e) / (a + c), k + 5, 90 - k]),
        steps: ['sin of an angle = cos of its complement: the angles add to 90.', `${lin(a, b, 'k')} + ${lin(c, e, 'k')} = 90`, `${lin(a + c, b + e, 'k')} = 90, so k = ${k}`],
      };
    }
    if (f === 1) {
      const [p, q, r] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]), fn = pick(['sin', 'cos']), other = fn === 'sin' ? 'cos' : 'sin', v = fr(p, r);
      return {
        topic: 'TRIGONOMETRY', text: `For an acute angle a, ${fn}(a) = ${v}. What is the value of ${other}(90° - a)?`,
        ...textual(v, [fr(q, r), fr(r, p), fr(p, q), fr(r - p, r)].filter(s => s !== v)),
        steps: [`${other}(90° - a) = ${fn}(a): complements swap sine and cosine.`, `So it is ${v}.`],
      };
    }
    const x = randInt(10, 40), e = 90 - 2 * x;
    return {
      topic: 'TRIGONOMETRY', text: `In a right triangle, one acute angle measures x° and the other measures (x ${signed(e)})°. If sin(x°) = cos(y°), what is y?`,
      ...numeric(x + e, [x, 90 - x - e, 2 * x, 180 - x]),
      steps: [`The acute angles add to 90: x + x ${signed(e)} = 90, so x = ${x}.`, `sin x° = cos(90 - x)° = cos ${90 - x}°`, `y = ${90 - x}`],
    };
  };
  levels.satComplement = [2, 3, 4];

  // Degrees and radians.
  kinds.satRadians = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 2);
    if (f === 0) {
      const deg = pick([30, 45, 60, 90, 120, 135, 150, 210, 225, 240, 270, 300, 315, 330, 36, 72, 20]), v = deg / 180;
      return {
        topic: 'RADIANS', text: `What is ${deg}° in radians?`,
        ...numeric(v, [180 / deg, deg / 90, deg / 360, deg / 60], pif),
        steps: ['Multiply degrees by π/180.', `${deg} × π/180 = ${pif(v)}`],
      };
    }
    if (f === 1) {
      const [n, q] = pick([[1, 6], [1, 4], [1, 3], [2, 3], [3, 4], [5, 6], [5, 4], [7, 6], [5, 3], [3, 2], [7, 4], [11, 6], [1, 5], [2, 5]]), deg = 180 * n / q;
      return {
        topic: 'RADIANS', text: `What is ${pif(n / q)} radians in degrees?`,
        ...numeric(deg, [deg / 2, deg * 2, 360 - deg, 180 * q / n, deg + 90].filter(Number.isInteger), v => v + '°'),
        steps: ['Multiply radians by 180/π.', `${pif(n / q)} × 180/π = ${deg}°`],
      };
    }
    const r = randInt(2, 9), t = pick([1.5, 2, 2.5, 3, .5]), s = r * t;
    return {
      topic: 'RADIANS', text: `A bike wheel with a radius of ${r} inches turns through ${t} radians. How far does a point on the rim travel, in inches?`,
      ...numeric(s, [r * t * 2, r / t, 2 * r, r + t, r * t * Math.PI].map(r2), v => String(v)),
      steps: ['Arc length = radius × angle in radians.', `${r} × ${t} = ${s} inches`],
    };
  };
  levels.satRadians = [2, 3, 4];

  // Arc length and sector area, in radians and degrees.
  const RADS = [[1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6], [1, 1], [4, 3], [3, 2]];
  kinds.satArcSector = d => {
    const f = d < 2 ? pick([0, 2]) : randInt(0, 2);
    if (f === 2) {
      const n = pick([3, 4, 5, 6, 8, 9, 10, 12]), C = randInt(2, 12) * n;
      return {
        topic: 'CIRCLES', text: `On a circle with circumference ${C}π, a minor arc has length ${C / n}π. What is the measure of its central angle, in degrees?`,
        ...numeric(360 / n, [180 / n, C / n, 360 - 360 / n, 360 * n / C].filter(v => v > 0), v => cm(r2(v)) + '°'),
        steps: [`The arc is ${C / n}π / ${C}π = 1/${n} of the circle.`, `1/${n} of 360° = ${r2(360 / n)}°`],
      };
    }
    const [n, q] = pick(RADS), th = n / q, r = randInt(2, 12), area = f === 0 && rand() < .5;
    if (f === 1) {
      const L = r * th;
      return {
        topic: 'CIRCLES', text: `On a circle of radius ${r}, an arc has length ${pif(L)}. What is the measure of its central angle, in radians?`,
        ...numeric(th, [r / L, L, th * 2, th / 2, L * r], pif),
        steps: ['Arc length = radius × angle (in radians).', `${pif(L)} = ${r} × θ`, `θ = ${pif(th)}`],
      };
    }
    const ans = area ? r * r * th / 2 : r * th;
    return {
      topic: 'CIRCLES', text: `The circle has radius ${r}, and the shaded sector's central angle is ${pif(th)} radians. What is the ${area ? 'area of the sector' : 'length of its arc'}?`, size: [80, 72],
      ...numeric(ans, area ? [r * th, r * r * th, r * r * th / 4, 2 * r * th] : [r * r * th / 2, 2 * r * th, th / r, r * th / 2], pif),
      steps: area ? ['Sector area = (1/2) r^2 θ', `(1/2) × ${r * r} × ${pif(th)} = ${pif(ans)}`] : ['Arc length = r θ', `${r} × ${pif(th)} = ${pif(ans)}`],
      fig: (c, w, h) => {
        const R = Math.min(w, h) / 2 - 5, cx = Math.round(w / 2), cy = Math.round(h / 2), a1 = th * Math.PI;
        c.fillStyle = '#2a3a78';
        for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
          if (x * x + y * y > R * R) continue;
          let a = Math.atan2(-y, x); if (a < 0) a += 2 * Math.PI;
          if (a <= a1 + 1e-9) c.fillRect(cx + x, cy + y, 1, 1);
        }
        F.circle(c, cx, cy, R, INK); F.arc(c, cx, cy, R, 0, a1, HOT);
        F.line(c, cx, cy, cx + R, cy, HOT); F.line(c, cx, cy, cx + Math.cos(a1) * R, cy - Math.sin(a1) * R, HOT);
        const m = a1 / 2;
        F.label(c, pif(th), cx + Math.cos(m) * R * .5, cy - Math.sin(m) * R * .5);
        F.label(c, String(r), cx + R / 2, cy + 6);
      },
    };
  };
  levels.satArcSector = [2, 3, 4];

  // The circle equation, completing the square.
  kinds.satCircleSquare = d => {
    let h, k; do { h = nz(-7, 7); k = nz(-7, 7); } while (h === k || h === -k);
    const r = randInt(2, 9), D = -2 * h, E = -2 * k, R0 = r * r - h * h - k * k, two = d >= 4 && rand() < .4, m = two ? 2 : 1;
    const ask = pick(d < 2 ? ['radius', 'center'] : ['radius', 'center', 'diameter', 'area']);
    const eq = `${m === 1 ? '' : m}x^2 ${signed(m * D)}x + ${m === 1 ? '' : m}y^2 ${signed(m * E)}y = ${m * R0}`;
    const steps = [two ? 'Divide everything by 2 first.' : `Complete the square: add ${h * h} and ${k * k} to both sides.`, `(x ${signed(-h)})^2 + (y ${signed(-k)})^2 = ${R0} + ${h * h} + ${k * k} = ${r * r}`,
      ask === 'center' ? `Center: ${pt(h, k)}` : `r = ${r}` + (ask === 'diameter' ? `, so the diameter is ${2 * r}` : ask === 'area' ? `, so the area is ${r * r}π` : '')];
    const lead = `A circle in the xy-plane has equation ${eq}.`;
    if (ask === 'center') return { topic: 'CIRCLES', text: `${lead} What are the coordinates of its center?`, ...textual(pt(h, k), [pt(-h, -k), pt(D, E), pt(-D, -E), pt(k, h)]), steps };
    if (ask === 'area') return { topic: 'CIRCLES', text: `${lead} What is the area of the circle?`, ...numeric(r * r, [Math.abs(R0) || r, 2 * r, r * r * 4, R0 + h * h], pif), steps };
    const ans = ask === 'diameter' ? 2 * r : r;
    return { topic: 'CIRCLES', text: `${lead} What is the ${ask} of the circle?`, ...numeric(ans, [r * r, Math.abs(m * R0), ask === 'diameter' ? r : 2 * r, Math.round(Math.sqrt(Math.abs(R0))) + 1]), steps };
  };
  levels.satCircleSquare = [2, 3, 4];

  // Angle relationships: vertical angles, linear pairs, exterior angles, polygons.
  kinds.satAngles = d => {
    const f = d < 2 ? pick([0, 1, 3]) : randInt(0, 3);
    if (f === 0) {
      const vert = rand() < .5, x = randInt(5, 25);
      let a, c, V, tries = 0; do { a = randInt(1, 6); c = randInt(1, 6); V = randInt(35, 145); } while ((a === c || V - a * x === 0 || (vert ? V : 180 - V) - c * x === 0) && ++tries < 40);
      const b = V - a * x, e = (vert ? V : 180 - V) - c * x, L1 = `(${lin(a, b)})°`, L2 = `(${lin(c, e)})°`;
      return {
        topic: 'ANGLES', text: `In the figure, two lines intersect. What is the value of x?`, size: [130, 64],
        ...numeric(x, vert ? [(180 - b - e) / (a + c), (e + b) / (a - c), (b - e) / (a + c), x + 10] : [(e - b) / (a - c), (180 + b + e) / (a + c), (90 - b - e) / (a + c), x + 10]),
        steps: vert ? ['Vertical angles are equal.', `${lin(a, b)} = ${lin(c, e)}`, `x = ${x}`] : ['The two angles make a straight line: they add to 180.', `${lin(a + c, b + e)} = 180`, `x = ${x}`],
        fig: (cc, w, h) => {
          const cx = Math.round(w / 2), cy = Math.round(h / 2), t = V * DEG, L = 70;
          F.line(cc, cx - L, cy, cx + L, cy, INK);
          F.line(cc, cx - Math.cos(t) * 40, cy + Math.sin(t) * 40, cx + Math.cos(t) * 40, cy - Math.sin(t) * 40, INK);
          const at = (ang, s, col) => F.label(cc, s, clamp(cx + Math.cos(ang) * 42, 27, w - 27), cy - Math.sin(ang) * 22 + (Math.sin(ang) > 0 ? -1 : 3), col);
          at(t / 2, L1, HOT);
          at(vert ? Math.PI + t / 2 : (t + Math.PI) / 2, L2, HOT);
        },
      };
    }
    if (f === 1) {
      const A = randInt(35, 75), C = randInt(35, 75), B = 180 - A - C, X = A + C;
      return {
        topic: 'ANGLES', text: 'In the figure, the bottom side of the triangle is extended. What is the value of x?', size: [130, 64],
        ...numeric(X, [B, 180 - A, 180 - C, 360 - X, Math.abs(A - C)]),
        steps: ['An exterior angle equals the sum of the two far interior angles.', `x = ${A} + ${C} = ${X}`],
        fig: (c, w, h) => {
          const ta = Math.tan(A * DEG), tb = Math.tan(B * DEG), base = 78, px0 = 8, y0 = h - 8;
          const cxp = base * tb / (ta + tb), hgt = cxp * ta, sc = Math.min(1, (h - 16) / hgt);
          const P = [px0, y0], Q = [px0 + base * sc, y0], R = [px0 + cxp * sc, y0 - hgt * sc];
          F.outlinePoly(c, [P, Q, R], INK); F.line(c, ...Q, w - 4, y0, INK);
          F.label(c, A + '°', P[0] + 15, P[1] - 5); F.label(c, C + '°', R[0], R[1] + 12);
          F.label(c, 'x°', Q[0] + 12, Q[1] - 6, HOT);
        },
      };
    }
    if (f === 2) {
      const [n, name] = pick([[5, 'pentagon'], [6, 'hexagon'], [8, 'octagon'], [9, 'nonagon'], [10, 'decagon'], [12, 'dodecagon']]), each = 180 * (n - 2) / n;
      const sumQ = rand() < .4;
      return {
        topic: 'ANGLES', text: sumQ ? `What is the sum of the interior angles of ${an(name)}?` : `${n === 8 ? 'A stop sign is a regular octagon.' : `Picture a regular ${name}.`} What is the measure of each interior angle?`,
        ...(sumQ ? numeric(180 * (n - 2), [180 * n, 360, 180 * (n - 1), 90 * n], v => cm(v) + '°') : numeric(each, [360 / n, 180 - each / 2, 180 * (n - 2), 180 / n * 2 + 90].map(r2), v => cm(r2(v)) + '°')),
        steps: [`${An(n)}-sided polygon splits into ${n - 2} triangles: ${n - 2} × 180 = ${cm(180 * (n - 2))}°.`, sumQ ? `Sum: ${cm(180 * (n - 2))}°` : `Each of ${n} equal angles: ${cm(180 * (n - 2))} ÷ ${n} = ${r2(each)}°`],
      };
    }
    const v = 2 * randInt(10, 70), base = (180 - v) / 2, askBase = rand() < .5;
    return {
      topic: 'ANGLES', text: askBase ? `An isosceles triangle has a vertex angle of ${v}°. What is the measure of each base angle?` : `Each base angle of an isosceles triangle measures ${base}°. What is the vertex angle?`,
      ...(askBase ? numeric(base, [180 - v, v / 2, 90 - v, v], v2 => v2 + '°') : numeric(v, [180 - base, 90 - base, base / 2, 2 * base], v2 => v2 + '°')),
      steps: ['The two base angles are equal, and all three add to 180.', askBase ? `(180 - ${v}) ÷ 2 = ${base}` : `180 - 2(${base}) = ${v}`],
    };
  };
  levels.satAngles = [1, 2, 3, 4];

  // Similar figures: lengths scale by k, areas by k^2, volumes by k^3.
  kinds.satSimilarScale = d => {
    const [p, q] = pick([[1, 2], [1, 3], [2, 3], [2, 5], [3, 4], [3, 5], [1, 4]]), vol = d >= 3 && rand() < .4, e = vol ? 3 : 2;
    const small = randInt(1, 6) * p ** e, big = small * (q / p) ** e;
    return {
      topic: 'SIMILARITY', text: vol ? `Two similar cereal boxes have heights in the ratio ${p} : ${q}. The smaller box holds ${cm(small)} cubic inches. How much does the larger box hold?` : `Two similar triangles have sides in the ratio ${p} : ${q}. The smaller triangle has an area of ${cm(small)} square inches. What is the area of the larger one?`,
      ...numeric(big, [small * q / p, small * (q / p) ** (vol ? 2 : 3), small + (q - p), small * q], v => cm(r2(v))),
      steps: [`Lengths scale by ${q}/${p}; ${vol ? 'volumes' : 'areas'} scale by (${q}/${p})^${e} = ${fr(q ** e, p ** e)}.`, `${cm(small)} × ${fr(q ** e, p ** e)} = ${cm(r2(big))}`],
    };
  };
  levels.satSimilarScale = [2, 3, 4];

  // Two-variable data: which model fits a scatterplot, residuals, predictions from a model.
  kinds.satDataModels = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 2);
    if (f === 0) {
      const t = randInt(0, 3), names = ['Linear, increasing', 'Linear, decreasing', 'Exponential growth', 'Exponential decay'];
      const fn = [x => 1 + .8 * x, x => 9 - .8 * x, x => .35 * 1.45 ** x, x => 9.5 * .7 ** x][t];
      const pts = Array.from({ length: 12 }, (_, i) => { const x = .4 + i * .8 + rand() * .3; return [x, fn(x) + (rand() - .5) * (t < 2 ? 1 : .5)]; });
      return {
        topic: 'DATA', text: 'Which type of function best models the data in the scatterplot?', size: [96, 70],
        ...textual(names[t], names),
        steps: [t < 2 ? 'The points fall close to a straight line.' : 'The points curve: they change by a growing or shrinking amount.', `So: ${names[t].toLowerCase()}.`],
        fig: (c, w, h) => { const P = F.grid(c, w, h, [0, 10], [0, 10], 2, 2); for (const p of pts) F.dot(c, P(...p), BLU); },
      };
    }
    if (f === 1) {
      const m = pick([1.5, 2, 2.5, 3, 4]), b = randInt(5, 20), x = 2 * randInt(2, 9), pred = m * x + b, res = nz(-6, 6), act = pred + res;
      const [xw, yw] = pick([['hours of practice', 'free throws made'], ['weeks of training', 'push-ups done'], ['days after planting', 'plant height (cm)']]);
      return {
        topic: 'DATA', text: `A line of best fit for ${yw} (y) versus ${xw} (x) is y = ${m}x + ${b}. One data point is (${x}, ${act}). What is the residual for that point?`,
        ...numeric(res, [-res, pred, act, Math.abs(res) + 1]),
        steps: ['Residual = actual y - predicted y', `Predicted: ${m}(${x}) + ${b} = ${pred}`, `${act} - ${pred} = ${res}`],
      };
    }
    const b = pick([1.5, 2, 3]), a = b === 1.5 ? 8 : pick([2, 3, 4, 5, 10]), x = randInt(2, 3), ans = r2(a * b ** x);
    return {
      topic: 'DATA', text: `The model y = ${a}(${b})^x estimates the number of food trucks (y) at a weekend market x years after it opened. What does the model predict ${x} years after it opened?`,
      ...numeric(ans, [r2(a * b * x), r2((a * b) ** x), r2(a + b * x), r2(a * b ** (x - 1))].filter(v => v !== ans), v => String(v)),
      steps: [`Put in x = ${x}: ${a}(${b})^${x}`, `${b}^${x} = ${r2(b ** x)}`, `${a} × ${r2(b ** x)} = ${ans}`],
    };
  };
  levels.satDataModels = [1, 2, 3, 4];

  Questions.extend('sat', kinds, levels);
})();
