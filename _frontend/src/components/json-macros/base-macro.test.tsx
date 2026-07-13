import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';
import type { ContentContact } from '@/types/content-contact';

import BaseMacro from './base-macro';

function seedLocalStorage() {
  window.localStorage.setItem(
    'res-gen-data',
    JSON.stringify({
      // `layoutId` must match a seeded layout: AppProvider reconciles
      // `items` against `layouts` on mount and silently drops any item
      // whose layoutId has no matching layout.
      items: [{ contentId: 'm1', layoutId: 'a' }],
      layouts: [{ layoutId: 'a' }],
      isEditorVisible: false,
    }),
  );
}

afterEach(() => {
  window.localStorage.clear();
});

const props = {
  contentId: 'm1',
  contentType: CONTENT_TYPES.CONTACT,
  content: { name: 'Ada', email: 'ada@example.com' },
  layoutId: 'a',
  layoutType: 'SINGLE',
} as unknown as ContentContact;

function readStoredItems(): Array<{ contentId: string }> {
  const raw = window.localStorage.getItem('res-gen-data');
  return raw ? JSON.parse(raw).items : [];
}

describe('BaseMacro', () => {
  it('is unfocused by default and does not render the top bar or inline editor', () => {
    seedLocalStorage();
    const { container, queryByText } = render(
      <AllProviders>
        <BaseMacro {...props}>
          <p>child content</p>
        </BaseMacro>
      </AllProviders>,
    );

    expect(container.querySelector('.border-2')).toBeNull();
    expect(container.querySelector('textarea')).toBeNull();
    expect(queryByText('child content')).not.toBeNull();
  });

  it('focuses on click inside and shows the top bar and inline editor', () => {
    seedLocalStorage();
    const { container, getByText } = render(
      <AllProviders>
        <BaseMacro {...props}>
          <p>child content</p>
        </BaseMacro>
      </AllProviders>,
    );

    fireEvent.click(getByText('child content'));

    expect(container.querySelector('.border-2')).not.toBeNull();
    expect(container.querySelector('textarea')).not.toBeNull();
  });

  it('focuses via keyboard (Tab) and shows the top bar and inline editor', () => {
    // The reveal used to be driven only by a mouse-click listener, which
    // left keyboard-only users with no way to ever open the controls
    // (WCAG 2.1.1). This exercises the focus-event based path instead.
    seedLocalStorage();
    const { container } = render(
      <AllProviders>
        <BaseMacro {...props}>
          <p>child content</p>
        </BaseMacro>
      </AllProviders>,
    );
    const wrapper = container.firstElementChild as HTMLElement;

    fireEvent.focus(wrapper);

    expect(container.querySelector('.border-2')).not.toBeNull();
    expect(container.querySelector('textarea')).not.toBeNull();
  });

  it('stays focused when focus moves to a child control (e.g. the revealed top bar)', () => {
    seedLocalStorage();
    const { container } = render(
      <AllProviders>
        <BaseMacro {...props}>
          <p>child content</p>
        </BaseMacro>
      </AllProviders>,
    );
    const wrapper = container.firstElementChild as HTMLElement;

    fireEvent.focus(wrapper);
    const child = wrapper.querySelector('button') as HTMLElement;
    fireEvent.blur(wrapper, { relatedTarget: child });

    expect(container.querySelector('.border-2')).not.toBeNull();
  });

  it('unfocuses when focus moves outside the macro entirely', () => {
    seedLocalStorage();
    const { container } = render(
      <AllProviders>
        <div>
          <BaseMacro {...props}>
            <p>child content</p>
          </BaseMacro>
          <button type="button">outside</button>
        </div>
      </AllProviders>,
    );
    const wrapper = container.querySelector('[tabindex="0"]') as HTMLElement;
    const outside = container.querySelector(
      'button[type="button"]',
    ) as HTMLElement;

    fireEvent.focus(wrapper);
    fireEvent.blur(wrapper, { relatedTarget: outside });

    expect(container.querySelector('.border-2')).toBeNull();
  });

  it('unfocuses on click outside', () => {
    seedLocalStorage();
    const { container, getByText } = render(
      <AllProviders>
        <div>
          <BaseMacro {...props}>
            <p>child content</p>
          </BaseMacro>
          <button type="button">outside</button>
        </div>
      </AllProviders>,
    );

    fireEvent.click(getByText('child content'));
    expect(container.querySelector('.border-2')).not.toBeNull();

    fireEvent.click(getByText('outside'));
    expect(container.querySelector('.border-2')).toBeNull();
  });

  it('deletes the item on Backspace while focused', () => {
    seedLocalStorage();
    const { getByText } = render(
      <AllProviders>
        <BaseMacro {...props}>
          <p>child content</p>
        </BaseMacro>
      </AllProviders>,
    );

    fireEvent.click(getByText('child content'));
    fireEvent.keyDown(document, { key: 'Backspace' });

    expect(readStoredItems().some((item) => item.contentId === 'm1')).toBe(
      false,
    );
  });

  it('deletes the item on Delete while focused', () => {
    seedLocalStorage();
    const { getByText } = render(
      <AllProviders>
        <BaseMacro {...props}>
          <p>child content</p>
        </BaseMacro>
      </AllProviders>,
    );

    fireEvent.click(getByText('child content'));
    fireEvent.keyDown(document, { key: 'Delete' });

    expect(readStoredItems().some((item) => item.contentId === 'm1')).toBe(
      false,
    );
  });

  it('does not delete on Backspace/Delete while unfocused', () => {
    seedLocalStorage();
    render(
      <AllProviders>
        <BaseMacro {...props}>
          <p>child content</p>
        </BaseMacro>
      </AllProviders>,
    );

    fireEvent.keyDown(document, { key: 'Backspace' });

    expect(readStoredItems().some((item) => item.contentId === 'm1')).toBe(
      true,
    );
  });

  it('ignores unrelated key presses while focused', () => {
    seedLocalStorage();
    const { getByText } = render(
      <AllProviders>
        <BaseMacro {...props}>
          <p>child content</p>
        </BaseMacro>
      </AllProviders>,
    );

    fireEvent.click(getByText('child content'));
    fireEvent.keyDown(document, { key: 'a' });

    expect(readStoredItems().some((item) => item.contentId === 'm1')).toBe(
      true,
    );
  });

  it('has no automatically detectable accessibility violations, focused or not', async () => {
    seedLocalStorage();
    const { container, getByText } = render(
      <AllProviders>
        <BaseMacro {...props}>
          <p>child content</p>
        </BaseMacro>
      </AllProviders>,
    );

    expect((await axe.run(container)).violations).toEqual([]);

    fireEvent.click(getByText('child content'));
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
