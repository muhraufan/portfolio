/* Timeline 3 — sound and touch. On by default, but nothing sounds before the first touch or key; one footer toggle,
   remembered in localStorage 'tl-feedback'. Every cue is synthesized and very short; ratchet clicks are crisp and clearly audible:
   tick  – one month (or day) crossed while scrubbing: a dry 4 ms click
   hover – a day passed under a hovering mouse: a 4 ms click, a touch firmer (hover2) on a month boundary;
           at most one per 30 ms and up to 2.5 dB softer the faster the sweep, so a fling reads as a purr, not a buzz
   open  – a row opening: a soft low breath      close – the same, shorter */
(function () {
  var KEY = 'tl-feedback', ctx = null, master = null, lastTick = 0, lastHover = 0, primed = false, noiseBuf = null;
  var TL3 = window.TL3 = window.TL3 || {};
  var on = TL3.soundOn = function () { try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; } };
  function ac() {
    if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); master = ctx.createGain(); master.gain.value = .42; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume(); return ctx;
  }
  // Browsers keep audio locked until a real gesture. Safari only counts click/touchend/keydown, Chrome also pointerdown/up,
  // so listen to all of them and keep retrying until the context is actually running (a rejected resume must not lock us out).
  var UNLOCK = ['pointerdown', 'pointerup', 'mousedown', 'click', 'touchend', 'keydown'];
  function prime() {
    if (primed || !on()) return; var c = ac(); if (!c) return;
    var done = function () { if (c.state !== 'running' || primed) return; primed = true; UNLOCK.forEach(function (t) { window.removeEventListener(t, prime, true); }); };
    // play one silent frame inside the gesture: older Safari only unlocks when a source actually starts
    try { var b = c.createBuffer(1, 1, c.sampleRate), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
    var r = c.resume && c.resume(); if (r && r.then) r.then(done, function () {}); else done(); done();
  }
  UNLOCK.forEach(function (t) { window.addEventListener(t, prime, { capture: true, passive: true }); });
  // A page reached by clicking a same-site link (home → Earlier sightings) may already be allowed to play: ask at load and on the
  // first pointer movement, and if the context comes up running, hover sounds work before any click on this page.
  function probe() {
    if (primed || !on()) return; var c = ac(); if (!c) return;
    var ok = function () { if (c.state === 'running') { primed = true; } };
    ok(); var r = c.resume && c.resume(); if (r && r.then) r.then(ok, function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', probe); else probe();
  window.addEventListener('pageshow', probe);
  ['pointerover', 'pointermove'].forEach(function (t) { window.addEventListener(t, function f() { probe(); if (primed) window.removeEventListener(t, f, true); }, { capture: true, passive: true }); });
  // input modality: focus rings only for keyboard users, also on things focused from script
  window.addEventListener('keydown', function (e) { if (!e.metaKey && !e.ctrlKey) document.documentElement.dataset.input = 'kbd'; }, true);
  window.addEventListener('pointerdown', function () { document.documentElement.dataset.input = 'ptr'; }, true);
  // seeded (xorshift32) so a ratchet click has the same level on every visit; Math.random noise made one hover differ from the next by up to 8 dB
  function noise(c) { if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate * .2, c.sampleRate); var d = noiseBuf.getChannelData(0), x = 0x2f6b1d3a; for (var i = 0; i < d.length; i++) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; d[i] = (x >>> 0) / 2147483648 - 1; } } return noiseBuf; }
  function burst(c, t, dur, f, q, g, type, off) {   // off: fixed start in the noise (ratchet clicks), else random
    var s = c.createBufferSource(), bp = c.createBiquadFilter(), v = c.createGain();
    s.buffer = noise(c); bp.type = type || 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(Math.max(.0001, g * .001), t + dur);   // fall 60 dB below its own peak, so loudness tracks g 1:1
    s.connect(bp); bp.connect(v); v.connect(master); if (off != null) s.playbackRate.value = 1 + (Math.random() - .5) * .04; s.start(t, off != null ? off : Math.random() * .15); s.stop(t + dur + .01);
  }
  function tone(c, t, f0, f1, dur, g) {
    var o = c.createOscillator(), v = c.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var lo = Math.max(.0001, g * .001); v.gain.setValueAtTime(lo, t); v.gain.exponentialRampToValueAtTime(g, t + .003); v.gain.exponentialRampToValueAtTime(lo, t + dur);
    o.connect(v); v.connect(master); o.start(t); o.stop(t + dur + .02);
  }
  function vib(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }
  TL3.HOVER = { gap: 30, day: 3.8, mon: 3.47, slow: .15, floor: .75 };   // matched to pengzhe.ng's strip click: a day tick is within 1 dB of theirs both K-weighted (BS.1770) and A-weighted
  TL3.cue = function (kind, o) {
    if (!on() || !primed) return;
    if (kind === 'hover' || kind === 'hover2') {
      var H = TL3.HOVER, n = performance.now(); if (n - lastHover < H.gap) return; lastHover = n;
      var cc = ac(); if (!cc) return; var tt = cc.currentTime + .002;
      var gv = Math.max(H.floor, Math.min(1, 1 - ((o && o.vel) || 0) * H.slow));     // vel in px/ms: 0 → full, ≥1.7 px/ms → 75% (a fling stays audible)
      if (kind === 'hover2') { burst(cc, tt, .005, 3400, 7, H.mon * gv, null, .11); tone(cc, tt, 1700, 1200, .005, H.mon * .092 * gv); }
      else burst(cc, tt, .004, 4200, 8, H.day * gv, null, .06);
      return;
    }
    var c = ac(); if (!c) return; var t = c.currentTime + .004, now = performance.now();
    if (kind === 'tick' || kind === 'tick2') {
      if (now - lastTick < 32) return; lastTick = now;   // a fast scrub never buzzes: at most ~30 a second
      if (kind === 'tick') { burst(c, t, .008, 3000, 6, 2.46, null, 0); tone(c, t, 1900, 1100, .008, 2.46 * .125); vib(3); }
      else burst(c, t, .006, 3600, 7, 2.95, null, .02);   // a day crossed while scrubbing: level with a hover, a month a touch firmer
    } else if (kind === 'open') { burst(c, t, .09, 900, .8, .05, 'lowpass'); tone(c, t, 240, 160, .06, .03); vib(5); }
    else if (kind === 'close') { burst(c, t, .06, 760, .8, .04, 'lowpass'); }
    else if (kind === 'land') { burst(c, t, .012, 1800, 4, .12); tone(c, t, 620, 380, .03, .03); vib(6); }
  };
  TL3.bindSound = function (btn) {
    function paint() { var o = on(), ja = TL.lang() === 'ja'; btn.textContent = o ? (ja ? '音：オン' : 'Sound · on') : (ja ? '音：オフ' : 'Sound · off'); btn.setAttribute('aria-pressed', String(o)); }
    btn.addEventListener('click', function () { try { localStorage.setItem(KEY, on() ? 'off' : 'on'); } catch (e) {} paint(); if (on()) { primed = true; ac(); TL3.cue('land'); } });
    TL.onLang(paint); paint();
  };
})();
