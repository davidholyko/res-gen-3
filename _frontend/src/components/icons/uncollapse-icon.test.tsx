import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import UncollapseIcon from './uncollapse-icon';

describe('UncollapseIcon', () => {
  it('renders an svg', () => {
    const { container } = render(<UncollapseIcon />);

    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<UncollapseIcon />);

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  });
});
