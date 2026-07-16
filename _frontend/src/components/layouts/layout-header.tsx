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

// A layout's per-layout editing chrome (its label, drag-to-reorder
// handle, and Remove control). It no longer draws an always-visible
// header row across the top of the layout -- that made every layout
// read as its own boxed page (specs/continuous-page-canvas.md). Instead
// it's a compact toolbar that floats in the left gutter, absolutely
// positioned so revealing it causes no reflow, and hidden until the
// layout is hovered or contains keyboard focus (`group-hover` /
// `focus-within`, gated by the `group` wrapper in layout-manager.tsx).
// opacity-0 (not `hidden`) keeps it in the tab order and the
// accessibility tree so keyboard users still reach reorder/remove; the
// focus-within reveal makes it visible the moment it's focused.
export default function LayoutHeader({
  label,
  layoutId,
  index,
}: LayoutHeaderProps) {
  const { removeLayout, pushUndoSnapshot } = useAppContext();

  const [, drag] = useDrag({
    type: LAYOUT_DRAG_TYPE,
    item: { index },
  });

  // Undo, not window.confirm -- see specs/undo-destructive-actions.md.
  const onRemove = useCallback(() => {
    pushUndoSnapshot(`${label} removed`);
    removeLayout(layoutId);
  }, [label, layoutId, removeLayout, pushUndoSnapshot]);

  return (
    <div className="absolute top-0 right-full z-20 mr-2 flex items-center gap-2 whitespace-nowrap rounded border border-gray-200 bg-white px-2 py-1 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      {/* text-gray-600/text-red-700, not the lighter -500/-600: the
          contrast floor these were picked against still applies -- on the
          white toolbar they only read better (specs/accessibility.md,
          Finding 11). */}
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
