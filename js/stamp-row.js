/* Stamp row: the earlier places (timeline/lib/data.js, newest first, minus the one on the postcard) as stamps
   under the caption, drawn at the hero's light. Miniatures come from scripts/render-stamps.js.
   One shared label glides between stamps on hover / keyboard focus; the pile at the end opens the Timeline.
   A stamp click names itself for a cross-document view transition into its Timeline entry. */
(function () {
  'use strict';
  var nav = document.querySelector('.pc-stamps');
  if (!nav || !window.TL2 || !TL2.places) return;
  var html = document.documentElement, fig = nav.closest('.ls');
  var LIGHTS = ['morning', 'midday', 'golden', 'night'], ROW = 6, TZ = 'Asia/Tokyo';
  var all = TL2.places(), earlier = all.filter(function (p) { return !p.current; });
  if (!earlier.length) { fig.classList.remove('has-stamps'); return; }
  var pile = earlier.slice(ROW, ROW + 3); if (!pile.length) pile = earlier.slice(-3);

  function ja() { return html.getAttribute('data-lang') === 'ja'; }
  function txt(o) { return o ? (o[ja() ? 'ja' : 'en'] || o.en) : ''; }
  function day(d) { return d.toLocaleDateString(ja() ? 'ja-JP' : 'en-US', { month: ja() ? 'numeric' : 'short', day: 'numeric', timeZone: TZ }); }
  function allLabel() { return ja() ? '全' + all.length + 'か所' : 'All ' + all.length + ' places'; }
  // the hero's light: a chosen light, else the postcard scene's own period (dark theme is always night)
  function light() {
    var t = html.getAttribute('data-tod');
    if (!t && window.LastSeen) { try { t = LastSeen.period(LastSeen.byId(all[0].place) || LastSeen.newest()); } catch (e) {} }
    return LIGHTS.indexOf(t) >= 0 ? t : (html.getAttribute('data-theme') === 'dark' ? 'night' : 'midday');
  }
  function src(p, L) { return '/last-seen/stamps/' + p.place + '-' + L + '.webp?v=4'; }
  function img(p, L) { return '<img src="' + src(p, L) + '" data-place="' + p.place + '" alt="" width="48" height="40" decoding="async">'; }

  var L0 = light();
  nav.innerHTML = earlier.slice(0, ROW).map(function (p) {
    return '<a class="pc-st" href="/timeline/#' + p.id + '">' + img(p, L0) + '</a>';
  }).join('') + '<a class="pc-pile" href="/timeline/">' + pile.map(function (p) { return img(p, L0); }).join('') + '</a>';
  var stamps = nav.querySelectorAll('.pc-st'), pileEl = nav.querySelector('.pc-pile');
  function labels() {
    nav.setAttribute('aria-label', ja() ? 'これまでの場所' : 'Earlier places');
    stamps.forEach(function (a, i) { var p = earlier[i]; a.dataset.name = txt(p.name); a.dataset.date = day(p.from); a.setAttribute('aria-label', a.dataset.name + ', ' + a.dataset.date); });
    pileEl.dataset.name = allLabel(); pileEl.dataset.date = ''; pileEl.setAttribute('aria-label', allLabel());
  }
  labels();
  nav.querySelectorAll('img').forEach(function (im) { im.addEventListener('error', function () { var a = im.closest('.pc-st'); if (a) a.hidden = true; else im.hidden = true; }, { once: true }); });

  // ---- light: swap only once the new pictures are decoded, so a change never flashes; the old picture fades out
  // over the new one (an instant swap under reduced motion, still never a gap). URLs are rebuilt from data-place, never edited in place.
  var cur = L0, gen = 0, reduce = matchMedia('(prefers-reduced-motion: reduce)');
  function swapAll(ims, urls) {
    var todo = ims.map(function (im, i) { return [im, urls[i]]; }).filter(function (x) { return x[0].getAttribute('src') !== x[1]; });
    if (!todo.length) return;
    var still = reduce.matches || !nav.animate;   // reduced motion: an instant swap, but the old picture stays until the new one is painted
    // the pile's fan comes from :nth-child, so hold every picture's own turn before any ghost joins it
    var held = ims.map(function (im) { var t = getComputedStyle(im).transform; im.style.transform = t === 'none' ? '' : t; return im; });
    var left = 0, finish = function () { if (--left > 0) return; nav.querySelectorAll('.pc-st-ghost').forEach(function (g) { g.remove(); }); held.forEach(function (im) { im.style.transform = ''; }); };
    todo.forEach(function (x) {
      var im = x[0];
      if (!im.complete || !im.naturalWidth) { im.src = x[1]; return; }
      var ghost = im.cloneNode(false); left++;
      ghost.removeAttribute('data-place'); ghost.setAttribute('aria-hidden', 'true'); ghost.className = 'pc-st-ghost';
      ghost.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;margin:0;pointer-events:none;transition:none;view-transition-name:none;transform:' + (im.style.transform || 'none');
      im.after(ghost); im.src = x[1];
      if (still) { var gone = function () { requestAnimationFrame(finish); }; (im.decode ? im.decode() : Promise.resolve()).then(gone, gone); return; }
      var an = ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out', fill: 'forwards' });
      an.onfinish = an.oncancel = finish;
    });
    if (!left) { left = 1; finish(); }
  }
  function apply() {
    var L = light(); if (L === cur) return; cur = L; var g = ++gen;
    var ims = Array.prototype.slice.call(nav.querySelectorAll('img[data-place]'));
    Promise.all(ims.map(function (im) { var url = src({ place: im.dataset.place }, L), p = new Image(); p.src = url;
      return (p.decode ? p.decode() : Promise.resolve()).then(function () { return url; }, function () { return url; }); }))
      .then(function (urls) { if (g === gen) { nav.querySelectorAll('.pc-st-ghost').forEach(function (x) { x.remove(); }); swapAll(ims, urls); } });
  }
  new MutationObserver(function (m) { if (m.some(function (r) { return r.attributeName === 'data-lang'; })) labels(); apply(); })
    .observe(html, { attributes: true, attributeFilter: ['data-tod', 'data-theme', 'data-lang'] });
  setInterval(apply, 60000);                       // the auto light crossing into the next period
  // warm the other lights once the page is idle
  addEventListener('load', function () { (window.requestIdleCallback || setTimeout)(function () {
    nav.querySelectorAll('img[data-place]').forEach(function (im) { LIGHTS.forEach(function (L) { if (L !== cur) new Image().src = src({ place: im.dataset.place }, L); }); });
  }, { timeout: 3000 }); });

  // ---- the shared label ----
  var tt = document.createElement('div'); tt.className = 'pc-tt'; tt.setAttribute('aria-hidden', 'true');
  tt.innerHTML = '<div class="pc-tt-b"></div>'; nav.appendChild(tt);
  var box = tt.firstChild, at = null, on = false, hideT = 0, PAD = 22;
  function layer(a, cls) {
    var s = document.createElement('span'); s.className = 'pc-tt-l' + (cls ? ' ' + cls : '');
    var n = document.createElement('span'); n.textContent = a.dataset.name; s.appendChild(n);
    if (a.dataset.date) { var d = document.createElement('span'); d.className = 'pc-tt-d'; d.textContent = a.dataset.date; s.appendChild(d); }
    box.appendChild(s); return s;
  }
  function mid(a) { return a.offsetLeft + a.offsetWidth / 2; }
  function place(a, w) { box.style.width = w + 'px'; tt.style.transform = 'translateX(' + Math.round(mid(a) - w / 2) + 'px)'; }
  function show(a) {
    box.textContent = ''; var w = layer(a).offsetWidth + PAD;
    tt.classList.add('no-glide'); box.style.transition = 'none'; place(a, w);
    void tt.offsetWidth; box.style.transition = ''; tt.classList.remove('no-glide');
    tt.classList.add('is-on'); on = true; at = a;
  }
  function swap(a) {
    var dir = mid(a) > mid(at) ? 'r' : 'l';
    box.querySelectorAll('.pc-tt-l.is-out').forEach(function (x) { x.remove(); });        // two layers at most: scrubbing never queues
    box.querySelectorAll('.pc-tt-l').forEach(function (x) { x.classList.add('is-out', dir === 'r' ? 'out-l' : 'out-r'); setTimeout(function () { x.remove(); }, 200); });
    var s = layer(a, 'from-' + dir), w = s.offsetWidth + PAD;
    place(a, w); requestAnimationFrame(function () { requestAnimationFrame(function () { s.classList.remove('from-' + dir); }); });
    at = a;
  }
  function go(a) { clearTimeout(hideT); if (!on) show(a); else if (a !== at) swap(a); }
  function leave() { clearTimeout(hideT); hideT = setTimeout(function () { tt.classList.remove('is-on'); on = false; at = null; }, 70); }   // grace across the gaps
  var hover = matchMedia('(hover: hover) and (pointer: fine)');
  nav.querySelectorAll('.pc-st, .pc-pile').forEach(function (a) {
    a.addEventListener('mouseenter', function () { if (hover.matches) go(a); });
    a.addEventListener('mouseleave', leave);
    a.addEventListener('focus', function () { if (a.matches(':focus-visible')) go(a); });      // keyboard, never a tap
    a.addEventListener('blur', leave);
  });

  // ---- into the Timeline: only a stamp click runs the view transition ----
  var named = null;
  nav.addEventListener('click', function (e) {
    var a = e.target.closest('.pc-st'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    if (named) named.style.viewTransitionName = '';
    named = a.querySelector('img'); named.style.viewTransitionName = 'pc-place';
  });
  addEventListener('pageswap', function (e) { if (e.viewTransition && !named) e.viewTransition.skipTransition(); });
  addEventListener('pagereveal', function (e) { if (e.viewTransition) e.viewTransition.skipTransition(); });
  addEventListener('pageshow', function () { if (named) { named.style.viewTransitionName = ''; named = null; } });
})();
