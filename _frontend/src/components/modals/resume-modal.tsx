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
      ariaHideApp={false}
    >
      <PdfModalTopBar />
      {children}
    </Modal>
  );
}
