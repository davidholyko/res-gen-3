import { useEffect, useRef } from 'react';

// How close to the viewport edge (in px) triggers scrolling, and how
// fast (in px/frame) at the very edge -- ramps linearly from 0 at the
// band's inner boundary to this max right at the edge.
const EDGE_THRESHOLD_PX = 80;
const MAX_SCROLL_SPEED_PX_PER_FRAME = 18;

// Exported for direct unit testing -- the interesting part of this
// component is this math, not the event wiring around it.
export function computeScrollSpeed(
  pointerY: number,
  viewportHeight: number,
): number {
  if (pointerY < EDGE_THRESHOLD_PX) {
    const proximity = (EDGE_THRESHOLD_PX - pointerY) / EDGE_THRESHOLD_PX;
    return -Math.ceil(proximity * MAX_SCROLL_SPEED_PX_PER_FRAME);
  }

  if (pointerY > viewportHeight - EDGE_THRESHOLD_PX) {
    const proximity =
      (pointerY - (viewportHeight - EDGE_THRESHOLD_PX)) / EDGE_THRESHOLD_PX;
    return Math.ceil(proximity * MAX_SCROLL_SPEED_PX_PER_FRAME);
  }

  return 0;
}

// Reported directly by a user unable to reach an off-screen layout
// mid-drag while dragging a ribbon item (react-dnd's HTML5Backend)
// (specs/editor-redesign.md, Phase 2). Chromium does have *some* native
// auto-scroll during an HTML5 drag (confirmed live: the page scrolls on
// its own even with this component removed), but it ramps up slowly
// from a near-standstill, which reads as sluggish/"difficult" over the
// height of a multi-layout resume -- this supplements it with a faster,
// tunable ramp that isn't dependent on a given browser's own (and
// possibly absent, e.g. in Firefox) native behavior.
//
// This is page-wide, not owned by any one drop target: dragover/dragend/
// drop are native events that bubble to `document` regardless of where
// the drag started or which element is currently under the pointer, so
// one listener here covers every drag anywhere on the page. Not calling
// `preventDefault()` in these handlers is deliberate -- that's what a
// drop target's own listener uses to declare itself droppable, and
// leaving it alone here means this component never interferes with
// that.
export default function DragAutoScroll() {
  const pointerYRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const scrollTick = () => {
      const pointerY = pointerYRef.current;

      // pointerYRef is only non-null between a dragover and the next
      // dragend/drop/unmount, which is also exactly the window during
      // which this tick can run at all -- cancelAnimationFrame
      // (stopScrolling, below) guarantees an already-queued tick never
      // fires once that window closes, so this is never actually null
      // when reached. Kept as a defensive null-check anyway since
      // pointerYRef's type allows it.
      /* v8 ignore next 3 */
      if (pointerY === null) {
        return;
      }

      const speed = computeScrollSpeed(pointerY, window.innerHeight);
      if (speed !== 0) {
        window.scrollBy(0, speed);
      }

      rafIdRef.current = requestAnimationFrame(scrollTick);
    };

    const stopScrolling = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      pointerYRef.current = null;
    };

    const onDragOver = (event: DragEvent) => {
      pointerYRef.current = event.clientY;
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(scrollTick);
      }
    };

    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragend', stopScrolling);
    document.addEventListener('drop', stopScrolling);

    return () => {
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragend', stopScrolling);
      document.removeEventListener('drop', stopScrolling);
      stopScrolling();
    };
  }, []);

  return null;
}
