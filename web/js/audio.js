// Small synthesized sound effects via the Web Audio API — nothing fetched
// from anywhere. Every sound is a couple of oscillator blips shaped with a
// gain envelope. Muted by default until the player opts in, and lazily
// created on first use since AudioContext requires a user gesture.

let ctx = null;
let muted = true;

function ensureContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function tone({ freq, duration = 0.15, type = 'sine', gain = 0.07, glideTo = null, delay = 0 }) {
  if (muted) return;
  const audioCtx = ensureContext();
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

export function playUnlock() {
  ensureContext();
}

export function playClick() {
  tone({ freq: 660, duration: 0.035, type: 'square', gain: 0.025 });
}

export function playMove() {
  tone({ freq: 175, duration: 0.08, type: 'triangle', gain: 0.06 });
  tone({ freq: 135, duration: 0.09, type: 'triangle', gain: 0.05, delay: 0.1 });
}

export function playInspectFound() {
  tone({ freq: 523, duration: 0.13, type: 'sine', gain: 0.07 });
  tone({ freq: 784, duration: 0.2, type: 'sine', gain: 0.06, delay: 0.11 });
}

export function playInspectEmpty() {
  tone({ freq: 240, duration: 0.12, type: 'sine', gain: 0.04 });
}

export function playInterview() {
  tone({ freq: 330, duration: 0.13, type: 'triangle', gain: 0.06 });
  tone({ freq: 415, duration: 0.15, type: 'triangle', gain: 0.05, delay: 0.09 });
}

export function playLock() {
  tone({ freq: 160, duration: 0.07, type: 'square', gain: 0.05 });
  tone({ freq: 95, duration: 0.18, type: 'square', gain: 0.06, delay: 0.07 });
}

export function playAccuseCorrect() {
  [523, 659, 784, 1046].forEach((freq, i) => tone({ freq, duration: 0.24, type: 'sine', gain: 0.07, delay: i * 0.12 }));
}

export function playAccuseWrong() {
  tone({ freq: 220, duration: 0.32, type: 'sawtooth', gain: 0.06, glideTo: 100 });
}

export function playError() {
  tone({ freq: 200, duration: 0.16, type: 'square', gain: 0.05, glideTo: 130 });
}
