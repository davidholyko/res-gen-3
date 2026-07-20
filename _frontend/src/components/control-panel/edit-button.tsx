import c from 'classnames';

import { useAppContext } from '@/context/app-context';
import { deriveZones } from '@/utils/derive-zones';

// A control-bar shortcut to editing the first block: identical to
// clicking that block on the canvas. Focusing it (focusCanvasBlock)
// reveals the block's own toolbar and opens the docked edit panel
// beside the canvas (specs/canvas-edit-panel.md) -- the everyday
// editing surface, not the PDF preview view (that stays reachable from
// the focused block's "Edit with preview"). Disabled with no blocks --
// there is nothing to edit (layouts alone carry no editable form).
export default function EditButton() {
  const { items, layouts, focusCanvasBlock, canvasEditingContentId } =
    useAppContext();

  // Reads as active/pressed while any block is focused -- i.e. whenever
  // the canvas edit panel is open, however it was opened (this button or
  // a click on the block itself). Mirrors the Restructure button's
  // active state so the bar always shows which view you're in.
  const isActive = canvasEditingContentId !== null;

  // The first macro in document (reading) order -- the topmost block on
  // the canvas -- not merely items[0] in insertion order. Walks zones
  // then the blocks within each, exactly as the canvas lays them out
  // (deriveZones), so "Edit" always lands on the block a user would
  // point to as first. Falls back to items[0] for the defensive case of
  // a block not yet placed in any zone.
  const firstBlock =
    deriveZones(layouts)
      .flatMap((zone) =>
        items.filter((item) => item.layoutId === zone.layoutId),
      )
      .at(0) ?? items[0];

  return (
    <button
      type="button"
      disabled={!firstBlock}
      aria-pressed={isActive}
      className={c(
        'rounded px-2 py-1 text-sm hover:bg-cyan-200 disabled:text-gray-400 disabled:hover:bg-transparent',
        {
          'bg-cyan-200 text-gray-900': isActive,
          'text-gray-700': !isActive,
        },
      )}
      onClick={() => firstBlock && focusCanvasBlock(firstBlock.contentId)}
    >
      Edit
    </button>
  );
}
