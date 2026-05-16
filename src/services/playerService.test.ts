import { describe, it, expect } from 'vitest';
import { getPlayerStats } from './playerService';

describe('playerService', () => {
  it('returns valid player stats', async () => {
    const stats = await getPlayerStats('Virat');
    expect(stats.avgRuns).toBeTypeOf('number');
    expect(stats.wickets).toBeTypeOf('number');
    expect(stats.strikeRate).toBeTypeOf('number');
  });

  it('returns consistent stats for the same name length', async () => {
    const stats1 = await getPlayerStats('Rohit');
    const stats2 = await getPlayerStats('Dhoni');
    // Both have length 5
    expect(stats1).toEqual(stats2);
  });
});
