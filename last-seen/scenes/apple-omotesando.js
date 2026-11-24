/* Scene — apple-omotesando. Needs /last-seen/last-seen.js and /last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, grain = K.grain, rnd = K.rnd, mix = K.mix;
  var make = K.make, pavement = K.pavement, contact = K.contact, sheen = K.sheen, crown = K.crown, leaves = K.leaves;
  /* ================= Apple Omotesando — Omotesando (Nov 21, 13:10), alone, a clear late-autumn day =================
     seen from across the avenue: the store is one tall glass box under a thin steel roof, the whole front a single
     wall of full-height panes with the white Apple logo floating on it; through the glass a pale stone room, the video
     wall at the back, oak tables with people at them, and on the left the glass spiral stair going down to the lower
     floor. Stone and brick neighbours on either side, taller blocks behind. Omotesando's zelkovas stand along both
     kerbs in their November russet and amber, a low guard rail between them, leaves on the pavement. After dark the
     trees carry the avenue's winter lights. */
  var BX0 = 62, BX1 = 338, TOP = 86, BASE = 212, BW = BX1 - BX0, BH = BASE - TOP;
  var APPLE = [[0, -.28], [-.12, -.36], [-.3, -.38], [-.44, -.3], [-.5, -.12], [-.5, .1], [-.43, .3], [-.31, .45], [-.19, .5], [-.08, .47], [0, .45], [.08, .47],
    [.19, .5], [.31, .45], [.41, .32], [.47, .21], [.39, .15], [.33, .04], [.33, -.08], [.38, -.17], [.45, -.23], [.37, -.33], [.24, -.38], [.11, -.36]];
  function apple(A, x, y, s, fill, o) {
    var pts = []; APPLE.forEach(function (p) { pts.push(x + p[0] * s, y + p[1] * s); });
    A.push(poly(pts, fill, o)); A.push(e(x + .1 * s, y - .52 * s, .17 * s, .085 * s, fill, Object.assign({ rot: -.85 }, o)));
  }
  // Raufan: a brown cap over shoulder-length hair, a sage-green jacket worn open over a brown marled sweater,
  // khaki trousers, white Asics, a white tote with a green mark
  var PEOPLE = { rfCap: '#5b3d2a', rfJacket: '#6e7668', rfSweater: '#7b5f3d', rfPants: '#c0aa80', rfShoe: '#eceae4', rfSole: '#f7f6f2', rfShoeMark: '#a7abb0', rfTote: '#f0eee6', rfToteMark: '#3f7d55' };
  function tonePeople(t, k) { var o = {}; Object.keys(PEOPLE).forEach(function (n) { o[n] = mix(PEOPLE[n], t, k); }); return o; }
  // the far kerb's zelkovas (x of each trunk) and the crown rounds of every tree, kept so the night lights can sit in them
  var FAR = [24, 118, 286];
  function crownPts(x, top, R) {
    var pts = [], i;
    for (i = 0; i < 9; i++) pts.push([x - 34 + i * 8.5 + (R() - .5) * 6, top + 22 + Math.sin(i * .9) * 10 + (R() - .5) * 14, 11 + R() * 7]);
    for (i = 0; i < 5; i++) pts.push([x - 20 + i * 10 + (R() - .5) * 5, top + 2 + R() * 12, 10 + R() * 6]);
    return pts;
  }
  var CR = rnd(2111), CROWNS = FAR.map(function (x) { return crownPts(x, 14, CR); });
  var NEAR = [[330, 26, 16], [352, 14, 19], [374, 8, 15], [344, 46, 13], [366, 40, 13], [318, 42, 10], [336, 2, 13], [356, 58, 9], [390, 54, 9]];
  var LIGHTS = [], LR = rnd(77);
  CROWNS.concat([NEAR]).forEach(function (pts) { pts.forEach(function (p) { for (var i = 0; i < 9; i++) { var a = LR() * 6.283, d = Math.sqrt(LR()) * p[2];
    LIGHTS.push(c(p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d, .55 + LR() * .35, 'lamp', { a: .75 + LR() * .25 })); } }); });

  make('apple-omotesando', { seed: 1121, seenAt: '2026-11-21T13:10:00+09:00',
    place: { en: 'Apple Omotesando', ja: 'Apple 表参道' }, name: { en: 'Apple Omotesando', ja: 'Apple 表参道' }, area: { en: 'Omotesando, Tokyo', ja: '東京・表参道' },
    alt: 'Illustration of Apple Omotesando on a clear autumn day: a tall glass box under a thin steel roof with the white Apple logo on its glass, a pale stone room with a video wall, oak tables and a glass spiral stair inside, russet zelkova trees along the avenue, and Raufan in a brown cap and a green jacket over a brown sweater, carrying a white tote.',
    palette: Object.assign({ sky: '#7fb2e0', skyShade: '#b3d3ee', sunWash: '#fff1d2', cloudLite: '#f6f9fc',
      far: '#cfc8bb', farShade: '#b6ad9d', far2: '#b9c2c8', far2Shade: '#9faab2', farWin: '#7d8d9b', winLit: '#7d8d9b',
      nbL: '#ddd6c8', nbLShade: '#c2b9a8', nbLLine: '#b3aa98', nbWin: '#6f8191', nbWin2: '#8498a8', nbShop: '#4b5560', nbShopLite: '#70808c', nbAwning: '#2f3338',
      nbR: '#a9785f', nbRShade: '#8d624c', nbRLine: '#946a54', nbRTrim: '#e4ddd0',
      roof: '#d3d6d8', roofShade: '#a3a8ac', roofLite: '#f1f3f3', alu: '#c6cacc', aluShade: '#9a9fa3', steel: '#7d8287', steelWall: '#b9bec1', steelWallShade: '#9aa0a4',
      glassTint: '#6f8a9c', logo: '#fbfbfa', reflTree: '#c78a4a',
      inWall: '#f1ece2', inWallShade: '#dad2c2', inSide: '#e3ddd0', inSideShade: '#c9c1b0', inCeil: '#f7f4ec', inCeilD: '#ddd6c6', inLamp: '#fff8e6', inFloor: '#d8d2c6',
      inWood: '#c9a274', inWoodD: '#a5804f', inDevice: '#3b3d40', inHair: '#2e2926', inHair2: '#5c4638', inShirt: '#3d4a5c', inShirt2: '#b9b0a2', inShirt3: '#35618f',
      inScreen: '#2b3552', inScreenA: '#e2574c', inScreenB: '#f0b64a', inScreenC: '#4f8fd8', inScreenD: '#6cc08f', inScreenE: '#f6f0e2',
      inGlass: '#cfe0e6', inStair: '#eef1f1', inStairD: '#b8bfc2', inWell: '#b9b2a4',
      paveFar: '#cdc8be', kerbFar: '#b7b2a8', road: '#8f9094', roadShade: '#7c7d82', roadLite: '#a3a4a8', laneW: '#eeede8',
      rail: '#6f7b70', railShade: '#566157', pit: '#7d705e',
      treeA: '#c98a45', treeB: '#b56f38', treeC: '#d9a655', treeShade: '#8a5530', trunk: '#6a5848', trunkShade: '#4e4034', leafA: '#c98a45', leafB: '#a8683a' }, PEOPLE),
    light: { shadowAt: [[20, 70], [250, 80]],
      morning: { set: { sky: '#a9cfee', skyShade: '#d2e5f3' },
        add: { back: [r(0, 0, 400, 86, 'sunWash', { a: .14 }), poly([BX0, TOP, 190, TOP, 110, BASE, BX0, BASE], 'shadow', { a: .06 })] } },
      midday: { add: { back: [r(BX0 - 6, TOP, BW + 12, 3, 'shadow', { a: .2 })], front: [e(200, 247, 70, 3, 'shadow', { a: .12 })] } },
      golden: { set: { sky: '#eac29c', skyShade: '#f4d8b8', roof: '#e6d2ba', roofLite: '#fff0da', steelWall: '#d9c3a8', treeA: '#d98a3c', treeB: '#c36f30', treeC: '#eaa94c' },
        add: { back: [r(0, 0, 400, 86, 'sunWash', { a: .26 }), poly([BX0, TOP, BX1, TOP, BX1, 130, BX0, 170], 'sunWash', { a: .1 }), r(BX0, TOP, 1.4, BH, 'rim', { a: .6 })] } },
      // after dark: the box glows, and the zelkovas carry the avenue's winter lights
      night: { set: Object.assign({ sky: '#0f1529', skyShade: '#0b1021', far: '#23252f', farShade: '#1a1c25', far2: '#1d2230', far2Shade: '#161a26', farWin: '#e2bf82', winLit: '#e8c27f',
          nbWin: '#1a2030', nbWin2: '#e6c283', nbShop: '#d9b77c', nbShopLite: '#f1d8a6', logo: '#ffffff', glassTint: '#3a2a1a', reflTree: '#f8ecd4',
          roof: '#5a5c60', roofShade: '#34363a', roofLite: '#9c9486', steelWall: '#55575b', steelWallShade: '#3a3c40', alu: '#6c6c6e', aluShade: '#3a3a3e',
          inWall: '#f8ecd4', inWallShade: '#e2cfab', inSide: '#eedfc2', inCeil: '#fff3da', inFloor: '#e3cfa8',
          treeA: '#4a3524', treeB: '#3d2b1e', treeC: '#57402a', treeShade: '#22170f', trunk: '#241c16', trunkShade: '#15100c',
          road: '#1a1c23', roadShade: '#14161c', roadLite: '#252730', laneW: '#55565c', paveFar: '#2a2a30', kerbFar: '#1f2027', rail: '#1e2420', railShade: '#141815' }, tonePeople('#0d1124', .6)),
        add: { front: LIGHTS,
          over: [{ t: 'halo', x: 200, y: 150, rx: 150, ry: 70, n: 6, fill: 'haze', a: .02 }, { t: 'halo', x: 200, y: 218, rx: 160, ry: 10, n: 6, fill: 'pool', a: .08 },
            { t: 'halo', x: 200, y: 252, rx: 150, ry: 14, n: 6, fill: 'pool', a: .04 }, { t: 'halo', x: 118, y: 40, rx: 44, ry: 30, n: 5, fill: 'haze', a: .03 },
            { t: 'halo', x: 286, y: 40, rx: 44, ry: 30, n: 5, fill: 'haze', a: .03 }, { t: 'halo', x: 356, y: 30, rx: 44, ry: 34, n: 5, fill: 'haze', a: .03 }] } } },
    breathe: { x: 150, y: 150, w: 100, h: 60, c: 'breathe', a: .04 },
    // people along the store's pavement
    shoppers: [{ keys: [[0, 20], [10, 128], [13, 128], [23, 20]], period: 23, foot: 219, s: .5, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', alpha: .95, shadow: false },
               { keys: [[0, 330], [8, 236], [11, 236], [19, 330]], period: 19, offset: 6, foot: 219.5, s: .5, coat: 'coatA', legs: 'legsDenim', hair: 'hairBrown', alpha: .95, shadow: false }],
    passersby: [{ start: 11, every: 24, dir: -1, speed: 23, foot: 286, s: 1.24, coat: 'coatC', legs: 'legsDark', hair: 'hairDark', carry: 'backpack', carryC: 'coatB' },
                { start: 16, every: 29, dir: 1, speed: 21, foot: 278, s: 1.14, coat: 'coatA', long: 5, legs: 'legsDenim', hair: 'hairBrown', longHair: true, carry: 'tote', carryC: 'bagMark' }],
    stamp: { x0: 72, x1: 328, y0: 30, y1: 272 },
    sig: { emerge: { x: 200, foot0: 224, foot1: 264, s0: .56, s1: 1.24, dur: 1.3 },
      person: { coat: 'rfJacket', open: 'rfSweater', long: -2.5, hat: false, ballcap: 'rfCap', legs: 'rfPants', hairDown: true, longHair: true, hair: 'hairDark',
        shoe: 'rfShoe', sole: 'rfSole', shoeMark: 'rfShoeMark', bag: 'rfTote', bagMark: 'rfToteMark' } },
    build: function (L, F, P) {
      var R = rnd(1121), i, x, y;
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .25, 'down', 1.6) }));
      L.push(e(70, 22, 26, 3, 'cloudLite', { a: .6 })); L.push(e(92, 26, 16, 2.2, 'cloudLite', { a: .5 })); L.push(e(250, 12, 20, 2.4, 'cloudLite', { a: .5 }));
      // taller blocks behind the box
      L.push(r(92, 30, 74, 60, 'far', { shade: grain('farShade', .3, 'down') }));
      for (y = 36; y < 82; y += 9) for (x = 97; x < 162; x += 9) L.push(r(x, y, 6, 5, R() > .82 ? 'winLit' : 'farWin', { a: .85 }));
      L.push(r(204, 16, 92, 74, 'far2', { shade: grain('far2Shade', .3, 'down') })); L.push(r(204, 16, 92, 1.4, 'roofLite', { a: .6 }));
      for (y = 22; y < 84; y += 7) L.push(r(204, y, 92, .6, 'far2Shade', { a: .8 }));
      for (x = 212; x < 296; x += 12) L.push(r(x, 16, .6, 74, 'far2Shade', { a: .6 }));
      for (i = 0; i < 9; i++) L.push(r(206 + Math.floor(R() * 7) * 12 + 1, 23 + Math.floor(R() * 8) * 7, 10, 5.4, 'winLit', { a: .35 }));
      // the left neighbour: pale stone, a grid of windows, a dark shopfront under a flat canopy
      L.push(r(0, 34, BX0 - 4, 178, 'nbL', { shade: grain('nbLShade', .3, 'right', 1.4) })); L.push(r(0, 34, BX0 - 4, 1.4, 'roofLite', { a: .7 }));
      for (y = 44; y < 150; y += 22) { L.push(r(0, y + 16, BX0 - 4, .7, 'nbLLine', { a: .7 }));
        for (x = 6; x < 50; x += 17) { L.push(r(x, y, 11, 13, R() > .7 ? 'nbWin2' : 'nbWin', { r: .6 })); L.push(r(x, y, 11, 1.2, 'shadow', { a: .2 })); } }
      L.push(r(4, 166, 50, 46, 'nbShop', { shade: grain('nbShopLite', .3, 'up') })); L.push(r(28.6, 166, .8, 46, 'nbLShade'));
      L.push(r(0, 160, BX0 - 4, 5, 'nbAwning')); L.push(r(0, 165, BX0 - 4, 1.4, 'shadow', { a: .2 }));
      // the right neighbour: brick with pale trim
      L.push(r(BX1 + 4, 50, 400 - BX1 - 4, 162, 'nbR', { shade: grain('nbRShade', .35, 'right', 1.4) })); L.push(r(BX1 + 4, 50, 58, 2.4, 'nbRTrim'));
      for (y = 58; y < 160; y += 5) L.push(r(BX1 + 4, y, 58, .5, 'nbRLine', { a: .5 }));
      for (y = 62; y < 150; y += 24) for (x = BX1 + 12; x < 396; x += 18) { L.push(r(x, y, 11, 15, R() > .75 ? 'nbWin2' : 'nbWin', { r: .6 })); L.push(r(x - 1, y + 15, 13, 1.4, 'nbRTrim')); }
      L.push(r(BX1 + 10, 168, 46, 44, 'nbShop', { shade: grain('nbShopLite', .3, 'up') })); L.push(r(BX1 + 4, 162, 58, 5, 'nbRTrim', { shade: grain('nbLShade', .3, 'down') }));

      // ---- the store: a pale stone room seen through one wall of glass ----
      L.push(r(BX0 + 2, TOP + 2, BW - 4, BH - 2, 'inWall', { shade: grain('inWallShade', .25, 'down', 1.6) }));
      for (x = BX0 + 44; x < BX1 - 30; x += 38) L.push(r(x, TOP + 12, .6, BH - 20, 'inWallShade', { a: .45 }));   // the stone's joints
      // side walls turning back, the ceiling with its lines of light
      L.push(poly([BX0 + 2, TOP + 2, BX0 + 20, TOP + 12, BX0 + 20, 204, BX0 + 2, BASE], 'inSide', { shade: grain('inSideShade', .35, 'right') }));
      L.push(poly([BX1 - 2, TOP + 2, BX1 - 20, TOP + 12, BX1 - 20, 204, BX1 - 2, BASE], 'inSide', { shade: grain('inSideShade', .35, 'left') }));
      L.push(poly([BX0 + 2, TOP + 2, BX1 - 2, TOP + 2, BX1 - 20, TOP + 12, BX0 + 20, TOP + 12], 'inCeil', { shade: grain('inCeilD', .3, 'down') }));
      for (y = TOP + 4.4; y < TOP + 11; y += 3) L.push(r(BX0 + 10 + (y - TOP) * 1.2, y, BW - 20 - (y - TOP) * 2.4, .8, 'inLamp', { a: .9 }));
      // the video wall at the back
      L.push(r(142, 130, 116, 52, 'inScreen', { r: .8 })); L.push(r(142, 130, 116, 52, 'inScreenC', { a: .2, shade: grain('inScreenB', .3, 'down') }));
      [['inScreenA', 162, 148, 9], ['inScreenB', 186, 160, 12], ['inScreenC', 214, 146, 9], ['inScreenD', 172, 172, 6], ['inScreenA', 236, 168, 7], ['inScreenE', 244, 144, 5], ['inScreenE', 200, 138, 3.6]].forEach(function (b) { L.push(c(b[1], b[2], b[3], b[0], { a: .92 })); });
      L.push(r(142, 181, 116, 1.2, 'inWallShade'));
      // the floor, running back
      L.push(poly([BX0 + 2, BASE, BX0 + 20, 204, BX1 - 20, 204, BX1 - 2, BASE], 'inFloor', { shade: grain('inWallShade', .3, 'up') }));
      // the glass spiral stair on the left: a round well, a glass drum round it, treads winding down
      L.push(e(96, 205, 17, 3.4, 'inWell')); L.push(e(96, 205.4, 13, 2.4, 'shadow', { a: .22 }));
      for (i = 0; i < 7; i++) L.push(r(84 + i * 3.2, 190 + i * 2.1, 10 - i * .5, 1, i % 2 ? 'inStairD' : 'inStair'));
      L.push(r(79, 184, 34, 21, 'inGlass', { a: .3, r: [0, 0, 3, 3] })); L.push(e(96, 184, 17, 3, 'inGlass', { a: .45 })); L.push(e(96, 184, 17, 3, 'inStair', { a: .35 }));
      L.push(r(79, 184, .7, 21, 'inStair', { a: .8 })); L.push(r(112.3, 184, .7, 21, 'inStair', { a: .8 })); L.push(r(95.6, 187, .7, 18, 'inStair', { a: .5 }));
      // oak tables with devices, people at them and at the screen
      [122, 150, 226, 262, 296].forEach(function (tx, k) { var tw = k === 4 ? 20 : 24;
        L.push(r(tx, 197, tw, 1.8, 'inWood')); L.push(r(tx + 1.4, 198.8, 1, 8, 'inWoodD')); L.push(r(tx + tw - 2.4, 198.8, 1, 8, 'inWoodD'));
        L.push(r(tx + 3, 196, 3.4, .9, 'inDevice')); L.push(r(tx + 10, 196, 3.4, .9, 'inDevice')); L.push(r(tx + 17, 195.6, 2.4, 1.3, 'inDevice')); });
      for (x = 120 + R() * 6; x < 318; x += 9 + R() * 10) { if (x > 178 && x < 222) continue; var ph = 9 + R() * 2, sk = R();
        L.push(c(x, 197 - ph - 1.5, 1.45, R() > .5 ? 'inHair' : 'inHair2')); L.push(r(x - 1.8, 197 - ph, 3.6, ph, sk > .66 ? 'inShirt3' : sk > .33 ? 'inShirt' : 'inShirt2', { r: [1.2, 1.2, 0, 0] })); }
      for (x = 156; x < 250; x += 13 + R() * 9) { L.push(c(x, 186.4, 1.2, 'inHair')); L.push(r(x - 1.5, 187.6, 3, 8, R() > .5 ? 'inShirt' : 'inShirt2', { r: [1, 1, 0, 0] })); }
      // the glass itself: a cool tint, the trees across the avenue held in its upper half, a long sheen, the joints between panes
      L.push(r(BX0, TOP, BW, BH, 'glassTint', { a: .13 }));
      [[96, 104, 22, 9], [150, 98, 18, 7], [246, 100, 24, 8], [304, 108, 20, 9], [70, 122, 10, 6], [326, 126, 9, 6]].forEach(function (b) { L.push(e(b[0], b[1], b[2], b[3], 'reflTree', { a: .075 })); });
      sheen(L, BX0, TOP, BW, BH, { a: .13, at: .08, street: true, streetA: .07 });
      for (i = 1; i < 12; i++) L.push(r(BX0 + i * BW / 12 - .3, TOP, .6, BH, 'alu', { a: .55 }));
      // the doors in the middle pane, steel pulls; the logo floating above them
      L.push(r(188, 178, 24, .8, 'alu', { a: .85 })); L.push(r(199.7, 178, .6, BASE - 178, 'alu', { a: .8 }));
      L.push(r(196.6, 190, .8, 11, 'steel')); L.push(r(202.6, 190, .8, 11, 'steel'));
      L.push(e(200, 111, 14, 14, 'glassTint', { a: .16 })); apple(L, 200, 111, 21, 'logo', { a: .98 });
      // the box's steel: side walls and the thin roof, a shadow line under it
      F.push(r(BX0 - 3, TOP, 5, BH, 'steelWall', { shade: grain('steelWallShade', .35, 'right') })); F.push(r(BX1 - 2, TOP, 5, BH, 'steelWall', { shade: grain('steelWallShade', .35, 'right') }));
      F.push(r(BX0 - 8, TOP - 6, BW + 16, 6, 'roof', { shade: grain('roofShade', .3, 'down') })); F.push(r(BX0 - 8, TOP - 6, BW + 16, 1, 'roofLite')); F.push(r(BX0 - 8, TOP - .8, BW + 16, .8, 'roofShade'));
      F.push(r(BX0 - 3, BASE - 1.4, BW + 6, 1.4, 'aluShade'));

      // the store's pavement, the kerb, the avenue
      L.push(r(0, 212, 400, 10, 'paveFar', { shade: grain('stoneShade', .3, 'down') })); L.push(r(BX0 - 3, 212, BW + 6, 1.4, 'shadow', { a: .12 }));
      for (x = 10; x < 400; x += 20) L.push(r(x, 212, .6, 10, 'stoneShade', { a: .45 }));
      L.push(r(0, 221, 400, 1.8, 'kerbFar'));
      L.push(r(0, 222.8, 400, 21.2, 'road', { shade: [grain('roadShade', .35, 'down', 1.3), grain('roadLite', .12, 'up')] }));
      for (x = 14; x < 400; x += 52) L.push(r(x, 232.4, 26, 1.3, 'laneW', { a: .75 }));
      // the far kerb: a low guard rail (open in front of the doors) and the zelkovas
      [[0, 176], [224, 400]].forEach(function (s) { F.push(r(s[0], 214.6, s[1] - s[0], .9, 'rail')); F.push(r(s[0], 217.8, s[1] - s[0], .7, 'rail'));
        for (x = s[0] + 4; x < s[1]; x += 24) F.push(r(x, 213.6, 1.3, 7.6, 'rail', { shade: grain('railShade', .4, 'right') })); });
      FAR.forEach(function (tx, k) {
        F.push(r(tx - 7, 220.2, 14, 1.3, 'pit')); contact(F, tx, 221, 7, .18);
        F.push(poly([tx - 2.8, 221, tx + 2.8, 221, tx + 1.7, 120, tx + 1.3, 70, tx - 1.3, 70, tx - 1.7, 120], 'trunk', { shade: grain('trunkShade', .5, 'right') }));
        F.push(line([tx, 96, tx - 14, 64, tx - 24, 44], 'trunk', 2)); F.push(line([tx, 90, tx + 13, 60, tx + 22, 40], 'trunk', 1.9));
        F.push(line([tx, 76, tx - 5, 48, tx - 8, 30], 'trunk', 1.5)); F.push(line([tx, 72, tx + 6, 44, tx + 8, 26], 'trunk', 1.4));
        crown(F, CROWNS[k], ['treeA', 'treeB', 'treeC'], 'treeShade');
      });
      pavement(L, F, { seed: 1121, tactile: 150 });
      leaves(L, 6, 394, 249, 296, 46, 21, ['leafA', 'leafB']); leaves(L, 0, 400, 213, 220, 16, 5, ['leafA', 'leafB']);
      // a zelkova on our side of the avenue, its russet crown over the corner and a soft shadow under it
      P.push(e(372, 263, 34, 4, 'shadow', { a: .15 }));
      P.push(poly([368, 264, 378, 264, 377, 120, 374, 60, 371, 120], 'trunk', { shade: grain('trunkShade', .5, 'right') }));
      P.push(line([374, 120, 352, 70, 336, 40], 'trunk', 3)); P.push(line([375, 100, 396, 56], 'trunk', 2.6)); P.push(line([362, 92, 346, 76], 'trunk', 1.6));
      crown(P, NEAR, ['treeA', 'treeC', 'treeB'], 'treeShade');
      for (i = 0; i < 12; i++) P.push(e(310 + R() * 90, 250 + R() * 40, 3 + R() * 5, 1 + R() * .8, 'shadow', { a: .07 }));   // dappled shade
    } });
})();
