import c from 'classnames';
import React, { useMemo } from 'react';

import type { LAYOUTS } from '@/constants';
import { useAppContext } from '@/context/app-context';
import MacroManager from '@/managers/macro-manager';

interface LayoutSingleProps {
  layoutType: keyof typeof LAYOUTS;
  className?: string;
  layoutId?: string;
}

// A single layout (or one half of a DOUBLE) rendered on the canvas. It's
// display-only now: adding blocks and adding layouts moved off the canvas
// into the restructure view (specs/restructure-view.md), so this just
// renders the zone's content.
export default function LayoutSingle(props: LayoutSingleProps) {
  const { layoutType, layoutId } = props;

  const { items: allItems } = useAppContext();

  const items = useMemo(() => {
    const filteredItems = allItems.filter(
      (item) => item.layoutType === layoutType && item.layoutId === layoutId,
    );

    return filteredItems;
  }, [allItems, layoutType, layoutId]);

  // Filled layouts draw no box: a box around every layout made the canvas
  // read as stacked separate pages rather than one continuous resume
  // (specs/continuous-page-canvas.md). But an *empty* layout with no box
  // is just a 50px sliver of blank page. So while empty a layout (and each
  // empty half of a DOUBLE) shows a dashed placeholder so it reads as "a
  // section to fill" -- filled in via the restructure view. min-h keeps it
  // visible.
  const isEmpty = items.length === 0;
  const className = useMemo(
    () =>
      c(props.className, {
        'layout-single': true,
        'min-h-[50px]': true,
        'rounded border-2 border-dashed border-gray-300': isEmpty,
      }),
    [props.className, isEmpty],
  );

  return (
    <div className={className}>
      <MacroManager items={items} />
    </div>
  );
}
