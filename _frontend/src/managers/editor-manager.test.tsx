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

    // All 5 content types render generated form fields now
    // (specs/editor-redesign.md, Phases 1/3/4/5) -- the only remaining
    // <textarea> is Paragraph's, a `textarea` field kind driven by form
    // state, not the raw-JSON editor.
    expect(container.querySelectorAll('textarea')).toHaveLength(1);
    expect(container.querySelectorAll('input[name="header"]')).toHaveLength(1);
    expect(container.querySelectorAll('input[name="name"]')).toHaveLength(1);
    expect(container.querySelectorAll('input[name="company"]')).toHaveLength(1);
    expect(
      container.querySelectorAll('[aria-label="Group 1 name"]'),
    ).toHaveLength(1);
  });

  it('shows a "Template" heading to distinguish it from a focused block\'s inline editor', () => {
    seedLocalStorage(true);
    const { getByText } = render(
      <AllProviders>
        <EditorManager />
      </AllProviders>,
    );

    expect(getByText('Template')).not.toBeNull();
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
