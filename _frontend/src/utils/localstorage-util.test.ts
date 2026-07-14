import { afterEach, describe, expect, it, vi } from 'vitest';

import { LocalStorageUtil } from './localstorage-util';

afterEach(() => {
  window.localStorage.clear();
});

describe('LocalStorageUtil', () => {
  it('data getter returns {} when nothing is stored', () => {
    const util = new LocalStorageUtil();

    expect(util.data).toEqual({});
  });

  it('data setter/getter round-trips through localStorage', () => {
    const util = new LocalStorageUtil();
    const value = { items: [], layouts: [] };

    util.data = value;

    expect(util.data).toEqual(value);
    expect(window.localStorage.getItem('res-gen-data')).toBe(
      JSON.stringify(value),
    );
  });

  it('ignores the isEditorVisible key older saves carry (retired ribbon toggle)', () => {
    const util = new LocalStorageUtil();

    util.data = { items: [], layouts: [], isEditorVisible: true };

    expect(util.data.layouts).toEqual([]);
  });

  describe('isEmpty / layouts / items', () => {
    it('falls back to prepopulated example content when nothing is stored', () => {
      const util = new LocalStorageUtil();

      expect(util.isEmpty()).toBe(false);
      expect(util.items.length).toBeGreaterThan(0);
      expect(util.layouts.length).toBeGreaterThan(0);
    });

    it('uses the stored items/layouts once both are present', () => {
      const util = new LocalStorageUtil();
      const stored = {
        items: [{ contentId: 'a' }],
        layouts: [{ layoutId: 'b' }],
      };

      util.data = stored;

      expect(util.isEmpty()).toBe(true);
      expect(util.items).toEqual(stored.items);
      expect(util.layouts).toEqual(stored.layouts);
    });

    it('still falls back to examples if only one of items/layouts is present', () => {
      const util = new LocalStorageUtil();

      util.data = {
        items: [{ contentId: 'a' }],
        layouts: [],
      };

      expect(util.isEmpty()).toBe(false);
    });
  });

  it('does not touch window.resGenData when window is undefined (SSR-safety guard)', async () => {
    vi.resetModules();
    const originalWindow = globalThis.window;
    // @ts-expect-error -- deliberately simulating a non-browser environment
    delete globalThis.window;

    try {
      await expect(import('./localstorage-util')).resolves.toBeDefined();
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
