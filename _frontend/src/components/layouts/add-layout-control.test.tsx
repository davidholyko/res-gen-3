import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LAYOUTS } from '@/constants';

const { addLayoutAtMock } = vi.hoisted(() => ({ addLayoutAtMock: vi.fn() }));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({ addLayoutAt: addLayoutAtMock }),
  };
});

const { default: AddLayoutControl } = await import('./add-layout-control');

beforeEach(() => {
  addLayoutAtMock.mockReset();
});

describe('AddLayoutControl', () => {
  it('renders a closed "+ Add layout" trigger and no menu initially', () => {
    const { getByText, queryByRole } = render(
      <AddLayoutControl insertIndex={1} />,
    );

    expect(getByText('+ Add layout')).toHaveAttribute('aria-expanded', 'false');
    expect(queryByRole('menu')).toBeNull();
  });

  it('inserts a one-column layout directly below its host layout', () => {
    const { getByText, queryByRole } = render(
      <AddLayoutControl insertIndex={2} />,
    );

    fireEvent.click(getByText('+ Add layout'));
    fireEvent.click(getByText('One column'));

    expect(addLayoutAtMock).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutType: LAYOUTS.SINGLE,
        layoutId: expect.any(String),
      }),
      2,
    );
    expect(queryByRole('menu')).toBeNull();
  });

  it('inserts a two-column layout with distinct left/right zone ids', () => {
    const { getByText } = render(<AddLayoutControl insertIndex={1} />);

    fireEvent.click(getByText('+ Add layout'));
    fireEvent.click(getByText('Two columns'));

    expect(addLayoutAtMock).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutType: LAYOUTS.DOUBLE,
        layoutLeftId: expect.any(String),
        layoutRightId: expect.any(String),
      }),
      1,
    );
    const [layout] = addLayoutAtMock.mock.calls[0];
    expect(layout.layoutLeftId).not.toBe(layout.layoutRightId);
  });

  it('closes on Escape and on an outside click, and supports arrow-key movement', () => {
    const { getByText, getByRole, queryByRole } = render(
      <AddLayoutControl insertIndex={1} />,
    );

    fireEvent.click(getByText('+ Add layout'));
    const menu = getByRole('menu');

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement?.textContent).toBe('One column');
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement?.textContent).toBe('Two columns');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(queryByRole('menu')).toBeNull();

    fireEvent.click(getByText('+ Add layout'));
    fireEvent.mouseDown(document.body);
    expect(queryByRole('menu')).toBeNull();
  });

  it('has no automatically detectable accessibility violations, closed and open', async () => {
    const { container, getByText } = render(
      <AddLayoutControl insertIndex={1} />,
    );
    expect((await axe.run(container)).violations).toEqual([]);

    fireEvent.click(getByText('+ Add layout'));
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
