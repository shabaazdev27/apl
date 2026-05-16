import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  MatchEvent, 
  LogEntry, 
  CommentaryLine, 
  Insight,
  Tweet,
  PlayerPick,
  SquadData
} from '../types';
import {
  AGENTS,
  FANTASY_PICKS,
  INITIAL_TWEETS,
} from '../constants';
import { 
  generateCommentary, 
  generateInsights, 
  generateSentiment, 
  generateFantasyXI 
} from '../services/geminiService';
import { 
  getCurrentMatches, 
  getMatchSquad, 
  Match 
} from '../services/cricApi';
import { getPlayerStats } from '../services/playerService';

export const useMatchSimulation = () => {
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const AUTO_TRIGGER_SECONDS = 60;
  const [autoTriggerCountdown, setAutoTriggerCountdown] = useState(AUTO_TRIGGER_SECONDS);
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(true);
  const [balls, setBalls] = useState(0);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [commentaryStyle, setCommentaryStyle] = useState('en_harsha');

  const [teamBatting, setTeamBatting] = useState("");
  const [teamBowling, setTeamBowling] = useState("");
  const [currentBatsman, setCurrentBatsman] = useState("");
  const [currentBowler, setCurrentBowler] = useState("");
  const [targetScoreStr, setTargetScoreStr] = useState("");
  const [targetRuns, setTargetRuns] = useState(0);
  const [fantasyPicks, setFantasyPicks] = useState<PlayerPick[]>([]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [commentary, setCommentary] = useState<CommentaryLine[]>([]);
  const [insights, setInsights] = useState<Insight[]>([
    { id: 'i1', type: 'purple', badge: 'TACTIC', text: 'Analyzing optimal field geometry...' },
    { id: 'i2', type: 'hot', badge: 'ALERT', text: 'Monitoring player health signals...' }
  ]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [agentProgress, setAgentProgress] = useState<Record<string, number>>({});
  const [thinkingAgents, setThinkingAgents] = useState<Set<string>>(new Set());
  const [winProb, setWinProb] = useState({ team1: 50, team2: 50 });
  const [winProbHistory, setWinProbHistory] = useState<{ over: string; team1: number; team2: number }[]>([]);
  
  const [businessMetrics, setBusinessMetrics] = useState({
    engagement: 0,
    revenue: 0,
    latency: 0,
    sync: 100
  });
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [squadData, setSquadData] = useState<SquadData | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<MatchEvent>(MatchEvent.SINGLE);

  const addLog = (agentId: string, message: string, type: LogEntry['type'] = '') => {
    setLogs(prev => [{ id: Math.random().toString(), timestamp: Date.now(), agentId, message, type }, ...prev].slice(0, 50));
  };

  const updateFantasyPicks = async (picks: PlayerPick[]) => {
    const picksWithStats = await Promise.all(picks.map(async (p) => {
      const stats = await getPlayerStats(p.name);
      return { ...p, stats };
    }));
    setFantasyPicks(picksWithStats);
  };

  const speakCommentary = (text: string, style: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const langMap: Record<string, string> = {
      ta: 'ta-IN',
      hi: 'hi-IN',
      en_bbc: 'en-GB',
      en_shastri: 'en-IN',
      en_harsha: 'en-IN'
    };
    
    utterance.lang = langMap[style] || 'en-IN';
    if (style === 'en_bbc') {
      utterance.pitch = 0.9;
      utterance.rate = 0.95;
    } else if (style === 'en_shastri') {
      utterance.pitch = 1.2;
      utterance.rate = 1.1;
    }
    
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === utterance.lang);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const handleTrigger = useCallback(async () => {
    if (isOrchestrating) return;
    setIsOrchestrating(true);
    
    try {
      const newBalls = balls + 1;
      setBalls(newBalls);

      const runAgent = async (id: string, duration: number, taskOverride?: string, doneMsg?: string) => {
        setThinkingAgents(prev => new Set(prev).add(id));
        setAgentProgress(prev => ({ ...prev, [id]: 0 }));
        
        const task = taskOverride || "Processing...";
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
      };

      const overStr = `${Math.floor(newBalls/6)}.${newBalls%6}`;
      const scoreStr = `${runs}/${wickets}`;

      addLog('scout', `Intercepting ball ${overStr} event: ${selectedEvent.toUpperCase()}`, 'info');
      await runAgent('scout', 800, 'Ingesting data stream...', 'Event synchronized.');

      const otherAgents = AGENTS.filter(a => a.id !== 'scout');
      
      setBusinessMetrics(prev => ({
        engagement: Math.min(prev.engagement + (selectedEvent === MatchEvent.SIX ? 2.5 : 0.4), 100),
        revenue: prev.revenue + (selectedEvent === MatchEvent.SIX ? 450 : 80),
        latency: 140 + Math.floor(Math.random() * 10),
        sync: 99.8 + (Math.random() * 0.2)
      }));

      generateCommentary({
        event: selectedEvent,
        score: scoreStr,
        target: targetScoreStr || 'TBD',
        over: overStr,
        batsman: currentBatsman,
        bowler: currentBowler,
        style: commentaryStyle,
        matchContext: selectedMatch?.title || `${teamBatting} vs ${teamBowling}`,
      }).then(text => {
        if (text) {
          speakCommentary(text, commentaryStyle);
          setCommentary(prev => [{ id: Math.random().toString(), ball: overStr, text, type: selectedEvent }, ...prev].slice(0, 10));
        }
      });

      await Promise.all(otherAgents.map((a, i) => runAgent(a.id, 800 + i * 150)));

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

      if (selectedEvent === MatchEvent.WICKET && squadData) {
        // Rotate to next batsman
        const battingPlayers = squadData.team1.players; // Assuming team1 is always batting for simplicity in mock, but real logic should use teamBatting
        const currentIdx = battingPlayers.indexOf(currentBatsman);
        const nextIdx = (currentIdx + 1) % battingPlayers.length;
        setCurrentBatsman(battingPlayers[nextIdx]);
        addLog('scout', `New batsman in: ${battingPlayers[nextIdx]}`, 'info');
      }

      setFantasyPicks(prev => prev.map(p => {
        let ptsAdd = Math.floor(Math.random() * 5);
        if (selectedEvent === MatchEvent.SIX && (p.role === 'BAT' || p.role === 'ALL')) ptsAdd += 12;
        if (selectedEvent === MatchEvent.WICKET && (p.role === 'BOWL' || p.role === 'ALL')) ptsAdd += 25;
        return { ...p, pts: p.pts + ptsAdd };
      }));

      const impact = selectedEvent === MatchEvent.SIX ? 8 : selectedEvent === MatchEvent.WICKET ? -15 : selectedEvent === MatchEvent.DOT ? -3 : 2;
      setWinProb(prev => {
        const newTeam1 = Math.min(Math.max(prev.team1 + impact, 5), 95);
        const newProb = { team1: newTeam1, team2: 100 - newTeam1 };
        setWinProbHistory(h => [...h, { over: overStr, ...newProb }].slice(-20));
        return newProb;
      });

      if (selectedEvent === MatchEvent.SIX || selectedEvent === MatchEvent.WICKET || Math.random() > 0.7) {
        generateInsights({
          matchTitle: selectedMatch?.title || `${teamBatting} vs ${teamBowling}`,
          matchDescription: `Squads: ${squadData?.team1.name} vs ${squadData?.team2.name}`,
          score: `${runs + runAdd}/${wickets + wicketAdd}`,
          overs: overStr
        }).then(newInsights => {
          if (newInsights) setInsights(newInsights);
        });

        generateSentiment({
          matchTitle: selectedMatch?.title || `${teamBatting} vs ${teamBowling}`,
          matchDescription: `${selectedEvent.toUpperCase()} at ${overStr}. Players: ${currentBatsman} (Bat) vs ${currentBowler} (Bowl).`
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
  }, [isOrchestrating, balls, runs, wickets, selectedEvent, currentBatsman, currentBowler, commentaryStyle, selectedMatch, teamBatting, teamBowling, targetScoreStr, squadData]);

  const resetSimulation = useCallback(() => {
    setRuns(0);
    setWickets(0);
    setBalls(0);
    setLogs([{ id: 'l1', timestamp: Date.now(), agentId: 'health', message: 'Simulation reset.', type: 'info' }]);
    setCommentary([]);
    setInsights([
      { id: 'i1', type: 'purple', badge: 'TACTIC', text: 'Analyzing optimal field geometry...' },
      { id: 'i2', type: 'hot', badge: 'ALERT', text: 'Monitoring player health signals...' }
    ]);
    setTweets([]);
    setWinProb({ team1: 50, team2: 50 });
    setWinProbHistory([]);
  }, []);

  const handleRefreshFantasy = useCallback(async () => {
    if (!selectedMatch) return;
    setIsOrchestrating(true);
    try {
      const newPicks = await generateFantasyXI({
        matchTitle: selectedMatch.title,
        matchDescription: selectedMatch.description,
        score: `${runs}/${wickets}`,
        overs: `${Math.floor(balls/6)}.${balls%6}`,
        squadInfo: squadData ? `${squadData.team1.name}: ${squadData.team1.players.join(', ')}` : ''
      });
      if (newPicks) updateFantasyPicks(newPicks);
    } catch (e) {
      console.error(e);
    } finally {
      setIsOrchestrating(false);
    }
  }, [selectedMatch, runs, wickets, balls, squadData]);

  const generateInitialData = useCallback(async () => {
    if (!selectedMatch) return;
    
    // 1. Initial Commentary
    generateCommentary({
      event: MatchEvent.SINGLE,
      score: `${runs}/${wickets}`,
      target: targetScoreStr || 'TBD',
      over: '0.0',
      batsman: currentBatsman,
      bowler: currentBowler,
      style: commentaryStyle,
      matchContext: selectedMatch.title,
    }).then(text => {
      if (text) setCommentary([{ id: 'initial-c', ball: '0.0', text, type: MatchEvent.SINGLE }]);
    });

    // 2. Initial Sentiment
    generateSentiment({
      matchTitle: selectedMatch.title,
      matchDescription: `Match is starting. Squads: ${squadData?.team1.name} vs ${squadData?.team2.name}`
    }).then(newTweets => {
      if (newTweets) setTweets(newTweets.map((t, i) => ({ ...t, id: `init-t-${i}` })));
    });

    // 3. Initial Fantasy
    handleRefreshFantasy();
  }, [selectedMatch, runs, wickets, targetScoreStr, currentBatsman, currentBowler, commentaryStyle, squadData, handleRefreshFantasy]);

  return useMemo(() => ({
    runs, setRuns, wickets, setWickets, balls, setBalls,
    autoTriggerCountdown, setAutoTriggerCountdown,
    autoTriggerEnabled, setAutoTriggerEnabled,
    isOrchestrating, setIsOrchestrating,
    commentaryStyle, setCommentaryStyle,
    teamBatting, setTeamBatting,
    teamBowling, setTeamBowling,
    currentBatsman, setCurrentBatsman,
    currentBowler, setCurrentBowler,
    targetScoreStr, setTargetScoreStr,
    targetRuns, setTargetRuns,
    fantasyPicks, setFantasyPicks,
    logs, setLogs,
    commentary, setCommentary,
    insights, setInsights,
    tweets, setTweets,
    agentProgress, setAgentProgress,
    thinkingAgents, setThinkingAgents,
    winProb, setWinProb,
    winProbHistory, setWinProbHistory,
    businessMetrics, setBusinessMetrics,
    liveMatches, setLiveMatches,
    selectedMatch, setSelectedMatch,
    squadData, setSquadData,
    selectedEvent, setSelectedEvent,
    handleTrigger, handleRefreshFantasy, resetSimulation, generateInitialData,
    AUTO_TRIGGER_SECONDS
  }), [
    runs, wickets, balls, autoTriggerCountdown, autoTriggerEnabled, isOrchestrating,
    commentaryStyle, teamBatting, teamBowling, currentBatsman, currentBowler,
    targetScoreStr, targetRuns, fantasyPicks, logs, commentary, insights,
    tweets, agentProgress, thinkingAgents, winProb, winProbHistory,
    businessMetrics, liveMatches, selectedMatch, squadData, selectedEvent,
    handleTrigger, handleRefreshFantasy, resetSimulation, generateInitialData
  ]);
};
