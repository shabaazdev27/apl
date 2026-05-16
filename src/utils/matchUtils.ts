export const parseTeam = (str: string) => {
  const hasAsterisk = str.includes('*');
  let cleanStr = str.replace(/\*/g, '').trim();
  
  const overMatch = cleanStr.match(/\(?(\d+)(?:\.(\d+))?\s*ov\)?/i);
  let balls = 0;
  let overStr = '';
  if (overMatch) {
    overStr = overMatch[0];
    const overs = parseInt(overMatch[1], 10);
    const overBalls = overMatch[2] ? parseInt(overMatch[2], 10) : 0;
    balls = (overs * 6) + overBalls;
  }

  // Extract score (runs/wickets)
  const scoreMatch = cleanStr.match(/(\d+)\/(\d+)/) || cleanStr.match(/(\d+)\s+all\s+out/i) || cleanStr.match(/\s+(\d+)$/);
  
  let name = cleanStr;
  let scoreStr = '';
  let runs = 0;
  let wickets = 0;

  if (scoreMatch) {
    const rawScore = scoreMatch[0].trim();
    scoreStr = overStr ? `${rawScore} ${overStr}` : rawScore;
    
    // Name is everything before the score or overs
    const scoreIdx = cleanStr.indexOf(rawScore);
    const overIdx = overStr ? cleanStr.indexOf(overStr) : -1;
    const firstIdx = (scoreIdx !== -1 && overIdx !== -1) ? Math.min(scoreIdx, overIdx) : Math.max(scoreIdx, overIdx);
    
    if (firstIdx !== -1) {
      name = cleanStr.substring(0, firstIdx).trim();
    }
    
    if (scoreMatch[1] && scoreMatch[2]) {
      runs = parseInt(scoreMatch[1], 10);
      wickets = parseInt(scoreMatch[2], 10);
    } else if (scoreMatch[1]) {
      runs = parseInt(scoreMatch[1], 10);
      wickets = cleanStr.toLowerCase().includes('all out') ? 10 : 0;
    }
  }

  return { name, scoreStr, runs, wickets, balls, isBatting: hasAsterisk };
};

export const parseMatchTitle = (title: string) => {
  const separator = title.includes(' v ') ? ' v ' : title.toLowerCase().includes(' vs ') ? title.match(/ vs /i)?.[0] : null;
  if (!separator) return null;
  const parts = title.split(separator);
  if (parts.length !== 2) return null;
  return { team1: parseTeam(parts[0]), team2: parseTeam(parts[1]) };
};

export const getAbbr = (name: string) => {
  if (!name) return '???';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 3).toUpperCase();
  return parts.slice(0, 3).map(w => w[0]).join('').toUpperCase();
};
