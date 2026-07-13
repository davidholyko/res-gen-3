import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import Img from './pdf-img';

describe('Img', () => {
  it('renders an Image element with the given src', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <Img className="photo" src="./photo.png" alt="a photo" style={{}} />
      </PdfDocumentProvider>,
    );

    const img = container.querySelector('image');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', './photo.png');
  });
});
