'use strict';
// Shoulda Listened to Your Math Teacher: shared constants, helpers, input and storage.

const W = 384, H = 224;          // native resolution, the same as a 1990s CPS-1 arcade board
const WALK_TOP = 148;            // where the sidewalk meets the buildings
const FLOOR = 174;               // y of the hero's feet
const CURB = 180;                // top of the curb
const ROAD = 185;                // top of the street
const TIRES = 219;               // y where car tires touch the street

const DEG = Math.PI / 180;
const rand = Math.random;
const randInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = a => a[Math.floor(rand() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// A small seeded generator (mulberry32), so a street can be rebuilt the same way.
function seeded(seed) {
  return function () {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').imageSmoothingEnabled = false;
  return c;
}
const ctxOf = c => c.getContext('2d', { willReadFrequently: true });
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbHex(r, g, b) { return '#' + ((1 << 24) | (clamp(r | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(b | 0, 0, 255)).toString(16).slice(1); }
// Scale a color's brightness: f < 1 darkens, f > 1 lightens.
function shade(hex, f) { const [r, g, b] = hexRgb(hex); return rgbHex(r * f, g * f, b * f); }
function mix(a, b, t) { const p = hexRgb(a), q = hexRgb(b); return rgbHex(lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)); }

// Per-device settings and high scores. Storage can be missing (private windows), so every call is guarded.
const Store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('shoulda.' + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  },
  set(key, value) { try { localStorage.setItem('shoulda.' + key, JSON.stringify(value)); } catch (e) { /* not saved */ } },
};

// Controls. The arcade panel is a joystick, two buttons, a coin slot and a start button.
const KEYS = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  fire: ['KeyZ', 'KeyJ', 'Space'], calc: ['KeyX', 'KeyK'],
  coin: ['Digit5', 'Numpad5'], start: ['Digit1', 'Numpad1', 'Enter', 'NumpadEnter'],
  a0: ['KeyA', 'Digit1', 'Numpad1'], a1: ['KeyB', 'Digit2', 'Numpad2'], a2: ['KeyC', 'Digit3', 'Numpad3'], a3: ['KeyD', 'Digit4', 'Numpad4'],
  enter: ['Enter', 'NumpadEnter'], back: ['Backspace'],
  // Moving between answers uses the arrows only, so the letter keys can answer.
  navL: ['ArrowLeft'], navR: ['ArrowRight'], navU: ['ArrowUp'], navD: ['ArrowDown'],
  mute: ['KeyM', 'Digit0'], parent: ['KeyP'], pause: ['Escape'], full: ['KeyF'], read: ['KeyR'],
};
const Input = {
  held: new Set(), hit: new Set(),        // keyboard codes down now / pressed this frame
  vheld: new Set(), vhit: new Set(),      // touch-panel actions
  taps: [], typed: [], any: false,
  down(act) { return KEYS[act].some(k => this.held.has(k)) || this.vheld.has(act); },
  pressed(act) { return (KEYS[act] || []).some(k => this.hit.has(k)) || this.vhit.has(act); },
  tap() { return this.taps.length ? this.taps[0] : null; },
  endFrame() { this.hit.clear(); this.vhit.clear(); this.taps.length = 0; this.typed.length = 0; this.any = false; },
};
