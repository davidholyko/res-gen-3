import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { onMoveMock, onDeleteMock, pushUndoSnapshotMock } = vi.hoisted(() => ({
  onMoveMock: vi.fn(),
  onDeleteMock: vi.fn(),
  pushUndoSnapshotMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      onMove: onMoveMock,
      onDelete: onDeleteMock,
      pushUndoSnapshot: pushUndoSnapshotMock,
    }),
  };
});

const { MacroTopBar } = await import('./macro-top-bar');
const { MOVE_ACTION } = await import('@/context/app-context');

beforeEach(() => {
  onMoveMock.mockReset();
  onDeleteMock.mockReset();
  pushUndoSnapshotMock.mockReset();
});

describe('MacroTopBar', () => {
  it('moves the macro up and down via accessibly-labelled buttons', () => {
    const { getByLabelText } = render(
      <MacroTopBar contentId={'c1' as never} />,
    );

    fireEvent.click(getByLabelText('Move Macro Up Button'));
    expect(onMoveMock).toHaveBeenCalledWith(MOVE_ACTION.MACRO_UP, 'c1');

    fireEvent.click(getByLabelText('Move Macro Down Button'));
    expect(onMoveMock).toHaveBeenCalledWith(MOVE_ACTION.MACRO_DOWN, 'c1');
  });

  it('deletes the macro immediately, after pushing an undo snapshot', () => {
    const { getByLabelText } = render(
      <MacroTopBar contentId={'c1' as never} />,
    );

    fireEvent.click(getByLabelText('Delete Macro Button'));

    expect(pushUndoSnapshotMock).toHaveBeenCalledWith('Block deleted');
    expect(onDeleteMock).toHaveBeenCalledWith({ contentId: 'c1' });
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<MacroTopBar contentId={'c1' as never} />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
