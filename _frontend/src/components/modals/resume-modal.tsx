import { useEffect, useState } from 'react';
import Modal from 'react-modal';

import { useAppContext } from '@/context/app-context';
import { usePdfInstance } from '@/context/pdf-instance-context';
import PdfPreview from '@/pdf/pdf-preview';

import PdfModalTopBar from '../sub-components/pdf-modal-top-bar';
import EditPanel from './edit-panel';

const customStyles = {
  content: {
    overflow: 'hidden',
    padding: '0',
  },
};

export default function ResumeModal() {
  const { isModalOpen, togglePdfModal, editingContentId } = useAppContext();
  const { pageCount } = usePdfInstance();
  const [anchorPage, setAnchorPage] = useState(1);

  // The page the preview re-anchors to on each live refresh. Clamped
  // rather than stored clamped: pageCount can shrink under a stored
  // anchor when an edit shortens the document mid-session.
  const effectiveAnchorPage = pageCount
    ? Math.min(anchorPage, pageCount)
    : anchorPage;

  const onClose = () => {
    togglePdfModal(false);
  };

  useEffect(() => {
    // Registers the real app root so react-modal can mark it aria-hidden
    // while the modal is open, keeping screen reader users from tabbing
    // into background content. `#res-gen` (rendered by src/app/page.tsx)
    // is always mounted by the time this component mounts, since
    // ResumeModal only ever renders inside it.
    Modal.setAppElement('#res-gen');
  }, []);

  useEffect(() => {
    // A fresh open always starts at page 1 -- the anchor is session
    // state, not a preference.
    if (isModalOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnchorPage(1);
    }
  }, [isModalOpen]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        togglePdfModal(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyPress);
    } else {
      document.removeEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isModalOpen, togglePdfModal]);

  return (
    <Modal
      isOpen={isModalOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Resume PDF Preview Modal"
    >
      <div className="flex h-full flex-col">
        <PdfModalTopBar
          anchorPage={effectiveAnchorPage}
          onAnchorPageChange={setAnchorPage}
        />
        {/* Below a sane minimum the content scrolls horizontally rather
            than letting the panel collapse onto or over the preview
            (specs/edit-with-live-pdf-preview.md, Decisions). */}
        <div className="grow overflow-x-auto">
          <div className="flex h-full min-w-[56rem]">
            <div className="grow h-full">
              <PdfPreview anchorPage={effectiveAnchorPage} />
            </div>
            {editingContentId !== null && <EditPanel />}
          </div>
        </div>
      </div>
    </Modal>
  );
}
