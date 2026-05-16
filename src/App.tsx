import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Target, 
  Activity, 
  TrendingUp, 
  MessageSquare, 
  BarChart3, 
  ShieldCheck, 
  Globe, 
  Trophy, 
  Timer,
  ChevronRight,
  Info,
  Twitter,
  Cpu,
  MonitorPlay,
  Briefcase,
  Layers,
  ChevronDown,
  RefreshCw,
  X,
  Play,
  AlertTriangle,
  MoveUpRight,
  MousePointer2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MatchEvent, 
  Agent, 
  LogEntry, 
  CommentaryLine, 
  Insight,
  Tweet,
  PlayerPick
} from './types';
import {
  AGENTS,
  FANTASY_PICKS,
  INITIAL_TWEETS,
  EVENT_MAP
} from './constants';
import { generateCommentary, generateInsights, generateSentiment, generateFantasyXI } from './services/geminiService';
import { getCurrentMatches, getMatchSquad, Match } from './services/cricApi';
import { getPlayerStats } from './services/playerService';

// --- Components ---

const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${className}`}>
    {children}
  </span>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em] whitespace-nowrap">
      {children}
    </span>
    <div className="h-px w-full bg-border" />
  </div>
);

interface AgentCardProps {
  agent: Agent;
  isRunning: boolean;
  isThinking: boolean;
  progress: number;
}

const AgentCard: React.FC<AgentCardProps> = ({ 
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

const MetricCard = ({ 
  label, 
  value, 
  delta, 
  color = "var(--color-accent)" 
}: { 
  label: string; 
  value: string | number; 
  delta: string; 
  color?: string 
}) => (
  <div className="bg-bg-card border border-border p-4 rounded-xl text-center relative overflow-hidden group">
    <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
    <div className="font-head text-2xl font-extrabold mb-1" style={{ color }}>{value}</div>
    <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{label}</div>
    <div className="text-[10px] font-mono text-accent mt-1">{delta}</div>
  </div>
);

const AGENT_TASKS: Record<string, string[]> = {
  scout: ['Synchronizing with SportRadar stream...', 'Ingesting real-time latency-aware data...', 'Validating event integrity via blockchain hash...'],
  predict: ['Calibrating Win Probability models...', 'Executing 10k Bayesian simulations...', 'Updating real-time betting liquidity risk...'],
  comment: ['SynthesizingHarsha.ai narration...', 'Contextualizing historical performance...', 'Generating multi-lingual NLP commentary...'],
  tactic: ['Simulating optimal field geometry...', 'Calculating optimal bowling rotations...', 'Evaluating batsman weakness heatmaps...'],
  clip: ['Detecting social-viral keyframes...', 'Auto-generating 4K highlight reels...', 'Applying dynamic advertiser overlays...'],
  fantasy: ['Calculating dynamic fantasy multipliers...', 'Optimizing high-yield Dream XI lineups...', 'Predicting player momentum shifts...'],
  social: ['Mapping global fan sentiment graph...', 'Analyzing viral engagement velocity...', 'Identifying key influencer mentions...'],
  broadcast: ['Allocating multi-region CDN bandwidth...', 'Optimizing 8K ultra-low latency stream...', 'Scaling broadcast concurrency nodes...'],
  health: ['Verifying distributed system parity...', 'Ensuring sub-20ms agent orchestration...', 'Monitoring global infrastructure ROI...']
};

const getAgentTask = (id: string) => {
  const tasks = AGENT_TASKS[id] || ['Processing...', 'Analyzing...', 'Optimizing...'];
  return tasks[Math.floor(Math.random() * tasks.length)];
};

// --- Main App ---

const parseTeam = (str: string) => {
  const hasAsterisk = str.includes('*');
  const cleanStr = str.replace(/\*/g, '').trim();
  const parts = cleanStr.split(' ');
  const lastPart = parts[parts.length - 1];
  
  let name = cleanStr;
  let scoreStr = '';
  let runs = 0;
  let wickets = 0;
  
  if (/^\d+(\/\d+)?$/.test(lastPart)) {
    scoreStr = lastPart;
    name = parts.slice(0, -1).join(' ').trim();
    const scoreParts = scoreStr.split('/');
    runs = parseInt(scoreParts[0], 10);
    wickets = scoreParts.length > 1 ? parseInt(scoreParts[1], 10) : 10;
  } else if (lastPart?.toLowerCase() === 'out' && parts[parts.length - 2]?.toLowerCase() === 'all') {
    const scorePart = parts[parts.length - 3] || "0";
    if (/^\d+$/.test(scorePart)) {
         scoreStr = scorePart + ' all out';
         name = parts.slice(0, -3).join(' ').trim();
         runs = parseInt(scorePart, 10);
         wickets = 10;
    }
  }

  return { name, scoreStr, runs, wickets, isBatting: hasAsterisk };
};

const parseMatchTitle = (title: string) => {
  const parts = title.split(' v ');
  if (parts.length !== 2) return null;
  return { team1: parseTeam(parts[0]), team2: parseTeam(parts[1]) };
};

const getAbbr = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 3).toUpperCase();
  return parts.slice(0, 3).map(w => w[0]).join('').toUpperCase();
};

export default function App() {
  const [runs, setRuns] = useState(142);
  const [wickets, setWickets] = useState(4);
  const [balls, setBalls] = useState(104);
  const [activeView, setActiveView] = useState('live');
  const [activeTab, setActiveTab] = useState('win');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [commentaryStyle, setCommentaryStyle] = useState('en_harsha');

  const [teamBatting, setTeamBatting] = useState("Chennai Super Kings");
  const [teamBowling, setTeamBowling] = useState("Mumbai Indians");
  const [targetScoreStr, setTargetScoreStr] = useState("180/7");
  const [targetRuns, setTargetRuns] = useState(181);
  const [fantasyPicks, setFantasyPicks] = useState<PlayerPick[]>(FANTASY_PICKS);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 'l1', timestamp: Date.now(), agentId: 'health', message: 'CricketMind AI Engine v2.4 initialized', type: 'info' }
  ]);
  const [commentary, setCommentary] = useState<CommentaryLine[]>([
    { id: 'c1', ball: '17.2', text: 'CSK require 38 from 16. The match is perfectly poised as we enter the final phase.', type: 'info' }
  ]);
  const [insights, setInsights] = useState<Insight[]>([
    { id: 'i1', type: 'purple', badge: 'TACTIC', text: 'Analyzing optimal field geometry...' },
    { id: 'i2', type: 'hot', badge: 'ALERT', text: 'Monitoring player health signals...' }
  ]);
  const [tweets, setTweets] = useState<Tweet[]>(INITIAL_TWEETS.map((t, i) => ({ ...t, id: `t${i}` })));
  const [agentProgress, setAgentProgress] = useState<Record<string, number>>({});
  const [thinkingAgents, setThinkingAgents] = useState<Set<string>>(new Set());
  const [winProb, setWinProb] = useState({ csk: 63, mi: 37 });
  const [winProbHistory, setWinProbHistory] = useState<{ over: string; csk: number; mi: number }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MatchEvent>(MatchEvent.SINGLE);
  const [modalContent, setModalContent] = useState<{ title: string; body: string } | null>(null);

  const [businessMetrics, setBusinessMetrics] = useState({
    engagement: 82.4,
    revenue: 12400,
    latency: 142,
    sync: 99.9
  });
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [squadInfo, setSquadInfo] = useState<string>('');

  const updateFantasyPicks = async (picks: PlayerPick[]) => {
      const picksWithStats = await Promise.all(picks.map(async (p) => {
        const stats = await getPlayerStats(p.name);
        return { ...p, stats };
      }));
      setFantasyPicks(picksWithStats);
  };

  const logScrollRef = useRef<HTMLDivElement>(null);
  const commentaryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load live matches
    getCurrentMatches().then(matches => {
      setLiveMatches(matches);
      if (matches.length > 0) {
        setSelectedMatch(matches[0]);
      }
    }).catch(e => {
      console.warn("Failed to catch live matches", e);
    });
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      const parsed = parseMatchTitle(selectedMatch.title);
      if (parsed) {
        let bat = parsed.team1;
        let bowl = parsed.team2;
        if (parsed.team2.isBatting) {
          bat = parsed.team2;
          bowl = parsed.team1;
        }

        setTeamBatting(bat.name);
        setTeamBowling(bowl.name);
        setRuns(bat.runs || 0);
        setWickets(bat.wickets || 0);
        setTargetScoreStr(bowl.scoreStr || "Yet to bat");
        setTargetRuns(bowl.runs ? bowl.runs + 1 : 0);
        setBalls(12);

        setLogs(prev => [{ id: Math.random().toString(), timestamp: Date.now(), agentId: 'scout', message: `Loaded match context: ${selectedMatch.title}`, type: 'info' }, ...prev].slice(0, 50));
        setCommentary(prev => [{ id: Math.random().toString(), ball: '2.0', text: `Loaded live match context: ${selectedMatch.title}`, type: 'info' }, ...prev].slice(0, 10));
        setWinProb({ csk: 50, mi: 50 });
        setWinProbHistory([{ over: '0.0', csk: 50, mi: 50 }]);

        // Fetch Squad Info if IDs available
        if (selectedMatch.seriesId && selectedMatch.matchId) {
          getMatchSquad(selectedMatch.seriesId, selectedMatch.matchId).then(squads => {
            if (squads && squads.length > 0) {
              const info = squads.map((s: any) => `${s.team}: ${s.players.join(', ')}`).join(' | ');
              setSquadInfo(info);
              addLog('scout', `Verified squad data synchronized from open source.`, 'success');
              
              // Regenerate fantasy XI with real squads
              generateFantasyXI({
                matchTitle: selectedMatch.title,
                matchDescription: selectedMatch.description,
                score: bat.scoreStr || "0/0",
                overs: "0.0",
                squadInfo: info
              }).then(newPicks => {
                if (newPicks) updateFantasyPicks(newPicks);
              });
            }
          });
        }

        generateInsights({
          matchTitle: selectedMatch.title,
          matchDescription: selectedMatch.description,
          score: bat.scoreStr || "0/0",
          overs: "0.0"
        }).then(newInsights => {
          if (newInsights) setInsights(newInsights);
        });

        generateSentiment({
          matchTitle: selectedMatch.title,
          matchDescription: selectedMatch.description
        }).then(newTweets => {
          if (newTweets) setTweets(newTweets.map((t, i) => ({ ...t, id: `ai-t-${i}` })));
        });

        generateFantasyXI({
          matchTitle: selectedMatch.title,
          matchDescription: selectedMatch.description,
          score: bat.scoreStr || "0/0",
          overs: "0.0",
          squadInfo: squadInfo
        }).then(newPicks => {
          if (newPicks) updateFantasyPicks(newPicks);
        });
      }
    }
  }, [selectedMatch]);

  useEffect(() => {
    if (logScrollRef.current) logScrollRef.current.scrollTop = 0;
    if (commentaryScrollRef.current) commentaryScrollRef.current.scrollTop = 0;
  }, [logs, commentary]);

  const addLog = (agentId: string, message: string, type: LogEntry['type'] = '') => {
    setLogs(prev => [{ id: Math.random().toString(), timestamp: Date.now(), agentId, message, type }, ...prev].slice(0, 50));
  };

  const handleTrigger = async () => {
    if (isOrchestrating) return;
    setIsOrchestrating(true);
    
    try {
      const newBalls = balls + 1;
      setBalls(newBalls);

      // Agent flow
      const runAgent = async (id: string, duration: number, taskOverride?: string, doneMsg?: string) => {
        setThinkingAgents(prev => new Set(prev).add(id));
        setAgentProgress(prev => ({ ...prev, [id]: 0 }));
        
        const task = taskOverride || getAgentTask(id);
        const completionMsg = doneMsg || `${id.toUpperCase()} operation successful.`;

        const startTime = Date.now();
        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / duration) * 100, 100);
          setAgentProgress(prev => ({ ...prev, [id]: progress }));
          if (progress >= 100) clearInterval(interval);
        }, 50);

        await new Promise(r => setTimeout(r, duration));
        setThinkingAgents(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        addLog(id, `${task} -> ${completionMsg}`, 'success');
        
        // Business logic impact for Broadcast/Health
        if (id === 'broadcast') {
          setBusinessMetrics(prev => ({ ...prev, latency: 120 + Math.floor(Math.random() * 30) }));
        }
        if (id === 'health') {
          setBusinessMetrics(prev => ({ ...prev, sync: 99.7 + Math.random() * 0.3 }));
        }
      };

      // Sequential/Parallel Execution
      const overStr = `${Math.floor(newBalls/6)}.${newBalls%6}`;
      const scoreStr = `${runs}/${wickets}`;

      addLog('scout', `Intercepting ball ${overStr} event: ${selectedEvent.toUpperCase()}`, 'info');
      await runAgent('scout', 800, 'Ingesting data stream...', 'Event synchronized.');

      const otherAgents = AGENTS.filter(a => a.id !== 'scout');
      
      // Update Business Metrics based on event
      setBusinessMetrics(prev => ({
        engagement: Math.min(prev.engagement + (selectedEvent === MatchEvent.SIX ? 2.5 : 0.4), 100),
        revenue: prev.revenue + (selectedEvent === MatchEvent.SIX ? 450 : 80),
        latency: 140 + Math.floor(Math.random() * 10),
        sync: 99.8 + (Math.random() * 0.2)
      }));

      // Trigger AI Commentary
      const desc = selectedMatch?.description || "";
      const playersNames = desc.split(/[;,\(\)\/\d]+/).map(s => s.trim()).filter(s => s.length > 3 && !['ov', 'out', 'batting'].includes(s.toLowerCase()));
      const currentBatsman = playersNames[1] || 'Ruturaj Gaikwad';
      const currentBowler = playersNames[playersNames.length - 1] || 'Jasprit Bumrah';

      generateCommentary({
        event: selectedEvent,
        score: scoreStr,
        target: 'TBD',
        over: overStr,
        batsman: currentBatsman,
        bowler: currentBowler,
        style: commentaryStyle,
        matchContext: selectedMatch?.title || "CSK vs MI (IPL Final)",
      }).then(text => {
        if (text) {
          setCommentary(prev => [{ id: Math.random().toString(), ball: overStr, text, type: selectedEvent }, ...prev].slice(0, 10));
        }
      });

      // Run other agents in semi-parallel with business logic delays
      await Promise.all(otherAgents.map((a, i) => 
        runAgent(a.id, 800 + i * 150)
      ));

      // Update Match State
      let runAdd = 0;
      let wicketAdd = 0;
      if (selectedEvent === MatchEvent.FOUR) runAdd = 4;
      else if (selectedEvent === MatchEvent.SIX) runAdd = 6;
      else if (selectedEvent === MatchEvent.SINGLE) runAdd = 1;
      else if (selectedEvent === MatchEvent.DOUBLE) runAdd = 2;
      else if (selectedEvent === MatchEvent.WIDE) runAdd = 1;
      else if (selectedEvent === MatchEvent.WICKET) wicketAdd = 1;

      setRuns(r => r + runAdd);
      setWickets(w => w + wicketAdd);

      // Dynamic Player Updates
      setFantasyPicks(prev => prev.map(p => {
        const isBatsman = p.role === 'BAT' || p.role === 'ALL';
        const isBowler = p.role === 'BOWL' || p.role === 'ALL';
        
        let ptsAdd = Math.floor(Math.random() * 5);
        if (selectedEvent === MatchEvent.SIX && isBatsman) ptsAdd += 12;
        if (selectedEvent === MatchEvent.FOUR && isBatsman) ptsAdd += 8;
        if (selectedEvent === MatchEvent.WICKET && isBowler) ptsAdd += 25;
        
        return { ...p, pts: p.pts + ptsAdd };
      }));

      // Update Win Prob
      const impact = selectedEvent === MatchEvent.SIX ? 8 : selectedEvent === MatchEvent.WICKET ? -15 : selectedEvent === MatchEvent.DOT ? -3 : 2;
      setWinProb(prev => {
        const newCsk = Math.min(Math.max(prev.csk + impact, 5), 95);
        const newProb = { csk: newCsk, mi: 100 - newCsk };
        setWinProbHistory(h => [...h, { over: overStr, ...newProb }].slice(-20));
        return newProb;
      });

      // Refresh Insights & Social occasionally or on big events
      if (selectedEvent === MatchEvent.SIX || selectedEvent === MatchEvent.WICKET || Math.random() > 0.7) {
        generateInsights({
          matchTitle: selectedMatch?.title || `${teamBatting} vs ${teamBowling}`,
          matchDescription: selectedMatch?.description,
          score: `${runs + runAdd}/${wickets + wicketAdd}`,
          overs: overStr
        }).then(newInsights => {
          if (newInsights) setInsights(newInsights);
        });

        generateSentiment({
          matchTitle: selectedMatch?.title || `${teamBatting} vs ${teamBowling}`,
          matchDescription: `${selectedEvent.toUpperCase()} at ${overStr}`
        }).then(newTweets => {
          if (newTweets) setTweets(newTweets.map((t, i) => ({ ...t, id: `ai-t-${i}-${balls}` })));
        });
      }
    } catch (e) {
      console.error("Simulation Error", e);
      addLog('health', 'Simulation error occurred.', 'warn');
    } finally {
      setIsOrchestrating(false);
    }
  };

  const handleRefreshFantasy = async () => {
    if (!selectedMatch) return;
    setIsOrchestrating(true);
    try {
      const newPicks = await generateFantasyXI({
        matchTitle: selectedMatch.title,
        matchDescription: selectedMatch.description,
        score: `${runs}/${wickets}`,
        overs: `${Math.floor(balls/6)}.${balls%6}`,
        squadInfo: squadInfo
      });
      if (newPicks) updateFantasyPicks(newPicks);
    } catch (e) {
      console.error(e);
    } finally {
      setIsOrchestrating(false);
    }
  };

  const handlePlayerClick = (p: PlayerPick) => {
      setModalContent({ 
        title: p.name, 
        body: `${p.name} (${p.role})\nAvg Runs: ${p.stats?.avgRuns || '-'}\nWickets: ${p.stats?.wickets || '-'}\nStrike Rate: ${p.stats?.strikeRate || '-'}\nPredicted Score: ${p.pts} pts\nOwnership: 64%\nStrategic Value: High impact in ${p.role === 'BOWL' ? 'death overs' : 'powerplay'}.` 
      });
  };

  return (
    <div className="relative z-10">
      <div className="noise-overlay" />
      
      {/* Header */}
      <header className="sticky top-0 bg-bg/90 backdrop-blur-md border-b border-border z-50 py-4">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(0,229,160,0.4)]">
              🏏
            </div>
            <h1 className="text-xl font-bold tracking-tighter">
              Cricket<span className="text-accent underline decoration-accent/30 underline-offset-4">Mind</span> AI
            </h1>
          </div>
          
          <nav className="flex items-center gap-1 bg-bg-card/50 p-1 rounded-full border border-border">
            {['live', 'analytics', 'fantasy', 'broadcast'].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-mono transition-all capitalize ${
                  activeView === view ? 'bg-accent text-bg font-bold shadow-lg' : 'text-text-muted hover:text-white'
                }`}
              >
                {view}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-danger/10 border border-danger/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
              <span className="text-[10px] font-mono text-danger font-bold uppercase tracking-wider">Agents Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Broadcast Ticker */}
      <div className="bg-bg-alt border-b border-border overflow-hidden py-2.5">
        <div className="flex animate-scroll whitespace-nowrap gap-12">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-12 items-center">
              {liveMatches.length > 0 ? (
                liveMatches.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-lg">🏏</span> 
                    <span className="text-text-muted uppercase">{m.title.split(' v ')[0].substring(0,3)} vs {m.title.split(' v ')[1]?.substring(0,3) || '???'} —</span> 
                    <span className="text-white font-bold">{m.title}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-lg">📡</span> <span className="text-text-muted">Fetching live scores...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {activeView === 'live' && (
          <>
            {/* Hero */}
            <section className="text-center mb-12">
              <Badge className="bg-accent/10 text-accent border-accent/20 mb-6 px-4 py-1.5 tracking-widest uppercase">
                ⚡ 9 Autonomous Agents · 4.8M Global Viewers
              </Badge>
              <h2 className="text-4xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
                The World's First <br />
                <span className="glowing-text">Agentic Cricket Brain</span>
              </h2>
              <p className="max-w-2xl mx-auto text-text-muted text-lg font-light leading-relaxed">
                A multi-agent AI system that watches, predicts, commentates, and broadcasts cricket autonomously across every timezone.
              </p>
            </section>

            {/* Match Score Bar */}
            <div className="glass-panel p-6 mb-8 shadow-2xl shadow-accent/5">
              {liveMatches.length > 0 && (
                <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-border pb-4">
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                    Live Open Source Matches (Cricinfo RSS)
                  </span>
                  <div className="flex gap-2 w-full md:w-auto">
                    <select 
                      title="Select Live Match"
                      className="flex-1 bg-bg border border-border text-xs px-3 py-1.5 rounded-lg max-w-[300px] truncate"
                      value={selectedMatch?.id}
                      onChange={e => {
                        const m = liveMatches.find(x => x.id === e.target.value);
                        if (m) setSelectedMatch(m);
                      }}
                    >
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
              <div className="text-[10px] font-mono text-white/50 mt-2 truncate w-full max-w-[200px]" title={selectedMatch?.title}>
                {selectedMatch?.description}
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-bg-card/50 rounded-2xl border border-border-alt relative">
              <div className="text-3xl font-head font-bold text-accent-yellow">
                {Math.floor(balls/6)}.{balls%6}
              </div>
              <div className="text-[10px] font-mono text-text-muted uppercase tracking-tighter">Overs Completed</div>
              <div className="absolute -bottom-4 bg-bg text-[9px] font-mono px-3 py-1 rounded-full border border-border text-accent">
                RRR: {targetRuns > 0 ? ( (targetRuns - runs) / Math.max(1, ((120 - balls) / 6)) ).toFixed(2) : "N/A"}
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

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          <MetricCard label="Current RR" value={(runs / Math.max(1, balls/6)).toFixed(2)} delta="↑ +0.4" color="var(--color-accent)" />
          <MetricCard label="Runs Req" value={targetRuns > 0 ? targetRuns - runs : "-"} delta={targetRuns > 0 ? `${120 - balls} balls` : "-"} color="var(--color-accent-alt)" />
          <MetricCard label={`${getAbbr(teamBatting)} Win Prob`} value={`${winProb.csk}%`} delta="↑ +8%" color="var(--color-accent-purple)" />
          <MetricCard label="Viewers" value="4.8M" delta="127 Countries" color="var(--color-accent-yellow)" />
          <MetricCard label="Active Agents" value={9 - thinkingAgents.size} delta="All Systems Nominal" color="var(--color-accent-blue)" />
          <MetricCard label="Last Wicket" value={`${Math.max(0, wickets-1)}`} delta="Crucial Dismissal" color="var(--color-danger)" />
        </div>

        {/* Orchestrator */}
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
                <label className="block text-[9px] font-mono text-text-muted mb-2 uppercase tracking-widest">Voice Style</label>
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
                onClick={() => {
                  setRuns(142); setWickets(4); setBalls(104);
                  setLogs([{ id: 'reset', timestamp: Date.now(), agentId: 'health', message: 'Resetting simulation parameters...', type: 'info' }]);
                  setCommentary([commentary[0]]);
                }}
                className="p-4 rounded-xl border border-border hover:bg-white/5 transition-colors group"
                title="Reset Simulation"
              >
                <RefreshCw className="w-5 h-5 text-text-muted group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          
          {/* Agent Feed */}
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

          {/* Context Tabs */}
          <div className="glass-panel p-6 flex flex-col h-[400px]">
            <div className="flex gap-1 bg-bg-card p-1 rounded-xl border border-border mb-6">
              {[
                { id: 'win', label: 'Win Probability', icon: BarChart3 },
                { id: 'field', label: 'Field Map', icon: Target },
                { id: 'fantasy', label: 'Fantasy XI', icon: Trophy },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono transition-all ${
                    activeTab === tab.id ? 'bg-bg-alt border border-border-alt text-white shadow-xl' : 'text-text-muted hover:text-gray-400'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1">
              {activeTab === 'win' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="text-accent underline">{getAbbr(teamBatting)} BATTING</span>
                      <span className="text-accent-alt">{getAbbr(teamBowling)} BOWLING</span>
                    </div>
                    <div className="h-4 w-full bg-bg-card rounded-full overflow-hidden border border-border flex">
                      <motion.div 
                        animate={{ width: `${winProb.csk}%` }}
                        className="h-full bg-accent relative group"
                      >
                        <div className="absolute inset-0 bg-white/10 animate-pulse opacity-0 group-hover:opacity-100" />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-bg">{winProb.csk}%</span>
                      </motion.div>
                      <motion.div 
                        animate={{ width: `${winProb.mi}%` }}
                        className="h-full bg-accent-alt relative group"
                      >
                        <div className="absolute inset-0 bg-white/10 animate-pulse opacity-0 group-hover:opacity-100" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-bg">{winProb.mi}%</span>
                      </motion.div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-bg-card/50 p-4 rounded-xl border border-border">
                      <SectionLabel>Live Momentum</SectionLabel>
                      <div className="flex items-center gap-2 text-accent">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-bold font-mono">BAT SIDE +7%</span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
                        3 sixes in last 12 balls. Power-hitting index peaking.
                      </p>
                    </div>
                    <div className="bg-bg-card/50 p-4 rounded-xl border border-border">
                      <SectionLabel>Game State</SectionLabel>
                      <div className="flex items-center gap-2 text-accent-yellow">
                        <Timer className="w-4 h-4" />
                        <span className="text-xs font-bold font-mono">PRESSURE ↑</span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
                        Dot ball probability rising. Required rate at 12.4.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'field' && (
                <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 h-full relative p-4 group">
                   <div className={`w-[200px] h-[200px] rounded-full border-2 relative bg-green-900/10 overflow-hidden transition-all duration-500 ${
                     isOrchestrating ? 'border-accent shadow-[0_0_30px_rgba(0,229,160,0.3)] scale-105' : 'border-accent/30'
                   }`}>
                     {/* Pitch */}
                     <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-20 bg-accent-yellow/20 border border-accent-yellow/30" />
                     
                     {/* Inner Circle */}
                     <div className="absolute inset-8 rounded-full border border-dashed border-accent/20" />
                     
                     {/* Bowler Run-up */}
                     <div className="absolute left-1/2 top-0 -translate-x-1/2 w-4 h-8 border-x border-white/5" />
                     
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-2 h-2 bg-accent rounded-full shadow-[0_0_15px_var(--color-accent)] ${isOrchestrating ? 'animate-ping' : 'animate-pulse'}`} />
                     </div>
                     
                     {/* Fielder Dots with Labels */}
                     {[
                       { p: [15, 25], l: 'SLIP' }, { p: [55, 5], l: 'LB' }, { p: [85, 35], l: 'CVR' }, 
                       { p: [75, 75], l: 'MID' }, { p: [25, 85], l: 'LEG' }, { p: [5, 45], l: 'GUL' }, { p: [45, 92], l: 'BND' }
                     ].map((f, i) => (
                       <motion.div 
                        key={i}
                        animate={isOrchestrating ? { 
                           x: [0, (Math.random() - 0.5) * 15, 0], 
                           y: [0, (Math.random() - 0.5) * 15, 0] 
                        } : {
                           x: [0, Math.random() * 8, 0], 
                           y: [0, Math.random() * 8, 0] 
                        }}
                        transition={{ repeat: Infinity, duration: isOrchestrating ? 0.3 : 4 + i, ease: "easeInOut" }}
                        className="absolute flex flex-col items-center"
                        style={{ left: `${f.p[0]}%`, top: `${f.p[1]}%` }}
                       >
                         <div className="w-2 h-2 bg-accent-purple rounded-full shadow-[0_0_8px_var(--color-accent-purple)]" />
                         <span className="text-[6px] font-mono text-white/40 mt-0.5">{f.l}</span>
                       </motion.div>
                     ))}
                   </div>
                   
                   <div className="mt-6 text-center space-y-2">
                     <p className="text-[11px] font-mono text-text-muted italic bg-bg-card/80 p-2 rounded-lg border border-border">
                       <span className="text-accent underline">AI Suggestion:</span> Adjust for {teamBatting} strategy. <br />
                       Optimal field geometry synchronized for the current over.
                     </p>
                     <div className="flex gap-2 justify-center">
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-accent rounded-full" /> <span className="text-[8px] font-mono">BAT</span></div>
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-accent-purple rounded-full" /> <span className="text-[8px] font-mono">FIELD</span></div>
                     </div>
                   </div>
                </div>
              )}

              {activeTab === 'fantasy' && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-right-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {fantasyPicks.map(p => (
                    <motion.div 
                      key={p.id} 
                      whileHover={{ scale: 1.02 }}
                      className="bg-bg-card/50 border border-border p-3 rounded-xl flex items-center gap-3 group cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold font-head border transition-all ${
                        p.isCaptain ? 'bg-accent-yellow text-bg border-accent-yellow shadow-[0_0_10px_rgba(255,201,60,0.4)]' : 
                        p.isVC ? 'bg-accent-purple text-white border-accent-purple shadow-[0_0_10px_rgba(124,110,245,0.4)]' : 'bg-bg border-border text-white group-hover:border-accent'
                      }`}>
                        {p.initials}
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] font-bold flex items-center gap-1">
                          {p.name}
                        </div>
                        <div className="text-[9px] font-mono text-text-muted">{p.role} · {p.pts} PTS</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Commentary & Insights */}
          <div className="glass-panel p-6 flex flex-col h-[400px]">
            <SectionLabel>🎙 Agent Commentary Stream</SectionLabel>
            <div ref={commentaryScrollRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
              <AnimatePresence initial={false}>
                {commentary.map((c) => (
                  <motion.div 
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border-l-[3px] bg-bg-card/50 ${
                      c.type === MatchEvent.SIX ? 'border-accent-alt' : 
                      c.type === MatchEvent.FOUR ? 'border-accent-blue' : 
                      c.type === MatchEvent.WICKET ? 'border-danger' : 'border-border'
                    }`}
                  >
                    <div className="text-[9px] font-mono text-text-muted mb-1">{c.ball} · {getAbbr(teamBowling)} vs {getAbbr(teamBatting)}</div>
                    <p className="text-sm leading-relaxed text-gray-200">{c.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Insights & Social */}
          <div className="glass-panel p-6 flex flex-col h-[400px]">
            <SectionLabel>🧠 Real-time Tactical Insights</SectionLabel>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
              <AnimatePresence>
                {insights.map((i, idx) => (
                  <motion.div 
                    key={i.id || idx}
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
                    {/* Progress bar mock */}
                    <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 w-full" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

              {/* Social */}
              <div className="glass-panel p-6 flex flex-col h-[400px]">
                 <SectionLabel>📱 Fan Sentiment Intelligence</SectionLabel>
                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                  {tweets.map(t => (
                    <div key={t.id} className="bg-bg-card/30 border border-border p-3 rounded-xl flex gap-3 group hover:border-accent-purple/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-accent-purple/10 flex items-center justify-center text-accent-purple font-black text-xs shrink-0">{t.handle[1].toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <span className="text-[10px] font-mono text-accent-purple truncate">{t.handle}</span>
                          <Badge className={
                            t.sentiment === 'pos' ? 'bg-accent/10 text-accent border-accent/20' : 
                            t.sentiment === 'neg' ? 'bg-danger/10 text-danger border-danger/20' : 
                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }>
                            {t.sentiment === 'pos' ? 'POSITIVE' : t.sentiment === 'neg' ? 'NEGATIVE' : 'NEUTRAL'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-text-muted leading-relaxed italic">"{t.text}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeView === 'analytics' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
             <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="glass-panel p-8">
                   <SectionLabel>Win Probability Over Time</SectionLabel>
                   <div className="h-[300px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={winProbHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCsk" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorMi" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-accent-alt)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--color-accent-alt)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis 
                            dataKey="over" 
                            stroke="#555" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#555" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            domain={[0, 100]}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0A0A0B', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              fontSize: '10px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="csk" 
                            name={getAbbr(teamBatting)}
                            stroke="var(--color-accent)" 
                            fillOpacity={1} 
                            fill="url(#colorCsk)" 
                            strokeWidth={3}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="mi" 
                            name={getAbbr(teamBowling)}
                            stroke="var(--color-accent-alt)" 
                            fillOpacity={1} 
                            fill="url(#colorMi)" 
                            strokeWidth={3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div className="glass-panel p-8">
                   <SectionLabel>Player Performance Index</SectionLabel>
                   <div className="h-[300px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fantasyPicks.slice(0, 6)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis 
                            dataKey="initials" 
                            stroke="#555" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#555" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ 
                              backgroundColor: '#0A0A0B', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              fontSize: '10px'
                            }}
                            formatter={(value, name, props) => [value, props.payload.name]}
                          />
                          <Bar dataKey="pts" radius={[4, 4, 0, 0]}>
                            {fantasyPicks.slice(0, 6).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.isCaptain ? 'var(--color-accent-yellow)' : entry.isVC ? 'var(--color-accent-purple)' : 'var(--color-accent)'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
             <div className="glass-panel p-8">
                <SectionLabel>Advanced Spatial Analytics & Predictive Heatmaps</SectionLabel>
                <div className="grid lg:grid-cols-3 gap-8 mt-6">
                    <div className="lg:col-span-2 bg-bg-card rounded-3xl border border-border p-6 relative overflow-hidden h-[300px]">
                        <div className="absolute inset-0 bg-linear-to-br from-accent/5 to-transparent flex items-center justify-center">
                            {/* Pitch Visualization */}
                            <div className="relative w-full max-w-[400px] h-full flex items-center justify-center">
                                <div className="absolute w-[60px] h-[180px] bg-accent-yellow/10 border border-accent-yellow/20 rounded-md" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-accent/20 rounded-full animate-pulse" />
                                
                                {/* Hotspots */}
                                {[
                                    { x: 30, y: 40, size: 80, o: 0.1 },
                                    { x: 70, y: 60, size: 120, o: 0.2 },
                                    { x: 45, y: 20, size: 60, o: 0.15 }
                                ].map((h, i) => (
                                    <motion.div 
                                      key={i}
                                      animate={{ scale: [1, 1.1, 1], opacity: [h.o, h.o * 1.5, h.o] }}
                                      transition={{ repeat: Infinity, duration: 3 + i, ease: "easeInOut" }}
                                      className="absolute bg-accent rounded-full blur-2xl"
                                      style={{ left: `${h.x}%`, top: `${h.y}%`, width: h.size, height: h.size }}
                                    />
                                ))}

                                <div className="z-10 text-center">
                                    <div className="text-[10px] font-mono text-accent drop-shadow-lg font-black uppercase tracking-widest mb-2">Dominant Scoring Zone</div>
                                    <p className="text-[11px] text-text-muted max-w-[150px] mx-auto italic">Batsman has 64% success rate in the deep mid-wicket region against spin.</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-4 right-4 flex gap-2">
                            <Badge className="bg-bg-card border-border text-[8px]">LIVE SPATIAL FEED</Badge>
                            <Badge className="bg-accent/20 text-accent border-accent/30 text-[8px]">PRO: 92% ACCURACY</Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                        {[
                        { label: 'CONTROL INDEX', value: '0.84', trend: '↑ +0.02', desc: 'Shot selection accuracy', color: 'text-accent-blue' },
                        { label: 'AGGRESSION SCORING', value: '7.2', trend: '↓ -0.5', desc: 'Power hitting frequency', color: 'text-accent-yellow' },
                        { label: 'PRESSURE MULTIPLIER', value: 'x1.4', trend: '↑ +0.2', desc: 'Dot ball buildup factor', color: 'text-danger' },
                        { label: 'LUCK COEFFICIENT', value: '+0.12', trend: '– Steady', desc: 'Edge/Mis-hit survival rate', color: 'text-accent-purple' }
                        ].slice(0, 2).map((m, idx) => (
                        <motion.div 
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            className="p-6 bg-bg-card border border-border rounded-2xl group cursor-help"
                        >
                            <div className="text-[10px] text-text-muted mb-2 font-mono uppercase tracking-[0.2em]">{m.label}</div>
                            <div className={`text-3xl font-head font-black mb-1 ${m.color}`}>{m.value}</div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-white/40">{m.trend}</span>
                                <Info className="w-3 h-3 text-white/20 group-hover:text-accent transition-colors" />
                            </div>
                        </motion.div>
                        ))}
                    </div>
                </div>
             </div>
          </div>
        )}

        {activeView === 'fantasy' && (
           <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-linear-to-r from-accent/10 to-accent-purple/10 border border-accent/20 p-6 rounded-2xl mb-8 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-bg text-2xl shadow-xl shadow-accent/20">🏆</div>
                    <div>
                       <h3 className="font-head font-black text-xl">Top Predicted Strategy</h3>
                       <p className="text-xs text-text-muted">Dynamic points optimization running at sub-50ms latency.</p>
                    </div>
                 </div>
                 <button 
                  onClick={handleRefreshFantasy}
                  className="bg-bg border border-border px-6 py-2 rounded-xl text-xs font-mono font-bold hover:border-accent transition-all animate-pulse"
                 >
                   RE-SIMULATE XI
                 </button>
              </div>

              <div className="glass-panel p-10 mb-8 overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Trophy className="w-48 h-48" />
                 </div>
                 <SectionLabel>Dream XI Strategy & Squad Feed</SectionLabel>
                 <div className="grid lg:grid-cols-3 gap-8 mt-8">
                    <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                       {fantasyPicks.map(p => (
                          <motion.div 
                            key={p.id} 
                            whileHover={{ scale: 1.05, y: -5 }}
                            onClick={() => handlePlayerClick(p)}
                            className="bg-bg-card/50 border border-border p-6 rounded-2xl flex flex-col items-center text-center group hover:border-accent transition-all cursor-pointer relative"
                          >
                             <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold font-head border-2 mb-4 transition-transform group-hover:scale-110 ${
                               p.isCaptain ? 'bg-accent-yellow text-bg border-accent-yellow shadow-2xl' : 
                               p.isVC ? 'bg-accent-purple text-white border-accent-purple shadow-xl' : 'bg-bg border-border text-white'
                             }`}>
                                {p.initials}
                             </div>
                             {p.isCaptain && <div className="absolute top-4 right-4 bg-accent-yellow text-bg text-[8px] font-black px-1.5 rounded-sm">CAPT</div>}
                             {p.isVC && <div className="absolute top-4 right-4 bg-accent-purple text-white text-[8px] font-black px-1.5 rounded-sm">V-CAPT</div>}
                             <div className="font-head font-bold text-lg mb-1">{p.name}</div>
                             <div className="text-xs font-mono text-text-muted mb-4">{p.role}</div>
                             <div className="flex gap-2 mt-2 text-[8px] font-mono text-text-muted">
                                <span>Avg: {p.stats?.avgRuns || '-'}</span>
                                <span>SR: {p.stats?.strikeRate || '-'}</span>
                             </div>
                             <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MousePointer2 className="w-4 h-4 text-accent" />
                             </div>
                          </motion.div>
                       ))}
                    </div>
                    <div className="space-y-6">
                       <motion.div 
                         whileHover={{ x: 5 }}
                         onClick={() => {
                           const cap = fantasyPicks.find(p => p.isCaptain);
                           if (cap) {
                             setModalContent({
                               title: `Captain Analysis: ${cap.name}`,
                               body: `${cap.name} (${cap.role})\nAvg Runs: ${cap.stats?.avgRuns || '-'}\nStrike Rate: ${cap.stats?.strikeRate || '-'}\nPredicted Score: ${cap.pts} pts\nAdvanced metrics suggest a high probability of impact in the ${cap.role === 'BOWL' ? 'death overs' : 'middle-order acceleration phase'}.`
                             });
                           }
                         }}
                         className="bg-accent-purple/10 border border-accent-purple/30 p-8 rounded-3xl relative overflow-hidden group cursor-pointer"
                       >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-purple/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
                          <h4 className="font-head font-bold text-xl mb-4 flex items-center gap-3">
                             <Zap className="w-5 h-5 text-accent-purple" />
                             Captain's Choice
                          </h4>
                          <p className="text-sm text-text-muted leading-relaxed mb-6">
                            {fantasyPicks.find(p => p.isCaptain)?.name || "Analyzing..."} is projected to score another {Math.floor((fantasyPicks.find(p => p.isCaptain)?.pts || 45) * 0.8)} points based on current momentum and match situation.
                          </p>
                          <div className="flex items-center gap-2 text-accent-purple text-xs font-bold uppercase tracking-widest">
                             View Analysis <ChevronRight className="w-4 h-4" />
                          </div>
                       </motion.div>
                       
                       <motion.div 
                         whileHover={{ x: 5 }}
                         onClick={() => {
                           const diff = fantasyPicks.find(p => !p.isCaptain && !p.isVC) || fantasyPicks[2];
                           if (diff) {
                             setModalContent({
                               title: `Differential Strategy: ${diff.name}`,
                               body: `${diff.name} represents high strategic value. As a ${diff.role}, they are currently under-owned in most pools. Our model predicts a high impact window in the upcoming 5 overs due to shifting pitch conditions.`
                             });
                           }
                         }}
                         className="bg-accent-yellow/10 border border-accent-yellow/30 p-8 rounded-3xl relative overflow-hidden group cursor-pointer"
                       >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-yellow/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
                          <h4 className="font-head font-bold text-xl mb-4 flex items-center gap-3">
                             <Target className="w-5 h-5 text-accent-yellow" />
                             Differential Pick
                          </h4>
                          <p className="text-sm text-text-muted leading-relaxed mb-6">
                            {fantasyPicks.find(p => !p.isCaptain && !p.isVC)?.name || "Searching..."} is a high potential pick due to current swing conditions and recent tactical changes.
                          </p>
                          <div className="flex items-center gap-2 text-accent-yellow text-xs font-bold uppercase tracking-widest">
                             Explore Pick <ChevronRight className="w-4 h-4" />
                          </div>
                       </motion.div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeView === 'broadcast' && (
           <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="glass-panel p-10">
                 <SectionLabel>Global Distribution Network</SectionLabel>
                 <div className="grid lg:grid-cols-2 gap-12 mt-8">
                    <div className="space-y-8">
                        <div className="flex gap-6">
                           <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shrink-0 border border-accent/20">
                              <Globe className="w-8 h-8" />
                           </div>
                           <div>
                              <h4 className="font-head font-bold text-xl mb-1">Edge Rendering</h4>
                              <p className="text-sm text-text-muted leading-relaxed">Lowering latency for global viewers by rendering dashboards at the network edge.</p>
                           </div>
                        </div>
                        <div className="flex gap-6">
                           <div className="w-16 h-16 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue shrink-0 border border-accent-blue/20">
                              <MonitorPlay className="w-8 h-8" />
                           </div>
                           <div>
                              <h4 className="font-head font-bold text-xl mb-1">Multi-Lang TTS</h4>
                              <p className="text-sm text-text-muted leading-relaxed">Real-time localized audio generation for 127 countries simultaneously.</p>
                           </div>
                        </div>
                    </div>
                    <div className="bg-bg-card rounded-3xl border border-border p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
                       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,160,0.05)_0%,transparent_70%)] animate-pulse" />
                       <div className="text-center relative z-10">
                          <RefreshCw className="w-12 h-12 text-accent mx-auto mb-4 animate-spin opacity-20" />
                          <p className="font-mono text-xs text-text-muted uppercase tracking-[0.3em] mb-4">Awaiting Video Source...</p>
                          <div className="flex gap-1.5 justify-center">
                             {[1,2,3,4,5,6,7,8].map(i => (
                               <motion.div 
                                 key={i}
                                 animate={{ height: [10, 30, 10] }}
                                 transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                                 className="w-1 bg-accent/20 rounded-full"
                               />
                             ))}
                          </div>
                       </div>
                       
                       <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-bg/80 backdrop-blur-sm border border-white/5 p-2 rounded-lg text-center">
                             <div className="text-[8px] text-text-muted mb-0.5">LATENCY</div>
                             <div className="text-[10px] font-mono text-accent">12ms</div>
                          </div>
                          <div className="bg-bg/80 backdrop-blur-sm border border-white/5 p-2 rounded-lg text-center">
                             <div className="text-[8px] text-text-muted mb-0.5">BITRATE</div>
                             <div className="text-[10px] font-mono text-accent">6.4 Mbps</div>
                          </div>
                          <div className="bg-bg/80 backdrop-blur-sm border border-white/5 p-2 rounded-lg text-center">
                             <div className="text-[8px] text-text-muted mb-0.5">FPS</div>
                             <div className="text-[10px] font-mono text-accent">60.1</div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Deploy Footer */}
        <section className="bg-linear-to-br from-accent/5 to-accent-purple/5 border border-border-alt rounded-3xl p-12 text-center">
          <h3 className="text-3xl font-head font-black mb-4">Production-Ready Intelligence</h3>
          <p className="text-text-muted text-lg font-light mb-10">Deploy this autonomous stack to Cloud Run & Vertex AI.</p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {[
              { title: 'Data Ingestion Layer', icon: Globe, desc: 'Google Pub/Sub + Cloud Dataflow pipeline for sub-50ms event latency.' },
              { title: 'Agent Orchestration', icon: Cpu, desc: 'Parallel execution of 9 agents hosted on Cloud Run, synchronized via Memorystore.' },
              { title: 'Broadcast Engine', icon: MonitorPlay, desc: 'Global distribution to 200+ CDN nodes with real-time TTS in 14 languages.' },
              { title: 'ML Prediction Stack', icon: Activity, desc: 'Vertex AI pipeline running Bayesian & LSTM models on 15yr of match data.' },
              { title: 'Sentiment Hub', icon: MessageSquare, desc: 'Social firehose processing for real-time crowd mood & engagement scoring.' },
              { title: 'Fantasy Strategy', icon: Trophy, desc: 'Dynamic Dream XI points optimizer updating live for 10M+ daily active players.' },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="bg-bg-alt/50 border border-border p-6 rounded-2xl cursor-pointer hover:border-accent transition-all group"
                onClick={() => setModalContent({ title: item.title, body: item.desc + '\n\nFull architecture diagrams available in implementation spec.' })}
              >
                <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h4 className="font-head font-bold mb-2">{item.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal Mockup */}
      <AnimatePresence>
        {modalContent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalContent(null)}
              className="absolute inset-0 bg-bg/90 backdrop-blur-lg"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-bg-card border border-border p-8 rounded-3xl shadow-2xl shadow-accent/20"
            >
              <button 
                onClick={() => setModalContent(null)}
                className="absolute top-6 right-6 text-text-muted hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black mb-4">{modalContent.title}</h2>
              <div className="text-text-muted text-sm leading-relaxed space-y-4">
                <p>{modalContent.body}</p>
              </div>
              <button 
                onClick={() => setModalContent(null)}
                className="mt-8 w-full py-4 bg-accent text-bg font-head font-black rounded-xl"
              >
                CLOSE SPEC
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-12 border-t border-border text-center">
        <div className="flex justify-center gap-6 mb-6">
          <Twitter className="w-5 h-5 text-accent cursor-pointer hover:scale-110 transition-transform" />
          <Globe className="w-5 h-5 text-accent cursor-pointer hover:scale-110 transition-transform" />
          <Info className="w-5 h-5 text-accent cursor-pointer hover:scale-110 transition-transform" />
        </div>
        <p className="text-[10px] font-mono text-text-muted uppercase tracking-[0.3em]">
          Powered by Google Gemini & Anthropic Claude · Agentic Intelligence Platform
        </p>
      </footer>
    </div>
  );
}
