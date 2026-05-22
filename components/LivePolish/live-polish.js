/* Live Polish — dev-mode visual editor (single file, zero deps) */
(function () {
  'use strict';

  if (window.__livePolishLoaded) return;
  window.__livePolishLoaded = true;

  const STORAGE_KEY = 'live-polish:overrides:v1';
  const PALETTE_KEY = 'live-polish:palette:v1';
  const STYLE_ID = 'live-polish-overrides';
  const FONTS_STYLE_ID = 'live-polish-fonts';
  const UI_ID = 'live-polish-ui';

  const isDev =
    window.LIVE_POLISH_ENABLE === true ||
    ['localhost', '127.0.0.1', '0.0.0.0', ''].includes(location.hostname) ||
    location.hostname.endsWith('.local') ||
    location.protocol === 'file:';
  if (!isDev) return;

  // ---------- Curated font list (loaded from Google Fonts on demand) ----------
  const SYSTEM_STACK =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  const FONTS = [
    { label: 'System', stack: SYSTEM_STACK, google: null },
    { label: 'Serif', stack: 'Georgia, "Times New Roman", serif', google: null },
    { label: 'Mono', stack: 'ui-monospace, SFMono-Regular, Menlo, monospace', google: null },
    { label: 'Inter', stack: '"Inter", sans-serif', google: 'Inter:wght@400;500;600;700' },
    { label: 'Roboto', stack: '"Roboto", sans-serif', google: 'Roboto:wght@400;500;700' },
    { label: 'Poppins', stack: '"Poppins", sans-serif', google: 'Poppins:wght@400;500;600;700' },
    { label: 'DM Sans', stack: '"DM Sans", sans-serif', google: 'DM+Sans:wght@400;500;700' },
    { label: 'Manrope', stack: '"Manrope", sans-serif', google: 'Manrope:wght@400;500;600;700' },
    { label: 'Plus Jakarta', stack: '"Plus Jakarta Sans", sans-serif', google: 'Plus+Jakarta+Sans:wght@400;500;600;700' },
    { label: 'Space Grotesk', stack: '"Space Grotesk", sans-serif', google: 'Space+Grotesk:wght@400;500;600;700' },
    { label: 'Playfair', stack: '"Playfair Display", serif', google: 'Playfair+Display:wght@400;500;600;700' },
    { label: 'Lora', stack: '"Lora", serif', google: 'Lora:wght@400;500;600;700' },
    { label: 'JetBrains Mono', stack: '"JetBrains Mono", monospace', google: 'JetBrains+Mono:wght@400;500;700' },
  ];
  const loadedFonts = new Set();
  function ensureFont(google) {
    if (!google || loadedFonts.has(google)) return;
    loadedFonts.add(google);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${google}&display=swap`;
    document.head.appendChild(link);
  }

  // ---------- State ----------
  let active = false;
  let hoverEl = null;
  let selectedEl = null;
  let panel = null;
  let selectedHighlight = null; // solid blue, locked to selected
  let hoverHighlight = null; // neon blue dashed, follows cursor
  let hoverTooltip = null; // floating tag/type label that follows hover
  let overrides = loadJSON(STORAGE_KEY) || {};
  let customPalette = loadJSON(PALETTE_KEY) || [];

  // V2 IA: which pseudo-state the user is currently editing in the panel.
  // 'default' edits base props on draft; other states write to draft.__states[name].
  let panelState = 'default';
  // Section collapse state survives across panel reopens within a session.
  const sectionMemory = {};
  // Pill bounds captured before a panel re-render so the new panel can animate
  // the indicator from its previous position.
  let pendingPillBounds = null;
  function snapshotIndicatorBoundsModule() {
    if (!panel) return null;
    const out = {};
    panel.querySelectorAll('[data-lp-pill-group]').forEach((group) => {
      const activeBtn = group.querySelector('button[data-lp-active="true"]');
      if (activeBtn) {
        out[group.dataset.lpPillGroup] = {
          left: activeBtn.offsetLeft, top: activeBtn.offsetTop,
          width: activeBtn.offsetWidth, height: activeBtn.offsetHeight,
          hasActive: true,
        };
      } else {
        out[group.dataset.lpPillGroup] = { left: 0, top: 0, width: 0, height: 0, hasActive: false };
      }
    });
    return out;
  }
  function repositionIndicatorsModule(prevBounds) {
    if (!panel) return;
    panel.querySelectorAll('[data-lp-pill-group]').forEach((group) => {
      const ind = group.querySelector('[data-lp-indicator]');
      if (!ind) return;
      const activeBtn = group.querySelector('button[data-lp-active="true"]');
      const key = group.dataset.lpPillGroup;
      const prev = prevBounds && prevBounds[key];
      const target = activeBtn
        ? { left: activeBtn.offsetLeft, top: activeBtn.offsetTop, width: activeBtn.offsetWidth, height: activeBtn.offsetHeight, hasActive: true }
        : { left: 0, top: 0, width: 0, height: 0, hasActive: false };
      ind.style.transition = 'none';
      ind.style.transform = `translate(${target.left}px, ${target.top}px)`;
      ind.style.width = target.width + 'px';
      ind.style.height = target.height + 'px';
      ind.style.opacity = target.hasActive ? '1' : '0';
      if (prev && prev.hasActive && (prev.left !== target.left || prev.width !== target.width)) {
        ind.animate(
          [
            { transform: `translate(${prev.left}px, ${prev.top}px)`, width: prev.width + 'px', height: prev.height + 'px', opacity: 1 },
            { transform: `translate(${target.left}px, ${target.top}px)`, width: target.width + 'px', height: target.height + 'px', opacity: 1 },
          ],
          { duration: 250, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'none' }
        );
      }
    });
  }
  // Read the value of a property as it would render for the given state. Walks
  // state map → base draft → computed-style fallback so state controls inherit
  // visually from base.
  function effectiveAt(stateName, draftMap, prop, fallback) {
    if (stateName === 'default') {
      return draftMap[prop] != null ? draftMap[prop] : fallback;
    }
    const sm = draftMap.__states && draftMap.__states[stateName];
    if (sm && sm[prop] != null) return sm[prop];
    if (draftMap[prop] != null) return draftMap[prop];
    return fallback;
  }
  function capitalise(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ---------- V2: Audit mode ----------
  // 'edit' (default) shows the existing element editor.
  // 'audit' shows page-wide spacing scan results and overlays.
  let panelMode = 'edit';
  // VisBug-style features
  let panelMinimized = true;
  let rulerActive = false;
  const rulerOverlays = [];
  function clearRulerOverlays() { while (rulerOverlays.length) rulerOverlays.pop().remove(); }
  function makeRulerLayer(cssText) {
    const el = document.createElement('div');
    el.dataset.lpRuler = '';
    el.style.cssText = cssText;
    document.body.appendChild(el);
    rulerOverlays.push(el);
    return el;
  }
  // Hover guide lines — dashed magenta lines extending from each edge of the hovered
  // element across the full viewport, so alignment with other elements is obvious.
  const hoverGuides = [];
  function clearHoverGuides() { while (hoverGuides.length) hoverGuides.pop().remove(); }
  function drawHoverGuides(el) {
    clearHoverGuides();
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const PINK = 'rgba(236, 72, 153, 0.45)';
    function guide(cssText) {
      const g = document.createElement('div');
      g.dataset.lpGuide = '';
      g.style.cssText = `position:fixed;pointer-events:none;z-index:2147483644;` + cssText;
      document.body.appendChild(g);
      hoverGuides.push(g);
    }
    guide(`left:0;top:${r.top}px;width:${vw}px;height:0;border-top:1px dashed ${PINK};`);
    guide(`left:0;top:${r.bottom}px;width:${vw}px;height:0;border-top:1px dashed ${PINK};`);
    guide(`left:${r.left}px;top:0;width:0;height:${vh}px;border-left:1px dashed ${PINK};`);
    guide(`left:${r.right}px;top:0;width:0;height:${vh}px;border-left:1px dashed ${PINK};`);
  }
  function drawDistanceRuler(from, to) {
    clearRulerOverlays();
    if (!from || !to || from === to) return;
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const PINK = '#ec4899';
    // 1. dashed outline on the hovered element
    makeRulerLayer(`position:fixed;pointer-events:none;z-index:2147483645;left:${b.left}px;top:${b.top}px;width:${b.width}px;height:${b.height}px;outline:2px dashed ${PINK};outline-offset:-2px;`);
    function label(left, top, text) {
      makeRulerLayer(`position:fixed;pointer-events:none;z-index:2147483646;left:${left}px;top:${top}px;background:${PINK};color:#fff;padding:1px 5px;border-radius:3px;font:600 10px/1.4 ui-monospace,monospace;transform:translate(-50%,-50%);white-space:nowrap;`).textContent = text;
    }
    function line(left, top, width, height, dashed) {
      makeRulerLayer(`position:fixed;pointer-events:none;z-index:2147483644;left:${left}px;top:${top}px;width:${width}px;height:${height}px;border-${dashed?'top':'bottom'}:1px ${dashed?'dashed':'solid'} ${PINK};`);
    }
    // Vertical gap
    if (b.top > a.bottom) {
      const d = Math.round(b.top - a.bottom);
      const x = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2;
      line(x, a.bottom, 0, b.top - a.bottom, false);
      makeRulerLayer(`position:fixed;pointer-events:none;z-index:2147483644;left:${x - 0.5}px;top:${a.bottom}px;width:1px;height:${b.top - a.bottom}px;background:${PINK};`);
      label(x, (a.bottom + b.top) / 2, d + 'px');
    } else if (a.top > b.bottom) {
      const d = Math.round(a.top - b.bottom);
      const x = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2;
      makeRulerLayer(`position:fixed;pointer-events:none;z-index:2147483644;left:${x - 0.5}px;top:${b.bottom}px;width:1px;height:${a.top - b.bottom}px;background:${PINK};`);
      label(x, (b.bottom + a.top) / 2, d + 'px');
    }
    // Horizontal gap
    if (b.left > a.right) {
      const d = Math.round(b.left - a.right);
      const y = (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2;
      makeRulerLayer(`position:fixed;pointer-events:none;z-index:2147483644;left:${a.right}px;top:${y - 0.5}px;width:${b.left - a.right}px;height:1px;background:${PINK};`);
      label((a.right + b.left) / 2, y, d + 'px');
    } else if (a.left > b.right) {
      const d = Math.round(a.left - b.right);
      const y = (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2;
      makeRulerLayer(`position:fixed;pointer-events:none;z-index:2147483644;left:${b.right}px;top:${y - 0.5}px;width:${a.left - b.right}px;height:1px;background:${PINK};`);
      label((b.right + a.left) / 2, y, d + 'px');
    }
  }
  let auditIssues = []; // [{ el, severity, prop, value, suggested, side }]
  const auditOverlays = []; // DOM nodes for the colored outlines
  const SPACING_PROPS = ['padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left','gap','row-gap','column-gap'];
  const GRID_STEP = 4;
  function nearestGrid(v) {
    return Math.round(v / GRID_STEP) * GRID_STEP;
  }
  function classifyOffGrid(v) {
    if (v <= 0) return null; // ignore zero
    if (v % GRID_STEP === 0) return null; // on grid
    // For a 4pt grid: off-by-1 (e.g. 13, 7) = clearly missnapped → red.
    // Off-by-2 (e.g. 14, 18) = right between two grid points → yellow.
    const mod = v % GRID_STEP;
    const diff = Math.min(mod, GRID_STEP - mod);
    return diff === 2 ? 'yellow' : 'red';
  }
  function scanForSpacingIssues() {
    const found = [];
    const all = document.querySelectorAll('body *');
    for (const node of all) {
      if (node.closest && node.closest(`#${UI_ID}, [data-lp-popover], [data-lp-audit-overlay]`)) continue;
      const r = node.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const cs = getComputedStyle(node);
      for (const prop of SPACING_PROPS) {
        const raw = cs.getPropertyValue(prop);
        if (!raw) continue;
        const num = parseFloat(raw);
        if (!isFinite(num) || num <= 0) continue;
        const sev = classifyOffGrid(num);
        if (!sev) continue;
        found.push({
          el: node, severity: sev, prop, value: num,
          suggested: nearestGrid(num),
        });
      }
    }
    return found;
  }
  function clearAuditOverlay() {
    while (auditOverlays.length) auditOverlays.pop().remove();
  }
  function renderAuditOverlay(issues) {
    clearAuditOverlay();
    // Group by element so each element gets ONE outline coloured by its worst severity.
    const byEl = new Map();
    for (const issue of issues) {
      const cur = byEl.get(issue.el);
      if (!cur || (cur === 'yellow' && issue.severity === 'red')) {
        byEl.set(issue.el, issue.severity);
      }
    }
    for (const [el, severity] of byEl) {
      const overlay = document.createElement('div');
      overlay.setAttribute('data-lp-audit-overlay', '');
      const r = el.getBoundingClientRect();
      const colour = severity === 'red' ? '#ef4444' : '#eab308';
      Object.assign(overlay.style, {
        position: 'fixed', pointerEvents: 'none', zIndex: 2147483645,
        left: r.left + 'px', top: r.top + 'px',
        width: r.width + 'px', height: r.height + 'px',
        outline: `2px dashed ${colour}`,
        outlineOffset: '-2px',
        boxShadow: `0 0 12px ${severity === 'red' ? 'rgba(239,68,68,0.35)' : 'rgba(234,179,8,0.30)'}`,
      });
      document.body.appendChild(overlay);
      auditOverlays.push(overlay);
    }
  }

  // ---------- Undo / Redo (in-session only) ----------
  // Snapshots of the full overrides map. Slider drags within 400ms of the last
  // checkpoint coalesce into one entry, so a typical edit produces one undo step.
  const undoStack = [];
  const redoStack = [];
  const MAX_UNDO = 50;
  let lastUndoCheckpoint = 0;
  let suppressUndo = false; // true while applying an undo/redo, so the apply path doesn't push back
  function snapshotOverrides() {
    return JSON.parse(JSON.stringify(overrides));
  }
  function pushUndo() {
    if (suppressUndo) return;
    const now = Date.now();
    // Coalesce rapid edits (drag scrubbers, color pickers) into one checkpoint.
    if (now - lastUndoCheckpoint < 400) {
      lastUndoCheckpoint = now;
      return;
    }
    lastUndoCheckpoint = now;
    const snap = snapshotOverrides();
    const last = undoStack[undoStack.length - 1];
    if (last && JSON.stringify(last) === JSON.stringify(snap)) return;
    undoStack.push(snap);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack.length = 0;
  }
  function restoreOverrides(snap) {
    Object.keys(overrides).forEach((k) => delete overrides[k]);
    Object.assign(overrides, snap);
    saveOverrides();
    // Re-render the panel against the restored state so controls reflect the change.
    const cur = selectedEl;
    if (cur && panel) {
      closePanel();
      selectElement(cur);
    }
  }
  function undo() {
    if (!undoStack.length) { showToast('Nothing to undo'); return; }
    const cur = snapshotOverrides();
    const prev = undoStack.pop();
    redoStack.push(cur);
    suppressUndo = true;
    try { restoreOverrides(prev); } finally { suppressUndo = false; }
    lastUndoCheckpoint = 0; // next edit creates a fresh checkpoint
    showToast('Undo');
  }
  function redo() {
    if (!redoStack.length) { showToast('Nothing to redo'); return; }
    const cur = snapshotOverrides();
    const next = redoStack.pop();
    undoStack.push(cur);
    suppressUndo = true;
    try { restoreOverrides(next); } finally { suppressUndo = false; }
    lastUndoCheckpoint = 0;
    showToast('Redo');
  }

  // ---------- Persistence ----------
  function loadJSON(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  }
  function saveOverrides() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    renderStyleTag();
  }
  function savePalette() {
    localStorage.setItem(PALETTE_KEY, JSON.stringify(customPalette));
  }
  // Strip metadata keys (those starting with __) from a props map — they hold
  // states/transitions, not real CSS properties.
  function realProps(map) {
    if (!map) return {};
    const out = {};
    for (const k in map) if (!k.startsWith('__')) out[k] = map[k];
    return out;
  }
  function declarationsBlock(map) {
    return Object.entries(map).map(([k, v]) => `${k}: ${v} !important;`).join(' ');
  }
  // Disabled selector covers both real :disabled buttons and CSS classes the
  // page may use to simulate disabled state. Same for :active across click types.
  function stateSelector(sel, state) {
    if (state === 'disabled') return `${sel}:disabled, ${sel}[disabled], ${sel}.disabled, ${sel}[aria-disabled="true"]`;
    return `${sel}:${state}`;
  }
  function renderStyleTag() {
    let tag = document.getElementById(STYLE_ID);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = STYLE_ID;
      document.head.appendChild(tag);
    }
    let css = '';
    for (const sel in overrides) {
      const props = overrides[sel];
      // Base props (filter out __states / __transition metadata)
      const base = { ...realProps(props) };
      // Add transition shorthand to base if defined (so all state transitions animate from base)
      const tr = props.__transition;
      if (tr && (tr.duration || tr.easing)) {
        base['transition'] = `all ${tr.duration || '200ms'} ${tr.easing || 'ease-out'}`;
      }
      const baseBody = declarationsBlock(base);
      if (baseBody) css += `${sel} { ${baseBody} }\n`;
      // Pseudo-state rules
      const states = props.__states || {};
      for (const stateName of ['hover', 'active', 'disabled']) {
        const stateProps = states[stateName];
        if (!stateProps) continue;
        const real = { ...realProps(stateProps) };
        // Compose `transform` from semantic __scale and __translateY
        const xforms = [];
        if (stateProps.__scale != null) xforms.push(`scale(${stateProps.__scale})`);
        if (stateProps.__translateY != null) xforms.push(`translateY(${stateProps.__translateY})`);
        if (xforms.length) real['transform'] = xforms.join(' ');
        const body = declarationsBlock(real);
        if (body) css += `${stateSelector(sel, stateName)} { ${body} }\n`;
      }
    }
    tag.textContent = css;
  }

  // ---------- Selector ----------
  function getSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return null;
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.body) {
      let part = node.tagName.toLowerCase();
      if (node.className && typeof node.className === 'string') {
        const cls = node.className.trim().split(/\s+/)
          .filter((c) => c && !c.startsWith('live-polish'))
          .slice(0, 3);
        if (cls.length) part += '.' + cls.map((c) => CSS.escape(c)).join('.');
      }
      const parent = node.parentElement;
      if (parent) {
        const sibs = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
        if (sibs.length > 1) part += `:nth-of-type(${sibs.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      if (node.id) { parts[0] = `#${CSS.escape(node.id)}`; break; }
      node = node.parentElement;
    }
    return parts.join(' > ');
  }

  function elementLabel(el, tag) {
    // Prefer aria-label / alt / title
    const aria = el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title'));
    if (aria && aria.trim()) return aria.trim();
    if (tag === 'img') {
      const alt = el.getAttribute('alt');
      if (alt && alt.trim()) return alt.trim();
      const src = el.getAttribute('src') || '';
      const file = src.split('/').pop().split('?')[0];
      return file ? `Image: ${file}` : 'Image';
    }
    if (tag === 'input' || tag === 'textarea') {
      const ph = el.getAttribute('placeholder');
      if (ph && ph.trim()) return `"${ph.trim()}"`;
      const val = el.value;
      if (val && val.trim()) return `"${val.trim().slice(0, 40)}"`;
    }
    // Direct/inner text
    const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
    if (text) return text.length > 40 ? `"${text.slice(0, 40)}…"` : `"${text}"`;
    // Fallback to tag
    return `<${tag}>`;
  }

  function getElementType(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'button' || tag === 'a' || el.getAttribute('role') === 'button') return 'button';
    if (['h1','h2','h3','h4','h5','h6','p','span','label','li'].includes(tag)) return 'text';
    return 'container';
  }

  // Pseudo-states the user can edit for a given element. Empty for text/image.
  function getInteractiveStates(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'button' || el.getAttribute('role') === 'button') return ['hover', 'active', 'disabled'];
    if (tag === 'a') return ['hover', 'active'];
    if (['div','section','article','aside','header','footer','nav','figure'].includes(tag)) return ['hover'];
    return [];
  }
  function statePrettyName(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  // Which props are editable in a given state.
  function statePropAllowed(state, prop) {
    if (state === 'disabled' && prop === 'opacity') return true;
    if ((state === 'hover' || state === 'active') && (prop === 'scale' || prop === 'translateY')) return true;
    // Color/border/shadow always allowed in any non-base state
    return ['background-color','color','border-color','border-width','border-style','box-shadow'].includes(prop);
  }

  // ---------- Color utils ----------
  function hexToRgb(hex) {
    let h = (hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length < 6) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  function withAlpha(hex, alpha) {
    if (alpha >= 1) return hex.toUpperCase();
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 1000) / 1000})`;
  }
  function extractAlpha(value) {
    if (!value) return 1;
    const m = value.match(/rgba\([^)]+,\s*([0-9.]+)\s*\)/);
    return m ? Math.max(0, Math.min(1, parseFloat(m[1]))) : 1;
  }

  // Parse a box-shadow value into structured parts. Defaults to a sensible drop shadow
  // when the input is missing/none.
  function parseShadow(str) {
    const fallback = { offsetX: 0, offsetY: 0, blur: 0, color: 'rgba(0,0,0,0.12)' };
    if (!str || str === 'none') return fallback;
    // getComputedStyle returns "rgba(...) Xpx Ypx Bpx Spx" (color first), inline form
    // is "Xpx Ypx Bpx [Spx] color". Tolerate missing "px" suffix on raw zeros.
    const num = '(-?\\d+(?:\\.\\d+)?)(?:px)?';
    const colorPart = '(rgba?\\([^)]+\\)|#[0-9a-f]+)';
    const inlineRe = new RegExp(`${num}\\s+${num}\\s+${num}(?:\\s+${num})?\\s+${colorPart}`, 'i');
    const colorFirstRe = new RegExp(`${colorPart}\\s+${num}\\s+${num}\\s+${num}(?:\\s+${num})?`, 'i');
    let m = String(str).match(inlineRe);
    if (m) return { offsetX: parseFloat(m[1]), offsetY: parseFloat(m[2]), blur: parseFloat(m[3]), color: m[5] };
    m = String(str).match(colorFirstRe);
    if (m) return { offsetX: parseFloat(m[2]), offsetY: parseFloat(m[3]), blur: parseFloat(m[4]), color: m[1] };
    return fallback;
  }
  function buildShadow({ offsetX = 0, offsetY = 0, blur = 0, color = 'rgba(0,0,0,0.12)' }) {
    return `${offsetX}px ${offsetY}px ${blur}px ${color}`;
  }
  function rgbToHex(rgb) {
    if (!rgb) return '#000000';
    if (rgb.startsWith('#')) return rgb.length === 4
      ? '#' + [...rgb.slice(1)].map((c) => c + c).join('')
      : rgb.slice(0, 7);
    const m = rgb.match(/\d+(\.\d+)?/g);
    if (!m || m.length < 3) return '#000000';
    return '#' + m.slice(0, 3).map((n) => parseInt(n).toString(16).padStart(2, '0')).join('');
  }

  // ---------- V2: Contrast (WCAG) ----------
  function parseColor(str) {
    if (!str) return null;
    if (str.startsWith('#')) {
      const h = str.slice(1);
      if (h.length === 3) return { r: parseInt(h[0]+h[0], 16), g: parseInt(h[1]+h[1], 16), b: parseInt(h[2]+h[2], 16), a: 1 };
      if (h.length === 6 || h.length === 8) return {
        r: parseInt(h.slice(0,2), 16),
        g: parseInt(h.slice(2,4), 16),
        b: parseInt(h.slice(4,6), 16),
        a: h.length === 8 ? parseInt(h.slice(6,8), 16) / 255 : 1,
      };
    }
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
      return { r: parts[0]||0, g: parts[1]||0, b: parts[2]||0, a: parts.length > 3 ? parts[3] : 1 };
    }
    return null;
  }
  function relativeLuminance(c) {
    const toLin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * toLin(c.r) + 0.7152 * toLin(c.g) + 0.0722 * toLin(c.b);
  }
  function contrastRatio(a, b) {
    const l1 = relativeLuminance(a), l2 = relativeLuminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function getEffectiveBackground(el) {
    let node = el;
    while (node) {
      const cs = getComputedStyle(node);
      const bg = parseColor(cs.backgroundColor);
      if (bg && bg.a > 0.5) return bg;
      node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }
  function suggestContrastFix(bg) {
    // Pick black or white based on which gives better contrast against the background.
    const black = { r: 0, g: 0, b: 0 };
    const white = { r: 255, g: 255, b: 255 };
    return contrastRatio(black, bg) > contrastRatio(white, bg) ? '#000000' : '#ffffff';
  }

  // ---------- Highlights ----------
  function makeHighlight(opts) {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'fixed', pointerEvents: 'none', zIndex: 2147483646,
      borderRadius: '2px', display: 'none', transition: 'all 60ms ease-out',
      ...opts,
    });
    document.body.appendChild(el);
    return el;
  }
  function ensureHighlights() {
    if (!selectedHighlight) {
      selectedHighlight = makeHighlight({
        border: '2px solid #4f9eff',
        background: 'transparent',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.4) inset',
      });
    }
    if (!hoverHighlight) {
      // Match VisBug-style magenta ruler aesthetic.
      hoverHighlight = makeHighlight({
        border: '1px dashed #ec4899',
        boxShadow: '0 0 0 1px rgba(236, 72, 153, 0.20)',
        background: 'transparent',
      });
    }
    if (!hoverTooltip) {
      hoverTooltip = document.createElement('div');
      Object.assign(hoverTooltip.style, {
        position: 'fixed', pointerEvents: 'none', zIndex: 2147483647,
        background: '#ec4899', color: '#fff',
        padding: '2px 6px', borderRadius: '4px',
        fontFamily: 'ui-monospace, monospace', fontSize: '10px', fontWeight: '600',
        lineHeight: '1.3', whiteSpace: 'nowrap', display: 'none',
        fontVariantNumeric: 'tabular-nums',
      });
      document.body.appendChild(hoverTooltip);
    }
  }
  function place(node, el) {
    if (!el) { node.style.display = 'none'; return; }
    const r = el.getBoundingClientRect();
    Object.assign(node.style, {
      display: 'block',
      top: r.top + 'px', left: r.left + 'px',
      width: r.width + 'px', height: r.height + 'px',
    });
  }

  // ---------- Toggle ----------
  function toggle() {
    active = !active;
    if (active) {
      ensureHighlights();
      attachListeners();
      showToast('Live Polish: ON');
    } else {
      detachListeners();
      place(selectedHighlight, null);
      place(hoverHighlight, null);
      if (hoverTooltip) hoverTooltip.style.display = 'none';
      clearHoverGuides();
      clearRulerOverlays();
      closePanel();
      showToast('Live Polish: OFF');
    }
  }
  function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      background: '#1a1a1a', color: '#fff', padding: '10px 16px', borderRadius: '8px',
      fontSize: '13px', fontFamily: 'system-ui, sans-serif', zIndex: 2147483647,
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)', pointerEvents: 'none',
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1400);
  }

  function isUI(el) {
    if (!el) return false;
    if (el.closest && (el.closest(`#${UI_ID}`) || el.closest('[data-lp-popover]') || el.closest('[data-lp-popover2-content]') || el.closest('[data-lp-rail-popover]'))) return true;
    // Host-page opt-out: any element with [data-lp-ignore] (or a
    // descendant of one) is invisible to Live Polish — used by the
    // /lab/live-polish.html playground to protect its Coach panel
    // and back-button from accidental edits.
    if (el.closest && el.closest('[data-lp-ignore]')) return true;
    return el === selectedHighlight || el === hoverHighlight;
  }
  function placeTooltip(el) {
    if (!hoverTooltip) return;
    if (!el) { hoverTooltip.style.display = 'none'; return; }
    const tag = el.tagName.toLowerCase();
    const r = el.getBoundingClientRect();
    const w = Math.round(r.width);
    const h = Math.round(r.height);
    hoverTooltip.textContent = `<${tag}>  ${w} × ${h}`;
    hoverTooltip.style.display = 'block';
    const tr = hoverTooltip.getBoundingClientRect();
    // Prefer above the element; fall back below if no room
    let top = r.top - tr.height - 6;
    if (top < 4) top = r.bottom + 6;
    let left = r.left;
    if (left + tr.width > window.innerWidth - 4) left = window.innerWidth - tr.width - 4;
    if (left < 4) left = 4;
    hoverTooltip.style.top = top + 'px';
    hoverTooltip.style.left = left + 'px';
  }
  function onMove(e) {
    if (!active) return;
    const el = e.target;
    if (isUI(el)) { place(hoverHighlight, null); placeTooltip(null); clearHoverGuides(); return; }
    if (el === hoverEl) return;
    hoverEl = el;
    // hover always shown lightly; selected highlight stays put
    if (el === selectedEl) { place(hoverHighlight, null); placeTooltip(null); clearHoverGuides(); }
    else { place(hoverHighlight, el); placeTooltip(el); drawHoverGuides(el); }
    // Distance ruler is always on once an element is selected.
    if (selectedEl && hoverEl && hoverEl !== selectedEl) {
      drawDistanceRuler(selectedEl, hoverEl);
    } else {
      clearRulerOverlays();
    }
  }
  function onClick(e) {
    if (!active) return;
    if (isUI(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    // In audit mode, clicking a flagged element opens its detail in the audit panel.
    if (panelMode === 'audit') {
      const target = e.target;
      const hasIssues = auditIssues.some((i) => i.el === target);
      if (hasIssues && typeof window.__lpRenderAuditDetail === 'function') {
        window.__lpRenderAuditDetail(target);
      }
      return;
    }
    selectElement(e.target);
  }
  function onKey(e) {
    if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault(); toggle(); return;
    }
    if (e.key === 'Escape' && active) {
      if (panel) closePanel(); else toggle();
    }
    if (!active) return;
    // Don't intercept undo/redo while typing into form fields (hex inputs, etc.)
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    const meta = e.metaKey || e.ctrlKey;
    if (!meta) return;
    const k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
  }
  function attachListeners() {
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
  }
  function detachListeners() {
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClick, true);
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', onScroll);
  }
  function onScroll() {
    if (selectedEl) place(selectedHighlight, selectedEl);
    if (hoverEl && hoverEl !== selectedEl) place(hoverHighlight, hoverEl);
    if (panelMode === 'audit' && auditOverlays.length) {
      // Re-derive each overlay's bounding rect (cheaper than re-running the scan).
      renderAuditOverlay(auditIssues);
    }
  }

  function selectElement(el) {
    selectedEl = el;
    place(selectedHighlight, el);
    place(hoverHighlight, null);
    openPanel(el);
  }

  // While the cursor is inside the panel/popover, fade the marker so the live
  // preview is visible underneath. Restore as soon as the cursor returns to the page.
  function dimMarker() {
    if (selectedHighlight) selectedHighlight.style.opacity = '0';
  }
  function restoreMarker() {
    if (selectedHighlight) selectedHighlight.style.opacity = '1';
  }
  document.addEventListener('mousemove', (e) => {
    if (!active || !selectedEl) return;
    const t = e.target;
    const inUI = t && t.closest && (t.closest(`#${UI_ID}`) || t.closest('[data-lp-popover]'));
    if (inUI) dimMarker(); else restoreMarker();
  }, true);

  // ---------- Panel ----------
  function closePanel() {
    document.querySelectorAll('[data-lp-popover]').forEach((p) => p.remove());
    document.querySelectorAll('[data-lp-popover2-content]').forEach((p) => p.remove());
    if (panel) { panel.remove(); panel = null; }
    selectedEl = null;
    if (selectedHighlight) place(selectedHighlight, null);
    // Audit overlays only make sense while the panel is alive in audit mode.
    clearAuditOverlay();
    panelMode = 'edit';
  }
  function auditViewHTML(issues) {
    if (!issues.length) {
      return `<div style="padding:30px 8px;text-align:center;color:#888;font-size:12px;line-height:1.5;">
        <div style="font-size:24px;margin-bottom:6px;">✓</div>
        Everything looks aligned to the 4pt grid.
      </div>`;
    }
    const reds = issues.filter((i) => i.severity === 'red').length;
    const yellows = issues.filter((i) => i.severity === 'yellow').length;
    const groupedByEl = new Map();
    for (const i of issues) {
      if (!groupedByEl.has(i.el)) groupedByEl.set(i.el, []);
      groupedByEl.get(i.el).push(i);
    }
    const elementCount = groupedByEl.size;
    return `
      <div style="margin-bottom:14px;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#888;margin-bottom:8px;font-weight:600;">Spacing audit</div>
        <div style="background:#0e0e0e;border:1px solid #2a2a2a;border-radius:6px;padding:10px 12px;display:flex;gap:14px;align-items:center;">
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#e5e5e5;">
            <span style="width:10px;height:10px;border-radius:2px;background:#ef4444;"></span>${reds}
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#e5e5e5;">
            <span style="width:10px;height:10px;border-radius:2px;background:#eab308;"></span>${yellows}
          </div>
          <div style="margin-left:auto;font-size:11px;color:#888;">${elementCount} element${elementCount===1?'':'s'}</div>
        </div>
      </div>
      <div style="font-size:11px;color:#888;line-height:1.5;">
        Click any highlighted element on the page to see details and a one-click fix.
      </div>`;
  }
  function auditDetailHTML(targetEl, allIssues) {
    const elIssues = allIssues.filter((i) => i.el === targetEl);
    const tag = targetEl.tagName.toLowerCase();
    const text = (targetEl.innerText || '').trim().slice(0, 40).replace(/\s+/g, ' ');
    const head = `
      <div style="margin-bottom:10px;">
        <button type="button" data-lp-audit-back style="background:none;border:none;color:#888;font-size:11px;cursor:pointer;padding:0;">← Back to summary</button>
      </div>
      <div style="margin-bottom:14px;">
        <div style="font-weight:600;font-size:13px;color:#e5e5e5;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${text || '<' + tag + '>'}</div>
        <div style="font-size:11px;color:#888;margin-top:2px;">&lt;${tag}&gt;</div>
      </div>`;
    if (!elIssues.length) {
      return head + `<div style="font-size:12px;color:#888;line-height:1.5;">No off-grid spacing on this element.</div>`;
    }
    const rows = elIssues.map((i, idx) => {
      const sevColor = i.severity === 'red' ? '#ef4444' : '#eab308';
      const similarCount = allIssues.filter((o) => o.el !== targetEl && o.el.tagName === targetEl.tagName && o.prop === i.prop).length;
      return `
        <div style="background:#0e0e0e;border:1px solid #2a2a2a;border-radius:6px;padding:10px 12px;margin-bottom:6px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="width:8px;height:8px;border-radius:2px;background:${sevColor};flex-shrink:0;"></span>
            <span style="font-family:ui-monospace,monospace;font-size:12px;color:#e5e5e5;">${i.prop}</span>
            <span style="margin-left:auto;font-size:11px;color:#cfcfcf;font-family:ui-monospace,monospace;">${i.value}px → ${i.suggested}px</span>
          </div>
          <div style="display:flex;gap:6px;">
            <button type="button" data-lp-audit-fix data-idx="${idx}" style="flex:1;background:#2a2a2a;color:#e5e5e5;border:none;padding:6px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:500;">Fix</button>
            ${similarCount ? `<button type="button" data-lp-audit-fix-similar data-idx="${idx}" style="flex:1;background:#4f9eff;color:#fff;border:none;padding:6px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:600;">Fix all (${similarCount + 1})</button>` : ''}
          </div>
        </div>`;
    }).join('');
    return head + rows;
  }
  function fixIssue(issue) {
    const sel = getSelector(issue.el);
    if (!sel) return;
    if (!overrides[sel]) overrides[sel] = {};
    overrides[sel][issue.prop] = issue.suggested + 'px';
  }
  function applyAuditFixes(targetIssues) {
    if (!targetIssues.length) return;
    lastUndoCheckpoint = 0;
    pushUndo();
    suppressUndo = true;
    try {
      for (const issue of targetIssues) fixIssue(issue);
      saveOverrides();
    } finally {
      suppressUndo = false;
    }
  }

  function openPanel(el) {
    if (panel) panel.remove();
    // Clean up any popovers orphaned in body by the previous panel render.
    document.querySelectorAll('[data-lp-popover]').forEach((p) => p.remove());
    document.querySelectorAll('[data-lp-popover2-content]').forEach((p) => p.remove());
    const type = getElementType(el);
    const sel = getSelector(el);
    const cs = getComputedStyle(el);

    panel = document.createElement('div');
    panel.id = UI_ID;
    Object.assign(panel.style, {
      position: 'fixed', top: '60px', right: '20px',
      width: panelMinimized ? 'auto' : '360px',
      maxHeight: 'calc(100vh - 80px)',
      overflowY: panelMinimized ? 'visible' : 'auto',
      background: panelMinimized ? 'transparent' : '#171717',
      color: '#e5e5e5', borderRadius: '12px',
      boxShadow: panelMinimized ? 'none' : '0 10px 40px rgba(0,0,0,0.5)',
      fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '13px', lineHeight: '1.4',
      zIndex: 2147483647,
      border: panelMinimized ? 'none' : '1px solid #2a2a2a',
    });
    panel.innerHTML = panelHTML(el, type, sel, cs);
    document.body.appendChild(panel);
    wirePanel(el, type, sel, cs);
  }

  // V2 IA helpers — pill group / button / indicator (used for mode + state pills).
  const PILL_GROUP_BASE = `position:relative;display:flex;background:#0e0e0e;border:1px solid #2a2a2a;border-radius:6px;padding:2px;overflow:hidden;`;
  function pillBtnStyle(active) {
    return `position:relative;z-index:1;flex:1;background:transparent;color:${active?'#e5e5e5':'#888'};border:none;padding:5px 0;border-radius:4px;cursor:pointer;font-size:11px;font-weight:500;transition:color 180ms ease-out;`;
  }
  const PILL_INDICATOR_HTML = `<span data-lp-indicator style="position:absolute;top:0;left:0;width:0;height:0;background:#2a2a2a;border-radius:4px;pointer-events:none;will-change:transform,width,height;opacity:0;"></span>`;

  function panelHTML(el, type, sel, cs) {
    const tag = el.tagName.toLowerCase();
    const label = elementLabel(el, tag);
    const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const escHTML = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const draft = Object.assign({}, overrides[sel] || {});
    const interactiveStates = getInteractiveStates(el);
    const hasStates = interactiveStates.length > 0;
    const allStates = hasStates ? ['default', ...interactiveStates] : [];
    if (!hasStates) panelState = 'default';
    else if (!allStates.includes(panelState)) panelState = 'default';

    // Edit/Audit is a panel-level mode, not a sibling of the per-state pill row.
    // It lives in the header (next to minimize/close) so the visual hierarchy is clear.
    const modeBar = '';

    const stateBar = hasStates ? `<div data-lp-pill-group="state" style="${PILL_GROUP_BASE}margin:8px 14px 0;display:${panelMode==='audit'?'none':'flex'};">
      ${PILL_INDICATOR_HTML}
      ${allStates.map((s) => {
        const active = panelState === s;
        return `<button type="button" data-lp-state="${s}" data-lp-active="${active?'true':'false'}" style="${pillBtnStyle(active)}">${capitalise(s)}</button>`;
      }).join('')}
    </div>` : '';

    const showTransform = hasStates && (panelState === 'hover' || panelState === 'active');
    const editBody = `<div data-lp-edit-views style="display:${panelMode==='audit'?'none':'block'};">
      ${type === 'text' ? `<div style="padding:14px 14px 0;">${contrastBadgeHTML(el, cs)}</div>` : ''}
      ${spacingSection(el, cs, draft)}
      ${appearanceSection(el, cs, draft, type)}
      ${typographySection(el, cs, draft, type)}
      ${showTransform ? transformSection(el, cs, draft) : ''}
      ${hasStates ? `<div style="padding:14px;border-top:1px solid #2a2a2a;">${quickPresetsHTML(draft.__activePreset).replace('<div style="margin-top:4px;padding-top:14px;border-top:1px solid #2a2a2a;">', '<div>')}</div>` : ''}
      ${hasStates ? `<div style="padding:0 14px 14px;">${transitionRowHTML(draft.__transition)}</div>` : ''}
    </div>`;

    const auditBody = `<div data-lp-view="audit" style="display:${panelMode==='audit'?'block':'none'};padding:14px;"></div>`;

    const actions = `<div style="padding:10px 14px 12px;border-top:1px solid #2a2a2a;background:#1a1a1a;border-radius:0 0 12px 12px;position:sticky;bottom:0;">
      <div data-lp-scope-row style="display:flex;justify-content:flex-start;margin-bottom:8px;">
        <div data-lp-scope style="display:inline-flex;background:#0e0e0e;border:1px solid #2a2a2a;border-radius:6px;padding:2px;">
          <button data-lp-scope-val="this" style="background:#2a2a2a;color:#e5e5e5;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:500;">This element</button>
          <button data-lp-scope-val="all" style="background:transparent;color:#888;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:500;">All <span data-lp-scope-count style="opacity:0.7;"></span></button>
        </div>
      </div>
      <div style="display:flex;gap:6px;align-items:stretch;">
        <button type="button" data-lp-reset title="Revert all changes for this element" style="background:transparent;color:#888;border:1px solid #2a2a2a;padding:9px 12px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:500;flex-shrink:0;">Reset</button>
        <button type="button" data-lp-copy="css" style="flex:1;background:transparent;color:#cfcfcf;border:1px solid #2a2a2a;padding:9px 0;border-radius:7px;cursor:pointer;font-size:12px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:5px;">⧉ Copy CSS</button>
        <button type="button" data-lp-copy="prompt" style="flex:1.6;background:#4f9eff;color:#fff;border:none;padding:9px 0;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:5px;">✦ Copy AI Prompt</button>
      </div>
    </div>`;

    // VisBug-style minimized rail — slim vertical column of icon actions.
    if (panelMinimized) {
      // Lucide-style icon set: 18x18, 2px stroke, currentColor, rounded line caps.
      const SVG = (paths, opts) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="${(opts&&opts.fill)||'none'}" stroke="currentColor" stroke-width="${(opts&&opts.weight)||1.75}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
      const ICONS = {
        expand: SVG('<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>'),
        spacing: SVG('<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1" stroke-dasharray="2 2"/>'),
        appearance: SVG('<path d="M21 9V5a2 2 0 0 0-2-2h-4"/><path d="M3 15v4a2 2 0 0 0 2 2h4"/><path d="M3 9V5a2 2 0 0 1 2-2h4"/><path d="M21 15v4a2 2 0 0 1-2 2h-4"/>'),
        fill: SVG('<rect x="3" y="3" width="18" height="18" rx="2"/>', { fill: 'currentColor' }),
        text: SVG('<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>'),
        stroke: SVG('<rect x="3" y="3" width="18" height="18" rx="2"/>', { weight: 2.5 }),
        effects: SVG('<rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 21h12a2 2 0 0 0 2-2V7" stroke-dasharray="3 3"/>'),
        typography: SVG('<path d="m3 15 4-8 4 8"/><path d="M4 13h6"/><circle cx="18" cy="13" r="3"/><path d="M21 10v6"/>'),
        transform: SVG('<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>'),
        audit: SVG('<circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16" y2="16"/>'),
        editPencil: SVG('<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>'),
        copy: SVG('<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/>'),
        close: SVG('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
      };
      const railBtn = (id, ttl, iconKey, active, accent) =>
        `<button type="button" data-lp-rail="${id}" title="${ttl}" style="width:40px;height:40px;background:${accent ? '#4f9eff' : (active?'#2a2a2a':'transparent')};color:${accent ? '#fff' : (active?'#e5e5e5':'#aaa')};border:none;border-radius:8px;cursor:pointer;line-height:0;display:flex;align-items:center;justify-content:center;transition:background-color 150ms ease, color 150ms ease;">${ICONS[iconKey]}</button>`;
      const divider = `<div style="width:24px;height:1px;background:#2a2a2a;margin:2px 0;"></div>`;
      const showTypography = type === 'text' || type === 'button';
      const showTransform = hasStates && (panelState === 'hover' || panelState === 'active');
      const showFill = type !== 'text';
      return `
        <div data-lp-drag style="cursor:move;padding:8px 5px;display:flex;flex-direction:column;gap:2px;align-items:center;background:#1f1f1f;border-radius:14px;border:1px solid #2a2a2a;">
          ${railBtn('expand', 'Expand panel', 'expand')}
          ${divider}
          ${railBtn('spacing', 'Spacing', 'spacing')}
          ${railBtn('appearance', 'Appearance — radius', 'appearance')}
          ${showFill ? railBtn('fill', 'Fill — background', 'fill') : ''}
          ${railBtn('text', 'Text color', 'text')}
          ${railBtn('stroke', 'Stroke — border', 'stroke')}
          ${railBtn('effects', 'Effects — shadow', 'effects')}
          ${showTypography ? railBtn('typography', 'Typography', 'typography') : ''}
          ${showTransform ? railBtn('transform', 'Transform', 'transform') : ''}
          ${divider}
          ${railBtn('audit', panelMode==='audit'?'Switch to edit':'Run audit', panelMode==='audit'?'editPencil':'audit', panelMode==='audit')}
          ${railBtn('copy', 'Copy AI Prompt', 'copy', false, true)}
          ${divider}
          ${railBtn('close', 'Close', 'close')}
        </div>
      `;
    }
    return `
      <div data-lp-drag style="cursor:move;padding:12px 14px;border-bottom:1px solid #2a2a2a;display:flex;justify-content:space-between;align-items:center;background:#1f1f1f;border-radius:12px 12px 0 0;">
        <div style="min-width:0;flex:1;">
          <div style="font-weight:600;font-size:13px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escAttr(label)}">${escHTML(label)}</div>
          <div style="font-size:11px;color:#888;margin-top:2px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escAttr(sel || '')}">&lt;${tag}&gt; · ${type}</div>
        </div>
        <div style="display:flex;gap:2px;align-items:center;flex-shrink:0;">
          <button type="button" data-lp-mode-toggle title="${panelMode==='audit'?'Switch back to edit':'Run page audit'}" style="background:${panelMode==='audit'?'#4f9eff':'transparent'};border:1px solid ${panelMode==='audit'?'#4f9eff':'#2a2a2a'};color:${panelMode==='audit'?'#fff':'#cfcfcf'};cursor:pointer;padding:4px 8px 4px 6px;border-radius:6px;font-size:11px;font-weight:500;line-height:1;display:inline-flex;align-items:center;gap:5px;transition:background-color 150ms ease, color 150ms ease, border-color 150ms ease;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16" y2="16"/></svg>
            <span>${panelMode==='audit' ? 'Audit on' : 'Audit'}</span>
          </button>
          <button type="button" data-lp-minimize title="Minimize to icon rail" style="background:none;border:none;color:#888;font-size:14px;cursor:pointer;padding:2px 6px;line-height:1;">−</button>
          <button data-lp-close style="background:none;border:none;color:#888;font-size:18px;cursor:pointer;padding:0 4px;line-height:1;">×</button>
        </div>
      </div>
      ${modeBar}
      ${stateBar}
      ${editBody}
      ${auditBody}
      ${actions}
    `;
  }

  // ---------- Sections ----------
  const PAD_STEPS = [4, 8, 12, 16, 20, 24, 32, 40, 48];

  function sectionWrap(title, body) {
    return `<div style="margin-bottom:14px;">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#888;margin-bottom:8px;font-weight:600;display:flex;align-items:center;">${title}</div>
      ${body}
    </div>`;
  }
  // Collapsible: when inactive, render only "TITLE +" row; click + to reveal controls.
  function collapsibleSection(key, isActive, title, body) {
    const safeKey = String(key).replace(/[^a-z0-9-]/gi, '');
    return `
      <div data-lp-section="${safeKey}" style="margin-bottom:14px;">
        <div data-lp-section-compact style="display:${isActive ? 'none' : 'flex'};justify-content:space-between;align-items:center;padding:6px 0;">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#888;font-weight:600;">${title}</div>
          <button data-lp-section-add style="background:#0e0e0e;color:#888;border:1px solid #2a2a2a;width:22px;height:22px;border-radius:5px;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;">+</button>
        </div>
        <div data-lp-section-full style="display:${isActive ? 'block' : 'none'};">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#888;margin-bottom:8px;font-weight:600;display:flex;justify-content:space-between;align-items:center;">
            <span>${title}</span>
            <button data-lp-section-remove title="Hide section" style="background:none;border:none;color:#666;cursor:pointer;font-size:14px;line-height:1;padding:0 2px;">−</button>
          </div>
          ${body}
        </div>
      </div>`;
  }
  function paidBadge() { return ''; }
  // Figma-style section: bold black header, subtle top divider.
  // Sections that already hold a value render expanded with their full editor.
  // Sections without a value render compact ("TITLE  +") — the + adds a default
  // value, which causes a re-render that surfaces the full editor.
  function figmaSection(title, body, opts) {
    opts = opts || {};
    const key = opts.key || String(title).toLowerCase().replace(/[^a-z0-9]/g, '');
    const hasValue = opts.hasValue !== false;
    if (!hasValue) {
      return `<div data-lp-section3 data-lp-key="${key}" style="padding:14px;border-top:1px solid #2a2a2a;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;font-weight:600;color:#e5e5e5;letter-spacing:-0.01em;">${title}</span>
        <button type="button" data-lp-section3-add data-add="${key}" title="Add ${title.toLowerCase()}" style="background:transparent;border:1px solid #2a2a2a;color:#a1a1aa;width:24px;height:24px;border-radius:6px;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;transition:background-color 150ms ease, color 150ms ease;">+</button>
      </div>`;
    }
    return `<div data-lp-section3 data-lp-key="${key}" style="padding:14px;border-top:1px solid #2a2a2a;">
      <div style="margin-bottom:12px;">
        <span style="font-size:13px;font-weight:600;color:#e5e5e5;letter-spacing:-0.01em;">${title}</span>
      </div>
      ${body}
    </div>`;
  }
  // V2 IA: a collapsed control that opens a floating popover (Figma-style). The
  // trigger button shows a summary; the popover holds the full editor.
  function popoverRow(key, summaryHTML, popoverContentHTML) {
    const safeKey = String(key).replace(/[^a-z0-9-]/gi, '');
    return `<div data-lp-popover2 data-key="${safeKey}" style="position:relative;">
      <button type="button" data-lp-popover2-trigger style="display:flex;align-items:center;gap:8px;width:100%;background:#0e0e0e;border:1px solid #2a2a2a;border-radius:6px;padding:5px 8px;cursor:pointer;color:#e5e5e5;font-size:12px;text-align:left;">
        ${summaryHTML}
      </button>
      <div data-lp-popover2-content style="display:none;position:fixed;width:280px;background:#1f1f1f;border:1px solid #2a2a2a;border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,0.5);padding:12px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;font-size:13px;line-height:1.4;color:#e5e5e5;">
        ${popoverContentHTML}
      </div>
    </div>`;
  }
  // V2 IA: chevron-toggle collapsible section. Default-expand based on the `expanded` arg
  // unless the user previously set a preference for this key (sectionMemory).
  function collapsible2(key, title, expanded, body) {
    const safeKey = String(key).replace(/[^a-z0-9-]/gi, '');
    const open = sectionMemory[safeKey] != null ? sectionMemory[safeKey] : expanded;
    return `<div data-lp-section2 data-lp-key="${safeKey}" style="margin-bottom:6px;">
      <button type="button" data-lp-section2-toggle style="display:flex;align-items:center;justify-content:space-between;width:100%;background:none;border:none;color:#888;padding:8px 0;cursor:pointer;text-align:left;">
        <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:#888;">${title}</span>
        <span data-lp-chevron style="display:inline-block;font-size:11px;color:#666;transform:rotate(${open?180:0}deg);transition:transform 200ms ease-out;">▾</span>
      </button>
      <div data-lp-section2-body style="display:${open?'block':'none'};padding-bottom:8px;">${body}</div>
    </div>`;
  }
  function rowLabel(label, control) {
    return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px;">
      <div style="color:#aaa;font-size:12px;flex-shrink:0;">${label}</div>
      <div style="display:flex;align-items:center;gap:6px;">${control}</div>
    </div>`;
  }
  function stepperBtnCSS() {
    return 'background:#2a2a2a;color:#e5e5e5;border:none;width:24px;height:24px;border-radius:5px;cursor:pointer;font-size:14px;line-height:1;';
  }
  // Drag-to-scrub row: label on left, value on right, the whole row scrubs the value.
  // Width fill behind shows position. Sensitivity = how many px to traverse full range.
  function scrubberHTML(name, min, max, value, suffix, opts) {
    opts = opts || {};
    const decimals = opts.decimals || 0;
    const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    const display = (decimals ? Number(value).toFixed(decimals) : Math.round(value)) + (suffix || '');
    return `<div data-lp-scrub data-min="${min}" data-max="${max}" data-suffix="${suffix || ''}" data-decimals="${decimals}" data-value="${value}"
        style="position:relative;display:flex;justify-content:space-between;align-items:center;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:6px;padding:7px 12px;cursor:ew-resize;overflow:hidden;user-select:none;line-height:1.2;">
      <div data-lp-scrub-fill style="position:absolute;left:0;top:0;bottom:0;width:${pct}%;background:#3a3a3a;border-radius:0 3px 3px 0;pointer-events:none;transition:width 60ms ease-out;"></div>
      <div data-lp-scrub-handle style="position:absolute;top:0;bottom:0;left:calc(${pct}% - 1px);width:2px;background:#7dc4ff;pointer-events:none;opacity:0;transition:left 60ms ease-out, opacity 120ms ease-out;box-shadow:0 0 6px rgba(125,196,255,0.5);"></div>
      <span style="position:relative;z-index:1;color:#cfcfcf;font-size:11px;font-weight:500;">${name}</span>
      <span data-lp-scrub-val style="position:relative;z-index:1;color:#fff;font-size:11px;font-family:ui-monospace,monospace;font-weight:500;">${display}</span>
    </div>`;
  }
  function wireScrubber(el, onChange) {
    const min = parseFloat(el.dataset.min);
    const max = parseFloat(el.dataset.max);
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals) || 0;
    const fill = el.querySelector('[data-lp-scrub-fill]');
    const handle = el.querySelector('[data-lp-scrub-handle]');
    const valEl = el.querySelector('[data-lp-scrub-val]');
    const STRETCH_HEADROOM = 10; // px reserved at each end so rubber-stretch is visible inside the box
    function setValue(v, fire) {
      v = Math.max(min, Math.min(max, v));
      el.dataset.value = v;
      const pct = ((v - min) / (max - min)) * 100;
      const w = el.getBoundingClientRect().width;
      const usable = Math.max(0, w - STRETCH_HEADROOM * 2);
      const naturalPx = STRETCH_HEADROOM + (pct / 100) * usable;
      fill.style.width = naturalPx + 'px';
      if (handle) handle.style.left = `${naturalPx - 1}px`;
      valEl.textContent = (decimals ? v.toFixed(decimals) : Math.round(v)) + suffix;
      if (fire !== false) onChange(decimals ? v : Math.round(v));
    }
    function showHandle(on) { if (handle) handle.style.opacity = on ? '1' : '0'; }
    el.addEventListener('mouseenter', () => { if (!dragging) showHandle(true); });
    el.addEventListener('mouseleave', () => { if (!dragging) showHandle(false); });
    let dragging = false, startX = 0, startVal = 0;
    el.addEventListener('mousedown', (e) => {
      dragging = true;
      startX = e.clientX;
      startVal = parseFloat(el.dataset.value);
      showHandle(true);
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const range = max - min;
      const raw = startVal + (dx / 180) * range;
      setValue(raw);
      // Rubber-band: stretch the right edge of the fill into the headroom on overshoot.
      // Capped so it never extends past the container (max = the box).
      const w = el.getBoundingClientRect().width;
      let extraPx = 0;
      if (raw > max) {
        const overPx = (raw - max) * (180 / range);
        extraPx = STRETCH_HEADROOM * (1 - 1 / (1 + overPx / 40)); // asymptotic to STRETCH_HEADROOM
      }
      if (extraPx > 0) {
        const base = parseFloat(fill.style.width);
        const stretched = Math.min(w, base + extraPx);
        fill.style.transition = 'width 0ms';
        fill.style.width = stretched + 'px';
        if (handle) handle.style.left = `${stretched - 1}px`;
      }
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      fill.style.transition = 'width 260ms cubic-bezier(.2,.9,.3,1.3)';
      setValue(parseFloat(el.dataset.value), false);
      if (!el.matches(':hover')) showHandle(false);
    });
    el._setValue = setValue;
    return el;
  }
  function stepperHTML(prop, value, mode) {
    return `<button data-lp-stepper="${prop}" data-mode="${mode}" data-dir="-1" style="${stepperBtnCSS()}">−</button>
      <input data-lp-input="${prop}" data-mode="${mode}" type="text" value="${value}px" style="width:60px;background:#0e0e0e;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:5px;padding:4px 6px;text-align:center;font-size:12px;" />
      <button data-lp-stepper="${prop}" data-mode="${mode}" data-dir="1" style="${stepperBtnCSS()}">+</button>`;
  }
  function segHTML(prop, options, current) {
    return `<div style="display:flex;background:#0e0e0e;border-radius:6px;padding:2px;">
      ${options.map((opt) =>
        `<button data-lp-seg="${prop}" data-val="${opt.v}" style="background:${current == opt.v ? '#4f9eff' : 'transparent'};color:${current == opt.v ? '#fff' : '#aaa'};border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:500;">${opt.l}</button>`
      ).join('')}
    </div>`;
  }
  function fontSelectHTML(current) {
    return `<select data-lp-font style="width:100%;background:#0e0e0e;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:5px;padding:6px 8px;font-size:12px;">
      ${FONTS.map((f) => `<option value="${f.label}" ${current && current.includes(f.stack.split(',')[0].replace(/"/g,'').trim()) ? 'selected' : ''}>${f.label}</option>`).join('')}
    </select>`;
  }

  // Color block: compact swatch button that opens a Figma-style popover
  // opts.noGradient = true → hide the gradient tab (e.g. for box-shadow color)
  function colorBlockHTML(prop, currentValue, isText, opts) {
    opts = opts || {};
    const noGradient = !!opts.noGradient;
    const isGrad = typeof currentValue === 'string' && currentValue.includes('gradient');
    let solidHex = '#000000', stop1 = '#4f46e5', stop2 = '#06b6d4', angle = 135;
    let alpha = extractAlpha(typeof currentValue === 'string' ? currentValue : '');
    if (isGrad) {
      const m = currentValue.match(/linear-gradient\((\d+)deg,\s*([^,]+(?:,\s*[\d.]+\s*\))?),\s*([^)]+(?:,\s*[\d.]+\s*\))?)\)/);
      if (m) { angle = parseInt(m[1]); stop1 = rgbToHex(m[2].trim()); stop2 = rgbToHex(m[3].trim()); }
    } else {
      solidHex = rgbToHex(currentValue);
    }
    const alphaPct = Math.round(alpha * 100);
    // Chip preview: render at full opacity so the color is always visible.
    // The alpha is communicated via the "· N%" label on the right.
    const chipBg = isGrad
      ? `linear-gradient(${angle}deg, ${stop1}, ${stop2})`
      : solidHex;
    const display = isGrad ? 'Gradient' : solidHex.toUpperCase();

    return `<div data-lp-colorblock data-prop="${prop}" data-text="${isText ? 1 : 0}" style="position:relative;">
      <button type="button" data-lp-swatch style="display:flex;align-items:center;gap:8px;width:100%;background:#0e0e0e;border:1px solid #2a2a2a;border-radius:6px;padding:5px 8px;cursor:pointer;color:#e5e5e5;font-size:12px;font-family:ui-monospace,monospace;">
        <span style="width:22px;height:22px;border-radius:4px;border:1px solid #2a2a2a;flex-shrink:0;background:${chipBg};"></span>
        <span style="text-transform:uppercase;">${display}</span>
      </button>

      <div data-lp-popover data-mode="${isGrad ? 'gradient' : 'solid'}" style="display:none;position:fixed;width:260px;background:#1f1f1f;border:1px solid #2a2a2a;border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,0.5);padding:10px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;font-size:13px;line-height:1.4;color:#e5e5e5;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
          <div style="display:${noGradient ? 'none' : 'flex'};background:#0e0e0e;border-radius:6px;padding:2px;flex:1;">
            <button data-lp-mode="solid" title="Solid" style="flex:1;background:${!isGrad ? '#4f9eff' : 'transparent'};border:none;padding:5px;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
              <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#e5e5e5;border:1px solid #444;"></span>
            </button>
            <button data-lp-mode="gradient" title="Gradient" style="flex:1;background:${isGrad ? '#4f9eff' : 'transparent'};border:none;padding:5px;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
              <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:linear-gradient(135deg,#4f46e5,#06b6d4);border:1px solid #444;"></span>
            </button>
          </div>
          ${noGradient ? '<div style="flex:1;font-size:11px;color:#888;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Color</div>' : ''}
          <button data-lp-popover-close title="Close" style="width:26px;height:26px;background:#0e0e0e;border:1px solid #2a2a2a;border-radius:6px;color:#888;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;flex-shrink:0;">×</button>
        </div>

        <div data-lp-solid style="display:${isGrad ? 'none' : 'block'};">
          <div style="display:flex;gap:6px;align-items:center;">
            <input data-lp-solid-pick type="color" value="${solidHex}" style="width:36px;height:30px;border:none;background:none;cursor:pointer;padding:0;" />
            <input data-lp-solid-hex type="text" value="${solidHex.toUpperCase()}" style="flex:1;background:#0e0e0e;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:5px;padding:6px 8px;font-size:12px;font-family:ui-monospace,monospace;text-transform:uppercase;" />
            <button data-lp-pal-save title="Save to palette" style="width:28px;height:28px;background:#0e0e0e;border:1px solid #2a2a2a;color:#888;border-radius:5px;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;flex-shrink:0;">+</button>
          </div>
        </div>

        <div data-lp-grad style="display:${isGrad ? 'block' : 'none'};">
          <div style="height:32px;border-radius:5px;margin-bottom:8px;background:linear-gradient(${angle}deg, ${stop1}, ${stop2});border:1px solid #2a2a2a;" data-lp-grad-preview></div>
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
            <input data-lp-grad-pick1 type="color" value="${stop1}" style="width:32px;height:26px;border:none;background:none;cursor:pointer;padding:0;" />
            <input data-lp-grad-hex1 type="text" value="${stop1.toUpperCase()}" style="flex:1;background:#0e0e0e;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:5px;padding:5px 6px;font-size:11px;font-family:ui-monospace,monospace;text-transform:uppercase;" />
          </div>
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
            <input data-lp-grad-pick2 type="color" value="${stop2}" style="width:32px;height:26px;border:none;background:none;cursor:pointer;padding:0;" />
            <input data-lp-grad-hex2 type="text" value="${stop2.toUpperCase()}" style="flex:1;background:#0e0e0e;color:#e5e5e5;border:1px solid #2a2a2a;border-radius:5px;padding:5px 6px;font-size:11px;font-family:ui-monospace,monospace;text-transform:uppercase;" />
          </div>
          <div data-lp-angle-wrap>
            ${scrubberHTML('Angle', 0, 360, angle, '°')}
          </div>
        </div>

        <div data-lp-opacity-wrap style="margin-top:8px;">
          ${scrubberHTML('Opacity', 0, 100, alphaPct, '%')}
        </div>

        <div style="margin-top:12px;padding-top:10px;border-top:1px solid #2a2a2a;">
          <div style="font-size:10px;color:#666;margin-bottom:6px;">SAVED COLORS</div>
          <div data-lp-pal-row style="display:flex;flex-wrap:wrap;gap:4px;"></div>
        </div>
      </div>
    </div>`;
  }

  // ----- V2 IA: state-aware section builders (Figma-style) -----
  function spacingSection(el, cs, draft) {
    const isFlexGrid = ['flex','grid','inline-flex','inline-grid'].includes(cs.display);
    const padding = parseInt(effectiveAt(panelState, draft, 'padding-top', cs.paddingTop)) || 0;
    const gap = parseInt(effectiveAt(panelState, draft, 'gap', cs.gap)) || 0;
    return figmaSection('Spacing',
      rowLabel('Padding', stepperHTML('padding', padding, 'one')) +
      (isFlexGrid ? rowLabel('Gap', stepperHTML('gap', gap, 'one')) : ''),
      { key: 'spacing' } // always shown — padding is fundamental
    );
  }
  function appearanceSection(el, cs, draft, type) {
    const radius = parseInt(effectiveAt(panelState, draft, 'border-radius', cs.borderTopLeftRadius)) || 0;
    const bgValStored = effectiveAt(panelState, draft, 'background-image', null);
    const bgVal = (bgValStored && String(bgValStored).includes('gradient'))
      ? bgValStored
      : effectiveAt(panelState, draft, 'background-color', cs.backgroundColor);
    const colorVal = effectiveAt(panelState, draft, 'color', cs.color);
    const borderColorVal = effectiveAt(panelState, draft, 'border-color', cs.borderTopColor);
    const borderWidth = parseInt(effectiveAt(panelState, draft, 'border-width', cs.borderTopWidth)) || 0;
    const shadowSrc = effectiveAt(panelState, draft, 'box-shadow', cs.boxShadow || '');
    const shadowMatch = (shadowSrc || '').toString().match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/i);
    const shadowColorVal = shadowMatch ? shadowMatch[0] : 'rgba(0,0,0,0.5)';
    const shadowParts = parseShadow(shadowSrc);
    const includeBg = type !== 'text';
    const hasShadow = shadowParts.offsetX !== 0 || shadowParts.offsetY !== 0 || shadowParts.blur > 0;
    const shadowPreview = `<span style="width:22px;height:22px;border-radius:4px;background:#fff;border:1px solid #2a2a2a;flex-shrink:0;box-shadow:${hasShadow ? buildShadow(shadowParts) : 'none'};"></span>`;
    const shadowSummaryText = hasShadow
      ? `<span style="flex:1;font-family:ui-monospace,monospace;">${shadowParts.offsetX} · ${shadowParts.offsetY} · ${shadowParts.blur}</span>`
      : `<span style="flex:1;color:#888;">No shadow</span>`;
    const shadowPopoverContent = `
      <div style="font-size:13px;font-weight:600;color:#e5e5e5;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
        <span>Drop shadow</span>
        <button type="button" data-lp-popover2-close style="width:22px;height:22px;background:#0e0e0e;border:1px solid #2a2a2a;border-radius:5px;color:#888;cursor:pointer;font-size:14px;line-height:1;">×</button>
      </div>
      ${rowLabel('X', stepperHTML('shadow-x', shadowParts.offsetX, 'one'))}
      ${rowLabel('Y', stepperHTML('shadow-y', shadowParts.offsetY, 'one'))}
      ${rowLabel('Blur', stepperHTML('shadow-blur', shadowParts.blur, 'one'))}
      ${rowLabel('Color', colorBlockHTML('shadow-color', shadowColorVal, false, { noGradient: true }))}
    `;
    // Split into Figma-style sections. Each starts compact unless the property
    // already has a value (so an unstyled element shows a tidy stack of "TITLE +" rows).
    const hasBg = !!(bgValStored || (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent'));
    const colorHasOverride = !!effectiveAt(panelState, draft, 'color', null);
    return (
      figmaSection('Appearance',
        rowLabel('Radius', stepperHTML('border-radius', radius, 'one')),
        { key: 'appearance' } // radius is fundamental — always shown
      ) +
      (includeBg ? figmaSection('Fill',
        colorBlockHTML('background', bgVal, false),
        { key: 'fill', hasValue: hasBg }
      ) : '') +
      figmaSection('Text',
        colorBlockHTML('color', colorVal, true),
        { key: 'text' } // color always exists on text — always shown
      ) +
      figmaSection('Stroke',
        rowLabel('Width', stepperHTML('border-width', borderWidth, 'one')) +
        (borderWidth > 0 ? rowLabel('Color', colorBlockHTML('border-color', borderColorVal, false)) : ''),
        { key: 'stroke', hasValue: borderWidth > 0 }
      ) +
      figmaSection('Effects',
        popoverRow('shadow', shadowPreview + shadowSummaryText, shadowPopoverContent),
        { key: 'effects', hasValue: hasShadow }
      )
    );
  }
  function typographySection(el, cs, draft, type) {
    const size = parseInt(effectiveAt(panelState, draft, 'font-size', cs.fontSize)) || 16;
    const fontFam = effectiveAt(panelState, draft, 'font-family', cs.fontFamily);
    const weight = effectiveAt(panelState, draft, 'font-weight', cs.fontWeight);
    const lh = effectiveAt(panelState, draft, 'line-height', cs.lineHeight);
    const fontDisplay = String(fontFam || 'System').split(',')[0].replace(/['"]/g, '').trim();
    const summary = `<span style="flex:1;">${fontDisplay} · ${size}px · ${weight}</span>`;
    const popoverContent = `
      <div style="font-size:13px;font-weight:600;color:#e5e5e5;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
        <span>Typography</span>
        <button type="button" data-lp-popover2-close style="width:22px;height:22px;background:#0e0e0e;border:1px solid #2a2a2a;border-radius:5px;color:#888;cursor:pointer;font-size:14px;line-height:1;">×</button>
      </div>
      ${rowLabel('Font', fontSelectHTML(fontFam))}
      ${rowLabel('Size', stepperHTML('font-size', size, 'one'))}
      ${rowLabel('Weight', segHTML('font-weight', [
        { v: 400, l: '400' }, { v: 500, l: '500' }, { v: 600, l: '600' }, { v: 700, l: '700' }
      ], weight))}
      ${rowLabel('Line', segHTML('line-height', [
        { v: '1.1', l: 'Tight' }, { v: '1.5', l: 'Normal' }, { v: '1.75', l: 'Relax' }, { v: '2', l: 'Loose' }
      ], lh))}
    `;
    return figmaSection('Typography',
      popoverRow('typography', summary, popoverContent),
      { key: 'typography' } // typography always exists — always shown
    );
  }
  function transformSection(el, cs, draft) {
    const scaleVal = parseFloat(effectiveAt(panelState, draft, '__scale', '1')) || 1;
    const tyRaw = String(effectiveAt(panelState, draft, '__translateY', '0'));
    const tyVal = parseInt(tyRaw) || 0;
    return figmaSection('Transform',
      rowLabel('Scale', `<div style="flex:1;">${scrubberHTML('Scale', 0.8, 1.2, scaleVal, '', { decimals: 2 })}</div>`) +
      rowLabel('Move Y', `<div style="flex:1;">${scrubberHTML('Translate Y', -10, 10, tyVal, 'px')}</div>`),
      { key: 'transform', hasValue: scaleVal !== 1 || tyVal !== 0 }
    );
  }
  function quickPresetsHTML(activePreset) {
    const PRESETS = ['Lift', 'Glow', 'Dim', 'Ghost', 'Brutalist'];
    return `<div style="margin-top:4px;padding-top:14px;border-top:1px solid #2a2a2a;">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#888;margin-bottom:8px;font-weight:600;">Quick preset</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;">${
        PRESETS.map((p) => {
          const active = activePreset === p.toLowerCase();
          return `<button type="button" data-lp-preset="${p.toLowerCase()}" style="background:${active?'#2a2a2a':'transparent'};color:${active?'#e5e5e5':'#888'};border:1px solid #2a2a2a;padding:4px 12px;border-radius:14px;cursor:pointer;font-size:11px;font-weight:500;">${p}</button>`;
        }).join('')
      }</div>
    </div>`;
  }
  function transitionRowHTML(tr) {
    const dur = parseInt((tr || {}).duration) || 0;
    const easing = (tr || {}).easing || 'ease-out';
    const easings = [
      ['linear', 'Linear'], ['ease', 'Ease'], ['ease-in', 'In'],
      ['ease-out', 'Out'], ['ease-in-out', 'In-Out'], ['cubic-bezier(.34,1.56,.64,1)', 'Spring'],
    ];
    return `<div style="margin-top:12px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:11px;color:#888;flex-shrink:0;">Transition</span>
      <div style="flex:1;min-width:0;">${scrubberHTML('Duration', 0, 500, dur, 'ms')}</div>
      <select data-lp-easing-select style="background:#0e0e0e;color:#cfcfcf;border:1px solid #2a2a2a;border-radius:5px;padding:5px 6px;font-size:11px;cursor:pointer;flex-shrink:0;max-width:80px;">
        ${easings.map(([v, l]) => `<option value="${v}" ${easing===v?'selected':''}>${l}</option>`).join('')}
      </select>
    </div>`;
  }
  function contrastBadgeHTML(el, cs) {
    const fg = parseColor(cs.color);
    const bg = getEffectiveBackground(el);
    if (!fg || !bg) return '';
    const ratio = contrastRatio(fg, bg);
    const r = Math.round(ratio * 10) / 10;
    let level, color;
    if (ratio >= 4.5) { level = 'AAA'; color = '#22c55e'; }
    else if (ratio >= 3) { level = 'AA Large'; color = '#eab308'; }
    else { level = 'Fail'; color = '#ef4444'; }
    const fix = ratio < 4.5
      ? `<button type="button" data-lp-contrast-fix style="background:#4f9eff;color:#fff;border:none;padding:4px 10px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:600;">Fix to AA</button>`
      : '';
    return `
      <div style="background:#0e0e0e;border:1px solid #2a2a2a;border-radius:6px;padding:8px 12px;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
        <span style="font-size:12px;color:#e5e5e5;font-family:ui-monospace,monospace;">${r}:1</span>
        <span style="font-size:11px;color:#888;">${level}</span>
        <span style="margin-left:auto;">${fix}</span>
      </div>`;
  }
  function commonPaidSection_DEPRECATED(type, cs) {
    const radius = parseInt(cs.borderTopLeftRadius) || 0;
    const stored = overrides[getSelector(selectedEl)] || {};
    const bgVal = stored['background-image'] && stored['background-image'].includes('gradient')
      ? stored['background-image']
      : (stored['background-color'] || cs.backgroundColor);
    const bgActive = stored['background-image'] || (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent');
    const radiusActive = radius > 0;
    const shadowActive = cs.boxShadow && cs.boxShadow !== 'none';
    const borderActive = (parseInt(cs.borderTopWidth) || 0) > 0 && cs.borderTopStyle !== 'none';
    // Border color: prefer stored border-image gradient, then border-color override, then computed
    const borderColorVal = (stored['border-image'] && stored['border-image'].includes('gradient'))
      ? stored['border-image'].replace(/\s*\d+\s*$/, '').trim()
      : (stored['border-color'] || cs.borderTopColor);
    // Shadow color: extract from current box-shadow if possible
    const shadowSrc = stored['box-shadow'] || cs.boxShadow || '';
    const shadowColorMatch = shadowSrc.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/i);
    const shadowColorVal = shadowColorMatch ? shadowColorMatch[0] : 'rgba(0,0,0,0.5)';

    const radiusBtns = [
      { v: '0px', l: 'Sharp' }, { v: '4px', l: 'Subtle' },
      { v: '8px', l: 'Round' }, { v: '9999px', l: 'Pill' }
    ];
    const shadowBtns = [
      { v: 'none', l: 'None' },
      { v: '0 1px 2px rgba(0,0,0,0.08)', l: 'Low' },
      { v: '0 4px 8px rgba(0,0,0,0.12)', l: 'Med' },
      { v: '0 10px 20px rgba(0,0,0,0.18)', l: 'High' },
      { v: '0 20px 40px rgba(0,0,0,0.25)', l: 'Float' }
    ];

    return (
      collapsibleSection('border-radius', radiusActive, 'Border Radius' + paidBadge(),
        `<div style="display:flex;gap:4px;margin-bottom:8px;">
          ${radiusBtns.map((o) =>
            (() => {
              const active = parseInt(o.v) === radius || (radius >= 9999 && o.v === '9999px');
              return `<button data-lp-seg="border-radius" data-val="${o.v}" style="flex:1;background:${active ? '#4f9eff' : '#0e0e0e'};color:${active ? '#fff' : '#aaa'};border:1px solid #2a2a2a;padding:5px 0;border-radius:5px;cursor:pointer;font-size:11px;">${o.l}</button>`;
            })()
          ).join('')}
        </div>` +
        rowLabel('Custom', stepperHTML('border-radius', radius, 'one'))
      ) +
      collapsibleSection('box-shadow', shadowActive, 'Drop Shadow' + paidBadge(),
        `<div style="display:flex;gap:4px;margin-bottom:8px;">
          ${shadowBtns.map((o) =>
            `<button data-lp-shadow-preset data-val="${o.v.replace(/"/g, '&quot;')}" data-key="${o.l}" style="flex:1;background:#0e0e0e;color:#aaa;border:1px solid #2a2a2a;padding:5px 0;border-radius:5px;cursor:pointer;font-size:10px;">${o.l}</button>`
          ).join('')}
        </div>` +
        rowLabel('Color', colorBlockHTML('shadow-color', shadowColorVal, false, { noGradient: true }))
      ) +
      collapsibleSection('border', borderActive, 'Border' + paidBadge(),
        rowLabel('Width', stepperHTML('border-width', parseInt(cs.borderTopWidth) || 0, 'one')) +
        rowLabel('Style', segHTML('border-style', [
          { v: 'none', l: 'None' }, { v: 'solid', l: 'Solid' }, { v: 'dashed', l: 'Dash' }, { v: 'dotted', l: 'Dot' }
        ], cs.borderTopStyle)) +
        rowLabel('Color', colorBlockHTML('border-color', borderColorVal, false))
      ) +
      (type === 'text' ? '' : collapsibleSection('background', bgActive, 'Background' + paidBadge(), colorBlockHTML('background', bgVal, false)))
    );
  }

  // ---------- States section (V2) ----------
  // Builds the contents of the States tab body for the selected state.
  // Allowed properties depend on which state is active.
  function statesViewHTML(el, sel, cs, draft, currentState, supportedStates) {
    // Read effective value for a given state+property: state map → base draft → computed style.
    function effective(state, prop, computedFallback) {
      const stateMap = state === 'default' ? draft : (draft.__states && draft.__states[state]);
      if (stateMap && stateMap[prop] != null) return stateMap[prop];
      if (state !== 'default' && draft[prop] != null) return draft[prop];
      return computedFallback;
    }
    const allStates = ['default', ...supportedStates];
    const PRESETS = ['Lift', 'Glow', 'Dim', 'Ghost', 'Brutalist'];
    const activePreset = draft.__activePreset || null;
    // Pill buttons render with transparent backgrounds; a separate moving "indicator" span
    // overlays the active button and slides between positions. Buttons sit above the
    // indicator via z-index.
    const pillBtn = (active) => `position:relative;z-index:1;flex:1;background:transparent;color:${active ? '#e5e5e5' : '#888'};border:none;padding:5px 0;border-radius:4px;cursor:pointer;font-size:11px;font-weight:500;transition:color 180ms ease-out;`;
    const pillGroup = `position:relative;display:flex;background:#0e0e0e;border:1px solid #2a2a2a;border-radius:6px;padding:2px;overflow:hidden;`;
    const indicatorSpan = `<span data-lp-indicator style="position:absolute;top:0;left:0;width:0;height:0;background:#2a2a2a;border-radius:4px;pointer-events:none;will-change:transform,width,height;opacity:0;"></span>`;
    const presetRow = `
      <div style="margin-bottom:14px;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#888;margin-bottom:8px;font-weight:600;">Interaction preset</div>
        <div data-lp-pill-group="preset" style="${pillGroup}flex-wrap:wrap;gap:2px;">
          ${indicatorSpan}
          ${PRESETS.map((p) => {
            const isActive = activePreset === p.toLowerCase();
            return `<button type="button" data-lp-preset="${p.toLowerCase()}" data-lp-active="${isActive ? 'true' : 'false'}" style="${pillBtn(isActive)}flex:1 1 60px;">${p}</button>`;
          }).join('')}
        </div>
      </div>`;
    const switcher = `<div data-lp-pill-group="state" style="${pillGroup}margin-bottom:14px;">
      ${indicatorSpan}
      ${allStates.map((s) => {
        const active = s === currentState;
        return `<button type="button" data-lp-state="${s}" data-lp-active="${active ? 'true' : 'false'}" style="${pillBtn(active)}">${statePrettyName(s)}</button>`;
      }).join('')}
    </div>`;

    // Per-state property controls. For 'default' state we still show the same compact set so
    // the user can A/B states side-by-side; full property panel lives in the Properties tab.
    const bgVal = effective(currentState, 'background-color', cs.backgroundColor);
    const colorVal = effective(currentState, 'color', cs.color);
    const borderVal = effective(currentState, 'border-color', cs.borderTopColor);
    const shadowSrc = effective(currentState, 'box-shadow', cs.boxShadow || '');
    const shadowMatch = (shadowSrc || '').toString().match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/i);
    const shadowColorVal = shadowMatch ? shadowMatch[0] : 'rgba(0,0,0,0.5)';

    let extras = '';
    if (currentState === 'hover' || currentState === 'active') {
      const scaleVal = parseFloat(effective(currentState, 'scale', '1')) || 1;
      const tyVal = parseInt(effective(currentState, '__translateY', '0')) || 0;
      extras = rowLabel('Scale',
        `<div style="flex:1;">${scrubberHTML('Scale', 0.8, 1.2, scaleVal, '', { decimals: 2 })}</div>`
      ) + rowLabel('Translate Y',
        `<div style="flex:1;">${scrubberHTML('Translate Y', -10, 10, tyVal, 'px')}</div>`
      );
    } else if (currentState === 'disabled') {
      const opVal = Math.round((parseFloat(effective(currentState, 'opacity', '1')) || 1) * 100);
      extras = rowLabel('Opacity',
        `<div style="flex:1;">${scrubberHTML('Opacity', 0, 100, opVal, '%')}</div>`
      );
    }

    const stateProps = sectionWrap('State properties',
      rowLabel('Background', colorBlockHTML('state-background-color', bgVal, false)) +
      rowLabel('Text', colorBlockHTML('state-color', colorVal, true)) +
      rowLabel('Border', colorBlockHTML('state-border-color', borderVal, false)) +
      rowLabel('Shadow', colorBlockHTML('state-shadow-color', shadowColorVal, false, { noGradient: true })) +
      extras
    );

    const tr = draft.__transition || {};
    const dur = parseInt(tr.duration) || 0;
    const easing = tr.easing || 'ease-out';
    const easingOpts = [
      { v: 'linear', l: 'Linear' }, { v: 'ease', l: 'Ease' },
      { v: 'ease-in', l: 'In' }, { v: 'ease-out', l: 'Out' },
      { v: 'ease-in-out', l: 'In-Out' }, { v: 'cubic-bezier(.34,1.56,.64,1)', l: 'Spring' },
    ];
    const transition = sectionWrap('Transition',
      rowLabel('Duration',
        `<div style="flex:1;">${scrubberHTML('Duration', 0, 500, dur, 'ms')}</div>`
      ) +
      `<div data-lp-pill-group="easing" style="${pillGroup}gap:2px;flex-wrap:wrap;margin-top:6px;">
        ${indicatorSpan}
        ${easingOpts.map((o) => {
          const active = easing === o.v;
          return `<button type="button" data-lp-easing="${o.v}" data-lp-active="${active ? 'true' : 'false'}" style="${pillBtn(active)}min-width:46px;">${o.l}</button>`;
        }).join('')}
      </div>`
    );

    return presetRow + switcher + stateProps + transition;
  }

  // Compute base color hints for presets (computed style, draft override fallback)
  function presetContext(el, draft, cs) {
    const baseBg = draft['background-color'] || cs.backgroundColor || 'transparent';
    const baseColor = draft['color'] || cs.color || '#000';
    return { baseBg, baseColor };
  }
  // Returns { setStateMap: Map<state, propsObject>, transition: {duration, easing} }
  function presetRecipe(name, ctx) {
    const { baseBg, baseColor } = ctx;
    switch (name) {
      case 'lift':
        return {
          stateMaps: {
            hover: { 'box-shadow': '0 8px 18px rgba(0,0,0,0.18)', '__translateY': '-2px' },
            active: { 'box-shadow': '0 1px 2px rgba(0,0,0,0.12)', '__translateY': '0px' },
          },
          base: { 'box-shadow': '0 1px 3px rgba(0,0,0,0.10)' },
          transition: { duration: '180ms', easing: 'ease-out' },
        };
      case 'fill':
        return {
          stateMaps: {
            hover: { 'background-color': baseColor, 'color': baseBg },
          },
          base: { 'background-color': 'transparent', 'color': baseColor, 'border-color': baseColor, 'border-width': '1px', 'border-style': 'solid' },
          transition: { duration: '160ms', easing: 'ease-out' },
        };
      case 'glow':
        return {
          stateMaps: {
            hover: { 'box-shadow': `0 0 16px ${baseBg}`, '__scale': '1.02' },
          },
          base: { 'box-shadow': `0 0 0 ${baseBg}` },
          transition: { duration: '200ms', easing: 'ease-out' },
        };
      case 'dim':
        return {
          stateMaps: {
            hover: { 'opacity': '0.85' },
            disabled: { 'opacity': '0.4' },
          },
          base: { 'opacity': '1' },
          transition: { duration: '140ms', easing: 'ease-out' },
        };
      case 'ghost':
        return {
          stateMaps: {
            hover: { 'background-color': baseBg, 'color': baseColor },
          },
          base: { 'background-color': 'transparent', 'color': baseBg },
          transition: { duration: '160ms', easing: 'ease-out' },
        };
      case 'brutalist':
        return {
          stateMaps: {
            hover: { 'box-shadow': '6px 6px 0 #000', '__translateY': '-2px' },
            active: { 'box-shadow': '0 0 0 #000', '__translateY': '2px' },
          },
          base: { 'box-shadow': '4px 4px 0 #000', 'border': '2px solid #000' },
          transition: { duration: '120ms', easing: 'cubic-bezier(.34,1.56,.64,1)' },
        };
    }
    return null;
  }

  // ---------- Wire ----------
  function wirePanel(el, type, sel, cs) {
    const draft = Object.assign({}, overrides[sel] || {});

    function apply() {
      overrides[sel] = draft;
      renderStyleTag();
      refreshBorderStyleAvailability();
      if (typeof refreshScopeUI === 'function') refreshScopeUI();
      // re-place highlight (size may change)
      requestAnimationFrame(() => place(selectedHighlight, el));
    }
    function refreshBorderStyleAvailability() {
      // CSS limitation: border-image renders solid only; dashed/dotted don't apply.
      const hasGradBorder = typeof draft['border-image'] === 'string' && draft['border-image'].includes('gradient');
      panel.querySelectorAll('[data-lp-seg="border-style"]').forEach((b) => {
        const v = b.dataset.val;
        const blocked = hasGradBorder && (v === 'dashed' || v === 'dotted');
        b.disabled = blocked;
        b.style.opacity = blocked ? '0.35' : '1';
        b.style.cursor = blocked ? 'not-allowed' : 'pointer';
        b.title = blocked ? 'Not supported with gradient borders — switch border color back to Solid first' : '';
      });
    }
    // V2 IA: setProp routes writes to the active state map (or base draft for 'default').
    function targetForCurrentState() {
      if (panelState === 'default') return draft;
      if (!draft.__states) draft.__states = {};
      if (!draft.__states[panelState]) draft.__states[panelState] = {};
      return draft.__states[panelState];
    }
    function cleanupEmptyState() {
      if (panelState !== 'default' && draft.__states && draft.__states[panelState] && Object.keys(draft.__states[panelState]).length === 0) {
        delete draft.__states[panelState];
      }
      if (draft.__states && Object.keys(draft.__states).length === 0) delete draft.__states;
    }
    function setProp(prop, value) {
      pushUndo();
      const target = targetForCurrentState();
      const empty = value === null || value === undefined || value === '';
      if (empty) delete target[prop]; else target[prop] = value;
      cleanupEmptyState();
      apply();
    }
    function setProps(obj, clearKeys) {
      pushUndo();
      const target = targetForCurrentState();
      (clearKeys || []).forEach((k) => delete target[k]);
      Object.assign(target, obj);
      cleanupEmptyState();
      apply();
    }
    // Used internally by interaction presets (which write across multiple states).
    function setStateProp(state, prop, value) {
      pushUndo();
      let target;
      if (state === 'default') {
        target = draft;
      } else {
        if (!draft.__states) draft.__states = {};
        if (!draft.__states[state]) draft.__states[state] = {};
        target = draft.__states[state];
      }
      const empty = value === null || value === undefined || value === '';
      if (empty) delete target[prop]; else target[prop] = value;
      if (state !== 'default' && draft.__states && draft.__states[state] && Object.keys(draft.__states[state]).length === 0) {
        delete draft.__states[state];
      }
      if (state !== 'default' && draft.__states && Object.keys(draft.__states).length === 0) {
        delete draft.__states;
      }
      apply();
    }
    function setTransition(key, value) {
      pushUndo();
      if (!draft.__transition) draft.__transition = {};
      const empty = value === null || value === undefined || value === '';
      if (empty) delete draft.__transition[key]; else draft.__transition[key] = value;
      if (Object.keys(draft.__transition).length === 0) delete draft.__transition;
      apply();
    }

    const closeBtnEl = panel.querySelector('[data-lp-close]');
    if (closeBtnEl) closeBtnEl.onclick = closePanel;
    // Minimize button (expanded mode) — collapses panel to icon rail.
    const minBtn = panel.querySelector('[data-lp-minimize]');
    if (minBtn) minBtn.onclick = () => {
      panelMinimized = true;
      rerenderPanel();
    };
    // Rail buttons (minimized mode)
    // Section-body builders for the rail popovers (one popover per icon).
    function railSectionBody(name) {
      const drft = draft;
      const _type = type;
      if (name === 'spacing') {
        const isFlexGrid = ['flex','grid','inline-flex','inline-grid'].includes(cs.display);
        const padding = parseInt(effectiveAt(panelState, drft, 'padding-top', cs.paddingTop)) || 0;
        const gap = parseInt(effectiveAt(panelState, drft, 'gap', cs.gap)) || 0;
        return rowLabel('Padding', stepperHTML('padding', padding, 'one')) +
               (isFlexGrid ? rowLabel('Gap', stepperHTML('gap', gap, 'one')) : '');
      }
      if (name === 'appearance') {
        const radius = parseInt(effectiveAt(panelState, drft, 'border-radius', cs.borderTopLeftRadius)) || 0;
        return rowLabel('Radius', stepperHTML('border-radius', radius, 'one'));
      }
      if (name === 'fill') {
        const bgValStored = effectiveAt(panelState, drft, 'background-image', null);
        const bgVal = (bgValStored && String(bgValStored).includes('gradient'))
          ? bgValStored
          : effectiveAt(panelState, drft, 'background-color', cs.backgroundColor);
        return colorBlockHTML('background', bgVal, false);
      }
      if (name === 'text') {
        const colorVal = effectiveAt(panelState, drft, 'color', cs.color);
        return colorBlockHTML('color', colorVal, true);
      }
      if (name === 'stroke') {
        const borderColorVal = effectiveAt(panelState, drft, 'border-color', cs.borderTopColor);
        const borderWidth = parseInt(effectiveAt(panelState, drft, 'border-width', cs.borderTopWidth)) || 0;
        return rowLabel('Width', stepperHTML('border-width', borderWidth, 'one')) +
               rowLabel('Color', colorBlockHTML('border-color', borderColorVal, false));
      }
      if (name === 'effects') {
        const shadowSrc = effectiveAt(panelState, drft, 'box-shadow', cs.boxShadow || '');
        const parts = parseShadow(shadowSrc);
        const colorMatch = (shadowSrc || '').toString().match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/i);
        const colorVal = colorMatch ? colorMatch[0] : 'rgba(0,0,0,0.12)';
        return rowLabel('X', stepperHTML('shadow-x', parts.offsetX, 'one')) +
               rowLabel('Y', stepperHTML('shadow-y', parts.offsetY, 'one')) +
               rowLabel('Blur', stepperHTML('shadow-blur', parts.blur, 'one')) +
               rowLabel('Color', colorBlockHTML('shadow-color', colorVal, false, { noGradient: true }));
      }
      if (name === 'typography') {
        const size = parseInt(effectiveAt(panelState, drft, 'font-size', cs.fontSize)) || 16;
        const fontFam = effectiveAt(panelState, drft, 'font-family', cs.fontFamily);
        const weight = effectiveAt(panelState, drft, 'font-weight', cs.fontWeight);
        const lh = effectiveAt(panelState, drft, 'line-height', cs.lineHeight);
        return rowLabel('Font', fontSelectHTML(fontFam)) +
               rowLabel('Size', stepperHTML('font-size', size, 'one')) +
               rowLabel('Weight', segHTML('font-weight', [
                 { v: 400, l: '400' }, { v: 500, l: '500' }, { v: 600, l: '600' }, { v: 700, l: '700' }
               ], weight)) +
               rowLabel('Line', segHTML('line-height', [
                 { v: '1.1', l: 'Tight' }, { v: '1.5', l: 'Normal' }, { v: '1.75', l: 'Relax' }, { v: '2', l: 'Loose' }
               ], lh));
      }
      if (name === 'transform') {
        const scaleVal = parseFloat(effectiveAt(panelState, drft, '__scale', '1')) || 1;
        const tyVal = parseInt(String(effectiveAt(panelState, drft, '__translateY', '0'))) || 0;
        return rowLabel('Scale', `<div style="flex:1;">${scrubberHTML('Scale', 0.8, 1.2, scaleVal, '', { decimals: 2 })}</div>`) +
               rowLabel('Move Y', `<div style="flex:1;">${scrubberHTML('Translate Y', -10, 10, tyVal, 'px')}</div>`);
      }
      return '';
    }
    const RAIL_TITLES = { spacing: 'Spacing', appearance: 'Appearance', fill: 'Fill', text: 'Text', stroke: 'Stroke', effects: 'Drop shadow', typography: 'Typography', transform: 'Transform' };
    // Wire all standard controls within a given scope (used by rail popovers).
    function wireScope(scope) {
      scope.querySelectorAll('[data-lp-stepper]').forEach((btn) => {
        btn.onclick = panel.querySelector('[data-lp-stepper][data-prop="' + btn.dataset.lpStepper + '"]') ? null : null; // placeholder
        btn.onclick = () => {
          const prop = btn.dataset.lpStepper;
          const dir = parseInt(btn.dataset.dir);
          const input = btn.parentNode.querySelector(`[data-lp-input="${prop}"]`);
          if (!input) return;
          const cur = parseInt(input.value) || 0;
          const allowNegative = prop === 'shadow-x' || prop === 'shadow-y';
          let next = cur + dir;
          if (!allowNegative) next = Math.max(0, next);
          input.value = next + 'px';
          if (prop === 'shadow-x' || prop === 'shadow-y' || prop === 'shadow-blur') {
            const curShadow = effectiveAt(panelState, draft, 'box-shadow', cs.boxShadow || 'none');
            const parts = parseShadow(curShadow);
            if (prop === 'shadow-x') parts.offsetX = next;
            else if (prop === 'shadow-y') parts.offsetY = next;
            else parts.blur = Math.max(0, next);
            setProp('box-shadow', buildShadow(parts));
            return;
          }
          setProp(prop, next + 'px');
        };
      });
      scope.querySelectorAll('[data-lp-input]').forEach((input) => {
        input.onchange = () => {
          let v = input.value.trim();
          if (/^-?\d+(\.\d+)?$/.test(v)) v = v + 'px';
          const prop = input.dataset.lpInput;
          if (prop === 'shadow-x' || prop === 'shadow-y' || prop === 'shadow-blur') {
            const curShadow = effectiveAt(panelState, draft, 'box-shadow', cs.boxShadow || 'none');
            const parts = parseShadow(curShadow);
            const num = parseFloat(v) || 0;
            if (prop === 'shadow-x') parts.offsetX = num;
            else if (prop === 'shadow-y') parts.offsetY = num;
            else parts.blur = Math.max(0, num);
            setProp('box-shadow', buildShadow(parts));
            input.value = (prop === 'shadow-blur' ? Math.max(0, num) : num) + 'px';
            return;
          }
          setProp(prop, v);
          input.value = v;
        };
      });
      scope.querySelectorAll('[data-lp-seg]').forEach((btn) => {
        btn.onclick = () => {
          if (btn.disabled) return;
          const prop = btn.dataset.lpSeg;
          const val = btn.dataset.val.replace(/&quot;/g, '"');
          setProp(prop, val);
          (btn.parentNode || scope).querySelectorAll(`[data-lp-seg="${prop}"]`).forEach((b) => {
            const isActive = b.dataset.val === btn.dataset.val;
            const hasBorder = b.style.border && b.style.border.includes('solid');
            b.style.background = isActive ? '#4f9eff' : (hasBorder ? '#0e0e0e' : 'transparent');
            b.style.color = isActive ? '#fff' : '#aaa';
          });
        };
      });
      scope.querySelectorAll('[data-lp-font]').forEach((sel2) => {
        sel2.onchange = () => {
          const f = FONTS.find((x) => x.label === sel2.value);
          if (!f) return;
          ensureFont(f.google);
          setProp('font-family', f.stack);
        };
      });
      scope.querySelectorAll('[data-lp-scrub]').forEach((sc) => {
        // Scrubber wiring is data-attr driven; for Transform popover we expect __scale / __translateY.
        if (sc.dataset.min === '0.8') wireScrubber(sc, (v) => setProp('__scale', String(v)));
        else if (sc.dataset.min === '-10') wireScrubber(sc, (v) => setProp('__translateY', v + 'px'));
      });
      scope.querySelectorAll('[data-lp-colorblock]').forEach(wireColorBlock);
    }
    // Floating per-section popover anchored to a rail button.
    let openRailPopover = null;
    function closeRailPopover() {
      if (openRailPopover) { openRailPopover.remove(); openRailPopover = null; }
      document.removeEventListener('click', railOutside, true);
    }
    function railOutside(e) {
      if (!openRailPopover) return;
      if (openRailPopover.contains(e.target)) return;
      if (e.target.closest && e.target.closest('[data-lp-rail]')) return;
      if (e.target.closest && e.target.closest('[data-lp-popover]')) return;
      closeRailPopover();
    }
    function openSectionPopover(name, anchorBtn) {
      closeRailPopover();
      const body = railSectionBody(name);
      if (!body) return;
      const pop = document.createElement('div');
      pop.setAttribute('data-lp-rail-popover', '');
      Object.assign(pop.style, {
        position: 'fixed', zIndex: '2147483647',
        background: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: '10px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)', padding: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '13px',
        color: '#e5e5e5', width: '260px', lineHeight: '1.4',
      });
      pop.innerHTML = `
        <div style="font-size:13px;font-weight:600;color:#e5e5e5;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
          <span>${RAIL_TITLES[name] || name}</span>
          <button type="button" data-lp-rail-pop-close style="width:22px;height:22px;background:#0e0e0e;border:1px solid #2a2a2a;border-radius:5px;color:#888;cursor:pointer;font-size:14px;line-height:1;">×</button>
        </div>
        <div>${body}</div>
      `;
      document.body.appendChild(pop);
      // Position to the LEFT of the rail button.
      const r = anchorBtn.getBoundingClientRect();
      const W = pop.offsetWidth, H = pop.offsetHeight;
      let left = r.left - W - 8;
      if (left < 8) left = r.right + 8;
      let top = Math.min(window.innerHeight - H - 8, Math.max(8, r.top));
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
      pop.querySelector('[data-lp-rail-pop-close]').onclick = closeRailPopover;
      wireScope(pop);
      openRailPopover = pop;
      setTimeout(() => document.addEventListener('click', railOutside, true), 0);
    }

    // Custom tooltip for rail buttons (native `title` is too slow).
    let railTip = document.getElementById('lp-rail-tooltip');
    if (!railTip) {
      railTip = document.createElement('div');
      railTip.id = 'lp-rail-tooltip';
      Object.assign(railTip.style, {
        position: 'fixed', zIndex: '2147483647', pointerEvents: 'none',
        background: '#0e0e0e', color: '#e5e5e5', padding: '4px 8px',
        borderRadius: '5px', fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '11px', fontWeight: '500', lineHeight: '1.3',
        border: '1px solid #2a2a2a', whiteSpace: 'nowrap',
        opacity: '0', transform: 'translateX(4px)',
        transition: 'opacity 120ms ease-out, transform 120ms ease-out',
        display: 'none',
      });
      document.body.appendChild(railTip);
    }
    let railTipHideTimer = null;
    function showRailTip(btn) {
      // Cancel any pending hide from a previous mouseleave so rapid hover changes
      // don't clobber the new tooltip.
      if (railTipHideTimer) { clearTimeout(railTipHideTimer); railTipHideTimer = null; }
      const text = btn.dataset.lpTitle || '';
      if (!text) return;
      railTip.textContent = text;
      railTip.style.display = 'block';
      const r = btn.getBoundingClientRect();
      const tipW = railTip.offsetWidth;
      const tipH = railTip.offsetHeight;
      railTip.style.left = (r.left - tipW - 8) + 'px';
      railTip.style.top = (r.top + r.height / 2 - tipH / 2) + 'px';
      requestAnimationFrame(() => {
        railTip.style.opacity = '1';
        railTip.style.transform = 'translateX(0)';
      });
    }
    function hideRailTip() {
      railTip.style.opacity = '0';
      railTip.style.transform = 'translateX(4px)';
      if (railTipHideTimer) clearTimeout(railTipHideTimer);
      railTipHideTimer = setTimeout(() => { railTip.style.display = 'none'; railTipHideTimer = null; }, 140);
    }
    panel.querySelectorAll('[data-lp-rail]').forEach((btn) => {
      // Stash the title text and clear the attribute so the native slow tooltip never fires.
      btn.dataset.lpTitle = btn.getAttribute('title') || '';
      btn.removeAttribute('title');
      btn.addEventListener('mouseenter', () => showRailTip(btn));
      btn.addEventListener('mouseleave', hideRailTip);
      btn.onclick = (e) => {
        e.stopPropagation();
        const action = btn.dataset.lpRail;
        if (RAIL_TITLES[action]) { openSectionPopover(action, btn); return; }
        closeRailPopover();
        if (action === 'expand') { panelMinimized = false; rerenderPanel(); }
        else if (action === 'close') { closePanel(); }
        else if (action === 'audit') {
          panelMode = panelMode === 'audit' ? 'edit' : 'audit';
          if (panelMode === 'audit') {
            auditIssues = scanForSpacingIssues();
            renderAuditOverlay(auditIssues);
          } else { clearAuditOverlay(); }
          rerenderPanel();
        } else if (action === 'copy') {
          panelMinimized = false;
          rerenderPanel();
          setTimeout(() => {
            const c = document.querySelector('#' + UI_ID + ' [data-lp-copy="prompt"]');
            if (c) c.click();
          }, 50);
        }
      };
    });

    // V2 IA: chevron-toggle collapsible sections; state remembered for the session.
    panel.querySelectorAll('[data-lp-section2]').forEach((sec) => {
      const key = sec.dataset.lpKey;
      const toggle = sec.querySelector('[data-lp-section2-toggle]');
      const body = sec.querySelector('[data-lp-section2-body]');
      const chev = sec.querySelector('[data-lp-chevron]');
      if (toggle) toggle.onclick = () => {
        const isOpen = body.style.display !== 'none';
        const nextOpen = !isOpen;
        body.style.display = nextOpen ? 'block' : 'none';
        chev.style.transform = `rotate(${nextOpen?180:0}deg)`;
        sectionMemory[key] = nextOpen;
      };
    });

    // Compact section "+" adds a sensible default for that property and re-renders
    // (the section now has a value, so it surfaces its full editor).
    panel.querySelectorAll('[data-lp-section3-add]').forEach((btn) => {
      btn.onclick = () => {
        const which = btn.dataset.add;
        if (which === 'fill') {
          setProp('background-color', '#ffffff');
        } else if (which === 'stroke') {
          setProps({ 'border-width': '1px', 'border-style': 'solid', 'border-color': '#000000' });
        } else if (which === 'effects') {
          setProp('box-shadow', '0 4px 8px rgba(0,0,0,0.12)');
        } else if (which === 'transform') {
          setProp('__scale', '1.02');
        }
        rerenderPanel();
      };
    });

    // Copy buttons (CSS + AI prompt)
    let scope = 'this'; // 'this' | 'all'
    function allChangedSelectors() {
      // Snapshot from overrides; current draft is already mirrored into overrides[sel] via apply().
      return Object.entries(overrides).filter(([, v]) => v && Object.keys(v).length > 0);
    }
    // Build full CSS for a selector — base rule + transition + per-state pseudo-rules.
    function selectorRules(selector, props) {
      const rules = [];
      const base = { ...realProps(props) };
      const tr = props.__transition;
      if (tr && (tr.duration || tr.easing)) {
        base['transition'] = `all ${tr.duration || '200ms'} ${tr.easing || 'ease-out'}`;
      }
      if (Object.keys(base).length) {
        rules.push(`${selector} {\n${Object.entries(base).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`);
      }
      const states = props.__states || {};
      for (const sName of ['hover', 'active', 'disabled']) {
        const sp = states[sName];
        if (!sp) continue;
        const real = { ...realProps(sp) };
        const xforms = [];
        if (sp.__scale != null) xforms.push(`scale(${sp.__scale})`);
        if (sp.__translateY != null) xforms.push(`translateY(${sp.__translateY})`);
        if (xforms.length) real['transform'] = xforms.join(' ');
        if (Object.keys(real).length) {
          const stateSel = sName === 'disabled'
            ? `${selector}:disabled, ${selector}[disabled]`
            : `${selector}:${sName}`;
          rules.push(`${stateSel} {\n${Object.entries(real).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`);
        }
      }
      return rules.join('\n\n');
    }
    function formatCSS() {
      if (scope === 'all') {
        const all = allChangedSelectors();
        if (!all.length) return `/* No changes yet */`;
        return all.map(([s, props]) => selectorRules(s, props)).filter(Boolean).join('\n\n');
      }
      const out = selectorRules(sel, draft);
      return out || `/* No changes yet for ${sel} */`;
    }
    function formatPrompt() {
      const projectName = (document.title || location.hostname || 'this project').trim();
      // Tight per-element block: tag, text hint (so the agent can grep), then full CSS rules
      // (base + per-state pseudo-rules) so the agent has the complete intent in one place.
      function elementBlock(selector, props) {
        const node = (() => { try { return document.querySelector(selector); } catch { return null; } })();
        const tag = node ? node.tagName.toLowerCase() : 'element';
        const text = node ? (node.innerText || '').trim().slice(0, 40).replace(/\s+/g, ' ') : '';
        const head = text
          ? `<${tag}> "${text}${(node.innerText || '').trim().length > 40 ? '…' : ''}"`
          : `<${tag}>`;
        const rules = selectorRules(selector, props);
        return rules ? `${head}\n${rules}` : '';
      }
      if (scope === 'all') {
        const all = allChangedSelectors();
        if (!all.length) return `No changes to apply on ${projectName}.`;
        const blocks = all.map(([s, props]) => elementBlock(s, props)).filter(Boolean).join('\n\n');
        return `Apply these style changes on ${projectName}. Use the quoted text to grep for each element in the codebase; selectors are a fallback. Edit in the project's idiom (Tailwind / CSS modules / vanilla / tokens) — keep the diff minimal.\n\n${blocks}`;
      }
      const block = elementBlock(sel, draft);
      if (!block) return `No changes to apply for ${sel} on ${projectName}.`;
      return `Apply these style changes on ${projectName}. Use the quoted text to grep for the element; the selector is a fallback. Edit in the project's idiom (Tailwind / CSS modules / vanilla / tokens) — keep the diff minimal.\n\n${block}`;
    }
    async function copy(text, label) {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied`);
      } catch {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
        showToast(`${label} copied`);
      }
    }
    // Scope toggle (This element / All) — only show count when >1 element has changes
    const scopeBtns = panel.querySelectorAll('[data-lp-scope-val]');
    const scopeCount = panel.querySelector('[data-lp-scope-count]');
    function refreshScopeUI() {
      // In minimized rail mode the scope toggle isn't rendered.
      if (!scopeCount) return;
      const n = allChangedSelectors().length;
      const showCount = n > 1;
      scopeCount.textContent = showCount ? `(${n})` : '';
      const allBtn = panel.querySelector('[data-lp-scope-val="all"]');
      if (!allBtn) return;
      allBtn.disabled = !showCount;
      allBtn.style.opacity = showCount ? '1' : '0.4';
      allBtn.style.cursor = showCount ? 'pointer' : 'not-allowed';
      if (!showCount && scope === 'all') scope = 'this';
      scopeBtns.forEach((b) => {
        const active = b.dataset.lpScopeVal === scope;
        b.style.background = active ? '#2a2a2a' : 'transparent';
        b.style.color = active ? '#e5e5e5' : '#888';
      });
    }
    scopeBtns.forEach((b) => {
      b.onclick = () => {
        if (b.disabled) return;
        scope = b.dataset.lpScopeVal;
        refreshScopeUI();
      };
    });
    refreshScopeUI();

    panel.querySelectorAll('[data-lp-copy]').forEach((b) => {
      b.onclick = () => {
        // Copy is the commit moment: persist overrides + (later) tick the saves counter.
        if (Object.keys(draft).length === 0) delete overrides[sel];
        else overrides[sel] = draft;
        saveOverrides();
        refreshScopeUI();
        const scopeLabel = scope === 'all' ? 'All CSS' : 'CSS';
        const scopeLabelP = scope === 'all' ? 'All AI prompt' : 'AI prompt';
        if (b.dataset.lpCopy === 'css') copy(formatCSS(), scopeLabel);
        else copy(formatPrompt(), scopeLabelP);
      };
    });

    // Reset is scope-aware:
    //  • scope = 'this' → reset only the current element (no confirmation needed).
    //  • scope = 'all'  → show an inline confirmation (button turns red, click again to confirm).
    function doResetThis() {
      lastUndoCheckpoint = 0;
      pushUndo();
      delete overrides[sel];
      saveOverrides();
      const cur = selectedEl;
      closePanel();
      if (cur) selectElement(cur);
    }
    function doResetAll() {
      lastUndoCheckpoint = 0;
      pushUndo();
      Object.keys(overrides).forEach((k) => delete overrides[k]);
      saveOverrides();
      const cur = selectedEl;
      closePanel();
      if (cur) selectElement(cur);
      showToast('All changes reset');
    }
    function showResetAllConfirm(anchorBtn, count) {
      // Build the popover
      const pop = document.createElement('div');
      pop.setAttribute('data-lp-popover2-content', '');
      Object.assign(pop.style, {
        position: 'fixed', zIndex: '2147483647',
        background: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)', padding: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '12px',
        color: '#e5e5e5', width: '220px',
      });
      pop.innerHTML = `
        <div style="margin-bottom:10px;line-height:1.5;">Reset <strong>${count}</strong> changed element${count === 1 ? '' : 's'}? This can't be undone from history alone after a reload.</div>
        <div style="display:flex;gap:6px;">
          <button type="button" data-cancel style="flex:1;background:transparent;color:#cfcfcf;border:1px solid #2a2a2a;padding:6px 0;border-radius:6px;cursor:pointer;font-size:11px;">Cancel</button>
          <button type="button" data-confirm style="flex:1;background:#ef4444;color:#fff;border:none;padding:6px 0;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">Reset all</button>
        </div>
      `;
      document.body.appendChild(pop);
      // Position above the button (or below if no room above)
      const r = anchorBtn.getBoundingClientRect();
      const W = pop.offsetWidth, H = pop.offsetHeight;
      let top = r.top - H - 8;
      if (top < 8) top = r.bottom + 8;
      let left = r.left + r.width / 2 - W / 2;
      if (left < 8) left = 8;
      if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8;
      pop.style.top = top + 'px';
      pop.style.left = left + 'px';

      function close() {
        pop.remove();
        document.removeEventListener('click', outsideClick, true);
      }
      function outsideClick(e) {
        if (pop.contains(e.target) || e.target === anchorBtn) return;
        close();
      }
      pop.querySelector('[data-cancel]').onclick = (e) => { e.stopPropagation(); close(); };
      pop.querySelector('[data-confirm]').onclick = (e) => {
        e.stopPropagation();
        close();
        doResetAll();
      };
      // Defer outside-click listener so the originating click doesn't immediately close.
      setTimeout(() => document.addEventListener('click', outsideClick, true), 0);
    }
    const resetBtnEl = panel.querySelector('[data-lp-reset]');
    if (resetBtnEl) resetBtnEl.onclick = (e) => {
      if (scope === 'all') {
        const n = allChangedSelectors().length;
        if (!n) return;
        e.stopPropagation();
        showResetAllConfirm(e.currentTarget, n);
      } else {
        doResetThis();
      }
    };

    // Drag
    const dragHandle = panel.querySelector('[data-lp-drag]');
    let dragOff = null;
    dragHandle.addEventListener('mousedown', (e) => {
      const r = panel.getBoundingClientRect();
      dragOff = { x: e.clientX - r.left, y: e.clientY - r.top };
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragOff) return;
      panel.style.left = e.clientX - dragOff.x + 'px';
      panel.style.top = e.clientY - dragOff.y + 'px';
      panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => (dragOff = null));

    // Steppers
    panel.querySelectorAll('[data-lp-stepper]').forEach((btn) => {
      btn.onclick = () => {
        const prop = btn.dataset.lpStepper;
        const mode = btn.dataset.mode;
        const dir = parseInt(btn.dataset.dir);
        // Find the sibling input within the same row — works whether the row is in
        // the panel or in a detached popover.
        const input = btn.parentNode.querySelector(`[data-lp-input="${prop}"]`)
          || panel.querySelector(`[data-lp-input="${prop}"]`);
        if (!input) return;
        const cur = parseInt(input.value) || 0;
        let next;
        if (mode === 'pad') {
          if (dir > 0) {
            next = PAD_STEPS.find((s) => s > cur) ?? PAD_STEPS[PAD_STEPS.length - 1];
          } else {
            const below = PAD_STEPS.filter((s) => s < cur);
            next = below.length ? below[below.length - 1] : 0;
          }
        } else {
          // Shadow X/Y can go negative; everything else floors at 0.
          const allowNegative = prop === 'shadow-x' || prop === 'shadow-y';
          next = cur + dir;
          if (!allowNegative) next = Math.max(0, next);
        }
        input.value = next + 'px';
        // shadow-x/y/blur are synthetic props that reconstruct the box-shadow string.
        if (prop === 'shadow-x' || prop === 'shadow-y' || prop === 'shadow-blur') {
          const curShadow = effectiveAt(panelState, draft, 'box-shadow', cs.boxShadow || 'none');
          const parts = parseShadow(curShadow);
          if (prop === 'shadow-x') parts.offsetX = next;
          else if (prop === 'shadow-y') parts.offsetY = next;
          else parts.blur = Math.max(0, next);
          setProp('box-shadow', buildShadow(parts));
          return;
        }
        setProp(prop, next + 'px');
      };
    });

    // Direct input
    panel.querySelectorAll('[data-lp-input]').forEach((input) => {
      input.onchange = () => {
        let v = input.value.trim();
        if (/^-?\d+(\.\d+)?$/.test(v)) v = v + 'px';
        const prop = input.dataset.lpInput;
        if (prop === 'shadow-x' || prop === 'shadow-y' || prop === 'shadow-blur') {
          const curShadow = effectiveAt(panelState, draft, 'box-shadow', cs.boxShadow || 'none');
          const parts = parseShadow(curShadow);
          const num = parseFloat(v) || 0;
          if (prop === 'shadow-x') parts.offsetX = num;
          else if (prop === 'shadow-y') parts.offsetY = num;
          else parts.blur = Math.max(0, num);
          setProp('box-shadow', buildShadow(parts));
          input.value = (prop === 'shadow-blur' ? Math.max(0, num) : num) + 'px';
          return;
        }
        setProp(prop, v);
        input.value = v;
      };
    });

    // Segmented
    panel.querySelectorAll('[data-lp-seg]').forEach((btn) => {
      btn.onclick = () => {
        if (btn.disabled) return;
        const prop = btn.dataset.lpSeg;
        const val = btn.dataset.val.replace(/&quot;/g, '"');
        setProp(prop, val);
        // Update sibling buttons' active styling — works even when the seg row lives
        // in a detached popover.
        const scope = btn.parentNode || panel;
        scope.querySelectorAll(`[data-lp-seg="${prop}"]`).forEach((b) => {
          const isActive = b.dataset.val === btn.dataset.val;
          const hasBorder = b.style.border && b.style.border.includes('solid');
          b.style.background = isActive ? '#4f9eff' : (hasBorder ? '#0e0e0e' : 'transparent');
          b.style.color = isActive ? '#fff' : '#aaa';
        });
      };
    });

    // Border color picker (legacy native input — kept for any leftover refs)
    panel.querySelectorAll('[data-lp-colorpick]').forEach((pick) => {
      pick.oninput = () => setProp(pick.dataset.lpColorpick, pick.value);
    });

    // Shadow presets — keep current shadow color when switching shape.
    panel.querySelectorAll('[data-lp-shadow-preset]').forEach((btn) => {
      btn.onclick = () => {
        const preset = btn.dataset.val.replace(/&quot;/g, '"');
        if (preset === 'none') { setProp('box-shadow', 'none'); return; }
        // Strip any color from preset and append the current shadow color
        const offsetBlur = preset.replace(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i, '').trim();
        const cur = draft['box-shadow'] || cs.boxShadow || '';
        const m = cur.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/i);
        const color = m ? m[0] : 'rgba(0,0,0,0.5)';
        setProp('box-shadow', `${offsetBlur} ${color}`);
      };
    });

    // Font selector
    panel.querySelectorAll('[data-lp-font]').forEach((sel2) => {
      sel2.onchange = () => {
        const f = FONTS.find((x) => x.label === sel2.value);
        if (!f) return;
        ensureFont(f.google);
        setProp('font-family', f.stack);
      };
    });

    // V2: track which pseudo-state is currently selected in the States tab.
    let currentState = 'hover';

    function wireColorBlock(block) {
      const prop = block.dataset.prop; // 'color' | 'background'
      const isText = block.dataset.text === '1';
      const swatchBtn = block.querySelector('[data-lp-swatch]');
      const popover = block.querySelector('[data-lp-popover]');
      const swatchSquare = swatchBtn.querySelector('span:first-child');
      const swatchLabel = swatchBtn.querySelector('span:last-child');
      const solidPanel = block.querySelector('[data-lp-solid]');
      const gradPanel = block.querySelector('[data-lp-grad]');
      const gradPreview = block.querySelector('[data-lp-grad-preview]');
      const modeBtns = block.querySelectorAll('[data-lp-mode]');

      const solidPick = block.querySelector('[data-lp-solid-pick]');
      const solidHex = block.querySelector('[data-lp-solid-hex]');
      const g1pick = block.querySelector('[data-lp-grad-pick1]');
      const g1hex = block.querySelector('[data-lp-grad-hex1]');
      const g2pick = block.querySelector('[data-lp-grad-pick2]');
      const g2hex = block.querySelector('[data-lp-grad-hex2]');
      // Scrubbers (replace the old native ranges for alpha & gradient angle)
      const angleScrub = popover.querySelector('[data-lp-angle-wrap] [data-lp-scrub]');
      const alphaScrub = popover.querySelector('[data-lp-opacity-wrap] [data-lp-scrub]');
      function currentAlpha() { return parseFloat(alphaScrub.dataset.value) / 100; }
      function currentAngle() { return parseInt(angleScrub.dataset.value); }

      function refreshSwatch() {
        const a = currentAlpha();
        const isGradMode = popover.dataset.mode === 'gradient';
        if (isGradMode) {
          // Chip shows full-opacity gradient; alpha is in the label.
          const grad = `linear-gradient(${currentAngle()}deg, ${g1hex.value}, ${g2hex.value})`;
          swatchSquare.style.backgroundImage = grad;
          swatchSquare.style.backgroundSize = '';
          swatchSquare.style.backgroundPosition = '';
          swatchSquare.style.background = grad;
          swatchLabel.textContent = 'Gradient' + (a < 1 ? ` · ${Math.round(a * 100)}%` : '');
          // Inside-popover gradient preview keeps the actual alpha so the user can see the real result.
          if (gradPreview) {
            const c1 = withAlpha(g1hex.value, a);
            const c2 = withAlpha(g2hex.value, a);
            gradPreview.style.background = `linear-gradient(${currentAngle()}deg, ${c1}, ${c2})`;
          }
        } else {
          swatchSquare.style.backgroundImage = '';
          swatchSquare.style.background = solidHex.value;
          swatchLabel.textContent = (solidHex.value || '').toUpperCase() + (a < 1 ? ` · ${Math.round(a * 100)}%` : '');
        }
      }

      // Move popover to body so it can escape panel overflow
      if (popover.parentElement !== document.body) {
        document.body.appendChild(popover);
      }
      function positionPopover() {
        const r = swatchBtn.getBoundingClientRect();
        const W = 260, MARGIN = 8;
        // If the swatch lives inside another (shadow/typography) popover, base
        // positioning off that popover so the color picker doesn't stack on top
        // of its parent. Otherwise, fall back to the main panel.
        const wrapper = swatchBtn.closest('[data-lp-popover2-content]') || panel;
        const wrapperRect = wrapper.getBoundingClientRect();
        let left = wrapperRect.left - W - MARGIN;
        if (left < MARGIN) left = wrapperRect.right + MARGIN;
        if (left + W > window.innerWidth - MARGIN) left = Math.max(MARGIN, window.innerWidth - W - MARGIN);
        let top = r.top;
        // Keep within viewport vertically (popover ~ 320px tall when gradient open)
        const estH = 340;
        if (top + estH > window.innerHeight - MARGIN) top = Math.max(MARGIN, window.innerHeight - estH - MARGIN);
        popover.style.left = left + 'px';
        popover.style.top = top + 'px';
      }
      // Open / close popover
      swatchBtn.onclick = (e) => {
        e.stopPropagation();
        const wasOpen = popover.style.display === 'block';
        // close any other popovers (across all blocks)
        document.querySelectorAll('[data-lp-popover]').forEach((p) => (p.style.display = 'none'));
        if (!wasOpen) {
          popover.style.display = 'block';
          positionPopover();
        }
      };
      popover.addEventListener('click', (e) => e.stopPropagation());
      popover.querySelector('[data-lp-popover-close]').onclick = () => { popover.style.display = 'none'; };
      window.addEventListener('scroll', () => { if (popover.style.display === 'block') positionPopover(); }, true);
      window.addEventListener('resize', () => { if (popover.style.display === 'block') positionPopover(); });

      // V2: state-prefixed props (e.g. "state-background-color") route to the active pseudo-state.
      const isStateProp = prop.startsWith('state-');
      function realStateProp() {
        if (prop === 'state-background-color') return 'background-color';
        if (prop === 'state-color') return 'color';
        if (prop === 'state-border-color') return 'border-color';
        if (prop === 'state-shadow-color') return 'box-shadow';
        return prop.slice(6);
      }
      function applySolid(hex) {
        const v = withAlpha(hex, currentAlpha());
        if (isStateProp) {
          const rp = realStateProp();
          if (rp === 'box-shadow') {
            // For state shadow color, build a default offset/blur shadow with this color
            setStateProp(currentState, 'box-shadow', `0 4px 8px ${v}`);
          } else {
            setStateProp(currentState, rp, v);
          }
          return;
        }
        if (prop === 'color') {
          setProps({ color: v }, ['background-image', '-webkit-background-clip', '-webkit-text-fill-color', 'background-clip']);
        } else if (prop === 'border-color') {
          setProps({ 'border-color': v }, ['border-image']);
        } else if (prop === 'shadow-color') {
          const cur = draft['box-shadow'] || cs.boxShadow || '0 4px 8px rgba(0,0,0,0.12)';
          if (cur === 'none') { setProp('box-shadow', `0 4px 8px ${v}`); return; }
          const offsetBlur = cur.replace(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i, '').trim();
          setProp('box-shadow', `${offsetBlur} ${v}`);
        } else {
          setProps({ 'background-color': v }, ['background-image']);
        }
      }
      function applyGrad() {
        const a = currentAlpha();
        const c1 = withAlpha(g1hex.value, a);
        const c2 = withAlpha(g2hex.value, a);
        const grad = `linear-gradient(${currentAngle()}deg, ${c1}, ${c2})`;
        if (isStateProp) {
          const rp = realStateProp();
          // Only background gradient is meaningful per-state; fall back to solid for other props.
          if (rp === 'background-color') {
            setStateProp(currentState, 'background-image', grad);
          } else {
            setStateProp(currentState, rp, withAlpha(g1hex.value, a));
          }
          return;
        }
        if (prop === 'color') {
          setProps({
            'background-image': grad,
            '-webkit-background-clip': 'text',
            'background-clip': 'text',
            '-webkit-text-fill-color': 'transparent',
            'color': 'transparent',
          });
        } else if (prop === 'border-color') {
          // Gradient borders via border-image; ensure border-style is solid
          setProps({ 'border-image': `${grad} 1`, 'border-style': 'solid' }, ['border-color']);
        } else {
          setProps({ 'background-image': grad }, []);
        }
      }
      function setMode(mode) {
        popover.dataset.mode = mode;
        modeBtns.forEach((b) => {
          const isActive = b.dataset.lpMode === mode;
          b.style.background = isActive ? '#4f9eff' : 'transparent';
        });
        solidPanel.style.display = mode === 'solid' ? 'block' : 'none';
        gradPanel.style.display = mode === 'gradient' ? 'block' : 'none';
        if (mode === 'solid') applySolid(solidHex.value);
        else applyGrad();
        refreshSwatch();
      }
      modeBtns.forEach((b) => (b.onclick = () => setMode(b.dataset.lpMode)));

      solidPick.oninput = () => { solidHex.value = solidPick.value.toUpperCase(); applySolid(solidPick.value); refreshSwatch(); };
      solidHex.onchange = () => {
        let v = solidHex.value.trim();
        if (!v.startsWith('#')) v = '#' + v;
        solidHex.value = v.toUpperCase();
        solidPick.value = rgbToHex(v);
        applySolid(v);
        refreshSwatch();
      };
      g1pick.oninput = () => { g1hex.value = g1pick.value.toUpperCase(); applyGrad(); refreshSwatch(); };
      g1hex.onchange = () => { g1pick.value = rgbToHex(g1hex.value); applyGrad(); refreshSwatch(); };
      g2pick.oninput = () => { g2hex.value = g2pick.value.toUpperCase(); applyGrad(); refreshSwatch(); };
      g2hex.onchange = () => { g2pick.value = rgbToHex(g2hex.value); applyGrad(); refreshSwatch(); };
      wireScrubber(angleScrub, () => { applyGrad(); refreshSwatch(); });
      wireScrubber(alphaScrub, () => {
        if (popover.dataset.mode === 'gradient') applyGrad();
        else applySolid(solidHex.value);
        refreshSwatch();
      });

      // Inline "save current color to palette" button (popover lives in body now)
      const palSaveBtn = popover.querySelector('[data-lp-pal-save]');
      if (palSaveBtn) {
        palSaveBtn.onclick = () => {
          const c = (solidHex.value || '').toUpperCase();
          if (!c.startsWith('#')) return;
          if (!customPalette.includes(c)) customPalette.push(c);
          savePalette();
          refreshPalette();
          // Brief visual confirmation
          const prevBg = palSaveBtn.style.background;
          palSaveBtn.style.background = '#1d4d2a';
          palSaveBtn.style.color = '#7eea9b';
          setTimeout(() => { palSaveBtn.style.background = prevBg; palSaveBtn.style.color = '#888'; }, 600);
        };
      }

      // Custom palette (lives inside popover, which is appended to body)
      const palRow = popover.querySelector('[data-lp-pal-row]');
      function refreshPalette() {
        palRow.innerHTML = customPalette.map((c, i) =>
          `<button data-lp-pal="${c}" data-pal-idx="${i}" title="Right-click to remove" style="width:22px;height:22px;background:${c};border:1px solid #2a2a2a;border-radius:4px;cursor:pointer;padding:0;"></button>`
        ).join('') + `<button data-lp-pal-add style="width:22px;height:22px;background:#0e0e0e;border:1px dashed #444;color:#888;border-radius:4px;cursor:pointer;padding:0;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;">+</button>`;
        wirePalette();
      }
      function wirePalette() {
        palRow.querySelectorAll('[data-lp-pal]').forEach((b) => {
          b.onclick = () => {
            const c = b.dataset.lpPal;
            solidHex.value = c.toUpperCase();
            solidPick.value = rgbToHex(c);
            setMode('solid');
            refreshSwatch();
          };
          b.oncontextmenu = (e) => {
            e.preventDefault();
            const idx = parseInt(b.dataset.palIdx);
            customPalette.splice(idx, 1);
            savePalette();
            refreshPalette();
          };
        });
        const addBtn = palRow.querySelector('[data-lp-pal-add]');
        if (addBtn) {
          addBtn.onclick = () => {
            const tmp = document.createElement('input');
            tmp.type = 'color';
            tmp.value = solidPick.value || '#4f46e5';
            tmp.style.position = 'fixed';
            tmp.style.left = '-9999px';
            document.body.appendChild(tmp);
            tmp.addEventListener('change', () => {
              const c = tmp.value.toUpperCase();
              if (!customPalette.includes(c)) customPalette.push(c);
              savePalette();
              refreshPalette();
              tmp.remove();
            });
            tmp.click();
          };
        }
      }
      refreshPalette();
      refreshSwatch();
    } // end wireColorBlock
    panel.querySelectorAll('[data-lp-colorblock]').forEach(wireColorBlock);

    // V2 IA: generic popover trigger rows (Shadow, Typography, …)
    panel.querySelectorAll('[data-lp-popover2]').forEach((block) => {
      const trigger = block.querySelector('[data-lp-popover2-trigger]');
      const popover = block.querySelector('[data-lp-popover2-content]');
      if (!trigger || !popover) return;
      // Move popover to body so it can escape the panel's overflow:auto.
      if (popover.parentElement !== document.body) document.body.appendChild(popover);
      function position() {
        const r = trigger.getBoundingClientRect();
        const W = popover.offsetWidth || 280;
        const MARGIN = 8;
        const panelRect = panel.getBoundingClientRect();
        let left = panelRect.left - W - MARGIN;
        if (left < MARGIN) left = panelRect.right + MARGIN;
        if (left + W > window.innerWidth - MARGIN) left = Math.max(MARGIN, window.innerWidth - W - MARGIN);
        let top = r.top;
        const estH = popover.offsetHeight || 320;
        if (top + estH > window.innerHeight - MARGIN) top = Math.max(MARGIN, window.innerHeight - estH - MARGIN);
        popover.style.left = left + 'px';
        popover.style.top = top + 'px';
      }
      trigger.onclick = (e) => {
        e.stopPropagation();
        const wasOpen = popover.style.display === 'block';
        // Close other top-level popovers (both v1 color popovers and v2 popover-rows).
        document.querySelectorAll('[data-lp-popover2-content]').forEach((p) => { if (p !== popover) p.style.display = 'none'; });
        if (!wasOpen) {
          popover.style.display = 'block';
          position();
        } else {
          popover.style.display = 'none';
        }
      };
      popover.addEventListener('click', (e) => e.stopPropagation());
      const closeBtn = popover.querySelector('[data-lp-popover2-close]');
      if (closeBtn) closeBtn.onclick = () => { popover.style.display = 'none'; };
      window.addEventListener('scroll', () => { if (popover.style.display === 'block') position(); }, true);
      window.addEventListener('resize', () => { if (popover.style.display === 'block') position(); });
    });

    // ---------- V2 IA: pill switchers ----------
    // After re-rendering the whole panel via openPanel, wirePanel runs fresh and
    // calls repositionIndicators with the bounds we captured before the rebuild.
    // Capture-and-clear into a local so the rAF actually reads the bounds (otherwise
    // pendingPillBounds = null runs synchronously before the rAF callback fires).
    const _pendingBounds = pendingPillBounds;
    pendingPillBounds = null;
    requestAnimationFrame(() => repositionIndicatorsModule(_pendingBounds));

    // Quick presets — switching presets wipes prior preset contributions.
    const PRESET_BASE_KEYS = ['box-shadow','opacity','background-color','color','border','border-color','border-width','border-style'];
    function clearPresetState() {
      PRESET_BASE_KEYS.forEach((k) => delete draft[k]);
      delete draft.__states;
      delete draft.__transition;
      delete draft.__activePreset;
    }
    function rerenderPanel() {
      pendingPillBounds = snapshotIndicatorBoundsModule();
      if (selectedEl) openPanel(selectedEl);
    }
    // Audit mode toggle (header button, panel-level)
    const modeToggleBtn = panel.querySelector('[data-lp-mode-toggle]');
    if (modeToggleBtn) modeToggleBtn.onclick = () => {
      panelMode = panelMode === 'audit' ? 'edit' : 'audit';
      if (panelMode === 'audit') {
        auditIssues = scanForSpacingIssues();
        renderAuditOverlay(auditIssues);
      } else {
        clearAuditOverlay();
      }
      rerenderPanel();
    };
    // State pills
    panel.querySelectorAll('[data-lp-state]').forEach((b) => {
      b.onclick = () => {
        if (panelState === b.dataset.lpState) return;
        panelState = b.dataset.lpState;
        rerenderPanel();
      };
    });
    // Quick presets
    panel.querySelectorAll('[data-lp-preset]').forEach((b) => {
      b.onclick = () => {
        const name = b.dataset.lpPreset;
        if (draft.__activePreset === name) {
          lastUndoCheckpoint = 0;
          pushUndo();
          clearPresetState();
          apply();
          showToast('Preset cleared');
          rerenderPanel();
          return;
        }
        const recipe = presetRecipe(name, presetContext(el, draft, cs));
        if (!recipe) return;
        lastUndoCheckpoint = 0;
        pushUndo();
        clearPresetState();
        if (recipe.base) Object.assign(draft, recipe.base);
        if (recipe.stateMaps && Object.keys(recipe.stateMaps).length) {
          draft.__states = {};
          for (const [s, props] of Object.entries(recipe.stateMaps)) {
            draft.__states[s] = { ...props };
          }
        }
        if (recipe.transition) draft.__transition = { ...recipe.transition };
        draft.__activePreset = name;
        apply();
        showToast(`Preset: ${b.textContent}`);
        rerenderPanel();
      };
    });
    // Transform scrubbers (visible on hover/active only)
    const scaleScrub = panel.querySelector('[data-lp-scrub][data-min="0.8"]');
    if (scaleScrub) wireScrubber(scaleScrub, (v) => setProp('__scale', String(v)));
    const tyScrub = panel.querySelector('[data-lp-scrub][data-min="-10"]');
    if (tyScrub) wireScrubber(tyScrub, (v) => setProp('__translateY', v + 'px'));
    // Transition row
    const durScrub = panel.querySelector('[data-lp-scrub][data-suffix="ms"]');
    if (durScrub) wireScrubber(durScrub, (v) => setTransition('duration', v + 'ms'));
    const easeSelect = panel.querySelector('[data-lp-easing-select]');
    if (easeSelect) easeSelect.onchange = () => setTransition('easing', easeSelect.value);
    // Save action
    const saveBtn = panel.querySelector('[data-lp-save]');
    if (saveBtn) saveBtn.onclick = () => { saveOverrides(); showToast('Saved'); };
    // Audit body content (only meaningful when panelMode === 'audit')
    if (panelMode === 'audit') {
      const av = panel.querySelector('[data-lp-view="audit"]');
      if (av) av.innerHTML = auditViewHTML(auditIssues);
    }

    // V2 IA: audit detail wiring (when in audit mode and an issue element is clicked,
    // the panel rerender lands on this element with its audit detail).
    const auditView = panel.querySelector('[data-lp-view="audit"]');
    function renderAuditDetail(target) {
      if (!auditView) return;
      auditView.innerHTML = auditDetailHTML(target, auditIssues);
      auditView.querySelector('[data-lp-audit-back]').onclick = () => {
        if (auditView) auditView.innerHTML = auditViewHTML(auditIssues);
      };
      const elIssues = auditIssues.filter((i) => i.el === target);
      auditView.querySelectorAll('[data-lp-audit-fix]').forEach((b) => {
        b.onclick = () => {
          const idx = parseInt(b.dataset.idx);
          applyAuditFixes([elIssues[idx]]);
          auditIssues = scanForSpacingIssues();
          renderAuditOverlay(auditIssues);
          if (auditIssues.some((i) => i.el === target)) renderAuditDetail(target);
          else if (auditView) auditView.innerHTML = auditViewHTML(auditIssues);
        };
      });
      auditView.querySelectorAll('[data-lp-audit-fix-similar]').forEach((b) => {
        b.onclick = () => {
          const idx = parseInt(b.dataset.idx);
          const seed = elIssues[idx];
          const similar = auditIssues.filter((i) => i.el.tagName === seed.el.tagName && i.prop === seed.prop);
          applyAuditFixes(similar);
          auditIssues = scanForSpacingIssues();
          renderAuditOverlay(auditIssues);
          if (auditIssues.some((i) => i.el === target)) renderAuditDetail(target);
          else if (auditView) auditView.innerHTML = auditViewHTML(auditIssues);
        };
      });
    }
    window.__lpRenderAuditDetail = renderAuditDetail;

    // Contrast Fix button — re-render so the badge reflects the new ratio.
    const contrastBtn = panel.querySelector('[data-lp-contrast-fix]');
    if (contrastBtn) {
      contrastBtn.onclick = () => {
        const newColor = suggestContrastFix(getEffectiveBackground(el));
        setProp('color', newColor);
        rerenderPanel();
      };
    }

    // Apply initial disabled state for border style buttons
    refreshBorderStyleAvailability();

    // Close any open color popovers on outside click / Escape
    const closePopovers = () => {
      panel.querySelectorAll('[data-lp-popover]').forEach((p) => (p.style.display = 'none'));
      document.querySelectorAll('[data-lp-popover2-content]').forEach((p) => (p.style.display = 'none'));
    };
    document.addEventListener('click', closePopovers);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePopovers();
    });
  }

  // ---------- Boot ----------
  document.addEventListener('keydown', onKey);
  renderStyleTag();
  console.log(
    '%c Live Polish ready — Ctrl+Shift+P to toggle ',
    'background:#4f9eff;color:#fff;padding:4px 8px;border-radius:4px;font-weight:600;'
  );
})();
