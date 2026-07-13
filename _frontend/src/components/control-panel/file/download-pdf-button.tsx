import { pdf } from '@react-pdf/renderer';
import c from 'classnames';
import { useCallback, useMemo } from 'react';

import { useAppContext } from '@/context/app-context';
import { PdfDocumentProvider } from '@/context/pdf-document-context';
import { usePdfPreviewContext } from '@/context/pdf-preview-context';
import PdfDocument from '@/pdf/pdf-document';

type DownloadPdfButtonProps = {
  className?: string;
  role?: string;
  tabIndex?: 0 | -1;
};

export default function DownloadPdfButton({
  className,
  role,
  tabIndex,
}: DownloadPdfButtonProps) {
  const { styles } = usePdfPreviewContext();
  const { items, layouts, title } = useAppContext();

  const disabled = useMemo(() => {
    return !(items.length || layouts.length);
  }, [items, layouts]);

  const handleClick = useCallback(async () => {
    // Same PdfDocumentProvider + PdfDocument tree the preview modal
    // renders inside <PDFViewer> -- `pdf()` is @react-pdf's generation
    // primitive for producing a Blob without mounting an iframe.
    const blob = await pdf(
      <PdfDocumentProvider
        styles={styles}
        items={items}
        layouts={layouts}
        title={title}
      >
        <PdfDocument />
      </PdfDocumentProvider>,
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [styles, items, layouts, title]);

  const classNames = c('unstyled', className);

  return (
    <button
      className={classNames}
      type="button"
      disabled={disabled}
      onClick={handleClick}
      role={role}
      tabIndex={tabIndex}
    >
      Download PDF
    </button>
  );
}
