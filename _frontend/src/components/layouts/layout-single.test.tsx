import { render } from '@testing-library/react';
import type { DropTargetHookSpec } from 'react-dnd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CONTENT_TYPES } from '@/constants';
import { AllProviders } from '@/test-providers';

const { useDropMock } = vi.hoisted(() => ({ useDropMock: vi.fn() }));
vi.mock('react-dnd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dnd')>();
  return { ...actual, useDrop: useDropMock };
});

const { default: LayoutSingle } = await import('./layout-single');

function latestDropSpec(): DropTargetHookSpec<
  unknown,
  { layoutType: string; layoutId?: string; layoutParentId: string | null },
  { isOver: boolean }
> {
  const { calls } = useDropMock.mock;
  return calls[calls.length - 1][0];
}

function seedLocalStorage() {
  window.localStorage.setItem(
    'res-gen-data',
    JSON.stringify({
      items: [
        {
          contentId: 'a',
          contentType: CONTENT_TYPES.CONTACT,
          content: { name: 'In layout' },
          layoutId: 'this-layout',
          layoutType: 'SINGLE',
        },
        {
          contentId: 'b',
          contentType: CONTENT_TYPES.CONTACT,
          content: { name: 'Other layout' },
          layoutId: 'other-layout',
          layoutType: 'SINGLE',
        },
      ],
      layouts: [{ layoutId: 'this-layout', layoutType: 'SINGLE' }],
      isEditorVisible: false,
    }),
  );
}

beforeEach(() => {
  useDropMock.mockReset();
  useDropMock.mockImplementation(() => [{ isOver: false }, vi.fn()]);
});

afterEach(() => {
  window.localStorage.clear();
});

describe('LayoutSingle', () => {
  it('renders only items belonging to this layout', () => {
    seedLocalStorage();
    const { getByText, queryByText } = render(
      <AllProviders>
        <LayoutSingle layoutType="SINGLE" layoutId="this-layout" />
      </AllProviders>,
    );

    expect(getByText('In layout')).not.toBeNull();
    expect(queryByText('Other layout')).toBeNull();
  });

  it('accepts every content type as a drop source', () => {
    render(
      <AllProviders>
        <LayoutSingle layoutType="SINGLE" layoutId="a" />
      </AllProviders>,
    );

    expect(latestDropSpec().accept).toEqual(
      expect.arrayContaining(Object.values(CONTENT_TYPES)),
    );
  });

  it('resolves a drop with this layout, defaulting layoutParentId to null', () => {
    render(
      <AllProviders>
        <LayoutSingle layoutType="SINGLE" layoutId="a" />
      </AllProviders>,
    );

    const { drop } = latestDropSpec();
    expect(drop?.({} as never, undefined as never)).toEqual({
      layoutType: 'SINGLE',
      layoutId: 'a',
      layoutParentId: null,
    });
  });

  it('uses the provided layoutParentId when set', () => {
    render(
      <AllProviders>
        <LayoutSingle layoutType="SINGLE" layoutId="a" layoutParentId="p" />
      </AllProviders>,
    );

    const { drop } = latestDropSpec();
    expect(drop?.({} as never, undefined as never)).toEqual(
      expect.objectContaining({ layoutParentId: 'p' }),
    );
  });

  it("collect reflects the drop monitor's isOver state", () => {
    render(
      <AllProviders>
        <LayoutSingle layoutType="SINGLE" layoutId="a" />
      </AllProviders>,
    );

    const { collect } = latestDropSpec();
    expect(
      collect?.({ isOver: () => true } as never, undefined as never),
    ).toEqual({
      isOver: true,
    });
  });

  it('highlights the drop zone while a drag is over it', () => {
    useDropMock.mockImplementation(() => [{ isOver: true }, vi.fn()]);
    const { container } = render(
      <AllProviders>
        <LayoutSingle layoutType="SINGLE" layoutId="a" />
      </AllProviders>,
    );

    expect(container.querySelector('.layout-single')).toHaveClass(
      'bg-emerald-50',
    );
  });
});
