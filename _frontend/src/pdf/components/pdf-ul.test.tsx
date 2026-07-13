import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import UnorderedList from './pdf-ul';

describe('UnorderedList', () => {
  it('renders its children inside a View element', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <UnorderedList className="list">item</UnorderedList>
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('view')).toHaveTextContent('item');
  });
});
