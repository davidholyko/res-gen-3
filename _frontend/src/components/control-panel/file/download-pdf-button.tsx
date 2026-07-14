import c from 'classnames';
import { useCallback, useMemo } from 'react';

import { useAppContext } from '@/context/app-context';
import { usePdfInstance } from '@/context/pdf-instance-context';

type DownloadPdfButtonProps = {
  className?: string;
  role?: string;
  tabIndex?: 0 | -1;
};

export default function DownloadPdfButton({
  className,
  role,
  tabIndex,
}: DownloadPdfButtonProps) {
  const { items, layouts, title } = useAppContext();
  // Reuses PdfInstanceProvider's shared, already-rendered blob instead of
  // running a second, independent pdf() render pass -- react-pdf keeps a
  // single module-level renderer instance across calls ("We must keep a
  // single renderer instance, otherwise React will complain"), so two
  // concurrent render passes (this button's own render racing the shared
  // instance's background debounced render) can genuinely collide.
  // Confirmed live: this exact race threw a real
  // "Cannot read properties of null (reading 'props')" error before this
  // fix (specs/multi-page-indicator.md).
  const { instance } = usePdfInstance();

  const disabled = useMemo(() => {
    return !(items.length || layouts.length) || !instance.blob;
  }, [items, layouts, instance.blob]);

  const handleClick = useCallback(() => {
    // Unreachable via a real click: the button is disabled whenever
    // instance.blob is falsy, and disabled buttons never dispatch click
    // events. Only relevant if this handler is ever wired up elsewhere
    // without that same disabled guard.
    /* v8 ignore next */
    if (!instance.blob) return;

    const url = URL.createObjectURL(instance.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [instance.blob, title]);

  const classNames = c('unstyled', className);

  return (
    <button
      className={classNames}
      type="button"
      disabled={disabled}
      onClick={handleClick}
      role={role}
      tabIndex={tabIndex}
    >
      Download PDF
    </button>
  );
}
