// Namespace import, not default: `ReactPDF.Styles` is a type nested in
// the package's `declare namespace ReactPDF { ... }` (export = ReactPDF),
// which only resolves in type position via `import * as`.
import * as ReactPDF from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import React, { createContext, ReactNode, useContext, useMemo } from 'react';

import { toJsObject } from '@/utils/pdf-css-transform-util';

type PdfPreviewContextType = {
  styles: ReactPDF.Styles;
};

const initialState: PdfPreviewContextType = {
  styles: {},
};

const PdfPreviewContext = createContext<PdfPreviewContextType>(initialState);

type PdfPreviewProps = {
  children: ReactNode;
};

/**
 * This is the last layer before the iFrame
 *
 * @param {PdfPreviewProps} param0 params
 * @returns
 */
export function PdfPreviewProvider({ children }: PdfPreviewProps) {
  const styleSheets = useMemo(() => window.document.styleSheets, []);

  const styles = useMemo(() => {
    const rules = Object.values(styleSheets)
      .map((styleSheet) =>
        Object.values(styleSheet.cssRules).filter((cssRule) =>
          cssRule instanceof CSSStyleRule //
            ? cssRule.selectorText.startsWith('.')
            : false,
        ),
      )
      .flat() as CSSStyleRule[];

    const styleRules = rules.reduce((previousValue, currentValue) => {
      const { cssText, selectorText } = currentValue;

      return { ...previousValue, ...toJsObject(cssText, selectorText) };
    }, {});

    const styleSheet = StyleSheet.create({
      ...styleRules,
      page: {
        fontSize: '12px', // rem
        padding: '24px',
        fontFamily: 'Roboto',
      },
      h2: {
        fontWeight: 'normal',
      },
      h3: {
        fontWeight: 'normal',
      },
      h4: {
        fontWeight: 'normal',
      },
      h5: {
        fontWeight: 'normal',
      },
      p: {
        paddingTop: '1px',
      },
      li: {
        padding: '1px',
        whiteSpace: 'pre-wrap', // Ensure text wraps within the container
        maxWidth: '525px',
      },
      text: {
        fontFamily: 'Roboto',
      },
      '': {},
    });

    return styleSheet;
  }, [styleSheets]);

  return (
    <PdfPreviewContext.Provider value={{ styles }}>
      {children}
    </PdfPreviewContext.Provider>
  );
}

export function usePdfPreviewContext() {
  const context = useContext(PdfPreviewContext);

  if (context === undefined) {
    throw new Error('usePdfPreviewContext must be used within a PdfPreview');
  }

  return context;
}
