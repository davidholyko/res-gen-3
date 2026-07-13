import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentId } from '@/types/content-base-item';

import ParagraphEditor from './paragraph-editor';

describe('ParagraphEditor', () => {
  it('defaults to the example paragraph JSON when no content is given', () => {
    const { container } = render(
      <AllProviders>
        <ParagraphEditor />
      </AllProviders>,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(JSON.parse(textarea.value)).toHaveProperty('paragraph');
  });

  it('renders provided content instead of the example', () => {
    const { container } = render(
      <AllProviders>
        <ParagraphEditor
          contentId={'c1' as ContentId}
          contentType={CONTENT_TYPES.PARAGRAPH}
          content={{ paragraph: 'A short bio.' }}
        />
      </AllProviders>,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(JSON.parse(textarea.value)).toEqual({
      paragraph: 'A short bio.',
    });
  });
});
