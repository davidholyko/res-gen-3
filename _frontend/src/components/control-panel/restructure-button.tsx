import { useAppContext } from '@/context/app-context';

// Entry point for the restructure view (specs/restructure-view.md): a
// control-bar button that swaps the canvas for the two-pane rebuild
// surface. Hidden while that view is open -- the view carries its own
// Apply/Cancel, so a second "open" control there would just be noise.
export default function RestructureButton() {
  const { isRestructuring, toggleRestructure } = useAppContext();

  if (isRestructuring) return null;

  return (
    <button
      type="button"
      className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-cyan-200"
      onClick={() => toggleRestructure(true)}
    >
      Restructure
    </button>
  );
}
