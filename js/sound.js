'use strict';
// Sound: every effect and every tune is synthesized with Web Audio, the way an arcade board's
// sound chip would: pulse waves, a triangle bass, noise drums. Plus a few spoken lines through the
// browser's speech voice, pitched down like a 90s digitized announcer.

const Sound = (() => {
  let ac = null, out, sfx, mus, noise, muted = Store.get('mute', false);
  const waves = {};

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    out = ac.createGain(); out.gain.value = muted ? 0 : 0.7;
    const comp = ac.createDynamicsCompressor();
    out.connect(comp); comp.connect(ac.destination);
    sfx = ac.createGain(); sfx.gain.value = 0.8; sfx.connect(out);
    mus = ac.createGain(); mus.gain.value = 0.42; mus.connect(out);
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // Pulse waves at the duty cycles of an NES-style sound chip.
    for (const [name, duty] of [['p12', .125], ['p25', .25], ['p50', .5]]) {
      const n = 40, re = new Float32Array(n), im = new Float32Array(n);
      for (let k = 1; k < n; k++) re[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * duty);
      waves[name] = ac.createPeriodicWave(re, im);
    }
    loadVoices();
  }
  const ready = () => ac && ac.state === 'running';

  // One note. o: { to (slide target), slide, decay (true: fade the whole length), a, lp (lowpass), vib, dest }
  function tone(wave, f, t, dur, vol, o = {}) {
    const s = ac.createOscillator(), g = ac.createGain();
    if (waves[wave]) s.setPeriodicWave(waves[wave]); else s.type = wave;
    s.frequency.setValueAtTime(f, t);
    if (o.to) s.frequency.exponentialRampToValueAtTime(o.to, t + (o.slide || dur));
    if (o.vib) {
      const l = ac.createOscillator(), lg = ac.createGain();
      l.frequency.value = o.vib; lg.gain.value = f * 0.03; l.connect(lg); lg.connect(s.frequency);
      l.start(t + (o.vibAt || 0)); l.stop(t + dur + .05);
    }
    const a = o.a || .004;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    if (o.decay) g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    else { g.gain.setValueAtTime(vol, t + Math.max(a, dur - .03)); g.gain.linearRampToValueAtTime(0.0001, t + dur); }
    let node = s;
    if (o.lp) { const f2 = ac.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = o.lp; s.connect(f2); node = f2; }
    node.connect(g); g.connect(o.dest || sfx);
    s.start(t); s.stop(t + dur + .05);
  }
  // Filtered noise. o: { type, f, to, q, dest }
  function hiss(t, dur, vol, o = {}) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; s.loop = true;
    f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.f || 3000, t); f.Q.value = o.q || .7;
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(f); f.connect(g); g.connect(o.dest || sfx);
    s.start(t, Math.random() * .5); s.stop(t + dur + .02);
  }
  const arp = (wave, notes, t, step, vol, last = step) => notes.forEach((f, i) => tone(wave, f, t + i * step, i === notes.length - 1 ? last : step, vol, { decay: i === notes.length - 1 }));

  const FX = {
    coin(t) { tone('p50', 988, t, .07, .22); tone('p50', 1319, t + .07, .4, .22, { decay: true }); },
    start(t) { arp('p50', [523, 659, 784, 1047, 1319, 1568], t, .05, .2, .3); },
    select(t) { tone('p25', 740, t, .04, .14); },
    confirm(t) { tone('p25', 988, t, .05, .16); tone('p25', 1480, t + .05, .08, .16); },
    kick(t) { hiss(t, .12, .3, { type: 'bandpass', f: 600, to: 2500, q: 1.5 }); },
    clang(t) {
      for (const [f, v] of [[523, .12], [787, .1], [1180, .08], [1660, .06], [2210, .04]]) tone('triangle', f * (1 + Math.random() * .02), t, .45, v, { decay: true });
      hiss(t, .1, .3, { type: 'highpass', f: 3000 });
    },
    pickup(t) { arp('p50', [784, 988, 1175, 1568, 1976], t, .045, .18, .15); },
    power(t) { arp('p12', [1568, 1175, 1568, 2093, 1568, 2637], t, .04, .14, .12); },
    honk(t) { tone('p50', 349, t, .32, .12, { lp: 1400 }); tone('p50', 440, t, .32, .12, { lp: 1400 }); },
    engine(t, dur = 1.4) {
      tone('sawtooth', 50, t, dur, .22, { to: 95, lp: 380, slide: dur * .6 });
      tone('sawtooth', 51, t, dur, .12, { to: 140, lp: 500, slide: dur });
      hiss(t, dur, .1, { f: 300 });
    },
    screech(t, dur = .7) {
      hiss(t, dur, .28, { type: 'bandpass', f: 2600, to: 1900, q: 9 });
      tone('p25', 1750, t, dur, .05, { vib: 22, to: 1500, decay: true });
    },
    window(t) { tone('sawtooth', 240, t, .45, .07, { to: 210, lp: 700 }); },
    cock(t) { hiss(t, .03, .4, { type: 'highpass', f: 2500 }); hiss(t + .14, .04, .45, { type: 'highpass', f: 1800 }); tone('square', 1900, t + .14, .02, .06); },
    bang(t) {
      hiss(t, .6, 1, { f: 6000, to: 160 });
      tone('sine', 170, t, .3, 1, { to: 38, decay: true });
      hiss(t + .02, 1.2, .18, { type: 'bandpass', f: 900, to: 200, q: .6 });
    },
    squirt(t) {
      for (let i = 0; i < 5; i++) hiss(t + i * .07, .09, .3, { type: 'bandpass', f: 2400 + i * 200, q: 2.5 });
      tone('sine', 1200, t, .35, .05, { to: 500 });
    },
    ricochet(t) { tone('sine', 2600, t, .4, .16, { to: 900, decay: true }); hiss(t, .08, .5, { f: 1200 }); },
    correct(t) { arp('p50', [1047, 1319, 1568, 2093], t, .07, .18, .35); arp('p25', [523, 659, 784, 1047], t, .07, .1, .35); },
    wrong(t) { tone('p50', 110, t, .6, .2, { lp: 1800 }); tone('p50', 117, t, .6, .2, { lp: 1800 }); },
    tick(t, loud) { tone('square', loud ? 1700 : 1300, t, .025, loud ? .13 : .06); },
    hurry(t) { for (let i = 0; i < 6; i++) tone('p25', i % 2 ? 660 : 880, t + i * .12, .11, .14); },
    tally(t) { tone('p25', 1400, t, .03, .08); },
    thud(t) { tone('sine', 110, t, .25, .5, { to: 40, decay: true }); hiss(t, .2, .3, { f: 400 }); },
    splash(t) { hiss(t, .5, .4, { type: 'bandpass', f: 1500, to: 600, q: 1 }); },
    beep(t) { tone('p50', 1047, t, .1, .14); },
    trombone(t) {
      const n = [233, 220, 208, 196];
      n.forEach((f, i) => tone('sawtooth', f, t + i * .5, i < 3 ? .46 : 1.5, .16, { lp: 1300, vib: i === 3 ? 6 : 0, vibAt: .2, a: .03, decay: i === 3 }));
    },
    gameover(t) { arp('p50', [784, 740, 698, 659, 622, 587, 554, 523], t, .12, .14, .8); arp('triangle', [196, 185, 175, 165, 156, 147, 139, 131], t, .12, .25, .8); },
    oneup(t) { arp('p50', [659, 784, 1319, 1047, 1175, 1568], t, .06, .16, .2); },
    step(t) { hiss(t, .03, .04, { f: 700 }); },
  };
  function play(name, ...args) { if (!ready() || muted) return; FX[name](ac.currentTime + .005, ...args); }

  // ---- Music: a tiny tracker. Tokens per 16th note: a note ("E2", "F#4"), "-" holds, "." rests.
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(n) {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
    const midi = (+m[3] + 1) * 12 + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * 2 ** ((midi - 69) / 12);
  }
  function parse(str) {
    const toks = str.trim().split(/\s+/), ev = [];
    toks.forEach((t, i) => {
      if (t === '-' || t === '.') return;
      let len = 1; while (toks[i + len] === '-') len++;
      ev[i] = { f: freq(t), len };
    });
    return { ev, n: toks.length };
  }
  const BASS_E = 'E2 - . E2 E3 . E2 . D3 . E2 . G2 . A2 B2 E2 - . E2 E3 . E2 . D3 . B2 . A2 . G2 F#2 ' +
    'C2 - . C2 C3 . C2 . B2 . C2 . D2 . E2 G2 D2 - . D2 D3 . D2 . C3 . A2 . B2 . D3 B2 ';
  const SONGS = {
    street: {
      bpm: 112, tracks: [
        { wave: 'p25', vol: .3, notes: BASS_E + BASS_E, lp: 1600 },
        {
          wave: 'p50', vol: .13, notes:
            'B4 - - . G4 . E4 . . . G4 . A4 - B4 . D5 - B4 . A4 . G4 . A4 - - - . . . . ' +
            'C5 - - . B4 . G4 . . . E4 . G4 - A4 . B4 - - - A4 . G4 . F#4 - - - . . . . ' +
            'E5 . E5 . D5 . B4 . D5 - E5 . . . G5 . F#5 - E5 . D5 . B4 . A4 - B4 - - - . . ' +
            'C5 . C5 . B4 . G4 . A4 - C5 . . . E5 . D5 - - - B4 - - - G4 . A4 . B4 - - - ',
        },
        { drums: 'K.hhS.hK.Kh.S.hh'.repeat(7) + 'K.hhS.hK.KSSS.SS' },
      ],
    },
    quiz: {
      bpm: 138, tracks: [
        { wave: 'p25', vol: .3, notes: 'E2 . E2 . E2 . F2 . E2 . E2 . A#1 . B1 . E2 . E2 . E2 . F2 . E2 . G2 . F#2 . F2 .', lp: 1200 },
        { wave: 'p12', vol: .07, notes: 'B5 . . . . . . . B5 . . . . . . . B5 . . . . . . . C6 . . . B5 . . .' },
        { drums: 'K.hhh.hhK.hhh.hh'.repeat(2) },
      ],
    },
    clear: {
      bpm: 150, loop: false, tracks: [
        { wave: 'p50', vol: .16, notes: 'C5 E5 G5 C6 - - G5 C6 - - - - . . . . D5 F5 A5 D6 - - A5 D6 - - - - - - - -' },
        { wave: 'triangle', vol: .35, notes: 'C3 . . . G2 . . . C3 - - - . . . . D3 . . . A2 . . . D3 - - - - - - -' },
        { drums: 'K...K...KSSSK...K...K...KSSSK...' },
      ],
    },
    entry: {
      bpm: 124, tracks: [
        { wave: 'triangle', vol: .35, notes: 'C3 . G2 . A2 . E2 . F2 . C3 . F2 . G2 . C3 . G2 . A2 . E2 . F2 . G2 . C3 - - .' },
        { wave: 'p50', vol: .12, notes: 'E5 . G5 . A5 - G5 . F5 . A5 . G5 - - . E5 . G5 . A5 - C6 . B5 . G5 . C6 - - .' },
        { drums: 'K.h.S.h.K.h.S.hh'.repeat(2) },
      ],
    },
  };
  let song = null, timer = null;
  function music(name) {
    if (song && song.name === name) return;
    stopMusic();
    if (!ready() || !SONGS[name]) return;
    const S = SONGS[name];
    song = { name, S, step: 0, at: ac.currentTime + .06, dt: 60 / S.bpm / 4, tracks: S.tracks.map(t => t.drums ? t : Object.assign({}, t, parse(t.notes))), bus: ac.createGain() };
    song.bus.connect(mus);
    song.len = Math.max(...song.tracks.map(t => t.drums ? t.drums.length : t.n));
    timer = setInterval(pump, 25);
    pump();
  }
  function pump() {
    if (!song) return;
    while (song.at < ac.currentTime + .15) {
      const i = song.step;
      if (i >= song.len) {
        if (song.S.loop === false) { stopMusic(); return; }
        song.step = 0; continue;
      }
      for (const tr of song.tracks) {
        if (tr.drums) {
          const ch = tr.drums[i % tr.drums.length], t = song.at, b = song.bus;
          if (ch === 'K') tone('sine', 140, t, .14, .55, { to: 42, decay: true, dest: b });
          else if (ch === 'S') { hiss(t, .13, .32, { type: 'highpass', f: 1400, dest: b }); tone('triangle', 190, t, .06, .2, { decay: true, dest: b }); }
          else if (ch === 'h') hiss(t, .035, .09, { type: 'highpass', f: 7500, dest: b });
          continue;
        }
        const e = tr.ev[i % tr.n];
        if (e) tone(tr.wave, e.f, song.at, e.len * song.dt * .92, tr.vol, { lp: tr.lp, dest: song.bus });
      }
      song.step++;
      song.at += song.dt;
    }
  }
  function stopMusic() {
    if (timer) clearInterval(timer);
    timer = null;
    if (song) { const b = song.bus; b.gain.setValueAtTime(b.gain.value, ac.currentTime); b.gain.linearRampToValueAtTime(0, ac.currentTime + .08); setTimeout(() => b.disconnect(), 300); }
    song = null;
  }

  // ---- Voices: the recorded lines in js/data/voices.js (ElevenLabs, crunched to 8 bits by
  // tools/voices.py), on one speech channel like a 90s board. Lines take turns, and the music ducks
  // while anyone talks.
  const lines = {};
  let vox = null, talking = null, queue = [];
  function loadVoices() {
    if (vox || typeof VOICE_LINES === 'undefined') return;
    vox = ac.createGain(); vox.gain.value = 1.15; vox.connect(out);
    for (const [k, b64] of Object.entries(VOICE_LINES)) {
      const bin = atob(b64), buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      ac.decodeAudioData(buf.buffer).then(b => { lines[k] = b; }, () => { /* left out */ });
    }
  }
  function duck(on) {
    const t = ac.currentTime;
    mus.gain.cancelScheduledValues(t); mus.gain.setValueAtTime(mus.gain.value, t);
    mus.gain.linearRampToValueAtTime(on ? .14 : .42, t + (on ? .05 : .4));
  }
  function start(key) {
    const b = lines[key], src = ac.createBufferSource();
    src.buffer = b; src.connect(vox); src.start();
    const me = talking = { src, end: ac.currentTime + b.duration };
    duck(true);
    src.onended = () => {
      if (talking !== me) return;
      talking = null;
      while (queue.length) { const q = queue.shift(); if (ac.currentTime <= q.by) return start(q.key); }
      duck(false);
    };
  }
  // Plays a line (a key, or a list to pick one from) and returns how long until it has been said,
  // counting any wait for its turn; 0 if it won't be said. While someone is talking a line waits its
  // turn, unless that would be more than o.wait seconds (default 1.2), when it's dropped.
  // o.cut: say it now, cutting off whoever is talking. o.optional: only if nobody is talking.
  // o.fallback: words for the browser's own voice if the line wasn't recorded.
  function voice(key, o = {}) {
    if (Array.isArray(key)) key = key[Math.floor(Math.random() * key.length)];
    if (muted || !ready()) return 0;
    const b = lines[key];
    if (!b) { if (o.fallback) say(o.fallback); return 0; }
    const busy = talking ? Math.max(0, talking.end - ac.currentTime) + queue.reduce((s, q) => s + lines[q.key].duration, 0) : 0;
    if (busy && !o.cut) {
      if (o.optional || busy > (o.wait === undefined ? 1.2 : o.wait)) return 0;
      queue.push({ key, by: ac.currentTime + busy + .15 });
      return busy + b.duration;
    }
    hush();
    start(key);
    return b.duration;
  }
  function hush() { queue = []; if (talking) { const t = talking; talking = null; t.src.stop(); duck(false); } }

  // The browser's own voice, for a line that wasn't recorded.
  let sv = null;
  function pickVoice() {
    const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    sv = vs.find(v => /^en/i.test(v.lang) && /david|mark|guy|male|fred|daniel/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function say(text, pitch = .3) {
    if (muted || !ready() || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = pitch; u.rate = .82; u.volume = 1;
    if (sv) u.voice = sv;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function toggleMute() {
    muted = !muted;
    Store.set('mute', muted);
    if (out) out.gain.value = muted ? 0 : 0.7;
    if (muted && window.speechSynthesis) speechSynthesis.cancel();
    if (muted && ac) hush();
    return muted;
  }
  return { init, play, music, stopMusic, say, voice, hush, toggleMute, get muted() { return muted; }, get song() { return song && song.name; }, get talking() { return !!talking; } };
})();
