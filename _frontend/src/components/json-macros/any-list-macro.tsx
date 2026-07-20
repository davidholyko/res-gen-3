import type { ContentAnyList } from '@/types/content-any-list';

import BaseMacro from './base-macro';
import AnyListContent from './contents/any-list-content';

type AnyListMacroProps = ContentAnyList;

export default function AnyListMacro(props: AnyListMacroProps) {
  return (
    <BaseMacro {...props}>
      <AnyListContent content={props.content} />
    </BaseMacro>
  );
}
