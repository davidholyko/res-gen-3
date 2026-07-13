import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LAYOUTS } from '@/constants';
import { PdfDocumentProvider } from '@/context/pdf-document-context';
import type { ContentAll } from '@/types/content-all';
import type { LayoutItem } from '@/types/layouts';

import PdfComponentManager from './pdf-component-manager';

function item(contentType: string, layoutId: string): ContentAll {
  return {
    contentId: `${contentType}-${layoutId}`,
    contentType,
    layoutId,
    layoutType: LAYOUTS.SINGLE,
    content: { name: 'x' },
  } as ContentAll;
}

describe('PdfComponentManager', () => {
  it('renders items grouped under their SINGLE layout, excluding items from other layouts', () => {
    const layouts: LayoutItem[] = [
      { layoutId: 'a', layoutType: LAYOUTS.SINGLE },
    ];
    const items = [item('CONTACT', 'a'), item('HEADER', 'other-layout')];

    const { container } = render(
      <PdfDocumentProvider styles={{}} items={items} layouts={layouts} title="">
        <PdfComponentManager />
      </PdfDocumentProvider>,
    );

    expect(container.querySelectorAll('view').length).toBeGreaterThan(0);
  });

  it('renders items grouped under a DOUBLE layout in two columns', () => {
    const layouts: LayoutItem[] = [
      {
        layoutId: 'a',
        layoutType: LAYOUTS.DOUBLE,
        layoutLeftId: 'l',
        layoutRightId: 'r',
      },
    ];
    const items = [item('CONTACT', 'l'), item('HEADER', 'r')];

    const { container } = render(
      <PdfDocumentProvider styles={{}} items={items} layouts={layouts} title="">
        <PdfComponentManager />
      </PdfDocumentProvider>,
    );

    expect(container.querySelectorAll('view').length).toBeGreaterThan(0);
  });

  it('throws for an unsupported layout type', () => {
    const layouts = [
      { layoutId: 'a', layoutType: 'TRIPLE' },
    ] as unknown as LayoutItem[];

    expect(() =>
      render(
        <PdfDocumentProvider styles={{}} items={[]} layouts={layouts} title="">
          <PdfComponentManager />
        </PdfDocumentProvider>,
      ),
    ).toThrow(/Unsupported layoutType/);
  });
});
