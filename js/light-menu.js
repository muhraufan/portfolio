/* "Change the light" — the same control on every page. The head script already painted the right state. */
(function () {
  var html = document.documentElement;
  var L = window.PCLight;
  var lightBtn = document.getElementById('pc-light-btn');
  var menu = document.getElementById('pc-light-menu');
  if (!L || !lightBtn || !menu) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function lang() { return html.getAttribute('data-lang') || 'en'; }
  var LT = {
    en: { label: 'Change the light', greet: { morning: 'Good morning', midday: 'Good afternoon', golden: 'Golden hour', night: 'Good night' },
      name: { auto: 'Auto', morning: 'Morning', midday: 'Midday', golden: 'Golden', night: 'Night' }, aria: 'Light: ' },
    ja: { label: 'あかりを変える', greet: { morning: 'おはよう', midday: 'こんにちは', golden: '夕暮れどき', night: 'こんばんは' },
      name: { auto: '自動', morning: '朝', midday: '昼', golden: '夕暮れ', night: '夜' }, aria: 'あかり：' }
  };
  var STARTS = { morning: '5:00', midday: '11:00', golden: '15:30', night: '18:00' };
  function lt() { return LT[lang()] || LT.en; }
  function clockText(d) {
    return lang() === 'ja' ? d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false })
                           : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  function paintLight() {
    var d = new Date(), s = lt(), now = html.getAttribute('data-tod'), c = L.choice(), timeEl = lightBtn.querySelector('.pc-light-time');
    timeEl.textContent = clockText(d); timeEl.setAttribute('datetime', d.toTimeString().slice(0, 5));
    lightBtn.querySelector('.pc-light-greet').textContent = s.greet[now];
    lightBtn.setAttribute('aria-label', clockText(d) + ', ' + s.greet[now] + '. ' + s.label);
    menu.querySelector('.pc-light-label').textContent = s.label;
    menu.querySelectorAll('[role="menuitemradio"]').forEach(function (it) {
      var k = it.dataset.light; it.querySelector('.pc-li-name').textContent = s.name[k];
      it.querySelector('.pc-li-note').textContent = k === 'auto' ? s.name[L.override() || (L.dark.matches ? 'night' : L.clock())] : STARTS[k];
      it.setAttribute('aria-checked', String(k === c));
    });
  }
  function relight(c) {
    var go = function () { if (c === undefined) L.apply(); else L.set(c); paintLight(); };
    var before = html.getAttribute('data-tod'), after = L.resolve(c);
    var warm = (before === 'golden' && after === 'night') || (before === 'night' && after === 'golden');
    if (before === after || reduce.matches || !document.startViewTransition) { go(); return; }
    html.classList.add('pc-vt');
    if (warm) html.classList.add('pc-vt-warm');
    var vt = document.startViewTransition(go);
    vt.finished.finally(function () { html.classList.remove('pc-vt', 'pc-vt-warm'); });
  }
  var items = [].slice.call(menu.querySelectorAll('[role="menuitemradio"]')), menuOpen = false, hideT = 0;
  function openMenu(which) {
    if (menuOpen) return; menuOpen = true; clearTimeout(hideT); paintLight();
    menu.hidden = false; menu.getBoundingClientRect(); menu.classList.add('is-open');
    lightBtn.setAttribute('aria-expanded', 'true');
    var i = which === 'last' ? items.length - 1 : Math.max(0, items.findIndex(function (it) { return it.getAttribute('aria-checked') === 'true'; }));
    items[i].focus({ preventScroll: true });
    document.addEventListener('pointerdown', outside, true);
  }
  function closeMenu(refocus) {
    if (!menuOpen) return; menuOpen = false;
    menu.classList.remove('is-open'); lightBtn.setAttribute('aria-expanded', 'false');
    hideT = setTimeout(function () { menu.hidden = true; }, reduce.matches ? 0 : 100);
    document.removeEventListener('pointerdown', outside, true);
    if (refocus) lightBtn.focus({ preventScroll: true });
  }
  function outside(e) { if (!e.target.closest('.pc-light')) closeMenu(false); }
  lightBtn.addEventListener('click', function () { menuOpen ? closeMenu(true) : openMenu(); });
  lightBtn.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); openMenu(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); openMenu('last'); }
  });
  menu.addEventListener('keydown', function (e) {
    var i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); items[e.key === 'Home' ? 0 : items.length - 1].focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(true); }
    else if (e.key === 'Tab') { e.preventDefault(); closeMenu(true); }
  });
  items.forEach(function (it) {
    it.addEventListener('click', function () {
      var c = it.dataset.light; closeMenu(true);
      setTimeout(function () { relight(c); }, reduce.matches ? 0 : 90);
    });
  });
  new MutationObserver(paintLight).observe(html, { attributes: true, attributeFilter: ['data-lang'] });
  paintLight();
  (function tick() { setTimeout(function () { paintLight(); if (L.choice() === 'auto' && !L.override()) relight(); tick(); }, 60000 - Date.now() % 60000 + 30); })();
  L.dark.addEventListener('change', function () { if (L.choice() === 'auto' && !L.override()) relight(); });
  window.addEventListener('langchange', paintLight);
})();
