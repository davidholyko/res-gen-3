import React from 'react';

import { LAYOUTS } from '@/constants';

import AddLayoutControl from './add-layout-control';
import LayoutSingle from './layout-single';

interface LayoutDoubleProps {
  layoutId: string;
  layoutLeftId: string;
  layoutRightId: string;
  // Where "+ Add layout" inserts: this layout's index + 1. One control
  // for the whole layout, under both halves -- it belongs to the
  // layout, not a zone (specs/add-layout-beside-add-block.md).
  addLayoutIndex: number;
}

export default function LayoutDouble({
  layoutLeftId,
  layoutRightId,
  layoutId,
  addLayoutIndex,
}: LayoutDoubleProps) {
  return (
    <div data-layout-id={layoutId}>
      <div className="flex layout-double">
        <LayoutSingle
          className="grow w-[50%] p-2"
          layoutParentId={layoutId}
          layoutType={LAYOUTS.DOUBLE_LEFT}
          layoutId={layoutLeftId}
        />
        <LayoutSingle
          className="grow w-[50%] p-2"
          layoutParentId={layoutId}
          layoutType={LAYOUTS.DOUBLE_RIGHT}
          layoutId={layoutRightId}
        />
      </div>
      <AddLayoutControl insertIndex={addLayoutIndex} />
    </div>
  );
}
