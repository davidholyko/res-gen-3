import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { PdfDocumentProvider } from '@/context/pdf-document-context';
import type { ContentAll } from '@/types/content-all';

import PdfItem from './pdf-item';

function item(contentType: string, content: Record<string, unknown>) {
  return {
    contentId: `${contentType}-1`,
    contentType,
    content,
    layoutId: 'a',
    layoutType: 'SINGLE',
  } as unknown as ContentAll;
}

function renderPdfItem(props: ContentAll) {
  return render(
    <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
      <PdfItem {...props} />
    </PdfDocumentProvider>,
  );
}

describe('PdfItem', () => {
  it('renders macro content as PDF primitives inside an isolated AppProvider', () => {
    const { container } = renderPdfItem(
      item(CONTENT_TYPES.CONTACT, { name: 'Ada Lovelace' }),
    );

    expect(container.textContent).toContain('Ada Lovelace');
    expect(container.querySelector('view')).not.toBeNull();
  });
});
