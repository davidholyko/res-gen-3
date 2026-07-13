import { usePDF } from '@react-pdf/renderer';
import { useEffect } from 'react';

import { useAppContext } from '@/context/app-context';
import { PdfDocumentProvider } from '@/context/pdf-document-context';
import { usePdfPreviewContext } from '@/context/pdf-preview-context';

import PdfDocument from './pdf-document';

export default function PdfPreview() {
  const { styles } = usePdfPreviewContext();
  const { items, layouts, title } = useAppContext();
  // Manual usePDF()+<iframe>, not <PDFViewer>, so `instance.loading` is
  // available to drive a visible loading state before the iframe has a
  // real `src` (specs/app-ux-improvements.md, Finding 10) -- this is
  // exactly what PDFViewer does internally, minus the always-mounted
  // iframe with a null src.
  const [instance, updateInstance] = usePDF();

  useEffect(() => {
    updateInstance(
      <PdfDocumentProvider
        styles={styles}
        items={items}
        layouts={layouts}
        title={title}
      >
        <PdfDocument />
      </PdfDocumentProvider>,
    );
  }, [styles, items, layouts, title, updateInstance]);

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
