import { useAppContext } from '@/context/app-context';
import { deriveZones } from '@/utils/derive-zones';

// Opens the block-editing modal straight from the control bar
// (specs/edit-with-live-pdf-preview.md): the same docked-form-beside-
// live-preview surface reached inline via "Edit with preview", but
// entered here focused on the first block, with the modal's own picker
// left to switch between the rest. Disabled with no blocks -- there is
// nothing to edit (layouts alone carry no editable form).
export default function EditButton() {
  const { items, layouts, openEditingView } = useAppContext();

  // The first macro in document (reading) order -- the topmost block on
  // the canvas -- not merely items[0] in insertion order. Walks zones
  // then the blocks within each, exactly as the modal's own picker does
  // (edit-panel.tsx / deriveZones), so "Edit" always lands on the block
  // a user would point to as first. Falls back to items[0] for the
  // defensive case of a block not yet placed in any zone.
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
      className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-cyan-200 disabled:text-gray-400 disabled:hover:bg-transparent"
      onClick={() => firstBlock && openEditingView(firstBlock.contentId)}
    >
      Edit
    </button>
  );
}
