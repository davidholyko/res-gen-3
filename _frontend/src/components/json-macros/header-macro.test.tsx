import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentHeader } from '@/types/content-header';

import HeaderMacro from './header-macro';

const props = {
  contentId: 'h1',
  contentType: CONTENT_TYPES.HEADER,
  content: { header: 'Professional Summary' },
  layoutId: 'a',
  layoutType: 'SINGLE',
} as unknown as ContentHeader;

describe('HeaderMacro', () => {
  it('renders the header text', () => {
    const { getByText } = render(
      <AllProviders>
        <HeaderMacro {...props} />
      </AllProviders>,
    );

    expect(getByText('Professional Summary')).not.toBeNull();
  });

  it('renders a placeholder instead of an empty <h2> while blank', () => {
    // A freshly added block starts empty (specs/editor-redesign.md,
    // Phase 6) -- an empty heading element is an axe violation.
    const { container, getByText } = render(
      <AllProviders>
        <HeaderMacro
          {...props}
          content={{ header: '' } as ContentHeader['content']}
        />
      </AllProviders>,
    );

    expect(container.querySelector('h2')).toBeNull();
    expect(getByText('Empty section heading')).not.toBeNull();
  });
});
