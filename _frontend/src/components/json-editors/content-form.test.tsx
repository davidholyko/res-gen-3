import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';

import { EDITOR_MODES } from '@/constants';
import type { FieldSpec } from '@/types/field-spec';

import ContentForm from './content-form';

const fields: FieldSpec[] = [
  { kind: 'text', name: 'title', label: 'Title' },
  { kind: 'textarea', name: 'body', label: 'Body' },
];

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    fields,
    value: { title: 'Hello', body: 'World' },
    onFieldChange: vi.fn(),
    formId: 'f1',
    isOpen: true,
    mode: EDITOR_MODES.IN_LAYOUT_MANAGER,
    fieldErrors: {},
    ...overrides,
  };
}

describe('ContentForm', () => {
  it('renders a text input for a text field and a textarea for a textarea field', () => {
    const { container } = render(<ContentForm {...baseProps()} />);

    const input = container.querySelector(
      'input[name="title"]',
    ) as HTMLInputElement;
    const textarea = container.querySelector(
      'textarea[name="body"]',
    ) as HTMLTextAreaElement;

    expect(input.type).toBe('text');
    expect(input.value).toBe('Hello');
    expect(textarea.value).toBe('World');
  });

  it('falls back to an empty string for a field missing from value', () => {
    const { container } = render(<ContentForm {...baseProps({ value: {} })} />);

    const input = container.querySelector(
      'input[name="title"]',
    ) as HTMLInputElement;

    expect(input.value).toBe('');
  });

  it('gives the first field the legacy editor-textarea id and later fields a per-field id', () => {
    const { container } = render(<ContentForm {...baseProps()} />);

    expect(container.querySelector('#editor-textarea-f1')).not.toBeNull();
    expect(container.querySelector('#editor-field-f1-body')).not.toBeNull();
  });

  it('wraps the fields in a form matching the id EditorTopBar aria-controls expects', () => {
    const { container } = render(<ContentForm {...baseProps()} />);

    expect(container.querySelector('#editor-collapse-f1')?.tagName).toBe(
      'FORM',
    );
  });

  it('calls onFieldChange with the field name and new value on change', () => {
    const onFieldChange = vi.fn();
    const { container } = render(
      <ContentForm {...baseProps({ onFieldChange })} />,
    );
    const input = container.querySelector(
      'input[name="title"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Goodbye' } });

    expect(onFieldChange).toHaveBeenCalledWith('title', 'Goodbye');
  });

  it('stops keydown propagation so backspace does not bubble to delete the macro', () => {
    const { container } = render(<ContentForm {...baseProps()} />);
    const input = container.querySelector('input[name="title"]')!;

    const event = new KeyboardEvent('keydown', {
      key: 'Backspace',
      bubbles: true,
      cancelable: true,
    });
    const stopPropagation = vi.spyOn(event, 'stopPropagation');
    input.dispatchEvent(event);

    expect(stopPropagation).toHaveBeenCalled();
  });

  it('keeps fields in the tab order while open and out of it while collapsed', () => {
    const { container, rerender } = render(<ContentForm {...baseProps()} />);
    const input = container.querySelector(
      'input[name="title"]',
    ) as HTMLInputElement;
    expect(input.tabIndex).toBe(0);

    rerender(<ContentForm {...baseProps({ isOpen: false })} />);
    expect(input.tabIndex).toBe(-1);
  });

  it('renders an inline error under only the offending field and wires aria to it', () => {
    const { container } = render(
      <ContentForm
        {...baseProps({ fieldErrors: { title: 'Title is required' } })}
      />,
    );
    const input = container.querySelector(
      'input[name="title"]',
    ) as HTMLInputElement;
    const textarea = container.querySelector(
      'textarea[name="body"]',
    ) as HTMLTextAreaElement;

    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedById = input.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
    expect(container.querySelector(`#${describedById}`)?.textContent).toBe(
      'Title is required',
    );

    // The other field is untouched -- no banner-for-the-whole-block.
    expect(textarea).toHaveAttribute('aria-invalid', 'false');
    expect(textarea).not.toHaveAttribute('aria-describedby');
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(1);
  });

  it('has no aria-describedby and reports valid when there are no field errors', () => {
    const { container } = render(<ContentForm {...baseProps()} />);
    const input = container.querySelector(
      'input[name="title"]',
    ) as HTMLInputElement;

    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('renders a TagsField for a tags kind and forwards its array changes', () => {
    const onFieldChange = vi.fn();
    const { container, getByLabelText } = render(
      <ContentForm
        {...baseProps({
          fields: [
            { kind: 'tags', name: 'tags', label: 'Tags' },
          ] as FieldSpec[],
          value: { tags: ['React'] },
          onFieldChange,
        })}
      />,
    );
    const input = container.querySelector(
      'input[name="tags"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Node' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onFieldChange).toHaveBeenCalledWith('tags', ['React', 'Node']);

    fireEvent.click(getByLabelText('Remove Tags React'));
    expect(onFieldChange).toHaveBeenCalledWith('tags', []);
  });

  it('renders a ListField for a list kind and forwards its array changes', () => {
    const onFieldChange = vi.fn();
    const { getByLabelText } = render(
      <ContentForm
        {...baseProps({
          fields: [
            { kind: 'list', name: 'descriptions', label: 'Descriptions' },
          ] as FieldSpec[],
          value: { descriptions: ['One'] },
          onFieldChange,
        })}
      />,
    );

    fireEvent.click(getByLabelText('Add Descriptions entry'));

    expect(onFieldChange).toHaveBeenCalledWith('descriptions', ['One', '']);
  });

  it('defaults a missing array value to an empty tags/list field', () => {
    const { container, getByLabelText } = render(
      <ContentForm
        {...baseProps({
          fields: [
            { kind: 'tags', name: 'tags', label: 'Tags' },
            { kind: 'list', name: 'descriptions', label: 'Descriptions' },
          ] as FieldSpec[],
          value: {},
        })}
      />,
    );

    // The tags entry input exists but no chips do; the list renders only
    // its add button.
    expect(container.querySelector('input[name="tags"]')).not.toBeNull();
    expect(container.querySelectorAll('button')).toHaveLength(1);
    expect(getByLabelText('Add Descriptions entry')).not.toBeNull();
  });

  it('shows an inline error under an array field via its errorId', () => {
    const { container } = render(
      <ContentForm
        {...baseProps({
          fields: [
            { kind: 'tags', name: 'tags', label: 'Tags' },
          ] as FieldSpec[],
          value: { tags: [] },
          fieldErrors: { tags: 'Tags are broken' },
        })}
      />,
    );

    const input = container.querySelector(
      'input[name="tags"]',
    ) as HTMLInputElement;
    const describedById = input.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
    expect(container.querySelector(`#${describedById}`)?.textContent).toBe(
      'Tags are broken',
    );
  });

  it('has no automatically detectable accessibility violations, with and without a field error', async () => {
    const { container, rerender } = render(<ContentForm {...baseProps()} />);
    expect((await axe.run(container)).violations).toEqual([]);

    rerender(
      <ContentForm
        {...baseProps({ fieldErrors: { title: 'Title is required' } })}
      />,
    );
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
