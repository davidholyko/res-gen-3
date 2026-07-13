import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentAll } from '@/types/content-all';

import MacroItem from './macro-item';

function item(contentType: string, content: Record<string, unknown>) {
  return {
    contentId: `${contentType}-1`,
    contentType,
    content,
    layoutId: 'a',
    layoutType: 'SINGLE',
  } as unknown as ContentAll;
}

describe('MacroItem', () => {
  it.each([
    [CONTENT_TYPES.CONTACT, { name: 'Ada' }, 'Ada'],
    [CONTENT_TYPES.HEADER, { header: 'Summary' }, 'Summary'],
    [CONTENT_TYPES.EXPERIENCE, { company: 'Acme', title: 'Eng' }, 'Acme'],
    [CONTENT_TYPES.PARAGRAPH, { paragraph: 'Bio' }, 'Bio'],
    [CONTENT_TYPES.ANY_LIST, { Skills: ['TypeScript'] }, 'TypeScript'],
  ])('renders the matching macro for %s', (contentType, content, text) => {
    const { getByText } = render(
      <AllProviders>
        <MacroItem {...item(contentType, content)} />
      </AllProviders>,
    );

    expect(getByText(new RegExp(text))).not.toBeNull();
  });

  it('throws for an unsupported content type', () => {
    expect(() =>
      render(
        <AllProviders>
          <MacroItem {...item('UNKNOWN', {})} />
        </AllProviders>,
      ),
    ).toThrow(/Unsupported contentType/);
  });
});
