import { describe, expect, it } from 'vitest';

import { CONTENT_TYPES, LAYOUTS } from '@/constants';

import { prepopulateUtil } from './prepopulate-util';

describe('prepopulateUtil', () => {
  it('provides a single layout that every item references', () => {
    const { layouts } = prepopulateUtil;

    expect(layouts).toHaveLength(1);
    expect(layouts[0].layoutType).toBe(LAYOUTS.SINGLE);
  });

  it('provides example items covering every content type', () => {
    const { items, layouts } = prepopulateUtil;

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.layoutId === layouts[0].layoutId)).toBe(
      true,
    );
    expect(items.every((item) => item.contentId)).toBe(true);

    const contentTypes = new Set(items.map((item) => item.contentType));
    expect(contentTypes).toEqual(
      new Set([
        CONTENT_TYPES.CONTACT,
        CONTENT_TYPES.HEADER,
        CONTENT_TYPES.PARAGRAPH,
        CONTENT_TYPES.EXPERIENCE,
        CONTENT_TYPES.ANY_LIST,
      ]),
    );
  });

  it('generates a distinct contentId per item', () => {
    const { items } = prepopulateUtil;
    const ids = new Set(items.map((item) => item.contentId));

    expect(ids.size).toBe(items.length);
  });
});
