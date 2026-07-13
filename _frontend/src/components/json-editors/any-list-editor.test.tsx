import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentId } from '@/types/content-base-item';

import AnyListEditor from './any-list-editor';

describe('AnyListEditor', () => {
  it('defaults to the example any-list JSON when no content is given', () => {
    const { container } = render(
      <AllProviders>
        <AnyListEditor />
      </AllProviders>,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(JSON.parse(textarea.value)).toHaveProperty('Gears');
  });

  it('renders provided content instead of the example', () => {
    const { container } = render(
      <AllProviders>
        <AnyListEditor
          contentId={'c1' as ContentId}
          contentType={CONTENT_TYPES.ANY_LIST}
          content={{ Skills: ['TypeScript', 'React'] }}
        />
      </AllProviders>,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(JSON.parse(textarea.value)).toEqual({
      Skills: ['TypeScript', 'React'],
    });
  });
});
