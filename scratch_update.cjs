const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace handlePlayerClick
content = content.replace(
  'const handlePlayerClick = (p: PlayerPick) => {',
  `const handlePlayerClick = async (p: PlayerPick) => {
      setModalContent({ title: p.name, body: \`Fetching detailed analysis for \${p.name}...\` });
      try {
        const response = await fetch('/api/gemini/commentary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: \`Provide a detailed 3-sentence tactical analysis for cricket player \${p.name} (\${p.role}) including their differential strategy and predicted strategic value. Start with "Differential Strategy: \${p.name}".\` })
        });
        const data = await response.json();
        setModalContent({ title: p.name, body: data.text || \`\${p.name} represents high strategic value.\` });
      } catch (err) {
        setModalContent({ title: p.name, body: 'Failed to fetch details.' });
      }
  };
  const oldHandlePlayerClick = (p: PlayerPick) => {`
);

// Replace broadcast iframe
content = content.replace(
  '<div className="text-center relative z-10">',
  `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1" title="Broadcast" frameBorder="0" allow="autoplay; encrypted-media" className="absolute inset-0 w-full h-full object-cover z-20"></iframe>
  <div className="text-center relative z-10 pointer-events-none opacity-0">`
);

fs.writeFileSync('src/App.tsx', content);
console.log('Done');
