import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Trophy, Sparkles, Shield, Compass } from 'lucide-react';
import { sound } from '../../utils/audio';
import { VirtualGamepad } from '../VirtualGamepad';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Point {
  x: number;
  y: number;
}

interface BonusItem extends Point {
  timer: number;
  maxTimer: number;
}

const GRID_SIZE = 22;

export const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 11 },
    { x: 10, y: 12 },
    { x: 10, y: 13 },
  ]);
  const [direction, setDirection] = useState<Direction>('UP');
  const [food, setFood] = useState<Point>({ x: 10, y: 5 });
  const [bonus, setBonus] = useState<BonusItem | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('retrovault_hs_snake') || '0', 10);
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedLevel, setSpeedLevel] = useState<'chill' | 'classic' | 'turbo'>('classic');
  const [wrapWalls, setWrapWalls] = useState<boolean>(false);
  const [foodCount, setFoodCount] = useState<number>(0);

  // References to keep game loop in sync with freshest state
  const stateRef = useRef({
    snake,
    direction,
    food,
    bonus,
    score,
    isPlaying,
    isGameOver,
    isPaused,
    speedLevel,
    wrapWalls,
    foodCount,
  });

  useEffect(() => {
    stateRef.current = {
      snake,
      direction,
      food,
      bonus,
      score,
      isPlaying,
      isGameOver,
      isPaused,
      speedLevel,
      wrapWalls,
      foodCount,
    };
  }, [snake, direction, food, bonus, score, isPlaying, isGameOver, isPaused, speedLevel, wrapWalls, foodCount]);

  const nextDirectionRef = useRef<Direction>('UP');

  // Spawn random food not on snake
  const generateRandomPoint = useCallback((currentSnake: Point[]): Point => {
    let newPoint: Point;
    let collision: boolean;
    do {
      newPoint = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      collision = currentSnake.some((seg) => seg.x === newPoint.x && seg.y === newPoint.y);
    } while (collision);
    return newPoint;
  }, []);

  const resetGame = () => {
    const initialSnake: Point[] = [
      { x: 10, y: 11 },
      { x: 10, y: 12 },
      { x: 10, y: 13 },
    ];
    setSnake(initialSnake);
    setDirection('UP');
    nextDirectionRef.current = 'UP';
    setFood(generateRandomPoint(initialSnake));
    setBonus(null);
    setScore(0);
    setFoodCount(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    sound.playBeep(520, 0.08, 'sine');
  };

  const changeDirection = useCallback((newDir: Direction) => {
    const current = stateRef.current.direction;
    if (
      (newDir === 'UP' && current !== 'DOWN') ||
      (newDir === 'DOWN' && current !== 'UP') ||
      (newDir === 'LEFT' && current !== 'RIGHT') ||
      (newDir === 'RIGHT' && current !== 'LEFT')
    ) {
      nextDirectionRef.current = newDir;
      sound.playBeep(240, 0.02, 'triangle', 0.05);
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        changeDirection('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        changeDirection('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        changeDirection('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        changeDirection('RIGHT');
      } else if (e.key === 'p' || e.key === 'P') {
        if (stateRef.current.isPlaying && !stateRef.current.isGameOver) {
          setIsPaused((prev) => !prev);
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (!stateRef.current.isPlaying || stateRef.current.isGameOver) {
          resetGame();
        } else {
          setIsPaused((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection]);

  // Main game tick loop
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) return;

    const ms = speedLevel === 'chill' ? 120 : speedLevel === 'classic' ? 85 : 55;

    const timer = setInterval(() => {
      const {
        snake: curSnake,
        food: curFood,
        bonus: curBonus,
        score: curScore,
        wrapWalls: isWrap,
        foodCount: curFoodCount,
      } = stateRef.current;

      const curDir = nextDirectionRef.current;
      setDirection(curDir);

      const head = curSnake[0];
      const newHead: Point = { ...head };

      if (curDir === 'UP') newHead.y -= 1;
      if (curDir === 'DOWN') newHead.y += 1;
      if (curDir === 'LEFT') newHead.x -= 1;
      if (curDir === 'RIGHT') newHead.x += 1;

      // Wall collision check
      if (isWrap) {
        if (newHead.x < 0) newHead.x = GRID_SIZE - 1;
        if (newHead.x >= GRID_SIZE) newHead.x = 0;
        if (newHead.y < 0) newHead.y = GRID_SIZE - 1;
        if (newHead.y >= GRID_SIZE) newHead.y = 0;
      } else {
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          sound.playHit();
          setIsGameOver(true);
          setIsPlaying(false);
          return;
        }
      }

      // Self collision
      if (curSnake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
        sound.playHit();
        setIsGameOver(true);
        setIsPlaying(false);
        return;
      }

      const newSnake = [newHead, ...curSnake];
      let gainedScore = 0;
      let nextFood = curFood;
      let nextBonus = curBonus;
      let nextCount = curFoodCount;

      // Handle bonus countdown
      if (nextBonus) {
        if (nextBonus.timer <= 1) {
          nextBonus = null;
        } else {
          nextBonus = { ...nextBonus, timer: nextBonus.timer - 1 };
        }
      }

      // Check eating food
      if (newHead.x === curFood.x && newHead.y === curFood.y) {
        gainedScore += 10;
        nextCount += 1;
        sound.playCoin();
        nextFood = generateRandomPoint(newSnake);

        // Every 4 foods, spawn golden bonus bug
        if (nextCount % 4 === 0 && !nextBonus) {
          const bp = generateRandomPoint([...newSnake, nextFood]);
          nextBonus = { ...bp, timer: 45, maxTimer: 45 };
          sound.playBeep(680, 0.08, 'square', 0.15);
        }
      } else if (nextBonus && newHead.x === nextBonus.x && newHead.y === nextBonus.y) {
        gainedScore += 50;
        sound.playPowerup();
        nextBonus = null;
      } else {
        // Did not eat food, trim tail
        newSnake.pop();
      }

      if (gainedScore > 0) {
        const updatedScore = curScore + gainedScore;
        setScore(updatedScore);
        if (updatedScore > highScore) {
          setHighScore(updatedScore);
          localStorage.setItem('retrovault_hs_snake', updatedScore.toString());
        }
      }

      setFood(nextFood);
      setBonus(nextBonus);
      setFoodCount(nextCount);
      setSnake(newSnake);
    }, ms);

    return () => clearInterval(timer);
  }, [isPlaying, isPaused, isGameOver, speedLevel, highScore, generateRandomPoint]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellSize = width / GRID_SIZE;

    // Background dark arena
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width, i * cellSize);
      ctx.stroke();
    }

    // Border perimeter
    ctx.strokeStyle = wrapWalls ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Render Food (Pulsing Apple)
    const time = Date.now() / 200;
    const pulse = Math.sin(time) * 1.5;
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 2.6 + pulse,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Food leaf highlight
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(
      food.x * cellSize + cellSize / 2 - 1,
      food.y * cellSize + 2,
      3,
      3
    );

    // Render Bonus Star Bug
    if (bonus) {
      const remainingRatio = bonus.timer / bonus.maxTimer;
      ctx.fillStyle = '#eab308';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(
        bonus.x * cellSize + cellSize / 2,
        bonus.y * cellSize + cellSize / 2,
        cellSize / 2.3,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      // Countdown ring around bonus
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        bonus.x * cellSize + cellSize / 2,
        bonus.y * cellSize + cellSize / 2,
        cellSize / 1.8,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * remainingRatio
      );
      ctx.stroke();
    }

    // Render Snake Body
    snake.forEach((seg, index) => {
      const isHead = index === 0;
      const x = seg.x * cellSize;
      const y = seg.y * cellSize;

      if (isHead) {
        // Glowing Neon Head
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes based on direction
        ctx.fillStyle = '#022c22';
        const eyeOffset = 4;
        let eye1X = x + eyeOffset;
        let eye1Y = y + eyeOffset;
        let eye2X = x + cellSize - eyeOffset;
        let eye2Y = y + eyeOffset;

        if (direction === 'DOWN') {
          eye1Y = y + cellSize - eyeOffset;
          eye2Y = y + cellSize - eyeOffset;
        } else if (direction === 'LEFT') {
          eye1X = x + eyeOffset;
          eye1Y = y + eyeOffset;
          eye2X = x + eyeOffset;
          eye2Y = y + cellSize - eyeOffset;
        } else if (direction === 'RIGHT') {
          eye1X = x + cellSize - eyeOffset;
          eye1Y = y + eyeOffset;
          eye2X = x + cellSize - eyeOffset;
          eye2Y = y + cellSize - eyeOffset;
        }

        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, 1.8, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Gradient green tail
        const ratio = 1 - index / snake.length;
        const alpha = Math.max(0.4, ratio);
        ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, 3);
        ctx.fill();
      }
    });
  }, [snake, food, bonus, direction, wrapWalls]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Top Game Bar - Clean unboxed metadata with separators */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-zinc-900/70 border border-zinc-800 rounded-xl mb-4 text-sm font-mono">
        <div className="flex items-center gap-3 text-zinc-300">
          <div>
            <span className="text-zinc-500 mr-1.5">Score</span>
            <span className="text-lg font-bold text-emerald-400 tabular-nums">{score}</span>
          </div>
          <span className="text-zinc-700" aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-500 mr-1.5">Best</span>
            <span className="font-semibold text-amber-400 tabular-nums">{highScore}</span>
          </div>
          <span className="text-zinc-700" aria-hidden="true">·</span>
          <div>
            <span className="text-zinc-500 mr-1.5">Length</span>
            <span className="tabular-nums text-zinc-200">{snake.length}</span>
          </div>
        </div>

        {/* Mode & Speed Settings */}
        <div className="flex items-center gap-2">
          {/* Walls Mode Toggle */}
          <button
            onClick={() => setWrapWalls((prev) => !prev)}
            title="Toggle wall collision behavior"
            className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1 ${
              wrapWalls
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>{wrapWalls ? 'Wrap Arena' : 'Solid Walls'}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center p-0.5 bg-zinc-800/80 rounded border border-zinc-700 text-xs">
            <button
              onClick={() => setSpeedLevel('chill')}
              className={`px-2 py-0.5 rounded transition-colors ${
                speedLevel === 'chill' ? 'bg-emerald-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Chill
            </button>
            <button
              onClick={() => setSpeedLevel('classic')}
              className={`px-2 py-0.5 rounded transition-colors ${
                speedLevel === 'classic' ? 'bg-emerald-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setSpeedLevel('turbo')}
              className={`px-2 py-0.5 rounded transition-colors ${
                speedLevel === 'turbo' ? 'bg-emerald-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Turbo
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Viewport with Overlays */}
      <div className="relative w-full max-w-[460px] aspect-square rounded-2xl overflow-hidden border-2 border-zinc-800 bg-[#090d16] shadow-2xl flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={440}
          height={440}
          className="w-full h-full block cursor-pointer"
          onClick={() => {
            if (!isPlaying || isGameOver) resetGame();
          }}
        />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
              <Play className="w-6 h-6 text-emerald-400 fill-emerald-400 ml-0.5" />
            </div>
            <h3 className="font-mono text-xl font-bold text-white mb-1">NEON SNAKE</h3>
            <p className="text-xs text-zinc-400 max-w-xs mb-5">
              Consume energy apples, grab golden bonus stars, and navigate without colliding.
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-sm rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              START GAME (SPACE)
            </button>
            <span className="text-[11px] text-zinc-500 font-mono mt-3">Controls: Arrow keys / WASD / D-Pad</span>
          </div>
        )}

        {/* Pause Overlay */}
        {isPlaying && isPaused && !isGameOver && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <h3 className="font-mono text-xl font-bold text-amber-300 mb-2">GAME PAUSED</h3>
            <button
              onClick={() => setIsPaused(false)}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-semibold text-xs rounded-lg shadow-md active:scale-95 transition-all cursor-pointer"
            >
              RESUME (P)
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <span className="text-xs font-mono tracking-widest text-rose-500 mb-1">CRASH DETECTED</span>
            <h3 className="font-mono text-2xl font-bold text-white mb-2">GAME OVER</h3>
            <div className="text-zinc-400 text-xs font-mono mb-5 flex items-center gap-3">
              <span>Final Score: <strong className="text-emerald-400 text-sm">{score}</strong></span>
              <span>·</span>
              <span>Best: <strong className="text-amber-400 text-sm">{highScore}</strong></span>
            </div>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-sm rounded-lg shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>
          </div>
        )}
      </div>

      {/* On-screen controls */}
      <VirtualGamepad
        onDirection={changeDirection}
        onTogglePause={() => {
          if (isPlaying && !isGameOver) setIsPaused((p) => !p);
        }}
        isPaused={isPaused}
        onRestart={resetGame}
      />
    </div>
  );
};
