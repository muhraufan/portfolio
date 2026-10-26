/* Scene — fuglen-noborito. Needs /timeline/lib/last-seen.js and /timeline/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, pavement = K.pavement, bike = K.bike, crown = K.crown, branches = K.branches, contact = K.contact, sheen = K.sheen, pipe = K.pipe, plant = K.plant, plate = K.plate, sitter = K.sitter, cone = K.cone;
  /* ================= 2) FUGLEN COFFEE ROASTERS — Noborito (Oct 23, 13:40) =================
     a beige stone-tiled corner building with a maroon band, the red bird roundel, dark glass doors, benches,
     a white guardrail where the road runs past */
  make('fuglen-noborito', { seed: 622, seenAt: '2026-10-23T13:40:00+09:00',
    place: { en: 'FUGLEN COFFEE ROASTERS Noborito', ja: 'FUGLEN COFFEE ROASTERS 登戸' }, name: { en: 'FUGLEN COFFEE ROASTERS', ja: 'FUGLEN COFFEE ROASTERS' }, area: { en: 'Noborito, Kawasaki', ja: '川崎・登戸' },
    alt: 'Illustration of FUGLEN COFFEE ROASTERS in Noborito: a beige stone-tiled corner building with a maroon band, a red round bird sign, dark glass doors, wooden benches out front and a white guardrail by the road.',
    palette: { sky: '#e3e7e6', skyShade: '#ccd3d2', curtain: '#9aa5aa', curtainShade: '#7f8b91', curtainLine: '#6d777c', soffit: '#cfc8bb', band: '#6f3434', bandShade: '#542626', bandLine: '#8a4a45',
      tile: '#dcd3c3', tileShade: '#c3b8a5', tileJoint: '#c9bfae', glass: '#33363a', glassShade: '#23252a', frame: '#2a2b2e',
      inWall: '#e9d2b0', inWallShade: '#caa679', inWood: '#a8774b', inLamp: '#ffd998', roundel: '#c4463b', roundelShade: '#a3362d', bird: '#f6efe3',
      road: '#bdbbb6', roadShade: '#a7a49e', hedge: '#8ea27a', hedgeShade: '#6c8459', far: '#d8dbd6', pole: '#8e8f8c', wire: '#7a7b78',
      rail: '#f1f0ec', railShade: '#cfcdc7', bench: '#b8895a', benchShade: '#8b6239', walk: '#8c8b88', walkShade: '#787773', cup: '#f7f3ea', steam: '#ffffff', tileLight: '#e8e1d3', blind: '#dcdcd6', inShelf: '#8e6440', inBagA: '#d9c7a8', inBagB: '#b9a27f', inBagC: '#7f6a52', inMachine: '#9aa0a3', inMachineD: '#62686c', inLeaf: '#6f845a', inLeaf2: '#8aa070', inLeafD: '#566a45', inPot: '#d8cbb6', board: '#3a3a38', boardFrame: '#9b7652', chalk: '#efe9dc', chalkRed: '#d0796a', transformer: '#a3a5a3', transformerShade: '#878987', roadLine: '#f1efe8', benchGrain: '#a57a4d', sunWash: '#ffc58e' },
    light: { shadowAt: [[30, 80], [250, 60]],
      night: { set: { tile: '#2f2b28', tileShade: '#24211f', tileJoint: '#3a3531', band: '#2a1515', bandShade: '#1d0f0f', roundel: '#b5453a', roundelShade: '#93362d', bird: '#f3e3c8', rail: '#6d6a64', railShade: '#4d4a45', steam: '#e9dcc8',
          curtain: '#1b2131', curtainShade: '#141927', glass: '#2c2119', glassShade: '#1f1712', tileLight: '#38332f', blind: '#262b38', chalk: '#cfc6b4', board: '#1b1b1a', roadLine: '#6f6d68' },
        add: { back: [r(69.6, 27.6, 32.4, 24.4, 'inLit', { a: .62 }), r(69.6, 27.6, 32.4, 8, 'inWallShade', { a: .55 }), r(69.6, 35.2, 32.4, .8, 'inWood', { a: .6 }), c(92, 47, 3.4, 'inWood', { a: .5 }), e(92, 42, 4, 4.6, 'inWood', { a: .35 }),
          r(205.6, 1.6, 32.4, 24.4, 'inLit', { a: .5 }), r(205.6, 1.6, 32.4, 15, 'inWallShade', { a: .5 }), r(205.6, 16.2, 32.4, .8, 'inWood', { a: .6 }),
          r(103.6, 53.6, 32.4, 24.4, 'inLit2', { a: .4 }), r(111.6, 53.6, .6, 8, 'inWood', { a: .5 }), c(111.9, 62.5, 2, 'inLit', { a: .9 }),
          r(34, 112, 84, 84, 'shadow', { a: .14 }), r(34, 112, 84, 22, 'shadow', { a: .14 })], over: [{ t: 'halo', x: 200, y: 248, rx: 110, ry: 24, n: 7, fill: 'pool', a: .04 }, { t: 'halo', x: 132, y: 104, rx: 30, ry: 30, n: 6, fill: 'roundel', a: .05 }, { t: 'halo', x: 356, y: 36, rx: 30, ry: 30, n: 6, fill: 'haze', a: .03 }] } } },
    breathe: { x: 176, y: 114, w: 48, h: 120 },
    shoppers: [{ keys: [[0, 160], [6, 160], [9, 158], [15, 158]], period: 15, foot: 228, s: .72, coat: 'coatD', legs: 'legsDark', hair: 'hairBrown', alpha: .5, shadow: false }],
    passersby: [{ start: 4, every: 21, dir: 1, speed: 27, foot: 286, s: 1.24, coat: 'coatA', long: 6, legs: 'legsDark', hair: 'hairDark' }],
    anim: [{ layer: 'front', draw: function (f, t, pal, v) {         // a wisp of steam from a cup left on the bench
      for (var i = 0; i < 3; i++) { var u = (t * .32 + i / 3) % 1, a = .4 * (1 - u) * Math.min(1, u * 5) * (v === 'night' ? .7 : 1);
        f.globalAlpha = a; f.fillStyle = pal.steam; f.beginPath(); f.arc(87 + Math.sin(u * 5 + i) * 1.4, 224 - u * 15, 1 + u * 1.8, 0, Math.PI * 2); f.fill(); } } }],
    build: function (L, F, P) {
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .14, 'down', 1.6) }));
      // the road side, on the right: far trees, a utility pole, the wires
      L.push(r(300, 196, 100, 48, 'far', { shade: grain('skyShade', .3, 'down') }));
      crown(L, [[330, 200, 16], [352, 194, 18], [376, 202, 15], [398, 196, 17]], ['hedge'], 'hedgeShade');
      L.push(r(355, 14, 3.6, 230, 'pole', { shade: grain('transformerShade', .3, 'right') })); L.push(r(344, 30, 26, 2, 'pole')); L.push(r(348, 52, 18, 1.6, 'pole'));
      L.push(r(360.5, 60, 9, 15, 'transformer', { r: 2, shade: grain('transformerShade', .45, 'right') })); L.push(r(361.5, 58, 7, 2, 'transformerShade', { r: 1 })); L.push(line([365, 58, 362, 52], 'wire', .5));
      for (var sp = 108; sp < 230; sp += 8) L.push(r(354, sp, 1.4, .8, 'transformerShade', { a: sp > 200 ? .8 : 0 }));
      L.push(r(355.4, 150, 2.8, 22, 'roundelShade', { a: 0 }));
      plate(L, 352, 170, 9, 14);
      L.push(line([300, 46, 330, 40, 346, 31], 'wire', .55)); L.push(line([346, 31, 372, 36, 400, 33], 'wire', .55)); L.push(line([300, 58, 326, 60, 350, 53], 'wire', .5)); L.push(line([350, 53, 378, 58, 400, 55], 'wire', .5)); L.push(line([306, 66, 340, 68, 358, 64, 400, 70], 'wire', .4, { a: .7 }));
      // the building: glass upstairs, a maroon band, stone tiles at street level
      L.push(r(0, 0, 306, 78, 'curtain', { shade: grain('curtainShade', .3, 'down') }));
      for (var cx = 0; cx < 306; cx += 34) L.push(r(cx, 0, 1.6, 78, 'curtainLine'));
      L.push(r(0, 26, 306, 1.6, 'curtainLine')); L.push(r(0, 52, 306, 1.6, 'curtainLine'));
      [[1.6, 0, 9], [35.6, 0, 0], [69.6, 0, 0], [103.6, 0, 14], [137.6, 0, 6], [171.6, 0, 18], [205.6, 0, 0], [239.6, 0, 4], [273.6, 0, 11], [1.6, 27.6, 6], [137.6, 27.6, 12], [239.6, 27.6, 20], [171.6, 53.6, 8], [35.6, 53.6, 16]]
        .forEach(function (b) { if (b[2]) L.push(r(b[0], b[1] + 1, 32.4, b[2], 'blind', { a: .8 })); });
      L.push(poly([60, 0, 120, 0, 60, 78, 0, 78, 0, 70], 'glassLight', { a: .06 })); L.push(poly([200, 0, 214, 0, 156, 78, 142, 78], 'glassLight', { a: .05 }));
      L.push(r(0, 78, 312, 16, 'band', { shade: grain('bandShade', .35, 'down') })); L.push(r(0, 93, 312, 1, 'bandLine'));
      L.push(r(0, 94, 306, 150, 'tile', { shade: grain('tileShade', .3, 'down', 1.6) }));
      // stone tiles in running bond, courses of two heights, each tile a touch different
      (function () { var R = rnd(62), y = 94, row = 0; while (y < 236) { var h = row % 3 === 2 ? 12 : 18, off = (row % 2) * 18 + (row % 3 === 2 ? 9 : 0);
        for (var tx = -36 + off; tx < 306; tx += 36) { var v = R(), x0 = Math.max(0, tx), w = Math.min(306, tx + 36) - x0; if (w <= 1) continue;
          if (v < .35) L.push(r(x0 + .9, y + .9, w - .9, h - .9, 'tileShade', { a: .1 + R() * .14 })); else if (v > .7) L.push(r(x0 + .9, y + .9, w - .9, h - .9, 'tileLight', { a: .35 + R() * .4 }));
          if (tx >= 0) L.push(r(tx, y, .9, h, 'tileJoint')); }
        L.push(r(0, y, 306, .9, 'tileJoint')); y += h; row++; } })();
      L.push(e(40, 232, 30, 5, 'tileShade', { a: .12 })); L.push(e(282, 232, 18, 4, 'tileShade', { a: .12 }));   // rain splash weathering at the foot
      // through the doors: a warm room, a counter
      L.push(r(150, 110, 100, 126, 'inWall', { shade: grain('inWallShade', .35, 'down', 2) }));
      L.push(r(150, 196, 100, 40, 'inWood', { shade: grain('inWallShade', .3, 'down') }));
      L.push(r(187, 140, 26, 1.6, 'inShelf')); L.push(r(187, 160, 26, 1.6, 'inShelf'));
      [[188.5, 131, 'inBagA'], [194.5, 132, 'inBagC'], [200, 130, 'inBagB'], [206.5, 132, 'inBagA'], [189, 152, 'inBagB'], [196, 151, 'inBagA'], [204, 153, 'inBagC']].forEach(function (q) { var base = q[1] > 145 ? 160 : 140; L.push(r(q[0], q[1], 5, base - q[1], q[2], { r: [1.4, 1.4, .3, .3] })); L.push(r(q[0] + 1, q[1] + 3, 3, 1.4, 'inWall', { a: .6 })); });
      L.push(r(188, 182, 22, 14, 'inMachine', { r: [1.6, 1.6, 0, 0], shade: grain('inMachineD', .4, 'down') })); L.push(r(191, 189, 2.4, 5, 'inMachineD')); L.push(r(204, 189, 2.4, 5, 'inMachineD')); L.push(r(196, 178, 5, 4, 'inMachineD', { r: 1 }));
      L.push(r(150, 196, 100, 2, 'inWallShade'));
      [172, 228].forEach(function (lx) { L.push(r(lx - .4, 110, .8, 14, 'frame')); L.push(g(lx, 128, 13, 'inLamp', { d: .25, sy: .6 })); L.push(c(lx, 125, 3, 'inLamp')); });
      L.push(r(34, 112, 84, 84, 'inWall', { shade: [grain('inWallShade', .45, 'up', 1.6), grain('inWallShade', .2, 'down', 2.2)] })); L.push(r(34, 112, 84, 6, 'inWallShade', { a: .7 }));
      L.push(r(34, 172, 84, 24, 'inWood', { shade: grain('inWallShade', .3, 'down') })); L.push(r(34, 168, 84, 4, 'inWallShade')); L.push(r(34, 172, 84, 1, 'inLamp', { a: .7 }));
      [[46, 'inWallShade'], [66, 'inWood'], [88, 'inWallShade']].forEach(function (q) { L.push(r(q[0] - 3, 182, 6, 1.6, q[1], { a: .9 })); L.push(r(q[0] - .5, 183.6, 1, 12, q[1], { a: .9 })); L.push(r(q[0] - 2.4, 194, 4.8, .8, q[1], { a: .9 })); });
      plant(L, 104, 168, .9, 23, { pot: 'inPot', n: 8, tall: 1.6, leaf: 'inLeaf', leaf2: 'inLeaf2', leafShade: 'inLeafD' });

      [58, 96].forEach(function (lx) { L.push(r(lx - .4, 112, .8, 12, 'frame')); L.push(c(lx, 126, 2.6, 'inLamp')); L.push(g(lx, 129, 9, 'inLamp', { d: .25, sy: .6 })); });
      L.push(r(40, 160, 40, 1.6, 'inShelf')); [[42, 152, 'inBagA'], [48, 153, 'inBagC'], [54, 151, 'inBagB'], [61, 153, 'inBagA'], [68, 152, 'inBagB']].forEach(function (q) { L.push(r(q[0], q[1], 5, 160 - q[1], q[2], { r: [1.4, 1.4, .3, .3] })); });
      L.push(r(0, 236, 312, 8, 'walk', { shade: grain('walkShade', .3, 'down') }));
      pavement(L, F, { seed: 6220, manhole: [64, 286, 16] });
      // the glass doors: dark panes, the middle pair open
      F.push(r(146, 106, 108, 4, 'frame')); F.push(r(146, 106, 4, 130, 'frame')); F.push(r(250, 106, 4, 130, 'frame'));
      F.push(r(150, 110, 26, 126, 'glass', { shade: grain('glassShade', .35, 'down') })); F.push(r(224, 110, 26, 126, 'glass', { shade: grain('glassShade', .35, 'down') }));
      F.push(r(175, 110, 2.4, 126, 'frame')); F.push(r(223, 110, 2.4, 126, 'frame'));
      F.push(poly([177, 110, 187, 114, 187, 232, 177, 236], 'frame')); F.push(poly([179, 116, 185, 118, 185, 228, 179, 231], 'glass', { a: .9 }));
      F.push(poly([223, 110, 213, 114, 213, 232, 223, 236], 'frame')); F.push(poly([221, 116, 215, 118, 215, 228, 221, 231], 'glass', { a: .9 }));
      [[150, 110], [224, 110]].forEach(function (p) { F.push(poly([p[0] + 4, p[1], p[0] + 16, p[1], p[0] + 2, p[1] + 40, p[0], p[1] + 40, p[0], p[1] + 8], 'glassLight', { a: .1 })); });
      // the windows either side
      [[34, 112, 84], [282, 112, 22]].forEach(function (w) { F.push(r(w[0], w[1], w[2], 84, 'glass', { a: w[2] > 30 ? .5 : 1 })); F.push(poly([w[0] + 6, w[1], w[0] + 22, w[1], w[0] + 4, w[1] + 34, w[0], w[1] + 34, w[0], w[1] + 10], 'glassLight', { a: .08 })); });
      // the roundel: a red circle with a small white bird, simplified
      F.push(c(132, 104, 10.5, 'roundel', { shade: grain('roundelShade', .35, 'br') }));
      F.push(e(131, 105.4, 4.6, 3, 'bird', { rot: -.25 })); F.push(c(135.4, 101.6, 2.2, 'bird')); F.push(poly([137, 101.2, 139.6, 101.9, 137.2, 102.8], 'bird'));
      F.push(poly([127.4, 106.4, 123.4, 109.6, 128.2, 108.4], 'bird')); F.push(r(130.4, 107.8, .8, 2.4, 'bird'));
      F.push({ t: 'text', text: 'FUGLEN', x: 64, y: 88.8, size: 6.2, weight: 600, font: FONT, fill: 'bird', align: 'left', ls: 3, a: .9, glow: 'signGlow', blur: 3 });
      // the corner, a drainpipe, and the guardrail by the road
      F.push(r(306, 78, 6, 166, 'tileShade')); pipe(F, 301, 94, 244);
      // the A-frame menu by the door: dark board, chalk lines, a small red cup
      P.push(line([128, 247, 132, 206], 'boardFrame', 1.4)); P.push(line([146, 247, 142, 206], 'boardFrame', 1.4));
      P.push(r(129.6, 208, 14.8, 26, 'board', { r: .6 })); P.push(r(129, 207, 16, 1.6, 'boardFrame'));
      P.push({ t: 'text', text: 'COFFEE', x: 137, y: 214.6, size: 3, weight: 600, font: FONT, fill: 'chalk', align: 'center', ls: .6 });
      [[132, 218.5, 8], [132, 221.5, 10], [132, 224.5, 7], [132, 227.5, 9]].forEach(function (l) { P.push(r(l[0], l[1], l[2], .6, 'chalk', { a: .8 })); P.push(r(141.4, l[1], 1.4, .6, 'chalk', { a: .8 })); });
      P.push(c(137, 231, 1.4, 'chalkRed')); contact(P, 137, 247.4, 12, .14);
      plant(P, 258, 244, 1.1, 41, { pw: 11, ph: 11, n: 7, tall: 1.3 }); plant(P, 268, 244, .8, 44, { n: 5 });
      P.push(r(300, 236, 100, 8, 'road', { shade: grain('roadShade', .3, 'down') }));
      P.push(r(300, 241.4, 100, .9, 'roadLine', { a: .8 })); for (var gx = 314; gx < 400; gx += 28) { P.push(r(gx, 236, 3, 22, 'railShade', { r: 1 })); P.push(r(gx + .4, 238, .8, 18, 'metalSheen', { a: .4 })); contact(P, gx + 1.5, 258, 4, .14); }
      P.push(r(306, 234, 94, 6, 'rail', { r: 3, shade: grain('railShade', .3, 'down') })); P.push(r(310, 234.8, 88, .8, 'metalSheen', { a: .7 }));
      P.push(e(356, 259, 46, 2, 'shadow', { a: .1 }));
      // benches, and a cup on the left one
      [[48, 76], [256, 40]].forEach(function (b) { P.push(r(b[0], 228, b[1], 5, 'bench', { shade: grain('benchShade', .4, 'down') })); P.push(r(b[0] + 3, 233, 3, 13, 'benchShade')); P.push(r(b[0] + b[1] - 6, 233, 3, 13, 'benchShade')); contact(P, b[0] + b[1] / 2, 246.6, b[1] / 2 + 2, .16); for (var wg = b[0] + 5; wg < b[0] + b[1] - 6; wg += 11 + (wg % 7)) P.push(r(wg, 229.6, 6 + (wg % 5), .5, 'benchGrain', { a: .6 })); P.push(r(b[0], 228, b[1], .8, 'cup', { a: .25 })); });
      sitter(P, 280, 228, 1.3, { coat: 'coatC', legs: 'legsDenim', hair: 'hairDark', dir: -1, cup: true, rimA: .5 });
      P.push(r(84, 221, 6, 7, 'cup', { r: [.6, .6, 1.4, 1.4] })); P.push(r(84, 223.5, 6, 1.4, 'bench', { a: .7 }));
    } });
})();
