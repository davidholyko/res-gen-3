import { useAppContext } from '@/context/app-context';
import { usePdfInstance } from '@/context/pdf-instance-context';

type PdfViewTopBarProps = {
  anchorPage: number;
  onAnchorPageChange: (page: number) => void;
};

export default function PdfViewTopBar({
  anchorPage,
  onAnchorPageChange,
}: PdfViewTopBarProps) {
  const { togglePdfView, editingContentId } = useAppContext();
  const { pageCount } = usePdfInstance();

  // The stepper exists because the native PDF viewer's scroll state is
  // unreadable from JS: this is the page the preview re-anchors to on
  // every live refresh (specs/edit-with-live-pdf-preview.md). Only shown
  // while editing (view-only mode never refreshes out from under you)
  // and only when there's more than one page to step between.
  const showStepper =
    editingContentId !== null && pageCount !== null && pageCount > 1;

  return (
    <div className="bg-blue-500 p-4 flex justify-end items-center">
      {showStepper && (
        // Its own bg-blue-700 chip, not the bar's bg-blue-500: white text
        // on blue-500 is ~3.8:1 (needs 4.5:1) -- caught by a real-browser
        // axe scan; blue-700 clears it comfortably.
        <div className="mr-auto flex items-center gap-2 text-white bg-blue-700 rounded px-2 py-1">
          <button
            type="button"
            className="px-2 py-0.5 rounded border border-white/60 hover:bg-blue-800 disabled:opacity-40"
            aria-label="Previous page"
            disabled={anchorPage <= 1}
            onClick={() => onAnchorPageChange(anchorPage - 1)}
          >
            ◀
          </button>
          <span aria-live="polite">
            Page {anchorPage} of {pageCount}
          </span>
          <button
            type="button"
            className="px-2 py-0.5 rounded border border-white/60 hover:bg-blue-800 disabled:opacity-40"
            aria-label="Next page"
            disabled={anchorPage >= pageCount}
            onClick={() => onAnchorPageChange(anchorPage + 1)}
          >
            ▶
          </button>
        </div>
      )}
      <button
        className="text-white hover:text-gray-300"
        aria-label="Exit PDF View Button"
        onClick={() => togglePdfView()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
