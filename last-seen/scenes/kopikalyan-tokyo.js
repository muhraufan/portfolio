/* Scene — kopikalyan-tokyo. Needs /last-seen/last-seen.js and /last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, rnd = K.rnd, mix = K.mix;
  var make = K.make, pavement = K.pavement, contact = K.contact, sheen = K.sheen, plant = K.plant, leaves = K.leaves, FONT = K.FONT;
  /* ================= Kopikalyan Tokyo — Jingumae, Harajuku (Nov 21, 14:00), alone, a clear late-autumn day =================
     the ground floor of Garden Square Harajuku: a low box of grey trowelled plaster pushed out from under the glass
     building, its top edge on a slight slant. On the plaster, a round porthole with the warm room behind it and the name
     in small dark lowercase letters beside it; right of that the black steel doors, open onto the coffee bar; a small
     lamp on the wall. To the right the cafe's tall picture window, wood and pendant lamps inside; to the left the
     neighbour's rust-red pier and a clothes shop's glass. Two stone-tiled steps run along the front, with a grey mat at
     the door, the standing "NOW OPEN" frames and a menu stand. A white parasol on the terrace at the far right. */
  var WX0 = 92, WX1 = 300, WT = 100, BASE = 212, DX = 232, DW = 46, DT = 124, PX = 142, PY = 152, PR = 12.5;
  // Raufan, as at Apple Omotesando an hour earlier: a brown cap over shoulder-length hair, a sage-green jacket open over
  // a brown marled sweater, khaki trousers, white Asics, a white tote with a green mark
  var PEOPLE = { rfCap: '#5b3d2a', rfJacket: '#6e7668', rfSweater: '#7b5f3d', rfPants: '#c0aa80', rfShoe: '#eceae4', rfSole: '#f7f6f2', rfShoeMark: '#a7abb0', rfTote: '#f0eee6', rfToteMark: '#3f7d55' };
  function tonePeople(t, k) { var o = {}; Object.keys(PEOPLE).forEach(function (n) { o[n] = mix(PEOPLE[n], t, k); }); return o; }
  function frame(A, x, foot, w, h, panel, bars) {   // a standing sign: a steel hoop with a panel hung in it
    contact(A, x + w / 2, foot, w * .6, .16);
    A.push(r(x, foot - h, .9, h, 'steel')); A.push(r(x + w - .9, foot - h, .9, h, 'steel')); A.push(r(x, foot - h, w, .9, 'steel')); A.push(r(x - 1, foot - .9, w + 2, .9, 'steel'));
    A.push(r(x + 1.8, foot - h + 2.4, w - 3.6, h - 6, panel)); bars.forEach(function (b) { A.push(r(x + 3.2, foot - h + b[0], (w - 6.4) * b[1], b[2], 'signPaper', { a: .9 })); });
  }

  make('kopikalyan-tokyo', { seed: 1122, seenAt: '2026-11-21T14:00:00+09:00',
    place: { en: 'Kopikalyan Tokyo', ja: 'コピカリアン 東京' }, name: { en: 'Kopikalyan Tokyo', ja: 'コピカリアン 東京' }, area: { en: 'Harajuku, Tokyo', ja: '東京・原宿' },
    alt: 'Illustration of Kopikalyan Tokyo in Harajuku on a clear autumn day: a low grey plaster front under a glass building, with a round porthole window, the name in small dark letters, black steel doors open onto a warm coffee bar, a tall picture window, stone steps with standing signs, and Raufan in a brown cap and a green jacket over a brown sweater, carrying a white tote.',
    palette: Object.assign({ sky: '#7fb2e0', skyShade: '#b3d3ee', sunWash: '#fff1d2', cloudLite: '#f6f9fc',
      tower: '#a9c3d6', towerShade: '#8eaac0', towerLite: '#d6e6f1', mull: '#e9ecec', mullShade: '#b8bec2', slab: '#dcdedd', railG: '#cfe0ea', winLit: '#9db8cc', towerRoom: '#7f9bb1',
      wall: '#c6c5c0', wallShade: '#a9a8a2', wallLite: '#dad9d4', wallMark: '#b7b6b0', cap: '#55585b', reveal: '#8f8e88', sign: '#33363a',
      steelD: '#26282b', steelDLite: '#4a4d51', steel: '#8b9094', lampBox: '#e8e6df', lampGlow: '#fff3d4',
      pier: '#a5533c', pierShade: '#853f2c', nbGlass: '#5d6a72', nbFrame: '#3a3d40',
      inWall: '#efdfc2', inWallShade: '#d6bf96', inWood: '#c59a66', inWoodD: '#a27a4a', inSlat: '#d3ab77', inCounter: '#e8e1d4', inCounterD: '#c9bfae', inLamp: '#fff3d4', inShade: '#e9d9b8', inCord: '#5c5348',
      inShelf: '#b98a57', inCup: '#f4efe6', inCup2: '#c7694b', inHair: '#2e2926', inHair2: '#5c4638', inShirt: '#3d4a5c', inShirt2: '#b9b0a2', inApron: '#2f3338',
      inRack: '#2e3033', inCloth1: '#ece6da', inCloth2: '#b8a98f', inCloth3: '#55606c', inNb: '#e2d8c8', inNbShade: '#c9bca8', inChair: '#3a3632', inTable: '#c9a274', glassTint: '#6f8a9c',
      step: '#cfcabf', stepShade: '#b4aea2', stepLine: '#a8a296', mat: '#6c7078', matShade: '#565a62', signPanel: '#9a968f', signPanelD: '#5a5d61', signPaper: '#f3f1ea',
      road: '#8f9094', roadShade: '#7c7d82', roadLite: '#a3a4a8', parasol: '#f6f3ec', parasolShade: '#d9d4c8', pole: '#8d8a84', planter: '#bdb9b1', shrub: '#6f8a55', shrub2: '#88a268', shrubShade: '#4f6a3f',
      leafA: '#c98a45', leafB: '#a8683a' }, PEOPLE),
    light: { shadowAt: [[20, 70], [250, 80]],
      morning: { set: { sky: '#a9cfee', skyShade: '#d2e5f3' }, add: { back: [r(0, 0, 400, WT, 'sunWash', { a: .12 }), poly([WX0, WT, 190, WT, 130, BASE, WX0, BASE], 'shadow', { a: .06 })] } },
      midday: { add: { back: [r(WX0, WT + 1.6, WX1 - WX0, 2.4, 'shadow', { a: .18 })], front: [e(200, 247, 70, 3, 'shadow', { a: .12 })] } },
      golden: { set: { sky: '#eac29c', skyShade: '#f4d8b8', tower: '#d9b99c', towerLite: '#f6dcbd', wall: '#d3c1ab', wallLite: '#ead8c0', wallShade: '#b39f88' },
        add: { back: [r(0, 0, 400, WT, 'sunWash', { a: .24 }), poly([WX0, WT, WX1, WT - 5, WX1, 140, WX0, 176], 'sunWash', { a: .12 }), r(WX0, WT, 1.4, BASE - WT, 'rim', { a: .6 })] } },
      // after dark: the room glows through the porthole, the doors and the picture window; the little wall lamp is on
      night: { set: Object.assign({ sky: '#0f1529', skyShade: '#0b1021', tower: '#1a2130', towerShade: '#141a27', towerLite: '#2a3346', mull: '#3a3f49', mullShade: '#262a33', slab: '#30343d', railG: '#27303f', winLit: '#e8c27f', towerRoom: '#141a27',
          wall: '#3f4046', wallShade: '#2c2d33', wallLite: '#56565a', wallMark: '#37383e', cap: '#1c1d20', reveal: '#6a5a40', sign: '#e9e2d2',
          steelD: '#111214', steelDLite: '#2a2c30', steel: '#4a4d52', lampBox: '#fff1cf', pier: '#3a2019', pierShade: '#2a1712', nbGlass: '#2a2620', nbFrame: '#17181a', glassTint: '#3a2a1a',
          inWall: '#fbe6bd', inWallShade: '#e6c88e', inCounter: '#f6e7c8', inNb: '#f3e0bd',
          step: '#34353c', stepShade: '#26272d', stepLine: '#202127', mat: '#22242a', matShade: '#191b20', signPanel: '#4c4b4a', signPanelD: '#2a2c2f', signPaper: '#b9b3a6',
          road: '#1a1c23', roadShade: '#14161c', roadLite: '#252730', parasol: '#6d6c6a', parasolShade: '#4c4b4a', pole: '#3a3936', planter: '#34353a', shrub: '#1d2a1f', shrub2: '#243427', shrubShade: '#121a14' }, tonePeople('#0d1124', .6)),
        add: { over: [{ t: 'halo', x: DX + DW / 2, y: 222, rx: 46, ry: 9, n: 6, fill: 'pool', a: .09 }, { t: 'halo', x: 336, y: 220, rx: 44, ry: 8, n: 6, fill: 'pool', a: .07 }, { t: 'halo', x: PX, y: PY, rx: 26, ry: 24, n: 5, fill: 'haze', a: .035 },
          { t: 'halo', x: 289, y: 134, rx: 12, ry: 14, n: 5, fill: 'lamp', a: .1 }, { t: 'halo', x: 220, y: 252, rx: 130, ry: 13, n: 6, fill: 'pool', a: .035 }] } } },
    breathe: { x: DX, y: DT, w: DW, h: BASE - DT, c: 'breathe', a: .04 },
    shoppers: [{ keys: [[0, 20], [10, 118], [13, 118], [23, 20]], period: 23, foot: 232, s: .62, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', alpha: .95, shadow: false },
               { keys: [[0, 390], [8, 318], [11, 318], [19, 390]], period: 19, offset: 6, foot: 233, s: .62, coat: 'coatA', legs: 'legsDenim', hair: 'hairBrown', alpha: .95, shadow: false }],
    passersby: [{ start: 11, every: 24, dir: -1, speed: 23, foot: 286, s: 1.24, coat: 'coatC', legs: 'legsDark', hair: 'hairDark', carry: 'backpack', carryC: 'coatB' },
                { start: 16, every: 29, dir: 1, speed: 21, foot: 278, s: 1.14, coat: 'coatD', legs: 'legsDenim', hair: 'hairBrown', carry: 'tote', carryC: 'bagMark' }],
    stamp: { x0: 84, x1: 340, y0: 34, y1: 276 },
    sig: { emerge: { x: DX + DW / 2, foot0: 226, foot1: 264, s0: .66, s1: 1.24, dur: 1.3 },
      person: { coat: 'rfJacket', open: 'rfSweater', long: -2.5, hat: false, ballcap: 'rfCap', legs: 'rfPants', hairDown: true, longHair: true, hair: 'hairDark',
        shoe: 'rfShoe', sole: 'rfSole', shoeMark: 'rfShoeMark', bag: 'rfTote', bagMark: 'rfToteMark' } },
    build: function (L, F, P) {
      var R = rnd(1122), i, x, y;
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .25, 'down', 1.6) }));
      L.push(e(366, 14, 22, 2.6, 'cloudLite', { a: .6 })); L.push(e(18, 24, 16, 2.2, 'cloudLite', { a: .5 }));
      // the glass building over the cafe: curtain wall, floor slabs with glass balustrades, pale mullions
      L.push(r(34, 0, 336, 104, 'tower', { shade: grain('towerShade', .3, 'down', 1.5) }));
      for (i = 0; i < 16; i++) { x = 40 + Math.floor(R() * 13) * 25; y = 4 + Math.floor(R() * 3) * 33; L.push(r(x, y, 24, 24, R() > .6 ? 'winLit' : 'towerRoom', { a: .35 })); }
      L.push(poly([34, 0, 150, 0, 60, 104, 34, 104], 'towerLite', { a: .22 })); L.push(poly([210, 0, 262, 0, 172, 104, 120, 104], 'towerLite', { a: .14 }));
      for (x = 40; x < 370; x += 25) { L.push(r(x - .7, 0, 1.4, 104, 'mull')); L.push(r(x + .7, 0, .5, 104, 'mullShade', { a: .6 })); }
      [28, 61, 94].forEach(function (sy) { L.push(r(34, sy, 336, 4.4, 'slab', { shade: grain('mullShade', .3, 'down') })); L.push(r(34, sy - 7, 336, 7, 'railG', { a: .45 })); L.push(r(34, sy - 7, 336, .7, 'mull')); L.push(r(34, sy + 4.4, 336, 1.2, 'shadow', { a: .16 })); });
      L.push(r(34, 0, 3, 104, 'mull')); L.push(r(367, 0, 3, 104, 'mullShade'));
      // left: the neighbour's rust-red pier and a clothes shop behind glass
      L.push(r(0, 96, WX0, BASE - 96, 'inNb', { shade: grain('inNbShade', .3, 'down') }));
      L.push(r(30, 128, 56, 1.2, 'inRack')); L.push(r(31, 128, .9, 76, 'inRack')); L.push(r(84, 128, .9, 76, 'inRack'));
      [['inCloth1', 36], ['inCloth2', 45], ['inCloth3', 54], ['inCloth1', 63], ['inCloth2', 72]].forEach(function (g, k) { L.push(poly([g[1], 131, g[1] + 7, 131, g[1] + 8.4, 172 + k % 2 * 8, g[1] - 1.4, 172 + k % 2 * 8], g[0], { shade: grain('shadow', .12, 'right') })); L.push(r(g[1] + 3, 128.6, .7, 2.6, 'inRack')); });
      L.push(r(26, 204, 66, 8, 'inNbShade')); L.push(r(26, 96, 66, BASE - 96, 'nbGlass', { a: .16 })); sheen(L, 26, 96, 66, BASE - 96, { a: .12, at: .2, street: true, streetA: .06 });
      L.push(r(0, 96, WX0, 3, 'nbFrame')); L.push(r(0, 60, 26, BASE - 60, 'pier', { shade: grain('pierShade', .35, 'right', 1.4) })); L.push(r(24.6, 60, 1.4, BASE - 60, 'pierShade'));
      // right: the cafe's tall picture window — slatted wood, pendant lamps, a table and chairs
      L.push(r(WX1, 106, 70, BASE - 106, 'inWall', { shade: grain('inWallShade', .25, 'down') }));
      for (x = WX1 + 30; x < WX1 + 68; x += 3.4) L.push(r(x, 110, 1.5, 70, 'inSlat', { a: .9 })); L.push(r(WX1 + 28, 180, 42, 1.4, 'inWoodD'));
      [[WX1 + 14, 138], [WX1 + 40, 132]].forEach(function (p) { L.push(r(p[0] - .25, 106, .5, p[1] - 106, 'inCord')); L.push(poly([p[0] - 2, p[1], p[0] + 2, p[1], p[0] + 5, p[1] + 6, p[0] - 5, p[1] + 6], 'inShade')); L.push(e(p[0], p[1] + 6.4, 4.4, 1, 'inLamp')); });
      L.push(r(WX1 + 8, 194, 26, 1.8, 'inTable')); L.push(r(WX1 + 20, 195.8, 1.4, 14, 'inWoodD')); L.push(r(WX1 + 14, 192.6, 2.4, 1.6, 'inCup')); L.push(r(WX1 + 24, 192.2, 2, 2, 'inCup2'));
      [WX1 + 4, WX1 + 36].forEach(function (cx, k) { L.push(r(cx, 198, 9, 1.4, 'inChair')); L.push(r(cx + (k ? 8 : 0), 186, 1.2, 13, 'inChair')); L.push(r(cx + 1, 199, 1, 11, 'inChair')); L.push(r(cx + 7, 199, 1, 11, 'inChair')); });
      L.push(c(WX1 + 50, 184.4, 1.8, 'inHair2')); L.push(r(WX1 + 47.6, 186.4, 4.8, 12, 'inShirt2', { r: [1.6, 1.6, 0, 0] })); L.push(r(WX1 + 44, 196, 14, 1.6, 'inTable')); L.push(r(WX1 + 50.4, 197.6, 1.2, 12, 'inWoodD'));
      L.push(r(WX1, 209, 70, 3, 'inWoodD', { a: .5 }));
      L.push(r(WX1, 106, 70, BASE - 106, 'glassTint', { a: .12 })); sheen(L, WX1, 106, 70, BASE - 106, { a: .13, at: .3, street: true, streetA: .06 });
      L.push(r(WX1, 104, 72, 2.4, 'steelD')); L.push(r(WX1 + 69, 104, 3, BASE - 104, 'steelD')); L.push(r(WX1 + 34, 106, .8, BASE - 106, 'steelD', { a: .8 }));
      // the room behind the plaster: seen through the porthole and the open doors
      L.push(r(PX - PR - 2, PY - PR - 2, PR * 2 + 4, PR * 2 + 4, 'inWall', { shade: grain('inWallShade', .3, 'down') }));
      [PY - 5, PY + 3].forEach(function (sy, k) { L.push(r(PX - PR, sy, PR * 2, 1, 'inShelf')); for (x = PX - 9; x < PX + 9; x += 4.2) L.push(r(x, sy - 3, 2.6, 3, (k + Math.round(x)) % 2 ? 'inCup' : 'inCup2', { r: [0, 0, .8, .8] })); });
      L.push(r(DX, DT, DW, BASE - DT, 'inWall', { shade: grain('inWallShade', .28, 'down', 1.4) }));
      for (x = DX + 4; x < DX + DW - 2; x += 3.6) L.push(r(x, DT + 4, 1.5, 34, 'inSlat', { a: .85 }));
      L.push(r(DX + 2, DT + 38, DW - 4, 1.2, 'inWoodD')); L.push(r(DX + 22 - .25, DT, .5, 18, 'inCord')); L.push(poly([DX + 20, DT + 18, DX + 24, DT + 18, DX + 27, DT + 24, DX + 17, DT + 24], 'inShade')); L.push(e(DX + 22, DT + 24.4, 4.4, 1, 'inLamp'));
      L.push(r(DX + 3, 186, DW - 6, 20, 'inCounter', { shade: grain('inCounterD', .35, 'down') })); L.push(r(DX + 3, 185, DW - 6, 1.6, 'inWood'));
      L.push(r(DX + 8, 180, 5, 5, 'inApron', { r: .6 })); L.push(r(DX + 30, 181.4, 2.6, 3.6, 'inCup')); L.push(r(DX + 35, 182, 2.4, 3, 'inCup2'));
      L.push(c(DX + 20, 171.6, 2, 'inHair')); L.push(r(DX + 17.2, 173.8, 5.6, 11.4, 'inApron', { r: [1.8, 1.8, 0, 0] })); L.push(r(DX + 18.4, 177, 3.2, 8, 'inShirt2', { a: .5 }));
      L.push(r(DX, 206, DW, 6, 'inWallShade'));

      // ---- the plaster box: trowelled grey, its top edge on a slant, a dark cap, the porthole cut through it ----
      // (drawn as four pieces round the door so the room stays open behind it)
      L.push(poly([WX0, WT, DX, WT - 3.4, DX, BASE, WX0, BASE], 'wall', { shade: [grain('wallShade', .22, 'down', 1.8), grain('wallLite', .14, 'left', 1.6)] }));
      L.push(poly([DX, WT - 3.4, DX + DW, WT - 4.5, DX + DW, DT, DX, DT], 'wall', { shade: grain('wallShade', .2, 'down', 1.8) }));
      L.push(poly([DX + DW, WT - 4.5, WX1, WT - 5, WX1, BASE, DX + DW, BASE], 'wall', { shade: [grain('wallShade', .26, 'right', 1.6)] }));
      for (i = 0; i < 9; i++) L.push(e(WX0 + 10 + R() * 120, WT + 12 + R() * 96, 10 + R() * 16, 2 + R() * 4, i % 2 ? 'wallLite' : 'wallMark', { a: .18, rot: (R() - .5) * .5 }));   // trowel marks
      L.push(poly([WX0 - 2, WT - 1.6, WX1 + 2, WT - 6.8, WX1 + 2, WT - 4.4, WX0 - 2, WT + .8], 'cap')); L.push(r(WX0, WT + .8, 1.2, BASE - WT, 'wallLite', { a: .7 }));
      // the porthole: a deep round reveal, the room's shelves glowing in it
      L.push(c(PX, PY, PR + 2.2, 'reveal', { shade: grain('shadow', .3, 'down') }));
      L.push(c(PX, PY, PR, 'inWall', { shade: grain('inWallShade', .3, 'down') }));
      [PY - 5, PY + 3].forEach(function (sy, k) { L.push(r(PX - PR + 2.4, sy, PR * 2 - 4.8, 1, 'inShelf')); for (x = PX - 7.6; x < PX + 6; x += 4.2) L.push(r(x, sy - 3, 2.6, 3, (k + Math.round(x)) % 2 ? 'inCup' : 'inCup2', { r: [0, 0, .8, .8] })); });
      L.push(c(PX, PY, PR, 'glassTint', { a: .1 })); L.push(ring(PX, PY, PR + 1.1, 'reveal', 2.2)); L.push(ring(PX, PY, PR + 2.4, 'wallLite', .6, { a: .7 }));
      // the name, small dark letters standing off the wall
      L.push({ t: 'text', text: 'kopikalyan', x: 191.6, y: 155.8, size: 9.4, weight: 600, font: FONT, fill: 'shadow', align: 'center', ls: .02, a: .18 });
      L.push({ t: 'text', text: 'kopikalyan', x: 191, y: 155.2, size: 9.4, weight: 600, font: FONT, fill: 'sign', align: 'center', ls: .02 });
      // a small lamp on the wall by the doors
      L.push(r(286, 128, 6, 7, 'lampBox', { r: .8, shade: grain('wallShade', .3, 'down') })); L.push(r(286.8, 135, 4.4, 1, 'lampGlow', { a: .9 }));
      // the doors: black steel, both leaves open inward, a transom above
      F.push(r(DX - 1.6, DT - 2, DW + 3.2, 2.4, 'steelD')); F.push(r(DX - 1.6, DT - 2, 2.4, BASE - DT + 2, 'steelD')); F.push(r(DX + DW - .8, DT - 2, 2.4, BASE - DT + 2, 'steelD'));
      F.push(r(DX, DT + 10, DW, 1.2, 'steelD')); F.push(r(DX + .8, DT - 2, .6, BASE - DT + 2, 'steelDLite', { a: .7 }));
      [[DX + .8, 1], [DX + DW - 7.8, -1]].forEach(function (d) { F.push(r(d[0], DT + 11.2, 7, BASE - DT - 11.2, 'glassTint', { a: .22 })); F.push(r(d[0], DT + 11.2, 7, 1, 'steelD')); F.push(r(d[0] + (d[1] > 0 ? 6.2 : 0), DT + 11.2, .8, BASE - DT - 11.2, 'steelD')); F.push(r(d[0] + (d[1] > 0 ? 4.4 : 1.8), 168, .7, 12, 'steel')); });

      // two stone-tiled steps along the front, the mat at the door
      L.push(r(0, 212, 400, 5, 'step', { shade: grain('stepShade', .3, 'down') })); L.push(r(0, 216.4, 400, 1, 'stepLine', { a: .8 }));
      L.push(r(0, 217.4, 400, 5.4, 'step', { shade: grain('stepShade', .4, 'down') })); L.push(r(0, 222, 400, 1.2, 'stepLine'));
      for (x = 6; x < 400; x += 19) { L.push(r(x, 212, .6, 4.4, 'stepLine', { a: .6 })); L.push(r(x + 9, 217.4, .6, 4.6, 'stepLine', { a: .6 })); }
      L.push(poly([DX - 2, 212.4, DX + DW + 2, 212.4, DX + DW + 5, 216.2, DX - 5, 216.2], 'mat', { shade: grain('matShade', .4, 'down') }));
      L.push(r(0, 223.2, 400, 20.8, 'road', { shade: [grain('roadShade', .35, 'down', 1.3), grain('roadLite', .12, 'up')] }));
      // on the steps: the hanging "NOW OPEN" frames, a menu stand, and the terrace's parasol and planter at the far right
      frame(F, 170, 217, 15, 30, 'signPanel', [[6, .8, 9], [18, 1, 1.4], [21, .7, 1.4]]);
      frame(F, 190, 217, 15, 30, 'signPanelD', [[10, 1, 2], [14, .8, 2], [22, .6, 1]]);
      contact(F, 216, 217, 5, .16); F.push(r(215.5, 196, 1, 21, 'steelD')); F.push(r(212, 216.2, 8, .9, 'steelD')); F.push(poly([210, 197.6, 221, 194, 222, 196.4, 211, 200], 'steelD')); F.push(poly([211, 197.4, 220.6, 194.4, 221, 195.6, 211.6, 198.8], 'signPaper', { a: .9 }));
      F.push(r(372, 206, 28, 11, 'planter', { shade: grain('wallShade', .3, 'down') })); [[378, 203, 6], [387, 201, 7], [396, 203, 6]].forEach(function (s, k) { F.push(c(s[0], s[1], s[2], k % 2 ? 'shrub2' : 'shrub', { shade: grain('shrubShade', .5, 'br', 1.2) })); });
      F.push(r(385.4, 150, 1.2, 56, 'pole')); F.push(poly([350, 152, 386, 140, 400, 144, 400, 152], 'parasol', { shade: grain('parasolShade', .35, 'right') })); F.push(r(350, 152, 50, 1.6, 'parasolShade'));
      pavement(L, F, { seed: 1122, tactile: 168 });
      leaves(L, 6, 394, 249, 296, 22, 9, ['leafA', 'leafB']);
      // a potted plant on our side of the lane
      plant(P, 44, 266, 1.7, 14);
    } });
})();
