import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LAYOUTS } from '@/constants';

const { moveContentToZoneMock, contextState } = vi.hoisted(() => ({
  moveContentToZoneMock: vi.fn(),
  contextState: {
    items: [] as unknown[],
    layouts: [] as unknown[],
  },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      items: contextState.items,
      layouts: contextState.layouts,
      moveContentToZone: moveContentToZoneMock,
    }),
  };
});

const { default: MoveToControl } = await import('./move-to-control');

// A block sitting in the left half of a two-column layout (Layout 2),
// alongside a plain Layout 1 -- so there are two other zones to move to.
const ITEM = {
  contentId: 'c1',
  contentType: 'HEADER',
  layoutId: 'left-2',
  layoutType: LAYOUTS.DOUBLE_LEFT,
  layoutParentId: 'double-2',
  content: { header: 'Skills' },
};

const LAYOUTS_FIXTURE = [
  { layoutId: 'a', layoutType: LAYOUTS.SINGLE },
  {
    layoutId: 'double-2',
    layoutType: LAYOUTS.DOUBLE,
    layoutLeftId: 'left-2',
    layoutRightId: 'right-2',
  },
];

beforeEach(() => {
  moveContentToZoneMock.mockReset();
  contextState.items = [ITEM];
  contextState.layouts = LAYOUTS_FIXTURE;
});

describe('MoveToControl', () => {
  it('renders nothing when the block is not found', () => {
    const { container } = render(
      <MoveToControl contentId={'missing' as never} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there is no other zone to move to', () => {
    contextState.layouts = [{ layoutId: 'left-2', layoutType: LAYOUTS.SINGLE }];
    contextState.items = [{ ...ITEM, layoutId: 'left-2' }];

    const { container } = render(<MoveToControl contentId={'c1' as never} />);

    expect(container.firstChild).toBeNull();
  });

  it('lists every zone except the block’s current one', () => {
    const { getByLabelText, getByRole, queryByText } = render(
      <MoveToControl contentId={'c1' as never} />,
    );

    fireEvent.click(getByLabelText('Move to another layout'));

    const menu = getByRole('menu');
    expect(menu.textContent).toContain('Layout 1');
    expect(menu.textContent).toContain('Layout 2 (Right)');
    // Its own zone (Layout 2 Left) is not offered.
    expect(queryByText('Layout 2 (Left)')).toBeNull();
  });

  it('moves the block into the picked zone, then closes the menu', () => {
    const { getByLabelText, getByText, queryByRole } = render(
      <MoveToControl contentId={'c1' as never} />,
    );

    fireEvent.click(getByLabelText('Move to another layout'));
    fireEvent.click(getByText('Layout 2 (Right)'));

    expect(moveContentToZoneMock).toHaveBeenCalledWith('c1', {
      layoutId: 'right-2',
      layoutType: LAYOUTS.DOUBLE_RIGHT,
      layoutParentId: 'double-2',
    });
    expect(queryByRole('menu')).toBeNull();
  });

  it('moves into a plain single layout with no parent id', () => {
    const { getByLabelText, getByText } = render(
      <MoveToControl contentId={'c1' as never} />,
    );

    fireEvent.click(getByLabelText('Move to another layout'));
    fireEvent.click(getByText('Layout 1'));

    expect(moveContentToZoneMock).toHaveBeenCalledWith('c1', {
      layoutId: 'a',
      layoutType: LAYOUTS.SINGLE,
      layoutParentId: undefined,
    });
  });

  it('closes on Escape and on an outside click, and supports arrow-key movement', () => {
    const { getByLabelText, getByRole, queryByRole } = render(
      <MoveToControl contentId={'c1' as never} />,
    );

    fireEvent.click(getByLabelText('Move to another layout'));
    const menu = getByRole('menu');

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement?.textContent).toBe('Layout 1');
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement?.textContent).toBe('Layout 2 (Right)');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(queryByRole('menu')).toBeNull();

    fireEvent.click(getByLabelText('Move to another layout'));
    fireEvent.mouseDown(document.body);
    expect(queryByRole('menu')).toBeNull();
  });

  it('has no automatically detectable accessibility violations, closed and open', async () => {
    const { container, getByLabelText } = render(
      <MoveToControl contentId={'c1' as never} />,
    );
    expect((await axe.run(container)).violations).toEqual([]);

    fireEvent.click(getByLabelText('Move to another layout'));
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
