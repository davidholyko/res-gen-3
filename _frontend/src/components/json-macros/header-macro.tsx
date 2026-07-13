import type { ContentHeader } from '@/types/content-header';

import BaseMacro from './base-macro';

type HeaderMacroProps = ContentHeader;

export default function HeaderMacro(props: HeaderMacroProps) {
  const { content } = props;
  const { header } = content;

  return (
    <BaseMacro {...props}>
      <h3 className="text-xl text-center border-b border-black">{header}</h3>
    </BaseMacro>
  );
}
