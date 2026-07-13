import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AllProviders } from '@/test-providers';

import ViewMenu from './control-panel-view-menu';

describe('ViewMenu', () => {
  it('opens to reveal the view actions', () => {
    const { getByText } = render(
      <AllProviders>
        <ViewMenu />
      </AllProviders>,
    );

    fireEvent.click(getByText('View'));

    expect(getByText('Open PDF View')).not.toBeNull();
    expect(getByText('Toggle Editor')).not.toBeNull();
  });
});
