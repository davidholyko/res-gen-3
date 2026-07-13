import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import Div from './pdf-div';

describe('Div', () => {
  it('renders its children inside a View element', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <Div className="container">content</Div>
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('view')).toHaveTextContent('content');
  });
});
