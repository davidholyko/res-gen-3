import * as ReactPDF from '@react-pdf/renderer';
import { usePDF } from '@react-pdf/renderer';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useAppContext } from '@/context/app-context';
import { PdfDocumentProvider } from '@/context/pdf-document-context';
import { usePdfPreviewContext } from '@/context/pdf-preview-context';
import PdfDocument from '@/pdf/pdf-document';

// Debounced, not on every keystroke: this render pass is real work
// (specs/app-ux-improvements.md, Finding 10), and this instance is now
// shared by both the always-mounted page-count indicator and the
// preview modal, not just the modal on demand
// (specs/multi-page-indicator.md).
const RENDER_DEBOUNCE_MS = 1750;

type UsePdfReturn = ReturnType<typeof usePDF>;
type PdfInstanceState = UsePdfReturn[0];

type PdfInstanceContextType = {
  instance: PdfInstanceState;
  pageCount: number | null;
};

// No default value: createContext(fullDefaultObject) would make the
// "must be used within a Provider" guard in usePdfInstance() below
// permanently unreachable, since useContext() would never see `undefined`.
const PdfInstanceContext = createContext<PdfInstanceContextType | undefined>(
  undefined,
);

type PdfInstanceProviderProps = {
  children: ReactNode;
};

export function PdfInstanceProvider({ children }: PdfInstanceProviderProps) {
  const { items, layouts, title } = useAppContext();
  const { styles } = usePdfPreviewContext();
  const [instance, updateInstance] = usePDF();
  const [pageCount, setPageCount] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real page count, not a height heuristic -- a height-based estimate
  // was tried first and rejected (specs/multi-page-indicator.md): it
  // varied up to 2.6x between content types, unreliable enough to
  // mislead rather than inform. `_INTERNAL__LAYOUT__DATA_` is an
  // undocumented, unversioned field react-pdf's own render pass
  // produces as a side effect of generating the blob this component
  // already needs -- guarded defensively so a future shape change
  // silently disables the indicator (pageCount stays null) instead of
  // throwing.
  const onRender = useCallback((props: ReactPDF.OnRenderProps) => {
    const layoutData = (
      props as { _INTERNAL__LAYOUT__DATA_?: { children?: unknown[] } }
    )._INTERNAL__LAYOUT__DATA_;
    const count = layoutData?.children?.length;

    if (typeof count === 'number' && count > 0) {
      setPageCount(count);
    }
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      updateInstance(
        <PdfDocumentProvider
          styles={styles}
          items={items}
          layouts={layouts}
          title={title}
        >
          <PdfDocument onRender={onRender} />
        </PdfDocumentProvider>,
      );
    }, RENDER_DEBOUNCE_MS);

    return () => {
      // timeoutRef.current is always set by this point -- it was just
      // assigned a few lines above in this same effect invocation, and
      // nothing else ever resets it to null. The guard only exists to
      // satisfy TypeScript's nullable ref type.
      /* v8 ignore next */
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [styles, items, layouts, title, updateInstance, onRender]);

  return (
    <PdfInstanceContext.Provider value={{ instance, pageCount }}>
      {children}
    </PdfInstanceContext.Provider>
  );
}

export function usePdfInstance() {
  const context = useContext(PdfInstanceContext);

  if (context === undefined) {
    throw new Error('usePdfInstance must be used within a PdfInstanceProvider');
  }

  return context;
}
