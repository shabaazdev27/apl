import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Match, getCurrentMatches } from '../../services/cricApi';
import { Badge, MetricCard } from '../common/Common';
import { getAbbr } from '../../utils/matchUtils';

interface LiveScoreBarProps {
  liveMatches: Match[];
  setLiveMatches: (matches: Match[]) => void;
  selectedMatch: Match | null;
  setSelectedMatch: (match: Match) => void;
  businessMetrics: {
    revenue: number;
    engagement: number;
    latency: number;
    sync: number;
  };
  teamBatting: string;
  runs: number;
  wickets: number;
  balls: number;
  targetRuns: number;
  teamBowling: string;
  targetScoreStr: string;
}

export const LiveScoreBar: React.FC<LiveScoreBarProps> = ({
  liveMatches,
  setLiveMatches,
  selectedMatch,
  setSelectedMatch,
  businessMetrics,
  teamBatting,
  runs,
  wickets,
  balls,
  targetRuns,
  teamBowling,
  targetScoreStr
}) => {
  return (
    <div className="glass-panel p-6 mb-8 shadow-2xl shadow-accent/5">
      {liveMatches.length > 0 ? (
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-border pb-4">
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Live Match Intelligence (Cricbuzz Rapid API)
          </span>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              title="Select Live Match"
              className="flex-1 bg-bg border border-border text-xs px-3 py-1.5 rounded-lg max-w-[300px] truncate"
              value={selectedMatch?.id || ''}
              onChange={e => {
                const m = liveMatches.find(x => x.id === e.target.value);
                if (m) setSelectedMatch(m);
              }}
            >
              <option value="" disabled>Select a live match...</option>
              {liveMatches.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
            <button
              onClick={() => {
                getCurrentMatches().then(setLiveMatches);
              }}
              className="p-1.5 bg-bg-card border border-border rounded-lg hover:border-accent transition-colors"
              title="Refresh Match List"
            >
              <RefreshCw className="w-3.5 h-3.5 text-text-muted hover:text-accent" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-center justify-center py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <span className="text-xs font-mono text-text-muted">Fetching live matches from Cricbuzz...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Ad Revenue Index"
          value={`$${businessMetrics.revenue.toLocaleString()}`}
          delta="+12% growth"
          color="var(--color-accent)"
        />
        <MetricCard
          label="Fan Engagement"
          value={`${businessMetrics.engagement.toFixed(1)}%`}
          delta="Peak activity"
          color="#00e5a0"
        />
        <MetricCard
          label="CDN Latency"
          value={`${businessMetrics.latency}ms`}
          delta="Optimal"
          color="#38bdf8"
        />
        <MetricCard
          label="Global Node Sync"
          value={`${businessMetrics.sync.toFixed(1)}%`}
          delta="Healthy"
          color="#ffc93c"
        />
      </div>

      <div className="grid md:grid-cols-3 items-center gap-12">
        <div className="text-center md:text-left">
          <div className="text-[10px] font-mono text-text-muted mb-2 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {teamBatting} · Batting
          </div>
          <div className="text-4xl font-head font-extrabold text-accent">
            {runs}/{wickets}
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-2 truncate w-full max-w-[200px]" title={selectedMatch?.status || selectedMatch?.description}>
            {selectedMatch?.status || selectedMatch?.description}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-bg-card/50 rounded-2xl border border-border-alt relative">
          <div className="text-3xl font-head font-bold text-accent-yellow">
            {Math.floor(balls / 6)}.{balls % 6}
          </div>
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-tighter">Overs Completed</div>
          <div className="absolute -bottom-4 bg-bg text-[9px] font-mono px-3 py-1 rounded-full border border-border text-accent">
            RRR: {targetRuns > 0 ? ((targetRuns - runs) / Math.max(1, ((120 - balls) / 6))).toFixed(2) : "N/A"}
          </div>
        </div>

        <div className="text-center md:text-right">
          <div className="text-[10px] font-mono text-text-muted mb-2 uppercase tracking-widest">
            {teamBowling} {targetRuns > 0 ? `· Target: ${targetRuns}` : ""}
          </div>
          <div className="text-4xl font-head font-extrabold text-accent-alt">
            {targetScoreStr}
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-2">
            Live Data Connected
          </div>
        </div>
      </div>
    </div>
  );
};
