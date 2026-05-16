export interface Match {
  id: string;
  title: string;
  url: string;
  description: string;
  matchId?: string;
  seriesId?: string;
  team1Id?: string;
  team2Id?: string;
  team1?: {
    name: string;
    runs?: number;
    wickets?: number;
    overs?: string;
    isBatting?: boolean;
  };
  team2?: {
    name: string;
    runs?: number;
    wickets?: number;
    overs?: string;
    isBatting?: boolean;
  };
  status?: string;
}

export async function getCurrentMatches(): Promise<Match[]> {
  try {
    const res = await fetch("/api/matches");
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getMatchSquad(seriesId: string, matchId: string): Promise<any> {
  try {
    const res = await fetch(`/api/match-squad?seriesId=${seriesId}&matchId=${matchId}`);
    if (!res.ok) throw new Error("Failed to fetch squad");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}
export async function getTeamPlayers(teamId: string): Promise<any> {
  try {
    const res = await fetch(`/api/team-players?teamId=${teamId}`);
    if (!res.ok) throw new Error("Failed to fetch team players");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}
