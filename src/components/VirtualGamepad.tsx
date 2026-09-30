import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause, RotateCcw } from 'lucide-react';

interface VirtualGamepadProps {
  onDirection: (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => void;
  onActionA?: () => void;
  actionALabel?: string;
  onActionB?: () => void;
  actionBLabel?: string;
  onTogglePause?: () => void;
  isPaused?: boolean;
  onRestart?: () => void;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({
  onDirection,
  onActionA,
  actionALabel = 'A',
  onActionB,
  actionBLabel = 'B',
  onTogglePause,
  isPaused,
  onRestart,
}) => {
  return (
    <div className="mt-4 w-full select-none rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* D-Pad Controls */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onDirection('UP');
            }}
            aria-label="Direction Up"
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 shadow-md active:bg-emerald-600 active:scale-95 transition-transform"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="my-1 flex gap-4">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onDirection('LEFT');
              }}
              aria-label="Direction Left"
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 shadow-md active:bg-emerald-600 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onDirection('DOWN');
              }}
              aria-label="Direction Down"
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 shadow-md active:bg-emerald-600 active:scale-95 transition-transform"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                onDirection('RIGHT');
              }}
              aria-label="Direction Right"
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 shadow-md active:bg-emerald-600 active:scale-95 transition-transform"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Control Utilities */}
        <div className="flex items-center gap-3">
          {onTogglePause && (
            <button
              type="button"
              onClick={onTogglePause}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800/80 text-xs font-mono text-zinc-300 hover:text-white active:bg-zinc-700"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}
          {onRestart && (
            <button
              type="button"
              onClick={onRestart}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800/80 text-xs font-mono text-zinc-300 hover:text-white active:bg-zinc-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Action Buttons (A / B) */}
        {(onActionA || onActionB) && (
          <div className="flex items-center gap-3">
            {onActionB && (
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onActionB();
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-600/50 bg-amber-500/20 font-mono text-sm font-bold text-amber-300 shadow-lg active:bg-amber-500 active:text-zinc-950 active:scale-95 transition-all"
                >
                  B
                </button>
                <span className="text-[10px] font-mono text-zinc-400">{actionBLabel}</span>
              </div>
            )}
            {onActionA && (
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onActionA();
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-500/20 font-mono text-sm font-bold text-emerald-300 shadow-lg active:bg-emerald-500 active:text-zinc-950 active:scale-95 transition-all"
                >
                  A
                </button>
                <span className="text-[10px] font-mono text-zinc-400">{actionALabel}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
