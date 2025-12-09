
import React, { useState, useEffect, Suspense } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { GraduationCap, LayoutDashboard, BookOpen } from 'lucide-react';

// Lazy load components to reduce initial bundle size (Code Splitting)
const Dashboard = React.lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const ResourceManagerPage = React.lazy(() => import('./components/ResourceManagerPage').then(module => ({ default: module.ResourceManagerPage })));

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'resources'>('dashboard');

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
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
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
          
          <div className="flex items-center gap-2 sm:gap-4 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                currentView === 'dashboard' 
                  ? 'bg-lime-500 text-black shadow-[0_0_15px_rgba(163,230,53,0.3)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentView('resources')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                currentView === 'resources' 
                  ? 'bg-lime-500 text-black shadow-[0_0_15px_rgba(163,230,53,0.3)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Resources</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Router with Suspense */}
      <main className="w-full flex-1 relative">
         <Suspense fallback={
           <div className="flex flex-col items-center justify-center min-h-[60vh]">
             <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-4 text-slate-500 text-sm font-medium animate-pulse">Loading module...</p>
           </div>
         }>
           {currentView === 'dashboard' && <Dashboard />}
           {currentView === 'resources' && <ResourceManagerPage />}
         </Suspense>
      </main>

    </div>
  );
};

export default App;
