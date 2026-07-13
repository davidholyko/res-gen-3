import { ElementType, useMemo } from 'react';

import { usePdfDocumentContext } from '@/context/pdf-document-context';
import { PdfComponentProps } from '@/types/pdf';

type BaseElementRequiredProps = {
  Element: ElementType;
  element: string;
  debug?: boolean;
  style?: Record<string, unknown>;
};

type BaseElementProps = PdfComponentProps & BaseElementRequiredProps;

export default function BaseElement(props: BaseElementProps) {
  const {
    children,
    className,
    element,
    Element,
    debug = false,
    style = {},
  } = props;
  const { computeStyle, styles: styleSheet } = usePdfDocumentContext();

  const styles = useMemo(
    () => computeStyle(className, element, { ...style }),
    [computeStyle, className, element, style], //
  );

  const useDebug = useMemo(
    () => className?.includes('debug') || debug,
    [className, debug],
  );

  if (debug) {
    console.info('^^^ styleSheet', styleSheet);
    console.info('^^^ styles', styles);
    console.info('^^^ className', className);
  }

  return (
    <Element style={styles} debug={useDebug}>
      {children}
    </Element>
  );
}
