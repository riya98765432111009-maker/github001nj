import React, { useState, useEffect } from 'react';
import { GameId, GameInfo } from './types/game';
import { Header } from './components/Header';
import { CRTFilter } from './components/CRTFilter';
import { SnakeGame } from './components/games/SnakeGame';
import { TetrisGame } from './components/games/TetrisGame';
import { MiniMarioGame } from './components/games/MiniMarioGame';
import { BounceBallGame } from './components/games/BounceBallGame';
import { GameIdeasLab } from './components/ideas/GameIdeasLab';
import { sound } from './utils/audio';
import { Sparkles, Trophy, Play, Keyboard } from 'lucide-react';

import snakePoster from './assets/images/arcade_snake_poster_1790752293733.jpg';
import tetrisPoster from './assets/images/arcade_tetris_poster_1790752311315.jpg';
import marioPoster from './assets/images/arcade_platformer_poster_1790752334010.jpg';
import bouncePoster from './assets/images/arcade_breaker_poster_1790752351316.jpg';

const GAMES_CATALOG: GameInfo[] = [
  {
    id: 'snake',
    title: 'Neon Snake',
    subtitle: 'Classic Grid Navigation',
    year: '1976 / 1997',
    genre: 'Arcade Reflex',
    image: snakePoster,
    description: 'Consume glowing apples and golden bonus bugs. Avoid colliding with walls and your own growing tail.',
    controlsSummary: 'Arrow keys / WASD to steer',
  },
  {
    id: 'tetris',
    title: 'Tetra Fall',
    subtitle: 'Geometric Block Puzzle',
    year: '1984',
    genre: 'Falling Block Puzzle',
    image: tetrisPoster,
    description: 'Arrange falling tetrominoes into complete horizontal lines. Features hold piece and ghost drop projections.',
    controlsSummary: '← → to shift · ↑ to rotate · Space to hard drop · C to hold',
  },
  {
    id: 'mario',
    title: 'Mini Mario Runner',
    subtitle: '2D Side-Scrolling Adventure',
    year: '1985',
    genre: 'Platformer',
    image: marioPoster,
    description: 'Sprint across pipes, punch mystery ? blocks for coins and mushrooms, stomp Goombas, and slide down the flagpole.',
    controlsSummary: 'A / D or ← → to run · Space / W / ↑ to jump',
  },
  {
    id: 'bounce',
    title: 'Bounce Ball (Arkanoid)',
    subtitle: 'High-Impact Brick Breaker',
    year: '1986',
    genre: 'Ball Physics',
    image: bouncePoster,
    description: 'Deflect bouncing energy spheres off your paddle, trigger chain TNT explosions, and collect Laser / Multi-ball drops.',
    controlsSummary: 'Mouse or ← → to steer · Space / Click to fire lasers',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<GameId>('snake');
  const [isMuted, setIsMuted] = useState<boolean>(!sound.enabled);
  const [crtFilterEnabled, setCrtFilterEnabled] = useState<boolean>(false);

  // Global hotkeys to switch games: 1, 2, 3, 4, 5
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '1') setActiveTab('snake');
      if (e.key === '2') setActiveTab('tetris');
      if (e.key === '3') setActiveTab('mario');
      if (e.key === '4') setActiveTab('bounce');
      if (e.key === '5') setActiveTab('ideas');
      if (e.key === 'm' || e.key === 'M') {
        const nextState = sound.toggleMute();
        setIsMuted(!nextState);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  const handleToggleMute = () => {
    const nextState = sound.toggleMute();
    setIsMuted(!nextState);
  };

  const handleToggleCrt = () => {
    setCrtFilterEnabled((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* CRT Scanline & Phosphor screen shader effect */}
      <CRTFilter enabled={crtFilterEnabled} />

      {/* Top Bar Contract (3 zones) */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        crtFilterEnabled={crtFilterEnabled}
        onToggleCrt={handleToggleCrt}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Game Switcher Carousel / Shelf */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-zinc-400">
            <span>Arcade Vault Roster</span>
            <div className="hidden sm:flex items-center gap-1.5 text-zinc-500">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Press 1–5 to switch games anytime</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {GAMES_CATALOG.map((game, idx) => {
              const isActive = activeTab === game.id;
              return (
                <button
                  key={game.id}
                  onClick={() => setActiveTab(game.id)}
                  className={`group relative text-left rounded-xl overflow-hidden border transition-all cursor-pointer ${
                    isActive
                      ? 'border-emerald-500/80 bg-zinc-900 shadow-lg ring-1 ring-emerald-500/50'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80'
                  }`}
                >
                  {/* Poster Image with fallback */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-900">
                    <img
                      src={game.image}
                      alt={game.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    <div className="absolute top-2 left-2 text-[10px] font-mono text-zinc-400 bg-black/60 px-1.5 py-0.5 rounded">
                      [0{idx + 1}]
                    </div>
                  </div>

                  {/* Card Title & unboxed metadata */}
                  <div className="p-3">
                    <h4 className="font-semibold text-sm text-zinc-100 group-hover:text-emerald-300 transition-colors truncate">
                      {game.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 mt-1">
                      <span>{game.year}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{game.genre}</span>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* 5th Card: Classic Game Ideas & Architecture Lab */}
            <button
              onClick={() => setActiveTab('ideas')}
              className={`group relative text-left rounded-xl overflow-hidden border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                activeTab === 'ideas'
                  ? 'border-purple-500/80 bg-zinc-900 shadow-lg ring-1 ring-purple-500/50'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80'
              }`}
            >
              <div className="aspect-[16/9] w-full bg-gradient-to-br from-purple-950/80 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center p-3 relative">
                <Sparkles className="w-7 h-7 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono text-purple-300 tracking-wider uppercase">
                  Explore 12+ Concepts
                </span>
                <div className="absolute top-2 left-2 text-[10px] font-mono text-zinc-400 bg-black/60 px-1.5 py-0.5 rounded">
                  [05]
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm text-zinc-100 group-hover:text-purple-300 transition-colors truncate">
                  Ideas & Concept Lab
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 mt-1">
                  <span>Architecture</span>
                  <span aria-hidden="true">·</span>
                  <span>GDD Generator</span>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Active View Container */}
        <section className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl relative">
          {activeTab === 'snake' && <SnakeGame />}
          {activeTab === 'tetris' && <TetrisGame />}
          {activeTab === 'mario' && <MiniMarioGame />}
          {activeTab === 'bounce' && <BounceBallGame />}
          {activeTab === 'ideas' && <GameIdeasLab />}
        </section>
      </main>

      {/* Footer conforming to Universal Design Constitution (quiet copyright & credits, no fake metrics) */}
      <footer className="w-full border-t border-zinc-800/80 bg-zinc-950 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <div>
            <span>RetroVault Arcade</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Pure HTML5 Canvas & Web Audio API</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Zero Plugins Required</span>
            <span aria-hidden="true">·</span>
            <span>Local High Score Persistence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
