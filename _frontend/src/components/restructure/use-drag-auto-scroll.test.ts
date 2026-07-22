import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EDGE_BAND, MAX_STEP, useDragAutoScroll } from './use-drag-auto-scroll';

// Drives the rAF loop by hand: the hook schedules a frame, and each frame
// re-schedules the next, so we keep the latest callback and invoke it once
// per "frame" we want to simulate.
let rafCallback: FrameRequestCallback | null;

function runFrame() {
  const cb = rafCallback;
  if (cb) cb(0);
}

function dragOverAt(clientY: number) {
  document.dispatchEvent(new MouseEvent('dragover', { clientY }));
}

beforeEach(() => {
  rafCallback = null;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallback = cb;
    return 1;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
  // A known viewport height so edge maths is predictable.
  Object.defineProperty(window, 'innerHeight', {
    value: 800,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDragAutoScroll', () => {
  it('does nothing while inactive -- no frame loop, no listener', () => {
    renderHook(() => useDragAutoScroll(false));

    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    // A dragover with no loop running can't scroll.
    dragOverAt(10);
    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  it('does not scroll before the first dragover (pointer position unknown)', () => {
    renderHook(() => useDragAutoScroll(true));

    runFrame();
    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  it('scrolls up as the pointer nears the top edge, faster closer in', () => {
    renderHook(() => useDragAutoScroll(true));

    dragOverAt(0); // hard against the top: full-speed
    runFrame();
    expect(window.scrollBy).toHaveBeenCalledWith(0, -MAX_STEP);
  });

  it('scrolls down as the pointer nears the bottom edge', () => {
    renderHook(() => useDragAutoScroll(true));

    dragOverAt(800); // hard against the bottom (innerHeight): full-speed
    runFrame();
    expect(window.scrollBy).toHaveBeenCalledWith(0, MAX_STEP);
  });

  it('does not scroll while the pointer is in the middle band', () => {
    renderHook(() => useDragAutoScroll(true));

    dragOverAt(400);
    runFrame();
    expect(window.scrollBy).not.toHaveBeenCalled();

    // Just inside the top band still scrolls (guards the boundary maths).
    dragOverAt(EDGE_BAND - 1);
    runFrame();
    expect(window.scrollBy).toHaveBeenCalledTimes(1);
  });

  it('stops the loop and unbinds the listener on unmount', () => {
    const { unmount } = renderHook(() => useDragAutoScroll(true));

    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();

    // A dragover after unmount is ignored, and a stray frame can't scroll.
    dragOverAt(0);
    runFrame();
    expect(window.scrollBy).not.toHaveBeenCalled();
  });
});
