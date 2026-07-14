import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { removeLayoutMock, pushUndoSnapshotMock } = vi.hoisted(() => ({
  removeLayoutMock: vi.fn(),
  pushUndoSnapshotMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      removeLayout: removeLayoutMock,
      pushUndoSnapshot: pushUndoSnapshotMock,
    }),
  };
});

const { default: LayoutHeader } = await import('./layout-header');

beforeEach(() => {
  removeLayoutMock.mockReset();
  pushUndoSnapshotMock.mockReset();
});

describe('LayoutHeader', () => {
  it('renders the label', () => {
    const { getByText } = render(
      <LayoutHeader label="Layout 1" layoutId={'a' as never} />,
    );

    expect(getByText('Layout 1')).not.toBeNull();
  });

  it('removes the layout immediately, after pushing an undo snapshot', () => {
    const { getByLabelText } = render(
      <LayoutHeader label="Layout 1" layoutId={'a' as never} />,
    );

    fireEvent.click(getByLabelText('Remove Layout 1 Button'));

    expect(pushUndoSnapshotMock).toHaveBeenCalledWith('Layout 1 removed');
    expect(removeLayoutMock).toHaveBeenCalledWith('a');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(
      <LayoutHeader label="Layout 1" layoutId={'a' as never} />,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
