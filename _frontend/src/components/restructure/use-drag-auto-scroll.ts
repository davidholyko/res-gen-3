import { useEffect } from 'react';

// While a drag is in progress, scroll the window when the pointer nears the
// top or bottom edge of the viewport. Native HTML5 drag does NOT reliably
// auto-scroll an off-screen drop target into view mid-gesture (the same
// limitation the e2e suite works around with a giant viewport, see
// end-to-end/playwright.config.ts): a two-column box added at the bottom of
// a long resume sits below the fold, so dragging a palette card down to it
// silently no-ops -- the drop target never comes into reach. Driving the
// scroll ourselves off the drag's own `dragover` position makes any drop
// target reachable regardless of where it sits on the page.
//
// A requestAnimationFrame loop (rather than scrolling straight from the
// dragover handler) keeps scrolling while the pointer is simply *held*
// inside an edge band -- dragover only fires on movement, so a handler-only
// approach would stall the moment the user stops moving to wait for the
// scroll.

// Distance from a viewport edge (px) within which scrolling kicks in.
export const EDGE_BAND = 96;
// Peak scroll speed (px/frame) at the very edge; eased down to 0 across the
// band so the scroll accelerates as the pointer approaches the edge.
export const MAX_STEP = 18;

export function useDragAutoScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;

    // Latest pointer Y from the drag; null until the first dragover.
    let pointerY: number | null = null;
    let frame = 0;

    const step = () => {
      frame = requestAnimationFrame(step);
      if (pointerY === null) return;

      const viewportHeight = window.innerHeight;
      if (pointerY < EDGE_BAND) {
        const intensity = (EDGE_BAND - pointerY) / EDGE_BAND;
        window.scrollBy(0, -Math.ceil(MAX_STEP * intensity));
      } else if (pointerY > viewportHeight - EDGE_BAND) {
        const intensity = (pointerY - (viewportHeight - EDGE_BAND)) / EDGE_BAND;
        window.scrollBy(0, Math.ceil(MAX_STEP * intensity));
      }
    };

    const onDragOver = (event: DragEvent) => {
      pointerY = event.clientY;
    };

    // Passive: this listener only reads clientY; the drop targets' own
    // handlers own preventDefault, so we must not interfere with them.
    document.addEventListener('dragover', onDragOver, { passive: true });
    frame = requestAnimationFrame(step);

    return () => {
      document.removeEventListener('dragover', onDragOver);
      cancelAnimationFrame(frame);
    };
  }, [active]);
}
