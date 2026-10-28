'use strict';
// The quiz panel and Mr. Delgado's chalkboard: where a question's text, figure and four answers go,
// and drawing them. The answers sit four across when they're short, two across when they're not,
// one per row when they're long, and wrap onto more lines inside their boxes when they need to.
// check() says when a question can't fit, so Questions.selfTest can catch it before a player does.

// Drawing helpers the quiz shares with the rest of the game.
const BANDS = {
  red: ['#ff9a6a', '#ff4a30', '#e81c18', '#c00c0c', '#8a0808'],
  gold: ['#fffbe0', '#fff080', '#ffd030', '#f0a010', '#c06808'],
  blue: ['#e8f4ff', '#a0d0ff', '#5898ff', '#2860e8', '#1434a8'],
  green: ['#effff0', '#a0ff90', '#48e848', '#20a828', '#107018'],
};
const pad = (n, k) => String(Math.max(0, Math.floor(n))).padStart(k, '0');
const blink = (rate = 2) => Math.floor(Game.t * rate * 2) % 2 === 0;
const rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
function bigText(ctx, s, scale, bands, cx, y) { const c = Font.big(s, scale, bands); ctx.drawImage(c, Math.round(cx - c.width / 2), Math.round(y)); return c; }
// The blue arcade panel from the concept art.
function panel(ctx, x, y, w, h, fill = '#0a0e30', edge = '#3c6cf8') {
  rect(ctx, x, y, w, h, '#000');
  rect(ctx, x + 1, y + 1, w - 2, h - 2, edge);
  rect(ctx, x + 3, y + 3, w - 6, h - 6, '#1c2c80');
  rect(ctx, x + 4, y + 4, w - 8, h - 8, fill);
}

const Quiz = (() => {
  const PX = 6, PW = W - 12, INNER = PW - 12, TOP = 12, MAX_H = H - TOP - 4;
  const FIG = [100, 56], FIG_MAX = [168, 96];
  const BOARD = { x: 14, w: W - 28, h: 192 };
  const label = (q, k) => 'ABCD'[k] + ')  ' + q.choices[k];
  const widest = (lines, bold = true) => Math.max(0, ...lines.map(s => Font.width(s, bold)));

  function figSize(q) {
    if (!q.fig) return [0, 0];
    const [w, h] = q.size || FIG;
    return [Math.min(w, FIG_MAX[0]), Math.min(h, FIG_MAX[1])];
  }

  // o.bar: leave a line under the answers for the power-ups in play.
  function layout(q, o = {}) {
    const fig = !!q.fig, [figW, figH] = figSize(q);
    // Without a figure, the clock box (and "HALF SPEED" under it) takes the top right corner.
    const textW = INNER - (fig ? figW + 8 : 66);
    const lines = Font.wrap(q.text, textW);
    const bodyH = Math.max(lines.length * 10, fig ? figH : 22);
    let cols, bw, wrapped;
    for (cols of [4, 2, 1]) {
      bw = Math.floor((INNER - (cols - 1) * 6) / cols);
      wrapped = q.choices.map((s, k) => Font.wrap(label(q, k), bw - 10, true));
      const fits = wrapped.every(l => widest(l) <= bw - 6);
      if (fits && (cols === 4 ? wrapped.every(l => l.length === 1) : cols === 2 ? wrapped.every(l => l.length <= 2) : true)) break;
    }
    const ay = 18 + bodyH + 5, boxes = [];
    let y = ay;
    for (let r = 0; r < 4 / cols; r++) {
      const row = wrapped.slice(r * cols, r * cols + cols), bh = 5 + 10 * Math.max(...row.map(l => l.length));
      row.forEach((l, i) => boxes.push({ x: PX + 6 + i * (bw + 6), y, w: bw, h: bh, lines: l }));
      y += bh + 4;
    }
    let ph = y + 4;
    const barY = o.bar ? ph - 1 : 0;
    if (barY) ph += 11;
    let figC = null;
    if (fig) { figC = canvas(figW, figH); const x = figC.getContext('2d'); x.fillStyle = '#0c1028'; x.fillRect(0, 0, figW, figH); q.fig(x, figW, figH); }
    return { px: PX, pw: PW, lines, textW, cols, boxes, ph, barY, figC, figX: PX + PW - 6 - figW, figY: 18, y: TOP, fig,
      fits: ph <= MAX_H && widest(lines, false) <= textW };
  }

  // The panel at y0. E: { q, sel, elim, phase ('quiz' or 'reveal'), pick, calcT, coffee, time, coffeeTag }.
  function draw(ctx, E, L, y0) {
    const q = E.q;
    panel(ctx, L.px, y0, L.pw, L.ph);
    Font.draw(ctx, 'POP QUIZ!', L.px + 8, y0 + 6, '#ff4848', { bold: true });
    Font.draw(ctx, q.topic, L.px + 72, y0 + 6, '#6878c0');
    const secs = Math.max(0, Math.ceil(E.time));
    const clock = pad(Math.floor(secs / 60), 2) + ':' + pad(secs % 60, 2);
    const tc = secs <= 5 ? (blink(4) ? BANDS.red : BANDS.gold) : BANDS.red;
    if (L.fig) {
      Font.draw(ctx, (E.coffee ? 'COFFEE  ' : '') + clock, L.px + L.pw - 10, y0 + 6, secs <= 5 && blink(4) ? '#ffffff' : '#ff4848', { bold: true, align: 'right' });
      ctx.drawImage(L.figC, L.figX, y0 + L.figY);
      rect(ctx, L.figX - 1, y0 + L.figY - 1, L.figC.width + 2, 1, '#3c6cf8'); rect(ctx, L.figX - 1, y0 + L.figY + L.figC.height, L.figC.width + 2, 1, '#3c6cf8');
    } else {
      const bx = L.px + L.pw - 66;
      rect(ctx, bx, y0 + 5, 58, 24, '#000'); rect(ctx, bx + 1, y0 + 6, 56, 22, E.coffee ? '#5a3a10' : '#f0a020'); rect(ctx, bx + 2, y0 + 7, 54, 20, '#140404');
      bigText(ctx, clock, 2, tc, bx + 29, y0 + 6);
      if (E.coffee) Font.draw(ctx, 'HALF SPEED', bx + 29, y0 + 31, '#ffd040', { align: 'center', outline: '#000' });
    }
    L.lines.forEach((s, i) => Font.draw(ctx, s, L.px + 8, y0 + 18 + i * 10, '#ffffff'));
    L.boxes.forEach((b, k) => {
      const x = b.x, y = y0 + b.y, sel = k === E.sel && E.phase === 'quiz', out = E.elim.includes(k);
      let fill = '#0c1440', edge = '#3c6cf8', ink = '#ffffff';
      if (out) { fill = '#121218'; edge = '#2a2a38'; ink = '#3a3a4a'; }
      if (sel) { fill = '#1c2c78'; edge = blink(4) ? '#ffe040' : '#ffffff'; }
      if (E.phase === 'reveal') {
        if (k === q.answer) { fill = blink(5) ? '#1c8a30' : '#127020'; edge = '#80ff90'; }
        else if (k === E.pick) { fill = '#9a1414'; edge = '#ff7070'; }
      }
      rect(ctx, x, y, b.w, b.h, '#000'); rect(ctx, x + 1, y + 1, b.w - 2, b.h - 2, edge); rect(ctx, x + 2, y + 2, b.w - 4, b.h - 4, fill);
      b.lines.forEach((s, i) => Font.draw(ctx, s, x + b.w / 2, y + 4 + i * 10, ink, { bold: true, align: 'center' }));
      if (out) {
        // Crossed out by the TI-83: a red X, after a white flash.
        if (E.calcT < .25) rect(ctx, x + 2, y + 2, b.w - 4, b.h - 4, blink(12) ? '#ffffff' : '#80ff80');
        for (let i = 0; i < b.w - 8; i++) {
          const v = Math.round(i * (b.h - 5) / (b.w - 9));
          rect(ctx, x + 4 + i, y + 2 + v, 1, 1, '#e02020'); rect(ctx, x + 4 + i, y + b.h - 3 - v, 1, 1, '#e02020');
        }
      }
      if (sel && blink(4)) Font.draw(ctx, '→', x - 1, y + 4, '#ffe040', { bold: true, align: 'right' });
    });
    if (E.phase === 'reveal') {
      const s = E.pick === -1 ? "TIME'S UP!" : E.ok ? 'CORRECT!' : 'WRONG!';
      bigText(ctx, s, 3, E.ok ? BANDS.green : BANDS.red, W / 2, Math.min(y0 + L.ph + 4, H - 30));
    }
  }
  // Which box a tap at (x, y) lands on, or -1.
  function hit(L, y0, x, y) { return L.boxes.findIndex(b => x >= b.x && x < b.x + b.w && y >= y0 + b.y && y < y0 + b.y + b.h); }

  // ---- The chalkboard: the question again, what you said, the working, the answer.
  function board(q, pick) {
    const { w } = BOARD, [figW, figH] = figSize(q);
    const ql = Font.wrap(q.text, q.fig ? w - 16 - figW - 8 : w - 16);
    const said = Font.wrap(pick === -1 ? 'YOU SAID: NOTHING. OUT OF TIME.' : `YOU SAID: (${'ABCD'[pick]}) ${q.choices[pick]}`, w - 16, true);
    const steps = q.steps.map(s => Font.wrap(s, w - 24));
    const ans = Font.wrap(`ANSWER: (${'ABCD'[q.answer]}) ${q.choices[q.answer]}`, w - 16 - 60, true);
    const top = 24 + Math.max(ql.length * 10, q.fig ? figH : 0);
    const end = top + said.length * 10 + 3 + steps.reduce((s, l) => s + l.length * 10, 0) + 3 + ans.length * 10;
    return { ql, said, steps, ans, top, end, fits: end <= BOARD.h - 14 };
  }
  function drawBoard(ctx, q, pick, figC, k, prompt) {
    const B = board(q, pick), { x: x0, w } = BOARD, hh = BOARD.h, y0 = Math.round(16 - (1 - k) * 220);
    rect(ctx, x0 - 4, y0 - 4, w + 8, hh + 8, '#5a3418'); rect(ctx, x0 - 3, y0 - 3, w + 6, 1, '#8a5a30');
    rect(ctx, x0, y0, w, hh, '#1a4430');
    if (!drawBoard.dust) { const d = (drawBoard.dust = canvas(w, hh)).getContext('2d'); for (let i = 0; i < 500; i++) { d.fillStyle = rand() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.09)'; d.fillRect(Math.floor(rand() * w), Math.floor(rand() * hh), 1 + Math.floor(rand() * 4), 1); } }
    ctx.drawImage(drawBoard.dust, x0, y0);
    const chalk = '#eef2e4', yel = '#f8e870', red = '#ff8a80';
    Font.draw(ctx, "LET'S GO OVER IT.", x0 + 8, y0 + 6, yel, { bold: true });
    B.ql.forEach((s, i) => Font.draw(ctx, s, x0 + 8, y0 + 20 + i * 10, '#a8c8b4'));
    if (q.fig && figC) ctx.drawImage(figC, x0 + w - 8 - figC.width, y0 + 20);
    let y = y0 + B.top;
    for (const s of B.said) { Font.draw(ctx, s, x0 + 8, y, red, { bold: true }); y += 10; }
    y += 3;
    for (const l of B.steps) for (const s of l) { Font.draw(ctx, s, x0 + 14, y, chalk); y += 10; }
    y += 3;
    for (const s of B.ans) { Font.draw(ctx, s, x0 + 8, y, yel, { bold: true }); y += 10; }
    Font.draw(ctx, '- MR. DELGADO, PERIOD 3', x0 + w - 8, y0 + hh - 12, '#a8c8b4', { align: 'right' });
    rect(ctx, x0 + 20, y0 + hh, 26, 4, '#e8e8e0'); rect(ctx, x0 + 60, y0 + hh, 8, 3, '#f0f0f0');
    if (prompt && blink(2)) Font.draw(ctx, 'PRESS A', x0 + 8, y0 + hh - 12, yel, { bold: true });
  }

  // Why a question won't display well, or null. Checked with the power-up line, the tallest case.
  function check(q) {
    const [fw, fh] = q.size || FIG;
    if (q.fig && (fw > FIG_MAX[0] || fh > FIG_MAX[1])) return 'figure too big';
    const L = layout(q, { bar: true });
    if (widest(L.lines, false) > L.textW) return 'text too wide';
    if (L.ph > MAX_H) return `panel too tall (${L.ph} > ${MAX_H})`;
    if (L.boxes.some(b => widest(b.lines) > b.w - 6)) return 'answer too wide';
    for (let k = 0; k < 4; k++) { const B = board(q, k); if (!B.fits) return `board too tall (${B.end} > ${BOARD.h - 14})`; }
    if (!board(q, -1).fits) return 'board too tall';
    return null;
  }
  return { layout, draw, hit, board, drawBoard, check, FIG, FIG_MAX };
})();
