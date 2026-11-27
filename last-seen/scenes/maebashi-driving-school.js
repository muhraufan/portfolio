/* Scene — maebashi-driving-school. Needs /last-seen/last-seen.js and /last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, grain = K.grain, rnd = K.rnd, mix = K.mix;
  var make = K.make, contact = K.contact, sheen = K.sheen, plant = K.plant;
  /* ================= Maebashi Driving School ("Maekyo") — Sekine, Maebashi (from Nov 26), sunny =================
     the school building from across its forecourt: a plain grey three-storey block with a taller lift tower, bands of
     windows on the left bay, the school's emblem high on the wall, a long strip of glass over a recessed ground floor
     with the entrance and a row of planters; a lower wing to the right, big trees either side, a clipped pine and one of
     the school's white minibuses (a green stripe) parked on the left. A clear blue sky. */
  function canopy(L, cx, cy, rx, ry, seed, v) {   // a tree mass: one silhouette, a lit crown, a darker underside (as shimotakaido-ozora-park)
    var R = rnd(seed), i, a, d, body = [], crown = [], under = [];
    for (i = 0; i < 26; i++) { a = R() * Math.PI * 2; d = Math.pow(R(), .5) * .7; body.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, rx * (.18 + R() * .15), ry * (.18 + R() * .15), R() * 3]); }
    for (i = 0; i < 8; i++) { a = -Math.PI * (.5 + R() * .45); d = .3 + R() * .5; crown.push([cx - rx * .12 + Math.cos(a) * rx * d, cy - ry * .1 + Math.sin(a) * ry * d, rx * (.15 + R() * .12), ry * (.13 + R() * .1), R() * 3]); }
    for (i = 0; i < 8; i++) { a = Math.PI * (.05 + R() * .9); d = .45 + R() * .4; under.push([cx + rx * .1 + Math.cos(a) * rx * d, cy + ry * .18 + Math.sin(a) * ry * d * .8, rx * (.16 + R() * .12), ry * (.12 + R() * .1), R() * 3]); }
    L.push({ t: 'blob', clumps: body, fill: v[0], shade: grain(v[2], .14, 'down', 1.7),
      inner: [{ clumps: under, fill: v[2], shade: grain('treeDeep', .25, 'down', 1.5) }, { clumps: crown, fill: v[1], shade: grain(v[0], .14, 'br', 1.6) }] });
  }
  function cloud(L, x, y, cl) {      // a small fair-weather cloud: a shaded base, the lobes, the sunlit tops
    var cs = cl.map(function (q) { return [x + q[0], y + q[1], q[2], q[3]]; });
    cs.forEach(function (q) { L.push({ t: 'blob', clumps: [[q[0], q[1] + q[3] * .42, q[2] * .94, q[3] * .62]], fill: 'cloudBase' }); });
    cs.forEach(function (q) { L.push({ t: 'blob', clumps: [q], fill: 'cloud', shade: grain('cloudShade', .4, 'down', 1.5) }); });
    cs.forEach(function (q) { L.push({ t: 'blob', clumps: [[q[0] - q[2] * .14, q[1] - q[3] * .34, q[2] * .72, q[3] * .5]], fill: 'cloudLite' }); });
  }
  function band(L, x, y, w, h, n, key) {   // a strip of windows: the glass, then the mullions
    L.push(r(x, y, w, h, key || 'win', { shade: grain('winShade', .35, 'down', 1.3) })); L.push(r(x, y, w, .8, 'frame')); L.push(r(x, y + h - .8, w, .8, 'frame'));
    for (var i = 0; i <= n; i++) L.push(r(x + i * (w - .8) / n, y, .8, h, 'frame'));
    L.push(poly([x + w * .08, y, x + w * .22, y, x + w * .12, y + h, x, y + h, x, y + h * .6], 'glassLight', { a: .1 }));
  }
  function minibus(P, x, foot) {     // one of the school's buses, side on, nose to the right: white, a green stripe, dark glass
    contact(P, x + 31, foot, 34, .2);
    P.push(r(x, foot - 27, 62, 24, 'bus', { r: [4, 7, 2, 2], shade: grain('busShade', .3, 'down', 1.3) }));
    P.push(r(x + 3, foot - 24, 42, 9, 'busGlass', { r: 1.2 })); [14, 25, 36].forEach(function (m) { P.push(r(x + m, foot - 24, 1, 9, 'bus')); });
    P.push(poly([x + 48, foot - 24, x + 57, foot - 24, x + 60, foot - 15, x + 48, foot - 15], 'busGlass'));
    P.push(r(x, foot - 13, 62, 2.6, 'busStripe')); P.push(r(x, foot - 9.6, 62, .9, 'busStripe', { a: .7 }));
    P.push(r(x + 60, foot - 10, 2, 2.4, 'busLamp', { r: .5 })); P.push(r(x, foot - 5, 62, 2, 'busShade', { r: 1 }));
    [12, 49].forEach(function (w) { P.push(c(x + w, foot - 4, 4.6, 'tyre')); P.push(c(x + w, foot - 4, 2, 'hub')); });
  }
  var PEOPLE = { rfCap: '#4a3226', rfJacket: '#59625a', rfHoodie: '#e2d9c8', rfCollar: '#5a3a2a', rfPants: '#232427', rfShoe: '#c9cbc8', rfSole: '#f1f0eb', rfShoeMark: '#2c2f36',
    brFleece: '#1e1f22', brTee: '#eeece6', brPants: '#d9d0bd', brShoe: '#bfc1bd', brSole: '#eeede8', frames: '#26262a',
    stA: '#3d5a80', stB: '#8a8f96', stC: '#b3654a', stDark: '#2d2f34', stPale: '#d8d4ca' };
  function tonePeople(t, k) { var o = {}; Object.keys(PEOPLE).forEach(function (n) { o[n] = mix(PEOPLE[n], t, k); }); return o; }
  var G = 244;
  make('maebashi-driving-school', { seed: 1126, seenAt: '2026-11-26T13:00:00+09:00',
    place: { en: 'Maebashi Driving School', ja: '前橋自動車教習所' }, name: { en: 'Maebashi Driving School', ja: '前橋自動車教習所' }, area: { en: 'Sekine, Maebashi', ja: '前橋・関根' },
    alt: 'Illustration of Maebashi Driving School on a sunny day: a plain grey three-storey building with a round emblem on its wall, bands of windows, a recessed entrance with planters, big trees on either side, a clipped pine and a white minibus with a green stripe on the forecourt, under a clear blue sky.',
    palette: Object.assign({ sky: '#4f93dc', skyShade: '#a9cff0', cloud: '#f3f6f9', cloudShade: '#cdd8e4', cloudLite: '#ffffff', cloudBase: '#bccbd9', sunWash: '#fff3d6',
      wall: '#b9bbbc', wallShade: '#9ea1a3', wallLite: '#cdcfcf', wallSide: '#a5a8aa', wallJoint: '#a9acae', coping: '#8e9193', soffit: '#7c7f82',
      win: '#5d7186', winShade: '#44566a', frame: '#e4e6e6', recess: '#4b4f55', recessShade: '#383b40', pillar: '#c2c4c4', pillarShade: '#a2a5a6',
      inWall: '#d9d2c2', inWallShade: '#b9b09d', inDesk: '#8f7a5f', inBoard: '#3f6b52', inPaper: '#f1eee6',
      emblem: '#e9eaea', emblemShade: '#8d9092', sign: '#f2f1ec', signInk: '#2d4f7c', signGreen: '#2f8a57',
      tree: '#3f6a3a', tree2: '#5d8a4a', treeShade: '#2f5230', treeDeep: '#22402a', trunk: '#5b4a3c', pine: '#3d6b45', pine2: '#5b8a52', pineShade: '#2c5035', aut: '#b98337', aut2: '#d5a652', autShade: '#8f5f25',
      road: '#8f9194', roadShade: '#7c7e82', roadLite: '#a2a4a6', roadLine: '#f1f0ea', roadYellow: '#e6bb3c', kerb: '#c9c8c2', kerbShade: '#aeada6', lawn: '#6fa44e', lawnShade: '#588a3f',
      planter: '#8a5f45', planterShade: '#6b4733', flower: '#d5553f', flower2: '#e9c04a', leaf: '#5d8a4a',
      bus: '#f1f1ee', busShade: '#cfd0cc', busGlass: '#33414f', busStripe: '#2f8a57', busLamp: '#f3d27a', tyre: '#232427', hub: '#b9bbbb',
      barrier: '#e6bb3c', barrierShade: '#b98f25', pole: '#d9dada', poleShade: '#aeb0b1' }, PEOPLE),
    light: { noShadows: true,
      morning: { set: Object.assign({ sky: '#86b5e3', skyShade: '#c8def2', cloudBase: '#b4c0cf', wall: '#bcc0c3', wallLite: '#d2d6d7' }, tonePeople('#cbd8e2', .08)),
        add: { back: [poly([78, 62, 300, 62, 300, 120, 78, 150], 'cloudLite', { a: .1 }), poly([70, G, 300, G, 352, 262, 96, 262], 'shadow', { a: .08 })] } },
      midday: { add: { back: [r(78, 62, 222, 40, 'sunWash', { a: .08 }), poly([78, G, 352, G, 366, 252, 90, 252], 'shadow', { a: .12 })] } },
      golden: { set: Object.assign({ sky: '#8aa6c6', skyShade: '#efc9a4', cloud: '#fbe6d0', cloudShade: '#dcb7a0', cloudLite: '#fff3e2', cloudBase: '#b9a1a3', sunWash: '#ffc58e',
          wall: '#d6bfa6', wallShade: '#b99f88', wallLite: '#ecd3b6', wallSide: '#bfa790', pillar: '#dcc5ab', win: '#8a7f7c', winShade: '#6a5f60', road: '#a3927f', roadLite: '#b8a590', lawn: '#8f9f47', bus: '#f8e3c8' }, tonePeople('#f0b07e', .1)),
        add: { back: [r(78, 62, 274, 182, 'sunWash', { a: .1 }), poly([78, G, 352, G, 300, 268, 10, 268], 'shadow', { a: .1 })],
               over: [poly([400, 20, 400, 160, 160, 300, 0, 300, 0, 250], 'sunWash', { a: .07 }), { t: 'halo', x: 410, y: 150, rx: 120, ry: 70, n: 6, fill: 'sunWash', a: .06 }] } },
      night: { set: Object.assign({ sky: '#0f1630', skyShade: '#0a0f22', cloud: '#27304d', cloudShade: '#1c2440', cloudLite: '#3a4466', cloudBase: '#161c33',
          wall: '#262930', wallShade: '#1c1f25', wallLite: '#2e323a', wallSide: '#20232a', wallJoint: '#20232a', coping: '#16181d', soffit: '#121418', pillar: '#343840', pillarShade: '#25282e',
          win: '#1a2230', winShade: '#131a26', frame: '#4a4f58', recess: '#3a2f22', recessShade: '#2a2218', inWall: '#f0cf93', inWallShade: '#d3a968', inDesk: '#8a6a44', inPaper: '#fff0d0',
          emblem: '#8d939c', emblemShade: '#3a3e46', sign: '#f7e9c6', tree: '#152119', tree2: '#1b2a20', treeShade: '#0f1812', treeDeep: '#0a110c', trunk: '#1a1512', pine: '#16261b', pine2: '#1d3023', pineShade: '#0f1a13',
          aut: '#2a2218', aut2: '#33291b', autShade: '#1c160f', road: '#1d1f25', roadShade: '#16181d', roadLite: '#252830', roadLine: '#8d8f92', roadYellow: '#7d6a2c', kerb: '#34363c', kerbShade: '#26282d', lawn: '#1c2e1f', lawnShade: '#142217',
          planter: '#2e221b', planterShade: '#211812', flower: '#6a2d24', flower2: '#6f5d27', leaf: '#1c2e20', bus: '#70747c', busShade: '#4f535a', busGlass: '#12161d', busStripe: '#1c4a32', busLamp: '#6d6240', tyre: '#0c0d0f', hub: '#4a4d52',
          barrier: '#6f5c22', barrierShade: '#4d4017', pole: '#5a5d63', poleShade: '#3d4046', lit: '#f3c47c' }, tonePeople('#0d1124', .5)),
        add: { back: [r(97.9, 130.8, 10.2, 13.4, 'lit', { a: .7 }), r(120, 130.8, 10.2, 13.4, 'lit', { a: .5 }), r(156.8, 168.8, 35, 14.4, 'lit', { a: .55 }), r(204.5, 168.8, 11.1, 14.4, 'lit', { a: .4 }), r(250, 122.7, 14, 12.6, 'lit', { a: .6 }), r(312, 146.7, 12, 11.3, 'lit', { a: .5 })],
               over: [{ t: 'halo', x: 212, y: 250, rx: 100, ry: 22, n: 7, fill: 'lit', a: .04 }, { t: 'halo', x: 212, y: 214, rx: 70, ry: 30, n: 6, fill: 'lit', a: .03 }] } } },
    breathe: { x: 190, y: 200, w: 44, h: 44 },
    // students crossing the forecourt between lessons
    shoppers: [{ keys: [[0, 268], [7, 268], [12, 236], [19, 236], [24, 268]], period: 24, foot: 246, s: .8, coat: 'stA', legs: 'stDark', hair: 'hairDark', alpha: .9, shadow: false }],
    passersby: [{ start: 6, every: 27, dir: -1, speed: 24, foot: 287, s: 1.22, coat: 'stB', long: 2, legs: 'stDark', hair: 'hairDark', carry: 'backpack', carryC: 'stDark', shoe: 'stPale', sole: 'stPale' },
                { start: 19, every: 33, dir: 1, speed: 21, foot: 280, s: 1.16, coat: 'stC', legs: 'stPale', hair: 'hairBrown', longHair: true, shoe: 'stDark', sole: 'stPale' }],
    stamp: { x0: 60, x1: 340, y0: 40, y1: 290 },
    ground: { y0: 252, y1: 296, xMin: 30, xMax: 384 },
    sig: { emerge: { x: 212, foot0: 240, foot1: 266, s0: .7, s1: 1.22, dur: 1.3 },
      // Raufan, as at Fuglen the day before: a brown corduroy cap over shoulder-length hair worn down, an olive jacket with a brown collar open over a cream hoodie, black trousers, grey trainers
      person: { coat: 'rfJacket', open: 'rfHoodie', collar: 'rfCollar', long: -4.5, legs: 'rfPants', hair: 'hairDark', hairDown: true, longHair: true, hat: false, bag: false,
        ballcap: 'rfCap', shoe: 'rfShoe', sole: 'rfSole', shoeMark: 'rfShoeMark' },
      // Brian: glasses, a black fleece open over a white T-shirt, beige trousers, grey trainers
      company: [{ person: { coat: 'brFleece', open: 'brTee', long: -5, legs: 'brPants', hair: 'hairDark', hat: false, bag: false, glasses: 'frames', shoe: 'brShoe', sole: 'brSole', stride: 11.5 },
        dx: 28, dy: -1.6, ds: -.03, lag: .26 }] },
    build: function (L, F, P) {
      var i, x, y;
      L.push(r(0, 0, 400, G + 2, 'sky', { shade: grain('skyShade', .34, 'down', 1.6) }));
      cloud(L, 330, 44, [[0, 0, 26, 8], [-19, 4, 16, 6], [21, 3, 18, 6], [2, -6, 16, 8]]);
      cloud(L, 44, 30, [[0, 0, 18, 5.5], [-13, 3, 11, 4.5], [14, 2, 12, 4.5]]);
      L.push(e(170, 24, 22, 2, 'cloudLite', { a: .55 })); L.push(e(250, 38, 14, 1.6, 'cloudLite', { a: .5 }));
      // the big trees either side, behind the building's ends
      L.push(r(30, 170, 5, 74, 'trunk')); canopy(L, 30, 128, 50, 64, 71, ['tree', 'tree2', 'treeShade']);
      L.push(r(374, 180, 5, 64, 'trunk')); canopy(L, 380, 142, 40, 50, 72, ['tree', 'tree2', 'treeShade']); canopy(L, 350, 196, 14, 12, 73, ['aut', 'aut2', 'autShade']);
      // the lower wing to the right
      L.push(r(300, 118, 54, G - 118, 'wallSide', { shade: grain('wallShade', .3, 'down', 1.5) })); L.push(r(300, 116, 56, 2.6, 'coping'));
      [[312, 146], [334, 146], [312, 190], [334, 190]].forEach(function (w) { L.push(r(w[0], w[1], 12, 12, 'win', { shade: grain('winShade', .3, 'down') })); L.push(r(w[0], w[1], 12, .7, 'frame')); L.push(r(w[0] + 5.7, w[1], .7, 12, 'frame')); });
      // the main block: a taller lift tower set back, then the grey wall with its panel joints
      L.push(r(196, 40, 1, 24, 'pole')); L.push(r(232, 52, 66, 14, 'wallSide', { shade: grain('wallShade', .3, 'down') })); L.push(r(232, 50, 66, 2.4, 'coping'));
      L.push(r(78, 62, 222, G - 62, 'wall', { shade: grain('wallShade', .26, 'down', 1.6) })); L.push(r(76, 60, 226, 2.8, 'coping'));
      for (y = 92; y < 190; y += 30) L.push(r(78, y, 222, .6, 'wallJoint', { a: .7 })); for (x = 115; x < 300; x += 37) L.push(r(x, 62, .6, 128, 'wallJoint', { a: .6 }));
      // the left bay stands a little forward and catches the light: three bands of windows
      L.push(r(78, 62, 72, G - 62, 'wallLite', { shade: grain('wall', .3, 'right', 1.5) })); L.push(r(150, 62, 1.6, G - 62, 'wallShade', { a: .7 }));
      band(L, 86, 86, 56, 15, 5); band(L, 86, 130, 56, 15, 5); band(L, 86, 174, 56, 15, 5);
      // the centre: small windows upstairs, the emblem, and the long strip of glass over the entrance
      [[166, 82], [186, 82], [250, 122]].forEach(function (w) { L.push(r(w[0], w[1], 14, 14, 'win', { shade: grain('winShade', .3, 'down') })); L.push(r(w[0], w[1], 14, .7, 'frame')); L.push(r(w[0] + 6.6, w[1], .7, 14, 'frame')); L.push(r(w[0], w[1] + 13.3, 14, .7, 'frame')); });
      L.push(c(262, 90, 9.5, 'emblemShade', { a: .5 })); L.push(c(261, 89, 9, 'emblem')); L.push(c(261, 89, 6.2, 'emblemShade', { a: .55 })); L.push(poly([255.5, 91, 261, 82.5, 266.5, 91, 261, 88.4], 'emblem'));
      band(L, 156, 168, 96, 16, 8);
      // the ground floor is set back under the block: a dark recess, the room inside, pillars
      L.push(r(152, 196, 148, G - 196, 'recess', { shade: grain('recessShade', .4, 'down', 1.4) })); L.push(r(152, 194, 148, 3, 'soffit'));
      L.push(r(188, 204, 48, G - 204, 'inWall', { shade: grain('inWallShade', .35, 'down', 1.6) })); L.push(r(194, 210, 14, 9, 'inBoard')); L.push(r(196, 212, 4, 5, 'inPaper', { a: .8 })); L.push(r(202, 212, 4, 3, 'inPaper', { a: .7 }));
      L.push(r(214, 226, 20, 18, 'inDesk', { shade: grain('inWallShade', .3, 'down') })); L.push(r(214, 225, 20, 1.4, 'inPaper', { a: .6 }));
      L.push(r(244, 206, 22, 26, 'win', { shade: grain('winShade', .3, 'down') })); L.push(r(272, 206, 22, 26, 'win', { shade: grain('winShade', .3, 'down') })); L.push(r(160, 206, 22, 26, 'win', { shade: grain('winShade', .3, 'down') }));
      // the forecourt: asphalt, a kerb along the building, the painted lines of the practice course running off to the right
      L.push(r(0, G, 400, 300 - G, 'road', { shade: grain('roadShade', .3, 'down', 1.4) })); L.push(r(0, G, 400, 5, 'roadLite', { a: .5 }));
      L.push(r(0, G, 400, 2.6, 'kerb', { shade: grain('kerbShade', .3, 'down') }));
      L.push(poly([0, 262, 400, 258, 400, 259.6, 0, 263.8], 'roadLine', { a: .85 })); L.push(poly([238, 292, 400, 284, 400, 286, 238, 294.4], 'roadYellow', { a: .8 }));
      for (x = 16; x < 230; x += 30) L.push(poly([x, 291, x + 16, 290.4, x + 16, 292.2, x, 292.8], 'roadLine', { a: .8 }));
      L.push(e(120, 276, 34, 2.4, 'roadLite', { a: .25 })); L.push(e(310, 272, 28, 2, 'roadShade', { a: .3 }));
      // the shopfront layer: the entrance doors, pillars, the name by the door, planters
      F.push(r(186, 202, 52, 2.4, 'frame')); F.push(r(186, 202, 2, G - 202, 'frame')); F.push(r(236, 202, 2, G - 202, 'frame'));
      F.push(r(188, 204, 15, G - 204, 'win', { a: .5 })); F.push(r(221, 204, 15, G - 204, 'win', { a: .5 })); F.push(r(202.4, 204, 1.2, G - 204, 'frame')); F.push(r(220.4, 204, 1.2, G - 204, 'frame'));
      sheen(F, 188, 204, 15, G - 204, { a: .12, at: .3 }); sheen(F, 221, 204, 15, G - 204, { a: .12, at: .5 });
      [152, 240, 296].forEach(function (px) { F.push(r(px, 196, 5, G - 196, 'pillar', { shade: grain('pillarShade', .35, 'right', 1.3) })); });
      F.push(r(160, 216, 22, 9, 'sign', { r: .6 })); F.push(r(160, 216, 22, 2, 'signGreen')); F.push({ t: 'text', text: '前橋自動車教習所', x: 171, y: 222.6, size: 2.3, weight: 600, font: K.FONT, fill: 'signInk', align: 'center' });
      [[246, 14], [264, 14], [282, 12]].forEach(function (p, k) { F.push(r(p[0], G - 6, p[1], 6, 'planter', { r: [.6, .6, 1, 1], shade: grain('planterShade', .35, 'down') }));
        for (i = 0; i < 5; i++) { F.push(c(p[0] + 1.6 + i * (p[1] - 3.2) / 4, G - 7.4 - (i % 2) * 1.2, 1.9, 'leaf')); F.push(c(p[0] + 1.6 + i * (p[1] - 3.2) / 4, G - 8.6 - (i % 2) * 1.2, 1.1, (i + k) % 2 ? 'flower' : 'flower2')); } });
      // on the forecourt, to the left: the clipped pine, a yellow barrier, one of the school's buses
      P.push(r(119, 240, 3, 16, 'trunk')); contact(P, 120, 256.4, 14, .18);
      P.push({ t: 'blob', clumps: [[120, 236, 15, 6.5], [110, 240, 9, 5], [131, 240, 9, 5], [120, 230, 9, 5]], fill: 'pine', shade: grain('pineShade', .3, 'down', 1.5), inner: [{ clumps: [[117, 231, 8, 3.4], [126, 235, 6, 2.6]], fill: 'pine2' }] });
      minibus(P, 16, 262);
      [[92, 268], [102, 268]].forEach(function (b) { P.push(r(b[0], b[1] - 12, 1.4, 12, 'barrier')); contact(P, b[0] + .7, b[1], 3, .14); }); P.push(r(92, 256, 11.4, 1.4, 'barrier')); P.push(r(92, 261, 11.4, 1.2, 'barrierShade'));
    } });
})();
