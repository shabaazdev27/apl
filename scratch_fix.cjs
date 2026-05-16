const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const correctCode = `  const handleTrigger = async () => {
    if (isOrchestrating) return;
    setIsOrchestrating(true);
    setAutoTriggerCountdown(AUTO_TRIGGER_SECONDS); // reset on manual trigger

    try {
      let newBalls = balls;
      if (selectedEvent !== MatchEvent.WIDE) {
        newBalls += 1;
        setBalls(newBalls);
      }

      // Agent flow
      const runAgent = async (id: string, duration: number, taskOverride?: string, doneMsg?: string) => {
        setThinkingAgents(prev => new Set(prev).add(id));
        setAgentProgress(prev => ({ ...prev, [id]: 0 }));
        
        const task = taskOverride || getAgentTask(id);`;

content = content.replace(
  `        
        const task = taskOverride || getAgentTask(id);`,
  correctCode
);

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed');
