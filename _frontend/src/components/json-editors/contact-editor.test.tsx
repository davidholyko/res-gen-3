import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentId } from '@/types/content-base-item';

import ContactEditor from './contact-editor';

describe('ContactEditor', () => {
  it('defaults to the example contact JSON when no content is given', () => {
    const { container } = render(
      <AllProviders>
        <ContactEditor />
      </AllProviders>,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(JSON.parse(textarea.value)).toHaveProperty('name');
  });

  it('renders provided content instead of the example', () => {
    const { container } = render(
      <AllProviders>
        <ContactEditor
          contentId={'c1' as ContentId}
          contentType={CONTENT_TYPES.CONTACT}
          content={{ name: 'Ada Lovelace', email: 'ada@example.com' }}
        />
      </AllProviders>,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(JSON.parse(textarea.value)).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
  });
});
