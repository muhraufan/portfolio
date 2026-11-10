/* The hero's pop-up book. The newest "Last seen" place, standing up out of a storybook, in place of the flat postcard scene.
   Needs /last-seen/last-seen.js, the scene files and /last-seen/popup/paint.js; loads /last-seen/popup/book.js (three.js)
   on its own, after the page is up.
   The postcard underneath is still there and still running, hidden: the guest card's stamp, the caption, the footprints
   and the photography side all read from it. If WebGL or the book cannot load, the figure drops its "pb" class and the
   postcard scene shows exactly as it did before. */
(function () {
  'use strict';
  var html = document.documentElement, fig = document.getElementById('last-seen');
  if (!fig) return;
  var card = fig.querySelector('.pc-card'), stage = fig.querySelector('.pb-stage');
  function off() { fig.classList.remove('pb', 'pb-ready'); if (stage) stage.hidden = true; }
  if (!card || !stage || !window.LastSeen || !LastSeen.painters || !LastSeen.painters.popup) return off();
  try { var probe = document.createElement('canvas'); if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return off(); } catch (e) { return off(); }

  var LIGHTS = ['morning', 'midday', 'golden', 'night'], S = LastSeen.newest();
  if (!S) return off();
  // the hero's light: a chosen light, else the scene's own period (the same rule the stamp row follows)
  function light() {
    var t = html.getAttribute('data-tod');
    if (LIGHTS.indexOf(t) < 0) { try { t = LastSeen.period(S); } catch (e) {} }
    return LIGHTS.indexOf(t) >= 0 ? t : (html.getAttribute('data-theme') === 'dark' ? 'night' : 'midday');
  }
  var SAY = {
    en: { shut: 'A pop-up book of the place Raufan was last seen. Press Enter to open it.', open: 'Pop-up book, open. Move over the pieces to play with them. Press Escape to close it.' },
    ja: { shut: 'ラウファンを最後に見かけた場所の飛び出す絵本。Enterキーで開きます。', open: '飛び出す絵本（開いています）。中のものを動かして遊べます。Escキーで閉じます。' }
  };
  function label(k) { return (SAY[html.getAttribute('data-lang')] || SAY.en)[k]; }

  var book = null, inView = false, opened = false, flipT = 0;
  function sync() {
    if (!book) return;
    var on = inView && !document.hidden && !card.classList.contains('is-photo') && !card.classList.contains('is-flipped');
    book.setActive(on);
    if (on && !opened) { opened = true; setTimeout(function () { book.open(); }, 650); }   // it opens by itself the first time it is seen
  }
  var load; try { load = new Function('u', 'return import(u)'); } catch (e) { return off(); }   // dynamic import, kept away from parsers that predate it
  var giveUp = setTimeout(function () { if (!book) off(); }, 9000);
  load('/last-seen/popup/book.js?v=1').then(function (m) {
    clearTimeout(giveUp);
    if (!fig.classList.contains('pb')) return;           // already fell back to the postcard
    book = m.createBook(stage, { label: label });
    book.setScene(S.id, light());
    book.setActive(false);
    requestAnimationFrame(function () { fig.classList.add('pb-ready'); sync(); });
  }, function () { clearTimeout(giveUp); off(); });

  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[es.length - 1].isIntersecting; sync(); }, { threshold: .12 }).observe(card);
  else inView = true;
  document.addEventListener('visibilitychange', sync);
  // turned over to the guest card, or switched to the photography side: the book rests
  new MutationObserver(function () { clearTimeout(flipT); flipT = setTimeout(sync, card.classList.contains('is-flipped') ? 620 : 0); }).observe(card, { attributes: true, attributeFilter: ['class'] });
  // a new light: the sun moves and the shadows swing round. A new language: the book says what it is again.
  new MutationObserver(function (m) {
    if (!book) return;
    if (m.some(function (r) { return r.attributeName === 'data-lang'; })) book.relabel();
    book.setScene(S.id, light());
  }).observe(html, { attributes: true, attributeFilter: ['data-tod', 'data-theme', 'data-lang'] });
  fig.addEventListener('lastseen:variant', function () { if (book) book.setScene(S.id, light()); });   // the auto light crossing into its next period
})();
