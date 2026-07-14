import c from 'classnames';
import React, { useMemo } from 'react';
import { useDrop } from 'react-dnd';

import type { LAYOUTS } from '@/constants';
import { CONTENT_TYPES } from '@/constants';
import { useAppContext } from '@/context/app-context';
import MacroManager from '@/managers/macro-manager';

import AddBlockControl from './add-block-control';

interface LayoutSingleProps {
  layoutType: keyof typeof LAYOUTS;
  className?: string;
  layoutId?: string;
  layoutParentId?: string;
}

export default function LayoutSingle(props: LayoutSingleProps) {
  const { layoutType, layoutId, layoutParentId = null } = props;

  const { items: allItems } = useAppContext();
  const [{ isOver }, drop] = useDrop({
    accept: [...Object.values(CONTENT_TYPES)],
    drop: () => ({ layoutType, layoutId, layoutParentId }),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

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
        'bg-emerald-50': isOver,
        'min-h-[50px]': true,
        rounded: true,
        'border-2': true,
        'border-stone-700': true,
        'border-dashed': true,
      }),
    [props.className, isOver],
  );

  return (
    <div
      className={className}
      // react-dnd's ConnectDropTarget return type predates React 19's
      // stricter ref-callback typing (must return void, not ReactElement).
      // No behavior change, just satisfying the type.
      ref={(node) => {
        drop(node);
      }}
    >
      <MacroManager items={items} />
      <AddBlockControl
        layoutId={layoutId}
        layoutType={layoutType}
        layoutParentId={layoutParentId}
      />
    </div>
  );
}
