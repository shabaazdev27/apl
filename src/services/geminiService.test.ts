import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCommentary, sendChatMessage } from './geminiService';

describe('geminiService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('generateCommentary returns generated text', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'What a shot!' })
    });

    const text = await generateCommentary({
      event: 'four',
      score: '10/0',
      target: '150',
      over: '1.2',
      batsman: 'Virat',
      bowler: 'Starc',
      style: 'en_harsha',
      matchContext: 'IND vs AUS'
    });
    expect(global.fetch).toHaveBeenCalled();
    expect(text).toBe('What a shot!');
  });

  it('sendChatMessage returns text', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'Hello!' })
    });

    const text = await sendChatMessage([{ role: 'user', content: 'Hi' }]);
    expect(text).toBe('Hello!');
  });

  it('sendChatMessage handles quota error gracefully', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Quota Exceeded' })
    });

    const text = await sendChatMessage([{ role: 'user', content: 'Hi' }]);
    expect(text).toBe('⚠️ Gemini quota exceeded or service unavailable. Please wait and retry.');
  });
});
