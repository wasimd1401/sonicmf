
import React from 'react';
import { Mic2, Briefcase, TrendingUp, Sparkles, Music } from 'lucide-react';
import { UserRole } from '../types';

interface WelcomeScreenProps {
  onSelectRole: (role: UserRole) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/10 via-black to-black z-0 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 text-center space-y-4 mb-16 animate-fade-in-up">
        <div className="inline-flex items-center justify-center p-4 bg-white/5 border border-white/10 rounded-3xl mb-4 backdrop-blur-md">
           <Music size={40} className="text-white" />
        </div>
        <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter">SonicMF</h1>
        <p className="text-xl text-neutral-400 font-light tracking-wide">Select your industry role to customize the engine.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
        
        {/* ARTIST CARD */}
        <div 
          onClick={() => onSelectRole('artist')}
          className="group bg-neutral-900/40 border border-white/5 hover:border-purple-500/50 rounded-[2.5rem] p-10 cursor-pointer transition-all hover:bg-neutral-900/60 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(168,85,247,0.2)] backdrop-blur-md"
        >
          <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-8 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-colors">
            <Mic2 size={32} />
          </div>
          <h2 className="text-4xl font-black text-white mb-2">Artist</h2>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            I need tools for <span className="text-purple-400 font-bold">Sound Design</span>, <span className="text-purple-400 font-bold">Vocal Production</span>, and creative direction.
          </p>
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-sm text-neutral-300">
                <Sparkles size={16} className="text-purple-500" /> AI Songwriting Assistant
             </div>
             <div className="flex items-center gap-3 text-sm text-neutral-300">
                <Sparkles size={16} className="text-purple-500" /> Mix & Master Analysis
             </div>
             <div className="flex items-center gap-3 text-sm text-neutral-300">
                <Sparkles size={16} className="text-purple-500" /> Vocal Coach
             </div>
          </div>
        </div>

        {/* MANAGER CARD */}
        <div 
          onClick={() => onSelectRole('manager')}
          className="group bg-neutral-900/40 border border-white/5 hover:border-blue-500/50 rounded-[2.5rem] p-10 cursor-pointer transition-all hover:bg-neutral-900/60 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(59,130,246,0.2)] backdrop-blur-md"
        >
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <Briefcase size={32} />
          </div>
          <h2 className="text-4xl font-black text-white mb-2">Manager</h2>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            I need tools for <span className="text-blue-400 font-bold">Market Strategy</span>, <span className="text-blue-400 font-bold">ROI Analysis</span>, and scaling my roster.
          </p>
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-sm text-neutral-300">
                <TrendingUp size={16} className="text-blue-500" /> A&R Scout Reports
             </div>
             <div className="flex items-center gap-3 text-sm text-neutral-300">
                <TrendingUp size={16} className="text-blue-500" /> Investment Risk Audit
             </div>
             <div className="flex items-center gap-3 text-sm text-neutral-300">
                <TrendingUp size={16} className="text-blue-500" /> 90-Day Rollout Plans
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WelcomeScreen;
