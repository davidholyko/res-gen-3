import { ReactNode, useEffect } from 'react';
import Modal from 'react-modal';

import { useAppContext } from '@/context/app-context';

import PdfModalTopBar from '../sub-components/pdf-modal-top-bar';

const customStyles = {
  content: {
    overflow: 'hidden',
    padding: '0',
  },
};

type ResumeModalProps = {
  children: ReactNode;
};

export default function ResumeModal({ children }: ResumeModalProps) {
  const { isModalOpen, togglePdfModal } = useAppContext();

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
      <PdfModalTopBar />
      {children}
    </Modal>
  );
}
