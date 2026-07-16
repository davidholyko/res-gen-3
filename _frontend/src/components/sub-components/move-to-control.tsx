import { useCanvasMenu } from '@/components/layouts/use-canvas-menu';
import { useAppContext } from '@/context/app-context';
import type { ContentId } from '@/types/content-base-item';
import { deriveZones, type Zone } from '@/utils/derive-zones';

import MoveIcon from '../icons/move-icon';

type MoveToControlProps = {
  contentId: ContentId;
};

// The block toolbar's "Move to…" affordance
// (specs/move-block-between-layouts.md): the only way to move an
// existing block into another layout -- including either half of a
// two-column layout, which nothing else can do. An icon+caret trigger
// (matching the icon-only Move up/down) opens a flat menu of every zone
// except the block's current one; picking one reassigns the block there.
// Menu mechanics (outside-click/Escape dismissal, arrow-key movement,
// aria-haspopup/expanded) are the shared `useCanvasMenu`, same as the
// canvas "+ Add block" / "+ Add layout" menus.
export default function MoveToControl({ contentId }: MoveToControlProps) {
  const { items, layouts, moveContentToZone } = useAppContext();
  const {
    isOpen,
    setIsOpen,
    close,
    menuRef,
    containerRef,
    menuId,
    onMenuKeyDown,
  } = useCanvasMenu();

  const item = items.find((i) => i.contentId === contentId);
  // Defensive: the toolbar only mounts for a focused, existing block.
  if (!item) return null;

  const targetZones = deriveZones(layouts).filter(
    (zone) => zone.layoutId !== item.layoutId,
  );
  // Nowhere to move to -- a lone zone, so hide the control entirely
  // rather than offer an empty menu.
  if (targetZones.length === 0) return null;

  const onPick = (zone: Zone) => {
    moveContentToZone(contentId, {
      layoutId: zone.layoutId,
      layoutType: zone.layoutType,
      layoutParentId: zone.layoutParentId,
    });
    close();
  };

  return (
    // Menu popup is a sibling of the trigger (aria-haspopup/aria-controls),
    // same WCAG 4.1.2 reasoning as BaseMenu.
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Move to another layout"
        title="Move to another layout"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className="flex items-center text-xs hover:bg-gray-500 rounded px-1"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {/* Icon + caret. The caret is a bare text node, not a <span>: the
            button's aria-label already names the control, and a stray
            chrome <span> would get caught by content-scoped selectors. */}
        <MoveIcon className="m-1 p-1" />▾
      </button>
      {isOpen && (
        <div
          id={menuId}
          role="menu"
          tabIndex={-1}
          ref={menuRef}
          onKeyDown={onMenuKeyDown}
          // Light popup over the dark toolbar, matching the canvas add
          // menus; z-30 so it renders above ordinary page content.
          className="absolute z-30 flex flex-col bg-white text-gray-800 border border-gray-300 rounded shadow-lg min-w-[11rem]"
        >
          {targetZones.map((zone) => (
            <button
              key={zone.key}
              type="button"
              role="menuitem"
              tabIndex={0}
              className="text-left text-sm px-3 py-2 hover:bg-cyan-100"
              onClick={() => onPick(zone)}
            >
              {zone.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
