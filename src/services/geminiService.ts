import { Type } from "@google/genai";

async function callGeminiProxy(endpoint: string, body: any) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    if (response.status === 429) {
      console.warn(`Gemini Quota Exceeded (429) on ${endpoint}`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Gemini Proxy Error (${endpoint}):`, error);
    return null;
  }
}

export async function generateCommentary(context: {
  event: string;
  score: string;
  target: string;
  over: string;
  batsman: string;
  bowler: string;
  style: string;
  matchContext?: string;
}) {
  const prompt = `
    You are a professional cricket commentator. 
    Context:
    - Match: ${context.matchContext || 'CSK vs MI'}
    - Event: ${context.event}
    - Current Score: ${context.score}
    - Target: ${context.target}
    - Over: ${context.over}
    - Batsman: ${context.batsman}
    - Bowler: ${context.bowler}
    - Style: ${context.style}

    Instructions:
    - Generate ONE sentence of high-energy, insightful live commentary.
    - If the style is "Harsha", be poetic and storytelling.
    - If the style is "Shastri", be loud, dramatic, and use punchy phrases.
    - If the style is "BBC", be dry, witty, and precise.
    - Avoid cliches. Be specific to the match situation.
    - Output only the commentary text. No preamble.
  `;

  const data = await callGeminiProxy("/api/gemini/commentary", { prompt });
  return data?.text || "The atmosphere is electric here!";
}

export async function generateInsights(context: {
  matchTitle: string;
  matchDescription?: string;
  score: string;
  overs: string;
}) {
  const prompt = `Generate 3 high-level tactical cricket insights for the match: ${context.matchTitle}.
    Match Details: ${context.matchDescription || 'N/A'}
    Current Score: ${context.score} at ${context.overs} overs.
    
    Instructions:
    - Provide insights as a JSON array of objects.
    - Fields: id (string), type ('hot', 'warn', 'purple'), badge ('TACTIC', 'ALERT', 'MOMENTUM'), text (string).
    - Be specific to the teams and players mentioned in the details.`;

  return await callGeminiProxy("/api/gemini/structured", {
    prompt,
    schema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          badge: { type: Type.STRING },
          text: { type: Type.STRING },
        }
      }
    }
  });
}

export async function generateSentiment(context: {
  matchTitle: string;
  matchDescription?: string;
}) {
  const prompt = `Generate 4 realistic high-engagement tweets/social posts (short, use hashtags) for the match: ${context.matchTitle}.
    Context: ${context.matchDescription || 'N/A'}
    Include variety in sentiment.
    Provide them as a JSON array of objects with fields: handle (e.g. @cricket_fan_123), text, and sentiment ('pos', 'neg', 'neu').`;

  return await callGeminiProxy("/api/gemini/structured", {
    prompt,
    schema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          handle: { type: Type.STRING },
          text: { type: Type.STRING },
          sentiment: { type: Type.STRING },
        }
      }
    }
  });
}

export async function generateFantasyXI(context: {
  matchTitle: string;
  matchDescription?: string;
  score?: string;
  overs?: string;
  squadInfo?: string;
}) {
  const prompt = `Generate a performance-optimized 6-player Fantasy Team with calculated projected points for the following cricket match:
    Title: ${context.matchTitle}
    Current Situation: ${context.matchDescription || 'N/A'}
    Live Score: ${context.score || 'N/A'} at ${context.overs || 'N/A'} overs.
    ${context.squadInfo ? `Verified Squad/Playing XI Info: ${context.squadInfo}` : ''}

    Instructions:
    1. Use REAL players that are part of these specific squads. 
    2. Analyze the current live score and match situation to adjust points (pts). 
    3. If squadInfo is provided, ONLY pick players from that list.
    4. For each player, provide:
       - id: a unique string
       - name: Full name of the player
       - pts: Predicted fantasy points for the REMAINING match (integer between 10 and 100)
       - role: One of 'BAT', 'BOWL', 'ALL', 'WK'
       - isCaptain: Exactly one player should be true
       - isVC: Exactly one different player should be true
       - initials: 2 or 3 character initials
    
    Output as a valid JSON array.`;

  return await callGeminiProxy("/api/gemini/structured", {
    prompt,
    schema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          pts: { type: Type.NUMBER },
          role: { type: Type.STRING },
          isCaptain: { type: Type.BOOLEAN },
          isVC: { type: Type.BOOLEAN },
          initials: { type: Type.STRING },
        }
      }
    }
  });
}

