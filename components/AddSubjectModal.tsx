
import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Subject, PriorityLevel } from '../types';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (subject: Subject) => void;
}

const COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ef4444', // red-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#f43f5e', // rose-500
  '#84cc16', // lime-500
];

interface TempTopic {
  name: string;
  priority: PriorityLevel;
  deadline?: string;
}

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicPriority, setNewTopicPriority] = useState<PriorityLevel>('Medium');
  const [newTopicDeadline, setNewTopicDeadline] = useState('');
  
  const [topics, setTopics] = useState<TempTopic[]>([]);

  if (!isOpen) return null;

  const handleAddTopic = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newTopicName.trim()) {
      setTopics([
        ...topics, 
        { 
          name: newTopicName.trim(), 
          priority: newTopicPriority,
          deadline: newTopicDeadline || undefined
        }
      ]);
      setNewTopicName('');
      setNewTopicPriority('Medium');
      setNewTopicDeadline('');
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newSubject: Subject = {
      id: `subj-${Date.now()}`,
      title: title.trim(),
      color: selectedColor,
      topics: topics.map((t, i) => ({
        id: `topic-${Date.now()}-${i}`,
        name: t.name,
        isCompleted: false,
        priority: t.priority,
        deadline: t.deadline
      }))
    };

    onAdd(newSubject);
    setTitle('');
    setTopics([]);
    setNewTopicName('');
    setNewTopicPriority('Medium');
    setNewTopicDeadline('');
    setSelectedColor(COLORS[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel bg-[#050b07]/90 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
          <h2 className="font-bold text-xl text-white tracking-tight">New Subject</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subject Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quantum Physics"
              className="glass-input w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-lime-500/50 outline-none transition-all text-white placeholder:text-slate-500 font-medium"
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
             <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Color Tag</label>
             <div className="flex flex-wrap gap-3">
               {COLORS.map((c) => (
                 <button
                   key={c}
                   type="button"
                   onClick={() => setSelectedColor(c)}
                   className={`w-8 h-8 rounded-full transition-all duration-300 shadow-lg border border-white/20 ${selectedColor === c ? 'ring-2 ring-offset-2 ring-offset-[#050b07] ring-lime-500 scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                   style={{ backgroundColor: c, boxShadow: `0 0 10px ${c}40` }}
                   title={c}
                 />
               ))}
             </div>
          </div>

          {/* Topics Input */}
          <div className="space-y-3">
             <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initial Topics</label>
             
             <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3 shadow-inner">
               <input
                 type="text"
                 value={newTopicName}
                 onChange={(e) => setNewTopicName(e.target.value)}
                 placeholder="First topic..."
                 className="glass-input w-full px-3 py-2 rounded-lg focus:ring-1 focus:ring-lime-500 outline-none text-sm placeholder:text-slate-500 text-white"
               />
               <div className="flex gap-2">
                  <select
                     value={newTopicPriority}
                     onChange={(e) => setNewTopicPriority(e.target.value as PriorityLevel)}
                     className="glass-input flex-1 text-sm px-2 py-2 rounded-lg focus:ring-1 focus:ring-lime-500 outline-none text-slate-300"
                  >
                    <option value="High" className="text-slate-900">High</option>
                    <option value="Medium" className="text-slate-900">Medium</option>
                    <option value="Low" className="text-slate-900">Low</option>
                  </select>
                  <input 
                     type="date"
                     value={newTopicDeadline}
                     onChange={(e) => setNewTopicDeadline(e.target.value)}
                     className="glass-input flex-1 text-sm px-2 py-2 rounded-lg focus:ring-1 focus:ring-lime-500 outline-none text-slate-300"
                  />
               </div>
               <button 
                 onClick={handleAddTopic}
                 disabled={!newTopicName.trim()}
                 className="w-full py-2 bg-lime-500 text-black rounded-lg hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(163,230,53,0.3)] hover:shadow-[0_0_20px_rgba(163,230,53,0.5)]"
               >
                 <Plus className="w-4 h-4" /> Add to List
               </button>
             </div>

             {/* Topics List */}
             <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
               {topics.length === 0 && (
                 <p className="text-center text-slate-500 text-sm py-4 italic border border-dashed border-white/10 rounded-lg">
                   List is empty
                 </p>
               )}
               {topics.map((t, idx) => (
                 <div key={idx} className="flex flex-col bg-white/5 px-4 py-2 rounded-lg border border-white/10 shadow-sm backdrop-blur-sm">
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-semibold text-slate-200 truncate">{t.name}</span>
                     <button 
                       onClick={() => handleRemoveTopic(idx)}
                       className="text-slate-500 hover:text-red-400 transition-colors"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                   <div className="flex gap-3 text-xs text-slate-400 mt-1">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        t.priority === 'High' ? 'bg-red-500/20 text-red-300' : 
                        t.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300' : 
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>{t.priority}</span>
                      {t.deadline && (
                        <span className="flex items-center gap-1 font-medium text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {t.deadline}
                        </span>
                      )}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="p-5 border-t border-white/10 bg-black/20 flex gap-3 justify-end backdrop-blur-md">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-400 font-bold hover:bg-white/10 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-6 py-2.5 bg-lime-500 text-black font-bold rounded-xl hover:bg-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.2)] hover:shadow-[0_0_25px_rgba(163,230,53,0.4)] disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};
