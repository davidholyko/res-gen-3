import { Fragment, useState } from 'react';

import { useAppContext } from '@/context/app-context';
import type { ContentId } from '@/types/content-base-item';
import { deriveZones, type Zone } from '@/utils/derive-zones';

import RestructurePaletteCard from './restructure-palette-card';
import RestructurePaletteGap from './restructure-palette-gap';
import RestructureStagingBox from './restructure-staging-box';
import { useStagingResume } from './use-staging-resume';

// The restructure view (specs/restructure-view.md): a two-pane surface
// that replaces the normal canvas while `isRestructuring`. Left = the
// current resume as a read-only palette of draggable macro cards; right =
// a staging copy of the resume the user reshapes (add/remove/reorder
// boxes, drop macros into them). Apply commits the staging arrangement as
// the new resume behind one undo snapshot; Cancel discards it.
export default function RestructureView() {
  const { items, layouts, toggleRestructure, onImportFile, pushUndoSnapshot } =
    useAppContext();

  const staging = useStagingResume({ items, layouts });

  // The zones the palette's "Send to…" menu (and drops) target -- the
  // *staging* boxes, recomputed as the user adds/removes them.
  const stagingZones = deriveZones(staging.layouts);

  // Copy a palette macro into a staging zone (shared by drag-drop and the
  // keyboard menu). Resolves the source from the live items by id, so a
  // stale/unknown id is simply ignored.
  const place = (contentId: ContentId, zone: Zone) => {
    const source = items.find((item) => item.contentId === contentId);
    if (source) staging.placeMacro(source, zone);
  };

  const onApply = () => {
    pushUndoSnapshot('Resume restructured');
    onImportFile({ items: staging.items, layouts: staging.layouts });
    toggleRestructure(false);
  };

  // The palette, grouped by the live resume's zones so it reads like the
  // resume it mirrors.
  const paletteZones = deriveZones(layouts);

  // A local ordering of the palette cards, so the source list can be
  // resorted by dragging a card into a gap (specs/wysiwyg-staging.md).
  // It's purely a scanning aid over the *source* list -- it never touches
  // the live resume or the staging copy you Apply -- so it lives only in
  // this view's state and resets when the view closes.
  const [paletteOrder, setPaletteOrder] = useState<ContentId[]>(() =>
    items.map((item) => item.contentId),
  );
  // True while a palette card is mid-drag, so the reorder gaps open into
  // roomy drop slots (a hairline gap is too small to aim between cards).
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const layoutOf = (contentId: ContentId) =>
    items.find((item) => item.contentId === contentId)?.layoutId;
  // Every rendered item is in `paletteOrder` -- it's seeded from `items`,
  // which doesn't change while this takeover view is open -- so indexOf is
  // always a real position.
  const orderRank = (contentId: ContentId) => paletteOrder.indexOf(contentId);

  // Move a dragged card so it sits just before `beforeId` (or at the end of
  // its zone when `beforeId` is null -- the trailing gap). Reordering is
  // confined to within a single zone: a drop from another zone is ignored,
  // since the palette groups mirror the resume's layout structure.
  const movePaletteCard = (
    draggedId: ContentId,
    beforeId: ContentId | null,
    zone: Zone,
  ) => {
    if (layoutOf(draggedId) !== zone.layoutId) return;
    // Dropping a card into the gap immediately above itself is a no-op --
    // and guarding it keeps the splice below from ever seeing a `beforeId`
    // that was just filtered out (indexOf -1).
    if (beforeId === draggedId) return;
    setPaletteOrder((prev) => {
      const next = prev.filter((id) => id !== draggedId);
      if (beforeId === null) {
        const zoneIds = next.filter((id) => layoutOf(id) === zone.layoutId);
        const lastId = zoneIds[zoneIds.length - 1];
        const at = lastId ? next.indexOf(lastId) + 1 : next.length;
        next.splice(at, 0, draggedId);
      } else {
        next.splice(next.indexOf(beforeId), 0, draggedId);
      }
      return next;
    });
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
          Drag macros from your resume into the boxes on the right, then Apply.
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
          styled resume now (specs/wysiwyg-staging.md), the palette is just
          compact source cards. The styled preview sits on the left, the
          source palette on the right. */}
      <div className="grid grid-cols-[3fr_2fr] gap-4">
        {/* Left: the staging structure being built (the styled preview). */}
        <div aria-label="New structure" className="flex flex-col gap-2">
          {staging.layouts.length === 0 && (
            <p className="rounded border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-600">
              Add a box, then drag macros into it.
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
              onPlace={place}
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

        {/* Right: the source palette of the current resume's macros. It's
            read-only content, but its order can be resorted by dragging a
            card into a gap between cards. */}
        <div aria-label="Your resume" className="flex flex-col gap-3">
          {paletteZones.map((zone) => {
            const zoneItems = items
              .filter((item) => item.layoutId === zone.layoutId)
              .sort((a, b) => orderRank(a.contentId) - orderRank(b.contentId));
            return (
              <div key={zone.key} className="flex flex-col">
                <span className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-600">
                  {zone.label}
                </span>
                {zoneItems.map((item) => (
                  <Fragment key={item.contentId}>
                    {/* Gap before this card -- drop here to move the
                        dragged card just above it. */}
                    <RestructurePaletteGap
                      active={isDraggingCard}
                      onDropCard={(draggedId) =>
                        movePaletteCard(draggedId, item.contentId, zone)
                      }
                    />
                    <RestructurePaletteCard
                      item={item}
                      zones={stagingZones}
                      onSendTo={(target) => place(item.contentId, target)}
                      onDraggingChange={setIsDraggingCard}
                    />
                  </Fragment>
                ))}
                {/* Trailing gap -- drop here to move a card to the end of
                    this zone. */}
                <RestructurePaletteGap
                  active={isDraggingCard}
                  onDropCard={(draggedId) =>
                    movePaletteCard(draggedId, null, zone)
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
