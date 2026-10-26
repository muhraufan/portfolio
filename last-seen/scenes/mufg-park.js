/* Scene — mufg-park. Needs /timeline/lib/last-seen.js and /timeline/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, contact = K.contact, sheen = K.sheen, sitter = K.sitter, leaves = K.leaves;
  // a tree mass as one opaque silhouette with a lit crown and a dark underside (as in Yoyogi Park)
  function canopy(L, cx, cy, rx, ry, seed, v) {
    var R = rnd(seed), i, a, d, body = [], crown = [], under = [];
    for (i = 0; i < 30; i++) { a = R() * Math.PI * 2; d = Math.pow(R(), .5) * .7; body.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, rx * (.17 + R() * .15), ry * (.17 + R() * .15), R() * 3]); }
    for (i = 0; i < 9; i++) { a = -Math.PI * (.5 + R() * .45); d = .3 + R() * .55; crown.push([cx - rx * .12 + Math.cos(a) * rx * d, cy - ry * .1 + Math.sin(a) * ry * d, rx * (.15 + R() * .12), ry * (.13 + R() * .1), R() * 3]); }
    for (i = 0; i < 10; i++) { a = Math.PI * (.05 + R() * .9); d = .45 + R() * .45; under.push([cx + rx * .1 + Math.cos(a) * rx * d, cy + ry * .18 + Math.sin(a) * ry * d * .8, rx * (.16 + R() * .12), ry * (.12 + R() * .1), R() * 3]); }
    L.push({ t: 'blob', clumps: body, fill: v[0], shade: grain(v[2], .14, 'down', 1.7), inner: [{ clumps: under, fill: v[2], shade: grain('treeDeep', .25, 'down', 1.5) }, { clumps: crown, fill: v[1], shade: grain(v[0], .14, 'br', 1.6) }] });
  }
  // a red pine: a tall leaning trunk with flaking orange bark, a few bare limbs, flat pads of needles at the top
  function pine(L, x, foot, top, lean, seed) {
    var R = rnd(seed), tx = x + lean;
    L.push(poly([x - 2.6, foot, x + 2.6, foot, tx + 1.4, top, tx - 1.4, top], 'pineBark', { shade: grain('pineBarkShade', .45, 'right', 1.2) }));
    L.push(line([x - 1.4, foot - 4, tx - .8, top + 6], 'pineBarkLite', .6, { a: .6 }));
    for (var b = 0; b < 3; b++) { var by = top + 8 + b * 14 + R() * 6, bx = x + lean * (foot - by) / (foot - top) * -1 + lean, d = R() > .5 ? 1 : -1;
      L.push(line([bx, by, bx + d * (10 + R() * 8), by - 6 - R() * 6], 'pineBark', 1.1)); }
    [[0, 0, 18, 6], [-12, 10, 13, 5], [12, 8, 14, 5], [-4, 20, 16, 5], [14, 24, 10, 4], [-14, 28, 9, 4]].forEach(function (p, i) {
      var px = tx + p[0] + (R() - .5) * 4, py = top + p[1];
      L.push({ t: 'blob', clumps: [[px, py, p[2], p[3]], [px - p[2] * .5, py + 1, p[2] * .6, p[3] * .8], [px + p[2] * .5, py + .6, p[2] * .55, p[3] * .8]], fill: 'pine', shade: grain('pineShade', .3, 'down', 1.4),
        inner: [{ clumps: [[px - p[2] * .2, py - p[3] * .5, p[2] * .7, p[3] * .45]], fill: 'pineLite' }] });
      L.push(line([px - p[2] * .6, py + p[3] * .6, px + p[2] * .2, py + p[3] * .9], 'pineBark', .5, { a: .5 })); });
  }
  /* ================= MUFG PARK — Yanagisawa, Nishitokyo (Oct 11, 11:00) =================
     the library in the park: a broad, thin shed roof that tapers to a knife edge, its warm timber
     underside running deep over a glass room with the lit "forest bookshelf", a timber terrace
     (engawa) with people sitting on its edge, a gravel trench along it, the lawn, a curved path coming
     out of the building, a big zelkova on the left, tall red pines on the right, summer clouds */
  make('mufg-park', { seed: 903, seenAt: '2026-10-11T11:00:00+09:00',
    place: { en: 'MUFG PARK', ja: 'MUFG PARK' }, name: { en: 'MUFG PARK', ja: 'MUFG PARK' }, area: { en: 'Yanagisawa, Nishitokyo', ja: '西東京・柳沢' },
    alt: 'Illustration of the MUFG PARK library: a broad, thin cantilevered roof with a warm timber underside over a glass room lined with lit bookshelves, a wooden terrace, a lawn and a curved path, a big tree on the left and tall pines on the right.',
    palette: { sky: '#d6e3ec', skyShade: '#bccfdd', cloud: '#f6f7f6', cloudShade: '#d9e0e6', cloudLite: '#ffffff', sunWash: '#ffc58e',
      roofEdge: '#3b3936', roofTop: '#5a5751', soffit: '#c8925a', soffitShade: '#a06c3a', soffitLite: '#e0ae73', soffitLine: '#9c6a3b',
      glass: '#2d3236', glassShade: '#1e2226', mullion: '#2a2b2c', wallStone: '#6e6c67', wallStoneShade: '#55534f', wallStoneLine: '#8a8781',
      inShelf: '#b88a58', inShelfShade: '#8d6438', inBook1: '#c9b48e', inBook2: '#a2553f', inBook3: '#566b7f', inBook4: '#e2d7c0', inBook5: '#6f7d58', inBook6: '#d29a52', inLamp: '#ffe2ad', inFloor: '#b98a5a', inCeil: '#d7a56a', inTable: '#9a6b3e', inChair: '#3b3b3b',
      deck: '#b07c4b', deckShade: '#8a5d33', deckLite: '#d39d68', deckEdge: '#5e4128', trench: '#9e9b95', trenchShade: '#7f7c76', trenchDot: '#c9c6c0',
      lawn: '#8faa63', lawnShade: '#78924f', lawnLite: '#a7bf78', lawnFar: '#9fb576', lawnDry: '#b6b77a',
      path: '#d8d0c0', pathShade: '#bfb5a2', pathEdge: '#a9a397', pathDot: '#c4bcab',
      tree: '#5f7f4a', tree2: '#759556', tree3: '#93ad6c', treeShade: '#456336', treeDeep: '#33492a', treeFar: '#8ea47a', treeFar2: '#a5b78f', trunk: '#4e4237',
      pine: '#3f5a3a', pineLite: '#5e7a50', pineShade: '#2b4129', pineBark: '#9a5f3c', pineBarkShade: '#6e3f25', pineBarkLite: '#c58a5c',
      lampGlass: '#f1ece0', sign: '#3a3936', signInk: '#f1ede4', bench: '#a77c52', benchShade: '#7c5935', fence: '#8a8b86' },
    light: { noShadows: true,
      morning: { set: { sky: '#d3e1ec', cloud: '#f8f9fa' }, add: { back: [{ t: 'halo', x: 50, y: 186, rx: 70, ry: 16, n: 6, fill: 'cloudLite', a: .08 }, { t: 'halo', x: 372, y: 188, rx: 50, ry: 14, n: 6, fill: 'cloudLite', a: .08 }], front: [poly([36, 238, 60, 236, 200, 262, 150, 268], 'shadow', { a: .1 }), poly([316, 236, 322, 236, 400, 250, 400, 258], 'shadow', { a: .1 }), poly([380, 244, 388, 244, 400, 248, 400, 252], 'shadow', { a: .1 })] } },
      midday: { add: { front: [e(40, 246, 30, 3, 'shadow', { a: .14 }), e(318, 238, 8, 1.6, 'shadow', { a: .14 }), e(352, 242, 8, 1.6, 'shadow', { a: .14 }), e(384, 246, 8, 1.6, 'shadow', { a: .14 })] } },
      golden: { add: { front: [poly([30, 240, 44, 240, 0, 262, 0, 254], 'shadow', { a: .1 }), poly([312, 236, 324, 236, 230, 262, 210, 262], 'shadow', { a: .1 }), poly([346, 240, 356, 240, 280, 262, 262, 262], 'shadow', { a: .08 })] }, set: { cloud: '#fbe3c9', cloudShade: '#e9bfa0', cloudLite: '#fff1de', sky: '#ecd2bd', skyShade: '#e0b89c', lawn: '#9fa95e', lawnLite: '#c2bf72', soffitLite: '#f2bd7c' } },
      night: { set: { sky: '#111730', skyShade: '#0a0f21', cloud: '#171d36', cloudShade: '#121730', cloudLite: '#1d2440', roofEdge: '#0b0b0d', roofTop: '#16161a', treeFar: '#1b2232', treeFar2: '#202839', lampGlass: '#ffe3ad',
          soffit: '#8a5a33', soffitShade: '#5a3a1f', soffitLite: '#c48a50', soffitLine: '#5e3d22', glass: '#3a2a1a', glassShade: '#2a1d12', mullion: '#120e0a',
          deck: '#4b3523', deckShade: '#35241a', deckLite: '#6d4e33', path: '#3a3934', pathShade: '#2c2b27', pathEdge: '#24231f', pineBark: '#3c2a20', pineBarkShade: '#2a1d16' },
        add: { over: [{ t: 'halo', x: 200, y: 170, rx: 170, ry: 50, n: 7, fill: 'inLamp', a: .05 }, { t: 'halo', x: 200, y: 214, rx: 170, ry: 18, n: 6, fill: 'pool', a: .05 }, { t: 'halo', x: 204, y: 236, rx: 34, ry: 26, n: 6, fill: 'pool', a: .045 }, { t: 'halo', x: 200, y: 126, rx: 170, ry: 18, n: 5, fill: 'haze', a: .04 },
          { t: 'halo', x: 72, y: 222, rx: 10, ry: 8, n: 4, fill: 'lamp', a: .06 }, { t: 'halo', x: 344, y: 230, rx: 10, ry: 8, n: 4, fill: 'lamp', a: .06 }] } } },
    breathe: { x: 92, y: 132, w: 238, h: 74 },
    shoppers: [{ keys: [[0, 150], [8, 182], [11, 182], [19, 150]], period: 19, foot: 204, s: .58, coat: 'coatC', legs: 'legsDark', hair: 'hairDark', alpha: .9, shadow: false },
               { keys: [[0, 268], [6, 268], [10, 244], [16, 244], [20, 268]], period: 20, offset: 7, foot: 204, s: .56, coat: 'coatA', legs: 'legsDenim', hair: 'hairBrown', alpha: .85, shadow: false }],
    passersby: [{ start: 5, every: 25, dir: 1, speed: 20, foot: 284, s: 1.22, coat: 'coatD', legs: 'legsDark', hair: 'hairDark', cap: 'coatB' },
                { start: 15, every: 29, dir: -1, speed: 23, foot: 276, s: 1.14, coat: 'coatA', long: 6, legs: 'legsDenim', hair: 'hairBrown', longHair: true, carry: 'tote', carryC: 'coatC' }],
    sig: { emerge: { x: 200, foot0: 212, foot1: 264, s0: .6, s1: 1.22, dur: 1.35 } },
    anim: [{ layer: 'back', draw: function (f, t, pal, v) {          // the clouds drift, very slowly
      if (v === 'night') return; f.fillStyle = pal.cloudLite; for (var i = 0; i < 3; i++) { var x = ((t * 1.2 + i * 150) % 520) - 60; f.globalAlpha = .18; f.beginPath(); f.ellipse(x, 30 + i * 16, 26, 4, 0, 0, Math.PI * 2); f.fill(); } } }],
    build: function (L, F, P) {
      L.push(r(0, 0, 400, 200, 'sky', { shade: grain('skyShade', .2, 'up', 1.6) }));
      // summer clouds piled up over the trees
      [[170, 52, [[0, 0, 40, 18], [-30, 8, 26, 14], [34, 6, 30, 15], [10, -14, 26, 16], [-12, -6, 20, 14]]], [320, 34, [[0, 0, 34, 14], [-24, 6, 20, 11], [26, 4, 24, 12], [6, -12, 20, 13]]], [60, 18, [[0, 0, 30, 10], [24, 2, 20, 8], [-20, 4, 16, 8]]]].forEach(function (cl) {
        var cs = cl[2].map(function (q) { return [cl[0] + q[0], cl[1] + q[1], q[2], q[3]]; });
        L.push({ t: 'blob', clumps: cs, fill: 'cloud', shade: grain('cloudShade', .35, 'down', 1.5), inner: [{ clumps: cs.map(function (q) { return [q[0] - q[2] * .15, q[1] - q[3] * .35, q[2] * .7, q[3] * .5]; }), fill: 'cloudLite' }] }); });
      // the far trees ringing the lawn
      [[96, 168, 30, 22], [140, 160, 26, 24], [178, 164, 22, 20], [214, 158, 28, 26], [252, 164, 24, 20], [286, 160, 26, 24]].forEach(function (q, i) { canopy(L, q[0], q[1], q[2], q[3], 60 + i, ['treeFar', 'treeFar2', 'tree3']); });
      // a low band of trees all along the far side of the lawn
      (function () { var R = rnd(91); for (var x = -10; x < 410; x += 14 + R() * 10) { var ry = 8 + R() * 10; L.push(e(x, 194 - ry * .4, 10 + R() * 8, ry, R() > .5 ? 'treeFar' : 'treeFar2', { shade: grain('tree3', .4, 'down', 1.4) })); } })();
      L.push(r(0, 196, 400, 48, 'lawnFar', { shade: grain('lawnShade', .3, 'down') }));
      // the big zelkova on the left, its trunk and limbs
      L.push(poly([30, 244, 44, 244, 42, 150, 34, 150], 'trunk', { shade: grain('treeDeep', .4, 'right') })); L.push(line([38, 160, 14, 110], 'trunk', 3)); L.push(line([40, 150, 64, 106], 'trunk', 2.6)); L.push(line([40, 170, 80, 140], 'trunk', 1.8));
      canopy(L, 30, 70, 70, 66, 11, ['tree', 'tree3', 'treeShade']); canopy(L, 84, 118, 42, 36, 12, ['tree2', 'tree3', 'treeShade']); canopy(L, 10, 150, 34, 40, 13, ['tree', 'tree2', 'treeShade']);
      // tall red pines on the right
      pine(L, 318, 236, 66, 6, 21); pine(L, 352, 240, 40, -4, 22); pine(L, 384, 244, 54, 8, 23); pine(L, 296, 222, 96, -3, 24);
      canopy(L, 370, 188, 40, 30, 14, ['tree', 'tree3', 'treeShade']); canopy(L, 330, 200, 26, 20, 15, ['tree2', 'tree3', 'treeShade']);
      // the library: glass all round, the lit forest bookshelf inside, a stone-clad wall at the left end
      L.push(r(92, 126, 238, 82, 'inCeil', { shade: grain('soffitShade', .3, 'up') }));
      L.push(r(92, 138, 238, 66, 'inShelf', { shade: grain('inShelfShade', .3, 'down') }));
      (function () { var R = rnd(31), cols = ['inBook1', 'inBook2', 'inBook3', 'inBook4', 'inBook5', 'inBook6'];
        for (var sy = 140; sy < 200; sy += 12) { L.push(r(92, sy + 10, 238, 1.6, 'inShelfShade'));
          for (var bx = 93; bx < 329; bx += 1.6 + R() * 1.4) { var h = 6 + R() * 3.4, w = 1 + R() * .9; if (R() > .9) { bx += 3; continue; } L.push(r(bx, sy + 10 - h, w, h, cols[Math.floor(R() * cols.length)], { a: .9 })); } }
        for (var vx = 92; vx < 330; vx += 34) L.push(r(vx, 138, 1.6, 66, 'inShelfShade')); })();
      L.push(r(92, 138, 238, 66, 'inLamp', { a: .1 }));
      L.push(r(92, 196, 238, 12, 'inFloor', { shade: grain('soffitShade', .3, 'down') }));
      [[130, 'inTable'], [250, 'inTable']].forEach(function (t) { L.push(r(t[0], 194, 30, 2, t[1])); L.push(r(t[0] + 2, 196, 1.4, 10, t[1])); L.push(r(t[0] + 26.6, 196, 1.4, 10, t[1]));
        L.push(r(t[0] - 6, 198, 5, 8, 'inChair', { r: 1 })); L.push(r(t[0] + 31, 198, 5, 8, 'inChair', { r: 1 })); L.push(c(t[0] + 15, 190, 2.4, 'inLamp')); });
      // the stone wall at the left end, laid in long courses
      L.push(r(92, 126, 34, 82, 'wallStone', { shade: grain('wallStoneShade', .4, 'right') })); for (var wy = 130; wy < 208; wy += 5) L.push(r(92, wy, 34, .7, 'wallStoneLine', { a: .6 }));
      L.push(r(124, 126, 2, 82, 'wallStoneShade'));
      // the terrace (engawa) along the glass, the gravel trench in front
      L.push(r(54, 206, 310, 8, 'deck', { shade: grain('deckShade', .35, 'down') })); for (var dx = 60; dx < 364; dx += 10) L.push(r(dx, 206, .5, 8, 'deckShade', { a: .6 }));
      L.push(r(54, 206, 310, .9, 'deckLite')); L.push(r(54, 214, 310, 4, 'deckEdge', { shade: grain('shadow', .3, 'down') })); L.push(r(54, 218, 310, 1.6, 'shadow', { a: .2 }));
      L.push(poly([40, 219, 378, 219, 392, 226, 30, 226], 'trench', { shade: grain('trenchShade', .45, 'flat') }));
      (function () { var R = rnd(41); for (var i = 0; i < 220; i++) L.push(c(36 + R() * 352, 220 + R() * 5.6, .3 + R() * .4, R() > .5 ? 'trenchDot' : 'trenchShade', { a: .8 })); })();
      // the lawn, mown in broad bands, and the curved path out of the building
      L.push(r(0, 224, 400, 76, 'lawn', { shade: [grain('lawnShade', .3, 'down'), grain('lawnLite', .12, 'up')] }));
      [[0, 232, 400, 10, 'lawnLite', .3], [0, 252, 400, 14, 'lawnShade', .25], [0, 278, 400, 16, 'lawnLite', .25]].forEach(function (b) { L.push(r(b[0], b[1], b[2], b[3], b[4], { a: b[5] })); });
      (function () { var R = rnd(51); for (var i = 0; i < 70; i++) L.push(e(R() * 400, 228 + R() * 72, 3 + R() * 6, .6 + R() * .6, R() > .6 ? 'lawnDry' : 'lawnShade', { a: .3 })); })();
      // the path: in through the glass, out across the terrace, bending away to the left
      var path = [182, 206, 222, 206, 230, 226, 240, 250, 236, 274, 210, 300, 104, 300, 150, 274, 172, 250, 178, 226];
      L.push(poly(path.map(function (v, i) { return i % 2 ? v : (v < 200 ? v - 3 : v + 3); }), 'pathEdge'));
      L.push(poly(path, 'path', { shade: grain('pathShade', .35, 'up', 1.4) }));
      (function () { var R = rnd(61); for (var i = 0; i < 140; i++) { var y = 208 + R() * 90, t = (y - 206) / 94, xl = 180 - t * 40 - t * t * 30, xr = 224 + t * 16 - t * t * 20; L.push(c(xl + R() * (xr - xl), y, .3 + R() * .4, 'pathDot', { a: .7 })); } })();
      L.push(r(182, 206, 40, 8, 'path')); L.push(r(182, 214, 40, 4, 'pathShade'));
      // a small sign by the path, a bench on the lawn, the low park lights
      L.push(r(256, 212, 1.4, 14, 'sign')); L.push(r(250, 206, 14, 8, 'sign', { r: .6 })); L.push({ t: 'text', text: 'LIBRARY', x: 257, y: 211.4, size: 2.6, weight: 600, font: FONT, fill: 'signInk', align: 'center', ls: .3 });
      [[72, 224], [344, 232]].forEach(function (p) { L.push(r(p[0] - 1, p[1] - 10, 2, 10, 'sign')); L.push(r(p[0] - 1.6, p[1] - 12, 3.2, 2.4, 'lampGlass')); contact(L, p[0], p[1], 3, .14); });
      // the roof: a thin dark edge, the warm timber underside running deep, slats converging back to the glass
      F.push(poly([14, 92, 392, 108, 330, 126, 92, 126], 'soffit', { shade: [grain('soffitShade', .45, 'down', 1.3), grain('soffitLite', .15, 'up', 1.6)] }));
      for (var i = 0; i <= 24; i++) { var u = i / 24; F.push(line([14 + (392 - 14) * u, 92 + 16 * u + 1.6, 92 + (330 - 92) * u, 126], 'soffitLine', .5, { a: .45 })); }
      F.push(poly([14, 92, 392, 108, 330, 126, 92, 126], 'soffitLite', { a: .12 }));
      F.push(poly([10, 89.4, 396, 105.6, 392, 108.6, 14, 92.6], 'roofEdge')); F.push(poly([10, 89.4, 396, 105.6, 395, 106.2, 11, 90], 'roofTop', { a: .8 }));
      F.push(poly([92, 126, 330, 126, 330, 128, 92, 128], 'shadow', { a: .25 }));
      // the glass front and its slim mullions, the doors where the path runs through
      F.push(r(126, 128, 204, 78, 'glass', { a: .28 }));
      for (var mx = 126; mx <= 330; mx += 17) F.push(r(mx, 128, 1.2, 78, 'mullion')); F.push(r(126, 128, 204, 1.6, 'mullion')); F.push(r(126, 204, 204, 2, 'mullion'));
      sheen(F, 127, 129, 120, 75, { a: .12, at: .1, street: false }); sheen(F, 250, 129, 78, 75, { a: .1, at: .4, street: false });
      F.push(poly([126, 128, 330, 128, 330, 140, 126, 150], 'soffit', { a: .16 }));   // the timber ceiling reflected in the top of the glass
      F.push(r(184, 150, 1.4, 56, 'mullion')); F.push(r(219, 150, 1.4, 56, 'mullion')); F.push(r(184, 150, 36, 1.4, 'mullion'));
      F.push(r(184.6, 151.4, 34.6, 54.6, 'inLamp', { a: .08 }));
      // a slender column under the roof at the right end
      F.push(r(318, 108, 2.2, 98, 'mullion'));
      // people on the terrace edge, legs over the gravel
      sitter(F, 92, 210, .96, { coat: 'coatB', legs: 'legsDark', hair: 'hairDark', dir: 1 }); sitter(F, 296, 210, .96, { coat: 'coatC', legs: 'legsDenim', hair: 'hairBrown', dir: -1, cup: true }); sitter(F, 306, 210, .92, { coat: 'coatA', legs: 'legsDark', hair: 'hairDark', dir: -1 });
      // a bench out on the lawn
      P.push(r(316, 260, 46, 4, 'bench', { shade: grain('benchShade', .4, 'down') })); P.push(r(316, 252, 46, 2.4, 'bench')); P.push(r(319, 264, 2.4, 10, 'benchShade')); P.push(r(357, 264, 2.4, 10, 'benchShade')); contact(P, 339, 274, 26, .16);
      leaves(P, 0, 400, 228, 298, 14, 71);
    } });
})();
