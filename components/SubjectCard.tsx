
import React, { useState, useEffect } from 'react';
import { Subject, PriorityLevel, Topic } from '../types';
import { CheckCircle2, Circle, Plus, Trash2, Pencil, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  onToggleTopic: (subjectId: string, topicId: string) => void;
  onAddTopic: (subjectId: string, topicName: string, priority: PriorityLevel, deadline?: string, link?: string) => void;
  onDeleteSubject: (subjectId: string) => void;
  onDeleteTopic: (subjectId: string, topicId: string) => void;
  onEditTopic: (subjectId: string, topic: Topic) => void;
  isPhone?: boolean;
}

const getDaysLeft = (deadline?: string) => {
  if (!deadline) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(deadline); due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const PriorityBadge: React.FC<{ priority?: PriorityLevel }> = ({ priority }) => {
  if (!priority) return null;
  const colors = { High: 'bg-rose-500/20 text-rose-300 border-rose-500/30', Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30', Low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[priority]} uppercase tracking-wider backdrop-blur-sm`}>{priority}</span>;
};

// Memoized for performance
export const SubjectCard = React.memo(({ subject, onToggleTopic, onAddTopic, onDeleteSubject, onDeleteTopic, onEditTopic, isPhone = false }: SubjectCardProps) => {
  // Mobile Optimization: Collapse by default on phone to save DOM rendering
  const [isExpanded, setIsExpanded] = useState(!isPhone);
  const [isAdding, setIsAdding] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('Medium');
  const [newDeadline, setNewDeadline] = useState('');
  const [newLink, setNewLink] = useState('');
  
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPriority, setEditPriority] = useState<PriorityLevel>('Medium');
  const [editDeadline, setEditDeadline] = useState('');
  const [editLink, setEditLink] = useState('');

  // Sync expanded state if orientation changes (desktop to mobile resize)
  useEffect(() => {
    setIsExpanded(!isPhone);
  }, [isPhone]);

  const completedCount = subject.topics.filter(t => t.isCompleted).length;
  const totalCount = subject.topics.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  
  // Use conic-gradient for all devices for visual correctness. It is highly performant on modern GPUs.
  const donutStyle = { 
    background: `conic-gradient(${subject.color} 0% ${progress}%, rgba(255,255,255,0.05) ${progress}% 100%)` 
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicName.trim()) {
      onAddTopic(subject.id, newTopicName.trim(), newPriority, newDeadline || undefined, newLink.trim() || undefined);
      setNewTopicName(''); setNewPriority('Medium'); setNewDeadline(''); setNewLink(''); setIsAdding(false);
    }
  };

  const startEditing = (topic: Topic) => {
    setEditingTopicId(topic.id); setEditName(topic.name);
    setEditPriority(topic.priority || 'Medium'); setEditDeadline(topic.deadline || '');
    setEditLink(topic.link || '');
  };

  const saveEdit = (originalTopic: Topic) => {
    if (editName.trim()) {
      onEditTopic(subject.id, { 
        ...originalTopic, 
        name: editName.trim(), 
        priority: editPriority, 
        deadline: editDeadline || undefined,
        link: editLink.trim() || undefined
      });
      setEditingTopicId(null);
    }
  };

  return (
    <div className={`glass-card rounded-3xl overflow-hidden flex flex-col ${isPhone ? 'h-auto mb-3 bg-[#08100c]' : 'h-full max-h-[600px]'} group/card relative border border-white/5`}>
      {/* Decorative gradient - Hide on Phone */}
      {!isPhone && <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lime-500/20 to-transparent"></div>}
      
      {/* Header - Clickable on Phone */}
      <div 
         className={`p-5 sm:p-6 pb-2 flex justify-between items-start ${isPhone ? 'cursor-pointer active:bg-white/5' : ''}`}
         onClick={() => isPhone && setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 pr-3 min-w-0">
           <div className="flex items-center gap-2 sm:gap-3 mb-2">
             <h3 className="text-lg sm:text-xl font-bold text-white truncate tracking-tight" title={subject.title}>{subject.title}</h3>
             {/* Delete button: Always visible on mobile if needed, or desktop hover */}
             <button 
               onClick={(e) => { e.stopPropagation(); onDeleteSubject(subject.id); }} 
               className={`${isPhone ? 'opacity-100 text-slate-600' : 'opacity-0 group-hover/card:opacity-100 text-slate-400'} p-1.5 hover:text-red-400 hover:bg-white/5 rounded-full transition-all`}
             >
               <Trash2 className="w-4 h-4" />
             </button>
             {isPhone && (
               <div className="ml-auto text-slate-500">
                 {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
               </div>
             )}
           </div>
           <div className="flex flex-wrap gap-3 sm:gap-4 text-[10px] sm:text-xs text-slate-400 font-semibold tracking-wide uppercase">
             <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>{totalCount - completedCount} Left</span>
             <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.color }}></span>{completedCount} Done</span>
           </div>
        </div>
        
        {/* Progress Indicator - Consistent rendering for Mobile & Desktop */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg bg-black/20" style={donutStyle}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0a1610] rounded-full flex items-center justify-center relative z-10"><span className="text-xs font-bold text-white">{progress}%</span></div>
        </div>
      </div>
      
      {!isPhone && <div className="h-4"></div>} 
      
      {/* Content Body - Conditionally Rendered on Phone */}
      {isExpanded && (
        <div className="px-5 sm:px-6 pb-6 flex-1 flex flex-col min-h-0 animate-in fade-in duration-200">
          <ul className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 max-h-[400px]">
            {subject.topics.map((topic) => {
              if (editingTopicId === topic.id) {
                return (
                  <li key={topic.id} className="p-4 bg-white/5 backdrop-blur-md border border-lime-500/20 rounded-xl space-y-3 z-20">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="glass-input w-full text-sm px-3 py-2 rounded-lg outline-none" autoFocus placeholder="Topic Name" />
                    <input type="text" value={editLink} onChange={(e) => setEditLink(e.target.value)} className="glass-input w-full text-sm px-3 py-2 rounded-lg outline-none" placeholder="Link (https://...)" />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as PriorityLevel)} className="glass-input w-full text-xs px-2 py-2 rounded-lg">
                          {['High', 'Medium', 'Low'].map(p => <option key={p} value={p} className="text-black">{p}</option>)}
                      </select>
                      <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} className="glass-input w-full text-xs px-2 py-2 rounded-lg" />
                    </div>
                    <div className="flex justify-end gap-2"><button onClick={() => setEditingTopicId(null)} className="px-3 py-1.5 text-xs font-bold text-slate-400">Cancel</button><button onClick={() => saveEdit(topic)} className="px-4 py-1.5 text-xs font-bold bg-lime-500 text-black rounded-lg">Save</button></div>
                  </li>
                );
              }
              const daysLeft = getDaysLeft(topic.deadline);
              let daysText = '', daysColor = 'text-slate-500';
              if (daysLeft !== null) {
                if (daysLeft < 0) { daysText = `${Math.abs(daysLeft)}d overdue`; daysColor = 'text-rose-400 font-bold'; } 
                else if (daysLeft === 0) { daysText = 'Due today'; daysColor = 'text-amber-400 font-bold'; } 
                else { daysText = `${daysLeft}d left`; daysColor = 'text-slate-400'; }
              }
              return (
                <li key={topic.id} className="group flex flex-col gap-1 border-b border-white/5 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={() => onToggleTopic(subject.id, topic.id)}>
                      <div className={`transition-all ${topic.isCompleted ? 'text-lime-400' : 'text-slate-500'}`}>{topic.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}</div>
                      <span className={`text-sm font-medium truncate transition-all ${topic.isCompleted ? 'text-slate-500 line-through opacity-60' : 'text-slate-200'}`}>{topic.name}</span>
                    </div>
                    <div className={`flex items-center gap-1 ml-2 ${isPhone ? 'opacity-100' : 'opacity-0 lg:opacity-0 lg:group-hover:opacity-100'} transition-all`}>
                      <button onClick={(e) => { e.stopPropagation(); startEditing(topic); }} className="p-1.5 text-slate-500 hover:text-lime-400 rounded-full"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteTopic(subject.id, topic.id); }} className="p-1.5 text-slate-500 hover:text-rose-400 rounded-full"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-8 text-xs flex-wrap">
                    {topic.priority && <PriorityBadge priority={topic.priority} />}
                    {daysText && <div className={`flex items-center gap-1 ${daysColor} bg-white/5 px-2 py-0.5 rounded-full`}><Clock className="w-3 h-3" /><span>{daysText}</span></div>}
                    {topic.link && (
                      <a href={topic.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full hover:bg-sky-500/20 transition-colors border border-sky-500/20" onClick={(e) => e.stopPropagation()}>
                         <ExternalLink className="w-3 h-3" />
                         <span className="font-bold">Open Link</span>
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
            {subject.topics.length === 0 && !isAdding && <li className="text-center text-slate-500 text-sm italic py-4">No topics yet.</li>}
          </ul>
          <div className="mt-4 pt-4 border-t border-white/10 flex-shrink-0">
             {isAdding ? (
               <form onSubmit={handleAddSubmit} className="flex flex-col gap-3 animate-in fade-in bg-white/5 p-4 rounded-xl border border-white/10">
                 <input type="text" value={newTopicName} onChange={e => setNewTopicName(e.target.value)} placeholder="Topic name..." className="glass-input w-full text-sm px-3 py-2 rounded-lg" autoFocus />
                 <input type="text" value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="Resource Link (optional)..." className="glass-input w-full text-sm px-3 py-2 rounded-lg text-slate-300" />
                 <div className="flex gap-2">
                   <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as PriorityLevel)} className="glass-input text-xs px-2 py-2 rounded-lg text-slate-300">
                     {['High', 'Medium', 'Low'].map(p => <option key={p} value={p} className="text-black">{p}</option>)}
                   </select>
                   <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} className="glass-input flex-1 text-xs px-2 py-2 rounded-lg" />
                 </div>
                 <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-slate-400 text-xs font-bold">Cancel</button><button type="submit" disabled={!newTopicName.trim()} className="px-4 py-1.5 bg-lime-500 text-black rounded-lg text-xs font-bold"><Plus className="w-3 h-3" /> Add</button></div>
               </form>
             ) : (
               <button onClick={() => setIsAdding(true)} className="group flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 hover:text-lime-400 transition-all w-full p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10">
                 <div className="p-1 bg-white/5 group-hover:bg-lime-500/20 rounded-full"><Plus className="w-3.5 h-3.5" /></div><span>Add Topic</span>
               </button>
             )}
          </div>
        </div>
      )}
    </div>
  );
});
