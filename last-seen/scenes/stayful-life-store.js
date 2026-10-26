/* Scene — stayful-life-store. Needs /timeline/lib/last-seen.js and /timeline/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, pavement = K.pavement, contact = K.contact, sheen = K.sheen, ac = K.ac, pipe = K.pipe, plant = K.plant;
  // the shop's mark on the glass: a man sunk in a deep armchair, cap on, legs crossed, reading — white line art
  function chairMan(A, x, y, s) {   // x, y = the chair's front foot
    var X = function (v) { return x + v * s; }, Y = function (v) { return y + v * s; }, L = function (pts, w) { A.push(line(pts.map(function (v, i) { return i % 2 ? Y(v) : X(v); }), 'decal', (w || .9) * s)); };
    L([-14, 0, -14, -6]); L([10, 0, 10, -6]);                                                     // the chair's short legs
    L([-17, -6, 12, -6, 12, -13]);                                                                 // the seat, the front of the arm
    L([-17, -6, -19, -20, -18.4, -29, -16, -32.6, -13, -33.6]);                                    // the tall wingback, rounded at the top
    L([5, -13, 6.4, -19.4, 10.6, -19.6, 12, -13]);                                                 // the rolled arm
    A.push(ring(X(-6.4), Y(-27.4), 3 * s, 'decal', .8 * s));                                        // the head, left open
    A.push(poly([X(-9.6), Y(-28.6), X(-8.6), Y(-31.6), X(-5.4), Y(-32.6), X(-3), Y(-31), X(-2.4), Y(-29.6), X(1.4), Y(-29.4), X(1), Y(-28.4), X(-3), Y(-28.4)], 'decal'));   // the cap, peak forward
    L([-8.4, -24.4, -6, -14.6]); L([-4, -24.4, -1, -16]);                                          // the body, sinking back into the chair
    L([-4.4, -22.4, 0, -18, 3.6, -21.6]); A.push(r(X(3), Y(-24.6), 2.6 * s, 4 * s, 'decal', { r: .4 }));   // an arm up, a phone in hand
    L([-6, -14.6, 6, -15.6, 15, -13.4]); L([-1, -16, 7, -17.2, 15, -13.4]);                        // thighs up over the arm
    L([15, -13.4, 21, -4.6]); L([11, -14.6, 15, -1]);                                              // shins, legs crossed
    A.push(poly([X(20), Y(-5.4), X(25), Y(-4.2), X(24.6), Y(-2.8), X(20.4), Y(-3.4)], 'decal')); A.push(poly([X(14), Y(-1.4), X(19), Y(-.8), X(18.8), Y(.6), X(14.2), Y(.4)], 'decal'));   // shoes
  }
  // an olive in a pot: a few twisting stems, loose sprays of narrow silver-green leaves, never a ball
  function olive(A, x, foot, s, seed) {
    var R = rnd(seed); contact(A, x, foot, 14 * s, .2);
    A.push(poly([x - 11 * s, foot - 20 * s, x + 11 * s, foot - 20 * s, x + 9 * s, foot - 2 * s, x + 6 * s, foot, x - 6 * s, foot, x - 9 * s, foot - 2 * s], 'pot', { shade: [grain('potShade', .45, 'right', 1.3), grain('potShade', .2, 'down')] }));
    A.push(r(x - 11.6 * s, foot - 21.4 * s, 23.2 * s, 2.2 * s, 'pot', { r: 1 })); A.push(r(x - 10 * s, foot - 20 * s, .9 * s, 16 * s, 'glassLight', { a: .5 }));
    A.push(e(x, foot - 20.4 * s, 10 * s, 1.4 * s, 'soil'));
    var tips = [];
    [[-1, 0, -18, -40, -26, -62], [1, 2, 14, -46, 8, -74], [0, -1, 2, -36, -6, -58], [1, 1, 22, -30, 30, -52]].forEach(function (b) {
      var x0 = x + b[1] * s, y0 = foot - 20 * s, x1 = x + b[2] * s, y1 = foot + b[3] * s, x2 = x + b[4] * s, y2 = foot + b[5] * s;
      A.push(line([x0, y0, (x0 + x1) / 2 + b[0] * 3 * s, (y0 + y1) / 2, x1, y1, x2, y2], 'oliveBark', 1.4 * s)); tips.push([x1, y1], [x2, y2], [(x1 + x2) / 2 + 6 * s, (y1 + y2) / 2]);
      A.push(line([x1, y1, x1 + (R() - .5) * 20 * s, y1 - 10 * s], 'oliveBark', .7 * s)); tips.push([x1 + (R() - .5) * 20 * s, y1 - 10 * s]); });
    tips.forEach(function (t) { for (var i = 0; i < 16; i++) { var a = R() * Math.PI * 2, d = R() * 10 * s;
      A.push(e(t[0] + Math.cos(a) * d, t[1] + Math.sin(a) * d * .8, (1.6 + R() * 1.2) * s, .6 * s, R() > .55 ? 'olive' : (R() > .4 ? 'olive2' : 'oliveShade'), { rot: R() * 3 })); } });
  }
  /* ================= STAYFUL LIFE STORE — Nakacho, Musashino (Oct 3, 17:10) =================
     an old concrete building re-faced in warm beige: weathered render above with the line of an old
     roof and a hung AC unit, a white rainwater pipe, a deep concrete hood, then a beige-painted frame
     of glass with a row of transoms, a solid beige door, the man-in-an-armchair mark and the name in
     white, a warm room of plants and bulbs behind the reflections, an olive in a white pot, an A-board */
  make('stayful-life-store', { seed: 904, seenAt: '2026-10-03T17:10:00+09:00',
    place: { en: 'STAYFUL LIFE STORE', ja: 'ステイフル ライフ ストア' }, name: { en: 'STAYFUL LIFE STORE', ja: 'ステイフル ライフ ストア' }, area: { en: 'Nakacho, Musashino', ja: '武蔵野・中町' },
    alt: 'Illustration of STAYFUL LIFE STORE in Musashino: a weathered render wall over a beige-framed glass shopfront with a solid beige door, a white line drawing of a man reading in an armchair on the glass, a warm room of plants behind, an olive tree in a white pot and an A-board.',
    palette: { sky: '#e2e6e6', skyShade: '#ccd3d4',
      render: '#d8d3c8', renderShade: '#bcb5a8', renderLite: '#e7e3da', render2: '#c6bdae', render2Shade: '#aba190', stain: '#a69e90', crack: '#9d9585',
      hood: '#cdc7bb', hoodShade: '#aaa396', hoodUnder: '#9b9487', pipeW: '#f1f0ec', pipeWShade: '#cfcdc6',
      frame: '#d8c3a0', frameShade: '#b9a27c', frameLite: '#ead9bb', frameDark: '#9e8862', door: '#d6c19d', doorShade: '#b8a07a', handle: '#8f7a57',
      glass: '#4e5559', glassShade: '#363c40', reflect: '#9ea6a8', reflect2: '#4f585d', reflectSky: '#c5ccce', decal: '#ffffff', decalBg: '#4e5559',
      inWall: '#efdfc3', inWallShade: '#d4b98f', inFloor: '#b88e5f', inShelf: '#a77a4c', inLamp: '#ffdf9e', inLeaf: '#55703f', inLeaf2: '#6f8c55', inLeafD: '#3e5530', inPot: '#cfc3ad', inGood1: '#c9a36c', inGood2: '#7d8b74', inGood3: '#e9e2d4', inGood4: '#b0654a', inPaper: '#f6f3ec', inRed: '#d34b3c',
      pot: '#f3f2ee', potShade: '#cfcdc6', soil: '#6a5644', olive: '#8f9e74', olive2: '#a7b38b', oliveShade: '#6c7b55', oliveBark: '#6d655a',
      board: '#f5f4f0', boardShade: '#d6d4cd', boardInk: '#4a4844', boxW: '#f2f1ed', apron: '#c7c3bb', apronShade: '#aaa69e', meter: '#e6e3dc', lampBox: '#3c3a37', sun: '#ffd9a0', vine: '#6d8a52', vine2: '#89a46a', vineShade: '#4f683c', pigeon: '#8d8f96', pigeonShade: '#6a6c73', pigeonNeck: '#7f9488', lampGlass: '#f1ece0' },
    light: { shadowAt: [[20, 70], [300, 90]],
      morning: { set: { render: '#d5d3cc', renderLite: '#e6e5e0' }, add: { back: [poly([0, 0, 120, 0, 0, 78], 'shadow', { a: .1 }), poly([298, 16, 310, 16, 330, 40, 318, 40], 'shadow', { a: .1 }), poly([0, 96, 400, 96, 400, 104, 0, 112], 'shadow', { a: .1 })] } },
      midday: { add: { back: [r(262, 27, 36, 8, 'shadow', { a: .1 }), r(30, 104, 350, 7, 'shadow', { a: .18 })] } },
      golden: { set: { frameLite: '#f6dcb0', reflectSky: '#efcfac', reflect: '#c9ab8c' }, add: { back: [poly([230, 0, 400, 0, 400, 78, 330, 78, 300, 40, 262, 40], 'shadow', { a: .12 }), poly([0, 0, 230, 0, 262, 40, 300, 40, 330, 78, 0, 78], 'sun', { a: .1 })] } },
      night: { set: { decalBg: '#2a2016', glass: '#6e4f2e', glassShade: '#4a3520', reflect: '#6a5236', reflect2: '#5e4830', reflectSky: '#7a5e3c', decal: '#fff6e6', pipeW: '#55565a', pipeWShade: '#3d3e42',
          frame: '#5a4e3e', frameShade: '#433a2e', frameLite: '#7a6a52', door: '#564a3a', doorShade: '#40362a', pot: '#8f8c86', potShade: '#6b6964', board: '#9a9892', boardShade: '#77756f', lampGlass: '#ffe3ad' },
        add: { back: [r(44, 132, 324, 76, 'inLamp', { a: .06 })], over: [{ t: 'halo', x: 200, y: 170, rx: 180, ry: 60, n: 6, fill: 'inLamp', a: .04 }, { t: 'halo', x: 200, y: 250, rx: 150, ry: 24, n: 7, fill: 'pool', a: .05 }, { t: 'halo', x: 200, y: 98, rx: 22, ry: 18, n: 5, fill: 'lampGlass', a: .07 }] } } },
    breathe: { x: 40, y: 104, w: 336, h: 106 },
    shoppers: [{ keys: [[0, 70], [7, 120], [10, 120], [17, 70], [20, 70]], period: 20, foot: 206, s: .64, coat: 'coatC', legs: 'legsDark', hair: 'hairBrown', alpha: .8, shadow: false },
               { keys: [[0, 330], [6, 330], [10, 300], [15, 300], [19, 330]], period: 19, offset: 6, foot: 206, s: .62, coat: 'coatA', legs: 'legsDenim', hair: 'hairDark', alpha: .75, shadow: false }],
    passersby: [{ start: 5, every: 24, dir: -1, speed: 25, foot: 284, s: 1.24, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', carry: 'tote', carryC: 'bagMark' },
                { start: 14, every: 28, dir: 1, speed: 19, foot: 276, s: 1.12, coat: 'coatD', legs: 'legsDenim', hair: 'hairBrown', longHair: true, skirt: true, skirtC: 'coatC' }],
    sig: { emerge: { x: 200, foot0: 232, foot1: 266, s0: .72, s1: 1.24, dur: 1.15 } },
    build: function (L, F, P) {
      L.push(r(0, 0, 400, 244, 'sky'));
      // the render above: two tones split by the line of an old roof, stains, cracks
      L.push(r(0, 0, 400, 96, 'render', { shade: [grain('renderShade', .26, 'down', 1.6), grain('renderLite', .1, 'up', 2)] }));
      L.push(poly([0, 0, 150, 0, 4, 66, 0, 66], 'render2', { shade: grain('render2Shade', .3, 'down', 1.5) }));   // the old roof's ghost on the wall
      L.push(poly([150, 0, 156, 0, 6, 68, 0, 70, 0, 66, 4, 66], 'renderShade', { a: .7 })); L.push(poly([156, 0, 158, 0, 8, 68, 6, 68], 'renderLite', { a: .9 }));
      L.push(poly([156, 0, 400, 0, 400, 6, 160, 6], 'renderShade', { a: .25 }));
      (function () { var R = rnd(44); for (var i = 0; i < 9; i++) { var sx = 20 + R() * 360; L.push(r(sx, 70 + R() * 8, 1 + R() * 2, 10 + R() * 8, 'stain', { a: .1 + R() * .08 })); }
        for (var j = 0; j < 4; j++) { var cx = 40 + R() * 320, cy = 20 + R() * 50; L.push(line([cx, cy, cx + 5 + R() * 8, cy + 4 + R() * 6, cx + 8 + R() * 6, cy + 12 + R() * 6], 'crack', .4, { a: .55 })); } })();
      L.push(line([10, 40, 14, 50, 12, 58], 'crack', .5, { a: .6 })); L.push(c(6, 44, 1.6, 'stain', { a: .4 }));
      // the AC unit hung high on the wall, its pipe cover running down to the hood, a small meter box
      ac(L, 262, 2, 36); L.push(r(282, 12, 2, 4, 'acShade')); L.push(r(250, 24, 5, 52, 'pipeW', { shade: grain('pipeWShade', .4, 'right') })); L.push(r(250, 24, 18, 5, 'pipeW', { shade: grain('pipeWShade', .3, 'down') }));
      L.push(line([300, 18, 330, 30, 376, 32, 400, 30], 'crack', .5)); L.push(r(370, 40, 14, 16, 'meter', { r: 1, shade: grain('renderShade', .4, 'right') })); L.push(c(377, 46, 3.4, 'glass', { a: .5 })); L.push(r(372, 52, 10, 1, 'crack'));
      // a neighbour's creeper spilling over the top-left corner
      (function () { var R = rnd(47); L.push(line([0, 4, 20, 10, 34, 24, 40, 40], 'oliveBark', .8)); L.push(line([20, 10, 50, 6, 70, 16], 'oliveBark', .7)); L.push(line([34, 24, 26, 44, 30, 58], 'oliveBark', .6));
        [[0, 6], [16, 10], [30, 22], [40, 40], [48, 8], [66, 16], [26, 44], [30, 58], [8, 20]].forEach(function (q) { for (var i = 0; i < 8; i++) L.push(e(q[0] + (R() - .5) * 12, q[1] + (R() - .5) * 9, 2.2 + R() * 1.4, 1.4 + R() * .6, R() > .5 ? 'vine' : (R() > .4 ? 'vine2' : 'vineShade'), { rot: R() * 3, shade: grain('vineShade', .3, 'down') })); }); })();
      // the white rainwater pipe across, on its clips
      L.push(r(0, 78, 400, 3.4, 'pipeW', { shade: grain('pipeWShade', .35, 'down') })); L.push(r(0, 78, 400, .8, 'renderLite')); L.push(r(0, 81.4, 400, 1.4, 'shadow', { a: .12 }));
      for (var cx2 = 30; cx2 < 400; cx2 += 64) L.push(r(cx2, 77, 2.4, 5.4, 'pipeWShade'));
      pipe(L, 392, 81, 96);
      // a pigeon on the pipe
      (function () { var x = 118, y = 78; P.push(e(x, y - 3.4, 4.4, 2.6, 'pigeon', { shade: grain('pigeonShade', .4, 'down') })); P.push(c(x + 3.6, y - 6.2, 1.7, 'pigeonNeck')); P.push(c(x + 4.2, y - 7.4, 1.3, 'pigeon'));
        P.push(poly([x + 5.2, y - 7.6, x + 6.6, y - 7, x + 5.2, y - 6.8], 'handle')); P.push(poly([x - 3.6, y - 4, x - 8, y - 2.6, x - 3.4, y - 2], 'pigeonShade')); P.push(r(x - 1, y - 1, .5, 1.4, 'inRed')); P.push(r(x + 1, y - 1, .5, 1.4, 'inRed')); })();
      // the deep concrete hood over the shopfront, and its shadow
      L.push(r(0, 86, 400, 10, 'hood', { shade: grain('hoodShade', .4, 'down') })); L.push(r(0, 86, 400, .9, 'renderLite')); L.push(r(0, 96, 400, 4, 'hoodUnder', { shade: grain('shadow', .25, 'down') }));
      L.push(r(0, 100, 400, 144, 'render2', { shade: grain('render2Shade', .3, 'down') }));
      // inside: a warm room — plants, shelves of goods, bulbs on long cords
      L.push(r(36, 106, 340, 104, 'inWall', { shade: grain('inWallShade', .35, 'down', 1.8) }));
      L.push(r(36, 196, 340, 14, 'inFloor', { shade: grain('inWallShade', .3, 'down') }));
      [[240, 150], [240, 172], [300, 150], [300, 172]].forEach(function (s, i) { L.push(r(s[0], s[1], 52, 2, 'inShelf'));
        var R = rnd(70 + i); for (var gx = s[0] + 2; gx < s[0] + 48; gx += 5 + R() * 4) { var h = 4 + R() * 6; L.push(r(gx, s[1] - h, 3 + R() * 2, h, ['inGood1', 'inGood2', 'inGood3', 'inGood4'][Math.floor(R() * 4)], { r: .5 })); } });
      [[60, 1.7], [140, 1.4], [350, 1.6]].forEach(function (p, i) { plant(L, p[0], 206, p[1], 80 + i, { pot: 'inPot', n: 10, tall: 1.9, leaf: 'inLeaf', leaf2: 'inLeaf2', leafShade: 'inLeafD' }); });
      [70, 150, 252, 318, 352].forEach(function (lx, i) { var ly = 126 + (i % 3) * 7; L.push(r(lx - .3, 106, .6, ly - 106, 'frameDark')); L.push(c(lx, ly + 2, 2.4, 'inLamp')); L.push(g(lx, ly + 4, 9, 'inLamp', { d: .25, sy: .7 })); });
      L.push(r(96, 170, 30, 2, 'inShelf')); L.push(r(98, 172, 2, 24, 'inShelf')); L.push(r(122, 172, 2, 24, 'inShelf')); [[100, 'inGood3'], [108, 'inGood1'], [116, 'inGood4']].forEach(function (q) { L.push(r(q[0], 162, 6, 8, q[1], { r: 1 })); });
      // the apron the shop stands on, then the street
      L.push(r(0, 236, 400, 8, 'apron', { shade: grain('apronShade', .35, 'down') })); L.push(r(0, 236, 400, .8, 'renderLite'));
      pavement(L, F, { seed: 9040, stains: 3, grate: [300, 246, 40] });
      // the glass: dark, the street reflected in it — the building opposite, the sky, a bright stripe
      [[36, 132, 104, 76], [230, 132, 70, 76], [304, 132, 72, 76]].forEach(function (p, i) {
        F.push(r(p[0], p[1], p[2], p[3], 'glass', { a: .52 })); F.push(r(p[0], p[1] + p[3] * .55, p[2], p[3] * .45, 'glassShade', { a: .12 }));
        F.push(r(p[0], p[1], p[2], 22, 'reflectSky', { a: .22 })); F.push(r(p[0] + 6 + i * 9, p[1] + 10, 22, 30, 'reflect', { a: .25 })); F.push(r(p[0] + 30 + i * 4, p[1] + 2, 18, 44, 'reflect2', { a: .38 })); F.push(r(p[0] + p[2] - 16, p[1] + 8, 12, 30, 'reflect2', { a: .3 }));
        for (var wy = p[1] + 14; wy < p[1] + 40; wy += 7) F.push(r(p[0] + 8 + i * 9, wy, 18, 1.4, 'glassShade', { a: .25 }));
        sheen(F, p[0], p[1], p[2], p[3], { a: .1, at: .3, street: true, streetA: .12 }); });
      [[36, 106, 104, 22], [144, 106, 30, 22], [176, 106, 48, 22], [226, 106, 74, 22], [302, 106, 74, 22]].forEach(function (p) { F.push(r(p[0], p[1], p[2], p[3], 'glass', { a: .5 })); F.push(r(p[0], p[1], p[2], 8, 'reflectSky', { a: .25 })); sheen(F, p[0], p[1], p[2], p[3], { a: .08, at: .2, street: false }); });
      // the beige frame: posts, transom bar, sills, kick panels below the glass
      F.push(r(30, 100, 352, 6, 'frame', { shade: grain('frameShade', .3, 'down') })); F.push(r(30, 100, 352, .8, 'frameLite'));
      F.push(r(30, 128, 352, 4, 'frame', { shade: grain('frameShade', .3, 'down') })); F.push(r(30, 128, 352, .8, 'frameLite'));
      [[30, 6], [140, 4], [174, 3], [224, 6], [300, 4], [376, 6]].forEach(function (p) { F.push(r(p[0], 100, p[1], 136, 'frame', { shade: grain('frameShade', .35, 'right', 1.4) })); F.push(r(p[0], 100, .8, 136, 'frameLite')); F.push(r(p[0] + p[1] - .8, 100, .8, 136, 'frameShade')); });
      [[36, 104], [230, 70], [304, 72]].forEach(function (p) { F.push(r(p[0], 208, p[1], 28, 'frame', { shade: grain('frameShade', .3, 'down') })); F.push(r(p[0], 208, p[1], 2.4, 'frameLite')); F.push(r(p[0] + 4, 213, p[1] - 8, 18, 'frameShade', { a: .25 })); F.push(r(p[0] + 4, 213, p[1] - 8, .7, 'frameDark', { a: .4 })); });
      F.push(r(144, 132, 30, 104, 'frame', { shade: grain('frameShade', .3, 'down') })); F.push(r(148, 138, 22, 40, 'frameShade', { a: .25 })); F.push(r(148, 184, 22, 46, 'frameShade', { a: .25 }));
      // the solid beige door: two raised panels, a long bar handle, a kick plate
      F.push(r(177, 132, 47, 104, 'door', { shade: [grain('doorShade', .35, 'right', 1.4), grain('doorShade', .18, 'down')] }));
      F.push(r(182, 138, 37, 40, 'doorShade', { a: .35 })); F.push(r(183, 139, 35, 38, 'door')); F.push(r(183, 139, 35, .8, 'frameLite')); F.push(r(183, 139, .8, 38, 'frameLite', { a: .7 }));
      F.push(r(182, 184, 37, 44, 'doorShade', { a: .35 })); F.push(r(183, 185, 35, 42, 'door')); F.push(r(183, 185, 35, .8, 'frameLite')); F.push(r(183, 185, .8, 42, 'frameLite', { a: .7 }));
      F.push(r(212, 166, 2.2, 28, 'handle', { r: 1 })); F.push(r(212, 166, .7, 28, 'frameLite', { a: .6 })); F.push(r(177, 132, 47, 2, 'shadow', { a: .2 }));
      // notices taped in the left window: a paper, a small red sticker
      F.push(r(112, 150, 16, 20, 'inPaper', { a: .95 })); for (var ny = 154; ny < 168; ny += 3) F.push(r(114, ny, 12 - (ny % 2) * 3, .7, 'boardInk', { a: .5 }));
      F.push(r(42, 196, 16, 9, 'inRed', { a: .9 })); F.push(r(44, 199, 12, 1.4, 'inPaper'));
      // the mark and the name
      chairMan(F, 256, 177, 1.5);
      F.push({ t: 'text', text: 'STAYFUL', x: 265, y: 187.6, size: 8, weight: 600, font: FONT, fill: 'decal', align: 'center', ls: .3, glow: 'signGlow', blur: 3 });
      F.push({ t: 'text', text: 'LIFE STORE', x: 265, y: 196, size: 6.8, weight: 600, font: FONT, fill: 'decal', align: 'center', ls: .2, glow: 'signGlow', blur: 3 });
      // a lamp over the door
      F.push(r(196, 90, 8, 2, 'lampBox')); F.push(r(197.4, 92, 5.2, 5, 'lampGlass', { r: [0, 0, 2.6, 2.6] }));
      // the olive in its white pot, the A-board, a little white box
      olive(P, 334, 250, 1.08, 31);
      (function () { var x = 262, y = 252; P.push(line([x - 9, y, x - 6, y - 36], 'boardShade', 1.6)); P.push(r(x - 8, y - 38, 18, 32, 'board', { r: .6, shade: grain('boardShade', .35, 'right') }));
        P.push({ t: 'text', text: 'STAYFUL LIFE STORE', x: x + 1, y: y - 32, size: 2.1, weight: 600, font: FONT, fill: 'boardInk', align: 'center' });
        for (var ly = y - 28; ly < y - 16; ly += 2.4) P.push(r(x - 5, ly, 10 - (ly % 3), .5, 'boardInk', { a: .55 })); P.push(e(x + 3, y - 12, 4, 2.4, 'oliveShade', { a: .5 })); contact(P, x, y, 13, .16); })();
      P.push(r(54, 240, 12, 9, 'boxW', { shade: grain('boardShade', .4, 'right') })); P.push(r(54, 240, 12, 1, 'boardShade')); contact(P, 60, 249, 8, .14);
    } });
})();
