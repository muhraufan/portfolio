/* Scene — shimotakaido-ozora-park. Needs /last-seen/last-seen.js and /last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, grain = K.grain, rnd = K.rnd, mix = K.mix;
  var make = K.make, contact = K.contact, vending = K.vending;
  /* ================= Shimotakaido Ozora Park — the sports court, Suginami (Nov 3, 14:05), sunny, big cumulus =================
     from the touchline of the new artificial-turf pitch: bright green turf in mown bands with white, blue and yellow
     markings, the tall black ball-stop net on its poles down the left with autumn trees behind it, floodlight masts,
     players knocking a ball about on the far side, goals, a low fence, and beyond it the neighbourhood: low apartment
     blocks, houses and a temple's two-tier roof with its finial. Big white cumulus in a deep blue sky. */
  function canopy(L, cx, cy, rx, ry, seed, v) {   // a tree mass: one silhouette, a lit crown, a darker underside (as yoyogi-park)
    var R = rnd(seed), i, a, d, body = [], crown = [], under = [];
    for (i = 0; i < 26; i++) { a = R() * Math.PI * 2; d = Math.pow(R(), .5) * .7; body.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, rx * (.18 + R() * .15), ry * (.18 + R() * .15), R() * 3]); }
    for (i = 0; i < 8; i++) { a = -Math.PI * (.5 + R() * .45); d = .3 + R() * .5; crown.push([cx - rx * .12 + Math.cos(a) * rx * d, cy - ry * .1 + Math.sin(a) * ry * d, rx * (.15 + R() * .12), ry * (.13 + R() * .1), R() * 3]); }
    for (i = 0; i < 8; i++) { a = Math.PI * (.05 + R() * .9); d = .45 + R() * .4; under.push([cx + rx * .1 + Math.cos(a) * rx * d, cy + ry * .18 + Math.sin(a) * ry * d * .8, rx * (.16 + R() * .12), ry * (.12 + R() * .1), R() * 3]); }
    L.push({ t: 'blob', clumps: body, fill: v[0], shade: grain(v[2], .14, 'down', 1.7),
      inner: [{ clumps: under, fill: v[2], shade: grain('treeDeep', .25, 'down', 1.5) }, { clumps: crown, fill: v[1], shade: grain(v[0], .14, 'br', 1.6) }] });
  }
  function cloud(L, x, y, cl) {      // a cumulus: a flat, shaded base, then each heaped lobe with its own shade, then the sunlit tops
    // (each lobe is its own shape: one path through all of them would join them with straight cuts of sky)
    var cs = cl.map(function (q) { return [x + q[0], y + q[1], q[2], q[3]]; });
    cs.forEach(function (q) { L.push({ t: 'blob', clumps: [[q[0], q[1] + q[3] * .42, q[2] * .94, q[3] * .62]], fill: 'cloudBase' }); });
    cs.forEach(function (q) { L.push({ t: 'blob', clumps: [q], fill: 'cloud', shade: grain('cloudShade', .4, 'down', 1.5) }); });
    cs.forEach(function (q) { L.push({ t: 'blob', clumps: [[q[0] - q[2] * .14, q[1] - q[3] * .34, q[2] * .72, q[3] * .5]], fill: 'cloudLite' }); });
  }
  function windows(L, x, y, cols, rows, dx, dy, w, h, seed, lit) {   // a grid of windows; a few (lit) come on after dark
    var R = rnd(seed); for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) L.push(r(x + i * dx, y + j * dy, w, h, R() < (lit || .35) ? 'win' : 'farWin'));
  }
  function flood(L, x, top, foot, w, s) {   // a floodlight mast: a slim pole, a head of lamps tilted at the pitch
    L.push(r(x - w / 2, top, w, foot - top, 'mast', { shade: grain('mastShade', .4, 'right') }));
    L.push(r(x - 6 * s, top - 4.6 * s, 12 * s, 5.2 * s, 'mast', { r: .5 }));
    for (var i = 0; i < 3; i++) L.push(r(x - 5.2 * s + i * 3.6 * s, top - 3.8 * s, 3 * s, 3.4 * s, 'lampFace', { r: .3 }));
    L.push(r(x - 6 * s, top - 4.6 * s, 12 * s, .8 * s, 'mastShade'));
  }
  function goal(L, x, foot, w, h) {        // a far goal: white posts and bar, the net a pale veil
    L.push(r(x, foot - h, w, h, 'goalNet', { a: .35 })); for (var gx = x + 2; gx < x + w; gx += 2) L.push(r(gx, foot - h, .3, h, 'goal', { a: .35 }));
    L.push(r(x, foot - h, w, .9, 'goal')); L.push(r(x, foot - h, .9, h, 'goal')); L.push(r(x + w - .9, foot - h, .9, h, 'goal'));
  }
  function bag(L, x, foot, s, fill, o) {   // a kit bag or backpack left on the turf
    contact(L, x, foot, 5 * s, .16); L.push(r(x - 4 * s, foot - 5 * s, 8 * s, 5 * s, fill, { r: [2 * s, 2 * s, .8, .8], shade: grain('shadow', .2, 'down') }));
    L.push(r(x - 2.6 * s, foot - 6.2 * s, 5.2 * s, 1.4 * s, fill, { r: .6 * s })); if (o) L.push(r(x - 3 * s, foot - 3.2 * s, 6 * s, .7 * s, o, { a: .8 }));
  }
  var PEOPLE = { rfShirt: '#c92a3a', rfPin: '#f1e9e6', rfSleeve: '#f3f1ed', rfCuff: '#c92a3a', rfCollar: '#f3f1ed', rfShorts: '#f2f1ec', rfHem: '#c92a3a', rfSock: '#1f1f22',
    rfShoe: '#d8ee3c', rfSole: '#f4f5ee', rfShoeMark: '#1f1f22', rfBand: '#1b1b1e', rfWatch: '#1b1b1e',
    anShoe: '#6c4c9e', anSole: '#4a3472', anShoeMark: '#d8cfe8',
    plRed: '#c23a3c', plWhite: '#efede8', plDark: '#33363b', plTeal: '#53b2a4', plNavy: '#2f3d5a', plGrey: '#8c8f93' };
  function tonePeople(t, k) { var o = {}; Object.keys(PEOPLE).forEach(function (n) { o[n] = mix(PEOPLE[n], t, k); }); return o; }
  var HZ = 166;   // the far edge of the pitch
  make('shimotakaido-ozora-park', { seed: 1103, seenAt: '2026-11-03T14:05:00+09:00',
    place: { en: 'Shimotakaido Ozora Park', ja: '下高井戸おおぞら公園' }, name: { en: 'Shimotakaido Ozora Park', ja: '下高井戸おおぞら公園' }, area: { en: 'Shimotakaido, Tokyo', ja: '東京・下高井戸' },
    alt: 'Illustration of the new artificial-turf football pitch at Shimotakaido Ozora Park on a sunny afternoon: bright green turf with white, blue and yellow lines, a tall black ball-stop net on the left with autumn trees behind it, floodlight masts, players and goals on the far side, low apartment blocks and a temple roof beyond, and big white clouds in a blue sky.',
    palette: Object.assign({ sky: '#4f93da', skyShade: '#9cc6ee', cloud: '#f3f6f9', cloudShade: '#cdd8e4', cloudLite: '#ffffff', cloudBase: '#b9c7d6', sunWash: '#fff3d6',
      bldA: '#d8cbb3', bldAShade: '#bfb196', bldW: '#e7e6e1', bldWShade: '#c9c8c2', bldG: '#b9bcbf', bldGShade: '#9fa3a7', bldP: '#d9c3b5', roofT: '#566069', roofTShade: '#434b53', roofB: '#6d7f93',
      temple: '#3f4a4c', templeShade: '#2f3839', templeLite: '#5d6a6b', templeWall: '#ece9e1', templeWood: '#8a5a3c', finial: '#a08a5a',
      win: '#8ea6ba', farWin: '#7c8b98', sign: '#d24b3c', signInk: '#f3efe6',
      tree: '#6b8a4c', tree2: '#86a15d', treeShade: '#4b6537', treeDeep: '#3a4f2b', aut: '#c4893c', aut2: '#dcaa55', autShade: '#9a6226', ochre: '#b59a44', ochre2: '#cdb763', ochreShade: '#8a7330',
      rust: '#b0663a', rust2: '#cf8a52', rustShade: '#83472a', trunk: '#5f4c3d',
      fence: '#3c4a44', mast: '#3d4144', mastShade: '#2a2d30', lampFace: '#e9ecef', net: '#1f2224', pole: '#1b1d1f', poleLite: '#4a4e52', goal: '#f4f4f1', goalNet: '#e9ece9',
      turf: '#4fa64a', turfShade: '#3f8f3c', turfLite: '#6cbc5a', turfDeep: '#36803a', turfFar: '#69b257', lineW: '#f3f5f1', lineB: '#2f6fc0', lineY: '#e8cf3a',
      hedge: '#5e7d45', hedgeShade: '#48653a', path: '#cfc8b8', pathShade: '#b7af9e', ball: '#f6f5f1', ballMark: '#26282b',
      bagA: '#2b2d31', bagB: '#b8333a', bagC: '#46608c', bagMark: '#e9e6df' }, PEOPLE),
    light: { noShadows: true,
      // morning: low sun from the left (east), cooler and paler, the net and masts throwing long shadows to the right
      morning: { set: Object.assign({ sky: '#83b3e2', skyShade: '#c3dbf1', cloud: '#f2f5f8', cloudShade: '#c9d3df', cloudBase: '#b4c0cf', turf: '#4c9c4c', turfLite: '#66b25c', turfShade: '#3d8a40' }, tonePeople('#cbd8e2', .08)),
        add: { back: [r(0, HZ - 40, 400, 46, 'cloudLite', { a: .1 }),
                      poly([4, 252, 107, 170, 140, 170, 60, 252], 'shadow', { a: .08 }),
                      poly([126, 168, 128, 168, 210, 196, 204, 196], 'shadow', { a: .1 }), poly([296, 166, 298, 166, 384, 192, 378, 192], 'shadow', { a: .1 })],
               front: [] } },
      // midday, sunny: the sun high and a little south, short crisp shadows, the turf at its brightest
      midday: { add: { back: [r(0, HZ - 30, 400, 34, 'sunWash', { a: .1 }), poly([126, 168, 128, 168, 136, 176, 132, 176], 'shadow', { a: .14 }), poly([296, 166, 298, 166, 304, 172, 300, 172], 'shadow', { a: .14 })] } },
      // golden: low sun from the right (south-west), warm light on the cloud tops, long shadows to the left
      golden: { set: Object.assign({ sky: '#8aa6c6', skyShade: '#efc9a4', cloud: '#fbe6d0', cloudShade: '#dcb7a0', cloudLite: '#fff3e2', cloudBase: '#b9a1a3', sunWash: '#ffc58e',
          turf: '#689a3c', turfLite: '#93b44e', turfShade: '#4f7d32', turfFar: '#8fae4f', bldA: '#efcf9f', bldW: '#f7dcbc', bldG: '#d2b9a0', bldP: '#efc6a6', templeWall: '#f4dcc0', aut: '#d58b3a', aut2: '#eab35b' }, tonePeople('#f0b07e', .1)),
        add: { back: [r(0, 0, 400, HZ, 'sunWash', { a: .16 }), r(226, 104, 2, 62, 'rim', { a: .0 }), poly([126, 168, 128, 168, 40, 200, 34, 200], 'shadow', { a: .12 }), poly([296, 166, 298, 166, 200, 196, 194, 196], 'shadow', { a: .12 }),
                      poly([380, 168, 382, 168, 290, 198, 284, 198], 'shadow', { a: .1 })],
               over: [poly([400, 20, 400, 160, 160, 300, 0, 300, 0, 250], 'sunWash', { a: .07 }), { t: 'halo', x: 410, y: 150, rx: 120, ry: 70, n: 6, fill: 'sunWash', a: .06 }] } },
      // night: the floodlights on, the pitch bright green in their pools under a dark sky with moonlit cloud, windows lit
      night: { set: Object.assign({ sky: '#0f1630', skyShade: '#0a0f22', cloud: '#27304d', cloudShade: '#1c2440', cloudLite: '#3a4466', cloudBase: '#161c33',
          bldA: '#26262c', bldAShade: '#1c1c22', bldW: '#2a2c33', bldWShade: '#1f2127', bldG: '#22252c', bldGShade: '#191b21', bldP: '#28252a', roofT: '#15181d', roofTShade: '#0f1115', roofB: '#181c24',
          temple: '#12161a', templeShade: '#0c0f12', templeLite: '#232a2e', templeWall: '#2a2a2c', templeWood: '#2a1c14', finial: '#4a4330', win: '#e8c27f', farWin: '#262b38', sign: '#e0604a',
          tree: '#18241c', tree2: '#1e2c22', treeShade: '#111a14', treeDeep: '#0c130e', aut: '#2a2218', aut2: '#33291b', autShade: '#1c160f', ochre: '#28261a', ochre2: '#302d1e', ochreShade: '#1a1912', rust: '#2a1d16', rust2: '#33241a', rustShade: '#1c130e',
          fence: '#10151a', mast: '#15181b', mastShade: '#0c0e10', lampFace: '#fbfbff', net: '#090a0c', pole: '#0a0b0d', poleLite: '#1c1f22', goal: '#d8dde2', goalNet: '#9aa3ab',
          turf: '#2f6b38', turfShade: '#255a2f', turfLite: '#3f7f45', turfDeep: '#1c4a26', turfFar: '#3a7a40', lineW: '#d6dde0', lineB: '#2f5d9a', lineY: '#bba93c',
          hedge: '#16221a', hedgeShade: '#0f1812', path: '#2a2a2e', pathShade: '#202024', bagA: '#121316', bagB: '#4a1c1f', bagC: '#1c2538', ball: '#dfe0e2', flood: '#f2f5ff' }, tonePeople('#0d1124', .42)),
        add: { over: [{ t: 'halo', x: 126, y: 81, rx: 16, ry: 10, n: 5, fill: 'flood', a: .12 }, { t: 'halo', x: 296, y: 89, rx: 16, ry: 10, n: 5, fill: 'flood', a: .12 },
          { t: 'halo', x: 214, y: 98, rx: 10, ry: 7, n: 4, fill: 'flood', a: .1 }, { t: 'halo', x: 380, y: 83, rx: 16, ry: 10, n: 5, fill: 'flood', a: .12 }, { t: 'halo', x: 52, y: 75, rx: 14, ry: 9, n: 5, fill: 'flood', a: .1 },
          { t: 'halo', x: 200, y: 214, rx: 210, ry: 52, n: 7, fill: 'flood', a: .03 }, { t: 'halo', x: 210, y: 270, rx: 90, ry: 12, n: 6, fill: 'flood', a: .03 }, { t: 'halo', x: 220, y: 120, rx: 200, ry: 50, n: 6, fill: 'haze', a: .025 }] } } },
    breathe: { x: 0, y: 0, w: 0, h: 0 },
    // far side: players knocking a ball about, a keeper in teal, someone jogging back
    shoppers: [{ keys: [[0, 150], [7, 176], [9, 176], [16, 150]], period: 16, foot: 176, s: .36, coat: 'plRed', legs: 'plDark', shorts: 'plWhite', sock: 'plDark', sockHigh: true, shortSleeve: true, hair: 'hairDark', alpha: 1, shadow: false },
               { keys: [[0, 246], [6, 222], [9, 222], [15, 246]], period: 15, offset: 4, foot: 180, s: .4, coat: 'plWhite', legs: 'plDark', shorts: 'plDark', sock: 'plWhite', sockHigh: true, shortSleeve: true, hair: 'hairDark', alpha: 1, shadow: false },
               { keys: [[0, 330], [5, 330], [10, 348], [14, 348], [19, 330]], period: 19, offset: 2, foot: 172, s: .32, coat: 'plTeal', legs: 'plDark', hair: 'hairDark', alpha: 1, shadow: false },
               { keys: [[0, 286], [8, 262], [11, 262], [19, 286]], period: 19, offset: 9, foot: 174, s: .34, coat: 'plRed', legs: 'plDark', shorts: 'plWhite', sock: 'plDark', sockHigh: true, shortSleeve: true, hair: 'hairBrown', alpha: 1, shadow: false }],
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
      var R = rnd(1103), i, x, y;
      L.push(r(0, 0, 400, HZ + 4, 'sky', { shade: grain('skyShade', .3, 'down', 1.6) }));
      // big cumulus heaped up over the neighbourhood, a smaller one left, wisps up high
      cloud(L, 268, 76, [[0, 0, 56, 22], [-46, 10, 34, 17], [48, 8, 40, 19], [-16, -20, 34, 22], [18, -30, 28, 21], [-42, -6, 22, 15], [80, 16, 26, 12], [40, -14, 26, 17]]);
      cloud(L, 74, 58, [[0, 0, 40, 15], [-28, 6, 24, 11], [30, 5, 28, 13], [2, -14, 26, 16], [-12, -8, 18, 12]]);
      cloud(L, 176, 116, [[0, 0, 30, 8], [-22, 2, 18, 6], [24, 2, 20, 7], [4, -6, 16, 8]]);
      cloud(L, 372, 124, [[0, 0, 26, 8], [18, 2, 16, 6], [-6, -6, 14, 7]]);
      L.push(e(162, 20, 22, 2.6, 'cloudLite', { a: .7 })); L.push(e(184, 23, 12, 1.8, 'cloudLite', { a: .6 })); L.push(e(352, 16, 20, 2.2, 'cloudLite', { a: .65 }));
      // the neighbourhood beyond the far fence
      L.push(r(116, 118, 18, 48, 'bldW', { shade: grain('bldWShade', .3, 'right', 1.4) })); windows(L, 119, 122, 3, 7, 5, 6, 2.6, 2.6, 3, .3);
      L.push(r(140, 132, 48, 34, 'bldA', { shade: grain('bldAShade', .3, 'right', 1.4) })); L.push(r(140, 132, 48, 1.4, 'bldAShade'));
      windows(L, 144, 137, 6, 4, 7.4, 7, 4, 3.4, 5, .3); L.push(r(176, 124, 10, 8, 'sign')); L.push(r(178, 126.6, 6, .9, 'signInk')); L.push(r(178, 128.8, 4, .8, 'signInk'));
      L.push(r(226, 104, 18, 62, 'bldW', { shade: grain('bldWShade', .3, 'right', 1.4) })); windows(L, 229, 108, 3, 9, 5, 6, 2.8, 2.8, 7, .35);
      L.push(r(244, 112, 16, 54, 'bldG', { shade: grain('bldGShade', .3, 'right', 1.4) })); windows(L, 246.5, 116, 3, 8, 4.6, 6, 2.4, 2.6, 11, .3);
      L.push(r(226, 101, 18, 3, 'bldWShade')); L.push(r(230, 94, 8, 7, 'sign')); L.push(r(231.4, 96.4, 5, .8, 'signInk'));
      L.push(r(262, 138, 34, 28, 'bldP', { shade: grain('bldAShade', .3, 'right', 1.4) })); windows(L, 265, 142, 5, 3, 6.4, 7, 3.4, 3.2, 13, .3);
      // houses with pitched tiled roofs
      [[296, 150, 22, 'roofT'], [316, 154, 18, 'roofB'], [100, 152, 16, 'roofT']].forEach(function (h) {
        L.push(r(h[0], h[1], h[2], HZ - h[1], 'bldW', { shade: grain('bldWShade', .3, 'right') }));
        L.push(poly([h[0] - 2, h[1], h[0] + h[2] / 2, h[1] - 7, h[0] + h[2] + 2, h[1]], h[3], { shade: grain('roofTShade', .3, 'down') }));
        L.push(r(h[0] + 3, h[1] + 3, 4, 3.4, 'win')); L.push(r(h[0] + h[2] - 7, h[1] + 3, 4, 3.4, 'farWin')); });
      // the temple: a white plastered base, a two-tier roof with upswept eaves, the finial on top
      L.push(r(340, 148, 48, 18, 'templeWall', { shade: grain('bldWShade', .3, 'right') })); for (x = 344; x < 386; x += 8) L.push(r(x, 148, 1.2, 18, 'templeWood', { a: .8 }));
      L.push(poly([330, 149, 346, 140, 382, 140, 398, 149, 394, 150.6, 334, 150.6], 'temple', { shade: grain('templeShade', .35, 'down') })); L.push(r(334, 149.4, 60, 1.2, 'templeLite'));
      L.push(r(348, 133, 32, 7, 'templeWall')); L.push(r(352, 133, 1, 7, 'templeWood')); L.push(r(375, 133, 1, 7, 'templeWood'));
      L.push(poly([340, 134, 352, 126, 376, 126, 388, 134, 385, 135.4, 343, 135.4], 'temple', { shade: grain('templeShade', .35, 'down') })); L.push(r(343, 134.2, 42, 1, 'templeLite'));
      L.push(poly([354, 126, 364, 120, 374, 126], 'temple')); L.push(r(363.4, 106, 1.2, 15, 'finial')); for (y = 108; y < 119; y += 2.4) L.push(r(361.8, y, 4.4, .9, 'finial'));
      L.push(c(364, 105, 1.4, 'finial'));
      // trees along the far side, the leaves turning
      canopy(L, 204, 156, 22, 13, 41, ['tree', 'tree2', 'treeShade']); canopy(L, 190, 160, 12, 8, 42, ['aut', 'aut2', 'autShade']);
      canopy(L, 280, 156, 14, 10, 43, ['ochre', 'ochre2', 'ochreShade']); canopy(L, 326, 152, 16, 13, 44, ['tree', 'tree2', 'treeShade']);
      canopy(L, 392, 146, 18, 20, 45, ['tree', 'tree2', 'treeShade']); canopy(L, 130, 158, 14, 9, 46, ['rust', 'rust2', 'rustShade']); canopy(L, 252, 162, 14, 6, 47, ['tree2', 'ochre2', 'treeShade']);
      // behind the net on the left: a stand of tall autumn trees
      canopy(L, 30, 120, 44, 52, 51, ['aut', 'aut2', 'autShade']); canopy(L, 78, 132, 32, 36, 52, ['ochre', 'ochre2', 'ochreShade']); canopy(L, 6, 168, 30, 30, 53, ['rust', 'rust2', 'rustShade']);
      canopy(L, 100, 150, 18, 18, 54, ['tree', 'tree2', 'treeShade']); canopy(L, 54, 168, 26, 22, 55, ['tree', 'aut2', 'treeShade']);
      L.push(r(22, 150, 2.6, 40, 'trunk', { a: .7 })); L.push(r(70, 158, 2, 26, 'trunk', { a: .7 }));
      // the far fence and its posts, low along the far touchline
      L.push(r(100, HZ - 6, 300, 6, 'fence', { a: .55 })); L.push(r(100, HZ - 6, 300, .9, 'fence'));
      for (x = 104; x < 400; x += 7) L.push(r(x, HZ - 6, .7, 6, 'fence'));
      // the pitch: mown bands, deeper toward us
      L.push(r(0, HZ, 400, 300 - HZ, 'turf', { shade: grain('turfShade', .3, 'down', 1.3) }));
      L.push(r(0, HZ, 400, 8, 'turfFar', { a: .7 }));
      for (i = 0, y = HZ; y < 300; i++) { var hb = 3 + i * i * .9; if (i % 2) L.push(r(0, y, 400, hb, 'turfLite', { a: .32 })); y += hb; }
      // markings: far touchline, a yellow line, the blue futsal arc, a white line and a diagonal running at us, a blue line, the near white line
      L.push(r(104, HZ + 3, 296, .7, 'lineW')); L.push(r(112, HZ + 9, 288, .55, 'lineY'));
      (function () { var pts = []; for (var a = 0; a <= Math.PI * .62; a += .08) pts.push(120 + Math.cos(a) * 74, HZ + 14 + Math.sin(a) * 9); L.push(line(pts, 'lineB', .9)); })();
      L.push(r(150, HZ + 20, 250, .9, 'lineW')); L.push(r(96, HZ + 20, 30, .9, 'lineY'));
      L.push(poly([176, HZ + 20, 179, HZ + 20, 362, 274, 352, 274], 'lineW'));
      L.push(r(60, 206, 340, 1.4, 'lineB')); L.push(r(146, HZ + 31, 4, 1, 'lineY')); L.push(r(164, HZ + 31, 4, 1, 'lineY'));
      L.push(r(0, 274, 400, 2.4, 'lineW'));
      L.push(r(0, 238, 400, 1.2, 'lineY', { a: .9 }));
      // the far goals, the masts
      goal(L, 176, HZ + 4, 28, 13); goal(L, 342, HZ + 2, 24, 11);
      flood(L, 126, 84, HZ + 2, 1.5, .9); flood(L, 214, 100, HZ, 1.1, .6); flood(L, 296, 92, HZ + 1, 1.4, .85); flood(L, 380, 86, HZ + 2, 1.5, .9);
      // the ball-stop net down the left: tall black poles receding to the far corner, the mesh hung between them
      var poles = [[4, 6, 254, 3], [30, 44, 222, 2.4], [52, 70, 200, 2], [70, 88, 186, 1.7], [85, 100, 178, 1.5], [97, 108, 173, 1.3], [107, 114, 170, 1.1]];
      // outside the net: a gravel path along the planting, the shrubs at the trees' feet
      L.push(poly([0, HZ + 12, 106, HZ + 2, 107, 170, 4, 254, 0, 254], 'path', { shade: grain('pathShade', .3, 'down') }));
      L.push(poly([0, HZ + 2, 104, HZ - 2, 106, HZ + 3, 0, HZ + 16], 'hedge', { shade: grain('hedgeShade', .4, 'down') }));
      for (x = 2; x < 100; x += 9) L.push(e(x, HZ + 12 - x * .1, 6, 3.4, x % 2 ? 'hedge' : 'tree2', { shade: grain('hedgeShade', .35, 'down') }));
      for (i = 0; i < poles.length - 1; i++) { var a = poles[i], b = poles[i + 1];
        for (var u = 0; u <= 1.001; u += .25) L.push(line([a[0], a[1] + (a[2] - a[1]) * u, b[0], b[1] + (b[2] - b[1]) * u], 'net', .35, { a: .45 }));
        for (var v = .2; v < 1; v += .2) { var vx = a[0] + (b[0] - a[0]) * v, t0 = a[1] + (b[1] - a[1]) * v, t1 = a[2] + (b[2] - a[2]) * v; L.push(line([vx, t0, vx, t1], 'net', .3, { a: .35 })); } }
      L.push(line(poles.map(function (p) { return [p[0], p[1]]; }).reduce(function (m, q) { return m.concat(q); }, []), 'net', .7));
      poles.forEach(function (p) { L.push(r(p[0] - p[3] / 2, p[1], p[3], p[2] - p[1], 'pole', { shade: grain('poleLite', .2, 'left') })); L.push(r(p[0] - p[3] / 2, p[1], p[3] * .3, p[2] - p[1], 'poleLite', { a: .5 })); });
      flood(L, 52, 78, 200, 0, .8);
      // kit bags along the net, a water bottle; a drinks machine at the corner by the net
      bag(L, 58, 214, .9, 'bagA', 'bagMark'); bag(L, 70, 206, .8, 'bagB'); bag(L, 44, 224, .95, 'bagC', 'bagMark');
      L.push(r(80, 197, 1.6, 4, 'cloudLite', { r: .5, a: .9 }));
      vending(L, 14, 262, { seed: 113, w: 24, h: 46, trim: 'lineB' });
      // the ball, at his feet
      contact(L, 166, 268, 4.4, .2); L.push(c(166, 264.6, 3.4, 'ball', { shade: grain('cloudShade', .35, 'br', 1.2) }));
      L.push(poly([165.2, 263.2, 167, 263, 167.6, 264.6, 166.2, 265.6, 164.8, 264.8], 'ballMark')); L.push(r(163, 266.6, 1.2, .8, 'ballMark', { a: .7 })); L.push(r(168.4, 262, 1, .8, 'ballMark', { a: .7 }));
    } });
})();
