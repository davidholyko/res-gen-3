import c from 'classnames';
import React, { useMemo } from 'react';

import type { LAYOUTS } from '@/constants';
import { useAppContext } from '@/context/app-context';
import MacroManager from '@/managers/macro-manager';

import AddBlockControl from './add-block-control';
import AddLayoutControl from './add-layout-control';

interface LayoutSingleProps {
  layoutType: keyof typeof LAYOUTS;
  className?: string;
  layoutId?: string;
  layoutParentId?: string;
  // Present only on top-level SINGLE layouts (not the halves of a
  // DOUBLE): where "+ Add layout" inserts, i.e. this layout's index + 1
  // (specs/add-layout-beside-add-block.md).
  addLayoutIndex?: number;
}

// No longer a react-dnd drop target: dragging content from the Template
// ribbon retired with the ribbon itself (specs/editor-redesign.md,
// Phase 6) -- blocks are added in place via AddBlockControl below.
// Layout *reorder* drags target the gaps between layouts
// (layout-gap-inserter.tsx), not the layouts.
export default function LayoutSingle(props: LayoutSingleProps) {
  const { layoutType, layoutId, layoutParentId = null, addLayoutIndex } = props;

  const { items: allItems } = useAppContext();

  const items = useMemo(() => {
    const filteredItems = allItems.filter(
      (item) => item.layoutType === layoutType && item.layoutId === layoutId,
    );

    return filteredItems;
  }, [allItems, layoutType, layoutId]);

  const className = useMemo(
    () =>
      c(props.className, {
        'layout-single': true,
        'min-h-[50px]': true,
        rounded: true,
        'border-2': true,
        'border-stone-700': true,
        'border-dashed': true,
      }),
    [props.className],
  );

  return (
    <div className={className}>
      <MacroManager items={items} />
      <div className="flex flex-row">
        <AddBlockControl
          layoutId={layoutId}
          layoutType={layoutType}
          layoutParentId={layoutParentId}
        />
        {addLayoutIndex !== undefined && (
          <AddLayoutControl insertIndex={addLayoutIndex} />
        )}
      </div>
    </div>
  );
}
