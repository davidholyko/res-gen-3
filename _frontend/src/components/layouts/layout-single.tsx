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

  // No box, filled or empty: a box around every layout made the canvas
  // read as stacked separate pages rather than one continuous resume
  // (specs/continuous-page-canvas.md), and the dashed placeholder empty
  // layouts used to draw read as a rendering glitch (Later change in the
  // same spec). Fully empty layouts are hidden by LayoutManager now; the
  // empty half of a partially filled DOUBLE renders as blank space,
  // matching the PDF's geometry.
  const className = useMemo(
    () => c(props.className, 'layout-single'),
    [props.className],
  );

  return (
    <div className={className}>
      <MacroManager items={items} />
    </div>
  );
}
