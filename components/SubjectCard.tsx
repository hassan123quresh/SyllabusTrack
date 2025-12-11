
import React, { useState } from 'react';
import { Subject, PriorityLevel, Topic } from '../types';
import { Check, Plus, Trash2, Pencil, Calendar, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  onToggleTopic: (subjectId: string, topicId: string) => void;
  onAddTopic: (subjectId: string, topicName: string, priority: PriorityLevel, deadline?: string, link?: string) => void;
  onDeleteSubject: (subjectId: string) => void;
  onDeleteTopic: (subjectId: string, topicId: string) => void;
  onEditTopic: (subjectId: string, topic: Topic) => void;
  isPhone?: boolean;
}

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

// Optimized Badge Component - No heavy blurs, just solid colors/borders
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
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{name: string, priority: PriorityLevel, deadline: string, link: string}>({
    name: '', priority: 'Medium', deadline: '', link: ''
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
    setEditForm({
      name: topic.name,
      priority: topic.priority || 'Medium',
      deadline: topic.deadline || '',
      link: topic.link || ''
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
          link: editForm.link || undefined
        });
      }
      setEditingId(null);
    }
  };

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddTopic(subject.id, newName.trim(), newPriority, newDeadline || undefined, newLink.trim() || undefined);
      setNewName(''); setNewPriority('Medium'); setNewDeadline(''); setNewLink(''); setIsAdding(false);
    }
  };

  return (
    <div className="bg-[#08100c] border border-white/5 rounded-xl overflow-hidden flex flex-col mb-4 md:mb-0 h-auto md:h-full shadow-sm">
      {/* Header */}
      <div 
        onClick={() => isPhone && setIsExpanded(!isExpanded)}
        className={`p-3 sm:p-4 flex flex-col gap-2 relative ${isPhone ? 'active:bg-white/5 cursor-pointer' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 min-w-0">
             {/* Simple Color Strip instead of glowing orb */}
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
        
        {/* Simple CSS Progress Bar */}
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
                  <li key={topic.id} className="p-3 bg-white/5 border-b border-white/5">
                    <input autoFocus value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-black/40 text-white text-sm p-2 rounded border border-white/10 mb-2" placeholder="Topic Name" />
                    <div className="flex gap-2 mb-2">
                       <select value={editForm.priority} onChange={e => setEditForm({...editForm, priority: e.target.value as PriorityLevel})} className="bg-black/40 text-white text-xs p-2 rounded border border-white/10">
                          <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                       </select>
                       <input type="date" value={editForm.deadline} onChange={e => setEditForm({...editForm, deadline: e.target.value})} className="bg-black/40 text-white text-xs p-2 rounded border border-white/10 flex-1" />
                    </div>
                    <input value={editForm.link} onChange={e => setEditForm({...editForm, link: e.target.value})} className="w-full bg-black/40 text-slate-300 text-xs p-2 rounded border border-white/10 mb-2" placeholder="Link..." />
                    <div className="flex justify-end gap-2">
                       <button onClick={() => setEditingId(null)} className="text-xs text-slate-400 px-3 py-1">Cancel</button>
                       <button onClick={submitEdit} className="text-xs bg-lime-600 text-white px-3 py-1 rounded">Save</button>
                    </div>
                  </li>
                );
              }

              const status = getDaysLeftText(topic.deadline);

              return (
                <li key={topic.id} className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <div className="flex flex-col p-3 gap-1.5 active:bg-white/5">
                    
                    {/* Top Row: Checkbox + Name */}
                    <div className="flex items-start gap-3">
                        <button 
                          onClick={() => onToggleTopic(subject.id, topic.id)}
                          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${topic.isCompleted ? 'bg-lime-900/30 border-lime-500 text-lime-500' : 'border-slate-700 hover:border-slate-500'}`}
                        >
                          {topic.isCompleted && <Check className="w-3 h-3" strokeWidth={3} />}
                        </button>
                        
                        <div className="flex-1 min-w-0" onClick={() => onToggleTopic(subject.id, topic.id)}>
                          <span className={`text-sm leading-tight block ${topic.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {topic.name}
                          </span>
                        </div>
                        
                        {/* Edit/Delete Actions */}
                        <div className={`flex items-center gap-1 ${isPhone ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button onClick={(e) => { e.stopPropagation(); startEdit(topic); }} className="p-1.5 text-slate-500 hover:text-white"><Pencil className="w-3 h-3" /></button>
                          <button onClick={(e) => { e.stopPropagation(); onDeleteTopic(subject.id, topic.id); }} className="p-1.5 text-slate-500 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    </div>

                    {/* Bottom Row: Badges */}
                    <div className="flex flex-wrap items-center gap-2 pl-7">
                        <PriorityBadge priority={topic.priority} />
                        
                        {status && (
                            <div className={`flex items-center gap-1 text-[10px] font-medium ${status.color}`}>
                                <Calendar className="w-3 h-3 opacity-70" /> {status.text}
                            </div>
                        )}
                        
                        {topic.link && (
                          <a href={topic.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-[10px] text-sky-400 font-medium hover:text-sky-300">
                             <ExternalLink className="w-3 h-3 opacity-70" /> Open Link
                          </a>
                        )}
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
          <div className="p-2 border-t border-white/5 bg-black/20">
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
               <button onClick={() => setIsAdding(true)} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-white hover:bg-white/5 rounded transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Item
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
  );
});
