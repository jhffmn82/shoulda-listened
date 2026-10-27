'use strict';
// The street: a night sky, a far skyline with a bridge, rooftops with water towers, then the
// block itself (tenements with storefronts, brownstone stoops, fenced lots, alleys) ending at
// home. Buildings are painted once into canvases; neon, TVs and the barber pole animate on top.

const World = (() => {
  const box = (x, X, Y, w, h, c) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };

  // ---- The far layers, built once.
  let sky, skyline, roofs, ground, glow = {};
  function buildFar() {
    const r = seeded(77);
    sky = canvas(W, WALK_TOP);
    {
      const x = sky.getContext('2d');
      const bands = ['#07071c', '#0b0a26', '#110d32', '#1a1040', '#26144c', '#3a1a58', '#552260', '#702a5e'];
      const bh = WALK_TOP / bands.length;
      bands.forEach((c, i) => {
        box(x, 0, Math.floor(i * bh), W, Math.ceil(bh) + 1, c);
        // A checkerboard dither between bands, like a 16-bit sky.
        if (i) { x.fillStyle = bands[i - 1]; for (let y = 0; y < 2; y++) for (let k = (y % 2); k < W; k += 2) x.fillRect(k, Math.floor(i * bh) + y, 1, 1); }
      });
      for (let i = 0; i < 70; i++) { x.fillStyle = r() < .2 ? '#fff8e0' : '#8888b8'; x.fillRect(Math.floor(r() * W), Math.floor(r() * 70), 1, 1); }
      // The moon.
      x.fillStyle = '#f4ecc8'; x.beginPath(); x.arc(318, 30, 11, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#d8ccA0'; for (const [a, b, s] of [[313, 26, 3], [321, 33, 2], [316, 35, 2], [323, 25, 1]]) x.fillRect(a, b, s, s);
      crisp(sky, null);
    }
    skyline = canvas(1024, 112);
    {
      const x = skyline.getContext('2d'), h = skyline.height;
      // Water at the horizon, under the bridge.
      box(x, 0, h - 16, 1024, 16, '#0c1230');
      for (let i = 0; i < 160; i++) box(x, Math.floor(r() * 1024), h - 15 + Math.floor(r() * 14), 2 + Math.floor(r() * 4), 1, r() < .5 ? '#2c3870' : '#504a70');
      let px = 0;
      while (px < 1024) {
        const bw = 14 + Math.floor(r() * 30), bh = 20 + Math.floor(r() * 70);
        if (px > 300 && px < 640) { px += bw; continue; }   // leave the bridge's span open
        const col = r() < .5 ? '#11173a' : '#0e1432';
        box(x, px, h - 16 - bh, bw, bh, col);
        if (r() < .15) { box(x, px + bw / 2 - 1, h - 16 - bh - 8, 2, 8, col); }
        for (let wy = h - 16 - bh + 3; wy < h - 18; wy += 3) for (let wx = px + 2; wx < px + bw - 2; wx += 3) if (r() < .22) box(x, wx, wy, 1, 1, r() < .7 ? '#e8d08c' : '#9cb8f0');
        px += bw + Math.floor(r() * 3);
      }
      // A stepped art-deco tower with a mast.
      const tx = 180;
      box(x, tx, h - 16 - 74, 26, 74, '#10163a'); box(x, tx + 4, h - 16 - 86, 18, 12, '#10163a'); box(x, tx + 8, h - 16 - 96, 10, 10, '#10163a');
      box(x, tx + 11, h - 16 - 108, 4, 12, '#10163a'); box(x, tx + 12, h - 16 - 112, 2, 4, '#10163a');
      for (let wy = h - 90; wy < h - 18; wy += 3) for (let wx = tx + 2; wx < tx + 24; wx += 3) if (r() < .3) box(x, wx, wy, 1, 1, '#f0d898');
      // The suspension bridge.
      const by = h - 22, t1 = 360, t2 = 560;
      box(x, 300, by, 340, 3, '#1a1e44');
      for (const t of [t1, t2]) { box(x, t - 4, by - 56, 9, 56, '#161a40'); box(x, t - 2, by - 46, 5, 14, '#2a2e60'); box(x, t - 2, by - 26, 5, 12, '#2a2e60'); }
      const cable = (a, b, sag) => {
        for (let k = 0; k <= 200; k++) {
          const u = k / 200, cx = a[0] + (b[0] - a[0]) * u, cy = a[1] + (b[1] - a[1]) * u + sag * 4 * u * (1 - u);
          box(x, Math.round(cx), Math.round(cy), 1, 1, '#2c3268');
          if (k % 12 === 0) { box(x, Math.round(cx), Math.round(cy), 1, by - Math.round(cy), '#20244e'); box(x, Math.round(cx), Math.round(cy) - 1, 1, 1, '#f8e8a8'); }
        }
      };
      cable([t1, by - 54], [t2, by - 54], 44); cable([300, by], [t1, by - 54], -10); cable([t2, by - 54], [640, by], -10);
    }
    roofs = canvas(720, 120);
    {
      const x = roofs.getContext('2d'), h = roofs.height;
      let px = 0;
      while (px < 720) {
        const bw = 40 + Math.floor(r() * 50), bh = 40 + Math.floor(r() * 60), col = '#1c1838';
        box(x, px, h - bh, bw, bh, col);
        box(x, px, h - bh, bw, 2, '#2a2448');
        for (let wy = h - bh + 6; wy < h - 4; wy += 7) for (let wx = px + 4; wx < px + bw - 4; wx += 6) if (r() < .16) box(x, wx, wy, 2, 3, r() < .6 ? '#c8a050' : '#5a6aa0');
        if (r() < .55) {
          // A rooftop water tower: legs, a barrel and a cone hat.
          const wx = px + 6 + Math.floor(r() * (bw - 24)), base = h - bh;
          for (const lx of [wx + 1, wx + 5, wx + 10, wx + 14]) box(x, lx, base - 10, 1, 10, '#141028');
          box(x, wx, base - 26, 16, 16, '#151130');
          for (let k = 0; k < 16; k += 4) box(x, wx + k, base - 26, 1, 16, '#221c40');
          x.fillStyle = '#151130'; x.beginPath(); x.moveTo(wx - 1, base - 26); x.lineTo(wx + 8, base - 33); x.lineTo(wx + 17, base - 26); x.fill();
        } else if (r() < .5) {
          box(x, px + bw / 2, h - bh - 14, 1, 14, '#141028'); box(x, px + bw / 2 - 4, h - bh - 10, 9, 1, '#141028');
        }
        px += bw;
      }
      crisp(roofs, null);
    }
    ground = canvas(64, H - WALK_TOP);
    {
      const x = ground.getContext('2d'), sw = CURB - WALK_TOP, rd = ROAD - WALK_TOP;
      box(x, 0, 0, 64, sw, '#56545f');
      box(x, 0, 0, 64, 2, '#24222c'); box(x, 0, 2, 64, 1, '#3a3842');
      for (const sx of [0, 32]) { box(x, sx, 3, 1, sw - 3, '#3e3c46'); box(x, sx + 1, 3, 1, sw - 3, '#67656f'); }
      box(x, 0, 17, 64, 1, '#46444e'); box(x, 0, 18, 64, 1, '#64626c');
      for (let i = 0; i < 60; i++) box(x, Math.floor(r() * 64), 3 + Math.floor(r() * (sw - 4)), 1, 1, r() < .5 ? '#4a4852' : '#62606a');
      box(x, 0, sw, 64, 2, '#8c8a96'); box(x, 0, sw + 2, 64, rd - sw - 2, '#3e3c46');
      box(x, 0, rd, 64, H - ROAD, '#242229'); box(x, 0, rd, 64, 2, '#16141a');
      for (let i = 0; i < 90; i++) box(x, Math.floor(r() * 64), rd + 2 + Math.floor(r() * (H - ROAD - 2)), 1, 1, r() < .5 ? '#2e2c34' : '#1a181e');
    }
  }
  function glowSprite(r, color, a) {
    const key = r + color + a;
    if (glow[key]) return glow[key];
    const c = canvas(r * 2, r * 2), x = c.getContext('2d'), g = x.createRadialGradient(r, r, 0, r, r, r);
    const [R, G, B] = hexRgb(color);
    g.addColorStop(0, `rgba(${R},${G},${B},${a})`); g.addColorStop(1, `rgba(${R},${G},${B},0)`);
    x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2);
    return (glow[key] = c);
  }

  // ---- Buildings.
  const SHOPS = [
    { name: 'LIQUOR', sign: '#e8c040', ink: '#b81818', neon: 'BEER', nc: '#ff4060' },
    { name: 'BODEGA', sign: '#b81818', ink: '#f8f8f8', neon: 'LOTTO', nc: '#40ff80' },
    { name: 'PIZZA', awning: ['#c02020', '#f0f0f0'], ink: '#fff4d0', neon: 'OPEN', nc: '#ff4060' },
    { name: 'VIDEO', sign: '#1e3cb8', ink: '#f8e040', neon: 'RENTALS', nc: '#40c8ff' },
    { name: 'ARCADE', sign: '#18101e', ink: '#ff48c8', neon: 'PLAY', nc: '#48ffff' },
    { name: 'LAUNDRY', sign: '#3c9cc8', ink: '#ffffff', neon: 'OPEN 24', nc: '#ff4060' },
    { name: 'PAWN', sign: '#e0a020', ink: '#141018', neon: 'GOLD', nc: '#ffd040' },
    { name: 'CHECKS CASHED', sign: '#f0f0f0', ink: '#1e3cb8', neon: 'ATM', nc: '#40ff80', wide: true },
    { name: 'DELI', awning: ['#1e7a3a', '#f0f0f0'], ink: '#ffffff', neon: 'COFFEE', nc: '#ffd040' },
    { name: 'BARBER', sign: '#f0f0f0', ink: '#b81818', pole: true },
    { name: 'MATH TUTOR', sign: '#f0ecd8', ink: '#202020', closed: true, note: 'CLOSED' },
    { name: 'CHINESE FOOD', sign: '#b81818', ink: '#f8d840', neon: 'OPEN', nc: '#ff4060', wide: true },
  ];
  const TAGS = ['PEMDAS', 'SOH CAH TOA', 'Y=MX+B', 'MATH SUX', 'X=5', 'SHOW UR WORK', 'π', '2+2=5', 'NO CALCS', 'A^2+B^2'];
  const TAG_COLORS = [['#ff4cc0', '#2a0a30'], ['#4cf0ff', '#0a2030'], ['#f8e040', '#302000'], ['#70ff60', '#0a2a08'], ['#ff7030', '#300a00']];
  const BRICKS = ['#7a3226', '#6a3a2a', '#86563c', '#5a4a48', '#7c4a30'];
  const BILLBOARDS = [['SAT PREP', "IT'S NOT TOO LATE"], ['STAY IN SCHOOL', 'KIDS!'], ['1-800-TUTORS', 'WE COME TO YOU'], ['PI DAY SALE', '3.14% OFF']];

  function bricks(x, X, Y, w, h, base, r) {
    box(x, X, Y, w, h, shade(base, .55));
    for (let row = 0; row * 4 < h; row++) {
      const off = row % 2 ? 4 : 0;
      for (let bx = -off; bx < w; bx += 8) {
        const x0 = Math.max(0, bx), x1 = Math.min(w, bx + 7);
        if (x1 > x0) box(x, X + x0, Y + row * 4, x1 - x0, Math.min(3, h - row * 4), shade(base, .82 + r() * .26));
      }
    }
  }
  function windowAt(x, X, Y, w, h, r, stone, anims) {
    box(x, X - 2, Y - 3, w + 4, 2, stone); box(x, X - 1, Y + h, w + 2, 2, stone);
    box(x, X, Y, w, h, '#0e0c16');
    const lit = r(), iw = w - 2, ih = h - 2;
    if (lit < .42) {
      box(x, X + 1, Y + 1, iw, ih, '#1a2236'); box(x, X + 2, Y + 2, 1, ih - 4, '#2c3a58');
    } else if (lit < .58) {
      box(x, X + 1, Y + 1, iw, ih, '#f0c060');
      for (let k = Y + 2; k < Y + h - 1; k += 2) box(x, X + 1, k, iw, 1, '#c89040');
    } else if (lit < .72) {
      box(x, X + 1, Y + 1, iw, ih, '#f4cc70'); box(x, X + 1, Y + 1, 3, ih, '#b84a30'); box(x, X + w - 4, Y + 1, 3, ih, '#b84a30');
    } else if (lit < .84) {
      box(x, X + 1, Y + 1, iw, ih, '#284070');
      anims.push({ k: 'tv', x: X + 1, y: Y + 1, w: iw, h: ih });
    } else {
      box(x, X + 1, Y + 1, iw, ih, '#f0c868'); box(x, X + 4, Y + ih - 6, 4, 7, '#3a2418'); box(x, X + 5, Y + ih - 9, 3, 3, '#3a2418');
    }
    box(x, X, Y + Math.floor(h / 2), w, 1, '#0e0c16');
  }
  function fireEscape(x, X, w, floors, top, fh) {
    const iron = '#121216', hi = '#34343e';
    for (let f = 0; f < floors; f++) {
      const py = top + 8 + f * fh + fh - 4;
      box(x, X, py, w, 2, iron); box(x, X, py, w, 1, hi);
      box(x, X, py - 6, w, 1, iron);
      for (let k = X; k <= X + w; k += 3) box(x, k, py - 6, 1, 6, iron);
      if (f < floors - 1) for (let k = 0; k < fh - 2; k++) box(x, X + w - 6 - Math.floor(k * .5), py + 2 + k, 2, 1, iron);
    }
  }
  function tag(x, X, Y, r) {
    const s = pick(TAGS), [fg, bg] = TAG_COLORS[Math.floor(r() * TAG_COLORS.length)];
    Font.draw(x, s, X, Y, fg, { bold: true, outline: bg });
  }

  function tenement(w, r, shop) {
    const floors = 2 + (r() < .4 ? 1 : 0), fh = 28, gh = 36, top = 8, h = top + floors * fh + gh;
    const c = canvas(w, h), x = c.getContext('2d'), anims = [];
    const base = BRICKS[Math.floor(r() * BRICKS.length)], stone = '#a89a86';
    bricks(x, 0, 0, w, h, base, r);
    // Cornice.
    box(x, 0, 0, w, 6, stone); box(x, 0, 6, w, 1, '#2a2020');
    for (let k = 1; k < w; k += 4) box(x, k, 3, 2, 2, '#6a5e50');
    const n = Math.max(1, Math.floor((w - 12) / 24)), gap = (w - n * 12) / (n + 1);
    for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) windowAt(x, Math.round(gap + i * (12 + gap)), top + 8 + f * fh, 12, 17, r, stone, anims);
    if (w >= 80 && r() < .5) fireEscape(x, Math.round(gap - 4), Math.round(12 * 2 + gap + 8), floors, top, fh);
    // The storefront.
    const gy = h - gh;
    box(x, 0, gy, w, 2, stone);
    if (shop.closed || r() < .2) {
      box(x, 4, gy + 12, w - 8, gh - 12, '#5a5a62');
      for (let k = gy + 13; k < h; k += 2) box(x, 4, k, w - 8, 1, '#44444c');
      if (!shop.closed) tag(x, 8, gy + 22, r);
      shop = shop.closed ? shop : Object.assign({}, shop, { neon: null, gate: true });
      if (shop.note) { box(x, w / 2 - 16, gy + 16, 32, 9, '#f0f0f0'); Font.draw(x, shop.note, w / 2, gy + 17, '#c01818', { align: 'center' }); }
    } else {
      box(x, 5, gy + 12, w - 26, gh - 15, '#101014');
      box(x, 6, gy + 13, w - 28, gh - 17, '#d8e4d0');
      for (let k = gy + 17; k < h - 4; k += 5) {
        box(x, 6, k + 3, w - 28, 1, '#8a8a80');
        for (let g = 8; g < w - 24; g += 3) if (r() < .7) box(x, g, k + 1, 2, 2, ['#c83030', '#3060c8', '#e8c040', '#40a040', '#f0f0f0'][Math.floor(r() * 5)]);
      }
      box(x, w - 19, gy + 10, 13, gh - 10, '#1a1820'); box(x, w - 17, gy + 12, 9, 12, '#d8e4d0'); box(x, w - 9, gy + 24, 2, 2, '#c8c040');
      if (shop.neon) anims.push({ k: 'neon', text: shop.neon, color: shop.nc, x: 6 + (w - 28) / 2, y: gy + 14 });
    }
    if (shop.awning) {
      const [a, b] = shop.awning;
      for (let k = 0; k < w; k += 6) box(x, k, gy + 1, 6, 10, (k / 6) % 2 ? b : a);
      for (let k = 0; k < w; k += 6) box(x, k + 1, gy + 11, 4, 1, (k / 6) % 2 ? b : a);
      Font.draw(x, shop.name, w / 2, gy + 3, shop.ink, { bold: true, align: 'center', outline: '#201010' });
    } else {
      box(x, 2, gy + 1, w - 4, 10, shop.sign); box(x, 2, gy + 10, w - 4, 1, shade(shop.sign, .6));
      Font.draw(x, shop.name, w / 2, gy + 2, shop.ink, { bold: true, align: 'center' });
    }
    if (shop.pole) anims.push({ k: 'pole', x: w - 23, y: gy + 13 });
    return { c, anims, h };
  }

  function brownstone(w, r, home) {
    const floors = 2, fh = 30, gh = 40, top = 8, h = top + floors * fh + gh;
    const c = canvas(w, h), x = c.getContext('2d'), anims = [];
    const face = home ? '#7a4a36' : pick(['#6c4434', '#64402e', '#5e3c30']), stone = '#9c7c66';
    box(x, 0, 0, w, h, face);
    for (let k = 10; k < h; k += 8) box(x, 0, k, w, 1, shade(face, .8));
    for (let i = 0; i < 40; i++) box(x, Math.floor(r() * w), Math.floor(r() * h), 1, 1, shade(face, .9 + r() * .2));
    box(x, 0, 0, w, 6, stone); box(x, 0, 6, w, 1, '#2a1a14');
    for (let k = 2; k < w; k += 6) box(x, k, 2, 3, 3, '#7a5c48');
    const n = Math.max(2, Math.floor((w - 10) / 22)), gap = (w - n * 11) / (n + 1);
    for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) {
      const X = Math.round(gap + i * (11 + gap)), Y = top + 6 + f * fh;
      if (home && f === 0 && i === 0) {
        windowAt(x, X, Y, 11, 21, () => .65, stone, []);
        anims.push({ k: 'mom', x: X + 2, y: Y + 6 });
      } else windowAt(x, X, Y, 11, 21, r, stone, anims);
      box(x, X + 4, Y - 4, 3, 2, '#c8b098');
    }
    // The stoop: a raised door, steps down to the right, iron railings.
    const gy = h - gh, dx = 8, doorY = gy + 4, stoopTop = h - 13;
    box(x, 2, stoopTop + 2, 12, 9, '#141218'); for (let k = 4; k < 14; k += 3) box(x, k, stoopTop + 2, 1, 9, '#3a3a44');
    box(x, dx + 6, doorY - 2, 18, stoopTop - doorY + 2, stone);
    box(x, dx + 8, doorY, 14, stoopTop - doorY, home ? '#1e5a30' : '#2a3a2a');
    box(x, dx + 9, doorY + 1, 12, 4, home ? '#ffe090' : '#d8b070');
    box(x, dx + 19, doorY + 14, 2, 2, '#e8c040');
    if (home) Font.draw(x, '1', dx + 15, doorY + 6, '#e8c040', { align: 'center' });
    for (let s = 0; s < 4; s++) box(x, dx + 4 + s * 6, stoopTop + s * 3, 26, 3, s % 2 ? '#8c7060' : '#9a7c6a');
    const rail = '#101014';
    for (let k = 0; k < 30; k++) box(x, dx + 4 + k, stoopTop - 8 + Math.floor(k * .45), 1, 1, rail);
    for (let k = 0; k < 30; k += 6) box(x, dx + 4 + k, stoopTop - 8 + Math.floor(k * .45), 1, 9, rail);
    anims.push({ k: 'lamp', x: dx + 5, y: doorY + 2 }, { k: 'lamp', x: dx + 25, y: doorY + 2 });
    if (home) anims.push({ k: 'home', x: dx + 15, y: gy - 12 });
    return { c, anims, h, door: dx + 15 };
  }

  function lot(w, r) {
    const h = 64, c = canvas(w, h), x = c.getContext('2d'), anims = [];
    if (r() < .6) {
      const [a, b] = BILLBOARDS[Math.floor(r() * BILLBOARDS.length)], bw = Math.min(w - 16, 88), bx = Math.round((w - bw) / 2);
      box(x, bx + 10, 30, 3, 34, '#1a1a20'); box(x, bx + bw - 13, 30, 3, 34, '#1a1a20');
      box(x, bx, 2, bw, 28, '#f0ece0'); box(x, bx, 2, bw, 2, '#c03030'); box(x, bx, 28, bw, 2, '#c03030');
      Font.draw(x, a, bx + bw / 2, 8, '#1e3cb8', { bold: true, align: 'center' });
      Font.draw(x, b, bx + bw / 2, 18, '#202020', { align: 'center' });
      anims.push({ k: 'board', x: bx, w: bw });
    }
    // Chain-link fence with posts and barbed wire.
    const fy = h - 40;
    for (let y = fy; y < h; y++) for (let k = 0; k < w; k++) if ((k + y) % 6 === 0 || (k - y + 600) % 6 === 0) box(x, k, y, 1, 1, '#6a6a76');
    for (let k = 0; k < w; k += 32) box(x, k, fy - 4, 2, 44, '#8a8a94');
    box(x, 0, fy, w, 1, '#8a8a94');
    for (let k = 0; k < w; k++) box(x, k, fy - 3 + ((k >> 1) % 2), 1, 1, '#9a9aa4');
    for (let i = 0; i < w / 6; i++) box(x, Math.floor(r() * w), h - 1 - Math.floor(r() * 4), 1, 2 + Math.floor(r() * 3), '#2a4a28');
    return { c, anims, h };
  }

  function alley(w) {
    const h = 110, c = canvas(w, h), x = c.getContext('2d');
    for (let k = 0; k < h; k++) box(x, 0, k, w, 1, mix('#07060c', '#141220', k / h));
    box(x, 2, h - 14, w - 4, 14, '#1e3a28'); box(x, 2, h - 14, w - 4, 2, '#2a5038');
    return { c, anims: [], h };
  }

  // ---- The PixelLab layers: sky, rooftops, the next block back, and the storefronts at the hero's scale.
  let pix = null;
  function buildPix() {
    if (pix !== null) return pix;
    if (!Atlas.has('near.home') || !Atlas.has('bg.sky')) return (pix = false);
    pix = { sky: Atlas.image('bg.sky'), roofs: Atlas.has('bg.roofs') && Atlas.image('bg.roofs'), walk: Atlas.image('bg.sidewalk'),
      mid: Atlas.keys('mid.').map(k => Atlas.image(k)), near: Atlas.keys('near.').map(k => ({ k, c: Atlas.image(k) })) };
    pix.skyM = flipX(pix.sky);
    const d = ctxOf(pix.walk).getImageData(0, pix.walk.height - 1, 1, 1).data;
    pix.street = rgbHex(d[0], d[1], d[2]);
    const t = ctxOf(pix.sky).getImageData(0, 0, 1, 1).data;
    pix.top = rgbHex(t[0], t[1], t[2]);
    return pix;
  }

  // ---- A whole street for one loop of the stage.
  function makeStreet(loop) {
    const r = seeded(1000 + loop * 77);
    const length = 3300 + Math.min(4, loop - 1) * 350;
    const S = { length, buildings: [], props: [], lamps: [], manholes: [], cans: [], encounters: [] };
    let x = -40, lastShop = -1, lastKind = '';
    if (buildPix()) {
      const near = pix.near.filter(b => b.k !== 'near.home'), home = pix.near.find(b => b.k === 'near.home');
      let last = '', prev = '';
      while (x < length - 150) {
        let b; do b = near[Math.floor(r() * near.length)]; while ((b.k === last || b.k === prev) && near.length > 2);
        prev = last; last = b.k;
        S.buildings.push({ x, c: b.c, h: b.c.height, anims: [], kind: b.k });
        x += b.c.width;
      }
      S.buildings.push({ x, c: home.c, h: home.c.height, anims: [], kind: 'home' });
      S.homeX = x + Math.round(home.c.width / 2);
      S.length = x + home.c.width;
      S.mid = [];
      for (let mx = -60; mx < S.length * .6 + W + 100;) { const c = pix.mid[Math.floor(r() * pix.mid.length)]; S.mid.push({ x: mx, c }); mx += c.width - 1; }
      x = S.length;
    }
    while (!S.mid && x < length - 150) {
      let kind = r() < .5 ? 'tenement' : r() < .55 ? 'brownstone' : r() < .7 ? 'lot' : 'alley';
      if (kind === lastKind && kind !== 'tenement') kind = 'tenement';
      if (x < 200 && kind === 'alley') kind = 'tenement';
      let b;
      if (kind === 'tenement') {
        let si; do si = Math.floor(r() * SHOPS.length); while (si === lastShop);
        lastShop = si;
        const shop = SHOPS[si], w = shop.wide ? 112 + 8 * Math.floor(r() * 3) : 80 + 8 * Math.floor(r() * 5);
        b = tenement(w, r, shop);
      } else if (kind === 'brownstone') b = brownstone(72 + 8 * Math.floor(r() * 3), r);
      else if (kind === 'lot') b = lot(96 + 16 * Math.floor(r() * 3), r);
      else b = alley(16 + 8 * Math.floor(r() * 2));
      b.x = x; b.kind = kind;
      S.buildings.push(b);
      x += b.c.width;
      lastKind = kind;
    }
    if (!S.mid) {
      const home = brownstone(96, r, true);
      home.x = x; home.kind = 'home';
      S.buildings.push(home);
      S.homeX = x + home.door;
      S.length = x + home.c.width;
    }
    // Encounters, evenly spaced with some jitter.
    const n = Math.min(8, 4 + loop);
    for (let i = 0; i < n; i++) S.encounters.push(Math.round(380 + (S.homeX - 640) * i / (n - 1 || 1) + (r() - .5) * 90));
    // Lamps, then small props and trash cans in the gaps.
    for (let lx = 90 + r() * 60; lx < S.length - 60; lx += 170 + r() * 70) S.lamps.push(Math.round(lx));
    const PROPS = ['hydrant', 'meter', 'newsbox', 'payphone', 'mailbox', 'meter', 'hydrant'];
    for (let px = 140; px < S.length - 120; px += 70 + r() * 90) {
      if (S.lamps.some(l => Math.abs(l - px) < 26)) continue;
      if (r() < .45) S.cans.push(Math.round(px));
      else S.props.push({ k: PROPS[Math.floor(r() * PROPS.length)], x: Math.round(px) });
    }
    if (loop === 1 && S.cans.length) S.cans[0] = Math.max(S.cans[0], 240);
    for (let mx = 300 + r() * 200; mx < S.length; mx += 450 + r() * 300) S.manholes.push(Math.round(mx));
    return S;
  }

  // ---- Drawing.
  const PROP_BASE = WALK_TOP + 11;
  function tile(ctx, img, ox, y) {
    const w = img.width;
    for (let x = ((Math.round(ox) % w) + w) % w - w; x < W; x += w) ctx.drawImage(img, x, y);
  }
  function drawBack(ctx, S, cam, t) {
    if (!sky) buildFar();
    if (S.mid) return drawPix(ctx, S, cam, t);
    ctx.drawImage(sky, 0, 0);
    for (let i = 0; i < 6; i++) { const s = (i * 97 + Math.floor(t * 3)) % 70; ctx.fillStyle = '#fff'; if ((Math.floor(t * 4) + i) % 5 === 0) ctx.fillRect((i * 131) % W, s % 60, 1, 1); }
    tile(ctx, skyline, -cam * .1 - 140, WALK_TOP - skyline.height);
    // Blinking light on the tower's mast.
    if (Math.floor(t * 1.5) % 2) { ctx.fillStyle = '#ff3030'; const mx = ((Math.round(-cam * .1 - 140 + 192) % 1024) + 1024) % 1024; ctx.fillRect(mx, WALK_TOP - skyline.height, 2, 1); }
    tile(ctx, roofs, -cam * .35, WALK_TOP - roofs.height + 6);
    for (const b of S.buildings) {
      const bx = Math.round(b.x - cam);
      if (bx > W || bx + b.c.width < 0) continue;
      const by = WALK_TOP - b.h;
      ctx.drawImage(b.c, bx, by);
      for (const a of b.anims) drawAnim(ctx, a, bx, by, t);
    }
  }
  function drawPix(ctx, S, cam, t) {
    const P = pix, sw = P.sky.width, ox = ((Math.round(-cam * .06) % (sw * 2)) + sw * 2) % (sw * 2) - sw * 2, sy = WALK_TOP - 6 - P.sky.height;
    ctx.fillStyle = P.top; ctx.fillRect(0, 0, W, WALK_TOP);
    for (let x = ox; x < W; x += sw * 2) { ctx.drawImage(P.sky, x, sy); ctx.drawImage(P.skyM, x + sw, sy); }
    if (P.roofs) tile(ctx, P.roofs, -cam * .3, WALK_TOP - 34 - P.roofs.height);
    for (const m of S.mid) {
      const x = Math.round(m.x - cam * .6);
      if (x > W || x + m.c.width < 0) continue;
      ctx.drawImage(m.c, x, WALK_TOP + 2 - m.c.height);
    }
    // Haze over everything behind the storefronts, so the next block reads as farther away.
    ctx.fillStyle = 'rgba(16, 12, 48, .35)'; ctx.fillRect(0, 0, W, WALK_TOP);
    for (const b of S.buildings) {
      const bx = Math.round(b.x - cam);
      if (bx > W || bx + b.c.width < 0) continue;
      ctx.drawImage(b.c, bx, WALK_TOP - b.h);
      if (b.kind === 'home') drawAnim(ctx, { k: 'home', x: b.c.width / 2, y: 4 }, bx, WALK_TOP - b.h, t);
    }
  }
  function drawAnim(ctx, a, bx, by, t) {
    const x = bx + a.x, y = by + a.y;
    if (a.k === 'neon') {
      const off = Math.sin(t * 13 + a.x) > .96;
      if (!off) {
        ctx.globalCompositeOperation = 'lighter';
        const g = glowSprite(18, a.color, .35);
        ctx.drawImage(g, x - 18, y - 12);
        ctx.globalCompositeOperation = 'source-over';
        Font.draw(ctx, a.text, x, y, a.color, { bold: true, align: 'center', outline: shade(a.color, .35) });
      } else Font.draw(ctx, a.text, x, y, shade(a.color, .3), { bold: true, align: 'center' });
    } else if (a.k === 'tv') {
      const f = Math.floor(t * 8 + a.x) % 4;
      ctx.fillStyle = ['#3858a8', '#5878d0', '#2a4890', '#7898e8'][f];
      ctx.fillRect(x, y, a.w, a.h);
    } else if (a.k === 'pole') {
      ctx.fillStyle = '#f0f0f0'; ctx.fillRect(x, y, 4, 16);
      ctx.fillStyle = '#d02020';
      for (let k = -4; k < 16; k += 4) { const yy = y + k + Math.floor(t * 10) % 4; for (let q = 0; q < 4; q++) if (yy + q >= y && yy + q < y + 16) ctx.fillRect(x + q, yy + q, 1, 2); }
      ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x - 1, y - 2, 6, 2); ctx.fillRect(x - 1, y + 16, 6, 2);
    } else if (a.k === 'lamp') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(glowSprite(10, '#ffd890', .5), x - 10, y - 8);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ffe8a0'; ctx.fillRect(x - 1, y, 3, 4);
    } else if (a.k === 'mom') {
      const wave = Math.floor(t * 4) % 2;
      ctx.fillStyle = '#4a2c20'; ctx.fillRect(x, y, 6, 12); ctx.fillRect(x + 1, y - 4, 4, 4);
      ctx.fillRect(x + (wave ? 6 : 5), y - 3 + wave, 2, 5);
    } else if (a.k === 'home') {
      const bob = Math.floor(t * 3) % 2;
      Font.draw(ctx, 'HOME', x, y - 10 - bob, '#f8e040', { bold: true, align: 'center', outline: '#301800' });
      ctx.fillStyle = '#f8e040'; ctx.fillRect(x - 1, y - 1 - bob, 3, 4); ctx.fillRect(x - 3, y + 3 - bob, 7, 1); ctx.fillRect(x - 2, y + 4 - bob, 5, 1); ctx.fillRect(x - 1, y + 5 - bob, 3, 1);
    } else if (a.k === 'board') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(glowSprite(16, '#fff0c0', .25), x + 4, y - 6);
      ctx.drawImage(glowSprite(16, '#fff0c0', .25), x + a.w - 36, y - 6);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  function drawGround(ctx, S, cam, t) {
    if (S.mid) {
      // The asphalt from the code tile under the PixelLab sidewalk, which ends at the curb.
      tile(ctx, ground, -cam, WALK_TOP);
      tile(ctx, pix.walk, -cam, WALK_TOP);
    } else tile(ctx, ground, -cam, WALK_TOP);
    for (const m of S.manholes) { const mx = Math.round(m - cam); if (mx > -20 && mx < W) ctx.drawImage(Sprites.manhole, mx, ROAD + 16); }
    for (const p of S.props) {
      const px = Math.round(p.x - cam), img = Sprites[p.k];
      if (px < -20 || px > W + 20) continue;
      ctx.drawImage(img, px - (img.width >> 1), PROP_BASE - img.height);
    }
    for (const l of S.lamps) {
      const lx = Math.round(l - cam);
      if (lx < -60 || lx > W + 60) continue;
      ctx.drawImage(Sprites.lamp, lx - (Atlas.img ? Sprites.lamp.width >> 1 : 6), PROP_BASE - Sprites.lamp.height);
    }
  }
  // Light from the streetlamps, added after the actors so it lands on them too.
  function drawLight(ctx, S, cam) {
    ctx.globalCompositeOperation = 'lighter';
    for (const l of S.lamps) {
      const lx = Math.round(l - cam);
      if (lx < -80 || lx > W + 80) continue;
      const head = glowSprite(14, '#fff0b0', .55), pool = glowSprite(46, '#ffd890', .16), hx = Atlas.img ? lx : lx + 14;
      ctx.drawImage(head, hx - 14, PROP_BASE - Sprites.lamp.height + (Atlas.img ? 16 : 10) - 14);
      ctx.save(); ctx.translate(hx, FLOOR - 4); ctx.scale(1, .35); ctx.drawImage(pool, -46, -46); ctx.restore();
      ctx.save(); ctx.translate(hx, FLOOR - 50); ctx.scale(.6, 1.3); ctx.drawImage(glowSprite(46, '#ffe0a0', .07), -46, -46); ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  return { makeStreet, drawBack, drawGround, drawLight, glowSprite, PROP_BASE, buildFar };
})();
