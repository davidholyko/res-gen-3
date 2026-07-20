import type { ReactNode } from 'react';

import { AppProvider } from '@/context/app-context';

// Shared by tests that render components together with app state --
// mirrors the real provider nesting in src/app/page.tsx.
export function AllProviders({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
