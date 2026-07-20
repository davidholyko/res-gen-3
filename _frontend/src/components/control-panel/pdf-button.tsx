import c from 'classnames';

import { useAppContext } from '@/context/app-context';

// Opens the resume PDF preview from the control bar. Promoted out of the
// old View menu, which held only this one action -- a top-level button
// beside Edit/Restructure reads clearer than a menu of one. Disabled
// until there is something to render (any block or layout).
export default function PdfButton() {
  const { togglePdfView, items, layouts, isPdfViewOpen, editingContentId } =
    useAppContext();

  const disabled = !(items.length || layouts.length);

  // Reads as active/pressed while the PDF view is open, matching the
  // Edit and Restructure buttons -- the view now replaces the canvas
  // (main.tsx), so the bar stays visible to show it. Only for the plain
  // preview: with editingContentId set the same surface is the
  // edit-with-preview flow, not "PDF view".
  const isActive = isPdfViewOpen && editingContentId === null;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={isActive}
      className={c(
        'rounded px-2 py-1 text-sm hover:bg-cyan-200 disabled:text-gray-400 disabled:hover:bg-transparent',
        {
          'bg-cyan-200 text-gray-900': isActive,
          'text-gray-700': !isActive,
        },
      )}
      onClick={() => togglePdfView()}
    >
      PDF
    </button>
  );
}
