// Namespace import, not default: `ReactPDF.Styles` is a type nested in
// the package's `declare namespace ReactPDF { ... }` (export = ReactPDF),
// which only resolves in type position via `import * as`.
import * as ReactPDF from '@react-pdf/renderer';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
} from 'react';

import type { ContentAll } from '@/types/content-all';
import type { LayoutItem } from '@/types/layouts';

type PdfDocumentContextType = {
  items: ContentAll[];
  layouts: LayoutItem[];
  styles: ReactPDF.Styles;
  title: string;
  /**
   *
   * ```ts
   * computeStyle(className, 'div')
   * ```
   */
  computeStyle: (
    className?: string,
    ...elements: Array<string | Record<string, unknown>>
  ) => Record<string, unknown>;
};

// No default value: createContext(fullDefaultObject) would make the
// "must be used within a Provider" guard in usePdfDocumentContext() below
// permanently unreachable, since useContext() would never see `undefined`.
const PdfDocumentContext = createContext<PdfDocumentContextType | undefined>(
  undefined,
);

type PdfDocumentProviderProps = Omit<PdfDocumentContextType, 'computeStyle'> & {
  children: ReactNode;
};

/**
 * This is layer is inside of an iFrame and cannot access upper level contexts
 *
 * @param {PdfDocumentProviderProps} param0 params
 * @returns
 */
export function PdfDocumentProvider(props: PdfDocumentProviderProps) {
  const { children, styles, items, layouts, title } = props;

  const computeStyle = useCallback(
    (
      className?: string,
      ...elements: Array<string | Record<string, unknown>>
    ) => {
      const classNames = className ? className.split(' ') : [];
      const classesList = [...classNames, ...elements];

      const compiledStyle = classesList.reduce<Record<string, unknown>>(
        (previousValue, currentValue) => {
          if (typeof currentValue === 'object') {
            return { ...previousValue, ...currentValue };
          }

          if (typeof currentValue === 'string' && styles[currentValue]) {
            return { ...previousValue, ...styles[currentValue] };
          }

          return { ...previousValue };
        },
        {},
      );

      // this property causes spacing issues in pdf
      delete compiledStyle['lineHeight'];

      return compiledStyle;
    },
    [styles],
  );

  return (
    <PdfDocumentContext.Provider
      value={{
        title,
        styles,
        items,
        layouts,
        computeStyle,
      }}
    >
      {children}
    </PdfDocumentContext.Provider>
  );
}

export function usePdfDocumentContext() {
  const context = useContext(PdfDocumentContext);

  if (context === undefined) {
    throw new Error(
      'usePdfDocumentContext must be used within a PdfDocumentProvider',
    );
  }

  return context;
}
