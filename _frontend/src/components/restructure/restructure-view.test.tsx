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

  it('has no automatically detectable accessibility violations', async () => {
    const { container } = render(<RestructureView />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
