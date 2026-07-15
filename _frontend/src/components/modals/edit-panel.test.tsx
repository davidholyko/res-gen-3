import { act, fireEvent, render, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { openEditingViewMock, onUpdateMock, contextState } = vi.hoisted(() => ({
  openEditingViewMock: vi.fn(),
  onUpdateMock: vi.fn(),
  contextState: {
    editingContentId: 'h1' as string | null,
    items: [] as unknown[],
    layouts: [] as unknown[],
  },
}));
vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      items: contextState.items,
      layouts: contextState.layouts,
      editingContentId: contextState.editingContentId,
      openEditingView: openEditingViewMock,
      onUpdate: onUpdateMock,
    }),
  };
});

const { default: EditPanel, blockSnippet } = await import('./edit-panel');

const HEADER_ITEM = {
  contentId: 'h1',
  contentType: 'HEADER',
  content: { header: 'Summary' },
  layoutId: 'l1',
  layoutType: 'SINGLE',
};
const PARAGRAPH_ITEM = {
  contentId: 'p1',
  contentType: 'PARAGRAPH',
  content: { paragraph: 'A short bio.' },
  layoutId: 'left',
  layoutType: 'DOUBLE_LEFT',
  layoutParentId: 'd1',
};

beforeEach(() => {
  vi.useFakeTimers();
  openEditingViewMock.mockReset();
  onUpdateMock.mockReset();
  contextState.editingContentId = 'h1';
  contextState.items = [HEADER_ITEM, PARAGRAPH_ITEM];
  contextState.layouts = [
    { layoutId: 'l1', layoutType: 'SINGLE' },
    {
      layoutId: 'd1',
      layoutType: 'DOUBLE',
      layoutLeftId: 'left',
      layoutRightId: 'right',
    },
  ];
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EditPanel', () => {
  it("renders the editing block's form and focuses its first field", () => {
    const { container } = render(<EditPanel />);

    const input = container.querySelector(
      'input[name="header"]',
    ) as HTMLInputElement;
    expect(input.value).toBe('Summary');

    act(() => {
      vi.runAllTimers();
    });
    expect(document.activeElement).toBe(input);
  });

  it('lists blocks grouped by layout with plain-language names and snippets', () => {
    const { getByRole } = render(<EditPanel />);
    // Scoped to the picker: the form's own header also says
    // "Section heading".
    const picker = within(getByRole('navigation', { name: 'Blocks' }));

    expect(picker.getByText('Layout 1')).not.toBeNull();
    // The DOUBLE layout's populated half appears; its empty half doesn't.
    expect(picker.getByText('Layout 2 (Left)')).not.toBeNull();
    expect(picker.queryByText('Layout 2 (Right)')).toBeNull();

    expect(picker.getByText('Section heading')).not.toBeNull();
    expect(picker.getByText(/— Summary/)).not.toBeNull();
    expect(picker.getByText('Paragraph')).not.toBeNull();
  });

  it('marks the block being edited and switches blocks via openEditingView', () => {
    const { getByRole } = render(<EditPanel />);
    const picker = within(getByRole('navigation', { name: 'Blocks' }));

    expect(
      picker.getByText('Section heading').closest('button'),
    ).toHaveAttribute('aria-current', 'true');

    fireEvent.click(picker.getByText('Paragraph'));
    expect(openEditingViewMock).toHaveBeenCalledWith('p1');
  });

  it('falls back to a prompt when the editing target is not in state', () => {
    contextState.editingContentId = 'gone';
    const { getByText, container } = render(<EditPanel />);

    expect(getByText(/pick a block below/i)).not.toBeNull();
    expect(container.querySelector('form')).toBeNull();
  });

  it('has no automatically detectable accessibility violations', async () => {
    // axe.run schedules its own real timers internally -- it never
    // resolves under the suite's fake timers.
    vi.useRealTimers();
    const { container } = render(<EditPanel />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});

describe('blockSnippet', () => {
  it('uses the first non-empty string value of the content', () => {
    expect(blockSnippet({ title: '', company: 'Acme' })).toBe('Acme');
  });

  it("falls back to the first key for content with no string values (AnyList's shape)", () => {
    expect(blockSnippet({ Gears: ['First', 'Second'] })).toBe('Gears');
  });

  it('returns an empty string for empty content', () => {
    expect(blockSnippet({})).toBe('');
  });

  it('truncates long snippets', () => {
    const long = 'x'.repeat(40);
    expect(blockSnippet({ paragraph: long })).toBe(`${'x'.repeat(32)}…`);
  });
});
