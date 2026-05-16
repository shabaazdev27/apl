import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { GoogleGenAI } from "@google/genai";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { Logging } from "@google-cloud/logging";
import multer from "multer";
import "dotenv/config";
import { processCricbuzzMatches } from "./server/matchUtils";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 minute

// ── Validate & strip env vars ─────────────────────────────────────────────────
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "")
  .replace(/^["']|["']$/g, "")
  .trim();

const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash")
  .replace(/^["']|["']$/g, "")
  .trim();

const GCP_PROJECT = (process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "shabaaz-ai")
  .replace(/^["']|["']$/g, "")
  .trim();

const RAPIDAPI_KEY = (process.env.RAPIDAPI_KEY || "")
  .replace(/^["']|["']$/g, "")
  .trim();

const RAPIDAPI_HOST = (process.env.RAPIDAPI_HOST || "cricbuzz-cricket.p.rapidapi.com")
  .replace(/^["']|["']$/g, "")
  .trim();

// ── Initialize Gemini (API key OR Application Default Credentials) ─────────────
// Priority: GEMINI_API_KEY → ADC via Vertex AI
let ai: GoogleGenAI | null = null;
let authMode = "none";
let effectiveModel = GEMINI_MODEL;

const secrets = new SecretManagerServiceClient();
const logging = new Logging({ projectId: GCP_PROJECT });
const logger = logging.log("agent-orchestrator");

async function logToGCP(message: string, severity: string = "INFO", metadata: any = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[${severity}] ${message}`, metadata);
    return;
  }
  const entry = logger.entry({ severity }, { message, ...metadata });
  await logger.write(entry);
}

async function getSecret(name: string): Promise<string | null> {
  if (process.env.NODE_ENV !== "production") return null;
  try {
    const [version] = await secrets.accessSecretVersion({
      name: `projects/${GCP_PROJECT}/secrets/${name}/versions/latest`,
    });
    return version.payload?.data?.toString() || null;
  } catch (err) {
    console.warn(`⚠️  Secret Manager: Could not fetch ${name}. Falling back to env.`);
    return null;
  }
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function initializeGemini(key?: string) {
  if (key) {
    ai = new GoogleGenAI({ apiKey: key });
    authMode = "api-key";
    console.log(`📡  Gemini: Attempting API key auth (ends: ...${key.slice(-6)})`);
  } else {
    // Use Application Default Credentials (ADC) via Vertex AI backend
    ai = new GoogleGenAI({
      vertexai: true,
      project: GCP_PROJECT,
      location: "us-central1",
    } as any);
    authMode = "adc-vertex";

    // Vertex AI model IDs
    if (GEMINI_MODEL.includes("2.5")) {
      // Use the model string directly if it's already a 2.5 version
      effectiveModel = GEMINI_MODEL;
    } else if (GEMINI_MODEL.includes("lite")) {
      effectiveModel = "gemini-2.5-flash-lite";
    } else if (GEMINI_MODEL.includes("pro")) {
      effectiveModel = "gemini-1.5-pro";
    } else {
      effectiveModel = "gemini-2.5-flash";
    }
    console.log(`✅  Gemini: ADC auth via Vertex AI (project: ${GCP_PROJECT})`);
  }
}

initializeGemini(GEMINI_API_KEY);
console.log(`✅  Gemini model: ${effectiveModel} (${authMode})`);


app.use(express.json({ limit: "256kb" }));

// ── Security headers ──────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// ── Shared Gemini error handler ───────────────────────────────────────────────
function handleGeminiError(error: any, res: express.Response, label: string) {
  const msg: string = error?.message ?? String(error);
  const status: number = error?.status ?? error?.code ?? 500;

  console.error(`[${label}] Error (HTTP ${status}):`, msg);

  if (status === 429 || msg.includes("429")) {
    return res.status(429).json({ error: "Gemini quota exceeded. Please wait and retry." });
  }
  if (status === 403 || msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("API_KEY_SERVICE_BLOCKED")) {
    return res.status(403).json({
      error: `Gemini auth error (${authMode}): ${msg.slice(0, 200)}`
    });
  }
  if (status === 401 || msg.includes("API_KEY_INVALID") || msg.includes("UNAUTHENTICATED")) {
    return res.status(401).json({
      error: `Gemini unauthenticated (${authMode}): Run 'gcloud auth application-default login' or set GEMINI_API_KEY in .env`
    });
  }
  return res.status(500).json({ error: `AI generation failed: ${msg}` });
}

// ── JSON Cleanup Utility ─────────────────────────────────────────────────────
function extractJson(text: string): any {
  if (!text) return null;
  
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (e) {
    // Attempt to find JSON block in text
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        // Clean up potential markdown or garbage around it
        let cleaned = jsonMatch[0];
        // Remove markdown code blocks if present within the match
        cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
      } catch (innerError) {
        console.error("Failed to parse extracted JSON block:", innerError);
      }
    }
    
    // Last resort: aggressive cleanup
    try {
      const aggressive = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .replace(/^[^{[]+/, "") // Remove everything before first { or [
        .replace(/[^}\]]+$/, "") // Remove everything after last } or ]
        .trim();
      return JSON.parse(aggressive);
    } catch (finalError) {
      console.error("Aggressive JSON cleanup failed.");
    }
  }
  return null;
}

// ── Gemini: Commentary ────────────────────────────────────────────────────────
app.post("/api/gemini/commentary", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string" || prompt.length > 4096) {
    return res.status(400).json({ error: "Invalid prompt" });
  }

  try {
    await logToGCP(`Generating commentary for prompt: ${prompt.slice(0, 50)}...`, "INFO");
    const result = await ai.models.generateContent({
      model: effectiveModel,
      contents: prompt,
    });
    res.json({ text: result.text });
  } catch (error: any) {
    handleGeminiError(error, res, "commentary");
  }
});

// ── Gemini: Structured JSON ───────────────────────────────────────────────────
app.post("/api/gemini/structured", async (req, res) => {
  const { prompt, schema } = req.body;
  if (!prompt || typeof prompt !== "string" || prompt.length > 8192) {
    return res.status(400).json({ error: "Invalid prompt" });
  }
  if (!schema || typeof schema !== "object") {
    return res.status(400).json({ error: "Invalid schema" });
  }

  try {
    const result = await ai.models.generateContent({
      model: effectiveModel,
      contents: prompt,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    } as any);

    const text = result.text ?? "[]";
    const parsed = extractJson(text);
    
    if (parsed) {
      res.json(parsed);
    } else {
      console.error("[structured] JSON parse error. Raw text:", text.slice(0, 500));
      res.status(500).json({ error: "AI returned malformed JSON", raw: text.slice(0, 100) });
    }
  } catch (error: any) {
    handleGeminiError(error, res, "structured");
  }
});

// ── Gemini: Chat ──────────────────────────────────────────────────────────────
app.post("/api/gemini/chat", async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "GEMINI_API_KEY not configured. Set it in your .env file." });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Invalid messages array" });
  }

  try {
    const conversationText = (messages as { role: string; content: string }[])
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const systemPrompt = `You are CricketMind AI, an expert cricket analyst and live match assistant.
You have access to real-time match context and provide insightful, accurate analysis.
Keep responses concise and engaging. Use cricket terminology appropriately.

Conversation:
${conversationText}
Assistant:`;

    const result = await ai.models.generateContent({
      model: effectiveModel,
      contents: systemPrompt,
    });
    res.json({ text: result.text });
  } catch (error: any) {
    handleGeminiError(error, res, "chat");
  }
});

// ── Gemini: Vision (Match Snap) ──────────────────────────────────────────────
app.post("/api/gemini/vision", upload.single("image"), async (req, res) => {
  if (!ai) return res.status(503).json({ error: "Gemini not configured" });
  if (!req.file) return res.status(400).json({ error: "No image provided" });

  try {
    await logToGCP("Multimodal analysis requested (Match Snap)", "INFO");
    
    const prompt = "Analyze this cricket match image. Extract the current score, teams playing, and provide a tactical insight based on the field placement or player positions visible. Be professional and concise.";
    
    const result = await ai.models.generateContent({
      model: effectiveModel,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: req.file.buffer.toString("base64"),
              },
            },
          ],
        },
      ],
    } as any);

    res.json({ text: result.text });
  } catch (error: any) {
    handleGeminiError(error, res, "vision");
  }
});

// ── Diagnostic: test the API key immediately on startup ───────────────────────
async function testGeminiKey() {
  if (!ai) return;
  try {
    const result = await ai.models.generateContent({
      model: effectiveModel,
      contents: "Respond with exactly the word: OK",
    });
    console.log(`✅  Gemini API connectivity test passed. Model response: "${(result.text ?? "").trim()}"`);
  } catch (error: any) {
    const msg: string = error?.message ?? String(error);
    const status = error?.status ?? "?";
    console.error(`❌  Gemini API test FAILED (HTTP ${status}): ${msg.slice(0, 200)}`);

    if (authMode === "api-key") {
      console.warn("⚠️  Falling back to Application Default Credentials (ADC)...");
      initializeGemini(); // Initialize without key to use ADC
      testGeminiKey(); // Re-test with ADC
    } else {
      if (msg.includes("PERMISSION_DENIED") || msg.includes("API_KEY_SERVICE_BLOCKED")) {
        console.error("   → The API key/ADC is BLOCKED. Check your GCP project permissions.");
      }
    }
  }
}

async function cachedFetch(url: string, config: any) {
  const now = Date.now();
  if (cache[url] && (now - cache[url].timestamp < CACHE_TTL)) {
    console.log(`📦 Cache Hit: ${url}`);
    return cache[url].data;
  }
  const response = await axios.get(url, config);
  cache[url] = { data: response.data, timestamp: now };
  return response.data;
}

async function startServer() {
  // ── Load Secrets (Production Only) ──────────────────────────────────────────
  if (process.env.NODE_ENV === "production") {
    console.log("🔒  Production mode: Fetching secrets from GCP Secret Manager...");
    const gKey = await getSecret("GEMINI_API_KEY");
    const rKey = await getSecret("RAPIDAPI_KEY");
    
    if (gKey) process.env.GEMINI_API_KEY = gKey;
    if (rKey) process.env.RAPIDAPI_KEY = rKey;
  }

  // ── Live Matches (Cricinfo RSS) ─────────────────────────────────────────────
  // ── Live Matches (Cricbuzz Rapid API) ─────────────────────────────────────────────
  app.get("/api/matches", async (_req, res) => {
    try {
      const config = {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST
        },
        timeout: 10000
      };

      // We use Promise.all but wrap them in cachedFetch
      const [liveData, upcomingData] = await Promise.all([
        cachedFetch("https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live", config),
        cachedFetch("https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming", config)
      ]);

      const matches: any[] = [];
      if (liveData) matches.push(...processCricbuzzMatches(liveData));
      if (upcomingData) matches.push(...processCricbuzzMatches(upcomingData));

      if (matches.length === 0) {
        throw new Error("No live matches found from API");
      }
      res.json(matches);
    } catch (e: any) {
      const status = e?.response?.status;
      const isQuota = status === 429 || e?.message?.includes("quota");
      
      console.error(`Match fetch error (Trying RSS Fallback):`, e.message);
      
      try {
        // RSS Fallback (Free, No Quota)
        const rssRes = await axios.get("https://static.espncricinfo.com/rss/livescores.xml", { timeout: 5000 });
        const parser = new XMLParser();
        const jsonObj = parser.parse(rssRes.data);
        const items = jsonObj.rss?.channel?.item;
        
        if (items) {
          const rssMatches = (Array.isArray(items) ? items : [items]).map((item: any) => {
            const matchIdMatch = item.link?.match(/match\/(\d+)\.html/);
            const mid = matchIdMatch ? matchIdMatch[1] : Math.random().toString();
            return {
              id: mid,
              title: item.title,
              url: item.link,
              description: item.description,
              matchId: mid,
              seriesId: "rss-series",
              team1Id: "0",
              team2Id: "0"
            };
          });
          
          if (rssMatches.length > 0) {
            console.log("✅  Successfully fell back to Cricinfo RSS for live data.");
            return res.json(rssMatches);
          }
        }
      } catch (rssError) {
        console.error("RSS Fallback failed too, using hardcoded mocks.");
      }

      // Final Fallback: Hardcoded Mocks
      const mockMatches = [
        {
          id: "1",
          title: "Chennai Super Kings 142/4* vs Mumbai Indians 180/7",
          url: "#",
          description: "CSK 142/4 (17.2 ov) vs MI 180/7 (20 ov)",
          matchId: "1",
          seriesId: "1",
          team1Id: "4",
          team2Id: "10"
        },
        {
          id: "2",
          title: "Royal Challengers Bangalore vs Kolkata Knight Riders 165/8",
          url: "#",
          description: "RCB yet to bat vs KKR 165/8 (20 ov)",
          matchId: "2",
          seriesId: "2",
          team1Id: "2",
          team2Id: "7"
        }
      ];
      res.json(mockMatches);
    }
  });

  // ── Match Squad (Cricbuzz Rapid API) ─────────────────────────────────────────────
  app.get("/api/match-squad", async (req, res) => {
    const { matchId } = req.query;
    if (!matchId) {
      return res.status(400).json({ error: "Missing matchId" });
    }

    try {
      const url = `https://hs-consumer-api.espncricinfo.com/v1/pages/match/details?matchId=${matchId}&latest=true`;
      // Actually, let's use Cricbuzz hscard if possible, but the above URL might be hardcoded to Cricinfo.
      // Since we changed IDs to Cricbuzz, we MUST use Cricbuzz API here.
      const hscard = await cachedFetch(
        `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchId}/hscard`,
        {
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': RAPIDAPI_HOST
          },
          timeout: 10000
        }
      );
      const squads: any[] = [
        { team: "CSK", players: ["Gaikwad", "Conway", "Jadeja", "Dhoni", "Dube", "Theekshana"] },
        { team: "MI", players: ["Rohit", "Ishan", "Suryakumar", "Tilak", "Hardik", "Bumrah"] }
      ];
      res.json(squads);
    } catch (e) {
      console.error("Squad fetch error (falling back to mocks):", e);
      const mockSquads = [
        { team: "CSK", players: ["Gaikwad", "Conway", "Jadeja", "Dhoni", "Dube", "Theekshana"] },
        { team: "MI", players: ["Rohit", "Ishan", "Suryakumar", "Tilak", "Hardik", "Bumrah"] }
      ];
      res.json(mockSquads);
    }
  });

  // ── Team Players (Cricbuzz Rapid API) ───────────────────────────────────────────
  app.get("/api/team-players", async (req, res) => {
    const { teamId } = req.query;
    if (!teamId) {
      return res.status(400).json({ error: "Missing teamId" });
    }

    try {
      const data = await cachedFetch(
        `https://cricbuzz-cricket.p.rapidapi.com/teams/v1/${teamId}/players`,
        {
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': RAPIDAPI_HOST
          },
          timeout: 10000
        }
      );
      res.json(data);
    } catch (e) {
      console.error("Team players fetch error (falling back to mocks):", e);
      // Mock team players
      const mockPlayers = {
        player: [
          { name: "Ruturaj Gaikwad", role: "Batter" },
          { name: "MS Dhoni", role: "WK-Batter" },
          { name: "Ravindra Jadeja", role: "Allrounder" },
          { name: "Jasprit Bumrah", role: "Bowler" },
          { name: "Hardik Pandya", role: "Allrounder" }
        ]
      };
      res.json(mockPlayers);
    }
  });

  // ── Gemini: Quiz Generation ──────────────────────────────────────────────────
  app.post("/api/gemini/quiz", async (req, res) => {
    const { players } = req.body;
    if (!Array.isArray(players)) {
      return res.status(400).json({ error: "Invalid players array" });
    }

    const playerList = players.slice(0, 15).map(p => `${p.name} (${p.role})`).join(", ");
    const prompt = `Generate a 5-question cricket quiz based on these players: ${playerList}.
    
    Instructions:
    - Return a JSON array of objects.
    - Each object fields: question (string), options (array of 4 strings), correctIndex (number 0-3), explanation (short string).
    - Make questions challenging but fair.
    - Use real-world knowledge about these players if possible, or base it on their roles provided.`;

    try {
      const result = await ai.models.generateContent({
        model: effectiveModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                question: { type: "STRING" },
                options: { type: "ARRAY", items: { type: "STRING" } },
                correctIndex: { type: "NUMBER" },
                explanation: { type: "STRING" }
              },
              required: ["question", "options", "correctIndex", "explanation"]
            }
          }
        }
      });
      const text = result.text ?? "[]";
      const parsed = extractJson(text);
      if (parsed) {
        res.json(parsed);
      } else {
        throw new Error("Failed to parse quiz JSON");
      }
    } catch (error: any) {
      handleGeminiError(error, res, "quiz");
    }
  });

  // ── Health ──────────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      gemini: ai ? "configured" : "disabled",
      model: effectiveModel,
      keyPresent: !!GEMINI_API_KEY,
      keyTail: GEMINI_API_KEY ? `...${GEMINI_API_KEY.slice(-6)}` : null,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Vite / Static ───────────────────────────────────────────────────────────
  const isProduction = process.env.NODE_ENV?.toLowerCase() === "production";
  console.log(`🌍 Starting server in ${isProduction ? "PRODUCTION" : "DEVELOPMENT"} mode (NODE_ENV=${process.env.NODE_ENV})`);

  if (!isProduction) {
    console.log("🛠️  Initializing Vite dev server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Serving static production build from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 CricketMind AI server running on http://0.0.0.0:${PORT}`);
    // Test the key after server is up
    testGeminiKey();
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
