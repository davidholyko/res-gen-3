import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import H2 from './pdf-h2';

describe('H2', () => {
  it('renders its children inside a Text element', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <H2 className="title">Heading</H2>
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('text')).toHaveTextContent('Heading');
  });
});
