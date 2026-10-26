/* Scene — et-cultural-coffeehouse. Needs /timeline/lib/last-seen.js and /timeline/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, pavement = K.pavement, contact = K.contact, sheen = K.sheen, pipe = K.pipe, plant = K.plant;
  function arc(cx, cy, rx, ry, a0, a1, n) { var p = []; for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; p.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); } return p; }
  // the Et mark: a rounded serif E (two bowls, like the old ampersand) whose middle arm runs on into the t's crossbar
  function etMark(A, x, y, s) {   // x, y = the centre of the E
    var D = Math.PI / 180, f = 'mark';
    A.push(line(arc(x, y - 3.6 * s, 3.4 * s, 3.4 * s, -35 * D, -270 * D, 14), f, 1.1 * s));          // upper bowl, thin
    A.push(line(arc(x - .2 * s, y - 3.6 * s, 3.2 * s, 3.4 * s, -150 * D, -230 * D, 6), f, 1.7 * s));    // its stressed left side
    A.push(line(arc(x, y + 4 * s, 4.4 * s, 4.2 * s, -90 * D, -325 * D, 18), f, 1.2 * s));             // lower bowl
    A.push(line(arc(x - .3 * s, y + 4 * s, 4.1 * s, 4.2 * s, -140 * D, -230 * D, 8), f, 2.1 * s));      // its stressed left side
    A.push(c(x + 2.8 * s, y - 5.8 * s, .9 * s, f)); A.push(c(x + 3.6 * s, y + 6.6 * s, 1 * s, f));     // ball terminals
    A.push(line([x, y, x + 10.4 * s, y], f, 1 * s));                                                    // middle arm = the t's crossbar
    A.push(line([x + 7 * s, y - 5 * s, x + 7 * s, y + 6 * s], f, 1.6 * s));                             // the t
    A.push(line(arc(x + 9 * s, y + 6 * s, 2 * s, 2.4 * s, 180 * D, 70 * D, 8), f, 1.1 * s));            // its curled foot
    A.push(poly([x + 6.2 * s, y - 5 * s, x + 7.8 * s, y - 6.6 * s, x + 7.8 * s, y - 4 * s], f));        // the angled top
  }
  // tiles in a stack bond; vertical joints squeezed toward the edges when the wall is a curve
  function tiles(A, x, y, w, h, base, shade, lite, o) {
    o = o || {}; var R = rnd(o.seed || 7);
    A.push(r(x, y, w, h, base, { shade: [].concat(o.shade || grain(shade, .28, 'down', 1.6)) }));
    var cols = []; if (o.curve) { for (var i = 0; i <= 24; i++) { var t = -1 + 2 * i / 24; cols.push(x + w / 2 + Math.sin(t * Math.PI / 2.4) / Math.sin(Math.PI / 2.4) * w / 2); } }
    else for (var cx = x; cx <= x + w; cx += o.tw || 8) cols.push(cx);
    for (var yy = y; yy < y + h; yy += 3) { for (var k = 0; k < cols.length - 1; k++) { var v = R(); if (v < .2) A.push(r(cols[k], yy, cols[k + 1] - cols[k] - .3, 2.6, shade, { a: .18 + R() * .16 })); else if (v > .82) A.push(r(cols[k], yy, cols[k + 1] - cols[k] - .3, 2.6, lite, { a: .22 + R() * .2 })); }
      A.push(r(x, yy + 2.7, w, .3, 'joint2', { a: .6 })); }
    cols.forEach(function (cx) { A.push(r(cx, y, .3, h, 'joint2', { a: .45 })); });
  }
  // a black steel window: frame, mullions, the room or the sky in the glass
  function win(A, x, y, w, h, o) {
    o = o || {}; A.push(r(x - 1.4, y - 1.4, w + 2.8, h + 2.8, 'steel'));
    A.push(r(x, y, w, h, o.lit ? 'inGlass' : 'glass', { shade: grain(o.lit ? 'inGlassShade' : 'glassShade', .3, 'down') }));
    if (!o.lit) { A.push(r(x, y, w, h * .35, 'glassSky', { a: .35 })); }
    (o.v || []).forEach(function (f) { A.push(r(x + w * f - .7, y, 1.4, h, 'steel')); }); (o.h || []).forEach(function (f) { A.push(r(x, y + h * f - .7, w, 1.4, 'steel')); });
    sheen(A, x, y, w, h, { a: .12, at: o.at || .2, street: false });
    A.push(r(x - 1.4, y + h + 1.4, w + 2.8, 1.4, 'shadow', { a: .14 }));
  }
  // a window lit from a room at night: the room, a curtain drawn to one side, a lamp, the steel bars again
  function litWin(x, y, w, h, o) {
    o = o || {}; var A = [r(x, y, w, h, 'inRoom', { shade: grain('inRoomShade', .4, 'down', 1.6) }), r(o.left ? x : x + w * .62, y, w * .38, h, 'inCurtain', { a: .9 }), r(x, y + h * .78, w, h * .22, 'inRoomShade', { a: .5 })];
    if (o.lamp) A.push(c(x + w * .3, y + h * .3, 1.4, 'inLamp'));
    (o.v || []).forEach(function (f) { A.push(r(x + w * f - .7, y, 1.4, h, 'steel')); }); A.push({ t: 'halo', x: x + w / 2, y: y + h / 2, rx: w * .9, ry: h * .7, n: 4, fill: 'inRoom', a: .05 });
    return A;
  }
  // board-marked concrete: courses of boards, a tie hole at each corner of a panel
  function concrete(A, x, y, w, h, seed) {
    var R = rnd(seed); A.push(r(x, y, w, h, 'conc', { shade: [grain('concShade', .3, 'down', 1.6), grain('concLite', .12, 'up')] }));
    for (var yy = y + 4; yy < y + h; yy += 4.6) { A.push(r(x, yy, w, .4, 'concLine', { a: .45 })); if (R() > .5) A.push(r(x + R() * w * .8, yy - 4.2, 10 + R() * 30, 4.2, R() > .5 ? 'concShade' : 'concLite', { a: .15 })); }
    for (var tx = x + 8; tx < x + w; tx += 26) for (var ty = y + 9; ty < y + h; ty += 23) A.push(c(tx, ty, .7, 'concLine', { a: .7 }));
  }
  /* ================= Et -THE CULTURAL COFFEEHOUSE- — Shimokitazawa (Sep 12, 15:17) =================
     a four-storey corner block, seen square-on to the corner: rose-brown tile on the floors above, the
     two faces in light and shade, a curved band wrapping the corner with a curved window and the serif Et
     mark, black steel windows with mullions, a base of board-marked concrete with big glass, the name in
     small metal letters, the doors open onto a white room with an arch; a traffic mirror on an orange
     post, a utility pole, wires, a clear blue sky */
  make('et-cultural-coffeehouse', { seed: 905, seenAt: '2026-09-12T15:17:00+09:00',
    place: { en: 'Et', ja: 'エト' }, name: { en: 'Et', ja: 'エト' }, area: { en: 'Shimokitazawa, Tokyo', ja: '東京・下北沢' },
    alt: 'Illustration of Et, THE CULTURAL COFFEEHOUSE in Shimokitazawa: a four-storey corner building in rose-brown tile with a curved band carrying a serif Et mark, black steel windows, and a board-marked concrete ground floor with big glass and open doors onto a white room.',
    palette: { shopGlass: '#3c4651', shopGlassShade: '#2a323b', mistLite: '#f4f6f8', sky: '#bcd3ea', skyShade: '#9fbddc', sunWash: '#ffc58e',
      tileL: '#9b7068', tileLShade: '#7f5850', tileLLite: '#ad8279', tileR: '#bf9387', tileRShade: '#a27a6e', tileRLite: '#d2a99c', tileC: '#b0857a', tileCShade: '#8a6258', tileCLite: '#cfa497', joint2: '#d9c0b7',
      coping: '#3a3634', soffit: '#d9cfc6', soffitShade: '#b3a69a',
      steel: '#1f2124', glass: '#3c4651', glassShade: '#2a323b', glassSky: '#8fb2d4', inGlass: '#e9e3d8', inGlassShade: '#cfc6b6',
      conc: '#c2c0bb', concShade: '#a19f99', concLite: '#d8d6d1', concLine: '#8e8c87', letters: '#e9e7e2', mark: '#f6f3ee',
      inWall: '#f1ede5', inWallShade: '#d8d0c3', inArch: '#e2dbcf', inFloor: '#c9bfae', inCounter: '#f6f3ee', inCounterShade: '#d9d2c5', inLamp: '#ffe6b8', inWood: '#b9895a', inPlant: '#6d8a55', inPlantD: '#4d6a3d', inCup: '#ffffff', inCeil: '#e6e0d6', inRoom: '#f2c27e', inRoomShade: '#c98e4e', inCurtain: '#f7e3bd', inWarm: '#ffd9a0',
      nbW: '#e8e6e1', nbWShade: '#cbc8c1', nbWin: '#5f6d7a', pole: '#a3a29e', poleShade: '#82817c', wire: '#4c4e52', mirrorPost: '#e2722f', mirrorPostShade: '#b85520', mirror: '#d7dde3', mirrorRim: '#e2722f',
      planter: '#9c9a94', plantA: '#6f8a56', plantB: '#89a46a', plantShade: '#506a3f', curb: '#d9d6cf', redRoad: '#b05a4f' },
    light: { shadowAt: [[20, 70], [320, 60]],
      morning: { set: { sky: '#d6e2ec', skyShade: '#bccfdf', glassSky: '#cfdde8', tileR: '#ad8a83', tileRLite: '#c4a29a', tileL: '#a07a72', tileC: '#a8857d', conc: '#c6c7c6' },
        add: { back: [poly([40, 150, 380, 150, 380, 178, 40, 222], 'shadow', { a: .12 }), poly([268, 14, 380, 22, 380, 150, 268, 150], 'shadow', { a: .1 }),
          { t: 'halo', x: 30, y: 190, rx: 70, ry: 30, n: 6, fill: 'mistLite', a: .07 }, { t: 'halo', x: 390, y: 200, rx: 50, ry: 30, n: 6, fill: 'mistLite', a: .07 }, poly([0, 0, 400, 0, 400, 60, 0, 60], 'mistLite', { a: .06 })],
          front: [poly([0, 244, 60, 244, 0, 276], 'shadow', { a: .1 })] } },
      midday: { add: { back: [r(126, 150, 148, 5, 'shadow', { a: .2 })] } },
      golden: { set: { sky: '#efc9a2', skyShade: '#e0a87c', glassSky: '#f3b985', tileR: '#d79a7c', tileRLite: '#eeb592', tileC: '#bf8670', tileCLite: '#e0a587', tileL: '#8e6158', conc: '#cfc1b0' },
          add: { back: [poly([268, 14, 380, 22, 380, 150, 268, 150], 'sunWash', { a: .16 }), r(204, 66, 86, 84, 'sunWash', { a: .12 }), poly([40, 150, 132, 150, 132, 240, 40, 240], 'shadow', { a: .14 }),
            poly([132, 150, 200, 150, 380, 196, 380, 240, 300, 240], 'shadow', { a: .08 }), r(267.6, 14, 1, 136, 'sunWash', { a: .5 })], front: [poly([300, 244, 400, 244, 400, 268], 'shadow', { a: .1 })] } },
      night: { set: { sky: '#111833', skyShade: '#0a1024', glassSky: '#1a2240', glass: '#1b2029', glassShade: '#12161d', tileL: '#2a201e', tileLShade: '#1d1615', tileLLite: '#33282a', tileR: '#3a2c29', tileRShade: '#2a201e', tileRLite: '#463532', tileC: '#33272a', tileCShade: '#251c1c', tileCLite: '#3f3133',
          joint2: '#4a3c38', conc: '#2e2e33', concShade: '#24242a', concLite: '#3a3a40', concLine: '#1c1c20', letters: '#f0e6d2', mark: '#fff4e2', mirrorPost: '#7a3d1c', soffit: '#b59a7c', sun: '#000000', shopGlass: '#c99a5e', shopGlassShade: '#7a5634', inWall: '#f4e2c4', inCeil: '#f7e6c8', nbW: '#2c2f38', nbWShade: '#22252c' },
        add: { back: [].concat(litWin(220, 24, 30, 30, { v: [.5], lamp: true }), litWin(334, 32, 22, 26, { v: [.5] }), litWin(58, 104, 14, 32, { left: true }), litWin(312, 78, 24, 34, { v: [.5], lamp: true }),
            [r(8, 122, 22, 12, 'inRoom', { a: .7 }), r(8, 170, 22, 12, 'inRoom', { a: .55 }), r(380, 168, 20, 30, 'inRoom', { a: .5 })]),
          over: [{ t: 'halo', x: 200, y: 200, rx: 180, ry: 50, n: 6, fill: 'inLamp', a: .045 }, { t: 'halo', x: 200, y: 250, rx: 120, ry: 22, n: 7, fill: 'pool', a: .05 }, { t: 'halo', x: 200, y: 130, rx: 26, ry: 18, n: 5, fill: 'mark', a: .04 },
          { t: 'halo', x: 200, y: 96, rx: 40, ry: 22, n: 5, fill: 'haze', a: .035 }, { t: 'halo', x: 316, y: 36, rx: 26, ry: 18, n: 4, fill: 'haze', a: .03 }] } } },
    breathe: { x: 40, y: 156, w: 340, h: 82 },
    shoppers: [{ keys: [[0, 176], [6, 176], [9, 214], [15, 214], [18, 176]], period: 18, foot: 236, s: .62, coat: 'coatA', legs: 'legsDark', hair: 'hairDark', alpha: .9, shadow: false },
               { keys: [[0, 300], [7, 326], [10, 326], [17, 300], [20, 300]], period: 20, offset: 6, foot: 236, s: .6, coat: 'coatC', legs: 'legsDenim', hair: 'hairBrown', alpha: .85, shadow: false }],
    passersby: [{ start: 5, every: 23, dir: 1, speed: 26, foot: 285, s: 1.24, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', carry: 'backpack', carryC: 'coatD' },
                { start: 14, every: 27, dir: -1, speed: 20, foot: 274, s: 1.12, coat: 'coatA', long: 7, legs: 'legsDark', hair: 'hairBrown', longHair: true, carry: 'tote', carryC: 'coatC' }],
    sig: { emerge: { x: 200, foot0: 234, foot1: 266, s0: .7, s1: 1.24, dur: 1.15 } },
    build: function (L, F, P) {
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .3, 'up', 1.4) }));
      // neighbours: a pale block on the left, low houses and a pole on the right
      L.push(r(0, 60, 44, 184, 'nbW', { shade: grain('nbWShade', .35, 'right') })); for (var ny = 74; ny < 200; ny += 24) { L.push(r(8, ny, 22, 12, 'nbWShade')); L.push(r(9.4, ny + 1.4, 19.2, 9.2, 'nbWin', { shade: grain('glassShade', .3, 'down') })); L.push(r(18.6, ny + 1.4, .8, 9.2, 'nbWShade')); L.push(r(6, ny + 12, 26, 1.4, 'nbWShade')); }
      L.push(r(376, 150, 24, 94, 'nbW', { shade: grain('nbWShade', .35, 'down') })); L.push(r(380, 168, 20, 30, 'nbWin', { a: .8 }));
      // the top floor and its roofline, sloping down on the left face
      L.push(poly([40, 30, 130, 14, 270, 14, 380, 22, 380, 150, 40, 150], 'tileL'));
      tiles(L, 40, 14, 92, 136, 'tileL', 'tileLShade', 'tileLLite', { seed: 11, tw: 7 });
      tiles(L, 268, 14, 112, 136, 'tileR', 'tileRShade', 'tileRLite', { seed: 12, tw: 7, shade: [grain('tileRShade', .22, 'down', 1.6), grain('tileRLite', .12, 'left', 1.4)] });
      tiles(L, 130, 14, 140, 52, 'tileC', 'tileCShade', 'tileCLite', { seed: 13, curve: true, shade: [grain('tileCShade', .3, 'left', 1.6), grain('tileCShade', .2, 'right', 2.4)] });
      L.push(poly([36, 0, 400, 0, 400, 22, 380, 22, 270, 14, 130, 14, 40, 30, 36, 30], 'sky'));                      // sky back over the sloped roof
      L.push(poly([38, 29, 130, 13, 270, 13, 382, 21, 382, 23.4, 270, 15.4, 130, 15.4, 38, 31.4], 'coping'));
      L.push(r(130, 14, 1.2, 136, 'tileLShade', { a: .6 })); L.push(r(268, 14, 1.2, 136, 'tileRLite', { a: .5 }));
      // the curved band wrapping the corner over the first and second floors: its top edge arcs up toward us, the joints
      // crowd toward the sides, the sides fall into shade, and its underside shows as a pale crescent over the base
      tiles(L, 110, 60, 180, 90, 'tileC', 'tileCShade', 'tileCLite', { seed: 14, curve: true, shade: [grain('tileCShade', .5, 'left', 1.3), grain('tileCShade', .36, 'right', 1.8), grain('tileCLite', .12, 'up', 2)] });
      (function () {   // give the floor above back its wall where the band's arc falls away at the sides
        function yAt(x) { var t = (x - 200) / 90; return 66 - 5.4 * Math.sqrt(Math.max(0, 1 - t * t)); }
        [[110, 130, 'tileL'], [130, 270, 'tileC'], [270, 290, 'tileR']].forEach(function (s) { var pts = [s[0], 59.4]; for (var x = s[0]; x <= s[1] + .01; x += (s[1] - s[0]) / 10) pts.push(x, yAt(x)); pts.push(s[1], 59.4); L.push(poly(pts, s[2])); });
      })();
      L.push(line(arc(200, 66, 90, 5.4, Math.PI, 2 * Math.PI, 24), 'coping', 1.6)); L.push(line(arc(200, 67.4, 90, 5.4, Math.PI, 2 * Math.PI, 24), 'tileCLite', .7, { a: .7 }));
      L.push(poly(arc(200, 64.6, 90, 5.4, Math.PI, 2 * Math.PI, 24).concat(arc(200, 62.6, 90, 5.4, 2 * Math.PI, Math.PI, 24)), 'shadow', { a: .18 }));
      L.push(r(110, 66, 5, 84, 'tileCShade', { a: .4 })); L.push(r(285, 66, 5, 84, 'tileCShade', { a: .3 })); L.push(r(204, 66, 30, 84, 'tileCLite', { a: .12 }));
      // windows: the top floor strip, the side faces, the curved window in the band
      win(L, 150, 24, 30, 30, { v: [.5] }); win(L, 220, 24, 30, 30, { v: [.5] }); win(L, 292, 30, 22, 26, { v: [.5] }); win(L, 334, 32, 22, 26, { v: [.5] });
      win(L, 58, 52, 14, 32, {}); win(L, 58, 104, 14, 32, {}); win(L, 312, 78, 24, 34, { v: [.5], at: .4 }); win(L, 346, 78, 22, 34, { v: [.5], at: .4 });
      (function () { var top = arc(200, 84, 34, 2.4, Math.PI, 2 * Math.PI, 16), bot = arc(200, 116, 34, 2.4, 0, Math.PI, 16);
        L.push(poly(arc(200, 82.6, 35.6, 2.6, Math.PI, 2 * Math.PI, 16).concat(arc(200, 117.4, 35.6, 2.6, 0, Math.PI, 16)), 'steel'));
        L.push(poly(top.concat(bot), 'glass', { shade: grain('glassShade', .3, 'down') })); L.push(poly(top.concat(arc(200, 96, 34, 2.4, 0, Math.PI, 16)), 'glassSky', { a: .35 }));
        L.push(poly([178, 83, 190, 83, 176, 116, 166, 116], 'glassLight', { a: .1 })); L.push(r(199.3, 84, 1.4, 32, 'steel'));
        L.push(r(166, 119, 68, 1.6, 'shadow', { a: .14 })); })();
      etMark(L, 194, 132, 1.4);
      // underside of the curved band, catching light from the street

      // the concrete base: board-marked, big black-framed glass, the open doors
      concrete(L, 40, 150, 340, 90, 51);
      L.push(r(40, 150, 92, 90, 'shadow', { a: .1 }));   // the left face in shade
      L.push(poly(arc(200, 150.6, 90, 5.4, Math.PI, 2 * Math.PI, 24).concat([290, 150, 290, 153.6, 110, 153.6, 110, 150]), 'soffit', { shade: grain('soffitShade', .4, 'up') }));
      L.push(r(110, 153.6, 180, 2.4, 'shadow', { a: .2 }));
      // inside: a white room — an arched niche, a white counter, lamps, a plant, the ceiling
      [[56, 156, 66, 40], [56, 204, 66, 32], [150, 156, 100, 42], [276, 158, 40, 78], [330, 158, 36, 78]].forEach(function (b) { L.push(r(b[0], b[1], b[2], b[3], 'inWall', { shade: grain('inWallShade', .3, 'down', 1.8) })); L.push(r(b[0], b[1], b[2], 5, 'inCeil')); });
      L.push(r(176, 208, 48, 30, 'inWall', { shade: grain('inWallShade', .3, 'down', 1.8) })); L.push(r(176, 230, 48, 8, 'inFloor'));
      L.push(r(190, 210, 22, 22, 'inArch', { r: [11, 11, 0, 0], shade: grain('inWallShade', .4, 'down') })); L.push(r(193, 213, 16, 19, 'inWallShade', { r: [8, 8, 0, 0], a: .5 })); L.push(r(199, 222, 4, 4, 'inWood'));
      L.push(r(180, 218, 12, 18, 'inCounter', { shade: grain('inCounterShade', .4, 'right') })); L.push(r(181, 215.6, 3, 2.4, 'inCup'));
      [[180, 158], [220, 158], [80, 158], [296, 160], [348, 160]].forEach(function (p) { L.push(c(p[0], p[1] + 2, 2.2, 'inLamp')); L.push(g(p[0], p[1] + 5, 8, 'inLamp', { d: .22, sy: .6 })); });
      L.push(r(160, 184, 40, 2, 'inWood')); L.push(r(166, 178, 4, 6, 'inCup')); L.push(r(176, 179, 5, 5, 'inWood')); L.push(r(232, 176, 10, 22, 'inArch', { r: [5, 5, 0, 0] }));
      plant(L, 300, 234, 1.2, 81, { pot: 'inCounter', n: 9, tall: 1.6, leaf: 'inPlant', leaf2: 'plantB', leafShade: 'inPlantD' });
      K.sitter(L, 98, 222, .7, { coat: 'coatD', legs: 'legsDark', hair: 'hairDark', dir: -1, cup: true });
      L.push(r(84, 222, 26, 2, 'inWood')); L.push(r(88, 224, 1.4, 12, 'inWood')); L.push(r(104, 224, 1.4, 12, 'inWood')); L.push(r(92, 216, 6, 6, 'inCup'));
      pavement(L, F, { seed: 9050, stains: 3, grate: [250, 246, 46], manhole: [90, 290, 15] });
      // facade: black steel frames over the glass, the name in metal letters, the open doors
      [[56, 156, 66, 40, [.5]], [56, 204, 66, 32, [.5]], [150, 156, 100, 42, [.5]], [276, 158, 40, 78, [], [.5]], [330, 158, 36, 78, [], [.5]]].forEach(function (b) {
        F.push(r(b[0], b[1], b[2], b[3], 'shopGlass', { a: .26 })); F.push(r(b[0], b[1] + b[3] * .72, b[2], b[3] * .28, 'shopGlassShade', { a: .18 })); sheen(F, b[0], b[1], b[2], b[3], { a: .14, at: .25 });
        F.push(r(b[0] - 1.6, b[1] - 1.6, b[2] + 3.2, 1.8, 'steel')); F.push(r(b[0] - 1.6, b[1] + b[3] - .2, b[2] + 3.2, 1.8, 'steel')); F.push(r(b[0] - 1.6, b[1] - 1.6, 1.8, b[3] + 3.2, 'steel')); F.push(r(b[0] + b[2] - .2, b[1] - 1.6, 1.8, b[3] + 3.2, 'steel'));
        b[4].forEach(function (f) { F.push(r(b[0] + b[2] * f - .7, b[1], 1.4, b[3], 'steel')); }); (b[5] || []).forEach(function (f) { F.push(r(b[0], b[1] + b[3] * f - .7, b[2], 1.4, 'steel')); }); });
      F.push({ t: 'text', text: 'THE CULTURAL COFFEEHOUSE', x: 200, y: 205, size: 4.4, weight: 600, font: FONT, fill: 'letters', align: 'center', ls: .5, glow: 'signGlow', blur: 2 });
      F.push(r(174, 207.4, 52, 1.6, 'steel')); F.push(r(174, 207.4, 1.8, 31, 'steel')); F.push(r(224.2, 207.4, 1.8, 31, 'steel'));
      F.push(poly([175.8, 209, 184, 212, 184, 236, 175.8, 238.4], 'steel')); F.push(poly([177.4, 211.4, 182.6, 213.4, 182.6, 233.6, 177.4, 235.6], 'glass', { a: .5 }));
      F.push(poly([224.2, 209, 216, 212, 216, 236, 224.2, 238.4], 'steel')); F.push(poly([222.6, 211.4, 217.4, 213.4, 217.4, 233.6, 222.6, 235.6], 'glass', { a: .5 }));
      F.push(r(40, 238, 340, 3, 'concShade')); F.push(r(176, 238, 48, 3, 'conc'));
      pipe(F, 104, 22, 150); F.push(r(268, 150, 1, 88, 'concShade', { a: .6 }));
      // a small bench with a coffee drinker by the planter
      F.push(r(290, 226, 24, 2.4, 'inWood')); F.push(r(292, 228, 1.6, 10, 'steel')); F.push(r(310, 228, 1.6, 10, 'steel')); contact(F, 302, 239, 14, .18);
      K.sitter(F, 300, 226, .7, { coat: 'coatC', legs: 'legsDenim', hair: 'hairBrown', dir: -1, cup: true });
      // the planter at the right corner
      F.push(r(318, 236, 58, 8, 'planter', { shade: grain('concShade', .4, 'down') })); K.crown(F, [[326, 232, 7], [340, 228, 9], [356, 232, 8], [370, 230, 6]], ['plantA', 'plantB'], 'plantShade');
      // the traffic mirror on its orange post, the utility pole, the wires
      P.push(r(24, 120, 3, 136, 'mirrorPost', { shade: grain('mirrorPostShade', .4, 'right') })); P.push(r(24, 160, 3, 2, 'curb')); P.push(r(24, 186, 3, 2, 'curb'));
      P.push(c(25.5, 112, 12, 'mirrorRim')); P.push(c(25.5, 112, 10.4, 'mirror', { shade: grain('glassShade', .3, 'br') })); P.push(e(22, 108, 5, 3, 'glassLight', { a: .5, rot: -.6 })); P.push(r(18, 110, 15, 3, 'tileC', { a: .25 })); contact(P, 25.5, 256, 6, .2);
      P.push(r(384, 0, 6, 250, 'pole', { shade: grain('poleShade', .45, 'right', 1.3) })); P.push(r(372, 20, 30, 2, 'pole')); P.push(r(376, 40, 22, 1.6, 'pole')); contact(P, 387, 250, 7, .2);
      P.push(line([0, 40, 120, 52, 260, 46, 384, 22], 'wire', .5, { a: .8 })); P.push(line([0, 58, 140, 66, 260, 60, 384, 42], 'wire', .45, { a: .7 })); P.push(line([390, 22, 400, 24], 'wire', .5));
    } });
})();
