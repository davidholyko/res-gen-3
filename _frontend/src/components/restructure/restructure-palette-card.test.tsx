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
        onSendTo={vi.fn()}
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
        onSendTo={vi.fn()}
      />,
    );
    expect(getByText('(empty)')).not.toBeNull();
  });

  it('carries the macro contentId on drag start', () => {
    const { getByTestId } = render(
      <RestructurePaletteCard
        item={item({ header: 'x' })}
        zones={[]}
        onSendTo={vi.fn()}
      />,
    );
    const dataTransfer = { setData: vi.fn(), effectAllowed: '' };
    fireEvent.dragStart(getByTestId('palette-card'), { dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalledWith(MACRO_DRAG_MIME, 'c1');
  });

  it('hides the "Send to…" menu when there are no zones to send to', () => {
    const { queryByRole } = render(
      <RestructurePaletteCard
        item={item({ header: 'x' })}
        zones={[]}
        onSendTo={vi.fn()}
      />,
    );
    expect(queryByRole('button', { name: /Send .* to a box/ })).toBeNull();
  });

  it('opens the menu and sends the macro to a picked zone', () => {
    const onSendTo = vi.fn();
    const { getByRole, getByText } = render(
      <RestructurePaletteCard
        item={item({ header: 'x' })}
        zones={[ZONE]}
        onSendTo={onSendTo}
      />,
    );

    fireEvent.click(getByRole('button', { name: /Send .* to a box/ }));
    fireEvent.click(getByText('Layout 1'));

    expect(onSendTo).toHaveBeenCalledWith(ZONE);
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(
      <RestructurePaletteCard
        item={item({ header: 'x' })}
        zones={[ZONE]}
        onSendTo={vi.fn()}
      />,
    );
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
