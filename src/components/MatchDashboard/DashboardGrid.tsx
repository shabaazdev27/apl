import React from 'react';
import { LogEntry, PlayerPick, CommentaryLine, Insight, Tweet, SquadData } from '../../types';
import { AgentFeed } from './AgentFeed';
import { ContextTabs } from './ContextTabs';
import { CommentaryStream } from './CommentaryStream';
import { TacticalInsights } from './TacticalInsights';
import { FanSentiment } from './FanSentiment';

interface DashboardGridProps {
  logs: LogEntry[];
  logScrollRef: React.RefObject<HTMLDivElement | null>;
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
  commentary: CommentaryLine[];
  commentaryScrollRef: React.RefObject<HTMLDivElement | null>;
  insights: Insight[];
  tweets: Tweet[];
  squadData: SquadData | null;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  logs,
  logScrollRef,
  activeTab,
  setActiveTab,
  teamBatting,
  teamBowling,
  winProb,
  currentBatsman,
  currentBowler,
  fantasyPicks,
  isOrchestrating,
  handlePlayerClick,
  commentary,
  commentaryScrollRef,
  insights,
  tweets,
  squadData
}) => {
  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-12">
      <AgentFeed logs={logs} logScrollRef={logScrollRef} />
      
      <ContextTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        teamBatting={teamBatting}
        teamBowling={teamBowling}
        winProb={winProb}
        currentBatsman={currentBatsman}
        currentBowler={currentBowler}
        fantasyPicks={fantasyPicks}
        isOrchestrating={isOrchestrating}
        handlePlayerClick={handlePlayerClick}
        squadData={squadData}
      />

      <CommentaryStream 
        commentary={commentary}
        commentaryScrollRef={commentaryScrollRef}
        teamBowling={teamBowling}
        teamBatting={teamBatting}
      />

      <TacticalInsights insights={insights} />
      
      <FanSentiment tweets={tweets} />
    </div>
  );
};
