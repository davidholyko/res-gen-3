import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import PdfDocument from './pdf-document';

describe('PdfDocument', () => {
  it('renders a Document/Page with the given title', () => {
    const { container } = render(
      <PdfDocumentProvider
        styles={{ page: {} }}
        items={[]}
        layouts={[]}
        title="resume.pdf"
      >
        <PdfDocument />
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('document')).toHaveAttribute(
      'title',
      'resume.pdf',
    );
    expect(container.querySelector('page')).not.toBeNull();
  });

  it('accepts an onRender prop without breaking rendering (threaded through to Document by PdfInstanceProvider)', () => {
    const onRender = () => {};
    const { container } = render(
      <PdfDocumentProvider
        styles={{ page: {} }}
        items={[]}
        layouts={[]}
        title="resume.pdf"
      >
        <PdfDocument onRender={onRender} />
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('document')).not.toBeNull();
  });
});
