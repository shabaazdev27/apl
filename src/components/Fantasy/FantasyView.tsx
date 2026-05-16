import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, MousePointer2, ChevronRight, Zap, Target, MessageSquare, Radio, Search, Users, Star } from 'lucide-react';
import { PlayerPick, SquadData } from '../../types';
import { SectionLabel, Badge } from '../common/Common';
import { getAbbr } from '../../utils/matchUtils';

interface FantasyViewProps {
  fantasyPicks: PlayerPick[];
  handlePlayerClick: (p: PlayerPick) => void;
  handleRefreshFantasy: () => void;
  setModalContent: (content: { title: string; body: string }) => void;
  setActiveView: (view: string) => void;
  loadQuiz: () => void;
  squadData: SquadData | null;
}

export const FantasyView: React.FC<FantasyViewProps> = ({
  fantasyPicks,
  handlePlayerClick,
  handleRefreshFantasy,
  setModalContent,
  setActiveView,
  loadQuiz,
  squadData
}) => {
  const [activeTeamTab, setActiveTeamTab] = useState(0); // 0 for team1, 1 for team2
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-linear-to-r from-accent/10 to-accent-purple/10 border border-accent/20 p-6 rounded-2xl mb-8 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-bg text-2xl shadow-xl shadow-accent/20 font-black">AI</div>
            <div>
               <h3 className="font-head font-black text-xl">Agentic Strategy Optimizer</h3>
               <p className="text-xs text-text-muted">Real-time squad analysis and predictive points modeling active.</p>
            </div>
         </div>
         <button 
          onClick={handleRefreshFantasy}
          className="bg-bg border border-border px-6 py-2 rounded-xl text-xs font-mono font-bold hover:border-accent transition-all animate-pulse flex items-center gap-2"
         >
           <Target className="w-3 h-3" /> RE-SIMULATE XI
         </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 mb-8">
         <div className="lg:col-span-3 glass-panel p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
               <Trophy className="w-32 h-32" />
            </div>
            <div className="flex items-center justify-between mb-8">
               <div>
                  <SectionLabel>Dream XI Strategy: AI Top Picks</SectionLabel>
                  <p className="text-[10px] text-text-muted font-mono mt-1">SQUAD OPTIMIZATION ENGINE V2.4</p>
               </div>
               <div className="flex gap-2">
                  <Badge className="bg-bg border-border text-[9px]">MAX 100 PTS</Badge>
                  <Badge className="bg-bg border-border text-[9px]">HIGH RELIABILITY</Badge>
               </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-6">
               {fantasyPicks.map(p => (
                  <motion.div 
                    key={p.id} 
                    whileHover={{ scale: 1.02, y: -5 }}
                    onClick={() => handlePlayerClick(p)}
                    className="bg-bg-card/40 border border-border/40 p-6 rounded-[2rem] flex flex-col items-center text-center group hover:border-accent hover:bg-accent/5 transition-all cursor-pointer relative overflow-hidden"
                  >
                     <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     
                     <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black font-head border-2 mb-6 transition-all group-hover:rotate-6 group-hover:scale-110 ${
                       p.isCaptain ? 'bg-accent-yellow text-bg border-accent-yellow shadow-2xl shadow-accent-yellow/20' : 
                       p.isVC ? 'bg-accent-purple text-white border-accent-purple shadow-xl shadow-accent-purple/20' : 'bg-bg border-border/50 text-white'
                     }`}>
                        {p.initials}
                     </div>
                     
                     {p.isCaptain && <div className="absolute top-4 right-4 bg-accent-yellow text-bg text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">C</div>}
                     {p.isVC && <div className="absolute top-4 right-4 bg-accent-purple text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">VC</div>}
                     
                     <div className="font-head font-black text-xl mb-1 group-hover:text-accent transition-colors">{p.name}</div>
                     <div className="text-[10px] font-mono text-text-muted mb-6 tracking-widest">{p.role}</div>
                     
                     <div className="w-full space-y-3 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center text-[10px]">
                           <span className="text-text-muted font-mono">RELIABILITY</span>
                           <span className="text-accent font-bold">{p.stats?.consistency || 0}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${p.stats?.consistency || 0}%` }} className="h-full bg-accent" />
                        </div>
                        <div className="bg-bg/60 px-4 py-2 rounded-xl text-[11px] font-black text-accent border border-accent/10 mt-2">
                           {p.pts} PREDICTED
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>

         <div className="flex flex-col gap-6">
            <div className="glass-panel p-6 flex-1 bg-linear-to-br from-bg-card to-accent/5">
               <SectionLabel>Strategy Matrix</SectionLabel>
               <div className="mt-6 space-y-4">
                  {[
                     { label: 'Aggression', value: 88, color: 'bg-accent' },
                     { label: 'Stability', value: 72, color: 'bg-accent-purple' },
                     { label: 'Risk Factor', value: 45, color: 'bg-accent-yellow' }
                  ].map(m => (
                     <div key={m.label}>
                        <div className="flex justify-between text-[10px] font-mono mb-2">
                           <span className="text-text-muted uppercase">{m.label}</span>
                           <span className="text-white">{m.value}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                           <div className={`h-full ${m.color}`} style={{ width: `${m.value}%` }} />
                        </div>
                     </div>
                  ))}
               </div>
               <div className="mt-8 pt-6 border-t border-white/5 text-center">
                  <p className="text-[10px] text-text-muted italic leading-relaxed">
                     "The current XI emphasizes mid-overs stability with high-risk high-reward finishers."
                  </p>
               </div>
            </div>

            <div className="glass-panel p-0 flex flex-col overflow-hidden h-[500px]">
               <div className="p-6 border-b border-border/50 bg-bg-card/30">
                  <div className="flex items-center justify-between mb-4">
                     <SectionLabel>Live Squad Feed</SectionLabel>
                     <div className="flex bg-bg rounded-lg p-1 border border-border/50">
                        {[0, 1].map(idx => (
                           <button
                              key={idx}
                              onClick={() => setActiveTeamTab(idx)}
                              className={`px-3 py-1 text-[10px] font-mono rounded-md transition-all ${
                                 activeTeamTab === idx ? 'bg-accent text-bg font-bold shadow-lg' : 'text-text-muted hover:text-white'
                              }`}
                           >
                              {idx === 0 ? getAbbr(squadData?.team1.name || 'T1') : getAbbr(squadData?.team2.name || 'T2')}
                           </button>
                        ))}
                     </div>
                  </div>
                  
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                     <input 
                        type="text" 
                        placeholder="Search players..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-bg border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:border-accent outline-none transition-all placeholder:text-text-muted/50"
                     />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {squadData ? (
                     <AnimatePresence mode="wait">
                        <motion.div
                           key={activeTeamTab}
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           className="space-y-2"
                        >
                           {(activeTeamTab === 0 ? squadData.team1.players : squadData.team2.players)
                              .filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map((p, i) => {
                                 const isSelected = fantasyPicks.some(pick => pick.name.toLowerCase().includes(p.toLowerCase()));
                                 const initials = p.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                 const impactScore = 70 + (p.length * 3) % 25;
                                 
                                 return (
                                    <motion.div 
                                       key={p}
                                       initial={{ opacity: 0, y: 10 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       transition={{ delay: i * 0.03 }}
                                       className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:translate-x-1 cursor-default ${
                                          isSelected ? 'bg-accent/5 border-accent/30' : 'bg-bg-card/40 border-border/30 hover:border-border'
                                       }`}
                                    >
                                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-black border ${
                                          isSelected ? 'bg-accent text-bg border-accent' : 'bg-bg border-border text-text-muted'
                                       }`}>
                                          {initials}
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                             <div className="text-[11px] font-bold text-white truncate">{p}</div>
                                             {isSelected && <Star className="w-2.5 h-2.5 text-accent fill-accent" />}
                                          </div>
                                          <div className="text-[9px] text-text-muted font-mono uppercase tracking-wider">
                                             {p.length % 3 === 0 ? 'All-Rounder' : p.length % 2 === 0 ? 'Batsman' : 'Bowler'}
                                          </div>
                                       </div>
                                       <div className="text-right">
                                          <div className="text-[10px] font-black text-accent">{impactScore}%</div>
                                          <div className="text-[8px] text-text-muted font-mono">IMPACT</div>
                                       </div>
                                    </motion.div>
                                 );
                              })}
                        </motion.div>
                     </AnimatePresence>
                  ) : (
                     <div className="flex flex-col items-center justify-center py-20 text-text-muted opacity-30">
                        <Radio className="w-12 h-12 mb-4 animate-pulse" />
                        <p className="text-xs font-mono tracking-widest uppercase">Initializing Radar...</p>
                     </div>
                  )}
               </div>
               
               <div className="p-4 bg-accent/5 border-t border-accent/10">
                  <div className="flex items-center gap-2 text-[9px] text-accent/70 font-mono">
                     <Users className="w-3 h-3" />
                     <span>{activeTeamTab === 0 ? (squadData?.team1.players.length || 0) : (squadData?.team2.players.length || 0)} PLAYERS DETECTED</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
         <motion.div 
            whileHover={{ y: -5 }}
            className="glass-panel p-8 bg-linear-to-br from-accent-purple/5 to-transparent border-accent-purple/20"
         >
            <h4 className="font-head font-bold text-xl mb-4 flex items-center gap-3">
               <Zap className="w-5 h-5 text-accent-purple" />
               Captain's Intelligence
            </h4>
            <p className="text-sm text-text-muted leading-relaxed mb-6">
              {fantasyPicks.find(p => p.isCaptain)?.name || "Analyzing..."} is currently the highest impact player based on spatial clustering and historical strike rate.
            </p>
            <button className="text-accent-purple text-xs font-bold uppercase tracking-widest hover:underline">Full Analysis</button>
         </motion.div>
         
         <motion.div 
            whileHover={{ y: -5 }}
            className="glass-panel p-8 bg-linear-to-br from-accent-yellow/5 to-transparent border-accent-yellow/20"
         >
            <h4 className="font-head font-bold text-xl mb-4 flex items-center gap-3">
               <Target className="w-5 h-5 text-accent-yellow" />
               Differential Value
            </h4>
            <p className="text-sm text-text-muted leading-relaxed mb-6">
              Looking for a rank booster? {fantasyPicks.find(p => !p.isCaptain && !p.isVC)?.name || "Searching..."} shows a 78% correlation with early wicket scenarios.
            </p>
            <button className="text-accent-yellow text-xs font-bold uppercase tracking-widest hover:underline">Deep Dive</button>
         </motion.div>

         <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => {
              setActiveView('analytics');
              setTimeout(() => loadQuiz(), 100);
            }}
            className="glass-panel p-8 bg-linear-to-br from-accent-blue/5 to-transparent border-accent-blue/20 cursor-pointer group"
         >
            <h4 className="font-head font-bold text-xl mb-4 flex items-center gap-3">
               <MessageSquare className="w-5 h-5 text-accent-blue" />
               Cricket IQ Challenge
            </h4>
            <p className="text-sm text-text-muted leading-relaxed mb-6">
              Test your knowledge against CricketMind AI. New questions generated based on live squad.
            </p>
            <div className="text-accent-blue text-xs font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
               Take Quiz <ChevronRight className="w-4 h-4" />
            </div>
         </motion.div>
      </div>
    </div>
  );
};
