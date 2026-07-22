import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';

import type { ContentAll } from '@/types/content-all';
import type { ContentId, LayoutId } from '@/types/content-base-item';
import type { Zone } from '@/utils/derive-zones';

import RestructurePaletteCard, {
  MACRO_DRAG_MIME,
} from './restructure-palette-card';

function item(content: { header: string }): ContentAll {
  return {
    contentId: 'c1' as ContentId,
    contentType: 'HEADER',
    content,
  } as ContentAll;
}

const ZONE: Zone = {
  key: 'z1',
  label: 'Layout 1',
  layoutId: 'z1' as LayoutId,
  layoutType: 'SINGLE',
};

describe('RestructurePaletteCard', () => {
  it('shows the macro type and summary', () => {
    const { getByText } = render(
      <RestructurePaletteCard
        item={item({ header: 'Summary' })}
        zones={[]}
        onMoveTo={vi.fn()}
      />,
    );
    expect(getByText('Section heading')).not.toBeNull();
    expect(getByText('Summary')).not.toBeNull();
  });

  it('shows an "(empty)" placeholder when the summary is blank', () => {
    const { getByText } = render(
      <RestructurePaletteCard
        item={item({ header: '' })}
        zones={[]}
        onMoveTo={vi.fn()}
      />,
    );
    expect(getByText('(empty)')).not.toBeNull();
  });

  it('carries the macro contentId on drag start', () => {
    const { getByTestId } = render(
      <RestructurePaletteCard
        item={item({ header: 'x' })}
        zones={[]}
        onMoveTo={vi.fn()}
      />,
    );
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' };
    const card = getByTestId('palette-card');
    fireEvent.dragStart(card, { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith(MACRO_DRAG_MIME, 'c1');
    // Without an onDraggingChange handler, the drag start/end are harmless
    // no-ops rather than throwing.
    expect(() => fireEvent.dragEnd(card)).not.toThrow();
  });

  it('reports its own drag start and end, and fades while dragging', () => {
    const onDraggingChange = vi.fn();
    const { getByTestId } = render(
      <RestructurePaletteCard
        item={item({ header: 'x' })}
        zones={[]}
        onMoveTo={vi.fn()}
        onDraggingChange={onDraggingChange}
      />,
    );
    const card = getByTestId('palette-card');

    expect(card.className).not.toContain('opacity-40');
    fireEvent.dragStart(card, {
      dataTransfer: { setData: vi.fn(), effectAllowed: '' },
    });
    expect(onDraggingChange).toHaveBeenLastCalledWith(true);
    expect(card.className).toContain('opacity-40');

    fireEvent.dragEnd(card);
    expect(onDraggingChange).toHaveBeenLastCalledWith(false);
    expect(card.className).not.toContain('opacity-40');
  });

  it('hides the "Move to…" menu when there are no zones to move to', () => {
    const { queryByRole } = render(
      <RestructurePaletteCard
        item={item({ header: 'x' })}
        zones={[]}
        onMoveTo={vi.fn()}
      />,
    );
    expect(queryByRole('button', { name: /Move .* to a box/ })).toBeNull();
  });

  it('opens the menu and moves the macro to a picked zone', () => {
    const onMoveTo = vi.fn();
    const { getByRole, getByText } = render(
      <RestructurePaletteCard
        item={item({ header: 'x' })}
        zones={[ZONE]}
        onMoveTo={onMoveTo}
      />,
    );

    fireEvent.click(getByRole('button', { name: /Move .* to a box/ }));
    fireEvent.click(getByText('Layout 1'));

    expect(onMoveTo).toHaveBeenCalledWith(ZONE);
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(
      <RestructurePaletteCard
        item={item({ header: 'x' })}
        zones={[ZONE]}
        onMoveTo={vi.fn()}
      />,
    );
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
