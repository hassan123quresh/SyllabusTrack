
import React, { useState, useEffect, useMemo, useLayoutEffect } from 'react';
import { INITIAL_SYLLABUS, INITIAL_EXAMS } from './constants';
import { Subject, Topic, PriorityLevel, Exam } from './types';
import { SubjectCard } from './components/SubjectCard';
import { AddSubjectModal } from './components/AddSubjectModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { LoginScreen } from './components/LoginScreen';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { 
  GraduationCap, PlusCircle, CheckCircle2, 
  AlertCircle, Calendar, Trophy, 
  Activity, TrendingUp, AlertTriangle, Layers, Trash2, Timer, Plus, CloudUpload
} from 'lucide-react';

// Firebase Imports
import { db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query,
  orderBy
} from 'firebase/firestore';

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check login status on mount
  useEffect(() => {
    const checkLogin = () => {
      const lastLogin = localStorage.getItem('lastLogin');
      if (lastLogin) {
        const timeSinceLogin = Date.now() - parseInt(lastLogin, 10);
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        // If logged in less than 24 hours ago
        if (timeSinceLogin < oneDayMs) {
          setIsAuthenticated(true);
          return;
        }
      }
      setIsAuthenticated(false);
    };
    checkLogin();
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem('lastLogin', Date.now().toString());
    setIsAuthenticated(true);
  };

  // State initialization (Empty by default, waiting for DB)
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);

  // Exam form state
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [newExamSubject, setNewExamSubject] = useState('');
  const [newExamDate, setNewExamDate] = useState('');

  // Screen size state for Chart responsiveness
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1280); // Switch to horizontal bars on tablet/mobile for better readability
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- FIREBASE REALTIME LISTENERS ---

  // 1. Listen for Subjects
  useEffect(() => {
    // Only listen if authenticated to save reads (though purely client side protection)
    if (!isAuthenticated) return;

    const q = query(collection(db, "subjects"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subjectsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id // Map Firestore ID to our Subject ID
      })) as Subject[];
      setSubjects(subjectsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching subjects:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  // 2. Listen for Exams
  useEffect(() => {
    if (!isAuthenticated) return;

    // Order by date ascending (Earliest date first)
    const q = query(collection(db, "exams"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Exam[];
      setExams(examsData);
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  // --- HELPER FOR FIRESTORE ---
  // Firestore throws error if 'undefined' is passed. strict JSON parsing removes undefined.
  const sanitizeForFirestore = (data: any) => {
    return JSON.parse(JSON.stringify(data));
  };

  // --- DATABASE ACTIONS ---

  const seedDatabase = async () => {
    setLoading(true);
    try {
      // Upload Initial Syllabus
      for (const subject of INITIAL_SYLLABUS) {
        // Remove the hardcoded ID, let Firebase generate one
        const { id, ...data } = subject;
        await addDoc(collection(db, "subjects"), sanitizeForFirestore(data));
      }
      // Upload Initial Exams
      for (const exam of INITIAL_EXAMS) {
        const { id, ...data } = exam;
        await addDoc(collection(db, "exams"), sanitizeForFirestore(data));
      }
    } catch (error) {
      console.error("Error seeding database:", error);
      alert("Error uploading data. Check console and Firebase config.");
    }
    setLoading(false);
  };

  const handleAddSubject = async (newSubject: Subject) => {
    try {
      // Destructure to remove the temp ID generated by the modal
      const { id, ...subjectData } = newSubject;
      await addDoc(collection(db, "subjects"), sanitizeForFirestore(subjectData));
    } catch (e) {
      console.error("Error adding subject: ", e);
    }
  };

  const handleDeleteSubjectRequest = (subjectId: string) => {
    setSubjectToDelete(subjectId);
  };

  const confirmDeleteSubject = async () => {
    if (subjectToDelete) {
      try {
        await deleteDoc(doc(db, "subjects", subjectToDelete));
        setSubjectToDelete(null);
      } catch (e) {
        console.error("Error deleting subject: ", e);
      }
    }
  };

  const handleToggleTopic = async (subjectId: string, topicId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const updatedTopics = subject.topics.map(topic => {
      if (topic.id !== topicId) return topic;
      return { ...topic, isCompleted: !topic.isCompleted };
    });

    const subjectRef = doc(db, "subjects", subjectId);
    await updateDoc(subjectRef, { topics: sanitizeForFirestore(updatedTopics) });
  };

  const handleAddTopicToSubject = async (subjectId: string, topicName: string, priority: PriorityLevel, deadline?: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const newTopic: Topic = {
      id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: topicName,
      isCompleted: false,
      priority: priority,
      deadline: deadline
    };

    const updatedTopics = [...subject.topics, newTopic];
    const subjectRef = doc(db, "subjects", subjectId);
    
    // Sanitize to remove undefined 'deadline' if it exists, otherwise Firestore crashes
    await updateDoc(subjectRef, { topics: sanitizeForFirestore(updatedTopics) });
  };

  const handleDeleteTopic = async (subjectId: string, topicId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const updatedTopics = subject.topics.filter(t => t.id !== topicId);
    const subjectRef = doc(db, "subjects", subjectId);
    await updateDoc(subjectRef, { topics: sanitizeForFirestore(updatedTopics) });
  };

  const handleEditTopic = async (subjectId: string, updatedTopic: Topic) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const updatedTopics = subject.topics.map(t => t.id === updatedTopic.id ? updatedTopic : t);
    const subjectRef = doc(db, "subjects", subjectId);
    await updateDoc(subjectRef, { topics: sanitizeForFirestore(updatedTopics) });
  };

  // Exam Functions
  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newExamSubject.trim() && newExamDate) {
      try {
        const payload = {
          subject: newExamSubject.trim(),
          date: newExamDate
        };
        await addDoc(collection(db, "exams"), sanitizeForFirestore(payload));
        setNewExamSubject('');
        setNewExamDate('');
        setIsAddingExam(false);
      } catch (error) {
        console.error("Error adding exam:", error);
      }
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      await deleteDoc(doc(db, "exams", id));
    } catch (error) {
      console.error("Error deleting exam:", error);
    }
  };

  // --- ANALYTICS ---
  const getNextExam = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Sort exams by date
    const sortedExams = [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Find first exam that is today or in future
    const upcoming = sortedExams.find(e => {
      const examDate = new Date(e.date);
      examDate.setHours(0,0,0,0);
      return examDate >= today;
    });

    if (!upcoming) return null;

    const examDate = new Date(upcoming.date);
    examDate.setHours(0,0,0,0);
    const diffTime = examDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { ...upcoming, daysLeft };
  };

  const nextExam = getNextExam();

  const allTopics = useMemo(() => subjects.flatMap(s => s.topics), [subjects]);
  const totalTasks = allTopics.length;
  const completedTasks = allTopics.filter(t => t.isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const highPriorityPending = allTopics.filter(t => t.priority === 'High' && !t.isCompleted).length;
  
  const today = new Date();
  today.setHours(0,0,0,0);

  const overdueCount = allTopics.filter(t => {
    if (t.isCompleted || !t.deadline) return false;
    const d = new Date(t.deadline);
    d.setHours(0,0,0,0);
    return d < today;
  }).length;

  const subjectProgressData = useMemo(() => {
    return subjects.map(s => ({
      name: s.title,
      Completed: s.topics.filter(t => t.isCompleted).length,
      Remaining: s.topics.filter(t => !t.isCompleted).length,
      total: s.topics.length, 
      color: s.color
    }));
  }, [subjects]);

  const priorityData = useMemo(() => {
    const pending = allTopics.filter(t => !t.isCompleted);
    const high = pending.filter(t => t.priority === 'High').length;
    const med = pending.filter(t => t.priority === 'Medium').length;
    const low = pending.filter(t => t.priority === 'Low').length;
    
    const data = [
      { name: 'High', value: high, color: '#fb7185' }, // Rose-400
      { name: 'Medium', value: med, color: '#fbbf24' }, // Amber-400
      { name: 'Low', value: low, color: '#34d399' } // Emerald-400
    ].filter(d => d.value > 0);
    
    return data.length > 0 ? data : [{ name: 'No Pending', value: 1, color: 'rgba(255,255,255,0.1)' }];
  }, [allTopics]);

  const generateInsights = () => {
    const insights = [];
    
    subjects.forEach(s => {
      const done = s.topics.filter(t => t.isCompleted).length;
      const total = s.topics.length;
      if (total > 0 && done === total) {
        insights.push({ id: `done-${s.id}`, type: 'success', text: `Completed: ${s.title}` });
      } else if (total > 0 && (done/total) > 0.75) {
        insights.push({ id: `crush-${s.id}`, type: 'success', text: `Crushing it: ${s.title}` });
      }
      
      const overdue = s.topics.filter(t => !t.isCompleted && t.deadline && new Date(t.deadline) < today).length;
      if (overdue > 0) {
        insights.push({ id: `late-${s.id}`, type: 'danger', text: `Overdue: ${s.title} (${overdue})` });
      }
    });

    if (insights.length === 0) {
      insights.push({ id: 'tip-1', type: 'info', text: "Tip: Add deadlines to track overdue tasks" });
    }
    return insights;
  };

  const insights = generateInsights();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#020604]/90 border border-lime-500/20 p-3 rounded-lg text-white text-xs shadow-xl backdrop-blur-md">
          <p className="font-bold mb-1 text-lime-300">{label}</p>
          {payload.map((entry: any, index: number) => (
             <div key={index} className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></span>
               <span>{entry.name}: {entry.value}</span>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-white pb-10">
      <svg style={{ height: 0 }}>
        <defs>
          <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#bef264" stopOpacity={1}/>
            <stop offset="95%" stopColor="#84cc16" stopOpacity={0.8}/>
          </linearGradient>
        </defs>
      </svg>
      {/* Navbar */}
      <nav className="sticky top-0 z-30 w-full glass-panel border-b border-white/5 bg-[#020604]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-lime-400 to-emerald-600 p-2 sm:p-2.5 rounded-xl shadow-[0_0_15px_rgba(163,230,53,0.3)]">
              <GraduationCap className="text-black w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight hidden sm:block drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              Syllabus<span className="text-lime-400">Track</span>
            </h1>
            <h1 className="text-lg font-bold text-white tracking-tight sm:hidden drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              Syllabus<span className="text-lime-400">Track</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
             <div className="hidden md:flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full shadow-lg">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall</span>
                <div className="w-32 h-2 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm">
                   <div className="h-full bg-gradient-to-r from-lime-400 via-emerald-500 to-teal-500 rounded-full shadow-[0_0_10px_rgba(163,230,53,0.4)]" style={{ width: `${completionPercentage}%` }}></div>
                </div>
                <span className="text-sm font-bold text-white">{completionPercentage}%</span>
             </div>

            <button 
              onClick={() => setIsAddSubjectModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-lime-400 text-black hover:bg-lime-300 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:shadow-[0_0_25px_rgba(163,230,53,0.5)] hover:scale-105 active:scale-95 border-none"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Subject</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 w-full flex-1">
        
        {/* Loading / Seeding State */}
        {loading ? (
           <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-lime-400 font-bold animate-pulse">Syncing with Cloud...</p>
           </div>
        ) : (
          <>
            {/* If DB is empty, offer to upload initial data */}
            {subjects.length === 0 && exams.length === 0 && (
              <div className="mb-8 p-6 glass-panel rounded-3xl bg-emerald-900/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div>
                   <h3 className="text-xl font-bold text-white text-center sm:text-left">Database is Empty</h3>
                   <p className="text-slate-400 text-sm mt-1 text-center sm:text-left">Would you like to upload your default syllabus and exam schedule to the cloud?</p>
                 </div>
                 <button 
                   onClick={seedDatabase}
                   className="flex items-center gap-2 px-6 py-3 bg-lime-500 text-black font-bold rounded-xl shadow-lg hover:bg-lime-400 transition-all hover:scale-105 w-full sm:w-auto justify-center"
                 >
                   <CloudUpload className="w-5 h-5" />
                   Upload Default Data
                 </button>
              </div>
            )}

            {/* Dashboard Header */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 tracking-tight drop-shadow-lg">
                <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-lime-400" />
                Overview
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl font-medium">Your academic command center.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
              <div className="glass-card p-4 sm:p-6 rounded-3xl flex flex-col items-center justify-center text-center group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-lime-500/10 text-lime-300 rounded-2xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(190,242,100,0.1)] border border-lime-500/20">
                    <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-bold text-white tracking-tighter">{totalTasks}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Tasks</span>
              </div>
              
              <div className="glass-card p-4 sm:p-6 rounded-3xl flex flex-col items-center justify-center text-center group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 text-emerald-300 rounded-2xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] border border-emerald-500/20">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-bold text-white tracking-tighter">{completedTasks}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Completed</span>
              </div>

              <div className="glass-card p-4 sm:p-6 rounded-3xl flex flex-col items-center justify-center text-center group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/10 text-amber-300 rounded-2xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(245,158,11,0.1)] border border-amber-500/20">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-bold text-white tracking-tighter">{highPriorityPending}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">High Priority</span>
              </div>

              <div className="glass-card p-4 sm:p-6 rounded-3xl flex flex-col items-center justify-center text-center group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-500/10 text-rose-300 rounded-2xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(244,63,94,0.1)] border border-rose-500/20">
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-bold text-white tracking-tighter">{overdueCount}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Overdue</span>
              </div>
            </div>

            {/* Charts & Datesheet Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-10 items-stretch">
              {/* Main Charts - Spans 2 cols */}
              <div className="xl:col-span-2 flex flex-col gap-6 sm:gap-8 h-full">
                <div className="glass-panel p-4 sm:p-6 rounded-3xl shadow-2xl flex-1 flex flex-col">
                  <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-lime-400" />
                    Subject Progress
                  </h3>
                  <div className="flex-1 w-full min-h-[250px] -ml-2 sm:ml-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        layout={isMobile ? 'vertical' : 'horizontal'} 
                        data={subjectProgressData} 
                        margin={{ top: 5, right: 10, left: isMobile ? 0 : -20, bottom: 5 }} 
                        barSize={isMobile ? 24 : 36}
                      >
                        <CartesianGrid vertical={false} horizontal={false} stroke="rgba(255,255,255,0.05)" />
                        
                        {isMobile ? (
                          <>
                             {/* Mobile: Horizontal Bars (Y is Category, X is Value) */}
                             <XAxis type="number" hide />
                             <YAxis 
                               dataKey="name" 
                               type="category" 
                               axisLine={false} 
                               tickLine={false}
                               width={100} 
                               tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                             />
                          </>
                        ) : (
                          <>
                             {/* Desktop: Vertical Bars (X is Category, Y is Value) */}
                             <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600, dy: 10 }}
                                interval={0}
                             />
                             <YAxis 
                                hide={false}
                                axisLine={false} 
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                             />
                          </>
                        )}
                        
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '12px', opacity: 0.7, color: '#94a3b8', paddingTop: '10px' }} />
                        
                        {/* Completed Stack - Rendered First so it starts from 0/Bottom */}
                        <Bar 
                           dataKey="Completed" 
                           stackId="a" 
                           fill="url(#limeGradient)" 
                           radius={isMobile ? [0, 0, 0, 0] : [0, 0, 0, 0]} 
                        />
                        
                        {/* Remaining Stack - Rendered Second so it stacks on top/after */}
                        <Bar 
                           dataKey="Remaining" 
                           stackId="a" 
                           fill="rgba(255, 255, 255, 0.08)" 
                           radius={isMobile ? [0, 4, 4, 0] : [4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-panel p-4 sm:p-6 rounded-3xl shadow-2xl flex-1 flex flex-col">
                  <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-lime-400" />
                    Priority Mix
                  </h3>
                  <div className="flex-1 w-full relative min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={6}
                          dataKey="value"
                          stroke="none"
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '12px', opacity: 0.7, color: '#94a3b8' }} verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-8">
                      <div className="text-center">
                        <span className="block text-4xl font-bold text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{pendingTasks}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Left</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exam Datesheet Card - Spans 1 col */}
              <div className="glass-panel p-0 rounded-3xl shadow-2xl flex flex-col overflow-hidden h-full min-h-[400px] xl:min-h-[500px]">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-br from-emerald-900/40 to-black/40">
                  <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                      <Calendar className="w-5 h-5 text-lime-400" />
                      Exam Headquarters
                  </h3>
                  {/* Countdown */}
                  <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Timer className="w-20 h-20 sm:w-24 sm:h-24 text-lime-500" />
                      </div>
                      {nextExam ? (
                        <>
                          <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Next Up: {nextExam.subject}</span>
                          <div className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-lime-200 tracking-tighter">
                            {nextExam.daysLeft}
                          </div>
                          <span className="text-sm font-bold text-lime-400 mt-1 uppercase tracking-wide">Days Left</span>
                          <span className="text-xs text-slate-500 mt-3 font-medium bg-black/40 px-3 py-1 rounded-full border border-white/5">
                            {new Date(nextExam.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </>
                      ) : (
                        <div className="py-6 sm:py-8 text-slate-400 text-sm font-medium">No upcoming exams</div>
                      )}
                  </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2 sm:space-y-3 bg-black/20">
                  {exams.map((exam) => {
                    const isPassed = new Date(exam.date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
                    const isToday = new Date(exam.date).toDateString() === new Date().toDateString();
                    return (
                      <div key={exam.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:scale-[1.02] ${isPassed ? 'bg-white/5 border-white/5 opacity-50' : 'bg-white/5 border-white/5 hover:border-lime-500/30 hover:bg-white/10 shadow-lg'}`}>
                          <div className="flex flex-col">
                            <span className={`font-bold text-sm ${isPassed ? 'text-slate-500 line-through' : 'text-white'}`}>{exam.subject}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs ${isToday ? 'text-lime-400 font-bold' : 'text-slate-400'}`}>
                                {new Date(exam.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                              {isToday && <span className="text-[10px] bg-lime-500/20 text-lime-300 px-1.5 rounded uppercase font-bold">Today</span>}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteExam(exam.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add Exam Form/Button */}
                <div className="p-3 sm:p-4 bg-white/5 border-t border-white/10">
                  {!isAddingExam ? (
                      <button 
                        onClick={() => setIsAddingExam(true)}
                        className="w-full py-2 bg-lime-500/20 text-lime-300 border border-lime-500/30 rounded-lg text-xs font-bold hover:bg-lime-400 hover:text-black transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Exam
                      </button>
                  ) : (
                    <form onSubmit={handleAddExam} className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                      <input 
                        type="text" 
                        value={newExamSubject}
                        onChange={e => setNewExamSubject(e.target.value)}
                        placeholder="Subject name" 
                        className="glass-input text-xs px-3 py-2 rounded-lg"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <input 
                          type="date" 
                          value={newExamDate}
                          onChange={e => setNewExamDate(e.target.value)}
                          className="glass-input flex-1 text-xs px-3 py-2 rounded-lg"
                        />
                      </div>
                      <div className="flex gap-2 mt-1">
                          <button 
                            type="button" 
                            onClick={() => setIsAddingExam(false)}
                            className="flex-1 py-1.5 text-slate-400 hover:text-white text-xs font-bold hover:bg-white/10 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                          type="submit" 
                          disabled={!newExamSubject || !newExamDate}
                          className="flex-1 py-1.5 bg-lime-400 text-black rounded-lg text-xs font-bold hover:bg-lime-300 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Insights Bar */}
            {insights.length > 0 && (
              <div className="mb-8 sm:mb-10 overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex gap-4 min-w-max px-1">
                  {insights.map((insight) => (
                    <div 
                      key={insight.id} 
                      className={`
                        px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 border shadow-lg whitespace-nowrap backdrop-blur-xl transition-transform hover:scale-105
                        ${insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : ''}
                        ${insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : ''}
                        ${insight.type === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : ''}
                        ${insight.type === 'info' ? 'bg-lime-500/10 border-lime-500/20 text-lime-300' : ''}
                      `}
                    >
                      {insight.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subjects Grid */}
            <div className="mb-6 sm:mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Syllabus</h2>
            </div>

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
                />
              ))}
              
              <button 
                onClick={() => setIsAddSubjectModalOpen(true)}
                className="min-h-[250px] sm:min-h-[300px] glass-card rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-lime-500/30 hover:bg-white/5 transition-all duration-300 group"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-lime-500/20 group-hover:border-lime-500/30 transition-all shadow-lg">
                  <Plus className="w-6 h-6 sm:w-8 sm:h-8 group-hover:text-lime-400 transition-colors" />
                </div>
                <span className="font-bold text-lg">Add New Subject</span>
              </button>
            </div>
          </>
        )}
      </main>

      <AddSubjectModal 
        isOpen={isAddSubjectModalOpen} 
        onClose={() => setIsAddSubjectModalOpen(false)} 
        onAdd={handleAddSubject} 
      />

      <ConfirmationModal
        isOpen={!!subjectToDelete}
        title="Delete Subject"
        message="Are you sure you want to delete this subject? All associated topics and progress will be lost permanently."
        onConfirm={confirmDeleteSubject}
        onCancel={() => setSubjectToDelete(null)}
      />
    </div>
  );
};

export default App;
