/* Timeline: an open entry is the pop-up book, opened at that place. One book for the whole page, carried from row to row.
   Needs /last-seen/popup/paint.js and cover.js; loads /last-seen/popup/book.js (three.js) the first time a row opens.
   list.js asks TL3.book.show(frame, place) once a row has come to rest, and TL3.book.hide() when it closes. If the book
   cannot run (no WebGL, the module fails), show() says no and list.js runs its flat live scene exactly as before. */
(function () {
  'use strict';
  var TL3 = window.TL3, html = document.documentElement; if (!TL3 || !window.LastSeen || !LastSeen.popup || !LastSeen.painters || !LastSeen.painters.popup) return;
  try { var probe = document.createElement('canvas'); if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return; } catch (e) { return; }
  var load; try { load = new Function('u', 'return import(u)'); } catch (e) { return; }
  var LIGHTS = ['morning', 'midday', 'golden', 'night'];
  function light() { var t = html.getAttribute('data-tod'); return LIGHTS.indexOf(t) >= 0 ? t : (html.getAttribute('data-theme') === 'dark' ? 'night' : 'midday'); }
  var SAY = { en: { shut: 'A pop-up book of this place. Press Enter to open it.', open: 'Pop-up book, open. Move over the pieces to play with them.' },
    ja: { shut: 'この場所の飛び出す絵本。Enterキーで開きます。', open: '飛び出す絵本（開いています）。中のものを動かして遊べます。' } };
  function say(k) { return (SAY[html.getAttribute('data-lang') === 'ja' ? 'ja' : 'en'])[k]; }

  var host = document.createElement('div'); host.className = 't3-book';
  var book = null, loading = null, failed = false, want = null, frame = null;   // want: the place the open row is asking for
  function go() {
    if (!book || !want || !frame) return;
    if (host.parentNode !== frame) frame.appendChild(host);
    book.setActive(true); book.setScene(want, light()); book.open();
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { if (book && frame) book.setActive(es[es.length - 1].isIntersecting && !document.hidden); }, { threshold: .05 }) : null;
  if (io) io.observe(host);
  document.addEventListener('visibilitychange', function () { if (book && frame) book.setActive(!document.hidden); });
  new MutationObserver(function () { if (book && want && frame) { book.relabel(); book.setScene(want, light()); } }).observe(html, { attributes: true, attributeFilter: ['data-tod', 'data-theme', 'data-lang'] });

  TL3.book = {
    show: function (fr, p) {
      if (failed || !p || !p.scene || !LastSeen.byId(p.scene)) return false;
      frame = fr; want = p.scene; fr.classList.remove('is-book');
      if (book) { book.shut(); go(); return true; }
      fr.appendChild(host);
      if (!loading) loading = load('/last-seen/popup/book.js?v=5').then(function (m) {
        book = m.createBook(host, { label: say, minFov: 24, onBuilt: function (place) { if (frame && place === want) frame.classList.add('is-book'); } });
        go();
      }, function () { failed = true; host.remove(); });
      return true;
    },
    hide: function () { want = null; if (frame) frame.classList.remove('is-book'); frame = null; if (book) { book.shut(); book.setActive(false); } if (host.parentNode) host.remove(); }
  };
})();
