
import React from 'react';

interface PageTitleProps {
  title: string;
  className?: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, className }) => {
  return (
    <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-slate-700 mb-6 sm:mb-8 pb-2 border-b-2 border-uib-blue ${className}`}>
      {title}
    </h1>
  );
};