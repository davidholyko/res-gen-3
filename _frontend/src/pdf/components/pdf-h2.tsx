import { Text } from '@react-pdf/renderer';

import { PdfComponentProps } from '@/types/pdf';

import BaseElement from './pdf-base-element';

type H2Props = PdfComponentProps;

export default function H2({ children, className, style = {} }: H2Props) {
  return (
    <BaseElement
      element="h2"
      Element={Text}
      style={style}
      className={className}
    >
      {children}
    </BaseElement>
  );
}
