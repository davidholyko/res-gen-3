import { Image } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { useMemo } from 'react';

import { usePdfDocumentContext } from '@/context/pdf-document-context';

type ImgProps = {
  className: string;
  src: string;
  alt: string;
  style: Record<string, unknown>;
};

export default function Img({ className, src, style = {} }: ImgProps) {
  const { computeStyle } = usePdfDocumentContext();

  const styles = useMemo(
    () => computeStyle(className, 'img', style),
    [computeStyle, className, style], //
  );

  // computeStyle merges arbitrary Tailwind-derived classes at runtime, so
  // its result can't be statically verified against react-pdf's precise
  // Style union -- same reasoning as the other computeStyle call sites.
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image src={src} style={styles as Style} />;
}
