import { usePdfInstance } from '@/context/pdf-instance-context';

export default function PageCountIndicator() {
  const { pageCount } = usePdfInstance();

  // No indicator for a single-page resume, before the first render
  // settles, or if PdfInstanceProvider's private layout-data read ever
  // comes back missing/malformed -- nothing useful to show.
  if (!pageCount || pageCount <= 1) {
    return null;
  }

  return (
    <span
      role="status"
      aria-live="polite"
      className="text-xs font-bold bg-red-700 text-white rounded-full px-2 py-1"
    >
      {pageCount} pages
    </span>
  );
}
