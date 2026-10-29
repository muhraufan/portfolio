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
  // Painted by the same hand as the place: flat shapes, a shadow side in two steps, the house stipple grain
  // and an edge of the scene's light. Each figure is drawn into a small scratch sprite in device pixels, shaded
  // and grained there, then composited once (so a fading figure never shows its own overlaps).
  // The gait is a pure function of distance walked: a planted foot stays put on the ground, the hip rides
  // over it (that is the bob), and the arms swing against the legs with a little follow-through.
  var FIG = { a: canvas(8, 8), b: canvas(8, 8), pat: {}, n: 0 }, DUTY = .56;
  function figFit(c, w, h) { if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); } }
  function figGrain(ctx, col, px, cover, seed) {     // one tile of the house stipple per colour/dot size, made once
    var key = col + '|' + px.toFixed(2) + '|' + cover, p = FIG.pat[key];
    if (p) return p;
    if (++FIG.n > 96) { FIG.pat = {}; FIG.n = 1; }
    var T = 96, c = canvas(T, T), x = c.getContext('2d'), r = rng(seed || 5), n = Math.round(T * T * cover / (px * px));
    x.fillStyle = col;
    for (var i = 0; i < n; i++) x.fillRect(r() * (T - px), r() * (T - px), px, px);
    return (FIG.pat[key] = ctx.createPattern(c, 'repeat'));
  }
  function figMix(a, b, t) { var A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), o = 0;
    for (var i = 16; i >= 0; i -= 8) { var x = A >> i & 255, y = B >> i & 255; o = o * 256 + Math.round(x + (y - x) * t); }
    return '#' + (o + 0x1000000).toString(16).slice(1); }
  // where a foot is in its cycle c ∈ [0,1): planted and sliding back under the body, then an eased swing forward
  function footAt(c, half) {
    if (c < DUTY) return { x: half * (1 - 2 * c / DUTY), lift: 0 };
    var v = (c - DUTY) / (1 - DUTY), e = v * v * (3 - 2 * v);
    return { x: half * (2 * e - 1), lift: Math.sin(Math.PI * v) };
  }
  function knee(hx, hy, fx, fy, T, S) {              // two-bone leg, knee bends forward (+x)
    var dx = fx - hx, dy = fy - hy, d = Math.min(Math.hypot(dx, dy), T + S - .001), a = Math.atan2(dy, dx);
    var k = Math.acos(clamp((T * T + d * d - S * S) / (2 * T * d), -1, 1));
    return [hx + Math.cos(a - k) * T, hy + Math.sin(a - k) * T];
  }
  function stroke(x, pts, w, col) {
    x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]);
    x.stroke();
  }
  function blob(x, col, a, fn) { x.globalAlpha = a; x.fillStyle = col; x.beginPath(); fn(); x.fill(); x.globalAlpha = 1; }

  function person(ctx, P, pal, x, foot, s, dist, facing, alpha, rim) {
    alpha = alpha == null ? 1 : alpha;
    if (alpha <= .01) return;
    var m = ctx.getTransform(), k = Math.hypot(m.a, m.b), ks = k * s, flip = facing === 'left' ? -1 : 1;
    var front = facing === 'front', walking = facing !== 'stand', fine = ks >= 2.1;
    var X = m.a * x + m.c * foot + m.e, Y = m.b * x + m.d * foot + m.f;
    var sh = pal.shadow || '#3a2e25', skin = pal.skin || '#c9a88a', coat = pal[P.coat], legs = pal[P.legs], hair = pal[P.hair] || legs;
    // contact shadow, straight onto the scene
    if (P.shadow !== false) {
      ctx.save(); ctx.translate(x, foot); ctx.scale(s, s); ctx.fillStyle = sh;
      ctx.globalAlpha = .12 * alpha; ctx.beginPath(); ctx.ellipse(0, 0, front ? 8 : 9.5, 1.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = .12 * alpha; ctx.beginPath(); ctx.ellipse(.4, 0, 5, 1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // the sprite: foot point lands on whole device pixels plus its own fraction, so the grain stays crisp
    var ox = Math.ceil(14 * ks) + 4, oy = Math.ceil(51 * ks) + 4, w = ox * 2, h = oy + Math.ceil(3 * ks) + 4;
    figFit(FIG.a, w, h); figFit(FIG.b, w, h);
    var A = FIG.a.getContext('2d'), fx0 = Math.floor(X), fy0 = Math.floor(Y);
    A.setTransform(1, 0, 0, 1, 0, 0); A.globalCompositeOperation = 'source-over'; A.globalAlpha = 1; A.clearRect(0, 0, w, h);
    A.setTransform(ks * flip, 0, 0, ks, ox + X - fx0, oy + Y - fy0);
    A.lineCap = 'round'; A.lineJoin = 'round';

    var L = 15, R = L + .1, T = 13.95 * .5, Sh = T,   /* side legs fit the hip-ankle span when straight (they were longer: a built-in crouch) */ stride = P.stride || 9, half = stride * DUTY;
    var cA = (((dist || 0) / (2 * stride)) % 1 + 1) % 1, cB = (cA + .5) % 1;
    var fa = walking ? footAt(cA, half) : { x: -1.3, lift: 0 }, fb = walking ? footAt(cB, half) : { x: 1.5, lift: 0 };
    var hipY, long = P.long || 0, skirt = P.skirt;

    if (!front) {
      // ---- side view, facing +x ----
      // a real gait: the standing leg stays nearly straight (a touch of give just after heel strike), so the hip rides
      // highest over mid-stance and lowest in double support; the knee bends mainly in swing (~60deg just after toe-off)
      // and is straight again as the heel lands. The planted foot never slides: it moves back exactly with the ground.
      var G = -1.1, LL = T + Sh, gc = function (c) { return c < DUTY ? c / DUTY : -1; };
      var reachOf = function (deg) { return 2 * T * Math.cos(deg * Math.PI / 360); };          // hip-ankle span for a knee angle
      var stanceDeg = function (u) { return 4 + 9 * Math.exp(-Math.pow((u - .14) / .09, 2)); };  // loading response, then ~straight
      var swingDeg = function (v) { return v < .28 ? 34 + 26 * Math.sin(v / .28 * Math.PI / 2) : 3 + 57 * (1 + Math.cos(Math.PI * (v - .28) / .72)) / 2; };
      if (walking) {
        var hs = [];
        [[fa, cA], [fb, cB]].forEach(function (q) { var u = gc(q[1]); if (u >= 0 && u < .88) { var r = reachOf(stanceDeg(u)); hs.push(Math.sqrt(Math.max(0, r * r - q[0].x * q[0].x))); } });
        var hMid = reachOf(4), hLow = hs.length ? Math.min.apply(null, hs) : hMid;
        hipY = G - (hMid - .55 * (hMid - hLow));     // heel and toe roll take up part of the drop: a calm bob, not a bounce
      } else hipY = G - Math.sqrt(LL * LL * .995 - 1.96);
      var lean = walking ? .055 : 0, top = hipY - 21;
      var legOf = function (f, c, hx) {               // the ankle: planted on the ground, or carried by the swing knee
        if (!walking) return [f.x, G, 0];
        var u = gc(c), dx = f.x - hx, r, y;
        if (u >= 0) { r = LL - .002; y = hipY + Math.sqrt(Math.max(0, r * r - dx * dx)); var up = Math.max(0, G - y); return [f.x, Math.min(G, y), u < .5 ? -Math.min(.3, up * .5) : Math.min(.5, up * .5)]; }  // landing: toe still up; leaving: the heel peels (toe down) rather than the leg stretching
        var v = (c - DUTY) / (1 - DUTY); r = reachOf(swingDeg(v));
        y = hipY + Math.sqrt(Math.max(0, r * r - dx * dx));
        return [f.x, Math.min(G, y), .45 * (1 - v) - .22 * Math.sin(Math.PI * Math.min(1, v / .95) / 2) * v];   // toe trails after push-off, lifts for the heel strike
      };
      var drawLeg = function (f, far) {
        var hx = far ? -.6 : .6, an = legOf(f, far ? cA : cB, hx), kn = knee(hx, hipY, an[0], an[1], T, Sh), lw = skirt ? 2 : 2.75;

        stroke(A, [hx, hipY, kn[0], kn[1]], lw + .45, legs); stroke(A, [kn[0], kn[1], an[0], an[1]], lw, legs);
        if (!skirt && fine) blob(A, sh, .28, function () { A.rect(an[0] - 1.5, an[1] - .9, 3, .5); });             // the trouser break
        if (P.sock) blob(A, pal[P.sock], 1, function () { A.rect(an[0] - 1.25, an[1] - 1.25, 2.5, .95); });     // a band of sock above the shoe
        A.save(); A.translate(an[0], an[1]); A.rotate(an[2]);
        if (P.shoe) {                       // trainers: a pale upper, the sole a lighter band, a stripe on the side
          A.fillStyle = pal[P.shoe]; A.beginPath(); A.roundRect(-1.5, -.75, 4.6, 1.85, [.8, 1.4, .45, .45]); A.fill();
          blob(A, sh, far ? .34 : .16, function () { A.roundRect(-1.5, -.75, 4.6, 1.85, [.8, 1.4, .45, .45]); });
          if (P.sole) blob(A, pal[P.sole], 1, function () { A.roundRect(-1.5, .55, 4.6, .55, [0, .3, .45, .45]); });
          if (P.shoeMark && fine) { A.globalAlpha = far ? .6 : .9; stroke(A, [-.4, -.5, 1, .4, 2.2, -.4], .42, pal[P.shoeMark]); A.globalAlpha = 1; }
        } else {
        A.fillStyle = legs; A.beginPath(); A.roundRect(-1.4, -.45, 4.4, 1.55, [.7, 1.3, .45, .45]); A.fill();     // shoe, toe forward
        blob(A, sh, .45, function () { A.roundRect(-1.4, -.45, 4.4, 1.55, [.7, 1.3, .45, .45]); });
        }
        A.restore();
        if (far) { A.globalAlpha = .2; stroke(A, [hx, hipY, kn[0], kn[1], an[0], an[1]], lw + .3, sh); A.globalAlpha = 1; }
      };
      // arms: the near arm swings against the near leg, a beat late; the far arm mirrors it
      var holds = !!P.bag, amp = walking ? .34 : 0, sw = Math.cos(2 * Math.PI * (cB - .07));
      var arm = function (a, bend) {
        var sx = .3, sy = top + 1.7, ex = sx + Math.sin(a) * 6, ey = sy + Math.cos(a) * 6, b = a + bend, hx2 = ex + Math.sin(b) * 5.4, hy2 = ey + Math.cos(b) * 5.4;
        return [sx, sy, ex, ey, hx2, hy2];
      };
      var near = arm(-amp * (holds ? .32 : 1) * sw + (walking ? .04 : .05), holds ? .04 : .14 + Math.max(0, -amp * sw) * .9);
      var far = arm(amp * sw + .02, .14 + Math.max(0, amp * sw) * .9);
      A.save(); A.translate(0, hipY); A.rotate(lean); A.translate(0, -hipY);      // the upper body leans into the walk, from the hip
      // far arm, behind everything
      stroke(A, far, 2.6, coat); A.globalAlpha = .26; stroke(A, far, 2.6, sh); A.globalAlpha = 1;
      blob(A, skin, 1, function () { A.arc(far[4] + .05, far[5] + .5, 1.05, 0, Math.PI * 2); });
      blob(A, sh, .22, function () { A.arc(far[4] + .05, far[5] + .5, 1.05, 0, Math.PI * 2); });
      A.restore();
      drawLeg(fa, true);
      drawLeg(fb, false);
      A.save(); A.translate(0, hipY); A.rotate(lean); A.translate(0, -hipY);
      var hc = [.75, top - 5.3];
      // neck, then the coat over it
      blob(A, skin, 1, function () { A.rect(-.3, top - 3.2, 2.3, 4); });
      blob(A, sh, .18, function () { A.rect(-.3, top - 1.2, 2.3, 2); });
      var hood = !!P.hood;                  // a hoodie instead of the coat: hip length, a ribbed hem, the hood lying on the back
      var hem = skirt ? hipY - 1.5 : hood ? hipY - 5.2 : hipY + 2.2 + long, fl = hood ? -.2 : (skirt ? .1 : .5) + long * .06, sway = walking ? Math.sin(2 * Math.PI * cA) * (hood ? .15 : .35) : 0;
      if (P.carry === 'backpack') {        // sits on the back, behind the coat's line
        A.fillStyle = pal[P.carryC]; A.beginPath(); A.roundRect(-8.4, top + 1.2, 5, 10.2, [2, 1.2, 1.4, 1.6]); A.fill();
        blob(A, sh, .2, function () { A.rect(-8.4, top + 7.8, 5, 3.6); });
      }
      var coatPath = function () {
        A.beginPath(); A.moveTo(-3.9, top + 1.3);
        A.quadraticCurveTo(-4.1, top - .7, -1.4, top - .8); A.lineTo(1.9, top - .8);
        A.quadraticCurveTo(4.3, top - .6, 4.4, top + 2.2);
        A.quadraticCurveTo(4.6, (top + hem) / 2, 5.2 + fl + sway, hem - .7);
        A.quadraticCurveTo(5.3 + fl + sway, hem, 4.5 + fl + sway, hem);
        A.lineTo(-4.9 - fl + sway * .6, hem);
        A.quadraticCurveTo(-5.7 - fl + sway * .6, hem, -5.6 - fl + sway * .6, hem - .8);
        A.quadraticCurveTo(-5.0, (top + hem) / 2 + 2, -4.5, top + 4.5); A.closePath();
      };
      if (skirt) {                        // A-line skirt under a short jacket
        A.fillStyle = pal[P.skirtC || P.legs]; A.beginPath(); A.moveTo(-4.4, hipY - 3); A.lineTo(4.2, hipY - 3); A.lineTo(5.6 + sway, hipY + 6.4); A.lineTo(-5.8 + sway * .6, hipY + 6.4); A.closePath(); A.fill();
        if (fine) blob(A, sh, .16, function () { A.moveTo(.6, hipY - 1); A.lineTo(1.6 + sway, hipY + 6.4); A.lineTo(-.4 + sway, hipY + 6.4); A.closePath(); });
      }
      if (hood) {                         // hip-length: the trousers show from the top of the thigh
        A.fillStyle = legs; A.beginPath(); A.roundRect(-4.3, hem - 1.2, 8.4, hipY - hem + 2.6, [0, 0, 2.2, 2.6]); A.fill();
        blob(A, sh, .2, function () { A.rect(-4.3, hem - 1.2, 2.2, hipY - hem + 2.6); });
      }
      A.fillStyle = coat; coatPath(); A.fill();
      A.save(); coatPath(); A.clip();
      blob(A, sh, .12, function () { A.rect(-8, hem - 1.1, 16, 1.2); });                                   // the hem turns under
      if (hood) {
        blob(A, sh, .28, function () { A.rect(-8, hem - 1.7, 16, 1.7); });                                   // the ribbed band
        blob(A, sh, .3, function () { A.rect(-8, hem - 1.9, 16, .35); });
        if (fine) { A.globalAlpha = .24; stroke(A, [4.6, hem - 4.6, 2.5, hem - 4.2, 1.7, hem - 1.6], .45, sh); A.globalAlpha = 1;   // the kangaroo pocket's mouth
          blob(A, sh, .1, function () { A.moveTo(-3.6, hem - 1.5); A.lineTo(-2.7, hem - 5); A.lineTo(-1.9, hem - 1.5); A.closePath(); }); }   // a soft fold at the back
      } else if (fine) {
        blob(A, sh, .2, function () { A.moveTo(.9, top - .9); A.lineTo(3.6, top - .7); A.lineTo(1.7, top + 3); A.closePath(); });   // collar
        A.globalAlpha = .22; stroke(A, [3.3, top + 2.6, 3.9 + fl * .6 + sway, hem], .45, sh); A.globalAlpha = 1;                    // where the coat closes
        blob(A, sh, .16, function () { A.moveTo(.8 + sway, hem); A.lineTo(1.9, hem - 5.5 - long * .4); A.lineTo(2.9 + sway, hem); A.closePath(); });   // a fold at the hem
        blob(A, sh, .1, function () { A.moveTo(-3.2 + sway * .6, hem); A.lineTo(-2.4, hem - 4); A.lineTo(-1.6 + sway * .6, hem); A.closePath(); });
      }
      A.restore();
      if (hood) {                         // the hood, down: a soft pointed fold on the back of the neck and shoulders
        var hoodPath = function () { A.beginPath(); A.moveTo(1.3, top - .8); A.quadraticCurveTo(-1.8, top - 3.9, -5.2, top - 2.7);
          A.quadraticCurveTo(-7.1, top - 1.3, -6.5, top + 2.6); A.quadraticCurveTo(-5.9, top + 5.6, -3.5, top + 6.4); A.quadraticCurveTo(-2.6, top + 3, -.4, top + .6); A.closePath(); };
        A.fillStyle = coat; hoodPath(); A.fill();
        A.save(); hoodPath(); A.clip();
        blob(A, sh, .26, function () { A.moveTo(1.4, top - .7); A.quadraticCurveTo(-1.6, top - 3.1, -4.6, top - 1.9); A.quadraticCurveTo(-3.4, top - .9, -.6, top - .2); A.closePath(); });   // its opening, in shadow
        blob(A, sh, .16, function () { A.rect(-8, top + 2.6, 5.2, 4); });
        A.restore();
        A.globalAlpha = .3; stroke(A, [-6.5, top + 2.6, -5.9, top + 5.6, -3.5, top + 6.4, -2.6, top + 3, -.4, top + .6], .45, sh); A.globalAlpha = 1;   // its edge, lifting off the back
        if (fine) { A.globalAlpha = .9; stroke(A, [2.4, top - .2, 2.7, top + 3.6], .38, P.string ? pal[P.string] : figMix(coat, '#ffffff', .45)); A.globalAlpha = 1; }   // a drawstring
      }
      if (P.carry === 'backpack') { A.globalAlpha = 1; stroke(A, [-3.6, top + .6, 1.2, top + .4, 2.7, top + 2.6, 2.2, top + 8.5], .7, pal[P.carryC]); }
      if (P.carry === 'tote') {           // on the shoulder, resting on the hip behind the arm
        var tg = walking ? Math.sin(2 * Math.PI * cA) * .05 : 0;
        A.save(); A.translate(.6, top + .4); A.rotate(tg);
        A.globalAlpha = 1; stroke(A, [0, 0, -3.4, 12.6], .7, pal[P.carryC]); stroke(A, [0, 0, 1.6, 12.6], .7, pal[P.carryC]);
        A.fillStyle = pal[P.carryC]; A.beginPath(); A.roundRect(-4.6, 12.2, 7.4, 8.6, [.4, .4, 1, 1]); A.fill();
        blob(A, sh, .16, function () { A.rect(-4.6, 18.6, 7.4, 2.2); });
        A.restore();
      }
      // head: skin, hair over the back and top (faceless), then the hat
      blob(A, skin, 1, function () { A.arc(hc[0], hc[1], 3.7, 0, Math.PI * 2); });
      A.save(); A.beginPath(); A.moveTo(hc[0] + 3.4, hc[1] - 6); A.lineTo(hc[0] + 1.9, hc[1] - 2.2); A.lineTo(hc[0] - .3, hc[1] + .4); A.lineTo(hc[0] - 1, hc[1] + 6); A.lineTo(hc[0] - 8, hc[1] + 6); A.lineTo(hc[0] - 8, hc[1] - 6); A.closePath(); A.clip();
      A.fillStyle = hair; A.beginPath(); A.arc(hc[0] - .15, hc[1] - .25, 3.95, 0, Math.PI * 2); A.fill();       // hair over the top and back; the face stays bare
      A.beginPath(); A.roundRect(hc[0] - 4, hc[1], 3.6, P.longHair ? top - hc[1] + 3.5 : 2.9, [0, 0, 1.2, 1.6]); A.fill(); A.restore();   // the nape (or longer hair, over the collar)
      var headClip = function () { A.beginPath(); A.arc(hc[0], hc[1], 3.7, 0, Math.PI * 2); A.moveTo(hc[0] + 3.8, hc[1] - .25); A.arc(hc[0] - .15, hc[1] - .25, 3.95, 0, Math.PI * 2); };
      if (P.hat) {
        var by = hc[1] - 1.7, hat = pal[P.hat];
        A.save(); headClip(); A.clip(); blob(A, sh, .2, function () { A.rect(-6, by + .5, 12, 1.5); }); A.restore();   // the brim's shadow on the head
        A.fillStyle = hat; A.beginPath(); A.moveTo(-3.8, by + .6); A.lineTo(-2.9, by - 4.1);
        A.quadraticCurveTo(-2.6, by - 5.2, -1.4, by - 5.2); A.lineTo(2.2, by - 5.2); A.quadraticCurveTo(3.4, by - 5.2, 3.6, by - 4.1);
        A.lineTo(4.6, by + .6); A.closePath(); A.fill();
        if (fine) blob(A, sh, .14, function () { A.rect(-4, by - .9, 9, 1); });                                // the band
        var brim = function () { A.beginPath(); A.moveTo(-6.5, by + 1.2); A.quadraticCurveTo(-4, by - .45, .45, by - .45); A.quadraticCurveTo(4.8, by - .45, 7.1, by + 1.3);
          A.lineTo(6.9, by + 2.05); A.quadraticCurveTo(4.5, by + 1, .45, by + 1); A.quadraticCurveTo(-3.9, by + 1, -6.3, by + 1.95); A.closePath(); };
        A.fillStyle = hat; brim(); A.fill();
        A.save(); brim(); A.clip(); blob(A, sh, .26, function () { A.rect(-8, by + .55, 16, 2); }); A.restore();     // its underside
      } else if (P.cap) {
        var cy = hc[1] - .6;
        A.fillStyle = pal[P.cap]; A.beginPath(); A.arc(hc[0] - .4, cy, 4, Math.PI * 1.02, Math.PI * 1.98); A.closePath(); A.fill();
        A.beginPath(); A.roundRect(2.4, cy - .9, 4.4, 1.15, [.2, .6, .6, .2]); A.fill();
        A.save(); headClip(); A.clip(); blob(A, sh, .3, function () { A.rect(0, cy + .2, 6, 1.6); }); A.restore();
      } else if (P.ballcap) {             // a baseball cap: a rounded crown, a short brim curving forward, a button on top
        var bc = pal[P.ballcap], ux = hc[0], uy = hc[1];
        A.save(); headClip(); A.clip(); blob(A, sh, .3, function () { A.rect(ux, uy - .6, 6, 1.8); }); A.restore();   // the brim's shadow on the face
        var crown = function () { A.beginPath(); A.moveTo(ux - 4.25, uy - .1); A.bezierCurveTo(ux - 4.5, uy - 5.6, ux + 4.2, uy - 6.1, ux + 4.05, uy - 1);
          A.quadraticCurveTo(ux + 1, uy - 1.2, ux - 4.25, uy - .1); A.closePath(); };
        A.fillStyle = bc; crown(); A.fill();
        A.save(); crown(); A.clip(); blob(A, sh, .16, function () { A.rect(ux - 6, uy - 1.6, 12, 2); });
        A.globalAlpha = .22; stroke(A, [ux - .1, uy - 4.8, ux + 1.6, uy - 3.6, ux + 2.6, uy - 1.2], .4, sh); A.globalAlpha = 1; A.restore();   // a panel seam
        var brim2 = function () { A.beginPath(); A.moveTo(ux + 2.8, uy - 1.5); A.quadraticCurveTo(ux + 6.1, uy - 1.7, ux + 7.5, uy - .5);
          A.lineTo(ux + 7.3, uy + .2); A.quadraticCurveTo(ux + 5.6, uy - .5, ux + 2.8, uy - .4); A.closePath(); };
        A.fillStyle = bc; brim2(); A.fill();
        A.save(); brim2(); A.clip(); blob(A, sh, .3, function () { A.rect(ux + 2, uy - .9, 7, 1.4); }); A.restore();   // its underside
        blob(A, bc, 1, function () { A.arc(ux - .2, uy - 4.75, .42, 0, Math.PI * 2); });                           // the button
      } else if (P.campcap) {             // a five-panel camp cap: a low, flat-topped crown, a contrasting front panel, a flat brim
        var cc = pal[P.campcap], cf = pal[P.capFront || P.campcap], cb = pal[P.capBrim || P.capFront || P.campcap], qx = hc[0], qy = hc[1];
        A.save(); headClip(); A.clip(); blob(A, sh, .3, function () { A.rect(qx, qy - .6, 6, 1.8); }); A.restore();   // the brim's shadow on the face
        var crownC = function () { A.beginPath(); A.moveTo(qx - 4.3, qy - .2); A.bezierCurveTo(qx - 4.6, qy - 4.6, qx - 3.2, qy - 5.3, qx - .2, qy - 5.3);
          A.bezierCurveTo(qx + 2.6, qy - 5.3, qx + 4.1, qy - 4.4, qx + 4.1, qy - 1.1); A.quadraticCurveTo(qx + 1, qy - 1.3, qx - 4.3, qy - .2); A.closePath(); };
        A.fillStyle = cc; crownC(); A.fill();
        A.save(); crownC(); A.clip();
        A.fillStyle = cf; A.beginPath(); A.moveTo(qx - .9, qy - 6); A.quadraticCurveTo(qx + .5, qy - 3.4, qx + .6, qy); A.lineTo(qx + 6, qy); A.lineTo(qx + 6, qy - 6); A.closePath(); A.fill();   // the front panel
        blob(A, sh, .16, function () { A.rect(qx - 6, qy - 1.6, 12, 2); });
        A.globalAlpha = .22; stroke(A, [qx - 2.2, qy - 5.1, qx - 2.5, qy - 1], .35, sh); A.globalAlpha = 1;   // a side seam
        if (fine) blob(A, figMix(cf, '#ffffff', .55), .9, function () { A.rect(qx + 2.3, qy - 3, 1.5, .55); });   // the small woven label
        A.restore();
        var brimC = function () { A.beginPath(); A.moveTo(qx + 3, qy - 1.45); A.lineTo(qx + 7.7, qy - 1.15); A.quadraticCurveTo(qx + 8, qy - .8, qx + 7.6, qy - .55);
          A.lineTo(qx + 3, qy - .55); A.closePath(); };
        A.fillStyle = cb; brimC(); A.fill();
        A.save(); brimC(); A.clip(); blob(A, sh, .3, function () { A.rect(qx + 2, qy - .95, 7, 1.4); }); A.restore();   // its underside
      }
      // near arm (and the bag it carries); a soft shade behind it keeps it off the coat
      A.globalAlpha = .2; A.save(); A.translate(-.45, .35); stroke(A, near, 3.1, sh); A.restore(); A.globalAlpha = 1;
      stroke(A, near, 2.6, coat);
      if (fine) { A.globalAlpha = .12; stroke(A, [near[0] - .7, near[1] + 1.5, near[2] - .8, near[3]], 1, sh); A.globalAlpha = 1; }
      if (holds) {
        var bx = near[4] + .2, byy = near[5] + .9, swing = walking ? -(near[2] - near[0]) * .045 + Math.sin(2 * Math.PI * cA) * .03 : 0;
        A.save(); A.translate(bx, byy); A.rotate(swing);
        A.globalAlpha = 1; stroke(A, [-.2, -.3, -2.4, 2.6], .6, pal[P.bag]); stroke(A, [.2, -.3, 2.2, 2.6], .6, pal[P.bag]);
        A.fillStyle = pal[P.bag]; A.beginPath(); A.roundRect(-3.7, 2.4, 7.4, 8.6, [.6, .6, 1, 1]); A.fill();
        blob(A, sh, .2, function () { A.rect(-3.7, 2.4, 1.5, 8.6); });                                       // its side, in shade
        blob(A, sh, .14, function () { A.rect(-3.7, 9.6, 7.4, 1.4); });
        if (P.bagMark) { A.fillStyle = pal[P.bagMark]; A.fillRect(-1.6, 5.6, 3.8, 1.05); }
        A.restore();
      }
      if (P.hood && fine) { A.globalAlpha = .22; stroke(A, [near[2] + (near[4] - near[2]) * .8, near[3] + (near[5] - near[3]) * .8, near[4] - (near[4] - near[2]) * .02, near[5] - (near[5] - near[3]) * .02], 2.65, sh); A.globalAlpha = 1; }   // the ribbed cuff
      blob(A, skin, 1, function () { A.arc(near[4] + .05, near[5] + .45, 1.08, 0, Math.PI * 2); });
      A.restore();
    } else {
      // ---- front view: stepping toward us ----
      var la = walking ? fa.lift : 0, lb = walking ? fb.lift : 0;
      hipY = -L + .45 * Math.max(la, lb) * (walking ? 1 : 0) - (walking ? .3 : 0);
      var topF = hipY - 21;
      [[-1.85, la], [1.85, lb]].forEach(function (g, gi) {
        var fy = -g[1] * 1.3, lw = skirt ? 2 : 2.9;
        stroke(A, [g[0] * .9, hipY, g[0], fy - 1.4], lw, legs);
        A.globalAlpha = .14; stroke(A, [g[0] * .9 - (gi ? 1 : -1) * .7, hipY, g[0] - (gi ? 1 : -1) * .7, fy - 1.4], .9, sh); A.globalAlpha = 1;   // the inner edge in shade
        if (fine && !skirt) blob(A, sh, .26, function () { A.rect(g[0] - 1.45, fy - 2.1, 2.9, .5); });
        if (P.sock) blob(A, pal[P.sock], 1, function () { A.rect(g[0] - 1.3, fy - 2.05, 2.6, .9); });
        if (P.shoe) {
          A.fillStyle = pal[P.shoe]; A.beginPath(); A.ellipse(g[0] * 1.06, fy - .85, 1.9 + g[1] * .18, 1.15 + g[1] * .12, 0, 0, Math.PI * 2); A.fill();
          blob(A, sh, .16, function () { A.ellipse(g[0] * 1.06 - (gi ? -.5 : .5), fy - .85, 1.4, 1.15, 0, 0, Math.PI * 2); });
          if (P.sole) blob(A, pal[P.sole], 1, function () { A.rect(g[0] * 1.06 - 1.9, fy - .45, 3.8, .45); });
          if (P.shoeMark && fine) blob(A, pal[P.shoeMark], .85, function () { A.rect(g[0] * 1.06 + (gi ? .5 : -1.4), fy - 1.6, .9, .7); });
        } else {
        A.fillStyle = legs; A.beginPath(); A.ellipse(g[0] * 1.06, fy - .75, 1.75 + g[1] * .18, 1 + g[1] * .12, 0, 0, Math.PI * 2); A.fill();
        blob(A, sh, .45, function () { A.ellipse(g[0] * 1.06, fy - .75, 1.75 + g[1] * .18, 1 + g[1] * .12, 0, 0, Math.PI * 2); });
        }
      });
      var swf = walking ? Math.cos(2 * Math.PI * (cA - .07)) : 0;
      var armF = function (side, d) {          // sleeves lie along the coat's sides; the one swinging toward us reads a touch shorter and wider
        var len = 10.4 - Math.max(0, d) * .9, sx = side * 4.6, ex = side * (5.5 + Math.max(0, d) * .25), wd = 2.5 + Math.max(0, d) * .25;
        stroke(A, [sx, topF + 1.9, ex, topF + 1.9 + len], wd, coat);
        A.globalAlpha = .16; stroke(A, [sx - side * wd * .42, topF + 3.2, ex - side * wd * .42, topF + 1.9 + len], .55, sh); A.globalAlpha = 1;   // where sleeve meets body
        return [ex + side * .05, topF + 2.5 + len];
      };
      blob(A, skin, 1, function () { A.rect(-1.15, topF - 3.2, 2.3, 4); });
      var hoodF = !!P.hood, hemF = skirt ? hipY - 1.5 : hoodF ? hipY - 5.2 : hipY + 2.2 + long, flF = hoodF ? -.3 : (skirt ? .2 : .6) + long * .07;
      if (skirt) { A.fillStyle = pal[P.skirtC || P.legs]; A.beginPath(); A.moveTo(-4.6, hipY - 3); A.lineTo(4.6, hipY - 3); A.lineTo(6.2, hipY + 6.4); A.lineTo(-6.2, hipY + 6.4); A.closePath(); A.fill(); }
      var coatF = function () {
        A.beginPath(); A.moveTo(-5.4, topF + 2.6); A.quadraticCurveTo(-5.2, topF - .7, -2.4, topF - .8); A.lineTo(2.4, topF - .8);
        A.quadraticCurveTo(5.2, topF - .7, 5.4, topF + 2.6); A.quadraticCurveTo(5.6, (topF + hemF) / 2, 6.1 + flF, hemF - .7);
        A.quadraticCurveTo(6.2 + flF, hemF, 5.4 + flF, hemF); A.lineTo(-5.4 - flF, hemF); A.quadraticCurveTo(-6.2 - flF, hemF, -6.1 - flF, hemF - .7);
        A.quadraticCurveTo(-5.6, (topF + hemF) / 2, -5.4, topF + 2.6); A.closePath();
      };
      if (hoodF) {                        // hip-length: the trousers show from the top of the thigh
        A.fillStyle = legs; A.beginPath(); A.roundRect(-4.8, hemF - 1.2, 9.6, hipY - hemF + 2.2, [0, 0, 1.6, 1.6]); A.fill();
        blob(A, sh, .3, function () { A.moveTo(-.5, hipY - 1.4); A.lineTo(.5, hipY - 1.4); A.lineTo(.4, hipY + 1); A.lineTo(-.4, hipY + 1); A.closePath(); });   // the crotch seam
      }
      A.fillStyle = coat; coatF(); A.fill();
      A.save(); coatF(); A.clip();
      if (hoodF) {
        blob(A, sh, .28, function () { A.rect(-9, hemF - 1.7, 18, 1.7); });                                  // the ribbed band
        blob(A, sh, .3, function () { A.rect(-9, hemF - 1.9, 18, .35); });
        if (fine) { A.globalAlpha = .24; stroke(A, [-3.6, hemF - 1.5, -2.7, hemF - 5.2, 2.7, hemF - 5.2, 3.6, hemF - 1.5], .45, sh); A.globalAlpha = 1; }   // the kangaroo pocket
      } else {
      blob(A, sh, .12, function () { A.rect(-9, hemF - 1.1, 18, 1.2); });
      blob(A, skin, 1, function () { A.moveTo(-1.5, topF - .9); A.lineTo(1.5, topF - .9); A.lineTo(0, topF + 2.2); A.closePath(); });
      }
      if (fine && !hoodF) {
        A.globalAlpha = .26; stroke(A, [-1.5, topF - .9, 0, topF + 2.3, 1.5, topF - .9], .5, sh); A.globalAlpha = 1;
        A.globalAlpha = .2; stroke(A, [.35, topF + 2.4, .5, hemF], .45, sh); A.globalAlpha = 1;
        blob(A, sh, .14, function () { A.moveTo(-4.2, hemF); A.lineTo(-3.3, hemF - 5 - long * .4); A.lineTo(-2.4, hemF); A.closePath(); });
        blob(A, sh, .14, function () { A.moveTo(2.6, hemF); A.lineTo(3.4, hemF - 4.2); A.lineTo(4.2, hemF); A.closePath(); });
      }
      A.restore();
      if (hoodF) {                         // the hood, down, seen from the front: a thick soft collar round the neck, its opening dark behind
        A.fillStyle = coat; A.beginPath(); A.ellipse(0, topF - 1.2, 5, 3.3, 0, 0, Math.PI * 2); A.fill();
        blob(A, sh, .34, function () { A.ellipse(0, topF - 1.9, 3.5, 2.2, 0, 0, Math.PI * 2); });                // the hood's opening, dark behind the neck
        blob(A, sh, .16, function () { A.ellipse(0, topF + 1.4, 4.8, 1, 0, 0, Math.PI); });
        blob(A, skin, 1, function () { A.rect(-1.15, topF - 3.2, 2.3, 2.6); });
        if (fine) { var dsc = P.string ? pal[P.string] : figMix(coat, '#ffffff', .45); stroke(A, [-.9, topF + .9, -1.1, topF + 4.6], .4, dsc); stroke(A, [.9, topF + .9, 1.1, topF + 4.4], .4, dsc); }   // drawstrings
      }
      if (P.carry === 'tote') { stroke(A, [-3.2, topF - .6, -6.2, hipY - 4], .7, pal[P.carryC]); A.fillStyle = pal[P.carryC]; A.beginPath(); A.roundRect(-8.8, hipY - 4.4, 4.6, 8, .6); A.fill(); }
      var lh = armF(-1, swf * .5), rh = armF(1, P.bag ? 0 : -swf * .5);
      if (hoodF && fine) [lh, rh].forEach(function (hd) { blob(A, sh, .24, function () { A.rect(hd[0] - 1.35, hd[1] - 2.2, 2.7, 1.3); }); });   // the ribbed cuffs
      if (P.carry === 'backpack') { A.globalAlpha = 1; stroke(A, [-3, topF - .6, -3.3, topF + 9], .95, pal[P.carryC]); stroke(A, [3, topF - .6, 3.3, topF + 9], .95, pal[P.carryC]); }
      if (P.bag) {
        A.save(); A.translate(rh[0] + .3, rh[1] + .5); A.rotate(walking ? Math.sin(2 * Math.PI * cA) * .04 : 0);
        stroke(A, [-.3, -.2, -1.8, 2.4], .6, pal[P.bag]); stroke(A, [.3, -.2, 1.8, 2.4], .6, pal[P.bag]);
        A.fillStyle = pal[P.bag]; A.beginPath(); A.roundRect(-2.6, 2.2, 5.6, 8.4, [.6, .6, 1, 1]); A.fill();       // seen end-on: narrower
        blob(A, sh, .16, function () { A.rect(-2.6, 9.2, 5.6, 1.4); });
        if (P.bagMark && fine) { A.fillStyle = pal[P.bagMark]; A.fillRect(-1.1, 5.4, 2.4, 1); }
        A.restore();
      }
      [lh, rh].forEach(function (hd) { blob(A, skin, 1, function () { A.arc(hd[0], hd[1], 1.08, 0, Math.PI * 2); }); });
      var hf = [0, topF - 5.2];
      blob(A, skin, 1, function () { A.ellipse(hf[0], hf[1], 3.5, 3.8, 0, 0, Math.PI * 2); });
      A.fillStyle = hair; A.beginPath(); A.ellipse(hf[0], hf[1] - .6, 3.85, 3.6, 0, Math.PI * .93, Math.PI * 2.07); A.closePath(); A.fill();
      A.save(); A.beginPath(); A.ellipse(hf[0], hf[1], 3.95, 4.1, 0, 0, Math.PI * 2); A.clip(); A.fillStyle = hair; A.beginPath(); A.rect(-5, hf[1] - 5, 1.9, 6.8); A.rect(3.1, hf[1] - 5, 1.9, 6.8); A.fill(); A.restore();   // hair over the ears frames a faceless face
      if (!P.hat && !P.cap && !P.ballcap && !P.campcap && fine) blob(A, sh, .12, function () { A.rect(-.3, hf[1] - 4, .6, 1.6); });           // a parting
      var faceClip = function () { A.beginPath(); A.ellipse(hf[0], hf[1], 3.5, 3.8, 0, 0, Math.PI * 2); };
      if (P.hat) {
        var byF = hf[1] - 1.6, hatF = pal[P.hat];
        A.save(); faceClip(); A.clip(); blob(A, sh, .36, function () { A.rect(-5, byF + .4, 10, 2.3); }); A.restore();
        A.fillStyle = hatF; A.beginPath(); A.moveTo(-4.1, byF + .5); A.lineTo(-3.3, byF - 4.2); A.quadraticCurveTo(-3, byF - 5.3, -1.8, byF - 5.3);
        A.lineTo(1.8, byF - 5.3); A.quadraticCurveTo(3, byF - 5.3, 3.3, byF - 4.2); A.lineTo(4.1, byF + .5); A.closePath(); A.fill();
        if (fine) blob(A, sh, .14, function () { A.rect(-4.2, byF - 1, 8.4, 1); });
        A.fillStyle = hatF; A.beginPath(); A.ellipse(0, byF + .7, 6.9, 1.55, 0, 0, Math.PI * 2); A.fill();
        A.save(); A.beginPath(); A.ellipse(0, byF + .7, 6.9, 1.55, 0, 0, Math.PI * 2); A.clip(); blob(A, sh, .24, function () { A.rect(-8, byF + .8, 16, 2); }); A.restore();
      } else if (P.cap) {
        A.fillStyle = pal[P.cap]; A.beginPath(); A.ellipse(0, hf[1] - 1.2, 4, 3.4, 0, Math.PI, Math.PI * 2); A.closePath(); A.fill();
        A.beginPath(); A.ellipse(0, hf[1] - 1, 3.6, 1, 0, 0, Math.PI * 2); A.fill();
        A.save(); faceClip(); A.clip(); blob(A, sh, .3, function () { A.rect(-5, hf[1] - .2, 10, 1.6); }); A.restore();
      } else if (P.ballcap) {             // a baseball cap from the front: a domed crown, the brim a shallow arc, a button on top
        var bcF = pal[P.ballcap], vy = hf[1];
        A.save(); faceClip(); A.clip(); blob(A, sh, .36, function () { A.rect(-5, vy - .8, 10, 2.2); }); A.restore();
        A.fillStyle = bcF; A.beginPath(); A.moveTo(-4.15, vy - .9); A.bezierCurveTo(-4.3, vy - 6.4, 4.3, vy - 6.4, 4.15, vy - .9); A.quadraticCurveTo(0, vy - 1.7, -4.15, vy - .9); A.closePath(); A.fill();
        A.globalAlpha = .2; stroke(A, [0, vy - 5, 0, vy - 1.4], .4, sh); A.globalAlpha = 1;                        // the front seam
        var brimF = function () { A.beginPath(); A.moveTo(-4.4, vy - 1.1); A.quadraticCurveTo(0, vy + 1.9, 4.4, vy - 1.1); A.quadraticCurveTo(0, vy + .1, -4.4, vy - 1.1); A.closePath(); };
        A.fillStyle = bcF; brimF(); A.fill();
        A.save(); brimF(); A.clip(); blob(A, sh, .28, function () { A.rect(-5, vy - .2, 10, 2.4); }); A.restore();
        blob(A, bcF, 1, function () { A.arc(0, vy - 4.85, .42, 0, Math.PI * 2); });
      } else if (P.campcap) {             // the camp cap from the front: a low crown, the front panel in its own colour, a flat brim
        var ccF = pal[P.campcap], cfF = pal[P.capFront || P.campcap], cbF = pal[P.capBrim || P.capFront || P.campcap], wy = hf[1];
        A.save(); faceClip(); A.clip(); blob(A, sh, .36, function () { A.rect(-5, wy - .8, 10, 2.2); }); A.restore();
        var crF = function () { A.beginPath(); A.moveTo(-4.2, wy - .9); A.bezierCurveTo(-4.4, wy - 5.6, 4.4, wy - 5.6, 4.2, wy - .9); A.quadraticCurveTo(0, wy - 1.6, -4.2, wy - .9); A.closePath(); };
        A.fillStyle = ccF; crF(); A.fill();
        A.save(); crF(); A.clip(); A.fillStyle = cfF; A.beginPath(); A.moveTo(-2.7, wy); A.quadraticCurveTo(-2.9, wy - 4, -1.6, wy - 5.2); A.lineTo(1.6, wy - 5.2); A.quadraticCurveTo(2.9, wy - 4, 2.7, wy); A.closePath(); A.fill();
        if (fine) blob(A, figMix(cfF, '#ffffff', .55), .9, function () { A.rect(-.9, wy - 3.2, 1.8, .55); });
        A.restore();
        var brF = function () { A.beginPath(); A.moveTo(-4.5, wy - 1.1); A.quadraticCurveTo(0, wy + 1.3, 4.5, wy - 1.1); A.quadraticCurveTo(0, wy - .2, -4.5, wy - 1.1); A.closePath(); };
        A.fillStyle = cbF; brF(); A.fill();
        A.save(); brF(); A.clip(); blob(A, sh, .28, function () { A.rect(-5, wy - .4, 10, 2.4); }); A.restore();
      }
    }

    // ---- paint passes, in device pixels over the whole sprite ----
    A.setTransform(1, 0, 0, 1, 0, 0);
    var lit = rim && rim.amt > .02 ? (rim.dx >= 0 ? 1 : -1) : -1, cx = ox + X - fx0;
    var dot = Math.max(.55 * k, 1.15);
    A.globalCompositeOperation = 'source-atop';
    // the shadow side, in two flat steps like the scene's posterised light
    A.fillStyle = sh;
    A.globalAlpha = .12; A.fillRect(lit > 0 ? 0 : cx + .4 * ks, 0, lit > 0 ? cx - .4 * ks : w, h);
    A.globalAlpha = .09; A.fillRect(lit > 0 ? 0 : cx + 2.9 * ks, 0, lit > 0 ? cx - 2.9 * ks : w, h);
    // grain: multiplied, so every colour gets dots of its own darker self (cream stays cream), as the scene's shade
    // grain does; a sparse veil all over, denser on the shadow side. Then trimmed back to the silhouette.
    var B = FIG.b.getContext('2d'), gc = /^#[0-9a-f]{6}$/i.test(sh) ? figMix('#ffffff', sh, .42) : '#9d958c';
    B.setTransform(1, 0, 0, 1, 0, 0); B.globalCompositeOperation = 'copy'; B.globalAlpha = 1; B.drawImage(FIG.a, 0, 0, w, h, 0, 0, w, h); B.globalCompositeOperation = 'source-over';
    A.globalCompositeOperation = 'multiply';
    A.fillStyle = figGrain(A, gc, dot, .09, 11); A.globalAlpha = .45; A.fillRect(0, 0, w, h);
    A.fillStyle = figGrain(A, gc, dot, .13, 23); A.globalAlpha = .5; A.fillRect(lit > 0 ? 0 : cx + .4 * ks, 0, lit > 0 ? cx - .4 * ks : w, h);
    A.globalCompositeOperation = 'destination-in'; A.globalAlpha = 1; A.drawImage(FIG.b, 0, 0, w, h, 0, 0, w, h);
    A.globalCompositeOperation = 'source-atop';
    // light: an edge band where the scene light meets the figure, with a stippled falloff inside it
    var lc = rim && rim.amt > .02 ? rim.c : pal.rim || '#fff2d8', la2 = rim && rim.amt > .02 ? rim.amt : .3;
    var bw = Math.max(1, .6 * ks);
    var edge = function (dx, dy, fill, a) {
      B.setTransform(1, 0, 0, 1, 0, 0); B.globalCompositeOperation = 'source-over'; B.globalAlpha = 1; B.clearRect(0, 0, w, h);
      B.drawImage(FIG.a, 0, 0, w, h, 0, 0, w, h);
      B.globalCompositeOperation = 'source-in'; B.fillStyle = fill; B.fillRect(0, 0, w, h);
      B.globalCompositeOperation = 'destination-out'; B.drawImage(FIG.a, 0, 0, w, h, dx, dy, w, h);
      A.globalAlpha = a; A.drawImage(FIG.b, 0, 0, w, h, 0, 0, w, h);
    };
    if (rim && rim.amt > .02) {
      edge(-lit * bw * 2.4, bw * 1.1, figGrain(A, lc, dot, .26, 37), la2 * .45);        // the spill, stippled
      edge(-lit * bw, bw * .5, lc, Math.min(1, la2 * 1.1));                          // the edge itself
      var back = rim.back || 0;
      if (back > .05) edge(lit * bw, bw * .5, lc, la2 * .6 * back);                  // lit from behind: both edges catch it
    } else {
      edge(0, bw * 1.6, figGrain(A, lc, dot, .35, 41), la2 * .8);                   // soft sky light across the tops, stippled
    }
    A.globalCompositeOperation = 'source-over'; A.globalAlpha = 1;
    // composite once
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha;
    ctx.drawImage(FIG.a, 0, 0, w, h, fx0 - ox, fy0 - oy, w, h);
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

  // the stamp's window onto a scene: the subject (the building and Raufan's standing spot) centred, at the stamp's aspect.
  // A scene may set `stamp: { x0, y0, x1, y1 }` (scene units) to frame its subject; by default the box is centred on
  // where the figure stands, from just under the top edge down to his feet. The window covers the box at aspect `ar`,
  // narrows if it would reach past the torn vignette edge, so the corners stay on paper.
  LS.stampRect = function (S, ar) {
    S = S || LS.newest();
    var W = S.size[0], H = S.size[1], sg = S.signature || {}, em = sg.emerge || {};
    var fx = (sg.still && sg.still.x) || em.x || W / 2, feet = em.foot1 || H * .88;
    var b = Object.assign({ x0: fx - 130, x1: fx + 130, y0: 30, y1: feet + 8 }, S.stamp);
    var safe = { x0: W * .11, x1: W * .89, y0: H * .093, y1: H * .913 };          // inside the vignette's rounded corners
    var cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    var w = Math.max(b.x1 - b.x0, (b.y1 - b.y0) * ar), h = w / ar;
    // keep the subject's middle in the stamp's middle across (narrowing if the box sits off the scene's centre);
    // up and down it may slide, so the feet stay in
    var fit = Math.min(1, 2 * (cx - safe.x0) / w, 2 * (safe.x1 - cx) / w, (safe.y1 - safe.y0) / h); w *= fit; h *= fit;
    var x = cx - w / 2, y = Math.min(Math.max(cy - h / 2, safe.y0), safe.y1 - h);
    return { x: x, y: y, w: w, h: h };
  };
  // a crop of a photo at aspect `ar` around a focal point (fractions; default a touch above centre for upright frames,
  // where the faces usually are)
  LS.focusCrop = function (iw, ih, ar, focus) {
    var f = focus || [.5, ih > iw ? .4 : .5];
    var sw = Math.min(iw, ih * ar), sh = sw / ar;
    return { x: Math.min(Math.max(iw * f[0] - sw / 2, 0), iw - sw), y: Math.min(Math.max(ih * f[1] - sh / 2, 0), ih - sh), w: sw, h: sh };
  };

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
          f.save(); f.setTransform(k, 0, 0, k, 0, 0); a.draw(f, t, pal, vkey); f.restore();
        });
      }
      function rimFor(g) {
        if (!lt) return null;
        var d = g.x - lt.x, amt = clamp(1 - Math.abs(d) / lt.r, 0, 1) * (g.inside ? .6 : 1);
        return { c: pal[lt.c], amt: amt * (lt.amt || 1), dx: d > 0 ? -lt.off : lt.off, back: clamp(1 - Math.abs(d) / 36, 0, 1) };
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

  // Optional company on a place: [{ name, url }]. Nothing in the data uses it yet.
  // ?withdemo=1 is Brian, ?withdemo=2 is Brian and Aya. Local only, not stored.
  function escHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  LS.demoCompany = function () {
    var q = '';
    try { q = new URLSearchParams(location.search).get('withdemo'); } catch (e) { return null; }
    if (q === '1') return [{ name: 'Brian', url: 'https://x.com/brian' }];
    if (q === '2') return [{ name: 'Brian', url: 'https://x.com/brian' }, { name: 'Aya', url: 'https://x.com/aya' }];
    return null;
  };
  LS.companyOf = function (S) {
    var id = S && (S.id || S.scene);
    var list = (S && S.with && S.with.length) ? S.with : null;
    if (!list && window.TL2 && TL2.companyFor) {
      var from = TL2.companyFor(id);
      if (from && from.length) list = from;
    }
    if (!list && id === 'niko-and-shibuya') list = LS.demoCompany();
    return list || [];
  };
  function companyBits(list, lang, linkClass, standalone) {
    if (!list || !list.length) return null;
    function plain(p) { return String(p.name); }
    function linked(p) {
      var name = escHtml(p.name);
      if (!p.url) return name;
      return '<a class="' + linkClass + '" href="' + escHtml(p.url) + '" target="_blank" rel="noopener">' + name + '</a>';
    }
    function phrase(names, ja) {
      if (ja) return (standalone ? '' : '、') + names.join('と') + 'と一緒に';
      var head = standalone ? 'With ' : ' with ';
      if (names.length === 1) return head + names[0];
      if (names.length === 2) return head + names[0] + ' and ' + names[1];
      return head + names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
    }
    var ja = lang === 'ja';
    return { text: phrase(list.map(plain), ja), html: '<span class="ls-with">' + phrase(list.map(linked), ja) + '</span>' };
  }
  LS.withHTML = function (list, lang, linkClass, standalone) { var b = companyBits(list, lang, linkClass || 'ls-with-a', standalone); return b ? b.html : ''; };
  LS.withText = function (list, lang, standalone) { var b = companyBits(list, lang, 'ls-with-a', standalone); return b ? b.text : ''; };

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
      var holder = null;
      if (tpl && pre && post) {
        var parts = tpl.replace('{place}', place).split('{who}');
        pre.textContent = parts[0]; post.textContent = parts[1] || '';
        holder = post;
      } else {
        var c = S.caption[lang] || S.caption.en;
        holder = el.querySelector('.ls-where');
        holder.textContent = c.replace('{place}', place);
      }
      var withHtml = LS.withHTML(LS.companyOf(S), lang);
      if (withHtml && holder) holder.insertAdjacentHTML('beforeend', withHtml);
      var tm = el.querySelector('time'); tm.textContent = ago; tm.dateTime = S.seenAt;
      el.dispatchEvent(new CustomEvent('lastseen:caption', { detail: { lang: lang } }));
    }
    render();
    // re-render on the minute boundary so "Nh ago" ticks over on time
    (function loop() { setTimeout(function () { render(); loop(); }, 60000 - Date.now() % 60000 + 50); })();
    window.addEventListener('langchange', render);
  };
})();
