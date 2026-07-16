import { act, fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { blurCanvasBlockMock, onUpdateMock, contextState } = vi.hoisted(() => ({
  blurCanvasBlockMock: vi.fn(),
  onUpdateMock: vi.fn(),
  contextState: {
    canvasEditingContentId: null as string | null,
    items: [
      {
        contentId: 'h1',
        contentType: 'HEADER',
        content: { header: 'Summary' },
        layoutId: 'l1',
        layoutType: 'SINGLE',
      },
    ] as unknown[],
  },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      items: contextState.items,
      canvasEditingContentId: contextState.canvasEditingContentId,
      blurCanvasBlock: blurCanvasBlockMock,
      onUpdate: onUpdateMock,
    }),
  };
});

const { default: CanvasEditPanel } = await import('./canvas-edit-panel');

beforeEach(() => {
  vi.useFakeTimers();
  blurCanvasBlockMock.mockReset();
  onUpdateMock.mockReset();
  contextState.canvasEditingContentId = null;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CanvasEditPanel', () => {
  it('renders nothing while no block is focused', () => {
    const { container } = render(<CanvasEditPanel />);

    expect(container.firstElementChild).toBeNull();
  });

  it("renders the focused block's form under the load-bearing panel id, and focuses its first field without scrolling the page", () => {
    contextState.canvasEditingContentId = 'h1';
    const { container } = render(<CanvasEditPanel />);

    expect(container.querySelector('#canvas-edit-panel')).not.toBeNull();
    const input = container.querySelector(
      'input[name="header"]',
    ) as HTMLInputElement;
    expect(input.value).toBe('Summary');

    const focusSpy = vi.spyOn(input, 'focus');
    act(() => {
      vi.runAllTimers();
    });
    expect(document.activeElement).toBe(input);
    // preventScroll so clicking a block near the bottom doesn't yank the
    // sticky panel (and the page) to the top.
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('renders nothing when the focused id no longer matches an item', () => {
    contextState.canvasEditingContentId = 'gone';
    const { container } = render(<CanvasEditPanel />);

    expect(container.firstElementChild).toBeNull();
  });

  it('Done blurs the focused block', () => {
    contextState.canvasEditingContentId = 'h1';
    const { getByText } = render(<CanvasEditPanel />);

    fireEvent.click(getByText('Done'));

    expect(blurCanvasBlockMock).toHaveBeenCalledWith('h1');
  });

  it('has no automatically detectable accessibility violations', async () => {
    // axe.run schedules its own real timers internally -- it never
    // resolves under the suite's fake timers.
    vi.useRealTimers();
    contextState.canvasEditingContentId = 'h1';
    const { container } = render(<CanvasEditPanel />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
