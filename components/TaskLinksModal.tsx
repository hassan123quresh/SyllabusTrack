
import React from 'react';
import { X, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { LinkItem } from '../types';

interface TaskLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  links: LinkItem[];
}

export const TaskLinksModal: React.FC<TaskLinksModalProps> = ({ isOpen, onClose, title, links }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="glass-panel bg-[#050b07]/95 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/10 flex flex-col max-h-[70vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-2 min-w-0">
             <LinkIcon className="w-4 h-4 text-lime-400 flex-shrink-0" />
             <h3 className="font-bold text-white truncate text-sm sm:text-base">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          {links.length === 0 ? (
            <p className="text-slate-500 text-center py-6 text-xs italic">No links available</p>
          ) : (
            links.map((link) => (
              <a 
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-lime-500/30 transition-all group active:scale-[0.98]"
              >
                 <div className="flex items-center justify-between gap-2 mb-1">
                   <span className="font-bold text-sm text-lime-400 group-hover:text-lime-300 truncate">{link.title || 'Resource Link'}</span>
                   <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white flex-shrink-0" />
                 </div>
                 <span className="text-[10px] text-slate-500 truncate font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                    {link.url}
                 </span>
              </a>
            ))
          )}
        </div>
        
        <div className="p-3 bg-white/5 border-t border-white/10 text-center">
            <span className="text-[10px] text-slate-500">Opens in new tab</span>
        </div>
      </div>
    </div>
  );
};
