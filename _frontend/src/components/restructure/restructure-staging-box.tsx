import c from 'classnames';

import { LAYOUTS, type CONTENT_TYPES } from '@/constants';
import type { ContentAll } from '@/types/content-all';
import type { ContentId, LayoutId } from '@/types/content-base-item';
import type { LayoutItem } from '@/types/layouts';
import type { Zone } from '@/utils/derive-zones';

import RestructureStagingZone from './restructure-staging-zone';

type RestructureStagingBoxProps = {
  layout: LayoutItem;
  position: number;
  items: ContentAll[];
  isFirst: boolean;
  isLast: boolean;
  onRemoveLayout: (layoutId: LayoutId) => void;
  onMoveLayout: (layoutId: LayoutId, dir: -1 | 1) => void;
  onPlace: (contentId: ContentId, zone: Zone) => void;
  onAddBlock: (zone: Zone, contentType: keyof typeof CONTENT_TYPES) => void;
  onRemoveItem: (contentId: ContentId) => void;
  onMoveItem: (contentId: ContentId, dir: -1 | 1) => void;
};

// The zones a staging box exposes: a SINGLE box is one zone, a DOUBLE box
// is a Left and a Right half. Mirrors derive-zones.ts's
// layoutId/layoutType/layoutParentId triple so a placed/added block
// carries the exact fields the live app uses for that zone.
function boxZones(layout: LayoutItem, position: number): Zone[] {
  if (layout.layoutType === LAYOUTS.DOUBLE) {
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

// One layout "box" in the WYSIWYG staging pane (specs/wysiwyg-staging.md):
// a control header (label + reorder + remove) above the layout's zones,
// which render the real styled resume content. A SINGLE box is one zone; a
// DOUBLE box is two columns split by the same hairline the canvas uses.
export default function RestructureStagingBox({
  layout,
  position,
  items,
  isFirst,
  isLast,
  onRemoveLayout,
  onMoveLayout,
  onPlace,
  onAddBlock,
  onRemoveItem,
  onMoveItem,
}: RestructureStagingBoxProps) {
  const zones = boxZones(layout, position);
  const isDouble = layout.layoutType === LAYOUTS.DOUBLE;

  return (
    <div className="rounded border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-2 py-1">
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

      {/* The same two-column split (divide-x hairline) the canvas draws for
          a DOUBLE layout, so the preview matches. */}
      <div className={c({ 'flex divide-x divide-gray-200': isDouble })}>
        {zones.map((zone) => (
          <RestructureStagingZone
            key={zone.key}
            zone={zone}
            items={items}
            onPlace={onPlace}
            onAddBlock={onAddBlock}
            onRemoveItem={onRemoveItem}
            onMoveItem={onMoveItem}
          />
        ))}
      </div>
    </div>
  );
}
