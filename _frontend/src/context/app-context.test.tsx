import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LAYOUTS } from '@/constants';
import type { ContentAll } from '@/types/content-all';
import type { LayoutItem } from '@/types/layouts';

import { AppProvider, MOVE_ACTION, useAppContext } from './app-context';

const CONTACT_ITEM: ContentAll = {
  contentId: 'contact-1' as ContentAll['contentId'],
  contentType: 'CONTACT',
  layoutId: 'layout-1' as LayoutItem['layoutId'],
  layoutType: LAYOUTS.SINGLE,
  content: { name: 'Ada Lovelace' },
} as ContentAll;

const HEADER_ITEM: ContentAll = {
  contentId: 'header-1' as ContentAll['contentId'],
  contentType: 'HEADER',
  layoutId: 'layout-1' as LayoutItem['layoutId'],
  layoutType: LAYOUTS.SINGLE,
  content: { header: 'Summary' },
} as ContentAll;

const LAYOUT: LayoutItem = {
  layoutId: 'layout-1' as LayoutItem['layoutId'],
  layoutType: LAYOUTS.SINGLE,
};

function seedLocalStorage(items: ContentAll[], layouts: LayoutItem[]) {
  window.localStorage.setItem(
    'res-gen-data',
    JSON.stringify({ items, layouts }),
  );
}

function renderAppContext() {
  return renderHook(() => useAppContext(), {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
}

beforeEach(() => {
  seedLocalStorage([CONTACT_ITEM, HEADER_ITEM], [LAYOUT]);
});

afterEach(() => {
  window.localStorage.clear();
});

describe('useAppContext', () => {
  it('throws when used outside an AppProvider', () => {
    expect(() => renderHook(() => useAppContext())).toThrow(
      'useAppContext must be used within a AppProvider',
    );
  });

  it('loads items/layouts from localStorage when present', () => {
    const { result } = renderAppContext();

    expect(result.current.items).toEqual([CONTACT_ITEM, HEADER_ITEM]);
    expect(result.current.layouts).toEqual([LAYOUT]);
  });

  it('falls back to prepopulated example content when localStorage is empty', () => {
    window.localStorage.clear();
    const { result } = renderAppContext();

    expect(result.current.items.length).toBeGreaterThan(0);
    expect(result.current.layouts.length).toBeGreaterThan(0);
  });

  it('persists state changes to localStorage', () => {
    const { result } = renderAppContext();

    act(() => {
      result.current.removeLayout(LAYOUT.layoutId);
    });

    const stored = JSON.parse(window.localStorage.getItem('res-gen-data')!);
    expect(stored.layouts).toEqual([]);
  });

  describe('onCreate', () => {
    it('adds a new item with a generated contentId', () => {
      const { result } = renderAppContext();
      const newItem = {
        ...HEADER_ITEM,
        contentId: 'ignored' as ContentAll['contentId'],
      };

      act(() => {
        result.current.onCreate(newItem);
      });

      expect(result.current.items).toHaveLength(3);
      const created = result.current.items[2];
      expect(created.contentId).toBeTruthy();
      expect(created.contentId).not.toBe('ignored');
    });

    it('records the generated contentId as lastCreatedContentId', () => {
      const { result } = renderAppContext();

      expect(result.current.lastCreatedContentId).toBeNull();

      act(() => {
        result.current.onCreate({
          ...HEADER_ITEM,
          contentId: 'ignored' as ContentAll['contentId'],
        });
      });

      const created = result.current.items[2];
      expect(result.current.lastCreatedContentId).toBe(created.contentId);
    });
  });

  describe('onUpdate', () => {
    it('replaces the item matching contentId', () => {
      const { result } = renderAppContext();
      const updated = { ...CONTACT_ITEM, content: { name: 'Grace Hopper' } };

      act(() => {
        result.current.onUpdate(updated);
      });

      expect(result.current.items[0]).toEqual(updated);
    });
  });

  describe('onDelete', () => {
    it('removes the item matching contentId', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.onDelete({ contentId: CONTACT_ITEM.contentId });
      });

      expect(result.current.items).toEqual([HEADER_ITEM]);
    });
  });

  describe('onMove', () => {
    it('MACRO_UP moves the item one position earlier', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.onMove(MOVE_ACTION.MACRO_UP, HEADER_ITEM.contentId);
      });

      expect(result.current.items).toEqual([HEADER_ITEM, CONTACT_ITEM]);
    });

    it('MACRO_DOWN moves the item one position later', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.onMove(MOVE_ACTION.MACRO_DOWN, CONTACT_ITEM.contentId);
      });

      expect(result.current.items).toEqual([HEADER_ITEM, CONTACT_ITEM]);
    });

    it('throws for an unsupported action', () => {
      const { result } = renderAppContext();

      expect(() => {
        act(() => {
          result.current.onMove(
            MOVE_ACTION.LAYOUT_NEXT,
            CONTACT_ITEM.contentId,
          );
        });
      }).toThrow('Unsupported move action LAYOUT_NEXT');
    });

    describe('zone awareness (specs/editor-redesign.md, Phase 7)', () => {
      // Flat order interleaves two zones: [A(z1), X(z2), B(z1)] -- the
      // adjacent flat index of B is X, but B's nearest same-zone
      // neighbor is A.
      const ITEM_A = {
        ...CONTACT_ITEM,
        contentId: 'a' as ContentAll['contentId'],
      };
      const ITEM_X_OTHER_ZONE = {
        ...HEADER_ITEM,
        contentId: 'x' as ContentAll['contentId'],
        layoutId: 'layout-2' as LayoutItem['layoutId'],
      };
      const ITEM_B = {
        ...HEADER_ITEM,
        contentId: 'b' as ContentAll['contentId'],
      };
      const SECOND_LAYOUT: LayoutItem = {
        layoutId: 'layout-2' as LayoutItem['layoutId'],
        layoutType: LAYOUTS.SINGLE,
      };

      beforeEach(() => {
        seedLocalStorage(
          [ITEM_A, ITEM_X_OTHER_ZONE, ITEM_B],
          [LAYOUT, SECOND_LAYOUT],
        );
      });

      it("MACRO_UP swaps with the nearest same-zone item, skipping other zones' items", () => {
        const { result } = renderAppContext();

        act(() => {
          result.current.onMove(MOVE_ACTION.MACRO_UP, ITEM_B.contentId);
        });

        // B swapped with A -- X (a different layout) kept its position.
        expect(result.current.items).toEqual([
          ITEM_B,
          ITEM_X_OTHER_ZONE,
          ITEM_A,
        ]);
      });

      it('a real move pushes a "Block moved" snapshot that performUndo restores', () => {
        const { result } = renderAppContext();
        const before = result.current.items;

        act(() => {
          result.current.onMove(MOVE_ACTION.MACRO_UP, ITEM_B.contentId);
        });
        expect(result.current.undoSnapshot?.description).toBe('Block moved');

        act(() => {
          result.current.performUndo();
        });
        expect(result.current.items).toEqual(before);
      });

      it('a zone-boundary no-op pushes no snapshot and preserves a pending one', () => {
        const { result } = renderAppContext();

        act(() => {
          result.current.pushUndoSnapshot('Something real');
        });
        act(() => {
          // X is the only item in its zone -- moving it is a no-op.
          result.current.onMove(
            MOVE_ACTION.MACRO_UP,
            ITEM_X_OTHER_ZONE.contentId,
          );
        });

        expect(result.current.undoSnapshot?.description).toBe('Something real');
      });

      it('MACRO_DOWN skips other zones the same way', () => {
        const { result } = renderAppContext();

        act(() => {
          result.current.onMove(MOVE_ACTION.MACRO_DOWN, ITEM_A.contentId);
        });

        expect(result.current.items).toEqual([
          ITEM_B,
          ITEM_X_OTHER_ZONE,
          ITEM_A,
        ]);
      });

      it('is a no-op for the first item of a zone moving up, even mid-array', () => {
        const { result } = renderAppContext();
        const before = result.current.items;

        act(() => {
          // X is mid-array but the only item in its zone.
          result.current.onMove(
            MOVE_ACTION.MACRO_UP,
            ITEM_X_OTHER_ZONE.contentId,
          );
        });

        expect(result.current.items).toBe(before);
      });

      it('is a no-op for the last item of a zone moving down', () => {
        const { result } = renderAppContext();
        const before = result.current.items;

        act(() => {
          result.current.onMove(
            MOVE_ACTION.MACRO_DOWN,
            ITEM_X_OTHER_ZONE.contentId,
          );
        });

        expect(result.current.items).toBe(before);
      });
    });
  });

  describe('layouts', () => {
    it('addLayout appends a new layout', () => {
      const { result } = renderAppContext();
      const newLayout: LayoutItem = {
        layoutId: 'layout-2' as LayoutItem['layoutId'],
        layoutType: LAYOUTS.SINGLE,
      };

      act(() => {
        result.current.addLayout(newLayout);
      });

      expect(result.current.layouts).toEqual([LAYOUT, newLayout]);
    });

    it('addLayoutAt inserts a layout at a specific position, not just the end', () => {
      const { result } = renderAppContext();
      const newLayout: LayoutItem = {
        layoutId: 'layout-2' as LayoutItem['layoutId'],
        layoutType: LAYOUTS.SINGLE,
      };

      act(() => {
        result.current.addLayoutAt(newLayout, 0);
      });

      expect(result.current.layouts).toEqual([newLayout, LAYOUT]);
    });

    describe('moveLayout', () => {
      const LAYOUT_B: LayoutItem = {
        layoutId: 'layout-b' as LayoutItem['layoutId'],
        layoutType: LAYOUTS.SINGLE,
      };
      const LAYOUT_C: LayoutItem = {
        layoutId: 'layout-c' as LayoutItem['layoutId'],
        layoutType: LAYOUTS.SINGLE,
      };

      function renderWithThreeLayouts() {
        const rendered = renderAppContext();

        act(() => {
          rendered.result.current.addLayout(LAYOUT_B);
        });
        act(() => {
          rendered.result.current.addLayout(LAYOUT_C);
        });

        return rendered;
      }

      it('moves a layout down into a later gap', () => {
        const { result } = renderWithThreeLayouts();

        act(() => {
          // First layout into the gap below the second.
          result.current.moveLayout(0, 2);
        });

        expect(result.current.layouts).toEqual([LAYOUT_B, LAYOUT, LAYOUT_C]);
      });

      it('moves a layout up into an earlier gap', () => {
        const { result } = renderWithThreeLayouts();

        act(() => {
          // Last layout into the gap above the first.
          result.current.moveLayout(2, 0);
        });

        expect(result.current.layouts).toEqual([LAYOUT_C, LAYOUT, LAYOUT_B]);
      });

      it("treats a layout's own adjacent gaps as a no-op, keeping the same array reference", () => {
        const { result } = renderWithThreeLayouts();
        const before = result.current.layouts;

        act(() => {
          result.current.moveLayout(1, 1); // gap directly above itself
        });
        expect(result.current.layouts).toBe(before);

        act(() => {
          result.current.moveLayout(1, 2); // gap directly below itself
        });
        expect(result.current.layouts).toBe(before);
      });

      it('a real move pushes a "Layout moved" snapshot that performUndo restores', () => {
        const { result } = renderWithThreeLayouts();
        const before = result.current.layouts;

        act(() => {
          result.current.moveLayout(0, 3);
        });
        expect(result.current.undoSnapshot?.description).toBe('Layout moved');

        act(() => {
          result.current.performUndo();
        });
        expect(result.current.layouts).toEqual(before);
      });

      it('an adjacent-gap no-op pushes no snapshot and preserves a pending one', () => {
        const { result } = renderWithThreeLayouts();

        act(() => {
          result.current.pushUndoSnapshot('Something real');
        });
        act(() => {
          result.current.moveLayout(1, 2);
        });

        expect(result.current.undoSnapshot?.description).toBe('Something real');
      });
    });

    it('removeLayout removes a specific layout by id and drops its orphaned items', () => {
      const { result } = renderAppContext();
      const secondLayout: LayoutItem = {
        layoutId: 'layout-2' as LayoutItem['layoutId'],
        layoutType: LAYOUTS.SINGLE,
      };

      act(() => {
        result.current.addLayout(secondLayout);
      });

      act(() => {
        result.current.removeLayout(LAYOUT.layoutId);
      });

      expect(result.current.layouts).toEqual([secondLayout]);
      expect(result.current.items).toEqual([]);
    });

    it('removeLayout is a no-op when the id does not match any layout', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.removeLayout('does-not-exist' as LayoutItem['layoutId']);
      });

      expect(result.current.layouts).toEqual([LAYOUT]);
    });
  });

  describe('canvas focus (specs/canvas-edit-panel.md)', () => {
    it('focusCanvasBlock selects a block; blurCanvasBlock clears only if it still owns focus', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.focusCanvasBlock(CONTACT_ITEM.contentId);
      });
      expect(result.current.canvasEditingContentId).toBe(
        CONTACT_ITEM.contentId,
      );

      // A stale blur from a different block never stomps fresh focus.
      act(() => {
        result.current.blurCanvasBlock(HEADER_ITEM.contentId);
      });
      expect(result.current.canvasEditingContentId).toBe(
        CONTACT_ITEM.contentId,
      );

      act(() => {
        result.current.blurCanvasBlock(CONTACT_ITEM.contentId);
      });
      expect(result.current.canvasEditingContentId).toBeNull();
    });
  });

  describe('editing sessions (specs/edit-with-live-pdf-preview.md)', () => {
    it('openEditingView selects the block and opens the modal', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.openEditingView(CONTACT_ITEM.contentId);
      });

      expect(result.current.editingContentId).toBe(CONTACT_ITEM.contentId);
      expect(result.current.isModalOpen).toBe(true);
    });

    it('closing after a save pushes a "Block edited" snapshot that restores the pre-session state', () => {
      const { result } = renderAppContext();
      const before = result.current.items;

      act(() => {
        result.current.openEditingView(CONTACT_ITEM.contentId);
      });
      act(() => {
        result.current.onUpdate({
          ...CONTACT_ITEM,
          content: { name: 'Grace Hopper' },
        } as ContentAll);
      });
      act(() => {
        result.current.togglePdfModal(false);
      });

      expect(result.current.editingContentId).toBeNull();
      expect(result.current.undoSnapshot?.description).toBe('Block edited');

      act(() => {
        result.current.performUndo();
      });
      expect(result.current.items).toEqual(before);
    });

    it('closing without a save pushes no snapshot', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.openEditingView(CONTACT_ITEM.contentId);
      });
      act(() => {
        result.current.togglePdfModal(false);
      });

      expect(result.current.undoSnapshot).toBeNull();
    });

    it('switching blocks mid-session keeps the original capture: one undo reverts everything', () => {
      const { result } = renderAppContext();
      const before = result.current.items;

      act(() => {
        result.current.openEditingView(CONTACT_ITEM.contentId);
      });
      act(() => {
        result.current.onUpdate({
          ...CONTACT_ITEM,
          content: { name: 'Grace Hopper' },
        } as ContentAll);
      });
      act(() => {
        result.current.openEditingView(HEADER_ITEM.contentId);
      });
      act(() => {
        result.current.onUpdate({
          ...HEADER_ITEM,
          content: { header: 'Objectives' },
        } as ContentAll);
      });
      act(() => {
        result.current.togglePdfModal(false);
      });

      act(() => {
        result.current.performUndo();
      });
      expect(result.current.items).toEqual(before);
    });

    it('a view-only open/close never pushes a snapshot', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.togglePdfModal(true);
      });
      act(() => {
        result.current.togglePdfModal(false);
      });

      expect(result.current.undoSnapshot).toBeNull();
      expect(result.current.editingContentId).toBeNull();
    });
  });

  describe('visibility toggles', () => {
    it('togglePdfModal with no argument flips isModalOpen', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.togglePdfModal();
      });

      expect(result.current.isModalOpen).toBe(true);
    });

    it('togglePdfModal with an explicit value sets it directly', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.togglePdfModal(true);
      });
      expect(result.current.isModalOpen).toBe(true);

      act(() => {
        result.current.togglePdfModal(false);
      });
      expect(result.current.isModalOpen).toBe(false);
    });
  });

  describe('title', () => {
    it('slugifies the contact name into the PDF title when a CONTACT item exists', () => {
      const { result } = renderAppContext();

      expect(result.current.title).toMatch(
        /^\d{2}-\d{2}-\d{2}-ada-lovelace\.pdf$/,
      );
    });

    it('falls back to a generic title when no CONTACT item exists', () => {
      seedLocalStorage([HEADER_ITEM], [LAYOUT]);
      const { result } = renderAppContext();

      expect(result.current.title).toMatch(
        /^\d{2}-\d{2}-\d{2}-your-name\.pdf$/,
      );
    });
  });

  describe('undo', () => {
    it('starts with no undo snapshot', () => {
      const { result } = renderAppContext();

      expect(result.current.undoSnapshot).toBeNull();
    });

    it('pushUndoSnapshot captures the current items/layouts with a description', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.pushUndoSnapshot('Layout 1 removed');
      });

      expect(result.current.undoSnapshot).toEqual({
        items: [CONTACT_ITEM, HEADER_ITEM],
        layouts: [LAYOUT],
        description: 'Layout 1 removed',
      });
    });

    it('a second pushUndoSnapshot replaces the previous one instead of stacking', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.pushUndoSnapshot('First action');
      });
      act(() => {
        result.current.onDelete({ contentId: CONTACT_ITEM.contentId });
      });
      act(() => {
        result.current.pushUndoSnapshot('Second action');
      });

      expect(result.current.undoSnapshot).toEqual({
        items: [HEADER_ITEM],
        layouts: [LAYOUT],
        description: 'Second action',
      });
    });

    it('performUndo restores the snapshotted items/layouts and clears the buffer', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.pushUndoSnapshot('Layout 1 removed');
      });
      act(() => {
        result.current.removeLayout(LAYOUT.layoutId);
      });
      expect(result.current.layouts).toEqual([]);

      act(() => {
        result.current.performUndo();
      });

      expect(result.current.layouts).toEqual([LAYOUT]);
      expect(result.current.items).toEqual([CONTACT_ITEM, HEADER_ITEM]);
      expect(result.current.undoSnapshot).toBeNull();
    });

    it('performUndo is a no-op when there is nothing to undo', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.performUndo();
      });

      expect(result.current.items).toEqual([CONTACT_ITEM, HEADER_ITEM]);
      expect(result.current.layouts).toEqual([LAYOUT]);
    });

    it('dismissUndo clears the buffer without restoring anything', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.pushUndoSnapshot('Layout 1 removed');
      });
      act(() => {
        result.current.removeLayout(LAYOUT.layoutId);
      });

      act(() => {
        result.current.dismissUndo();
      });

      expect(result.current.undoSnapshot).toBeNull();
      expect(result.current.layouts).toEqual([]);
    });
  });

  describe('onImportFile', () => {
    it('replaces items and layouts wholesale', () => {
      const { result } = renderAppContext();
      const newLayout: LayoutItem = {
        layoutId: 'layout-9' as LayoutItem['layoutId'],
        layoutType: LAYOUTS.SINGLE,
      };
      const newItem = { ...HEADER_ITEM, layoutId: newLayout.layoutId };

      act(() => {
        result.current.onImportFile({ items: [newItem], layouts: [newLayout] });
      });

      expect(result.current.items).toEqual([newItem]);
      expect(result.current.layouts).toEqual([newLayout]);
    });
  });
});
