import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import type { DragSourceHookSpec } from 'react-dnd';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LAYOUT_DRAG_TYPE } from '@/constants';

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

const { useDragMock } = vi.hoisted(() => ({ useDragMock: vi.fn() }));
vi.mock('react-dnd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dnd')>();
  return { ...actual, useDrag: useDragMock };
});

const { default: LayoutHeader } = await import('./layout-header');

function latestDragSpec(): DragSourceHookSpec<
  { index: number },
  unknown,
  object
> {
  const { calls } = useDragMock.mock;
  return calls[calls.length - 1][0];
}

beforeEach(() => {
  removeLayoutMock.mockReset();
  pushUndoSnapshotMock.mockReset();
  useDragMock.mockReset();
  useDragMock.mockImplementation(() => [{}, vi.fn(), vi.fn()]);
});

describe('LayoutHeader', () => {
  it('renders the label', () => {
    const { getByText } = render(
      <LayoutHeader label="Layout 1" layoutId={'a' as never} index={0} />,
    );

    expect(getByText('Layout 1')).not.toBeNull();
  });

  it('removes the layout immediately, after pushing an undo snapshot', () => {
    const { getByLabelText } = render(
      <LayoutHeader label="Layout 1" layoutId={'a' as never} index={0} />,
    );

    fireEvent.click(getByLabelText('Remove Layout 1 Button'));

    expect(pushUndoSnapshotMock).toHaveBeenCalledWith('Layout 1 removed');
    expect(removeLayoutMock).toHaveBeenCalledWith('a');
  });

  it('registers as a LAYOUT_DRAG drag source carrying its own index', () => {
    render(<LayoutHeader label="Layout 2" layoutId={'b' as never} index={1} />);

    const spec = latestDragSpec();
    expect(spec.type).toBe(LAYOUT_DRAG_TYPE);
    expect(spec.item).toEqual({ index: 1 });
  });

  it('is a hidden-until-revealed gutter toolbar, not an in-flow header row', () => {
    const { container } = render(
      <LayoutHeader label="Layout 1" layoutId={'a' as never} index={0} />,
    );

    // opacity-0 by default (idle page shows only content), revealed when
    // the wrapping layout is hovered or holds focus; absolute so it
    // floats in the gutter without reflowing the page.
    expect(container.firstElementChild).toHaveClass(
      'absolute',
      'opacity-0',
      'group-hover:opacity-100',
      'group-focus-within:opacity-100',
    );
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(
      <LayoutHeader label="Layout 1" layoutId={'a' as never} index={0} />,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
