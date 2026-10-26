/* Timeline — the day rail. Sparse calendar-ruler spacing, the exit stretch, and a per-character caption.
   One quiet vertical ruler: a short tick per visited day, a longer one per month, spaced by time with a floor so busy weeks stay grabbable.
   Hover wakes it: ticks near the pointer swell (raised-cosine falloff), the nearest one snaps to ink, and a caption rides beside it
   on a critically damped spring, its text blur-crossfading in the direction of travel. Click travels the list to that day;
   drag scrubs tick to tick with a ratchet; a still press (350ms) opens a day ruler at the press point to pick precisely.
   Notes on the two references this is tuned against: REFERENCE.md. */
(function () {
  var html = document.documentElement, TL3 = window.TL3, TL2 = window.TL2, L = TL3.L, months = L.months, P = L.P;
  var mode = html.dataset.jump; if (mode !== 'rail' && mode !== 'ticks') return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)'), say = document.querySelector('.t3-say');
  function ja() { return TL.lang() === 'ja'; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ---------------- tuning (all in one place; px unless noted) ----------------
  var K = TL3.RAIL = {
    gap: 4,                         // minimum spacing between day ticks
    dayLen: 6, monLen: 12, maxLen: 34, // rest lengths; each tick is maxLen wide and clipped to its length from the inner (right) edge, round-capped
    thick: 1.5,                     // tick thickness in css px, snapped to whole device pixels (2 device px minimum)
    wakeScale: 1.2,                 // hovering makes the whole rail a little bigger: every tick ×1.2 from its inner edge
    bumpDay: 12, bumpMon: 8,        // extra length at the pointer, falling off over `radius`
    focusDay: 24, focusMon: 26,     // the snapped tick (before the wake scale); it is also 1px thicker than the rest
    radius: 44, radiusTouch: 56,
    aDay: .26, aMon: .46, aWake: .08, aBump: .36,  // ink alpha
    wakeK: 520, wakeZ: 1,           // wake spring (stiffness, damping ratio)
    focusK: 1600, focusZ: 1,        // magnification centre follows the pointer
    capK: 1100, capZ: 1,            // caption follows the snapped tick: critically damped, no wobble
    hdK: 700, hdZ: 1,               // the handle follows the page
    hold: 350, slop: 4,             // long-press threshold (ms) and how far a press may wander before it is a drag
    chIn: 200, chOut: 170, chShift: 5, chBlur: [2, 3], chStagger: 15,   // per-character caption change
    wordIn: 220, wordOut: 170,      // the place name: whole-word blur crossfade
    capEnter: 160, capExit: 300, capLetGo: 140,   // let go by the exit stretch, the caption leaves quicker, out of the pointer's way
    // exit stretch: the hover swell relaxes the moment the pointer leaves (relaxK); what is left is a directional pull from one point —
    // the snapped tick and a tight falloff of neighbours (pullW, by tick index) extend toward the pointer's side only, the other end anchored
    relaxK: 1500, stretchMax: 10, stretchLambda: 24, release: 56, pullW: [1, .55, .25, .08],
    followK: 900, followZ: 1, backK: 1100, backZ: .72,                  // following the pull / snapping home (~200ms, ≤3% overshoot)
    capGap: 14,                     // the caption keeps this far left of a pointer that has wandered over it
    dayPitch: 6, dayPitchMin: 4, emptyLen: 4, aEmpty: .1, placeLen: 8, aPlace: .36, maxStep: 18,   // short ranges: one tick per calendar day at a fixed pitch; days without places are paler
    hoverTickGap: 30,               // hover ratchet: at most one click per 30ms
    pitch: 28, pitchTouch: 36, rulerRows: 11
  };

  // ---------------- data: one entry per visited day, newest first ----------------
  var D = [], MS = [];
  function buildData() {
    D = []; MS = [];
    months.forEach(function (M) { M.days.forEach(function (Dy) { D.push({ M: M, D: Dy, t: Date.UTC(M.y, M.m - 1, Dy.d), p: Dy.list[0] }); }); });
    D.forEach(function (x, k) { x.k = k; });
    // every calendar month from the newest to the oldest (months with no places still get their long tick)
    var y = months[0].y, m = months[0].m, last = months[months.length - 1];
    while (y > last.y || (y === last.y && m >= last.m)) { MS.push({ y: y, m: m, t: Date.UTC(y, m - 1, 1) }); if (--m < 1) { m = 12; y--; } }
  }
  function dayText(x) { var a = x.p.at; return ja() ? a.m + '月' + L.dayLabel(a) : L.dayLabel(a) + ' ' + TL2.mon(a.m) + (a.y !== P[0].at.y ? ' ' + a.y : ''); }
  function dayNote(x) { return x.D.list.length > 1 ? L.count(x.D.list.length) : TL2.s(x.p.name); }
  function fullText(x) { return TL2.fullDate(x.M.y, x.M.m, x.D.d) + ', ' + dayNote(x); }

  // ---------------- elements ----------------
  var rail = document.createElement('div'); rail.className = 't3-rail'; rail.tabIndex = 0;
  rail.setAttribute('role', 'slider'); rail.setAttribute('aria-orientation', 'vertical'); rail.setAttribute('aria-valuemin', '0');
  var hd = document.createElement('i'); hd.className = 't3-hd';
  var cap = document.createElement('div'); cap.className = 't3-cap'; cap.setAttribute('aria-hidden', 'true');
  cap.innerHTML = '<span class="t3-cbw"><i class="t3-cbg"></i></span><span class="t3-cd"></span><span class="t3-cp"></span><span class="t3-cm" aria-hidden="true"></span>';
  var capBgW = cap.children[0], capBg = capBgW.firstChild, capDate = cap.children[1], capPlace = cap.children[2], capMeasure = cap.children[3];
  var ruler = document.createElement('div'); ruler.className = 't3-ru'; ruler.hidden = true; ruler.setAttribute('aria-hidden', 'true');
  ruler.innerHTML = '<div class="t3-ru-in"></div>';
  var ruIn = ruler.firstChild, ruX = document.createElement('i'); ruX.className = 't3-ru-x'; ruX.hidden = true;   // the crosshair: a hairline from the picked day to the rail
  document.body.appendChild(rail); document.body.appendChild(cap); document.body.appendChild(ruler); document.body.appendChild(ruX);
  var oldTicks = document.querySelector('.t3-ticks'); if (oldTicks) oldTicks.hidden = true;

  var ticks = [], mticks = [], cticks = [], years = [];
  function buildRail() {
    buildData();
    rail.innerHTML = ''; cticks = [];
    ticks = D.map(function (x) { var e = document.createElement('i'); e.className = 't3-rt'; rail.appendChild(e); return e; });
    mticks = MS.map(function (m) { var e = document.createElement('i'); e.className = 't3-rt is-m'; rail.appendChild(e); return e; });
    years = [];      // each year's label sits just below where that year begins (reading down = going back in time)
    var addY = function (y, i) { var e = document.createElement('span'); e.className = 't3-yr'; e.textContent = y; rail.appendChild(e); years.push({ i: i, el: e }); };
    addY(MS[0].y, -1); MS.forEach(function (m, i) { if (m.m === 1 && i < MS.length - 1) addY(m.y - 1, i); });
    rail.appendChild(hd);
    rail.setAttribute('aria-valuemax', String(D.length - 1));
    rail.setAttribute('aria-label', ja() ? '日へ移動。長押しで日付の定規' : 'Jump to a day. Press and hold for a day ruler');
  }

  // ---------------- geometry ----------------
  var G = { side: 'margin', top: 0, h: 0, right: 0, ys: [], ms: [], touch: false };
  function viewW() { return document.documentElement.offsetWidth || document.documentElement.clientWidth; }   // fixed boxes are laid out in offsetWidth; clientWidth still includes the scrollbar gutter
  function layout() {
    setThick();
    var col = document.getElementById('t3-list').getBoundingClientRect(), W = viewW();
    G.touch = matchMedia('(pointer: coarse)').matches;
    G.side = (col.left >= 280 && !G.touch && W > 600) ? 'margin' : 'edge';
    html.dataset.rail = G.side;
    var top = L.barH() + L.mhH() + 8, bottom = innerHeight - (W <= 600 ? 72 : 80), avail = Math.max(120, bottom - top), n = D.length, k, y = 0;
    G.top = top;
    G.right = G.side === 'margin' ? Math.round(col.left - 56) : W - 6;      // the ticks' inner (right) edge; they grow leftwards
    // short ranges: a calendar ruler at a fixed pitch, one tick per day, as tall as its content and anchored at the top
    var DAY = 864e5, t0 = D[0].t, t1 = MS[MS.length - 1].t, days = Math.round((t0 - t1) / DAY) + 1;
    G.fixed = (days - 1) * K.dayPitchMin <= avail;
    if (G.fixed) {
      G.pitch = days > 1 ? clamp(Math.floor(avail / (days - 1) * dpr) / dpr, K.dayPitchMin, K.dayPitch) : K.dayPitch; G.h = (days - 1) * G.pitch;   // whole device pixels, so every gap is identical
      G.ys = D.map(function (x) { return Math.round((t0 - x.t) / DAY) * G.pitch; });
      var placeDay = {}; D.forEach(function (x) { placeDay[x.t] = 1; });
      G.cs = []; for (k = 0; k < days; k++) if (!placeDay[t0 - k * DAY]) G.cs.push(k * G.pitch);
      G.ms = MS.map(function (m) { return Math.round((t0 - m.t) / DAY) * G.pitch + G.pitch / 2; });   // between the 1st and the day before it
    } else {
      // long ranges: each step is max(floor, α·Δt), α solved so the steps fill the rail: busy weeks sit at the floor, quiet stretches open up in proportion
      // steps are also capped (maxStep) so a long quiet stretch never opens a hole; the rail is then only as tall as its content
      G.pitch = 0; G.h = avail; G.cs = [];
      var gap = Math.min(K.gap, G.h / Math.max(1, n - 1)), dts = [], cap = K.maxStep;
      if ((n - 1) * cap < G.h) G.h = Math.max(0, (n - 1) * cap);
      for (k = 1; k < n; k++) dts.push(D[k - 1].t - D[k].t);
      var stp = function (al, dt) { return Math.min(cap, Math.max(gap, al * dt)); }, fill = function (al) { var s = 0; for (var i = 0; i < dts.length; i++) s += stp(al, dts[i]); return s; }, lo = 0, hi = 1;
      while (fill(hi) < G.h - .5 && hi < 1e6) hi *= 2;
      for (var it = 0; it < 40; it++) { var mid = (lo + hi) / 2; if (fill(mid) < G.h) lo = mid; else hi = mid; }
      G.ys = [0]; for (k = 0; k < dts.length; k++) { y += stp(hi, dts[k]); G.ys.push(y); }
      G.h = y;
      G.ms = MS.map(function (m) {      // month starts: interpolate between the days around them so order always agrees
        var t = m.t; if (t >= D[0].t) return -gap; if (t <= D[n - 1].t) return G.ys[n - 1] + gap;
        for (var k = 1; k < n; k++) if (D[k].t <= t) { var f = (D[k - 1].t - t) / Math.max(1, D[k - 1].t - D[k].t); return G.ys[k - 1] + (G.ys[k] - G.ys[k - 1]) * f; }
        return 0;
      });
      G.ms = G.ms.map(function (v) { return clamp(v, -6, G.h + 6); });
    }
    html.dataset.railFit = G.fixed ? 'days' : 'time';
    while (cticks.length < G.cs.length) { var e = document.createElement('i'); e.className = 't3-rt is-e'; rail.insertBefore(e, rail.firstChild); cticks.push(e); }
    while (cticks.length > G.cs.length) cticks.pop().remove();
    rail.style.top = top - 12 + 'px'; rail.style.height = G.h + 24 + 'px';
    rail.style.left = (G.right - 44 + 6) + 'px';                               // a 44px hit area whose right edge sits 6px past the ticks
    // year labels: the newest year sits level with the top tick; each earlier one just below the January tick where it ends
    years.forEach(function (Y) { Y.y = Y.i < 0 ? 0 : G.ms[Y.i] + 10; Y.el.style.transform = 'translate(0,' + (12 + Y.y).toFixed(1) + 'px)'; });
    paint(true);
  }
  function nearest(clientY) {          // binary search over the tick positions
    var y = clientY - G.top, a = 0, b = G.ys.length - 1;
    if (y <= G.ys[0]) return 0; if (y >= G.ys[b]) return b;
    while (b - a > 1) { var m = (a + b) >> 1; if (G.ys[m] <= y) a = m; else b = m; }
    return (y - G.ys[a] <= G.ys[b] - y) ? a : b;
  }
  function tickClientY(k) { return G.top + G.ys[k]; }

  // ---------------- springs (critically damped by default; snap when reduced) ----------------
  function Spr(k, z, v0) { return { x: v0, v: 0, to: v0, k: k, z: z }; }
  function step(s, dt) {
    if (reduce.matches) { s.x = s.to; s.v = 0; return false; }
    var c = 2 * s.z * Math.sqrt(s.k), a = -s.k * (s.x - s.to) - c * s.v; s.v += a * dt; s.x += s.v * dt;
    if (Math.abs(s.x - s.to) < 0.01 && Math.abs(s.v) < 0.01) { s.x = s.to; s.v = 0; return false; }
    return true;
  }
  var wake = Spr(K.wakeK, K.wakeZ, 0), fy = Spr(K.focusK, K.focusZ, 0), cy = Spr(K.capK, K.capZ, 0), hy = Spr(K.hdK, K.hdZ, 0), press = Spr(90, 1, 0);   // slow on purpose: the snapped tick stretches through the hold
  var sx = Spr(K.followK, K.followZ, 0), sy = Spr(K.followK, K.followZ, 0), cxs = Spr(K.followK, K.followZ, 0);   // the exit stretch, and the caption stepping aside for the pointer

  // ---------------- state ----------------
  var S = { pullK: -1, zone: false, over: false, k: -1, cur: 0, focusOn: false, mode: null, pid: null, x0: 0, y0: 0, t0: 0, holdT: 0, lastY: 0, lastT: 0, vel: 0, sleepT: 0, capShown: false, ruler: null };
  TL3.railCues = 0;

  // ---------------- drawing ----------------
  var raf = 0, lastNow = 0;
  function kick() { if (!raf) { lastNow = performance.now(); raf = requestAnimationFrame(frame); } }
  function advance(ms) {     // QA: step the springs by exact 60fps frames (used with TL3.railTimeScale = 0 to film frame by frame)
    for (var t = 0; t < ms - .01; t += 1000 / 60) { step(wake, 1 / 60); step(fy, 1 / 60); step(cy, 1 / 60); step(hy, 1 / 60); step(press, 1 / 60); step(sx, 1 / 60); step(sy, 1 / 60); step(cxs, 1 / 60); }
    paint(false);
  }
  function frame(now) {
    raf = 0; var dt = clamp((now - lastNow) / 1000, 0, 0.032) * (TL3.railTimeScale === undefined ? 1 : TL3.railTimeScale); lastNow = now;
    var moving = step(wake, dt); moving = step(fy, dt) || moving; moving = step(cy, dt) || moving; moving = step(hy, dt) || moving; moving = step(press, dt) || moving; moving = step(sx, dt) || moving; moving = step(sy, dt) || moving; moving = step(cxs, dt) || moving;
    paint(false);
    if (moving) kick();
  }
  var dpr = 1, th = 1.5;
  function snap(v) { return Math.round(v * dpr) / dpr; }
  function setThick() { dpr = window.devicePixelRatio || 1; th = Math.max(2, Math.round(K.thick * dpr)) / dpr; rail.style.setProperty('--th', th + 'px'); }
  var PS = { extL: 0, extR: 0 };     // QA: the largest pull applied this frame on each side
  var RW = 14;                       // room on the inner side so a tick can lean right without moving its outer end
  function paint() {
    var w = wake.x, R = G.touch ? K.radiusTouch : K.radius, f = fy.x - G.top, i, d, b, len, a, sc = 1 + (K.wakeScale - 1) * w;
    var px = sx.x, py = sy.x, pk = S.pullK, WW = K.maxLen + RW;
    PS.extL = 0; PS.extR = 0;
    function wt(i) { if (pk < 0 || (Math.abs(px) < .01 && Math.abs(py) < .01)) return 0; var dd = Math.abs(i - pk); return dd < K.pullW.length ? K.pullW[dd] : 0; }
    function put(el, y, len, a, fat, eL, eR, oy) {     // length by clip (true round caps at any length, no layout), position by transform, snapped to device pixels
      var t = fat ? th + 1 : th;
      if (el._t !== t) { el._t = t; el.style.height = t + 'px'; }
      el.style.transform = 'translate(0,' + snap(12 + y + (oy || 0) - t / 2) + 'px)';
      el.style.clipPath = 'inset(0 ' + (RW - (eR || 0)).toFixed(2) + 'px 0 ' + (WW - RW - len - (eL || 0)).toFixed(2) + 'px round ' + (t / 2) + 'px)';
      el.style.opacity = a.toFixed(3);
    }
    for (i = 0; i < cticks.length; i++) {      // calendar days without places (short ranges only)
      d = Math.abs(G.cs[i] - f); b = d < R ? (1 + Math.cos(Math.PI * d / R)) / 2 * w : 0;
      put(cticks[i], G.cs[i], (K.emptyLen + K.bumpDay * b * .5) * sc, K.aEmpty + K.aWake * w * .5 + K.aBump * b * .35);
    }
    for (i = 0; i < ticks.length; i++) {
      d = Math.abs(G.ys[i] - f); b = d < R ? (1 + Math.cos(Math.PI * d / R)) / 2 * w : 0;
      len = ((G.fixed ? K.placeLen : K.dayLen) + K.bumpDay * b) * sc; a = (G.fixed ? K.aPlace : K.aDay) + K.aWake * w + K.aBump * b;   // on the calendar ruler the days with places stand out from the empty ones
      if (i === S.k && S.focusOn) { len = (K.focusDay + 6 * press.x) * sc; a = 1; }
      if (S.ruler && Math.abs(G.ys[i] - (S.ruler.cy - G.top)) < S.ruler.half) a *= 0.15;       // the ruler takes over this stretch
      var p = wt(i), eL = px < 0 ? -px * p : 0, eR = px > 0 ? px * p : 0;
      if (eL > PS.extL) PS.extL = eL; if (eR > PS.extR) PS.extR = eR;
      put(ticks[i], G.ys[i], Math.min(K.maxLen, len), a, i === S.k && S.focusOn, eL, eR, py * p);
    }
    for (i = 0; i < mticks.length; i++) {
      d = Math.abs(G.ms[i] - f); b = d < R ? (1 + Math.cos(Math.PI * d / R)) / 2 * w : 0;
      len = (K.monLen + K.bumpMon * b) * sc; a = K.aMon + K.aWake * w + K.aBump * b * .6;
      if (S.ruler && Math.abs(G.ms[i] - (S.ruler.cy - G.top)) < S.ruler.half) a *= 0.15;
      put(mticks[i], G.ms[i], Math.min(K.maxLen, len), a);
    }
    hd.style.transform = 'translate(0,' + snap(12 + hy.x - G.top - 1) + 'px)';
    hd.style.opacity = (S.focusOn && S.k === S.cur) || S.ruler ? 0 : 1;
    if (S.capShown) placeCap();
    for (i = 0; i < years.length; i++) {      // a year label steps aside for the caption or the ruler
      var yy = G.top + years[i].y, hide = (S.capShown && Math.abs(yy - cy.x) < 30) || (S.ruler && Math.abs(yy - S.ruler.cy) < S.ruler.half + 8);
      if (years[i].hid !== hide) { years[i].hid = hide; years[i].el.style.opacity = hide ? 0 : ''; }
    }
  }

  // ---------------- caption: two right-aligned lines riding the snapped tick ----------------
  // Line 1, the date, is split into character slots indexed from the right, so the end of the date sits still against the rail.
  // When the value changes only the slots whose character changed move: the old glyph slides 5px against the direction of travel
  // and blurs out, the new one slides in from 5px along it and sharpens, staggered left to right. Each slot holds at most two glyphs.
  // Line 2, the place, crossfades as a whole word with a blur. Widths ease, so nothing jitters.
  var capAnim = null, slots = [], wcache = {}, placeLayers = [], capW = { d: 0, p: 0 };
  TL3.capStats = { maxPerSlot: 0, changes: 0 };
  function capX() { return G.side === 'margin' ? G.right - K.maxLen - 10 : G.right - 44 - 14; }    // right edge of the caption
  function placeCap() { cap.style.transform = 'translate(' + (Math.round(capX()) + cxs.x).toFixed(1) + 'px,' + (cy.x - 10 + sy.x).toFixed(1) + 'px)'; }   // zero-width anchor at the right edge: text changes never move layout
  function charW(ch) { if (wcache[ch] === undefined) { capMeasure.textContent = ch === ' ' ? '\u00a0' : ch; wcache[ch] = capMeasure.getBoundingClientRect().width; } return wcache[ch]; }
  function textW(t, cls) { capMeasure.className = 't3-cm ' + (cls || ''); capMeasure.textContent = t; var w = capMeasure.getBoundingClientRect().width; capMeasure.className = 't3-cm'; return w; }
  function glyph(ch) { var g = document.createElement('span'); g.className = 't3-cg1'; g.textContent = ch === ' ' ? '\u00a0' : ch; return g; }
  function settleOut(slot) {     // keep at most two glyphs per slot: an outgoing one still fading is dropped at once
    while (slot.el.children.length > 1) { var o = slot.el.firstChild; if (o === slot.cur) o = slot.el.children[1]; o.remove(); }
  }
  function setDate(t, dir, instant) {
    var chars = Array.from(t), n = Math.max(chars.length, slots.length), changed = [];
    for (var j = 0; j < n; j++) {        // j counts from the right
      var ch = j < chars.length ? chars[chars.length - 1 - j] : '';
      var sl = slots[j];
      if (!sl) { var el = document.createElement('span'); el.className = 't3-cs'; capDate.insertBefore(el, capDate.firstChild); sl = slots[j] = { el: el, ch: '', cur: null, x: null }; }
      if (sl.ch !== ch) changed.push(j);
    }
    var order = changed.slice().sort(function (a, b) { return b - a; });   // left to right on screen
    order.forEach(function (j, idx) {
      var sl = slots[j], ch = j < chars.length ? chars[chars.length - 1 - j] : '';
      sl.ch = ch;
      settleOut(sl);
      var old = sl.cur, g = ch ? glyph(ch) : null;
      if (instant || reduce.matches) { if (old) old.remove(); if (g) sl.el.appendChild(g); sl.cur = g; return; }
      var blur = K.chBlur[0] + Math.min(1, S.vel) * (K.chBlur[1] - K.chBlur[0]), sh = K.chShift * (dir || 1), delay = idx * K.chStagger;
      if (old) {
        var cs = getComputedStyle(old), o0 = cs.opacity, f0 = cs.filter === 'none' ? 'blur(0px)' : cs.filter, t0 = cs.transform === 'none' ? 'translateY(0px)' : cs.transform;
        old.getAnimations().forEach(function (a) { a.cancel(); });
        var ao = old.animate([{ opacity: o0, filter: f0, transform: t0 }, { opacity: 0, filter: 'blur(' + blur + 'px)', transform: 'translateY(' + (-sh) + 'px)' }], { duration: K.chOut, delay: delay * .5, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'both' });
        ao.onfinish = function () { old.remove(); };
      }
      if (g) { sl.el.appendChild(g); g.animate([{ opacity: 0, filter: 'blur(' + blur + 'px)', transform: 'translateY(' + sh + 'px)' }, { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0px)' }], { duration: K.chIn, delay: delay, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'backwards' }); }
      sl.cur = g;
      TL3.capStats.maxPerSlot = Math.max(TL3.capStats.maxPerSlot, sl.el.children.length);
    });
    // place the slots: each is a zero-width anchor at the right edge of its glyph, moved by transform only (never layout), easing when a glyph to its right changes width
    var off = 0;
    for (var q = 0; q < slots.length; q++) { var S2 = slots[q], nx = -off; if (S2.x !== nx) { S2.el.style.transition = (S2.x === null || instant || reduce.matches) ? 'none' : ''; S2.el.style.transform = 'translateX(' + nx.toFixed(2) + 'px)'; S2.x = nx; } off += S2.ch ? charW(S2.ch) : 0; }
    // trailing empty slots on the left are trimmed once nothing in them is visible
    while (slots.length > chars.length && slots[slots.length - 1].ch === '' && !slots[slots.length - 1].el.children.length) slots.pop().el.remove();
    capW.d = textW(t, 't3-cd-m');
  }
  function setPlace(t, dir, instant) {
    var cur = placeLayers[placeLayers.length - 1];
    if (cur && cur.textContent === t) return;
    while (placeLayers.length > 1) placeLayers.shift().remove();      // at most two words live
    var g = document.createElement('span'); g.className = 't3-cw1'; g.textContent = t; capPlace.appendChild(g); placeLayers.push(g);
    capW.p = textW(t, 't3-cp-m');
    if (instant || reduce.matches || !cur) { if (cur) { cur.remove(); placeLayers.shift(); } return; }
    var blur = K.chBlur[1], sh = K.chShift * (dir || 1) * .6, cs = getComputedStyle(cur);
    cur.getAnimations().forEach(function (a) { a.cancel(); });
    var ao = cur.animate([{ opacity: cs.opacity, filter: cs.filter === 'none' ? 'blur(0px)' : cs.filter }, { opacity: 0, filter: 'blur(' + blur + 'px)', transform: 'translateY(' + (-sh) + 'px)' }], { duration: K.wordOut, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'both' });
    ao.onfinish = function () { var i = placeLayers.indexOf(cur); if (i >= 0) placeLayers.splice(i, 1); cur.remove(); };
    g.animate([{ opacity: 0, filter: 'blur(' + blur + 'px)', transform: 'translateY(' + sh + 'px)' }, { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0px)' }], { duration: K.wordIn, delay: 20, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'backwards' });
  }
  function sizeBg() {      // the chip behind the caption (edge layout only) reveals by clip, so its size change never shifts layout
    var w = Math.ceil(Math.max(capW.d, capW.p)) + 24; capBg.style.clipPath = 'inset(0 0 0 calc(100% - ' + w + 'px) round 8px)';
  }
  function setCap(x, dir) {
    var first = !S.capShown;
    TL3.capStats.changes++;
    setDate(dayText(x), dir, first); setPlace(dayNote(x), dir, first); sizeBg();
  }
  function showCap() {
    if (S.capShown) return; S.capShown = true; cy.x = cy.to; cy.v = 0;
    if (capAnim) capAnim.cancel(); cap.classList.add('is-on'); placeCap();
    capAnim = reduce.matches ? null : cap.animate([{ opacity: 0, scale: .95 }, { opacity: 1, scale: 1 }], { duration: K.capEnter, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
  }
  function hideCap(fast) {
    if (!S.capShown) return; S.capShown = false;
    if (capAnim) capAnim.cancel();
    if (reduce.matches) { cap.classList.remove('is-on'); cxs.x = cxs.to = cxs.v = 0; return; }
    capAnim = cap.animate([{ opacity: 1, translate: '0 0', filter: 'blur(0px)' }, { opacity: 0, translate: '-6px 0', filter: 'blur(2px)' }], { duration: fast ? K.capLetGo : K.capExit, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'forwards' });
    var A = capAnim; A.onfinish = function () { if (!S.capShown) { cap.classList.remove('is-on'); cxs.x = cxs.to = cxs.v = 0; } A.cancel(); if (capAnim === A) capAnim = null; };   // fill holds 0 until is-on is gone: no one-frame flash   // a caption let go fades where it is, then resets
  }

  // ---------------- focus (the snapped tick) ----------------
  function focus(k, dir) {
    k = clamp(k, 0, D.length - 1); var was = S.k; S.k = k; S.pullK = k; S.focusOn = true;
    cy.to = tickClientY(k); if (!S.capShown) cy.x = cy.to;
    if (k !== was || !S.capShown) setCap(D[k], dir === undefined ? (was < 0 ? 0 : Math.sign(k - was)) : dir); showCap();
    rail.setAttribute('aria-valuenow', String(k)); rail.setAttribute('aria-valuetext', fullText(D[k]));
    rail.classList.add('is-focus'); kick();
    return was;
  }
  function unfocus(fast) { S.focusOn = false; S.k = -1; rail.classList.remove('is-focus'); hideCap(fast); kick(); }
  function wakeTo(v) { wake.to = v; kick(); }
  function sleepSoon(ms) { clearTimeout(S.sleepT); S.sleepT = setTimeout(function () { if (S.mode || S.over || document.activeElement === rail) return; wakeTo(0); unfocus(); }, ms); }
  function ratchet(from, to) {      // one click per tick crossed: firmer for a month, softer for a day (feel.js rate-limits)
    if (from < 0 || from === to) return; var dir = to > from ? 1 : -1, mon = false;
    for (var k = from; k !== to; k += dir) if (D[k].M !== D[k + dir].M) mon = true;
    TL3.cue(mon ? 'tick' : 'tick2'); TL3.railCues++;
  }

  // ---------------- the current day (handle), following the page ----------------
  function dayInView() {
    var M = months[L.current()], line = L.barH() + L.mhH(), best = M.days[0];
    M.days.forEach(function (Dy) { var r = Dy.list[0].li.getBoundingClientRect(); if (r.top < line + 8) best = Dy; });
    for (var k = 0; k < D.length; k++) if (D[k].D === best) return k; return 0;
  }
  function syncHandle(instant) {
    if (S.mode === 'scrub') return; S.cur = dayInView(); hy.to = tickClientY(S.cur);
    if (instant) { hy.x = hy.to; hy.v = 0; }
    if (!S.focusOn) { rail.setAttribute('aria-valuenow', String(S.cur)); rail.setAttribute('aria-valuetext', fullText(D[S.cur])); }
    kick();
  }

  // ---------------- jumping ----------------
  function land(k, how) {
    var x = D[k], p = x.p; TL3.cue('land');
    say.textContent = fullText(x);
    var y = L.placeScrollY(p);
    if (how === 'instant') { L.jumpY(y); L.hit(p); syncHandle(); return; }
    S.travelling = true; hy.to = tickClientY(k); kick();
    L.travelTo(y, function () { S.travelling = false; L.hit(p); syncHandle(); }, { keepPointer: true });
  }
  function scrubTo(k) {
    var was = S.k; if (k === was) return; focus(k); ratchet(was, k);
    L.jumpY(L.placeScrollY(D[k].p)); S.cur = k; hy.to = tickClientY(k); hy.x = hy.to; kick();
  }

  // ---------------- the day ruler (long-press) ----------------
  function rulerItems() {          // every visited day plus a month name where the month changes
    var out = []; D.forEach(function (x, k) { if (k === 0 || D[k - 1].M !== x.M) out.push({ mon: x.M }); out.push({ k: k }); }); return out;
  }
  var RI = [];
  function openRuler(k, clientY) {
    var pitch = G.touch ? K.pitchTouch : K.pitch, rows = K.rulerRows, h = rows * pitch;
    RI = rulerItems(); var html_ = RI.map(function (it) {
      if (it.mon) return '<div class="t3-ru-m">' + (ja() ? it.mon.y + '年' + it.mon.m + '月' : TL2.mon(it.mon.m) + (it.mon.y !== P[0].at.y ? ' ' + it.mon.y : '')) + '</div>';
      var x = D[it.k], a = x.p.at;
      return '<div class="t3-ru-d" data-k="' + it.k + '"><span>' + esc(dayNote(x)) + '</span><b><em>' + (ja() ? L.dayLabel(a).replace(/^\d+日/, '') : L.dayLabel(a).split(' ')[0]) + ' </em>' + (ja() ? a.d + '日' : a.d) + '</b></div>';
    }).join('');
    ruIn.innerHTML = html_; ruIn.style.setProperty('--pitch', pitch + 'px');
    var rowOf = {}; RI.forEach(function (it, i) { if (!it.mon) rowOf[it.k] = i; });
    var cyy = clamp(clientY, L.barH() + h / 2 + 8, innerHeight - h / 2 - 8);
    S.ruler = { k: k, k0: k, y0: clientY, pitch: pitch, rowOf: rowOf, cy: cyy, half: h / 2, h: h, off: Spr(1400, 1, 0), raf: 0 };
    var right = G.side === 'margin' ? G.right - K.maxLen - 12 : G.right - 44 - 8;
    ruler.style.height = h + 'px'; ruler.style.top = Math.round(cyy - h / 2) + 'px'; ruler.style.left = 'auto'; ruler.style.right = (viewW() - right) + 'px';
    ruler.hidden = false; ruler.classList.toggle('is-over', G.side !== 'margin');
    ruX.style.top = Math.round(cyy) + 'px'; ruX.style.left = right + 'px'; ruX.style.width = Math.max(4, G.right - right) + 'px'; ruX.hidden = false;
    S.ruler.off.x = S.ruler.off.to = -rowOf[k] * pitch; paintRuler();
    if (!reduce.matches) ruler.animate([{ opacity: 0, scale: .95 }, { opacity: 1, scale: 1 }], { duration: 160, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
    hideCap(); rail.classList.add('is-held'); TL3.cue('open'); kick();
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function paintRuler() {
    var R = S.ruler; if (!R) return; var sel = R.rowOf[R.k];
    ruIn.style.transform = 'translateY(' + (R.h / 2 - R.pitch / 2 + R.off.x).toFixed(1) + 'px)';
    var kids = ruIn.children, lo = Math.max(0, sel - 8), hi = Math.min(kids.length - 1, sel + 8);
    for (var i = (R.lo === undefined ? 0 : Math.min(R.lo, lo)); i <= (R.hi === undefined ? kids.length - 1 : Math.max(R.hi, hi)); i++) {
      var dd = Math.abs((i * R.pitch + R.off.x) / R.pitch), e = kids[i];
      e.style.opacity = dd > 5.5 ? 0 : (dd < .5 ? 1 : Math.max(.16, 1 - dd * .2)).toFixed(2);
      e.classList.toggle('is-sel', i === sel);
    }
    R.lo = lo; R.hi = hi;
  }
  function rulerFrame(now) {
    var R = S.ruler; if (!R) return; R.raf = 0; var dt = Math.min(.032, (now - (R.t || now)) / 1000); R.t = now;
    var m = step(R.off, dt); paintRuler(); if (m) R.raf = requestAnimationFrame(rulerFrame); else R.t = 0;
  }
  function rulerMove(clientY) {
    var R = S.ruler, steps = Math.round((clientY - R.y0) / R.pitch), k = clamp(R.k0 + steps, 0, D.length - 1);
    if (k !== R.k) { ratchet(R.k, k); R.k = k; R.off.to = -R.rowOf[k] * R.pitch; rail.setAttribute('aria-valuetext', fullText(D[k])); if (!R.raf) { R.t = 0; R.raf = requestAnimationFrame(rulerFrame); } }
  }
  function closeRuler() {
    var R = S.ruler; if (!R) return; S.ruler = null; cancelAnimationFrame(R.raf); rail.classList.remove('is-held'); ruX.hidden = true;
    if (reduce.matches) { ruler.hidden = true; return; }
    var a = ruler.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: .98 }], { duration: 120, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
    a.onfinish = function () { if (!S.ruler) ruler.hidden = true; };
    kick();
  }
  function insideRuler(x, y) {
    var r = ruler.getBoundingClientRect(), rr = rail.getBoundingClientRect();
    return x >= r.left - 12 && x <= rr.right + 24 && y >= r.top - 12 && y <= r.bottom + 12 && x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight;
  }

  // ---------------- pointer ----------------
  function velocity(e) { var now = performance.now(), dt = Math.max(1, now - S.lastT); S.vel = S.vel * .6 + (Math.abs(e.clientY - S.lastY) / dt) * .4; S.lastY = e.clientY; S.lastT = now; }
  var fine = matchMedia('(pointer: fine)');
  function hoverCue(from, to) {        // hovering also ratchets, softer than a drag: one tick per change, firmer on a month boundary (feel.js rate-limits and lowers the gain with speed)
    if (from < 0 || from === to) return; var dir = to > from ? 1 : -1, mon = false;
    for (var k = from; k !== to; k += dir) if (D[k].M !== D[k + dir].M) mon = true;
    TL3.cue(mon ? 'hover2' : 'hover', { vel: S.vel });
  }
  function hoverTo(y) { fy.to = y; var k = nearest(y); if (k !== S.k) { var was = S.k; focus(k); hoverCue(was, k); } kick(); }
  function springs(k, z) { sx.k = sy.k = cxs.k = k; sx.z = sy.z = cxs.z = z; }
  // ---- the exit stretch. The moment the pointer leaves, the hover swell relaxes (fast). What stays is a rubber band pulled from one
  // point: the snapped tick and its nearest neighbours extend toward the pointer's side only, their other end anchored; resistance grows
  // with distance; past `release` it lets go and snaps home in ~200ms. Re-entering catches it mid-flight. The caption steps aside so the
  // pointer never sits on the date.
  function zoneMove(e) {
    if (e.pointerType !== 'mouse' || !S.zone) return;
    var r = rail.getBoundingClientRect(), y0 = G.top - 6, y1 = G.top + G.h + 6;
    var dx = e.clientX < r.left ? e.clientX - r.left : e.clientX > r.right ? e.clientX - r.right : 0;
    var dy = e.clientY < y0 ? e.clientY - y0 : e.clientY > y1 ? e.clientY - y1 : 0, d = Math.hypot(dx, dy);
    if (d > K.release) { zoneOff(true); return; }
    velocity(e);
    var m = K.stretchMax * (1 - Math.exp(-d / K.stretchLambda));
    springs(K.followK, K.followZ); sx.to = d ? dx / d * m : 0; sy.to = d ? dy / d * m : 0;
    hoverTo(clamp(e.clientY, G.top, G.top + G.h));
    capPush(e, false);
  }
  function capPush(e, hold) {      // keep the caption clear of the pointer: pushed, it moves with the pointer at once, never under it
    var capR = capX(), capTop = cy.to - 14, capBot = cy.to + 32;
    var t = (e.clientX > capR - 400 && e.clientX - K.capGap < capR && e.clientY > capTop && e.clientY < capBot) ? Math.min(0, e.clientX - K.capGap - capR) : 0;
    if (t < cxs.x) { cxs.x = cxs.to = t; cxs.v = 0; } else if (!hold) cxs.to = t;
    kick();
  }
  function fadePush(e) { if (S.capShown || !cap.classList.contains('is-on')) { removeEventListener('pointermove', fadePush, true); return; } capPush(e, true); }
  function zoneOn(e) {
    S.zone = true; wake.k = K.relaxK; wakeTo(0);       // the swell lets go at once; only the pull remains
    addEventListener('pointermove', zoneMove, true); document.addEventListener('pointerout', zoneOut, true); addEventListener('pointerdown', zoneDown, true); zoneMove(e);
  }
  function zoneOut(e) { if (!e.relatedTarget) zoneOff(true); }
  function zoneDown(e) { if (!rail.contains(e.target)) zoneOff(true); }
  function zoneOff(release) {
    if (!S.zone) return; S.zone = false;
    removeEventListener('pointermove', zoneMove, true); document.removeEventListener('pointerout', zoneOut, true); removeEventListener('pointerdown', zoneDown, true);
    springs(K.backK, K.backZ); sx.to = 0; sy.to = 0; if (release) { cxs.to = cxs.x; cxs.v = 0; addEventListener('pointermove', fadePush, true); } else cxs.to = 0;   // a let-go caption fades where it is, still stepping aside kick(); TL3.railReleases = (TL3.railReleases || 0) + 1;
    if (release && !S.over && !S.mode) { wakeTo(0); if (document.activeElement !== rail || html.dataset.input !== 'kbd') unfocus(true); }
  }
  rail.addEventListener('pointerenter', function (e) {
    if (e.pointerType !== 'mouse') return; S.over = true; clearTimeout(S.sleepT); wake.k = K.wakeK; wakeTo(1);
    if (S.zone) { zoneOff(false); springs(K.followK, K.followZ); hoverTo(e.clientY); return; }   // caught mid-stretch: just ease home
    sx.to = sy.to = cxs.to = 0; fy.to = e.clientY; fy.x = e.clientY; fy.v = 0; S.lastY = e.clientY; S.lastT = performance.now(); focus(nearest(e.clientY), 0);
  });
  rail.addEventListener('pointerleave', function (e) {
    if (e.pointerType !== 'mouse') return; S.over = false; if (S.mode) return;
    if (fine.matches && !reduce.matches && S.focusOn) { zoneOn(e); return; }
    wakeTo(0); if (document.activeElement !== rail || html.dataset.input !== 'kbd') unfocus();
  });
  rail.addEventListener('pointerdown', function (e) {
    if (e.button > 0 || S.pid !== null) return; e.preventDefault();
    S.pid = e.pointerId; try { rail.setPointerCapture(e.pointerId); } catch (er) {}
    L.stopGlide(); clearTimeout(S.sleepT);
    S.mode = 'press'; S.x0 = e.clientX; S.y0 = e.clientY; S.t0 = performance.now(); S.lastY = e.clientY; S.lastT = S.t0; S.vel = 0;
    wakeTo(1); fy.to = e.clientY; if (e.pointerType !== 'mouse') { fy.x = e.clientY; fy.v = 0; }
    focus(nearest(e.clientY)); rail.classList.add('is-press');
    press.to = 1; kick();       // press feedback starts at once: the tick stretches over the hold
    clearTimeout(S.holdT); S.holdT = setTimeout(function () { if (S.mode === 'press') { S.mode = 'ruler'; press.to = 0; openRuler(S.k, S.y0); } }, K.hold);
  });
  rail.addEventListener('pointermove', function (e) {
    velocity(e);
    if (S.pid === null) { if (e.pointerType === 'mouse') hoverTo(e.clientY); return; }
    if (e.pointerId !== S.pid) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { end(e, false); return; }
    fy.to = e.clientY; kick();
    if (S.mode === 'press' && (Math.abs(e.clientY - S.y0) > K.slop || Math.abs(e.clientX - S.x0) > K.slop * 2)) { S.mode = 'scrub'; clearTimeout(S.holdT); press.to = 0; rail.classList.add('is-live'); }
    if (S.mode === 'scrub') {
      scrubTo(nearest(e.clientY));
      // past either end of the rail the ticks follow with resistance and spring back on release
      var over = e.clientY < G.top ? e.clientY - G.top : e.clientY > G.top + G.h ? e.clientY - G.top - G.h : 0;
      springs(K.followK, K.followZ); sy.to = reduce.matches ? 0 : Math.sign(over) * K.stretchMax * (1 - Math.exp(-Math.abs(over) / K.stretchLambda));
      if (over) fy.to = clamp(e.clientY, G.top, G.top + G.h);
    }
    else if (S.mode === 'ruler') rulerMove(e.clientY);
  });
  function end(e, commit) {
    if (S.pid === null) return; var m = S.mode, pt = e && e.pointerType;
    try { rail.releasePointerCapture(S.pid); } catch (er) {}
    S.pid = null; S.mode = null; clearTimeout(S.holdT); press.to = 0; rail.classList.remove('is-press', 'is-live'); springs(K.backK, K.backZ); sx.to = sy.to = 0; kick();
    if (m === 'press' && commit) land(S.k);
    else if (m === 'scrub') { L.hit(D[S.k].p); say.textContent = fullText(D[S.k]); syncHandle(); }
    else if (m === 'ruler') { var R = S.ruler, ok = commit && e && insideRuler(e.clientX, e.clientY), k = R.k; closeRuler(); if (ok) { focus(k, 0); land(k); } else focus(S.k, 0); }
    if (pt === 'mouse' && !S.over && e && fine.matches && !reduce.matches && S.focusOn) { zoneOn(e); return; }   // released outside: the stretch takes over
    if (pt !== 'mouse' || !S.over) { if (!S.over) wakeTo(pt === 'mouse' ? 0 : wake.to); sleepSoon(pt === 'mouse' ? 0 : 900); }
  }
  rail.addEventListener('pointerup', function (e) { if (e.pointerId === S.pid) end(e, true); });
  rail.addEventListener('pointercancel', function (e) { if (e.pointerId === S.pid) end(e, false); });
  rail.addEventListener('lostpointercapture', function (e) { if (e.pointerId === S.pid) end(e, false); });
  addEventListener('blur', function () { end(null, false); zoneOff(true); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { end(null, false); zoneOff(true); } });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.ruler) { e.preventDefault(); e.stopPropagation(); S.mode = 'cancelled'; closeRuler(); focus(S.k, 0); } }, true);
  rail.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // ---------------- keyboard ----------------
  rail.addEventListener('focus', function () { if (html.dataset.input === 'kbd') { wakeTo(1); fy.to = tickClientY(S.cur); fy.x = fy.to; focus(S.cur, 0); } });
  rail.addEventListener('blur', function () { if (!S.over && !S.mode) { wakeTo(0); unfocus(); } });
  rail.addEventListener('keydown', function (e) {
    var k = S.focusOn ? S.k : S.cur, x = D[k], d = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[e.key], to = k;
    if (d) to = k + d;
    else if (e.key === 'PageUp' || e.key === 'PageDown') { var mi = clamp(x.M.i + (e.key === 'PageUp' ? -1 : 1), 0, months.length - 1); to = D.findIndex(function (y) { return y.M.i === mi; }); }
    else if (e.key === 'Home') to = 0; else if (e.key === 'End') to = D.length - 1;
    else if (e.key === 'Enter') { e.preventDefault(); land(k); return; }
    else return;
    e.preventDefault(); to = clamp(to, 0, D.length - 1); if (to === k && S.focusOn) return;
    wakeTo(1); fy.to = tickClientY(to); ratchet(k, to); focus(to); land(to);
  });

  // ---------------- page scroll moves the handle ----------------
  var sraf = 0;
  addEventListener('scroll', function () { if (sraf) return; sraf = requestAnimationFrame(function () { sraf = 0; if (!S.travelling) syncHandle(); }); }, { passive: true });
  addEventListener('resize', function () { end(null, false); closeRuler(); layout(); syncHandle(true); });

  // ---------------- language re-render ----------------
  var prevRender = TL3.onRender;
  TL3.onRender = function () { prevRender && prevRender(); wcache = {}; buildRail(); layout(); syncHandle(true); if (S.focusOn) { var k = S.k; S.capShown = false; focus(k, 0); } };

  buildRail(); layout(); syncHandle(true);
  TL3.R = { D: function () { return D; }, G: G, S: S, K: K, nearest: nearest, tickY: tickClientY, rail: rail, cap: cap, ruler: ruler,
    slots: function () { return slots; }, capDate: capDate, capPlace: capPlace, capText: function () { return slots.slice().reverse().map(function (s) { return s.ch; }).join('') + ' | ' + (placeLayers.length ? placeLayers[placeLayers.length - 1].textContent : ''); }, stretch: function () { return { x: sx.x, y: sy.x }; }, advance: advance, pull: function () { return { extL: PS.extL, extR: PS.extR, capPush: cxs.x }; }, wake: function () { return wake.x; }, cur: function () { return S.cur; } };
})();
