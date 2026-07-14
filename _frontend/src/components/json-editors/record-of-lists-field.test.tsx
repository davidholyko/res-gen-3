import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';

import { EDITOR_MODES } from '@/constants';

import RecordOfListsField from './record-of-lists-field';

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    fieldId: 'f1-groups',
    label: 'Groups',
    value: {
      Foods: ['Meats', 'Sushi'],
      Hobbies: ['Sailing'],
    },
    isOpen: true,
    mode: EDITOR_MODES.IN_LAYOUT_MANAGER,
    error: '',
    errorId: 'f1-groups-error',
    onChange: vi.fn(),
    ...overrides,
  };
}

describe('RecordOfListsField', () => {
  it('renders a name input and entry rows per group under a legend', () => {
    const { getByText, getByLabelText } = render(
      <RecordOfListsField {...baseProps()} />,
    );

    expect(getByText('Groups').tagName).toBe('LEGEND');
    expect((getByLabelText('Group 1 name') as HTMLInputElement).value).toBe(
      'Foods',
    );
    expect((getByLabelText('Group 2 name') as HTMLInputElement).value).toBe(
      'Hobbies',
    );
    expect((getByLabelText('Group 1 entry 2') as HTMLInputElement).value).toBe(
      'Sushi',
    );
  });

  it('renames a group in place, preserving group order and entries', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <RecordOfListsField {...baseProps({ onChange })} />,
    );

    fireEvent.change(getByLabelText('Group 1 name'), {
      target: { value: 'Cuisine' },
    });

    expect(onChange).toHaveBeenCalledWith({
      Cuisine: ['Meats', 'Sushi'],
      Hobbies: ['Sailing'],
    });
    // Insertion order kept: the renamed group is still first.
    expect(Object.keys(onChange.mock.calls[0][0])).toEqual([
      'Cuisine',
      'Hobbies',
    ]);
  });

  it("blocks a rename that collides with another group's name, with an inline error", () => {
    const onChange = vi.fn();
    const { getByLabelText, getByRole, queryByRole } = render(
      <RecordOfListsField {...baseProps({ onChange })} />,
    );
    const name = getByLabelText('Group 1 name') as HTMLInputElement;

    fireEvent.change(name, { target: { value: 'Hobbies' } });

    // Committing would silently merge the two groups and destroy one's
    // entries -- refused instead, and explained.
    expect(onChange).not.toHaveBeenCalled();
    expect(getByRole('alert').textContent).toMatch(/already a group name/i);
    expect(name).toHaveAttribute('aria-invalid', 'true');

    // A non-colliding rename goes through and clears the error.
    fireEvent.change(name, { target: { value: 'Cuisine' } });
    expect(onChange).toHaveBeenCalled();
    expect(queryByRole('alert')).toBeNull();
  });

  it('removes just the clicked group', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <RecordOfListsField {...baseProps({ onChange })} />,
    );

    fireEvent.click(getByLabelText('Remove group 1'));

    expect(onChange).toHaveBeenCalledWith({ Hobbies: ['Sailing'] });
  });

  it('adds an empty group with a placeholder name', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <RecordOfListsField {...baseProps({ onChange })} />,
    );

    fireEvent.click(getByLabelText('Add group'));

    expect(onChange).toHaveBeenCalledWith({
      Foods: ['Meats', 'Sushi'],
      Hobbies: ['Sailing'],
      'New group': [],
    });
  });

  it('numbers the placeholder name past existing "New group" names instead of colliding', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <RecordOfListsField
        {...baseProps({
          value: { 'New group': [], 'New group 2': [] },
          onChange,
        })}
      />,
    );

    fireEvent.click(getByLabelText('Add group'));

    expect(onChange).toHaveBeenCalledWith({
      'New group': [],
      'New group 2': [],
      'New group 3': [],
    });
  });

  it('edits a single entry within its group only', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <RecordOfListsField {...baseProps({ onChange })} />,
    );

    fireEvent.change(getByLabelText('Group 1 entry 1'), {
      target: { value: 'Vegetables' },
    });

    expect(onChange).toHaveBeenCalledWith({
      Foods: ['Vegetables', 'Sushi'],
      Hobbies: ['Sailing'],
    });
  });

  it('appends an empty entry to just the clicked group', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <RecordOfListsField {...baseProps({ onChange })} />,
    );

    fireEvent.click(getByLabelText('Add entry to group 2'));

    expect(onChange).toHaveBeenCalledWith({
      Foods: ['Meats', 'Sushi'],
      Hobbies: ['Sailing', ''],
    });
  });

  it('removes a single entry from just its group', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <RecordOfListsField {...baseProps({ onChange })} />,
    );

    fireEvent.click(getByLabelText('Remove group 1 entry 1'));

    expect(onChange).toHaveBeenCalledWith({
      Foods: ['Sushi'],
      Hobbies: ['Sailing'],
    });
  });

  it('clears a stale blocked-rename error when a group is removed', () => {
    const { getByLabelText, queryByRole } = render(
      <RecordOfListsField {...baseProps()} />,
    );

    fireEvent.change(getByLabelText('Group 1 name'), {
      target: { value: 'Hobbies' },
    });
    expect(queryByRole('alert')).not.toBeNull();

    fireEvent.click(getByLabelText('Remove group 2'));
    expect(queryByRole('alert')).toBeNull();
  });

  it('stops keydown propagation so backspace does not bubble to delete the macro', () => {
    const { getByLabelText } = render(<RecordOfListsField {...baseProps()} />);
    const input = getByLabelText('Group 1 name');

    const event = new KeyboardEvent('keydown', {
      key: 'Backspace',
      bubbles: true,
      cancelable: true,
    });
    const stopPropagation = vi.spyOn(event, 'stopPropagation');
    input.dispatchEvent(event);

    expect(stopPropagation).toHaveBeenCalled();
  });

  it('keeps every control out of the tab order while collapsed', () => {
    const { getByLabelText } = render(
      <RecordOfListsField {...baseProps({ isOpen: false })} />,
    );

    expect((getByLabelText('Group 1 name') as HTMLInputElement).tabIndex).toBe(
      -1,
    );
    expect(
      (getByLabelText('Group 1 entry 1') as HTMLInputElement).tabIndex,
    ).toBe(-1);
    expect((getByLabelText('Add group') as HTMLButtonElement).tabIndex).toBe(
      -1,
    );
  });

  it('marks inputs invalid and described by the shared error id when a field error is set', () => {
    const { getByLabelText } = render(
      <RecordOfListsField {...baseProps({ error: 'Bad record' })} />,
    );

    const name = getByLabelText('Group 1 name');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAttribute('aria-describedby', 'f1-groups-error');
    const entry = getByLabelText('Group 1 entry 1');
    expect(entry).toHaveAttribute('aria-invalid', 'true');
    expect(entry).toHaveAttribute('aria-describedby', 'f1-groups-error');
  });

  it('has no automatically detectable accessibility violations, including with a blocked rename shown', async () => {
    const { container, getByLabelText } = render(
      <RecordOfListsField {...baseProps()} />,
    );
    expect((await axe.run(container)).violations).toEqual([]);

    fireEvent.change(getByLabelText('Group 1 name'), {
      target: { value: 'Hobbies' },
    });
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
