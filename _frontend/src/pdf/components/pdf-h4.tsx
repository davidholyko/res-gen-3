import { Text } from '@react-pdf/renderer';

import { PdfComponentProps } from '@/types/pdf';

import BaseElement from './pdf-base-element';

type H4Props = PdfComponentProps;

export default function H4({ children, className, style = {} }: H4Props) {
  return (
    <BaseElement
      element="h4"
      Element={Text}
      style={style}
      className={className}
    >
      {children}
    </BaseElement>
  );
}
