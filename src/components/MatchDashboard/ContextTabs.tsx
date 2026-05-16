import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Target, Trophy, TrendingUp, Timer } from 'lucide-react';
import { PlayerPick } from '../../types';
import { SectionLabel } from '../common/Common';
import { getAbbr } from '../../utils/matchUtils';

interface ContextTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  teamBatting: string;
  teamBowling: string;
  winProb: { team1: number; team2: number };
  currentBatsman: string;
  currentBowler: string;
  fantasyPicks: PlayerPick[];
  isOrchestrating: boolean;
  handlePlayerClick: (p: PlayerPick) => void;
}

export const ContextTabs: React.FC<ContextTabsProps> = ({
  activeTab,
  setActiveTab,
  teamBatting,
  teamBowling,
  winProb,
  currentBatsman,
  currentBowler,
  fantasyPicks,
  isOrchestrating,
  handlePlayerClick
}) => {
  return (
    <div className="glass-panel p-6 flex flex-col h-[400px]">
      <div className="flex gap-1 bg-bg-card p-1 rounded-xl border border-border mb-6">
        {[
          { id: 'win', label: 'Win Probability', icon: BarChart3 },
          { id: 'field', label: 'Field Map', icon: Target },
          { id: 'fantasy', label: 'Fantasy XI', icon: Trophy },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono transition-all ${
              activeTab === tab.id ? 'bg-bg-alt border border-border-alt text-white shadow-xl' : 'text-text-muted hover:text-gray-400'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1">
        {activeTab === 'win' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-accent underline">{getAbbr(teamBatting)} BATTING</span>
                <span className="text-accent-alt">{getAbbr(teamBowling)} BOWLING</span>
              </div>
              <div className="h-4 w-full bg-bg-card rounded-full overflow-hidden border border-border flex">
                <motion.div 
                  animate={{ width: `${winProb.team1}%` }}
                  className="h-full bg-accent relative group"
                >
                  <div className="absolute inset-0 bg-white/10 animate-pulse opacity-0 group-hover:opacity-100" />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-bg">{winProb.team1}%</span>
                </motion.div>
                <motion.div 
                  animate={{ width: `${winProb.team2}%` }}
                  className="h-full bg-accent-alt relative group"
                >
                  <div className="absolute inset-0 bg-white/10 animate-pulse opacity-0 group-hover:opacity-100" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-bg">{winProb.team2}%</span>
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-card/50 p-4 rounded-xl border border-border">
                <SectionLabel>Live Momentum</SectionLabel>
                <div className="flex items-center gap-2 text-accent">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold font-mono">BAT SIDE +7%</span>
                </div>
                <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
                  3 sixes in last 12 balls. Power-hitting index peaking.
                </p>
              </div>
              <div className="bg-bg-card/50 p-4 rounded-xl border border-border">
                <SectionLabel>Game State</SectionLabel>
                <div className="flex items-center gap-2 text-accent-yellow">
                  <Timer className="w-4 h-4" />
                  <span className="text-xs font-bold font-mono">PRESSURE ↑</span>
                </div>
                <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
                  Dot ball probability rising. Required rate at 12.4.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'field' && (
          <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 h-full relative p-4 group">
             <div className={`w-[200px] h-[200px] rounded-full border-2 relative bg-green-900/10 overflow-hidden transition-all duration-500 ${
               isOrchestrating ? 'border-accent shadow-[0_0_30px_rgba(0,229,160,0.3)] scale-105' : 'border-accent/30'
             }`}>
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-20 bg-accent-yellow/20 border border-accent-yellow/30" />
               <div className="absolute inset-8 rounded-full border border-dashed border-accent/20" />
               <div className="absolute left-1/2 top-0 -translate-x-1/2 w-4 h-8 border-x border-white/5" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-2 h-2 bg-accent rounded-full shadow-[0_0_15px_var(--color-accent)] ${isOrchestrating ? 'animate-ping' : 'animate-pulse'}`} />
               </div>
               {[
                 { p: [15, 25], l: 'SLIP' }, { p: [55, 5], l: 'LB' }, { p: [85, 35], l: 'CVR' }, 
                 { p: [75, 75], l: 'MID' }, { p: [25, 85], l: 'LEG' }, { p: [5, 45], l: 'GUL' }, { p: [45, 92], l: 'BND' }
               ].map((f, i) => (
                 <motion.div 
                  key={i}
                  animate={isOrchestrating ? { 
                     x: [0, (Math.random() - 0.5) * 15, 0], 
                     y: [0, (Math.random() - 0.5) * 15, 0] 
                  } : {
                     x: [0, Math.random() * 8, 0], 
                     y: [0, Math.random() * 8, 0] 
                  }}
                  transition={{ repeat: Infinity, duration: isOrchestrating ? 0.3 : 4 + i, ease: "easeInOut" }}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${f.p[0]}%`, top: `${f.p[1]}%` }}
                 >
                   <div className="w-2 h-2 bg-accent-purple rounded-full shadow-[0_0_8px_var(--color-accent-purple)]" />
                   <span className="text-[6px] font-mono text-white/40 mt-0.5">{f.l}</span>
                 </motion.div>
               ))}
             </div>
             
             <div className="mt-6 text-center space-y-2">
               <p className="text-[11px] font-mono text-text-muted italic bg-bg-card/80 p-2 rounded-lg border border-border">
                 <span className="text-accent underline">AI Suggestion:</span> Adjust for {currentBatsman} vs {currentBowler} strategy.
               </p>
               <div className="flex gap-2 justify-center">
                  <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-accent rounded-full" /> <span className="text-[8px] font-mono">BAT</span></div>
                  <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-accent-purple rounded-full" /> <span className="text-[8px] font-mono">FIELD</span></div>
               </div>
             </div>
          </div>
        )}

        {activeTab === 'fantasy' && (
          <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-right-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {fantasyPicks.map(p => (
              <motion.div 
                key={p.id} 
                whileHover={{ scale: 1.02 }}
                onClick={() => handlePlayerClick(p)}
                className="bg-bg-card/50 border border-border p-3 rounded-xl flex items-center gap-3 group cursor-pointer"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold font-head border transition-all ${
                  p.isCaptain ? 'bg-accent-yellow text-bg border-accent-yellow shadow-[0_0_10px_rgba(255,201,60,0.4)]' : 
                  p.isVC ? 'bg-accent-purple text-white border-accent-purple shadow-[0_0_10px_rgba(124,110,245,0.4)]' : 'bg-bg border-border text-white group-hover:border-accent'
                }`}>
                  {p.initials}
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-bold flex items-center gap-1">
                    {p.name}
                  </div>
                  <div className="text-[9px] font-mono text-text-muted">{p.role} · {p.pts} PTS</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
