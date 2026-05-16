import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

const app = express();
const PORT = 3000;

// Initialize Gemini
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI(process.env.GEMINI_API_KEY) : null;

app.use(express.json());

// --- Gemini Proxy Routes ---

app.post("/api/gemini/commentary", async (req, res) => {
  if (!ai) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  try {
    const { prompt } = req.body;
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("429")) {
      console.warn("Gemini Quota Exceeded (429)");
      return res.status(429).json({ error: "Quota exceeded" });
    }
    console.error("Gemini Commentary Error:", error);
    res.status(500).json({ error: "AI Generation failed" });
  }
});

app.post("/api/gemini/structured", async (req, res) => {
  if (!ai) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  try {
    const { prompt, schema } = req.body;
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json(JSON.parse(response.text()));
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("429")) {
      console.warn("Gemini Quota Exceeded (429)");
      return res.status(429).json({ error: "Quota exceeded" });
    }
    console.error("Gemini Structured Error:", error);
    res.status(500).json({ error: "AI Generation failed" });
  }
});

async function startServer() {

  // Endpoint to fetch live matches from Cricinfo RSS
  app.get("/api/matches", async (req, res) => {
    try {
      const response = await axios.get("http://static.cricinfo.com/rss/livescores.xml", { timeout: 10000 });
      const parser = new XMLParser();
      const obj = parser.parse(response.data);
      
      let items = [];
      if (obj?.rss?.channel?.item) {
        const parsedItems = Array.isArray(obj.rss.channel.item) 
          ? obj.rss.channel.item 
          : [obj.rss.channel.item];
        
        items = parsedItems.map((item: any) => {
          const matchIdMatch = item.link?.match(/game\/(\d+)/);
          const seriesIdMatch = item.link?.match(/series\/(\d+)/);
          return {
            id: item.guid || item.link || Math.random().toString(),
            title: item.title,
            url: item.link,
            description: item.description,
            matchId: matchIdMatch?.[1],
            seriesId: seriesIdMatch?.[1]
          };
        });
      }
      
      res.json(items);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch live matches." });
    }
  });

  // Fetch squad/XI for a specific match
  app.get("/api/match-squad", async (req, res) => {
    const { seriesId, matchId } = req.query;
    if (!seriesId || !matchId) return res.status(400).json({ error: "Missing IDs" });

    try {
      // Use Cricinfo's consumer API
      const url = `https://hs-consumer-api.espncricinfo.com/v1/pages/match/details?seriesId=${seriesId}&matchId=${matchId}&latest=true`;
      const response = await axios.get(url, { timeout: 10000 });
      
      const squads = response.data?.content?.matchDetails?.teams?.map((team: any) => ({
        team: team.team.name,
        players: team.players?.map((p: any) => p.player.longName) || []
      })) || [];

      res.json(squads);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch squad info." });
    }
  });

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
