import { Document, Page } from '@react-pdf/renderer';

import { usePdfDocumentContext } from '@/context/pdf-document-context';
import PdfComponentManager from '@/managers/pdf-component-manager';

export default function PdfDocument() {
  const { styles, title } = usePdfDocumentContext();

  return (
    <Document title={title}>
      <Page size="LETTER" style={styles.page}>
        <PdfComponentManager />
      </Page>
    </Document>
  );
}
