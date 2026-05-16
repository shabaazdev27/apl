import { describe, it, expect } from 'vitest';
import { AGENTS, FANTASY_PICKS, EVENT_MAP, INITIAL_TWEETS } from './constants';
import { MatchEvent } from './types';

describe('constants', () => {
  it('AGENTS has correct structure', () => {
    expect(AGENTS.length).toBeGreaterThan(0);
    expect(AGENTS[0]).toHaveProperty('id');
    expect(AGENTS[0]).toHaveProperty('name');
  });

  it('FANTASY_PICKS has captain and vc', () => {
    expect(FANTASY_PICKS.some(p => p.isCaptain)).toBe(true);
    expect(FANTASY_PICKS.some(p => p.isVC)).toBe(true);
  });

  it('EVENT_MAP contains definitions for match events', () => {
    expect(EVENT_MAP[MatchEvent.SIX]).toContain('SIX');
  });

  it('INITIAL_TWEETS has correct structure', () => {
    expect(INITIAL_TWEETS.length).toBeGreaterThan(0);
    expect(INITIAL_TWEETS[0]).toHaveProperty('handle');
    expect(INITIAL_TWEETS[0]).toHaveProperty('sentiment');
  });
});
