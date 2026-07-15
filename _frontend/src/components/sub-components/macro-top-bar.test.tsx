import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { onMoveMock, onDeleteMock, pushUndoSnapshotMock, openEditingViewMock } =
  vi.hoisted(() => ({
    onMoveMock: vi.fn(),
    onDeleteMock: vi.fn(),
    pushUndoSnapshotMock: vi.fn(),
    openEditingViewMock: vi.fn(),
  }));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      onMove: onMoveMock,
      onDelete: onDeleteMock,
      pushUndoSnapshot: pushUndoSnapshotMock,
      openEditingView: openEditingViewMock,
    }),
  };
});

const { MacroTopBar } = await import('./macro-top-bar');
const { MOVE_ACTION } = await import('@/context/app-context');

beforeEach(() => {
  onMoveMock.mockReset();
  onDeleteMock.mockReset();
  pushUndoSnapshotMock.mockReset();
  openEditingViewMock.mockReset();
});

describe('MacroTopBar', () => {
  it('moves the block up and down via plain-language accessible names', () => {
    // "Move block up", not "Move Macro Up Button": no internal jargon in
    // accessible names (specs/plain-language-labels-and-move-undo.md).
    // The undo snapshot for moves is pushed inside onMove itself, which
    // alone knows whether the press is a real move or a zone-boundary
    // no-op.
    const { getByLabelText } = render(
      <MacroTopBar contentId={'c1' as never} />,
    );

    fireEvent.click(getByLabelText('Move block up'));
    expect(onMoveMock).toHaveBeenCalledWith(MOVE_ACTION.MACRO_UP, 'c1');

    fireEvent.click(getByLabelText('Move block down'));
    expect(onMoveMock).toHaveBeenCalledWith(MOVE_ACTION.MACRO_DOWN, 'c1');
    expect(pushUndoSnapshotMock).not.toHaveBeenCalled();
  });

  it('deletes the block immediately, after pushing an undo snapshot', () => {
    const { getByLabelText } = render(
      <MacroTopBar contentId={'c1' as never} />,
    );

    fireEvent.click(getByLabelText('Delete block'));

    expect(pushUndoSnapshotMock).toHaveBeenCalledWith('Block deleted');
    expect(onDeleteMock).toHaveBeenCalledWith({ contentId: 'c1' });
  });

  it('opens the live-preview editing view for this block', () => {
    const { getByText } = render(<MacroTopBar contentId={'c1' as never} />);

    fireEvent.click(getByText('Edit with preview'));

    expect(openEditingViewMock).toHaveBeenCalledWith('c1');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<MacroTopBar contentId={'c1' as never} />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
