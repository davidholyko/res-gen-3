import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import DeleteIcon from './delete-icon';

describe('DeleteIcon', () => {
  it('renders an svg', () => {
    const { container } = render(<DeleteIcon />);

    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<DeleteIcon />);

    const results = await axe.run(container);

    expect(results.violations).toEqual([]);
  });
});
