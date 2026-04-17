// ---- GuestbookSlot ----
// The mail slot drop target. Accepts a GuestbookLetter and fires an
// event when the letter is successfully "posted".
//
// TODO: UI not yet built.

/**
 * @param {{ onAccept?: (letter: object) => void }} [props]
 * @returns {{ el: HTMLElement|null, highlight: (on: boolean) => void, destroy: () => void }}
 */
export function GuestbookSlot(props = {}) {
  return {
    el: null,
    highlight(_on) {
      // no-op
    },
    destroy() {
      // no-op
    },
  };
}
