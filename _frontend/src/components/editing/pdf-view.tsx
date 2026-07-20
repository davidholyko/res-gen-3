import { useEffect, useState } from 'react';

import { useAppContext } from '@/context/app-context';
import { usePdfInstance } from '@/context/pdf-instance-context';
import PdfPreview from '@/pdf/pdf-preview';

import PdfViewTopBar from '../sub-components/pdf-view-top-bar';
import EditPanel from './edit-panel';

// The PDF preview surface. It takes over the editor area (rendered by
// main.tsx while `isPdfViewOpen`) rather than floating as an overlay --
// same "the view replaces the canvas" model as the restructure view, so
// the control bar stays put and the PDF button reads as active. In view
// mode it's just the preview; while a block is being edited it docks the
// live edit panel beside it (specs/edit-with-live-pdf-preview.md).
export default function PdfView() {
  const { isPdfViewOpen, togglePdfView, editingContentId } = useAppContext();
  const { pageCount } = usePdfInstance();
  const [anchorPage, setAnchorPage] = useState(1);

  // The page the preview re-anchors to on each live refresh. Clamped
  // rather than stored clamped: pageCount can shrink under a stored
  // anchor when an edit shortens the document mid-session.
  const effectiveAnchorPage = pageCount
    ? Math.min(anchorPage, pageCount)
    : anchorPage;

  useEffect(() => {
    // A fresh open always starts at page 1 -- the anchor is session
    // state, not a preference.
    if (isPdfViewOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnchorPage(1);
    }
  }, [isPdfViewOpen]);

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
    <div className="flex h-full w-full flex-col bg-white">
      <PdfViewTopBar
        anchorPage={effectiveAnchorPage}
        onAnchorPageChange={setAnchorPage}
      />
      {/* Below a sane minimum the content scrolls horizontally rather
          than letting the panel collapse onto or over the preview
          (specs/edit-with-live-pdf-preview.md, Decisions). */}
      <div className="grow overflow-x-auto">
        <div className="flex h-full min-w-[56rem]">
          <div className="grow h-full">
            <PdfPreview anchorPage={effectiveAnchorPage} />
          </div>
          {editingContentId !== null && <EditPanel />}
        </div>
      </div>
    </div>
  );
}
