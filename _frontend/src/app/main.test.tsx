import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AllProviders } from '@/test-providers';

import Main from './main';

function seedLocalStorage() {
  window.localStorage.setItem(
    'res-gen-data',
    JSON.stringify({
      items: [
        {
          contentId: 'h1',
          contentType: 'HEADER',
          content: { header: 'Summary' },
          layoutId: 'a',
          layoutType: 'SINGLE',
        },
      ],
      layouts: [{ layoutId: 'a', layoutType: 'SINGLE' }],
    }),
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe('Main', () => {
  it('renders the layout manager with a collapsed edit-panel gutter', () => {
    seedLocalStorage();
    const { container, getByTestId } = render(
      <AllProviders>
        <Main />
      </AllProviders>,
    );

    expect(container.querySelector('.layout-single')).not.toBeNull();
    expect(getByTestId('edit-panel-gutter')).not.toHaveClass('basis-[506px]');
  });

  it('opens the gutter when a block gains canvas focus', () => {
    seedLocalStorage();
    const { getByText, getByTestId } = render(
      <AllProviders>
        <Main />
      </AllProviders>,
    );

    fireEvent.click(getByText('Summary'));

    expect(getByTestId('edit-panel-gutter')).toHaveClass('basis-[506px]');
  });
});
