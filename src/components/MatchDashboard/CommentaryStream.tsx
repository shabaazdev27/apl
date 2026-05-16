import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommentaryLine, MatchEvent } from '../../types';
import { SectionLabel, Badge } from '../common/Common';
import { getAbbr } from '../../utils/matchUtils';
import { Mic2, Radio } from 'lucide-react';

interface CommentaryStreamProps {
  commentary: CommentaryLine[];
  commentaryScrollRef: React.RefObject<HTMLDivElement | null>;
  teamBowling: string;
  teamBatting: string;
}

export const CommentaryStream: React.FC<CommentaryStreamProps> = ({
  commentary,
  commentaryScrollRef,
  teamBowling,
  teamBatting
}) => {
  return (
    <div className="glass-panel p-6 flex flex-col h-[400px] relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <SectionLabel>🎙 Agent Commentary Stream</SectionLabel>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-danger/10 px-2 py-0.5 rounded-full border border-danger/20">
            <span className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse" />
            <span className="text-[8px] font-mono text-danger font-bold uppercase tracking-wider">Live Feed</span>
          </div>
        </div>
      </div>
      
      <div ref={commentaryScrollRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
        <AnimatePresence initial={false}>
          {commentary.length > 0 ? (
            commentary.map((c) => (
              <motion.div 
                key={c.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-2xl border-l-4 bg-bg-card/40 backdrop-blur-md transition-all hover:bg-bg-card/60 ${
                  c.type === MatchEvent.SIX ? 'border-accent-alt' : 
                  c.type === MatchEvent.FOUR ? 'border-accent-blue' : 
                  c.type === MatchEvent.WICKET ? 'border-danger' : 'border-border/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <Mic2 className="w-3 h-3" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-tighter">Gemini Agent</span>
                  </div>
                  <div className="text-[9px] font-mono text-text-muted">{c.ball} · {getAbbr(teamBowling)} v {getAbbr(teamBatting)}</div>
                </div>
                <p className="text-xs leading-relaxed text-gray-100 font-medium">{c.text}</p>
                {c.type === MatchEvent.SIX && (
                  <div className="mt-2 flex gap-1">
                    <Badge className="bg-accent-alt/10 text-accent-alt border-accent-alt/20 text-[7px] py-0">MAXIMUM</Badge>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-muted space-y-2 opacity-50">
              <Radio className="w-8 h-8 animate-pulse" />
              <span className="text-[10px] font-mono uppercase">Connecting to broadcast stream...</span>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
