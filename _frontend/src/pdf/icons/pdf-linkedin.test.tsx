import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import Linkedin from './pdf-linkedin';

describe('Linkedin', () => {
  it('renders an svg', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <Linkedin className="icon" />
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('svg')).not.toBeNull();
  });
});
