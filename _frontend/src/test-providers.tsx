import type { ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { AppProvider } from '@/context/app-context';

// Shared by tests that render anything using react-dnd's useDrag/useDrop
// (BaseEditor, LayoutSingle, ...) together with app state -- mirrors the
// real provider nesting in src/app/page.tsx.
export function AllProviders({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <DndProvider backend={HTML5Backend}>{children}</DndProvider>
    </AppProvider>
  );
}
