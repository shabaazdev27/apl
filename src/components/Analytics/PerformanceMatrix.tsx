import React from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip 
} from 'recharts';
import { PlayerPick } from '../../types';
import { motion } from 'framer-motion';

interface PerformanceMatrixProps {
  players: PlayerPick[];
}

export const PerformanceMatrix: React.FC<PerformanceMatrixProps> = ({ players }) => {
  if (!players || players.length === 0) return null;

  // Transform player stats into radar data
  const matrixData = players.slice(0, 5).map(player => {
    const stats = player.stats || { avgRuns: 0, wickets: 0, strikeRate: 0, economy: 8, form: 50, consistency: 50 };
    
    // Normalize values to 0-100 scale for radar
    return {
      name: player.name,
      initials: player.initials,
      data: [
        { subject: 'Impact', value: Math.min(player.pts, 100) },
        { subject: 'Form', value: stats.form || 50 },
        { subject: 'Consistency', value: stats.consistency || 50 },
        { subject: 'Aggression', value: Math.min((stats.strikeRate / 200) * 100, 100) },
        { subject: 'Efficiency', value: Math.max(0, 100 - (stats.economy * 10)) },
      ]
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {matrixData.map((pd, idx) => (
        <motion.div 
          key={pd.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-bg-card/50 border border-border/50 rounded-3xl p-6 hover:border-accent transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-head font-bold text-sm text-white group-hover:text-accent transition-colors">{pd.name}</h4>
              <p className="text-[10px] font-mono text-text-muted uppercase">Multi-Dimensional Analysis</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-[10px] font-black">
              {pd.initials}
            </div>
          </div>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={pd.data}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#555', fontSize: 8 }} />
                <Radar
                  name={pd.name}
                  dataKey="value"
                  stroke="var(--color-accent)"
                  fill="var(--color-accent)"
                  fillOpacity={0.3}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: 'var(--color-accent)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="bg-bg/40 p-2 rounded-xl border border-white/5">
              <div className="text-[8px] text-text-muted font-mono mb-1 uppercase">Predicted Impact</div>
              <div className="text-xs font-bold text-accent">{players[idx].pts} PTS</div>
            </div>
            <div className="bg-bg/40 p-2 rounded-xl border border-white/5">
              <div className="text-[8px] text-text-muted font-mono mb-1 uppercase">Reliability</div>
              <div className="text-xs font-bold text-accent-purple">{players[idx].stats?.consistency || 0}%</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
