import c from 'classnames';
import { useState } from 'react';

import { useCanvasMenu } from '@/components/layouts/use-canvas-menu';
import type { ContentAll } from '@/types/content-all';
import { deriveMacroLabel } from '@/utils/derive-macro-label';
import type { Zone } from '@/utils/derive-zones';

// The MIME-ish key the drag carries: the source macro's contentId, read
// back by the staging drop zones. `text/plain` (not a custom type) so the
// value survives jsdom's DataTransfer in tests and every real browser.
export const MACRO_DRAG_MIME = 'text/plain';

type RestructurePaletteCardProps = {
  item: ContentAll;
  // Staging zones this card can be moved to via the keyboard menu (the
  // non-drag equivalent). Empty when there are no boxes yet.
  zones: Zone[];
  onMoveTo: (zone: Zone) => void;
  // Fired as this card's own drag starts (true) and ends (false), so the
  // view can open up the gaps into easy-to-hit drop slots while a card is
  // in flight. Optional -- the card works standalone without it.
  onDraggingChange?: (dragging: boolean) => void;
};

// One macro in the restructure view's staging outline
// (specs/restructure-palette-mirror.md): a compact, draggable "what is
// this" card (type + one-line summary), never the full styled block.
// Dragging it *moves* the block within staging -- the outline and the
// styled preview mirror the same state; the "Move to…" menu is the
// keyboard-accessible equivalent so the feature is never drag-only.
export default function RestructurePaletteCard({
  item,
  zones,
  onMoveTo,
  onDraggingChange,
}: RestructurePaletteCardProps) {
  const { typeLabel, summary } = deriveMacroLabel(item);
  // Fade this card while it's the one being dragged: the browser already
  // renders a drag ghost that follows the cursor, so leaving the source at
  // full opacity makes the tile look duplicated. Dimming it reads as "this
  // is the one moving," and the drop slot shows where it will land.
  const [isDragging, setIsDragging] = useState(false);
  const {
    isOpen,
    setIsOpen,
    close,
    menuRef,
    containerRef,
    menuId,
    onMenuKeyDown,
  } = useCanvasMenu();

  return (
    <div
      className={c(
        'flex items-center gap-2 rounded border border-gray-300 bg-white px-2 py-1',
        { 'opacity-40': isDragging },
      )}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(MACRO_DRAG_MIME, item.contentId);
        // Every drag is a move now: into a staging zone, or into a gap in
        // the outline (specs/restructure-palette-mirror.md).
        event.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
        onDraggingChange?.(true);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDraggingChange?.(false);
      }}
      data-testid="palette-card"
    >
      <span aria-hidden="true" className="cursor-grab text-gray-400">
        ⠿
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
          {typeLabel}
        </span>
        <span className="block truncate text-sm text-gray-800">
          {summary || <span className="italic text-gray-600">(empty)</span>}
        </span>
      </span>

      {/* Keyboard/no-drag path. Hidden entirely when there's nowhere to
          send it (no staging boxes yet) rather than offering an empty
          menu -- same choice as move-to-control.tsx. */}
      {zones.length > 0 && (
        <div className="relative" ref={containerRef}>
          <button
            type="button"
            aria-label={`Move ${typeLabel} to a box`}
            aria-haspopup="true"
            aria-expanded={isOpen}
            aria-controls={menuId}
            className="rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            Move to…
          </button>
          {isOpen && (
            <div
              id={menuId}
              role="menu"
              tabIndex={-1}
              ref={menuRef}
              onKeyDown={onMenuKeyDown}
              className="absolute right-0 z-30 flex flex-col rounded border border-gray-300 bg-white text-gray-800 shadow-lg min-w-[11rem]"
            >
              {zones.map((zone) => (
                <button
                  key={zone.key}
                  type="button"
                  role="menuitem"
                  tabIndex={0}
                  className="px-3 py-2 text-left text-sm hover:bg-cyan-100"
                  onClick={() => {
                    onMoveTo(zone);
                    close();
                  }}
                >
                  {zone.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
