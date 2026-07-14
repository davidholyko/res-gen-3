import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentId } from '@/types/content-base-item';

import AnyListEditor from './any-list-editor';

describe('AnyListEditor', () => {
  it('renders the provided content as group form fields, not a JSON textarea', () => {
    const { container, getByLabelText } = render(
      <AllProviders>
        <AnyListEditor
          contentId={'c1' as ContentId}
          contentType={CONTENT_TYPES.ANY_LIST}
          content={{ Skills: ['TypeScript', 'React'] }}
        />
      </AllProviders>,
    );

    expect(container.querySelector('textarea')).toBeNull();
    expect((getByLabelText('Group 1 name') as HTMLInputElement).value).toBe(
      'Skills',
    );
    expect((getByLabelText('Group 1 entry 2') as HTMLInputElement).value).toBe(
      'React',
    );
  });
});
