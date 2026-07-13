import { Text } from '@react-pdf/renderer';

import { PdfComponentProps } from '@/types/pdf';

import BaseElement from './pdf-base-element';

type H1Props = PdfComponentProps;

export default function H1({ children, className, style = {} }: H1Props) {
  return (
    <BaseElement
      element="h1"
      Element={Text}
      style={style}
      className={className}
    >
      {children}
    </BaseElement>
  );
}
