import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AllProviders } from '@/test-providers';

import LayoutManager from './layout-manager';

function seedLocalStorage(layouts: unknown[]) {
  // localStorageUtil.isEmpty() (confusingly named -- true means "has data")
  // requires *both* items and layouts to be non-empty, or it falls back to
  // prepopulated example content instead of what's seeded here.
  window.localStorage.setItem(
    'res-gen-data',
    JSON.stringify({
      items: [{ contentId: 'placeholder' }],
      layouts,
      isEditorVisible: false,
    }),
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe('LayoutManager', () => {
  it('renders a LayoutSingle for a SINGLE layout', () => {
    seedLocalStorage([{ layoutId: 'a', layoutType: 'SINGLE' }]);
    const { container } = render(
      <AllProviders>
        <LayoutManager />
      </AllProviders>,
    );

    expect(container.querySelector('.layout-single')).not.toBeNull();
  });

  it('renders a LayoutDouble for a DOUBLE layout with both ids present', () => {
    seedLocalStorage([
      {
        layoutId: 'a',
        layoutType: 'DOUBLE',
        layoutLeftId: 'l',
        layoutRightId: 'r',
      },
    ]);
    const { container } = render(
      <AllProviders>
        <LayoutManager />
      </AllProviders>,
    );

    expect(container.querySelectorAll('.layout-single')).toHaveLength(2);
  });

  it('throws if a DOUBLE layout is missing layoutLeftId', () => {
    seedLocalStorage([
      { layoutId: 'a', layoutType: 'DOUBLE', layoutRightId: 'r' },
    ]);

    expect(() =>
      render(
        <AllProviders>
          <LayoutManager />
        </AllProviders>,
      ),
    ).toThrow("layout missing property 'layoutLeftId");
  });

  it('throws if a DOUBLE layout is missing layoutRightId', () => {
    seedLocalStorage([
      { layoutId: 'a', layoutType: 'DOUBLE', layoutLeftId: 'l' },
    ]);

    expect(() =>
      render(
        <AllProviders>
          <LayoutManager />
        </AllProviders>,
      ),
    ).toThrow("layout missing property 'layoutRightId");
  });

  it('throws for an unsupported layout type', () => {
    seedLocalStorage([{ layoutId: 'a', layoutType: 'TRIPLE' }]);

    expect(() =>
      render(
        <AllProviders>
          <LayoutManager />
        </AllProviders>,
      ),
    ).toThrow(/Unsupported layout/);
  });
});
