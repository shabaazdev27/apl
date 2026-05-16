import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { Insight } from '../../types';
import { SectionLabel } from '../common/Common';

interface TacticalInsightsProps {
  insights: Insight[];
}

export const TacticalInsights: React.FC<TacticalInsightsProps> = ({ insights }) => {
  return (
    <div className="glass-panel p-6 flex flex-col h-[400px]">
      <SectionLabel>🧠 Real-time Tactical Insights</SectionLabel>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
        <AnimatePresence>
          {insights.map((i, idx) => (
            <motion.div 
              key={i.id || `insight-${idx}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`group relative overflow-hidden p-4 rounded-2xl bg-bg-card border-2 transition-all hover:scale-[1.02] ${
                i.type === 'hot' ? 'border-accent-alt/30 hover:border-accent-alt' : 
                i.type === 'warn' ? 'border-accent-yellow/30 hover:border-accent-yellow' : 'border-accent-purple/30 hover:border-accent-purple'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-xl border ${
                  i.type === 'hot' ? 'bg-accent-alt/10 border-accent-alt' : 
                  i.type === 'warn' ? 'bg-accent-yellow/10 border-accent-yellow' : 'bg-accent-purple/10 border-accent-purple'
                }`}>
                  {i.type === 'hot' ? <Zap className="w-4 h-4" /> : i.type === 'warn' ? <AlertTriangle className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] font-black tracking-widest uppercase ${
                      i.type === 'hot' ? 'text-accent-alt' : i.type === 'warn' ? 'text-accent-yellow' : 'text-accent-purple'
                    }`}>{i.badge}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50 animate-pulse" />
                  </div>
                  <p className="text-[12px] text-gray-100 font-medium leading-relaxed">{i.text}</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 w-full" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
