import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import type { DragSourceHookSpec } from 'react-dnd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { object, string } from 'zod';

import { CONTENT_TYPES, EDITOR_MODES } from '@/constants';
import type { ContentId, LayoutId } from '@/types/content-base-item';
import type { FieldSpec } from '@/types/field-spec';

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

  it("the collapsible trigger's aria-controls resolves to the actual collapse region", () => {
    const { container } = render(<BaseEditor {...baseProps()} />);

    const trigger = container.querySelector('[role="button"]');
    const controlsId = trigger?.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    expect(container.querySelector(`#${controlsId}`)).not.toBeNull();
  });

  it('sets an error message for invalid JSON and clears it once fixed', () => {
    const { container } = render(<BaseEditor {...baseProps()} />);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: '{ not valid json' } });
    expect(container.querySelector('p')?.textContent).toMatch(/JSON/i);

    fireEvent.change(textarea, { target: { value: '{"name": "Grace"}' } });
    expect(container.querySelector('p')).toBeNull();
  });

  it('marks the textarea invalid and points aria-describedby at the error text', () => {
    const { container } = render(<BaseEditor {...baseProps()} />);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

    expect(textarea).toHaveAttribute('aria-invalid', 'false');
    expect(textarea).not.toHaveAttribute('aria-describedby');

    fireEvent.change(textarea, { target: { value: '{ not valid json' } });

    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    const describedById = textarea.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
    expect(container.querySelector(`#${describedById}`)?.textContent).toMatch(
      /JSON/i,
    );
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

  it('has no automatically detectable accessibility violations, including with an error shown', async () => {
    const { container, rerender } = render(<BaseEditor {...baseProps()} />);
    expect((await axe.run(container)).violations).toEqual([]);

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{ nope' } });
    rerender(<BaseEditor {...baseProps()} />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});

describe('BaseEditor with a field spec (specs/editor-redesign.md, Phase 1)', () => {
  const formFields: FieldSpec[] = [
    { kind: 'text', name: 'name', label: 'Name' },
  ];
  // .min(1), unlike the trivial z.string() Header/Paragraph actually ship
  // with, so the form path's validation/error wiring is reachable here --
  // see the spec's "Phase 1 scope note" for why Header/Paragraph's own
  // schemas can't exercise this.
  const requiredSchema = object({ name: string().min(1) });

  function formProps(overrides: Record<string, unknown> = {}) {
    return baseProps({
      fields: formFields,
      schema: requiredSchema,
      ...overrides,
    });
  }

  it('renders a generated form field instead of the raw-JSON textarea', () => {
    const { container } = render(<BaseEditor {...formProps()} />);

    expect(container.querySelector('textarea')).toBeNull();
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    expect(input.value).toBe('Ada');
  });

  it("the collapsible trigger's aria-controls still resolves to the form region", () => {
    const { container } = render(<BaseEditor {...formProps()} />);

    const trigger = container.querySelector('[role="button"]');
    const controlsId = trigger?.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    expect(container.querySelector(`#${controlsId}`)).not.toBeNull();
  });

  it('calls onUpdate live as a field changes in IN_LAYOUT_MANAGER mode', () => {
    const { container } = render(
      <BaseEditor {...formProps({ mode: EDITOR_MODES.IN_LAYOUT_MANAGER })} />,
    );
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Grace' } });

    expect(onUpdateMock).toHaveBeenCalledWith({
      contentId: 'c1',
      content: { name: 'Grace' },
      contentType: CONTENT_TYPES.CONTACT,
      layoutId: 'l1',
      layoutType: 'SINGLE',
      layoutParentId: undefined,
    });
  });

  it('does not call onUpdate when a field change fails schema validation', () => {
    const { container } = render(
      <BaseEditor {...formProps({ mode: EDITOR_MODES.IN_LAYOUT_MANAGER })} />,
    );
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });

    expect(onUpdateMock).not.toHaveBeenCalled();
    expect(container.querySelector('p')).not.toBeNull();
  });

  it('does not call onUpdate on field change in IN_EDITOR_MANAGER mode', () => {
    const { container } = render(
      <BaseEditor {...formProps({ mode: EDITOR_MODES.IN_EDITOR_MANAGER })} />,
    );
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Grace' } });

    expect(onUpdateMock).not.toHaveBeenCalled();
  });

  it('creates a new item from the current form value on a successful drop', () => {
    const { container } = render(<BaseEditor {...formProps()} />);
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Grace' } });

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

  it('is not draggable while a field change fails schema validation', () => {
    const { container } = render(
      <BaseEditor {...formProps({ mode: EDITOR_MODES.IN_EDITOR_MANAGER })} />,
    );
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });

    expect(latestDragSpec().canDrag).toBe(false);
  });

  it('has no automatically detectable accessibility violations, including with an error shown', async () => {
    const { container, rerender } = render(<BaseEditor {...formProps()} />);
    expect((await axe.run(container)).violations).toEqual([]);

    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    rerender(<BaseEditor {...formProps()} />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
