import type { ContentAnyList } from '@/types/content-any-list';

import BaseMacro from './base-macro';

type AnyListMacroProps = ContentAnyList;

export default function AnyListMacro(props: AnyListMacroProps) {
  const { content } = props;

  return (
    <BaseMacro {...props}>
      {Object.entries(content).map(([key, value]) => {
        return (
          <p key={key}>
            <span className="font-bold">{key}: </span>
            {value.join(', ')}
          </p>
        );
      })}
    </BaseMacro>
  );
}
