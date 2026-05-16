import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { RefreshCw, Info } from 'lucide-react';
import { PlayerPick, SquadData } from '../../types';
import { SectionLabel, Badge } from '../common/Common';
import { Quiz } from '../Quiz/Quiz';
import { getAbbr } from '../../utils/matchUtils';
import { PerformanceMatrix } from './PerformanceMatrix';

interface AnalyticsViewProps {
  winProbHistory: any[];
  winProb: { team1: number; team2: number };
  teamBatting: string;
  teamBowling: string;
  fantasyPicks: PlayerPick[];
  currentBatsman: string;
  currentBowler: string;
  quiz: any[];
  quizLoading: boolean;
  quizScore: number;
  currentQuestionIndex: number;
  showQuizResult: boolean;
  selectedOption: number | null;
  isCorrect: boolean | null;
  handleOptionSelect: (index: number) => void;
  loadQuiz: () => void;
  squadData: SquadData | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  winProbHistory,
  winProb,
  teamBatting,
  teamBowling,
  fantasyPicks,
  currentBatsman,
  currentBowler,
  quiz,
  quizLoading,
  quizScore,
  currentQuestionIndex,
  showQuizResult,
  selectedOption,
  isCorrect,
  handleOptionSelect,
  loadQuiz
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
       <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-panel p-8">
             <SectionLabel>Win Probability Over Time</SectionLabel>
             <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={winProbHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCsk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-accent-alt)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-accent-alt)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="over" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="team1" name={getAbbr(teamBatting)} stroke="var(--color-accent)" fillOpacity={1} fill="url(#colorCsk)" strokeWidth={3} />
                    <Area type="monotone" dataKey="team2" name={getAbbr(teamBowling)} stroke="var(--color-accent-alt)" fillOpacity={1} fill="url(#colorMi)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="glass-panel p-8 flex flex-col justify-center text-center overflow-hidden relative">
             <div className="absolute inset-0 bg-radial-at-tr from-accent/5 to-transparent opacity-50" />
             <SectionLabel>Agentic Momentum Index</SectionLabel>
             <div className="mt-8 relative z-10">
                <div className="text-6xl md:text-8xl font-black font-head tracking-tighter mb-2 italic">
                   {winProb.team1}%
                </div>
                <div className="text-[10px] font-mono text-accent uppercase tracking-[0.5em] mb-8">Current Prediction Confidence</div>
                
                <div className="flex gap-4 items-center justify-center">
                   <div className="flex -space-x-3">
                      {[1,2,3].map(i => (
                         <div key={i} className="w-10 h-10 rounded-full bg-bg border-2 border-accent/20 flex items-center justify-center text-xs font-black">A{i}</div>
                      ))}
                   </div>
                   <div className="text-left">
                      <div className="text-[10px] font-bold text-white">Active Sentiment Analysis</div>
                      <div className="text-[8px] text-text-muted">3 Multi-Agent models converging</div>
                   </div>
                </div>
             </div>
          </div>
       </div>

       <div className="glass-panel p-8">
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Player Performance Matrix</SectionLabel>
            <Badge className="bg-accent-purple/10 text-accent-purple border-accent-purple/20">LIVE AI SCORING</Badge>
          </div>
          <p className="text-xs text-text-muted mb-6">Multi-dimensional analysis of impact, form, and tactical reliability.</p>
          <PerformanceMatrix players={fantasyPicks} />
       </div>

       <div className="glass-panel p-8 mt-6">
          <SectionLabel>Advanced Spatial Analytics & Predictive Heatmaps</SectionLabel>
          <div className="grid lg:grid-cols-3 gap-8 mt-6">
              <div className="lg:col-span-2 bg-bg-card rounded-3xl border border-border p-6 relative overflow-hidden h-[350px]">
                  <div className="absolute inset-0 bg-linear-to-br from-accent/5 to-transparent flex items-center justify-center">
                      <div className="relative w-full max-w-[450px] h-full flex items-center justify-center">
                          {/* Pitch Grid */}
                          <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 opacity-10">
                             {Array.from({length: 25}).map((_, i) => <div key={i} className="border border-white/20" />)}
                          </div>

                          <div className="absolute w-[60px] h-[180px] bg-accent-yellow/10 border border-accent-yellow/20 rounded-md" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-accent/20 rounded-full animate-pulse" />
                          
                          {/* Dynamic Heatmap Points */}
                          {[
                              { x: 30, y: 40, size: 80, o: 0.1, color: 'bg-accent' },
                              { x: 70, y: 60, size: 120, o: 0.2, color: 'bg-accent-purple' },
                              { x: 45, y: 20, size: 60, o: 0.15, color: 'bg-accent-yellow' }
                          ].map((h, i) => (
                              <motion.div key={i} animate={{ scale: [1, 1.1, 1], opacity: [h.o, h.o * 1.5, h.o] }} transition={{ repeat: Infinity, duration: 3 + i, ease: "easeInOut" }} className={`absolute ${h.color} rounded-full blur-2xl`} style={{ left: `${h.x}%`, top: `${h.y}%`, width: h.size, height: h.size }} />
                          ))}
                          
                          <div className="z-10 text-center">
                              <div className="text-[10px] font-mono text-accent drop-shadow-lg font-black uppercase tracking-widest mb-2">Dominant Scoring Zone</div>
                              <p className="text-[11px] text-text-muted max-w-[150px] mx-auto italic">Batsman success rate analysis active.</p>
                          </div>
                      </div>
                  </div>
                  <div className="absolute bottom-4 right-4 flex gap-2">
                      <Badge className="bg-bg-card border-border text-[8px]">LIVE SPATIAL FEED</Badge>
                      <Badge className="bg-accent/20 text-accent border-accent/30 text-[8px]">PRO: 92% ACCURACY</Badge>
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  {[
                  { label: 'CONTROL INDEX', value: '0.84', trend: '↑ +0.02', desc: 'Shot selection accuracy', color: 'text-accent-blue' },
                  { label: 'AGGRESSION SCORING', value: '7.2', trend: '↓ -0.5', desc: 'Power hitting frequency', color: 'text-accent-yellow' },
                  { label: 'IMPACT RATING', value: 'A+', trend: 'NEW', desc: 'Overall tactical value', color: 'text-accent-purple' },
                  ].map((m, idx) => (
                  <motion.div key={idx} whileHover={{ scale: 1.02 }} className="p-6 bg-bg-card border border-border rounded-2xl group cursor-help">
                      <div className="text-[10px] text-text-muted mb-2 font-mono uppercase tracking-[0.2em]">{m.label}</div>
                      <div className={`text-3xl font-head font-black mb-1 ${m.color}`}>{m.value}</div>
                      <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/40">{m.trend}</span>
                          <Info className="w-3 h-3 text-white/20 group-hover:text-accent transition-colors" />
                      </div>
                  </motion.div>
                  ))}
              </div>
          </div>
       </div>

        <div className="glass-panel p-8 mt-6">
          <div className="flex items-center justify-between mb-6">
            <SectionLabel>AI Cricket Intelligence Quiz</SectionLabel>
            <button onClick={loadQuiz} disabled={quizLoading} className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1">
              {quizLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              REFRESH QUIZ
            </button>
          </div>
          <Quiz 
            quiz={quiz} quizLoading={quizLoading} quizScore={quizScore} currentQuestionIndex={currentQuestionIndex} 
            showQuizResult={showQuizResult} selectedOption={selectedOption} isCorrect={isCorrect} 
            handleOptionSelect={handleOptionSelect} loadQuiz={loadQuiz} 
          />
        </div>
    </div>
  );
};
