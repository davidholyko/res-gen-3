import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import H1 from './pdf-h1';

describe('H1', () => {
  it('renders its children inside a Text element', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <H1 className="title">Heading</H1>
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('text')).toHaveTextContent('Heading');
  });
});
