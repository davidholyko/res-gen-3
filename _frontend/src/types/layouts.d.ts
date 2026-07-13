import type { LAYOUTS } from '@/constants';

export type LayoutSingle = {
  layoutId: LayoutId;
  layoutLeftId?: never;
  layoutRightId?: never;
  layoutType: keyof typeof LAYOUTS;
};

export type LayoutDouble = {
  layoutId: LayoutId;
  layoutLeftId: string;
  layoutRightId: string;
  layoutType: keyof typeof LAYOUTS;
};

export type LayoutItem = LayoutSingle | LayoutDouble;
