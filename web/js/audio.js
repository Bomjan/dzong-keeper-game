// sound effects, made with the web audio api so no mp3 files needed
// its muted at the start because browsers block sound until u click something

let ctx = null;
let muted = true;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
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

// makes one beep. copied the envelope idea from a tutorial
function tone({ freq, duration = 0.15, type = 'sine', gain = 0.07, glideTo = null, delay = 0 }) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

export function playClick() {
  tone({ freq: 660, duration: 0.035, type: 'square', gain: 0.025 });
}

export function playMove() {
  tone({ freq: 175, duration: 0.08, type: 'triangle', gain: 0.06 });
  tone({ freq: 135, duration: 0.09, type: 'triangle', gain: 0.05, delay: 0.1 });
}

export function playInspectFound() {
  tone({ freq: 523, duration: 0.13, gain: 0.07 });
  tone({ freq: 784, duration: 0.2, gain: 0.06, delay: 0.11 });
}

export function playInspectEmpty() {
  tone({ freq: 240, duration: 0.12, gain: 0.04 });
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
  // little happy arpeggio
  const notes = [523, 659, 784, 1046];
  for (let i = 0; i < notes.length; i++) {
    tone({ freq: notes[i], duration: 0.24, gain: 0.07, delay: i * 0.12 });
  }
}

export function playAccuseWrong() {
  tone({ freq: 220, duration: 0.32, type: 'sawtooth', gain: 0.06, glideTo: 100 });
}

export function playError() {
  tone({ freq: 200, duration: 0.16, type: 'square', gain: 0.05, glideTo: 130 });
}
