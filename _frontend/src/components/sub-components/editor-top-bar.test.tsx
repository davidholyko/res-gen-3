import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const DEFAULT_LAYOUTS = [
  { layoutId: 'l1', layoutType: 'SINGLE' },
  { layoutId: 'l2', layoutType: 'SINGLE' },
] as unknown[];

const { onCreateMock, contextState } = vi.hoisted(() => ({
  onCreateMock: vi.fn(),
  contextState: {
    layouts: [] as unknown[],
  },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      onCreate: onCreateMock,
      layouts: contextState.layouts,
    }),
  };
});

const { EditorTopBar } = await import('./editor-top-bar');

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    contentId: 'c1' as never,
    contentType: 'CONTACT' as const,
    errorMessage: '',
    formId: 'f1',
    isOpen: false,
    macro: 'Contact',
    mode: 'IN_EDITOR_MANAGER' as const,
    text: '{"name":"Ada"}',
    setIsOpen: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  onCreateMock.mockReset();
  contextState.layouts = DEFAULT_LAYOUTS;
});

afterEach(() => {
  contextState.layouts = DEFAULT_LAYOUTS;
});

describe('EditorTopBar', () => {
  it('shows the drag handle and action buttons while in the editor manager', () => {
    const { container, getByText, getByLabelText } = render(
      <EditorTopBar {...baseProps()} />,
    );

    expect(getByText('Contact')).not.toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
    expect(getByLabelText('Add Macro Button')).not.toBeNull();
    expect(getByLabelText('Toggle Editor Visibility Button')).not.toBeNull();
  });

  it('shows an "Editing" badge and hides drag/action controls outside the editor manager', () => {
    const { container, getByText, queryByLabelText } = render(
      <EditorTopBar {...baseProps({ mode: 'IN_LAYOUT_MANAGER' })} />,
    );

    expect(getByText('Contact')).not.toBeNull();
    expect(getByText('Editing')).not.toBeNull();
    expect(container.querySelector('svg')).toBeNull();
    expect(queryByLabelText('Add Macro Button')).toBeNull();
  });

  it('renders the error message when present and hides it otherwise', () => {
    const { container, rerender } = render(<EditorTopBar {...baseProps()} />);
    expect(container.querySelector('p')).toBeNull();

    rerender(<EditorTopBar {...baseProps({ errorMessage: 'Bad JSON' })} />);
    expect(container.querySelector('p')?.textContent).toContain('Bad JSON');
  });

  it('announces the error via role="alert" and hides the decorative icon from AT', () => {
    const { container } = render(
      <EditorTopBar
        {...baseProps({ errorMessage: 'Bad JSON', formId: 'f1' })}
      />,
    );

    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert).toHaveAttribute('id', 'error-message-f1');
    expect(alert?.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes the collapsible region via aria-expanded/aria-controls on the trigger', () => {
    const { container, rerender } = render(
      <EditorTopBar {...baseProps({ isOpen: false, formId: 'f1' })} />,
    );
    const trigger = container.querySelector('[role="button"]');

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls', 'editor-collapse-f1');

    rerender(<EditorTopBar {...baseProps({ isOpen: true, formId: 'f1' })} />);
    expect(container.querySelector('[role="button"]')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('toggles isOpen on click while in the editor manager', () => {
    const setIsOpen = vi.fn();
    const { getByText } = render(
      <EditorTopBar {...baseProps({ setIsOpen, isOpen: false })} />,
    );

    fireEvent.click(getByText('Contact'));
    expect(setIsOpen).toHaveBeenCalledWith(true);
  });

  it('does not toggle isOpen on click outside the editor manager', () => {
    const setIsOpen = vi.fn();
    const { getByText } = render(
      <EditorTopBar {...baseProps({ setIsOpen, mode: 'IN_LAYOUT_MANAGER' })} />,
    );

    fireEvent.click(getByText('Contact'));
    expect(setIsOpen).not.toHaveBeenCalled();
  });

  it('toggles isOpen on Enter/Space and ignores other keys while in the editor manager', () => {
    const setIsOpen = vi.fn();
    const { getByText } = render(
      <EditorTopBar {...baseProps({ setIsOpen, isOpen: false })} />,
    );
    const bar = getByText('Contact');

    fireEvent.keyDown(bar, { key: 'a' });
    expect(setIsOpen).not.toHaveBeenCalled();

    fireEvent.keyDown(bar, { key: 'Enter' });
    fireEvent.keyDown(bar, { key: ' ' });
    expect(setIsOpen).toHaveBeenCalledTimes(2);
  });

  it('does not toggle on Enter outside the editor manager', () => {
    const setIsOpen = vi.fn();
    const { getByText } = render(
      <EditorTopBar {...baseProps({ setIsOpen, mode: 'IN_LAYOUT_MANAGER' })} />,
    );

    fireEvent.keyDown(getByText('Contact'), { key: 'Enter' });
    expect(setIsOpen).not.toHaveBeenCalled();
  });

  it('creates a new item from the last layout by default when the add button is clicked', () => {
    const { getByLabelText } = render(<EditorTopBar {...baseProps()} />);

    fireEvent.click(getByLabelText('Add Macro Button'));

    expect(onCreateMock).toHaveBeenCalledWith({
      contentId: 'c1',
      content: { name: 'Ada' },
      contentType: 'CONTACT',
      layoutId: 'l2',
      layoutType: 'SINGLE',
      layoutParentId: undefined,
    });
  });

  it('creates the item in whichever layout zone is picked from the select (non-drag SC 2.5.7 alternative)', () => {
    const { getByLabelText } = render(<EditorTopBar {...baseProps()} />);

    fireEvent.change(getByLabelText('Add to layout'), {
      target: { value: 'l1' },
    });
    fireEvent.click(getByLabelText('Add Macro Button'));

    expect(onCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ layoutId: 'l1', layoutType: 'SINGLE' }),
    );
  });

  it('lists both sides of a DOUBLE layout as separate zones and targets the chosen side', () => {
    contextState.layouts = [
      {
        layoutId: 'a',
        layoutType: 'DOUBLE',
        layoutLeftId: 'l',
        layoutRightId: 'r',
      },
    ];
    const { getByLabelText, getByText } = render(
      <EditorTopBar {...baseProps()} />,
    );

    expect(getByText('Layout 1 (Left)')).not.toBeNull();
    expect(getByText('Layout 1 (Right)')).not.toBeNull();

    fireEvent.change(getByLabelText('Add to layout'), {
      target: { value: 'l' },
    });
    fireEvent.click(getByLabelText('Add Macro Button'));

    expect(onCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutId: 'l',
        layoutType: 'DOUBLE_LEFT',
        layoutParentId: 'a',
      }),
    );
  });

  it('disables the add button and the layout select when there are no layouts yet', () => {
    contextState.layouts = [];
    const { getByLabelText } = render(<EditorTopBar {...baseProps()} />);

    expect(getByLabelText('Add to layout')).toBeDisabled();
    expect(getByLabelText('Add Macro Button')).toBeDisabled();
  });

  it('does not toggle the collapse when opening the layout select', () => {
    const setIsOpen = vi.fn();
    const { getByLabelText } = render(
      <EditorTopBar {...baseProps({ setIsOpen })} />,
    );

    fireEvent.click(getByLabelText('Add to layout'));

    expect(setIsOpen).not.toHaveBeenCalled();
  });

  it('disables the add button while there is an error', () => {
    const { getByLabelText } = render(
      <EditorTopBar {...baseProps({ errorMessage: 'Bad JSON' })} />,
    );

    expect(getByLabelText('Add Macro Button')).toBeDisabled();
  });

  it('swaps between the collapse and uncollapse icons based on isOpen', () => {
    const { getByLabelText, rerender } = render(
      <EditorTopBar {...baseProps({ isOpen: false })} />,
    );
    const toggleButton = () =>
      getByLabelText('Toggle Editor Visibility Button');

    expect(toggleButton().querySelectorAll('path')).toHaveLength(2);

    rerender(<EditorTopBar {...baseProps({ isOpen: true })} />);
    expect(toggleButton().querySelectorAll('path')).toHaveLength(2);
  });

  it('has no automatically detectable accessibility violations, open or with an error', async () => {
    // aria-controls points at the <form> BaseEditor normally renders
    // alongside this component; stand a matching element in for it so this
    // isolated render doesn't false-positive on a dangling ARIA reference.
    const { container, rerender } = render(
      <>
        <EditorTopBar {...baseProps({ isOpen: true })} />
        <form id="editor-collapse-f1" />
      </>,
    );
    expect((await axe.run(container)).violations).toEqual([]);

    rerender(
      <>
        <EditorTopBar {...baseProps({ errorMessage: 'Bad JSON' })} />
        <form id="editor-collapse-f1" />
      </>,
    );
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
