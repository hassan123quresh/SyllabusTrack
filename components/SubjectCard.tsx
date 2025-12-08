
import React, { useState } from 'react';
import { Subject, PriorityLevel, Topic } from '../types';
import { CheckCircle2, Circle, Plus, Trash2, Pencil, Clock } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  onToggleTopic: (subjectId: string, topicId: string) => void;
  onAddTopic: (subjectId: string, topicName: string, priority: PriorityLevel, deadline?: string) => void;
  onDeleteSubject: (subjectId: string) => void;
  onDeleteTopic: (subjectId: string, topicId: string) => void;
  onEditTopic: (subjectId: string, topic: Topic) => void;
}

const getDaysLeft = (deadline?: string) => {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const PriorityBadge: React.FC<{ priority?: PriorityLevel }> = ({ priority }) => {
  if (!priority) return null;
  
  const colors = {
    High: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[priority]} uppercase tracking-wider backdrop-blur-sm shadow-[0_0_10px_rgba(0,0,0,0.2)]`}>
      {priority}
    </span>
  );
};

export const SubjectCard: React.FC<SubjectCardProps> = ({ 
  subject, 
  onToggleTopic, 
  onAddTopic,
  onDeleteSubject,
  onDeleteTopic,
  onEditTopic
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('Medium');
  const [newDeadline, setNewDeadline] = useState('');

  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPriority, setEditPriority] = useState<PriorityLevel>('Medium');
  const [editDeadline, setEditDeadline] = useState('');

  const completedCount = subject.topics.filter(t => t.isCompleted).length;
  const totalCount = subject.topics.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Updated Donut for Dark Mode - brighter segments
  const donutStyle = {
    background: `conic-gradient(${subject.color} 0% ${progress}%, rgba(255,255,255,0.05) ${progress}% 100%)`
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicName.trim()) {
      onAddTopic(subject.id, newTopicName.trim(), newPriority, newDeadline || undefined);
      setNewTopicName('');
      setNewPriority('Medium');
      setNewDeadline('');
      setIsAdding(false);
    }
  };

  const startEditing = (topic: Topic) => {
    setEditingTopicId(topic.id);
    setEditName(topic.name);
    setEditPriority(topic.priority || 'Medium');
    setEditDeadline(topic.deadline || '');
  };

  const cancelEditing = () => {
    setEditingTopicId(null);
    setEditName('');
    setEditPriority('Medium');
    setEditDeadline('');
  };

  const saveEdit = (originalTopic: Topic) => {
    if (editName.trim()) {
      onEditTopic(subject.id, {
        ...originalTopic,
        name: editName.trim(),
        priority: editPriority,
        deadline: editDeadline || undefined
      });
      cancelEditing();
    }
  };

  return (
    <div className="glass-card rounded-3xl overflow-hidden flex flex-col h-full max-h-[600px] group/card relative border border-white/5">
      {/* Subtle top highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lime-500/20 to-transparent"></div>

      {/* Header with Donut Chart */}
      <div className="p-5 sm:p-6 pb-2 flex justify-between items-start">
        <div className="flex-1 pr-3 min-w-0">
           <div className="flex items-center gap-2 sm:gap-3 mb-2">
             <h3 className="text-lg sm:text-xl font-bold text-white truncate tracking-tight drop-shadow-md" title={subject.title}>{subject.title}</h3>
             <button 
                onClick={() => onDeleteSubject(subject.id)}
                // Mobile: Always visible. Desktop: Visible on Hover.
                className="opacity-100 lg:opacity-0 lg:group-hover/card:opacity-100 p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-all"
                title="Delete Subject"
              >
                <Trash2 className="w-4 h-4" />
              </button>
           </div>
           <div className="flex flex-wrap gap-3 sm:gap-4 text-[10px] sm:text-xs text-slate-400 font-semibold tracking-wide uppercase">
             <span className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
               {totalCount - completedCount} Left
             </span>
             <span className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: subject.color, color: subject.color }}></span>
               {completedCount} Done
             </span>
           </div>
        </div>

        {/* Dark Glossy Donut Chart */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex-shrink-0 flex items-center justify-center shadow-2xl bg-black/20 backdrop-blur-md border border-white/5" style={donutStyle}>
          {/* Donut Hole - Matches Deep Dark Green Background */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0a1610] rounded-full flex items-center justify-center shadow-inner z-10">
            <span className="text-xs font-bold text-white">{progress}%</span>
          </div>
        </div>
      </div>
      
      <div className="h-4"></div> 

      <div className="px-5 sm:px-6 pb-6 flex-1 flex flex-col min-h-0">
        {/* Checklist */}
        <ul className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
          {subject.topics.map((topic) => {
            const isEditing = editingTopicId === topic.id;

            if (isEditing) {
              return (
                <li key={topic.id} className="p-4 bg-white/5 backdrop-blur-md border border-lime-500/20 rounded-xl space-y-3 shadow-lg z-20 relative">
                  <div>
                    <label className="text-[10px] font-bold text-lime-400/80 uppercase tracking-widest">Topic Name</label>
                    <input 
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="glass-input w-full text-sm px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-lime-500/50 transition-all text-white placeholder-slate-500"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-lime-400/80 uppercase tracking-widest">Priority</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as PriorityLevel)}
                        className="glass-input w-full text-xs px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-lime-500/50 text-slate-200"
                      >
                        <option value="High" className="text-slate-900">High</option>
                        <option value="Medium" className="text-slate-900">Medium</option>
                        <option value="Low" className="text-slate-900">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-lime-400/80 uppercase tracking-widest">Deadline</label>
                      <input 
                        type="date"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        className="glass-input w-full text-xs px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-lime-500/50 text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      onClick={cancelEditing}
                      className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => saveEdit(topic)}
                      disabled={!editName.trim()}
                      className="px-4 py-1.5 text-xs font-bold bg-lime-500 text-black hover:bg-lime-400 rounded-lg shadow-lg disabled:opacity-50 transition-all"
                    >
                      Save
                    </button>
                  </div>
                </li>
              );
            }

            // Standard View
            const daysLeft = getDaysLeft(topic.deadline);
            let daysText = '';
            let daysColor = 'text-slate-500';
            
            if (daysLeft !== null) {
              if (daysLeft < 0) {
                daysText = `${Math.abs(daysLeft)}d overdue`;
                daysColor = 'text-rose-400 font-bold';
              } else if (daysLeft === 0) {
                daysText = 'Due today';
                daysColor = 'text-amber-400 font-bold';
              } else {
                daysText = `${daysLeft}d left`;
                daysColor = 'text-slate-400';
              }
            }

            return (
              <li key={topic.id} className="group flex flex-col gap-1 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    onClick={() => onToggleTopic(subject.id, topic.id)}
                  >
                    <div className={`transition-all duration-300 flex-shrink-0 transform group-hover:scale-110 ${topic.isCompleted ? 'text-lime-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                      {topic.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 drop-shadow-[0_0_8px_rgba(163,230,53,0.5)]" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-sm font-medium truncate transition-all duration-300 ${topic.isCompleted ? 'text-slate-500 line-through decoration-slate-600 opacity-60' : 'text-slate-200'}`}>
                      {topic.name}
                    </span>
                  </div>
                  
                  {/* Actions Group - Visible on Mobile, Hover on Desktop */}
                  <div className="flex items-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 gap-1 ml-2 translate-x-0 lg:translate-x-2 lg:group-hover:translate-x-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(topic);
                      }}
                      className="p-1.5 text-slate-500 hover:text-lime-400 hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm"
                      title="Edit Topic"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTopic(subject.id, topic.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm"
                      title="Delete Topic"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Meta info row */}
                <div className="flex items-center gap-3 pl-8 text-xs flex-wrap">
                  {topic.priority && <PriorityBadge priority={topic.priority} />}
                  
                  {daysText && (
                    <div className={`flex items-center gap-1 ${daysColor} bg-white/5 px-2 py-0.5 rounded-full border border-white/5`}>
                      <Clock className="w-3 h-3" />
                      <span>{daysText}</span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
          {subject.topics.length === 0 && !isAdding && (
             <li className="text-center text-slate-500 text-sm italic py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
               No topics yet. Start adding!
             </li>
          )}
        </ul>

        {/* Add Topic Section */}
        <div className="mt-4 pt-4 border-t border-white/10 flex-shrink-0">
           {isAdding ? (
             <form onSubmit={handleAddSubmit} className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl">
               <input 
                 type="text" 
                 value={newTopicName}
                 onChange={e => setNewTopicName(e.target.value)}
                 placeholder="What needs to be done?"
                 className="glass-input w-full text-sm px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-lime-500/50 text-white placeholder:text-slate-500"
                 autoFocus
               />
               
               <div className="flex gap-2">
                 <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="glass-input text-xs px-2 py-2 rounded-lg outline-none focus:ring-2 focus:ring-lime-500/50 text-slate-300"
                 >
                   <option value="High" className="text-slate-900">High</option>
                   <option value="Medium" className="text-slate-900">Medium</option>
                   <option value="Low" className="text-slate-900">Low</option>
                 </select>
                 
                 <input 
                   type="date"
                   value={newDeadline}
                   onChange={e => setNewDeadline(e.target.value)}
                   className="glass-input flex-1 text-xs px-2 py-2 rounded-lg outline-none focus:ring-2 focus:ring-lime-500/50 text-slate-300"
                 />
               </div>

               <div className="flex justify-end gap-2 mt-1">
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 text-slate-400 hover:text-white text-xs font-bold hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={!newTopicName.trim()}
                    className="flex items-center gap-1 px-4 py-1.5 bg-lime-500 text-black rounded-lg hover:bg-lime-400 disabled:opacity-50 text-xs font-bold transition-all shadow-lg shadow-lime-500/20"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
               </div>
             </form>
           ) : (
             <button 
               onClick={() => setIsAdding(true)}
               className="group flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 hover:text-lime-400 transition-all w-full p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
             >
               <div className="p-1 bg-white/5 group-hover:bg-lime-500/20 rounded-full transition-colors shadow-sm">
                  <Plus className="w-3.5 h-3.5" />
               </div>
               <span>Add Topic</span>
             </button>
           )}
        </div>
      </div>
    </div>
  );
};
