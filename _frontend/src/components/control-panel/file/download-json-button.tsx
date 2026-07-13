import c from 'classnames';

import localStorageUtil from '@/utils/localstorage-util';

type DownloadJsonButtonProps = {
  className?: string;
  role?: string;
  tabIndex?: 0 | -1;
};

export default function DownloadJsonButton({
  className,
  role,
  tabIndex,
}: DownloadJsonButtonProps) {
  const handleClick = () => {
    // Convert JSON data to string
    const jsonString = JSON.stringify(localStorageUtil.data, null, 2);

    // Create a Blob object
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a link element, set its attributes for download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json'; // File name
    a.textContent = 'Download JSON';

    // Append the link to the body
    document.body.appendChild(a);

    // Click the link programmatically to trigger the download
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const classNames = c('unstyled', className);

  return (
    <button
      className={classNames}
      type="button"
      onClick={handleClick}
      role={role}
      tabIndex={tabIndex}
    >
      Download JSON
    </button>
  );
}
