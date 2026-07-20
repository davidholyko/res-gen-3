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

// Display-only on the canvas now: adding blocks/layouts moved into the
// restructure view (specs/restructure-view.md), so LayoutSingle just
// renders its zone's content.
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

  it('draws a dashed drop-zone box only while empty', () => {
    seedLocalStorage();
    const { container } = render(
      <AllProviders>
        {/* A layout with content and an empty one side by side. */}
        <LayoutSingle layoutType="SINGLE" layoutId="this-layout" />
        <LayoutSingle layoutType="SINGLE" layoutId="empty-layout" />
      </AllProviders>,
    );

    const [filled, empty] = container.querySelectorAll('.layout-single');
    // Filled stays borderless so stacked layouts read as one continuous
    // page (specs/continuous-page-canvas.md); empty shows the dashed
    // "section to fill" box so it isn't mistaken for a blank page.
    expect(filled.className).not.toContain('border-dashed');
    expect(empty.className).toContain('border-dashed');
  });

  it('renders no add controls (those live in the restructure view now)', () => {
    seedLocalStorage();
    const { queryByText } = render(
      <AllProviders>
        <LayoutSingle layoutType="SINGLE" layoutId="this-layout" />
      </AllProviders>,
    );

    expect(queryByText('+ Add block')).toBeNull();
    expect(queryByText('+ Add layout')).toBeNull();
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
