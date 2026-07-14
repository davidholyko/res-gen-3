import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentId } from '@/types/content-base-item';

import HeaderEditor from './header-editor';

describe('HeaderEditor', () => {
  it('renders the provided content in its form field', () => {
    const { container } = render(
      <AllProviders>
        <HeaderEditor
          contentId={'c1' as ContentId}
          contentType={CONTENT_TYPES.HEADER}
          content={{ header: 'Professional Summary' }}
        />
      </AllProviders>,
    );
    const input = container.querySelector(
      'input[name="header"]',
    ) as HTMLInputElement;

    expect(input.value).toBe('Professional Summary');
  });
});
