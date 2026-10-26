/* Scene: niko and ... Shibuya — front elevation. All geometry is in a
   400 × 300 unit box. Add a place by writing another file like this one,
   with a `day` and a `night` variant (palette + night-only lights);
   the page shows whichever scene has the newest `seenAt`. */
(function () {
  var L = [], F = [], P = [];          // back, facade, front (planters)
  var r = function (x, y, w, h, fill, o) { return Object.assign({ t: 'rect', x: x, y: y, w: w, h: h, fill: fill }, o || {}); };
  var c = function (x, y, rr, fill, o) { return Object.assign({ t: 'circle', x: x, y: y, r: rr, fill: fill }, o || {}); };
  var g = function (x, y, rr, fill, o) { return Object.assign({ t: 'glow', x: x, y: y, r: rr, fill: fill }, o || {}); };
  var grain = function (c, d, dir, p) { return { c: c, d: d, dir: dir || 'flat', p: p }; };

  /* ---------- back: sky, building above, fascia, interior, sidewalk ---------- */
  L.push(r(0, 0, 400, 40, 'sky', { shade: grain('skyShade', .25, 'down') }));
  L.push(r(196, 0, 128, 34, 'bldg', { shade: grain('bldgShade', .3, 'down') }));       // building behind the glass roof
  for (var wy = 4; wy < 30; wy += 9) L.push(r(202, wy, 116, 4, 'bldgWin', { a: .9 }));
  L.push(r(328, 0, 72, 34, 'bldg2', { shade: grain('bldgShade', .25, 'left') }));
  // steel V struts of the canopy
  [80, 200, 320].forEach(function (x) {
    L.push({ t: 'poly', pts: [x - 3, 38, x + 3, 38, x - 40, -2, x - 46, -2], fill: 'steel' });
    L.push({ t: 'poly', pts: [x - 3, 38, x + 3, 38, x + 46, -2, x + 40, -2], fill: 'steel' });
  });
  L.push(r(0, 33, 400, 6, 'steel'));
  // fascia + sign
  L.push(r(0, 38, 400, 48, 'fascia', { shade: grain('fasciaShade', .35, 'down') }));
  L.push({ t: 'text', text: 'niko and', x: 262, y: 72.5, size: 30, weight: 600, font: '"Plus Jakarta Sans", system-ui, sans-serif', fill: 'sign', align: 'right', ls: .2, glow: 'signGlow', blur: 5 });
  [270.5, 279.5, 288.5].forEach(function (x) { L.push(c(x, 70, 2.6, 'sign')); });
  // soffit with downlights
  L.push(r(0, 86, 400, 9, 'soffit'));
  for (var dx = 30; dx < 400; dx += 42) { L.push(g(dx, 95, 7, 'downlight', { d: .35, sy: .55 })); L.push(r(dx - 2, 93, 4, 1.4, 'downlight')); }
  // interior (seen through the open doors and the side panes)
  L.push(r(40, 95, 320, 144, 'wall', { shade: grain('wallShade', .35, 'down', 2.2) }));
  L.push(r(40, 95, 320, 16, 'ceiling', { shade: grain('wallShade', .25, 'down') }));
  L.push(r(60, 102, 120, 5, 'duct', { r: 2.5 })); L.push(r(206, 100, 140, 6, 'duct', { r: 3 }));
  // left shelving (behind the left pane, continuing into the doorway)
  function shelf(x, y, w, h, seed) {
    L.push(r(x, y, w, h, 'wood', { shade: grain('woodShade', .25, 'right', 1.4) }));
    L.push(r(x + 2, y + 2, w - 4, h - 4, 'woodBack', { shade: grain('woodShade', .2, 'down') }));
    var cols = ['prod1', 'prod2', 'prod3', 'prod4', 'prod5'], n = 0;
    for (var py = y + 4; py < y + h - 8; py += 18) {
      L.push(r(x + 1, py + 13, w - 2, 2.4, 'woodLight'));
      for (var px = x + 4; px < x + w - 7; ) {
        var bw = 3 + ((seed * 7 + n * 13) % 5), bh = 6 + ((seed + n * 5) % 6);
        if ((seed + n) % 4) L.push(r(px, py + 13 - bh, bw, bh, cols[(seed + n) % 5], { r: .6 }));
        px += bw + 1.6; n++;
      }
    }
  }
  shelf(54, 114, 58, 108, 1);
  shelf(128, 118, 40, 104, 3);
  shelf(294, 114, 58, 108, 2);
  // back wall: lit wooden panel with a tiny sign, plants, pendants
  L.push(r(188, 124, 40, 76, 'woodLight', { shade: grain('woodShade', .35, 'down') }));
  for (var pl = 132; pl < 196; pl += 9) L.push(r(190, pl, 36, 1, 'wood', { a: .6 }));
  L.push(r(196, 128, 24, 4, 'fascia', { r: 1 }));
  L.push(r(176, 164, 10, 14, 'pot', { r: 1.5 }));
  L.push(c(178, 156, 8.5, 'plant', { shade: grain('plantShade', .7, 'br', 1.2) }));
  L.push(c(186, 150, 7, 'plant2', { shade: grain('plantShade', .6, 'br', 1.2) }));
  L.push(c(172, 147, 6, 'plant2', { shade: grain('plantShade', .6, 'br', 1.2) }));
  L.push(r(262, 170, 9, 12, 'pot', { r: 1.5 }));
  L.push(c(266, 160, 8, 'plant', { shade: grain('plantShade', .7, 'br', 1.2) }));
  L.push(c(260, 154, 5.5, 'plant2', { shade: grain('plantShade', .6, 'br', 1.2) }));
  // clothes rail
  L.push(r(230, 138, 32, 1.6, 'steel'));
  ['prod4', 'prod2', 'prod1', 'prod5', 'prod3'].forEach(function (k, i) {
    L.push(r(232 + i * 6, 139.5, 5.2, 26 + (i % 2) * 6, k, { r: [1, 1, .8, .8], shade: grain('woodShade', .18, 'right') }));
  });
  // stepped crate display
  L.push(r(190, 206, 58, 16, 'wood', { shade: grain('woodShade', .45, 'down') }));
  L.push(r(198, 196, 42, 10, 'woodLight', { shade: grain('woodShade', .35, 'down') }));
  L.push(r(206, 188, 26, 8, 'wood', { shade: grain('woodShade', .4, 'down') }));
  [[200, 192, 'prod3'], [212, 183, 'prod4'], [222, 184, 'prod2'], [232, 191, 'prod1']].forEach(function (p) { L.push(r(p[0], p[1], 6, 5, p[2], { r: .8 })); });
  // pendants
  [[150, 118], [210, 114], [252, 120]].forEach(function (p) {
    L.push(r(p[0] - .3, 95, .6, p[1] - 97, 'steel')); L.push(g(p[0], p[1] + 2, 16, 'downlight', { d: .22 }));
    L.push(c(p[0], p[1], 2.6, 'downlight'));
  });
  // floor + mat
  L.push(r(40, 222, 320, 17, 'floor', { shade: grain('floorShade', .45, 'down', 1.2) }));
  L.push(r(162, 231, 78, 6, 'mat', { r: 1 }));
  // sidewalk tiles (rows grow toward the viewer for a hint of depth)
  L.push(r(0, 239, 400, 61, 'joint'));
  var rows = [[241, 11, 0], [253, 13, 18], [267, 15, 6], [283, 18, 26]];
  rows.forEach(function (row, ri) {
    for (var x = -row[2]; x < 400; x += 50) {
      L.push(r(x + .6, row[0], 49, row[1] - 1.2, ((x / 50 + ri) | 0) % 3 ? 'tile' : 'tile2', { shade: grain('tileShade', .22, 'down', 1.4) }));
    }
  });
  L.push(g(204, 246, 70, 'spill', { d: .16, sx: 1.5, sy: .22 }));    // light from the door on the pavement

  /* ---------- facade: steel frame, open doors, glass, walls, trunks ---------- */
  F.push(r(0, 95, 20, 144, 'stone', { shade: grain('stoneShade', .35, 'right') }));
  F.push(r(380, 95, 20, 144, 'stone', { shade: grain('stoneShade', .35, 'left') }));
  F.push(r(20, 95, 20, 144, 'steel', { shade: grain('steelShade', .5, 'right') }));
  F.push(r(360, 95, 20, 144, 'steel', { shade: grain('steelShade', .5, 'left') }));
  F.push(r(40, 95, 320, 5, 'steel'));
  // side panes: tinted glass + a soft reflection
  [[40, 78], [282, 78]].forEach(function (p) {
    F.push(r(p[0], 100, p[1], 136, 'glass', { a: .5 }));
    F.push({ t: 'poly', pts: [p[0] + 10, 100, p[0] + 34, 100, p[0] + 4, 236, p[0], 236, p[0], 150], fill: 'glassLight', a: .16 });
    F.push(r(p[0], 204, p[1], 2.5, 'steel'));
    F.push(r(p[0], 206.5, p[1], 29.5, 'woodDoor', { shade: grain('doorShade', .22, 'down') }));
  });
  F.push(r(118, 95, 6, 144, 'steel')); F.push(r(276, 95, 6, 144, 'steel'));
  // the double doors, swung open toward us
  F.push({ t: 'poly', pts: [124, 100, 143, 106, 143, 232, 124, 238], fill: 'steel' });
  F.push({ t: 'poly', pts: [127, 104, 140, 108.5, 140, 186, 127, 184], fill: 'glassDoor', a: .8 });
  F.push({ t: 'poly', pts: [276, 100, 257, 106, 257, 232, 276, 238], fill: 'steel' });
  F.push({ t: 'poly', pts: [273, 104, 260, 108.5, 260, 186, 273, 184], fill: 'glassDoor', a: .8 });
  F.push(r(40, 236, 320, 4, 'steel'));                                  // threshold
  // small touches that hold up when the scene is big: shop hours on the glass, a chalk board out front
  F.push({ t: 'text', text: 'OPEN 11:00 – 21:00', x: 323, y: 109.6, size: 4.1, weight: 500, font: '"Plus Jakarta Sans", system-ui, sans-serif', fill: 'sign', align: 'center', ls: .5, a: .75 });
  F.push(r(303, 111.2, 40, .4, 'sign', { a: .4 }));
  F.push({ t: 'poly', pts: [84, 234, 87.5, 234, 82.5, 262, 79.5, 262], fill: 'woodShade' });
  F.push({ t: 'poly', pts: [99.5, 234, 103, 234, 108, 262, 105, 262], fill: 'woodShade' });
  F.push(r(80.5, 233, 26, 22, 'wood', { r: 1, shade: grain('woodShade', .3, 'down') }));
  F.push(r(82.5, 235, 22, 18, 'fascia', { r: .6 }));
  F.push({ t: 'text', text: 'new in', x: 93.5, y: 242, size: 4.4, weight: 500, font: '"Plus Jakarta Sans", system-ui, sans-serif', fill: 'sign', align: 'center', a: .85 });
  F.push(r(86.5, 245.5, 14, .5, 'sign', { a: .5 })); F.push(r(88.5, 248.5, 10, .5, 'sign', { a: .4 }));
  F.push({ t: 'ellipse', x: 93.5, y: 262.5, rx: 15, ry: 1.6, fill: 'shadow', a: .12 });
  F.push({ t: 'ellipse', x: 33, y: 249, rx: 34, ry: 3.2, fill: 'shadow', a: .14 });
  F.push({ t: 'ellipse', x: 367, y: 249, rx: 34, ry: 3.2, fill: 'shadow', a: .14 });
  [[30, 176], [362, 176]].forEach(function (p) {
    F.push(r(p[0], p[1], 8, 30, 'trunk', { r: [2, 2, 0, 0], shade: grain('trunkShade', .7, 'right', 1.2) }));
  });

  /* ---------- front: wooden planters ---------- */
  [[4, 58], [338, 58]].forEach(function (p, i) {
    P.push(r(p[0], 198, p[1], 50, 'planter', { r: 1.2, shade: grain('planterShade', .3, i ? 'left' : 'right', 1.3) }));
    for (var y = 205; y < 246; y += 7) P.push(r(p[0], y, p[1], .9, 'planterShade', { a: .55 }));
    P.push(r(p[0] - 1, 196, p[1] + 2, 4, 'planterLight', { r: 1 }));
  });

  function agave(x, y) {
    var leaves = [], n = 19;
    for (var i = 0; i < n; i++) {
      var u = i / (n - 1) * 2 - 1;                       // -1 … 1, left to right
      leaves.push({ ang: u * 84 + (i % 2 ? 3 : -2), len: 52 - Math.abs(u) * 20 + (i % 3) * 2.5, w: 4.2, c: i % 2 ? 'agave' : 'agave2', side: u });
    }
    // draw the outer (lower) leaves first so the crown sits on top
    leaves.sort(function (a, b) { return Math.abs(b.ang) - Math.abs(a.ang); });
    return { x: x, y: y, leaves: leaves, amp: 1.5, rate: .8 };
  }

  var light = {
    signGlow: 'rgba(0,0,0,0)',
    sky: '#e4e8e7', skyShade: '#cdd5d5', bldg: '#d8dad6', bldg2: '#e2e3df', bldgWin: '#c6ccce', bldgShade: '#b9bfbd',
    steel: '#36373a', steelShade: '#202124', fascia: '#2a2827', fasciaShade: '#1a1918', sign: '#f7f4ee',
    soffit: '#3a3532', downlight: '#ffd998',
    wall: '#f0e2ca', wallShade: '#dcc39f', ceiling: '#ebe6dc', duct: '#ddd6ca',
    wood: '#c18c5d', woodBack: '#a9764b', woodShade: '#8a5c38', woodLight: '#dcab7a', woodDoor: '#c99a6d', doorShade: '#8a5c38',
    plant: '#86a06f', plant2: '#9bb383', plantShade: '#5f7b50', pot: '#d9cbb6',
    prod1: '#ead0b4', prod2: '#adbfaa', prod3: '#dc9f84', prod4: '#f5efe3', prod5: '#93a0b3',
    floor: '#d1b088', floorShade: '#b28c63', mat: '#6e6872',
    glass: '#8fa3a8', glassLight: '#ffffff', glassDoor: '#a9bbbe',
    stone: '#d6d3cd', stoneShade: '#bcb8b1', trunk: '#8f806d', trunkShade: '#66594b',
    joint: '#bdb9b2', tile: '#d5d2cb', tile2: '#cfcbc4', tileShade: '#b3aea6', spill: '#f6ead6',
    planter: '#b86f44', planterShade: '#8e512f', planterLight: '#cf8a5d',
    agave: '#a6bbae', agave2: '#95ad9f', agaveShade: '#6b8679', agaveLight: '#e0e9e2',
    shadow: '#3a2e25', breathe: '#ffcf8f',
    coatA: '#ebe4d6', coatB: '#7c90a7', coatC: '#c98265', coatD: '#66705f', hoodie: '#a7a198',
    legsDark: '#3a3836', legsDenim: '#58657c', hairDark: '#2e2926', hairBrown: '#5c4638',
    hat: '#f1e9d4', bag: '#c9a06b', bagMark: '#f6f1e7', skin: '#d6b394',
    rim: '#fff2d8',
    // the back of the postcard
    paper: '#f3ebdd', paperShade: '#dfcfb6', paperShade2: '#e9dcc6', paperInk: '#2a2827', paperLine: '#c9b99f', paperGlow: '#fff6e6'
  };

  function tone(base, over) { return Object.assign({}, base, over); }

  /* ---------- morning: cool, soft, the shop just opening ---------- */
  var morning = tone(light, {
    sky: '#dfe6ea', skyShade: '#c8d3d9', bldg: '#d3d8da', bldg2: '#dde1e2', bldgWin: '#bfc9cf', bldgShade: '#b2bcc0',
    sign: '#eef0ee', downlight: '#ffe6b8',
    wall: '#ece2d0', wallShade: '#d6c4a7', ceiling: '#e8e5de', duct: '#d8d4cc',
    stone: '#d0d2d0', stoneShade: '#b4b9b9', joint: '#b4b7b6', tile: '#cfd1cf', tile2: '#c9ccca', tileShade: '#adb2b2', spill: '#eef0ea',
    glass: '#8aa0aa', glassDoor: '#a3b6bc', glassLight: '#ffffff',
    planter: '#ad6c47', planterShade: '#86502f', planterLight: '#c38662',
    agave: '#9fb5ab', agave2: '#8faa9d', agaveShade: '#64807a', agaveLight: '#dfe9e6',
    shadow: '#33404a', breathe: '#ffe1b0', shutter: '#9aa0a3', shutterLine: '#7f8588',
    paper: '#f1ede4', paperShade: '#d9d4c8', paperShade2: '#e6e1d6', paperInk: '#2b2d30', paperLine: '#c4c0b5'
  });
  var morningAdd = { back: [], facade: [] };
  // long, soft shadows: low sun from the left, stretching right along the pavement
  [[4, 62], [338, 62]].forEach(function (p) { morningAdd.back.push({ t: 'poly', pts: [p[0] + 20, 245, p[0] + p[1], 245, p[0] + p[1] + 104, 254, p[0] + 44, 254], fill: 'shadow', a: .15 }); });
  morningAdd.back.push({ t: 'poly', pts: [104, 259, 108, 263, 168, 266, 150, 259], fill: 'shadow', a: .14 });
  // the shutter is still half rolled up over the doorway
  morningAdd.facade.push(r(143, 100, 114, 14, 'shutter', { shade: grain('shutterLine', .35, 'down') }));
  for (var sy = 102; sy < 114; sy += 3) morningAdd.facade.push(r(143, sy, 114, .6, 'shutterLine', { a: .7 }));
  morningAdd.facade.push(r(143, 113, 114, 1.4, 'steel'));

  /* ---------- golden hour: low warm sun, long diagonal shadows, lights just coming on ---------- */
  var golden = tone(light, {
    signGlow: 'rgba(255, 226, 180, 0.45)', litWin: '#f6cf8f', litWin2: '#efdcb4',
    sky: '#f2d8c2', skyShade: '#e5b99c', bldg: '#e3cbb5', bldg2: '#ead6c1', bldgWin: '#d2b8a2', bldgShade: '#c9a58b',
    sign: '#fff4e2', downlight: '#ffd28a',
    wall: '#f3ddbd', wallShade: '#dfbd8f', ceiling: '#efe3cf',
    stone: '#dfcab3', stoneShade: '#c4a68a', joint: '#c4ab93', tile: '#dcc6af', tile2: '#d6bfa7', tileShade: '#bb9e83', spill: '#fbe3c2',
    glass: '#a3958a', glassLight: '#ffe6c4', glassDoor: '#b9a893',
    planter: '#bf7140', planterShade: '#8f4f2b', planterLight: '#e09461',
    agave: '#a9b59c', agave2: '#9aa98f', agaveShade: '#6d7c68', agaveLight: '#f6d4a4',
    shadow: '#5a3520', breathe: '#ffc883', rim: '#ffd9a3', sunWash: '#ffc58e',
    paper: '#f6e6d0', paperShade: '#e4c6a3', paperShade2: '#eed8bc', paperInk: '#36271e', paperLine: '#d4b792'
  });
  var goldenAdd = { back: [], facade: [], over: [] };
  // sun low from the right: long shadows reaching left and toward us
  [[4, 62], [338, 62]].forEach(function (p) { goldenAdd.back.push({ t: 'poly', pts: [p[0] + 4, 245, p[0] + p[1], 245, p[0] + 14, 272, p[0] - 84, 272], fill: 'shadow', a: .17 }); });
  goldenAdd.back.push({ t: 'poly', pts: [80, 261, 106, 261, 78, 280, 40, 280], fill: 'shadow', a: .15 });
  [[118, 6], [276, 6]].forEach(function (p) { goldenAdd.back.push({ t: 'poly', pts: [p[0], 241, p[0] + p[1], 241, p[0] - 34, 266, p[0] - 46, 266], fill: 'shadow', a: .12 }); });
  // a couple of windows upstairs and the sign just coming on
  [[258, 13, 16, 'litWin2'], [292, 4, 20, 'litWin']].forEach(function (w) { goldenAdd.back.push(r(w[0], w[1], w[2], 4, w[3], { a: .75 })); });
  goldenAdd.back.push({ t: 'text', text: 'niko and', x: 262, y: 72.5, size: 30, weight: 600, font: '"Plus Jakarta Sans", system-ui, sans-serif', fill: 'sign', align: 'right', ls: .2, glow: 'signGlow', blur: 4 });
  [270.5, 279.5, 288.5].forEach(function (x) { goldenAdd.back.push(c(x, 70, 2.6, 'sign')); });
  // warm light raking across the facade from the right
  goldenAdd.over.push({ t: 'poly', pts: [400, 30, 400, 120, 120, 300, 0, 300, 0, 260], fill: 'sunWash', a: .09 });

  /* ---------- night: same place after dark ---------- */
  var night = {
    signGlow: 'rgba(255, 236, 200, 0.85)', bloom: '#fff1d6', litWin: '#f3c47c', litWin2: '#e7d6b0', pole: '#0b0c10', lamp: '#ffe3ad', pool: '#ffc77a', poolGrain: '#c99a5e', haze: '#ffb866', rim: '#ffd497',
    sky: '#11162a', skyShade: '#0a0e1c', bldg: '#191e30', bldg2: '#1c2134', bldgWin: '#121626', bldgShade: '#0e1220',
    steel: '#0c0e13', steelShade: '#06070a', fascia: '#0e0e11', fasciaShade: '#07070a', sign: '#fffaf0',
    soffit: '#15130f', downlight: '#ffd58c',
    wall: '#f8dfb2', wallShade: '#e3bd82', ceiling: '#f6e8cb', duct: '#e5d4b3',
    wood: '#cf8e52', woodBack: '#b2733f', woodShade: '#8c562b', woodLight: '#eaae6e', woodDoor: '#2e2119', doorShade: '#1a120d',
    plant: '#729356', plant2: '#87a667', plantShade: '#4f6b3b', pot: '#ead4ab',
    prod1: '#f3d2a8', prod2: '#b5c4a2', prod3: '#eaa07a', prod4: '#fff3dc', prod5: '#a3a7b0',
    floor: '#e2b273', floorShade: '#bb8b50', mat: '#4b3f38',
    glass: '#2a2019', glassLight: '#ffd9a0', glassDoor: '#c08f58',
    stone: '#171a24', stoneShade: '#0f1119', trunk: '#231d19', trunkShade: '#15110e',
    joint: '#14151b', tile: '#1f2129', tile2: '#1c1e26', tileShade: '#111218', spill: '#6e5233',
    planter: '#3e2517', planterShade: '#24150c', planterLight: '#5a3520',
    agave: '#1f2b26', agave2: '#1a2520', agaveShade: '#0f1714', agaveLight: '#3a4a40',
    shadow: '#000000', breathe: '#ffc46e',
    coatA: '#57544f', coatB: '#2c3850', coatC: '#7d4c39', coatD: '#3f4a3c', hoodie: '#4f4b46',
    legsDark: '#111111', legsDenim: '#252d3d', hairDark: '#0c0b0a', hairBrown: '#24190f',
    hat: '#b5a98f', bag: '#8a6641', bagMark: '#d9ccb4', skin: '#6e5442',
    paper: '#2a231c', paperShade: '#17120e', paperShade2: '#211b15', paperInk: '#f0e3cb', paperLine: '#4d4033', paperGlow: '#ffc77a'
  };
  var nightAdd = { back: [], facade: [], over: [] };
  // a few lit windows upstairs
  [[204, 4, 22, 'litWin'], [258, 13, 16, 'litWin2'], [292, 4, 20, 'litWin'], [214, 22, 12, 'litWin2'], [340, 13, 18, 'litWin']].forEach(function (w) {
    nightAdd.back.push(r(w[0], w[1], w[2], 4, w[3], { a: .9 }));
  });
  // the sign glows: soft stippled bloom around the letters, re-lit text on top
  nightAdd.back.push(g(214, 62, 60, 'bloom', { d: .05, sx: 1.55, sy: .32 }));
  nightAdd.back.push({ t: 'text', text: 'niko and', x: 262, y: 72.5, size: 30, weight: 600, font: '"Plus Jakarta Sans", system-ui, sans-serif', fill: 'sign', align: 'right', ls: .2, glow: 'signGlow', blur: 8 });
  [270.5, 279.5, 288.5].forEach(function (x) { nightAdd.back.push(c(x, 70, 2.6, 'sign')); });
  // downlights are brighter at night
  for (var nx = 30; nx < 400; nx += 42) nightAdd.back.push(g(nx, 97, 11, 'downlight', { d: .3, sy: .7 }));
  // warm pool of light on the pavement in front of the doors: flat bands, then a little grain
  nightAdd.back.push({ t: 'halo', x: 204, y: 250, rx: 136, ry: 34, n: 7, fill: 'pool', a: .045 });
  nightAdd.back.push(g(204, 247, 90, 'poolGrain', { d: .07, sx: 1.25, sy: .24 }));
  // streetlight at the right edge
  nightAdd.facade.push(r(385, 46, 3, 254, 'pole'));
  nightAdd.facade.push(r(377, 44, 12, 3, 'pole', { r: 1.5 }));
  nightAdd.facade.push(r(378, 47, 7, 2, 'lamp', { r: 1 }));
  nightAdd.over.push({ t: 'halo', x: 381, y: 52, rx: 44, ry: 44, n: 7, fill: 'haze', a: .035 });
  nightAdd.over.push({ t: 'halo', x: 381, y: 294, rx: 46, ry: 9, n: 5, fill: 'haze', a: .035 });
  // the doorway itself breathes light out into the street

  LastSeen.scene({
    id: 'niko-and-shibuya',
    seenAt: '2026-10-25T18:56:00+09:00',
    place: { en: 'niko and ... Shibuya', ja: 'niko and ... 渋谷' },
    caption: { en: 'Last seen at {place}', ja: '最後に見かけたのは {place}' },
    alt: 'Illustration of the niko and ... shop front in Shibuya: a black sign over open glass doors, a warm wooden interior with shelves and plants, agave planters on either side. A small figure in a bucket hat steps out with a shopping bag.',
    size: [400, 300], seed: 42,
    mask: { inset: 6, round: 5, feather: 2.4, tear: .45, seed: 9 },
    // local time → variant (dark theme always shows night)
    periods: [['morning', '05:00'], ['midday', '11:00'], ['golden', '15:30'], ['night', '18:00']],
    variants: {
      morning: {
        palette: morning, add: morningAdd,
        breathe: { a: .03, amp: .015 },
        shoppers: [{ keys: [[0, 300], [6, 300], [11, 236], [16, 236], [20, 300]], period: 20, foot: 228, s: .78, coat: 'coatD', legs: 'legsDark', hair: 'hairDark', alpha: .92, shadow: false }],
        passersby: [{ start: 6.5, every: 26, dir: -1, speed: 34, foot: 285, s: 1.24, coat: 'coatB', legs: 'legsDark', hair: 'hairDark', cap: 'legsDark', carry: 'backpack', carryC: 'coatD' }]
      },
      midday: { palette: light },
      golden: {
        palette: golden, add: goldenAdd,
        light: { x: 760, r: 1400, c: 'rim', off: .8, amt: .85 },   // warm rim from the low sun on the right
        breathe: { a: .055, amp: .03 }
      },
      night: {
        palette: night, add: nightAdd,
        paperAdd: [{ t: 'halo', x: 200, y: 340, rx: 320, ry: 210, n: 10, fill: 'paperGlow', a: .016 }],   // lamplight on the card
        light: { x: 204, r: 120, c: 'rim', off: .9, amt: .9 },   // rim light from the doorway
        breathe: { a: .06, amp: .035 },
        passersby: [{ start: 5.2, every: 24, dir: -1, speed: 26, foot: 284, s: 1.24, coat: 'coatA', long: 6, legs: 'legsDark', hair: 'hairDark', longHair: true, carry: 'tote', carryC: 'bagMark' }]
      }
    },
    layers: { back: L, facade: F, front: P },
    paper: [
      r(0, 0, 400, 300, 'paper', { shade: grain('paperShade', .2, 'down', 1.6) }),
      r(0, 0, 400, 300, 'paperShade2', { a: 0, shade: grain('paperShade', .12, 'right', 1.2) })
    ],
    agaves: [agave(34, 200), agave(366, 200)],
    breathe: { x: 40, y: 95, w: 320, h: 144, c: 'breathe', a: .05, amp: .03, period: 7 },
    shoppers: [
      { keys: [[0, 150], [5, 150], [8.5, 180], [13, 180], [16.5, 150], [18, 150]], period: 18, foot: 229, s: .8, coat: 'coatD', legs: 'legsDark', hair: 'hairDark', alpha: .92, shadow: false },
      { keys: [[0, 334], [6, 334], [10, 306], [15, 306], [18, 334]], period: 18, offset: 4, foot: 227, s: .76, coat: 'coatC', legs: 'legsDark', hair: 'hairBrown', skirt: true, skirtC: 'legsDark', alpha: .9, shadow: false }
    ],
    passersby: [
      { start: 3.6, every: 19, dir: 1, speed: 30, foot: 287, s: 1.28, coat: 'coatB', legs: 'legsDenim', hair: 'hairBrown', carry: 'backpack', carryC: 'coatD' },
      { start: 13, every: 19, dir: -1, speed: 26, foot: 279, s: 1.18, coat: 'coatA', long: 6, legs: 'legsDark', hair: 'hairDark', longHair: true, carry: 'tote', carryC: 'coatC' }
    ],
    // The one signature beat: someone in a bucket hat steps out with a bag and walks off.
    signature: {
      delay: .1,
      person: { coat: 'hoodie', legs: 'legsDark', hair: 'hairDark', hat: 'hat', bag: 'bag', bagMark: 'bagMark', stride: 12 },
      emerge: { x: 205, foot0: 231, foot1: 264, s0: .82, s1: 1.25, dur: 1.25, fade: .3, stepRate: 11 },
      // an unhurried walk off toward the bottom-right corner; the footprints carry on from where the vignette swallows them
      walk: { pause: .45, accel: .7, speed: 30, dir: 1, dy: .16, ds: .0011, exitX: 356 },
      still: { x: 205, t: 2 }
    }
  });
})();
