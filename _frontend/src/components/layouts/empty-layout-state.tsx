import { useAppContext } from '@/context/app-context';

// Shown instead of a blank canvas when there are no layouts at all
// (specs/app-ux-improvements.md, Finding 1) -- previously a confused or
// first-time user (anyone who clears the example content) had zero
// indication of what to do next. Since adding layouts/blocks moved off
// the canvas into the restructure view (specs/restructure-view.md), the
// CTA opens that view -- where boxes and blocks get built -- rather than
// adding a layout inline.
export default function EmptyLayoutState() {
  const { toggleRestructure } = useAppContext();

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded p-12 mt-4 max-w-[725px]">
      <p className="text-base">
        Your resume is empty. Open Restructure to add layouts and content.
      </p>
      <button
        type="button"
        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => toggleRestructure(true)}
      >
        Restructure to build it
      </button>
    </div>
  );
}
