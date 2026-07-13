import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentContact } from '@/types/content-contact';

import ContactMacro from './contact-macro';

function makeProps(content: Record<string, unknown>) {
  return {
    contentId: 'c1',
    contentType: CONTENT_TYPES.CONTACT,
    content,
    layoutId: 'a',
    layoutType: 'SINGLE',
  } as unknown as ContentContact;
}

describe('ContactMacro', () => {
  it('renders every optional field when present', () => {
    const { getByText } = render(
      <AllProviders>
        <ContactMacro
          {...makeProps({
            name: 'Ada Lovelace',
            title: 'Mathematician',
            phone: '555-0100',
            email: 'ada@example.com',
            linkedin: 'ada-lovelace',
            github: 'ada',
            website: 'ada.dev',
          })}
        />
      </AllProviders>,
    );

    expect(getByText('Ada Lovelace')).not.toBeNull();
    expect(getByText('Mathematician')).not.toBeNull();
    expect(getByText('555-0100')).not.toBeNull();
    expect(getByText('ada@example.com')).not.toBeNull();
    expect(getByText('ada-lovelace')).not.toBeNull();
    expect(getByText('ada')).not.toBeNull();
    expect(getByText('ada.dev')).not.toBeNull();
  });

  it('omits every optional field when absent', () => {
    const { queryByText, container } = render(
      <AllProviders>
        <ContactMacro {...makeProps({ name: 'Grace Hopper', email: '' })} />
      </AllProviders>,
    );

    // `email` is schema-required but the component still guards it with
    // `{email && ...}` (falsy edge case, e.g. an empty string) -- covers
    // the false branch alongside the other optional fields.
    expect(queryByText('Grace Hopper')).not.toBeNull();
    expect(container.querySelector('h4')).toBeNull();
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });
});
