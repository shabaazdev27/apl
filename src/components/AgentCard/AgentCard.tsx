import React from 'react';
import { motion } from 'framer-motion';
import { Agent } from '../../types';

interface AgentCardProps {
  agent: Agent;
  isRunning: boolean;
  isThinking: boolean;
  progress: number;
}

export const AgentCard: React.FC<AgentCardProps> = ({ 
  agent, 
  isRunning, 
  isThinking, 
  progress 
}) => (
  <motion.div 
    layout
    className={`bg-bg-card border p-4 rounded-xl relative overflow-hidden transition-colors ${
      isRunning || isThinking ? 'border-accent' : 'border-border'
    }`}
    style={{ 
      boxShadow: isRunning || isThinking ? `0 0 20px ${agent.glow}` : 'none',
      '--agent-color': agent.color,
      '--agent-glow': agent.glow
    } as any}
  >
    <div className="flex items-center justify-between mb-3">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
        style={{ backgroundColor: agent.bg }}
      >
        {agent.icon}
      </div>
      <div className={`w-2 h-2 rounded-full ${
        isThinking ? 'bg-accent-yellow animate-pulse' : 
        isRunning ? 'bg-accent animate-pulse' : 'bg-text-muted'
      }`} />
    </div>
    <h3 className="font-head font-bold text-sm mb-1">{agent.name}</h3>
    <p className="text-[11px] font-mono text-text-muted mb-2">{agent.role}</p>
    <div className="h-8 overflow-hidden">
      <p className="text-[11px] leading-relaxed text-gray-300">
        {isThinking ? (
          <span className="flex gap-1 items-center">
            <span className="w-1 h-1 bg-accent-yellow rounded-full animate-bounce" />
            <span className="w-1 h-1 bg-accent-yellow rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1 h-1 bg-accent-yellow rounded-full animate-bounce [animation-delay:0.4s]" />
            <span className="ml-1">Thinking...</span>
          </span>
        ) : agent.description}
      </p>
    </div>
    <div className="mt-3 h-0.5 w-full bg-border rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        className="h-full bg-accent"
        style={{ backgroundColor: agent.color }}
      />
    </div>
  </motion.div>
);
