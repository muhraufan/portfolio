/* Interaction sounds, synthesized by Cuelume (/js/vendor/cuelume.js, loaded on its own once the page is idle or at the
   first touch or key). On by default; one switch for the whole site, the same 'tl-feedback' key the Timeline and the
   guestbook already honour. Rules:
   - nothing sounds before the visitor's first touch, click or key, and never on load or scroll
   - the more often a thing happens the quieter it is: every cue plays Cuelume's 'subtle' arrangement, hover and typing
     lower still, except the one signature moment, the note landing in the post box ('success', 'strong')
   - hover sounds only for a real mouse (fine pointer), never touch
   Feature scripts call SiteSound.cue(name, options); the cues that need no feature code (typing, the shelf hover,
   Clacky, the light menu, the language switch, the note landing) are wired here. */
(function () {
  var KEY = 'tl-feedback', html = document.documentElement;
  var lib = null, loading = null, pending = [], touched = false;
  var fine = matchMedia('(hover: hover) and (pointer: fine)');
  var log = window.__sfxTest ? (window.__sfxLog = window.__sfxLog || []) : null;   // test hook: every cue asked for, and whether it played

  function on() { try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; } }
  function active() { var u = navigator.userActivation; return touched || !!(u && u.hasBeenActive); }
  function load() {
    if (!loading) loading = import('/js/vendor/cuelume.js?v=1').then(function (m) {
      lib = m; m.setEnabled(on());
      var now = performance.now(), due = pending; pending = [];
      due.forEach(function (p) { if (now - p[2] < 300) m.play(p[0], p[1]); });   // a cue asked for while the file was still arriving
      return m;
    }, function () { loading = null; pending = []; });
    return loading;
  }
  function cue(name, o) {
    o = o || {};
    var opts = { emphasis: o.emphasis || 'subtle' };
    if (o.direction) opts.direction = o.direction;
    if (o.key) opts.key = o.key;
    if (o.volume != null) opts.volume = o.volume;
    var ok = on() && active();
    if (log) log.push({ name: name, emphasis: opts.emphasis, direction: opts.direction || null, volume: opts.volume == null ? 1 : opts.volume, played: ok, at: Math.round(performance.now()) });
    if (!ok) return false;
    if (lib) lib.play(name, opts); else { pending.push([name, opts, performance.now()]); load(); }
    return true;
  }
  function sync() { if (lib) lib.setEnabled(on()); paint(); }
  function set(v) {
    try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) {}
    window.dispatchEvent(new Event('sound:change'));
  }
  window.SiteSound = { cue: cue, on: on, set: set };

  // the first real gesture opens audio; the library itself comes down when the page is idle, well before most clicks
  ['pointerdown', 'keydown', 'touchend'].forEach(function (t) {
    window.addEventListener(t, function f(e) { if (!e.isTrusted) return; touched = true; load(); window.removeEventListener(t, f, true); }, { capture: true, passive: true });
  });
  function idle() { (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(function () { load(); }, { timeout: 4000 }); }
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, { once: true });
  window.addEventListener('sound:change', sync);   // the Timeline's own switch says so too
  window.addEventListener('storage', function (e) { if (e.key === KEY) sync(); });

  // ---------- the switch (home footer): "Sound on" / "Sound off", aria-pressed; the Timeline keeps its own ----------
  var sw = document.querySelector('.m-sound');
  var WORDS = { en: ['Sound', 'on', 'off', 'Turn sound off', 'Turn sound on'], ja: ['音', 'オン', 'オフ', '音をオフにする', '音をオンにする'] };
  function paint() {
    if (!sw) return;
    var v = on(), w = WORDS[html.getAttribute('data-lang') === 'ja' ? 'ja' : 'en'];
    sw.setAttribute('aria-pressed', String(v));
    sw.querySelector('.m-sound-name').textContent = w[0];
    sw.querySelector('.m-sound-state').textContent = v ? w[1] : w[2];
    sw.title = v ? w[3] : w[4];
  }
  if (sw) {
    sw.addEventListener('click', function () {
      var v = !on(); set(v);
      if (v) { touched = true; load().then(function (m) { if (!m) return; m.unlock().then(function () { cue('toggle'); }); }); }   // turning it on is heard; turning it off is not
    });
    new MutationObserver(paint).observe(html, { attributes: true, attributeFilter: ['data-lang'] });
    paint();
  }

  // ---------- typing on the guest card: a quiet key per stroke that edits text ----------
  var lastKey = 0;
  document.addEventListener('keydown', function (e) {
    var f = e.target;
    if (!f.closest || !f.closest('#pc-back') || !(f.matches('textarea') || f.matches('input:not([type="password"])'))) return;
    if (e.isComposing || e.keyCode === 229) return;                       // IME composition is the IME's business
    var sel = f.selectionEnd - f.selectionStart, k = e.key, role = null;
    if (k === 'Backspace' || k === 'Delete') { if (f.value.length || sel) role = 'delete'; }   // held delete keeps going until it's empty
    else if (k.length === 1 && !e.repeat && !e.ctrlKey && !e.metaKey) {
      if (f.maxLength > 0 && f.value.length >= f.maxLength && !sel) return;   // a full field takes nothing, so it says nothing
      role = k === ' ' ? 'space' : 'printable';
    }
    if (!role) return;
    var now = performance.now(); if (now - lastKey < 40) return; lastKey = now;
    cue('type', { key: role, volume: .7 });
  }, true);

  // ---------- the note lands in the post box: the one signature moment ----------
  // street-life.js says pc:delivered as the flying note drops into the slot (or straight away where the scene has no post box)
  document.addEventListener('pc:delivered', function () { cue('success', { emphasis: 'strong' }); });

  // ---------- the projects shelf: a faint detent per icon under a mouse, rising to the right, falling to the left ----------
  var shelf = document.querySelector('.ps-shelf'), lastItem = null, lastHover = 0, popupAt = 0;
  if (shelf) {
    shelf.addEventListener('pointerover', function (e) {
      if (e.pointerType !== 'mouse' || !fine.matches) return;
      var app = e.target.closest('.ps-app'), it = app && app.closest('.ps-item');
      if (!it || it === lastItem) return;
      var prev = lastItem; lastItem = it;
      if (document.querySelector('dialog.ps-card[open]')) return;
      var now = performance.now();
      if (now - lastHover < 90 || now - popupAt < 450) return;   // a fast sweep never chatters; a card closing back onto the icon isn't a hover
      lastHover = now;
      var dir = null;
      if (prev) {
        var a = prev.getBoundingClientRect(), b = it.getBoundingClientRect();
        dir = Math.abs(b.left - a.left) > 1 ? (b.left > a.left ? 'forward' : 'back') : (b.top > a.top ? 'back' : 'forward');
      }
      cue('select', { direction: dir, volume: .45 });
    });
    shelf.addEventListener('pointerleave', function () { if (!document.querySelector('dialog.ps-card[open]')) lastItem = null; });   // an opening card covers the shelf: that isn't leaving it
    document.addEventListener('close', function (e) { if (e.target.matches && e.target.matches('dialog.ps-card')) popupAt = performance.now(); }, true);
    // Clacky is not out yet: a soft "not yet" when it's tapped
    shelf.addEventListener('click', function (e) { if (e.target.closest('.ps-soon .ps-app')) cue('warning'); });
  }

  // ---------- the light ("Change the light"): a switch, played backwards as the lights go out ----------
  document.addEventListener('click', function (e) {
    var it = e.target.closest && e.target.closest('#pc-light-menu [data-light]'); if (!it || !window.PCLight) return;
    var before = html.getAttribute('data-tod'), after = PCLight.resolve(it.dataset.light);
    if (before === after) cue('select'); else cue('toggle', { direction: after === 'night' ? 'back' : 'forward' });
  }, true);

  // ---------- EN / JA ----------
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.m-lang-toggle')) return;
    cue('select', { direction: html.getAttribute('data-lang') === 'ja' ? 'back' : 'forward' });   // read before the switch flips it
  }, true);
})();
