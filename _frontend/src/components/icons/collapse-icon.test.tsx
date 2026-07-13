import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import CollapseIcon from './collapse-icon';

describe('CollapseIcon', () => {
  it('renders an svg', () => {
    const { container } = render(<CollapseIcon />);

    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<CollapseIcon />);

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  });
});
