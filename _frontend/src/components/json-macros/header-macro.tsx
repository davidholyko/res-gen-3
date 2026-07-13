import type { ContentHeader } from '@/types/content-header';

import BaseMacro from './base-macro';

type HeaderMacroProps = ContentHeader;

export default function HeaderMacro(props: HeaderMacroProps) {
  const { content } = props;
  const { header } = content;

  return (
    <BaseMacro {...props}>
      {/*
        h2, not h3: ContactMacro's name is the page's only h1, so each
        resume section heading (this one) is a direct h2 child of it --
        no h2 to skip down from (WCAG 1.3.1).
      */}
      <h2 className="text-xl text-center border-b border-black">{header}</h2>
    </BaseMacro>
  );
}
