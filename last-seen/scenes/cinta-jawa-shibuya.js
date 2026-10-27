/* Scene — cinta-jawa-shibuya. Needs /timeline/lib/last-seen.js and /timeline/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, pavement = K.pavement, contact = K.contact, sheen = K.sheen, vending = K.vending, ac = K.ac, pipe = K.pipe, plant = K.plant;
  /* ================= Cinta Jawa Cafe — Kokusai Building, Udagawacho, Shibuya (Oct 27, 19:30, cloudy) =================
     the Kokusai Building seen across the brick-paved lane: white tile walls with deep green-framed bay windows on
     the third and fourth floors, a grey slate roof band under a thick green eave, the set-back top floor behind its
     green railing; the second-floor terrace in a black steel frame hung with clear curtains and festoon lights; the
     shops and the KOKUSAI BLD. entrance at the street, brick steps up to a red door on the right. Cinta Jawa's tall
     banner hangs between the fourth-floor bays and its chalkboard stands on the pavement. An overcast evening sky. */
  var B0 = 44, B1 = 318, W0 = 318, W1 = 372, PEN0 = 80, PEN1 = 300;
  var TOP = 26, ROOF = 58, EAVE = 74, F4 = 78, F3 = 112, F2 = 146, SLAB = 176, SIGN = 182, SHOP = 188, ST = 216;
  var BAYS = [[56, 54], [138, 56], [222, 56]];
  function bay(L, x, y, w, h, lit, R, fan) {   // a green-framed box bay: a deep frame, angled side lights, three panes, a hood and a sill
    L.push(r(x + 2.4, y + h + 1.6, w, 4, 'shadow', { a: .22 })); L.push(r(x + 2.4, y + h + 1.6, w, 1.6, 'shadow', { a: .14 })); L.push(r(x + w + 1.2, y + 1, 3, h + 4, 'shadow', { a: .16 }));
    L.push(r(x, y, w, h, 'green', { shade: grain('greenShade', .4, 'down', 1.4) }));
    L.push(poly([x + 2, y + 2.6, x + 7, y + 4, x + 7, y + h - 4, x + 2, y + h - 2.6], lit ? 'winLit2' : 'glass2', { shade: grain(lit ? 'winLit' : 'glassShade', .3, 'down') }));   // the angled side lights, turning away
    L.push(poly([x + w - 7, y + 4, x + w - 2, y + 2.6, x + w - 2, y + h - 2.6, x + w - 7, y + h - 4], lit ? 'winLit2' : 'glass2', { shade: grain(lit ? 'winLit' : 'glassShade', .4, 'down') }));
    L.push(r(x + w - 7, y + 4, 5, h - 8, 'shadow', { a: .14 }));
    var fx = x + 8.4, fw = w - 16.8, fy = y + 2.6, fh = h - 5.2;
    L.push(r(fx, fy, fw, fh, lit ? 'winLit' : 'glass', { shade: grain(lit ? 'winLit2' : 'glassShade', .35, 'down', 1.5) }));
    if (!lit) { L.push(r(fx, fy, fw, fh * .3, 'blind', { a: .55 })); for (var bl = fy + 1.2; bl < fy + fh * .3; bl += 1.6) L.push(r(fx, bl, fw, .4, 'glassShade', { a: .25 }));
      L.push(poly([fx + fw * .5, fy + fh * .3, fx + fw, fy + fh * .3, fx + fw, fy + fh * .75], 'reflectSky', { a: .3 })); }
    else { L.push(r(fx, fy, fw, 2.2, 'inLamp', { a: .6 }));
      if (fan) [fx + fw * .3, fx + fw * .72].forEach(function (cx) { L.push(r(cx - .3, fy, .6, 3.4, 'inDark', { a: .7 })); L.push(e(cx, fy + 3.8, 5.2, .9, 'inDark', { a: .55 })); L.push(c(cx, fy + 5.6, 1.4, 'inLamp')); });   // rattan fans, a lamp under each
      for (var q = fx + 3; q < fx + fw - 4; q += 9) L.push(r(q + R() * 3, fy + fh - 6 - R() * 3, 4, 6, 'inDark', { a: .35 })); }
    L.push(r(fx + fw / 3 - .7, fy, 1.6, fh, 'green')); L.push(r(fx + fw * 2 / 3 - .7, fy, 1.6, fh, 'green'));     // mullions
    L.push(r(fx, fy + fh * .3, fw, 1.4, 'green')); L.push(r(x + 6.6, y + 2, 1.8, h - 4, 'greenShade')); L.push(r(x + w - 8.4, y + 2, 1.8, h - 4, 'greenShade'));
    L.push(r(x - 1.8, y - 2.4, w + 3.6, 3, 'green', { shade: grain('greenShade', .3, 'down') })); L.push(r(x - 1.8, y - 2.4, w + 3.6, .8, 'greenLite'));   // the hood
    L.push(r(x - 1.8, y + h - .6, w + 3.6, 3, 'green', { shade: grain('greenShade', .45, 'down') })); L.push(r(x - 1.8, y + h - .6, w + 3.6, .7, 'greenLite', { a: .8 }));   // the sill
    L.push(r(x, y, 1, h, 'rim', { a: .35 }));
  }
  make('cinta-jawa-shibuya', { seed: 1027, seenAt: '2026-10-27T19:30:00+09:00',
    place: { en: 'Cinta Jawa Cafe', ja: 'チンタジャワカフェ' }, name: { en: 'Cinta Jawa Cafe', ja: 'チンタジャワカフェ' }, area: { en: 'Shibuya, Tokyo', ja: '東京・渋谷' },
    alt: 'Illustration of the Kokusai Building in Udagawacho, Shibuya, under an overcast sky: white tile walls with green-framed bay windows, a grey slate roof band under a green eave, a second-floor terrace in a black steel frame with festoon lights, shops and the KOKUSAI BLD. entrance at the street, brick steps to a red door, the tall Cinta Jawa banner between the fourth-floor windows and its chalkboard on the brick pavement.',
    palette: { sunWash: '#ffd3a6', sky: '#d3d6d9', skyShade: '#c2c6ca', cloud: '#e2e3e3', cloudShade: '#c5c9cd', cloudLite: '#ececea', cloudDark: '#b7bcc2', skyBreak: '#dcdcd9', coolWash: '#b4c8dc',
      tile: '#e9e5dd', tileShade: '#cfcac0', tileLine: '#d3cec5', tileLite: '#f4f1ea',
      green: '#2f5a47', greenShade: '#224435', greenLite: '#4f7a64',
      slate: '#7b7f86', slateShade: '#62666d', slateLine: '#5b5f66', slateLite: '#959aa1',
      pent: '#d9d1c2', pentShade: '#bfb6a6', pentLine: '#c6bdae', penGlass: '#4c5a62',
      glass: '#5d6b73', glass2: '#4f5c64', glassShade: '#3a454c', reflectSky: '#cdd4d9', blind: '#e8e2d4', winLit: '#5d6b73', winLit2: '#4f5c64',
      steel: '#2a2b2d', steelLite: '#55575a', vinyl: '#d8dcdc', inTerr: '#8a7a68', inTerr2: '#6f604f', bulb: '#f2e4c0', bulbWire: '#3a3836',
      inShop: '#ece2cc', inShop2: '#c9b48e', inShopD: '#a38c6a', inLamp: '#fff0d0', inDark: '#5a4636', inShelfA: '#c86450', inShelfB: '#5d7ea6', inShelfC: '#e0b65a', inLobby: '#d9cdb7', inLobbyD: '#a99a82',
      sign: '#24496b', signInk: '#f2efe6', signB: '#2f8f86', granite: '#a88f84', graniteShade: '#8c7469', graniteLite: '#c4aca0',
      redDoor: '#b8463a', redDoorShade: '#94352b', poster: '#e8d9b8', posterB: '#d27c56', posterC: '#6d8fb0', ink: '#4a4540',
      brick: '#b39182', brickShade: '#9a786a', brickLine: '#8f6f62', brickLite: '#c7a798', step: '#a8806f', stepShade: '#8a6556', stepLite: '#c49f8e',
      stone: '#b99a8c', stoneShade: '#a28377', joint: '#97796c', stoneLight: '#cbb0a3', kerb: '#9f8174', stain: '#86675b',
      tyre: '#2b2b2d', bikeFrame: '#3e5f7a', bikeMetal: '#9ea3a8', bikeSeat: '#2f2f31', bikeBasket: '#3d4045', bikeCover: '#5a6358',
      nbrL: '#bdb6aa', nbrLShade: '#a49c8f', nbrLWin: '#66716f', nbrR: '#4b4f55', nbrRShade: '#3a3d42', nbrRLine: '#2e3135', nbrRLite: '#8a929b',
      cj: '#f1e4c4', cjShade: '#d9c79f', cjRed: '#8e1f1c', cjRed2: '#c2412b', cjInk: '#7a1816', board: '#2e3330', boardShade: '#1f2321', boardInk: '#efe7d6', boardFrame: '#8a6644',
      foodA: '#c8823e', foodB: '#d9b25a', foodC: '#9a4a2e', bollard: '#a9adb0', bollardShade: '#83878a', lampGlass: '#f1ece0',
      vend: '#ebe9e3', nikoHoodie: '#c29f7a', nikoCap: '#7a5538', nikoPants: '#292726', nikoString: '#efe4d2' },
    light: { noShadows: true,
      morning: { set: { sky: '#c6d4e1', skyShade: '#adbfd0', cloud: '#e3eaf1', cloudShade: '#bccad7', cloudLite: '#f5f8fb', cloudDark: '#a2b2c3', skyBreak: '#f3eee2', sunWash: '#fff1d6', coolWash: '#b4c8dc',
          stone: '#b49c95', stoneShade: '#9c847d', joint: '#917a73', stoneLight: '#c8b3ad', brick: '#ab958e', brickLite: '#c1aea8', tile: '#e2e6e8', tileLite: '#f2f5f6', tileShade: '#c6ccd0', pent: '#d6d4cd', glass: '#5a6d7b', reflectSky: '#dbe6ef', green: '#2b5a4f', nikoHoodie: '#bc9d7e', nikoCap: '#74553b' },
        add: { back: [r(0, 0, 400, 300, 'coolWash', { a: .08 }), r(W0, EAVE, W1 - W0, ST - EAVE, 'shadow', { a: .06 })] } },
      midday: { add: { back: [r(B0, EAVE + 4, B1 - B0, 3, 'shadow', { a: .16 }), r(0, ST - 2, 400, 3, 'shadow', { a: .1 })] } },
      golden: { set: { sky: '#d9c2b0', skyShade: '#c9ab96', cloud: '#e8d1bd', cloudShade: '#c8a993', cloudLite: '#f6dcc0', cloudDark: '#b39484', skyBreak: '#f7c98f', sunWash: '#ffc58e',
          stone: '#cf9f84', stoneShade: '#b4836a', joint: '#a8775f', stoneLight: '#e2b498', tile: '#f0dcc4', tileLite: '#fbe9d2', tileShade: '#d6b99c', pent: '#e6cdb0', slate: '#857a78', slateLite: '#b19a8a',
          glass: '#6b6670', reflectSky: '#f1c8a2', green: '#3a5a44', greenLite: '#7f8a5e', brick: '#c98f72', inShop: '#f6d9aa', nikoHoodie: '#cfa278', nikoCap: '#80583a' },
        add: { back: [r(0, 0, 400, 96, 'sunWash', { a: .2 }), r(0, 96, 400, 120, 'sunWash', { a: .1 }), r(0, 28, PEN0 - 2, 10, 'skyBreak', { a: .55 }), r(PEN1 + 2, 28, W1 - PEN1 - 2, 10, 'skyBreak', { a: .55 }), r(0, 31, PEN0 - 2, 3, 'skyBreak', { a: .6 }), r(PEN1 + 2, 31, W1 - PEN1 - 2, 3, 'skyBreak', { a: .6 }), r(0, 0, 400, TOP - 2, 'skyBreak', { a: .12 }), r(0, 60, B0, 36, 'skyBreak', { a: .35 }),
            r(B0, EAVE, 2, ST - EAVE, 'rim', { a: .45 }), r(B0 - 6, EAVE - 1, B1 - B0 + 12, 1, 'rim', { a: .7 }), r(PEN0 - 2, TOP - 2, PEN1 - PEN0 + 4, 1, 'rim', { a: .7 }), r(B0 - 2, SLAB, W1 - B0 + 4, 1, 'rim', { a: .5 }), poly([0, 216, 160, 216, 60, 300, 0, 300], 'sunWash', { a: .08 })],
          over: [{ t: 'halo', x: 30, y: 34, rx: 120, ry: 16, n: 6, fill: 'skyBreak', a: .05 }] } },
      night: { set: { sky: '#1a1c28', skyShade: '#13151f', cloud: '#2a2830', cloudShade: '#1f1f28', cloudLite: '#40353a', cloudDark: '#17171f', skyBreak: '#2a2830', sunWash: '#000000',
          tile: '#2c2b2e', tileShade: '#222125', tileLine: '#252428', tileLite: '#38363a', green: '#17271f', greenShade: '#101b15', greenLite: '#26392e',
          slate: '#1f2026', slateShade: '#17181d', slateLine: '#141519', slateLite: '#2c2d33', pent: '#2a2826', pentShade: '#201e1d', pentLine: '#24221f', penGlass: '#e8c287',
          glass: '#151a24', glass2: '#121620', glassShade: '#0c1018', reflectSky: '#222a38', blind: '#2a2722', winLit: '#f3c47c', winLit2: '#e2ac62',
          steel: '#0d0d0e', steelLite: '#2a2a2c', vinyl: '#ffd9a0', inTerr: '#b9874f', inTerr2: '#8e6238', bulb: '#ffe7b0', bulbWire: '#141312',
          sign: '#1d3d5c', signInk: '#fff1d6', signB: '#2aa79b', granite: '#2a2321', graniteShade: '#1f1a19', graniteLite: '#3a302c', redDoor: '#5e2520', redDoorShade: '#451b17', ink: '#d9c9a8',
          brick: '#2c2222', brickShade: '#221a1a', brickLine: '#1a1414', brickLite: '#3a2d2b', step: '#2e2423', stepShade: '#1f1817', stepLite: '#45352f',
          stone: '#2a2121', stoneShade: '#211a1a', joint: '#1a1414', stoneLight: '#352a28', kerb: '#241c1c', stain: '#150f0f',
          nbrL: '#25262c', nbrLShade: '#1c1d22', nbrLWin: '#e0b877', nbrR: '#16181e', nbrRShade: '#101217', nbrRLine: '#0b0c10', nbrRLite: '#d9b06e',
          cj: '#e9d7ae', cjShade: '#c4ad80', cjRed: '#7a1a18', cjRed2: '#a8382a', board: '#1c201e', boardShade: '#121514', boardInk: '#e6dcc6', boardFrame: '#4e3a27',
          bollard: '#3a3d40', bollardShade: '#2a2c2e', lampGlass: '#ffe3ad', nikoHoodie: '#4d3c2d', nikoCap: '#33231a', foodA: '#b8733a', foodB: '#c99a4a', foodC: '#8a4028', poster: '#c9b58c', posterB: '#b86a45', posterC: '#5a7390', inShop2: '#c9a26e', nikoPants: '#0f0e0e', nikoString: '#a8977f' },
        add: { over: [{ t: 'halo', x: 112, y: 200, rx: 70, ry: 12, n: 7, fill: 'inLamp', a: .04 }, { t: 'halo', x: 180, y: 160, rx: 140, ry: 20, n: 6, fill: 'bulb', a: .06 },
          { t: 'halo', x: 125, y: 110, rx: 16, ry: 44, n: 5, fill: 'cj', a: .06 }, { t: 'halo', x: 123, y: 258, rx: 30, ry: 12, n: 6, fill: 'pool', a: .035 },
          { t: 'halo', x: 200, y: 20, rx: 260, ry: 40, n: 6, fill: 'haze', a: .035 }, { t: 'halo', x: 200, y: 218, rx: 40, ry: 5, n: 6, fill: 'pool', a: .04 }] } } },
    breathe: { x: 184, y: SHOP, w: 32, h: ST - SHOP, c: 'breathe', a: .05 },
    shoppers: [{ keys: [[0, 60], [9, 160], [12, 160], [21, 60]], period: 21, foot: 215, s: .4, coat: 'coatC', legs: 'legsDark', hair: 'hairBrown', alpha: .95, shadow: false },
               { keys: [[0, 300], [7, 236], [10, 236], [17, 300]], period: 17, offset: 6, foot: 216, s: .4, coat: 'coatA', legs: 'legsDenim', hair: 'hairDark', alpha: .95, shadow: false }],
    passersby: [{ start: 7, every: 25, dir: -1, speed: 23, foot: 285, s: 1.24, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', carry: 'backpack', carryC: 'coatD' },
                { start: 16, every: 28, dir: 1, speed: 20, foot: 277, s: 1.14, coat: 'coatA', long: 6, legs: 'legsDark', hair: 'hairBrown', longHair: true, carry: 'tote', carryC: 'coatC' }],
    sig: { emerge: { x: 200, foot0: 217, foot1: 264, s0: .44, s1: 1.24, dur: 1.3 },
      person: { hood: true, coat: 'nikoHoodie', hat: false, ballcap: 'nikoCap', legs: 'nikoPants', string: 'nikoString' } },
    build: function (L, F, P) {
      var R = rnd(29), i, x, y;
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .25, 'down', 1.6) }));
      // an overcast sky: a low ceiling of soft cloud banks, darker underneath, a paler seam between them
      L.push(r(0, 30, 400, 6, 'skyBreak', { a: .5 }));
      [[60, 8, [[0, 0, 70, 12], [-50, 8, 40, 9], [60, 6, 46, 9], [110, 2, 34, 8]]], [250, 4, [[0, 0, 80, 12], [70, 6, 50, 10], [-60, 8, 36, 8], [140, 0, 40, 10]]],
       [20, 46, [[0, 0, 30, 9], [24, 6, 22, 7], [-8, 14, 26, 8]]], [26, 80, [[0, 0, 26, 7], [18, 5, 16, 6]]], [390, 40, [[0, 0, 24, 9]]]].forEach(function (cl) {
        var cs = cl[2].map(function (q) { return [cl[0] + q[0], cl[1] + q[1], q[2], q[3]]; });
        L.push({ t: 'blob', clumps: cs.map(function (q) { return [q[0], q[1] + q[3] * .45, q[2] * .96, q[3] * .7]; }), fill: 'cloudDark', a: .7 });
        L.push({ t: 'blob', clumps: cs, fill: 'cloud', shade: grain('cloudShade', .45, 'down', 1.5), inner: [{ clumps: cs.map(function (q) { return [q[0] - q[2] * .12, q[1] - q[3] * .35, q[2] * .7, q[3] * .45]; }), fill: 'cloudLite' }] }); });
      // the older neighbour on the left: stacked windows, an AC unit, a drainpipe
      L.push(r(0, 96, B0, ST - 96, 'nbrL', { shade: grain('nbrLShade', .35, 'down', 1.4) })); L.push(r(0, 94, B0 + 2, 3, 'nbrLShade'));
      for (y = 104; y < 176; y += 22) for (x = 4; x < B0 - 12; x += 18) { var lw = R() > .55; L.push(r(x, y, 13, 12, lw ? 'winLit' : 'nbrLWin')); L.push(r(x, y + 11.4, 13, 1.4, 'nbrLShade')); if (!lw) L.push(r(x, y, 13, 3, 'reflectSky', { a: .25 })); L.push(r(x + 6.2, y, .8, 12, 'nbrLShade')); }
      ac(L, 6, 152, 16); pipe(L, B0 - 6, 98, ST);
      vending(L, 8, ST, { w: 17, h: 31, seed: 7 });
      L.push(r(B0 - 3, 96, 3, ST - 96, 'shadow', { a: .16 }));
      // the tall dark neighbour on the right, running out of the frame
      L.push(r(W1, 0, 400 - W1, ST, 'nbrR', { shade: grain('nbrRShade', .4, 'right', 1.4) }));
      for (y = 6; y < ST - 30; y += 15) { L.push(r(W1 + 4, y, 400 - W1 - 4, 9, 'nbrRLine')); for (x = W1 + 5; x < 398; x += 7) if (R() > .55) L.push(r(x, y + 1, 5.4, 7, 'nbrRLite', { a: .25 + R() * .3 })); }
      L.push(r(W1, 0, 2, ST, 'shadow', { a: .25 }));
      // the set-back top floor: a cream parapet with grooves, dark glass behind a green railing
      L.push(r(PEN0, TOP, PEN1 - PEN0, 14, 'pent', { shade: grain('pentShade', .35, 'down', 1.4) })); L.push(r(PEN0 - 2, TOP - 2, PEN1 - PEN0 + 4, 2.4, 'tileLite'));
      for (y = TOP + 3.5; y < TOP + 14; y += 3.5) L.push(r(PEN0, y, PEN1 - PEN0, .6, 'pentLine'));
      L.push(r(PEN0, TOP + 14, PEN1 - PEN0, ROOF - TOP - 14, 'penGlass', { shade: grain('glassShade', .4, 'down') }));
      for (x = PEN0 + 20; x < PEN1; x += 28) L.push(r(x, TOP + 14, 2, ROOF - TOP - 14, 'pentShade'));
      L.push(r(PEN0, TOP + 14, PEN1 - PEN0, 2, 'shadow', { a: .3 }));
      L.push(r(PEN0 - 4, ROOF - 13, PEN1 - PEN0 + 8, 1.6, 'green')); L.push(r(PEN0 - 4, ROOF - 3, PEN1 - PEN0 + 8, 1.2, 'green'));
      for (x = PEN0 - 4; x <= PEN1 + 4; x += 3.2) L.push(r(x, ROOF - 12, .7, 10, 'green'));
      L.push(r(PEN0 - 4, ROOF - 13, PEN1 - PEN0 + 8, .5, 'greenLite'));
      L.push(r(PEN0 - 6, ROOF - 1.6, PEN1 - PEN0 + 12, 2, 'tile'));
      // the slate roof band: courses of grey slate between a green ridge and a thick green eave
      L.push(poly([PEN0 - 6, ROOF, PEN1 + 6, ROOF, B1 + 4, EAVE, B0 - 4, EAVE], 'slate', { shade: [grain('slateShade', .35, 'down', 1.4), grain('slateLite', .1, 'up')] }));
      for (y = ROOF + 2.6; y < EAVE; y += 2.6) { var k0 = (y - ROOF) / (EAVE - ROOF), xa = PEN0 - 6 + (B0 - 4 - PEN0 + 6) * k0, xb = PEN1 + 6 + (B1 + 4 - PEN1 - 6) * k0;
        L.push(r(xa, y, xb - xa, .5, 'slateLine', { a: .7 })); for (x = xa + ((y / 2.6) % 2) * 3; x < xb; x += 6) L.push(r(x, y - 2.1, .4, 2.1, 'slateLine', { a: .4 })); }
      L.push(r(PEN0 - 6, ROOF, PEN1 - PEN0 + 12, 1.4, 'green'));
      // the right wing, a step back and a step lower, its own short slate roof
      L.push(r(W0, EAVE + 2, W1 - W0, ST - EAVE - 2, 'tile', { shade: [grain('tileShade', .35, 'down', 1.4)] }));
      L.push(poly([W0, EAVE - 8, W1 - 4, EAVE - 8, W1 + 2, EAVE + 2, W0, EAVE + 2], 'slate', { shade: grain('slateShade', .35, 'down') }));
      for (y = EAVE - 6; y < EAVE + 2; y += 2.6) L.push(r(W0, y, W1 - W0, .5, 'slateLine', { a: .7 }));
      L.push(r(W0 - 2, EAVE + 1, W1 - W0 + 6, 3.4, 'green', { shade: grain('greenShade', .4, 'down') })); L.push(r(W0, EAVE + 4.4, W1 - W0, 2.6, 'shadow', { a: .22 }));
      L.push(r(W0, EAVE, 3, ST - EAVE, 'shadow', { a: .2 }));
      // the main block: white tile walls, the tile joints just visible
      L.push(r(B0, EAVE, B1 - B0, SLAB - EAVE, 'tile', { shade: [grain('tileShade', .3, 'down', 1.6), grain('tileLite', .1, 'up', 1.8)] }));
      for (y = EAVE + 3; y < SLAB; y += 3) L.push(r(B0, y, B1 - B0, .35, 'tileLine', { a: .55 }));
      for (y = EAVE + 3; y < SLAB; y += 6) for (x = B0 + ((y / 6) % 2 ? 0 : 3); x < B1; x += 6) L.push(r(x, y, .35, 3, 'tileLine', { a: .3 }));
      for (y = EAVE + 6; y < SLAB; y += 3) for (x = W0 + 2; x < W1; x += 6) L.push(r(x, y, .35, 3, 'tileLine', { a: .25 }));
      // the thick green eave over the fourth floor, the shadow it throws on the tile
      L.push(r(B0 - 6, EAVE - 1, B1 - B0 + 12, 5, 'green', { shade: grain('greenShade', .45, 'down', 1.4) })); L.push(r(B0 - 6, EAVE - 1, B1 - B0 + 12, 1, 'greenLite'));
      L.push(r(B0, EAVE + 4, B1 - B0, 3, 'shadow', { a: .22 }));
      // the bays: fourth floor (Cinta Jawa, warm behind the glass at night) and third
      var lit3 = rnd(41);
      BAYS.forEach(function (b, bi) { bay(L, b[0], F4 + 5, b[1], 22, 'lit4', R, true); bay(L, b[0] - (bi ? 0 : 2), F3 + 6, b[1] + (bi ? 0 : 2), 22, bi === 1 ? 'lit3' : false, R, false); });
      bay(L, 330, F4 + 8, 30, 20, 'lit4', R, false); bay(L, 330, F3 + 8, 30, 20, false, R, false);
      pipe(L, 300, EAVE + 4, SLAB);
      L.push(r(B0, F3, B1 - B0, .8, 'tileShade', { a: .7 })); L.push(r(B1 - 2, EAVE, 2, SLAB - EAVE, 'tileShade'));
      // the second-floor terrace: a black steel frame, clear curtains, festoon lights; diners inside
      L.push(r(B0, F2 + 2, W1 - B0, SLAB - F2 - 2, 'inTerr', { shade: grain('inTerr2', .4, 'down') }));
      for (x = B0 + 8; x < W1 - 8; x += 22) { var hy = F2 + 15 + R() * 3; L.push(c(x, hy, 2.2, 'inDark', { a: .55 })); L.push(r(x - 3, hy + 2, 6, 8, 'inDark', { a: .45, r: 2 })); }
      for (x = B0 + 4; x < W1 - 6; x += 22) L.push(r(x, F2 + 24, 14, 1.4, 'inTerr2'));
      L.push(r(B0, F2 + 2, W1 - B0, SLAB - F2 - 2, 'vinyl', { a: .26 }));
      for (x = B0 + 3; x < W1; x += 5.5) L.push(r(x, F2 + 4, .6, SLAB - F2 - 6, 'vinyl', { a: .35 }));
      L.push(r(B0, F2 + 2, W1 - B0, 3, 'shadow', { a: .3 }));
      var posts = []; for (x = B0; x <= W1 - 2; x += (W1 - B0 - 2) / 7) posts.push(x);
      posts.forEach(function (px, pi) { if (pi < posts.length - 1) { var nx = posts[pi + 1], mid = (px + nx) / 2;
          L.push(line([px + 1, F2 + 5, mid, F2 + 10, nx + 1, F2 + 5], 'bulbWire', .5, { a: .9 }));
          for (var bk = 1; bk < 6; bk++) { var tt = bk / 6, bx = px + 1 + (nx - px) * tt, by = F2 + 5 + 5 * (1 - Math.pow(2 * tt - 1, 2)); L.push(c(bx, by + .9, .9, 'bulb')); } } });
      posts.forEach(function (px) { L.push(r(px, F2, 2.2, SLAB - F2, 'steel')); L.push(r(px, F2, .6, SLAB - F2, 'steelLite')); });
      L.push(r(B0 - 2, F2, W1 - B0 + 4, 2.4, 'steel')); L.push(r(B0 - 2, F2, W1 - B0 + 4, .6, 'steelLite'));
      L.push(r(B0, F2 + 21, W1 - B0, 1.4, 'steel'));
      for (x = B0 + 2; x < W1; x += 3) L.push(r(x, F2 + 22, .6, SLAB - F2 - 22, 'steel', { a: .85 }));
      // the slab edge and the sign band over the shops
      L.push(r(B0 - 2, SLAB, W1 - B0 + 4, SHOP - SLAB, 'tile', { shade: grain('tileShade', .35, 'down') })); L.push(r(B0 - 2, SLAB, W1 - B0 + 4, .8, 'tileLite'));
      L.push(r(B0 + 4, SIGN - 4.6, 132, 9.8, 'sign', { r: .6 })); [[B0 + 10, 42], [B0 + 60, 26], [B0 + 94, 34]].forEach(function (s) { L.push(r(s[0], SIGN - 1.6, s[1], 1.6, 'signInk', { a: .85 })); L.push(r(s[0], SIGN + 1.4, s[1] * .6, .9, 'signInk', { a: .6 })); });
      L.push({ t: 'text', text: 'KOKUSAI BLD.', x: 200, y: SIGN + 2.6, size: 4, weight: 600, font: FONT, fill: 'ink', align: 'center', ls: .5 });
      L.push(r(W0 + 2, SIGN - 4.6, W1 - W0 - 4, 9.8, 'signB', { r: .6 })); L.push(c(W0 + 9, SIGN + .3, 3, 'signInk')); L.push(r(W0 + 15, SIGN - 1.4, 30, 1.4, 'signInk', { a: .85 })); L.push(r(W0 + 15, SIGN + 1.2, 20, .9, 'signInk', { a: .6 }));
      L.push(r(B0 - 2, SHOP - 1, W1 - B0 + 4, 1.4, 'shadow', { a: .3 }));
      // the shops: a bright corner store on the left, a lit lobby in the middle, a granite-faced shop, the red door up the steps
      L.push(r(B0, SHOP, 138, ST - SHOP, 'inShop', { shade: grain('inShopD', .3, 'down') }));
      for (y = SHOP + 6; y < ST - 2; y += 6) { L.push(r(B0 + 2, y, 134, .8, 'inShopD', { a: .7 })); for (x = B0 + 4; x < B0 + 134; x += 2.6) L.push(r(x, y - 3.4, 1.8, 3.2, ['inShelfA', 'inShelfB', 'inShelfC', 'inShop2'][Math.floor(R() * 4)], { a: .75 })); }
      for (x = B0 + 6; x < B0 + 136; x += 16) L.push(r(x, SHOP + .6, 8, 1.2, 'inLamp'));
      L.push(r(B0, SHOP, 138, ST - SHOP, 'glass', { a: .12 }));
      for (x = B0; x <= B0 + 138; x += 34.5) L.push(r(x, SHOP, 1.8, ST - SHOP, 'steel'));
      L.push(r(B0, SHOP + 9, 138, 1.2, 'steel', { a: .8 }));
      [[B0 + 40, 'posterB'], [B0 + 76, 'posterC']].forEach(function (p) { L.push(r(p[0], SHOP + 12, 8, 11, 'poster')); L.push(r(p[0] + 1, SHOP + 13, 6, 5, p[1])); });
      for (i = 0; i < 4; i++) sheen(L, B0 + 2 + i * 34.5, SHOP, 32, ST - SHOP, { a: .14, at: .2, street: false });
      L.push(r(182, SHOP, 36, ST - SHOP, 'inLobby', { shade: grain('inLobbyD', .4, 'down') }));
      L.push(r(190, SHOP + 4, 20, ST - SHOP - 4, 'inLobbyD', { a: .55 })); L.push(r(191, SHOP + 6, 18, 1, 'inLamp'));
      for (y = ST - 8; y < ST; y += 2.4) L.push(r(186, y, 28, 1.2, 'inLobbyD', { a: .3 }));
      L.push(r(218, SHOP, W0 - 218, ST - SHOP, 'granite', { shade: grain('graniteShade', .4, 'down', 1.4) }));
      for (y = SHOP + 7; y < ST; y += 7) L.push(r(218, y, W0 - 218, .5, 'graniteShade'));
      L.push(r(234, SHOP + 4, 58, ST - SHOP - 8, 'glass2')); L.push(r(236, SHOP + 6, 54, ST - SHOP - 12, 'inShop', { shade: grain('inShopD', .4, 'down') }));
      for (x = 240; x < 288; x += 7) L.push(r(x, SHOP + 12 + R() * 4, 4.4, 10, ['posterB', 'posterC', 'poster', 'foodB'][Math.floor(R() * 4)], { a: .85 }));
      sheen(L, 236, SHOP + 6, 54, ST - SHOP - 12, { a: .16, at: .15, street: false });
      L.push(r(W0, SHOP, W1 - W0, ST - SHOP, 'granite', { shade: grain('graniteShade', .4, 'down') }));
      L.push(r(W0 + 8, SHOP + 2, 26, ST - SHOP - 14, 'redDoor', { shade: grain('redDoorShade', .4, 'down') })); L.push(r(W0 + 20.6, SHOP + 2, .8, ST - SHOP - 14, 'redDoorShade'));
      L.push(r(W0 + 11, SHOP + 5, 7, 6, 'poster')); L.push(r(W0 + 24, SHOP + 5, 7, 6, 'poster')); L.push(r(W0 + 12, SHOP + 6, 5, 3, 'posterB'));
      L.push(r(W0 + 38, SHOP + 2, 14, ST - SHOP - 14, 'inShop')); for (x = W0 + 39; x < W0 + 51; x += 3.4) L.push(r(x, SHOP + 4 + R() * 3, 2.6, 4, ['posterB', 'posterC', 'foodB'][Math.floor(R() * 3)]));
      // the far lane: brick pavers to the foot of the building
      L.push(r(0, ST, 400, 244 - ST, 'brick', { shade: [grain('brickShade', .3, 'down', 1.3), grain('brickLite', .1, 'up')] }));
      for (y = ST + 2, i = 0; y < 244; i++) { var hh = 2.2 + i * .45; L.push(r(0, y, 400, .5, 'brickLine', { a: .6 })); for (x = (i % 2) * hh * 1.6; x < 400; x += hh * 3.2) { L.push(r(x, y, .5, hh, 'brickLine', { a: .45 })); if (R() > .8) L.push(r(x + .6, y + .5, hh * 3.2 - 1, hh - .6, 'brickLite', { a: .3 })); } y += hh; }
      L.push(r(0, ST, 400, 1.2, 'shadow', { a: .2 }));
      // brick steps up to the red door
      for (i = 0; i < 3; i++) { var sy = ST - (i + 1) * 4; L.push(r(W0 + 2 - i * 0, sy, W1 - W0 - 4 - i * 0, 4, 'step', { shade: grain('stepShade', .35, 'down') })); L.push(r(W0 + 2, sy, W1 - W0 - 4, .8, 'stepLite')); }
      pavement(L, F, { seed: 83, stains: 4, manhole: [330, 284, 15] });
      // brick courses on the near pavement too: a joint through every tile
      (function () { var Q = rnd(53), yy = 246, row = 0; while (yy < 300) { var bh = 5.6 + row * .45; L.push(r(0, yy, 400, .55, 'joint', { a: .55 }));
          for (var bx = (row % 2) * bh * 1.25 - bh * 2.5; bx < 400; bx += bh * 2.5) { L.push(r(bx, yy, .55, bh, 'joint', { a: .45 })); var v = Q(); if (v > .78) L.push(r(bx + .6, yy + .6, bh * 2.5 - 1.1, bh - .6, 'stoneLight', { a: .35 })); else if (v < .2) L.push(r(bx + .6, yy + .6, bh * 2.5 - 1.1, bh - .6, 'stoneShade', { a: .25 })); }
          yy += bh; row++; } })();
      // the entrance in front of the lobby: tile pilasters, a pair of wall lamps (facade: the figure steps out past them)
      F.push(r(178, SHOP - 1, 5, ST - SHOP + 1, 'tile', { shade: grain('tileShade', .45, 'right') })); F.push(r(217, SHOP - 1, 5, ST - SHOP + 1, 'tile', { shade: grain('tileShade', .45, 'left') }));
      F.push(r(178, SHOP - 1, 1, ST - SHOP + 1, 'rim', { a: .4 })); F.push(r(221, SHOP - 1, 1, ST - SHOP + 1, 'shadow', { a: .2 }));
      [180.5, 219.5].forEach(function (lx) { F.push(r(lx - 1.6, SHOP + 6, 3.2, 4.2, 'lampGlass', { r: .8 })); F.push(r(lx - 1.8, SHOP + 5.4, 3.6, .8, 'steel')); });
      // the steps' black handrail
      F.push(line([W0 + 2, ST - 14, W0 + 2, ST - 22, W1 - 2, ST - 22, W1 - 2, ST - 14], 'steel', .9)); F.push(line([W0 + 30, ST - 22, W0 + 30, ST - 12], 'steel', .7));
      // Cinta Jawa's tall banner between the first two fourth-floor bays: a cream pennant, the red emblem, the name, 4F
      (function () { var bx = 116, by = F4 + 2, bw = 17, bh = 66;
        L.push(r(bx + bw / 2 - .4, by - 4, .8, 4, 'steel')); L.push(r(bx - 2, by - 1.4, bw + 4, 1.6, 'steel'));
        L.push(poly([bx + 2, by + 1.4, bx + bw + 2, by + 1.4, bx + bw + 2, by + bh + 1, bx + bw / 2 + 2, by + bh + 6, bx + 2, by + bh + 1], 'shadow', { a: .18 }));
        L.push(poly([bx, by, bx + bw, by, bx + bw, by + bh, bx + bw / 2, by + bh + 5, bx, by + bh], 'cj', { shade: grain('cjShade', .35, 'right', 1.3) }));
        L.push(r(bx + 1.2, by + 1.2, bw - 2.4, .8, 'cjRed')); L.push(r(bx + 1.2, by + bh - 1.6, bw - 2.4, .8, 'cjRed'));
        L.push({ t: 'text', text: 'CINTA', x: bx + bw / 2, y: by + 6.8, size: 3.6, weight: 800, font: FONT, fill: 'cjInk', align: 'center', ls: .2 });
        var ex = bx + bw / 2, ey = by + 17;     // the emblem: a red flame crown over a round cup
        L.push(poly([ex - 6, ey + 2, ex - 4.5, ey - 2.5, ex - 3, ey + .2, ex - 1.6, ey - 4.2, ex, ey - 7, ex + 1.6, ey - 4.2, ex + 3, ey + .2, ex + 4.5, ey - 2.5, ex + 6, ey + 2], 'cjRed2'));
        L.push(c(ex, ey + 3.4, 3.6, 'cjRed')); L.push(c(ex, ey + 3.4, 1.8, 'cj', { a: .7 })); L.push(r(ex - 7, ey + 3, 14, .8, 'cjRed2'));
        L.push({ t: 'text', text: 'JAWA', x: bx + bw / 2, y: by + 29.4, size: 3.6, weight: 800, font: FONT, fill: 'cjInk', align: 'center', ls: .2 });
        L.push({ t: 'text', text: 'CAFE', x: bx + bw / 2, y: by + 34.2, size: 2.6, weight: 700, font: FONT, fill: 'cjInk', align: 'center', ls: .3 });
        [[0, 'foodA'], [1, 'foodC'], [2, 'foodB']].forEach(function (f) { var fy = by + 37.4 + f[0] * 7.4; L.push(r(bx + 2.2, fy, bw - 4.4, 6.4, 'cjShade')); L.push(e(bx + bw / 2, fy + 3.4, 4.6, 2.2, f[1])); L.push(e(bx + bw / 2 - 1, fy + 2.8, 1.6, .8, 'cj', { a: .6 })); });
        L.push({ t: 'text', text: '4F', x: bx + bw / 2, y: by + bh + .6, size: 4.6, weight: 800, font: FONT, fill: 'cjRed', align: 'center' });
        L.push(r(bx, by, .8, bh, 'rim', { a: .35 })); })();
      // on the pavement: the cafe's chalkboard, a steel bollard, a planter by the door
      (function () { var x0 = 112, fy = 254; contact(P, x0 + 11, fy, 15, .22);
        P.push(line([x0 + 1, fy, x0 + 4, fy - 34], 'boardFrame', 1.6)); P.push(line([x0 + 21, fy, x0 + 18, fy - 34], 'boardFrame', 1.6));
        P.push(poly([x0 + 3.4, fy - 33, x0 + 18.6, fy - 33, x0 + 20.4, fy - 4, x0 + 1.6, fy - 4], 'board', { shade: grain('boardShade', .4, 'down') }));
        P.push(r(x0 + 2.4, fy - 36, 17.2, 4, 'boardFrame', { r: .6 })); P.push(r(x0 + 2.4, fy - 36, 17.2, .7, 'rim', { a: .4 }));
        P.push({ t: 'text', text: 'CINTA JAWA', x: x0 + 11, y: fy - 28.6, size: 2.6, weight: 700, font: FONT, fill: 'boardInk', align: 'center', ls: .1 });
        P.push(poly([x0 + 8.4, fy - 23.4, x0 + 9.6, fy - 26, x0 + 11, fy - 27.4, x0 + 12.4, fy - 26, x0 + 13.6, fy - 23.4], 'cjRed2')); P.push(c(x0 + 11, fy - 22.4, 1.6, 'cjRed2'));
        [[x0 + 5, 'foodA'], [x0 + 12.4, 'foodC']].forEach(function (f) { P.push(r(f[0], fy - 18.6, 5.6, 4.6, 'cj')); P.push(e(f[0] + 2.8, fy - 16.2, 2, 1.1, f[1])); });
        P.push({ t: 'text', text: '4F', x: x0 + 11, y: fy - 7.6, size: 4, weight: 800, font: FONT, fill: 'boardInk', align: 'center' });
        P.push(line([x0 + 4.6, fy - 10.8, x0 + 7.6, fy - 10.8], 'boardInk', .4, { a: .7 })); P.push(line([x0 + 14.4, fy - 10.8, x0 + 17.4, fy - 10.8], 'boardInk', .4, { a: .7 })); })();
      [268, 304].forEach(function (bx) { contact(P, bx, 251, 6, .22); P.push(r(bx - 2.2, 226, 4.4, 25, 'bollard', { r: [2, 2, .4, .4], shade: grain('bollardShade', .45, 'right') })); P.push(r(bx - 2.2, 230, 4.4, 1.2, 'bollardShade')); P.push(r(bx - 1.6, 227, .8, 22, 'metalSheen', { a: .5 })); });
      plant(P, 164, 248, 1.05, 13, { n: 8, tall: 1.1 }); plant(P, 238, 248, 1, 19, { n: 7 });
      K.bike(P, 52, 252, { flip: true, basket: true, bag: 'coatC' });
      K.leaves(P, 20, 380, 254, 296, 14, 77);
    } });
})();
