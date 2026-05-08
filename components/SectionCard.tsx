import React from 'react';

interface SectionCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, children, className, titleClassName }) => {
  return (
    <div className={`bg-white shadow-sm rounded-md p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-gray-200 transition-shadow hover:shadow-md duration-300 ${className}`}>
      {title && (
        <h2 className={`text-xl font-bold text-uib-black mb-6 pb-2 border-b border-gray-200 ${titleClassName}`}>
          {title}
        </h2>
      )}
      <div className="prose prose-slate max-w-none prose-p:text-gray-700 prose-li:text-gray-700 font-light">
        {children}
      </div>
    </div>
  );
};