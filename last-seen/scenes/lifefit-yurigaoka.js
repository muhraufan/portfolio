/* Scene — lifefit-yurigaoka. Needs /timeline/lib/last-seen.js and /timeline/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var JP = '"Noto Sans JP", "Hiragino Sans", ' + K.FONT;
  var make = K.make, pavement = K.pavement, contact = K.contact, sheen = K.sheen, ac = K.ac, pipe = K.pipe, plant = K.plant;
  // brick in small courses: a base tone with grain, every course ruled, a share of bricks a touch lighter or darker
  function brick(A, x, y, w, h, base, shade, lite, seed) {
    var R = rnd(seed); A.push(r(x, y, w, h, base, { shade: grain(shade, .3, 'down', 1.7) }));
    for (var yy = y, row = 0; yy < y + h - .5; yy += 2.6, row++) { var off = row % 2 ? 3 : 0;
      for (var xx = x - off; xx < x + w; xx += 6) { var v = R(), x0 = Math.max(x, xx), x1 = Math.min(x + w, xx + 6); if (x1 - x0 < 1) continue;
        if (v < .22) A.push(r(x0, yy, x1 - x0 - .4, 2.2, shade, { a: .18 + R() * .2 })); else if (v > .8) A.push(r(x0, yy, x1 - x0 - .4, 2.2, lite, { a: .2 + R() * .25 })); }
      A.push(r(x, yy + 2.2, w, .4, 'mortar', { a: .5 })); }
  }
  // an aluminium window: frame, two sashes, lace curtain pulled most of the way, sill and lintel shadow
  function win(A, x, y, w, h, o) {
    o = o || {}; A.push(r(x - 1, y - 1, w + 2, 2, 'shadow', { a: .16 }));                                  // lintel shade
    A.push(r(x, y, w, h, 'sash', { shade: grain('sashShade', .3, 'down') }));
    var W = o.lit ? 'inRoom' : 'win', C = o.lit ? 'inCurtain' : 'curtain', CS = o.lit ? 'inCurtainShade' : 'curtainShade';
    A.push(r(x + 1.6, y + 1.6, w - 3.2, h - 3.2, W, { shade: grain(o.lit ? 'inRoomShade' : 'winShade', .35, 'down') }));
    var cw = (w - 3.2) * (o.open == null ? .7 : o.open), cx = o.left ? x + 1.6 : x + w - 1.6 - cw;
    A.push(r(cx, y + 1.6, cw, h - 3.2, C, { shade: grain(CS, .3, o.left ? 'right' : 'left', 1.4) }));
    for (var f = cx + 2.4; f < cx + cw - 1; f += 2.8) A.push(r(f, y + 1.6, .5, h - 3.2, CS, { a: .45 }));
    A.push(r(x + w / 2 - .6, y + 1, 1.2, h - 2, 'sash')); A.push(r(x + w / 2 + .6, y + 1, .4, h - 2, 'sashShade'));
    sheen(A, x + 1.6, y + 1.6, w - 3.2, h - 3.2, { a: .1, at: .1, street: false });
    A.push(r(x - 2, y + h, w + 4, 2.4, 'sill')); A.push(r(x - 2, y + h, w + 4, .6, 'rimLit')); A.push(r(x - 2, y + h + 2.4, w + 4, 1.4, 'shadow', { a: .14 }));
  }
  // a nobori banner: a white pole on a weighted foot, a blue cloth with the logo and a yellow strip of words
  function nobori(A, x, top, foot, s) {
    var w = 10 * s, h = 46 * s; contact(A, x, foot, 7, .16);
    A.push(e(x, foot - 1.4, 4.4, 1.8, 'baseW')); A.push(r(x - 4.4, foot - 5, 8.8, 3.6, 'baseW', { r: [1.4, 1.4, 0, 0], shade: grain('baseWShade', .4, 'down') }));
    A.push(r(x - .7, top - 2, 1.4, foot - top - 2, 'poleW', { shade: grain('baseWShade', .3, 'right') }));
    A.push(r(x - .2, top + 2, w + .6, .9, 'poleW'));
    A.push(poly([x + .7, top + 3, x + .7 + w, top + 3.6, x + .7 + w - .6, top + 3 + h * .5, x + .7 + w + .3, top + 3 + h, x + .7, top + 3 + h], 'flag', { shade: [grain('flagShade', .35, 'right', 1.3), grain('flagShade', .18, 'down')] }));
    A.push(r(x + .7, top + 3, .8, h, 'flagLite', { a: .6 }));
    A.push(c(x + .7 + w / 2, top + 8, 2.2, 'flagInk')); A.push(poly([x + w / 2 - .6, top + 8.2, x + w / 2 + .4, top + 9.2, x + w / 2 + 2.6, top + 6.6, x + w / 2 + .5, top + 8.2], 'flag'));
    ['グ', 'ラ', 'ン', 'ド', 'オ', '|', 'プ', 'ン'].forEach(function (ch, k) { var yy = top + 16.6 + k * 4.3 * s, cx0 = x + .7 + w * .42;    // グランドオープン, set vertically
      if (ch === '|') A.push(r(cx0 - .5, yy - 3.2 * s, 1.1, 3 * s, 'flagBand')); else A.push({ t: 'text', text: ch, x: cx0, y: yy, size: 4.2 * s, weight: 700, font: JP, fill: 'flagBand', align: 'center' }); });
    for (var yw = top + 14; yw < top + h - 8; yw += 3.3) A.push(r(x + w - 1.4, yw, 1, 2.2, 'flagInk', { a: .75 }));   // the small white line of text
    A.push(r(x + 1.6, top + h - 2, w - 2.4, .8, 'flagInk', { a: .5 }));
  }
  /* ================= LifeFit — Yurigaoka (Oct 21, 17:47) =================
     a three-storey brick walk-up by Yurigaoka station: two-tone brick, framed windows with lace curtains,
     white balconies stacked at the corners, a blue LifeFit band over a glass gym front, four blue
     banners with a yellow strip, a utility pole with the traffic signal, wires across the sky */
  make('lifefit-yurigaoka', { seed: 901, seenAt: '2026-10-21T17:47:00+09:00',
    place: { en: 'LifeFit Yurigaoka', ja: 'ライフフィット 百合ヶ丘' }, name: { en: 'LifeFit', ja: 'ライフフィット' }, area: { en: 'Yurigaoka, Kawasaki', ja: '川崎・百合ヶ丘' },
    alt: 'Illustration of LifeFit in Yurigaoka: a three-storey two-tone brick building with framed windows and white balconies, a blue LifeFit band over a glass gym front, blue banners by the door and a traffic signal on the corner pole.',
    palette: { sky: '#dfe6ea', skyShade: '#c6d2d9', cloud: '#eef2f3', wire: '#5f6266', sunWash: '#ffc58e',
      brick: '#83523c', brickShade: '#633b2b', brickLite: '#9c6a52', band: '#cf9160', bandShade: '#ae7247', bandLite: '#e0a777', mortar: '#5e3b2b', bandMortar: '#9a6440',
      coping: '#d9d4cb', copingShade: '#b9b2a6', sash: '#c9c6c0', sashShade: '#a7a49d', inRoom: '#4f5a63', inRoomShade: '#3a434b', inCurtain: '#efe9dd', inCurtainShade: '#d3cabb', win: '#4f5a63', winShade: '#3a434b', curtain: '#efe9dd', curtainShade: '#d3cabb', sill: '#dcd8d0', rimLit: '#fbf6ec',
      balc: '#eeebe5', balcShade: '#cfcac1', recess: '#5a5652', recessShade: '#3f3c39', rail: '#b9b6b0',
      fascia: '#2266cf', fasciaShade: '#174fa6', fascia2: '#3d8fdc', fascia2Shade: '#2c74bd', fasciaInk: '#ffffff', soffit: '#d7d3cb',
      glass: '#4b535b', glassShade: '#363c43', frame: '#9ea2a6', frameShade: '#7d8186', pier: '#b07a52',
      inWall: '#f1e6d2', inWallShade: '#d6c3a3', inMirror: '#dcd5c6', inMirrorShade: '#b9ae99', inBlack: '#33363b', inFloor: '#5d5f63', inFloorShade: '#434549', inCeil: '#e4dccd', inMachine: '#2d3136', inMachine2: '#5a6068', inScreen: '#8fb8de', inLamp: '#fff1d2', inRed: '#d75a48', inPoster: '#2a6ad4', inPosterInk: '#ffd23a', inPaper: '#f7f5ef',
      flag: '#1f5fd0', flagShade: '#16469c', flagLite: '#5b8fe6', flagInk: '#ffffff', flagBand: '#ffd23a', poleW: '#eceae5', baseW: '#f2f1ec', baseWShade: '#cfcdc6',
      pole: '#a9a8a4', poleShade: '#86857f', signal: '#3a3d42', signalShade: '#24262a', lampRed: '#d9493b', lampOff: '#5d6166', hood: '#2e3034', plateBlue: '#2c62b8', plateInk: '#f4f6f8',
      nbA: '#e7dccb', nbAShade: '#cdbfa9', roof: '#8a6a5c', roofShade: '#6c5045', nbB: '#5c6d68', nbBShade: '#46554f', nbWin: '#33403d', times: '#f3c41c', timesInk: '#1b1b1b', red: '#d4483c',
      block: '#b9b6ae', blockShade: '#9d9a92', blockLine: '#a19e96', hedge: '#6f8656', hedge2: '#859b68', hedgeShade: '#556a42' },
    light: { shadowAt: [[20, 90], [300, 80]],
      morning: { set: { sky: '#dbe5ec', skyShade: '#c2d1dc', cloud: '#f4f7f8' }, add: { back: [poly([62, 88, 70, 88, 86, 106, 78, 106], 'shadow', { a: .1 }), poly([62, 148, 70, 148, 86, 166, 78, 166], 'shadow', { a: .1 }), poly([34, 178, 300, 178, 312, 190, 46, 190], 'shadow', { a: .12 })] } },
      midday: { add: { back: [r(34, 178, 322, 5, 'shadow', { a: .14 }), r(30, 88, 38, 4, 'shadow', { a: .1 }), r(30, 148, 38, 4, 'shadow', { a: .1 }), r(322, 88, 38, 4, 'shadow', { a: .1 }), r(322, 148, 38, 4, 'shadow', { a: .1 })] } },
      golden: { set: { fasciaInk: '#fff6e8' }, add: { back: [r(66, 64, 1.2, 24, 'rim', { a: .5 }), r(66, 124, 1.2, 24, 'rim', { a: .5 })] } },
      night: { set: { sky: '#121831', skyShade: '#0b1022', cloud: '#1a2140', wire: '#05070d', brick: '#2e221d', brickShade: '#1f1714', brickLite: '#3a2b24', band: '#46342a', bandShade: '#33251d', bandLite: '#524035', mortar: '#1a1310', bandMortar: '#2a1e17',
          fascia: '#2f7cf0', fasciaShade: '#2264c8', fascia2: '#4fa2ee', fascia2Shade: '#3a88d4', fasciaInk: '#ffffff', flag: '#1d3f86', flagShade: '#132c60', flagLite: '#2c55a6', flagBand: '#b99a2c', flagInk: '#c9d2e6',
          win: '#1a1e27', winShade: '#11141b', curtain: '#3a3a40', curtainShade: '#2b2b30', glass: '#2a2e33', lampRed: '#ff5a44', times: '#ffd43a', plateBlue: '#1f4590', balc: '#3b3c42', balcShade: '#2a2b30', coping: '#33343a', inRoom: '#9a6a3c', inRoomShade: '#6e4724', inCurtain: '#f6d7a4', inCurtainShade: '#dcae6e' },
        add: { back: [r(46, 184, 254, 54, 'inLamp', { a: .08 }), r(362, 142, 38, 12, 'inLit2', { a: .5 }), r(368, 142, 1, 12, 'nbB'), r(7.4, 151.4, 13.2, 15.2, 'inLit', { a: .55 })],
          over: [{ t: 'halo', x: 170, y: 168, rx: 150, ry: 26, n: 6, fill: 'fascia', a: .05 }, { t: 'halo', x: 200, y: 250, rx: 150, ry: 26, n: 7, fill: 'pool', a: .05 }, { t: 'halo', x: 323, y: 38, rx: 16, ry: 16, n: 5, fill: 'lampRed', a: .07 }, { t: 'halo', x: 87, y: 66, rx: 26, ry: 18, n: 5, fill: 'haze', a: .035 }, { t: 'halo', x: 200, y: 66, rx: 20, ry: 16, n: 5, fill: 'haze', a: .03 }, { t: 'halo', x: 294, y: 126, rx: 20, ry: 16, n: 5, fill: 'haze', a: .03 }, { t: 'halo', x: 50, y: 70, rx: 14, ry: 14, n: 4, fill: 'haze', a: .025 }] } } },
    breathe: { x: 46, y: 184, w: 254, h: 54 },
    shoppers: [{ keys: [[0, 64], [7, 128], [10, 128], [17, 64], [20, 64]], period: 20, foot: 236, s: .62, coat: 'coatD', legs: 'legsDark', hair: 'hairDark', alpha: .85, shadow: false },
               { keys: [[0, 262], [5, 262], [9, 290], [14, 290], [18, 262]], period: 18, offset: 4, foot: 235, s: .6, coat: 'coatC', legs: 'legsDark', hair: 'hairBrown', alpha: .8, shadow: false }],
    passersby: [{ start: 4, every: 24, dir: -1, speed: 24, foot: 284, s: 1.24, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', carry: 'backpack', carryC: 'coatD' },
                { start: 13, every: 27, dir: 1, speed: 21, foot: 272, s: 1.1, coat: 'coatA', long: 7, legs: 'legsDenim', hair: 'hairBrown', longHair: true, carry: 'tote', carryC: 'coatC' }],
    sig: { emerge: { x: 200, foot0: 236, foot1: 266, s0: .64, s1: 1.22, dur: 1.2 } },
    build: function (L, F, P) {
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .18, 'down', 1.6) }));
      L.push(e(120, 12, 60, 8, 'cloud', { a: .7 })); L.push(e(160, 8, 40, 7, 'cloud', { a: .6 })); L.push(e(370, 70, 40, 6, 'cloud', { a: .5 }));
      // neighbours: a cream house with a tiled roof on the left, a grey-green block with parking signs on the right
      L.push(r(0, 128, 36, 116, 'nbA', { shade: grain('nbAShade', .3, 'down') })); L.push(poly([-4, 130, 18, 116, 40, 124, 40, 132, -4, 136], 'roof', { shade: grain('roofShade', .4, 'down') }));
      L.push(r(6, 150, 16, 18, 'sash')); L.push(r(7.4, 151.4, 13.2, 15.2, 'win')); L.push(r(7.4, 151.4, 6, 15.2, 'curtain', { a: .9 })); L.push(r(5, 168, 18, 1.6, 'sill'));
      L.push(r(356, 104, 44, 140, 'nbB', { shade: grain('nbBShade', .35, 'down') })); L.push(r(356, 104, 44, 3, 'coping'));
      for (var ny = 116; ny < 200; ny += 26) L.push(r(362, ny, 38, 12, 'nbWin', { a: .85 }));
      L.push(r(364, 166, 22, 10, 'times', { r: .6 })); L.push({ t: 'text', text: 'Times', x: 375, y: 173.6, size: 5, weight: 600, font: FONT, fill: 'timesInk', align: 'center' });
      L.push(r(366, 182, 18, 8, 'red', { r: .5 })); L.push(r(368.6, 185.2, 12, 1.4, 'plateInk', { a: .9 }));
      // on the roof: a handrail and an old TV aerial
      P.push(r(40, 16, 120, .9, 'rail')); for (var rx2 = 40; rx2 <= 160; rx2 += 20) P.push(r(rx2, 16, .9, 10, 'rail'));
      P.push(r(232, 4, 1, 22, 'pole')); P.push(r(222, 8, 20, .8, 'pole')); for (var ax = 223; ax < 242; ax += 3) P.push(r(ax, 6.6, .6, 3, 'pole'));
      // the building: parapet, two-tone brick (light bands at each floor, darker panels between)
      L.push(r(34, 26, 322, 4, 'coping', { shade: grain('copingShade', .4, 'down') })); L.push(r(34, 26, 322, .8, 'rimLit'));
      brick(L, 34, 30, 322, 14, 'band', 'bandShade', 'bandLite', 11); brick(L, 34, 44, 322, 44, 'brick', 'brickShade', 'brickLite', 12);
      brick(L, 34, 88, 322, 16, 'band', 'bandShade', 'bandLite', 13); brick(L, 34, 104, 322, 44, 'brick', 'brickShade', 'brickLite', 14);
      brick(L, 34, 148, 322, 12, 'band', 'bandShade', 'bandLite', 15);
      L.push(r(34, 30, 322, 2, 'shadow', { a: .2 })); L.push(r(34, 88, 322, .8, 'bandLite', { a: .6 })); L.push(r(34, 148, 322, .8, 'bandLite', { a: .6 }));
      // light brick piers between the window bays
      [[140, 10], [250, 10]].forEach(function (p) { brick(L, p[0], 44, p[1], 44, 'band', 'bandShade', 'bandLite', p[0]); brick(L, p[0], 104, p[1], 44, 'band', 'bandShade', 'bandLite', p[0] + 1); L.push(r(p[0] + p[1] - 1, 44, 1, 104, 'shadow', { a: .12 })); });
      // windows: two per bay, curtains drawn differently in each
      win(L, 72, 52, 30, 28, { open: .45, left: true, lit: 1 }); win(L, 106, 52, 26, 28, { open: .8 }); win(L, 186, 52, 28, 28, { open: .55, lit: 1 }); win(L, 268, 52, 28, 28, { open: .7, left: true }); win(L, 300, 52, 20, 28, { open: 1 });
      win(L, 72, 112, 30, 28, { open: .9 }); win(L, 106, 112, 26, 28, { open: .35, left: true }); win(L, 280, 112, 28, 28, { open: .6, lit: 1 });
      // the middle bay on the first floor is a recessed balcony: a dark slot, a rail, an AC unit, washing pole
      L.push(r(176, 108, 48, 40, 'recess', { shade: grain('recessShade', .5, 'up') })); L.push(r(176, 108, 48, 3, 'shadow', { a: .3 }));
      L.push(r(180, 112, 40, 24, 'win', { a: .9 })); L.push(r(180, 112, 22, 24, 'curtain', { a: .85 })); L.push(r(199.4, 112, 1.2, 24, 'sash'));
      ac(L, 196, 132, 16); L.push(r(178, 116, 44, .9, 'rail'));
      L.push(r(176, 134, 48, 14, 'balc', { shade: grain('balcShade', .35, 'down') })); L.push(r(176, 134, 48, .8, 'rimLit'));
      // white balconies stacked at both corners: a soffit, a dark door behind, a solid white parapet
      [[34, 30], [326, 30]].forEach(function (b, bi) { [[44, 88], [104, 148]].forEach(function (fl) {
        var x = b[0], w = b[1], y0 = fl[0], y1 = fl[1];
        L.push(r(x, y0, w, y1 - y0, 'recess', { shade: grain('recessShade', .45, 'up') }));
        L.push(r(x + 4, y0 + 4, w - 8, 22, 'win')); L.push(r(x + 4 + (bi ? 10 : 0), y0 + 4, w - 18, 22, 'curtain', { shade: grain('curtainShade', .3, 'down') })); L.push(r(x + w / 2, y0 + 4, 1, 22, 'sash'));
        L.push(r(x - 2, y0 - 3, w + 4, 3, 'balc')); L.push(r(x - 2, y0, w + 4, 1.4, 'shadow', { a: .22 }));
        L.push(r(x - 2, y1 - 22, w + 4, 22, 'balc', { shade: grain('balcShade', .4, bi ? 'left' : 'right', 1.4) })); L.push(r(x - 2, y1 - 22, w + 4, .9, 'rimLit'));
        L.push(r(x - 2, y1 - 2, w + 4, 2, 'balcShade')); L.push(r(bi ? x - 2 : x + w + 1, y1 - 22, 1, 22, 'balcShade', { a: .8 }));
      }); });
      [[44, 88], [104, 148]].forEach(function (fl) { L.push(r(66, fl[0], 5, fl[1] - fl[0], 'shadow', { a: .14 })); L.push(r(66, fl[0], 2.4, fl[1] - fl[0], 'shadow', { a: .1 })); L.push(r(319, fl[0], 7, fl[1] - fl[0], 'shadow', { a: .08 })); });
      pipe(L, 66, 30, 160); pipe(L, 322, 30, 160);
      // the gym: a warm-lit room, a black feature wall with mirrors, rows of machines, someone on a treadmill
      L.push(r(34, 160, 322, 24, 'soffit'));
      L.push(r(46, 184, 254, 56, 'inWall', { shade: grain('inWallShade', .35, 'down', 1.8) }));
      L.push(r(46, 184, 254, 5, 'inCeil')); L.push(r(46, 189, 254, .8, 'inWallShade'));
      L.push(r(46, 193, 254, 30, 'inMirror', { shade: grain('inMirrorShade', .3, 'up', 1.6) }));            // a mirror wall, warm with the room in it
      for (var mx = 46; mx < 300; mx += 32) { L.push(r(mx, 193, 1.2, 30, 'inBlack')); L.push(poly([mx + 6, 193, mx + 12, 193, mx + 5, 223, mx + 2, 223], 'glassLight', { a: .3 })); }
      L.push(r(46, 193, 254, 1.4, 'inBlack')); L.push(r(46, 216, 254, 7, 'inBlack', { shade: grain('inMachine', .3, 'down') }));
      L.push(r(46, 223, 254, 3, 'inWallShade'));
      L.push(r(46, 226, 254, 14, 'inFloor', { shade: grain('inFloorShade', .4, 'down') })); for (var fx = 50; fx < 300; fx += 14) L.push(r(fx, 226, .5, 14, 'inFloorShade', { a: .5 }));
      [62, 96, 130, 186, 214, 264, 290].forEach(function (lx) { L.push(r(lx - 4, 189, 8, 1.2, 'inLamp')); L.push(g(lx, 194, 9, 'inLamp', { d: .22, sy: .5 })); });
      // treadmills side on: deck, upright, console with a lit screen
      [[54, 1], [84, 1], [114, 1]].forEach(function (t) { var x = t[0], d = t[1];
        L.push(poly([x, 236, x + 24, 236, x + 24, 232.6, x, 233.4], 'inMachine')); L.push(r(x + 1, 232, 22, 1.2, 'inMachine2')); L.push(r(x + 2, 236, 2, 2, 'inMachine')); L.push(r(x + 20, 236, 2, 2, 'inMachine'));
        var ux = x + 21; L.push(line([ux, 232, ux + 2, 214], 'inMachine', 1.6)); L.push(r(ux - 3, 209, 9, 5.4, 'inMachine', { r: 1 })); L.push(r(ux - 2, 210, 7, 3, 'inScreen'));
        L.push(line([ux + 1, 217, ux - 6, 218.4], 'inMachine2', .9)); });
      // a dumbbell rack, a red bench, a power rack, a poster
      L.push(r(160, 222, 2, 14, 'inMachine')); L.push(r(176, 222, 2, 14, 'inMachine')); L.push(r(160, 222, 18, 1.6, 'inMachine')); L.push(r(160, 229, 18, 1.6, 'inMachine'));
      for (var dbx = 162.6; dbx < 176; dbx += 3.2) { L.push(c(dbx, 220.8, 1.3, 'inMachine2')); L.push(c(dbx, 227.8, 1.5, 'inMachine')); }
      L.push(r(244, 200, 1.6, 36, 'inMachine')); L.push(r(266, 200, 1.6, 36, 'inMachine')); L.push(r(244, 200, 23.6, 1.6, 'inMachine')); L.push(r(242, 214, 28, 1.2, 'inMachine2'));
      L.push(r(239, 212.6, 3, 4, 'inMachine', { r: .6 })); L.push(r(270, 212.6, 3, 4, 'inMachine', { r: .6 }));
      L.push(r(248, 228, 16, 3, 'inRed', { r: 1 })); L.push(r(250, 231, 1.4, 5, 'inMachine')); L.push(r(261, 231, 1.4, 5, 'inMachine'));
      L.push(r(204, 197, 12, 16, 'inPoster')); L.push(r(206, 200, 8, 1.4, 'inPosterInk')); L.push(r(206, 203, 6, 1, 'inPaper'));
      // spin bikes facing the window
      [[194, 1], [224, 1]].forEach(function (b) { var x = b[0]; L.push(line([x - 6, 236, x, 224, x + 6, 236], 'inMachine', 1.4)); L.push(c(x + 4, 230, 3.4, 'inMachine2')); L.push(r(x - 4, 221, 6, 1.6, 'inMachine', { r: .8 })); L.push(line([x + 3, 224, x + 6, 218, x + 9, 218], 'inMachine', 1.1)); });
      // the right window: a big promo poster
      L.push(r(312, 184, 44, 56, 'glass', { shade: grain('glassShade', .4, 'down') }));
      L.push(r(316, 188, 30, 36, 'inPoster', { shade: grain('fasciaShade', .25, 'down') })); L.push(r(316, 188, 30, 7, 'inPaper'));
      L.push({ t: 'text', text: '24h', x: 331, y: 193.6, size: 4.6, weight: 600, font: FONT, fill: 'inPoster', align: 'center' });
      L.push({ t: 'text', text: '2,980', x: 331, y: 210, size: 6.6, weight: 600, font: FONT, fill: 'inPaper', align: 'center' });
      L.push(r(320, 214, 22, 1.2, 'inPosterInk')); L.push(r(322, 217, 18, .9, 'inPaper', { a: .8 })); L.push(r(346, 188, 8, 36, 'inPaper', { a: .9 }));
      // the left corner: a block wall, a hedge, a no-dumping sign
      L.push(r(0, 212, 34, 32, 'block', { shade: grain('blockShade', .35, 'down') })); for (var by = 220; by < 244; by += 8) L.push(r(0, by, 34, .7, 'blockLine'));
      for (var bx = 8; bx < 34; bx += 16) L.push(r(bx, 212, .7, 32, 'blockLine', { a: .6 }));
      K.crown(L, [[6, 210, 8], [18, 206, 9], [30, 210, 7]], ['hedge', 'hedge2'], 'hedgeShade');
      L.push(r(8, 220, 16, 9, 'times', { r: .4 })); L.push(r(9, 221, 14, 3.2, 'red')); L.push(r(10, 226, 12, .8, 'timesInk', { a: .7 }));
      pavement(L, F, { seed: 9010, stains: 3, grate: [60, 246, 48], manhole: [300, 290, 16] });
      // facade: fascia band, piers, glazing bars, door
      F.push(r(34, 160, 266, 22, 'fascia', { shade: grain('fasciaShade', .35, 'down') })); F.push(r(300, 160, 56, 22, 'fascia2', { shade: grain('fascia2Shade', .35, 'down') }));
      F.push(r(34, 160, 322, .9, 'rimLit', { a: .7 })); F.push(r(34, 182, 322, 2, 'shadow', { a: .25 }));
      // the logo: a white tick, LifeFit, the 24h line
      F.push(poly([88, 170, 91, 166.4, 94.6, 170.6, 101, 163, 103.6, 165, 94.6, 175], 'fasciaInk'));
      F.push({ t: 'text', text: 'LifeFit', x: 107, y: 175, size: 11.5, weight: 600, font: FONT, fill: 'fasciaInk', align: 'left', glow: 'signGlow', blur: 4 });
      F.push({ t: 'text', text: '24h Fitness Gym', x: 156, y: 174.6, size: 5.4, weight: 600, font: FONT, fill: 'fasciaInk', align: 'left', ls: .4, a: .92 });
      F.push(r(314, 165, 30, 12, 'fasciaInk', { r: 1, a: .95 })); F.push({ t: 'text', text: '24h', x: 329, y: 174, size: 7, weight: 600, font: FONT, fill: 'fascia', align: 'center' });
      // brick piers at street level
      [[34, 12], [150, 10], [240, 10], [300, 12]].forEach(function (p) { brick(F, p[0], 184, p[1], 56, 'band', 'bandShade', 'bandLite', 200 + p[0]); F.push(r(p[0] + p[1] - 1.4, 184, 1.4, 56, 'shadow', { a: .16 })); F.push(r(p[0], 184, .8, 56, 'rimLit', { a: .35 })); });
      // glass with frames; the middle bay is the automatic door
      [[46, 104], [160, 80], [250, 50]].forEach(function (b) { F.push(r(b[0], 184, b[1], 2.4, 'frame')); F.push(r(b[0], 237, b[1], 3, 'frame', { shade: grain('frameShade', .4, 'down') }));
        F.push(r(b[0], 186, b[1], 51, 'glass', { a: .14 })); sheen(F, b[0], 186, b[1], 51, { a: .12, at: .2 }); });
      F.push(r(97, 184, 1.8, 56, 'frame')); F.push(r(176, 184, 1.8, 56, 'frame')); F.push(r(222.2, 184, 1.8, 56, 'frame')); F.push(r(199.2, 186, 1.6, 51, 'frameShade'));
      F.push(r(176, 199, 48, 3.4, 'inPaper', { a: .85 })); F.push(r(186, 200, 28, 1.2, 'fascia', { a: .9 }));
      F.push(r(250, 210, 50, 1.6, 'frame'));
      F.push(r(44, 240, 312, 4, 'coping', { shade: grain('copingShade', .4, 'down') })); F.push(r(44, 240, 312, .7, 'rimLit'));
      // the corner pole: concrete, step bolts, the signal on its arm, the street-name plate, a pedestrian light
      P.push(r(346, 0, 6, 250, 'pole', { shade: grain('poleShade', .45, 'right', 1.3) })); P.push(r(346, 0, 1.2, 250, 'rimLit', { a: .35 }));
      for (var sb = 120; sb < 230; sb += 9) P.push(r(sb % 18 ? 352 : 343.4, sb, 2.6, 1, 'poleShade'));
      P.push(r(312, 30, 36, 2.4, 'signal')); P.push(line([346, 44, 326, 32], 'signal', 1));
      P.push(r(300, 22, 30, 11, 'signal', { r: 2, shade: grain('signalShade', .4, 'down') }));
      [305.5, 315, 324.5].forEach(function (lx, i) { P.push(e(lx, 25, 4, 1.6, 'hood')); P.push(c(lx, 28, 3.2, i === 2 ? 'lampRed' : 'lampOff')); });
      P.push(r(330, 38, 30, 9, 'plateBlue', { r: .8 })); P.push(r(331, 39, 28, 7, 'plateBlue', { r: .6 }));
      P.push({ t: 'text', text: '百合ヶ丘駅北側', x: 345, y: 43.4, size: 3.8, weight: 600, font: JP, fill: 'plateInk', align: 'center' }); P.push(r(335, 44.6, 20, .5, 'plateInk', { a: .7 }));
      P.push(r(353, 146, 8, 16, 'signal', { r: 1 })); P.push(r(354.4, 148, 5.2, 5.2, 'lampOff', { r: .6 })); P.push(r(354.4, 155, 5.2, 5.2, 'lampRed', { r: .6, a: .9 }));
      P.push(r(343, 70, 14, 7, 'pole', { r: 1, shade: grain('poleShade', .4, 'down') })); P.push(r(342, 92, 16, 2, 'poleShade'));
      contact(P, 349, 250, 8, .2);
      // wires sagging across the sky to the pole
      P.push(line([0, 18, 120, 26, 240, 22, 346, 12], 'wire', .6, { a: .8 })); P.push(line([0, 34, 110, 40, 230, 38, 346, 20], 'wire', .5, { a: .7 }));
      P.push(line([352, 14, 380, 22, 400, 20], 'wire', .55)); P.push(line([352, 72, 380, 78, 400, 77], 'wire', .5)); P.push(line([20, 4, 200, 14, 346, 6], 'wire', .4, { a: .6 }));
      // the banners
      nobori(P, 70, 180, 252, 1); nobori(P, 124, 182, 251, .96); nobori(P, 256, 182, 251, .96); nobori(P, 286, 180, 252, 1);
      // a sandwich board by the door
      P.push(line([143, 248, 146, 224], 'frameShade', 1.2)); P.push(line([157, 248, 154, 224], 'frameShade', 1.2)); P.push(r(145, 223, 10, 18, 'inPaper', { r: .4 })); P.push(r(146.4, 225, 7.2, 4, 'fascia')); P.push(r(146.4, 231, 7.2, .8, 'inMachine2', { a: .6 })); P.push(r(146.4, 234, 5, .8, 'inMachine2', { a: .6 }));
      contact(P, 150, 248.6, 9, .14);
    } });
})();
