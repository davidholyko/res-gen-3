import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AllProviders } from '@/test-providers';

import Main from './main';

function seedLocalStorage() {
  window.localStorage.setItem(
    'res-gen-data',
    JSON.stringify({
      items: [{ contentId: 'placeholder' }],
      layouts: [{ layoutId: 'a', layoutType: 'SINGLE' }],
    }),
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe('Main', () => {
  it('renders the editor manager and the layout manager', () => {
    seedLocalStorage();
    const { container } = render(
      <AllProviders>
        <Main />
      </AllProviders>,
    );

    expect(container.querySelector('.layout-single')).not.toBeNull();
  });
});
