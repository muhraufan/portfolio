/* Peek & land. One scroll-tied moment:
   the postcard is laid down on the desk while the content under it rises and lands.
   - progress p = scrollY / snapY (0 at top, 1 when the intro has landed)
   - one spring follows p for the card (tilt/scale/fade); a second, stiffer spring carries the
     content's last few px home as the detent comes to rest, so the card leaving and the content
     landing read as one beat. Position always stays native scroll.
   - detent = direction-aware settle after scrolling has fully stopped inside the hero zone;
     never during input, never below the landing, cancelled by any wheel/touch/key/pointer.
   - transform/opacity only (+ a quantised whisper of blur on the peeking lines). */
(function () {
  'use strict';
  var html = document.documentElement;
  var hero = document.querySelector('.pc-hero');
  if (!hero) return;
  var card = hero.querySelector('.pc-card');
  var cap = hero.querySelector('.ls-caption');

  // Tuning A, "Desk": the approved landing.
  var T = { name: 'Desk', tilt: 10, scale: 0.955, lift: 8, k: 520, zeta: 0.84, origin: '50% 100%', blur: 0.75, stay: 0.28, done: 0.68, ck: 900, cz: 0.78, cat: 0.62 };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var panel = null, land = null, soft = [], snapY = 0, enabled = false, marginFor = null;
  /* v2: no overlay. The peeking content itself is alpha-masked, so it dissolves into whatever is
     really behind it (any light, any gradient, mid view-transition) with no film and no edge.
     v1 painted a band in the body colour read at measure time; the body transitions its background
     for 200ms, so after a light change it froze a mid-transition grey over the night/golden paper. */
  var FADE_PX = 200, BLUR_PX = 110;          // the fade clears over the first 200px, the blur over 110
  var BAND = 150, FLOOR = 0.04;              // band height (px) and the alpha at the very bottom edge
  var bandBottom = 0, lastMask = -1;
  var s = 0, v = 0, last = 0, raf = 0, lastBlur = -1, lastCap = -1, lastGhost = -1, lastHold = false, cy = 0, cvel = 0, settleProg = -1, settleLift0 = 0;

  function docTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  function clearStyles() {
    [card, cap, panel].forEach(function (el) { if (el) { el.style.transform = ''; el.style.opacity = ''; } });
    card.style.pointerEvents = ''; card.style.visibility = ''; card.style.transformOrigin = '';
    soft.forEach(function (el) { el.style.filter = ''; el.style.opacity = ''; el.classList.remove('peek-soft'); });
    if (panel) { panel.style.willChange = ''; setMask(null); }
  }

  function measure() {
    clearStyles();
    panel = document.querySelector('.m-profile-panel.is-active:not([hidden])');
    land = panel && panel.firstElementChild;
    soft = [];
    if (!panel || !land || hero.classList.contains('is-photo')) { enabled = false; off(); return; }
    var vh = window.innerHeight;
    // the landing margin is fixed per width, so a phone toolbar collapsing mid-scroll can't move the target
    if (!marginFor || marginFor.w !== window.innerWidth) marginFor = { w: window.innerWidth, m: Math.round(Math.max(64, Math.min(112, vh * 0.11))) };
    var margin = marginFor.m;
    html.style.setProperty('--peek-land', margin + 'px');
    snapY = docTop(land) - margin;
    enabled = snapY > 120;
    if (!enabled) { off(); return; }
    // whatever sits in the bottom band at the top of the page is "peeking"
    var veilH = window.innerWidth <= 600 ? 128 : BAND;
    bandH = veilH;
    bandBottom = vh - docTop(panel);   // the viewport's bottom edge, in the panel's own coordinates (at scroll 0)
    for (var el = land; el; el = el.nextElementSibling) {
      var t = docTop(el);
      if (t >= vh) break;
      // only blocks that *begin* inside the band get the whisper of blur; a paragraph you can
      // already read just fades at its last line, it never goes soft
      if (t > vh - veilH - 8) { soft.push(el); el.classList.add('peek-soft'); }
    }
    panel.style.willChange = 'transform'; // inline, not a class: the panels' class list is observed for persona switches
    html.classList.add('peek-on');
    card.style.transformOrigin = T.origin;
    if (settleRaf && settleTo > 0) settleTo = snapY;   // re-aim a settle that's in flight
    s = target(); v = 0; cy = liftTarget(); cvel = 0; lastBlur = -1; lastCap = -1; lastGhost = -1; lastMask = -1;
    render();
  }

  function off() {
    html.classList.remove('peek-on');
    setMask(null);
    if (lastHold && window.LastSeen && LastSeen._hold) { lastHold = false; LastSeen._hold(false); }
    cancelSettle();
  }

  // while the card is turned over for a note, it stays a card: no tilt, no fade (mobile scrolls the
  // field into view when the keyboard opens, and the card must not dissolve under your thumb)
  function target() { return card.classList.contains('is-flipped') ? 0 : clamp(window.scrollY / snapY); }

  /* where the content wants to sit, in px below its place.
     Scrolling by hand: it rises its last T.lift px over the final 30% of the way (a quiet parallax).
     Arriving on the detent: it waits, then clicks the last few px home just as the page comes to
     rest (T.cat of the settle) on a stiff, low-bounce spring. That beat is the landing. */
  function liftTarget() {
    var p = target();
    if (settleProg >= 0 && settleTo > settleFrom) return settleProg < T.cat ? settleLift0 : 0;
    return T.lift * (1 - clamp((p - 0.7) / 0.3));
  }

  /* ---------- the detent ----------
     Native scroll-snap snaps to the *nearest* point when a gesture ends, so a 200px scroll down
     gets pulled back to the top, and past the landing it keeps tugging. Instead: once scrolling
     has fully stopped (no wheel, no finger, no key for IDLE ms) inside the hero zone, finish the
     move in the direction the visitor was already going. Any input cancels it instantly. */
  var IDLE = 110, INTENT = 48, INTENT_UP = 120, dir = 0, lastY = window.scrollY, idleT = 0, touching = false, lastInput = 0, lastKey = 0, lastFocus = 0;
  var settleRaf = 0, settleTo = 0, settleFrom = 0, settleT0 = 0, settleDur = 0, settleY = -1;
  function cancelSettle() { settleProg = -1; if (settleRaf) { cancelAnimationFrame(settleRaf); settleRaf = 0; settleY = -1; } }
  function userInput(e) { lastInput = performance.now(); cancelSettle(); if (e && e.type === 'keydown') lastKey = lastInput; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3.2); } /* short, decisive, no ease-in */
  function settleStep(now) {
    if (!settleT0) settleT0 = now;
    // somebody else moved the page (scrollbar drag, find-in-page): let go
    if (settleY >= 0 && Math.abs(window.scrollY - settleY) > 2) { settleRaf = 0; settleY = -1; settleProg = -1; return; }
    var t = Math.min(1, (now - settleT0) / settleDur);
    settleProg = t;
    var y = Math.round(settleFrom + (settleTo - settleFrom) * easeOut(t));
    settleY = y; window.scrollTo(0, y);
    if (t < 1) settleRaf = requestAnimationFrame(settleStep); else { settleRaf = 0; settleY = -1; settleProg = -1; }
  }
  function maybeSettle() {
    idleT = 0;
    if (!enabled || reduce.matches || touching || settleRaf) return;
    var now = performance.now();
    if (now - lastInput < IDLE) { idleT = setTimeout(maybeSettle, IDLE); return; }
    if (now - lastFocus < 600) return;                                   // keyboard focus moved the page: leave it
    if (card.classList.contains('is-flipped') || hero.contains(document.activeElement) && document.activeElement.matches('input,textarea,[contenteditable]')) return;
    var y = window.scrollY;
    if (y <= 0 || y >= snapY - 1) return;
    // down: a small push is enough (the visitor asked for more). Up: a reader nudging back a line
    // or two stays with the content; only a deliberate pull returns to the postcard. Keys always count.
    var keyed = now - lastKey < 1200, to;
    if (dir > 0) to = y >= (keyed ? 1 : INTENT) ? snapY : 0;
    else to = (snapY - y) >= (keyed ? 1 : INTENT_UP) ? 0 : snapY;
    var dist = Math.abs(to - y);
    settleFrom = y; settleTo = to; settleT0 = 0; settleY = -1;
    settleDur = Math.max(240, Math.min(460, 200 + dist * 0.45));
    settleLift0 = T.lift * (1 - clamp((y / snapY - 0.7) / 0.3));
    settleProg = 0;
    settleRaf = requestAnimationFrame(settleStep);
    kick();
  }
  function onScroll() {
    var y = window.scrollY;
    if (!settleRaf && y !== lastY) dir = y > lastY ? 1 : -1;
    lastY = y;
    if (settleRaf) return;
    clearTimeout(idleT); idleT = setTimeout(maybeSettle, IDLE);
  }

  /* the mask: opaque above the band, then a smooth ease-in-out (cosine) alpha curve over 12 stops down
     to FLOOR at the viewport's bottom edge, FLOOR below it. As you scroll the whole curve lifts toward
     opaque (k), quantised to 1/24 so the mask is only rebuilt ~24 times. */
  var bandH = BAND;
  function setMask(k) {
    if (!panel) return;
    if (k === null || k >= 1 || bandBottom <= 0) {
      if (lastMask !== 1) { panel.style.webkitMaskImage = panel.style.maskImage = ''; lastMask = 1; }
      return;
    }
    if (k === lastMask) return;
    lastMask = k;
    var top = bandBottom - bandH, stops = ['#000 0px', '#000 ' + Math.max(0, top).toFixed(1) + 'px'], N = 12;
    for (var i = 1; i <= N; i++) {
      var t = i / N, ease = 0.5 - 0.5 * Math.cos(Math.PI * t);      // ease-in-out: no visible start, no hard floor
      var a = 1 - (1 - FLOOR) * ease;
      a = a + (1 - a) * k;
      stops.push('rgba(0,0,0,' + a.toFixed(3) + ') ' + (top + bandH * t).toFixed(1) + 'px');
    }
    var f = (FLOOR + (1 - FLOOR) * k).toFixed(3);
    stops.push('rgba(0,0,0,' + f + ') 100%');
    var g = 'linear-gradient(to bottom,' + stops.join(',') + ')';
    panel.style.webkitMaskImage = g; panel.style.maskImage = g;
  }

  function render() {
    var p = target();
    var still = reduce.matches;
    var e = still ? p : s;
    // fade + blur read raw scroll: they're about legibility, not weight
    var y = window.scrollY;
    setMask(Math.round(clamp(y / FADE_PX) * 24) / 24);
    // on dark lights a blur smears text into a grey glow, so night sinks into the dark with no blur
    var dark = html.getAttribute('data-theme') === 'dark';
    var b = (dark ? 0 : T.blur) * (1 - clamp(y / BLUR_PX));
    b = Math.round(b * 4) / 4;
    if (b !== lastBlur) {
      lastBlur = b;
      for (var i = 0; i < soft.length; i++) soft[i].style.filter = b > 0 ? 'blur(' + b + 'px)' : '';
    }
    // the hero finishes leaving at T.done of the range, so it's gone before the content arrives
    var h = clamp(e / T.done);
    var o = 1 - Math.pow(clamp((h - 0.08) / 0.92), 1.35);
    card.style.opacity = o.toFixed(3);
    // a card that's mostly gone shouldn't catch clicks meant for the content now over it
    var ghost = o < 0.4 ? (o <= 0.001 ? 2 : 1) : 0;
    // a mostly-faded card doesn't need its ambient loop; the drawn frame stays as it is
    var rest = o < 0.5 && !still;
    if (rest !== lastHold && window.LastSeen && LastSeen._hold) { lastHold = rest; LastSeen._hold(rest); }
    if (ghost !== lastGhost) { lastGhost = ghost; card.style.pointerEvents = ghost ? 'none' : ''; card.style.visibility = ghost === 2 ? 'hidden' : ''; }
    // the caption is text: quantised to 1/10 steps it repaints ~10 times per exit instead of every frame
    var co = Math.round((1 - clamp(h / 0.45)) * 10) / 10;
    if (cap && co !== lastCap) { lastCap = co; cap.style.opacity = co === 1 ? '' : String(co); }
    if (still) { card.style.transform = ''; panel.style.transform = ''; return; }
    // the card is laid down where it is: it holds back a little (raw scroll, so it never floats),
    // tips its top edge away and settles smaller
    var hold = T.stay * snapY * p;  // raw progress (never floats); 0 while the card is flipped
    var hk = 1 - Math.pow(1 - h, 2);  // out-quad: the tilt starts the moment you move
    var tilt = T.tilt * hk, sc = 1 - (1 - T.scale) * hk;
    card.style.transform = 'translate3d(0,' + hold.toFixed(1) + 'px,0) perspective(1100px) rotateX(' + tilt.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
    // content starts T.lift below its place and rises into it; the spring gives the landing its weight
    var lift = still ? 0 : cy;
    panel.style.transform = Math.abs(lift) < 0.01 ? '' : 'translate3d(0,' + lift.toFixed(2) + 'px,0)';
  }

  function tick(now) {
    raf = 0;
    if (!enabled) return;
    var dt = Math.min(0.032, Math.max(0.001, (now - (last || now)) / 1000 || 0.016));
    last = now;
    var p = target();
    if (reduce.matches) { s = p; v = 0; cy = 0; cvel = 0; }
    else {
      var c = 2 * T.zeta * Math.sqrt(T.k);
      // two half-steps keep the spring stable on janky frames
      var lt = liftTarget(), cc = 2 * T.cz * Math.sqrt(T.ck);
      for (var i = 0; i < 2; i++) { var h = dt / 2; v += (T.k * (p - s) - c * v) * h; s += v * h; cvel += (T.ck * (lt - cy) - cc * cvel) * h; cy += cvel * h; }
    }
    render();
    var lt2 = liftTarget();
    var resting = Math.abs(p - s) < 0.0005 && Math.abs(v) < 0.002 && Math.abs(lt2 - cy) < 0.02 && Math.abs(cvel) < 0.05 && settleProg < 0;
    if (resting) { s = p; v = 0; cy = lt2; cvel = 0; render(); last = 0; return; }
    raf = requestAnimationFrame(tick);
  }

  function kick() {
    if (!enabled) return;
    if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
  }

  window.addEventListener('scroll', function () { kick(); if (enabled) onScroll(); }, { passive: true });
  window.addEventListener('wheel', userInput, { passive: true });
  window.addEventListener('keydown', userInput);
  window.addEventListener('pointerdown', userInput, { passive: true });
  window.addEventListener('touchstart', function (e) { touching = true; userInput(e); }, { passive: true });
  window.addEventListener('touchend', function () { touching = false; lastInput = performance.now(); }, { passive: true });
  window.addEventListener('touchcancel', function () { touching = false; }, { passive: true });
  document.addEventListener('focusin', function () { lastFocus = performance.now(); });
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { measure(); kick(); }, 120); });
  if (reduce.addEventListener) reduce.addEventListener('change', function () { measure(); kick(); });
  // persona switch / photo mode changes the panel and the hero
  new MutationObserver(function () { clearTimeout(rt); rt = setTimeout(function () { measure(); kick(); }, 60); })
    .observe(html, { attributes: true, attributeFilter: ['data-tod', 'data-theme', 'data-lang'] });
  new MutationObserver(function () { clearTimeout(rt); rt = setTimeout(function () { measure(); kick(); }, 60); })
    .observe(hero, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(function () { kick(); }).observe(card, { attributes: true, attributeFilter: ['class'] });
  document.querySelectorAll('.m-profile-panel').forEach(function (pn) {
    new MutationObserver(function () { clearTimeout(rt); rt = setTimeout(function () { measure(); kick(); }, 60); })
      .observe(pn, { attributes: true, attributeFilter: ['class', 'hidden'] });
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); kick(); });
  window.addEventListener('load', function () { measure(); kick(); });
  measure();
})();
