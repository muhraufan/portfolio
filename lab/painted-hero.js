/* Postcard style drafts (local only): the page.
   One live scene (the engine, animated) painted by the chosen style from /lab/painters.js, plus:
   - the entrance: a veil over the scene replays the picture being made, then lifts so the people step in
   - paper depth: the scene's own layers shift a little with the pointer, and the card tilts with them */
(function () {
  'use strict';
  var STYLES = [
    { id: 'now', name: 'Current', note: 'The stippled drawing on the site today, for comparison.' },
    { id: 'knife', name: 'Palette knife', note: 'Thick oil in slabs, laid inside each shape’s own outline. Walls and sky get the knife; signs, window bars and lettering stay one clean touch.' },
    { id: 'paper', name: 'Cut paper', note: 'Every shape is a piece of coloured paper with a small shadow under it. A collage you could pick apart.' },
    { id: 'popup', name: 'Pop-up book', note: 'A pop-up storybook that opens flat. Click the cover, or pull it across. Once open the book stays put: brush the pieces to flick them, click the people to make them hop, click the shopfront to bring the group out again.' }
  ];
  var html = document.documentElement, stage = document.getElementById('stage'), scene = document.getElementById('scene'), veil = document.getElementById('veil');
  var cap = document.getElementById('cap'), strip = document.getElementById('strip'), lights = document.getElementById('lights'), placeSel = document.getElementById('place');
  var depthBtn = document.getElementById('depth'), replayBtn = document.getElementById('replay'), shutBtn = document.getElementById('shut'), bookEl = document.getElementById('book');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var state = { light: 'midday', place: null, style: 'knife', depth: true }, live = null;
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }

  // ---------- paper depth ----------
  var tgt = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, over = false;
  function parallax() {
    if (!state.depth || reduce.matches) { if (stage.style.transform) stage.style.transform = ''; cur.x = cur.y = 0; return null; }
    var t = performance.now() / 1000, gx = over ? tgt.x : Math.sin(t * .55) * 1.1, gy = over ? tgt.y : Math.cos(t * .4) * .5;   // with no pointer it drifts a little on its own
    cur.x += (gx - cur.x) * .12; cur.y += (gy - cur.y) * .12;
    stage.style.transform = 'perspective(1100px) rotateY(' + (-cur.x * 1.3).toFixed(3) + 'deg) rotateX(' + (cur.y * 1.7).toFixed(3) + 'deg)';
    return cur;
  }
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var rc = stage.getBoundingClientRect(); over = true;
    tgt.x = -((e.clientX - rc.left) / rc.width * 2 - 1) * 2.3; tgt.y = -((e.clientY - rc.top) / rc.height * 2 - 1) * 1.3;
  });
  stage.addEventListener('pointerleave', function () { over = false; });

  // ---------- the live scene ----------
  function mountLive() {
    if (live) { try { live.api.pause(); } catch (e) {} }
    scene.innerHTML = '<canvas></canvas>'; scene._painted = null;
    var opts = { tod: state.light, style: state.style === 'now' || state.style === 'popup' ? null : state.style, parallax: parallax };
    live = { opts: opts, api: LastSeen.mount(scene, LastSeen.byId(state.place), opts) };
  }
  function repaint() { if (state.style === 'popup') return; scene._painted = null; live.opts.tod = state.light; live.opts.style = state.style === 'now' ? null : state.style; live.api.rebuild(); }

  // ---------- the pop-up book (three.js, loaded only when it is chosen) ----------
  var book = null, bookLoad = null;
  function bookThumb() { var t = strip.querySelector('[data-style="popup"] canvas'); if (book && t) book.snapshot(t); }
  function ensureBook() {
    if (!bookLoad) bookLoad = import('/lab/popup-book.js').then(function (m) { book = m.createBook(bookEl, { onOpen: function () { setTimeout(bookThumb, 250); } }); window.__draft.book = book; return book; });
    return bookLoad;
  }
  function showBook(on) {
    stage.classList.toggle('is-book', on); bookEl.hidden = !on; depthBtn.hidden = on; shutBtn.hidden = !on;
    if (on) { stage.style.transform = ''; ensureBook().then(function (b) { b.setActive(true); b.setScene(state.place, state.light); if (!b.isOpen()) setTimeout(function () { b.open(); }, 700); }); }
    else if (book) book.setActive(false);
  }

  // ---------- the entrance: the picture is made in front of you ----------
  var raf = 0;
  function entrance() {
    cancelAnimationFrame(raf);
    var R = scene._painted;
    if (!R || reduce.matches) { veil.style.transition = 'none'; veil.style.opacity = '0'; return; }
    var cw = R.cw, ch = R.ch, sc = scene.querySelector('canvas'), o = veil.getContext('2d');
    veil.width = cw; veil.height = ch;
    var WIN = { back: [0, .46], facade: [.2, .8], front: [.56, 1] }, T = R.style === 'knife' ? 2700 : 1500;
    var L = ['back', 'facade', 'front'].filter(function (n) { return R.layers[n]; }).map(function (n) {
      var l = { n: n, img: R.layers[n], stamps: (R.stamps[n] || []).filter(function (s) { return s[3] * s[4] < cw * ch * .3; }), done: 0, full: false };
      if (R.style === 'knife') {
        l.mask = canvas(cw, ch); l.mx = l.mask.getContext('2d');
        l.wash = canvas(Math.round(cw / 14), Math.round(ch / 14)); var wx = l.wash.getContext('2d'); wx.imageSmoothingQuality = 'high'; wx.drawImage(l.img, 0, 0, l.wash.width, l.wash.height);
      }
      return l;
    });
    var tmp = canvas(cw, ch), tx = tmp.getContext('2d'), t0 = performance.now();
    veil.style.transition = 'none'; veil.style.opacity = '1';
    function frame(now) {
      var p = Math.min(1, (now - t0) / T);
      o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1;
      o.clearRect(0, 0, cw, ch); o.fillStyle = R.ground; o.fillRect(0, 0, cw, ch);
      L.forEach(function (l) {
        var w = WIN[l.n], q = clamp((p - w[0]) / (w[1] - w[0]), 0, 1);
        if (q <= 0) return;
        if (R.style === 'knife') {
          // slab by slab, in the order they were laid; a thin block-in of the colour goes down first
          var want = q >= 1 ? l.stamps.length : Math.floor(l.stamps.length * ease(q));
          l.mx.fillStyle = '#000';
          for (; l.done < want; l.done++) { var s = l.stamps[l.done]; l.mx.save(); l.mx.translate(s[0], s[1]); l.mx.rotate(s[2]); l.mx.fillRect(-s[3] / 2, -s[4] / 2, s[3], s[4]); l.mx.restore(); }
          if (q >= 1 && !l.full) { l.mx.fillRect(0, 0, cw, ch); l.full = true; }
          if (!l.full) { o.globalAlpha = Math.min(.7, q * 4); o.imageSmoothingQuality = 'high'; o.drawImage(l.wash, 0, 0, cw, ch); o.globalAlpha = 1; }
          tx.globalCompositeOperation = 'source-over'; tx.clearRect(0, 0, cw, ch); tx.drawImage(l.mask, 0, 0);
          tx.globalCompositeOperation = 'source-in'; tx.drawImage(l.img, 0, 0);
          o.drawImage(tmp, 0, 0);
        } else if (R.style === 'paper') {
          // each sheet is laid down onto the one behind it
          var e = easeOut(q), dy = (1 - e) * -ch * .05, s2 = 1 + (1 - e) * .03;
          o.save(); o.globalAlpha = Math.min(1, q * 2.4); o.translate(cw / 2, ch / 2 + dy); o.scale(s2, s2); o.drawImage(l.img, -cw / 2, -ch / 2); o.restore();
        } else {
          // one pass of the press per ink, left to right
          var edge = ease(q) * (cw + 60) - 30;
          o.save(); o.beginPath(); o.rect(0, 0, edge, ch); o.clip(); o.drawImage(l.img, 0, 0); o.restore();
        }
      });
      o.globalCompositeOperation = 'destination-in'; o.drawImage(sc, 0, 0, cw, ch);    // the postcard's own torn edge
      if (p < 1) raf = requestAnimationFrame(frame);
      else { veil.style.transition = 'opacity 560ms cubic-bezier(0.2, 0, 0, 1)'; veil.style.opacity = '0'; try { live.api.replay(); } catch (e2) {} }
    }
    raf = requestAnimationFrame(frame);
  }

  // ---------- thumbnails: a still of each style ----------
  function thumbs() {
    STYLES.forEach(function (st, i) {
      if (st.id === 'popup') {
        if (book && book.isOpen()) { setTimeout(bookThumb, 1900); return; }
        var pt = strip.querySelector('[data-style="popup"] canvas'), px = pt.getContext('2d');
        px.clearRect(0, 0, 400, 300); px.fillStyle = 'rgba(128,128,128,.12)'; px.beginPath(); px.roundRect(0, 0, 400, 300, 22); px.fill();
        px.fillStyle = 'rgba(128,128,128,.9)'; px.font = '500 26px "Plus Jakarta Sans", system-ui, sans-serif'; px.textAlign = 'center'; px.fillText('Opens in 3D', 200, 160);
        return;
      }
      setTimeout(function () {
        var S = LastSeen.byId(state.place), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 400, H = 300;
        var host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-20000px;top:0;width:' + (W / dpr) + 'px;height:' + (H / dpr) + 'px';
        host.innerHTML = '<canvas style="width:100%;height:100%;display:block"></canvas>'; document.body.appendChild(host);
        var api = LastSeen.mount(host, S, { manual: true, tod: state.light, style: st.id === 'now' ? null : st.id });
        api.renderAt(S.signature && S.signature.still ? S.signature.still.t : 14, 'still');
        var t = strip.querySelector('[data-style="' + st.id + '"] canvas'), x = t.getContext('2d');
        x.clearRect(0, 0, W, H); x.drawImage(host.querySelector('canvas'), 0, 0, W, H);
        try { api.pause(); } catch (e) {} host.remove();
      }, state.style === 'popup' ? 3200 + i * 500 : 60 + i * 40);   // repainting the other styles is heavy: never while the book is turning its page
    });
  }

  // ---------- controls ----------
  function label() {
    var st = STYLES.filter(function (s) { return s.id === state.style; })[0];
    strip.querySelectorAll('.thumb').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.style === state.style)); });
    cap.innerHTML = '<b></b> <span></span>'; cap.querySelector('b').textContent = st.name + '.'; cap.querySelector('span').textContent = st.note;
  }
  TL2.places().forEach(function (p) {
    if (!LastSeen.byId(p.place) || placeSel.querySelector('[value="' + p.place + '"]')) return;
    var o = document.createElement('option'); o.value = p.place; o.textContent = p.name.en; placeSel.appendChild(o);
  });
  state.place = placeSel.value;
  STYLES.forEach(function (st) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'thumb'; b.dataset.style = st.id;
    b.innerHTML = '<canvas width="400" height="300"></canvas><span></span>'; b.querySelector('span').textContent = st.name;
    b.addEventListener('click', function () { state.style = st.id; label(); if (st.id === 'popup') { showBook(true); return; } showBook(false); repaint(); entrance(); });
    strip.appendChild(b);
  });
  lights.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.light = b.dataset.light;
    lights.querySelectorAll('button').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
    repaint(); html.setAttribute('data-tod', state.light); if (state.style === 'popup') { if (book) book.setScene(state.place, state.light); } else entrance(); thumbs();
  });
  placeSel.addEventListener('change', function () { state.place = placeSel.value; if (state.style !== 'popup') mountLive(); if (state.style === 'popup') { if (book) book.setScene(state.place, state.light); } else entrance(); thumbs(); });
  depthBtn.addEventListener('click', function () { state.depth = !state.depth; depthBtn.setAttribute('aria-pressed', String(state.depth)); });
  replayBtn.addEventListener('click', function () {
    if (state.style !== 'popup') { entrance(); return; }
    if (!book) return;
    if (book.isOpen()) { book.close(); setTimeout(function () { book.open(); }, 1300); } else book.open();
  });
  shutBtn.addEventListener('click', function () { if (book) book.toggle(); });

  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
    label(); mountLive(); entrance(); thumbs();
  });
  window.__draft = { state: state, scene: scene };
})();
