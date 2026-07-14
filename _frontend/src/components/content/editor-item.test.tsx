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
    // Every content type has a field spec now (specs/editor-redesign.md,
    // Phases 1/3/4/5) -- `text`-kind fields render as <input>s;
    // Paragraph's single field is the `textarea` kind, so its form field
    // is still a <textarea>, just driven by form state.
    [CONTENT_TYPES.CONTACT, { name: 'Ada' }, 'input'],
    [CONTENT_TYPES.HEADER, { header: 'Summary' }, 'input'],
    [CONTENT_TYPES.EXPERIENCE, { company: 'Acme', title: 'Eng' }, 'input'],
    [CONTENT_TYPES.PARAGRAPH, { paragraph: 'Bio' }, 'textarea'],
    [CONTENT_TYPES.ANY_LIST, { Skills: ['a'] }, 'input'],
  ] as const)(
    'renders the matching editor for %s',
    (contentType, content, tag) => {
      const { container } = render(
        <AllProviders>
          <EditorItem {...item(contentType, content)} />
        </AllProviders>,
      );

      expect(container.querySelector(tag)).not.toBeNull();
    },
  );

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
