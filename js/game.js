'use strict';
// The game: boot screen, attract mode, the walk home, the stick-up quiz, getting shot, continuing,
// stage clear, game over and the high-score table. Scenes are plain objects with enter/update/draw.

const SCORES_DEFAULT = [['SOH', 50000, 780], ['CAH', 40000, 740], ['TOA', 35000, 700], ['PEM', 30000, 660], ['DAS', 25000, 620],
  ['MTH', 20000, 580], ['SAT', 15000, 540], ['NRD', 10000, 500], ['PI.', 7500, 460], ['X=5', 5000, 420]]
  .map(([name, score, sat]) => ({ name, score, sat }));
const LINES = {
  stickup: ['YO. POP QUIZ.', 'HEY KID. QUICK QUESTION.', 'SOLVE THIS... OR ELSE.', 'NO CALCULATORS.', 'PENCILS DOWN. HANDS UP.',
    'SHOW YOUR WORK, PUNK.', 'GOT A MINUTE? GOOD.', "LET'S SEE THAT GPA."],
  pass: ['...RESPECT.', 'CORRECT. CARRY ON.', "YOUR TEACHER'D BE PROUD.", 'NOT BAD, EINSTEIN.', 'STAY IN SCHOOL, KID.', 'A-PLUS. BEAT IT.'],
  kill: ['SHOULDA STUDIED.', 'WRONG.', 'NO PARTIAL CREDIT.', 'SEE ME AFTER CLASS.', 'CLASS DISMISSED.'],
  late: ['PENCILS DOWN.', "TIME'S UP.", 'TOO SLOW.'],
  blocked: ['...WHAT.', 'IS THAT A TRAPPER KEEPER?', 'KEVLAR?! MAN...'],
};
const FORGOT = ['YOUR BACKPACK', 'YOUR CALCULATOR', 'YOUR LUNCH MONEY', 'YOUR RETAINER', 'YOUR PERMISSION SLIP', 'YOUR HOMEWORK'];
const SAT_JOKES = [[750, 'MIT CALLED. THEY WANT YOU.'], [650, 'STATE SCHOOL MATERIAL.'], [550, 'YOUR MOM IS... PROUD-ISH.'],
  [450, 'MAYBE GET A TUTOR.'], [350, 'YOUR MATH TEACHER IS DISAPPOINTED.'], [0, 'DID YOU WRITE YOUR NAME?']];
const BANDS = {
  red: ['#ff9a6a', '#ff4a30', '#e81c18', '#c00c0c', '#8a0808'],
  gold: ['#fffbe0', '#fff080', '#ffd030', '#f0a010', '#c06808'],
  blue: ['#e8f4ff', '#a0d0ff', '#5898ff', '#2860e8', '#1434a8'],
  green: ['#effff0', '#a0ff90', '#48e848', '#20a828', '#107018'],
};
const SUBTITLE = 'shoulda listened to your math teacher';
const pad = (n, k) => String(Math.max(0, Math.floor(n))).padStart(k, '0');
const blink = (rate = 2) => Math.floor(Game.t * rate * 2) % 2 === 0;
const rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
function bigText(ctx, s, scale, bands, cx, y) { const c = Font.big(s, scale, bands); ctx.drawImage(c, Math.round(cx - c.width / 2), Math.round(y)); return c; }
function drawSpr(ctx, f, x, y, flip) {
  const c = flip ? (f.fl || (f.fl = flipX(f.c))) : f.c;
  ctx.drawImage(c, Math.round(x - (flip ? f.c.width - 1 - f.ax : f.ax)), Math.round(y - f.ay));
}
// The blue arcade panel from the concept art.
function panel(ctx, x, y, w, h, fill = '#0a0e30', edge = '#3c6cf8') {
  rect(ctx, x, y, w, h, '#000');
  rect(ctx, x + 1, y + 1, w - 2, h - 2, edge);
  rect(ctx, x + 3, y + 3, w - 6, h - 6, '#1c2c80');
  rect(ctx, x + 4, y + 4, w - 8, h - 8, fill);
}
const puffs = {};
function puff(r, color) {
  const key = r + color;
  if (puffs[key]) return puffs[key];
  const c = canvas(r * 2 + 1, r * 2 + 1), x = c.getContext('2d');
  x.fillStyle = color;
  for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); x.fillRect(r - w, r + y, w * 2 + 1, 1); }
  return (puffs[key] = c);
}
const carCache = {};
function carArt(color) { return carCache[color] || (carCache[color] = makeCar(color)); }

function satEstimate(log) {
  if (!log.length) return 200;
  const n = log.length, ok = log.filter(l => l.ok).length, avg = log.reduce((s, l) => s + l.level, 0) / n;
  const raw = (ok / n) * (.55 + .15 * avg) + Math.min(.15, ok * .01);
  return clamp(Math.round((200 + 600 * Math.min(1, raw)) / 10) * 10, 200, 800);
}

const Game = {
  t: 0, credits: 0, parent: Store.get('parent', false), scores: Store.get('scores', null) || SCORES_DEFAULT,
  scene: null, shake: 0, flash: 0,
  go(scene, arg) { this.scene = scene; scene.enter(arg); },
  start() { this.go(location.hash === '#skip' ? Attract : Boot); },
  update(dt) {
    this.t += dt;
    if (Input.pressed('mute')) Sound.toggleMute();
    if (Input.pressed('full')) {
      try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { /* not allowed */ }
    }
    if (Input.pressed('coin')) this.coin();
    this.scene.update(dt);
  },
  coin() { if (this.credits < 9) this.credits++; Sound.play('coin'); },
  draw(ctx) {
    ctx.save();
    this.scene.draw(ctx);
    ctx.restore();
    if (this.flash > 0) { ctx.globalAlpha = Math.min(1, this.flash); rect(ctx, 0, 0, W, H, '#fff'); ctx.globalAlpha = 1; }
  },
  setParent(on) { this.parent = on; Store.set('parent', on); buildArt(on); },
  rank(score) { return this.scores.findIndex(s => score > s.score); },
};

// ---- Boot: a fake board self-test, then the warning screen.
const Boot = {
  enter() { this.t = 0; },
  update(dt) {
    this.t += dt;
    if (this.t > 6.5 || (this.t > .3 && (Input.any || Input.taps.length))) Game.go(Attract, 'title');
  },
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#000');
    if (this.t < 2.2) {
      const lines = ['CHALKDUST-94 BOARD', '', 'WORK RAM ........ OK', 'VIDEO RAM ....... OK', 'SOUND ROM ....... OK', 'QUESTION ROM .... OK', 'MATH ............ ???'];
      lines.forEach((s, i) => { if (this.t > i * .25) Font.draw(ctx, s, 40, 40 + i * 14, i === 6 ? '#ff5050' : '#e0e0e0', { bold: true }); });
      return;
    }
    bigText(ctx, 'WARNING', 3, BANDS.red, W / 2, 26);
    const text = ['THIS GAME IS FOR USE IN THE UNITED STATES OF', 'ALGEBRA ONLY. SALES, EXPORT OR OPERATION OUTSIDE', 'THIS COUNTRY MAY BE CONSTRUED AS A WORD PROBLEM.', '',
      'ALL QUESTIONS ARE ORIGINAL. NO REAL SAT WAS', 'HARMED IN THE MAKING OF THIS GAME.'];
    text.forEach((s, i) => Font.draw(ctx, s, W / 2, 76 + i * 13, '#e8e8f8', { align: 'center' }));
    Font.draw(ctx, '© 1994 CHALKDUST AMUSEMENTS', W / 2, 190, '#8890c0', { align: 'center' });
  },
};

// ---- Attract mode: title, high scores, how to play, a demo, round and round.
const Attract = {
  enter(mode = 'title') {
    this.mode = mode; this.t = 0;
    if (!this.S) { this.S = World.makeStreet(7); this.cam = 400; }
    Sound.stopMusic();
  },
  next() {
    const order = ['title', 'scores', 'howto', 'demo'];
    const m = order[(order.indexOf(this.mode) + 1) % order.length];
    if (m === 'demo') return Game.go(Play, { demo: true });
    this.mode = m; this.t = 0;
  },
  update(dt) {
    this.t += dt;
    this.cam += dt * 24;
    if (this.cam > this.S.length - W - 10) this.cam = 200;
    const tap = Input.tap();
    if (Input.pressed('parent') || (tap && this.mode === 'title' && tap.y > 196 && tap.y < 212)) {
      Game.setParent(!Game.parent); Sound.play('select');
      return;
    }
    if (Input.pressed('start') || tap) {
      if (!Game.credits) Game.coin();
      Game.credits--;
      Sound.play('start');
      return Game.go(Play, {});
    }
    const dur = { title: 9, scores: 7, howto: 8 }[this.mode];
    if (this.t > dur) this.next();
  },
  draw(ctx) {
    World.drawBack(ctx, this.S, this.cam, Game.t);
    World.drawGround(ctx, this.S, this.cam, Game.t);
    World.drawLight(ctx, this.S, this.cam);
    ctx.globalAlpha = .55; rect(ctx, 0, 0, W, H, '#05040e'); ctx.globalAlpha = 1;
    if (this.mode === 'title') this.title(ctx);
    else if (this.mode === 'scores') this.table(ctx);
    else this.howto(ctx);
    Font.draw(ctx, 'CREDIT ' + Game.credits, W / 2, 214, '#c8c8d8', { align: 'center', outline: '#000' });
  },
  title(ctx) {
    const drop = Math.min(0, (this.t - .6) * 160);
    bigText(ctx, 'SHOULDA', 4, BANDS.red, W / 2, 8 + drop);
    bigText(ctx, 'LISTENED', 4, BANDS.red, W / 2, 46 + drop);
    bigText(ctx, 'TO YOUR MATH TEACHER', 2, BANDS.gold, W / 2, 88 + drop);
    Font.draw(ctx, 'AN EDUCATIONAL GAME*', W / 2, 114, '#a8b0e8', { align: 'center', outline: '#000' });
    if (blink(1.2)) bigText(ctx, Game.credits ? 'PUSH START' : 'INSERT COIN', 2, BANDS.gold, W / 2, 138);
    Font.draw(ctx, Game.credits ? '1 OR ENTER TO PLAY' : '5 FOR A COIN, OR JUST PRESS ENTER', W / 2, 166, '#9098c8', { align: 'center', outline: '#000' });
    Font.draw(ctx, 'P: PARENT MODE ' + (Game.parent ? 'ON (WATER GUNS)' : 'OFF'), W / 2, 200, Game.parent ? '#60e0ff' : '#c8c8d8', { align: 'center', outline: '#000' });
    Font.draw(ctx, '*NOT REALLY', 8, 214, '#6870a0', { outline: '#000' });
    Font.draw(ctx, '© 1994 CHALKDUST', W - 8, 214, '#6870a0', { align: 'right', outline: '#000' });
  },
  table(ctx) {
    bigText(ctx, 'BEST STUDENTS', 3, BANDS.gold, W / 2, 10);
    Font.draw(ctx, 'RANK   SCORE   NAME   SAT', W / 2, 46, '#ff5050', { bold: true, align: 'center', outline: '#000' });
    const cols = ['#ffffff', '#ffe060', '#60e0ff', '#80ff80', '#ff80c0'];
    Game.scores.forEach((s, i) => {
      const y = 60 + i * 14, c = i === this.hi ? (blink(4) ? '#fff' : '#ff5050') : cols[i % cols.length];
      const rank = ['1ST', '2ND', '3RD'][i] || (i + 1) + 'TH';
      Font.draw(ctx, rank, 102, y, c, { bold: true, align: 'right', outline: '#000' });
      Font.draw(ctx, pad(s.score, 7), 172, y, c, { bold: true, align: 'right', outline: '#000' });
      Font.draw(ctx, s.name, 202, y, c, { bold: true, align: 'center', outline: '#000' });
      Font.draw(ctx, String(s.sat), 250, y, c, { bold: true, align: 'center', outline: '#000' });
    });
  },
  howto(ctx) {
    panel(ctx, 20, 8, W - 40, 196);
    bigText(ctx, 'HOW TO PLAY', 2, BANDS.gold, W / 2, 16);
    const L = ['Walk home. ← → to walk, Z to kick trash cans.', 'When a car pulls up, answer the question.',
      'A B C D or 1-4 to answer. Wrong answer: YOU LOOSE.', 'Answer fast for a bonus. 3 right in a row: TEACHER\'S PET.'];
    L.forEach((s, i) => Font.draw(ctx, s, 34, 44 + i * 12, '#e8ecff'));
    const items = [['calc', 'TI-83: press X to cross out two wrong answers'], ['coffee', 'COFFEE: the next clock runs at half speed'],
      ['keeper', 'KEVLAR TRAPPER KEEPER: stops one bullet'], ['cash', 'CASH: points']];
    items.forEach(([k, s], i) => {
      const y = 104 + i * 22, img = Sprites[k];
      ctx.drawImage(img, 44 - (img.width >> 1), y + 4 - (img.height >> 1));
      Font.draw(ctx, s, 62, y, '#ffe060');
    });
  },
};

// ---- The demo player.
const Bot = {
  hold: new Set(), hit: new Set(),
  down(a) { return this.hold.has(a); },
  pressed(a) { return this.hit.has(a); },
  think(P) {
    this.hit.clear(); this.hold.clear();
    if (P.phase === 'walk') {
      this.hold.add('right');
      const h = P.hero;
      if (h.state !== 'kick' && P.cans.some(c => !c.down && c.x - h.x > 6 && c.x - h.x < 22)) this.hit.add('fire');
    } else if (P.phase === 'enc' && P.E.phase === 'quiz') {
      const E = P.E;
      E.botAt = E.botAt || 1.5 + rand() * 2.5;
      if (E.t > E.botAt) {
        const wrong = [0, 1, 2, 3].filter(k => k !== E.q.answer);
        const k = P.log.length >= 2 || rand() < .15 ? pick(wrong) : E.q.answer;
        this.hit.add('a' + k);
      }
    }
  },
};

// ---- The game proper.
const Play = {
  enter(o = {}) {
    this.demo = !!o.demo;
    this.loop = 1; this.score = 0; this.cont = 0; this.streak = 0;
    this.inv = { calc: 0, coffee: false, keeper: false };
    this.log = [];
    this.ctl = this.demo ? Bot : Input;
    this.paused = false; this.stop = 0;
    this.startLoop();
  },
  startLoop() {
    const S = this.S = World.makeStreet(this.loop);
    this.cam = 0;
    this.hero = { x: 70, state: 'idle', t: 0, face: 1, step: 0 };
    this.cans = S.cans.map((x, i) => ({ x, down: false, vx: 0, loot: this.loop === 1 && i === 0 ? 'calc' : null }));
    this.items = []; this.parts = []; this.pops = []; this.decals = []; this.cars = [];
    this.next = 0; this.time = 99; this.hurried = false; this.missed = 0; this.right = 0;
    this.E = this.D = this.O = this.Cl = null;
    this.traffic = 2.5; this.idleT = 0; this.steamT = 0;
    this.phase = 'walk';
    this.banner = { big: this.loop > 1 ? 'STAGE 1-' + this.loop : 'STAGE 1', sub: this.loop > 1 ? 'THE BLOCK, AGAIN. HARDER.' : 'THE BLOCK', sub2: 'GET HOME!', t: 0, dur: 3 };
    if (!this.demo) { Sound.music('street'); Sound.say(this.loop > 1 ? 'Stage one, round ' + this.loop : 'Stage one'); }
  },
  level() { return clamp(this.loop + (rand() < .3 ? -1 : 0), 1, 4); },
  clock(q) { return [30, 25, 22, 18, 15][Math.min(4, this.loop - 1)] + (q.fig || q.text.length > 110 ? 5 : 0); },
  pop(x, y, text, color = '#fff') { this.pops.push({ x, y, text, color, t: 0 }); },
  add(points) { this.score += points; },

  update(dt) {
    if (this.demo) {
      if (Input.any || Input.taps.length) {
        if (Input.pressed('start') || Input.taps.length) { if (!Game.credits) Game.coin(); Game.credits--; Sound.play('start'); return Game.go(Play, {}); }
        return Game.go(Attract, 'title');
      }
      Bot.think(this);
    }
    if (!this.demo && Input.pressed('pause')) { this.paused = !this.paused; if (this.paused) Sound.stopMusic(); else Sound.music(this.E && this.E.phase === 'quiz' ? 'quiz' : 'street'); }
    if (this.paused) return;
    if (this.stop > 0) { this.stop -= dt; return; }
    Game.shake = Math.max(0, Game.shake - dt * 24);
    Game.flash = Math.max(0, Game.flash - dt * 5);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
    if (this.phase === 'walk') this.walk(dt);
    else if (this.phase === 'enc') this.enc(dt);
    else if (this.phase === 'rise') this.rise(dt);
    else if (this.phase === 'death') this.death(dt);
    else if (this.phase === 'clear') this.clear(dt);
    else if (this.phase === 'over') this.over(dt);
    this.world(dt);
  },

  walk(dt) {
    const h = this.hero, c = this.ctl;
    if (h.state === 'kick') { if (h.t > .32) h.state = 'idle'; }
    else {
      const dir = (c.down('right') ? 1 : 0) - (c.down('left') ? 1 : 0);
      if (dir) {
        if (h.state !== 'walk') h.step = 0;
        h.face = dir; h.x += dir * 66 * dt; h.state = 'walk'; h.step += dt; this.idleT = 0;
        if (Math.floor(h.step * 11) % 4 === 0 && Math.floor((h.step - dt) * 11) % 4 !== 0) Sound.play('step');
      } else { if (h.state !== 'idle') h.t = 0; h.state = 'idle'; this.idleT += dt; }
      if (c.pressed('fire')) this.kick();
    }
    h.x = clamp(h.x, this.cam + 14, this.S.length - 20);
    this.cam = clamp(Math.max(this.cam, h.x - 130), 0, this.S.length - W);
    this.time = Math.max(0, this.time - dt);
    if (this.time <= 15 && !this.hurried) {
      this.hurried = true; Sound.play('hurry'); Sound.say('Hurry up');
      this.banner = { big: 'HURRY UP!', t: 0, dur: 2, bands: BANDS.red };
    }
    const S = this.S;
    if (this.next < S.encounters.length && h.x >= S.encounters[this.next]) { this.next++; this.encounter(); }
    else if (this.time <= 0) { this.time = 30; this.hurried = false; this.encounter(); }
    else if (this.next >= S.encounters.length && h.x >= S.homeX - 40) this.startClear();
    for (const it of this.items) if (it.landed && Math.abs(it.x - h.x) < 12) this.take(it);
  },

  kick() {
    const h = this.hero;
    h.state = 'kick'; h.t = 0;
    Sound.play('kick');
    for (const can of this.cans) {
      if (can.down || Math.abs(can.x - (h.x + h.face * 16)) > 15) continue;
      can.down = true; can.vx = 110 * h.face; can.flip = h.face < 0;
      Sound.play('clang'); Game.shake = 2;
      this.add(100); this.pop(can.x, WALK_TOP - 4, '100', '#ffe060');
      this.parts.push({ k: 'spr', img: Sprites.lid, x: can.x, y: World.PROP_BASE - 20, vx: 90 * h.face, vy: -160, g: 480, life: 1.4 });
      for (let i = 0; i < 6; i++) this.parts.push({ k: 'px', x: can.x, y: World.PROP_BASE - 12, vx: (rand() - .3) * 120 * h.face, vy: -60 - rand() * 90, g: 300, life: 1, c: pick(['#e8e8e0', '#c8b890', '#7aa060']), s: 2 });
      const loot = can.loot || (r => r < .45 ? 'cash' : r < .62 ? 'calc' : r < .78 ? 'coffee' : r < .9 ? 'keeper' : 'rat')(rand());
      if (loot === 'rat') { this.parts.push({ k: 'rat', x: can.x, y: World.PROP_BASE + 2, vx: 150 * h.face, life: 3 }); Sound.play('select'); this.pop(can.x, WALK_TOP + 2, 'EEK!', '#ff80c0'); }
      else this.items.push({ k: loot, x: can.x, y: World.PROP_BASE - 10, vx: 40 * h.face, vy: -170, t: 0, landed: false });
    }
  },
  take(it) {
    it.gone = true;
    const h = this.hero, I = this.inv;
    let label;
    if (it.k === 'cash') { const v = pick([500, 500, 1000, 2000]); this.add(v); label = '$' + v / 100 + '  +' + v; Sound.play('pickup'); }
    else if (it.k === 'calc') { if (I.calc < 3) { I.calc++; label = 'TI-83!'; } else { this.add(1000); label = '+1000'; } Sound.play('oneup'); }
    else if (it.k === 'coffee') { if (!I.coffee) { I.coffee = true; label = 'COFFEE!'; } else { this.add(1000); label = '+1000'; } Sound.play('oneup'); }
    else if (it.k === 'keeper') { if (!I.keeper) { I.keeper = true; label = 'KEVLAR TRAPPER KEEPER!'; } else { this.add(1000); label = '+1000'; } Sound.play('oneup'); }
    this.pop(h.x, FLOOR - 76, label, '#ffe060');
  },

  // ---- The stick-up.
  encounter() {
    const h = this.hero;
    h.state = 'idle';
    for (const car of this.cars) car.flee = true;
    const from = this.cam + W + 40, to = Math.round(h.x + 40);
    const car = { thug: true, color: pick(['black', 'black', 'maroon', 'green', 'gray']), x: from, from, to, vx: 0, dir: -1, open: 0, gun: null, roll: 0 };
    this.cars.push(car);
    const q = Questions.make(this.level()), max = this.clock(q);
    this.E = { phase: 'arrive', t: 0, car, q, sel: 0, max, time: max, elim: [], used: false, pick: null, coffee: this.inv.coffee, line: pick(LINES.stickup), lastSec: max };
    this.inv.coffee = false;
    this.E.L = this.layout(q);
    this.phase = 'enc';
    Sound.stopMusic(); Sound.play('engine', 1.3);
  },
  goto(phase) { this.E.phase = phase; this.E.t = 0; },
  enc(dt) {
    const E = this.E, car = E.car, h = this.hero;
    E.t += dt;
    if (E.phase === 'arrive') {
      const T = 1.15, u = Math.min(1, E.t / T);
      car.x = car.to + (car.from - car.to) * (1 - u) ** 2;
      car.vx = -2 * (car.from - car.to) * (1 - u) / T;
      if (!E.screech && u > .45) { E.screech = true; Sound.play('screech'); }
      if (u > .45 && u < .95) this.smoke(car.x + WHEELS[1][0], 3);
      if (u >= 1) { car.vx = 0; this.goto('window'); Sound.play('window'); }
    } else if (E.phase === 'window') {
      car.open = Math.min(1, E.t / .4);
      if (E.t > .45 && !car.gun) car.gun = 'sit';
      if (E.t > .8) { car.gun = 'aim'; Sound.play('cock'); h.state = 'hands'; this.goto('talk'); }
    } else if (E.phase === 'talk') {
      if (E.t > 1.6 || (E.t > .5 && this.ctl.pressed('fire'))) { this.goto('quiz'); if (!this.demo) Sound.music('quiz'); }
    } else if (E.phase === 'quiz') this.quiz(dt);
    else if (E.phase === 'reveal') { if (E.t > 1.1) this.resolve(); }
    else if (E.phase === 'nod') {
      if (E.t > 1.3) { car.gun = null; car.leaving = true; Sound.play('screech'); Sound.play('engine', 1); h.state = 'idle'; this.goto('leave'); }
    } else if (E.phase === 'leave') {
      if (!this.cars.includes(car)) { this.E = null; this.phase = 'walk'; if (!this.demo) Sound.music('street'); }
    } else if (E.phase === 'shot') this.shot(dt);
  },
  quiz(dt) {
    const E = this.E, c = this.ctl, L = E.L;
    E.time -= dt * (E.coffee ? .5 : 1);
    const sec = Math.ceil(E.time);
    if (sec !== E.lastSec) { E.lastSec = sec; if (sec > 0) Sound.play('tick', sec <= 5); }
    if (E.time <= 0) return this.answer(-1);
    const move = d => {
      let s = E.sel;
      for (let i = 0; i < 4; i++) { s = (s + d + 4) % 4; if (!E.elim.includes(s)) break; }
      if (s !== E.sel) { E.sel = s; Sound.play('select'); }
    };
    if (c.pressed('navL') || Input.vhit.has('left')) move(-1);
    if (c.pressed('navR') || Input.vhit.has('right')) move(1);
    if (L.cols === 2 && (c.pressed('navU') || c.pressed('navD'))) move(2);
    for (let k = 0; k < 4; k++) if (c.pressed('a' + k) && !E.elim.includes(k)) return this.answer(k);
    if (c.pressed('fire') || (!this.demo && Input.pressed('enter'))) return this.answer(E.sel);
    for (const t of Input.taps) {
      L.boxes.forEach((b, k) => { if (E.pick === null && !E.elim.includes(k) && t.x >= b.x && t.x < b.x + b.w && t.y >= L.y + b.y && t.y < L.y + b.y + b.h) this.answer(k); });
      if (E.pick !== null) return;
      if (t.x < 60 && t.y > 200) this.useCalc();
    }
    if (c.pressed('calc')) this.useCalc();
  },
  useCalc() {
    const E = this.E;
    if (!this.inv.calc || E.used) return;
    this.inv.calc--; E.used = true;
    E.elim = shuffle([0, 1, 2, 3].filter(k => k !== E.q.answer)).slice(0, 2);
    if (E.elim.includes(E.sel)) E.sel = E.q.answer === E.sel ? E.sel : [0, 1, 2, 3].find(k => !E.elim.includes(k));
    Sound.play('power');
    this.pop(this.hero.x, FLOOR - 80, 'TI-83!', '#80ff80');
  },
  answer(k) {
    const E = this.E;
    E.pick = k; E.ok = k === E.q.answer;
    this.goto('reveal');
    Sound.stopMusic();
    Sound.play(E.ok ? 'correct' : 'wrong');
    this.log.push({ level: E.q.level, ok: E.ok });
    if (E.ok) {
      this.streak++; this.right++;
      const mult = this.streak >= 10 ? 4 : this.streak >= 6 ? 3 : this.streak >= 3 ? 2 : 1;
      const pts = (1000 + 100 * Math.ceil(Math.max(0, E.time))) * mult * this.loop;
      this.add(pts);
      this.pop(this.hero.x, FLOOR - 84, '+' + pts, '#80ff80');
      if ([3, 6, 10].includes(this.streak)) { this.banner = { big: "TEACHER'S PET", sub: 'x' + mult + ' POINTS', t: 0, dur: 2.2, bands: BANDS.green }; Sound.say("Teacher's pet", .5); }
      else if (!this.demo) Sound.say(pick(['Correct', 'Correct', 'Excellent']), .5);
    } else { this.streak = 0; this.missed++; }
  },
  resolve() {
    const E = this.E, car = E.car;
    if (E.ok) { car.gun = 'nod'; E.say = pick(LINES.pass); this.goto('nod'); return; }
    car.gun = 'fire'; E.flashT = .1;
    E.blocked = this.inv.keeper;
    this.goto('shot');
    Sound.play(Game.parent ? 'squirt' : 'bang');
    this.stop = .12; Game.flash = .9; Game.shake = 7;
    const g = Sprites.gunman.fire, mx = car.x + 82 - g.ax + g.mx, my = TIRES - 32 - g.ay + g.my;
    E.muzzle = [mx, my];
    const h = this.hero, chest = [h.x + 4, FLOOR - 42];
    if (!Game.parent) this.parts.push({ k: 'px', x: mx, y: my - 2, vx: 40, vy: -120, g: 500, life: 1, c: '#e8c040', s: 2 });
    else for (let i = 0; i < 14; i++) { const u = i / 14; this.parts.push({ k: 'px', x: lerp(mx, chest[0], u), y: lerp(my, chest[1], u) + Math.sin(u * 9) * 2, vx: 0, vy: 0, g: 0, life: .25, c: '#80c8ff', s: 2 }); }
    if (E.blocked) {
      this.inv.keeper = false;
      Sound.play('ricochet');
      this.parts.push({ k: 'spr', img: Sprites.keeper, x: h.x + 10, y: FLOOR - 40, vx: -60, vy: -200, g: 500, life: 1.6 });
      this.pop(h.x, FLOOR - 84, 'BLOCKED!', '#60e0ff');
      E.say = pick(LINES.blocked);
      return;
    }
    E.say = E.pick === -1 ? pick(LINES.late) : pick(LINES.kill);
    h.state = 'hit'; h.t = 0;
    const col = Game.parent ? ['#60a8f8', '#a8d8ff', '#2a70d0'] : ['#c01018', '#e02028', '#7a0810'];
    for (let i = 0; i < 22; i++) this.parts.push({ k: 'px', x: chest[0], y: chest[1], vx: -30 - rand() * 130, vy: -110 + rand() * 120, g: 420, life: 1.2, c: pick(col), s: rand() < .3 ? 2 : 1, floor: FLOOR - 1 });
  },
  shot(dt) {
    const E = this.E, car = E.car, h = this.hero;
    if (E.flashT > 0) E.flashT -= dt;
    if (E.t > .45 && car.gun === 'fire') car.gun = E.blocked ? 'aim' : 'aim';
    if (E.blocked) {
      if (E.t > 1.5) { car.gun = null; car.leaving = true; Sound.play('screech'); this.goto('leave'); h.state = 'idle'; }
      return;
    }
    if (h.state === 'hit') { h.x -= 60 * dt; if (h.t > .22) { h.state = 'fall'; h.t = 0; } }
    else if (h.state === 'fall') { h.x -= 40 * dt; if (h.t > .22) { h.state = 'dead'; h.t = 0; Sound.play('thud'); Game.shake = 3; this.decals.push({ x: h.x - 28, r: 0, max: 24 }); } }
    if (E.t > 1.2 && car.gun) { car.gun = null; car.leaving = true; Sound.play('screech'); Sound.play('engine', 1); }
    if (E.t > 1.3) { this.phase = 'death'; this.D = { t: 0, stage: 'loose' }; }
  },

  // ---- Dying, the chalkboard, continuing.
  death(dt) {
    const D = this.D;
    D.t += dt;
    if (!D.trom && D.t > .1) { D.trom = true; if (!this.demo) Sound.play('trombone'); }
    if (!D.slam && D.t > .6) { D.slam = true; Game.shake = 6; Sound.play('thud'); if (!this.demo) Sound.say('You loose'); }
    const any = this.ctl.pressed('fire') || Input.pressed('start') || Input.taps.length;
    if (D.stage === 'loose' && (D.t > 4.2 || (D.t > 1.8 && any))) { D.stage = 'board'; D.bt = 0; return; }
    if (D.stage === 'board') {
      D.bt += dt;
      if (this.demo && D.bt > 4) return Game.go(Attract, 'title');
      if ((D.bt > .8 && any) || D.bt > 14) { D.stage = 'cont'; D.ct = 9.99; D.sec = 10; }
      return;
    }
    if (D.stage === 'cont') {
      D.ct -= dt;
      const s = Math.ceil(D.ct);
      if (s !== D.sec) { D.sec = s; if (s >= 0) Sound.play('beep'); }
      if (Input.pressed('start') || Input.taps.length || this.ctl.pressed('fire')) {
        if (!Game.credits) Game.coin();
        Game.credits--;
        this.cont++;
        Sound.play('start');
        this.D = null; this.E = null;
        this.cars = this.cars.filter(c => !c.thug);
        this.phase = 'rise'; this.hero.state = 'rise'; this.hero.t = 0;
        return;
      }
      if (D.ct <= 0) this.gameOver();
    }
  },
  rise() {
    const h = this.hero;
    if (h.t > .7) { h.state = 'idle'; this.phase = 'walk'; Sound.music('street'); }
  },
  gameOver() {
    this.phase = 'over';
    this.D = null;
    this.O = { t: 0, sat: satEstimate(this.log) };
    this.O.joke = SAT_JOKES.find(([s]) => this.O.sat >= s)[1];
    Sound.stopMusic(); Sound.play('gameover'); Sound.say('Game over');
  },
  over(dt) {
    const O = this.O;
    O.t += dt;
    if (O.t > 7 || (O.t > 2.5 && (this.ctl.pressed('fire') || Input.pressed('start') || Input.taps.length))) {
      const score = this.score + Math.min(9, this.cont);
      if (Game.rank(score) >= 0) Game.go(Entry, { score, sat: O.sat });
      else Game.go(Attract, 'scores');
    }
  },

  // ---- Home.
  startClear() {
    this.phase = 'clear';
    this.Cl = { t: 0, stage: 'walk' };
    for (const car of this.cars) car.flee = true;
    Sound.stopMusic();
  },
  clear(dt) {
    const C = this.Cl, h = this.hero;
    C.t += dt;
    if (C.stage === 'walk') {
      const d = this.S.homeX - h.x;
      if (Math.abs(d) > 2) { h.face = Math.sign(d); h.x += h.face * 60 * dt; h.state = 'walk'; h.step += dt; }
      else { h.state = 'cheer'; h.face = 1; C.stage = 'cheer'; C.t = 0; Sound.music('clear'); Sound.say('Stage clear'); }
      this.cam = clamp(Math.max(this.cam, h.x - 130), 0, this.S.length - W);
    } else if (C.stage === 'cheer') {
      if (C.t > 1.6) {
        C.stage = 'tally'; C.t = 0;
        C.rows = [['CORRECT ANSWERS', this.right, 500], ['TIME BONUS', Math.floor(this.time), 100], ['NO-MISS BONUS', this.missed ? 0 : 1, 10000]];
        C.row = 0; C.n = 0;
      }
    } else if (C.stage === 'tally') {
      const r = C.rows[C.row];
      if (r) {
        if (C.t > .03) {
          C.t = 0;
          const step = Math.max(1, Math.ceil(r[1] / 30));
          if (C.n < r[1]) { const k = Math.min(step, r[1] - C.n); C.n += k; this.add(k * r[2]); Sound.play('tally'); }
          else { C.row++; C.n = 0; C.t = -.5; }
        }
      } else if (C.t > 1.6) { C.stage = 'story'; C.t = 0; C.forgot = pick(FORGOT); }
    } else if (C.stage === 'story') {
      if (C.t > 4.5 || (C.t > 1.5 && (this.ctl.pressed('fire') || Input.pressed('start') || Input.taps.length))) { this.loop++; this.startLoop(); }
    }
  },

  // ---- Everything that moves on its own.
  smoke(x, n = 1, y = TIRES - 3) {
    for (let i = 0; i < n; i++) this.parts.push({ k: 'puff', x: x + (rand() - .5) * 10, y, vx: (rand() - .5) * 20, vy: -10 - rand() * 14, life: .9, r: 2 + rand() * 2, grow: 5, c: '#8a8a96' });
  },
  world(dt) {
    const h = this.hero;
    h.t += dt;
    // Traffic, and the stick-up car once it leaves.
    this.traffic -= dt;
    if (this.phase === 'walk' && this.traffic <= 0 && !this.cars.length) {
      this.traffic = 3 + rand() * 5;
      const right = rand() < .5;
      this.cars.push({ color: pick(['white', 'blue', 'taxi', 'gray', 'maroon', 'taxi']), x: right ? this.cam - CAR_W - 20 : this.cam + W + 20, vx: (right ? 1 : -1) * (160 + rand() * 90), dir: right ? 1 : -1, fake: !right && rand() < .3 });
      if (rand() < .3) Sound.play('honk');
    }
    for (const car of this.cars) {
      car.roll = (car.roll || 0) + Math.abs(car.vx) * dt;
      if (car.leaving) { car.vx = Math.max(-430, car.vx - 650 * dt); if (car.vx > -300) this.smoke(car.x + WHEELS[1][0]); }
      else if (car.flee) car.vx *= 1 + dt * 2;
      else if (car.fake && !car.faked && car.x - h.x < 150) { car.faked = true; car.slow = 1.1; }
      if (car.slow > 0) {
        car.slow -= dt; car.vx = lerp(car.vx, car.slow > .3 ? -30 : -260, dt * 4);
        if (car.slow <= 0) { Sound.play('honk'); this.pop(car.x + 40, TIRES - 64, 'MADE YOU LOOK!', '#ffe060'); }
      }
      if (!car.thug || car.leaving || car.flee) car.x += car.vx * dt;
    }
    this.cars = this.cars.filter(c => c.x > this.cam - CAR_W - 80 && c.x < this.cam + W + 80 || (c.thug && !c.leaving));
    for (const can of this.cans) if (can.vx) { can.x += can.vx * dt; can.vx *= Math.pow(.02, dt); if (Math.abs(can.vx) < 3) can.vx = 0; }
    for (const it of this.items) {
      it.t += dt;
      if (!it.landed) { it.vy += 520 * dt; it.x += it.vx * dt; it.y += it.vy * dt; if (it.y >= FLOOR - 4) { it.y = FLOOR - 4; if (it.vy > 120) it.vy *= -.35; else { it.landed = true; it.vy = 0; } } }
      if (it.t > 12) it.gone = true;
    }
    this.items = this.items.filter(i => !i.gone);
    for (const p of this.parts) {
      p.life -= dt;
      if (p.k === 'puff') { p.r += p.grow * dt; p.x += p.vx * dt; p.y += p.vy * dt; continue; }
      if (p.k === 'rat') { p.x += p.vx * dt; continue; }
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.floor && p.y > p.floor) { p.y = p.floor; p.vx = 0; p.vy = 0; p.g = 0; }
    }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const p of this.pops) { p.t += dt; p.y -= 18 * dt; }
    this.pops = this.pops.filter(p => p.t < 1.4);
    for (const d of this.decals) d.r = Math.min(d.max, d.r + dt * 9);
    // Steam from the manholes.
    this.steamT -= dt;
    if (this.steamT <= 0) {
      this.steamT = .18;
      for (const m of this.S.manholes) if (m > this.cam - 20 && m < this.cam + W + 20) this.parts.push({ k: 'puff', x: m + 6 + (rand() - .5) * 6, y: ROAD + 17, vx: 6 + rand() * 6, vy: -16 - rand() * 10, life: 2.2, r: 1.5, grow: 4, c: '#c8c8d8', a: .22 });
    }
  },

  // ---- Drawing.
  heroFrame() {
    const h = this.hero, S = Sprites.hero;
    switch (h.state) {
      case 'walk': return S.walk[Math.floor(h.step * 11) % 8];
      case 'kick': return S.kick[h.t < .09 ? 0 : 1];
      case 'hands': return S.hands[Math.floor(Game.t * 9) % 2];
      case 'hit': return S.hit;
      case 'fall': return S.fall;
      case 'dead': return S.dead;
      case 'cheer': return S.cheer[Math.floor(Game.t * 4) % 2];
      case 'rise': return h.t < .25 ? S.dead : h.t < .45 ? S.fall : S.hands[0];
      default: return S.idle[Math.floor(h.t * 1.5) % 2];
    }
  },
  drawCar(ctx, car, cam) {
    const art = carArt(car.color), x = Math.round(car.x - cam), y = TIRES - 58;
    const right = car.dir > 0;
    ctx.globalAlpha = .45; ctx.drawImage(puff(8, '#000'), x + 6, TIRES - 6, CAR_W - 12, 8); ctx.globalAlpha = 1;
    let body = car.open > 0 ? art.open : art.shut;
    if (right) body = body.fl || (body.fl = flipX(body));
    ctx.drawImage(body, x, y);
    if (car.open > 0 && car.open < 1) {
      ctx.save(); ctx.beginPath(); [[58, 25], [72, 12], [98, 12], [98, 25]].forEach(([a, b], i) => i ? ctx.lineTo(x + a, y + b) : ctx.moveTo(x + a, y + b)); ctx.clip();
      rect(ctx, x + 56, y + 12 + car.open * 13, 44, 14, '#26344c'); ctx.restore();
    }
    const wf = Math.floor(car.roll / 6) % 4;
    for (const [wx, wy] of WHEELS) ctx.drawImage(Wheels[right ? 3 - wf : wf], x + (right ? CAR_W - wx : wx) - 12, y + wy - 12);
    if (car.gun) drawSpr(ctx, Sprites.gunman[car.gun], x + 82, y + 26);
    // Headlights at night.
    ctx.globalCompositeOperation = 'lighter';
    const g = World.glowSprite(30, '#fff4c0', .22);
    if (right) ctx.drawImage(g, x + CAR_W - 10, y + 14, 70, 26); else ctx.drawImage(g, x - 60, y + 14, 70, 26);
    ctx.globalCompositeOperation = 'source-over';
  },
  draw(ctx) {
    const cam = this.cam, sx = Game.shake ? Math.round((rand() - .5) * Game.shake) : 0, sy = Game.shake ? Math.round((rand() - .5) * Game.shake) : 0;
    ctx.save(); ctx.translate(sx, sy);
    World.drawBack(ctx, this.S, cam, Game.t);
    World.drawGround(ctx, this.S, cam, Game.t);
    for (const d of this.decals) {
      const x = Math.round(d.x - cam), r = Math.round(d.r), col = Game.parent ? ['#2a6ad0', '#5aa0f0'] : ['#6a0a10', '#9a1820'];
      for (let k = -Math.ceil(r / 4); k <= Math.ceil(r / 4); k++) { const w = Math.round(r * Math.sqrt(1 - (k / (r / 4 + .5)) ** 2)); rect(ctx, x - w, FLOOR - 1 + k, w * 2, 1, k < 0 ? col[1] : col[0]); }
    }
    for (const can of this.cans) {
      const x = Math.round(can.x - cam);
      if (x < -30 || x > W + 30) continue;
      if (can.down) { const img = can.flip ? (Sprites.canDown.fl || (Sprites.canDown.fl = flipX(Sprites.canDown))) : Sprites.canDown; ctx.drawImage(img, x - 11, World.PROP_BASE - 13); }
      else ctx.drawImage(Sprites.can, x - 8, World.PROP_BASE - 19);
    }
    for (const it of this.items) {
      if (it.t > 9 && blink(6)) continue;
      const img = Sprites[it.k], bob = it.landed ? Math.round(Math.sin(Game.t * 5 + it.x) * 1.5) : 0;
      ctx.drawImage(img, Math.round(it.x - cam - img.width / 2), Math.round(it.y - img.height + bob));
    }
    const h = this.hero;
    if (!(this.phase === 'clear' && this.Cl.stage !== 'walk' && this.Cl.stage !== 'cheer')) {
      ctx.globalAlpha = .4; ctx.drawImage(puff(6, '#000'), Math.round(h.x - cam - 10), FLOOR - 2, 20, 5); ctx.globalAlpha = 1;
      drawSpr(ctx, this.heroFrame(), h.x - cam, FLOOR, h.face < 0);
    }
    for (const car of this.cars) this.drawCar(ctx, car, cam);
    if (this.E && this.E.flashT > 0 && this.E.muzzle) { const f = Sprites.flash; ctx.drawImage(f, Math.round(this.E.muzzle[0] - cam - 7), Math.round(this.E.muzzle[1] - 7)); }
    for (const p of this.parts) {
      const x = Math.round(p.x - cam), y = Math.round(p.y);
      if (p.k === 'px') rect(ctx, x, y, p.s, p.s, p.c);
      else if (p.k === 'puff') { ctx.globalAlpha = Math.min(1, p.life) * (p.a || .5); const img = puff(Math.max(1, Math.round(p.r)), p.c); ctx.drawImage(img, x - img.width / 2, y - img.height / 2); ctx.globalAlpha = 1; }
      else if (p.k === 'spr') ctx.drawImage(p.img, x - (p.img.width >> 1), y - (p.img.height >> 1));
      else if (p.k === 'rat') { const f = Sprites.rat[Math.floor(Game.t * 12) % 2]; ctx.drawImage(p.vx < 0 ? (f.fl || (f.fl = flipX(f))) : f, x, y - f.height); }
    }
    World.drawLight(ctx, this.S, cam);
    for (const p of this.pops) Font.draw(ctx, p.text, p.x - cam, p.y, p.t > 1 && blink(8) ? '#fff' : p.color, { bold: true, align: 'center', outline: '#000' });
    ctx.restore();

    if (this.E) this.drawEncounter(ctx);
    this.drawHud(ctx);
    if (this.banner) this.drawBanner(ctx);
    if (this.phase === 'death') this.drawDeath(ctx);
    if (this.phase === 'over') this.drawOver(ctx);
    if (this.phase === 'clear') this.drawClear(ctx);
    if (this.demo) {
      if (blink(1)) bigText(ctx, 'DEMO PLAY', 2, BANDS.gold, W / 2, 182);
      Font.draw(ctx, 'PRESS ANY KEY', W / 2, 202, '#fff', { align: 'center', outline: '#000' });
    }
    if (this.paused) { ctx.globalAlpha = .6; rect(ctx, 0, 0, W, H, '#000'); ctx.globalAlpha = 1; bigText(ctx, 'PAUSED', 3, BANDS.blue, W / 2, 90); }
  },
  drawHud(ctx) {
    const o = { bold: true, outline: '#000' };
    Font.draw(ctx, '1UP', 6, 3, blink(1.5) ? '#ff4040' : '#802020', o);
    Font.draw(ctx, pad(this.score + Math.min(9, this.cont), 7), 30, 3, '#ffffff', o);
    const hi = Math.max(Game.scores[0].score, this.score);
    Font.draw(ctx, 'HI', 150, 3, '#ffd040', o); Font.draw(ctx, pad(hi, 7), 166, 3, '#ffffff', o);
    Font.draw(ctx, 'TIME', 300, 3, '#60c0ff', o);
    Font.draw(ctx, pad(this.time, 2), 334, 3, this.time <= 15 && blink(3) ? '#ff4040' : '#ffffff', o);
    if (!this.E || this.E.phase === 'arrive') {
      if (this.streak >= 3) Font.draw(ctx, "TEACHER'S PET x" + (this.streak >= 10 ? 4 : this.streak >= 6 ? 3 : 2), 6, 14, blink(3) ? '#80ff80' : '#40c040', o);
      // How far to home.
      const u = clamp(this.hero.x / this.S.homeX, 0, 1), bx = 270, bw = 92;
      rect(ctx, bx, 17, bw, 3, '#000'); rect(ctx, bx + 1, 18, bw - 2, 1, '#4a5080');
      rect(ctx, bx + Math.round(u * (bw - 4)), 15, 3, 6, '#ffe040');
      ctx.drawImage(Sprites.house, bx + bw + 2, 12);
      Font.draw(ctx, 'HOME', bx - 4, 14, '#c8c8e0', { align: 'right', outline: '#000' });
    }
    // Items, bottom left.
    let x = 6;
    const slot = (img, n, on) => {
      ctx.globalAlpha = on ? 1 : .25; ctx.drawImage(img, x, 220 - img.height); ctx.globalAlpha = 1;
      x += img.width + 1;
      if (n > 1) { Font.draw(ctx, 'x' + n, x, 212, '#fff', o); x += 14; }
      x += 4;
    };
    slot(Sprites.calc, this.inv.calc, this.inv.calc > 0);
    slot(Sprites.coffee, 1, this.inv.coffee || (this.E && this.E.coffee));
    slot(Sprites.keeper, 1, this.inv.keeper);
    if (this.inv.calc && this.E && this.E.phase === 'quiz' && !this.E.used) Font.draw(ctx, 'X: CALCULATOR', x + 2, 212, blink(2) ? '#80ff80' : '#409040', o);
    if (this.idleT > 3 && this.phase === 'walk' && blink(2)) bigText(ctx, 'GO →', 2, BANDS.gold, W - 44, 92);
  },
  drawBanner(ctx) {
    const b = this.banner, k = Math.min(1, b.t * 6);
    const c = Font.big(b.big, 4, b.bands || BANDS.gold);
    const w = Math.round(c.width * (2 - k)), hgt = Math.round(c.height * (2 - k));
    ctx.drawImage(c, Math.round(W / 2 - w / 2), Math.round(70 - hgt / 2), w, hgt);
    if (b.sub && b.t > .3) Font.draw(ctx, b.sub, W / 2, 96, '#ffffff', { bold: true, align: 'center', outline: '#000' });
    if (b.sub2 && b.t > .8 && blink(3)) Font.draw(ctx, b.sub2, W / 2, 110, '#ffe040', { bold: true, align: 'center', outline: '#000' });
  },

  // ---- The quiz panel.
  layout(q) {
    const px = 6, pw = W - 12, inner = pw - 12, fig = !!q.fig, figW = 100, figH = 56;
    const textW = inner - (fig ? figW + 8 : 66);
    const lines = Font.wrap(q.text, textW);
    const bodyH = Math.max(lines.length * 10, fig ? figH : 20);
    const short = q.choices.every(s => Font.width(s, true) + 24 <= (inner - 18) / 4);
    const cols = short ? 4 : 2, bw = Math.floor((inner - (cols - 1) * 6) / cols), bh = 15;
    const ay = 18 + bodyH + 5;
    const boxes = q.choices.map((s, k) => ({ x: px + 6 + (k % cols) * (bw + 6), y: ay + Math.floor(k / cols) * (bh + 4), w: bw, h: bh }));
    const ph = ay + (4 / cols) * (bh + 4) + 4;
    let figC = null;
    if (fig) { figC = canvas(figW, figH); const x = figC.getContext('2d'); x.fillStyle = '#0c1028'; x.fillRect(0, 0, figW, figH); q.fig(x, figW, figH); }
    return { px, pw, lines, cols, boxes, ph, figC, figX: px + pw - 6 - figW, figY: 18, y: 12, fig };
  },
  drawEncounter(ctx) {
    const E = this.E, L = E.L, car = E.car, cam = this.cam;
    // Speech bubble.
    const talk = E.phase === 'talk' ? E.line : (E.phase === 'nod' || (E.phase === 'shot' && E.t > .3)) ? E.say : null;
    if (talk) {
      const w = Font.width(talk, true) + 12, x = clamp(Math.round(car.x - cam + 60 - w / 2), 4, W - w - 4), y = TIRES - 98;
      rect(ctx, x - 1, y - 1, w + 2, 15, '#000'); rect(ctx, x, y, w, 13, '#ffffff');
      for (let i = 0; i < 5; i++) rect(ctx, Math.round(car.x - cam + 64 - i), y + 13 + i, 5 - i, 1, '#ffffff');
      Font.draw(ctx, talk, x + w / 2, y + 3, '#101010', { bold: true, align: 'center' });
    }
    if (!['quiz', 'reveal'].includes(E.phase)) return;
    const slide = E.phase === 'quiz' ? Math.min(1, (E.t + (E.slid || 0)) * 5) : 1;
    if (E.phase === 'quiz' && slide >= 1) E.slid = 1;
    L.y = Math.round(12 - (1 - slide) * (L.ph + 20));
    const y0 = L.y;
    panel(ctx, L.px, y0, L.pw, L.ph);
    Font.draw(ctx, 'POP QUIZ!', L.px + 8, y0 + 6, '#ff4848', { bold: true });
    Font.draw(ctx, E.q.topic, L.px + 72, y0 + 6, '#6878c0');
    const secs = Math.max(0, Math.ceil(E.time));
    const tc = secs <= 5 ? (blink(4) ? BANDS.red : BANDS.gold) : BANDS.red;
    if (L.fig) {
      Font.draw(ctx, (E.coffee ? 'COFFEE  ' : '') + '00:' + pad(secs, 2), L.px + L.pw - 10, y0 + 6, secs <= 5 && blink(4) ? '#ffffff' : '#ff4848', { bold: true, align: 'right' });
      ctx.drawImage(L.figC, L.figX, y0 + L.figY);
      rect(ctx, L.figX - 1, y0 + L.figY - 1, L.figC.width + 2, 1, '#3c6cf8'); rect(ctx, L.figX - 1, y0 + L.figY + L.figC.height, L.figC.width + 2, 1, '#3c6cf8');
    } else {
      const bx = L.px + L.pw - 66;
      rect(ctx, bx, y0 + 5, 58, 24, '#000'); rect(ctx, bx + 1, y0 + 6, 56, 22, E.coffee ? '#5a3a10' : '#f0a020'); rect(ctx, bx + 2, y0 + 7, 54, 20, '#140404');
      bigText(ctx, '00:' + pad(secs, 2), 2, tc, bx + 29, y0 + 6);
      if (E.coffee) Font.draw(ctx, 'HALF SPEED', bx + 29, y0 + 31, '#ffd040', { align: 'center', outline: '#000' });
    }
    L.lines.forEach((s, i) => Font.draw(ctx, s, L.px + 8, y0 + 18 + i * 10, '#ffffff'));
    L.boxes.forEach((b, k) => {
      const x = b.x, y = y0 + b.y, sel = k === E.sel && E.phase === 'quiz', out = E.elim.includes(k);
      let fill = '#0c1440', edge = '#3c6cf8', ink = '#ffffff';
      if (out) { fill = '#121218'; edge = '#2a2a38'; ink = '#3a3a4a'; }
      if (sel) { fill = '#1c2c78'; edge = blink(4) ? '#ffe040' : '#ffffff'; }
      if (E.phase === 'reveal') {
        if (k === E.q.answer) { fill = blink(5) ? '#1c8a30' : '#127020'; edge = '#80ff90'; }
        else if (k === E.pick) { fill = '#9a1414'; edge = '#ff7070'; }
      }
      rect(ctx, x, y, b.w, b.h, '#000'); rect(ctx, x + 1, y + 1, b.w - 2, b.h - 2, edge); rect(ctx, x + 2, y + 2, b.w - 4, b.h - 4, fill);
      const label = 'ABCD'[k] + ')  ' + E.q.choices[k];
      Font.draw(ctx, label, x + b.w / 2, y + 4, ink, { bold: true, align: 'center' });
      if (out) rect(ctx, x + 6, y + 7, b.w - 12, 1, '#5a5a6a');
      if (sel && blink(4)) Font.draw(ctx, '→', x - 1, y + 4, '#ffe040', { bold: true, align: 'right' });
    });
    if (E.phase === 'reveal') {
      const ok = E.ok, s = E.pick === -1 ? "TIME'S UP!" : ok ? 'CORRECT!' : 'WRONG!';
      bigText(ctx, s, 3, ok ? BANDS.green : BANDS.red, W / 2, y0 + L.ph + 4);
    }
  },

  // ---- Death screens.
  drawDeath(ctx) {
    const D = this.D;
    if (D.stage === 'loose' || (D.stage === 'board' && D.bt < .2)) {
      if (D.t > .6) {
        const k = Math.min(1, (D.t - .6) * 7), c = Font.big('YOU LOOSE,', 5, BANDS.red), w = c.width * (2.2 - 1.2 * k), hh = c.height * (2.2 - 1.2 * k);
        ctx.drawImage(c, Math.round(W / 2 - w / 2), Math.round(60 - hh / 2), Math.round(w), Math.round(hh));
      }
      if (D.t > 1.1) {
        const n = Math.floor(clamp((D.t - 1.1) * 26, 0, SUBTITLE.length)), s = SUBTITLE.slice(0, n);
        const wsub = Font.width(SUBTITLE, true) + 16;
        rect(ctx, W / 2 - wsub / 2, 92, wsub, 14, '#000');
        Font.draw(ctx, s, W / 2 - wsub / 2 + 8, 95, '#ffd84a', { bold: true });
      }
      return;
    }
    if (D.stage === 'board') return this.drawBoard(ctx, Math.min(1, D.bt * 5));
    // Continue?
    ctx.globalAlpha = .65; rect(ctx, 0, 0, W, H, '#000'); ctx.globalAlpha = 1;
    bigText(ctx, 'CONTINUE?', 3, BANDS.blue, W / 2, 46);
    bigText(ctx, String(Math.max(0, Math.ceil(D.ct) - 1)), 6, BANDS.gold, W / 2, 78);
    if (blink(1.5)) Font.draw(ctx, Game.credits ? 'PRESS START' : 'INSERT COIN', W / 2, 146, '#ffffff', { bold: true, align: 'center', outline: '#000' });
    Font.draw(ctx, 'CREDIT ' + Game.credits, W / 2, 160, '#9098c8', { align: 'center' });
  },
  drawBoard(ctx, k) {
    const E = this.E || this.lastE, q = (this.E || {}).q;
    if (!q) return;
    const x0 = 14, y0 = Math.round(16 - (1 - k) * 220), w = W - 28, hh = 192;
    rect(ctx, x0 - 4, y0 - 4, w + 8, hh + 8, '#5a3418'); rect(ctx, x0 - 3, y0 - 3, w + 6, 1, '#8a5a30');
    rect(ctx, x0, y0, w, hh, '#1a4430');
    if (!this.dust) { this.dust = canvas(w, hh); const d = this.dust.getContext('2d'); for (let i = 0; i < 500; i++) { d.fillStyle = rand() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.09)'; d.fillRect(Math.floor(rand() * w), Math.floor(rand() * hh), 1 + Math.floor(rand() * 4), 1); } }
    ctx.drawImage(this.dust, x0, y0);
    const chalk = '#eef2e4', yel = '#f8e870', red = '#ff8a80';
    Font.draw(ctx, "LET'S GO OVER IT.", x0 + 8, y0 + 6, yel, { bold: true });
    const qw = q.fig ? w - 16 - 108 : w - 16;
    const ql = Font.wrap(q.text, qw);
    ql.forEach((s, i) => Font.draw(ctx, s, x0 + 8, y0 + 20 + i * 10, '#a8c8b4'));
    if (q.fig) ctx.drawImage(this.E.L.figC, x0 + w - 106, y0 + 20);
    let y = y0 + 24 + Math.max(ql.length * 10, q.fig ? 56 : 0);
    const said = E.pick === -1 ? 'YOU SAID: NOTHING. OUT OF TIME.' : `YOU SAID: (${'ABCD'[E.pick]}) ${q.choices[E.pick]}`;
    Font.draw(ctx, said, x0 + 8, y, red, { bold: true }); y += 13;
    for (const s of q.steps) { for (const line of Font.wrap(s, w - 24)) { Font.draw(ctx, line, x0 + 14, y, chalk); y += 10; } }
    y += 3;
    Font.draw(ctx, `ANSWER: (${'ABCD'[q.answer]}) ${q.choices[q.answer]}`, x0 + 8, y, yel, { bold: true });
    Font.draw(ctx, '- MR. DELGADO, PERIOD 3', x0 + w - 8, y0 + hh - 12, '#a8c8b4', { align: 'right' });
    rect(ctx, x0 + 20, y0 + hh, 26, 4, '#e8e8e0'); rect(ctx, x0 + 60, y0 + hh, 8, 3, '#f0f0f0');
    if (this.D.bt > .8 && blink(2)) Font.draw(ctx, 'PRESS A', x0 + 8, y0 + hh - 12, yel, { bold: true });
  },
  drawOver(ctx) {
    const O = this.O;
    ctx.globalAlpha = .7; rect(ctx, 0, 0, W, H, '#000'); ctx.globalAlpha = 1;
    bigText(ctx, 'GAME OVER', 4, BANDS.red, W / 2, 34);
    if (O.t > 1) {
      Font.draw(ctx, 'ESTIMATED SAT MATH SCORE', W / 2, 92, '#c8d0ff', { bold: true, align: 'center' });
      const shown = O.t > 2 ? O.sat : 200 + Math.floor(rand() * 60) * 10;
      bigText(ctx, String(shown), 4, BANDS.gold, W / 2, 106);
      if (O.t > 2.2) Font.draw(ctx, O.joke, W / 2, 150, '#ffffff', { bold: true, align: 'center' });
      if (O.t > 2.4) Font.draw(ctx, 'FINAL SCORE ' + pad(this.score + Math.min(9, this.cont), 7), W / 2, 168, '#ffd040', { bold: true, align: 'center' });
    }
  },
  drawClear(ctx) {
    const C = this.Cl;
    if (C.stage === 'cheer' || C.stage === 'walk') { if (C.stage === 'cheer') bigText(ctx, 'STAGE CLEAR!', 4, BANDS.gold, W / 2, 46); return; }
    ctx.globalAlpha = .7; rect(ctx, 0, 0, W, H, '#000'); ctx.globalAlpha = 1;
    if (C.stage === 'tally') {
      bigText(ctx, 'STAGE CLEAR!', 3, BANDS.gold, W / 2, 30);
      C.rows.forEach((r, i) => {
        if (i > C.row) return;
        const n = i < C.row ? r[1] : C.n, y = 76 + i * 22;
        Font.draw(ctx, r[0], 60, y, '#c8d0ff', { bold: true });
        Font.draw(ctx, r[2] === 10000 ? (n ? '10000' : '0') : `${n} x ${r[2]}`, W - 60, y, '#ffffff', { bold: true, align: 'right' });
      });
      return;
    }
    const L = ['YOU MADE IT HOME!', '', '...BUT YOU LEFT', C.forgot, 'AT SCHOOL.', '', 'GO BACK AND GET IT!'];
    L.forEach((s, i) => { if (C.t > i * .35) Font.draw(ctx, s, W / 2, 50 + i * 16, i === 3 ? '#ffe040' : '#ffffff', { bold: true, align: 'center' }); });
  },
};

// ---- High score initials.
const Entry = {
  KEYS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ.!?♥←✓',
  enter(o) {
    this.o = o; this.name = ''; this.cur = 0; this.t = 0;
    this.rank = Game.rank(o.score);
    Sound.music('entry');
  },
  finish() {
    const name = (this.name + '   ').slice(0, 3);
    Game.scores.splice(this.rank, 0, { name, score: this.o.score, sat: this.o.sat });
    Game.scores = Game.scores.slice(0, 10);
    Store.set('scores', Game.scores);
    Sound.stopMusic(); Sound.play('confirm');
    Attract.hi = this.rank;
    Game.go(Attract, 'scores');
  },
  pick(ch) {
    if (ch === '←') { this.name = this.name.slice(0, -1); Sound.play('select'); return; }
    if (ch === '✓') return this.finish();
    if (this.name.length < 3) { this.name += ch; Sound.play('confirm'); }
    if (this.name.length === 3) this.cur = this.KEYS.length - 1;
  },
  update(dt) {
    this.t += dt;
    const K = this.KEYS, cols = 8;
    if (Input.pressed('navL') || Input.pressed('left')) { this.cur = (this.cur + K.length - 1) % K.length; Sound.play('select'); }
    if (Input.pressed('navR') || Input.pressed('right')) { this.cur = (this.cur + 1) % K.length; Sound.play('select'); }
    if (Input.pressed('navU') || Input.pressed('up')) { this.cur = (this.cur + K.length - cols) % K.length; Sound.play('select'); }
    if (Input.pressed('navD') || Input.pressed('down')) { this.cur = (this.cur + cols) % K.length; Sound.play('select'); }
    // Letter keys type; Space or the A button takes the highlighted key; Enter is done.
    const typed = Input.typed.filter(ch => /^[a-z.!?]$/i.test(ch));
    if (typed.length) { for (const ch of typed) this.pick(ch.toUpperCase()); return; }
    if (Input.hit.has('Space') || Input.vhit.has('fire')) this.pick(K[this.cur]);
    else if (Input.pressed('enter')) this.finish();
    else if (Input.pressed('back')) this.pick('←');
    for (const t of Input.taps) {
      const i = Math.floor((t.x - 60) / 33) + Math.floor((t.y - 104) / 22) * cols;
      if (t.x >= 60 && t.x < 60 + cols * 33 && t.y >= 104 && i >= 0 && i < K.length) { this.cur = i; this.pick(K[i]); }
    }
    if (this.t > 40) this.finish();
  },
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#05040e');
    bigText(ctx, 'NEW HIGH SCORE!', 3, BANDS.gold, W / 2, 8);
    const r = this.rank + 1, ord = r === 1 ? '1ST' : r === 2 ? '2ND' : r === 3 ? '3RD' : r + 'TH';
    Font.draw(ctx, `YOU RANK ${ord}.  SAT ${this.o.sat}.  ENTER YOUR INITIALS`, W / 2, 42, '#c8d0ff', { bold: true, align: 'center' });
    for (let i = 0; i < 3; i++) {
      const ch = this.name[i] || (i === this.name.length && blink(3) ? '_' : ' ');
      bigText(ctx, ch === ' ' ? '.' : ch, 4, ch === ' ' ? ['#202030'] : BANDS.red, W / 2 - 40 + i * 40, 58);
    }
    const K = this.KEYS, cols = 8;
    for (let i = 0; i < K.length; i++) {
      const x = 60 + (i % cols) * 33, y = 104 + Math.floor(i / cols) * 22, on = i === this.cur;
      if (on) { rect(ctx, x - 2, y - 3, 31, 19, blink(4) ? '#ffe040' : '#ff4040'); rect(ctx, x - 1, y - 2, 29, 17, '#1c2c78'); }
      const ch = K[i], label = ch === '←' ? 'DEL' : ch === '✓' ? 'END' : ch;
      Font.draw(ctx, label, x + 14, y + 3, on ? '#ffffff' : '#a0a8e0', { bold: true, align: 'center' });
    }
    Font.draw(ctx, 'TYPE, OR ARROWS AND Z.  ENTER WHEN DONE.', W / 2, 206, '#6870a0', { align: 'center' });
  },
};
