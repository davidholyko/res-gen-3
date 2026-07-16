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
      {/* A single hairline divides the two columns (divide-x) so the
          right column's edit target is unambiguous, without the boxed
          panels the layout used to draw (specs/continuous-page-canvas.md). */}
      <div className="flex layout-double divide-x divide-gray-200">
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
      {/* Hover/focus-revealed like the single's add controls -- one
          "+ Add layout" for the whole double. */}
      <div className="flex flex-row opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <AddLayoutControl insertIndex={addLayoutIndex} />
      </div>
    </div>
  );
}
