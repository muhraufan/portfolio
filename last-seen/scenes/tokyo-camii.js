/* Scene — tokyo-camii. Needs /timeline/lib/last-seen.js and /timeline/scenes/_kit.js. */
(function () {
  var K = window.LastSeenKit, r = K.r, c = K.c, e = K.e, g = K.g, poly = K.poly, line = K.line, ring = K.ring, grain = K.grain, FONT = K.FONT, rnd = K.rnd;
  var make = K.make, pavement = K.pavement, bike = K.bike, crown = K.crown, branches = K.branches, contact = K.contact, vending = K.vending, plant = K.plant, sheen = K.sheen;
  // a crescent finial (alem): a gold disc bitten by the sky
  function alem(A, x, y, s) { A.push(r(x - .4 * s, y, .8 * s, 7 * s, 'gold')); A.push(c(x, y + 3 * s, 1 * s, 'gold')); A.push(c(x, y - 1.4 * s, 1.9 * s, 'gold')); A.push(c(x + .8 * s, y - 1.9 * s, 1.6 * s, 'sky')); }
  // an arched window with a grille: the arch, two mullions, a transom
  function win(A, x, y, w, h, o) { o = o || {}; A.push(r(x - .8, y - .8, w + 1.6, h + 1.6, 'whiteShade', { r: [w / 2 + .8, w / 2 + .8, 0, 0], a: .7 }));
    A.push(r(x, y, w, h, 'win', { r: [w / 2, w / 2, 0, 0], shade: grain('winShade', .3, 'down') }));
    A.push(r(x + w / 2 - .3, y + 1, .6, h - 1, 'grille', { a: .7 })); A.push(r(x, y + h * .42, w, .6, 'grille', { a: .7 }));
    if (w > 8) { A.push(r(x + w / 4 - .2, y + h * .42, .4, h * .58, 'grille', { a: .5 })); A.push(r(x + w * .75 - .2, y + h * .42, .4, h * .58, 'grille', { a: .5 })); } }
  /* ================= 3) Tokyo Camii — Yoyogi-Uehara (Oct 23, 12:20) =================
     a white Ottoman mosque: a lead-grey dome on a drum, half domes, rows of arched windows, one slender
     minaret, a bare tree, the low wall along the street */
  make('tokyo-camii', { seed: 733, seenAt: '2026-10-23T12:20:00+09:00',
    place: { en: 'Tokyo Camii', ja: '東京ジャーミイ' }, name: { en: 'Tokyo Camii', ja: '東京ジャーミイ' }, area: { en: 'Yoyogi-Uehara, Tokyo', ja: '東京・代々木上原' },
    alt: 'Illustration of Tokyo Camii in Yoyogi-Uehara: a white mosque with a grey dome, rows of arched windows and one slender minaret, a bare tree beside it, under a pale blue sky.',
    palette: { sky: '#cddbe5', skyShade: '#b6c9d6', cloud: '#f4f6f6', white: '#f1eee7', whiteShade: '#d7d2c6', whiteLight: '#fbfaf6', lead: '#b4bdc5', leadShade: '#919ca6', leadLight: '#d3d9de',
      win: '#8fa3b3', winShade: '#74899a', gold: '#c9a65a', door: '#5a4a3c', inWall: '#e2c79c',
      apt: '#dcdad4', aptShade: '#c3c0b8', aptLine: '#b3afa6', tree: '#6e625a', wall: '#e7e3da', wallShade: '#cfc9bd', railing: '#8d8c88', grille: '#5f7180', inShade: '#c4bcab', flagWhite: '#f3f0ea', ablaq: '#8e9a8a', ablaqShade: '#76836f', calli: '#c9a65a', wood: '#6d4c34', woodLine: '#8a6446', flagRed: '#c2463d', flagPole: '#b9b8b3', lampPost: '#4c4d4f', lampGlass: '#f3ead8', cypress: '#55684c', cypressShade: '#3f5139', inVend: '#f7f4ec', sunWash: '#ffc58e' },
    light: { shadowAt: [[96, 80], [300, 46]],
      golden: { set: { white: '#f6e3cc', whiteShade: '#e0c3a3', whiteLight: '#fff1de', sky: '#f0d6c0', skyShade: '#e4b99d', cloud: '#fde9d6' } },
      night: { set: { sky: '#11162a', skyShade: '#0a0e1c', cloud: '#2a3047', white: '#d9ccb4', whiteShade: '#b2a38a', whiteLight: '#efe3cc', lead: '#5e6470', leadShade: '#444a55', leadLight: '#7d838e',
          win: '#e6b874', winShade: '#c9954f', gold: '#f0c878', wall: '#3a3732', wallShade: '#2b2925', tree: '#2a2420', ablaq: '#6d7266', ablaqShade: '#575c51', grille: '#7a5a30', calli: '#f0c878', wood: '#4a3424', lampGlass: '#ffe3ad', flagRed: '#7e2e28', cypress: '#1e271f', cypressShade: '#151c16' },
        add: { back: [{ t: 'halo', x: 205, y: 232, rx: 130, ry: 34, n: 7, fill: 'haze', a: .02 }],
          over: [{ t: 'halo', x: 210, y: 190, rx: 120, ry: 70, n: 6, fill: 'pool', a: .02 }, { t: 'halo', x: 88, y: 92, rx: 16, ry: 10, n: 4, fill: 'lamp', a: .05 }, { t: 'halo', x: 334, y: 172, rx: 30, ry: 30, n: 6, fill: 'haze', a: .045 }, { t: 'halo', x: 334, y: 252, rx: 40, ry: 9, n: 5, fill: 'pool', a: .04 }] } } },
    breathe: { x: 186, y: 196, w: 28, h: 36 },
    passersby: [{ start: 6, every: 24, dir: -1, speed: 26, foot: 286, s: 1.24, coat: 'coatD', legs: 'legsDark', hair: 'hairBrown', skirt: true, skirtC: 'legsDark', longHair: true }],
    anim: [{ layer: 'front', draw: function (f, t, pal, v) {          // two flags lifting a little in the breeze
      [[151, 'flagRed', 'flagWhite', 0], [251, 'flagWhite', 'flagRed', 1.3]].forEach(function (q) { var x = q[0], y = 151, W = 17, H = 11;
        f.fillStyle = pal[q[1]]; f.globalAlpha = v === 'night' ? .75 : 1; f.beginPath(); f.moveTo(x, y);
        for (var i = 0; i <= 6; i++) { var u = i / 6; f.lineTo(x + u * W, y + Math.sin(t * 1.6 + q[3] - u * 3) * 1.3 * u); }
        for (var j = 6; j >= 0; j--) { var w = j / 6; f.lineTo(x + w * W, y + H + Math.sin(t * 1.6 + q[3] - w * 3) * 1.3 * w); }
        f.closePath(); f.fill(); var m = Math.sin(t * 1.6 + q[3] - 1.5) * .65; f.fillStyle = pal[q[2]]; f.beginPath();
        if (q[3]) f.arc(x + W / 2, y + H / 2 + m, 3, 0, Math.PI * 2); else { f.arc(x + 7, y + H / 2 + m, 3.2, 0, Math.PI * 2); f.fill(); f.fillStyle = pal[q[1]]; f.beginPath(); f.arc(x + 8, y + H / 2 + m, 2.6, 0, Math.PI * 2); f.fill(); f.fillStyle = pal[q[2]]; f.beginPath(); f.arc(x + 12, y + H / 2 + m, 1.1, 0, Math.PI * 2); }
        f.fill(); }); } }, { layer: 'back', draw: function (f, t, pal, v) {          // one small cloud, drifting very slowly
      var x = ((t * 2.2 + 120) % 560) - 80; f.globalAlpha = v === 'night' ? .35 : .8; f.fillStyle = pal.cloud;
      [[0, 0, 22, 6], [14, -4, 14, 7], [-12, -2, 12, 5], [28, 1, 12, 4.5]].forEach(function (b) { f.beginPath(); f.ellipse(x + b[0], 34 + b[1], b[2], b[3], 0, 0, Math.PI * 2); f.fill(); }); } }],
    sig: { emerge: { x: 200, foot0: 231, foot1: 264 } },
    build: function (L, F, P) {
      L.push(r(0, 0, 400, 244, 'sky', { shade: grain('skyShade', .14, 'up', 1.6) }));
      // a block of flats on the right edge, balconies not quite matching, the city beyond the mosque
      L.push(r(346, 62, 54, 182, 'apt', { shade: grain('aptShade', .3, 'left') }));
      for (var ay = 74, n = 0; ay < 236; ay += 16, n++) { L.push(r(346, ay, 54, 2, 'aptLine')); L.push(r(352 + (n % 3) * 3, ay - 9, 10, 7, n % 3 === 1 ? 'aptLine' : 'win', { a: .5 })); L.push(r(374 - (n % 2) * 4, ay - 9, 12, 7, n % 4 === 2 ? 'win' : 'aptLine', { a: n % 4 ? .45 : .3 })); }
      // minaret: a slim fluted shaft, the şerefe balcony on its corbels with a railing, the upper shaft, a lead cone, the crescent
      L.push(r(83.5, 108, 11, 130, 'white', { shade: grain('whiteShade', .35, 'right', 1.4) }));
      for (var fx = 85.5; fx < 94; fx += 2.6) L.push(r(fx, 110, .5, 124, 'whiteShade', { a: .5 }));
      L.push(r(82, 104, 14, 4, 'whiteLight')); L.push(r(82, 236, 14, 4, 'whiteShade'));
      L.push(r(85.5, 56, 7, 40, 'white', { shade: grain('whiteShade', .35, 'right', 1.4) }));
      for (var mq = 0; mq < 5; mq++) L.push(poly([80.6 + mq * 3.4, 94, 84 + mq * 3.4, 94, 82.3 + mq * 3.4, 99.6], 'whiteShade'));  // muqarnas under the balcony
      L.push(r(79, 92, 20, 3, 'whiteLight')); L.push(r(79.6, 86.6, 18.8, .9, 'railing')); for (var rp = 80.4; rp < 98.6; rp += 2.4) L.push(r(rp, 86.6, .5, 5.4, 'railing', { a: .8 }));
      L.push(r(87.2, 70, 3.6, 7, 'win', { r: [1.8, 1.8, 0, 0] })); L.push(r(87.2, 112, 3.6, 8, 'win', { r: [1.8, 1.8, 0, 0], a: .8 }));
      L.push(r(84.5, 54, 9, 3, 'whiteLight'));
      L.push(poly([84.6, 54, 93.4, 54, 89, 16], 'lead', { shade: grain('leadShade', .45, 'right') })); alem(L, 89, 8, .8);
      // a dark cypress behind the minaret's foot, against the white
      L.push(e(70, 200, 9, 34, 'cypress', { shade: grain('cypressShade', .5, 'right') }));
      // the dome on its drum of windows, ribbed lead, the crescent; corner turrets
      L.push(e(200, 118, 46, 42, 'lead', { shade: [grain('leadShade', .5, 'right', 1.2), grain('leadLight', .18, 'up', 2)] }));
      for (var rb = -3; rb <= 3; rb++) L.push(line([200 + rb * 13, 113, 200 + rb * 9.6, 92, 200 + rb * 4, 78], 'leadShade', .5, { a: .45 }));
      L.push(r(152, 112, 96, 40, 'white', { shade: grain('whiteShade', .3, 'right', 1.5) }));
      L.push(r(150, 110, 100, 4, 'whiteLight'));
      for (var dx = 159, k = 0; dx < 244; dx += 12, k++) win(L, dx, 121, 6, 15);
      [[150, 106], [250, 106]].forEach(function (t) { L.push(r(t[0] - 4, t[1], 8, 10, 'white', { shade: grain('whiteShade', .3, 'right') })); L.push(poly([t[0] - 4.4, t[1], t[0] + 4.4, t[1], t[0], t[1] - 10], 'lead', { shade: grain('leadShade', .4, 'right') })); L.push(r(t[0] - .3, t[1] - 13, .6, 3, 'gold')); });
      alem(L, 200, 64, 1.1);
      // the half domes either side, the small domes over the corners
      [[140, 152, 22], [260, 152, 22]].forEach(function (d) { L.push(e(d[0], d[1], d[2], 16, 'lead', { shade: grain('leadShade', .45, 'right') })); L.push(line([d[0] - 12, 146, d[0], 137, d[0] + 12, 146], 'leadShade', .5, { a: .4 })); });
      [[124, 150], [276, 150]].forEach(function (d) { L.push(r(d[0] - 6, 150, 12, 10, 'white')); L.push(e(d[0], 150, 7, 7, 'lead', { shade: grain('leadShade', .45, 'right') })); alem(L, d[0], 137, .55); });
      // the prayer hall: white walls, rows of arched grilled windows
      L.push(r(112, 152, 176, 84, 'white', { shade: grain('whiteShade', .3, 'right', 1.6) }));
      L.push(r(110, 150, 180, 4, 'whiteLight')); L.push(r(112, 186, 176, 2, 'whiteShade', { a: .7 }));
      for (var wx = 121; wx < 284; wx += 20) { if (wx > 166 && wx < 230) continue; win(L, wx, 160, 9, 20); }
      // the portico: three striped (ablaq) arches across the front, the portal rising in the middle
      L.push(r(118, 190, 164, 46, 'whiteShade', { a: .55 }));
      [[126, 24], [154, 24], [246, 24]].forEach(function (a2) { var x = a2[0], w = a2[1], cx = x + w / 2;
        L.push(r(x, 200, w, 36, 'inShade', { r: [w / 2, w / 2, 0, 0] }));
        for (var v = 0; v < 9; v++) { var a0 = Math.PI + v * Math.PI / 9, a1 = a0 + Math.PI / 9, R0 = w / 2, R1 = w / 2 + 3.4;
          L.push(poly([cx + Math.cos(a0) * R0, 212 + Math.sin(a0) * R0, cx + Math.cos(a0) * R1, 212 + Math.sin(a0) * R1, cx + Math.cos(a1) * R1, 212 + Math.sin(a1) * R1, cx + Math.cos(a1) * R0, 212 + Math.sin(a1) * R0], v % 2 ? 'ablaq' : 'whiteLight')); }
        L.push(r(x - 1.6, 212, 3.2, 24, 'whiteLight')); L.push(r(x + w - 1.6, 212, 3.2, 24, 'whiteLight')); });
      // the portal: a tall frame, the gold calligraphy band, the carved wooden door under a striped arch
      L.push(r(180, 152, 40, 84, 'whiteLight', { shade: grain('whiteShade', .2, 'right', 1.6) }));
      L.push(r(183, 156, 34, 6, 'calli', { a: .3 })); for (var cl = 185; cl < 215; cl += 3.6) L.push(r(cl, 157.4 + (cl % 2), 2 + (cl % 1.5), 1, 'calli'));
      L.push(r(184, 166, 32, 70, 'white', { r: [16, 16, 0, 0] }));
      for (var v2 = 0; v2 < 11; v2++) { var b0 = Math.PI + v2 * Math.PI / 11, b1 = b0 + Math.PI / 11;
        L.push(poly([200 + Math.cos(b0) * 12, 194 + Math.sin(b0) * 12, 200 + Math.cos(b0) * 15.6, 194 + Math.sin(b0) * 15.6, 200 + Math.cos(b1) * 15.6, 194 + Math.sin(b1) * 15.6, 200 + Math.cos(b1) * 12, 194 + Math.sin(b1) * 12], v2 % 2 ? 'ablaq' : 'whiteLight')); }
      L.push(r(188, 182, 24, 54, 'inWall', { r: [12, 12, 0, 0] }));
      L.push(r(190, 196, 20, 40, 'wood', { r: [3, 3, 0, 0] })); L.push(r(199.6, 196, .8, 40, 'woodLine'));
      [[191.6, 199], [201.6, 199], [191.6, 213], [201.6, 213]].forEach(function (q) { L.push(r(q[0], q[1], 6.8, 11, 'woodLine', { r: .6, a: .7 })); L.push(poly([q[0] + 3.4, q[1] + 2, q[0] + 5.8, q[1] + 5.5, q[0] + 3.4, q[1] + 9, q[0] + 1, q[1] + 5.5], 'wood')); });
      L.push(r(190, 183, 20, 11, 'win', { r: [10, 10, 0, 0] })); L.push(r(199.7, 183, .6, 11, 'grille'));
      // the bare tree on the left, finely branched
      L.push(line([44, 244, 46, 214, 47, 194], 'tree', 3.6));
      branches(L, 47, 196, -1.66, 24, 2.6, 5, rnd(7), 'tree'); branches(L, 46, 214, -2.3, 18, 1.6, 4, rnd(19), 'tree'); branches(L, 47, 204, -.9, 16, 1.4, 4, rnd(23), 'tree');
      pavement(L, F, { seed: 7330, manhole: [300, 284, 15], tactile: 236 });
      // the low wall along the street: stone coping, iron railing with small finials, gate piers with lanterns
      F.push(r(0, 228, 182, 16, 'wall', { shade: grain('wallShade', .3, 'down') })); F.push(r(218, 228, 182, 16, 'wall', { shade: grain('wallShade', .3, 'down') }));
      F.push(r(0, 226, 182, 2.4, 'whiteLight')); F.push(r(218, 226, 182, 2.4, 'whiteLight'));
      for (var jw = 22; jw < 400; jw += 36 + (jw % 7)) { if (jw > 172 && jw < 226) continue; F.push(r(jw, 230, .7, 14, 'wallShade', { a: .6 })); }
      for (var px = 8; px < 400; px += 7) { if (px > 176 && px < 222) continue; F.push(r(px, 214, 1, 12, 'railing')); if (px % 14 === 1) F.push(c(px + .5, 213.4, 1, 'railing')); }
      F.push(r(0, 213, 180, 1.4, 'railing')); F.push(r(220, 213, 180, 1.4, 'railing')); F.push(r(0, 222, 180, .9, 'railing')); F.push(r(220, 222, 180, .9, 'railing'));
      [176, 218].forEach(function (gx) { F.push(r(gx, 206, 6, 38, 'white', { shade: grain('whiteShade', .3, 'right') })); F.push(r(gx - 1, 204, 8, 2.4, 'whiteLight')); F.push(r(gx + 1.2, 196, 3.6, 8, 'lampGlass', { r: [1.8, 1.8, .4, .4] })); F.push(r(gx + .6, 195, 4.8, 1.2, 'lampPost')); });
      // flagpoles inside the wall
      F.push(r(150, 150, 1, 64, 'flagPole')); F.push(r(250, 150, 1, 64, 'flagPole'));
      // a street lamp at the kerb, and a drinks machine by the flats
      P.push(r(333, 172, 2.2, 74, 'lampPost')); P.push(line([334, 172, 334, 166, 328, 162], 'lampPost', 1.6)); P.push(r(323.4, 161, 9, 3, 'lampPost', { r: [1.6, 1.6, 0, 0] })); P.push(r(324.4, 164, 7, 1.2, 'lampGlass'));
      contact(P, 334, 246, 6, .16);
      vending(P, 360, 246, { seed: 77, w: 24, h: 44 });
    } });
})();
