/* Timeline 3 — the one live scene. Stills are pre-rendered images (img/); only the open row runs a live scene.
   A LiveHost owns one mount per scene id inside a fixed-size box (the renderer rebuilds whenever its canvas changes size),
   so switching scenes is just visibility. One rAF loop at ~30 fps, paused when hidden or with reduced motion. */
(function () {
  var TL2 = window.TL2, html = document.documentElement;
  var idle = window.requestIdleCallback || function (f) { return setTimeout(function () { f({ timeRemaining: function () { return 20; } }); }, 60); };
  TL2.tod = function () { return html.getAttribute('data-tod') || 'midday'; };
  TL2.busy = function () { return false; };
  // ---------- live hosts ----------
  var active = null, raf = 0, t0 = performance.now(), lastPaint = 0, hosts = [];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  TL2.LiveHost = function (box) {
    var mounts = {}, shown = null, H = { box: box, mounts: mounts };
    function mount(id) {
      var root = document.createElement('div'); root.className = 'ls-scene tl2-live'; root.style.visibility = 'hidden';
      root.innerHTML = '<canvas draggable="false"></canvas>'; box.appendChild(root);
      var S = LastSeen.byId(id), h = LastSeen.mount(root, S, { manual: true, autoplay: false, tod: TL2.tod() });   // with the home card's own torn-paper vignette
      h.renderAt((performance.now() - t0) / 1000, 'still');
      return (mounts[id] = { id: id, root: root, h: h, S: S, walking: 0, tod: TL2.tod() });
    }
    H.has = function (id) { return !!mounts[id] && mounts[id].tod === TL2.tod(); };
    H.show = function (id) {
      var L = mounts[id] || mount(id);
      if (L.tod !== TL2.tod()) { L.tod = L.h.opts.tod = TL2.tod(); L.h.rebuild(); }
      if (shown && shown !== L) shown.root.style.visibility = 'hidden';
      L.root.style.visibility = ''; shown = L; L.walking = 0; L.h.renderAt((performance.now() - t0) / 1000, 'still');
      return L;
    };
    H.hide = function () { if (shown) shown.root.style.visibility = 'hidden'; if (active === shown) active = null; shown = null; };
    H.shown = function () { return shown; };
    // mount the given scenes ahead of time, one per idle slot, so nothing heavy happens mid-gesture
    H.prewarm = function (ids) {
      var list = ids.filter(function (id, i) { return ids.indexOf(id) === i; });
      (function next() { if (!list.length) return; idle(function () {
        if (TL2.busy()) { setTimeout(next, 250); return; }
        var id = list.shift(); if (!H.has(id)) { var L = mounts[id]; if (L) { L.tod = L.h.opts.tod = TL2.tod(); L.h.rebuild(); } else mount(id); } next();
      }, { timeout: 4000 }); })();
    };
    H.ids = function () { return Object.keys(mounts); };
    hosts.push(H);
    return H;
  };
  // the light changed: the scene on screen is rebuilt now, the rest when they're next needed (or in idle time)
  new MutationObserver(function () {
    hosts.forEach(function (H) { var s = H.shown(); if (s && s.tod !== TL2.tod()) { s.tod = s.h.opts.tod = TL2.tod(); s.h.rebuild(); s.h.renderAt((performance.now() - t0) / 1000, s.walking ? undefined : 'still'); } H.prewarm(H.ids()); });
  }).observe(html, { attributes: true, attributeFilter: ['data-tod'] });

  TL2.animate = function (L) { active = L; if (L && !raf && !reduce.matches) raf = requestAnimationFrame(loop); };
  TL2.walk = function (L) { if (L && !reduce.matches) { L.walking = performance.now(); L.h.renderAt((performance.now() - t0) / 1000, 'still'); L.h.replay(); L.h.pause(); } };   // the figure steps out (open state)
  function loop(now) {
    raf = 0; if (!active || document.hidden || reduce.matches) return;
    if (now - lastPaint > 31) { lastPaint = now; active.h.renderAt((now - t0) / 1000, active.walking ? undefined : 'still'); }
    raf = requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && active && !raf) raf = requestAnimationFrame(loop); });
})();
