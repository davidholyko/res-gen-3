import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { object, string } from 'zod';

import { CONTENT_TYPES } from '@/constants';
import type { ContentId, LayoutId } from '@/types/content-base-item';
import type { FieldSpec } from '@/types/field-spec';

const { onUpdateMock } = vi.hoisted(() => ({
  onUpdateMock: vi.fn(),
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      onUpdate: onUpdateMock,
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

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    macro: 'Contact',
    className: 'contact-editor',
    schema,
    fields,
    contentType: CONTENT_TYPES.CONTACT,
    content: { name: 'Ada', email: 'ada@example.com' },
    contentId: 'c1' as ContentId,
    layoutId: 'l1' as LayoutId,
    layoutType: 'SINGLE',
    ...overrides,
  };
}

beforeEach(() => {
  onUpdateMock.mockReset();
});

describe('BaseEditor', () => {
  it('renders a generated form field pre-filled with the content, plus the Editing badge', () => {
    const { container, getByText } = render(<BaseEditor {...baseProps()} />);

    expect(container.querySelector('textarea')).toBeNull();
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    expect(input.value).toBe('Ada');
    expect(getByText('Editing')).not.toBeNull();
  });

  it("the top bar's macro label points at the form's first field", () => {
    const { container, getByText } = render(<BaseEditor {...baseProps()} />);

    const label = getByText('Contact').closest('label');
    const forId = label?.getAttribute('for');
    expect(forId).toBeTruthy();
    expect(container.querySelector(`#${forId}`)?.tagName).toBe('INPUT');
  });

  it('calls onUpdate live as a field changes', () => {
    const { container } = render(<BaseEditor {...baseProps()} />);
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Grace' } });

    expect(onUpdateMock).toHaveBeenCalledWith({
      contentId: 'c1',
      content: { name: 'Grace', email: 'ada@example.com' },
      contentType: CONTENT_TYPES.CONTACT,
      layoutId: 'l1',
      layoutType: 'SINGLE',
      layoutParentId: undefined,
    });
  });

  it('preserves layoutParentId on field change when present', () => {
    const { container } = render(
      <BaseEditor {...baseProps({ layoutParentId: 'p1' as LayoutId })} />,
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
    const { container } = render(<BaseEditor {...baseProps()} />);
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });

    expect(onUpdateMock).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the field error once the value is valid again, and resumes saving', () => {
    const { container } = render(<BaseEditor {...baseProps()} />);
    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });
    expect(container.querySelector('[role="alert"]')).not.toBeNull();

    fireEvent.change(input, { target: { value: 'Grace' } });
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(onUpdateMock).toHaveBeenCalledTimes(1);
  });

  it('has no automatically detectable accessibility violations, including with an error shown', async () => {
    const { container } = render(<BaseEditor {...baseProps()} />);
    expect((await axe.run(container)).violations).toEqual([]);

    const input = container.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
