import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CONTENT_TYPES, LAYOUTS } from '@/constants';

const { onCreateMock } = vi.hoisted(() => ({ onCreateMock: vi.fn() }));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({ onCreate: onCreateMock }),
  };
});

const { default: AddBlockControl } = await import('./add-block-control');

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    layoutId: 'l1',
    layoutType: LAYOUTS.SINGLE,
    layoutParentId: null,
    ...overrides,
  };
}

beforeEach(() => {
  onCreateMock.mockReset();
});

describe('AddBlockControl', () => {
  it('renders a closed "+ Add block" trigger and no menu initially', () => {
    const { getByText, queryByRole } = render(
      <AddBlockControl {...baseProps()} />,
    );

    expect(getByText('+ Add block')).toHaveAttribute('aria-expanded', 'false');
    expect(queryByRole('menu')).toBeNull();
  });

  it('lists all five content types in plain language, not internal names', () => {
    const { getByText, getByRole, queryByText } = render(
      <AddBlockControl {...baseProps()} />,
    );

    fireEvent.click(getByText('+ Add block'));

    expect(getByRole('menu')).not.toBeNull();
    for (const label of [
      'Contact details',
      'Section heading',
      'Paragraph',
      'Experience',
      'Custom list',
    ]) {
      expect(getByText(label)).not.toBeNull();
    }
    expect(queryByText('AnyList')).toBeNull();
  });

  it('creates a blank block of the picked type in this zone and closes the menu', () => {
    const { getByText, queryByRole } = render(
      <AddBlockControl
        {...baseProps({
          layoutType: LAYOUTS.DOUBLE_LEFT,
          layoutParentId: 'p1',
        })}
      />,
    );

    fireEvent.click(getByText('+ Add block'));
    fireEvent.click(getByText('Section heading'));

    expect(onCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: CONTENT_TYPES.HEADER,
        content: { header: '' },
        layoutId: 'l1',
        layoutType: LAYOUTS.DOUBLE_LEFT,
        layoutParentId: 'p1',
      }),
    );
    expect(queryByRole('menu')).toBeNull();
  });

  it('creates blank contact content with its required keys present but empty', () => {
    const { getByText } = render(<AddBlockControl {...baseProps()} />);

    fireEvent.click(getByText('+ Add block'));
    fireEvent.click(getByText('Contact details'));

    expect(onCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: CONTENT_TYPES.CONTACT,
        content: { name: '', email: '' },
        layoutParentId: undefined,
      }),
    );
  });

  it('hands each pick a fresh copy of the blank content, not a shared object', () => {
    const { getByText } = render(<AddBlockControl {...baseProps()} />);

    fireEvent.click(getByText('+ Add block'));
    fireEvent.click(getByText('Custom list'));
    fireEvent.click(getByText('+ Add block'));
    fireEvent.click(getByText('Custom list'));

    const first = onCreateMock.mock.calls[0][0].content;
    const second = onCreateMock.mock.calls[1][0].content;
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it('closes on Escape and on an outside click', () => {
    const { getByText, queryByRole } = render(
      <AddBlockControl {...baseProps()} />,
    );

    fireEvent.click(getByText('+ Add block'));
    expect(queryByRole('menu')).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(queryByRole('menu')).toBeNull();

    fireEvent.click(getByText('+ Add block'));
    expect(queryByRole('menu')).not.toBeNull();
    fireEvent.mouseDown(document.body);
    expect(queryByRole('menu')).toBeNull();
  });

  it('moves focus through the menu items with ArrowDown/ArrowUp, wrapping', () => {
    const { getByText, getByRole } = render(
      <AddBlockControl {...baseProps()} />,
    );
    fireEvent.click(getByText('+ Add block'));
    const menu = getByRole('menu');

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement?.textContent).toBe('Contact details');

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement?.textContent).toBe('Custom list');

    // Other keys leave focus alone.
    fireEvent.keyDown(menu, { key: 'a' });
    expect(document.activeElement?.textContent).toBe('Custom list');
  });

  it('has no automatically detectable accessibility violations, closed and open', async () => {
    const { container, getByText } = render(
      <AddBlockControl {...baseProps()} />,
    );
    expect((await axe.run(container)).violations).toEqual([]);

    fireEvent.click(getByText('+ Add block'));
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
