import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  PdfDocumentProvider,
  usePdfDocumentContext,
} from './pdf-document-context';

function wrapper(styles: Record<string, Record<string, unknown>> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <PdfDocumentProvider
        styles={styles}
        items={[]}
        layouts={[]}
        title="resume.pdf"
      >
        {children}
      </PdfDocumentProvider>
    );
  };
}

describe('usePdfDocumentContext', () => {
  it('throws when used outside a PdfDocumentProvider', () => {
    expect(() => renderHook(() => usePdfDocumentContext())).toThrow(
      'usePdfDocumentContext must be used within a PdfDocumentProvider',
    );
  });

  it('exposes items/layouts/title/styles as passed to the provider', () => {
    const { result } = renderHook(() => usePdfDocumentContext(), {
      wrapper: wrapper({ p: { color: 'red' } }),
    });

    expect(result.current.title).toBe('resume.pdf');
    expect(result.current.items).toEqual([]);
    expect(result.current.layouts).toEqual([]);
  });

  describe('computeStyle', () => {
    it('returns an empty object for no className and no elements', () => {
      const { result } = renderHook(() => usePdfDocumentContext(), {
        wrapper: wrapper(),
      });

      expect(result.current.computeStyle()).toEqual({});
    });

    it('ignores className tokens that have no matching entry in styles', () => {
      const { result } = renderHook(() => usePdfDocumentContext(), {
        wrapper: wrapper(),
      });

      expect(result.current.computeStyle('unknown-class')).toEqual({});
    });

    it('merges in the style registered for a className token', () => {
      const { result } = renderHook(() => usePdfDocumentContext(), {
        wrapper: wrapper({ p: { color: 'red' } }),
      });

      expect(result.current.computeStyle('p')).toEqual({ color: 'red' });
    });

    it('merges in style objects passed as additional elements', () => {
      const { result } = renderHook(() => usePdfDocumentContext(), {
        wrapper: wrapper(),
      });

      expect(result.current.computeStyle(undefined, { fontSize: 12 })).toEqual({
        fontSize: 12,
      });
    });

    it('splits a multi-token className and resolves each token independently', () => {
      const { result } = renderHook(() => usePdfDocumentContext(), {
        wrapper: wrapper({ p: { color: 'red' }, bold: { fontWeight: 'bold' } }),
      });

      expect(result.current.computeStyle('p bold')).toEqual({
        color: 'red',
        fontWeight: 'bold',
      });
    });

    it('strips lineHeight from the final merged style', () => {
      const { result } = renderHook(() => usePdfDocumentContext(), {
        wrapper: wrapper(),
      });

      const style = result.current.computeStyle(undefined, {
        lineHeight: 1.5,
        color: 'blue',
      });

      expect(style).toEqual({ color: 'blue' });
      expect('lineHeight' in style).toBe(false);
    });

    it('reacts to styles changing across renders (memoized on styles)', () => {
      let styles: Record<string, Record<string, unknown>> = {
        p: { color: 'red' },
      };
      const { result, rerender } = renderHook(() => usePdfDocumentContext(), {
        wrapper: ({ children }) => (
          <PdfDocumentProvider styles={styles} items={[]} layouts={[]} title="">
            {children}
          </PdfDocumentProvider>
        ),
      });

      expect(result.current.computeStyle('p')).toEqual({ color: 'red' });

      act(() => {
        styles = { p: { color: 'blue' } };
      });
      rerender();

      expect(result.current.computeStyle('p')).toEqual({ color: 'blue' });
    });
  });
});
