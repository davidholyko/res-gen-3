import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentId } from '@/types/content-base-item';

import ExperienceEditor from './experience-editor';

describe('ExperienceEditor', () => {
  it('renders form fields defaulting to the example experience, not a JSON textarea', () => {
    const { container } = render(
      <AllProviders>
        <ExperienceEditor />
      </AllProviders>,
    );

    expect(container.querySelector('textarea')).toBeNull();
    const company = container.querySelector(
      'input[name="company"]',
    ) as HTMLInputElement;
    expect(company.value).not.toBe('');
  });

  it('renders provided content instead of the example, including its list rows', () => {
    const { container, getByLabelText } = render(
      <AllProviders>
        <ExperienceEditor
          contentId={'c1' as ContentId}
          contentType={CONTENT_TYPES.EXPERIENCE}
          content={{
            company: 'Acme',
            title: 'Engineer',
            tags: ['Robotics'],
            descriptions: ['Built the anvil pipeline'],
          }}
        />
      </AllProviders>,
    );

    expect(
      (container.querySelector('input[name="company"]') as HTMLInputElement)
        .value,
    ).toBe('Acme');
    expect((getByLabelText('Descriptions 1') as HTMLInputElement).value).toBe(
      'Built the anvil pipeline',
    );
  });

  it('shows an inline error under just the cleared required field', () => {
    const { container } = render(
      <AllProviders>
        <ExperienceEditor
          contentId={'c1' as ContentId}
          contentType={CONTENT_TYPES.EXPERIENCE}
          content={{ company: 'Acme', title: 'Engineer' }}
        />
      </AllProviders>,
    );
    const company = container.querySelector(
      'input[name="company"]',
    ) as HTMLInputElement;

    fireEvent.change(company, { target: { value: '' } });

    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].textContent).toMatch(/company is required/i);
    expect(container.querySelector('input[name="title"]')).toHaveAttribute(
      'aria-invalid',
      'false',
    );
  });
});
