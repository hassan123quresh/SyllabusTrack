
import React, { useState, useEffect, useRef } from 'react';
import { Subject, PriorityLevel, Topic, LinkItem, ImageItem } from '../types';
import { Check, Plus, Trash2, Pencil, Calendar as CalendarIcon, ExternalLink, ChevronDown, ChevronUp, Link as LinkIcon, X, PlusCircle, Camera, Image as ImageIcon, FileText } from 'lucide-react';
import { TaskLinksModal } from './TaskLinksModal';
import { TaskImagesModal } from './TaskImagesModal';
import { TaskNoteModal } from './TaskNoteModal';
import { ConfirmationModal } from './ConfirmationModal';
import { Calendar } from 'primereact/calendar';
import { uploadToCloudinary } from '../services/cloudinary';

interface SubjectCardProps {
  subject: Subject;
  onToggleTopic: (subjectId: string, topicId: string) => void;
  onAddTopic: (subjectId: string, topicName: string, priority: PriorityLevel, deadline?: string, link?: string) => void;
  onDeleteSubject: (subjectId: string) => void;
  onDeleteTopic: (subjectId: string, topicId: string) => void;
  onEditTopic: (subjectId: string, topic: Topic) => void;
  isPhone?: boolean;
}

// Helper: Process Image (Optimized HD for Client Preview)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // We resize to HD to optimize upload speed to Cloudinary
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Pure function for date calculation
const getDaysLeftText = (deadline?: string) => {
  if (!deadline) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(deadline); due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff < 0) return { text: `${Math.abs(diff)}d late`, color: 'text-rose-400' };
  if (diff === 0) return { text: 'Due today', color: 'text-amber-400' };
  return { text: `${diff}d left`, color: 'text-slate-500' };
};

// Optimized Badge Component
const PriorityBadge: React.FC<{ priority?: PriorityLevel }> = React.memo(({ priority }) => {
  if (!priority) return null;
  
  let styles = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (priority === 'High') styles = "text-rose-400 bg-rose-500/10 border-rose-500/20";
  if (priority === 'Medium') styles = "text-amber-400 bg-amber-500/10 border-amber-500/20";
  
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] border ${styles}`}>
      {priority}
    </span>
  );
});

export const SubjectCard = React.memo(({ subject, onToggleTopic, onAddTopic, onDeleteSubject, onDeleteTopic, onEditTopic, isPhone = false }: SubjectCardProps) => {
  const [isExpanded, setIsExpanded] = useState(!isPhone);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingTopicId, setUploadingTopicId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Force expansion on desktop if window resizes or prop changes
  useEffect(() => {
    if (!isPhone) {
      setIsExpanded(true);
    }
  }, [isPhone]);
  
  // Modal State
  const [viewingLinks, setViewingLinks] = useState<{title: string, links: LinkItem[]} | null>(null);
  const [viewingImages, setViewingImages] = useState<{title: string, images: ImageItem[], topicId: string} | null>(null);
  const [editingNote, setEditingNote] = useState<{topicId: string, title: string, content: string} | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string, 
    priority: PriorityLevel, 
    deadline: string, 
    links: LinkItem[]
  }>({
    name: '', priority: 'Medium', deadline: '', links: []
  });

  // Add State
  const [newName, setNewName] = useState('');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('Medium');
  const [newDeadline, setNewDeadline] = useState('');
  const [newLink, setNewLink] = useState(''); 

  // Derived State
  const completedCount = subject.topics.filter(t => t.isCompleted).length;
  const totalCount = subject.topics.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const startEdit = (topic: Topic) => {
    setEditingId(topic.id);
    
    // Migrate legacy link to links array for editing
    let currentLinks = topic.links ? [...topic.links] : [];
    if (topic.link && !currentLinks.some(l => l.url === topic.link)) {
        currentLinks.unshift({
            id: `legacy-${Date.now()}`,
            title: 'Primary Link',
            url: topic.link
        });
    }

    setEditForm({
      name: topic.name,
      priority: topic.priority || 'Medium',
      deadline: topic.deadline || '',
      links: currentLinks
    });
  };

  const submitEdit = () => {
    if (editingId && editForm.name.trim()) {
      const original = subject.topics.find(t => t.id === editingId);
      if (original) {
        onEditTopic(subject.id, {
          ...original,
          name: editForm.name.trim(),
          priority: editForm.priority,
          deadline: editForm.deadline || undefined,
          links: editForm.links.length > 0 ? editForm.links : undefined,
          link: undefined
        });
      }
      setEditingId(null);
    }
  };

  const handleAddLinkInEdit = () => {
    setEditForm(prev => ({
        ...prev,
        links: [...prev.links, { id: `link-${Date.now()}`, title: '', url: '' }]
    }));
  };

  const handleUpdateLinkInEdit = (index: number, field: 'title' | 'url', value: string) => {
    const updated = [...editForm.links];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm({ ...editForm, links: updated });
  };

  const handleRemoveLinkInEdit = (index: number) => {
    const updated = editForm.links.filter((_, i) => i !== index);
    setEditForm({ ...editForm, links: updated });
  };

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddTopic(subject.id, newName.trim(), newPriority, newDeadline || undefined, newLink.trim() || undefined);
      setNewName(''); setNewPriority('Medium'); setNewDeadline(''); setNewLink(''); setIsAdding(false);
    }
  };

  const handleLinkClick = (e: React.MouseEvent, topic: Topic) => {
     e.stopPropagation();
     const allLinks = topic.links ? [...topic.links] : [];
     if (topic.link && !allLinks.some(l => l.url === topic.link)) {
         allLinks.unshift({ id: 'legacy', title: 'Main Link', url: topic.link });
     }

     if (allLinks.length === 0) return;

     if (allLinks.length > 1 || (allLinks.length === 1 && allLinks[0].title && allLinks[0].title !== 'Main Link')) {
         setViewingLinks({ title: topic.name, links: allLinks });
     } else {
         const url = allLinks[0].url;
         const absoluteUrl = (url.startsWith('http://') || url.startsWith('https://')) ? url : `https://${url}`;
         window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
     }
  };

  // Image Handling with Cloudinary
  const handleCameraClick = (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    setUploadingTopicId(topicId);
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
        fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && uploadingTopicId) {
        const file = e.target.files[0];
        setIsUploading(true);
        try {
            // 1. Compress Client Side (Bandwidth optimization & faster upload)
            const base64 = await compressImage(file);
            
            // 2. Upload to Cloudinary
            const secureUrl = await uploadToCloudinary(base64);
            
            // 3. Save URL to Database
            const topic = subject.topics.find(t => t.id === uploadingTopicId);
            if (topic) {
                const newImage: ImageItem = {
                    id: `img-${Date.now()}`,
                    url: secureUrl, // Cloudinary URL
                    createdAt: new Date().toISOString()
                };
                onEditTopic(subject.id, {
                    ...topic,
                    images: [...(topic.images || []), newImage]
                });
            }
        } catch (err) {
            console.error("Failed to process image", err);
            alert("Failed to upload image. Please try again.");
        } finally {
            setIsUploading(false);
            setUploadingTopicId(null);
        }
    }
  };

  const handleDeleteImage = (imageId: string) => {
      if (viewingImages) {
          const topic = subject.topics.find(t => t.id === viewingImages.topicId);
          if (topic) {
              const updatedImages = (topic.images || []).filter(img => img.id !== imageId);
              onEditTopic(subject.id, { ...topic, images: updatedImages });
              // Update local modal state
              setViewingImages(prev => prev ? ({ ...prev, images: updatedImages }) : null);
          }
      }
  };
  
  // Note Handling
  const handleNoteSave = (content: string) => {
     if (editingNote) {
         const topic = subject.topics.find(t => t.id === editingNote.topicId);
         if (topic) {
             onEditTopic(subject.id, { ...topic, note: content });
         }
         setEditingNote(null);
     }
  };

  const getLinkCount = (topic: Topic) => {
     let count = topic.links?.length || 0;
     if (topic.link && !topic.links?.some(l => l.url === topic.link)) count++;
     return count;
  };

  return (
    <>
    {/* Hidden File Input for Camera/Gallery */}
    <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileChange}
    />

    <div className="bg-[#08100c] border border-white/5 rounded-xl overflow-hidden flex flex-col mb-4 md:mb-0 h-auto md:h-full md:max-h-[600px] shadow-sm">
      {/* Header */}
      <div 
        onClick={() => isPhone && setIsExpanded(!isExpanded)}
        className={`p-3 sm:p-4 flex flex-col gap-2 relative ${isPhone ? 'active:bg-white/5 cursor-pointer' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 min-w-0">
             <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: subject.color }}></div>
             <div>
               <h3 className="text-white font-bold text-base sm:text-lg leading-tight truncate">{subject.title}</h3>
               <p className="text-[10px] sm:text-xs text-slate-500 font-mono mt-0.5">{completedCount}/{totalCount} tasks</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 pl-2">
             <span className="text-sm sm:text-lg font-bold text-white font-mono">{progress}%</span>
             
             {!isPhone && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onDeleteSubject(subject.id); }}
                 className="text-slate-600 hover:text-rose-500 transition-colors p-1"
               >
                 <Trash2 className="w-3.5 h-3.5" />
               </button>
             )}
             {isPhone && (
                <div className="text-slate-600">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
             )}
          </div>
        </div>
        
        {/* CSS Progress Bar */}
        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden mt-1">
          <div 
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, backgroundColor: subject.color }}
          />
        </div>
      </div>

      {/* Topics List */}
      {isExpanded && (
        <div className="border-t border-white/5 flex-1 flex flex-col min-h-0">
          <ul className="flex-1 overflow-y-auto custom-scrollbar p-0">
            {subject.topics.map((topic) => {
              if (editingId === topic.id) {
                return (
                  <li key={topic.id} className="p-3 bg-white/5 border-b border-white/5 flex flex-col gap-2">
                    {/* Basic Info */}
                    <input autoFocus value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-black/40 text-white text-sm p-2 rounded border border-white/10" placeholder="Topic Name" />
                    
                    <div className="flex gap-2">
                       <select value={editForm.priority} onChange={e => setEditForm({...editForm, priority: e.target.value as PriorityLevel})} className="bg-black/40 text-white text-xs p-2 rounded border border-white/10">
                          <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                       </select>
                       <div className="flex-1 min-w-[120px]">
                            <Calendar 
                                value={editForm.deadline ? new Date(editForm.deadline) : null} 
                                onChange={(e) => {
                                    if (e.value) {
                                        const d = e.value as Date;
                                        const year = d.getFullYear();
                                        const month = String(d.getMonth() + 1).padStart(2, '0');
                                        const day = String(d.getDate()).padStart(2, '0');
                                        setEditForm({...editForm, deadline: `${year}-${month}-${day}`});
                                    } else {
                                        setEditForm({...editForm, deadline: ''});
                                    }
                                }} 
                                className="w-full"
                                inputClassName="w-full bg-black/40 text-white text-xs p-2 rounded border border-white/10 focus:ring-1 focus:ring-lime-500 outline-none placeholder:text-slate-500"
                                placeholder="Deadline"
                                dateFormat="yy-mm-dd"
                                showIcon
                                appendTo={document.body}
                            />
                       </div>
                    </div>

                    {/* Link Manager */}
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5 mt-1">
                        <div className="flex items-center justify-between mb-2">
                             <label className="text-[10px] uppercase font-bold text-slate-500">Links / Resources</label>
                             <button onClick={handleAddLinkInEdit} type="button" className="text-[10px] text-lime-400 font-bold hover:text-lime-300 flex items-center gap-1">
                                <PlusCircle className="w-3 h-3" /> Add
                             </button>
                        </div>
                        <div className="space-y-2">
                            {editForm.links.map((link, idx) => (
                                <div key={link.id || idx} className="flex flex-col gap-1.5 p-1.5 bg-white/5 rounded border border-white/5">
                                    <div className="flex gap-1.5">
                                        <input 
                                            value={link.title} 
                                            onChange={(e) => handleUpdateLinkInEdit(idx, 'title', e.target.value)}
                                            placeholder="Description (e.g. Slides)" 
                                            className="flex-1 bg-black/40 text-white text-xs p-1.5 rounded border border-white/10 min-w-0" 
                                        />
                                        <button onClick={() => handleRemoveLinkInEdit(idx)} className="p-1.5 text-slate-500 hover:text-rose-400 bg-black/40 rounded border border-white/10"><X className="w-3 h-3" /></button>
                                    </div>
                                    <input 
                                        value={link.url} 
                                        onChange={(e) => handleUpdateLinkInEdit(idx, 'url', e.target.value)}
                                        placeholder="https://..." 
                                        className="w-full bg-black/40 text-sky-300 text-xs p-1.5 rounded border border-white/10" 
                                    />
                                </div>
                            ))}
                            {editForm.links.length === 0 && <p className="text-[10px] text-slate-600 italic text-center">No links attached</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-1">
                       <button onClick={() => setEditingId(null)} className="text-xs text-slate-400 px-3 py-1.5 hover:text-white">Cancel</button>
                       <button onClick={submitEdit} className="text-xs bg-lime-600 text-white px-4 py-1.5 rounded font-bold shadow-lg shadow-lime-600/20">Save Changes</button>
                    </div>
                  </li>
                );
              }

              const status = getDaysLeftText(topic.deadline);
              const linkCount = getLinkCount(topic);
              const imageCount = topic.images?.length || 0;
              const hasNote = topic.note && topic.note.trim().length > 0;

              return (
                <li key={topic.id} className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <div className="flex flex-col p-3 gap-1.5">
                    
                    {/* Top Row: Checkbox + Name */}
                    <div className="flex items-start gap-3">
                        <button 
                          onClick={() => onToggleTopic(subject.id, topic.id)}
                          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${topic.isCompleted ? 'bg-lime-900/30 border-lime-500 text-lime-500' : 'border-slate-700 hover:border-slate-500'}`}
                        >
                          {topic.isCompleted && <Check className="w-3 h-3" strokeWidth={3} />}
                        </button>
                        
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onToggleTopic(subject.id, topic.id)}>
                          <span className={`text-sm leading-tight block ${topic.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {topic.name}
                          </span>
                        </div>
                        
                        {/* Edit/Delete Actions */}
                        <div className={`flex items-center gap-1 ${isPhone ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                          <button onClick={(e) => { e.stopPropagation(); startEdit(topic); }} className="p-1.5 text-slate-500 hover:text-white"><Pencil className="w-3 h-3" /></button>
                          <button onClick={(e) => { e.stopPropagation(); setTopicToDelete(topic.id); }} className="p-1.5 text-slate-500 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    </div>

                    {/* Bottom Row: Badges */}
                    <div className="flex flex-wrap items-center gap-2 pl-7">
                        <PriorityBadge priority={topic.priority} />
                        
                        {status && (
                            <div className={`flex items-center gap-1 text-[10px] font-medium ${status.color}`}>
                                <CalendarIcon className="w-3 h-3 opacity-70" /> {status.text}
                            </div>
                        )}
                        
                        {/* Link Button */}
                        {linkCount > 0 && (
                          <button 
                            onClick={(e) => handleLinkClick(e, topic)} 
                            className={`flex items-center gap-1 text-[10px] font-medium transition-colors border px-1.5 py-0.5 rounded ${linkCount > 1 ? 'text-lime-400 border-lime-500/30 bg-lime-500/10 hover:bg-lime-500/20' : 'text-sky-400 border-transparent hover:text-sky-300'}`}
                          >
                             {linkCount > 1 ? (
                               <>
                                 <LinkIcon className="w-3 h-3" /> {linkCount} Links
                               </>
                             ) : (
                               <>
                                 <ExternalLink className="w-3 h-3 opacity-70" /> Open Link
                               </>
                             )}
                          </button>
                        )}

                        {/* Note Button (Always Visible) - Icon Only */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingNote({ topicId: topic.id, title: topic.name, content: topic.note || '' }); }}
                          className={`flex items-center justify-center gap-1 transition-colors border px-1.5 py-0.5 rounded ${
                            hasNote 
                              ? 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20' 
                              : 'text-slate-500 border-transparent bg-white/5 hover:text-white hover:bg-white/10'
                          }`}
                          title={hasNote ? "Edit Note" : "Add Note"}
                        >
                            <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Images Badge */}
                        {imageCount > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setViewingImages({ title: topic.name, images: topic.images || [], topicId: topic.id }); }}
                            className="flex items-center gap-1 text-[10px] font-medium transition-colors border px-1.5 py-0.5 rounded text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10 hover:bg-fuchsia-500/20"
                          >
                             <ImageIcon className="w-3 h-3" /> {imageCount} Imgs
                          </button>
                        )}
                        
                        {/* Upload Button */}
                        <button 
                            onClick={(e) => handleCameraClick(e, topic.id)}
                            disabled={isUploading}
                            className="p-0.5 text-slate-500 hover:text-lime-400 transition-colors"
                            title="Add Photo"
                        >
                            {isUploading && uploadingTopicId === topic.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Camera className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>

                  </div>
                </li>
              );
            })}
            
            {subject.topics.length === 0 && !isAdding && (
              <li className="p-4 text-center text-slate-600 text-xs italic">List empty</li>
            )}
          </ul>

          {/* Footer / Add Button */}
          <div className="p-3 border-t border-white/5 bg-black/40">
             {isAdding ? (
                <form onSubmit={submitAdd} className="p-1">
                   <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="New Topic..." className="w-full bg-black/40 text-white text-sm p-2 rounded border border-white/10 mb-2" />
                   <div className="flex gap-2">
                       <select value={newPriority} onChange={e => setNewPriority(e.target.value as PriorityLevel)} className="bg-black/40 text-white text-xs p-1.5 rounded border border-white/10">
                          <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                       </select>
                       <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1 text-xs text-slate-400 border border-white/10 rounded">Cancel</button>
                       <button type="submit" disabled={!newName.trim()} className="px-3 py-1 text-xs bg-lime-600 text-white font-bold rounded flex-1">Add</button>
                   </div>
                </form>
             ) : (
               <button onClick={() => setIsAdding(true)} className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 bg-white/5 hover:bg-white/10 hover:text-white rounded-lg transition-all border border-white/5">
                  <Plus className="w-3.5 h-3.5" /> Add Task
               </button>
             )}
          </div>
          
           {/* Mobile Delete Subject */}
           {isPhone && (
             <div className="border-t border-white/5">
                <button onClick={() => onDeleteSubject(subject.id)} className="w-full py-3 text-xs text-rose-900/60 hover:text-rose-500 font-medium">
                   Remove Subject
                </button>
             </div>
          )}
        </div>
      )}
    </div>
    
    <TaskLinksModal 
        isOpen={!!viewingLinks}
        onClose={() => setViewingLinks(null)}
        title={viewingLinks?.title || 'Links'}
        links={viewingLinks?.links || []}
    />
    
    <TaskImagesModal 
        isOpen={!!viewingImages}
        onClose={() => setViewingImages(null)}
        title={viewingImages?.title || 'Attachments'}
        images={viewingImages?.images || []}
        onDeleteImage={handleDeleteImage}
    />

    <TaskNoteModal
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        title={editingNote?.title || 'Note'}
        initialContent={editingNote?.content || ''}
        onSave={handleNoteSave}
    />

    <ConfirmationModal
        isOpen={!!topicToDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        onConfirm={() => {
            if (topicToDelete) {
                onDeleteTopic(subject.id, topicToDelete);
                setTopicToDelete(null);
            }
        }}
        onCancel={() => setTopicToDelete(null)}
    />
    </>
  );
});
