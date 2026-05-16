import { MatchEvent, Agent, PlayerPick } from "./types";

export const AGENTS: Agent[] = [
  { id: 'scout', name: 'Scout Agent', role: 'Data Ingestion', icon: '📡', color: '#38bdf8', glow: 'rgba(56,189,248,0.15)', bg: 'rgba(56,189,248,0.08)', description: 'SportRadar API Handler' },
  { id: 'predict', name: 'Predict Agent', role: 'Win Probability', icon: '🔮', color: '#7c6ef5', glow: 'rgba(124,110,245,0.15)', bg: 'rgba(124,110,245,0.08)', description: 'Bayesian Prediction Engine' },
  { id: 'comment', name: 'Commentary Agent', role: 'Live Commentary', icon: '🎙', color: '#00e5a0', glow: 'rgba(0, 229, 160, 0.15)', bg: 'rgba(0, 229, 160, 0.08)', description: 'Gemini NLP Engine' },
  { id: 'tactic', name: 'Tactics Agent', role: 'Coaching AI', icon: '♟', color: '#ffc93c', glow: 'rgba(255, 201, 60, 0.15)', bg: 'rgba(255, 201, 60, 0.08)', description: 'Field Optimization Logic' },
  { id: 'clip', name: 'Clip Agent', role: 'Highlight Factory', icon: '🎬', color: '#ff6b35', glow: 'rgba(255, 107, 53, 0.15)', bg: 'rgba(255, 107, 53, 0.08)', description: 'Computer Vision Editor' },
  { id: 'fantasy', name: 'Fantasy Agent', role: 'Dream XI Engine', icon: '⚡', color: '#ff4d6a', glow: 'rgba(255, 77, 106, 0.15)', bg: 'rgba(255, 77, 106, 0.08)', description: 'Points Allocation Optimizer' },
  { id: 'social', name: 'Social Agent', role: 'Fan Intelligence', icon: '📱', color: '#7c6ef5', glow: 'rgba(124, 110, 245, 0.12)', bg: 'rgba(124, 110, 245, 0.06)', description: 'Sentiment Analysis Hub' },
  { id: 'broadcast', name: 'Broadcast Agent', role: 'Global Distribution', icon: '📺', color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.12)', bg: 'rgba(56, 189, 248, 0.06)', description: 'Multi-region Delivery' },
  { id: 'health', name: 'Health Agent', role: 'Match Operations', icon: '💚', color: '#00e5a0', glow: 'rgba(0, 229, 160, 0.1)', bg: 'rgba(0, 229, 160, 0.05)', description: 'Match State Orchestration' },
];

export const FANTASY_PICKS: PlayerPick[] = [
  { id: '1', name: 'Gaikwad', pts: 94, role: 'BAT', isCaptain: true, initials: 'RG' },
  { id: '2', name: 'Bumrah', pts: 88, role: 'BOWL', isVC: true, initials: 'JB' },
  { id: '3', name: 'Jadeja', pts: 76, role: 'ALL', initials: 'RJ' },
  { id: '4', name: 'Conway', pts: 72, role: 'WK', initials: 'DC' },
  { id: '5', name: 'Pandya', pts: 68, role: 'ALL', initials: 'HP' },
  { id: '6', name: 'Dhoni', pts: 65, role: 'WK', initials: 'MS' },
];

export const INITIAL_TWEETS = [
  { id: 't1', handle: '@CricketFever_IN', text: 'Gaikwad is absolutely ON FIRE tonight 🔥 67 off 41!', sentiment: 'pos' },
  { id: 't2', handle: '@MumbaiDiehard', text: 'Bumrah is still our best! That dot was crucial', sentiment: 'pos' },
  { id: 't3', handle: '@CricketAnalyst99', text: 'Required rate creeping up. CSK need to accelerate NOW', sentiment: 'neu' },
  { id: 't4', handle: '@IPLFan_London', text: 'Watching from UK — this chase is INSANE', sentiment: 'pos' },
  { id: 't5', handle: '@TamilCSKFan', text: 'நம்ம Gaikwad பஞ்சு மாதிரி batting பண்றான்! 💚', sentiment: 'pos' },
];

export const EVENT_MAP: Record<MatchEvent, string> = {
  [MatchEvent.DOT]: 'a dot ball, excellent delivery, batsman beaten',
  [MatchEvent.FOUR]: 'a stunning FOUR, driven through covers',
  [MatchEvent.SIX]: 'a massive SIX, smashed over mid-wicket into the stands',
  [MatchEvent.WIDE]: 'a wide down the leg side, gift from the bowler',
  [MatchEvent.WICKET]: 'WICKET! caught behind, clean bowled, end of innings',
  [MatchEvent.DRS]: 'DRS review called — third umpire checking for LBW',
  [MatchEvent.SINGLE]: 'a single, rotated strike',
  [MatchEvent.DOUBLE]: 'two runs, good running between wickets',
};
