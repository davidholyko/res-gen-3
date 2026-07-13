import { fireEvent, render } from '@testing-library/react';
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

  it('validates successfully with only the required fields present', () => {
    // Regression: the optional fields used to be typed as
    // `union([string(), undefined()])`, which zod v4 treats as "the key
    // must be present, even if its value is undefined" -- not the same as
    // `.optional()`, which allows the key to be missing entirely. Editing
    // a contact down to just name/email (a completely ordinary edit)
    // failed validation until the schema was fixed to use `.optional()`.
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

    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify({
          name: 'Grace Hopper',
          email: 'grace@example.com',
        }),
      },
    });

    expect(container.querySelector('p')).toBeNull();
  });

  it('validates a website field instead of leaving it unrecognized', () => {
    // Regression: `website` is part of `ContactJsonOptional` and present
    // in every example payload, but was missing from the schema's shape
    // entirely, so a malformed website value went completely unvalidated
    // (BaseEditor saves the raw parsed JSON regardless of what the schema
    // recognizes, so this never dropped the field -- just never checked it).
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

    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify({
          name: 'Grace Hopper',
          email: 'grace@example.com',
          website: 'gracehopper.dev',
        }),
      },
    });

    expect(container.querySelector('p')).toBeNull();
  });

  it('rejects a website field of the wrong type', () => {
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

    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify({
          name: 'Grace Hopper',
          email: 'grace@example.com',
          website: 12345,
        }),
      },
    });

    expect(container.querySelector('p')).not.toBeNull();
  });
});
