import { describe, expect, it } from 'vitest';

import type { LayoutItem } from '@/types/layouts';

import { getLayoutDropZones } from './layout-drop-zone-util';

describe('getLayoutDropZones', () => {
  it('returns one zone for a SINGLE layout', () => {
    const layouts = [
      { layoutId: 'a', layoutType: 'SINGLE' },
    ] as unknown as LayoutItem[];

    expect(getLayoutDropZones(layouts)).toEqual([
      {
        key: 'a',
        label: 'Layout 1',
        layoutId: 'a',
        layoutType: 'SINGLE',
        layoutParentId: undefined,
      },
    ]);
  });

  it('returns left/right zones for a DOUBLE layout', () => {
    const layouts = [
      {
        layoutId: 'a',
        layoutType: 'DOUBLE',
        layoutLeftId: 'l',
        layoutRightId: 'r',
      },
    ] as unknown as LayoutItem[];

    expect(getLayoutDropZones(layouts)).toEqual([
      {
        key: 'l',
        label: 'Layout 1 (Left)',
        layoutId: 'l',
        layoutType: 'DOUBLE_LEFT',
        layoutParentId: 'a',
      },
      {
        key: 'r',
        label: 'Layout 1 (Right)',
        layoutId: 'r',
        layoutType: 'DOUBLE_RIGHT',
        layoutParentId: 'a',
      },
    ]);
  });

  it('numbers zones by position across a mix of layouts', () => {
    const layouts = [
      { layoutId: 'a', layoutType: 'SINGLE' },
      {
        layoutId: 'b',
        layoutType: 'DOUBLE',
        layoutLeftId: 'l',
        layoutRightId: 'r',
      },
    ] as unknown as LayoutItem[];

    const labels = getLayoutDropZones(layouts).map((zone) => zone.label);
    expect(labels).toEqual(['Layout 1', 'Layout 2 (Left)', 'Layout 2 (Right)']);
  });

  it('returns an empty array for no layouts', () => {
    expect(getLayoutDropZones([])).toEqual([]);
  });
});
