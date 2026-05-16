import React from 'react';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
  autoTriggerEnabled: boolean;
  setAutoTriggerEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  autoTriggerCountdown: number;
  AUTO_TRIGGER_SECONDS: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  autoTriggerEnabled,
  setAutoTriggerEnabled,
  autoTriggerCountdown,
  AUTO_TRIGGER_SECONDS
}) => {
  return (
    <header className="sticky top-0 bg-bg/90 backdrop-blur-md border-b border-border z-50 py-4">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(0,229,160,0.4)]">
            🏏
          </div>
          <h1 className="text-xl font-bold tracking-tighter">
            Cricket<span className="text-accent underline decoration-accent/30 underline-offset-4">Mind</span> AI
          </h1>
        </div>

        <nav className="flex items-center gap-1 bg-bg-card/50 p-1 rounded-full border border-border">
          {['live', 'analytics', 'fantasy', 'broadcast'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-mono transition-all capitalize ${activeView === view ? 'bg-accent text-bg font-bold shadow-lg' : 'text-text-muted hover:text-white'
                }`}
            >
              {view}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2.5 px-3 py-1.5 border rounded-full cursor-pointer transition-all select-none"
            style={{
              background: autoTriggerEnabled ? 'rgba(0,229,160,0.08)' : 'rgba(255,255,255,0.03)',
              borderColor: autoTriggerEnabled ? 'rgba(0,229,160,0.3)' : 'rgba(255,255,255,0.1)'
            }}
            onClick={() => setAutoTriggerEnabled(v => !v)}
            title={autoTriggerEnabled ? 'Auto-trigger ON — click to pause' : 'Auto-trigger OFF — click to enable'}
          >
            <div className="relative w-5 h-5 shrink-0">
              <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                {autoTriggerEnabled && (
                  <circle
                    cx="10" cy="10" r="8"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="2"
                    strokeDasharray="50.3"
                    strokeDashoffset={50.3 - (50.3 * (1 - autoTriggerCountdown / AUTO_TRIGGER_SECONDS))}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-1.5 h-1.5 rounded-full ${autoTriggerEnabled ? 'bg-accent live-dot' : 'bg-text-muted'}`} />
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: autoTriggerEnabled ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
              {autoTriggerEnabled ? `AUTO ${autoTriggerCountdown}s` : 'AUTO OFF'}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-danger/10 border border-danger/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <span className="text-[10px] font-mono text-danger font-bold uppercase tracking-wider">Agents Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
