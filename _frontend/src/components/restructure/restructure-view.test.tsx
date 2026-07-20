import { fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ContentAll } from '@/types/content-all';
import type { ContentId, LayoutId } from '@/types/content-base-item';
import type { LayoutItem } from '@/types/layouts';

import { MACRO_DRAG_MIME } from './restructure-palette-card';

const { toggleRestructure, onImportFile, pushUndoSnapshot, contextState } =
  vi.hoisted(() => ({
    toggleRestructure: vi.fn(),
    onImportFile: vi.fn(),
    pushUndoSnapshot: vi.fn(),
    contextState: {
      items: [] as ContentAll[],
      layouts: [] as LayoutItem[],
    },
  }));

vi.mock('@/context/app-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/context/app-context')>();
  return {
    ...actual,
    useAppContext: () => ({
      items: contextState.items,
      layouts: contextState.layouts,
      toggleRestructure,
      onImportFile,
      pushUndoSnapshot,
    }),
  };
});

const { default: RestructureView } = await import('./restructure-view');

function macro(id: string, type: string, content: unknown): ContentAll {
  return {
    contentId: id as ContentId,
    contentType: type,
    content,
    layoutId: 'a' as LayoutId,
    layoutType: 'SINGLE',
  } as ContentAll;
}

// The non-layout "Remove <type>" buttons -- i.e. placed macros, not the
// box's own "Remove Layout N".
const stagingMacroRemovers = /^Remove (?!Layout)/;

beforeEach(() => {
  toggleRestructure.mockReset();
  onImportFile.mockReset();
  pushUndoSnapshot.mockReset();
  contextState.items = [
    macro('h1', 'HEADER', { header: 'Summary' }),
    macro('c1', 'CONTACT', { name: 'Ada Lovelace' }),
  ];
  contextState.layouts = [{ layoutId: 'a' as LayoutId, layoutType: 'SINGLE' }];
});

describe('RestructureView', () => {
  it('shows both panes, the palette cards, and a staging copy of the resume', () => {
    const { getByLabelText, getAllByTestId } = render(<RestructureView />);

    expect(getByLabelText('Your resume')).not.toBeNull();
    expect(getByLabelText('New structure')).not.toBeNull();
    expect(getAllByTestId('palette-card')).toHaveLength(2);
    // Copy-on-open: staging already mirrors the one existing layout.
    expect(getAllByTestId('staging-zone')).toHaveLength(1);
  });

  it('adds a one-column and a two-column box', () => {
    const { getByText, getAllByTestId } = render(<RestructureView />);

    fireEvent.click(getByText('+ One column'));
    expect(getAllByTestId('staging-zone')).toHaveLength(2);

    fireEvent.click(getByText('+ Two columns'));
    // The DOUBLE adds two more zones.
    expect(getAllByTestId('staging-zone')).toHaveLength(4);
  });

  it('Clear empties the staging pane', () => {
    const { getByText, queryAllByTestId } = render(<RestructureView />);

    fireEvent.click(getByText('Clear'));

    expect(queryAllByTestId('staging-zone')).toHaveLength(0);
    expect(getByText('Add a box, then drag macros into it.')).not.toBeNull();
  });

  it('Cancel closes the view without applying', () => {
    const { getByText } = render(<RestructureView />);
    fireEvent.click(getByText('Cancel'));
    expect(toggleRestructure).toHaveBeenCalledWith(false);
    expect(onImportFile).not.toHaveBeenCalled();
  });

  it('Apply commits the staging arrangement behind an undo snapshot, then closes', () => {
    const { getByText } = render(<RestructureView />);

    fireEvent.click(getByText('Apply'));

    expect(pushUndoSnapshot).toHaveBeenCalledWith('Resume restructured');
    expect(onImportFile).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.any(Array),
        layouts: expect.any(Array),
      }),
    );
    expect(toggleRestructure).toHaveBeenCalledWith(false);
  });

  it('places a copy via the palette "Send to…" menu', () => {
    const { getAllByTestId, getByRole, getAllByLabelText } = render(
      <RestructureView />,
    );
    expect(getAllByLabelText(stagingMacroRemovers)).toHaveLength(2);

    // Send the first palette card to the (only) staging zone.
    const firstCard = getAllByTestId('palette-card')[0];
    fireEvent.click(
      firstCard.querySelector('[aria-haspopup="true"]') as HTMLElement,
    );
    fireEvent.click(getByRole('menuitem', { name: 'Layout 1' }));

    expect(getAllByLabelText(stagingMacroRemovers)).toHaveLength(3);
  });

  it('ignores a drop whose contentId is not a known macro', () => {
    const { getByTestId, getAllByLabelText } = render(<RestructureView />);
    expect(getAllByLabelText(stagingMacroRemovers)).toHaveLength(2);

    fireEvent.drop(getByTestId('staging-zone'), {
      dataTransfer: { getData: () => 'ghost-id' },
    });

    // Unknown id resolves to no source -> nothing placed.
    expect(getAllByLabelText(stagingMacroRemovers)).toHaveLength(2);
  });

  it('places a copy via a native drop of a known macro', () => {
    const { getByTestId, getAllByLabelText } = render(<RestructureView />);

    fireEvent.drop(getByTestId('staging-zone'), {
      dataTransfer: {
        getData: (type: string) => (type === MACRO_DRAG_MIME ? 'h1' : ''),
      },
    });

    expect(getAllByLabelText(stagingMacroRemovers)).toHaveLength(3);
  });

  it('reorders palette cards by dropping one into a gap', () => {
    const { getAllByTestId } = render(<RestructureView />);

    const cardText = () =>
      getAllByTestId('palette-card').map((card) => card.textContent);

    // Fixture order: the HEADER ("Summary") then the CONTACT ("Ada Lovelace").
    expect(cardText()[0]).toContain('Summary');
    expect(cardText()[1]).toContain('Ada Lovelace');

    // Drop the CONTACT card (c1) into the first gap -- the one above the
    // HEADER card -- so it moves to the top of the zone.
    const firstGap = getAllByTestId('palette-gap')[0];
    fireEvent.drop(firstGap, {
      dataTransfer: {
        getData: (type: string) => (type === MACRO_DRAG_MIME ? 'c1' : ''),
      },
    });

    expect(cardText()[0]).toContain('Ada Lovelace');
    expect(cardText()[1]).toContain('Summary');
  });

  it('moves a palette card to the end of its zone via the trailing gap', () => {
    const { getAllByTestId } = render(<RestructureView />);
    const cardText = () =>
      getAllByTestId('palette-card').map((card) => card.textContent);

    // Gaps for the single zone: [before h1, before c1, trailing]. Drop the
    // HEADER (h1) into the trailing gap to send it to the bottom.
    const gaps = getAllByTestId('palette-gap');
    fireEvent.drop(gaps[gaps.length - 1], {
      dataTransfer: {
        getData: (type: string) => (type === MACRO_DRAG_MIME ? 'h1' : ''),
      },
    });

    expect(cardText()[0]).toContain('Ada Lovelace');
    expect(cardText()[1]).toContain('Summary');
  });

  it('handles dropping a zone’s only card into its trailing gap (a no-op)', () => {
    // Two single-item zones: dropping zone-a's lone card into zone-a's own
    // trailing gap leaves the order unchanged (empty-zone insertion path).
    contextState.layouts = [
      { layoutId: 'a' as LayoutId, layoutType: 'SINGLE' },
      { layoutId: 'b' as LayoutId, layoutType: 'SINGLE' },
    ];
    contextState.items = [
      macro('h1', 'HEADER', { header: 'Summary' }),
      {
        ...macro('p1', 'PARAGRAPH', { paragraph: 'Other zone' }),
        layoutId: 'b',
      },
    ] as ContentAll[];

    const { getAllByTestId } = render(<RestructureView />);
    const order = () =>
      getAllByTestId('palette-card').map((card) => card.textContent);
    const before = order();

    // Gaps: [before h1, trailing-a, before p1, trailing-b]; index 1 is
    // zone a's trailing gap.
    fireEvent.drop(getAllByTestId('palette-gap')[1], {
      dataTransfer: {
        getData: (type: string) => (type === MACRO_DRAG_MIME ? 'h1' : ''),
      },
    });

    expect(order()).toEqual(before);
  });

  it('ignores a palette gap drop that carries no card id', () => {
    const { getAllByTestId } = render(<RestructureView />);
    const order = () =>
      getAllByTestId('palette-card').map((card) => card.textContent);
    const before = order();

    fireEvent.drop(getAllByTestId('palette-gap')[0], {
      dataTransfer: { getData: () => '' },
    });

    expect(order()).toEqual(before);
  });

  it('highlights a palette gap while a card is dragged over it, then clears', () => {
    const { getAllByTestId } = render(<RestructureView />);
    const gap = getAllByTestId('palette-gap')[0];

    expect(gap.className).not.toContain('outline-cyan-400');
    fireEvent.dragOver(gap);
    expect(gap.className).toContain('outline-cyan-400');
    fireEvent.dragLeave(gap);
    expect(gap.className).not.toContain('outline-cyan-400');
  });

  it('ignores a palette drop whose card is from another zone', () => {
    contextState.layouts = [
      { layoutId: 'a' as LayoutId, layoutType: 'SINGLE' },
      { layoutId: 'b' as LayoutId, layoutType: 'SINGLE' },
    ];
    contextState.items = [
      macro('h1', 'HEADER', { header: 'Summary' }),
      {
        ...macro('p1', 'PARAGRAPH', { paragraph: 'Other zone' }),
        layoutId: 'b',
      },
    ] as ContentAll[];

    const { getAllByTestId } = render(<RestructureView />);
    const order = () =>
      getAllByTestId('palette-card').map((card) => card.textContent);
    const before = order();

    // Drop the zone-b paragraph into the (zone-a) first gap: cross-zone, so
    // it's a no-op.
    fireEvent.drop(getAllByTestId('palette-gap')[0], {
      dataTransfer: {
        getData: (type: string) => (type === MACRO_DRAG_MIME ? 'p1' : ''),
      },
    });

    expect(order()).toEqual(before);
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<RestructureView />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
