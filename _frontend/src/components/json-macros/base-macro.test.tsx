import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { useEffect, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import UndoToast from '@/components/undo-toast';
import { CONTENT_TYPES } from '@/constants';
import { useAppContext } from '@/context/app-context';
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

// Drives a real onCreate() (real AppProvider, matching this file's
// existing integration-style tests) and, once the freshly-created item
// shows up in `items`, renders its own BaseMacro -- this is the only way
// to observe the "just created" scroll/focus behavior against a real
// contentId, since onCreate always generates a fresh uuid rather than
// using whatever id was passed in.
function AddThenRenderMacro() {
  const { items, onCreate } = useAppContext();
  // A ref, not state: only ever written inside the effect (never read
  // during render), so it doesn't trip react-hooks/refs. Whether to
  // render is instead derived from `items.length` itself below, which is
  // safe to read during render.
  const hasAddedRef = useRef(false);

  useEffect(() => {
    if (hasAddedRef.current) return;
    hasAddedRef.current = true;
    onCreate({
      contentId: 'ignored' as never,
      contentType: CONTENT_TYPES.CONTACT,
      content: { name: 'New Person', email: 'new@example.com' },
      layoutId: 'a',
      layoutType: 'SINGLE',
    } as unknown as ContentContact);
  }, [onCreate]);

  // seedLocalStorage() below always seeds exactly one item.
  if (items.length < 2) {
    return null;
  }

  const newItem = items[items.length - 1];

  return (
    <BaseMacro {...(newItem as unknown as ContentContact)}>
      <p>new content</p>
    </BaseMacro>
  );
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
    expect(container.querySelector('input')).toBeNull();
    expect(queryByText('child content')).not.toBeNull();
  });

  it('focuses on click inside and shows the top bar, with no inline editor in the block', () => {
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
    expect(getByText('Edit with preview')).not.toBeNull();
    // The form lives in the canvas-side edit panel now
    // (specs/canvas-edit-panel.md) -- nothing renders inside the block.
    expect(container.querySelector('input')).toBeNull();
  });

  it('focuses via keyboard (Tab) and shows the top bar', () => {
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
  });

  it('stays focused when clicking into the canvas edit panel', () => {
    // The docked panel counts as an extension of the focused block
    // (specs/canvas-edit-panel.md) -- clicking into a form field there
    // must not close the panel out from under the cursor.
    seedLocalStorage();
    const panel = document.createElement('div');
    panel.id = 'canvas-edit-panel';
    const panelChild = document.createElement('button');
    panel.appendChild(panelChild);
    document.body.appendChild(panel);

    const { container, getByText } = render(
      <AllProviders>
        <BaseMacro {...props}>
          <p>child content</p>
        </BaseMacro>
      </AllProviders>,
    );

    fireEvent.click(getByText('child content'));
    expect(container.querySelector('.border-2')).not.toBeNull();

    fireEvent.click(panelChild);
    expect(container.querySelector('.border-2')).not.toBeNull();

    fireEvent.blur(container.firstElementChild as HTMLElement, {
      relatedTarget: panelChild,
    });
    expect(container.querySelector('.border-2')).not.toBeNull();

    document.body.removeChild(panel);
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

  it('keyboard deletion pushes the same undo snapshot as the toolbar delete', () => {
    seedLocalStorage();
    const { getByText } = render(
      <AllProviders>
        <BaseMacro {...props}>
          <p>child content</p>
        </BaseMacro>
        <UndoToast />
      </AllProviders>,
    );

    fireEvent.click(getByText('child content'));
    fireEvent.keyDown(document, { key: 'Backspace' });
    expect(readStoredItems().some((item) => item.contentId === 'm1')).toBe(
      false,
    );

    // The toast offers the same 'Block deleted' undo the toolbar delete
    // shows (specs/plain-language-labels-and-move-undo.md), and clicking
    // it restores the block.
    expect(getByText('Block deleted')).not.toBeNull();
    fireEvent.click(getByText('Undo'));
    expect(readStoredItems().some((item) => item.contentId === 'm1')).toBe(
      true,
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

  it('scrolls itself into view and reveals its controls when it is the just-created item', () => {
    seedLocalStorage();
    const scrollIntoViewMock = vi.fn();
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    const { container, getByText } = render(
      <AllProviders>
        <AddThenRenderMacro />
      </AllProviders>,
    );

    expect(getByText('new content')).not.toBeNull();
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    // The existing focus-triggered reveal (not new behavior) confirms
    // focus() actually landed on this macro, not just was called.
    expect(container.querySelector('.border-2')).not.toBeNull();

    focusSpy.mockRestore();
  });

  it('does not scroll/focus a macro that is not the just-created item', () => {
    seedLocalStorage();
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    render(
      <AllProviders>
        <BaseMacro {...props}>
          <p>child content</p>
        </BaseMacro>
      </AllProviders>,
    );

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
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
