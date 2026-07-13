import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import ArrowUpIcon from './arrow-up-icon';

describe('ArrowUpIcon', () => {
  it('renders an svg with the given className', () => {
    const { container } = render(<ArrowUpIcon className="m-1" />);
    const svg = container.querySelector('svg');

    expect(svg).not.toBeNull();
    expect(svg).toHaveClass('m-1');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<ArrowUpIcon className="" />);

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  });
});
