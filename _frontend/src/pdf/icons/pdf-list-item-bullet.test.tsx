import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ListItemBullet from './pdf-list-item-bullet';

describe('ListItemBullet', () => {
  it('renders an svg containing a circle, with default props', () => {
    const { container } = render(<ListItemBullet style={{}} />);

    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('circle')).not.toBeNull();
  });

  it('accepts an explicit debug flag and style overrides', () => {
    const { container } = render(
      <ListItemBullet debug style={{ width: 20 }} />,
    );

    expect(container.querySelector('svg')).not.toBeNull();
  });
});
