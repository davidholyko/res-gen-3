import c from 'classnames';

import { useAppContext } from '@/context/app-context';

// Entry point for the restructure view (specs/restructure-view.md): a
// control-bar button that swaps the canvas for the two-pane rebuild
// surface. Stays put in the bar while that view is open (the whole
// control bar is meant to be a stable set of controls), acting as a
// toggle -- clicking it again closes the view, the same discard-staging
// exit as its in-view Cancel. Shows an active/pressed state while open.
export default function RestructureButton() {
  const { isRestructuring, toggleRestructure } = useAppContext();

  return (
    <button
      type="button"
      aria-pressed={isRestructuring}
      className={c('rounded px-2 py-1 text-sm hover:bg-cyan-200', {
        'bg-cyan-200 text-gray-900': isRestructuring,
        'text-gray-700': !isRestructuring,
      })}
      onClick={() => toggleRestructure()}
    >
      Restructure
    </button>
  );
}
