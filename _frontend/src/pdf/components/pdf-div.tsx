import { View } from '@react-pdf/renderer';

import { PdfComponentProps } from '@/types/pdf';

import BaseElement from './pdf-base-element';

type DivProps = PdfComponentProps;

export default function Div({
  children,
  className,
  style = {},
  debug,
}: DivProps) {
  return (
    <BaseElement
      debug={debug}
      element="div"
      Element={View}
      style={style}
      className={className}
    >
      {children}
    </BaseElement>
  );
}
