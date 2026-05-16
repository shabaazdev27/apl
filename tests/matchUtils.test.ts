import { describe, it, expect, vi } from 'vitest';
import { processCricbuzzMatches } from '../server/matchUtils';

describe('Server Utils', () => {
  it('should process cricbuzz match data correctly', () => {
    const mockData = {
      typeMatches: [{
        seriesMatches: [{
          seriesAdWrapper: {
            matches: [{
              matchInfo: {
                matchId: '123',
                seriesId: '456',
                team1: { teamId: 1, teamName: 'CSK' },
                team2: { teamId: 2, teamName: 'MI' },
                matchDesc: 'Final'
              },
              matchScore: {
                team1Score: { inngs1: { runs: 150, wickets: 5, overs: 20 } },
                team2Score: { inngs1: { runs: 140, wickets: 8, overs: 19.2 } }
              }
            }]
          }
        }]
      }]
    };
    
    const processed = processCricbuzzMatches(mockData);
    expect(processed.length).toBe(1);
    expect(processed[0].title).toContain('CSK');
    expect(processed[0].title).toContain('MI');
    expect(processed[0].team1Id).toBe('1');
  });

  it('should handle missing match info gracefully', () => {
    const mockData = {
      typeMatches: [{
        seriesMatches: [{
          seriesAdWrapper: {
            matches: [{
              matchInfo: {
                // Missing matchId, seriesId, teamId
                team1: { teamName: 'CSK' },
                team2: { teamName: 'MI' }
              }
            }]
          }
        }]
      }]
    };
    
    const processed = processCricbuzzMatches(mockData);
    expect(processed.length).toBe(1);
    expect(processed[0].id).toBe("");
    expect(processed[0].team1Id).toBeUndefined();
  });
});
