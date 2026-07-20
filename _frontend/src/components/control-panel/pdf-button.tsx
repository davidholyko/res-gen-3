import { useAppContext } from '@/context/app-context';

// Opens the resume PDF preview modal from the control bar. Promoted out
// of the old View menu, which held only this one action -- a top-level
// button beside Edit/Restructure reads clearer than a menu of one.
// Disabled until there is something to render (any block or layout).
export default function PdfButton() {
  const { togglePdfModal, items, layouts, isRestructuring } = useAppContext();

  // Hidden while restructuring, like the Restructure and Edit buttons:
  // that view takes over the whole editor area (main.tsx), and a preview
  // of the pre-restructure document is only noise beside its own
  // Clear/Cancel/Apply.
  if (isRestructuring) return null;

  const disabled = !(items.length || layouts.length);

  return (
    <button
      type="button"
      disabled={disabled}
      className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-cyan-200 disabled:text-gray-400 disabled:hover:bg-transparent"
      onClick={() => togglePdfModal()}
    >
      PDF
    </button>
  );
}
