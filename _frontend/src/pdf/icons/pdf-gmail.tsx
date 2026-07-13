import { Path, Svg } from '@react-pdf/renderer';
import { useMemo } from 'react';
import type { Style } from '@react-pdf/types';

import { usePdfDocumentContext } from '@/context/pdf-document-context';
import type { PdfComponentProps } from '@/types/pdf';

const svgStyle = {
  width: 12,
  height: 12,
};

type GmailSvgProps = PdfComponentProps;

export default function GmailSvg({ className }: GmailSvgProps) {
  const { computeStyle } = usePdfDocumentContext();

  const style = useMemo(
    () => computeStyle(className, 'svg', svgStyle),
    [className, computeStyle], //
  );

  return (
    <Svg viewBox="52 42 88 66" style={style as Style}>
      <Path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
      <Path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
      <Path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
      <Path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
      <Path
        fill="#c5221f"
        d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2"
      />
    </Svg>
  );
}
