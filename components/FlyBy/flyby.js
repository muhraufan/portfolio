/* ════════════════════════════════════════════════════════════════════
   FLY-BY SURPRISE — TIER 3
   ────────────────────────────────────────────────────────────────────
   A pixel-art plane drifts across the viewport carrying a banner that
   reads "You won't regret hiring me". The visitor can click the plane:
   it tilts and dives, the pilot ejects with a parachute and drifts
   down holding a sign reading "I'm fine! Now hire me!". Click the
   sign → opens a pre-filled mailto:. Ignore the sign → pilot lands,
   waves the sign one last time, and walks off-screen.

   PUBLIC API (window.FlyBy):
     FlyBy.show()              start the sequence from the beginning
     FlyBy.setText(string)     change the banner text on the fly
     FlyBy.config              full config object (see below)

   AUTO-TRIGGER (desktop only, ≥ 768px):
     - Pauses while document.hidden
     - Pauses after 30s of no scroll / mousemove / touchstart / keydown
     - Fires once visitor scrolls ≥ 25% AND has ≥ 5s of active reading
     - Once per page per visitor via localStorage key keyed on pathname
     - Skipped entirely if prefers-reduced-motion: reduce
   ════════════════════════════════════════════════════════════════════ */
window.FlyBy = (function () {

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { show() {}, setText() {}, config: {} };
  }

  const canvas = document.getElementById('flyby-surprise');
  if (!canvas) return { show() {}, setText() {}, config: {} };

  // ─── CONFIG ──────────────────────────────────────────────────────────
  // flyDuration was 13000 → 16000: gives the visitor a noticeably wider
  // window to spot and click the plane. Not so slow that it becomes a
  // distraction for someone who's still reading the case study.
  const config = {
    text:        "You won't regret hiring me",
    signLine1:   "I'm fine!",
    signLine2:   "Now hire me!",
    email:       'muhammadraufan@gmail.com',
    subject:     'Saw your portfolio',
    flyDuration: 16000,
    pixelScale:  2,
    bobAmount:   3,
    playOnce:    true,
    storageKey:  'flyby-shown-' + location.pathname
      .replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, ''),
  };

  // ─── PALETTE ─────────────────────────────────────────────────────────
  const C = {
    bodyHi: '#f07060', body: '#d04848', bodyLo: '#902828',
    wing:   '#f0c850', wingLo: '#b08828',
    nose:   '#1a1a1a',
    cockpit:'#0e1a2a', glass: '#9ec8e0',
    skin:   '#f4cc94', skinLo:'#c89868',
    cap:    '#5a3010', capLo: '#2a1808',
    goggleF:'#1a1a1a', goggleG:'#a8d0e8', goggleHi:'#ffffff',
    scarf:  '#f0eee0', scarfLo:'#b8b6a8',
    mouth:  '#a02020',
    prop:   'rgba(40,40,40,0.32)', propEdge:'rgba(80,80,80,0.55)',
    propHub:'#1a1a1a',
    banner: '#f7f2ea', bannerLo:'#dcd4c4',
    bannerEdge:'#1a1a1a', bannerText:'#1a1a1a',
    rope:   '#5a4028',
    wood:   '#7a5028', woodLo: '#3a2010',
    chute:  '#f7f2ea', chuteLo:'#dcd4c4', chuteEdge:'#1a1a1a',
    cord:   '#3a2810',
    ground: '#3a2010',
  };

  // ─── CANVAS ──────────────────────────────────────────────────────────
  const ctx = canvas.getContext('2d');
  const PS  = () => config.pixelScale;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
  }
  resize();
  addEventListener('resize', resize);

  // Draw helper — sprite-pixel coordinates → canvas pixels.
  const px = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x * PS()), Math.round(y * PS()), w * PS(), h * PS());
  };
  // Single sprite-pixel dot (for cords, scarf tails).
  const pxRaw = (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), PS(), PS());
  };
  function spriteLine(x1, y1, x2, y2, color) {
    // Bresenham in sprite-px coords, painted as PS-sized dots.
    // CRITICAL: snap inputs to integers. The loop terminates on
    // `x === x2 && y === y2`; with float inputs (which we get from
    // pixel positions during parachute) x increments by ±1 and would
    // never hit a non-integer x2 — infinite loop = browser freeze.
    x1 = Math.round(x1); y1 = Math.round(y1);
    x2 = Math.round(x2); y2 = Math.round(y2);
    const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
    let err = dx - dy, x = x1, y = y1;
    // Hard safety cap — never more sprite-px than the longer side.
    let safety = dx + dy + 8;
    while (safety-- > 0) {
      px(x, y, 1, 1, color);
      if (x === x2 && y === y2) break;
      const e2 = err * 2;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 <  dx) { err += dx; y += sy; }
    }
  }

  // ═══ SPRITE: PLANE ═══════════════════════════════════════════════════
  function drawPlane(ox, oy, propFrame, t, propSpinning) {
    const p = (x, y, w, h, c) => px(ox + x, oy + y, w, h, c);

    // PROPELLER (sputtering during HIT phase — propSpinning=false → static)
    const pX = 30;
    p(pX, 8, 2, 3, C.propHub);
    if (!propSpinning) {
      // Stalled propeller — single horizontal blade
      p(pX - 1, 9, 4, 1, C.prop);
    } else if (propFrame === 0) {
      p(pX, 4, 2, 11, C.prop);
      p(pX, 4, 2, 1, C.propEdge);
      p(pX, 14, 2, 1, C.propEdge);
    } else if (propFrame === 1) {
      p(pX-1, 5, 4, 9, C.prop);
      p(pX-1, 5, 1, 1, C.propEdge);
      p(pX+2, 13, 1, 1, C.propEdge);
    } else {
      p(pX-1, 8, 4, 3, C.prop);
      p(pX-1, 9, 1, 1, C.propEdge);
      p(pX+2, 9, 1, 1, C.propEdge);
    }

    // NOSE / ENGINE COWL
    p(26, 6, 4, 7, C.nose);
    p(26, 6, 4, 1, '#3a3a3a');
    p(26, 12, 4, 1, '#000000');

    // FUSELAGE
    p(7, 7, 19, 6, C.body);
    p(10, 5, 16, 2, C.body);
    p(13, 4, 13, 1, C.body);
    p(9, 13, 17, 1, C.body);
    p(11, 14, 13, 1, C.bodyLo);
    p(13, 5, 13, 1, C.bodyHi);
    p(11, 6, 14, 1, C.bodyHi);
    p(8, 12, 18, 1, C.bodyLo);

    // TAIL
    p(2, 8, 6, 2, C.body);
    p(2, 9, 6, 1, C.bodyLo);
    p(2, 8, 1, 1, C.bodyHi);
    p(3, 4, 3, 4, C.body);
    p(3, 4, 3, 1, C.bodyHi);
    p(5, 5, 1, 3, C.bodyLo);

    // WING
    p(8, 14, 18, 2, C.wing);
    p(8, 15, 18, 1, C.wingLo);
    p(7, 14, 1, 1, C.wing);
    p(26, 14, 1, 1, C.wing);
    p(14, 13, 1, 1, C.bodyLo);
    p(20, 13, 1, 1, C.bodyLo);

    // COCKPIT
    p(15, 3, 7, 2, C.cockpit);
    p(15, 2, 7, 1, C.glass);
    p(14, 3, 1, 1, C.glass);
    p(22, 3, 1, 1, C.glass);

    // PILOT — cap, face, goggles
    p(16, 0, 5, 2, C.cap);
    p(16, 0, 5, 1, C.capLo);
    p(15, 1, 1, 1, C.cap);
    p(21, 1, 1, 1, C.cap);
    p(16, 2, 5, 2, C.skin);
    p(16, 3, 5, 1, C.skinLo);
    p(16, 1, 2, 1, C.goggleG);
    p(16, 2, 2, 1, C.goggleF);
    p(17, 1, 1, 1, C.goggleHi);
    p(19, 1, 2, 1, C.goggleG);
    p(19, 2, 2, 1, C.goggleF);
    p(20, 1, 1, 1, C.goggleHi);
    p(18, 2, 1, 1, C.goggleF);
    p(18, 4, 1, 1, C.mouth);

    // Scarf
    const sw = Math.sin(t * 0.012) * 0.5;
    p(14, 4 + Math.round(sw),       2, 1, C.scarf);
    p(12, 4 + Math.round(sw + 0.3), 2, 1, C.scarf);
    p(10, 5 + Math.round(sw * 1.5), 2, 1, C.scarf);
    p(13, 5 + Math.round(sw * 0.8), 1, 1, C.scarfLo);
    p(11, 5 + Math.round(sw + 1),   1, 1, C.scarfLo);

    // Waving hand (only while flying happily — dropped during HIT)
    if (propSpinning) {
      const hb = Math.floor(t * 0.006) % 2;
      p(22, 1 - hb, 1, 1, C.skin);
      p(23, 0 - hb, 1, 1, C.skin);
    }
  }

  // ═══ SPRITE: STANDALONE PILOT (parachuting / landed / running) ═══════
  // Origin (spX, spY) is the top-left of the pilot's head. Pilot is
  // 5 sprite-px wide × 12 sprite-px tall.
  function drawPilot(spX, spY, opts) {
    const o = opts || {};
    // Cap
    px(spX, spY, 5, 1, C.capLo);
    px(spX, spY + 1, 5, 1, C.cap);
    // Face
    px(spX, spY + 2, 5, 2, C.skin);
    px(spX, spY + 3, 5, 1, C.skinLo);
    // Goggles
    px(spX, spY + 2, 2, 1, C.goggleG);
    px(spX + 3, spY + 2, 2, 1, C.goggleG);
    px(spX + 1, spY + 2, 1, 1, C.goggleHi);
    px(spX + 4, spY + 2, 1, 1, C.goggleHi);
    // Mouth (small smile when fine)
    px(spX + 2, spY + 3, 1, 1, C.mouth);
    // Scarf around neck + trailing back
    px(spX, spY + 4, 5, 1, C.scarf);
    if (o.scarfDir !== 0) {
      const dir = o.scarfDir || -1; // negative = trails left
      const sw = Math.round(Math.sin((o.t || 0) * 0.008) * 0.4);
      px(spX + dir, spY + 4 + sw, 1, 1, C.scarf);
      px(spX + dir * 2, spY + 5 + sw, 1, 1, C.scarfLo);
    }
    // Body (red jumpsuit)
    px(spX, spY + 5, 5, 3, C.body);
    px(spX, spY + 5, 5, 1, C.bodyHi);
    px(spX, spY + 7, 5, 1, C.bodyLo);
    // Legs
    const legFrame = o.legFrame || 0;
    if (legFrame === 0) {
      // Together (parachute / landed / standing)
      px(spX, spY + 8, 2, 3, C.cap);
      px(spX + 3, spY + 8, 2, 3, C.cap);
      px(spX, spY + 10, 2, 1, C.capLo);
      px(spX + 3, spY + 10, 2, 1, C.capLo);
    } else if (legFrame === 1) {
      // Running pose A
      px(spX - 1, spY + 8, 2, 2, C.cap);
      px(spX + 3, spY + 8, 2, 3, C.cap);
      px(spX - 1, spY + 9, 2, 1, C.capLo);
      px(spX + 3, spY + 10, 2, 1, C.capLo);
    } else {
      // Running pose B
      px(spX, spY + 8, 2, 3, C.cap);
      px(spX + 4, spY + 8, 2, 2, C.cap);
      px(spX, spY + 10, 2, 1, C.capLo);
      px(spX + 4, spY + 9, 2, 1, C.capLo);
    }
    // Arms
    if (o.armsUp) {
      // Both arms reaching up (to canopy)
      px(spX - 1, spY + 5, 1, 3, C.body);
      px(spX + 5, spY + 5, 1, 3, C.body);
      // Hands
      px(spX - 1, spY + 4, 1, 1, C.skin);
      px(spX + 5, spY + 4, 1, 1, C.skin);
    } else if (o.armSign) {
      // One arm out forward holding a sign
      px(spX + 5, spY + 5, 1, 2, C.body);
      px(spX + 6, spY + 5, 1, 1, C.skin);
    }
  }

  // ═══ SPRITE: PARACHUTE CANOPY ═══════════════════════════════════════
  // Origin is the top-left of the canopy. Canopy is 18 sprite-px wide,
  // 6 sprite-px tall. openAmt 0→1 scales the canopy as it deploys.
  function drawParachute(spX, spY, openAmt) {
    const w = Math.max(2, Math.round(18 * openAmt));
    const h = Math.max(1, Math.round(6 * openAmt));
    const xOff = spX + Math.round((18 - w) / 2);
    // Canopy shape — wider at top, slight curve
    px(xOff + 2, spY + 0, w - 4, 1, C.chute);
    px(xOff + 1, spY + 1, w - 2, 1, C.chute);
    px(xOff,     spY + 2, w,     1, C.chute);
    if (h >= 4) px(xOff, spY + 3, w, 1, C.chute);
    if (h >= 5) px(xOff, spY + 4, w, 1, C.chuteLo);
    // Pinch creases
    if (w >= 8) {
      px(xOff + Math.floor(w / 3),       spY + 0, 1, h, C.chuteLo);
      px(xOff + Math.floor((w * 2) / 3), spY + 0, 1, h, C.chuteLo);
    }
    // Outline dots at corners
    px(xOff + 2, spY + 0, 1, 1, C.chuteEdge);
    px(xOff + w - 3, spY + 0, 1, 1, C.chuteEdge);
    px(xOff, spY + 2, 1, 1, C.chuteEdge);
    px(xOff + w - 1, spY + 2, 1, 1, C.chuteEdge);
  }

  // ═══ BANNER (existing fly-by banner) ════════════════════════════════
  const bannerCanvas = document.createElement('canvas');
  const bctx = bannerCanvas.getContext('2d');
  let bannerDims = { width: 0, height: 0 };

  function buildBanner() {
    const FONT = 7, PADX = 4, PADY = 3;
    const HSP  = FONT + PADY * 2;

    bctx.font = `${FONT * PS()}px "Press Start 2P", monospace`;
    bctx.textBaseline = 'top';
    const textW   = bctx.measureText(config.text).width;
    const textWSp = Math.ceil(textW / PS());
    const WSP     = textWSp + PADX * 2;

    bannerCanvas.width  = WSP * PS();
    bannerCanvas.height = HSP * PS();
    bctx.imageSmoothingEnabled = false;

    bctx.fillStyle = C.banner;
    bctx.fillRect(0, 0, bannerCanvas.width, bannerCanvas.height);

    bctx.fillStyle = C.bannerLo;
    bctx.fillRect(0, (HSP - 2) * PS(), bannerCanvas.width, 2 * PS());

    bctx.fillStyle = C.bannerEdge;
    bctx.fillRect(0, 0, bannerCanvas.width, PS());
    bctx.fillRect(0, (HSP - 1) * PS(), bannerCanvas.width, PS());
    bctx.fillRect((WSP - 1) * PS(), 0, PS(), HSP * PS());

    const NOTCH = 3;
    bctx.clearRect(0, 0, NOTCH * PS(), HSP * PS());
    for (let i = 0; i < NOTCH; i++) {
      bctx.fillStyle = C.banner;
      bctx.fillRect(i * PS(), i * PS(),       (NOTCH - i + 1) * PS(), PS());
      bctx.fillRect(i * PS(), (HSP - 1 - i) * PS(), (NOTCH - i + 1) * PS(), PS());
      bctx.fillStyle = C.bannerEdge;
      bctx.fillRect(i * PS(), i * PS(),       PS(), PS());
      bctx.fillRect(i * PS(), (HSP - 1 - i) * PS(), PS(), PS());
    }
    bctx.fillStyle = C.banner;
    for (let row = NOTCH + 1; row < HSP - NOTCH - 1; row++) {
      bctx.fillRect(0, row * PS(), NOTCH * PS(), PS());
    }
    bctx.fillStyle = C.bannerEdge;
    for (let i = 0; i < NOTCH; i++) {
      bctx.fillRect(i * PS(), (NOTCH - i) * PS(), PS(), PS());
      bctx.fillRect(i * PS(), (HSP - 1 - NOTCH + i) * PS(), PS(), PS());
    }
    bctx.fillStyle = C.bannerLo;
    bctx.fillRect(0, (HSP - 2) * PS(), NOTCH * PS(), PS());

    bctx.fillStyle = C.bannerText;
    bctx.font = `${FONT * PS()}px "Press Start 2P", monospace`;
    bctx.textBaseline = 'middle';
    bctx.textAlign = 'left';
    bctx.fillText(config.text, PADX * PS(), Math.round(bannerCanvas.height / 2));

    bannerDims = { width: WSP, height: HSP };
  }

  function drawBanner(leftPx, centerY, t) {
    if (!bannerDims.width) return;
    const W = bannerCanvas.width;
    const H = bannerCanvas.height;
    const yTop = centerY - H / 2;
    const ps = PS();

    for (let col = 0; col < W; col += ps) {
      const dist = (W - col) / W;
      const phase1 = t * 0.007 + col * 0.030;
      const phase2 = t * 0.011 + col * 0.060 + 1.3;
      const wave   = Math.sin(phase1) * 0.85 + Math.sin(phase2) * 0.18;
      const amp    = Math.pow(dist, 0.75) * 2.5;
      const offset = Math.round(wave * amp) * ps;
      ctx.drawImage(
        bannerCanvas,
        col, 0, ps, H,
        leftPx + col, yTop + offset, ps, H
      );
    }
  }

  // ═══ SIGN (held by parachuting pilot) ═══════════════════════════════
  // Two-line wooden bulletin board with the recovery message.
  const signCanvas = document.createElement('canvas');
  const sctx = signCanvas.getContext('2d');
  let signDims = { width: 0, height: 0 };

  function buildSign() {
    const FONT = 6;        // smaller than the banner so two lines fit
    const PADX = 4;
    const PADY = 3;
    const LH   = FONT + 2; // line height in sprite px

    sctx.font = `${FONT * PS()}px "Press Start 2P", monospace`;
    sctx.textBaseline = 'top';
    const w1 = sctx.measureText(config.signLine1).width;
    const w2 = sctx.measureText(config.signLine2).width;
    const textWSp = Math.ceil(Math.max(w1, w2) / PS());
    const WSP = textWSp + PADX * 2;
    const HSP = PADY * 2 + LH * 2 - 2;

    signCanvas.width  = WSP * PS();
    signCanvas.height = HSP * PS();
    sctx.imageSmoothingEnabled = false;

    // Wooden frame fills the whole sprite
    sctx.fillStyle = C.wood;
    sctx.fillRect(0, 0, signCanvas.width, signCanvas.height);
    // Cream interior
    sctx.fillStyle = C.banner;
    sctx.fillRect(2 * PS(), 2 * PS(),
                  (WSP - 4) * PS(), (HSP - 4) * PS());
    // Dark inner outline (1 sprite-px ring)
    sctx.fillStyle = C.bannerEdge;
    sctx.fillRect(2 * PS(), 2 * PS(), (WSP - 4) * PS(), PS());
    sctx.fillRect(2 * PS(), (HSP - 3) * PS(), (WSP - 4) * PS(), PS());
    sctx.fillRect(2 * PS(), 2 * PS(), PS(), (HSP - 4) * PS());
    sctx.fillRect((WSP - 3) * PS(), 2 * PS(), PS(), (HSP - 4) * PS());
    // Outer wood shading
    sctx.fillStyle = C.woodLo;
    sctx.fillRect(0, (HSP - 1) * PS(), signCanvas.width, PS());
    sctx.fillRect((WSP - 1) * PS(), 0, PS(), signCanvas.height);

    // Text
    sctx.fillStyle = C.bannerText;
    sctx.font = `${FONT * PS()}px "Press Start 2P", monospace`;
    sctx.textBaseline = 'top';
    sctx.textAlign = 'left';
    sctx.fillText(config.signLine1, PADX * PS(), PADY * PS());
    sctx.fillText(config.signLine2, PADX * PS(), (PADY + LH) * PS());

    signDims = { width: WSP, height: HSP };
  }

  // Draw the sign at canvas pixel position (x, y) = top-left.
  function drawSign(canvasX, canvasY) {
    if (!signDims.width) return;
    ctx.drawImage(signCanvas, Math.round(canvasX), Math.round(canvasY));
  }

  // Build both pre-rendered sprites after the font is ready so the
  // text metrics are accurate.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { buildBanner(); buildSign(); });
  } else {
    buildBanner(); buildSign();
  }

  // ═══ ROPE (between plane tail and trailing banner) ══════════════════
  function drawRope(fromX, fromY, toX, toY, t) {
    const dx = toX - fromX;
    const steps = Math.abs(Math.round(dx / PS()));
    for (let i = 0; i < steps; i++) {
      const u = i / steps;
      const x = fromX + dx * u;
      const sag = Math.sin(t * 0.008 + u * 4) * 1.4 * PS() *
                  (1 - Math.abs(u - 0.5) * 1.6);
      const y = fromY + (toY - fromY) * u + sag;
      pxRaw(x, y, C.rope);
    }
  }

  // ═══ CLICK OVERLAYS ══════════════════════════════════════════════════
  function ensureOverlay(id, isLink) {
    let el = document.getElementById(id);
    if (el) return el;
    el = document.createElement(isLink ? 'a' : 'button');
    el.id = id;
    if (isLink) {
      el.href = `mailto:${config.email}?subject=${encodeURIComponent(config.subject)}`;
    } else {
      el.type = 'button';
    }
    document.body.appendChild(el);
    return el;
  }
  const planeHit = ensureOverlay('flyby-plane-hit', false);
  planeHit.setAttribute('aria-label', 'Click the plane');
  planeHit.title = 'Click me!';

  const signLink = ensureOverlay('flyby-sign-link', true);
  signLink.setAttribute('aria-label', `Email ${config.email}`);
  signLink.title = 'Email me';

  function positionOverlay(el, x, y, w, h) {
    el.style.display = 'block';
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    el.style.width  = Math.round(w) + 'px';
    el.style.height = Math.round(h) + 'px';
  }
  function hideOverlay(el) { el.style.display = 'none'; }

  planeHit.addEventListener('click', (e) => {
    e.preventDefault();
    if (phase === PH.FLYING) enterHit();
  });
  signLink.addEventListener('click', () => {
    // Native mailto: navigation handles itself. Cleanup so the
    // sequence ends gracefully — no further frames.
    cleanup();
  });

  // ═══ STATE / PHASES ══════════════════════════════════════════════════
  const PH = { FLYING: 0, HIT: 1, PARACHUTE: 2, LANDED: 3, RUNNING: 4 };
  let state = { active: false, rafId: 0 };
  let phase = PH.FLYING;
  let phaseStart = 0;
  let animStart = 0;

  // Persistent positions (canvas pixels) shared across phases.
  let planeNoseX = 0, planeY = 0, planeVx = 0, planeVy = 0;
  let pilotX = 0, pilotY = 0, pilotVy = 0;
  // Bookkeeping for landed wave + run.
  let landedStart = 0;

  function enterPhase(p) {
    phase = p;
    phaseStart = performance.now();
  }
  function enterHit() {
    hideOverlay(planeHit);
    // Lock in starting trajectory for the dive.
    planeVx = 1.2 * PS();   // still drifting right
    planeVy = 0.4 * PS();   // starting to fall
    enterPhase(PH.HIT);
  }
  function enterParachute() {
    // Pilot ejects from cockpit position. Plane has tilted, so the
    // pilot pops out roughly at the cockpit and starts drifting down.
    pilotX = planeNoseX - 17 * PS();
    pilotY = planeY - 4 * PS();
    pilotVy = 0.5 * PS();
    enterPhase(PH.PARACHUTE);
  }
  function enterLanded() {
    landedStart = performance.now();
    enterPhase(PH.LANDED);
  }
  function enterRunning() {
    hideOverlay(signLink);
    enterPhase(PH.RUNNING);
  }

  function cleanup() {
    state.active = false;
    cancelAnimationFrame(state.rafId);
    hideOverlay(planeHit);
    hideOverlay(signLink);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // ─── PHASE TICKS ─────────────────────────────────────────────────────
  function tickFlying(now) {
    const elapsed  = now - animStart;
    const progress = Math.min(elapsed / config.flyDuration, 1);

    const PLANE_W_SP = 34;
    const planeW   = PLANE_W_SP * PS();
    const bannerW  = bannerCanvas.width;
    const ropeLen  = 8 * PS();
    const chainLen = planeW + ropeLen + bannerW;
    const buffer   = 40;
    const startNoseX = -buffer;
    const endNoseX   = canvas.width + chainLen + buffer;
    const noseX = startNoseX + (endNoseX - startNoseX) * progress;

    const bob = Math.sin(now * 0.0025) * config.bobAmount * PS();
    const planeTopY = canvas.height / 2 - 8 * PS() + bob;

    planeNoseX = noseX;
    planeY     = planeTopY;

    const planeOX = (noseX - planeW) / PS();
    const planeOY = planeTopY / PS();
    const propFrame = Math.floor(now / 40) % 3;

    const planeTailX   = noseX - planeW + 2 * PS();
    const bannerRightX = planeTailX - ropeLen;
    const bannerLeftX  = bannerRightX - bannerW;
    const bannerCY     = planeTopY + 9 * PS();
    drawBanner(bannerLeftX, bannerCY, now);
    drawRope(bannerRightX, bannerCY, planeTailX, planeTopY + 9 * PS(), now);
    drawPlane(planeOX, planeOY, propFrame, now, true);

    // Click target — only while the plane body is on-screen.
    if (noseX - planeW < canvas.width && noseX > 0) {
      positionOverlay(planeHit,
        noseX - planeW, planeTopY,
        planeW, 16 * PS());
    } else {
      hideOverlay(planeHit);
    }

    if (progress >= 1) cleanup();
  }

  function tickHit(now) {
    const elapsed  = now - phaseStart;
    const duration = 700;
    const t = Math.min(elapsed / duration, 1);

    // Apply gravity-ish acceleration to fall velocity.
    planeVy += 0.05 * PS();
    planeNoseX += planeVx;
    planeY     += planeVy;

    // Tilt nose-down. canvas.rotate around the plane's center.
    const PLANE_W_SP = 34;
    const planeW = PLANE_W_SP * PS();
    const planeH = 16 * PS();
    const tilt = t * (Math.PI / 5);   // ~36°

    ctx.save();
    ctx.translate(planeNoseX - planeW / 2, planeY + planeH / 2);
    ctx.rotate(tilt);
    ctx.translate(-(planeNoseX - planeW / 2), -(planeY + planeH / 2));
    const planeOX = (planeNoseX - planeW) / PS();
    const planeOY = planeY / PS();
    drawPlane(planeOX, planeOY, 0, now, false);
    ctx.restore();

    // Pop pilot upward visually a frame before parachute opens so the
    // ejection reads. We draw the pilot floating above the plane.
    const popY = planeY - (3 + t * 6) * PS();
    drawPilot((planeNoseX - 18 * PS()) / PS(), popY / PS(), {
      t: now, scarfDir: -1, armsUp: t > 0.3,
    });

    if (t >= 1) enterParachute();
  }

  function tickParachute(now) {
    const elapsed = now - phaseStart;
    // Parachute opens fully over first 350ms.
    const openAmt = Math.min(elapsed / 350, 1);
    // Steady downward drift after canopy opens.
    if (openAmt < 1) {
      pilotVy *= 0.92;                 // canopy slows them down
    } else {
      pilotVy = 0.7 * PS();
    }
    pilotY += pilotVy;
    // Gentle sway as they drift.
    const sway = Math.sin(now * 0.0018) * 1.5 * PS();
    pilotX += Math.cos(now * 0.0018) * 0.15 * PS();

    // Plane continues to fall off-screen behind them.
    planeVy += 0.06 * PS();
    planeNoseX += planeVx;
    planeY     += planeVy;
    if (planeY < canvas.height + 60) {
      const PLANE_W_SP = 34;
      const planeW = PLANE_W_SP * PS();
      const planeH = 16 * PS();
      ctx.save();
      ctx.translate(planeNoseX - planeW / 2, planeY + planeH / 2);
      ctx.rotate(Math.PI / 4);
      ctx.translate(-(planeNoseX - planeW / 2), -(planeY + planeH / 2));
      drawPlane((planeNoseX - planeW) / PS(), planeY / PS(), 0, now, false);
      ctx.restore();
    }

    // Position of the pilot we just settled on, with sway applied.
    const pX = pilotX + sway;
    const pY = pilotY;

    // Parachute sits above the pilot.
    const canopyW = 18;
    const canopySpX = (pX / PS()) - (canopyW - 5) / 2;
    const canopySpY = (pY / PS()) - 8;
    drawParachute(canopySpX, canopySpY, openAmt);
    // Cords connect canopy bottom to pilot's head corners.
    const cordY1 = canopySpY + 5;
    const headY  = pY / PS();
    spriteLine(canopySpX + 1,  cordY1, (pX / PS()) - 1, headY, C.cord);
    spriteLine(canopySpX + 5,  cordY1, (pX / PS()) + 1, headY, C.cord);
    spriteLine(canopySpX + 12, cordY1, (pX / PS()) + 3, headY, C.cord);
    spriteLine(canopySpX + 16, cordY1, (pX / PS()) + 5, headY, C.cord);

    // Pilot
    drawPilot(pX / PS(), pY / PS(), { t: now, scarfDir: -1, armSign: true });

    // Sign in front (right of pilot's arm).
    const signCanvasX = pX + 6 * PS();
    const signCanvasY = pY + 5 * PS();
    drawSign(signCanvasX, signCanvasY);

    // Sign click target overlay tracks the sign.
    positionOverlay(signLink,
      signCanvasX, signCanvasY,
      signCanvas.width, signCanvas.height);

    // Ground check — bottom of pilot's feet.
    const groundY = canvas.height - 14 * PS();
    if (pY + 11 * PS() >= groundY) {
      pilotY = groundY - 11 * PS();
      hideOverlay(signLink);
      enterLanded();
    }
  }

  function tickLanded(now) {
    const elapsed = now - phaseStart;
    const duration = 1100;
    // Pilot stands on ground; sign waved once (raise and lower).
    const pX = pilotX;
    const pY = pilotY;

    // Wave: lift sign upward, hold, return.
    let lift = 0;
    if (elapsed < 300) {
      lift = (elapsed / 300) * 6 * PS();           // raise
    } else if (elapsed < 700) {
      lift = 6 * PS();                              // hold at top
    } else {
      lift = (1 - (elapsed - 700) / 400) * 6 * PS();// lower
    }

    // Pilot — both arms up briefly while waving the sign.
    drawPilot(pX / PS(), pY / PS(), { t: now, scarfDir: -1, armsUp: elapsed < 800 });

    // Sign raised above head while waving.
    const signCanvasX = pX + 6 * PS() - lift * 0.3;
    const signCanvasY = pY + 5 * PS() - lift;
    drawSign(signCanvasX, signCanvasY);

    if (elapsed >= duration) enterRunning();
  }

  function tickRunning(now) {
    const elapsed = now - phaseStart;
    const speed = 2.6 * PS();
    pilotX += speed;

    const pX = pilotX;
    const pY = pilotY;

    // 2-frame leg cycle every ~140ms.
    const legFrame = (Math.floor(now / 140) % 2) ? 1 : 2;
    drawPilot(pX / PS(), pY / PS(), { t: now, scarfDir: -1, legFrame, armsUp: false });

    if (pX > canvas.width + 40) cleanup();
  }

  // ─── MAIN LOOP ───────────────────────────────────────────────────────
  function frame(now) {
    if (!state.active) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (phase) {
      case PH.FLYING:    tickFlying(now);    break;
      case PH.HIT:       tickHit(now);       break;
      case PH.PARACHUTE: tickParachute(now); break;
      case PH.LANDED:    tickLanded(now);    break;
      case PH.RUNNING:   tickRunning(now);   break;
    }

    state.rafId = requestAnimationFrame(frame);
  }

  // ─── TRIGGER ─────────────────────────────────────────────────────────
  // playGated() respects localStorage — used by the scroll auto-trigger.
  // show() always plays — for manual devtools / external calls.
  function playGated() {
    if (config.playOnce && localStorage.getItem(config.storageKey) === '1') return;
    if (config.playOnce) localStorage.setItem(config.storageKey, '1');
    startSequence();
  }
  function show() {
    startSequence();
  }
  function startSequence() {
    cancelAnimationFrame(state.rafId);
    cleanup();
    state.active = true;
    phase = PH.FLYING;
    animStart = performance.now();
    state.rafId = requestAnimationFrame(frame);
  }
  function reset() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('flyby-shown-'))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }

  // ═══ AUTO-INIT (desktop only) ════════════════════════════════════════
  if (window.innerWidth >= 768) {
    let activeMs = 0;
    let lastTick = performance.now();
    let visible  = !document.hidden;
    let idle     = false;
    let idleTimer = null;
    let triggered = false;

    function loop(now) {
      if (visible && !idle) activeMs += now - lastTick;
      lastTick = now;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', () => {
      visible = !document.hidden;
      lastTick = performance.now();
    });

    function resetIdle() {
      idle = false;
      lastTick = performance.now();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { idle = true; }, 30000);
    }
    ['scroll', 'mousemove', 'touchstart', 'keydown'].forEach(evt => {
      window.addEventListener(evt, resetIdle, { passive: true });
    });
    resetIdle();

    function checkTrigger() {
      if (triggered) return;
      if (config.playOnce && localStorage.getItem(config.storageKey) === '1') {
        triggered = true;
        return;
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? window.scrollY / max : 0;
      if (pct >= 0.25 && activeMs >= 5000) {
        triggered = true;
        playGated();
      }
    }
    window.addEventListener('scroll', checkTrigger, { passive: true });
  }

  return {
    show,
    reset,
    setText: (t) => { config.text = t; buildBanner(); },
    config,
  };
})();
