import { fireEvent, render } from '@testing-library/react';
import type { DragSourceHookSpec } from 'react-dnd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { object, string } from 'zod';

import { CONTENT_TYPES, EDITOR_MODES } from '@/constants';
import type { ContentId, LayoutId } from '@/types/content-base-item';

const { useDragMock } = vi.hoisted(() => ({ useDragMock: vi.fn() }));
vi.mock('react-dnd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dnd')>();
  return { ...actual, useDrag: useDragMock };
});

const { onCreateMock, onUpdateMock } = vi.hoisted(() => ({
  onCreateMock: vi.fn(),
  onUpdateMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      onCreate: onCreateMock,
      onUpdate: onUpdateMock,
      layouts: [],
    }),
  };
});

// Imported after the mocks above so BaseEditor picks up the mocked modules.
const { default: BaseEditor } = await import('./base-editor');

const schema = object({ name: string() });

function latestDragSpec(): DragSourceHookSpec<
  { contentType: string; contentId: string },
  unknown,
  { isDragging: boolean }
> {
  const { calls } = useDragMock.mock;
  return calls[calls.length - 1][0];
}

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    macro: 'Contact',
    className: 'contact-editor',
    schema,
    contentType: CONTENT_TYPES.CONTACT,
    content: { name: 'Ada' },
    contentId: 'c1' as ContentId,
    layoutId: 'l1' as LayoutId,
    layoutType: 'SINGLE',
    ...overrides,
  };
}

beforeEach(() => {
  useDragMock.mockReset();
  useDragMock.mockImplementation(() => [
    { isDragging: false },
    vi.fn(),
    vi.fn(),
  ]);
  onCreateMock.mockReset();
  onUpdateMock.mockReset();
});

describe('BaseEditor', () => {
  it('renders a textarea pre-filled with the JSON-stringified content', () => {
    const { container } = render(<BaseEditor {...baseProps()} />);

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe(JSON.stringify({ name: 'Ada' }, null, 2));
  });

  it('sets an error message for invalid JSON and clears it once fixed', () => {
    const { container } = render(<BaseEditor {...baseProps()} />);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: '{ not valid json' } });
    expect(container.querySelector('p')?.textContent).toMatch(/JSON/i);

    fireEvent.change(textarea, { target: { value: '{"name": "Grace"}' } });
    expect(container.querySelector('p')).toBeNull();
  });

  it('sets an error message when the value fails schema validation', () => {
    const { container } = render(<BaseEditor {...baseProps()} />);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: '{}' } });
    expect(container.querySelector('p')).not.toBeNull();
  });

  it('does nothing on blur while in IN_EDITOR_MANAGER mode', () => {
    const { container } = render(
      <BaseEditor {...baseProps({ mode: EDITOR_MODES.IN_EDITOR_MANAGER })} />,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    fireEvent.blur(textarea, { target: { value: '{"name": "Grace"}' } });

    expect(onUpdateMock).not.toHaveBeenCalled();
  });

  it('calls onUpdate on blur in IN_LAYOUT_MANAGER mode when JSON is valid', () => {
    const { container } = render(
      <BaseEditor {...baseProps({ mode: EDITOR_MODES.IN_LAYOUT_MANAGER })} />,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: '{"name": "Grace"}' } });
    fireEvent.blur(textarea, { target: { value: '{"name": "Grace"}' } });

    expect(onUpdateMock).toHaveBeenCalledWith({
      contentId: 'c1',
      content: { name: 'Grace' },
      contentType: CONTENT_TYPES.CONTACT,
      layoutId: 'l1',
      layoutType: 'SINGLE',
      layoutParentId: undefined,
    });
  });

  it('does not call onUpdate on blur in IN_LAYOUT_MANAGER mode when JSON is invalid', () => {
    const { container } = render(
      <BaseEditor {...baseProps({ mode: EDITOR_MODES.IN_LAYOUT_MANAGER })} />,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: '{ nope' } });
    fireEvent.blur(textarea, { target: { value: '{ nope' } });

    expect(onUpdateMock).not.toHaveBeenCalled();
  });

  it('preserves layoutParentId on blur when present', () => {
    const { container } = render(
      <BaseEditor
        {...baseProps({
          mode: EDITOR_MODES.IN_LAYOUT_MANAGER,
          layoutParentId: 'p1' as LayoutId,
        })}
      />,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    fireEvent.blur(textarea, { target: { value: '{"name": "Ada"}' } });

    expect(onUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ layoutParentId: 'p1' }),
    );
  });

  it('stops propagation on keydown so parent DnD handlers do not intercept typing', () => {
    const { container } = render(<BaseEditor {...baseProps()} />);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
      cancelable: true,
    });
    const stopPropagation = vi.spyOn(event, 'stopPropagation');
    textarea.dispatchEvent(event);

    expect(stopPropagation).toHaveBeenCalled();
  });

  it('is draggable only while in IN_EDITOR_MANAGER mode with no error', () => {
    render(
      <BaseEditor {...baseProps({ mode: EDITOR_MODES.IN_EDITOR_MANAGER })} />,
    );
    expect(latestDragSpec().canDrag).toBe(true);
  });

  it('is not draggable while in IN_LAYOUT_MANAGER mode', () => {
    render(
      <BaseEditor {...baseProps({ mode: EDITOR_MODES.IN_LAYOUT_MANAGER })} />,
    );
    expect(latestDragSpec().canDrag).toBe(false);
  });

  it('is not draggable while there is a validation error', () => {
    const { container } = render(
      <BaseEditor {...baseProps({ mode: EDITOR_MODES.IN_EDITOR_MANAGER })} />,
    );
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: '{ nope' } });

    expect(latestDragSpec().canDrag).toBe(false);
  });

  it('applies opacity when the drag hook reports isDragging', () => {
    useDragMock.mockImplementation(() => [
      { isDragging: true },
      vi.fn(),
      vi.fn(),
    ]);
    const { container } = render(<BaseEditor {...baseProps()} />);

    expect(container.firstElementChild).toHaveClass('opacity-50');
  });

  it("collect reflects the drag monitor's isDragging state", () => {
    render(<BaseEditor {...baseProps()} />);
    const { collect } = latestDragSpec();

    expect(
      collect?.({ isDragging: () => true } as never, undefined as never),
    ).toEqual({
      isDragging: true,
    });
    expect(
      collect?.({ isDragging: () => false } as never, undefined as never),
    ).toEqual({
      isDragging: false,
    });
  });

  it('creates a new item on a successful drop', () => {
    // In IN_EDITOR_MANAGER mode a fresh contentId is generated on every text
    // change (see the `mode === EDITOR_MODES.IN_EDITOR_MANAGER` branch of
    // BaseEditor's first effect), so the id passed to onCreate won't match
    // the original `c1` prop -- only assert it's a non-empty string.
    const { container } = render(<BaseEditor {...baseProps()} />);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"name": "Grace"}' } });

    const { end } = latestDragSpec();
    end?.({ contentType: CONTENT_TYPES.CONTACT, contentId: 'c1' }, {
      getDropResult: () => ({
        layoutId: 'l2',
        layoutType: 'SINGLE',
        layoutParentId: 'p2',
      }),
    } as never);

    expect(onCreateMock).toHaveBeenCalledWith({
      contentId: expect.any(String),
      content: { name: 'Grace' },
      contentType: CONTENT_TYPES.CONTACT,
      layoutId: 'l2',
      layoutType: 'SINGLE',
      layoutParentId: 'p2',
    });
  });

  it('falls back to undefined layoutParentId for a single-layout drop result', () => {
    render(<BaseEditor {...baseProps()} />);

    const { end } = latestDragSpec();
    end?.({ contentType: CONTENT_TYPES.CONTACT, contentId: 'c1' }, {
      getDropResult: () => ({ layoutId: 'l2', layoutType: 'SINGLE' }),
    } as never);

    expect(onCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ layoutParentId: undefined }),
    );
  });

  it('does not create an item when the drop is cancelled', () => {
    render(<BaseEditor {...baseProps()} />);

    const { end } = latestDragSpec();
    end?.({ contentType: CONTENT_TYPES.CONTACT, contentId: 'c1' }, {
      getDropResult: () => null,
    } as never);

    expect(onCreateMock).not.toHaveBeenCalled();
  });
});
