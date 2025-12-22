
import React, { useState, useEffect, useMemo } from 'react';
import { SURAH_LIST } from '../constants';
import { QuranNote } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, query, doc, setDoc } from 'firebase/firestore';
import { Book, Save, Search, FileText, Eye, PenLine } from 'lucide-react';

// Lightweight Markdown Component
const MarkdownPreview = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  
  const parseInline = (text: string) => {
    // Split by bold (**...**) and italic (*...*)
    // This is a basic parser.
    const parts = text.split(/(\*\*.*?\*\*)|(\*.*?\*)/g).filter(Boolean);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-lime-400 font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="text-emerald-200 opacity-90">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="w-full h-full p-4 sm:p-8 overflow-y-auto custom-scrollbar space-y-1 text-slate-300 leading-relaxed pb-20">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        
        // Headers
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lime-400 font-bold text-lg mt-8 mb-3 flex items-center gap-2">{parseInline(line.slice(4))}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-white font-bold text-xl mt-10 mb-4 border-b border-white/10 pb-2">{parseInline(line.slice(3))}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-8">{parseInline(line.slice(2))}</h1>;
        }
        
        // Blockquote
        if (line.startsWith('> ')) {
          return <blockquote key={index} className="border-l-4 border-lime-500/30 pl-4 italic text-slate-400 my-4 bg-white/5 py-2 rounded-r-lg">{parseInline(line.slice(2))}</blockquote>;
        }

        // List Item
        if (trimmed.startsWith('- ')) {
          return (
            <div key={index} className="flex items-start gap-3 ml-2 mb-2">
              <span className="mt-2.5 w-1.5 h-1.5 bg-lime-500 rounded-full flex-shrink-0"></span>
              <span className="flex-1">{parseInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Empty Line
        if (!trimmed) {
          return <div key={index} className="h-4"></div>;
        }

        // Regular Paragraph
        return <p key={index} className="mb-2">{parseInline(line)}</p>;
      })}
    </div>
  );
};

export const QuranPage: React.FC = () => {
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  // Load all notes initially for search capability
  useEffect(() => {
    const q = query(collection(db, "quran_notes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as QuranNote;
        map[doc.id] = data.content;
      });
      setNotesMap(map);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching quran notes:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter Logic: Matches Surah Name OR Note Content
  const filteredSurahs = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase().trim();
    if (!lowerQuery) return SURAH_LIST;

    return SURAH_LIST.filter(surah => {
      const nameMatch = surah.name.toLowerCase().includes(lowerQuery) || 
                        surah.englishName.toLowerCase().includes(lowerQuery) ||
                        surah.number.toString().includes(lowerQuery);
      
      const contentMatch = notesMap[surah.number.toString()]?.toLowerCase().includes(lowerQuery);
      
      return nameMatch || contentMatch;
    });
  }, [searchQuery, notesMap]);

  // Load selected note or generate template
  useEffect(() => {
    if (selectedSurahId === null) {
        // Default to first if list is not empty and none selected
        if(filteredSurahs.length > 0) setSelectedSurahId(filteredSurahs[0].number);
        return;
    }

    const currentNote = notesMap[selectedSurahId.toString()];
    
    if (currentNote) {
      setNoteContent(currentNote);
    } else {
      // Generate Template
      const surah = SURAH_LIST.find(s => s.number === selectedSurahId);
      if (surah) {
        let template = `# ${surah.number}. ${surah.name} (${surah.englishName})\n\n`;
        for (let i = 1; i <= surah.ayahs; i++) {
          template += `### Ayah ${i}\n\n\n`;
        }
        setNoteContent(template);
      }
    }
  }, [selectedSurahId, notesMap]); 

  const handleSave = async () => {
    if (!selectedSurahId) return;
    setIsSaving(true);
    try {
      const id = selectedSurahId.toString();
      await setDoc(doc(db, 'quran_notes', id), {
        id,
        content: noteContent,
        updatedAt: new Date().toISOString()
      });
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error("Save failed", e);
    }
    setIsSaving(false);
  };

  const selectedSurah = SURAH_LIST.find(s => s.number === selectedSurahId);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-2 sm:pt-6 pb-2 sm:pb-10 h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] flex flex-col md:flex-row gap-3 sm:gap-6">
      
      {/* Sidebar */}
      <div className={`w-full md:w-72 flex-shrink-0 flex flex-col ${viewMode === 'preview' && window.innerWidth < 768 ? 'hidden' : ''}`}>
        <div className="glass-panel p-3 sm:p-4 rounded-2xl flex flex-col h-[300px] md:h-full">
            <div className="flex items-center gap-2 mb-3 sm:mb-4 px-1">
                <Book className="w-5 h-5 text-lime-400" />
                <h3 className="font-bold text-white text-lg">Quran Notes</h3>
            </div>
            
            {/* Search */}
            <div className="relative mb-3 group">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 group-focus-within:text-lime-400 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search Surah or Notes..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-lime-500/50 transition-all"
                />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                <div className="space-y-1.5">
                    {filteredSurahs.map(surah => {
                        const hasNote = !!notesMap[surah.number.toString()];
                        return (
                            <button
                                key={surah.number}
                                onClick={() => setSelectedSurahId(surah.number)}
                                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between border ${
                                    selectedSurahId === surah.number
                                    ? 'bg-lime-500/20 border-lime-500/50 text-white shadow-[0_0_15px_rgba(163,230,53,0.1)]'
                                    : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-200'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border ${selectedSurahId === surah.number ? 'border-lime-400 text-lime-400' : 'border-slate-600 text-slate-600'}`}>
                                        {surah.number}
                                    </span>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs sm:text-sm font-bold truncate">{surah.name}</span>
                                        <span className="text-[10px] opacity-70 truncate">{surah.englishName} • {surah.ayahs} ayahs</span>
                                    </div>
                                </div>
                                {hasNote && <FileText className="w-3 h-3 text-lime-500 opacity-50" />}
                            </button>
                        );
                    })}
                    {filteredSurahs.length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-xs italic">
                            No matching Surahs found.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col glass-panel rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative min-h-0">
         {/* Toolbar */}
         <div className="p-3 sm:p-4 border-b border-white/10 bg-[#020604]/50 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex flex-col min-w-0">
                <h2 className="text-sm sm:text-lg font-bold text-white truncate">
                    {selectedSurah ? `${selectedSurah.number}. ${selectedSurah.name}` : 'Select a Surah'}
                </h2>
                {selectedSurah && <p className="text-[10px] text-slate-400 hidden sm:block">{selectedSurah.englishName} • {selectedSurah.ayahs} Ayahs</p>}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* View Mode Toggle */}
              <div className="bg-black/40 p-1 rounded-lg border border-white/10 flex items-center">
                 <button 
                   onClick={() => setViewMode('edit')}
                   className={`p-1.5 sm:px-3 sm:py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'edit' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                   title="Edit Mode"
                 >
                   <PenLine className="w-3.5 h-3.5" />
                   <span className="hidden sm:inline">Edit</span>
                 </button>
                 <button 
                   onClick={() => setViewMode('preview')}
                   className={`p-1.5 sm:px-3 sm:py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'preview' ? 'bg-lime-500/20 text-lime-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                   title="Preview Mode"
                 >
                   <Eye className="w-3.5 h-3.5" />
                   <span className="hidden sm:inline">Preview</span>
                 </button>
              </div>

              <button 
                 onClick={handleSave}
                 disabled={!selectedSurahId || isSaving}
                 className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-lime-500 text-black font-bold rounded-xl hover:bg-lime-400 transition-all disabled:opacity-50 text-xs sm:text-sm shadow-lg shadow-lime-500/20 active:scale-95"
              >
                 {isSaving ? (
                   <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                 ) : (
                   <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                 )}
                 <span className="hidden sm:inline">Save</span>
              </button>
            </div>
         </div>

         {/* Content Area */}
         <div className="flex-1 relative bg-black/20 overflow-hidden flex flex-col">
            {loading ? (
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                 </div>
            ) : (
                <>
                  {/* Edit Mode: Textarea */}
                  <textarea 
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className={`w-full h-full p-4 sm:p-8 bg-transparent text-slate-200 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:bg-white/[0.02] transition-colors custom-scrollbar placeholder:text-slate-600 ${viewMode === 'preview' ? 'hidden' : 'block'}`}
                      placeholder="Select a Surah to start taking notes..."
                      spellCheck={false}
                  />

                  {/* Preview Mode: Markdown Renderer */}
                  {viewMode === 'preview' && (
                    <MarkdownPreview content={noteContent} />
                  )}
                </>
            )}
            
             {lastSaved && (
                <div className="absolute bottom-3 right-4 text-[10px] text-slate-500 font-medium bg-black/60 px-2 py-1 rounded-lg border border-white/5 backdrop-blur-sm pointer-events-none z-10">
                  Saved {lastSaved}
                </div>
             )}
         </div>
      </div>

    </div>
  );
};
