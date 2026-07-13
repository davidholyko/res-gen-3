import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import H3 from './pdf-h3';

describe('H3', () => {
  it('renders its children inside a Text element', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <H3 className="title">Heading</H3>
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('text')).toHaveTextContent('Heading');
  });
});
