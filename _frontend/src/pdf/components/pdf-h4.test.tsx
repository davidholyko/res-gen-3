import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import H4 from './pdf-h4';

describe('H4', () => {
  it('renders its children inside a Text element', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <H4 className="title">Heading</H4>
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('text')).toHaveTextContent('Heading');
  });
});
