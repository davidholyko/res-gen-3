import { View } from '@react-pdf/renderer';

import { PdfComponentProps } from '@/types/pdf';

import BaseElement from './pdf-base-element';

type UnorderedListProps = PdfComponentProps;

export default function UnorderedList({
  children,
  className,
  style = {},
}: UnorderedListProps) {
  return (
    <BaseElement
      element="ul"
      Element={View}
      style={style}
      className={className}
    >
      {children}
    </BaseElement>
  );
}
