import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentId } from '@/types/content-base-item';

import ExperienceEditor from './experience-editor';

describe('ExperienceEditor', () => {
  it('defaults to the example experience JSON when no content is given', () => {
    const { container } = render(
      <AllProviders>
        <ExperienceEditor />
      </AllProviders>,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(JSON.parse(textarea.value)).toHaveProperty('company');
  });

  it('renders provided content instead of the example', () => {
    const { container } = render(
      <AllProviders>
        <ExperienceEditor
          contentId={'c1' as ContentId}
          contentType={CONTENT_TYPES.EXPERIENCE}
          content={{ company: 'Acme', title: 'Engineer' }}
        />
      </AllProviders>,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(JSON.parse(textarea.value)).toEqual({
      company: 'Acme',
      title: 'Engineer',
    });
  });
});
