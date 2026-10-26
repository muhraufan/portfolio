/* Last seen — a tiny illustrated "where Raufan is" hero.
   One canvas. Static layers (with stippled grain) are rendered once per
   size/theme; each frame only composites them with a few moving shapes.
   Everything that moves is a pure function of time, so a frame can be
   rendered at any t (used for the reduced-motion still and the preview). */
(function () {
  'use strict';
  var scenes = [], byId = {}, curK = 1;
  var LS = window.LastSeen = window.LastSeen || {};
  LS.scene = function (s) { scenes.push(s); if (s.id) byId[s.id] = s; };
  LS.byId = function (id) { return byId[id] || null; };
  LS.all = function () { return scenes.slice().sort(function (a, b) { return Date.parse(b.seenAt) - Date.parse(a.seenAt); }); };
  LS.newest = function () { return LS.all()[0]; };

  // ---------- small helpers ----------
  function rng(seed) { // mulberry32
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var easeOut = function (x) { return 1 - Math.pow(1 - x, 3); };
  var easeInOut = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };

  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  function shapePath(ctx, p) {
    ctx.beginPath();
    if (p.t === 'rect') {
      if (p.r) { ctx.roundRect(p.x, p.y, p.w, p.h, p.r); } else ctx.rect(p.x, p.y, p.w, p.h);
    } else if (p.t === 'circle') ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    else if (p.t === 'ellipse') ctx.ellipse(p.x, p.y, p.rx, p.ry, p.rot || 0, 0, Math.PI * 2);
    else if (p.t === 'poly') {
      for (var i = 0; i < p.pts.length; i += 2) i ? ctx.lineTo(p.pts[i], p.pts[i + 1]) : ctx.moveTo(p.pts[0], p.pts[1]);
      ctx.closePath();
    }
  }
  function bounds(p) {
    if (p.t === 'rect') return [p.x, p.y, p.w, p.h];
    if (p.t === 'circle') return [p.x - p.r, p.y - p.r, p.r * 2, p.r * 2];
    if (p.t === 'ellipse') return [p.x - p.rx, p.y - p.ry, p.rx * 2, p.ry * 2];
    var xs = p.pts.filter(function (_, i) { return !(i % 2); }), ys = p.pts.filter(function (_, i) { return i % 2; });
    var x0 = Math.min.apply(0, xs), y0 = Math.min.apply(0, ys);
    return [x0, y0, Math.max.apply(0, xs) - x0, Math.max.apply(0, ys) - y0];
  }

  // Stipple: dots whose density follows a direction across the shape's box.
  // dir: 'down' | 'up' | 'left' | 'right' | 'br' (bottom-right) | 'flat' | 'center'
  function stipple(ctx, b, sh, color, rand, dot) {
    var x = b[0], y = b[1], w = b[2], h = b[3];
    var n = Math.round(w * h * 2.4 * (sh.d || .3));
    ctx.fillStyle = color;
    ctx.globalAlpha = sh.a == null ? .62 : sh.a;
    var pw = sh.p || 1.6;
    for (var i = 0; i < n; i++) {
      var u = rand(), v = rand(), f;
      switch (sh.dir) {
        case 'down': f = v; break;
        case 'up': f = 1 - v; break;
        case 'left': f = 1 - u; break;
        case 'right': f = u; break;
        case 'br': f = (u + v) / 2; break;
        case 'center': f = 1 - Math.min(1, Math.hypot(u - .5, v - .5) * 2); break;
        default: f = 1;
      }
      if (rand() > Math.pow(f, pw)) continue;
      ctx.fillRect(x + u * w, y + v * h, dot, dot);
    }
    ctx.globalAlpha = 1;
  }

  function drawPrims(ctx, prims, pal, rand, dot) {
    prims.forEach(function (p) {
      ctx.globalAlpha = p.a == null ? 1 : p.a;
      if (p.t === 'text') {
        ctx.fillStyle = pal[p.fill];
        ctx.font = p.weight + ' ' + p.size + 'px ' + p.font;
        ctx.textAlign = p.align || 'left';
        ctx.textBaseline = 'alphabetic';
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = (p.ls || 0) + 'px';
        if (p.glow) { ctx.shadowColor = pal[p.glow]; ctx.shadowBlur = (p.blur || 6) * curK; }
        ctx.fillText(p.text, p.x, p.y);
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
        ctx.globalAlpha = 1;
        return;
      }
      if (p.t === 'halo') { // posterised glow: a few flat, stacked bands
        ctx.fillStyle = pal[p.fill];
        for (var hi = 0; hi < p.n; hi++) {
          var f = 1 - hi / p.n;
          ctx.globalAlpha = p.a; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx * f, p.ry * f, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        return;
      }
      if (p.t === 'line') {
        ctx.beginPath();
        for (var li = 0; li < p.pts.length; li += 2) li ? ctx.lineTo(p.pts[li], p.pts[li + 1]) : ctx.moveTo(p.pts[li], p.pts[li + 1]);
        ctx.strokeStyle = pal[p.fill] || p.fill; ctx.lineWidth = p.lw || 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.globalAlpha = 1;
        return;
      }
      if (p.t === 'ring') {
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.ry || p.r, p.rot || 0, 0, Math.PI * 2);
        ctx.strokeStyle = pal[p.fill] || p.fill; ctx.lineWidth = p.lw || 1; ctx.stroke();
        ctx.globalAlpha = 1;
        return;
      }
      if (p.t === 'blob') {
        function blobPath(clumps) {
          ctx.beginPath();
          clumps.forEach(function (cl) { ctx.ellipse(cl[0], cl[1], Math.max(.1, cl[2]), Math.max(.1, cl[3]), cl[4] || 0, 0, Math.PI * 2); });
        }
        function clumpBox(clumps) {
          var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
          clumps.forEach(function (cl) {
            x0 = Math.min(x0, cl[0] - cl[2]); y0 = Math.min(y0, cl[1] - cl[3]);
            x1 = Math.max(x1, cl[0] + cl[2]); y1 = Math.max(y1, cl[1] + cl[3]);
          });
          return [x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)];
        }
        function paintBlob(node) {
          ctx.fillStyle = pal[node.fill]; blobPath(node.clumps); ctx.fill();
          if (!node.shade) return;
          ctx.save(); blobPath(node.clumps); ctx.clip();
          var box = clumpBox(node.clumps);
          [].concat(node.shade).forEach(function (sh) { stipple(ctx, box, sh, pal[sh.c], rand, dot); });
          ctx.restore();
        }
        paintBlob(p);
        (p.inner || []).forEach(function (inn) {
          ctx.save(); blobPath(p.clumps); ctx.clip();
          ctx.globalAlpha = inn.a == null ? 1 : inn.a;
          paintBlob(inn);
          ctx.restore();
        });
        ctx.globalAlpha = 1;
        return;
      }
      if (p.t === 'glow') { // soft stippled light pool
        ctx.globalAlpha = 1;
        var n = Math.round(p.r * p.r * 3.1 * (p.d || .5));
        ctx.fillStyle = pal[p.fill];
        for (var i = 0; i < n; i++) {
          var ang = rand() * Math.PI * 2, rr = Math.sqrt(rand()) * p.r;
          if (rand() > Math.pow(1 - rr / p.r, 1.4)) continue;
          ctx.fillRect(p.x + Math.cos(ang) * rr * (p.sx || 1), p.y + Math.sin(ang) * rr * (p.sy || 1), dot, dot);
        }
        return;
      }
      shapePath(ctx, p);
      if (p.fill) { ctx.fillStyle = pal[p.fill]; ctx.fill(); }
      ctx.globalAlpha = 1;
      (p.shade ? [].concat(p.shade) : []).forEach(function (sh) {
        ctx.save(); shapePath(ctx, p); ctx.clip();
        stipple(ctx, bounds(p), sh, pal[sh.c], rand, dot);
        ctx.restore();
      });
    });
  }

  // Organic, torn-paper vignette with a stippled soft edge.
  function makeMask(S, W, H, k, dot) {
    var c = canvas(Math.round(W * k), Math.round(H * k)), ctx = c.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0);
    var r = rng(S.mask.seed || 7), m = S.mask, pts = [], N = 260;
    var ph = [r() * 6, r() * 6, r() * 6];
    for (var i = 0; i < N; i++) {
      var a = i / N * Math.PI * 2;
      var ca = Math.cos(a), sa = Math.sin(a);
      // superellipse
      var e = m.round || 6, px = Math.sign(ca) * Math.pow(Math.abs(ca), 2 / e), py = Math.sign(sa) * Math.pow(Math.abs(sa), 2 / e);
      var wob = Math.sin(a * 3 + ph[0]) * 1.6 + Math.sin(a * 7 + ph[1]) * 1.0 + Math.sin(a * 17 + ph[2]) * .5 + (r() - .5) * (m.tear || 1.1);
      var rx = W / 2 - m.inset + wob, ry = H / 2 - m.inset + wob;
      pts.push(W / 2 + px * rx, H / 2 + py * ry);
    }
    var poly = { t: 'poly', pts: pts };
    ctx.fillStyle = '#000'; shapePath(ctx, poly); ctx.fill();
    // feather: punch out stippled dots just inside the edge, and add a few just outside
    var rand = rng(11), F = m.feather || 5;
    ctx.globalCompositeOperation = 'destination-out';
    for (var j = 0; j < pts.length; j += 2) {
      var x = pts[j], y = pts[j + 1], dx = W / 2 - x, dy = H / 2 - y, L = Math.hypot(dx, dy); dx /= L; dy /= L;
      for (var q = 0; q < 12; q++) {
        var d = Math.pow(rand(), 2.4) * F;
        var tx = (rand() - .5) * 4;
        ctx.fillRect(x + dx * d - dy * tx, y + dy * d + dx * tx, dot * 1.3, dot * 1.3);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    return c;
  }

  // ---------- people ----------
  // Flat, faceless: head dot, coat, two legs. Leg phase comes from distance
  // walked, so feet never slide.
  function person(ctx, P, pal, x, foot, s, dist, facing, alpha, rim) {
    if (rim && rim.amt > .02) {
      var rc = rim.c, flat = new Proxy({}, { get: function () { return rc; } });
      ctx.save(); ctx.translate(rim.dx * s, -.5 * s);
      person(ctx, Object.assign({}, P, { shadow: false, bagMark: P.bagMark && 'x' }), flat, x, foot, s * 1.02, dist, facing, (alpha == null ? 1 : alpha) * rim.amt);
      ctx.restore();
    }
    var walking = facing !== 'stand';
    var ph = dist / (P.stride || 9) * Math.PI;
    var bob = walking ? Math.abs(Math.sin(ph)) * .5 : 0;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.translate(x, foot);
    ctx.scale(s * (facing === 'left' ? -1 : 1), s);
    var legH = 15, hip = -legH - bob;
    // shadow
    if (P.shadow !== false) { ctx.fillStyle = pal.shadow; ctx.globalAlpha *= .16; ctx.beginPath(); ctx.ellipse(0, 0, 9, 1.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = alpha == null ? 1 : alpha; }
    // legs
    ctx.fillStyle = pal[P.legs];
    if (facing === 'front') {
      var lift = walking ? Math.sin(ph) : 0;
      ctx.beginPath(); ctx.roundRect(-4.2, hip - Math.max(0, lift) * 1.6, 3.4, legH + Math.min(0, -Math.max(0, lift) * 0) , 1.6); ctx.fill();
      ctx.beginPath(); ctx.roundRect(0.8, hip - Math.max(0, -lift) * 1.6, 3.4, legH, 1.6); ctx.fill();
    } else {
      var sw = walking ? Math.sin(ph) * .42 : 0;
      [sw, -sw].forEach(function (a, i) {
        ctx.save(); ctx.translate(i ? .4 : -.4, hip + 1); ctx.rotate(a);
        ctx.beginPath(); ctx.roundRect(-1.7, 0, 3.4, legH, 1.6); ctx.fill(); ctx.restore();
      });
    }
    // coat
    ctx.fillStyle = pal[P.coat];
    ctx.beginPath(); ctx.roundRect(-5.6, hip - 21, 11.2, 23 + (P.long || 0), [4.5, 4.5, 2, 2]); ctx.fill();
    // bag (hangs from the hand, swings a touch with the step)
    if (P.bag) {
      ctx.save(); ctx.translate(facing === 'front' ? 6.4 : 2.8, hip - 6);
      ctx.rotate(walking ? Math.sin(ph) * .1 : 0);
      ctx.fillStyle = pal[P.bag];
      ctx.fillRect(-.5, 0, 1, 3.2);                 // handle
      ctx.beginPath(); ctx.roundRect(-4, 3, 8, 9.5, .8); ctx.fill();
      if (P.bagMark) { ctx.fillStyle = pal[P.bagMark]; ctx.fillRect(-2.2, 6.4, 4.4, 1.1); }
      ctx.restore();
    }
    // head
    ctx.fillStyle = pal[P.hair];
    ctx.beginPath(); ctx.arc(0, hip - 25.5, 4.4, 0, Math.PI * 2); ctx.fill();
    if (P.hat) { // bucket hat: crown + brim
      ctx.fillStyle = pal[P.hat];
      ctx.beginPath(); ctx.roundRect(-4.4, hip - 32.2, 8.8, 5.6, [3.4, 3.4, 0, 0]); ctx.fill();
      ctx.beginPath(); ctx.roundRect(-6.6, hip - 27.4, 13.2, 2.2, 1.1); ctx.fill();
    }
    ctx.restore();
  }

  // keyframed x for loitering shoppers: [[t, x], ...] over a period
  function track(keys, period, t) {
    var u = ((t % period) + period) % period;
    for (var i = 0; i < keys.length - 1; i++) {
      var a = keys[i], b = keys[i + 1];
      if (u >= a[0] && u <= b[0]) {
        var f = b[0] === a[0] ? 0 : (u - a[0]) / (b[0] - a[0]);
        return { x: a[1] + (b[1] - a[1]) * easeInOut(f), moving: a[1] !== b[1] && f > 0 && f < 1, dir: b[1] > a[1] ? 'right' : 'left' };
      }
    }
    return { x: keys[keys.length - 1][1], moving: false, dir: 'right' };
  }

  // ---------- time of day ----------
  // Scenes list periods by local start time; dark theme always shows night. ?tod=<name> overrides for review.
  var DEFAULT_PERIODS = [['morning', '05:00'], ['midday', '11:00'], ['golden', '15:30'], ['night', '18:00']];
  function mins(hm) { var a = hm.split(':'); return +a[0] * 60 + +(a[1] || 0); }
  LS.period = function (S, date) {
    S = S || LS.newest();
    var o = new URLSearchParams(location.search).get('tod');
    if (o && S.variants && S.variants[o]) return o;
    var forced = document.documentElement.getAttribute('data-tod');      // a page-level light (e.g. a "Change the light" menu) wins
    if (forced && S.variants && S.variants[forced]) return forced;
    var dark = document.documentElement.getAttribute('data-theme');
    if (dark ? dark === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches) return 'night';
    var P = S.periods || DEFAULT_PERIODS, d = date || new Date(), m = d.getHours() * 60 + d.getMinutes(), key = P[P.length - 1][0];
    P.forEach(function (p) { if (m >= mins(p[1])) key = p[0]; });
    if (m < mins(P[0][1])) key = P[P.length - 1][0];      // after midnight, before the first period: still the last one
    return S.variants && S.variants[key] ? key : (S.variants && S.variants.day ? 'day' : key);
  };
  // the palette in use right now (pages use it to tint things that sit beside the scene)
  LS.palette = function (S) { S = S || LS.newest(); var k = LS.period(S); return (S.variants ? S.variants[k] : { palette: S.palette.light }).palette; };

  // a sheet of the scene's paper: flat colour, the same stipple grain, the same soft vignette edge
  LS.paper = function (cv, prims, pal, S, opts) {
    S = S || LS.newest();
    var W = S.size[0], H = S.size[1], rect = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!rect.width) return;
    var cw = Math.round(rect.width * dpr), ch = Math.round(cw * H / W), kk = cw / W, dot = Math.max(.55, 1.15 / kk);
    cv.width = cw; cv.height = ch;
    var x = cv.getContext('2d'); x.setTransform(kk, 0, 0, kk, 0, 0);
    drawPrims(x, prims, pal, rng(S.seed + 777), dot);
    x.setTransform(1, 0, 0, 1, 0, 0);
    if (opts && opts.mask === false) return x;           // caller shapes it (e.g. a crisp card)
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(makeMask(S, W, H, kk, dot), 0, 0); x.globalCompositeOperation = 'source-over';
  };

  // ---------- the component ----------
  LS.mount = function (root, S, opts) {
    opts = opts || {};
    S = S || LS.newest();
    var W = S.size[0], H = S.size[1];
    var cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
    var layers = null, mask = null, frameBuf = null, leafSprites = null, k = 1, theme = null, vkey = null;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var exitedFor = null, sigStart = null, clock = 0, last = null, raf = 0, visible = false, played = false, held = false;
    function periodNow() {
      if (opts.tod && S.variants && S.variants[opts.tod]) return opts.tod;
      return LS.period(S);
    }

    root.setAttribute('aria-label', S.alt);
    function V() { return S.variants ? S.variants[vkey] : { palette: S.palette[theme], add: {} }; }
    var fade = document.createElement('canvas'); fade.className = 'ls-fade'; fade.setAttribute('aria-hidden', 'true');
    cv.parentNode.appendChild(fade);

    function isDark() {
      var t = document.documentElement.getAttribute('data-theme');
      if (t) return t === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function build() {
      var rect = cv.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var cw = Math.max(1, Math.round(rect.width * dpr)), ch = Math.round(cw * H / W);
      cv.width = cw; cv.height = ch;
      k = curK = cw / W; theme = isDark() ? 'dark' : 'light';
      var prevKey = vkey; vkey = periodNow();
      if (prevKey !== vkey) root.dispatchEvent(new CustomEvent('lastseen:variant', { bubbles: true, detail: { period: vkey, palette: V().palette } }));
      var v = V(), pal = v.palette, dot = Math.max(.55, 1.15 / k), add = v.add || {};
      layers = {};
      ['back', 'facade', 'front', 'over'].forEach(function (name) {
        var prims = (S.layers[name] || []).concat(add[name] || []);
        if (!prims.length) return;
        var c = canvas(cw, ch), x = c.getContext('2d');
        x.setTransform(k, 0, 0, k, 0, 0);
        drawPrims(x, prims, pal, rng(S.seed + name.length * 97), dot);
        layers[name] = c;
      });
      // agave leaves: one stippled sprite per plant, drawn per leaf with rotation
      leafSprites = (S.agaves || []).map(function (ag, gi) {
        var rand = rng(S.seed + 300 + gi);
        return ag.leaves.map(function (lf) {
          var L = lf.len, w = lf.w, c = canvas(Math.ceil((w + 2) * k), Math.ceil((L + 2) * k)), x = c.getContext('2d');
          x.setTransform(k, 0, 0, k, 0, 0);
          var p = { t: 'poly', pts: [1, L + 1, 1 + w / 2, 1, 1 + w, L + 1] };
          drawPrims(x, [Object.assign(p, { fill: lf.c, shade: [{ c: 'agaveShade', d: .55, dir: lf.side < 0 ? 'left' : 'right', p: 2 }, { c: 'agaveLight', d: .18, dir: 'up', p: 3 }] })], pal, rand, dot);
          return c;
        });
      });
      mask = makeMask(S, W, H, k, dot);
      frameBuf = canvas(cw, ch);
    }

    function draw(t, st) {
      var v = V(), pal = v.palette, f = frameBuf.getContext('2d'), lt = v.light;
      function runAnim(layer) {
        (S.anim || []).forEach(function (a) {
          if ((a.layer || 'front') !== layer || !a.draw) return;
          f.save(); f.setTransform(k, 0, 0, k, 0, 0); a.draw(f, t, pal, v); f.restore();
        });
      }
      function rimFor(g) {
        if (!lt) return null;
        var d = g.x - lt.x, amt = clamp(1 - Math.abs(d) / lt.r, 0, 1) * (g.inside ? .6 : 1);
        return { c: pal[lt.c], amt: amt * (lt.amt || 1), dx: d > 0 ? -lt.off : lt.off };
      }
      f.setTransform(1, 0, 0, 1, 0, 0);
      f.globalCompositeOperation = 'source-over';
      f.clearRect(0, 0, frameBuf.width, frameBuf.height);
      if (layers.back) f.drawImage(layers.back, 0, 0);
      f.setTransform(k, 0, 0, k, 0, 0);
      runAnim('back');
      // the shop's light breathes, very slowly
      var br = Object.assign({}, S.breathe, v.breathe || {});
      f.globalAlpha = br.a + br.amp * Math.sin(t / br.period * Math.PI * 2);
      f.fillStyle = pal[br.c]; f.fillRect(br.x, br.y, br.w, br.h);
      f.globalAlpha = 1;
      // shoppers inside
      (v.shoppers || S.shoppers).forEach(function (sp) {
        var tr = track(sp.keys, sp.period, t + (sp.offset || 0));
        person(f, sp, pal, tr.x, sp.foot, sp.s, tr.x, tr.moving ? tr.dir : (sp.idle || 'stand'), sp.alpha);
      });
      // signature figure while still inside the doorway
      var sig = S.signature, sp = st == null ? null : (t - st);
      var figs = [];
      if (sp != null && sp >= 0) {
        var e = sig.emerge, w = sig.walk;
        if (sp < e.dur) {
          var q = easeOut(sp / e.dur);
          figs.push({ P: sig.person, x: e.x, foot: e.foot0 + (e.foot1 - e.foot0) * q, s: e.s0 + (e.s1 - e.s0) * q,
            dist: sp * e.stepRate, facing: 'front', alpha: clamp(sp / e.fade, 0, 1), inside: q < .5 });
        } else if (sp < e.dur + w.pause) {
          figs.push({ P: sig.person, x: e.x, foot: e.foot1, s: e.s1, dist: 0, facing: 'stand', alpha: 1 });
        } else {
          var tw = sp - e.dur - w.pause, acc = Math.min(1, tw / w.accel);
          var dist;
          dist = tw < w.accel ? w.speed * tw * tw / (2 * w.accel) : w.speed * (tw - w.accel / 2);
          var x = e.x + dist * w.dir, wf = e.foot1 + dist * (w.dy || 0), ws = e.s1 + dist * (w.ds || 0);
          var gone = w.exitX ? (w.dir > 0 ? x > w.exitX : x < w.exitX) : (x > W + 6 || x < -6);
          if (gone && exitedFor !== st && typeof st === 'number') { exitedFor = st; root.dispatchEvent(new CustomEvent('lastseen:exit', { bubbles: true, detail: { dir: w.dir, x: x / W, foot: Math.min(wf, H) / H } })); }
          if (x > -30 && x < W + 30 && wf - ws * 40 < H) figs.push({ P: sig.person, x: x, foot: wf, s: ws, dist: dist, facing: w.dir > 0 ? 'right' : 'left', alpha: 1 });
        }
      } else if (st === 'still') {
        figs.push({ P: sig.person, x: sig.still.x, foot: sig.emerge.foot1, s: sig.emerge.s1, dist: 0, facing: 'front', alpha: 1 });
      }
      figs.filter(function (g) { return g.inside; }).forEach(function (g) { person(f, g.P, pal, g.x, g.foot, g.s, g.dist, g.facing, g.alpha, rimFor(g)); });
      // facade over the interior (a place with nothing in front of the interior skips the layer)
      if (layers.facade) { f.setTransform(1, 0, 0, 1, 0, 0); f.drawImage(layers.facade, 0, 0); }
      f.setTransform(k, 0, 0, k, 0, 0);
      // agave leaves sway from their base
      (S.agaves || []).forEach(function (ag, gi) {
        ag.leaves.forEach(function (lf, li) {
          var sway = Math.sin(t * ag.rate + li * .7 + gi * 2) * ag.amp * (lf.len / 40);
          var spr = leafSprites[gi][li];
          f.save(); f.translate(ag.x, ag.y); f.rotate((lf.ang + sway) * Math.PI / 180);
          f.drawImage(spr, -(lf.w / 2 + 1), -(lf.len + 1), spr.width / k, spr.height / k);
          f.restore();
        });
      });
      if (layers.front) { f.setTransform(1, 0, 0, 1, 0, 0); f.drawImage(layers.front, 0, 0); }
      f.setTransform(k, 0, 0, k, 0, 0);
      runAnim('front');
      // passers-by on the sidewalk
      (v.passersby || S.passersby).forEach(function (pb) {
        if (t < pb.start) return;
        var u = (t - pb.start) % pb.every, d = u * pb.speed, x = pb.dir > 0 ? -24 + d : W + 24 - d;
        if (x > -30 && x < W + 30) figs.push({ P: pb, x: x, foot: pb.foot, s: pb.s, dist: d, facing: pb.dir > 0 ? 'right' : 'left', alpha: 1 });
      });
      figs.filter(function (g) { return !g.inside; }).sort(function (a, b) { return a.foot - b.foot; })
        .forEach(function (g) { person(f, g.P, pal, g.x, g.foot, g.s, g.dist, g.facing, g.alpha, rimFor(g)); });
      // night glows (lamps, haze) add light on top
      if (layers.over) { f.setTransform(1, 0, 0, 1, 0, 0); f.globalCompositeOperation = 'screen'; f.drawImage(layers.over, 0, 0); f.globalCompositeOperation = 'source-over'; }
      // vignette
      f.setTransform(1, 0, 0, 1, 0, 0);
      f.globalCompositeOperation = 'destination-in';
      f.drawImage(mask, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(frameBuf, 0, 0);
    }

    function frame(now) {
      raf = 0;
      if (last != null) clock += Math.min(.05, (now - last) / 1000);
      last = now;
      draw(clock, sigStart);
      schedule();
    }
    var lastPaint = 0;
    function tick(now) { // ~30fps is plenty for motion this slow
      raf = 0;
      if (now - lastPaint < 31) { schedule(); return; }
      lastPaint = now; frame(now);
    }
    function schedule() { if (!opts.manual && !raf && visible && !held && !document.hidden && !reduce.matches) raf = requestAnimationFrame(tick); }
    function still() { draw(S.signature.still.t, 'still'); }

    function play() { sigStart = clock + S.signature.delay; played = true; }
    function start() {
      if (reduce.matches) { still(); return; }
      if (!played) play();
      last = null; schedule();
    }

    function rebuild() {
      build();
      if (opts.manual) { draw(clock, sigStart == null ? 'still' : sigStart); return; }
      reduce.matches || !visible ? still() : draw(clock, sigStart);
    }
    build(); still();

    if (!opts.manual) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting && es[0].intersectionRatio >= .5;
        if (visible) start(); else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      }, { threshold: [0, .5] }).observe(root);
      document.addEventListener('visibilitychange', function () { if (!document.hidden) { last = null; schedule(); } });
      reduce.addEventListener('change', function () { reduce.matches ? still() : start(); });
      root.addEventListener('click', function () {
        if (reduce.matches) return;
        var e = S.signature, dur = e.emerge.dur + e.walk.pause + e.walk.accel + (W / 2 + 40) / e.walk.speed;
        if (sigStart == null || clock - sigStart > dur || clock < sigStart) { sigStart = clock + .15; }
      });
    }
    function themeSwap() {
      // keep the old frame on top and fade it out, so day turns into night without a flash.
      // Golden ↔ night must not opacity-blend: warm paper over black averages to a muddy grey.
      // Darken the old frame through a warm brown first, then reveal the new one.
      // A page view-transition already crossfades the whole screen, so skip this overlay then.
      var from = vkey;
      var vt = document.documentElement.classList.contains('pc-vt');
      if (!reduce.matches && cv.width && !vt) {
        fade.width = cv.width; fade.height = cv.height;
        fade.getContext('2d').drawImage(cv, 0, 0);
        fade.style.transition = 'none'; fade.style.filter = 'none'; fade.style.opacity = '1';
      }
      rebuild();
      var to = vkey;
      var warm = (from === 'golden' && to === 'night') || (from === 'night' && to === 'golden');
      if (reduce.matches || vt) return;
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        if (warm) {
          fade.style.transition = 'filter 460ms cubic-bezier(0.4, 0, 0.2, 1), opacity 320ms cubic-bezier(0.4, 0, 0.2, 1) 180ms';
          fade.style.filter = 'brightness(0.16) sepia(0.55)';
          fade.style.opacity = '0';
        } else {
          fade.style.transition = 'opacity 300ms cubic-bezier(0.2, 0, 0, 1)';
          fade.style.opacity = '0';
        }
      }); });
    }
    // the period can change while the page is open: check each minute, crossfade like a theme change
    if (!opts.manual) {
      setInterval(function () { if (periodNow() !== vkey) themeSwap(); }, 60000);
      new MutationObserver(function () { if ((isDark() ? 'dark' : 'light') !== theme || periodNow() !== vkey) themeSwap(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-tod'] });
    }
    var ro = new ResizeObserver(function () { if (Math.round(cv.getBoundingClientRect().width * Math.min(window.devicePixelRatio || 1, 2)) !== cv.width) rebuild(); });
    ro.observe(cv);
    if (document.fonts) document.fonts.ready.then(rebuild);

    var api = {
      opts: opts,
      renderAt: function (t, st) { clock = t; draw(t, st == null ? sigStart : st); },
      rebuild: rebuild,
      replay: function () { sigStart = clock + (S.signature ? S.signature.delay : 0); played = true; exitedFor = null; },
      pause: function () { visible = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    };
    if (!opts.manual) {
      LS._renderAt = api.renderAt;
      LS._variant = function () { return vkey; };
      LS._hold = function (h) { h = !!h; if (h === held) return; held = h; if (h) { if (raf) cancelAnimationFrame(raf); raf = 0; } else { last = null; schedule(); } };
      LS._pause = api.pause;
    }
    return api;
  };

  // caption: "Last seen at <place> · N hours ago", localized with the site's lang toggle
  LS.caption = function (el, S) {
    S = S || LS.newest();
    // Optional page template: data-tpl-en / data-tpl-ja with {who} (an existing .ls-who node) and {place}.
    var pre = el.querySelector('.ls-pre'), post = el.querySelector('.ls-post');
    function render() {
      var lang = document.documentElement.getAttribute('data-lang') || localStorage.getItem('lang') || 'en';
      var diff = Math.max(0, (Date.now() - Date.parse(S.seenAt)) / 1000), rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
      var short = el.getAttribute('data-format') === 'short';
      if (short && lang !== 'ja') rtf = { format: function (n, u) { return Math.abs(n) + ({ minute: 'm', hour: 'h', day: 'd' })[u] + ' ago'; } };
      // floor, like people say it: 2h 40m is still "2h ago"
      var ago = diff < 3600 ? rtf.format(-Math.max(1, Math.floor(diff / 60)), 'minute')
        : diff < 86400 ? rtf.format(-Math.floor(diff / 3600), 'hour') : rtf.format(-Math.floor(diff / 86400), 'day');
      var place = (S.place[lang] || S.place.en).replace(/ /g, '\u00a0');
      var tpl = el.getAttribute('data-tpl-' + lang) || el.getAttribute('data-tpl-en');
      if (tpl && pre && post) {
        var parts = tpl.replace('{place}', place).split('{who}');
        pre.textContent = parts[0]; post.textContent = parts[1] || '';
      } else {
        var c = S.caption[lang] || S.caption.en;
        el.querySelector('.ls-where').textContent = c.replace('{place}', place);
      }
      var tm = el.querySelector('time'); tm.textContent = ago; tm.dateTime = S.seenAt;
      el.dispatchEvent(new CustomEvent('lastseen:caption', { detail: { lang: lang } }));
    }
    render();
    // re-render on the minute boundary so "Nh ago" ticks over on time
    (function loop() { setTimeout(function () { render(); loop(); }, 60000 - Date.now() % 60000 + 50); })();
    window.addEventListener('langchange', render);
  };
})();
