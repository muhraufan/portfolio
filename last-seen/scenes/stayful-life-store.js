/* Scene — stayful-life-store. Needs last-seen.js and last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, grain = K.grain, FONT = K.FONT;
  var make = K.make, pavement = K.pavement, contact = K.contact, sheen = K.sheen;
  /* STAYFUL LIFE STORE — a beige mullion shopfront, a geometric seated mark, an olive in a white pot, an A-board. */
  make('stayful-life-store', { seed: 904, seenAt: '2026-10-03T17:10:00+09:00',
    place: { en: 'STAYFUL LIFE STORE', ja: 'ステイフル ライフ ストア' }, name: { en: 'STAYFUL LIFE STORE', ja: 'ステイフル ライフ ストア' }, area: { en: 'Nakacho, Musashino', ja: '武蔵野・中町' },
    alt: 'Illustration of STAYFUL LIFE STORE: a beige-framed shopfront with a small seated figure in the glass, an olive tree in a white pot and an A-board.',
    palette: { sky: '#e7e6e2', skyShade: '#d4d2cc', sunWash: '#ffc58e', stucco: '#e4e0d8', stuccoShade: '#cfc9be',
      frame: '#d9c7a4', frameShade: '#bba884', frameDeep: '#a8906e',
      glass: '#3c4248', glassShade: '#2a3036',
      inWall: '#f6efe4', inWallShade: '#e6d8c4', inPlant: '#6f8a5e', inPot: '#e7dcc8',
      mark: '#f7f4ee', leaf: '#6d8a52', leaf2: '#8aa56c', leafShade: '#4e6838', trunk: '#6a5438',
      pot: '#f6f3ee', potShade: '#ddd6cc',
      board: '#f3efe6', boardFrame: '#c2b39a', ink: '#3c3832',
      cube: '#f7f5f1' },
    light: { shadowAt: [[40, 80], [280, 60]],
      night: { set: { stucco: '#2a2826', stuccoShade: '#1c1b19', frame: '#5c5144', frameShade: '#3e362c', frameDeep: '#2e2820',
          glass: '#2a241c', glassShade: '#181410', mark: '#f3ecdf', pot: '#d9d2c6', potShade: '#8a847a',
          board: '#2a2824', boardFrame: '#4a4338', ink: '#f0e8da', cube: '#3a3834', trunk: '#3a2e22', leaf: '#3e5a34', leaf2: '#4e6c40' },
        add: { over: [{ t: 'halo', x: 200, y: 170, rx: 110, ry: 30, n: 6, fill: 'pool', a: .04 }, { t: 'halo', x: 330, y: 250, rx: 28, ry: 12, n: 4, fill: 'haze', a: .03 }, { t: 'halo', x: 190, y: 268, rx: 80, ry: 14, n: 5, fill: 'pool', a: .028 }] } } },
    breathe: { x: 36, y: 108, w: 328, h: 120 },
    shoppers: [{ keys: [[0, 250], [8, 270], [12, 270], [18, 250]], period: 18, foot: 220, s: .55, coat: 'coatA', legs: 'legsDark', hair: 'hairBrown', alpha: .55, shadow: false }],
    passersby: [{ start: 0, every: 25, dir: 1, speed: 21, foot: 278, s: 1.14, coat: 'coatC', legs: 'legsDark', hair: 'hairBrown', carry: 'tote', carryC: 'coatB' },
      { start: 11, every: 29, dir: -1, speed: 23, foot: 270, s: 1.04, coat: 'coatD', legs: 'legsDenim', hair: 'hairDark', cap: 'coatB' }],
    sig: { emerge: { x: 132, foot0: 224, foot1: 266, s0: .68, s1: 1.18, dur: 1.3 } },
    build: function (L, F, P) {
      L.push(r(0, 0, 400, 96, 'stucco', { shade: grain('stuccoShade', .22, 'down', 1.4) }));
      L.push(r(0, 0, 400, 36, 'sky', { shade: grain('skyShade', .16, 'down') }));
      L.push(r(0, 92, 400, 8, 'frameDeep'));
      L.push(r(16, 108, 368, 136, 'inWall', { shade: grain('inWallShade', .25, 'down') }));
      L.push(e(250, 160, 28, 16, 'inPlant', { a: .8 })); L.push(r(242, 168, 8, 18, 'inPot'));
      pavement(L, F, { seed: 9044, tactile: 168 });
      [[16, 108, 86, 128], [110, 108, 180, 128], [298, 108, 86, 128]].forEach(function (w) {
        F.push(r(w[0], w[1], w[2], w[3], 'glass', { a: .4 }));
        sheen(F, w[0], w[1], w[2], w[3], { a: .08 });
      });
      [12, 106, 294, 384].forEach(function (x) { F.push(r(x, 100, 8, 144, 'frame', { shade: grain('frameShade', .3, 'right') })); });
      F.push(r(12, 100, 380, 10, 'frame')); F.push(r(12, 166, 380, 7, 'frame')); F.push(r(12, 234, 380, 10, 'frameDeep'));
      F.push(r(200, 108, 6, 126, 'frame'));
      // a geometric seated mark — original, not the shop's drawing. It sits in the upper pane; the name sits below the rail.
      F.push(c(214, 120, 4.4, 'mark'));
      F.push(r(209, 125, 11, 13, 'mark', { r: [3.2, 3.2, 1.4, 1.4] }));
      F.push(r(204, 135, 20, 2.4, 'mark', { r: 1.2 }));
      F.push(r(202, 122, 1.8, 24, 'mark')); F.push(r(226, 126, 1.8, 18, 'mark'));
      F.push(r(202, 146, 28, 2.2, 'mark'));
      F.push(line([204, 148, 198, 160], 'mark', 1.5)); F.push(line([226, 148, 232, 158], 'mark', 1.5));
      F.push({ t: 'text', text: 'STAYFUL', x: 214, y: 192, size: 6.2, weight: 600, font: FONT, fill: 'mark', align: 'center', ls: 1.6 });
      F.push({ t: 'text', text: 'LIFE STORE', x: 214, y: 202, size: 3.4, weight: 500, font: FONT, fill: 'mark', align: 'center', ls: 1.1 });
      // door
      F.push(r(112, 173, 46, 61, 'frameShade', { a: .35 }));
      F.push(r(124, 196, 2, 10, 'frameDeep'));
      // olive in a white pot
      P.push(poly([318, 236, 348, 236, 344, 256, 322, 256], 'pot', { shade: grain('potShade', .3, 'right') }));
      P.push(r(314, 232, 38, 5, 'pot', { r: 1 }));
      P.push(r(331, 200, 3, 34, 'trunk'));
      P.push(e(332, 188, 16, 10, 'leaf', { shade: grain('leafShade', .3, 'down') }));
      P.push(e(320, 194, 10, 6, 'leaf2')); P.push(e(346, 192, 9, 6, 'leaf')); P.push(e(328, 178, 8, 5, 'leaf2'));
      contact(P, 333, 258, 16, .14);
      // A-board
      P.push(line([236, 258, 242, 214], 'boardFrame', 1.6)); P.push(line([268, 258, 262, 214], 'boardFrame', 1.6));
      P.push(r(238, 216, 28, 32, 'board', { r: 1 }));
      P.push({ t: 'text', text: 'STAYFUL', x: 252, y: 228, size: 3.2, weight: 600, font: FONT, fill: 'ink', align: 'center', ls: .4 });
      [234, 240, 246].forEach(function (y, i) { P.push(r(244, y, 16 - i * 2, .7, 'ink', { a: .45 })); });
      contact(P, 252, 260, 16, .12);
      P.push(r(46, 250, 8, 8, 'cube')); contact(P, 50, 260, 5, .1);
    } });
})();
