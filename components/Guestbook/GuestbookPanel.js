// ---- GuestbookPanel ----
// The full panel that slides up after the card finishes its launch.
// Hosts (top → bottom): entries scroll, form (name + sign/stamp),
// and a bottom cushion so form content clears the persistent mail
// slot that lives at the viewport bottom.
//
// The mail slot itself is a persistent fixed element owned by
// GuestbookCard — the panel's bottom edge is placed 3px above the
// viewport bottom so the slot visually becomes the panel's bottom
// edge (one continuous physical object).
//
// Contract:
//   const panel = GuestbookPanel({ onClose, onFormReady });
//   document.body.appendChild(panel.el);
//   panel.open();   // slides up, backdrop fades in, entries load
//   panel.close();  // slides down, backdrop fades out, onClose fires
//   panel.destroy();
//
// Exposed on the return: `entries`, `form` — so the orchestrator can
// call `entries.addEntry(...)` / `form.reset()` after a successful
// drag-into-slot submission (next prompt).
//
// DOM structure:
//
//   .gb-panel-root              (fixed, full viewport, non-blocking)
//   ├── .gb-panel-backdrop      (20% black wash; click-to-close)
//   └── .gb-panel
//       ├── .gb-panel-header
//       │   └── .gb-panel-close  (×)
//       ├── .gb-panel-scroll     (scrollable body, flex: 1)
//       │   └── .gb-entries      (← GuestbookEntries)
//       └── .gb-panel-form-wrap  (flex-shrink: 0, hosts form + slot cushion)
//           └── .gb-form         (← GuestbookForm)

import { GuestbookEntries } from './GuestbookEntries.js';
import { GuestbookForm } from './GuestbookForm.js';

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

/**
 * @param {{
 *   onClose?: () => void,
 *   onFormReady?: (entry: { name: string, drawData: string|null, stamp: string|null }) => void,
 * }} [props]
 * @returns {{
 *   el: HTMLElement,
 *   panel: HTMLElement,
 *   entries: ReturnType<typeof GuestbookEntries>,
 *   form: ReturnType<typeof GuestbookForm>,
 *   open: () => void,
 *   close: () => void,
 *   destroy: () => void,
 *   readonly isOpen: boolean,
 * }}
 */
export function GuestbookPanel(props = {}) {
  ensureStylesheet();
  const { onClose, onFormReady } = props;

  // --- Root + backdrop ---
  const root = document.createElement('div');
  root.className = 'gb-panel-root';
  root.setAttribute('aria-hidden', 'true');

  const backdrop = document.createElement('div');
  backdrop.className = 'gb-panel-backdrop';

  // --- Panel surface ---
  const panel = document.createElement('div');
  panel.className = 'gb-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Guestbook');
  panel.setAttribute('tabindex', '-1');

  // Header + close button
  const header = document.createElement('div');
  header.className = 'gb-panel-header';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'gb-panel-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close guestbook');
  closeBtn.innerHTML = '&times;';
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Scrollable body
  const scroll = document.createElement('div');
  scroll.className = 'gb-panel-scroll';
  panel.appendChild(scroll);

  // Entries live inside the scroll area.
  const entries = GuestbookEntries();
  scroll.appendChild(entries.el);

  // Form wrap — sits below the scroll area, reserves bottom padding
  // so the form content clears the persistent mail slot visual.
  const formWrap = document.createElement('div');
  formWrap.className = 'gb-panel-form-wrap';
  panel.appendChild(formWrap);

  const form = GuestbookForm({
    onReady: (entry) => {
      if (typeof onFormReady === 'function') onFormReady(entry);
    },
  });
  formWrap.appendChild(form.el);

  root.appendChild(backdrop);
  root.appendChild(panel);

  // --- State ---
  let isOpen = false;
  let entriesLoaded = false;
  let lastFocused = null;

  function open() {
    if (isOpen) return;
    isOpen = true;

    lastFocused = document.activeElement;

    root.setAttribute('aria-hidden', 'false');
    root.classList.add('is-open');

    // Force reflow so the initial (hidden) transform is committed
    // before we flip on the .is-open class.
    void root.offsetHeight;

    backdrop.classList.add('is-open');
    panel.classList.add('is-open');

    if (!entriesLoaded) {
      entriesLoaded = true;
      entries.load();
    }

    document.addEventListener('keydown', onKey);

    // Move focus into the panel for keyboard + screen reader users.
    window.setTimeout(() => {
      if (isOpen) closeBtn.focus({ preventScroll: true });
    }, 120);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    panel.classList.remove('is-open');
    backdrop.classList.remove('is-open');

    // Wait for the slide-down to finish before flipping aria + root class.
    window.setTimeout(() => {
      if (!isOpen) {
        root.classList.remove('is-open');
        root.setAttribute('aria-hidden', 'true');
      }
    }, 460);

    document.removeEventListener('keydown', onKey);

    // Return focus to whatever was focused before open (usually the card).
    if (lastFocused && typeof lastFocused.focus === 'function') {
      try {
        lastFocused.focus({ preventScroll: true });
      } catch (_) {
        /* no-op */
      }
    }

    if (typeof onClose === 'function') onClose();
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  return {
    el: root,
    panel,
    entries,
    form,
    open,
    close,
    get isOpen() {
      return isOpen;
    },
    destroy() {
      closeBtn.removeEventListener('click', close);
      backdrop.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
      entries.destroy();
      form.destroy();
      root.remove();
    },
  };
}
