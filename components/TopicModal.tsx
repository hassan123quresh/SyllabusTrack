
import React from 'react';
import { X, Sparkles, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TopicModalProps {
  isOpen: boolean;
  isLoading: boolean;
  topicName: string;
  subjectName: string;
  content: string | null;
  onClose: () => void;
}

export const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  isLoading,
  topicName,
  subjectName,
  content,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300">
      <div className="glass-panel bg-[#050b07]/90 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] border border-white/10 ring-1 ring-white/5">
        {/* Header - Dark Glass Gradient */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-lime-900/40 to-emerald-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg shadow-inner">
                <Sparkles className="w-5 h-5 text-lime-400" />
            </div>
            <div>
                <h3 className="font-bold text-lg text-white leading-none">{topicName}</h3>
                <span className="text-xs text-slate-300 font-medium uppercase tracking-wider">{subjectName}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                 <div className="w-12 h-12 border-4 border-white/10 border-t-lime-500 rounded-full animate-spin"></div>
                 <div className="absolute inset-0 bg-lime-500/10 blur-xl rounded-full"></div>
              </div>
              <p className="text-slate-400 text-sm font-medium animate-pulse">Consulting AI Tutor...</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-headings:font-bold prose-p:text-slate-300 prose-pre:bg-black/50 prose-pre:backdrop-blur-sm prose-pre:border prose-pre:border-white/10 prose-code:text-lime-300">
               <ReactMarkdown>{content || ''}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/20 border-t border-white/5 text-xs text-slate-500 flex items-center justify-center gap-2 backdrop-blur-md">
           <BookOpen className="w-3 h-3" />
           <span className="font-medium">Powered by Gemini 2.5 Flash</span>
        </div>
      </div>
    </div>
  );
};
