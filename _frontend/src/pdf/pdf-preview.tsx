import { useAppContext } from '@/context/app-context';
import { usePdfInstance } from '@/context/pdf-instance-context';

export default function PdfPreview() {
  const { title } = useAppContext();
  // Shared instance, not its own usePDF() call: PdfInstanceProvider
  // (mounted once, above both this modal and the always-visible
  // page-count indicator) owns the actual render -- this avoids two
  // separate render pipelines for the same content, and means the
  // modal usually opens against an already-rendered instance instead of
  // cold-starting its own render every time
  // (specs/multi-page-indicator.md). `instance.loading` still drives the
  // same visible loading state as before (specs/app-ux-improvements.md,
  // Finding 10).
  const { instance } = usePdfInstance();

  if (instance.loading || !instance.url) {
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
    // title: a plain <iframe> has no accessible name of its own by default
    // (WCAG 2.4.1/4.1.2) -- reuse the same computed filename already shown
    // to sighted users on download. `#toolbar=1` matches what PDFViewer
    // appends internally (confirmed via its source).
    <iframe
      src={`${instance.url}#toolbar=1`}
      title={title}
      style={{ height: '100%', width: '100%' }}
    />
  );
}
