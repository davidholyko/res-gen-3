import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { toggleRestructureMock } = vi.hoisted(() => ({
  toggleRestructureMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({ toggleRestructure: toggleRestructureMock }),
  };
});

const { default: EmptyLayoutState } = await import('./empty-layout-state');

beforeEach(() => {
  toggleRestructureMock.mockReset();
});

describe('EmptyLayoutState', () => {
  it('renders guidance text', () => {
    const { getByText } = render(<EmptyLayoutState />);

    expect(getByText(/Your resume is empty\. Open Restructure/)).not.toBeNull();
  });

  it('opens the restructure view when the CTA is clicked', () => {
    const { getByText } = render(<EmptyLayoutState />);

    fireEvent.click(getByText('Restructure to build it'));

    expect(toggleRestructureMock).toHaveBeenCalledWith(true);
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<EmptyLayoutState />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
