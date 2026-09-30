import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Trophy, ArrowDown, RefreshCw } from 'lucide-react';
import { sound } from '../../utils/audio';
import { VirtualGamepad } from '../VirtualGamepad';

const COLS = 10;
const ROWS = 20;

type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

interface TetrominoDef {
  shape: number[][];
  color: string;
  glow: string;
}

const TETROMINOES: Record<TetrominoType, TetrominoDef> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#06b6d4', // Cyan
    glow: '#0891b2',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#3b82f6', // Blue
    glow: '#2563eb',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f97316', // Orange
    glow: '#ea580c',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#eab308', // Yellow
    glow: '#ca8a04',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#10b981', // Green
    glow: '#059669',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a855f7', // Purple
    glow: '#9333ea',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#ef4444', // Red
    glow: '#dc2626',
  },
};

const TETROMINO_KEYS: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

interface Piece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
}

export const TetrisGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [grid, setGrid] = useState<string[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(''))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPieceType, setNextPieceType] = useState<TetrominoType>('T');
  const [holdPieceType, setHoldPieceType] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState<boolean>(true);

  const [score, setScore] = useState<number>(0);
  const [lines, setLines] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('retrovault_hs_tetris') || '0', 10);
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Synchronized state reference for the tick loop
  const stateRef = useRef({
    grid,
    currentPiece,
    nextPieceType,
    holdPieceType,
    canHold,
    score,
    lines,
    level,
    isPlaying,
    isPaused,
    isGameOver,
  });

  useEffect(() => {
    stateRef.current = {
      grid,
      currentPiece,
      nextPieceType,
      holdPieceType,
      canHold,
      score,
      lines,
      level,
      isPlaying,
      isPaused,
      isGameOver,
    };
  }, [
    grid,
    currentPiece,
    nextPieceType,
    holdPieceType,
    canHold,
    score,
    lines,
    level,
    isPlaying,
    isPaused,
    isGameOver,
  ]);

  const getRandomPieceType = (): TetrominoType => {
    const idx = Math.floor(Math.random() * TETROMINO_KEYS.length);
    return TETROMINO_KEYS[idx];
  };

  const createPiece = (type: TetrominoType): Piece => {
    const def = TETROMINOES[type];
    const shape = def.shape.map((row) => [...row]);
    const startX = Math.floor((COLS - shape[0].length) / 2);
    return {
      type,
      shape,
      x: startX,
      y: 0,
    };
  };

  // Check collision of piece with grid
  const checkCollision = (piece: Piece, testGrid: string[][]): boolean => {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] !== 0) {
          const newX = piece.x + c;
          const newY = piece.y + r;

          // Out of bounds
          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }
          // Hit locked block
          if (newY >= 0 && testGrid[newY][newX] !== '') {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Calculate Ghost Piece (drop shadow projection)
  const getGhostPiece = (piece: Piece, testGrid: string[][]): Piece => {
    const ghost = {
      ...piece,
      shape: piece.shape.map((r) => [...r]),
    };
    while (!checkCollision({ ...ghost, y: ghost.y + 1 }, testGrid)) {
      ghost.y += 1;
    }
    return ghost;
  };

  // Rotate matrix 90 degrees clockwise
  const rotateMatrix = (matrix: number[][]): number[][] => {
    const N = matrix.length;
    const result: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        result[j][N - 1 - i] = matrix[i][j];
      }
    }
    return result;
  };

  const resetGame = () => {
    const freshGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
    const firstType = getRandomPieceType();
    const secondType = getRandomPieceType();
    const firstPiece = createPiece(firstType);

    setGrid(freshGrid);
    setCurrentPiece(firstPiece);
    setNextPieceType(secondType);
    setHoldPieceType(null);
    setCanHold(true);
    setScore(0);
    setLines(0);
    setLevel(1);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    sound.playBeep(440, 0.08, 'sine');
  };

  // Lock piece into grid & clear complete lines
  const lockPiece = useCallback((piece: Piece) => {
    const { grid: curGrid, nextPieceType: curNext, score: curScore, lines: curLines, level: curLevel } =
      stateRef.current;

    const newGrid = curGrid.map((row) => [...row]);
    const color = TETROMINOES[piece.type].color;

    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] !== 0) {
          const gy = piece.y + r;
          const gx = piece.x + c;
          if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
            newGrid[gy][gx] = color;
          }
        }
      }
    }

    sound.playBeep(260, 0.04, 'square', 0.1);

    // Check full lines
    let clearedCount = 0;
    const filteredGrid = newGrid.filter((row) => {
      const isFull = row.every((cell) => cell !== '');
      if (isFull) clearedCount += 1;
      return !isFull;
    });

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(''));
    }

    let addedScore = 10; // placement points
    if (clearedCount > 0) {
      if (clearedCount === 1) addedScore += 100 * curLevel;
      else if (clearedCount === 2) addedScore += 300 * curLevel;
      else if (clearedCount === 3) addedScore += 500 * curLevel;
      else if (clearedCount >= 4) addedScore += 800 * curLevel;

      if (clearedCount >= 4) {
        sound.playPowerup();
      } else {
        sound.playClear();
      }
    }

    const updatedLines = curLines + clearedCount;
    const updatedLevel = Math.floor(updatedLines / 10) + 1;
    const updatedScore = curScore + addedScore;

    setGrid(filteredGrid);
    setScore(updatedScore);
    setLines(updatedLines);
    setLevel(updatedLevel);

    if (updatedScore > highScore) {
      setHighScore(updatedScore);
      localStorage.setItem('retrovault_hs_tetris', updatedScore.toString());
    }

    // Spawn next piece
    const nextPiece = createPiece(curNext);
    const newNextType = getRandomPieceType();

    if (checkCollision(nextPiece, filteredGrid)) {
      // Game Over
      sound.playGameOver();
      setIsGameOver(true);
      setIsPlaying(false);
      setCurrentPiece(null);
    } else {
      setCurrentPiece(nextPiece);
      setNextPieceType(newNextType);
      setCanHold(true);
    }
  }, [highScore]);

  // Move current piece horizontally
  const moveHorizontal = useCallback((dir: number) => {
    const { currentPiece: curPiece, grid: curGrid, isPlaying: playing, isPaused: paused, isGameOver: over } =
      stateRef.current;
    if (!playing || paused || over || !curPiece) return;

    const testPiece: Piece = {
      ...curPiece,
      x: curPiece.x + dir,
    };

    if (!checkCollision(testPiece, curGrid)) {
      setCurrentPiece(testPiece);
      sound.playBeep(200, 0.02, 'triangle', 0.03);
    }
  }, []);

  // Rotate current piece with wall kick attempts
  const rotatePiece = useCallback(() => {
    const { currentPiece: curPiece, grid: curGrid, isPlaying: playing, isPaused: paused, isGameOver: over } =
      stateRef.current;
    if (!playing || paused || over || !curPiece) return;

    const newShape = rotateMatrix(curPiece.shape);
    const kicks = [0, -1, 1, -2, 2];

    for (const kick of kicks) {
      const testPiece: Piece = {
        ...curPiece,
        shape: newShape,
        x: curPiece.x + kick,
      };
      if (!checkCollision(testPiece, curGrid)) {
        setCurrentPiece(testPiece);
        sound.playBeep(320, 0.03, 'sine', 0.08);
        return;
      }
    }
  }, []);

  // Drop current piece down 1 step
  const dropStep = useCallback(() => {
    const { currentPiece: curPiece, grid: curGrid, isPlaying: playing, isPaused: paused, isGameOver: over } =
      stateRef.current;
    if (!playing || paused || over || !curPiece) return;

    const testPiece: Piece = {
      ...curPiece,
      y: curPiece.y + 1,
    };

    if (!checkCollision(testPiece, curGrid)) {
      setCurrentPiece(testPiece);
    } else {
      lockPiece(curPiece);
    }
  }, [lockPiece]);

  // Hard Drop: drop instantly to bottom
  const hardDrop = useCallback(() => {
    const { currentPiece: curPiece, grid: curGrid, isPlaying: playing, isPaused: paused, isGameOver: over } =
      stateRef.current;
    if (!playing || paused || over || !curPiece) return;

    const ghost = getGhostPiece(curPiece, curGrid);
    lockPiece(ghost);
  }, [lockPiece]);

  // Hold current piece
  const holdPiece = useCallback(() => {
    const {
      currentPiece: curPiece,
      holdPieceType: curHold,
      canHold: allowed,
      nextPieceType: curNext,
      isPlaying: playing,
      isPaused: paused,
      isGameOver: over,
    } = stateRef.current;

    if (!playing || paused || over || !curPiece || !allowed) return;

    sound.playBeep(380, 0.05, 'triangle', 0.1);

    if (curHold === null) {
      setHoldPieceType(curPiece.type);
      setCurrentPiece(createPiece(curNext));
      setNextPieceType(getRandomPieceType());
    } else {
      const prevHold = curHold;
      setHoldPieceType(curPiece.type);
      setCurrentPiece(createPiece(prevHold));
    }
    setCanHold(false);
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveHorizontal(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveHorizontal(1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        dropStep();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        rotatePiece();
      } else if (e.key === ' ') {
        if (!stateRef.current.isPlaying || stateRef.current.isGameOver) {
          resetGame();
        } else {
          hardDrop();
        }
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') {
        holdPiece();
      } else if (e.key === 'p' || e.key === 'P') {
        if (stateRef.current.isPlaying && !stateRef.current.isGameOver) {
          setIsPaused((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveHorizontal, dropStep, rotatePiece, hardDrop, holdPiece]);

  // Main gravity drop timer
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) return;

    // Drop speed based on level: level 1 is 800ms, decreases down to 100ms
    const intervalTime = Math.max(100, 800 - (level - 1) * 65);

    const timer = setInterval(() => {
      dropStep();
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, isPaused, isGameOver, level, dropStep]);

  // Draw main board
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellW = width / COLS;
    const cellH = height / ROWS;

    // Background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, width, height);

    // Matrix grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellH);
      ctx.lineTo(width, r * cellH);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellW, 0);
      ctx.lineTo(c * cellW, height);
      ctx.stroke();
    }

    // Draw locked blocks in grid
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = grid[r][c];
        if (color) {
          drawBlock(ctx, c * cellW, r * cellH, cellW, cellH, color, false);
        }
      }
    }

    // Draw Ghost Piece
    if (currentPiece && isPlaying && !isGameOver) {
      const ghost = getGhostPiece(currentPiece, grid);
      const ghostColor = TETROMINOES[ghost.type].color;
      for (let r = 0; r < ghost.shape.length; r++) {
        for (let c = 0; c < ghost.shape[r].length; c++) {
          if (ghost.shape[r][c] !== 0) {
            const gx = (ghost.x + c) * cellW;
            const gy = (ghost.y + r) * cellH;
            ctx.strokeStyle = ghostColor;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(gx + 2, gy + 2, cellW - 4, cellH - 4);
          }
        }
      }
    }

    // Draw Active Piece
    if (currentPiece && isPlaying && !isGameOver) {
      const color = TETROMINOES[currentPiece.type].color;
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c] !== 0) {
            const px = (currentPiece.x + c) * cellW;
            const py = (currentPiece.y + r) * cellH;
            drawBlock(ctx, px, py, cellW, cellH, color, true);
          }
        }
      }
    }
  }, [grid, currentPiece, isPlaying, isGameOver]);

  // Helper to render stylized 3D bevel block
  const drawBlock = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    glow: boolean
  ) => {
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
    }
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.shadowBlur = 0;

    // Bevel highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.fillRect(x + 1, y + 1, w - 2, 2);
    ctx.fillRect(x + 1, y + 1, 2, h - 2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x + 1, y + h - 3, w - 2, 2);
    ctx.fillRect(x + w - 3, y + 1, 2, h - 2);
  };

  // Draw Next & Hold Previews
  useEffect(() => {
    const drawMiniPiece = (canvas: HTMLCanvasElement | null, type: TetrominoType | null) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!type) return;
      const def = TETROMINOES[type];
      const shape = def.shape;
      const cellSize = 16;
      const startX = (canvas.width - shape[0].length * cellSize) / 2;
      const startY = (canvas.height - shape.length * cellSize) / 2;

      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] !== 0) {
            drawBlock(
              ctx,
              startX + c * cellSize,
              startY + r * cellSize,
              cellSize,
              cellSize,
              def.color,
              false
            );
          }
        }
      }
    };

    drawMiniPiece(nextCanvasRef.current, nextPieceType);
    drawMiniPiece(holdCanvasRef.current, holdPieceType);
  }, [nextPieceType, holdPieceType]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Top Header Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-zinc-900/70 border border-zinc-800 rounded-xl mb-4 text-sm font-mono">
        <div className="flex items-center gap-3 text-zinc-300">
          <div>
            <span className="text-zinc-500 mr-1.5">Score</span>
            <span className="text-lg font-bold text-cyan-400 tabular-nums">{score}</span>
          </div>
          <span className="text-zinc-700" aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-500 mr-1.5">Best</span>
            <span className="font-semibold text-amber-400 tabular-nums">{highScore}</span>
          </div>
          <span className="text-zinc-700" aria-hidden="true">·</span>
          <div>
            <span className="text-zinc-500 mr-1.5">Lines</span>
            <span className="tabular-nums text-zinc-200">{lines}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-zinc-400">
            <span>Level </span>
            <span className="font-bold text-cyan-300">{level}</span>
          </div>
          <button
            onClick={() => {
              if (isPlaying && !isGameOver) setIsPaused((p) => !p);
            }}
            disabled={!isPlaying || isGameOver}
            className="px-2.5 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40"
          >
            {isPaused ? 'Resume' : 'Pause (P)'}
          </button>
        </div>
      </div>

      {/* Game Layout: Hold Panel, Center Matrix, Next Panel */}
      <div className="flex items-start justify-center gap-3 sm:gap-6 w-full">
        {/* Hold Piece Sidebar */}
        <div className="hidden sm:flex flex-col items-center gap-2 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl w-24">
          <span className="text-[11px] font-mono font-semibold text-zinc-400">HOLD (C)</span>
          <canvas
            ref={holdCanvasRef}
            width={72}
            height={60}
            className="bg-black/40 rounded border border-zinc-800/80"
          />
          <button
            onClick={holdPiece}
            disabled={!isPlaying || !canHold}
            className="w-full mt-1 py-1 text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded text-zinc-300"
          >
            Swap
          </button>
        </div>

        {/* Center Playing Matrix */}
        <div className="relative w-[280px] sm:w-[320px] aspect-[10/20] rounded-xl overflow-hidden border-2 border-zinc-700 bg-[#080c14] shadow-2xl">
          <canvas
            ref={canvasRef}
            width={320}
            height={640}
            className="w-full h-full block cursor-pointer"
            onClick={() => {
              if (!isPlaying || isGameOver) resetGame();
            }}
          />

          {/* Start Overlay */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
                <Play className="w-6 h-6 text-cyan-400 fill-cyan-400 ml-0.5" />
              </div>
              <h3 className="font-mono text-xl font-bold text-white mb-1">TETRA FALL</h3>
              <p className="text-xs text-zinc-400 max-w-xs mb-5">
                Drop blocks, rotate shapes, clear lines, and aim for a high scoring Tetris combo!
              </p>
              <button
                onClick={resetGame}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono font-bold text-sm rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                START GAME (SPACE)
              </button>
              <span className="text-[11px] text-zinc-500 font-mono mt-3">
                Space = Drop · C = Hold · ↑ = Rotate
              </span>
            </div>
          )}

          {/* Pause Overlay */}
          {isPlaying && isPaused && !isGameOver && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <h3 className="font-mono text-xl font-bold text-cyan-300 mb-2">GAME PAUSED</h3>
              <button
                onClick={() => setIsPaused(false)}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono font-semibold text-xs rounded-lg shadow-md active:scale-95 transition-all cursor-pointer"
              >
                RESUME (P)
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs font-mono tracking-widest text-rose-500 mb-1">MATRIX FULL</span>
              <h3 className="font-mono text-2xl font-bold text-white mb-2">GAME OVER</h3>
              <div className="text-zinc-400 text-xs font-mono mb-5 flex flex-col gap-1">
                <span>Final Score: <strong className="text-cyan-400 text-sm">{score}</strong></span>
                <span>Lines Cleared: <strong className="text-zinc-200">{lines}</strong></span>
              </div>
              <button
                onClick={resetGame}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono font-bold text-sm rounded-lg shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>PLAY AGAIN</span>
              </button>
            </div>
          )}
        </div>

        {/* Next Piece Sidebar */}
        <div className="hidden sm:flex flex-col items-center gap-2 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl w-24">
          <span className="text-[11px] font-mono font-semibold text-zinc-400">NEXT</span>
          <canvas
            ref={nextCanvasRef}
            width={72}
            height={60}
            className="bg-black/40 rounded border border-zinc-800/80"
          />
          <div className="mt-2 text-center">
            <span className="text-[10px] font-mono text-zinc-500 block">HARD DROP</span>
            <span className="text-xs font-mono text-cyan-400 font-bold">SPACE</span>
          </div>
        </div>
      </div>

      {/* Virtual Gamepad for touch & quick keys */}
      <VirtualGamepad
        onDirection={(dir) => {
          if (dir === 'LEFT') moveHorizontal(-1);
          if (dir === 'RIGHT') moveHorizontal(1);
          if (dir === 'DOWN') dropStep();
          if (dir === 'UP') rotatePiece();
        }}
        onActionA={rotatePiece}
        actionALabel="ROTATE"
        onActionB={hardDrop}
        actionBLabel="HARD DROP"
        onTogglePause={() => {
          if (isPlaying && !isGameOver) setIsPaused((p) => !p);
        }}
        isPaused={isPaused}
        onRestart={resetGame}
      />
    </div>
  );
};
