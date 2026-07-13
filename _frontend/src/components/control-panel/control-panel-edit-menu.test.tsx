import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AllProviders } from '@/test-providers';

import EditMenu from './control-panel-edit-menu';

describe('EditMenu', () => {
  it('opens to reveal the layout edit actions', () => {
    const { getByText } = render(
      <AllProviders>
        <EditMenu />
      </AllProviders>,
    );

    fireEvent.click(getByText('Edit'));

    expect(getByText('Add Single Column Layout')).not.toBeNull();
    expect(getByText('Add Double Column Layout')).not.toBeNull();
    expect(getByText('Remove Last Layout')).not.toBeNull();
  });
});
