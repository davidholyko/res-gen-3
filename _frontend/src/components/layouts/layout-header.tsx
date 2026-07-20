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
// left edge (specs/inline-layout-toolbar.md).
//
// The fix for *that* first reflowed the row inline, but revealing an
// in-flow row pushed the layout's content down on every hover -- hover a
// block and the whole layout visibly jumps. So the toolbar is now an
// **absolute overlay** pinned to the top of the layout's `group relative`
// wrapper (layout-manager.tsx), inside the page column: out of the page
// flow (revealing it reflows nothing) yet never in the clip-prone gutter.
// It floats over the top strip of the layout's content on reveal, with a
// solid background so it stays legible.
//
// Reveal is opacity, gated by `group-hover` / `group-focus-within`. The
// toolbar stays in the DOM, tab order, and accessibility tree so keyboard
// users still reach reorder/remove without a hover; `pointer-events-none`
// while idle keeps the invisible overlay from eating clicks on the
// content beneath it (focus/hover restore `pointer-events`). While a
// remove is being confirmed the row stays visible regardless of hover so
// the Cancel/Delete choice can't slip away.
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
        // Absolute overlay pinned to the top of the layout wrapper, so
        // revealing it never reflows the layout's content. z-20 keeps it
        // above the content it floats over.
        'absolute inset-x-0 top-0 z-20 transition-opacity duration-150 ease-out',
        isConfirming
          ? 'opacity-100'
          : // pointer-events-none while idle: the overlay is invisible but
            // still layered over the top of the content, and without this
            // it would swallow clicks meant for that content. hover/focus
            // reveal it and restore its clickability.
            'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto',
      )}
    >
      {/* Solid bg so the floating row stays legible over the content
          beneath it. border-b marks it as chrome distinct from the resume
          content below. */}
      <div
        className={c(
          'flex items-center gap-2 whitespace-nowrap border-b px-1 pt-1 pb-2',
          isConfirming
            ? 'border-red-300 bg-red-50'
            : 'border-gray-200 bg-white',
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
