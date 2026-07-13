import { Text } from '@react-pdf/renderer';

import { PdfComponentProps } from '@/types/pdf';

import BaseElement from './pdf-base-element';

type ParagraphProps = PdfComponentProps;

export default function Paragraph({
  children,
  className,
  style = {},
}: ParagraphProps) {
  return (
    <BaseElement element="p" Element={Text} style={style} className={className}>
      {children}
    </BaseElement>
  );
}
