/* Scene — nadoya-no-katte. Needs /timeline/lib/last-seen.js and /timeline/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, contact = K.contact, sheen = K.sheen, ac = K.ac, pipe = K.pipe, plant = K.plant, sitter = K.sitter, leaves = K.leaves;
  // a tree mass as one opaque silhouette with a lit crown and a dark underside (as in Yoyogi Park)
  function canopy(L, cx, cy, rx, ry, seed, v) {
    var R = rnd(seed), i, a, d, body = [], crown = [], under = [];
    for (i = 0; i < 26; i++) { a = R() * Math.PI * 2; d = Math.pow(R(), .5) * .7; body.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, rx * (.17 + R() * .15), ry * (.17 + R() * .15), R() * 3]); }
    for (i = 0; i < 8; i++) { a = -Math.PI * (.5 + R() * .45); d = .3 + R() * .55; crown.push([cx - rx * .12 + Math.cos(a) * rx * d, cy - ry * .1 + Math.sin(a) * ry * d, rx * (.15 + R() * .12), ry * (.13 + R() * .1), R() * 3]); }
    for (i = 0; i < 9; i++) { a = Math.PI * (.05 + R() * .9); d = .45 + R() * .45; under.push([cx + rx * .1 + Math.cos(a) * rx * d, cy + ry * .18 + Math.sin(a) * ry * d * .8, rx * (.16 + R() * .12), ry * (.12 + R() * .1), R() * 3]); }
    L.push({ t: 'blob', clumps: body, fill: v[0], shade: grain(v[2], .14, 'down', 1.7), inner: [{ clumps: under, fill: v[2], shade: grain('treeDeep', .25, 'down', 1.5) }, { clumps: crown, fill: v[1], shade: grain(v[0], .14, 'br', 1.6) }] });
  }
  // dappled sun through the trees: soft lit patches (komorebi), only in daylight
  function dapple(A, x0, x1, y0, y1, n, seed, fill, a) {
    var R = rnd(seed); for (var i = 0; i < n; i++) A.push(e(x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), 2 + R() * 5, 1 + R() * 2, fill, { a: a * (.5 + R() * .5), rot: R() * .6 - .3 }));
  }
  // weathered plaster: a base, a slow grain, a few hairline cracks and stains
  function plaster(A, x, y, w, h, seed) {
    var R = rnd(seed); A.push(r(x, y, w, h, 'plaster', { shade: [grain('plasterShade', .28, 'down', 1.6), grain('plasterLite', .12, 'up', 2)] }));
    for (var i = 0; i < 5; i++) A.push(e(x + R() * w, y + R() * h, 6 + R() * 14, 2 + R() * 5, 'plasterShade', { a: .1 + R() * .1 }));
    for (var j = 0; j < 3; j++) { var cx = x + R() * w, cy = y + R() * h; A.push(line([cx, cy, cx + 4 + R() * 6, cy + 3 + R() * 5, cx + 6 + R() * 8, cy + 9 + R() * 5], 'crack', .35, { a: .5 })); }
  }
  /* ================= nadoya no kaTte — Yoyogi-Uehara (Oct 2, 13:15) =================
     a sixty-year-old house turned gallery and coffee stand: the old plaster house above with its window
     rail and a brown eave, a timber-framed glass room on the left with a wire chair and a low table,
     the kaTte on the right — an open timber frame under a thin plywood canopy, a speckled concrete counter
     with jars of beans and drippers, a low concrete slab with a rusted steel edge over raked gravel,
     stepping stones, a stone lantern, a bench, the garden's trees letting the sun through */
  make('nadoya-no-katte', { seed: 902, seenAt: '2026-10-02T13:15:00+09:00',
    place: { en: 'nadoya no kaTte', ja: 'ナドヤノカッテ' }, name: { en: 'nadoya no kaTte', ja: 'ナドヤノカッテ' }, area: { en: 'Yoyogi-Uehara, Tokyo', ja: '東京・代々木上原' },
    alt: 'Illustration of nadoya no kaTte in Yoyogi-Uehara: an old plaster house with a timber-framed glass room, an open timber coffee counter under a thin canopy, a low concrete slab over gravel, stepping stones, a stone lantern and garden trees.',
    palette: { sky: '#e1e8ea', skyShade: '#c9d5d9', sunWash: '#ffc58e',
      plaster: '#e3d7c4', plasterShade: '#c8b89f', plasterLite: '#f1e8d9', crack: '#a8987f', plaster2: '#ddcdb6', plaster2Shade: '#c2ae92',
      eave: '#7b5a43', eaveShade: '#5a3f2d', eaveLite: '#99765a', soffit: '#d8ccb8', soffitShade: '#bba98f', beam: '#9a6e46', beamShade: '#74502f',
      timber: '#c7965f', timberShade: '#a0723f', timberLite: '#dcb07c', ply: '#d9b98c', plyShade: '#b8955f', plyEdge: '#efdcbc',
      grille: '#4d4d4b', winFrame: '#efebe3', win: '#5d6870', winShade: '#465159', curtain: '#f1ece2',
      glass: '#56636a', glassShade: '#3f4a51', inWall: '#efe7d8', inWallShade: '#d8c9b0', inFloor: '#b98f62', inFloorShade: '#94693f', inWood: '#a87a4b', inWoodShade: '#7e5531',
      inWire: '#f4f2ee', inShirt: '#d9d2c4', inShirt2: '#c45e4c', inLeaf: '#5f7a4a', inLeaf2: '#7e985f', inLeafD: '#47603a', inPot: '#d9cdb9', inLamp: '#ffe2ad', inArt: '#c7b79c', inShadowLeaf: '#cbbca3',
      inDoor: '#a98a68', inCounter: '#9e9d98', inCounterShade: '#7f7e79', inSpeck: '#5e5d59', inSpeck2: '#d6d4cd', inBack: '#f2eee6', inBackShade: '#d9d1c2', inMachine: '#c8ccce', inMachineD: '#6e7276', inJar: '#e9e4d8', inBean: '#6b4a33', inKettle: '#2f3133', inCup: '#f7f4ee', inBlackWood: '#2e2c2a',
      slab: '#c9c6bf', slabShade: '#aaa69e', slabLite: '#dedbd4', rust: '#7b4a2e', rustShade: '#5b3420', rustLite: '#9a6040', step: '#b48a5c', stepShade: '#8c6639',
      gravel: '#c8c3b9', reflect: '#5f7356', gravelShade: '#aaa59b', gravelDot: '#8e897f', gravelLite: '#e6e3dc', stone: '#9b958a', stoneTop: '#b9b3a8', stoneShade: '#7a746a',
      lantern: '#a8a397', lanternShade: '#857f73', lanternLite: '#c4bfb4', lanternHole: '#4a463f',
      fence: '#34322f', fenceShade: '#22201e', fenceLite: '#4a4743', chair: '#a7aaa8', chairShade: '#7c807e',
      tree: '#6f8a56', tree2: '#86a066', tree3: '#a3b57c', treeShade: '#506a3f', treeDeep: '#3d5230', trunk: '#6f5c4a', autumn: '#d0a050', autumn2: '#c07a45',
      roof: '#55585c', roofShade: '#3c3e42', roofLite: '#8a8d91', frosted: '#dfe3e2', meter: '#d9d6cf', bench: '#a9805a', benchShade: '#7e5a39', hyd: '#7f93b8', hyd2: '#9fb0cf', sun: '#fff6df', leafShadow: '#7d6d55' },
    light: { noShadows: true,
      morning: { set: { sky: '#dce6ec', skyShade: '#c3d2db' }, add: { back: [poly([186, 96, 400, 96, 400, 150, 238, 150], 'shadow', { a: .08 })], over: [] } },
      midday: { add: { back: [r(186, 96, 214, 6, 'shadow', { a: .18 }), r(0, 90, 186, 5, 'shadow', { a: .2 })] } },
      golden: { set: { sun: '#ffd9a0' }, add: { back: [poly([0, 140, 60, 90, 120, 90, 40, 160], 'sun', { a: .12 })] } },
      night: { set: { sky: '#121831', skyShade: '#0b1022', sun: '#0d1124', inShadowLeaf: '#efe7d8', glass: '#2a2018', glassShade: '#1d150f', win: '#1b1f28', winShade: '#13161d', curtain: '#3a3934',
          gravelLite: '#24252c', fence: '#101012', fenceShade: '#08080a', leafShadow: '#0d1124', lantern: '#3a3833', lanternShade: '#2a2825', lanternLite: '#4a4740', lanternHole: '#ffcf86', frosted: '#e2bd84', reflect: '#141820', stone: '#3c3d44', stoneTop: '#4b4c53', stoneShade: '#25262c', gravel: '#2a2b31', gravelShade: '#1d1e23', gravelDot: '#15161a' },
        add: { back: [r(296, 10, 50, 28, 'inLit', { a: .55 }), r(296, 10, 50, 6, 'inLit2', { a: .3 })],
          over: [{ t: 'halo', x: 90, y: 160, rx: 90, ry: 70, n: 6, fill: 'haze', a: .035 }, { t: 'halo', x: 276, y: 150, rx: 90, ry: 60, n: 6, fill: 'haze', a: .04 }, { t: 'halo', x: 250, y: 238, rx: 140, ry: 22, n: 6, fill: 'pool', a: .04 },
            { t: 'halo', x: 360, y: 232, rx: 14, ry: 12, n: 5, fill: 'lanternHole', a: .06 }, { t: 'halo', x: 250, y: 112, rx: 10, ry: 10, n: 4, fill: 'inLamp', a: .06 }, { t: 'halo', x: 300, y: 112, rx: 10, ry: 10, n: 4, fill: 'inLamp', a: .06 }, { t: 'halo', x: 320, y: 24, rx: 30, ry: 20, n: 4, fill: 'haze', a: .03 }, { t: 'halo', x: 40, y: 40, rx: 22, ry: 18, n: 4, fill: 'haze', a: .03 }] } } },
    breathe: { x: 6, y: 100, w: 380, h: 126 },
    shoppers: [{ keys: [[0, 262], [6, 262], [9, 292], [15, 292], [18, 262]], period: 18, foot: 173, s: .66, coat: 'coatD', legs: 'legsDark', hair: 'hairDark', alpha: 1, shadow: false }],
    passersby: [{ start: 6, every: 26, dir: -1, speed: 18, foot: 286, s: 1.22, coat: 'coatC', legs: 'legsDenim', hair: 'hairBrown', longHair: true, carry: 'tote', carryC: 'coatA' }],
    anim: [{ layer: 'front', draw: function (f, t, pal, v) {          // steam off the kettle and a cup on the counter
      for (var i = 0; i < 3; i++) { var u = (t * .3 + i / 3) % 1, a = .38 * (1 - u) * Math.min(1, u * 5) * (v === 'night' ? .7 : 1);
        f.globalAlpha = a; f.fillStyle = pal.inCup; f.beginPath(); f.arc(287 + Math.sin(u * 5 + i) * 1.3, 164 - u * 14, .9 + u * 1.6, 0, Math.PI * 2); f.fill(); } } }],
    sig: { emerge: { x: 200, foot0: 230, foot1: 264, s0: .7, s1: 1.22, dur: 1.2 } },
    build: function (L, F, P) {
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .16, 'down', 1.6) }));
      // the old house above: plaster, a window behind a metal rail, a brown eave on the right volume, an AC unit
      plaster(L, 0, 0, 236, 88, 31); plaster(L, 236, 0, 120, 92, 32);
      L.push(r(236, 0, 1.4, 92, 'plasterShade', { a: .7 })); L.push(r(237.4, 0, 4, 92, 'shadow', { a: .08 }));
      // left: the window with its rail (a small balcony)
      L.push(r(70, 6, 92, 44, 'winFrame', { shade: grain('soffitShade', .3, 'down') })); L.push(r(73, 9, 86, 38, 'win', { shade: grain('winShade', .35, 'down') }));
      L.push(r(73, 9, 30, 38, 'curtain', { shade: grain('plasterShade', .3, 'right') })); L.push(r(115.4, 9, 1.6, 38, 'winFrame')); sheen(L, 73, 9, 86, 38, { a: .1, street: false });
      L.push(r(64, 52, 104, 3, 'grille')); L.push(r(64, 30, 104, 1.6, 'grille')); for (var gx = 66; gx < 168; gx += 4.2) L.push(r(gx, 31, .8, 22, 'grille'));
      L.push(r(64, 55, 104, 2, 'shadow', { a: .18 }));
      pipe(L, 214, 0, 74);
      // the old tiled roof just showing at the top, and its deep shadow
      L.push(r(0, 0, 236, 11, 'roof', { shade: grain('roofShade', .45, 'down') })); for (var tx = 3; tx < 236; tx += 7) { L.push(r(tx, 0, 1.4, 11, 'roofShade', { a: .7 })); L.push(c(tx + 3.5, 10.6, 2.6, 'roof', { shade: grain('roofShade', .4, 'down') })); L.push(r(tx + 2.4, 9.6, 2.2, .7, 'roofLite', { a: .6 })); }
      L.push(r(0, 13.4, 236, 4, 'shadow', { a: .16 }));
      // a small frosted window with bars (the old bathroom), a meter box and its cables
      L.push(r(26, 28, 28, 24, 'winFrame')); L.push(r(28.4, 30.4, 23.2, 19.2, 'frosted', { shade: grain('plasterShade', .3, 'down') })); for (var fb = 30; fb < 52; fb += 4) L.push(r(fb, 28, 1, 24, 'grille'));
      L.push(r(24, 52, 32, 2, 'winFrame')); L.push(r(24, 54, 32, 1.6, 'shadow', { a: .14 }));
      L.push(r(190, 30, 14, 18, 'meter', { r: 1, shade: grain('plasterShade', .4, 'right') })); L.push(c(197, 37, 4, 'win', { a: .6 })); L.push(r(193, 44, 8, 1.4, 'grille', { a: .6 }));
      L.push(line([197, 48, 197, 60, 210, 66, 236, 66], 'grille', .7)); L.push(line([200, 30, 206, 14, 236, 12], 'grille', .6)); L.push(line([194, 48, 188, 72], 'grille', .6));
      // the garden trees throw shade onto the old wall
      dapple(L, 150, 236, 16, 70, 12, 33, 'leafShadow', .12); dapple(L, 236, 400, 58, 86, 10, 34, 'leafShadow', .12);
      // right: a window under its own little eave, an AC unit hung on the wall
      L.push(r(292, 6, 58, 36, 'winFrame')); L.push(r(295, 9, 52, 30, 'win', { shade: grain('winShade', .35, 'down') })); L.push(r(321, 9, 1.6, 30, 'winFrame')); L.push(r(323, 9, 24, 30, 'curtain', { a: .9 })); sheen(L, 295, 9, 52, 30, { a: .1, street: false });
      L.push(poly([282, 44, 362, 44, 366, 52, 278, 52], 'eave', { shade: grain('eaveShade', .4, 'down') })); L.push(r(278, 52, 88, 2.4, 'eaveShade')); L.push(r(282, 44, 80, .8, 'eaveLite'));
      L.push(r(278, 54.4, 88, 4, 'shadow', { a: .14 }));
      ac(L, 362, 62, 22);
      // the garden's big tree in the top right corner, just turning
      canopy(L, 392, 10, 40, 30, 41, ['tree', 'tree3', 'treeShade']); canopy(L, 376, 54, 26, 18, 42, ['tree2', 'tree3', 'treeShade']);
      (function () { var R = rnd(43); for (var i = 0; i < 26; i++) { var a = R() * 6.28, d = R(); L.push(e(380 + Math.cos(a) * 30 * d, 30 + Math.sin(a) * 30 * d, 2 + R() * 1.6, 1 + R(), R() > .4 ? 'autumn' : 'autumn2', { rot: R() * 3, a: .75 })); } })();
      L.push(line([400, 76, 384, 58, 374, 40], 'trunk', 2.2)); L.push(line([384, 58, 396, 46], 'trunk', 1.2));
      // the gallery's eave: a deep plaster soffit with the old beam showing
      L.push(poly([-4, 72, 196, 72, 200, 80, -4, 84], 'soffit', { shade: grain('soffitShade', .4, 'down') })); L.push(r(-4, 72, 200, .8, 'plasterLite'));
      L.push(r(0, 84, 190, 6, 'beam', { shade: grain('beamShade', .4, 'down') })); for (var bx = 6; bx < 186; bx += 22) L.push(r(bx, 85, 8, .5, 'beamShade', { a: .6 }));
      // the glass room: warm wall with the tree's shadow on it, a wire chair, a long low table, a plant, a shirt on show
      L.push(r(0, 90, 186, 136, 'inWall', { shade: grain('inWallShade', .32, 'down', 1.8) }));
      dapple(L, 10, 170, 96, 170, 22, 51, 'inShadowLeaf', .55);
      L.push(line([20, 98, 46, 132, 60, 150], 'inShadowLeaf', 1.4, { a: .5 })); L.push(line([46, 132, 30, 160], 'inShadowLeaf', 1, { a: .45 })); L.push(line([120, 96, 140, 124, 168, 140], 'inShadowLeaf', 1.2, { a: .45 }));
      L.push(r(0, 196, 186, 30, 'inFloor', { shade: grain('inFloorShade', .35, 'down') })); L.push(r(0, 196, 186, 1, 'inWallShade'));
      L.push(r(96, 118, 22, 28, 'inArt', { shade: grain('inWallShade', .3, 'down') })); L.push(r(98, 120, 18, 24, 'inWall')); L.push(e(107, 132, 5, 7, 'inShirt2', { a: .5 }));
      // the shirt on a stand
      L.push(r(58.6, 160, 1.2, 40, 'inWoodShade')); L.push(r(52, 199, 14, 1.6, 'inWoodShade'));
      L.push(poly([50, 146, 59, 142, 68, 146, 70, 176, 48, 176], 'inShirt', { shade: grain('inWallShade', .4, 'right') })); for (var sx = 51; sx < 69; sx += 3) L.push(r(sx, 147, .7, 29, 'inShirt2', { a: .45 })); for (var sy = 150; sy < 176; sy += 3.4) L.push(r(49, sy, 21, .7, 'inShirt2', { a: .35 }));
      L.push(c(59, 140, 3, 'inWoodShade'));
      // a wire chair: the seat shell in fine lines
      (function () { var x = 30, y = 196; L.push(line([x - 9, y, x - 7, y - 10], 'inWire', .7)); L.push(line([x + 9, y, x + 7, y - 10], 'inWire', .7));
        L.push(poly([x - 10, y - 11, x + 10, y - 11, x + 12, y - 24, x - 12, y - 24], 'inWire', { a: .25 }));
        for (var i = -10; i <= 10; i += 2.2) L.push(line([x + i, y - 11, x + i * 1.2, y - 24], 'inWire', .35)); for (var j = 0; j < 4; j++) L.push(line([x - 10 - j * .5, y - 12 - j * 3.4, x + 10 + j * .5, y - 12 - j * 3.4], 'inWire', .35));
        L.push(line([x - 10, y - 11, x + 10, y - 11], 'inWire', .9)); L.push(line([x - 12, y - 24, x + 12, y - 24], 'inWire', .9)); })();
      // a long low table of rough timber with a ceramic jar
      L.push(r(84, 196, 64, 4, 'inWood', { shade: grain('inWoodShade', .35, 'down') })); L.push(r(88, 200, 3, 10, 'inWoodShade')); L.push(r(141, 200, 3, 10, 'inWoodShade'));
      L.push(r(84, 196, 64, .8, 'inLamp', { a: .5 })); L.push(e(112, 192, 4, 4, 'inPot')); L.push(r(110.4, 186, 3.2, 4, 'inPot'));
      plant(L, 164, 210, 1.3, 61, { pot: 'inPot', n: 9, tall: 1.8, leaf: 'inLeaf', leaf2: 'inLeaf2', leafShade: 'inLeafD' });
      L.push(r(134.6, 90, .8, 16, 'inWoodShade')); L.push(c(135, 108, 3.4, 'inLamp')); L.push(g(135, 112, 10, 'inLamp', { d: .22, sy: .6 }));
      // the kaTte: back wall, the barista's shelves, the counter of speckled concrete
      L.push(r(186, 96, 214, 130, 'inBack', { shade: grain('inBackShade', .3, 'down', 1.8) }));
      L.push(r(330, 96, 70, 136, 'fence', { shade: grain('fenceShade', .4, 'down') })); for (var fx = 332; fx < 400; fx += 5) { L.push(r(fx, 96, 1, 136, 'fenceShade')); L.push(r(fx + 1, 96, .6, 136, 'fenceLite', { a: .5 })); }
      dapple(L, 334, 398, 110, 200, 10, 52, 'sun', .25);
      L.push(r(242, 120, 70, 2, 'inBlackWood')); L.push(r(242, 140, 70, 2, 'inBlackWood'));
      for (var jx = 246, k = 0; jx < 308; jx += 7.4, k++) { L.push(r(jx, 112 + (k % 2), 5, 8 - (k % 2), 'inJar', { r: [1, 1, .4, .4] })); L.push(r(jx + .6, 116, 3.8, 4, 'inBean', { a: .85 })); L.push(r(jx + .4, 111.4 + (k % 2), 4.2, 1.2, 'inBlackWood')); }
      for (var cx2 = 246, k2 = 0; cx2 < 308; cx2 += 6, k2++) L.push(r(cx2, 134, 4, 6, k2 % 3 ? 'inCup' : 'inMachine', { r: [.4, .4, 1, 1] }));
      [250, 300].forEach(function (lx) { L.push(r(lx - .3, 96, .6, 12, 'inBlackWood')); L.push(c(lx, 110, 2.2, 'inLamp')); L.push(g(lx, 113, 7, 'inLamp', { d: .22, sy: .6 })); });
      L.push(r(198, 102, 32, 124, 'inBackShade')); L.push(r(201, 106, 26, 120, 'inDoor', { shade: grain('inWoodShade', .3, 'down', 1.6) }));   // the old back door into the house
      L.push(r(207, 116, 14, 18, 'inLamp', { a: .55 })); L.push(r(213.6, 116, .8, 18, 'inWoodShade')); L.push(r(207, 124.6, 14, .8, 'inWoodShade'));
      L.push(r(203, 150, 22, 1.6, 'inWood')); L.push(r(205, 144, 4, 6, 'inJar')); L.push(r(211, 145, 5, 5, 'inPot')); L.push(r(218, 143, 3, 7, 'inBean'));
      L.push(r(201, 196, 26, 30, 'inWoodShade', { a: .5 })); L.push(r(201, 106, 26, 3, 'shadow', { a: .2 }));
      // the low slab: concrete with a rusted steel edge, raised a step over the gravel; the gallery sits on its own slab
      L.push(r(0, 226, 400, 8, 'slab', { shade: grain('slabShade', .35, 'down') })); L.push(r(0, 226, 400, .9, 'slabLite'));
      L.push(r(0, 226, 186, 2.4, 'timber', { shade: grain('timberShade', .3, 'down') })); L.push(r(0, 228.4, 186, 1, 'shadow', { a: .15 }));
      L.push(r(0, 234, 400, 7, 'rust', { shade: grain('rustShade', .45, 'down', 1.3) })); L.push(r(0, 234, 400, .8, 'rustLite'));
      for (var rx = 30; rx < 400; rx += 46) L.push(e(rx, 238, 8, 1.6, 'rustShade', { a: .35 }));
      L.push(r(0, 241, 400, 2.4, 'shadow', { a: .22 }));
      // the gravel garden: raked lines, grain, stepping stones up to the slab, a stone lantern, a bench, hydrangeas
      L.push(r(0, 243, 400, 57, 'gravel', { shade: [grain('gravelShade', .4, 'flat', 1), grain('gravelShade', .3, 'up', 1.4)] }));
      (function () { var R = rnd(81); for (var i = 0; i < 520; i++) { var x = R() * 400, y = 244 + Math.pow(R(), .8) * 56; L.push(c(x, y, .3 + (y - 244) / 56 * .5 + R() * .3, R() > .45 ? 'gravelDot' : 'gravelLite', { a: .7 })); } })();
      for (var ry = 252; ry < 300; ry += 6 + (ry - 252) * .12) L.push(r(0, ry, 400, .5, 'gravelShade', { a: .45 }));
      [[200, 264, 15, 3.6], [178, 278, 16, 4.2], [214, 292, 18, 4.6], [222, 250, 12, 2.6]].forEach(function (s) {
        var x = s[0], y = s[1], w = s[2], h = s[3], pts = [x - w, y + h * .2, x - w * .7, y - h, x + w * .2, y - h * 1.1, x + w * .9, y - h * .5, x + w, y + h * .5, x + w * .4, y + h, x - w * .6, y + h * .9];
        L.push(e(x, y + h + .4, w, 1.4, 'shadow', { a: .2 })); L.push(poly(pts.map(function (v, i) { return i % 2 ? v + 1.6 : v; }), 'stoneShade'));
        L.push(poly(pts, 'stone', { shade: grain('stoneShade', .4, 'down') })); L.push(poly([x - w * .7, y - h * .7, x + w * .2, y - h * .85, x + w * .6, y - h * .4, x - w * .2, y - h * .2], 'stoneTop', { a: .75 })); });
      L.push(r(282, 241, 56, 7, 'step', { shade: grain('stepShade', .4, 'down') })); L.push(r(282, 241, 56, .8, 'timberLite')); L.push(r(282, 248, 56, 1.6, 'shadow', { a: .2 }));
      for (var sg = 290; sg < 336; sg += 9) L.push(r(sg, 243, 5, .4, 'stepShade', { a: .6 }));
      // the metal chair on the slab, by the fence
      (function () { var x = 364, y = 233; L.push(r(x - 7, y - 14, 14, 2.4, 'chair', { shade: grain('chairShade', .4, 'down') })); L.push(r(x - 6, y - 26, 12, 12, 'chair', { r: [4, 4, 0, 0], shade: grain('chairShade', .4, 'right') }));
        for (var hx = -4; hx <= 4; hx += 2.6) L.push(r(x + hx, y - 23, 1.2, 6, 'chairShade', { a: .7 }));
        L.push(line([x - 6.4, y - 11.6, x - 8, y], 'chair', 1.1)); L.push(line([x + 6.4, y - 11.6, x + 8, y], 'chair', 1.1)); L.push(line([x - 3, y - 11.6, x - 3.6, y], 'chairShade', .9)); L.push(line([x + 3, y - 11.6, x + 3.6, y], 'chairShade', .9)); contact(L, x, y, 9, .14); })();
      // the stone lantern on the right, in the gravel
      (function () { var x = 362, y = 270; contact(L, x, y, 14, .2);
        L.push(r(x - 10, y - 6, 20, 6, 'lantern', { shade: grain('lanternShade', .4, 'down') })); L.push(r(x - 3.4, y - 26, 6.8, 20, 'lantern', { shade: grain('lanternShade', .45, 'right') }));
        L.push(r(x - 8, y - 30, 16, 4, 'lantern', { shade: grain('lanternShade', .4, 'down') })); L.push(r(x - 6, y - 41, 12, 11, 'lantern', { shade: grain('lanternShade', .45, 'right') }));
        L.push(r(x - 3, y - 39, 6, 6, 'lanternHole', { r: [3, 3, 0, 0] })); L.push(poly([x - 13, y - 41, x + 13, y - 41, x + 6, y - 48, x - 6, y - 48], 'lantern', { shade: grain('lanternShade', .4, 'down') }));
        L.push(poly([x - 13, y - 41, x - 6, y - 48, x - 5, y - 48, x - 11, y - 41], 'lanternLite')); L.push(c(x, y - 50, 2.4, 'lantern')); L.push(r(x - 10, y - 6, 20, .8, 'lanternLite'));
        L.push(e(x + 4, y - 2, 4, 1.4, 'tree', { a: .5 })); })();
      // hydrangeas and ferns at the left foot of the glass, a bench with someone and a cup
      [[16, 244, 'hyd', 12], [36, 240, 'hyd2', 10], [54, 246, 'hyd', 9], [6, 228, 'hyd2', 9]].forEach(function (h) { L.push(c(h[0], h[1], h[3], 'tree', { shade: grain('treeShade', .45, 'down') }));
        L.push(c(h[0] - 2, h[1] - 4, h[3] * .5, h[2], { shade: grain('hyd', .35, 'down') })); L.push(c(h[0] + h[3] * .45, h[1] - 1, h[3] * .35, h[2] === 'hyd' ? 'hyd2' : 'hyd')); L.push(e(h[0] - h[3] * .5, h[1] + 1, h[3] * .4, h[3] * .2, 'treeShade', { rot: .4 })); });
      F.push(r(80, 252, 70, 5, 'bench', { shade: grain('benchShade', .4, 'down') })); F.push(r(84, 257, 3.4, 16, 'benchShade')); F.push(r(143, 257, 3.4, 16, 'benchShade')); F.push(r(80, 252, 70, .8, 'plyEdge', { a: .6 }));
      for (var wg = 86; wg < 146; wg += 12) F.push(r(wg, 253.6, 6, .5, 'benchShade', { a: .55 })); contact(F, 115, 273, 38, .16);
      sitter(F, 104, 252, 1.12, { coat: 'coatA', legs: 'legsDark', hair: 'hairDark', dir: 1, cup: true, rimA: .45 });
      F.push(r(132, 247, 4.4, 5, 'inCup', { r: [.4, .4, 1, 1] }));
      // a branch of the cherry tree reaching across the top, leaves just turning
      (function () { var R = rnd(97); P.push(line([400, 4, 360, 12, 320, 8, 286, 16, 262, 12], 'trunk', 1.8)); P.push(line([360, 12, 344, 26, 330, 30], 'trunk', 1.1)); P.push(line([320, 8, 306, 0], 'trunk', 1)); P.push(line([286, 16, 270, 26], 'trunk', .9));
        [[262, 12], [270, 26], [330, 30], [306, 0], [344, 26], [296, 12], [376, 8], [316, 10]].forEach(function (q) { for (var i = 0; i < 7; i++) P.push(e(q[0] + (R() - .5) * 14, q[1] + (R() - .5) * 9, 2.4 + R() * 1.4, 1.1 + R() * .6, R() > .78 ? 'autumn' : (R() > .5 ? 'tree2' : 'tree'), { rot: R() * 3, shade: grain('treeShade', .3, 'down') })); }); })();
      // dappled light over everything in the day
      dapple(F, 0, 400, 244, 298, 26, 91, 'sun', .3); dapple(F, 190, 330, 170, 232, 10, 92, 'sun', .2);
      dapple(F, 200, 330, 250, 298, 12, 93, 'leafShadow', .12);
      // the counter
      F.push(r(230, 166, 104, 60, 'inCounter', { shade: [grain('inCounterShade', .4, 'down', 1.4), grain('inSpeck', .22, 'flat')] }));
      (function () { var R = rnd(71); for (var i = 0; i < 160; i++) F.push(c(231 + R() * 102, 167 + R() * 58, .35 + R() * .5, R() > .5 ? 'inSpeck2' : 'inSpeck', { a: .6 })); })();
      F.push(r(228, 162, 108, 4, 'inCounter', { shade: grain('inCounterShade', .3, 'down') })); F.push(r(228, 162, 108, .9, 'inSpeck2'));
      F.push(r(334, 166, 3, 60, 'inCounterShade'));
      // on the counter: a grinder, drippers on a stand, a black kettle, the till, a jar of beans
      F.push(r(244, 148, 8, 14, 'inMachine', { r: [1, 1, 0, 0], shade: grain('inMachineD', .4, 'right') })); F.push(poly([243, 148, 253, 148, 250, 141, 246, 141], 'inMachineD'));
      F.push(r(262, 152, 22, 1.4, 'inBlackWood')); F.push(r(263, 153.4, 1.2, 8.6, 'inBlackWood')); F.push(r(282, 153.4, 1.2, 8.6, 'inBlackWood'));
      [267, 274.4].forEach(function (dx) { F.push(poly([dx - 3, 148, dx + 3, 148, dx + 1, 152, dx - 1, 152], 'inCup')); F.push(r(dx - 1.6, 157, 3.2, 5, 'inJar', { a: .9 })); });
      F.push(r(284, 155, 7, 7, 'inKettle', { r: [2, 2, .6, .6] })); F.push(line([291, 157, 295, 153, 296, 152], 'inKettle', .9)); F.push(r(286, 153.6, 3, 1.6, 'inKettle'));
      F.push(r(306, 152, 12, 10, 'inMachine', { shade: grain('inMachineD', .3, 'down') })); F.push(r(308, 154, 8, 4, 'inBlackWood'));
      F.push(r(322, 154, 7, 8, 'inJar', { r: [1.4, 1.4, .4, .4] })); F.push(r(322.6, 157, 5.8, 5, 'inBean'));
      // the timber frame and the thin canopy over it
      [[188, 5], [236, 4.4], [316, 4.4], [348, 4.4]].forEach(function (p) { F.push(r(p[0], 94, p[1], 138, 'timber', { shade: grain('timberShade', .35, 'right', 1.4) })); F.push(r(p[0], 94, .9, 138, 'timberLite', { a: .7 })); });
      F.push(r(186, 104, 162, 3, 'timber', { shade: grain('timberShade', .3, 'down') }));
      F.push(r(186, 86, 214, 9, 'ply', { shade: grain('plyShade', .45, 'up', 1.3) })); F.push(r(186, 84, 214, 2.4, 'plyEdge')); F.push(r(186, 95, 214, 2, 'shadow', { a: .2 }));
      for (var px = 196; px < 400; px += 26) F.push(r(px, 86.6, .5, 8, 'plyShade', { a: .6 }));
      // the gallery glass: timber frames, a door, reflections of the garden
      F.push(r(0, 90, 186, 136, 'glass', { a: .2 }));
      F.push(poly([0, 90, 186, 90, 186, 100, 160, 106, 120, 98, 84, 104, 50, 100, 20, 112, 0, 124], 'reflect', { a: .26 }));   // the garden trees reflected along the top of the glass
      sheen(F, 4, 92, 110, 132, { a: .12, at: .25 }); sheen(F, 128, 92, 54, 132, { a: .1, at: .5 });
      [[0, 4], [116, 4], [146, 3], [182, 5]].forEach(function (p) { F.push(r(p[0], 90, p[1], 136, 'timber', { shade: grain('timberShade', .35, 'right', 1.4) })); F.push(r(p[0], 90, .8, 136, 'timberLite', { a: .6 })); });
      F.push(r(0, 90, 186, 3, 'timber', { shade: grain('timberShade', .3, 'down') })); F.push(r(0, 218, 186, 8, 'timber', { shade: grain('timberShade', .35, 'down') })); F.push(r(0, 218, 186, .8, 'timberLite'));
      F.push(r(122, 100, 1.4, 118, 'winFrame')); F.push(r(140.6, 100, 1.4, 118, 'winFrame')); F.push(r(122, 100, 20, 1.4, 'winFrame')); F.push(r(122, 152, 20, 1.2, 'winFrame'));
      // the sign: just the name, small, on the post
      F.push(r(189, 140, 3, 26, 'inBack', { a: .9 })); F.push({ t: 'text', text: 'nadoya', x: 190.5, y: 138, size: 3, weight: 600, font: FONT, fill: 'eaveShade', align: 'center', ls: .4 });
    } });
})();
