import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import BaseMenu from './control-panel-base-menu';

// React.Children.map (used by BaseMenu to clone each item) only sees
// distinct children when they're passed as direct siblings -- a single
// Fragment child would be treated as one opaque element instead of two.
function renderMenu() {
  return render(
    <BaseMenu name="File">
      <button type="button">Item One</button>
      <button type="button">Item Two</button>
    </BaseMenu>,
  );
}

function renderMenuWithChild(child: React.ReactNode) {
  return render(<BaseMenu name="File">{child}</BaseMenu>);
}

describe('BaseMenu', () => {
  it('is closed by default and opens on click', () => {
    const { container, getByText } = renderMenu();

    expect(container.querySelector('[role="menu"]')).toBeNull();

    fireEvent.click(getByText('File'));

    expect(container.querySelector('[role="menu"]')).not.toBeNull();
    expect(getByText('File')).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes again on a second click', () => {
    const { container, getByText } = renderMenu();

    fireEvent.click(getByText('File'));
    fireEvent.click(getByText('File'));

    expect(container.querySelector('[role="menu"]')).toBeNull();
  });

  it('opens on Enter and ignores other keys on the trigger', () => {
    const { container, getByText } = renderMenu();
    const trigger = getByText('File');

    fireEvent.keyDown(trigger, { key: 'a' });
    expect(container.querySelector('[role="menu"]')).toBeNull();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(container.querySelector('[role="menu"]')).not.toBeNull();
  });

  it('closes when clicking outside the menu', () => {
    const { container, getByText } = renderMenu();

    fireEvent.click(getByText('File'));
    expect(container.querySelector('[role="menu"]')).not.toBeNull();

    fireEvent.mouseDown(document.body);

    expect(container.querySelector('[role="menu"]')).toBeNull();
  });

  it('does nothing on an outside click while already closed', () => {
    const { container } = renderMenu();

    expect(() => fireEvent.mouseDown(document.body)).not.toThrow();
    expect(container.querySelector('[role="menu"]')).toBeNull();
  });

  it('closes on Escape', () => {
    const { container, getByText } = renderMenu();

    fireEvent.click(getByText('File'));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(container.querySelector('[role="menu"]')).toBeNull();
  });

  it('clones valid element children into focusable menu items', () => {
    const { getByText } = renderMenu();

    fireEvent.click(getByText('File'));
    const item = getByText('Item One');

    expect(item).toHaveAttribute('role', 'menuitem');
    expect(item).toHaveAttribute('tabindex', '0');
  });

  it('passes through non-element children untouched', () => {
    const { getByText } = renderMenuWithChild('plain text child');

    fireEvent.click(getByText('File'));

    expect(getByText('plain text child')).not.toBeNull();
  });

  it('moves focus between items with ArrowDown/ArrowUp, wrapping at the ends', () => {
    const { container, getByText } = renderMenu();

    fireEvent.click(getByText('File'));
    const menu = container.querySelector('[role="menu"]') as HTMLElement;
    const [itemOne, itemTwo] = Array.from(
      menu.querySelectorAll('.dropdown-item'),
    ) as HTMLElement[];

    itemOne.focus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(itemTwo);

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(itemOne);

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(itemTwo);
  });

  it('ignores other keys once the menu is open', () => {
    const { container, getByText } = renderMenu();

    fireEvent.click(getByText('File'));
    const menu = container.querySelector('[role="menu"]') as HTMLElement;

    expect(() => fireEvent.keyDown(menu, { key: 'a' })).not.toThrow();
  });

  it('has no automatically detectable accessibility violations, closed or open', async () => {
    const { container, getByText } = renderMenu();
    expect((await axe.run(container)).violations).toEqual([]);

    fireEvent.click(getByText('File'));
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
