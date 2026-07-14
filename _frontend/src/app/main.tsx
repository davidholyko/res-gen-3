import EditorManager from '@/managers/editor-manager';
import LayoutManager from '@/managers/layout-manager';

export default function Main() {
  return (
    // flex-col, not the row layout this used to be (and not the
    // `flex-column` typo it briefly was) -- the ribbon (EditorManager)
    // now sits full-width above the canvas instead of sharing a row
    // with it (specs/ribbon-layout.md). items-center still centers
    // LayoutManager horizontally, just via the column-mode cross axis
    // now instead of justify-content.
    <main className="flex flex-col items-center">
      <EditorManager />
      <LayoutManager />
    </main>
  );
}
