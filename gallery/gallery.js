/* Guestbook — the deck of postcard backs, the shuffle, and the opened note.
   Data: live guestbook_entries via guestbookService. Signatures are stored as PNG data URLs;
   each is cropped to its strokes and used as an alpha mask, so it is drawn in the card's ink, crisp at any size.
   A note's stamp is the timeline place current when it was written (TL2.stampFor). */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var grid = $('#g-grid'), countEl = $('#g-count'), shuffleBtn = $('#g-shuffle'), live = $('#g-live'), stateEl = $('#g-state'), shell = $('.g-shell');
  var nv = $('#nv'), dim = $('.nv-dim'), card = $('#nv-card'), layA = $('.nv-a'), cap = $('.nv-cap'), prevB = $('.nv-prev'), nextB = $('.nv-next'), posEl = $('.nv-pos');
  var S = window.LastSeen && LastSeen.newest();

  // ---------- motion ----------
  // a critically-near spring as a linear() curve: zeta < 1 gives a whisper of overshoot (0.8 → 1.5%)
  function spring(zeta, settle) {
    var w = 6.9 / (zeta * settle / 1000), wd = w * Math.sqrt(1 - zeta * zeta), pts = [];
    for (var i = 0; i <= 50; i++) { var t = i / 50 * settle / 1000, e = Math.exp(-zeta * w * t); pts.push((1 - e * (Math.cos(wd * t) + zeta * w / wd * Math.sin(wd * t))).toFixed(4)); }
    pts[50] = '1'; return 'linear(' + pts.join(', ') + ')';
  }
  var SPRING_OPEN = spring(.9, 420), SPRING_SHUF = spring(.78, 720), SPRING_BACK = spring(.96, 340);
  var OUT = 'cubic-bezier(0.2, 0, 0, 1)';

  // ---------- strings ----------
  var T = {
    en: { from: 'From', to: 'To', toName: 'Raufan', toShort: 'Raufan', anon: 'Anonymous', label: 'Guest card', title: 'Thank you for visiting! -Raufan', message: 'Message', signature: 'Signature',
      close: 'Close', prev: 'Previous', next: 'Next', of: ' of ', credit: 'Guestbook · muhraufan.com', seen: 'Last seen · ', grid: 'Visitor notes',
      count: function (n) { return n + ' ' + (n === 1 ? 'note' : 'notes') + ' from visitors'; },
      open: function (n) { return 'Note from ' + n + ', ' ; }, noMsg: 'No message', noSig: 'No signature',
      empty: 'No notes yet.', emptyCta: 'Leave the first one', error: "Couldn't gather the notes.", retry: 'Try again', leave: 'Leave a note →', shuffled: 'Deck shuffled' },
    ja: { from: 'From', to: '', toName: 'ラウファン 様', toShort: 'ラウファン', anon: '名無し', label: 'Guest card', title: '来てくれてありがとう！ -Raufan', message: 'メッセージ', signature: 'サイン',
      close: '閉じる', prev: '前へ', next: '次へ', of: ' / ', credit: 'Guestbook · muhraufan.com', seen: 'Last seen · ', grid: '来訪者のカード',
      count: function (n) { return n + '人の来訪者から届いたカード'; },
      open: function (n) { return n + 'さんからのカード、'; }, noMsg: 'メッセージなし', noSig: 'サインなし',
      empty: 'まだカードがありません。', emptyCta: '最初の一枚を残す', error: 'カードを集められませんでした。', retry: 'もう一度', leave: 'カードを残す →', shuffled: 'シャッフルしました' }
  };
  function lang() { return html.getAttribute('data-lang') === 'ja' ? 'ja' : 'en'; }
  function t() { return T[lang()]; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pmDate(d) { return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getFullYear()).slice(2); }
  function longDate(d) { return d.toLocaleDateString(lang() === 'ja' ? 'ja-JP' : 'en-US', { year: 'numeric', month: lang() === 'ja' ? 'long' : 'short', day: 'numeric' }); }

  // ---------- paper: the homepage scene's own card stock, painted once per light and size ----------
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function dither(x, w, h, amt, seed) { var d = x.getImageData(0, 0, w, h), a = d.data, r = rnd(seed); for (var i = 0; i < a.length; i += 4) { var n = (r() + r() - 1) * amt; a[i] += n; a[i + 1] += n; a[i + 2] += n; } x.putImageData(d, 0, 0); }
  var paperURLs = {};
  function paintPaper(cssW, key) {
    return new Promise(function (res) {
      if (!S) return res(null);
      var cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
      cv.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none;width:' + Math.round(cssW) + 'px;height:' + Math.round(cssW * .75) + 'px';
      document.body.appendChild(cv);
      var p = LastSeen.palette(S), v = (S.variants || {})[LastSeen.period(S)] || {};
      var x = LastSeen.paper(cv, S.paper.concat((v.paperAdd || []).filter(function (a) { return a.t !== 'halo'; })), p, S, { mask: false });
      if (!x) { cv.remove(); return res(null); }
      var w = cv.width, h = cv.height, k = w / 400;
      (v.paperAdd || []).forEach(function (a) {   // night: the lamplight on the card, one smooth gradient
        if (a.t !== 'halo') return;
        var g = x.createRadialGradient(a.x * k, a.y * k, 0, a.x * k, a.y * k, a.rx * k);
        g.addColorStop(0, p[a.fill]); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.save(); x.globalAlpha = Math.min(.22, a.a * a.n * .9); x.translate(a.x * k, a.y * k); x.scale(1, a.ry / a.rx); x.translate(-a.x * k, -a.y * k);
        x.fillStyle = g; x.fillRect(0, 0, w, h * 2); x.restore();
      });
      dither(x, w, h, 3.2, 3);
      html.style.setProperty('--pc-paper', p.paper); html.style.setProperty('--pc-ink', p.paperInk);
      cv.toBlob(function (b) {
        cv.remove(); if (!b) return res(null);
        if (paperURLs[key]) URL.revokeObjectURL(paperURLs[key]);
        var u = paperURLs[key] = URL.createObjectURL(b);
        var img = new Image(); img.onload = img.onerror = function () { html.style.setProperty('--paper-' + key, 'url("' + u + '")'); res(u); }; img.src = u;
      }, 'image/jpeg', .9);
    });
  }
  var paperW = { sm: 0, lg: 0 };
  function paintPapers(force) {
    var sm = Math.max(240, Math.min(420, (grid.firstElementChild && grid.firstElementChild.offsetWidth) || 300)), lg = targetRect().width;
    var jobs = [];
    if (force || Math.abs(sm - paperW.sm) > 40) { paperW.sm = sm; jobs.push(paintPaper(sm, 'sm')); }
    if (force || Math.abs(lg - paperW.lg) > 80) { paperW.lg = lg; jobs.push(paintPaper(lg, 'lg')); }
    return Promise.all(jobs);
  }

  // ---------- signatures: crop to the strokes, keep only the alpha, let CSS ink it ----------
  function processSig(src) {
    return new Promise(function (res) {
      if (!src || src.indexOf('data:image') !== 0) return res(null);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight; if (!w || !h) return res(null);
        var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(img, 0, 0); var d = x.getImageData(0, 0, w, h), a = d.data, x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0;
        for (var y = 0; y < h; y++) for (var i = 0; i < w; i++) { if (a[(y * w + i) * 4 + 3] > 24) { n++; if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
        if (n < 60 || (x1 - x0 < 14 && y1 - y0 < 14)) return res(null);     // a stray tap, not a signature
        var pad = 3; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
        var cw = x1 - x0 + 1, ch = y1 - y0 + 1, o = document.createElement('canvas'); o.width = cw; o.height = ch;
        var ox = o.getContext('2d'), od = ox.createImageData(cw, ch), b = od.data;
        for (var yy = 0; yy < ch; yy++) for (var xx = 0; xx < cw; xx++) { var s = ((yy + y0) * w + xx + x0) * 4, q = (yy * cw + xx) * 4; b[q] = b[q + 1] = b[q + 2] = 0; b[q + 3] = a[s + 3]; }
        ox.putImageData(od, 0, 0);
        o.toBlob(function (bl) { res(bl ? { url: URL.createObjectURL(bl), ar: cw / ch, fw: Math.min(1, cw / w * 1.12) } : null); }, 'image/png');
      };
      img.onerror = function () { res(null); };
      img.src = src;
    });
  }

  // ---------- postmark & stamp ----------
  var RING = 'M 95 40 m -24 0 a 24 24 0 1 1 48 0 a 24 24 0 1 1 -48 0';
  var uid = 0;
  function postmark(n, big) {
    var id = 'pmr' + (++uid), ring = n.place ? n.place.ring : 'MUHRAUFAN.COM · GUESTBOOK · ';
    return '<svg class="g-pm" viewBox="' + (big ? '0 0 150 80' : '58 3 74 74') + '" aria-hidden="true"><defs><path id="' + id + '" d="' + RING + '"/></defs>' +
      '<g fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="95" cy="40" r="31"/><circle cx="95" cy="40" r="18.5" stroke-width="1"/>' +
      (big ? '<path class="pm-waves" d="M2 27c8-4 16 4 24 0s16-4 24 0 12 3 14 2M2 40c8-4 16 4 24 0s16-4 24 0 10 3 13 2M2 53c8-4 16 4 24 0s16-4 24 0 12 3 14 2" stroke-width="1.6" stroke-linecap="round"/>' : '') +
      '</g><text font-size="6.6" fill="currentColor"><textPath href="#' + id + '" startOffset="0" textLength="148" lengthAdjust="spacing">' + esc(ring) + '</textPath></text>' +
      '<text x="95" y="43" text-anchor="middle" font-size="9" letter-spacing=".5" fill="currentColor">' + pmDate(n.date) + '</text></svg>';
  }
  function stamp(n) { return n.place && n.place.img ? '<span class="g-stamp"><img src="' + n.place.img + '" alt=""></span>' : ''; }
  function ink(n) { return n.sig ? '<i class="g-ink" style="--sig:url(&quot;' + n.sig.url + '&quot;);--ar:' + n.sig.ar.toFixed(3) + ';--fw:' + n.sig.fw.toFixed(3) + '"></i>' : ''; }

  // ---------- the small card ----------
  function body(n) {
    var s = t();
    return '<span class="gc-body" aria-hidden="true"><span class="gc-left">' +
      '<span class="gc-msg">' + esc(n.message) + '</span>' +
      '<span class="gc-sig">' + ink(n) + '</span>' +
      '<span class="gc-from"><span class="g-lab">' + s.from + '</span><span class="gc-name' + (n.name ? '' : ' is-anon') + '">' + esc(n.name || s.anon) + '</span></span>' +
      '</span><span class="gc-rule"></span><span class="gc-right">' +
      '<span class="gc-mark' + (n.place && n.place.img ? ' has-stamp' : '') + '">' + stamp(n) + postmark(n, false) + '</span>' +
      '<span class="gc-to"><span class="gc-toname">' + s.toShort + '</span></span>' +
      '</span></span>';
  }
  function label(n) { var s = t(); return s.open(n.name || s.anon) + longDate(n.date) + (n.message ? ': ' + n.message : ''); }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
  function makeCard(n) {
    var a = document.createElement('a');
    a.className = 'gc'; a.href = '#note-' + n.id; a.dataset.id = n.id; a.setAttribute('aria-haspopup', 'dialog');
    var u = hash(String(n.id)), v = hash(n.id + 'p');
    a.style.setProperty('--r', ((u - .5) * 1.0).toFixed(2) + 'deg');          // ±0.5°: a hand-laid deck, never a tilt
    a.style.setProperty('--bp', Math.round(u * 100) + '% ' + Math.round(v * 100) + '%');   // every card a different patch of the same stock
    a.setAttribute('aria-label', label(n));
    a.innerHTML = body(n);
    n.el = a; return a;
  }

  // ---------- data ----------
  var notes = [], byId = {};
  function creditText(n) {
    if (!n.place) return t().credit;
    var c = n.place.credit;
    if (c && typeof c === 'object') return t().seen + (c[lang()] || c.en || '');
    return t().seen + (c || '');
  }
  function normalize(r) {
    var place = window.TL2 && TL2.stampFor ? TL2.stampFor(r.created_at) : null;
    return { id: String(r.id), name: (r.name || '').trim(), message: (r.message || '').trim(), date: new Date(r.created_at), raw: r.signature_data, place: place, sig: null };
  }
  function load() {
    return import('/components/Guestbook/guestbookService.js?v=3').then(function (mod) {
      return mod.getEntries();
    }).then(function (rows) {
      return rows.map(function (e) {
        return normalize({ id: e.id, name: e.name, message: e.message, created_at: e.createdAt, signature_data: e.drawData });
      });
    });
  }

  // one still of a place, cropped the same way as the homepage card back
  var stampURL = {};
  function sceneStamp(key) {
    if (stampURL[key]) return Promise.resolve(stampURL[key]);
    var scene = window.LastSeen && LastSeen.byId && LastSeen.byId(key);
    if (!scene) return Promise.resolve(null);
    return new Promise(function (res) {
      var host = document.createElement('div'); host.className = 'ls-scene'; host.setAttribute('aria-hidden', 'true');
      host.style.cssText = 'position:fixed;left:0;top:0;width:400px;height:300px;opacity:0;pointer-events:none;z-index:-1';
      host.innerHTML = '<canvas style="width:100%;height:100%;display:block"></canvas>'; document.body.appendChild(host);
      var api = LastSeen.mount(host, scene, { manual: true });
      var paint = function () {
        try { api.renderAt(14, 0.1); } catch (e) {}
        var cv = host.querySelector('canvas');
        if (!cv || !cv.width) { host.remove(); return res(null); }
        var W = cv.width, H = cv.height, o = document.createElement('canvas'); o.width = 300; o.height = Math.round(300 * 3.3 / 4);
        var sw = W * 260 / 400, sh = sw * o.height / o.width;
        o.getContext('2d').drawImage(cv, W * 70 / 400, H * 18 / 300, sw, sh, 0, 0, o.width, o.height);
        try { api.pause(); } catch (e) {}
        o.toBlob(function (b) { host.remove(); var u = b ? URL.createObjectURL(b) : null; if (u) stampURL[key] = u; res(u); });
      };
      var go = function () { requestAnimationFrame(function () { requestAnimationFrame(paint); }); };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go); else go();
    });
  }
  function paintStamps(list) {
    var keys = [];
    list.forEach(function (n) { if (n.place && keys.indexOf(n.place.key) < 0) keys.push(n.place.key); });
    return keys.reduce(function (p, key) {
      return p.then(function () { return sceneStamp(key).then(function (u) { if (u) stampURL[key] = u; }); });
    }, Promise.resolve()).then(function () {
      list.forEach(function (n) { if (n.place) n.place.img = stampURL[n.place.key] || null; });
    });
  }

  // ---------- render ----------
  var cards = [], firstView = true;
  function render(list) {
    grid.setAttribute('aria-busy', 'false');
    grid.textContent = '';
    if (!list.length) { grid.hidden = true; showState('empty'); return; }
    var f = document.createDocumentFragment();
    list.forEach(function (n) { f.appendChild(makeCard(n)); });
    var leave = document.createElement('a'); leave.className = 'gc-leave'; leave.href = '/?guestcard=open'; leave.textContent = t().leave; f.appendChild(leave);
    grid.appendChild(f);
    cards = list.map(function (n) { return n.el; });
    shuffleBtn.disabled = list.length < 2;
    countEl.textContent = t().count(list.length);
    if (firstView) entrance();
    firstView = false;
  }
  function entrance() {
    // the first view only: the cards on screen settle in, quickly, in reading order
    var vh = innerHeight, vis = cards.filter(function (c) { var r = c.getBoundingClientRect(); return r.top < vh && r.bottom > 0; });
    var step = vis.length > 1 ? Math.min(26, 150 / (vis.length - 1)) : 0;
    vis.forEach(function (c, i) {
      c.animate(reduce.matches ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }],
        { duration: reduce.matches ? 200 : 340, delay: reduce.matches ? 0 : Math.round(i * step), easing: OUT, fill: 'backwards' });
    });
  }
  function showState(kind) {
    var s = t(); stateEl.hidden = false; stateEl.className = 'g-state is-' + kind;
    shuffleBtn.classList.add('is-moot');
    stateEl.innerHTML = '<span class="gc" aria-hidden="true"></span><p>' + (kind === 'empty' ? esc(s.empty) + '<span class="g-dot" aria-hidden="true">&middot;</span><a class="g-link" href="/?guestcard=open">' + esc(s.emptyCta) + '</a>'
      : esc(s.error) + '<span class="g-dot" aria-hidden="true">&middot;</span><button type="button" class="g-link g-retry">' + esc(s.retry) + '</button>') + '</p>';
    countEl.textContent = kind === 'empty' ? s.count(0) : '';
    var r = stateEl.querySelector('.g-retry'); if (r) r.addEventListener('click', function () { location.href = location.pathname; });
  }

  // ---------- shuffle: one beat ----------
  var shufAnims = [];
  function center(r) { return [r.left + r.width / 2, r.top + r.height / 2]; }
  function shuffle() {
    if (V.state !== 'closed' || cards.length < 2) return;
    var first = new Map(cards.map(function (c) { return [c, center(c.getBoundingClientRect())]; }));   // where they are now, mid-flight included
    shufAnims.forEach(function (a) { a.cancel(); }); shufAnims = [];
    var order = cards.slice();
    for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = order[i]; order[i] = order[j]; order[j] = x; }
    var leave = grid.querySelector('.gc-leave'), f = document.createDocumentFragment();
    order.forEach(function (c) { f.appendChild(c); }); grid.insertBefore(f, leave);
    cards = order;
    var vh = innerHeight, m = 160;
    cards.forEach(function (c, i) {
      var r = c.getBoundingClientRect(), now = center(r), was = first.get(c);
      var seenNow = r.bottom > -m && r.top < vh + m, seenBefore = was[1] > -m && was[1] < vh + m;
      if (!seenNow) return;
      var delay = Math.round(hash(c.dataset.id + i) * 40);
      if (reduce.matches) { shufAnims.push(c.animate([{ opacity: .2 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' })); return; }
      if (seenBefore) shufAnims.push(c.animate([{ transform: 'translate(' + (was[0] - now[0]).toFixed(1) + 'px,' + (was[1] - now[1]).toFixed(1) + 'px)' }, { transform: 'none' }], { duration: 720, delay: delay, easing: SPRING_SHUF, fill: 'backwards' }));
      else shufAnims.push(c.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: 90 + delay, easing: OUT, fill: 'backwards' }));
    });
    if (window.GSound) GSound.riffle();
    live.textContent = t().shuffled;
  }
  shuffleBtn.addEventListener('click', shuffle);
  shuffleBtn.addEventListener('pointerdown', function () { shuffleBtn.classList.add('is-press'); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (e) { shuffleBtn.addEventListener(e, function () { shuffleBtn.classList.remove('is-press'); }); });

  // ---------- the opened note ----------
  var V = { state: 'closed', i: -1, src: null, anims: [], b: null, drag: null };
  function targetRect() {
    var vw = html.clientWidth, vh = innerHeight, phone = vw < 600, capH = 48;
    var W = phone ? vw - 32 : Math.min(800, vw - 96, (vh - capH - 96) * 4 / 3);
    W = Math.max(Math.min(260, vw - 16), W); var H = W * .75;
    return { left: (vw - W) / 2, top: Math.max(16, (vh - H - capH) / 2), width: W, height: H };
  }
  function bigBody(n) {
    var s = t(), credit = creditText(n);
    return '<div class="pb"><div class="pb-left">' +
      '<div class="pb-head"><span class="g-lab">' + s.label + ' · ' + esc(longDate(n.date)) + '</span><span class="pb-title">' + s.title + '</span></div>' +
      '<div class="pb-msg"><span class="g-lab">' + s.message + '</span><p class="pb-text">' + (n.message ? esc(n.message) : '<span class="g-sr">' + s.noMsg + '</span>') + '</p></div>' +
      '<div class="pb-sig"><span class="g-lab">' + s.signature + '</span><span class="pb-sigbox" role="img" aria-label="' + (n.sig ? s.signature : s.noSig) + '">' + ink(n) + '</span></div>' +
      '<div class="pb-from"><span class="g-lab">' + s.from + '</span><span class="pb-name' + (n.name ? '' : ' is-anon') + '">' + esc(n.name || s.anon) + '</span></div>' +
      '</div><div class="pb-rule" aria-hidden="true"><span class="pb-credit">' + esc(credit) + '</span></div><div class="pb-right">' +
      '<div class="pb-mark' + (n.place && n.place.img ? ' has-stamp' : '') + '" aria-hidden="true">' + stamp(n) + postmark(n, true) + '</div>' +
      '<div class="pb-addr" aria-hidden="true"><span>' + (s.to ? '<span class="g-lab">' + s.to + '</span>' : '') + '<span class="pb-toname">' + s.toName + '</span></span></div>' +
      '<div class="pb-actions"><button type="button" class="pb-close">' + s.close + '</button></div></div></div>';
  }
  function placeCard(r) { card.style.left = r.left + 'px'; card.style.top = r.top + 'px'; card.style.width = r.width + 'px'; card.style.height = r.height + 'px'; cap.style.top = (r.top + r.height + 14) + 'px'; }
  function slotTransform(src, r) {
    var b = src.getBoundingClientRect(), w0 = src.offsetWidth, c = center(b);
    var tx = c[0] - (r.left + r.width / 2), ty = c[1] - (r.top + r.height / 2), k = w0 / r.width;
    return { tf: 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) rotate(' + (src.style.getPropertyValue('--r') || '0deg') + ') scale(' + k.toFixed(4) + ')', k: k };
  }
  function setA(src, r) {
    layA.innerHTML = src.innerHTML;
    var w0 = src.offsetWidth; layA.style.width = w0 + 'px'; layA.style.height = (w0 * .75) + 'px'; layA.style.transform = 'scale(' + (r.width / w0) + ')';
  }
  function setB(n) {
    var b = document.createElement('div'); b.className = 'nv-b'; b.innerHTML = bigBody(n);
    b.querySelector('.pb-close').addEventListener('click', function (e) { e.stopPropagation(); close(); });
    return b;
  }
  function stopAll() {   // freeze everything where it is, so the next move starts from what you see
    var cs = { card: getComputedStyle(card).transform, radius: getComputedStyle(card).borderRadius, dim: +getComputedStyle(dim).opacity, a: +getComputedStyle(layA).opacity, b: V.b ? +getComputedStyle(V.b).opacity : 0, cap: +getComputedStyle(cap).opacity };
    V.anims.forEach(function (a) { a.cancel(); }); V.anims = [];
    return cs;
  }
  function anim(el, kf, o) { var a = el.animate(kf, Object.assign({ fill: 'both' }, o)); V.anims.push(a); return a; }
  function syncNav() {
    var s = t(), n = notes.length;
    prevB.textContent = s.prev; nextB.textContent = s.next; posEl.textContent = (V.i + 1) + s.of + n;
    var note = byId[cards[V.i].dataset.id]; nv.setAttribute('aria-label', label(note));
  }
  function open(i, opts) {
    opts = opts || {};
    var src = cards[i]; if (!src) return;
    var n = byId[src.dataset.id], reopening = V.state === 'closing' && V.src === src;
    var cs = nv.hidden ? null : stopAll();
    if (V.src && V.src !== src) V.src.classList.remove('is-src');
    var r = targetRect(); placeCard(r);
    V.i = i; V.src = src; V.state = 'open'; V.n = n;
    if (!reopening) {
      setA(src, r);
      if (V.b) V.b.remove(); V.b = setB(n); card.appendChild(V.b);
    }
    nv.hidden = false; nv.classList.remove('is-closing');
    html.classList.add('is-locked'); shell.inert = true; grid.inert = true;
    var from = slotTransform(src, r), dur = 420;
    src.classList.add('is-src');
    syncNav();
    var pb = V.b.querySelector('.pb');
    if (reduce.matches || opts.instant) {
      anim(card, [{ opacity: cs ? 1 : 0, transform: 'none' }, { opacity: 1, transform: 'none' }], { duration: opts.instant ? 0 : 200, easing: 'ease-out' });
      anim(dim, [{ opacity: cs ? cs.dim : 0 }, { opacity: 1 }], { duration: opts.instant ? 0 : 200, easing: 'ease-out' });
      anim(layA, [{ opacity: 0 }, { opacity: 0 }], { duration: 0 });
      anim(V.b, [{ opacity: 1 }, { opacity: 1 }], { duration: 0 });
      anim(cap, [{ opacity: cs ? cs.cap : 0 }, { opacity: 1 }], { duration: opts.instant ? 0 : 200, easing: 'ease-out' });
      pb.classList.add('is-still');
    } else {
      anim(card, [{ transform: cs ? cs.card : from.tf, borderRadius: cs ? cs.radius : (5 / from.k).toFixed(1) + 'px' }, { transform: 'none', borderRadius: '8px' }], { duration: dur, easing: SPRING_OPEN });
      anim(dim, [{ opacity: cs ? cs.dim : 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
      anim(layA, [{ opacity: cs ? cs.a : 1 }, { opacity: 0 }], { duration: 120, delay: cs ? 0 : 20, easing: 'ease-out' });
      anim(V.b, [{ opacity: cs ? cs.b : 0 }, { opacity: 1 }], { duration: 160, delay: cs ? 0 : 50, easing: 'ease-out' });
      anim(cap, [{ opacity: cs ? cs.cap : 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, delay: cs ? 0 : 140, easing: OUT });
      if (!pb.classList.contains('is-stamped')) {
        // the one beat: the postmark comes down as the card lands, the paper gives a little under it
        clearTimeout(V.stampT);
        V.stampT = setTimeout(function () {
          if (V.state !== 'open') return; pb.classList.add('is-stamped');
          setTimeout(function () { if (V.state === 'open') card.animate([{ translate: '0 0', scale: 1 }, { translate: '0 1.5px', scale: .994 }, { translate: '0 0', scale: 1 }], { duration: 200, easing: 'ease-out' }); }, 60);
        }, 300);
      }
    }
    card.focus({ preventScroll: true });
    if (!opts.keepHash) history.replaceState(null, '', '#note-' + n.id);
  }
  function close() {
    if (V.state !== 'open') return;
    var src = V.src, r = targetRect(), cs = stopAll();
    V.state = 'closing'; clearTimeout(V.stampT);
    nv.classList.add('is-closing'); shell.inert = false; grid.inert = false;
    history.replaceState(null, '', location.pathname + location.search);
    var done = function () {
      if (V.state !== 'closing') return;
      V.state = 'closed'; nv.hidden = true; src.classList.remove('is-src'); stopAll();
      card.style.transform = ''; if (V.b) { V.b.remove(); V.b = null; } layA.textContent = '';
      html.classList.remove('is-locked');
      src.focus({ preventScroll: true });
    };
    if (reduce.matches) {
      anim(card, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-out' });
      anim(dim, [{ opacity: cs.dim }, { opacity: 0 }], { duration: 180, easing: 'ease-out' });
      var a0 = anim(cap, [{ opacity: cs.cap }, { opacity: 0 }], { duration: 180 });
      src.classList.remove('is-src');
      a0.finished.then(done, function () {}); return;
    }
    var to = slotTransform(src, r);
    var m = anim(card, [{ transform: cs.card, borderRadius: cs.radius }, { transform: to.tf, borderRadius: (5 / to.k).toFixed(1) + 'px' }], { duration: 340, easing: SPRING_BACK });
    anim(dim, [{ opacity: cs.dim }, { opacity: 0 }], { duration: 160, easing: 'ease-out' });
    anim(layA, [{ opacity: cs.a }, { opacity: 1 }], { duration: 120, delay: 30, easing: 'ease-out' });
    if (V.b) anim(V.b, [{ opacity: cs.b }, { opacity: 0 }], { duration: 100, easing: 'ease-out' });
    anim(cap, [{ opacity: cs.cap }, { opacity: 0 }], { duration: 90, easing: 'ease-out' });
    // the slot is shown again the moment the flying card is close enough to cover it exactly
    setTimeout(function () { if (V.state === 'closing') done(); }, 380);
    m.finished.then(done, function () {});
  }
  function go(dir) {
    if (V.state !== 'open') return;
    var ni = (V.i + dir + cards.length) % cards.length, src = cards[ni], n = byId[src.dataset.id];
    V.src.classList.remove('is-src'); src.classList.add('is-src');
    // keep the slot it will close into on screen, behind the card
    var rr = src.getBoundingClientRect(); if (rr.top < 0 || rr.bottom > innerHeight) window.scrollBy(0, rr.top < 0 ? rr.top - 48 : rr.bottom - innerHeight + 48);
    V.i = ni; V.src = src; V.n = n;
    var r = targetRect(); setA(src, r);
    card.querySelectorAll('.nv-b').forEach(function (b) { if (b !== V.b) b.remove(); });
    var old = V.b, nb = setB(n); nb.querySelector('.pb').classList.add('is-still'); card.appendChild(nb); V.b = nb;
    var dx = reduce.matches ? 0 : 20 * dir, oldTf = getComputedStyle(old).transform;
    old.getAnimations().forEach(function (a) { a.cancel(); });
    V.anims = V.anims.filter(function (a) { return a.effect && a.effect.target !== old; });
    old.animate([{ opacity: +getComputedStyle(old).opacity || 1, transform: oldTf === 'none' ? 'none' : oldTf }, { opacity: 0, transform: 'translateX(' + (-dx) + 'px)' }], { duration: 140, easing: 'ease-in', fill: 'forwards' }).finished.then(function () { old.remove(); }, function () { old.remove(); });
    anim(nb, [{ opacity: 0, transform: 'translateX(' + dx + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: 50, easing: OUT });
    syncNav();
    live.textContent = posEl.textContent;
    history.replaceState(null, '', '#note-' + n.id);
  }
  prevB.addEventListener('click', function () { go(-1); });
  nextB.addEventListener('click', function () { go(1); });
  dim.addEventListener('click', function () { close(); });
  nv.addEventListener('click', function (e) { if (e.target === nv) close(); });
  card.addEventListener('click', function () { if (V.state === 'closing') open(V.i); });   // catch it mid-flight: it comes back
  document.addEventListener('keydown', function (e) {
    if (V.state !== 'open') return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'Tab') {
      var f = [card.querySelector('.nv-b:last-child .pb-close'), prevB, nextB].filter(Boolean), k = f.indexOf(document.activeElement);
      e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + f.length + (k < 0 && e.shiftKey ? 1 : 0)) % f.length].focus();
    }
  });
  grid.addEventListener('click', function (e) {
    var c = e.target.closest('.gc'); if (!c || c.classList.contains('gc-skel')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;     // a new tab gets the deep link
    e.preventDefault(); open(cards.indexOf(c));
  });
  grid.addEventListener('keydown', function (e) { var c = e.target.closest('.gc'); if (c && e.key === ' ') { e.preventDefault(); c.click(); } });

  // phones: drag down to put it back (it follows the finger, a flick is enough); drag sideways for the next note
  card.addEventListener('pointerdown', function (e) {
    if (V.state !== 'open' || e.pointerType === 'mouse' || e.target.closest('button')) return;
    V.drag = { x: e.clientX, y: e.clientY, axis: null, s: [[e.timeStamp, e.clientX, e.clientY]], id: e.pointerId };
  });
  card.addEventListener('pointermove', function (e) {
    var d = V.drag; if (!d || e.pointerId !== d.id) return;
    var dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.axis) { if (Math.hypot(dx, dy) < 8) return; d.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'; stopAll(); card.setPointerCapture(e.pointerId);
      V.b.querySelector('.pb').classList.add('is-still'); anim(V.b, [{ opacity: 1 }, { opacity: 1 }], { duration: 0 }); anim(layA, [{ opacity: 0 }, { opacity: 0 }], { duration: 0 }); }
    d.s.push([e.timeStamp, e.clientX, e.clientY]); if (d.s.length > 6) d.s.shift();
    var H = card.offsetHeight;
    if (d.axis === 'y') {
      var ty = dy > 0 ? dy : dy * .2, k = 1 - Math.min(.08, Math.max(0, ty) / H * .1);
      card.style.transform = 'translateY(' + ty + 'px) scale(' + k + ')';
      dim.style.opacity = String(1 - Math.min(.8, Math.max(0, ty) / (H * 1.4))); cap.style.opacity = String(1 - Math.min(1, Math.max(0, ty) / 40));
    } else { V.b.style.transform = 'translateX(' + dx * .5 + 'px)'; V.b.style.opacity = String(1 - Math.min(.6, Math.abs(dx) / 500)); }
  });
  function endDrag(e) {
    var d = V.drag; if (!d || e.pointerId !== d.id) return; V.drag = null; if (!d.axis) return;
    var a = d.s[0], b = d.s[d.s.length - 1], dt = Math.max(1, b[0] - a[0]), vx = (b[1] - a[1]) / dt, vy = (b[2] - a[2]) / dt;
    var dx = e.clientX - d.x, dy = e.clientY - d.y, H = card.offsetHeight;
    if (d.axis === 'y') {
      if (dy > H * .28 || (vy > .5 && dy > 24)) { lockStyles(); close(); }
      else { lockStyles(); var cs = stopAll();
        anim(card, [{ transform: cs.card }, { transform: 'none' }], { duration: 340, easing: SPRING_BACK });
        anim(dim, [{ opacity: cs.dim }, { opacity: 1 }], { duration: 200 }); anim(cap, [{ opacity: cs.cap }, { opacity: 1 }], { duration: 200 }); }
    } else {
      if (Math.abs(dx) > 56 || Math.abs(vx) > .45) go(dx < 0 ? 1 : -1);
      else { var tf = getComputedStyle(V.b).transform; V.b.style.transform = ''; V.b.style.opacity = ''; anim(V.b, [{ transform: tf, opacity: 1 }, { transform: 'none', opacity: 1 }], { duration: 360, easing: SPRING_BACK }); }
      if (V.b) { V.b.style.transform = ''; V.b.style.opacity = ''; }
    }
  }
  // turn the finger-driven inline styles into the starting values of the next animation
  function lockStyles() {
    var tf = getComputedStyle(card).transform, o = getComputedStyle(dim).opacity, c = getComputedStyle(cap).opacity;
    card.style.transform = ''; dim.style.opacity = ''; cap.style.opacity = '';
    anim(card, [{ transform: tf }, { transform: tf }], { duration: 0 }); anim(dim, [{ opacity: o }, { opacity: o }], { duration: 0 }); anim(cap, [{ opacity: c }, { opacity: c }], { duration: 0 });
    anim(V.b, [{ opacity: 1 }, { opacity: 1 }], { duration: 0 }); anim(layA, [{ opacity: 0 }, { opacity: 0 }], { duration: 0 });
  }
  card.addEventListener('pointerup', endDrag); card.addEventListener('pointercancel', endDrag);

  addEventListener('resize', function () {
    if (V.state === 'open') { var r = targetRect(); placeCard(r); setA(V.src, r); }
    clearTimeout(V.rz); V.rz = setTimeout(function () { paintPapers(false); }, 200);
  });
  function fromHash(instant) {
    var m = /^#note-(.+)$/.exec(location.hash); if (!m || !byId[m[1]]) return false;
    var c = byId[m[1]].el, i = cards.indexOf(c); if (i < 0) return false;
    if (V.state === 'open') { if (V.i !== i) go(i - V.i); return true; }
    var r = c.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) window.scrollTo(0, scrollY + r.top - (innerHeight - r.height) / 2);
    open(i, { keepHash: true, instant: instant }); return true;
  }
  addEventListener('hashchange', function () { fromHash(false); });

  // ---------- language & light ----------
  function applyLang() {
    var L = lang();
    document.querySelectorAll('[data-en][data-ja]').forEach(function (el) { el.textContent = el.dataset[L]; });
    $('.g-lang').textContent = L === 'ja' ? 'EN' : 'JA'; html.lang = L;
    grid.setAttribute('aria-label', t().grid);
    notes.forEach(function (n) { if (n.el) { n.el.innerHTML = body(n); n.el.setAttribute('aria-label', label(n)); } });
    if (notes.length) countEl.textContent = t().count(notes.length);
    var lv = grid.querySelector('.gc-leave'); if (lv) lv.textContent = t().leave;
    if (!stateEl.hidden) showState(stateEl.classList.contains('is-error') ? 'error' : 'empty');
    if (V.state === 'open') { var b = setB(V.n); b.querySelector('.pb').classList.add('is-still'); V.b.replaceWith(b); V.b = b; setA(V.src, targetRect()); syncNav(); }
    if (L === 'ja' && window.__loadNotoSansJP) window.__loadNotoSansJP();
  }
  $('.g-lang').addEventListener('click', function () { try { localStorage.setItem('lang', lang() === 'ja' ? 'en' : 'ja'); } catch (e) {} html.setAttribute('data-lang', lang() === 'ja' ? 'en' : 'ja'); applyLang(); });
  function restamp() {
    Object.keys(stampURL).forEach(function (k) { if (stampURL[k]) URL.revokeObjectURL(stampURL[k]); delete stampURL[k]; });
    paintStamps(notes).then(function () {
      notes.forEach(function (n) { if (n.el) { n.el.innerHTML = body(n); } });
      if (V.state === 'open' && V.n) { var b = setB(V.n); b.querySelector('.pb').classList.add('is-still'); V.b.replaceWith(b); V.b = b; }
    });
  }
  // Menu, an Auto period boundary, and an OS dark-mode change all write data-tod / data-theme.
  // ?tod= still wins inside PCLight.resolve, so the same attributes are the whole signal. No poll.
  var lightSerial = 0, repaints = 0;
  function onLightChange() {
    var n = ++lightSerial;
    queueMicrotask(function () {
      if (n !== lightSerial) return;
      repaints++;
      paintPapers(true); restamp();
    });
  }
  new MutationObserver(onLightChange).observe(html, { attributes: true, attributeFilter: ['data-tod', 'data-theme'] });

  // ---------- go ----------
  applyLang();
  var papers = paintPapers(true);
  var data = load().then(function (list) {
    list.sort(function (a, b) { return b.date - a.date; });
    return Promise.all(list.map(function (n) { return processSig(n.raw).then(function (sig) { n.sig = sig; n.raw = null; }); }))
      .then(function () {
        // a name, a message, or a real signature. A derived place does not keep a stray tap.
        var kept = list.filter(function (n) { return n.name || n.message || n.sig; });
        return paintStamps(kept).then(function () { return kept; });
      });
  });
  Promise.all([data, papers]).then(function (r) {
    notes = r[0]; notes.forEach(function (n) { byId[n.id] = n; });
    render(notes);
    if (location.hash) requestAnimationFrame(function () { fromHash(true); });
  }, function (err) {
    console.warn('[Guestbook] could not load notes:', err && err.message);
    grid.hidden = true; grid.setAttribute('aria-busy', 'false'); showState('error');
  });

  window.__g = { open: open, close: close, go: go, shuffle: shuffle, V: V, cards: function () { return cards; }, notes: function () { return notes; }, repaints: function () { return repaints; } };
})();
