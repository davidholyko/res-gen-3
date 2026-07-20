import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LayoutHeader from './layout-header';

// Presentational: LayoutManager owns the confirm state and the actual
// removal (so the confirm can also highlight the preview region). These
// props stand in for that wiring.
const handlers = {
  onRequestRemove: vi.fn(),
  onCancelRemove: vi.fn(),
  onConfirmRemove: vi.fn(),
};

beforeEach(() => {
  handlers.onRequestRemove.mockReset();
  handlers.onCancelRemove.mockReset();
  handlers.onConfirmRemove.mockReset();
});

describe('LayoutHeader', () => {
  it('renders the label when idle', () => {
    const { getByText } = render(
      <LayoutHeader label="Layout 1" isConfirming={false} {...handlers} />,
    );

    expect(getByText('Layout 1')).not.toBeNull();
  });

  it('first "Remove layout" click only requests confirmation, it does not delete', () => {
    const { getByLabelText, queryByLabelText } = render(
      <LayoutHeader label="Layout 1" isConfirming={false} {...handlers} />,
    );

    fireEvent.click(getByLabelText('Remove Layout 1 Button'));

    expect(handlers.onRequestRemove).toHaveBeenCalledTimes(1);
    // Nothing destructive on this click, and no confirm UI yet -- that
    // only appears once the parent flips isConfirming.
    expect(handlers.onConfirmRemove).not.toHaveBeenCalled();
    expect(queryByLabelText('Confirm removing Layout 1 Button')).toBeNull();
  });

  it('while confirming, shows Cancel/Delete and wires them to the parent', () => {
    const { getByLabelText, getByText, queryByLabelText } = render(
      <LayoutHeader label="Layout 1" isConfirming={true} {...handlers} />,
    );

    expect(getByText('Delete Layout 1?')).not.toBeNull();
    // The idle "Remove layout" affordance is replaced by the confirm.
    expect(queryByLabelText('Remove Layout 1 Button')).toBeNull();

    fireEvent.click(getByLabelText('Cancel removing Layout 1'));
    expect(handlers.onCancelRemove).toHaveBeenCalledTimes(1);

    fireEvent.click(getByLabelText('Confirm removing Layout 1 Button'));
    expect(handlers.onConfirmRemove).toHaveBeenCalledTimes(1);
  });

  it('is a hidden-until-revealed absolute overlay above the layout when idle, forced visible while confirming', () => {
    const { container, rerender } = render(
      <LayoutHeader label="Layout 1" isConfirming={false} {...handlers} />,
    );

    // Absolute overlay pinned above the layout (bottom-full) so it floats
    // in the gap above the content, not over it; invisible + click-through
    // by default so the idle page shows only content, and hover/focus of
    // the wrapping layout reveals it. It sits in the page column, not the
    // (clip-prone) left gutter.
    expect(container.firstElementChild).toHaveClass(
      'absolute',
      'bottom-full',
      'opacity-0',
      'pointer-events-none',
      'group-hover:opacity-100',
      'group-focus-within:opacity-100',
    );

    // While confirming it stays visible so the Cancel/Delete choice can't
    // slip away when the pointer leaves.
    rerender(
      <LayoutHeader label="Layout 1" isConfirming={true} {...handlers} />,
    );
    expect(container.firstElementChild).toHaveClass('opacity-100');
    expect(container.firstElementChild).not.toHaveClass('opacity-0');
  });

  it('has no automatically detectable accessibility violations (idle or confirming)', async () => {
    const idle = render(
      <LayoutHeader label="Layout 1" isConfirming={false} {...handlers} />,
    );
    expect((await axe.run(idle.container)).violations).toEqual([]);

    const confirming = render(
      <LayoutHeader label="Layout 1" isConfirming={true} {...handlers} />,
    );
    expect((await axe.run(confirming.container)).violations).toEqual([]);
  });
});
