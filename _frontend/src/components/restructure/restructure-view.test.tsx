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
  it('shows both panes, the outline cards, and a staging copy of the resume', () => {
    const { getByLabelText, getAllByTestId } = render(<RestructureView />);

    expect(getByLabelText('Staging outline')).not.toBeNull();
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

  it('Clear empties both panes -- the outline mirrors the emptied staging', () => {
    const { getByText, queryAllByTestId } = render(<RestructureView />);

    fireEvent.click(getByText('Clear'));

    expect(queryAllByTestId('staging-zone')).toHaveLength(0);
    // The outline is a mirror, so it empties too; the hint points at
    // Cancel as the way back (specs/restructure-palette-mirror.md).
    expect(queryAllByTestId('palette-card')).toHaveLength(0);
    expect(
      getByText(
        'Add a box to start building. Cancel brings back your resume unchanged.',
      ),
    ).not.toBeNull();
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

  it('moves a block to another box via the "Move to…" menu -- both panes update, nothing duplicates', () => {
    const { getAllByTestId, getByText, getByRole, getAllByLabelText } = render(
      <RestructureView />,
    );
    // A second, empty box to move into.
    fireEvent.click(getByText('+ One column'));
    expect(getAllByLabelText(stagingMacroRemovers)).toHaveLength(2);

    // Move the first outline card (the HEADER) to the new Layout 2.
    const firstCard = getAllByTestId('palette-card')[0];
    fireEvent.click(
      firstCard.querySelector('[aria-haspopup="true"]') as HTMLElement,
    );
    fireEvent.click(getByRole('menuitem', { name: 'Layout 2' }));

    // Still two blocks total (a move, not a copy)...
    expect(getAllByLabelText(stagingMacroRemovers)).toHaveLength(2);
    expect(getAllByTestId('palette-card')).toHaveLength(2);
    // ...and the outline regrouped it under Layout 2 (the last card now).
    const cards = getAllByTestId('palette-card');
    expect(cards[cards.length - 1].textContent).toContain('Summary');
  });

  it('ignores a drop whose contentId is not a known macro', () => {
    const { getByTestId, getAllByLabelText } = render(<RestructureView />);
    expect(getAllByLabelText(stagingMacroRemovers)).toHaveLength(2);

    fireEvent.drop(getByTestId('staging-zone'), {
      dataTransfer: { getData: () => 'ghost-id' },
    });

    // Unknown id resolves to no staging block -> nothing moves.
    expect(getAllByLabelText(stagingMacroRemovers)).toHaveLength(2);
  });

  it('moves a block via a native drop on a staging zone', () => {
    const { getAllByTestId, getByText, getAllByLabelText } = render(
      <RestructureView />,
    );
    fireEvent.click(getByText('+ One column'));

    // Drop the HEADER onto the new (second, empty) zone: it moves there.
    fireEvent.drop(getAllByTestId('staging-zone')[1], {
      dataTransfer: {
        getData: (type: string) => (type === MACRO_DRAG_MIME ? 'h1' : ''),
      },
    });

    // Move, not copy: still two blocks, and the second zone now has one.
    expect(getAllByLabelText(stagingMacroRemovers)).toHaveLength(2);
    expect(getAllByTestId('staging-zone')[1].textContent).toContain('Summary');
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

  it('live-updates the styled preview when a palette card is reordered', () => {
    const { getByLabelText, getAllByTestId } = render(<RestructureView />);
    const preview = getByLabelText('New structure');
    const order = () => ({
      summary: preview.textContent?.indexOf('Summary') ?? -1,
      contact: preview.textContent?.indexOf('Ada Lovelace') ?? -1,
    });

    // Preview starts with the HEADER above the CONTACT.
    expect(order().summary).toBeLessThan(order().contact);

    // Drop the CONTACT card into the gap above the HEADER; the styled
    // preview on the left should reorder to match.
    fireEvent.drop(getAllByTestId('palette-gap')[0], {
      dataTransfer: {
        getData: (type: string) => (type === MACRO_DRAG_MIME ? 'c1' : ''),
      },
    });

    expect(order().contact).toBeLessThan(order().summary);
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

  it('opens only the meaningful gaps while a card is dragged, not the ones hugging it', () => {
    const { getAllByTestId } = render(<RestructureView />);
    // Fixture: [gap before h1][h1][gap before c1][c1][trailing gap].
    const gaps = () => getAllByTestId('palette-gap');
    const h1Card = getAllByTestId('palette-card')[0];

    // At rest every gap is a hairline.
    gaps().forEach((g) => expect(g.className).toContain('h-0.5'));

    // Dragging the HEADER (h1): the two gaps flanking it -- above it and
    // below it (before c1) -- stay collapsed no-ops; only the trailing gap,
    // a real move to the end, opens.
    fireEvent.dragStart(h1Card, {
      dataTransfer: { setData: vi.fn(), effectAllowed: '' },
    });
    expect(gaps()[0].className).toContain('h-0.5'); // above h1 (no-op)
    expect(gaps()[1].className).toContain('h-0.5'); // below h1 (no-op)
    expect(gaps()[2].className).toContain('border-cyan-300'); // to the end

    // Ending the drag collapses everything back.
    fireEvent.dragEnd(h1Card);
    gaps().forEach((g) => expect(g.className).toContain('h-0.5'));
  });

  it('opens other zones’ gaps too while dragging -- cross-zone moves are live targets', () => {
    contextState.layouts = [
      { layoutId: 'a' as LayoutId, layoutType: 'SINGLE' },
      { layoutId: 'b' as LayoutId, layoutType: 'SINGLE' },
    ];
    contextState.items = [
      macro('h1', 'HEADER', { header: 'Summary' }),
      { ...macro('c1', 'CONTACT', { name: 'Ada Lovelace' }), layoutId: 'a' },
      // Zone b is intentionally empty -- it still renders its trailing gap.
    ] as ContentAll[];

    const { getAllByTestId } = render(<RestructureView />);
    // Gaps: [before h1][before c1][trailing a] for zone a, then [trailing b].
    const gaps = () => getAllByTestId('palette-gap');
    const zoneBTrailingGap = () => gaps()[gaps().length - 1];

    fireEvent.dragStart(getAllByTestId('palette-card')[0], {
      dataTransfer: { setData: vi.fn(), effectAllowed: '' },
    });

    // Dragging a zone-a card opens zone b's gap: dropping there moves the
    // block into zone b (specs/restructure-palette-mirror.md).
    expect(zoneBTrailingGap().className).toContain('border-cyan-300');
  });

  it('treats dropping a card into its own gap as a no-op', () => {
    const { getAllByTestId } = render(<RestructureView />);
    const order = () =>
      getAllByTestId('palette-card').map((card) => card.textContent);
    const before = order();

    // Gap 0 is directly above the HEADER (h1); dropping h1 there would put
    // it just above itself -- no move.
    fireEvent.drop(getAllByTestId('palette-gap')[0], {
      dataTransfer: {
        getData: (type: string) => (type === MACRO_DRAG_MIME ? 'h1' : ''),
      },
    });

    expect(order()).toEqual(before);
  });

  it('a cross-zone gap drop moves the block into that zone at that exact position', () => {
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

    const { getAllByTestId, getByLabelText } = render(<RestructureView />);

    // Drop the zone-b paragraph into the (zone-a) gap above the HEADER: it
    // moves into zone a, just above the HEADER, in both panes.
    fireEvent.drop(getAllByTestId('palette-gap')[0], {
      dataTransfer: {
        getData: (type: string) => (type === MACRO_DRAG_MIME ? 'p1' : ''),
      },
    });

    const order = getAllByTestId('palette-card').map(
      (card) => card.textContent,
    );
    expect(order[0]).toContain('Other zone');
    expect(order[1]).toContain('Summary');
    // The styled preview's first zone mirrors the same move.
    const firstZone = getByLabelText('Layout 1 drop zone');
    expect(firstZone.textContent).toContain('Other zone');
  });

  it('mirrors staging edits into the outline: removing a block drops its card', () => {
    const { getAllByTestId, getAllByLabelText } = render(<RestructureView />);
    expect(getAllByTestId('palette-card')).toHaveLength(2);

    // Remove the HEADER via the staging pane's own gutter control.
    fireEvent.click(getAllByLabelText('Remove Section heading')[0]);

    // The outline re-renders from the same staging state -- one card left.
    const cards = getAllByTestId('palette-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain('Ada Lovelace');
  });

  it('collapses the open gaps after a drop, even though the moved card never fires dragend', () => {
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
    const gaps = () => getAllByTestId('palette-gap');

    // A drag opens the meaningful gaps...
    fireEvent.dragStart(getAllByTestId('palette-card')[0], {
      dataTransfer: { setData: vi.fn(), effectAllowed: '' },
    });
    expect(gaps().some((g) => g.className.includes('border-cyan-300'))).toBe(
      true,
    );

    // ...and a successful cross-zone drop closes them again. No dragEnd is
    // fired here on purpose: the real browser never fires it on a moved
    // card (its DOM node was replaced by the re-render), so the drop
    // itself must end the drag.
    fireEvent.drop(gaps()[gaps().length - 1], {
      dataTransfer: {
        getData: (type: string) => (type === MACRO_DRAG_MIME ? 'h1' : ''),
      },
    });

    gaps().forEach((g) => expect(g.className).toContain('h-0.5'));
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<RestructureView />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
