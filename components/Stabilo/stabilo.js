/* ════════════════════════════════════════════════════════════════════
   STABILO — real-marker text selection highlighter
   ────────────────────────────────────────────────────────────────────
   Listens to selectionchange and paints a per-line yellow SVG rect
   over each line of the selection — wobbly rotation, rounded ends,
   subtle paper grain via a turbulence/displacement filter. The
   native browser selection still happens underneath; this is purely
   visual, so copy/paste, screen readers, and find-on-page all keep
   working.

   Boots ONLY on devices with a fine pointer + no touch (i.e. desktop
   mouse / trackpad). Touch devices fall back to a flat yellow native
   selection via stabilo.css.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  // ─── Gates ───────────────────────────────────────────────────────────
  // Mobile selection UX (handles, magnifier, double-tap-to-select) is
  // a different beast — leave the native flat yellow there for now.
  const isTouch = ('ontouchstart' in window) ||
                  (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  if (isTouch) return;

  // Bail if SVG isn't available (ancient browsers). Native selection
  // still works via the fallback CSS.
  const SVG_NS = 'http://www.w3.org/2000/svg';
  if (!document.createElementNS) return;

  // ─── Config ──────────────────────────────────────────────────────────
  // All visual knobs in one place. Tune to taste.
  const C = {
    color:       '#C8DDD4',  // Portfolio mint accent.
    opacity:     0.78,
    edgePadX:    3,          // px extra on each side so highlight overshoots
                             // the text edge — feels like the marker started
                             // slightly before the letter.
    heightInset: 0.15,       // vertical inset as fraction of line height.
                             // 0.15 leaves the middle ~70% — bigger than
                             // the text glyph (so the marker overshoots
                             // top + bottom slightly, like a real Stabilo
                             // stroke) but still small enough to leave a
                             // visible gap between consecutive lines.
    cornerR:     4,
    rotateRange: 1.0,        // degrees, ±. Per-line wobble.
    bleedBlur:   0.6,        // feGaussianBlur stdDeviation. The ONLY
                             // filter we apply — feDisplacementMap was
                             // removed because it resampled the noise
                             // texture every time the rect grew during a
                             // drag, producing visible edge shimmer.
                             // Plain rect + soft blur is stable AND still
                             // reads as marker ink bleeding into paper.
  };

  // ─── Overlay creation ────────────────────────────────────────────────
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('id', 'stabilo-overlay');
  svg.setAttribute('aria-hidden', 'true');

  // Filter: subtle paper-grain displacement so the rect edges aren't
  // perfectly straight. fractalNoise + small displacement = "the
  // marker tip wasn't perfectly aligned with the line".
  const defs   = document.createElementNS(SVG_NS, 'defs');
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', 'stabilo-grain');
  // Filter region — keep padding so the displaced edge isn't clipped.
  filter.setAttribute('x', '-5%');
  filter.setAttribute('y', '-20%');
  filter.setAttribute('width',  '110%');
  filter.setAttribute('height', '140%');

  // Filter: just a soft gaussian blur. We previously chained
  // feDisplacementMap before this to make the rect edges look
  // hand-drawn, but the displacement filter resamples the noise
  // texture every time the rect's dimensions change during a drag,
  // producing a visible "shimmer" on the edges. Plain rect + soft
  // blur is rock-stable AND still reads as marker ink touching paper
  // because the blurred edge fades into the page.
  const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
  blur.setAttribute('in', 'SourceGraphic');
  blur.setAttribute('stdDeviation', String(C.bleedBlur));

  filter.appendChild(blur);
  defs.appendChild(filter);
  svg.appendChild(defs);

  const layer = document.createElementNS(SVG_NS, 'g');
  svg.appendChild(layer);

  // ─── Boot ────────────────────────────────────────────────────────────
  function boot() {
    document.body.appendChild(svg);
    document.body.classList.add('stabilo-ready');
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot, { once: true });

  // ─── Stable per-line wobble ──────────────────────────────────────────
  // Seeded by a quantised version of the rect's top + left, so during a
  // drag the same line always gets the same rotation (no jitter as the
  // selection grows pixel by pixel).
  function seededRand(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  // ─── Renderer ────────────────────────────────────────────────────────
  function clear() {
    while (layer.firstChild) layer.removeChild(layer.firstChild);
  }

  function render() {
    clear();

    const sel = document.getSelection && document.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;

    // Walk every range (usually one, but Firefox allows multi-range
    // via cmd-drag). Collect every line-rect, then draw a marker on
    // each.
    for (let r = 0; r < sel.rangeCount; r++) {
      const range = sel.getRangeAt(r);
      const rects = range.getClientRects();

      // Estimate the line height of the start element so we can
      // identify and skip "block rects" — when a selection crosses
      // block boundaries (e.g. two <li>s in the same <ul>), the
      // browser returns extra rects representing the inner block,
      // which are typically 1.5-3× a single line tall and visually
      // fuse adjacent lines into one solid slab. Anything taller
      // than ~1.5× our expected line height is a block rect, not a
      // text-line rect — drop it.
      const startNode = range.startContainer.nodeType === 3
        ? range.startContainer.parentElement
        : range.startContainer;
      let expectedLH = 24;
      if (startNode && startNode.nodeType === 1) {
        const cs = window.getComputedStyle(startNode);
        const lh = parseFloat(cs.lineHeight);
        const fs = parseFloat(cs.fontSize);
        if (!isNaN(lh) && lh > 0) expectedLH = lh;
        else if (!isNaN(fs)) expectedLH = fs * 1.4;
      }
      const maxLineHeight = expectedLH * 1.5;

      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        // Filter spurious tiny rects (browsers occasionally return them
        // for zero-width caret positions or invisible nodes).
        if (rect.width < 2 || rect.height < 6) continue;
        // Filter block-spanning rects.
        if (rect.height > maxLineHeight) continue;

        const padY = rect.height * C.heightInset;
        const x = rect.left  - C.edgePadX;
        const y = rect.top   + padY;
        const w = rect.width + C.edgePadX * 2;
        const h = rect.height - padY * 2;

        // Seed rotation by the line's vertical position ONLY — never
        // include left/width. As the user drags past a line break, the
        // first line of the selection switches from "partial" (starts
        // at click X) to "full" (starts at line beginning); its `left`
        // changes, and any seed using it would flip rotation mid-drag.
        // Quantising to 4px buckets also absorbs sub-pixel scroll jitter.
        const seed = Math.floor(rect.top / 4);
        const rot  = (seededRand(seed) - 0.5) * 2 * C.rotateRange;
        const cx = x + w / 2;
        const cy = y + h / 2;

        const r2 = document.createElementNS(SVG_NS, 'rect');
        r2.setAttribute('x', x);
        r2.setAttribute('y', y);
        r2.setAttribute('width',  w);
        r2.setAttribute('height', h);
        r2.setAttribute('rx', String(C.cornerR));
        r2.setAttribute('ry', String(C.cornerR));
        r2.setAttribute('fill', C.color);
        r2.setAttribute('opacity', String(C.opacity));
        r2.setAttribute('filter', 'url(#stabilo-grain)');
        r2.setAttribute('transform', `rotate(${rot} ${cx} ${cy})`);
        layer.appendChild(r2);
      }
    }
  }

  // ─── Event wiring ────────────────────────────────────────────────────
  // selectionchange fires many times per second while dragging — coalesce
  // into one render per animation frame.
  let rafId = 0;
  function schedule() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      render();
    });
  }

  document.addEventListener('selectionchange', schedule);
  // Scroll/resize move the text relative to the viewport, so the
  // overlay rects (which are in viewport coords) need a redraw.
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
})();
