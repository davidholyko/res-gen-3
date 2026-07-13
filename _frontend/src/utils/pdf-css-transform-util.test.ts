import { beforeAll, describe, expect, it } from 'vitest';

import {
  getComputedRemFontSize,
  replaceCSSVariables,
  toCamel,
  toHex,
  toJsObject,
  toPdfCssFormat,
} from './pdf-css-transform-util';

// jsdom's default computed font-size is the "medium" keyword, not a px
// value -- toPx() needs a resolvable px value to convert rem/em correctly.
beforeAll(() => {
  document.documentElement.style.fontSize = '16px';
});

describe('toCamel', () => {
  it('converts kebab-case to camelCase', () => {
    expect(toCamel('background-color')).toBe('backgroundColor');
  });

  it('leaves strings with no hyphens unchanged', () => {
    expect(toCamel('color')).toBe('color');
  });
});

describe('toJsObject', () => {
  it('parses a CSS rule into a selector-keyed, camelCased object', () => {
    const cssText = '.foo{color:red;background-color:blue;}';

    expect(toJsObject(cssText, '.foo')).toEqual({
      foo: { color: 'red', backgroundColor: 'blue' },
    });
  });

  it('ignores malformed declarations (not exactly one colon)', () => {
    const cssText = '.foo{color:red;;this-has-no-colon}';

    expect(toJsObject(cssText, '.foo')).toEqual({
      foo: { color: 'red' },
    });
  });
});

describe('replaceCSSVariables', () => {
  it('substitutes var(--x) references with the sibling --x value', () => {
    const result = replaceCSSVariables({
      '--my-color': '#fff',
      color: 'var(--my-color)',
    });

    expect(result).toEqual({ color: '#fff' });
  });

  it('leaves var() references to unknown variables untouched', () => {
    const result = replaceCSSVariables({ color: 'var(--missing)' });

    expect(result).toEqual({ color: 'var(--missing)' });
  });
});

describe('toHex', () => {
  it('converts rgb() to uppercase hex', () => {
    expect(toHex('rgb(255 0 0)')).toBe('#FF0000');
  });

  it('converts rgba() (dropping the alpha channel)', () => {
    expect(toHex('rgba(0 128 255 / 0.5)')).toBe('#0080FF');
  });

  it('returns non-rgb strings unchanged', () => {
    expect(toHex('red')).toBe('red');
  });
});

describe('toPdfCssFormat', () => {
  it('converts a single rem value to px using the 14/16 multiplier', () => {
    expect(toPdfCssFormat('1rem')).toBe('14px');
  });

  it('converts a single em value to px', () => {
    expect(toPdfCssFormat('2em')).toBe('28px');
  });

  it('converts each value in a space-separated shorthand independently', () => {
    expect(toPdfCssFormat('1rem 2em')).toBe('14px 28px');
  });

  it('converts an rgb color and leaves the hex result unchanged by the unit pass', () => {
    expect(toPdfCssFormat('rgb(0 0 0)')).toBe('#000000');
  });

  it('leaves values with no matching unit or color pattern unchanged', () => {
    expect(toPdfCssFormat('inherit')).toBe('inherit');
  });
});

describe('getComputedRemFontSize', () => {
  it('creates a temporary element, reads its computed font size, and cleans up', () => {
    const bodyChildrenBefore = document.body.children.length;

    const result = getComputedRemFontSize();

    expect(typeof result).toBe('string');
    expect(document.body.children.length).toBe(bodyChildrenBefore);
  });
});
