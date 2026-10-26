/* Scene — yoyogi-park. Needs /timeline/lib/last-seen.js and /timeline/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  // a tree canopy as one opaque silhouette (a union of clumps with an irregular edge) in the body value; inside it,
  // clipped, a solid lighter crown to the upper left (with a few small lit clumps lower down) and a solid darker
  // underside; the house grain gives the texture. No transparency anywhere.
  function canopy(L, cx, cy, rx, ry, seed, v, o) {
    o = o || {}; var R = K.rnd(seed), i, a, d, mid = v[0], lit = v[1], dark = v[2], body = [], crown = [], under = [];
    for (i = 0; i < 30; i++) { a = R() * Math.PI * 2; d = Math.pow(R(), .5) * .7;
      body.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, rx * (.17 + R() * .15), ry * (.17 + R() * .15), R() * 3]); }
    for (i = 0; i < 9; i++) { a = -Math.PI * (.5 + R() * .45); d = .3 + R() * .55;
      crown.push([cx - rx * .12 + Math.cos(a) * rx * d, cy - ry * .1 + Math.sin(a) * ry * d, rx * (.15 + R() * .12), ry * (.13 + R() * .1), R() * 3]); }
    for (i = 0; i < 4; i++) { a = R() * Math.PI * 2; d = .2 + R() * .3; crown.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d - ry * .1, 2.4 + R() * 3, 1.8 + R() * 2, R() * 3]); }
    for (i = 0; i < 10; i++) { a = Math.PI * (.05 + R() * .9); d = .45 + R() * .45;
      under.push([cx + rx * .1 + Math.cos(a) * rx * d, cy + ry * .18 + Math.sin(a) * ry * d * .8, rx * (.16 + R() * .12), ry * (.12 + R() * .1), R() * 3]); }
    L.push({ t: 'blob', clumps: body, fill: mid, shade: K.grain(dark, .14, 'down', 1.7),
      inner: [{ clumps: under, fill: dark, shade: K.grain('treeDeep', .25, 'down', 1.5) }, { clumps: crown, fill: lit, shade: K.grain(mid, .14, 'br', 1.6) }] });
    if (o.trunk) { var tx = o.trunk; L.push(K.line([tx, cy + ry * .62, tx - 5 - R() * 4, cy + ry * .32], 'trunk', .8)); L.push(K.line([tx + 1, cy + ry * .56, tx + 6 + R() * 4, cy + ry * .3], 'trunk', .7)); }
  }
  var make = K.make, pavement = K.pavement, bike = K.bike, crown = K.crown, branches = K.branches, contact = K.contact, vending = K.vending, sitter = K.sitter, leaves = K.leaves, plate = K.plate;
  /* ================= 4) Yoyogi Park — Shibuya (Oct 18, 11:30) =================
     a wide path running in, the long fountain pond, deep trees either side, the Shinjuku towers behind */
  make('yoyogi-park', { seed: 844, seenAt: '2026-10-18T11:30:00+09:00',
    place: { en: 'Yoyogi Park', ja: '代々木公園' }, name: { en: 'Yoyogi Park', ja: '代々木公園' }, area: { en: 'Shibuya, Tokyo', ja: '東京・渋谷' },
    alt: 'Illustration of Yoyogi Park: a wide path running into the park beside a long fountain pond, deep green trees on either side and the Shinjuku towers pale in the distance.',
    palette: { sky: '#e2e8e8', skyShade: '#cad4d6', tower: '#c9ced2', tower2: '#bcc3c9', towerShade: '#aab2b9', towerWin: '#b2bac1', towerBand: '#b2bac1',
      tree: '#6f8f5e', tree2: '#81a06d', tree3: '#94b07c', treeShade: '#4f6c42', treeDeep: '#3d5634', treeFar: '#a3b597', trunk: '#7b6c5c', lawn: '#a9bd8f', lawnShade: '#8fa579',
      path: '#e0d8c8', pathShade: '#c9bfac', pond: '#b7c9d0', pondShade: '#9db3bc', pondEdge: '#d9d4ca', rimLit: '#f4f1ea', pondReflect: '#7f9a86', pondSky: '#e3ebec', spray: '#ffffff', jet: '#ffffff', post: '#5b5d5e', lampGlass: '#f1ece0', bench: '#a98058', benchShade: '#7e5a39', board: '#5d6b58', boardFace: '#efe9dc', hole: '#e2e8e8', treeLight: '#a9c28c', sunWash: '#ffc58e' },
    light: { noShadows: true,
      golden: { set: { sky: '#f1d7c1', skyShade: '#e4b99b', tower: '#e2c6b2', tower2: '#d8bba6', jet: '#fff4e6', pond: '#a6afb8', pondShade: '#8c97a3', pondSky: '#efcfb6', pondReflect: '#6f7a5a', rimLit: '#fde9cf', pondEdge: '#dcc3a9', spray: '#fff1de',
        tree: '#6f8a55', tree2: '#829a60', tree3: '#a8b56f', treeShade: '#4c6338', treeDeep: '#3b4d2c', treeFar: '#a9ad84', hole: '#f1d7c1', treeLight: '#c8c37f' } },
      night: { set: { sky: '#11162a', skyShade: '#0a0e1c', tower: '#1b2033', tower2: '#181d2e', towerWin: '#e8bf7e', towerBand: '#242a40', pond: '#1b2438', pondShade: '#131a2a', pondSky: '#2e3a58', pondReflect: '#0f1520', rimLit: '#6a6458', spray: '#cfd6e6', jet: '#cfd6e6', path: '#2a2a2f', pathShade: '#1e1e23', post: '#0b0c10', lampGlass: '#ffe3ad', hole: '#11162a', pondEdge: '#4a4740' },
        add: { back: [[205, 80], [217, 98], [210, 120], [236, 92], [242, 108], [176, 108], [160, 122], [268, 100], [276, 116], [300, 126], [150, 130], [182, 128]].map(function (p) { return r(p[0], p[1], 2, 2, 'towerWin', { a: .9 }); }),
          facade: [],
          over: [{ t: 'halo', x: 121, y: 178, rx: 24, ry: 24, n: 6, fill: 'haze', a: .045 }, { t: 'halo', x: 279, y: 178, rx: 24, ry: 24, n: 6, fill: 'haze', a: .045 }, { t: 'halo', x: 166, y: 166, rx: 12, ry: 12, n: 4, fill: 'haze', a: .04 }, { t: 'halo', x: 236, y: 166, rx: 12, ry: 12, n: 4, fill: 'haze', a: .04 }, { t: 'halo', x: 290, y: 196, rx: 60, ry: 14, n: 5, fill: 'pool', a: .03 }, { t: 'halo', x: 200, y: 250, rx: 120, ry: 22, n: 6, fill: 'pool', a: .03 }] } } },
    breathe: { x: 0, y: 0, w: 0, h: 0 },
    shoppers: [{ keys: [[0, 186], [9, 210], [12, 210], [21, 186]], period: 21, foot: 170, s: .42, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', alpha: .85, shadow: false },
               { keys: [[0, 222], [8, 202], [11, 202], [19, 222]], period: 19, offset: 6, foot: 182, s: .52, coat: 'coatC', legs: 'legsDenim', hair: 'hairBrown', alpha: .9, shadow: false }],
    passersby: [{ start: 3, every: 22, dir: 1, speed: 26, foot: 287, s: 1.26, coat: 'coatA', long: 6, legs: 'legsDark', hair: 'hairDark' }],
    anim: [{ layer: 'back', draw: function (f, t, pal, v) {          // the fountain: jets breathing up and down, a glint on the water
      f.fillStyle = pal.spray; for (var hz = 0; hz < 3; hz++) { f.globalAlpha = .07; f.beginPath(); f.ellipse(285, 188 - hz * 2, 46 - hz * 10, 9 - hz * 2, 0, 0, Math.PI * 2); f.fill(); }
      f.fillStyle = pal.jet;
      for (var i = 0; i < 6; i++) { var x = 250 + i * 14, h = 15 + 2.6 * Math.sin(t * 1.1 + i * 1.7); f.globalAlpha = .7; f.fillRect(x - .6, 197 - h, 1.2, h);
        f.globalAlpha = .35; f.beginPath(); f.ellipse(x, 197 - h, 3, 1.6, 0, 0, Math.PI * 2); f.fill(); f.globalAlpha = .25; f.beginPath(); f.ellipse(x, 197, 3.4, 1, 0, 0, Math.PI * 2); f.fill();
        for (var sp = 0; sp < 5; sp++) { var ph = (t * 1.7 + i * .37 + sp * .21) % 1; f.globalAlpha = .55 * Math.sin(ph * Math.PI); f.fillRect(x + Math.sin(sp * 2.3 + i) * (1.4 + ph * 3), 197 - h + ph * h * .8, .7, .7); } }
      for (var j = 0; j < 5; j++) { var u = (t * .08 + j * .21) % 1; f.globalAlpha = .35 * Math.sin(u * Math.PI); f.fillRect(244 + u * 80, 200 + (j % 3) * 3.2, 6, .8); } } }],
    sig: { emerge: { x: 200, foot0: 196, foot1: 264, s0: .58, s1: 1.25, dur: 1.4 } },
    build: function (L, F, P) {
      L.push(r(0, 0, 400, 160, 'sky', { shade: grain('skyShade', .16, 'down', 1.6) }));
      // the Shinjuku skyline, pale with distance, each tower its own shape:
      // the twin-topped city hall, the stepped Park Tower, the cocoon, and the spired clock tower nearest us
      L.push(r(144, 116, 20, 44, 'tower2', { shade: grain('towerShade', .25, 'right') }));
      L.push(r(166, 98, 14, 62, 'tower2', { shade: grain('towerShade', .25, 'right') })); L.push(r(180, 104, 6, 56, 'tower2')); L.push(r(168, 92, 4, 6, 'tower2')); L.push(r(175, 92, 4, 6, 'tower2'));   // twin tops
      L.push(poly([254, 160, 254, 112, 262, 104, 262, 96, 270, 88, 278, 96, 278, 112, 284, 118, 284, 160], 'tower', { shade: grain('towerShade', .25, 'right') }));                        // stepped peaks
      L.push(poly([290, 160, 290, 122, 293, 110, 298, 104, 303, 110, 306, 122, 306, 160], 'tower2', { shade: grain('towerShade', .3, 'right') }));                                       // the cocoon
      for (var cn = 0; cn < 6; cn++) L.push(line([291 + cn * 2.6, 158, 295 + cn * 2, 108], 'towerShade', .4, { a: .4 }));
      L.push(r(312, 126, 16, 34, 'tower', { shade: grain('towerShade', .25, 'right') }));
      L.push(r(230, 86, 18, 74, 'tower2', { shade: grain('towerShade', .25, 'right') }));
      // the clock tower: a tall shaft, two set-backs, the clock face, a needle spire
      L.push(r(198, 76, 28, 84, 'tower', { shade: grain('towerShade', .3, 'right') }));
      L.push(r(201, 60, 22, 16, 'tower')); L.push(r(204, 48, 16, 12, 'tower')); L.push(poly([204, 48, 220, 48, 212, 40], 'tower'));
      L.push(r(211.4, 20, 1.2, 22, 'towerShade')); L.push(c(212, 54, 3.4, 'towerShade', { a: .6 })); L.push(c(212, 54, 2.4, 'tower'));
      for (var wy = 80; wy < 156; wy += 6) L.push(r(202, wy, 20, .8, 'towerBand'));
      // far trees on the horizon, the lawn, the path running in
      [[132, 152, 13, 8], [150, 149, 15, 11], [172, 148, 10, 12], [190, 152, 9, 6], [228, 149, 12, 9], [250, 150, 15, 10], [272, 151, 11, 7], [290, 150, 8, 11], [304, 154, 10, 6]].forEach(function (q, i) {
        L.push(e(q[0], q[1], q[2], q[3], 'treeFar', { shade: grain('tree3', .4, 'down', 1.5) })); L.push(e(q[0] - q[2] * .3, q[1] - q[3] * .4, q[2] * .55, q[3] * .5, 'tree3')); if (i % 3 === 0) L.push(e(q[0] + q[2] * .7, q[1] + 2, q[2] * .5, q[3] * .6, 'treeFar')); });
      L.push(r(0, 156, 400, 88, 'lawn', { shade: grain('lawnShade', .35, 'down') }));
      L.push(poly([188, 156, 212, 156, 330, 244, 70, 244], 'path', { shade: grain('pathShade', .3, 'up') }));
      for (var pj = 0; pj < 7; pj++) { var t = pj / 7, y = 156 + 88 * t * t; L.push(r(200 - (12 + 118 * t * t) + 2, y, (12 + 118 * t * t) * 2 - 4, .6 + t * .6, 'pathShade', { a: .35 })); }
      // the long pond: a stone rim with a lit top edge, sky-tinted water, the far trees softly reflected
      L.push(poly([222, 180, 338, 180, 364, 210, 229, 210], 'pondEdge', { shade: grain('pathShade', .3, 'down') }));
      L.push(poly([222, 180, 338, 180, 339, 181.4, 222.4, 181.4], 'rimLit')); L.push(poly([229, 210, 364, 210, 364, 212.4, 229, 212.4], 'pathShade'));
      L.push(poly([229, 183.6, 333, 183.6, 355, 206.6, 235, 206.6], 'pond', { shade: grain('pondShade', .25, 'down', 1.6) }));
      L.push(poly([229, 183.6, 333, 183.6, 337, 188.4, 230, 188.4], 'pondReflect', { shade: grain('pond', .3, 'down') }));
      L.push(poly([232, 192.4, 340, 192.4, 342, 194.6, 233, 194.6], 'pondSky'));
      [[242, 200, 20], [270, 202, 26], [304, 199, 18], [326, 203, 14]].forEach(function (q) { L.push(r(q[0], q[1], q[2], .6, 'pondSky')); });
      L.push(poly([229, 183.6, 333, 183.6, 334, 185, 229.4, 185], 'pondShade'));
      // benches beside the path, someone resting on each
      [[96, 206, 26], [304, 222, 30]].forEach(function (b, i) { L.push(r(b[0], b[1], b[2], 3, 'bench', { shade: grain('benchShade', .4, 'down') })); L.push(r(b[0], b[1] - 7, b[2], 2, 'bench'));
        L.push(r(b[0] + 2, b[1] + 3, 1.6, 6, 'benchShade')); L.push(r(b[0] + b[2] - 3.6, b[1] + 3, 1.6, 6, 'benchShade')); contact(L, b[0] + b[2] / 2, b[1] + 9.4, b[2] / 2, .12); });
      sitter(L, 104, 206, .72, { coat: 'coatA', legs: 'legsDenim', hair: 'hairDark', dir: 1 }); sitter(L, 316, 222, .82, { coat: 'coatD', legs: 'legsDark', hair: 'hairBrown', dir: -1 });
      sitter(L, 324, 222, .78, { coat: 'coatC', legs: 'legsDark', hair: 'hairDark', dir: -1 });
      // a park map board on the lawn
      L.push(r(150, 200, 1.4, 14, 'board')); L.push(r(160, 200, 1.4, 14, 'board')); L.push(r(147, 190, 17, 11, 'board', { r: .6 })); L.push(r(148.6, 191.4, 13.8, 8, 'boardFace')); L.push(e(154, 195, 4, 2, 'lawn', { a: .8 })); L.push(r(149.6, 192.4, 4, .6, 'board'));
      // the big trees either side: trunks, three layers of canopy with light breaking through
      [[36, 150, 5], [92, 160, 4], [62, 166, 3], [356, 152, 5], [312, 162, 4], [340, 170, 3]].forEach(function (t2) { L.push(r(t2[0], t2[1], t2[2], 244 - t2[1], 'trunk', { shade: grain('treeShade', .3, 'right') })); });
      // the canopies: a lighter far layer, then big near masses that close in over the path
      canopy(L, 76, 80, 74, 50, 11, ['treeFar', 'tree3', 'tree2']); canopy(L, 328, 80, 74, 50, 12, ['treeFar', 'tree3', 'tree2']);
      canopy(L, 24, 108, 76, 72, 21, ['tree', 'tree3', 'treeShade'], { trunk: 38 }); canopy(L, 108, 126, 54, 46, 22, ['tree2', 'tree3', 'treeShade'], { trunk: 94 });
      canopy(L, 36, 170, 52, 30, 23, ['tree', 'tree2', 'treeShade']); canopy(L, 134, 156, 26, 20, 24, ['tree2', 'tree3', 'treeShade']);
      canopy(L, 378, 108, 76, 72, 31, ['tree2', 'tree3', 'treeShade'], { trunk: 358 }); canopy(L, 298, 126, 52, 44, 32, ['tree', 'tree3', 'treeShade'], { trunk: 314 });
      canopy(L, 366, 170, 50, 30, 33, ['tree', 'tree2', 'treeShade']); canopy(L, 278, 158, 22, 18, 34, ['tree2', 'tree3', 'treeShade']);
      // a drinks machine tucked under the left trees
      vending(L, 20, 244, { seed: 84, w: 22, h: 40, trim: 'treeShade' });
      pavement(L, F, { seed: 8440, manhole: [330, 288, 15], stains: 2 });
      L.push(poly([70, 244, 330, 244, 340, 248, 60, 248], 'path', { a: .6 }));
      // fallen leaves on the path and the pavement, a few yellowing
      leaves(L, 110, 290, 216, 244, 14, 31); leaves(L, 20, 380, 250, 298, 9, 37);
      // park lamps along the path: a slim post, a small lantern; two further ones down the path
      [[121, 182, 1], [279, 182, 1], [166, 164, .6], [236, 164, .6]].forEach(function (q) { var x = q[0], y = q[1], s2 = q[2], foot = q[2] === 1 ? 252 : 186;
        F.push(r(x - .8 * s2, y, 1.6 * s2, foot - y, 'post')); F.push(r(x - 3 * s2, y - 9 * s2, 6 * s2, 9 * s2, 'lampGlass', { r: [2 * s2, 2 * s2, .4, .4] }));
        F.push(r(x - 3.6 * s2, y - 10 * s2, 7.2 * s2, 1.6 * s2, 'post', { r: 1 })); F.push(r(x - 3.4 * s2, y - .6, 6.8 * s2, 1.2 * s2, 'post')); if (q[2] === 1) contact(F, x, foot, 4, .14); });
    } });
})();
