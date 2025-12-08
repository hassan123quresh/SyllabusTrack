
import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (id === 'hassan' && password === '123') {
      onLogin();
    } else {
      setError('Invalid ID or Password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Ambience (Matching index.html) */}
      <div className="absolute inset-0 bg-[#020604]">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-lime-500/10 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500 bg-[#050b07]/80 backdrop-blur-xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-lime-400 to-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.3)] mb-4">
            <ShieldCheck className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-slate-400 text-sm mt-2">Enter your credentials to access the tracker.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-lime-400 uppercase tracking-widest ml-1">User ID</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-500 group-focus-within:text-lime-400 transition-colors" />
              </div>
              <input
                type="text"
                value={id}
                onChange={(e) => { setId(e.target.value); setError(''); }}
                className="glass-input w-full pl-12 pr-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-lime-500/50 text-white placeholder:text-slate-600 bg-black/40 border border-white/10 transition-all"
                placeholder="Enter ID"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-lime-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-lime-400 transition-colors" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="glass-input w-full pl-12 pr-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-lime-500/50 text-white placeholder:text-slate-600 bg-black/40 border border-white/10 transition-all"
                placeholder="••••••"
              />
            </div>
          </div>

          {error && (
            <div className="text-rose-400 text-sm font-medium text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20 animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
          >
            Access Dashboard
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
        
        <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">Secure Session</p>
        </div>
      </div>
    </div>
  );
};
