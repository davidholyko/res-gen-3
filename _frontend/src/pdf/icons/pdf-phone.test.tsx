import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import PhoneSvg from './pdf-phone';

describe('PhoneSvg', () => {
  it('renders an svg', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <PhoneSvg className="icon" />
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('svg')).not.toBeNull();
  });
});
