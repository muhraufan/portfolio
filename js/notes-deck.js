/* Homepage deck of the latest visitor notes.
   Same postcard back as /cards.html: guestbook rows, TL2.stampFor, the scene stamp,
   and the signature mask. Empty messages with no signature are skipped. */
(function () {
  'use strict';
  var root = document.querySelector('[data-notes]');
  if (!root) return;
  var html = document.documentElement;
  var fan = root.querySelector('.vn-fan');
  var stage = root.querySelector('.vn-stage');
  var countEl = root.querySelector('.vn-n');
  var allLink = root.querySelector('.vn-all');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var OUT = 'cubic-bezier(0.2, 0, 0, 1)';

  var COPY = {
    en: { see: 'See all', intro: '', from: 'From', anon: 'Anonymous', to: 'Raufan',
      empty: 'No notes yet.', emptyCta: 'Leave the first one',
      error: 'The notes didn’t load.', retry: 'Try again',
      open: function (name) { return 'Note from ' + name; } },
    ja: { see: 'すべて見る', from: 'From', anon: '名無し', to: 'ラウファン',
      empty: 'まだメモがありません。', emptyCta: '最初の一枚を残す',
      error: 'メモを読み込めませんでした。', retry: 'もう一度',
      open: function (name) { return name + 'さんからのメモ'; } }
  };
  function lang() { return html.getAttribute('data-lang') === 'ja' ? 'ja' : 'en'; }
  function t() { return COPY[lang()]; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pmDate(d) {
    return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getFullYear()).slice(2);
  }

  var total = 0;
  function paintCount() {
    if (!countEl) return;
    countEl.classList.remove('is-wait');
    countEl.textContent = String(total);
    if (allLink) allLink.setAttribute('aria-label', t().see + ' ' + total);
  }

  function real(entry) {
    var msg = String(entry.message || '').replace(/\s+/g, ' ').trim();
    if (msg) return true;
    var sig = entry.drawData || '';
    return sig.indexOf('data:image') === 0 && sig.length > 180;
  }

  function processSig(src) {
    return new Promise(function (res) {
      if (!src || src.indexOf('data:image') !== 0) return res(null);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h) return res(null);
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(img, 0, 0);
        var d = x.getImageData(0, 0, w, h), a = d.data;
        var x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0, y, i;
        for (y = 0; y < h; y++) for (i = 0; i < w; i++) {
          if (a[(y * w + i) * 4 + 3] > 24) {
            n++;
            if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
        }
        if (n < 60 || (x1 - x0 < 14 && y1 - y0 < 14)) return res(null);
        var pad = 3;
        x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
        x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
        var cw = x1 - x0 + 1, ch = y1 - y0 + 1;
        var o = document.createElement('canvas');
        o.width = cw; o.height = ch;
        var ox = o.getContext('2d'), od = ox.createImageData(cw, ch), b = od.data, yy, xx, s, q;
        for (yy = 0; yy < ch; yy++) for (xx = 0; xx < cw; xx++) {
          s = ((yy + y0) * w + xx + x0) * 4; q = (yy * cw + xx) * 4;
          b[q] = b[q + 1] = b[q + 2] = 0; b[q + 3] = a[s + 3];
        }
        ox.putImageData(od, 0, 0);
        o.toBlob(function (bl) {
          res(bl ? { url: URL.createObjectURL(bl), ar: cw / ch, fw: Math.min(1, cw / w * 1.12) } : null);
        }, 'image/png');
      };
      img.onerror = function () { res(null); };
      img.src = src;
    });
  }

  var RING = 'M 95 40 m -24 0 a 24 24 0 1 1 48 0 a 24 24 0 1 1 -48 0';
  var uid = 0;
  function postmark(note) {
    var id = 'vnpm' + (++uid);
    var ring = note.place && note.place.ring ? note.place.ring : 'MUHRAUFAN.COM · GUESTBOOK · ';
    return '<svg class="g-pm" viewBox="58 3 74 74" aria-hidden="true"><defs><path id="' + id + '" d="' + RING + '"/></defs>' +
      '<g fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="95" cy="40" r="31"/><circle cx="95" cy="40" r="18.5" stroke-width="1"/></g>' +
      '<text font-size="6.6" fill="currentColor"><textPath href="#' + id + '" startOffset="0" textLength="148" lengthAdjust="spacing">' + esc(ring) + '</textPath></text>' +
      '<text x="95" y="43" text-anchor="middle" font-size="9" letter-spacing=".5" fill="currentColor">' + pmDate(note.date) + '</text></svg>';
  }
  function stamp(note) {
    return note.place && note.place.img ? '<span class="g-stamp"><img src="' + note.place.img + '" alt=""></span>' : '';
  }
  function ink(note) {
    return note.sig ? '<i class="g-ink" style="--sig:url(&quot;' + note.sig.url + '&quot;);--ar:' + note.sig.ar.toFixed(3) + ';--fw:' + note.sig.fw.toFixed(3) + '"></i>' : '';
  }
  function body(note) {
    var s = t();
    var name = note.name || s.anon;
    return '<span class="gc-body" aria-hidden="true"><span class="gc-left">' +
      '<span class="gc-msg">' + esc(note.message || '') + '</span>' +
      '<span class="gc-sig">' + ink(note) + '</span>' +
      '<span class="gc-from"><span class="g-lab">' + s.from + '</span><span class="gc-name' + (note.name ? '' : ' is-anon') + '">' + esc(name) + '</span></span>' +
      '</span><span class="gc-rule"></span><span class="gc-right">' +
      '<span class="gc-mark' + (note.place && note.place.img ? ' has-stamp' : '') + '">' + stamp(note) + postmark(note) + '</span>' +
      '<span class="gc-to"><span class="gc-toname">' + esc(s.to) + '</span></span>' +
      '</span></span>';
  }

  function hash(str) {
    var h = 2166136261, i;
    for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967295;
  }

  var stampURL = {};
  function loadScript(src) {
    return new Promise(function (res, rej) {
      if ([].some.call(document.scripts, function (s) { return s.src.indexOf(src) !== -1; })) { res(); return; }
      var el = document.createElement('script');
      el.src = src;
      el.onload = function () { res(); };
      el.onerror = function () { rej(new Error(src)); };
      document.body.appendChild(el);
    });
  }
  function sceneStamp(key) {
    if (stampURL[key]) return Promise.resolve(stampURL[key]);
    var scene = window.LastSeen && LastSeen.byId && LastSeen.byId(key);
    if (!scene || !LastSeen.mount) return Promise.resolve(null);
    return new Promise(function (res) {
      var host = document.createElement('div');
      host.className = 'ls-scene';
      host.setAttribute('aria-hidden', 'true');
      host.style.cssText = 'position:fixed;left:0;top:0;width:400px;height:300px;opacity:0;pointer-events:none;z-index:-1';
      host.innerHTML = '<canvas style="width:100%;height:100%;display:block"></canvas>';
      document.body.appendChild(host);
      var api;
      try { api = LastSeen.mount(host, scene, { manual: true }); } catch (e) { host.remove(); return res(null); }
      var paint = function () {
        try { api.renderAt(14, 0.1); } catch (e) {}
        var cv = host.querySelector('canvas');
        if (!cv || !cv.width) { host.remove(); return res(null); }
        var W = cv.width, H = cv.height, o = document.createElement('canvas');
        o.width = 300; o.height = Math.round(300 * 3.3 / 4);
        var k = W / scene.size[0], b = LastSeen.stampRect ? LastSeen.stampRect(scene, o.width / o.height) : { x: 70, y: 18, w: 260, h: 260 * o.height / o.width };
        o.getContext('2d').drawImage(cv, b.x * k, b.y * k, b.w * k, b.h * k, 0, 0, o.width, o.height);
        try { api.pause(); } catch (e) {}
        o.toBlob(function (b) { host.remove(); var u = b ? URL.createObjectURL(b) : null; if (u) stampURL[key] = u; res(u); });
      };
      var go = function () { requestAnimationFrame(function () { requestAnimationFrame(paint); }); };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go); else go();
    });
  }
  function ensureScenes(keys) {
    var needKit = keys.some(function (k) { return k && k !== 'niko-and-shibuya'; });
    var chain = Promise.resolve();
    if (needKit && !(window.LastSeenKit)) chain = chain.then(function () { return loadScript('/last-seen/scenes/_kit.js?v=9'); });
    keys.forEach(function (key) {
      if (!key || (window.LastSeen && LastSeen.byId && LastSeen.byId(key))) return;
      chain = chain.then(function () { return loadScript('/last-seen/scenes/' + key + '.js?v=8'); });
    });
    return chain.catch(function () {});
  }
  function paintStamps(list) {
    var keys = [];
    list.forEach(function (n) { if (n.place && keys.indexOf(n.place.key) < 0) keys.push(n.place.key); });
    return ensureScenes(keys).then(function () {
      return keys.reduce(function (p, key) {
        return p.then(function () { return sceneStamp(key); });
      }, Promise.resolve());
    }).then(function () {
      list.forEach(function (n) { if (n.place) n.place.img = stampURL[n.place.key] || null; });
    });
  }

  function paintPaper() {
    var S = window.LastSeen && LastSeen.newest && LastSeen.newest();
    if (!S || !LastSeen.paper) return Promise.resolve();
    return new Promise(function (res) {
      var cv = document.createElement('canvas');
      cv.setAttribute('aria-hidden', 'true');
      cv.style.cssText = 'position:fixed;left:-10000px;top:0;width:320px;height:240px;pointer-events:none';
      document.body.appendChild(cv);
      var p = LastSeen.palette(S);
      var v = (S.variants || {})[LastSeen.period(S)] || {};
      var x = LastSeen.paper(cv, S.paper.concat((v.paperAdd || []).filter(function (a) { return a.t !== 'halo'; })), p, S, { mask: false });
      if (!x) { cv.remove(); return res(); }
      if (p) {
        if (p.paper) root.style.setProperty('--pc-paper', p.paper);
        if (p.paperInk) root.style.setProperty('--pc-ink', p.paperInk);
      }
      cv.toBlob(function (b) {
        cv.remove();
        if (!b) return res();
        var u = URL.createObjectURL(b);
        root.style.setProperty('--paper-sm', 'url("' + u + '")');
        res();
      }, 'image/jpeg', 0.86);
    });
  }

  var shown = [];
  function render(list, fresh) {
    var cards = fan.querySelectorAll('.vn-card');
    if (!fresh && cards.length === list.length) {
      list.forEach(function (note, i) {
        cards[i].setAttribute('aria-label', t().open(note.name || t().anon));
        cards[i].innerHTML = '<span class="gc-fit">' + body(note) + '</span>';
      });
      return;
    }
    fan.textContent = '';
    fan.removeAttribute('aria-hidden');
    fan.classList.remove('is-in');
    list.forEach(function (note) {
      var a = document.createElement('a');
      a.className = 'gc vn-card';
      a.href = '/cards.html#note-' + encodeURIComponent(note.id);
      a.setAttribute('aria-label', t().open(note.name || t().anon));
      var u = hash(String(note.id));
      a.style.setProperty('--bp', Math.round(u * 100) + '% ' + Math.round(hash(note.id + 'p') * 100) + '%');
      a.innerHTML = '<span class="gc-fit">' + body(note) + '</span>';
      fan.appendChild(a);
    });
    stage.setAttribute('aria-busy', 'false');
    if (!reduce.matches) requestAnimationFrame(function () { fan.classList.add('is-in'); });
  }

  function showFallback() {
    stage.setAttribute('aria-busy', 'false');
    root.classList.add('is-fallback');
    fan.textContent = '';
    var fb = root.querySelector('.vn-fallback');
    if (fb) fb.hidden = false;
    root.removeAttribute('aria-labelledby');
  }

  function refreshLang() {
    if (root.classList.contains('is-fallback')) return;
    paintCount();
    if (shown.length) render(shown, false);
  }

  function boot() {
    var dataReady = (window.TL2 && TL2.stampFor) ? Promise.resolve() : loadScript('/timeline/lib/data.js?v=9');
    dataReady.then(function () {
      return import('/components/Guestbook/guestbookService.js?v=3');
    }).then(function (mod) {
      return mod.getEntries();
    }).then(function (rows) {
      var notes = (rows || []).filter(real).map(function (e) {
        var place = window.TL2 && TL2.stampFor ? TL2.stampFor(e.createdAt) : null;
        return {
          id: String(e.id),
          name: String(e.name || '').trim(),
          message: String(e.message || '').replace(/\s+/g, ' ').trim(),
          date: new Date(e.createdAt),
          raw: e.drawData,
          place: place,
          sig: null
        };
      });
      total = notes.length;
      paintCount();
      var deck = notes.slice(0, 3);
      if (!deck.length) { showFallback(); return; }
      shown = deck;
      render(deck, true);
      return Promise.all([
        paintPaper(),
        paintStamps(deck),
        Promise.all(deck.map(function (n) {
          return processSig(n.raw).then(function (sig) { n.sig = sig; });
        }))
      ]).then(function () {
        if (!root.classList.contains('is-fallback')) render(deck, false);
      });
    }).catch(function () {
      showFallback();
    });
  }

  // a note just posted from the hero card: count it once it has landed in the postbox, with a small roll
  document.addEventListener('pc:delivered', function (e) {
    var entry = e.detail && e.detail.entry;
    if (!entry || !real(entry) || !countEl || countEl.classList.contains('is-wait')) return;   // still loading: the fetch will include it
    total++;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !countEl.animate) { paintCount(); return; }
    countEl.getAnimations().forEach(function (a) { a.finish(); });
    countEl.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-40%)', opacity: 0 }], { duration: 120, easing: 'cubic-bezier(0.2, 0, 0, 1)' }).onfinish = function () {
      paintCount();
      countEl.animate([{ transform: 'translateY(45%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
    };
  });

  new MutationObserver(refreshLang).observe(html, { attributes: true, attributeFilter: ['data-lang', 'data-tod', 'data-theme'] });
  boot();
})();
