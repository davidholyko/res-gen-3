import { useEffect } from 'react';

import { useAppContext } from '@/context/app-context';
import PdfPreview from '@/pdf/pdf-preview';

import EditPanel from './edit-panel';

// The PDF preview surface. It takes over the editor area (rendered by
// main.tsx while `isPdfViewOpen`) rather than floating as an overlay --
// same "the view replaces the canvas" model as the restructure view, so
// the control bar stays put and the PDF button reads as active. In view
// mode it's just the preview; while a block is being edited it docks the
// live edit panel beside it (specs/edit-with-live-pdf-preview.md).
// Escape closes the view.
export default function PdfView() {
  const { isPdfViewOpen, togglePdfView, editingContentId } = useAppContext();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        togglePdfView(false);
      }
    };

    if (isPdfViewOpen) {
      document.addEventListener('keydown', handleKeyPress);
    } else {
      document.removeEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isPdfViewOpen, togglePdfView]);

  if (!isPdfViewOpen) return null;

  return (
    <div
      className="flex h-full w-full flex-col bg-white"
      data-testid="pdf-view"
    >
      {/* While open, this view replaces the canvas (whose only h1 is the
          resume name), so it must carry the page's level-one heading
          itself (WCAG 1.3.1 / axe page-has-heading-one) -- the same
          reason the restructure view has its own h1. Visually hidden
          because the view is deliberately chrome-free (the old blue top
          bar was removed); the heading is for assistive tech only. */}
      <h1 className="sr-only">PDF preview</h1>
      {/* Below a sane minimum the content scrolls horizontally rather
          than letting the panel collapse onto or over the preview
          (specs/edit-with-live-pdf-preview.md, Decisions). */}
      <div className="grow overflow-x-auto">
        <div className="flex h-full min-w-[56rem]">
          <div className="grow h-full">
            <PdfPreview />
          </div>
          {editingContentId !== null && <EditPanel />}
        </div>
      </div>
    </div>
  );
}
