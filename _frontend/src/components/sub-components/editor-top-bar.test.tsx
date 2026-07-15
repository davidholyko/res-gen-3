import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { EditorTopBar } from './editor-top-bar';

// The ribbon-card toolbar this used to be (drag handle, zone picker, add
// button, collapse toggle) retired with the Template ribbon
// (specs/editor-redesign.md, Phase 6) -- what's left is the focused
// block's editor header.
describe('EditorTopBar', () => {
  it('shows the block name with an "Editing" badge', () => {
    const { getByText } = render(
      <EditorTopBar formId="f1" label="Contact details" />,
    );

    expect(getByText('Contact details')).not.toBeNull();
    expect(getByText('Editing')).not.toBeNull();
  });

  it("points its label at the form's first field id", () => {
    const { getByText } = render(
      <EditorTopBar formId="f1" label="Contact details" />,
    );

    expect(getByText('Contact details').closest('label')).toHaveAttribute(
      'for',
      'editor-textarea-f1',
    );
  });

  it('has no automatically detectable accessibility violations', async () => {
    // The label's htmlFor points at the first field ContentForm renders
    // alongside this component; stand a matching input in for it so this
    // isolated render doesn't false-positive on a dangling reference.
    const { container } = render(
      <>
        <EditorTopBar formId="f1" label="Contact details" />
        <input id="editor-textarea-f1" aria-label="Name" />
      </>,
    );
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
