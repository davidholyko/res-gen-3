import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { AllProviders } from '@/test-providers';

import LayoutDouble from './layout-double';

describe('LayoutDouble', () => {
  it('renders two LayoutSingle zones tagged with the parent layout id', () => {
    const { container } = render(
      <AllProviders>
        <LayoutDouble layoutId="a" layoutLeftId="l" layoutRightId="r" />
      </AllProviders>,
    );

    const wrapper = container.querySelector('[data-layout-id="a"]');
    expect(wrapper?.querySelector('.layout-double')).not.toBeNull();
    expect(wrapper?.querySelectorAll('.layout-single')).toHaveLength(2);
  });

  it('separates the two columns with a single hairline divider', () => {
    const { container } = render(
      <AllProviders>
        <LayoutDouble layoutId="a" layoutLeftId="l" layoutRightId="r" />
      </AllProviders>,
    );

    expect(container.querySelector('.layout-double')).toHaveClass('divide-x');
  });

  it('renders no add controls (those live in the restructure view now)', () => {
    const { queryByText } = render(
      <AllProviders>
        <LayoutDouble layoutId="a" layoutLeftId="l" layoutRightId="r" />
      </AllProviders>,
    );

    expect(queryByText('+ Add layout')).toBeNull();
    expect(queryByText('+ Add block')).toBeNull();
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(
      <AllProviders>
        <LayoutDouble layoutId="a" layoutLeftId="l" layoutRightId="r" />
      </AllProviders>,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
