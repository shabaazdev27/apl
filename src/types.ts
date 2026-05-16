export enum MatchEvent {
  DOT = 'dot',
  SINGLE = '1',
  DOUBLE = '2',
  FOUR = 'four',
  SIX = 'six',
  WIDE = 'wide',
  WICKET = 'wicket',
  DRS = 'drs'
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  glow: string;
  bg: string;
  description: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  agentId: string;
  message: string;
  type?: 'success' | 'warn' | 'error' | 'info' | '';
}

export interface CommentaryLine {
  id: string;
  ball: string;
  text: string;
  type?: string;
}

export interface Insight {
  id: string;
  type: 'hot' | 'warn' | 'purple';
  badge: string;
  text: string;
}

export interface Tweet {
  id: string;
  handle: string;
  text: string;
  sentiment: 'pos' | 'neg' | 'neu';
}

export interface PlayerPick {
  id: string;
  name: string;
  pts: number;
  role: string;
  isCaptain?: boolean;
  isVC?: boolean;
  initials: string;
  stats?: {
    avgRuns: number;
    wickets: number;
    strikeRate: number;
    economy: number;
    form: number; // 0-100
    consistency: number; // 0-100
  };
}

export interface SquadData {
  team1: { name: string; players: string[] };
  team2: { name: string; players: string[] };
}
