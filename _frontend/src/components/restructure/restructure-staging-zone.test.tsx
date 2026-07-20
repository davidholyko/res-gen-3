import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContentAll } from '@/types/content-all';
import type { ContentId, LayoutId } from '@/types/content-base-item';
import type { Zone } from '@/utils/derive-zones';

import RestructureStagingZone from './restructure-staging-zone';

const SINGLE_ZONE: Zone = {
  key: 'L1',
  label: 'Layout 1',
  layoutId: 'L1' as LayoutId,
  layoutType: 'SINGLE',
};
const LEFT_ZONE: Zone = {
  key: 'DL',
  label: 'Layout 1 (Left)',
  layoutId: 'DL' as LayoutId,
  layoutType: 'DOUBLE_LEFT',
  layoutParentId: 'D1' as LayoutId,
};

function macro(id: string, layoutId: string, header = id): ContentAll {
  return {
    contentId: id as ContentId,
    contentType: 'HEADER',
    content: { header },
    layoutId: layoutId as LayoutId,
    layoutType: 'SINGLE',
  } as ContentAll;
}

const handlers = {
  onPlace: vi.fn(),
  onAddBlock: vi.fn(),
  onRemoveItem: vi.fn(),
  onMoveItem: vi.fn(),
};

function renderZone(
  overrides: Partial<React.ComponentProps<typeof RestructureStagingZone>> = {},
) {
  return render(
    <RestructureStagingZone
      zone={SINGLE_ZONE}
      items={[]}
      {...handlers}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

describe('RestructureStagingZone', () => {
  it('shows a drop placeholder when empty', () => {
    const { getByText } = renderZone();
    expect(getByText('Drop a macro here')).not.toBeNull();
  });

  it('renders the styled content of its blocks', () => {
    const { getByText } = renderZone({
      items: [macro('a', 'L1', 'My Summary')],
    });
    expect(getByText('My Summary')).not.toBeNull();
  });

  it('labels a double-layout half', () => {
    const { getByText } = renderZone({ zone: LEFT_ZONE });
    expect(getByText('Left')).not.toBeNull();
  });

  it('places a dropped macro at the end of the zone', () => {
    const { getByTestId } = renderZone();
    fireEvent.drop(getByTestId('staging-zone'), {
      dataTransfer: { getData: () => 'dropped' },
    });
    expect(handlers.onPlace).toHaveBeenCalledWith(
      'dropped',
      expect.objectContaining({ layoutId: 'L1' }),
    );
  });

  it('ignores a drop with no contentId', () => {
    const { getByTestId } = renderZone();
    fireEvent.drop(getByTestId('staging-zone'), {
      dataTransfer: { getData: () => '' },
    });
    expect(handlers.onPlace).not.toHaveBeenCalled();
  });

  it('highlights while a drag is over it, and clears on leave', () => {
    const { getByTestId } = renderZone();
    const zone = getByTestId('staging-zone');
    const highlighted = () => zone.querySelector('.outline-cyan-400') !== null;

    expect(highlighted()).toBe(false);
    fireEvent.dragOver(zone);
    expect(highlighted()).toBe(true);
    fireEvent.dragLeave(zone);
    expect(highlighted()).toBe(false);
  });

  it('adds a blank block of the picked type', () => {
    const { getByText } = renderZone();
    fireEvent.click(getByText('+ Add block'));
    fireEvent.click(getByText('Section heading'));
    expect(handlers.onAddBlock).toHaveBeenCalledWith(
      expect.objectContaining({ layoutId: 'L1' }),
      'HEADER',
    );
  });

  it('reorders and removes blocks, with reorder disabled at the ends', () => {
    const { getAllByLabelText } = renderZone({
      items: [macro('a', 'L1'), macro('b', 'L1')],
    });

    expect(getAllByLabelText('Move Section heading up')[0]).toBeDisabled();
    expect(getAllByLabelText('Move Section heading down')[1]).toBeDisabled();

    fireEvent.click(getAllByLabelText('Move Section heading down')[0]);
    expect(handlers.onMoveItem).toHaveBeenCalledWith('a', 1);
    fireEvent.click(getAllByLabelText('Move Section heading up')[1]);
    expect(handlers.onMoveItem).toHaveBeenCalledWith('b', -1);
    fireEvent.click(getAllByLabelText('Remove Section heading')[0]);
    expect(handlers.onRemoveItem).toHaveBeenCalledWith('a');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = renderZone({ items: [macro('a', 'L1')] });
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
