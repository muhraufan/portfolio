// ---- Guestbook sounds ----
// Procedural Web Audio cues for the send flow. Three moments:
//
//   playReady()   — card hits its "ready" state. Single soft 440Hz
//                   sine, 80ms, fast attack / slow decay. Warm,
//                   not sharp.
//
//   playPickup()  — drag starts. Short sine sweep 120Hz → 180Hz
//                   over 100ms. More felt than heard.
//
//   playDrop()    — the payoff. Lowpass-filtered white noise at
//                   ~800Hz cutoff (~180ms) layered with a low 60Hz
//                   thud (~80ms). Paper sliding, then landing.
//
// A single AudioContext is lazily created on first play so we don't
// trip browser autoplay policies. All cues go through a shared
// master GainNode at 0.3 — ambient, not loud. If the Web Audio API
// isn't available (or context creation throws), every call becomes
// a silent no-op and the UI keeps working.

let ctx = null;
let master = null;
let unlocked = false;

function getCtx() {
  if (ctx) return ctx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0.3;
    master.connect(ctx.destination);
  } catch (_) {
    ctx = null;
  }
  return ctx;
}

// Some browsers (Safari, Chrome w/ autoplay blocking) suspend the
// context until a user gesture. We call resume() defensively on
// every play — it's a no-op if already running.
function ensureRunning(c) {
  if (!c) return;
  if (c.state === 'suspended' && typeof c.resume === 'function') {
    c.resume().catch(() => {});
  }
  unlocked = true;
}

/**
 * Warm unlock — call this from the first user-gesture handler
 * (e.g. first card click) so the very first procedural cue plays
 * on time instead of getting queued.
 */
export function primeAudio() {
  const c = getCtx();
  ensureRunning(c);
}

/** Single soft 440Hz sine, 80ms. Card has reached ready state. */
export function playReady() {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = 'sine';
  osc.frequency.value = 440;

  // Fast attack (4ms) → slow-ish exponential decay to near-zero by
  // ~80ms. Peak is intentionally low; this is a whisper, not a ping.
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.55, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  osc.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + 0.1);
}

/** 120Hz → 180Hz sine sweep over 100ms. Drag pickup. */
export function playPickup() {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.linearRampToValueAtTime(180, now + 0.1);

  // Slightly softer than ready — this is a tactile confirmation,
  // felt more than heard.
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.5, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

  osc.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + 0.12);
}

/**
 * Drop into slot. Two layers fired simultaneously:
 *
 *   1. Lowpass-filtered white noise (BiquadFilterNode, 800Hz cutoff)
 *      over ~180ms — the "paper sliding" swoosh.
 *   2. Low 60Hz sine, ~80ms — the "thud" landing.
 *
 * Both soft attack, quick decay.
 */
export function playDrop() {
  const c = getCtx();
  if (!c) return;
  ensureRunning(c);

  const now = c.currentTime;

  // --- 1. Filtered noise (paper sliding) ---
  const noiseDur = 0.18;
  const sampleCount = Math.max(1, Math.floor(c.sampleRate * noiseDur));
  const buffer = c.createBuffer(1, sampleCount, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = c.createBufferSource();
  noise.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.7;

  const noiseGain = c.createGain();
  // Soft attack (10ms) then quick decay across the buffer.
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.7, now + 0.01);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDur);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(now);
  noise.stop(now + noiseDur + 0.02);

  // --- 2. Low thud (60Hz sine) ---
  const thud = c.createOscillator();
  const thudGain = c.createGain();
  thud.type = 'sine';
  thud.frequency.value = 60;

  thudGain.gain.setValueAtTime(0.0001, now);
  thudGain.gain.exponentialRampToValueAtTime(0.85, now + 0.006);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  thud.connect(thudGain);
  thudGain.connect(master);
  thud.start(now);
  thud.stop(now + 0.11);
}
