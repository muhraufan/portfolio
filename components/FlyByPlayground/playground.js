/* ════════════════════════════════════════════════════════════════════
   FLY-BY PLAYGROUND
   Self-contained customizer for the Fly-By easter egg. Standalone from
   the live /components/FlyBy/ used on the portfolio — playground edits
   should never risk regressing the real one.

   Architecture
     PALETTES      — 5 named color presets, fed into every draw call
     VEHICLES      — registry { id, label, width, height, draw(...) }
     buildBanner   — pre-renders a wavy banner sprite for a given text+palette
     fly()         — runs one cross-screen flight on a target canvas
     flyInPlace()  — loops a vehicle on a small canvas (used by cards)
     Page logic    — controls, URL sync, mini cards, share button

   NOTE: 4 of the 5 vehicles (ufo/cow, dragon, goose, pig) are
   first-pass placeholder sprites. The plane is fully ported from
   the live FlyBy. We'll iterate on the rest visually.
   ════════════════════════════════════════════════════════════════════ */

(function () {

  // ─── PALETTES ──────────────────────────────────────────────────────
  const PALETTES = {
    red: {
      label: 'Red',
      swatch: ['#d04848', '#f0c850', '#f7f2ea'],
      bodyHi: '#f07060', body: '#d04848', bodyLo: '#902828',
      wing:   '#f0c850', wingLo: '#b08828',
      banner: '#f7f2ea', bannerLo:'#dcd4c4', bannerEdge:'#1a1a1a', bannerText:'#1a1a1a',
    },
    navy: {
      label: 'Navy',
      swatch: ['#2a4a7a', '#f0c850', '#f7f2ea'],
      bodyHi: '#4a6a9a', body: '#2a4a7a', bodyLo: '#162a4a',
      wing:   '#e8d878', wingLo: '#a89030',
      banner: '#f7f2ea', bannerLo:'#dcd4c4', bannerEdge:'#1a1a1a', bannerText:'#1a1a1a',
    },
    mint: {
      label: 'Mint',
      swatch: ['#58b09a', '#f8e8a0', '#f7f2ea'],
      bodyHi: '#80c8b4', body: '#58b09a', bodyLo: '#2a6858',
      wing:   '#f8e8a0', wingLo: '#b8a050',
      banner: '#f7f2ea', bannerLo:'#dcd4c4', bannerEdge:'#1a1a1a', bannerText:'#1a1a1a',
    },
    sunset: {
      label: 'Sunset',
      swatch: ['#e87850', '#f4b878', '#3a2848'],
      bodyHi: '#f49870', body: '#e87850', bodyLo: '#a04028',
      wing:   '#f4b878', wingLo: '#b07840',
      banner: '#fde8d0', bannerLo:'#e8c8a0', bannerEdge:'#3a2848', bannerText:'#3a2848',
    },
    mono: {
      label: 'Mono',
      swatch: ['#2a2a2a', '#a0a0a0', '#f0f0f0'],
      bodyHi: '#5a5a5a', body: '#2a2a2a', bodyLo: '#0a0a0a',
      wing:   '#a0a0a0', wingLo: '#606060',
      banner: '#f0f0f0', bannerLo:'#c8c8c8', bannerEdge:'#1a1a1a', bannerText:'#1a1a1a',
    },
  };

  // Shared accents — same across palettes for now (pilot skin, cockpit, etc).
  // Each palette spreads on top of this base.
  const BASE = {
    nose: '#1a1a1a',
    cockpit:'#0e1a2a', glass: '#9ec8e0',
    skin:   '#f4cc94', skinLo:'#c89868',
    cap:    '#5a3010', capLo: '#2a1808',
    goggleF:'#1a1a1a', goggleG:'#a8d0e8', goggleHi:'#ffffff',
    scarf:  '#f0eee0', scarfLo:'#b8b6a8',
    mouth:  '#a02020',
    prop:   'rgba(40,40,40,0.32)', propEdge:'rgba(80,80,80,0.55)',
    propHub:'#1a1a1a',
    rope:   '#5a4028',
    // ──────────────────────────────────────────────────────────────
    // OPTION B: each vehicle keeps its IDENTITY colors below, and the
    // palette is applied as a small ACCENT on each vehicle (UFO dome,
    // dragon body, goose bandana, pig saddle, plane body). That way
    // a mint goose still reads as a goose with a mint bandana — not
    // a mint creature.
    // ──────────────────────────────────────────────────────────────
    // UFO saucer — metallic grey (alien tech). Dome takes palette.
    ufoBody: '#9ea8b4', ufoLo: '#5a6878', ufoHi: '#d4dce4',
    ufoLight: '#fde880', ufoLightDim: '#a89040',
    ufoBeam: 'rgba(168, 208, 232, 0.42)',
    // Cow — black & white, always.
    cowWhite: '#f8f4ec', cowSpot: '#1a1a1a', cowPink: '#f4a8a8',
    // Dragon — body takes palette (it's a fantasy creature, no
    // real-world referent). Belly + horns cream, tongue red stay.
    dragonBelly: '#f4e8c8', dragonHorn: '#f0e0c0', dragonTongue: '#e84858',
    // Goose — always white. Beak orange + dark eye stay as ID.
    gooseWhite: '#f8f4ec', gooseShadow: '#d8d0b8',
    gooseBeak: '#f49830', gooseBeakLo: '#a05818',
    gooseFoot: '#f49830',
    gooseEye: '#1a1a1a', gooseEyeWhite: '#ffffff',
    // Pig — always pink. Snout darker pink + hooves dark stay.
    pig: '#e898a4', pigHi: '#f8c0c8', pigLo: '#a85868',
    pigSnout: '#d87888', pigHoof: '#1a1a1a',
    feather: '#f8f4ec', featherLo: '#d8d0b8',
  };

  function getColors(palette) {
    return Object.assign({}, BASE, palette);
  }

  // ─── CANVAS HELPERS ────────────────────────────────────────────────
  // Sprite-pixel drawing: each sprite-pixel is rendered as a PSxPS
  // square. ctx must already have imageSmoothingEnabled=false.
  function makePx(ctx, ps) {
    return function (x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x * ps), Math.round(y * ps), w * ps, h * ps);
    };
  }

  // ═══ PLANE SPRITE (ported from /components/FlyBy/flyby.js) ═════════
  // Origin (ox, oy) is top-left of the plane in sprite-pixel coords.
  // Plane bounding box: 34 wide × 16 tall (sprite-px). Pilot head pokes
  // up to y=0; wing extends down to y=15.
  function drawPlane(ctx, ps, ox, oy, t, palette, opts) {
    const C = getColors(palette);
    const px = makePx(ctx, ps);
    const propSpinning = opts && opts.propSpinning !== false;
    const propFrame = Math.floor(t / 40) % 3;
    const p = (x, y, w, h, c) => px(ox + x, oy + y, w, h, c);

    // PROPELLER
    const pX = 30;
    p(pX, 8, 2, 3, C.propHub);
    if (!propSpinning) {
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

    // Waving hand
    const hb = Math.floor(t * 0.006) % 2;
    p(22, 1 - hb, 1, 1, C.skin);
    p(23, 0 - hb, 1, 1, C.skin);
  }

  // ═══ UFO + ABDUCTED COW ════════════════════════════════════════════
  // Bounding box: 28 wide × 22 tall.
  //   rows 0–3   dome
  //   rows 4–7   saucer (brim, lights)
  //   rows 8–21  beam (translucent trapezoid)
  //   rows 14–21 cow (centered inside beam, sways gently)
  // The cow is the joke — head + snout + tail + 4 dangling legs.
  function drawUfo(ctx, ps, ox, oy, t, palette) {
    const C = getColors(palette);
    const px = makePx(ctx, ps);
    const p = (x, y, w, h, c) => px(ox + x, oy + y, w, h, c);

    // ─── BEAM (drawn first so the cow and saucer sit on top) ──────
    ctx.fillStyle = C.ufoBeam;
    ctx.beginPath();
    ctx.moveTo((ox + 10) * ps, (oy + 8) * ps);
    ctx.lineTo((ox + 18) * ps, (oy + 8) * ps);
    ctx.lineTo((ox + 23) * ps, (oy + 22) * ps);
    ctx.lineTo((ox + 5) * ps, (oy + 22) * ps);
    ctx.closePath();
    ctx.fill();

    // ─── DOME (palette accent — this is the UFO's "color light") ──
    p(13, 0, 2, 1, C.body);     // peak
    p(12, 1, 4, 1, C.body);
    p(11, 2, 6, 1, C.body);
    p(10, 3, 8, 1, C.body);
    // Top-left highlight, right shadow — bubble dimension.
    p(12, 1, 1, 1, C.bodyHi);
    p(11, 2, 2, 1, C.bodyHi);
    p(15, 1, 1, 1, C.bodyLo);
    p(16, 2, 1, 1, C.bodyLo);
    p(17, 3, 1, 1, C.bodyLo);

    // ─── SAUCER (metallic, palette-independent) ──────────────────
    p(6, 4, 16, 1, C.ufoHi);    // bright stripe where dome meets body
    p(2, 5, 24, 1, C.ufoBody);  // widest brim
    p(2, 5, 1, 1, C.ufoLo);     // dark left tip of brim
    p(25, 5, 1, 1, C.ufoLo);    // dark right tip
    p(4, 6, 20, 1, C.ufoLo);    // underside band (lights overdrawn)
    p(8, 7, 14, 1, C.ufoLo);    // narrower bottom narrowing to beam

    // Blinking lights along the underside — phase shifts per light so
    // they appear to chase rather than all blinking together.
    const phase = Math.floor(t / 240);
    for (let i = 0; i < 5; i++) {
      const on = ((phase + i) % 2) === 0;
      p(5 + i * 4, 6, 2, 1, on ? C.ufoLight : C.ufoLightDim);
    }

    // ─── COW (centered in beam, slight sway) ──────────────────────
    const sway = Math.round(Math.sin(t * 0.003) * 0.6);
    const cx = 9 + sway;
    const cy = 14;

    // Body
    p(cx, cy + 1, 6, 4, C.cowWhite);
    p(cx, cy + 4, 6, 1, BASE.cap);          // belly shadow line

    // Head (sticks out to the right of the body)
    p(cx + 5, cy, 4, 4, C.cowWhite);
    p(cx + 5, cy + 4, 4, 1, BASE.cap);      // chin shadow
    // Snout (pink) — two pixels suggesting nostrils
    p(cx + 7, cy + 2, 2, 1, C.cowPink);
    // Resigned eye — single dark pixel
    p(cx + 6, cy + 1, 1, 1, C.cowSpot);
    // Ear + horn nubs
    p(cx + 5, cy, 1, 1, BASE.cap);
    p(cx + 8, cy, 1, 1, BASE.cap);

    // Tail (left side, drooping with a dark tip)
    p(cx - 1, cy + 1, 1, 2, C.cowWhite);
    p(cx - 1, cy + 3, 1, 1, C.cowSpot);

    // Black spots on body — the cow has to read as a dairy cow
    p(cx + 1, cy + 2, 2, 2, C.cowSpot);
    p(cx + 4, cy + 3, 1, 1, C.cowSpot);

    // 4 dangling legs at varied lengths — sells "limp / being lifted"
    p(cx + 1, cy + 5, 1, 2, BASE.cap);
    p(cx + 3, cy + 5, 1, 3, BASE.cap);
    p(cx + 5, cy + 5, 1, 2, BASE.cap);
    p(cx + 7, cy + 5, 1, 3, BASE.cap);
  }

  // ═══ DRAGON (placeholder — needs iteration) ════════════════════════
  // Bounding box: 26 wide × 16 tall. Derpy small dragon, wings flap.
  function drawDragon(ctx, ps, ox, oy, t, palette) {
    const C = getColors(palette);
    const px = makePx(ctx, ps);
    const p = (x, y, w, h, c) => px(ox + x, oy + y, w, h, c);

    // Wing flap state (0 = up, 1 = mid, 2 = down)
    const wf = Math.floor(t / 180) % 3;

    // Tail
    p(0, 10, 4, 1, C.body);
    p(1, 9, 3, 2, C.bodyLo);
    p(4, 9, 3, 3, C.body);

    // Body
    p(6, 7, 10, 5, C.body);
    p(6, 6, 10, 1, C.bodyHi);
    p(6, 11, 10, 1, C.bodyLo);
    // Belly
    p(7, 10, 8, 1, C.dragonBelly);

    // Head (right side, slightly larger)
    p(16, 5, 6, 6, C.body);
    p(16, 4, 6, 1, C.bodyHi);
    p(16, 11, 6, 1, C.bodyLo);
    // Horns
    p(17, 3, 1, 1, C.dragonHorn);
    p(20, 3, 1, 1, C.dragonHorn);
    // Eye (derpy — one big, looking up)
    p(18, 6, 1, 1, '#ffffff');
    p(19, 6, 1, 1, BASE.cap);
    // Tongue lolling out
    p(22, 8, 2, 1, C.dragonTongue);
    p(23, 9, 1, 1, C.dragonTongue);
    // Snout shadow
    p(20, 8, 2, 1, C.bodyLo);

    // Legs
    p(7, 12, 2, 2, C.bodyLo);
    p(13, 12, 2, 2, C.bodyLo);

    // WINGS (flap)
    if (wf === 0) {
      // Wings up
      p(7, 2, 2, 5, C.body);
      p(9, 1, 2, 5, C.body);
      p(11, 2, 2, 5, C.body);
      p(7, 2, 6, 1, C.bodyHi);
    } else if (wf === 1) {
      // Wings mid
      p(6, 5, 8, 2, C.body);
      p(6, 5, 8, 1, C.bodyHi);
    } else {
      // Wings down
      p(7, 6, 2, 4, C.bodyLo);
      p(9, 7, 2, 4, C.bodyLo);
      p(11, 6, 2, 4, C.bodyLo);
    }
  }

  // ═══ GOOSE (placeholder — needs iteration) ═════════════════════════
  // Bounding box: 22 wide × 14 tall. Single furious goose, eye contact.
  function drawGoose(ctx, ps, ox, oy, t, palette) {
    const C = getColors(palette);
    const px = makePx(ctx, ps);
    const p = (x, y, w, h, c) => px(ox + x, oy + y, w, h, c);

    const wf = Math.floor(t / 160) % 2;
    const blink = Math.floor(t / 1800) % 12 === 0;

    // Body — white (goose identity)
    p(4, 6, 12, 5, C.gooseWhite);
    p(5, 5, 10, 1, C.gooseWhite);
    p(5, 11, 10, 1, C.gooseShadow);
    p(4, 6, 1, 4, C.gooseShadow);
    // Tail tuft
    p(3, 7, 1, 2, C.gooseWhite);

    // Long neck angled up
    p(13, 4, 2, 3, C.gooseWhite);
    p(14, 2, 2, 3, C.gooseWhite);
    p(15, 1, 2, 3, C.gooseWhite);

    // Head
    p(15, 0, 4, 3, C.gooseWhite);
    p(16, 0, 3, 1, C.gooseShadow);

    // Bandana around neck base — PALETTE ACCENT
    p(12, 4, 4, 1, C.body);
    p(12, 5, 1, 1, C.bodyLo);     // small knot tail dangling at left

    // Beak (orange — identity feature, palette-independent)
    p(19, 1, 2, 2, C.gooseBeak);
    p(20, 2, 1, 1, C.gooseBeakLo);

    // Eye — furious, staring forward at viewer
    if (!blink) {
      p(17, 1, 1, 1, C.gooseEye);
    }

    // Wings (flap) — white feathers
    if (wf === 0) {
      p(7, 4, 6, 3, C.gooseShadow);
      p(7, 4, 6, 1, C.gooseWhite);
    } else {
      p(7, 7, 6, 3, C.gooseShadow);
      p(7, 7, 6, 1, C.gooseWhite);
    }

    // Feet dangling
    p(7, 11, 1, 2, C.gooseFoot);
    p(11, 11, 1, 2, C.gooseFoot);
  }

  // ═══ PIG (placeholder — needs iteration) ═══════════════════════════
  // Bounding box: 22 wide × 16 tall. Flying pig with wings, confused face.
  function drawPig(ctx, ps, ox, oy, t, palette) {
    const C = getColors(palette);
    const px = makePx(ctx, ps);
    const p = (x, y, w, h, c) => px(ox + x, oy + y, w, h, c);

    const wf = Math.floor(t / 140) % 2;
    const earBounce = Math.round(Math.sin(t * 0.01) * 0.5);

    // Body — pink (pig identity)
    p(4, 7, 12, 6, C.pig);
    p(5, 6, 10, 1, C.pigHi);
    p(5, 13, 10, 1, C.pigLo);
    p(4, 7, 1, 5, C.pigLo);

    // Head (right side, round)
    p(14, 6, 6, 6, C.pig);
    p(14, 5, 6, 1, C.pigHi);
    p(14, 12, 6, 1, C.pigLo);

    // Saddle blanket on the back — PALETTE ACCENT
    p(7, 7, 6, 1, C.body);
    p(7, 8, 6, 1, C.bodyLo);

    // Snout (flat, with two nostrils) — pink ID feature
    p(19, 8, 2, 3, C.pigSnout);
    p(20, 9, 1, 1, BASE.cap);
    p(20, 11, 1, 1, BASE.cap);

    // Ears (bouncy)
    p(15, 4 + earBounce, 1, 2, C.pigLo);
    p(18, 4 + earBounce, 1, 2, C.pigLo);

    // Eyes — confused (off-center, small)
    p(16, 7, 1, 1, BASE.cap);
    p(18, 7, 1, 1, BASE.cap);

    // Curly tail
    p(3, 8, 1, 1, C.pigLo);
    p(2, 9, 1, 1, C.pigLo);
    p(3, 10, 1, 1, C.pigLo);

    // Hooves
    p(6, 13, 2, 2, C.pigHoof);
    p(12, 13, 2, 2, C.pigHoof);

    // WINGS — always white feathers ("angel wings" gag stays across
    // all palettes; a mono pig with mono wings would lose the joke).
    if (wf === 0) {
      // Up
      p(6, 3, 2, 4, C.feather);
      p(8, 2, 2, 5, C.feather);
      p(10, 3, 2, 4, C.feather);
      p(6, 3, 6, 1, C.featherLo);
    } else {
      // Down
      p(6, 6, 2, 4, C.feather);
      p(8, 7, 2, 4, C.feather);
      p(10, 6, 2, 4, C.feather);
      p(6, 9, 6, 1, C.featherLo);
    }
  }

  // ─── VEHICLE REGISTRY ──────────────────────────────────────────────
  // width/height are sprite-pixel bounds (used for layout, hit zones).
  // bannerY is the sprite-pixel Y where the banner rope attaches.
  // bannerOffsetX is sprite-pixels to the LEFT of the vehicle's left edge
  // where the banner begins (negative → behind the vehicle).
  const VEHICLES = {
    plane:  { label: 'Plane',  draw: drawPlane,  width: 34, height: 16, bannerY: 9,  trailing: true  },
    ufo:    { label: 'UFO',    draw: drawUfo,    width: 28, height: 22, bannerY: 5,  trailing: true  },
    dragon: { label: 'Dragon', draw: drawDragon, width: 26, height: 16, bannerY: 9,  trailing: true  },
    goose:  { label: 'Goose',  draw: drawGoose,  width: 22, height: 14, bannerY: 8,  trailing: true  },
    pig:    { label: 'Pig',    draw: drawPig,    width: 22, height: 16, bannerY: 10, trailing: true  },
  };

  // ─── BANNER ────────────────────────────────────────────────────────
  // Pre-renders a banner sprite to an offscreen canvas. Rebuilt whenever
  // text, palette, or scale changes.
  function buildBanner(text, palette, ps) {
    const C = getColors(palette);
    const off = document.createElement('canvas');
    const bctx = off.getContext('2d');
    const FONT = 7, PADX = 4, PADY = 3;
    const HSP = FONT + PADY * 2;

    bctx.font = `${FONT * ps}px "Press Start 2P", monospace`;
    bctx.textBaseline = 'top';
    const textW = bctx.measureText(text).width;
    const textWSp = Math.ceil(textW / ps);
    const WSP = textWSp + PADX * 2;

    off.width  = WSP * ps;
    off.height = HSP * ps;
    bctx.imageSmoothingEnabled = false;

    bctx.fillStyle = C.banner;
    bctx.fillRect(0, 0, off.width, off.height);

    bctx.fillStyle = C.bannerLo;
    bctx.fillRect(0, (HSP - 2) * ps, off.width, 2 * ps);

    bctx.fillStyle = C.bannerEdge;
    bctx.fillRect(0, 0, off.width, ps);
    bctx.fillRect(0, (HSP - 1) * ps, off.width, ps);
    bctx.fillRect((WSP - 1) * ps, 0, ps, HSP * ps);

    // Forked-tail notch on the left edge
    const NOTCH = 3;
    bctx.clearRect(0, 0, NOTCH * ps, HSP * ps);
    for (let i = 0; i < NOTCH; i++) {
      bctx.fillStyle = C.banner;
      bctx.fillRect(i * ps, i * ps, (NOTCH - i + 1) * ps, ps);
      bctx.fillRect(i * ps, (HSP - 1 - i) * ps, (NOTCH - i + 1) * ps, ps);
      bctx.fillStyle = C.bannerEdge;
      bctx.fillRect(i * ps, i * ps, ps, ps);
      bctx.fillRect(i * ps, (HSP - 1 - i) * ps, ps, ps);
    }
    bctx.fillStyle = C.banner;
    for (let row = NOTCH + 1; row < HSP - NOTCH - 1; row++) {
      bctx.fillRect(0, row * ps, NOTCH * ps, ps);
    }
    bctx.fillStyle = C.bannerEdge;
    for (let i = 0; i < NOTCH; i++) {
      bctx.fillRect(i * ps, (NOTCH - i) * ps, ps, ps);
      bctx.fillRect(i * ps, (HSP - 1 - NOTCH + i) * ps, ps, ps);
    }
    bctx.fillStyle = C.bannerLo;
    bctx.fillRect(0, (HSP - 2) * ps, NOTCH * ps, ps);

    bctx.fillStyle = C.bannerText;
    bctx.font = `${FONT * ps}px "Press Start 2P", monospace`;
    bctx.textBaseline = 'middle';
    bctx.fillText(text, PADX * ps, Math.round(off.height / 2));

    return { canvas: off, widthSp: WSP, heightSp: HSP };
  }

  function drawBannerOn(ctx, banner, leftPx, centerY, t, ps) {
    const W = banner.canvas.width;
    const H = banner.canvas.height;
    const yTop = centerY - H / 2;
    for (let col = 0; col < W; col += ps) {
      const dist = (W - col) / W;
      const phase1 = t * 0.007 + col * 0.030;
      const phase2 = t * 0.011 + col * 0.060 + 1.3;
      const wave   = Math.sin(phase1) * 0.85 + Math.sin(phase2) * 0.18;
      const amp    = Math.pow(dist, 0.75) * 2.5;
      const offset = Math.round(wave * amp) * ps;
      ctx.drawImage(banner.canvas, col, 0, ps, H, leftPx + col, yTop + offset, ps, H);
    }
  }

  function drawRope(ctx, ps, fromX, fromY, toX, toY, t, color) {
    const dx = toX - fromX;
    const steps = Math.abs(Math.round(dx / ps));
    ctx.fillStyle = color;
    for (let i = 0; i < steps; i++) {
      const u = i / steps;
      const x = fromX + dx * u;
      const sag = Math.sin(t * 0.008 + u * 4) * 1.4 * ps * (1 - Math.abs(u - 0.5) * 1.6);
      const y = fromY + (toY - fromY) * u + sag;
      ctx.fillRect(Math.round(x), Math.round(y), ps, ps);
    }
  }

  // ─── FLY ENGINE (cross-screen, live-config) ────────────────────────
  // Reads from `liveConfig` every frame so control changes are picked
  // up mid-flight — palette flips colors instantly, message rebuilds
  // the banner sprite live, speed changes velocity without resetting
  // position, vehicle swap re-draws in place. Auto-loops with a short
  // breath at the right edge.
  const flightControllers = new WeakMap();

  // Used by both the big preview engine and one-shot mini cards.
  function computeBounds(canvas, vehicle, ps, bannerW) {
    const buffer = 40;
    const vWidth = vehicle.width * ps;
    const ropeLen = 8 * ps;
    const chainLen = vWidth + ropeLen + bannerW;
    return {
      startNoseX: -buffer,
      endNoseX:   canvas.width + chainLen + buffer,
      cruiseY:    canvas.height / 2 - 8 * ps,
      vWidth, ropeLen,
    };
  }

  // Single live-config preview engine for the main canvas.
  let previewEngine = null;

  function startLivePreview(canvas, liveConfig) {
    if (previewEngine) previewEngine.cancel();

    const ctx = canvas.getContext('2d');
    function resizeBacking() {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
      ctx.imageSmoothingEnabled = false;
    }
    resizeBacking();

    const engine = {
      cancelled: false,
      rafId: 0,
      noseX: -40,
      lastFrameTime: performance.now(),
      waitUntil: 0,
      banner: null,
      bannerKey: '',
      resize() { resizeBacking(); },
      restart() { this.noseX = null; this.waitUntil = 0; },  // null → snap to startNoseX on next frame
      cancel() { this.cancelled = true; cancelAnimationFrame(this.rafId); },
    };
    previewEngine = engine;

    function frame(now) {
      if (engine.cancelled) return;
      const dtRaw = now - engine.lastFrameTime;
      // Cap dt so a backgrounded tab doesn't teleport the vehicle
      // forward by half a screen when the user returns.
      const dt = Math.min(dtRaw, 64);
      engine.lastFrameTime = now;

      const ps      = pixelScale();
      const vehicle = VEHICLES[liveConfig.vehicleId] || VEHICLES.plane;
      const palette = PALETTES[liveConfig.paletteId] || PALETTES.red;
      const duration = durationMs();
      const C = getColors(palette);

      // Rebuild banner sprite if any of (text, palette, scale) changed.
      const key = `${liveConfig.text}|${liveConfig.paletteId}|${ps}`;
      if (key !== engine.bannerKey) {
        engine.banner = buildBanner(liveConfig.text || ' ', palette, ps);
        engine.bannerKey = key;
      }

      const b = computeBounds(canvas, vehicle, ps, engine.banner.canvas.width);
      if (engine.noseX === null) engine.noseX = b.startNoseX;

      // Velocity derived from current duration — speed slider takes
      // effect mid-flight without snapping position.
      const velocity = (b.endNoseX - b.startNoseX) / duration;
      engine.noseX += velocity * dt;

      // Loop continuously — when the vehicle exits right, wrap to the
      // start immediately. Previously paused here for a "breath" but
      // that just read as the preview being broken.
      if (engine.noseX > b.endNoseX) {
        engine.noseX = b.startNoseX;
      }

      const bob = Math.sin(now * 0.0025) * 3 * ps;
      const vTopY = b.cruiseY + bob;
      const vehicleLeftX = engine.noseX - b.vWidth;
      const tailX        = vehicleLeftX + 2 * ps;
      const bannerRightX = tailX - b.ropeLen;
      const bannerLeftX  = bannerRightX - engine.banner.canvas.width;
      const bannerCY     = vTopY + vehicle.bannerY * ps;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBannerOn(ctx, engine.banner, bannerLeftX, bannerCY, now, ps);
      drawRope(ctx, ps, bannerRightX, bannerCY, tailX, vTopY + vehicle.bannerY * ps, now, C.rope);
      vehicle.draw(ctx, ps, vehicleLeftX / ps, vTopY / ps, now, palette, { propSpinning: true });

      engine.rafId = requestAnimationFrame(frame);
    }
    engine.rafId = requestAnimationFrame(frame);
  }

  // ─── FLY IN PLACE (for vehicle cards) ──────────────────────────────
  function flyInPlace(canvas, vehicleId, paletteId) {
    const prev = flightControllers.get(canvas);
    if (prev) prev.cancel();

    const ctx = canvas.getContext('2d');
    const vehicle = VEHICLES[vehicleId] || VEHICLES.plane;
    const palette = PALETTES[paletteId] || PALETTES.red;

    const rect = canvas.getBoundingClientRect();
    canvas.width  = Math.round(rect.width);
    canvas.height = Math.round(rect.height);
    ctx.imageSmoothingEnabled = false;

    // Fit vehicle nicely in the card. Compute the largest integer ps
    // such that the vehicle fits with a little padding.
    const padding = 8;
    const maxPs = Math.max(1, Math.floor(Math.min(
      (canvas.width  - padding * 2) / vehicle.width,
      (canvas.height - padding * 2) / vehicle.height
    )));
    const ps = Math.min(maxPs, 2);
    const oxPx = Math.round((canvas.width  - vehicle.width  * ps) / 2);
    const oyPx = Math.round((canvas.height - vehicle.height * ps) / 2);

    const controller = { cancelled: false, rafId: 0, cancel() { this.cancelled = true; cancelAnimationFrame(this.rafId); } };
    flightControllers.set(canvas, controller);

    function frame(now) {
      if (controller.cancelled) return;
      const bob = Math.sin(now * 0.003) * 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      vehicle.draw(ctx, ps, oxPx / ps, (oyPx + bob) / ps, now, palette, { propSpinning: true });
      controller.rafId = requestAnimationFrame(frame);
    }
    controller.rafId = requestAnimationFrame(frame);
  }

  // ═══════════════════════════════════════════════════════════════════
  // PAGE LOGIC
  // ═══════════════════════════════════════════════════════════════════

  // Config state — single source of truth, mirrored to URL.
  // `speed` and `scale` are both 0–9 (10 bar positions). Internally
  // they map to: speed → ms duration (continuous), scale → integer
  // pixel scale 1/2/3 (kept integer so pixel art stays crisp; the
  // bar moves smoothly but rendered size only crosses thresholds).
  const SPEED_MIN_MS = 22000;
  const SPEED_MAX_MS = 5000;
  const config = {
    vehicleId: 'plane',
    text: "You won't regret hiring me",
    paletteId: 'red',
    speed: 4,        // 0–9 bar position
    scale: 4,        // 0–9 bar position
  };
  function durationMs() {
    const t = Math.max(0, Math.min(9, config.speed)) / 9;
    return Math.round(SPEED_MIN_MS + (SPEED_MAX_MS - SPEED_MIN_MS) * t);
  }
  function pixelScale() {
    // 0–3 → 1×, 4–7 → 2×, 8–9 → 3×
    const v = Math.max(0, Math.min(9, config.scale));
    if (v < 4) return 1;
    if (v < 8) return 2;
    return 3;
  }

  // Hydrate from URL on load
  function hydrateFromUrl() {
    const p = new URLSearchParams(location.search);
    if (p.has('v') && VEHICLES[p.get('v')]) config.vehicleId = p.get('v');
    if (p.has('m')) config.text = p.get('m').slice(0, 40);
    if (p.has('p') && PALETTES[p.get('p')]) config.paletteId = p.get('p');
    if (p.has('s')) config.speed = Math.max(0, Math.min(9, parseInt(p.get('s'), 10) || 4));
    if (p.has('sz')) config.scale = Math.max(0, Math.min(9, parseInt(p.get('sz'), 10) || 4));
  }
  function configToUrl() {
    const p = new URLSearchParams();
    p.set('v', config.vehicleId);
    p.set('m', config.text);
    p.set('p', config.paletteId);
    p.set('s', String(config.speed));
    p.set('sz', String(config.scale));
    return `${location.origin}${location.pathname}?${p.toString()}`;
  }
  function syncUrl() {
    const url = configToUrl();
    history.replaceState(null, '', url);
  }

  // ─── DOM refs ──────────────────────────────────────────────────────
  const previewCanvas  = document.getElementById('preview-canvas');
  const vehicleCardsEl = document.getElementById('vehicle-cards');
  const paletteEl      = document.getElementById('palette-swatches');
  const messageInput   = document.getElementById('message-input');
  const speedInput     = document.getElementById('speed-input');
  const speedPill      = document.getElementById('speed-pill');
  const speedDisplay   = document.getElementById('speed-display');
  const sizeInput      = document.getElementById('size-input');
  const sizePill       = document.getElementById('size-pill');
  const sizeDisplay    = document.getElementById('size-display');

  // ─── Pill slider helper ────────────────────────────────────────────
  // Drives a .slider-pill: updates the --fill CSS var and the display
  // text whenever the underlying range input changes. `formatter` gets
  // the current numeric value and returns the string to display.
  function bindPill(input, pill, display, formatter) {
    let lastDisplay = '';
    function refresh() {
      const min = parseFloat(input.min);
      const max = parseFloat(input.max);
      const raw = parseFloat(input.value);
      const pct = max === min ? 50 : ((raw - min) / (max - min)) * 100;
      pill.style.setProperty('--fill', pct + '%');

      if (display) {
        const text = formatter(raw);
        // Skip writes when the snapped value hasn't changed to avoid
        // thrashing the DOM during smooth drag.
        if (text !== lastDisplay) {
          display.textContent = text;
          lastDisplay = text;
        }
      }
    }
    input.addEventListener('input', refresh);
    return refresh;
  }

  // ─── Rubber-band stretch ───────────────────────────────────────────
  // Only fires when the user is actively dragging AND the value is at
  // max AND the cursor is past the pill's right edge. Stretches right
  // (transform-origin: left), with diminishing returns. On release,
  // CSS spring-back animation runs as the inline --stretch is removed.
  function attachRubberBand(pill, input) {
    let dragging = false;
    let pointerId = null;
    let lastStretch = 1;

    function computeStretch(clientX) {
      const max = parseFloat(input.max);
      const val = parseFloat(input.value);
      if (val < max - 0.05) return 1;
      const rect = pill.getBoundingClientRect();
      const overshoot = Math.max(0, clientX - rect.right);
      if (overshoot === 0) return 1;
      // Diminishing returns — capped at +3% stretch.
      return 1 + Math.min(0.03, overshoot / 1800);
    }

    function applyStretch(s) {
      if (s === lastStretch) return;
      pill.style.setProperty('--stretch', String(s));
      lastStretch = s;
    }

    pill.addEventListener('pointerdown', (e) => {
      dragging = true;
      pointerId = e.pointerId;
      pill.classList.add('is-stretching');
      applyStretch(computeStretch(e.clientX));
    });

    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      applyStretch(computeStretch(e.clientX));
    });

    function release() {
      if (!dragging) return;
      dragging = false;
      pointerId = null;
      pill.classList.remove('is-stretching');
      // Removing the inline var lets the CSS default (--stretch: 1)
      // take over — the transition rule animates the spring-back.
      pill.style.removeProperty('--stretch');
      lastStretch = 1;
    }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
  }
  attachRubberBand(speedPill, speedInput);
  attachRubberBand(sizePill,  sizeInput);
  const refreshSpeedPill = bindPill(speedInput, speedPill, speedDisplay, () => {
    return (durationMs() / 1000).toFixed(1) + 's';
  });
  const refreshSizePill = bindPill(sizeInput, sizePill, sizeDisplay, () => {
    return pixelScale() + '×';
  });

  // ─── Build vehicle cards ───────────────────────────────────────────
  const cardCanvases = {}; // id → canvas, for palette refresh
  function buildVehicleCards() {
    vehicleCardsEl.innerHTML = '';
    Object.entries(VEHICLES).forEach(([id, v]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vehicle-card' + (id === config.vehicleId ? ' selected' : '');
      btn.dataset.vehicle = id;

      const cnv = document.createElement('canvas');
      cnv.style.width = '88px';
      cnv.style.height = '72px';
      cnv.width = 88; cnv.height = 72;
      btn.appendChild(cnv);

      const lbl = document.createElement('div');
      lbl.className = 'vehicle-card-label';
      lbl.textContent = v.label;
      btn.appendChild(lbl);

      btn.addEventListener('click', () => {
        config.vehicleId = id;
        document.querySelectorAll('.vehicle-card').forEach(c => c.classList.toggle('selected', c.dataset.vehicle === id));
        syncUrl();
      });

      vehicleCardsEl.appendChild(btn);
      cardCanvases[id] = cnv;
      flyInPlace(cnv, id, config.paletteId);
    });
  }

  function refreshAllCards() {
    Object.entries(cardCanvases).forEach(([id, cnv]) => flyInPlace(cnv, id, config.paletteId));
  }

  // ─── Build palette swatches ────────────────────────────────────────
  function buildPaletteSwatches() {
    paletteEl.innerHTML = '';
    Object.entries(PALETTES).forEach(([id, pal]) => {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'palette-swatch' + (id === config.paletteId ? ' selected' : '');
      sw.dataset.palette = id;
      sw.title = pal.label;
      sw.setAttribute('aria-label', pal.label);
      pal.swatch.forEach(c => {
        const span = document.createElement('span');
        span.style.background = c;
        sw.appendChild(span);
      });
      sw.addEventListener('click', () => {
        config.paletteId = id;
        document.querySelectorAll('.palette-swatch').forEach(s => s.classList.toggle('selected', s.dataset.palette === id));
        syncUrl();
        refreshAllCards();
      });
      paletteEl.appendChild(sw);
    });
  }

  // ─── Wire other inputs ─────────────────────────────────────────────
  // Every handler just mutates `config` — the live engine picks up
  // changes on the next frame. URL sync is debounced for typing so we
  // don't spam history.replaceState on every keystroke.
  let urlSyncDebounce = null;
  function syncUrlSoon() {
    clearTimeout(urlSyncDebounce);
    urlSyncDebounce = setTimeout(syncUrl, 220);
  }

  messageInput.addEventListener('input', () => {
    config.text = messageInput.value;
    syncUrlSoon();
  });
  // Slider step is 0.1 for smooth dragging, but the engine and URL
  // store integer positions only (snap on read).
  speedInput.addEventListener('input', () => {
    config.speed = Math.round(parseFloat(speedInput.value));
    syncUrlSoon();
  });
  sizeInput.addEventListener('input', () => {
    config.scale = Math.round(parseFloat(sizeInput.value));
    syncUrlSoon();
  });

  // ─── Init ──────────────────────────────────────────────────────────
  hydrateFromUrl();
  // Reflect hydrated config into the inputs
  messageInput.value = config.text;
  speedInput.value = String(config.speed);
  sizeInput.value = String(config.scale);
  refreshSpeedPill();
  refreshSizePill();

  // Wait for the pixel font so banner metrics are correct.
  function init() {
    buildVehicleCards();
    buildPaletteSwatches();
    startLivePreview(previewCanvas, config);
    syncUrl();
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(init);
  } else {
    init();
  }

  // Resize the backing buffer in place — the live engine keeps running.
  let resizeDebounce = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(() => {
      if (previewEngine) previewEngine.resize();
    }, 180);
  });

})();
