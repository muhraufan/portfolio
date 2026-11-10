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
    en: { shut: 'A pop-up book of the place Raufan was last seen. Press Enter to open it.', open: 'Pop-up book, open. Move over the pieces to play with them. Press Escape to close it.', note: 'Leave a note', past: '{who} was at {place}' },
    ja: { shut: 'ラウファンを最後に見かけた場所の飛び出す絵本。Enterキーで開きます。', open: '飛び出す絵本（開いています）。中のものを動かして遊べます。Escキーで閉じます。', note: 'ひとこと残す', past: '{who}は {place} にいました' }
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
    poster = P.cover(); poster.className = 'pb-poster'; poster.setAttribute('aria-hidden', 'true');
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
  }

  // ---------- the book ----------
  var book = null, inView = false, opened = false, flipT = 0;
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
    load('/last-seen/popup/book.js?v=3').then(function (m) {
      clearTimeout(giveUp); try { performance.measure('pb:import', { start: t0, end: performance.now() }); } catch (e) {}
      if (!fig.classList.contains('pb')) return;         // already fell back to the postcard
      book = m.createBook(stage, { label: say,
        onReady: function () { fig.classList.add('pb-ready'); sync(); },
        onOpen: function () { fig.classList.add('pb-open'); }, onShut: function () { fig.classList.remove('pb-open'); } });
      book.setScene(showing, light()); fig._book = book;
    }, function () { clearTimeout(giveUp); off(); });
  }
  function idle() { (window.requestIdleCallback || function (f) { setTimeout(f, 250); })(function () { settledPage = true; start(); }, { timeout: 1200 }); }
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, { once: true });

  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[es.length - 1].isIntersecting; start(); sync(); }, { threshold: .12 }).observe(card);
  else { inView = true; start(); }
  document.addEventListener('visibilitychange', function () { start(); sync(); });
  // with the guest card out, or on the photography side, the book rests
  new MutationObserver(function () { clearTimeout(flipT); flipT = setTimeout(sync, card.classList.contains('is-flipped') ? 700 : 0); }).observe(card, { attributes: true, attributeFilter: ['class'] });
  // a new light: the sun moves and the shadows swing round. A new language: the book and its card say what they are again.
  new MutationObserver(function (m) {
    if (m.some(function (r) { return r.attributeName === 'data-lang'; })) { if (tuck) tuck.setAttribute('aria-label', say('note')); if (book) book.relabel(); }
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
