import c from 'classnames';
import { useCallback } from 'react';
import { useDrag } from 'react-dnd';

import { LAYOUT_DRAG_TYPE } from '@/constants';
import { useAppContext } from '@/context/app-context';
import type { LayoutId } from '@/types/content-base-item';

type LayoutHeaderProps = {
  label: string;
  layoutId: LayoutId;
  // This layout's position in `layouts` -- the drag payload the gap
  // inserters need to reorder it (specs/editor-redesign.md, Design →
  // Layout management).
  index: number;
};

// Addresses two UX findings at once (specs/app-ux-improvements.md):
// layouts previously had no visible identifier on the canvas itself (only
// inside each editor card's "Add to layout" <select>), and the only way
// to remove one was the Edit menu's "Remove Last Layout" -- always the
// most recently added, never a specific one. Since
// specs/editor-redesign.md (Phase 6) this row is also the drag handle
// for reordering the whole layout: grab it and drop it into any gap.
export default function LayoutHeader({
  label,
  layoutId,
  index,
}: LayoutHeaderProps) {
  const { removeLayout, pushUndoSnapshot } = useAppContext();

  const [{ isDragging }, drag] = useDrag({
    type: LAYOUT_DRAG_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  // Undo, not window.confirm -- see specs/undo-destructive-actions.md.
  const onRemove = useCallback(() => {
    pushUndoSnapshot(`${label} removed`);
    removeLayout(layoutId);
  }, [label, layoutId, removeLayout, pushUndoSnapshot]);

  return (
    <div
      className={c('flex items-center justify-between mt-3 mb-1 first:mt-0', {
        'opacity-50': isDragging,
      })}
    >
      {/* text-gray-600/text-red-700, not the lighter -500/-600: this row
          sits directly on the page's bg-gray-100 background (Finding 11),
          not a white card -- the lighter shades dropped just under 4.5:1
          against that background, caught by a real-browser axe scan. */}
      <span
        className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wide cursor-grab"
        draggable="true"
        title={`Drag to move ${label}`}
        ref={(node) => {
          // react-dnd's ConnectDragSource return type predates React 19's
          // stricter ref-callback typing. No behavior change.
          drag(node);
        }}
      >
        {/* The classic six-dot handle glyph, drawn as text so it inherits
            the label's (contrast-checked) color. */}
        <span aria-hidden="true">⠿</span>
        {label}
      </span>
      <button
        type="button"
        aria-label={`Remove ${label} Button`}
        title={`Remove ${label}`}
        className="text-xs text-red-700 hover:text-red-800 hover:underline"
        onClick={onRemove}
      >
        Remove layout
      </button>
    </div>
  );
}
