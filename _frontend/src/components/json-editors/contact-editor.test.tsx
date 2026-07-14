import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentId } from '@/types/content-base-item';

import ContactEditor from './contact-editor';

describe('ContactEditor', () => {
  it('renders a labelled input per contact field, defaulting to the example contact', () => {
    const { container } = render(
      <AllProviders>
        <ContactEditor />
      </AllProviders>,
    );

    expect(container.querySelector('textarea')).toBeNull();
    const name = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    expect(name.value).not.toBe('');
    expect(container.querySelector('input[name="email"]')).not.toBeNull();
    expect(container.querySelector('input[name="website"]')).not.toBeNull();
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

    const name = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    const email = container.querySelector(
      'input[name="email"]',
    ) as HTMLInputElement;
    expect(name.value).toBe('Ada Lovelace');
    expect(email.value).toBe('ada@example.com');
  });

  it('leaves optional fields blank and error-free with only the required fields present', () => {
    // Successor to the `.optional()`-vs-`union([string(), undefined()])`
    // zod v4 regression test from the raw-JSON era: a contact holding
    // just name/email is a completely ordinary state and must not
    // produce validation errors when edited.
    const { container } = render(
      <AllProviders>
        <ContactEditor
          contentId={'c1' as ContentId}
          contentType={CONTENT_TYPES.CONTACT}
          content={{ name: 'Ada Lovelace', email: 'ada@example.com' }}
        />
      </AllProviders>,
    );
    const phone = container.querySelector(
      'input[name="phone"]',
    ) as HTMLInputElement;
    expect(phone.value).toBe('');

    fireEvent.change(phone, { target: { value: '555-0100' } });

    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('shows an inline error under just the email field for a malformed email', () => {
    const { container } = render(
      <AllProviders>
        <ContactEditor
          contentId={'c1' as ContentId}
          contentType={CONTENT_TYPES.CONTACT}
          content={{ name: 'Ada Lovelace', email: 'ada@example.com' }}
        />
      </AllProviders>,
    );
    const email = container.querySelector(
      'input[name="email"]',
    ) as HTMLInputElement;

    fireEvent.change(email, { target: { value: 'not-an-email' } });

    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].textContent).toMatch(/valid email/i);
    expect(email).toHaveAttribute('aria-invalid', 'true');
    // The untouched name field is not implicated.
    expect(container.querySelector('input[name="name"]')).toHaveAttribute(
      'aria-invalid',
      'false',
    );
  });

  it('shows an inline error when the required name is cleared, and clears it once refilled', () => {
    const { container } = render(
      <AllProviders>
        <ContactEditor
          contentId={'c1' as ContentId}
          contentType={CONTENT_TYPES.CONTACT}
          content={{ name: 'Ada Lovelace', email: 'ada@example.com' }}
        />
      </AllProviders>,
    );
    const name = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;

    fireEvent.change(name, { target: { value: '' } });
    expect(container.querySelector('[role="alert"]')?.textContent).toMatch(
      /required/i,
    );

    fireEvent.change(name, { target: { value: 'Grace Hopper' } });
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});
