import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES, EDITOR_MODES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentAll } from '@/types/content-all';

import EditorItem from './editor-item';

function item(contentType: string, content: Record<string, unknown>) {
  return {
    contentId: `${contentType}-1`,
    contentType,
    content,
    layoutId: 'a',
    layoutType: 'SINGLE',
    mode: EDITOR_MODES.IN_LAYOUT_MANAGER,
  } as unknown as ContentAll & { mode: keyof typeof EDITOR_MODES };
}

describe('EditorItem', () => {
  it.each([
    [CONTENT_TYPES.CONTACT, { name: 'Ada' }],
    [CONTENT_TYPES.HEADER, { header: 'Summary' }],
    [CONTENT_TYPES.EXPERIENCE, { company: 'Acme', title: 'Eng' }],
    [CONTENT_TYPES.PARAGRAPH, { paragraph: 'Bio' }],
    [CONTENT_TYPES.ANY_LIST, { list: ['a'] }],
  ])('renders the matching editor for %s', (contentType, content) => {
    const { container } = render(
      <AllProviders>
        <EditorItem {...item(contentType, content)} />
      </AllProviders>,
    );

    expect(container.querySelector('textarea')).not.toBeNull();
  });

  it('throws for an unsupported content type', () => {
    expect(() =>
      render(
        <AllProviders>
          <EditorItem {...item('UNKNOWN', {})} />
        </AllProviders>,
      ),
    ).toThrow(/Unsupported contentType/);
  });
});
