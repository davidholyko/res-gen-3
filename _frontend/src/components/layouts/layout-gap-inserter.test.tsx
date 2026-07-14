import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import type { DropTargetHookSpec } from 'react-dnd';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LAYOUT_DRAG_TYPE, LAYOUTS } from '@/constants';

const { addLayoutAtMock, moveLayoutMock } = vi.hoisted(() => ({
  addLayoutAtMock: vi.fn(),
  moveLayoutMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      addLayoutAt: addLayoutAtMock,
      moveLayout: moveLayoutMock,
    }),
  };
});

const { useDropMock } = vi.hoisted(() => ({ useDropMock: vi.fn() }));
vi.mock('react-dnd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dnd')>();
  return { ...actual, useDrop: useDropMock };
});

const { default: LayoutGapInserter } = await import('./layout-gap-inserter');

function latestDropSpec(): DropTargetHookSpec<
  { index: number },
  unknown,
  { isOver: boolean; isLayoutDragInProgress: boolean }
> {
  const { calls } = useDropMock.mock;
  return calls[calls.length - 1][0];
}

beforeEach(() => {
  addLayoutAtMock.mockReset();
  moveLayoutMock.mockReset();
  useDropMock.mockReset();
  useDropMock.mockImplementation(() => [
    { isOver: false, isLayoutDragInProgress: false },
    vi.fn(),
  ]);
});

describe('LayoutGapInserter', () => {
  it('offers one- and two-column inserters labelled with this gap position', () => {
    const { getByLabelText } = render(<LayoutGapInserter index={2} />);

    expect(
      getByLabelText('Insert one-column layout at position 3'),
    ).not.toBeNull();
    expect(
      getByLabelText('Insert two-column layout at position 3'),
    ).not.toBeNull();
  });

  it('inserts a SINGLE layout at this gap index', () => {
    const { getByLabelText } = render(<LayoutGapInserter index={1} />);

    fireEvent.click(getByLabelText('Insert one-column layout at position 2'));

    expect(addLayoutAtMock).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutType: LAYOUTS.SINGLE,
        layoutId: expect.any(String),
      }),
      1,
    );
  });

  it('inserts a DOUBLE layout with distinct left/right zone ids', () => {
    const { getByLabelText } = render(<LayoutGapInserter index={0} />);

    fireEvent.click(getByLabelText('Insert two-column layout at position 1'));

    expect(addLayoutAtMock).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutType: LAYOUTS.DOUBLE,
        layoutLeftId: expect.any(String),
        layoutRightId: expect.any(String),
      }),
      0,
    );
    const [layout] = addLayoutAtMock.mock.calls[0];
    expect(layout.layoutLeftId).not.toBe(layout.layoutRightId);
  });

  it('accepts only layout drags, and drops them into this gap', () => {
    render(<LayoutGapInserter index={3} />);

    const spec = latestDropSpec();
    expect(spec.accept).toBe(LAYOUT_DRAG_TYPE);

    spec.drop?.({ index: 0 }, undefined as never);
    expect(moveLayoutMock).toHaveBeenCalledWith(0, 3);
  });

  it('collect maps isOver and canDrop from the monitor', () => {
    render(<LayoutGapInserter index={0} />);

    const { collect } = latestDropSpec();
    expect(
      collect?.(
        { isOver: () => true, canDrop: () => true } as never,
        undefined as never,
      ),
    ).toEqual({ isOver: true, isLayoutDragInProgress: true });
  });

  it('becomes a visible drop slot while a layout drag is in progress, neutralizing the inserters', () => {
    useDropMock.mockImplementation(() => [
      { isOver: false, isLayoutDragInProgress: true },
      vi.fn(),
    ]);
    const { container, getByLabelText } = render(
      <LayoutGapInserter index={0} />,
    );

    expect(container.firstElementChild).toHaveClass('border-gray-300');
    // The buttons stay mounted (unmounting/resizing anything at dragstart
    // reflows the page and hangs Chromium's intercepted-drag loop -- see
    // the component) but are inert and can't be revealed by hover.
    const button = getByLabelText('Insert one-column layout at position 1');
    expect(button).toHaveClass('pointer-events-none');
    expect(button).not.toHaveClass('group-hover:opacity-100');
  });

  it('keeps the drop-slot border invisible while no layout drag is happening', () => {
    const { container, getByLabelText } = render(
      <LayoutGapInserter index={0} />,
    );

    expect(container.firstElementChild).toHaveClass('border-transparent');
    expect(
      getByLabelText('Insert one-column layout at position 1'),
    ).toHaveClass('group-hover:opacity-100');
  });

  it('highlights the slot while the dragged layout hovers it', () => {
    useDropMock.mockImplementation(() => [
      { isOver: true, isLayoutDragInProgress: true },
      vi.fn(),
    ]);
    const { container } = render(<LayoutGapInserter index={0} />);

    expect(container.firstElementChild).toHaveClass('border-cyan-600');
    expect(container.firstElementChild).toHaveClass('bg-cyan-100');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<LayoutGapInserter index={0} />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
