import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentId } from '@/types/content-base-item';

import ParagraphEditor from './paragraph-editor';

describe('ParagraphEditor', () => {
  it('renders the provided content in its form field', () => {
    const { container } = render(
      <AllProviders>
        <ParagraphEditor
          contentId={'c1' as ContentId}
          contentType={CONTENT_TYPES.PARAGRAPH}
          content={{ paragraph: 'A short bio.' }}
        />
      </AllProviders>,
    );
    const textarea = container.querySelector(
      'textarea[name="paragraph"]',
    ) as HTMLTextAreaElement;

    expect(textarea.value).toBe('A short bio.');
  });
});
