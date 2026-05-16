import React from 'react';
import { Play, RefreshCw, Volume2 } from 'lucide-react';
import { AGENTS } from '../../constants';
import { MatchEvent } from '../../types';
import { AgentCard } from '../AgentCard/AgentCard';
import { SectionLabel } from '../common/Common';

interface AgentOrchestratorProps {
  isOrchestrating: boolean;
  thinkingAgents: Set<string>;
  agentProgress: Record<string, number>;
  selectedEvent: MatchEvent;
  setSelectedEvent: (event: MatchEvent) => void;
  commentaryStyle: string;
  setCommentaryStyle: (style: string) => void;
  handleTrigger: () => void;
  speakCommentary: (text: string, style: string) => void;
  resetSimulation: () => void;
}

export const AgentOrchestrator: React.FC<AgentOrchestratorProps> = ({
  isOrchestrating,
  thinkingAgents,
  agentProgress,
  selectedEvent,
  setSelectedEvent,
  commentaryStyle,
  setCommentaryStyle,
  handleTrigger,
  speakCommentary,
  resetSimulation
}) => {
  return (
    <section className="glass-panel p-8 mb-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent" />
      <SectionLabel>Agent Orchestration Network</SectionLabel>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3 mb-8">
        {AGENTS.map(agent => (
          <AgentCard 
            key={agent.id} 
            agent={agent} 
            isRunning={isOrchestrating}
            isThinking={thinkingAgents.has(agent.id)}
            progress={agentProgress[agent.id] || 0}
          />
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between pt-6 border-t border-border">
        <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[9px] font-mono text-text-muted mb-2 uppercase tracking-widest">Match Event</label>
            <select 
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value as MatchEvent)}
              className="w-full bg-bg-card border border-border-alt rounded-lg px-4 py-2 text-xs font-mono outline-hidden focus:border-accent"
            >
              <option value={MatchEvent.DOT}>Dot Ball</option>
              <option value={MatchEvent.SINGLE}>1 Run</option>
              <option value={MatchEvent.DOUBLE}>2 Runs</option>
              <option value={MatchEvent.FOUR}>FOUR 🚀</option>
              <option value={MatchEvent.SIX}>SIX 🔥</option>
              <option value={MatchEvent.WIDE}>Wide</option>
              <option value={MatchEvent.WICKET}>WICKET 💥</option>
              <option value={MatchEvent.DRS}>DRS Review</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-[9px] font-mono text-text-muted uppercase tracking-widest">Voice Style</label>
              <button 
                onClick={() => speakCommentary("This is a preview of the selected voice style.", commentaryStyle)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-accent"
                title="Listen to preview"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <select 
              value={commentaryStyle}
              onChange={(e) => setCommentaryStyle(e.target.value)}
              className="w-full bg-bg-card border border-border-alt rounded-lg px-4 py-2 text-xs font-mono outline-hidden focus:border-accent"
            >
              <option value="en_harsha">Harsha Bhogle (Poetic)</option>
              <option value="en_shastri">Ravi Shastri (Hype)</option>
              <option value="en_bbc">BBC (Dry Wit)</option>
              <option value="ta">Tamil Multi-lingual</option>
              <option value="hi">Hindi Passion</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <button 
            onClick={handleTrigger}
            disabled={isOrchestrating}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-3 bg-accent text-bg font-head font-black px-8 py-4 rounded-xl transition-all ${
              isOrchestrating ? 'opacity-50 cursor-not-allowed translate-y-0.5' : 'hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(0,229,160,0.2)]'
            }`}
          >
            {isOrchestrating ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5 fill-current" />
            )}
            TRIGGER ALL AGENTS
          </button>
          <button 
            onClick={resetSimulation}
            className="p-4 rounded-xl border border-border hover:bg-white/5 transition-colors group"
            title="Reset Simulation"
          >
            <RefreshCw className="w-5 h-5 text-text-muted group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </section>
  );
};
