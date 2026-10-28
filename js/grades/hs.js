'use strict';
// High school (Algebra I, Geometry, Algebra II): the Common Core HSN, HSA, HSF, HSG and HSS standards.
(() => {
  const { numeric, textual, show, lin, term, signed, nz, solveStep } = Questions.kit, F = Figures, { INK, DIM, HOT, RED, GRN, BLU } = F.C;
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  const cm = v => { const [i, f] = String(v).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : ''); };
  const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
  // n/d in lowest terms, sign in front: "3/4", "-5/2", "6".
  const fr = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? String(n) : `${n}/${d}`; };
  // A polynomial from its coefficients, highest power first: [2, -3, 1] gives "2x^2 - 3x + 1".
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
  // c√r, written the usual way: "√5", "3√2", "7".
  const rad = (c, r) => r === 1 ? String(c) : (c === 1 ? '' : c) + '√' + r;
  function root(n) { let k = 1; for (let f = 2; f * f <= n; f++) while (n % (f * f) === 0) { n /= f * f; k *= f; } return [k, n]; }
  const rt = n => rad(...root(n));
  const cx = (a, b) => {
    const im = (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'i';
    if (!b) return String(a);
    if (!a) return (b < 0 ? '-' : '') + im;
    return `${a} ${b < 0 ? '-' : '+'} ${im}`;
  };
  const pt = (a, b) => `(${a}, ${b})`;
  const money = v => '$' + (Number.isInteger(v) ? cm(v) : cm(v.toFixed(2)));
  const NAMES = ['Ana', 'Jamal', 'Mei', 'Leo', 'Priya', 'Sam', 'Diego', 'Zoe', 'Kai', 'Rosa', 'Dev', 'Tasha', 'Omar', 'Nia'];
  const who = () => pick(NAMES);
  const an = s => { const t = String(s); return (/^8/.test(t) || t === '11' || t === '18' || /^[aeiou]/i.test(t) ? 'an ' : 'a ') + t; }, An = s => an(s).replace(/^a/, 'A');
  const kinds = {};

  // ---- Number and quantity

  // N.RN.1, N.RN.2: rational exponents and radicals.
  const RAT = [[2, [2, 3, 4, 5, 6, 7, 8, 9, 10], [3]], [3, [2, 3, 4, 5], [2, 4]], [4, [2, 3], [3]], [5, [2], [2, 3]]];
  const nroot = (n, x) => (n === 2 ? '' : '^' + n) + '√' + x;
  kinds.ratExp = d => {
    const f = d < 2 ? 0 : d < 3 ? randInt(0, 2) : randInt(0, 3);
    const X = e => `x^{${e}}`;
    if (f === 0) {
      const [n, rs, ms] = pick(d < 2 ? RAT.slice(0, 2) : RAT), r = pick(rs), m = pick(ms), B = r ** n, ans = r ** m;
      if (d >= 3 && rand() < .35) {
        const right = '1/' + cm(ans);
        return {
          topic: 'EXPONENTS', text: `What is the value of ${cm(B)}^{-${m}/${n}}?`,
          ...textual(right, ['-' + cm(ans), cm(ans), '-1/' + cm(ans), '1/' + cm(r), '-' + cm(r)]),
          steps: ['A negative exponent means 1 over the positive power.', `${nroot(n, B)} = ${r}, and ${r}^${m} = ${cm(ans)}`, `So the value is 1/${cm(ans)}.`],
        };
      }
      return {
        topic: 'EXPONENTS', text: `What is the value of ${cm(B)}^{${m}/${n}}?`,
        ...numeric(ans, [B * m / n, r, m * r, r ** (m + 1), B * m], cm),
        steps: [`The bottom (${n}) is the root; the top (${m}) is the power.`, `${nroot(n, B)} = ${r}`, `${r}^${m} = ${cm(ans)}`],
      };
    }
    const n = pick([2, 3, 4, 5]), m = pick([2, 3, 4, 5, 7].filter(v => v !== n && gcd(v, n) === 1));
    const R = (a, b) => nroot(a, '(x^' + b + ')');
    if (f === 1) {
      return {
        topic: 'EXPONENTS', text: `For x > 0, which is equivalent to ${X(m + '/' + n)}?`,
        ...textual(R(n, m), [R(m, n), `${n}x^${m}`, X(m * n), nroot(n, 'x') + ` + ${m}`]),
        steps: ['x^{m/n} is the nth root of x^m.', `The denominator ${n} is the root; the numerator ${m} is the power.`, `So it is ${R(n, m)}.`],
      };
    }
    if (f === 2) {
      return {
        topic: 'EXPONENTS', text: `For x > 0, which is equivalent to ${R(n, m)}?`,
        ...textual(X(fr(m, n)), [X(fr(n, m)), X(m * n), X(m + n), X(fr(1, m * n)), X(m - n)]),
        steps: ['The nth root of x^m is x^{m/n}.', `Root ${n} goes on the bottom, power ${m} on top.`, `So it is ${X(fr(m, n))}.`],
      };
    }
    // Rules for rational exponents: add when multiplying, multiply for a power of a power.
    const [p, q] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 6], [2, 5]]), [u, v] = pick([[1, 2], [1, 3], [1, 6], [1, 4], [2, 3]]);
    if (rand() < .5) {
      const sum = fr(p * v + u * q, q * v);
      return {
        topic: 'EXPONENTS', text: `For x > 0, which is equivalent to ${X(p + '/' + q)} · ${X(u + '/' + v)}?`,
        ...textual(X(sum), [X(fr(p * u, q * v)), X(fr(p + u, q + v)), X(fr(p * v, q * u)), `x^2`].filter(s => s !== X(sum))),
        steps: ['Same base, multiplying: add the exponents.', `${p}/${q} + ${u}/${v} = ${sum}`, `So it is ${X(sum)}.`],
      };
    }
    const k = pick([2, 3, 4, 6].filter(t => t !== q)), pw = fr(p * k, q);
    return {
      topic: 'EXPONENTS', text: `For x > 0, which is equivalent to (${X(p + '/' + q)})^${k}?`,
      ...textual(pw === '1' ? 'x' : X(pw), [X(fr(p + k * q, q)), X(fr(p, q * k)), X(fr(p * k, q * k)), X(k)].filter(s => s !== X(pw))),
      steps: ['A power of a power: multiply the exponents.', `${p}/${q} × ${k} = ${pw}`, `So it is ${pw === '1' ? 'x' : X(pw)}.`],
    };
  };

  // N.RN.2, N.RN.3: simplifying radicals.
  kinds.radicals = d => {
    const s = pick([2, 3, 5, 6, 7, 10, 11]);
    const opts = (c, r, cands) => cands.filter(([a, b]) => a * a * b !== c * c * r).map(([a, b]) => rad(a, b));
    const f = d < 3 ? 0 : randInt(0, 2);
    if (f === 1) {
      const a = randInt(2, 6); let b; do b = randInt(2, 6); while (b === a);
      const k = a + b;
      return {
        topic: 'RADICALS', text: `Which is equivalent to √${a * a * s} + √${b * b * s}?`,
        ...textual(rad(k, s), opts(k, s, [[1, (a * a + b * b) * s], [a * b, s], [k, 2 * s], [k + 1, s], [2 * k, s]])),
        steps: [`√${a * a * s} = √${a * a} · √${s} = ${a}√${s}`, `√${b * b * s} = ${b}√${s}`, `Like terms: ${a}√${s} + ${b}√${s} = ${k}√${s}`],
      };
    }
    if (f === 2) {
      let k, a, b, tries = 0;
      const sq = n => Number.isInteger(Math.sqrt(n));
      do { k = pick([2, 3, 5, 6, 7]); a = k * s; b = k; } while ((sq(a) || sq(b)) && ++tries < 20);
      return {
        topic: 'RADICALS', text: `Which is equivalent to √${a} · √${b}?`,
        ...textual(rt(a * b), opts(k, s, [[1, a + b], [k * k, s], [s, k], [k + 1, s], [2, a * b]])),
        steps: ['Multiply under one root: √a · √b = √(ab)', `√${a} · √${b} = √${a * b}`, `${a * b} = ${k * k} × ${s}, so √${a * b} = ${rt(a * b)}`],
      };
    }
    const k = randInt(2, d < 2 ? 5 : 9), N = k * k * s;
    return {
      topic: 'RADICALS', text: `Which is equivalent to √${N}?`,
      ...textual(rad(k, s), opts(k, s, [[k * k, s], [s, k], [k + 1, s], [k - 1, s], [2 * k, s], [k, s + 1]])),
      steps: [`Find the biggest perfect square in ${N}: ${N} = ${k * k} × ${s}`, `√${N} = √${k * k} · √${s}`, `= ${k}√${s}`],
    };
  };

  // N.CN.1, N.CN.2: complex numbers.
  kinds.complex = d => {
    const f = pick(d < 2 ? ['add', 'pow', 'sqrt'] : ['add', 'mul', 'mul', 'pow', 'sqrt']);
    if (f === 'pow') {
      const n = randInt(5, 60), names = ['1', 'i', '-1', '-i'], right = names[n % 4];
      return {
        topic: 'COMPLEX NUMS', text: `If i = √-1, what is the value of i^{${n}}?`, ...textual(right, names),
        steps: ['The powers of i repeat every 4: i, -1, -i, 1.', `${n} ÷ 4 leaves a remainder of ${n % 4}.`, `So i^{${n}} = i^${n % 4} = ${right}`],
      };
    }
    if (f === 'sqrt') {
      if (d >= 2 && rand() < .5) {
        const a = randInt(2, 9), b = randInt(2, 9), p = a * b;
        return {
          topic: 'COMPLEX NUMS', text: `If i = √-1, which is equal to √-${a * a} · √-${b * b}?`,
          ...textual(String(-p), [String(p), p + 'i', -p + 'i', String(a + b)]),
          steps: [`√-${a * a} = ${a}i and √-${b * b} = ${b}i`, `${a}i · ${b}i = ${p}i^2`, `i^2 = -1, so the product is ${-p}.`],
        };
      }
      const k = randInt(2, 12), m = nz(-9, 9);
      return {
        topic: 'COMPLEX NUMS', text: `If i = √-1, which is equal to ${m} + √-${k * k}?`,
        ...textual(cx(m, k), [String(m - k), String(m + k), cx(m, -k), cx(m, k * k), cx(-m, k)]),
        steps: ['√-1 is i, so √-n = i√n.', `√-${k * k} = ${k}i`, `${m} + √-${k * k} = ${cx(m, k)}`],
      };
    }
    const a = nz(-9, 9), b = nz(-9, 9);
    let c = nz(-9, 9), e = nz(-9, 9);
    if (f === 'add') {
      const sub = rand() < .6;
      if (c === (sub ? a : -a)) c = c > 0 ? c - 10 : c + 10;
      if (e === (sub ? b : -b)) e = e > 0 ? e - 10 : e + 10;
      const re = sub ? a - c : a + c, im = sub ? b - e : b + e;
      return {
        topic: 'COMPLEX NUMS', text: `Which is equal to (${cx(a, b)}) ${sub ? '-' : '+'} (${cx(c, e)})?`,
        ...textual(cx(re, im), sub ? [cx(a - c, b + e), cx(a + c, b - e), cx(a + c, b + e), cx(re, -im), String(re + im)] : [cx(a - c, b - e), cx(re, -im), String(re + im), cx(-re, im), re + im + 'i']),
        steps: ['Real parts go together, and i parts go together.', `Real: ${a} ${sub ? '-' : '+'} (${c}) = ${re}`, `i part: ${b} ${sub ? '-' : '+'} (${e}) = ${im}`, `So the answer is ${cx(re, im)}.`],
      };
    }
    let p = a, q = b, r = c, s = e;
    if (p * s + q * r === 0) s = s + 1 || 2;
    const re = p * r - q * s, im = p * s + q * r;
    return {
      topic: 'COMPLEX NUMS', text: `If i = √-1, which is equal to (${cx(p, q)})(${cx(r, s)})?`,
      ...textual(cx(re, im), [cx(p * r + q * s, im), cx(p * r, q * s), cx(re, -im), cx(re, p * s - q * r), String(re + im)]),
      steps: [`FOIL: ${p * r} ${signed(p * s)}i ${signed(q * r)}i ${signed(q * s)}i^2`, `i^2 = -1, so ${q * s}i^2 = ${-q * s}.`, `= ${cx(re, im)}`],
    };
  };

  // ---- Algebra: seeing structure, polynomial arithmetic

  // A.SSE.2: greatest common factor.
  kinds.factorGCF = d => {
    const g = randInt(2, d < 3 ? 6 : 9), three = d >= 2;
    let cs, tries = 0;
    do cs = three ? [randInt(1, 5), nz(-7, 7), nz(-9, 9)] : [randInt(1, 6), nz(-9, 9)]; while (cs.reduce((a, b) => gcd(a, b)) !== 1 && ++tries < 30);
    if (tries >= 30) cs = three ? [1, 2, 3] : [1, 2];
    const expr = px([...cs.map(c => c * g), 0]), right = `${g}x(${px(cs)})`, last = cs.length - 1;
    return {
      topic: 'FACTORING', text: `Which is the complete factorization of ${expr}?`,
      ...textual(right, [`${g}x(${px(cs.map((c, i) => i === last ? c * g : c))})`, `${g}x^2(${px(cs)})`, `${g}x(${px(cs.map((c, i) => i === 1 ? -c : c))})`, `${g}(${px(cs)})`]),
      steps: [`Every term has a factor of ${g}x.`, `Divide each term by ${g}x: ${px(cs)}`, `So ${expr} = ${right}`],
    };
  };

  // A.SSE.2, A.SSE.3a: factoring trinomials.
  kinds.factorTri = d => {
    const a = d >= 3 && rand() < .6 ? pick([2, 3, 5]) : 1;
    let p, q, tries = 0;
    do { p = d < 2 ? randInt(1, 9) : nz(-9, 9); q = d < 2 ? randInt(1, 9) : nz(-9, 9); } while ((p === q || p === -q || gcd(a, p) !== 1) && ++tries < 50);
    if (tries >= 50) { p = 1; q = 2; }
    const expr = px([a, a * q + p, p * q]), A = lin(a, p), Bq = lin(1, q), right = `(${A})(${Bq})`;
    const steps = a === 1
      ? [`Find two numbers that multiply to ${p * q} and add to ${p + q}.`, `They are ${p} and ${q}.`, `So ${expr} = ${right}`]
      : [`Try (${a}x + ?)(x + ?): the outer and inner terms must add to ${px([a * q + p, 0])}.`, `${a}x · ${q} and ${p} · x give ${px([a * q, 0])} ${signed(p)}x = ${px([a * q + p, 0])}`, `So ${expr} = ${right}`];
    if (rand() < .4) {
      const f = rand() < .5 ? A : Bq;
      const wr = [lin(a, -p), lin(1, -q), lin(1, p * q), lin(1, -p * q), lin(a, -q), lin(1, p + q), lin(1, -p), lin(1, p - q), lin(1, q - p), lin(1, 2 * q), lin(1, -2 * q)].filter(s => s !== A && s !== Bq);
      return { topic: 'FACTORING', text: `Which is a factor of ${expr}?`, ...textual(f, wr), steps };
    }
    return {
      topic: 'FACTORING', text: `Which is equivalent to ${expr}?`,
      ...textual(right, [`(${lin(a, -p)})(${lin(1, -q)})`, `(${A})(${lin(1, -q)})`, `(${lin(a, -p)})(${Bq})`, a > 1 ? `(${lin(a, q)})(${lin(1, p)})` : `(x ${signed(p + q)})(x ${signed(p * q)})`]),
      steps,
    };
  };

  // A.SSE.2: difference of squares, as a pattern and as a shortcut.
  kinds.diffSquares = d => {
    if (d >= 2 && rand() < .4) {
      let s, t; do { s = randInt(3, 15); t = randInt(1, 12); } while (t === s);
      const P = s * t;
      return {
        topic: 'FACTORING', text: `If x^2 - y^2 = ${P} and x + y = ${s}, what is the value of x - y?`,
        ...numeric(t, [P - s, P / 2, s - t, P + s, 2 * t]),
        steps: ['x^2 - y^2 = (x + y)(x - y)', `${P} = ${s}(x - y)`, `x - y = ${P} ÷ ${s} = ${t}`],
      };
    }
    let a, b; do { a = d < 2 ? 1 : randInt(1, 5); b = randInt(2, 9); } while (gcd(a, b) !== 1);
    const A = term(a), expr = `${a === 1 ? '' : a * a}x^2 - ${b * b}`, right = `(${A} + ${b})(${A} - ${b})`;
    const wr = [`(${A} - ${b})^2`, `(${A} + ${b})^2`, `(${A} - ${b * b})(${A} + 1)`];
    if (a > 1) wr.push(`(${a * a}x + ${b})(x - ${b})`);
    else wr.push(`(x - ${b})(x + ${b * b})`);
    return {
      topic: 'FACTORING', text: `Which is equivalent to ${expr}?`, ...textual(right, wr),
      steps: ['A difference of squares: a^2 - b^2 = (a + b)(a - b)', `${expr} = (${A})^2 - ${b}^2`, `So it is ${right}.`],
    };
  };

  // A.APR.1: adding, subtracting and multiplying polynomials.
  kinds.polyOps = d => {
    const f = d < 2 ? pick([0, 2]) : randInt(0, 2);
    if (f === 0) {
      const a = d < 3 ? 1 : randInt(1, 3), c = d < 2 ? 1 : randInt(1, 3);
      let b, e; do { b = nz(-9, 9); e = nz(-9, 9); } while (a * e + b * c === 0);
      const m = a * e + b * c, right = px([a * c, m, b * e]);
      return {
        topic: 'POLYNOMIALS', text: `Which is equivalent to (${lin(a, b)})(${lin(c, e)})?`,
        ...textual(right, [px([a * c, 0, b * e]), px([a * c, m, -b * e]), px([a * c, a * e - b * c, b * e]), px([a * c, -m, b * e]), px([a * c, m + 1, b * e])]),
        steps: [`FOIL: ${term(a * c)}^2 ${signed(a * e)}x ${signed(b * c)}x ${signed(b * e)}`, `Combine the x terms: ${px([a * e + b * c, 0])}`, `= ${right}`],
      };
    }
    if (f === 1) {
      const a = randInt(1, 3), b = nz(-9, 9), right = px([a * a, 2 * a * b, b * b]);
      return {
        topic: 'POLYNOMIALS', text: `Which is equivalent to (${lin(a, b)})^2?`,
        ...textual(right, [px([a * a, 0, b * b]), px([a * a, a * b, b * b]), px([a * a, 2 * a * b, -b * b]), px([a * a, -2 * a * b, b * b])]),
        steps: [`(${lin(a, b)})^2 = (${lin(a, b)})(${lin(a, b)}), not ${px([a * a, 0, b * b])}.`, `FOIL: ${px([a * a, 0, 0])} ${signed(a * b)}x ${signed(a * b)}x ${signed(b * b)}`, `= ${right}`],
      };
    }
    const p2 = randInt(2, 7), q2 = randInt(1, p2 - 1), P = [p2, nz(-9, 9), nz(-9, 9)], Q = [q2, nz(-9, 9), nz(-9, 9)];
    const right = px(P.map((v, i) => v - Q[i]));
    return {
      topic: 'POLYNOMIALS', text: `Which is equivalent to (${px(P)}) - (${px(Q)})?`,
      ...textual(right, [px([p2 - q2, P[1] + Q[1], P[2] + Q[2]]), px(P.map((v, i) => v + Q[i])), px([p2 - q2, P[1] - Q[1], P[2] + Q[2]]), px([p2 - q2, P[1] + Q[1], P[2] - Q[2]])]),
      steps: ['The minus sign hits every term in the second group.', `${px(P)} ${px(Q.map(v => -v)).replace(/^-/, '- ').replace(/^(?=\d|x)/, '+ ')}`, `Combine like terms: ${right}`],
    };
  };

  // ---- Algebra: equations and inequalities

  // A.REI.1, A.REI.3, A.CED.1: linear equations, including no solution and infinitely many.
  const ANSWERS = ['No solution', 'Exactly one', 'Exactly two', 'Infinitely many'];
  kinds.solveLinear = d => {
    const f = pick(d < 2 ? [0] : d < 3 ? [0, 1, 3] : [0, 1, 2, 3]);
    const a = randInt(2, d < 2 ? 6 : 9), b = nz(-9, 9);
    if (f === 2) {
      const k = randInt(0, 2), m = k < 2 ? a : a + pick([-1, 1, 2]), e = k === 0 ? a * b : k === 1 ? a * b + nz(-6, 6) : a * b + nz(-9, 9);
      const right = ANSWERS[[3, 0, 1][k]];
      return {
        topic: 'EQUATIONS', text: `How many solutions does ${a}(x ${signed(b)}) = ${lin(m, e)} have?`, ...textual(right, ANSWERS),
        steps: [`Distribute: ${lin(a, a * b)} = ${lin(m, e)}`,
          k === 0 ? 'Both sides are the same, so every x works.' : k === 1 ? `Subtract ${a}x: ${a * b} = ${e}, which is never true.` : `The x terms don't cancel (${a}x and ${m}x), so exactly one x works.`],
      };
    }
    let x = d < 2 ? randInt(1, 9) : nz(-9, 12);
    if (x + b === 0) x++;
    if (f === 3) {
      const c = randInt(2, 9), q = x * c, r = nz(-9, 9), e = q / c + r;
      return {
        topic: 'EQUATIONS', text: `If x/${c} ${signed(r)} = ${e}, what is the value of x?`,
        ...numeric(q, [(e - r) / c, e - r, c * e - r, c * (e + r), q + c]),
        steps: [`${solveStep(r)}: x/${c} = ${e - r}`, `Multiply both sides by ${c}: x = ${q}`],
      };
    }
    if (f === 1) {
      let c; do c = randInt(1, 9); while (c === a);
      const e = a * (x + b) - c * x;
      return {
        topic: 'EQUATIONS', text: `If ${a}(x ${signed(b)}) = ${lin(c, e)}, what is the value of x?`,
        ...numeric(x, [(e - b) / (a - c), (e - a * b) / (a + c), -x, x + 1, (e + a * b) / (a - c)]),
        steps: [`Distribute: ${lin(a, a * b)} = ${lin(c, e)}`, `Get x on one side: ${lin(a - c, a * b)} = ${e}`, a - c === 1 ? `x = ${x}` : `${term(a - c)} = ${e - a * b}, so x = ${x}`],
      };
    }
    const c = a * (x + b);
    return {
      topic: 'EQUATIONS', text: `If ${a}(x ${signed(b)}) = ${c}, what is the value of x?`,
      ...numeric(x, [(c - b) / a, c / a + b, c - a * b, -x, x + 2]),
      steps: [`Distribute: ${lin(a, a * b)} = ${c}`, `${solveStep(a * b)}: ${a}x = ${c - a * b}`, `Divide by ${a}: x = ${x}`],
    };
  };

  const pair = (u, v) => `x = ${show(Math.min(u, v))} or x = ${show(Math.max(u, v))}`;
  // A.SSE.3a, A.REI.4b: solving quadratics by factoring and by square roots.
  kinds.quadSolve = d => {
    const f = d < 2 ? pick([0, 2]) : pick([0, 0, 1, 2]);
    if (f === 1) {
      const a = randInt(1, 4); let c; do c = nz(-12, 12); while (c === a || c === -a);
      return {
        topic: 'QUADRATICS', text: `What are all the solutions of ${px([a, 0, 0])} = ${px([c, 0])}?`,
        ...textual(pair(0, c / a), [`x = ${show(c / a)} only`, 'x = 0 only', pair(0, -c / a), pair(0, a / c), pair(c, a)]),
        steps: ["Don't divide by x: you'd lose x = 0.", `Move it all to one side: ${px([a, -c, 0])} = 0`, `x(${lin(a, -c)}) = 0, so x = 0 or x = ${show(c / a)}`],
      };
    }
    if (f === 2) {
      const h = nz(-6, 6), k = randInt(1, 8);
      return {
        topic: 'QUADRATICS', text: `What are the solutions of (x ${signed(-h)})^2 = ${k * k}?`,
        ...textual(pair(h - k, h + k), [pair(-h - k, -h + k), `x = ${h + k} only`, pair(h - k * k, h + k * k), pair(h, k)]),
        steps: [`Take the square root of both sides: x ${signed(-h)} = ${k} or x ${signed(-h)} = ${-k}`, `x = ${h} + ${k} or x = ${h} - ${k}`, `So ${pair(h - k, h + k)}.`],
      };
    }
    const a = d < 3 ? 1 : pick([1, 2, 3]);
    let p, q, tries = 0;
    do { p = nz(-9, 9); q = nz(-8, 8); } while ((gcd(a, p) !== 1 || p === q * a || p === -q * a) && ++tries < 40);
    if (tries >= 40) { p = 1; q = 2; }
    const r = p / a, eq = px([a, -(a * q + p), p * q]);
    return {
      topic: 'QUADRATICS', text: `What are the solutions of ${eq} = 0?`,
      ...textual(pair(r, q), [pair(-r, -q), pair(r, -q), pair(-r, q), pair(p, q), pair(-p, -q)]),
      steps: a === 1
        ? [`Two numbers that multiply to ${p * q} and add to ${-(p + q)}: ${-p} and ${-q}.`, `(x ${signed(-p)})(x ${signed(-q)}) = 0`, `So ${pair(r, q)}.`]
        : [`Factor: (${lin(a, -p)})(x ${signed(-q)}) = 0`, `${lin(a, -p)} = 0 gives x = ${show(r)}`, `x ${signed(-q)} = 0 gives x = ${q}`],
    };
  };

  // A.REI.4a, A.REI.4b: the quadratic formula.
  kinds.quadFormula = d => {
    const a = d >= 4 && rand() < .5 ? 2 : 1;
    let b, c, D, tries = 0;
    do { b = pick([-9, -7, -5, -3, -1, 1, 3, 5, 7, 9]); c = nz(-9, 9); D = b * b - 4 * a * c; } while ((D <= 0 || Number.isInteger(Math.sqrt(D))) && ++tries < 40);
    if (tries >= 40) { b = 3; c = -1; D = 9 + 4 * a; }
    const den = 2 * a, top = (p, r) => `(${p} + ${r})/${den}`, right = top(-b, rt(D)), E = b * b + 4 * a * c;
    const wr = [top(b, rt(D)), `${-b} + ${rt(D)}`, `(${-b} - ${rt(D)})/${den}`];
    const ok = n => n > 0 && !Number.isInteger(Math.sqrt(n));
    for (const n of [E, D + 4, D + 8]) if (ok(n)) wr.push(top(-b, rt(n)));
    const steps = ['x = (-b + √(b^2 - 4ac))/(2a) gives the greater one.', `b^2 - 4ac = ${b * b} ${signed(-4 * a * c)} = ${D}`];
    if (rt(D) !== '√' + D) steps.push(`√${D} = ${rt(D)}`);
    steps.push(`x = ${right}`);
    return { topic: 'QUADRATICS', text: `What is the greater solution of ${px([a, b, c])} = 0?`, ...textual(right, wr), steps };
  };

  // A.REI.4a, A.SSE.3b, F.IF.8a: completing the square.
  kinds.completeSquare = d => {
    const h = nz(-7, 7);
    let c, tries = 0; do c = nz(-12, 12); while (h * h - c < 1 && ++tries < 30);
    if (tries >= 30) c = -1;
    const sq = v => `(x ${signed(v)})^2`, eqn = px([1, 2 * h, c]);
    if (d >= 3 && rand() < .5) {
      const k = c - h * h;
      return {
        topic: 'QUADRATICS', text: `What is the vertex of the graph of y = ${eqn}?`,
        ...textual(pt(-h, k), [pt(h, k), pt(-h, c), pt(h, c), pt(-2 * h, k), pt(-h, -k)]),
        steps: [`Half of ${2 * h} is ${h}; ${h} squared is ${h * h}.`, `y = ${sq(h)} ${signed(k)}`, `y = (x - h)^2 + k has its vertex at (h, k): ${pt(-h, k)}.`],
      };
    }
    return {
      topic: 'QUADRATICS', text: `Which equation is equivalent to ${eqn} = 0?`,
      ...textual(`${sq(h)} = ${h * h - c}`, [`${sq(h)} = ${-c}`, `${sq(h)} = ${h * h + c}`, `${sq(2 * h)} = ${4 * h * h - c}`, `${sq(-h)} = ${h * h - c}`]),
      steps: [`Move the constant: ${px([1, 2 * h, 0])} = ${-c}`, `Half of ${2 * h} is ${h}. Add ${h * h} to both sides.`, `${sq(h)} = ${-c} + ${h * h} = ${h * h - c}`],
    };
  };

  // A.REI.4b, N.CN.7: the discriminant, and complex solutions.
  kinds.discriminant = d => {
    if (d >= 3 && rand() < .4) {
      const h = nz(-5, 5), k = randInt(1, 6), c = h * h + k * k;
      return {
        topic: 'QUADRATICS', text: `If i = √-1, which is a solution of ${px([1, 2 * h, c])} = 0?`,
        ...textual(cx(-h, k), [cx(h, k), cx(h, -k), cx(-h, k * k), cx(-2 * h, k), String(-h + k)]),
        steps: [`b^2 - 4ac = ${4 * h * h} - ${4 * c} = ${-4 * k * k}`, `√${-4 * k * k} = ${2 * k}i`, `x = (${-2 * h} + ${2 * k}i)/2 = ${cx(-h, k)}`],
      };
    }
    const type = randInt(0, 2);
    let a, b, c, tries = 0;
    if (type === 1) { const p = randInt(1, 3), q = nz(-6, 6); a = p * p; b = 2 * p * q; c = q * q; }
    else do { a = randInt(1, d < 2 ? 2 : 5); b = nz(-9, 9); c = nz(-9, 9); } while ((type === 2 ? b * b - 4 * a * c <= 0 : b * b - 4 * a * c >= 0) && ++tries < 60);
    if (tries >= 60) { a = 1; b = 2; c = type === 2 ? -3 : 5; }
    const D = b * b - 4 * a * c, right = ['No real solutions', 'Exactly one', 'Exactly two'][type];
    const steps = [`b^2 - 4ac = (${b})^2 - 4(${a})(${c})`, `= ${b * b} ${signed(-4 * a * c)} = ${D}`,
      D > 0 ? 'Positive: two real solutions.' : D === 0 ? 'Zero: exactly one real solution.' : 'Negative: no real solutions.'];
    if (d >= 2 && rand() < .4) {
      return { topic: 'QUADRATICS', text: `What is the value of the discriminant of ${px([a, b, c])} = 0?`,
        ...numeric(D, [b * b + 4 * a * c, -b * b - 4 * a * c, b - 4 * a * c, 4 * a * c - b * b], String), steps: steps.slice(0, 2) };
    }
    return { topic: 'QUADRATICS', text: `How many real solutions does ${px([a, b, c])} = 0 have?`, ...textual(right, ['No real solutions', 'Exactly one', 'Exactly two', 'Infinitely many']), steps };
  };

  // A.CED.1, A.REI.3: absolute value equations.
  kinds.absEq = d => {
    const a = d < 2 ? 1 : randInt(1, 3), t = randInt(1, 6), c = a * t, lo = nz(-8, 8), hi = lo + 2 * t, b = c - a * hi;
    const m = d >= 3 && rand() < .5 ? nz(-9, 9) : 0, L = `|${lin(a, b)}|${m ? ' ' + signed(m) : ''}`;
    if (d >= 3 && m > 0 && rand() < .35) {
      const n = randInt(-5, m - 1), u = (n - m - b) / a, v = (m - n - b) / a;
      return {
        topic: 'ABSOLUTE VAL', text: `What are all the solutions of ${L} = ${n}?`,
        ...textual('No solution', [pair(u, v), `x = ${show(u)} only`, 'All real numbers', `x = ${show(v)} only`]),
        steps: [`Subtract ${m}: |${lin(a, b)}| = ${n - m}`, 'An absolute value is never negative.', 'So there is no solution.'],
      };
    }
    const steps = [`Two cases: ${lin(a, b)} = ${c} or ${lin(a, b)} = ${-c}`, `${term(a)} = ${c - b} or ${term(a)} = ${-c - b}`, `So ${pair(lo, hi)}.`];
    if (m) steps.unshift(`${m > 0 ? 'Subtract ' + m : 'Add ' + -m}: |${lin(a, b)}| = ${c}`);
    return {
      topic: 'ABSOLUTE VAL', text: `What are the solutions of ${L} = ${c + m}?`,
      ...textual(pair(lo, hi), [`x = ${hi} only`, pair(-hi, -lo), pair(hi, -hi), 'No solution', `x = ${lo} only`]),
      steps,
    };
  };

  // A.REI.2: radical equations, and the extraneous root.
  kinds.radicalEq = d => {
    if (d >= 3 && rand() < .5) {
      const m = randInt(1, 5), r = m + randInt(2, 6), s = 2 * m + 1 - r, k = m * m - r * s;
      const L = k === 0 ? '√x' : `√(x ${signed(k)})`;
      return {
        topic: 'RADICAL EQS', text: `What are all the solutions of ${L} = x - ${m}?`,
        ...textual(`x = ${r} only`, [`x = ${s} only`, `x = ${Math.min(r, s)} or x = ${Math.max(r, s)}`, 'No solution']),
        steps: [`Square both sides: x ${k ? signed(k) + ' ' : ''}= (x - ${m})^2`, `${px([1, -(2 * m + 1), m * m - k])} = 0, so x = ${s} or x = ${r}`,
          `Check x = ${s}: the left side is ${m - s}, the right is ${s - m}. It fails.`, `Only x = ${r} works.`],
      };
    }
    const a = randInt(1, d < 2 ? 2 : 4), c = randInt(2, 9), x = randInt(-4, 12), b = c * c - a * x, m = d >= 2 && rand() < .4 ? randInt(1, 9) : 0;
    const L = `√(${lin(a, b)})${m ? ' + ' + m : ''}`;
    const steps = [`Square both sides: ${lin(a, b)} = ${c * c}`, `${term(a)} = ${c * c - b}`, `x = ${x}`];
    if (m) steps.unshift(`Subtract ${m}: √(${lin(a, b)}) = ${c}`);
    return {
      topic: 'RADICAL EQS', text: `If ${L} = ${c + m}, what is the value of x?`,
      ...numeric(x, [(c - b) / a, (c * c + b) / a, c * c, (c + m) * (c + m) - b, x + 2]), steps,
    };
  };

  // A.REI.5, A.REI.6, A.CED.3: systems of linear equations.
  const eqxy = (a, b, c) => `${term(a)} ${b < 0 ? '-' : '+'} ${term(Math.abs(b), 'y')} = ${c}`;
  kinds.systems = d => {
    const f = d < 2 ? 0 : pick([0, 1, 2]);
    if (f === 1) {
      const items = pick([['slushies', 'pretzels', 'arcade snack bar'], ['tacos', 'sodas', 'food truck'], ['comic books', 'posters', 'comic shop'], ['bags of chips', 'juice boxes', 'school store']]);
      let p, q; do { p = randInt(2, 8); q = randInt(2, 8); } while (p === q);
      let a1, b1, a2, b2; do { a1 = randInt(2, 5); b1 = randInt(2, 5); a2 = randInt(2, 5); b2 = randInt(2, 5); } while (a1 * b2 === a2 * b1);
      const T1 = a1 * p + b1 * q, T2 = a2 * p + b2 * q, n = who();
      return {
        topic: 'SYSTEMS', text: `At the ${items[2]}, ${a1} ${items[0]} and ${b1} ${items[1]} cost $${T1}. ${n} paid $${T2} for ${a2} ${items[0]} and ${b2} ${items[1]}. What does one of the ${items[1]} cost?`,
        ...numeric(q, [p, Math.round((T1 + T2) / (a1 + b1 + a2 + b2)), Math.abs(T1 - T2), q + 1], v => '$' + v),
        steps: [`Let s be the price of one of the ${items[0]}, p one of the ${items[1]}.`, `${a1}s + ${b1}p = ${T1} and ${a2}s + ${b2}p = ${T2}`, `Eliminate s: p = ${q} (and s = ${p}).`],
      };
    }
    let x, y; do { x = nz(-6, 8); y = nz(-6, 8); } while (x === y || x === -y);
    if (f === 2) {
      const m = nz(-4, 4), k = y - m * x, a = nz(-5, 5), b = nz(-4, 4), c = a * x + b * y;
      return {
        topic: 'SYSTEMS', text: `Solve the system:\ny = ${lin(m, k)}\n${eqxy(a, b, c)}`,
        ...textual(pt(x, y), [pt(y, x), pt(-x, y), pt(x, -y), pt(x + 1, y + m), pt(-x, -y)]),
        steps: [`Substitute y = ${lin(m, k)} into the second equation.`, `${term(a)} ${b < 0 ? '-' : '+'} ${Math.abs(b)}(${lin(m, k)}) = ${c}, so x = ${x}`, `y = ${m}(${x}) ${signed(k)} = ${y}`],
      };
    }
    let a1, b1, a2, b2; do { a1 = nz(-5, 5); b1 = nz(-5, 5); a2 = nz(-5, 5); b2 = nz(-5, 5); } while (a1 * b2 === a2 * b1);
    const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
    return {
      topic: 'SYSTEMS', text: `Solve the system:\n${eqxy(a1, b1, c1)}\n${eqxy(a2, b2, c2)}`,
      ...textual(pt(x, y), [pt(y, x), pt(-x, y), pt(x, -y), pt(-x, -y), pt(x + 1, y - 1)]),
      steps: [`Multiply the first by ${b2} and the second by ${b1}, then subtract:`, `${a1 * b2 - a2 * b1}x = ${c1 * b2 - c2 * b1}, so x = ${x}`, `Put x = ${x} into the first: y = ${y}`],
    };
  };

  // A.REI.3, A.CED.1, A.CED.3: linear inequalities, compound inequalities, constraints.
  const FLIP = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };
  kinds.inequalities = d => {
    const f = d < 3 ? pick([0, 0, 2]) : pick([0, 1, 2]);
    if (f === 2) {
      const n = who(), p = pick([1.25, 1.5, 1.75, 2.25, 2.5, 3.5]), F0 = pick([5, 6, 8, 10]);
      let B, tries = 0; do B = randInt(20, 60); while (Number.isInteger((B - F0) / p) && ++tries < 20);
      const ans = Math.floor((B - F0) / p);
      return {
        topic: 'INEQUALITIES', text: `${n} has $${B} for the arcade. Entry is $${F0}, and each game costs $${p.toFixed(2)}. What is the greatest number of games ${n} can play?`,
        ...numeric(ans, [ans + 1, Math.floor(B / p), Math.floor((B + F0) / p), ans - 1]),
        steps: [`${F0} + ${p.toFixed(2)}g ≤ ${B}`, `${p.toFixed(2)}g ≤ ${B - F0}, so g ≤ ${r2((B - F0) / p)}`, `Games come whole: at most ${ans}.`],
      };
    }
    if (f === 1) {
      const a = d >= 4 && rand() < .5 ? -pick([2, 3]) : pick([2, 3, 4]), b = nz(-9, 9), lo = randInt(-6, 3), hi = lo + randInt(2, 7);
      if (a > 0) {
        const P = a * lo + b, Q = a * hi + b;
        return {
          topic: 'INEQUALITIES', text: `Which describes all solutions of ${P} < ${lin(a, b)} ≤ ${Q}?`,
          ...textual(`${lo} < x ≤ ${hi}`, [`${lo} ≤ x < ${hi}`, `x < ${lo} or x ≥ ${hi}`, `${P - b} < x ≤ ${Q - b}`, `${lo - 1} < x ≤ ${hi - 1}`]),
          steps: [`${solveStep(b)} in all three parts: ${P - b} < ${a}x ≤ ${Q - b}`, `Divide all three parts by ${a}: ${lo} < x ≤ ${hi}`],
        };
      }
      const P = a * hi + b, Q = a * lo + b;
      return {
        topic: 'INEQUALITIES', text: `Which describes all solutions of ${P} < ${lin(a, b)} ≤ ${Q}?`,
        ...textual(`${lo} ≤ x < ${hi}`, [`${hi} < x ≤ ${lo}`, `${lo} < x ≤ ${hi}`, `x < ${lo} or x ≥ ${hi}`, `${-hi} < x ≤ ${-lo}`]),
        steps: [`${solveStep(b)}: ${P - b} < ${a}x ≤ ${Q - b}`, `Divide by ${a} and flip both signs: ${hi} > x ≥ ${lo}`, `That is ${lo} ≤ x < ${hi}.`],
      };
    }
    const a = d >= 2 && rand() < .55 ? -randInt(2, 6) : randInt(2, 6), k = nz(-8, 8), b = nz(-12, 12), c = a * k + b, op = pick(['<', '>', '≤', '≥']);
    const res = a < 0 ? FLIP[op] : op;
    return {
      topic: 'INEQUALITIES', text: `Which describes all solutions of ${lin(a, b)} ${op} ${c}?`,
      ...textual(`x ${res} ${k}`, [`x ${FLIP[res]} ${k}`, `x ${res} ${-k}`, `x ${FLIP[res]} ${-k}`, `x ${res} ${show((c + b) / a)}`]),
      steps: [`${solveStep(b)}: ${term(a)} ${op} ${c - b}`, a < 0 ? `Divide by ${a}, and flip the sign: x ${res} ${k}` : `Divide by ${a}: x ${res} ${k}`],
    };
  };

  // A.CED.4: rearranging formulas.
  const FORMULAS = [
    ['A = LW', 'the area of a rectangle', 'W', 'W = A/L', ['W = AL', 'W = L/A', 'W = A - L'], 'Divide both sides by L.'],
    ['P = 2L + 2W', 'the perimeter of a rectangle', 'L', 'L = (P - 2W)/2', ['L = P/2 - 2W', 'L = (P + 2W)/2', 'L = P - W', 'L = (P - W)/2'], 'Subtract 2W, then divide by 2.'],
    ['V = πr^2h', 'the volume of a cylinder', 'h', 'h = V/(πr^2)', ['h = Vπr^2', 'h = πr^2/V', 'h = V - πr^2'], 'Divide both sides by πr^2.'],
    ['A = (1/2)bh', 'the area of a triangle', 'h', 'h = 2A/b', ['h = A/(2b)', 'h = 2Ab', 'h = b/(2A)', 'h = A/b - 2'], 'Multiply by 2, then divide by b.'],
    ['y = mx + b', 'a line', 'x', 'x = (y - b)/m', ['x = y/m - b', 'x = (y + b)/m', 'x = m(y - b)'], 'Subtract b, then divide by m.'],
    ['C = (5/9)(F - 32)', 'Celsius from Fahrenheit', 'F', 'F = (9/5)C + 32', ['F = (5/9)C + 32', 'F = (9/5)C - 32', 'F = (9/5)(C + 32)'], 'Multiply by 9/5, then add 32.'],
    ['I = Prt', 'simple interest', 'r', 'r = I/(Pt)', ['r = IPt', 'r = Pt/I', 'r = I - Pt'], 'Divide both sides by Pt.'],
    ['ax + by = c', 'a line in standard form', 'y', 'y = (c - ax)/b', ['y = c - ax/b', 'y = (c + ax)/b', 'y = (ax - c)/b', 'y = b(c - ax)'], 'Subtract ax, then divide by b.'],
    ['v = u + at', 'speed after speeding up', 't', 't = (v - u)/a', ['t = v/a - u', 't = (v + u)/a', 't = a(v - u)'], 'Subtract u, then divide by a.'],
    ['S = 2πrh', 'the side area of a cylinder', 'h', 'h = S/(2πr)', ['h = 2πrS', 'h = S - 2πr', 'h = 2πr/S'], 'Divide both sides by 2πr.'],
  ];
  kinds.literalEq = d => {
    const [f, what, v, right, wrongs, how] = pick(d < 2 ? FORMULAS.slice(0, 5) : FORMULAS);
    return {
      topic: 'FORMULAS', text: `The formula ${f} is for ${what}. Which equation gives ${v} in terms of the other letters?`,
      ...textual(right, wrongs), steps: [`Get ${v} alone: undo what is done to it, in reverse order.`, how, right],
    };
  };

  // ---- Functions

  // A table of values: rows of cells, the first column a header.
  function table(c, w, h, rows) {
    const n = rows[0].length, cw = Math.floor((w - 1) / n), rh = Math.floor((h - 1) / rows.length), W2 = cw * n, H2 = rh * rows.length;
    for (let i = 0; i <= rows.length; i++) F.line(c, 0, i * rh, W2, i * rh, DIM);
    for (let j = 0; j <= n; j++) F.line(c, j * cw, 0, j * cw, H2, DIM);
    rows.forEach((r, i) => r.forEach((s, j) => F.label(c, String(s), j * cw + cw / 2 + 1, i * rh + rh / 2 + 1, j === 0 ? HOT : INK)));
  }

  // F.IF.1, F.IF.2: function notation, from a rule or a table.
  kinds.funcNotation = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 3);
    if (f === 1) {
      const s0 = randInt(-2, 1), xs = [0, 1, 2, 3, 4].map(v => v + s0), q = d < 2 ? 0 : randInt(-1, 1), m = nz(-4, 5), b = randInt(-6, 9);
      const ys = xs.map(x => q * x * x + m * x + b), at = v => xs.includes(v) ? ys[xs.indexOf(v)] : v + 2;
      const i = randInt(1, 4), askOut = rand() < .5;
      const fig = (c, w, h) => table(c, w, h, [['x', ...xs], ['f(x)', ...ys]]);
      if (askOut || ys.filter(v => v === ys[i]).length > 1) {
        return {
          topic: 'FUNCTIONS', text: `The table shows some values of the function f. What is f(${xs[i]})?`, size: [130, 30], fig,
          ...numeric(ys[i], [xs[i], at(xs[i] === ys[i] ? 99 : ys[i]), ys[i - 1], ys[(i + 1) % 5], ys[i] + 1]),
          steps: [`f(${xs[i]}) means the output when the input x is ${xs[i]}.`, `Find x = ${xs[i]} in the top row; read below it.`, `f(${xs[i]}) = ${ys[i]}`],
        };
      }
      return {
        topic: 'FUNCTIONS', text: `The table shows some values of the function f. For what value of x is f(x) = ${ys[i]}?`, size: [130, 30], fig,
        ...numeric(xs[i], [ys[i], at(ys[i]), xs[i] + 1, xs[i] - 1]),
        steps: [`f(x) = ${ys[i]} means the output is ${ys[i]}.`, `Find ${ys[i]} in the bottom row; read the x above it.`, `x = ${xs[i]}`],
      };
    }
    if (f === 2) {
      const c = nz(-9, 9), k = nz(-4, 4), right = px([1, 2 * k, k * k + c]);
      return {
        topic: 'FUNCTIONS', text: `If f(x) = ${px([1, 0, c])}, which is equal to f(x ${signed(k)})?`,
        ...textual(right, [px([1, 0, c + k]), px([1, 0, k * k + c]), px([1, k, k * k + c]), px([1, 2 * k, c]), px([1, 2 * k, k * k - c])]),
        steps: [`Put (x ${signed(k)}) in place of x: (x ${signed(k)})^2 ${signed(c)}`, `(x ${signed(k)})^2 = ${px([1, 2 * k, k * k])}`, `So f(x ${signed(k)}) = ${right}`],
      };
    }
    if (f === 3) {
      const m = nz(-6, 6), b = nz(-9, 9), x = nz(-6, 9), v = m * x + b;
      return {
        topic: 'FUNCTIONS', text: `If f(x) = ${lin(m, b)} and f(a) = ${v}, what is the value of a?`,
        ...numeric(x, [m * v + b, (v + b) / m, v, -x, x + 1]),
        steps: [`f(a) = ${v} means ${lin(m, b, 'a')} = ${v}.`, `${term(m, 'a')} = ${v - b}`, `a = ${x}`],
      };
    }
    const a = d < 3 ? 1 : nz(-3, 3), b = nz(-6, 6), c = nz(-9, 9), k = d < 2 ? randInt(1, 4) : nz(-4, 4), ans = a * k * k + b * k + c;
    return {
      topic: 'FUNCTIONS', text: `If f(x) = ${px([a, b, c])}, what is the value of f(${k})?`,
      ...numeric(ans, [-a * k * k + b * k + c, a * k * k - b * k + c, 2 * a * k + b * k + c, a * k * k + b * k]),
      steps: [`Replace every x with (${k}): ${a === 1 ? '' : a === -1 ? '-' : a}(${k})^2 ${signed(b)}(${k}) ${signed(c)}`, `(${k})^2 = ${k * k}`, `= ${a * k * k} ${signed(b * k)} ${signed(c)} = ${ans}`],
    };
  };

  // F.IF.1, F.IF.5: domain and range, from a graph or a formula.
  kinds.domainRange = d => {
    if (d >= 2 && rand() < .45) {
      const a = nz(-6, 6), t = randInt(0, 3), A = `x ${signed(-a)}`;
      const forms = [[`√(${A})`, `x ≥ ${a}`], [`√(${-a} - x)`.replace('√(0 - x)', '√(-x)'), `x ≤ ${-a}`], [`1/(${A})`, `All x except ${a}`], [`√(2x ${signed(-2 * a)})`, `x ≥ ${a}`]];
      const [expr, right] = forms[t];
      return {
        topic: 'DOMAIN/RANGE', text: `What is the domain of f(x) = ${expr}?`,
        ...textual(right, [`x ≥ ${a}`, `x ≤ ${a}`, `x ≥ ${-a}`, `x ≤ ${-a}`, `All x except ${a}`, `All x except ${-a}`, 'All real numbers'].filter(s => s !== right)),
        steps: t === 2 ? ["You can't divide by zero.", `x ${signed(-a)} = 0 when x = ${a}.`, `So the domain is all x except ${a}.`]
          : ["You can't take the square root of a negative.", `Set the inside ≥ 0 and solve.`, `So the domain is ${right}.`],
      };
    }
    const xa = randInt(-5, -2), xb = randInt(2, 5), xm = randInt(xa + 1, xb - 2), xn = randInt(xm + 1, xb - 1);
    let ys, tries = 0;
    do ys = [0, 0, 0, 0].map(() => randInt(-4, 4)); while ((new Set(ys).size < 3 || Math.min(...ys) === Math.min(ys[0], ys[3]) && Math.max(...ys) === Math.max(ys[0], ys[3])) && ++tries < 40);
    const xs = [xa, xm, xn, xb], lo = Math.min(...ys), hi = Math.max(...ys);
    const fig = (c, w, h) => {
      const P = F.grid(c, w, h, [-6, 6], [-5, 5]);
      for (let i = 0; i < 3; i++) F.line(c, ...P(xs[i], ys[i]), ...P(xs[i + 1], ys[i + 1]), HOT);
      F.dot(c, P(xa, ys[0]), RED); F.dot(c, P(xb, ys[3]), RED);
    };
    const steps0 = 'Each grid square is 1 unit. The dots are endpoints, included.';
    if (rand() < .5) {
      const right = `${xa} ≤ x ≤ ${xb}`;
      return {
        topic: 'DOMAIN/RANGE', text: 'The whole graph of y = f(x) is shown. What is the domain of f?', size: [97, 81], fig,
        ...textual(right, [`${lo} ≤ x ≤ ${hi}`, `${xa} < x < ${xb}`, `${xa - 1} ≤ x ≤ ${xb + 1}`, `${-xb} ≤ x ≤ ${-xa}`, `${xa} ≤ x ≤ ${xb - 1}`]),
        steps: [steps0, `The domain is the x-values used: from ${xa} to ${xb}.`],
      };
    }
    const e = [Math.min(ys[0], ys[3]), Math.max(ys[0], ys[3])];
    return {
      topic: 'DOMAIN/RANGE', text: 'The whole graph of y = f(x) is shown. What is the range of f?', size: [97, 81], fig,
      ...textual(`${lo} ≤ y ≤ ${hi}`, [`${xa} ≤ y ≤ ${xb}`, `${e[0]} ≤ y ≤ ${e[1]}`, `${lo} < y < ${hi}`, `${lo - 1} ≤ y ≤ ${hi + 1}`, `${lo} ≤ y ≤ ${hi - 1}`]),
      steps: [steps0, `The range is the y-values reached: lowest ${lo}, highest ${hi}.`],
    };
  };

  // F.IF.6: average rate of change.
  kinds.rateChange = d => {
    const f = d < 2 ? 1 : randInt(0, 2);
    if (f === 1) {
      const [what, unit, s] = pick([['A skate park had', 'members', 5], ['A video channel had', 'subscribers', 50], ['A town park had', 'trees', 2], ['A school band had', 'players', 1]]);
      const n = randInt(2, 8), r = randInt(2, 12) * s * (rand() < .25 ? -1 : 1), A = randInt(10, 40) * s * 2 + (r < 0 ? -r * n : 0), B = A + r * n, y0 = randInt(2008, 2016);
      return {
        topic: 'RATE OF CHANGE', text: `${what} ${cm(A)} ${unit} in ${y0} and ${cm(B)} in ${y0 + n}. What was the average rate of change, in ${unit} per year?`,
        ...numeric(r, [r * n, B / n, -r, r + s, A / n], cm),
        steps: [`Change in ${unit}: ${cm(B)} - ${cm(A)} = ${cm(B - A)}`, `Change in years: ${y0 + n} - ${y0} = ${n}`, `${cm(B - A)} / ${n} = ${cm(r)} per year`],
      };
    }
    const a = f === 2 ? -16 : nz(-3, 3), b = f === 2 ? randInt(3, 6) * 16 : nz(-6, 6), c = f === 2 ? 0 : randInt(-5, 5);
    const p = f === 2 ? randInt(0, 1) : randInt(-3, 2), q = p + randInt(1, 3), fn = x => a * x * x + b * x + c, ans = a * (p + q) + b;
    if (f === 2) {
      return {
        topic: 'RATE OF CHANGE', text: `A ball's height, in feet, t seconds after it is kicked up is h(t) = ${px([a, b, 0], 't')}. What is its average rate of change from t = ${p} to t = ${q}, in feet per second?`,
        ...numeric(ans, [fn(q) - fn(p), (fn(q) + fn(p)) / (q - p), 2 * a * q + b, fn(q) / q]),
        steps: [`h(${q}) = ${fn(q)} and h(${p}) = ${fn(p)}`, `(${fn(q)} - ${fn(p)}) / (${q} - ${p})`, `= ${fn(q) - fn(p)} / ${q - p} = ${ans}`],
      };
    }
    return {
      topic: 'RATE OF CHANGE', text: `What is the average rate of change of f(x) = ${px([a, b, c])} from x = ${p} to x = ${q}?`,
      ...numeric(ans, [fn(q) - fn(p), (q - p) / (fn(q) - fn(p)), 2 * a * q + b, -ans, (fn(q) + fn(p)) / (q - p)]),
      steps: [`f(${q}) = ${fn(q)} and f(${p}) = ${fn(p)}`, `(f(${q}) - f(${p})) / (${q} - ${p}) = (${fn(q)} - ${fn(p) < 0 ? '(' + fn(p) + ')' : fn(p)}) / ${q - p}`, `= ${fn(q) - fn(p)} / ${q - p} = ${show(ans)}`],
    };
  };

  // F.BF.3: transformations of graphs.
  const MOVES = [['-f(x)', 'Reflected across the x-axis'], ['f(-x)', 'Reflected across the y-axis'], ['f(x) + K', 'Shifted up K units'], ['f(x) - K', 'Shifted down K units'],
    ['f(x + K)', 'Shifted left K units'], ['f(x - K)', 'Shifted right K units'], ['Kf(x)', 'Stretched taller by a factor of K']];
  kinds.transformFn = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 2);
    if (f === 1) {
      const K = randInt(2, 5), set = MOVES.map(([e, s]) => [e.replace('K', K), s.replace('K', K)]), [e, right] = pick(set);
      return {
        topic: 'TRANSFORMS', text: `How does the graph of y = ${e} compare with the graph of y = f(x)?`,
        ...textual(right, shuffle(set.map(m => m[1]).filter(s => s !== right))),
        steps: [`Changes outside f( ) move it up and down; inside, left and right (backwards).`, `y = ${e}: ${right.toLowerCase()}.`],
      };
    }
    let H, K; do { H = nz(-4, 4); K = nz(-4, 4); } while (H === K || H === -K);
    if (f === 0) {
      const dir = (v, a, b) => `${Math.abs(v)} unit${Math.abs(v) > 1 ? 's' : ''} ${v > 0 ? a : b}`;
      const g = (p, q) => `y = f(x ${signed(-p)}) ${signed(q)}`;
      return {
        topic: 'TRANSFORMS', text: `The graph of y = f(x) is moved ${dir(H, 'right', 'left')} and ${dir(K, 'up', 'down')}. Which equation gives the new graph?`,
        ...textual(g(H, K), [g(-H, K), g(K, H), g(-H, -K), g(H, -K), g(-K, H)]),
        steps: ['Right h: replace x with x - h. Up k: add k.', `${dir(H, 'right', 'left')}: x ${signed(-H)}. ${dir(K, 'up', 'down')}: ${signed(K)}.`, `So ${g(H, K)}`],
      };
    }
    const a = d >= 4 && rand() < .4 ? -1 : 1, s = a < 0 ? '-' : '', G = (p, q) => `g(x) = ${s}(x ${signed(-p)})^2 ${signed(q)}`;
    let hh, kk; do { hh = nz(-3, 3); kk = nz(-3, 3); } while (hh === kk || hh === -kk);
    return {
      topic: 'TRANSFORMS', text: `The blue graph is f(x) = x^2. The yellow graph g is f moved${a < 0 ? ' and flipped' : ''}. Which is g?`, size: [96, 86],
      ...textual(G(hh, kk), [G(-hh, kk), G(kk, hh), G(-hh, -kk), G(hh, -kk)]),
      steps: [`The vertex moved from (0, 0) to ${pt(hh, kk)}.`, `Vertex (h, k) gives ${s}(x - h)^2 + k.`, `So ${G(hh, kk)}`],
      fig: (c, w, h) => {
        const P = F.grid(c, w, h, [-6, 6], [-5, 6]);
        F.plot(c, P, x => x * x, [-6, 6], BLU);
        F.plot(c, P, x => a * (x - hh) ** 2 + kk, [-6, 6], HOT);
        F.dot(c, P(hh, kk), RED);
      },
    };
  };

  // F.BF.4a: inverse functions.
  kinds.inverseFn = d => {
    const f = d < 2 ? pick([0, 2]) : d < 3 ? randInt(0, 2) : pick([0, 1, 2, 3]);
    const a = randInt(2, 6), b = nz(-9, 9);
    if (f === 3) {
      return {
        topic: 'INVERSES', text: `If f(x) = x^3 ${signed(b)}, which is f^{-1}(x)?`,
        ...textual(nroot(3, `(x ${signed(-b)})`), [`${nroot(3, 'x')} ${signed(-b)}`, nroot(3, `(x ${signed(b)})`), `(x ${signed(-b)})^3`, `1/(x^3 ${signed(b)})`]),
        steps: ['Swap x and y: x = y^3 ' + signed(b), `Undo the ${b > 0 ? 'add' : 'subtract'}: x ${signed(-b)} = y^3`, `Undo the cube: y = ${nroot(3, `(x ${signed(-b)})`)}`],
      };
    }
    if (f === 2) {
      const v = a * randInt(-3, 6) + b, ans = (v - b) / a;
      return {
        topic: 'INVERSES', text: `If f(x) = ${lin(a, b)}, what is the value of f^{-1}(${v})?`,
        ...numeric(ans, [a * v + b, (v + b) / a, v / a, -ans, 1 / (a * v + b)]),
        steps: [`f^{-1}(${v}) is the x that makes f(x) = ${v}.`, `${lin(a, b)} = ${v}, so ${a}x = ${v - b}`, `x = ${show(ans)}`],
      };
    }
    const right = `(x ${signed(-b)})/${a}`;
    return {
      topic: 'INVERSES', text: `If f(x) = ${lin(a, b)}, which is f^{-1}(x)?`,
      ...textual(right, [`(x ${signed(b)})/${a}`, `x/${a} ${signed(-b)}`, `${a}x ${signed(-b)}`, `1/(${lin(a, b)})`, `${a}(x ${signed(-b)})`]),
      steps: [`Swap x and y: x = ${lin(a, b, 'y')}`, `Solve for y: ${a}y = x ${signed(-b)}`, `y = ${right}`],
    };
  };

  // F.BF.1, F.BF.1c: combining and composing functions.
  kinds.composeFn = d => {
    const f = d < 2 ? 0 : d < 3 ? randInt(0, 1) : randInt(0, 2);
    const a = nz(-4, 5), b = nz(-6, 6);
    if (f === 0) {
      const c = nz(-6, 6), k = d < 2 ? randInt(1, 3) : nz(-3, 3);
      const Fn = x => a * x + b, G = x => x * x + c, ans = Fn(G(k));
      return {
        topic: 'COMPOSITION', text: `If f(x) = ${lin(a, b)} and g(x) = ${px([1, 0, c])}, what is f(g(${k}))?`,
        ...numeric(ans, [G(Fn(k)), Fn(k) * G(k), Fn(k) + G(k), Fn(G(-k)) + 1, G(k)]),
        steps: [`Inside first: g(${k}) = (${k})^2 ${signed(c)} = ${G(k)}`, `Then f(${G(k)}) = ${a}(${G(k)}) ${signed(b)}`, `= ${ans}`],
      };
    }
    if (f === 1) {
      let c, e; do { c = nz(-4, 5); e = nz(-6, 6); } while (a * e + b === c * b + e);
      const right = lin(a * c, a * e + b);
      return {
        topic: 'COMPOSITION', text: `If f(x) = ${lin(a, b)} and g(x) = ${lin(c, e)}, which is f(g(x))?`,
        ...textual(right, [lin(a * c, c * b + e), lin(a + c, b + e), lin(a * c, b * e), lin(a * c, a * e - b), px([a * c, a * e + b * c, b * e])]),
        steps: ['f(g(x)): put all of g(x) in for x in f.', `f(${lin(c, e)}) = ${a}(${lin(c, e)}) ${signed(b)}`, `= ${lin(a * c, a * e)} ${signed(b)} = ${right}`],
      };
    }
    const c = nz(-6, 6), right = px([a, 0, a * c + b]);
    return {
      topic: 'COMPOSITION', text: `If f(x) = ${lin(a, b)} and g(x) = ${px([1, 0, c])}, which is f(g(x))?`,
      ...textual(right, [px([a * a, 2 * a * b, b * b + c]), px([a, 0, c + b]), px([a, b, c]), px([a, 0, a * c - b]), px([1, a, b + c])]),
      steps: [`f(g(x)) = ${a}(${px([1, 0, c])}) ${signed(b)}`, `= ${px([a, 0, a * c])} ${signed(b)}`, `= ${right}`],
    };
  };

  // F.LE.1, F.LE.2, F.LE.5, A.SSE.1b, F.IF.8b: exponential growth and decay.
  const GROW = [['the followers of a skate channel', 'month'], ['the bacteria in a dish', 'hour'], ["a town's population", 'year'], ['the value of a rare trading card', 'year']];
  const DECAY = [['the value of a used car', 'year'], ['the medicine left in the blood', 'hour'], ['the ice left in a cooler', 'hour'], ['the value of a game console', 'year']];
  kinds.expModel = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 3);
    if (f === 3) {
      const lin0 = rand() < .5, a = randInt(2, 6), m = randInt(2, 5);
      const vals = [0, 1, 2, 3].map(x => lin0 ? a + m * x : a * m ** x);
      const right = lin0 ? `Linear: adds ${m} each time` : `Exponential: times ${m} each time`;
      return {
        topic: 'EXPONENTIAL', text: `For x = 0, 1, 2 and 3, a function takes the values ${vals.join(', ')}. Which describes it?`,
        ...textual(right, [`Linear: adds ${m} each time`, `Exponential: times ${m} each time`, `Linear: adds ${a} each time`, `Exponential: times ${a} each time`, `Exponential: times ${vals[1] - vals[0]} each time`, `Linear: adds ${vals[2] - vals[1]} each time`, `Exponential: times ${m + 1} each time`, `Linear: adds ${m + 1} each time`].filter(s => s !== right)),
        steps: lin0 ? [`Differences: ${vals[1] - vals[0]}, ${vals[2] - vals[1]}, ${vals[3] - vals[2]}. All the same.`, 'Equal differences make it linear.'] : [`Ratios: ${vals[1]}/${vals[0]} = ${vals[2]}/${vals[1]} = ${m}`, 'Equal ratios make it exponential.'],
      };
    }
    const grow = rand() < .5, r = pick(grow ? [2, 3, 4, 5, 6, 8, 12, 15] : [3, 5, 8, 10, 15, 20, 25]), fac = r2(grow ? 1 + r / 100 : 1 - r / 100);
    const [what, unit] = pick(grow ? GROW : DECAY), A = pick([500, 800, 1200, 2000, 5000, 1500, 3000]);
    if (f === 0) {
      const right = `${grow ? 'Grows' : 'Shrinks'} ${r}% each ${unit}`;
      return {
        topic: 'EXPONENTIAL', text: `The function y = ${cm(A)}(${fac})^t models ${what} t ${unit}s from now. What does the ${fac} tell you?`,
        ...textual(right, [`${grow ? 'Grows' : 'Shrinks'} ${grow ? 100 + r : 100 - r}% each ${unit}`, `${grow ? 'Shrinks' : 'Grows'} ${r}% each ${unit}`, `${grow ? 'Grows' : 'Shrinks'} by ${fac} each ${unit}`, `Starts at ${fac}`]),
        steps: [`Each ${unit}, y is multiplied by ${fac}.`, grow ? `${fac} = 1 + ${r / 100}: keep all of it, plus ${r}% more.` : `${fac} = 1 - ${r / 100}: ${r}% is lost each ${unit}.`, right],
      };
    }
    if (f === 1) {
      const P = v => `y = ${cm(A)}(${v})^t`, right = P(fac);
      return {
        topic: 'EXPONENTIAL', text: `${what[0].toUpperCase() + what.slice(1)}: ${cm(A)} now, ${grow ? 'growing' : 'shrinking'} by ${r}% each ${unit}. Which models it after t ${unit}s?`,
        ...textual(right, [P(r2(r / 100)), P(r2(grow ? 1 - r / 100 : 1 + r / 100)), `y = ${cm(A)} ${grow ? '+' : '-'} ${r / 100}t`, `y = ${cm(A)}(${r})^t`, P(r2(1 + (grow ? r : -r) / 10))]),
        steps: [grow ? `Growing ${r}% means multiplying by 1 + ${r / 100} = ${fac}.` : `Losing ${r}% leaves 100% - ${r}% = ${100 - r}%, a factor of ${fac}.`, `Start × factor^t: ${right}`],
      };
    }
    const OPTS = [[2, 1.5], [3, 1.5], [2, 1.1], [3, 1.1], [2, 1.2], [2, .5], [3, .5], [4, .5], [2, .75], [3, .75], [2, .8], [2, .9]];
    let n, k, B, val, tries = 0;
    do { [n, k] = pick(OPTS); B = randInt(2, 40) * 100; val = B * k ** n; } while (Math.abs(val - Math.round(val)) > 1e-6 && ++tries < 60);
    if (tries >= 60) { n = 2; k = .5; B = 800; val = 200; }
    val = Math.round(val);
    const pc = Math.round(Math.abs(k - 1) * 100), up = k > 1, money = rand() < .5, kn = +(k ** n).toFixed(6);
    const fmt = v => (money ? '$' : '') + cm(v);
    return {
      topic: 'EXPONENTIAL', text: money
        ? `${up ? 'A rare pair of sneakers' : 'A video game console'} is worth ${fmt(B)} and ${up ? 'gains' : 'loses'} ${pc}% of its value each year. What is it worth after ${n} years?`
        : `A ${up ? 'skate channel has' : 'mall gets'} ${fmt(B)} ${up ? 'followers' : 'shoppers a day'}, a number that ${up ? 'grows' : 'drops'} ${pc}% each year. How many after ${n} years?`,
      ...numeric(val, [B + (up ? 1 : -1) * n * B * pc / 100, B * k ** (n - 1), Math.round(B * (pc / 100) ** n), B * k * n], fmt),
      steps: [`${up ? 'Gaining' : 'Losing'} ${pc}% means multiplying by ${k} each year.`, `${fmt(B)} × ${k}^${n} = ${fmt(B)} × ${kn}`, `= ${fmt(val)}`],
    };
  };

  // F.IF.3, F.BF.2, F.LE.2: arithmetic and geometric sequences.
  kinds.sequences = d => {
    const f = d < 2 ? pick([0, 1]) : d < 3 ? randInt(0, 2) : randInt(0, 3);
    if (f === 0 || f === 2) {
      const a1 = nz(-9, 12), dl = nz(-6, 8), terms = [0, 1, 2, 3].map(i => a1 + i * dl).join(', ');
      if (f === 2) {
        const right = `f(n) = ${lin(dl, a1 - dl, 'n')}`, L = (m, b) => `f(n) = ${lin(m, b, 'n')}`;
        return {
          topic: 'SEQUENCES', text: `Which gives the nth term of the sequence ${terms}, ...?`,
          ...textual(right, [L(dl, a1), L(a1, dl), L(dl, a1 + dl), L(1, dl), L(a1, -dl)].filter(s => s !== right)),
          steps: [`Each term adds ${dl}, so f(n) = ${dl}n + b.`, `For n = 1: ${dl} + b = ${a1}, so b = ${a1 - dl}.`, right],
        };
      }
      const n = randInt(10, d < 2 ? 30 : 60), ans = a1 + (n - 1) * dl;
      return {
        topic: 'SEQUENCES', text: `What is term number ${n} of the arithmetic sequence ${terms}, ...?`,
        ...numeric(ans, [a1 + n * dl, n * dl, a1 * n, ans + a1]),
        steps: [`Start at ${a1} and add ${dl} a total of ${n} - 1 = ${n - 1} times.`, `${a1} + ${n - 1}(${dl})`, `= ${ans}`],
      };
    }
    if (f === 3) {
      const a = randInt(1, 5), m = randInt(2, 3), b = nz(-3, 3), s = [a];
      for (let i = 1; i < 5; i++) s.push(m * s[i - 1] + b);
      return {
        topic: 'SEQUENCES', text: `If f(1) = ${a} and f(n) = ${m}f(n - 1) ${signed(b)} for n ≥ 2, what is f(4)?`,
        ...numeric(s[3], [s[2], s[4], m * 4 + b, a * m ** 3, s[3] + b]),
        steps: [`f(2) = ${m}(${a}) ${signed(b)} = ${s[1]}`, `f(3) = ${m}(${s[1]}) ${signed(b)} = ${s[2]}`, `f(4) = ${m}(${s[2]}) ${signed(b)} = ${s[3]}`],
      };
    }
    const a = randInt(1, 5), r = d >= 3 && rand() < .3 ? -2 : pick([2, 3]), n = Math.abs(r) === 3 ? randInt(5, 6) : randInt(6, 8), ans = a * r ** (n - 1);
    if (d >= 2 && rand() < .4) {
      const G = (p, q, e) => `f(n) = ${p}(${q})^{${e}}`, right = G(a, r, 'n-1');
      return {
        topic: 'SEQUENCES', text: `Which gives the nth term of the sequence ${[0, 1, 2, 3].map(i => a * r ** i).join(', ')}, ...?`,
        ...textual(right, [G(r, a, 'n-1'), G(a, r, 'n'), `f(n) = ${a} + ${r}(n - 1)`, `f(n) = ${a * r}^{n-1}`, G(a, r, 'n+1')]),
        steps: [`Each term is ${r} times the one before.`, `The first term is ${a}, so f(n) = ${a}(${r})^{n-1}.`],
      };
    }
    return {
      topic: 'SEQUENCES', text: `What is term number ${n} of the geometric sequence ${[0, 1, 2, 3].map(i => a * r ** i).join(', ')}, ...?`,
      ...numeric(ans, [a * r ** n, a * r ** (n - 2), a * r * n, a + r * (n - 1)], cm),
      steps: [`Each term multiplies by ${r}.`, `Term ${n} is ${a} × (${r})^${n - 1}`, `= ${cm(ans)}`],
    };
  };

  // ---- Geometry

  const pif = v => { const s = show(v); if (s === '1') return 'π'; if (!s.includes('/')) return cm(s) + 'π'; const [n, q] = s.split('/'); return (n === '1' ? '' : cm(n)) + 'π/' + q; };
  // n little marks across the middle of side PQ (congruent sides).
  function ticks(c, P, Q, n, col = HOT) {
    const len = Math.hypot(Q[0] - P[0], Q[1] - P[1]), ux = (Q[0] - P[0]) / len, uy = (Q[1] - P[1]) / len, mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2;
    for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 3, x = mx + ux * o, y = my + uy * o; F.line(c, x - uy * 3, y + ux * 3, x + uy * 3, y - ux * 3, col); }
  }
  // An angle mark at V, between the rays to P and Q, the short way round.
  function angMark(c, V, P, Q, r, col = HOT) {
    const a = Math.atan2(V[1] - P[1], P[0] - V[0]); let b = Math.atan2(V[1] - Q[1], Q[0] - V[0]) - a;
    while (b > Math.PI) b -= 2 * Math.PI; while (b < -Math.PI) b += 2 * Math.PI;
    F.arc(c, V[0], V[1], r, a, a + b, col);
  }
  function ellipse(c, cx, cy, rx, ry, col, backDash = false) {
    c.fillStyle = col;
    const n = Math.ceil((rx + ry) * 4);
    for (let i = 0; i < n; i++) {
      const t = i / n * 2 * Math.PI, back = Math.sin(t) < 0;
      if (backDash && back && i % 4 > 1) continue;
      c.fillRect(Math.round(cx + Math.cos(t) * rx), Math.round(cy + Math.sin(t) * ry), 1, 1);
    }
  }

  // G.CO.7, G.CO.8, G.SRT.5: triangle congruence criteria.
  const CRIT = {
    SSS: [[[0, 1], [1, 2], [2, 3]], [], 'All three pairs of sides match.'],
    SAS: [[[0, 1], [2, 2]], [[0, 1]], 'Two sides and the angle between them match.'],
    ASA: [[[0, 1]], [[0, 1], [1, 2]], 'Two angles and the side between them match.'],
    AAS: [[[1, 1]], [[0, 1], [1, 2]], 'Two angles and a side not between them match.'],
    HL: [[[1, 1], [0, 2]], [], 'Right triangles: the hypotenuses and one pair of legs match.'],
    SSA: [[[0, 1], [1, 2]], [[0, 1]], "Two sides and an angle NOT between them (SSA) don't prove it."],
    AAA: [[], [[0, 1], [1, 2], [2, 3]], 'Matching angles only make the triangles similar.'],
  };
  kinds.congruence = d => {
    const key = pick(d < 3 ? ['SSS', 'SAS', 'ASA', 'AAS', 'HL'] : ['SSS', 'SAS', 'ASA', 'AAS', 'HL', 'SSA', 'AAA']), [sides, angs, why] = CRIT[key];
    const right = key === 'SSA' || key === 'AAA' ? 'Not enough info' : key;
    return {
      topic: 'CONGRUENCE', text: 'Matching marks show congruent parts. Which reason proves the two triangles congruent?', size: [150, 60],
      ...textual(right, shuffle(['SSS', 'SAS', 'ASA', 'AAS', 'HL', 'Not enough info'].filter(s => s !== right))),
      steps: [why, right === 'Not enough info' ? 'So the marks are not enough to prove congruence.' : `That is ${key}.`],
      fig: (c, w, h) => {
        const T = key === 'HL' ? [[8, h - 7], [64, h - 7], [8, 7]] : [[6, h - 7], [66, h - 7], [22, 7]];
        for (const mir of [false, true]) {
          const V = T.map(([x, y]) => [mir ? w - 1 - x : x, y]);
          F.outlinePoly(c, V, INK);
          const S = [[V[0], V[1]], [V[1], V[2]], [V[2], V[0]]];
          for (const [i, n] of sides) ticks(c, ...S[i], n);
          for (const [i, n] of angs) for (let k = 0; k < n; k++) angMark(c, V[i], V[(i + 1) % 3], V[(i + 2) % 3], 7 + 3 * k);
          if (key === 'HL') F.rightMark(c, V[0][0], V[0][1], mir ? -1 : 1, -1, HOT);
        }
      },
    };
  };

  // G.SRT.1, G.SRT.2, G.SRT.5: similarity and dilations.
  kinds.similarity = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 2);
    if (f === 0) {
      const n = who(), h1 = pick([5, 6]), s1 = pick([2, 4]), k = randInt(2, 6), s2 = s1 * k + (rand() < .5 ? s1 / 2 : 0), H = h1 * s2 / s1;
      const thing = pick(['streetlight', 'basketball hoop', 'flagpole', 'billboard', 'palm tree']);
      return {
        topic: 'SIMILARITY', text: `${n} is ${h1} feet tall and casts a ${s1}-foot shadow. At the same time, a ${thing} casts ${an(s2)}-foot shadow. How tall is the ${thing}?`,
        ...numeric(H, [h1 + s2 - s1, s2, s1 * s2 / h1, H + h1, s2 * h1], v => show(v) + ' ft'),
        steps: ['The sun makes similar triangles: height/shadow matches.', `${h1}/${s1} = x/${s2}`, `x = ${h1} × ${s2} / ${s1} = ${show(H)} feet`],
      };
    }
    if (f === 2) {
      let a, b; do { a = nz(-5, 5); b = nz(-5, 5); } while (a === b || a === -b);
      const k = pick([2, 3, 4, 1 / 2]), centered = d >= 3 && rand() < .5;
      if (centered && k !== 1 / 2) {
        const p = nz(-3, 3), q = nz(-3, 3), X = p + k * (a - p), Y = q + k * (b - q);
        return {
          topic: 'SIMILARITY', text: `Point P(${a}, ${b}) is dilated by a scale factor of ${k} with center (${p}, ${q}). What is the image of P?`,
          ...textual(pt(X, Y), [pt(k * a, k * b), pt(a + k, b + k), pt(p + k * (a + p), q + k * (b + q)), pt(X, k * b), pt(Y, X)]),
          steps: [`From the center to P: (${a} - ${p < 0 ? '(' + p + ')' : p}, ${b} - ${q < 0 ? '(' + q + ')' : q}) = (${a - p}, ${b - q})`, `Times ${k}: (${k * (a - p)}, ${k * (b - q)})`, `Add to the center: ${pt(X, Y)}`],
        };
      }
      const A = k === 1 / 2 ? 2 * a : a, B = k === 1 / 2 ? 2 * b : b, ks = show(k);
      return {
        topic: 'SIMILARITY', text: `Point P(${A}, ${B}) is dilated by a scale factor of ${ks}, centered at the origin. What is the image of P?`,
        ...textual(pt(k * A, k * B), [pt(A + k, B + k), pt(k * A, B), pt(k * B, k * A), pt(A / k, B / k), pt(-k * A, -k * B)].filter(s => !s.includes('.'))),
        steps: [`Centered at the origin: multiply both coordinates by ${ks}.`, `(${ks} × ${A}, ${ks} × ${B}) = ${pt(k * A, k * B)}`],
      };
    }
    const k = pick([2, 3, 1.5, 2.5]), whole = Number.isInteger(k), p = whole ? randInt(2, 6) : 2 * randInt(1, 3), q = whole ? randInt(2, 7) : 2 * randInt(1, 4), P2 = k * p, Q2 = k * q;
    return {
      topic: 'SIMILARITY', text: 'The two triangles are similar, with matching sides in the same places. What is x?', size: [150, 64],
      ...numeric(Q2, [q + P2 - p, P2, p * q / P2, Q2 + 1, Q2 - p]),
      steps: [`Scale factor: ${P2} / ${p} = ${show(k)}`, `x = ${q} × ${show(k)} = ${Q2}`],
      fig: (c, w, h) => {
        const draw = (x0, s, base, left) => {
          const A = [x0, h - 10], B = [x0 + 30 * s, h - 10], C = [x0 + 9 * s, h - 10 - 22 * s];
          F.outlinePoly(c, [A, B, C], INK);
          F.label(c, base, (A[0] + B[0]) / 2, h - 3, base === 'x' ? HOT : INK);
          F.label(c, left, (A[0] + C[0]) / 2 - 7, (A[1] + C[1]) / 2, left === 'x' ? HOT : INK);
        };
        const s2 = 2.2, s1 = s2 / k;
        draw(14, s1, String(p), String(q));
        draw(w - 8 - 30 * s2, s2, String(P2), 'x');
      },
    };
  };

  // G.CO.2, G.CO.4, G.CO.5: rigid motions on the coordinate plane.
  const MOTIONS = [
    ['reflected across the x-axis', 'Reflect over x-axis', (a, b) => [a, -b], '(x, y) becomes (x, -y).'],
    ['reflected across the y-axis', 'Reflect over y-axis', (a, b) => [-a, b], '(x, y) becomes (-x, y).'],
    ['reflected across the line y = x', 'Reflect over y = x', (a, b) => [b, a], '(x, y) becomes (y, x).'],
    ['rotated 90° counterclockwise about the origin', 'Rotate 90° counterclockwise', (a, b) => [-b, a], '(x, y) becomes (-y, x).'],
    ['rotated 180° about the origin', 'Rotate 180°', (a, b) => [-a, -b], '(x, y) becomes (-x, -y).'],
    ['rotated 90° clockwise about the origin', 'Rotate 90° clockwise', (a, b) => [b, -a], '(x, y) becomes (y, -x).'],
  ];
  kinds.rigidMotion = d => {
    let a, b; do { a = nz(-8, 8); b = nz(-8, 8); } while (a === b || a === -b);
    const set = d < 2 ? MOTIONS.slice(0, 2).concat([MOTIONS[4]]) : MOTIONS, m = pick(set), img = m[2](a, b);
    if (d >= 3 && rand() < .4) {
      return {
        topic: 'TRANSFORMATION', text: `A transformation takes P(${a}, ${b}) to P'(${img[0]}, ${img[1]}). Which transformation is it?`,
        ...textual(m[1], shuffle(MOTIONS.filter(o => o !== m).map(o => o[1]))),
        steps: [m[3], `(${a}, ${b}) becomes (${img[0]}, ${img[1]}).`, `So it is: ${m[1].toLowerCase()}.`],
      };
    }
    if (d >= 2 && rand() < .25) {
      const h = nz(-6, 6), k = nz(-6, 6);
      return {
        topic: 'TRANSFORMATION', text: `Point P(${a}, ${b}) is translated by the rule (x, y) → (x ${signed(h)}, y ${signed(k)}). What is the image of P?`,
        ...textual(pt(a + h, b + k), [pt(a - h, b - k), pt(a + k, b + h), pt(a + h, b - k), pt(h, k), pt(a - h, b + k)]),
        steps: [`Add ${h} to x: ${a} ${signed(h)} = ${a + h}`, `Add ${k} to y: ${b} ${signed(k)} = ${b + k}`, `Image: ${pt(a + h, b + k)}`],
      };
    }
    return {
      topic: 'TRANSFORMATION', text: `Point P(${a}, ${b}) is ${m[0]}. What are the coordinates of its image?`,
      ...textual(pt(...img), shuffle(MOTIONS.filter(o => o !== m).map(o => pt(...o[2](a, b))))),
      steps: [`Being ${m[0]}:`, m[3], `So (${a}, ${b}) becomes ${pt(...img)}.`],
    };
  };

  // G.SRT.6, G.SRT.8: special right triangles.
  kinds.specialRight = d => {
    const s = randInt(2, 9), A = `${s}√2`, B3 = `${s}√3`;
    const CASES = [
      ['45', 'long', String(s), 'hyp', A, [String(2 * s), `${s}√3`, String(s), `${2 * s}√2`], [`In a 45-45-90 triangle, hypotenuse = leg × √2.`, `x = ${s}√2`]],
      ['45', 'hyp', A, 'long', String(s), [String(2 * s), `${s}√3`, `${2 * s}√2`, show(s / 2)], ['In a 45-45-90 triangle, leg = hypotenuse ÷ √2.', `${s}√2 ÷ √2 = ${s}`]],
      ['45', 'hyp', String(2 * s), 'long', A, [String(s), `${2 * s}√2`, `${s}√3`, String(2 * s)], ['In a 45-45-90 triangle, leg = hypotenuse ÷ √2.', `${2 * s} ÷ √2 = ${2 * s}√2/2 = ${s}√2`]],
      ['30', 'short', String(s), 'hyp', String(2 * s), [B3, `${s}√2`, `${2 * s}√3`, String(3 * s)], ['In a 30-60-90 triangle, hypotenuse = 2 × short leg.', `x = 2 × ${s} = ${2 * s}`]],
      ['30', 'short', String(s), 'long', B3, [String(2 * s), `${s}√2`, String(3 * s), `${2 * s}√3`], ['In a 30-60-90 triangle, long leg = short leg × √3.', `x = ${s}√3`]],
      ['30', 'hyp', String(2 * s), 'short', String(s), [B3, String(4 * s), `${2 * s}√3`, `${s}√2`], ['The short leg (across from 30°) is half the hypotenuse.', `x = ${2 * s} ÷ 2 = ${s}`]],
      ['30', 'long', B3, 'short', String(s), [String(3 * s), String(2 * s), `${s}√2`, `${3 * s}√3`], ['Long leg = short leg × √3.', `${s}√3 = x√3, so x = ${s}`]],
      ['30', 'hyp', String(2 * s), 'long', B3, [`${2 * s}√3`, String(s), `${s}√2`, String(4 * s)], ['Short leg = half the hypotenuse = ' + s + '.', `Long leg = short leg × √3 = ${s}√3`]],
    ];
    const [type, gSide, gLab, aSide, right, wrongs, steps] = pick(d < 2 ? CASES.filter((_, i) => [0, 3, 4].includes(i)) : CASES);
    return {
      topic: 'RIGHT TRIANGLE', text: 'In the right triangle shown, what is the value of x?', size: [124, 70],
      ...textual(right, wrongs), steps,
      fig: (c, w, h) => {
        const lenL = type === '45' ? 56 : 96, lenS = type === '45' ? 56 : Math.round(96 / Math.sqrt(3));
        const R = [14, h - 10], E = [14 + lenL, h - 10], T = [14, h - 10 - lenS];
        F.outlinePoly(c, [R, E, T], INK);
        F.rightMark(c, R[0], R[1], 1, -1);
        const lab = { long: [(R[0] + E[0]) / 2, h - 3], short: [7, (R[1] + T[1]) / 2], hyp: [(E[0] + T[0]) / 2 + 8, (E[1] + T[1]) / 2 - 6] };
        const put = (side, s, col) => F.label(c, s, ...lab[side], col);
        put(gSide, gLab, INK); put(aSide, 'x', HOT);
        F.label(c, type === '45' ? '45°' : '30°', E[0] - 15, E[1] - 5, DIM);
        F.label(c, type === '45' ? '45°' : '60°', T[0] + 8, T[1] + 14, DIM);
      },
    };
  };

  // G.SRT.6, G.SRT.7, G.SRT.8: trig ratios and solving right triangles.
  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  kinds.trigSolve = d => {
    const f = d < 2 ? pick([0, 0, 1]) : randInt(0, 2);
    if (f === 1) {
      const [p, q, r] = pick(TRIPLES), [g, a] = pick([['sin', 'cos'], ['cos', 'sin'], ['sin', 'tan'], ['cos', 'tan']]);
      const val = { sin: [p, r], cos: [q, r], tan: [p, q] }, want = fr(...val[a]);
      return {
        topic: 'TRIGONOMETRY', text: `In a right triangle, angle A is acute and ${g} A = ${fr(...val[g])}. What is ${a} A?`,
        ...textual(want, [fr(q, p), fr(r, p), fr(r, q), fr(p, r), fr(q, r), fr(p, q)].filter(s => s !== want && s !== fr(...val[g]))),
        steps: [`Draw it: ${g} A = ${fr(...val[g])} gives two sides; the third comes from a^2 + b^2 = c^2.`, `Opposite ${p}, adjacent ${q}, hypotenuse ${r}.`, `${a} A = ${a === 'sin' ? 'opp/hyp' : a === 'cos' ? 'adj/hyp' : 'opp/adj'} = ${want}`],
      };
    }
    if (f === 2) {
      const t = randInt(12, 78);
      if (rand() < .5) {
        return {
          topic: 'TRIGONOMETRY', text: `If sin x° = cos ${t}°, and 0 < x < 90, what is the value of x?`,
          ...numeric(90 - t, [t, 180 - t, 360 - t, 90 + t]),
          steps: ['The sine of an angle is the cosine of its complement.', `So x + ${t} = 90.`, `x = ${90 - t}`],
        };
      }
      const [p, , r] = pick(TRIPLES), v = fr(p, r);
      return {
        topic: 'TRIGONOMETRY', text: `In right triangle ABC, angle C is 90° and sin A = ${v}. What is cos B?`,
        ...textual(v, [fr(r, p), fr(Math.sqrt(r * r - p * p), r), fr(p, Math.sqrt(r * r - p * p)), fr(Math.sqrt(r * r - p * p), p)].filter(s => s !== v)),
        steps: ['A and B add up to 90°: they are complements.', 'The side opposite A is the side next to B.', `So cos B = sin A = ${v}`],
      };
    }
    const th = pick([20, 25, 30, 35, 40, 50, 55]), S = r2(Math.sin(th * DEG)), C = r2(Math.cos(th * DEG)), T = r2(Math.tan(th * DEG));
    const n = randInt(4, 30), mode = randInt(0, 3);
    // [known side, unknown side, ratio name, ratio value, x]
    const M = [['hyp', 'opp', 'sin', S, n * S], ['hyp', 'adj', 'cos', C, n * C], ['adj', 'opp', 'tan', T, n * T], ['opp', 'hyp', 'sin', S, n / S]][mode];
    const ans = r1(M[4]), wr = [n * S, n * C, n * T, n / S, n / C, n / T].map(r1);
    const fmt = v => v.toFixed(1);
    return {
      topic: 'TRIGONOMETRY', text: `Use ${M[2]} ${th}° = ${M[3].toFixed(2)} (rounded). In the triangle shown, what is x, to the nearest tenth?`, size: [120, 64],
      ...numeric(ans, wr.filter(v => v > 0), fmt),
      steps: [`From the ${th}° angle, x is ${({ opp: 'opposite', adj: 'adjacent', hyp: 'the hypotenuse' })[M[1]]}; ${n} is ${({ opp: 'opposite', adj: 'adjacent', hyp: 'the hypotenuse' })[M[0]]}.`,
        mode === 3 ? `sin ${th}° = ${n}/x, so x = ${n} / ${M[3].toFixed(2)}` : `${M[2]} ${th}° = x/${n}, so x = ${n} × ${M[3].toFixed(2)}`, `x is about ${fmt(ans)}`],
      fig: (c, w, h) => {
        const t = Math.tan(th * DEG), L = Math.min(w - 30, (h - 16) / t), A = [8, h - 10], B = [8 + L, h - 10], Cc = [8 + L, h - 10 - L * t];
        F.outlinePoly(c, [A, B, Cc], INK);
        F.rightMark(c, B[0], B[1], -1, -1);
        F.label(c, th + '°', A[0] + 16, A[1] - 4, DIM);
        const pos = { adj: [(A[0] + B[0]) / 2, h - 3], opp: [B[0] + 9, (B[1] + Cc[1]) / 2], hyp: [(A[0] + Cc[0]) / 2 - 7, (A[1] + Cc[1]) / 2 - 5] };
        F.label(c, String(n), ...pos[M[0]]); F.label(c, 'x', ...pos[M[1]], HOT);
      },
    };
  };

  // G.C.5: arc length and sector area.
  const ANG = [30, 40, 45, 60, 72, 90, 120, 135, 150, 180, 240, 270, 300];
  kinds.circleArc = d => {
    if (d >= 2 && rand() < .3) {
      const D = pick([8, 10, 12, 14, 16, 18, 20]), n = pick([4, 6, 8]), r = D / 2, A = r * r / n;
      return {
        topic: 'CIRCLES', text: `${An(D)}-inch pizza is cut into ${n} equal slices. What is the area of one slice, in square inches?`,
        ...numeric(A, [D * D / n, 2 * r / n, r * r, D / n, 2 * A], pif),
        steps: [`The radius is half of ${D}: ${r} inches.`, `The whole pizza: π × ${r}^2 = ${r * r}π`, `One slice: ${r * r}π / ${n} = ${pif(A)}`],
      };
    }
    const th = pick(ANG), r = randInt(2, 12), area = rand() < .5, k = th / 360, ans = area ? k * r * r : k * 2 * r;
    const wr = area ? [k * 2 * r, r * r, th / 180 * r * r, k * 4 * r * r, ans * 2] : [k * r * r, 2 * r, th / 180 * 2 * r, k * r, k * 4 * r];
    return {
      topic: 'CIRCLES', text: `The circle has radius ${r}, and the shaded sector has a central angle of ${th}°. What is the ${area ? 'area of the sector' : 'length of its arc'}?`, size: [80, 72],
      ...numeric(ans, wr, pif),
      steps: [`The sector is ${th}/360 = ${show(k)} of the circle.`, area ? `Whole area: π × ${r}^2 = ${r * r}π` : `Whole circumference: 2π × ${r} = ${2 * r}π`, `${show(k)} × ${area ? r * r : 2 * r}π = ${pif(ans)}`],
      fig: (c, w, h) => {
        const R = Math.min(w, h) / 2 - 5, cx = Math.round(w / 2), cy = Math.round(h / 2), a1 = th * DEG;
        c.fillStyle = '#2a3a78';
        for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
          if (x * x + y * y > R * R) continue;
          let a = Math.atan2(-y, x); if (a < 0) a += 2 * Math.PI;
          if (a <= a1) c.fillRect(cx + x, cy + y, 1, 1);
        }
        F.circle(c, cx, cy, R, INK);
        F.arc(c, cx, cy, R, 0, a1, HOT);
        F.line(c, cx, cy, cx + R, cy, HOT); F.line(c, cx, cy, cx + Math.cos(a1) * R, cy - Math.sin(a1) * R, HOT);
        const m = a1 / 2;
        F.label(c, th + '°', cx + Math.cos(m) * R * .5, cy - Math.sin(m) * R * .5);
        F.label(c, String(r), cx + R / 2, cy + 6);
      },
    };
  };

  // G.C.2, G.C.3: central angles, inscribed angles, cyclic quadrilaterals.
  kinds.inscribed = d => {
    const f = d < 2 ? pick([0, 1]) : d < 3 ? randInt(0, 2) : randInt(0, 3);
    if (f === 3) {
      const A = randInt(55, 125), B = randInt(55, 125);
      return {
        topic: 'CIRCLES', text: `Quadrilateral ABCD is inscribed in a circle. Angle A is ${A}° and angle B is ${B}°. What is angle C?`,
        ...numeric(180 - A, [A, 180 - B, 360 - A - B, B, 90 - A / 2].filter(v => v > 0), v => v + '°'),
        steps: ['In a quadrilateral inscribed in a circle, opposite angles add to 180°.', `A and C are opposite: C = 180 - ${A} = ${180 - A}°`],
      };
    }
    const semi = f === 2, th = semi ? 90 : randInt(20, 75), cen = 2 * th, given = semi ? randInt(20, 70) : 0;
    const steps = semi ? ['An angle inscribed in a semicircle is 90°: angle C = 90°.', `The angles add to 180°: x = 180 - 90 - ${given}`, `x = ${90 - given}`]
      : f === 0 ? ['An inscribed angle is half the central angle on the same arc.', `x = ${cen} ÷ 2 = ${th}`] : ['The central angle is twice the inscribed angle on the same arc.', `x = 2 × ${th} = ${cen}`];
    const ans = semi ? 90 - given : f === 0 ? th : cen;
    return {
      topic: 'CIRCLES', text: semi ? `AB is a diameter of the circle with center O. Angle A is ${given}°. What is x?` : 'Point O is the center of the circle. What is the value of x?', size: [90, 80],
      ...numeric(ans, (semi ? [given, 180 - given, 90 + given, 2 * given] : f === 0 ? [cen, 2 * cen, 180 - cen, 90 - th, 360 - cen] : [th, th / 2, 180 - th, 360 - cen, 180 - cen]).filter(v => v > 0)),
      steps,
      fig: (c, w, h) => {
        const R = Math.min(w, h) / 2 - 9, cx = Math.round(w / 2), cy = Math.round(h / 2) + 1;
        const P = a => [cx + Math.cos(a * DEG) * R, cy - Math.sin(a * DEG) * R];
        const aA = semi ? 180 : -90 - th, aB = semi ? 0 : -90 + th, aC = semi ? 180 - 2 * (90 - given) : 90;
        const A = P(aA), B = P(aB), C = P(aC);
        F.circle(c, cx, cy, R, INK);
        F.line(c, ...C, ...A, INK); F.line(c, ...C, ...B, INK);
        if (semi) F.line(c, ...A, ...B, DIM);
        else { F.line(c, cx, cy, ...A, BLU); F.line(c, cx, cy, ...B, BLU); }
        F.dot(c, [cx, cy], HOT);
        const L = (a, s) => F.label(c, s, cx + Math.cos(a * DEG) * (R + 5), cy - Math.sin(a * DEG) * (R + 5), DIM);
        L(aA, 'A'); L(aB, 'B'); L(aC, 'C');
        F.label(c, 'O', cx, cy - 6, DIM);
        if (semi) {
          F.label(c, given + '°', A[0] + 15, A[1] - 5);
          F.label(c, 'x°', B[0] - 12, B[1] - 5, HOT);
        } else {
          F.label(c, (f === 0 ? cen + '°' : 'x°'), cx, cy + 8, f === 0 ? INK : HOT);
          F.label(c, (f === 0 ? 'x°' : th + '°'), C[0], C[1] + 11, f === 0 ? HOT : INK);
        }
      },
    };
  };

  // G.GPE.1: the equation of a circle.
  kinds.circleEq = d => {
    const f = d < 2 ? pick([0, 1]) : d < 3 ? randInt(0, 2) : pick([1, 2, 2, 3]);
    let h, k; do { h = nz(-8, 8); k = nz(-8, 8); } while (h === k || h === -k);
    const r = randInt(2, 9), X = v => `(x ${signed(-v)})^2`, Y = v => `(y ${signed(-v)})^2`, eq = `${X(h)} + ${Y(k)} = ${r * r}`;
    if (f === 0) {
      return {
        topic: 'CIRCLES', text: `What is the center of the circle ${eq}?`,
        ...textual(pt(h, k), [pt(-h, -k), pt(h, -k), pt(-h, k), pt(k, h)]),
        steps: ['(x - h)^2 + (y - k)^2 = r^2 has center (h, k).', `x ${signed(-h)} means h = ${h}; y ${signed(-k)} means k = ${k}.`, `Center ${pt(h, k)}`],
      };
    }
    if (f === 1) {
      return {
        topic: 'CIRCLES', text: `Which is an equation of the circle with center ${pt(h, k)} and radius ${r}?`,
        ...textual(eq, [`${X(-h)} + ${Y(-k)} = ${r * r}`, `${X(h)} + ${Y(k)} = ${r}`, `${X(-h)} + ${Y(-k)} = ${r}`, `${X(h)} + ${Y(k)} = ${2 * r}`]),
        steps: ['(x - h)^2 + (y - k)^2 = r^2', `h = ${h}, k = ${k}, r^2 = ${r * r}`, eq],
      };
    }
    if (f === 2) {
      return {
        topic: 'CIRCLES', text: `What is the radius of the circle ${eq}?`,
        ...numeric(r, [r * r, 2 * r, r * r / 2, Math.abs(h) + Math.abs(k)]),
        steps: ['The right side is r^2, not r.', `r^2 = ${r * r}, so r = ${r}`],
      };
    }
    const R0 = r * r - h * h - k * k, lhs = `x^2 + y^2 ${signed(-2 * h)}x ${signed(-2 * k)}y`;
    const askR = rand() < .5;
    return {
      topic: 'CIRCLES', text: `The equation ${lhs} = ${R0} defines a circle. What is its ${askR ? 'radius' : 'center'}?`,
      ...(askR ? numeric(r, [r * r, Math.abs(R0) || r + 2, Math.round(Math.sqrt(Math.abs(R0))) || r + 1, 2 * r]) : textual(pt(h, k), [pt(-h, -k), pt(2 * h, 2 * k), pt(-2 * h, -2 * k), pt(h, -k)])),
      steps: [`Complete the square: half of ${-2 * h} is ${-h}, half of ${-2 * k} is ${-k}.`, `${X(h)} + ${Y(k)} = ${R0} + ${h * h} + ${k * k} = ${r * r}`, askR ? `r = √${r * r} = ${r}` : `Center ${pt(h, k)}`],
    };
  };

  // G.GPE.4, G.GPE.6, G.GPE.7: distance, midpoint, partitioning a segment.
  kinds.distMid = d => {
    const f = d < 2 ? pick([0, 1]) : d < 3 ? randInt(0, 2) : randInt(0, 3);
    const x1 = randInt(-8, 6), y1 = randInt(-8, 6);
    if (f === 0) {
      let dx, dy, irr = d >= 3 && rand() < .5;
      if (irr) { do { dx = nz(-7, 7); dy = nz(-7, 7); } while (Number.isInteger(Math.hypot(dx, dy)) || Math.abs(dx) + Math.abs(dy) < 4); }
      else { const [p, q] = pick([[3, 4], [5, 12], [6, 8], [8, 15], [9, 12]]); [dx, dy] = (rand() < .5 ? [p, q] : [q, p]).map(v => v * (rand() < .5 ? -1 : 1)); }
      const s = dx * dx + dy * dy, right = rt(s), adx = Math.abs(dx), ady = Math.abs(dy);
      return {
        topic: 'COORDINATES', text: `What is the distance between (${x1}, ${y1}) and (${x1 + dx}, ${y1 + dy})?`,
        ...textual(right, [String(adx + ady), String(s), `√${adx + ady}`, adx !== ady ? rt(Math.abs(adx * adx - ady * ady)) : `√${s + 1}`, String(Math.max(adx, ady) + 1), rt(s + 2)].filter(v => v !== right)),
        steps: [`Across ${adx}, up or down ${ady}.`, `d = √(${adx}^2 + ${ady}^2) = √${s}`, `= ${right}`],
      };
    }
    const dx = 2 * nz(-6, 6), dy = 2 * nz(-6, 6), x2 = x1 + dx, y2 = y1 + dy, mx = x1 + dx / 2, my = y1 + dy / 2;
    if (f === 1) {
      return {
        topic: 'COORDINATES', text: `What is the midpoint of the segment from (${x1}, ${y1}) to (${x2}, ${y2})?`,
        ...textual(pt(mx, my), [pt(dx / 2, dy / 2), pt(x1 + x2, y1 + y2), pt(my, mx), pt(-dx / 2, -dy / 2), pt(mx + 1, my - 1), pt(mx - 1, my + 1), pt(dx, dy), pt(mx + 2, my)]),
        steps: ['Midpoint: average the x\'s and average the y\'s.', `x: (${x1} + ${x2 < 0 ? '(' + x2 + ')' : x2}) / 2 = ${mx}`, `y: (${y1} + ${y2 < 0 ? '(' + y2 + ')' : y2}) / 2 = ${my}`],
      };
    }
    if (f === 2) {
      return {
        topic: 'COORDINATES', text: `M(${mx}, ${my}) is the midpoint of segment AB, and A is (${x1}, ${y1}). What are the coordinates of B?`,
        ...textual(pt(x2, y2), [pt((x1 + mx) / 2, (y1 + my) / 2), pt(mx - x1, my - y1), pt(2 * x1 - mx, 2 * y1 - my), pt(x2, 2 * y1 - my)].filter(s => !s.includes('.'))
          .concat([pt(x2 + 1, y2), pt(x2, y2 - 1)])),
        steps: [`From A to M: x goes ${x1} → ${mx}, y goes ${y1} → ${my}.`, 'B is the same step again, past M.', `B = (${mx} ${signed(mx - x1)}, ${my} ${signed(my - y1)}) = ${pt(x2, y2)}`],
      };
    }
    const [m, n] = pick([[1, 2], [2, 1], [1, 3], [3, 1], [1, 4], [2, 3]]), t = m + n, ex = nz(-3, 3) * t, ey = nz(-3, 3) * t;
    const X = x1 + ex * m / t, Y = y1 + ey * m / t;
    return {
      topic: 'COORDINATES', text: `A is (${x1}, ${y1}) and B is (${x1 + ex}, ${y1 + ey}). Point P is on AB with AP : PB = ${m} : ${n}. What is P?`,
      ...textual(pt(X, Y), [pt(x1 + ex * n / t, y1 + ey * n / t), pt(x1 + ex / 2, y1 + ey / 2), pt(x1 + ex * m / n, y1 + ey * m / n), pt(ex * m / t, ey * m / t)].filter(s => !s.includes('.')).concat([pt(X + 1, Y + 1), pt(X - 1, Y), pt(X, Y - 1)])),
      steps: [`P is ${m}/${t} of the way from A to B.`, `x: ${x1} + ${m}/${t} × ${ex} = ${X}`, `y: ${y1} + ${m}/${t} × ${ey} = ${Y}`],
    };
  };

  // G.GPE.5: slopes of parallel and perpendicular lines.
  kinds.perpLines = d => {
    let p, q; do { p = nz(-6, 6); q = d < 2 ? 1 : randInt(1, 5); } while (gcd(p, q) !== 1);
    const m = p / q, b = nz(-8, 8), perp = rand() < .6;
    const co = v => { const s = show(v); return s === '1' ? '' : s === '-1' ? '-' : Number.isInteger(v) ? s : `(${s})`; };
    const L = (mm, bb) => `y = ${co(mm)}x${bb ? ' ' + signed(bb) : ''}`;
    if (d >= 3 && rand() < .4) {
      const x0 = nz(-4, 4) * q, y0 = randInt(-6, 6), bb = y0 - m * x0;
      return {
        topic: 'LINES', text: `Which line is parallel to ${L(m, b)} and passes through (${x0}, ${y0})?`,
        ...textual(L(m, bb), [L(m, b), L(m, -bb), L(m, y0), L(-1 / m, bb), L(m, bb + 1), L(m, bb - 1)]),
        steps: [`Parallel lines have the same slope: ${show(m)}`, `${y0} = ${show(m)}(${x0}) + b, so b = ${bb}`, L(m, bb)],
      };
    }
    const ans = perp ? -1 / m : m;
    return {
      topic: 'LINES', text: `Line k is ${perp ? 'perpendicular' : 'parallel'} to the line ${L(m, b)}. What is the slope of line k?`,
      ...numeric(ans, [-m, 1 / m, -1 / m, m, b]),
      steps: perp ? ['Perpendicular slopes are negative reciprocals.', `Flip ${show(m)} and change the sign: ${show(ans)}`] : ['Parallel lines have the same slope.', `So the slope is ${show(ans)}.`],
    };
  };

  // G.GMD.3, G.MG.1: volumes of cylinders, cones, spheres and pyramids.
  kinds.volume = d => {
    const solid = pick(d < 2 ? ['cyl', 'cyl', 'cone'] : ['cyl', 'cone', 'sphere', 'sphere', 'pyr']);
    const r = randInt(2, 9), hh = randInt(3, 12);
    const S = {
      cyl: [r * r * hh, [2 * r * hh, 4 * r * r * hh, r * hh, r * r * hh / 3], 'V = πr^2h', `π × ${r}^2 × ${hh} = ${r * r * hh}π`, 'cylinder'],
      cone: [r * r * hh / 3, [r * r * hh, r * hh / 3, 4 * r * r * hh / 3, r * hh * hh / 3], 'V = (1/3)πr^2h', `(1/3) × π × ${r}^2 × ${hh} = ${pif(r * r * hh / 3)}`, 'cone'],
      sphere: [4 * r ** 3 / 3, [4 * r * r, 4 * r * r / 3, 32 * r ** 3 / 3, r ** 3], 'V = (4/3)πr^3', `(4/3) × π × ${r}^3 = ${pif(4 * r ** 3 / 3)}`, 'sphere'],
    };
    if (solid === 'pyr') {
      const s = randInt(2, 10), H = randInt(3, 12), V = s * s * H / 3;
      return {
        topic: 'VOLUME', text: `A pyramid has a square base ${s} inches on a side and a height of ${H} inches. What is its volume, in cubic inches?`,
        ...numeric(V, [s * s * H, s * H / 3, 4 * s * H, s * s * H / 2], show),
        steps: ['V = (1/3) × base area × height', `Base area: ${s}^2 = ${s * s}`, `(1/3) × ${s * s} × ${H} = ${show(V)}`],
      };
    }
    const [V, wr, form, calc, name] = S[solid];
    return {
      topic: 'VOLUME', text: `What is the volume of the ${name}${solid === 'sphere' ? ` with radius ${r}` : ` with radius ${r} and height ${hh}`}?`, size: [76, 72],
      ...numeric(V, wr, pif), steps: [form, calc],
      fig: (c, w, h) => {
        const cx = Math.round(w / 2) - 4;
        if (solid === 'sphere') {
          const R = 28, cy = Math.round(h / 2);
          F.circle(c, cx, cy, R, INK); ellipse(c, cx, cy, R, 7, DIM, true);
          F.line(c, cx, cy, cx + R, cy, HOT); F.dot(c, [cx, cy], HOT); F.label(c, String(r), cx + R / 2, cy - 6, HOT);
          return;
        }
        const rx = 24, ry = 6, top = 10, bot = h - 10;
        ellipse(c, cx, bot, rx, ry, INK, true);
        if (solid === 'cyl') {
          ellipse(c, cx, top, rx, ry, INK);
          F.line(c, cx - rx, top, cx - rx, bot, INK); F.line(c, cx + rx, top, cx + rx, bot, INK);
          F.line(c, cx, top, cx + rx, top, HOT); F.label(c, String(r), cx + rx / 2, top - 5, HOT);
        } else {
          F.line(c, cx - rx, bot, cx, top - 4, INK); F.line(c, cx + rx, bot, cx, top - 4, INK);
          F.line(c, cx, top - 4, cx, bot, DIM, 2);
          F.line(c, cx, bot, cx + rx, bot, HOT); F.label(c, String(r), cx + rx / 2, bot - 5, HOT);
        }
        F.label(c, String(hh), cx + rx + 8, (top + bot) / 2, HOT);
      },
    };
  };

  // ---- Statistics and probability

  const sum = a => a.reduce((s, v) => s + v, 0), sorted = a => [...a].sort((p, q) => p - q);
  const median = a => { const s = sorted(a), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const dec = v => String(r2(v));

  // S.ID.1, S.ID.2, S.ID.3: center, spread, outliers and dot plots.
  kinds.centerSpread = d => {
    const f = d < 2 ? pick([0, 3]) : randInt(0, 3);
    if (f === 3) {
      const lo = pick([0, 1, 4, 5]), what = { 0: 'pets owned', 1: 'books read this month', 4: 'hours of sleep', 5: 'hours of sleep' }[lo];
      let cnt, tries = 0; do cnt = [0, 1, 2, 3, 4, 5, 6].map(() => randInt(0, 5)); while ((sum(cnt) < 8 || sum(cnt) > 22) && ++tries < 40);
      if (tries >= 40) cnt = [1, 2, 3, 4, 2, 1, 1];
      const data = []; cnt.forEach((k, i) => { for (let j = 0; j < k; j++) data.push(lo + i); });
      const med = median(data), M = Math.max(...cnt), modeI = cnt.indexOf(M), askMed = rand() < .6 || cnt.filter(k => k === M).length > 1;
      const fig = (c, w, h) => {
        const base = h - 10, step = Math.floor((w - 8) / 7);
        F.line(c, 2, base, w - 3, base, DIM);
        cnt.forEach((k, i) => { const x = 6 + i * step + step / 2 - 2; F.label(c, String(lo + i), x, base + 6, DIM); for (let j = 0; j < k; j++) F.disc(c, x, base - 4 - j * 6, 2, BLU); });
      };
      if (askMed) {
        return {
          topic: 'STATISTICS', text: `The dot plot shows the number of ${what} for some students. What is the median?`, size: [118, 46], fig,
          ...numeric(med, [lo + modeI, r1(sum(data) / data.length), lo + 3, med + 1, med - 1, (lo + lo + 6) / 2 + .5].filter(v => Math.abs(v - med) > 1e-9), v => String(v)),
          steps: [`There are ${data.length} dots. Count in from both ends.`, data.length % 2 ? `The middle one is dot ${(data.length + 1) / 2}: ${med}.` : `The middle two average to ${med}.`],
        };
      }
      return {
        topic: 'STATISTICS', text: `The dot plot shows the number of ${what} for some students. What is the mode?`, size: [118, 46], fig,
        ...numeric(lo + modeI, [M, med, lo + 6, lo + modeI + 1, lo + modeI - 1], v => String(v)),
        steps: ['The mode is the value with the most dots.', `${lo + modeI} has ${M} dots, the tallest stack.`],
      };
    }
    if (f === 2) {
      const n = 6, base = randInt(10, 30), vals = Array.from({ length: n }, () => base + randInt(-4, 4)), out = base + randInt(30, 60), all = [...vals, out];
      const meanAll = sum(all) / 7, meanV = sum(vals) / 6;
      if (rand() < .5) {
        return {
          topic: 'STATISTICS', text: `The data set ${shuffle([...all]).join(', ')} has one outlier. Which measure of center describes it best?`,
          ...textual('The median', ['The mean', 'The range', 'The outlier', 'The largest value']),
          steps: [`${out} is far from the rest: an outlier.`, 'An outlier pulls the mean toward it; the median barely moves.', 'So the median is the better center.'],
        };
      }
      return {
        topic: 'STATISTICS', text: `In the data set ${shuffle([...all]).join(', ')}, removing ${out} lowers the mean by how much, to the nearest tenth?`,
        ...numeric(r1(meanAll - meanV), [r1(out / 7), r1(meanAll), r1(meanV), r1(out - meanV)], v => v.toFixed(1)),
        steps: [`With it: ${sum(all)} / 7 = ${r1(meanAll).toFixed(1)}`, `Without it: ${sum(vals)} / 6 = ${r1(meanV).toFixed(1)}`, `The mean drops by about ${r1(meanAll - meanV).toFixed(1)}.`],
      };
    }
    if (f === 1) {
      const n = pick([7, 11]), data = sorted(Array.from({ length: n }, () => randInt(10, 60)));
      const q = n === 7 ? [1, 3, 5] : [2, 5, 8], [Q1, Md, Q3] = q.map(i => data[i]), iqr = Q3 - Q1;
      return {
        topic: 'STATISTICS', text: `What is the interquartile range of ${shuffle([...data]).join(', ')}?`,
        ...numeric(iqr, [data[n - 1] - data[0], Q3 - Md, Md - Q1, Q3, (Q3 + Q1) / 2]),
        steps: [`In order: ${data.join(', ')}`, `Median ${Md}. Lower half's median Q1 = ${Q1}; upper half's Q3 = ${Q3}.`, `IQR = ${Q3} - ${Q1} = ${iqr}`],
      };
    }
    const n = randInt(5, 7), data = Array.from({ length: n }, () => randInt(4, 30));
    const fix = (n - sum(data) % n) % n; data[0] += fix;
    const mean = sum(data) / n, med = median(data), rng = Math.max(...data) - Math.min(...data), ask = pick(['mean', 'median', 'range']);
    const ans = { mean, median: med, range: rng }[ask];
    return {
      topic: 'STATISTICS', text: `What is the ${ask} of ${data.join(', ')}?`,
      ...numeric(ans, [mean, med, rng, data[Math.floor(n / 2)], sum(data) / (n - 1)].filter(v => Math.abs(v - ans) > 1e-9), v => String(r2(v))),
      steps: ask === 'mean' ? [`Add them: ${sum(data)}`, `Divide by ${n}: ${mean}`] : ask === 'median' ? [`Put them in order: ${sorted(data).join(', ')}`, `The middle is ${med}.`]
        : [`Largest ${Math.max(...data)}, smallest ${Math.min(...data)}`, `Range = ${Math.max(...data)} - ${Math.min(...data)} = ${rng}`],
    };
  };

  // S.CP.4, S.CP.6, S.ID.5: two-way tables and conditional probability.
  const TWO = [
    ['The table shows how students voted for the lunch menu.', ['9TH', '10TH'], ['9th grader', '10th grader'], ['PIZZA', 'TACOS'], ['pizza', 'tacos'], 'voted for'],
    ['The table shows what kids and adults played at the arcade.', ['KIDS', 'ADULTS'], ['kid', 'adult'], ['DANCE', 'RACING'], ['dance games', 'racing games'], 'played'],
    ['The table shows how students get to school.', ['JUNIOR', 'SENIOR'], ['junior', 'senior'], ['BUS', 'BIKE'], ['the bus', 'a bike'], 'rides'],
  ];
  kinds.twoWay = d => {
    const [intro, R, Rw, C, Cw, verb] = pick(TWO), v = [[randInt(5, 40), randInt(5, 40)], [randInt(5, 40), randInt(5, 40)]];
    const rt2 = [v[0][0] + v[0][1], v[1][0] + v[1][1]], ct = [v[0][0] + v[1][0], v[0][1] + v[1][1]], T = rt2[0] + rt2[1];
    const i = randInt(0, 1), j = randInt(0, 1), f = d < 2 ? pick([0, 2]) : randInt(0, 3);
    const cand = [fr(v[i][j], rt2[i]), fr(v[i][j], ct[j]), fr(v[i][j], T), fr(rt2[i], T), fr(ct[j], T), fr(v[i][1 - j], rt2[i]), fr(v[1 - i][j], ct[j])];
    const art = s => /^[aeiou]/.test(s) ? 'an ' + s : 'a ' + s;
    const eq = (n, q) => `P = ${n}/${q}` + (fr(n, q) === `${n}/${q}` ? '' : ` = ${fr(n, q)}`);
    const Q = [
      [`If ${art(Rw[i])} is picked at random, what is the probability they ${verb} ${Cw[j]}?`, 0, [`Only the ${R[i]} row counts: ${rt2[i]} people.`, `${v[i][j]} of them ${verb} ${Cw[j]}.`, eq(v[i][j], rt2[i])]],
      [`If someone who ${verb} ${Cw[j]} is picked at random, what is the probability they are ${art(Rw[i])}?`, 1, [`Only the ${C[j]} column counts: ${ct[j]} people.`, `${v[i][j]} of them are in the ${R[i]} row.`, eq(v[i][j], ct[j])]],
      [`If one person is picked at random from everyone, what is the probability they are ${art(Rw[i])} who ${verb} ${Cw[j]}?`, 2, [`Everyone counts: ${T} people.`, `The ${R[i]} and ${C[j]} cell has ${v[i][j]}.`, eq(v[i][j], T)]],
      [`If one person is picked at random from everyone, what is the probability they are ${art(Rw[i])}?`, 3, [`Everyone counts: ${T} people.`, `The ${R[i]} total is ${rt2[i]}.`, eq(rt2[i], T)]],
    ][f];
    const right = cand[Q[1]];
    return {
      topic: 'PROBABILITY', text: `${intro} ${Q[0]}`, size: [161, 49],
      ...textual(right, cand.filter(s => s !== right).concat([fr(v[i][j] + 1, T), fr(v[i][j], T - 1)])),
      steps: Q[2],
      fig: (c, w, h) => table(c, w, h, [['', ...C, 'TOTAL'], [R[0], v[0][0], v[0][1], rt2[0]], [R[1], v[1][0], v[1][1], rt2[1]], ['TOTAL', ct[0], ct[1], T]]),
    };
  };

  // S.CP.2, S.CP.3, S.CP.5, S.CP.7: independence, the addition rule, conditional probability.
  kinds.independence = d => {
    const f = d < 3 ? randInt(0, 2) : randInt(0, 4);
    const a = randInt(1, 8) / 10, b = randInt(1, 8) / 10;
    if (f === 0) {
      const n = who();
      return {
        topic: 'PROBABILITY', text: `The chance ${n} makes a free throw is ${a}, and the chance it rains today is ${b}. The events are independent. What is the chance of both?`,
        ...numeric(r2(a * b), [r2(a + b), r2(a + b - a * b), r2(Math.abs(a - b)), r2(a * b + .1)].filter(v => v <= 1), dec),
        steps: ['Independent events: P(A and B) = P(A) × P(B).', `${a} × ${b} = ${dec(a * b)}`],
      };
    }
    if (f === 1) {
      const lo = Math.max(0, a + b - 1), both = r2(lo + (Math.min(a, b) - lo) * randInt(1, 9) / 10), or = r2(a + b - both);
      return {
        topic: 'PROBABILITY', text: `P(A) = ${a}, P(B) = ${b} and P(A and B) = ${both}. What is P(A or B)?`,
        ...numeric(or, [r2(a + b), r2(a + b + both), r2(a * b), both].filter(v => v <= 1 && v >= 0), dec),
        steps: ['Addition rule: P(A or B) = P(A) + P(B) - P(A and B).', `= ${a} + ${b} - ${both}`, `= ${dec(or)}`],
      };
    }
    if (f === 2) {
      const [setup, A, pa, Bt, pb] = pick([
        ['You flip a coin and roll a number cube.', 'heads', [1, 2], 'a number greater than 4', [2, 6]],
        ['You flip a coin and roll a number cube.', 'tails', [1, 2], 'an even number', [3, 6]],
        ['You spin a spinner with 4 equal colors and roll a number cube.', 'red', [1, 4], 'a 6', [1, 6]],
        ['You draw a card numbered 1 to 10 and flip a coin.', 'a 7 or higher', [4, 10], 'heads', [1, 2]],
      ]);
      const n = pa[0] * pb[0], dd = pa[1] * pb[1], right = fr(n, dd);
      return {
        topic: 'PROBABILITY', text: `${setup} What is the probability of getting ${A} and ${Bt}?`,
        ...textual(right, [fr(pa[0] * pb[1] + pb[0] * pa[1], dd), fr(pa[0] + pb[0], pa[1] + pb[1]), fr(n, pa[1] + pb[1]), fr(pb[0], pb[1]), fr(pa[0], pa[1])].filter(s => s !== right)),
        steps: ['The two events are independent: multiply.', `P(${A}) = ${fr(...pa)}, P(${Bt}) = ${fr(...pb)}`, `${fr(...pa)} × ${fr(...pb)} = ${right}`],
      };
    }
    if (f === 3) {
      let ind = rand() < .5, both = ind ? r2(a * b) : r2(a * b + pick([-1, 1]) * randInt(1, 3) * .05);
      if (both <= 0 || both > Math.min(a, b)) { ind = true; both = r2(a * b); }
      return {
        topic: 'PROBABILITY', text: `P(A) = ${a}, P(B) = ${b} and P(A and B) = ${dec(both)}. Are events A and B independent?`,
        ...textual(ind ? 'Yes, independent' : 'No, not independent', ['Yes, independent', 'No, not independent', "Can't tell from this", 'They are the same event']),
        steps: ['A and B are independent when P(A) × P(B) = P(A and B).', `${a} × ${b} = ${dec(a * b)}`, ind ? `That matches ${dec(both)}: independent.` : `That is not ${dec(both)}: not independent.`],
      };
    }
    const [pa, k] = pick([[.2, .25], [.2, .5], [.4, .25], [.4, .5], [.4, .75], [.6, .25], [.6, .5], [.8, .25], [.8, .75], [.5, .2], [.5, .4], [.5, .6], [.3, .5], [.7, .5]]), both = r2(pa * k);
    return {
      topic: 'PROBABILITY', text: `P(A) = ${pa} and P(A and B) = ${dec(both)}. What is P(B | A), the probability of B given A?`,
      ...numeric(k, [r2(pa * both), r2(pa - both), r2(pa + both), r2(both)].filter(v => v > 0 && v <= 1), dec),
      steps: ['P(B | A) = P(A and B) / P(A)', `= ${dec(both)} / ${pa}`, `= ${dec(k)}`],
    };
  };

  // S.ID.6, S.ID.7, S.ID.8, S.ID.9: scatter plots, correlation, causation, residuals.
  const CAUSE = [
    ['Cities that sell more ice cream have more sunburns.', 'Ice cream causes sunburns', 'Sunburns cause ice cream sales', 'Hot, sunny days may cause both.'],
    ['Kids with bigger shoe sizes score higher on reading tests.', 'Big feet make better readers', 'Reading makes feet grow', 'Older kids have bigger feet and read better.'],
    ['Towns with more firefighters have more fires.', 'Firefighters cause fires', 'Fires make towns hire firefighters', 'Bigger towns have more of both.'],
    ['Malls with more arcades have more pizza places.', 'Arcades cause pizza places', 'Pizza places cause arcades', 'Busy malls have more of everything.'],
  ];
  kinds.correlation = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 3);
    if (f === 1) {
      const [obs, xy, yx, why] = pick(CAUSE);
      return {
        topic: 'CORRELATION', text: `A study finds: ${obs} Which conclusion is best?`,
        ...textual('Correlation, not proof of cause', [xy, yx, 'There is no relationship', 'The study must be wrong']),
        steps: ['The data show a correlation: the two rise together.', why, "Correlation alone doesn't prove one causes the other."],
      };
    }
    if (f === 2) {
      const m = pick([1.5, 2, 2.5, 3, 4]), b = randInt(40, 70), [xw, yw, xu] = pick([['hours of practice', 'free throws made out of 100', 'hour'], ['hours studied', 'test score', 'hour'], ['pages read a day', 'vocabulary quiz score', 'page']]);
      const askM = rand() < .6;
      return {
        topic: 'CORRELATION', text: `The line of best fit y = ${m}x + ${b} models ${yw} (y) from ${xw} (x). What does the ${askM ? m : b} mean?`,
        ...textual(askM ? `${m} more points per ${xu}` : `The predicted score at 0 ${xu}s`,
          askM ? [`The predicted score at 0 ${xu}s`, `${m} ${xu}s per point`, `The highest score is ${m}`, `${m} points in all`] : [`${b} more points per ${xu}`, `The highest score`, `The number of ${xu}s`, `The average score`]),
        steps: askM ? [`${m} multiplies x: each extra ${xu} adds ${m} to y.`, 'That is the slope: a rate.'] : [`At x = 0, y = ${b}.`, `So ${b} is the predicted score with 0 ${xu}s.`],
      };
    }
    if (f === 3) {
      const m = randInt(2, 6), b = randInt(5, 20), x = randInt(2, 9), pred = m * x + b, res = nz(-6, 6), act = pred + res;
      return {
        topic: 'CORRELATION', text: `A line of fit is y = ${m}x + ${b}. The data point (${x}, ${act}) is in the set. What is its residual?`,
        ...numeric(res, [-res, pred, act, act + pred]),
        steps: ['Residual = actual - predicted', `Predicted at x = ${x}: ${m}(${x}) + ${b} = ${pred}`, `${act} - ${pred} = ${res}`],
      };
    }
    const TARGETS = [.9, .5, 0, -.5, -.9], t = pick(TARGETS);
    let pts, r, tries = 0;
    do {
      const sl = t === 0 ? 0 : Math.sign(t) * (Math.abs(t) > .7 ? .8 : .5), noise = Math.abs(t) > .7 ? 1.6 : 4.3;
      pts = Array.from({ length: 16 }, () => { const x = .5 + rand() * 9; return [x, sl * x + (rand() * 2 - 1) * noise]; });
      const mx = sum(pts.map(p => p[0])) / 16, my = sum(pts.map(p => p[1])) / 16;
      const sxy = sum(pts.map(p => (p[0] - mx) * (p[1] - my))), sxx = sum(pts.map(p => (p[0] - mx) ** 2)), syy = sum(pts.map(p => (p[1] - my) ** 2));
      r = sxy / Math.sqrt(sxx * syy);
    } while (Math.abs(r - t) > .1 && ++tries < 60);
    const near = TARGETS.reduce((p, q) => Math.abs(q - r) < Math.abs(p - r) ? q : p), names = TARGETS.map(String), right = String(near);
    const y0 = Math.floor(Math.min(...pts.map(p => p[1]))) - 1, y1 = Math.ceil(Math.max(...pts.map(p => p[1]))) + 1;
    return {
      topic: 'CORRELATION', text: 'Which value is closest to the correlation coefficient r for the data shown?', size: [100, 64],
      ...textual(right, shuffle(names.filter(s => s !== right))),
      steps: [near === 0 ? 'The points show no trend: r is near 0.' : `The points ${near > 0 ? 'rise' : 'fall'} left to right: r is ${near > 0 ? 'positive' : 'negative'}.`,
        near === 0 ? '' : Math.abs(near) > .7 ? 'They hug a line tightly: r is close to ' + (near > 0 ? '1.' : '-1.') : 'They are loose around a line: a weaker r.'].filter(Boolean),
      fig: (c, w, h) => { const P = F.grid(c, w, h, [0, 10], [y0, y1], 2, 2); for (const p of pts) F.dot(c, P(...p), BLU); },
    };
  };

  // ======== Wider coverage: IXL's Algebra 1, Geometry and Algebra 2 plans ========

  // N.RN.3: rational and irrational numbers.
  kinds.numberClass = d => {
    if (d >= 2 && rand() < .4) {
      const cases = [['a rational number and an irrational number', 'Always irrational'], ['two rational numbers', 'Always rational'], ['two irrational numbers', 'Sometimes rational'],
        ['a nonzero rational number and an irrational number', 'Always irrational']];
      const [what, right] = pick(cases), op = what.includes('nonzero') ? 'product' : 'sum';
      return {
        topic: 'REAL NUMBERS', text: `What can you say about the ${op} of ${what}?`,
        ...textual(right, ['Always irrational', 'Always rational', 'Sometimes rational', 'Always an integer']),
        steps: right === 'Sometimes rational' ? ['√2 + √2 = 2√2 is irrational, but √2 + (-√2) = 0 is rational.', 'So it depends: sometimes rational.']
          : right === 'Always rational' ? ['Fractions add and multiply to fractions.', 'So the result is always rational.'] : ['If the result were rational, you could undo the rational part and make the irrational one rational.', 'That is impossible, so it is always irrational.'],
      };
    }
    const sq = randInt(2, 12), non = pick([2, 3, 5, 6, 7, 8, 10, 11, 12, 15, 17, 20]), a = randInt(1, 9), b = randInt(2, 9);
    const rat = [`√${sq * sq}`, `${a}/${b}`, `0.${a}${b}`, `-${sq}`, `√${sq * sq}/${b}`, `0.${a}${a}${a}...`], irr = [`√${non}`, 'π', `${a} + √${non}`, `√${non}/${b}`];
    const askIrr = rand() < .6, right = pick(askIrr ? irr : rat), pool = shuffle([...(askIrr ? rat : irr)]);
    return {
      topic: 'REAL NUMBERS', text: `Which number is ${askIrr ? 'irrational' : 'rational'}?`, ...textual(right, pool),
      steps: ['Rational numbers can be written as a fraction of integers; repeating or ending decimals count.', 'Square roots of non-squares and π are irrational.', `So ${right} is ${askIrr ? 'irrational' : 'rational'}.`],
    };
  };

  // N.RN.2 and IXL's integer exponents: product, quotient and power rules, negative exponents.
  kinds.expRules = d => {
    const mono = (c, ex, ey) => `${c === 1 ? '' : c}${ex ? 'x' + (ex > 1 ? `^{${ex}}` : '') : ''}${ey ? 'y' + (ey > 1 ? `^{${ey}}` : '') : ''}`;
    const f = d < 2 ? pick([0, 2]) : randInt(0, 3);
    if (f === 0) {
      const a = randInt(2, 3), m = randInt(1, 4), n = randInt(1, 4), p = randInt(2, 3);
      const right = mono(a ** p, m * p, n * p);
      return {
        topic: 'EXPONENTS', text: `Which expression is equivalent to (${mono(a, m, n)})^${p}?`,
        ...textual(right, [mono(a * p, m * p, n * p), mono(a ** p, m + p, n + p), mono(a, m * p, n * p), mono(a ** p, m * p, n), mono(a ** p, m * p, n * p + 1), mono(a ** (p + 1), m * p, n * p)]),
        steps: ['Raise every factor to the power.', `${a}^${p} = ${a ** p}; multiply each exponent by ${p}.`, right],
      };
    }
    if (f === 1) {
      const c = randInt(2, 4), k = randInt(2, 5), ex = randInt(4, 8), ey = randInt(1, 3), dx = randInt(1, ex - 2), dy = ey + randInt(1, 3);
      const top = mono(c * k, ex, ey), bot = mono(k, dx, dy), right = `${mono(c, ex - dx, 0)}/${mono(1, 0, dy - ey) || '1'}`;
      return {
        topic: 'EXPONENTS', text: `For x and y not 0, which is equivalent to (${top})/(${bot})?`,
        ...textual(right, [`${mono(c, ex - dx, dy - ey)}`, `${mono(c * k - k, ex - dx, 0)}/${mono(1, 0, dy - ey)}`, `${mono(c, ex + dx, 0)}/${mono(1, 0, dy + ey)}`, `${mono(c, ex - dx, 0)}/${mono(1, 0, dy + ey)}`]),
        steps: [`Divide the numbers: ${c * k} ÷ ${k} = ${c}`, `Subtract exponents: x^{${ex}-${dx}} = ${mono(1, ex - dx, 0)}, and y^{${ey}-${dy}} = y^{${ey - dy}}`, `A negative exponent moves y to the bottom: ${right}`],
      };
    }
    if (f === 2) {
      const [b, e] = pick([[2, 3], [2, 4], [3, 2], [4, 2], [5, 2], [10, 3], [2, 5], [3, 3]]);
      const v = b ** e;
      return {
        topic: 'EXPONENTS', text: `What is the value of ${b}^{-${e}}?`,
        ...textual(`1/${cm(v)}`, [`-${cm(v)}`, `-${b * e}`, `1/${b * e}`, `${cm(v)}`, `-1/${cm(v)}`]),
        steps: ['A negative exponent means 1 over the positive power.', `${b}^{-${e}} = 1/${b}^${e} = 1/${cm(v)}`],
      };
    }
    const p = randInt(2, 5), q = randInt(2, 5), r = randInt(1, Math.min(4, p + q - 2)), e1 = p + q - r;
    return {
      topic: 'EXPONENTS', text: `For x ≠ 0, which is equivalent to (x^${p} · x^${q})/${r === 1 ? 'x' : 'x^' + r}?`,
      ...textual(e1 === 1 ? 'x' : `x^{${e1}}`, [`x^{${p * q - r}}`, `x^{${p * q / r}}`.includes('.') ? `x^{${p + q + r}}` : `x^{${p * q / r}}`, `x^{${p + q + r}}`, `x^{${p * q * r}}`, `x^{${p + q}}`, `x^{${(p + q) * r}}`, `x^{${e1 + 1}}`, `x^{${e1 + 2}}`, `x^{${e1 + 3}}`].filter(s => s !== `x^{${e1}}`)),
      steps: ['Multiplying: add exponents. Dividing: subtract.', `${p} + ${q} - ${r} = ${e1}`],
    };
  };

  // A.CED.2, F.IF.4, F.LE.2: slope and the forms of a line.
  kinds.lineEquations = d => {
    const f = d < 2 ? pick([0, 2, 4]) : randInt(0, 4);
    if (f === 0) {
      let A, B; do { A = nz(-6, 6); B = nz(-6, 6); } while (gcd(A, B) !== 1);
      const m = randInt(1, 4), C = A * B * m * pick([1, -1]), askX = rand() < .5, xi = C / A, yi = C / B;
      return {
        topic: 'LINES', text: `What is the ${askX ? 'x' : 'y'}-intercept of the line ${term(A)} ${B < 0 ? '-' : '+'} ${term(Math.abs(B), 'y')} = ${C}?`,
        ...textual(askX ? pt(xi, 0) : pt(0, yi), [askX ? pt(0, xi) : pt(yi, 0), askX ? pt(yi, 0) : pt(0, xi), askX ? pt(-xi, 0) : pt(0, -yi), askX ? pt(C, 0) : pt(0, C), askX ? pt(0, yi) : pt(xi, 0), askX ? pt(2 * xi, 0) : pt(0, 2 * yi)]),
        steps: [askX ? 'The x-intercept is where y = 0.' : 'The y-intercept is where x = 0.', askX ? `${A}x = ${C}, so x = ${xi}` : `${B}y = ${C}, so y = ${yi}`, `So the intercept is ${askX ? pt(xi, 0) : pt(0, yi)}.`],
      };
    }
    if (f === 1) {
      const x1 = nz(-6, 6), y1 = nz(-6, 6), m = pick([-3, -2, -1, 2, 3, 4, 1 / 2, -1 / 2, 2 / 3]), M = Number.isInteger(m) ? String(m) : `(${show(m)})`;
      const P = (a, b, s) => `y ${signed(-b)} = ${s}(x ${signed(-a)})`, right = P(x1, y1, M);
      return {
        topic: 'LINES', text: `Which is an equation of the line through (${x1}, ${y1}) with slope ${show(m)}?`,
        ...textual(right, [P(-x1, -y1, M), P(y1, x1, M), P(x1, y1, Number.isInteger(-m) ? String(-m) : `(${show(-m)})`), P(-x1, y1, M)]),
        steps: ['Point-slope form: y - y1 = m(x - x1)', `Put in (${x1}, ${y1}) and m = ${show(m)}.`, right],
      };
    }
    if (f === 2) {
      const a = nz(-8, 8), b = nz(-8, 8), vert = rand() < .5, c = b + nz(-5, 5);
      return {
        topic: 'LINES', text: `Which is an equation of the line through (${vert ? `${a}, ${b}) and (${a}, ${c}` : `${b}, ${a}) and (${c}, ${a}`})?`,
        ...textual(vert ? `x = ${a}` : `y = ${a}`, [vert ? `y = ${a}` : `x = ${a}`, `x = ${b}`, `y = ${b}`, `y = ${a}x`, vert ? `x = ${c}` : `y = ${c}`, vert ? `y = ${c}` : `x = ${c}`].filter(v => v !== (vert ? `x = ${a}` : `y = ${a}`))),
        steps: [vert ? `Both points have x = ${a}: the line is vertical.` : `Both points have y = ${a}: the line is horizontal.`, vert ? `x = ${a}` : `y = ${a}`],
      };
    }
    if (f === 3) {
      const m = nz(-4, 4), x0 = randInt(-3, 0), b = randInt(-5, 5), xs = [0, 1, 2, 3].map(i => x0 + i * 2), ys = xs.map(x => m * x + b);
      return {
        topic: 'LINES', text: 'The table shows points on a line. What is the slope of the line?', size: [110, 30],
        ...numeric(m, [2 * m, 1 / m, -m, ys[0]]),
        steps: [`x goes up 2 each time; y goes up ${2 * m}.`, `Slope = ${2 * m} / 2 = ${m}`],
        fig: (c, w, h) => table(c, w, h, [['x', ...xs], ['y', ...ys]]),
      };
    }
    const m = nz(-4, 5), x1 = randInt(-5, 3), x2 = x1 + randInt(2, 5), y2 = randInt(-8, 12), k = y2 - m * (x2 - x1);
    return {
      topic: 'LINES', text: `The line through (${x1}, k) and (${x2}, ${y2}) has slope ${m}. What is the value of k?`,
      ...numeric(k, [y2 + m * (x2 - x1), y2 - m, y2 - (x2 - x1) / m, k + m]),
      steps: [`Slope: (${y2} - k) / (${x2} - ${x1 < 0 ? '(' + x1 + ')' : x1}) = ${m}`, `${y2} - k = ${m * (x2 - x1)}`, `k = ${k}`],
    };
  };

  // F.IF.1: functions and relations.
  kinds.isFunction = d => {
    if (d >= 2 && rand() < .45) {
      const notF = ['x = y^2', 'x^2 + y^2 = 25', 'x = |y|', 'x = 4'], isF = ['y = x^2', 'y = |x|', 'y = 3x - 1', 'y = 4', 'y = √x', 'y = x^3'];
      const askNot = rand() < .5, right = pick(askNot ? notF : isF), others = shuffle([...(askNot ? isF : notF)]).slice(0, 3);
      return {
        topic: 'FUNCTIONS', text: `Which equation ${askNot ? 'does NOT define' : 'defines'} y as a function of x?`, ...textual(right, others),
        steps: ['A function gives exactly one y for each x.', askNot ? `In ${right}, some x has two y values (or many).` : `In ${right}, every x gives one y.`],
      };
    }
    const mk = bad => {
      let xs; do xs = [randInt(-4, 6), randInt(-4, 6), randInt(-4, 6)]; while (new Set(xs).size < 3);
      if (bad) xs[2] = xs[0];
      let ys; do ys = xs.map(() => randInt(-5, 9)); while (bad && ys[2] === ys[0]);
      return xs.map((x, i) => pt(x, ys[i])).join(', ');
    };
    const askNot = rand() < .5, right = mk(askNot), wr = [mk(!askNot), mk(!askNot), mk(!askNot), mk(!askNot)];
    return {
      topic: 'FUNCTIONS', text: `Which set of points ${askNot ? 'does NOT represent' : 'represents'} a function?`, ...textual(right, wr),
      steps: ['In a function, no x value repeats with a different y.', askNot ? `${right} uses the same x twice with different y's.` : `${right} never repeats an x.`],
    };
  };

  // A.REI.12, A.CED.3: two-variable inequalities, systems and linear programming.
  kinds.ineq2var = d => {
    const f = d < 2 ? pick([0, 1]) : d < 4 ? randInt(0, 2) : randInt(0, 3);
    const m = pick([-2, -1, 1, 2, 1 / 2, -1 / 2, 3]), b = randInt(-3, 3), op = pick(['<', '>', '≤', '≥']), M = Number.isInteger(m) ? (m === 1 ? '' : m === -1 ? '-' : String(m)) : `(${show(m)})`;
    const strict = op === '<' || op === '>', rhs = `${M}x${b ? ' ' + signed(b) : ''}`, ok = (x, y) => ({ '<': y < m * x + b, '>': y > m * x + b, '≤': y <= m * x + b, '≥': y >= m * x + b })[op];
    if (f === 0) {
      const good = [], bad = [];
      for (let x = -4; x <= 4; x += 2) for (let y = -6; y <= 6; y++) (ok(x, y) ? good : bad).push(pt(x, y));
      const onLine = bad.filter(s => { const [x, y] = s.slice(1, -1).split(', ').map(Number); return y === m * x + b; });
      const right = pick(good), wr = strict && onLine.length ? [pick(onLine), ...shuffle(bad).slice(0, 4)] : shuffle(bad).slice(0, 5);
      return {
        topic: 'INEQUALITIES', text: `Which point is a solution of y ${op} ${rhs}?`, ...textual(right, wr),
        steps: ['Put each point in and check.', `${right}: y ${op} ${rhs} holds.`, strict ? 'A point on the line itself does not count: the sign is strict.' : 'Points on the line count: the sign includes equal.'],
      };
    }
    if (f === 1) {
      const above = op === '>' || op === '≥', solid = !strict;
      return {
        topic: 'INEQUALITIES', text: 'Which inequality is shown in the graph? (A dashed line is not included.)', size: [96, 80],
        ...textual(`y ${op} ${rhs}`, ['<', '>', '≤', '≥'].filter(o => o !== op).map(o => `y ${o} ${rhs}`)),
        steps: [`The line is y = ${rhs}, ${solid ? 'solid: included' : 'dashed: not included'}.`, `The shading is ${above ? 'above' : 'below'} the line.`, `So y ${op} ${rhs}.`],
        fig: (c, w, h) => {
          const P = F.grid(c, w, h, [-6, 6], [-6, 6]);
          c.fillStyle = '#3a5aa0';
          for (let px2 = 1; px2 < w; px2 += 3) for (let py = 1; py < h; py += 3) { const x = -6 + px2 / (w - 1) * 12, y = 6 - py / (h - 1) * 12; if (above ? y > m * x + b : y < m * x + b) c.fillRect(px2, py, 1, 1); }
          F.line(c, ...P(-6, m * -6 + b), ...P(6, m * 6 + b), HOT, solid ? 0 : 2);
        },
      };
    }
    if (f === 2) {
      const m2 = pick([-1, 1, -2, 2].filter(v => v !== m)), b2 = randInt(-2, 4), test = [];
      for (let x = -3; x <= 3; x++) for (let y = -4; y <= 6; y++) test.push([x, y]);
      const both = test.filter(([x, y]) => ok(x, y) && y <= m2 * x + b2), one = test.filter(([x, y]) => ok(x, y) !== (y <= m2 * x + b2));
      if (!both.length || one.length < 3) return kinds.ineq2var(1);
      const right = pt(...pick(both));
      return {
        topic: 'INEQUALITIES', text: `Which point is a solution of the system?\ny ${op} ${rhs}\ny ≤ ${lin(m2, b2)}`,
        ...textual(right, shuffle(one).slice(0, 3).map(p2 => pt(...p2))),
        steps: ['A solution of the system must satisfy both inequalities.', `${right} works in both.`, 'Each other point fails one of them.'],
      };
    }
    const V = pick([[[0, 0], [0, 6], [4, 4], [7, 0]], [[0, 0], [0, 5], [3, 4], [6, 0]], [[0, 0], [0, 8], [5, 5], [9, 0]], [[1, 1], [1, 6], [5, 4], [6, 1]]]);
    const a = randInt(2, 6), bb = randInt(2, 6), P2 = ([x, y]) => a * x + bb * y, vals = V.map(P2), mx = Math.max(...vals);
    return {
      topic: 'INEQUALITIES', text: `The feasible region of a system of inequalities has vertices ${V.map(v => pt(...v)).join(', ')}. What is the maximum value of P = ${a}x + ${bb}y on the region?`,
      ...numeric(mx, [...vals.filter(v => v !== mx), a + bb, mx + a]),
      steps: ['A linear expression is greatest at a vertex of the region.', `Check each: ${V.map((v, i) => vals[i]).join(', ')}`, `The maximum is ${mx}.`],
    };
  };

  // A.CED.2 and IXL's direct and inverse variation.
  kinds.variation = d => {
    const f = d < 2 ? pick([0, 3]) : randInt(0, 3);
    if (f === 0 || f === 1) {
      const inv = f === 1;
      let k, b, c, a, ans, tries = 0;
      do { k = inv ? randInt(2, 12) * pick([1, 2, 3]) : pick([2, 3, 4, 5, 1.5, 2.5]); b = randInt(2, 9); c = randInt(2, 12); a = inv ? k / b : k * b; ans = inv ? k / c : k * c; }
      while ((!Number.isInteger(a) || !Number.isInteger(ans) || b === c) && ++tries < 60);
      if (tries >= 60) { k = 24; b = 4; c = 6; a = inv ? 6 : 96; ans = inv ? 4 : 144; if (!inv) { k = 24; } }
      return {
        topic: 'VARIATION', text: `y varies ${inv ? 'inversely' : 'directly'} with x, and y = ${a} when x = ${b}. What is y when x = ${c}?`,
        ...numeric(ans, inv ? [a * c / b, a + c - b, b * c / a, a * c] : [a * b / c, a + c - b, c / k, a * c], v => String(r2(v))),
        steps: inv ? ['Inverse variation: xy = k.', `k = ${b} × ${a} = ${k}`, `y = ${k} ÷ ${c} = ${ans}`] : ['Direct variation: y = kx.', `k = ${a} ÷ ${b} = ${k}`, `y = ${k} × ${c} = ${ans}`],
      };
    }
    if (f === 2) {
      const type = randInt(0, 2), k = randInt(2, 6) * 6, xs = [1, 2, 3, 6];
      const ys = type === 0 ? xs.map(x => k / 6 * x) : type === 1 ? xs.map(x => k / x) : xs.map(x => k / 6 * x + 2);
      const right = ['Direct variation', 'Inverse variation', 'Neither'][type];
      return {
        topic: 'VARIATION', text: 'Which kind of variation does the table show?', size: [100, 30],
        ...textual(right, ['Direct variation', 'Inverse variation', 'Neither', 'Both']),
        steps: [type === 0 ? `y ÷ x is always ${k / 6}: direct.` : type === 1 ? `x × y is always ${k}: inverse.` : 'Neither y ÷ x nor x × y stays the same.', `So: ${right.toLowerCase()}.`],
        fig: (c, w, h) => table(c, w, h, [['x', ...xs], ['y', ...ys]]),
      };
    }
    const inv = rand() < .5;
    if (inv) {
      const [p1, t1, p2] = pick([[3, 8, 4], [2, 9, 3], [4, 6, 3], [6, 4, 8], [5, 12, 6], [2, 15, 6]]), t2 = p1 * t1 / p2;
      return {
        topic: 'VARIATION', text: `The time to paint a fence varies inversely with the number of painters. ${p1} painters take ${t1} hours. How many hours would ${p2} painters take?`,
        ...numeric(t2, [t1 * p2 / p1, t1 + p1 - p2, t1 - (p2 - p1), p1 * t1], v => String(r2(v))),
        steps: [`Painters × hours stays the same: ${p1} × ${t1} = ${p1 * t1}`, `${p1 * t1} ÷ ${p2} = ${r2(t2)} hours`],
      };
    }
    const n = randInt(3, 8), cost = n * pick([1.25, 1.5, 2, 2.5]), n2 = randInt(9, 20), ans = r2(cost / n * n2);
    return {
      topic: 'VARIATION', text: `The cost of arcade tokens varies directly with the number bought. ${n} tokens cost $${cost.toFixed(2)}. What do ${n2} tokens cost?`,
      ...numeric(ans, [r2(cost * n / n2), r2(cost + n2 - n), r2(cost * n2), r2(ans + cost / n)], v => '$' + v.toFixed(2)),
      steps: [`Cost per token: $${cost.toFixed(2)} ÷ ${n} = $${(cost / n).toFixed(2)}`, `${n2} × $${(cost / n).toFixed(2)} = $${ans.toFixed(2)}`],
    };
  };

  // N.Q.1-3: units, dimensional analysis, percent error.
  kinds.unitAnalysis = d => {
    const f = d < 2 ? pick([0, 2]) : randInt(0, 3);
    if (f === 0) {
      const [txt, ans, steps, wr] = pick([
        ...[5, 10, 15, 20].map(v => [`A cyclist rides at ${v} meters per second. What is that speed in kilometers per hour?`, v * 3.6, [`${v} m/s × 3,600 s/h = ${cm(v * 3600)} m/h`, `${cm(v * 3600)} ÷ 1,000 = ${v * 3.6} km/h`], [v * 60 / 1000, v * 36, v / 3.6]]),
        ...[2, 4, 6].map(v => [`A leaky faucet drips ${v} cups of water an hour. How many gallons is that in a day? (16 cups = 1 gallon)`, v * 24 / 16, [`${v} × 24 = ${v * 24} cups a day`, `${v * 24} ÷ 16 = ${v * 24 / 16} gallons`], [v * 16 / 24, v * 24, v / 16]]),
        ...[3, 6, 9].map(v => [`A recipe uses ${v} teaspoons of salt per batch. How many tablespoons is that for 4 batches? (3 teaspoons = 1 tablespoon)`, v * 4 / 3, [`${v} × 4 = ${v * 4} teaspoons`, `${v * 4} ÷ 3 = ${v * 4 / 3} tablespoons`], [v * 12, v * 4, v / 3]]),
      ]);
      return { topic: 'UNITS', text: txt, ...numeric(ans, wr, v => String(r2(v))), steps };
    }
    if (f === 1) {
      const v = pick([30, 45, 60, 75]), right = `${v} mi/h × 5,280 ft/mi × 1 h/3,600 s`;
      return {
        topic: 'UNITS', text: `Which product converts ${v} miles per hour to feet per second?`,
        ...textual(right, [`${v} mi/h × 1 mi/5,280 ft × 3,600 s/1 h`, `${v} mi/h × 5,280 ft/mi × 3,600 s/1 h`, `${v} mi/h × 1 mi/5,280 ft × 1 h/3,600 s`]),
        steps: ['Arrange each factor so the unwanted unit cancels.', 'Miles on the bottom cancels mi; hours on top cancels h.', right],
      };
    }
    if (f === 2) {
      const act = pick([20, 25, 40, 50, 80, 125, 200]), err = pick([1, 2, 4, 5, 10]) * act / 100 * pick([1, 2]), meas = act + err * pick([1, -1]), pe = Math.abs(meas - act) / act * 100;
      return {
        topic: 'UNITS', text: `A board is really ${act} inches long, but ${who()} measures it as ${r2(meas)} inches. What is the percent error?`,
        ...numeric(r2(pe), [r2(Math.abs(meas - act) / meas * 100), r2(Math.abs(meas - act)), r2(pe * 10), r2(100 - pe)], v => v + '%'),
        steps: [`Error: |${r2(meas)} - ${act}| = ${r2(Math.abs(meas - act))}`, `Divide by the actual value: ${r2(Math.abs(meas - act))} ÷ ${act} = ${r2(pe / 100)}`, `= ${r2(pe)}%`],
      };
    }
    const [s1, p1] = pick([[12, 3], [16, 4], [10, 2.5], [8, 2.4]]), [s2, p2] = pick([[20, 4.4], [24, 5.04], [32, 6.4], [18, 4.14], [20, 5.6], [24, 6.48]]);
    const u1 = r2(p1 / s1 * 100), u2 = r2(p2 / s2 * 100), better = u1 < u2 ? s1 : s2, diff = r2(Math.abs(u1 - u2));
    if (diff === 0) return kinds.unitAnalysis(1);
    return {
      topic: 'UNITS', text: `A ${s1}-ounce bag of chips costs $${p1.toFixed(2)} and a ${s2}-ounce bag costs $${p2.toFixed(2)}. Which is the better buy per ounce, and by how much?`,
      ...textual(`${better} oz, by ${cm(diff)}¢ an ounce`, [`${better === s1 ? s2 : s1} oz, by ${cm(diff)}¢ an ounce`, `${better} oz, by ${cm(r2(Math.abs(p1 - p2) * 100))}¢ an ounce`, `They cost the same per ounce`]),
      steps: [`${s1} oz: ${cm(u1)}¢ per ounce. ${s2} oz: ${cm(u2)}¢ per ounce.`, `The ${better}-ounce bag is cheaper by ${cm(diff)}¢ an ounce.`],
    };
  };

  // A.CED.1: consecutive integers, weighted averages, rates of travel.
  kinds.wordAlgebra = d => {
    const f = randInt(0, 2);
    if (f === 0) {
      const step = pick([1, 2]), odd = step === 2 && rand() < .5, n = 3, start = step === 1 ? randInt(5, 40) : 2 * randInt(3, 20) + (odd ? 1 : 0), S = start * 3 + 3 * step;
      const kindW = step === 1 ? 'consecutive integers' : odd ? 'consecutive odd integers' : 'consecutive even integers';
      return {
        topic: 'WORD PROBLEMS', text: `The sum of three ${kindW} is ${S}. What is the largest of them?`,
        ...numeric(start + 2 * step, [start, start + step, S / 3 + 1, start + 3 * step]),
        steps: [`Call them n, n + ${step}, n + ${2 * step}.`, `3n + ${3 * step} = ${S}, so n = ${start}`, `The largest is ${start + 2 * step}.`],
      };
    }
    if (f === 1) {
      const n = randInt(3, 6), avg = randInt(70, 86);
      let goal = avg + randInt(1, 3); if (goal * (n + 1) - avg * n > 100) goal = avg + 1;
      const need = goal * (n + 1) - avg * n;
      return {
        topic: 'WORD PROBLEMS', text: `${who()} has a mean score of ${avg} on ${n} tests. What score on the next test brings the mean up to ${goal}?`,
        ...numeric(need, [goal, goal + (goal - avg), avg + n * (goal - avg) - 1, need + 2]),
        steps: [`Total now: ${n} × ${avg} = ${n * avg}`, `Needed total: ${n + 1} × ${goal} = ${(n + 1) * goal}`, `Score: ${(n + 1) * goal} - ${n * avg} = ${need}`],
      };
    }
    const v1 = randInt(3, 6) * 10, v2 = v1 + randInt(1, 3) * 5, t = randInt(2, 5), D = (v1 + v2) * t, opp = rand() < .6;
    if (!opp) {
      const gap = (v2 - v1) * t;
      return {
        topic: 'WORD PROBLEMS', text: `Two tour buses leave the same stop at the same time, going the same way at ${v1} and ${v2} miles per hour. After how many hours are they ${gap} miles apart?`,
        ...numeric(t, [gap / v1, gap / (v1 + v2), t + 1, t * 2].filter(v => Number.isInteger(v) && v > 0)),
        steps: [`The gap grows ${v2} - ${v1} = ${v2 - v1} miles each hour.`, `${gap} ÷ ${v2 - v1} = ${t} hours`],
      };
    }
    return {
      topic: 'WORD PROBLEMS', text: `Two tour buses leave the same stop at the same time in opposite directions, at ${v1} and ${v2} miles per hour. After how many hours are they ${D} miles apart?`,
      ...numeric(t, [D / v1, D / v2, D / (v2 - v1), t + 1].filter(v => Number.isInteger(v) && v > 0)),
      steps: [`The distance apart grows ${v1} + ${v2} = ${v1 + v2} miles each hour.`, `${D} ÷ ${v1 + v2} = ${t} hours`],
    };
  };

  // F.IF.2, F.IF.7b: piecewise and step functions.
  kinds.piecewise = d => {
    const f = d < 2 ? pick([0, 2]) : randInt(0, 2);
    if (f === 0) {
      const c = randInt(-2, 3), a1 = nz(-3, 3), b1 = randInt(-5, 5), a2 = nz(-3, 3), b2 = randInt(-5, 5), sq = rand() < .4;
      const f1 = x => sq ? x * x + b1 : a1 * x + b1, f2 = x => a2 * x + b2, e1 = sq ? px([1, 0, b1]) : lin(a1, b1), e2 = lin(a2, b2);
      const k = pick([c - randInt(1, 3), c, c + randInt(1, 3)]), ans = k < c ? f1(k) : f2(k);
      return {
        topic: 'FUNCTIONS', text: `f(x) = ${e1} when x < ${c}\nf(x) = ${e2} when x ≥ ${c}\nWhat is f(${k})?`,
        ...numeric(ans, [k < c ? f2(k) : f1(k), ans + 1, -ans, k]),
        steps: [`${k} is ${k < c ? `less than ${c}` : `${c} or more`}, so use ${k < c ? e1 : e2}.`, `f(${k}) = ${ans}`],
      };
    }
    if (f === 1) {
      const c = randInt(-2, 2), a1 = pick([-1, 1, 2, -2]), b1 = randInt(-3, 3), a2 = pick([-1, 1, 1 / 2, -2]), y2 = randInt(-3, 3);
      const L = x => a1 * (x - c) + b1, R = x => a2 * (x - c) + y2;
      if (b1 === y2) return kinds.piecewise(1);
      return {
        topic: 'FUNCTIONS', text: `The graph of f is shown. An open dot is not on the graph. What is f(${c})?`, size: [96, 80],
        ...numeric(y2, [b1, c, -y2, y2 + 1]),
        steps: [`At x = ${c} there is an open dot at y = ${b1} and a closed dot at y = ${y2}.`, `The closed dot counts: f(${c}) = ${y2}`],
        fig: (cc, w, h) => {
          const P = F.grid(cc, w, h, [-6, 6], [-6, 6]);
          F.line(cc, ...P(-6, L(-6)), ...P(c, L(c)), HOT); F.line(cc, ...P(c, R(c)), ...P(6, R(6)), HOT);
          const o = P(c, b1); F.circle(cc, o[0], o[1], 2, HOT); cc.fillStyle = '#0c1028'; cc.fillRect(o[0] - 1, o[1] - 1, 3, 3);
          F.dot(cc, P(c, y2), HOT);
        },
      };
    }
    const first = pick([2, 3, 4, 5]), extra = pick([1, 1.5, 2, 2.5]), hrs = randInt(2, 6) + pick([.25, .5, .75]), ans = first + extra * Math.ceil(hrs - 1);
    return {
      topic: 'FUNCTIONS', text: `A parking garage charges $${first} for the first hour or part of an hour, and $${extra.toFixed(2)} for each extra hour or part of an hour. What does ${hrs} hours cost?`,
      ...numeric(ans, [first + extra * (hrs - 1), first + extra * Math.floor(hrs - 1), first * Math.ceil(hrs), extra * Math.ceil(hrs)], money),
      steps: [`After the first hour, ${hrs - 1} hours are left; any part counts as a whole hour: ${Math.ceil(hrs - 1)}.`, `$${first} + ${Math.ceil(hrs - 1)} × $${extra.toFixed(2)} = ${money(ans)}`],
    };
  };

  // F.IF.7b, F.BF.3: absolute value graphs.
  kinds.absGraph = d => {
    const a = d < 2 ? pick([1, -1]) : pick([1, -1, 2, -2, 1 / 2]), h = nz(-3, 3), k = nz(-3, 3), A = a === 1 ? '' : a === -1 ? '-' : Number.isInteger(a) ? String(a) : '(1/2)';
    const E = (p, q, s = A) => `y = ${s}|x ${signed(-p)}| ${signed(q)}`;
    if (d >= 2 && rand() < .4) {
      const right = a > 0 ? `y ≥ ${k}` : `y ≤ ${k}`;
      return {
        topic: 'FUNCTIONS', text: `What is the range of ${E(h, k)}?`,
        ...textual(right, [a > 0 ? `y ≤ ${k}` : `y ≥ ${k}`, `y ≥ ${h}`, 'All real numbers', `y ≥ ${-k}`]),
        steps: [`The vertex is (${h}, ${k}).`, a > 0 ? 'It opens up, so y never goes below the vertex.' : 'It opens down, so y never goes above the vertex.', right],
      };
    }
    const neg = a < 0 ? (a === -1 ? '' : String(-a)) : (a === 1 ? '-' : `-${A}`);
    return {
      topic: 'FUNCTIONS', text: 'Which equation is graphed?', size: [96, 80],
      ...textual(E(h, k), [E(-h, k), E(h, -k), E(-h, -k), E(h, k, a < 0 ? neg : neg)].filter((v, i, s) => s.indexOf(v) === i)),
      steps: [`The vertex is (${h}, ${k}), so it's ${A}|x - h| + k with h = ${h}, k = ${k}.`, a < 0 ? 'It opens down, so a is negative.' : 'It opens up, so a is positive.', E(h, k)],
      fig: (c, w, hh) => { const P = F.grid(c, w, hh, [-6, 6], [-6, 6]); F.plot(c, P, x => a * Math.abs(x - h) + k, [-6, 6], HOT); F.dot(c, P(h, k), RED); },
    };
  };

  // F.IF.7e, F.LE.2, A.SSE.3c: exponential graphs and compound interest.
  kinds.expGraph = d => {
    const f = d < 2 ? pick([0, 1]) : d < 3 ? randInt(0, 2) : randInt(0, 3);
    if (f === 0) {
      const a = randInt(1, 3), b = pick([2, 3, 1 / 2]), B = b === 1 / 2 ? '(1/2)' : `(${b})`, Y = (p, q) => `y = ${p === 1 ? (q === '(1/2)' ? q : q.slice(1, -1)) : p + q}^x`;
      return {
        topic: 'EXPONENTIAL', text: 'Which equation is graphed?', size: [96, 80],
        ...textual(Y(a, B), [Y(a, b === 2 ? '(3)' : '(2)'), Y(a * (b === 1 / 2 ? 2 : 1), b === 1 / 2 ? '(2)' : '(1/2)'), Y(a + 1, B), `y = ${lin(a * b === a ? 1 : Math.round(a * b - a) || 1, a)}`]),
        steps: [`At x = 0 the graph is at y = ${a}: that's the starting value.`, `From x = 0 to x = 1, y goes from ${a} to ${show(a * b)}: times ${show(b)}.`, Y(a, B)],
        fig: (c, w, h) => { const P = F.grid(c, w, h, [-4, 4], [-1, 9]); F.plot(c, P, x => a * b ** x, [-4, 4], HOT); F.dot(c, P(0, a), RED); F.dot(c, P(1, a * b), RED); },
      };
    }
    if (f === 1) {
      const up = rand() < .5, b = up ? pick([1.2, 1.5, 2, 3]) : pick([.25, .5, .8, .9]), a = pick([4, 5, 6, 7, 8, 9]);
      const right = `${up ? 'Growth' : 'Decay'}; y-intercept ${a}`;
      return {
        topic: 'EXPONENTIAL', text: `Which describes the graph of y = ${a}(${b})^x?`,
        ...textual(right, [`Growth; y-intercept ${a}`, `Decay; y-intercept ${a}`, `Growth; y-intercept ${b}`, `Decay; y-intercept ${b}`]),
        steps: [`b = ${b} is ${up ? 'more' : 'less'} than 1: ${up ? 'growth' : 'decay'}.`, `At x = 0, y = ${a}(1) = ${a}.`],
      };
    }
    if (f === 2) {
      const P0 = pick([1000, 2000, 2500, 5000]), r = pick([3, 4, 5, 6, 8]), [n, word] = pick([[4, 'quarterly'], [12, 'monthly'], [2, 'twice a year']]), R = r / 100;
      const right = `${cm(P0)}(1 + ${R}/${n})^{${n}t}`;
      return {
        topic: 'EXPONENTIAL', text: `$${cm(P0)} is invested at ${r}% interest, compounded ${word}. Which expression gives the balance after t years?`,
        ...textual(right, [`${cm(P0)}(1 + ${R})^{${n}t}`, `${cm(P0)}(1 + ${R}/${n})^t`, `${cm(P0)}(1 + ${r}/${n})^{${n}t}`, `${cm(P0)}(1 + ${R}t)`]),
        steps: ['Compound interest: P(1 + r/n)^{nt}', `r = ${R} as a decimal; n = ${n} times a year.`, right],
      };
    }
    const P0 = pick([1000, 2000, 4000]), r = pick([5, 10, 20]), t = 2, A = P0 * (1 + r / 100) ** t;
    return {
      topic: 'EXPONENTIAL', text: `$${cm(P0)} earns ${r}% interest compounded once a year. What is the balance after 2 years?`,
      ...numeric(r2(A), [P0 * (1 + 2 * r / 100), P0 * (1 + r / 100), r2(A + P0 * r / 100), P0 * (r / 100) ** 2 + P0], money),
      steps: [`Each year multiply by ${1 + r / 100}.`, `${cm(P0)} × ${1 + r / 100}^2 = ${cm(P0)} × ${r2((1 + r / 100) ** 2)}`, `= ${money(r2(A))}`],
    };
  };

  // F.BF.1b: adding, subtracting, multiplying and dividing functions.
  kinds.funcOps = d => {
    const a = nz(-5, 5), b = nz(-7, 7), e = nz(-7, 7), op = pick(d < 3 ? ['+', '-'] : ['+', '-', '×', '÷']);
    let c; do c = nz(-4, 4); while (c === a || c === -a);
    if (op === '÷') {
      const k = randInt(-3, 4), gv = c * k + e;
      if (gv === 0) return kinds.funcOps(2);
      const fv = a * k + b, ans = fv / gv;
      return {
        topic: 'FUNCTIONS', text: `If f(x) = ${lin(a, b)} and g(x) = ${lin(c, e)}, what is (f/g)(${k})?`,
        ...numeric(ans, [gv / fv, fv - gv, fv * gv, (a / c)], show),
        steps: [`f(${k}) = ${fv} and g(${k}) = ${gv}`, `(f/g)(${k}) = ${fv} ÷ ${gv} = ${show(ans)}`],
      };
    }
    if (op === '×') {
      const right = px([a * c, a * e + b * c, b * e]);
      return {
        topic: 'FUNCTIONS', text: `If f(x) = ${lin(a, b)} and g(x) = ${lin(c, e)}, which is (f · g)(x)?`,
        ...textual(right, [px([a * c, 0, b * e]), lin(a + c, b + e), px([a * c, a * e - b * c, b * e]), px([a * c, a * e + b * c, -b * e])]),
        steps: ['(f · g)(x) = f(x) × g(x)', `(${lin(a, b)})(${lin(c, e)})`, `= ${right}`],
      };
    }
    const g2 = rand() < .5, G = g2 ? px([1, c, e]) : lin(c, e), sgn = op === '+' ? 1 : -1;
    const res = g2 ? px([sgn, a + sgn * c, b + sgn * e]) : lin(a + sgn * c, b + sgn * e);
    const wrong = g2 ? px([sgn, a + sgn * c, b - sgn * e]) : lin(a + sgn * c, b - sgn * e), wrong2 = g2 ? px([sgn, a - sgn * c, b + sgn * e]) : lin(a - sgn * c, b + sgn * e);
    return {
      topic: 'FUNCTIONS', text: `If f(x) = ${lin(a, b)} and g(x) = ${G}, which is (f ${op} g)(x)?`,
      ...textual(res, [wrong, wrong2, g2 ? px([-sgn, a + sgn * c, b + sgn * e]) : lin(a * c, b * e), g2 ? px([1, a * c, b * e]) : lin(a + sgn * c + 1, b + sgn * e)]),
      steps: [`(f ${op} g)(x) = (${lin(a, b)}) ${op} (${G})`, op === '-' ? 'The minus sign hits every term of g.' : 'Combine like terms.', `= ${res}`],
    };
  };

  // A.APR.2, A.APR.6: long division and synthetic division.
  kinds.polyDivision = d => {
    const f = d < 4 ? pick([0, 1]) : randInt(0, 2);
    if (f === 0) {
      let r, q; do { r = nz(-7, 7); q = nz(-7, 7); } while (q === r || q === -r);
      const num = px([1, q - r, -q * r]);
      return {
        topic: 'POLYNOMIALS', text: `Which is equal to (${num}) ÷ (x ${signed(-r)})?`,
        ...textual(lin(1, q), [lin(1, -q), lin(1, r), lin(1, q - r), lin(1, -r), lin(1, q + 1)].filter(v => v !== lin(1, q))),
        steps: [`Divide x^2 by x: x. Multiply back: ${px([1, -r, 0])}`, `Subtract: ${px([q, -q * r])}. Divide by x: ${q}`, `The quotient is ${lin(1, q)} with no remainder.`],
      };
    }
    if (f === 1) {
      const a = nz(-5, 5), b = nz(-6, 6), c = nz(-9, 9), r = nz(-3, 3), q1 = a + r, q0 = b + r * q1, R = c + r * q0;
      const Q = (x1, x0, rem) => `${px([1, x1, x0])}, R ${rem}`;
      const ra = -r, q1b = a + ra, q0b = b + ra * q1b, Rb = c + ra * q0b;
      return {
        topic: 'POLYNOMIALS', text: `Use synthetic division to divide ${px([1, a, b, c])} by x ${signed(-r)}. What are the quotient and remainder?`,
        ...textual(Q(q1, q0, R), [Q(q1b, q0b, Rb), Q(q1, q0, R + r), Q(q1, q0 + 1, R - 1), Q(a, b, c), Q(q1, q0, -R)].filter(v => v !== Q(q1, q0, R))),
        steps: [`Use ${r} (from x ${signed(-r)}) with the coefficients 1, ${a}, ${b}, ${c}.`, `Bring down 1; then ${a} + (${r})(1) = ${q1}; ${b} + (${r})(${q1}) = ${q0}; ${c} + (${r})(${q0}) = ${R}.`, `Quotient ${px([1, q1, q0])}, remainder ${R}.`],
      };
    }
    const r = nz(-4, 4), s0 = randInt(1, 6), rem = nz(-8, 8), P = [1, -r, s0, -r * s0 + rem];
    return {
      topic: 'POLYNOMIALS', text: `When p(x) is divided by x ${signed(-r)}, the quotient is x^2 + ${s0} and the remainder is ${rem}. What is p(x)?`,
      ...textual(px(P), [px([1, r, s0, r * s0 + rem]), px([1, -r, s0, -r * s0 - rem]), px([1, -r, s0, rem]), px([1, 0, s0, rem])]),
      steps: ['p(x) = (divisor)(quotient) + remainder', `(x ${signed(-r)})(x^2 + ${s0}) ${signed(rem)}`, `= ${px(P)}`],
    };
  };

  // A.APR.4, A.APR.5, A.SSE.2: polynomial identities, cubes, grouping, the binomial theorem.
  const choose = (n, k) => { let v = 1; for (let i = 1; i <= k; i++) v = v * (n - k + i) / i; return Math.round(v); };
  kinds.polyIdentity = d => {
    const f = d < 4 ? randInt(0, 2) : randInt(0, 3);
    if (f === 0) {
      const a = pick([1, 1, 2]), b = randInt(1, 5), plus = rand() < .5, A = term(a), s = plus ? '+' : '-', t = plus ? '-' : '+';
      const right = `(${A} ${s} ${b})(${a * a === 1 ? '' : a * a}x^2 ${t} ${a * b === 1 ? '' : a * b}x + ${b * b})`;
      return {
        topic: 'POLYNOMIALS', text: `Which is a factorization of ${a ** 3 === 1 ? '' : a ** 3}x^3 ${s} ${b ** 3}?`,
        ...textual(right, [`(${A} ${s} ${b})(${a * a === 1 ? '' : a * a}x^2 ${s} ${a * b === 1 ? '' : a * b}x + ${b * b})`, `(${A} ${s} ${b})^3`, `(${A} ${t} ${b})(${a * a === 1 ? '' : a * a}x^2 ${s} ${a * b === 1 ? '' : a * b}x + ${b * b})`, `(${A} ${s} ${b})(${a * a === 1 ? '' : a * a}x^2 + ${b * b})`]),
        steps: [plus ? 'Sum of cubes: p^3 + q^3 = (p + q)(p^2 - pq + q^2)' : 'Difference of cubes: p^3 - q^3 = (p - q)(p^2 + pq + q^2)', `Here p = ${A} and q = ${b}.`, right],
      };
    }
    if (f === 1) {
      const p = nz(-6, 6), q = randInt(1, 7), right = `(x ${signed(p)})(x^2 + ${q})`;
      return {
        topic: 'POLYNOMIALS', text: `Factor by grouping: ${px([1, p, q, p * q])}`,
        ...textual(right, [`(x ${signed(-p)})(x^2 + ${q})`, `(x ${signed(p)})(x^2 - ${q})`, `(x ${signed(q)})(x^2 ${signed(p)})`, `(x^2 ${signed(p)})(x + ${q})`]),
        steps: [`Group: (${px([1, p, 0, 0])}) + (${px([q, p * q])})`, `x^2(x ${signed(p)}) + ${q}(x ${signed(p)})`, right],
      };
    }
    if (f === 2) {
      const n = randInt(3, 6), k = randInt(1, n - 1), a = randInt(1, 3), coef = choose(n, k) * a ** (n - k);
      return {
        topic: 'POLYNOMIALS', text: `What is the coefficient of x^${k} when (x + ${a})^${n} is expanded?`,
        ...numeric(coef, [choose(n, k), a ** (n - k), choose(n, k) * a ** k, n * a, coef + choose(n, k)], cm),
        steps: [`Binomial theorem: the x^${k} term is C(${n}, ${k}) x^${k} (${a})^{${n - k}}.`, `C(${n}, ${k}) = ${choose(n, k)} and ${a}^${n - k} = ${a ** (n - k)}`, `${choose(n, k)} × ${a ** (n - k)} = ${cm(coef)}`],
      };
    }
    const ids = [['(x + y)^2 = x^2 + 2xy + y^2', true], ['(x - y)(x + y) = x^2 - y^2', true], ['x^3 + y^3 = (x + y)(x^2 - xy + y^2)', true], ['(x - y)^2 = x^2 - 2xy + y^2', true],
      ['(x + y)^2 = x^2 + y^2', false], ['x^3 + y^3 = (x + y)^3', false], ['(x - y)^2 = x^2 - y^2', false], ['x^2 + y^2 = (x + y)(x - y)', false]];
    const askTrue = rand() < .6, right = pick(ids.filter(i => i[1] === askTrue))[0];
    return {
      topic: 'POLYNOMIALS', text: `Which equation is ${askTrue ? 'an identity (true for all x and y)' : 'NOT an identity'}?`,
      ...textual(right, shuffle(ids.filter(i => i[1] !== askTrue)).map(i => i[0])),
      steps: ['Test x = 1 and y = 1, or expand both sides.', `${right}: ${askTrue ? 'both sides always match.' : 'the sides differ, e.g. at x = 1, y = 1.'}`],
    };
  };

  // F.IF.7c, A.APR.3, F.BF.3: polynomial graphs, end behavior, multiplicity, even and odd.
  kinds.polyGraph = d => {
    const f = randInt(0, 3);
    if (f === 0) {
      const n = randInt(2, 7), a = nz(-5, 5), lead = `${a === 1 ? '' : a === -1 ? '-' : a}x^${n}`, rest = px([0, nz(-6, 6), nz(-9, 9)]).replace(/^-/, '- ').replace(/^(?=[\dx])/, '+ ');
      const right = n % 2 === 0 ? (a > 0 ? 'Both ends rise' : 'Both ends fall') : (a > 0 ? 'Falls left, rises right' : 'Rises left, falls right');
      return {
        topic: 'POLYNOMIALS', text: `Which describes the end behavior of f(x) = ${lead} ${rest}?`,
        ...textual(right, ['Both ends rise', 'Both ends fall', 'Falls left, rises right', 'Rises left, falls right']),
        steps: [`The leading term ${lead} decides: degree ${n} (${n % 2 ? 'odd' : 'even'}), coefficient ${a > 0 ? 'positive' : 'negative'}.`, `So: ${right.toLowerCase()}.`],
      };
    }
    if (f === 1) {
      let p, q; do { p = randInt(-3, 3); q = randInt(-3, 3); } while (p === q || Math.abs(p - q) < 2);
      const g = x => (x - p) * (x - p) * (x - q);
      let top = 0; for (let x = Math.min(p, q) - 1; x <= Math.max(p, q) + 1; x += .05) top = Math.max(top, Math.abs(g(x)));
      return {
        topic: 'POLYNOMIALS', text: `The graph of y = ${p === 0 ? 'x^2' : `(x ${signed(-p)})^2`}${q === 0 ? 'x' : `(x ${signed(-q)})`} is shown. At which x does it touch the x-axis without crossing?`, size: [96, 70],
        ...numeric(p, [q, -p, -q, p + q].filter(v => v !== p)),
        steps: [`The factor ${p === 0 ? 'x' : `(x ${signed(-p)})`} is squared: a double zero at x = ${p}.`, 'At a double zero the graph touches and turns back.', `At x = ${q} (single) it crosses.`],
        fig: (c, w, h) => { const P = F.grid(c, w, h, [-5, 5], [-6, 6], 1, 2); F.plot(c, P, x => g(x) * 5 / top, [-5, 5], HOT); },
      };
    }
    if (f === 2) {
      const even = ['f(x) = x^4 - 3x^2', 'f(x) = |x| + 2', 'f(x) = x^2 + 5', 'f(x) = 2x^6 - x^2'], odd = ['f(x) = x^3 + x', 'f(x) = x^5 - 4x', 'f(x) = -2x^3', 'f(x) = x^3 - 7x'], neither = ['f(x) = x^2 + x', 'f(x) = x^3 + 1', 'f(x) = 2x - 3', 'f(x) = (x - 1)^2'];
      const askEven = rand() < .5, right = pick(askEven ? even : odd);
      return {
        topic: 'POLYNOMIALS', text: `Which function is ${askEven ? 'even' : 'odd'}?`,
        ...textual(right, [pick(askEven ? odd : even), ...shuffle([...neither]).slice(0, 3)]),
        steps: [askEven ? 'Even: f(-x) = f(x). Only even powers (or |x|) and constants.' : 'Odd: f(-x) = -f(x). Only odd powers, no constant.', `${right} fits.`],
      };
    }
    const n = randInt(3, 7), right = n;
    return {
      topic: 'POLYNOMIALS', text: `How many zeros, counting complex zeros and repeats, does f(x) = ${px([1, nz(-5, 5), 0, nz(-9, 9)].concat(Array(n - 3).fill(0)).slice(0, n + 1)).replace(/x\^(\d)/, 'x^$1')} have?`,
      ...numeric(right, [n - 1, n + 1, n - 2, 2 * n]),
      steps: ['The Fundamental Theorem of Algebra: a degree-n polynomial has n zeros, counting complex ones and repeats.', `The degree is ${n}, so it has ${n} zeros.`],
    };
  };

  // A.APR.6, A.APR.7: simplifying, multiplying and adding rational expressions.
  kinds.rationalExpr = d => {
    const f = d < 3 ? pick([0, 3]) : randInt(0, 3);
    if (f === 0) {
      let p, q, r; do { p = nz(-6, 6); q = nz(-6, 6); r = nz(-6, 6); } while (new Set([p, q, r]).size < 3);
      const top = px([1, p + q, p * q]), bot = px([1, p + r, p * r]), right = `(${lin(1, q)})/(${lin(1, r)})`;
      return {
        topic: 'RATIONAL EXPR', text: `Simplify (${top})/(${bot}). Assume no denominator is 0.`,
        ...textual(right, [`(${lin(1, -q)})/(${lin(1, -r)})`, `(${lin(1, p)})/(${lin(1, r)})`, fr(q, r), `(${lin(1, q)})/(${lin(1, p)})`, `(${lin(1, r)})/(${lin(1, q)})`].filter(v => v !== right)),
        steps: [`Factor: (${lin(1, p)})(${lin(1, q)}) over (${lin(1, p)})(${lin(1, r)})`, `Cancel the common factor (${lin(1, p)}).`, right],
      };
    }
    if (f === 1) {
      const a = randInt(2, 6), b = randInt(2, 6), c = randInt(2, 6), e = randInt(2, 6), k = gcd(a * c, b * e);
      const num = a * c / k, den = b * e / k, coef = den === 1 ? (num === 1 ? '' : String(num)) : `(${num}/${den})`;
      const right = `${coef}xy`;
      return {
        topic: 'RATIONAL EXPR', text: `For x and y not 0, which is equivalent to (${a}x^2)/(${b}y) · (${c}y^2)/(${e}x)?`,
        ...textual(right, [`${coef}x^2y^2`, `${coef}x^3y^3`, `(${a + c}/${b + e})xy`, `${coef}`, `(${a * e}/${b * c})xy`].filter(v => v !== right)),
        steps: [`Multiply tops and bottoms: (${a * c}x^2y^2)/(${b * e}xy)`, `Cancel one x and one y; reduce ${a * c}/${b * e}.`, `= ${right}`],
      };
    }
    if (f === 2) {
      const a = randInt(1, 5), b = randInt(1, 5), p = randInt(1, 6), top = px([a + b, a * p]), right = `(${top})/(x^2 + ${p}x)`;
      return {
        topic: 'RATIONAL EXPR', text: `Which is equivalent to ${a}/x + ${b}/(x + ${p})?`,
        ...textual(right, [`${a + b}/(2x + ${p})`, `${a + b}/(x^2 + ${p}x)`, `(${px([a + b, b * p])})/(x^2 + ${p}x)`, `(${top})/(2x + ${p})`]),
        steps: [`Common denominator: x(x + ${p}) = x^2 + ${p}x`, `Tops: ${a}(x + ${p}) + ${b}x = ${top}`, right],
      };
    }
    let r, s; do { r = nz(-7, 7); s = nz(-7, 7); } while (r === s || r === -s);
    const k = nz(-6, 6), q = px([1, -(r + s), r * s]), lo = Math.min(r, s), hi = Math.max(r, s);
    return {
      topic: 'RATIONAL EXPR', text: `For which values of x is (x ${signed(k)})/(${q}) not defined?`,
      ...textual(`x = ${lo} and x = ${hi}`, [`x = ${-hi} and x = ${-lo}`, `x = ${-k}`, `x = ${-k}, ${lo} and ${hi}`, `x = ${r * s}`]),
      steps: ['A fraction is not defined where its denominator is 0.', `${q} = (x ${signed(-r)})(x ${signed(-s)}) = 0`, `x = ${lo} or x = ${hi}`],
    };
  };

  // A.REI.2, A.CED.1: rational equations, extraneous solutions, work problems.
  kinds.rationalEq = d => {
    const f = randInt(0, 2);
    if (f === 0) {
      let r, s, tries = 0; do { r = randInt(2, 9); s = -randInt(1, 8); } while ((r + s === 0) && ++tries < 20);
      const m = r + s, kn = -r * s, divs = []; for (let i = 1; i <= kn; i++) if (kn % i === 0 && i <= 9) divs.push(i);
      const n = pick(divs), k = kn / n, numer = m === 0 ? 'x' : `(x ${signed(-m)})`;
      return {
        topic: 'RATIONAL EQS', text: `What are the solutions of ${k}/x = ${n === 1 ? numer.replace(/^\((.*)\)$/, '$1') : numer + '/' + n}?`,
        ...textual(`x = ${s} or x = ${r}`, [`x = ${-r} or x = ${-s}`, `x = ${r} only`, `x = ${s} only`, `x = ${k} or x = ${n}`]),
        steps: [`Cross-multiply: ${k * n} = x(x ${signed(-m)})`, `${px([1, -m, -kn])} = 0, so (x ${signed(-r)})(x ${signed(-s)}) = 0`, `x = ${s} or x = ${r}; neither makes a denominator 0.`],
      };
    }
    if (f === 1) {
      const a = nz(-6, 6), c = pick([2, 3]), none = rand() < .5;
      if (none) {
        return {
          topic: 'RATIONAL EQS', text: `Solve x/(x ${signed(-a)}) = ${a}/(x ${signed(-a)}) + ${c}.`,
          ...textual('No solution', [`x = ${a}`, `x = ${-a}`, 'x = 0', `x = ${c}`]),
          steps: [`Multiply by (x ${signed(-a)}): x = ${a} + ${c}(x ${signed(-a)})`, `That gives x = ${a}.`, `But x = ${a} makes the denominator 0: it is extraneous. No solution.`],
        };
      }
      let b; do b = nz(-9, 9); while (b === a || (b - c * a) % (1 - c) !== 0 || (b - c * a) / (1 - c) === a);
      const x = (b - c * a) / (1 - c);
      return {
        topic: 'RATIONAL EQS', text: `Solve x/(x ${signed(-a)}) = ${b}/(x ${signed(-a)}) + ${c}.`,
        ...numeric(x, [a, -x, b, (b + c * a) / (1 + c), x + 1]),
        steps: [`Multiply by (x ${signed(-a)}): x = ${b} + ${c}(x ${signed(-a)})`, `x = ${b} + ${c}x ${signed(-c * a)}, so ${px([1 - c, 0])} = ${b - c * a}`, `x = ${x} (it doesn't make a denominator 0).`],
      };
    }
    const [p, q] = pick([[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [2, 3], [4, 6], [6, 3], [5, 20]]), t = p * q / (p + q);
    return {
      topic: 'RATIONAL EQS', text: `One hose fills a kiddie pool in ${p} hours and another fills it in ${q} hours. How many hours does it take using both?`,
      ...numeric(r2(t), [(p + q) / 2, p + q, Math.abs(p - q), r2(t * 2)], v => String(r2(v))),
      steps: [`Rates: 1/${p} and 1/${q} of the pool per hour.`, `Together: 1/${p} + 1/${q} = ${fr(p + q, p * q)} per hour`, `Time = 1 ÷ ${fr(p + q, p * q)} = ${r2(t)} hours`],
    };
  };

  // F.IF.7d, A.APR.7 and IXL's rational functions: asymptotes and excluded values.
  kinds.rationalFn = d => {
    const a = nz(-5, 5), c = nz(-6, 6), f = d < 4 ? randInt(0, 1) : randInt(0, 2);
    let b = nz(-9, 9); if (b === -a * c) b += b > 0 ? -1 : 1; if (b === 0) b = 1 === -a * c ? 2 : 1;
    const fx = `(${lin(a, b)})/(x ${signed(-c)})`;
    if (f === 0) {
      return {
        topic: 'RATIONAL FN', text: `What is the vertical asymptote of f(x) = ${fx}?`,
        ...textual(`x = ${c}`, [`x = ${-c}`, `y = ${a}`, `x = ${show(-b / a)}`, `y = ${c}`, `x = ${c + 1}`].filter(v => v !== `x = ${c}`)),
        steps: ['A vertical asymptote is where the denominator is 0 (and the top is not).', `x ${signed(-c)} = 0 at x = ${c}`],
      };
    }
    if (f === 1) {
      return {
        topic: 'RATIONAL FN', text: `What is the horizontal asymptote of f(x) = ${fx}?`,
        ...textual(`y = ${a}`, [`y = ${-a}`, `x = ${c}`, `y = ${show(b / -c)}`, 'y = 0', `y = ${a + 1}`].filter(v => v !== `y = ${a}`)),
        steps: ['Top and bottom have the same degree: divide the leading coefficients.', `${a} ÷ 1 = ${a}, so y = ${a}`],
      };
    }
    const h = nz(-3, 3), k = nz(-3, 3), F2 = (p, q) => `y = 1/(x ${signed(-p)}) ${signed(q)}`;
    return {
      topic: 'RATIONAL FN', text: 'The graph has the dashed asymptotes shown. Which equation could it be?', size: [96, 80],
      ...textual(F2(h, k), [F2(-h, k), F2(h, -k), F2(k, h), F2(-h, -k)].filter(v => v !== F2(h, k))),
      steps: [`Vertical asymptote x = ${h}: the bottom is x ${signed(-h)}.`, `Horizontal asymptote y = ${k}: add ${k}.`, F2(h, k)],
      fig: (cc, w, hh) => {
        const P = F.grid(cc, w, hh, [-6, 6], [-6, 6]);
        F.line(cc, P(h, 0)[0], 0, P(h, 0)[0], hh - 1, RED, 2); F.line(cc, 0, P(0, k)[1], w - 1, P(0, k)[1], RED, 2);
        F.plot(cc, P, x => 1 / (x - h) + k, [-6, h - .08], HOT); F.plot(cc, P, x => 1 / (x - h) + k, [h + .08, 6], HOT);
      },
    };
  };

  // F.LE.4, F.BF.5 and IXL's logarithms: evaluate, convert, properties, solve.
  kinds.logs = d => {
    const f = d < 4 ? randInt(0, 3) : randInt(0, 4);
    const LB = (b, x) => `log base ${b} of ${x}`;
    if (f === 0) {
      const [b, n] = pick([[2, 3], [2, 5], [2, 6], [3, 2], [3, 4], [5, 2], [5, 3], [10, 3], [10, 4], [4, 3], [2, -2], [3, -1], [10, -2]]);
      const x = n >= 0 ? cm(b ** n) : `1/${cm(b ** -n)}`;
      const q = b === 10 && rand() < .5 ? `log ${x}` : LB(b, x);
      return {
        topic: 'LOGARITHMS', text: `What is the value of ${q}?`,
        ...numeric(n, [-n, n + 1, n - 1, b * n, Number(String(x).replace(/,/g, '')) / b].filter(Number.isInteger)),
        steps: [`${q} asks: ${b} to what power gives ${x}?`, `${b}^{${n}} = ${x}`, `So the value is ${n}.`],
      };
    }
    if (f === 1) {
      const [b, n] = pick([[2, 5], [3, 4], [5, 3], [4, 3], [10, 2], [6, 2], [2, 7]]), v = cm(b ** n), right = `${LB(b, v)} = ${n}`;
      return {
        topic: 'LOGARITHMS', text: `Which equation is equivalent to ${b}^${n} = ${v}?`,
        ...textual(right, [`${LB(n, v)} = ${b}`, `${LB(b, n)} = ${v}`, `${LB(v, b)} = ${n}`]),
        steps: ['b^n = x means log base b of x = n.', `Base ${b}, power ${n}, result ${v}.`, right],
      };
    }
    if (f === 2) {
      const sets = [
        ['log(x^3y)', '3 log x + log y', ['log(3x) + log y', '3 log(xy)', '3 log x · log y']],
        ['log(x/y^2)', 'log x - 2 log y', ['log x + 2 log y', '2 log(x - y)', 'log x ÷ 2 log y']],
        ['2 log x + log y', 'log(x^2y)', ['log(2xy)', 'log(x^2 + y)', 'log(2x + y)']],
        ['log x - log y', 'log(x/y)', ['log(x - y)', 'log x ÷ log y', 'log(y/x)']],
        ['ln(e^5)', '5', ['e^5', '1/5', 'ln 5']],
        ['log 4 + log 25', '2', ['log 29', '100', '4']],
      ];
      const [e, right, wr] = pick(sets);
      return {
        topic: 'LOGARITHMS', text: `Which is equivalent to ${e}? (Assume x and y are positive.)`, ...textual(right, wr),
        steps: ['log(ab) = log a + log b;  log(a/b) = log a - log b;  log(a^n) = n log a', `So ${e} = ${right}.`],
      };
    }
    if (f === 3) {
      if (rand() < .5) {
        const [b, n] = pick([[2, 5], [3, 4], [5, 3], [2, 6], [4, 3]]), k = randInt(1, 3), x = n - k;
        return {
          topic: 'LOGARITHMS', text: `What is the solution of ${b}^{x+${k}} = ${cm(b ** n)}?`,
          ...numeric(x, [n, n + k, b ** n / b, x - 1]),
          steps: [`${cm(b ** n)} = ${b}^${n}`, `So x + ${k} = ${n}`, `x = ${x}`],
        };
      }
      const [b, v] = pick([[3, 20], [5, 40], [2, 15], [7, 30], [4, 50]]), right = `log ${v}/log ${b}`;
      return {
        topic: 'LOGARITHMS', text: `Which expression gives the solution of ${b}^x = ${v}?`,
        ...textual(right, [`log ${b}/log ${v}`, `${v}/${b}`, `log(${v}/${b})`, `log ${v} - log ${b}`]),
        steps: [`Take the log of both sides: x log ${b} = log ${v}`, `Divide: x = ${right}`],
      };
    }
    const [b, n, k] = pick([[2, 4, 3], [3, 2, 5], [2, 5, -7], [5, 2, -1], [10, 2, -4], [3, 3, 0]]), x = b ** n - k;
    return {
      topic: 'LOGARITHMS', text: `Solve ${LB(b, k ? `(x ${signed(k)})` : 'x')} = ${n}.`,
      ...numeric(x, [b * n - k, n ** b - k, b ** n + k, b ** n].filter(v => v > -k)),
      steps: ['Rewrite in exponential form.', `x ${k ? signed(k) + ' ' : ''}= ${b}^${n} = ${b ** n}`, `x = ${x}`],
    };
  };

  // A.SSE.4, F.BF.2: arithmetic and geometric series.
  kinds.series = d => {
    const f = d < 4 ? randInt(0, 2) : randInt(0, 3);
    if (f === 0) {
      const a = nz(-5, 9), dl = nz(-3, 6), n = pick([10, 12, 15, 20, 25, 30]), last = a + (n - 1) * dl, S = n * (a + last) / 2;
      return {
        topic: 'SERIES', text: `What is the sum of the first ${n} terms of the arithmetic sequence ${[0, 1, 2, 3].map(i => a + i * dl).join(', ')}, ...?`,
        ...numeric(S, [n * (a + last), last, n * a + n * dl, n * (a + last + dl) / 2], cm),
        steps: [`Term ${n}: ${a} + ${n - 1}(${dl}) = ${last}`, `Sum = ${n}(first + last)/2 = ${n}(${a} + ${last < 0 ? '(' + last + ')' : last})/2`, `= ${cm(S)}`],
      };
    }
    if (f === 1) {
      const a = randInt(1, 5), r = pick([2, 3]), n = r === 2 ? randInt(5, 8) : randInt(4, 6), S = a * (r ** n - 1) / (r - 1);
      return {
        topic: 'SERIES', text: `What is the sum of the first ${n} terms of the geometric sequence ${[0, 1, 2].map(i => a * r ** i).join(', ')}, ...?`,
        ...numeric(S, [a * r ** (n - 1), a * r ** n, a * (r ** (n + 1) - 1) / (r - 1), S - a], cm),
        steps: [`Sum = a(r^n - 1)/(r - 1) with a = ${a}, r = ${r}, n = ${n}`, `= ${a}(${r}^${n} - 1)/${r - 1} = ${a}(${r ** n - 1})/${r - 1}`, `= ${cm(S)}`],
      };
    }
    if (f === 2) {
      const [rn, rd] = pick([[1, 2], [1, 3], [1, 4], [2, 3], [-1, 2], [3, 4]]), S = randInt(2, 8) * (rd - rn) * rd, a = S * (rd - rn) / rd;
      const terms = [a, a * rn / rd, a * rn * rn / (rd * rd)].map(show).join(' + ').replace(/\+ -/g, '- ');
      return {
        topic: 'SERIES', text: `What is the sum of the infinite geometric series ${terms} + ...?`,
        ...numeric(S, [a * rd / (rd + rn), a / (1 + rn / rd), 2 * a, a * rd / rn].filter(v => Number.isFinite(v)), show),
        steps: [`a = ${show(a)}, r = ${fr(rn, rd)}. Since |r| < 1, the sum is a/(1 - r).`, `${show(a)} ÷ (1 - ${fr(rn, rd).replace(/^-/, '(-') + (rn < 0 ? ')' : '')}) = ${show(a)} ÷ ${fr(rd - rn, rd)}`, `= ${show(S)}`],
      };
    }
    const [what, first, last, step] = pick([['even numbers from 2 to', 2, 2 * randInt(20, 60), 2], ['whole numbers from 1 to', 1, 10 * randInt(5, 20), 1], ['odd numbers from 1 to', 1, 2 * randInt(15, 50) - 1, 2]]);
    const n = (last - first) / step + 1, S = n * (first + last) / 2;
    return {
      topic: 'SERIES', text: `What is the sum of the ${what} ${last}?`,
      ...numeric(S, [n * (first + last), S + last, last * last / 2, S - first], cm),
      steps: [`There are ${n} numbers.`, `Sum = ${n}(${first} + ${last})/2`, `= ${cm(S)}`],
    };
  };

  // A.REI.6 (three variables) and IXL Algebra 2: systems in x, y and z.
  kinds.system3 = d => {
    let x, y, z, M, det, tries = 0;
    const D3 = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    do {
      x = randInt(-4, 5); y = randInt(-4, 5); z = randInt(-4, 5);
      M = [[1, 1, 1], [1, -1, pick([1, 2, -1])], [pick([2, 1, 3]), pick([1, -1, 2]), -1]];
      det = D3(M);
    } while ((det === 0 || new Set([x, y, z]).size < 3) && ++tries < 60);
    if (tries >= 60) { x = 1; y = 2; z = 3; M = [[1, 1, 1], [1, -1, 1], [2, 1, -1]]; }
    const cst = M.map(r => r[0] * x + r[1] * y + r[2] * z);
    const E = (r, c) => { let s = ''; ['x', 'y', 'z'].forEach((v, i) => { const a = r[i]; if (!a) return; const t = (Math.abs(a) === 1 ? '' : Math.abs(a)) + v; s += s ? (a < 0 ? ' - ' : ' + ') + t : (a < 0 ? '-' : '') + t; }); return `${s} = ${c}`; };
    const T = (a, b, c) => `(${a}, ${b}, ${c})`, right = T(x, y, z);
    return {
      topic: 'SYSTEMS', text: `Solve the system:\n${E(M[0], cst[0])}\n${E(M[1], cst[1])}\n${E(M[2], cst[2])}`,
      ...textual(right, [T(y, x, z), T(x, z, y), T(-x, y, z), T(x, -y, z), T(z, y, x)].filter(v => v !== right)),
      steps: ['Use pairs of equations to eliminate the same variable twice.', 'Solve the 2-variable system that is left, then substitute back.', `The solution is ${right}. Check it in all three.`],
    };
  };

  // IXL Algebra 2: quadratic inequalities.
  kinds.quadIneq = d => {
    let r, s; do { r = randInt(-7, 6); s = randInt(-6, 7); } while (r >= s || r === -s);
    const op = pick(['<', '>', '≤', '≥']), inside = op === '<' || op === '≤', strict = op.length && (op === '<' || op === '>');
    const lt = strict ? '<' : '≤', gt = strict ? '>' : '≥';
    const I = (a, b) => `${a} ${lt} x ${lt} ${b}`, O = (a, b) => `x ${lt} ${a} or x ${gt} ${b}`;
    const right = inside ? I(r, s) : O(r, s);
    return {
      topic: 'QUADRATICS', text: `Which describes all solutions of ${px([1, -(r + s), r * s])} ${op} 0?`,
      ...textual(right, [inside ? O(r, s) : I(r, s), inside ? I(-s, -r) : O(-s, -r), inside ? O(-s, -r) : I(-s, -r)]),
      steps: [`Zeros: (x ${signed(-r)})(x ${signed(-s)}) = 0 at x = ${r} and x = ${s}.`, `The parabola opens up: it is ${inside ? 'below 0 between' : 'above 0 outside'} the zeros.`, right],
    };
  };

  // N.CN.3 (+): conjugates, moduli and dividing complex numbers.
  kinds.complexDivide = d => {
    const f = randInt(0, 2);
    if (f === 0) {
      const [a, b, m] = pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [7, 24, 25]]), sa = pick([1, -1]), sb = pick([1, -1]);
      return {
        topic: 'COMPLEX NUMS', text: `What is the absolute value |${cx(sa * a, sb * b)}|?`,
        ...numeric(m, [a + b, m * m, Math.abs(a - b), a * b]),
        steps: ['|a + bi| = √(a^2 + b^2)', `√(${a * a} + ${b * b}) = √${m * m} = ${m}`],
      };
    }
    if (f === 1) {
      const a = nz(-8, 8), b = nz(-8, 8);
      return {
        topic: 'COMPLEX NUMS', text: `If i = √-1, what is (${cx(a, b)})(${cx(a, -b)})?`,
        ...textual(String(a * a + b * b), [String(a * a - b * b), cx(a * a, b * b), cx(a * a - b * b, 2 * a * b), String(a * a + b * b + 2 * a * b)].filter(v => v !== String(a * a + b * b))),
        steps: ['A number times its conjugate: (a + bi)(a - bi) = a^2 + b^2', `${a * a} + ${b * b} = ${a * a + b * b}`],
      };
    }
    let p, q, c, e, num, tries = 0;
    do { p = nz(-5, 5); q = nz(-5, 5); c = nz(-4, 4); e = nz(-4, 4); num = [p * c - q * e, p * e + q * c]; } while ((num[0] === 0 || num[1] === 0) && ++tries < 50);
    if (tries >= 50) { p = 2; q = 1; c = 1; e = 1; num = [1, 3]; }
    return {
      topic: 'COMPLEX NUMS', text: `If i = √-1, which is equal to (${cx(...num)})/(${cx(c, e)})?`,
      ...textual(cx(p, q), [cx(q, p), cx(p, -q), cx(-p, q), cx(num[0] / c, num[1] / e).includes('.') ? cx(p + 1, q) : cx(num[0] / c, num[1] / e)].filter(v => v !== cx(p, q))),
      steps: [`Multiply top and bottom by the conjugate ${cx(c, -e)}.`, `The bottom becomes ${c * c} + ${e * e} = ${c * c + e * e}.`, `The result simplifies to ${cx(p, q)}.`],
    };
  };

  // N.VM.6-12 (+) and IXL Algebra 2: matrices.
  function matrixFig(c, w, h, mats) {
    const n = mats.length, slot = Math.floor(w / n);
    mats.forEach(([name, M], k) => {
      const rows = M.length, cols = M[0].length, cw = 16, top = Math.round((h - rows * 12) / 2), x0 = k * slot + 22;
      F.label(c, name + ' =', k * slot + 10, h / 2, HOT);
      const x1 = x0 + cols * cw + 2;
      F.line(c, x0, top - 1, x0, top + rows * 12, INK); F.line(c, x0, top - 1, x0 + 2, top - 1, INK); F.line(c, x0, top + rows * 12, x0 + 2, top + rows * 12, INK);
      F.line(c, x1, top - 1, x1, top + rows * 12, INK); F.line(c, x1 - 2, top - 1, x1, top - 1, INK); F.line(c, x1 - 2, top + rows * 12, x1, top + rows * 12, INK);
      M.forEach((r, i) => r.forEach((v, j) => F.label(c, String(v), x0 + 1 + cw * j + cw / 2, top + 6 + i * 12)));
    });
  }
  kinds.matrices = d => {
    const f = randInt(0, 3), R = () => [[nz(-5, 6), nz(-5, 6)], [nz(-5, 6), nz(-5, 6)]], A = R(), B = R();
    if (f === 3) {
      const [m, n, p] = [randInt(2, 4), randInt(2, 4), randInt(2, 4)], ok = rand() < .7, n2 = ok ? n : n + 1;
      const right = ok ? `${m} × ${p}` : 'Not defined';
      return {
        topic: 'MATRICES', text: `Matrix A is ${m} × ${n} and matrix B is ${n2} × ${p}. What are the dimensions of AB?`,
        ...textual(right, [`${m} × ${p}`, `${n} × ${n2}`, `${p} × ${m}`, 'Not defined', `${m} × ${n2}`, `${n} × ${p}`, `${m + 1} × ${p}`, `${m} × ${p + 1}`].filter(v => v !== right)),
        steps: ['AB is defined when A has as many columns as B has rows.', ok ? `${n} = ${n2}: AB is ${m} × ${p} (rows of A, columns of B).` : `${n} ≠ ${n2}, so AB is not defined.`],
      };
    }
    const i = randInt(0, 1), j = randInt(0, 1), RC = `row ${i + 1}, column ${j + 1}`;
    if (f === 0) {
      const k = randInt(2, 3), ans = k * A[i][j] - B[i][j];
      return {
        topic: 'MATRICES', text: `What is the entry in ${RC} of ${k}A - B?`, size: [130, 34],
        ...numeric(ans, [A[i][j] - B[i][j], k * (A[i][j] - B[i][j]), k * A[i][j] + B[i][j], k * B[i][j] - A[i][j]]),
        steps: [`Entry by entry: ${k} × ${A[i][j]} - ${B[i][j] < 0 ? '(' + B[i][j] + ')' : B[i][j]}`, `= ${ans}`],
        fig: (c, w, h) => matrixFig(c, w, h, [['A', A], ['B', B]]),
      };
    }
    if (f === 1) {
      const ans = A[i][0] * B[0][j] + A[i][1] * B[1][j], ba = B[i][0] * A[0][j] + B[i][1] * A[1][j];
      return {
        topic: 'MATRICES', text: `What is the entry in ${RC} of the product AB?`, size: [130, 34],
        ...numeric(ans, [A[i][j] * B[i][j], ba, A[i][0] * B[j][0] + A[i][1] * B[j][1], ans + 1]),
        steps: [`Row ${i + 1} of A times column ${j + 1} of B:`, `(${A[i][0]})(${B[0][j]}) + (${A[i][1]})(${B[1][j]})`, `= ${ans}`],
        fig: (c, w, h) => matrixFig(c, w, h, [['A', A], ['B', B]]),
      };
    }
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    return {
      topic: 'MATRICES', text: 'What is the determinant of matrix A?', size: [70, 34],
      ...numeric(det, [A[0][0] * A[1][1] + A[0][1] * A[1][0], A[0][1] * A[1][0] - A[0][0] * A[1][1], A[0][0] * A[1][0] - A[0][1] * A[1][1], A[0][0] + A[1][1]]),
      steps: ['det = ad - bc', `(${A[0][0]})(${A[1][1]}) - (${A[0][1]})(${A[1][0]})`, `= ${det}`],
      fig: (c, w, h) => matrixFig(c, w, h, [['A', A]]),
    };
  };

  // ---- Trigonometry beyond the right triangle

  // Exact values on the unit circle: sin, cos and tan of the special angles.
  const EXACT = [[0, '0'], [.5, '1/2'], [Math.SQRT2 / 2, '√2/2'], [Math.sqrt(3) / 2, '√3/2'], [1, '1'], [Math.sqrt(3), '√3'], [Math.sqrt(3) / 3, '√3/3']];
  const exact = v => { if (!Number.isFinite(v) || Math.abs(v) > 1e6) return 'Undefined'; const e = EXACT.find(([x]) => Math.abs(Math.abs(v) - x) < 1e-9); return e ? (v < -1e-9 ? '-' : '') + e[1] : null; };
  const SPECIAL = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
  const radStr = deg => pif(deg / 180).replace(/^0π$/, '0');
  kinds.unitCircle = d => {
    const f = d < 4 ? randInt(0, 3) : randInt(0, 4);
    if (f === 0) {
      const deg = pick(SPECIAL.filter(v => v % 90)), fn = pick(['sin', 'cos', 'tan']), rad = rand() < .5, t = deg * DEG;
      const val = fn === 'sin' ? Math.sin(t) : fn === 'cos' ? Math.cos(t) : Math.tan(t), right = exact(val);
      const flip = right.startsWith('-') ? right.slice(1) : '-' + right, other = exact(fn === 'sin' ? Math.cos(t) : Math.sin(t));
      return {
        topic: 'TRIGONOMETRY', text: `What is the exact value of ${fn}(${rad ? radStr(deg) : deg + '°'})?`,
        ...textual(right, [flip, other, other.startsWith('-') ? other.slice(1) : '-' + other, exact(1 / val), '1/2', '-√3/2', '√2/2'].filter(v => v && v !== right)),
        steps: [`${rad ? `${radStr(deg)} is ${deg}°. ` : ''}The reference angle is ${[deg % 180, 180 - deg % 180].map(v => Math.min(v, 180 - v))[0]}°.`, `In quadrant ${deg < 90 ? 'I' : deg < 180 ? 'II' : deg < 270 ? 'III' : 'IV'}, ${fn} is ${val < 0 ? 'negative' : 'positive'}.`, `${fn}(${rad ? radStr(deg) : deg + '°'}) = ${right}`],
      };
    }
    if (f === 1) {
      const deg = pick(SPECIAL.filter(v => v % 90)), t = deg * DEG, X = exact(Math.cos(t)), Y = exact(Math.sin(t)), right = pt(X, Y);
      const neg = s => s.startsWith('-') ? s.slice(1) : '-' + s;
      return {
        topic: 'TRIGONOMETRY', text: `The terminal side of a ${deg}° angle meets the unit circle at P, as shown. What are the coordinates of P?`, size: [80, 72],
        ...textual(right, [pt(Y, X), pt(neg(X), Y), pt(X, neg(Y)), pt(neg(Y), neg(X)), pt(neg(X), neg(Y))].filter(v => v !== right)),
        steps: ['On the unit circle, P = (cos θ, sin θ).', `cos ${deg}° = ${X} and sin ${deg}° = ${Y}`, right],
        fig: (c, w, h) => {
          const cx = Math.round(w / 2), cy = Math.round(h / 2), R = Math.min(w, h) / 2 - 6;
          F.line(c, 2, cy, w - 3, cy, DIM); F.line(c, cx, 2, cx, h - 3, DIM); F.circle(c, cx, cy, R, INK);
          const Pp = [cx + Math.cos(t) * R, cy - Math.sin(t) * R];
          F.line(c, cx, cy, ...Pp, HOT); F.dot(c, Pp.map(Math.round), RED); F.arc(c, cx, cy, 7, 0, t, HOT);
          F.label(c, 'P', Pp[0] + (Math.cos(t) > 0 ? 6 : -6), Pp[1] + (Math.sin(t) > 0 ? -5 : 6));
        },
      };
    }
    if (f === 2) {
      const [p, q, r] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]), quad = pick([2, 3, 4]), giveSin = rand() < .5;
      const sSign = quad === 2 ? 1 : -1, cSign = quad === 4 ? 1 : -1, given = giveSin ? sSign * p : cSign * p, want = giveSin ? cSign * q : sSign * q;
      return {
        topic: 'TRIGONOMETRY', text: `${giveSin ? 'sin' : 'cos'} θ = ${fr(given, r)}, and θ is in quadrant ${['', 'I', 'II', 'III', 'IV'][quad]}. What is ${giveSin ? 'cos' : 'sin'} θ?`,
        ...textual(fr(want, r), [fr(-want, r), fr(want, p), fr(p, r), fr(-p, r), fr(-want, p)].filter(v => v !== fr(want, r))),
        steps: ['sin^2 θ + cos^2 θ = 1', `${giveSin ? 'cos' : 'sin'}^2 θ = 1 - ${p * p}/${r * r} = ${q * q}/${r * r}, so it is ±${q}/${r}.`, `In quadrant ${['', 'I', 'II', 'III', 'IV'][quad]} it is ${want < 0 ? 'negative' : 'positive'}: ${fr(want, r)}`],
      };
    }
    if (f === 3) {
      if (rand() < .5) {
        const deg = randInt(1, 35) * 10 + pick([0, 5]), k = pick([1, -1]), right = deg + 360 * k;
        return {
          topic: 'TRIGONOMETRY', text: `Which angle is coterminal with ${deg}°?`,
          ...numeric(right, [deg + 180, 360 - deg, deg - 180, -deg, deg + 90].filter(v => (v - deg) % 360 !== 0), v => v + '°'),
          steps: ['Coterminal angles differ by a multiple of 360°.', `${deg}° ${k > 0 ? '+' : '-'} 360° = ${right}°`],
        };
      }
      const deg = pick([120, 135, 150, 210, 225, 240, 300, 315, 330, 100, 200, 290, 160]), ref = Math.min(deg % 180, 180 - deg % 180);
      return {
        topic: 'TRIGONOMETRY', text: `What is the reference angle for ${deg}°?`,
        ...numeric(ref, [180 - deg % 180 === ref ? deg % 180 : 180 - deg % 180, 360 - deg, deg - 90, 90 - ref].filter(v => v > 0 && v !== ref), v => v + '°'),
        steps: ['The reference angle is the acute angle to the x-axis.', `${deg}° is in quadrant ${deg < 180 ? 'II' : deg < 270 ? 'III' : 'IV'}: ${deg < 180 ? `180° - ${deg}°` : deg < 270 ? `${deg}° - 180°` : `360° - ${deg}°`} = ${ref}°`],
      };
    }
    const deg = pick(SPECIAL.filter(v => v)), right = radStr(deg);
    return {
      topic: 'RADIANS', text: `Which radian measure equals ${deg}°?`,
      ...textual(right, [radStr(deg / 2), radStr(deg * 2 % 360 || 90), pif(180 / deg).replace(/^0π$/, '0'), radStr((deg + 90) % 360 || 45), radStr((deg + 180) % 360 || 30), pif(deg / 90)].filter(v => v !== right)),
      steps: ['Multiply by π/180.', `${deg} × π/180 = ${right}`],
    };
  };

  // F.TF.5, F.IF.7e: amplitude, period and midline of sine and cosine graphs.
  kinds.trigGraphs = d => {
    const a = pick([1, 2, 3, 4, 1 / 2]), b = pick([1, 2, 3, 4, 1 / 2]), dd = clamp(randInt(-3, 3), -Math.floor(5 - a), Math.floor(5 - a)), fn = pick(['sin', 'cos']), ask = pick(['amplitude', 'period', 'midline']);
    const A = a === 1 ? '' : a === 1 / 2 ? '(1/2)' : String(a), B = b === 1 ? '' : b === 1 / 2 ? '(1/2)' : String(b), eq = `y = ${A}${fn}(${B}x)${dd ? ' ' + signed(dd) : ''}`;
    const per = 2 / b, fig = rand() < .5;
    const ans = { amplitude: show(a), period: pif(per), midline: `y = ${dd}` }[ask];
    const wr = { amplitude: [show(2 * a), show(a + dd || a + 1), show(per * Math.PI > 9 ? a + 2 : a / 2 || 1), String(a + 3), show(a + 1), String(4 * a)], period: [pif(b), pif(1 / b), pif(per * 2), pif(per / 2), show(per), pif(per * 3)], midline: [`y = ${-dd}`, `y = ${show(a)}`, `y = ${show(dd + a)}`, `x = ${dd}`, `y = ${show(dd - a)}`, `y = ${b === 1 / 2 ? 3 : b}`] }[ask];
    return {
      topic: 'TRIGONOMETRY', text: fig ? `The graph of ${eq} is shown. What is its ${ask}?` : `What is the ${ask} of the graph of ${eq}?`, ...(fig ? { size: [110, 70] } : {}),
      ...textual(ans, wr.filter(v => v !== ans)),
      steps: [`y = a ${fn}(bx) + d has amplitude |a|, period 2π/b, midline y = d.`, ask === 'amplitude' ? `a = ${show(a)}` : ask === 'period' ? `2π / ${show(b)} = ${pif(per)}` : `d = ${dd}`, `So the ${ask} is ${ans}.`],
      ...(fig ? { fig: (c, w, h) => { const P = F.grid(c, w, h, [0, 2 * Math.PI], [-5, 5], Math.PI / 2, 1); F.plot(c, P, x => a * (fn === 'sin' ? Math.sin(b * x) : Math.cos(b * x)) + dd, [0, 2 * Math.PI], HOT); F.label(c, 'π', P(Math.PI, 0)[0] + 4, h - 5, DIM); F.label(c, '2π', w - 8, h - 5, DIM); } } : {}),
    };
  };

  // G.SRT.9-11: the law of sines, the law of cosines, and area = (1/2)ab sin C.
  const COS3 = [[3, 8, 60, 7], [5, 8, 60, 7], [8, 15, 60, 13], [7, 15, 60, 13], [3, 5, 120, 7], [7, 8, 120, 13], [5, 16, 120, 19]];
  kinds.lawSinesCos = d => {
    const f = randInt(0, 3);
    if (f === 0) {
      const [a0, b0, C, c0] = pick(COS3), k = pick([1, 1, 2]), a = a0 * k, b = b0 * k, c = c0 * k;
      return {
        topic: 'TRIGONOMETRY', text: `In the triangle, two sides are ${a} and ${b} with a ${C}° angle between them. What is the third side, x?`, size: [110, 56],
        ...numeric(c, [Math.round(Math.sqrt(a * a + b * b)), a + b - (C === 60 ? 4 : 0) || a + b, Math.abs(b - a), Math.round(Math.sqrt(a * a + b * b + (C === 60 ? 1 : -1) * a * b))]),
        steps: ['Law of cosines: x^2 = a^2 + b^2 - 2ab cos C', `cos ${C}° = ${C === 60 ? '1/2' : '-1/2'}: x^2 = ${a * a} + ${b * b} ${C === 60 ? '-' : '+'} ${a * b}`, `x^2 = ${c * c}, so x = ${c}`],
        fig: (cc, w, h) => {
          const xs = [0, b, a * Math.cos(C * DEG)], span = Math.max(...xs) - Math.min(...xs), s = Math.min((w - 20) / span, (h - 16) / (a * Math.sin(C * DEG)));
          const x0 = 10 - Math.min(...xs) * s, T = [[x0, h - 9], [x0 + b * s, h - 9], [x0 + a * s * Math.cos(C * DEG), h - 9 - a * s * Math.sin(C * DEG)]];
          F.outlinePoly(cc, T, INK); F.label(cc, C + '°', T[0][0] + 13, T[0][1] - 5, DIM);
          F.label(cc, String(b), (T[0][0] + T[1][0]) / 2, h - 2); F.label(cc, String(a), (T[0][0] + T[2][0]) / 2 - 6, (T[0][1] + T[2][1]) / 2 - 2);
          F.label(cc, 'x', (T[1][0] + T[2][0]) / 2 + 6, (T[1][1] + T[2][1]) / 2 - 2, HOT);
        },
      };
    }
    if (f === 1) {
      const a = 2 * randInt(2, 9), B = pick([45, 60, 90, 120, 135]), s = { 45: '√2', 60: '√3', 90: '', 120: '√3', 135: '√2' }[B], right = B === 90 ? String(2 * a) : `${a}${s}`;
      return {
        topic: 'TRIGONOMETRY', text: `In triangle ABC, angle A = 30°, angle B = ${B}°, and side a (opposite A) is ${a}. What is side b?`,
        ...textual(right, [String(a / 2), `${a / 2}${s || '√3'}`, `${2 * a}${s || '√2'}`, `${a}√3`, `${a}√2`, String(2 * a)].filter(v => v !== right)),
        steps: ['Law of sines: a/sin A = b/sin B', `${a}/(1/2) = b/sin ${B}°, so b = ${2 * a} sin ${B}°`, `sin ${B}° = ${exact(Math.sin(B * DEG))}, so b = ${right}`],
      };
    }
    if (f === 2) {
      const a = randInt(3, 12), b = 2 * randInt(2, 8), C = pick([30, 150, 90, 60, 45]), ab2 = a * b / 2;
      const co = v => Number.isInteger(v) ? String(v) : `(${show(v)})`;
      const right = C === 30 || C === 150 ? show(ab2 / 2) : C === 90 ? show(ab2) : C === 60 ? `${co(ab2 / 2)}√3` : `${co(ab2 / 2)}√2`;
      return {
        topic: 'TRIGONOMETRY', text: `Two sides of a triangle are ${a} and ${b}, and the angle between them is ${C}°. What is the area of the triangle?`,
        ...textual(right, [show(ab2), show(a * b), `${co(ab2)}√3`, show(ab2 / 2), `${co(ab2 / 2)}√2`, `${co(ab2 / 2)}√3`].filter(v => v !== right)),
        steps: ['Area = (1/2)ab sin C', `sin ${C}° = ${exact(Math.sin(C * DEG))}`, `(1/2)(${a})(${b})(${exact(Math.sin(C * DEG))}) = ${right}`],
      };
    }
    const [x, y, z, ang] = pick([[3, 5, 7, 120], [5, 7, 8, 60], [3, 7, 8, 60], [7, 8, 13, 120], [8, 13, 15, 60], [5, 16, 19, 120]]);
    const longest = ang === 120;
    const opp = longest ? z : y;
    return {
      topic: 'TRIGONOMETRY', text: `A triangle has sides ${x}, ${y} and ${z}. What is the measure of the angle opposite the side of length ${opp}?`,
      ...numeric(ang, [30, 45, 90, 150, 180 - ang].filter(v => v !== ang), v => v + '°'),
      steps: ['Law of cosines: cos C = (a^2 + b^2 - c^2)/(2ab)', longest ? `(${x * x} + ${y * y} - ${z * z})/(2 × ${x} × ${y}) = -1/2` : `(${x * x} + ${z * z} - ${y * y})/(2 × ${x} × ${z}) = 1/2`, `cos C = ${longest ? '-1/2' : '1/2'}, so C = ${ang}°`],
    };
  };

  // G.GPE.2: a parabola from its focus and directrix.
  kinds.parabolaFocus = d => {
    const p = pick([1, 2, 3, -1, -2, 1 / 2]), h = randInt(-3, 3), k = randInt(-3, 3), c = 1 / (4 * p), C = c === 1 ? '' : `(${show(c)})`;
    const eq = h || k ? `y ${signed(-k)} = ${C}(x ${signed(-h)})^2`.replace('y + 0', 'y').replace('y - 0', 'y').replace('(x + 0)', 'x').replace('(x - 0)', 'x') : `y = ${C}x^2`;
    const askF = rand() < .6;
    return {
      topic: 'PARABOLAS', text: `What is the ${askF ? 'focus' : 'directrix'} of the parabola ${eq}?`,
      ...(askF ? textual(pt(h, show(k + p)), [pt(h, show(k - p)), pt(show(h + p), k), pt(h, show(k + 1 / p)), pt(h, show(k + c)), pt(h, show(k + 2 * p))].filter(v => v !== pt(h, show(k + p))))
        : textual(`y = ${show(k - p)}`, [`y = ${show(k + p)}`, `x = ${show(h - p)}`, `y = ${show(k - 1 / p)}`, `y = ${show(-k + p)}`, `y = ${show(k - 2 * p)}`, `y = ${show(k + c)}`].filter(v => v !== `y = ${show(k - p)}`))),
      steps: ['y - k = (1/(4p))(x - h)^2 has vertex (h, k), focus (h, k + p), directrix y = k - p.', `1/(4p) = ${show(c)}, so p = ${show(p)}.`, askF ? `Focus: ${pt(h, show(k + p))}` : `Directrix: y = ${show(k - p)}`],
    };
  };

  // ---- More geometry

  // G.CO.10, G.SRT.4: triangle inequality, midsegments, centroids, angle-side order, isosceles triangles.
  kinds.triangleProps = d => {
    const f = d < 2 ? pick([0, 4]) : randInt(0, 4);
    if (f === 0) {
      const a = randInt(3, 12), b = randInt(3, 12), lo = Math.abs(a - b), hi = a + b, right = randInt(lo + 1, hi - 1);
      return {
        topic: 'TRIANGLES', text: `Two sides of a triangle are ${a} and ${b}. Which could be the length of the third side?`,
        ...numeric(right, [hi, lo || hi + 1, hi + randInt(1, 5), Math.max(1, lo - 1) === lo ? hi + 6 : Math.max(1, lo - 1)].filter(v => v <= lo || v >= hi)),
        steps: ['Triangle inequality: the third side is between the difference and the sum.', `${lo} < x < ${hi}`, `Only ${right} fits.`],
      };
    }
    if (f === 1) {
      const x = randInt(2, 9), a = randInt(1, 4), b = randInt(1, 6), DE = a * x + b, c = 2 * a + randInt(1, 2), e = 2 * DE - c * x;
      return {
        topic: 'TRIANGLES', text: `In the figure, D and E are midpoints of AB and AC. DE = ${lin(a, b)} and BC = ${lin(c, e)}. What is x?`, size: [96, 60],
        ...numeric(x, [(e - b) / (a - c), (e - 2 * b) / (2 * a + c), x + 2, DE].filter(Number.isInteger)),
        steps: ['A midsegment is half the third side: BC = 2 × DE.', `${lin(c, e)} = 2(${lin(a, b)}) = ${lin(2 * a, 2 * b)}`, `x = ${x}`],
        fig: (cc, w, h) => {
          const A = [Math.round(w / 2) - 6, 5], B = [6, h - 8], C = [w - 6, h - 8], D = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], E = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
          F.outlinePoly(cc, [A, B, C], INK); F.line(cc, ...D, ...E, HOT);
          F.label(cc, 'A', A[0] + 6, A[1] + 1, DIM); F.label(cc, 'B', B[0], B[1] + 5, DIM); F.label(cc, 'C', C[0], C[1] + 5, DIM); F.label(cc, 'D', D[0] - 6, D[1], DIM); F.label(cc, 'E', E[0] + 6, E[1], DIM);
        },
      };
    }
    if (f === 2) {
      const m = 3 * randInt(3, 10), askWhole = rand() < .5;
      return {
        topic: 'TRIANGLES', text: askWhole ? `G is the centroid of triangle ABC, and AM is a median. If AG = ${2 * m / 3}, what is AM?` : `G is the centroid of triangle ABC, and median AM is ${m}. What is GM?`,
        ...numeric(askWhole ? m : m / 3, askWhole ? [2 * m / 3 + m / 3 * 2, m * 2 / 3, 4 * m / 3, m / 3] : [2 * m / 3, m / 2, m / 4, m]),
        steps: ['The centroid splits each median 2 : 1, the longer part next to the vertex.', askWhole ? `AG is 2/3 of AM: AM = ${2 * m / 3} × 3/2 = ${m}` : `GM is 1/3 of AM: ${m} ÷ 3 = ${m / 3}`],
      };
    }
    if (f === 3) {
      let s; do s = [randInt(4, 15), randInt(4, 15), randInt(4, 15)]; while (new Set(s).size < 3 || s[0] + s[1] <= s[2] || s[0] + s[2] <= s[1] || s[1] + s[2] <= s[0]);
      const big = rand() < .5, [AB, BC, CA] = s, opp = { C: AB, A: BC, B: CA }, target = big ? Math.max(...s) : Math.min(...s), ang = Object.keys(opp).find(k => opp[k] === target);
      return {
        topic: 'TRIANGLES', text: `In triangle ABC, AB = ${AB}, BC = ${BC} and CA = ${CA}. Which angle is the ${big ? 'largest' : 'smallest'}?`,
        ...textual(`Angle ${ang}`, ['Angle A', 'Angle B', 'Angle C', 'They are all equal']),
        steps: [`The ${big ? 'largest' : 'smallest'} angle is across from the ${big ? 'longest' : 'shortest'} side.`, `The ${big ? 'longest' : 'shortest'} side is ${target}, across from angle ${ang}.`],
      };
    }
    const base = randInt(20, 85), a = randInt(2, 5), x = randInt(3, Math.floor((base - 1) / a)), b = base - a * x, c = a + randInt(1, 3), e = base - c * x;
    return {
      topic: 'TRIANGLES', text: `In triangle ABC, AB = AC. Angle B = (${lin(a, b)})° and angle C = (${lin(c, e)})°. What is the value of x?`,
      ...numeric(x, [(180 - b - e) / (a + c), (e - b) / (a + c), x + 5, base].filter(Number.isInteger)),
      steps: ['Equal sides AB and AC face equal angles: angle B = angle C.', `${lin(a, b)} = ${lin(c, e)}`, `x = ${x}`],
    };
  };

  // G.CO.11 and IXL's quadrilaterals: parallelograms, rectangles, rhombuses, trapezoids, kites.
  const QUADS = {
    parallelogram: [['Opposite sides are congruent', 'Diagonals bisect each other', 'Opposite angles are congruent', 'Consecutive angles add to 180°'], ['Diagonals are congruent', 'All sides are congruent', 'Diagonals are perpendicular', 'All angles are right angles']],
    rectangle: [['Diagonals are congruent', 'All angles are right angles', 'Diagonals bisect each other'], ['All sides are congruent', 'Diagonals are perpendicular', 'Only one pair of sides is parallel']],
    rhombus: [['All sides are congruent', 'Diagonals are perpendicular', 'Diagonals bisect each other'], ['Diagonals are congruent', 'All angles are right angles', 'Only one pair of sides is parallel']],
    'isosceles trapezoid': [['Diagonals are congruent', 'Exactly one pair of sides is parallel'], ['Diagonals bisect each other', 'All sides are congruent', 'Opposite angles are congruent']],
    kite: [['Diagonals are perpendicular', 'Two pairs of next-door sides are congruent'], ['Diagonals are congruent', 'Opposite sides are parallel', 'All angles are right angles']],
  };
  kinds.quadrilaterals = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 3);
    if (f === 0) {
      const name = pick(Object.keys(QUADS)), [yes, no] = QUADS[name];
      return {
        topic: 'QUADRILATERALS', text: `Which statement is always true for ${an(name)}?`, ...textual(pick(yes), shuffle([...no])),
        steps: [`${An(name)}: ${yes.slice(0, 2).join('; ').toLowerCase()}.`, `The other choices are not always true for every ${name}.`],
      };
    }
    if (f === 1) {
      const A = randInt(40, 140), x = randInt(8, 25), a = randInt(2, 4), b = A - a * x;
      const opp = rand() < .5, c = pick([1, 2, 3, 4, 5, 6].filter(v => v !== a)), B = opp ? A : 180 - A, e = B - c * x;
      return {
        topic: 'QUADRILATERALS', text: `ABCD is a parallelogram. Angle A = (${lin(a, b)})° and angle ${opp ? 'C' : 'B'} = (${lin(c, e)})°. What is the value of x?`, size: [90, 48],
        ...numeric(x, opp ? [(180 - b - e) / (a + c), x + 4, A] : [(e - b) / (a - c), x + 4, A].filter(Number.isInteger)),
        steps: [opp ? 'Opposite angles of a parallelogram are equal.' : 'Consecutive angles of a parallelogram add to 180°.', opp ? `${lin(a, b)} = ${lin(c, e)}` : `${lin(a, b)} + ${lin(c, e)} = 180`, `x = ${x}`],
        fig: (cc, w, h) => {
          const P = [[6, h - 8], [w - 26, h - 8], [w - 6, 8], [26, 8]];
          F.outlinePoly(cc, P, INK); ['A', 'B', 'C', 'D'].forEach((L, i) => F.label(cc, L, P[i][0] + (i === 1 || i === 2 ? 4 : -3), P[i][1] + (i < 2 ? 5 : -4), DIM));
        },
      };
    }
    if (f === 2) {
      const x = randInt(2, 12), a = randInt(1, 5), b = randInt(1, 12), c = a + randInt(1, 4), e = (a - c) * x + b, rect = rand() < .5;
      return {
        topic: 'QUADRILATERALS', text: rect ? `In rectangle ABCD, diagonal AC = ${lin(a, b)} and diagonal BD = ${lin(c, e)}. What is the value of x?` : `The diagonals of parallelogram ABCD meet at E. AE = ${lin(a, b)} and EC = ${lin(c, e)}. What is the value of x?`,
        ...numeric(x, [(e - b) / (a + c), x + 3, a * x + b, -x].filter(Number.isInteger)),
        steps: [rect ? 'The diagonals of a rectangle are equal.' : 'The diagonals of a parallelogram bisect each other: AE = EC.', `${lin(a, b)} = ${lin(c, e)}`, `x = ${x}`],
      };
    }
    const b1 = randInt(4, 20), b2 = b1 + 2 * randInt(1, 8), mid = (b1 + b2) / 2, askMid = rand() < .5;
    return {
      topic: 'QUADRILATERALS', text: askMid ? `A trapezoid has bases ${b1} and ${b2}. How long is its midsegment?` : `A trapezoid's midsegment is ${mid} and one base is ${b1}. How long is the other base?`,
      ...numeric(askMid ? mid : b2, askMid ? [b1 + b2, b2 - b1, mid + 1, b2] : [2 * mid + b1, mid - b1, mid + (mid - b1) + 2, mid]),
      steps: ['The midsegment of a trapezoid is the average of the bases.', askMid ? `(${b1} + ${b2}) / 2 = ${mid}` : `(${b1} + b)/2 = ${mid}, so b = ${2 * mid} - ${b1} = ${b2}`],
    };
  };

  // G.CO and IXL's polygons: interior and exterior angles.
  const POLY = [[5, 'pentagon'], [6, 'hexagon'], [8, 'octagon'], [9, 'nonagon'], [10, 'decagon'], [12, 'dodecagon'], [15, '15-gon'], [20, '20-gon']];
  kinds.polygonAngles = d => {
    const f = randInt(0, 3), [n, name] = pick(POLY), S = 180 * (n - 2);
    if (f === 0) return { topic: 'POLYGONS', text: `What is the sum of the interior angles of ${an(name)}?`, ...numeric(S, [180 * n, 360, 180 * (n - 1), 90 * n], v => cm(v) + '°'), steps: [`A polygon with n sides: (n - 2) × 180°.`, `(${n} - 2) × 180° = ${cm(S)}°`] };
    if (f === 1) return { topic: 'POLYGONS', text: `What is the measure of each interior angle of a regular ${name}?`, ...numeric(r2(S / n), [r2(360 / n), r2(180 - S / n / 2), S, r2(180 * n / (n + 2))], v => cm(r2(v)) + '°'), steps: [`Sum: ${cm(S)}°`, `${cm(S)}° ÷ ${n} = ${r2(S / n)}°`] };
    if (f === 2) {
      const ext = 360 / n;
      return { topic: 'POLYGONS', text: `Each exterior angle of a regular polygon is ${r2(ext)}°. How many sides does it have?`, ...numeric(n, [n + 2, n - 1, r2(180 / ext), 2 * n].filter(Number.isInteger)), steps: ['The exterior angles of any polygon add to 360°.', `360 ÷ ${r2(ext)} = ${n} sides`] };
    }
    let known, x, tries = 0;
    do { known = Array.from({ length: 4 }, () => randInt(90, 130)); x = 540 - known.reduce((p, q) => p + q, 0); } while ((x < 40 || x > 170) && ++tries < 30);
    if (tries >= 30) { known = [100, 110, 105, 115]; x = 110; }
    const S4 = 540 - x;
    return { topic: 'POLYGONS', text: `Four angles of a pentagon measure ${known.join('°, ')}°. What is the fifth angle?`, ...numeric(x, [720 - S4, x + 180, 360 - S4 + 180, x + 10, x - 10].filter(v => v > 0 && v < 400), v => v + '°'), steps: ["A pentagon's angles add to (5 - 2) × 180° = 540°.", `540 - ${S4} = ${x}`] };
  };

  // G.CO.9-11, G.SRT.4-5: which reason justifies a step in a proof.
  const PROOFS = [
    ['Given: M is the midpoint of AB.', 'AM = MB', 'Definition of midpoint', ['Segment addition', 'Reflexive property', 'Definition of bisector']],
    ['Lines AB and CD cross at point E.', 'Angle AEC = angle BED', 'Vertical angles are congruent', ['Linear pairs add to 180°', 'Alternate interior angles', 'Corresponding angles']],
    ['Given: lines p and q are parallel, cut by a transversal.', 'Alternate interior angles 3 and 6 are equal', 'Alternate interior angles theorem', ['Vertical angles are congruent', 'Reflexive property', 'Same-side interior angles']],
    ['Triangles ABD and CBD share side BD.', 'BD = BD', 'Reflexive property', ['Symmetric property', 'Definition of midpoint', 'Substitution']],
    ['AB = CB, AD = CD, and BD = BD.', 'Triangle ABD is congruent to triangle CBD', 'SSS', ['SAS', 'ASA', 'AAA']],
    ['Triangle ABC is congruent to triangle DEF.', 'AB = DE', 'Corresponding parts (CPCTC)', ['SAS', 'Reflexive property', 'Definition of congruent angles']],
    ['Given: ray BD bisects angle ABC.', 'Angle ABD = angle DBC', 'Definition of angle bisector', ['Vertical angles are congruent', 'Angle addition', 'Definition of midpoint']],
    ['Angles 1 and 2 form a linear pair.', 'm(angle 1) + m(angle 2) = 180°', 'Linear pairs add to 180°', ['Vertical angles are congruent', 'Complementary angles', 'Triangle angle sum']],
    ['Given: AB = CD.', 'AB + BC = BC + CD', 'Addition property of equality', ['Segment addition', 'Substitution', 'Reflexive property']],
    ['Given: 2x + 5 = 17.', '2x = 12', 'Subtraction property of equality', ['Division property of equality', 'Addition property of equality', 'Distributive property']],
    ['Given: 3(x - 2) = 21.', '3x - 6 = 21', 'Distributive property', ['Subtraction property of equality', 'Multiplication property', 'Substitution']],
    ['Given: m(angle A) = 40° and m(angle B) = m(angle A).', 'm(angle B) = 40°', 'Substitution', ['Reflexive property', 'Definition of congruence', 'Addition property of equality']],
    ['Given: AB is perpendicular to BC.', 'Angle ABC is a right angle', 'Definition of perpendicular lines', ['Definition of right triangle', 'Vertical angles are congruent', 'Linear pairs add to 180°']],
    ['Point B lies on segment AC.', 'AB + BC = AC', 'Segment addition postulate', ['Definition of midpoint', 'Addition property of equality', 'Triangle inequality']],
    ['In triangle ABC, DE is parallel to BC.', 'Angle ADE = angle ABC', 'Corresponding angles postulate', ['Alternate interior angles', 'Vertical angles are congruent', 'Reflexive property']],
    ['Angle ADE = angle ABC, and angle A = angle A.', 'Triangle ADE is similar to triangle ABC', 'AA similarity', ['SSS similarity', 'SAS congruence', 'ASA congruence']],
    ['Given: AB = AC in triangle ABC.', 'Angle B = angle C', 'Base angles of an isosceles triangle', ['Vertical angles are congruent', 'CPCTC', 'Triangle angle sum']],
  ];
  kinds.proofs = () => {
    const [given, st, reason, wrongs] = pick(PROOFS);
    return {
      topic: 'PROOFS', text: `${given} Statement: ${st}. Which reason justifies the statement?`, ...textual(reason, wrongs),
      steps: [`The step says: ${st}.`, `That follows from: ${reason.toLowerCase()}.`],
    };
  };

  // G.CO.12, G.CO.13: naming a construction from its compass marks.
  const BUILDS = ['Perpendicular bisector', 'Angle bisector', 'Equilateral triangle', 'Regular hexagon', 'Perpendicular from a point', 'Copy of a segment'];
  kinds.constructions = () => {
    const k = randInt(0, 4), right = BUILDS[k];
    return {
      topic: 'CONSTRUCTIONS', text: 'A student made the construction shown with a compass and straightedge. What did the student construct?', size: [100, 64],
      ...textual(right, shuffle(BUILDS.filter(b => b !== right))),
      steps: [['Arcs from A and from B, the same width, cross above and below AB. The line through those crossings cuts AB in half at a right angle.',
        'One arc from the vertex crosses both rays; arcs from those points meet inside the angle. The ray through that point splits the angle in half.',
        'Arcs centered at A and B, each with radius AB, meet at C. All three sides equal AB.',
        'The compass, set to the radius, steps around the circle six times. Joining the marks gives six equal sides.',
        'An arc from P crosses the line twice; arcs from those points meet below. The line through P and that point is perpendicular to the line.'][k], `So it is: ${right.toLowerCase()}.`],
      fig: (c, w, h) => {
        if (k === 0) {
          const A = [18, h / 2], B = [w - 18, h / 2], r = (B[0] - A[0]) * .62, dy = Math.sqrt(r * r - ((B[0] - A[0]) / 2) ** 2);
          F.line(c, ...A, ...B, INK); F.dot(c, A, INK); F.dot(c, B, INK); F.label(c, 'A', A[0] - 6, A[1], DIM); F.label(c, 'B', B[0] + 6, B[1], DIM);
          F.arc(c, ...A, r, .55, 1.05, HOT); F.arc(c, ...A, r, -1.05, -.55, HOT); F.arc(c, ...B, r, Math.PI - 1.05, Math.PI - .55, HOT); F.arc(c, ...B, r, Math.PI + .55, Math.PI + 1.05, HOT);
          F.line(c, w / 2, h / 2 - dy - 4, w / 2, h / 2 + dy + 4, BLU);
        } else if (k === 1) {
          const V = [10, h - 8], a1 = 0, a2 = 50 * DEG, L = 84, r = 34, P = [V[0] + r, V[1]], Q = [V[0] + r * Math.cos(a2), V[1] - r * Math.sin(a2)], m = a2 / 2;
          F.line(c, ...V, V[0] + L, V[1], INK); F.line(c, ...V, V[0] + L * Math.cos(a2), V[1] - L * Math.sin(a2), INK);
          F.arc(c, ...V, r, a1 - .1, a2 + .1, HOT);
          const R = [V[0] + 58 * Math.cos(m), V[1] - 58 * Math.sin(m)], rr = Math.hypot(R[0] - P[0], R[1] - P[1]);
          const ang = (A, B) => Math.atan2(A[1] - B[1], B[0] - A[0]);
          F.arc(c, ...P, rr, ang(P, R) - .25, ang(P, R) + .25, HOT); F.arc(c, ...Q, rr, ang(Q, R) - .25, ang(Q, R) + .25, HOT);
          F.line(c, ...V, V[0] + 80 * Math.cos(m), V[1] - 80 * Math.sin(m), BLU);
        } else if (k === 2) {
          const s = 50, A = [Math.round(w / 2 - s / 2), h - 8], B = [A[0] + s, h - 8], C = [A[0] + s / 2, h - 8 - s * Math.sqrt(3) / 2];
          F.arc(c, ...A, s, 0.85, 1.25, HOT); F.arc(c, ...B, s, Math.PI - 1.25, Math.PI - .85, HOT);
          F.outlinePoly(c, [A, B, C], BLU); F.label(c, 'A', A[0] - 5, A[1] + 2, DIM); F.label(c, 'B', B[0] + 5, B[1] + 2, DIM); F.label(c, 'C', C[0] + 7, C[1] + 2, DIM);
        } else if (k === 3) {
          const cx = w / 2, cy = h / 2, R = h / 2 - 6, pts = [0, 1, 2, 3, 4, 5].map(i => [cx + R * Math.cos(i * Math.PI / 3), cy - R * Math.sin(i * Math.PI / 3)]);
          F.circle(c, Math.round(cx), Math.round(cy), R, INK); F.dot(c, [Math.round(cx), Math.round(cy)], INK);
          pts.forEach(([x, y], i) => { const a = Math.atan2(cy - y, x - cx) + Math.PI * 2 / 3; F.arc(c, x, y, R, a - .25, a + .25, HOT); });
          F.outlinePoly(c, pts, BLU);
        } else {
          const y0 = h - 22, P = [w / 2, 8], r = 42, dx = Math.sqrt(r * r - (y0 - P[1]) ** 2);
          F.line(c, 4, y0, w - 5, y0, INK); F.dot(c, P, INK); F.label(c, 'P', P[0] + 6, P[1], DIM);
          F.arc(c, ...P, r, -Math.PI / 2 - .9, -Math.PI / 2 + .9, HOT);
          const L1 = [P[0] - dx, y0], L2 = [P[0] + dx, y0], low = [P[0], y0 + 14], rr = Math.hypot(low[0] - L1[0], low[1] - L1[1]);
          F.arc(c, ...L1, rr, -Math.atan2(low[1] - y0, low[0] - L1[0]) - .3, -Math.atan2(low[1] - y0, low[0] - L1[0]) + .3, HOT);
          F.arc(c, ...L2, rr, -Math.atan2(low[1] - y0, low[0] - L2[0]) - .3, -Math.atan2(low[1] - y0, low[0] - L2[0]) + .3, HOT);
          F.line(c, P[0], P[1], P[0], h - 3, BLU);
        }
      },
    };
  };

  // G.GMD.4: cross sections and solids of revolution.
  const SLICES = [['a cube', 'parallel to one face', 'Square'], ['a cylinder', 'parallel to its base', 'Circle'], ['a cylinder', 'straight down through its axis', 'Rectangle'],
    ['a cone', 'parallel to its base', 'Circle'], ['a cone', 'straight down through its tip', 'Triangle'], ['a sphere', 'through its center', 'Circle'],
    ['a square pyramid', 'parallel to its base', 'Square'], ['a square pyramid', 'straight down through its tip', 'Triangle'], ['a rectangular box', 'parallel to one face', 'Rectangle'],
    ['a cylinder', 'at a slant, not touching the bases', 'Ellipse']];
  const SHAPES2 = ['Circle', 'Square', 'Rectangle', 'Triangle', 'Ellipse', 'Hexagon'];
  kinds.crossSection = d => {
    const f = d < 2 ? pick([0, 1]) : randInt(0, 2);
    if (f === 0) {
      const [solid, cut, right] = pick(SLICES);
      return {
        topic: 'SOLIDS', text: `A plane slices ${solid} ${cut}. What shape is the cross section?`, ...textual(right, shuffle(SHAPES2.filter(s => s !== right))),
        steps: [`Picture the cut face of ${solid} sliced ${cut}.`, `It is a ${right.toLowerCase()}.`],
      };
    }
    const k = randInt(0, 2), right = ['Cylinder', 'Cone', 'Sphere'][k], a = randInt(2, 6), b = randInt(3, 9);
    if (f === 2) {
      const V = k === 0 ? a * a * b : k === 1 ? a * a * b / 3 : 4 * a ** 3 / 3;
      return {
        topic: 'SOLIDS', text: k === 0 ? `A ${a} by ${b} rectangle spins around its side of length ${b}. What is the volume of the solid it makes?` : k === 1 ? `A right triangle with legs ${a} and ${b} spins around the leg of length ${b}. What is the volume of the solid it makes?` : `A semicircle of radius ${a} spins around its diameter. What is the volume of the solid it makes?`,
        ...numeric(V, k === 0 ? [b * b * a, 2 * a * b, a * a * b / 3, 2 * a * a * b] : k === 1 ? [a * a * b, b * b * a / 3, a * b / 2, 2 * a * a * b / 3] : [a * a * 4, 2 * a ** 3 / 3, 32 * a ** 3 / 3, 4 * a ** 3], pif),
        steps: [`It makes a ${right.toLowerCase()} with ${k === 2 ? `radius ${a}` : `radius ${a} and height ${b}`}.`, k === 0 ? `V = π(${a})^2(${b})` : k === 1 ? `V = (1/3)π(${a})^2(${b})` : `V = (4/3)π(${a})^3`, `= ${pif(V)}`],
      };
    }
    return {
      topic: 'SOLIDS', text: 'The flat shape spins all the way around the dashed line. What solid does it make?', size: [70, 64],
      ...textual(right, ['Cylinder', 'Cone', 'Sphere', 'Square pyramid', 'Rectangular prism'].filter(s => s !== right)),
      steps: [['A rectangle spun around one side sweeps out a cylinder.', 'A right triangle spun around a leg sweeps out a cone.', 'A semicircle spun around its diameter sweeps out a sphere.'][k]],
      fig: (c, w, h) => {
        const ax = 20;
        F.line(c, ax, 2, ax, h - 3, DIM, 2);
        if (k === 0) F.outlinePoly(c, [[ax, 12], [ax + 30, 12], [ax + 30, h - 12], [ax, h - 12]], HOT);
        else if (k === 1) F.outlinePoly(c, [[ax, 8], [ax + 32, h - 10], [ax, h - 10]], HOT);
        else { F.arc(c, ax, h / 2, 26, -Math.PI / 2, Math.PI / 2, HOT); F.line(c, ax, h / 2 - 26, ax, h / 2 + 26, HOT); }
        F.arc(c, ax, 6, 8, .3, Math.PI - .3, BLU);
      },
    };
  };

  // G.GMD and IXL's surface area: prisms, cylinders, spheres, cones, pyramids.
  kinds.surfaceArea = d => {
    const pickS = pick(d < 2 ? ['box', 'cube', 'cyl'] : ['box', 'cube', 'cyl', 'sphere', 'cone', 'pyr']);
    if (pickS === 'box' || pickS === 'cube') {
      const L = randInt(2, 10), W = pickS === 'cube' ? L : randInt(2, 8), H = pickS === 'cube' ? L : randInt(2, 8), SA = 2 * (L * W + L * H + W * H);
      return {
        topic: 'SURFACE AREA', text: pickS === 'cube' ? `What is the surface area of a cube with edges of length ${L}?` : `What is the surface area of a box ${L} by ${W} by ${H}?`,
        ...numeric(SA, [L * W * H, L * W + L * H + W * H, 6 * L * W, SA / 2 + L * W]),
        steps: pickS === 'cube' ? ['A cube has 6 square faces.', `6 × ${L}^2 = ${SA}`] : ['SA = 2(lw + lh + wh)', `2(${L * W} + ${L * H} + ${W * H}) = ${SA}`],
      };
    }
    const r = randInt(2, 8), h = randInt(2, 10);
    if (pickS === 'cyl') return { topic: 'SURFACE AREA', text: `What is the total surface area of a cylinder with radius ${r} and height ${h}?`, ...numeric(2 * r * r + 2 * r * h, [r * r * h, 2 * r * h, r * r + 2 * r * h, 2 * r * r + r * h], pif), steps: ['Two circles plus the side: 2πr^2 + 2πrh', `2π(${r * r}) + 2π(${r})(${h}) = ${pif(2 * r * r + 2 * r * h)}`] };
    if (pickS === 'sphere') return { topic: 'SURFACE AREA', text: `What is the surface area of a sphere with radius ${r}?`, ...numeric(4 * r * r, [4 * r ** 3 / 3, 2 * r * r, r * r, 4 * r], pif), steps: ['SA = 4πr^2', `4π(${r * r}) = ${pif(4 * r * r)}`] };
    if (pickS === 'cone') {
      const [a, b, l] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]]);
      return { topic: 'SURFACE AREA', text: `A cone has radius ${a}, height ${b} and slant height ${l}. What is its total surface area?`, ...numeric(a * a + a * l, [a * a + a * b, a * l, a * a * b / 3, 2 * a * a + a * l], pif), steps: ['Base plus side: πr^2 + πrl (l is the slant height, not the height)', `π(${a * a}) + π(${a})(${l}) = ${pif(a * a + a * l)}`] };
    }
    const s = 2 * randInt(2, 6), l = randInt(s / 2 + 1, 12), SA = s * s + 2 * s * l;
    return { topic: 'SURFACE AREA', text: `A square pyramid has base edges of ${s} and a slant height of ${l}. What is its surface area?`, ...numeric(SA, [s * s + 4 * s * l, s * s + s * l, 2 * s * l, s * s * l / 3]), steps: ['Base plus four triangles: s^2 + 4 × (1/2) s l', `${s * s} + 2(${s})(${l}) = ${SA}`] };
  };

  // G.MG.1-3: modeling with density and solids.
  kinds.densityModel = d => {
    const f = randInt(0, 3);
    if (f === 0) {
      const L = randInt(2, 6), W = randInt(2, 5), D = randInt(8, 40) * 100, P = L * W * D;
      return { topic: 'MODELING', text: `A town is roughly a rectangle ${L} miles by ${W} miles, with ${cm(P)} people. What is its population density, in people per square mile?`, ...numeric(D, [P / (L + W), P / L, D * 2, P / (2 * (L + W))].filter(Number.isInteger), cm), steps: [`Area: ${L} × ${W} = ${L * W} square miles`, `${cm(P)} ÷ ${L * W} = ${cm(D)} people per square mile`] };
    }
    if (f === 1) {
      const [mat, dd] = pick([['gold', 19.3], ['silver', 10.5], ['aluminum', 2.7], ['copper', 8.9]]), a = randInt(2, 4), b = randInt(2, 5), c = randInt(5, 12), m = r1(dd * a * b * c);
      return { topic: 'MODELING', text: `A bar of ${mat} is a box ${a} cm by ${b} cm by ${c} cm. ${mat[0].toUpperCase() + mat.slice(1)} has a density of ${dd} g per cubic cm. What is the bar's mass?`, ...textual(cm(m) + ' g', [r1(dd * (a + b + c)), r1(a * b * c / dd), r1(dd * 2 * (a * b + a * c + b * c)), r1(m / 2), r1(m * 2)].map(v => cm(v) + ' g')), steps: [`Volume: ${a} × ${b} × ${c} = ${a * b * c} cubic cm`, `Mass = ${dd} × ${a * b * c} = ${cm(m)} g`] };
    }
    if (f === 2) {
      const s = pick([1, 2, 3]), L = s * randInt(2, 6), W = s * randInt(2, 5), H = s * randInt(2, 4), n = (L / s) * (W / s) * (H / s);
      return { topic: 'MODELING', text: `A shipping box is ${L} by ${W} by ${H} inches. How many ${s}-inch cubes fit inside, packed with no gaps?`, ...numeric(n, [L * W * H, L * W * H / s, n * 2, (L + W + H) / s].filter(Number.isInteger)), steps: [`Along each edge: ${L / s}, ${W / s} and ${H / s} cubes.`, `${L / s} × ${W / s} × ${H / s} = ${n}`] };
    }
    const r = randInt(2, 6), h = randInt(4, 12), side = 2 * r * h;
    return { topic: 'MODELING', text: `A water tower tank is a cylinder with radius ${r} m and height ${h} m. How many square meters of paint cover just its curved side?`, ...numeric(side, [r * r * h, 2 * r * r + side, r * h, side / 2], pif), steps: ['The curved side unrolls into a rectangle: circumference × height.', `2π(${r}) × ${h} = ${pif(side)}`] };
  };

  // G.CO.2, G.CO.5: which rule or matrix maps a figure to its image; symmetry.
  const RULES = [['(x, y) → (-x, y)', ([x, y]) => [-x, y], 'Reflect over the y-axis'], ['(x, y) → (x, -y)', ([x, y]) => [x, -y], 'Reflect over the x-axis'], ['(x, y) → (-y, x)', ([x, y]) => [-y, x], 'Rotate 90° counterclockwise'],
    ['(x, y) → (y, -x)', ([x, y]) => [y, -x], 'Rotate 90° clockwise'], ['(x, y) → (-x, -y)', ([x, y]) => [-x, -y], 'Rotate 180°'], ['(x, y) → (y, x)', ([x, y]) => [y, x], 'Reflect over y = x']];
  const TRMAT = [[[[0, -1], [1, 0]], 'Rotate 90° counterclockwise'], [[[-1, 0], [0, 1]], 'Reflect over the y-axis'], [[[1, 0], [0, -1]], 'Reflect over the x-axis'], [[[0, 1], [1, 0]], 'Reflect over y = x'], [[[-1, 0], [0, -1]], 'Rotate 180°'], [[[2, 0], [0, 2]], 'Dilate by a factor of 2']];
  kinds.transformRules = d => {
    const f = d < 2 ? pick([0, 3]) : d < 3 ? randInt(0, 3) : randInt(0, 4);
    if (f === 0) {
      const tri = pick([[[1, 1], [4, 1], [1, 3]], [[1, 2], [3, 1], [4, 4]], [[2, 1], [5, 2], [2, 4]]]), [rule, map] = pick(RULES), img = tri.map(map);
      const tr = rand() < .3 ? [nz(-3, 3), nz(-3, 3)] : null, IMG = tr ? tri.map(([x, y]) => [x + tr[0], y + tr[1]]) : img, R = tr ? `(x, y) → (x ${signed(tr[0])}, y ${signed(tr[1])})` : rule;
      return {
        topic: 'TRANSFORMATION', text: 'Which rule maps the blue triangle onto the yellow one?', size: [96, 80],
        ...textual(R, shuffle(RULES.map(r => r[0]).filter(r => r !== R)).concat(tr ? [] : [`(x, y) → (x + 2, y - 1)`])),
        steps: [`Track one corner: (${tri[0][0]}, ${tri[0][1]}) goes to (${IMG[0][0]}, ${IMG[0][1]}).`, 'Check the other corners the same way.', R],
        fig: (c, w, h) => { const P = F.grid(c, w, h, [-6, 6], [-6, 6]); F.outlinePoly(c, tri.map(p => P(...p)), BLU); F.outlinePoly(c, IMG.map(p => P(...p)), HOT); },
      };
    }
    if (f === 1) {
      const [M, right] = pick(TRMAT);
      return {
        topic: 'TRANSFORMATION', text: 'Each point (x, y) is written as a column and multiplied by matrix A. What transformation does A do?', size: [70, 34],
        ...textual(right, shuffle(TRMAT.map(t => t[1]).filter(t => t !== right))),
        steps: [`A sends (1, 0) to (${M[0][0]}, ${M[1][0]}) and (0, 1) to (${M[0][1]}, ${M[1][1]}).`, `That is: ${right.toLowerCase()}.`],
        fig: (c, w, h) => matrixFig(c, w, h, [['A', M]]),
      };
    }
    if (f === 2) {
      const a = nz(-6, 6), b = nz(-6, 6), h = nz(-4, 4), refl = pick([0, 1]), mid = refl ? [a, -b] : [-a, b], fin = [mid[0] + h, mid[1]];
      return {
        topic: 'TRANSFORMATION', text: `Point P(${a}, ${b}) is reflected over the ${refl ? 'x' : 'y'}-axis and then moved ${Math.abs(h)} units ${h > 0 ? 'right' : 'left'}. Where does it end up?`,
        ...textual(pt(...fin), [pt(mid[0] - h, mid[1]), pt(a + h, refl ? -b : b), pt(...(refl ? [-a + h, b] : [a + h, -b])), pt(-fin[0], fin[1]), pt(fin[0], -fin[1]), pt(-fin[0], -fin[1]), pt(fin[0] + 1, fin[1])].filter(v => v !== pt(...fin))),
        steps: [`Reflect: (${a}, ${b}) → (${mid[0]}, ${mid[1]})`, `Move ${h > 0 ? 'right' : 'left'} ${Math.abs(h)}: (${fin[0]}, ${fin[1]})`],
      };
    }
    const [shape, lines, rot] = pick([['a regular hexagon', 6, 60], ['a square', 4, 90], ['a rectangle that is not a square', 2, 180], ['an equilateral triangle', 3, 120], ['a regular pentagon', 5, 72], ['a regular octagon', 8, 45], ['an isosceles trapezoid', 1, 360]]);
    const askLines = rand() < .5 || rot === 360;
    return {
      topic: 'SYMMETRY', text: askLines ? `How many lines of symmetry does ${shape} have?` : `What is the smallest angle that ${shape} can be rotated to land on itself?`,
      ...(askLines ? numeric(lines, [lines * 2, lines / 2, lines + 1, 0].filter(Number.isInteger)) : numeric(rot, [rot / 2, 360 - rot, rot * 2, 360].filter(v => v !== rot && v > 0), v => v + '°')),
      steps: askLines ? [`Count the folds that match ${shape} onto itself.`, `It has ${lines}.`] : ['Rotate until it matches itself again.', `360° ÷ ${360 / rot} = ${rot}°`],
    };
  };

  // G.C.2, G.C.4: tangents, chords and secants.
  kinds.circleTheorems = d => {
    const f = d < 3 ? pick([0, 1, 2]) : randInt(0, 3);
    if (f === 0) {
      const [r, t, dd] = pick([[5, 12, 13], [3, 4, 5], [8, 15, 17], [6, 8, 10], [9, 12, 15], [7, 24, 25]]), askD = rand() < .5;
      return {
        topic: 'CIRCLES', text: `PT is tangent to circle O at T. The radius is ${r} and ${askD ? `PT = ${t}` : `OP = ${dd}`}. What is ${askD ? 'OP' : 'PT'}?`, size: [100, 60],
        ...numeric(askD ? dd : t, askD ? [r + t, t - r, Math.round(Math.sqrt(t * t - r * r)) || t + 1] : [dd - r, dd + r, Math.round(Math.sqrt(dd * dd + r * r))]),
        steps: ['A tangent is perpendicular to the radius at the point where it touches.', 'So OTP is a right triangle with hypotenuse OP.', askD ? `OP = √(${r * r} + ${t * t}) = ${dd}` : `PT = √(${dd * dd} - ${r * r}) = ${t}`],
        fig: (c, w, h) => {
          const O = [24, h / 2], R = 18, Tt = [O[0] + R * Math.cos(1.0), O[1] - R * Math.sin(1.0)], dir = [Math.sin(1.0), Math.cos(1.0)], P = [Tt[0] + dir[0] * 58, Tt[1] + dir[1] * 58];
          F.circle(c, ...O, R, INK); F.dot(c, O, INK); F.line(c, ...O, ...Tt, HOT); F.line(c, ...Tt, ...P, INK); F.line(c, ...O, ...P, DIM, 2);
          F.label(c, 'O', O[0] - 6, O[1] + 1, DIM); F.label(c, 'T', Tt[0] - 2, Tt[1] - 6, DIM); F.label(c, 'P', P[0] + 5, P[1], DIM);
        },
      };
    }
    if (f === 1) {
      const x = randInt(2, 9), a = randInt(1, 4), b = randInt(1, 9), c = a + randInt(1, 3), e = (a - c) * x + b;
      return {
        topic: 'CIRCLES', text: `From point P outside a circle, two tangents touch it at A and B. PA = ${lin(a, b)} and PB = ${lin(c, e)}. What is x?`,
        ...numeric(x, [(e - b) / (a + c), x + 2, a * x + b, -x].filter(Number.isInteger)),
        steps: ['Two tangents from the same outside point are equal.', `${lin(a, b)} = ${lin(c, e)}`, `x = ${x}`],
      };
    }
    if (f === 2) {
      const [p, q, r] = pick([[4, 6, 3], [2, 9, 3], [5, 4, 2], [6, 6, 4], [3, 8, 4], [2, 12, 4], [3, 10, 5], [4, 9, 6]]), s = p * q / r;
      return {
        topic: 'CIRCLES', text: `Chords AB and CD cross at E inside a circle. AE = ${p}, EB = ${q} and CE = ${r}. What is ED?`,
        ...numeric(s, [p + q - r, p * r / q, q * r / p, s + 1].filter(Number.isInteger)),
        steps: ['Crossing chords: AE × EB = CE × ED', `${p} × ${q} = ${r} × ED`, `ED = ${p * q} ÷ ${r} = ${s}`],
      };
    }
    const [t, a, b] = pick([[6, 4, 9], [4, 2, 8], [6, 3, 12], [10, 5, 20], [12, 8, 18], [8, 4, 16]]);
    return {
      topic: 'CIRCLES', text: `From P, a tangent touches a circle at T, and a secant meets the circle at A and then B. PA = ${a} and PB = ${b}. What is PT?`,
      ...numeric(t, [(a + b) / 2, b - a, Math.round(Math.sqrt(a * a + b * b)), a * b].filter(Number.isInteger)),
      steps: ['Tangent-secant: PT^2 = PA × PB', `PT^2 = ${a} × ${b} = ${a * b}`, `PT = ${t}`],
    };
  };

  // IXL geometric probability: chance from lengths and areas.
  kinds.geoProb = d => {
    if (rand() < .4) {
      const L = 2 * randInt(4, 15), k = randInt(1, L / 2 - 1), right = fr(2 * k, L);
      return {
        topic: 'PROBABILITY', text: `A point is picked at random on a ${L}-inch segment. What is the probability it lands within ${k} inches of the midpoint?`,
        ...textual(right, [fr(k, L), fr(L - 2 * k, L), fr(2 * k, L + 2), fr(k, L / 2 + k)].filter(v => v !== right)),
        steps: [`The good part runs ${k} inches each side of the midpoint: ${2 * k} inches.`, `${2 * k}/${L} = ${right}`],
      };
    }
    const s = 2 * randInt(3, 10), r = randInt(1, s / 2), PF = (n, q) => { const g = gcd(n, q); n /= g; q /= g; return (n === 1 ? '' : n) + 'π' + (q === 1 ? '' : '/' + q); }, right = PF(r * r, s * s);
    return {
      topic: 'PROBABILITY', text: `A dart lands at random on a square board ${s} inches on a side. A circle of radius ${r} is painted on it. What is the probability the dart lands in the circle?`,
      ...textual(right, [PF(2 * r, s * s), PF(r * r, s), PF(r, s), PF(4 * r * r, s * s), fr(r * r, s * s)].filter(v => v !== right)),
      steps: [`Circle: π(${r})^2 = ${r * r}π. Board: ${s}^2 = ${s * s}.`, `${r * r}π/${s * s} = ${right}`],
    };
  };

  // ---- More statistics and probability

  // S.ID.4: normal distributions, the 68-95-99.7 rule, z-scores.
  const share = (lo, hi) => { let s = 0; for (let k = lo + 1; k <= hi; k++) s += { '-2': 2.35, '-1': 13.5, '0': 34, '1': 34, '2': 13.5, '3': 2.35 }[k] || 0; return r2(s); };
  kinds.normalDist = d => {
    const f = d < 4 ? randInt(0, 2) : randInt(0, 3), mu = randInt(10, 30) * 5, sd = pick([4, 5, 6, 8, 10, 12, 15]);
    const what = pick(['Scores in a skateboard trick contest', 'Heights of the players in a youth league, in centimeters,', 'Times to finish a 5K fun run, in minutes,', 'Weights of the pumpkins at a farm stand, in ounces,']);
    if (f === 0 || f === 3) {
      const ranges = [[-1, 1], [-2, 2], [-3, 3], [0, 1], [0, 2], [-1, 2], [-2, 1], [1, 3], [-2, 0]];
      const [lo, hi] = pick(ranges), ans = share(lo, hi), L = mu + lo * sd, H = mu + hi * sd;
      const wr = [share(lo, hi + 1), share(lo - 1, hi), 68, 95, 50, 34, 47.5, 81.5, 99.7].filter(v => v !== ans);
      return {
        topic: 'NORMAL DIST', text: `${what} are normally distributed with mean ${mu} and standard deviation ${sd}. About what percent are between ${L} and ${H}?`, ...(f === 3 ? { size: [110, 50] } : {}),
        ...textual(ans + '%', [...new Set(wr)].slice(0, 6).map(v => v + '%')),
        steps: [`${L} is ${lo} SD from the mean; ${H} is ${hi} SD from the mean.`, 'Rule of thumb: 34% in each band next to the mean, 13.5% in the next, 2.35% in the next.', `Add the bands: ${ans}%`],
        ...(f === 3 ? { fig: (c, w, h) => {
          const P = x => [Math.round(5 + (x + 3.4) / 6.8 * (w - 10)), 0], y = z => Math.exp(-z * z / 2), base = h - 10;
          for (let px2 = 5; px2 < w - 5; px2++) { const z = (px2 - 5) / (w - 10) * 6.8 - 3.4, top = Math.round(base - y(z) * (base - 4)); if (z >= lo && z <= hi) F.box(c, px2, top, 1, base - top, '#2a3a78'); c.fillStyle = HOT; c.fillRect(px2, top, 1, 1); }
          F.line(c, 3, base, w - 4, base, DIM);
          for (const k of [lo, hi]) F.label(c, String(mu + k * sd), P(k)[0], base + 6, INK);
        } } : {}),
      };
    }
    if (f === 1) {
      const z = pick([-2.5, -2, -1.5, -1, -.5, .5, 1, 1.5, 2, 2.5, 3]), x = mu + z * sd;
      return {
        topic: 'NORMAL DIST', text: `${what} have mean ${mu} and standard deviation ${sd}. What is the z-score of ${x}?`,
        ...numeric(z, [x - mu, -z, sd / (x - mu), z * 2, z + 1].filter(v => v !== 0), v => String(v)),
        steps: ['z = (value - mean) / standard deviation', `(${x} - ${mu}) / ${sd} = ${x - mu} / ${sd}`, `= ${z}`],
      };
    }
    const a = who(); let b; do b = who(); while (b === a);
    const m1 = randInt(60, 80), s1 = pick([4, 6, 8]), z1 = pick([1, 1.5, 2, 2.5]), x1 = m1 + z1 * s1, m2 = randInt(60, 80), s2 = pick([10, 12, 16]), z2 = pick([.5, 1, 1.5].filter(v => v !== z1)), x2 = m2 + z2 * s2;
    const right = z1 > z2 ? `${a}: z = ${z1}` : `${b}: z = ${z2}`;
    return {
      topic: 'NORMAL DIST', text: `${a} scored ${x1} on a test with mean ${m1} and SD ${s1}. ${b} scored ${x2} on a test with mean ${m2} and SD ${s2}. Who did better compared with their class?`,
      ...textual(right, [`${a}: z = ${z1}`, `${b}: z = ${z2}`, 'They did equally well', `${x1 > x2 ? a : b}: the higher score`].filter(v => v !== right)),
      steps: [`${a}: (${x1} - ${m1}) / ${s1} = ${z1}`, `${b}: (${x2} - ${m2}) / ${s2} = ${z2}`, 'The larger z-score did better relative to the class.'],
    };
  };

  // S.IC.1-6: samples, bias, estimates from samples.
  const METHODS = [['picks every 10th name on the school roster', 'Systematic sample'], ['draws 50 names at random from all students', 'Simple random sample'], ['surveys the first 30 students to walk in', 'Convenience sample'],
    ['picks 20 students at random from each grade', 'Stratified sample'], ['posts a poll online for anyone to answer', 'Voluntary response'], ['picks 3 homerooms at random and asks everyone in them', 'Cluster sample']];
  kinds.sampling = d => {
    const f = d < 2 ? pick([0, 2]) : randInt(0, 2);
    if (f === 0) {
      const [how, right] = pick(METHODS);
      return {
        topic: 'SAMPLING', text: `To learn what students think of the new lunch menu, a principal ${how}. What kind of sample is this?`,
        ...textual(right, shuffle(METHODS.map(m => m[1]).filter(m => m !== right))),
        steps: [{ 'Systematic sample': 'A fixed pattern, like every 10th name.', 'Simple random sample': 'Everyone has the same chance of being picked.', 'Convenience sample': 'Whoever is easy to reach: likely biased.', 'Stratified sample': 'Random picks from each group.', 'Voluntary response': 'People choose to answer: likely biased.', 'Cluster sample': 'Whole groups picked at random.' }[right], `So it is a ${right.toLowerCase()}.`],
      };
    }
    if (f === 1) {
      const [topic, biased, good] = pick([
        ['how many hours teens sleep', 'Asking students in a 6 a.m. weight-lifting club', 'Asking a random sample of all students'],
        ['which pizza place is the town favorite', "Asking customers leaving Tony's Pizza", 'Asking a random sample of town residents'],
        ['how much people read', 'Asking people at the public library', 'Asking a random sample of city residents'],
        ['whether a skate park should be built', 'Asking kids at the skate shop', 'Asking a random sample of town voters'],
      ]);
      const askBiased = rand() < .5;
      return {
        topic: 'SAMPLING', text: `A survey will estimate ${topic}. Which plan is ${askBiased ? 'most likely to be biased' : 'least likely to be biased'}?`,
        ...textual(askBiased ? biased : good, askBiased ? [good, 'Asking a random sample of all residents', 'Picking names at random from a full list'] : [biased, 'Asking only friends and family', 'Posting a poll for anyone to answer']),
        steps: ['A sample is biased when some groups are more likely to be included.', `${biased} leans one way; a random sample of the whole group does not.`],
      };
    }
    const n = pick([40, 50, 80, 100, 120, 200]), k = Math.round(n * pick([.15, .2, .25, .3, .35, .4, .45])), N = pick([600, 800, 1000, 1200, 1500, 2000]), est = k * N / n;
    return {
      topic: 'SAMPLING', text: `In a random sample of ${n} students, ${k} bike to school. About how many of the school's ${cm(N)} students bike to school?`,
      ...numeric(est, [k, N - est, Math.round(N / k), k * 10], v => cm(Math.round(v))),
      steps: [`In the sample, ${k}/${n} = ${r2(k / n * 100)}% bike.`, `${r2(k / n * 100)}% of ${cm(N)} = ${cm(Math.round(est))}`],
    };
  };

  // S.MD.2-4, S.MD.6-7 (+): expected value.
  kinds.expectedValue = d => {
    const f = randInt(0, 2);
    if (f === 0) {
      const den = pick([4, 5, 8, 10]), k = randInt(1, den - 1), win = pick([2, 3, 4, 5, 8, 10, 12]), lose = pick([1, 2, 3]), ev = r2(win * k / den - lose * (den - k) / den);
      const fmt = v => (v < 0 ? '-$' : '$') + Math.abs(v).toFixed(2);
      return {
        topic: 'EXPECTED VALUE', text: `A boardwalk game costs nothing to try. You win $${win} with probability ${fr(k, den)}; otherwise you lose $${lose}. What is the expected value of one play?`,
        ...numeric(ev, [r2(win * k / den), r2(win - lose), r2((win - lose) / 2), r2(win * k / den + lose * (den - k) / den), r2(-ev)].filter(v => v !== ev), fmt),
        steps: [`E = (${win})(${fr(k, den)}) + (-${lose})(${fr(den - k, den)})`, `= ${r2(win * k / den)} - ${r2(lose * (den - k) / den)}`, `= ${fmt(ev)}`],
      };
    }
    if (f === 1) {
      const T = pick([200, 250, 500, 1000]), price = pick([1, 2, 5]), p1 = pick([100, 200, 250]), p2 = pick([50, 0]), ev = r2((p1 + p2) / T - price);
      const fmt = v => (v < 0 ? '-$' : '$') + Math.abs(v).toFixed(2);
      return {
        topic: 'EXPECTED VALUE', text: `A school raffle sells ${cm(T)} tickets at $${price} each. One ticket wins $${p1}${p2 ? ` and one wins $${p2}` : ''}. What is the expected value of buying one ticket?`,
        ...numeric(ev, [r2((p1 + p2) / T), r2(p1 + p2 - price), -price, r2(ev - price)].filter(v => v !== ev), fmt),
        steps: [`Expected winnings: $${p1 + p2} ÷ ${cm(T)} = $${r2((p1 + p2) / T).toFixed(2)}`, `Minus the $${price} ticket: ${fmt(ev)}`],
      };
    }
    let ps, tries = 0; do { ps = [randInt(1, 4), randInt(1, 4), randInt(1, 4), randInt(1, 4)]; } while (ps.reduce((a, b) => a + b) !== 10 && ++tries < 80);
    if (tries >= 80) ps = [1, 3, 4, 2];
    const xs = [0, 1, 2, 3], ev = r2(xs.reduce((s, x, i) => s + x * ps[i] / 10, 0));
    return {
      topic: 'EXPECTED VALUE', text: `The number X of free throws ${who()} makes in 3 tries is 0, 1, 2 or 3 with probabilities ${ps.map(p => p / 10).join(', ')}. What is the expected value of X?`,
      ...numeric(ev, [1.5, r2(ev + .5), r2(ps.reduce((a, b) => a + b) / 4 / 10 * 6), r2(ev - .3), 2].filter(v => v !== ev), v => String(v)),
      steps: ['E(X) = sum of value × probability', xs.map((x, i) => `${x}(${ps[i] / 10})`).join(' + '), `= ${ev}`],
    };
  };

  // S.CP.9 (+), S.CP.8: counting principle, permutations, combinations, and probability with them.
  const fact = n => n <= 1 ? 1 : n * fact(n - 1), P = (n, r) => fact(n) / fact(n - r);
  kinds.counting = d => {
    const f = d < 3 ? randInt(0, 2) : randInt(0, 4);
    if (f === 0) {
      const a = randInt(2, 5), b = randInt(3, 8), c = randInt(2, 4);
      return {
        topic: 'COUNTING', text: `A pizza shop offers ${a} crusts, ${b} toppings and ${c} sizes. How many different one-topping pizzas can you order?`,
        ...numeric(a * b * c, [a + b + c, a * b + c, a * b, (a + b) * c]),
        steps: ['Counting principle: multiply the choices.', `${a} × ${b} × ${c} = ${a * b * c}`],
      };
    }
    if (f === 1) {
      const n = randInt(5, 10), r = randInt(2, 3);
      return {
        topic: 'COUNTING', text: `${n} skaters enter a contest. In how many ways can they finish 1st, 2nd${r === 3 ? ' and 3rd' : ''}?`,
        ...numeric(P(n, r), [P(n, r) / fact(r), n ** r, n * r, P(n, r) * 2], cm),
        steps: ['Order matters: a permutation.', r === 3 ? `${n} × ${n - 1} × ${n - 2}` : `${n} × ${n - 1}`, `= ${cm(P(n, r))}`],
      };
    }
    if (f === 2) {
      const n = randInt(5, 10), r = randInt(2, 4), C = choose(n, r);
      return {
        topic: 'COUNTING', text: `How many ways can you choose ${r} toppings from ${n} different toppings?`,
        ...numeric(C, [P(n, r), n * r, n ** r, choose(n, r - 1)].filter(v => v !== C), cm),
        steps: ['Order does not matter: a combination.', `C(${n}, ${r}) = ${cm(P(n, r))} ÷ ${fact(r)}`, `= ${cm(C)}`],
      };
    }
    if (f === 3) {
      const j = randInt(4, 7), s = randInt(3, 6), T = j + s, right = fr(choose(s, 2), choose(T, 2));
      return {
        topic: 'PROBABILITY', text: `Two students are chosen at random from ${j} juniors and ${s} seniors. What is the probability both are seniors?`,
        ...textual(right, [fr(s * s, T * T), fr(s, T), fr(2 * s, T), fr(choose(j, 2), choose(T, 2)), fr(s - 1, T - 1)].filter(v => v !== right)),
        steps: [`Ways to pick 2 seniors: C(${s}, 2) = ${choose(s, 2)}`, `Ways to pick any 2: C(${T}, 2) = ${choose(T, 2)}`, `P = ${choose(s, 2)}/${choose(T, 2)} = ${right}`],
      };
    }
    const [word, count] = pick([['MOM', 3], ['BOOK', 12], ['LEVEL', 30], ['PIZZA', 60], ['TOOT', 6], ['RADAR', 30], ['GAME', 24], ['BANANA', 60]]);
    return {
      topic: 'COUNTING', text: `How many different arrangements are there of the letters in ${word}?`,
      ...numeric(count, [fact(word.length), word.length ** 2, count * 2, fact(word.length - 1)].filter(v => v !== count)),
      steps: [`${word.length} letters: ${word.length}! = ${fact(word.length)} if all were different.`, 'Divide by the arrangements of each repeated letter.', `= ${count}`],
    };
  };

  // S.ID.1, S.ID.2: box plots.
  kinds.boxPlot = d => {
    const v = [2 * randInt(1, 4)]; for (let i = 0; i < 4; i++) v.push(v[i] + 2 * randInt(2, 4));
    const [mn, q1, med, q3, mx] = v, ask = pick(d < 2 ? ['median', 'range'] : ['median', 'IQR', 'range', 'percent']);
    const ans = { median: med, IQR: q3 - q1, range: mx - mn, percent: 25 }[ask];
    const wrongs = { median: [q1, q3, (mn + mx) / 2, mx - mn], IQR: [mx - mn, q3 - med, med - q1, q3], range: [q3 - q1, mx, mx + mn, med], percent: [50, 75, 100, 33] }[ask];
    return {
      topic: 'STATISTICS', text: ask === 'percent' ? `The box plot shows points scored by a team. About what percent of the games had more than ${q3} points?` : `The box plot shows points scored by a team. What is the ${ask === 'IQR' ? 'interquartile range' : ask} of the data?`, size: [130, 44],
      ...numeric(ans, wrongs.filter(w => Number.isInteger(w)), ask === 'percent' ? (x => x + '%') : String),
      steps: [`Read the plot: min ${mn}, Q1 ${q1}, median ${med}, Q3 ${q3}, max ${mx}.`, { median: `The line inside the box is the median: ${med}.`, IQR: `IQR = Q3 - Q1 = ${q3} - ${q1} = ${q3 - q1}`, range: `Range = max - min = ${mx} - ${mn} = ${mx - mn}`, percent: 'Each part of a box plot holds about 25% of the data; above Q3 is the top 25%.' }[ask]],
      fig: (c, w, h) => {
        const lo = 0, hi = 40, X = t => Math.round(6 + (t - lo) / (hi - lo) * (w - 12)), y = 16, base = h - 12;
        F.line(c, 6, base, w - 6, base, DIM);
        for (let t = 0; t <= hi; t += 2) { F.line(c, X(t), base, X(t), base + (t % 10 ? 1 : 3), DIM); if (t % 10 === 0) F.label(c, String(t), X(t), base + 8, DIM); }
        F.line(c, X(mn), y, X(q1), y, INK); F.line(c, X(q3), y, X(mx), y, INK);
        F.line(c, X(mn), y - 4, X(mn), y + 4, INK); F.line(c, X(mx), y - 4, X(mx), y + 4, INK);
        F.outlinePoly(c, [[X(q1), y - 7], [X(q3), y - 7], [X(q3), y + 7], [X(q1), y + 7]], HOT); F.line(c, X(med), y - 7, X(med), y + 7, HOT);
      },
    };
  };

  Questions.grade({
    id: 'hs', n: 9, label: 'HIGH SCHOOL', short: 'HS', clock: [38, 35, 32, 30, 28], kinds,
    min: { complex: 3, quadFormula: 2, completeSquare: 2, discriminant: 2, radicalEq: 2, inverseFn: 2, composeFn: 2, circleEq: 2,
      trigSolve: 2, circleArc: 2, inscribed: 2, independence: 2, specialRight: 2, twoWay: 1,
      funcOps: 2, ineq2var: 2, piecewise: 2, absGraph: 2, expGraph: 2, triangleProps: 1, quadrilaterals: 1, proofs: 2, constructions: 2, transformRules: 2,
      circleTheorems: 2, surfaceArea: 1, densityModel: 2, crossSection: 1, counting: 2, sampling: 2, geoProb: 2, boxPlot: 1,
      polyDivision: 3, polyIdentity: 3, polyGraph: 3, rationalExpr: 3, rationalEq: 3, rationalFn: 3, logs: 3, series: 3, system3: 3, quadIneq: 3,
      matrices: 3, unitCircle: 3, lawSinesCos: 3, normalDist: 3, expectedValue: 3,
      trigGraphs: 4, complexDivide: 4, parabolaFocus: 4 },
  });
})();
