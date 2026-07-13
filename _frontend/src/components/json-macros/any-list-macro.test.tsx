import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentAnyList } from '@/types/content-any-list';

import AnyListMacro from './any-list-macro';

const props = {
  contentId: 'l1',
  contentType: CONTENT_TYPES.ANY_LIST,
  content: {
    Gears: ['Gear First', 'Gear Second'],
    Acquaintances: ['Shanks', 'Sabo'],
  },
  layoutId: 'a',
  layoutType: 'SINGLE',
} as unknown as ContentAnyList;

describe('AnyListMacro', () => {
  it('renders each key as a label with its values joined by commas', () => {
    const { getByText } = render(
      <AllProviders>
        <AnyListMacro {...props} />
      </AllProviders>,
    );

    expect(getByText('Gears:')).not.toBeNull();
    expect(getByText('Gear First, Gear Second')).not.toBeNull();
    expect(getByText('Acquaintances:')).not.toBeNull();
    expect(getByText('Shanks, Sabo')).not.toBeNull();
  });
});
