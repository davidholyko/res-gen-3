import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import PlusIcon from './plus-icon';

describe('PlusIcon', () => {
  it('renders an svg', () => {
    const { container } = render(<PlusIcon />);

    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<PlusIcon />);

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  });
});
