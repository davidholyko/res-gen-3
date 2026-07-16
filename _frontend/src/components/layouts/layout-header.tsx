import c from 'classnames';
import { useDrag } from 'react-dnd';

import { LAYOUT_DRAG_TYPE } from '@/constants';

type LayoutHeaderProps = {
  label: string;
  // This layout's position in `layouts` -- the drag payload the gap
  // inserters need to reorder it (specs/editor-redesign.md, Design →
  // Layout management).
  index: number;
  // Two-step remove (specs/confirm-remove-layout.md). "Remove layout"
  // removed the layout -- and all its blocks -- on a single click; on the
  // default one-layout resume that silently wiped the whole thing. Now
  // the first click only *asks*: while `isConfirming`, LayoutManager
  // highlights this layout's region in the preview (so it's obvious what
  // will be deleted) and this toolbar swaps to an inline Cancel/Delete
  // confirm. The confirm state lives in LayoutManager so only one layout
  // can be mid-confirm and it can drive that highlight.
  isConfirming: boolean;
  onRequestRemove: () => void;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
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
// focus-within reveal makes it visible the moment it's focused. While a
// remove is being confirmed it stays visible (opacity-100) regardless of
// hover so the Cancel/Delete choice can't slip away.
export default function LayoutHeader({
  label,
  index,
  isConfirming,
  onRequestRemove,
  onCancelRemove,
  onConfirmRemove,
}: LayoutHeaderProps) {
  const [, drag] = useDrag({
    type: LAYOUT_DRAG_TYPE,
    item: { index },
  });

  return (
    <div
      className={c(
        'absolute top-0 right-full z-20 mr-2 flex items-center gap-2 whitespace-nowrap rounded border bg-white px-2 py-1 shadow-sm transition-opacity',
        isConfirming
          ? 'opacity-100 border-red-300'
          : 'opacity-0 border-gray-200 group-hover:opacity-100 group-focus-within:opacity-100',
      )}
    >
      {isConfirming ? (
        <>
          <span className="text-xs font-bold text-red-700">
            Delete {label}?
          </span>
          <button
            type="button"
            aria-label={`Cancel removing ${label}`}
            className="text-xs text-gray-600 hover:text-gray-800 hover:underline"
            onClick={onCancelRemove}
          >
            Cancel
          </button>
          <button
            type="button"
            aria-label={`Confirm removing ${label} Button`}
            className="text-xs font-bold text-red-700 hover:text-red-800 hover:underline"
            onClick={onConfirmRemove}
          >
            Delete
          </button>
        </>
      ) : (
        <>
          {/* text-gray-600/text-red-700, not the lighter -500/-600: the
              contrast floor these were picked against still applies -- on
              the white toolbar they only read better
              (specs/accessibility.md, Finding 11). */}
          <span
            className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wide cursor-grab"
            draggable="true"
            title={`Drag to move ${label}`}
            ref={(node) => {
              // react-dnd's ConnectDragSource return type predates React
              // 19's stricter ref-callback typing. No behavior change.
              drag(node);
            }}
          >
            {/* The classic six-dot handle glyph, drawn as text so it
                inherits the label's (contrast-checked) color. */}
            <span aria-hidden="true">⠿</span>
            {label}
          </span>
          <button
            type="button"
            aria-label={`Remove ${label} Button`}
            title={`Remove ${label}`}
            className="text-xs text-red-700 hover:text-red-800 hover:underline"
            onClick={onRequestRemove}
          >
            Remove layout
          </button>
        </>
      )}
    </div>
  );
}
