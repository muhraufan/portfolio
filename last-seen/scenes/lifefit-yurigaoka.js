/* Scene — lifefit-yurigaoka. Needs last-seen.js and last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, pavement = K.pavement, contact = K.contact, sheen = K.sheen, ac = K.ac;
  /* LifeFit, Yurigaoka — a brick walk-up over a blue 24h gym band, glass onto a warm floor, three slim banners. */
  make('lifefit-yurigaoka', { seed: 901, seenAt: '2026-10-21T17:47:00+09:00',
    place: { en: 'LifeFit Yurigaoka', ja: 'ライフフィット 百合ヶ丘' }, name: { en: 'LifeFit', ja: 'ライフフィット' }, area: { en: 'Yurigaoka, Kawasaki', ja: '川崎・百合ヶ丘' },
    alt: 'Illustration of LifeFit in Yurigaoka: a brick apartment block over a blue gym band, glass onto a warm exercise floor, and three slim banners by the door.',
    palette: { sky: '#e4e8ea', skyShade: '#cdd4d8', sunWash: '#ffc58e', wire: '#8d9094',
      brick: '#b08968', brickShade: '#8d6a4e', brickLite: '#c4a184', mortar: '#d9cfc3',
      win: '#efe8dc', winShade: '#d5cbbd', curtain: '#f7f1e6',
      fascia: '#1f66d6', fasciaShade: '#184eaa', signInk: '#f7f4ee', badge: '#f4f1ea',
      flag: '#2a6ed4', flagShade: '#1c54aa', flagInk: '#f6f3ec',
      glass: '#3a4048', glassShade: '#2a3038',
      inWall: '#f0d7b4', inWallShade: '#e2be8e', inFloor: '#c9844e', inFloorShade: '#a86a38',
      inMachine: '#4d5560', inBelt: '#2e343c', inRack: '#6a727c', inLamp: '#ffe0a8',
      inPoster: '#e07a68', inPoster2: '#7f9a7a',
      road: '#b7b5b0', roadShade: '#9e9c97', zebra: '#f3f1ec',
      pole: '#8e9194', signal: '#2c2e32', signalRed: '#d45448' },
    light: { shadowAt: [[36, 90], [250, 70]],
      night: { set: { brick: '#3a2e28', brickShade: '#2a211c', brickLite: '#4a3c34', mortar: '#2e2926', win: '#241f1c', winShade: '#1a1614', curtain: '#3a332c',
          fascia: '#2b74e4', fasciaShade: '#1d56b0', signInk: '#f6f1e6', badge: '#f3eee4', flag: '#2a6ad0', flagShade: '#1b4ea4', flagInk: '#f4efe6',
          glass: '#2c241c', glassShade: '#1c1814', zebra: '#c9c4ba', road: '#16181e', roadShade: '#101218', pole: '#3a3d44', signal: '#14161c', signalRed: '#e06858' },
        add: { over: [{ t: 'halo', x: 196, y: 210, rx: 120, ry: 36, n: 7, fill: 'pool', a: .05 }, { t: 'halo', x: 90, y: 200, rx: 40, ry: 22, n: 5, fill: 'haze', a: .04 }, { t: 'halo', x: 310, y: 200, rx: 36, ry: 20, n: 5, fill: 'haze', a: .035 }, { t: 'halo', x: 200, y: 270, rx: 90, ry: 16, n: 5, fill: 'pool', a: .03 }] } } },
    breathe: { x: 24, y: 176, w: 352, h: 68 },
    shoppers: [{ keys: [[0, 108], [7, 128], [11, 128], [18, 108]], period: 18, foot: 228, s: .62, coat: 'coatD', legs: 'legsDark', hair: 'hairDark', alpha: .72, shadow: false }],
    passersby: [{ start: 0, every: 24, dir: 1, speed: 22, foot: 274, s: 1.16, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', carry: 'backpack', carryC: 'coatD' },
      { start: 10, every: 28, dir: -1, speed: 24, foot: 268, s: 1.02, coat: 'coatA', long: 7, legs: 'legsDenim', hair: 'hairBrown', longHair: true, carry: 'tote', carryC: 'coatC' }],
    sig: { emerge: { x: 196, foot0: 226, foot1: 266, s0: .7, s1: 1.2, dur: 1.3 } },
    build: function (L, F, P) {
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .16, 'down', 1.6) }));
      L.push(line([0, 28, 80, 22, 160, 30, 240, 18, 400, 26], 'wire', .45, { a: .55 }));
      L.push(line([20, 44, 140, 40, 260, 48, 400, 38], 'wire', .4, { a: .4 }));
      L.push(r(0, 52, 400, 100, 'brick', { shade: grain('brickShade', .32, 'down', 1.5) }));
      (function () {
        var R = rnd(9011), y = 52, row = 0;
        while (y < 150) {
          var h = 12, off = (row % 2) * 18;
          for (var tx = -20 + off; tx < 400; tx += 36) {
            var x0 = Math.max(0, tx), w = Math.min(400, tx + 36) - x0; if (w < 2) continue;
            var v = R();
            if (v < .4) L.push(r(x0 + .8, y + .8, w - 1, h - 1.2, 'brickShade', { a: .12 + R() * .12 }));
            else if (v > .78) L.push(r(x0 + .8, y + .8, w - 1, h - 1.2, 'brickLite', { a: .28 }));
            if (tx > 0) L.push(r(tx, y, .8, h, 'mortar', { a: .55 }));
          }
          L.push(r(0, y, 400, .7, 'mortar', { a: .45 }));
          y += h; row++;
        }
      })();
      [[18, 64], [78, 64], [138, 66], [248, 64], [308, 66], [358, 64], [48, 96], [108, 98], [168, 96], [278, 98], [338, 96], [28, 126], [98, 128], [210, 126], [290, 128], [360, 126]].forEach(function (w, i) {
        L.push(r(w[0], w[1], 34, 22, 'win', { shade: grain('winShade', .35, 'down') }));
        L.push(r(w[0], w[1], 34, 3, 'curtain', { a: .85 }));
        if (i % 3 === 0) L.push(r(w[0] + 22, w[1] + 3, 12, 19, 'curtain', { a: .45 }));
        L.push(r(w[0] + 16, w[1], 1, 22, 'mortar', { a: .4 }));
      });
      ac(L, 214, 78, 20); ac(L, 214, 112, 18);
      L.push(r(0, 150, 400, 26, 'fascia', { shade: grain('fasciaShade', .4, 'down') }));
      L.push(r(0, 150, 400, 2, 'fasciaShade', { a: .35 }));
      L.push(r(0, 174, 400, 70, 'inWall', { shade: grain('inWallShade', .3, 'down', 1.4) }));
      L.push(r(0, 214, 400, 30, 'inFloor', { shade: grain('inFloorShade', .35, 'down') }));
      [[46, 196], [118, 198], [300, 196]].forEach(function (m) {
        L.push(r(m[0], m[1], 28, 18, 'inMachine', { r: [2, 2, 0, 0] }));
        L.push(r(m[0] + 3, m[1] + 4, 22, 3, 'inBelt'));
        L.push(r(m[0] + 22, m[1] - 10, 3, 14, 'inMachine'));
      });
      L.push(r(78, 186, 22, 16, 'inRack'));
      [82, 88, 94].forEach(function (x, i) { L.push(c(x, 192 + (i % 2) * 4, 2.2, i % 2 ? 'inPoster' : 'inPoster2')); });
      L.push(r(268, 182, 16, 22, 'inPoster', { r: 1 })); L.push(r(288, 186, 14, 18, 'inPoster2', { r: 1 }));
      [70, 250, 330].forEach(function (x) { L.push(c(x, 184, 2.4, 'inLamp')); L.push(g(x, 188, 10, 'inLamp', { d: .35, sy: .5 })); });
      pavement(L, F, { seed: 9012, manhole: [330, 286, 13] });
      F.push(poly([146, 158, 152, 166, 149.2, 166, 143.2, 157.2], 'signInk'));
      F.push(poly([146, 162, 150.5, 166, 148.2, 168.2, 143.6, 164], 'signInk'));
      F.push({ t: 'text', text: 'LifeFit', x: 158, y: 168, size: 11, weight: 600, font: FONT, fill: 'signInk', align: 'left', ls: .4 });
      F.push(r(318, 156, 22, 12, 'badge', { r: 2 }));
      F.push({ t: 'text', text: '24h', x: 329, y: 165.2, size: 6, weight: 600, font: FONT, fill: 'fasciaShade', align: 'center', ls: .3 });
      [[24, 178, 150], [230, 178, 146]].forEach(function (w) {
        F.push(r(w[0], w[1], w[2], 66, 'glass', { a: .42 }));
        sheen(F, w[0], w[1], w[2], 66, { a: .1 });
        F.push(r(w[0], w[1], w[2], 2.4, 'fasciaShade'));
      });
      F.push(r(174, 176, 56, 4, 'fasciaShade'));
      F.push(r(174, 180, 3, 64, 'fasciaShade')); F.push(r(227, 180, 3, 64, 'fasciaShade'));
      F.push(poly([177, 180, 190, 186, 190, 240, 177, 244], 'fasciaShade'));
      F.push(poly([227, 180, 214, 186, 214, 240, 227, 244], 'fasciaShade'));
      [[24, 178], [230, 178]].forEach(function (p) { F.push(poly([p[0] + 8, p[1], p[0] + 28, p[1], p[0] + 10, p[1] + 28, p[0], p[1] + 28], 'glassLight', { a: .1 })); });
      // three banners, off to the side of the door
      [[32, 78, 4], [58, 86, -2], [84, 74, 3]].forEach(function (f) {
        var x = f[0], h = f[1], lean = f[2];
        P.push(poly([x, 158, x + 13, 156, x + 13 + lean, 156 + h, x + lean, 158 + h], 'flag', { shade: grain('flagShade', .4, 'right') }));
        P.push(poly([x + 3, 166, x + 6, 165, x + 6 + lean * .5, 150 + h, x + 3 + lean * .5, 152 + h], 'flagInk', { a: .92 }));
        P.push(r(x + lean * .4, 156 + h, 2.2, 18, 'pole'));
        contact(P, x + 8 + lean, 176 + h, 8, .14);
      });
      P.push(r(348, 36, 3.2, 214, 'pole'));
      P.push(r(340, 48, 20, 28, 'signal', { r: 2 }));
      P.push(c(350, 58, 3.2, 'signalRed')); P.push(c(350, 68, 3.2, 'badge', { a: .35 }));
      P.push(r(0, 282, 400, 18, 'road', { shade: grain('roadShade', .3, 'down') }));
      for (var z = 8; z < 400; z += 28) P.push(r(z, 286, 16, 10, 'zebra', { a: .92 }));
    } });
})();
