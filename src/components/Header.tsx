import React from 'react';
import { Volume2, VolumeX, Monitor, Sparkles } from 'lucide-react';
import { GameId } from '../types/game';

interface HeaderProps {
  activeTab: GameId;
  onSelectTab: (tab: GameId) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  crtFilterEnabled: boolean;
  onToggleCrt: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isMuted,
  onToggleMute,
  crtFilterEnabled,
  onToggleCrt,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text wordmark */}
        <button
          onClick={() => onSelectTab('snake')}
          className="text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-sm"
        >
          <span className="font-mono text-xl font-bold tracking-wider text-emerald-400 transition-colors group-hover:text-emerald-300">
            RETROVAULT
          </span>
        </button>

        {/* Zone 2: 4-6 clean navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2 lg:gap-6 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => onSelectTab('snake')}
            className={`whitespace-nowrap px-2.5 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'snake'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Snake
          </button>
          <button
            onClick={() => onSelectTab('tetris')}
            className={`whitespace-nowrap px-2.5 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'tetris'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Tetra Fall
          </button>
          <button
            onClick={() => onSelectTab('mario')}
            className={`whitespace-nowrap px-2.5 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'mario'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Mini Mario
          </button>
          <button
            onClick={() => onSelectTab('bounce')}
            className={`whitespace-nowrap px-2.5 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'bounce'
                ? 'text-rose-400 border-b-2 border-rose-400'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Bounce Ball
          </button>
          <button
            onClick={() => onSelectTab('ideas')}
            className={`whitespace-nowrap px-2.5 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'ideas'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Classic Ideas Lab</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCrt}
            title={crtFilterEnabled ? 'Disable CRT Scanlines' : 'Enable CRT Scanlines'}
            aria-label="Toggle CRT Screen Scanlines"
            className={`p-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 border ${
              crtFilterEnabled
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">CRT {crtFilterEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute 8-Bit Audio' : 'Mute 8-Bit Audio'}
            aria-label="Toggle Sound"
            className={`p-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 border ${
              !isMuted
                ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'SFX'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
