import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import DragHandleIcon from './drag-handle-icon';

describe('DragHandleIcon', () => {
  it('renders an svg with the given className', () => {
    const { container } = render(<DragHandleIcon className="m-1" />);
    const svg = container.querySelector('svg');

    expect(svg).not.toBeNull();
    expect(svg).toHaveClass('m-1');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<DragHandleIcon className="" />);

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  });
});
