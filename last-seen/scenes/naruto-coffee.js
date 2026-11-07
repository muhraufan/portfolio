/* Scene — naruto-coffee. Needs /last-seen/last-seen.js and /last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, rnd = K.rnd, mix = K.mix;
  var make = K.make, contact = K.contact, sheen = K.sheen, vending = K.vending, ac = K.ac, pipe = K.pipe, plant = K.plant, FONT = K.FONT;
  /* ================= NARUTO COFFEE — Izumi-Tamagawa, Komae (Nov 7, 16:55), with Brian =================
     seen from across the lane: the ground floor of a small tiled apartment block. Upstairs, a covered balcony with a white
     railing, washing on a pole and the drying hangers hanging from the slab, sliding windows and an AC unit behind it.
     Downstairs the roastery cafe: a pale timber shopfront, a lit display case of muffins and coffee bags, bookshelves,
     an open door into the long warm room (a picture on the wall, stools and little tables, a palm), a lit sign box on the
     timber post (the whirlpool mark and an orange NARUTO COFFEE panel) with notices pinned under it, a bench, a red brick
     apron with a doormat and a manhole, a big timber A-frame bike rail, a neighbour's grey shutter with a scooter, a
     white door in a recess with its ceiling light. A clear late afternoon. */
  var SX0 = 100, SX1 = 316, ST = 156, SB = 236;          // the shopfront
  var PEOPLE = { rfHoodie: '#262628', rfString: '#47474b', rfCap: '#8a5a32', rfPants: '#bba582', rfShoe: '#c9cbc8', rfSole: '#f1f0eb', rfShoeMark: '#2c2f36',
    brTop: '#232325', brPants: '#1d1d20', brShoe: '#a3a892', brSole: '#e9e7de', frames: '#1f1f22' };
  function tonePeople(t, k) { var o = {}; Object.keys(PEOPLE).forEach(function (n) { o[n] = mix(PEOPLE[n], t, k); }); return o; }
  function swirl(A, x, y, s, fill, o) {   // the whirlpool mark: a spiral, a cup under it
    var pts = []; for (var a = 0; a < Math.PI * 5.2; a += .3) { var rr = .25 + a * .2; pts.push(x + Math.cos(a) * rr * s, y + Math.sin(a) * rr * s * .9); }
    A.push(line(pts, fill, .55 * s, o));
  }
  make('naruto-coffee', { seed: 1107, seenAt: '2026-11-07T16:55:00+09:00',
    place: { en: 'NARUTO COFFEE', ja: 'ナルトコーヒー' }, name: { en: 'NARUTO COFFEE', ja: 'ナルトコーヒー' }, area: { en: 'Izumi-Tamagawa, Komae', ja: '狛江・和泉多摩川' },
    alt: 'Illustration of NARUTO COFFEE in Izumi-Tamagawa, Komae: the ground floor of a small tiled apartment block with washing on the balcony rail above, a pale timber shopfront with a lit display case of muffins and coffee bags, an open door into a long warm room with stools and a palm, a lit sign box on a timber post, a bench, a red brick apron and a big timber bike rail, with Raufan in a brown cap and black hoodie and Brian in black.',
    palette: Object.assign({ sky: '#77b2e3', skyShade: '#acd1f0', cloudLite: '#f6f9fc', sunWash: '#fff3d6', back: '#c3c6c8', backShade: '#a9adb0',
      tile: '#d9d6cf', tileShade: '#bdb9b1', tileJoint: '#c4c0b8', tileLite: '#e9e7e2', slab: '#eeece7', slabShade: '#cfccc4', slabLite: '#f9f8f5', soffit: '#d3d0c8',
      rail: '#f2f2ef', railShade: '#c9cac7', alu: '#c8cacb', aluShade: '#9fa3a6', win: '#90a6b6', win2: '#90a6b6', winShade: '#73889a', curtain: '#e8e2d4', curtain2: '#d6d0c2',
      pole: '#5f9a8c', hanger: '#565a5e', wash1: '#f2f1ec', wash2: '#2a2a2d', wash3: '#6f9fc7', wash4: '#b9bcc0', wash5: '#d9cfbd', wash6: '#3b3e45', washShade: '#000000',
      shutter: '#a9b4b9', shutterShade: '#8b979d', shutterLite: '#c4cdd1', shutterBox: '#9aa4a9',
      wood: '#c9a473', woodShade: '#a17f52', woodLite: '#e2c79c', woodDark: '#7f6142', post: '#8f6c46', postShade: '#6c5034',
      glassT: '#5d6c74', paperW: '#f1ede2', paperLine: '#a9a293', posterA: '#3f4650', posterB: '#c45c45',
      signLogo: '#f3ead8', signInk: '#3a2e25', signOrange: '#e0873a', signOrangeInk: '#3b2516', signBox: '#5e4632', signGlow: 'rgba(0,0,0,0)',
      brick: '#b5644a', brickShade: '#9a503a', brickLite: '#c9785c', brickJoint: '#d8b9a2', mat: '#5a5856', matShade: '#454442',
      kerbTop: '#c5c2bb', kerbJoint: '#a9a59e', asphalt: '#6c6e71', asphaltShade: '#5a5c5f', asphaltLite: '#87898c', lineW: '#eeeeea', lineShade: '#cfcfca',
      doorW: '#ecebe7', doorShade: '#cdccc6', recess: '#bdbab3', domeLamp: '#f4f1e8', lamp: '#fff6df',
      rack: '#b08a5c', rackShade: '#86663f', rackLite: '#d4b385', bench: '#8d6a45', benchShade: '#694d31',
      scooter: '#9cc3dc', scooterShade: '#76a0bb', scooterSeat: '#2d2e31', tyre: '#2a2a2c', wire: '#3a3a3c',
      inWall: '#ead3a6', inWallShade: '#cfb07c', inDeep: '#e8c992', inFloor: '#cdb48d', inFloorShade: '#b39a73', inShelf: '#b48b5a', inShelfShade: '#8e6a41', inWood: '#d6b07a',
      inCase: '#f6dfaa', inCaseShade: '#e2c27e', inMuffin: '#c98d4f', inMuffin2: '#a8693a', inBag: '#efe6d2', inBagInk: '#3f3a34', inBook1: '#8a4f3c', inBook2: '#4d6680', inBook3: '#c9b48a', inBook4: '#5f6b4f',
      inLamp: '#fff3d6', inPic: '#6d8aa0', inPicFrame: '#9c7a52', inStool: '#d79a52', inStoolShade: '#b07a3a', inTable: '#c9a06a', inPalm: '#6f8f4f', inPalm2: '#89a862', inCup: '#f7f3ea',
      inBlue: '#5d86b8', inRed: '#d0473b', inHair: '#2b2623', inShirt: '#3a3c40', inShirt2: '#d9d6cf', inShirt3: '#7d8a99', bariTee: '#2c2d30', bariApron: '#4a3a2c' }, PEOPLE),
    light: { shadowAt: [[20, 70], [250, 110]],
      morning: { set: Object.assign({ sky: '#b4d3ee', skyShade: '#dbe8f3', back: '#c4cbd1', tile: '#cdd3d6', tileShade: '#b2b9bd', tileJoint: '#bcc3c7', tileLite: '#e1e6e8', slab: '#e4e9ec', slabShade: '#c3cacf', rail: '#eaf0f3', railShade: '#c2c9ce',
          soffit: '#c9cfd2', brick: '#a8655a', brickShade: '#8f5249', kerbTop: '#c0c5c7', shutter: '#a3b2bc', win: '#9db6c9', win2: '#9db6c9', curtain: '#e6e4dc' }, tonePeople('#cbd8e2', .1)),
        add: { back: [poly([0, 32, 120, 32, 40, 106, 0, 106], 'sunWash', { a: .22 }), poly([120, 32, 400, 32, 400, 106, 40, 106], 'shadow', { a: .12 }),   // the low sun from the left lights only the balcony's near end
                      r(0, 118, 400, 6, 'shadow', { a: .14 }), poly([0, 118, 90, 118, 30, 150, 0, 150], 'sunWash', { a: .2 }), r(SX0, ST, SX1 - SX0, 6, 'shadow', { a: .16 }), r(0, 62, 120, 1, 'rim', { a: .8 })],
               front: [poly([258, 258, 300, 258, 396, 264, 352, 264], 'shadow', { a: .14 }), poly([366, 258, 396, 258, 400, 261, 400, 264], 'shadow', { a: .12 })] } },
      midday: { set: { sky: '#6caee6', skyShade: '#a6cef1' }, add: { back: [r(0, 32, 400, 14, 'shadow', { a: .2 }), r(0, 46, 400, 8, 'shadow', { a: .08 }), r(0, 118, 400, 7, 'shadow', { a: .16 }), r(0, 150, 400, 7, 'shadow', { a: .2 }),
                      r(0, 106, 400, 1.2, 'rim', { a: .7 }), r(0, 20, 400, 1.2, 'rim', { a: .7 })],
                       front: [e(208, 268, 70, 2.4, 'shadow', { a: .07 })] } },
      golden: { set: Object.assign({ sky: '#e9ad7c', skyShade: '#f3cda4', back: '#c9a58c', tile: '#e9cba8', tileShade: '#c9a27c', tileJoint: '#d4b38e', tileLite: '#f6dcbc', slab: '#f8dcba', slabShade: '#d9bd9c', slabLite: '#fdeed8', soffit: '#ddc4a6',
          rail: '#f8e6cf', railShade: '#d8bea0', shutter: '#b9b0a6', shutterShade: '#9a9086', brick: '#c26a48', kerbTop: '#d1b79c', asphalt: '#776c68', back: '#cdb7a3', win: '#c9a988', win2: '#c9a988', winShade: '#a88a6c' }, tonePeople('#f0b07e', .12)),
        add: { back: [r(0, 0, 400, 150, 'sunWash', { a: .08 }), poly([400, 32, 230, 32, 330, 106, 400, 106], 'shadow', { a: .2 }), poly([0, 32, 230, 32, 330, 106, 0, 106], 'skyGlow', { a: .12 }), poly([400, 118, 300, 118, 360, 150, 400, 150], 'shadow', { a: .12 }), r(0, 118, 400, 6, 'shadow', { a: .14 }), r(SX0, ST, SX1 - SX0, 5, 'shadow', { a: .14 }),
                      r(0, 106, 400, 1.4, 'rim', { a: .9 }), r(0, 62, 400, 1, 'rim', { a: .8 }), r(0, 20, 400, 1.4, 'rim', { a: .8 }), r(0, 236, 400, 1.2, 'rim', { a: .4 })],
               front: [poly([240, 258, 380, 258, 330, 266, 190, 266], 'shadow', { a: .12 })],
               over: [{ t: 'halo', x: 82, y: 162, rx: 18, ry: 12, n: 4, fill: 'signOrange', a: .05 }] } },
      night: { set: Object.assign({ sky: '#111729', skyShade: '#0c1122', back: '#1f2129', backShade: '#181a21',
          tile: '#2c2d33', tileShade: '#222329', tileJoint: '#27282e', tileLite: '#35363c', slab: '#34353a', slabShade: '#26272c', slabLite: '#3e3f44', soffit: '#2a2b30',
          rail: '#4a4b50', railShade: '#36373c', alu: '#3d4046', aluShade: '#2a2c31', win: '#e6c07e', win2: '#2b303d', winShade: '#c49a5a', curtain: '#f1cf8e', curtain2: '#dcb06c',
          pole: '#2f4a44', hanger: '#1c1d20', wash1: '#6d6c68', wash2: '#151517', wash3: '#2f4660', wash4: '#4b4d51', wash5: '#5a5348', wash6: '#1c1e23',
          shutter: '#2b3034', shutterShade: '#202428', shutterLite: '#353b40', shutterBox: '#262b2f',
          wood: '#6b5236', woodShade: '#4c3923', woodLite: '#8a6c48', woodDark: '#3b2b1b', post: '#3d2d1d', postShade: '#2a1f14',
          paperW: '#cfc2a4', paperLine: '#8a7f68', posterA: '#23272d', posterB: '#6a3428',
          signLogo: '#ffeccb', signInk: '#4a3524', signOrange: '#ffa04a', signOrangeInk: '#4a2a12', signBox: '#2c2016', signGlow: 'rgba(255,190,120,.9)',
          brick: '#3a2620', brickShade: '#2c1c17', brickLite: '#4a3027', brickJoint: '#4b3a31', mat: '#1e1d1c', matShade: '#151414',
          kerbTop: '#25272d', kerbJoint: '#1b1c21', asphalt: '#17191f', asphaltShade: '#111318', asphaltLite: '#22252c', lineW: '#5a5c61', lineShade: '#3d3f44',
          doorW: '#3c3d42', doorShade: '#2c2d31', recess: '#4a4640', domeLamp: '#fff4d6', lamp: '#ffe3ad',
          rack: '#5a4429', rackShade: '#3e2e1b', rackLite: '#7a5e3a', bench: '#3f2f1f', benchShade: '#2b1f14',
          scooter: '#3a4f5e', scooterShade: '#2b3c48', scooterSeat: '#111214', tyre: '#0e0e10', wire: '#0a0a0c',
          inDeep: '#f2c584', inWall: '#f3d39c', inCase: '#ffe2a6', bariTee: '#2a2a2e', bariApron: '#3a302a' }, tonePeople('#0d1124', .6)),
        add: { over: [{ t: 'halo', x: 82, y: 162, rx: 22, ry: 16, n: 6, fill: 'signOrange', a: .09 }, { t: 'halo', x: 208, y: 200, rx: 120, ry: 50, n: 6, fill: 'pool', a: .05 },
          { t: 'halo', x: 208, y: 252, rx: 110, ry: 12, n: 6, fill: 'pool', a: .09 }, { t: 'halo', x: 143, y: 222, rx: 40, ry: 14, n: 5, fill: 'pool', a: .06 },
          { t: 'halo', x: 356, y: 156, rx: 16, ry: 10, n: 5, fill: 'lamp', a: .12 }, { t: 'halo', x: 356, y: 236, rx: 30, ry: 8, n: 5, fill: 'pool', a: .06 },
          { t: 'halo', x: 200, y: 274, rx: 180, ry: 14, n: 6, fill: 'pool', a: .03 }, { t: 'halo', x: 110, y: 78, rx: 60, ry: 22, n: 5, fill: 'pool', a: .03 }, { t: 'halo', x: 236, y: 78, rx: 60, ry: 22, n: 5, fill: 'pool', a: .03 }] } } },
    breathe: { x: SX0 + 2, y: ST, w: SX1 - SX0 - 4, h: SB - ST, c: 'breathe', a: .03 },
    // the barista behind the case, and a customer crossing the long room
    shoppers: [{ keys: [[0, 120], [5, 120], [6.4, 132], [10.2, 132], [11.6, 120]], period: 12, foot: 212, s: .74, coat: 'bariTee', legs: 'bariApron', hair: 'hairDark', alpha: 1, shadow: false },
               { keys: [[0, 196], [9, 196], [11, 220], [19, 220], [21, 196]], period: 22, offset: 4, foot: 226, s: .6, coat: 'inShirt3', legs: 'legsDark', hair: 'hairBrown', alpha: .95, shadow: false }],
    passersby: [{ start: 10, every: 26, dir: -1, speed: 21, foot: 287, s: 1.24, coat: 'coatD', legs: 'legsDenim', hair: 'hairDark', carry: 'tote', carryC: 'bagMark' },
                { start: 18, every: 31, dir: 1, speed: 19, foot: 281, s: 1.16, coat: 'coatA', long: 6, legs: 'legsDark', hair: 'hairBrown', longHair: true, carry: 'backpack', carryC: 'coatC' }],
    stamp: { x0: 50, x1: 330, y0: 40, y1: 290 },
    ground: { y0: 266, y1: 296, xMin: 10, xMax: 390 },
    sig: { emerge: { x: 208, foot0: 234, foot1: 268, s0: .72, s1: 1.24, dur: 1.35 },
      // Raufan: a brown cap over shoulder-length hair worn down, a black hoodie, khaki trousers, his grey Asics, no bag
      person: { hood: true, coat: 'rfHoodie', string: 'rfString', hat: false, bag: false, ballcap: 'rfCap', legs: 'rfPants', hairDown: true, longHair: true, hair: 'hairDark',
        shoe: 'rfShoe', sole: 'rfSole', shoeMark: 'rfShoeMark' },
      // Brian: short dark hair, glasses, a black fleece jacket, black trousers, pale sage trainers
      company: [{ person: { coat: 'brTop', long: -5.5, legs: 'brPants', hair: 'hairDark', hat: false, bag: false, glasses: 'frames', shoe: 'brShoe', sole: 'brSole', stride: 11.5 }, dx: -27, dy: 2, ds: .02, lag: .24 }] },
    build: function (L, F, P) {
      var R = rnd(1107), i, x, y;
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .25, 'down', 1.6) }));
      L.push(e(296, 7, 18, 2.2, 'cloudLite', { a: .55 })); L.push(e(316, 10, 9, 1.4, 'cloudLite', { a: .45 }));
      // far roofs over the parapet
      L.push(r(0, 10, 70, 10, 'back', { shade: grain('backShade', .3, 'down') })); L.push(r(318, 6, 82, 14, 'back', { shade: grain('backShade', .3, 'down') }));
      for (x = 326; x < 396; x += 12) L.push(r(x, 9, 6, 4, 'winShade', { a: .6 })); L.push(r(318, 6, 82, .8, 'slabLite', { a: .6 }));
      // ---- the block: the roof slab over the balcony ----
      L.push(r(0, 20, 400, 12, 'slab', { shade: grain('slabShade', .3, 'down', 1.4) })); L.push(r(0, 20, 400, 1.2, 'slabLite'));
      L.push(r(0, 29, 400, 3, 'slabShade')); for (i = 0; i < 8; i++) L.push(r(R() * 390, 22 + R() * 5, .7, 4 + R() * 6, 'stain', { a: .12 }));
      // the balcony's back wall: small tiles in stack bond
      var tiles = function (x0, y0, w, h) { L.push(r(x0, y0, w, h, 'tile', { shade: grain('tileShade', .28, 'down', 1.3) }));
        for (var ty = y0 + 2.8; ty < y0 + h; ty += 2.8) L.push(r(x0, ty, w, .45, 'tileJoint', { a: .8 }));
        for (var tx = x0 + 5.6; tx < x0 + w; tx += 5.6) L.push(r(tx, y0, .45, h, 'tileJoint', { a: .7 }));
        for (var q = 0; q < w * h / 600; q++) L.push(r(x0 + Math.floor(R() * w / 5.6) * 5.6 + .5, y0 + Math.floor(R() * h / 2.8) * 2.8 + .5, 4.7, 1.9, R() > .5 ? 'tileLite' : 'tileShade', { a: .35 })); };
      tiles(0, 32, 400, 74);
      // sliding windows behind the rail: aluminium frames, curtains, the glass catching the sky
      [[16, 104, 'win'], [138, 120, 'win'], [292, 68, 'win2']].forEach(function (wv, wi) { var wx = wv[0], ww = wv[1], wy = 40, wh = 66;
        L.push(r(wx - 2, wy - 2, ww + 4, wh + 2, 'alu', { shade: grain('aluShade', .3, 'right') }));
        L.push(r(wx, wy, ww, wh, wv[2], { shade: grain('winShade', .35, 'down', 1.3) }));
        for (var k = 0; k < 3; k++) L.push(r(wx + 2 + k * 6 + (wi * 7) % 9, wy + 1, 5, wh - 2, k % 2 ? 'curtain2' : 'curtain', { a: .85 }));
        L.push(r(wx + ww - 22, wy + 1, 20, wh - 2, 'curtain', { a: .75 }));
        L.push(poly([wx + ww * .45, wy, wx + ww * .6, wy, wx + ww * .4, wy + wh, wx + ww * .25, wy + wh], 'glassLight', { a: .1 }));
        L.push(r(wx + ww / 2 - 1, wy, 2.2, wh, 'alu')); L.push(r(wx + ww / 2 + .8, wy, .6, wh, 'aluShade', { a: .7 })); L.push(r(wx, wy, ww, 1.4, 'aluShade', { a: .6 })); });
      L.push(r(0, 102, 400, 4, 'tileShade', { a: .6 }));
      ac(L, 304, 86, 24); pipe(L, 396, 32, 106); L.push(line([316, 92, 330, 80, 334, 60, 344, 50, 394, 48], 'pipeShade', 1, { a: .9 }));   // the AC's pipe up to the wall
      // the drying hangers from the slab: an inverted triangle on a rod
      [[36, 0], [148, 1], [330, 0]].forEach(function (hg) { var hx = hg[0];
        L.push(line([hx, 32, hx, 41], 'hanger', .7)); L.push(line([hx - 6, 41, hx + 6, 41, hx, 50, hx - 6, 41], 'hanger', .7)); L.push(line([hx, 50, hx, 53], 'hanger', .6)); });
      // the washing pole and the washing
      L.push(line([64, 46, 336, 46], 'pole', 1.6)); L.push(line([64, 45.4, 336, 45.4], 'glassLight', .4, { a: .5 }));
      var hangCoat = function (x0, w, len, col) { L.push(line([x0 + w / 2, 46, x0 + w / 2, 48.2], 'hanger', .5)); L.push(line([x0 + 1, 50, x0 + w / 2, 48, x0 + w - 1, 50], 'hanger', .6));
        L.push(poly([x0, 50, x0 + w, 50, x0 + w + 1.4, 54, x0 + w - 1.4, 55, x0 + w - 1.6, 50 + len, x0 + 1.6, 50 + len, x0 + 1.4, 55, x0 - 1.4, 54], col, { shade: grain('washShade', .12, 'down') }));
        L.push(r(x0 + w / 2 - .4, 51, .8, len - 2, 'washShade', { a: .06 })); };
      var hangLong = function (x0, w, len, col) { L.push(r(x0, 47, w, 1.2, 'hanger')); L.push(r(x0, 48, w * .46, len, col, { shade: grain('washShade', .14, 'right') })); L.push(r(x0 + w * .54, 48, w * .46, len, col, { shade: grain('washShade', .14, 'right') })); L.push(r(x0, 48, w, 5, col)); };
      hangCoat(96, 10, 34, 'wash1'); hangCoat(108, 9, 30, 'wash4'); hangCoat(119, 11, 38, 'wash2');
      // a square peg hanger crowded with small things
      L.push(line([152, 46, 156, 51, 160, 46], 'hanger', .5)); L.push(r(140, 51, 32, 1, 'hanger'));
      for (x = 141; x < 171; x += 3.6) { var ln = 6 + R() * 9; L.push(r(x, 52, 2.6, ln, ['wash1', 'wash3', 'wash5', 'wash4', 'wash6'][Math.floor(R() * 5)], { a: .95 })); }
      hangLong(176, 13, 46, 'wash2'); hangLong(192, 13, 44, 'wash6'); hangCoat(208, 11, 30, 'wash2'); hangCoat(221, 10, 34, 'wash2');
      hangCoat(236, 9, 28, 'wash1'); hangCoat(247, 10, 32, 'wash3'); hangCoat(259, 9, 30, 'wash1'); hangCoat(270, 10, 26, 'wash5'); hangCoat(282, 9, 30, 'wash1');
      // ---- the balcony rail: white posts and balusters, the slab edge ----
      L.push(r(0, 62, 400, 2.6, 'rail', { shade: grain('railShade', .25, 'down') })); L.push(r(0, 64.4, 400, .7, 'railShade'));
      for (x = 1; x < 400; x += 4.4) L.push(r(x, 64, .9, 42, 'rail'));
      for (x = 1; x < 400; x += 4.4) L.push(r(x + .7, 64, .3, 42, 'railShade', { a: .7 }));
      L.push(r(0, 102, 400, 1.6, 'rail'));
      [0, 132, 268, 398].forEach(function (px) { L.push(r(px - 1.2, 60, 3, 46, 'rail')); L.push(r(px + 1.1, 60, .7, 46, 'railShade')); });
      L.push(r(0, 106, 400, 12, 'slab', { shade: grain('slabShade', .3, 'down', 1.3) })); L.push(r(0, 106, 400, 1, 'slabLite'));
      L.push(r(0, 116, 400, 2, 'slabShade')); for (i = 0; i < 10; i++) L.push(r(R() * 396, 108, .7, 3 + R() * 7, 'stain', { a: .14 }));   // rust streaks from the rail
      // ---- the tiled band over the shop ----
      tiles(0, 118, 400, 34);
      L.push(r(0, 118, 400, 3, 'shadow', { a: .1 }));
      L.push(r(90, 128, 5, 3.4, 'alu', { r: .6 })); L.push(r(92.2, 131.4, 1.2, 1.4, 'aluShade'));   // a little security light
      for (i = 0; i < 14; i++) L.push(r(R() * 396, 118, .7, 4 + R() * 12, 'stain', { a: .1 }));        // streaks down from the slab
      K.plate(L, 30, 128, 22, 7); L.push(r(30, 135, 22, .8, 'shadow', { a: .15 }));                         // the building's name plate
      L.push(r(328, 124, 16, 18, 'alu', { r: .8, shade: grain('aluShade', .35, 'down') })); L.push(r(330, 127, 12, 6, 'aluShade', { a: .5 })); L.push(c(336, 130, 2, 'glassLight', { a: .5 }));   // the meter box
      L.push(r(335, 142, 2, 8, 'pipe')); L.push(r(0, 145, 400, 1.6, 'pipe', { a: .8 })); L.push(r(0, 146.4, 400, .6, 'pipeShade'));      // the conduit along the soffit
      pipe(L, 318, 106, 238);
      L.push(r(0, 150, 400, 6, 'soffit', { shade: grain('tileShade', .3, 'down') })); L.push(r(0, 150, 400, .8, 'tileShade'));
      // ---- left: the neighbour's grey shutter ----
      L.push(r(0, 156, 64, 82, 'shutter', { shade: grain('shutterShade', .3, 'down', 1.4) }));
      for (y = 158; y < 238; y += 2.4) { L.push(r(0, y, 64, .6, 'shutterShade', { a: .7 })); L.push(r(0, y + .7, 64, .4, 'shutterLite', { a: .5 })); }
      L.push(r(0, 156, 64, 4, 'shutterBox')); L.push(r(0, 234, 64, 2, 'shutterShade')); L.push(r(62, 156, 2, 82, 'shutterShade'));
      // ---- the timber post with the sign box and the notices ----
      L.push(r(64, 156, 36, 82, 'post', { shade: grain('postShade', .3, 'right', 1.3) })); L.push(r(64, 156, 2, 82, 'woodLite', { a: .4 })); L.push(r(97, 156, 3, 82, 'wood'));
      L.push(r(68, 176, 26, 60, 'woodDark', { a: .45 }));
      L.push(r(70, 180, 9, 13, 'posterA')); L.push(r(71, 182, 7, 4, 'posterB', { a: .8 })); L.push(r(71, 187.4, 6, .6, 'paperW', { a: .7 }));
      L.push(r(81, 183, 7, 5, 'paperW')); L.push(r(82, 184.4, 5, .5, 'paperLine'));
      L.push(r(69, 197, 10, 14, 'paperW', { shade: grain('paperLine', .2, 'down') })); for (i = 0; i < 5; i++) L.push(r(70.4, 199.4 + i * 2.2, 7, .5, 'paperLine'));
      L.push(r(81, 208, 9, 12, 'paperW')); for (i = 0; i < 4; i++) L.push(r(82.3, 210 + i * 2.4, 6.4, .5, 'paperLine'));
      // the sign box: the whirlpool mark on cream, the orange name panel
      F.push(r(62, 152, 40, 2, 'signBox')); F.push(r(62, 172, 40, 2.4, 'signBox')); F.push(r(62, 152, 2, 22, 'signBox')); F.push(r(100, 152, 2, 22, 'signBox')); F.push(r(81, 152, 1.6, 22, 'signBox'));
      F.push(r(64, 154, 17, 18, 'signLogo')); swirl(F, 72.6, 162, 1.6, 'signInk'); F.push(r(69, 167.6, 7, 2, 'signInk', { r: [0, 0, 1, 1] })); F.push(c(70, 158, .9, 'signInk')); F.push(c(76, 158.4, .7, 'signInk'));
      F.push(r(82.6, 154, 17.4, 18, 'signOrange')); F.push(r(82.6, 154, 17.4, 1.6, 'glassLight', { a: .25 }));
      F.push({ t: 'text', text: 'NARUTO', x: 91.3, y: 161.6, size: 3.2, weight: 800, font: FONT, fill: 'signOrangeInk', align: 'center', ls: .05 });
      F.push({ t: 'text', text: 'COFFEE', x: 91.3, y: 167.4, size: 3.2, weight: 800, font: FONT, fill: 'signOrangeInk', align: 'center', ls: .05 });
      F.push(r(62, 174.4, 40, 1.4, 'shadow', { a: .25 }));
      // ---- inside: the long warm room ----
      L.push(r(SX0, ST, SX1 - SX0, SB - ST, 'inWall', { shade: grain('inWallShade', .35, 'down', 1.3) }));
      L.push(r(SX0, 226, SX1 - SX0, SB - 226, 'inFloor', { shade: grain('inFloorShade', .3, 'down') }));
      for (x = SX0 + 14; x < SX1; x += 30) { L.push(c(x, ST + 3, 1.2, 'inLamp')); L.push(poly([x - 1, ST + 3, x + 1, ST + 3, x + 9, ST + 30, x - 9, ST + 30], 'inLamp', { a: .08 })); }
      // left bay: bookshelves and the barista's counter behind the case
      L.push(r(SX0 + 4, 180, 56, 1.4, 'inShelf')); L.push(r(SX0 + 4, 192, 56, 1.4, 'inShelf')); L.push(r(SX0 + 32, 178, 1.4, 30, 'inShelfShade'));
      for (x = SX0 + 6; x < SX0 + 30; x += 2.2) { var bh = 7 + R() * 4; L.push(r(x, 180 - bh, 1.8, bh, ['inBook1', 'inBook2', 'inBook3', 'inBook4'][Math.floor(R() * 4)], { a: .9 })); }
      for (x = SX0 + 35; x < SX0 + 58; x += 2.4) { var bh2 = 6 + R() * 4; L.push(r(x, 192 - bh2, 2, bh2, ['inBook3', 'inBook1', 'inBag', 'inBook2'][Math.floor(R() * 4)], { a: .9 })); }
      L.push(r(SX0 + 36, 172, 8, 7, 'inBag')); L.push(r(SX0 + 46, 174, 10, 5, 'inShelfShade', { a: .6 }));
      L.push(r(SX0 + 62, 180, 22, 1.4, 'inShelf')); L.push(r(SX0 + 64, 173, 6, 7, 'inCup', { a: .9 })); L.push(r(SX0 + 72, 175, 9, 5, 'inBlue', { a: .9 }));
      L.push(r(SX0 + 74, 192, 8, 6, 'inRed', { a: .8 }));                                                  // the fire bell, a red dot of colour
      // the door's deep view: the back wall, a picture, the timber partition
      var DX = 190, DW = 36;
      L.push(r(DX, ST + 22, DW, SB - ST - 22, 'inDeep', { shade: grain('inWallShade', .35, 'down', 1.3) }));
      L.push(r(DX + 13, 190, 9, 11, 'inPicFrame')); L.push(r(DX + 14.2, 191.2, 6.6, 8.6, 'inPic')); L.push(r(DX + 14.2, 196, 6.6, 3.8, 'inStool', { a: .6 }));
      L.push(r(DX, 222, DW, SB - 222, 'inFloor', { shade: grain('inFloorShade', .35, 'down') })); L.push(r(DX + 4, 222, DW - 8, 1, 'inFloorShade', { a: .6 }));
      L.push(r(DX + 2, ST + 22, 2.4, SB - ST - 22, 'inWood')); L.push(r(DX + DW - 4, ST + 22, 2.4, SB - ST - 22, 'inWood'));
      // right bay: the seats — a timber partition, a palm, stools and little tables, people at them
      var RX = 230;
      L.push(r(RX + 30, 178, 1.8, 58, 'inWood')); L.push(r(RX + 58, 178, 1.8, 58, 'inWood')); L.push(r(RX, 182, SX1 - RX, 1.6, 'inWood'));
      L.push(r(RX + 62, 186, 10, 12, 'inPicFrame')); L.push(r(RX + 63.2, 187.2, 7.6, 9.6, 'inPic'));
      L.push(r(RX + 76, 184, 6, 16, 'paperW', { a: .7 })); L.push(c(RX + 79, 188, 1.2, 'inRed'));                 // the alarm box and its red lamp
      [[RX + 10, 218], [RX + 44, 216]].forEach(function (tb) { L.push(r(tb[0] - 8, tb[1], 16, 1.8, 'inTable')); L.push(r(tb[0] - .6, tb[1] + 1.8, 1.2, SB - tb[1] - 3, 'inShelfShade')); });
      [[RX + 3, 224], [RX + 20, 225], [RX + 36, 225], [RX + 70, 224]].forEach(function (st) { L.push(e(st[0], st[1], 3.4, 1, 'inStool')); L.push(r(st[0] - 2.6, st[1], 1, SB - st[1], 'inStoolShade')); L.push(r(st[0] + 1.6, st[1], 1, SB - st[1], 'inStoolShade')); });
      K.sitter(L, RX + 4, 216, .82, { coat: 'inShirt2', legs: 'legsDark', hair: 'inHair', dir: 1, cup: true, rimA: .25 });
      K.sitter(L, RX + 51, 214, .8, { coat: 'inShirt', legs: 'legsDenim', hair: 'inHair', dir: -1, rimA: .25 });
      L.push(r(RX + 6, 215.4, 2, 2.4, 'inCup')); L.push(r(RX + 40, 213.4, 2, 2.4, 'inCup')); L.push(r(RX + 44, 214.2, 4, 1.4, 'inBag'));
      plant(L, RX + 22, 236, 1, 17, { pot: 'inBag', n: 9, tall: 1.9, leaf: 'inPalm', leaf2: 'inPalm2' });
      // ---- the shopfront: pale timber ----
      var fr = function (x, y, w, h, k) { F.push(r(x, y, w, h, k || 'wood', { shade: grain('woodShade', .3, 'down') })); };
      // the transom panes: the ceiling and a duct glimpsed, a pale reflection
      F.push(r(SX0, ST, SX1 - SX0, 22, 'glassT', { a: .1 })); sheen(F, SX0, ST, SX1 - SX0, 22, { a: .16, at: .55, street: false });
      F.push(e(170, 167, 10, 6, 'glassLight', { a: .22 }));
      L.push(r(SX0 + 4, ST + 6, 70, 5, 'inWallShade', { a: .6 })); L.push(r(SX0 + 4, ST + 10, 70, .8, 'inShelfShade', { a: .5 }));   // a duct across the ceiling
      [[206, 12], [246, 9], [292, 11]].forEach(function (pd) { L.push(r(pd[0] - .3, ST, .6, pd[1], 'inShelfShade')); L.push(e(pd[0], ST + pd[1] + 1.4, 3, 2, 'inLamp')); L.push(r(pd[0] - 3, ST + pd[1] + 1.2, 6, 1, 'inShelf', { a: .6 })); });
      // the display case: lit shelves of muffins and coffee bags, low across the left bay
      var CX0 = SX0 + 2, CX1 = 188, CY = 206;
      F.push(r(CX0, CY, CX1 - CX0, SB - CY, 'inCase', { shade: grain('inCaseShade', .35, 'down') }));
      [CY + 9, CY + 19].forEach(function (sy) { F.push(r(CX0, sy, CX1 - CX0, 1.2, 'inShelf')); F.push(r(CX0, sy + 1.2, CX1 - CX0, .6, 'inShelfShade', { a: .6 })); });
      for (x = CX0 + 4; x < 142; x += 5.4) { F.push(e(x, CY + 7.6, 2, 1.5, R() > .5 ? 'inMuffin' : 'inMuffin2')); F.push(r(x - 1.6, CY + 7.6, 3.2, 1.2, 'inBag', { a: .9 })); }
      for (x = 148; x < CX1 - 4; x += 7) { F.push(r(x, CY + 2, 5.2, 7, 'inBag')); F.push(r(x + 1, CY + 5, 3.2, 2, 'inBagInk', { a: .8 })); }
      for (x = CX0 + 5; x < CX1 - 4; x += 8) { F.push(r(x, CY + 12, 5.2, 7, 'inBag')); F.push(r(x + 1, CY + 15, 3.2, 2, 'inBagInk', { a: .8 })); }
      for (x = CX0 + 6; x < CX1 - 6; x += 12) { F.push(e(x, CY + 27, 3, .9, 'inCup', { a: .8 })); F.push(e(x, CY + 26.2, 1.8, 1.2, 'inMuffin')); }
      F.push(r(CX0 + 30, CY - 6, 10, 6, 'inBlue')); F.push(r(CX0 + 32, CY - 4.4, 6, .6, 'inCup', { a: .8 }));   // the blue card on the counter
      F.push(r(CX0 + 8, CY - 5, 3, 5, 'inCup')); F.push(r(CX0 + 50, CY - 4, 8, 4, 'inBag'));
      F.push(r(CX0, CY - 1.4, CX1 - CX0, 1.6, 'inWood'));
      F.push(r(SX0, ST + 22, CX1 - SX0, SB - ST - 22, 'glassT', { a: .12 })); sheen(F, SX0, ST + 22, CX1 - SX0, SB - ST - 22, { a: .12, at: .2, street: true, streetA: .05 });
      F.push(r(RX, ST + 22, SX1 - RX, SB - ST - 22, 'glassT', { a: .12 })); sheen(F, RX, ST + 22, SX1 - RX, SB - ST - 22, { a: .12, at: .35, street: true, streetA: .05 });
      // frame members: the head, the transom rail, the posts and mullions, the sill
      fr(SX0 - 2, ST, SX1 - SX0 + 4, 2.6); fr(SX0 - 2, ST + 20, SX1 - SX0 + 4, 3.4); F.push(r(SX0, ST + 23.4, SX1 - SX0, .8, 'shadow', { a: .25 }));
      [SX0 - 2, 143, 186, 226, 272, SX1 - 2].forEach(function (mx) { fr(mx, ST, 4, SB - ST); F.push(r(mx + 3.2, ST, .8, SB - ST, 'woodShade', { a: .6 })); F.push(r(mx, ST, .8, SB - ST, 'woodLite', { a: .7 })); });
      fr(SX0, CY - 2, 86, 2.4); fr(RX, 204, SX1 - RX, 2);
      // the door, swung open inward: its glazed leaf seen edge-on against the jamb
      fr(DX + 3, ST + 24, 3, SB - ST - 24, 'woodLite'); F.push(r(DX + 6, ST + 24, 1, SB - ST - 24, 'glassLight', { a: .3 }));
      fr(SX0 - 2, SB - 2, SX1 - SX0 + 4, 3, 'woodDark');
      // ---- right: the tiled pillar, the recess with a white door and its ceiling light ----
      L.push(r(SX1 + 2, 156, 400 - SX1 - 2, 82, 'recess', { shade: grain('tileShade', .3, 'down') }));
      tiles(SX1 + 2, 156, 16, 82); L.push(r(SX1 + 17, 156, 1.4, 82, 'tileShade'));
      L.push(r(338, 168, 34, 70, 'doorW', { shade: grain('doorShade', .3, 'down') })); L.push(r(338, 168, 34, 1.4, 'doorShade')); L.push(r(338, 168, 1.2, 70, 'doorShade'));
      L.push(r(366, 202, 2, 6, 'aluShade')); L.push(r(344, 186, 8, 5, 'plate', { r: .5 }));
      for (y = 160; y < 238; y += 2.8) L.push(r(374, y, 26, .45, 'tileJoint', { a: .6 }));
      L.push(e(356, 158, 7, 2.2, 'domeLamp')); L.push(r(349, 156, 14, 1.4, 'aluShade', { a: .6 }));
      // ---- the brick apron ----
      L.push(r(0, 236, 400, 28, 'brick', { shade: grain('brickShade', .3, 'down', 1.3) }));
      var row = 0; for (y = 236; y < 262; y += 3.6, row++) { L.push(r(0, y, 400, .5, 'brickJoint', { a: .6 }));
        for (x = (row % 2) * 5; x < 400; x += 10) { L.push(r(x, y, .5, 3.6, 'brickJoint', { a: .5 })); var v = R(); if (v < .2) L.push(r(x + .5, y + .5, 9.5, 3.1, 'brickShade', { a: .3 })); else if (v > .82) L.push(r(x + .5, y + .5, 9.5, 3.1, 'brickLite', { a: .35 })); } }
      L.push(r(0, 236, 400, 2, 'shadow', { a: .14 }));
      L.push(r(186, 238, 44, 7, 'mat', { shade: grain('matShade', .4, 'down') })); for (x = 188; x < 229; x += 2) L.push(r(x, 239, .5, 5, 'matShade', { a: .6 }));
      K.manhole(L, 274, 254, 12);
      // the kerb stones with a grate, the lane
      L.push(r(0, 266, 400, 34, 'asphalt', { shade: [grain('asphaltShade', .4, 'down', 1.2), grain('asphaltLite', .15, 'up')] }));
      L.push(r(0, 264, 400, 8, 'kerbTop', { shade: grain('stoneShade', .3, 'down') })); for (x = 18; x < 400; x += 36) L.push(r(x, 264, .6, 8, 'kerbJoint'));
      L.push(r(0, 264, 400, .8, 'stoneLight', { a: .6 })); L.push(r(0, 271.4, 400, .8, 'kerbJoint'));
      K.grate(L, 124, 266, 24);
      for (i = 0; i < 16; i++) L.push(e(R() * 400, 276 + R() * 22, 6 + R() * 18, .5 + R() * .8, R() > .5 ? 'asphaltLite' : 'asphaltShade', { a: .25 }));
      L.push(poly([262, 276, 362, 276, 365, 280.2, 258, 280.2], 'lineW', { shade: grain('lineShade', .3, 'down') }));     // the crossing's bars, lower right
      L.push(poly([250, 285, 370, 285, 374, 290.4, 245, 290.4], 'lineW', { shade: grain('lineShade', .3, 'down') }));
      // ---- in front: the scooter, the bench, the bike rail ----
      // the neighbour's scooter, pale blue, nose to the left
      contact(F, 30, 252, 28, .2);
      F.push(c(12, 246, 6, 'tyre')); F.push(c(48, 246, 6, 'tyre')); F.push(c(12, 246, 2, 'metal')); F.push(c(48, 246, 2, 'metal'));
      F.push(poly([4, 212, 10, 210, 14, 232, 26, 236, 40, 230, 56, 232, 58, 244, 8, 244, 3, 238], 'scooter', { shade: grain('scooterShade', .35, 'down') }));   // the leg shield, the floor, the rear body
      F.push(poly([38, 230, 56, 230, 58, 236, 36, 236], 'scooterShade', { a: .5 })); F.push(r(30, 225, 25, 5.4, 'scooterSeat', { r: [2.6, 2.6, 1, 1] }));
      F.push(line([7, 211, 5, 204, 12, 202], 'metal', 1.2)); F.push(c(5.6, 214, 1.6, 'domeLamp')); F.push(r(14, 236, 12, .7, 'scooterShade')); F.push(r(56, 233, 2.4, 2.4, 'inRed', { a: .8 }));
      // the bench in front of the post
      F.push(r(66, 225, 40, 3, 'bench', { shade: grain('benchShade', .3, 'down') })); F.push(r(66, 227.6, 40, .8, 'benchShade'));
      F.push(r(69, 228, 2.4, 14, 'benchShade')); F.push(r(101, 228, 2.4, 14, 'benchShade')); F.push(r(70, 236, 32, 1.2, 'benchShade', { a: .8 }));
      contact(F, 86, 242, 22, .14); F.push(r(96, 220.6, 2.6, 4.4, 'cup', { r: [.3, .3, .8, .8] }));     // a takeaway cup left on the bench
      // the bike rail: a long timber beam on two splayed timber trestles
      var trestle = function (x) {   // two planks splayed into an A, a cross piece, the feet on the brick
        F.push(poly([x, 204, x + 4, 204, x - 3, 258, x - 8, 258], 'rack', { shade: grain('rackShade', .35, 'right') })); F.push(poly([x, 204, x + 1.2, 204, x - 6.6, 258, x - 8, 258], 'rackLite', { a: .55 }));
        F.push(poly([x, 204, x + 4, 204, x + 12, 258, x + 7, 258], 'rack', { shade: grain('rackShade', .4, 'right') })); F.push(poly([x + 2.6, 204, x + 4, 204, x + 12, 258, x + 10.4, 258], 'rackShade', { a: .5 }));
        F.push(r(x - 5, 236, 14, 2.6, 'rack', { shade: grain('rackShade', .3, 'down') })); F.push(r(x - 5, 238.6, 14, .7, 'shadow', { a: .25 }));
        contact(F, x - 5.5, 258, 5, .2); contact(F, x + 9.5, 258, 5, .2); };
      trestle(252); trestle(362);
      F.push(r(242, 200, 132, 5.4, 'rack', { shade: grain('rackShade', .3, 'down') })); F.push(r(242, 200, 132, 1, 'rackLite')); F.push(r(242, 205.4, 132, 1.2, 'shadow', { a: .22 })); F.push(r(242, 200, 2.4, 5.4, 'rackLite', { a: .7 })); F.push(r(371.6, 200, 2.4, 5.4, 'rackLite', { a: .7 }));
      for (i = 0; i < 5; i++) F.push(r(248 + R() * 110, 203.6 + R() * 2, 6 + R() * 12, .4, 'rackShade', { a: .6 }));
      plant(F, 236, 240, .9, 23, { n: 9, tall: 1.5 });   // a potted palm by the door
      vending(F, 374, 238, { w: 22, h: 44, seed: 7 });
      // wires from the poles beyond the frame
      [[0, 4, 200, 11, 400, 2], [0, 9, 140, 13, 330, 8]].forEach(function (w) { P.push(line(w, 'wire', .6, { a: .8 })); });
    } });
})();
