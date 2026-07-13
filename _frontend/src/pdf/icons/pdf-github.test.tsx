import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import GithubSvg from './pdf-github';

describe('GithubSvg', () => {
  it('renders an svg containing a path', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <GithubSvg className="icon" />
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('path')).not.toBeNull();
  });
});
