// ---- GuestbookForm ----
// Sits between the past-entries scroll and the mail slot.
//
// Three elements only:
//   1. Optional name field — Caveat font, no border except a faint bottom line
//   2. "Sign" / "Stamp" tab switcher
//   3. Active tab content — canvas (Sign) or 6 emoji stamps (Stamp)
//
// There is deliberately no submit button. The parent materializes a
// draggable letter from getEntry()/onReady(), and submission happens
// via the drag-into-slot interaction (next prompt).
//
// Contract:
//   const form = GuestbookForm({ onReady });
//   panelForm.appendChild(form.el);
//   form.isReady();     // boolean — true if name / drawing / stamp filled
//   form.getEntry();    // { name, drawData, stamp }
//   form.reset();
//   form.destroy();
//
// onReady is invoked whenever the form has at least one field filled —
// every meaningful change (typing, drawing, stamp pick, tab switch)
// triggers a fresh call so the parent can keep the letter in sync.

const STYLESHEET_ID = 'gb-stylesheet';
const STYLESHEET_HREF = '/components/Guestbook/guestbook.css';

function ensureStylesheet() {
  if (document.getElementById(STYLESHEET_ID)) return;
  const link = document.createElement('link');
  link.id = STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = STYLESHEET_HREF;
  document.head.appendChild(link);
}

const STAMPS = ['📷', '☕', '🌙', '✏️', '🎞️', '🌿'];

const STROKE_COLOR = '#1a1a1a';
const STROKE_WIDTH = 2;

/**
 * @param {{ onReady?: (entry: { name: string, drawData: string|null, stamp: string|null }) => void }} [props]
 */
export function GuestbookForm(props = {}) {
  ensureStylesheet();
  const { onReady } = props;

  // ================================================================
  // DOM
  // ================================================================
  const root = document.createElement('div');
  root.className = 'gb-form';

  // --- Name field ---
  const nameWrap = document.createElement('div');
  nameWrap.className = 'gb-form-name-wrap';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'gb-form-name';
  nameInput.placeholder = 'Your name (optional)';
  nameInput.autocomplete = 'off';
  nameInput.spellcheck = false;
  nameInput.maxLength = 60;
  nameInput.setAttribute('aria-label', 'Your name (optional)');
  nameWrap.appendChild(nameInput);
  root.appendChild(nameWrap);

  // --- Tabs ---
  const tabsWrap = document.createElement('div');
  tabsWrap.className = 'gb-form-tabs';
  tabsWrap.setAttribute('role', 'tablist');

  const signTab = document.createElement('button');
  signTab.type = 'button';
  signTab.className = 'gb-form-tab is-active';
  signTab.textContent = 'Sign';
  signTab.setAttribute('role', 'tab');
  signTab.setAttribute('aria-selected', 'true');

  const stampTab = document.createElement('button');
  stampTab.type = 'button';
  stampTab.className = 'gb-form-tab';
  stampTab.textContent = 'Stamp';
  stampTab.setAttribute('role', 'tab');
  stampTab.setAttribute('aria-selected', 'false');

  tabsWrap.appendChild(signTab);
  tabsWrap.appendChild(stampTab);
  root.appendChild(tabsWrap);

  // --- Tab panels ---
  const panels = document.createElement('div');
  panels.className = 'gb-form-panels';
  root.appendChild(panels);

  // Sign panel (canvas)
  const signPanel = document.createElement('div');
  signPanel.className = 'gb-form-panel gb-form-sign is-active';
  signPanel.setAttribute('role', 'tabpanel');
  signPanel.setAttribute('aria-label', 'Draw your signature');

  const canvas = document.createElement('canvas');
  canvas.className = 'gb-form-canvas';
  // Backing store set later by setupCanvas(); the CSS sets the visual size.
  canvas.width = 600;
  canvas.height = 120;
  signPanel.appendChild(canvas);

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'gb-form-clear';
  clearBtn.textContent = 'Clear';
  signPanel.appendChild(clearBtn);

  // Stamp panel (emoji grid)
  const stampPanel = document.createElement('div');
  stampPanel.className = 'gb-form-panel gb-form-stamps';
  stampPanel.setAttribute('role', 'tabpanel');
  stampPanel.setAttribute('aria-label', 'Pick a stamp');

  const stampButtons = STAMPS.map((emoji) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gb-form-stamp';
    btn.dataset.stamp = emoji;
    btn.setAttribute('aria-label', `Pick the ${emoji} stamp`);
    btn.setAttribute('aria-pressed', 'false');

    const glyph = document.createElement('span');
    glyph.className = 'gb-form-stamp-emoji';
    glyph.textContent = emoji;
    btn.appendChild(glyph);

    stampPanel.appendChild(btn);
    return btn;
  });

  panels.appendChild(signPanel);
  panels.appendChild(stampPanel);

  // ================================================================
  // State
  // ================================================================
  let activeTab = 'sign';
  let selectedStamp = null;
  let hasStrokes = false;
  let nameValue = '';

  const ctx = canvas.getContext('2d');
  let canvasReady = false;

  // ================================================================
  // Canvas — setup + drawing
  // ================================================================

  // Configure backing store + stroke style. Runs once when the canvas
  // first gets non-zero layout (which may be after the panel opens).
  function setupCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return false;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.fillStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    canvasReady = true;
    return true;
  }

  // Observe size changes to setup on first-layout. After first setup
  // we stop re-initializing so user strokes aren't wiped.
  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (!canvasReady) setupCanvas();
        })
      : null;
  if (ro) ro.observe(canvas);

  // --- Drawing state ---
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
    if (!canvasReady && !setupCanvas()) return;
    if (e.cancelable) e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;

    // Start a new path and drop a tiny dot so single-tap leaves a mark.
    ctx.beginPath();
    ctx.arc(lastX, lastY, STROKE_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);

    if (!hasStrokes) {
      hasStrokes = true;
      notifyReady();
    }
  }

  function draw(e) {
    if (!drawing) return;
    if (e.cancelable) e.preventDefault();
    const pos = getPos(e);

    // Smoothed stroke: quadratic curve through the midpoint between
    // the previous and current sample.
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
    // Flush the remaining segment so the last bit of the stroke lands.
    ctx.lineTo(lastX, lastY);
    ctx.stroke();
    notifyReady();
  }

  function clearCanvas() {
    if (canvasReady) {
      const rect = canvas.getBoundingClientRect();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    hasStrokes = false;
    drawing = false;
    notifyReady();
  }

  // ================================================================
  // Tabs
  // ================================================================
  function setTab(tab) {
    if (activeTab === tab) return;
    activeTab = tab;

    const isSign = tab === 'sign';
    signTab.classList.toggle('is-active', isSign);
    stampTab.classList.toggle('is-active', !isSign);
    signTab.setAttribute('aria-selected', String(isSign));
    stampTab.setAttribute('aria-selected', String(!isSign));
    signPanel.classList.toggle('is-active', isSign);
    stampPanel.classList.toggle('is-active', !isSign);

    // If we just revealed the canvas for the first time, give it a chance
    // to initialize now that it has layout.
    if (isSign && !canvasReady) {
      requestAnimationFrame(setupCanvas);
    }

    notifyReady();
  }

  // ================================================================
  // Stamp selection
  // ================================================================
  function selectStamp(emoji) {
    // Tapping the already-selected stamp deselects it.
    selectedStamp = selectedStamp === emoji ? null : emoji;

    stampButtons.forEach((btn) => {
      const isSel = btn.dataset.stamp === selectedStamp;
      btn.classList.toggle('is-selected', isSel);
      btn.setAttribute('aria-pressed', String(isSel));
    });

    notifyReady();
  }

  // ================================================================
  // Public state read
  // ================================================================

  function getEntry() {
    return {
      name: nameValue.trim(),
      drawData: hasStrokes ? canvas.toDataURL('image/png') : null,
      stamp: selectedStamp,
    };
  }

  function isReady() {
    return !!(nameValue.trim() || hasStrokes || selectedStamp);
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
    selectedStamp = null;
    stampButtons.forEach((btn) => {
      btn.classList.remove('is-selected');
      btn.setAttribute('aria-pressed', 'false');
    });
    clearCanvas();
    setTab('sign');
  }

  // ================================================================
  // Wire events
  // ================================================================
  nameInput.addEventListener('input', () => {
    nameValue = nameInput.value;
    notifyReady();
  });

  signTab.addEventListener('click', () => setTab('sign'));
  stampTab.addEventListener('click', () => setTab('stamp'));

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseleave', endDraw);
  window.addEventListener('mouseup', endDraw);

  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', endDraw);
  canvas.addEventListener('touchcancel', endDraw);

  clearBtn.addEventListener('click', clearCanvas);

  stampButtons.forEach((btn) => {
    btn.addEventListener('click', () => selectStamp(btn.dataset.stamp));
  });

  // Try to set up the canvas on next frame if it's already visible.
  requestAnimationFrame(() => {
    if (!canvasReady) setupCanvas();
  });

  return {
    el: root,
    getEntry,
    isReady,
    reset,
    destroy() {
      if (ro) ro.disconnect();
      window.removeEventListener('mouseup', endDraw);
      root.remove();
    },
  };
}
