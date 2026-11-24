/* Scene — yomiuriland. Needs /last-seen/last-seen.js and /last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, rnd = K.rnd, mix = K.mix;
  var make = K.make, contact = K.contact, vending = K.vending, crown = K.crown, FONT = K.FONT;
  /* ================= Yomiuriland — Yanokuchi, Inagi (Nov 14, 11:45), with his wife and son =================
     No frontage here: it is an amusement park, so the picture is the plaza inside it, put together from his own photos
     of the day. One hero, the big wheel with its gondolas in six colours, standing over everything. In front of it, left,
     the carousel under its yellow-and-white tent; right, the yellow shooting-gallery stall with a striped awning and
     shelves of prizes; a drinks machine beside it. Between them a tall rust-tipped conifer, autumn trees, a hedge, a line
     of blue and yellow pennants, people far off on the plaza. A coaster's hill shows beyond the trees. The ground is the
     plaza's red paving, a yellow band across it, then asphalt. A grey, overcast late morning in November. */
  var HX = 214, HY = 116, RAD = 90;                 // the wheel's hub and rim
  var GOND = ['gA', 'gB', 'gC', 'gD', 'gE', 'gF'];
  function at(a, rad) { return [HX + Math.cos(a) * rad, HY + Math.sin(a) * rad]; }
  var PEOPLE = { rfCap: '#5b3d2a', rfHoodie: '#202124', rfString: '#44454a', rfPants: '#b89e72', rfShoe: '#eceae4', rfSole: '#f7f6f2', rfShoeMark: '#a7abb0',
    wfHijab: '#a48e7b', wfTop: '#2c2d31', wfPants: '#70744f', wfShoe: '#efeeea', wfSole: '#f8f8f4', wfShoeMark: '#8e96a3', wfBag: '#6f6248',
    snTop: '#f3f2ec', snStripe: '#2a3550', snPants: '#c2a878', snShoe: '#2c3140', snSole: '#e6e4dd' };
  function tonePeople(t, k) { var o = {}; Object.keys(PEOPLE).forEach(function (n) { o[n] = mix(PEOPLE[n], t, k); }); return o; }
  function folk(A, x, y, s, coat, legs, hair, bag) {  // a small standing person, far off
    A.push(r(x - 1.6 * s, y - 8.6 * s, 3.2 * s, 5.4 * s, coat, { r: [1.2 * s, 1.2 * s, .4, .4] }));
    A.push(r(x - 1.3 * s, y - 3.4 * s, 1.1 * s, 3.4 * s, legs)); A.push(r(x + .2 * s, y - 3.4 * s, 1.1 * s, 3.4 * s, legs));
    A.push(c(x, y - 9.9 * s, 1.35 * s, hair)); if (bag) A.push(r(x + 1.4 * s, y - 6.4 * s, 1.4 * s, 2.6 * s, bag));
  }
  // the wheel after dark: bulbs round the rim and out along every other spoke
  var BULBS = [], bi, bj;
  for (bi = 0; bi < 60; bi++) { var bp = at(bi / 60 * Math.PI * 2, RAD - 1); BULBS.push(c(bp[0], bp[1], .9, ['gC', 'lamp', 'gE', 'lamp', 'gA', 'lamp'][bi % 6])); }
  for (bi = 0; bi < 12; bi++) for (bj = 1; bj < 8; bj++) { var sp = at(bi / 12 * Math.PI * 2 + .13, bj * 10.6); BULBS.push(c(sp[0], sp[1], .6, bi % 2 ? 'gC' : 'lamp', { a: .9 })); }

  make('yomiuriland', { seed: 1114, seenAt: '2026-11-14T11:45:00+09:00',
    place: { en: 'Yomiuriland', ja: 'よみうりランド' }, name: { en: 'Yomiuriland', ja: 'よみうりランド' }, area: { en: 'Yanokuchi, Inagi', ja: '稲城・矢野口' },
    alt: 'Illustration of Yomiuriland amusement park: a big white Ferris wheel with gondolas in six colours standing over a red-paved plaza, a carousel under a yellow-and-white tent on the left, a yellow shooting-gallery stall with a striped awning on the right, a tall conifer, autumn trees and a line of pennants, with Raufan in a brown cap and black hoodie, his wife in a taupe hijab and their son in a striped top.',
    palette: Object.assign({ sky: '#d2d9de', skyShade: '#bcc8cf', cloud: '#e8ecee', sunWash: '#ffe9c2',
      wheel: '#f3f4f2', wheelShade: '#c6ccd0', hub: '#dd5140', hubShade: '#b63d30',
      gA: '#df5340', gB: '#ef8b3d', gC: '#f1c644', gD: '#63b06b', gE: '#4f93d6', gF: '#9a6dc4', gWin: '#e3edf2', gShade: '#3a2e25',
      track: '#9fb3b0', trackShade: '#7f9592',
      autA: '#c9723b', autB: '#d99b46', autC: '#a95b36', autShade: '#8a4a2c', ever: '#5f7f58', ever2: '#6f8d5f', everShade: '#48634a',
      coneT: '#7d8a4b', coneT2: '#a97a40', coneShade: '#5c693a', trunk: '#6b5444',
      carY: '#f3c63f', carW: '#f8f3e6', carRed: '#d94f3d', carRedShade: '#b53c2e', carPink: '#f2a9a1', carPinkShade: '#dc8a82', carGold: '#d9a93f', carBase: '#e98b7b', carBaseShade: '#cf6f60',
      inCar: '#f6dfae', inCarShade: '#e0bd7c', inMirror: '#dcebf0', horseA: '#fbf7ee', horseB: '#f3d3c6', horseC: '#cfe1ea', horseShade: '#b9a999', saddle: '#d94f3d', saddle2: '#4f93d6',
      stY: '#f6c81f', stYShade: '#dba910', stRed: '#d83b2f', stRedShade: '#b12b23', stW: '#f7f3ea', stWShade: '#ddd7c9', stInk: '#c52b23',
      inStall: '#f8dfa8', inStallShade: '#e3bd76', inShelf: '#b98a4f', inLamp: '#fff1cf', inPzA: '#e0584a', inPzB: '#4f93d6', inPzC: '#6fb872', inPzD: '#f2a7c0', inPzE: '#f7f3ea', inPzF: '#f1c644',
      penB: '#3f8fd0', penY: '#f2c744', string: '#6a6e72', poleC: '#737a80', poleShade: '#585f65', speaker: '#d9dcdc',
      plaza: '#b8705a', plazaShade: '#9c5a47', plazaLite: '#cb8a72', plazaJoint: '#d3a590', bandY: '#e8c768', bandYShade: '#cfa94a',
      asphalt: '#8b8e93', asphaltShade: '#75787e', asphaltLite: '#a1a4a8' }, PEOPLE),
    light: { noShadows: true,
      morning: { set: Object.assign({ sky: '#c9dbe8', skyShade: '#e4ecf0', cloud: '#f2f5f6' }, tonePeople('#cbd8e2', .1)),
        add: { back: [r(0, 244, 400, 5, 'shadow', { a: .08 })] } },
      midday: { add: { back: [r(0, 244, 400, 4, 'shadow', { a: .08 })] } },
      golden: { set: Object.assign({ sky: '#f0c39b', skyShade: '#e3a47c', cloud: '#f8dfc6', wheel: '#fbe6cf', wheelShade: '#d9b596', track: '#c2a995', carW: '#fbe9d0', stW: '#fae6cd', plaza: '#c4735a', asphalt: '#958a84' }, tonePeople('#f0b07e', .12)),
        add: { back: [poly([0, 0, 400, 0, 400, 120, 0, 200], 'sunWash', { a: .1 }), r(0, 244, 400, 5, 'shadow', { a: .1 })] } },
      // after dark the park is lit: bulbs on the wheel, the tent and the stall glowing
      night: { set: Object.assign({ sky: '#0f1531', skyShade: '#090d22', cloud: '#171d3a', wheel: '#59616f', wheelShade: '#3c434f', hub: '#e9604c', hubShade: '#a8392d',
          gA: '#ff6a55', gB: '#ff9e4a', gC: '#ffd75a', gD: '#77d683', gE: '#63aaf2', gF: '#b584ea', gWin: '#fff2cf', gShade: '#000000',
          track: '#2a3040', trackShade: '#1e2331', autA: '#3d2a22', autB: '#463424', autC: '#33221c', autShade: '#231713', ever: '#1d2a22', ever2: '#22302a', everShade: '#131d18',
          coneT: '#25301f', coneT2: '#3a2c1d', coneShade: '#182015', trunk: '#1f1814',
          carY: '#d9a93a', carW: '#cdbfa2', carRed: '#a53a2d', carRedShade: '#7c2a21', carPink: '#c98078', carPinkShade: '#a3625c', carGold: '#ffd98a', carBase: '#a85f54', carBaseShade: '#834a41',
          inCar: '#ffe2a6', inMirror: '#fff4d8', horseA: '#fff3da', horseB: '#f6cdb8', horseC: '#d6dfe0', horseShade: '#a18a70',
          stY: '#e2b21a', stYShade: '#b98d0c', stRed: '#b83227', stRedShade: '#86231b', stW: '#d9cfb8', stWShade: '#b3a98f', stInk: '#a8241d', inStall: '#ffe2a6',
          penB: '#2b5f8c', penY: '#a98a35', string: '#30333a', poleC: '#2c3038', poleShade: '#1f2228', speaker: '#5c6066',
          plaza: '#3b2823', plazaShade: '#2c1d19', plazaLite: '#4a322b', plazaJoint: '#4d3a33', bandY: '#6f5f31', bandYShade: '#574a26', asphalt: '#1b1d23', asphaltShade: '#14161b', asphaltLite: '#262930' }, tonePeople('#0d1124', .6)),
        add: { back: BULBS,
          over: [{ t: 'halo', x: HX, y: HY, rx: 112, ry: 108, n: 7, fill: 'haze', a: .022 }, { t: 'halo', x: 62, y: 214, rx: 62, ry: 34, n: 6, fill: 'pool', a: .06 }, { t: 'halo', x: 62, y: 250, rx: 70, ry: 12, n: 6, fill: 'pool', a: .08 },
            { t: 'halo', x: 354, y: 208, rx: 56, ry: 30, n: 6, fill: 'pool', a: .07 }, { t: 'halo', x: 350, y: 250, rx: 64, ry: 12, n: 6, fill: 'pool', a: .09 }, { t: 'halo', x: 200, y: 258, rx: 190, ry: 16, n: 6, fill: 'pool', a: .03 }] } } },
    breathe: { x: 310, y: 190, w: 90, h: 34, c: 'breathe', a: .03 },
    // people far off on the plaza
    shoppers: [[150, 241, .36, 'coatB'], [236, 242, .38, 'coatA'], [262, 241, .36, 'coatD']].map(function (p, i) { return { keys: [[0, p[0]], [6 + i, p[0]], [12 + i, p[0] + (i % 2 ? 12 : -12)], [19 + i, p[0] + (i % 2 ? 12 : -12)], [26 + i, p[0]]], period: 26 + i, offset: i * 3.7,
      foot: p[1], s: p[2], coat: p[3], legs: i % 2 ? 'legsDark' : 'legsDenim', hair: i % 2 ? 'hairBrown' : 'hairDark', alpha: .92, shadow: false }; }),
    passersby: [{ start: 8, every: 25, dir: -1, speed: 22, foot: 288, s: 1.24, coat: 'coatC', legs: 'legsDark', hair: 'hairDark', carry: 'backpack', carryC: 'coatD' },
                { start: 19, every: 34, dir: 1, speed: 19, foot: 283, s: 1.16, coat: 'coatA', long: 5, legs: 'legsDenim', hair: 'hairBrown', longHair: true, carry: 'tote', carryC: 'bagMark' }],
    stamp: { x0: 74, x1: 354, y0: 12, y1: 262 },
    ground: { y0: 252, y1: 296, xMin: 10, xMax: 390 },
    sig: { emerge: { x: 204, foot0: 240, foot1: 266, s0: .52, s1: 1.24, dur: 1.35 },
      // Raufan: a dark brown cap over shoulder-length hair worn down, a black hoodie, khaki trousers, white trainers, no bag
      person: { hood: true, coat: 'rfHoodie', string: 'rfString', hat: false, bag: false, ballcap: 'rfCap', legs: 'rfPants', hairDown: true, longHair: true, hair: 'hairDark',
        shoe: 'rfShoe', sole: 'rfSole', shoeMark: 'rfShoeMark' },
      // his wife (a taupe hijab, a charcoal sweatshirt, olive cargo trousers, white trainers, a small bag across the body)
      // and their son (a navy-and-white striped long-sleeved top, khaki trousers, dark navy shoes), drawn child-sized
      company: [{ person: { coat: 'wfTop', long: -5, hat: false, hijab: 'wfHijab', legs: 'wfPants', hair: 'hairDark',
                  shoe: 'wfShoe', sole: 'wfSole', shoeMark: 'wfShoeMark', bag: false, carry: 'crossbody', carryC: 'wfBag', stride: 11 }, dx: 27, dy: -1.4, ds: -.05, lag: .3 },
                { person: { coat: 'snTop', stripe: 'snStripe', stripeGap: 2.6, stripeW: 1.3, long: -5, hat: false, legs: 'snPants', hair: 'hairDark',
                  shoe: 'snShoe', sole: 'snSole', bag: false, stride: 8 }, dx: -21, dy: 1.6, ds: -.4, lag: .18 }] },
    build: function (L, F, P) {
      var R = rnd(1114), i, x, y, a, p, q;
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .22, 'up', 1.7) }));
      // a low grey sky: wide soft banks of cloud
      [[60, 30, 70, 10], [130, 18, 50, 7], [330, 40, 64, 10], [372, 22, 40, 7], [220, 8, 60, 5], [16, 70, 40, 7]].forEach(function (k) { L.push(e(k[0], k[1], k[2], k[3], 'cloud', { a: .8 })); });
      // ---- far left: a coaster's hill beyond the trees ----
      var hill = []; for (i = 0; i <= 16; i++) { x = i * 9; hill.push(x, 150 - 62 * Math.sin(Math.PI * Math.min(1, (x + 30) / 190))); }
      L.push(line(hill, 'track', 2)); L.push(line(hill.map(function (v, k) { return k % 2 ? v + 3 : v; }), 'trackShade', .6, { a: .8 }));
      for (i = 0; i <= 16; i += 2) { x = i * 9; y = 150 - 62 * Math.sin(Math.PI * Math.min(1, (x + 30) / 190)); L.push(r(x - .4, y + 2, .9, 236 - y, 'track', { a: .85 })); if (i < 16) L.push(line([x, y + 22, x + 18, 150 - 62 * Math.sin(Math.PI * Math.min(1, (x + 48) / 190)) + 3], 'trackShade', .5, { a: .6 })); }
      // ---- the hero: the big wheel ----
      // its legs first, then the rings and spokes, the gondolas hanging from the rim, the hub
      [[-50, 3.2], [50, 3.2], [-26, 1.4], [26, 1.4]].forEach(function (lg) { L.push(line([HX, HY, HX + lg[0], 238], 'wheel', lg[1])); L.push(line([HX + .9, HY, HX + lg[0] + .9, 238], 'wheelShade', lg[1] * .28, { a: .8 })); });
      L.push(line([HX - 31, 190, HX + 31, 190], 'wheel', 1.2)); L.push(line([HX - 41, 216, HX + 41, 216], 'wheel', 1.2));
      for (i = 0; i < 24; i++) { a = i / 24 * Math.PI * 2 + .13; p = at(a, RAD); L.push(line([HX, HY, p[0], p[1]], 'wheel', .7)); }
      for (i = 0; i < 24; i++) { a = i / 24 * Math.PI * 2 + .13; p = at(a, 62); q = at(a + Math.PI / 12, RAD - 8); L.push(line([p[0], p[1], q[0], q[1]], 'wheelShade', .45, { a: .8 })); }
      L.push(ring(HX, HY, RAD, 'wheel', 2)); L.push(ring(HX, HY, RAD - 8, 'wheel', 1)); L.push(ring(HX, HY, 62, 'wheel', .8)); L.push(ring(HX, HY, 30, 'wheelShade', .6));
      L.push(ring(HX, HY, RAD + 1.2, 'wheelShade', .5, { a: .7 }));
      for (i = 0; i < 24; i++) { a = i / 24 * Math.PI * 2 + .13; p = at(a, RAD + .5); var gc = GOND[i % 6];
        L.push(line([p[0], p[1], p[0], p[1] + 2.4], 'wheelShade', .6));
        L.push(r(p[0] - 3.6, p[1] + 2.2, 7.2, 7.6, gc, { r: [2.2, 2.2, 1.4, 1.4], shade: grain('gShade', .16, 'down', 1.3) }));
        L.push(r(p[0] - 2.6, p[1] + 3.4, 5.2, 2.6, 'gWin', { r: .8 })); L.push(r(p[0] - .3, p[1] + 3.4, .6, 2.6, gc)); }
      L.push(c(HX, HY, 8, 'hub', { shade: grain('hubShade', .35, 'br', 1.3) })); L.push(c(HX, HY, 4.2, 'wheel')); L.push(c(HX, HY, 1.8, 'hubShade'));
      // ---- trees: autumn crowns behind the tent and the stall, a hedge across the middle, the tall rust-tipped conifer ----
      crown(L, [[4, 196, 20], [26, 180, 17], [118, 204, 18], [142, 216, 14]], ['autA', 'autB', 'autC'], 'autShade');
      crown(L, [[388, 150, 20], [366, 138, 15], [300, 214, 15], [282, 222, 12]], ['autB', 'autA', 'autC'], 'autShade');
      crown(L, [[166, 232, 12], [184, 234, 10], [204, 233, 11], [224, 235, 10], [244, 233, 11], [264, 234, 11]], ['ever', 'ever2'], 'everShade');
      L.push(r(110, 234, 196, 9.6, 'ever', { shade: grain('everShade', .35, 'down', 1.3) }));
      L.push(r(131.2, 214, 2.6, 29, 'trunk'));
      for (i = 0; i < 9; i++) { var ty = 86 + i * 15, hw = 5 + i * 2.5; L.push(poly([132.5, ty - 14, 132.5 + hw, ty + 12, 132.5 - hw, ty + 12], i % 3 === 1 ? 'coneT2' : 'coneT', { shade: grain('coneShade', .4, 'br', 1.3) })); }
      // ---- a lamp post with its speakers, and the pennants strung across the plaza ----
      L.push(r(155, 146, 2.2, 97, 'poleC', { shade: grain('poleShade', .4, 'right') })); L.push(r(150, 146, 12, 2, 'poleC')); L.push(r(148.6, 148, 4.6, 6, 'speaker', { r: 1 })); L.push(r(159, 148, 4.6, 6, 'speaker', { r: 1 })); L.push(c(156.1, 144.6, 2.2, 'speaker'));
      var sag = function (x0, y0, x1, y1, d, n, off) { var pts = [], k; for (k = 0; k <= n; k++) { var t = k / n; pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + d * 4 * t * (1 - t)]); }
        L.push(line([].concat.apply([], pts), 'string', .5));
        for (k = 0; k < n; k++) { var m = [(pts[k][0] + pts[k + 1][0]) / 2, (pts[k][1] + pts[k + 1][1]) / 2]; L.push(poly([pts[k][0] + .6, pts[k][1] + .3, pts[k + 1][0] - .6, pts[k + 1][1] + .3, m[0], m[1] + 7], (k + off) % 2 ? 'penY' : 'penB')); } };
      sag(156, 152, 306, 156, 16, 17, 0); sag(110, 178, 156, 156, 7, 6, 1);
      // people far off, on the plaza
      [[172, 242, 'coatA', 'legsDark', 'hairDark'], [177, 241.6, 'coatC', 'legsDenim', 'hairBrown', 'bag'], [196, 242.4, 'coatD', 'legsDark', 'hairDark'], [226, 241.6, 'hoodie', 'legsDark', 'hairDark', 'bag'],
       [252, 242.2, 'coatB', 'legsDenim', 'hairDark'], [257, 241.8, 'coatA', 'legsDark', 'hairBrown'], [122, 242, 'coatB', 'legsDark', 'hairDark']].forEach(function (k) { folk(L, k[0], k[1], 1.05, k[2], k[3], k[4], k[5]); });
      // ---- the ground: red paving, a yellow band, the asphalt ----
      L.push(r(0, 244, 400, 56, 'plaza', { shade: grain('plazaShade', .3, 'down', 1.3) }));
      for (y = 248; y < 268; y += 4) L.push(r(0, y, 400, .5, 'plazaJoint', { a: .4 }));
      for (i = 0; i < 44; i++) { x = Math.floor(R() * 50) * 8; y = 244 + Math.floor(R() * 6) * 4; L.push(r(x + .4, y + .5, 7.4, 3.2, R() > .5 ? 'plazaLite' : 'plazaShade', { a: .3 })); }
      L.push(r(0, 268, 400, 8, 'bandY', { shade: grain('bandYShade', .3, 'down') })); L.push(r(0, 268, 400, .6, 'plazaShade', { a: .5 }));
      L.push(r(0, 276, 400, 24, 'asphalt', { shade: [grain('asphaltShade', .4, 'down', 1.2), grain('asphaltLite', .15, 'up')] })); L.push(r(0, 276, 400, .8, 'bandYShade', { a: .7 }));
      for (i = 0; i < 12; i++) L.push(e(R() * 400, 280 + R() * 18, 6 + R() * 16, .5 + R() * .7, R() > .5 ? 'asphaltLite' : 'asphaltShade', { a: .25 }));
      K.leaves(L, 20, 380, 248, 296, 12, 14, ['autB', 'autA']);
      // ---- left, in front: the carousel under its tent ----
      var CX = 62;
      contact(F, CX, 244, 56, .16);
      F.push(r(18, 196, 88, 38, 'inCar', { shade: grain('inCarShade', .35, 'down', 1.3) }));
      F.push(r(48, 196, 28, 38, 'carPink', { shade: grain('carPinkShade', .3, 'right') })); [51, 60, 69].forEach(function (mx) { F.push(r(mx, 201, 5, 12, 'inMirror', { r: [2.5, 2.5, .4, .4] })); F.push(r(mx, 217, 5, 11, 'carW', { a: .8 })); });
      var horse = function (hx, hy, col, sad) {
        F.push(r(hx - .4, 196, .9, 38, 'carGold'));
        F.push(e(hx, hy, 5.6, 2.9, col, { shade: grain('horseShade', .25, 'down') })); F.push(poly([hx + 3, hy - 1.6, hx + 6.2, hy - 7, hx + 8, hy - 6, hx + 5.6, hy + .6], col)); F.push(e(hx + 7.8, hy - 6.6, 2.3, 1.5, col, { rot: .5 }));
        F.push(line([hx - 3.6, hy + 1.6, hx - 5, hy + 6.4], col, 1.1)); F.push(line([hx + 3.2, hy + 1.8, hx + 5.2, hy + 5.6], col, 1.1)); F.push(line([hx - 5.4, hy - .6, hx - 8, hy + 2.2], 'horseShade', .9));
        F.push(r(hx - 2.4, hy - 3.2, 4.4, 3, sad, { r: .8 })); };
      horse(30, 220, 'horseA', 'saddle'); horse(92, 214, 'horseB', 'saddle2'); horse(84, 226, 'horseC', 'saddle'); horse(40, 211, 'horseC', 'saddle2');
      [20, 104].forEach(function (px) { F.push(r(px - 1, 195, 2, 40, 'carGold')); });
      // the tent: yellow and white wedges, a red valance with scallops and bulbs, a gold finial and its flag
      for (i = 0; i < 10; i++) F.push(poly([CX, 152, 12 + i * 10, 188, 22 + i * 10, 188], i % 2 ? 'carW' : 'carY'));
      F.push(poly([CX, 152, CX + 14, 188, 112, 188], 'shadow', { a: .1 })); F.push(poly([CX, 152, 12, 188, 24, 188], 'glassLight', { a: .14 }));
      F.push(r(10, 188, 104, 6.4, 'carRed', { shade: grain('carRedShade', .3, 'down') })); for (i = 0; i < 13; i++) F.push(c(14 + i * 8, 194.6, 3.6, i % 2 ? 'carW' : 'carY'));
      for (i = 0; i < 17; i++) F.push(c(13 + i * 6.1, 189.4, .9, 'inLamp'));
      F.push(r(CX - .8, 142, 1.6, 11, 'carGold')); F.push(c(CX, 150.6, 2.6, 'carGold')); F.push(poly([CX + .8, 142, CX + 10, 144.4, CX + .8, 147], 'carRed'));
      F.push(r(10, 234, 104, 5, 'carBase', { shade: grain('carBaseShade', .3, 'down') })); F.push(r(8, 239, 108, 5, 'carRed', { shade: grain('carRedShade', .3, 'down') })); F.push(r(8, 239, 108, .8, 'carW', { a: .8 }));
      for (i = 0; i < 9; i++) F.push(c(16 + i * 11.5, 236.6, 1.3, 'carW'));
      // ---- right, in front: the drinks machine, then the shooting-gallery stall ----
      vending(F, 274, 243.6, { w: 22, h: 44, seed: 9 });
      var SX = 304;
      contact(F, 352, 244, 52, .16);
      F.push(r(SX + 6, 190, 90, 34, 'inStall', { shade: grain('inStallShade', .35, 'down', 1.3) }));
      [202, 213].forEach(function (sy) { F.push(r(SX + 6, sy, 90, 1.3, 'inShelf')); });
      var PZ = ['inPzA', 'inPzB', 'inPzC', 'inPzD', 'inPzE', 'inPzF'];
      for (x = SX + 10; x < 396; x += 6.6) { var k1 = PZ[Math.floor(R() * 6)], k2 = PZ[Math.floor(R() * 6)], h1 = 4 + R() * 4;
        if (R() > .4) F.push(r(x, 202 - h1, 4.6, h1, k1, { r: .8 })); else F.push(c(x + 2.3, 199.4, 2.5, k1));
        if (R() > .5) F.push(c(x + 2.3, 210.4, 2.5, k2)); else F.push(r(x, 208, 4.6, 5, k2, { r: 1 })); }
      [322, 348, 374].forEach(function (lx) { F.push(c(lx, 193, 1.6, 'inLamp')); F.push(c(lx, 193, 3, 'inLamp', { a: .25 })); });
      F.push(r(SX + 6, 216, 90, 8, 'inShelf', { a: .5 }));
      F.push(r(SX, 190, 6, 54, 'stRed', { shade: grain('stRedShade', .3, 'right') }));
      F.push(r(SX, 224, 96, 20, 'stRed', { shade: grain('stRedShade', .3, 'down', 1.3) })); F.push(r(SX, 224, 96, 3, 'stW')); F.push(r(SX, 227, 96, .8, 'shadow', { a: .2 }));
      for (x = SX + 12; x < 400; x += 14) F.push(poly([x, 231, x + 4, 235.4, x, 239.8, x - 4, 235.4], 'stY'));
      // the striped awning and the yellow sign over it
      for (i = 0; i < 12; i++) { F.push(r(SX + i * 8, 176, 8, 11.6, i % 2 ? 'stW' : 'stRed', { shade: grain(i % 2 ? 'stWShade' : 'stRedShade', .3, 'down') })); F.push(c(SX + i * 8 + 4, 187.6, 4, i % 2 ? 'stW' : 'stRed')); }
      F.push(r(SX, 191.4, 96, 3, 'shadow', { a: .16 }));
      F.push(r(SX, 150, 96, 26, 'stY', { shade: grain('stYShade', .3, 'down', 1.4) })); F.push(r(SX, 147.6, 96, 3, 'stRed')); F.push(r(SX, 174.6, 96, 1.6, 'stRedShade'));
      F.push(c(SX + 15, 163, 8.4, 'stRed')); F.push(c(SX + 15, 163, 5.8, 'stW')); F.push(c(SX + 15, 163, 3, 'stRed'));
      F.push({ t: 'text', text: 'SHATEKI', x: SX + 60, y: 167.4, size: 11.5, weight: 800, font: FONT, fill: 'stInk', align: 'center', ls: .03 });
      for (i = 0; i < 12; i++) F.push(c(SX + 4 + i * 8, 149, .9, 'inLamp'));
    } });
})();
