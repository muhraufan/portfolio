/* Last seen scene kit — the shared drawing system behind every place scene (same look as
   /scenes/niko-and-shibuya.js). Load after last-seen.js, before any scene file. Each scene file calls
   LastSeenKit.make(id, spec). The five places Raufan was before niko and ... — drawn in the same system as /scenes/niko-and-shibuya.js:
   a 400 × 300 front view, flat shapes with stippled grain, no outlines, the pavement at y 244, the bucket-hat
   figure stepping out toward us, four lights (morning, midday, golden, night). Only the place name and the
   neighbourhood are shown; never an address. Reference photos stay private and are not used in the site. */
(function () {
  var LS = window.LastSeen;
  var r = function (x, y, w, h, fill, o) { return Object.assign({ t: 'rect', x: x, y: y, w: w, h: h, fill: fill }, o || {}); };
  var c = function (x, y, rr, fill, o) { return Object.assign({ t: 'circle', x: x, y: y, r: rr, fill: fill }, o || {}); };
  var e = function (x, y, rx, ry, fill, o) { return Object.assign({ t: 'ellipse', x: x, y: y, rx: rx, ry: ry, fill: fill }, o || {}); };
  var g = function (x, y, rr, fill, o) { return Object.assign({ t: 'glow', x: x, y: y, r: rr, fill: fill }, o || {}); };
  var poly = function (pts, fill, o) { return Object.assign({ t: 'poly', pts: pts, fill: fill }, o || {}); };
  var line = function (pts, fill, lw, o) { return Object.assign({ t: 'line', pts: pts, fill: fill, lw: lw }, o || {}); };
  var ring = function (x, y, rr, fill, lw, o) { return Object.assign({ t: 'ring', x: x, y: y, r: rr, fill: fill, lw: lw }, o || {}); };
  var grain = function (c, d, dir, p) { return { c: c, d: d, dir: dir || 'flat', p: p }; };
  var FONT = '"Plus Jakarta Sans", system-ui, sans-serif';
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  // ---------- light: every variant is derived from one midday palette, then hand-tuned per place ----------
  function hex(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function mix(a, b, t) { var A = hex(a), B = hex(b); return '#' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0'); }).join(''); }
  var INSIDE = /^(in[A-Z]\w*|lamp|breathe)$/;      // warm interiors keep their light after dark
  var PEOPLE = { coatA: '#ebe4d6', coatB: '#7c90a7', coatC: '#c98265', coatD: '#66705f', hoodie: '#a7a198', legsDark: '#3a3836', legsDenim: '#58657c',
    hairDark: '#2e2926', hairBrown: '#5c4638', skin: '#d6b394', hat: '#f1e9d4', bag: '#c9a06b', bagMark: '#f6f1e7' };
  var NIGHT_PEOPLE = { coatA: '#57544f', coatB: '#2c3850', coatC: '#7d4c39', coatD: '#3f4a3c', hoodie: '#4f4b46', legsDark: '#111111', legsDenim: '#252d3d',
    hairDark: '#0c0b0a', hairBrown: '#24190f', skin: '#6e5442', hat: '#b5a98f', bag: '#8a6641', bagMark: '#d9ccb4' };
  var COMMON = { inLit: '#f3c47c', inLit2: '#e7d6b0', stone: '#d6d3cd', stoneShade: '#bcb8b1', joint: '#bdb9b2', kerb: '#c4c0b9', glassLight: '#ffffff', shadow: '#3a2e25', rim: '#fff2d8', breathe: '#ffcf8f', signGlow: 'rgba(0,0,0,0)',
    stoneLight: '#e2dfd9', stain: '#a8a196', tactile: '#d6cfb6', tactileDot: '#c7bd9e', manhole: '#a7a298', manholeLine: '#8c877e', grate: '#8e8a83', grateGap: '#5f5c57',
    vend: '#ebe9e3', vendShade: '#cdcac2', vendTrim: '#3f6c9a', inVend: '#f7f4ec', inCanA: '#bb5148', inCanB: '#4d6f9c', inCanC: '#e2b65a', inCanD: '#6a8f68', inCanE: '#ece6da', inCanF: '#8a5a3f',
    ac: '#dcd9d2', acShade: '#c0bcb4', acGrille: '#a19d95', pipe: '#bdb9b1', pipeShade: '#a19d95', cone: '#da7a4b', coneBand: '#f2ede4',
    pot: '#a9724f', potShade: '#8a5a3d', leaf: '#7e8f62', leaf2: '#93a473', leafShade: '#5d6e48', leafFall: '#c9a05f', leafFall2: '#a98552', cup: '#f4efe6', plate: '#46658a', plateInk: '#eef0ee', metal: '#9fa3a6', bikeCover: '#3c3f45', metalSheen: '#eef0f0' };
  function variants(base, ov) {
    ov = ov || {};
    var mid = Object.assign({}, COMMON, PEOPLE, base, (ov.midday || {}).set);
    function tone(target, outside, inside, set, people) {
      var o = {}; Object.keys(mid).forEach(function (k) { var v = mid[k]; if (typeof v !== 'string' || v[0] !== '#' || v.length !== 7) { o[k] = v; return; }
        o[k] = INSIDE.test(k) ? mix(v, inside[0], inside[1]) : PEOPLE[k] ? (people ? people[k] : v) : mix(v, target, outside); });
      return Object.assign(o, set);
    }
    function add(k, extra) { var a = {}; ['back', 'facade', 'front', 'over'].forEach(function (L) { var x = (extra || {})[L] || [], y = ((ov[k] || {}).add || {})[L] || []; if (x.length || y.length) a[L] = x.concat(y); }); return a; }
    var o = ov;
    return fillGlow({
      midday: Object.assign({ palette: mid, add: add('midday') }, (o.midday || {}).extra),
      morning: Object.assign({ palette: tone('#cbd8e2', .16, ['#e8eef2', .12], Object.assign({ shadow: '#33404a', breathe: '#ffe1b0', stone: '#d0d2d0', stoneShade: '#b4b9b9', joint: '#b4b7b6', stoneLight: '#dee0de' }, (o.morning || {}).set)),
        add: add('morning', { back: o.noShadows ? [] : shadows(1, o.shadowAt) }), breathe: { a: .03, amp: .015 } }, (o.morning || {}).extra),
      golden: Object.assign({ palette: tone('#f0b07e', .2, ['#ffcf98', .1], Object.assign({ shadow: '#5a3520', rim: '#ffd9a3', signGlow: 'rgba(255,226,180,.45)', skyGlow: '#f6c497', stone: '#dfcab3', stoneShade: '#c4a68a', joint: '#c4ab93', stoneLight: '#ecd9c3' }, (o.golden || {}).set)),
        add: add('golden', { back: o.noShadows ? [] : shadows(-1, o.shadowAt), over: [poly([400, 30, 400, 120, 120, 300, 0, 300, 0, 260], 'sunWash', { a: .08 })] }),
        light: { x: 760, r: 1400, c: 'rim', off: .8, amt: .85 }, breathe: { a: .055, amp: .03 } }, (o.golden || {}).extra),
      night: Object.assign({ palette: tone('#0d1124', .8, ['#ffc77a', .06], Object.assign({ shadow: '#000000', breathe: '#ffc46e', rim: '#ffd497', signGlow: 'rgba(255,236,200,.85)', lamp: '#ffe3ad', pool: '#ffc77a', haze: '#ffb866',
        stone: '#171a24', stoneShade: '#0f1119', joint: '#14151b', kerb: '#1c1f29', stoneLight: '#1d212d', stain: '#0c0e14', tactile: '#2a2a2a', tactileDot: '#222222', metalSheen: '#6d6a66' }, (o.night || {}).set), NIGHT_PEOPLE),
        add: add('night'), light: { x: 200, r: 130, c: 'rim', off: .9, amt: .9 }, breathe: { a: .07, amp: .035 } }, (o.night || {}).extra)
    });
  }
  function fillGlow(V) { Object.keys(V).forEach(function (k) { var p = V[k].palette; if (!p.skyGlow) p.skyGlow = p.sky; }); return V; }
  function shadows(dir, at) {   // long soft sun shadows: morning to the right, golden to the left
    return (at || [[30, 60], [310, 60]]).map(function (p) { var s = dir * 90; return poly([p[0], 246, p[0] + p[1], 246, p[0] + p[1] + s, 258, p[0] + s, 258], 'shadow', { a: .14 }); });
  }
  // the pavement: tiles that are never quite the same value, a few old stains, optional street furniture set into it
  function pavement(L, F, o) {
    o = o || {}; var R = rnd(o.seed || 97);
    L.push(r(0, 244, 400, 56, 'stone', { shade: grain('stoneShade', .3, 'down') }));
    var off = o.offset || 0;
    for (var row = 0, y = 244; y < 300; row++) { var h = row ? 30 : 26, sx = row % 2 ? 20 : 0;
      for (var x = -40 + sx + off; x < 400; x += 40) { var v = R();
        if (v < .3) L.push(r(Math.max(0, x + 1), y + 1, 38, h - 1, 'stoneShade', { a: .05 + R() * .08 }));
        else if (v > .74) L.push(r(Math.max(0, x + 1), y + 1, 38, h - 1, 'stoneLight', { a: .25 + R() * .3 })); }
      y += h; }
    for (var jx = off; jx < 400; jx += 40) L.push(r(jx, 244, 1, 26, 'joint'));
    for (var jx2 = 20 + off; jx2 < 400; jx2 += 40) L.push(r(jx2, 270, 1, 30, 'joint'));
    L.push(r(0, 270, 400, 1, 'joint'));
    for (var k = 0; k < (o.stains == null ? 3 : o.stains); k++) L.push(e(20 + R() * 360, 252 + R() * 42, 6 + R() * 12, 1.4 + R() * 2.4, 'stain', { a: .05 + R() * .05 }));
    if (o.tactile != null) { var tx = o.tactile; L.push(r(tx, 244, 14, 56, 'tactile', { shade: grain('tactileDot', .3, 'down') }));
      for (var ty = 247; ty < 300; ty += 4.4) L.push(r(tx + 2.4, ty, 9.2, 1.2, 'tactileDot', { r: .6 })); }
    if (o.manhole) manhole(L, o.manhole[0], o.manhole[1], o.manhole[2]);
    if (o.grate) grate(L, o.grate[0], o.grate[1], o.grate[2]);
    F.push(r(0, 244, 400, 2, 'kerb'));
  }
  function manhole(A, x, y, rx) {   // a round iron cover seen at a low angle: rings and a faint pattern
    rx = rx || 15; A.push(e(x, y, rx, rx * .26, 'manholeLine')); A.push(e(x, y - .3, rx - 1.6, rx * .26 - .9, 'manhole', { shade: grain('manholeLine', .4, 'down') }));
    A.push(e(x, y - .3, rx * .55, rx * .14, 'manholeLine', { a: .45 }));
    for (var i = -2; i <= 2; i++) A.push(r(x + i * rx * .22 - .3, y - rx * .17, .6, rx * .3, 'manholeLine', { a: .35 }));
  }
  function grate(A, x, y, w) {      // a drain grate along the kerb
    A.push(r(x, y, w, 4, 'grate')); for (var gx = x + 2; gx < x + w - 1; gx += 3) A.push(r(gx, y + .8, 1.2, 2.4, 'grateGap'));
  }
  function contact(A, x, y, w, a) { // soft contact shadow where a thing meets the ground
    A.push(e(x, y, w, Math.max(1.2, w * .07), 'shadow', { a: (a || .14) * .7 })); A.push(e(x, y, w * .62, Math.max(.8, w * .04), 'shadow', { a: (a || .14) }));
  }
  function sheen(A, x, y, w, h, o) {  // glass: a soft diagonal sheen and the street faintly reflected at the foot
    o = o || {}; var a = o.a == null ? .12 : o.a, cl = function (v) { return Math.max(x, Math.min(x + w, v)); };
    var s1 = x + w * (o.at || .18), d = Math.min(h * .45, w * .7);
    A.push(poly([cl(s1), y, cl(s1 + w * .22), y, cl(s1 + w * .22 - d), y + Math.min(h, d * 1.2), cl(s1 - d), y + Math.min(h, d * 1.2)], o.fill || 'glassLight', { a: a }));
    A.push(poly([cl(s1 + w * .3), y, cl(s1 + w * .36), y, cl(s1 + w * .36 - d), y + Math.min(h, d * 1.2), cl(s1 + w * .3 - d), y + Math.min(h, d * 1.2)], o.fill || 'glassLight', { a: a * .6 }));
    if (o.street !== false) { A.push(r(x, y + h * .82, w, h * .18, o.streetFill || 'stoneLight', { a: o.streetA || .1 })); A.push(r(x, y + h * .82, w, .7, 'glassLight', { a: a * .8 })); }
  }
  function vending(A, x, y, o) {    // a drinks machine: white body, a lit window of cans, the slot below; y = its foot
    o = o || {}; var R = rnd(o.seed || 31), W = o.w || 26, H = o.h || 48, cols = ['inCanA', 'inCanB', 'inCanC', 'inCanD', 'inCanE', 'inCanF'];
    contact(A, x + W / 2, y, W * .62, .18);
    A.push(r(x, y - H, W, H, 'vend', { r: [1.4, 1.4, .4, .4], shade: grain('vendShade', .35, 'right', 1.4) }));
    A.push(r(x, y - H, W, 3, o.trim || 'vendTrim', { r: [1.4, 1.4, 0, 0] }));
    A.push(r(x + 2, y - H + 5, W - 4, H * .5, 'inVend'));
    for (var row = 0; row < 3; row++) { var yy = y - H + 7 + row * (H * .5 - 4) / 3;
      for (var cx = x + 3.4, n = 0; cx < x + W - 4; cx += 3.3, n++) { A.push(r(cx, yy, 2.2, 5.2, cols[Math.floor(R() * cols.length)], { r: .8 })); }
      A.push(r(x + 2.4, yy + 6.2, W - 4.8, .6, 'vendShade')); for (var bx = x + 3.8; bx < x + W - 4; bx += 3.3) A.push(r(bx + .5, yy + 7.2, 1.2, .8, R() > .5 ? 'inCanA' : 'vendShade', { a: .8 })); }
    A.push(r(x + W - 7, y - H * .42, 3, 5, 'vendShade')); A.push(r(x + W - 6.2, y - H * .42 + 1, 1.4, 2, 'grateGap', { a: .6 }));
    A.push(r(x + 3, y - 10, W - 6, 6, 'grateGap', { r: 1, a: .55 }));
    A.push(r(x + 2, y - H + 5, 2, H * .5, 'glassLight', { a: .25 }));
  }
  function ac(A, x, y, w) {         // an outdoor AC unit: box, round fan grille, side slats
    w = w || 22; var h = w * .7; contact(A, x + w / 2, y + h + .6, w * .5, .1);
    A.push(r(x, y, w, h, 'ac', { r: .8, shade: grain('acShade', .35, 'down') }));
    A.push(ring(x + w * .38, y + h / 2, h * .34, 'acGrille', .7)); A.push(c(x + w * .38, y + h / 2, h * .1, 'acGrille'));
    for (var i = 0; i < 4; i++) A.push(r(x + w * .72, y + h * .2 + i * h * .17, w * .2, .7, 'acGrille'));
  }
  function pipe(A, x, y0, y1) {     // a drainpipe with brackets and a shoe at the foot
    A.push(r(x, y0, 2.6, y1 - y0, 'pipe', { shade: grain('pipeShade', .4, 'right') })); A.push(r(x + 1.9, y0, .7, y1 - y0, 'pipeShade', { a: .8 }));
    for (var y = y0 + 14; y < y1 - 6; y += 30) A.push(r(x - .8, y, 4.2, 1.4, 'pipeShade'));
    A.push(r(x - .6, y1 - 3, 4.6, 3, 'pipe'));
  }
  function cone(A, x, y, s) {       // a traffic cone, a bit tired
    s = s || 1; contact(A, x, y, 7 * s, .14);
    A.push(r(x - 6 * s, y - 1.6 * s, 12 * s, 1.6 * s, 'cone')); A.push(poly([x - 4.4 * s, y - 1.6 * s, x + 4.4 * s, y - 1.6 * s, x + 1.2 * s, y - 15 * s, x - 1.2 * s, y - 15 * s], 'cone', { shade: grain('potShade', .25, 'right') }));
    A.push(poly([x - 3.2 * s, y - 6 * s, x + 3.2 * s, y - 6 * s, x + 2.4 * s, y - 9 * s, x - 2.4 * s, y - 9 * s], 'coneBand'));
  }
  function plant(A, x, y, s, seed, o) {   // a small potted plant: a pot, a leafy clump that is never symmetrical
    s = s || 1; o = o || {}; var R = rnd(seed || 5), pw = (o.pw || 10) * s, ph = (o.ph || 9) * s;
    contact(A, x, y, pw * .7, .14);
    A.push(poly([x - pw / 2, y - ph, x + pw / 2, y - ph, x + pw * .38, y, x - pw * .38, y], o.pot || 'pot', { shade: grain('potShade', .35, 'right') }));
    A.push(r(x - pw / 2 - .6, y - ph - 1.6, pw + 1.2, 1.8, o.pot || 'pot'));
    var n = o.n || 6; for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + (R() - .5) * 2.2, L = (6 + R() * 7) * s * (o.tall || 1);
      A.push(e(x + Math.cos(a) * L * .55, y - ph - 2 + Math.sin(a) * L * .55, L * .5, 2.2 * s, R() > .5 ? (o.leaf || 'leaf') : (o.leaf2 || 'leaf2'), { rot: a, shade: grain(o.leafShade || 'leafShade', .3, 'down') })); }
  }
  function plate(A, x, y, w, h) {   // a small enamel sign plate, lines standing in for words
    w = w || 12; h = h || 6; A.push(r(x, y, w, h, 'plate', { r: .6 })); A.push(r(x + 1.6, y + 1.6, w * .6, .7, 'plateInk')); A.push(r(x + 1.6, y + 3.4, w * .4, .6, 'plateInk', { a: .8 }));
  }
  function sitter(A, x, seat, s, p) {  // someone sitting on a bench, side on, facing p.dir: drawn like the walkers — shadow side, grain, a rim of light
    s = s || 1; var d = p.dir || 1, X = function (v) { return x + v * d * s; }, Y = function (v) { return seat + v * s; }, mn = function (a, b) { return Math.min(X(a), X(b)); };
    var back = d > 0 ? 'left' : 'right', lg = p.legs || 'legsDark';
    A.push(r(mn(4, 11), Y(-2.6), 7 * s, 2.8 * s, lg, { r: 1.2 * s, shade: { c: 'shadow', d: .22, dir: 'down', p: 1.2, a: .3 } }));   // thigh
    A.push(r(mn(9, 11.4), Y(-.8), 2.4 * s, 9 * s, lg, { r: [0, 0, .6 * s, .6 * s], shade: { c: 'shadow', d: .2, dir: back, p: 1.4, a: .3 } }));   // shin
    A.push(r(mn(9, 11.4), Y(6.6), 2.4 * s, .5 * s, 'shadow', { a: .22 }));                                   // the trouser break
    A.push(r(mn(8.6, 13), Y(7.4), 4.4 * s, 1.6 * s, lg, { r: [.6 * s, 1.2 * s, .4 * s, .4 * s] }));          // shoe, rounded at the toe
    A.push(r(mn(8.6, 13), Y(7.4), 4.4 * s, 1.6 * s, 'shadow', { r: [.6 * s, 1.2 * s, .4 * s, .4 * s], a: .4 }));
    A.push(r(mn(.4, 2.4), Y(-15.4), 2 * s, 2.6 * s, p.skin || 'skin'));                                      // neck
    A.push(r(mn(-3, 4.4), Y(-13.6), 7.4 * s, 12 * s, p.coat, { r: [3.6 * s, 3 * s, 1 * s, 1 * s], shade: [{ c: 'shadow', d: .2, dir: back, p: 1.6, a: .26 }, { c: 'shadow', d: .12, dir: 'down', p: 1.4, a: .22 }] }));   // back and torso
    A.push(r(mn(-3, -1.6), Y(-12.6), 1.4 * s, 10.4 * s, 'shadow', { a: .12 }));                               // the back in shade, two steps
    A.push(r(mn(-3, -2.2), Y(-12.2), .8 * s, 10 * s, 'shadow', { a: .1 }));
    A.push(r(mn(.8, 3.2), Y(-13.7), 2.4 * s, 2.6 * s, 'shadow', { a: .16 }));                                 // collar
    A.push(r(mn(1.2, 8.4), Y(-9.6), 7.2 * s, 2.8 * s, 'shadow', { r: 1 * s, a: .14 }));                       // the forearm's shade on the coat
    A.push(r(mn(1.6, 8.6), Y(-8.6), 7 * s, 2.2 * s, p.coat, { r: 1 * s }));                                   // forearm reaching forward
    A.push(c(X(9.3), Y(-7.5), 1.05 * s, p.skin || 'skin'));                                                    // hand
    A.push(r(mn(3.6, 4.4), Y(-12.4), .8 * s, 10 * s, 'rim', { a: p.rimA == null ? .35 : p.rimA }));          // light on the front edge
    A.push(c(X(1.6), Y(-16.8), 2.7 * s, p.skin || 'skin'));                                                    // head: the face stays bare
    A.push(c(X(.5), Y(-17.3), 2.85 * s, p.hair || 'hairDark')); A.push(r(mn(-2.2, .2), Y(-17), 2.4 * s, 2.6 * s, p.hair || 'hairDark', { r: [0, 0, .8 * s, .8 * s] }));
    if (p.cup) A.push(r(mn(8.2, 10.4), Y(-10.4), 2.2 * s, 2.8 * s, 'cup', { r: [.3, .3, .8, .8] }));
  }
  function leaves(A, x0, x1, y0, y1, n, seed, cols) {  // fallen leaves, scattered
    var R = rnd(seed || 3); cols = cols || ['leafFall', 'leafFall2'];
    for (var i = 0; i < n; i++) A.push(e(x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), 1.2 + R() * 1.1, .6 + R() * .4, cols[i % cols.length], { rot: R() * 3, a: .3 + R() * .3 }));
  }
  function signature(o) {
    o = o || {};
    // o.person: a per-scene outfit over the default (e.g. { hood: true, coat: 'nikoHoodie', hat: 'nikoHat' }); other scenes keep the coat
    return { delay: .1, person: Object.assign({ coat: 'hoodie', legs: 'legsDark', hair: 'hairDark', hat: 'hat', bag: 'bag', bagMark: 'bagMark', stride: 12 }, o.person),
      emerge: Object.assign({ x: 200, foot0: 231, foot1: 264, s0: .82, s1: 1.25, dur: 1.25, fade: .3, stepRate: 11 }, o.emerge),
      walk: { pause: .45, accel: .7, speed: 30, dir: 1, dy: .16, ds: .0011, exitX: 356 }, company: o.company || [], still: { x: (o.emerge && o.emerge.x) || 200, t: 2 } };
  }
  // the guest card stock (postcard back, gallery papers): the same paper as /scenes/niko-and-shibuya.js in every light
  var PAPER = {
    midday: { paper: '#f1ede4', paperShade: '#d9d4c8', paperShade2: '#e6e1d6', paperInk: '#2b2d30', paperLine: '#c4c0b5' },
    morning: { paper: '#f3ebdd', paperShade: '#dfcfb6', paperShade2: '#e9dcc6', paperInk: '#2a2827', paperLine: '#c9b99f', paperGlow: '#fff6e6' },
    golden: { paper: '#f6e6d0', paperShade: '#e4c6a3', paperShade2: '#eed8bc', paperInk: '#36271e', paperLine: '#d4b792' },
    night: { paper: '#2a231c', paperShade: '#17120e', paperShade2: '#211b15', paperInk: '#f0e3cb', paperLine: '#4d4033', paperGlow: '#ffc77a' }
  };
  function paperStock(V) {
    Object.keys(PAPER).forEach(function (k) { if (V[k]) Object.assign(V[k].palette, PAPER[k]); });
    if (V.night && !V.night.paperAdd) V.night.paperAdd = [{ t: 'halo', x: 200, y: 340, rx: 320, ry: 210, n: 10, fill: 'paperGlow', a: .016 }];
    return V;
  }
  var PAPER_LAYERS = [
    r(0, 0, 400, 300, 'paper', { shade: grain('paperShade', .2, 'down', 1.6) }),
    r(0, 0, 400, 300, 'paperShade2', { a: 0, shade: grain('paperShade', .12, 'right', 1.2) })
  ];
  function make(id, spec) {
    var L = [], F = [], P = [];
    spec.build(L, F, P);
    // golden: the sky warms toward the horizon in a fine grain (invisible in the other lights, where skyGlow = sky)
    for (var si = 0; si < L.length; si++) if (L[si].fill === 'sky' && L[si].t === 'rect') { var S0 = L[si];
      L.splice(si + 1, 0, r(S0.x, S0.y + S0.h * .35, S0.w, S0.h * .65, null, { shade: grain('skyGlow', .36, 'down', 1.6) })); break; }
    LS.scene({
      id: id, seenAt: spec.seenAt, place: spec.place, name: spec.name, area: spec.area, alt: spec.alt,
      caption: { en: 'Last seen at {place}', ja: '最後に見かけたのは {place}' },
      size: [400, 300], seed: spec.seed, mask: { inset: 6, round: 5, feather: 2.4, tear: .45, seed: spec.seed % 13 },
      periods: [['morning', '05:00'], ['midday', '11:00'], ['golden', '15:30'], ['night', '18:00']],
      variants: paperStock(variants(spec.palette, spec.light)), layers: { back: L, facade: F, front: P }, paper: spec.paper || PAPER_LAYERS,
      agaves: [], breathe: Object.assign({ x: 0, y: 0, w: 0, h: 0, c: 'breathe', a: .05, amp: .03, period: 7 }, spec.breathe),
      shoppers: spec.shoppers || [], passersby: spec.passersby || [], anim: spec.anim || [], signature: signature(spec.sig), stamp: spec.stamp
    });
  }
  function bike(P, x, y, o) {     // a parked city bike, side on: two wheels, a frame, a basket or a child seat
    o = o || {}; var f = o.flip ? -1 : 1, X = function (d) { return x + d * f; };
    [-17, 17].forEach(function (d) { P.push(ring(X(d), y - 10, 9.5, 'tyre', 2.2)); P.push(c(X(d), y - 10, 1.2, 'bikeMetal')); });
    P.push(line([X(-17), y - 10, X(-5), y - 27, X(13), y - 27, X(17), y - 10], 'bikeFrame', 1.8));
    P.push(line([X(-17), y - 10, X(1), y - 10, X(-5), y - 27], 'bikeFrame', 1.8));
    P.push(line([X(1), y - 10, X(13), y - 27], 'bikeFrame', 1.8));
    P.push(line([X(13), y - 27, X(11), y - 34, X(6), y - 35], 'bikeMetal', 1.6));
    P.push(r(Math.min(X(-9), X(-1)), y - 31, 8, 2.4, 'bikeSeat', { r: 1.2 }));
    [-17, 17].forEach(function (d) { P.push(line([X(d) - 3, y - 17, X(d) + 3.5, y - 16], 'metalSheen', .6, { a: .5 })); });
    P.push(line([X(-17), y - 18, X(-12), y - 21, X(-3), y - 21], 'bikeMetal', 1.1, { a: .8 }));   // the rear mudguard
    if (o.basket) { var bx = Math.min(X(13), X(26)); P.push(r(bx, y - 38, 13, 10, 'bikeBasket', { r: [.6, .6, 1.6, 1.6] }));
      for (var i = 1; i < 4; i++) P.push(r(bx + i * 3.2, y - 37, .5, 8, 'bikeFrame', { a: .35 })); P.push(r(bx, y - 34, 13, .5, 'bikeFrame', { a: .35 }));
      if (o.bag) P.push(r(bx + 2, y - 42, 8, 5, o.bag, { r: 1.4 })); }
    if (o.child) { var cx = Math.min(X(-28), X(-11)); // a rear child seat under its rain cover: a rounded hood with a clear visor
      P.push(r(cx, y - 50, 17, 22, o.cover || 'bikeCover', { r: [7, 7, 2, 2], shade: grain('bikeSeat', .3, 'down') }));
      P.push(r(cx + (o.flip ? 6 : 2.4), y - 46, 8.6, 8, 'glassLight', { r: [3.4, 3.4, 1, 1], a: .3 }));
      P.push(r(cx + 1, y - 30, 15, 1.4, 'bikeSeat', { a: .8 })); }
    P.push(e(x, y + 1, 30, 1.8, 'shadow', { a: .12 }));
  }
  function crown(L, pts, cols, shadeKey) {     // a leafy tree mass: overlapping rounds with soft grain on the shaded side
    pts.forEach(function (p, i) { L.push(c(p[0], p[1], p[2], cols[i % cols.length], { shade: grain(shadeKey, .6, 'br', 1.25) })); });
  }
  function branches(L, x, y, ang, len, w, depth, rand, fill) {   // a bare winter tree, drawn as tapering strokes
    var x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    L.push(line([x, y, x2, y2], fill, w));
    if (depth <= 0) return;
    var n = depth > 2 ? 2 : 3;
    for (var i = 0; i < n; i++) branches(L, x2, y2, ang + (i - (n - 1) / 2) * (.55 + rand() * .3) + (rand() - .5) * .2, len * (.68 + rand() * .14), Math.max(.5, w * .62), depth - 1, rand, fill);
  }

  window.LastSeenKit = { r: r, c: c, e: e, g: g, poly: poly, line: line, ring: ring, grain: grain, FONT: FONT, rnd: rnd, mix: mix,
    make: make, pavement: pavement, bike: bike, crown: crown, branches: branches,
    manhole: manhole, grate: grate, contact: contact, sheen: sheen, vending: vending, ac: ac, pipe: pipe, cone: cone, plant: plant, plate: plate, sitter: sitter, leaves: leaves };
})();
