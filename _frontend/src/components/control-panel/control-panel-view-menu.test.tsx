import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AllProviders } from '@/test-providers';

import ViewMenu from './control-panel-view-menu';

describe('ViewMenu', () => {
  it('opens to reveal the view actions', () => {
    const { getByText, queryByText } = render(
      <AllProviders>
        <ViewMenu />
      </AllProviders>,
    );

    fireEvent.click(getByText('View'));

    expect(getByText('Open PDF View')).not.toBeNull();
    // "Toggle Editor" retired with the Template ribbon
    // (specs/editor-redesign.md, Phase 6).
    expect(queryByText('Toggle Editor')).toBeNull();
  });
});
