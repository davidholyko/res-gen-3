import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import WebsiteSvg from './pdf-website';

describe('WebsiteSvg', () => {
  it('renders an svg', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <WebsiteSvg className="icon" />
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('svg')).not.toBeNull();
  });
});
