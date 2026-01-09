import React, { useState, useEffect, useRef } from 'react';
import { Subject, Resource } from '../types';
import { dbService } from '../services/db';
import { 
  BookOpen, Save, Bold, Italic, Underline, Layout
} from 'lucide-react';

export const ResourceManagerPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [resourceContent, setResourceContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  // Fetch Subjects for Sidebar
  useEffect(() => {
    const unsubscribe = dbService.subscribeToSubjects((subjectsData) => {
      setSubjects(subjectsData);
      // Auto-select first subject if none selected
      if (!selectedSubjectId && subjectsData.length > 0) {
        setSelectedSubjectId(subjectsData[0].id);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [selectedSubjectId]);

  // Fetch Resource Content when Subject Changes
  useEffect(() => {
    if (!selectedSubjectId) return;

    const fetchResource = async () => {
      setIsLoading(true);
      try {
        const data = await dbService.getResource(selectedSubjectId);
        
        if (data) {
          setResourceContent(data.content);
          if (editorRef.current) {
            editorRef.current.innerHTML = data.content;
          }
          if (data.updatedAt) {
            setLastSaved(new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        } else {
          setResourceContent('');
          if (editorRef.current) {
            editorRef.current.innerHTML = '';
          }
          setLastSaved(null);
        }
      } catch (error) {
        console.error("Error fetching resource:", error);
      }
      setIsLoading(false);
    };

    fetchResource();
  }, [selectedSubjectId]);

  const handleSave = async () => {
    if (!selectedSubjectId) return;
    
    setIsSaving(true);
    const content = editorRef.current?.innerHTML || '';
    
    try {
      const resourceData: Resource = {
        id: selectedSubjectId,
        content: content,
        updatedAt: new Date().toISOString()
      };
      
      await dbService.saveResource(resourceData);
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setResourceContent(content);
    } catch (error) {
      console.error("Error saving resource:", error);
      alert("Failed to save changes.");
    }
    setIsSaving(false);
  };

  // Simple formatting commands
  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-2 sm:pt-6 pb-2 sm:pb-10 h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] flex flex-col md:flex-row gap-3 sm:gap-6">
      
      {/* Sidebar (Subject List) */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col">
        <div className="glass-panel p-3 sm:p-4 rounded-2xl flex flex-col h-auto md:h-full">
          <h3 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2 mb-2 sm:mb-4 flex-shrink-0">
            <Layout className="w-4 h-4 sm:w-5 sm:h-5 text-lime-400" />
            Subjects
          </h3>
          <div className="grid grid-cols-2 md:flex md:flex-col gap-2 overflow-y-auto max-h-[120px] md:max-h-[calc(100vh-250px)] custom-scrollbar pr-1 sm:pr-2 min-h-0">
            {subjects.map(subject => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubjectId(subject.id)}
                className={`w-full text-left px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all flex items-center gap-2 sm:gap-3 border ${
                  selectedSubjectId === subject.id 
                    ? 'bg-lime-500/20 border-lime-500/50 text-white shadow-[0_0_15px_rgba(163,230,53,0.2)]' 
                    : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: subject.color, color: subject.color }}></span>
                <span className="font-medium truncate text-xs sm:text-sm">{subject.title}</span>
              </button>
            ))}
            {subjects.length === 0 && !isLoading && (
              <div className="col-span-2 text-center py-4 text-slate-500 text-xs sm:text-sm">
                No subjects found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col glass-panel rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative min-h-0">
        
        {/* Editor Toolbar */}
        <div className="p-2 sm:p-4 border-b border-white/10 bg-[#020604]/50 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span 
              className="w-2 h-2 sm:w-4 sm:h-4 rounded-full mr-1 sm:mr-2 hidden sm:block flex-shrink-0" 
              style={{ backgroundColor: selectedSubject?.color || '#ccc' }}
            ></span>
            <h2 className="text-sm sm:text-lg font-bold text-white truncate">
              {selectedSubject?.title || 'Select'}
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 flex-shrink-0">
            <button onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Bold"><Bold className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
            <button onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Italic"><Italic className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
            <button onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }} className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Underline"><Underline className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
             <button 
               onClick={handleSave}
               disabled={!selectedSubjectId || isSaving}
               className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-lime-500 text-black font-bold rounded-lg hover:bg-lime-400 transition-all disabled:opacity-50 text-xs sm:text-sm shadow-lg shadow-lime-500/20"
             >
               {isSaving ? (
                 <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
               ) : (
                 <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
               )}
               <span>Save</span>
             </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 relative bg-black/20 overflow-hidden">
          {isLoading ? (
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : !selectedSubjectId ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a subject to view notes</p>
             </div>
          ) : (
            <div 
              ref={editorRef}
              contentEditable
              className="w-full h-full p-4 sm:p-8 outline-none text-slate-200 leading-relaxed overflow-y-auto custom-scrollbar focus:bg-white/[0.02] transition-colors empty:before:content-['Start_typing...'] empty:before:text-slate-600"
              onInput={(e) => setResourceContent(e.currentTarget.innerHTML)}
            />
          )}
          
          {/* Last Saved Indicator */}
          {lastSaved && (
            <div className="absolute bottom-3 right-4 text-[10px] text-slate-500 font-medium bg-black/40 px-2 py-1 rounded-full border border-white/5 backdrop-blur-sm pointer-events-none">
              Saved {lastSaved}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};