import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { toggleRestructure, contextState } = vi.hoisted(() => ({
  toggleRestructure: vi.fn(),
  contextState: { isRestructuring: false },
}));

vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      isRestructuring: contextState.isRestructuring,
      toggleRestructure,
    }),
  };
});

const { default: RestructureButton } = await import('./restructure-button');

beforeEach(() => {
  toggleRestructure.mockReset();
  contextState.isRestructuring = false;
});

describe('RestructureButton', () => {
  it('toggles the restructure view when clicked', () => {
    const { getByText } = render(<RestructureButton />);
    fireEvent.click(getByText('Restructure'));
    // No argument: the app context toggles the current value, so the
    // same button both opens and closes the view.
    expect(toggleRestructure).toHaveBeenCalledWith();
  });

  it('stays in the bar and reads as pressed while the view is open', () => {
    contextState.isRestructuring = true;
    const { getByText } = render(<RestructureButton />);
    const button = getByText('Restructure');
    expect(button).not.toBeNull();
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
