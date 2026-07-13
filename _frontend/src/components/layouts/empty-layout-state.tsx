import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { LAYOUTS } from '@/constants';
import { useAppContext } from '@/context/app-context';

// Shown instead of a blank canvas when there are no layouts at all
// (specs/app-ux-improvements.md, Finding 1) -- previously a confused or
// first-time user (anyone who clears the example content) had zero
// indication of what to do next. Calls addLayout directly rather than
// reusing AddLayoutSingleButton, which hides itself whenever the left
// editor panel is toggled hidden -- unrelated behavior that would make
// this CTA vanish in exactly the situation it exists to help with.
export default function EmptyLayoutState() {
  const { addLayout } = useAppContext();

  const onAddLayout = useCallback(() => {
    addLayout({ layoutId: uuidv4(), layoutType: LAYOUTS.SINGLE });
  }, [addLayout]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded p-12 mt-4 max-w-[725px]">
      <p className="text-base">
        Your resume is empty. Add a layout to start placing content in it.
      </p>
      <button
        type="button"
        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded"
        onClick={onAddLayout}
      >
        + Add Single Column Layout
      </button>
    </div>
  );
}
