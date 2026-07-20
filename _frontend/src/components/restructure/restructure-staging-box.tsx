import { LAYOUTS } from '@/constants';
import type { ContentAll } from '@/types/content-all';
import type { ContentId, LayoutId } from '@/types/content-base-item';
import type { LayoutItem } from '@/types/layouts';
import { deriveMacroLabel } from '@/utils/derive-macro-label';
import type { Zone } from '@/utils/derive-zones';

import { MACRO_DRAG_MIME } from './restructure-palette-card';

type RestructureStagingBoxProps = {
  layout: LayoutItem;
  position: number;
  items: ContentAll[];
  isFirst: boolean;
  isLast: boolean;
  onRemoveLayout: (layoutId: LayoutId) => void;
  onMoveLayout: (layoutId: LayoutId, dir: -1 | 1) => void;
  onPlace: (contentId: ContentId, zone: Zone) => void;
  onRemoveItem: (contentId: ContentId) => void;
  onMoveItem: (contentId: ContentId, dir: -1 | 1) => void;
};

// The zones a staging box exposes as drop targets: a SINGLE box is one
// zone, a DOUBLE box is a Left and a Right half. Mirrors derive-zones.ts's
// layoutId/layoutType/layoutParentId triple so a placed macro carries the
// exact fields the live app uses for that zone.
function boxZones(layout: LayoutItem, position: number): Zone[] {
  if (layout.layoutType === LAYOUTS.DOUBLE) {
    // layoutType isn't a literal discriminant, so TS doesn't narrow the
    // LayoutItem union to LayoutDouble here -- the half-ids read as
    // `string | undefined`; cast them (same as derive-zones.ts).
    const leftId = layout.layoutLeftId as string;
    const rightId = layout.layoutRightId as string;
    return [
      {
        key: leftId,
        label: `Layout ${position} (Left)`,
        layoutId: leftId as LayoutId,
        layoutType: LAYOUTS.DOUBLE_LEFT,
        layoutParentId: layout.layoutId,
      },
      {
        key: rightId,
        label: `Layout ${position} (Right)`,
        layoutId: rightId as LayoutId,
        layoutType: LAYOUTS.DOUBLE_RIGHT,
        layoutParentId: layout.layoutId,
      },
    ];
  }
  return [
    {
      key: layout.layoutId,
      label: `Layout ${position}`,
      layoutId: layout.layoutId,
      layoutType: LAYOUTS.SINGLE,
    },
  ];
}

// One layout "box" in the restructure view's staging pane
// (specs/restructure-view.md): a header row (label + reorder + remove)
// over one (SINGLE) or two (DOUBLE) drop zones. Macros are placed by
// dropping a palette card here (native HTML5 drop) or via the palette's
// keyboard "Send to…" menu; placed macros can be reordered within their
// zone and removed.
export default function RestructureStagingBox({
  layout,
  position,
  items,
  isFirst,
  isLast,
  onRemoveLayout,
  onMoveLayout,
  onPlace,
  onRemoveItem,
  onMoveItem,
}: RestructureStagingBoxProps) {
  const zones = boxZones(layout, position);

  return (
    <div className="rounded border border-gray-300 bg-gray-50">
      <div className="flex items-center gap-2 border-b border-gray-200 px-2 py-1">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
          Layout {position}
        </span>
        <button
          type="button"
          aria-label={`Move Layout ${position} up`}
          disabled={isFirst}
          className="rounded px-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-30"
          onClick={() => onMoveLayout(layout.layoutId, -1)}
        >
          ↑
        </button>
        <button
          type="button"
          aria-label={`Move Layout ${position} down`}
          disabled={isLast}
          className="rounded px-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-30"
          onClick={() => onMoveLayout(layout.layoutId, 1)}
        >
          ↓
        </button>
        <button
          type="button"
          aria-label={`Remove Layout ${position}`}
          className="ml-auto rounded px-2 text-xs font-bold text-red-700 hover:bg-red-100"
          onClick={() => onRemoveLayout(layout.layoutId)}
        >
          Remove
        </button>
      </div>

      <div className="flex gap-2 p-2">
        {zones.map((zone) => {
          const zoneItems = items.filter(
            (item) => item.layoutId === zone.layoutId,
          );
          return (
            <div
              key={zone.key}
              className="min-h-[60px] flex-1 rounded border-2 border-dashed border-gray-300 p-1"
              data-testid="staging-zone"
              aria-label={`${zone.label} drop zone`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const contentId = event.dataTransfer.getData(MACRO_DRAG_MIME);
                if (contentId) onPlace(contentId as ContentId, zone);
              }}
            >
              {layout.layoutType === LAYOUTS.DOUBLE && (
                <span className="block px-1 text-[10px] uppercase tracking-wide text-gray-400">
                  {zone.layoutType === LAYOUTS.DOUBLE_LEFT ? 'Left' : 'Right'}
                </span>
              )}
              {zoneItems.length === 0 ? (
                <p className="px-1 py-2 text-center text-xs text-gray-400">
                  Drop a macro here
                </p>
              ) : (
                zoneItems.map((item, index) => {
                  const { typeLabel, summary } = deriveMacroLabel(item);
                  return (
                    <div
                      key={item.contentId}
                      className="mb-1 flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-800">
                        <span className="text-xs font-bold uppercase text-gray-500">
                          {typeLabel}
                        </span>{' '}
                        {summary}
                      </span>
                      <button
                        type="button"
                        aria-label={`Move ${typeLabel} up`}
                        disabled={index === 0}
                        className="rounded px-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-30"
                        onClick={() => onMoveItem(item.contentId, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${typeLabel} down`}
                        disabled={index === zoneItems.length - 1}
                        className="rounded px-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-30"
                        onClick={() => onMoveItem(item.contentId, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${typeLabel}`}
                        className="rounded px-1 text-xs font-bold text-red-700 hover:bg-red-100"
                        onClick={() => onRemoveItem(item.contentId)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
