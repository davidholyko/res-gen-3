import { renderToStaticMarkup } from 'react-dom/server';

import { AppProvider } from '@/context/app-context';
import type { ContentAll } from '@/types/content-all';
import { toPdfComponents } from '@/utils/pdf-transform-util';

import MacroItem from './macro-item';

type PdfItemProps = ContentAll;

export default function PdfItem(props: PdfItemProps) {
  // MacroItem renders the same "Macro" components used by the interactive
  // web editor (via BaseMacro), which call useAppContext() unconditionally
  // (Rules of Hooks) even though the editor-only UI it's used for never
  // renders during this isolated, non-interactive static markup pass.
  // Needs its own AppProvider so that hook call doesn't throw -- effects
  // (including the localStorage sync) never run under renderToStaticMarkup,
  // so this has no side effects of its own.
  const element = (
    <AppProvider>
      <MacroItem key={props.contentId} {...props} />
    </AppProvider>
  );
  const markup = renderToStaticMarkup(element);
  const component = toPdfComponents(markup);

  return component;
}
