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

const fields: FieldSpec[] = [{ kind: 'text', name: 'name', label: 'Name' }];
// .min(1), unlike the trivial z.string() Header/Paragraph actually ship
// with, so the validation/error wiring is reachable here -- see the
// spec's "Phase 1 scope note" for why Header/Paragraph's own schemas
// can't exercise this.
const schema = object({ name: string().min(1) });

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
    fields,
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
  it('renders a generated form field pre-filled with the content', () => {
    const { container } = render(<BaseEditor {...baseProps()} />);

    expect(container.querySelector('textarea')).toBeNull();
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    expect(input.value).toBe('Ada');
  });

  it("the collapsible trigger's aria-controls resolves to the form region", () => {
    const { container } = render(<BaseEditor {...baseProps()} />);

    const trigger = container.querySelector('[role="button"]');
    const controlsId = trigger?.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    expect(container.querySelector(`#${controlsId}`)).not.toBeNull();
  });

  it('calls onUpdate live as a field changes in IN_LAYOUT_MANAGER mode', () => {
    const { container } = render(
      <BaseEditor {...baseProps({ mode: EDITOR_MODES.IN_LAYOUT_MANAGER })} />,
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

  it('preserves layoutParentId on field change when present', () => {
    const { container } = render(
      <BaseEditor
        {...baseProps({
          mode: EDITOR_MODES.IN_LAYOUT_MANAGER,
          layoutParentId: 'p1' as LayoutId,
        })}
      />,
    );
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Grace' } });

    expect(onUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ layoutParentId: 'p1' }),
    );
  });

  it('does not call onUpdate when a field change fails schema validation, and flags the field', () => {
    const { container } = render(
      <BaseEditor {...baseProps({ mode: EDITOR_MODES.IN_LAYOUT_MANAGER })} />,
    );
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });

    expect(onUpdateMock).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not call onUpdate on field change in IN_EDITOR_MANAGER mode', () => {
    const { container } = render(
      <BaseEditor {...baseProps({ mode: EDITOR_MODES.IN_EDITOR_MANAGER })} />,
    );
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Grace' } });

    expect(onUpdateMock).not.toHaveBeenCalled();
  });

  it('is draggable only while in IN_EDITOR_MANAGER mode with no field errors', () => {
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

  it('is not draggable while a field change fails schema validation', () => {
    const { container } = render(
      <BaseEditor {...baseProps({ mode: EDITOR_MODES.IN_EDITOR_MANAGER })} />,
    );
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });

    expect(latestDragSpec().canDrag).toBe(false);
  });

  it('applies opacity while the drag hook reports isDragging', () => {
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

  it('creates a new item from the current form value on a successful drop', () => {
    // In IN_EDITOR_MANAGER mode a fresh contentId is generated on every
    // form change (see the `mode === EDITOR_MODES.IN_EDITOR_MANAGER`
    // branch of BaseEditor's effect), so the id passed to onCreate won't
    // match the original `c1` prop -- only assert it's a non-empty string.
    const { container } = render(<BaseEditor {...baseProps()} />);
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

    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    rerender(<BaseEditor {...baseProps()} />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
