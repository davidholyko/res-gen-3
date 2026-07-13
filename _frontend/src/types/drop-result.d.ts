import type { LAYOUTS } from '@/constants';

import { LayoutId } from './content-base-item';

export type DropResultSingle = {
  dropEffect: string;
  layoutType: (typeof LAYOUTS)['SINGLE'];
  layoutId: LayoutId;
  layoutParentId: LayoutId;
  layoutLeftId?: never;
  layoutRightId?: never;
};

export type DropResultDouble = {
  dropEffect: string;
  layoutType: (typeof LAYOUTS)['DOUBLE'];
  layoutParentId: LayoutId;
  layoutLeftId: LayoutId;
  layoutRightId: LayoutId;
  layoutId: LayoutId;
};

export type DropResult = DropResultSingle | DropResultDouble;
