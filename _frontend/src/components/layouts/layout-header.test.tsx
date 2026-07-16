import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import type { DragSourceHookSpec } from 'react-dnd';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LAYOUT_DRAG_TYPE } from '@/constants';

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

// Presentational: LayoutManager owns the confirm state and the actual
// removal (so the confirm can also highlight the preview region). These
// props stand in for that wiring.
const handlers = {
  onRequestRemove: vi.fn(),
  onCancelRemove: vi.fn(),
  onConfirmRemove: vi.fn(),
};

beforeEach(() => {
  useDragMock.mockReset();
  useDragMock.mockImplementation(() => [{}, vi.fn(), vi.fn()]);
  handlers.onRequestRemove.mockReset();
  handlers.onCancelRemove.mockReset();
  handlers.onConfirmRemove.mockReset();
});

describe('LayoutHeader', () => {
  it('renders the label and drag handle when idle', () => {
    const { getByText } = render(
      <LayoutHeader
        label="Layout 1"
        index={0}
        isConfirming={false}
        {...handlers}
      />,
    );

    expect(getByText('Layout 1')).not.toBeNull();
  });

  it('first "Remove layout" click only requests confirmation, it does not delete', () => {
    const { getByLabelText, queryByLabelText } = render(
      <LayoutHeader
        label="Layout 1"
        index={0}
        isConfirming={false}
        {...handlers}
      />,
    );

    fireEvent.click(getByLabelText('Remove Layout 1 Button'));

    expect(handlers.onRequestRemove).toHaveBeenCalledTimes(1);
    // Nothing destructive on this click, and no confirm UI yet -- that
    // only appears once the parent flips isConfirming.
    expect(handlers.onConfirmRemove).not.toHaveBeenCalled();
    expect(queryByLabelText('Confirm removing Layout 1 Button')).toBeNull();
  });

  it('while confirming, shows Cancel/Delete and wires them to the parent', () => {
    const { getByLabelText, getByText, queryByLabelText } = render(
      <LayoutHeader
        label="Layout 1"
        index={0}
        isConfirming={true}
        {...handlers}
      />,
    );

    expect(getByText('Delete Layout 1?')).not.toBeNull();
    // The idle "Remove layout" affordance is replaced by the confirm.
    expect(queryByLabelText('Remove Layout 1 Button')).toBeNull();

    fireEvent.click(getByLabelText('Cancel removing Layout 1'));
    expect(handlers.onCancelRemove).toHaveBeenCalledTimes(1);

    fireEvent.click(getByLabelText('Confirm removing Layout 1 Button'));
    expect(handlers.onConfirmRemove).toHaveBeenCalledTimes(1);
  });

  it('registers as a LAYOUT_DRAG drag source carrying its own index', () => {
    render(
      <LayoutHeader
        label="Layout 2"
        index={1}
        isConfirming={false}
        {...handlers}
      />,
    );

    const spec = latestDragSpec();
    expect(spec.type).toBe(LAYOUT_DRAG_TYPE);
    expect(spec.item).toEqual({ index: 1 });
  });

  it('is a hidden-until-revealed gutter toolbar when idle, forced visible while confirming', () => {
    const { container, rerender } = render(
      <LayoutHeader
        label="Layout 1"
        index={0}
        isConfirming={false}
        {...handlers}
      />,
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

    // While confirming it stays put so the Cancel/Delete choice can't
    // slip away when the pointer leaves.
    rerender(
      <LayoutHeader
        label="Layout 1"
        index={0}
        isConfirming={true}
        {...handlers}
      />,
    );
    expect(container.firstElementChild).toHaveClass('opacity-100');
    expect(container.firstElementChild).not.toHaveClass('opacity-0');
  });

  it('has no automatically detectable accessibility violations (idle or confirming)', async () => {
    const idle = render(
      <LayoutHeader
        label="Layout 1"
        index={0}
        isConfirming={false}
        {...handlers}
      />,
    );
    expect((await axe.run(idle.container)).violations).toEqual([]);

    const confirming = render(
      <LayoutHeader
        label="Layout 1"
        index={0}
        isConfirming={true}
        {...handlers}
      />,
    );
    expect((await axe.run(confirming.container)).violations).toEqual([]);
  });
});
