import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import ListItem from './pdf-li';

describe('ListItem', () => {
  it('renders a bullet and the item text', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <ListItem className="item">Item text</ListItem>
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('circle')).not.toBeNull();
    expect(container.querySelector('text')).toHaveTextContent('Item text');
  });
});
