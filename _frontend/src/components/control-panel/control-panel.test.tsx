import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { AllProviders } from '@/test-providers';

import pkg from '../../../package.json';
import ControlPanel from './control-panel';

describe('ControlPanel', () => {
  it('renders the title, menus, and current version', () => {
    const { getByText } = render(
      <AllProviders>
        <ControlPanel />
      </AllProviders>,
    );

    expect(getByText('ResGen 2.0')).not.toBeNull();
    expect(getByText('File')).not.toBeNull();
    expect(getByText('Edit')).not.toBeNull();
    expect(getByText('View')).not.toBeNull();
    expect(getByText(`v${pkg.version}`)).not.toBeNull();
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(
      <AllProviders>
        <ControlPanel />
      </AllProviders>,
    );

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
