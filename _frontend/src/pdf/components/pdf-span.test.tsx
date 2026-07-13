import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import Span from './pdf-span';

describe('Span', () => {
  it('renders its children inside a Text element', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <Span className="inline">Some text</Span>
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('text')).toHaveTextContent('Some text');
  });
});
