/* Book and Map are one page. /timeline/ and /timeline/map/ serve the same document; which view is in front is read from the address
   (see the first script in the head) and kept on <html data-view>. The switch in the header changes it in place: the address and the
   title follow, the two halves are told with a `tl:view` event ({ view, id }: the place the other half was on), and nothing is loaded
   again. book-page.js is the book's half; map/map.js is the map's, fetched and built the first time it is wanted and kept from then on,
   so going back and forth costs nothing. Without this script the switch's links still work: they are ordinary links to the two addresses. */
(function () {
  'use strict';
  var html = document.documentElement, sw = document.getElementById('tm-switch'); if (!sw) return;
  var TITLE = { book: 'Timeline — Raufan', map: 'Timeline, on a map — Raufan' }, SKIP = { book: '#t3-list', map: '#tm-info' };
  var skip = document.querySelector('.m-skip-link'), mains = { book: document.getElementById('tl-main'), map: document.getElementById('tm') };
  function viewOf(path) { return /\/timeline\/map\/(index\.html)?$/.test(path) ? 'map' : 'book'; }
  function idOf(hash) { try { return decodeURIComponent(String(hash || '').replace(/^#/, '')); } catch (e) { return ''; } }
  var view = html.getAttribute('data-view') === 'map' ? 'map' : 'book', api = window.TLView = { quietUntil: 0 };

  // ---------- the map's half: its data, then its code, once ----------
  var MAP = '/timeline/map/map.js?v=2', GEO = '/timeline/map/geo.js?v=1', mapP = null, hinted = view === 'map';
  function hint() {                                // about to be wanted (the pointer is on the switch): fetch it, do not run it yet
    if (hinted) return; hinted = true;
    [['preload', GEO, 'script'], ['modulepreload', MAP]].forEach(function (q) { var l = document.createElement('link'); l.rel = q[0]; l.href = q[1]; if (q[2]) l.as = q[2]; document.head.appendChild(l); });
  }
  function loadMap() {
    if (mapP) return mapP;
    mapP = new Promise(function (res, rej) { var s = document.createElement('script'); s.src = GEO; s.onload = res; s.onerror = rej; document.head.appendChild(s); })
      .then(function () { return new Function('u', 'return import(u)')(MAP); });
    mapP.catch(function () { mapP = null; });
    return mapP;
  }

  // ---------- which one is in front ----------
  function dress() {
    html.setAttribute('data-view', view); sw.setAttribute('data-at', view);
    [].forEach.call(sw.querySelectorAll('a'), function (a) { if (a.getAttribute('data-view') === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    for (var k in mains) if (mains[k]) { if (k === view) mains[k].removeAttribute('inert'); else mains[k].setAttribute('inert', ''); }
    if (skip) skip.setAttribute('href', SKIP[view]);
    document.title = TITLE[view];
  }
  function set(v, id) {
    if (v === view) return; view = v; dress();
    document.dispatchEvent(new CustomEvent('tl:view', { detail: { view: v, id: id || '' } }));
    if (v === 'map') loadMap();                   // not built yet: it starts now, and holds its heaviest work until the thumb has landed (api.quietUntil, read by map.js)
  }
  sw.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // a new tab or window is still an ordinary link
    var v = a.getAttribute('data-view'), u; if (v !== 'book' && v !== 'map') return;
    e.preventDefault(); if (v === view) return;
    try { u = new URL(a.href, location.href); history.pushState({ tlView: v }, '', u.pathname + u.hash); } catch (x) { location.href = a.href; return; }
    set(v, idOf(u.hash));
  });
  window.addEventListener('popstate', function () { var v = viewOf(location.pathname); if (v !== view) set(v, idOf(location.hash)); });   // Back and Forward walk the same two views
  // the thumb answers the press, before the release
  sw.addEventListener('pointerdown', function (e) { var a = e.target.closest('a'); if (a && e.button === 0) { api.quietUntil = performance.now() + 260; sw.setAttribute('data-at', a.getAttribute('data-view')); if (a.getAttribute('data-view') === 'map') hint(); } });
  ['pointerleave', 'pointercancel'].forEach(function (n) { sw.addEventListener(n, function () { sw.setAttribute('data-at', view); }); });
  [].forEach.call(sw.querySelectorAll('a[data-view="map"]'), function (a) { a.addEventListener('pointerenter', hint); a.addEventListener('focus', hint); });

  dress();
  if (view === 'map') loadMap();
  api.get = function () { return view; }; api.set = set; api.loadMap = loadMap;
})();
