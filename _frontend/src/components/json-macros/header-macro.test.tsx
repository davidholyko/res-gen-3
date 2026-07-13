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
});
