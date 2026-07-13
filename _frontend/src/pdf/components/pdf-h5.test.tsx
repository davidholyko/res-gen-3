import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import H5 from './pdf-h5';

describe('H5', () => {
  it('renders its children inside a Text element', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <H5 className="title">Heading</H5>
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('text')).toHaveTextContent('Heading');
  });
});
