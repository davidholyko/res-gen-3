// Namespace import, not default: `ReactPDF.Styles` is a type nested in
// the package's `declare namespace ReactPDF { ... }` (export = ReactPDF),
// which only resolves in type position via `import * as`.
import * as ReactPDF from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import React, { createContext, ReactNode, useContext, useMemo } from 'react';

import {
  CssProperties,
  toCamel,
  toPdfComputedFormat,
} from '@/utils/pdf-css-transform-util';

type PdfPreviewContextType = {
  styles: ReactPDF.Styles;
};

// No default value: createContext(fullDefaultObject) would make the
// "must be used within a Provider" guard in usePdfPreviewContext() below
// permanently unreachable, since useContext() would never see `undefined`.
const PdfPreviewContext = createContext<PdfPreviewContextType | undefined>(
  undefined,
);

type PdfPreviewProps = {
  children: ReactNode;
};

// Matches exactly one simple class selector (".mb-2", ".w-\[26rem\]"),
// with CSS escapes allowed -- compound/descendant/pseudo selectors
// (".foo:hover", ".a .b") can't be attributed to a single class token
// and are skipped.
const SINGLE_CLASS_SELECTOR = /^\.((?:[\w-]|\\.)+)$/;

/**
 * Recursively flattens every class-selector CSSStyleRule out of the
 * document's stylesheets, descending into grouping rules. Tailwind 4
 * nests all of its utilities inside `@layer utilities { ... }` blocks
 * (unlike Tailwind 3's flat top-level rules, which the res-gen-2 port
 * assumed) -- a top-level-only walk finds none of them, and every
 * className silently resolves to no style: the "unstyled PDF"
 * regression. @media blocks are deliberately not descended into: their
 * applicability depends on the current viewport, which the PDF doesn't
 * have.
 */
export function collectClassRules(styleSheets: StyleSheetList) {
  const collected: CSSStyleRule[] = [];

  const visit = (rules: CSSRuleList) => {
    for (const rule of Object.values(rules)) {
      if (rule instanceof CSSStyleRule) {
        if (SINGLE_CLASS_SELECTOR.test(rule.selectorText)) {
          collected.push(rule);
        }
      } else if (!(rule instanceof CSSMediaRule) && 'cssRules' in rule) {
        visit((rule as CSSGroupingRule).cssRules);
      }
    }
  };

  for (const styleSheet of Object.values(styleSheets)) {
    visit(styleSheet.cssRules);
  }

  return collected;
}

/**
 * This is the last layer before the iFrame
 *
 * @param {PdfPreviewProps} param0 params
 * @returns
 */
export function PdfPreviewProvider({ children }: PdfPreviewProps) {
  const styleSheets = useMemo(() => window.document.styleSheets, []);

  const styles = useMemo(() => {
    // A live probe element, one class at a time: Tailwind 4 declares its
    // values through global theme variables and calc()
    // (`margin-bottom: calc(var(--spacing) * 2)`) with oklch() colors --
    // none of which react-pdf understands, and none of which the old
    // declared-value parser could resolve. getComputedStyle hands back
    // the browser's own fully-resolved answer (absolute px, rgb()
    // colors) for exactly the properties each rule declares.
    const probe = document.createElement('div');
    // Detached elements compute no styles; the probe must be in the
    // document (it's empty and unstyled-looking, gone again below).
    document.body.appendChild(probe);

    const styleRules = collectClassRules(styleSheets).reduce<
      Record<string, CssProperties>
    >((accumulated, rule) => {
      const className = rule.selectorText
        .match(SINGLE_CLASS_SELECTOR)![1]
        .replace(/\\(.)/g, '$1');

      probe.className = className;
      const computed = window.getComputedStyle(probe);

      const resolved: CssProperties = {};
      for (const property of Array.from(rule.style)) {
        // Custom properties (--tw-*) are plumbing, not styles.
        if (property.startsWith('--')) continue;
        resolved[toCamel(property)] = toPdfComputedFormat(
          computed.getPropertyValue(property),
        );
      }

      // Merge rather than replace: a class can be declared across
      // several rules.
      accumulated[className] = { ...accumulated[className], ...resolved };
      return accumulated;
    }, {});

    probe.remove();

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
