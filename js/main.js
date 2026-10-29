'use strict';
// Boot: wire up the keyboard, taps and the touch panel, scale the screen, and run a fixed 60 Hz loop.

(function () {
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (touch) document.body.classList.add('touch');
  const pad = document.getElementById('pad');
  function fit() {
    const land = innerWidth > innerHeight;
    document.body.classList.toggle('land', touch && land);
    // Portrait: the pad sits under the screen. Landscape: its halves stand in the margins either
    // side, so the screen leaves room for the wider of them.
    const below = touch ? (land ? 0 : pad.offsetHeight + document.getElementById('turn').offsetHeight + 8) : 0;
    const fits = () => {
      const side = touch && land ? Math.max(...[...pad.children].map(g => g.offsetWidth)) + 16 : 0;
      return Math.min((innerWidth - side * 2) / W, (innerHeight - below) / H);
    };
    // Sideways, the buttons stand either side of the game; where that would shrink it (small
    // phones), they stack in slim columns instead.
    document.body.classList.remove('slim');
    let s = fits();
    if (touch && land && s < .95 * innerHeight / H) { document.body.classList.add('slim'); s = fits(); }
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
  // Sound may only start on a finished tap or click, so those count as well as a finger going down.
  for (const ev of ['pointerup', 'touchend', 'click']) addEventListener(ev, () => Sound.init(), { capture: true, passive: true });
  addEventListener('blur', () => { Input.held.clear(); Input.vheld.clear(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && Game.scene === Play && !Play.demo && !['over', 'clear'].includes(Play.phase)) Options.show(); });
  cv.addEventListener('pointerdown', e => {
    Sound.init();
    const r = cv.getBoundingClientRect();
    Input.taps.push({ x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H });
    Input.any = true;
  });
  const muteBtn = document.querySelector('#pad [data-act=mute]');
  let shownMute = null, shownRead = null;
  function padState() {
    if (Sound.muted !== shownMute) { shownMute = Sound.muted; muteBtn.textContent = shownMute ? 'MUTED' : 'SOUND'; }
    // The READ button is there while a grade that reads its questions aloud is being played.
    const read = Game.scene === Play && !Play.demo && READ_ALOUD.includes(Play.grade);
    if (read !== shownRead) { shownRead = read; document.body.classList.toggle('read', read); fit(); }
  }
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
    if (touch) padState();
    requestAnimationFrame(frame);
  }
  // The PixelLab atlas is an embedded image: wait for it, then build every sprite.
  Atlas.load().then(() => { buildArt(Game.parent); Game.start(); requestAnimationFrame(frame); });
  window.__game = { Game, Play, Attract, Select, Entry, Questions, Quiz, Input };
})();
