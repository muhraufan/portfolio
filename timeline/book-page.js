/* Timeline: the book, always open. The page is one pop-up book and a gallery of every place it holds, month by month.
   Pick a place (a stamp in the gallery, the arrows, the arrow keys, or a #place link) and the book turns to it; the
   lines under the book say where, when and with whom.
   Needs /last-seen/last-seen.js, the scene files, /last-seen/popup/paint.js and cover.js, lib/common.js, lib/data.js;
   loads /last-seen/popup/book.js (three.js) once the page is up. Until the book is whole, and wherever it cannot run
   (no WebGL), the place's still picture stands in the same spot. The list-and-rail Timeline this replaced is at the tag
   backup-timeline-live. */
(function () {
  'use strict';
  var html = document.documentElement, TL = window.TL, TL2 = window.TL2, TL3 = window.TL3 || {};
  var P = TL2.places(); if (!P.length) return;
  var stage = document.getElementById('tb-stage'), still = stage.querySelector('img'), info = document.getElementById('tb-info'), gal = document.getElementById('t3-list');
  var prevB = document.querySelector('.tb-prev'), nextB = document.querySelector('.tb-next');
  var LIGHTS = ['morning', 'midday', 'golden', 'night'], WD = { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], ja: ['日', '月', '火', '水', '木', '金', '土'] };
  function ja() { return TL.lang() === 'ja'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function light() { var t = html.getAttribute('data-tod'); return LIGHTS.indexOf(t) >= 0 ? t : (html.getAttribute('data-theme') === 'dark' ? 'night' : 'midday'); }
  function img(p, sz) { return '/timeline/img/' + p.scene + '-' + light() + '-' + sz + '.webp?v=10'; }
  function wd(a) { return new Date(Date.UTC(a.y, a.m - 1, a.d)).getUTCDay(); }
  function day(a) { return ja() ? a.d + '日（' + WD.ja[wd(a)] + '）' : WD.en[wd(a)] + ' ' + a.d; }
  function count(n) { return ja() ? n + 'か所' : n + (n === 1 ? ' place' : ' places'); }

  // ---------- months ----------
  var months = [], byKey = {};
  P.forEach(function (p) { var k = TL2.key(p.at.y, p.at.m), M = byKey[k]; if (!M) { M = byKey[k] = { key: k, y: p.at.y, m: p.at.m, list: [] }; months.push(M); } M.list.push(p); });

  var cur = 0;
  (function () { var h = decodeURIComponent(location.hash.slice(1)); if (!h) return; for (var i = 0; i < P.length; i++) if (P[i].id === h || P[i].place === h) { cur = i; break; } })();

  // ---------- the gallery: every place as a stamp, under its month ----------
  function renderGallery() {
    gal.innerHTML = months.map(function (M) {
      return '<section class="tb-m" aria-label="' + esc(TL2.monthTitle(M.y, M.m)) + '"><h2 class="tb-mh"><span class="tb-mh-n">' + TL2.monthTitle(M.y, M.m) + '</span><span class="tb-mh-c">' + count(M.list.length) + '</span></h2><ul class="tb-grid">' +
        M.list.map(function (p) {
          return '<li><button type="button" class="tb-st" data-i="' + p.i + '" aria-label="' + esc(TL2.s(p.name) + ', ' + TL2.fullDate(p.at.y, p.at.m, p.at.d)) + '">' +
            '<span class="tb-st-pic"><img alt="" width="80" height="60" decoding="async" loading="lazy" src="' + img(p, 's') + '"></span>' +
            '<span class="tb-st-d">' + day(p.at) + '</span><span class="tb-st-n">' + esc(TL2.s(p.name)) + '</span></button></li>';
        }).join('') + '</ul></section>';
    }).join('');
    mark();
  }
  function mark() {
    gal.querySelectorAll('.tb-st').forEach(function (b) { var on = +b.dataset.i === cur; b.classList.toggle('is-on', on); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    prevB.disabled = cur <= 0; nextB.disabled = cur >= P.length - 1;
  }
  // ---------- the lines under the book ----------
  function renderInfo() {
    var p = P[cur], lang = ja() ? 'ja' : 'en', w = '';
    try { if (p.with && window.LastSeen && LastSeen.withHTML) w = LastSeen.withHTML(p.with, lang, 't3-with-a'); } catch (e) {}
    info.innerHTML = '<p class="tb-date">' + (ja() ? TL2.fullDate(p.at.y, p.at.m, p.at.d) + '（' + WD.ja[wd(p.at)] + '）' : WD.en[wd(p.at)] + ', ' + TL2.fullDate(p.at.y, p.at.m, p.at.d)) +
      '<span class="tb-page">' + (P.length - cur) + ' / ' + P.length + '</span></p>' +
      '<h2 class="tb-name">' + esc(TL2.s(p.name)) + (w ? '<span class="tb-with">' + w + '</span>' : '') + '</h2><p class="tb-area">' + esc(TL2.s(p.area)) + '</p>';
    document.querySelector('.t3-lede').textContent = ja()
      ? 'これまで見かけられた場所を一冊に。' + P.length + 'か所、' + TL2.monthTitle(months[months.length - 1].y, months[months.length - 1].m) + 'から。'
      : 'Every place I’ve been last seen, in one book. ' + P.length + ' places since ' + TL2.monthTitle(months[months.length - 1].y, months[months.length - 1].m) + '.';
    prevB.setAttribute('aria-label', ja() ? '新しい場所へ' : 'Newer place'); nextB.setAttribute('aria-label', ja() ? '前の場所へ' : 'Earlier place');
  }
  function setStill() { var p = P[cur]; if (p.scene) still.src = img(p, 'l'); }

  // ---------- the book ----------
  var book = null, failed = false, SAY = { en: { shut: 'A pop-up book of every place. Press Enter to open it.', open: 'Pop-up book, open. Move over the pieces to play with them.' },
    ja: { shut: 'すべての場所の飛び出す絵本。Enterキーで開きます。', open: '飛び出す絵本（開いています）。中のものを動かして遊べます。' } };
  function say(k) { return (SAY[ja() ? 'ja' : 'en'])[k]; }
  function turn() { var p = P[cur]; if (book && p.scene && LastSeen.byId(p.scene)) { book.setScene(p.scene, light()); book.open(); } }
  function go(i, o) {
    i = Math.max(0, Math.min(P.length - 1, i)); if (i === cur && !(o && o.force)) return;
    var dir = i > cur ? 'forward' : 'back'; cur = i;
    mark(); renderInfo(); setStill(); turn();
    try { history.replaceState(null, '', '#' + P[cur].id); } catch (e) {}
    if (window.SiteSound && !(o && o.quiet)) SiteSound.cue('navigate', { direction: dir });
    if (o && o.reveal) { var r = stage.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight) window.scrollTo({ top: Math.max(0, scrollY + r.top - 110), behavior: TL.reduce.matches ? 'auto' : 'smooth' }); }
  }
  function startBook() {
    if (failed || book || !window.LastSeen || !LastSeen.popup || !LastSeen.painters || !LastSeen.painters.popup) return;
    try { var c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) return; } catch (e) { return; }
    var load; try { load = new Function('u', 'return import(u)'); } catch (e) { return; }
    load('/last-seen/popup/book.js?v=5').then(function (m) {
      book = m.createBook(stage, { label: say, minFov: 24, onBuilt: function () { stage.classList.add('is-book'); } });
      turn();
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { book.setActive(es[es.length - 1].isIntersecting && !document.hidden); }, { threshold: .05 }).observe(stage);
      document.addEventListener('visibilitychange', function () { book.setActive(!document.hidden); });
    }, function () { failed = true; });
  }

  // ---------- hands ----------
  gal.addEventListener('click', function (e) { var b = e.target.closest('.tb-st'); if (b) go(+b.dataset.i, { reveal: true }); });
  prevB.addEventListener('click', function () { go(cur - 1); }); nextB.addEventListener('click', function () { go(cur + 1); });
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) return;
    if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); } else if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); }
  });
  window.addEventListener('hashchange', function () { var h = decodeURIComponent(location.hash.slice(1)); for (var i = 0; i < P.length; i++) if (P[i].id === h) { go(i, { quiet: true }); break; } });
  // a new light: the stills follow, and the sun moves in the book. A new language: every line is written again.
  new MutationObserver(function (m) {
    if (m.some(function (r) { return r.attributeName === 'data-lang'; })) { renderGallery(); renderInfo(); if (book) book.relabel(); return; }
    gal.querySelectorAll('.tb-st img').forEach(function (im, k) { var b = im.closest('.tb-st'); im.src = img(P[+b.dataset.i], 's'); });
    setStill(); if (book) turn();
  }).observe(html, { attributes: true, attributeFilter: ['data-tod', 'data-theme', 'data-lang'] });

  renderGallery(); renderInfo(); setStill();
  html.classList.remove('tl-pre');
  function idle() { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(startBook, { timeout: 1200 }); }
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, { once: true });
})();
