export interface PlayerStats {
  avgRuns: number;
  wickets: number;
  strikeRate: number;
  economy: number;
  form: number;
  consistency: number;
}

export async function getPlayerStats(playerName: string): Promise<PlayerStats> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock data based on player name (using simple hash for consistency)
  const seed = playerName.length;
  return {
    avgRuns: Math.floor(30 + (seed * 2) % 20),
    wickets: Math.floor((seed * 3) % 10),
    strikeRate: 120 + (seed * 5) % 40,
    economy: 6 + (seed % 4) + (seed % 10) / 10,
    form: 60 + (seed * 7) % 35,
    consistency: 50 + (seed * 9) % 45
  };
}
