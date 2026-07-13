import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { onCreateMock, contextState } = vi.hoisted(() => ({
  onCreateMock: vi.fn(),
  contextState: {
    layouts: [
      { layoutId: 'l1', layoutType: 'SINGLE' },
      { layoutId: 'l2', layoutType: 'SINGLE' },
    ] as unknown[],
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

  it('shows "(Edit Mode)" and hides drag/action controls outside the editor manager', () => {
    const { container, getByText, queryByLabelText } = render(
      <EditorTopBar {...baseProps({ mode: 'IN_LAYOUT_MANAGER' })} />,
    );

    expect(getByText('Contact (Edit Mode)')).not.toBeNull();
    expect(container.querySelector('svg')).toBeNull();
    expect(queryByLabelText('Add Macro Button')).toBeNull();
  });

  it('renders the error message when present and hides it otherwise', () => {
    const { container, rerender } = render(<EditorTopBar {...baseProps()} />);
    expect(container.querySelector('p')).toBeNull();

    rerender(<EditorTopBar {...baseProps({ errorMessage: 'Bad JSON' })} />);
    expect(container.querySelector('p')?.textContent).toContain('Bad JSON');
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

    fireEvent.click(getByText('Contact (Edit Mode)'));
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

    fireEvent.keyDown(getByText('Contact (Edit Mode)'), { key: 'Enter' });
    expect(setIsOpen).not.toHaveBeenCalled();
  });

  it('creates a new item from the last layout when the add button is clicked', () => {
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
});
