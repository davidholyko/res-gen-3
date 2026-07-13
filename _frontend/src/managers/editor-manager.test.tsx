import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AllProviders } from '@/test-providers';

import EditorManager from './editor-manager';

function seedLocalStorage(isEditorVisible: boolean) {
  window.localStorage.setItem(
    'res-gen-data',
    JSON.stringify({
      items: [{ contentId: 'a' }],
      layouts: [{ layoutId: 'a' }],
      isEditorVisible,
    }),
  );
}

afterEach(() => {
  window.localStorage.clear();
});

describe('EditorManager', () => {
  it('renders one editor per content type', () => {
    seedLocalStorage(true);
    const { container } = render(
      <AllProviders>
        <EditorManager />
      </AllProviders>,
    );

    expect(container.querySelectorAll('textarea')).toHaveLength(5);
  });

  it('is hidden when isEditorVisible is true (inverted class name)', () => {
    seedLocalStorage(true);
    const { container } = render(
      <AllProviders>
        <EditorManager />
      </AllProviders>,
    );

    expect(container.querySelector('#editor-manager')).toHaveClass('hidden');
  });

  it('is visible when isEditorVisible is false', () => {
    seedLocalStorage(false);
    const { container } = render(
      <AllProviders>
        <EditorManager />
      </AllProviders>,
    );

    expect(container.querySelector('#editor-manager')).not.toHaveClass(
      'hidden',
    );
  });
});
