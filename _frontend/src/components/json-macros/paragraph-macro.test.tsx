import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentParagraph } from '@/types/content-paragraph';

import ParagraphMacro from './paragraph-macro';

const props = {
  contentId: 'p1',
  contentType: CONTENT_TYPES.PARAGRAPH,
  content: { paragraph: 'A short bio.' },
  layoutId: 'a',
  layoutType: 'SINGLE',
} as unknown as ContentParagraph;

describe('ParagraphMacro', () => {
  it('renders the paragraph text', () => {
    const { getByText } = render(
      <AllProviders>
        <ParagraphMacro {...props} />
      </AllProviders>,
    );

    expect(getByText('A short bio.')).not.toBeNull();
  });
});
