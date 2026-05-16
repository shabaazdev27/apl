import { Type } from "@google/genai";

// ── Internal proxy helper ────────────────────────────────────────────────────

async function callGeminiProxy(endpoint: string, body: object): Promise<any> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Surface the server's error message to the caller
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      const errorMsg = errorData?.error ?? `HTTP ${response.status}`;
      console.error(`Gemini Proxy Error (${endpoint}) [${response.status}]:`, errorMsg);
      // Return null for quota errors (graceful degradation), throw for key errors
      if (response.status === 429) return null;
      if (response.status === 403 || response.status === 401) {
        throw new Error(errorMsg);
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Gemini Proxy Error (${endpoint}):`, error);
    throw error; // Re-throw so callers can show the real message
  }
}

// ── Commentary ────────────────────────────────────────────────────────────────

export interface CommentaryContext {
  event: string;
  score: string;
  target: string;
  over: string;
  batsman: string;
  bowler: string;
  style: string;
  matchContext?: string;
}

export async function generateCommentary(
  context: CommentaryContext
): Promise<string> {
  const prompt = `You are a professional cricket commentator.
Context:
- Match: ${context.matchContext || "CSK vs MI"}
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
- Avoid clichés. Be specific to the match situation.
- Output only the commentary text. No preamble.`;

  const data = await callGeminiProxy("/api/gemini/commentary", { prompt });
  return data?.text || "The atmosphere is electric here!";
}

// ── Insights ──────────────────────────────────────────────────────────────────

export interface InsightsContext {
  matchTitle: string;
  matchDescription?: string;
  score: string;
  overs: string;
}

export async function generateInsights(context: InsightsContext) {
  const prompt = `Generate 3 high-level tactical cricket insights for the match: ${context.matchTitle}.
Match Details: ${context.matchDescription || "N/A"}
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
        },
      },
    },
  });
}

// ── Sentiment / Social ────────────────────────────────────────────────────────

export interface SentimentContext {
  matchTitle: string;
  matchDescription?: string;
}

export async function generateSentiment(context: SentimentContext) {
  const prompt = `Generate 4 realistic high-engagement tweets/social posts (short, use hashtags) for the match: ${context.matchTitle}.
Context: ${context.matchDescription || "N/A"}
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
        },
      },
    },
  });
}

// ── Fantasy XI ────────────────────────────────────────────────────────────────

export interface FantasyXIContext {
  matchTitle: string;
  matchDescription?: string;
  score?: string;
  overs?: string;
  squadInfo?: string;
}

export async function generateFantasyXI(context: FantasyXIContext) {
  const prompt = `Generate a performance-optimized 6-player Fantasy Team with calculated projected points for the following cricket match:
Title: ${context.matchTitle}
Current Situation: ${context.matchDescription || "N/A"}
Live Score: ${context.score || "N/A"} at ${context.overs || "N/A"} overs.
${context.squadInfo ? `Verified Squad/Playing XI Info: ${context.squadInfo}` : ""}

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
        },
      },
    },
  });
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export async function generateQuiz(players: any[]): Promise<QuizQuestion[]> {
  const data = await callGeminiProxy("/api/gemini/quiz", { players });
  return data || [];
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendChatMessage(
  messages: ChatMessage[]
): Promise<string> {
  try {
    const data = await callGeminiProxy("/api/gemini/chat", { messages });
    if (!data) return "⚠️ Gemini quota exceeded or service unavailable. Please wait and retry.";
    return data?.text ?? "No response received.";
  } catch (error: any) {
    const msg: string = error?.message ?? String(error);
    // Return a helpful message based on the error type
    if (msg.includes("blocked") || msg.includes("PERMISSION_DENIED")) {
      return "⚠️ Gemini API key is blocked or expired. Please get a new key from https://aistudio.google.com/app/apikey and update your .env file, then restart the server with `npm run dev`.";
    }
    if (msg.includes("invalid") || msg.includes("INVALID")) {
      return "⚠️ Gemini API key is invalid. Please check your GEMINI_API_KEY in the .env file.";
    }
    if (msg.includes("not configured")) {
      return "⚠️ GEMINI_API_KEY is not set. Add your key to the .env file and restart with `npm run dev`.";
    }
    return `⚠️ ${msg}`;
  }
}

// ── Vision (Match Snap) ───────────────────────────────────────────────────────

export async function analyzeMatchImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/gemini/vision", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to analyze image");
  }

  const data = await response.json();
  return data.text;
}
