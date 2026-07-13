import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AllProviders } from '@/test-providers';

import LayoutDouble from './layout-double';

describe('LayoutDouble', () => {
  it('renders two LayoutSingle drop zones tagged with the parent layout id', () => {
    const { container } = render(
      <AllProviders>
        <LayoutDouble layoutId="a" layoutLeftId="l" layoutRightId="r" />
      </AllProviders>,
    );

    const wrapper = container.querySelector('.layout-double');
    expect(wrapper).toHaveAttribute('data-layout-id', 'a');
    expect(wrapper?.querySelectorAll('.layout-single')).toHaveLength(2);
  });
});
