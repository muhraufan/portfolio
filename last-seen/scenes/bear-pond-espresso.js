/* Scene — bear-pond-espresso. Needs /last-seen/last-seen.js and /last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, grain = K.grain, rnd = K.rnd, mix = K.mix;
  var make = K.make, pavement = K.pavement, contact = K.contact, sheen = K.sheen, vending = K.vending, ac = K.ac, pipe = K.pipe, plant = K.plant, FONT = K.FONT;
  /* ================= Bear Pond Espresso — Shimokitazawa (Oct 31, 15:45), a clear afternoon =================
     the little espresso bar in an old two-storey corner shop on Shimokita's Ichibangai (it was a sweet shop, Otsuki
     Shoten): the walls painted white over the old building, a short tin eave, a dark wooden sash front with the bar's
     window, the white espresso machine on the counter inside, the sliding glass door with Curtis Kulig's red
     "LOVE ME" dripping down it, the built-in bench along the wall, the small black name board. Upstairs the old
     flat's windows and an AC unit; the building turns the corner on the right, a drinks machine at its foot, a
     utility pole and its wires over the lane. With Raufan: his wife and their son. */
  var FT = 146, FB = 244, WX = 66, WW = 92, DX = 172, DW = 44;
  var PEOPLE = { rfTop: '#9aa294', rfPants: '#2a2a2b', rfCrown: '#d9762e', rfBrim: '#4f6a8c', rfShoe: '#e4e3df', rfSole: '#f5f4f0', rfShoeMark: '#a9a9a6',
    wfHijab: '#c9b08b', wfShades: '#1c1a19', wfTop: '#f3f1ec', wfStripe: '#1f1f21', wfPants: '#6d6b47', wfShoe: '#efeeea', wfSole: '#f8f8f4', wfShoeMark: '#8e96a3', wfBag: '#b59c72',
    snCap: '#f4f3ef', snTee: '#f3f2ec', snStripe: '#4f8d58', snPants: '#cfba95', snShoe: '#4a4b50', snSole: '#77787c' };
  function tonePeople(t, k) { var o = {}; Object.keys(PEOPLE).forEach(function (n) { o[n] = mix(PEOPLE[n], t, k); }); return o; }
  make('bear-pond-espresso', { seed: 1031, seenAt: '2026-10-31T15:45:00+09:00',
    place: { en: 'Bear Pond Espresso', ja: 'ベアポンド エスプレッソ' }, name: { en: 'Bear Pond Espresso', ja: 'ベアポンド エスプレッソ' }, area: { en: 'Shimokitazawa, Tokyo', ja: '東京・下北沢' },
    alt: 'Illustration of Bear Pond Espresso in Shimokitazawa on a clear afternoon: a small white-painted two-storey corner shop with a short tin eave, a dark wooden front with the espresso bar\'s window and a white espresso machine inside, a sliding glass door with red dripping "LOVE ME" lettering, a wooden bench along the wall, a drinks machine at the corner and a utility pole with wires over the lane.',
    palette: Object.assign({ sky: '#79b0de', skyShade: '#b2d1ee', cloudLite: '#f6f9fc', sunWash: '#fff3d6',
      wall: '#eeeae1', wallShade: '#d3ccbf', wallLite: '#faf8f3', wallStain: '#bdb4a4', parapet: '#e2ddd2', eave: '#80838a', eaveShade: '#5c5f66', eaveLite: '#a7aab0',
      wood: '#4f3d30', woodShade: '#35291f', woodLite: '#76604c', glassT: '#55656f', board: '#1d1c1b', boardInk: '#f2eee5', loveRed: '#c9322a', loveRedD: '#9a221c',
      win: '#86a3bb', win2: '#7d93a6', winFrame: '#b9bdc0', winFrameD: '#8f9498', rail: '#6b6f74', curtain: '#e9e1cf',
      side: '#d6cfc2', sideShade: '#bdb5a7', nb: '#b9a88f', nbShade: '#9d8b72', nbWin: '#6f7f8c', shutter: '#a6a8a8', shutterLine: '#8a8c8c', nbSign: '#2f5d7c', nbSignInk: '#f2ede2',
      far: '#cdbfa9', farShade: '#b3a48c', farWin: '#71808c', farSignA: '#d0563f', farSignB: '#e2b443',
      lampHead: '#e9e6dc', pole: '#a29d94', poleShade: '#837e76', wire: '#3a3a3c', trans: '#8d9196', benchW: '#8b6b4d', benchWD: '#6a5039', chalk: '#2b2e2c', chalkInk: '#e9e6dc', chalkFrame: '#8b6b4d',
      inWall: '#efe2c8', inWallShade: '#d8c4a0', inShelf: '#7a5b40', inCup: '#f7f3ea', inCounter: '#6c5442', inCounterTop: '#a88663', inMachine: '#f5f3ee', inMachineShade: '#cdc8be',
      inChrome: '#b9bec3', inLamp: '#fff3d6', inHair: '#2b2623', inShirt: '#2f3236', inBag: '#c9a26a', inBag2: '#8f6e4c' }, PEOPLE),
    light: { shadowAt: [[60, 100], [220, 90]],
      morning: { set: Object.assign({ sky: '#a8cdee', skyShade: '#cfe2f3', wall: '#eceae4', wallShade: '#cfccc5', win: '#9fb7cb' }, tonePeople('#cbd8e2', .1)),
        add: { back: [r(0, 0, 400, 140, 'sunWash', { a: .12 }), poly([60, 30, 300, 30, 300, 146, 60, 146], 'sunWash', { a: .08 })],
               front: [poly([300, 246, 344, 246, 400, 262, 356, 262], 'shadow', { a: .12 })] } },
      midday: { add: { back: [r(WX - 6, FT, 300 - WX + 6, 4, 'shadow', { a: .2 })], front: [e(200, 247, 90, 3, 'shadow', { a: .12 })] } },
      golden: { set: Object.assign({ sky: '#eac29c', skyShade: '#f4d6b4', wall: '#f3dcc0', wallShade: '#d6b896', wallLite: '#fde9cf', parapet: '#efd2b2', side: '#cfa98a', sideShade: '#b38f71',
          win: '#e2b48b', win2: '#c79a7c', nb: '#c9a888', far: '#e3bf98', eave: '#8d847c', eaveLite: '#d8b896' }, tonePeople('#f0b07e', .12)),
        add: { back: [r(0, 0, 400, 140, 'sunWash', { a: .26 }), r(298, 30, 3, 214, 'rim', { a: .6 }), r(60, 30, 1.6, 214, 'rim', { a: .4 })] } },
      night: { set: Object.assign({ sky: '#111729', skyShade: '#0c1122', wall: '#2c2b2f', wallShade: '#202025', wallLite: '#3a383a', wallStain: '#1a1a1e', parapet: '#26262b',
          win: '#e8c27f', win2: '#1b2232', winFrame: '#3c3c40', winFrameD: '#26262a', curtain: '#f0cf93', glassT: '#2a2218', side: '#232329', sideShade: '#1a1a20',
          nb: '#29262a', nbShade: '#1d1b1f', nbWin: '#e2bf82', far: '#24252e', farWin: '#2b303d', farSignA: '#ff8a6a', farSignB: '#ffd27a', loveRed: '#b8423a',
          lampHead: '#ffe3ad', board: '#121212', boardInk: '#f5e6c8', pole: '#2a2a2e', poleShade: '#1c1c20', wire: '#0a0a0c', wood: '#1f1914', woodShade: '#140f0c', woodLite: '#3a2e24', eave: '#25262b', eaveLite: '#3a3a40',
          benchW: '#3a2c20', benchWD: '#261c14', chalk: '#141615', chalkInk: '#9c9a92' }, tonePeople('#0d1124', .62)),
        add: { over: [{ t: 'halo', x: WX + WW / 2, y: 238, rx: 60, ry: 9, n: 5, fill: 'pool', a: .06 }, { t: 'halo', x: DX + DW / 2, y: 246, rx: 40, ry: 8, n: 5, fill: 'pool', a: .07 },
          { t: 'halo', x: 200, y: 254, rx: 150, ry: 12, n: 6, fill: 'pool', a: .035 }, { t: 'halo', x: 122, y: 87, rx: 40, ry: 30, n: 5, fill: 'pool', a: .03 },
          { t: 'halo', x: 333, y: 96, rx: 10, ry: 9, n: 5, fill: 'lamp', a: .12 }, { t: 'halo', x: 330, y: 268, rx: 46, ry: 7, n: 5, fill: 'pool', a: .05 }] } } },
    breathe: { x: WX + 8, y: 160, w: WW - 16, h: 50, c: 'breathe', a: .045 },
    passersby: [{ start: 9, every: 25, dir: -1, speed: 22, foot: 286, s: 1.22, coat: 'coatC', legs: 'legsDenim', hair: 'hairDark', carry: 'tote', carryC: 'bagMark' },
                { start: 17, every: 29, dir: 1, speed: 20, foot: 278, s: 1.14, coat: 'coatB', legs: 'legsDark', hair: 'hairBrown', carry: 'backpack', carryC: 'coatD' }],
    stamp: { x0: 52, x1: 316, y0: 26, y1: 274 },
    ground: { y0: 250, y1: 296, xMin: 8, xMax: 392 },
    sig: { emerge: { x: DX + DW / 2, foot0: 240, foot1: 266, s0: .84, s1: 1.24, dur: 1.3 },
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
      L.push(e(40, 22, 14, 2.6, 'cloudLite', { a: .7 })); L.push(e(52, 25, 9, 1.8, 'cloudLite', { a: .6 })); L.push(e(372, 14, 10, 2, 'cloudLite', { a: .6 }));
      // down the lane beyond the corner: low shops, signs, more wires
      L.push(r(338, 96, 62, 148, 'far', { shade: grain('farShade', .3, 'down') }));
      for (y = 106; y < 180; y += 16) for (x = 344; x < 396; x += 11) L.push(r(x, y, 6, 8, R() > .75 ? 'win' : 'farWin', { a: .85 }));
      L.push(r(342, 184, 26, 9, 'farSignA')); L.push(r(372, 182, 22, 11, 'farSignB')); L.push(r(338, 196, 62, 48, 'farShade', { a: .35 }));
      L.push(r(338, 196, 62, 2, 'eave', { a: .7 }));
      // the neighbour on the left: tan tiles, a shutter, a sign
      L.push(r(0, 58, 62, 186, 'nb', { shade: grain('nbShade', .3, 'right', 1.4) }));
      for (y = 62; y < 150; y += 4) L.push(r(0, y, 62, .5, 'nbShade', { a: .35 }));
      L.push(r(8, 74, 40, 30, 'nbWin', { r: .6 })); L.push(r(8, 74, 40, 2, 'winFrameD')); L.push(r(27, 74, 1.4, 30, 'winFrameD')); L.push(poly([10, 76, 22, 76, 10, 92], 'skyShade', { a: .35 }));
      L.push(r(4, 150, 54, 12, 'nbSign')); L.push({ t: 'text', text: '古着', x: 31, y: 159, size: 7, weight: 700, font: FONT, fill: 'nbSignInk', align: 'center' });
      L.push(r(4, 164, 54, 80, 'shutter', { shade: grain('shutterLine', .3, 'down') })); for (y = 166; y < 214; y += 3) L.push(r(4, y, 54, .6, 'shutterLine', { a: .6 }));
      L.push(r(4, 214, 54, 30, 'woodShade', { a: .55 })); L.push(r(4, 214, 54, 1.4, 'shadow', { a: .2 }));
      // the shop: an old two-storey building painted white, the parapet catching the light
      L.push(r(60, 30, 240, 214, 'wall', { shade: [grain('wallShade', .3, 'down', 1.4)] }));
      L.push(r(56, 26, 248, 6, 'parapet', { shade: grain('wallShade', .35, 'down') })); L.push(r(56, 26, 248, 1, 'wallLite')); L.push(r(56, 32, 248, 1.4, 'shadow', { a: .14 }));
      for (i = 0; i < 7; i++) L.push(e(70 + R() * 220, 40 + R() * 90, 6 + R() * 10, 1 + R() * 2, 'wallStain', { a: .06 + R() * .06 }));   // old paint, never quite even
      L.push(r(60, 30, 1.4, 214, 'wallLite', { a: .8 })); L.push(r(296, 30, 4, 214, 'wallShade', { a: .7 }));
      // upstairs: the old flat's two windows, aluminium sashes, a curtain, a little railing
      [[86, 'win'], [196, 'win2']].forEach(function (w, k) { var wx = w[0];
        L.push(r(wx - 3, 56, 70, 56, 'winFrameD', { r: .6 })); L.push(r(wx, 59, 64, 50, w[1], { shade: grain('winFrameD', .25, 'down') }));
        if (!k) { L.push(r(wx + 2, 60, 20, 48, 'curtain', { shade: grain('wallShade', .3, 'right') })); }
        L.push(poly([wx + 34, 59, wx + 50, 59, wx + 34, 84], 'skyShade', { a: .3 })); L.push(poly([wx + 54, 59, wx + 58, 59, wx + 44, 100, wx + 40, 100], 'glassLight', { a: .2 }));
        L.push(r(wx + 31, 59, 2, 50, 'winFrame')); L.push(r(wx - 3, 56, 70, 2, 'winFrame')); L.push(r(wx - 4, 111, 72, 2.4, 'winFrame')); L.push(r(wx - 4, 113.4, 72, 1.2, 'shadow', { a: .18 }));
        for (x = wx - 2; x < wx + 66; x += 4) L.push(r(x, 96, .8, 15, 'rail')); L.push(r(wx - 3, 95, 70, 1.4, 'rail')); });
      ac(L, 270, 74, 22); pipe(L, 290, 34, 244);
      // a short tin eave over the shop front, its shadow on the wall
      L.push(poly([58, 132, 302, 132, 306, 146, 54, 146], 'eave', { shade: grain('eaveShade', .35, 'down') })); L.push(r(54, 145, 252, 2, 'eaveShade'));
      for (x = 62; x < 302; x += 6) L.push(r(x, 133, .8, 12, 'eaveShade', { a: .45 })); L.push(r(58, 132, 244, 1, 'eaveLite'));
      L.push(r(60, 147, 236, 5, 'shadow', { a: .16 }));
      // the name board: small, black, white lettering, as understated as the place
      L.push(r(98, 117, 104, 13, 'board', { r: .5 })); L.push({ t: 'text', text: 'BEAR POND ESPRESSO', x: 150, y: 126.2, size: 6.2, weight: 800, font: FONT, fill: 'boardInk', align: 'center', ls: .7 });
      L.push(r(98, 129, 104, 1, 'shadow', { a: .25 }));
      // the shop front: a dark wooden frame
      L.push(r(WX - 4, FT + 4, DX + DW - WX + 8, FB - FT - 4, 'wood', { shade: grain('woodShade', .4, 'down', 1.3) }));
      // the bar's window: the espresso machine on the counter, cups on a shelf, the barista behind it
      var gx = WX + 3, gy = 156, gw = WW - 6, gh = 58;
      L.push(r(gx, gy, gw, gh, 'inWall', { shade: grain('inWallShade', .3, 'down', 1.4) }));
      L.push(r(gx, gy + 12, gw, 2, 'inShelf')); for (x = gx + 4; x < gx + gw - 4; x += 5) L.push(r(x, gy + 8.4, 3, 3.6, 'inCup', { r: [.3, .3, 1, 1] }));
      L.push(r(gx + 6, gy + 3, 1, 5, 'inShelf', { a: .6 })); L.push(c(gx + 60, gy + 5, 2.4, 'inLamp')); L.push(r(gx + 59.6, gy, .8, 3, 'inShelf'));
      [[gx + 66, gy + 16, 'inBag'], [gx + 73, gy + 16, 'inBag2']].forEach(function (b) { L.push(r(b[0], b[1], 6, 9, b[2], { r: [.4, .4, 1, 1] })); });   // bags of beans
      L.push(r(gx, gy + 37, gw, 3.4, 'inCounterTop')); L.push(r(gx, gy + 40.4, gw, gh - 40.4, 'inCounter', { shade: grain('woodShade', .3, 'down') }));
      // the espresso machine: white, rounded, three chrome group heads
      var mx = gx + 14, my = gy + 18;
      L.push(r(mx, my, 44, 19, 'inMachine', { r: [2.4, 2.4, .6, .6], shade: grain('inMachineShade', .35, 'right', 1.4) })); L.push(r(mx, my, 44, 2.2, 'inChrome', { r: [2.4, 2.4, 0, 0] }));
      for (i = 0; i < 3; i++) { L.push(r(mx + 7 + i * 13, my + 11, 5, 3, 'inChrome', { r: .6 })); L.push(r(mx + 8.4 + i * 13, my + 14, 2.2, 2.4, 'inShelf')); }
      L.push(r(mx + 2, my - 3, 40, 3, 'inCup', { a: .9 })); L.push(r(mx + 3, my + 5, 38, .8, 'inMachineShade'));
      L.push(c(gx + 64, gy + 26, 2.4, 'inHair')); L.push(r(gx + 60.6, gy + 28.6, 7, 9, 'inShirt', { r: [2, 2, 0, 0] }));   // the barista
      L.push(r(gx, gy, gw, gh, 'glassT', { a: .12 })); sheen(L, gx, gy, gw, gh, { a: .15, at: .22, street: true, streetA: .08 });
      L.push(r(WX + WW / 2 - 1, gy, 2, gh, 'wood'));   // the centre mullion
      L.push(r(gx, gy + gh, gw, 2.4, 'woodLite')); L.push(r(gx, gy - 1.4, gw, 1.4, 'woodShade'));
      // under the window: the wall and the built-in bench
      L.push(r(WX - 4, 217, WW + 8, 27, 'wall', { shade: grain('wallShade', .35, 'down') }));
      // the sliding door: wooden rails, small panes, and "LOVE ME" in red, dripping
      L.push(r(DX, FT + 8, DW, FB - FT - 8, 'inWall', { shade: grain('inWallShade', .3, 'down') }));
      L.push(r(DX + 6, FT + 22, DW - 12, 18, 'inShelf', { a: .35 })); L.push(r(DX + 4, 214, DW - 8, 30, 'inCounter', { a: .7 }));
      L.push(r(DX, FT + 8, DW, FB - FT - 8, 'glassT', { a: .14 })); sheen(L, DX, FT + 8, DW, FB - FT - 8, { a: .14, at: .4, street: true, streetA: .08 });
      F.push(r(DX - 2, FT + 6, DW + 4, 3, 'woodLite')); F.push(r(DX - 2, FT + 6, 3, FB - FT - 6, 'wood')); F.push(r(DX + DW - 1, FT + 6, 3, FB - FT - 6, 'woodShade'));
      F.push(r(DX + DW / 2 - 1.2, FT + 6, 2.4, FB - FT - 6, 'wood')); F.push(r(DX, 226, DW, 3, 'wood')); F.push(r(DX, FB - 3, DW, 3, 'woodShade'));
      F.push(r(DX, 190, DW, 1.2, 'wood', { a: .9 }));
      [[DX + 3, 'LOVE'], [DX + DW / 2 + 1.6, 'ME']].forEach(function (q, k) {
        F.push({ t: 'text', text: q[1], x: q[0] + (k ? 2 : 0), y: 182, size: k ? 9 : 8, weight: 800, font: '"Marker Felt", "Comic Sans MS", ' + FONT, fill: 'loveRed', align: 'left', ls: -.2 }); });
      [[DX + 5, 9], [DX + 9.5, 16], [DX + 14, 6], [DX + 18, 12], [DX + 26, 20], [DX + 31, 8], [DX + 36, 14]].forEach(function (d) {
        F.push(r(d[0], 181, .7, d[1], 'loveRed', { a: .85 })); F.push(c(d[0] + .35, 181 + d[1], .7, 'loveRedD', { a: .85 })); });
      // the right of the front: white wall, a small window, the menu chalkboard leaning on it
      L.push(r(226, 160, 34, 30, 'wood')); L.push(r(228, 162, 30, 26, 'inWall', { shade: grain('inWallShade', .3, 'down') })); L.push(r(228, 162, 30, 26, 'glassT', { a: .14 }));
      L.push(r(242, 162, 1.6, 26, 'wood')); sheen(L, 228, 162, 30, 26, { a: .14, at: .3, street: false });
      L.push(r(230, 170, 10, 6, 'inBag', { a: .7 }));
      // the bench along the wall, under the window
      contact(F, 112, 244, 52, .16);
      F.push(r(WX - 6, 224, WW + 12, 4, 'benchW', { shade: grain('benchWD', .35, 'down') })); F.push(r(WX - 6, 224, WW + 12, .9, 'woodLite', { a: .8 })); F.push(r(WX - 6, 228, WW + 12, 1.6, 'shadow', { a: .2 }));
      [WX - 2, WX + WW / 2 - 2, WX + WW - 2].forEach(function (bx) { F.push(r(bx, 228, 4, 16, 'benchWD')); });
      F.push(r(WX + 20, 220, 3.4, 4, 'cup', { r: [.4, .4, 1, 1] }));   // someone's espresso, left on the bench
      // the chalkboard
      F.push(poly([234, 244, 238, 202, 262, 202, 266, 244], 'chalkFrame')); F.push(poly([237, 240, 240, 205, 260, 205, 263, 240], 'chalk', { shade: grain('board', .3, 'down') }));
      for (i = 0; i < 5; i++) F.push(r(242, 211 + i * 6, 12 - (i % 2) * 4, .8, 'chalkInk', { a: .8 }));
      contact(F, 250, 244, 18, .16);
      plant(F, 280, 244, 1.25, 7, { tall: 1.2 });
      // the corner: the side wall turning away, a drinks machine at its foot
      L.push(poly([300, 30, 338, 44, 338, 244, 300, 244], 'side', { shade: grain('sideShade', .35, 'right') }));
      L.push(poly([300, 26, 338, 40, 338, 44, 300, 32], 'parapet')); L.push(poly([302, 64, 330, 70, 330, 108, 302, 104], 'winFrameD')); L.push(poly([304, 67, 328, 72, 328, 105, 304, 101], 'win2', { a: .9 }));
      L.push(poly([300, 132, 338, 140, 338, 150, 300, 146], 'eaveShade'));
      vending(F, 306, 246, { w: 26, h: 48, seed: 13 });
      // the lane: a utility pole with its transformer and the wires that are the real Shimokita sky
      P.push(r(350, 0, 6, 266, 'pole', { shade: grain('poleShade', .45, 'right') })); P.push(r(350, 0, 1, 266, 'wallLite', { a: .4 })); contact(P, 353, 266, 8, .2);
      P.push(r(343, 40, 20, 26, 'trans', { r: 3, shade: grain('poleShade', .35, 'right') })); P.push(r(345, 70, 16, 2, 'poleShade'));
      for (y = 110; y < 240; y += 12) P.push(r(352, y, 2, 1, 'poleShade'));
      P.push(line([351, 90, 342, 86, 336, 90], 'pole', 1.4)); P.push(r(329, 89.6, 9, 3.4, 'lampHead', { r: [1.6, 1.6, .6, .6] })); P.push(r(329, 89.6, 9, 1, 'poleShade', { a: .6 }));   // the street light on the pole
      P.push(r(351, 180, 4, 22, 'farSignB', { a: .9 })); P.push(r(351.6, 184, 2.8, 1, 'shadow', { a: .4 })); P.push(r(351.6, 190, 2.8, 1, 'shadow', { a: .4 }));
      [[0, 8, 200, 22, 400, 6], [0, 16, 180, 28, 353, 44], [353, 44, 400, 50], [0, 40, 50, 46], [353, 60, 400, 66]].forEach(function (w) {
        P.push(line(w, 'wire', .7, { a: .85 })); });
      pavement(L, F, { seed: 31, stains: 4 });
    } });
})();
