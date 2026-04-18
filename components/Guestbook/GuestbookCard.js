// ---- GuestbookCard ----
// A horizontal library-card that peeks from a mail slot at the bottom
// of the viewport. Clicking lifts the full card above the slot so the
// visitor can type a name, sign, AND pick the color of the card they
// send — an Arc-browser-style picker with preset swatches + a hand-
// drawn HSL color wheel as an "advanced" option.
//
// The card background + ink color are driven by two CSS custom
// properties set on the .gb-card element:
//   --gb-card-bg   (background hex)
//   --gb-card-ink  (contrast-computed text / stroke hex)
//
// DOM structure:
//
//   .gb-card-slot-wrap          (fixed, bottom center, invisible anchor)
//   ├── .gb-slot                (dark horizontal slit)
//   ├── .gb-card                (the card face, absolute, transforms)
//   │   ├── .gb-card-pattern    (full-card pattern container)
//   │   │   ├── .gb-card-pattern-layer  (active — current SVG)
//   │   │   └── .gb-card-pattern-layer  (inactive — fading in/out)
//   │   ├── .gb-card-header     (label + title, sits above pattern)
//   │   ├── .gb-card-body       (fields row + message + signature)
//   │   │   ├── .gb-card-fields
//   │   │   │   ├── .gb-card-field-name  (label + <input>)
//   │   │   │   └── .gb-card-field-date  (label + today's date)
//   │   │   ├── .gb-card-field-message   (label + <input>, optional note)
//   │   │   └── .gb-card-signature
//   │   │       ├── <canvas>
//   │   │       └── .gb-card-sig-label   ("SIGNATURE")
//   │   └── .gb-card-clear      (inline clear button)
//   └── .gb-card-colors         (color picker, below card, shown when open)
//       ├── .gb-card-colors-label    ("Pick a card color")
//       ├── .gb-card-colors-presets  (◂ [9 swatches] ▸  Custom →)
//       ├── .gb-card-colors-wheel-view  (HSL wheel + lightness + ← Presets)
//       └── .gb-card-patterns        (pattern picker, below color swatches)
//           ├── .gb-card-patterns-label   ("Pick a pattern")
//           └── .gb-card-patterns-row     (5 tiles with live SVG previews)
//
// State classes (on .gb-card-slot-wrap):
//   (default)            — peeking from slot
//   .is-open             — fully lifted, form + picker interactive
//   .is-custom-color     — custom wheel view shown (card lifts more)
//   .has-signature       — canvas has at least one stroke (signing state)
//   .is-sig-locked       — signature locked (✓ clicked) — canvas frozen,
//                          clear/✓ hidden, edit link visible
//   .is-picker-out       — picker has faded out (step 1 of ready flow)
//   .is-pulsed           — card has run its "breath" pulse (step 2)
//   .is-ready            — "Drop to send" hint visible, card draggable
//   .is-dragging         — card is being dragged
//   .is-sending          — post-release send animation running
//   .is-sent             — "Sent. Thanks for stopping by." visible
//   .is-slot-pulse       — one-shot orange pulse on the slot
//
// API:
//   const card = GuestbookCard({ onOpen, onClose, onReady });
//   host.appendChild(card.el);
//   card.open() / .close();
//   card.getEntry();   // { name, drawData, stamp: null, cardColor }
//   card.reset();
//   card.destroy();

import { playReady, playPickup, playDrop, primeAudio } from './sounds.js';

const STYLESHEET_ID = 'gb-stylesheet';
const STYLESHEET_HREF = '/components/Guestbook/guestbook.css?v=4';

function ensureStylesheet() {
  if (document.getElementById(STYLESHEET_ID)) return;
  const link = document.createElement('link');
  link.id = STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = STYLESHEET_HREF;
  document.head.appendChild(link);
}

// ---- Translation helpers ----
const GB_STRINGS = {
  en: {
    tagline:      'Thank you for visiting! -Raufan',
    namePlaceholder:    'Your name',
    messagePlaceholder: 'Leave a short note',
    dropToSend:   'Drop to send',
    pickColor:    'Pick a card color',
    pickPattern:  'Pick a pattern',
    custom:       'Custom \u2192',
  },
  ja: {
    tagline:      '来てくれてありがとう！ -Raufan',
    namePlaceholder:    'お名前（任意）',
    messagePlaceholder: 'ひとことどうぞ',
    dropToSend:   'ここに落として送る',
    pickColor:    'カードの色を選ぶ',
    pickPattern:  '模様を選ぶ',
    custom:       'カスタム \u2192',
  }
};

function gbLang() {
  return document.documentElement.getAttribute('data-lang') || 'en';
}

function gbStr(key) {
  const lang = gbLang();
  return (GB_STRINGS[lang] && GB_STRINGS[lang][key]) || GB_STRINGS.en[key];
}

// ---- Dimensions ----
const CARD_W = 440;

// ---- Signature stroke ----
const STROKE_WIDTH = 1.8;

// ---- Message field limits ----
// Hard cap on the optional message (enforced via maxLength on the
// input). The counter stays hidden until the typed length reaches
// the threshold — then a faint "54/60" fades in next to the input.
const MESSAGE_MAX = 60;
const MESSAGE_COUNTER_THRESHOLD = MESSAGE_MAX - 10;

// ---- Card patterns ----
// 5 tileable SVG <pattern> motifs that fill the entire card background
// behind the content. All drawn with stroke/fill "currentColor" so
// their color is driven by the CSS custom property
// --gb-card-pattern-color (a darker shade of the active card color),
// updated reactively in applyCardColor().
const PATTERN_KEYS = [
  'dash-scatter',
  'dot-grid',
  'ruled',
  'batik-kawung',
  'batik-parang',
];
const DEFAULT_PATTERN = 'dash-scatter';
const PATTERN_LABELS = {
  'dash-scatter': 'Dash',
  'dot-grid': 'Dots',
  ruled: 'Ruled',
  'batik-kawung': 'Kawung',
  'batik-parang': 'Parang',
};

// ---- Color preset palette ----
const PRESET_COLORS = [
  '#C8DDD4', // soft muted sage (default — matches portfolio accent)
  '#3D5A4C', // deep warm forest green
  '#F5E6C8', // cream
  '#E8541A', // orange (matches guestbook theme)
  '#E8A87C', // peach
  '#D4A5A5', // dusty rose
  '#9B8EC4', // lavender
  '#5B8DB8', // slate blue
  '#6BAF92', // sage
  '#4A4A4A', // charcoal
  '#F2C94C', // warm yellow
];
const DEFAULT_CARD_COLOR = '#C8DDD4';

// ================================================================
// Color utilities
// ================================================================

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r, g, b) {
  const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;
  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const hh = h / 360;
  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, hh + 1 / 3);
    g = hue2rgb(p, q, hh);
    b = hue2rgb(p, q, hh - 1 / 3);
  }
  return [r * 255, g * 255, b * 255];
}

function hexToHsl(hex) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function hslToHex(h, s, l) {
  const [r, g, b] = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// Contrast ink — returns cream for dark backgrounds, dark for light.
function contrastInk(hex) {
  const [r, g, b] = hexToRgb(hex);
  // Perceptual luminance (ITU-R BT.601)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#2a2418' : '#f5e6c8';
}

// Blend a hex color toward black by `amount` (0..1). Used to derive
// the pattern color — a darker shade of the current card color.
function darkenHex(hex, amount = 0.38) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

// ---- Card pattern SVG factory ----
// Produces a full-size <svg> whose <rect> is filled by an inline
// <pattern> matching `key`. All strokes/fills use "currentColor" so
// the tile color follows the ancestor's `color` style (which is
// driven by --gb-card-pattern-color). The SVG sizes itself to 100%
// of its container, so dropping it into a fixed-size layer div
// tiles across the whole card automatically.
let patternUidCounter = 0;
function createPatternSVG(key) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('xmlns', NS);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const id = `gb-pat-${key}-${++patternUidCounter}`;
  const defs = document.createElementNS(NS, 'defs');
  const pattern = document.createElementNS(NS, 'pattern');
  pattern.setAttribute('id', id);
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');

  const addLine = (x1, y1, x2, y2, width = 1) => {
    const el = document.createElementNS(NS, 'line');
    el.setAttribute('x1', String(x1));
    el.setAttribute('y1', String(y1));
    el.setAttribute('x2', String(x2));
    el.setAttribute('y2', String(y2));
    el.setAttribute('stroke', 'currentColor');
    el.setAttribute('stroke-width', String(width));
    el.setAttribute('stroke-linecap', 'round');
    pattern.appendChild(el);
  };

  switch (key) {
    case 'dash-scatter': {
      // Short diagonal dashes in a flowing wave grid, ~32x22 tile.
      pattern.setAttribute('width', '32');
      pattern.setAttribute('height', '22');
      addLine(4, 12, 12, 6, 1.5);
      addLine(20, 14, 28, 8, 1.5);
      addLine(14, 2, 22, -2, 1.5);
      addLine(-2, 2, 6, -2, 1.5);
      break;
    }
    case 'dot-grid': {
      // Small circles, ~2px radius, even 24px grid spacing.
      pattern.setAttribute('width', '24');
      pattern.setAttribute('height', '24');
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', '12');
      c.setAttribute('cy', '12');
      c.setAttribute('r', '2');
      c.setAttribute('fill', 'currentColor');
      pattern.appendChild(c);
      break;
    }
    case 'ruled': {
      // Thin horizontal lines, 20px apart, 1px stroke.
      pattern.setAttribute('width', '20');
      pattern.setAttribute('height', '20');
      addLine(0, 10, 20, 10, 1);
      break;
    }
    case 'batik-kawung': {
      // Four ovals arranged symmetrically around a center point,
      // repeating in a ~20x20 grid. Classic Javanese kawung motif.
      pattern.setAttribute('width', '20');
      pattern.setAttribute('height', '20');
      const ellipses = [
        [10, 3, 3, 5],
        [10, 17, 3, 5],
        [3, 10, 5, 3],
        [17, 10, 5, 3],
      ];
      ellipses.forEach(([cx, cy, rx, ry]) => {
        const e = document.createElementNS(NS, 'ellipse');
        e.setAttribute('cx', String(cx));
        e.setAttribute('cy', String(cy));
        e.setAttribute('rx', String(rx));
        e.setAttribute('ry', String(ry));
        e.setAttribute('fill', 'none');
        e.setAttribute('stroke', 'currentColor');
        e.setAttribute('stroke-width', '0.9');
        pattern.appendChild(e);
      });
      break;
    }
    case 'batik-parang': {
      // Diagonal interlocking S-curves in parallel rows at 45deg,
      // ~16px unit width. patternTransform handles the rotation so
      // the path itself stays simple.
      pattern.setAttribute('width', '16');
      pattern.setAttribute('height', '16');
      pattern.setAttribute('patternTransform', 'rotate(-45)');
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M8,0 C4,4 12,12 8,16');
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', 'currentColor');
      p.setAttribute('stroke-width', '1.3');
      p.setAttribute('stroke-linecap', 'round');
      pattern.appendChild(p);
      break;
    }
    default: {
      // Unknown key — fall back to dash-scatter so we never render
      // an empty layer.
      return createPatternSVG('dash-scatter');
    }
  }

  defs.appendChild(pattern);
  svg.appendChild(defs);

  const rect = document.createElementNS(NS, 'rect');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', `url(#${id})`);
  svg.appendChild(rect);

  return svg;
}

// ---- Date formatting ----
function formatIssuedDate(d = new Date()) {
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];
  const day = String(d.getDate()).padStart(2, '0');
  const m = months[d.getMonth()];
  const yr = String(d.getFullYear()).slice(2);
  return `${day} ${m} '${yr}`;
}

// ================================================================
// Hand-drawn HSL wheel (for the "Custom" picker mode)
// ================================================================

function drawHueSaturationWheel(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const rMax = Math.min(cx, cy) - 1;

  const img = ctx.createImageData(w, h);
  const data = img.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * w + x) * 4;
      if (dist > rMax + 1) {
        data[idx + 3] = 0;
        continue;
      }
      const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      const sat = Math.min(1, dist / (rMax - 1));
      const [rr, gg, bb] = hslToRgb(hue, sat, 0.5);
      // Simple edge anti-alias
      const alpha = dist > rMax - 1 ? Math.max(0, (rMax - dist + 1) * 255) : 255;
      data[idx] = rr;
      data[idx + 1] = gg;
      data[idx + 2] = bb;
      data[idx + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function drawLightnessTrack(canvas, hue, sat) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const img = ctx.createImageData(w, h);
  const data = img.data;
  for (let y = 0; y < h; y++) {
    const l = 1 - y / (h - 1);
    const [r, g, b] = hslToRgb(hue, sat, l);
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ================================================================
// Color picker (sub-component, used by GuestbookCard)
// ================================================================

function createColorPicker({ initial = DEFAULT_CARD_COLOR, onChange, onModeChange }) {
  const root = document.createElement('div');
  root.className = 'gb-card-colors';

  // --- Label ---
  const label = document.createElement('div');
  label.className = 'gb-card-colors-label';
  label.textContent = gbStr('pickColor');
  root.appendChild(label);

  // --- Presets view ---
  const presetsView = document.createElement('div');
  presetsView.className = 'gb-card-colors-presets';

  const leftArrow = document.createElement('button');
  leftArrow.type = 'button';
  leftArrow.className = 'gb-card-colors-arrow';
  leftArrow.setAttribute('aria-label', 'Scroll presets left');
  leftArrow.innerHTML = '&#8249;';
  presetsView.appendChild(leftArrow);

  const scroll = document.createElement('div');
  scroll.className = 'gb-card-colors-scroll';
  scroll.setAttribute('role', 'radiogroup');
  scroll.setAttribute('aria-label', 'Card color presets');

  const swatches = PRESET_COLORS.map((color) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gb-card-swatch';
    btn.dataset.color = color;
    btn.style.setProperty('--swatch-color', color);
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-label', `Card color ${color}`);
    btn.setAttribute('aria-checked', 'false');
    scroll.appendChild(btn);
    return btn;
  });
  presetsView.appendChild(scroll);

  const rightArrow = document.createElement('button');
  rightArrow.type = 'button';
  rightArrow.className = 'gb-card-colors-arrow';
  rightArrow.setAttribute('aria-label', 'Scroll presets right');
  rightArrow.innerHTML = '&#8250;';
  presetsView.appendChild(rightArrow);

  root.appendChild(presetsView);

  // "Custom →" link (shown in presets mode)
  const customLink = document.createElement('button');
  customLink.type = 'button';
  customLink.className = 'gb-card-colors-custom-link';
  customLink.textContent = gbStr('custom');
  root.appendChild(customLink);

  // --- Wheel view (hidden initially) ---
  const wheelView = document.createElement('div');
  wheelView.className = 'gb-card-colors-wheel-view';

  const wheelRow = document.createElement('div');
  wheelRow.className = 'gb-card-wheel-row';

  const wheelWrap = document.createElement('div');
  wheelWrap.className = 'gb-card-wheel-wrap';

  const wheelCanvas = document.createElement('canvas');
  wheelCanvas.className = 'gb-card-wheel-canvas';
  wheelCanvas.width = 140;
  wheelCanvas.height = 140;
  wheelWrap.appendChild(wheelCanvas);

  const wheelMarker = document.createElement('div');
  wheelMarker.className = 'gb-card-wheel-marker';
  wheelWrap.appendChild(wheelMarker);
  wheelRow.appendChild(wheelWrap);

  const lightness = document.createElement('div');
  lightness.className = 'gb-card-lightness';

  const lightnessCanvas = document.createElement('canvas');
  lightnessCanvas.className = 'gb-card-lightness-canvas';
  lightnessCanvas.width = 14;
  lightnessCanvas.height = 140;
  lightness.appendChild(lightnessCanvas);

  const lightnessThumb = document.createElement('div');
  lightnessThumb.className = 'gb-card-lightness-thumb';
  lightness.appendChild(lightnessThumb);
  wheelRow.appendChild(lightness);

  wheelView.appendChild(wheelRow);

  const backLink = document.createElement('button');
  backLink.type = 'button';
  backLink.className = 'gb-card-colors-back-link';
  backLink.textContent = '← Presets';
  wheelView.appendChild(backLink);

  root.appendChild(wheelView);

  // ================================================================
  // State
  // ================================================================
  let currentColor = initial;
  let hsl = hexToHsl(currentColor);
  let mode = 'presets'; // 'presets' | 'custom'
  let wheelDrawn = false;

  // ================================================================
  // Rendering helpers
  // ================================================================
  function updateSwatchSelection() {
    let matched = false;
    swatches.forEach((btn) => {
      const isSel =
        !matched &&
        btn.dataset.color.toUpperCase() === currentColor.toUpperCase();
      if (isSel) matched = true;
      btn.classList.toggle('is-selected', isSel);
      btn.setAttribute('aria-checked', String(isSel));
    });
    root.classList.toggle('is-custom-active', !matched);
  }

  function positionWheelMarker() {
    const w = wheelCanvas.width;
    const h = wheelCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const rMax = Math.min(cx, cy) - 1;
    const angle = (hsl.h * Math.PI) / 180;
    const dist = hsl.s * (rMax - 1);
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    wheelMarker.style.left = `${(x / w) * 100}%`;
    wheelMarker.style.top = `${(y / h) * 100}%`;
  }

  function positionLightnessThumb() {
    lightnessThumb.style.top = `${(1 - hsl.l) * 100}%`;
  }

  function ensureWheelRendered() {
    if (!wheelDrawn) {
      drawHueSaturationWheel(wheelCanvas);
      wheelDrawn = true;
    }
    drawLightnessTrack(lightnessCanvas, hsl.h, hsl.s);
    positionWheelMarker();
    positionLightnessThumb();
  }

  function setMode(newMode) {
    if (mode === newMode) return;
    mode = newMode;
    const isCustom = mode === 'custom';
    root.classList.toggle('is-custom', isCustom);
    if (isCustom) {
      // Wait for layout so the canvas has its rendered size.
      requestAnimationFrame(ensureWheelRendered);
    }
    if (typeof onModeChange === 'function') onModeChange(mode);
  }

  // ================================================================
  // Apply color
  // ================================================================
  function applyColor(hex, opts = {}) {
    currentColor = hex;
    if (!opts.keepHsl) hsl = hexToHsl(hex);
    updateSwatchSelection();
    if (mode === 'custom') {
      drawLightnessTrack(lightnessCanvas, hsl.h, hsl.s);
      positionWheelMarker();
      positionLightnessThumb();
    }
    if (typeof onChange === 'function') onChange(currentColor);
  }

  // ================================================================
  // Wheel + lightness drag
  // ================================================================
  let wheelDragging = false;
  let lightDragging = false;

  function handleWheelMove(e) {
    const rect = wheelCanvas.getBoundingClientRect();
    const point = e.touches && e.touches[0] ? e.touches[0] : e;
    const x = point.clientX - rect.left;
    const y = point.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    let dist = Math.sqrt(dx * dx + dy * dy);
    const rMax = Math.min(cx, cy) - 1;
    dist = Math.min(dist, rMax - 1);
    const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const sat = Math.max(0, Math.min(1, dist / (rMax - 1)));
    hsl = { h: hue, s: sat, l: hsl.l };
    applyColor(hslToHex(hsl.h, hsl.s, hsl.l), { keepHsl: true });
  }

  function handleLightMove(e) {
    const rect = lightness.getBoundingClientRect();
    const point = e.touches && e.touches[0] ? e.touches[0] : e;
    const y = point.clientY - rect.top;
    const l = Math.max(0, Math.min(1, 1 - y / rect.height));
    hsl = { h: hsl.h, s: hsl.s, l };
    applyColor(hslToHex(hsl.h, hsl.s, hsl.l), { keepHsl: true });
  }

  function onWheelDown(e) {
    wheelDragging = true;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    handleWheelMove(e);
  }
  function onWheelMove(e) {
    if (!wheelDragging) return;
    if (e.cancelable) e.preventDefault();
    handleWheelMove(e);
  }
  function onWheelUp() {
    wheelDragging = false;
  }

  function onLightDown(e) {
    lightDragging = true;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    handleLightMove(e);
  }
  function onLightMove(e) {
    if (!lightDragging) return;
    if (e.cancelable) e.preventDefault();
    handleLightMove(e);
  }
  function onLightUp() {
    lightDragging = false;
  }

  wheelCanvas.addEventListener('mousedown', onWheelDown);
  wheelCanvas.addEventListener('touchstart', onWheelDown, { passive: false });
  window.addEventListener('mousemove', onWheelMove);
  window.addEventListener('touchmove', onWheelMove, { passive: false });
  window.addEventListener('mouseup', onWheelUp);
  window.addEventListener('touchend', onWheelUp);

  lightness.addEventListener('mousedown', onLightDown);
  lightness.addEventListener('touchstart', onLightDown, { passive: false });
  window.addEventListener('mousemove', onLightMove);
  window.addEventListener('touchmove', onLightMove, { passive: false });
  window.addEventListener('mouseup', onLightUp);
  window.addEventListener('touchend', onLightUp);

  // ================================================================
  // Arrow scroll + swatch clicks + mode toggles
  // ================================================================
  leftArrow.addEventListener('click', (e) => {
    e.stopPropagation();
    scroll.scrollBy({ left: -90, behavior: 'smooth' });
  });
  rightArrow.addEventListener('click', (e) => {
    e.stopPropagation();
    scroll.scrollBy({ left: 90, behavior: 'smooth' });
  });

  swatches.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      applyColor(btn.dataset.color);
    });
    // Avoid bubbling mousedown closing the card.
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
  });

  customLink.addEventListener('click', (e) => {
    e.stopPropagation();
    setMode('custom');
  });
  backLink.addEventListener('click', (e) => {
    e.stopPropagation();
    setMode('presets');
  });

  // Stop mousedown from reaching the document-level close handler.
  root.addEventListener('mousedown', (e) => e.stopPropagation());

  // Initialize selection state.
  applyColor(initial);

  return {
    el: root,
    getColor: () => currentColor,
    setColor: (hex) => applyColor(hex),
    getMode: () => mode,
    setMode,
    destroy() {
      window.removeEventListener('mousemove', onWheelMove);
      window.removeEventListener('touchmove', onWheelMove);
      window.removeEventListener('mouseup', onWheelUp);
      window.removeEventListener('touchend', onWheelUp);
      window.removeEventListener('mousemove', onLightMove);
      window.removeEventListener('touchmove', onLightMove);
      window.removeEventListener('mouseup', onLightUp);
      window.removeEventListener('touchend', onLightUp);
    },
  };
}

// ================================================================
// Pattern picker (sub-component)
// ================================================================
//
// Row of 5 square tiles, each rendering a live SVG preview of its
// pattern. Selected tile grows slightly and gets a dark ring. Each
// tile's color inherits from the pattern color CSS variable via
// `color: currentColor`, so the previews track the active card color
// in real time. Fires `onChange(key)` on selection.

function createPatternPicker({ initial = DEFAULT_PATTERN, onChange } = {}) {
  const root = document.createElement('div');
  root.className = 'gb-card-patterns';

  const label = document.createElement('div');
  label.className = 'gb-card-patterns-label';
  label.textContent = gbStr('pickPattern');
  root.appendChild(label);

  const row = document.createElement('div');
  row.className = 'gb-card-patterns-row';
  row.setAttribute('role', 'radiogroup');
  row.setAttribute('aria-label', 'Card pattern');

  let currentKey = initial;
  const tiles = [];

  PATTERN_KEYS.forEach((key) => {
    const cell = document.createElement('div');
    cell.className = 'gb-card-pattern-cell';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gb-card-pattern-tile';
    btn.dataset.pattern = key;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', key === currentKey ? 'true' : 'false');
    btn.setAttribute('aria-label', `Pattern: ${PATTERN_LABELS[key]}`);
    btn.appendChild(createPatternSVG(key));
    if (key === currentKey) btn.classList.add('is-selected');

    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentKey === key) return;
      currentKey = key;
      tiles.forEach((t) => {
        const matches = t.dataset.pattern === key;
        t.classList.toggle('is-selected', matches);
        t.setAttribute('aria-checked', matches ? 'true' : 'false');
      });
      if (typeof onChange === 'function') onChange(key);
    });

    const cellLabel = document.createElement('span');
    cellLabel.className = 'gb-card-pattern-cell-label';
    cellLabel.textContent = PATTERN_LABELS[key];

    cell.appendChild(btn);
    cell.appendChild(cellLabel);
    row.appendChild(cell);
    tiles.push(btn);
  });

  root.appendChild(row);

  // Stop mousedown from reaching the document-level close handler,
  // so clicks anywhere in the pattern picker don't dismiss the card.
  root.addEventListener('mousedown', (e) => e.stopPropagation());

  return {
    el: root,
    getKey: () => currentKey,
    setKey(key) {
      if (!PATTERN_KEYS.includes(key)) return;
      currentKey = key;
      tiles.forEach((t) => {
        const matches = t.dataset.pattern === key;
        t.classList.toggle('is-selected', matches);
        t.setAttribute('aria-checked', matches ? 'true' : 'false');
      });
    },
    destroy() {
      root.remove();
    },
  };
}

// ================================================================
// GuestbookCard
// ================================================================

/**
 * @param {{
 *   onOpen?: () => void,
 *   onClose?: () => void,
 *   onReady?: (entry: {
 *     name: string,
 *     message: string,
 *     drawData: string|null,
 *     stamp: null,
 *     cardColor: string,
 *     pattern: string,
 *   }) => void,
 * }} [props]
 */
export function GuestbookCard(props = {}) {
  ensureStylesheet();
  const { onOpen, onClose, onReady, onSent } = props;

  // ================================================================
  // DOM
  // ================================================================
  const wrap = document.createElement('div');
  wrap.className = 'gb-card-slot-wrap';

  const slot = document.createElement('div');
  slot.className = 'gb-slot';

  const card = document.createElement('div');
  card.className = 'gb-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', 'Open guest card and sign');

  // Card pattern — two stacked layers so pattern changes can
  // crossfade: the new SVG is mounted into the inactive layer, then
  // the `.is-active` class swaps between them. Both layers inherit
  // their color from `--gb-card-pattern-color` (a darker shade of
  // the active card color, set in applyCardColor).
  const patternWrap = document.createElement('div');
  patternWrap.className = 'gb-card-pattern';
  const patternLayerA = document.createElement('div');
  patternLayerA.className = 'gb-card-pattern-layer';
  const patternLayerB = document.createElement('div');
  patternLayerB.className = 'gb-card-pattern-layer';
  patternWrap.appendChild(patternLayerA);
  patternWrap.appendChild(patternLayerB);
  card.appendChild(patternWrap);

  // Header (overlays pattern)
  const header = document.createElement('div');
  header.className = 'gb-card-header';

  const label = document.createElement('div');
  label.className = 'gb-card-label';
  label.textContent = 'GUEST CARD';

  const title = document.createElement('div');
  title.className = 'gb-card-title';
  title.textContent = gbStr('tagline');

  header.appendChild(label);
  header.appendChild(title);
  card.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'gb-card-body';

  const fields = document.createElement('div');
  fields.className = 'gb-card-fields';

  // NAME
  // Structure:
  //   .gb-card-field-name
  //     .gb-card-field-label
  //     .gb-card-name-row          (input + confirm check, with shared baseline)
  //       input.gb-card-name
  //       button.gb-card-name-confirm
  //     .gb-card-name-display      (shown after confirmation)
  //       span.gb-card-name-printed
  //       button.gb-card-name-edit
  const nameField = document.createElement('div');
  nameField.className = 'gb-card-field gb-card-field-name';
  const nameFieldLabel = document.createElement('div');
  nameFieldLabel.className = 'gb-card-field-label';
  nameFieldLabel.textContent = 'NAME';

  const nameRow = document.createElement('div');
  nameRow.className = 'gb-card-name-row';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'gb-card-name';
  nameInput.placeholder = gbStr('namePlaceholder');
  nameInput.autocomplete = 'off';
  nameInput.spellcheck = false;
  nameInput.maxLength = 40;
  nameInput.setAttribute('aria-label', 'Your name');
  nameInput.tabIndex = -1;

  const nameConfirm = document.createElement('button');
  nameConfirm.type = 'button';
  nameConfirm.className = 'gb-card-name-confirm';
  nameConfirm.setAttribute('aria-label', 'Confirm name');
  nameConfirm.tabIndex = -1;
  nameConfirm.innerHTML =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5 L7 12 L13 4.5" /></svg>';

  nameRow.appendChild(nameInput);
  nameRow.appendChild(nameConfirm);

  const nameDisplay = document.createElement('div');
  nameDisplay.className = 'gb-card-name-display';

  const namePrinted = document.createElement('span');
  namePrinted.className = 'gb-card-name-printed';

  const nameEdit = document.createElement('button');
  nameEdit.type = 'button';
  nameEdit.className = 'gb-card-name-edit';
  nameEdit.textContent = 'edit';
  nameEdit.setAttribute('aria-label', 'Edit name');
  nameEdit.tabIndex = -1;

  nameDisplay.appendChild(namePrinted);
  nameDisplay.appendChild(nameEdit);

  nameField.appendChild(nameFieldLabel);
  nameField.appendChild(nameRow);
  nameField.appendChild(nameDisplay);

  // DATE
  const dateField = document.createElement('div');
  dateField.className = 'gb-card-field gb-card-field-date';
  const dateFieldLabel = document.createElement('div');
  dateFieldLabel.className = 'gb-card-field-label';
  dateFieldLabel.textContent = 'ISSUED';
  const dateValue = document.createElement('div');
  dateValue.className = 'gb-card-date';
  dateValue.textContent = formatIssuedDate();
  dateField.appendChild(dateFieldLabel);
  dateField.appendChild(dateValue);

  fields.appendChild(nameField);
  fields.appendChild(dateField);
  body.appendChild(fields);

  // MESSAGE — optional short note, full-width row under NAME/ISSUED.
  // Owns its own independent lock: a ✓ button inline at the right
  // end of the message row. Clicking locks the message only;
  // clicking "edit" in the confirmed display unlocks the message
  // only. NAME, MESSAGE, and SIGNATURE are three independent locks.
  // Empty messages can still be locked — an empty lock is valid.
  //
  // Structure mirrors NAME:
  //   .gb-card-field-message
  //     .gb-card-field-label                ("MESSAGE")
  //     .gb-card-message-row                (input + ✓ + counter, shared baseline)
  //       input.gb-card-message
  //       button.gb-card-message-confirm
  //       span.gb-card-message-counter      (fades in near the limit)
  //     .gb-card-message-display            (shown in the confirmed state)
  //       span.gb-card-message-printed
  //       button.gb-card-message-edit
  const messageField = document.createElement('div');
  messageField.className = 'gb-card-field gb-card-field-message';

  const messageFieldLabel = document.createElement('div');
  messageFieldLabel.className = 'gb-card-field-label';
  messageFieldLabel.textContent = 'MESSAGE';

  const messageRow = document.createElement('div');
  messageRow.className = 'gb-card-message-row';

  const messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.className = 'gb-card-message';
  messageInput.placeholder = gbStr('messagePlaceholder');
  messageInput.autocomplete = 'off';
  messageInput.spellcheck = false;
  messageInput.maxLength = MESSAGE_MAX;
  messageInput.setAttribute('aria-label', 'Short message (optional)');
  messageInput.tabIndex = -1;

  const messageConfirm = document.createElement('button');
  messageConfirm.type = 'button';
  messageConfirm.className = 'gb-card-message-confirm';
  messageConfirm.setAttribute('aria-label', 'Confirm message');
  messageConfirm.tabIndex = -1;
  messageConfirm.innerHTML =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5 L7 12 L13 4.5" /></svg>';

  const messageCounter = document.createElement('span');
  messageCounter.className = 'gb-card-message-counter';
  messageCounter.setAttribute('aria-live', 'polite');
  messageCounter.textContent = `0/${MESSAGE_MAX}`;

  messageRow.appendChild(messageInput);
  messageRow.appendChild(messageConfirm);
  messageRow.appendChild(messageCounter);

  const messageDisplay = document.createElement('div');
  messageDisplay.className = 'gb-card-message-display';

  const messagePrinted = document.createElement('span');
  messagePrinted.className = 'gb-card-message-printed';

  const messageEdit = document.createElement('button');
  messageEdit.type = 'button';
  messageEdit.className = 'gb-card-message-edit';
  messageEdit.textContent = 'edit';
  messageEdit.setAttribute('aria-label', 'Edit message');
  messageEdit.tabIndex = -1;

  messageDisplay.appendChild(messagePrinted);
  messageDisplay.appendChild(messageEdit);

  messageField.appendChild(messageFieldLabel);
  messageField.appendChild(messageRow);
  messageField.appendChild(messageDisplay);

  body.appendChild(messageField);

  // Signature — label first (sits above the baseline line), then
  // the canvas directly below it. The canvas's border-bottom is the
  // signature line; the drawable stroke area sits above that line.
  const sig = document.createElement('div');
  sig.className = 'gb-card-signature';

  const sigLabel = document.createElement('div');
  sigLabel.className = 'gb-card-sig-label';
  sigLabel.textContent = 'SIGNATURE';
  sig.appendChild(sigLabel);

  const canvas = document.createElement('canvas');
  canvas.className = 'gb-card-canvas';
  canvas.width = CARD_W;
  canvas.height = 80;
  canvas.setAttribute('aria-label', 'Signature canvas — draw to sign');
  sig.appendChild(canvas);

  body.appendChild(sig);
  card.appendChild(body);

  // Clear — lives on the right side of the signature area, just to
  // the left of the signature ✓ (CSS handles the offset). Visible
  // whenever the canvas is open AND has at least one stroke.
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'gb-card-clear';
  clearBtn.textContent = 'Clear';
  clearBtn.setAttribute('aria-label', 'Clear signature');
  clearBtn.tabIndex = -1;
  card.appendChild(clearBtn);

  // Signature ✓ — right edge of the signature area, directly
  // mirroring the name ✓ on the right side of the name row. Minimal
  // small circle with a checkmark, ink-colored. Only active when the
  // canvas has at least one stroke; faded otherwise.
  const sigConfirm = document.createElement('button');
  sigConfirm.type = 'button';
  sigConfirm.className = 'gb-card-sig-confirm';
  sigConfirm.setAttribute('aria-label', 'Confirm signature');
  sigConfirm.tabIndex = -1;
  sigConfirm.innerHTML =
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5 L7 12 L13 4.5" /></svg>';
  card.appendChild(sigConfirm);

  // Signature edit — takes over the ✓'s slot on the right when the
  // signature is locked. Visible only in locked state. Clicking it
  // clears the drawing and returns the signature to signing state.
  const sigEdit = document.createElement('button');
  sigEdit.type = 'button';
  sigEdit.className = 'gb-card-sig-edit';
  sigEdit.textContent = 'edit';
  sigEdit.setAttribute('aria-label', 'Edit signature');
  sigEdit.tabIndex = -1;
  card.appendChild(sigEdit);

  // Dismiss group — wraps card + color picker so they can be animated
  // as one unit during dismiss (translateY on a single parent).
  const dismissGroup = document.createElement('div');
  dismissGroup.className = 'gb-dismiss-group';

  wrap.appendChild(slot);
  dismissGroup.appendChild(card);
  wrap.appendChild(dismissGroup);

  // ================================================================
  // State
  // ================================================================
  // IMPORTANT: all `let`-declared state must live *above* the picker
  // creation. The picker fires its `onChange` callback synchronously
  // during init (to paint the default swatch), which reaches back
  // into applyCardColor + notifyReady and touches nameValue /
  // hasStrokes. Declaring those below the picker would put them in
  // the temporal dead zone and throw on construction.
  let state = 'peek';
  let nameValue = '';
  let nameConfirmed = false;
  // Message tracks the optional short note. It has its own
  // independent lock (messageConfirmed). Empty messages can be locked.
  let messageValue = '';
  let messageConfirmed = false;
  let cardColor = DEFAULT_CARD_COLOR;
  let inkColor = contrastInk(DEFAULT_CARD_COLOR);
  // Active pattern key + which stacked layer is currently showing.
  // `patternKey === null` flags the first render so applyPattern()
  // can seed a layer instantly without the 300ms crossfade.
  let patternKey = null;
  let activePatternLayer = patternLayerA;

  // Stroke storage — each stroke is an array of {x, y} points in CSS
  // pixels. Keeps state for redrawing when the ink color changes.
  const strokes = [];
  let currentStroke = null;
  let hasStrokes = false;
  // Signature "locked" state — ✓ has been clicked. The canvas freezes
  // (pointer-events: none), ✓ / Clear hide, and an "edit" link appears
  // in the ✓'s spot. Locking the signature is one of the two gate
  // conditions that can arm the send flow.
  let sigLocked = false;
  // Drag listeners get attached only while in the 'ready' send phase
  // and detached everywhere else so we're never listening for drags
  // while the visitor is editing.
  let dragListenersAttached = false;

  const ctx = canvas.getContext('2d');
  let canvasReady = false;

  // ---- Send-flow state ----
  // sendPhase mirrors the class cascade on `wrap` so the JS side has
  // a single source of truth for "where are we in the ready→send
  // choreography right now?".
  //   'idle'       — not ready to send (default)
  //   'sequencing' — running the picker-out → pulse → pill sequence
  //   'ready'      — pill visible, card draggable
  //   'dragging'   — pointer has picked up the card
  //   'sending'    — release-over-slot animation running
  //   'sent'       — sent message visible / fading out
  let sendPhase = 'idle';
  /** Timers from the ready sequence; kept so cancel can clear them. */
  let readyTimers = [];
  /** Timers from the send / sent sequence. */
  let sendTimers = [];
  /** Last drag delta (CSS pixels) + rotation — used by the send anim. */
  let dragDx = 0;
  let dragDy = 0;
  let cardRot = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragging = false;

  // Color picker (sibling of card, below it when open). Created after
  // state is declared so its initial onChange doesn't hit the TDZ.
  const picker = createColorPicker({
    initial: DEFAULT_CARD_COLOR,
    onChange: (hex) => {
      applyCardColor(hex);
      notifyReady();
    },
    onModeChange: (mode) => {
      wrap.classList.toggle('is-custom-color', mode === 'custom');
    },
  });
  dismissGroup.appendChild(picker.el);
  // Pickers start hidden — only shown when card opens
  picker.el.style.display = 'none';

  // Pattern picker — appended INSIDE the color picker container so it
  // flows visually below the color swatches (and below the wheel view
  // in custom mode) and inherits the same open-state fade-in. Fires
  // `onChange(key)` → crossfade the card pattern and re-emit the
  // entry so any ready callback sees the new pattern key.
  const patternPicker = createPatternPicker({
    initial: DEFAULT_PATTERN,
    onChange: (key) => {
      applyPattern(key);
      notifyReady();
    },
  });
  picker.el.appendChild(patternPicker.el);

  // ================================================================
  // Send flow DOM — scroll-hint indicator, slot hint, sent message,
  // and post-send actions. All live inside the wrap so they ride
  // along with the fixed-positioned anchor at the bottom of the
  // viewport.
  // ================================================================

  // "Drop to send" scroll-style hint — a small muted label over a
  // slow bouncing chevron. No background, no border, no pill. Same
  // understated aesthetic as the "scroll to explore" indicator on
  // the tiket.com Discover case study.
  const sendHint = document.createElement('div');
  sendHint.className = 'gb-send-hint';
  sendHint.setAttribute('aria-hidden', 'true');

  const sendHintLabel = document.createElement('span');
  sendHintLabel.className = 'gb-send-hint-label';
  sendHintLabel.textContent = gbStr('dropToSend');
  sendHint.appendChild(sendHintLabel);

  const sendHintArrow = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'svg'
  );
  sendHintArrow.setAttribute('class', 'gb-send-hint-arrow');
  sendHintArrow.setAttribute('viewBox', '0 0 14 10');
  sendHintArrow.setAttribute('aria-hidden', 'true');
  sendHintArrow.innerHTML =
    '<path d="M1.2 2 L7 8 L12.8 2" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" />';
  sendHint.appendChild(sendHintArrow);

  wrap.appendChild(sendHint);

  // "Right here" hint — sits above the slot during a drag to telegraph
  // the drop target. Hidden in every other state.
  const slotHint = document.createElement('div');
  slotHint.className = 'gb-slot-hint';
  slotHint.textContent = 'Right here';
  slotHint.setAttribute('aria-hidden', 'true');
  wrap.appendChild(slotHint);

  // "Sent. Thanks for stopping by." — centered above the slot after a
  // successful drop. Fades in, holds for 3s, fades back out.
  const sentMessage = document.createElement('div');
  sentMessage.className = 'gb-sent-message';
  sentMessage.textContent = 'Sent. Thanks for stopping by.';
  sentMessage.setAttribute('aria-live', 'polite');
  wrap.appendChild(sentMessage);

  // Post-send actions — two minimal text links that replace the
  // sent message after it fades out. Same faint serif aesthetic as
  // the drop hint.
  const postActions = document.createElement('div');
  postActions.className = 'gb-post-actions';
  postActions.setAttribute('aria-hidden', 'true');

  const editLink = document.createElement('button');
  editLink.type = 'button';
  editLink.className = 'gb-post-action';
  editLink.textContent = 'Edit card';
  editLink.tabIndex = -1;

  const postSep = document.createElement('span');
  postSep.className = 'gb-post-sep';
  postSep.setAttribute('aria-hidden', 'true');
  postSep.textContent = '·';

  const downloadLink = document.createElement('button');
  downloadLink.type = 'button';
  downloadLink.className = 'gb-post-action';
  downloadLink.textContent = 'Download card';
  downloadLink.tabIndex = -1;

  postActions.appendChild(editLink);
  postActions.appendChild(postSep);
  postActions.appendChild(downloadLink);
  wrap.appendChild(postActions);

  // ================================================================
  // Card color application
  // ================================================================
  function applyCardColor(hex) {
    cardColor = hex;
    inkColor = contrastInk(hex);
    // Pattern color — a darker shade of the card color. Both the
    // in-card pattern layers and the pattern picker tile previews
    // read from --gb-card-pattern-color, so setting it on wrap
    // keeps everything (inside and outside the card) in sync.
    const patternColor = darkenHex(hex, 0.38);
    card.style.setProperty('--gb-card-bg', hex);
    card.style.setProperty('--gb-card-ink', inkColor);
    card.style.setProperty('--gb-card-pattern-color', patternColor);
    wrap.style.setProperty('--gb-card-pattern-color', patternColor);

    // Reactive shadow/glow derived directly from the current card color.
    // Inline so it overrides any CSS rule and updates on every swatch or
    // wheel change. Formula: main lifted shadow + close contact shadow,
    // both in the card's own RGB at reduced opacity.
    const [r, g, b] = hexToRgb(hex);
    card.style.boxShadow =
      `0 20px 60px rgba(${r}, ${g}, ${b}, 0.35), ` +
      `0 8px 20px rgba(${r}, ${g}, ${b}, 0.2)`;

    if (canvasReady) {
      ctx.strokeStyle = inkColor;
      ctx.fillStyle = inkColor;
      redrawStrokes();
    }
  }

  // ================================================================
  // Pattern application
  // ================================================================
  // Mounts the new pattern SVG into the inactive stacked layer, then
  // toggles `.is-active` so the layers crossfade over 300ms (owned by
  // CSS). The first call after construction bypasses the transition
  // and seeds layer A directly.
  function applyPattern(key) {
    if (!PATTERN_KEYS.includes(key)) return;
    if (key === patternKey) return;

    if (patternKey === null) {
      // First render — seed layer A instantly, no crossfade.
      patternLayerA.innerHTML = '';
      patternLayerA.appendChild(createPatternSVG(key));
      patternLayerA.classList.add('is-active');
      patternLayerB.classList.remove('is-active');
      patternLayerB.innerHTML = '';
      activePatternLayer = patternLayerA;
      patternKey = key;
      return;
    }

    patternKey = key;
    const inactive =
      activePatternLayer === patternLayerA ? patternLayerB : patternLayerA;
    inactive.innerHTML = '';
    inactive.appendChild(createPatternSVG(key));
    // Force layout flush so the browser sees the pre-transition
    // opacity state before we toggle the class.
    void inactive.offsetWidth;
    activePatternLayer.classList.remove('is-active');
    inactive.classList.add('is-active');
    activePatternLayer = inactive;
  }

  // ================================================================
  // Canvas setup + drawing
  // ================================================================
  function setupCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return false;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    canvasReady = true;
    redrawStrokes();
    return true;
  }

  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (!canvasReady) setupCanvas();
        })
      : null;
  if (ro) ro.observe(canvas);

  function clearCanvasDisplay() {
    if (!canvasReady) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // Redraw all stored strokes in the current ink color.
  function redrawStrokes() {
    clearCanvasDisplay();
    if (!canvasReady) return;
    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const stroke of strokes) {
      if (!stroke.length) continue;
      // Dot at first point
      ctx.beginPath();
      ctx.arc(stroke[0].x, stroke[0].y, STROKE_WIDTH / 2, 0, Math.PI * 2);
      ctx.fill();

      if (stroke.length === 1) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length - 1; i++) {
        const midX = (stroke[i].x + stroke[i + 1].x) / 2;
        const midY = (stroke[i].y + stroke[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, midX, midY);
      }
      const last = stroke[stroke.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
  }

  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const point = e.touches && e.touches[0] ? e.touches[0] : e;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
    };
  }

  function startDraw(e) {
    if (state !== 'open') return;
    if (!canvasReady && !setupCanvas()) return;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    drawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;

    currentStroke = [{ x: lastX, y: lastY }];
    strokes.push(currentStroke);

    ctx.beginPath();
    ctx.arc(lastX, lastY, STROKE_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);

    if (!hasStrokes) {
      hasStrokes = true;
      wrap.classList.add('has-signature');
      notifyReady();
    }
  }

  function draw(e) {
    if (!drawing) return;
    if (e.cancelable) e.preventDefault();
    const pos = getPos(e);
    if (currentStroke) currentStroke.push({ x: pos.x, y: pos.y });
    const midX = (lastX + pos.x) / 2;
    const midY = (lastY + pos.y) / 2;
    ctx.quadraticCurveTo(lastX, lastY, midX, midY);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
  }

  function endDraw() {
    if (!drawing) return;
    drawing = false;
    ctx.lineTo(lastX, lastY);
    ctx.stroke();
    currentStroke = null;
    notifyReady();
    // The ready flow is no longer armed by finishing a stroke — the
    // visitor has to explicitly lock the signature via the ✓ button.
    // This keeps drawing and committing as two distinct gestures.
  }

  function clearCanvas() {
    strokes.length = 0;
    currentStroke = null;
    clearCanvasDisplay();
    hasStrokes = false;
    drawing = false;
    wrap.classList.remove('has-signature');
    // Clearing always implies we're back in signing state too.
    if (sigLocked) {
      sigLocked = false;
      wrap.classList.remove('is-sig-locked');
      if (state === 'open') {
        sigEdit.tabIndex = -1;
        clearBtn.tabIndex = 0;
      }
    }
    notifyReady();
    // Clearing the signature retracts the ready flow.
    cancelReadyFlow();
  }

  // ================================================================
  // State transitions
  // ================================================================
  function openCard() {
    if (state === 'open') return;
    state = 'open';

    // Show pickers before opening animation begins — flush layout
    // so the browser sees opacity: 0 before is-open sets opacity: 1,
    // allowing the CSS transition to animate the fade-in.
    picker.el.style.display = '';
    void picker.el.offsetHeight;

    wrap.classList.add('is-open');

    card.removeAttribute('role');
    card.setAttribute('tabindex', '-1');
    // Mirror the current confirm mode: each field has its own lock.
    nameInput.tabIndex = nameConfirmed ? -1 : 0;
    nameEdit.tabIndex = nameConfirmed ? 0 : -1;
    messageInput.tabIndex = messageConfirmed ? -1 : 0;
    messageEdit.tabIndex = messageConfirmed ? 0 : -1;
    // Signature affordances mirror the sig-locked state. In signing
    // state: the ✓ is tabbable (if enabled) and Clear is tabbable.
    // In locked state: only the sig edit link is tabbable.
    if (sigLocked) {
      clearBtn.tabIndex = -1;
      sigConfirm.tabIndex = -1;
      sigEdit.tabIndex = 0;
    } else {
      clearBtn.tabIndex = 0;
      sigConfirm.tabIndex = hasStrokes ? 0 : -1;
      sigEdit.tabIndex = -1;
    }

    document.addEventListener('mousedown', onDocMouseDown, true);
    document.addEventListener('keydown', onKey);

    window.setTimeout(() => {
      if (state !== 'open') return;
      if (!canvasReady) setupCanvas();
      if (!nameConfirmed) nameInput.focus({ preventScroll: true });
    }, 320);

    if (typeof onOpen === 'function') onOpen();
  }

  function closeCard() {
    if (state === 'peek') return;
    state = 'peek';

    // Closing collapses the entire send flow back to idle.
    cancelReadyFlow();
    cancelSendFlow();

    // Blur inputs immediately
    if (document.activeElement === nameInput) nameInput.blur();
    if (document.activeElement === messageInput) messageInput.blur();

    document.removeEventListener('mousedown', onDocMouseDown, true);
    document.removeEventListener('keydown', onKey);

    // --- Dismiss: slide the entire dismiss group down as one unit ---
    wrap.classList.add('is-dismissing');
    wrap.classList.remove('is-custom-color');
    wrap.classList.add('is-slot-pulse');

    // Animate the dismiss group — card + pickers move together
    dismissGroup.style.transition = 'transform 400ms cubic-bezier(0.4, 0, 1, 1)';
    dismissGroup.style.transform = 'translateY(600px)';

    // Cleanup on actual transition completion — manual once-guard
    // because { once: true } would fire on the first bubbled child event
    let dismissDone = false;
    function onDismissEnd(e) {
      if (e.target !== dismissGroup || e.propertyName !== 'transform') return;
      if (dismissDone) return;
      dismissDone = true;
      dismissGroup.removeEventListener('transitionend', onDismissEnd);

      // 1. Reset transform instantly with no transition
      dismissGroup.style.transition = 'none';
      dismissGroup.style.transform = '';
      card.style.transition = 'none';

      // 2. Hide pickers
      picker.el.style.display = 'none';

      // 3. Set card to peeking state
      wrap.classList.remove('is-open');
      wrap.classList.remove('is-dismissing');
      wrap.classList.remove('is-slot-pulse');
      picker.setMode('presets');

      // Force layout so card computes peek position immediately
      void card.offsetHeight;

      // Restore tabindex for peek state
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      nameInput.tabIndex = -1;
      nameConfirm.tabIndex = -1;
      nameEdit.tabIndex = -1;
      messageInput.tabIndex = -1;
      messageConfirm.tabIndex = -1;
      messageEdit.tabIndex = -1;
      clearBtn.tabIndex = -1;
      sigConfirm.tabIndex = -1;
      sigEdit.tabIndex = -1;

      // 4. Re-enable transitions after reset — double rAF ensures
      //    the browser has fully committed the reset before transitions
      //    are re-enabled, preventing a bounce glitch.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          dismissGroup.style.transition = '';
          card.style.transition = '';
          if (typeof onClose === 'function') onClose();
        });
      });
    }
    dismissGroup.addEventListener('transitionend', onDismissEnd);
  }

  function onDocMouseDown(e) {
    if (wrap.contains(e.target)) return;
    // Never pull the card out from under itself mid-send.
    if (sendPhase === 'sending' || sendPhase === 'sent') return;
    closeCard();
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      if (sendPhase === 'sending' || sendPhase === 'sent') return;
      e.preventDefault();
      closeCard();
    }
  }

  // ================================================================
  // Public state
  // ================================================================
  function getEntry() {
    return {
      name: nameValue.trim(),
      message: messageValue.trim(),
      drawData: hasStrokes ? canvas.toDataURL('image/png') : null,
      stamp: null,
      cardColor,
      pattern: patternKey,
    };
  }

  function isReady() {
    return !!(nameValue.trim() || hasStrokes);
  }

  function notifyReady() {
    if (!isReady()) return;
    if (typeof onReady === 'function') {
      onReady(getEntry());
    }
  }

  function reset() {
    nameInput.value = '';
    nameValue = '';
    setNameHasValue(false);
    messageInput.value = '';
    messageValue = '';
    messagePrinted.textContent = '';
    messageCounter.textContent = `0/${MESSAGE_MAX}`;
    messageField.classList.remove('is-near-limit');
    exitConfirmedName({ focus: false });
    exitConfirmedMessage({ focus: false });
    // clearCanvas() also drops sigLocked / has-signature if needed.
    clearCanvas();
    sigLocked = false;
    wrap.classList.remove('is-sig-locked');
    picker.setColor(DEFAULT_CARD_COLOR);
    applyCardColor(DEFAULT_CARD_COLOR);
    patternPicker.setKey(DEFAULT_PATTERN);
    applyPattern(DEFAULT_PATTERN);
    cancelReadyFlow();
    cancelSendFlow();
    sendPhase = 'idle';
    closeCard();
  }

  // ================================================================
  // Name confirm / edit
  // ================================================================
  // Toggles the "has-name" affordance on the field so the check
  // button fades in once there's something worth confirming.
  function setNameHasValue(hasValue) {
    nameField.classList.toggle('has-name', !!hasValue);
  }

  function enterConfirmedName() {
    // Empty names are valid — the ✓ locks whatever is in the field.
    nameValue = nameInput.value.trim();
    nameInput.value = nameValue;
    namePrinted.textContent = nameValue;
    nameConfirmed = true;
    nameField.classList.add('is-confirmed');
    nameInput.tabIndex = -1;
    nameInput.blur();
    if (state === 'open') nameEdit.tabIndex = 0;

    notifyReady();
    maybeStartReadyFlow();
  }

  function exitConfirmedName({ focus = true } = {}) {
    nameConfirmed = false;
    nameField.classList.remove('is-confirmed');
    nameEdit.tabIndex = -1;
    cancelReadyFlow();
    if (state === 'open') {
      nameInput.tabIndex = 0;
      if (focus) {
        requestAnimationFrame(() => {
          nameInput.focus({ preventScroll: true });
          const len = nameInput.value.length;
          try {
            nameInput.setSelectionRange(len, len);
          } catch (_) {
            /* some input types don't support selection */
          }
        });
      }
    }
  }

  // ================================================================
  // Message confirm / edit (independent lock)
  // ================================================================
  function enterConfirmedMessage() {
    messageValue = messageInput.value.slice(0, MESSAGE_MAX);
    messagePrinted.textContent = messageValue;
    messageConfirmed = true;
    messageField.classList.add('is-confirmed');
    messageInput.tabIndex = -1;
    if (document.activeElement === messageInput) messageInput.blur();
    if (state === 'open') messageEdit.tabIndex = 0;

    notifyReady();
    maybeStartReadyFlow();
  }

  function exitConfirmedMessage({ focus = true } = {}) {
    messageConfirmed = false;
    messageField.classList.remove('is-confirmed');
    messageEdit.tabIndex = -1;
    cancelReadyFlow();
    if (state === 'open') {
      messageInput.tabIndex = 0;
      if (focus) {
        requestAnimationFrame(() => {
          messageInput.focus({ preventScroll: true });
          const len = messageInput.value.length;
          try {
            messageInput.setSelectionRange(len, len);
          } catch (_) {
            /* some input types don't support selection */
          }
        });
      }
    }
  }

  // ================================================================
  // Signature lock / unlock
  // ================================================================
  // The signature has two states: "signing" (canvas drawable, Clear
  // and ✓ visible) and "locked" (canvas frozen, ✓ / Clear hidden,
  // "edit" text link visible in the ✓'s spot). Locking is a deliberate
  // click on the ✓ — just finishing a stroke doesn't lock anything.
  function enterSigLocked() {
    if (!hasStrokes) return;
    if (sigLocked) return;
    sigLocked = true;
    wrap.classList.add('is-sig-locked');
    if (state === 'open') {
      sigConfirm.tabIndex = -1;
      sigEdit.tabIndex = 0;
      clearBtn.tabIndex = -1;
      // Move focus off the (now-hidden) ✓ so the locked state is
      // visually clean. The sig edit link is the natural next stop.
      if (document.activeElement === sigConfirm) {
        sigEdit.focus({ preventScroll: true });
      }
    }
    notifyReady();
    // Locking the signature is one half of the ready gate — try to
    // arm the flow.
    maybeStartReadyFlow();
  }

  // Exit the locked state. `clearDrawing` wipes the canvas so the
  // visitor has a fresh signing surface (what the "edit" link does).
  // Called without clearing from reset() / returnToEditable() /
  // closeCard() paths that are doing their own cleanup.
  function exitSigLocked({ clearDrawing = true } = {}) {
    if (!sigLocked) return;
    sigLocked = false;
    wrap.classList.remove('is-sig-locked');
    // Dropping out of locked mode cancels the ready flow if it was
    // armed — we're back in editing land.
    cancelReadyFlow();
    if (clearDrawing) {
      strokes.length = 0;
      currentStroke = null;
      clearCanvasDisplay();
      hasStrokes = false;
      wrap.classList.remove('has-signature');
    }
    if (state === 'open') {
      sigEdit.tabIndex = -1;
      sigConfirm.tabIndex = hasStrokes ? 0 : -1;
      clearBtn.tabIndex = 0;
    }
    notifyReady();
  }

  // ================================================================
  // Drag listener attachment
  // ================================================================
  // The card must not be draggable at all until we're in the 'ready'
  // phase — so we wire / unwire the pointer listeners dynamically.
  // Any state transition out of ready immediately detaches them.
  function attachDragListeners() {
    if (dragListenersAttached) return;
    card.addEventListener('mousedown', cardPointerDown);
    card.addEventListener('touchstart', cardPointerDown, { passive: false });
    dragListenersAttached = true;
  }

  function detachDragListeners() {
    if (!dragListenersAttached) return;
    card.removeEventListener('mousedown', cardPointerDown);
    card.removeEventListener('touchstart', cardPointerDown);
    dragListenersAttached = false;
  }

  // ================================================================
  // Send flow — ready sequence, drag, send animation
  // ================================================================
  // Gate: the card is "ready to send" once the name input is non-empty
  // AND the signature has been explicitly locked via its ✓ button.
  // Both conditions are equal partners — changing either one
  // mid-flight cancels the ready sequence.
  function canEnterReadyFlow() {
    // All three independent locks must be engaged. Empty fields are
    // allowed — the gate only checks that each ✓ was clicked.
    return nameConfirmed && messageConfirmed && sigLocked;
  }

  /**
   * Run the strict non-overlapping ready choreography:
   *
   *   t=0     picker fade out (250ms)
   *   t=400   card breath pulse (300ms)   (250 + 150 wait)
   *   t=800   pill fade in (200ms) + playReady()
   *
   * Each step is kicked off by its own timer; cancelReadyFlow() tears
   * them all down if the user starts editing again mid-flight.
   */
  function maybeStartReadyFlow() {
    if (state !== 'open') return;
    if (sendPhase !== 'idle') return;
    if (!canEnterReadyFlow()) return;

    sendPhase = 'sequencing';

    // If the visitor happened to be in the custom color wheel when
    // they completed the card, drop back to the presets view so the
    // card's open-state transform normalizes to translateY(-210px)
    // before the pulse animation references it. The picker is about
    // to fade anyway, so the visual effect is invisible.
    picker.setMode('presets');

    // Step 1: picker fades out. CSS owns the 250ms transition.
    wrap.classList.add('is-picker-out');

    // Step 2: 150ms after the picker starts fading, run the card
    // breath-pulse. The pulse animation is 300ms; we remove the
    // class as soon as it finishes so no `animation` rule pins
    // `transform` and blocks the inline transforms we'll apply
    // during drag later.
    readyTimers.push(
      window.setTimeout(() => {
        wrap.classList.add('is-pulsed');
      }, 250 + 150)
    );
    readyTimers.push(
      window.setTimeout(() => {
        wrap.classList.remove('is-pulsed');
      }, 250 + 150 + 300)
    );

    // Step 3: 100ms after the pulse ends, fade the hint in, attach
    // the drag listeners, and play the ready tone. sendPhase
    // advances to 'ready' here. Drag listeners were not attached
    // before this moment — the card was genuinely un-draggable.
    readyTimers.push(
      window.setTimeout(() => {
        sendPhase = 'ready';
        wrap.classList.add('is-ready');
        attachDragListeners();
        playReady();
      }, 250 + 150 + 300 + 100)
    );
  }

  function cancelReadyFlow() {
    // Tear down pending timers.
    readyTimers.forEach((t) => window.clearTimeout(t));
    readyTimers = [];

    // Only roll back classes if we're still in the early send flow —
    // we don't want to interrupt an already-sending card.
    if (sendPhase === 'sequencing' || sendPhase === 'ready') {
      wrap.classList.remove('is-picker-out', 'is-pulsed', 'is-ready');
      // Drag listeners only exist while in 'ready'; detaching here
      // makes sure we never have a listener alive outside of ready.
      detachDragListeners();
      sendPhase = 'idle';
    }
  }

  // ---- Drag handling ----------------------------------------------
  //
  // When the wrap has .is-ready the card accepts pointer events that
  // land on its non-interactive surface (everything except inputs,
  // the signature canvas, the clear link, and the color picker) and
  // becomes a draggable letter.

  function isDragSafeTarget(target) {
    if (!target) return false;
    // In ready state, the form is locked (name confirmed, signature
    // committed) so the entire card face is a valid drag handle — the
    // visitor shouldn't have to hunt for an "edge" to grab.
    if (sendPhase === 'ready') return true;
    // Outside ready, guard against pointerdown on interactive sub-regions.
    if (target.closest('.gb-card-name-row')) return false;
    if (target.closest('.gb-card-name-display')) return false;
    if (target.closest('.gb-card-message-row')) return false;
    if (target.closest('.gb-card-message-display')) return false;
    if (target.closest('.gb-card-canvas')) return false;
    if (target.closest('.gb-card-clear')) return false;
    if (target.closest('.gb-card-sig-confirm')) return false;
    if (target.closest('.gb-card-sig-edit')) return false;
    if (target.closest('.gb-card-colors')) return false;
    return true;
  }

  function cardPointerDown(e) {
    if (sendPhase !== 'ready') return;
    if (!isDragSafeTarget(e.target)) return;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    const point = e.touches && e.touches[0] ? e.touches[0] : e;
    dragStartX = point.clientX;
    dragStartY = point.clientY;
    dragDx = 0;
    dragDy = 0;
    cardRot = 0;
    dragging = true;
    sendPhase = 'dragging';

    wrap.classList.remove('is-ready');
    wrap.classList.add('is-dragging');
    applyCardDragTransform();

    playPickup();

    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
    window.addEventListener('touchcancel', onDragEnd);
  }

  function onDragMove(e) {
    if (!dragging) return;
    if (e.cancelable) e.preventDefault();
    const point = e.touches && e.touches[0] ? e.touches[0] : e;
    dragDx = point.clientX - dragStartX;
    dragDy = point.clientY - dragStartY;
    // Tiny tilt based on horizontal displacement — feels like the
    // paper is catching the air as you pull it sideways.
    cardRot = Math.max(-8, Math.min(8, dragDx * 0.04));
    applyCardDragTransform();
  }

  function applyCardDragTransform() {
    // Base open translateY is -210 (see guestbook.css). We layer the
    // pointer delta + tilt on top via inline style so it wins against
    // the class transform.
    card.style.transition = 'none';
    card.style.transform =
      `translateY(${-210 + dragDy}px) translateX(${dragDx}px) rotate(${cardRot}deg)`;
  }

  function onDragEnd(e) {
    if (!dragging) return;
    dragging = false;

    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
    window.removeEventListener('touchmove', onDragMove);
    window.removeEventListener('touchend', onDragEnd);
    window.removeEventListener('touchcancel', onDragEnd);

    // Use the last known drag deltas to decide if the release was
    // near the slot. We measure the slot's bounding rect against the
    // card's current center.
    const overSlot = isCardOverSlot();
    if (overSlot) {
      runSendAnimation();
    } else {
      snapBackToReady();
    }
  }

  function isCardOverSlot() {
    // Use the live card rect — inline transform is already applied.
    const cardRect = card.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardBottom = cardRect.bottom;
    // Horizontally: card center within ±slot width. Vertically: card
    // bottom has reached the slot's top edge (with a generous buffer).
    const withinX = Math.abs(cardCenterX - (slotRect.left + slotRect.width / 2)) < slotRect.width;
    const withinY = cardBottom > slotRect.top - 40;
    return withinX && withinY;
  }

  function snapBackToReady() {
    // IMPORTANT: drop the .is-dragging class BEFORE setting the
    // inline transition. While that class is on the wrap, the
    // `transition: none !important` rule would beat our inline
    // transition and kill the spring.
    wrap.classList.remove('is-dragging');
    wrap.classList.add('is-ready');
    sendPhase = 'ready';

    // Spring the card back to the open resting position.
    card.style.transition =
      'transform 260ms cubic-bezier(0.34, 1.35, 0.64, 1)';
    card.style.transform = 'translateY(-210px) translateX(0) rotate(0deg)';

    // Clear inline styles after the spring so class styles can own
    // the transform again.
    window.setTimeout(() => {
      card.style.transition = '';
      card.style.transform = '';
      dragDx = 0;
      dragDy = 0;
      cardRot = 0;
    }, 280);
  }

  // ---- Send animation ---------------------------------------------
  //
  // Timeline (strict, non-overlapping movement phases):
  //
  //   t=0     snap to slot center X + straighten rotation   (100ms ease-out)
  //   t=100   BOUNCE: recoil up ~12px from current Y         (150ms ease-out)
  //           (the "hit the slot edge" moment)
  //   t=250   come back down and squish into the slot         (200ms ease-in)
  //           + playDrop() + slot orange pulse (600ms)
  //   t=450   card fully clipped by the slot
  //   t=1050  sent message fades in                          (400ms)
  //   t=4450  sent message fades out                          (400ms)
  //   t=4850  post-send actions fade in                      (300ms)

  function runSendAnimation() {
    sendPhase = 'sending';
    wrap.classList.remove('is-dragging');
    wrap.classList.add('is-sending');
    // We're past the ready phase — no more drag interactions.
    detachDragListeners();

    // Fire onSent once at the start of the send animation — this is the
    // "submit" moment. Parent can push to Supabase (or anywhere else)
    // from here. We snapshot the entry now so even if the user Edits
    // the card afterwards, the already-submitted payload is preserved.
    if (typeof onSent === 'function') {
      try { onSent(getEntry()); } catch (err) { console.error('[Guestbook] onSent callback threw', err); }
    }

    // Anchor the scale origin at the card's bottom center up front so
    // when scaleY kicks in later the card collapses toward the slot,
    // not toward its middle.
    card.style.transformOrigin = '50% 100%';

    // Lock in the starting inline transform so transitions have a
    // reliable "from" state. startY is the release Y relative to the
    // card's resting open position (translateY(-210px)).
    const startX = dragDx;
    const startY = -210 + dragDy;
    card.style.transition = 'none';
    card.style.transform =
      `translateY(${startY}px) translateX(${startX}px) rotate(${cardRot}deg)`;

    // Phase 1: snap X to slot center + straighten rotation. Y stays
    // where the release happened — we haven't "landed" yet. 100ms.
    requestAnimationFrame(() => {
      card.style.transition = 'transform 100ms ease-out';
      card.style.transform =
        `translateY(${startY}px) translateX(0px) rotate(0deg)`;
    });

    // Phase 2: bounce recoil. Lift the card ~12px from its current Y
    // as if it physically hit the slot edge. 150ms ease-out.
    sendTimers.push(
      window.setTimeout(() => {
        card.style.transition = 'transform 150ms ease-out';
        card.style.transform =
          `translateY(${startY - 12}px) translateX(0px) rotate(0deg)`;
      }, 100)
    );

    // Phase 3: come back down and squish into the slot. scaleY
    // collapse plus a downward translate pushes the card entirely
    // below the slot's top edge. Since the slot sits at higher
    // z-index with an opaque dark fill, the shrinking card is
    // visually eaten by it. 200ms ease-in.
    sendTimers.push(
      window.setTimeout(() => {
        card.style.transition = 'transform 200ms ease-in';
        card.style.transform =
          'translateY(106px) translateX(0px) rotate(0deg) scaleY(0.04)';
        playDrop();
        // Slot pulses orange once — the class self-clears on anim end.
        wrap.classList.add('is-slot-pulse');
        sendTimers.push(
          window.setTimeout(() => {
            wrap.classList.remove('is-slot-pulse');
          }, 620)
        );
      }, 250)
    );

    // Phase 4: 600ms after the card is gone, fade in the sent message.
    sendTimers.push(
      window.setTimeout(() => {
        sendPhase = 'sent';
        wrap.classList.add('is-sent');
      }, 450 + 600)
    );

    // Phase 5: hold 3s, then fade the message out.
    sendTimers.push(
      window.setTimeout(() => {
        wrap.classList.add('is-sent-out');
      }, 450 + 600 + 400 + 3000)
    );

    // Phase 6: once the sent message is fully gone, reveal the
    // post-send actions (Edit / Download). The card STAYS in the
    // slot until the visitor picks one.
    sendTimers.push(
      window.setTimeout(() => {
        wrap.classList.remove('is-sent', 'is-sent-out');
        wrap.classList.add('is-post-actions');
        editLink.tabIndex = 0;
        downloadLink.tabIndex = 0;
        postActions.setAttribute('aria-hidden', 'false');
      }, 450 + 600 + 400 + 3000 + 400)
    );
  }

  function cancelSendFlow() {
    sendTimers.forEach((t) => window.clearTimeout(t));
    sendTimers = [];
    // Tear down every send-flow class — including is-picker-out /
    // is-pulsed so the breath-pulse keyframe stops holding the card
    // at translateY(-210px) when we transition back to peek.
    wrap.classList.remove(
      'is-picker-out',
      'is-pulsed',
      'is-ready',
      'is-dragging',
      'is-sending',
      'is-slot-pulse',
      'is-sent',
      'is-sent-out',
      'is-post-actions'
    );
    // Drag listeners never survive outside the ready phase.
    detachDragListeners();
    editLink.tabIndex = -1;
    downloadLink.tabIndex = -1;
    postActions.setAttribute('aria-hidden', 'true');
    card.style.transition = '';
    card.style.transform = '';
    card.style.transformOrigin = '';
    card.style.opacity = '';
  }

  // ---- Edit card (return from slot to editable) ------------------
  //
  // Smooth spring back from the squished-into-slot inline transform
  // to the normal .is-open state, then clear inline styles so the
  // class cascade takes over again. We drop the name out of
  // confirmed mode so the input is editable again, and clear the
  // signature strokes so the visitor has a fresh signing surface.
  function returnToEditable() {
    // Kill any pending timers from the send flow.
    sendTimers.forEach((t) => window.clearTimeout(t));
    sendTimers = [];

    // Strip every send-flow class.
    wrap.classList.remove(
      'is-sending',
      'is-sent',
      'is-sent-out',
      'is-post-actions',
      'is-picker-out',
      'is-pulsed',
      'is-ready',
      'is-dragging'
    );
    // Ensure no stray drag listeners survive the round trip.
    detachDragListeners();
    editLink.tabIndex = -1;
    downloadLink.tabIndex = -1;
    postActions.setAttribute('aria-hidden', 'true');

    // Spring the card back to its open resting position.
    card.style.transition =
      'transform 400ms cubic-bezier(0.34, 1.25, 0.64, 1), opacity 200ms ease';
    card.style.transform =
      'translateY(-210px) translateX(0px) rotate(0deg) scaleY(1)';
    card.style.opacity = '1';

    // After the spring completes, clear inline styles so CSS
    // classes own the transform again.
    window.setTimeout(() => {
      card.style.transition = '';
      card.style.transform = '';
      card.style.transformOrigin = '';
    }, 440);

    // Drop confirmed modes so inputs become editable again.
    exitConfirmedName({ focus: false });
    exitConfirmedMessage({ focus: false });

    // Restore interaction on the signature canvas: drop locked state
    // first (which would otherwise pin pointer-events: none), then
    // wipe strokes so the visitor has a fresh signing surface.
    sigLocked = false;
    wrap.classList.remove('is-sig-locked');
    wrap.classList.remove('has-signature');
    hasStrokes = false;
    strokes.length = 0;
    clearCanvasDisplay();

    // Mirror open-state tab affordances for a fresh signing surface.
    if (state === 'open') {
      sigEdit.tabIndex = -1;
      sigConfirm.tabIndex = -1;
      clearBtn.tabIndex = 0;
    }

    sendPhase = 'idle';
  }

  // ---- Download card ---------------------------------------------
  //
  // No external library — we render the card ourselves by cloning the
  // DOM, inlining every computed style onto the clone, then wrapping
  // it in an SVG <foreignObject> and converting that to a PNG via a
  // canvas. html2canvas / html-to-image / modern-screenshot all
  // silently produced blank or incomplete images in this environment
  // (couldn't inline Google Fonts through CORS, choked on color-mix,
  // etc.), so this zero-dependency path is the most reliable.

  // Recursively copy computed styles from `src` to `target`. Both
  // trees must have the same structure — cloneNode(true) guarantees
  // that, and we walk them in lock-step.
  function inlineAllStyles(src, target) {
    if (!src || !target) return;
    if (src.nodeType === 1 && target.nodeType === 1) {
      const cs = window.getComputedStyle(src);
      let style = '';
      for (let i = 0; i < cs.length; i++) {
        const prop = cs[i];
        const val = cs.getPropertyValue(prop);
        if (val) style += prop + ':' + val + ';';
      }
      // Preserve any inline overrides we set on the clone (width/height/transform etc).
      const existing = target.getAttribute('style') || '';
      target.setAttribute('style', style + existing);
    }
    const sKids = src.childNodes;
    const tKids = target.childNodes;
    const n = Math.min(sKids.length, tKids.length);
    for (let i = 0; i < n; i++) inlineAllStyles(sKids[i], tKids[i]);
  }

  function buildCardSlug() {
    const raw = (nameValue || '').trim().toLowerCase();
    const slug = raw.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return slug || 'guest';
  }

  function buildCardFilename() {
    const today = new Date().toISOString().slice(0, 10);
    return `guestcard-${buildCardSlug()}-${today}.png`;
  }

  async function downloadCard() {
    // Quick flash on the (still squished) card as positive feedback.
    card.style.transition = 'opacity 120ms ease';
    card.style.opacity = '0.8';
    window.setTimeout(() => { card.style.opacity = '1'; }, 100);

    const W = CARD_W;
    const H = 340;

    // Clone the card. The clone inherits the live card's classes so CSS
    // still applies — but we can't rely on external stylesheets inside the
    // SVG foreignObject, so we inline every computed style below.
    const clone = card.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

    // Pre-inline the positioning bits before inlineAllStyles runs so they
    // beat the resting translateY(260px) / translateY(-210px) transforms.
    clone.style.transform = 'none';
    clone.style.position = 'static';
    clone.style.opacity = '1';
    clone.style.width = W + 'px';
    clone.style.height = H + 'px';
    clone.style.pointerEvents = 'none';

    // Canvas bitmap doesn't survive cloneNode — swap the clone's <canvas>
    // for an <img> holding the signature export, so the ink is preserved.
    const cloneCanvas = clone.querySelector('.gb-card-canvas');
    if (cloneCanvas) {
      if (hasStrokes) {
        const sig = document.createElement('img');
        sig.src = canvas.toDataURL('image/png');
        sig.className = 'gb-card-canvas';
        sig.setAttribute('style', 'display:block;width:100%;height:96px;');
        cloneCanvas.replaceWith(sig);
      } else {
        const ph = document.createElement('div');
        ph.className = 'gb-card-canvas';
        ph.setAttribute('style', 'width:100%;height:96px;');
        cloneCanvas.replaceWith(ph);
      }
    }

    // Inline every computed style from the live card onto the clone so
    // the SVG rendering doesn't need external stylesheets.
    inlineAllStyles(card, clone);

    // Wrap the styled clone in an SVG <foreignObject> and convert to PNG.
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('xmlns', svgNs);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const fo = document.createElementNS(svgNs, 'foreignObject');
    fo.setAttribute('width', '100%');
    fo.setAttribute('height', '100%');
    fo.appendChild(clone);
    svg.appendChild(fo);

    const svgStr = new XMLSerializer().serializeToString(svg);
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const loaded = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('SVG failed to load as image'));
      });
      img.src = svgUrl;
      await loaded;

      const dpr = 2;
      const out = document.createElement('canvas');
      out.width = W * dpr;
      out.height = H * dpr;
      const ctx = out.getContext('2d');
      ctx.scale(dpr, dpr);
      // Paint the card's background first (belt & suspenders — the inlined
      // clone already has its own bg, but this guarantees no transparency).
      const cardBg = window.getComputedStyle(card).backgroundColor;
      if (cardBg && cardBg !== 'transparent' && cardBg !== 'rgba(0, 0, 0, 0)') {
        ctx.fillStyle = cardBg;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.drawImage(img, 0, 0, W, H);

      const dataUrl = out.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = buildCardFilename();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('[Guestbook] Download failed:', err);
    }
  }

  // ================================================================
  // Wire events
  // ================================================================
  card.addEventListener('click', (e) => {
    if (state === 'peek') {
      e.stopPropagation();
      // First user gesture — warm the AudioContext so the procedural
      // cues play on time later (browsers suspend it until a gesture).
      primeAudio();
      openCard();
    }
  });

  card.addEventListener('keydown', (e) => {
    if (state === 'peek' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      primeAudio();
      openCard();
    }
  });

  // Drag pickup — these listeners are NOT attached at construction.
  // attachDragListeners() / detachDragListeners() wire them only while
  // sendPhase === 'ready'. Outside of ready the card is truly
  // un-listenable for drag gestures.

  // Post-send actions: Edit card + Download card.
  editLink.addEventListener('mousedown', (e) => e.stopPropagation());
  editLink.addEventListener('click', (e) => {
    e.stopPropagation();
    returnToEditable();
  });
  downloadLink.addEventListener('mousedown', (e) => e.stopPropagation());
  downloadLink.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadCard();
  });

  nameInput.addEventListener('input', () => {
    nameValue = nameInput.value;
    setNameHasValue(nameValue.trim().length > 0);
    notifyReady();
  });
  nameInput.addEventListener('mousedown', (e) => e.stopPropagation());
  // Pressing Enter in the name field confirms the name (same as
  // clicking the check). Prevents the browser's default form submit
  // behavior too, just in case this ever lives inside a <form>.
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      enterConfirmedName();
    }
  });

  nameConfirm.addEventListener('mousedown', (e) => e.stopPropagation());
  nameConfirm.addEventListener('click', (e) => {
    e.stopPropagation();
    enterConfirmedName();
  });

  nameEdit.addEventListener('mousedown', (e) => e.stopPropagation());
  nameEdit.addEventListener('click', (e) => {
    e.stopPropagation();
    exitConfirmedName();
  });

  // MESSAGE — optional short note. Typing updates the in-flight value
  // and toggles the "near limit" counter. Enter locks message via its
  // own independent ✓; edit unlocks message only.
  messageInput.addEventListener('input', () => {
    const val = messageInput.value.slice(0, MESSAGE_MAX);
    messageValue = val;
    messageCounter.textContent = `${val.length}/${MESSAGE_MAX}`;
    messageField.classList.toggle(
      'is-near-limit',
      val.length >= MESSAGE_COUNTER_THRESHOLD
    );
    notifyReady();
  });
  messageInput.addEventListener('mousedown', (e) => e.stopPropagation());
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      enterConfirmedMessage();
    }
  });

  messageConfirm.addEventListener('mousedown', (e) => e.stopPropagation());
  messageConfirm.addEventListener('click', (e) => {
    e.stopPropagation();
    enterConfirmedMessage();
  });

  messageEdit.addEventListener('mousedown', (e) => e.stopPropagation());
  messageEdit.addEventListener('click', (e) => {
    e.stopPropagation();
    exitConfirmedMessage();
  });

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseleave', endDraw);
  window.addEventListener('mouseup', endDraw);

  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', endDraw);
  canvas.addEventListener('touchcancel', endDraw);

  clearBtn.addEventListener('mousedown', (e) => e.stopPropagation());
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearCanvas();
    if (state === 'open') nameInput.focus({ preventScroll: true });
  });

  // Signature ✓ — lock the signature. Guards against empty strokes.
  sigConfirm.addEventListener('mousedown', (e) => e.stopPropagation());
  sigConfirm.addEventListener('click', (e) => {
    e.stopPropagation();
    enterSigLocked();
  });

  // Signature edit link — unlock + clear for a fresh sign.
  sigEdit.addEventListener('mousedown', (e) => e.stopPropagation());
  sigEdit.addEventListener('click', (e) => {
    e.stopPropagation();
    exitSigLocked({ clearDrawing: true });
  });

  // Initial color + pattern application. applyPattern seeds layer A
  // instantly on the first call (no 300ms crossfade at construction).
  applyCardColor(DEFAULT_CARD_COLOR);
  applyPattern(DEFAULT_PATTERN);

  requestAnimationFrame(() => {
    if (!canvasReady) setupCanvas();
  });

  // ---- Live language switching ----
  window.addEventListener('langchange', () => {
    title.textContent = gbStr('tagline');
    nameInput.placeholder = gbStr('namePlaceholder');
    messageInput.placeholder = gbStr('messagePlaceholder');
    sendHintLabel.textContent = gbStr('dropToSend');
    const colorLabel = wrap.querySelector('.gb-card-colors-label');
    if (colorLabel) colorLabel.textContent = gbStr('pickColor');
    const patLabel = wrap.querySelector('.gb-card-patterns-label');
    if (patLabel) patLabel.textContent = gbStr('pickPattern');
    const customBtn = wrap.querySelector('.gb-card-colors-custom-link');
    if (customBtn) customBtn.textContent = gbStr('custom');
  });

  return {
    el: wrap,
    card,
    getEntry,
    isReady,
    open: openCard,
    close: closeCard,
    reset,
    destroy() {
      if (ro) ro.disconnect();
      window.removeEventListener('mouseup', endDraw);
      // Card-level drag listeners: detach only if they were attached.
      detachDragListeners();
      // Window-level drag listeners are attached / removed pairwise,
      // but we remove unconditionally in case destroy is called
      // mid-drag.
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('touchmove', onDragMove);
      window.removeEventListener('touchend', onDragEnd);
      window.removeEventListener('touchcancel', onDragEnd);
      document.removeEventListener('mousedown', onDocMouseDown, true);
      document.removeEventListener('keydown', onKey);
      // Tear down any in-flight send-flow timers.
      readyTimers.forEach((t) => window.clearTimeout(t));
      sendTimers.forEach((t) => window.clearTimeout(t));
      readyTimers = [];
      sendTimers = [];
      picker.destroy();
      patternPicker.destroy();
      wrap.remove();
    },
  };
}
