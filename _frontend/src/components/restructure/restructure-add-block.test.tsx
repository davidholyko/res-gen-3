import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';

import RestructureAddBlock from './restructure-add-block';

describe('RestructureAddBlock', () => {
  it('is closed until the trigger is clicked', () => {
    const { getByText, queryByRole } = render(
      <RestructureAddBlock onAdd={vi.fn()} />,
    );
    expect(queryByRole('menu')).toBeNull();
    fireEvent.click(getByText('+ Add block'));
    expect(queryByRole('menu')).not.toBeNull();
  });

  it('lists the plain-language block types and inserts the picked one', () => {
    const onAdd = vi.fn();
    const { getByText } = render(<RestructureAddBlock onAdd={onAdd} />);

    fireEvent.click(getByText('+ Add block'));
    fireEvent.click(getByText('Section heading'));

    expect(onAdd).toHaveBeenCalledWith('HEADER');
  });

  it('moves focus between items with the arrow keys', () => {
    const { getByText, getByRole, getAllByRole } = render(
      <RestructureAddBlock onAdd={vi.fn()} />,
    );
    fireEvent.click(getByText('+ Add block'));
    const menu = getByRole('menu');
    const items = getAllByRole('menuitem');
    items[0].focus();

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(items[0]);

    // A non-arrow key is ignored (focus stays put).
    fireEvent.keyDown(menu, { key: 'a' });
    expect(document.activeElement).toBe(items[0]);
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container, getByText } = render(
      <RestructureAddBlock onAdd={vi.fn()} />,
    );
    fireEvent.click(getByText('+ Add block'));
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
