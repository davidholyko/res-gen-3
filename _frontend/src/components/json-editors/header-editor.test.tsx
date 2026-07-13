import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentId } from '@/types/content-base-item';

import HeaderEditor from './header-editor';

describe('HeaderEditor', () => {
  it('defaults to the example header JSON when no content is given', () => {
    const { container } = render(
      <AllProviders>
        <HeaderEditor />
      </AllProviders>,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(JSON.parse(textarea.value)).toHaveProperty('header');
  });

  it('renders provided content instead of the example', () => {
    const { container } = render(
      <AllProviders>
        <HeaderEditor
          contentId={'c1' as ContentId}
          contentType={CONTENT_TYPES.HEADER}
          content={{ header: 'Professional Summary' }}
        />
      </AllProviders>,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(JSON.parse(textarea.value)).toEqual({
      header: 'Professional Summary',
    });
  });
});
