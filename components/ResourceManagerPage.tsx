import React, { useState, useEffect, useRef } from 'react';
import { Subject, Resource } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, query, doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  BookOpen, Save, Bold, Italic, Underline, 
  List, Heading1, Heading2, Check, Layout, AlertCircle
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
    const q = query(collection(db, "subjects"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subjectsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Subject[];
      setSubjects(subjectsData);
      
      // Auto-select first subject if none selected
      if (!selectedSubjectId && subjectsData.length > 0) {
        setSelectedSubjectId(subjectsData[0].id);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching subjects:", error);
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
        const docRef = doc(db, 'resources', selectedSubjectId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Resource;
          setResourceContent(data.content);
          if (editorRef.current) {
            editorRef.current.innerHTML = data.content;
          }
          if (data.updatedAt) {
            setLastSaved(new Date(data.updatedAt).toLocaleTimeString());
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
      
      await setDoc(doc(db, 'resources', selectedSubjectId), resourceData);
      setLastSaved(new Date().toLocaleTimeString());
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6">
      
      {/* Sidebar (Subject List) */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
        <div className="glass-panel p-4 rounded-2xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Layout className="w-5 h-5 text-lime-400" />
            Subjects
          </h3>
          <div className="space-y-2 overflow-y-auto max-h-[200px] md:max-h-[calc(100vh-250px)] custom-scrollbar pr-2">
            {subjects.map(subject => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubjectId(subject.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 border ${
                  selectedSubjectId === subject.id 
                    ? 'bg-lime-500/20 border-lime-500/50 text-white shadow-[0_0_15px_rgba(163,230,53,0.2)]' 
                    : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }}></span>
                <span className="font-medium truncate">{subject.title}</span>
              </button>
            ))}
            {subjects.length === 0 && !isLoading && (
              <div className="text-center py-4 text-slate-500 text-sm">
                No subjects found. Add them in Dashboard.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
        
        {/* Editor Toolbar */}
        <div className="p-4 border-b border-white/10 bg-[#020604]/50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span 
              className="w-4 h-4 rounded-full mr-2 hidden sm:block" 
              style={{ backgroundColor: selectedSubject?.color || '#ccc' }}
            ></span>
            <h2 className="text-lg font-bold text-white truncate max-w-[200px]">
              {selectedSubject?.title || 'Select a Subject'}
            </h2>
            <span className="text-slate-500 mx-2 hidden sm:inline">|</span>
            <span className="text-xs font-bold text-lime-400 uppercase tracking-widest hidden sm:inline">Resources</span>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            <button onClick={() => execCommand('formatBlock', 'H1')} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
            <button onClick={() => execCommand('formatBlock', 'H2')} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onClick={() => execCommand('bold')} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
            <button onClick={() => execCommand('italic')} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
            <button onClick={() => execCommand('underline')} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Underline"><Underline className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onClick={() => execCommand('insertUnorderedList')} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="List"><List className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center gap-3">
             {lastSaved && <span className="text-xs text-slate-500 hidden md:inline">Saved: {lastSaved}</span>}
             <button 
               onClick={handleSave}
               disabled={!selectedSubjectId || isSaving}
               className="flex items-center gap-2 px-4 py-2 bg-lime-500 text-black font-bold rounded-lg hover:bg-lime-400 transition-all disabled:opacity-50 text-sm"
             >
               {isSaving ? (
                 <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
               ) : (
                 <Save className="w-4 h-4" />
               )}
               Save
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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
               <BookOpen className="w-12 h-12 mb-4 opacity-50" />
               <p>Select a subject to view resources</p>
            </div>
          ) : (
            <div 
              ref={editorRef}
              contentEditable
              className="w-full h-full p-6 sm:p-8 outline-none text-slate-200 overflow-y-auto custom-scrollbar prose prose-invert max-w-none"
              style={{ minHeight: '100%' }}
              onInput={() => {}} // Optional: Can implement auto-save debounce here
            >
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
