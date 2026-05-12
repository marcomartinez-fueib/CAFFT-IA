import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  isAssistantOpen: boolean;
  toggleAssistant: () => void;
  openAssistant: () => void;
  closeAssistant: () => void;
  isAssistantHidden: boolean;
  setAssistantHidden: (hidden: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isAssistantHidden, setIsAssistantHidden] = useState(false);

  const toggleAssistant = () => setIsAssistantOpen(prev => !prev);
  const openAssistant = () => setIsAssistantOpen(true);
  const closeAssistant = () => setIsAssistantOpen(false);
  const setAssistantHidden = (hidden: boolean) => setIsAssistantHidden(hidden);

  return (
    <UIContext.Provider value={{ 
      isAssistantOpen, 
      toggleAssistant, 
      openAssistant, 
      closeAssistant,
      isAssistantHidden,
      setAssistantHidden
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
