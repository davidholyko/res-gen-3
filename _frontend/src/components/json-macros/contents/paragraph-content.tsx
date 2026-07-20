import type { ParagraphJson } from '@/types/content-paragraph';

// Styled rendering of a PARAGRAPH block's content
// (specs/wysiwyg-staging.md), shared by ParagraphMacro and the
// restructure preview.
export default function ParagraphContent({
  content,
}: {
  content: ParagraphJson;
}) {
  return <p className="mt-1">{content.paragraph}</p>;
}
