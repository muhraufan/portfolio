/* Scene — nadoya-no-katte. Needs last-seen.js and last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, contact = K.contact, sheen = K.sheen, plant = K.plant;
  /* nadoya no kaTte — a glass room beside an open timber counter, terrazzo block, deck, then gravel. */
  make('nadoya-no-katte', { seed: 902, seenAt: '2026-10-02T13:15:00+09:00',
    place: { en: 'nadoya no kaTte', ja: 'ナドヤノカッテ' }, name: { en: 'nadoya no kaTte', ja: 'ナドヤノカッテ' }, area: { en: 'Yoyogi-Uehara, Tokyo', ja: '東京・代々木上原' },
    alt: 'Illustration of nadoya no kaTte: a glass-front room beside an open timber canopy, a speckled counter, a wood deck and gravel.',
    palette: { sky: '#e6e4df', skyShade: '#d2cfc8', sunWash: '#ffc58e', far: '#ddd6cc',
      wood: '#c4a078', woodShade: '#9a7450', woodDeep: '#6e5034', beam: '#ddc4a4',
      glass: '#3e4650', glassShade: '#2c333c',
      inWall: '#f3e2cc', inWallShade: '#e4c8a4', inShelf: '#a87848', inChair: '#e7d3b4', inLeaf: '#6e8a5c', inLeaf2: '#8aa676',
      counter: '#c9c6be', counterShade: '#a8a49a', chip: '#f4f1ea', chipDark: '#7d7870', chipWarm: '#b08968',
      deck: '#b9926a', deckShade: '#8d6b48', deckLine: '#c9aa84',
      gravel: '#d5d0c6', gravelShade: '#b7b1a4', pebble: '#ece8df', pebbleDark: '#8e887c',
      metal: '#c5c8ca', cup: '#f7f3ea', ink: '#3a342e' },
    light: { noShadows: true,
      night: { set: { wood: '#4a3828', woodShade: '#342618', woodDeep: '#24180e', beam: '#6a5340', glass: '#2a241c', glassShade: '#1a1612',
          counter: '#3a3834', counterShade: '#2a2824', chip: '#6a6560', chipDark: '#242220', chipWarm: '#5a4030',
          deck: '#3a2c20', deckShade: '#2a1e16', deckLine: '#4a3828', gravel: '#2a2926', gravelShade: '#1c1b18', pebble: '#3a3834', pebbleDark: '#181614',
          metal: '#5c5e60', ink: '#f0e6d4', far: '#1a1c24' },
        add: { over: [{ t: 'halo', x: 110, y: 160, rx: 70, ry: 28, n: 6, fill: 'pool', a: .045 }, { t: 'halo', x: 290, y: 150, rx: 60, ry: 20, n: 5, fill: 'haze', a: .04 }, { t: 'halo', x: 200, y: 250, rx: 110, ry: 18, n: 5, fill: 'pool', a: .03 }] } } },
    breathe: { x: 28, y: 96, w: 160, h: 110 },
    shoppers: [{ keys: [[0, 292], [8, 300], [12, 300], [20, 292]], period: 20, foot: 168, s: .58, coat: 'coatD', legs: 'legsDark', hair: 'hairDark', alpha: .8, shadow: false }],
    passersby: [{ start: 0, every: 26, dir: 1, speed: 20, foot: 286, s: 1.12, coat: 'coatC', legs: 'legsDenim', hair: 'hairBrown', cap: 'coatB', carry: 'tote', carryC: 'coatA' },
      { start: 12, every: 30, dir: -1, speed: 22, foot: 278, s: 1.02, coat: 'coatA', long: 8, legs: 'legsDark', hair: 'hairDark', longHair: true }],
    sig: { emerge: { x: 118, foot0: 210, foot1: 262, s0: .66, s1: 1.16, dur: 1.35 } },
    build: function (L, F, P) {
      var R = rnd(9021);
      L.push(r(0, 0, 400, 300, 'sky', { shade: grain('skyShade', .14, 'down', 1.5) }));
      L.push(r(0, 0, 400, 78, 'far', { shade: grain('skyShade', .2, 'down') }));
      // glass room
      L.push(r(18, 78, 188, 136, 'inWall', { shade: grain('inWallShade', .32, 'down', 1.4) }));
      L.push(r(18, 176, 188, 38, 'wood', { shade: grain('woodShade', .3, 'down') }));
      L.push(r(40, 132, 36, 3, 'inShelf')); L.push(r(46, 118, 10, 14, 'inChair', { r: 1 })); L.push(r(60, 122, 8, 10, 'inChair'));
      plant(L, 150, 176, .8, 19, { n: 6, tall: 1.4, leaf: 'inLeaf', leaf2: 'inLeaf2', pot: 'wood' });
      // timber canopy and speckled counter
      L.push(r(196, 86, 188, 10, 'woodDeep'));
      [214, 292, 360].forEach(function (x) { L.push(r(x, 96, 7, 108, 'wood', { shade: grain('woodShade', .35, 'right') })); });
      L.push(line([206, 124, 248, 168], 'woodDeep', 3.2));
      L.push(r(236, 146, 18, 6, 'cup', { r: [1, 1, .4, .4] }));
      // deck, then gravel
      L.push(r(0, 214, 400, 56, 'deck', { shade: grain('deckShade', .3, 'down') }));
      for (var y = 214; y < 270; y += 8) L.push(r(0, y, 400, 1.1, 'deckLine', { a: .55 }));
      for (var gx = 24; gx < 400; gx += 48) L.push(r(gx, 214, 1.2, 56, 'woodShade', { a: .35 }));
      L.push(r(0, 268, 400, 32, 'gravel', { shade: grain('gravelShade', .3, 'down') }));
      for (var p = 0; p < 70; p++) L.push(e(R() * 400, 272 + R() * 26, .8 + R() * 1.6, .5 + R() * .8, R() > .5 ? 'pebble' : 'pebbleDark', { a: .35 + R() * .4 }));
      F.push(r(18, 78, 188, 8, 'woodDeep'));
      F.push({ t: 'text', text: 'nadoya', x: 112, y: 85.2, size: 6.5, weight: 500, font: FONT, fill: 'beam', align: 'center', ls: 1.4 });
      F.push(r(22, 92, 180, 122, 'glass', { a: .38 }));
      sheen(F, 22, 92, 180, 122, { a: .09 });
      [22, 78, 198].forEach(function (x) { F.push(r(x, 86, 4, 128, 'wood')); });
      F.push(r(22, 148, 180, 3, 'wood', { a: .85 }));
      F.push(poly([100, 92, 112, 100, 112, 208, 100, 214], 'woodDeep'));
      F.push(poly([202, 92, 190, 100, 190, 208, 202, 214], 'woodDeep'));
      F.push(r(228, 150, 140, 46, 'counter', { shade: grain('counterShade', .28, 'down', 1.3) }));
      for (var i = 0; i < 46; i++) F.push(e(234 + R() * 128, 156 + R() * 34, .7 + R() * 1.3, .5 + R() * .7, R() > .7 ? 'chip' : R() > .4 ? 'chipWarm' : 'chipDark', { a: .55 + R() * .4 }));
      F.push(r(196, 78, 190, 14, 'wood', { shade: grain('woodShade', .35, 'down') }));
      F.push(r(200, 80, 180, 2, 'beam', { a: .7 }));
      // a slim metal chair at the open end of the counter
      P.push(line([352, 214, 348, 186, 372, 186, 376, 214], 'metal', 1.5));
      P.push(r(346, 184, 28, 2.4, 'metal'));
      P.push(line([350, 186, 350, 170, 370, 170], 'metal', 1.3));
      contact(P, 364, 216, 14, .12);
      P.push(r(70, 248, 70, 6, 'deckShade', { r: 1 })); P.push(r(86, 258, 54, 5, 'deckShade', { r: 1 }));
      contact(P, 108, 266, 30, .1);
    } });
})();
