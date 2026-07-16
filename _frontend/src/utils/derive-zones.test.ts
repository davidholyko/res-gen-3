import { describe, expect, it } from 'vitest';

import { LAYOUTS } from '@/constants';
import type { LayoutItem } from '@/types/layouts';

import { deriveZones } from './derive-zones';

describe('deriveZones', () => {
  it('maps a SINGLE layout to one zone tagged SINGLE with no parent', () => {
    const layouts = [
      { layoutId: 'a', layoutType: LAYOUTS.SINGLE },
    ] as LayoutItem[];

    expect(deriveZones(layouts)).toEqual([
      {
        key: 'a',
        label: 'Layout 1',
        layoutId: 'a',
        layoutType: LAYOUTS.SINGLE,
      },
    ]);
  });

  it('splits a DOUBLE layout into Left/Right zones with the parent id', () => {
    const layouts = [
      {
        layoutId: 'd',
        layoutType: LAYOUTS.DOUBLE,
        layoutLeftId: 'l',
        layoutRightId: 'r',
      },
    ] as LayoutItem[];

    expect(deriveZones(layouts)).toEqual([
      {
        key: 'l',
        label: 'Layout 1 (Left)',
        layoutId: 'l',
        layoutType: LAYOUTS.DOUBLE_LEFT,
        layoutParentId: 'd',
      },
      {
        key: 'r',
        label: 'Layout 1 (Right)',
        layoutId: 'r',
        layoutType: LAYOUTS.DOUBLE_RIGHT,
        layoutParentId: 'd',
      },
    ]);
  });

  it('numbers zones by layout position across a mix of layouts', () => {
    const layouts = [
      { layoutId: 'a', layoutType: LAYOUTS.SINGLE },
      {
        layoutId: 'd',
        layoutType: LAYOUTS.DOUBLE,
        layoutLeftId: 'l',
        layoutRightId: 'r',
      },
    ] as LayoutItem[];

    expect(deriveZones(layouts).map((z) => z.label)).toEqual([
      'Layout 1',
      'Layout 2 (Left)',
      'Layout 2 (Right)',
    ]);
  });
});
