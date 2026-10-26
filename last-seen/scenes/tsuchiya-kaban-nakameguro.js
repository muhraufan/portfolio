/* Scene — tsuchiya-kaban-nakameguro. Needs /timeline/lib/last-seen.js and /timeline/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, pavement = K.pavement, bike = K.bike, crown = K.crown, branches = K.branches, contact = K.contact, sheen = K.sheen, ac = K.ac, pipe = K.pipe, plant = K.plant, grate = K.grate, manhole = K.manhole;
  // a randoseru, front on: the box with its rounded flap, the darker gusset, a small brass buckle (x = left, y = top)
  function randoseru(A, x, y, w, col, o) {
    o = o || {}; var h = w * 1.22;
    A.push(r(x - .8, y + 2, w + 1.6, h - 2, col + 'D', { r: [w * .3, w * .3, 1.4, 1.4] }));                // gusset showing at the sides
    A.push(r(x, y, w, h, col, { r: [w * .34, w * .34, 1.2, 1.2] }));
    A.push(r(x + .6, y + .6, w - 1.2, h * .74, col + 'D', { r: [w * .32, w * .32, w * .16, w * .16], a: .35 })); // the flap
    A.push(r(x + w * .14, y + 1.1, w * .5, .7, 'inWall', { a: .28 }));                                         // stitched edge catching the light
    A.push(r(x + w / 2 - 1, y + h * .66, 2, 2.2, 'inBrass', { r: .5 }));
    if (o.tag) { A.push(r(x + w * .1, y + h + 1.4, w * .8, 3.2, 'inCard', { r: .3 })); A.push(r(x + w * .22, y + h + 2.6, w * .5, .6, 'inInk', { a: .6 })); }
  }
  /* ================= 1) TSUCHIYA KABAN — Nakameguro (Oct 25, 13:45) =================
     a dark grey building, a tall glass shopfront lifted above the street with a warm wooden interior and
     rows of school bags, a botanical poster in the window, white-railed steps, bikes, a white pillar sign */
  make('tsuchiya-kaban-nakameguro', { seed: 511, seenAt: '2026-10-25T13:45:00+09:00',
    place: { en: 'TSUCHIYA KABAN Nakameguro', ja: '土屋鞄 中目黒' }, name: { en: 'TSUCHIYA KABAN', ja: '土屋鞄' }, area: { en: 'Nakameguro, Tokyo', ja: '東京・中目黒' },
    alt: 'Illustration of the TSUCHIYA KABAN shop in Nakameguro: a dark grey building with a tall glass front, a warm wooden interior with rows of leather school bags, a botanical poster in the window, white-railed steps and two parked bicycles.',
    palette: { sky: '#e1e6e6', skyShade: '#ccd4d4', bldg: '#4d4e51', bldgShade: '#3a3b3e', slab: '#5d5e61', slabShade: '#47484b', upperWin: '#8e989c', upperWinLight: '#b9c3c6',
      fascia: '#38393c', sign: '#ecebe6', plinth: '#626366', plinthShade: '#4a4b4e', step: '#9a9a98', stepLight: '#b4b3b0', rail: '#f2f1ec', mullion: '#2c2d30',
      inWall: '#f1dfc2', inWallShade: '#d9bd92', inWood: '#b98657', inWoodShade: '#8d6039', inFloor: '#cfa77a', inBag1: '#a8463d', inBag1D: '#86342d', inBag2: '#3b3533', inBag2D: '#29241f', inBag3: '#3f4a62', inBag3D: '#2e3749', inBag4: '#c59a63', inBag4D: '#a37a48', inBag5: '#7a5034', inBag5D: '#5e3b24', inBag6: '#6a7556', inBag6D: '#525c42', inBag7: '#c99084', inBag7D: '#a8706a', inBrass: '#d9b46a', inCard: '#fbf7ee', inInk: '#6f6a62', inGrain: '#9a6a41', inLeaf: '#7d9064', inLeaf2: '#93a575', inLeafD: '#5f7049', inPot: '#c9b9a0', inLamp: '#ffe2ad',
      poster: '#f2ece0', posterLeaf: '#7f9b6c', posterLeaf2: '#a5b98f', posterBloom: '#d27c5e', posterBloom2: '#e0b45f', posterStem: '#5c7a4d',
      pillar: '#efeee9', pillarShade: '#d3d2cc', mark: '#4d4e51', tyre: '#2b2b2d', bikeFrame: '#3d4045', bikeMetal: '#9ea3a8', bikeSeat: '#232325', bikeBasket: '#9ea3a8', bikeCover: '#3d4047', blind: '#d9d6cf', gravel: '#ecebe5', gravelShade: '#c9c7bf', nosing: '#6d6d6c', sunWash: '#ffc58e' },
    light: { shadowAt: [[20, 70], [336, 34]],
      golden: { set: { sign: '#fff4e2' } },
      night: { set: { sign: '#fffaf0', pillar: '#c9c2b4', pillarShade: '#9c9486', rail: '#7d786e', step: '#2a2b31', stepLight: '#3b3a3c', poster: '#f0dcba', posterLeaf: '#6e8a59', posterLeaf2: '#91a77a', posterBloom: '#d8835f', posterBloom2: '#e7b65e', posterStem: '#4d6a3e' },
        add: { back: [r(70, 56, 260, 146, 'inLamp', { a: .05 }), r(63.4, 18, 44.6, 20, 'inLit', { a: .5 }), r(247.4, 18, 44.6, 20, 'inLit2', { a: .42 })],
          over: [{ t: 'halo', x: 200, y: 222, rx: 120, ry: 26, n: 7, fill: 'pool', a: .04 }, { t: 'halo', x: 200, y: 132, rx: 150, ry: 80, n: 6, fill: 'haze', a: .018 }, { t: 'halo', x: 352, y: 196, rx: 26, ry: 70, n: 5, fill: 'haze', a: .02 }] } } },
    breathe: { x: 70, y: 56, w: 260, h: 144 },
    shoppers: [{ keys: [[0, 112], [6, 112], [10, 150], [16, 150], [19, 112]], period: 19, foot: 196, s: .74, coat: 'coatA', legs: 'legsDark', hair: 'hairDark', alpha: .92, shadow: false },
               { keys: [[0, 296], [7, 296], [11, 268], [15, 268], [18, 296]], period: 18, offset: 5, foot: 195, s: .72, coat: 'coatC', legs: 'legsDenim', hair: 'hairBrown', alpha: .9, shadow: false }],
    passersby: [{ start: 5, every: 23, dir: -1, speed: 28, foot: 286, s: 1.24, coat: 'coatB', legs: 'legsDenim', hair: 'hairDark', carry: 'tote', carryC: 'bagMark' }],
    sig: { emerge: { x: 200, foot0: 199, foot1: 264, s0: .74, s1: 1.25, dur: 1.05 } },
    build: function (L, F, P) {
      L.push(r(0, 0, 400, 16, 'sky', { shade: grain('skyShade', .25, 'down') }));
      L.push(r(0, 6, 400, 238, 'bldg', { shade: grain('bldgShade', .3, 'down', 1.6) }));
      L.push(r(0, 6, 400, 10, 'slab', { shade: grain('slabShade', .3, 'down') }));
      L.push(r(16, 18, 368, 20, 'upperWin', { shade: grain('upperWinLight', .25, 'up') })); for (var ux = 16; ux < 384; ux += 46) L.push(r(ux, 18, 1.4, 20, 'mullion'));
      [[17.4, 7], [63.4, 0], [109.4, 13], [155.4, 4], [201.4, 9], [247.4, 0], [293.4, 16], [339.4, 5]].forEach(function (b) { if (b[1]) { L.push(r(b[0], 18, 44.6, b[1], 'blind', { shade: grain('upperWin', .2, 'down') })); L.push(r(b[0], 18 + b[1] - .8, 44.6, .8, 'mullion', { a: .5 })); } });
      L.push(r(0, 38, 400, 8, 'slab', { shade: grain('slabShade', .3, 'down') }));
      // the shop, lifted above the street: warm wall, wooden shelves of school bags, a doorway at the top of the steps
      L.push(r(70, 56, 260, 144, 'inWall', { shade: grain('inWallShade', .35, 'down', 2) }));
      L.push(r(70, 186, 260, 14, 'inFloor', { shade: grain('inWoodShade', .3, 'down') }));
      // shelves sit inside the panes (never behind a mullion): a narrow bay either side of the door, a long one in the right window
      [[137, 28], [235, 28], [270, 56]].forEach(function (sx) { [102, 134].forEach(function (y) {
        L.push(r(sx[0], y, sx[1], 3, 'inWood', { shade: grain('inWoodShade', .3, 'down') }));
        for (var gx = sx[0] + 4; gx < sx[0] + sx[1] - 4; gx += 9 + (gx % 5)) L.push(r(gx, y + .9, 4 + (gx % 4), .4, 'inGrain', { a: .5 })); }); });
      [[139, 102, 10.5, 'inBag1', 1], [152.5, 102, 9.8, 'inBag3'], [140, 134, 9.8, 'inBag2'], [152, 134, 10.6, 'inBag7', 1],
       [237, 102, 10, 'inBag4', 1], [250, 102, 10.4, 'inBag6'], [237.5, 134, 10.4, 'inBag5'], [250.5, 134, 9.6, 'inBag1', 1],
       [272, 102, 10, 'inBag5'], [285, 102, 10.6, 'inBag2', 1], [299, 102, 9.6, 'inBag1'], [312, 102, 10.2, 'inBag6', 1],
       [272.5, 134, 10.4, 'inBag3', 1], [286, 134, 9.6, 'inBag4'], [299, 134, 10.6, 'inBag7'], [313, 134, 9.8, 'inBag2', 1]]
        .forEach(function (b) { randoseru(L, b[0], b[1] - b[2] * 1.22, b[2], b[3], { tag: b[4] }); });
      // a leather swatch board high in the right window
      L.push(r(284, 64, 30, 18, 'inWood', { r: .6 })); [[286, 66, 'inBag1'], [293, 66, 'inBag3'], [300, 66, 'inBag4'], [307, 66, 'inBag6'], [286, 74, 'inBag2'], [293, 74, 'inBag7'], [300, 74, 'inBag5'], [307, 74, 'inBag1']]
        .forEach(function (q) { L.push(r(q[0], q[1], 5.4, 6, q[2], { r: .6 })); });
      plant(L, 316, 186, .9, 8, { pot: 'inPot', n: 7, tall: 1.4, leaf: 'inLeaf', leaf2: 'inLeaf2', leafShade: 'inLeafD' });
      [130, 200, 270].forEach(function (lx) { L.push(r(lx - .4, 56, .8, 10, 'mullion')); L.push(g(lx, 70, 12, 'inLamp', { d: .25, sy: .6 })); L.push(c(lx, 67, 3.4, 'inLamp')); });
      // through the door: the room goes back — a dimmer back wall, the floor running in, a display table to one side, a shelf at the back
      L.push(r(171, 93, 58, 79, 'inWallShade', { a: .4, shade: grain('inWoodShade', .1, 'up', 1.8) }));
      L.push(poly([171, 172, 229, 172, 229, 200, 171, 200], 'inFloor', { shade: grain('inWoodShade', .14, 'up', 1.8) }));
      L.push(r(171, 171.4, 58, 1.2, 'inWoodShade', { a: .7 })); for (var fb = 178; fb < 200; fb += 6 + (fb - 178) * .4) L.push(r(171, fb, 58, .5, 'inWoodShade', { a: .35 }));
      L.push(r(182, 116, 36, 2.2, 'inWood')); [[184, 'inBag4'], [192, 'inBag3'], [207, 'inBag1'], [213, 'inBag6']].forEach(function (q) { randoseru(L, q[0], 116 - 7.3, 6, q[1]); });
      L.push(r(198.6, 109, 6, 7, 'inCard', { r: .3 })); L.push(r(199.6, 111, 4, .5, 'inInk', { a: .6 }));
      L.push({ t: 'halo', x: 200, y: 104, rx: 22, ry: 18, n: 5, fill: 'inLamp', a: .05 }); L.push(r(199.6, 93, .8, 6, 'mullion')); L.push(c(200, 100, 2.6, 'inLamp'));
      L.push(r(173, 178, 20, 2.4, 'inWood', { shade: grain('inWoodShade', .3, 'down') })); L.push(r(174.5, 180.4, 1.4, 12, 'inWoodShade')); L.push(r(190, 180.4, 1.4, 12, 'inWoodShade'));
      L.push(e(183, 193, 11, 1.4, 'inWoodShade', { a: .35 }));
      randoseru(L, 175.5, 178 - 9.8, 8, 'inBag7'); randoseru(L, 184.5, 178 - 9.3, 7.6, 'inBag2');
      L.push(r(171, 93, 58, 4, 'inWoodShade', { a: .25 }));
      // the plinth, and steps down to the pavement (in the back layer so the figure walks down over them)
      L.push(r(0, 200, 400, 44, 'plinth', { shade: grain('plinthShade', .35, 'down') }));
      for (var i = 0; i < 4; i++) { var y0 = 200 + i * 11, w = 58 + i * 8; L.push(r(200 - w / 2, y0, w, 11, 'step', { shade: grain('plinthShade', .25, 'down') })); L.push(r(200 - w / 2, y0, w, 1.6, 'stepLight')); L.push(r(200 - w / 2, y0 + 1.6, w, .7, 'nosing', { a: .6 })); L.push(r(200 - w / 2 + 3, y0 + 9.6, w - 6, 1.2, 'shadow', { a: .08 })); }
      pipe(L, 8, 46, 242); ac(L, 20, 214, 24); L.push(r(16, 236, 34, 8, 'plinthShade', { a: .5 }));
      pavement(L, F, { seed: 5110, stains: 3, grate: [236, 246, 52], manhole: [92, 290, 17] });
      // the white gravel bed along the right of the steps, under the pillar
      L.push(r(300, 240, 100, 8, 'gravelShade')); (function () { var R = rnd(51); for (var i = 0; i < 90; i++) L.push(c(301 + R() * 98, 241 + R() * 6.4, .6 + R() * .8, R() > .3 ? 'gravel' : 'gravelShade')); })();
      // facade: the glass front, the frame, the poster in the left window, the fascia sign
      F.push(r(64, 50, 272, 6, 'fascia')); F.push(r(64, 200, 272, 3, 'fascia'));
      F.push(r(64, 50, 6, 153, 'fascia')); F.push(r(330, 50, 6, 153, 'fascia'));
      [134, 266].forEach(function (mx) { F.push(r(mx - 1.6, 56, 3.2, 144, 'mullion')); });
      F.push(r(168, 92, 3, 108, 'mullion')); F.push(r(229, 92, 3, 108, 'mullion')); F.push(r(168, 90, 64, 3, 'mullion'));
      sheen(F, 70, 56, 64, 144, { a: .1, at: .1 }); sheen(F, 266, 56, 64, 144, { a: .09, at: .3 }); sheen(F, 134, 56, 132, 34, { a: .08, at: .5, street: false });
      F.push(r(78.6, 94.6, 46.8, 62.8, 'inWood', { r: .6 })); F.push(r(80, 96, 44, 60, 'poster', { r: .4, shade: grain('inWallShade', .12, 'down') }));
      F.push({ t: 'text', text: 'ATELIER', x: 102, y: 102.4, size: 3.4, weight: 600, font: FONT, fill: 'posterStem', align: 'center', ls: 1.2 });
      F.push(line([102, 150, 102, 118], 'posterStem', 1.2)); F.push(line([102, 132, 92, 122], 'posterStem', .9)); F.push(line([102, 126, 112, 116], 'posterStem', .9));
      [[91, 121, 6, 3, -.7, 'posterLeaf'], [113, 115, 6, 3, .7, 'posterLeaf2'], [95, 139, 7, 3, -.4, 'posterLeaf2'], [109, 136, 7, 3.2, .5, 'posterLeaf']].forEach(function (l) { F.push(e(l[0], l[1], l[2], l[3], l[5], { rot: l[4] })); });
      F.push(c(102, 114, 5.4, 'posterBloom')); F.push(c(102, 114, 2, 'posterBloom2')); F.push(c(89, 113, 2.6, 'posterBloom2')); F.push(c(116, 108, 2.4, 'posterBloom'));
      F.push(r(88, 151.4, 28, .6, 'posterStem', { a: .5 })); F.push(r(93, 153.4, 18, .5, 'posterStem', { a: .4 })); [[96, 146, 4, 1.6, .5, 'posterLeaf2'], [108, 145, 4.4, 1.8, -.6, 'posterLeaf']].forEach(function (l) { F.push(e(l[0], l[1], l[2], l[3], l[5], { rot: l[4] })); });
      F.push({ t: 'text', text: 'TSUCHIYA KABAN', x: 74, y: 47, size: 5.6, weight: 600, font: FONT, fill: 'sign', align: 'left', ls: 2.2, glow: 'signGlow', blur: 4 });
      // white railings either side of the steps
      [-1, 1].forEach(function (s) { var x0 = 200 + s * 33, x1 = 200 + s * 46; F.push(line([x0, 190, x1, 236], 'rail', 1.6)); F.push(line([x0, 200, x0, 190], 'rail', 1.6)); F.push(line([x1, 244, x1, 236], 'rail', 1.6)); F.push(line([x0 + s * 6.5, 226, x0 + s * 6.5, 211], 'rail', 1.1)); });
      // the white pillar sign at the kerb, and the bikes
      P.push(r(340, 132, 24, 128, 'pillar', { r: 3, shade: grain('pillarShade', .4, 'right', 1.4) })); P.push(r(347.5, 142, 9, 9, 'mark', { r: 1 })); P.push(r(349.5, 144, 5, 5, 'pillar', { r: 2.5 })); P.push(r(351, 146.5, 2, .6, 'mark'));
      P.push({ t: 'text', text: 'TSUCHIYA', x: 352, y: 158, size: 2.9, weight: 600, font: FONT, fill: 'mark', align: 'center', ls: .6 }); P.push({ t: 'text', text: 'KABAN', x: 352, y: 162.2, size: 2.9, weight: 600, font: FONT, fill: 'mark', align: 'center', ls: .9 });
      P.push(r(341.4, 134, 1.4, 124, 'glassLight', { a: .35 })); contact(P, 352, 260, 16, .18);
      bike(P, 52, 264, { child: true }); bike(P, 106, 267, { basket: true, flip: true, bag: 'coatC' });
    } });
})();
