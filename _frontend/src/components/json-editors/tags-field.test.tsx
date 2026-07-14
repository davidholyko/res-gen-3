import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';

import TagsField from './tags-field';

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    fieldId: 'f1-tags',
    name: 'tags',
    label: 'Tags',
    value: ['React', 'TypeScript'],
    error: '',
    errorId: 'f1-tags-error',
    onChange: vi.fn(),
    ...overrides,
  };
}

describe('TagsField', () => {
  it('renders one chip per committed tag plus an empty entry input', () => {
    const { container, getByText } = render(<TagsField {...baseProps()} />);

    expect(getByText('React')).not.toBeNull();
    expect(getByText('TypeScript')).not.toBeNull();
    const input = container.querySelector(
      'input[name="tags"]',
    ) as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('commits the typed text as a new chip on Enter and clears the input', () => {
    const onChange = vi.fn();
    const { container } = render(<TagsField {...baseProps({ onChange })} />);
    const input = container.querySelector(
      'input[name="tags"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '  Node  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['React', 'TypeScript', 'Node']);
    expect(input.value).toBe('');
  });

  it('commits on comma too, and keeps the comma out of the chip text', () => {
    const onChange = vi.fn();
    const { container } = render(<TagsField {...baseProps({ onChange })} />);
    const input = container.querySelector(
      'input[name="tags"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'GraphQL' } });
    fireEvent.keyDown(input, { key: ',' });

    expect(onChange).toHaveBeenCalledWith(['React', 'TypeScript', 'GraphQL']);
  });

  it('ignores Enter while the input is empty or whitespace-only', () => {
    const onChange = vi.fn();
    const { container } = render(<TagsField {...baseProps({ onChange })} />);
    const input = container.querySelector(
      'input[name="tags"]',
    ) as HTMLInputElement;

    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('ignores ordinary typing keys entirely', () => {
    const onChange = vi.fn();
    const { container } = render(<TagsField {...baseProps({ onChange })} />);
    const input = container.querySelector(
      'input[name="tags"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Rust' } });
    fireEvent.keyDown(input, { key: 'a' });

    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('Rust');
  });

  it("removes just the clicked chip's tag via its × button", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <TagsField {...baseProps({ onChange })} />,
    );

    fireEvent.click(getByLabelText('Remove Tags React'));

    expect(onChange).toHaveBeenCalledWith(['TypeScript']);
  });

  it('stops keydown propagation so backspace does not bubble to delete the macro', () => {
    const { container } = render(<TagsField {...baseProps()} />);
    const input = container.querySelector('input[name="tags"]')!;

    const event = new KeyboardEvent('keydown', {
      key: 'Backspace',
      bubbles: true,
      cancelable: true,
    });
    const stopPropagation = vi.spyOn(event, 'stopPropagation');
    input.dispatchEvent(event);

    expect(stopPropagation).toHaveBeenCalled();
  });

  it('marks the input invalid and described by the error id when an error is set', () => {
    const { container } = render(
      <TagsField {...baseProps({ error: 'Bad tags' })} />,
    );
    const input = container.querySelector(
      'input[name="tags"]',
    ) as HTMLInputElement;

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'f1-tags-error');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<TagsField {...baseProps()} />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
