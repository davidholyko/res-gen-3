import c from 'classnames';
import { useMemo } from 'react';

import pkg from '../../../package.json';
import EditMenu from './control-panel-edit-menu';
import FileMenu from './control-panel-file-menu';
import ViewMenu from './control-panel-view-menu';

export default function ControlPanel() {
  const className = useMemo(
    () =>
      c({
        'control-panel': true,
        'bg-cyan-100': true,
        'p-2': true,
        'mb-2': true,
        flex: true,
        'flex-wrap': true,
        'gap-5': true,
        'items-center': true,
      }),
    [],
  );

  return (
    // <header>, not <div>: it's a sibling of <main> (see src/app/app.tsx),
    // so this gets the implicit "banner" landmark role, and its content
    // (the title, version tag) is no longer orphaned outside any landmark
    // (WCAG 1.3.1 / axe's "region" check).
    <header className={className}>
      <span className="text-xl bold self-center">Res Gen 3</span>
      <FileMenu />
      <EditMenu />
      <ViewMenu />
      <span className="text-sm ml-auto bg-neutral-200 px-2 py-1 rounded self-center">
        v{pkg.version}
      </span>
    </header>
  );
}
