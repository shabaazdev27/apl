import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('./services/cricApi', () => ({
  getCurrentMatches: vi.fn().mockResolvedValue([]),
  getMatchSquad: vi.fn().mockResolvedValue([])
}));

describe('App Component', () => {
  it('renders main title', async () => {
    render(<App />);
    await waitFor(() => {
      const titleElements = screen.getAllByText(/Cricket/i);
      expect(titleElements.length).toBeGreaterThan(0);
    });
  });

  it('renders live view by default', async () => {
    render(<App />);
    await waitFor(() => {
      const heroText = screen.getByText(/Agentic Cricket Brain/i);
      expect(heroText).toBeInTheDocument();
    });
  });
});
