/* Guestbook sound: one cue, the shuffle. Synthesized like the Timeline's feel.js — a soft riffle of paper edges
   that slows as the deck closes, then one low tap as the cards land. Quiet, ~300ms, only ever inside a click
   (so the browser's audio lock is already open), and it honours the site's sound switch ('tl-feedback'). */
(function () {
  var ctx = null, master = null, noiseBuf = null;
  function on() { try { return localStorage.getItem('tl-feedback') !== 'off'; } catch (e) { return true; } }
  function ac() {
    if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); master = ctx.createGain(); master.gain.value = .5; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume(); return ctx;
  }
  function noise(c) { if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate * .25, c.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return noiseBuf; }
  function burst(c, t, dur, f, q, g, type) {
    var s = c.createBufferSource(), bp = c.createBiquadFilter(), v = c.createGain();
    s.buffer = noise(c); bp.type = type || 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    v.gain.setValueAtTime(.0001, t); v.gain.exponentialRampToValueAtTime(g, t + .002); v.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(bp); bp.connect(v); v.connect(master); s.start(t, Math.random() * .2); s.stop(t + dur + .02);
  }
  window.GSound = {
    count: 0,
    riffle: function () {
      if (!on()) return; var c = ac(); if (!c) return; var t = c.currentTime + .01, gap = .016;
      for (var i = 0; i < 11; i++) {                   // edges flicking past: a touch brighter and denser at first
        burst(c, t, .012 + i * .001, 2600 - i * 90 + Math.random() * 300, 1.4, .07 - i * .004);
        t += gap; gap *= 1.09;
      }
      burst(c, t + .05, .07, 520, .7, .075, 'lowpass');   // the deck lands
      this.count++;
    }
  };
})();
