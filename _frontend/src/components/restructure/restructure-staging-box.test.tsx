import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContentAll } from '@/types/content-all';
import type { ContentId, LayoutId } from '@/types/content-base-item';
import type { LayoutItem } from '@/types/layouts';

import RestructureStagingBox from './restructure-staging-box';

const SINGLE: LayoutItem = { layoutId: 'L1' as LayoutId, layoutType: 'SINGLE' };
const DOUBLE: LayoutItem = {
  layoutId: 'D1' as LayoutId,
  layoutType: 'DOUBLE',
  layoutLeftId: 'DL',
  layoutRightId: 'DR',
};

function macro(id: string, layoutId: string): ContentAll {
  return {
    contentId: id as ContentId,
    contentType: 'HEADER',
    content: { header: id },
    layoutId: layoutId as LayoutId,
    layoutType: 'SINGLE',
  } as ContentAll;
}

const handlers = {
  onRemoveLayout: vi.fn(),
  onMoveLayout: vi.fn(),
  onPlace: vi.fn(),
  onRemoveItem: vi.fn(),
  onMoveItem: vi.fn(),
};

function renderBox(
  overrides: Partial<React.ComponentProps<typeof RestructureStagingBox>> = {},
) {
  return render(
    <RestructureStagingBox
      layout={SINGLE}
      position={1}
      items={[]}
      isFirst={false}
      isLast={false}
      {...handlers}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

describe('RestructureStagingBox', () => {
  it('renders a single drop zone for a SINGLE layout, empty by default', () => {
    const { getAllByTestId, getByText } = renderBox();
    expect(getAllByTestId('staging-zone')).toHaveLength(1);
    expect(getByText('Drop a macro here')).not.toBeNull();
  });

  it('renders two labelled halves for a DOUBLE layout', () => {
    const { getAllByTestId, getByText } = renderBox({ layout: DOUBLE });
    expect(getAllByTestId('staging-zone')).toHaveLength(2);
    expect(getByText('Left')).not.toBeNull();
    expect(getByText('Right')).not.toBeNull();
  });

  it('places a dropped macro into the zone it was dropped on', () => {
    const { getByTestId } = renderBox();
    const zone = getByTestId('staging-zone');
    // dragOver must preventDefault to mark the zone droppable.
    fireEvent.dragOver(zone);
    fireEvent.drop(zone, { dataTransfer: { getData: () => 'dropped-id' } });
    expect(handlers.onPlace).toHaveBeenCalledWith(
      'dropped-id',
      expect.objectContaining({ layoutId: 'L1', layoutType: 'SINGLE' }),
    );
  });

  it('ignores a drop that carries no contentId', () => {
    const { getByTestId } = renderBox();
    fireEvent.drop(getByTestId('staging-zone'), {
      dataTransfer: { getData: () => '' },
    });
    expect(handlers.onPlace).not.toHaveBeenCalled();
  });

  it('removes and reorders the box in both directions', () => {
    const { getByLabelText } = renderBox(); // not first or last

    fireEvent.click(getByLabelText('Move Layout 1 up'));
    expect(handlers.onMoveLayout).toHaveBeenCalledWith('L1', -1);

    fireEvent.click(getByLabelText('Move Layout 1 down'));
    expect(handlers.onMoveLayout).toHaveBeenCalledWith('L1', 1);

    fireEvent.click(getByLabelText('Remove Layout 1'));
    expect(handlers.onRemoveLayout).toHaveBeenCalledWith('L1');
  });

  it('disables box reorder at the ends', () => {
    const { getByLabelText } = renderBox({ isFirst: true, isLast: true });
    expect(getByLabelText('Move Layout 1 up')).toBeDisabled();
    expect(getByLabelText('Move Layout 1 down')).toBeDisabled();
  });

  it('renders placed macros with remove and reorder controls', () => {
    const { getByLabelText, getAllByLabelText } = renderBox({
      items: [macro('a', 'L1'), macro('b', 'L1')],
    });

    // First item's "up" is disabled, last item's "down" is disabled.
    expect(getAllByLabelText('Move Section heading up')[0]).toBeDisabled();
    expect(getAllByLabelText('Move Section heading down')[1]).toBeDisabled();

    fireEvent.click(getAllByLabelText('Move Section heading down')[0]);
    expect(handlers.onMoveItem).toHaveBeenCalledWith('a', 1);

    fireEvent.click(getAllByLabelText('Move Section heading up')[1]);
    expect(handlers.onMoveItem).toHaveBeenCalledWith('b', -1);

    fireEvent.click(getAllByLabelText('Remove Section heading')[0]);
    expect(handlers.onRemoveItem).toHaveBeenCalledWith('a');

    // Sanity: unused single-arg getter path.
    expect(getByLabelText('Remove Layout 1')).not.toBeNull();
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = renderBox({ items: [macro('a', 'L1')] });
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
