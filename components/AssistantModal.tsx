
import React from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../hooks/useLanguage';
import { ChatInterface } from '../pages/ChatPage.tsx';

// XMarkIcon SVG
const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssistantModal: React.FC<AssistantModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const modalRoot = document.body;

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] sm:p-4 transition-all duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-modal-title"
    >
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl h-[94vh] sm:h-[85vh] flex flex-col overflow-hidden transform transition-all duration-300 ease-in-out animate-fadeIn relative border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Simplified Header for the Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-white">
          <div className="flex items-center space-x-3">
             <div className="bg-sky-500 p-2 rounded-xl text-white shadow-md">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
             </div>
             <div>
                <h2 id="assistant-modal-title" className="text-xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                {t('aiChat.pageTitle')}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                    Co-terapeuta Virtual CAFFT
                </p>
             </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label={t('helpModal.closeButton')}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content Area - Just the chat */}
        <div className="flex-1 overflow-hidden relative">
          <ChatInterface onCloseModal={onClose} hideHeader />
        </div>
      </div>
    </div>,
    modalRoot
  );
};
