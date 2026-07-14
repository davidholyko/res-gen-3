import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DragAutoScroll, { computeScrollSpeed } from './drag-auto-scroll';

describe('computeScrollSpeed', () => {
  it('is 0 in the dead zone away from either edge', () => {
    expect(computeScrollSpeed(400, 800)).toBe(0);
  });

  it('is 0 exactly at the inner boundary of the top band', () => {
    expect(computeScrollSpeed(80, 800)).toBe(0);
  });

  it('is negative (scroll up) inside the top band, at max magnitude right at the edge', () => {
    const edge = computeScrollSpeed(0, 800);
    const farInBand = computeScrollSpeed(79, 800);

    expect(edge).toBeLessThan(0);
    expect(farInBand).toBeLessThan(0);
    // Closer to the edge scrolls faster (more negative).
    expect(Math.abs(edge)).toBeGreaterThan(Math.abs(farInBand));
  });

  it('is 0 exactly at the inner boundary of the bottom band', () => {
    expect(computeScrollSpeed(720, 800)).toBe(0);
  });

  it('is positive (scroll down) inside the bottom band, at max magnitude right at the edge', () => {
    const nearEdge = computeScrollSpeed(721, 800);
    const edge = computeScrollSpeed(800, 800);

    expect(edge).toBeGreaterThan(0);
    expect(nearEdge).toBeGreaterThan(0);
    expect(edge).toBeGreaterThan(nearEdge);
  });
});

describe('DragAutoScroll', () => {
  let rafCallbacks: FrameRequestCallback[];
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cancelRafSpy: ReturnType<typeof vi.spyOn>;
  let scrollBySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    rafCallbacks = [];
    let nextId = 1;
    rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        rafCallbacks.push(cb);
        return nextId++;
      });
    cancelRafSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});
    scrollBySpy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
  });

  afterEach(() => {
    rafSpy.mockRestore();
    cancelRafSpy.mockRestore();
    scrollBySpy.mockRestore();
    vi.restoreAllMocks();
  });

  function fireDragOver(clientY: number) {
    const event = new Event('dragover') as DragEvent;
    Object.defineProperty(event, 'clientY', { value: clientY });
    document.dispatchEvent(event);
  }

  function runNextFrame() {
    const cb = rafCallbacks.shift();
    cb?.(0);
  }

  it('does not schedule a frame before any drag starts', () => {
    render(<DragAutoScroll />);
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('schedules a scroll frame once a dragover fires, and scrolls when the pointer is in the edge band', () => {
    render(<DragAutoScroll />);

    fireDragOver(10);
    expect(rafSpy).toHaveBeenCalledTimes(1);

    runNextFrame();
    expect(scrollBySpy).toHaveBeenCalledWith(0, computeScrollSpeed(10, 800));
    // The loop reschedules itself for the next frame.
    expect(rafSpy).toHaveBeenCalledTimes(2);
  });

  it('does not call scrollBy while the pointer is outside the edge band', () => {
    render(<DragAutoScroll />);

    fireDragOver(400);
    runNextFrame();

    expect(scrollBySpy).not.toHaveBeenCalled();
  });

  it('does not schedule a second frame while one is already pending', () => {
    render(<DragAutoScroll />);

    fireDragOver(10);
    fireDragOver(15);
    fireDragOver(20);

    expect(rafSpy).toHaveBeenCalledTimes(1);
  });

  it('stops scrolling and cancels the pending frame on dragend', () => {
    render(<DragAutoScroll />);

    fireDragOver(10);
    const scheduledId = rafSpy.mock.results[0]?.value as number;
    document.dispatchEvent(new Event('dragend'));

    // cancelAnimationFrame guarantees the queued callback never fires in
    // a real browser -- what this component is responsible for is
    // passing it the right id, not re-simulating the browser's own
    // cancellation guarantee.
    expect(cancelRafSpy).toHaveBeenCalledWith(scheduledId);

    // A fresh dragover after the stop starts a brand new loop rather
    // than resuming a stale one.
    rafSpy.mockClear();
    fireDragOver(10);
    expect(rafSpy).toHaveBeenCalledTimes(1);
  });

  it('stops scrolling and cancels the pending frame on drop', () => {
    render(<DragAutoScroll />);

    fireDragOver(10);
    document.dispatchEvent(new Event('drop'));

    expect(cancelRafSpy).toHaveBeenCalled();
  });

  it('a fresh dragover after a stop schedules a new frame', () => {
    render(<DragAutoScroll />);

    fireDragOver(10);
    document.dispatchEvent(new Event('dragend'));
    rafSpy.mockClear();

    fireDragOver(10);
    expect(rafSpy).toHaveBeenCalledTimes(1);
  });

  it('removes its listeners and cancels any pending frame on unmount', () => {
    const { unmount } = render(<DragAutoScroll />);

    fireDragOver(10);
    unmount();

    expect(cancelRafSpy).toHaveBeenCalled();

    rafSpy.mockClear();
    fireDragOver(10);
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('renders no visible output', () => {
    const { container } = render(<DragAutoScroll />);
    expect(container.innerHTML).toBe('');
  });
});
