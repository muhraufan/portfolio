/* Timeline 3 — the list. One column, newest first: a sticky header per month, one row per place.
   A row opens in place: its thumbnail grows into the live scene (one spring for the whole change: the frame, the rows it
   pushes, the row that closes), and only that scene runs. Everything is interruptible: a new change starts from wherever
   things are on screen. Jump controls (jumps.js) talk to TL3.L. */
(function () {
  var html = document.documentElement, TL3 = window.TL3, TL2 = window.TL2;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var listEl = document.getElementById('t3-list');
  var P = TL2.places(), months = [], byKey = {};
  var SPRING = { k: 420, zeta: .84 };   // ~300 ms to rest, <1% overshoot: quick, no wobble
  var WD = { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], ja: ['日', '月', '火', '水', '木', '金', '土'] };
  function ja() { return TL.lang() === 'ja'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tod() { return html.getAttribute('data-tod') || 'midday'; }
  function img(p, sz) { return '/timeline/img/' + p.scene + '-' + tod() + '-' + sz + '.webp?v=3'; }
  function small() { return innerWidth <= 600; }
  function barH() { return small() ? 68 : 76; }
  function mhH() { return 48; }
  function rowH() { return small() ? 64 : 76; }
  function count(n) { return ja() ? n + 'か所' : n + (n === 1 ? ' place' : ' places'); }
  function wd(a) { return new Date(Date.UTC(a.y, a.m - 1, a.d)).getUTCDay(); }
  function hm(a) { return (a.h < 10 ? '0' : '') + a.h + ':' + (a.mi < 10 ? '0' : '') + a.mi; }
  function dayLabel(a) { return ja() ? a.d + '日（' + WD.ja[wd(a)] + '）' : WD.en[wd(a)] + ' ' + a.d; }

  // ---------- months ----------
  P.forEach(function (p) {
    var k = TL2.key(p.at.y, p.at.m), M = byKey[k];
    if (!M) { M = byKey[k] = { i: months.length, key: k, y: p.at.y, m: p.at.m, list: [], days: [] }; months.push(M); }
    var D = M.days[M.days.length - 1]; if (!D || D.d !== p.at.d) M.days.push(D = { d: p.at.d, list: [] });
    D.list.push(p); M.list.push(p); p.M = M;
  });

  function rowHTML(p) {
    return '<li class="t3-r" id="r-' + p.i + '" data-i="' + p.i + '"><button type="button" class="t3-rb" aria-expanded="false" aria-controls="o-' + p.i + '">' +
      '<span class="t3-d"><span class="t3-l1">' + dayLabel(p.at) + '</span><span class="t3-l2">' + hm(p.at) + '</span></span>' +
      '<span class="t3-t"><span class="t3-l1">' + esc(TL2.s(p.name)) + (p.example ? '<span class="t3-tag">' + (ja() ? '例' : 'Example') + '</span>' : '') + '</span>' +
      '<span class="t3-l2">' + (p.example ? '<span class="t3-tag t3-tag-m">' + (ja() ? '例' : 'Example') + '</span>' : '') + esc(TL2.s(p.area)) + '</span></span>' +
      '<span class="t3-th"><img alt="" width="80" height="60" decoding="async" src="' + img(p, 's') + '"></span></button></li>';
  }
  function headHTML(M) {
    var cal = ['calendar', 'all'].indexOf(html.dataset.jump) >= 0, tag = cal ? 'button' : 'h2';
    return '<' + tag + (cal ? ' type="button" aria-haspopup="dialog" aria-expanded="false"' : '') + ' class="t3-mh-t"><span class="t3-mh-n">' + TL2.monthTitle(M.y, M.m) + '</span>' +
      '<span class="t3-mh-c">' + count(M.list.length) + '</span>' + '<svg class="t3-chev" width="9" height="6" viewBox="0 0 9 6" aria-hidden="true"><path d="M1 1.2 4.5 4.8 8 1.2" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></' + tag + '>';
  }
  function sizeMonth(M) { M.sec.style.containIntrinsicSize = 'auto ' + (mhH() + M.list.length * rowH()) + 'px'; }
  function render() {
    listEl.innerHTML = months.map(function (M) {
      return '<section class="t3-m" id="m-' + M.key + '" data-k="' + M.key + '" aria-label="' + esc(TL2.monthTitle(M.y, M.m)) + '"><div class="t3-mh">' + headHTML(M) + '</div><ul class="t3-rows">' + M.list.map(rowHTML).join('') + '</ul></section>';
    }).join('');
    months.forEach(function (M) { M.sec = document.getElementById('m-' + M.key); M.head = M.sec.querySelector('.t3-mh'); M.btn = M.sec.querySelector('.t3-mh-t'); sizeMonth(M); });
    P.forEach(function (p) { p.li = document.getElementById('r-' + p.i); p.btn = p.li.querySelector('.t3-rb'); });
    tops = null;
  }
  function paintStrings() {
    var first = months[months.length - 1];
    document.querySelector('.t3-lede').textContent = ja()
      ? 'これまで見かけられた場所を、新しい順に。' + TL2.monthTitle(first.y, first.m) + 'から' + P.length + 'か所。'
      : 'Every place I\u2019ve been last seen, newest first. ' + P.length + ' places since ' + TL2.monthTitle(first.y, first.m) + '.';
  }

  // ---------- geometry for the jump controls (cached; a change of layout clears it) ----------
  var tops = null;
  function docTop(el) { return el.getBoundingClientRect().top + scrollY; }
  function monthTops() { if (!tops) tops = months.map(function (M) { return docTop(M.sec); }); return tops; }
  function monthScrollY(i) { return i <= 0 ? 0 : Math.max(0, monthTops()[i] - barH()); }
  function current() {        // the month whose header is (or is about to be) stuck under the bar
    var t = monthTops(), y = scrollY + barH() + mhH() / 2, lo = 0, hi = t.length - 1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (t[mid] <= y) lo = mid; else hi = mid - 1; }
    if (lo < t.length - 1 && scrollY >= document.documentElement.scrollHeight - innerHeight - 2) return t.length - 1;   // the oldest month is too short to pin; the bottom of the page means it
    return lo;
  }
  function placeScrollY(p) { return Math.max(0, docTop(p.li) - barH() - mhH()); }
  addEventListener('resize', function () { tops = null; });

  // ---------- scrolling ourselves: instant for scrubbing, a short glide for a picked day ----------
  var glide = 0, glideStop = null;
  function jumpY(y) { stopGlide(); window.scrollTo({ top: y, left: 0, behavior: 'instant' }); }
  function stopGlide() { cancelAnimationFrame(glide); glide = 0; setBlur(0); if (glideStop) { ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (t) { removeEventListener(t, glideStop, true); }); glideStop = null; } }
  function glideTo(y, done) {
    stopGlide(); y = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, y));
    var y0 = scrollY, d = y - y0;
    if (reduce.matches || Math.abs(d) < 2) { window.scrollTo({ top: y, behavior: 'instant' }); done && done(); return; }
    if (Math.abs(d) > innerHeight * 1.2) { y0 = y - Math.sign(d) * innerHeight * .6; window.scrollTo({ top: y0, behavior: 'instant' }); d = y - y0; }   // far: arrive, don't travel
    var t0 = performance.now(), dur = 280;
    glideStop = function () { stopGlide(); };
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (t) { addEventListener(t, glideStop, true); });
    (function f(now) { var u = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - u, 3);
      window.scrollTo({ top: y0 + d * e, behavior: 'instant' }); if (u < 1) glide = requestAnimationFrame(f); else { stopGlide(); done && done(); } })(t0);
  }
  // travelTo: the click-to-date scroll. It travels THROUGH the dates (no cut), with a duration that grows with the log of the distance
  // (measured on Zheng's strip: 824px → ~550ms, 3174px → ~725ms, 30575px → ~950ms) and a quick-start, long soft-settle curve, no overshoot.
  // Any wheel / touch / key / press elsewhere takes over at once. While it moves fast the list gets a faint motion blur, crisp on landing.
  function bez(x1, y1, x2, y2) {      // cubic-bezier easing, solved by Newton steps
    function a(a1, a2) { return 1 - 3 * a2 + 3 * a1; } function b(a1, a2) { return 3 * a2 - 6 * a1; } function c(a1) { return 3 * a1; }
    function at(t, a1, a2) { return ((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t; } function slope(t, a1, a2) { return 3 * a(a1, a2) * t * t + 2 * b(a1, a2) * t + c(a1); }
    return function (x) { if (x <= 0) return 0; if (x >= 1) return 1; var t = x; for (var i = 0; i < 8; i++) { var sl = slope(t, x1, x2); if (Math.abs(sl) < 1e-6) break; t -= (at(t, x1, x2) - x) / sl; } return at(Math.max(0, Math.min(1, t)), y1, y2); };
  }
  var travelEase = bez(0.3, 0, 0.12, 1), blurOn = false;
  TL3.TRAVEL = { min: 350, max: 950, base: 480, perLn: 95, ref: 300, blurFrom: 2.2, blurMax: 0.9 };   // tuning, kept in one place
  function travelDur(d) { var T = TL3.TRAVEL; return Math.round(Math.max(T.min, Math.min(T.max, T.base + T.perLn * Math.log(Math.max(1, d) / T.ref)))); }
  function setBlur(px) { var on = px > 0.05; if (!on && !blurOn) return; blurOn = on; listEl.style.filter = on ? 'blur(' + px.toFixed(2) + 'px)' : ''; }
  function travelTo(y, done, o) {
    o = o || {}; stopGlide(); y = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, y));
    var y0 = scrollY, d = y - y0;
    if (reduce.matches || Math.abs(d) < 2) { window.scrollTo({ top: y, behavior: 'instant' }); done && done(); return 0; }
    var t0 = performance.now(), dur = o.dur || travelDur(Math.abs(d)), last = y0, lt = t0;
    glideStop = function () { stopGlide(); setBlur(0); };
    ['wheel', 'touchstart', 'keydown'].forEach(function (t) { addEventListener(t, glideStop, true); });
    if (!o.keepPointer) addEventListener('pointerdown', glideStop, true);
    (function f(now) { var u = Math.min(1, (now - t0) / dur), e = travelEase(u), yy = y0 + d * e;
      window.scrollTo({ top: yy, behavior: 'instant' });
      var v = Math.abs(yy - last) / Math.max(1, now - lt); last = yy; lt = now;     // px per ms
      var T = TL3.TRAVEL; setBlur(o.noBlur ? 0 : Math.min(T.blurMax, Math.max(0, (v - T.blurFrom) / 6) * T.blurMax));
      if (u < 1) glide = requestAnimationFrame(f); else { setBlur(0); var cb = done; stopGlide(); cb && cb(); } })(t0);
    return dur;
  }
  function hit(p) { var li = p.li; li.classList.remove('is-hit'); void li.offsetWidth; li.classList.add('is-hit'); clearTimeout(li._hit); li._hit = setTimeout(function () { li.classList.remove('is-hit'); }, 1600); }

  // ---------- opening a row ----------
  var openI = -1, anim = 0, spring = null, moving = [], frameA = null, ghosts = [], scrollA = null, LH = null, liveFor = -1;
  var liveBox = document.createElement('div'); liveBox.className = 't3-live';
  function openHTML(p) {
    var ex = p.example ? '<p class="t3-oc"><span class="t3-tag">' + (ja() ? '例（実在しません）' : 'Example, not real') + '</span></p>' : '';
    var cap = '';
    if (p.with && window.LastSeen && LastSeen.withHTML) {
      var lang = ja() ? 'ja' : 'en';
      var place = (p.S && p.S.place && (p.S.place[lang] || p.S.place.en)) || TL2.s(p.name);
      cap = '<p class="t3-oc">' + esc(lang === 'ja' ? '最後に見かけたのは ' + place : 'Last seen at ' + place) + LastSeen.withHTML(p.with, lang, 't3-with-a') + '</p>';
    }
    return '<div class="t3-o" id="o-' + p.i + '"><div class="t3-f"><img class="t3-fs" alt="" src="' + img(p, 's') + '"><img class="t3-fl" alt="" decoding="async"></div>' + ex + cap + '</div>';
  }
  function poster(fr, p) { var L = fr.querySelector('.t3-fl'), u = img(p, 'l'); if (L.getAttribute('src') !== u) { L.classList.remove('is-in'); L.onload = function () { L.classList.add('is-in'); }; L.src = u; if (L.complete && L.naturalWidth) L.classList.add('is-in'); } }
  function prefetch(p) { if (p._pf === tod()) return; p._pf = tod(); new Image().src = img(p, 'l'); }
  function candidates() {     // rows and headers near the screen (never the far, skipped months: they'd have to be laid out)
    var out = [], lo = -innerHeight, hi = innerHeight * 2;
    months.forEach(function (M) { var r = M.sec.getBoundingClientRect(); if (r.bottom < lo || r.top > hi) return;
      out.push({ el: M.head, head: true }); M.list.forEach(function (p) { out.push({ el: p.li }); }); });
    return out;
  }
  function stuck(top) { return Math.abs(top - barH()) < .75; }
  function stopAnim() { cancelAnimationFrame(anim); anim = 0; }
  function settled() { return !anim; }
  function clearMotion() {
    moving.forEach(function (m) { m.el.style.transform = ''; }); moving = [];
    if (frameA) { frameA.el.style.transform = ''; frameA.el.style.borderRadius = ''; if (frameA.cap) frameA.cap.style.opacity = ''; frameA = null; }
  }
  function endGhost(g) { g.el.remove(); g.p.li.classList.remove('is-closing'); }

  function setOpen(i, o) {
    o = o || {};
    if (i === openI && !o.force) return;
    var prev = openI >= 0 ? P[openI] : null, next = i >= 0 ? P[i] : null;
    TL3.closeCal && TL3.closeCal(true);
    // FIRST: where everything is on screen right now (mid-motion included)
    var C = candidates(), first = C.map(function (c) { return c.el.getBoundingClientRect().top; });
    var anchor = next || prev, aTop = anchor ? anchor.li.getBoundingClientRect().top : 0;
    var g0 = null; ghosts = ghosts.filter(function (g) { if (next && g.p === next) { g0 = g.el.getBoundingClientRect(); endGhost(g); return false; } return true; });
    var fromRect = next ? (g0 || next.li.querySelector('.t3-th').getBoundingClientRect()) : null;
    var prevFrame = prev && prev.li.querySelector('.t3-f'), pfRect = prevFrame && prevFrame.getBoundingClientRect();
    ghosts.forEach(function (g) { g.from = g.el.getBoundingClientRect(); g.r0 = g.r; });
    stopAnim(); clearMotion(); hideLive();
    // the change itself
    if (prev) { var po = prev.li.querySelector('.t3-o'); if (po) po.remove(); prev.li.classList.remove('is-open'); prev.btn.setAttribute('aria-expanded', 'false'); }
    openI = i;
    if (next) { next.li.insertAdjacentHTML('beforeend', openHTML(next)); next.li.classList.add('is-open'); next.btn.setAttribute('aria-expanded', 'true'); poster(next.li.querySelector('.t3-f'), next); }
    sizeMonth(anchor ? anchor.M : months[0]); if (prev && next && prev.M !== next.M) sizeMonth(prev.M);
    tops = null;
    // keep the row you touched exactly where it was (the one closing above it can't pull it away)
    if (anchor && !o.noAnchor) { var d = anchor.li.getBoundingClientRect().top - aTop; if (Math.abs(d) > .5) window.scrollTo({ top: scrollY + d, behavior: 'instant' }); }
    TL3.cue(next ? 'open' : 'close');
    if (reduce.matches || o.instant) {          // reduced motion: no travel, just a crossfade of what appeared
      ghosts.forEach(endGhost); ghosts = [];
      if (next && !o.instant) { var no = next.li.querySelector('.t3-o'); no.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' }); }
      if (prev && !o.instant) prev.li.querySelector('.t3-th').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
      if (next) whenSettled(next); return;
    }
    // LAST, then invert: every moved thing starts where it was and springs home together
    var nx = C.map(function (c) { return c.el.getBoundingClientRect().top; });
    C.forEach(function (c, k) { var dy = first[k] - nx[k]; if (Math.abs(dy) < .5) return; if (c.head && (stuck(first[k]) || stuck(nx[k]))) return; moving.push({ el: c.el, dy: dy }); });
    if (next) {
      var fr = next.li.querySelector('.t3-f'), L = fr.getBoundingClientRect(), liDy = 0;
      moving.forEach(function (m) { if (m.el === next.li) liDy = m.dy; });
      frameA = { el: fr, cap: next.li.querySelector('.t3-oc'), dx: fromRect.left - L.left, dy: fromRect.top - L.top - liDy, s0: fromRect.width / L.width, r0: g0 ? 8 : 4 };
    }
    if (prev && pfRect && pfRect.width) {      // the closing scene shrinks back into its own thumbnail
      var g = document.createElement('div'); g.className = 't3-ghost';
      var big = prevFrame.querySelector('.t3-fl.is-in'); g.innerHTML = '<img alt="" src="' + (big ? big.src : img(prev, 's')) + '">';
      var lr = listEl.getBoundingClientRect(); g.style.width = pfRect.width + 'px'; g.style.height = pfRect.height + 'px';
      g.style.left = (pfRect.left - lr.left) + 'px'; g.style.top = (pfRect.top - lr.top) + 'px';
      listEl.appendChild(g); prev.li.classList.add('is-closing');
      ghosts.push({ el: g, p: prev, from: pfRect, w: pfRect.width, h: pfRect.height, ox: pfRect.left - lr.left, oy: pfRect.top - lr.top, r0: 8 });
    }
    // if the opened scene would end below the screen, bring it up within the same motion (never past its own row)
    scrollA = null;
    if (next && !o.noScroll) {
      var fb = next.li.querySelector('.t3-o').getBoundingClientRect().bottom, rt = next.li.getBoundingClientRect().top, lim = innerHeight - (small() ? 72 : 56);
      if (fb > lim) { var by = Math.min(fb - lim, rt - barH() - mhH()); if (by > 1) scrollA = { y0: scrollY, d: by }; }
    }
    spring = new TL.Spring(0, SPRING); spring.target = 1;
    var last = performance.now(), stopScroll = function () { scrollA = null; };
    ['wheel', 'touchstart'].forEach(function (t) { addEventListener(t, stopScroll, { once: true, passive: true }); });
    (function frame(now) {
      var going = spring.step((now - last) / 1000); last = now; var p = spring.x, q = 1 - p;
      moving.forEach(function (m) { m.el.style.transform = 'translateY(' + (m.dy * q).toFixed(2) + 'px)'; });
      if (frameA) { var s = frameA.s0 + (1 - frameA.s0) * p, r = frameA.r0 + (8 - frameA.r0) * p;
        frameA.el.style.transform = 'translate(' + (frameA.dx * q).toFixed(2) + 'px,' + (frameA.dy * q).toFixed(2) + 'px) scale(' + s.toFixed(4) + ')';
        frameA.el.style.borderRadius = (r / s).toFixed(2) + 'px'; if (frameA.cap) frameA.cap.style.opacity = Math.max(0, Math.min(1, (p - .45) / .45)).toFixed(3); }
      if (ghosts.length) { var lr = listEl.getBoundingClientRect();
        ghosts.forEach(function (g) { var t = g.p.li.querySelector('.t3-th').getBoundingClientRect(), x = g.from.left + (t.left - g.from.left) * p, y = g.from.top + (t.top - g.from.top) * p,
          w = g.from.width + (t.width - g.from.width) * p, s = w / g.w, r = g.r0 + (4 - g.r0) * p;
          g.r = r; g.el.style.transform = 'translate(' + (x - lr.left - g.ox).toFixed(2) + 'px,' + (y - lr.top - g.oy).toFixed(2) + 'px) scale(' + s.toFixed(4) + ')'; g.el.style.borderRadius = (r / s).toFixed(2) + 'px'; }); }
      if (scrollA) window.scrollTo({ top: scrollA.y0 + scrollA.d * p, behavior: 'instant' });
      if (going) anim = requestAnimationFrame(frame);
      else { anim = 0; clearMotion(); ghosts.forEach(endGhost); ghosts = []; tops = null; if (next) whenSettled(next); }
    })(last);
  }
  // the scene comes alive only once it's at rest, so nothing heavy happens mid-motion; the still is already showing
  function whenSettled(p) {
    var fr = p.li.querySelector('.t3-f'); if (!fr) return;
    setTimeout(function () { if (openI !== p.i || !settled() || !p.S) return;
      if (!LH) LH = TL2.LiveHost(liveBox);
      liveBox.classList.remove('is-in'); fr.appendChild(liveBox); var L = LH.show(p.scene); liveFor = p.i; TL2.animate(L);
      requestAnimationFrame(function () { if (liveFor === p.i) liveBox.classList.add('is-in'); });
    }, 40);
  }
  function hideLive() { if (LH && liveFor >= 0) { LH.hide(); TL2.animate(null); } liveFor = -1; liveBox.classList.remove('is-in'); if (liveBox.parentNode) liveBox.remove(); }
  function toggle(i) { setOpen(openI === i ? -1 : i); }

  // ---------- input ----------
  listEl.addEventListener('click', function (e) { var b = e.target.closest('.t3-rb'); if (!b) return; toggle(+b.parentNode.dataset.i); });
  listEl.addEventListener('pointerover', function (e) { var b = e.target.closest('.t3-rb'); if (b) prefetch(P[+b.parentNode.dataset.i]); });
  listEl.addEventListener('focusin', function (e) { var b = e.target.closest('.t3-rb'); if (b) prefetch(P[+b.parentNode.dataset.i]); });
  listEl.addEventListener('keydown', function (e) {
    var b = e.target.closest('.t3-rb'); if (!b) return; var i = +b.parentNode.dataset.i, t = null;
    if (e.key === 'ArrowDown') t = P[i + 1]; else if (e.key === 'ArrowUp') t = P[i - 1];
    else if (e.key === 'Home' && !e.target.closest('input')) t = P[0]; else if (e.key === 'End') t = P[P.length - 1];
    if (t) { e.preventDefault(); t.btn.focus({ preventScroll: true }); keepInView(t); }
  });
  function keepInView(p) { var r = p.li.getBoundingClientRect(), top = barH() + mhH() + 4, bot = innerHeight - (small() ? 72 : 56);
    if (r.top < top) jumpY(scrollY + r.top - top); else if (r.top + rowH() > bot) jumpY(scrollY + r.top + rowH() - bot); }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openI >= 0 && !(TL3.calOpen && TL3.calOpen())) { var p = P[openI]; setOpen(-1); p.btn.focus({ preventScroll: true }); } });
  var rz = 0; addEventListener('resize', function () {
    stopAnim(); clearMotion(); ghosts.forEach(endGhost); ghosts = []; tops = null;
    var was = rz; rz = small() ? 1 : 2; if (was && was !== rz) { months.forEach(sizeMonth); paintStrings(); }
  });
  rz = small() ? 1 : 2;

  // ---------- light and language ----------
  new MutationObserver(function () {
    listEl.querySelectorAll('.t3-th img').forEach(function (im) { var p = P[+im.closest('.t3-r').dataset.i]; im.src = img(p, 's'); });
    if (openI >= 0) { var p = P[openI], fr = p.li.querySelector('.t3-f'); if (fr) { fr.querySelector('.t3-fs').src = img(p, 's'); poster(fr, p); } }
  }).observe(html, { attributes: true, attributeFilter: ['data-tod'] });
  TL.onLang(function () {
    var o = openI, y = scrollY, f = document.activeElement && document.activeElement.closest && document.activeElement.closest('.t3-r');
    stopAnim(); clearMotion(); ghosts.forEach(endGhost); ghosts = []; hideLive(); openI = -1; render(); paintStrings();
    if (o >= 0) setOpen(o, { instant: true, noAnchor: true }); window.scrollTo({ top: y, behavior: 'instant' });
    if (f) P[+f.dataset.i].btn.focus({ preventScroll: true }); TL3.onRender && TL3.onRender();
  });

  // ---------- go ----------
  TL3.bindSound(document.querySelector('.t3-sound'));
  render(); paintStrings();
  // reveal once this light's six stills are decoded, so no row ever paints an empty frame (capped: never hold the page)
  var firstImgs = [], seen = {};
  P.forEach(function (p) { if (!seen[p.scene]) { seen[p.scene] = 1; firstImgs.push(p.li.querySelector('.t3-th img')); } });
  Promise.race([Promise.all(firstImgs.map(function (im) { return im.decode ? im.decode().catch(function () {}) : null; })), new Promise(function (r) { setTimeout(r, 500); })])
    .then(function () { html.classList.remove('tl-pre'); });
  var hid = location.hash.slice(1); if (hid) { var hp = P.filter(function (p) { return p.id === hid; })[0]; if (hp) { setOpen(hp.i, { instant: true }); jumpY(placeScrollY(hp)); } }

  TL3.L = { P: P, months: months, barH: barH, mhH: mhH, current: current, monthScrollY: monthScrollY, placeScrollY: placeScrollY, jumpY: jumpY, glideTo: glideTo, travelTo: travelTo, travelDur: travelDur, hit: hit,
    setOpen: setOpen, openI: function () { return openI; }, animating: function () { return !!anim; }, ghosts: function () { return ghosts.length; }, live: function () { return liveFor; },
    small: small, dayLabel: dayLabel, count: count, invalidate: function () { tops = null; }, stopGlide: stopGlide };
})();
