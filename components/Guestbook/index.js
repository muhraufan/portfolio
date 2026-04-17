// ---- Guestbook — main export ----
//
// Central barrel file. Consumers import from here so that internal file
// paths can change without breaking call sites.
//
// Usage:
//   import { mountGuestbook, getEntries } from './components/Guestbook/index.js';
//
// When migrating to Next.js, this file becomes a standard ES module
// re-export — no changes needed.

export { GuestbookCard } from './GuestbookCard.js';
export { GuestbookPanel } from './GuestbookPanel.js';
export { GuestbookEntries } from './GuestbookEntries.js';
export { GuestbookForm } from './GuestbookForm.js';
export { GuestbookLetter } from './GuestbookLetter.js';
export { GuestbookSlot } from './GuestbookSlot.js';

export {
  getEntries,
  addEntry,
  rowToEntry,
} from './guestbookService.js';

/**
 * High-level mount helper. Wires the guestbook into a host element.
 * Not implemented yet — placeholder so consumers can target a stable API.
 *
 * @param {HTMLElement} _host
 * @returns {{ destroy: () => void }}
 */
export function mountGuestbook(_host) {
  // TODO: instantiate GuestbookCard + GuestbookPanel, wire events,
  //       fetch initial entries via getEntries().
  return {
    destroy() {
      // no-op until implemented
    },
  };
}
