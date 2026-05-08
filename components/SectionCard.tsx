import React from 'react';

interface SectionCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, children, className, titleClassName }) => {
  return (
    <div className={`bg-white shadow-xl shadow-slate-200/40 rounded-[32px] p-6 sm:p-10 mb-8 border border-slate-100 transition-all hover:shadow-2xl hover:shadow-uib-blue/5 duration-500 overflow-hidden relative group ${className}`}>
      {title && (
        <h2 className={`text-2xl font-display font-black text-uib-blue mb-8 pb-4 border-b border-slate-50 flex items-center gap-3 transition-colors group-hover:text-uib-accent ${titleClassName}`}>
          <div className="w-1.5 h-6 bg-uib-accent rounded-full opacity-30 group-hover:opacity-100 transition-opacity" />
          {title}
        </h2>
      )}
      <div className="font-body text-slate-600 leading-relaxed text-lg">
        {children}
      </div>
    </div>
  );
};