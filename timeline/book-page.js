/* Timeline: the book, always open, and nothing to scroll. The book fills the screen. Ribbon bookmarks hang from its
   front edge, one per month; under it is one row of stamps, the places of the month it is open at, scrolling sideways.
   Pull a ribbon and the book turns to that month; pick a stamp (or the arrows, the arrow keys, a #place link) and it
   turns to that place; the lines under the book say where, when and with whom.
   Needs /last-seen/last-seen.js, the scene files, /last-seen/popup/paint.js and cover.js, lib/common.js, lib/data.js;
   loads /last-seen/popup/book.js (three.js) once the page is up. Until the book is whole, its closed cover is shown as a flat picture in the same spot. The list-and-rail Timeline this replaced is at the tag
   backup-timeline-live. */
(function () {
  'use strict';
  var html = document.documentElement, TL = window.TL, TL2 = window.TL2, TL3 = window.TL3 || {};
  var P = TL2.places(); if (!P.length) return;
  var stage = document.getElementById('tb-stage'), poster = null, info = document.getElementById('tb-info'), gal = document.getElementById('t3-list');
  var prevB = document.querySelector('.tb-prev'), nextB = document.querySelector('.tb-next'), ribbons = document.getElementById('tb-ribbons'), monthEl = document.getElementById('tb-month');
  var LIGHTS = ['morning', 'midday', 'golden', 'night'], WD = { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], ja: ['日', '月', '火', '水', '木', '金', '土'] };
  function ja() { return TL.lang() === 'ja'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function light() { var t = html.getAttribute('data-tod'); return LIGHTS.indexOf(t) >= 0 ? t : (html.getAttribute('data-theme') === 'dark' ? 'night' : 'midday'); }
  function img(p, sz) { return '/timeline/img/' + p.scene + '-' + light() + '-' + sz + '.webp?v=10'; }
  function wd(a) { return new Date(Date.UTC(a.y, a.m - 1, a.d)).getUTCDay(); }
  function day(a) { return ja() ? a.d + '日（' + WD.ja[wd(a)] + '）' : WD.en[wd(a)] + ' ' + a.d; }
  function count(n) { return ja() ? n + 'か所' : n + (n === 1 ? ' place' : ' places'); }

  // ---------- months ----------
  var months = [], byKey = {};
  P.forEach(function (p) { var k = TL2.key(p.at.y, p.at.m), M = byKey[k]; if (!M) { M = byKey[k] = { key: k, y: p.at.y, m: p.at.m, list: [] }; months.push(M); } M.list.push(p); });

  var cur = 0, railMark = null;
  (function () { var h = decodeURIComponent(location.hash.slice(1)); if (!h) return; for (var i = 0; i < P.length; i++) if (P[i].id === h || P[i].place === h) { cur = i; break; } })();

  // ---------- the ribbons: one bookmark per month, hanging from the book's front edge ----------
  var RIB = ['#c8553d', '#2f6f73', '#e0a93b', '#6b4a7c', '#7d9a6a', '#27324c'], MON_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function monthOf(i) { var p = P[i]; return byKey[TL2.key(p.at.y, p.at.m)]; }
  function renderRibbons() {
    ribbons.innerHTML = months.map(function (M) {
      return '<button type="button" class="tb-rib" data-k="' + M.key + '" style="--rib:' + RIB[(M.m + M.y) % RIB.length] + '" aria-label="' + esc(TL2.monthTitle(M.y, M.m) + ', ' + count(M.list.length)) + '">' +
        '<span class="tb-rib-t">' + (ja() ? M.m + '月' : MON_EN[M.m - 1]) + '</span><span class="tb-rib-y">\u2019' + String(M.y).slice(2) + '</span></button>';
    }).join('');
  }
  // ---------- the strip: the places of the month the book is open at ----------
  var stripKey = null, stripAnim = null;
  function renderStrip(dir, M, quiet) {
    M = M || monthOf(cur); if (stripKey === M.key) return; var first = stripKey == null; stripKey = M.key;
    monthEl.innerHTML = '<span class="tb-mh-n">' + TL2.monthTitle(M.y, M.m) + '</span><span class="tb-mh-c">' + count(M.list.length) + '</span>';
    gal.innerHTML = M.list.map(function (p) {
      return '<button type="button" class="tb-st" data-i="' + p.i + '" aria-label="' + esc(TL2.s(p.name) + ', ' + TL2.fullDate(p.at.y, p.at.m, p.at.d)) + '">' +
        '<span class="tb-st-pic"><img alt="" width="80" height="60" decoding="async" src="' + img(p, 's') + '"></span><span class="tb-st-d">' + day(p.at) + '</span></button>';
    }).join('');
    // the row changes hands softly: the new month's stamps come in from the side you are travelling toward. Under a scrubbing
    // pointer (quiet) the move is shorter and quicker, and a new one always starts clean, so crossing months fast never piles up.
    if (!first && !TL.reduce.matches && gal.animate) {
      if (stripAnim) stripAnim.cancel();
      var sx = (dir === 'back' ? -1 : 1) * (quiet ? 14 : 28);
      stripAnim = gal.animate([{ opacity: 0, transform: 'translateX(' + sx + 'px)', filter: 'blur(2px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: quiet ? 220 : 320, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
      monthEl.animate([{ opacity: .35 }, { opacity: 1 }], { duration: quiet ? 220 : 320, easing: 'ease-out' });
    }
  }
  function renderGallery() { stripKey = null; renderRibbons(); mark(); }
  // the stamp row can look ahead: while the rail is over another month it shows that month, and comes back when the pointer leaves
  function previewMonth(M, dir) { renderStrip(dir, M, true); gal.querySelectorAll('.tb-st').forEach(function (b) { b.classList.toggle('is-on', +b.dataset.i === cur); }); }
  function mark(dir) {
    renderStrip(dir);
    var M = monthOf(cur);
    ribbons.querySelectorAll('.tb-rib').forEach(function (b) { var on = +b.dataset.k === M.key; b.classList.toggle('is-on', on); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    gal.querySelectorAll('.tb-st').forEach(function (b) { var on = +b.dataset.i === cur; b.classList.toggle('is-on', on);
      if (on) { b.setAttribute('aria-current', 'true'); gal.scrollTo({ left: b.offsetLeft - (gal.clientWidth - b.offsetWidth) / 2, behavior: TL.reduce.matches ? 'auto' : 'smooth' }); } else b.removeAttribute('aria-current'); });
    prevB.disabled = cur <= 0; nextB.disabled = cur >= P.length - 1;
    if (railMark) railMark();
  }
  // where the open book's front edge is on the stage: the ribbons hang from it
  function layout() {
    var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h || !window.LastSeen || !LastSeen.popup) return;
    if (poster) poster.style.transform = LastSeen.popup.quadCSS(405, 651, LastSeen.popup.project(LastSeen.popup.SHUT, w, h, 0));
    var f = LastSeen.popup.project(LastSeen.popup.FRONT, w, h, 1);
    var sr = stage.getBoundingClientRect(), br = stage.parentNode.getBoundingClientRect();
    ribbons.style.left = Math.round(sr.left - br.left + f[0][0] + (f[1][0] - f[0][0]) * .07) + 'px'; ribbons.style.top = Math.round(sr.top - br.top + f[0][1] - 2) + 'px';
  }
  // ---------- the lines under the book ----------
  function renderInfo() {
    var p = P[cur], lang = ja() ? 'ja' : 'en', w = '';
    try { if (p.with && window.LastSeen && LastSeen.withHTML) w = LastSeen.withHTML(p.with, lang, 't3-with-a'); } catch (e) {}
    info.innerHTML = '<p class="tb-date">' + (ja() ? TL2.fullDate(p.at.y, p.at.m, p.at.d) + '（' + WD.ja[wd(p.at)] + '）' : WD.en[wd(p.at)] + ', ' + TL2.fullDate(p.at.y, p.at.m, p.at.d)) +
      '<span class="tb-page">' + (P.length - cur) + ' / ' + P.length + '</span></p>' +
      '<h2 class="tb-name">' + esc(TL2.s(p.name)) + (w ? '<span class="tb-with">' + w + '</span>' : '') + '</h2><p class="tb-area">' + esc(TL2.s(p.area)) + '</p>';
    prevB.setAttribute('aria-label', ja() ? '新しい場所へ' : 'Newer place'); nextB.setAttribute('aria-label', ja() ? '前の場所へ' : 'Earlier place');
  }
  // the closed cover, there from the first paint, laid where the 3D cover will be (the same as on the homepage)
  function setStill() {}
  try { poster = LastSeen.popup.cover(light()); poster.className = 'tb-poster'; poster.setAttribute('aria-hidden', 'true'); poster.style.width = '405px'; poster.style.height = '651px'; stage.appendChild(poster); } catch (e) { poster = null; }

  // ---------- the book ----------
  var book = null, failed = false, SAY = { en: { shut: 'A pop-up book of every place. Press Enter to open it.', open: 'Pop-up book, open. Move over the pieces to play with them.' },
    ja: { shut: 'すべての場所の飛び出す絵本。Enterキーで開きます。', open: '飛び出す絵本（開いています）。中のものを動かして遊べます。' } };
  function say(k) { return (SAY[ja() ? 'ja' : 'en'])[k]; }
  var turnT = 0;
  function turn() { var p = P[cur]; if (book && p.scene && LastSeen.byId(p.scene)) { book.setScene(p.scene, light()); book.open(); } }
  function go(i, o) {
    i = Math.max(0, Math.min(P.length - 1, i)); if (i === cur && !(o && o.force)) return;
    var dir = i > cur ? 'forward' : 'back'; cur = i;
    mark(dir); renderInfo(); setStill();
    clearTimeout(turnT); if (o && o.key) turnT = setTimeout(turn, 160); else turn();   // paging by key: the lines follow at once, the book turns once the keys rest
    try { history.replaceState(null, '', '#' + P[cur].id); } catch (e) {}
    if (window.SiteSound && !(o && o.quiet)) SiteSound.cue('navigate', { direction: dir });
  }
  function startBook() {
    if (failed || book || !window.LastSeen || !LastSeen.popup || !LastSeen.painters || !LastSeen.painters.popup) return;
    try { var c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) return; } catch (e) { return; }
    var load; try { load = new Function('u', 'return import(u)'); } catch (e) { return; }
    load('/last-seen/popup/book.js?v=6').then(function (m) {
      var first = true;
      book = m.createBook(stage, { label: say, onBuilt: function () { stage.classList.add('is-book'); if (first) { first = false; setTimeout(function () { book.open(); }, 420); } } });   // the flat cover goes first, then the real one opens
      var p0 = P[cur]; if (p0.scene && LastSeen.byId(p0.scene)) book.setScene(p0.scene, light());
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { book.setActive(es[es.length - 1].isIntersecting && !document.hidden); }, { threshold: .05 }).observe(stage);
      document.addEventListener('visibilitychange', function () { book.setActive(!document.hidden); });
    }, function () { failed = true; });
  }

  // ---------- hands ----------
  gal.addEventListener('click', function (e) { var b = e.target.closest('.tb-st'); if (b) go(+b.dataset.i); });
  ribbons.addEventListener('click', function (e) { var b = e.target.closest('.tb-rib'); if (!b) return; var M = byKey[+b.dataset.k]; if (M && M !== monthOf(cur)) go(M.list[0].i); });   // a ribbon opens its month at its newest place
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(stage); else window.addEventListener('resize', layout);
  prevB.addEventListener('click', function () { go(cur - 1); }); nextB.addEventListener('click', function () { go(cur + 1); });
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) return;
    if (e.key === 'ArrowLeft') { go(cur - 1, { key: true, quiet: e.repeat }); e.preventDefault(); } else if (e.key === 'ArrowRight') { go(cur + 1, { key: true, quiet: e.repeat }); e.preventDefault(); }
  });
  window.addEventListener('hashchange', function () { var h = decodeURIComponent(location.hash.slice(1)); for (var i = 0; i < P.length; i++) if (P[i].id === h) { go(i, { quiet: true }); break; } });
  // a new light: the stills follow, and the sun moves in the book. A new language: every line is written again.
  new MutationObserver(function (m) {
    if (m.some(function (r) { return r.attributeName === 'data-lang'; })) { renderGallery(); renderInfo(); if (book) book.relabel(); return; }
    gal.querySelectorAll('.tb-st img').forEach(function (im) { var b = im.closest('.tb-st'); im.src = img(P[+b.dataset.i], 's'); });
    setStill(); if (book) turn();
  }).observe(html, { attributes: true, attributeFilter: ['data-tod', 'data-theme', 'data-lang'] });

  // ---------- the day rail, lying down ----------
  // The old Timeline's ruler, turned on its side under the stamps: a short tick for every day with a place, a longer one
  // for each month, spaced by time (newest on the left) with a floor so busy weeks stay grabbable. Hover wakes it: ticks
  // near the pointer swell, the nearest snaps to ink and a caption rides above it on a damped spring. Click turns the book
  // to that day; drag scrubs tick to tick with the ratchet, and the book turns where you let go.
  (function () {
    var rail = document.getElementById('tb-rail'); if (!rail) return;
    var K = { emptyLen: 7, dayLen: 11, monLen: 20, maxLen: 34, bumpDay: 12, focusDay: 30, curLen: 22, radius: 46, aEmpty: .16, aDay: .62, aMon: .42, aBump: .4, wakeK: 520, focusK: 1600, capK: 1100, pad: 14 };
    var D = [], MS = [], els = [], cap = document.createElement('div'), W = 0, span = 1, t0 = 0;
    cap.className = 'tb-rail-cap'; cap.setAttribute('aria-hidden', 'true'); cap.innerHTML = '<span class="tb-rc-d"></span><span class="tb-rc-p"></span>';
    var capD = cap.firstChild, capP = cap.lastChild, labs = [], hotM = null;
    P.forEach(function (p) { var t = Date.UTC(p.at.y, p.at.m - 1, p.at.d), last = D[D.length - 1]; if (last && last.t === t) last.list.push(p); else D.push({ t: t, p: p, list: [p] }); });
    (function () { var y = months[0].y, m = months[0].m, last = months[months.length - 1]; while (y > last.y || (y === last.y && m >= last.m)) { MS.push({ y: y, m: m, t: Date.UTC(y, m - 1, 1) }); if (--m < 1) { m = 12; y--; } } })();
    // One tick for every calendar day, at one pitch, so the rail is an unbroken line of days: pale where nothing happened,
    // inked where there is a place, taller on the first of a month. Newest on the left.
    var CAL = [], DAY = 86400000;
    function build() {
      W = rail.clientWidth - K.pad * 2; if (W <= 0) return;
      t0 = D[0].t; var lastM = MS[MS.length - 1], tEnd = Math.min(D[D.length - 1].t, lastM.t), n = Math.round((t0 - tEnd) / DAY) + 1, pitch = Math.max(3, Math.min(11, W / Math.max(1, n - 1)));
      var off = K.pad + Math.max(0, (W - pitch * (n - 1)) / 2), byT = {}; D.forEach(function (d, k) { byT[d.t] = k; });
      CAL = []; for (var i = 0; i < n; i++) { var t = t0 - i * DAY, dt = new Date(t); CAL.push({ t: t, x: off + i * pitch, k: byT[t] == null ? -1 : byT[t], first: dt.getUTCDate() === 1, y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1 }); }
      D.forEach(function (d) { d.x = off + Math.round((t0 - d.t) / DAY) * pitch; });
      rail.innerHTML = CAL.map(function (c) { return '<i class="tb-tk' + (c.k >= 0 ? ' is-day' : '') + (c.first ? ' is-m' : '') + '"></i>'; }).join('') + MS.map(function (M) { return '<span class="tb-rail-m">' + (ja() ? M.m + '月' : TL2.mon(M.m)) + '</span>'; }).join('');
      els = [].slice.call(rail.querySelectorAll('.tb-tk')); labs = [].slice.call(rail.querySelectorAll('.tb-rail-m'));
      CAL.forEach(function (c, i) { els[i].style.left = c.x + 'px'; });
      MS.forEach(function (M, k) { var first = null; CAL.forEach(function (c) { if (!first && c.y === M.y && c.m === M.m) first = c; }); labs[k].style.left = (first ? first.x : 0) + 'px'; labs[k].hidden = !first; });   // a month's name sits under its newest day, where reading left to right meets it
      rail.appendChild(cap); paint();
    }
    var wake = 0, wakeV = 0, fx = 0, fxV = 0, cx = 0, cxV = 0, px = null, snap = -1, down = false, raf = 0, last = 0, lastTick = 0, lastX = 0, lastT = 0;
    function curDay() { for (var k = 0; k < D.length; k++) if (D[k].list.indexOf(P[cur]) >= 0) return k; return 0; }
    function nearest(x) { var best = 0, bd = 1e9; D.forEach(function (d, k) { var q = Math.abs(d.x - x); if (q < bd) { bd = q; best = k; } }); return best; }
    function fall(d) { return d >= K.radius ? 0 : .5 + .5 * Math.cos(Math.PI * d / K.radius); }
    function paint() {
      var c = curDay();
      CAL.forEach(function (q, i) { var b = wake * fall(Math.abs(q.x - fx)), isSnap = q.k >= 0 && q.k === snap && wake > .5, isCur = q.k === c;
        var len = isSnap ? K.focusDay : (isCur ? K.curLen : q.first ? K.monLen : q.k >= 0 ? K.dayLen : K.emptyLen) + (q.k >= 0 || q.first ? K.bumpDay : K.bumpDay * .45) * b;
        var a = isSnap || isCur ? 1 : (q.k >= 0 ? K.aDay : q.first ? K.aMon : K.aEmpty) + K.aBump * b * (q.k >= 0 ? 1 : .35);
        els[i].style.transform = 'scaleY(' + (len / K.maxLen).toFixed(3) + ')'; els[i].style.opacity = a.toFixed(3); els[i].classList.toggle('is-cur', isCur); });
      cap.style.transform = 'translateX(' + cx.toFixed(1) + 'px) translateX(-50%) translateY(' + ((1 - wake) * -4).toFixed(1) + 'px)'; cap.style.opacity = wake.toFixed(3);
    }
    function label(k) { var d = D[k], a = d.p.at; capD.textContent = (ja() ? a.m + '月' : '') + day(a) + (ja() ? '' : ' ' + TL2.mon(a.m)); capP.textContent = d.list.length > 1 ? count(d.list.length) : TL2.s(d.p.name); }
    function spring(x, v, to, k, dt) { var c = 2 * Math.sqrt(k); v += ((to - x) * k - v * c) * dt; return [x + v * dt, v]; }   // critically damped: no wobble
    function frame(now) {
      raf = 0; var dt = Math.min(.033, (now - (last || now)) / 1000); last = now;
      var on = px != null ? 1 : 0, tx = px != null ? px : fx, sx = snap >= 0 ? D[snap].x : cx, r;
      if (TL.reduce.matches) { wake = on; fx = tx; cx = sx; }
      else { r = spring(wake, wakeV, on, K.wakeK, dt); wake = r[0]; wakeV = r[1]; r = spring(fx, fxV, tx, K.focusK, dt); fx = r[0]; fxV = r[1]; r = spring(cx, cxV, sx, K.capK, dt); cx = r[0]; cxV = r[1]; }
      paint(); rail.classList.toggle('is-awake', wake > .01);
      if (Math.abs(wake - on) > .002 || Math.abs(wakeV) > .01 || Math.abs(fx - tx) > .2 || Math.abs(cx - sx) > .2) { if (!raf) raf = requestAnimationFrame(frame); } else last = 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    function hot() { MS.forEach(function (M, i) { if (labs[i]) labs[i].classList.toggle('is-on', !!hotM ? (M.y === hotM.y && M.m === hotM.m) : (M.y === P[cur].at.y && M.m === P[cur].at.m)); }); }
    function at(e) { return e.clientX - rail.getBoundingClientRect().left; }
    function move(e) {
      var x = at(e), first = px == null; px = x; if (first) { fx = x; cx = D[nearest(x)].x; }
      var k = nearest(x);
      // a month is a detent: at the boundary the snapped tick holds on a few px longer before it lets go into the next month
      if (snap >= 0 && k !== snap && monthOf(D[k].p.i) !== monthOf(D[snap].p.i) && Math.abs(x - (D[k].x + D[snap].x) / 2) < 6 && Math.abs(k - snap) === 1) k = snap;
      if (k !== snap) { var was = snap; snap = k; label(k);
        var Mh = monthOf(D[k].p.i);
        if (Mh !== hotM) { var dirM = hotM && (Mh.y * 12 + Mh.m) > (hotM.y * 12 + hotM.m) ? 'back' : 'forward', crossed = !!hotM; hotM = Mh; hot();
          previewMonth(Mh, dirM); if (crossed && TL3.cue) { lastTick = performance.now(); TL3.cue('hover2', {}); lastX = x; lastT = lastTick; kick(); return; } }
        var n = performance.now(), vel = Math.abs(x - lastX) / Math.max(1, n - lastT);
        if (TL3.cue && n - lastTick > 30) { lastTick = n; TL3.cue(down ? 'tick' : 'hover', { vel: vel }); } }
      lastX = x; lastT = performance.now(); kick();
    }
    rail.addEventListener('pointerenter', move); rail.addEventListener('pointermove', move);
    rail.addEventListener('pointerdown', function (e) { if (e.button) return; down = true; try { rail.setPointerCapture(e.pointerId); } catch (x) {} move(e); });
    function up(e) { if (!down) return; down = false; var k = snap; if (e.type === 'pointerup' && k >= 0) go(D[k].list[0].i); if (e.pointerType !== 'mouse') leave(); }
    function leave() { if (down) return; px = null; snap = -1; hotM = null; hot(); previewMonth(monthOf(cur)); kick(); }
    rail.addEventListener('click', function (e) { var m = e.target.closest('.tb-rail-m'); if (!m) return; var M = MS[labs.indexOf(m)], B = M && byKey[TL2.key(M.y, M.m)]; if (B) go(B.list[0].i); });
    rail.addEventListener('pointerup', up); rail.addEventListener('pointercancel', up); rail.addEventListener('pointerleave', leave);
    railMark = function () { if (els.length) { paint(); if (px == null) hot(); rail.setAttribute('aria-valuenow', String(curDay())); rail.setAttribute('aria-valuetext', TL2.fullDate(P[cur].at.y, P[cur].at.m, P[cur].at.d) + ', ' + TL2.s(P[cur].name)); } };
    rail.setAttribute('aria-valuemin', '0'); rail.setAttribute('aria-valuemax', String(D.length - 1));
    if ('ResizeObserver' in window) new ResizeObserver(build).observe(rail); else window.addEventListener('resize', build);
    TL.onLang(function () { build(); });
    build(); railMark();
  })();

  renderGallery(); renderInfo(); setStill(); layout();
  html.classList.remove('tl-pre');
  function idle() { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(startBook, { timeout: 1200 }); }
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, { once: true });
})();
