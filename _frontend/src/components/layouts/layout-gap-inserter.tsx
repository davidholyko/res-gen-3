import c from 'classnames';
import { useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';

import { LAYOUT_DRAG_TYPE, LAYOUTS } from '@/constants';
import { useAppContext } from '@/context/app-context';
import type { LayoutId } from '@/types/content-base-item';

type LayoutGapInserterProps = {
  // Gap position: 0 is above the first layout, layouts.length is below
  // the last.
  index: number;
};

// The gap between two layouts (and above the first / below the last)
// does double duty (specs/editor-redesign.md, Design → Layout
// management): hovering or focusing it reveals "+" controls that insert
// a new layout right there (one column by default, two columns as the
// secondary pick), and while a layout is being dragged by its header it
// becomes the drop target that reorders layouts.
export default function LayoutGapInserter({ index }: LayoutGapInserterProps) {
  const { addLayoutAt, moveLayout } = useAppContext();

  const [{ isOver, isLayoutDragInProgress }, drop] = useDrop({
    accept: LAYOUT_DRAG_TYPE,
    drop: (item: { index: number }) => {
      moveLayout(item.index, index);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      // canDrop() is true for every gap whenever any LAYOUT_DRAG drag is
      // active -- exactly the "show me where I can drop this" signal.
      isLayoutDragInProgress: !!monitor.canDrop(),
    }),
  });

  const onInsertSingle = useCallback(() => {
    addLayoutAt(
      { layoutId: uuidv4() as LayoutId, layoutType: LAYOUTS.SINGLE },
      index,
    );
  }, [addLayoutAt, index]);

  const onInsertDouble = useCallback(() => {
    addLayoutAt(
      {
        layoutId: uuidv4() as LayoutId,
        layoutLeftId: uuidv4(),
        layoutRightId: uuidv4(),
        layoutType: LAYOUTS.DOUBLE,
      },
      index,
    );
  }, [addLayoutAt, index]);

  // Every drag-state change here is style-only -- same geometry, same
  // children, no unmounts. Growing the gap (or unmounting the inserter
  // buttons) at dragstart reflows the page under the drag machinery's
  // feet, which reliably hung Chromium's intercepted-drag loop mid-
  // gesture (confirmed via Playwright: the identical manual gesture
  // works against drag sources whose targets keep their geometry).
  const containerClassName = c(
    'group flex flex-row items-center justify-center gap-2 h-9 rounded border-2 border-dashed',
    {
      'border-cyan-600 bg-cyan-100': isLayoutDragInProgress && isOver,
      'border-gray-300': isLayoutDragInProgress && !isOver,
      'border-transparent': !isLayoutDragInProgress,
    },
  );

  const buttonClassName = c(
    'text-xs text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-200',
    'border border-gray-300 rounded px-2 py-0.5',
    'opacity-0 focus:opacity-100 transition-opacity',
    {
      // While a layout is being dragged the gap is a drop slot, not an
      // insert affordance -- hovering it must not surface the buttons.
      'group-hover:opacity-100': !isLayoutDragInProgress,
      'pointer-events-none': isLayoutDragInProgress,
    },
  );

  return (
    <div
      className={containerClassName}
      data-gap-index={index}
      ref={(node) => {
        // react-dnd's ConnectDropTarget return type predates React 19's
        // stricter ref-callback typing. No behavior change.
        drop(node);
      }}
    >
      <button
        type="button"
        className={buttonClassName}
        aria-label={`Insert one-column layout at position ${index + 1}`}
        onClick={onInsertSingle}
      >
        + One column
      </button>
      <button
        type="button"
        className={buttonClassName}
        aria-label={`Insert two-column layout at position ${index + 1}`}
        onClick={onInsertDouble}
      >
        + Two columns
      </button>
    </div>
  );
}
