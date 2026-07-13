import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import Paragraph from './pdf-p';

describe('Paragraph', () => {
  it('renders its children inside a Text element', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <Paragraph className="body">Some text</Paragraph>
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('text')).toHaveTextContent('Some text');
  });
});
