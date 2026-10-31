/* Scene — bear-pond-espresso. Needs /last-seen/last-seen.js and /last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, grain = K.grain, rnd = K.rnd, mix = K.mix;
  var make = K.make, pavement = K.pavement, contact = K.contact, sheen = K.sheen, vending = K.vending, ac = K.ac, pipe = K.pipe, plant = K.plant, FONT = K.FONT;
  /* ================= Bear Pond Espresso — Shimokitazawa (Oct 31, 15:45), a clear afternoon =================
     seen from across the lane: a low, weathered white stucco box with a big blank fascia and a red neon bear standing
     on its upper right; a projecting ledge, and under it the old shopfront, a full-width white-painted wooden frame:
     a row of small transom panes right across, multi-pane windows on the left with people sitting inside, the open
     doorway in the middle (warm inside, the barista at the machine), a glazed door with a little OPEN sign and a
     paper note, grey plank kick panels, a step and drain grates; a red neon OPEN, an orange cone. Grey neighbours with
     pipes and wires, and the lane's green pedestrian strip with its white line on the asphalt. */
  var X0 = 66, X1 = 334, FT = 140, FB = 242;
  function bear(A, x, y, s, fill, o) {   // the neon bear: an upright bear in profile, one continuous tube
    var B = [6, 5, 7.4, 1.6, 9.6, 3.2, 13.4, 3, 16.6, 5.6, 18.2, 8.6, 15.6, 9.8, 13, 11, 13.8, 16.4, 17.2, 20.4, 15.4, 22.4, 13, 19.8, 12.4, 25, 13.6, 32.6, 10.4, 32.6, 9.2, 26.6, 7.6, 32.6, 4.4, 32.6, 5, 25.6, 3, 19.6, 3.6, 12.4, 5, 8.6, 6, 5];
    var pts = []; for (var i = 0; i < B.length; i += 2) pts.push(x + B[i] * s, y + B[i + 1] * s);
    A.push(line(pts, fill, 1.1 * s, o));
    A.push(line([x + 13.4 * s, y + 6.4 * s, x + 14.6 * s, y + 6.4 * s], fill, .9 * s, o));   // the eye
  }
  var PEOPLE = { rfTop: '#9aa294', rfPants: '#2a2a2b', rfCrown: '#d9762e', rfBrim: '#4f6a8c', rfShoe: '#e4e3df', rfSole: '#f5f4f0', rfShoeMark: '#a9a9a6',
    wfHijab: '#b39069', wfShades: '#1c1a19', wfTop: '#f3f1ec', wfStripe: '#1f1f21', wfPants: '#6d6b47', wfShoe: '#efeeea', wfSole: '#f8f8f4', wfShoeMark: '#8e96a3', wfBag: '#b59c72',
    snCap: '#f4f3ef', snTee: '#f3f2ec', snStripe: '#4f8d58', snPants: '#cfba95', snShoe: '#4a4b50', snSole: '#77787c' };
  function tonePeople(t, k) { var o = {}; Object.keys(PEOPLE).forEach(function (n) { o[n] = mix(PEOPLE[n], t, k); }); return o; }
  make('bear-pond-espresso', { seed: 1031, seenAt: '2026-10-31T15:45:00+09:00',
    place: { en: 'Bear Pond Espresso', ja: 'ベアポンド エスプレッソ' }, name: { en: 'Bear Pond Espresso', ja: 'ベアポンド エスプレッソ' }, area: { en: 'Shimokitazawa, Tokyo', ja: '東京・下北沢' },
    alt: 'Illustration of Bear Pond Espresso in Shimokitazawa on a clear afternoon: a low, weathered white shop with a big blank fascia and a red neon bear on it, an old white-painted wooden shopfront with a row of small transom panes, multi-pane windows with people sitting inside, an open doorway with the barista at the machine, a door with a small OPEN sign, grey plank panels, drain grates, an orange cone and the lane\'s green pedestrian strip.',
    palette: Object.assign({ sky: '#6eaee6', skyShade: '#a9d0f2', cloudLite: '#f6f9fc', sunWash: '#fff3d6', back: '#b9bcbd', backShade: '#a2a5a7',
      wall: '#ebe8e1', wallShade: '#cfcac0', wallLite: '#f8f6f1', wallStain: '#a9a397', parapet: '#e1ddd5', ledge: '#efece6',
      frame: '#ece9e2', frameShade: '#c9c4b9', plank: '#9b9a95', plankShade: '#76756f', plankLite: '#bdbcb6', glassT: '#55656f', step: '#bdbab3', stepShade: '#a19e97', stepLite: '#d6d3cc',
      neon: '#e8473a', neonTube: '#ff8a76', neonGlow: '#ff6a55', openBoard: '#efe7d6', openInk: '#3d3a36', note: '#f3eedc', noteLine: '#b9b1a0', plateW: '#eeeeea',
      nb: '#b4b6b6', nb2: '#a9acad', nbShade: '#8f9293', nbWin: '#7d8d99', nbDoor: '#5c5f62', nbPanel: '#e9e9e6', winFrameD: '#6f7376', rail: '#6b6f74', gate: '#7b7e80', gateBar: '#5d6063',
      farWin: '#7c8b97', win: '#8fa7ba', wire: '#3a3a3c', woodShade: '#5a4636',
      asphalt: '#6f7174', asphaltShade: '#5d5f62', asphaltLite: '#8a8c8f', kerbTop: '#b3b0aa', green: '#63a46c', greenShade: '#4f8a58', greenLite: '#8cbf8c', lineW: '#eeeeea', lineShade: '#cfcfca',
      inWall: '#e9d4ae', inWallShade: '#c9ad82', inDeep: '#c99f6c', inDark: '#5e4636', inDarkShade: '#3e2d23', transom: '#4a3a30', inSkin: '#c99d7c', inShelf: '#7a5b40', inCup: '#f7f3ea', inCounter: '#5f4838', inCounterTop: '#9b7a58', inMachine: '#f3f1ec', inMachineShade: '#cdc8be',
      inChrome: '#b9bec3', inLamp: '#fff3d6', inFloor: '#b8956c', inHair: '#2b2623', inHair2: '#8d8a86', inShirt: '#2f3236', inShirt2: '#ecebe6', inShirt3: '#6d7c8c', inBariTee: '#2c2d30', bariTee: '#2c2d30', bariApron: '#3b3530' }, PEOPLE),
    light: { shadowAt: [[50, 110], [230, 100]],
      morning: { set: Object.assign({ sky: '#a8cdee', skyShade: '#cfe2f3', wall: '#e8e8e4', wallShade: '#cacbc7', frame: '#e8e9e6', green: '#5c9a63' }, tonePeople('#cbd8e2', .1)),
        add: { back: [r(0, 0, 400, 150, 'sunWash', { a: .12 }), poly([X0, 62, X1, 62, X1, 120, X0, 120], 'sunWash', { a: .1 }),
                      poly([X0, 62, X0 + 70, 62, X0 + 22, 118, X0, 118], 'shadow', { a: .16 }),                       // the left neighbour's shadow, low sun from the left
                      poly([X0 - 6, 125, X1 + 6, 125, X1 + 6, 134, X0 + 30, 134], 'shadow', { a: .2 }), r(X0 + 4, FT, X1 - X0 - 8, 7, 'shadow', { a: .2 }),
                      r(190 + 44, 156, 4, 86, 'shadow', { a: .22 })],
               front: [poly([X1 + 2, 248, X1 + 30, 248, 400, 262, 372, 262], 'shadow', { a: .14 })] } },
      // midday, clear and sunny: the fascia in full sun, the cornice throwing a crisp band of shade, the doorway deep
      midday: { add: { back: [poly([X0, 62, X1, 62, X1, 118, X0, 118], 'sunWash', { a: .14 }), r(X0 - 6, 118, X1 - X0 + 12, 1.4, 'rim', { a: .8 }),
                      r(X0 - 2, 125, X1 - X0 + 4, 9, 'shadow', { a: .2 }), r(X0 + 4, FT, X1 - X0 - 8, 9, 'shadow', { a: .18 }),
                      r(190, 156, 7, 86, 'shadow', { a: .26 }), r(X0 - 6, 56, X1 - X0 + 12, 1.2, 'rim', { a: .7 })],
                       front: [r(X0 - 4, FB + 4, X1 - X0 + 8, 5, 'shadow', { a: .14 }), e(212, 270, 60, 2.4, 'shadow', { a: .08 })] } },
      golden: { set: Object.assign({ sky: '#eac29c', skyShade: '#f4d6b4', wall: '#f2dcc2', wallShade: '#d4b898', wallLite: '#fde9cf', parapet: '#efd4b6', ledge: '#f6e0c6', frame: '#f3dfc6', frameShade: '#d2b596',
          back: '#c7b3a2', nb: '#bfae9c', nb2: '#b5a493', green: '#6f9a55', asphalt: '#7a6f6a', kerbTop: '#c4ad96' }, tonePeople('#f0b07e', .12)),
        add: { back: [r(0, 0, 400, 150, 'sunWash', { a: .24 }), r(X1 - 2, 56, 3, 188, 'rim', { a: .55 }), r(X0 - 4, 118, X1 - X0 + 8, 1.6, 'rim', { a: .7 }),
                      poly([X1, 62, X1, 118, X1 - 26, 118, X1 - 70, 62], 'shadow', { a: .16 }),                        // the right neighbour's shadow, low sun from the right
                      poly([X0 - 6, 125, X1 + 6, 125, X1 - 30, 134, X0 - 6, 134], 'shadow', { a: .2 }), r(X0 + 4, FT, X1 - X0 - 8, 7, 'shadow', { a: .2 }),
                      r(190, 156, 4, 86, 'shadow', { a: .22 })],
               over: [{ t: 'halo', x: 307, y: 82, rx: 22, ry: 24, n: 5, fill: 'neonGlow', a: .07 }] } },
      night: { set: Object.assign({ sky: '#111729', skyShade: '#0c1122', back: '#1f2129', backShade: '#181a21', wall: '#2e2d30', wallShade: '#222125', wallLite: '#3b393b', wallStain: '#1b1a1e', parapet: '#28272b', ledge: '#333236',
          frame: '#3a3834', frameShade: '#2a2825', plank: '#2a2a2b', plankShade: '#1c1c1d', plankLite: '#3a3a3a', step: '#25262a', stepShade: '#1c1d21', stepLite: '#33343a',
          neon: '#ff5a48', neonTube: '#ffd0c4', neonGlow: '#ff5a48', openBoard: '#f3d9a6', openInk: '#3d2f22', note: '#f0d39e', noteLine: '#b49464', plateW: '#d9c39a',
          nb: '#25272c', nb2: '#22242a', nbShade: '#191b20', nbWin: '#e2bf82', nbDoor: '#16171a', nbPanel: '#34353a', gate: '#202226', gateBar: '#15161a', farWin: '#2b303d', win: '#e8c27f', wire: '#0a0a0c',
          asphalt: '#17191f', asphaltShade: '#111318', asphaltLite: '#22252c', kerbTop: '#22242b', green: '#1f3324', greenShade: '#172a1c', greenLite: '#2b4430', lineW: '#55575c', lineShade: '#3d3f44', bariTee: '#2a2a2e', bariApron: '#3a302a', inDark: '#8a6542', inDarkShade: '#5c3f27', transom: '#b07e48', inDeep: '#f2c584', inWall: '#f3d39c' }, tonePeople('#0d1124', .62)),
        add: { over: [{ t: 'halo', x: 307, y: 82, rx: 24, ry: 26, n: 6, fill: 'neonGlow', a: .08 }, { t: 'halo', x: X1 - 22, y: FT + 9, rx: 14, ry: 6, n: 4, fill: 'neonGlow', a: .1 },
          { t: 'halo', x: 212, y: 250, rx: 70, ry: 10, n: 6, fill: 'pool', a: .08 }, { t: 'halo', x: 128, y: 252, rx: 60, ry: 8, n: 5, fill: 'pool', a: .05 },
          { t: 'halo', x: 200, y: 268, rx: 170, ry: 14, n: 6, fill: 'pool', a: .035 }, { t: 'halo', x: 200, y: 205, rx: 140, ry: 40, n: 6, fill: 'pool', a: .025 }] } } },
    breathe: { x: 190, y: 190, w: 44, h: 50, c: 'breathe', a: .045 },
    // the barista: dark tee, dark apron over brown shorts, working the machine and turning to the counter
    shoppers: [{ keys: [[0, 228], [5, 228], [6.6, 222], [10.4, 222], [12, 228]], period: 12, foot: 240, s: .84, coat: 'bariTee', legs: 'bariApron', hair: 'hairDark', alpha: 1, shadow: false }],
    passersby: [{ start: 9, every: 25, dir: -1, speed: 22, foot: 286, s: 1.22, coat: 'coatC', legs: 'legsDenim', hair: 'hairDark', carry: 'tote', carryC: 'bagMark' },
                { start: 17, every: 29, dir: 1, speed: 20, foot: 278, s: 1.14, coat: 'coatB', legs: 'legsDark', hair: 'hairBrown', carry: 'backpack', carryC: 'coatD' }],
    stamp: { x0: 60, x1: 340, y0: 40, y1: 290 },
    ground: { y0: 257, y1: 296, xMin: 8, xMax: 392 },
    sig: { emerge: { x: 212, foot0: 242, foot1: 268, s0: .84, s1: 1.24, dur: 1.3 },
      person: { coat: 'rfTop', long: -6, shortSleeve: true, hat: false, bag: false, campcap: 'rfCrown', capFront: 'rfCrown', capBrim: 'rfBrim', legs: 'rfPants', longHair: true,
        shoe: 'rfShoe', sole: 'rfSole', shoeMark: 'rfShoeMark' },
      // his wife (a beige hijab, round sunglasses, a black-and-white striped top, olive cargo trousers, white trainers, a tan crossbody bag)
      // and their son (about five: a white cap, a wide green-and-white striped tee, beige cords, dark grey trainers), drawn child-sized
      company: [{ person: { coat: 'wfTop', stripe: 'wfStripe', stripeGap: 1.5, stripeW: .7, long: -5, hat: false, hijab: 'wfHijab', shades: 'wfShades', legs: 'wfPants', hair: 'hairDark',
                  shoe: 'wfShoe', sole: 'wfSole', shoeMark: 'wfShoeMark', bag: false, carry: 'crossbody', carryC: 'wfBag', stride: 11 }, dx: 27, dy: -1.4, ds: -.05, lag: .3 },
                { person: { coat: 'snTee', stripe: 'snStripe', stripeGap: 2.6, stripeW: 1.3, long: -5, shortSleeve: true, hat: false, ballcap: 'snCap', legs: 'snPants', hair: 'hairDark',
                  shoe: 'snShoe', sole: 'snSole', bag: false, stride: 8 }, dx: -21, dy: 1.6, ds: -.4, lag: .18 }] },
    build: function (L, F, P) {
      var R = rnd(31), i, x, y;
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .25, 'down', 1.6) }));
      L.push(e(110, 14, 16, 2.4, 'cloudLite', { a: .6 })); L.push(e(126, 17, 9, 1.6, 'cloudLite', { a: .5 }));
      // behind: a tall grey block over the shop's roof
      L.push(r(150, 24, 190, 36, 'back', { shade: grain('backShade', .3, 'down', 1.4) }));
      for (x = 160; x < 330; x += 26) L.push(r(x, 34, 14, 10, R() > .7 ? 'win' : 'farWin', { a: .9 }));
      L.push(r(150, 24, 190, 1.2, 'wallLite', { a: .7 })); L.push(r(150, 50, 190, .8, 'backShade', { a: .6 }));
      // the left neighbour: grey render, a pipe, a white panel door, a dark door further back
      L.push(r(0, 0, 70, 244, 'nb', { shade: grain('nbShade', .3, 'right', 1.4) })); L.push(r(66, 0, 4, 244, 'nbShade', { a: .7 }));
      for (y = 24; y < 240; y += 44) L.push(r(0, y, 66, .8, 'nbShade', { a: .45 }));
      L.push(r(6, 30, 26, 34, 'nbWin', { r: .6 })); L.push(r(6, 30, 26, 1.6, 'winFrameD')); L.push(poly([8, 32, 18, 32, 8, 46], 'skyShade', { a: .3 }));
      pipe(L, 40, 0, 244); L.push(r(46, 6, 1.6, 120, 'pipeShade'));
      L.push(r(0, 166, 26, 78, 'nbDoor', { shade: grain('nbShade', .3, 'right') })); L.push(r(0, 166, 26, 2, 'nbShade'));
      L.push(r(30, 176, 34, 68, 'nbPanel', { shade: grain('nbShade', .25, 'down') })); for (x = 33; x < 62; x += 4) L.push(r(x, 178, .6, 64, 'nbShade', { a: .35 }));
      // the right neighbour: grey, a balcony and an AC unit, pipes, a metal gate at street level
      L.push(r(334, 0, 66, 244, 'nb2', { shade: grain('nbShade', .3, 'right', 1.4) }));
      L.push(r(346, 22, 40, 22, 'nbWin', { r: .5 })); L.push(r(346, 44, 44, 2, 'rail')); for (x = 346; x < 390; x += 4) L.push(r(x, 44, .7, 14, 'rail')); L.push(r(346, 57, 44, 1.4, 'rail'));
      L.push(r(344, 58, 48, 3, 'nbShade'));
      ac(L, 360, 96, 20); pipe(L, 338, 0, 244); pipe(L, 394, 60, 244);
      L.push(r(348, 120, 14, 18, 'nbWin', { r: .5 })); L.push(r(348, 120, 14, 1.4, 'winFrameD'));
      L.push(r(346, 184, 46, 60, 'gate', { shade: grain('nbShade', .3, 'down') })); for (x = 348; x < 392; x += 3) L.push(r(x, 186, 1, 58, 'gateBar'));
      L.push(r(346, 184, 46, 2, 'gateBar')); L.push(r(372, 170, 18, 10, 'plateW')); L.push(r(374, 173, 12, .8, 'nbShade')); L.push(r(374, 175.6, 8, .7, 'nbShade'));
      // the shop: a low weathered white box, the blank fascia catching the light
      L.push(r(X0 - 4, 56, X1 - X0 + 8, 6, 'parapet', { shade: grain('wallShade', .35, 'down') })); L.push(r(X0 - 4, 56, X1 - X0 + 8, 1, 'wallLite'));
      L.push(r(X0, 62, X1 - X0, 58, 'wall', { shade: [grain('wallShade', .28, 'down', 1.4)] }));
      for (i = 0; i < 10; i++) L.push(e(X0 + 10 + R() * (X1 - X0 - 20), 66 + R() * 48, 8 + R() * 16, 1 + R() * 2.4, 'wallStain', { a: .05 + R() * .06 }));   // weathering
      for (i = 0; i < 6; i++) L.push(r(X0 + 8 + R() * (X1 - X0 - 16), 64, .8, 6 + R() * 18, 'wallStain', { a: .08 }));                        // rain streaks
      L.push(r(X0, 62, 1.6, 58, 'wallLite', { a: .8 })); L.push(r(X1 - 3, 62, 3, 58, 'wallShade', { a: .6 }));
      L.push(r(X0, 108, X1 - X0, 10, 'wallStain', { a: .1, shade: grain('wallStain', .3, 'down') }));   // grime gathering above the ledge
      for (i = 0; i < 14; i++) L.push(r(X0 + 4 + R() * (X1 - X0 - 8), 125 + R() * 4, .7, 4 + R() * 8, 'wallStain', { a: .12 }));        // streaks under the ledge
      bear(L, 298, 66, .92, 'neonTube', { a: .5 }); bear(L, 298, 66, .92, 'neon');   // the neon bear, upper right
      // the ledge: a projecting cornice, lit on top, deep shadow under
      L.push(r(X0 - 6, 118, X1 - X0 + 12, 5, 'ledge', { shade: grain('wallShade', .3, 'down') })); L.push(r(X0 - 6, 118, X1 - X0 + 12, 1.2, 'wallLite'));
      L.push(r(X0 - 6, 123, X1 - X0 + 12, 2, 'wallShade')); L.push(r(X0 - 2, 125, X1 - X0 + 4, 4, 'shadow', { a: .2 }));
      // the lower band over the shopfront, the pilasters either side
      L.push(r(X0 + 2, 125, X1 - X0 - 4, 15, 'wall', { shade: grain('wallShade', .35, 'down') })); L.push(r(X0 + 6, 128, X1 - X0 - 12, 10, 'wallLite', { a: .35 }));
      L.push(r(X0 + 6, 138.4, X1 - X0 - 12, 1, 'wallShade', { a: .8 }));
      L.push(r(X0, 125, 4, FB - 125, 'wall')); L.push(r(X1 - 4, 125, 4, FB - 125, 'wallShade', { a: .8 }));
      // inside, behind everything: warm walls, a shelf of cups, lamps
      L.push(r(X0 + 4, FT, X1 - X0 - 8, FB - FT, 'inDark', { shade: grain('inDarkShade', .35, 'down', 1.4) }));
      for (x = X0 + 20; x < X1 - 10; x += 38) L.push(e(x, FT + 22, 1.6, 1.2, 'inLamp', { a: .8 }));
      L.push(r(X0 + 4, FT + 40, X1 - X0 - 8, 1.6, 'inShelf', { a: .8 })); for (x = X0 + 10; x < X1 - 10; x += 9) L.push(r(x, FT + 37, 3, 3, 'inCup', { a: .7 }));
      // the open doorway: a deep warm room, the barista at the machine
      var DX = 190, DW = 44, WY0 = FT + 16, WY1 = 218;
      L.push(r(DX, WY0, DW, FB - WY0, 'inDeep', { shade: grain('inWallShade', .4, 'down', 1.3) }));
      L.push(c(DX + 22, WY0 + 4, 2.2, 'inLamp'));
      F.push(r(DX + 2, 222, DW - 4, 3, 'inCounterTop', { shade: grain('woodShade', .25, 'down') })); F.push(r(DX + 2, 225, DW - 4, FB - 225 - 3, 'inCounter', { shade: grain('woodShade', .3, 'down') })); F.push(r(DX + 2, 225, DW - 4, .8, 'shadow', { a: .25 }));
      F.push(r(DX + 3, 209, 18, 13, 'inMachine', { r: [1.6, 1.6, .4, .4], shade: grain('inMachineShade', .35, 'right') })); F.push(r(DX + 3, 209, 18, 1.4, 'inChrome')); F.push(r(DX + 6, 215, 3, 2.4, 'inChrome')); F.push(r(DX + 14, 215, 3, 2.4, 'inChrome')); F.push(r(DX + 5, 206.6, 14, 2.4, 'inCup', { a: .9 }));   // the white machine on the counter
      L.push(r(DX + 4, 196, 30, 1.6, 'inShelf'));
      for (x = DX + 6; x < DX + 33; x += 5) L.push(r(x, 192.6, 3, 3.4, 'inCup'));   // cups on the back shelf
      L.push(r(DX + 2, FB - 3, DW - 4, 3, 'inFloor'));
      // the frame: weathered white-painted timber, full width
      var fr = function (x, y, w, h, k) { F.push(r(x, y, w, h, k || 'frame', { shade: grain('frameShade', .3, 'down') })); };
      // the transom: a row of small panes right across
      for (x = X0 + 4; x < X1 - 6; x += 22) { var tw = Math.min(22, X1 - 4 - x);
        F.push(r(x + 2.4, FT + 3, tw - 2.4, 10, 'transom', { shade: grain('inDarkShade', .3, 'down') })); F.push(poly([x + 4, FT + 3, x + 10, FT + 3, x + 6, FT + 13, x + 3, FT + 13], 'glassLight', { a: .16 })); fr(x, FT, 2.4, 16); }
      fr(X1 - 6, FT, 2.4, 16); fr(X0 + 4, FT, X1 - X0 - 8, 3); fr(X0 + 4, FT + 13, X1 - X0 - 8, 3);
      // left: the multi-pane windows, people sitting inside
      var WX0 = X0 + 6, WX1 = 186;
      [[WX0 + 16, 1], [WX0 + 46, -1], [WX0 + 92, 1], [DX + DW + 4 + 36 + 3 + 10, 1]].forEach(function (q) { var sx = q[1] > 0 ? q[0] - 1 : q[0] - 7;   // stools at the window bar
        L.push(r(sx, 204, 8, 1.6, 'inShelf')); L.push(r(sx + 3.4, 205.6, 1.2, 12, 'inShelf', { a: .8 })); L.push(r(sx + 1, 214, 6, .8, 'inShelf', { a: .6 })); });
      K.sitter(L, WX0 + 16, 204, 1.02, { coat: 'coatA', legs: 'legsDenim', hair: 'hairBrown', dir: 1, cup: true, rimA: .3 });   // two at the window, talking
      K.sitter(L, WX0 + 46, 204, 1.02, { coat: 'coatB', legs: 'legsDark', hair: 'hairDark', dir: -1, rimA: .3 });
      K.sitter(L, WX0 + 92, 204, .98, { coat: 'coatC', legs: 'legsDark', hair: 'hairDark', dir: 1, cup: true, rimA: .3 });
      L.push(r(WX0, WY0 + 36, WX1 - WX0, 2, 'inCounterTop')); L.push(r(WX0 + 30, WY0 + 33.4, 2.4, 2.6, 'inCup')); L.push(r(WX0 + 104, WY0 + 33.4, 2.4, 2.6, 'inCup'));   // the window bar
      F.push(r(WX0, WY0, WX1 - WX0, WY1 - WY0, 'glassT', { a: .14 })); sheen(F, WX0, WY0, WX1 - WX0, WY1 - WY0, { a: .14, at: .3, street: true, streetA: .06 });
      [[WX0, 56], [WX0 + 56, WX1 - WX0 - 56]].forEach(function (q) { var x0 = q[0], w = q[1];
        for (var k = 1; k < 4; k++) fr(x0 + w * k / 4 - 1, WY0, 2, WY1 - WY0);
        for (var gy = WY0 + (WY1 - WY0) / 3; gy < WY1 - 4; gy += (WY1 - WY0) / 3) fr(x0, gy - 1, w, 2);
        fr(x0, WY0, 3, WY1 - WY0); });
      fr(WX0, WY0, WX1 - WX0, 2.4); fr(WX1, WY0, 3, FB - WY0);
      // grey plank kick panels under the windows
      F.push(r(WX0, WY1, WX1 - WX0, FB - WY1, 'plank', { shade: grain('plankShade', .35, 'down', 1.3) }));
      for (y = WY1 + 4.6; y < FB; y += 4.6) F.push(r(WX0, y, WX1 - WX0, .7, 'plankShade', { a: .8 }));
      for (i = 0; i < 6; i++) F.push(r(WX0 + R() * (WX1 - WX0 - 10), WY1 + 2 + R() * 18, 6 + R() * 10, .5, 'plankLite', { a: .5 }));
      fr(WX0, WY1, WX1 - WX0, 2.4); fr(WX0, WY1, 3, FB - WY1); fr(WX0 + 56, WY1, 2.4, FB - WY1);
      // the doorway's posts
      fr(DX - 4, WY0, 4, FB - WY0); fr(DX + DW, WY0, 4, FB - WY0);
      // the door: glazed, a small OPEN sign and a paper note, a plank panel at the foot
      var DRX = DX + DW + 4, DRW = 36;
      L.push(r(DRX, WY0, DRW, 46, 'inDeep', { shade: grain('inWallShade', .3, 'down') }));
      F.push(r(DRX, WY0, DRW, 46, 'glassT', { a: .2 })); sheen(F, DRX, WY0, DRW, 46, { a: .14, at: .2, street: false });
      F.push(r(DRX + 4, WY0 + 8, 18, 9, 'openBoard', { r: .6 })); F.push({ t: 'text', text: 'OPEN', x: DRX + 13, y: WY0 + 14.6, size: 5.2, weight: 800, font: FONT, fill: 'openInk', align: 'center', ls: .2 });
      F.push(r(DRX + 25, WY0 + 6, 9, 12, 'note', { shade: grain('noteLine', .2, 'down') })); for (i = 0; i < 4; i++) F.push(r(DRX + 26.4, WY0 + 8 + i * 2.4, 6, .5, 'noteLine'));
      F.push(r(DRX, WY0 + 46, DRW, FB - WY0 - 46, 'plank', { shade: grain('plankShade', .35, 'down', 1.3) })); for (y = WY0 + 50; y < FB; y += 4.6) F.push(r(DRX, y, DRW, .7, 'plankShade', { a: .8 }));
      fr(DRX, WY0, DRW, 2.4); fr(DRX, WY0 + 44, DRW, 2.4); fr(DRX, WY0, 2.6, FB - WY0); fr(DRX + DRW - 2.6, WY0, 2.6, FB - WY0); fr(DRX, WY0 + 22, DRW, 1.4);
      // right: one more tall window, a customer and a small notice behind it
      var RX = DRX + DRW + 3, RW = X1 - 6 - RX;
      L.push(r(RX, WY0, RW, 50, 'inDark', { shade: grain('inWallShade', .3, 'down') }));
      K.sitter(L, RX + 10, 204, .98, { coat: 'coatD', legs: 'legsDenim', hair: 'hairDark', dir: 1, cup: true, rimA: .3 });
      F.push(r(RX, WY0, RW, 50, 'glassT', { a: .16 })); sheen(F, RX, WY0, RW, 50, { a: .14, at: .3, street: false });
      F.push(r(RX + 4, WY0 + 6, 9, 11, 'note', { a: .9 })); F.push(r(RX + 5.4, WY0 + 8, 6, .5, 'noteLine')); F.push(r(RX + 5.4, WY0 + 10.4, 5, .5, 'noteLine'));
      F.push(r(RX, WY0 + 50, RW, FB - WY0 - 50, 'plank', { shade: grain('plankShade', .35, 'down', 1.3) })); for (y = WY0 + 54; y < FB; y += 4.6) F.push(r(RX, y, RW, .7, 'plankShade', { a: .8 }));
      fr(RX, WY0, RW, 2.4); fr(RX, WY0 + 48, RW, 2.4); fr(RX - 3, WY0, 3, FB - WY0); fr(RX + RW - 2, WY0, 2.4, FB - WY0);
      F.push({ t: 'text', text: 'OPEN', x: X1 - 18, y: FT + 11.2, size: 5.4, weight: 700, font: FONT, fill: 'neon', align: 'center', ls: .4 });   // the little red neon OPEN
      // the step along the front
      F.push(r(X0 - 4, FB, X1 - X0 + 8, 4, 'step', { shade: grain('stepShade', .35, 'down') })); F.push(r(X0 - 4, FB, X1 - X0 + 8, 1, 'stepLite')); F.push(r(X0 - 4, FB + 4, X1 - X0 + 8, 1.2, 'shadow', { a: .2 }));
      // the lane: kerb with drain grates, the green pedestrian strip, the white line, the asphalt
      L.push(r(0, 244, 400, 56, 'asphalt', { shade: [grain('asphaltShade', .4, 'down', 1.2), grain('asphaltLite', .15, 'up')] }));
      L.push(r(0, 244, 400, 11, 'kerbTop', { shade: grain('stoneShade', .3, 'down') })); for (x = 6; x < 400; x += 30) L.push(r(x, 248, .6, 7, 'stoneShade', { a: .6 }));
      [150, 182, 214].forEach(function (gx) { K.grate(L, gx, 248.6, 30); L.push(r(gx, 248.6, 30, 5.4, 'grateGap', { a: .25 })); L.push(r(gx, 248.6, 30, .6, 'stoneLight', { a: .5 })); });
      L.push(r(0, 255, 400, 9, 'green', { shade: [grain('greenShade', .35, 'down', 1.2), grain('greenLite', .14, 'up')] }));
      for (i = 0; i < 9; i++) L.push(e(R() * 400, 256 + R() * 7, 10 + R() * 24, .6 + R() * 1, 'greenLite', { a: .2 }));   // worn paint
      for (i = 0; i < 16; i++) L.push(e(R() * 400, 270 + R() * 28, 6 + R() * 18, .5 + R() * .8, R() > .5 ? 'asphaltLite' : 'asphaltShade', { a: .25 }));   // the asphalt's patches and seams
      L.push(r(0, 264, 400, 2.4, 'lineW', { shade: grain('lineShade', .3, 'down') }));
      F.push(r(0, 244, 400, 1.2, 'kerb', { a: .6 }));
      K.cone(F, X0 - 10, 249, .95);                // a small orange cone at the left corner
      vending(F, 352, 254, { w: 26, h: 48, seed: 13 });
      // wires from the poles beyond the frame
      [[0, 14, 200, 26, 400, 10], [0, 30, 120, 40, 334, 34], [334, 34, 400, 22], [0, 120, 30, 108, 70, 96]].forEach(function (w) { P.push(line(w, 'wire', .7, { a: .8 })); });
    } });
})();
