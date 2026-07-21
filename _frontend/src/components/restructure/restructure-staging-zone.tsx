import c from 'classnames';
import { useState } from 'react';

import MacroContent from '@/components/json-macros/contents/macro-content';
import { LAYOUTS, type CONTENT_TYPES } from '@/constants';
import type { ContentAll } from '@/types/content-all';
import type { ContentId } from '@/types/content-base-item';
import { deriveMacroLabel } from '@/utils/derive-macro-label';
import type { Zone } from '@/utils/derive-zones';

import RestructureAddBlock from './restructure-add-block';
import { MACRO_DRAG_MIME } from './restructure-palette-card';

type RestructureStagingZoneProps = {
  zone: Zone;
  // All staging items; the zone renders the ones whose layoutId is its own.
  items: ContentAll[];
  onPlace: (contentId: ContentId, zone: Zone) => void;
  onAddBlock: (zone: Zone, contentType: keyof typeof CONTENT_TYPES) => void;
  onRemoveItem: (contentId: ContentId) => void;
  onMoveItem: (contentId: ContentId, dir: -1 | 1) => void;
};

// One zone of a staging layout, rendered WYSIWYG (specs/wysiwyg-staging.md):
// its blocks show as the real styled resume content (MacroContent), each
// with a thin left action gutter (move up / down / remove) so the controls
// never cover the content. The zone is a drop target for palette drags
// (drop lands at the end of the zone) and carries its own "+ Add block".
export default function RestructureStagingZone({
  zone,
  items,
  onPlace,
  onAddBlock,
  onRemoveItem,
  onMoveItem,
}: RestructureStagingZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const zoneItems = items.filter((item) => item.layoutId === zone.layoutId);
  const isDouble =
    zone.layoutType === LAYOUTS.DOUBLE_LEFT ||
    zone.layoutType === LAYOUTS.DOUBLE_RIGHT;

  return (
    <div
      // A DOUBLE box's two halves each get a faint tinted panel so the two
      // columns read as separate drop targets at a glance -- otherwise the
      // only cue that a two-column box has a Left and a Right zone is the
      // thin divider, easy to miss when deciding where to drop.
      className={c('p-2', { 'grow w-[50%] bg-gray-50/70': isDouble })}
      data-testid="staging-zone"
      aria-label={`${zone.label} drop zone`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        const contentId = event.dataTransfer.getData(MACRO_DRAG_MIME);
        if (contentId) onPlace(contentId as ContentId, zone);
      }}
    >
      {isDouble && (
        <span className="mb-1 inline-block rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-700">
          {zone.layoutType === LAYOUTS.DOUBLE_LEFT ? 'Left' : 'Right'}
        </span>
      )}

      <div
        className={c('rounded', {
          'outline outline-2 outline-cyan-400': isOver,
        })}
      >
        {zoneItems.length === 0 ? (
          <p className="rounded border-2 border-dashed border-gray-300 px-1 py-3 text-center text-xs text-gray-600">
            Drop a macro here
          </p>
        ) : (
          zoneItems.map((item, index) => {
            const { typeLabel } = deriveMacroLabel(item);
            return (
              // Hover (or keyboard-focus) highlights the whole macro row --
              // the styled content and its side action gutter together --
              // so it's clear which block the gutter's controls act on.
              <div
                key={item.contentId}
                className="group flex gap-1 rounded px-1 py-0.5 transition-colors hover:bg-cyan-50 focus-within:bg-cyan-50"
              >
                {/* Left action gutter -- never over the content
                    (specs/wysiwyg-staging.md). Hidden until the row is
                    hovered or focused (opacity, not display, so the
                    buttons stay keyboard-focusable and the content never
                    shifts), then it fades in with its block. */}
                <div className="flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
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
                    ✕
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <MacroContent item={item} />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-1">
        <RestructureAddBlock
          onAdd={(contentType) => onAddBlock(zone, contentType)}
        />
      </div>
    </div>
  );
}
