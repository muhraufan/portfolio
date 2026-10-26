/* Scene — et-cultural-coffeehouse. Needs last-seen.js and last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, poly = K.poly, line = K.line, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, pavement = K.pavement, contact = K.contact, sheen = K.sheen, plant = K.plant;
  /* Et — brick upper floors wrapping a curved corner, a concrete base, glass, and a typeset &t. */
  make('et-cultural-coffeehouse', { seed: 905, seenAt: '2026-09-12T15:17:00+09:00',
    place: { en: 'Et', ja: 'エト' }, name: { en: 'Et', ja: 'エト' }, area: { en: 'Shimokitazawa, Tokyo', ja: '東京・下北沢' },
    alt: 'Illustration of Et in Shimokitazawa: a brick building with a curved corner over a concrete ground floor, glass, and a small &t mark.',
    palette: { sky: '#d9e3ee', skyShade: '#c5d3e2', sunWash: '#ffc58e', neighbor: '#e6e1da', neighborShade: '#cfc8be',
      brick: '#c4725a', brickShade: '#9a5340', brickLite: '#d89278', mortar: '#e4c2b0', lip: '#2a2624',
      concrete: '#d5d0c8', concreteShade: '#b7b1a8', concreteDeep: '#8e8982',
      glass: '#343c46', glassShade: '#242b34', win: '#2c3340',
      inWall: '#f4e0c4', inWallShade: '#e2c49a', inWood: '#a86c40', inLamp: '#ffd9a0',
      mark: '#f7f4ef', ink: '#f4f1ea' },
    light: { shadowAt: [[24, 70], [300, 80]],
      night: { set: { neighbor: '#22242c', neighborShade: '#161820', brick: '#6a3a32', brickShade: '#4a2822', brickLite: '#7a4840', mortar: '#5a3830', lip: '#0e0c0a',
          concrete: '#3a3836', concreteShade: '#2a2826', concreteDeep: '#1c1a18', glass: '#2a231c', glassShade: '#161410', win: '#1a1e28',
          mark: '#f6f1e8', ink: '#f3eee6' },
        add: { over: [{ t: 'halo', x: 200, y: 200, rx: 80, ry: 28, n: 6, fill: 'pool', a: .05 }, { t: 'halo', x: 120, y: 190, rx: 40, ry: 20, n: 5, fill: 'haze', a: .035 }, { t: 'halo', x: 290, y: 180, rx: 36, ry: 18, n: 5, fill: 'haze', a: .03 }, { t: 'halo', x: 200, y: 268, rx: 90, ry: 14, n: 5, fill: 'pool', a: .03 }] } } },
    breathe: { x: 150, y: 176, w: 90, h: 68 },
    shoppers: [{ keys: [[0, 188], [6, 188], [10, 196], [16, 188]], period: 16, foot: 228, s: .55, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', alpha: .6, shadow: false }],
    passersby: [{ start: 0, every: 24, dir: 1, speed: 22, foot: 276, s: 1.16, coat: 'coatA', long: 8, legs: 'legsDark', hair: 'hairDark', carry: 'backpack', carryC: 'coatD' },
      { start: 9, every: 27, dir: -1, speed: 21, foot: 268, s: 1.05, coat: 'coatC', legs: 'legsDenim', hair: 'hairBrown', longHair: true, carry: 'tote', carryC: 'coatA' }],
    sig: { emerge: { x: 196, foot0: 224, foot1: 266, s0: .7, s1: 1.2, dur: 1.3 } },
    build: function (L, F, P) {
      var R = rnd(9055);
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .16, 'down', 1.6) }));
      L.push(r(0, 48, 36, 196, 'neighbor', { shade: grain('neighborShade', .25, 'right') }));
      L.push(r(372, 36, 28, 208, 'neighbor', { shade: grain('neighborShade', .25, 'left') }));
      // brick mass: a quarter-curve on the corner, then a straight face
      var pts = [], i, a, cx = 176, cy = 96, rx = 108, ry = 70;
      for (i = 0; i <= 18; i++) { a = -Math.PI / 2 - Math.PI * i / 18; pts.push(+(cx + Math.cos(a) * rx).toFixed(1), +(cy + Math.sin(a) * ry).toFixed(1)); }
      pts.push(368, cy + ry, 368, cy - ry);
      L.push(poly(pts, 'brick', { shade: grain('brickShade', .34, 'br', 1.5) }));
      L.push(r(176, 24, 192, 5, 'lip'));
      for (var by = 40; by < 160; by += 11) {
        L.push(r(190, by, 178, .7, 'mortar', { a: .35 }));
        if ((by / 11) % 2 < 1) L.push(r(210, by, .7, 11, 'mortar', { a: .28 }));
      }
      for (i = 0; i < 14; i++) L.push(r(200 + R() * 150, 36 + R() * 120, 16, 8, 'brickLite', { a: .12 }));
      // windows on the flat face and one on the curve
      [[210, 42], [258, 42], [306, 42], [210, 78], [258, 78], [306, 78], [210, 114], [258, 114], [306, 114]].forEach(function (w) {
        L.push(r(w[0], w[1], 32, 22, 'win'));
        L.push(r(w[0] + 2, w[1] + 2, 12, 8, 'glassLight', { a: .08 }));
      });
      L.push(r(92, 78, 62, 36, 'win'));
      L.push(r(96, 82, 22, 14, 'glassLight', { a: .07 }));
      // concrete base, wider and squarer than the curve
      L.push(poly([52, 244, 70, 166, 378, 166, 378, 244], 'concrete', { shade: grain('concreteShade', .3, 'down', 1.4) }));
      L.push(r(70, 166, 308, 4, 'concreteDeep'));
      L.push(r(78, 178, 88, 66, 'inWall', { shade: grain('inWallShade', .3, 'down') }));
      L.push(r(250, 178, 110, 66, 'inWall', { shade: grain('inWallShade', .3, 'down') }));
      L.push(r(168, 186, 74, 58, 'inWall'));
      L.push(r(176, 214, 58, 8, 'inWood'));
      L.push(c(196, 198, 2.2, 'inLamp')); L.push(c(214, 198, 2.2, 'inLamp'));
      pavement(L, F, { seed: 9056, grate: [300, 246, 28] });
      F.push({ t: 'text', text: '&t', x: 118, y: 142, size: 22, weight: 500, font: FONT, fill: 'mark', align: 'center', ls: -0.6 });
      F.push({ t: 'text', text: 'THE CULTURAL COFFEEHOUSE', x: 206, y: 176, size: 3.3, weight: 500, font: FONT, fill: 'ink', align: 'center', ls: .8 });
      [[78, 180, 88, 64], [252, 180, 108, 64]].forEach(function (w) {
        F.push(r(w[0], w[1], w[2], w[3], 'glass', { a: .42 }));
        sheen(F, w[0], w[1], w[2], w[3], { a: .09 });
        F.push(r(w[0], w[1], w[2], 2.4, 'concreteDeep'));
      });
      F.push(r(166, 184, 3, 60, 'lip')); F.push(r(230, 184, 3, 60, 'lip'));
      F.push(poly([169, 186, 182, 192, 182, 238, 169, 244], 'lip'));
      F.push(poly([230, 186, 217, 192, 217, 238, 230, 244], 'lip'));
      F.push(r(166, 180, 67, 4, 'lip'));
      plant(P, 64, 244, .9, 27, { n: 5, tall: 1.2 });
      contact(P, 196, 246, 18, .1);
    } });
})();
