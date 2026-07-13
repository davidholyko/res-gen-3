import { PDFViewer } from '@react-pdf/renderer';

import { useAppContext } from '@/context/app-context';
import { PdfDocumentProvider } from '@/context/pdf-document-context';
import { usePdfPreviewContext } from '@/context/pdf-preview-context';

import PdfDocument from './pdf-document';

export default function PdfPreview() {
  const { styles } = usePdfPreviewContext();
  const { items, layouts, title } = useAppContext();

  return (
    // title: PDFViewer renders a plain <iframe> with no accessible name of
    // its own by default (WCAG 2.4.1/4.1.2) -- reuse the same computed
    // filename already shown to sighted users on download. @react-pdf's
    // PDFViewerProps type doesn't declare `title` even though the
    // implementation passes it straight through to the underlying
    // <iframe> (confirmed via its source and a live browser check).
    // @ts-expect-error -- see comment above; package types lag its JS.
    <PDFViewer title={title} style={{ height: '100%', width: '100%' }}>
      <PdfDocumentProvider
        styles={styles}
        items={items}
        layouts={layouts}
        title={title}
      >
        <PdfDocument />
      </PdfDocumentProvider>
    </PDFViewer>
  );
}
