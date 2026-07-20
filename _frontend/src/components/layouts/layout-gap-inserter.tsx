import c from 'classnames';
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { LAYOUTS } from '@/constants';
import { useAppContext } from '@/context/app-context';
import type { LayoutId } from '@/types/content-base-item';

type LayoutGapInserterProps = {
  // Gap position: 0 is above the first layout, layouts.length is below
  // the last.
  index: number;
};

// The gap between two layouts (and above the first / below the last):
// hovering or focusing it reveals "+" controls that insert a new layout
// right there (one column by default, two columns as the secondary pick)
// (specs/editor-redesign.md, Design → Layout management). It used to also
// be the drop target for drag-to-reorder, but layout reorder-by-drag was
// removed (specs/inline-layout-toolbar.md), so this is now purely the
// add-layout affordance.
export default function LayoutGapInserter({ index }: LayoutGapInserterProps) {
  const { addLayoutAt } = useAppContext();

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

  const buttonClassName = c(
    'text-xs text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-200',
    'border border-gray-300 rounded px-2 py-0.5',
    'opacity-0 focus:opacity-100 transition-opacity group-hover:opacity-100',
  );

  return (
    <div
      className="group flex flex-row items-center justify-center gap-2 h-9 rounded"
      data-gap-index={index}
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
