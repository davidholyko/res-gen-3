import { Text } from '@react-pdf/renderer';

import { PdfComponentProps } from '@/types/pdf';

import BaseElement from './pdf-base-element';

type H3Props = PdfComponentProps;

export default function H3({ children, className, style = {} }: H3Props) {
  return (
    <BaseElement
      element="h3"
      Element={Text}
      style={style}
      className={className}
    >
      {children}
    </BaseElement>
  );
}
