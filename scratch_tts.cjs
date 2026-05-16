const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const ttsCode = `
const speakCommentary = (text: string, style: string) => {
  if (!('speechSynthesis' in window)) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  
  if (style === 'ta') {
    utterance.lang = 'ta-IN';
  } else if (style === 'hi') {
    utterance.lang = 'hi-IN';
  } else if (style === 'en_bbc') {
    utterance.lang = 'en-GB';
    utterance.pitch = 0.9;
    utterance.rate = 0.95;
  } else if (style === 'en_shastri') {
    utterance.lang = 'en-IN';
    utterance.pitch = 1.2;
    utterance.rate = 1.1;
  } else {
    utterance.lang = 'en-IN';
  }
  
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang === utterance.lang);
  if (voice) {
    utterance.voice = voice;
  }
  
  window.speechSynthesis.speak(utterance);
};

export default function App() {`;

content = content.replace('export default function App() {', ttsCode);

const replaceThen = `      }).then(text => {
        if (text) {
          speakCommentary(text, commentaryStyle);
          setCommentary(prev => [{ id: Math.random().toString(), ball: overStr, text, type: selectedEvent }, ...prev].slice(0, 10));`;

content = content.replace(/      \}\)\.then\(text => \{\s*if \(text\) \{\s*setCommentary\(prev => \[\{ id: Math\.random\(\)\.toString\(\), ball: overStr, text, type: selectedEvent \}, \.\.\.prev\]\.slice\(0, 10\)\);/m, replaceThen);

// Replace rickroll with cricket video
content = content.replace('dQw4w9WgXcQ', 'q1sR7H1A8w0');

fs.writeFileSync('src/App.tsx', content);
console.log('Done');
