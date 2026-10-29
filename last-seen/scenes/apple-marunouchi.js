/* Scene — apple-marunouchi. Needs /last-seen/last-seen.js and /last-seen/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, poly = K.poly, line = K.line, grain = K.grain, rnd = K.rnd;
  var make = K.make, pavement = K.pavement, contact = K.contact, sheen = K.sheen, crown = K.crown;
  /* ================= Apple Marunouchi — Marunouchi (Oct 29, 12:19), a clear, sunny day =================
     seen from across the street: the base of the 1973 Mitsubishi Building, its white precast grid running up
     out of the frame, and under it the store's two-storey cast-aluminium vitrines with rounded corners set
     between the tower's piers; bamboo planted inside each one, a white-ash ceiling, the upper floor's edge,
     tables and people below; the entrance bay with the white Apple logo on its glass and the Forum's video wall
     glowing at the back; the building turning the corner on the right, a zelkova of Naka-dori over it */
  var VT = 92, VB = 212, P0 = -6, PITCH = 64, PW = 18, CX = 314, ENT = 2;
  var APPLE = [[0, -.28], [-.12, -.36], [-.3, -.38], [-.44, -.3], [-.5, -.12], [-.5, .1], [-.43, .3], [-.31, .45], [-.19, .5], [-.08, .47], [0, .45], [.08, .47],
    [.19, .5], [.31, .45], [.41, .32], [.47, .21], [.39, .15], [.33, .04], [.33, -.08], [.38, -.17], [.45, -.23], [.37, -.33], [.24, -.38], [.11, -.36]];
  function apple(A, x, y, s, fill, o) {
    var pts = []; APPLE.forEach(function (p) { pts.push(x + p[0] * s, y + p[1] * s); });
    A.push(poly(pts, fill, o)); A.push(e(x + .1 * s, y - .52 * s, .17 * s, .085 * s, fill, Object.assign({ rot: -.85 }, o)));
  }
  function bamboo(L, x0, x1, top, foot, R, dense) {   // a row of bamboo: thin culms with nodes, leaf sprays heavier toward the top
    var x, k = 0;
    for (x = x0 + 2 + R() * 2; x < x1 - 2; x += (dense ? 3.6 : 4.6) + R() * 2.4, k++) {
      var h = top + R() * 10, w = .8 + R() * .5, col = k % 3 ? 'inBamboo' : 'inBamboo2';
      L.push(r(x, h, w, foot - h, col)); L.push(r(x, h, w * .4, foot - h, 'inBambooShade', { a: .5 }));
      for (var ny = foot - 9 - R() * 4; ny > h + 4; ny -= 9 + R() * 4) L.push(r(x - .2, ny, w + .4, .6, 'inBambooShade', { a: .7 }));
    }
    for (var b = 0; b < (x1 - x0) / 9; b++) {   // the foliage gathers into soft masses along the upper storey
      var bx = x0 + 4 + R() * (x1 - x0 - 8), by = top + 10 + R() * (Math.min(foot, 186) - top - 30);
      L.push(e(bx, by, 4 + R() * 3, 2.6 + R() * 1.6, 'inLeaf', { a: .55 })); L.push(e(bx + 1, by + 1.2, 3 + R() * 2, 1.6, 'inLeafShade', { a: .35 }));
    }
    for (var i = 0; i < (x1 - x0) * (dense ? 2.1 : 1.6); i++) {   // leaf sprays
      var lx = x0 + 2 + R() * (x1 - x0 - 4), u = Math.pow(R(), 1.3), ly = top + 4 + u * (Math.min(foot, 190) - top - 22);
      L.push(e(lx, ly, 2.4 + R() * 2.2, .7 + R() * .4, R() > .5 ? 'inLeaf' : 'inLeaf2', { rot: (R() - .5) * 1.6, a: .9 }));
      if (R() > .6) L.push(e(lx + 1, ly + 1, 2, .55, 'inLeafShade', { rot: (R() - .5) * 1.4, a: .7 }));
    }
  }
  function vitrine(L, F, x, w, i, R) {   // one two-storey vitrine: the store seen through glass, inside a cast-aluminium frame
    var ent = i === ENT, gx = x + 2.4, gw = w - 4.8, gy = VT + 2.4, gh = VB - VT - 2.4;
    L.push(r(gx, gy, gw, gh, 'inWall', { shade: grain('inWallShade', .25, 'down', 1.6) }));
    // the white-ash ceiling, its slats running back
    L.push(r(gx, gy, gw, 14, 'inCeil', { shade: grain('inCeilD', .35, 'down') }));
    for (var sx = gx + 1.5; sx < gx + gw; sx += 3.2) L.push(r(sx, gy, .6, 14, 'inCeilD', { a: .55 }));
    L.push(r(gx, gy + 13, gw, 1.2, 'inCeilD', { a: .6 }));
    for (var lx = gx + 6; lx < gx + gw - 3; lx += 12) L.push(r(lx, gy + 14, 4, .8, 'inLamp', { a: .8 }));
    // the upper floor: the slab's white edge, heads at the Genius tables behind
    L.push(r(gx, 150, gw, 5, 'inSlab', { shade: grain('inWallShade', .3, 'down') })); L.push(r(gx, 155, gw, 1.2, 'inWallShade', { a: .6 }));
    for (var hx = gx + 4 + R() * 6; hx < gx + gw - 3; hx += 9 + R() * 8) { L.push(c(hx, 145.5, 1.3, R() > .5 ? 'inHair' : 'inHair2')); L.push(r(hx - 1.6, 147, 3.2, 3, R() > .5 ? 'inShirt' : 'inShirt2', { r: [1, 1, 0, 0] })); }
    L.push(r(gx, 149, gw, 1.2, 'inWood', { a: .8 }));
    if (ent) {
      // the Forum: the double-height void and its big video wall at the back, colour on it
      L.push(r(gx, 155, gw, gh - 63, 'inWall'));
      L.push(r(gx + 3, 160, gw - 6, 27, 'inScreen', { r: .6 }));
      L.push(r(gx + 3, 160, gw - 6, 27, 'inScreenB', { a: .25, shade: grain('inScreenC', .4, 'down') }));
      [['inScreenA', 9, 167, 5], ['inScreenB', 20, 173, 6.5], ['inScreenC', 33, 166, 5], ['inScreenD', 14, 181, 4], ['inScreenA', 30, 181, 3.4], ['inScreenE', 40, 177, 3.6], ['inScreenE', 25, 163, 2.4]].forEach(function (b) { L.push(c(gx + b[1], b[2], b[3], b[0], { a: .92 })); });
      L.push(r(gx + 6, 186, gw - 12, 1.2, 'inWallShade'));
      for (var px = gx + 4; px < gx + gw - 3; px += 5 + R() * 3) { var ph = 7 + R() * 3; L.push(c(px, 210 - ph - 1.6, 1.3, R() > .5 ? 'inHair' : 'inHair2')); L.push(r(px - 1.5, 210 - ph, 3, ph, R() > .5 ? 'inShirt' : 'inShirt2', { r: [1, 1, 0, 0] })); }
    } else {
      // the shop floor: oak tables with devices, people at them
      for (var tx = gx + 3; tx < gx + gw - 8; tx += 21) { L.push(r(tx, 192, 16, 1.8, 'inWood')); L.push(r(tx + 1, 193.8, 1, 8, 'inWoodD')); L.push(r(tx + 14, 193.8, 1, 8, 'inWoodD'));
        L.push(r(tx + 3, 191, 3, .9, 'inDevice')); L.push(r(tx + 9, 191, 3, .9, 'inDevice')); }
      for (var qx = gx + 5 + R() * 6; qx < gx + gw - 3; qx += 11 + R() * 9) { L.push(c(qx, 184, 1.4, R() > .5 ? 'inHair' : 'inHair2')); L.push(r(qx - 1.7, 185.6, 3.4, 9, R() > .5 ? 'inShirt' : 'inShirt2', { r: [1.2, 1.2, 0, 0] })); }
    }
    // bamboo: rooted in a white planter along the glass (over the doors in the entrance bay)
    if (ent) bamboo(L, gx, gx + gw, gy + 12, 160, R, false);
    else { bamboo(L, gx, gx + gw, gy + 12, 203, R, true); L.push(r(gx, 200, gw, 10, 'inPlanter', { shade: grain('inWallShade', .35, 'down') })); L.push(r(gx, 200, gw, 1, 'inLamp', { a: .5 })); }
    L.push(r(gx, VB - 2, gw, 2, 'inFloor'));
    // the glass and its reflections
    L.push(r(gx, gy, gw, gh, 'glassTint', { a: .14 }));
    sheen(L, gx, gy, gw, gh, { a: .16, at: .12 + (i % 3) * .14, street: true, streetA: .08 });
    if (ent) {   // the doors: a frameless glass pair with steel pulls, the Apple logo on the glass above
      L.push(r(gx + 2, 168, gw - 4, .9, 'alu', { a: .8 })); L.push(r(gx + gw / 2 - .3, 168, .6, VB - 168, 'alu', { a: .7 }));
      L.push(r(gx + gw / 2 - 2.6, 186, .7, 10, 'steel')); L.push(r(gx + gw / 2 + 1.9, 186, .7, 10, 'steel'));
      L.push(e(x + w / 2, 132, 9, 9, 'glassTint', { a: .22 })); apple(L, x + w / 2, 132, 12.5, 'logo', { a: .97 });
    }
    // the cast-aluminium frame: rounded corners, a lit top edge and a shaded right side; it stands proud of the piers
    var fr = function (A) { A.push(r(x, VT, w, 2.4, 'alu')); A.push(r(x, VB - 2.2, w, 2.2, 'aluShade')); A.push(r(x, VT, 2.4, VB - VT, 'aluLite')); A.push(r(x + w - 2.4, VT, 2.4, VB - VT, 'aluShade')); };
    fr(F);
    [[x, VT, 0], [x + w, VT, 1], [x, VB, 2], [x + w, VB, 3]].forEach(function (q) {   // corners rounded in three dimensions
      var sx = q[2] % 2 ? -1 : 1, sy = q[2] > 1 ? -1 : 1, X = q[0], Y = q[1];
      F.push(poly([X, Y, X + sx * 6, Y, X + sx * 6, Y + sy * 2.4, X + sx * 3.6, Y + sy * 2.6, X + sx * 2.6, Y + sy * 3.6, X + sx * 2.4, Y + sy * 6, X, Y + sy * 6], 'pier'));
      F.push(poly([X + sx * 6, Y + sy * 2.4, X + sx * 3.6, Y + sy * 2.6, X + sx * 2.6, Y + sy * 3.6, X + sx * 2.4, Y + sy * 6, X + sx * 1.2, Y + sy * 6, X + sx * 1.3, Y + sy * 3, X + sx * 3, Y + sy * 1.3, X + sx * 6, Y + sy * 1.2], q[2] === 3 ? 'aluShade' : 'alu'));
    });
    F.push(r(x + 6, VT + .2, w - 12, .7, 'aluLite', { a: .9 }));
  }
  make('apple-marunouchi', { seed: 1029, seenAt: '2026-10-29T12:19:00+09:00',
    place: { en: 'Apple Marunouchi', ja: 'Apple 丸の内' }, name: { en: 'Apple Marunouchi', ja: 'Apple 丸の内' }, area: { en: 'Marunouchi, Tokyo', ja: '東京・丸の内' },
    alt: 'Illustration of Apple Marunouchi on a sunny day: the white grid of the Mitsubishi Building rising out of the frame, and at its base a row of tall two-storey glass vitrines with rounded aluminium frames, bamboo planted inside each one, the white Apple logo on the entrance glass, a zebra crossing and a zelkova tree on the street.',
    palette: { sky: '#6fa9de', skyShade: '#a7cdef', sunWash: '#fff3d6', cloudLite: '#f6f9fc',
      tower: '#e6e3dc', towerShade: '#cbc7be', towerLite: '#f6f4ef', towerDeep: '#8f949a', twin: '#7489a0', twin2: '#8499ae', reflectSky: '#bcd8f0', winLit: '#7489a0',
      band: '#dedad2', bandShade: '#bdb8ae', mirror: '#8fa6a0', mirror2: '#b9cbc8',
      pier: '#ebe8e1', pierShade: '#cfcac0', pierLite: '#faf8f3', alu: '#c9cccd', aluShade: '#9fa3a6', aluLite: '#eef0f0', steel: '#7d8287', glassTint: '#6f8796', logo: '#f4f5f5',
      inWall: '#f5ebd7', inWallShade: '#dccdb2', inCeil: '#e9c78f', inCeilD: '#c49a62', inSlab: '#f6f3ec', inLamp: '#fff6df', inWood: '#c9a274', inWoodD: '#a5804f', inDevice: '#3b3d40',
      inBamboo: '#8aa35a', inBamboo2: '#a3b56a', inBambooShade: '#5f7a3c', inLeaf: '#6f9447', inLeaf2: '#8fb05a', inLeafShade: '#4d6e33', inPlanter: '#efebe2', inFloor: '#d9d2c4',
      inHair: '#2e2926', inHair2: '#5c4638', inShirt: '#3d4a5c', inShirt2: '#b9b0a2', inScreen: '#33405c', inScreenA: '#e2574c', inScreenB: '#f0b64a', inScreenC: '#4f8fd8', inScreenD: '#6cc08f', inScreenE: '#f6f0e2',
      side: '#c9c5bc', sideShade: '#b0aba1', far: '#d8cbb4', farShade: '#bfae93', farWin: '#7f8e9a', glassT: '#6f9bc7', glassT2: '#8db4dc', glassTLine: '#557ea8',
      road: '#9d9890', roadShade: '#8a857d', roadLite: '#b0aba3', zebra: '#f1efe9', zebraShade: '#d9d6cf', paveFar: '#cfcac0', kerbFar: '#b9b4aa',
      tree: '#6f8a48', tree2: '#88a35a', treeShade: '#4d6532', trunk: '#6a5848', trunkShade: '#4e4034', lampPost: '#3a3d40', lampPostShade: '#26282b', lampGlass: '#e9e6dc',
      bollard: '#5b5f63', bollardShade: '#43464a', bench: '#c9c3b8', benchShade: '#a9a297',
      amHoodie: '#2b2b2e', amPants: '#b49b74', amString: '#4a4a4e', amCrown: '#7f8d99', amFront: '#c8692f', amShoe: '#ece6d6', amSole: '#f6f1e4', amShoeMark: '#8e9296', amSock: '#a3a3a0',
      shJacket: '#a8936b', shCap: '#56704a', shLegs: '#3d4656', shShoe: '#4a4744', shSole: '#e6e1d6', beCoat: '#2d2d32', beLegs: '#7c7b79', beShoe: '#2a2a2e', beSole: '#3c3c40' },
    light: { shadowAt: [[20, 70], [250, 80]],
      morning: { set: { sky: '#a9cfee', skyShade: '#cfe3f3', sunWash: '#fff1d2', tower: '#e2e3e1', towerShade: '#c3c8cb', pier: '#e7e8e5', pierShade: '#c4c9cc', reflectSky: '#c5dcef', twin: '#6a83a0', glassT: '#86aed6', mirror: '#9fb3b3',
          amHoodie: '#2c2d31', amPants: '#ad9877', amCrown: '#7f8e9c', amFront: '#c26a36', amShoe: '#e6e4dc', amSock: '#a1a3a3',
          shJacket: '#a3916f', shCap: '#53704e', shLegs: '#3d4759', beCoat: '#26272c', beLegs: '#797b7d' },
        add: { back: [r(0, 0, 400, 92, 'sunWash', { a: .16 }), poly([0, VT - 12, 150, VT - 12, 60, 222, 0, 222], 'shadow', { a: .13 }), poly([150, VT - 12, CX + 44, VT - 12, CX + 44, 222, 60, 222], 'sunWash', { a: .1 }),
                      r(CX + 14, 0, 30, 214, 'sunWash', { a: .18 })].concat([1, 2, 3, 4, 5].map(function (i) { return r(P0 + i * PITCH + PW - 2.4, VT - 1, 2.4, VB - VT + 2, 'rim', { a: .55 }); })),
               front: [poly([150, 246, 262, 246, 318, 262, 206, 262], 'shadow', { a: .12 }), poly([40, 266, 44, 266, 150, 296, 140, 298], 'shadow', { a: .14 }), poly([368, 264, 378, 264, 400, 270, 400, 278], 'shadow', { a: .14 })] } },
      midday: { add: { back: [r(0, VT - 4, CX + 14, 4, 'shadow', { a: .22 }), r(0, 210, CX + 14, 3, 'shadow', { a: .16 })],
                       front: [e(201, 247, 64, 3, 'shadow', { a: .14 })] } },
      golden: { set: { sky: '#e9c39f', skyShade: '#f3d6b6', tower: '#ecd3b4', towerShade: '#cdb093', towerLite: '#fbe7cb', pier: '#efd8bb', pierShade: '#cfb394', pierLite: '#fde9cf', reflectSky: '#f3c99f', twin: '#7a6c78', twin2: '#9b8584',
          alu: '#e3cdb3', aluLite: '#fff0da', aluShade: '#ae9a86', mirror: '#c9a488', mirror2: '#ecc8a4', side: '#c8a98a', far: '#e6c19a', glassT: '#d9a982', glassT2: '#f2c79c', road: '#ab9580', paveFar: '#dcc2a5',
          tree: '#7f8a45', tree2: '#a3a454', amHoodie: '#352d2a', amPants: '#c6a477', amCrown: '#8f8c8e', amFront: '#d8763a', amShoe: '#f5e2c6', amSole: '#fbecd6', amSock: '#b4a596',
          shJacket: '#bb9b6a', shCap: '#617146', shLegs: '#48475a', beCoat: '#2f2828', beLegs: '#8b7b70' },
        add: { back: [r(0, 0, 400, 92, 'sunWash', { a: .3 }), poly([0, 0, 400, 0, 400, 30, 0, 92], 'sunWash', { a: .12 }), poly([0, 70, 400, 40, 400, 244, 0, 244], 'shadow', { a: .1 }), r(CX + 14, 0, 30, 214, 'shadow', { a: .14 }), r(CX + 13, 0, 1.6, 214, 'rim', { a: .7 }),
                      r(0, 0, 1.6, 214, 'rim', { a: .5 })].concat([0, 1, 2, 3, 4, 5].map(function (i) { return r(P0 + i * PITCH, VT - 1, 1.6, VB - VT + 2, 'rim', { a: .7 }); })),
               front: [poly([140, 246, 262, 246, 190, 264, 60, 264], 'shadow', { a: .12 }), poly([368, 264, 378, 264, 300, 290, 280, 290], 'shadow', { a: .14 })] } },
      night: { set: { sky: '#101629', skyShade: '#0c1122', tower: '#2b2d35', towerShade: '#1f2128', towerLite: '#383a42', towerDeep: '#0d0f14', twin: '#141a28', twin2: '#182032', reflectSky: '#232a3c', winLit: '#e8c27f',
          band: '#25272e', bandShade: '#1a1c22', mirror: '#c9a46c', mirror2: '#e6c48a', pier: '#30323a', pierShade: '#22242b', pierLite: '#4a4a50', alu: '#6c6c6e', aluShade: '#3a3a3e', aluLite: '#a89c88', steel: '#3e4044', glassTint: '#3a2a1a', logo: '#ffffff',
          side: '#22242c', sideShade: '#191b22', far: '#262833', farShade: '#1c1e27', farWin: '#e2bf82', glassT: '#151c2c', glassT2: '#1b2336', glassTLine: '#10172a',
          road: '#1b1d25', roadShade: '#15171e', roadLite: '#262833', zebra: '#4c4c52', zebraShade: '#3a3a40', paveFar: '#262832', kerbFar: '#1e2029',
          tree: '#1c2a20', tree2: '#243427', treeShade: '#111a14', trunk: '#1c1813', trunkShade: '#120f0c', lampPost: '#17181b', lampPostShade: '#0e0f11', lampGlass: '#ffe3ad',
          bollard: '#1e2024', bollardShade: '#141518', bench: '#2a2a30', benchShade: '#1e1e23',
          inWall: '#f7e3bf', inWallShade: '#dcbf90', inCeil: '#f0c682', inCeilD: '#c99a5a', inSlab: '#fbecd0', inPlanter: '#f6e4c4', inFloor: '#e6cc9f', inLeaf: '#6f8a3e', inLeaf2: '#8aa24c', inBamboo: '#93a050', inBamboo2: '#a8ad5c',
          amHoodie: '#121214', amPants: '#5a4c3a', amString: '#2c2c30', amCrown: '#39414a', amFront: '#6e3a1e', amShoe: '#8f8a80', amSole: '#a6a094', amShoeMark: '#4a4c50', amSock: '#4c4c4b',
          shJacket: '#4f4534', shCap: '#25331f', shLegs: '#151a24', shShoe: '#1e1d1c', shSole: '#6a675f', beCoat: '#0e0e10', beLegs: '#2f2f31', beShoe: '#0d0d0e', beSole: '#1a1a1c' },
        add: { over: [0, 1, 2, 3, 4].map(function (i) { return { t: 'halo', x: P0 + PW + i * PITCH + (PITCH - PW) / 2, y: 226, rx: 30, ry: 9, n: 5, fill: 'pool', a: .05 }; }).concat([{ t: 'halo', x: 165, y: 216, rx: 170, ry: 9, n: 6, fill: 'pool', a: .07 },
          { t: 'halo', x: 41, y: 138, rx: 9, ry: 9, n: 5, fill: 'lamp', a: .12 }, { t: 'halo', x: 41, y: 262, rx: 30, ry: 6, n: 5, fill: 'pool', a: .05 }, { t: 'halo', x: 200, y: 250, rx: 120, ry: 12, n: 6, fill: 'pool', a: .035 }]) } } },
    breathe: { x: 136, y: 150, w: 50, h: 60, c: 'breathe', a: .04 },
    shoppers: [{ keys: [[0, 20], [10, 128], [13, 128], [23, 20]], period: 23, foot: 216, s: .5, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', alpha: .95, shadow: false },
               { keys: [[0, 300], [8, 236], [11, 236], [19, 300]], period: 19, offset: 6, foot: 217, s: .5, coat: 'coatA', legs: 'legsDenim', hair: 'hairBrown', alpha: .95, shadow: false }],
    passersby: [{ start: 11, every: 24, dir: -1, speed: 23, foot: 285, s: 1.24, coat: 'coatC', legs: 'legsDark', hair: 'hairDark', carry: 'tote', carryC: 'bagMark' },
                { start: 15, every: 27, dir: 1, speed: 21, foot: 277, s: 1.14, coat: 'coatD', legs: 'legsDenim', hair: 'hairDark', carry: 'backpack', carryC: 'coatB' }],
    stamp: { x0: 60, x1: 316, y0: 30, y1: 272 },
    sig: { emerge: { x: 214, foot0: 226, foot1: 264, s0: .56, s1: 1.24, dur: 1.3 },
      person: { hood: true, coat: 'amHoodie', hat: false, campcap: 'amCrown', capFront: 'amFront', capBrim: 'amFront', legs: 'amPants', string: 'amString',
        shoe: 'amShoe', sole: 'amSole', shoeMark: 'amShoeMark', sock: 'amSock' },
      // with Shane (a green cap, a khaki jacket) and Bee (a black jacket); the rest of both outfits is a neutral guess
      company: [{ person: { coat: 'shJacket', long: -3, ballcap: 'shCap', hat: false, legs: 'shLegs', hair: 'hairDark', shoe: 'shShoe', sole: 'shSole', bag: false, stride: 12 }, dx: -25, dy: -2.5, ds: -.02, lag: .22 },
                { person: { coat: 'beCoat', long: -3, hat: false, legs: 'beLegs', hair: 'hairDark', shoe: 'beShoe', sole: 'beSole', bag: false, stride: 11 }, dx: 27, dy: -1.2, ds: -.05, lag: .36 }] },
    build: function (L, F, P) {
      var R = rnd(41), i, x, y;
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .25, 'down', 1.6) }));
      // beyond the corner: a glass tower in the sun and a warm stone mid-rise, under a clear sky
      L.push(r(364, 74, 36, 140, 'glassT', { shade: grain('glassTLine', .3, 'down', 1.4) })); L.push(r(364, 74, 36, 1.6, 'glassT2'));
      for (y = 78; y < 214; y += 6) L.push(r(364, y, 36, .6, 'glassTLine', { a: .7 }));
      for (x = 368; x < 400; x += 7) L.push(r(x, 74, .6, 140, 'glassTLine', { a: .6 }));
      L.push(poly([364, 76, 384, 76, 364, 130], 'glassT2', { a: .5 })); L.push(poly([372, 150, 400, 110, 400, 140, 372, 180], 'glassT2', { a: .3 }));
      L.push(e(390, 34, 9, 2.2, 'cloudLite', { a: .7 })); L.push(e(383, 37, 6, 1.6, 'cloudLite', { a: .6 }));   // one thin wisp, the only cloud
      L.push(r(344, 120, 40, 94, 'far', { shade: grain('farShade', .3, 'down') }));
      for (y = 126; y < 206; y += 11) for (x = 348; x < 382; x += 8) L.push(r(x, y, 5, 6, (R() > .8 ? 'winLit' : 'farWin'), { a: .9 }));
      // the tower: a white precast grid with deep windows running up out of the frame
      L.push(r(0, 0, CX + 14, 80, 'tower', { shade: [grain('towerShade', .25, 'down', 1.6)] }));
      var lit = rnd(53);
      for (y = 2; y < 72; y += 13) for (i = 0; i < 6; i++) for (var j = 0; j < 4; j++) {
        x = P0 + PW + i * PITCH + 2.5 + j * 11; if (x > CX - 2) continue;
        var on = lit() > .62;
        L.push(r(x, y, 8, 9, 'towerDeep', { r: 1.6 }));
        L.push(r(x + 1, y + 1.6, 6, 6.6, on ? 'winLit' : (R() > .5 ? 'twin' : 'twin2'), { r: 1.2 }));
        if (!on) L.push(poly([x + 3.6, y + 1.6, x + 7, y + 1.6, x + 7, y + 4.6], 'reflectSky', { a: .45 }));
        L.push(r(x + 1, y + 1.6, 6, 1.2, 'towerDeep', { a: .6 })); L.push(r(x, y + 9, 8, .9, 'towerLite', { a: .9 }));
      }
      for (i = 0; i <= 5; i++) { x = P0 + i * PITCH; L.push(r(x, 0, PW, 80, 'tower', { shade: grain('towerShade', .3, 'right') })); L.push(r(x, 0, 1, 80, 'towerLite')); L.push(r(x + PW - 1.4, 0, 1.4, 80, 'towerShade')); }   // the tower's piers, which come down to the street
      for (y = 11.6; y < 80; y += 13) L.push(r(0, y, CX + 14, .8, 'towerShade', { a: .55 }));
      // the corner turning away in shade, with its own narrow windows
      L.push(r(CX + 14, 0, 30, 214, 'side', { shade: grain('sideShade', .35, 'right') }));
      for (y = 2; y < 72; y += 13) { L.push(r(CX + 18, y, 5, 9, 'towerDeep', { r: 1.2 })); L.push(r(CX + 28, y, 4, 9, 'towerDeep', { r: 1.2 })); L.push(r(CX + 37, y, 3, 9, 'towerDeep', { r: 1 })); }
      // the transfer band over the store, faced in mirror panels that hold the sky and the bamboo
      L.push(r(0, 80, CX + 14, 12, 'band', { shade: grain('bandShade', .35, 'down') })); L.push(r(0, 80, CX + 14, 1, 'towerLite'));
      for (i = 0; i < 5; i++) { x = P0 + PW + i * PITCH; L.push(r(x + 2, 83, PITCH - PW - 4, 6, 'mirror', { shade: grain('mirror2', .3, 'up') })); L.push(r(x + 2, 83, PITCH - PW - 4, 1.4, 'mirror2', { a: .6 })); }
      // the vitrines between the piers
      for (i = 0; i < 5; i++) vitrine(L, F, P0 + PW + i * PITCH, PITCH - PW, i, R);
      // the piers at street level, white plaster over the tower's columns
      for (i = 0; i <= 5; i++) { x = P0 + i * PITCH; var pw = i === 5 ? CX + 14 - x : PW;
        L.push(r(x, VT - 1, pw, VB - VT + 2, 'pier', { shade: [grain('pierShade', .35, 'right', 1.4)] })); L.push(r(x, VT - 1, 1.2, VB - VT + 2, 'pierLite')); L.push(r(x + pw - 2, VT - 1, 2, VB - VT + 2, 'pierShade')); }
      // the side vitrine, foreshortened round the corner
      L.push(poly([CX + 16, VT + 4, CX + 30, VT + 8, CX + 30, VB - 2, CX + 16, VB], 'inWall', { shade: grain('inWallShade', .4, 'right') }));
      for (x = CX + 18; x < CX + 29; x += 2.6) L.push(r(x, VT + 14, .7, VB - VT - 24, 'inBamboo', { a: .8 }));
      for (i = 0; i < 9; i++) L.push(e(CX + 18 + R() * 11, VT + 16 + R() * 40, 2, .6, 'inLeaf', { rot: (R() - .5), a: .9 }));
      L.push(poly([CX + 16, VT + 4, CX + 30, VT + 8, CX + 30, VB - 2, CX + 16, VB], 'glassTint', { a: .25 }));
      L.push(poly([CX + 15, VT + 3, CX + 31, VT + 7, CX + 31, VT + 9, CX + 15, VT + 5.4], 'aluShade')); L.push(r(CX + 30, VT + 7, 1.6, VB - VT - 9, 'aluShade'));
      // the store's own pavement, granite
      L.push(r(0, 212, 400, 10, 'paveFar', { shade: grain('stoneShade', .3, 'down') })); L.push(r(0, 212, CX + 30, 1.6, 'shadow', { a: .14 }));
      for (x = 8; x < 400; x += 22) L.push(r(x, 212, .6, 10, 'stoneShade', { a: .5 }));
      L.push(r(0, 221, 400, 1.8, 'kerbFar'));
      // the street: warm stone setts, a crossing
      L.push(r(0, 222.8, 400, 21.2, 'road', { shade: [grain('roadShade', .35, 'down', 1.3), grain('roadLite', .12, 'up')] }));
      for (y = 226; y < 244; y += 4.4) L.push(r(0, y, 400, .5, 'roadShade', { a: .45 }));
      for (i = 0; i < 9; i++) { var zx = 150 + i * 14.5; L.push(poly([zx, 223.5, zx + 8, 223.5, zx + 10 + (i - 4) * .9, 243.5, zx + .6 + (i - 4) * .9, 243.5], 'zebra', { shade: grain('zebraShade', .3, 'down') })); }
      // bollards along the far kerb
      [40, 96, 300, 352].forEach(function (bx) { L.push(r(bx, 213, 2.4, 8, 'bollard', { r: [1.2, 1.2, 0, 0], shade: grain('bollardShade', .4, 'right') })); contact(L, bx + 1.2, 221, 3, .2); });
      pavement(L, F, { seed: 77, tactile: 122 });
      // a stone bench on our side of the street
      P.push(r(10, 254, 70, 5, 'bench', { shade: grain('benchShade', .35, 'down') })); P.push(r(10, 254, 70, 1, 'stoneLight', { a: .7 }));
      P.push(r(16, 259, 8, 9, 'benchShade')); P.push(r(66, 259, 8, 9, 'benchShade')); contact(P, 45, 268, 40, .16);
      // a Marunouchi street lamp: a slim dark post and its lantern
      P.push(r(40, 142, 2.6, 124, 'lampPost', { shade: grain('lampPostShade', .45, 'right') })); P.push(r(38.6, 262, 5.4, 4, 'lampPostShade')); contact(P, 41.3, 266, 6, .2);
      P.push(r(37, 132, 8.6, 10, 'lampGlass', { r: [1, 1, 2, 2] })); P.push(r(36, 130, 10.6, 2.4, 'lampPost', { r: 1 })); P.push(r(37.6, 142, 7.4, 1.6, 'lampPost'));
      P.push(r(37, 132, 2, 10, 'shadow', { a: .12 }));
      // a zelkova of Naka-dori, its crown over the corner and a cool shadow under it
      P.push(e(372, 263, 34, 4, 'shadow', { a: .16 }));
      P.push(poly([368, 264, 378, 264, 377, 120, 374, 60, 371, 120], 'trunk', { shade: grain('trunkShade', .5, 'right') }));
      P.push(line([374, 120, 352, 70, 336, 40], 'trunk', 3)); P.push(line([375, 100, 396, 56], 'trunk', 2.6)); P.push(line([362, 92, 346, 76], 'trunk', 1.6));
      crown(P, [[330, 26, 16], [352, 14, 19], [374, 8, 15], [344, 46, 13], [366, 40, 13], [318, 42, 10], [336, 2, 13], [356, 58, 9], [390, 54, 9]], ['tree', 'tree2'], 'treeShade');
      P.push(poly([CX + 14, 120, CX + 44, 104, CX + 44, 150, CX + 14, 170], 'shadow', { a: .1 }));   // the tree's shade falling across the corner
      for (i = 0; i < 14; i++) P.push(e(310 + R() * 90, 250 + R() * 40, 3 + R() * 5, 1 + R() * .8, 'shadow', { a: .08 }));   // dappled shade
    } });
})();
