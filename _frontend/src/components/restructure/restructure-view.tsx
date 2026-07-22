import { Fragment, useState } from 'react';

import { useAppContext } from '@/context/app-context';
import type { ContentId } from '@/types/content-base-item';
import { deriveZones, type Zone } from '@/utils/derive-zones';

import RestructurePaletteCard from './restructure-palette-card';
import RestructurePaletteGap from './restructure-palette-gap';
import RestructureStagingBox from './restructure-staging-box';
import { useDragAutoScroll } from './use-drag-auto-scroll';
import { useStagingResume } from './use-staging-resume';

// The restructure view (specs/restructure-view.md): a two-pane surface
// that replaces the normal canvas while `isRestructuring`. Left = a
// staging copy of the resume the user reshapes (add/remove/reorder boxes,
// move macros between them), rendered WYSIWYG (specs/wysiwyg-staging.md);
// right = a compact outline of that same staging arrangement
// (specs/restructure-palette-mirror.md) -- the two panes are live mirrors
// of one staging state, so an edit to either updates both. Apply commits
// the staging arrangement as the new resume behind one undo snapshot;
// Cancel discards it.
export default function RestructureView() {
  const { items, layouts, toggleRestructure, onImportFile, pushUndoSnapshot } =
    useAppContext();

  const staging = useStagingResume({ items, layouts });

  // The zones both panes group by and every move targets -- the *staging*
  // boxes, recomputed as the user adds/removes them.
  const stagingZones = deriveZones(staging.layouts);

  const onApply = () => {
    pushUndoSnapshot('Resume restructured');
    onImportFile({ items: staging.items, layouts: staging.layouts });
    toggleRestructure(false);
  };

  // The palette card currently mid-drag (null when none). Drives which
  // gaps open into drop slots: every gap except the two flanking the
  // dragged card's current spot (dropping just above or just below itself
  // is a no-op). Cross-zone gaps are live -- a gap drop moves the block to
  // that exact position in that zone (specs/restructure-palette-mirror.md,
  // resolved open question).
  const [draggingId, setDraggingId] = useState<ContentId | null>(null);
  // While a palette card is in flight, auto-scroll the page as the pointer
  // nears the top/bottom edge, so drop targets below the fold (e.g. a
  // two-column box added at the bottom of a long resume) are reachable --
  // native drag won't scroll them into view on its own.
  useDragAutoScroll(draggingId !== null);

  // Every drop lands through here so the drag always ends. The card's own
  // dragend can't be relied on for a successful drop: the move re-parents
  // the card into another zone group, React replaces its DOM node, and the
  // browser never fires dragend on a detached node -- without this, the
  // gaps a drag opened would be stuck open after a cross-zone drop. The
  // card's own dragend still covers cancelled drags (Escape, dropped
  // outside any target), where nothing moved and the node survives.
  const dropMove = (
    contentId: ContentId,
    zone: Zone,
    beforeId: ContentId | null = null,
  ) => {
    staging.moveItemTo(contentId, zone, beforeId);
    setDraggingId(null);
  };

  return (
    <section
      aria-label="Restructure resume"
      className="flex w-full flex-col gap-2 px-4"
    >
      <div className="flex items-center gap-2 border-b border-gray-300 pb-2">
        {/* h1: while this view is open it replaces the canvas (whose only
            h1 is the resume name), so it must carry the page's level-one
            heading itself (WCAG / axe page-has-heading-one). */}
        <h1 className="text-lg font-bold text-gray-700">Restructure</h1>
        <p className="text-sm text-gray-600">
          The outline on the right mirrors the boxes on the left — drag a macro
          in either pane to move it. Then Apply.
        </p>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
            onClick={staging.clear}
          >
            Clear
          </button>
          <button
            type="button"
            className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
            onClick={() => toggleRestructure(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-cyan-700 px-3 py-1 text-sm font-bold text-white hover:bg-cyan-800"
            onClick={onApply}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Staging gets more room than the palette -- it renders the real
          styled resume (specs/wysiwyg-staging.md), the palette is a compact
          outline of the same arrangement. The styled preview sits on the
          left, the outline on the right. */}
      <div className="grid grid-cols-[3fr_2fr] gap-4">
        {/* Left: the staging structure being built (the styled preview). */}
        <div aria-label="New structure" className="flex flex-col gap-2">
          {staging.layouts.length === 0 && (
            <p className="rounded border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-600">
              Add a box to start building. Cancel brings back your resume
              unchanged.
            </p>
          )}
          {staging.layouts.map((layout, index) => (
            <RestructureStagingBox
              key={layout.layoutId}
              layout={layout}
              position={index + 1}
              items={staging.items}
              isFirst={index === 0}
              isLast={index === staging.layouts.length - 1}
              onRemoveLayout={staging.removeLayout}
              onMoveLayout={staging.moveLayout}
              onPlace={dropMove}
              onAddBlock={staging.addBlock}
              onRemoveItem={staging.removeItem}
              onMoveItem={staging.moveItem}
            />
          ))}

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
              onClick={() => staging.addLayout('SINGLE')}
            >
              + One column
            </button>
            <button
              type="button"
              className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
              onClick={() => staging.addLayout('DOUBLE')}
            >
              + Two columns
            </button>
          </div>
        </div>

        {/* Right: a compact outline of the staging arrangement -- same
            boxes, same zones, same order, derived from the same staging
            state as the left pane, so the two can never disagree
            (specs/restructure-palette-mirror.md). Cards drag to move (a
            gap drop lands at that exact position, a zone drop appends).
            sticky + self-start: the styled preview on the left is usually
            much taller, so the outline is pinned near the top of the
            viewport and stays reachable while you scroll the preview.
            self-start keeps the column at its content height (not
            stretched to the grid row) so sticky has room to travel.
            max-h + overflow-y-auto: when the outline itself is taller than
            the viewport, cap it to the screen and let it scroll internally
            -- otherwise its lower cards would be pinned off the bottom edge
            with no way to reach them. (The browser auto-scrolls this
            container while dragging near its edges, so moves still
            work.) */}
        <div
          aria-label="Staging outline"
          className="sticky top-2 flex max-h-[calc(100vh-1rem)] flex-col gap-3 self-start overflow-y-auto"
        >
          {stagingZones.map((zone) => {
            const zoneItems = staging.items.filter(
              (item) => item.layoutId === zone.layoutId,
            );
            // A gap between the cards `aboveId` and `belowId` is a live
            // drop slot while any card is dragging, except the two gaps
            // hugging the dragged card itself, where a drop wouldn't move
            // anything.
            const gapActive = (aboveId?: ContentId, belowId?: ContentId) =>
              draggingId !== null &&
              draggingId !== aboveId &&
              draggingId !== belowId;
            return (
              <div key={zone.key} className="flex flex-col">
                <span className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-600">
                  {zone.label}
                </span>
                {zoneItems.map((item, index) => (
                  <Fragment key={item.contentId}>
                    {/* Gap before this card -- drop here to move the
                        dragged card just above it (retagged into this
                        zone if it came from another). */}
                    <RestructurePaletteGap
                      active={gapActive(
                        zoneItems[index - 1]?.contentId,
                        item.contentId,
                      )}
                      onDropCard={(draggedId) =>
                        dropMove(draggedId, zone, item.contentId)
                      }
                    />
                    <RestructurePaletteCard
                      item={item}
                      zones={stagingZones}
                      onMoveTo={(target) =>
                        staging.moveItemTo(item.contentId, target)
                      }
                      onDraggingChange={(dragging) =>
                        setDraggingId(dragging ? item.contentId : null)
                      }
                    />
                  </Fragment>
                ))}
                {/* Trailing gap -- drop here to move a card to the end of
                    this zone. */}
                <RestructurePaletteGap
                  active={gapActive(
                    zoneItems[zoneItems.length - 1]?.contentId,
                    undefined,
                  )}
                  onDropCard={(draggedId) => dropMove(draggedId, zone, null)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
