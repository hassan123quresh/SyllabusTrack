
import React, { useState, useEffect, Suspense } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { GraduationCap, LayoutDashboard, Book } from 'lucide-react';

// Lazy load components to reduce initial bundle size (Code Splitting)
const dashboardImport = () => import('./components/Dashboard').then(module => ({ default: module.Dashboard }));
const quranImport = () => import('./components/QuranPage').then(module => ({ default: module.QuranPage }));

const Dashboard = React.lazy(dashboardImport);
const QuranPage = React.lazy(quranImport);

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'quran'>('dashboard');

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
  
  // Prefetch logic
  const prefetchDashboard = () => dashboardImport();
  const prefetchQuran = () => quranImport();

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
          {/* Mobile Gradient: Vertical Bottom-to-Top to look like it fills from below */}
          <linearGradient id="limeGradientMobile" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#65a30d" stopOpacity={1}/> {/* Darker Lime at bottom */}
            <stop offset="100%" stopColor="#bef264" stopOpacity={1}/> {/* Lighter Lime at top */}
          </linearGradient>
        </defs>
      </svg>
      {/* Navbar - Floating Rounded on Desktop, Sticky Full on Mobile */}
      <nav className="sticky top-0 lg:top-4 z-30 w-full lg:w-[calc(100%-2rem)] lg:max-w-7xl lg:mx-auto glass-panel border-b lg:border border-white/5 bg-[#020604]/80 lg:rounded-2xl backdrop-blur-md transition-all duration-300">
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
          
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setCurrentView('dashboard')}
              onMouseEnter={prefetchDashboard}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                currentView === 'dashboard' 
                  ? 'bg-lime-500 text-black shadow-[0_0_15px_rgba(163,230,53,0.3)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentView('quran')}
              onMouseEnter={prefetchQuran}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                currentView === 'quran' 
                  ? 'bg-lime-500 text-black shadow-[0_0_15px_rgba(163,230,53,0.3)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Book className="w-4 h-4" />
              <span className="hidden sm:inline">Quran</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Router with Suspense */}
      <main className="w-full flex-1 relative">
         <Suspense fallback={null}>
           {currentView === 'dashboard' && <Dashboard />}
           {currentView === 'quran' && <QuranPage />}
         </Suspense>
      </main>

    </div>
  );
};

export default App;
