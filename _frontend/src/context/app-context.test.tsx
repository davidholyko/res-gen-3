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
    JSON.stringify({ items, layouts, isEditorVisible: true }),
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
      result.current.toggleEditor();
    });

    const stored = JSON.parse(window.localStorage.getItem('res-gen-data')!);
    expect(stored.isEditorVisible).toBe(false);
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

    it('popLayout removes the last layout and drops orphaned items', () => {
      const { result } = renderAppContext();

      act(() => {
        result.current.popLayout();
      });

      expect(result.current.layouts).toEqual([]);
      expect(result.current.items).toEqual([]);
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

  describe('visibility toggles', () => {
    it('toggleEditor flips isEditorVisible', () => {
      const { result } = renderAppContext();
      const initial = result.current.isEditorVisible;

      act(() => {
        result.current.toggleEditor();
      });

      expect(result.current.isEditorVisible).toBe(!initial);
    });

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
