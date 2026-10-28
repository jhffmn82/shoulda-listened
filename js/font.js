'use strict';
// The arcade font: a hand-drawn 5 x 7 proportional font with lowercase and math signs,
// a bold version made by doubling each pixel sideways, and big gradient letters for titles.

const GLYPHS = {
  'A': '.###.|#...#|#...#|#####|#...#|#...#|#...#',
  'B': '####.|#...#|#...#|####.|#...#|#...#|####.',
  'C': '.###.|#...#|#....|#....|#....|#...#|.###.',
  'D': '####.|#...#|#...#|#...#|#...#|#...#|####.',
  'E': '#####|#....|#....|####.|#....|#....|#####',
  'F': '#####|#....|#....|####.|#....|#....|#....',
  'G': '.###.|#...#|#....|#.###|#...#|#...#|.####',
  'H': '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  'I': '###|.#.|.#.|.#.|.#.|.#.|###',
  'J': '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
  'K': '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
  'L': '#....|#....|#....|#....|#....|#....|#####',
  'M': '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
  'N': '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
  'O': '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  'P': '####.|#...#|#...#|####.|#....|#....|#....',
  'Q': '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
  'R': '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  'S': '.####|#....|#....|.###.|....#|....#|####.',
  'T': '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  'U': '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  'V': '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  'W': '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.',
  'X': '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  'Y': '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
  'Z': '#####|....#|...#.|..#..|.#...|#....|#####',
  'a': '.....|.....|.###.|....#|.####|#...#|.####',
  'b': '#....|#....|#.##.|##..#|#...#|#...#|####.',
  'c': '.....|.....|.###.|#....|#....|#...#|.###.',
  'd': '....#|....#|.##.#|#..##|#...#|#...#|.####',
  'e': '.....|.....|.###.|#...#|#####|#....|.###.',
  'f': '..##|.#..|###.|.#..|.#..|.#..|.#..',
  'g': '.....|.....|.####|#...#|#...#|#...#|.####|....#|.###.',
  'h': '#....|#....|#.##.|##..#|#...#|#...#|#...#',
  'i': '.#.|...|##.|.#.|.#.|.#.|###',
  'j': '...#|....|..##|...#|...#|...#|...#|#..#|.##.',
  'k': '#...|#...|#..#|#.#.|##..|#.#.|#..#',
  'l': '#..|#..|#..|#..|#..|#..|.##',
  'm': '.....|.....|##.#.|#.#.#|#.#.#|#...#|#...#',
  'n': '.....|.....|#.##.|##..#|#...#|#...#|#...#',
  'o': '.....|.....|.###.|#...#|#...#|#...#|.###.',
  'p': '.....|.....|####.|#...#|#...#|#...#|####.|#....|#....',
  'q': '.....|.....|.####|#...#|#...#|#...#|.####|....#|....#',
  'r': '.....|.....|#.##.|##..#|#....|#....|#....',
  's': '.....|.....|.####|#....|.###.|....#|####.',
  't': '.#..|.#..|###.|.#..|.#..|.#.#|..#.',
  'u': '.....|.....|#...#|#...#|#...#|#..##|.##.#',
  'v': '.....|.....|#...#|#...#|#...#|.#.#.|..#..',
  'w': '.....|.....|#...#|#...#|#.#.#|#.#.#|.#.#.',
  'x': '.....|.....|#...#|.#.#.|..#..|.#.#.|#...#',
  'y': '.....|.....|#...#|#...#|#...#|#...#|.####|....#|.###.',
  'z': '.....|.....|#####|...#.|..#..|.#...|#####',
  '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
  '1': '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
  '2': '.###.|#...#|....#|...#.|..#..|.#...|#####',
  '3': '#####|...#.|..#..|...#.|....#|#...#|.###.',
  '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
  '5': '#####|#....|####.|....#|....#|#...#|.###.',
  '6': '..##.|.#...|#....|####.|#...#|#...#|.###.',
  '7': '#####|....#|...#.|..#..|.#...|.#...|.#...',
  '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  '9': '.###.|#...#|#...#|.####|....#|...#.|.##..',
  ' ': '...|...|...|...|...|...|...',
  '.': '.|.|.|.|.|.|#',
  ',': '..|..|..|..|..|.#|.#|#.',
  '!': '#|#|#|#|#|.|#',
  '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  ':': '.|.|#|.|.|#|.',
  ';': '..|..|.#|..|..|.#|.#|#.',
  "'": '#|#|.|.|.|.|.',
  '"': '#.#|#.#|...|...|...|...|...',
  '-': '....|....|....|####|....|....|....',
  '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
  '=': '.....|.....|#####|.....|#####|.....|.....',
  '(': '..#|.#.|#..|#..|#..|.#.|..#',
  ')': '#..|.#.|..#|..#|..#|.#.|#..',
  '{': '..#|.#.|.#.|#..|.#.|.#.|..#',
  '}': '#..|.#.|.#.|..#|.#.|.#.|#..',
  '[': '##|#.|#.|#.|#.|#.|##',
  ']': '##|.#|.#|.#|.#|.#|##',
  '/': '....#|....#|...#.|..#..|.#...|#....|#....',
  '$': '..#..|.####|#.#..|.###.|..#.#|####.|..#..',
  '%': '##..#|##..#|...#.|..#..|.#...|#..##|#..##',
  '*': '.....|#.#.#|.###.|#####|.###.|#.#.#|.....',
  '<': '...#|..#.|.#..|#...|.#..|..#.|...#',
  '>': '#...|.#..|..#.|...#|..#.|.#..|#...',
  '_': '.....|.....|.....|.....|.....|.....|#####',
  '#': '.#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.',
  '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#',
  '¢': '..#..|.####|#.#..|#.#..|#.#..|.####|..#..',
  '©': '.#####.|#.....#|#..##.#|#.#...#|#..##.#|#.....#|.#####.',
  '×': '.....|#...#|.#.#.|..#..|.#.#.|#...#|.....',
  '÷': '.....|..#..|.....|#####|.....|..#..|.....',
  '√': '...##|...#.|...#.|#..#.|.#.#.|.#.#.|..#..',
  'π': '.....|.....|#####|.#.#.|.#.#.|.#.#.|.#..#',
  '°': '.#.|#.#|.#.|...|...|...|...',
  '≤': '...##|.##..|#....|.##..|...##|.....|#####',
  '≥': '##...|..##.|....#|..##.|##...|.....|#####',
  '±': '..#..|..#..|#####|..#..|..#..|.....|#####',
  '≈': '.....|.##.#|#.##.|.....|.##.#|#.##.|.....',
  '≠': '....#|...#.|#####|..#..|#####|.#...|#....',
  'θ': '.###.|#...#|#...#|#####|#...#|#...#|.###.',
  '·': '.|.|.|#|.|.|.',
  '←': '.....|..#..|.#...|#####|.#...|..#..|.....',
  '→': '.....|..#..|...#.|#####|...#.|..#..|.....',
  '♥': '.....|.#.#.|#####|#####|.###.|..#..|.....',
  '|': '#|#|#|#|#|#|#',
};
// Glyphs that doubling sideways would spoil, drawn bold by hand.
const BOLD = { '°': '.##.|#..#|#..#|.##.|....|....|....' };
// Tiny raised digits for exponents: "x^2" or "2^{10}" in a string.
const SUP = {
  '0': '###|#.#|#.#|#.#|###', '1': '.#.|##.|.#.|.#.|###', '2': '##.|..#|.#.|#..|###', '3': '##.|..#|.#.|..#|##.',
  '4': '#.#|#.#|###|..#|..#', '5': '###|#..|##.|..#|##.', '6': '.##|#..|###|#.#|###', '7': '###|..#|.#.|.#.|.#.',
  '8': '###|#.#|###|#.#|###', '9': '###|#.#|###|..#|##.', '-': '...|...|###|...|...', 'x': '...|#.#|.#.|#.#|...',
  'n': '...|##.|#.#|#.#|...', 't': '.#.|###|.#.|.#.|.##',
  '/': '..#|..#|.#.|#..|#..', '(': '.#|#.|#.|#.|.#', ')': '#.|.#|.#|.#|#.', '.': '.|.|.|.|#', '+': '...|.#.|###|.#.|...', 'm': '.....|####.|#.#.#|#.#.#|.....',
};
const LINE_H = 10;

const Font = (() => {
  const masks = {};
  // One white mask per glyph per weight.
  function glyph(ch, bold, sup) {
    const key = (sup ? 's' : bold ? 'b' : 'r') + ch;
    if (masks[key]) return masks[key];
    const own = bold && !sup && BOLD[ch], src = own || (sup ? SUP[ch] : GLYPHS[ch]) || GLYPHS['?'];
    // Raised exponents are too small to thicken: they stay thin in bold text.
    if (own || sup) bold = false;
    const rows = src.split('|'), w = rows[0].length + (bold ? 1 : 0);
    const c = canvas(w, 9), x = c.getContext('2d');
    x.fillStyle = '#fff';
    rows.forEach((r, y) => {
      for (let i = 0; i < r.length; i++) if (r[i] === '#') { x.fillRect(i, y, 1, 1); if (bold) x.fillRect(i + 1, y, 1, 1); }
    });
    return (masks[key] = { c, w });
  }
  // Split "x^2" markup into runs: [{t:'x'}, {t:'2', sup:true}].
  function runs(str) {
    const out = [];
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '^' && i + 1 < str.length) {
        if (str[i + 1] === '{') { const j = str.indexOf('}', i); for (const ch of str.slice(i + 2, j)) out.push({ t: ch, sup: true }); i = j; }
        else { out.push({ t: str[i + 1], sup: true }); i++; }
      } else out.push({ t: str[i] });
    }
    return out;
  }
  function width(str, bold) {
    let w = 0;
    for (const r of runs(String(str))) w += glyph(r.t, bold, r.sup).w + 1;
    return Math.max(0, w - 1);
  }
  const cache = new Map();
  function render(str, color, bold) {
    const key = (bold ? 'b' : 'r') + color + str;
    let c = cache.get(key);
    if (c) return c;
    if (cache.size > 600) cache.clear();
    // One spare row on top so raised exponents can sit above the capitals.
    c = canvas(Math.max(1, width(str, bold)), 10);
    const x = c.getContext('2d');
    let px = 0;
    for (const r of runs(str)) {
      const g = glyph(r.t, bold, r.sup);
      x.drawImage(g.c, px, r.sup ? 0 : 1);
      px += g.w + 1;
    }
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    cache.set(key, c);
    return c;
  }
  // draw(ctx, 'TEXT', x, y, '#fff', { bold, align: 'left'|'center'|'right', shadow: '#000' })
  function draw(ctx, str, x, y, color, o = {}) {
    str = String(str);
    if (!str) return 0;
    const w = width(str, o.bold);
    if (o.align === 'center') x -= w / 2; else if (o.align === 'right') x -= w;
    x = Math.round(x); y = Math.round(y) - 1;
    if (o.outline) {
      const oc = render(str, o.outline, o.bold);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.drawImage(oc, x + dx, y + dy);
    }
    if (o.shadow) ctx.drawImage(render(str, o.shadow, o.bold), x + 1, y + 1);
    ctx.drawImage(render(str, color, o.bold), x, y);
    return w;
  }
  function wrap(str, maxW, bold) {
    const lines = [];
    for (const para of String(str).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const t = line ? line + ' ' + word : word;
        if (line && width(t, bold) > maxW) { lines.push(line); line = word; } else line = t;
      }
      lines.push(line);
    }
    return lines;
  }
  // Big arcade title letters: bold font scaled up, banded gradient fill, dark outline, drop shadow.
  const bigCache = new Map();
  function big(str, scale, bands, outline = '#100810', shadow = 'rgba(0,0,0,.6)') {
    const key = [str, scale, bands.join(), outline].join('|');
    if (bigCache.has(key)) return bigCache.get(key);
    // th is the capital height the gradient spans; descenders (the comma) take the last band.
    const tw = width(str, true), th = 7, rows = /[,;gjpqy]/.test(str) ? 9 : 7, pad = 3;
    const w = tw * scale + pad * 2 + 2, h = rows * scale + pad * 2 + 2;
    const mask = render(str, '#fff', true);
    const c = canvas(w, h), x = ctxOf(c);
    x.drawImage(mask, 0, 1, tw, rows, pad, pad, tw * scale, rows * scale);
    const img = x.getImageData(0, 0, w, h), d = img.data;
    const fill = bands.map(hexRgb), oc = hexRgb(outline);
    const solid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) solid[i] = d[i * 4 + 3] > 127 ? 1 : 0;
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
      const i = y * w + xx, p = i * 4;
      if (solid[i]) {
        const band = Math.min(fill.length - 1, Math.floor(((y - pad) / (th * scale)) * fill.length));
        const f = fill[Math.max(0, band)];
        d[p] = f[0]; d[p + 1] = f[1]; d[p + 2] = f[2]; d[p + 3] = 255;
      } else {
        let near = false;
        const r = scale >= 3 ? 2 : 1;
        for (let dy = -r; dy <= r && !near; dy++) for (let dx = -r; dx <= r; dx++) {
          const yy = y + dy, x2 = xx + dx;
          if (yy >= 0 && yy < h && x2 >= 0 && x2 < w && solid[yy * w + x2]) { near = true; break; }
        }
        if (near) { d[p] = oc[0]; d[p + 1] = oc[1]; d[p + 2] = oc[2]; d[p + 3] = 255; } else d[p + 3] = 0;
      }
    }
    x.putImageData(img, 0, 0);
    const out = canvas(w + 2, h + 2), ox = out.getContext('2d');
    if (shadow) {
      const s = canvas(w, h), sx = s.getContext('2d');
      sx.drawImage(c, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = shadow; sx.fillRect(0, 0, w, h);
      ox.drawImage(s, 2, 2);
    }
    ox.drawImage(c, 0, 0);
    bigCache.set(key, out);
    return out;
  }
  return { draw, width, wrap, big, render };
})();
