import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { performUndoMock, dismissUndoMock, contextState } = vi.hoisted(() => ({
  performUndoMock: vi.fn(),
  dismissUndoMock: vi.fn(),
  contextState: {
    undoSnapshot: null as { description: string } | null,
  },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      undoSnapshot: contextState.undoSnapshot,
      performUndo: performUndoMock,
      dismissUndo: dismissUndoMock,
    }),
  };
});

const { default: UndoToast } = await import('./undo-toast');

beforeEach(() => {
  vi.useFakeTimers();
  performUndoMock.mockReset();
  dismissUndoMock.mockReset();
  contextState.undoSnapshot = null;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('UndoToast', () => {
  it('renders nothing when there is no undo snapshot', () => {
    const { container } = render(<UndoToast />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the description and an Undo button when a snapshot exists', () => {
    contextState.undoSnapshot = { description: 'Block deleted' };
    const { getByText, getByRole } = render(<UndoToast />);

    expect(getByText('Block deleted')).not.toBeNull();
    expect(getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(getByText('Undo')).not.toBeNull();
  });

  it('clicking Undo calls performUndo and cancels the pending auto-dismiss', () => {
    contextState.undoSnapshot = { description: 'Block deleted' };
    const { getByText } = render(<UndoToast />);

    fireEvent.click(getByText('Undo'));
    vi.advanceTimersByTime(8000);

    expect(performUndoMock).toHaveBeenCalledTimes(1);
    expect(dismissUndoMock).not.toHaveBeenCalled();
  });

  it('auto-dismisses after 8s when left alone', () => {
    contextState.undoSnapshot = { description: 'Resume cleared' };
    render(<UndoToast />);

    vi.advanceTimersByTime(7999);
    expect(dismissUndoMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(dismissUndoMock).toHaveBeenCalledTimes(1);
  });

  it('pauses the auto-dismiss timer on hover, resuming on mouseleave', () => {
    contextState.undoSnapshot = { description: 'Block deleted' };
    const { getByRole } = render(<UndoToast />);
    const toast = getByRole('status');

    vi.advanceTimersByTime(6000);
    fireEvent.mouseEnter(toast);
    vi.advanceTimersByTime(8000);
    expect(dismissUndoMock).not.toHaveBeenCalled();

    fireEvent.mouseLeave(toast);
    vi.advanceTimersByTime(8000);
    expect(dismissUndoMock).toHaveBeenCalledTimes(1);
  });

  it('pauses the auto-dismiss timer on focus, resuming on blur', () => {
    contextState.undoSnapshot = { description: 'Block deleted' };
    const { getByRole } = render(<UndoToast />);
    const toast = getByRole('status');

    vi.advanceTimersByTime(6000);
    fireEvent.focus(toast);
    vi.advanceTimersByTime(8000);
    expect(dismissUndoMock).not.toHaveBeenCalled();

    fireEvent.blur(toast);
    vi.advanceTimersByTime(8000);
    expect(dismissUndoMock).toHaveBeenCalledTimes(1);
  });

  it('has no automatically detectable accessibility violations', async () => {
    // axe-core's own async internals don't play well with fake timers.
    vi.useRealTimers();
    contextState.undoSnapshot = { description: 'Block deleted' };
    const { container } = render(<UndoToast />);

    expect((await axe.run(container)).violations).toEqual([]);
  });

  it('clears the timeout on unmount without dismissing', () => {
    contextState.undoSnapshot = { description: 'Block deleted' };
    const { unmount } = render(<UndoToast />);

    unmount();
    vi.advanceTimersByTime(8000);

    expect(dismissUndoMock).not.toHaveBeenCalled();
  });
});
