/* Pop-up book. A "Last seen" scene as a pop-up storybook that opens FLAT, in three.js.

   THE BOOK      side-bound, lying on the page. It opens left to right into a flat spread, the spine pointing at you.
                 Once open it stays put: no turning, no closing by accident. You play with what is inside it.
   THE FOLD      every sheet is a V-fold, the mechanism real pop-up books use on a flat spread: a sheet creased at the
                 spine, each half glued to its own page along a line a few degrees off square. The geometry is exact:
                 with the pages lifted by b, the crease leans by t where tan t = -tan(phi) * sin(b). So the sheets lie
                 flat inside the shut book and only stand up in the last part of the opening. That is the "pop".
   THE SHEETS    nothing is printed flat except the ground. The sky is a backdrop sheet; clouds, the skyline and the
                 building stand in front of it one behind the other; the shopfront stands in front of the shop's inside;
                 each street prop is its own piece, standing where its feet were in the drawing.
   THE PEOPLE    still drawn live by the scene engine, on clear sheets, casting real shadows.
   PLAY          brush a piece and it flicks like card; click one and it bends right back; click people and they hop;
                 click the shopfront and the group steps out of the door again. Clouds drift on their own.
   Mounted on the homepage by /js/hero-book.js. three.js still comes from a CDN here; vendor it before this ships. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const LS = window.LastSeen;
const PWP = LS.popup.VIEW.PWP, Z0 = LS.popup.VIEW.Z0, Z1 = LS.popup.VIEW.Z1, PLN = Z1 - Z0, ZC = (Z0 + Z1) / 2;   // one page: width, far edge, near edge (1 unit = 100 scene units)
const T = LS.popup.VIEW.T, CB = 0.05;                                                 // page block, cover board
const PHI_BACK = 97 * Math.PI / 180, PHI_FRONT = 83 * Math.PI / 180;      // back sheets fold toward you, front pieces fold away, so both fit the shut book
const Z_SKY = -1.6, Z_FLOAT = -1.5, Z_BACK = -1.25, Z_FACADE = -.45, Z_NEAR = 1.65;
const HALF = Math.PI / 2, PI = Math.PI;
const TIER = .1, BT = .13;                       // how far apart the shopfront's sheets stand, and the building's behind it

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function sstep(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

function groundTop(S) {                           // the top edge of the ground in the drawing
  const W = S.size[0], H = S.size[1]; let top = null;
  (S.layers.back || []).forEach(p => { if (p.t === 'rect' && p.w >= W * .9 && p.y + p.h >= H - 2 && p.y > H * .5 && (top == null || p.y < top)) top = p.y; });
  return top == null ? LS.groundOf(S).y0 - 4 : top;
}
function mountManual(S, light, wpx, extra) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2), host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-30000px;top:0;pointer-events:none;width:' + (wpx / dpr) + 'px;height:' + (wpx * .75 / dpr) + 'px';
  host.innerHTML = '<canvas style="width:100%;height:100%;display:block"></canvas>';
  document.body.appendChild(host);
  const api = LS.mount(host, S, Object.assign({ manual: true, tod: light }, extra));
  return { host, api, canvas: host.querySelector('canvas') };
}

// Cut a layer into its separate objects. Each comes back as its own piece of paper: a cropped canvas, where it sat
// in the drawing, the line its feet stood on, and a small mask for telling a hit from a miss.
function cutPieces(src, o) {
  const w = 400, h = 300, yMax = o.yMax == null ? h : Math.floor(o.yMax), grow = o.grow || 1, cap = o.cap || 22;
  const lo = canvas(w, h), lx = lo.getContext('2d', { willReadFrequently: true }); lx.drawImage(src, 0, 0, w, h);
  const a = lx.getImageData(0, 0, w, h).data, solid = new Uint8Array(w * h), grown = new Uint8Array(w * h);
  for (let y = 0; y < yMax; y++) for (let x = 0; x < w; x++) solid[y * w + x] = a[(y * w + x) * 4 + 3] > 70 ? 1 : 0;
  for (let y = 0; y < yMax; y++) for (let x = 0; x < w; x++) {
    let on = 0; for (let dy = -grow; dy <= grow && !on; dy++) for (let dx = -grow; dx <= grow; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < yMax && solid[yy * w + xx]) { on = 1; break; } }
    grown[y * w + x] = on;
  }
  const label = new Int32Array(w * h), comps = [], stack = [];
  for (let i = 0; i < w * h; i++) {
    if (!grown[i] || label[i]) continue;
    const id = comps.length + 1, c = { ids: [id], x0: w, y0: h, x1: 0, y1: 0, yb: 0, n: 0 }; label[i] = id; stack.push(i);
    while (stack.length) { const j = stack.pop(), x = j % w, y = (j / w) | 0; c.n++;
      if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y; if (solid[j] && y > c.yb) c.yb = y;
      if (x > 0 && grown[j - 1] && !label[j - 1]) { label[j - 1] = id; stack.push(j - 1); } if (x < w - 1 && grown[j + 1] && !label[j + 1]) { label[j + 1] = id; stack.push(j + 1); }
      if (y > 0 && grown[j - w] && !label[j - w]) { label[j - w] = id; stack.push(j - w); } if (y < yMax - 1 && grown[j + w] && !label[j + w]) { label[j + w] = id; stack.push(j + w); } }
    comps.push(c);
  }
  let real = comps.filter(c => c.n >= 12).sort((p, q) => q.n - p.n);
  if (real.length > cap) {                        // too many scraps: the smallest share one sheet
    const rest = real.slice(cap), m = { ids: [], x0: w, y0: h, x1: 0, y1: 0, yb: 0, n: 0 };
    rest.forEach(c => { m.ids.push(...c.ids); m.x0 = Math.min(m.x0, c.x0); m.y0 = Math.min(m.y0, c.y0); m.x1 = Math.max(m.x1, c.x1); m.y1 = Math.max(m.y1, c.y1); m.yb = Math.max(m.yb, c.yb); m.n += c.n; });
    real = real.slice(0, cap).concat(m);
  }
  const sx = src.width / w, sy = src.height / h;
  return real.map(c => {
    const x0 = Math.max(0, c.x0 - 1), y0 = Math.max(0, c.y0 - 1), x1 = Math.min(w, c.x1 + 2), y1 = Math.min(yMax, c.y1 + 2), pw = x1 - x0, ph = y1 - y0;
    const ids = new Set(c.ids), mk = canvas(pw, ph), mx = mk.getContext('2d'), md = mx.createImageData(pw, ph), mask = new Uint8Array(pw * ph);
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) if (ids.has(label[(y + y0) * w + x + x0])) { md.data[(y * pw + x) * 4 + 3] = 255; mask[y * pw + x] = solid[(y + y0) * w + x + x0]; }
    mx.putImageData(md, 0, 0);
    const out = canvas(Math.max(2, Math.round(pw * sx)), Math.max(2, Math.round(ph * sy))), ox = out.getContext('2d');
    ox.drawImage(src, x0 * sx, y0 * sy, pw * sx, ph * sy, 0, 0, out.width, out.height);
    ox.globalCompositeOperation = 'destination-in'; ox.imageSmoothingQuality = 'high'; ox.drawImage(mk, 0, 0, out.width, out.height);
    return { canvas: out, x0, y0, x1, y1, yb: Math.min(c.yb + 1, yMax), n: c.n, hit: (u, v) => { const px = clamp(Math.floor(u * pw), 0, pw - 1), py = clamp(Math.floor((1 - v) * ph), 0, ph - 1); return !!mask[py * pw + px]; } };
  });
}

function pageArt(color, gutter) {               // plain paper, darker toward the gutter
  const c = canvas(520, 840), x = c.getContext('2d');
  x.fillStyle = color; x.fillRect(0, 0, 520, 840);
  const g = x.createLinearGradient(gutter === 'right' ? 520 : 0, 0, gutter === 'right' ? 400 : 120, 0);
  g.addColorStop(0, 'rgba(0,0,0,.24)'); g.addColorStop(.35, 'rgba(0,0,0,.06)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 520, 840);
  return c;
}

// A relief sheet is mostly empty. Keep only the part with something on it: far less to upload and to blend.
function cropSheet(c, yMax) {
  const lo = canvas(200, 150), lx = lo.getContext('2d', { willReadFrequently: true }); lx.drawImage(c, 0, 0, 200, 150);
  const a = lx.getImageData(0, 0, 200, 150).data, yLim = Math.min(150, Math.ceil(yMax / 2)); let x0 = 200, y0 = 150, x1 = -1, y1 = -1;
  for (let y = 0; y < yLim; y++) for (let x = 0; x < 200; x++) if (a[(y * 200 + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const r = { x0: Math.max(0, x0 * 2 - 3), y0: Math.max(0, y0 * 2 - 3), x1: Math.min(400, x1 * 2 + 5), y1: Math.min(yMax, y1 * 2 + 5) }, k = c.width / 400;
  const out = canvas(Math.max(2, Math.round((r.x1 - r.x0) * k)), Math.max(2, Math.round((r.y1 - r.y0) * k)));
  out.getContext('2d').drawImage(c, r.x0 * k, r.y0 * k, out.width, out.height, 0, 0, out.width, out.height);
  return { canvas: out, r };
}

export function createBook(host, cfg) {
  cfg = cfg || {};
  const say = k => (cfg.label && cfg.label(k)) || (k === 'open' ? 'Pop-up book, open. Move over the pieces to flick them.' : 'Pop-up book. Press Enter to open it.');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ antialias: (window.devicePixelRatio || 1) < 2, alpha: true });   // at 2x the pixels are small enough; MSAA over many clear sheets is the dearest thing here
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.autoUpdate = false;   // shadows are redrawn only when something moved
   renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const el = renderer.domElement;
  el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y;outline-offset:4px;cursor:pointer';
  el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', say('shut'));
  host.appendChild(el);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t; }

  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1.25, .1, 60);
  const amb = new THREE.AmbientLight(0xffffff, .6 * PI), sun = new THREE.DirectionalLight(0xfff6e8, .62 * PI), shop = new THREE.PointLight(0xffc77a, 0, 5, 2);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0008; sun.shadow.normalBias = .02; sun.shadow.radius = 5;
  const sc = sun.shadow.camera; sc.left = -5.6; sc.right = 5.6; sc.top = 5.6; sc.bottom = -5.6; sc.near = .5; sc.far = 26; sc.updateProjectionMatrix();
  sun.target.position.set(0, .8, 0);
  scene.add(amb, sun, sun.target, shop);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: .2 }));
  table.rotation.x = -HALF; table.receiveShadow = true; scene.add(table);

  // ---------- the book: the left half lies on the table, the right half turns on the spine ----------
  const cloth = new THREE.MeshLambertMaterial({ color: 0x27324c }), edges = new THREE.MeshLambertMaterial({ color: 0xe6dfcf });
  function box(w, h, d, mat, x, y, z, parent) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
  function flat(w, d, mat, x, y, z, parent) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -HALF; m.position.set(x, y, z); m.receiveShadow = true; parent.add(m); return m; }
  box(PWP + .08, CB, PLN + .14, cloth, -PWP / 2 - .04, CB / 2, ZC, scene);
  box(PWP, T - CB, PLN, edges, -PWP / 2, CB + (T - CB) / 2, ZC, scene);
  const leftMat = new THREE.MeshLambertMaterial(), rightMat = new THREE.MeshLambertMaterial(), coverMat = new THREE.MeshLambertMaterial();
  flat(PWP, PLN, leftMat, -PWP / 2, T + .001, ZC, scene);
  const right = new THREE.Group(); right.position.set(0, T, 0); scene.add(right);     // turns about the spine (the z axis)
  box(PWP, T - CB, PLN, edges, PWP / 2, -(T - CB) / 2, ZC, right);
  box(PWP + .08, CB, PLN + .14, cloth, PWP / 2 + .04, -(T - CB) - CB / 2, ZC, right);
  flat(PWP, PLN, rightMat, PWP / 2, .001, ZC, right);
  const under = new THREE.Group(); under.rotation.z = PI; right.add(under);           // the outside of the front cover
  flat(PWP + .08, PLN + .14, coverMat, -(PWP / 2 + .04), T + .002, ZC, under);
  // everything that pops up lives in a frame that bisects the two pages, so the fold maths stays symmetric
  const frameG = new THREE.Group(); frameG.position.set(0, T + .003, 0); scene.add(frameG);

  // ---------- what changes with the place and the light ----------
  let dyn = [], pieces = [], passes = [], arts = [], cur = null, yg = 244, zG0 = Z_FACADE;
  const main = { x: 0, v: 0, target: 0 };          // how open the book is: 0 shut, 1 flat
  function track(o) { dyn.push(o); return o; }
  function sheetMat(t, side) {
    const m = track(new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: .03, depthWrite: false, side: side || THREE.FrontSide }));
    m.shadowSide = THREE.DoubleSide;               // paper is one face thick: without this three.js skips it in the shadow pass
    return m;
  }
  function zOf(y) { return clamp(zG0 + .14 + (y - yg) / Math.max(1, 300 - yg) * (Z_NEAR - zG0 - .14), zG0 + .1, Z_NEAR); }
  /* One piece of card. def: { layers: [{ tex, mat?, zoff?, shadow? }], r: region in the drawing, foot, z, phi, full (texture is the
     whole 400 x 300 canvas), paper (colour of its back), amp (how freely it bends), k (stiffness), live, drift, hit, kind }.
     A piece that crosses the spine is two halves, one glued to each page. */
  function addPiece(def) {
    const r = def.r, P = { def, z: def.z, phi: def.phi, b: HALF, bv: 0, bend: 0, bendV: 0, hop: 0, hopV: 0, sw: 0, swV: 0, rock: 0, rockV: 0, glow: 0, gustAt: 0, gustPow: 0, meshes: [], order: 0, seed: pieces.length,
      top: (def.foot - r.y0) / 100, py: (def.foot - r.y1) / 100, cx: ((r.x0 + r.x1) / 2 - 200) / 100, oneSide: !(r.x0 < 200 && r.x1 > 200) };
    const parts = r.x0 < 200 && r.x1 > 200 ? [[r.x0, 200, -1], [200, r.x1, 1]] : [[r.x0, r.x1, (r.x0 + r.x1) / 2 < 200 ? -1 : 1]];
    parts.forEach(([xa, xb, side]) => {
      const geo = track(new THREE.PlaneGeometry((xb - xa) / 100, (r.y1 - r.y0) / 100));
      geo.translate(((xa + xb) / 2 - 200) / 100, (def.foot - (r.y0 + r.y1) / 2) / 100, 0);
      const uv = geo.attributes.uv, u0 = def.full ? xa / 400 : (xa - r.x0) / (r.x1 - r.x0), u1 = def.full ? xb / 400 : (xb - r.x0) / (r.x1 - r.x0);
      const v0 = def.full ? 1 - r.y1 / 300 : 0, v1 = def.full ? 1 - r.y0 / 300 : 1;
      uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
      def.layers.forEach(L => {
        const m = new THREE.Mesh(geo, L.mat || sheetMat(L.tex)); m.matrixAutoUpdate = false; m.userData = { piece: P, side, zoff: L.zoff || 0, top: !L.mat };
        if (L.shadow !== false) { m.castShadow = m.receiveShadow = true; m.customDepthMaterial = track(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: L.tex, alphaTest: .5 })); }
        if (L.mat) m.renderOrder = 80;
        frameG.add(m); P.meshes.push(m);
      });
      if (def.paper) {                             // the back of a sheet is bare paper: you see it while the book opens
        const src = def.layers[0].tex.image, bc = canvas(Math.max(2, src.width >> 1), Math.max(2, src.height >> 1)), bx = bc.getContext('2d');
        bx.drawImage(src, 0, 0, bc.width, bc.height); bx.globalCompositeOperation = 'source-in'; bx.fillStyle = def.paper; bx.fillRect(0, 0, bc.width, bc.height);
        const bm = new THREE.Mesh(geo, sheetMat(track(tex(bc)), THREE.BackSide)); bm.matrixAutoUpdate = false; bm.userData = { piece: P, side, zoff: 0 }; frameG.add(bm); P.meshes.push(bm);
      }
    });
    pieces.push(P); return P;
  }
  function clearScene() {
    pieces.forEach(P => P.meshes.forEach(m => frameG.remove(m))); pieces = [];
    arts.forEach(m => m.parent && m.parent.remove(m)); arts = [];
    dyn.forEach(o => o.dispose && o.dispose()); dyn = [];
    passes.forEach(p => { try { p.api.pause(); } catch (e) {} p.host.remove(); }); passes = [];
  }
  const LIGHTS = {
    morning: { amb: [0xeef3ff, .6], sun: [0xfff1dc, .62], at: [4, 6.2, 5.4], shadow: .16, shop: 0 },
    midday: { amb: [0xffffff, .6], sun: [0xfff6e8, .64], at: [-3, 7.4, 5.2], shadow: .2, shop: 0 },
    golden: { amb: [0xffe9d4, .56], sun: [0xffd0a0, .74], at: [-6, 4, 4.4], shadow: .22, shop: .3 },
    night: { amb: [0xd5dcff, .66], sun: [0xbac6ff, .44], at: [-2.4, 7, 5], shadow: .3, shop: 5 }
  };
  // the ground, printed across both pages: one half on each, so it folds with the book. Its far edge follows the sheets' chevron.
  function groundPrint(t, side) {
    const cot = Math.cos(PHI_BACK) / Math.sin(PHI_BACK), xs = side < 0 ? [-2, 0] : [0, 2], vTop = 1 - yg / 300;
    const rows = [[Z_BACK, vTop, 1], [zG0, vTop, 1], [Z1 - .25, 0, 0]], pos = [], uv = [];
    rows.forEach(([z, v, sweep]) => xs.forEach(x => { pos.push(x, 0, z + Math.abs(x) * cot * sweep); uv.push((x + 2) / 4, v); }));
    const g = track(new THREE.BufferGeometry()); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex([0, 2, 1, 1, 2, 3, 2, 4, 3, 3, 4, 5]); g.computeVertexNormals();
    const m = new THREE.Mesh(g, track(new THREE.MeshLambertMaterial({ map: t }))); m.receiveShadow = true; m.position.y = side < 0 ? T + .004 : .004;
    (side < 0 ? scene : right).add(m); arts.push(m);
  }
  const lit = { from: null, to: null, now: null, t: 1, flick: 9 }; let overMat = null;
  const lampOn = t => t >= 9 ? 1 : t < .38 ? 0 : t < .44 ? .8 : t < .53 ? .1 : t < .58 ? .9 : t < .7 ? .25 : Math.min(1, .7 + (t - .7) * 1.2);   // shop lamps catch, stutter, then hold
  function applyLight(dt) {
    if (!lit.to) return false;
    const was = lit.t; lit.t = Math.min(1, lit.t + dt / .9); if (lit.flick < 9) lit.flick += dt; if (lit.flick > 1.2 && lit.flick < 9) lit.flick = 9;
    const e = sstep(0, 1, lit.t), a = lit.from, b = lit.to;
    amb.color.copy(a.amb).lerp(b.amb, e); amb.intensity = a.ambI + (b.ambI - a.ambI) * e;
    sun.color.copy(a.sun).lerp(b.sun, e); sun.intensity = a.sunI + (b.sunI - a.sunI) * e; sun.position.lerpVectors(a.at, b.at, e);
    table.material.opacity = a.shadow + (b.shadow - a.shadow) * e;
    const on = lampOn(lit.flick), shopI = a.shop + (b.shop - a.shop) * e; shop.intensity = shopI * on; if (overMat) overMat.opacity = on;
    lit.now = { amb: amb.color.clone(), ambI: amb.intensity, sun: sun.color.clone(), sunI: sun.intensity, at: sun.position.clone(), shadow: table.material.opacity, shop: shopI };
    return was < 1 || lit.flick < 9;
  }
  /* Setting a scene is a lot of work: painting every sheet, cutting the pieces apart, handing it all to the GPU. Done in one
     go it holds the page still for a third of a second. So it is a job, advanced one stage per frame, and nothing shows or
     opens until the last stage is in. */
  const mark = (name, t0) => { try { performance.measure('pb:' + name, { start: t0, end: performance.now() }); } catch (e) {} };   // shows up in the Performance panel and in getEntriesByType('measure')
  let job = null, queued = null, uploads = null, compiled = false, compiling = false, holding = false, onReady = null;
  function build(placeId, light, opt, done) { job = { it: buildSteps(placeId, light, opt), done }; holding = true; }
  function* buildSteps(placeId, light, opt) {
    clearScene();
    const S = LS.byId(placeId); cur = { place: placeId, light, S };
    // paint only as finely as the stage can show: a phone needs a fifth of the pixels a wide screen does
    const dpr = Math.min(window.devicePixelRatio || 1, 2), px = clamp(Math.round((host.clientWidth || 800) * dpr * .72), 560, 1280), ppx = clamp(Math.round(px * .8), 440, 1000);
    const src = mountManual(S, light, px, { style: 'popup' });
    src.api.renderAt(S.signature && S.signature.still ? S.signature.still.t : 14, 'still');
    yield; const R = src.host._painted, pal = R.pal, paper = pal.paper || '#f1ede4';
    try { src.api.pause(); } catch (e) {} src.host.remove();
    const bT = R.layers.backTiers || [], fT = (R.layers.tiers || []), mB = Math.max(0, bT.reduce((m, c, i) => c ? i : m, 0)), fUsed = fT.map((c, i) => c ? i : -1).filter(i => i >= 0);
    yg = groundTop(S); zG0 = R.layers.facade ? Z_FACADE : Z_BACK + mB * BT;
    const L = LIGHTS[R.vkey] || LIGHTS.midday;
    // the light is a target, not a switch: when only the time of day changes, the sun travels there and the shadows swing round
    lit.to = { amb: new THREE.Color(L.amb[0]), ambI: L.amb[1] * PI, sun: new THREE.Color(L.sun[0]), sunI: L.sun[1] * PI, at: new THREE.Vector3(L.at[0], L.at[1], L.at[2]), shadow: L.shadow, shop: L.shop * PI };
    const litTo = lit.to; lit.to = lit.now ? (lit.to0 || litTo) : litTo; overMat = null;
    if (!lit.now) { lit.from = lit.to = litTo; lit.t = 1; lit.flick = 9; applyLight(0); }
    const sig = S.signature || {}, doorX = ((sig.emerge && sig.emerge.x) || 200);
    shop.color.set(pal.breathe && pal.breathe[0] === '#' ? pal.breathe : '#ffc77a'); shop.position.set((doorX - 200) / 100, T + .95, Z_FACADE + .75);   // high and out from the door, so it washes the pavement instead of burning a spot on it
    leftMat.map = track(tex(pageArt(paper, 'right'))); leftMat.needsUpdate = true;
    rightMat.map = track(tex(pageArt(paper, 'left'))); rightMat.needsUpdate = true;
    coverMat.map = track(tex(LS.popup.cover(R.vkey))); coverMat.needsUpdate = true; yield;
    // A drinks machine that stands out on the ground is drawn in the back layer, below the horizon. Lift it off the
    // print so it can stand up like everything else, and mend the ground where it was.
    let backSrc = R.layers.back, vend = null; const vd = S.vending;
    if (vd && vd.drawn && vd.foot > yg + 1) {
      const kk = backSrc.width / 400, rx = Math.max(0, vd.x - 1.5), ry = Math.max(0, vd.foot - vd.h - 1.5), rw = vd.w + 3, rh = vd.h + 3;
      const pc = canvas(Math.round(rw * kk), Math.round(rh * kk)); pc.getContext('2d').drawImage(backSrc, rx * kk, ry * kk, rw * kk, rh * kk, 0, 0, pc.width, pc.height);
      const gc = canvas(backSrc.width, backSrc.height), gx = gc.getContext('2d'); gx.drawImage(backSrc, 0, 0);
      const from = rx > 6 ? rx - 3 : rx + rw + 1;
      gx.clearRect(rx * kk, ry * kk, rw * kk, rh * kk); gx.drawImage(backSrc, from * kk, ry * kk, 2 * kk, rh * kk, rx * kk, ry * kk, rw * kk, rh * kk);
      bT.forEach(c => { if (c) { const q = c.getContext('2d'); q.save(); q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(rx * kk, ry * kk, rw * kk, rh * kk); q.restore(); } });
      backSrc = gc; vend = { canvas: pc, x0: rx, y0: ry, x1: rx + rw, y1: ry + rh, yb: vd.foot };
    }
    const tBack = track(tex(backSrc));
    groundPrint(tBack, -1); groundPrint(tBack, 1); yield;

    // the sky: a backdrop sheet right across the spread
    if (R.layers.sky) addPiece({ kind: 'sky', layers: [{ tex: track(tex(R.layers.sky)) }], r: { x0: 0, y0: 0, x1: 400, y1: yg }, foot: yg, z: Z_SKY, phi: PHI_BACK, full: true, paper, amp: .05, k: 60, hit: () => true });
    // everything behind the shopfront, cut into its own pieces: clouds float in front of the sky, the rest stands on the ground
    let nf = 0, ng = 0;
    cutPieces(bT[0] || backSrc, { yMax: yg, grow: 1, cap: 20 }).forEach(p => {
      const floats = p.yb < yg - 6, big = (p.x1 - p.x0) > 240;
      addPiece({ kind: floats ? 'cloud' : 'back', layers: [{ tex: track(tex(p.canvas)) }], r: p, foot: yg, phi: PHI_BACK, paper, hit: p.hit,
        z: floats ? Z_FLOAT + (nf++ % 3) * .07 : big ? Z_BACK : Z_BACK + .06 + (ng++ % 3) * .07, amp: floats ? .5 : big ? .07 : .3, k: floats ? 34 : 58, drift: floats ? .5 + (nf % 3) * .2 : 0 });
    });
    yield;
    function people(pass, z, foot, phi) {          // live: a clear sheet drawn by its own pass of the scene engine
      const m = mountManual(S, light, ppx, { pass }); m.tex = track(tex(m.canvas)); passes.push(m);
      return addPiece({ kind: 'people', live: true, layers: [{ tex: m.tex }], r: { x0: 0, y0: 0, x1: 400, y1: 300 }, foot, z, phi, full: true, amp: .22, k: 46,
        hit: (u, v) => { const X = u * 400, Y = (1 - v) * 300; return (m.host._figs || []).some(g => Math.abs(X - g[0]) < 9 * g[2] && Y > g[1] - 46 * g[2] && Y < g[1] + 3); } });
    }
    const sheetR = { x0: 0, y0: 0, x1: 400, y1: Math.min(300, yg + 1) };
    // the rooms seen through the windows stand behind the wall, which has real openings cut in it
    const relief = (c, z, k) => { const q = cropSheet(c, sheetR.y1); if (q) addPiece({ kind: 'relief', layers: [{ tex: track(tex(q.canvas)) }], r: q.r, foot: yg, z, phi: PHI_BACK, amp: .05, k, hit: () => false }); };
    if (R.layers.inner) relief(R.layers.inner, Z_BACK - .15, 60);
    people('inside', R.layers.inner ? Z_BACK - .07 : Z_BACK + .06, yg, PHI_BACK).inside = true;
    // the building in relief: what was drawn on the wall stands on its own sheets in front of it, each rising a beat later
    bT.forEach((c, i) => { if (c && i) relief(c, Z_BACK + BT * i, 56 - i * 7); });
    // Small things drawn with the shopfront but standing on their own feet (a scooter, a bench, a drinks machine) are lifted
    // off its sheets, so each is its own piece of card that can be nudged.
    yield; const lifted = [];
    if (R.layers.facade) {
      const kk = R.layers.facade.width / 400;
      cutPieces(R.layers.facade, { grow: 2, cap: 22 }).forEach(p => { if (p.x1 - p.x0 < 120 && p.y1 - p.y0 < 110 && p.yb >= yg - 40) { p.lift = true; lifted.push(p); } });
      lifted.forEach(p => [R.layers.facade].concat(fT.filter(Boolean)).forEach(c => { const q = c.getContext('2d'); q.save(); q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'destination-out';
        for (let n = 0; n < 3; n++) q.drawImage(p.canvas, p.x0 * kk, p.y0 * kk, (p.x1 - p.x0) * kk, (p.y1 - p.y0) * kk); q.restore(); }));
      // a drinks machine has a known box, so it comes off even when something leans against it
      if (vd && vd.drawn && !vend && !lifted.some(p => vd.x + vd.w / 2 > p.x0 && vd.x + vd.w / 2 < p.x1 && vd.foot - vd.h / 2 > p.y0 && vd.foot - vd.h / 2 < p.y1)) {
        const rx = Math.max(0, vd.x - 1), ry = Math.max(0, vd.foot - vd.h - 1), rw = Math.min(400 - rx, vd.w + 2), rh = vd.h + 2, src = R.layers.facade;
        const mid = src.getContext('2d').getImageData(Math.round((vd.x + vd.w / 2) * kk), Math.round((vd.foot - vd.h / 2) * kk), 1, 1).data[3];
        if (mid > 70) {
          const pc = canvas(Math.round(rw * kk), Math.round(rh * kk)); pc.getContext('2d').drawImage(src, rx * kk, ry * kk, rw * kk, rh * kk, 0, 0, pc.width, pc.height);
          [src].concat(fT.filter(Boolean)).forEach(c => { const q = c.getContext('2d'); q.save(); q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(rx * kk, ry * kk, rw * kk, rh * kk); q.restore(); });
          lifted.push({ canvas: pc, x0: rx, y0: ry, x1: rx + rw, y1: ry + rh, yb: vd.foot, lift: true, hit: () => true });
        }
      }
    }
    if (R.layers.facade) {
      const tF = track(tex(R.layers.facade)), lo = canvas(400, 300), lx = lo.getContext('2d'); lx.drawImage(R.layers.facade, 0, 0, 400, 300);
      const fa = lx.getImageData(0, 0, 400, 300).data, mF = fUsed.length ? fUsed[fUsed.length - 1] : 0, layers = [{ tex: fUsed.length > 1 ? track(tex(fT[fUsed[0]])) : tF }];
      if (R.layers.over) layers.push({ tex: null, shadow: false, zoff: mF * TIER + .03, mat: (overMat = track(new THREE.MeshBasicMaterial({ map: track(tex(R.layers.over)), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))) });
      addPiece({ kind: 'facade', layers, r: { x0: 0, y0: 0, x1: 400, y1: Math.min(300, yg + 1) }, foot: yg, z: Z_FACADE - (fUsed.length > 1 ? (mF - fUsed[0]) * TIER : 0), phi: PHI_BACK, full: true, paper, amp: .06, k: 62,
        hit: (u, v) => fa[(clamp(Math.floor((1 - v) * 300), 0, 299) * 400 + clamp(Math.floor(u * 400), 0, 399)) * 4 + 3] > 70 });
      // the shopfront in relief: what was drawn on the wall stands on its own sheets in front of it, and each rises a beat later
      if (fUsed.length > 1) fUsed.slice(1).forEach((t, i) => relief(fT[t], Z_FACADE - (mF - t) * TIER, 54 - i * 9));
    }
    yield; const props = (R.layers.front ? cutPieces(R.layers.front, { grow: 2, cap: 22 }) : []).concat(lifted);
    // the drinks machine: click it and it lights up, like something just dropped
    const glowOf = c => { const gc = canvas(c.width, c.height), gx = gc.getContext('2d'); gx.drawImage(c, 0, 0);
      gx.globalCompositeOperation = 'source-in'; const gg = gx.createLinearGradient(0, 0, 0, gc.height); gg.addColorStop(0, '#fff3d0'); gg.addColorStop(.6, '#ffd98a'); gg.addColorStop(1, '#4a3a20'); gx.fillStyle = gg; gx.fillRect(0, 0, gc.width, gc.height);
      return track(new THREE.MeshBasicMaterial({ map: track(tex(gc)), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); };
    const vc = vd && vd.drawn && !vend ? [vd.x + vd.w / 2, vd.foot - vd.h / 2] : null;
    props.forEach((p, i) => { p.z = zOf(p.yb) + (i % 4) * .004;
      const isVend = vc && vc[0] > p.x0 && vc[0] < p.x1 && vc[1] > p.y0 && vc[1] < p.y1 && (p.x1 - p.x0) < vd.w * 2.2, gm = isVend ? glowOf(p.canvas) : null, layers = [{ tex: track(tex(p.canvas)) }];
      if (gm) layers.push({ tex: null, shadow: false, zoff: .012, mat: gm });
      const air = p.lift || p.yb < yg - 6;         // wires hang where they were drawn, and what came off the shopfront keeps its place just in front of it
      if (air) p.z = zG0 + (p.lift ? .05 : .1) + (i % 4) * .004;
      const P = addPiece({ kind: 'prop', toy: gm ? 'light' : air && !p.lift ? null : 'rock', layers, r: p, foot: air ? yg : p.yb, z: p.z, phi: air ? PHI_BACK : PHI_FRONT, paper: air ? null : paper, amp: air ? .2 : .6, k: 40, hit: p.hit }); if (gm) P.glowMat = gm; });
    if (vend) { const gm = glowOf(vend.canvas);
      addPiece({ kind: 'prop', toy: 'light', layers: [{ tex: track(tex(vend.canvas)) }, { tex: null, shadow: false, zoff: .012, mat: gm }], r: vend, foot: vend.yb, z: zOf(vend.yb), phi: PHI_FRONT, paper, amp: .5, k: 44, hit: () => true }).glowMat = gm; }
    // things with a life of their own: washing sways on its line, a shop's lettering can be made to jump
    const toys = R.layers.toys || {};
    if (toys.sway) cutPieces(toys.sway.canvas, { yMax: yg, grow: 1, cap: 40 }).forEach(p =>
      addPiece({ kind: 'toy', toy: 'sway', layers: [{ tex: track(tex(p.canvas)) }], r: p, foot: yg, z: Z_BACK + BT * toys.sway.tier - .05, phi: PHI_BACK, amp: .05, k: 50, hit: p.hit }));
    if (toys.sign) { const q = cropSheet(toys.sign.canvas, sheetR.y1); if (q) addPiece({ kind: 'toy', toy: 'hop', layers: [{ tex: track(tex(q.canvas)) }], r: q.r, foot: yg, z: Z_BACK + BT * toys.sign.tier + .04, phi: PHI_BACK, amp: .05, k: 50, hit: () => true }); }
    if ((S.agaves || []).length) {                 // plants that sway stand with the planter they grow from
      const ag = S.agaves[0], home = props.find(p => ag.x >= p.x0 - 2 && ag.x <= p.x1 + 2 && ag.y >= p.y0 - 8 && ag.y <= p.y1 + 8);
      people('plants', home ? home.z - .012 : Z_FACADE + .05, home ? home.yb : yg, PHI_FRONT).plain = true;
    }
    const v = (S.variants && S.variants[R.vkey]) || {}, pbs = v.passersby || S.passersby || [];
    if (sig.emerge) people('crew', zOf(sig.emerge.foot1), sig.emerge.foot1, PHI_FRONT);
    const pf = pbs.length ? Math.max(...pbs.map(p => p.foot)) : 284;
    people('passers', zOf(pf), pf, PHI_FRONT);
    pieces.slice().sort((a, b) => a.z - b.z).forEach((P, i) => { P.order = i; P.meshes.forEach(m => { if (m.renderOrder < 80) m.renderOrder = 10 + i; }); });
    pieces.forEach(P => { P.b = (1 - main.x) * HALF; });
    drawPeople(); yield;
    // the light goes over last, so a sweep starts when the new picture is actually showing
    lit.to = lit.to0 = litTo; const sweep = !!(opt && opt.sweep) && !reduce.matches && lit.now;
    if (sweep) { lit.from = lit.now; lit.t = 0; lit.flick = R.vkey === 'night' ? 0 : 9; } else { lit.from = lit.to; lit.t = 1; lit.flick = 9; }
    applyLight(0); edges.color.set(R.vkey === 'night' ? 0x565a6c : 0xe6dfcf);   // the page block is not a lamp
    uploads = dyn.filter(o => o.isTexture);
  }

  // ---------- time, springs, the people ----------
  let clock = 0, sigStart = null, lastPeople = 0, settled = false, peek = 0;
  function drawPeople() {
    if (!cur) return;
    const S = cur.S, st = reduce.matches ? 'still' : sigStart, t = reduce.matches ? (S.signature && S.signature.still ? S.signature.still.t : 14) : clock;
    passes.forEach(p => { p.api.renderAt(t, st); p.tex.needsUpdate = true; });
  }
  const X2 = new THREE.Vector3(), Y2 = new THREE.Vector3();
  const X = new THREE.Vector3(), C = new THREE.Vector3(), N = new THREE.Vector3(), Y = new THREE.Vector3(), Zv = new THREE.Vector3(), O = new THREE.Vector3();
  function pose(P, beta) {                         // where the V-fold puts this piece, with the pages lifted by beta
    const sp = Math.sin(P.phi), cph = Math.cos(P.phi), tau = Math.atan(-Math.tan(P.phi) * Math.sin(P.b));   // the crease leans by tau
    C.set(0, Math.cos(tau), Math.sin(tau));
    const drift = P.def.drift ? Math.sin(clock * .32 * P.def.drift + P.seed) * .07 * main.x : 0;
    P.meshes.forEach(m => {
      const s = m.userData.side;
      X.set(sp * Math.cos(beta), s * sp * Math.sin(beta), s * cph);                                      // along this half's glue line, in the drawing's +x direction
      N.crossVectors(X, C).normalize();
      Y.copy(C).multiplyScalar(Math.cos(P.bend)).addScaledVector(N, Math.sin(P.bend));                    // a flick bends it about its foot
      Zv.crossVectors(X, Y).normalize();
      O.set(0, 0, P.z).addScaledVector(Zv, m.userData.zoff).addScaledVector(Y, P.hop).addScaledVector(X, drift);
      if (P.sw) { O.addScaledVector(X, -P.sw * P.top); Y.addScaledVector(X, P.sw); }                       // hanging things swing from their top edge
      if (P.rock && P.oneSide) { const c = Math.cos(P.rock), sn = Math.sin(P.rock); X2.copy(X).multiplyScalar(c).addScaledVector(Y, sn); Y2.copy(Y).multiplyScalar(c).addScaledVector(X, -sn);
        O.addScaledVector(X, P.cx).addScaledVector(Y, P.py).addScaledVector(X2, -P.cx).addScaledVector(Y2, -P.py); X.copy(X2); Y.copy(Y2); }                    // a nudged thing rocks on its foot
      m.matrix.makeBasis(X, Y, Zv).setPosition(O); m.matrixWorldNeedsUpdate = true;
      if (P.def.live) { m.visible = P.b < 1.05; m.material.depthTest = main.x < .93; }   // open: feet are never cut off by the page they stand on      // nothing live pokes out of a shut book
    });
  }

  // ---------- the camera: it frames the shut book, travels to the spread as it opens, then holds still ----------
  const VW = LS.popup.VIEW, C0 = new THREE.Vector3(...VW.C0), T0 = new THREE.Vector3(...VW.T0), C1 = new THREE.Vector3(...VW.C1), T1 = new THREE.Vector3(...VW.T1);   // far enough back that the book and its shadow have air around them   // open: seen from in front of the scene, not from above
  const cpos = new THREE.Vector3(), ctgt = new THREE.Vector3(), lean = { x: 0, y: 0, tx: 0, ty: 0 };   // the book stays put; you lean a little to look around it
  function placeCamera(open) { const e = sstep(0, 1, open); cpos.lerpVectors(C0, C1, e); ctgt.lerpVectors(T0, T1, e); camera.position.copy(cpos); camera.position.x += lean.x * .55 * e; camera.position.y += lean.y * .22 * e; camera.lookAt(ctgt); }

  // ---------- the frame ----------
  let raf = 0, last = 0, active = true, pending = null, wantOpen = false, lastShadow = 0, hoverAt = null, landed = false, touched = 0, nextIdle = 0; const idleLog = [];
  const drag = { id: null, x: 0, x0: 0, cover: false, moved: 0, lastX: 0, lastT: 0, vx: 0 };
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.033, (now - (last || now)) / 1000); last = now;
    if (pending && main.x < .03 && !job) { const p = pending; pending = null; build(p.place, p.light); main.target = wantOpen ? 1 : 0; settled = false; }
    if (job) { const t0 = performance.now(), r = job.it.next(); mark('step ' + (job.n = (job.n || 0) + 1), t0); if (r.done) { const d = job.done; job = null; if (d) d(); } }
    else if (uploads) {                             // textures go to the GPU a few at a time
      const t0 = performance.now(); for (let n = 0; n < 4 && uploads.length; n++) renderer.initTexture(uploads.pop()); mark('upload', t0);
      if (!uploads.length) { uploads = null;
        if (compiled) holding = false;
        else if (!compiling) { compiling = true; const fin = () => { compiled = true; compiling = false; holding = false; mark('compiled', performance.now()); };   // shaders are compiled without stopping the page, where the browser can
          try { renderer.compileAsync(scene, camera).then(fin, fin); } catch (e) { fin(); } } }
    }
    if (!holding && !job && queued) { const q = queued; queued = null; api.setScene(q.place, q.light); }
    if (!holding && onReady) { const f = onReady; onReady = null; renderer.shadowMap.needsUpdate = true; f(); }
    // A new scene is a lot of paper to hand to the GPU. Do it while the book is shut and still, and only then let it open,
    // so the opening itself never waits on an upload.
    const goal = pending || (holding && main.x < .2) ? 0 : Math.max(main.target, peek);
    if (reduce.matches) { main.x = goal; main.v = 0; }
    else if (!drag.cover) { main.v += ((goal - main.x) * 30 - main.v * 8.6) * dt; main.x += main.v * dt; }
    main.x = clamp(main.x, 0, 1.03);
    const beta = (1 - main.x) * HALF;              // each page's lift off flat; the spread's own angle is 180 minus twice this
    right.rotation.z = 2 * beta; frameG.rotation.z = beta;
    let moving = Math.abs(main.v) > .002 || drag.cover;
    pieces.forEach(P => {
      if (reduce.matches) { P.b = beta; P.bend = 0; P.hop = 0; }
      else {
        const far = clamp((Z_FACADE + .3 - P.z) / (Z_FACADE + .3 - Z_SKY), 0, 1);                              // the back of the scene is the last to arrive
        P.bv += ((beta - P.b) * P.def.k * 1.6 * (1.12 - .5 * far) - P.bv * 7.5) * dt; P.b = clamp(P.b + P.bv * dt, -.5, HALF);   // each piece trails the pages a little and overshoots: paper
        P.bendV += (-P.bend * P.def.k * 2.4 - P.bendV * 5.2) * dt; P.bend = clamp(P.bend + P.bendV * dt, -.9, .9);
        if (P.hop > 0 || P.hopV > 0) { P.hopV -= 9.5 * dt; P.hop = Math.max(0, P.hop + P.hopV * dt); if (!P.hop) P.hopV = 0; }
        if (P.gustAt && clock >= P.gustAt) { P.gustAt = 0; if (P.def.toy === 'sway') P.swV += P.gustPow; else P.bendV += -P.gustPow * P.def.amp * 2.2; }
        if (P.def.toy === 'sway') { const rest = Math.sin(clock * 1.15 + P.seed * 1.7) * .012 * main.x; P.swV += (-(P.sw - rest) * 15 - P.swV * 1.5) * dt; P.sw = clamp(P.sw + P.swV * dt, -.5, .5); }
        if (P.rock || P.rockV) { P.rockV += (-P.rock * 70 - P.rockV * 4.2) * dt; P.rock += P.rockV * dt; if (Math.abs(P.rock) < .0004 && Math.abs(P.rockV) < .004) P.rock = P.rockV = 0; }
      }
      if (P.glowMat) { P.glow = Math.max(0, P.glow - dt / 2.6); P.glowMat.opacity = P.glow * P.glow; }
      if (Math.abs(P.bv) > .003 || Math.abs(P.bendV) > .003 || Math.abs(P.bend) > .002 || P.hop > 0 || Math.abs(beta - P.b) > .001 || Math.abs(P.swV) > .02 || P.rock) moving = true;
      pose(P, beta);
    });
    if (applyLight(dt)) moving = true;
    // the spread lands: every piece of card shivers once, the way paper does when a heavy page comes down
    if (!landed && main.x > .975 && main.v > .25 && main.target > .5) { landed = true; const hit = Math.min(1.4, main.v);
      if (!reduce.matches) pieces.forEach(P => { P.bendV += (Math.random() - .5) * P.def.amp * 5 * hit; if (P.def.toy === 'sway') P.swV += (Math.random() - .5) * .5 * hit; });
      if (cfg.onLand) cfg.onLand(hit); }
    if (main.x < .5) landed = false;
    // left alone, one small thing happens now and then: a breeze along the washing and the clouds, a prop settling, the machine blinking
    if (settled && !reduce.matches && clock - touched > 6 && clock > nextIdle) {
      nextIdle = clock + 8 + Math.random() * 7;
      const kinds = ['breeze']; if (pieces.some(P => P.def.toy === 'rock')) kinds.push('settle'); if (pieces.some(P => P.glowMat)) kinds.push('blink');
      const what = kinds[Math.floor(Math.random() * kinds.length)], dir = Math.random() < .5 ? -1 : 1; idleLog.push(what);
      if (what === 'breeze') pieces.forEach(P => { if (P.def.toy === 'sway' || P.def.kind === 'cloud' || P.plain) { P.gustAt = clock + (dir > 0 ? P.cx + 2 : 2 - P.cx) * .22 + .01; P.gustPow = dir * (P.def.toy === 'sway' ? .5 + Math.random() * .35 : .5); } });
      else if (what === 'settle') { const c = pieces.filter(P => P.def.toy === 'rock'), P = c[Math.floor(Math.random() * c.length)]; P.bendV += -P.def.amp * 1.6; }
      else { const P = pieces.find(q => q.glowMat); P.glow = .85; }
    }
    const isOpen = main.x > .985 && Math.abs(main.v) < .04;
    if (isOpen && !settled) { settled = true; nextIdle = clock + 6; sigStart = clock + .35; el.setAttribute('aria-label', say('open')); if (cfg.onOpen) cfg.onOpen(); }
    if (main.x < .6 && settled) { settled = false; if (cfg.onShut) cfg.onShut(); el.setAttribute('aria-label', say('shut')); }
    if (sigStart != null && clock - sigStart > 17 && settled) sigStart = clock + .5;
    clock += dt;
    if (main.x > .5 && now - lastPeople > 14 && !reduce.matches) { lastPeople = now; drawPeople(); }   // every frame, up to 60 a second: half-rate walkers read as lag
    if (hoverAt && settled) { const e = hoverAt; hoverAt = null; hover(e); }                            // one pick a frame, however fast the pointer reports
    if (moving || now - lastShadow > 50) { renderer.shadowMap.needsUpdate = true; lastShadow = now; }   // sheets in motion: every frame; only walkers: 20 a second is plenty
    if (reduce.matches) lean.x = lean.y = 0; else { lean.x += (lean.tx - lean.x) * Math.min(1, dt * 8); lean.y += (lean.ty - lean.y) * Math.min(1, dt * 8); }
    placeCamera(main.x);
    if (compiled) { const t0 = performance.now(); renderer.render(scene, camera); if (performance.now() - t0 > 30) mark('slow render', t0); }   // nothing is drawn until the first shaders are ready: drawing sooner would compile them the slow way
  }

  // ---------- hands ----------
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function pick(e) {                               // the nearest piece of card under the pointer, ignoring its cut-away parts
    const rc = el.getBoundingClientRect(); ptr.set((e.clientX - rc.left) / rc.width * 2 - 1, -((e.clientY - rc.top) / rc.height * 2 - 1));
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(frameG.children.filter(m => m.visible && m.userData.top), false);
    for (const h of hits) { const P = h.object.userData.piece; if (!P.def.hit || P.def.hit(h.uv.x, h.uv.y)) return P; }
    return null;
  }
  function flick(P, power) { if (reduce.matches) return; if (P.def.toy === 'sway') { P.swV += (Math.random() < .5 ? -1 : 1) * power * .9; return; } P.bendV += -power * P.def.amp * (4 + Math.random() * 2); }
  let hoverP = null, lastMove = { x: 0, y: 0, t: 0 };
  el.addEventListener('pointerdown', e => {
    if (e.button || settled) return;               // an open book is not for moving
    el.setPointerCapture(e.pointerId);
    Object.assign(drag, { id: e.pointerId, x: e.clientX, x0: main.x, cover: false, moved: 0, lastX: e.clientX, lastT: e.timeStamp, vx: 0 });
  });
  el.addEventListener('pointermove', e => {
    const rc = el.getBoundingClientRect();
    if (e.pointerType !== 'touch') { lean.tx = clamp((e.clientX - rc.left) / rc.width * 2 - 1, -1, 1); lean.ty = clamp(1 - (e.clientY - rc.top) / rc.height * 2, -1, 1); }
    if (drag.id != null) {                         // while it is shut, the cover follows the hand: pull it across to open
      const dx = e.clientX - drag.x; drag.moved = Math.max(drag.moved, Math.abs(dx));
      if (drag.moved > 6) drag.cover = true;
      if (drag.cover) { main.x = clamp(drag.x0 + dx / (rc.width * .42), 0, 1); main.v = 0;
        const dtm = Math.max(1, e.timeStamp - drag.lastT); drag.vx = (e.clientX - drag.lastX) / dtm; drag.lastX = e.clientX; drag.lastT = e.timeStamp; }
      return;
    }
    if (!settled) { if (e.pointerType !== 'touch') peek = main.target < .1 ? .07 : 0; el.style.cursor = 'pointer'; return; }
    // open: brushing a piece flicks it, harder the faster the hand
    hoverAt = { clientX: e.clientX, clientY: e.clientY, timeStamp: e.timeStamp }; touched = clock;
  });
  function hover(e) {
    const P = pick(e), dtm = Math.max(1, e.timeStamp - lastMove.t), speed = Math.hypot(e.clientX - lastMove.x, e.clientY - lastMove.y) / dtm;
    lastMove = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    if (P && P !== hoverP) flick(P, clamp(.35 + speed * .5, .35, 1.3));
    const cur2 = P && P.def.kind !== 'sky' ? 'pointer' : 'default'; if (el.style.cursor !== cur2) el.style.cursor = cur2;
    hoverP = P;
  }
  function release(e) {
    if (drag.id == null) {
      if (settled && e.type === 'pointerup') {     // a click inside the open book
        touched = clock; const P = pick(e); if (!P) return;
        if (P.def.kind === 'people' && !P.plain && !P.inside) { if (!reduce.matches && P.hop === 0) P.hopV = 2.3; }
        else if (P.def.kind === 'facade') { api.replay(); flick(P, .8); }
        else if (reduce.matches) { if (P.glowMat) P.glow = 1; }
        else if (P.def.toy === 'light') { P.glow = 1; P.hopV = .5; P.rockV += (Math.random() < .5 ? -1 : 1) * .5; }   // lights up with a clunk
        else if (P.def.toy === 'rock' && P.oneSide) { P.rockV += (Math.random() < .5 ? -1 : 1) * 1.3; flick(P, .5); }      // a nudge: it rocks on its foot
        else if (P.def.toy === 'hop') { if (P.hop === 0) P.hopV = 1.7; }
        else if (P.def.toy === 'sway') { P.swV += (Math.random() < .5 ? -1 : 1) * 2.2; }
        else flick(P, 2);
      }
      return;
    }
    const wasCover = drag.cover; drag.id = null; drag.cover = false;
    if (wasCover) { const fl = Math.abs(drag.vx) > .35; wantOpen = fl ? drag.vx > 0 : main.x > .45; main.target = wantOpen ? 1 : 0; main.v = clamp(drag.vx * 2.2, -4, 4); }
    else api.open();
  }
  el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release);
  el.addEventListener('pointerleave', () => { peek = 0; hoverP = null; lean.tx = lean.ty = 0; });
  el.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !settled) { e.preventDefault(); api.open(); } else if (e.key === 'Escape') api.close(); });
  const ro = new ResizeObserver(() => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = VW.fov(camera.aspect);   // a narrow stage (a phone): widen the view until the whole spread fits across it
    camera.updateProjectionMatrix(); });
  ro.observe(host);

  // A new time of day: the old picture stays up for a moment and melts into the new one while the sun moves underneath.
  let veil = null;
  function relight(place, light) {
    if (main.x < .5) { build(place, light); return; }
    if (!veil) { veil = document.createElement('canvas'); veil.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0'; host.appendChild(veil); }
    veil.width = el.width; veil.height = el.height; renderer.render(scene, camera); veil.getContext('2d').drawImage(el, 0, 0);
    veil.style.transition = 'none'; veil.style.opacity = '1';
    build(place, light, { sweep: true });
    onReady = () => requestAnimationFrame(() => { veil.style.transition = 'opacity ' + (reduce.matches ? 200 : 650) + 'ms cubic-bezier(.2,0,0,1)'; veil.style.opacity = '0'; });
  }
  const api = {
    open() { wantOpen = true; main.target = 1; },
    close() { wantOpen = false; main.target = 0; peek = 0; },
    toggle() { if (main.target < .1) api.open(); else api.close(); },
    replay() { sigStart = clock + .2; },
    isOpen() { return main.target > .1; },
    // a new place turns to another book: it shuts, the new scene is set, and it opens again. A new light just changes the light.
    setScene(place, light) {
      if (job || holding) { queued = { place, light }; return; }
      if (!cur) { build(place, light); onReady = () => { if (cfg.onReady) cfg.onReady(); }; return; }
      if (cur.place === place) { if (cur.light !== light) relight(place, light); return; }
      pending = { place, light };
    },
    snapshot(target) { renderer.render(scene, camera); const x = target.getContext('2d'); x.clearRect(0, 0, target.width, target.height);
      const s = Math.min(el.width / target.width, el.height / target.height), sw = target.width * s, sh = target.height * s;
      x.drawImage(el, (el.width - sw) / 2, (el.height - sh) / 2, sw, sh, 0, 0, target.width, target.height); },
    setActive(on) { if (on === active) return; active = on; if (on) { last = 0; raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf); },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); clearScene(); renderer.dispose(); el.remove(); },
    relabel() { el.setAttribute('aria-label', say(settled ? 'open' : 'shut')); },
    _debug: { idleLog, lit, main, state: () => ({ job: !!job, holding, uploads: uploads && uploads.length, compiled, compiling, pending: !!pending, queued: !!queued, wantOpen, active, settled }), pieces: () => pieces, scene, camera, renderer }
  };
  placeCamera(0);
  raf = requestAnimationFrame(frame);
  return api;
}
