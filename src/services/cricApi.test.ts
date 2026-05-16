import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentMatches, getMatchSquad } from './cricApi';

describe('cricApi', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('getCurrentMatches fetches matches successfully', async () => {
    const mockMatches = [{ id: '1', title: 'IND vs AUS' }];
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockMatches
    });

    const matches = await getCurrentMatches();
    expect(global.fetch).toHaveBeenCalledWith('/api/matches');
    expect(matches).toEqual(mockMatches);
  });

  it('getCurrentMatches throws error on failure', async () => {
    (global.fetch as any).mockResolvedValue({ ok: false });
    await expect(getCurrentMatches()).rejects.toThrow('Failed to fetch');
  });

  it('getMatchSquad fetches squad successfully', async () => {
    const mockSquad = { team: 'IND', players: ['Virat'] };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockSquad
    });

    const squad = await getMatchSquad('s1', 'm1');
    expect(global.fetch).toHaveBeenCalledWith('/api/match-squad?seriesId=s1&matchId=m1');
    expect(squad).toEqual(mockSquad);
  });

  it('getMatchSquad returns null on failure', async () => {
    (global.fetch as any).mockResolvedValue({ ok: false });
    const squad = await getMatchSquad('s1', 'm1');
    expect(squad).toBeNull();
  });
});
