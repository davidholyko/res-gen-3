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
  it('opens the restructure view when clicked', () => {
    const { getByText } = render(<RestructureButton />);
    fireEvent.click(getByText('Restructure'));
    expect(toggleRestructure).toHaveBeenCalledWith(true);
  });

  it('renders nothing while the restructure view is already open', () => {
    contextState.isRestructuring = true;
    const { container } = render(<RestructureButton />);
    expect(container).toBeEmptyDOMElement();
  });
});
