import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { onMoveMock, onDeleteMock } = vi.hoisted(() => ({
  onMoveMock: vi.fn(),
  onDeleteMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({ onMove: onMoveMock, onDelete: onDeleteMock }),
  };
});

const { MacroTopBar } = await import('./macro-top-bar');
const { MOVE_ACTION } = await import('@/context/app-context');

beforeEach(() => {
  onMoveMock.mockReset();
  onDeleteMock.mockReset();
});

describe('MacroTopBar', () => {
  it('moves the macro up', () => {
    const { getByLabelText, container } = render(
      <MacroTopBar contentId={'c1' as never} />,
    );
    // The up/down buttons have no accessible name of their own beyond the
    // icon, so grab them positionally.
    const buttons = container.querySelectorAll('button');

    fireEvent.click(buttons[0]);
    expect(onMoveMock).toHaveBeenCalledWith(MOVE_ACTION.MACRO_UP, 'c1');

    fireEvent.click(buttons[1]);
    expect(onMoveMock).toHaveBeenCalledWith(MOVE_ACTION.MACRO_DOWN, 'c1');

    fireEvent.click(getByLabelText('Delete Macro Button'));
    expect(onDeleteMock).toHaveBeenCalledWith({ contentId: 'c1' });
  });
});
