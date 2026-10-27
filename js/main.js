'use strict';
// Boot: wire up the keyboard, taps and the touch panel, scale the screen, and run a fixed 60 Hz loop.

(function () {
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (touch) document.body.classList.add('touch');
  function fit() {
    const land = innerWidth > innerHeight;
    document.body.classList.toggle('land', touch && land);
    const below = touch ? (land ? 0 : 96) : 24;
    let s = Math.min(innerWidth / W, (innerHeight - below) / H);
    if (s >= 2) s = Math.floor(s);                     // whole-number scaling keeps every pixel square
    const scr = document.getElementById('screen'), crt = document.getElementById('crt');
    scr.style.width = Math.floor(W * s) + 'px'; scr.style.height = Math.floor(H * s) + 'px';
    crt.style.setProperty('--line', s + 'px'); crt.style.setProperty('--half', s / 2 + 'px');
    crt.classList.toggle('off', s < 2);
  }
  addEventListener('resize', fit); fit();

  const STOP = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Backspace']);
  addEventListener('keydown', e => {
    Sound.init();
    if (!e.repeat) { Input.hit.add(e.code); if (e.key.length === 1) Input.typed.push(e.key); Input.any = true; }
    Input.held.add(e.code);
    if (STOP.has(e.code)) e.preventDefault();
  });
  addEventListener('keyup', e => Input.held.delete(e.code));
  addEventListener('blur', () => { Input.held.clear(); Input.vheld.clear(); });
  cv.addEventListener('pointerdown', e => {
    Sound.init();
    const r = cv.getBoundingClientRect();
    Input.taps.push({ x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H });
    Input.any = true;
  });
  for (const b of document.querySelectorAll('#pad button')) {
    const act = b.dataset.act;
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); Sound.init();
      Input.vheld.add(act); Input.vhit.add(act); Input.any = true;
      if (act === 'coin' || act === 'start') Input.hit.add(act === 'coin' ? 'Digit5' : 'Enter');
      b.classList.add('on'); b.setPointerCapture(e.pointerId);
    });
    const up = () => { Input.vheld.delete(act); b.classList.remove('on'); };
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, up);
  }

  const STEP = 1 / 60;
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(.1, (now - last) / 1000); last = now;
    let n = 0;
    while (acc >= STEP) {
      Game.update(STEP);
      acc -= STEP;
      if (n++ === 0) Input.endFrame();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    Game.draw(ctx);
    requestAnimationFrame(frame);
  }
  // The PixelLab atlas is an embedded image: wait for it, then build every sprite.
  Atlas.load().then(() => { buildArt(Game.parent); Game.start(); requestAnimationFrame(frame); });
  window.__game = { Game, Play, Attract, Entry, Questions, Input };
})();
