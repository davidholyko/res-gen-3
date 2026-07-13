import { Text } from '@react-pdf/renderer';

import { PdfComponentProps } from '@/types/pdf';

import BaseElement from './pdf-base-element';

type SpanProps = PdfComponentProps;

export default function Span({ children, className, style = {} }: SpanProps) {
  return (
    <BaseElement
      element="span"
      Element={Text}
      style={style}
      className={className}
    >
      {children}
    </BaseElement>
  );
}
