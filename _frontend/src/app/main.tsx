import EditorManager from '@/managers/editor-manager';
import LayoutManager from '@/managers/layout-manager';

export default function Main() {
  return (
    <main className="flex flex-column justify-center flex-wrap">
      <EditorManager />
      <LayoutManager />
    </main>
  );
}
