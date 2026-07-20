import type { ContentParagraph } from '@/types/content-paragraph';

import BaseMacro from './base-macro';
import ParagraphContent from './contents/paragraph-content';

type ParagraphMacroProps = ContentParagraph;

export default function ParagraphMacro(props: ParagraphMacroProps) {
  return (
    <BaseMacro {...props}>
      <ParagraphContent content={props.content} />
    </BaseMacro>
  );
}
