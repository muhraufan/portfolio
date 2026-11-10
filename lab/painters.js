/* Painted postcard drafts (local only): three ways to paint a scene SHAPE BY SHAPE.
   The engine hands each static layer's shapes to a painter (LastSeen.painters[style].layer) instead of its
   stipple pass. Because every wall, window, sign and tree is painted inside its own outline, silhouettes stay
   exactly where the drawing put them; only what happens inside a shape changes. People, crows and everything
   that moves are still drawn by the engine, on top, untouched.
   Each painter also records "stamps" (where it put paint, in order) so the page can replay the picture being made. */
(function () {
  'use strict';
  var LS = window.LastSeen, KIT = LS._kit, P = LS.painters;

  // ---------- helpers ----------
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function hash(ix, iy, s) { var h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(s, 974711)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function vn(x, y, s) { var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; }
  var probe = canvas(1, 1).getContext('2d'), seen = {};
  function parse(v) {                         // any palette colour -> [r, g, b, a]
    if (v == null) return [0, 0, 0, 0];
    if (seen[v]) return seen[v];
    var o;
    if (v[0] === '#' && v.length === 7) o = [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16), 1];
    else { probe.fillStyle = '#000'; probe.fillStyle = v; var s = probe.fillStyle;
      if (s[0] === '#') o = [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 1];
      else { var m = s.match(/[\d.]+/g) || [0, 0, 0, 0]; o = [+m[0], +m[1], +m[2], m[3] == null ? 1 : +m[3]]; } }
    return (seen[v] = o);
  }
  function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function css(c, a) { return 'rgba(' + (clamp(c[0], 0, 255) | 0) + ',' + (clamp(c[1], 0, 255) | 0) + ',' + (clamp(c[2], 0, 255) | 0) + ',' + (a == null ? 1 : a) + ')'; }
  function gray(v) { v = clamp(v, 0, 255) | 0; return 'rgb(' + v + ',' + v + ',' + v + ')'; }

  // a shape's outline and box, for the fillable kinds (rect, circle, ellipse, poly, blob)
  function geom(p) {
    if (p.t === 'blob') {
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      p.clumps.forEach(function (cl) { x0 = Math.min(x0, cl[0] - cl[2]); y0 = Math.min(y0, cl[1] - cl[3]); x1 = Math.max(x1, cl[0] + cl[2]); y1 = Math.max(y1, cl[1] + cl[3]); });
      return { box: [x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)], round: true,
        path: function (c) { c.beginPath(); p.clumps.forEach(function (cl) { c.moveTo(cl[0] + Math.max(.1, cl[2]), cl[1]); c.ellipse(cl[0], cl[1], Math.max(.1, cl[2]), Math.max(.1, cl[3]), cl[4] || 0, 0, Math.PI * 2); }); } };
    }
    if (p.t === 'rect' || p.t === 'circle' || p.t === 'ellipse' || p.t === 'poly')
      return { box: KIT.bounds(p), round: p.t === 'circle' || p.t === 'ellipse', path: function (c) { KIT.shapePath(c, p); } };
    return null;
  }
  // the engine shades with stippled dots whose density follows a direction. These give the same modelling as a tone.
  function fall(dir, u, v) {
    switch (dir) { case 'down': return v; case 'up': return 1 - v; case 'left': return 1 - u; case 'right': return u; case 'br': return (u + v) / 2;
      case 'center': return 1 - Math.min(1, Math.hypot(u - .5, v - .5) * 2); default: return 1; }
  }
  function tone(sh) { return (1 - Math.exp(-.73 * (sh.d || .3))) * (sh.a == null ? .62 : sh.a); }   // how much a full-density stipple tints
  function shadeAt(col, shades, pal, u, v, gain) {
    for (var i = 0; i < shades.length; i++) { var sh = shades[i], f = clamp(fall(sh.dir, u, v), 0, 1);
      col = mixc(col, parse(pal[sh.c]), clamp(tone(sh) * Math.pow(f, sh.p || 1.6) * gain, 0, .88)); }
    return col;
  }
  function shadeWash(x, b, sh, pal, gain) {     // the same tone as one smooth gradient (inside the current clip)
    var c = parse(pal[sh.c]), a = clamp(tone(sh) * gain, 0, .88), pw = sh.p || 1.6, X = b[0], Y = b[1], W = b[2], H = b[3], g, i, t;
    if (!sh.dir || sh.dir === 'flat') { x.fillStyle = css(c, a); x.fillRect(X, Y, W, H); return; }
    if (sh.dir === 'center') { g = x.createRadialGradient(X + W / 2, Y + H / 2, 0, X + W / 2, Y + H / 2, Math.max(W, H) / 2);
      for (i = 0; i <= 4; i++) { t = i / 4; g.addColorStop(t, css(c, a * Math.pow(1 - t, pw))); } }
    else { var L = { down: [X, Y, X, Y + H], up: [X, Y + H, X, Y], left: [X + W, Y, X, Y], right: [X, Y, X + W, Y], br: [X, Y, X + W, Y + H] }[sh.dir];
      g = x.createLinearGradient(L[0], L[1], L[2], L[3]); for (i = 0; i <= 5; i++) { t = i / 5; g.addColorStop(t, css(c, a * Math.pow(t, pw))); } }
    x.fillStyle = g; x.fillRect(X, Y, W, H);
  }
  function softGlow(x, p, pal) {                // a pool of light, as one soft bloom instead of scattered dots
    var c = parse(pal[p.fill]), a = Math.min(.6, (p.d || .5) * .45);
    x.save(); x.translate(p.x, p.y); x.scale(p.sx || 1, p.sy || 1);
    var g = x.createRadialGradient(0, 0, 0, 0, 0, p.r); g.addColorStop(0, css(c, a)); g.addColorStop(.5, css(c, a * .4)); g.addColorStop(1, css(c, 0));
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, p.r, 0, Math.PI * 2); x.fill(); x.restore();
  }
  function boxStamp(S, b, k) { S.push([(b[0] + b[2] / 2) * k, (b[1] + b[3] / 2) * k, 0, b[2] * k + 6, b[3] * k + 6]); }
  function lineBox(p) { var xs = [], ys = [], i; if (p.pts) { for (i = 0; i < p.pts.length; i += 2) { xs.push(p.pts[i]); ys.push(p.pts[i + 1]); } }
    else if (p.t === 'text') { var w = (p.text || '').length * p.size * .62, ax = p.align === 'center' ? -w / 2 : p.align === 'right' ? -w : 0; xs = [p.x + ax, p.x + ax + w]; ys = [p.y - p.size, p.y + p.size * .3]; }
    else { var rx = p.rx || p.r || 4, ry = p.ry || p.r || 4; xs = [p.x - rx, p.x + rx]; ys = [p.y - ry, p.y + ry]; }
    var x0 = Math.min.apply(0, xs), y0 = Math.min.apply(0, ys); return [x0 - 1, y0 - 1, Math.max.apply(0, xs) - x0 + 2, Math.max.apply(0, ys) - y0 + 2]; }
  function stash(I, layers, style, ground) {
    var rec = { style: style, k: I.k, cw: I.cw, ch: I.ch, vkey: I.vkey, ground: ground, layers: {}, stamps: {} };
    ['back', 'facade', 'front'].forEach(function (n) { if (layers[n]) { rec.layers[n] = layers[n]; rec.stamps[n] = layers[n]._stamps || []; } });
    I.root._painted = rec;
  }

  // =====================================================================================================
  // 1. PALETTE KNIFE. Big planes are laid in thick slabs, clipped to the shape's own outline. Small things
  //    (window bars, signs, lettering) are one clean touch each. A second canvas holds how thick the paint is;
  //    light raked across it gives every slab, and every shape's edge, a real ridge.
  // =====================================================================================================
  P.knife = {
    layer: function (x, prims, pal, rand, dot, I) {
      if (I.name === 'over') { KIT.drawPrims(x, prims, pal, rand, dot); return; }   // the night glows stay as light
      var k = I.k, hc = canvas(I.cw, I.ch), h = hc.getContext('2d'), stamps = [];
      h.setTransform(k, 0, 0, k, 0, 0);
      I.canvas._h = hc; I.canvas._stamps = stamps;
      function dab(px, py, a, len, wid, c0, c1) {
        var hl = len / 2, hw = wid / 2;
        var Q = [-hl + rand() * hw * .5, -hw, hl - rand() * hw * .7, -hw + rand() * hw * .3, hl - rand() * hw * .15, (rand() - .5) * hw * .8,
          hl - rand() * hw * .9, hw, -hl + rand() * hw * .7, hw - rand() * hw * .25, -hl - rand() * hw * .2, (rand() - .5) * hw];
        function trace(c) { c.beginPath(); c.moveTo(Q[0], Q[1]); for (var q = 2; q < 12; q += 2) c.lineTo(Q[q], Q[q + 1]); c.closePath(); }
        x.save(); x.translate(px, py); x.rotate(a);
        var g = x.createLinearGradient(-hl, 0, hl, 0); g.addColorStop(0, css(c0)); g.addColorStop(1, css(c1));
        trace(x); x.fillStyle = g; x.fill(); x.restore();
        // thickness: thin where the blade lands, piled where it lifts, tilted across its width, scored by its drag
        h.save(); h.translate(px, py); h.rotate(a); trace(h);
        var base = 95 + rand() * 75, tilt = (rand() - .5) * 64, hg = h.createLinearGradient(-hl, -hw, hl, hw);
        hg.addColorStop(0, gray(base - tilt)); hg.addColorStop(.8, gray(base + tilt)); hg.addColorStop(1, gray(base + tilt + 50));
        h.fillStyle = hg; h.fill(); h.clip();
        for (var s = 0, n = 2 + (rand() * 3 | 0); s < n; s++) { var yy = (rand() * 2 - 1) * hw; h.globalAlpha = .3 + rand() * .4; h.strokeStyle = gray(base + (rand() - .5) * 84);
          h.lineWidth = Math.max(.12, wid * (.04 + rand() * .1)); h.beginPath(); h.moveTo(-hl, yy); h.lineTo(hl, yy + (rand() - .5) * hw * .3); h.stroke(); }
        h.restore();
        stamps.push([px * k, py * k, a, len * k * 1.12, wid * k * 1.25]);
      }
      function paint(p, pi, clipTo) {
        var al = p.a == null ? 1 : p.a, G = geom(p);
        if (!G) return false;
        var b = G.box, s = Math.min(b[2], b[3]), area = b[2] * b[3], col = p.fill ? parse(pal[p.fill]) : null, shades = p.shade ? [].concat(p.shade) : [];
        var plane = col && al >= .95 && col[3] >= .95 && s >= 7 && area >= 130;
        x.save(); h.save();
        if (clipTo) { clipTo(x); x.clip(); clipTo(h); h.clip(); }
        if (col) { x.globalAlpha = al; G.path(x); x.fillStyle = css(col, col[3]); x.fill(); x.globalAlpha = 1; }
        if (!plane) {
          // a small thing: one clean touch, its modelling kept as a soft tone, sitting slightly proud of the surface
          if (shades.length) { x.save(); G.path(x); x.clip(); shades.forEach(function (sh) { shadeWash(x, b, sh, pal, 1.5); }); x.restore(); }
          if (col && al >= .95 && col[3] >= .95) { G.path(h); h.fillStyle = gray(118 + rand() * 56); h.fill(); }
          boxStamp(stamps, b, k);
        } else {
          G.path(h); h.fillStyle = gray(100 + rand() * 44); h.fill();          // the shape's own bed of paint: its edge becomes a ridge
          x.save(); G.path(x); x.clip(); h.save(); G.path(h); h.clip();
          var L = clamp(s * .95, 7, 42), Wd = L * .42, base;
          if (G.round) base = null; else if (b[2] > b[3] * 1.5) base = 0; else if (b[3] > b[2] * 1.5) base = Math.PI / 2; else base = (hash(pi, 3, I.S.seed) < .5 ? -1 : 1) * Math.PI / 5;
          var sx = base === 0 ? L * .5 : base === Math.PI / 2 ? Wd * .72 : (L * .5 + Wd * .72) / 2, sy = base === 0 ? Wd * .72 : base === Math.PI / 2 ? L * .5 : sx;
          var count = (b[2] / sx) * (b[3] / sy); if (count > 1500) { var sc = Math.sqrt(count / 1500); sx *= sc; sy *= sc; }
          var pts = [], yy, xx;
          for (yy = b[1] + sy * .3; yy < b[1] + b[3] + sy * .3; yy += sy) for (xx = b[0] + sx * .3; xx < b[0] + b[2] + sx * .3; xx += sx) pts.push([xx + (rand() - .5) * sx * .9, yy + (rand() - .5) * sy * .9]);
          for (var q = pts.length - 1; q > 0; q--) { var o = rand() * (q + 1) | 0, t = pts[q]; pts[q] = pts[o]; pts[o] = t; }
          pts.forEach(function (pt) {
            var a = base == null ? vn(pt[0] / 14, pt[1] / 14, I.S.seed + pi) * Math.PI * 2 : base + (rand() - .5) * .26;
            var len = L * (.7 + rand() * .6), wid = Wd * (.8 + rand() * .4), ca = Math.cos(a) * len * .32, sa = Math.sin(a) * len * .32;
            var j = 1 + (rand() - .5) * .1, w = (rand() - .5) * 9;
            function at(px, py) { var c = shadeAt(col, shades, pal, clamp((px - b[0]) / b[2], 0, 1), clamp((py - b[1]) / b[3], 0, 1), 1.7); return [c[0] * j + w, c[1] * j, c[2] * j - w]; }
            dab(pt[0], pt[1], a, len, wid, at(pt[0] - ca, pt[1] - sa), at(pt[0] + ca, pt[1] + sa));
          });
          x.restore(); h.restore();
        }
        (p.inner || []).forEach(function (inn, ii) { paint(Object.assign({ t: 'blob' }, inn), pi * 31 + ii + 1, G.path); });
        x.restore(); h.restore();
        return true;
      }
      prims.forEach(function (p, pi) {
        if (p.t === 'glow') { softGlow(x, p, pal); return; }
        if (paint(p, pi)) return;
        KIT.drawPrims(x, [p], pal, rand, dot);                                  // lettering, lines, rings, halos: drawn clean
        if ((p.t === 'line' || p.t === 'ring') && (p.a == null || p.a >= .9)) {  // a line is a bead of paint
          h.beginPath(); if (p.t === 'ring') h.ellipse(p.x, p.y, p.r, p.ry || p.r, p.rot || 0, 0, Math.PI * 2);
          else for (var li = 0; li < p.pts.length; li += 2) li ? h.lineTo(p.pts[li], p.pts[li + 1]) : h.moveTo(p.pts[li], p.pts[li + 1]);
          h.strokeStyle = gray(176); h.lineWidth = p.lw || 1; h.lineCap = 'round'; h.lineJoin = 'round'; h.stroke();
        }
        boxStamp(stamps, lineBox(p), k);
      });
    },
    done: function (layers, I) {
      ['back', 'facade', 'front'].forEach(function (n) {
        var c = layers[n]; if (!c || !c._h) return;
        var w = c.width, hgt = c.height, x = c.getContext('2d'), o = x.getImageData(0, 0, w, hgt), d = o.data, hd = c._h.getContext('2d').getImageData(0, 0, w, hgt).data;
        var H = new Float32Array(w * hgt), i, p, y, px, K = 3.1 * Math.min(1.6, I.k / 2.6);
        for (i = 0, p = 0; i < H.length; i++, p += 4) H[i] = hd[p] / 255;
        for (y = 1; y < hgt - 1; y++) for (px = 1; px < w - 1; px++) {
          i = y * w + px; p = i * 4; if (!d[p + 3]) continue;
          var lit = ((H[i + 1] - H[i - 1]) * .6 + (H[i + w] - H[i - w]) * .8) * K;       // slopes facing the upper left catch the light
          var l = .299 * d[p] + .587 * d[p + 1] + .114 * d[p + 2], sh = clamp(1 + lit, .72, 1.2), spec = clamp((lit - .17) * 1.5, 0, .42) * clamp(l / 150, .12, 1);   // dark paint glints less
          for (var c2 = 0; c2 < 3; c2++) { var v = (l + (d[p + c2] - l) * 1.14) * sh; d[p + c2] = v + (255 - v) * spec; }
        }
        x.putImageData(o, 0, 0);
        c._h = null;
      });
      stash(I, layers, 'knife', I.vkey === 'night' ? '#2b2824' : '#c9bfae');
    }
  };

  // =====================================================================================================
  // 2. CUT PAPER. Every shape is a piece of coloured paper with a small shadow under it, so the scene reads as
  //    a collage built up in layers. Shading becomes a soft airbrushed tone. Nothing is textured except the paper.
  // =====================================================================================================
  var fibre = null;
  function fibreTile() {
    if (fibre) return fibre;
    var c = canvas(256, 256), x = c.getContext('2d'), o = x.createImageData(256, 256), d = o.data;
    for (var y = 0, p = 0; y < 256; y++) for (var px = 0; px < 256; px++, p += 4) {
      var n = vn(px / 1.3, y / 1.3, 5) * .55 + vn(px / 5, y / 26, 9) * .45, v = n > .5 ? 255 : 0;
      d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = Math.abs(n - .5) * 2 * 22;
    }
    x.putImageData(o, 0, 0); return (fibre = c);
  }
  P.paper = {
    layer: function (x, prims, pal, rand, dot, I) {
      if (I.name === 'over') { KIT.drawPrims(x, prims, pal, rand, dot); return; }
      var k = I.k, night = I.vkey === 'night', stamps = []; I.canvas._stamps = stamps;
      function paint(p, pi, clipTo) {
        var al = p.a == null ? 1 : p.a, G = geom(p); if (!G) return false;
        var b = G.box, s = Math.min(b[2], b[3]), area = b[2] * b[3], col = p.fill ? parse(pal[p.fill]) : null, shades = p.shade ? [].concat(p.shade) : [];
        var piece = col && al >= .95 && col[3] >= .95 && s >= 2.4 && area >= 22 && !(b[2] >= 398 && b[3] >= 100);   // not hairlines, not the sky
        x.save(); if (clipTo) { clipTo(x); x.clip(); }
        if (col) {
          var j = 1 + (hash(pi, 7, I.S.seed) - .5) * .05;
          if (piece && !clipTo) { var big = clamp(Math.sqrt(area) / 26, .35, 1); x.shadowColor = night ? 'rgba(0,0,0,.62)' : 'rgba(40,30,20,.44)'; x.shadowBlur = (.8 + 1.9 * big) * k; x.shadowOffsetY = (.45 + .95 * big) * k; }
          x.globalAlpha = al; G.path(x); x.fillStyle = css([col[0] * j, col[1] * j, col[2] * j], col[3]); x.fill();
          x.globalAlpha = 1; x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0;
        }
        if (shades.length) { x.save(); G.path(x); x.clip(); shades.forEach(function (sh) { shadeWash(x, b, sh, pal, 1.25); }); x.restore(); }
        (p.inner || []).forEach(function (inn, ii) { paint(Object.assign({ t: 'blob' }, inn), pi * 31 + ii + 1, G.path); });
        x.restore(); boxStamp(stamps, b, k);
        return true;
      }
      prims.forEach(function (p, pi) {
        if (p.t === 'glow') { softGlow(x, p, pal); return; }
        if (paint(p, pi)) return;
        KIT.drawPrims(x, [p], pal, rand, dot); boxStamp(stamps, lineBox(p), k);
      });
    },
    done: function (layers, I) {
      var k = I.k, night = I.vkey === 'night';
      ['back', 'facade', 'front'].forEach(function (n) {
        var c = layers[n]; if (!c) return;
        var x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0);
        x.globalCompositeOperation = 'source-atop'; x.globalAlpha = night ? .5 : .8; x.fillStyle = x.createPattern(fibreTile(), 'repeat'); x.fillRect(0, 0, c.width, c.height);
        x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
        if (n === 'back') return;
        // the whole layer is a sheet lifted off the one behind it
        var nc = canvas(c.width, c.height), nx = nc.getContext('2d');
        nx.shadowColor = night ? 'rgba(0,0,0,.6)' : 'rgba(40,30,20,.34)'; nx.shadowBlur = 3.2 * k; nx.shadowOffsetY = 1.5 * k; nx.drawImage(c, 0, 0);
        nc._stamps = c._stamps; layers[n] = nc;
      });
      stash(I, layers, 'paper', night ? '#191b22' : '#efe9dc');
    }
  };

  // The pop-up book uses the cut-paper pieces as its sheets. Real shadows come from the 3D light, so nothing is baked in.
  // The sky is painted onto its own canvas, so it can stand as a backdrop with the clouds and skyline in front of it.
  /* Relief for the pop-up book. A drawing is painted far to near, so whatever was drawn on top of something else stands on a
     sheet in front of it: wall, what hangs on the wall, what sits in front of that. Rooms seen through a window (palette keys
     named in...) go on a sheet BEHIND the wall, and the wall gets a real opening cut where they were. */
  function groundY(S) {
    var W = S.size[0], H = S.size[1], top = null;
    (S.layers.back || []).forEach(function (p) { if (p.t === 'rect' && p.w >= W * .9 && p.y + p.h >= H - 2 && p.y > H * .5 && (top == null || p.y < top)) top = p.y; });
    return top == null ? window.LastSeen.groundOf(S).y0 - 4 : top;
  }
  function relief(prims, pal, rand, dot, I, isBack) {
    var yg = groundY(I.S), n = prims.length, bx = [], solid = [], inner = [], lev = [], big = [], tier = [], used = [0, 0, 0, 0], nIn = 0, i, j;
    var toy = [], toys = { sway: { list: [], tier: 0 }, sign: { list: [], tier: 0 } };   // things that get to move on their own: washing on a line, a shop's big lettering
    for (i = 0; i < n; i++) {
      var p = prims[i], G = geom(p), b = G ? G.box : lineBox(p), a = [b[0], b[1], Math.max(1, b[2]), Math.max(1, b[3])]; bx[i] = a;
      inner[i] = isBack && typeof p.fill === 'string' && /^in[A-Z]/.test(p.fill);
      var ground = isBack && a[1] >= yg - 1;
      toy[i] = inner[i] || ground ? null : (typeof p.fill === 'string' && /^wash\d/.test(p.fill)) ? 'sway' : (p.t === 'text' && p.size >= 18) ? 'sign' : null;
      solid[i] = !inner[i] && !ground && !toy[i] && !!p.fill && (p.a == null || p.a >= .9) && p.t !== 'glow' && p.t !== 'halo';
      var L = 0, rootBig = isBack ? (a[2] >= 150 && a[3] >= 36) : true, isSolid = solid[i];
      if (!inner[i] && !ground) for (j = 0; j < i; j++) {          // drawn over a room: it stands in the opening, in front of the wall
        if (!inner[j]) continue;
        var d = bx[j], iw = Math.min(a[0] + a[2], d[0] + d[2]) - Math.max(a[0], d[0]), ih = Math.min(a[1] + a[3], d[1] + d[3]) - Math.max(a[1], d[1]);
        if (iw > 0 && ih > 0 && iw * ih >= .5 * a[2] * a[3]) { L = 1; rootBig = true; break; }
      }
      if (!inner[i] && !ground) for (j = 0; j < i; j++) {
        if (!solid[j]) continue;
        var c = bx[j], ow = Math.min(a[0] + a[2], c[0] + c[2]) - Math.max(a[0], c[0]), oh = Math.min(a[1] + a[3], c[1] + c[3]) - Math.max(a[1], c[1]);
        if (ow <= 0 || oh <= 0 || ow * oh < .5 * (isSolid ? Math.min(a[2] * a[3], c[2] * c[3]) : a[2] * a[3])) continue;   // a wash or a shadow belongs to what it mostly covers
        var l2 = lev[j] + (solid[i] ? 1 : 0); if (l2 >= L) { L = l2; rootBig = big[j]; }
      }
      lev[i] = L; big[i] = rootBig; tier[i] = inner[i] ? -1 : rootBig ? Math.min(3, L) : 0;
      if (toy[i]) { var ty = toys[toy[i]]; ty.list.push(p); ty.tier = Math.max(ty.tier, Math.min(3, L + 1)); tier[i] = -2; }
    }
    function sheet() { var c = canvas(I.cw, I.ch); c.getContext('2d').setTransform(I.k, 0, 0, I.k, 0, 0); return c; }
    var cv = [sheet(), sheet(), sheet(), sheet()], inC = sheet(), pend = [[], [], [], []], pendIn = [];
    function flush() { pend.forEach(function (list, t) { if (list.length) { P.paper.layer(cv[t].getContext('2d'), list, pal, rand, dot, Object.assign({}, I, { canvas: cv[t] })); used[t] += list.length; } pend[t] = []; }); }
    for (i = 0; i < n; i++) {
      if (tier[i] < 0) {
        var Gi = geom(prims[i]); pendIn.push(prims[i]); nIn++;
        if (Gi && prims[i].fill && (prims[i].a == null || prims[i].a >= .9)) { flush(); cv.forEach(function (c) { var q = c.getContext('2d'); q.save(); q.globalCompositeOperation = 'destination-out'; Gi.path(q); q.fillStyle = '#000'; q.fill(); q.restore(); }); }
      } else if (tier[i] >= 0) pend[tier[i]].push(prims[i]);
    }
    flush();
    if (nIn) P.paper.layer(inC.getContext('2d'), pendIn, pal, rand, dot, Object.assign({}, I, { canvas: inC }));
    var out = { tiers: cv.map(function (c, t) { return used[t] ? c : null; }), inner: nIn ? inC : null, toys: {} };
    Object.keys(toys).forEach(function (name) { var ty = toys[name]; if (!ty.list.length) return;
      var c = sheet(); P.paper.layer(c.getContext('2d'), ty.list, pal, rand, dot, Object.assign({}, I, { canvas: c })); out.toys[name] = { canvas: c, tier: ty.tier }; });
    return out;
  }
  P.popup = {
    layer: function (x, prims, pal, rand, dot, I) {
      if (I.name === 'facade') { P.paper.layer(x, prims, pal, rand, dot, I); I.canvas._relief = relief(prims, pal, rand, dot, I, false); return; }
      if (I.name !== 'back') { P.paper.layer(x, prims, pal, rand, dot, I); return; }
      var W = I.S.size[0], sky = [], rest = [];
      prims.forEach(function (p, i) {
        var first = [].concat(p.shade || [])[0];
        var isSky = p.t === 'rect' && p.w >= W * .9 && p.y <= 1 && ((p.h >= 60 && (p.fill === 'sky' || i === 0)) || (!p.fill && first && /^sky/.test(first.c || '')));
        if (!isSky && p.t === 'rect' && !p.fill && first && /^sky/.test(first.c || '') && p.w >= W * .9) isSky = true;
        (isSky ? sky : rest).push(p);
      });
      P.paper.layer(x, rest, pal, rand, dot, I);
      I.canvas._relief = relief(rest, pal, rand, dot, I, true);
      if (sky.length) {
        var sc = canvas(I.cw, I.ch), sx = sc.getContext('2d'); sx.setTransform(I.k, 0, 0, I.k, 0, 0);
        P.paper.layer(sx, sky, pal, rand, dot, Object.assign({}, I, { name: 'sky', canvas: sc }));
        I.canvas._sky = sc;
      }
    },
    done: function (layers, I) {
      var night = I.vkey === 'night', sky = layers.back && layers.back._sky;
      var rf = (layers.facade && layers.facade._relief) || null, rb = (layers.back && layers.back._relief) || null;
      [layers.back, layers.facade, layers.front, sky].concat(rf ? rf.tiers : [], rb ? rb.tiers : [], rb ? [rb.inner] : [], rb ? Object.keys(rb.toys).map(function (n) { return rb.toys[n].canvas; }) : []).forEach(function (c) {
        if (!c) return;
        var x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0);
        x.globalCompositeOperation = 'source-atop'; x.globalAlpha = night ? .5 : .8; x.fillStyle = x.createPattern(fibreTile(), 'repeat'); x.fillRect(0, 0, c.width, c.height);
        x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
      });
      I.root._painted = { style: 'popup', k: I.k, cw: I.cw, ch: I.ch, vkey: I.vkey, pal: I.pal, layers: { sky: sky || null, back: layers.back, facade: layers.facade, tiers: rf && rf.tiers, backTiers: rb && rb.tiers, inner: rb && rb.inner, toys: (rb && rb.toys) || {}, front: layers.front, over: layers.over } };
    }
  };

  // =====================================================================================================
  // 3. POSTER PRINT. Flat inks, a hard-edged second tone where the drawing was shaded, halftone dots on the
  //    broad areas (sky, long walls), and a coloured keyline around each shape. City-pop record sleeve.
  // =====================================================================================================
  P.poster = {
    layer: function (x, prims, pal, rand, dot, I) {
      if (I.name === 'over') { KIT.drawPrims(x, prims, pal, rand, dot); return; }
      var k = I.k, night = I.vkey === 'night', stamps = []; I.canvas._stamps = stamps;
      function band(b, sh) {                    // the half of the shape that was in shade, as one flat region
        var pw = sh.p || 1.6, t = Math.pow(.42, 1 / pw), X = b[0], Y = b[1], W = b[2], H = b[3];
        x.beginPath();
        switch (sh.dir) {
          case 'down': x.rect(X, Y + t * H, W, H); break;
          case 'up': x.rect(X, Y - H, W, H + (1 - t) * H); break;
          case 'left': x.rect(X - W, Y, W + (1 - t) * W, H); break;
          case 'right': x.rect(X + t * W, Y, W, H); break;
          case 'br': var q = 2 * t - 1; x.moveTo(X + W + 2, Y + q * H); x.lineTo(X + W + 2, Y + H + 2); x.lineTo(X + q * W, Y + H + 2); x.closePath(); break;
          case 'center': x.ellipse(X + W / 2, Y + H / 2, (1 - t) * W / 2 + .5, (1 - t) * H / 2 + .5, 0, 0, Math.PI * 2); break;
          default: x.rect(X, Y, W, H);
        }
      }
      function dots(b, sh) {                    // halftone: the dot grows where the drawing was denser
        var c = css(parse(pal[sh.c]), .9), st = 2.5, pw = sh.p || 1.6, amt = clamp(tone(sh) * 2.3, 0, 1), row = 0;
        x.fillStyle = c; x.beginPath();
        for (var yy = b[1]; yy < b[1] + b[3] + st; yy += st * .866, row++) for (var xx = b[0] + (row % 2 ? st / 2 : 0); xx < b[0] + b[2] + st; xx += st) {
          var f = Math.pow(clamp(fall(sh.dir, (xx - b[0]) / b[2], (yy - b[1]) / b[3]), 0, 1), pw) * amt, r = st * .62 * Math.sqrt(f);
          if (r < .16) continue; x.moveTo(xx + r, yy); x.arc(xx, yy, r, 0, Math.PI * 2);
        }
        x.fill();
      }
      function paint(p, pi, clipTo) {
        var al = p.a == null ? 1 : p.a, G = geom(p); if (!G) return false;
        var b = G.box, s = Math.min(b[2], b[3]), area = b[2] * b[3], col = p.fill ? parse(pal[p.fill]) : null, shades = p.shade ? [].concat(p.shade) : [];
        x.save(); if (clipTo) { clipTo(x); x.clip(); }
        if (col) { x.globalAlpha = al; G.path(x); x.fillStyle = css(col, col[3]); x.fill(); x.globalAlpha = 1; }
        if (shades.length) {
          x.save(); G.path(x); x.clip();
          shades.forEach(function (sh) {
            if (area >= 1500 && s >= 14) { dots(b, sh); return; }
            if (!sh.dir || sh.dir === 'flat') { x.fillStyle = css(parse(pal[sh.c]), clamp(tone(sh) * 1.1, 0, .6)); x.fillRect(b[0], b[1], b[2], b[3]); return; }
            band(b, sh); x.fillStyle = css(parse(pal[sh.c]), clamp(tone(sh) * 2.1, .14, .78)); x.fill();
          });
          x.restore();
        }
        if (col && al >= .95 && col[3] >= .95 && s >= 2.2 && area >= 26 && !(b[2] >= 398 && b[3] >= 100) && !clipTo) {
          var ink = night ? mixc(col, [236, 226, 204], .16) : mixc(col, [22, 26, 38], .68);
          G.path(x); x.strokeStyle = css(ink, I.name === 'back' ? .5 : .9); x.lineWidth = clamp(.3 + Math.sqrt(area) / 80, .36, .85); x.lineJoin = 'round'; x.stroke();
        }
        (p.inner || []).forEach(function (inn, ii) { paint(Object.assign({ t: 'blob' }, inn), pi * 31 + ii + 1, G.path); });
        x.restore(); boxStamp(stamps, b, k);
        return true;
      }
      prims.forEach(function (p, pi) {
        if (p.t === 'glow') { softGlow(x, p, pal); return; }
        if (paint(p, pi)) return;
        KIT.drawPrims(x, [p], pal, rand, dot); boxStamp(stamps, lineBox(p), k);
      });
    },
    done: function (layers, I) { stash(I, layers, 'poster', I.vkey === 'night' ? '#14161d' : '#f2ecdf'); }
  };
})();
