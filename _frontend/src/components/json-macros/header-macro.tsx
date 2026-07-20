import type { ContentHeader } from '@/types/content-header';

import BaseMacro from './base-macro';
import HeaderContent from './contents/header-content';

type HeaderMacroProps = ContentHeader;

export default function HeaderMacro(props: HeaderMacroProps) {
  return (
    <BaseMacro {...props}>
      <HeaderContent content={props.content} />
    </BaseMacro>
  );
}
