import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { AllProviders } from '@/test-providers';

import LayoutDouble from './layout-double';

describe('LayoutDouble', () => {
  it('renders two LayoutSingle drop zones tagged with the parent layout id', () => {
    const { container } = render(
      <AllProviders>
        <LayoutDouble
          layoutId="a"
          layoutLeftId="l"
          layoutRightId="r"
          addLayoutIndex={1}
        />
      </AllProviders>,
    );

    const wrapper = container.querySelector('[data-layout-id="a"]');
    expect(wrapper?.querySelector('.layout-double')).not.toBeNull();
    expect(wrapper?.querySelectorAll('.layout-single')).toHaveLength(2);
  });

  it('separates the two columns with a single hairline divider', () => {
    const { container } = render(
      <AllProviders>
        <LayoutDouble
          layoutId="a"
          layoutLeftId="l"
          layoutRightId="r"
          addLayoutIndex={1}
        />
      </AllProviders>,
    );

    expect(container.querySelector('.layout-double')).toHaveClass('divide-x');
  });

  it('carries one "+ Add layout" for the whole layout, not one per half', () => {
    const { getAllByText } = render(
      <AllProviders>
        <LayoutDouble
          layoutId="a"
          layoutLeftId="l"
          layoutRightId="r"
          addLayoutIndex={1}
        />
      </AllProviders>,
    );

    expect(getAllByText('+ Add layout')).toHaveLength(1);
    expect(getAllByText('+ Add block')).toHaveLength(2);
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(
      <AllProviders>
        <LayoutDouble
          layoutId="a"
          layoutLeftId="l"
          layoutRightId="r"
          addLayoutIndex={1}
        />
      </AllProviders>,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
