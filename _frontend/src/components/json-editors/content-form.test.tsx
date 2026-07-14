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
    errorMessage: '',
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

  it('marks fields invalid and describes them by the shared error message when errorMessage is set', () => {
    const { container } = render(
      <ContentForm {...baseProps({ errorMessage: 'Required' })} />,
    );
    const input = container.querySelector(
      'input[name="title"]',
    ) as HTMLInputElement;

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'error-message-f1');
  });

  it('has no aria-describedby and reports valid when there is no error message', () => {
    const { container } = render(<ContentForm {...baseProps()} />);
    const input = container.querySelector(
      'input[name="title"]',
    ) as HTMLInputElement;

    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<ContentForm {...baseProps()} />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
