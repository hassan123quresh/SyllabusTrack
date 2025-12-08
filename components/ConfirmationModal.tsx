
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel bg-[#050b07]/90 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all scale-100 border border-white/10">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center mb-5 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <AlertTriangle className="w-7 h-7" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>
          
          <p className="text-sm text-slate-400 mb-8 font-medium">
            {message}
          </p>

          <div className="flex gap-4 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 font-bold rounded-xl hover:bg-white/10 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all hover:scale-105 active:scale-95"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
