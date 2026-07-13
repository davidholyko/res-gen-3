import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentExperience } from '@/types/content-experience';

import ExperienceMacro from './experience-macro';

function makeProps(content: Record<string, unknown>) {
  return {
    contentId: 'e1',
    contentType: CONTENT_TYPES.EXPERIENCE,
    content,
    layoutId: 'a',
    layoutType: 'SINGLE',
  } as unknown as ContentExperience;
}

describe('ExperienceMacro', () => {
  it('renders location, tags, and descriptions when present', () => {
    const { getByText, container } = render(
      <AllProviders>
        <ExperienceMacro
          {...makeProps({
            company: 'Acme',
            title: 'Engineer',
            location: 'Remote',
            dates: '2020 - 2022',
            tags: ['TypeScript', 'React'],
            descriptions: ['Shipped things', 'Fixed things'],
          })}
        />
      </AllProviders>,
    );

    expect(getByText('Acme')).not.toBeNull();
    expect(getByText('Engineer')).not.toBeNull();
    expect(getByText('Remote')).not.toBeNull();
    expect(getByText('TypeScript')).not.toBeNull();
    expect(getByText('React')).not.toBeNull();
    expect(getByText('Shipped things')).not.toBeNull();
    expect(getByText('Fixed things')).not.toBeNull();
    expect(container.querySelector('ul')).not.toBeNull();
  });

  it('omits location, tags, and descriptions when absent', () => {
    const { container, queryByText } = render(
      <AllProviders>
        <ExperienceMacro
          {...makeProps({ company: 'Acme', title: 'Engineer' })}
        />
      </AllProviders>,
    );

    expect(queryByText('Acme')).not.toBeNull();
    // company, dates (empty), and title are unconditional; `location`'s <p>
    // is the only one gated by a truthy check, so it's the only one missing.
    expect(container.querySelectorAll('p').length).toBe(3);
    expect(container.querySelector('.bg-black')).toBeNull();
    expect(container.querySelector('ul')).toBeNull();
  });
});
