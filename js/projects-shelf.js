/* Design Engineering Experiments shelf: the project card.
   Compositor-only motion: transform + opacity, nothing else animates.
   - The card (.ps-card-in) FLIPs from the icon's rect with one uniform scale.
   - The icon itself flies into the card's header slot (shared element) and lands.
   - The backdrop is a dimmed solid; only its opacity fades (CSS transition on [data-shown]).
   - The frosted panel uses a solid fill while moving; blur returns on landing.
   Open 260ms on a low-bounce spring, close 180ms ease-out. Reverses mid-flight. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var SPRING = CSS.supports('transition-timing-function', 'linear(0, 1)')
    ? 'linear(0, 0.157, 0.438, 0.664, 0.815, 0.907, 0.959, 0.987, 1.001, 1.007, 1.008, 1.006, 1.003, 1.001, 1)'
    : 'cubic-bezier(0.2, 0.9, 0.25, 1)';
  var EASE_OUT = 'cubic-bezier(0.2, 0, 0, 1)';
  var OPEN_MS = 260, CLOSE_MS = 180;
  var state = null;

  function rect(el) { var r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }

  // Warm the preview so nothing decodes on the first animated frame.
  function warm(btn) {
    var d = document.getElementById(btn.getAttribute('data-ps-open'));
    if (!d || d._warm) return; d._warm = true;
    d.querySelectorAll('img').forEach(function (im) { im.loading = 'eager'; if (im.decode) im.decode().catch(function () {}); });
  }
  ['pointerenter', 'focusin', 'pointerdown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { var b = e.target.closest && e.target.closest('[data-ps-open]'); if (b) warm(b); }, { passive: true, capture: true });
  });
  // Press-in on pointerdown, the same frame the finger lands.
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('.ps-app[data-ps-open]'); if (!b) return;
    b.setAttribute('data-ps-press', '');
    var up = function () { b.removeAttribute('data-ps-press'); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  });

  function settle(s) {
    s.anims.forEach(function (a) { a.cancel(); });
    s.anims = [];
    if (s.ghost) { s.ghost.remove(); s.ghost = null; }
    s.inner.style.willChange = '';
    s.dlg.removeAttribute('data-moving');
    if (s.dir < 0) {
      // land straight in the resting/hover pose: no 550ms hover transition (and its box-shadow repaint) replaying
      var l = s.lifted; l.setAttribute('data-ps-snap', '');
      l.removeAttribute('data-ps-lifted');
      requestAnimationFrame(function () { requestAnimationFrame(function () { l.removeAttribute('data-ps-snap'); }); });
      if (s.dlg.open) s.dlg.close();
      // the catch: the icon lands back on the shelf with one tiny settle
      if (!reduce.matches && s.face) s.face.animate([{ transform: 'scale(0.94)' }, { transform: 'scale(1.025)', offset: 0.55 }, { transform: 'scale(1)' }], { duration: 240, easing: EASE_OUT, composite: 'add' });
      s.opener.focus({ preventScroll: true });
      state = null;
    }
  }

  function build(s) {
    var dlg = s.dlg, inner = s.inner, c = rect(inner), o = rect(s.origin);
    var slot = dlg.querySelector('.ps-card-icon'), h = rect(slot);   // measure everything before anything moves
    var anims = [];
    if (reduce.matches) {
      anims.push(inner.animate({ opacity: [0, 1] }, { duration: 150, easing: 'linear', fill: 'both' }));
      return anims;
    }
    dlg.setAttribute('data-moving', '');
    inner.style.willChange = 'transform, opacity';
    // 1) container: one uniform scale from the icon, centred on it (no stretch, no layout)
    var k = o.w / c.w;
    var tx = o.x + o.w / 2 - (c.x + c.w * k / 2), ty = o.y + o.h / 2 - (c.y + c.h * k / 2);
    var from = 'translate(' + (tx).toFixed(2) + 'px,' + (ty).toFixed(2) + 'px) scale(' + k.toFixed(4) + ')';
    anims.push(inner.animate([{ transform: from, opacity: 0 }, { opacity: 1, offset: 0.35 }, { transform: 'none', opacity: 1 }], { duration: OPEN_MS, easing: SPRING, fill: 'both' }));
    // 2) shared element: the shelf icon flies into the header slot and lands there
    var img = s.origin.querySelector('img');
    if (img) {
      var g = document.createElement('div'); g.className = 'ps-ghost'; g.setAttribute('aria-hidden', 'true');
      var im = new Image(); im.src = img.currentSrc || img.src; im.alt = ''; im.decoding = 'sync';
      g.appendChild(im);
      g.style.width = h.w + 'px'; g.style.height = h.h + 'px'; g.style.willChange = 'transform';
      dlg.appendChild(g);
      var gk = o.w / h.w;
      anims.push(g.animate([
        { transform: 'translate(' + o.x + 'px,' + o.y + 'px) scale(' + gk + ')' },
        { transform: 'translate(' + h.x + 'px,' + h.y + 'px) scale(1)' }
      ], { duration: OPEN_MS, easing: SPRING, fill: 'both' }));
      s.ghost = g;
    }
    // 3) text arrives after the container lands: 4px rise, 40ms stagger, short
    var parts = dlg.querySelectorAll('.ps-card-head > div, .ps-card-desc, .ps-card-actions');
    parts.forEach(function (el, i) {
      anims.push(el.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 160, delay: 90 + i * 40, easing: EASE_OUT, fill: 'both' }));
    });
    anims.push(dlg.querySelector('.ps-card-close').animate({ opacity: [0, 1] }, { duration: 140, delay: 120, easing: 'linear', fill: 'both' }));
    return anims;
  }

  function watch(s) {
    var mine = s.anims.slice(); if (!mine.length) { settle(s); return; }
    Promise.all(mine.map(function (a) { return a.finished; })).then(function () { if (state === s && s.anims[0] === mine[0]) settle(s); }, function () {});
  }

  function open(btn) {
    var dlg = document.getElementById(btn.getAttribute('data-ps-open'));
    if (!dlg) return;
    if (state && state.dlg === dlg && state.dir < 0) { // reopen mid-close: turn around in place
      state.dir = 1; dlg.setAttribute('data-shown', ''); state.lifted.setAttribute('data-ps-lifted', '');
      state.anims.forEach(function (a) { a.updatePlaybackRate(1); a.reverse(); }); watch(state); return;
    }
    if (state) return;
    warm(btn);
    var origin = btn.querySelector('[data-ps-origin]') || btn;
    var s = state = { dlg: dlg, inner: dlg.querySelector('.ps-card-in'), opener: btn, origin: origin, face: btn.querySelector('.ps-face'),
      lifted: btn, anims: [], ghost: null, dir: 1 };
    dlg.showModal();
    s.inner.focus({ preventScroll: true });
    s.anims = build(s);
    if (!reduce.matches) s.lifted.setAttribute('data-ps-lifted', '');
    btn.removeAttribute('data-ps-press');
    requestAnimationFrame(function () { dlg.setAttribute('data-shown', ''); });
    watch(s);
  }

  function close() {
    var s = state; if (!s || s.dir < 0) return;
    s.dir = -1;
    s.dlg.removeAttribute('data-shown');
    if (s.anims.length) {
      // mid-open: run the same motion backwards from where it is
      s.anims.forEach(function (a) { a.updatePlaybackRate(OPEN_MS / CLOSE_MS); a.reverse(); });
    } else if (reduce.matches) {
      s.anims = [s.inner.animate({ opacity: [1, 0] }, { duration: 150, easing: 'linear', fill: 'both' })];
    } else {
      s.anims = build(s);
      // the open's path, run backwards as its own forward animation so the curve stays ease-out (never ease-in)
      s.anims.forEach(function (a) {
        var kf = a.effect.getKeyframes().map(function (k) { var o = {}; for (var n in k) if (n !== 'computedOffset' && n !== 'easing' && n !== 'composite') o[n] = k[n]; o.offset = 1 - k.computedOffset; return o; }).reverse();
        a.effect.setKeyframes(kf);
        a.effect.updateTiming({ easing: 'cubic-bezier(0.2, 0, 0, 1)', delay: 0, duration: Math.min(a.effect.getTiming().duration, CLOSE_MS) });
        a.currentTime = 0;
      });
    }
    watch(s);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ps-open]');
    if (b) { e.preventDefault(); open(b); return; }
    if (e.target.closest('[data-ps-close]')) { close(); return; }
    if (state && e.target === state.dlg) {
      var r = state.inner.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
    }
  });
  document.querySelectorAll('.ps-card').forEach(function (d) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  });
})();
