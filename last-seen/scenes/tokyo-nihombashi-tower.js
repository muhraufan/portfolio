/* Scene — tokyo-nihombashi-tower. Needs /timeline/lib/last-seen.js and /timeline/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, pavement = K.pavement, contact = K.contact, sheen = K.sheen, bike = K.bike, crown = K.crown;
  /* ================= Tokyo Nihombashi Tower — Nihonbashi (Oct 27, 09:49) =================
     seen from across Eitai-dori: the granite-gridded tower rising out of the frame, deep cells with a
     timber-tone fin in each, the tall glass strip on its corner, the dark-glass neighbour behind; the sky
     lobby band and a heavy granite podium with tall shopfronts at the street; a zebra crossing, and in the
     foreground the glass box of the Tokyo Metro entrance he climbs out of, the M sign on its corner */
  var T0 = 46, T1 = 336, GS = 336, FL = 24, PITCH = 18.125, NB = 16, SX = 264, SW = 22, LOBBY = 108, POD = 128, BASE = 204;
  function cell(L, x, y, w, h, R, lit) {   // one deep granite cell: shadowed reveal, glass, a timber-tone fin, a lit sill
    L.push(r(x, y, w, h, 'cellDeep'));
    L.push(r(x + 1.6, y + 1.8, w - 2.2, h - 2.4, lit ? 'winLit' : (R() > .5 ? 'glass' : 'glass2'), { shade: grain('glassShade', .35, 'down', 1.5) }));
    if (!lit) L.push(poly([x + 1.6 + (w - 2.2) * .55, y + 1.8, x + w - .6, y + 1.8, x + w - .6, y + 1.8 + (h - 2.4) * .4], 'reflectSky', { a: .35 }));
    else L.push(r(x + 1.6, y + 1.8, w - 2.2, 2, 'winLit2', { a: .7 }));
    L.push(r(x + 1.6, y + 1.8, w - 2.2, 1.2, 'cellDeep', { a: .7 }));                       // the head of the reveal, in shadow
    L.push(r(x + 1.6, y + 1.8, 1.3, h - 2.4, 'cellDeep', { a: .55 }));                       // the shaded jamb
    L.push(r(x + w / 2 - .5, y + 1.8, 1.4, h - 2.4, 'fin', { shade: grain('finShade', .4, 'right') }));   // the timber-tone fin
    L.push(r(x + .4, y + h - 1.2, w - .8, 1.2, 'graniteLite', { a: .8 }));                    // the sill catching the light
  }
  make('tokyo-nihombashi-tower', { seed: 911, seenAt: '2026-10-27T09:49:00+09:00',
    place: { en: 'Tokyo Nihombashi Tower', ja: '東京日本橋タワー' }, name: { en: 'Tokyo Nihombashi Tower', ja: '東京日本橋タワー' }, area: { en: 'Nihonbashi, Tokyo', ja: '東京・日本橋' },
    alt: 'Illustration of Tokyo Nihombashi Tower: a granite-gridded office tower rising out of the frame with a tall glass strip on its corner, a heavy stone podium with tall shopfronts, a zebra crossing on Eitai-dori, and the glass box of a Tokyo Metro entrance in front with its blue M sign.',
    palette: { sunWash: '#ffc58e', sky: '#dfe3e6', skyShade: '#c8cfd4', cloud: '#eef0f1', cloudShade: '#d3d8dc', cloudLite: '#f7f8f8',
      granite: '#b7a691', graniteShade: '#9c8b76', graniteLite: '#d3c4ae', graniteDark: '#7d6e5d', cellDeep: '#4d453d', fin: '#9b7a58', finShade: '#7a5d41',
      shopGlass: '#56636c', glass: '#56636c', glass2: '#4a5760', glassShade: '#36414a', reflectSky: '#c9d2d8', winLit: '#56636c', winLit2: '#6a7780',
      strip: '#7e93a2', stripShade: '#5f7484', stripLite: '#b8c8d3', stripLine: '#3e4a54',
      nbr: '#3f5570', nbrShade: '#2d3f55', nbrLite: '#7f9ab4', nbrLine: '#26364a',
      lowB: '#cfc8bc', lowBShade: '#b4ac9e', lowWin: '#7d878e',
      podium: '#8f7f6d', podiumShade: '#76675a', podiumLite: '#ad9d88',
      inShop: '#e9d4ad', inShop2: '#cdb48a', inShopD: '#a88b62', inLampS: '#ffe2ad',
      road: '#7c7c7a', roadShade: '#6b6b69', roadLite: '#8d8d8a', zebra: '#e9e8e3', zebraShade: '#cfcec8', laneY: '#d9a63c',
      kerbFar: '#b9b5ad', paveFar: '#c9c4ba',
      box: '#3c4044', boxShade: '#2a2d30', boxLite: '#5b6166', boxGlass: '#8e9ba3', boxGlass2: '#6f7d86',
      inStair: '#c9c2b6', inStairShade: '#8f887d', inWallB: '#e2dcd0', inLight: '#fff1d6',
      mSign: '#14a0c8', mSignShade: '#0f86a8', mInk: '#ffffff', nameBand: '#2a2d30', nameInk: '#f2f2ee',
      pole: '#9aa39b', poleShade: '#7b847c', sigBox: '#3a3d3f', sigLamp: '#5d6a62', roadSign: '#2f62b6', roadSignInk: '#ffffff',
      rail: '#a7aca8', railShade: '#868b87',
      tree: '#6d8452', tree2: '#86a064', treeShade: '#4f6639', trunk: '#5a4a3c',
      tyre: '#2b2b2d', bikeFrame: '#c9cdd0', bikeMetal: '#9ea3a8', bikeSeat: '#2f2f31', bikeBasket: '#3d4045', lampGlass: '#f1ece0', taxi: '#2c3447', taxiShade: '#1d2333', taxiLine: '#c9a54a', taxiLamp: '#f2e6c4' },
    light: { noShadows: true,
      morning: { set: { sky: '#cddff0', skyShade: '#b2cbe0', sunWash: '#fff1d2', granite: '#b3ab9f', graniteShade: '#968f86', podium: '#8a8178', glass: '#5a6b78', glass2: '#4e5f6c', cloud: '#f4f7fa', reflectSky: '#d3e2ee', granite: '#b5a998', graniteLite: '#dcd3c4', strip: '#8aa4b8', stripLite: '#cfe0ec', nbrLite: '#9cb9d2' },
        add: { back: [r(0, 0, 250, 122, 'sunWash', { a: .16 }), r(250, 0, 86, 206, 'shadow', { a: .13 }), r(GS, 0, 64, 206, 'shadow', { a: .16 }), r(T0, 128, 204, 36, 'shadow', { a: .08 })],
               front: [poly([150, 246, 262, 246, 330, 262, 214, 262], 'shadow', { a: .12 }), poly([322, 246, 330, 246, 400, 258, 394, 260], 'shadow', { a: .12 })] } },
      midday: { add: { back: [r(T0, POD - 2, T1 - T0, 4, 'shadow', { a: .2 }), r(0, 204, 400, 3, 'shadow', { a: .14 })], front: [e(201, 247, 64, 3, 'shadow', { a: .16 }), e(330, 252, 9, 2, 'shadow', { a: .16 })] } },
      golden: { set: { podium: '#a58466', podiumLite: '#d3ad85', inShop: '#f6d3a0', sky: '#eed3bb', skyShade: '#e2b898', cloud: '#fbe2c8', cloudShade: '#eec3a2', cloudLite: '#fff0de', granite: '#cfae8b', graniteLite: '#f0cfa4', graniteShade: '#a98a6c', reflectSky: '#f6c99c',
          strip: '#c79f86', stripLite: '#ffd9ae', nbrLite: '#e6a77c', nbr: '#5a5466', fin: '#b9814f' },
        add: { back: [r(0, 0, 400, 112, 'sunWash', { a: .26 }), r(0, 112, 400, 94, 'sunWash', { a: .12 }), poly([0, 150, 400, 96, 400, 206, 0, 206], 'shadow', { a: .1 }), r(T0, 0, 2.4, 128, 'rim', { a: .6 }), r(SX, 0, 1.4, 122, 'rim', { a: .6 })],
               front: [poly([140, 246, 262, 246, 190, 264, 60, 264], 'shadow', { a: .12 }), poly([326, 248, 334, 248, 262, 266, 250, 266], 'shadow', { a: .12 })] } },
      night: { set: { sky: '#101629', skyShade: '#0a0e1d', cloud: '#141a30', cloudShade: '#10162a', cloudLite: '#192038',
          granite: '#2a2a30', graniteShade: '#1f1f25', graniteLite: '#3c3a3e', graniteDark: '#18181d', cellDeep: '#0c0c10', fin: '#3a2c20', finShade: '#2a1f17',
          shopGlass: '#3a2c1c', glass: '#151b2a', glass2: '#121726', glassShade: '#0c101b', reflectSky: '#232b40', winLit: '#f3c47c', winLit2: '#ffe2ad',
          strip: '#e8c98f', stripShade: '#c7a368', stripLite: '#fff0cf', stripLine: '#3a2f22',
          nbr: '#141c2e', nbrShade: '#0e1424', nbrLite: '#d9b87a', nbrLine: '#0a0f1c', lowB: '#1f2230', lowBShade: '#171a26', lowWin: '#e7c58a',
          podium: '#1c1b20', podiumShade: '#141318', podiumLite: '#2e2c30', road: '#1a1c24', roadShade: '#14161d', roadLite: '#262833', zebra: '#4a4a50', zebraShade: '#3a3a40', kerbFar: '#24262e', paveFar: '#262832',
          box: '#121417', boxShade: '#0a0b0d', boxLite: '#2a2e33', boxGlass: '#5a4e3c', boxGlass2: '#44392c', mSign: '#2fc3ec', mSignShade: '#1a9cc2', nameBand: '#0f1012', pole: '#2c302e', poleShade: '#1f2321', sigLamp: '#d34b3c',
          roadSign: '#244f97', rail: '#3a3d3c', railShade: '#2a2c2b', tree: '#1c2a22', tree2: '#243429', treeShade: '#121c16', trunk: '#1a1612', bikeFrame: '#6a6e72', lampGlass: '#ffe3ad', taxi: '#111520', taxiShade: '#0a0d15', taxiLamp: '#ffe3ad' },
        add: { over: [{ t: 'halo', x: 201, y: 214, rx: 70, ry: 36, n: 7, fill: 'pool', a: .06 }, { t: 'halo', x: 108, y: 168, rx: 14, ry: 14, n: 5, fill: 'mSign', a: .1 },
          { t: 'halo', x: 200, y: 184, rx: 170, ry: 22, n: 6, fill: 'inLampS', a: .05 }, { t: 'halo', x: 318, y: 60, rx: 26, ry: 120, n: 5, fill: 'haze', a: .04 }, { t: 'halo', x: 336, y: 40, rx: 5, ry: 5, n: 4, fill: 'lamp', a: .1 }] } } },
    breathe: { x: 150, y: 190, w: 100, h: 50, c: 'breathe', a: .04 },
    shoppers: [{ keys: [[0, 30], [10, 120], [13, 120], [22, 30]], period: 22, foot: 207, s: .44, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', alpha: .95, shadow: false },
               { keys: [[0, 296], [8, 272], [11, 272], [19, 296]], period: 19, offset: 5, foot: 208, s: .44, coat: 'coatA', legs: 'legsDark', hair: 'hairDark', alpha: .95, shadow: false }],
    passersby: [{ start: 6, every: 24, dir: -1, speed: 24, foot: 284, s: 1.24, coat: 'coatD', legs: 'legsDark', hair: 'hairDark', carry: 'tote', carryC: 'bagMark' },
                { start: 15, every: 27, dir: 1, speed: 21, foot: 276, s: 1.14, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', bag: 'bag', bagMark: 'bagMark' }],
    sig: { emerge: { x: 201, foot0: 240, foot1: 264, s0: .92, s1: 1.24, dur: 1.2 } },
    build: function (L, F, P) {
      var R = rnd(17), i, x, y;
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .25, 'up', 1.6) }));
      // an overcast sky: soft banks of cloud in the gaps either side of the tower
      [[18, 30, [[0, 0, 30, 9], [-20, 6, 20, 7], [22, 5, 18, 7]]], [22, 70, [[0, 0, 26, 7], [16, 4, 16, 6]]], [370, 12, [[0, 0, 18, 6]]]].forEach(function (cl) {
        var cs = cl[2].map(function (q) { return [cl[0] + q[0], cl[1] + q[1], q[2], q[3]]; });
        L.push({ t: 'blob', clumps: cs, fill: 'cloud', shade: grain('cloudShade', .35, 'down', 1.5), inner: [{ clumps: cs.map(function (q) { return [q[0] - q[2] * .15, q[1] - q[3] * .35, q[2] * .7, q[3] * .5]; }), fill: 'cloudLite' }] }); });
      // the low office building on the left, punched windows
      L.push(r(0, 96, T0, 110, 'lowB', { shade: grain('lowBShade', .3, 'down', 1.4) })); L.push(r(0, 96, T0, 2, 'lowBShade'));
      for (y = 104; y < 196; y += 12) for (x = 3; x < T0 - 6; x += 10) { var lw = R() > .72; L.push(r(x, y, 7, 7, lw ? 'winLit' : 'lowWin', { a: lw ? 1 : .9 })); if (!lw) L.push(r(x, y, 7, 1.2, 'lowBShade')); }
      L.push(r(T0 - 3, 96, 3, 110, 'shadow', { a: .18 }));
      // the dark-glass neighbour rising behind on the right
      L.push(r(GS + 4, 0, 64, 206, 'nbr', { shade: [grain('nbrShade', .35, 'right', 1.4)] }));
      for (y = 4; y < 206; y += 7) L.push(r(GS + 4, y, 64, .7, 'nbrLine', { a: .8 }));
      for (x = GS + 8; x < 400; x += 6) L.push(r(x, 0, .6, 206, 'nbrLine', { a: .6 }));
      (function () { var Q = rnd(23); for (y = 4; y < 200; y += 7) for (x = GS + 8; x < 398; x += 6) if (Q() > .86) L.push(r(x + .7, y + .8, 4.6, 5.4, 'nbrLite', { a: .35 + Q() * .3 })); })();
      L.push(poly([GS + 4, 0, GS + 40, 0, GS + 4, 70], 'nbrLite', { a: .14 }));
      // the tower: granite grid of deep cells, eleven bays, the floors running up out of the frame
      L.push(r(T0, 0, T1 - T0, LOBBY, 'granite', { shade: [grain('graniteShade', .3, 'down', 1.6), grain('graniteLite', .12, 'up', 1.8)] }));
      var lit = rnd(29);
      for (y = LOBBY - FL; y > -FL; y -= FL) for (i = 0; i < NB; i++) { x = T0 + 2.6 + i * PITCH; if (x + PITCH > SX && x < SX + SW) continue; cell(L, x, y + 4.4, PITCH - 3.4, FL - 5.6, R, lit() > .5 && y < 90); }
      for (i = 0; i <= NB; i++) { x = T0 + i * PITCH; if (x > SX && x < SX + SW) continue; L.push(r(x, 0, 2.6, LOBBY, 'granite')); L.push(r(x, 0, .8, LOBBY, 'graniteLite', { a: .9 })); L.push(r(x + 2, 0, .6, LOBBY, 'graniteShade', { a: .8 })); }   // the piers, a lit edge, a shaded edge
      for (y = LOBBY - FL; y > -FL; y -= FL) { L.push(r(T0, y + 2.8, T1 - T0, 1.4, 'graniteDark', { a: .25 })); L.push(r(T0, y + 2.2, T1 - T0, .7, 'graniteLite', { a: .6 })); }   // floor lines in the spandrels
      L.push(r(T1 - 3, 0, 3, LOBBY, 'graniteShade'));
      // the glass strip: one tall bay of curtain wall set into the grid, standing a little proud, running from the podium out of the frame
      L.push(r(SX - 2, 0, SW + 4, POD - 6, 'graniteShade')); L.push(r(SX - 2, 0, 1, POD - 6, 'graniteLite'));
      L.push(r(SX, 0, SW, POD - 6, 'strip', { shade: [grain('stripShade', .35, 'down', 1.4)] }));
      for (y = LOBBY; y > -FL; y -= FL / 3) L.push(r(SX, y, SW, Math.abs((LOBBY - y) % FL) < .1 ? 1.4 : .6, 'stripLine', { a: .8 }));
      for (x = SX + 5.5; x < SX + SW; x += 5.5) L.push(r(x, 0, .6, POD - 6, 'stripLine', { a: .7 }));
      sheen(L, SX, 0, SW, POD - 6, { a: .22, at: .05, street: false, fill: 'stripLite' });
      L.push(r(SX + SW, 0, 2, POD - 6, 'shadow', { a: .25 }));
      L.push(r(GS, 0, 4, 206, 'graniteShade')); L.push(r(GS + 3, 0, 1.2, 206, 'shadow', { a: .3 }));
      // the sky lobby: a recessed band of glass under the tower, piers running through
      L.push(r(T0, LOBBY, T1 - T0, POD - LOBBY - 6, 'glass2', { shade: grain('glassShade', .4, 'down') }));
      for (i = 0; i <= NB; i += 2) L.push(r(T0 + i * PITCH, LOBBY, 3, POD - LOBBY - 6, 'granite'));
      L.push(r(T0, LOBBY, T1 - T0, 2.4, 'cellDeep', { a: .8 }));
      for (i = 0; i < NB; i += 2) L.push(r(T0 + 4 + i * PITCH, LOBBY + 5, PITCH * 2 - 5, 1.2, 'reflectSky', { a: .3 }));
      // the podium cornice: a projecting granite ledge with a shadow under it
      L.push(r(T0 - 6, POD - 6, T1 - T0 + 12, 6, 'graniteLite', { shade: grain('graniteShade', .35, 'down') })); L.push(r(T0 - 6, POD - 6, T1 - T0 + 12, 1, 'rim', { a: .5 }));
      // the podium: an upper floor of paired windows, then the tall shopfronts between heavy piers
      L.push(r(T0 - 6, POD, T1 - T0 + 6, BASE - POD, 'podium', { shade: [grain('podiumShade', .35, 'down', 1.5)] }));
      L.push(r(T0 - 6, POD, T1 - T0 + 6, 3, 'shadow', { a: .28 }));
      for (i = 0; i < 13; i++) { x = T0 - 2 + i * 22.4; if (x > GS - 10) break; L.push(r(x, POD + 7, 16, 18, 'cellDeep')); L.push(r(x + 1.4, POD + 8.6, 13.2, 15.4, R() > .6 ? 'glass' : 'glass2'));
        L.push(r(x + 1.4, POD + 8.6, 13.2, 3, 'reflectSky', { a: .25 })); L.push(r(x + 7.4, POD + 8.6, 1, 15.4, 'fin')); L.push(r(x, POD + 25, 16, 1.2, 'podiumLite')); }
      L.push(r(T0 - 6, 160, T1 - T0 + 6, 3, 'podiumLite', { a: .7 }));
      // the shops: a warm interior behind tall glass, with shelves and pendant lights
      L.push(r(T0 - 6, 164, GS - T0 + 6, 40, 'inShop', { shade: grain('inShopD', .3, 'down') }));
      for (x = T0; x < GS; x += 9) L.push(r(x, 178 + (R() * 6), 5, 1.2, 'inShopD', { a: .6 }));
      for (x = T0 + 4; x < GS; x += 14) { L.push(r(x, 164, .5, 6, 'inShopD')); L.push(c(x, 171, 1.4, 'inLampS')); }
      for (x = T0; x < GS; x += 7) L.push(r(x, 188 + R() * 4, 2 + R() * 3, 16, R() > .5 ? 'inShop2' : 'inShopD', { a: .5 }));
      L.push(r(T0 - 6, 164, GS - T0 + 6, 40, 'shopGlass', { a: .28 }));
      for (i = 0; i < 7; i++) { x = T0 - 6 + i * 46.2; L.push(r(x, 163, 8, 41, 'podium', { shade: grain('podiumShade', .45, 'right') })); L.push(r(x, 163, 1, 41, 'podiumLite')); }   // the heavy piers
      for (i = 0; i < 6; i++) { x = T0 + 2 + i * 46.2; L.push(r(x, 176, 38, .8, 'boxShade', { a: .6 })); sheen(L, x, 164, 38, 40, { a: .14, at: .2, street: false }); }
      // the far pavement and its trees
      L.push(r(0, 204, 400, 8, 'paveFar', { shade: grain('stoneShade', .3, 'down') })); L.push(r(0, 211, 400, 1.6, 'kerbFar'));
      [[60, 'tree', 'tree2'], [282, 'tree2', 'tree']].forEach(function (t, k) { L.push(r(t[0] - 1, 166, 2.4, 40, 'trunk')); contact(L, t[0], 206, 8, .2);
        crown(L, [[t[0] - 8, 160, 9], [t[0] + 6, 156, 10], [t[0], 148, 9], [t[0] + 10, 166, 7], [t[0] - 12, 168, 7]], [t[1], t[2]], 'treeShade'); });
      // Eitai-dori: the road, a lane line, the zebra crossing
      L.push(r(0, 212, 400, 32, 'road', { shade: [grain('roadShade', .35, 'down', 1.3), grain('roadLite', .12, 'up')] }));
      for (x = 0; x < 150; x += 26) L.push(r(x, 226, 14, 1.2, 'zebra', { a: .7 }));
      for (i = 0; i < 9; i++) { var zx = 278 + i * 15; L.push(poly([zx, 213, zx + 8, 213, zx + 12 + i * .6, 243, zx + 1 + i * .6, 243], 'zebra', { shade: grain('zebraShade', .3, 'down') })); }
      L.push(r(260, 214, 4, 28, 'zebra', { a: .6 }));
      // a JPN Taxi waiting at the lights, dark navy, its lamp on the roof
      (function () { var tx = 14; L.push(e(tx + 34, 239, 36, 2, 'shadow', { a: .3 }));
        L.push(poly([tx, 236, tx + 2, 224, tx + 12, 222, tx + 18, 212, tx + 52, 212, tx + 60, 222, tx + 68, 224, tx + 69, 236], 'taxi', { shade: grain('taxiShade', .4, 'down') }));
        L.push(poly([tx + 20, 214, tx + 36, 214, tx + 36, 222, tx + 14, 222], 'boxGlass2')); L.push(poly([tx + 38, 214, tx + 51, 214, tx + 57, 222, tx + 38, 222], 'boxGlass2'));
        L.push(r(tx + 2, 226, 66, 1, 'taxiLine')); L.push(r(tx + 30, 209, 10, 3, 'taxiLamp', { r: 1 }));
        [tx + 14, tx + 56].forEach(function (wx) { L.push(c(wx, 236, 5, 'tyre')); L.push(c(wx, 236, 2, 'bikeMetal')); });
        L.push(r(tx + 66, 225, 3, 2, 'taxiLamp')); })();
      pavement(L, F, { seed: 61, tactile: 296 });
      // the Metro entrance: a glass box on a steel frame; inside, the stairs coming up
      L.push(r(142, 186, 118, 58, 'inWallB', { shade: grain('inStairShade', .3, 'down') }));
      for (y = 206; y < 244; y += 4.2) { L.push(r(176, y, 50, 2.6, 'inStair')); L.push(r(176, y + 2.6, 50, 1.6, 'inStairShade')); }
      L.push(r(176, 190, 50, 16, 'inStairShade', { a: .6 })); L.push(r(176, 190, 50, 2, 'inLight'));
      L.push(r(172, 200, 2, 44, 'boxLite')); L.push(r(228, 200, 2, 44, 'boxLite')); L.push(line([172, 210, 176, 206, 226, 206, 230, 210], 'metal', .8));
      F.push(r(142, 186, 34, 58, 'boxGlass', { a: .5 })); F.push(r(226, 186, 34, 58, 'boxGlass2', { a: .5 }));
      sheen(F, 142, 186, 34, 58, { a: .2, at: .1 }); sheen(F, 226, 186, 34, 58, { a: .16, at: .3 });
      [142, 159, 175, 226, 243, 259].forEach(function (mx) { F.push(r(mx, 186, 1.6, 58, 'box')); });
      F.push(r(142, 214, 34, 1.2, 'box')); F.push(r(226, 214, 34, 1.2, 'box'));
      F.push(r(138, 176, 126, 10, 'box', { shade: grain('boxShade', .4, 'down') })); F.push(r(138, 176, 126, 1, 'boxLite'));
      F.push(r(176, 186, 50, 5, 'nameBand')); F.push({ t: 'text', text: '日本橋 Nihombashi', x: 201, y: 190, size: 3.4, weight: 600, font: FONT, fill: 'nameInk', align: 'center', ls: .2 });
      F.push(r(138, 186, 126, 1.4, 'shadow', { a: .3 }));
      // the M sign on its corner post
      F.push(r(144, 158, 2, 18, 'box')); F.push(r(134, 146, 22, 15, 'mSign', { r: 1.6, shade: grain('mSignShade', .3, 'down') }));
      F.push(poly([138.4, 157, 139.6, 149.6, 145, 155, 150.4, 149.6, 151.6, 157, 149.4, 157, 148.8, 153.6, 145, 157.6, 141.2, 153.6, 140.6, 157], 'mInk'));
      F.push(r(134, 146, 22, 1, 'glassLight', { a: .4 }));
      // a bike and a low guard rail beside the box
      bike(P, 104, 246, { basket: true });
      for (x = 270; x <= 326; x += 28) P.push(r(x, 226, 2, 22, 'rail', { shade: grain('railShade', .4, 'right') }));
      P.push(r(268, 226, 62, 2, 'rail')); P.push(r(268, 236, 62, 1.4, 'railShade')); contact(P, 299, 248, 32, .12);
      // the tall signal pole with the blue Eitai-dori sign
      P.push(r(334, 36, 3.4, 214, 'pole', { shade: grain('poleShade', .45, 'right') })); P.push(r(333, 246, 5.4, 4, 'poleShade')); contact(P, 335.6, 250, 8, .2);
      P.push(r(337, 54, 46, 2.4, 'pole')); P.push(r(364, 46, 22, 9, 'sigBox', { r: 2 })); [369, 375, 381].forEach(function (lx, k) { P.push(c(lx, 50.5, 2.2, k === 0 ? 'sigLamp' : 'boxShade')); });
      P.push(r(318, 120, 34, 12, 'roadSign', { r: 1.2 })); P.push({ t: 'text', text: '永代通り', x: 335, y: 125, size: 4, weight: 600, font: FONT, fill: 'roadSignInk', align: 'center' });
      P.push({ t: 'text', text: 'Eitai-dori', x: 335, y: 130.4, size: 2.6, weight: 500, font: FONT, fill: 'roadSignInk', align: 'center' });
      P.push(r(338, 140, 9, 17, 'sigBox', { r: 1.2 })); P.push(c(342.5, 144.6, 2.2, 'sigLamp')); P.push(c(342.5, 152, 2.2, 'boxShade')); P.push(r(338, 140, 9, .8, 'boxLite'));
    } });
})();
