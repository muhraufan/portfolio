/* Postcard page behaviour: the speaking caption, the flip to the guest card (back drawn in the scene's own
   paper), the footprints cue, the photography persona, and the persona switcher's hint. */
(function () {
  var html = document.documentElement, body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fig = document.getElementById('last-seen');
  var card = fig.querySelector('.pc-card'), front = card.querySelector('.pc-front'), back = card.querySelector('.pc-back');
  var scene = front.querySelector('.ls-scene'), sceneCanvas = scene.querySelector('canvas');
  var print = front.querySelector('.pc-print'), topFrame = print.querySelector('.pc-top'), nextFrame = print.querySelector('.pc-next'), unders = print.querySelectorAll('.pc-under');
  var cap = fig.querySelector('.ls-caption'), who = cap.querySelector('.ls-who'), who2 = cap.querySelector('.ls-who2');
  var noteWrap = cap.querySelector('.pc-note-wrap'), note = cap.querySelector('.pc-note'), thanks = cap.querySelector('.pc-thanks'), tl = cap.querySelector('.pc-tl');
  var msg = back.querySelector('textarea'), nameIn = back.querySelector('.pc-from input');
  var sig = back.querySelector('.pc-sig canvas'), clearBtn = back.querySelector('.pc-clear');
  var post = back.querySelector('.pc-post'), closeBtn = back.querySelector('.pc-close');
  var stamp = back.querySelector('.pc-stamp canvas'), pmDate = back.querySelector('.pc-pm-date'), paper = back.querySelector('.pc-paper');
  var hint = document.querySelector('.pc-persona-hint');
  var S = LastSeen.newest();

  scene.setAttribute('role', 'img');
  LastSeen.mount(scene, null, { extras: window.LastSeenStreet || null });

  // ---------- strings ----------
  var T = {
    en: { note: 'Leave a note', tl: 'Earlier sightings', thanks: 'Thanks for the note', label: 'Guest card', title: 'Thank you for visiting! -Raufan',
      message: 'Message', messagePh: 'Leave a short note', signature: 'Signature', from: 'From', namePh: 'Your name',
      to: 'To', toName: 'Raufan', close: 'Close', post: 'Post it', clear: 'Clear', form: 'Leave a note for Raufan',
      who: ['Muhammad ', 'Raufan', ' Yusup'], shot: ['Last shot by ', ''], shot2: ['Shot by ', ''], shuffle: 'Shuffle', shuffleLabel: 'Shuffle the prints', toPhoto: 'Photography', toDesign: 'Design', credit: ['Last seen · Apple Marunouchi · Marunouchi', 'Photograph · Raufan Yusup'], err: "Couldn't send. Try again." },
    ja: { note: 'ひとこと残す', tl: 'これまでの足あと', thanks: 'ありがとう、届きました', label: 'Guest card', title: '来てくれてありがとう！ -Raufan',
      message: 'メッセージ', messagePh: 'ひとことどうぞ', signature: 'サイン', from: 'From', namePh: 'お名前（任意）',
      to: '', toName: 'ラウファン 様', close: '閉じる', post: '投函する', clear: '消す', form: 'ラウファンにひとこと残す',
      who: ['ムハンマド', 'ラウファン', 'ユスップ'], shot: ['', 'が最後に撮った一枚'], shot2: ['', 'が撮った一枚'], shuffle: 'もう一枚', shuffleLabel: '写真をめくる', toPhoto: '写真', toDesign: 'デザイン', credit: ['Last seen · Apple Marunouchi · Marunouchi', 'Photograph · Raufan Yusup'], err: '送れませんでした。もう一度。' }
  };
  function lang() { return html.getAttribute('data-lang') || 'en'; }
  function t() { return T[lang()] || T.en; }
  function setWho(a, s) { a.querySelector('.m-name-prefix').textContent = s.who[0]; a.querySelector('.m-name-core').textContent = s.who[1]; a.querySelector('.m-name-suffix').textContent = s.who[2]; }
  function applyStrings() {
    var s = t();
    setWho(who, s); setWho(who2, s);
    if (typeof applyShot === 'function' && shotTitle) applyShot();
    note.textContent = s.note; thanks.textContent = s.thanks; if (tl) tl.textContent = s.tl;
    back.setAttribute('aria-label', s.form);
    back.querySelector('.pc-label').textContent = s.label;
    back.querySelector('.pc-title').textContent = s.title;
    back.querySelector('.pc-msg .pc-flabel').textContent = s.message; msg.placeholder = s.messagePh;
    back.querySelector('.pc-sig .pc-flabel').textContent = s.signature; back.querySelector('.pc-sig').setAttribute('data-label', s.signature);
    sig.setAttribute('aria-label', s.signature);
    back.querySelector('.pc-from .pc-flabel').textContent = s.from; nameIn.placeholder = s.namePh;
    back.querySelector('.pc-to').textContent = s.to; back.querySelector('.pc-to-name').textContent = s.toName;
    closeBtn.textContent = s.close; post.textContent = s.post; clearBtn.textContent = s.clear;
    hintText();
    tidyDots();
  }
  // a wrapped line never starts with a separator: where the browser wraps before a "· item" group, that group's dot goes
  // and a hard break holds the wrap where it was, so the line can't pull back up without its dot
  function tidyDots() {
    cap.querySelectorAll('.pc-br').forEach(function (b) { b.remove(); });
    cap.querySelectorAll('.is-lead').forEach(function (g) { g.classList.remove('is-lead'); });
    var w = document.createTreeWalker(cap, NodeFilter.SHOW_TEXT), r = document.createRange(), prev = null, n;
    while ((n = w.nextNode())) {
      if (!/\S/.test(n.data) || !n.parentElement.getClientRects().length || n.parentElement.closest('.pc-sr, .pc-thanks')) continue;
      var el = n.parentElement;
      if (el.classList.contains('ls-dot') && prev) {
        r.setStart(prev, prev.data.replace(/\s+$/, '').length - 1); r.setEnd(prev, prev.data.replace(/\s+$/, '').length);
        var a = r.getBoundingClientRect(), d = el.getBoundingClientRect();
        if (d.top > a.top + a.height / 2) { var g = el.parentElement; g.classList.add('is-lead'); var br = document.createElement('br'); br.className = 'pc-br'; g.parentNode.insertBefore(br, g); }
      }
      prev = n;
    }
  }
  var tidyRaf = 0;
  window.addEventListener('resize', function () { cancelAnimationFrame(tidyRaf); tidyRaf = requestAnimationFrame(tidyDots); });
  if (document.fonts) document.fonts.addEventListener('loadingdone', tidyDots);
  var nameMoving = 0, nameRaf = 0;
  function nameFrame() { tidyDots(); nameRaf = nameMoving > 0 ? requestAnimationFrame(nameFrame) : 0; }
  cap.addEventListener('transitionrun', function (e) { if (e.propertyName !== 'max-width') return; nameMoving++; if (!nameRaf) nameRaf = requestAnimationFrame(nameFrame); });
  ['transitionend', 'transitioncancel'].forEach(function (t) { cap.addEventListener(t, function (e) { if (e.propertyName !== 'max-width') return; nameMoving = Math.max(0, nameMoving - 1); if (!nameMoving) tidyDots(); }); });
  if (tl) {
    tl.addEventListener('pointerdown', function () { tl.classList.add('is-press'); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (e) { tl.addEventListener(e, function () { tl.classList.remove('is-press'); }); });
  }
  cap.addEventListener('lastseen:caption', applyStrings);
  LastSeen.caption(cap);

  // ---------- the back: scene persona = the scene's own paper as a crisp card; photography = the back of the print ----------
  function pal() { return LastSeen.palette(S); }
  var PRINT = {   // photo-paper backs, by light: smooth, neutral, a printed line across; night is a dark print back that is still paper
    morning: { paper: '#f0f2f2', ink: '#33383b', pencil: '#5b6166', print: '#8d979c' },
    midday:  { paper: '#f2f1ee', ink: '#2f2f2e', pencil: '#5f5f5c', print: '#9a978f' },
    golden:  { paper: '#f5eee5', ink: '#3a312a', pencil: '#675b51', print: '#a8957f' },
    night:   { paper: '#292928', ink: '#e8e5df', pencil: '#b8b5ae', print: '#77746d' }
  };
  function tod() { return html.getAttribute('data-tod') || LastSeen.period(S); }
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function dither(x, w, h, amt, seed) {     // a hair of noise: kills banding and reads as paper tooth
    var d = x.getImageData(0, 0, w, h), a = d.data, r = rnd(seed || 7);
    for (var i = 0; i < a.length; i += 4) { var n = (r() + r() - 1) * amt; a[i] += n; a[i + 1] += n; a[i + 2] += n; }
    x.putImageData(d, 0, 0);
  }
  function deckle(x, w, h, k, seed) {       // the faintest torn-fibre edge: a few nibbles in the outer pixel or so
    var r = rnd(seed || 11); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
    var per = 2 * (w + h), n = Math.round(per / (3 * k));
    for (var i = 0; i < n; i++) {
      var u = r() * per, px, py, d = r() * 1.3 * k, s = (.35 + r() * .6) * k;
      if (u < w) { px = u; py = d; } else if (u < w + h) { px = w - d; py = u - w; } else if (u < 2 * w + h) { px = u - w - h; py = h - d; } else { px = d; py = u - 2 * w - h; }
      x.globalAlpha = .35 + r() * .5; x.beginPath(); x.arc(px, py, s, 0, 6.283); x.fill();
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  }
  function paintPaper() {
    if (persona === 'photography') return paintPrintBack();
    back.classList.remove('is-print');
    var p = pal(), v = S.variants[LastSeen.period(S)] || {};
    var adds = (v.paperAdd || []).filter(function (a) { return a.t !== 'halo'; });
    var x = LastSeen.paper(paper, S.paper.concat(adds), p, S, { mask: false });
    if (!x) return;
    var w = paper.width, h = paper.height, k = w / 400;
    (v.paperAdd || []).forEach(function (a) {   // the night glow as one smooth gradient rather than stacked rings
      if (a.t !== 'halo') return;
      var g = x.createRadialGradient(a.x * k, a.y * k, 0, a.x * k, a.y * k, a.rx * k);
      g.addColorStop(0, p[a.fill]); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.save(); x.globalAlpha = Math.min(.22, a.a * a.n * .9); x.translate(a.x * k, a.y * k); x.scale(1, a.ry / a.rx); x.translate(-a.x * k, -a.y * k);
      x.fillStyle = g; x.fillRect(0, 0, w, h * 2); x.restore();
    });
    dither(x, w, h, 3.2, 3); deckle(x, w, h, Math.max(1, w / back.getBoundingClientRect().width), 5);
    back.style.setProperty('--pc-paper', p.paper); back.style.setProperty('--pc-ink', p.paperInk); back.style.setProperty('--pc-line', p.paperLine); back.style.setProperty('--pc-pencil', p.paperInk);
    if (sctx) { sctx.strokeStyle = p.paperInk; sctx.lineWidth = 1.8; redraw(); }
  }
  function paintPrintBack() {
    back.classList.add('is-print');
    var P = PRINT[tod()] || PRINT.midday, r = paper.getBoundingClientRect(); if (!r.width) return;
    var d = Math.min(window.devicePixelRatio || 1, 2), w = paper.width = Math.round(r.width * d), h = paper.height = Math.round(r.height * d);
    var x = paper.getContext('2d'), rn = rnd(19);
    x.fillStyle = P.paper; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 7; i++) {           // very low mottling, like resin-coated stock under a lamp
      var cx = rn() * w, cy = rn() * h, rr = (.25 + rn() * .4) * w, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
      g.addColorStop(0, rn() > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.025)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
    // the generic backprint: one quiet repeating diagonal line, no maker
    x.save(); x.translate(w / 2, h / 2); x.rotate(-Math.PI / 7.2);
    x.fillStyle = P.print; x.globalAlpha = html.getAttribute('data-theme') === 'dark' ? .16 : .13;
    x.font = '500 ' + (7.5 * d) + 'px "Plus Jakarta Sans", system-ui, sans-serif';
    if ('letterSpacing' in x) x.letterSpacing = (2.6 * d) + 'px';
    var line = 'PHOTOGRAPHIC PAPER  ·  FIBRE BASE  ·  ', lw = x.measureText(line).width, gap = 58 * d, L = Math.hypot(w, h);
    for (var yy = -L / 2, row = 0; yy < L / 2; yy += gap, row++) for (var xx = -L / 2 - (row % 2) * lw / 2; xx < L / 2; xx += lw) x.fillText(line, xx, yy);
    x.restore();
    dither(x, w, h, 2.4, 9);
    back.style.setProperty('--pc-paper', P.paper); back.style.setProperty('--pc-ink', P.ink); back.style.setProperty('--pc-line', P.print); back.style.setProperty('--pc-pencil', P.pencil);
    if (sctx) { sctx.strokeStyle = P.pencil; sctx.lineWidth = 1.4; redraw(); }
  }
  function pencil() { return persona === 'photography' ? (PRINT[tod()] || PRINT.midday).pencil : pal().paperInk; }
  scene.addEventListener('lastseen:variant', function () { if (open) { paintPaper(); paintStamp(); } else { paperStale = true; prepaint(); } });
  var paperStale = true, paperKey = null, prepaintT = 0;
  // the paper is painted ahead, while the card is closed and the page idle: painting it on the tap held the main thread
  // for a few hundred ms right as the turn began, and WebKit then dropped or jumped the first frames of the flip
  function paperSig() { var r = back.getBoundingClientRect(); return [persona, tod(), html.getAttribute('data-theme'), Math.round(r.width), Math.round(r.height), window.devicePixelRatio || 1].join('|'); }
  function paintPaperIfNeeded() { var k = paperSig(); if (!paperStale && k === paperKey) return; paintPaper(); paperStale = false; paperKey = k; }
  function prepaint() {
    clearTimeout(prepaintT);
    prepaintT = setTimeout(function () {
      var go = function () {
        if (open) return; paintPaperIfNeeded();
        var pi = topFrame.querySelector('img'); if (persona === 'photography' && (pi.currentSrc || pi.src)) stampSource(pi.currentSrc || pi.src);   // the stamp's copy, decoded ahead
      };
      if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 1500 }); else go();
    }, 700);
  }

  // ---------- signature pad ----------
  var sctx, strokes = [], cur = null;
  function sizeSig() {
    var r = sig.getBoundingClientRect(); if (!r.width) return;
    var d = Math.min(window.devicePixelRatio || 1, 2);
    sig.width = Math.round(r.width * d); sig.height = Math.round(r.height * d);
    sctx = sig.getContext('2d'); sctx.setTransform(d, 0, 0, d, 0, 0);
    sctx.lineWidth = persona === 'photography' ? 1.4 : 1.8; sctx.lineCap = 'round'; sctx.lineJoin = 'round'; sctx.strokeStyle = pencil();
    redraw();
  }
  function redraw() {
    if (!sctx) return; sctx.clearRect(0, 0, sig.width, sig.height);
    strokes.forEach(function (s) { sctx.beginPath(); s.forEach(function (p, i) { i ? sctx.lineTo(p[0], p[1]) : sctx.moveTo(p[0], p[1]); }); sctx.stroke(); });
  }
  function pt(e) { var r = sig.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  sig.addEventListener('pointerdown', function (e) { sig.setPointerCapture(e.pointerId); cur = [pt(e)]; strokes.push(cur); });
  sig.addEventListener('pointermove', function (e) { if (!cur) return; cur.push(pt(e)); redraw(); });
  ['pointerup', 'pointercancel'].forEach(function (n) { sig.addEventListener(n, function () { if (cur && cur.length > 1) back.classList.add('has-sig'); cur = null; ready(); }); });
  clearBtn.addEventListener('click', function () { strokes = []; redraw(); back.classList.remove('has-sig'); ready(); });
  function ready() { post.disabled = posting || !(msg.value.trim() || nameIn.value.trim() || back.classList.contains('has-sig')); }
  function edited() { showErr(false); ready(); }
  msg.addEventListener('input', edited); nameIn.addEventListener('input', edited);
  msg.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); nameIn.focus(); } });

  // ---------- stamp: whatever is on the front right now, in miniature ----------
  // photos: an <img> with srcset reports a density-corrected naturalWidth (e.g. 359 for a 1545px file on a phone),
  // while drawImage reads the real pixels, so crop maths on it lands in the top-left corner. Draw from a plain copy.
  var stampImg = null;
  function stampSource(src) {
    if (stampImg && stampImg.src === src) return stampImg;
    stampImg = new Image(); stampImg.decoding = 'async'; stampImg.onload = paintStamp; stampImg.src = src;
    return stampImg;
  }
  function paintStamp() {
    var r = stamp.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    if (!r.width) return;
    stamp.width = Math.round(r.width * d); stamp.height = Math.round(r.height * d);
    var c = stamp.getContext('2d'); c.imageSmoothingQuality = 'high';
    var ar = stamp.width / stamp.height, printImg = topFrame.querySelector('img');
    if (persona === 'photography' && (printImg.currentSrc || printImg.src)) {
      var im = stampSource(printImg.currentSrc || printImg.src);
      if (!im.complete || !im.naturalWidth) return;                       // painted from onload
      var q = LastSeen.focusCrop(im.naturalWidth, im.naturalHeight, ar, current && current.focus);
      c.drawImage(im, q.x, q.y, q.w, q.h, 0, 0, stamp.width, stamp.height);
      return;
    }
    if (!sceneCanvas.width) return;
    var k = sceneCanvas.width / S.size[0], b = LastSeen.stampRect(S, ar);
    c.drawImage(sceneCanvas, b.x * k, b.y * k, b.w * k, b.h * k, 0, 0, stamp.width, stamp.height);
  }
  var d0 = new Date(); pmDate.textContent = String(d0.getDate()).padStart(2, '0') + '.' + String(d0.getMonth() + 1).padStart(2, '0') + '.' + String(d0.getFullYear()).slice(2);

  // ---------- flip ----------
  var open = false, lift = null, timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  back.inert = true; back.classList.add('is-away'); prepaint();
  function liftCard() {
    if (reduce.matches) return;
    if (lift) lift.cancel();
    lift = card.animate([{ transform: 'scale(1)' }, { transform: 'scale(.965)', offset: .4 }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
  }
  function setOpen(v) {
    if (v === open) return;
    open = v; clearTimers();
    if (v) back.classList.remove('is-away');   // the back shows before the turn starts, and hides only once it's over
    else later(function () { if (!open) back.classList.add('is-away'); }, reduce.matches ? 220 : 560);
    card.classList.toggle('is-flipped', v);
    note.setAttribute('aria-expanded', String(v));
    back.inert = !v; front.inert = v;
    liftCard(); morph(v);
    if (v) {
      paintPaperIfNeeded(); paintStamp(); sizeSig();   // usually already painted while closed (prepaint), so the turn starts at once
      later(function () { if (open) msg.focus({ preventScroll: true }); }, reduce.matches ? 40 : 230);
      document.addEventListener('keydown', onKey);
    } else {
      document.removeEventListener('keydown', onKey);
      note.focus({ preventScroll: true });
    }
  }
  // the container changes shape as it turns: scene vignette (or the print on the front) -> a crisp card, and back again
  var BLOB = 'inset(1.2% 0.8% round 15% 13% 16% 12% / 21% 19% 22% 18%)', morphAnim = null;
  function frontShape() {
    if (persona !== 'photography') return BLOB;
    var b = back.getBoundingClientRect(), f = topFrame.getBoundingClientRect();
    if (!b.width || !f.width) return BLOB;
    var px = function (n) { return Math.max(0, Math.round(n)) + 'px'; };
    return 'inset(' + px(f.top - b.top) + ' ' + px(b.right - f.right) + ' ' + px(b.bottom - f.bottom) + ' ' + px(f.left - b.left) + ' round 2px)';
  }
  function morph(v) {
    if (reduce.matches || !back.animate) return;
    var card2 = persona === 'photography' ? 'inset(0 round 3px)' : 'inset(0 round 8px)', shape = frontShape();
    if (morphAnim) morphAnim.cancel();
    morphAnim = back.animate([{ clipPath: v ? shape : card2 }, { clipPath: v ? card2 : shape }], { duration: 520, easing: 'cubic-bezier(0.3, 0, 0, 1)' });
  }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); setOpen(false); } }
  function press() {
    note.classList.add('is-press');
    if (!reduce.matches && !open) card.animate([{ transform: 'scale(1)' }, { transform: 'scale(.985)' }], { duration: 110, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'forwards' }).onfinish = function () { this.cancel(); };
  }
  note.addEventListener('pointerdown', press);
  note.addEventListener('pointerup', function () { note.classList.remove('is-press'); });
  note.addEventListener('pointerleave', function () { note.classList.remove('is-press'); });
  note.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { press(); setTimeout(function () { note.classList.remove('is-press'); }, 110); } });
  note.addEventListener('click', function () { setOpen(!open); });
  closeBtn.addEventListener('click', function () { setOpen(false); });

  back.addEventListener('focusin', function (e) {
    if (!window.matchMedia('(pointer: coarse)').matches) return;
    setTimeout(function () { if (!open) return; (e.target.closest('.pc-field') || e.target).scrollIntoView({ block: 'center', behavior: reduce.matches ? 'auto' : 'smooth' }); }, 320);
  });
  if (window.visualViewport) visualViewport.addEventListener('resize', function () {
    if (open && back.contains(document.activeElement)) document.activeElement.scrollIntoView({ block: 'nearest' });
  });

  // ---------- send: the existing guestbook, postmark only after it lands ----------
  var errEl = document.createElement('p');
  errEl.className = 'pc-error'; errEl.hidden = true; errEl.setAttribute('aria-live', 'polite');
  back.querySelector('.pc-actions').insertBefore(errEl, back.querySelector('.pc-actions').firstChild);
  var posting = false;
  function showErr(on) { errEl.hidden = !on; if (on) errEl.textContent = t().err; back.classList.toggle('is-error', on); }
  function signaturePNG() {
    if (!back.classList.contains('has-sig') || !strokes.length) return null;
    var r = sig.getBoundingClientRect(), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(r.width * 2)); c.height = Math.max(1, Math.round(r.height * 2));
    var x = c.getContext('2d'); x.scale(2, 2); x.lineWidth = persona === 'photography' ? 1.4 : 1.8;
    x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = pencil();
    strokes.forEach(function (s) { x.beginPath(); s.forEach(function (pt, i) { i ? x.lineTo(pt[0], pt[1]) : x.moveTo(pt[0], pt[1]); }); x.stroke(); });
    return c.toDataURL('image/png');
  }
  function succeed(saved) {
    back.classList.add('is-postmarked');
    if (!reduce.matches) later(function () { card.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(1.5px) scale(.994)' }, { transform: 'none' }], { duration: 200, easing: 'ease-out' }); }, 60);
    later(function () {
      // the note leaves the card for the postbox in the scene (street-life.js), which then says it was delivered
      document.dispatchEvent(new CustomEvent('pc:posted', { detail: { entry: saved, paper: pal().paper, ink: pal().paperInk, card: card, flight: persona === 'design' } }));
      setOpen(false);
      timers.push(setTimeout(function () {
        noteWrap.classList.add('is-thanks');
        timers.push(setTimeout(function () { noteWrap.classList.remove('is-thanks'); }, 3600));
      }, reduce.matches ? 120 : 460));
      timers.push(setTimeout(function () { back.classList.remove('is-postmarked', 'has-sig'); back.reset(); strokes = []; redraw(); posting = false; ready(); }, 700));
    }, 820);
  }
  function fail() { posting = false; showErr(true); ready(); }
  back.addEventListener('submit', function (e) {
    e.preventDefault(); if (post.disabled || !open || posting) return;
    posting = true; showErr(false); post.disabled = true;
    var paper = persona === 'photography' ? (PRINT[tod()] || PRINT.midday).paper : pal().paper;
    var entry = { name: nameIn.value, message: msg.value, drawData: signaturePNG(), cardColor: paper, pattern: null };
    import('/components/Guestbook/guestbookService.js?v=2').then(function (mod) { return mod.addEntry(entry); }).then(function (saved) {
      if (!saved) { fail(); return; }
      succeed(saved);
    }, fail);
  });

  // ---------- footprints: they carry on from where the figure left the frame, down to the intro ----------
  var hero = document.querySelector('.pc-hero'), steps = hero.querySelector('.pc-steps');
  var cueDone = false, cueShown = false, exitAt = { x: 362 / 400, foot: .96 };
  var SOLE = 'M0 -6.4c1.7 0 2.6 1.5 2.6 3.3 0 1.7-.7 2.7-1.1 3.5-.2.5-.6.7-1.5.7s-1.3-.2-1.5-.7C-1.9 -.4-2.6-1.4-2.6-3.1c0-1.8.9-3.3 2.6-3.3zM-1.5 2.4h3c.4 0 .6.3.6.7 0 1.6-.8 2.9-2.1 2.9S-2.1 4.7-2.1 3.1c0-.4.2-.7.6-.7z';
  function bio() { var p = document.querySelector('.m-profile-panel:not([hidden]) .m-bio'); return p && p.getBoundingClientRect(); }
  function trail() {
    var hr = hero.getBoundingClientRect(), sr = card.getBoundingClientRect(), br = bio(), vw = html.clientWidth;
    var ox = hr.left, oy = hr.top;
    var sx = sr.left + sr.width * exitAt.x - ox + 6, sy = sr.top + sr.height * Math.min(exitAt.foot, .97) - oy;
    var endY = (br ? br.top - oy : hr.height) - 12, P, wide = vw - sr.right > 60;
    if (wide) P = [[sx, sy], [sx + 70, sy + 28], [sr.right - ox + 40, endY - 70], [sr.right - ox - sr.width * .14, endY]];
    else P = [[sx, sy], [vw - ox - 12, sy + 34], [vw - ox - 16, endY - 40], [hr.width * .64, endY]];
    function at(u) { var v = 1 - u; return [0, 1].map(function (i) { return v*v*v*P[0][i] + 3*v*v*u*P[1][i] + 3*v*u*u*P[2][i] + u*u*u*P[3][i]; }); }
    var pts = [], L = 0, prev = at(0);
    for (var i = 1; i <= 240; i++) { var q = at(i / 240); L += Math.hypot(q[0] - prev[0], q[1] - prev[1]); pts.push([L, q]); prev = q; }
    var stride = wide ? 27 : 24, n = Math.min(wide ? 11 : 7, Math.max(4, Math.floor(L / stride))), out = '';
    var dark = html.getAttribute('data-theme') === 'dark';
    for (var k = 0; k < n; k++) {
      var want = (k + .6) * L / n, j = 0; while (j < pts.length - 1 && pts[j][0] < want) j++;
      var a = pts[Math.max(0, j - 2)][1], b = pts[Math.min(pts.length - 1, j + 2)][1];
      var ang = Math.atan2(b[1] - a[1], b[0] - a[0]), side = k % 2 ? 1 : -1;
      var x = pts[j][1][0] - Math.sin(ang) * side * 5, y = pts[j][1][1] + Math.cos(ang) * side * 5;
      var alpha = ((dark ? .42 : .46) - .12 * k / (n - 1)).toFixed(3), last = k === n - 1;
      out += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (ang * 180 / Math.PI + 90 + side * 5).toFixed(1) + ') scale(' + (side < 0 ? -1.3 : 1.3) + ' 1.3)">' +
        (last ? '<circle class="pc-blot" r="7" fill="currentColor"/>' : '') +
        '<path class="pc-step' + (last ? ' pc-step-last' : '') + '" style="--a:' + alpha + '" fill="currentColor" d="' + SOLE + '"/></g>';
    }
    steps.innerHTML = out;
  }
  function showCue(instant) {
    if (cueDone || cueShown || persona !== 'design') return; cueShown = true;
    trail();
    var list = steps.querySelectorAll('.pc-step'), gap = Math.min(125, 1150 / list.length);   // brisk: the whole trail in ~1.1s
    list.forEach(function (s, i) {
      if (instant || reduce.matches) { s.classList.add('is-in'); return; }
      setTimeout(function () { s.classList.add('is-in'); if (s.classList.contains('pc-step-last')) steps.classList.add('is-landed'); }, i * gap);
    });
    if (instant || reduce.matches) steps.classList.add('is-static');
  }
  scene.addEventListener('lastseen:exit', function (e) { exitAt = e.detail; showCue(false); });
  if (reduce.matches) requestAnimationFrame(function () { showCue(true); });
  // the trail is tied to scroll: it fades out over the first 90px and comes back at the top, so an early nudge never cancels it
  function gone() { var u = Math.min(1, Math.max(0, window.scrollY / 90)); steps.style.opacity = u > 0 && !steps.classList.contains('is-away') ? (1 - u).toFixed(3) : ''; steps.style.transition = u > 0 ? 'none' : ''; }
  window.addEventListener('scroll', gone, { passive: true });
  window.addEventListener('resize', function () { if (cueShown && !cueDone) { trail(); steps.querySelectorAll('.pc-step').forEach(function (s) { s.classList.add('is-in'); }); steps.classList.add('is-static'); } });

  // ---------- persona: design shows the place, photography shows a small stack of prints ----------
  var persona = body.dataset.profile === 'photography' ? 'photography' : 'design', photos = null, current = null, upNext = null, bag = [], shuffled = false, photoReq = null;
  var shotTitle = cap.querySelector('.pc-shot-title'), live = cap.querySelector('.pc-live'), shuffleBtn = cap.querySelector('.pc-shuffle');
  function loadPhotos() {
    if (photoReq) return photoReq;
    photoReq = fetch('/assets/photography/portfolio/photos.json?v=5').then(function (r) { return r.json(); }).then(function (m) {
      // the archive has no dates; newest = an explicit `latest` flag if present, else the last in the site's own order
      photos = m.photos.slice().sort(function (a, b) { return a.order - b.order; });
      current = photos.filter(function (p) { return p.latest; })[0] || photos[photos.length - 1];
      setImg(topFrame, current); fit(topFrame, current); shotTitle.textContent = current.title;
      queueNext();
      var img = topFrame.querySelector('img');
      return new Promise(function (res) { if (img.complete) res(); else { img.onload = res; img.onerror = res; } });
    });
    return photoReq;
  }
  function draw() {           // a shuffled bag: no repeats until the whole archive has come round
    if (!bag.length) { bag = photos.filter(function (p) { return p !== current; }); for (var i = bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = bag[i]; bag[i] = bag[j]; bag[j] = t; } }
    return bag.pop();
  }
  function queueNext() {
    upNext = draw(); setImg(nextFrame, upNext); fit(nextFrame, upNext);
    var img = nextFrame.querySelector('img'); if (img.decode) img.decode().catch(function () {});
  }
  function setImg(frame, p) {
    var img = frame.querySelector('img');
    img.alt = p.alt || p.title; img.width = p.width; img.height = p.height;
    img.sizes = '(max-width: 600px) 92vw, 720px';
    // Full files stay off the design persona. The hero shows the place there;
    // thumbs are enough until the photography side is actually open.
    if (persona === 'photography') {
      img.srcset = p.src + ' 600w, ' + p.fullSrc + ' ' + p.width + 'w';
      img.src = p.fullSrc;
    } else {
      img.removeAttribute('srcset');
      img.src = p.src;
    }
  }
  function fit(frame, p) {    // every print fits the same box inside the card, whatever its shape
    var r = card.getBoundingClientRect(); if (!r.width || !p) return;
    var ar = p.width / p.height, pad = Math.round(r.width * .028), maxW = r.width * .9, maxH = r.height * .88;
    var w = Math.min(maxW, (maxH - 2 * pad) * ar + 2 * pad), h = (w - 2 * pad) / ar + 2 * pad;
    frame.style.width = Math.round(w) + 'px'; frame.style.padding = pad + 'px'; frame.style.setProperty('--ar', ar);
    if (frame === topFrame) unders.forEach(function (u) { u.style.setProperty('--fw', Math.round(w) + 'px'); u.style.setProperty('--fh', Math.round(h) + 'px'); });
  }
  function layoutPrint() { if (current) fit(topFrame, current); if (upNext) fit(nextFrame, upNext); }
  new ResizeObserver(layoutPrint).observe(card);

  // shuffle: press, the top print is tossed off, the next one (already decoded) is underneath
  var tossing = null;
  function commit() {
    if (!tossing) return; var tt = tossing; tossing = null;
    tt.anims.forEach(function (a) { a.cancel(); });
    var was = topFrame; topFrame = nextFrame; nextFrame = was;
    topFrame.classList.replace('pc-next', 'pc-top'); nextFrame.classList.replace('pc-top', 'pc-next');
    topFrame.style.opacity = ''; nextFrame.style.opacity = '';
    print.insertBefore(nextFrame, topFrame);               // the old top goes back under the new one
    current = tt.p; fit(topFrame, current);
    queueNext();
    if (open) paintStamp();
  }
  function shuffle() {
    if (persona !== 'photography' || !photos || !upNext) return;
    commit();                                               // interruptible: a second press lands the first at once
    var p = upNext, out = topFrame, inn = nextFrame, anims = [], spring = getComputedStyle(body).getPropertyValue('--spring').trim() || 'ease-out';
    tossing = { p: p, anims: anims };
    fit(topFrame, current);
    unders.forEach(function (u) { u.style.setProperty('--fw', inn.style.width); u.style.setProperty('--fh', (parseFloat(inn.style.width) - 2 * parseFloat(inn.style.padding)) / (p.width / p.height) + 2 * parseFloat(inn.style.padding) + 'px'); });
    swapCaption(function () { shuffled = true; shotTitle.textContent = p.title; applyShot(); live.textContent = p.title; }, true);
    inn.style.opacity = '1';
    if (reduce.matches) {
      anims.push(out.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-out', fill: 'forwards' }));
    } else {
      anims.push(out.animate([
        { transform: 'rotate(-.6deg) scale(.985)' },
        { transform: 'translate(46%, -5%) rotate(13deg) scale(.97)' }
      ], { duration: 460, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' }));
      anims.push(out.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 230, delay: 190, easing: 'ease-in', fill: 'forwards' }));
      anims.push(inn.animate([
        { transform: 'translate(1.4%, 1.2%) rotate(2.4deg) scale(.975)', filter: 'brightness(.97)' },
        { transform: 'rotate(-.6deg)', filter: 'none' }
      ], { duration: 560, delay: 70, easing: spring, fill: 'backwards' }));
    }
    var last = anims[anims.length - 1], mine = tossing;
    Promise.all(anims.map(function (a) { return a.finished; })).then(function () { if (tossing === mine) commit(); }, function () {});
  }
  print.addEventListener('click', shuffle);
  print.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); shuffle(); } });
  shuffleBtn.addEventListener('click', shuffle);

  // photography has no trail: the intro comes up to normal spacing; the card itself never moves
  function heroLayout(photo, animate) {
    var h0 = hero.getBoundingClientRect().height;
    hero.classList.remove('is-photo');
    var top = card.getBoundingClientRect().top - hero.getBoundingClientRect().top;
    hero.style.setProperty('--hero-top', Math.round(top) + 'px');
    hero.classList.add('is-photo');                         // measure the end height in the photo layout either way, card pinned
    var h1 = photo ? hero.getBoundingClientRect().height : (hero.classList.remove('is-photo'), hero.getBoundingClientRect().height);
    hero.classList.add('is-photo');
    var done = function () { hero.classList.toggle('is-photo', photo); };
    if (!animate || reduce.matches || Math.abs(h1 - h0) < 2) { done(); return; }
    var an = hero.animate([{ height: h0 + 'px', minHeight: '0px' }, { height: h1 + 'px', minHeight: '0px' }], { duration: 380, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
    an.onfinish = an.oncancel = done;
  }
  function applyShot() {
    var s = t(), sh = shuffled ? s.shot2 : s.shot;
    cap.querySelector('.pc-shot-pre').textContent = sh[0]; cap.querySelector('.pc-shot-post').textContent = sh[1];
    shuffleBtn.textContent = s.shuffle; print.setAttribute('aria-label', s.shuffleLabel);
  }
  function setPersona(mode, animate) {
    if (mode === persona && animate) return;
    persona = mode;
    var photo = mode === 'photography';
    var apply = function () {
      card.classList.toggle('is-photo', photo);
      scene.setAttribute('aria-hidden', String(photo)); print.setAttribute('aria-hidden', String(!photo));
      if (photo) { print.setAttribute('role', 'button'); print.tabIndex = 0; } else { print.removeAttribute('role'); print.tabIndex = -1; }
      cap.classList.toggle('is-photo', photo);
      steps.classList.toggle('is-away', photo);
      hintText(); applyShot();
      paperStale = true; prepaint();
    };
    heroLayout(photo, animate);                             // the intro starts moving right away, so it settles inside the input window
    if (photo) loadPhotos().then(function () {
      if (current) setImg(topFrame, current);
      if (upNext) setImg(nextFrame, upNext);
      swapCaption(apply, animate);
    }); else swapCaption(apply, animate);
    if (open) setOpen(false);
  }
  function swapCaption(apply, animate) {
    if (!animate || reduce.matches) { apply(); tidyDots(); return; }
    cap.classList.add('is-swapping');
    setTimeout(function () { apply(); tidyDots(); requestAnimationFrame(function () { cap.classList.remove('is-swapping'); }); }, 140);
  }
  new MutationObserver(function () { setPersona(body.dataset.profile === 'photography' ? 'photography' : 'design', true); })
    .observe(body, { attributes: true, attributeFilter: ['data-profile'] });
  setPersona(persona, false);
  setTimeout(function () { (window.requestIdleCallback || function (f) { f(); })(function () { loadPhotos(); }); }, 2500);   // ready before anyone reaches for the avatar

  // ---------- persona switcher: a quiet hint of the other side ----------
  function hintText() {
    if (hint) hint.textContent = persona === 'photography' ? t().toDesign : t().toPhoto;
    back.querySelector('.pc-credit').textContent = t().credit[persona === 'photography' ? 1 : 0];
  }
  hintText();
  // the whole avatar is the switch: pressing the front card turns to the other side (the peeking card still works too)
  var picker = document.querySelector('.m-avatar-picker'), touch = window.matchMedia('(hover: none), (pointer: coarse)'), wasOpen = false;
  if (picker) {
    var wasActive = false;
    picker.addEventListener('click', function (e) { var c = e.target.closest('.m-avatar-card'); wasOpen = picker.classList.contains('is-open'); wasActive = !!c && c.classList.contains('is-active'); }, true);
    picker.addEventListener('click', function (e) {
      var c = e.target.closest('.m-avatar-card'); if (!e.isTrusted || !c || !wasActive) return;
      if (touch.matches && !wasOpen) return;                // first tap on a phone just fans the cards out
      var other = picker.querySelector('.m-avatar-card:not(.is-active)'); if (!other) return;
      if (touch.matches) picker.classList.add('is-open');   // let the site's own handler take the tap as a choice
      other.click();
    });
  }

  // the photo back follows the light too
  new MutationObserver(function () { if (persona === 'photography') { if (open) { paintPaper(); paintStamp(); } else { paperStale = true; prepaint(); } } })
    .observe(html, { attributes: true, attributeFilter: ['data-tod'] });

  // the gallery's "Leave a note" lands here with the card already open
  if (new URLSearchParams(location.search).get('guestcard') === 'open') requestAnimationFrame(function () { setOpen(true); });

  // test hooks
  window.__pc = { open: function () { setOpen(true); }, close: function () { setOpen(false); }, cue: showCue, persona: setPersona, shuffle: shuffle, commit: commit };
})();
