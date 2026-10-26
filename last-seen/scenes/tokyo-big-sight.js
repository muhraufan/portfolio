/* Scene — tokyo-big-sight. Needs /timeline/lib/last-seen.js and /timeline/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, pavement = K.pavement, contact = K.contact, cone = K.cone, vending = K.vending;
  /* ================= Tokyo Big Sight — Ariake (Oct 17, 14:00) =================
     One hero: the conference tower's inverted pyramids read from the front as a single heavy trapezoid with
     the notch between the two front pyramids — a thick rim, the bronze underside facets facing us under a faint
     triangle lattice, the right side turned away in shade, the lit recess in the notch — standing on two glass
     legs with the entrance and its name between them, the long escalator climbing in from the left, a small
     queue on the plaza. Recomposed, not traced: the notch and the legs are what make it read. */
  var RIM = 40, RIM2 = 56, FB = 150;                // rim top / rim bottom / the foot of the pyramids
  var PY = [[52, 200, 150], [200, 348, 250]];        // the front row: two inverted pyramids [left, right, apex x]
  var NX = 200, NY = 98, AW = 12;                    // the notch apex; half width of each pyramid's flattened foot
  var DX = 16, DY = -6;                              // the turn: how much of the right side shows
  function lerp(a, b, t) { return a + (b - a) * t; }
  // a lattice that follows a facet's perspective: rungs across, and diagonals from the top edge to the foot
  function lattice(F, q, nAcross, nDown, a, key) {    // q = [x0,y0 (top left), x1,y1 (top right), x2,y2 (bottom right), x3,y3 (bottom left)]
    function P(u, v) { var tx = lerp(q[0], q[2], u), ty = lerp(q[1], q[3], u), bx = lerp(q[6], q[4], u), by = lerp(q[7], q[5], u); return [lerp(tx, bx, v), lerp(ty, by, v)]; }
    for (var j = 1; j < nDown; j++) { var v = Math.pow(j / nDown, .9), A = P(0, v), B = P(1, v); F.push(line([A[0], A[1], B[0], B[1]], key || 'lattice', .45, { a: a * .9 })); }
    for (var i = 0; i <= nAcross; i++) { var u = i / nAcross, T = P(u, 0), L1 = P(Math.min(1, u + 1 / nAcross), 1), L2 = P(Math.max(0, u - 1 / nAcross), 1);
      F.push(line([T[0], T[1], L1[0], L1[1]], key || 'lattice', .45, { a: a })); F.push(line([T[0], T[1], L2[0], L2[1]], key || 'lattice', .45, { a: a })); }
  }
  function folk(A, x, y, s, coat, legs, hair, bag) {  // a small standing person, far off: coat, legs, head (s=1 is about 10 units tall)
    A.push(r(x - 1.6 * s, y - 8.6 * s, 3.2 * s, 5.4 * s, coat, { r: [1.2 * s, 1.2 * s, .4, .4] }));
    A.push(r(x - 1.3 * s, y - 3.4 * s, 1.1 * s, 3.4 * s, legs)); A.push(r(x + .2 * s, y - 3.4 * s, 1.1 * s, 3.4 * s, legs));
    A.push(c(x, y - 9.9 * s, 1.35 * s, hair)); if (bag) A.push(r(x + 1.4 * s, y - 6.4 * s, 1.4 * s, 2.6 * s, bag));
  }
  var crowd = [[84, 240, 'coatA', 'legsDark', 'hairDark'], [88.5, 240.6, 'coatB', 'legsDenim', 'hairBrown', 'bag'], [92.6, 239.8, 'coatD', 'legsDark', 'hairDark'], [97.4, 240.4, 'hoodie', 'legsDark', 'hairDark'],
               [101.6, 240, 'coatC', 'legsDenim', 'hairBrown'], [106, 240.8, 'coatA', 'legsDark', 'hairDark', 'bag'], [110.4, 240.2, 'coatB', 'legsDark', 'hairDark'], [114.2, 240.6, 'coatD', 'legsDenim', 'hairBrown'],
               [118.8, 240, 'hoodie', 'legsDark', 'hairDark'], [123, 240.4, 'coatA', 'legsDenim', 'hairDark'],
               [288, 239.4, 'coatC', 'legsDark', 'hairDark'], [292, 240, 'coatA', 'legsDenim', 'hairBrown', 'bag'], [318, 240.6, 'coatB', 'legsDark', 'hairDark'], [352, 239.8, 'coatD', 'legsDark', 'hairBrown'], [356.4, 240.4, 'hoodie', 'legsDenim', 'hairDark']];

  make('tokyo-big-sight', { seed: 955, seenAt: '2026-10-17T14:00:00+09:00',
    place: { en: 'Tokyo Big Sight', ja: '東京ビッグサイト' }, name: { en: 'Tokyo Big Sight', ja: '東京ビッグサイト' }, area: { en: 'Ariake, Tokyo', ja: '東京・有明' },
    alt: 'Illustration of Tokyo Big Sight in Ariake: the convention centre\u2019s great inverted pyramids standing on two glass legs with the entrance and its name between them, an escalator climbing in from the left and a small queue on the plaza.',
    palette: { sky: '#e1e7ea', skyShade: '#cad5db',
      rimTop: '#dcd3c2', rim: '#a8987f', rimShade: '#8a7b65',
      face: '#c3ad8f', faceShade: '#a18b6f', faceLight: '#dccbb0', lattice: '#a8916f', under: '#8a7861', underShade: '#6f604d', underLine: '#7c6b55', side: '#7b6a56', sideShade: '#625444', back: '#9b8b76',
      sea: '#b6c6cc', seaLight: '#dfe7e8', far: '#cdd3d4', farShade: '#b9c0c2', cloud: '#eef1f1', bollard: '#8d8f90', kiosk: '#d9d4ca',
      notch: '#6f6458', notchSide: '#8d7f6c', inRecess: '#e9d2a8', inRecessD: '#cfb07e',
      glass: '#8f9ea8', glassShade: '#74838e', glassLine: '#b2bec6', mullion: '#5f6a72',
      beam: '#e2dccf', signInk: '#4a4844', banner: '#d9cfbd', banner2: '#5c6b78',
      hall: '#d4cfc6', hallShade: '#bdb7ad', hallGlass: '#a3afb6',
      esc: '#c9c3b8', escShade: '#aaa398', escRail: '#7b7f83', escGlass: '#b9c4ca',
      plaza: '#d0cbc2', plazaShade: '#b9b3a9', post: '#7f8183',
      inWall: '#ecdcbf', inWallShade: '#d5bd96', inLamp: '#ffe2ad', inDoor: '#a8b4ba', sunWash: '#ffc58e' },
    light: { noShadows: true,
      morning: { set: { sky: '#dfe6ea', skyShade: '#c8d3d9' },
        add: { back: [poly([128, 234, 272, 234, 342, 244, 192, 244], 'shadow', { a: .1 })] } },
      // golden: niko's warm paper-peach sky, the bronze facets catching the low sun
      golden: { set: { sky: '#f2d8c2', skyShade: '#e5b99c', face: '#d6b690', faceShade: '#ad8d6c', faceLight: '#f0d6b2', lattice: '#b99c7c', under: '#8f735c', underShade: '#735a46', underLine: '#80664f', sea: '#d8bfae', seaLight: '#f6dcc0', far: '#e0c8b4', farShade: '#cdb09a', cloud: '#f8e3cf', rim: '#b29a80', rimShade: '#8f7860', rimTop: '#efd9bb',
          side: '#8e7562', sideShade: '#725d4c', back: '#a8917b', notch: '#7b6656', notchSide: '#9a8270', hall: '#e3cdb6', hallShade: '#c9ad92', glass: '#a69789', glassShade: '#867668', glassLine: '#c8b4a0', escGlass: '#d8c3ad' },
        add: { back: [poly([128, 234, 272, 234, 98, 244, 18, 244], 'shadow', { a: .12 })] } },
      // night: deep navy, the notch and the atrium lit from inside, the sign lit, the glass legs glowing in bands
      night: { set: { sky: '#121a37', skyShade: '#0b1026', rimTop: '#4a4640', rim: '#2e2c2c', rimShade: '#232122',
          face: '#3d3632', faceShade: '#2b2521', faceLight: '#6e5c49', lattice: '#5a4c40', under: '#221d1b', underShade: '#181413', underLine: '#2f2723', sea: '#18213a', seaLight: '#3a4766', far: '#1a1f30', farShade: '#141826', cloud: '#1c2440', bollard: '#2a2b30', kiosk: '#2e2c2a', side: '#211f21', sideShade: '#18171a', back: '#1c1b20', notch: '#2a2420', notchSide: '#3a322b',
          glass: '#2b2828', glassShade: '#1f1d1d', glassLine: '#e7bb76', mullion: '#2a2623', beam: '#f3e7cf', signInk: '#2a2621', banner: '#6b5f50', banner2: '#2a3340',
          hall: '#23232b', hallShade: '#1a1a21', hallGlass: '#5a4a3a', esc: '#2c2c33', escShade: '#202027', escRail: '#d6a964', escGlass: '#3a3a40', plaza: '#1d1f28', plazaShade: '#15171e', post: '#111216' },
        add: {
          back: [r(172, 164, 56, 68, 'inLamp', { a: .12 })],
          over: [{ t: 'halo', x: 200, y: 132, rx: 30, ry: 24, n: 5, fill: 'haze', a: .035 }, { t: 'halo', x: 150, y: 146, rx: 62, ry: 46, n: 6, fill: 'haze', a: .022 }, { t: 'halo', x: 250, y: 146, rx: 62, ry: 46, n: 6, fill: 'haze', a: .022 },
                 { t: 'halo', x: 200, y: 200, rx: 56, ry: 42, n: 6, fill: 'pool', a: .022 },
                 { t: 'halo', x: 200, y: 240, rx: 140, ry: 16, n: 6, fill: 'pool', a: .035 }] } } },
    breathe: { x: 172, y: 162, w: 56, h: 70 },
    shoppers: [[182, 238, .3, 'coatD'], [262, 239, .31, 'coatA'], [330, 240, .32, 'coatB']].map(function (p, i) { return { keys: [[0, p[0]], [8 + i, p[0]], [12 + i, p[0] + (i % 2 ? 8 : -8)], [19 + i, p[0] + (i % 2 ? 8 : -8)], [24 + i, p[0]]], period: 24 + i, offset: i * 3.7,
      foot: p[1], s: p[2], coat: p[3], legs: i % 2 ? 'legsDark' : 'legsDenim', hair: i % 2 ? 'hairDark' : 'hairBrown', alpha: .9, shadow: false }; }),
    passersby: [{ start: 5, every: 22, dir: -1, speed: 26, foot: 286, s: 1.24, coat: 'coatC', legs: 'legsDark', hair: 'hairDark' }],
    sig: { emerge: { x: 200, foot0: 232, foot1: 264, s0: .42, s1: 1.25, dur: 1.15 } },
    build: function (L, F, P) {
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .12, 'up', 1.7) }));
      // two long, faint cloud bands so the sky is not a blank
      [[20, 26, 120, 3], [60, 31, 70, 2], [262, 18, 110, 2.6], [300, 23, 60, 1.8]].forEach(function (q) { L.push(r(q[0], q[1], q[2], q[3], 'cloud', { r: q[3] / 2, a: .7 })); });
      // the bay side: across the water, a low far shore and a thin city; the long exhibition halls nearer
      [[262, 196, 8, 12], [272, 192, 6, 16], [280, 198, 10, 10], [292, 194, 5, 14], [300, 199, 12, 9], [316, 195, 6, 13], [326, 200, 14, 8], [344, 197, 7, 11], [354, 201, 20, 7], [378, 198, 8, 10], [8, 200, 16, 8], [26, 197, 6, 11], [36, 201, 12, 7]]
        .forEach(function (q) { L.push(r(q[0], q[1], q[2], q[3], 'far', { a: .8 })); });
      L.push(r(0, 207, 400, 6, 'sea', { shade: grain('seaLight', .25, 'up') }));
      [[30, 209, 20], [120, 210, 14], [300, 209, 26], [360, 211, 12]].forEach(function (q) { L.push(r(q[0], q[1], q[2], .6, 'seaLight', { a: .8 })); });
      L.push(r(0, 212, 400, 12, 'hall', { shade: grain('hallShade', .25, 'down', 1.6) })); L.push(r(0, 212, 400, 1.2, 'faceLight', { a: .7 }));
      for (var hx = 0; hx < 400; hx += 26) L.push(poly([hx, 212, hx + 13, 208.6, hx + 26, 212], 'hall'));
      L.push(r(0, 217, 400, 2.4, 'hallGlass', { a: .55 })); for (var hx2 = 6; hx2 < 400; hx2 += 17 + (hx2 % 5)) L.push(r(hx2, 217, .6, 2.4, 'hallShade'));
      // the plaza, opening toward us, joints in perspective
      L.push(r(0, 224, 400, 20, 'plaza', { shade: grain('plazaShade', .25, 'down') }));
      for (var pj = -10; pj <= 10; pj++) L.push(line([200 + pj * 22, 224, 200 + pj * 40, 244], 'plazaShade', .4, { a: .6 }));
      L.push(r(0, 232, 400, .5, 'plazaShade', { a: .7 }));
      // the recess in the notch: lit floors behind glass
      L.push(poly([NX, NY, 162, FB, 238, FB], 'inRecess', { shade: grain('inRecessD', .35, 'up') }));
      for (var ny = 106; ny < FB; ny += 7) { var hw = (ny - NY) / (FB - NY) * 38; L.push(r(NX - hw, ny, hw * 2, .9, 'mullion', { a: .55 })); }
      for (var nx = 168; nx < 234; nx += 6) L.push(r(nx, 106, .5, FB - 106, 'mullion', { a: .3 }));
      // the escalator: a glazed tube from a landing on the plaza up into the left leg, on two piers
      L.push(r(10, 228, 34, 10, 'escShade', { r: [1, 1, 0, 0] })); L.push(r(10, 228, 34, 1.2, 'esc'));
      L.push(poly([30, 230, 46, 230, 132, 176, 132, 166], 'esc', { shade: grain('escShade', .35, 'down') }));
      L.push(poly([24, 222, 132, 158, 132, 168, 32, 230], 'escGlass', { a: .6 }));
      L.push(line([24, 222, 132, 158], 'escRail', 1.1)); L.push(line([32, 230, 132, 168], 'escRail', .7, { a: .7 }));
      for (var k = 0; k < 9; k++) { var u = (k + .5) / 9; L.push(line([lerp(25, 131, u), lerp(222, 158.6, u), lerp(33, 131, u), lerp(230, 168.6, u)], 'escRail', .45, { a: .5 })); }
      [[64, 208], [98, 188]].forEach(function (q) { L.push(r(q[0], q[1], 3.4, 236 - q[1], 'escShade')); L.push(r(q[0] - 1.6, 234, 6.6, 2, 'escShade')); });
      // the two legs: substantial glazed towers, a darker core showing through, banners hung on the glass
      [[128, 44], [228, 44]].forEach(function (lg, li) { var x0 = lg[0], w = lg[1];
        L.push(r(x0, FB, w, 84, 'glass', { shade: grain('glassShade', .4, 'down') }));
        L.push(r(x0 + w * .3, FB, w * .4, 84, 'glassShade', { a: .45 }));
        for (var y = 156; y < 234; y += 6.4) L.push(r(x0, y, w, .6, 'glassLine', { a: .75 }));
        for (var x = x0 + 5.5; x < x0 + w; x += 5.5) L.push(r(x, FB, .6, 84, 'glassLine', { a: .5 }));
        L.push(r(x0, FB, 1.6, 84, 'mullion')); L.push(r(x0 + w - 1.6, FB, 1.6, 84, 'mullion'));
        L.push(poly([x0 + w * .12, FB, x0 + w * .34, FB, x0 + 2, FB + 44, x0 + 2, FB + 22], 'glassLight', { a: .1 }));
        var bx = li ? x0 + 6 : x0 + w - 17; L.push(r(bx - .5, 165, 12, 1.2, 'mullion'));
        L.push(r(bx, 166, 11, 42, li ? 'banner2' : 'banner', { r: .4 })); L.push(r(bx + 2, 172, 7, .8, li ? 'banner' : 'banner2', { a: .8 })); L.push(r(bx + 2, 175, 5, .6, li ? 'banner' : 'banner2', { a: .6 }));
        L.push(c(bx + 5.5, 194, 2.8, li ? 'banner' : 'banner2', { a: .7 })); contact(L, x0 + w / 2, 234, w * .55, .12); });
      // the entrance between the legs: lit hall, glass doors, lamps
      L.push(r(172, 162, 56, 72, 'inWall', { shade: grain('inWallShade', .25, 'down', 1.8) }));
      [186, 214].forEach(function (lx) { L.push(r(lx - .4, 162, .8, 7, 'mullion')); L.push(g(lx, 173, 9, 'inLamp', { d: .25, sy: .6 })); L.push(c(lx, 170, 2.2, 'inLamp')); });
      L.push(r(180, 208, 40, 26, 'inDoor', { a: .35 })); for (var dx2 = 180; dx2 <= 220; dx2 += 10) L.push(r(dx2 - .6, 208, 1.2, 26, 'mullion', { a: .8 })); L.push(r(180, 207, 40, 1.2, 'mullion'));
      // the plaza's life: a queue along its barrier, a few others, an info board, bollards
      for (var bp = 80; bp < 128; bp += 12) L.push(r(bp, 233, .9, 7, 'post')); L.push(r(80, 234.4, 46, .6, 'banner2', { a: .7 }));
      crowd.forEach(function (q) { folk(L, q[0], q[1], 1, q[2], q[3], q[4], q[5]); });
      L.push(r(300, 226, 1, 12, 'post')); L.push(r(306, 226, 1, 12, 'post')); L.push(r(297, 218, 13, 9, 'kiosk', { r: .6 })); L.push(r(298.6, 219.6, 9.8, 1, 'banner2')); L.push(r(298.6, 222, 6, .6, 'banner2', { a: .6 }));
      pavement(L, F, { seed: 9550, manhole: [96, 290, 16], stains: 2 });
      for (var bl = 14; bl < 400; bl += 34) { if (bl > 160 && bl < 240) continue; L.push(r(bl, 236, 2.6, 8, 'bollard', { r: [1.3, 1.3, 0, 0] })); contact(L, bl + 1.3, 244, 3, .14); }
      cone(L, 338, 244, .9); cone(L, 352, 245, .85); vending(L, 368, 244, { seed: 95, w: 22, h: 40 });

      // ---- the hero: the front row of two inverted pyramids (facade layer) ----
      F.push(r(52 + 10, RIM - 5, 296 - 20, 5, 'back')); F.push(r(52 + 10, RIM - 5, 296 - 20, .9, 'rimTop', { a: .6 })); F.push(poly([348 - 10, RIM - 5, 348 + DX - 10, RIM - 5 + DY, 348 + DX - 10, RIM + DY, 348 - 10, RIM], 'back'));   // the far row over the rim
      // right side turned away
      F.push(poly([348, RIM2, 348 + DX, RIM2 + DY, 262 + DX * .3, FB + DY * .3, 262, FB], 'side', { shade: grain('sideShade', .4, 'down', 1.4) }));
      // each pyramid: a lit front face and two shadowed side faces, all meeting at its foot on a leg
      [[52, 74, 176, 200, 150], [200, 224, 326, 348, 250]].forEach(function (q, pi) { var a0 = q[0], a1 = q[1], b1 = q[2], b0 = q[3], cx = q[4], fl = cx - AW, fr = cx + AW;
        var outer = pi ? [b1, RIM2, b0, RIM2, fr, FB] : [a0, RIM2, a1, RIM2, fl, FB];
        var inner = pi ? [a0, RIM2, a1, RIM2, fl, FB, NX, NY] : [b1, RIM2, b0, RIM2, NX, NY, fr, FB];
        F.push(poly(outer, 'under', { shade: grain('underShade', .45, 'down', 1.3) }));
        F.push(poly(inner, 'under', { shade: grain('underShade', .55, 'up', 1.3) }));
        F.push(poly([a1, RIM2, b1, RIM2, fr, FB, fl, FB], 'face', { shade: [grain('faceShade', .45, 'up', 1.5), grain('faceLight', .2, 'down', 2)] }));
        lattice(F, [a1, RIM2, b1, RIM2, fr, FB, fl, FB], 8, 6, .55);
        lattice(F, pi ? [b1, RIM2, b0, RIM2, fr, FB, fr, FB] : [a0, RIM2, a1, RIM2, fl, FB, fl, FB], 2, 6, .4, 'underLine');
        F.push(line([a1, RIM2, fl, FB], 'faceLight', .7, { a: .6 })); F.push(line([b1, RIM2, fr, FB], 'faceLight', .7, { a: .45 }));   // crisp arrises
        F.push(r(fl - 1, FB - 2.4, fr - fl + 2, 2.4, 'underShade')); });
      // the rim: real thickness, a lit top edge, a dark underside line, panel joints; its right end turned
      F.push(r(48, RIM, 304, RIM2 - RIM, 'rim', { shade: grain('rimShade', .3, 'down') }));
      F.push(r(48, RIM, 304, 1.6, 'rimTop')); F.push(r(48, RIM2 - 1.8, 304, 1.8, 'rimShade'));
      for (var rj = 72; rj < 350; rj += 24) F.push(r(rj, RIM + 2, .5, RIM2 - RIM - 4, 'rimShade', { a: .5 }));
      F.push(poly([352, RIM, 352 + DX, RIM + DY, 352 + DX, RIM2 + DY, 352, RIM2], 'rimShade'));
      F.push(poly([352, RIM, 352 + DX, RIM + DY, 352 + DX, RIM + DY + 1.2, 352, RIM + 1.6], 'rimTop', { a: .8 }));
      // the name, lit, across the head of the entrance
      F.push(r(168, FB, 64, 12, 'beam'));
      F.push({ t: 'text', text: 'TOKYO BIG SIGHT', x: 200, y: FB + 8.4, size: 4.8, weight: 600, font: FONT, fill: 'signInk', align: 'center', ls: 1.2, glow: 'signGlow', blur: 3 });
      F.push(r(168, FB + 12, 64, 1.2, 'mullion', { a: .7 }));
    } });
})();
