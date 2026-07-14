import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';

import { EDITOR_MODES } from '@/constants';

import ListField from './list-field';

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    fieldId: 'f1-descriptions',
    name: 'descriptions',
    label: 'Descriptions',
    value: ['First point', 'Second point'],
    isOpen: true,
    mode: EDITOR_MODES.IN_LAYOUT_MANAGER,
    error: '',
    errorId: 'f1-descriptions-error',
    onChange: vi.fn(),
    ...overrides,
  };
}

describe('ListField', () => {
  it('renders one row input per entry under a group legend', () => {
    const { container, getByText, getByLabelText } = render(
      <ListField {...baseProps()} />,
    );

    expect(getByText('Descriptions').tagName).toBe('LEGEND');
    expect((getByLabelText('Descriptions 1') as HTMLInputElement).value).toBe(
      'First point',
    );
    expect((getByLabelText('Descriptions 2') as HTMLInputElement).value).toBe(
      'Second point',
    );
    expect(container.querySelectorAll('input')).toHaveLength(2);
  });

  it("editing a row replaces just that row's entry", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <ListField {...baseProps({ onChange })} />,
    );

    fireEvent.change(getByLabelText('Descriptions 2'), {
      target: { value: 'Rewritten' },
    });

    expect(onChange).toHaveBeenCalledWith(['First point', 'Rewritten']);
  });

  it('appends an empty row via the add button', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <ListField {...baseProps({ onChange })} />,
    );

    fireEvent.click(getByLabelText('Add Descriptions entry'));

    expect(onChange).toHaveBeenCalledWith(['First point', 'Second point', '']);
  });

  it('removes just the clicked row', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <ListField {...baseProps({ onChange })} />,
    );

    fireEvent.click(getByLabelText('Remove Descriptions 1'));

    expect(onChange).toHaveBeenCalledWith(['Second point']);
  });

  it('swaps a row with its neighbor via the reorder buttons', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <ListField {...baseProps({ onChange })} />,
    );

    fireEvent.click(getByLabelText('Move Descriptions 2 up'));
    expect(onChange).toHaveBeenCalledWith(['Second point', 'First point']);

    fireEvent.click(getByLabelText('Move Descriptions 1 down'));
    expect(onChange).toHaveBeenLastCalledWith(['Second point', 'First point']);
  });

  it('disables moving the first row up and the last row down', () => {
    const { getByLabelText } = render(<ListField {...baseProps()} />);

    expect(getByLabelText('Move Descriptions 1 up')).toBeDisabled();
    expect(getByLabelText('Move Descriptions 2 down')).toBeDisabled();
    expect(getByLabelText('Move Descriptions 1 down')).not.toBeDisabled();
    expect(getByLabelText('Move Descriptions 2 up')).not.toBeDisabled();
  });

  it('renders only the add button for an empty list', () => {
    const { container, getByLabelText } = render(
      <ListField {...baseProps({ value: [] })} />,
    );

    expect(container.querySelectorAll('input')).toHaveLength(0);
    expect(getByLabelText('Add Descriptions entry')).not.toBeNull();
  });

  it('stops keydown propagation so backspace does not bubble to delete the macro', () => {
    const { getByLabelText } = render(<ListField {...baseProps()} />);
    const input = getByLabelText('Descriptions 1');

    const event = new KeyboardEvent('keydown', {
      key: 'Backspace',
      bubbles: true,
      cancelable: true,
    });
    const stopPropagation = vi.spyOn(event, 'stopPropagation');
    input.dispatchEvent(event);

    expect(stopPropagation).toHaveBeenCalled();
  });

  it('keeps rows and buttons out of the tab order while collapsed', () => {
    const { getByLabelText } = render(
      <ListField {...baseProps({ isOpen: false })} />,
    );

    expect(
      (getByLabelText('Descriptions 1') as HTMLInputElement).tabIndex,
    ).toBe(-1);
    expect(
      (getByLabelText('Add Descriptions entry') as HTMLButtonElement).tabIndex,
    ).toBe(-1);
  });

  it('marks rows invalid and described by the error id when an error is set', () => {
    const { getByLabelText } = render(
      <ListField {...baseProps({ error: 'Bad list' })} />,
    );
    const input = getByLabelText('Descriptions 1');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'f1-descriptions-error');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<ListField {...baseProps()} />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
