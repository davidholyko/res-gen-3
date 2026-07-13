import type { ContentParagraph } from '@/types/content-paragraph';

import BaseMacro from './base-macro';

type ParagraphMacroProps = ContentParagraph;

export default function ParagraphMacro(props: ParagraphMacroProps) {
  const { content } = props;
  const { paragraph } = content;

  return (
    <BaseMacro {...props}>
      <p className="mt-1">{paragraph}</p>
    </BaseMacro>
  );
}
