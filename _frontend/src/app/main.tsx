import LayoutManager from '@/managers/layout-manager';

// No Template ribbon above the canvas anymore (specs/editor-redesign.md,
// Phase 6): content is added via each zone's "+ Add block" control, so
// the canvas is the whole main area.
export default function Main() {
  return (
    <main className="flex flex-col items-center">
      <LayoutManager />
    </main>
  );
}
