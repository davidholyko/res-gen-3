import type { HeaderJson } from '@/types/content-header';

// Styled rendering of a HEADER block's content (specs/wysiwyg-staging.md),
// shared by HeaderMacro and the restructure preview.
export default function HeaderContent({ content }: { content: HeaderJson }) {
  const { header } = content;

  return (
    <>
      {/*
        h2, not h3: ContactContent's name is the page's only h1, so each
        resume section heading (this one) is a direct h2 child of it --
        no h2 to skip down from (WCAG 1.3.1).

        No <h2> at all while blank: a freshly added block starts empty
        (specs/editor-redesign.md, Phase 6), and an empty heading element
        is an axe violation (empty-heading) -- a placeholder paragraph
        marks the spot instead.
      */}
      {header ? (
        <h2 className="text-xl text-center border-b border-black">{header}</h2>
      ) : (
        <p className="text-center italic text-gray-600">
          Empty section heading
        </p>
      )}
    </>
  );
}
