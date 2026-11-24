/* The Timeline as a map (/timeline/map/). A folded paper sheet of greater Tokyo lying on the desk, in three.js: real coast, rivers and main
   roads (geo.js, from OpenStreetMap), paper blocks where the city is tall, trees in the parks, clouds drifting over. Each place stands on it as a
   miniature of its own scene. Drag to move, scroll to zoom; click a place and the camera drops to the spot and its pop-up book opens.
   A place appears here only if its neighbourhood is in AREA below: add the neighbourhood when a new one is visited. A hidden place has no
   neighbourhood to give, so it is not on the map at all. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const html = document.documentElement, view = document.getElementById('tm-view'), GEO = window.TL_MAP_GEO, TL2 = window.TL2;
const ja = () => html.getAttribute('data-lang') === 'ja', tod = () => html.getAttribute('data-tod') || 'midday';
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
// Book and Map are one page (see /timeline/view.js). The map is built once, the first time it is wanted, and after that it is only shown and put away:
// `shown` says which, and while it is away and has nothing left to make ready it sleeps, drawing nothing.
let shown = html.getAttribute('data-view') === 'map', asleep = false, shownAt = 0, raf = 0;
const PI = Math.PI, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }, inOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---------- the ground: 1 unit is 1 km, north is -z ----------
const B = { w: 139.40, e: 140.13, s: 35.515, n: 35.80 }, LNGC = 139.765, LATC = 35.6575, KX = 90.46, KZ = 110.95;
const wx = lng => (lng - LNGC) * KX, wz = lat => -(lat - LATC) * KZ;
const X0 = wx(B.w), X1 = wx(B.e), Z0 = wz(B.n), Z1 = wz(B.s), SW = X1 - X0, SD = Z1 - Z0, CX = (X0 + X1) / 2, CZ = (Z0 + Z1) / 2;
const TW = 4096, TH = Math.round(TW * SD / SW), KMPX = SW / TW;
const tu = lng => (lng - B.w) / (B.e - B.w) * TW, tv = lat => (B.n - lat) / (B.n - B.s) * TH;
const FOLD = .2, DIP = .1;
function hAt(x, z) { const f = clamp((x - X0) / SW, 0, 1) * 4, k = Math.floor(f) % 2 ? 1 - (f % 1) : f % 1, t = clamp((z - Z0) / SD, 0, 1); return (k - .5) * 2 * FOLD - DIP * (1 - Math.abs(2 * t - 1)) + liftAt(x, z); }
// The sheet's four corners can be lifted a little (see "things answer the hand"). `v` is how far each is up, 0 to 1; whatever stands near one rides up with it.
const RC = 9, CORN = [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]].map(c => ({ x: c[0], z: c[1], v: 0, vel: 0, to: 0, live: false, list: [] })); let curled = false, LIFT = 2;   /* LIFT: how high a corner comes, in km; kept to about 44px on screen whatever the zoom (see answer) */
function liftAt(x, z) { if (!curled) return 0; let y = 0; for (let i = 0; i < 4; i++) { const c = CORN[i]; if (!c.v) continue; const d = Math.hypot(x - c.x, z - c.z); if (d < RC) { const w = 1 - d / RC; y += c.v * LIFT * w * w; } } return y; }

// one spot per neighbourhood, not per address: [lat, lng]
const AREA = { 'Yoyogi-Uehara, Tokyo': [35.669, 139.680], 'Shimokitazawa, Tokyo': [35.661, 139.667], 'Shibuya, Tokyo': [35.659, 139.701], 'Yoyogi, Tokyo': [35.672, 139.695],
  'Shimotakaido, Tokyo': [35.666, 139.641], 'Nakameguro, Tokyo': [35.644, 139.699], 'Nihonbashi, Tokyo': [35.684, 139.776], 'Marunouchi, Tokyo': [35.680, 139.763],
  'Ariake, Tokyo': [35.630, 139.794], 'Yanagisawa, Nishitokyo': [35.728, 139.552], 'Nakacho, Musashino': [35.706, 139.561], 'Izumi-Tamagawa, Komae': [35.6275, 139.5735],
  'Noborito, Kawasaki': [35.6206, 139.570], 'Yurigaoka, Kawasaki': [35.609, 139.5165], 'Mihama, Chiba': [35.648, 140.035] };
// where the city stands tall: [lat, lng, radius km, blocks, height]
const HUBS = [[35.690, 139.700, 1.3, 120, 1.05], [35.659, 139.701, .9, 70, .7], [35.681, 139.765, 1.4, 130, .9], [35.729, 139.711, .9, 60, .7], [35.628, 139.739, .9, 50, .65], [35.665, 139.742, 1.1, 80, .95],
  [35.705, 139.775, 1, 50, .4], [35.628, 139.782, 1.1, 36, .4], [35.655, 139.792, 1, 40, .6], [35.531, 139.697, 1, 45, .5], [35.576, 139.659, .6, 30, .85], [35.648, 140.045, .9, 40, .5],
  [35.703, 139.580, .6, 24, .25], [35.611, 139.627, .5, 18, .5], [35.607, 140.106, 1, 34, .35], [35.700, 139.985, .8, 24, .3], [35.698, 139.414, .7, 24, .3], [35.652, 139.544, .5, 14, .22], [35.603, 139.508, .5, 14, .25]];
// green: [lat, lng, half-width km, half-depth km]
const PARKS = [[35.6735, 139.697, .55, .75], [35.6852, 139.710, .5, .32], [35.685, 139.753, .75, .85], [35.7148, 139.773, .35, .5], [35.6257, 139.661, .35, .35], [35.630, 139.616, .4, .35], [35.700, 139.573, .3, .22],
  [35.717, 139.516, .6, .35], [35.738, 139.598, .45, .2], [35.763, 139.629, .4, .4], [35.642, 139.861, .45, .3], [35.650, 139.827, .3, .3], [35.638, 140.048, .2, .5], [35.609, 139.561, .5, .4], [35.586, 139.652, .3, .25],
  [35.671, 139.549, .35, .3], [35.679, 139.528, .4, .25], [35.787, 139.87, .5, .3], [35.618, 139.835, .3, .35], [35.660, 139.763, .2, .2], [35.675, 139.808, .25, .2], [35.625, 139.517, .5, .35], [35.580, 139.48, .7, .5], [35.56, 139.56, .5, .35]];
const NAMES = [['Shinjuku', '新宿', 35.690, 139.700], ['Shibuya', '渋谷', 35.659, 139.701], ['Ikebukuro', '池袋', 35.729, 139.711], ['Tokyo Stn', '東京駅', 35.681, 139.767], ['Ueno', '上野', 35.714, 139.777], ['Shinagawa', '品川', 35.628, 139.739],
  ['Odaiba', 'お台場', 35.622, 139.776], ['Haneda', '羽田', 35.549, 139.781], ['Kawasaki', '川崎', 35.531, 139.697], ['Kichijoji', '吉祥寺', 35.703, 139.580], ['Chofu', '調布', 35.652, 139.544], ['Setagaya', '世田谷', 35.642, 139.650],
  ['Urayasu', '浦安', 35.653, 139.902], ['Funabashi', '船橋', 35.700, 139.985], ['Makuhari', '幕張', 35.660, 140.045], ['Chiba', '千葉', 35.607, 140.106], ['Futako-Tamagawa', '二子玉川', 35.611, 139.627], ['Musashi-Kosugi', '武蔵小杉', 35.576, 139.659],
  ['Nakano', '中野', 35.706, 139.666], ['Asakusa', '浅草', 35.712, 139.797], ['Kasai', '葛西', 35.664, 139.872], ['Machida way', '町田方面', 35.566, 139.44]];
const BIG = [['TOKYO', '東 京', 35.758, 139.675], ['KANAGAWA', '神 奈 川', 35.542, 139.60], ['CHIBA', '千 葉', 35.745, 140.04], ['SAITAMA', '埼 玉', 35.792, 139.50]];

// ---------- the sheet's picture ----------
function path(x, arr) { x.beginPath(); arr.forEach(p => { for (let i = 0; i < p.length; i += 2) { const px = tu(139 + p[i] / 1e4), py = tv(35 + p[i + 1] / 1e4); if (i) x.lineTo(px, py); else x.moveTo(px, py); } }); }
// The sea is whatever a flood from the middle of the bay can reach without crossing the coastline.
let sea = null, seaPic = null, seaShade = null;
function flood() {
  const c = mk(TW, TH), x = c.getContext('2d', { willReadFrequently: true });
  x.fillStyle = '#fff'; x.fillRect(0, 0, TW, TH); x.strokeStyle = '#000'; x.lineWidth = 2.6; x.lineJoin = 'round'; path(x, GEO.coast); x.stroke();
  const d = x.getImageData(0, 0, TW, TH).data, m = new Uint8Array(TW * TH), st = new Int32Array(TW * TH); let n = 0, cnt = 0;
  const push = (px, py) => { const i = py * TW + px; if (!m[i] && d[i * 4] > 128) { m[i] = 1; st[n++] = i; cnt++; } };
  [[139.90, 35.56], [139.83, 35.585], [140.0, 35.60]].forEach(s => push(Math.round(tu(s[0])), Math.round(tv(s[1]))));
  while (n) { const i = st[--n], px = i % TW, py = (i - px) / TW; if (px > 0) push(px - 1, py); if (px < TW - 1) push(px + 1, py); if (py > 0) push(0 + px, py - 1); if (py < TH - 1) push(px, py + 1); }
  if (cnt / (TW * TH) > .6) return;            // a gap in the coast would flood the land: better no sea than that
  sea = m;
  seaPic = mk(TW, TH); const sx = seaPic.getContext('2d'), im = sx.createImageData(TW, TH), o = im.data;
  for (let i = 0; i < m.length; i++) if (m[i]) { o[i * 4] = 184; o[i * 4 + 1] = 212; o[i * 4 + 2] = 228; o[i * 4 + 3] = 255; }
  sx.putImageData(im, 0, 0);
  // the land is a layer of paper above the water: it throws a shadow onto it
  const land = mk(TW, TH), lx = land.getContext('2d'); lx.fillStyle = '#000'; lx.fillRect(0, 0, TW, TH); lx.globalCompositeOperation = 'destination-out'; lx.drawImage(seaPic, 0, 0);
  seaShade = mk(TW, TH); const hx = seaShade.getContext('2d'); hx.shadowColor = 'rgba(28, 62, 92, .6)'; hx.shadowBlur = 18; hx.shadowOffsetX = 5; hx.shadowOffsetY = 8; hx.drawImage(land, 0, 0);
  hx.shadowColor = 'transparent'; hx.globalCompositeOperation = 'destination-in'; hx.drawImage(seaPic, 0, 0);
}
const isSea = (lng, lat) => { if (!sea) return false; const px = Math.round(tu(lng)), py = Math.round(tv(lat)); return px < 0 || py < 0 || px >= TW || py >= TH ? true : !!sea[py * TW + px]; };
const inPark = (lng, lat) => PARKS.some(p => Math.pow((lng - p[1]) * KX / p[2], 2) + Math.pow((lat - p[0]) * KZ / p[3], 2) < 1.1);

const art = mk(TW, TH);
function paint() {
  const x = art.getContext('2d'), L = ja() ? 1 : 0, R = rng(7), FONT = '"Plus Jakarta Sans", "Noto Sans JP", system-ui, sans-serif';
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  x.fillStyle = '#f6f1e5'; x.fillRect(0, 0, TW, TH);
  // the city, as a faint wash where it is densest
  const wash = (lat, lng, km, a) => { const px = tu(lng), py = tv(lat), r = km / KMPX, g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(168, 150, 122, ' + a + ')'); g.addColorStop(1, 'rgba(168, 150, 122, 0)'); x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); };
  wash(35.685, 139.735, 17, .16); HUBS.forEach(h => wash(h[0], h[1], h[2] * 3, .16));
  // parks: soft uneven patches with a darker rim
  PARKS.forEach((p, i) => { const px = tu(p[1]), py = tv(p[0]), rx = p[2] / KMPX, ry = p[3] / KMPX, Q = rng(90 + i); x.beginPath();
    for (let k = 0; k <= 16; k++) { const a = k / 16 * PI * 2, w = 1 + (Q() - .5) * .28, qx = px + Math.cos(a) * rx * w, qy = py + Math.sin(a) * ry * w; if (k) x.lineTo(qx, qy); else x.moveTo(qx, qy); }
    x.closePath(); x.fillStyle = '#cfdcab'; x.fill(); x.strokeStyle = 'rgba(132, 158, 92, .55)'; x.lineWidth = 2; x.lineJoin = 'round'; x.stroke(); });
  // rivers
  x.lineCap = 'round'; x.lineJoin = 'round';
  GEO.rivers.forEach(r => { path(x, [r.p]); x.strokeStyle = '#9dbfd2'; x.lineWidth = Math.max(2.2, r.w / KMPX + 2.4); x.stroke(); });
  GEO.rivers.forEach(r => { path(x, [r.p]); x.strokeStyle = '#b8d4e4'; x.lineWidth = Math.max(1.2, r.w / KMPX); x.stroke(); });
  // the bay, the land's shadow on it, and a scatter of little waves
  if (seaPic) { x.drawImage(seaPic, 0, 0); x.drawImage(seaShade, 0, 0);
    x.strokeStyle = 'rgba(255, 255, 255, .55)'; x.lineWidth = 1.5;
    for (let i = 0; i < 900; i++) { const px = R() * TW, py = R() * TH; if (!sea[Math.floor(py) * TW + Math.floor(px)]) continue; const s = 7 + R() * 7; x.beginPath(); x.moveTo(px - s, py); x.quadraticCurveTo(px - s / 2, py - s * .45, px, py); x.quadraticCurveTo(px + s / 2, py + s * .45, px + s, py); x.stroke(); } }
  // main roads: pale, with a soft edge; the expressways warmer
  path(x, GEO.trunk); x.strokeStyle = 'rgba(126, 108, 80, .2)'; x.lineWidth = 4.4; x.stroke(); x.strokeStyle = '#fffdf8'; x.lineWidth = 2.4; x.stroke();
  path(x, GEO.motorway); x.strokeStyle = 'rgba(150, 110, 58, .42)'; x.lineWidth = 6.2; x.stroke(); x.strokeStyle = '#f8dfa2'; x.lineWidth = 3.6; x.stroke();
  // names
  const ls = v => { try { x.letterSpacing = v; } catch (e) {} };
  x.textAlign = 'center'; x.textBaseline = 'middle';
  BIG.forEach(b => { x.font = '500 44px ' + FONT; ls(L ? '8px' : '22px'); x.fillStyle = 'rgba(70, 60, 44, .2)'; x.fillText(b[L], tu(b[3]), tv(b[2])); });
  x.font = 'italic 500 34px ' + FONT; ls('10px'); x.fillStyle = 'rgba(52, 96, 128, .5)'; x.fillText(L ? '東京湾' : 'Tokyo Bay', tu(139.93), tv(35.563));
  x.save(); x.translate(tu(139.612), tv(35.6075)); x.rotate(.47); x.font = 'italic 500 17px ' + FONT; ls('4px'); x.fillStyle = 'rgba(52, 96, 128, .6)'; x.fillText(L ? '多摩川' : 'Tama River', 0, -16); x.restore();
  NAMES.forEach(n => { const px = tu(n[3]), py = tv(n[2]) + 30; x.font = '600 ' + (L ? 19 : 17) + 'px ' + FONT; ls(L ? '2px' : '3px'); x.lineWidth = 5; x.strokeStyle = 'rgba(246, 241, 229, .8)'; x.strokeText(L ? n[1] : n[0].toUpperCase(), px, py); x.fillStyle = 'rgba(70, 60, 44, .62)'; x.fillText(L ? n[1] : n[0].toUpperCase(), px, py); });
  // the map's furniture: a title, a scale, north
  x.textAlign = 'left'; ls('16px'); x.font = '700 58px ' + FONT; x.fillStyle = 'rgba(52, 44, 32, .82)'; x.fillText('LAST SEEN', 84, 104);
  ls('5px'); x.font = '500 18px ' + FONT; x.fillStyle = 'rgba(52, 44, 32, .55)'; x.fillText(L ? '見かけた場所の地図 · 東京とその周辺' : 'A MAP OF PLACES · TOKYO AND AROUND', 88, 154);
  x.fillStyle = 'rgba(52, 44, 32, .5)'; x.fillRect(86, 180, 468, 2);
  const km5 = 5 / KMPX, sy = TH - 86; x.fillStyle = 'rgba(52, 44, 32, .6)'; x.fillRect(86, sy, km5, 3); [0, .5, 1].forEach(t => x.fillRect(86 + km5 * t - 1, sy - 9, 2, 12));
  ls('2px'); x.font = '500 16px ' + FONT; x.fillText('0', 80, sy - 24); x.fillText('5 km', 86 + km5 - 18, sy - 24);
  const nx = TW - 130, ny = 150; x.save(); x.translate(nx, ny); x.strokeStyle = 'rgba(52, 44, 32, .5)'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 44, 0, PI * 2); x.stroke();
  x.fillStyle = 'rgba(52, 44, 32, .7)'; x.beginPath(); x.moveTo(0, -58); x.lineTo(13, 0); x.lineTo(-13, 0); x.closePath(); x.fill(); x.beginPath(); x.moveTo(0, 58); x.lineTo(13, 0); x.lineTo(-13, 0); x.closePath(); x.stroke();
  x.textAlign = 'center'; ls('0px'); x.font = '700 20px ' + FONT; x.fillText('N', 0, -78); x.restore();
  // paper: grain, and a soft worn line along each fold
  const g = mk(160, 160), gx = g.getContext('2d'), gi = gx.createImageData(160, 160), Q = rng(31);
  for (let i = 0; i < gi.data.length; i += 4) { const v = Q() > .5 ? 255 : 60; gi.data[i] = gi.data[i + 1] = gi.data[i + 2] = v; gi.data[i + 3] = Q() * 26; }
  gx.putImageData(gi, 0, 0); x.fillStyle = x.createPattern(g, 'repeat'); x.fillRect(0, 0, TW, TH);
  [.25, .5, .75].forEach(t => { const px = TW * t, gr = x.createLinearGradient(px - 14, 0, px + 14, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.45, 'rgba(255,255,255,.5)'); gr.addColorStop(.55, 'rgba(120,100,70,.16)'); gr.addColorStop(1, 'rgba(120,100,70,0)'); x.fillStyle = gr; x.fillRect(px - 14, 0, 28, TH); });
  const gr = x.createLinearGradient(0, TH / 2 - 14, 0, TH / 2 + 14); gr.addColorStop(0, 'rgba(120,100,70,0)'); gr.addColorStop(.45, 'rgba(120,100,70,.16)'); gr.addColorStop(.55, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, TH / 2 - 14, TW, 28);
}

// ---------- the scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.debug.checkShaderErrors = false;   // asking for a shader's log makes the page wait for it to be built
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const el = renderer.domElement; el.tabIndex = 0; el.setAttribute('role', 'application'); view.insertBefore(el, view.firstChild);
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 2, 1, 600);
const amb = new THREE.AmbientLight(0xffffff, 2), sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0006; sun.shadow.normalBias = .02; sun.shadow.radius = 5; scene.add(amb, sun, sun.target);

flood(); paint();
const tex = new THREE.CanvasTexture(art); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
// The sheet is a grid that can fold: an accordion across its four panels. `a` is how steeply the panels stand; at rest it is nearly flat.
const A0 = Math.asin(2 * FOLD / (SW / 4)), A_SHUT = 1.27;
const sheetGeo = new THREE.PlaneGeometry(SW, SD, 32, 16).toNonIndexed(), sheetUV = sheetGeo.attributes.uv.array.slice();
function foldSheet(a) { const p = sheetGeo.attributes.position, ca = Math.cos(a) / Math.cos(A0), sa = Math.sin(a) / Math.sin(A0);
  for (let i = 0; i < p.count; i++) { const u = sheetUV[i * 2], v = sheetUV[i * 2 + 1], f = u * 4, k = Math.min(3, Math.floor(f)), t = f - k, tri = k % 2 ? 1 - t : t;
    p.setXYZ(i, (u - .5) * SW * ca, (tri * 2 * FOLD - FOLD) * sa + (Math.abs(sa) - 1) * FOLD - DIP * (1 - Math.abs(2 * (1 - v) - 1)) + liftAt(CX + (u - .5) * SW, CZ + (.5 - v) * SD), (.5 - v) * SD); }
  p.needsUpdate = true; sheetGeo.computeVertexNormals(); sheetGeo.computeBoundingSphere(); }
foldSheet(A0);
const sheet = new THREE.Mesh(sheetGeo, new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide })); sheet.position.set(CX, 0, CZ); sheet.receiveShadow = true; sheet.castShadow = true; scene.add(sheet);
const deskGeo = new THREE.PlaneGeometry(600, 600); deskGeo.rotateX(-PI / 2);
const desk = new THREE.Mesh(deskGeo, new THREE.ShadowMaterial({ opacity: .2 })); desk.position.set(CX, -.42, CZ); desk.receiveShadow = true; scene.add(desk);

// What stands on the sheet rises out of it once it lies flat, in a wave from the middle of the city outwards.
const grown = [], gM = new THREE.Matrix4(), gV = new THREE.Vector3(), gS = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), HX = wx(139.767), HZ = wz(35.681);
// The arrival, in seconds from when the sheet starts to open. The first time in a visit it is the whole thing; coming back (from the book, say) it is a short one.
const SEEN = (() => { try { return !!sessionStorage.getItem('tm-opened'); } catch (e) { return false; } })();   /* written when the sheet really opens in front of someone (see frame), not when it is made ready out of sight */
const INTRO = SEEN ? { fold: .6, city: .45, wave: .012, rise: .4, place: .7, gap: .04, cloud: [.6, .6], end: 1.5, tail: 1.2 } : { fold: 1.3, city: .95, wave: .026, rise: .55, place: 1.35, gap: .06, cloud: [1.5, 1], end: 2.7, tail: 2.1 };
const backOut = t => { t = clamp(t, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function grow(T) { grown.forEach(G => { G.items.forEach((it, i) => { const k = T > 90 ? 1 : backOut((T - it.d * INTRO.wave) / INTRO.rise), w = k < .002 ? 1e-4 : G.whole ? k : 1;   // nothing shows before its turn
    gM.compose(gV.set(it.x, it.y + it.cy * k, it.z), it.q, gS.set(it.sx * w, Math.max(1e-4, it.sy * k), it.sz * w)); G.im.setMatrixAt(i, gM); }); G.im.instanceMatrix.needsUpdate = true; }); solo.forEach(m => m.scale.setScalar(T > 90 ? 1 : Math.max(1e-4, backOut((T - .3) / INTRO.rise)))); }
const solo = [];
// paper blocks where the city is tall, and a low scatter everywhere else that is land
const blockMat = new THREE.MeshLambertMaterial({ color: 0xfbf7ee, emissive: 0xffc77a, emissiveIntensity: 0 });
{ const R = rng(2026), list = [], ok = (lng, lat) => lng > B.w + .004 && lng < B.e - .004 && lat > B.s + .004 && lat < B.n - .004 && !isSea(lng, lat) && !inPark(lng, lat) &&
    !Object.keys(AREA).some(k => Math.hypot((lng - AREA[k][1]) * KX, (lat - AREA[k][0]) * KZ) < .75);
  HUBS.forEach(h => { for (let i = 0; i < h[3]; i++) { const a = R() * PI * 2, r = Math.sqrt(R()) * h[2], lng = h[1] + Math.cos(a) * r / KX, lat = h[0] + Math.sin(a) * r / KZ; if (!ok(lng, lat)) continue;
    const near = 1 - r / h[2]; list.push([lng, lat, .1 + R() * .13, .1 + R() * .13, h[4] * (.18 + near * near * .82) * (.55 + R() * .6)]); } });
  for (let i = 0; i < 2600; i++) { const lng = B.w + R() * (B.e - B.w), lat = B.s + R() * (B.n - B.s), dc = Math.hypot((lng - 139.72) * KX, (lat - 35.68) * KZ); if (R() < dc / 34 || !ok(lng, lat)) continue; list.push([lng, lat, .08 + R() * .1, .08 + R() * .1, .04 + R() * .11]); }
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0), blockMat, list.length), col = new THREE.Color();
  const items = list.map((b, i) => { const x = wx(b[0]), z = wz(b[1]), t = R(); col.setRGB(.985 - t * .05, .97 - t * .055, .93 - t * .07); im.setColorAt(i, col);
    return { x, z, y: hAt(x, z), cy: 0, sx: b[2], sy: b[4], sz: b[3], q: new THREE.Quaternion().setFromAxisAngle(UP, (R() - .5) * .9), d: Math.hypot(x - HX, z - HZ) + R() * 3 }; });
  im.castShadow = true; im.receiveShadow = true; scene.add(im); grown.push({ im, items }); }
// trees in the parks
const treeMat = new THREE.MeshLambertMaterial({ color: 0xa8c07f, flatShading: true });
{ const R = rng(404), list = []; PARKS.forEach(p => { const n = Math.round(p[2] * p[3] * 150); for (let i = 0; i < n; i++) { const a = R() * PI * 2, r = Math.sqrt(R()) * .92; list.push([p[1] + Math.cos(a) * r * p[2] / KX, p[0] + Math.sin(a) * r * p[3] / KZ, .055 + R() * .05]); } });
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), treeMat, list.length), col = new THREE.Color();
  const items = list.map((t, i) => { const x = wx(t[0]), z = wz(t[1]), k = R(); col.setRGB(.60 + k * .12, .72 + k * .1, .44 + k * .1); im.setColorAt(i, col);
    return { x, z, y: hAt(x, z), cy: t[2] * .7, sx: t[2], sy: t[2] * 1.15, sz: t[2], q: new THREE.Quaternion().setFromAxisAngle(UP, R() * 3), d: Math.hypot(x - HX, z - HZ) + 4 + R() * 3 }; });
  im.castShadow = true; im.receiveShadow = true; scene.add(im); grown.push({ im, items, whole: true }); }
// two things everyone knows the skyline by
{ const tg = new THREE.ConeGeometry(.2, 1.5, 4); tg.translate(0, .75, 0); const tower = new THREE.Mesh(tg, new THREE.MeshLambertMaterial({ color: 0xd9563c, flatShading: true })), tx = wx(139.7454), tz = wz(35.6586); tower.position.set(tx, hAt(tx, tz), tz); tower.castShadow = true; scene.add(tower);
  const sg = new THREE.CylinderGeometry(.03, .13, 2.4, 6); sg.translate(0, 1.2, 0); const tree = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ color: 0xe3e8ea, flatShading: true })), sx = wx(139.8107), sz = wz(35.7101); tree.position.set(sx, hAt(sx, sz), sz); tree.castShadow = true; scene.add(tree); solo.push(tower, tree); }
// clouds: flat paper shapes drifting over, their shadows crossing the map
const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .94 }), clouds = [];
{ const R = rng(11); for (let i = 0; i < 5; i++) { const g = new THREE.Group(), n = 3 + Math.floor(R() * 2), s = .8 + R() * .9;
    for (let k = 0; k < n; k++) { const geo = new THREE.CircleGeometry(s * (.55 + R() * .5), 28); geo.rotateX(-PI / 2); const m = new THREE.Mesh(geo, cloudMat); m.position.set((k - (n - 1) / 2) * s * .8, k * .012, (R() - .5) * s * .5); m.scale.z = .62; m.castShadow = true; g.add(m); }
    g.position.set(X0 + R() * SW, 6 + R() * 2.5, Z0 + 2 + R() * (SD - 4)); g.userData.v = .22 + R() * .2; scene.add(g); clouds.push(g); } }

// ---------- the places ----------
// One spot per place, near the middle of its neighbourhood (not its address). Places that share a neighbourhood stand in a small
// ring round it, so each can be reached on its own; only a second visit to the very same place piles up, with a count.
const visits = TL2.places().slice().reverse().filter(p => AREA[p.area.en]), piles = [], byKey = {}, perArea = {};
visits.forEach((v, i) => { v.n = i; const k = v.name.en + '|' + v.area.en; if (!byKey[k]) { byKey[k] = { key: k, area: v.area.en, v: [] }; piles.push(byKey[k]); (perArea[v.area.en] = perArea[v.area.en] || []).push(byKey[k]); } byKey[k].v.push(v); v.pile = byKey[k]; });
piles.forEach(p => { const g = perArea[p.area], n = g.length, a = AREA[p.area], ang = PI / 2 + g.indexOf(p) * 2 * PI / n, r = n > 1 ? .46 : 0; p.x = wx(a[1]) + Math.cos(ang) * r; p.z = wz(a[0]) - Math.sin(ang) * r; });
let cur = visits.length - 1, carried = false;
{ const h = decodeURIComponent(location.hash.slice(1)), at = h ? visits.findIndex(v => v.id === h || v.place === h) : -1; if (at >= 0) { cur = at; carried = true; } }   // a #place link, or the place the book was open at
TL2.places().forEach(p => { if (!AREA[p.area.en] && !p.hidden && window.console) console.warn('Timeline map: no spot for "' + p.area.en + '". Add it to AREA in /timeline/map/map.js.'); });
const baseMat = new THREE.MeshBasicMaterial({ color: 0xfffdf8 }), nowMat = new THREE.MeshBasicMaterial({ color: 0xc4402e }), ringMat = new THREE.MeshBasicMaterial({ color: 0xc4402e, transparent: true, opacity: .6, side: THREE.DoubleSide });
const glowTex = (() => { const c = mk(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255, 205, 130, .95)'); g.addColorStop(.4, 'rgba(255, 190, 110, .35)'); g.addColorStop(1, 'rgba(255, 190, 110, 0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const shadeTex = (() => { const c = mk(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(30, 24, 14, .7)'); g.addColorStop(.55, 'rgba(30, 24, 14, .22)'); g.addColorStop(1, 'rgba(30, 24, 14, 0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
function badgeTex(n) { const c = mk(96, 96), x = c.getContext('2d'); x.fillStyle = '#c4402e'; x.beginPath(); x.arc(48, 48, 40, 0, PI * 2); x.fill(); x.lineWidth = 6; x.strokeStyle = '#fffdf8'; x.stroke(); x.fillStyle = '#fff'; x.font = '700 46px "Plus Jakarta Sans", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 48, 51); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// Each place is a miniature of its own scene: the same drawing the book stands up, cut into a back, a front and whatever stands in the street,
// hinged on a little tab of its pavement. MW is its width; a scene is 400 units across.
const MW = 1.6, U = MW / 400, TD = .56, TZ = -.26, SHEETZ = [-.2, -.06, .15], hits = [], minis = {}, queue = [];
function mount(S, light, wpx, extra) { const dpr = Math.min(window.devicePixelRatio || 1, 2), host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-30000px;top:0;pointer-events:none;width:' + (wpx / dpr) + 'px;height:' + (wpx * .75 / dpr) + 'px'; host.innerHTML = '<canvas style="width:100%;height:100%;display:block"></canvas>'; document.body.appendChild(host);
  return { host, api: LastSeen.mount(host, S, Object.assign({ manual: true, tod: light }, extra)), canvas: host.querySelector('canvas') }; }
function crop(src, y0, y1) { const k = src.width / 400, c = mk(src.width, Math.max(1, Math.round((y1 - y0) * k))); c.getContext('2d').drawImage(src, 0, -Math.round(y0 * k)); return c; }
function groundTop(S) { const w = S.size[0], h = S.size[1]; let top = null; (S.layers.back || []).forEach(p => { if (p.t === 'rect' && p.w >= w * .9 && p.y + p.h >= h - 2 && p.y > h * .5 && (top == null || p.y < top)) top = p.y; }); return top == null ? LastSeen.groundOf(S).y0 - 4 : top; }
// The highest thing on a place's back sheet, for the crow to sit on: [across from the middle, height], in the miniature's own units. It is worked out from the
// scene's shapes on a scrap of canvas the size of a stamp. (Reading the painted picture back instead stalls the page for tens of milliseconds a place.)
const roofX = mk(100, 75).getContext('2d', { willReadFrequently: true });
function roofOf(S, yg) { const K = window.LastSeen && LastSeen._kit, W = S.size[0], x = roofX, q = 100 / W, hh = Math.max(1, Math.min(75, Math.round(yg * q))); if (!K) return null;
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 100, 75); x.setTransform(q, 0, 0, q, 0, 0); x.fillStyle = '#000';
  (S.layers.back || []).forEach(p => { if ((p.a != null && p.a < .6) || (p.t === 'rect' && p.w >= W * .9 && (p.y <= 1 || p.y >= yg - 1))) return;   /* not the sky, not the ground, nothing see-through */
    if (p.t === 'blob') { x.beginPath(); p.clumps.forEach(c => { x.moveTo(c[0] + Math.max(.1, c[2]), c[1]); x.ellipse(c[0], c[1], Math.max(.1, c[2]), Math.max(.1, c[3]), c[4] || 0, 0, PI * 2); }); x.fill(); }
    else if (p.t === 'rect' || p.t === 'circle' || p.t === 'ellipse' || p.t === 'poly') { K.shapePath(x, p); x.fill(); } });
  const d = x.getImageData(0, 0, 100, hh).data; let best = null;
  for (let ux = 70; ux <= 330; ux += 10) { const px = Math.round(ux * q); let top = -1, run = 0, bt = -1, br = 0;   /* the longest solid stretch in this column is the building; a cloud or a wire above it is not */
    for (let py = 0; py <= hh; py++) { const on = py < hh && d[(py * 100 + px) * 4 + 3] > 128; if (on) { if (!run) top = py; run++; } else { if (run > br) { br = run; bt = top; } run = 0; } }
    if (br > 12 * q && (!best || bt < best[1] - .5)) best = [ux, bt]; }
  return best ? [(best[0] - 200) * U, (yg - best[1] / q) * U] : null; }
// A place is painted in two goes, so that neither takes much more than a frame: first the scene itself, then him and whoever was with him, standing in the street.
function paintScene(place, light) {
  const S = window.LastSeen && LastSeen.byId(place); if (!S) return null; const t = S.signature && S.signature.still ? S.signature.still.t : 14;
  const a = mount(S, light, 440, { style: 'popup' }); a.api.renderAt(t, 'still'); const R = a.host._painted; try { a.api.pause(); } catch (e) {} a.host.remove(); return R && R.layers.back ? { S, t, R, light } : null; }
function paintPeople(h) { const S = h.S, R = h.R;
  const b = mount(S, h.light, 440, { pass: 'crew' }); b.api.renderAt(h.t, 'still'); const front = mk(b.canvas.width, b.canvas.height), fx = front.getContext('2d');
  if (R.layers.front) fx.drawImage(R.layers.front, 0, 0, front.width, front.height); fx.drawImage(b.canvas, 0, 0); try { b.api.pause(); } catch (e) {} b.host.remove();
  const yg = groundTop(S), yf = Math.min(298, ((S.signature && S.signature.emerge && S.signature.emerge.foot1) || 268) + 5), back = crop(R.layers.back, 0, yg); let roof = null; try { roof = roofOf(S, yg); } catch (e) {}
  return { yg, roof, parts: [[back, yg], R.layers.facade ? [crop(R.layers.facade, 0, yg + 1), yg + 1] : null, [crop(front, 0, yf), yf]], ground: crop(R.layers.back, yg, 300) }; }
const texOf = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
function setMini(p, M) {                           // stand a painted scene on a place's tab
  p.sheets.forEach(s => { if (s.mesh) { s.hinge.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.map.dispose(); s.mesh.material.dispose(); s.mesh = null; } });
  M.parts.forEach((q, i) => { if (!q) return; const h = q[1] * U, geo = new THREE.PlaneGeometry(MW, h); geo.translate(0, h / 2, 0); const map = texOf(q[0]);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map, alphaTest: .4, side: THREE.DoubleSide })); m.castShadow = true; m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: .4 });
    p.sheets[i].mesh = m; p.sheets[i].hinge.add(m); });
  if (p.tab.material.map) p.tab.material.map.dispose(); p.tab.material.map = texOf(M.ground); p.tab.material.needsUpdate = true; p.tab.visible = true; p.ready = true; }
piles.forEach(p => {
  const g = new THREE.Group(), body = new THREE.Group(); g.position.set(p.x, hAt(p.x, p.z), p.z); g.add(body);
  p.shade = new THREE.Sprite(new THREE.SpriteMaterial({ map: shadeTex, transparent: true, depthWrite: false, opacity: .55 })); p.shade.scale.set(2.5, .9, 1); p.shade.position.set(0, .02, .1); body.add(p.shade);
  const bg = new THREE.PlaneGeometry(MW + .1, TD + .1); bg.rotateX(-PI / 2); const base = new THREE.Mesh(bg, baseMat); base.position.set(0, .008, TZ + TD / 2); body.add(base);
  const tg = new THREE.PlaneGeometry(MW, TD); tg.rotateX(-PI / 2); p.tab = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: 0xffffff })); p.tab.position.set(0, .016, TZ + TD / 2); p.tab.visible = false; body.add(p.tab);
  p.sheets = SHEETZ.map(z => { const hinge = new THREE.Group(); hinge.position.set(0, .02, z); body.add(hinge); return { hinge, mesh: null, up: 0 }; });
  const hg = new THREE.BoxGeometry(MW, 1.05, TD); hg.translate(0, .52, TZ + TD / 2); p.hit = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({ visible: false })); p.hit.userData.pile = p; body.add(p.hit); hits.push(p.hit);
  p.badge = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true })); p.badge.scale.set(.4, .4, 1); p.badge.position.set(MW / 2 - .02, 1.02, .2); p.badge.renderOrder = 5; body.add(p.badge);
  const rg = new THREE.RingGeometry(1.02, 1.1, 48); rg.rotateX(-PI / 2); p.ring = new THREE.Mesh(rg, ringMat); p.ring.position.set(0, .01, TZ + TD / 2); p.ring.scale.z = .5; p.ring.visible = false; body.add(p.ring);
  const gg = new THREE.CircleGeometry(1.8, 32); gg.rotateX(-PI / 2); p.glow = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .6 }));   // a pool of lamplight at night, lying on the slope of its fold
  p.glow.position.set(0, .03, .2); p.glow.rotation.z = Math.atan((hAt(p.x + .1, p.z) - hAt(p.x - .1, p.z)) / .2); p.glow.rotation.x = -Math.atan((hAt(p.x, p.z + .1) - hAt(p.x, p.z - .1)) / .2); p.glow.visible = false; body.add(p.glow);
  p.g = g; p.body = body; p.lift = 0; p.press = 0; p.vis = 0; p.born = 0; p.hop = 0; p.hopV = 0; p.shown = null; p.want = null; p.ready = false; p.count = 0; p.bk = 0; p.members = [p]; scene.add(g);
});
// One of each kind of thing a miniature is made of, never drawn: with these in the scene from the start, the graphics card builds their shaders while the first places are still being painted, not after.
{ const map = texOf(mk(2, 2)), g = new THREE.Group(); g.visible = false;
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map, alphaTest: .4, side: THREE.DoubleSide })), new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map })), new THREE.Sprite(new THREE.SpriteMaterial({ map, depthTest: false, transparent: true }))); scene.add(g); }
// The same for shadows: the kinds of shadow-caster here (a two-sided sheet, plain and printed, a solid, many solids drawn at once, a cut-out picture). The renderer makes these shaders itself the first time
// a shadow is drawn, and waits for each; built ahead like this (see warmGPU), that first frame costs nothing.
const primer = new THREE.Scene(), primerRT = new THREE.WebGLRenderTarget(1, 1);
{ const map = texOf(mk(2, 2)), pg = new THREE.PlaneGeometry(1, 1), dm = (side, more) => new THREE.MeshDepthMaterial(Object.assign({ depthPacking: THREE.RGBADepthPacking, side }, more)), im = new THREE.InstancedMesh(pg, dm(THREE.BackSide), 1);
  im.setColorAt(0, new THREE.Color(1, 1, 1)); primer.add(new THREE.Mesh(pg, dm(THREE.DoubleSide)), new THREE.Mesh(pg, dm(THREE.BackSide)), im, new THREE.Mesh(pg, dm(THREE.DoubleSide, { map })), new THREE.Mesh(pg, dm(THREE.DoubleSide, { map, alphaTest: .4 }))); }
function dress() {                                 // which visit each miniature shows, in which light
  const light = tod(); piles.forEach(p => { const top = visits[cur].pile === p ? visits[cur] : p.v[p.v.length - 1], key = top.place + '|' + light; p.top = top;
    if (p.want === key) return; p.want = key; if (minis[key]) { p.shown = key; setMini(p, minis[key]); } else if (queue.indexOf(key) < 0) queue.push(key); }); }
let lastPaint = 0, busy = 0, half = null;
// Painting a place takes a frame or more of the page's time, so when it happens matters: before the sheet starts to open (it lies still), never while it opens,
// slowly while the places stand up or the map is being moved, and briskly when nothing else is going on.
function pump(now) { if ((!queue.length && !half) || !window.LastSeen || !LastSeen.painters || !LastSeen.painters.popup) return;
  const still = !!intro && !intro.go, act = !!(fly || drag || coast || now < busy), gap = !shown ? 250 : !intro ?   /* out of sight: every place, one at a time, with room between for the page in front */ (act ? 320 : 90) : still ? (intro.first.every(p => p.ready) ? 1e9 : 0) : intro.t < INTRO.place ? 1e9 : 110;   /* before it opens: only the places that will be seen first, then hands off */
  if (now - lastPaint < gap) return; let at = 0;
  if (!half && !intro && act) { at = queue.findIndex(q => piles.some(p => p.head === p && p.want === q && p.sc && p.sc[0] > -60 && p.sc[0] < W + 60 && p.sc[1] > -60 && p.sc[1] < H + 60)); if (at < 0) return; }   /* while the map is being moved or the pointer is on it: only a place that is in view and still blank */
  lastPaint = now; const t0 = performance.now(); let M = null, key = '';
  try { if (!half) { key = queue.splice(at, 1)[0]; const q = key.split('|'); half = paintScene(q[0], q[1]); if (half) half.key = key; if (!still || !half) { marks.paint.push(Math.round(performance.now() - t0)); return; } }   /* while the sheet lies still, both goes at once */
    key = half.key; const h = half; half = null; M = paintPeople(h); } catch (e) { half = null; }
  marks.paint.push(Math.round(performance.now() - t0)); if (!M) return; minis[key] = M;
  piles.forEach(p => { if (p.want === key && p.shown !== key) { p.shown = key; setMini(p, M); } }); }

// ---------- small living things: a paper plane in and out of Haneda, paper boats on the bay, and a crow that goes from roof to roof ----------
const bez = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
const folded = (verts, color, lit) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, lit ? new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }) : new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })); m.castShadow = true; return m; };
const lampOf = s => { const l = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); l.scale.set(s, s, 1); l.visible = false; return l; };
const worldPx = (v, px) => px * cam.position.distanceTo(v) * Math.tan(cam.fov * PI / 360) / (H / 2);   // how big, in km, something there must be to measure px on screen
let lifeK = 0;

// The plane: a paper dart. It comes in over the bay and lands at Haneda; a while later one leaves, climbing out over the city.
const HND = [wx(139.781), wz(35.549)];
const FLIGHTS = [{ a: [X1 + 6, wz(35.71)], c: [wx(140.0), wz(35.5)], b: HND, h0: 4.4, h1: 0, s: 15 }, { a: HND, c: [wx(139.73), wz(35.6)], b: [X0 - 6, wz(35.75)], h0: 0, h1: 5, s: 17 }];
const plane = { g: new THREE.Group(), leg: 1, t: 0, wait: 3, yaw: 0, bank: 0, lamp: lampOf(.8) };
plane.g.rotation.order = 'YZX'; plane.lamp.position.set(-.1, .12, 0); plane.g.visible = false; plane.g.scale.setScalar(1e-4); scene.add(plane.g);
plane.g.add(folded([.5, 0, 0, -.5, .05, 0, -.5, .12, -.42], 0xffffff, true), folded([.5, 0, 0, -.5, .12, .42, -.5, .05, 0], 0xe9e3d6, true), folded([.5, 0, 0, -.5, .05, 0, -.5, -.17, 0], 0xd3ccbd, true), plane.lamp);   /* two wings and the keel, each its own shade so the fold reads */

// The boats: folded paper, each going round its own loop of the bay with a wake behind it.
const wakeTex = (() => { const c = mk(128, 80), x = c.getContext('2d'); x.lineCap = 'round';
  for (let i = 0; i < 3; i++) { const g = x.createLinearGradient(128, 0, 0, 0); g.addColorStop(0, 'rgba(255, 255, 255, .95)'); g.addColorStop(1, 'rgba(255, 255, 255, 0)'); x.strokeStyle = g; x.lineWidth = 4.4 - i * 1.1;
    [-1, 1].forEach(s => { x.beginPath(); x.moveTo(126, 40); x.quadraticCurveTo(70, 40 + s * (7 + i * 6), 4, 40 + s * (15 + i * 10)); x.stroke(); }); }
  return new THREE.CanvasTexture(c); })();
const ROUTES = [{ pts: [[139.84, 35.59], [139.92, 35.555], [140.03, 35.575], [139.97, 35.612], [139.89, 35.607]], lap: 120, dir: 1, at: .08, sail: 0xc4402e },
  { pts: [[139.86, 35.555], [139.95, 35.535], [140.0, 35.56], [139.93, 35.58]], lap: 84, dir: -1, at: .55, sail: 0x3f7396 }];
const boats = ROUTES.map((r, i) => { const g = new THREE.Group(), bob = new THREE.Group(), wg = new THREE.PlaneGeometry(1.5, .94); wg.rotateX(-PI / 2);
  const wake = new THREE.Mesh(wg, new THREE.MeshBasicMaterial({ map: wakeTex, transparent: true, depthWrite: false, opacity: .8 })); wake.position.set(-1.12, .012, 0);
  const lamp = lampOf(.7); lamp.position.set(0, .3, 0);
  bob.add(folded([.5, .14, 0, .2, 0, 0, 0, .12, -.2, .2, 0, 0, -.2, 0, 0, 0, .12, -.2, -.2, 0, 0, -.5, .14, 0, 0, .12, -.2, .5, .14, 0, 0, .12, .2, .2, 0, 0, .2, 0, 0, 0, .12, .2, -.2, 0, 0, -.2, 0, 0, 0, .12, .2, -.5, .14, 0], 0xffffff, true),
    folded([-.16, .1, 0, .16, .1, 0, 0, .42, 0], r.sail, true), lamp); g.add(wake, bob); g.visible = false; scene.add(g);
  return { g, bob, wake, lamp, u: r.at, lap: r.lap, dir: r.dir, ph: i * 2.1, curve: new THREE.CatmullRomCurve3(r.pts.map(q => new THREE.Vector3(wx(q[0]), 0, wz(q[1]))), true, 'catmullrom', .5) }; });

// The crow: it sits on the highest thing at a place, looks about, and now and then flaps over to another. Come too near with the pointer and it is off.
const crow = { g: new THREE.Group(), on: null, to: null, from: new THREE.Vector3(), t: 0, ms: 1, arc: 1, rest: 6, look: 2, hop: 0, peck: 0, face: 1, yaw: 0, pitch: 0, k: 0, s: 1, ph: 0, sc: [-99, -99] }, cT = new THREE.Vector3(), cP = new THREE.Vector3(), cN = new THREE.Vector3();
crow.g.rotation.order = 'YZX'; crow.g.visible = false; scene.add(crow.g); crow.air = new THREE.Group(); crow.g.add(crow.air);
const sitTex = (() => { const c = mk(128, 128), x = c.getContext('2d'), ink = '#2b2622'; x.fillStyle = ink; x.strokeStyle = ink; x.lineWidth = 5; x.lineCap = 'round';
  x.beginPath(); x.moveTo(52, 96); x.lineTo(50, 124); x.moveTo(68, 96); x.lineTo(70, 124); x.stroke();                                        /* legs */
  x.beginPath(); x.moveTo(34, 70); x.lineTo(2, 104); x.lineTo(40, 94); x.closePath(); x.fill();                                               /* tail */
  x.save(); x.translate(58, 76); x.rotate(-.38); x.beginPath(); x.ellipse(0, 0, 36, 25, 0, 0, PI * 2); x.fill(); x.restore();                  /* body */
  x.beginPath(); x.arc(88, 46, 18, 0, PI * 2); x.fill(); x.beginPath(); x.moveTo(102, 36); x.lineTo(127, 48); x.lineTo(102, 56); x.closePath(); x.fill();   /* head and beak */
  x.fillStyle = '#f6f1e5'; x.beginPath(); x.arc(93, 42, 3.4, 0, PI * 2); x.fill(); return texOf(c); })();
{ const sg = new THREE.PlaneGeometry(.62, .62); sg.translate(0, .31, 0); crow.sit = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: sitTex, alphaTest: .4, side: THREE.DoubleSide })); crow.sit.visible = false; crow.g.add(crow.sit); }
crow.wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(0, .03, s * .05); w.add(folded([.12, 0, 0, -.14, 0, 0, -.05, 0, s * .46], 0x2b2622)); crow.air.add(w); return w; });
crow.air.add(folded([.3, 0, 0, 0, .08, 0, 0, 0, -.08, 0, .08, 0, -.34, 0, 0, 0, 0, -.08, .3, 0, 0, 0, 0, .08, 0, .08, 0, 0, .08, 0, 0, 0, .08, -.34, 0, 0], 0x2b2622));
const canPerch = p => !!p && p.head === p && p.ready && p.vis > .9 && !(bookOpen && visits[cur].pile === p) && !!minis[p.shown] && !!minis[p.shown].roof;
function perch(p, out) { const r = minis[p.shown] && minis[p.shown].roof; if (!r) return null; const s = p.body.scale.x;   // the sheet leans back a little: so does the spot on top of it
  return out.set(p.g.position.x + r[0] * s, p.g.position.y + (.02 + r[1] * Math.cos(.1)) * s, p.g.position.z + (SHEETZ[0] - r[1] * Math.sin(.1)) * s); }
function crowPick() { const all = piles.filter(p => p !== crow.on && p !== crow.to && canPerch(p)), seen = all.filter(p => p.sc[0] > 30 && p.sc[0] < W - 30 && p.sc[1] > 50 && p.sc[1] < H - 20), l = seen.length ? seen : all; return l[Math.floor(Math.random() * l.length)] || null; }
function crowGo(to) { crow.from.copy(crow.g.position); const d = perch(to, cT) ? cT.distanceTo(crow.from) : 6; crow.on = null; crow.to = to; crow.t = 0; crow.ms = clamp(650 + d * 130, 900, 2800); crow.arc = clamp(d * .14, .35, 2.4); }
const crowFlee = () => { if (!crow.on || night || reduce.matches) return; const n = crowPick(); if (n) crowGo(n); };

function live(k, T) {
  const still = reduce.matches; lifeK += ((intro ? 0 : 1) - lifeK) * Math.min(1, k * 2.5); const show = smooth(lifeK);
  // the plane
  if (still || plane.wait > 0) { plane.g.visible = !!intro && !intro.go; if (!intro) plane.wait -= k; if (plane.wait <= 0 && !still) { plane.leg = 1 - plane.leg; plane.t = 0; } }
  else { const F = FLIGHTS[plane.leg]; plane.t = Math.min(1, plane.t + k / F.s); const t = plane.t, u = F.h1 ? Math.pow(t, 1.5) : 1 - Math.pow(1 - t, 1.5);
    const at = q => [bez(F.a[0], F.c[0], F.b[0], q), F.h0 * (1 - q) * (1 - q) + F.h1 * q * q, bez(F.a[1], F.c[1], F.b[1], q)], A = at(u), N = at(u + .004), yaw = Math.atan2(-(N[2] - A[2]), N[0] - A[0]);
    let turn = yaw - plane.yaw; turn = Math.atan2(Math.sin(turn), Math.cos(turn)); plane.yaw = yaw; plane.bank += (clamp(-turn / Math.max(k, .001) * 1.6, -.5, .5) - plane.bank) * Math.min(1, k * 4);
    plane.g.position.set(A[0], hAt(A[0], A[2]) + .05 + A[1], A[2]); plane.g.rotation.set(plane.bank, yaw, Math.atan2(N[1] - A[1], Math.hypot(N[0] - A[0], N[2] - A[2])));
    plane.g.scale.setScalar(Math.max(1e-4, worldPx(plane.g.position, miniPx * .3) * show * smooth(t / .05) * smooth((1 - t) / .05))); plane.g.visible = true;
    plane.lamp.visible = night; plane.lamp.material.opacity = (T * 1.1) % 1 < .16 ? 1 : .12;
    if (t >= 1) plane.wait = 7 + Math.random() * 9; }
  // the boats
  boats.forEach(b => { if (!still) b.u = (b.u + k / b.lap * b.dir + 1) % 1; b.curve.getPointAt(b.u, cP); b.curve.getTangentAt(b.u, cN);
    b.g.position.set(cP.x, hAt(cP.x, cP.z) + .02, cP.z); b.g.rotation.y = Math.atan2(-cN.z * b.dir, cN.x * b.dir); b.g.scale.setScalar(Math.max(1e-4, worldPx(b.g.position, miniPx * .34) * show)); b.g.visible = show > .02 || (!!intro && !intro.go);
    b.bob.position.y = still ? 0 : Math.sin(T * 2.1 + b.ph) * .03; b.bob.rotation.x = still ? 0 : Math.sin(T * 1.7 + b.ph) * .1; b.wake.visible = !still; b.wake.material.opacity = .62 + .18 * Math.sin(T * 3 + b.ph); b.lamp.visible = night; });
  // the crow
  if (crow.on && !canPerch(crow.on)) { const n = crowPick(); crow.on = null; if (n && !still) crowGo(n); }
  if (crow.to && !canPerch(crow.to)) { const n = crowPick(); if (n) { crow.from.copy(crow.g.position); crow.to = n; crow.t = 0; } else crow.to = null; }
  if (!crow.on && !crow.to && !intro) { const n = canPerch(visits[cur].pile) ? visits[cur].pile : crowPick();
    if (n && still) crow.on = n; else if (n) { if (crow.k < .05) { perch(n, cT); crow.g.position.set(cT.x - 8, cT.y + 5, cT.z - 6); } crowGo(n); crow.ms = Math.max(crow.ms, 1800); } }
  let flap = .5;
  if (crow.to) { perch(crow.to, cT); crow.t = Math.min(1, crow.t + k * 1000 / crow.ms); const e = smooth(crow.t), o = cP.copy(crow.g.position);
    crow.g.position.set(lerp(crow.from.x, cT.x, e), lerp(crow.from.y, cT.y, e) + Math.sin(PI * e) * crow.arc, lerp(crow.from.z, cT.z, e));
    const dx = crow.g.position.x - o.x, dy = crow.g.position.y - o.y, dz = crow.g.position.z - o.z, run = Math.hypot(dx, dz); if (run > 1e-5) { crow.yaw = Math.atan2(-dz, dx); crow.pitch = clamp(Math.atan2(dy, run), -.6, .6); }
    crow.ph += k * 34; flap = crow.t > .88 ? .95 : .2 + Math.sin(crow.ph) * .75;   /* wings held up to brake as it comes in */
    if (crow.t >= 1) { crow.on = crow.to; crow.to = null; crow.rest = 8 + Math.random() * 10; crow.look = 1 + Math.random() * 2; crow.hop = 1; crow.on.hopV = Math.max(crow.on.hopV, 1.4); crow.face = Math.cos(crow.yaw) >= 0 ? 1 : -1; } }
  else if (crow.on) { perch(crow.on, cT); crow.hop = Math.max(0, crow.hop - k * 4); crow.peck = Math.max(0, crow.peck - k * 1.7); crow.g.position.set(cT.x, cT.y + Math.sin(PI * crow.hop) * .12 * crow.s, cT.z + .02 * crow.s); crow.yaw = crow.pitch = 0;
    if (!night && !still) { crow.look -= k; if (crow.look <= 0) { if (Math.random() < .5) { crow.face = -crow.face; crow.hop = 1; } else crow.peck = 1; crow.look = 1.8 + Math.random() * 3.5; }   /* a hop and a look the other way, or two pecks at the roof; asleep at night */
      crow.rest -= k; if (crow.rest <= 0) { const n = crowPick(); if (n) crowGo(n); else crow.rest = 4; } } }
  crow.k += (((crow.on || crow.to) && !intro ? 1 : 0) - crow.k) * Math.min(1, k * 5); const sat = !!crow.on;
  crow.s = worldPx(crow.g.position, miniPx * .32); crow.g.scale.setScalar(Math.max(1e-4, crow.s * smooth(crow.k))); crow.g.visible = crow.k > .02 || (!!intro && !intro.go); if (intro && !intro.go) crow.air.visible = crow.sit.visible = true; else { crow.g.rotation.set(0, crow.yaw, crow.pitch);
  crow.air.visible = !sat; crow.sit.visible = sat; } crow.wings[0].rotation.x = flap; crow.wings[1].rotation.x = -flap;
  if (sat) { const dip = Math.pow(Math.sin(crow.peck * PI * 2), 2); crow.sit.scale.set(crow.face, night ? .86 : 1, 1); crow.sit.rotation.z = -crow.face * dip * .55; }
  cN.copy(crow.g.position).project(cam); crow.sc[0] = (cN.x + 1) / 2 * W; crow.sc[1] = (1 - cN.y) / 2 * H;
}

// ---------- light ----------
const LIGHTS = { morning: { amb: [0xf2f5ff, .74], sun: [0xfff2dc, .44], at: [46, 34, 20], sh: .2, cloud: .86, lit: 0 }, midday: { amb: [0xffffff, .7], sun: [0xffffff, .46], at: [12, 56, 22], sh: .18, cloud: .86, lit: 0 },
  golden: { amb: [0xfff1e2, .68], sun: [0xffc694, .44], at: [-50, 24, 18], sh: .22, cloud: .82, lit: 0 }, night: { amb: [0x53639c, .25], sun: [0x8fa6e0, .13], at: [-18, 50, 14], sh: .3, cloud: .16, lit: 1 } };
let sunAt = new THREE.Vector3(12, 56, 22), night = false, intro = null, cloudTarget = .86;
const sfx = (n, o) => { try { if (window.SiteSound) window.SiteSound.cue(n, o); } catch (e) {} };
function relight() { const L = LIGHTS[tod()] || LIGHTS.midday; night = !!L.lit; amb.color.set(L.amb[0]); amb.intensity = L.amb[1] * PI; sun.color.set(L.sun[0]); sun.intensity = L.sun[1] * PI; sunAt.set(L.at[0], L.at[1], L.at[2]);
  desk.material.opacity = L.sh; cloudTarget = L.cloud; if (!intro) cloudMat.opacity = L.cloud; clouds.forEach(c => c.children.forEach(m => { m.castShadow = !night; })); blockMat.emissiveIntensity = night ? .2 : 0;
  baseMat.color.set(night ? 0x8f8c88 : 0xfffdf8); nowMat.color.set(night ? 0xe2694f : 0xc4402e); ringMat.color.copy(nowMat.color);
  piles.forEach(p => { p.glow.visible = night; }); dress(); }

// ---------- the camera: a point on the ground, a distance, and a tilt that grows as it comes down ----------
const cs = { x: CX, z: CZ + .4, d: 60 }, DMIN = 5, whl = { k: 0, x: 0, y: 0 }; let DMAX = 60, PANX = 1, W = 1, H = 1, fly = null, bookOpen = false, coast = null;
// A CSS cubic-bezier as a function, so the camera can use the same curves the stylesheet does.
function bezier(x1, y1, x2, y2) { const f = (a, b, t) => 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t;
  return x => { if (x <= 0) return 0; if (x >= 1) return 1; let lo = 0, hi = 1, t = x; for (let i = 0; i < 18; i++) { const v = f(x1, x2, t); if (Math.abs(v - x) < 1e-4) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; } return f(y1, y2, t); }; }
const EASE_OUT = bezier(.23, 1, .32, 1), EASE_GO = bezier(.3, 0, .1, 1);   /* a step the hand just asked for answers at once; a journey to another place starts promptly and settles long */
const tilt = d => lerp(1.02, .66, smooth((d - DMIN) / (DMAX - DMIN)));
function place() { const t = tilt(cs.d); cam.position.set(cs.x, cs.d * Math.cos(t), cs.z + cs.d * Math.sin(t)); cam.lookAt(cs.x, 0, cs.z); cam.updateMatrixWorld();
  const ext = clamp(cs.d * .95, 9, 46), c = sun.shadow.camera; sun.target.position.set(cs.x, 0, cs.z); sun.position.set(cs.x + sunAt.x, sunAt.y, cs.z + sunAt.z); c.left = -ext; c.right = ext; c.top = ext; c.bottom = -ext; c.near = 1; c.far = 220; c.updateProjectionMatrix(); }
function limits() { const m = lerp(0, .5, smooth((clamp(cs.d, DMIN, DMAX) - DMIN) / (DMAX - DMIN))); return [X0 + SW * m * PANX, X1 - SW * m * PANX, Z0 + (SD + .8) * m, Z1 - (SD - .8) * m]; }   /* fully out, there is exactly one place to be: the middle */
function bound() { cs.d = clamp(cs.d, DMIN, DMAX); const l = limits(); cs.x = clamp(cs.x, l[0], l[1]); cs.z = clamp(cs.z, l[2], l[3]); }
const kmPerPx = () => cs.d * Math.tan(cam.fov * PI / 360) / (H / 2);
// Past the edge the sheet still follows the hand, less and less (the same curve a phone's scroll uses), and comes back when let go.
function rubber(v, lo, hi) { const c = clamp(v, lo, hi), over = v - c, dim = 150 * kmPerPx(); return over ? c + Math.sign(over) * dim * (1 - 1 / (Math.abs(over) * .55 / dim + 1)) : c; }
function glide(k, dt) { if (drag || fly || intro) { coast = null; return; } const l = limits(), ox = cs.x - clamp(cs.x, l[0], l[1]), oz = cs.z - clamp(cs.z, l[2], l[3]);
  if (coast) { cs.x += coast.vx * dt; cs.z += coast.vz * dt; const f = Math.exp(-dt / 325) * (ox || oz ? .7 : 1); coast.vx *= f; coast.vz *= f; if (Math.hypot(coast.vx, coast.vz) * 1000 / kmPerPx() < 8) coast = null; }   /* let go while moving, the sheet carries on and slows; at the edge it gives up quickly */
  if (ox || oz) { const q = reduce.matches ? 1 : Math.min(1, k * 13); cs.x -= ox * q; cs.z -= oz * q; if (Math.abs(ox) + Math.abs(oz) < kmPerPx() * .3) { cs.x -= ox * (1 - q); cs.z -= oz * (1 - q); } } }
function size() { W = view.clientWidth || 1; H = view.clientHeight || 1; renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix();
  const th = Math.tan(cam.fov * PI / 360), was = DMAX, wide = SW * 1.34 / (2 * th * cam.aspect), deep = SD * 1.3 * Math.cos(.66) / (2 * th); DMAX = Math.max(deep, Math.min(wide, deep * 1.7)); PANX = Math.min(1, DMAX / wide);   // a narrow screen does not shrink the sheet to fit: it shows a part and pans
  if (cs.d === was || cs.d > DMAX) { cs.d = DMAX; if (PANX < 1) cs.x = wx(139.72); } bound(); }
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), gp = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), tmp = new THREE.Vector3();
function ground(cx, cy) { const r = el.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); return ray.ray.intersectPlane(gp, tmp) ? tmp.clone() : null; }
function zoomAt(cx, cy, k) { fly = null; coast = null; busy = performance.now() + 160; const a = ground(cx, cy); cs.d = clamp(cs.d * k, DMIN, DMAX); place(); const b = ground(cx, cy); if (a && b) { cs.x += a.x - b.x; cs.z += a.z - b.z; } bound(); }
function flyTo(x, z, d, ms, done, ease) { if (reduce.matches) ms = 0; coast = null; whl.k = 0; const far = Math.hypot(x - cs.x, z - cs.z);
  fly = { x0: cs.x, z0: cs.z, d0: cs.d, x1: x, z1: z, d1: clamp(d, DMIN, DMAX), t: 0, ms: ms == null ? clamp(520 + far * 16, 600, 1500) : ms, up: Math.max(0, Math.min(DMAX, far * .9) - Math.max(cs.d, d)) * .55, done, ease: ease || inOut }; if (!fly.ms) step(1e6); }
function step(dt) { if (!fly) return; fly.t = fly.ms ? Math.min(1, fly.t + dt / fly.ms) : 1; const e = fly.ease(fly.t); cs.x = lerp(fly.x0, fly.x1, e); cs.z = lerp(fly.z0, fly.z1, e); cs.d = lerp(fly.d0, fly.d1, e) + fly.up * Math.sin(PI * fly.t); bound();   // a flight keeps to the same bounds as a drag: zooming right out brings the sheet back to the middle
  if (fly.t >= 1) { const f = fly; fly = null; if (f.done) f.done(); } }

// ---------- cards on screen: a steady size, and neighbours that would overlap gather into one ----------
const v3 = new THREE.Vector3();
function screenOf(p) { v3.set(p.x, hAt(p.x, p.z) + .5 * p.s, p.z).project(cam); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; }
let miniPx = 80;
function gather() {
  const th = Math.tan(cam.fov * PI / 360), near = smooth(1 - (cs.d - DMIN) / (DMAX - DMIN)), px = miniPx = lerp(Math.min(80, W / 11 + 18), 122, near * near);
  piles.forEach(p => { const dist = cam.position.distanceTo(p.g.position); p.s = px * dist * th / (H / 2) / MW; p.sc = screenOf(p); p.head = null; p.members = []; });
  const order = piles.slice().sort((a, b) => (visits[cur].pile === b) - (visits[cur].pile === a) || b.v[b.v.length - 1].n - a.v[a.v.length - 1].n);
  order.forEach(p => { const h = order.find(q => q.head === q && Math.hypot(q.sc[0] - p.sc[0], (q.sc[1] - p.sc[1]) * 1.3) < px * .9); p.head = h || p; p.head.members.push(p); });
  piles.forEach(p => { const n = p.head === p ? p.members.reduce((a, m) => a + m.v.length, 0) : 0; if (n !== p.count) { p.count = n; if (n > 1) { p.badge.material.map = badgeTex(n); p.badge.material.needsUpdate = true; } } });   /* the count comes and goes in the frame loop */
}

// ---------- the lines under the map ----------
const info = document.getElementById('tm-info'), prevB = document.getElementById('tm-prev'), nextB = document.getElementById('tm-next'), tip = document.getElementById('tm-tip'), hint = document.getElementById('tm-hint');
const fmt = (d, o) => new Intl.DateTimeFormat(ja() ? 'ja-JP' : 'en-GB', Object.assign({ timeZone: 'Asia/Tokyo' }, o)).format(d);
function caption() { const v = visits[cur];
  info.innerHTML = '<p class="tb-date">' + fmt(v.from, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) + '<span>' + (cur + 1) + ' / ' + visits.length + '</span></p><p class="tb-name"></p><p class="tb-area"></p>';
  info.querySelector('.tb-name').textContent = TL2.s(v.name); info.querySelector('.tb-area').textContent = TL2.s(v.area); prevB.disabled = cur <= 0; nextB.disabled = cur >= visits.length - 1;
  if (shown && (location.hash || cur !== visits.length - 1)) try { history.replaceState(null, '', '#' + v.id); } catch (e) {} const toBook = document.getElementById('tm-to-book'); if (toBook) toBook.setAttribute('href', '/timeline/#' + v.id);   /* the book opens on the same place */
  prevB.setAttribute('aria-label', ja() ? '前の場所へ' : 'Earlier place'); nextB.setAttribute('aria-label', ja() ? '次の場所へ' : 'Later place');
  hint.textContent = ja() ? 'ドラッグで移動 · スクロールで拡大 · 場所をクリックでそのページへ' : 'Drag to move · scroll to zoom · click a place to open its page';
  document.getElementById('tm-back-l').textContent = ja() ? '地図にもどる' : 'Back to the map'; }
function go(n) { n = clamp(n, 0, visits.length - 1); if (n === cur) return; skipIntro(); sfx('navigate', { direction: n > cur ? 'forward' : 'back' }); cur = n; caption(); dress(); const p = visits[cur].pile;
  if (bookOpen) { cs.x = p.x; cs.z = p.z + .5; if (book) book.setScene(visits[cur].place, tod()); return; }
  flyTo(p.x, p.z + .8, Math.min(cs.d, 17), null, null, fly ? EASE_OUT : EASE_GO); }   /* turned mid-flight (keys pressed quickly), it carries on at speed instead of starting again from rest */

// ---------- the book that opens out of a place ----------
const wrap = document.getElementById('tm-bookwrap'), stage = document.getElementById('tm-stage'); let book = null, saved = null, opening = 0;
const idle = () => { const s = book._debug.state(); return !s.job && !s.pending && !s.queued && !s.holding; };
function warmBook() { if (book) return; if (!shown || performance.now() - shownAt < 1500 || fly || drag || coast || queue.length || half || performance.now() < busy) setTimeout(warmBook, 400); else loadBook(); }   // have the book ready before the first click, but build it in a quiet moment
function loadBook() { if (book || !window.LastSeen || !LastSeen.popup) return Promise.resolve(book);
  return import('/last-seen/popup/book.js?v=7').then(m => { book = m.createBook(stage, { label: k => (ja() ? (k === 'open' ? '飛び出す絵本（開いています）' : '飛び出す絵本') : null), onBuilt: () => stage.classList.add('is-book') });
    book.setScene(visits[cur].place, tod()); const t0 = performance.now(), rest = () => { if (bookOpen || opening) return; if (idle() || performance.now() - t0 > 4000) book.setActive(false); else setTimeout(rest, 120); }; setTimeout(rest, 300); return book; }).catch(() => null); }   /* a second picture being drawn under the map costs frames: stop it the moment the book is built */
function landAt(p, x, z, d) { const o = [cs.x, cs.z, cs.d]; cs.x = x; cs.z = z; cs.d = d; place(); const s = screenOf(p); cs.x = o[0]; cs.z = o[1]; cs.d = o[2]; place(); return s; }   // where a place will be on screen once the camera has landed there
function openPlace(v) { if (bookOpen || opening) return; const me = ++opening, p = v.pile; if (v.n !== cur) { cur = v.n; caption(); dress(); }
  saved = { x: cs.x, z: cs.z, d: Math.max(cs.d, 20) }; let landed = false; hover = null; view.classList.remove('is-over'); tip.classList.remove('is-on');   /* the label does not follow the place into its book */ sfx('navigate', { direction: 'forward' });
  flyTo(p.x, p.z + .5, DMIN, clamp(440 + Math.hypot(p.x - cs.x, p.z + .5 - cs.z) * 9, 520, 760), () => { landed = true; }, EASE_GO); const f = fly, near = () => landed || (!!f && fly === f && f.ease(f.t) > .97);   /* starts at once, settles long; the book starts up out of the place while the camera is still settling */
  loadBook().then(b => { if (!b) { opening = 0; return; } b.setActive(true); b.shut(); b.setScene(v.place, tod());
    const t0 = performance.now(), wait = () => { if (me !== opening) return; if (!(near() && idle()) && performance.now() - t0 < 9000) return requestAnimationFrame(wait);
      const s = landAt(p, p.x, p.z + .5, DMIN); wrap.style.setProperty('--ox', s[0] + 'px'); wrap.style.setProperty('--oy', s[1] + 'px'); void wrap.offsetWidth;
      bookOpen = true; opening = 0; view.classList.add('is-book'); wrap.classList.add('is-on'); setTimeout(() => { if (bookOpen) { b.open(); sfx('open'); } }, reduce.matches ? 0 : 140); };
    wait(); }); }
function closeBook() { if (!bookOpen) return; bookOpen = false; sfx('close'); if (book) book.close(); const p = visits[cur].pile;
  setTimeout(() => { const s = screenOf(p); wrap.style.setProperty('--ox', s[0] + 'px'); wrap.style.setProperty('--oy', s[1] + 'px'); wrap.classList.remove('is-on'); view.classList.remove('is-book'); p.hopV = 6;
    flyTo(p.x, p.z + .8, saved ? saved.d : 20, 900, () => sfx('land', { volume: .6 })); setTimeout(() => { if (book && !bookOpen && !opening) { book.shut(); book.setActive(false); } }, 700); }, reduce.matches ? 0 : 420); }

// ---------- hands ----------
let hover = null, drag = null, pressed = null; const ptrs = new Map();
function pick(cx, cy) { const r = el.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
  const h = ray.intersectObjects(hits.filter(m => m.userData.pile.head === m.userData.pile), false)[0]; return h ? h.object.userData.pile : null; }
let tipFor = '', tipW = 0;
function showTip(p) { if (!p) { tip.classList.remove('is-on'); return; } const many = p.members.length > 1, v = p.top, key = p.key + '|' + p.members.length + '|' + v.n + '|' + (ja() ? 'ja' : 'en');
  if (key !== tipFor) { tipFor = key;                /* written when what it says changes, not every frame: writing and measuring it each frame makes the page lay itself out sixty times a second */
    tip.innerHTML = many ? '<b>' + (ja() ? p.members.length + 'か所' : p.members.length + ' places close together') + '</b><span>' + (ja() ? 'クリックで拡大' : 'Click to zoom in') + '</span>'
      : '<b></b><span>' + TL2.s(v.area) + ' · ' + fmt(v.from, { day: 'numeric', month: 'short' }) + (p.v.length > 1 ? ' · ' + (ja() ? p.v.length + '回' : p.v.length + ' visits') : '') + '</span>';
    if (!many) tip.querySelector('b').textContent = TL2.s(v.name); tipW = tip.offsetWidth; }
  tip.classList.add('is-on');
  tip.style.transform = 'translate(' + clamp(p.sc[0] - tipW / 2, 8, W - tipW - 8) + 'px,' + Math.max(8, p.sc[1] - (p.s * 1.0 * (H / 2) / (cam.position.distanceTo(p.g.position) * Math.tan(cam.fov * PI / 360))) - 58) + 'px)'; }
function tap(p) { if (!p) return; p.hopV = 4;
  if (p.members.length > 1) {                      // a group: come in until its closest two stand apart; at the very bottom, just open the one in front
    if (cs.d <= DMIN + .05) { openPlace(p.top); return; } sfx('toggle', { direction: 'forward' });
    let x = 0, z = 0, near = 1e9; p.members.forEach((m, i) => { x += m.x; z += m.z; p.members.forEach((o, j) => { if (j > i) near = Math.min(near, Math.hypot(m.x - o.x, m.z - o.z)); }); }); x /= p.members.length; z /= p.members.length;
    flyTo(x, z + .4, clamp(near * (H / 2) / (Math.tan(cam.fov * PI / 360) * 150) * .9, DMIN, cs.d * .62), null, null, EASE_GO); return; }
  const here = p.v.indexOf(visits[cur]); openPlace(here >= 0 ? visits[cur] : p.v[p.v.length - 1]); }
el.addEventListener('pointerdown', e => { skipIntro(); if (bookOpen) return; el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); fly = null; coast = null; feel(e);
  if (ptrs.size === 1) { drag = { moved: 0, pile: pick(e.clientX, e.clientY), rx: cs.x, rz: cs.z, vx: 0, vz: 0, t: e.timeStamp }; pressed = drag.pile; } else { drag = null; pressed = null; view.classList.remove('is-drag'); } });
el.addEventListener('pointermove', e => { if (bookOpen) return; busy = Math.max(busy, e.timeStamp + 350); const was = ptrs.get(e.pointerId); feel(e);
  if (was && ptrs.size === 2) { const o = [...ptrs.entries()].find(q => q[0] !== e.pointerId)[1], d0 = Math.hypot(was[0] - o[0], was[1] - o[1]), d1 = Math.hypot(e.clientX - o[0], e.clientY - o[1]); if (d0 > 0 && d1 > 0) zoomAt((e.clientX + o[0]) / 2, (e.clientY + o[1]) / 2, d0 / d1); ptrs.set(e.pointerId, [e.clientX, e.clientY]); return; }
  if (was && drag) { const a = ground(was[0], was[1]), b = ground(e.clientX, e.clientY); drag.moved += Math.hypot(e.clientX - was[0], e.clientY - was[1]); if (drag.moved > 5) { view.classList.add('is-drag'); pressed = null; if (a && b) { const dx = a.x - b.x, dz = a.z - b.z, ms = Math.max(1, e.timeStamp - drag.t), l = limits(); drag.t = e.timeStamp;
        drag.rx += dx; drag.rz += dz; drag.vx = lerp(drag.vx, dx / ms, .55); drag.vz = lerp(drag.vz, dz / ms, .55); cs.x = rubber(drag.rx, l[0], l[1]); cs.z = rubber(drag.rz, l[2], l[3]); } showTip(null); }
    ptrs.set(e.pointerId, [e.clientX, e.clientY]); return; }
  if (e.pointerType === 'mouse') { const p = pick(e.clientX, e.clientY), vr = el.getBoundingClientRect(); if (Math.hypot(e.clientX - vr.left - crow.sc[0], e.clientY - vr.top - crow.sc[1]) < 24) crowFlee(); if (p !== hover) { hover = p; view.classList.toggle('is-over', !!p); if (p) { p.hopV = Math.max(p.hopV, 2.6); if (e.timeStamp - lastHover > 90) { lastHover = e.timeStamp; sfx('select', { volume: .4 }); } } } showTip(p); } });
const up = e => { const d = drag; ptrs.delete(e.pointerId); view.classList.remove('is-drag'); pressed = null; if (!ptrs.size) drag = null; feel(e);
  if (d && d.moved > 5 && e.type === 'pointerup' && !ptrs.size && !reduce.matches && e.timeStamp - d.t < 90) { const px = Math.hypot(d.vx, d.vz) * 1000 / kmPerPx(), cap = Math.min(1, 5000 / Math.max(px, 1)); if (px > 140) coast = { vx: d.vx * cap, vz: d.vz * cap }; }   /* let go while still moving: carry on */ if (d && d.moved <= 5 && e.type === 'pointerup') { const hit = d.pile && d.pile === pick(e.clientX, e.clientY) ? d.pile : null, g = hit || reduce.matches || intro ? null : ground(e.clientX, e.clientY); if (hit) tap(hit); else if (g) brush(g.x, g.z, 0, 0, 1, Math.max(.7, 74 * kmPerPx()), true); } };   /* a tap on bare paper: a ring of rocking spreads from it */
el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', () => { hover = null; view.classList.remove('is-over'); showTip(null); hand.on = false; if (!ptrs.size) CORN.forEach(c => { c.to = 0; }); });
el.addEventListener('wheel', e => { skipIntro(); if (bookOpen) return; e.preventDefault(); const s = clamp(e.deltaY, -120, 120) * (e.ctrlKey ? .012 : .0022);
  if (!e.ctrlKey && !reduce.matches && Math.abs(s) > .08) { whl.k = clamp(whl.k + s, -1.2, 1.2); whl.x = e.clientX; whl.y = e.clientY; }   /* a big step at once (a wheel's notch): eased in the frame loop, towards where the pointer is */
  else { zoomAt(e.clientX, e.clientY, Math.exp(s + whl.k)); whl.k = 0; } }, { passive: false });                                           /* small steps (two fingers, a pinch): one to one, as before */
el.addEventListener('dblclick', e => { if (bookOpen || pick(e.clientX, e.clientY)) return; const g = ground(e.clientX, e.clientY); if (g) flyTo(g.x, g.z, cs.d * .5, 460, null, EASE_OUT); });
document.getElementById('tm-in').addEventListener('click', () => { skipIntro(); sfx('select', { direction: 'forward', volume: .5 }); flyTo(cs.x, cs.z, cs.d * .55, 380, null, EASE_OUT); }); document.getElementById('tm-out').addEventListener('click', () => { skipIntro(); sfx('select', { direction: 'back', volume: .5 }); flyTo(cs.x, cs.z, cs.d / .55, 380, null, EASE_OUT); });
prevB.addEventListener('click', () => go(cur - 1)); nextB.addEventListener('click', () => go(cur + 1)); document.getElementById('tm-back').addEventListener('click', closeBook);
wrap.addEventListener('click', e => { if (e.target === wrap) closeBook(); });
document.addEventListener('keydown', e => { if (!shown || e.metaKey || e.ctrlKey || e.altKey) return; skipIntro();
  if (e.key === 'Escape' && bookOpen) { closeBook(); e.preventDefault(); } else if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); } else if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); }
  else if (!bookOpen && (e.key === '+' || e.key === '=')) flyTo(cs.x, cs.z, cs.d * .55, 380, null, EASE_OUT); else if (!bookOpen && e.key === '-') flyTo(cs.x, cs.z, cs.d / .55, 380, null, EASE_OUT);
  else if (!bookOpen && e.key === 'Enter' && document.activeElement === el) openPlace(visits[cur]); });

// ---------- things answer the hand ----------
// Brush the pointer over the paper blocks and they rock, the way the pieces in the book do; trees lean and sway back; a tap on bare paper sends a ring of it outwards;
// and a corner of the sheet lifts a little when the hand is near it, more when it is held.
const wob = new Map(), wQ = new THREE.Quaternion(), wA = new THREE.Vector3(), wO = new THREE.Vector3(), hand = { x: 0, z: 0, t: 0, on: false };
grown.forEach((G, gi) => { G.gi = gi; G.items.forEach((it, i) => CORN.forEach(c => { if (Math.hypot(it.x - c.x, it.z - c.z) < RC) c.list.push([G, i]); })); });
function setInst(G, i, ax, az, ang) { const it = G.items[i]; wQ.setFromAxisAngle(wA.set(ax, 0, az), ang); wO.set(0, it.cy, 0).applyQuaternion(wQ);   /* tipped about its foot, not its middle */
  gM.compose(gV.set(it.x + wO.x, it.y + liftAt(it.x, it.z) + wO.y, it.z + wO.z), wQ.multiply(it.q), gS.set(it.sx, it.sy, it.sz)); G.im.setMatrixAt(i, gM); G.touched = true; }
function poke(G, i, dx, dz, s, wait) { const it = G.items[i], key = G.gi * 1e5 + i, old = wob.get(key), tree = !!G.whole, amp = s * (tree ? .3 : .34 / (1 + it.sy * 4));   /* a tall block rocks less than a small one */
  if (old && (old.t < 0 || old.amp * Math.exp(-old.t / old.tau) > amp * .6)) return;                                                                     /* already rocking harder than this would make it */
  const n = Math.hypot(dx, dz) || 1; wob.set(key, { G, i, ax: dz / n, az: -dx / n, amp, t: -(wait || 0), f: tree ? 1.7 : 3.3 + (i % 5) * .25, tau: tree ? .7 : .4 }); }
function brush(x, z, dx, dz, s, r, ring) {          // everything within r of a spot is pushed: along the hand's way, or outwards in a ring that spreads
  grown.forEach(G => G.items.forEach((it, i) => { const ex = it.x - x, ez = it.z - z; if (ex > r || ex < -r || ez > r || ez < -r) return; const d = Math.hypot(ex, ez); if (d > r) return;
    if (ring) poke(G, i, ex, ez, s * (1 - d / r * .6), d / r * .3); else poke(G, i, dx, dz, s * (1 - d / r * .5)); }));
  solo.forEach(m => { const ex = m.position.x - x, ez = m.position.z - z, d = Math.hypot(ex, ez), o = m.userData.w; if (d > r * 1.4 || (o && o.amp * Math.exp(-o.t / o.tau) > .03)) return;
    const vx = ring ? ex : dx, vz = ring ? ez : dz, n = Math.hypot(vx, vz) || 1; m.userData.w = { ax: vz / n, az: -vx / n, amp: .1 * s, t: 0, f: 2.6, tau: .55 }; }); }
function feel(e) {                                  // where the hand is: which corner it is near, and what it is brushing past
  if (intro || bookOpen) return; const g = ground(e.clientX, e.clientY); if (!g) return; const held = ptrs.size > 0, r = clamp(120 * kmPerPx(), 2.5, RC);
  CORN.forEach(c => { c.to = (held ? 1 : e.pointerType === 'mouse' ? .36 : 0) * smooth((1 - Math.hypot(g.x - c.x, g.z - c.z) / r) * 1.8); });   /* a peek when the pointer is near, the whole lift when the corner is held */
  if (e.pointerType !== 'mouse' || held || reduce.matches) { hand.on = false; return; }
  const dt = e.timeStamp - hand.t, dx = g.x - hand.x, dz = g.z - hand.z, px = Math.hypot(dx, dz) / kmPerPx();
  if (hand.on && dt > 0 && dt < 120 && px > 1.5) brush(g.x, g.z, dx, dz, clamp(px / dt / 1.1, .3, 1), Math.max(.22, 26 * kmPerPx()));   /* a quick sweep pushes harder than a slow one */
  hand.x = g.x; hand.z = g.z; hand.t = e.timeStamp; hand.on = true; }
function answer(k) {
  const want = clamp(44 * kmPerPx(), .4, 3.2); let moving = curled && Math.abs(want - LIFT) > LIFT * .02; if (!curled || moving) LIFT = want;   /* the same lift on screen at any zoom */
  CORN.forEach(c => { if (intro || bookOpen) c.to = 0;
    if (reduce.matches) { c.live = c.v !== c.to; c.v = c.to; c.vel = 0; }
    else { c.vel += ((c.to - c.v) * 140 - c.vel * 17) * k; c.v += c.vel * k; c.live = Math.abs(c.to - c.v) > .002 || Math.abs(c.vel) > .01; if (!c.live && c.v !== c.to) { c.v = c.to; c.vel = 0; c.live = true; } }   /* a light spring: paper settles with one small flutter */
    if (c.live) moving = true; });
  curled = CORN.some(c => c.v !== 0);
  if (moving && !intro) { foldSheet(A0); CORN.forEach(c => { if (c.live || c.v) c.list.forEach(q => { if (!wob.has(q[0].gi * 1e5 + q[1])) setInst(q[0], q[1], 1, 0, 0); }); }); }
  wob.forEach((w, key) => { w.t += k; if (w.t < 0) return; const e = Math.exp(-w.t / w.tau); if (e < .03 || intro) { wob.delete(key); if (!intro) setInst(w.G, w.i, 1, 0, 0); return; } setInst(w.G, w.i, w.ax, w.az, w.amp * e * Math.sin(w.t * w.f * 2 * PI)); });
  solo.forEach(m => { const w = m.userData.w; if (!w) return; w.t += k; const e = Math.exp(-w.t / w.tau); if (e < .03) { m.userData.w = null; m.quaternion.identity(); return; } m.quaternion.setFromAxisAngle(wA.set(w.ax, 0, w.az), w.amp * e * Math.sin(w.t * w.f * 2 * PI)); });
  grown.forEach(G => { if (G.touched) { G.touched = false; G.im.instanceMatrix.needsUpdate = true; } }); }

// ---------- every frame ----------
let last = 0, lastHover = 0;
const settle = t => { t = clamp(t, 0, 1); const c = .9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function skipIntro() { if (!intro) return; if (!intro.go) { intro.go = true; intro.t = .25; } intro.rate = 8; }   // the same arrival, eight times as fast: about a third of a second at most, and nothing jumps
// The graphics card builds its shaders off to the side; nothing is drawn until they are there, so the page never waits on it.
let gpu = 0; const warmGPU = () => { gpu = 0; const ok = () => { gpu = 1; }; try { const a = renderer.compileAsync(scene, cam); renderer.setRenderTarget(primerRT); const b = renderer.compileAsync(primer, cam, scene); renderer.setRenderTarget(null); Promise.all([a, b]).then(ok, ok); } catch (e) { try { renderer.setRenderTarget(null); } catch (x) {} ok(); } };
let nHeads = 0, repaint = false, fontsReady = true, marks = { paint: [] }; const px1 = new Uint8Array(4);
const tick = () => { if (!raf) raf = requestAnimationFrame(frame); }, wake = () => { if (asleep) { asleep = false; last = 0; } tick(); };
const canPaint = () => !!(window.LastSeen && LastSeen.painters && LastSeen.painters.popup);
const rested = () => !!gpu && (!canPaint() || (!queue.length && !half)) && !fly && !repaint && (!intro || (!intro.go && intro.sync === 2 && intro.calm >= 3));
// Shown: it comes back as it was left. If the book was turned to another place meanwhile, that place is the one marked here, it gives a hop, and the camera goes to it only if it is out of sight.
function seek(id) { const at = id ? visits.findIndex(v => v.id === id || v.place === id) : -1; if (at < 0) return 0; if (at === cur) return 1; cur = at; caption(); dress(); return 2; }
function show(id) { const had = shown; shown = true; if (!had) shownAt = performance.now(); const found = seek(id);
  if (intro && !intro.go) { if (found) carried = true; }
  else if (found === 2) { const p = visits[cur].pile; if (bookOpen) { cs.x = p.x; cs.z = p.z + .5; if (book) book.setScene(visits[cur].place, tod()); } else { place(); gather(); const s = p.sc; p.hopV = 5.5; if (!reduce.matches && (s[0] < 60 || s[0] > W - 60 || s[1] < 90 || s[1] > H - 40)) flyTo(p.x, p.z + .8, cs.d, null, null, EASE_GO); } }
  else caption();
  if (book && (bookOpen || opening)) book.setActive(true); wake(); }
function hide() { shown = false; hover = null; drag = null; pressed = null; coast = null; ptrs.clear(); view.classList.remove('is-over', 'is-drag'); showTip(null); if (book) book.setActive(false); }   /* a book left open here stops drawing too, and is as it was on the way back */
document.addEventListener('tl:view', e => { const d = e.detail || {}; if (d.view === 'map') show(d.id); else hide(); });
function frame(now) { raf = 0; if (asleep) return; tick(); const dt = Math.min(50, now - (last || now)); last = now; if (bookOpen && !fly && !intro && !reduce.matches && now % 3 > 1) return;   // under the book the map only idles
  const k = dt / 1000, T = now / 1000; pump(now);
  if (intro && !intro.go) {                        // before anything moves: the sheet lies folded while the places that will be seen first are painted, and everything is drawn once, too small to see, so no picture or shader has to be made ready mid-flight
    intro.t0 = intro.t0 || now; const wall = now - intro.t0; cs.d = DMAX * .74; if (repaint) { repaint = false; paint(); tex.needsUpdate = true; intro.sync = 0; }
    if (!intro.sync && gpu && intro.first.every(p => p.ready) && (fontsReady || wall > 600)) { intro.sync = .5; warmGPU(); }   /* the first places are painted: have their shaders built too */
    else if (intro.sync === .5 && gpu) intro.sync = 1;                                                               /* everything is asked for: this frame is drawn, then the graphics card is given time to have really done it */
    else if (intro.sync === 1.5) { const gl = renderer.getContext(), r = gl.clientWaitSync(intro.fence, 0, 0); if (r === gl.ALREADY_SIGNALED || r === gl.CONDITION_SATISFIED || r === gl.WAIT_FAILED) { gl.deleteSync(intro.fence); intro.fence = null; intro.sync = 2; intro.calm = 0; } }
    else if (intro.sync === 2) intro.calm = now - intro.prev < 24 ? intro.calm + 1 : 0;                              /* then for three frames in a row to come on time */
    if (intro.sync !== intro.was) { intro.was = intro.sync; (marks.stage = marks.stage || []).push([intro.sync, Math.round(wall), Math.round(now)]); }
    intro.prev = now; if (shown && ((intro.sync === 2 && intro.calm >= 3) || now - Math.max(intro.t0, shownAt) > 1600)) { intro.go = true; intro.t = Math.min(.25, wall / 1000); marks.go = now; marks.waited = Math.round(wall); try { sessionStorage.setItem('tm-opened', '1'); } catch (e) {} } }   /* it opens only in front of someone: made ready out of sight, it lies folded until it is shown */
  else if (intro) {                                // arriving: the sheet opens out, the city rises from the middle, then the places stand up in the order he went
    intro.t += k * (intro.rate || 1); const u = clamp((intro.t - .25) / INTRO.fold, 0, 1); foldSheet(lerp(A_SHUT, A0, settle(u))); cs.d = DMAX * lerp(.74, 1, smooth(u)); grow(intro.t - INTRO.city); cloudMat.opacity = cloudTarget * smooth((intro.t - INTRO.cloud[0]) / INTRO.cloud[1]);
    if (intro.t > Math.max(INTRO.end, INTRO.tail + nHeads * INTRO.gap) + (carried ? .3 : 0)) { intro = null; foldSheet(A0); grow(99); cloudMat.opacity = cloudTarget; marks.end = now; setTimeout(warmBook, 1500); } }
  else if (repaint && !fly && !drag && !coast) { repaint = false; paint(); tex.needsUpdate = true; }
  if (whl.k && !intro) { const s = Math.abs(whl.k) < .004 ? whl.k : whl.k * (1 - Math.exp(-dt / 70)); whl.k -= s; zoomAt(whl.x, whl.y, Math.exp(s)); }
  step(dt); glide(k, dt); place(); gather(); live(k, T); answer(k);
  const warm = !!intro && !intro.go; let rank = 0;
  piles.forEach(p => { const here = visits[cur].pile === p, head = p.head === p, tail = here && carried && !!intro, want = head && p.ready && (!intro || (intro.go && intro.t > INTRO.place + (tail ? nHeads * INTRO.gap + .2 : rank * INTRO.gap))) ? 1 : 0; if (head) rank++; if (want && !p.was) p.hopV = tail ? 5.5 : 3.6; p.was = want;   // the places that can be seen stand up one after another; the one the book was open at comes last, with a bigger hop
    if (reduce.matches) { p.vis = want; p.hop = 0; p.hopV = 0; }   // reduced motion: they are simply there
    const bw = p.count > 1 ? 1 : 0; p.bk = reduce.matches ? bw : p.bk + (bw - p.bk) * Math.min(1, k * 14); p.badge.visible = p.bk > .02; if (p.badge.visible) { const bs = .4 * (.5 + .5 * smooth(p.bk)); p.badge.scale.set(bs, bs, 1); p.badge.material.opacity = p.bk; }   // a count grows in and shrinks away as places gather and part
    p.vis += (want - p.vis) * Math.min(1, k * (want ? 5 : 9)); p.hopV -= (p.hop * 60 + p.hopV * 7.5) * k; p.hop += p.hopV * k; const hide = bookOpen && here ? 0 : 1;
    p.lift += ((hover === p ? .07 : 0) + (here ? .08 : 0) - p.lift) * Math.min(1, k * 24); p.press += ((pressed === p ? 1 : 0) - p.press) * Math.min(1, k * 30);   // the lift under the pointer eases in over about 120ms; a press gives 4% in about 100ms
    p.body.scale.setScalar(Math.max(1e-4, p.s * smooth(p.vis * 2.6) * hide * (1 + p.lift - .04 * p.press + Math.max(-.08, p.hop) * .2)));
    p.sheets.forEach((sh, j) => { const upk = backOut((p.vis - .16 - j * .13) / .5); sh.hinge.rotation.x = -(PI / 2) * (1 - upk) - .1 * upk; sh.hinge.visible = warm || p.vis > .17 + j * .13; });   // back, front, people: each sheet swings up a beat after the last
    p.g.visible = p.vis > .02 || (warm && p.ready && intro.sync >= 1); p.ring.visible = here && !bookOpen && p.vis > .9; if (p.ring.visible) { const q = reduce.matches ? .4 : (T * .55) % 1, r = .82 + q * .5; p.ring.scale.set(r, 1, r * .5); ringMat.opacity = .6 * (1 - q); } });
  nHeads = rank;
  if (!reduce.matches) clouds.forEach(c => { c.position.x += c.userData.v * k; if (c.position.x > X1 + 9) c.position.x = X0 - 9; });
  if (gpu && !(warm && intro.sync === 1.5)) renderer.render(scene, cam); if (hover && !drag && !bookOpen && !opening) showTip(hover);
  if (warm && gpu && intro.sync === 1) { const gl = renderer.getContext();   // a marker is left behind the frame just drawn, and looked for each frame: when the card reaches it, the work is done. The page is not held up while it waits.
    if (gl.fenceSync) { intro.fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush(); intro.sync = 1.5; } else { gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1); intro.sync = 2; intro.calm = 0; } }
  if (!shown && rested()) asleep = true; }   // put away, with nothing left to make ready: stop drawing until it is shown again

if (reduce.matches) grow(99); else { intro = { t: 0, t0: 0, prev: 0, sync: 0, calm: 0, go: false, first: [] }; foldSheet(A_SHUT); grow(-1); cloudMat.opacity = 0; }
new ResizeObserver(size).observe(view); size(); relight(); caption(); place(); gather();
if (intro) { intro.first = piles.filter(p => p.head === p); const lead = intro.first.map(p => p.want); queue.sort((a, b) => (lead.indexOf(b) >= 0) - (lead.indexOf(a) >= 0)); }   // the places seen first are painted first
new MutationObserver(m => { if (m.some(r => r.attributeName === 'data-lang')) { paint(); tex.needsUpdate = true; } relight(); caption(); if (book && bookOpen) book.setScene(visits[cur].place, tod()); wake(); })   /* put away or not, it gets itself ready for the new light */
  .observe(html, { attributes: true, attributeFilter: ['data-tod', 'data-lang', 'data-theme'] });
// The sheet's lettering is painted once the fonts are in. If they were not there for the first painting, it is painted again: while the sheet lies still, or after it has opened, never during.
const fontsIn = () => { try { return document.fonts.check('600 17px "Plus Jakarta Sans"') && (!ja() || document.fonts.check('600 19px "Noto Sans JP"', '東京')); } catch (e) { return true; } };
if (document.fonts && document.fonts.ready && !fontsIn()) { fontsReady = false; document.fonts.ready.then(() => { repaint = true; fontsReady = true; wake(); }); }
// Built at a press of the switch, its thumb is still sliding: the code above is the page's own work and does not hold the thumb up, but what follows keeps the graphics card busy, and that would. So it waits for the thumb to land.
{ const start = () => { warmGPU(); tick(); }, hold = Math.max(0, ((window.TLView && TLView.quietUntil) || 0) - performance.now()); if (hold) setTimeout(start, hold); else start(); }
if (!intro) setTimeout(warmBook, 1200);          // have the book ready before the first click; when the sheet opens first, the book waits until it has (see frame)
window.__map = { renderer, cs, go, openPlace, closeBook, flyTo, piles, visits, crow, crowFlee, plane, boats, cam, isSea, marks, replay: () => { intro = { t: 0, t0: 0, prev: 0, sync: 0, calm: 0, go: false, first: piles.filter(p => p.head === p) }; piles.forEach(p => { p.vis = 0; p.was = 0; }); }, state: () => ({ shown, asleep, cur: visits[cur].id, bookOpen, opening, fly: !!fly, sea: !!sea, d: +cs.d.toFixed(1), DMAX: +DMAX.toFixed(1), intro: intro ? +intro.t.toFixed(1) : null, coast: !!coast, rocking: wob.size, corners: CORN.map(c => +c.v.toFixed(2)), ready: piles.filter(p => p.ready).length, heads: piles.filter(p => p.head === p).length, queue: queue.length }) };
