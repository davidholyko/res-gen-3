// Namespace import for the same reason as pdf-document-context.tsx: the
// `OnRenderProps` type lives inside `@react-pdf/renderer`'s
// `export = ReactPDF` namespace.
import * as ReactPDF from '@react-pdf/renderer';
import { Document, Page } from '@react-pdf/renderer';

import { usePdfDocumentContext } from '@/context/pdf-document-context';
import PdfComponentManager from '@/managers/pdf-component-manager';

type PdfDocumentProps = {
  onRender?: (props: ReactPDF.OnRenderProps) => void;
};

export default function PdfDocument({ onRender }: PdfDocumentProps) {
  const { styles, title } = usePdfDocumentContext();

  return (
    <Document title={title} onRender={onRender}>
      <Page size="LETTER" style={styles.page}>
        <PdfComponentManager />
      </Page>
    </Document>
  );
}
