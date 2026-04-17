// ---- GuestbookEntries ----
// Renders past entries scattered across the panel canvas. Each card
// gets a seeded rotation + jittered position so the layout is
// deterministic per entry id (the same entries always land in the
// same places) but feels organic.
//
// Contract:
//   const entries = GuestbookEntries();
//   panel.appendChild(entries.el);
//   await entries.load();            // fetch + render with landing anim
//   entries.addEntry(newEntry);      // appends a fresh card that lands
//   entries.setEntries([...]);       // replace all
//   entries.destroy();
//
// Data shape matches guestbookService.Entry:
//   { id, name, stamp, drawData, createdAt }

import { getEntries, DEFAULT_CARD_COLOR } from './guestbookService.js';

// ---- Contrast ink (mirrors the logic in GuestbookCard) ----
// Light backgrounds get dark ink, dark backgrounds get cream ink.
function contrastInk(hex) {
  const h = (hex || '').replace('#', '');
  if (h.length !== 6) return '#2a2418';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#2a2418' : '#f5e6c8';
}

// ---- Seeded PRNG ----
// Small xorshift-ish generator seeded from a string. Deterministic per
// entry id so layouts are stable across reloads without persistence.
function seededRandom(seedStr) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function next() {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    return (h % 100000) / 100000;
  };
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Build a single card element from an entry.
function createEntryCard(entry) {
  const rand = seededRandom(entry.id + ':rot');

  const card = document.createElement('div');
  card.className = 'gb-entry';
  card.dataset.entryId = entry.id;

  // ±3deg rotation, seeded per id.
  const rot = (rand() - 0.5) * 6;
  card.style.setProperty('--gb-entry-rot', `${rot.toFixed(2)}deg`);

  // Per-entry card color (with auto-computed contrast ink). Entries
  // without a stored color fall back to the default (orange) — the
  // service sets this for us, but we guard here too.
  const bg = entry.cardColor || DEFAULT_CARD_COLOR;
  const ink = contrastInk(bg);
  card.style.setProperty('--gb-entry-bg', bg);
  card.style.setProperty('--gb-entry-ink', ink);

  if (entry.drawData) {
    const img = document.createElement('img');
    img.src = entry.drawData;
    img.alt = 'Signature drawing';
    img.className = 'gb-entry-draw';
    img.draggable = false;
    card.appendChild(img);
  } else if (entry.stamp) {
    const stamp = document.createElement('div');
    stamp.className = 'gb-entry-stamp';
    stamp.textContent = entry.stamp;
    card.appendChild(stamp);
  }

  const name = document.createElement('div');
  name.className = 'gb-entry-name';
  const trimmed = typeof entry.name === 'string' ? entry.name.trim() : '';
  name.textContent = trimmed || 'Anonymous';
  card.appendChild(name);

  const date = document.createElement('div');
  date.className = 'gb-entry-date';
  date.textContent = formatDate(entry.createdAt);
  card.appendChild(date);

  return card;
}

// Compute an (x, y) position for every entry using seeded jitter
// inside a loose column grid. Returns positions in the same order
// as the input array and the total height needed for the container.
function layoutPositions(entries, containerWidth) {
  const CARD_W = 160;
  const ROW_H = 210;
  const cols = containerWidth >= 400 ? 2 : 1;
  const cellW = containerWidth / cols;

  const positions = entries.map((entry, i) => {
    const rand = seededRandom(entry.id + ':pos');
    const col = i % cols;
    const row = Math.floor(i / cols);
    const baseX = col * cellW + (cellW - CARD_W) / 2;
    const baseY = row * ROW_H + 16;
    const jitterX = (rand() - 0.5) * 32;
    const jitterY = (rand() - 0.5) * 24;
    return {
      x: Math.round(Math.max(0, baseX + jitterX)),
      y: Math.round(Math.max(0, baseY + jitterY)),
    };
  });

  const rows = Math.max(1, Math.ceil(entries.length / cols));
  const totalHeight = rows * ROW_H + 48;

  return { positions, totalHeight };
}

/**
 * @param {{ initialEntries?: Array<object> }} [props]
 * @returns {{
 *   el: HTMLElement,
 *   load: () => Promise<void>,
 *   setEntries: (entries: Array<object>) => void,
 *   addEntry: (entry: object) => void,
 *   destroy: () => void
 * }}
 */
export function GuestbookEntries(props = {}) {
  const container = document.createElement('div');
  container.className = 'gb-entries';

  /** @type {Map<string, HTMLElement>} */
  const cards = new Map();
  let currentEntries = [];
  let loaded = false;

  function renderAll() {
    // Wipe prior contents.
    container.innerHTML = '';
    cards.clear();

    const width = container.getBoundingClientRect().width || 460;
    const { positions, totalHeight } = layoutPositions(currentEntries, width);
    container.style.height = totalHeight + 'px';

    currentEntries.forEach((entry, i) => {
      const card = createEntryCard(entry);
      const pos = positions[i];
      card.style.left = pos.x + 'px';
      card.style.top = pos.y + 'px';

      // Land with a staggered delay so they don't all arrive at once.
      card.classList.add('is-landing');
      container.appendChild(card);
      cards.set(entry.id, card);

      const delay = 80 + i * 90;
      window.setTimeout(() => {
        card.classList.remove('is-landing');
      }, delay);
    });
  }

  async function load() {
    if (loaded) return;
    loaded = true;
    try {
      const entries = await getEntries();
      currentEntries = entries;
      // Wait one frame so the scroll container has final layout width
      // (especially important on first panel open).
      await new Promise((r) => requestAnimationFrame(r));
      renderAll();
    } catch (err) {
      // Surface the failure — real UI will get a retry affordance later.
      console.error('[Guestbook] Failed to load entries:', err);
    }
  }

  function setEntries(entries) {
    currentEntries = Array.isArray(entries) ? entries.slice() : [];
    renderAll();
  }

  function addEntry(entry) {
    // Prepend to match service (newest first).
    currentEntries = [entry, ...currentEntries];

    const width = container.getBoundingClientRect().width || 460;
    const { positions, totalHeight } = layoutPositions(currentEntries, width);
    container.style.height = totalHeight + 'px';

    // Move existing cards to their new slots.
    currentEntries.forEach((e, i) => {
      const existing = cards.get(e.id);
      if (existing) {
        existing.style.left = positions[i].x + 'px';
        existing.style.top = positions[i].y + 'px';
      }
    });

    // Build + mount the fresh card at index 0.
    const card = createEntryCard(entry);
    card.style.left = positions[0].x + 'px';
    card.style.top = positions[0].y + 'px';
    card.classList.add('is-landing');
    container.appendChild(card);
    cards.set(entry.id, card);

    // Two rAFs so the landing state is committed before we clear it —
    // avoids the browser collapsing the transition.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.classList.remove('is-landing');
      });
    });
  }

  // Seed with any entries passed in directly (skips the load path).
  if (Array.isArray(props.initialEntries) && props.initialEntries.length) {
    currentEntries = props.initialEntries.slice();
    loaded = true;
    // Defer to next frame so the container is in the DOM first.
    requestAnimationFrame(renderAll);
  }

  return {
    el: container,
    load,
    setEntries,
    addEntry,
    destroy() {
      container.remove();
      cards.clear();
      currentEntries = [];
    },
  };
}
