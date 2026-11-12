/* Scene — makuhari-messe. Needs /last-seen/last-seen.js and /last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, grain = K.grain, rnd = K.rnd;
  var make = K.make, pavement = K.pavement, contact = K.contact, cone = K.cone;
  /* ================= Makuhari Messe — Mihama, Chiba (Nov 12, 09:01) =================
     One hero: the red entrance canopy seen square on from the plaza. Three shallow silver vaults in a row, a red
     beam under them, and under that the red steel "trees": pairs of fat concrete columns with struts fanning up
     and out so that neighbouring fans meet in a row of big Vs. Behind it the long glazed hall, the doors at its
     foot; a low concrete ramp wall with a steel rail runs in from the left. Recomposed from his own photo of the
     front, not traced: the three vaults, the Vs and the grey drums are what make it read at stamp size. */
  var BEAM = 113, TIE = 160, CAP = 197, FOOT = 244;  // the beam under the vaults, the mid tie, the column tops, the plaza
  var TREES = [76, 200, 324], HALF = 62, COL = 17;    // a tree under each vault; half a vault; each column's distance from its tree's middle
  function lerp(a, b, t) { return a + (b - a) * t; }
  function vaultY(cx, x) { var u = (x - cx) / HALF; return 97 + 15 * u * u; }   // the roof line of one vault: a shallow arc, 97 at the crown, 112 in the valleys
  function folk(A, x, y, s, coat, legs, hair, bag) {  // a small standing person, far off
    A.push(r(x - 1.6 * s, y - 8.6 * s, 3.2 * s, 5.4 * s, coat, { r: [1.2 * s, 1.2 * s, .4, .4] }));
    A.push(r(x - 1.3 * s, y - 3.4 * s, 1.1 * s, 3.4 * s, legs)); A.push(r(x + .2 * s, y - 3.4 * s, 1.1 * s, 3.4 * s, legs));
    A.push(c(x, y - 9.9 * s, 1.35 * s, hair)); if (bag) A.push(r(x + 1.4 * s, y - 6.4 * s, 1.4 * s, 2.6 * s, bag));
  }

  make('makuhari-messe', { seed: 1112, seenAt: '2026-11-12T09:01:00+09:00',
    place: { en: 'Makuhari Messe', ja: '幕張メッセ' }, name: { en: 'Makuhari Messe', ja: '幕張メッセ' }, area: { en: 'Mihama, Chiba', ja: '千葉・美浜' },
    alt: 'Illustration of Makuhari Messe in Chiba: the red steel entrance canopy with its three silver vaults standing on fat grey concrete columns, the long glass exhibition hall behind it and a wide pale plaza in front.',
    palette: { sky: '#cfe0ea', skyShade: '#b4cddd', cloud: '#f4f6f5',
      red: '#cf3a2c', redShade: '#a52b22', redLight: '#e56552', redUnder: '#b3312a', redWeb: '#dc5546',
      roofTop: '#dfe3e5', roofShade: '#b9c0c4',
      col: '#8d9397', colShade: '#6c7277', colLight: '#adb3b6', colCap: '#d9dbda',
      hall: '#d5d3cd', hallShade: '#bcb9b2', hallGlass: '#a6b6bf', hallGlassShade: '#8c9da7', hallGrid: '#6f7c85', hallFrame: '#ecece7', hallRoof: '#c9cfd2', hallRoofShade: '#aeb6ba',
      doorDark: '#5c676e', signBlue: '#3f6fa8', signInk: '#f1f3f2', board: '#f3f2ee', boardShade: '#d8d6d0', boardInk: '#4b4d50',
      wall: '#c9c6bf', wallShade: '#aeaba3', wallTop: '#dcdad4', rail: '#a3a8ab', coneY: '#e0b53c',
      tree: '#7f9468', treeShade: '#627650',
      inHall: '#efe2c4', inHallShade: '#d9c69c', inLamp: '#ffe6b4',
      rfSuit: '#27303f', rfTee: '#efe6d2', rfPants: '#b9a37c', rfShoe: '#f1efea', rfSole: '#d8d5cd', rfShoeMark: '#c9c6bf', rfCrown: '#74859a', rfFront: '#c56a36', sunWash: '#ffc58e' },
    light: { noShadows: true,
      // morning (when he arrived): a clear, slightly cool sky, the canopy's shadow thrown forward and to the right
      morning: { set: { sky: '#cfe1ee', skyShade: '#b2cee1', red: '#cc3d30', redLight: '#e46a58' },
        add: { back: [poly([24, 244, 364, 244, 392, 256, 60, 256], 'shadow', { a: .1 })] } },
      midday: { add: { back: [poly([20, 244, 380, 244, 372, 252, 28, 252], 'shadow', { a: .1 })] } },
      // golden: the red goes warm and deep, the hall glass picks up the peach sky
      golden: { set: { sky: '#f3d9c3', skyShade: '#e6bb9e', cloud: '#f9e6d3', red: '#d2452c', redShade: '#a33122', redLight: '#f07e58', redUnder: '#b53a28', redWeb: '#e2603f',
          roofTop: '#f1ddc2', roofShade: '#cfb295', hallGlass: '#c5b3a3', hallGlassShade: '#a6927f', hallFrame: '#f3e3cd', hall: '#e2cdb6', hallShade: '#c8ad92', hallRoof: '#dcc6ad', hallRoofShade: '#bfa58b',
          col: '#9c9288', colShade: '#776c62', colLight: '#c4b6a6', wall: '#d6c3ad', wallShade: '#b89f88', wallTop: '#ead9c3' },
        add: { back: [poly([36, 244, 376, 244, 340, 256, 8, 256], 'shadow', { a: .12 })] } },
      // night: the canopy lit from below so the red still reads, the hall lit from inside, the plaza dark
      night: { set: { sky: '#111936', skyShade: '#0a0f25', cloud: '#1b2340', red: '#8c2a24', redShade: '#5d1b18', redLight: '#c94a3a', redUnder: '#6e211d', redWeb: '#a6382e',
          roofTop: '#5b6068', roofShade: '#3a3e46', col: '#3a3d44', colShade: '#25272d', colLight: '#6a6660', colCap: '#7a756c',
          hall: '#23242c', hallShade: '#191a21', hallGlass: '#6a5a44', hallGlassShade: '#4a3f31', hallGrid: '#2a2622', hallFrame: '#3b3a3c', hallRoof: '#262830', hallRoofShade: '#1b1d24',
          doorDark: '#2a2622', signBlue: '#3c5f8f', signInk: '#e9edf0', board: '#b9b3a6', boardShade: '#8d887c', boardInk: '#2f2e2d',
          wall: '#25272f', wallShade: '#1a1c23', wallTop: '#33353d', rail: '#5d6067', coneY: '#7d6a2c', tree: '#243026', treeShade: '#18211b' },
        add: {
          back: [r(60, 206, 280, 26, 'inLamp', { a: .14 })],
          over: [{ t: 'halo', x: 200, y: 150, rx: 150, ry: 50, n: 6, fill: 'haze', a: .028 }, { t: 'halo', x: 76, y: 190, rx: 44, ry: 40, n: 5, fill: 'pool', a: .03 }, { t: 'halo', x: 324, y: 190, rx: 44, ry: 40, n: 5, fill: 'pool', a: .03 },
                 { t: 'halo', x: 200, y: 222, rx: 120, ry: 22, n: 6, fill: 'pool', a: .04 }, { t: 'halo', x: 200, y: 250, rx: 170, ry: 16, n: 6, fill: 'pool', a: .03 }] } } },
    breathe: { x: 150, y: 206, w: 100, h: 26 },
    shoppers: [[136, 240, .34, 'coatB'], [246, 241, .35, 'coatA'], [300, 240, .34, 'coatD']].map(function (p, i) { return { keys: [[0, p[0]], [7 + i, p[0]], [12 + i, p[0] + (i % 2 ? 9 : -9)], [20 + i, p[0] + (i % 2 ? 9 : -9)], [26 + i, p[0]]], period: 26 + i, offset: i * 4.1,
      foot: p[1], s: p[2], coat: p[3], legs: i % 2 ? 'legsDark' : 'legsDenim', hair: i % 2 ? 'hairBrown' : 'hairDark', alpha: .9, shadow: false }; }),
    passersby: [{ start: 6, every: 24, dir: -1, speed: 27, foot: 287, s: 1.24, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', carry: 'backpack', carryC: 'coatD' }],
    // Raufan: a two-tone camp cap (slate-blue crown, burnt-orange front panel and brim), a dark suit jacket worn open over a cream T-shirt,
    // khaki trousers, white trainers, no bag
    sig: { emerge: { x: 200, foot0: 240, foot1: 266, s0: .5, s1: 1.24, dur: 1.3 },
      person: { coat: 'rfSuit', open: 'rfTee', long: -3.6, hat: false, bag: false, campcap: 'rfCrown', capFront: 'rfFront', capBrim: 'rfFront', legs: 'rfPants', hairDown: true, longHair: true, hair: 'hairDark',
        shoe: 'rfShoe', sole: 'rfSole', shoeMark: 'rfShoeMark' } },
    build: function (L, F, P) {
      var R = rnd(1112), i, x;
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .18, 'up', 1.7) }));
      // big soft clouds, low and wide, the way a bayside sky sits over the halls
      [[36, 50, 46, 9], [70, 44, 30, 8], [100, 54, 34, 7], [286, 34, 40, 9], [322, 28, 30, 9], [350, 38, 36, 8], [196, 22, 26, 5]].forEach(function (q) { L.push(e(q[0], q[1], q[2], q[3], 'cloud', { a: .85 })); });
      // far right: the big hall's arched silver roof rising behind everything
      var arc = [232, 152]; for (i = 0; i <= 12; i++) { x = 232 + i * 14; arc.push(x, 152 - 30 * Math.sin(Math.PI * Math.min(1, (x - 232) / 300) * .62)); } arc.push(400, 152);
      L.push(poly(arc, 'hallRoof', { shade: grain('hallRoofShade', .3, 'down', 1.5) }));
      for (i = 0; i < 8; i++) { x = 246 + i * 20; L.push(line([x, 152, x + 6, 152 - 30 * Math.sin(Math.PI * Math.min(1, (x + 6 - 232) / 300) * .62) + 1], 'hallRoofShade', .5, { a: .6 })); }
      // a little green at the right edge, where the plaza's trees are
      [[388, 214, 12], [398, 222, 10], [380, 224, 8]].forEach(function (q) { L.push(c(q[0], q[1], q[2], 'tree', { shade: grain('treeShade', .5, 'br', 1.3) })); });
      // the long glazed hall: a white frame, a fine grid of glass
      L.push(r(0, 176, 44, 60, 'hall', { shade: grain('hallShade', .3, 'down', 1.5) })); L.push(r(4, 186, 34, 6, 'hallGlassShade', { a: .7 })); L.push(r(4, 200, 34, 6, 'hallGlassShade', { a: .55 }));
      L.push(r(38, 148, 334, 88, 'hallGlass', { shade: grain('hallGlassShade', .35, 'down', 1.5) }));
      for (x = 44; x < 372; x += 8.2) L.push(r(x, 150, .55, 56, 'hallGrid', { a: .55 }));
      for (i = 0; i < 7; i++) L.push(r(38, 156 + i * 7.4, 334, .55, 'hallGrid', { a: .5 }));
      for (x = 38; x <= 372; x += 41.75) L.push(r(x - .9, 148, 1.8, 58, 'hallFrame', { a: .9 }));
      L.push(r(36, 146, 338, 3, 'hallFrame')); L.push(r(36, 204, 338, 2.4, 'hallFrame'));
      [[60, 152, 40, 30], [228, 152, 52, 26]].forEach(function (q) { L.push(poly([q[0], q[1], q[0] + q[2] * .4, q[1], q[0] + q[2] * .4 - 18, q[1] + q[3], q[0] - 18, q[1] + q[3]], 'glassLight', { a: .1 })); });
      // the doors at its foot: a lit hall behind glass, door frames, the blue signs over them
      L.push(r(38, 206, 334, 30, 'doorDark', { a: .55 }));
      L.push(r(60, 208, 280, 26, 'inHall', { shade: grain('inHallShade', .3, 'down', 1.6) }));
      [96, 150, 200, 250, 304].forEach(function (lx) { L.push(g(lx, 212, 8, 'inLamp', { d: .25, sy: .5 })); });
      for (x = 60; x <= 340; x += 14) L.push(r(x - .6, 208, 1.2, 26, 'hallGrid', { a: .8 }));
      L.push(r(60, 219, 280, .7, 'hallGrid', { a: .6 }));
      [[112, 22], [186, 28], [272, 22]].forEach(function (q) { L.push(r(q[0], 208.6, q[1], 4.4, 'signBlue', { r: .5 })); L.push(r(q[0] + 2, 210.2, q[1] * .5, .8, 'signInk')); L.push(r(q[0] + 2, 211.6, q[1] * .34, .6, 'signInk', { a: .8 })); });
      // the back of the plaza, and the people already there
      L.push(r(0, 234, 400, 10, 'stone', { shade: grain('stoneShade', .3, 'down') })); L.push(r(0, 234, 400, .6, 'joint', { a: .8 }));
      for (i = -9; i <= 9; i++) L.push(line([200 + i * 30, 234, 200 + i * 40, 244], 'joint', .4, { a: .7 }));
      [[292, 240.4, 'coatA', 'legsDark', 'hairDark'], [297, 240, 'coatC', 'legsDenim', 'hairBrown', 'bag'], [168, 239.6, 'coatD', 'legsDark', 'hairDark'], [226, 240.2, 'hoodie', 'legsDark', 'hairDark', 'bag'],
       [231, 239.8, 'coatB', 'legsDenim', 'hairDark'], [352, 240.4, 'coatA', 'legsDark', 'hairBrown'], [357, 240, 'coatD', 'legsDenim', 'hairDark']].forEach(function (q) { folk(L, q[0], q[1], 1, q[2], q[3], q[4], q[5]); });
      // the white notice board that stands between the columns
      L.push(r(238, 212, 26, 24, 'board', { r: .5, shade: grain('boardShade', .25, 'down') })); L.push(r(241, 216, 14, 1, 'boardInk', { a: .7 })); L.push(r(241, 219, 18, .7, 'boardInk', { a: .45 })); L.push(r(241, 221.4, 12, .7, 'boardInk', { a: .45 }));
      L.push(r(257, 214.4, 4.6, 4.6, 'boardInk', { a: .8 })); contact(L, 251, 236.4, 15, .12);
      pavement(L, F, { seed: 11120, stains: 2 });
      // the low concrete ramp wall running in from the left, a steel rail along its top, a yellow cone at its end
      L.push(poly([0, 231, 150, 235, 150, 243.6, 0, 243.6], 'wall', { shade: grain('wallShade', .35, 'down', 1.4) })); L.push(poly([0, 231, 150, 235, 150, 236.4, 0, 232.6], 'wallTop'));
      L.push(line([0, 226.6, 150, 231.2], 'rail', 1)); for (x = 12; x < 150; x += 23) L.push(r(x, 227 + x * .03, .9, 5, 'rail'));
      L.push(r(150, 235, 12, 8.6, 'wall', { shade: grain('wallShade', .3, 'right') })); L.push(r(150, 235, 12, 1.2, 'wallTop'));
      cone(L, 172, 242.4, .7); L[L.length - 2].fill = 'coneY'; L[L.length - 3].fill = 'coneY';

      // ---- the hero: the red canopy (shopfront layer, so it stands in front of the hall) ----
      // the vaults: red undersides webbed with lighter steel, a silver roof edge on top
      TREES.forEach(function (cx) {
        var top = [], n = 16, k;
        for (k = 0; k <= n; k++) { var vx = cx - HALF + k * (2 * HALF / n); top.push(vx, vaultY(cx, vx)); }
        F.push(poly(top.concat([cx + HALF, BEAM + 1, cx - HALF, BEAM + 1]), 'redUnder', { shade: grain('redShade', .4, 'up', 1.4) }));
        for (k = 1; k < 8; k++) { var a = cx - HALF + k * (2 * HALF / 8); F.push(line([a, BEAM, a + (k % 2 ? 7.75 : -7.75), vaultY(cx, a + (k % 2 ? 7.75 : -7.75)) + 1], 'redWeb', .5, { a: .7 })); F.push(line([a, BEAM, a + (k % 2 ? -7.75 : 7.75), vaultY(cx, a + (k % 2 ? -7.75 : 7.75)) + 1], 'redWeb', .5, { a: .45 })); }
        for (k = 0; k < n; k++) F.push(line([top[k * 2], top[k * 2 + 1] - .6, top[k * 2 + 2], top[k * 2 + 3] - .6], 'roofTop', 2.2));
        for (k = 0; k < n; k++) F.push(line([top[k * 2], top[k * 2 + 1] + .9, top[k * 2 + 2], top[k * 2 + 3] + .9], 'roofShade', .6, { a: .8 }));
      });
      // the beam under them, running out past both ends
      F.push(r(6, BEAM, 388, 4.6, 'red', { shade: grain('redShade', .35, 'down') })); F.push(r(6, BEAM, 388, 1, 'redLight', { a: .8 }));
      // the mid tie that links the trees, then each tree: two drums, four struts fanning to the beam, cross-bracing between them
      F.push(r(30, TIE - .8, 340, 1.8, 'redShade'));
      TREES.forEach(function (cx) {
        var l = cx - COL, rr = cx + COL;
        // thin bracing first, so the heavy struts sit on top of it
        [[l, cx - 58, cx - 20], [rr, cx + 20, cx + 58]].forEach(function (q) {
          var m0 = lerp(q[0], q[1], (CAP - TIE) / (CAP - BEAM)), m1 = lerp(q[0], q[2], (CAP - TIE) / (CAP - BEAM));
          F.push(line([m0, TIE, q[2], BEAM + 4], 'redShade', 1)); F.push(line([m1, TIE, q[1], BEAM + 4], 'redShade', 1)); });
        F.push(line([l, CAP, cx + 20, BEAM + 4], 'redShade', 1.1, { a: .85 })); F.push(line([rr, CAP, cx - 20, BEAM + 4], 'redShade', 1.1, { a: .85 }));
        [[l, cx - 58], [l, cx - 20], [rr, cx + 20], [rr, cx + 58]].forEach(function (q, qi) {
          F.push(line([q[0], CAP, q[1], BEAM + 3], 'red', 3)); F.push(line([q[0] - .7, CAP, q[1] - .7, BEAM + 3], 'redLight', .7, { a: qi % 2 ? .5 : .75 })); });
        F.push(r(l - 3, TIE - 1.6, 2 * COL + 6, 3, 'red')); F.push(r(l - 3, TIE - 1.6, 2 * COL + 6, .8, 'redLight', { a: .7 }));
        [l, rr].forEach(function (px) {
          contact(F, px, FOOT, 9, .16);
          F.push(r(px - 6.5, CAP + 2, 13, FOOT - CAP - 2, 'col', { r: [1, 1, .6, .6], shade: [grain('colShade', .5, 'right', 1.3), grain('colShade', .15, 'down')] }));
          F.push(r(px - 5.3, CAP + 3, 1.8, FOOT - CAP - 4, 'colLight', { a: .55 }));
          F.push(r(px - 6.5, CAP + 14, 13, .6, 'colShade', { a: .5 })); F.push(r(px - 6.5, CAP + 29, 13, .6, 'colShade', { a: .5 }));
          F.push(e(px, CAP + 2, 6.5, 1.5, 'colCap')); F.push(r(px - 3.4, CAP - 2.6, 6.8, 4, 'redShade', { r: .6 }));
        });
      });
    } });
})();
