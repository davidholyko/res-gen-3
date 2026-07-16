import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import MoveIcon from './move-icon';

describe('MoveIcon', () => {
  it('renders an svg with the given className', () => {
    const { container } = render(<MoveIcon className="m-1" />);
    const svg = container.querySelector('svg');

    expect(svg).not.toBeNull();
    expect(svg).toHaveClass('m-1');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<MoveIcon className="" />);

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  });
});
