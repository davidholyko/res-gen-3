import { render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';

import LayoutSingle from './layout-single';

function seedLocalStorage() {
  window.localStorage.setItem(
    'res-gen-data',
    JSON.stringify({
      items: [
        {
          contentId: 'a',
          contentType: CONTENT_TYPES.CONTACT,
          content: { name: 'In layout' },
          layoutId: 'this-layout',
          layoutType: 'SINGLE',
        },
        {
          contentId: 'b',
          contentType: CONTENT_TYPES.CONTACT,
          content: { name: 'Other layout' },
          layoutId: 'other-layout',
          layoutType: 'SINGLE',
        },
      ],
      layouts: [{ layoutId: 'this-layout', layoutType: 'SINGLE' }],
    }),
  );
}

afterEach(() => {
  window.localStorage.clear();
});

// Not a drop target anymore: dragging content from the Template ribbon
// retired with the ribbon (specs/editor-redesign.md, Phase 6) -- the
// zone's own AddBlockControl is the add path.
describe('LayoutSingle', () => {
  it('renders only items belonging to this layout', () => {
    seedLocalStorage();
    const { getByText, queryByText } = render(
      <AllProviders>
        <LayoutSingle layoutType="SINGLE" layoutId="this-layout" />
      </AllProviders>,
    );

    expect(getByText('In layout')).not.toBeNull();
    expect(queryByText('Other layout')).toBeNull();
  });

  it('carries its own "+ Add block" control', () => {
    seedLocalStorage();
    const { getByText } = render(
      <AllProviders>
        <LayoutSingle layoutType="SINGLE" layoutId="this-layout" />
      </AllProviders>,
    );

    expect(getByText('+ Add block')).not.toBeNull();
  });

  it('has no automatically detectable accessibility violations', async () => {
    seedLocalStorage();
    const { container } = render(
      <AllProviders>
        <LayoutSingle layoutType="SINGLE" layoutId="this-layout" />
      </AllProviders>,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
