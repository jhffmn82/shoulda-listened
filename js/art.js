'use strict';
// Every sprite is drawn here, in code, at the arcade's native resolution. The hero and the gunman
// are posed skeletons stamped one body part at a time; each part gets its own dark outline, the
// way hand-pixelled arcade sprites separate an arm from a chest. The car, props and items are
// built from shapes and small pixel maps.

const OUT = '#140a18';

// Turn an antialiased drawing into hard pixels: drop faint edges, snap colors to a palette, outline.
function crisp(c, outline, palette) {
  const w = c.width, h = c.height, x = ctxOf(c);
  const img = x.getImageData(0, 0, w, h), d = img.data;
  const pal = palette && palette.map(hexRgb);
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    if (d[p + 3] < 120) { d[p + 3] = 0; continue; }
    solid[i] = 1; d[p + 3] = 255;
    if (pal) {
      let best = pal[0], bd = 1e9;
      for (const q of pal) {
        const e = (d[p] - q[0]) ** 2 + (d[p + 1] - q[1]) ** 2 + (d[p + 2] - q[2]) ** 2;
        if (e < bd) { bd = e; best = q; }
      }
      d[p] = best[0]; d[p + 1] = best[1]; d[p + 2] = best[2];
    }
  }
  if (outline) {
    const o = hexRgb(outline);
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
      const i = y * w + xx;
      if (solid[i]) continue;
      if ((xx > 0 && solid[i - 1]) || (xx < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) {
        const p = i * 4; d[p] = o[0]; d[p + 1] = o[1]; d[p + 2] = o[2]; d[p + 3] = 255;
      }
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}

// Draw onto a fresh layer the size of `dest`, crisp it, and stamp it on.
const layers = {};
function stamp(dest, draw, outline = OUT, palette) {
  const key = dest.width + 'x' + dest.height;
  const l = layers[key] || (layers[key] = canvas(dest.width, dest.height));
  const x = ctxOf(l);
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = 'source-over';
  x.clearRect(0, 0, l.width, l.height);
  x.imageSmoothingEnabled = false;
  draw(x);
  x.setTransform(1, 0, 0, 1, 0, 0);
  crisp(l, outline, palette);
  dest.getContext('2d').drawImage(l, 0, 0);
}

// A pixel map: rows of characters, '.' is clear, every other character is looked up in `colors`.
function pixmap(rows, colors, outline = OUT) {
  const pad = outline ? 1 : 0;
  const c = canvas(rows[0].length + pad * 2, rows.length + pad * 2), x = c.getContext('2d');
  rows.forEach((r, y) => {
    for (let i = 0; i < r.length; i++) {
      if (r[i] === '.' || r[i] === ' ') continue;
      x.fillStyle = colors[r[i]] || '#f0f';
      x.fillRect(i + pad, y + pad, 1, 1);
    }
  });
  return outline ? crisp(c, outline) : c;
}

function flipX(src) {
  const c = canvas(src.width, src.height), x = c.getContext('2d');
  x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
  return c;
}

// Cut a canvas down to its painted pixels; returns the new canvas and the offset it was cut at.
function trim(src) {
  const w = src.width, h = src.height, d = ctxOf(src).getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) return { c: canvas(1, 1), x: 0, y: 0, h: 1 };
  const c = canvas(x1 - x0 + 1, y1 - y0 + 1);
  c.getContext('2d').drawImage(src, -x0, -y0);
  return { c, x: x0, y: y0, h: y1 - y0 + 1 };
}

const fillPoly = (x, pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fill(); };
const seg = (x, a, b, w, col) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
const disc = (x, p, r, col) => { x.fillStyle = col; x.beginPath(); x.arc(p[0], p[1], r, 0, Math.PI * 2); x.fill(); };
const box = (x, X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
const down = a => [Math.sin(a * DEG), Math.cos(a * DEG)];   // limb angle: 0 hangs straight down, + swings forward
const up = a => [Math.sin(a * DEG), -Math.cos(a * DEG)];    // torso angle: 0 is upright, + leans forward
const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];

// ---- People -------------------------------------------------------------------------------

// Heads face right. The figure code adds the outline.
const HEADS = {
  hero: [
    '...hhhhhh....',
    '.hhhhhhhHHh..',
    'hhhhhhhhhHHhh',
    'hhhhhhhhhhhh.',
    'hhhhhhhhssss.',
    'hhhhhhsssses.',
    'hhhhhSsssssss',
    'hhhhSSssssss.',
    '.hhhSSsssss..',
    '.hhhssssssm..',
    '..hhsssssss..',
    '...hssssss...',
    '.....sSSs....',
  ],
  gunman: [
    '...kkkkkk....',
    '.kkkkkkkkkk..',
    'kKkKkKkKkKkk.',
    'kkkkkkkkkkkk.',
    'hhhhhhhssss..',
    'hhhhhsssses..',
    'hhhhSssssssss',
    'hhhSSsssssss.',
    '.hhSSsssuuuu.',
    '.hhsssssuuu..',
    '..hssssssss..',
    '...sssssss...',
    '.....sSSs....',
  ],
  teacher: [
    '...gggggg....',
    '.gggggggggg..',
    'ggggggggggg..',
    'gggggggssss..',
    'ggggggwwwww..',
    'gggggwkwwkw..',
    'ggggSwwwwwsss',
    'gggSSssssss..',
    '.ggSSsssss...',
    '.gggssssssm..',
    '..ggsssssss..',
    '...gssssss...',
    '.....sSSs....',
  ],
};
// Variants change a few pixels of a head: [row, col, char].
const FACES = {
  scared: [[4, 9, 'w'], [4, 10, 'w'], [5, 9, 'w'], [5, 10, 'e'], [9, 10, 'e'], [10, 10, 'm'], [9, 9, 'm']],
  hurt: [[5, 10, 'e'], [5, 9, 'e'], [4, 10, 'e'], [9, 10, 'e'], [9, 9, 'm'], [10, 9, 'm']],
  dead: [[4, 9, 'e'], [4, 11, 'e'], [5, 10, 'e'], [6, 9, 'e'], [6, 11, 's'], [9, 10, 'm']],
  happy: [[5, 10, 'e'], [9, 9, 'm'], [9, 10, 'w'], [10, 9, 'm'], [9, 8, 'm']],
};
function headMap(name, face, colors) {
  const rows = HEADS[name].map(r => r.split(''));
  for (const [r, c, ch] of FACES[face] || []) if (rows[r] && rows[r][c] !== undefined) rows[r][c] = ch;
  return pixmap(rows.map(r => r.join('')), colors, null);
}

const PEOPLE = {
  hero: {
    head: 'hero', thigh: 15, shin: 14, foot: 4, footLen: 7, legW: 7, torso: 20, armW: 6, upper: 11, fore: 10, hand: 2.4,
    shoulders: 6, waist: 6,
    c: {
      skin: '#f0b080', skinSh: '#c47a50', hair: '#6a3c1c', hairHi: '#a0642c', eye: '#20121a', mouth: '#8a2a2a', white: '#f4f4f4',
      leg: '#3c60b0', legB: '#2c4888', shoe: '#f4f4f4', sole: '#b4b4bc', stripe: '#d02828',
      jacket: '#8c4a24', jacketHi: '#b4683a', jacketSh: '#5c2c14', arm: '#8c4a24', armB: '#62321a', shirt: '#ececec',
    },
  },
  gunman: {
    head: 'gunman', torso: 18, armW: 6, upper: 11, fore: 10, hand: 2.4, shoulders: 7, waist: 7,
    c: {
      skin: '#c88858', skinSh: '#98603a', hair: '#1c1418', hairHi: '#1c1418', eye: '#140a10', mouth: '#5a2020', white: '#f0f0f0',
      beanie: '#1a1a20', beanieHi: '#3a3a46', stache: '#2a1810',
      jacket: '#56643a', jacketHi: '#76844e', jacketSh: '#3a4426', arm: '#56643a', armB: '#3a4426', shirt: '#2a2a2a',
    },
  },
};

function headColors(c) {
  return { h: c.hair, H: c.hairHi, s: c.skin, S: c.skinSh, e: c.eye, m: c.mouth, w: c.white, k: c.beanie, K: c.beanieHi, u: c.stache, g: '#a8a8b0' };
}

// Pose one figure. Angles are in degrees (see up/down above). Returns { c, ax, ay } where (ax, ay)
// is the point that goes on the ground (or, with `waistUp`, the waist), plus `mx, my` for a muzzle.
const RX = 90, RY = 120;
function figure(who, pose) {
  const S = PEOPLE[who], C = S.c;
  const frame = canvas(180, 160);
  const hold = pose.gun ? GUNS[pose.gun] : null;
  let hip = [0, 0];
  const legs = {};
  if (!pose.waistUp) {
    let low = 0;
    for (const k of ['F', 'B']) {
      const [ta, sa] = pose['leg' + k];
      const knee = add([0, 0], down(ta), S.thigh), ankle = add(knee, down(sa), S.shin);
      legs[k] = { ta, sa, knee, ankle };
      low = Math.max(low, ankle[1]);
    }
    hip = [0, -(low + S.foot - 1) + (pose.bob || 0)];
    for (const k in legs) { legs[k].knee = add(legs[k].knee, hip, 1); legs[k].ankle = add(legs[k].ankle, hip, 1); }
  }
  const t = pose.torso || 0;
  const shoulder = add(hip, up(t), S.torso - 3), neck = add(hip, up(t), S.torso);
  const xf = x => { x.translate(RX, RY); x.rotate((pose.rot || 0) * DEG); };

  const arm = (k, back) => stamp(frame, x => {
    xf(x);
    const [ua, fa] = pose['arm' + k];
    const s = add(shoulder, [back ? -1 : 1, 0], 1);
    const elbow = add(s, down(ua), S.upper), wrist = add(elbow, down(fa), S.fore);
    const col = back ? C.armB : C.arm;
    seg(x, s, elbow, S.armW, col);
    seg(x, elbow, wrist, S.armW - 1, col);
    disc(x, add(wrist, down(fa), 1.5), S.hand, C.skin);
    if (hold && !back) {
      x.save();
      const g = add(wrist, down(fa), 1);
      x.translate(Math.round(g[0]), Math.round(g[1]));
      x.rotate((90 - fa) * DEG);
      x.drawImage(hold.c, -hold.gx, -hold.gy);
      x.restore();
    }
  }, OUT, back ? [C.armB, C.skin] : hold ? null : [C.arm, C.skin]);

  const leg = (k, back) => stamp(frame, x => {
    xf(x);
    const L = legs[k];
    const col = back ? C.legB : C.leg;
    seg(x, hip, L.knee, S.legW, col);
    seg(x, L.knee, L.ankle, S.legW - 1, col);
    x.save();
    x.translate(L.ankle[0], L.ankle[1]);
    x.rotate((Math.max(0, -L.sa) * 0.6 - Math.max(0, L.sa) * 0.25) * DEG);
    box(x, -3, -1, S.footLen + 3, S.foot - 1, back ? '#d0d0d8' : C.shoe);
    box(x, -3, S.foot - 2, S.footLen + 3, 1, C.sole);
    box(x, -1, 0, 3, 1, C.stripe);
    x.restore();
  }, OUT, [col(back), back ? '#d0d0d8' : C.shoe, C.sole, C.stripe]);
  const col = back => back ? C.legB : C.leg;

  const torso = () => stamp(frame, x => {
    xf(x);
    x.translate(hip[0], hip[1]); x.rotate(t * DEG);
    const L = S.torso, sw = S.shoulders, ww = S.waist;
    fillPoly(x, [[-ww, 3], [ww, 3], [sw, -L + 4], [sw - 2, -L + 1], [-sw + 2, -L + 1], [-sw, -L + 4]], C.jacket);
    fillPoly(x, [[-ww, 3], [-ww + 3, 3], [-sw + 3, -L + 3], [-sw, -L + 4]], C.jacketSh);
    box(x, -1, -L + 4, 2, L - 4, C.jacketHi);
    fillPoly(x, [[ww - 3, -3], [ww, -3], [sw, -L + 4], [sw - 4, -L + 2]], C.shirt);
  }, OUT, [C.jacket, C.jacketHi, C.jacketSh, C.shirt]);

  const head = () => stamp(frame, x => {
    xf(x);
    const hm = headMap(S.head, pose.face, headColors(C));
    x.translate(Math.round(neck[0]), Math.round(neck[1]) + 1);
    x.rotate((t + (pose.tilt || 0)) * DEG);
    x.drawImage(hm, -6, -hm.height);
  }, OUT);

  if (!pose.waistUp) { arm('B', true); leg('B', true); }
  torso();
  if (!pose.waistUp) leg('F', false);
  head();
  arm('F', false);

  if (pose.waistUp) frame.getContext('2d').clearRect(0, RY + 1, frame.width, frame.height);
  const tr = trim(frame);
  const out = { c: tr.c, ax: RX - tr.x, ay: pose.waistUp ? RY - tr.y : tr.h - 1 };
  if (hold) {
    // Where the muzzle ended up, in the trimmed sprite.
    const [ua, fa] = pose.armF;
    const s = add(shoulder, [1, 0], 1), elbow = add(s, down(ua), S.upper), wrist = add(elbow, down(fa), S.fore);
    const m = add(add(wrist, down(fa), 1), down(fa), hold.len);
    const r = (pose.rot || 0) * DEG;
    out.mx = RX + m[0] * Math.cos(r) - m[1] * Math.sin(r) - tr.x;
    out.my = RY + m[0] * Math.sin(r) + m[1] * Math.cos(r) - tr.y;
  }
  return out;
}
function mirror(f) {
  const o = { c: flipX(f.c), ax: f.c.width - 1 - f.ax, ay: f.ay };
  if (f.mx !== undefined) { o.mx = f.c.width - 1 - f.mx; o.my = f.my; }
  return o;
}

// Guns point right along +x from the grip (gx, gy); `len` is grip-to-muzzle.
const GUNS = {
  pistol: {
    c: pixmap([
      'GGGGGGGGG',
      'ggggggggg',
      'gg.g.....',
      'gg.......',
      'gg.......',
    ], { G: '#7a7a86', g: '#2c2c34' }, null), gx: 1, gy: 1, len: 9,
  },
  water: {
    c: pixmap([
      '...oooo.....',
      '..oOoooo....',
      'GGGGGGGGGGGg',
      'ggggggggggg.',
      'gg.g........',
      'gg..........',
      'gg..........',
    ], { G: '#50f070', g: '#20a040', o: '#f08020', O: '#ffc070' }, null), gx: 1, gy: 3, len: 12,
  },
};

function walkPose(i, n) {
  const p = i / n * Math.PI * 2, s = Math.sin(p), c = Math.cos(p);
  const s2 = Math.sin(p + Math.PI), c2 = Math.cos(p + Math.PI);
  const ta = 26 * s, tb = 26 * s2;
  return {
    legF: [ta, ta - 38 * Math.max(0, c) - 6], legB: [tb, tb - 38 * Math.max(0, c2) - 6],
    armF: [-24 * s, -24 * s + 28], armB: [24 * s, 24 * s + 28], torso: 5,
  };
}

const Sprites = {};
function buildPeople(parent) {
  const H = {};
  H.walk = []; for (let i = 0; i < 8; i++) H.walk.push(figure('hero', walkPose(i, 8)));
  H.idle = [
    figure('hero', { legF: [4, 2], legB: [-4, -2], armF: [6, 18], armB: [-4, 12], torso: 1 }),
    figure('hero', { legF: [4, 2], legB: [-4, -2], armF: [7, 20], armB: [-3, 14], torso: 2, bob: 1 }),
  ];
  H.kick = [
    figure('hero', { legF: [55, -10], legB: [-6, -8], armF: [-30, 10], armB: [30, 70], torso: -6 }),
    figure('hero', { legF: [88, 86], legB: [-14, -14], armF: [-50, -20], armB: [45, 85], torso: -16 }),
  ];
  H.hands = [
    figure('hero', { legF: [7, 3], legB: [-7, -3], armF: [118, 172], armB: [104, 166], torso: -6, face: 'scared' }),
    figure('hero', { legF: [5, 6], legB: [-5, -6], armF: [122, 176], armB: [108, 170], torso: -5, face: 'scared', bob: 1 }),
  ];
  const hit = figure('hero', { legF: [28, 12], legB: [-6, -24], armF: [-130, -165], armB: [-105, -150], torso: -28, tilt: -15, face: 'hurt' });
  const fall = figure('hero', { rot: -55, legF: [22, 14], legB: [2, -12], armF: [150, 175], armB: [120, 150], torso: -12, face: 'hurt' });
  const dead = figure('hero', { rot: -90, legF: [10, 8], legB: [-4, 6], armF: [172, 178], armB: [140, 160], torso: 0, face: 'dead' });
  H.shot = [hit, hit, hit, fall, fall, fall, dead];
  H.cheer = [
    figure('hero', { legF: [5, 2], legB: [-5, -2], armF: [172, 182], armB: [25, 95], torso: -2, face: 'happy' }),
    figure('hero', { legF: [5, 2], legB: [-5, -2], armF: [160, 200], armB: [25, 95], torso: -2, face: 'happy', bob: 1 }),
  ];
  Sprites.hero = H;

  const gun = parent ? 'water' : 'pistol';
  const aim = mirror(figure('gunman', { waistUp: true, torso: 28, armF: [92, 94], gun, tilt: -26 }));
  Sprites.gunman = {
    aim: [aim],
    fire: [mirror(figure('gunman', { waistUp: true, torso: 24, armF: [104, 112], gun, tilt: -30 })), aim],
    nod: [mirror(figure('gunman', { waistUp: true, torso: 18, armF: [38, 62], gun, tilt: -4 }))],
    sit: [mirror(figure('gunman', { waistUp: true, torso: 0, armF: [20, 40], tilt: 0 }))],
    mx: aim.mx, my: aim.my,
  };
}

// ---- Cars ---------------------------------------------------------------------------------

const CAR_COLORS = {
  black: ['#26262e', '#4a4a5a', '#141418'], maroon: ['#5e1a24', '#8a3440', '#3a0e16'],
  green: ['#1e3c2e', '#36604c', '#10241a'], gray: ['#5c5c64', '#868690', '#3a3a40'],
  white: ['#c4c4c0', '#e8e8e4', '#86868a'], blue: ['#2a4a8a', '#4a6cb0', '#18305c'],
  taxi: ['#e8b41c', '#f8d860', '#a07c10'],
};
const CAR_W = 176, CAR_H = 60;
const WHEELS = [[36, 47], [138, 47]];
function makeCar(colorName) {
  const [main, hi, dark] = CAR_COLORS[colorName];
  const taxi = colorName === 'taxi';
  const glass = '#26344c', glassHi = '#4c6890';
  function body(open) {
    const c = canvas(CAR_W, CAR_H);
    stamp(c, x => {
      fillPoly(x, [[2, 31], [4, 27], [10, 26], [54, 25], [70, 10], [74, 8], [124, 8], [130, 10], [146, 24], [168, 25], [173, 27], [174, 31], [174, 44], [168, 47], [8, 47], [2, 44]], main);
      if (taxi) box(x, 92, 3, 16, 6, '#f4e8b0');
    });
    const x = c.getContext('2d');
    x.globalCompositeOperation = 'source-atop';
    for (const [wx, wy] of WHEELS) disc(x, [wx, wy], 13, '#0a0a0e');
    box(x, 10, 26, 44, 1, hi); box(x, 146, 25, 22, 1, hi); box(x, 74, 9, 50, 1, hi);
    box(x, 6, 29, 166, 1, hi);
    box(x, 4, 41, 168, 4, dark);
    if (taxi) {
      for (let i = 4; i < 172; i += 2) box(x, i, 36 + (i / 2 % 2), 2, 1, (i / 2) % 2 ? '#111' : '#eee'), box(x, i, 37 - (i / 2 % 2), 2, 1, (i / 2) % 2 ? '#eee' : '#111');
      box(x, 94, 4, 12, 3, '#d02020');
    } else {
      box(x, 4, 34, 168, 1, '#b8b8c4'); box(x, 4, 35, 168, 1, dark);
    }
    for (const sx of [54, 100, 146]) box(x, sx, 25, 1, 17, dark);
    box(x, 84, 30, 5, 1, '#c8c8d0'); box(x, 130, 30, 5, 1, '#c8c8d0');
    box(x, 1, 28, 6, 4, '#f4ecc0'); box(x, 1, 32, 5, 2, '#e8a030');
    box(x, 171, 27, 4, 6, '#d82020'); box(x, 171, 27, 4, 1, '#ff7070');
    box(x, 0, 37, 9, 6, '#4a4a54'); box(x, 0, 37, 9, 1, '#7a7a86');
    box(x, 167, 37, 9, 6, '#4a4a54'); box(x, 167, 37, 9, 1, '#7a7a86');
    box(x, 56, 21, 4, 3, dark);
    // Windows: the front one can be rolled down to show the dark inside.
    fillPoly(x, [[58, 25], [72, 12], [98, 12], [98, 25]], open ? '#060608' : glass);
    fillPoly(x, [[102, 25], [102, 12], [123, 12], [141, 25]], glass);
    if (!open) fillPoly(x, [[66, 25], [79, 12], [83, 12], [70, 25]], glassHi);
    fillPoly(x, [[110, 25], [114, 12], [117, 12], [113, 25]], glassHi);
    x.globalCompositeOperation = 'source-over';
    return crispKeep(c);
  }
  return { shut: body(false), open: body(true), color: colorName, taxi };
}
// Snap stray half-pixels from the slanted windows without adding another outline.
function crispKeep(c) { return crisp(c, null); }

const Wheels = [];
function buildWheels() {
  for (let f = 0; f < 4; f++) {
    const c = canvas(24, 24);
    stamp(c, x => {
      disc(x, [12, 12], 11, '#16161a');
      disc(x, [12, 12], 9, '#24242a');
      disc(x, [12, 12], 6, '#a8a8b4');
      x.translate(12, 12); x.rotate(f * 22.5 * DEG);
      for (let k = 0; k < 4; k++) { x.rotate(90 * DEG); box(x, -1, 2, 2, 4, '#5a5a66'); }
      x.setTransform(1, 0, 0, 1, 0, 0);
      disc(x, [12, 12], 2, '#e0e0e8');
    }, null, ['#16161a', '#24242a', '#a8a8b4', '#5a5a66', '#e0e0e8']);
    Wheels.push(c);
  }
}

// ---- Items, props and effects -----------------------------------------------------------

function buildItems() {
  Sprites.calc = pixmap([
    'kkkkkkkk',
    'kssssssk',
    'ksSSsSsk',
    'kssssssk',
    'kkkkkkkk',
    'kbkbkbyk',
    'kkkkkkkk',
    'kbkbkbbk',
    'kkkkkkkk',
    'kbkbkbbk',
    'kkkkkkkk',
    'kbkbkbbk',
    'kkkkkkkk',
  ], { k: '#30303c', s: '#a8c098', S: '#3a4a30', b: '#b8b8c4', y: '#e0c040' });
  Sprites.coffee = pixmap([
    '.wwwwww.',
    'wwwwwwww',
    '.bbbbbb.',
    '.bybyby.',
    '.bbbbbb.',
    '.bwwwwb.',
    '..bbbb..',
    '..bbbb..',
  ], { w: '#f0f0f0', b: '#2a5ad0', y: '#e8c040' });
  {
    const rows = [];
    for (let y = 0; y < 12; y++) {
      let r = '';
      for (let x = 0; x < 10; x++) {
        if (x === 0) r += 'r';
        else if (x >= 8 && y >= 4 && y <= 7) r += 'k';
        else r += 'pty'[Math.floor((x + y) / 3) % 3];
      }
      rows.push(r);
    }
    Sprites.keeper = pixmap(rows, { r: '#c0c0c8', k: '#1a1a20', p: '#ff40b0', t: '#20d0c0', y: '#f8e040' });
  }
  Sprites.cash = pixmap([
    'dddddddddddd',
    'dggggggggggd',
    'dgglllllgggd',
    'dglldlldlggd',
    'dgglllllgggd',
    'dggggggggggd',
    'dddddddddddd',
  ], { d: '#2c6a2c', g: '#5ca858', l: '#9ad890' });
  Sprites.house = pixmap([
    '....r....',
    '...rrr...',
    '..rrrrr..',
    '.rrrrrrr.',
    'rrrrrrrrr',
    '.wwwwwww.',
    '.wydwyyw.',
    '.wwdwwww.',
  ], { r: '#d03030', w: '#e8dcc8', y: '#f8d860', d: '#5a3420' });
  Sprites.can = canvas(16, 20);
  stamp(Sprites.can, x => {
    box(x, 2, 4, 12, 15, '#7c808a');
    for (let i = 3; i < 14; i += 3) box(x, i, 5, 1, 13, '#9ca0aa');
    box(x, 2, 8, 12, 1, '#5c606a'); box(x, 2, 14, 12, 1, '#5c606a');
    box(x, 1, 2, 14, 3, '#a4a8b2'); box(x, 6, 0, 4, 2, '#a4a8b2');
  }, OUT, ['#7c808a', '#9ca0aa', '#5c606a', '#a4a8b2']);
  Sprites.canDown = canvas(22, 14);
  stamp(Sprites.canDown, x => {
    box(x, 2, 1, 15, 12, '#7c808a');
    for (let i = 2; i < 12; i += 3) box(x, 3, i, 13, 1, '#9ca0aa');
    box(x, 7, 1, 1, 12, '#5c606a'); box(x, 12, 1, 1, 12, '#5c606a');
    box(x, 16, 2, 3, 10, '#1a1a1e');
  }, OUT, ['#7c808a', '#9ca0aa', '#5c606a', '#1a1a1e']);
  Sprites.lid = canvas(16, 6);
  stamp(Sprites.lid, x => { box(x, 1, 2, 14, 3, '#a4a8b2'); box(x, 6, 0, 4, 2, '#a4a8b2'); }, OUT);
  Sprites.rat = [
    pixmap(['.....rrr..', '...rrrrrre', 't.rrrrrrrr', '.tt.r...r.'], { r: '#6a5a52', e: '#e04040', t: '#d09090' }),
    pixmap(['.....rrr..', '...rrrrrre', '.trrrrrrrr', 't...r.r...'], { r: '#6a5a52', e: '#e04040', t: '#d09090' }),
  ];
  Sprites.flash = canvas(15, 15);
  stamp(Sprites.flash, x => {
    fillPoly(x, [[0, 7], [6, 5], [7, 0], [9, 5], [14, 7], [9, 9], [7, 14], [6, 9]], '#f8d020');
    disc(x, [7, 7], 3, '#fff8d0');
  }, null, ['#f8d020', '#fff8d0']);
  Sprites.hydrant = canvas(12, 18);
  stamp(Sprites.hydrant, x => {
    box(x, 3, 3, 6, 14, '#b82020'); box(x, 2, 15, 8, 2, '#b82020'); box(x, 1, 6, 10, 4, '#b82020');
    box(x, 4, 1, 4, 3, '#b82020'); box(x, 4, 4, 1, 12, '#e05050'); box(x, 0, 7, 2, 2, '#e8c040'); box(x, 10, 7, 2, 2, '#e8c040');
  }, OUT, ['#b82020', '#e05050', '#e8c040']);
  Sprites.meter = canvas(8, 34);
  stamp(Sprites.meter, x => {
    box(x, 3, 10, 2, 24, '#4a4a54'); box(x, 1, 1, 6, 9, '#5a6a5a'); box(x, 2, 2, 4, 4, '#c8d8c8'); box(x, 2, 7, 4, 1, '#e8c040');
  }, OUT);
  Sprites.newsbox = canvas(14, 22);
  stamp(Sprites.newsbox, x => {
    box(x, 1, 2, 12, 14, '#2850b0'); box(x, 2, 4, 10, 6, '#c8c8c0'); box(x, 3, 5, 8, 1, '#404040'); box(x, 3, 7, 6, 1, '#808080');
    box(x, 2, 16, 2, 6, '#303038'); box(x, 10, 16, 2, 6, '#303038'); box(x, 1, 1, 12, 1, '#4870d0');
  }, OUT);
  Sprites.payphone = canvas(16, 50);
  stamp(Sprites.payphone, x => {
    box(x, 7, 26, 2, 24, '#5a5a64'); box(x, 1, 4, 14, 22, '#a0a4b0'); box(x, 1, 0, 14, 4, '#2858c8');
    box(x, 3, 7, 4, 10, '#202024'); box(x, 9, 7, 4, 6, '#c8ccd4'); box(x, 9, 15, 4, 2, '#202024');
    box(x, 12, 18, 1, 6, '#202024');
  }, OUT);
  Sprites.mailbox = canvas(14, 24);
  stamp(Sprites.mailbox, x => {
    box(x, 1, 5, 12, 12, '#2a4aa0'); disc(x, [7, 6], 6, '#2a4aa0'); box(x, 2, 17, 2, 7, '#1c2e60'); box(x, 10, 17, 2, 7, '#1c2e60');
    box(x, 3, 8, 8, 1, '#c8c8d0'); box(x, 1, 13, 12, 1, '#3a5ac0');
  }, OUT, ['#2a4aa0', '#1c2e60', '#c8c8d0', '#3a5ac0']);
  Sprites.lamp = canvas(30, 118);
  stamp(Sprites.lamp, x => {
    box(x, 5, 10, 3, 108, '#2c3a36'); box(x, 3, 110, 7, 8, '#2c3a36'); box(x, 4, 60, 5, 3, '#3c4a46');
    x.strokeStyle = '#2c3a36'; x.lineWidth = 3; x.beginPath(); x.moveTo(6.5, 12); x.quadraticCurveTo(7, 3, 18, 4); x.stroke();
    fillPoly(x, [[14, 4], [26, 4], [24, 9], [16, 9]], '#3c4a46');
    box(x, 17, 9, 6, 2, '#fff0b0');
  }, OUT, ['#2c3a36', '#3c4a46', '#fff0b0']);
  Sprites.manhole = pixmap(['..kkkkkkkk..', '.kmmkmmkmmk.', 'kmkmmkmmkmmk', '.kmmkmmkmmk.', '..kkkkkkkk..'],
    { k: '#141418', m: '#3a3a42' }, null);
  Sprites.grate = pixmap(['kkkkkkkkkkkkkk', 'k.k.k.k.k.k.kk', 'k.k.k.k.k.k.kk', 'kkkkkkkkkkkkkk'], { k: '#2a2a32' }, null);
}

// ---- The PixelLab art, once tools/pixellab.py pack has made js/data/sprites.js. Without it the code-drawn
// sprites above stand in.
const Atlas = {
  img: null,
  load() {
    return new Promise(done => {
      if (typeof SPRITE_ATLAS === 'undefined' || !SPRITE_ATLAS) return done(false);
      const i = new Image();
      i.onload = () => { this.img = i; done(true); };
      i.onerror = () => done(false);
      i.src = SPRITE_ATLAS.png;
    });
  },
  has(key) { return !!(this.img && SPRITE_ATLAS.frames[key]); },
  meta(key) { return SPRITE_ATLAS.frames[key]; },
  keys(prefix) { return this.img ? Object.keys(SPRITE_ATLAS.frames).filter(k => k.startsWith(prefix)) : []; },
  frames(key) {
    const F = this.meta(key), out = [];
    for (let i = 0; i < F.n; i++) {
      const c = canvas(F.w, F.h);
      c.getContext('2d').drawImage(this.img, F.x + i * F.w, F.y, F.w, F.h, 0, 0, F.w, F.h);
      out.push({ c, ax: F.ax, ay: F.ay });
    }
    return out;
  },
  image(key) { return this.frames(key)[0].c; },
};

function buildFromAtlas(parent) {
  const A = Atlas;
  Sprites.hero = { walk: A.frames('hero.walk'), idle: A.frames('hero.idle'), hands: A.frames('hero.hands'), kick: A.frames('hero.kick'), shot: A.frames('hero.shot'), cheer: A.frames('hero.cheer') };
  const g = parent ? 'water' : 'gunman', aim = A.frames(g + '.aim'), m = A.meta(g + '.aim');
  Sprites.gunman = { aim, sit: aim, fire: A.frames(g + '.fire'), nod: A.frames(g + '.nod'), mx: m.mx, my: m.my };
  for (const k of ['can', 'hydrant', 'meter', 'newsbox', 'payphone', 'mailbox', 'lamp', 'calc', 'coffee', 'keeper', 'cash']) if (A.has('prop.' + k)) Sprites[k] = A.image('prop.' + k);
  if (A.has('prop.can-down')) Sprites.canDown = A.image('prop.can-down');
  if (A.has('prop.tree')) { Sprites.tree = A.image('prop.tree'); Sprites.treeM = flipX(Sprites.tree); }
  if (A.has('prop.rat')) Sprites.rat = [A.image('prop.rat'), A.image('prop.rat')];
}

function buildArt(parent) {
  if (!Wheels.length) { buildWheels(); buildItems(); }
  buildPeople(parent);
  if (Atlas.img) buildFromAtlas(parent);
  // Where the body lies after the fall, from the anchor: the puddle goes under it.
  const H = Sprites.hero, last = H.shot[H.shot.length - 1], t = trim(last.c);
  H.deadCx = Math.round(t.x + t.c.width / 2 - last.ax);
}

// A car's art: the PixelLab sedan or taxi when there is one, else the code-drawn car.
// ay is the bottom of the tires; the gunman's waist goes at mount and only shows above the window sill.
const carCache = {};
function carArt(color) {
  if (carCache[color]) return carCache[color];
  let art;
  const key = color === 'taxi' ? 'car.taxi' : 'car.sedan';
  if (Atlas.has(key)) {
    const m = Atlas.meta(key), img = Atlas.image(key), sedan = Atlas.meta('car.sedan');
    art = { shut: img, open: null, w: m.w, h: m.h, ay: m.ay, mount: sedan.mount, sill: sedan.sill, wheels: false };
  } else {
    const c = makeCar(color);
    art = { shut: c.shut, open: c.open, w: CAR_W, h: CAR_H, ay: 58, mount: [82, 26], sill: 25, wheels: true };
  }
  return (carCache[color] = art);
}
