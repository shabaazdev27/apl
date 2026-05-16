import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Agent, LogEntry } from '../../types';
import { AGENTS } from '../../constants';
import { SectionLabel } from '../common/Common';

interface AgentFeedProps {
  logs: LogEntry[];
  logScrollRef: React.RefObject<HTMLDivElement | null>;
}

export const AgentFeed: React.FC<AgentFeedProps> = ({ logs, logScrollRef }) => {
  return (
    <div className="glass-panel p-6 flex flex-col h-[400px]">
      <SectionLabel>Live Agent Command Feed</SectionLabel>
      <div ref={logScrollRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
        <AnimatePresence initial={false}>
          {logs.map((log) => {
            const agent = AGENTS.find(a => a.id === log.agentId);
            return (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 items-start border-b border-white/5 pb-2"
              >
                <span className="text-[10px] font-mono text-text-muted mt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span 
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-opacity-10 min-w-[70px] text-center"
                  style={{ backgroundColor: agent?.bg || 'gray', color: agent?.color || 'gray' }}
                >
                  {agent?.name.split(' ')[0] || log.agentId}
                </span>
                <span className={`text-[11px] leading-relaxed flex-1 ${
                  log.type === 'success' ? 'text-accent' : 
                  log.type === 'info' ? 'text-accent-blue' : 
                  log.type === 'warn' ? 'text-accent-yellow' : 'text-gray-300'
                }`}>
                  {log.message}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
