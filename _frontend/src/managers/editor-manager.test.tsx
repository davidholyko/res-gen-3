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

    // Contact/Experience/AnyList still render the raw-JSON textarea;
    // Header/Paragraph render a generated form field instead
    // (specs/editor-redesign.md, Phase 1) -- Header's is a single-line
    // `text` field (<input>), Paragraph's is a `textarea` field kind, so
    // it still renders a <textarea>, just driven by form state now.
    expect(container.querySelectorAll('textarea')).toHaveLength(4);
    expect(container.querySelectorAll('input[name="header"]')).toHaveLength(1);
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
