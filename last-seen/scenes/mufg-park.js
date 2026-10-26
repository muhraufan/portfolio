/* Scene — mufg-park. Needs last-seen.js and last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, contact = K.contact, crown = K.crown, sitter = K.sitter;
  /* MUFG PARK — a glass pavilion under a long wooden canopy that barely touches the ground, lawn and pines around it. */
  make('mufg-park', { seed: 903, seenAt: '2026-10-11T11:00:00+09:00',
    place: { en: 'MUFG PARK', ja: 'MUFG PARK' }, name: { en: 'MUFG PARK', ja: 'MUFG PARK' }, area: { en: 'Yanagisawa, Nishitokyo', ja: '西東京・柳沢' },
    alt: 'Illustration of MUFG PARK: a glass pavilion under a long floating wooden canopy, a deck, lawn and pines.',
    palette: { sky: '#d5e2ea', skyShade: '#c3d4df', sunWash: '#ffc58e',
      tree: '#3e6244', tree2: '#547856', tree3: '#6d9468', treeShade: '#2c4a32', trunk: '#5c5144',
      lawn: '#b7c99a', lawnShade: '#93ab78', lawnDeep: '#7e9864',
      path: '#e4dccb', pathShade: '#cfc4ae', gravel: '#6e706c',
      canopy: '#c4925c', canopyShade: '#8d6236', canopyLite: '#e4c090',
      post: '#4a4036', deck: '#c6a36e', deckShade: '#a07c48', deckLine: '#d4b88a',
      glass: '#31404c', glassShade: '#243038',
      inWall: '#f6e7cf', inWallShade: '#e7cfab', inShelf: '#8d6844', inLamp: '#ffe1ae',
      plate: '#f4f0e8', plateInk: '#2c2824' },
    light: { noShadows: true,
      night: { set: { tree: '#1a2c22', tree2: '#24382a', tree3: '#2c4434', treeShade: '#101c14', trunk: '#2a241c',
          lawn: '#1c2818', lawnShade: '#141c12', lawnDeep: '#10180e', path: '#2a2824', pathShade: '#1e1c18', gravel: '#141614',
          canopy: '#6a4830', canopyShade: '#3e2a1a', canopyLite: '#8a6240', post: '#1a1612', deck: '#4a3824', deckShade: '#342616', deckLine: '#5c4630',
          glass: '#2a241c', glassShade: '#161410', plate: '#d9d0c2', plateInk: '#2a261f' },
        add: { over: [{ t: 'halo', x: 200, y: 168, rx: 130, ry: 28, n: 7, fill: 'pool', a: .05 }, { t: 'halo', x: 120, y: 176, rx: 36, ry: 16, n: 5, fill: 'haze', a: .04 }, { t: 'halo', x: 280, y: 176, rx: 36, ry: 16, n: 5, fill: 'haze', a: .04 }, { t: 'halo', x: 200, y: 250, rx: 100, ry: 16, n: 5, fill: 'pool', a: .028 }] } } },
    breathe: { x: 78, y: 132, w: 230, h: 62 },
    shoppers: [{ keys: [[0, 150], [9, 176], [14, 176], [22, 150]], period: 22, foot: 186, s: .48, coat: 'coatA', legs: 'legsDark', hair: 'hairDark', alpha: .7, shadow: false }],
    passersby: [{ start: 0, every: 30, dir: 1, speed: 16, foot: 286, s: 1.08, coat: 'coatB', legs: 'legsDenim', hair: 'hairDark' },
      { start: 14, every: 34, dir: -1, speed: 15, foot: 292, s: .96, coat: 'coatC', legs: 'legsDark', hair: 'hairBrown', longHair: true, carry: 'tote', carryC: 'coatA' }],
    sig: { emerge: { x: 200, foot0: 210, foot1: 274, s0: .62, s1: 1.12, dur: 1.45 } },
    build: function (L, F, P) {
      L.push(r(0, 0, 400, 168, 'sky', { shade: grain('skyShade', .18, 'down', 1.6) }));
      L.push(r(0, 150, 400, 150, 'lawn', { shade: grain('lawnShade', .32, 'down', 1.4) }));
      for (var i = 0; i < 18; i++) L.push(e(12 + (i * 47) % 390, 168 + (i * 29) % 120, 10 + (i % 4) * 4, 2.2, 'lawnDeep', { a: .18 }));
      // pines behind the roof
      [[28, 118, 6], [58, 108, 7], [348, 112, 6], [378, 124, 5]].forEach(function (t) { L.push(r(t[0], t[1], t[2], 150 - t[1] + 20, 'trunk')); });
      crown(L, [[24, 78, 22], [46, 64, 26], [68, 86, 18], [338, 70, 24], [362, 84, 20], [386, 66, 22]], ['tree', 'tree2', 'tree3'], 'treeShade');
      // the pavilion, then a gap, then the canopy drawn in front so it floats
      L.push(r(86, 138, 214, 58, 'inWall', { shade: grain('inWallShade', .3, 'down') }));
      L.push(r(100, 156, 70, 3, 'inShelf')); L.push(r(108, 148, 8, 8, 'inShelf', { r: 1 })); L.push(r(122, 150, 6, 6, 'canopyShade', { a: .7 }));
      L.push(c(160, 150, 2, 'inLamp')); L.push(c(230, 150, 2, 'inLamp'));
      L.push(r(64, 188, 268, 28, 'deck', { shade: grain('deckShade', .32, 'down') }));
      for (var d = 188; d < 216; d += 6) L.push(r(64, d, 268, .8, 'deckLine', { a: .5 }));
      L.push(r(52, 214, 292, 6, 'gravel', { a: .85 }));
      L.push(poly([168, 300, 236, 300, 214, 220, 186, 220], 'path', { shade: grain('pathShade', .28, 'up') }));
      // end posts only — the middle of the roof is open air
      L.push(r(40, 124, 5, 78, 'post')); L.push(r(354, 112, 4.5, 84, 'post'));
      L.push(e(200, 214, 120, 4, 'shadow', { a: .12 }));
      F.push(r(86, 138, 214, 52, 'glass', { a: .4 }));
      F.push(poly([100, 138, 140, 138, 118, 168, 96, 168], 'glassLight', { a: .08 }));
      F.push(r(86, 138, 214, 2.2, 'post'));
      // the floating slab: a long wedge, thin, past the glass on both ends
      F.push(poly([8, 126, 396, 86, 400, 100, 16, 142], 'canopy', { shade: grain('canopyShade', .42, 'down', 1.6) }));
      F.push(poly([8, 126, 396, 86, 394, 92, 14, 130], 'canopyLite', { a: .85 }));
      F.push(poly([16, 136, 392, 98, 390, 104, 20, 142], 'canopyShade', { a: .35 }));
      P.push(r(292, 196, 1.6, 22, 'post'));
      P.push(r(274, 192, 38, 9, 'plate', { r: 1 }));
      P.push({ t: 'text', text: 'MUFG PARK', x: 293, y: 198.6, size: 2.7, weight: 600, font: FONT, fill: 'plateInk', align: 'center', ls: .2 });
      contact(P, 293, 220, 6, .12);
      sitter(P, 108, 188, .62, { coat: 'coatA', legs: 'legsDenim', hair: 'hairDark', dir: 1 });
      // near pines, framing
      P.push(r(8, 150, 8, 120, 'trunk')); P.push(r(386, 160, 7, 110, 'trunk'));
      crown(P, [[16, 132, 28], [40, 150, 16], [384, 140, 26], [360, 156, 14]], ['tree2', 'tree', 'tree3'], 'treeShade');
    } });
})();
