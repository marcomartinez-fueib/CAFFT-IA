
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
      <Link to="/" className="hover:text-sky-600 transition-colors flex items-center shadow-sm p-1 bg-white rounded-md border border-slate-100">
        <Home className="w-3 h-3" />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          {item.path ? (
            <Link to={item.path} className="hover:text-sky-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-600 font-bold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
