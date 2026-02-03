
import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Eye, PenLine, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface TaskNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialContent: string;
  onSave: (content: string) => void;
}

export const TaskNoteModal: React.FC<TaskNoteModalProps> = ({ isOpen, onClose, title, initialContent, onSave }) => {
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent || '');
      // Auto-switch to preview if content exists, otherwise edit
      setViewMode(initialContent ? 'preview' : 'edit');
      setIsFullScreen(false);
    }
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div 
      className={`fixed z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 transition-all ${
        isFullScreen ? 'inset-0 p-0' : 'inset-0 p-4'
      }`} 
      onClick={onClose}
    >
      <div 
        className={`glass-panel bg-[#050b07]/95 shadow-2xl overflow-hidden border border-white/10 flex flex-col transition-all duration-300 ${
            isFullScreen 
            ? 'w-full h-full rounded-none' 
            : 'rounded-2xl w-full max-w-3xl h-[85vh]'
        }`} 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
             <div className="p-1.5 bg-lime-500/10 rounded-lg text-lime-400">
               <FileText className="w-4 h-4" />
             </div>
             <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Notes for</span>
                <h3 className="font-bold text-white truncate text-sm sm:text-base max-w-[200px] sm:max-w-md">{title}</h3>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={toggleFullScreen} 
                className="p-2 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors hidden sm:block"
                title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
            >
                {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-white/10 bg-black/20 flex items-center justify-between flex-shrink-0">
             <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                 <button 
                   onClick={() => setViewMode('edit')}
                   className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'edit' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   <PenLine className="w-3.5 h-3.5" /> Edit
                 </button>
                 <button 
                   onClick={() => setViewMode('preview')}
                   className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'preview' ? 'bg-lime-500/20 text-lime-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   <Eye className="w-3.5 h-3.5" /> Preview
                 </button>
             </div>
             
             <div className="text-[10px] text-slate-500 font-mono hidden sm:block flex items-center gap-2">
                 <span>Markdown</span>
                 <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                 <span>Tables</span>
                 <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                 <span>Math ($)</span>
             </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-black/20">
            {viewMode === 'edit' ? (
                <textarea 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full p-4 sm:p-6 bg-transparent text-slate-200 font-mono text-sm leading-relaxed resize-none focus:outline-none custom-scrollbar placeholder:text-slate-600"
                    placeholder="Type your notes here... &#10;&#10;Supports:&#10;- **Bold**, *Italic*&#10;- # Headings&#10;- - Lists&#10;- | Tables |&#10;- $ E = mc^2 $"
                    autoFocus
                />
            ) : (
                <div className="w-full h-full p-4 sm:p-8 overflow-y-auto custom-scrollbar">
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:border-b prose-headings:border-white/10 prose-headings:pb-2 prose-headings:mt-6 prose-headings:mb-4 prose-p:text-slate-300 prose-li:text-slate-300 prose-blockquote:border-l-4 prose-blockquote:border-lime-500/50 prose-blockquote:bg-white/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-table:border-collapse prose-th:bg-white/5 prose-th:p-3 prose-td:p-3 prose-td:border-b prose-td:border-white/5 prose-hr:border-white/10">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkMath]} 
                            rehypePlugins={[rehypeKatex]}
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mt-6 mb-4 border-b border-white/10 pb-2" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mt-5 mb-3" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-lg font-bold text-lime-400 mt-4 mb-2" {...props} />,
                                p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-slate-300" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1 text-slate-300" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-slate-300" {...props} />,
                                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-lime-500/50 pl-4 italic text-slate-400 my-4 bg-white/5 py-2 rounded-r" {...props} />,
                                code: ({node, className, children, ...props}: any) => {
                                    const match = /language-(\w+)/.exec(className || '')
                                    const isInline = !match && !String(children).includes('\n');
                                    return isInline ? 
                                    <code className="bg-black/40 rounded px-1.5 py-0.5 text-lime-300 font-mono text-sm border border-white/10" {...props}>{children}</code> :
                                    <pre className="bg-[#0a0a0a] rounded-lg p-4 overflow-x-auto my-4 border border-white/10 text-sm font-mono text-slate-200 custom-scrollbar"><code className={className} {...props}>{children}</code></pre>
                                },
                                table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-lg border border-white/10"><table className="w-full text-left border-collapse" {...props} /></div>,
                                th: ({node, ...props}) => <th className="bg-white/10 p-3 font-bold text-white border-b border-white/10 whitespace-nowrap" {...props} />,
                                td: ({node, ...props}) => <td className="p-3 border-b border-white/5 text-slate-300 min-w-[100px]" {...props} />,
                                hr: ({node, ...props}) => <hr className="border-white/10 my-6" {...props} />,
                                a: ({node, ...props}) => <a className="text-lime-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                img: ({node, ...props}) => <img className="max-w-full h-auto rounded-lg my-4 border border-white/10" {...props} />
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                        {content.trim() === '' && <p className="text-slate-600 italic">No content to preview.</p>}
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-3 flex-shrink-0">
             <button onClick={onClose} className="px-4 py-2 text-slate-400 text-xs font-bold hover:text-white transition-colors">Cancel</button>
             <button onClick={handleSave} className="px-6 py-2 bg-lime-500 text-black font-bold rounded-xl hover:bg-lime-400 transition-all text-xs flex items-center gap-2 shadow-lg shadow-lime-500/20 hover:scale-105 active:scale-95">
                <Save className="w-3.5 h-3.5" /> Save Note
             </button>
        </div>

      </div>
    </div>
  );
};
