import React from 'react';

import { LAYOUTS } from '@/constants';

import LayoutSingle from './layout-single';

interface LayoutDoubleProps {
  layoutId: string;
  layoutLeftId: string;
  layoutRightId: string;
}

// A two-column layout on the canvas: display-only, like LayoutSingle.
// Adding blocks/layouts moved into the restructure view
// (specs/restructure-view.md), so there are no per-layout add controls
// here anymore.
export default function LayoutDouble({
  layoutLeftId,
  layoutRightId,
  layoutId,
}: LayoutDoubleProps) {
  return (
    <div data-layout-id={layoutId}>
      {/* A single hairline divides the two columns (divide-x) so the
          right column's edit target is unambiguous, without the boxed
          panels the layout used to draw (specs/continuous-page-canvas.md). */}
      <div className="flex layout-double divide-x divide-gray-200">
        <LayoutSingle
          className="grow w-[50%] p-2"
          layoutType={LAYOUTS.DOUBLE_LEFT}
          layoutId={layoutLeftId}
        />
        <LayoutSingle
          className="grow w-[50%] p-2"
          layoutType={LAYOUTS.DOUBLE_RIGHT}
          layoutId={layoutRightId}
        />
      </div>
    </div>
  );
}
