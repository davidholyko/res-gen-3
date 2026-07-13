import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { LAYOUTS } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentAll } from '@/types/content-all';

import MacroManager from './macro-manager';

const LAYOUT = { layoutId: 'a', layoutType: LAYOUTS.SINGLE };

function item(
  contentType: string,
  content: Record<string, unknown>,
): ContentAll {
  return {
    contentId: `${contentType}-1`,
    contentType,
    layoutId: LAYOUT.layoutId,
    layoutType: LAYOUT.layoutType,
    content,
  } as ContentAll;
}

describe('MacroManager', () => {
  it('renders one macro per supported content type', () => {
    const items = [
      item('CONTACT', { name: 'Ada' }),
      item('HEADER', { header: 'Summary' }),
      item('PARAGRAPH', { paragraph: 'Bio' }),
      item('EXPERIENCE', {
        company: 'Acme',
        title: 'Eng',
        startDate: '',
        endDate: '',
        bullets: [],
      }),
      item('ANY_LIST', { list: ['a'] }),
    ];

    const { container } = render(
      <AllProviders>
        <MacroManager items={items} />
      </AllProviders>,
    );

    expect(container.querySelector('.macro-manager')).not.toBeNull();
    expect(container.querySelector('.macro-manager')?.children).toHaveLength(5);
  });

  it('has no automatically detectable accessibility violations across a realistic mix of macros, including heading order', async () => {
    // ContactMacro's `name` is the page's only h1; every other macro's own
    // heading (HeaderMacro's h2, ContactMacro's own optional title h2)
    // must not skip a level relative to it (WCAG 1.3.1) -- axe's
    // heading-order rule only catches this with sibling headings present,
    // which is why this check lives here rather than on each macro alone.
    const items = [
      item('CONTACT', { name: 'Ada', title: 'Engineer' }),
      item('HEADER', { header: 'Summary' }),
      item('PARAGRAPH', { paragraph: 'Bio' }),
      item('EXPERIENCE', {
        company: 'Acme',
        title: 'Eng',
        startDate: '',
        endDate: '',
        bullets: [],
      }),
      item('ANY_LIST', { list: ['a'] }),
    ];

    const { container } = render(
      <AllProviders>
        <MacroManager items={items} />
      </AllProviders>,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });

  it('throws for an unsupported content type', () => {
    const items = [item('UNKNOWN', {})];

    expect(() =>
      render(
        <AllProviders>
          <MacroManager items={items} />
        </AllProviders>,
      ),
    ).toThrow(/Invalid item/);
  });
});
