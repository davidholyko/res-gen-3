import { useAppContext } from '@/context/app-context';
import type { ContentId } from '@/types/content-base-item';
import { deriveZones, type Zone } from '@/utils/derive-zones';

import RestructurePaletteCard from './restructure-palette-card';
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

      <div className="grid grid-cols-2 gap-4">
        {/* Left: read-only palette of the current resume's macros. */}
        <div aria-label="Your resume" className="flex flex-col gap-3">
          {paletteZones.map((zone) => {
            const zoneItems = items.filter(
              (item) => item.layoutId === zone.layoutId,
            );
            return (
              <div key={zone.key} className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
                  {zone.label}
                </span>
                {zoneItems.map((item) => (
                  <RestructurePaletteCard
                    key={item.contentId}
                    item={item}
                    zones={stagingZones}
                    onSendTo={(target) => place(item.contentId, target)}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* Right: the staging structure being built. */}
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
      </div>
    </section>
  );
}
