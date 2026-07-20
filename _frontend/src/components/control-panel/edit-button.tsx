import { useAppContext } from '@/context/app-context';

// Opens the block-editing modal straight from the control bar
// (specs/edit-with-live-pdf-preview.md): the same docked-form-beside-
// live-preview surface reached inline via "Edit with preview", but
// entered here focused on the first block, with the modal's own picker
// left to switch between the rest. Disabled with no blocks -- there is
// nothing to edit (layouts alone carry no editable form).
export default function EditButton() {
  const { items, openEditingView } = useAppContext();

  const firstBlock = items[0];

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
