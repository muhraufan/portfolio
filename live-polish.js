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
  let hoverHighlight = null; // dashed gray, follows cursor
  let overrides = loadJSON(STORAGE_KEY) || {};
  let customPalette = loadJSON(PALETTE_KEY) || [];

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
      const body = Object.entries(props)
        .map(([k, v]) => `${k}: ${v} !important;`)
        .join(' ');
      if (body) css += `${sel} { ${body} }\n`;
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

  function rgbToHex(rgb) {
    if (!rgb) return '#000000';
    if (rgb.startsWith('#')) return rgb.length === 4
      ? '#' + [...rgb.slice(1)].map((c) => c + c).join('')
      : rgb.slice(0, 7);
    const m = rgb.match(/\d+(\.\d+)?/g);
    if (!m || m.length < 3) return '#000000';
    return '#' + m.slice(0, 3).map((n) => parseInt(n).toString(16).padStart(2, '0')).join('');
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
      hoverHighlight = makeHighlight({
        border: '1px dashed rgba(255,255,255,0.7)',
        outline: '1px dashed rgba(0,0,0,0.5)',
        background: 'transparent',
      });
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
    if (el.closest && (el.closest(`#${UI_ID}`) || el.closest('[data-lp-popover]'))) return true;
    return el === selectedHighlight || el === hoverHighlight;
  }
  function onMove(e) {
    if (!active) return;
    const el = e.target;
    if (isUI(el)) { place(hoverHighlight, null); return; }
    if (el === hoverEl) return;
    hoverEl = el;
    // hover always shown lightly; selected highlight stays put
    if (el === selectedEl) place(hoverHighlight, null);
    else place(hoverHighlight, el);
  }
  function onClick(e) {
    if (!active) return;
    if (isUI(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    selectElement(e.target);
  }
  function onKey(e) {
    if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault(); toggle(); return;
    }
    if (e.key === 'Escape' && active) {
      if (panel) closePanel(); else toggle();
    }
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
    if (panel) { panel.remove(); panel = null; }
    selectedEl = null;
    if (selectedHighlight) place(selectedHighlight, null);
  }

  function openPanel(el) {
    if (panel) panel.remove();
    const type = getElementType(el);
    const sel = getSelector(el);
    const cs = getComputedStyle(el);

    panel = document.createElement('div');
    panel.id = UI_ID;
    Object.assign(panel.style, {
      position: 'fixed', top: '60px', right: '20px', width: '360px',
      maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
      background: '#171717', color: '#e5e5e5', borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '13px', lineHeight: '1.4',
      zIndex: 2147483647, border: '1px solid #2a2a2a',
    });
    panel.innerHTML = panelHTML(el, type, sel, cs);
    document.body.appendChild(panel);
    wirePanel(el, type, sel, cs);
  }

  function panelHTML(el, type, sel, cs) {
    const tag = el.tagName.toLowerCase();
    const label = elementLabel(el, tag);
    const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const escHTML = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
      <div data-lp-drag style="cursor:move;padding:12px 14px;border-bottom:1px solid #2a2a2a;display:flex;justify-content:space-between;align-items:center;background:#1f1f1f;border-radius:12px 12px 0 0;">
        <div style="min-width:0;flex:1;">
          <div style="font-weight:600;font-size:13px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escAttr(label)}">${escHTML(label)}</div>
          <div style="font-size:11px;color:#888;margin-top:2px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escAttr(sel || '')}">&lt;${tag}&gt; · ${type}</div>
        </div>
        <button data-lp-close style="background:none;border:none;color:#888;font-size:18px;cursor:pointer;padding:0 4px;line-height:1;flex-shrink:0;">×</button>
      </div>
      <div style="padding:12px 14px;">
        ${type === 'button' ? buttonSection(cs) : ''}
        ${type === 'text' ? textSection(cs) : ''}
        ${type === 'container' ? containerSection(el, cs) : ''}
        ${commonPaidSection(type, cs)}
      </div>
      <div style="padding:10px 14px 12px;border-top:1px solid #2a2a2a;background:#1a1a1a;border-radius:0 0 12px 12px;position:sticky;bottom:0;">
        <div data-lp-scope-row style="display:flex;justify-content:flex-start;margin-bottom:8px;">
          <div data-lp-scope style="display:inline-flex;background:#0e0e0e;border:1px solid #2a2a2a;border-radius:6px;padding:2px;">
            <button data-lp-scope-val="this" style="background:#2a2a2a;color:#e5e5e5;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:500;">This element</button>
            <button data-lp-scope-val="all" style="background:transparent;color:#888;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:500;">All <span data-lp-scope-count style="opacity:0.7;"></span></button>
          </div>
        </div>
        <div style="display:flex;gap:6px;">
          <button data-lp-reset title="Revert all changes for this element" style="background:#2a2a2a;color:#e5e5e5;border:none;padding:9px 12px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:500;">Reset</button>
          <button data-lp-copy="css" style="flex:1;background:#2a2a2a;color:#e5e5e5;border:none;padding:9px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:5px;">
            <span style="font-size:13px;">⧉</span> Copy CSS
          </button>
          <button data-lp-copy="prompt" style="flex:1;background:#4f9eff;color:#fff;border:none;padding:9px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:5px;">
            <span style="font-size:13px;">✦</span> Copy AI Prompt
          </button>
        </div>
      </div>
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

  function buttonSection(cs) {
    const padActive = (parseInt(cs.paddingTop) || 0) > 0;
    return (
      collapsibleSection('padding', padActive, 'Spacing',
        rowLabel('Padding', stepperHTML('padding', parseInt(cs.paddingTop) || 0, 'one'))
      ) +
      sectionWrap('Typography',
        rowLabel('Font', fontSelectHTML(cs.fontFamily)) +
        rowLabel('Size', stepperHTML('font-size', parseInt(cs.fontSize) || 16, 'one')) +
        rowLabel('Weight', segHTML('font-weight', [
          { v: 400, l: '400' }, { v: 500, l: '500' }, { v: 600, l: '600' }, { v: 700, l: '700' }
        ], cs.fontWeight))
      )
    );
  }
  function textSection(cs) {
    const stored = overrides[getSelector(selectedEl)] || {};
    const colorVal = stored['background-image'] && stored['background-image'].includes('gradient')
      ? stored['background-image']
      : (stored['color'] || cs.color);
    return sectionWrap('Typography',
      rowLabel('Font', fontSelectHTML(cs.fontFamily)) +
      rowLabel('Size', stepperHTML('font-size', parseInt(cs.fontSize) || 16, 'one')) +
      rowLabel('Weight', segHTML('font-weight', [
        { v: 400, l: '400' }, { v: 500, l: '500' }, { v: 600, l: '600' }, { v: 700, l: '700' }
      ], cs.fontWeight)) +
      rowLabel('Line', segHTML('line-height', [
        { v: '1.1', l: 'Tight' }, { v: '1.5', l: 'Normal' }, { v: '1.75', l: 'Relax' }, { v: '2', l: 'Loose' }
      ], cs.lineHeight))
    ) + sectionWrap('Text Color', colorBlockHTML('color', colorVal, true));
  }
  function containerSection(el, cs) {
    const isFlexGrid = ['flex','grid','inline-flex','inline-grid'].includes(cs.display);
    const padActive = (parseInt(cs.paddingTop) || 0) > 0 || (isFlexGrid && (parseInt(cs.gap) || 0) > 0);
    return collapsibleSection('padding', padActive, 'Spacing',
      rowLabel('Padding', stepperHTML('padding', parseInt(cs.paddingTop) || 0, 'one')) +
      (isFlexGrid ? rowLabel('Gap', stepperHTML('gap', parseInt(cs.gap) || 0, 'one')) : '')
    );
  }

  function commonPaidSection(type, cs) {
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
            `<button data-lp-seg="border-radius" data-val="${o.v}" style="flex:1;background:${parseInt(o.v) === radius || (radius >= 9999 && o.v === '9999px') ? '#4f9eff' : '#0e0e0e'};color:#aaa;border:1px solid #2a2a2a;padding:5px 0;border-radius:5px;cursor:pointer;font-size:11px;">${o.l}</button>`
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
    function setProp(prop, value) {
      if (value === null || value === undefined || value === '') delete draft[prop];
      else draft[prop] = value;
      apply();
    }
    function setProps(obj, clearKeys) {
      (clearKeys || []).forEach((k) => delete draft[k]);
      Object.assign(draft, obj);
      apply();
    }

    panel.querySelector('[data-lp-close]').onclick = closePanel;

    // Collapsible sections: +/− toggles between compact header and full controls.
    panel.querySelectorAll('[data-lp-section]').forEach((sec) => {
      const compact = sec.querySelector('[data-lp-section-compact]');
      const full = sec.querySelector('[data-lp-section-full]');
      const addBtn = sec.querySelector('[data-lp-section-add]');
      const removeBtn = sec.querySelector('[data-lp-section-remove]');
      if (addBtn) addBtn.onclick = () => { compact.style.display = 'none'; full.style.display = 'block'; };
      if (removeBtn) removeBtn.onclick = () => { compact.style.display = 'flex'; full.style.display = 'none'; };
    });

    // Copy buttons (CSS + AI prompt)
    let scope = 'this'; // 'this' | 'all'
    function allChangedSelectors() {
      // Snapshot from overrides; current draft is already mirrored into overrides[sel] via apply().
      return Object.entries(overrides).filter(([, v]) => v && Object.keys(v).length > 0);
    }
    function formatCSS() {
      if (scope === 'all') {
        const all = allChangedSelectors();
        if (!all.length) return `/* No changes yet */`;
        return all
          .map(([s, props]) => {
            const body = Object.entries(props).map(([k, v]) => `  ${k}: ${v};`).join('\n');
            return `${s} {\n${body}\n}`;
          })
          .join('\n\n');
      }
      const props = Object.entries(draft);
      if (!props.length) return `/* No changes yet for ${sel} */`;
      const body = props.map(([k, v]) => `  ${k}: ${v};`).join('\n');
      return `${sel} {\n${body}\n}`;
    }
    function formatPrompt() {
      const projectName = (document.title || location.hostname || 'this project').trim();
      // Tight per-element block: tag, selector, text hint (so the agent can grep), and rules.
      function elementBlock(selector, props) {
        const node = (() => { try { return document.querySelector(selector); } catch { return null; } })();
        const tag = node ? node.tagName.toLowerCase() : 'element';
        const text = node ? (node.innerText || '').trim().slice(0, 40).replace(/\s+/g, ' ') : '';
        const head = text
          ? `<${tag}> "${text}${(node.innerText || '').trim().length > 40 ? '…' : ''}"`
          : `<${tag}>`;
        const rules = Object.entries(props).map(([k, v]) => `  ${k}: ${v};`).join('\n');
        return `${head}\n${selector} {\n${rules}\n}`;
      }
      if (scope === 'all') {
        const all = allChangedSelectors();
        if (!all.length) return `No changes to apply on ${projectName}.`;
        const blocks = all.map(([s, props]) => elementBlock(s, props)).join('\n\n');
        return `Apply these style changes on ${projectName}. Use the quoted text to grep for each element in the codebase; selectors are a fallback. Edit in the project's idiom (Tailwind / CSS modules / vanilla / tokens) — keep the diff minimal.\n\n${blocks}`;
      }
      const props = Object.entries(draft);
      if (!props.length) return `No changes to apply for ${sel} on ${projectName}.`;
      const block = elementBlock(sel, draft);
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
      const n = allChangedSelectors().length;
      const showCount = n > 1;
      scopeCount.textContent = showCount ? `(${n})` : '';
      const allBtn = panel.querySelector('[data-lp-scope-val="all"]');
      // Only let the user pick "All" when there's actually more than one element with changes
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

    panel.querySelector('[data-lp-reset]').onclick = () => {
      delete overrides[sel];
      saveOverrides();
      const cur = selectedEl;
      closePanel();
      if (cur) selectElement(cur);
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
        const input = panel.querySelector(`[data-lp-input="${prop}"]`);
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
          next = Math.max(0, cur + dir);
        }
        input.value = next + 'px';
        setProp(prop, next + 'px');
      };
    });

    // Direct input
    panel.querySelectorAll('[data-lp-input]').forEach((input) => {
      input.onchange = () => {
        let v = input.value.trim();
        if (/^\d+(\.\d+)?$/.test(v)) v = v + 'px';
        setProp(input.dataset.lpInput, v);
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
        panel.querySelectorAll(`[data-lp-seg="${prop}"]`).forEach((b) => {
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

    // Color blocks (solid / gradient + custom palette)
    panel.querySelectorAll('[data-lp-colorblock]').forEach((block) => {
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
        // Default: open to the LEFT of the panel, aligned to swatch top
        const panelRect = panel.getBoundingClientRect();
        let left = panelRect.left - W - MARGIN;
        if (left < MARGIN) left = panelRect.right + MARGIN; // fallback to right side
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

      function applySolid(hex) {
        const v = withAlpha(hex, currentAlpha());
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
    });

    // Apply initial disabled state for border style buttons
    refreshBorderStyleAvailability();

    // Close any open color popovers on outside click / Escape
    const closePopovers = () => {
      panel.querySelectorAll('[data-lp-popover]').forEach((p) => (p.style.display = 'none'));
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
