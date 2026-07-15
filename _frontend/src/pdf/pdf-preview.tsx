import { useEffect, useState } from 'react';

import { useAppContext } from '@/context/app-context';
import { usePdfInstance } from '@/context/pdf-instance-context';

// Fallback promotion delay for environments whose PDF frames never fire
// a load event at all -- headless Chromium is one (confirmed live: even
// a bare native iframe pointing at a PDF blob URL never fires load
// there, while headed Chromium fires it near-instantly). Long enough
// that a real browser's load always wins the race.
const STAGING_FALLBACK_MS = 2500;

type PdfPreviewProps = {
  // 1-based page the frame (re)opens on -- the "tracked as best we can"
  // anchor from specs/edit-with-live-pdf-preview.md. The native PDF
  // viewer's own scroll state is unreadable from JS (it lives in a
  // closed plugin frame), so this is driven by the modal's explicit
  // page stepper.
  anchorPage?: number;
};

export default function PdfPreview({ anchorPage = 1 }: PdfPreviewProps) {
  const { title } = useAppContext();
  // Shared instance, not its own usePDF() call: PdfInstanceProvider
  // (mounted once, above both this modal and the always-visible
  // page-count indicator) owns the actual render -- this avoids two
  // separate render pipelines for the same content, and means the
  // modal usually opens against an already-rendered instance instead of
  // cold-starting its own render every time
  // (specs/multi-page-indicator.md).
  const { instance } = usePdfInstance();

  // Double-buffered (specs/edit-with-live-pdf-preview.md): every
  // re-render mints a new blob URL, and a naive src swap reloads the
  // frame -- a white flash and a scroll reset to page 1 on every pause
  // in typing. Instead the current frame stays visible while the
  // incoming URL loads in a hidden sibling; only once loaded does it
  // become the visible frame.
  const [visibleSrc, setVisibleSrc] = useState<string | null>(null);

  // `#toolbar=1` matches what PDFViewer appends internally (confirmed
  // via its source); `page=` re-anchors the freshly loaded frame.
  const targetSrc = instance.url
    ? `${instance.url}#toolbar=1&page=${anchorPage}`
    : null;

  // Belt-and-suspenders promotion: the staged frame's own load event is
  // the fast path, but it never fires in load-less environments (see
  // STAGING_FALLBACK_MS) -- without this the preview would wedge on
  // "loading" forever there.
  useEffect(() => {
    if (!targetSrc || targetSrc === visibleSrc) return;

    const timeoutId = setTimeout(
      () => setVisibleSrc(targetSrc),
      STAGING_FALLBACK_MS,
    );
    return () => clearTimeout(timeoutId);
  }, [targetSrc, visibleSrc]);

  if (!visibleSrc && (instance.loading || !targetSrc)) {
    return (
      <div
        role="status"
        className="flex items-center justify-center h-full w-full text-gray-600"
      >
        Generating PDF preview…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {visibleSrc && (
        // title: a plain <iframe> has no accessible name of its own by
        // default (WCAG 2.4.1/4.1.2) -- reuse the same computed filename
        // already shown to sighted users on download.
        <iframe
          src={visibleSrc}
          title={title}
          className="h-full w-full"
          data-testid="pdf-frame-visible"
        />
      )}
      {targetSrc && targetSrc !== visibleSrc && (
        <iframe
          src={targetSrc}
          // The staging frame is invisible plumbing until its load event
          // promotes it -- never part of the accessibility tree or tab
          // order.
          aria-hidden="true"
          tabIndex={-1}
          title="Loading PDF preview"
          className="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
          data-testid="pdf-frame-staging"
          onLoad={() => setVisibleSrc(targetSrc)}
        />
      )}
    </div>
  );
}
