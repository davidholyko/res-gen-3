import { PDFViewer } from '@react-pdf/renderer';

import { useAppContext } from '@/context/app-context';
import { PdfDocumentProvider } from '@/context/pdf-document-context';
import { usePdfPreviewContext } from '@/context/pdf-preview-context';

import PdfDocument from './pdf-document';

export default function PdfPreview() {
  const { styles } = usePdfPreviewContext();
  const { items, layouts, title } = useAppContext();

  return (
    <PDFViewer style={{ height: '100%', width: '100%' }}>
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
