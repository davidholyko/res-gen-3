import React from 'react';

import { LAYOUTS } from '@/constants';

import LayoutSingle from './layout-single';

interface LayoutDoubleProps {
  layoutId: string;
  layoutLeftId: string;
  layoutRightId: string;
}

export default function LayoutDouble({
  layoutLeftId,
  layoutRightId,
  layoutId,
}: LayoutDoubleProps) {
  return (
    <div className="flex layout-double" data-layout-id={layoutId}>
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
  );
}
