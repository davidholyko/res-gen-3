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
// read as its own boxed page (specs/continuous-page-canvas.md). It used
// to float in the left gutter (absolute, right-full), but that gutter
// gets squeezed to nothing when the edit panel slides the canvas left
// (specs/canvas-edit-panel.md), pushing the toolbar off the viewport's
// left edge. So it now reflows **inline** as a compact row at the top of
// the layout, still hover/focus-revealed (specs/inline-layout-toolbar.md).
//
// The reveal collapses the row to zero height when idle via a
// `grid-rows-[0fr]`->`[1fr]` wrapper with `overflow-hidden`: the inner
// toolbar stays in the DOM, tab order, and accessibility tree (so
// keyboard users still reach reorder/remove without a hover), but takes
// no vertical space until the layout is hovered or contains focus
// (`group-hover` / `group-focus-within`, gated by the `group` wrapper in
// layout-manager.tsx). While a remove is being confirmed the row stays
// expanded regardless of hover so the Cancel/Delete choice can't slip
// away.
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
        'grid transition-[grid-template-rows] duration-150 ease-out',
        isConfirming
          ? 'grid-rows-[1fr]'
          : 'grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]',
      )}
    >
      {/* min-h-0 + overflow-hidden let the outer grid clip this row to
          0fr while idle -- the toolbar stays mounted and focusable but
          takes no vertical space. Only padding/border here, never a
          vertical margin: margin sits outside the clip and would leak a
          gap even while collapsed. border-b marks it as chrome distinct
          from the resume content below. */}
      <div
        className={c(
          'flex min-h-0 items-center gap-2 overflow-hidden whitespace-nowrap border-b px-1 pt-1 pb-2',
          isConfirming ? 'border-red-300' : 'border-gray-200',
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
    </div>
  );
}
