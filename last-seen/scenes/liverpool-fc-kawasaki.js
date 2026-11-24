/* Scene — liverpool-fc-kawasaki. Needs /last-seen/last-seen.js and /last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, grain = K.grain, rnd = K.rnd, mix = K.mix;
  var make = K.make, contact = K.contact;
  /* ================= Liverpool F.C. Kawasaki — the football centre in Fujimi, Kawasaki (Nov 23, 12:55), sunny =================
     from the clubhouse side of the artificial-turf pitch: bright green turf in mown bands with white lines and the
     orange-red circle of the full pitch over them, red boards all the way round, slim red lighting masts with the
     ball-stop net hung between them, small white goals on the far side, and beyond the net the town: a long glass
     office block, a white tower, flats, a yellow house on the left and a row of big trees on the right. A clear blue sky. */
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
  function windows(L, x, y, cols, rows, dx, dy, w, h, seed, lit) {   // a grid of windows; a few (lit) come on after dark
    var R = rnd(seed); for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) L.push(r(x + i * dx, y + j * dy, w, h, R() < (lit || .35) ? 'win' : 'farWin'));
  }
  function mast(L, x, top, foot, w, s) {   // a red lighting mast: a slim pole, a small head of lamps tilted at the pitch
    if (w) L.push(r(x - w / 2, top, w, foot - top, 'mast', { shade: grain('mastShade', .4, 'right') }));
    L.push(r(x - 4.4 * s, top - 3.6 * s, 8.8 * s, 4.2 * s, 'lampBox', { r: .5 }));
    for (var i = 0; i < 2; i++) L.push(r(x - 3.6 * s + i * 3.8 * s, top - 2.9 * s, 3.2 * s, 2.8 * s, 'lampFace', { r: .3 }));
  }
  function goal(L, x, foot, w, h) {        // a small far goal: white posts and bar, the net a pale veil
    L.push(r(x, foot - h, w, h, 'goalNet', { a: .35 })); for (var gx = x + 2; gx < x + w; gx += 2) L.push(r(gx, foot - h, .3, h, 'goal', { a: .35 }));
    L.push(r(x, foot - h, w, .9, 'goal')); L.push(r(x, foot - h, .9, h, 'goal')); L.push(r(x + w - .9, foot - h, .9, h, 'goal'));
  }
  function bag(L, x, foot, s, fill, o) {   // a kit bag left on the turf
    contact(L, x, foot, 5 * s, .16); L.push(r(x - 4 * s, foot - 5 * s, 8 * s, 5 * s, fill, { r: [2 * s, 2 * s, .8, .8], shade: grain('shadow', .2, 'down') }));
    L.push(r(x - 2.6 * s, foot - 6.2 * s, 5.2 * s, 1.4 * s, fill, { r: .6 * s })); if (o) L.push(r(x - 3 * s, foot - 3.2 * s, 6 * s, .7 * s, o, { a: .8 }));
  }
  function ring(cx, cy, rx, ry, a0, a1) { var pts = []; for (var a = a0; a <= a1 + .001; a += .06) pts.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); return pts; }
  // the same kit as at Shimotakaido: red pinstriped jerseys with white sleeves, white shorts, black socks; his neon boots, Andre's purple ones
  var PEOPLE = { rfShirt: '#c92a3a', rfPin: '#f1e9e6', rfSleeve: '#f3f1ed', rfCuff: '#c92a3a', rfCollar: '#f3f1ed', rfShorts: '#f2f1ec', rfHem: '#c92a3a', rfSock: '#1f1f22',
    rfShoe: '#d8ee3c', rfSole: '#f4f5ee', rfShoeMark: '#1f1f22', rfBand: '#1b1b1e', rfWatch: '#1b1b1e',
    anShoe: '#6c4c9e', anSole: '#4a3472', anShoeMark: '#d8cfe8',
    plRed: '#c23a3c', plWhite: '#efede8', plDark: '#33363b', plTeal: '#53b2a4', plNavy: '#2f3d5a', plGrey: '#8c8f93' };
  function tonePeople(t, k) { var o = {}; Object.keys(PEOPLE).forEach(function (n) { o[n] = mix(PEOPLE[n], t, k); }); return o; }
  var HZ = 166;   // the far edge of the pitch
  make('liverpool-fc-kawasaki', { seed: 1123, seenAt: '2026-11-23T12:55:00+09:00',
    place: { en: 'Liverpool F.C. Kawasaki', ja: 'リバプールFC 川崎' }, name: { en: 'Liverpool F.C. Kawasaki', ja: 'リバプールFC 川崎' }, area: { en: 'Fujimi, Kawasaki', ja: '川崎・富士見' },
    alt: 'Illustration of the artificial-turf football pitch at Liverpool F.C. Kawasaki on a sunny day: bright green turf with white lines and an orange-red circle, red boards all round, slim red lighting masts with a ball-stop net between them, small white goals on the far side, and beyond them a glass office block, a white tower, flats, a yellow house and a row of trees under a clear blue sky.',
    palette: Object.assign({ sky: '#4a8fdb', skyShade: '#a5cdf0', cloud: '#f3f6f9', cloudShade: '#cdd8e4', cloudLite: '#ffffff', cloudBase: '#bccbd9', sunWash: '#fff3d6',
      bldA: '#d8cbb3', bldAShade: '#bfb196', bldW: '#e9e8e3', bldWShade: '#cbcac4', bldG: '#b9bcbf', bldGShade: '#9fa3a7', bldP: '#c9b3a2', bldY: '#e3b63f', bldYShade: '#c2952c', roofT: '#566069', roofTShade: '#434b53', roofB: '#6d7f93',
      glass: '#a9cbdb', glassShade: '#86adc2', glassBand: '#eef1f0', win: '#8ea6ba', farWin: '#7c8b98',
      tree: '#5f8a48', tree2: '#7fa458', treeShade: '#456535', treeDeep: '#354f2a', aut: '#c4893c', aut2: '#dcaa55', autShade: '#9a6226', ochre: '#a9a044', ochre2: '#c4bb5e', ochreShade: '#7f7830',
      fence: '#3f6b52', board: '#c8202f', boardShade: '#a51826', boardInk: '#f6ece6', mast: '#c2222e', mastShade: '#8f1620', lampBox: '#3a3d41', lampFace: '#e9ecef', net: '#e9eff1', pole: '#b81f2b', poleLite: '#e25560',
      goal: '#f6f6f3', goalNet: '#e9ece9',
      turf: '#48a546', turfShade: '#398d39', turfLite: '#68bd58', turfDeep: '#327f37', turfFar: '#66b455', lineW: '#f3f5f1', lineR: '#e2643a',
      path: '#cfc8b8', pathShade: '#b7af9e', ball: '#f6f5f1', ballMark: '#c8202f', bench: '#d12f3a', benchShade: '#a3222c', cone: '#3f7fd0',
      bagA: '#2b2d31', bagB: '#b8333a', bagMark: '#e9e6df' }, PEOPLE),
    light: { noShadows: true,
      // morning: low sun from the left, cooler and paler, the masts throwing long shadows to the right
      morning: { set: Object.assign({ sky: '#83b3e2', skyShade: '#c6ddf2', cloud: '#f2f5f8', cloudShade: '#c9d3df', cloudBase: '#b4c0cf', turf: '#479a48', turfLite: '#63b05a', turfShade: '#3a883e', glass: '#b7d2df' }, tonePeople('#cbd8e2', .08)),
        add: { back: [r(0, HZ - 40, 400, 46, 'cloudLite', { a: .1 }), poly([120, 168, 122, 168, 204, 196, 198, 196], 'shadow', { a: .1 }), poly([284, 166, 286, 166, 372, 192, 366, 192], 'shadow', { a: .1 })], front: [] } },
      // midday, sunny: the sun high, short crisp shadows, the turf at its brightest
      midday: { add: { back: [r(0, HZ - 30, 400, 34, 'sunWash', { a: .1 }), poly([120, 168, 122, 168, 130, 176, 126, 176], 'shadow', { a: .14 }), poly([284, 166, 286, 166, 292, 172, 288, 172], 'shadow', { a: .14 })] } },
      // golden: low sun from the right, warm light on the buildings, long shadows to the left
      golden: { set: Object.assign({ sky: '#8aa6c6', skyShade: '#efc9a4', cloud: '#fbe6d0', cloudShade: '#dcb7a0', cloudLite: '#fff3e2', cloudBase: '#b9a1a3', sunWash: '#ffc58e',
          turf: '#649a3c', turfLite: '#90b44e', turfShade: '#4d7d32', turfFar: '#8dae4f', bldA: '#efcf9f', bldW: '#f7dcbc', bldG: '#d2b9a0', bldP: '#e6bd9c', bldY: '#f0b23c', glass: '#e6c7a4', glassShade: '#c9a685', glassBand: '#fbe3c6',
          aut: '#d58b3a', aut2: '#eab35b', board: '#d2302f', net: '#ffe9d2' }, tonePeople('#f0b07e', .1)),
        add: { back: [r(0, 0, 400, HZ, 'sunWash', { a: .16 }), poly([120, 168, 122, 168, 34, 200, 28, 200], 'shadow', { a: .12 }), poly([284, 166, 286, 166, 188, 196, 182, 196], 'shadow', { a: .12 }),
                      poly([376, 168, 378, 168, 286, 198, 280, 198], 'shadow', { a: .1 })],
               over: [poly([400, 20, 400, 160, 160, 300, 0, 300, 0, 250], 'sunWash', { a: .07 }), { t: 'halo', x: 410, y: 150, rx: 120, ry: 70, n: 6, fill: 'sunWash', a: .06 }] } },
      // night: the masts' lamps on, the pitch bright green in their pools under a dark sky, windows lit in the flats and the office
      night: { set: Object.assign({ sky: '#0f1630', skyShade: '#0a0f22', cloud: '#27304d', cloudShade: '#1c2440', cloudLite: '#3a4466', cloudBase: '#161c33',
          bldA: '#26262c', bldAShade: '#1c1c22', bldW: '#2a2c33', bldWShade: '#1f2127', bldG: '#22252c', bldGShade: '#191b21', bldP: '#28252a', bldY: '#3a3220', bldYShade: '#2a2416', roofT: '#15181d', roofTShade: '#0f1115', roofB: '#181c24',
          glass: '#1c2a3a', glassShade: '#141f2c', glassBand: '#2b3340', win: '#e8c27f', farWin: '#262b38',
          tree: '#18241c', tree2: '#1e2c22', treeShade: '#111a14', treeDeep: '#0c130e', aut: '#2a2218', aut2: '#33291b', autShade: '#1c160f', ochre: '#28261a', ochre2: '#302d1e', ochreShade: '#1a1912',
          fence: '#10201a', board: '#7c1820', boardShade: '#5a1118', boardInk: '#c9bfba', mast: '#5c141b', mastShade: '#3c0d12', lampBox: '#15171a', lampFace: '#fbfbff', net: '#55606a', pole: '#56131a', poleLite: '#7a2029',
          goal: '#d8dde2', goalNet: '#9aa3ab', turf: '#2f6b38', turfShade: '#255a2f', turfLite: '#3f7f45', turfDeep: '#1c4a26', turfFar: '#3a7a40', lineW: '#d6dde0', lineR: '#b9552f',
          path: '#2a2a2e', pathShade: '#202024', bagA: '#121316', bagB: '#4a1c1f', ball: '#dfe0e2', ballMark: '#7c1820', bench: '#6e1c22', benchShade: '#4c1318', cone: '#274b7c', flood: '#f2f5ff' }, tonePeople('#0d1124', .42)),
        add: { over: [{ t: 'halo', x: 120, y: 82, rx: 15, ry: 9, n: 5, fill: 'flood', a: .12 }, { t: 'halo', x: 284, y: 88, rx: 15, ry: 9, n: 5, fill: 'flood', a: .12 },
          { t: 'halo', x: 204, y: 98, rx: 10, ry: 7, n: 4, fill: 'flood', a: .1 }, { t: 'halo', x: 376, y: 84, rx: 15, ry: 9, n: 5, fill: 'flood', a: .12 }, { t: 'halo', x: 50, y: 70, rx: 14, ry: 9, n: 5, fill: 'flood', a: .1 },
          { t: 'halo', x: 200, y: 214, rx: 210, ry: 52, n: 7, fill: 'flood', a: .03 }, { t: 'halo', x: 210, y: 270, rx: 90, ry: 12, n: 6, fill: 'flood', a: .03 }, { t: 'halo', x: 220, y: 120, rx: 200, ry: 50, n: 6, fill: 'haze', a: .025 }] } } },
    breathe: { x: 0, y: 0, w: 0, h: 0 },
    // far side: players knocking a ball about, a keeper in teal, someone jogging back
    shoppers: [{ keys: [[0, 150], [7, 176], [9, 176], [16, 150]], period: 16, foot: 176, s: .36, coat: 'plRed', legs: 'plDark', shorts: 'plWhite', sock: 'plDark', sockHigh: true, shortSleeve: true, hair: 'hairDark', alpha: 1, shadow: false },
               { keys: [[0, 246], [6, 226], [9, 226], [15, 246]], period: 15, offset: 4, foot: 180, s: .4, coat: 'plWhite', legs: 'plDark', shorts: 'plDark', sock: 'plWhite', sockHigh: true, shortSleeve: true, hair: 'hairDark', alpha: 1, shadow: false },
               { keys: [[0, 322], [5, 322], [10, 340], [14, 340], [19, 322]], period: 19, offset: 2, foot: 172, s: .32, coat: 'plTeal', legs: 'plDark', hair: 'hairDark', alpha: 1, shadow: false },
               { keys: [[0, 290], [8, 266], [11, 266], [19, 290]], period: 19, offset: 9, foot: 174, s: .34, coat: 'plRed', legs: 'plDark', shorts: 'plWhite', sock: 'plDark', sockHigh: true, shortSleeve: true, hair: 'hairBrown', alpha: 1, shadow: false }],
    passersby: [{ start: 8, every: 26, dir: -1, speed: 24, foot: 286, s: 1.22, coat: 'plNavy', shortSleeve: true, legs: 'plDark', shorts: 'plDark', sock: 'plNavy', sockHigh: true, hair: 'hairDark', shoe: 'plGrey', sole: 'plWhite' },
                { start: 18, every: 31, dir: 1, speed: 20, foot: 279, s: 1.15, coat: 'plTeal', long: 2, legs: 'plDark', hair: 'hairBrown', shoe: 'plDark', sole: 'plGrey' }],
    stamp: { x0: 60, x1: 340, y0: 40, y1: 290 },
    ground: { y0: 252, y1: 296, xMin: 30, xMax: 384 },
    sig: { emerge: { x: 196, foot0: 214, foot1: 266, s0: .66, s1: 1.24, dur: 1.4 },
      // red pinstriped jersey with white sleeves and collar, white shorts with a red hem and his number 6, black socks, neon boots, a black headband over his shoulder-length hair, worn down, a watch
      person: { coat: 'rfShirt', pin: 'rfPin', pinGap: 2.1, pinW: .3, sleeve: 'rfSleeve', cuff: 'rfCuff', collar: 'rfCollar', shortSleeve: true, long: -3.6,
        shorts: 'rfShorts', shortsHem: 'rfHem', shortsNum: 6, legs: 'rfShorts', sock: 'rfSock', sockHigh: true, shoe: 'rfShoe', sole: 'rfSole', shoeMark: 'rfShoeMark',
        headband: 'rfBand', watch: 'rfWatch', hairDown: true, longHair: true, hair: 'hairDark', hat: false, bag: false },
      // Andre, number 10: the same kit, black socks, purple boots, short black hair
      company: [{ person: { coat: 'rfShirt', pin: 'rfPin', pinGap: 2.1, pinW: .3, sleeve: 'rfSleeve', cuff: 'rfCuff', collar: 'rfCollar', shortSleeve: true, long: -3.6,
        shorts: 'rfShorts', shortsHem: 'rfHem', shortsNum: 10, legs: 'rfShorts', sock: 'rfSock', sockHigh: true, shoe: 'anShoe', sole: 'anSole', shoeMark: 'anShoeMark', hair: 'hairDark', hat: false, bag: false, stride: 12 },
        dx: 27, dy: -1.6, ds: -.03, lag: .24 }] },
    build: function (L, F, P) {
      var i, x, y;
      L.push(r(0, 0, 400, HZ + 4, 'sky', { shade: grain('skyShade', .34, 'down', 1.6) }));
      // a clear day: two small clouds and a few wisps
      cloud(L, 304, 54, [[0, 0, 28, 9], [-20, 4, 17, 7], [22, 3, 19, 7], [2, -7, 17, 9]]);
      cloud(L, 92, 36, [[0, 0, 20, 6], [-15, 3, 12, 5], [15, 2, 13, 5]]);
      L.push(e(190, 22, 22, 2.2, 'cloudLite', { a: .6 })); L.push(e(214, 25, 12, 1.6, 'cloudLite', { a: .5 })); L.push(e(360, 26, 18, 2, 'cloudLite', { a: .55 }));
      // the town beyond the far net. Left to right: a grey block, the long glass office with its white upper floors, a white cube, the tower, a low white range, flats
      L.push(r(108, 130, 26, 36, 'bldG', { shade: grain('bldGShade', .3, 'right', 1.4) })); windows(L, 111, 134, 4, 5, 5.6, 6, 3, 3, 3, .3);
      L.push(r(150, 110, 34, 12, 'bldW', { shade: grain('bldWShade', .3, 'right', 1.4) })); windows(L, 153, 113, 6, 1, 5, 0, 3, 5, 5, .4);
      L.push(r(134, 120, 78, 46, 'glass', { shade: grain('glassShade', .34, 'down', 1.4) }));
      for (y = 120; y < HZ; y += 7.6) L.push(r(134, y, 78, 1.5, 'glassBand')); for (x = 134; x <= 212; x += 13) L.push(r(x - .4, 120, .8, 46, 'glassBand', { a: .7 }));
      windows(L, 137, 123, 6, 5, 13, 7.6, 9, 4.6, 21, .12);
      L.push(r(214, 132, 32, 34, 'bldW', { shade: grain('bldWShade', .3, 'right', 1.4) })); windows(L, 218, 137, 4, 3, 7, 8, 4, 4, 7, .3);
      L.push(r(250, 94, 17, 72, 'bldW', { shade: grain('bldWShade', .3, 'right', 1.4) })); windows(L, 252.5, 98, 3, 10, 4.8, 6.4, 2.8, 3, 9, .35); L.push(r(250, 91, 17, 3, 'bldWShade')); L.push(r(256, 86, 5, 5, 'bldG'));
      L.push(r(267, 146, 44, 20, 'bldW', { shade: grain('bldWShade', .3, 'right', 1.4) })); windows(L, 270, 150, 8, 2, 5.2, 7, 3, 3.4, 11, .3);
      L.push(r(288, 124, 28, 42, 'bldP', { shade: grain('bldAShade', .3, 'right', 1.4) })); windows(L, 291, 128, 4, 5, 6.4, 7, 4, 3.2, 13, .3); L.push(r(288, 122, 28, 2.4, 'roofT'));
      L.push(r(316, 132, 24, 34, 'bldG', { shade: grain('bldGShade', .3, 'right', 1.4) })); windows(L, 319, 136, 3, 4, 7, 7, 4.4, 3.2, 15, .3);
      [[338, 150, 18, 'roofT'], [92, 152, 16, 'roofB']].forEach(function (h) {
        L.push(r(h[0], h[1], h[2], HZ - h[1], 'bldW', { shade: grain('bldWShade', .3, 'right') }));
        L.push(poly([h[0] - 2, h[1], h[0] + h[2] / 2, h[1] - 7, h[0] + h[2] + 2, h[1]], h[3], { shade: grain('roofTShade', .3, 'down') }));
        L.push(r(h[0] + 3, h[1] + 3, 4, 3.4, 'win')); L.push(r(h[0] + h[2] - 7, h[1] + 3, 4, 3.4, 'farWin')); });
      // the row of big trees down the right, still mostly green, a couple turning
      canopy(L, 382, 132, 30, 30, 61, ['tree', 'tree2', 'treeShade']); canopy(L, 352, 146, 16, 16, 62, ['tree', 'tree2', 'treeShade']); canopy(L, 366, 156, 14, 9, 63, ['ochre', 'ochre2', 'ochreShade']);
      canopy(L, 232, 160, 12, 7, 64, ['tree', 'tree2', 'treeShade']); canopy(L, 124, 160, 10, 6, 65, ['aut', 'aut2', 'autShade']);
      // behind the net on the left, across the lane: the yellow house, a grey house, a low workshop
      L.push(r(0, 104, 46, 96, 'bldY', { shade: grain('bldYShade', .34, 'right', 1.4) })); L.push(poly([-4, 105, 21, 88, 50, 105], 'roofT', { shade: grain('roofTShade', .3, 'down') }));
      L.push(r(8, 116, 10, 9, 'win')); L.push(r(26, 116, 10, 9, 'farWin')); L.push(r(8, 138, 10, 9, 'farWin')); L.push(r(26, 138, 10, 9, 'win')); L.push(r(0, 131, 46, 1.2, 'bldYShade'));
      L.push(r(46, 126, 34, 60, 'bldA', { shade: grain('bldAShade', .3, 'right', 1.4) })); L.push(poly([43, 127, 63, 114, 83, 127], 'roofB', { shade: grain('roofTShade', .3, 'down') }));
      L.push(r(52, 134, 8, 7, 'farWin')); L.push(r(66, 134, 8, 7, 'win')); L.push(r(52, 152, 8, 7, 'win'));
      L.push(r(80, 144, 14, 30, 'bldW', { shade: grain('bldWShade', .3, 'right', 1.4) })); L.push(r(83, 149, 5, 4, 'farWin'));
      // the far side: a green mesh fence, the red boards along the touchline with the club's white marks on them
      L.push(r(100, HZ - 13, 300, 13, 'fence', { a: .5 })); L.push(r(100, HZ - 13, 300, .8, 'fence')); for (x = 104; x < 400; x += 7) L.push(r(x, HZ - 13, .6, 13, 'fence', { a: .8 }));
      L.push(r(100, HZ - 6.4, 300, 6.8, 'board', { shade: grain('boardShade', .3, 'down') }));
      for (x = 116; x < 396; x += 34) { L.push(r(x, HZ - 5, 2.4, 3.6, 'boardInk', { r: [.3, .3, 1.2, 1.2] })); L.push(r(x + 4, HZ - 4.4, 9, .8, 'boardInk')); L.push(r(x + 4, HZ - 2.8, 6, .7, 'boardInk', { a: .8 })); }
      // the pitch: mown bands, deeper toward us
      L.push(r(0, HZ, 400, 300 - HZ, 'turf', { shade: grain('turfShade', .3, 'down', 1.3) }));
      L.push(r(0, HZ, 400, 8, 'turfFar', { a: .7 }));
      for (i = 0, y = HZ; y < 300; i++) { var hb = 3 + i * i * .9; if (i % 2) L.push(r(0, y, 400, hb, 'turfLite', { a: .32 })); y += hb; }
      // markings. White for the three small courts: the far touchline, their penalty arcs, the lines between them running at us, a centre circle.
      // Orange-red for the full pitch laid over them: the big circle and its halfway line.
      L.push(r(104, HZ + 3, 296, .7, 'lineW'));
      L.push(line(ring(141, HZ + 3, 34, 8, 0, Math.PI), 'lineW', .8)); L.push(line(ring(275, HZ + 3, 34, 8, 0, Math.PI), 'lineW', .8));
      L.push(poly([199, HZ + 3, 200.6, HZ + 3, 216, 274, 206, 274], 'lineW'));
      L.push(poly([112, HZ + 3, 113.4, HZ + 3, 58, 274, 49, 274], 'lineW')); L.push(poly([318, HZ + 3, 319.4, HZ + 3, 376, 274, 367, 274], 'lineW'));
      L.push(line(ring(206, 214, 50, 12, 0, Math.PI * 2), 'lineW', 1.1)); L.push(e(206, 214, 2, .8, 'lineW'));
      L.push(line(ring(206, 216, 96, 24, 0, Math.PI * 2), 'lineR', 1.2, { a: .9 })); L.push(r(60, 215.4, 340, 1.1, 'lineR', { a: .85 }));
      L.push(r(0, 274, 400, 2.4, 'lineW'));
      // the far goals, the red masts, and the ball-stop net hung between them
      goal(L, 128, HZ + 4, 26, 12); goal(L, 262, HZ + 4, 26, 12); goal(L, 348, HZ + 2, 20, 10);
      for (y = 96; y < HZ - 13; y += 9) L.push(r(104, y, 296, .3, 'net', { a: .3 })); for (x = 112; x < 400; x += 12) L.push(r(x, 92, .3, HZ - 105, 'net', { a: .2 }));
      L.push(r(104, 92, 296, .6, 'net', { a: .6 }));
      mast(L, 120, 85, HZ + 2, 1.5, .9); mast(L, 204, 100, HZ, 1.1, .6); mast(L, 284, 91, HZ + 1, 1.4, .85); mast(L, 376, 87, HZ + 2, 1.5, .9);
      // down the left: the lane side. A strip of gravel outside the pitch, the red boards receding to the far corner, red poles and the net between them
      var poles = [[8, 14, 242, 2.8], [30, 44, 222, 2.4], [52, 70, 200, 2], [70, 88, 186, 1.7], [85, 100, 178, 1.5], [97, 108, 173, 1.3], [107, 114, 170, 1.1]];
      L.push(poly([0, HZ, 107, HZ, 107, 170, 4, 244, 0, 244], 'path', { shade: grain('pathShade', .3, 'down') }));
      L.push(poly([0, 232, 107, 163, 107, 170, 0, 244], 'board', { shade: grain('boardShade', .3, 'down') }));
      for (i = 0; i < 4; i++) { x = 14 + i * 24; y = 236 - (x / 107) * 71; L.push(r(x, y - 3.2 + i * .5, 2.2 - i * .3, 3 - i * .4, 'boardInk', { a: .9 })); }
      for (i = 0; i < poles.length - 1; i++) { var a = poles[i], b = poles[i + 1];
        for (var u = 0; u <= 1.001; u += .25) L.push(line([a[0], a[1] + (a[2] - a[1]) * u, b[0], b[1] + (b[2] - b[1]) * u], 'net', .35, { a: .4 }));
        for (var v = .2; v < 1; v += .2) { var vx = a[0] + (b[0] - a[0]) * v, t0 = a[1] + (b[1] - a[1]) * v, t1 = a[2] + (b[2] - a[2]) * v; L.push(line([vx, t0, vx, t1], 'net', .3, { a: .3 })); } }
      L.push(line(poles.map(function (p) { return [p[0], p[1]]; }).reduce(function (m, q) { return m.concat(q); }, []), 'net', .7));
      poles.forEach(function (p) { L.push(r(p[0] - p[3] / 2, p[1], p[3], p[2] - p[1], 'pole', { shade: grain('mastShade', .25, 'right') })); L.push(r(p[0] - p[3] / 2, p[1], p[3] * .3, p[2] - p[1], 'poleLite', { a: .5 })); });
      mast(L, 52, 73, 200, 0, .8);
      // kit bags along the net, a water bottle
      bag(L, 62, 212, .9, 'bagA', 'bagMark'); bag(L, 76, 204, .8, 'bagB'); L.push(r(86, 196, 1.6, 4, 'cloudLite', { r: .5, a: .9 }));
      // on the near touchline: a red bench with a bag on it (on the left: they walk off to the right), two training cones, and the ball at his feet
      contact(P, 76, 268, 24, .16); P.push(r(58, 260, 3, 8, 'benchShade')); P.push(r(91, 260, 3, 8, 'benchShade')); P.push(r(54, 256, 44, 4.4, 'bench', { r: 1, shade: grain('benchShade', .3, 'down') }));
      P.push(r(72, 249, 13, 7, 'bagA', { r: [2.4, 2.4, .8, .8] })); P.push(r(74.6, 247.6, 7.8, 1.8, 'bagA', { r: .8 })); P.push(r(74, 252.4, 9, .9, 'bagMark', { a: .8 }));
      [[126, 270], [142, 264]].forEach(function (q) { contact(P, q[0], q[1], 4, .16); P.push(poly([q[0] - 3.6, q[1], q[0] - 1, q[1] - 5, q[0] + 1, q[1] - 5, q[0] + 3.6, q[1]], 'cone')); P.push(r(q[0] - 2.2, q[1] - 2.6, 4.4, .9, 'lineW', { a: .85 })); });
      contact(P, 166, 268, 4.4, .2); P.push(c(166, 264.6, 3.4, 'ball', { shade: grain('cloudShade', .35, 'br', 1.2) }));
      P.push(poly([165.2, 263.2, 167, 263, 167.6, 264.6, 166.2, 265.6, 164.8, 264.8], 'ballMark')); P.push(r(163, 266.6, 1.2, .8, 'ballMark', { a: .7 })); P.push(r(168.4, 262, 1, .8, 'ballMark', { a: .7 }));
    } });
})();
