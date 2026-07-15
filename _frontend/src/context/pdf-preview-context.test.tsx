import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  collectClassRules,
  PdfPreviewProvider,
  usePdfPreviewContext,
} from './pdf-preview-context';

function injectStylesheet(css: string) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}

afterEach(() => {
  document.querySelectorAll('style').forEach((el) => el.remove());
});

describe('usePdfPreviewContext', () => {
  it('throws when used outside a PdfPreviewProvider', () => {
    expect(() => renderHook(() => usePdfPreviewContext())).toThrow(
      'usePdfPreviewContext must be used within a PdfPreview',
    );
  });

  it('always includes the static PDF style overrides', () => {
    const { result } = renderHook(() => usePdfPreviewContext(), {
      wrapper: PdfPreviewProvider,
    });

    expect(result.current.styles.page).toMatchObject({ fontFamily: 'Roboto' });
    expect(result.current.styles.text).toMatchObject({ fontFamily: 'Roboto' });
  });

  it('resolves class rules through computed styles, ignoring non-class rules', () => {
    injectStylesheet(`
      .foo { color: red; }
      body { margin: 0; }
      @media print { .bar { color: blue; } }
    `);

    const { result } = renderHook(() => usePdfPreviewContext(), {
      wrapper: PdfPreviewProvider,
    });

    // Computed, not declared: the browser resolves the value ('red' ->
    // rgb(255, 0, 0)) and toPdfComputedFormat hex-encodes it.
    expect(result.current.styles.foo).toMatchObject({ color: '#FF0000' });
    // Non-class selectors (body) are filtered out entirely; @media
    // blocks are not descended into (their applicability depends on a
    // viewport the PDF doesn't have).
    expect(result.current.styles.body).toBeUndefined();
    expect(result.current.styles.bar).toBeUndefined();
  });

  it('scales computed px lengths by the 14/16 web-to-PDF ratio', () => {
    injectStylesheet(`.spaced { margin-top: 16px; }`);

    const { result } = renderHook(() => usePdfPreviewContext(), {
      wrapper: PdfPreviewProvider,
    });

    expect(result.current.styles.spaced).toMatchObject({ marginTop: '14px' });
  });

  it('skips compound and pseudo selectors that cannot be attributed to one class', () => {
    injectStylesheet(`
      .parent .child { color: red; }
      .hoverable:hover { color: red; }
      .plain { color: red; }
    `);

    const { result } = renderHook(() => usePdfPreviewContext(), {
      wrapper: PdfPreviewProvider,
    });

    expect(result.current.styles.plain).toBeDefined();
    expect(result.current.styles.child).toBeUndefined();
    expect(result.current.styles.hoverable).toBeUndefined();
    expect(result.current.styles['parent .child']).toBeUndefined();
  });

  it('skips custom properties (--tw-* plumbing) within a rule', () => {
    injectStylesheet(`.tw { --tw-border-style: solid; color: red; }`);

    const { result } = renderHook(() => usePdfPreviewContext(), {
      wrapper: PdfPreviewProvider,
    });

    expect(result.current.styles.tw).toMatchObject({ color: '#FF0000' });
    expect(
      (result.current.styles.tw as Record<string, unknown>)[
        '--tw-border-style'
      ],
    ).toBeUndefined();
  });

  it('merges a class declared across several rules instead of replacing it', () => {
    injectStylesheet(`
      .multi { color: red; }
      .multi { font-weight: 700; }
    `);

    const { result } = renderHook(() => usePdfPreviewContext(), {
      wrapper: PdfPreviewProvider,
    });

    expect(result.current.styles.multi).toMatchObject({
      color: '#FF0000',
      fontWeight: '700',
    });
  });
});

describe('collectClassRules', () => {
  it('descends into grouping rules, where Tailwind 4 nests all utilities', () => {
    // @layer is the block Tailwind 4 actually uses; @supports stands in
    // as a second grouping-rule kind. (The unstyled-PDF regression was
    // exactly this: a top-level-only walk found no rules inside layers.)
    injectStylesheet(`
      @layer utilities { .layered { color: red; } }
      @supports (display: flex) { .supported { color: blue; } }
      .top { color: green; }
    `);

    const selectors = collectClassRules(document.styleSheets).map(
      (rule) => rule.selectorText,
    );

    expect(selectors).toContain('.top');
    expect(selectors).toContain('.supported');
    // jsdom's CSS parser may or may not surface @layer contents; in real
    // browsers (covered by the e2e suite's rendered-PDF test) it must.
    // Only assert when the environment parses @layer at all.
    const parsedLayer = Array.from(document.styleSheets).some((sheet) =>
      Array.from(sheet.cssRules).some((rule) =>
        rule.cssText.includes('@layer'),
      ),
    );
    if (parsedLayer) {
      expect(selectors).toContain('.layered');
    }
  });
});
