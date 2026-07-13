import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addLayoutMock } = vi.hoisted(() => ({ addLayoutMock: vi.fn() }));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({ addLayout: addLayoutMock }),
  };
});

const { default: EmptyLayoutState } = await import('./empty-layout-state');

beforeEach(() => {
  addLayoutMock.mockReset();
});

describe('EmptyLayoutState', () => {
  it('renders guidance text', () => {
    const { getByText } = render(<EmptyLayoutState />);

    expect(getByText(/Your resume is empty\. Add a layout/)).not.toBeNull();
  });

  it('adds a SINGLE layout when the CTA is clicked', () => {
    const { getByText } = render(<EmptyLayoutState />);

    fireEvent.click(getByText('+ Add Single Column Layout'));

    expect(addLayoutMock).toHaveBeenCalledWith(
      expect.objectContaining({ layoutType: 'SINGLE' }),
    );
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<EmptyLayoutState />);

    expect((await axe.run(container)).violations).toEqual([]);
  });
});
