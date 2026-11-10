/* The hero's pop-up book. The newest "Last seen" place, standing up out of a storybook, in place of the flat postcard scene.
   Needs /last-seen/last-seen.js, the scene files, /last-seen/popup/paint.js and /last-seen/popup/cover.js; loads
   /last-seen/popup/book.js (three.js) on its own, after the page is up.

   - At once: the closed cover, as a flat picture laid exactly where the 3D book will lie, so the hero is never empty.
   - The guest card is a loose card tucked under the book's corner: "Leave a note" (or the corner itself) slides it out and
     lays it in front, and it slides back under when it is closed or posted. js/postcard.js still runs the card itself.
   - The stamps (js/stamp-row.js) are the book's page tabs: one turns the book to that place, the pile opens the Timeline.

   The postcard scene underneath is still there and still running, hidden: the guest card's stamp, the caption and the
   footprints read from it. If WebGL or the book cannot load, the figure drops its "pb" class and everything behaves
   exactly as it did before the book. */
(function () {
  'use strict';
  var html = document.documentElement, fig = document.getElementById('last-seen');
  if (!fig) return;
  var card = fig.querySelector('.pc-card'), stage = fig.querySelector('.pb-stage'), front = fig.querySelector('.pc-front');
  var cap = fig.querySelector('.ls-caption'), nav = fig.querySelector('.pc-stamps'), tuck = null;
  function off() { fig.classList.remove('pb', 'pb-ready', 'pb-open'); if (stage) stage.hidden = true; if (tuck) tuck.remove(); }
  if (/[?&]book=off(&|$)/.test(location.search)) return off();   // a switch for comparing against the plain postcard
  if (!card || !stage || !window.LastSeen || !LastSeen.popup || !LastSeen.painters || !LastSeen.painters.popup) return off();
  try { var probe = document.createElement('canvas'); if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return off(); } catch (e) { return off(); }

  var LIGHTS = ['morning', 'midday', 'golden', 'night'], P = LastSeen.popup, S = LastSeen.newest();
  if (!S) return off();
  var showing = S.id;                                             // the place the book is turned to
  function ja() { return html.getAttribute('data-lang') === 'ja'; }
  // the hero's light: a chosen light, else the scene's own period (the same rule the stamp row follows)
  function light() {
    var t = html.getAttribute('data-tod');
    if (LIGHTS.indexOf(t) < 0) { try { t = LastSeen.period(LastSeen.byId(showing) || S); } catch (e) {} }
    return LIGHTS.indexOf(t) >= 0 ? t : (html.getAttribute('data-theme') === 'dark' ? 'night' : 'midday');
  }
  var SAY = {
    en: { shut: 'A pop-up book of the place Raufan was last seen. Press Enter to open it.', open: 'Pop-up book, open. Move over the pieces to play with them. Press Escape to close it.', note: 'Leave a note', hint: 'Send me a postcard', past: '{who} was at {place}' },
    ja: { shut: 'ラウファンを最後に見かけた場所の飛び出す絵本。Enterキーで開きます。', open: '飛び出す絵本（開いています）。中のものを動かして遊べます。Escキーで閉じます。', note: 'ひとこと残す', hint: 'ポストカードを送ってね', past: '{who}は {place} にいました' }
  };
  function say(k) { return (SAY[ja() ? 'ja' : 'en'])[k]; }

  // ---------- the closed cover, at once ----------
  // A flat canvas mapped onto the four corners the 3D cover will have: same picture, same place, so the real book can fade in over it.
  var PW = 405, PH = 651, poster = null;
  function quad(w, h, q) {                         // the CSS matrix that carries a w x h box onto four points
    function adj(m) { return [m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4], m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5], m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]]; }
    function mm(a, b) { var c = [], i, j, k, v; for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) { v = 0; for (k = 0; k < 3; k++) v += a[3 * i + k] * b[3 * k + j]; c[3 * i + j] = v; } return c; }
    function mv(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; }
    function basis(p) { var m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1], v = mv(adj(m), [p[3][0], p[3][1], 1]); return mm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]); }
    var t = mm(basis(q), adj(basis([[0, 0], [w, 0], [w, h], [0, h]]))); for (var i = 0; i < 9; i++) t[i] /= t[8];
    return 'matrix3d(' + [t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]].join(',') + ')';
  }
  // Where things are, measured on the card: the cover's corners (shut) and the book's front edge (open). The tabs hang
  // from that edge and the guest card is tucked under its right corner, so they go wherever the book goes.
  function layout() {
    var w = stage.clientWidth, h = stage.clientHeight, cw = card.clientWidth, ch = card.clientHeight; if (!w || !h || !cw) return;
    if (poster) poster.style.transform = quad(PW, PH, P.project(P.SHUT, w, h, 0));
    var f = P.project(P.FRONT, w, h, 1), ox = stage.offsetLeft, oy = stage.offsetTop, cx = f[1][0] + ox, cy = f[1][1] + oy;
    fig.style.setProperty('--pb-foot', Math.round(cy - ch) + 'px');
    fig.style.setProperty('--pb-cx', Math.round(cx) + 'px'); fig.style.setProperty('--pb-cy', Math.round(cy) + 'px');
    fig.style.setProperty('--pb-tx', Math.round(cx - cw * .08 - cw / 2) + 'px'); fig.style.setProperty('--pb-ty', Math.round(cy - ch * .31 - ch / 2) + 'px');   // half under the book's right edge, well clear of the tabs
  }
  try {
    poster = P.cover(light()); poster.className = 'pb-poster'; poster.setAttribute('aria-hidden', 'true');
    poster.style.width = PW + 'px'; poster.style.height = PH + 'px'; stage.appendChild(poster);
  } catch (e) { poster = null; }
  layout();
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(stage); else window.addEventListener('resize', layout);

  // ---------- the guest card, tucked under the book ----------
  var noteBtn = cap && cap.querySelector('.pc-note');
  if (noteBtn && front) {
    tuck = document.createElement('button'); tuck.type = 'button'; tuck.className = 'pb-tuck'; tuck.setAttribute('aria-label', say('note'));
    tuck.addEventListener('click', function () { noteBtn.click(); });
    front.appendChild(tuck);
    // a handwritten nudge beside it, with an arrow drawn to the card
    var hint = document.createElement('div'); hint.className = 'pb-hint'; hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = '<span></span><svg viewBox="0 0 60 46" width="60" height="46" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M52 4 C 50 22, 34 34, 10 36"/><path d="M19 28 L 9 36 L 20 42"/></svg>';
    hint.firstChild.textContent = say('hint'); front.appendChild(hint);
    // with the card out, a click anywhere else puts it back (what was written stays on it)
    var closeBtn = fig.querySelector('.pc-close'), backEl = fig.querySelector('.pc-back');
    document.addEventListener('click', function (e) {
      if (!fig.classList.contains('pb') || !card.classList.contains('is-flipped') || card.classList.contains('is-photo') || !closeBtn) return;
      if (backEl.contains(e.target) || e.target.closest('.pc-note-wrap, .pb-tuck') || performance.now() - boxAt < 400) return;   // not the very click on the post box that brought it out
      closeBtn.click();
    });
  }

  // ---------- the book ----------
  var book = null, inView = false, opened = false, flipT = 0, boxAt = -1e9;
  function sync() {
    if (!book || !fig.classList.contains('pb-ready')) return;   // while it is still building, it keeps running
    var on = inView && !document.hidden && !card.classList.contains('is-photo') && !card.classList.contains('is-flipped');
    book.setActive(on);
    if (on && !opened) { opened = true; setTimeout(function () { book.open(); }, 500); }   // it opens by itself the first time it is seen
  }
  var load; try { load = new Function('u', 'return import(u)'); } catch (e) { return off(); }   // dynamic import, kept away from parsers that predate it
  // The book is heavy to set up, so it waits its turn: the page loads and settles first, and the hero has to be on screen.
  // Then it builds itself a slice per frame (book.js) and only takes over from the flat cover once it is whole.
  var started = false, settledPage = false, giveUp = 0;
  function start() {
    if (started || !settledPage || !inView || document.hidden) return; started = true;
    giveUp = setTimeout(function () { if (!book) off(); }, 9000);
    var t0 = performance.now();
    load('/last-seen/popup/book.js?v=7').then(function (m) {
      clearTimeout(giveUp); try { performance.measure('pb:import', { start: t0, end: performance.now() }); } catch (e) {}
      if (!fig.classList.contains('pb')) return;         // already fell back to the postcard
      book = m.createBook(stage, { label: say,
        onPost: function () { if (noteBtn && !card.classList.contains('is-flipped')) { boxAt = performance.now(); noteBtn.click(); } },   // the post box in the book: a second way to the guest card
        onReady: function () { fig.classList.add('pb-ready'); sync(); },
        onOpen: function () { fig.classList.add('pb-open'); }, onShut: function () { fig.classList.remove('pb-open'); } });
      book.setScene(showing, light()); fig._book = book;
    }, function () { clearTimeout(giveUp); off(); });
  }
  // A posted card goes into the book's post box: the card that was written on is the one that flies, and a fresh one
  // then comes out from under the book. street-life.js asks where the slot is, hands over the flight, and is told when it lands.
  var sendAnim = null, sendT = 0, sending = false;
  function stopSend() { clearTimeout(sendT); if (sendAnim) { var a = sendAnim; sendAnim = null; a.onfinish = null; a.cancel(); } sending = false; fig.classList.remove('pb-sent'); }
  function freshCard() {                                   // a new blank card slides out from under the book into the corner
    var el = card.querySelector('.pc-back'), cs = getComputedStyle(card), tuckT = cs.getPropertyValue('--pb-tuck').trim(), under = cs.getPropertyValue('--pb-under').trim(), calm = noMotion.matches;
    var old = sendAnim; sendAnim = null; if (old) { old.onfinish = null; old.cancel(); }
    if (!el.animate || !tuckT || !under) { stopSend(); return; }
    sendAnim = el.animate(calm ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: under, opacity: 0, offset: 0 }, { transform: under, opacity: 1, offset: .12 }, { transform: tuckT, opacity: 1, offset: 1 }],
      { duration: calm ? 200 : 460, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
    fig.classList.remove('pb-sent');                       // the hint and the button come back with it
    sendAnim.onfinish = sendAnim.oncancel = function () { sendAnim = null; sending = false; };
  }
  function sendCard(aim, land) {
    var el = card.querySelector('.pc-back'); stopSend();
    if (!el || !el.animate) { land(); return; }
    if (slide) { slide.cancel(); slide = null; }
    sending = true; fig.classList.add('pb-sent');
    var r = el.getBoundingClientRect(), h = el.offsetHeight, y0 = h * .07, kf = [], N = 20, i;
    var done = function () { land(); sendT = setTimeout(freshCard, noMotion.matches ? 260 : 420); };
    if (noMotion.matches) {                                // calm: the card fades where it is, the flap ticks, a new one fades in at the corner
      sendAnim = el.animate([{ transform: 'translate(0,' + y0 + 'px)', opacity: 1, zIndex: 3 }, { transform: 'translate(0,' + y0 + 'px)', opacity: 0, zIndex: 3 }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
      sendT = setTimeout(done, 500); return;
    }
    // One throw: a small lift, then an arc to the slot. It shrinks early, so most of the way it is a small note on its way to
    // a small box, not a big card being squeezed into one.
    var dx = aim.x - (r.left + r.width / 2), dy = aim.y - (r.top + r.height / 2), end = Math.max(.012, 8 * aim.sc / r.width), up = Math.min(-40, dy) - r.height * .16;
    kf.push({ offset: 0, transform: 'translate(0px,' + y0.toFixed(1) + 'px) rotate(0deg) scale(1)', opacity: 1, zIndex: 3 });
    for (i = 0; i <= N; i++) {
      var u = i / N, v = 1 - Math.pow(1 - u, 2), w = 1 - v;
      var x = 2 * w * v * dx * .3 + v * v * dx, y = 2 * w * v * up + v * v * dy - 7 * w;
      var sc = end + (1.012 - end) * Math.pow(w, 1.3), rot = -5 * Math.sin(Math.PI * Math.min(1, u * 1.5)) * w;
      kf.push({ offset: .14 + .86 * u, transform: 'translate(' + x.toFixed(1) + 'px,' + (y0 + y).toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')', opacity: u > .9 ? Math.max(0, (1 - u) / .1) : 1, zIndex: 3 });
    }
    sendAnim = el.animate(kf, { duration: 640, easing: 'linear', fill: 'forwards' });
    sendAnim.onfinish = done;
  }
  if (window.LastSeenStreet) LastSeenStreet.book = {
    on: function () { return fig.classList.contains('pb') && !card.classList.contains('is-photo'); },
    aim: function () { return (book && book.postSlot && book.postSlot()) || null; },
    send: sendCard,
    land: function () { if (book && book.posted) book.posted(); }
  };
  function idle() { (window.requestIdleCallback || function (f) { setTimeout(f, 250); })(function () { settledPage = true; start(); }, { timeout: 1200 }); }
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, { once: true });

  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[es.length - 1].isIntersecting; start(); sync(); }, { threshold: .12 }).observe(card);
  else { inView = true; start(); }
  document.addEventListener('visibilitychange', function () { start(); sync(); });
  // with the guest card out, or on the photography side, the book rests
  // The card's slide is one animation that can be turned round mid-way: close it while it is still coming out and it goes
  // back from where it is, instead of jumping to the end first.
  var backEl2 = card.querySelector('.pc-back'), slide = null, wasOut = card.classList.contains('is-flipped'), noMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function slideCard(out) {
    if (!backEl2 || !backEl2.animate || noMotion.matches || card.classList.contains('is-photo') || !fig.classList.contains('pb')) { if (slide) { slide.cancel(); slide = null; } return; }
    if (slide && slide.playState === 'running') { slide.playbackRate = out ? 1 : -1; return; }   // mid-move: just reverse
    var cs = getComputedStyle(card), v = function (n) { return cs.getPropertyValue(n).trim(); }, tuck = v('--pb-tuck'), clear = v('--pb-clear'), end = v('--pb-out');
    if (!tuck || !clear || !end) return;
    slide = backEl2.animate([{ transform: tuck, zIndex: 0, offset: 0 }, { transform: clear, zIndex: 0, offset: .38 }, { transform: clear, zIndex: 3, offset: .39 }, { transform: end, zIndex: 3, offset: 1 }],
      { duration: 600, easing: out ? 'cubic-bezier(0.2, 0, 0, 1)' : 'cubic-bezier(0.8, 0, 1, 0.8)', fill: 'none' });
    if (!out) { slide.playbackRate = -1; slide.currentTime = 600; }
    slide.onfinish = slide.oncancel = function () { slide = null; };
  }
  new MutationObserver(function () {
    var out = card.classList.contains('is-flipped');
    if (out !== wasOut) { wasOut = out; if (out && sending) stopSend();        // asked for again before the new card arrived: it comes straight out
      if (!sending) slideCard(out); }                                         // a card on its way to the post box does not also slide home
    clearTimeout(flipT); flipT = setTimeout(sync, out ? 700 : 0);
  }).observe(card, { attributes: true, attributeFilter: ['class'] });
  // a new light: the sun moves and the shadows swing round. A new language: the book and its card say what they are again.
  new MutationObserver(function (m) {
    if (m.some(function (r) { return r.attributeName === 'data-lang'; })) { if (tuck) { tuck.setAttribute('aria-label', say('note')); var hs = fig.querySelector('.pb-hint span'); if (hs) hs.textContent = say('hint'); } if (book) book.relabel(); }
    if (book) book.setScene(showing, light());
  }).observe(html, { attributes: true, attributeFilter: ['data-tod', 'data-theme', 'data-lang'] });
  fig.addEventListener('lastseen:variant', function () { if (book) book.setScene(showing, light()); });   // the auto light crossing into its next period

  // ---------- the stamps as page tabs ----------
  function tabsMark() {
    if (!nav) return;
    nav.querySelectorAll('.pc-st').forEach(function (a) { var im = a.querySelector('img[data-place]'), on = !!im && im.dataset.place === showing;
      a.classList.toggle('is-on', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  // The caption follows the page: on an earlier place it says where he was and when, on the newest it is the page's own line again.
  function pastCaption() {
    var S2 = LastSeen.byId(showing); if (!cap || !S2 || showing === S.id) return;
    var lang = ja() ? 'ja' : 'en', pre = cap.querySelector('.ls-pre'), post = cap.querySelector('.ls-post'), tm = cap.querySelector('time'); if (!pre || !post) return;
    var parts = say('past').replace('{place}', (S2.place[lang] || S2.place.en).replace(/ /g, ' ')).split('{who}');
    pre.textContent = parts[0]; post.textContent = parts[1] || '';
    try { var w = LastSeen.withHTML(LastSeen.companyOf(S2), lang); if (w) post.insertAdjacentHTML('beforeend', w); } catch (e) {}
    if (tm) { tm.textContent = new Date(S2.seenAt).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', { month: lang === 'ja' ? 'numeric' : 'short', day: 'numeric', timeZone: 'Asia/Tokyo' }); tm.dateTime = S2.seenAt; }
  }
  if (cap) cap.addEventListener('lastseen:caption', pastCaption);   // the engine redraws the line every minute and on a language change
  fig.addEventListener('pb:place', function (e) {
    var id = e.detail && e.detail.place; if (!book || !id || id === showing || !LastSeen.byId(id)) return;
    showing = id; tabsMark(); book.setScene(showing, light());
    if (showing === S.id) window.dispatchEvent(new Event('langchange')); else pastCaption();   // 'langchange' has the engine write the newest place's line back
  });
  tabsMark();
})();
