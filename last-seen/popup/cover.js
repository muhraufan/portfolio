/* Pop-up book: its cover, and where the camera stands. Needs /last-seen/last-seen.js and the scene files.
   A plain script, no three.js, so the page can show the closed book at once (js/hero-book.js draws this cover as a flat
   picture, laid exactly where the 3D book will be) and book.js can wrap the same picture round the real thing. */
(function () {
  'use strict';
  const LS = window.LastSeen; if (!LS) return;
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function mountManual(S, light, wpx, extra) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-30000px;top:0;pointer-events:none;width:' + (wpx / dpr) + 'px;height:' + (wpx * .75 / dpr) + 'px';
    host.innerHTML = '<canvas style="width:100%;height:100%;display:block"></canvas>';
    document.body.appendChild(host);
    const api = LS.mount(host, S, Object.assign({ manual: true, tod: light }, extra));
    return { host, api, canvas: host.querySelector('canvas') };
  }
  /* The camera. Shut, it looks down on the cover; open, it sits low in front of the spread. book.js moves between the two.
     1 unit = 100 scene units. PWP: a page's width. Z0, Z1: its far and near edge. T: the thickness of one half of the book. */
  const VIEW = { PWP: 2.6, Z0: -1.9, Z1: 2.3, T: .2, C0: [-1.3, 12.2, 8.2], T0: [-1.3, .2, .35], C1: [0, 4.32, 12], T1: [0, .95, 0],
    fov: aspect => Math.max(30, 2 * Math.atan(.3 / aspect) * 180 / Math.PI) };   // a narrow stage (a phone): widen the view until the whole spread fits across it
  // where points in the book's space land on a stage w x h, with the book shut (open = 0) or open (open = 1)
  function project(pts, w, h, open) {
    const C = open ? VIEW.C1 : VIEW.C0, Tg = open ? VIEW.T1 : VIEW.T0, k = Math.tan(VIEW.fov(w / h) * Math.PI / 360);
    let f = [Tg[0] - C[0], Tg[1] - C[1], Tg[2] - C[2]]; const fl = Math.hypot(f[0], f[1], f[2]); f = f.map(v => v / fl);
    let r = [f[1] * 0 - f[2] * 1, f[2] * 0 - f[0] * 0, f[0] * 1 - f[1] * 0]; const rl = Math.hypot(r[0], r[1], r[2]); r = r.map(v => v / rl);
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    return pts.map(p => { const d = [p[0] - C[0], p[1] - C[1], p[2] - C[2]], z = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
      return [((d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) / (z * k * (w / h)) + 1) / 2 * w, (1 - (d[0] * u[0] + d[1] * u[1] + d[2] * u[2]) / (z * k)) / 2 * h]; });
  }
  // the cover's four corners when the book is shut (top-left, top-right, bottom-right, bottom-left of the picture), and the open book's front edge
  const SHUT = [[-(VIEW.PWP + .08), VIEW.T * 2, VIEW.Z0 - .07], [0, VIEW.T * 2, VIEW.Z0 - .07], [0, VIEW.T * 2, VIEW.Z1 + .07], [-(VIEW.PWP + .08), VIEW.T * 2, VIEW.Z1 + .07]];
  const FRONT = [[-(VIEW.PWP + .08), 0, VIEW.Z1 + .07], [VIEW.PWP + .08, 0, VIEW.Z1 + .07]];

  // The cover belongs to the whole journey, not to one place. A painted picture-book cover: a night sky in gouache, the city
  // far off, branches and leaves leaning in from the edges, the title lettered by hand with a round brush, and Raufan himself
  // (the same little figure the scenes draw) standing in the clearing. Nothing here is set in a typeface.
  const GLYPH = {
    A: { w: .62, s: [[[0, 0], [.31, 1], [.62, 0]], [[.13, .36], [.5, .38]]] },
    B: { w: .58, s: [[[.05, 0], [.05, 1]], { c: 1, p: [[.05, 1], [.42, 1], [.52, .78], [.4, .55], [.07, .52]] }, { c: 1, p: [[.07, .52], [.5, .52], [.6, .26], [.46, 0], [.05, 0]] }] },
    C: { w: .58, s: [{ c: 1, p: [[.56, .8], [.44, 1], [.16, .98], [.02, .5], [.16, .02], [.42, 0], [.57, .2]] }] },
    D: { w: .6, s: [[[.05, 0], [.05, 1]], { c: 1, p: [[.05, 1], [.44, .98], [.62, .5], [.44, .02], [.05, 0]] }] },
    E: { w: .54, s: [[[.5, 1], [.05, 1], [.05, 0], [.52, 0]], [[.05, .52], [.42, .54]]] },
    F: { w: .52, s: [[[.5, 1], [.05, 1], [.05, 0]], [[.05, .52], [.4, .54]]] },
    H: { w: .6, s: [[[.05, 1], [.05, 0]], [[.55, 1], [.55, 0]], [[.05, .5], [.55, .53]]] },
    K: { w: .58, s: [[[.05, 1], [.05, 0]], [[.52, 1], [.07, .48], [.56, 0]]] },
    L: { w: .5, s: [[[.05, 1], [.05, 0], [.5, .02]]] },
    M: { w: .76, s: [[[.03, 0], [.09, 1], [.38, .3], [.66, 1], [.73, 0]]] },
    N: { w: .62, s: [[[.05, 0], [.05, 1], [.56, 0], [.56, 1]]] },
    O: { w: .62, s: [{ c: 1, p: [[.3, 1], [.04, .9], [.0, .5], [.06, .08], [.3, 0], [.56, .08], [.62, .5], [.56, .92], [.3, 1], [.24, .99]] }] },
    P: { w: .56, s: [[[.05, 0], [.05, 1]], { c: 1, p: [[.05, 1], [.46, 1], [.58, .74], [.44, .5], [.05, .47]] }] },
    R: { w: .58, s: [[[.05, 0], [.05, 1]], { c: 1, p: [[.05, 1], [.46, 1], [.58, .74], [.44, .5], [.05, .47]] }, [[.26, .48], [.57, 0]]] },
    S: { w: .56, s: [{ c: 1, p: [[.52, .84], [.4, 1.02], [.12, 1], [.02, .74], [.2, .54], [.42, .44], [.58, .24], [.44, -.02], [.16, 0], [.02, .18]] }] },
    T: { w: .6, s: [[[0, 1], [.6, 1.01]], [[.3, 1], [.3, 0]]] },
    U: { w: .6, s: [{ c: 1, p: [[.05, 1], [.05, .3], [.12, .02], [.3, 0], [.48, .02], [.55, .3], [.55, 1]] }] },
    Y: { w: .6, s: [[[.02, 1], [.3, .5], [.58, 1]], [[.3, .5], [.3, 0]]] },
    '-': { w: .4, s: [[[.04, .45], [.36, .47]]] }
  };
  function coverFigure() {                          // the lead figure of a scene, drawn large by the scene engine itself
    try {
      const S0 = LS.byId('naruto-coffee') || (LS.newest && LS.newest()); if (!S0 || !S0.signature || !S0.signature.person) return null;
      const S2 = Object.assign({}, S0, { signature: Object.assign({}, S0.signature, { company: [] }) });
      const m = mountManual(S2, 'midday', 2800, { pass: 'crew' }); m.api.renderAt(S0.signature.still ? S0.signature.still.t : 14, 'still');
      const f = (m.host._figs || [])[0]; let out = null;
      if (f) { const k = m.canvas.width / 400, w = 24 * f[2], h = 52 * f[2]; out = canvas(Math.round(w * k), Math.round(h * k));
        out.getContext('2d').drawImage(m.canvas, (f[0] - w / 2) * k, (f[1] - h + 3 * f[2]) * k, w * k, h * k, 0, 0, out.width, out.height); out._foot = (h - 3 * f[2]) / h; }
      try { m.api.pause(); } catch (e) {} m.host.remove(); return out;
    } catch (e) { return null; }
  }
  // The same cover at each of the site's four lights: the morning is cool and pale, the evening warm, and at night the wall
  // goes dark, the stars come out and the shop is the thing that glows.
  const LT = {
    morning: { sky: ['#9cc4e6', '#e4eef4'], cloud: '#ffffff', tint: ['#d5e4f5', .3] },
    midday: { sky: ['#69b2e4', '#bfe2f4'], cloud: '#ffffff', tint: null },
    golden: { sky: ['#ee9f58', '#f9d8a2'], cloud: '#ffe3c2', tint: ['#ffc07a', .4] },
    night: { sky: ['#0d1736', '#26356a'], cloud: 'rgba(150,170,220,.3)', tint: ['#46538e', .66], night: true }
  };
  const coverCache = {};
  function coverArt(light) {
    light = LT[light] ? light : 'midday'; const L = LT[light];
    if (coverCache[light]) return coverCache[light];
    const W = 810, H = 1302, SP = 96, AW = W - SP, c = canvas(W, H), x = c.getContext('2d');
    let seed = 11; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647, J = a => (R() - .5) * 2 * a;
    x.lineCap = 'round'; x.lineJoin = 'round';
    const smooth = (g, pts, closed) => { g.beginPath(); const n = pts.length;
      if (closed) { const m = i => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2], s0 = m(0); g.moveTo(s0[0], s0[1]); for (let i = 1; i <= n; i++) { const p = pts[i % n], q = m(i); g.quadraticCurveTo(p[0], p[1], q[0], q[1]); } g.closePath(); }
      else { g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n - 1; i++) { const p = pts[i], q = [(p[0] + pts[i + 1][0]) / 2, (p[1] + pts[i + 1][1]) / 2]; g.quadraticCurveTo(p[0], p[1], q[0], q[1]); } g.lineTo(pts[n - 1][0], pts[n - 1][1]); } };
    // gouache: a flat coat, then dry-brush drags of a lighter and a darker mix, kept inside the shape
    const paint = (path, col, o) => { o = o || {}; x.save(); path(); x.fillStyle = col; x.fill(); x.clip();
      const b = o.box || [0, 0, AW, H], n = o.n == null ? Math.round(b[2] * b[3] / 1100) : o.n, ang = o.ang || 0, lb = o.lb == null ? .5 : o.lb;
      for (let i = 0; i < n; i++) { const px = b[0] + R() * b[2], py = b[1] + R() * b[3], len = 30 + R() * 100, a = ang + J(.22);
        x.strokeStyle = R() < lb ? (o.light || 'rgba(255,255,255,.07)') : (o.dark || 'rgba(6,12,40,.09)'); x.lineWidth = 1 + R() * 5;
        x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); x.stroke(); }
      x.restore(); };
    const rect = (a, b, w, h) => () => { x.beginPath(); x.rect(a, b, w, h); };
    const twig = (pts, lw, col) => { x.strokeStyle = col; x.lineWidth = lw; smooth(x, pts, false); x.stroke(); };
    // ---- midday outside a coffee shop: a strip of sky, a sunlit wall with the title painted on it like a shop's own sign,
    //      a striped awning, the window with the counter inside, the door, the pavement, and him standing in front
    const PLUM = '#3a2418', CREAM = '#fff6e2', TIMBER = '#b98a58', DARKT = '#7a5433', TERRA = '#d8603f', WARM = '#f3d7a0', LEAF = '#5e8d5a', LEAF2 = '#3f6e4a';
    const sky = x.createLinearGradient(0, 0, 0, 190); sky.addColorStop(0, L.sky[0]); sky.addColorStop(1, L.sky[1]);
    paint(rect(0, 0, AW, 200), sky, { box: [0, 0, AW, 200], n: 150, light: 'rgba(255,255,255,.14)', dark: 'rgba(40,90,150,.07)' });
    const cloud = (cx0, cy0, w, h, col) => { for (let i = 0; i < 8; i++) { x.strokeStyle = col; x.lineWidth = h * (.4 + R() * .6); x.globalAlpha = .55 + R() * .4; x.beginPath(); const y = cy0 + J(h * .6), a = cx0 - w / 2 + J(w * .22), b = cx0 + w / 2 + J(w * .22); x.moveTo(a, y); x.quadraticCurveTo((a + b) / 2, y + J(8), b, y + J(5)); x.stroke(); } x.globalAlpha = 1; };
    if (L.night) { for (let i = 0; i < 70; i++) { x.fillStyle = 'rgba(255,246,226,' + (.35 + R() * .6) + ')'; x.beginPath(); x.arc(R() * AW, R() * 140, .8 + R() * 1.5, 0, Math.PI * 2); x.fill(); }
      x.fillStyle = 'rgba(255,243,214,.16)'; x.beginPath(); x.arc(118, 70, 46, 0, Math.PI * 2); x.fill(); x.fillStyle = '#f6ecd0'; x.beginPath(); x.arc(118, 70, 27, 0, Math.PI * 2); x.fill(); x.fillStyle = L.sky[0]; x.beginPath(); x.arc(130, 62, 24, 0, Math.PI * 2); x.fill(); }
    cloud(L.night ? 330 : 150, 62, 230, 26, L.cloud); cloud(566, 104, 190, 20, L.cloud);
    const wire = (a, b, sag, lw) => { x.strokeStyle = PLUM; x.lineWidth = lw; x.beginPath(); x.moveTo(a[0], a[1]); x.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag, b[0], b[1]); x.stroke(); };
    const crow = (px, py, sc, flip) => { x.save(); x.translate(px, py); x.scale(flip ? -sc : sc, sc); x.fillStyle = PLUM; x.beginPath(); x.ellipse(0, -9, 13, 8, -.3, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(10, -18, 6.5, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.moveTo(-10, -6); x.lineTo(-27, 3); x.lineTo(-17, -9); x.fill(); x.beginPath(); x.moveTo(15, -20); x.lineTo(24, -17); x.lineTo(15, -15); x.fill(); x.fillRect(-2, -2, 1.8, 6); x.fillRect(3, -2, 1.8, 6); x.restore(); };
    wire([-20, 40], [AW + 20, 70], 34, 2); crow(420, 75, .9, false); crow(464, 76, .84, true);
    // the wall, lit from above
    paint(rect(-10, 168, AW + 20, 990), '#f6e8cc', { box: [0, 168, AW, 990], n: 760, light: 'rgba(255,255,255,.24)', dark: 'rgba(170,125,70,.08)', lb: .56 });
    paint(rect(-10, 146, AW + 20, 34), '#e3caa0', { box: [0, 146, AW, 34], n: 40 }); x.fillStyle = 'rgba(120,80,40,.18)'; x.fillRect(0, 180, AW, 12);
    for (let i = 0; i < 26; i++) { const bx = R() * AW, by = 210 + R() * 470; if (bx > 110 && bx < 610) continue; x.strokeStyle = 'rgba(190,150,100,.5)'; x.lineWidth = 1.6; x.strokeRect(bx, by, 34 + R() * 8, 13); }   // a few bricks showing through the render, away from the lettering
    twig([[38, 180], [40, 500], [37, 716]], 9, '#cdb38a'); [300, 560].forEach(y => { x.fillStyle = '#b89b70'; x.fillRect(30, y, 18, 7); });                                                                   // a drainpipe
    // a hanging sign: a cup
    x.strokeStyle = PLUM; x.lineWidth = 4; x.beginPath(); x.moveTo(AW + 4, 596); x.lineTo(646, 596); x.lineTo(646, 616); x.stroke();
    paint(() => smooth(x, Array.from({ length: 12 }, (_, i) => { const t = i / 12 * Math.PI * 2; return [646 + Math.cos(t) * (38 + J(1.5)), 654 + Math.sin(t) * (38 + J(1.5))]; }), true), TERRA, { box: [606, 614, 80, 80], n: 22, light: 'rgba(255,220,190,.3)' });
    x.fillStyle = CREAM; x.beginPath(); x.moveTo(628, 644); x.lineTo(662, 644); x.quadraticCurveTo(660, 672, 645, 673); x.quadraticCurveTo(630, 672, 628, 644); x.fill(); x.strokeStyle = CREAM; x.lineWidth = 3.4; x.beginPath(); x.arc(664, 654, 7, -1.2, 1.3); x.stroke();
    x.lineWidth = 2.2; [[638, 636], [648, 634]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo(a - 4, b - 6, a, b - 11); x.stroke(); });
    // ---- the shopfront
    const sx0 = 70, sx1 = 650, st = 790, sb = 1142;
    paint(rect(sx0, st - 6, sx1 - sx0, sb - st + 6), TIMBER, { box: [sx0, st, sx1 - sx0, sb - st], n: 300, ang: Math.PI / 2, light: 'rgba(255,230,190,.2)', dark: 'rgba(80,45,15,.14)' });
    // the window: the counter, the machine, shelves, the barista
    paint(rect(98, 822, 300, 230), WARM, { box: [98, 822, 300, 230], n: 120, light: 'rgba(255,250,225,.3)', dark: 'rgba(190,130,60,.12)' });
    x.save(); x.beginPath(); x.rect(98, 822, 300, 230); x.clip();
    [[870, 6], [926, 6]].forEach(([y, n]) => { x.fillStyle = DARKT; x.fillRect(236, y, 170, 6); for (let i = 0; i < n; i++) { x.fillStyle = [CREAM, TERRA, '#2f6f73', '#e9b54a', CREAM, PLUM][(i + (y > 900 ? 2 : 0)) % 6]; const w = 14 + R() * 6, h = 20 + R() * 12; x.fillRect(244 + i * 26 + J(1.5), y - h, w, h); } });
    [150, 214, 300].forEach((lx, i) => { x.strokeStyle = PLUM; x.lineWidth = 1.8; x.beginPath(); x.moveTo(lx, 822); x.lineTo(lx + J(1), 846 + i * 5); x.stroke(); x.fillStyle = 'rgba(255,244,200,.55)'; x.beginPath(); x.arc(lx, 862 + i * 5, 17, 0, Math.PI * 2); x.fill(); x.fillStyle = PLUM; x.beginPath(); x.moveTo(lx - 12, 858 + i * 5); x.quadraticCurveTo(lx, 838 + i * 5, lx + 12, 858 + i * 5); x.fill(); });
    x.fillStyle = '#e9b98f'; x.beginPath(); x.arc(206, 934, 15, 0, Math.PI * 2); x.fill(); x.fillStyle = PLUM; x.beginPath(); x.arc(206, 929, 16, Math.PI, 0); x.fill();                                         // the barista
    x.fillStyle = '#2f6f73'; x.beginPath(); x.moveTo(178, 990); x.quadraticCurveTo(180, 950, 206, 950); x.quadraticCurveTo(232, 950, 234, 990); x.fill();
    paint(rect(98, 984, 300, 70), '#8a5f3a', { box: [98, 984, 300, 70], n: 40, light: 'rgba(255,220,170,.16)' });
    x.fillStyle = '#cfd3d6'; x.fillRect(114, 938, 58, 46); x.fillStyle = '#8f979c'; x.fillRect(114, 938, 58, 9); x.fillRect(124, 962, 9, 16); x.fillRect(152, 962, 9, 16); x.fillStyle = CREAM; x.fillRect(122, 978, 13, 6); x.fillRect(150, 978, 13, 6);
    [[250, 972], [270, 972], [330, 972]].forEach(([a, b]) => { x.fillStyle = CREAM; x.fillRect(a, b, 13, 12); });
    x.strokeStyle = 'rgba(255,255,255,.26)'; x.lineWidth = 26; x.beginPath(); x.moveTo(120, 1060); x.lineTo(214, 814); x.stroke(); x.lineWidth = 10; x.beginPath(); x.moveTo(170, 1060); x.lineTo(262, 814); x.stroke();   // the glass
    x.restore();
    x.strokeStyle = DARKT; x.lineWidth = 8; x.strokeRect(98 + J(1), 822 + J(1), 300, 230); x.lineWidth = 5; x.beginPath(); x.moveTo(228, 822); x.lineTo(229, 1052); x.stroke();
    for (let i = 0; i < 5; i++) { x.strokeStyle = 'rgba(80,45,15,.3)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(104 + i * 60 + J(2), 1066); x.lineTo(104 + i * 60 + J(2), 1136); x.stroke(); }
    // the door, and a little window with the menu
    paint(rect(432, 822, 118, 312), '#2c5a5f', { box: [432, 822, 118, 312], n: 70, ang: Math.PI / 2 - .3, light: 'rgba(200,240,235,.16)', dark: 'rgba(0,20,25,.16)' });
    x.strokeStyle = DARKT; x.lineWidth = 8; x.strokeRect(432, 822, 118, 312); x.fillStyle = '#e9b54a'; x.fillRect(444, 968, 7, 34);
    x.save(); x.translate(491, 902); x.rotate(-.06); x.strokeStyle = CREAM; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-14, -30); x.lineTo(0, -14); x.lineTo(14, -30); x.stroke(); x.fillStyle = CREAM; x.fillRect(-27, -14, 54, 28); x.restore();
    paint(rect(576, 836, 54, 92), WARM, { box: [576, 836, 54, 92], n: 14 }); x.strokeStyle = DARKT; x.lineWidth = 6; x.strokeRect(576, 836, 54, 92); for (let i = 0; i < 5; i++) { x.strokeStyle = 'rgba(58,36,24,.6)'; x.lineWidth = 2; x.beginPath(); x.moveTo(584, 852 + i * 15); x.lineTo(606 + R() * 16, 852 + i * 15 + J(1)); x.stroke(); }
    // the awning, and the shade it throws on the shop
    x.fillStyle = 'rgba(70,40,20,.24)'; x.fillRect(sx0, st - 6, sx1 - sx0, 44);
    for (let i = 0; i < 12; i++) { const a0 = 52 + i * 51.4, a1 = a0 + 51.4, t0 = 80 + i * 46.6, t1 = t0 + 46.6;
      paint(() => { x.beginPath(); x.moveTo(t0, 716 + J(1.5)); x.lineTo(t1, 716 + J(1.5)); x.lineTo(a1, 782); x.quadraticCurveTo((a0 + a1) / 2, 806, a0, 782); x.closePath(); }, i % 2 ? '#fff3da' : TERRA, { box: [a0, 716, 52, 90], n: 9, ang: Math.PI / 2, light: 'rgba(255,240,220,.22)', dark: 'rgba(110,40,20,.12)' }); }
    x.fillStyle = 'rgba(70,40,20,.18)'; x.fillRect(80, 706, 560, 10);
    // ---- the pavement
    paint(rect(-10, sb, AW + 20, H - sb), '#dcd1c0', { box: [0, sb, AW, H - sb], n: 150, light: 'rgba(255,255,255,.25)', dark: 'rgba(110,90,70,.1)' });
    x.fillStyle = 'rgba(90,60,40,.3)'; x.fillRect(0, sb, AW, 5); x.strokeStyle = 'rgba(120,100,80,.34)'; x.lineWidth = 1.8;
    [1186, 1244].forEach(y => { x.beginPath(); x.moveTo(0, y + J(2)); x.lineTo(AW, y + J(2)); x.stroke(); }); for (let i = -2; i < 12; i++) { x.beginPath(); x.moveTo(AW / 2 + (i - 4.5) * 74, sb); x.lineTo(AW / 2 + (i - 4.5) * 112, H); x.stroke(); }
    // a bench, pots, a chalkboard
    x.fillStyle = 'rgba(70,45,25,.2)'; x.beginPath(); x.ellipse(196, 1150, 96, 7, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = DARKT; x.fillRect(108, 1098, 176, 11); x.fillRect(118, 1109, 8, 40); x.fillRect(266, 1109, 8, 40);
    const pot = (px, py, w, h, n, r) => { x.fillStyle = 'rgba(70,45,25,.2)'; x.beginPath(); x.ellipse(px, py + 2, w * .8, 6, 0, 0, Math.PI * 2); x.fill();
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i / (n - 1) - .5) * 2.2 + J(.12), len = r * (.7 + R() * .5), ex = px + Math.cos(a) * len, ey = py - h + Math.sin(a) * len; x.strokeStyle = LEAF2; x.lineWidth = 2; x.beginPath(); x.moveTo(px, py - h + 4); x.quadraticCurveTo(px + (ex - px) * .3, ey + 14, ex, ey); x.stroke();
        paint(() => { x.beginPath(); x.ellipse(ex, ey, 9 + R() * 5, 17 + R() * 7, a + Math.PI / 2, 0, Math.PI * 2); }, i % 2 ? LEAF : LEAF2, { box: [ex - 26, ey - 26, 52, 52], n: 5, light: 'rgba(220,245,200,.3)' }); }
      paint(() => { x.beginPath(); x.moveTo(px - w / 2, py - h); x.lineTo(px + w / 2, py - h); x.lineTo(px + w * .38, py); x.lineTo(px - w * .38, py); x.closePath(); }, '#c9694a', { box: [px - w / 2, py - h, w, h], n: 8, light: 'rgba(255,210,180,.3)' }); };
    pot(48, 1162, 50, 48, 9, 96); pot(676, 1168, 46, 44, 8, 84);
    paint(() => { x.beginPath(); x.moveTo(544, 1246); x.lineTo(558, 1098); x.lineTo(636, 1098); x.lineTo(650, 1246); x.closePath(); }, '#2d2b29', { box: [544, 1098, 106, 148], n: 30, light: 'rgba(255,255,255,.08)' });
    x.strokeStyle = TIMBER; x.lineWidth = 6; x.beginPath(); x.moveTo(544, 1246); x.lineTo(558, 1098); x.lineTo(636, 1098); x.lineTo(650, 1246); x.stroke(); x.fillStyle = 'rgba(70,45,25,.22)'; x.beginPath(); x.ellipse(598, 1250, 62, 6, 0, 0, Math.PI * 2); x.fill();
    // him: the sun is overhead, so only a small shadow at his feet
    x.fillStyle = 'rgba(70,45,25,.32)'; x.beginPath(); x.ellipse(AW / 2 + 8, 1234, 70, 11, 0, 0, Math.PI * 2); x.fill();
    const fig = coverFigure();
    if (fig) { const fh = 372, fw = fh * fig.width / fig.height; x.drawImage(fig, AW / 2 - fw / 2, 1232 - fh * fig._foot, fw, fh); }
    // ---- the light of the hour over everything below the sky, then whatever is lit from inside
    if (L.tint) { x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = L.tint[1]; x.fillStyle = L.tint[0]; x.fillRect(0, 146, AW, H - 146); x.restore(); }
    if (L.night || light === 'golden') { const k = L.night ? 1 : .3; x.save(); x.globalCompositeOperation = 'screen';
      x.fillStyle = 'rgba(255,200,110,' + .62 * k + ')'; x.fillRect(102, 826, 292, 222); x.fillRect(579, 839, 48, 86);
      x.fillStyle = 'rgba(120,210,200,' + .2 * k + ')'; x.fillRect(436, 826, 110, 304);
      const spill = x.createRadialGradient(250, 1150, 20, 250, 1150, 330); spill.addColorStop(0, 'rgba(255,196,110,' + .42 * k + ')'); spill.addColorStop(1, 'rgba(255,196,110,0)'); x.fillStyle = spill; x.fillRect(0, 1060, AW, 242);
      const lamp = x.createRadialGradient(646, 654, 6, 646, 654, 90); lamp.addColorStop(0, 'rgba(255,170,120,' + .5 * k + ')'); lamp.addColorStop(1, 'rgba(255,170,120,0)'); x.fillStyle = lamp; x.fillRect(540, 560, 180, 190);
      x.restore(); }
    // ---- the lettering, on its own sheet so the brush can run dry
    const lc = canvas(AW, H), g = lc.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round';
    const letter = (ch, px, by, size, lw) => { const gl = GLYPH[ch]; if (!gl) return; const sx = size * .8;
      g.save(); g.translate(px, by + J(size * .03)); g.rotate(J(.045)); const sc = 1 + J(.04); g.scale(sc, sc);
      gl.s.forEach(st => { const curvy = !Array.isArray(st), pts = (curvy ? st.p : st).map(p => [p[0] * sx + J(size * .01), -p[1] * size + J(size * .01)]);
        if (curvy) smooth(g, pts, false);
        else { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, bow = J(d * .04); g.quadraticCurveTo((a[0] + b[0]) / 2 - (b[1] - a[1]) / d * bow, (a[1] + b[1]) / 2 + (b[0] - a[0]) / d * bow, b[0], b[1]); } }
        g.lineWidth = lw * (.88 + R() * .26); g.stroke(); });
      g.restore(); };
    const word = (text, cx, by, size, lw, gap, arc) => { const adv = ch => ch === ' ' ? size * .34 : GLYPH[ch].w * size * .8 + gap; let total = -gap; for (const ch of text) total += adv(ch);
      let px = cx - total / 2; for (const ch of text) { const t = (px - (cx - total / 2)) / total, lift = (arc || 0) * (1 - (2 * t - 1) * (2 * t - 1)); letter(ch, px, by - lift, size, lw); px += adv(ch); } };
    g.strokeStyle = L.night ? CREAM : PLUM; word('LAST', AW / 2 + 12, 398, 172, 15, 28, 10); word('SEEN', AW / 2 + 12, 596, 172, 15, 28, -6);
    word('A POP-UP BOOK OF PLACES', AW / 2 + 16, 668, 25, 3.3, 6.5, -8);
    g.lineWidth = 3; [[[214, 246], [250, 236], [282, 244]], [[452, 240], [486, 232], [520, 244]]].forEach(sw => { smooth(g, sw, false); g.stroke(); });
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 5200; i++) { g.fillStyle = 'rgba(0,0,0,' + (.25 + R() * .5) + ')'; g.fillRect(R() * AW, R() * H, 1 + R() * 2.6, 1 + R() * 1.4); }
    x.drawImage(lc, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, AW, H); g.strokeStyle = CREAM; word('BY', 597, 1150, 19, 2.6, 5, 0); word('RAUFAN', 597, 1186, 19, 2.6, 4.5, 0); g.lineWidth = 2; smooth(g, [[572, 1206], [598, 1200], [624, 1208]], false); g.stroke();
    g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 700; i++) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(550 + R() * 100, 1120 + R() * 100, 1 + R() * 2, 1 + R()); }   // chalk
    x.drawImage(lc, 0, 0);
    // ---- paint spatter, then a little darkness in the corners
    for (let i = 0; i < 900; i++) { x.fillStyle = 'rgba(255,244,220,' + (.05 + R() * .16) + ')'; x.beginPath(); x.arc(R() * AW, R() * H, .5 + R() * 1.5, 0, Math.PI * 2); x.fill(); }
    const vg = x.createRadialGradient(AW / 2, H / 2, 420, AW / 2, H / 2, 880); vg.addColorStop(0, 'rgba(60,35,20,0)'); vg.addColorStop(1, 'rgba(60,35,20,.2)'); x.fillStyle = vg; x.fillRect(0, 0, AW, H);
    // ---- the cloth spine, wrapped a little way onto the board
    x.fillStyle = '#27324c'; x.fillRect(AW, 0, SP, H);
    for (let i = 0; i < 5200; i++) { x.fillStyle = R() < .5 ? 'rgba(255,255,255,.045)' : 'rgba(0,0,0,.08)'; x.fillRect(AW + R() * SP, R() * H, 2 + R() * 3, 1); }
    const sh = x.createLinearGradient(AW - 14, 0, AW, 0); sh.addColorStop(0, 'rgba(5,10,30,0)'); sh.addColorStop(1, 'rgba(5,10,30,.4)'); x.fillStyle = sh; x.fillRect(AW - 14, 0, 14, H);
    x.fillStyle = '#d8b671'; x.fillRect(AW + 10, 0, 2, H);
    return (coverCache[light] = c);
  }

  LS.popup = { VIEW, project, SHUT, FRONT, cover: coverArt };
})();
