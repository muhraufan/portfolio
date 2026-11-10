/* Timeline: the book, always open, and nothing to scroll. The book fills the screen. Ribbon bookmarks hang from its
   front edge, one per month; under it is one row of stamps, the places of the month it is open at, scrolling sideways.
   Pull a ribbon and the book turns to that month; pick a stamp (or the arrows, the arrow keys, a #place link) and it
   turns to that place; the lines under the book say where, when and with whom.
   Needs /last-seen/last-seen.js, the scene files, /last-seen/popup/paint.js and cover.js, lib/common.js, lib/data.js;
   loads /last-seen/popup/book.js (three.js) once the page is up. Until the book is whole, and wherever it cannot run
   (no WebGL), the place's still picture stands in the same spot. The list-and-rail Timeline this replaced is at the tag
   backup-timeline-live. */
(function () {
  'use strict';
  var html = document.documentElement, TL = window.TL, TL2 = window.TL2, TL3 = window.TL3 || {};
  var P = TL2.places(); if (!P.length) return;
  var stage = document.getElementById('tb-stage'), still = stage.querySelector('img'), info = document.getElementById('tb-info'), gal = document.getElementById('t3-list');
  var prevB = document.querySelector('.tb-prev'), nextB = document.querySelector('.tb-next'), ribbons = document.getElementById('tb-ribbons'), monthEl = document.getElementById('tb-month');
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

  // ---------- the ribbons: one bookmark per month, hanging from the book's front edge ----------
  var RIB = ['#c8553d', '#2f6f73', '#e0a93b', '#6b4a7c', '#7d9a6a', '#27324c'], MON_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function monthOf(i) { var p = P[i]; return byKey[TL2.key(p.at.y, p.at.m)]; }
  function renderRibbons() {
    ribbons.innerHTML = months.map(function (M) {
      return '<button type="button" class="tb-rib" data-k="' + M.key + '" style="--rib:' + RIB[(M.m + M.y) % RIB.length] + '" aria-label="' + esc(TL2.monthTitle(M.y, M.m) + ', ' + count(M.list.length)) + '">' +
        '<span class="tb-rib-t">' + (ja() ? M.m + '月' : MON_EN[M.m - 1]) + '</span><span class="tb-rib-y">\u2019' + String(M.y).slice(2) + '</span></button>';
    }).join('');
  }
  // ---------- the strip: the places of the month the book is open at ----------
  var stripKey = null;
  function renderStrip(dir) {
    var M = monthOf(cur); if (stripKey === M.key) return; var first = stripKey == null; stripKey = M.key;
    monthEl.innerHTML = '<span class="tb-mh-n">' + TL2.monthTitle(M.y, M.m) + '</span><span class="tb-mh-c">' + count(M.list.length) + '</span>';
    gal.innerHTML = M.list.map(function (p) {
      return '<button type="button" class="tb-st" data-i="' + p.i + '" aria-label="' + esc(TL2.s(p.name) + ', ' + TL2.fullDate(p.at.y, p.at.m, p.at.d)) + '">' +
        '<span class="tb-st-pic"><img alt="" width="80" height="60" decoding="async" src="' + img(p, 's') + '"></span><span class="tb-st-d">' + day(p.at) + '</span></button>';
    }).join('');
    if (!first && !TL.reduce.matches && gal.animate) gal.animate([{ opacity: 0, transform: 'translateX(' + (dir === 'back' ? -28 : 28) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
  }
  function renderGallery() { stripKey = null; renderRibbons(); mark(); }
  function mark(dir) {
    renderStrip(dir);
    var M = monthOf(cur);
    ribbons.querySelectorAll('.tb-rib').forEach(function (b) { var on = +b.dataset.k === M.key; b.classList.toggle('is-on', on); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    gal.querySelectorAll('.tb-st').forEach(function (b) { var on = +b.dataset.i === cur; b.classList.toggle('is-on', on);
      if (on) { b.setAttribute('aria-current', 'true'); gal.scrollTo({ left: b.offsetLeft - (gal.clientWidth - b.offsetWidth) / 2, behavior: TL.reduce.matches ? 'auto' : 'smooth' }); } else b.removeAttribute('aria-current'); });
    prevB.disabled = cur <= 0; nextB.disabled = cur >= P.length - 1;
  }
  // where the open book's front edge is on the stage: the ribbons hang from it
  function layout() {
    var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h || !window.LastSeen || !LastSeen.popup) return;
    var f = LastSeen.popup.project(LastSeen.popup.FRONT, w, h, 1);
    var sr = stage.getBoundingClientRect(), br = stage.parentNode.getBoundingClientRect();
    ribbons.style.left = Math.round(sr.left - br.left + f[0][0] + (f[1][0] - f[0][0]) * .07) + 'px'; ribbons.style.top = Math.round(sr.top - br.top + f[0][1] - 2) + 'px';
  }
  // ---------- the lines under the book ----------
  function renderInfo() {
    var p = P[cur], lang = ja() ? 'ja' : 'en', w = '';
    try { if (p.with && window.LastSeen && LastSeen.withHTML) w = LastSeen.withHTML(p.with, lang, 't3-with-a'); } catch (e) {}
    info.innerHTML = '<p class="tb-date">' + (ja() ? TL2.fullDate(p.at.y, p.at.m, p.at.d) + '（' + WD.ja[wd(p.at)] + '）' : WD.en[wd(p.at)] + ', ' + TL2.fullDate(p.at.y, p.at.m, p.at.d)) +
      '<span class="tb-page">' + (P.length - cur) + ' / ' + P.length + '</span></p>' +
      '<h2 class="tb-name">' + esc(TL2.s(p.name)) + (w ? '<span class="tb-with">' + w + '</span>' : '') + '</h2><p class="tb-area">' + esc(TL2.s(p.area)) + '</p>';
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
    mark(dir); renderInfo(); setStill(); turn();
    try { history.replaceState(null, '', '#' + P[cur].id); } catch (e) {}
    if (window.SiteSound && !(o && o.quiet)) SiteSound.cue('navigate', { direction: dir });
  }
  function startBook() {
    if (failed || book || !window.LastSeen || !LastSeen.popup || !LastSeen.painters || !LastSeen.painters.popup) return;
    try { var c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) return; } catch (e) { return; }
    var load; try { load = new Function('u', 'return import(u)'); } catch (e) { return; }
    load('/last-seen/popup/book.js?v=5').then(function (m) {
      book = m.createBook(stage, { label: say, onBuilt: function () { stage.classList.add('is-book'); } });
      turn();
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { book.setActive(es[es.length - 1].isIntersecting && !document.hidden); }, { threshold: .05 }).observe(stage);
      document.addEventListener('visibilitychange', function () { book.setActive(!document.hidden); });
    }, function () { failed = true; });
  }

  // ---------- hands ----------
  gal.addEventListener('click', function (e) { var b = e.target.closest('.tb-st'); if (b) go(+b.dataset.i); });
  ribbons.addEventListener('click', function (e) { var b = e.target.closest('.tb-rib'); if (!b) return; var M = byKey[+b.dataset.k]; if (M && M !== monthOf(cur)) go(M.list[0].i); });   // a ribbon opens its month at its newest place
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(stage); else window.addEventListener('resize', layout);
  prevB.addEventListener('click', function () { go(cur - 1); }); nextB.addEventListener('click', function () { go(cur + 1); });
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) return;
    if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); } else if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); }
  });
  window.addEventListener('hashchange', function () { var h = decodeURIComponent(location.hash.slice(1)); for (var i = 0; i < P.length; i++) if (P[i].id === h) { go(i, { quiet: true }); break; } });
  // a new light: the stills follow, and the sun moves in the book. A new language: every line is written again.
  new MutationObserver(function (m) {
    if (m.some(function (r) { return r.attributeName === 'data-lang'; })) { renderGallery(); renderInfo(); if (book) book.relabel(); return; }
    gal.querySelectorAll('.tb-st img').forEach(function (im) { var b = im.closest('.tb-st'); im.src = img(P[+b.dataset.i], 's'); });
    setStill(); if (book) turn();
  }).observe(html, { attributes: true, attributeFilter: ['data-tod', 'data-theme', 'data-lang'] });

  renderGallery(); renderInfo(); setStill(); layout();
  html.classList.remove('tl-pre');
  function idle() { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(startBook, { timeout: 1200 }); }
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, { once: true });
})();
