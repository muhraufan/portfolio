// ---- GuestbookLetter ----
// The draggable letter card the visitor composes and then drags
// into the mail slot to submit.
//
// TODO: UI not yet built.

/**
 * @param {{ entry?: object, onDrop?: (slot: HTMLElement) => void }} [props]
 * @returns {{ el: HTMLElement|null, reset: () => void, destroy: () => void }}
 */
export function GuestbookLetter(props = {}) {
  return {
    el: null,
    reset() {
      // no-op
    },
    destroy() {
      // no-op
    },
  };
}
