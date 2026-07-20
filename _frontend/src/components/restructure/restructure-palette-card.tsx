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
  // Staging zones this card can be sent to via the keyboard menu (the
  // non-drag equivalent). Empty when there are no boxes yet.
  zones: Zone[];
  onSendTo: (zone: Zone) => void;
};

// One macro in the restructure view's left palette
// (specs/restructure-view.md): a compact, draggable "what is this" card
// (type + one-line summary), never the full styled block. Dragging it
// copies it into a staging box; the "Send to…" menu is the
// keyboard-accessible equivalent so the feature is never drag-only.
export default function RestructurePaletteCard({
  item,
  zones,
  onSendTo,
}: RestructurePaletteCardProps) {
  const { typeLabel, summary } = deriveMacroLabel(item);
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
      className="flex items-center gap-2 rounded border border-gray-300 bg-white px-2 py-1"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(MACRO_DRAG_MIME, item.contentId);
        event.dataTransfer.effectAllowed = 'copy';
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
            aria-label={`Send ${typeLabel} to a box`}
            aria-haspopup="true"
            aria-expanded={isOpen}
            aria-controls={menuId}
            className="rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            Send to…
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
                    onSendTo(zone);
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
