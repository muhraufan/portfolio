/* Scene — raw-sugar-roast. Needs /last-seen/last-seen.js and /last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, rnd = K.rnd, mix = K.mix;
  var make = K.make, contact = K.contact, sheen = K.sheen, pipe = K.pipe, plant = K.plant, FONT = K.FONT;
  /* ================= Raw Sugar Roast — Kyodo, Tokyo (Nov 13, 14:02), with Brian, Rizal and Reihan =================
     seen from across the pavement: the ground floor of an ochre brick apartment block. A pair of old timber doors with
     glazed tops under a stepped brick canopy (two brick-faced slabs with white undersides), a rubber plant in a white pot
     beside them, a small hand-lettered plaque and a steel plate on the pier, a maroon drainpipe, and a wide dark-framed
     window with plants on the sill and globe lamps inside. Upstairs a brick balcony band with a steel coping, round vent
     caps under it, and a window behind a brown mesh grille. A strip of red brick paving at the foot of the wall, then the
     asphalt pavement; down the street to the left an orange block and the wires. A clear early afternoon in November.
     Recomposed front-on from his three photos, which were all taken at an angle. */
  var BX = 46;                                   // the block's left corner; the street runs away to the left of it
  var DX0 = 172, DX1 = 232, DT = 162;            // the door recess
  var WX0 = 302, WX1 = 394, WT = 166, WB = 228;  // the wide window
  var LX0 = 62, LX1 = 136, LT = 178, LB = 228;   // the smaller window left of the door
  var PEOPLE = { rfCap: '#74859a', rfCapFront: '#c56a36', rfTee: '#9b9da0', rfPants: '#222326', rfShoe: '#f1efea', rfSole: '#d8d5cd', rfShoeMark: '#c9c6bf',
    rhKnit: '#4b4d50', rhTee: '#1f2022', rhPants: '#1e1f22', rhBag: '#252a3a', rhShoe: '#e4e3de', rhSole: '#bfc0bd',
    brCap: '#3d4046', brFleece: '#202124', brPants: '#b3aa98', brBag: '#7e8690', brShoe: '#1c1c1f', brSole: '#3a3a3d',
    rzJacket: '#cfc6a8', rzTee: '#1f2022', rzPants: '#222326', rzBag: '#1b1b1e', rzBoot: '#7a5a41', rzBootSole: '#4d382a', frames: '#1f1f22' };
  function tonePeople(t, k) { var o = {}; Object.keys(PEOPLE).forEach(function (n) { o[n] = mix(PEOPLE[n], t, k); }); return o; }

  make('raw-sugar-roast', { seed: 1113, seenAt: '2026-11-13T14:02:00+09:00',
    place: { en: 'Raw Sugar Roast', ja: 'ロウ シュガー ロースト' }, name: { en: 'Raw Sugar Roast', ja: 'ロウ シュガー ロースト' }, area: { en: 'Kyodo, Tokyo', ja: '東京・経堂' },
    alt: 'Illustration of Raw Sugar Roast in Kyodo, Tokyo: the ground floor of an ochre brick apartment block with a pair of old timber doors under a stepped brick canopy, a rubber plant in a white pot, a small hand-lettered plaque, a maroon drainpipe and a wide window with plants and globe lamps inside, with Raufan in a two-tone cap and grey T-shirt and three friends.',
    palette: Object.assign({ sky: '#5f9fdc', skyShade: '#9cc6ee', sunWash: '#ffe9c2',
      brick: '#cb9a5c', brickShade: '#ab7c44', brickLite: '#e0b87e', brickPale: '#e6cb9a', brickWarm: '#c7864a', brickJoint: '#a98452',
      band: '#d4a567', bandShade: '#b3864c', soffit: '#ebe8e1', soffitShade: '#c8c4ba', coping: '#c9cdd0', copingShade: '#9ea4a8',
      recessWall: '#a87f4c', recessShade: '#7f5d36', hatch: '#6b5a48', hatchShade: '#54463a',
      grille: '#4a3a33', grilleLite: '#6a554a', frame: '#3b302b', frameLite: '#5a4a41', upGlass: '#5d7183', upGlassShade: '#45586a',
      reveal: '#8e6a40', revealShade: '#6b4d2c',
      wood: '#8f5a31', woodShade: '#6d4222', woodLite: '#ad7541', woodDark: '#5a361c', brass: '#c9a45a',
      glassT: '#31404a', pipe: '#6e4742', pipeShade: '#523330', steel: '#cfd1d0', steelShade: '#a9adad',
      sign: '#565a5e', signShade: '#44474b', signInk: '#efebe0', vent: '#b9b4a8', ventDark: '#4c4640',
      pave: '#a9634c', paveShade: '#8e4f3c', paveLite: '#bf7a60', paveJoint: '#c9a48e',
      asphalt: '#70737a', asphaltShade: '#5d6067', asphaltLite: '#8a8d93', lineW: '#e9e8e3',
      potW: '#e8e4da', potWShade: '#c6c1b5', rubber: '#3f5a41', rubber2: '#59744f', rubberShade: '#2b3f2f',
      far: '#d9763f', farShade: '#b95e2e', farWin: '#f0e6d6', far2: '#c9ccce', far2Shade: '#aab0b4', farSign: '#e9c93f', farSignInk: '#3d6b46', wire: '#3a3a3c', poleC: '#8d8f8e',
      inWall: '#e9d2a6', inWallShade: '#caa772', inDeep: '#d9b983', inFloor: '#b7976a', inLamp: '#fff1cf', inLampShade: '#f1cf8a', inCord: '#5a4a38',
      inWood: '#a17647', inWoodShade: '#7c5932', inPot: '#d9d2c3', inPotShade: '#b3ab99', inLeaf: '#5e8a4e', inLeaf2: '#7ba463', inLeafShade: '#3f6a3a',
      inShirt: '#3b3d42', inShirt2: '#dad6cc', inHair: '#2b2623', inCup: '#f7f3ea', inPic: '#6d8aa0', inPicFrame: '#8a6a45', inShelf: '#8e6a41' }, PEOPLE),
    light: { noShadows: true,
      morning: { set: Object.assign({ sky: '#a9cdea', skyShade: '#d6e6f2' }, tonePeople('#cbd8e2', .1)),
        add: { back: [poly([BX, 0, 400, 0, 400, 78, BX, 40], 'sunWash', { a: .1 }), r(0, 244, 400, 6, 'shadow', { a: .1 })] } },
      midday: { add: { back: [poly([BX, 0, 150, 0, 110, 244, BX, 244], 'sunWash', { a: .1 }), r(BX, 244, 354, 3, 'shadow', { a: .12 })] } },
      golden: { set: Object.assign({ sky: '#eaa878', skyShade: '#f4cfa6', brick: '#d9a05a', brickLite: '#f0c486', brickPale: '#f6d9a6', brickWarm: '#d68a44', band: '#e3ac64', soffit: '#f6e2c6', soffitShade: '#d9bd99',
          far: '#e57c3c', pave: '#b9664a', asphalt: '#7d726d' }, tonePeople('#f0b07e', .12)),
        add: { back: [poly([BX, 0, 400, 0, 400, 60, BX, 150], 'sunWash', { a: .12 }), poly([BX, 150, 400, 60, 400, 244, BX, 244], 'shadow', { a: .08 })],
               front: [poly([150, 262, 260, 262, 200, 272, 90, 272], 'shadow', { a: .1 })] } },
      night: { set: Object.assign({ sky: '#10162a', skyShade: '#0b1021',
          brick: '#3a2f27', brickShade: '#2a221c', brickLite: '#463a30', brickPale: '#4a3f34', brickWarm: '#3d2e23', brickJoint: '#2c241e',
          band: '#40342b', bandShade: '#2e251f', soffit: '#4a4640', soffitShade: '#35322e', coping: '#4f545a', copingShade: '#363a3f',
          recessWall: '#241d18', recessShade: '#19140f', hatch: '#1d1915', hatchShade: '#15120f',
          grille: '#17120f', grilleLite: '#261e19', frame: '#191411', frameLite: '#2a221d', upGlass: '#e3bb78', upGlassShade: '#b98f52',
          reveal: '#5a4025', revealShade: '#3b2916', wood: '#5f3d22', woodShade: '#452b17', woodLite: '#7a522f', woodDark: '#382212', brass: '#8f7440',
          pipe: '#2b1d1b', pipeShade: '#1f1513', steel: '#5d6164', steelShade: '#43474a', sign: '#2d3033', signShade: '#222527', signInk: '#c9c3b4', vent: '#4a4741', ventDark: '#1b1917',
          pave: '#3a2620', paveShade: '#2c1c17', paveLite: '#4a3027', paveJoint: '#4b3a31', asphalt: '#181a20', asphaltShade: '#111318', asphaltLite: '#23262d', lineW: '#55575c',
          potW: '#6b675f', potWShade: '#4e4b45', rubber: '#1c2a1f', rubber2: '#26362a', rubberShade: '#121c15',
          far: '#3a2a22', farShade: '#2a1e18', farWin: '#e6c07e', far2: '#22252c', far2Shade: '#191b21', farSign: '#d9bb3a', wire: '#0a0a0c', poleC: '#2a2c30',
          inWall: '#f3d39c', inDeep: '#efc888', inLamp: '#fff4d6' }, tonePeople('#0d1124', .6)),
        add: { over: [{ t: 'halo', x: 201, y: 196, rx: 44, ry: 40, n: 6, fill: 'pool', a: .06 }, { t: 'halo', x: 201, y: 250, rx: 60, ry: 12, n: 6, fill: 'pool', a: .09 },
          { t: 'halo', x: 348, y: 198, rx: 64, ry: 42, n: 6, fill: 'pool', a: .055 }, { t: 'halo', x: 348, y: 250, rx: 70, ry: 12, n: 6, fill: 'pool', a: .07 },
          { t: 'halo', x: 99, y: 204, rx: 48, ry: 34, n: 5, fill: 'pool', a: .045 }, { t: 'halo', x: 99, y: 250, rx: 50, ry: 10, n: 5, fill: 'pool', a: .05 },
          { t: 'halo', x: 99, y: 42, rx: 40, ry: 26, n: 5, fill: 'pool', a: .03 }] } } },
    breathe: { x: WX0 + 2, y: WT + 2, w: WX1 - WX0 - 4, h: WB - WT - 4, c: 'breathe', a: .03 },
    // someone crossing the room behind the door's glass
    shoppers: [{ keys: [[0, 188], [7, 188], [9, 214], [17, 214], [19, 188]], period: 20, offset: 6, foot: 238, s: .7, coat: 'inShirt2', legs: 'legsDark', hair: 'hairDark', alpha: .95, shadow: false }],
    passersby: [{ start: 9, every: 27, dir: -1, speed: 22, foot: 288, s: 1.24, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', carry: 'tote', carryC: 'bagMark' },
                { start: 20, every: 33, dir: 1, speed: 19, foot: 282, s: 1.16, coat: 'coatA', long: 5, legs: 'legsDenim', hair: 'hairBrown', longHair: true }],
    stamp: { x0: 118, x1: 398, y0: 44, y1: 294 },
    ground: { y0: 258, y1: 296, xMin: 10, xMax: 390 },
    sig: { emerge: { x: 201, foot0: 242, foot1: 268, s0: .74, s1: 1.24, dur: 1.3 },
      // Raufan: the two-tone camp cap (slate-blue crown, burnt-orange front panel and brim) over shoulder-length hair worn down,
      // a grey T-shirt, black trousers, white trainers, no bag
      person: { coat: 'rfTee', shortSleeve: true, long: -6, legs: 'rfPants', hair: 'hairDark', hairDown: true, longHair: true, hat: false, bag: false,
        campcap: 'rfCap', capFront: 'rfCapFront', capBrim: 'rfCapFront', shoe: 'rfShoe', sole: 'rfSole', shoeMark: 'rfShoeMark' },
      company: [
        // a dark cap, glasses, a black fleece jacket, stone trousers, black shoes, a grey bag across the body
        { person: { coat: 'brFleece', long: -4.5, legs: 'brPants', hair: 'hairDark', hat: false, bag: false, ballcap: 'brCap', glasses: 'frames', carry: 'crossbody', carryC: 'brBag',
            shoe: 'brShoe', sole: 'brSole', stride: 11.5 }, dx: -28, dy: 3, ds: .03, lag: .22 },
        // glasses, a cream short jacket open over a black T-shirt, black trousers, brown boots
        { person: { coat: 'rzJacket', open: 'rzTee', long: -4.5, legs: 'rzPants', hair: 'hairDark', hat: false, bag: false, glasses: 'frames',
            shoe: 'rzBoot', sole: 'rzBootSole', stride: 11.5 }, dx: 30, dy: -2.6, ds: -.035, lag: .36 },
        // glasses, a charcoal knitted cardigan open over a black T-shirt, wide black trousers, pale trainers, a navy backpack
        { person: { coat: 'rhKnit', open: 'rhTee', long: -3.6, legs: 'rhPants', hair: 'hairDark', hat: false, bag: false, glasses: 'frames', carry: 'backpack', carryC: 'rhBag',
            shoe: 'rhShoe', sole: 'rhSole', stride: 11.5 }, dx: 55, dy: .8, ds: 0, lag: .5 }] },
    build: function (L, F, P) {
      var R = rnd(1113), i, x, y;
      // brick in running bond: the courses as fine joints, and enough single bricks a shade off to carry the bond
      var bricks = function (A, x0, y0, w, h, base, dens) {
        A.push(r(x0, y0, w, h, base || 'brick', { shade: grain('brickShade', .26, 'down', 1.4) }));
        for (var by = y0 + 3; by < y0 + h - .5; by += 3) A.push(r(x0, by, w, .45, 'brickJoint', { a: .75 }));
        var n = Math.round(w * h / (dens || 150));
        for (var q = 0; q < n; q++) { var row = Math.floor(R() * Math.floor(h / 3)), bx = x0 + Math.floor(R() * (w / 4.5)) * 4.5 + (row % 2 ? 2.2 : 0), v = R(), bw = Math.min(8.4, x0 + w - bx - .3);
          if (bw > 3) A.push(r(bx + .3, y0 + row * 3 + .5, bw, 2.4, v < .34 ? 'brickLite' : v < .58 ? 'brickPale' : v < .8 ? 'brickWarm' : 'brickShade', { a: .3 + R() * .3 })); }
      };
      // a soldier course: bricks stood on end along the bottom of a band
      var soldiers = function (A, x0, y0, w, h) {
        A.push(r(x0, y0, w, h, 'band', { shade: grain('bandShade', .3, 'down', 1.3) }));
        for (var sx = x0 + 3; sx < x0 + w - .5; sx += 3) A.push(r(sx, y0, .45, h, 'brickJoint', { a: .7 }));
        for (var q = 0; q < w / 14; q++) A.push(r(x0 + Math.floor(R() * (w / 3 - 1)) * 3 + .5, y0 + .3, 2.5, h - .6, R() > .5 ? 'brickLite' : 'brickWarm', { a: .4 }));
        A.push(r(x0, y0, w, .5, 'brickJoint', { a: .8 }));
      };
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .3, 'down', 1.6) }));
      // ---- down the street, left of the corner: a pale block, the orange one beyond it, a pole and its wires ----
      L.push(r(0, 150, 22, 94, 'far2', { shade: grain('far2Shade', .3, 'down') })); for (y = 158; y < 236; y += 12) L.push(r(3, y, 14, 4, 'far2Shade', { a: .7 }));
      L.push(r(14, 84, 34, 160, 'far', { shade: grain('farShade', .3, 'right', 1.3) })); L.push(r(14, 84, 34, 1.4, 'farShade'));
      [[20, 104], [34, 104], [20, 132], [34, 132], [20, 160], [34, 160], [20, 188]].forEach(function (w) { L.push(r(w[0], w[1], 7, 6, 'farWin', { a: .9 })); });
      L.push(line([27, 84, 27, 70, 40, 70], 'farShade', .8)); L.push(r(22, 76, 12, 8, 'farShade', { a: .8 }));       // the stair head on its roof
      L.push(r(7, 96, 2.4, 148, 'poleC')); L.push(r(3, 108, 10, 1.2, 'poleC')); L.push(r(4, 118, 8, 1, 'poleC'));
      [[0, 100, 20, 112, 46, 104], [0, 112, 24, 122, 46, 116], [0, 78, 26, 92, 46, 86]].forEach(function (w) { L.push(line(w, 'wire', .5, { a: .8 })); });
      L.push(r(36, 196, 5, 18, 'farSign', { r: .5 })); L.push(r(37, 199, 3, 2, 'farSignInk', { a: .8 })); L.push(r(37, 204, 3, 2, 'farSignInk', { a: .8 })); L.push(r(37, 209, 3, 2, 'farSignInk', { a: .8 }));   // a yellow parking sign
      // ---- the block: ochre brick, corner to the right edge ----
      bricks(L, BX, 0, 400 - BX, 244);
      L.push(r(BX, 0, 1.6, 244, 'brickLite', { a: .6 }));
      for (i = 0; i < 12; i++) L.push(r(BX + 8 + R() * 340, 126 + R() * 20, .7, 6 + R() * 16, 'stain', { a: .1 }));
      // upstairs, left: a window behind a brown mesh grille
      L.push(r(66, 6, 68, 70, 'frame')); L.push(r(69, 9, 62, 64, 'upGlass', { shade: grain('upGlassShade', .35, 'down', 1.3) }));
      L.push(r(99, 9, 2.2, 64, 'frame')); L.push(poly([78, 9, 90, 9, 74, 44, 69, 44, 69, 30], 'glassLight', { a: .1 }));
      L.push(r(60, 34, 80, 46, 'grille', { shade: grain('grilleLite', .25, 'down') }));
      for (x = 64; x < 138; x += 2.6) L.push(r(x, 38, .4, 38, 'grilleLite', { a: .55 })); for (y = 40; y < 76; y += 2.6) L.push(r(62, y, 76, .4, 'grilleLite', { a: .45 }));
      L.push(r(60, 34, 80, 2.4, 'frame')); L.push(r(60, 77, 80, 3.4, 'frame')); L.push(r(60, 34, 2.4, 46, 'frame')); L.push(r(137.6, 34, 2.4, 46, 'frame')); L.push(r(98.8, 34, 2.4, 46, 'frame'));
      L.push(r(56, 80, 88, 2, 'frameLite')); L.push(r(60, 82, 80, 2, 'shadow', { a: .18 }));
      // upstairs, right: the open balcony, its ceiling hatch and a pipe in the shade
      L.push(r(150, 0, 250, 84, 'recessWall', { shade: [grain('recessShade', .4, 'up', 1.3), grain('recessShade', .2, 'right')] }));
      L.push(r(150, 0, 3, 84, 'recessShade', { a: .7 }));
      for (y = 3; y < 84; y += 3) L.push(r(153, y, 247, .4, 'recessShade', { a: .35 }));
      L.push(r(166, 22, 56, 62, 'frame')); L.push(r(168.4, 24.4, 51.2, 59.6, 'upGlass', { shade: grain('upGlassShade', .4, 'down', 1.3) })); L.push(r(192.9, 24.4, 2.2, 59.6, 'frame'));   // the balcony's sliding door, in the shade
      L.push(r(366, 30, 22, 16, 'ac', { r: .8, shade: grain('acShade', .35, 'down') })); L.push(ring(374, 38, 5, 'acGrille', .7)); L.push(r(366, 46, 22, 38, 'recessShade', { a: .3 }));                     // an AC unit on a bracket
      L.push(r(236, 6, 64, 34, 'hatch', { shade: grain('hatchShade', .35, 'down') })); L.push(r(236, 6, 64, 1, 'hatchShade')); for (x = 244; x < 300; x += 8) L.push(r(x, 7, .4, 32, 'hatchShade', { a: .6 }));
      L.push(r(338, 0, 3, 84, 'pipe', { a: .8 })); L.push(r(340.4, 0, .8, 84, 'pipeShade', { a: .8 }));
      // the balcony band: brick, a steel coping, soldiers along its foot, the white underside
      bricks(L, 142, 84, 258, 30, 'band', 120);
      L.push(r(140, 80, 260, 2.6, 'coping', { shade: grain('copingShade', .3, 'down') })); L.push(r(140, 82.6, 260, 1.6, 'copingShade')); L.push(r(140, 80, 260, .7, 'glassLight', { a: .6 }));
      soldiers(L, 142, 114, 258, 8);
      L.push(r(142, 84, 2, 38, 'brickLite', { a: .7 }));
      L.push(r(144, 122, 256, 5, 'soffit', { shade: grain('soffitShade', .35, 'down') })); L.push(r(144, 127, 256, 5, 'shadow', { a: .16 })); L.push(r(144, 132, 256, 4, 'shadow', { a: .07 }));
      // the round vent caps under it
      [316, 356].forEach(function (vx) { L.push(c(vx, 146, 5, 'vent', { shade: grain('ventDark', .3, 'down') })); L.push(c(vx, 146.6, 3, 'ventDark')); L.push(e(vx, 143.4, 5, 1.6, 'vent')); L.push(e(vx + 1, 152, 5, 1, 'shadow', { a: .14 })); });
      // ---- the door's canopy: a smaller brick-faced slab, a step below the band ----
      bricks(L, 156, 140, 100, 6, 'band', 90); soldiers(L, 156, 146, 100, 8);
      L.push(r(156, 140, 100, .8, 'brickLite', { a: .8 })); L.push(r(156, 140, 1.6, 14, 'brickLite', { a: .7 }));
      L.push(r(158, 154, 98, 4, 'soffit', { shade: grain('soffitShade', .35, 'down') })); L.push(r(158, 158, 98, 4, 'shadow', { a: .18 })); L.push(r(158, 162, 98, 5, 'shadow', { a: .08 }));
      // the brick returns either side of the recess
      L.push(r(DX0 - 10, 158, 10, 86, 'reveal', { a: .35 })); L.push(r(DX1, 158, 6, 86, 'shadow', { a: .1 }));
      // ---- through the doors: the room, deep and warm, globe lamps on cords ----
      L.push(r(DX0, DT, DX1 - DX0, 244 - DT, 'revealShade'));
      L.push(r(DX0 + 4, DT + 8, DX1 - DX0 - 8, 48, 'inDeep', { shade: grain('inWallShade', .4, 'down', 1.3) }));
      L.push(r(DX0 + 4, 206, DX1 - DX0 - 8, 10, 'inFloor', { a: .9 }));
      L.push(r(DX0 + 30, 184, 9, 11, 'inPicFrame')); L.push(r(DX0 + 31.2, 185.2, 6.6, 8.6, 'inPic'));
      [[185, 8], [196, 13], [214, 9], [223, 15]].forEach(function (g) { L.push(r(g[0] - .25, DT + 8, .5, g[1], 'inCord')); L.push(c(g[0], DT + 8 + g[1] + 2, 2.3, 'inLamp')); L.push(c(g[0], DT + 8 + g[1] + 2, 3.6, 'inLampShade', { a: .25 })); });
      // ---- the window left of the door ----
      soldiers(L, LX0 - 4, LT - 9, LX1 - LX0 + 8, 7); L.push(r(LX0 - 4, LT - 2, LX1 - LX0 + 8, 2, 'shadow', { a: .16 }));
      L.push(r(LX0, LT, LX1 - LX0, LB - LT, 'inWall', { shade: grain('inWallShade', .4, 'down', 1.3) }));
      L.push(r(LX0, 214, LX1 - LX0, LB - 214, 'inWood', { shade: grain('inWoodShade', .3, 'down') }));                       // a counter under the glass
      [[76, 9], [92, 14], [118, 8]].forEach(function (g) { L.push(r(g[0] - .25, LT, .5, g[1], 'inCord')); L.push(c(g[0], LT + g[1] + 2, 2.4, 'inLamp')); L.push(c(g[0], LT + g[1] + 2, 3.8, 'inLampShade', { a: .25 })); });
      L.push(r(104, 194, 22, 1.4, 'inShelf')); L.push(r(106, 188, 4, 6, 'inCup')); L.push(r(112, 189, 5, 5, 'inPot')); L.push(r(119, 187, 4, 7, 'inPicFrame'));
      plant(L, 74, 214, .8, 31, { pot: 'inPot', n: 8, tall: 1.5, leaf: 'inLeaf', leaf2: 'inLeaf2', leafShade: 'inLeafShade' });
      bricks(L, LX0 - 4, LB, LX1 - LX0 + 8, 4, 'band', 60); L.push(r(LX0 - 4, LB + 4, LX1 - LX0 + 8, 1.4, 'shadow', { a: .16 }));   // its sill
      // ---- the pier between the doors and the wide window: a steel plate, the plaque, the drainpipe ----
      L.push(r(246, 174, 15, 17, 'steel', { r: .5, shade: grain('steelShade', .3, 'down') })); L.push(r(246, 174, 15, .8, 'glassLight', { a: .6 })); L.push(r(246, 191, 15, 1, 'shadow', { a: .18 }));
      L.push(r(261, 199, 20, 23, 'sign', { r: .6, shade: grain('signShade', .3, 'down') })); L.push(r(261, 222, 20, 1, 'shadow', { a: .2 }));
      ['RAW', 'SUGAR', 'ROAST'].forEach(function (t, k) { L.push({ t: 'text', text: t, x: 271, y: 205.6 + k * 5, size: 4, weight: 800, font: FONT, fill: 'signInk', align: 'center', ls: .04 }); });
      L.push(r(266, 218.6, 10, .9, 'signInk', { r: .4 }));
      pipe(L, 290, 132, 244);
      // ---- the wide window: the room behind it, plants on the sill, someone at a table ----
      soldiers(L, WX0 - 4, WT - 9, WX1 - WX0 + 8, 7); L.push(r(WX0 - 4, WT - 2, WX1 - WX0 + 8, 2, 'shadow', { a: .16 }));
      L.push(r(WX0, WT, WX1 - WX0, WB - WT, 'inWall', { shade: grain('inWallShade', .4, 'down', 1.3) }));
      L.push(r(WX0, WT, 30, WB - WT, 'inDeep', { a: .7 }));
      L.push(r(WX0, 216, WX1 - WX0, WB - 216, 'inWood', { shade: grain('inWoodShade', .3, 'down') }));                       // the long bench along the glass
      [[312, 10], [326, 16], [352, 8], [370, 13], [386, 9]].forEach(function (g) { L.push(r(g[0] - .25, WT, .5, g[1], 'inCord')); L.push(c(g[0], WT + g[1] + 2.2, 2.6, 'inLamp')); L.push(c(g[0], WT + g[1] + 2.2, 4.2, 'inLampShade', { a: .25 })); });
      L.push(r(338, 186, 12, 14, 'inPicFrame')); L.push(r(339.4, 187.4, 9.2, 11.2, 'inPic'));
      L.push(r(372, 206, 18, 1.6, 'inShelf')); L.push(r(380.4, 207.6, 1.2, 9, 'inWoodShade')); L.push(r(375, 202.6, 2.4, 3.4, 'inCup'));
      K.sitter(L, 358, 214, .8, { coat: 'inShirt', legs: 'legsDark', hair: 'inHair', dir: 1, cup: true, rimA: .25 });
      plant(L, 318, 216, 1, 12, { pot: 'inPot', n: 11, tall: 1.6, leaf: 'inLeaf', leaf2: 'inLeaf2', leafShade: 'inLeafShade' });
      plant(L, 334, 216, .7, 19, { pot: 'inPot', n: 7, tall: 1.2, leaf: 'inLeaf2', leaf2: 'inLeaf', leafShade: 'inLeafShade' });
      bricks(L, WX0 - 4, WB, WX1 - WX0 + 8, 5, 'band', 60); L.push(r(WX0 - 4, WB + 5, WX1 - WX0 + 8, 1.6, 'shadow', { a: .16 }));   // its brick sill
      // the window frames: dark bronze, a mullion a third of the way along (back layer, so they sit in the openings and not out with the doors)
      var frame = function (x0, y0, x1, y1, mull) {
        L.push(r(x0, y0, x1 - x0, y1 - y0, 'glassT', { a: .14 })); sheen(L, x0, y0, x1 - x0, y1 - y0, { a: .12, at: .3, street: true, streetA: .07 });
        L.push(r(x0 - 1, y0 - 1, x1 - x0 + 2, 2.6, 'frame')); L.push(r(x0 - 1, y1 - 1.6, x1 - x0 + 2, 2.6, 'frame')); L.push(r(x0 - 1, y0, 2.6, y1 - y0, 'frame')); L.push(r(x1 - 1.6, y0, 2.6, y1 - y0, 'frame'));
        L.push(r(mull - 1.1, y0, 2.2, y1 - y0, 'frame')); L.push(r(mull + 1.1, y0, .6, y1 - y0, 'frameLite', { a: .7 })); L.push(r(x0 + 1.6, y0 + 1.6, x1 - x0 - 3.2, .8, 'shadow', { a: .3 }));
      };
      frame(LX0, LT, LX1, LB, 99); frame(WX0, WT, WX1, WB, 333);
      // ---- the ground: red brick paving against the wall, then the asphalt pavement ----
      L.push(r(0, 244, 400, 56, 'asphalt', { shade: [grain('asphaltShade', .4, 'down', 1.2), grain('asphaltLite', .15, 'up')] }));
      L.push(r(0, 244, 400, 13, 'pave', { shade: grain('paveShade', .3, 'down', 1.3) }));
      var row = 0; for (y = 244; y < 256; y += 3.2, row++) { L.push(r(0, y, 400, .5, 'paveJoint', { a: .5 }));
        for (x = (row % 2) * 5.5; x < 400; x += 11) { L.push(r(x, y, .5, 3.2, 'paveJoint', { a: .4 })); var v = R(); if (v < .2) L.push(r(x + .5, y + .5, 10.5, 2.7, 'paveShade', { a: .3 })); else if (v > .8) L.push(r(x + .5, y + .5, 10.5, 2.7, 'paveLite', { a: .35 })); } }
      L.push(r(0, 257, 400, 1, 'asphaltShade', { a: .7 })); L.push(r(BX, 244, 400 - BX, 2, 'shadow', { a: .14 }));
      for (i = 0; i < 18; i++) L.push(e(R() * 400, 264 + R() * 32, 6 + R() * 18, .5 + R() * .8, R() > .5 ? 'asphaltLite' : 'asphaltShade', { a: .25 }));
      K.manhole(L, 108, 274, 13); L.push(e(286, 284, 2.2, .7, 'lineW', { a: .7 })); L.push(e(232, 270, 1.6, .5, 'lineW', { a: .5 }));
      // ---- the shopfront layer: the timber doors ----
      var wd = function (x0, y0, w, h, k) { F.push(r(x0, y0, w, h, k || 'wood', { shade: grain('woodShade', .32, 'down', 1.3) })); };
      // the door frame, then each leaf: stiles and rails round the glass, a panelled foot
      wd(DX0, DT, DX1 - DX0, 5, 'woodDark'); wd(DX0, DT, 4, 244 - DT, 'woodDark'); wd(DX1 - 4, DT, 4, 244 - DT, 'woodDark');
      [DX0 + 4, 202.5].forEach(function (lx, li) { var lw = 25.5;
        F.push(r(lx + 3.6, DT + 9, lw - 7.2, 44, 'glassT', { a: .16 })); sheen(F, lx + 3.6, DT + 9, lw - 7.2, 44, { a: .14, at: li ? .5 : .2, street: true, streetA: .08 });
        wd(lx, DT + 5, lw, 4.4); wd(lx, DT + 5, 3.8, 244 - DT - 5); wd(lx + lw - 3.8, DT + 5, 3.8, 244 - DT - 5); wd(lx, DT + 52, lw, 6);
        wd(lx + 3.8, DT + 58, lw - 7.6, 244 - DT - 58, 'woodLite');
        F.push(r(lx + 5.6, DT + 61, lw - 11.2, 17, 'woodShade', { a: .45 })); F.push(r(lx + 6.4, DT + 62, lw - 12.8, 15, 'wood', { shade: grain('woodShade', .3, 'down') }));
        wd(lx, 240.6, lw, 3.4, 'woodDark');
        F.push(r(lx, DT + 5, .7, 244 - DT - 5, 'woodLite', { a: .6 })); });
      F.push(r(201, DT + 5, 1.4, 244 - DT - 5, 'woodDark', { a: .8 }));
      F.push(c(206.4, DT + 50, 1.2, 'brass')); F.push(c(197.6, DT + 50, 1.2, 'brass')); F.push(r(205.6, DT + 55, 1.6, 5, 'brass', { r: .6 }));
      // the rubber plant in its white pot, left of the doors
      plant(F, 161, 243, 1, 23, { pot: 'potW', n: 9, tall: 1.7, leaf: 'rubber', leaf2: 'rubber2', leafShade: 'rubberShade', pw: 11, ph: 11 });
    } });
})();
