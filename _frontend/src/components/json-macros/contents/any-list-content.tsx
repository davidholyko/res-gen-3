import type { AnyList } from '@/types/content-any-list';

// Styled rendering of an ANY_LIST block's content
// (specs/wysiwyg-staging.md), shared by AnyListMacro and the restructure
// preview.
export default function AnyListContent({ content }: { content: AnyList }) {
  return (
    <>
      {Object.entries(content).map(([key, value]) => {
        return (
          <p key={key}>
            <span className="font-bold">{key}: </span>
            {value.join(', ')}
          </p>
        );
      })}
    </>
  );
}
