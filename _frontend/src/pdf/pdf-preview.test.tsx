import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppProvider } from '@/context/app-context';
import { PdfPreviewProvider } from '@/context/pdf-preview-context';

import PdfPreview from './pdf-preview';

describe('PdfPreview', () => {
  it('renders the PDFViewer as a full-size iframe', () => {
    const { container } = render(
      <AppProvider>
        <PdfPreviewProvider>
          <PdfPreview />
        </PdfPreviewProvider>
      </AppProvider>,
    );

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe).toHaveStyle({ height: '100%', width: '100%' });
  });

  it('gives the iframe an accessible title', () => {
    const { container } = render(
      <AppProvider>
        <PdfPreviewProvider>
          <PdfPreview />
        </PdfPreviewProvider>
      </AppProvider>,
    );

    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('title')).toMatch(/\.pdf$/);
  });
});
