import { Text } from '@react-pdf/renderer';

import { PdfComponentProps } from '@/types/pdf';

import BaseElement from './pdf-base-element';

type H5Props = PdfComponentProps;

export default function H5({ children, className, style = {} }: H5Props) {
  return (
    <BaseElement
      element="h5"
      Element={Text}
      style={style}
      className={className}
    >
      {children}
    </BaseElement>
  );
}
