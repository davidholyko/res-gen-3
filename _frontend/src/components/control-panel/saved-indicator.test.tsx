import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { contextState } = vi.hoisted(() => ({
  contextState: {
    items: [] as unknown[],
    layouts: [] as unknown[],
    isEditorVisible: false,
  },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      items: contextState.items,
      layouts: contextState.layouts,
      isEditorVisible: contextState.isEditorVisible,
    }),
  };
});

const { default: SavedIndicator } = await import('./saved-indicator');

beforeEach(() => {
  vi.useFakeTimers();
  contextState.items = [];
  contextState.layouts = [];
  contextState.isEditorVisible = false;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('SavedIndicator', () => {
  it('stays empty on mount', () => {
    const { container } = render(<SavedIndicator />);

    expect(container.textContent).toBe('');
  });

  it('flashes "Saved" after a change, then fades back out after 2s', () => {
    const { container, rerender } = render(<SavedIndicator />);

    contextState.items = [{ contentId: 'a' }];
    act(() => {
      rerender(<SavedIndicator />);
    });

    expect(container.textContent).toBe('Saved');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(container.textContent).toBe('');
  });

  it('reacts to layouts changes too', () => {
    const { container, rerender } = render(<SavedIndicator />);

    contextState.layouts = [{ layoutId: 'a' }];
    act(() => {
      rerender(<SavedIndicator />);
    });
    expect(container.textContent).toBe('Saved');
  });
});
