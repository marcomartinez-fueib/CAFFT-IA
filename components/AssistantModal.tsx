
import React from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../hooks/useLanguage';
import { ChatInterface } from '../pages/ChatPage.tsx';
import { MessageSquare } from 'lucide-react';

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
        <div className="flex items-center justify-between p-5 sm:p-7 border-b border-gray-100 bg-white">
          <div className="flex items-center space-x-4">
             <div className="bg-uib-blue p-3 rounded-2xl text-white shadow-lg shadow-uib-blue/20">
                <MessageSquare className="w-6 h-6" />
             </div>
             <div>
                <h2 id="assistant-modal-title" className="text-2xl font-display font-black text-uib-blue tracking-tight leading-tight uppercase">
                {t('aiChat.pageTitle')}
                </h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Asistent de Suport CAFFT
                </p>
             </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-uib-blue hover:bg-slate-50 rounded-2xl transition-all duration-300 focus:outline-none"
            aria-label={t('helpModal.closeButton')}
          >
            <XMarkIcon className="h-7 w-7" />
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
