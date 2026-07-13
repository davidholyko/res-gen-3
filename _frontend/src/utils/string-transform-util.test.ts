import { describe, expect, it } from 'vitest';

import { toSlugCase, toYearMonthDayFormat } from './string-transform-util';

describe('toYearMonthDayFormat', () => {
  it('formats a date as YY-MM-DD', () => {
    expect(toYearMonthDayFormat(new Date(2024, 0, 5))).toBe('24-01-05');
  });

  it('pads single-digit months and days', () => {
    expect(toYearMonthDayFormat(new Date(2030, 8, 9))).toBe('30-09-09');
  });

  it('defaults to the current date when none is given', () => {
    const now = new Date();
    const expected = toYearMonthDayFormat(now);

    expect(toYearMonthDayFormat()).toBe(expected);
  });
});

describe('toSlugCase', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(toSlugCase('Monkey D Luffy')).toBe('monkey-d-luffy');
  });

  it('collapses repeated whitespace into a single hyphen', () => {
    expect(toSlugCase('a    b')).toBe('a-b');
  });

  it('strips non-alphanumeric, non-hyphen characters', () => {
    // Note: stripping happens *after* whitespace is hyphenated, so
    // removing a stripped character that sat between two spaces (like
    // "&") leaves a double hyphen rather than collapsing it.
    expect(toSlugCase("O'Brien & Co.!")).toBe('obrien--co');
  });
});
