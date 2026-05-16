import React, { useState, useEffect, useRef } from 'react';
import { Twitter, Globe, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types & Constants
import { MatchEvent, PlayerPick } from './types';
import { 
  generateCommentary, 
  generateInsights, 
  generateSentiment, 
  generateFantasyXI, 
  sendChatMessage, 
  analyzeMatchImage,
  ChatMessage 
} from './services/geminiService';
import { getCurrentMatches, getMatchSquad } from './services/cricApi';

// Hooks
import { useMatchSimulation } from './hooks/useMatchSimulation';
import { useQuiz } from './hooks/useQuiz';

// Components
import { Header } from './components/Header/Header';
import { Badge } from './components/common/Common';
import { LiveScoreBar } from './components/MatchDashboard/LiveScoreBar';
import { AgentOrchestrator } from './components/AgentOrchestrator/AgentOrchestrator';
import { DashboardGrid } from './components/MatchDashboard/DashboardGrid';
import { ChatUI } from './components/Chat/ChatUI';
import { FantasyView } from './components/Fantasy/FantasyView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { BroadcastView } from './components/Broadcast/BroadcastView';

// Utils
import { parseMatchTitle, getAbbr } from './utils/matchUtils';

export default function App() {
  const sim = useMatchSimulation();
  const quiz = useQuiz();
  
  const [activeView, setActiveView] = useState('live');
  const [activeTab, setActiveTab] = useState('win');
  const [modalContent, setModalContent] = useState<{ title: string; body: string } | null>(null);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I\'m CricketMind AI. Ask me anything about the live match, tactics, or fantasy picks!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const newMsgs = [...chatMessages, { role: 'user', content: chatInput } as ChatMessage];
    setChatMessages(newMsgs);
    setChatInput('');
    setChatLoading(true);
    try {
      const response = await sendChatMessage(newMsgs);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error reaching chat service.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleImageAnalysis = async (file: File) => {
    const newMsgs = [...chatMessages, { role: 'user', content: `📸 [Analysing Match Snap: ${file.name}]` } as ChatMessage];
    setChatMessages(newMsgs);
    setChatLoading(true);
    try {
      const response = await analyzeMatchImage(file);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error analyzing image. Ensure it is a valid match screenshot.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  const logScrollRef = useRef<HTMLDivElement>(null);
  const commentaryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMatches = () => {
      getCurrentMatches().then(matches => {
        sim.setLiveMatches(matches);
        if (matches.length > 0 && !sim.selectedMatch) {
          const iplKeywords = ['ipl', 'indian premier league', 'chennai', 'mumbai', 'rcb'];
          const iplMatch = matches.find(m => iplKeywords.some(k => m.title.toLowerCase().includes(k)));
          sim.setSelectedMatch(iplMatch || matches[0]);
        } else if (sim.selectedMatch) {
          // Update the selected match with fresh data
          const updated = matches.find(m => m.id === sim.selectedMatch?.id);
          if (updated) sim.setSelectedMatch(updated);
        }
      }).catch(e => console.warn("Failed to catch live matches", e));
    };

    fetchMatches();
    const interval = setInterval(fetchMatches, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [sim.selectedMatch?.id]);

  const lastMatchId = useRef<string | null>(null);

  useEffect(() => {
    if (sim.selectedMatch) {
      const isNewMatch = lastMatchId.current !== sim.selectedMatch.id;
      lastMatchId.current = sim.selectedMatch.id;

      if (isNewMatch) {
        // Reset Simulation State ONLY for a brand new match
        sim.setBalls(0);
        sim.setLogs([{ id: 'l1', timestamp: Date.now(), agentId: 'health', message: `Syncing with live match: ${sim.selectedMatch.title}`, type: 'info' }]);
        sim.setCommentary([]);
        sim.setInsights([
          { id: 'i1', type: 'purple', badge: 'TACTIC', text: 'Analyzing optimal field geometry...' },
          { id: 'i2', type: 'hot', badge: 'ALERT', text: 'Monitoring player health signals...' }
        ]);
        sim.setTweets([]);
        sim.setWinProb({ team1: 50, team2: 50 });
        sim.setWinProbHistory([]);
      }

      const hasStructuredData = sim.selectedMatch.team1 && sim.selectedMatch.team2;
      
      if (hasStructuredData) {
        const t1 = sim.selectedMatch.team1!;
        const t2 = sim.selectedMatch.team2!;
        
        let bat = t1.isBatting ? t1 : t2;
        let bowl = t1.isBatting ? t2 : t1;

        sim.setTeamBatting(bat.name);
        sim.setTeamBowling(bowl.name);
        sim.setRuns(bat.runs || 0);
        sim.setWickets(bat.wickets || 0);
        
        // Convert over string (e.g., "16.6") to balls
        if (bat.overs) {
          const [ov, b] = bat.overs.split('.').map(n => parseInt(n, 10) || 0);
          sim.setBalls((ov * 6) + b);
        } else {
          sim.setBalls(0);
        }
        
        sim.setTargetScoreStr(bowl.runs ? `${bowl.runs}/${bowl.wickets || 0} (${bowl.overs || '0'} ov)` : "Yet to bat");
        sim.setTargetRuns(bowl.runs ? bowl.runs + 1 : 0);
      } else {
        const parsed = parseMatchTitle(sim.selectedMatch.title);
        if (parsed) {
          let bat = parsed.team1;
          let bowl = parsed.team2;
          if (parsed.team2.isBatting) { bat = parsed.team2; bowl = parsed.team1; }

          sim.setTeamBatting(bat.name);
          sim.setTeamBowling(bowl.name);
          sim.setRuns(bat.runs || 0);
          sim.setWickets(bat.wickets || 0);
          sim.setBalls(bat.balls || 0);
          sim.setTargetScoreStr(bowl.scoreStr || "Yet to bat");
          sim.setTargetRuns(bowl.runs ? bowl.runs + 1 : 0);
        }
      }

      // Fetch Squad Info
      if (isNewMatch && sim.selectedMatch.seriesId && sim.selectedMatch.matchId) {
        getMatchSquad(sim.selectedMatch.seriesId, sim.selectedMatch.matchId).then(squads => {
          if (squads && squads.length >= 2) {
            const sData = {
              team1: { name: squads[0].team, players: squads[0].players },
              team2: { name: squads[1].team, players: squads[1].players }
            };
            sim.setSquadData(sData);
            
            // Set initial batsman and bowler from real squad
            if (sData.team1.players.length > 0) {
              sim.setCurrentBatsman(sData.team1.players[0]);
            }
            if (sData.team2.players.length > 0) {
              sim.setCurrentBowler(sData.team2.players[0]);
            }

            // Trigger initial AI population
            sim.generateInitialData();
          }
        });
      }
    }
  }, [sim.selectedMatch]);


  useEffect(() => {
    if (logScrollRef.current) logScrollRef.current.scrollTop = 0;
    if (commentaryScrollRef.current) commentaryScrollRef.current.scrollTop = 0;
  }, [sim.logs, sim.commentary]);

  useEffect(() => {
    if (!sim.autoTriggerEnabled) return;
    const tick = setInterval(() => {
      sim.setAutoTriggerCountdown(prev => {
        if (prev <= 1) {
          if (!sim.isOrchestrating) sim.handleTrigger();
          return sim.AUTO_TRIGGER_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [sim.autoTriggerEnabled, sim.isOrchestrating]);

  const speakCommentary = (text: string, style: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayerClick = (p: PlayerPick) => {
      setModalContent({ 
        title: p.name, 
        body: `${p.name} (${p.role})\nAvg Runs: ${p.stats?.avgRuns || '-'}\nWickets: ${p.stats?.wickets || '-'}\nStrategic Value: High impact.` 
      });
  };

  return (
    <div className="relative z-10">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[1000] focus:px-4 focus:py-2 focus:bg-accent focus:text-bg focus:rounded-lg focus:font-bold">
        Skip to main content
      </a>
      <div className="noise-overlay" aria-hidden="true" />
      
      <Header 
        activeView={activeView} setActiveView={setActiveView} 
        autoTriggerEnabled={sim.autoTriggerEnabled} setAutoTriggerEnabled={sim.setAutoTriggerEnabled}
        autoTriggerCountdown={sim.autoTriggerCountdown} AUTO_TRIGGER_SECONDS={sim.AUTO_TRIGGER_SECONDS}
      />

      <div className="bg-bg-alt border-b border-border overflow-hidden py-2.5" role="region" aria-label="Live Match Ticker">
        <div className="flex animate-scroll whitespace-nowrap gap-12" aria-live="polite" aria-atomic="false">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-12 items-center">
              {sim.liveMatches.length > 0 ? (
                sim.liveMatches.map((m) => (
                  <div 
                    key={`${i}-${m.id}`} 
                    onClick={() => sim.setSelectedMatch(m)}
                    className="flex items-center gap-2 font-mono text-[11px] cursor-pointer hover:text-accent transition-colors group"
                  >
                    <span className="text-lg group-hover:scale-125 transition-transform">🏏</span> 
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

      <main id="main-content" className="container mx-auto px-4 py-8" role="main">
        {activeView === 'live' && (
          <>
            <section className="text-center mb-12">
              <Badge className="bg-accent/10 text-accent border-accent/20 mb-6 px-4 py-1.5 tracking-widest uppercase">
                ⚡ 9 Autonomous Agents · 4.8M Global Viewers
              </Badge>
              <h2 className="text-4xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
                The World's First <br />
                <span className="glowing-text">Agentic Cricket Brain</span>
              </h2>
            </section>

            <LiveScoreBar 
              liveMatches={sim.liveMatches} setLiveMatches={sim.setLiveMatches}
              selectedMatch={sim.selectedMatch} setSelectedMatch={sim.setSelectedMatch}
              businessMetrics={sim.businessMetrics} teamBatting={sim.teamBatting}
              runs={sim.runs} wickets={sim.wickets} balls={sim.balls}
              targetRuns={sim.targetRuns} teamBowling={sim.teamBowling} targetScoreStr={sim.targetScoreStr}
            />

            <AgentOrchestrator 
              isOrchestrating={sim.isOrchestrating} thinkingAgents={sim.thinkingAgents} agentProgress={sim.agentProgress}
              selectedEvent={sim.selectedEvent} setSelectedEvent={sim.setSelectedEvent}
              commentaryStyle={sim.commentaryStyle} setCommentaryStyle={sim.setCommentaryStyle}
              handleTrigger={sim.handleTrigger} speakCommentary={speakCommentary} resetSimulation={sim.resetSimulation}
            />

            <DashboardGrid 
              logs={sim.logs} logScrollRef={logScrollRef} activeTab={activeTab} setActiveTab={setActiveTab}
              teamBatting={sim.teamBatting} teamBowling={sim.teamBowling} winProb={sim.winProb}
              currentBatsman={sim.currentBatsman} currentBowler={sim.currentBowler}
              fantasyPicks={sim.fantasyPicks} isOrchestrating={sim.isOrchestrating}
              handlePlayerClick={handlePlayerClick} commentary={sim.commentary}
              commentaryScrollRef={commentaryScrollRef} insights={sim.insights} tweets={sim.tweets}
              squadData={sim.squadData}
            />
          </>
        )}

        {activeView === 'analytics' && (
          <AnalyticsView 
            winProbHistory={sim.winProbHistory} winProb={sim.winProb} teamBatting={sim.teamBatting} teamBowling={sim.teamBowling}
            fantasyPicks={sim.fantasyPicks} currentBatsman={sim.currentBatsman} currentBowler={sim.currentBowler}
            quiz={quiz.quiz} quizLoading={quiz.quizLoading} quizScore={quiz.quizScore} 
            currentQuestionIndex={quiz.currentQuestionIndex} showQuizResult={quiz.showQuizResult}
            selectedOption={quiz.selectedOption} isCorrect={quiz.isCorrect}
            handleOptionSelect={quiz.handleOptionSelect} loadQuiz={quiz.loadQuiz}
            squadData={sim.squadData}
          />
        )}

        {activeView === 'fantasy' && (
          <FantasyView 
            fantasyPicks={sim.fantasyPicks} handlePlayerClick={handlePlayerClick}
            handleRefreshFantasy={sim.handleRefreshFantasy} setModalContent={setModalContent}
            setActiveView={setActiveView} loadQuiz={quiz.loadQuiz}
            squadData={sim.squadData}
          />
        )}

        {activeView === 'broadcast' && (
          <BroadcastView setModalContent={setModalContent} />
        )}
      </main>

      <ChatUI 
        chatOpen={chatOpen} setChatOpen={setChatOpen} chatMessages={chatMessages}
        chatInput={chatInput} setChatInput={setChatInput} chatLoading={chatLoading}
        handleChatSend={handleChatSend} handleImageAnalysis={handleImageAnalysis}
        chatEndRef={chatEndRef}
      />

      <AnimatePresence>
        {modalContent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalContent(null)} className="absolute inset-0 bg-bg/90 backdrop-blur-lg" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-bg-card border border-border p-8 rounded-3xl">
              <button onClick={() => setModalContent(null)} className="absolute top-6 right-6"><X className="w-6 h-6" /></button>
              <h2 className="text-2xl font-black mb-4">{modalContent.title}</h2>
              <p className="text-text-muted text-sm">{modalContent.body}</p>
              <button onClick={() => setModalContent(null)} className="mt-8 w-full py-4 bg-accent text-bg font-head font-black rounded-xl">CLOSE</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-12 border-t border-border text-center" role="contentinfo">
        <div className="flex justify-center gap-6 mb-6">
          <button aria-label="Follow us on Twitter" className="focus-visible:ring-2 focus-visible:ring-accent outline-none">
            <Twitter className="w-5 h-5 text-accent cursor-pointer" />
          </button>
          <button aria-label="Visit our Website" className="focus-visible:ring-2 focus-visible:ring-accent outline-none">
            <Globe className="w-5 h-5 text-accent cursor-pointer" />
          </button>
          <button aria-label="Information" className="focus-visible:ring-2 focus-visible:ring-accent outline-none">
            <Info className="w-5 h-5 text-accent cursor-pointer" />
          </button>
        </div>
        <p className="text-[10px] font-mono text-text-muted uppercase tracking-[0.3em]">
          Powered by Google Gemini & Anthropic Claude
        </p>
      </footer>
    </div>
  );
}
