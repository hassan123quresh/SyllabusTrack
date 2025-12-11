
import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { INITIAL_SYLLABUS, INITIAL_EXAMS } from '../constants';
import { Subject, Topic, PriorityLevel, Exam } from '../types';
import { SubjectCard } from './SubjectCard';
import { AddSubjectModal } from './AddSubjectModal';
import { ConfirmationModal } from './ConfirmationModal';
import { 
  Activity, TrendingUp, AlertCircle, Calendar, Trophy, 
  AlertTriangle, Layers, Trash2, Timer, Plus, CloudUpload, PlusCircle
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, getDoc, updateDoc 
} from 'firebase/firestore';

// Lazy load charts to split bundle and improve LCP/TBT
const SubjectProgressChart = React.lazy(() => import('./DashboardCharts').then(module => ({ default: module.SubjectProgressChart })));
const PriorityMixChart = React.lazy(() => import('./DashboardCharts').then(module => ({ default: module.PriorityMixChart })));

export const Dashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [newExamSubject, setNewExamSubject] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamTime, setNewExamTime] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  
  // Performance: Defer heavy chart rendering until after initial paint
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    // Determine screen size efficiently
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1280);
      setIsPhone(width < 768);
    };
    checkScreenSize();
    
    // Debounced resize listener
    let timeoutId: number;
    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(checkScreenSize, 200);
    };
    window.addEventListener('resize', debouncedCheck);
    
    // Defer chart rendering to unblock TBT (Total Blocking Time)
    // Using setTimeout to yield to main thread for critical first paint
    const chartTimer = setTimeout(() => {
      setChartsReady(true);
    }, 100);

    return () => {
      window.removeEventListener('resize', debouncedCheck);
      clearTimeout(timeoutId);
      clearTimeout(chartTimer);
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, "subjects"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subjectsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Subject[];
      setSubjects(subjectsData);
      setLoading(false);
    }, (error) => { console.error("Error fetching subjects:", error); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "exams"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Exam[];
      setExams(examsData);
    }, console.error);
    return () => unsubscribe();
  }, []);

  // Performance & Safety: JSON.stringify removes 'undefined', which Firestore rejects.
  // We use this instead of structuredClone to ensure Firestore compatibility.
  const sanitizeForFirestore = (data: any) => {
    return JSON.parse(JSON.stringify(data));
  };

  const seedDatabase = useCallback(async () => {
    setLoading(true);
    // Yield to main thread before heavy write operation
    setTimeout(async () => {
      try {
        const batchPromises = [];
        for (const subject of INITIAL_SYLLABUS) {
          const { id, ...data } = subject;
          batchPromises.push(addDoc(collection(db, "subjects"), sanitizeForFirestore(data)));
        }
        for (const exam of INITIAL_EXAMS) {
          const { id, ...data } = exam;
          batchPromises.push(addDoc(collection(db, "exams"), sanitizeForFirestore(data)));
        }
        await Promise.all(batchPromises);
      } catch (error) { console.error("Error seeding:", error); }
      setLoading(false);
    }, 0);
  }, []);

  const handleAddSubject = useCallback(async (newSubject: Subject) => {
    const { id, ...subjectData } = newSubject;
    await addDoc(collection(db, "subjects"), sanitizeForFirestore(subjectData));
  }, []);

  const handleDeleteSubjectRequest = useCallback((subjectId: string) => setSubjectToDelete(subjectId), []);

  const confirmDeleteSubject = useCallback(async () => {
    if (subjectToDelete) {
      await deleteDoc(doc(db, "subjects", subjectToDelete));
      setSubjectToDelete(null);
    }
  }, [subjectToDelete]);

  const handleToggleTopic = useCallback(async (subjectId: string, topicId: string) => {
    const subjectRef = doc(db, "subjects", subjectId);
    try {
      // Use getDoc + updateDoc for better performance and to avoid transaction contention/version errors
      const snap = await getDoc(subjectRef);
      if (snap.exists()) {
        const data = snap.data() as Subject;
        const updatedTopics = data.topics.map(t => t.id === topicId ? { ...t, isCompleted: !t.isCompleted } : t);
        await updateDoc(subjectRef, { topics: updatedTopics });
      }
    } catch (e) { console.error("Toggle failed:", e); }
  }, []);

  const handleAddTopicToSubject = useCallback(async (subjectId: string, topicName: string, priority: PriorityLevel, deadline?: string, link?: string) => {
    const subjectRef = doc(db, "subjects", subjectId);
    try {
      const snap = await getDoc(subjectRef);
      if (snap.exists()) {
        const data = snap.data() as Subject;
        const newTopic: Topic = {
          id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: topicName,
          isCompleted: false,
          priority,
          deadline,
          link
        };
        // Sanitize to remove undefined fields
        const safeTopic = sanitizeForFirestore(newTopic);
        
        await updateDoc(subjectRef, { topics: [...data.topics, safeTopic] });
      }
    } catch (e) { console.error("Add topic failed:", e); }
  }, []);

  const handleDeleteTopic = useCallback(async (subjectId: string, topicId: string) => {
    const subjectRef = doc(db, "subjects", subjectId);
    try {
      const snap = await getDoc(subjectRef);
      if (snap.exists()) {
        const data = snap.data() as Subject;
        const updatedTopics = data.topics.filter(t => t.id !== topicId);
        await updateDoc(subjectRef, { topics: updatedTopics });
      }
    } catch (e) { console.error("Delete topic failed:", e); }
  }, []);

  const handleEditTopic = useCallback(async (subjectId: string, updatedTopic: Topic) => {
    const subjectRef = doc(db, "subjects", subjectId);
    try {
      const snap = await getDoc(subjectRef);
      if (snap.exists()) {
        const data = snap.data() as Subject;
        // Sanitize to remove undefined fields
        const safeTopic = sanitizeForFirestore(updatedTopic);
        const updatedTopics = data.topics.map(t => t.id === safeTopic.id ? safeTopic : t);
        await updateDoc(subjectRef, { topics: updatedTopics });
      }
    } catch (e) { console.error("Edit topic failed:", e); }
  }, []);

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newExamSubject.trim() && newExamDate) {
      await addDoc(collection(db, "exams"), sanitizeForFirestore({ 
        subject: newExamSubject.trim(), 
        date: newExamDate,
        time: newExamTime || undefined
      }));
      setNewExamSubject(''); setNewExamDate(''); setNewExamTime(''); setIsAddingExam(false);
    }
  };

  const handleDeleteExam = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "exams", id));
  }, []);

  // Analytics - Memoized
  const { nextExam, totalTasks, completedTasks, pendingTasks, completionPercentage, highPriorityPending, overdueCount, subjectProgressData, priorityData, insights } = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const sortedExams = [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const upcoming = sortedExams.find(e => { const d = new Date(e.date); d.setHours(0,0,0,0); return d >= today; });
    let nextExam = null;
    if (upcoming) {
      const diffTime = new Date(upcoming.date).setHours(0,0,0,0) - today.getTime();
      nextExam = { ...upcoming, daysLeft: Math.ceil(diffTime / (86400000)) };
    }

    const allTopics = subjects.flatMap(s => s.topics);
    const totalTasks = allTopics.length;
    const completedTasks = allTopics.filter(t => t.isCompleted).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const highPriorityPending = allTopics.filter(t => t.priority === 'High' && !t.isCompleted).length;
    
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

    const pending = allTopics.filter(t => !t.isCompleted);
    const priorityData = [
      { name: 'High', value: pending.filter(t => t.priority === 'High').length, color: '#fb7185' },
      { name: 'Medium', value: pending.filter(t => t.priority === 'Medium').length, color: '#fbbf24' },
      { name: 'Low', value: pending.filter(t => t.priority === 'Low').length, color: '#34d399' }
    ].filter(d => d.value > 0);
    if (priorityData.length === 0) priorityData.push({ name: 'None', value: 1, color: 'rgba(255,255,255,0.1)' });

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

    return { nextExam, totalTasks, completedTasks, pendingTasks, completionPercentage, highPriorityPending, overdueCount, subjectProgressData, priorityData, insights };
  }, [subjects, exams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-10 w-full flex-1">
        {loading ? (
           <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : (
          <>
            {subjects.length === 0 && exams.length === 0 && (
              <div className="mb-6 p-6 glass-panel rounded-3xl bg-emerald-900/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
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

            {/* Badges Section - Optimized: Single row on mobile with reduced gaps and font sizes */}
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
                {/* Subject Progress Graph - Maximized margins on mobile */}
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

                <div className="glass-panel p-4 sm:p-6 rounded-3xl h-[320px] shrink-0 flex flex-col">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg"><Activity className="w-5 h-5 text-lime-400" /> Priority Mix</h3>
                  <div className="flex-1 w-full relative min-h-0">
                    {chartsReady ? (
                      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-slate-600">Loading Chart...</div>}>
                        <PriorityMixChart data={priorityData} isPhone={isPhone} />
                      </Suspense>
                    ) : (
                       <div className="w-full h-full flex items-center justify-center rounded-full border border-white/5"></div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-8">
                      <div className="text-center"><span className="block text-4xl font-bold text-white tracking-tighter">{pendingTasks}</span><span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Left</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-0 rounded-3xl flex flex-col overflow-hidden h-full min-h-[400px] xl:min-h-[750px]">
                <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-br from-emerald-900/40 to-black/40">
                  <h3 className="font-bold text-white flex items-center gap-2 text-lg"><Calendar className="w-5 h-5 text-lime-400" /> Exam Headquarters</h3>
                  <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Timer className="w-20 h-20 sm:w-24 sm:h-24 text-lime-500" /></div>
                      {nextExam ? (
                        <>
                          <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Next: {nextExam.subject}</span>
                          <div className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-lime-200 tracking-tighter">{nextExam.daysLeft}</div>
                          <span className="text-sm font-bold text-lime-400 mt-1 uppercase tracking-wide">Days Left</span>
                          <div className="mt-3 flex flex-wrap justify-center gap-2">
                             <span className="text-xs text-slate-500 font-medium bg-black/40 px-3 py-1 rounded-full border border-white/5">{new Date(nextExam.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                             {nextExam.time && <span className="text-xs text-lime-400 font-bold bg-lime-500/10 px-3 py-1 rounded-full border border-lime-500/20 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-pulse"></span>{nextExam.time}</span>}
                          </div>
                        </>
                      ) : <div className="py-6 sm:py-8 text-slate-400 text-sm font-medium">No upcoming exams</div>}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2 sm:space-y-3 bg-black/20">
                  {exams.map((exam) => {
                    const isPassed = new Date(exam.date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
                    return (
                      <div key={exam.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isPassed ? 'bg-white/5 border-white/5 opacity-50' : 'bg-white/5 border-white/5 hover:border-lime-500/30'}`}>
                          <div className="flex flex-col">
                            <span className={`font-bold text-sm ${isPassed ? 'text-slate-500 line-through' : 'text-white'}`}>{exam.subject}</span>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                               <span>{new Date(exam.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                               {exam.time && <span className="text-slate-200 border-l border-white/10 pl-2 font-bold">{exam.time}</span>}
                            </div>
                          </div>
                          <button onClick={() => handleDeleteExam(exam.id)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 sm:p-4 bg-white/5 border-t border-white/10">
                  {!isAddingExam ? (
                      <button onClick={() => setIsAddingExam(true)} className="w-full py-2 bg-lime-500/20 text-lime-300 border border-lime-500/30 rounded-lg text-xs font-bold hover:bg-lime-400 hover:text-black transition-all flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Exam</button>
                  ) : (
                    <form onSubmit={handleAddExam} className="flex flex-col gap-2">
                      <input type="text" value={newExamSubject} onChange={e => setNewExamSubject(e.target.value)} placeholder="Subject" className="glass-input text-xs px-3 py-2 rounded-lg" autoFocus />
                      <div className="flex gap-2">
                         <input type="date" value={newExamDate} onChange={e => setNewExamDate(e.target.value)} className="glass-input flex-1 text-xs px-3 py-2 rounded-lg" required />
                         <input type="text" value={newExamTime} onChange={e => setNewExamTime(e.target.value)} placeholder="Time (e.g. 1-4 PM)" className="glass-input w-32 text-xs px-2 py-2 rounded-lg text-center" />
                      </div>
                      <div className="flex gap-2 mt-1">
                          <button type="button" onClick={() => setIsAddingExam(false)} className="flex-1 py-1.5 text-slate-400 text-xs font-bold rounded-lg">Cancel</button>
                          <button type="submit" className="flex-1 py-1.5 bg-lime-400 text-black rounded-lg text-xs font-bold">Save</button>
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
    </div>
  );
};
