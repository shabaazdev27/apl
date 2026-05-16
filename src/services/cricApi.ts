export interface Match {
  id: string;
  title: string;
  url: string;
  description: string;
  matchId?: string;
  seriesId?: string;
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

