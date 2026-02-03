
import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { Subject, Topic, PriorityLevel, Exam } from '../types';
import { SubjectCard } from './SubjectCard';
import { AddSubjectModal } from './AddSubjectModal';
import { ConfirmationModal } from './ConfirmationModal';
import { 
  Activity, TrendingUp, AlertCircle, Calendar as CalendarIcon, Trophy, 
  AlertTriangle, Layers, Trash2, Timer, Plus, CloudUpload, PlusCircle, ShieldAlert, Copy,
  ChevronDown, Clock
} from 'lucide-react';
import { dbService } from '../services/db';
import { Calendar } from 'primereact/calendar';

// Lazy load charts
const SubjectProgressChart = React.lazy(() => import('./DashboardCharts').then(module => ({ default: module.SubjectProgressChart })));

export const Dashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [examToDelete, setExamToDelete] = useState<string | null>(null); // New state for exam deletion
  const [isAddingExam, setIsAddingExam] = useState(false);
  
  // Add Exam Form State
  const [newExamSubject, setNewExamSubject] = useState('');
  const [newExamDate, setNewExamDate] = useState<string>('');
  const [newExamTime, setNewExamTime] = useState<string>('09:00'); // Default time

  const [isMobile, setIsMobile] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    // Hidden feature to reset app for users who can't delete data
    (window as any).resetApp = async () => {
      if (confirm('EMERGENCY RESET: Delete all data?')) {
        await dbService.clearAllData();
        alert('Data cleared. You can now upload the new syllabus.');
      }
    };

    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1280);
      setIsPhone(width < 768);
    };
    checkScreenSize();
    let timeoutId: number;
    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(checkScreenSize, 200);
    };
    window.addEventListener('resize', debouncedCheck);
    
    const chartTimer = setTimeout(() => setChartsReady(true), 100);

    return () => {
      window.removeEventListener('resize', debouncedCheck);
      clearTimeout(timeoutId);
      clearTimeout(chartTimer);
      delete (window as any).resetApp;
    };
  }, []);

  // Subscribe to Subjects with Error Handling
  useEffect(() => {
    const unsubscribe = dbService.subscribeToSubjects(
      (data) => {
        setSubjects(data);
        setLoading(false);
        setDbError(null);
      },
      (error) => {
        if (error?.code === 'permission-denied') {
          setDbError('permission-denied');
        } else {
          setDbError(error.message);
        }
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Exams
  useEffect(() => {
    const unsubscribe = dbService.subscribeToExams((data) => {
      const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setExams(sorted);
    });
    return () => unsubscribe();
  }, []);

  const seedDatabase = useCallback(async () => {
    setLoading(true);
    await dbService.seedDatabase();
    setLoading(false);
  }, []);

  const handleAddSubject = useCallback(async (newSubject: Subject) => {
    await dbService.addSubject(newSubject);
  }, []);

  const handleDeleteSubjectRequest = useCallback((subjectId: string) => setSubjectToDelete(subjectId), []);

  const confirmDeleteSubject = useCallback(async () => {
    if (subjectToDelete) {
      try {
        await dbService.deleteSubject(subjectToDelete);
      } catch (error) {
        console.error("Failed to delete subject:", error);
        alert("Failed to delete subject. Please check your connection.");
      }
      setSubjectToDelete(null);
    }
  }, [subjectToDelete]);

  const handleToggleTopic = useCallback(async (subjectId: string, topicId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
      const updatedTopics = subject.topics.map(t => t.id === topicId ? { ...t, isCompleted: !t.isCompleted } : t);
      await dbService.updateSubjectTopics(subjectId, updatedTopics);
    }
  }, [subjects]);

  const handleAddTopicToSubject = useCallback(async (subjectId: string, topicName: string, priority: PriorityLevel, deadline?: string, link?: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
      const newTopic: Topic = {
        id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: topicName,
        isCompleted: false,
        priority,
        deadline,
        link
      };
      await dbService.updateSubjectTopics(subjectId, [...subject.topics, newTopic]);
    }
  }, [subjects]);

  const handleDeleteTopic = useCallback(async (subjectId: string, topicId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
      const updatedTopics = subject.topics.filter(t => t.id !== topicId);
      await dbService.updateSubjectTopics(subjectId, updatedTopics);
    }
  }, [subjects]);

  const handleEditTopic = useCallback(async (subjectId: string, updatedTopic: Topic) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
      const updatedTopics = subject.topics.map(t => t.id === updatedTopic.id ? updatedTopic : t);
      await dbService.updateSubjectTopics(subjectId, updatedTopics);
    }
  }, [subjects]);

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newExamSubject.trim() && newExamDate) {
      await dbService.addExam({
        id: `exam-${Date.now()}`,
        subject: newExamSubject.trim(), 
        date: newExamDate,
        time: newExamTime // Now storing the precise time
      });
      setNewExamSubject(''); setNewExamDate(''); setNewExamTime('09:00'); setIsAddingExam(false);
    }
  };

  const confirmDeleteExam = useCallback(async () => {
    if (examToDelete) {
        try {
          await dbService.deleteExam(examToDelete);
        } catch (error) {
           console.error("Failed to delete exam:", error);
           alert("Failed to delete exam.");
        }
        setExamToDelete(null);
    }
  }, [examToDelete]);

  const copyRulesToClipboard = () => {
    const rules = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
    navigator.clipboard.writeText(rules);
    alert("Rules copied to clipboard!");
  };

  // Analytics - Memoized
  const { nextExam, totalTasks, completedTasks, pendingTasks, completionPercentage, highPriorityPending, overdueCount, subjectProgressData, insights } = useMemo(() => {
    const now = new Date();
    
    // Sort exams by absolute timestamp
    const sortedExams = [...exams]
      .map(e => {
        // Construct full date object: Date + Time (or 00:00 if no time)
        const dateTimeStr = `${e.date}T${e.time ? e.time : '00:00'}`;
        const dateTime = new Date(dateTimeStr);
        return { ...e, dateTime };
      })
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    // Find first exam in the future
    const upcoming = sortedExams.find(e => e.dateTime > now);
    
    let nextExam = null;
    if (upcoming) {
      const diffMs = upcoming.dateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      let timeLeftVal = 0;
      let timeLeftUnit = '';

      // Less than 3 days (72 hours) -> Show Hours
      if (diffHours < 72) {
        timeLeftVal = Math.ceil(diffHours);
        timeLeftUnit = 'Hours Left';
      } else {
        timeLeftVal = Math.ceil(diffDays);
        timeLeftUnit = 'Days Left';
      }

      nextExam = { 
        ...upcoming, 
        displayVal: timeLeftVal,
        displayUnit: timeLeftUnit,
        formattedDate: upcoming.dateTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        formattedTime: upcoming.time 
          ? new Date(`1970-01-01T${upcoming.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) 
          : null
      };
    }

    const allTopics = subjects.flatMap(s => s.topics);
    const totalTasks = allTopics.length;
    const completedTasks = allTopics.filter(t => t.isCompleted).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const highPriorityPending = allTopics.filter(t => t.priority === 'High' && !t.isCompleted).length;
    
    const today = new Date(); today.setHours(0,0,0,0);
    const overdueCount = allTopics.filter(t => {
      if (t.isCompleted || !t.deadline) return false;
      const d = new Date(t.deadline); d.setHours(0,0,0,0);
      return d < today;
    }).length;

    const subjectProgressData = subjects.map(s => ({
      name: s.title,
      Completed: s.topics.filter(t => t.isCompleted).length,
      Remaining: s.topics.filter(t => !t.isCompleted).length,
      color: s.color
    }));

    const insights = [];
    subjects.forEach(s => {
      const done = s.topics.filter(t => t.isCompleted).length;
      const total = s.topics.length;
      if (total > 0 && done === total) insights.push({ id: `done-${s.id}`, type: 'success', text: `Completed: ${s.title}` });
      else if (total > 0 && (done/total) > 0.75) insights.push({ id: `crush-${s.id}`, type: 'success', text: `Crushing it: ${s.title}` });
      const od = s.topics.filter(t => !t.isCompleted && t.deadline && new Date(t.deadline) < today).length;
      if (od > 0) insights.push({ id: `late-${s.id}`, type: 'danger', text: `Overdue: ${s.title} (${od})` });
    });
    if (insights.length === 0) insights.push({ id: 'tip-1', type: 'info', text: "Tip: Add deadlines to track overdue tasks" });

    return { nextExam, totalTasks, completedTasks, pendingTasks, completionPercentage, highPriorityPending, overdueCount, subjectProgressData, insights };
  }, [subjects, exams]);

  // Error State Render (Firebase Rules Help)
  if (dbError === 'permission-denied') {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-10">
        <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 bg-rose-900/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-rose-500/20 rounded-xl">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Database Locked</h2>
              <p className="text-rose-300">Firebase blocked the connection. Security rules need updating.</p>
            </div>
          </div>

          <div className="bg-black/50 rounded-xl p-6 border border-white/10 mb-6 font-mono text-sm overflow-x-auto relative group">
             <button onClick={copyRulesToClipboard} className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-slate-300 hover:text-white" title="Copy to clipboard">
               <Copy className="w-4 h-4" />
             </button>
             <div className="text-slate-400 mb-2">// Copy and paste this into Firebase Console &gt; Firestore &gt; Rules</div>
             <div className="text-lime-400">rules_version = '2';</div>
             <div className="text-pink-400">service</div> <span className="text-white">cloud.firestore {'{'}</span>
             <div className="pl-4"><span className="text-pink-400">match</span> /databases/{'{'}database{'}'}/documents {'{'}</div>
             <div className="pl-8"><span className="text-pink-400">match</span> /{' {document=**} '} {'{'}</div>
             <div className="pl-12 text-emerald-400">allow read, write: if true;</div>
             <div className="pl-8">{'}'}</div>
             <div className="pl-4">{'}'}</div>
             <div className="text-white">{'}'}</div>
          </div>

          <a 
            href="https://console.firebase.google.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20"
          >
             Open Firebase Console <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-10 w-full flex-1">
        {loading ? (
           <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-500 text-sm font-medium animate-pulse">Connecting to Firebase...</p>
           </div>
        ) : (
          <>
            {subjects.length === 0 && exams.length === 0 && (
              <div className="mb-6 p-6 glass-panel rounded-3xl bg-emerald-900/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4">
                 <div>
                   <h3 className="text-xl font-bold text-white text-center sm:text-left">Database is Empty</h3>
                   <p className="text-slate-400 text-sm mt-1 text-center sm:text-left">Upload default syllabus data?</p>
                 </div>
                 <button onClick={seedDatabase} className="flex items-center gap-2 px-6 py-3 bg-lime-500 text-black font-bold rounded-xl shadow-lg hover:bg-lime-400 transition-all w-full sm:w-auto justify-center"><CloudUpload className="w-5 h-5" /> Upload Data</button>
              </div>
            )}

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 tracking-tight"><Activity className="w-6 h-6 sm:w-7 sm:h-7 text-lime-400" /> Overview</h2>
                  <p className="text-slate-400 text-sm sm:text-base mt-1 font-medium">Your academic command center.</p>
               </div>
               <div className="hidden md:flex items-center gap-4 bg-white/5 border border-white/10 px-5 py-2 rounded-full shadow-lg">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall</span>
                  <div className="w-32 h-2 bg-black/40 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 rounded-full" style={{ width: `${completionPercentage}%` }}></div></div>
                  <span className="text-sm font-bold text-white">{completionPercentage}%</span>
               </div>
            </div>

            {/* Badges Section */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-6 mb-6 sm:mb-10">
              {[
                { label: 'Tasks', val: totalTasks, icon: Layers, c: 'lime' },
                { label: 'Done', val: completedTasks, icon: Trophy, c: 'emerald' },
                { label: 'High Prio', val: highPriorityPending, icon: AlertCircle, c: 'amber' },
                { label: 'Overdue', val: overdueCount, icon: AlertTriangle, c: 'rose' }
              ].map((s, i) => (
                <div key={i} className="glass-card p-1.5 sm:p-6 rounded-xl sm:rounded-3xl flex flex-col items-center justify-center text-center">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 bg-${s.c}-500/10 text-${s.c}-300 rounded-lg sm:rounded-2xl flex items-center justify-center mb-1 sm:mb-3 border border-${s.c}-500/20`}>
                    <s.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-lg sm:text-4xl font-bold text-white tracking-tighter leading-tight">{s.val}</span>
                  <span className="text-[9px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1 truncate w-full px-1">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-10 items-stretch">
              <div className="xl:col-span-2 flex flex-col gap-6 sm:gap-8 h-full">
                {/* Subject Progress Graph */}
                <div className="glass-panel p-0 sm:p-6 rounded-3xl flex-1 flex flex-col overflow-hidden min-h-[300px]">
                  <div className="p-4 sm:p-0 pb-0">
                     <h3 className="font-bold text-white mb-2 sm:mb-6 flex items-center gap-2 text-sm sm:text-lg"><TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-lime-400" /> Subject Progress</h3>
                  </div>
                  <div className="flex-1 w-full min-h-[250px] sm:ml-0">
                    {chartsReady ? (
                      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-slate-600">Loading Chart...</div>}>
                        <SubjectProgressChart data={subjectProgressData} isMobile={isMobile} isPhone={isPhone} />
                      </Suspense>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs animate-pulse">Initializing Visualization...</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="glass-panel p-0 rounded-3xl flex flex-col overflow-hidden h-full min-h-[400px] xl:min-h-[750px]">
                <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-br from-emerald-900/40 to-black/40">
                  <h3 className="font-bold text-white flex items-center gap-2 text-lg"><CalendarIcon className="w-5 h-5 text-lime-400" /> Exam Headquarters</h3>
                  <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Timer className="w-20 h-20 sm:w-24 sm:h-24 text-lime-500" /></div>
                      {nextExam ? (
                        <>
                          <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Next: {nextExam.subject}</span>
                          <div className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-lime-200 tracking-tighter">{nextExam.displayVal}</div>
                          <span className="text-sm font-bold text-lime-400 mt-1 uppercase tracking-wide">{nextExam.displayUnit}</span>
                          <div className="mt-3 flex flex-wrap justify-center gap-2">
                             <span className="text-xs text-slate-500 font-medium bg-black/40 px-3 py-1 rounded-full border border-white/5">{nextExam.formattedDate}</span>
                             {nextExam.formattedTime && <span className="text-xs text-lime-400 font-bold bg-lime-500/10 px-3 py-1 rounded-full border border-lime-500/20 flex items-center gap-1"><Clock className="w-3 h-3" />{nextExam.formattedTime}</span>}
                          </div>
                        </>
                      ) : <div className="py-6 sm:py-8 text-slate-400 text-sm font-medium">No upcoming exams</div>}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2 sm:space-y-3 bg-black/20">
                  {exams.map((exam) => {
                    const examDateTime = new Date(`${exam.date}T${exam.time || '00:00'}`);
                    const isPassed = examDateTime < new Date();
                    const formattedTime = exam.time ? new Date(`1970-01-01T${exam.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
                    
                    return (
                      <div key={exam.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isPassed ? 'bg-white/5 border-white/5 opacity-50' : 'bg-white/5 border-white/5 hover:border-lime-500/30'}`}>
                          <div className="flex flex-col">
                            <span className={`font-bold text-sm ${isPassed ? 'text-slate-500 line-through' : 'text-white'}`}>{exam.subject}</span>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                               <span>{new Date(exam.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                               {formattedTime && <span className="text-slate-200 border-l border-white/10 pl-2 font-bold">{formattedTime}</span>}
                            </div>
                          </div>
                          <button onClick={() => setExamToDelete(exam.id)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 sm:p-4 bg-white/5 border-t border-white/10">
                  {!isAddingExam ? (
                      <button onClick={() => setIsAddingExam(true)} className="w-full py-2 bg-lime-500/20 text-lime-300 border border-lime-500/30 rounded-lg text-xs font-bold hover:bg-lime-400 hover:text-black transition-all flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Exam</button>
                  ) : (
                    <form onSubmit={handleAddExam} className="flex flex-col gap-3 animate-in slide-in-from-bottom-2">
                      <div className="relative">
                        <select
                           value={newExamSubject}
                           onChange={e => setNewExamSubject(e.target.value)}
                           className="glass-input text-xs px-3 py-2.5 rounded-lg w-full appearance-none cursor-pointer"
                           autoFocus
                           required
                        >
                          <option value="" disabled className="bg-[#050b07] text-slate-500">Select Subject</option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.title} className="bg-[#050b07] text-white">{s.title}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex flex-col gap-1.5 flex-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Date</label>
                          <div className="relative">
                            <Calendar 
                                value={newExamDate ? new Date(newExamDate) : null} 
                                onChange={(e) => {
                                    if(e.value) {
                                        const d = e.value as Date;
                                        const year = d.getFullYear();
                                        const month = String(d.getMonth() + 1).padStart(2, '0');
                                        const day = String(d.getDate()).padStart(2, '0');
                                        setNewExamDate(`${year}-${month}-${day}`);
                                    } else {
                                        setNewExamDate('');
                                    }
                                }} 
                                className="w-full"
                                inputClassName="w-full glass-input px-3 py-2 rounded-lg text-xs font-normal placeholder:text-slate-500"
                                placeholder="Select date"
                                dateFormat="yy-mm-dd"
                                appendTo={document.body}
                                showIcon
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 w-24 sm:w-32">
                          <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Time</label>
                          <input 
                            type="time" 
                            value={newExamTime} 
                            onChange={e => setNewExamTime(e.target.value)} 
                            className="glass-input w-full text-xs px-2 py-2 rounded-lg text-center"
                            step="60"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-2">
                          <button type="button" onClick={() => setIsAddingExam(false)} className="flex-1 py-2 text-slate-400 text-xs font-bold rounded-lg border border-white/10 hover:bg-white/5 transition-colors">Cancel</button>
                          <button type="submit" disabled={!newExamSubject || !newExamDate} className="flex-1 py-2 bg-lime-400 text-black rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-300 transition-colors">Save Exam</button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {insights.length > 0 && (
              <div className="mb-8 sm:mb-10 overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex gap-4 min-w-max px-1">
                  {insights.map((insight) => (
                    <div key={insight.id} className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 border shadow-lg whitespace-nowrap backdrop-blur-xl ${insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : insight.type === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-lime-500/10 border-lime-500/20 text-lime-300'}`}>{insight.text}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-bold text-white tracking-tight">Syllabus</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {subjects.map(subject => (
                <SubjectCard 
                  key={subject.id} 
                  subject={subject} 
                  onToggleTopic={handleToggleTopic}
                  onAddTopic={handleAddTopicToSubject}
                  onDeleteSubject={handleDeleteSubjectRequest}
                  onDeleteTopic={handleDeleteTopic}
                  onEditTopic={handleEditTopic}
                  isPhone={isPhone}
                />
              ))}
              <button onClick={() => setIsAddSubjectModalOpen(true)} className="min-h-[150px] sm:min-h-[250px] glass-card rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-lime-500/30 hover:bg-white/5 transition-all group">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 shadow-lg"><PlusCircle className="w-6 h-6 sm:w-8 sm:h-8 group-hover:text-lime-400" /></div>
                <span className="font-bold text-lg">Add Subject</span>
              </button>
            </div>
          </>
        )}
      <AddSubjectModal isOpen={isAddSubjectModalOpen} onClose={() => setIsAddSubjectModalOpen(false)} onAdd={handleAddSubject} />
      <ConfirmationModal isOpen={!!subjectToDelete} title="Delete Subject" message="All data will be lost." onConfirm={confirmDeleteSubject} onCancel={() => setSubjectToDelete(null)} />
      <ConfirmationModal isOpen={!!examToDelete} title="Delete Exam" message="Are you sure you want to delete this exam?" onConfirm={confirmDeleteExam} onCancel={() => setExamToDelete(null)} />
    </div>
  );
};
