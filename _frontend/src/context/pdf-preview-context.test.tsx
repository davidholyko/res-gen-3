import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
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

  it('extracts class-selector rules from the document stylesheets, ignoring non-class rules', () => {
    injectStylesheet(`
      .foo { color: red; }
      body { margin: 0; }
      @media print { .bar { color: blue; } }
    `);

    const { result } = renderHook(() => usePdfPreviewContext(), {
      wrapper: PdfPreviewProvider,
    });

    expect(result.current.styles.foo).toMatchObject({ color: 'red' });
    // Non-class selectors (body) and at-rules (@media, a CSSMediaRule, not
    // a CSSStyleRule) are filtered out entirely, not just left unstyled.
    expect(result.current.styles.body).toBeUndefined();
    expect(result.current.styles.bar).toBeUndefined();
  });
});
