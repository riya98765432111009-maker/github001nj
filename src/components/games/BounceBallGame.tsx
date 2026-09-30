import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Trophy, Heart, Zap, Crosshair } from 'lucide-react';
import { sound } from '../../utils/audio';
import { VirtualGamepad } from '../VirtualGamepad';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  targetWidth: number;
  hasLaser: boolean;
  laserTimer: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  hits: number;
  maxHits: number;
  color: string;
  isExplosive?: boolean;
  powerUp?: 'multiball' | 'wide' | 'laser' | 'life';
}

interface PowerUpItem {
  x: number;
  y: number;
  vy: number;
  type: 'multiball' | 'wide' | 'laser' | 'life';
  color: string;
}

interface LaserBullet {
  x: number;
  y: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export const BounceBallGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [level, setLevel] = useState<number>(1);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('retrovault_hs_bounce') || '0', 10);
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isLevelClear, setIsLevelClear] = useState<boolean>(false);

  // Entities stored in refs for 60fps canvas loop
  const paddleRef = useRef<Paddle>({
    x: 220,
    y: 440,
    width: 90,
    height: 12,
    targetWidth: 90,
    hasLaser: false,
    laserTimer: 0,
  });

  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUpItem[]>([]);
  const lasersRef = useRef<LaserBullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Input states
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  // Generate Brick Layout for Current Level
  const createBricks = useCallback((lvl: number): Brick[] => {
    const bricks: Brick[] = [];
    const rows = 5;
    const cols = 8;
    const brickW = 56;
    const brickH = 20;
    const startX = 26;
    const startY = 48;
    const gap = 6;

    const rowColors = ['#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Pattern variations based on level
        if (lvl === 2 && (r + c) % 2 === 1) continue; // Checkered
        if (lvl === 3 && (c === 0 || c === cols - 1) && r > 2) continue;

        const bx = startX + c * (brickW + gap);
        const by = startY + r * (brickH + gap);

        const isExplosive = Math.random() < 0.1;
        const hits = r === 0 && lvl > 1 ? 2 : 1;
        const color = isExplosive ? '#ef4444' : rowColors[r % rowColors.length];

        // Random power up
        let pUp: 'multiball' | 'wide' | 'laser' | 'life' | undefined;
        const roll = Math.random();
        if (roll < 0.08) pUp = 'multiball';
        else if (roll < 0.16) pUp = 'wide';
        else if (roll < 0.22) pUp = 'laser';
        else if (roll < 0.25) pUp = 'life';

        bricks.push({
          x: bx,
          y: by,
          width: brickW,
          height: brickH,
          hits,
          maxHits: hits,
          color,
          isExplosive,
          powerUp: pUp,
        });
      }
    }
    return bricks;
  }, []);

  const resetGame = (fullReset: boolean = true) => {
    const startLevel = fullReset ? 1 : level;
    if (fullReset) {
      setScore(0);
      setLives(3);
      setLevel(1);
    }

    paddleRef.current = {
      x: 215,
      y: 440,
      width: 90,
      height: 12,
      targetWidth: 90,
      hasLaser: false,
      laserTimer: 0,
    };

    ballsRef.current = [
      {
        x: 260,
        y: 420,
        vx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
        vy: -4.5,
        radius: 6,
      },
    ];

    bricksRef.current = createBricks(startLevel);
    powerUpsRef.current = [];
    lasersRef.current = [];
    particlesRef.current = [];

    setIsGameOver(false);
    setIsLevelClear(false);
    setIsPaused(false);
    setIsPlaying(true);
    sound.playBeep(480, 0.08, 'sine');
  };

  const nextLevel = () => {
    const nxt = level + 1;
    setLevel(nxt);
    setIsLevelClear(false);
    resetGame(false);
    sound.playPowerup();
  };

  const fireLasers = useCallback(() => {
    const pad = paddleRef.current;
    if (!pad.hasLaser) return;

    lasersRef.current.push(
      { x: pad.x + 8, y: pad.y - 6, vy: -8 },
      { x: pad.x + pad.width - 12, y: pad.y - 6, vy: -8 }
    );
    sound.playLaser();
  }, []);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        if (!isPlaying || isGameOver) {
          resetGame(true);
        } else if (isLevelClear) {
          nextLevel();
        } else {
          fireLasers();
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        setIsPaused((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isGameOver, isLevelClear, fireLasers]);

  // Mouse / Touch follow
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const pad = paddleRef.current;
    pad.x = Math.max(0, Math.min(canvas.width - pad.width, mouseX - pad.width / 2));
  };

  // Main 60 FPS Game Loop
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver || isLevelClear) return;

    let animId: number;

    const gameLoop = () => {
      const pad = paddleRef.current;
      const balls = ballsRef.current;
      const bricks = bricksRef.current;
      const powerUps = powerUpsRef.current;
      const lasers = lasersRef.current;
      const particles = particlesRef.current;

      const canvas = canvasRef.current;
      const cWidth = canvas ? canvas.width : 520;
      const cHeight = canvas ? canvas.height : 480;

      // Paddle Keyboard movement
      const padSpeed = 7;
      if (keysRef.current.left) {
        pad.x = Math.max(0, pad.x - padSpeed);
      }
      if (keysRef.current.right) {
        pad.x = Math.min(cWidth - pad.width, pad.x + padSpeed);
      }

      // Smooth paddle size interpolation
      if (pad.width !== pad.targetWidth) {
        pad.width += (pad.targetWidth - pad.width) * 0.1;
      }

      // Laser duration timer
      if (pad.hasLaser) {
        pad.laserTimer -= 1;
        if (pad.laserTimer <= 0) {
          pad.hasLaser = false;
        }
      }

      // Helper to destroy brick and trigger powerups
      function destroyBrick(idx: number) {
        const b = bricks[idx];
        if (!b) return;

        // Brick shatter sparks
        for (let p = 0; p < 8; p++) {
          particles.push({
            x: b.x + b.width / 2,
            y: b.y + b.height / 2,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: b.color,
            life: 20,
          });
        }

        // Handle Explosive TNT Brick
        if (b.isExplosive) {
          sound.playExplode();
          setScore((s) => s + 50);
          // Explode neighbors
          const bx = b.x;
          const by = b.y;
          bricks.splice(idx, 1);

          for (let n = bricks.length - 1; n >= 0; n--) {
            const nb = bricks[n];
            if (Math.abs(nb.x - bx) < 70 && Math.abs(nb.y - by) < 35) {
              nb.hits = 0;
              destroyBrick(n);
            }
          }
        } else {
          setScore((s) => s + 20);
          // Spawn powerup if any
          if (b.powerUp) {
            let color = '#38bdf8';
            if (b.powerUp === 'multiball') color = '#22c55e';
            if (b.powerUp === 'laser') color = '#f43f5e';
            if (b.powerUp === 'life') color = '#ec4899';
            powerUps.push({
              x: b.x + b.width / 2,
              y: b.y + b.height / 2,
              vy: 2.2,
              type: b.powerUp,
              color,
            });
          }
          bricks.splice(idx, 1);
        }

        // Check level win
        if (bricks.length === 0) {
          sound.playPowerup();
          setIsLevelClear(true);
          setScore((s) => {
            const bonus = s + 1000;
            if (bonus > highScore) {
              setHighScore(bonus);
              localStorage.setItem('retrovault_hs_bounce', bonus.toString());
            }
            return bonus;
          });
        }
      }

      // Update Lasers
      for (let i = lasers.length - 1; i >= 0; i--) {
        const lz = lasers[i];
        lz.y += lz.vy;

        // Hit brick with laser
        let hit = false;
        for (let bIdx = bricks.length - 1; bIdx >= 0; bIdx--) {
          const b = bricks[bIdx];
          if (lz.x > b.x && lz.x < b.x + b.width && lz.y > b.y && lz.y < b.y + b.height) {
            b.hits -= 1;
            hit = true;
            sound.playBrickBounce();
            if (b.hits <= 0) {
              destroyBrick(bIdx);
            }
            break;
          }
        }

        if (hit || lz.y < 0) {
          lasers.splice(i, 1);
        }
      }

      // Update Power-ups
      for (let i = powerUps.length - 1; i >= 0; i--) {
        const pup = powerUps[i];
        pup.y += pup.vy;

        // Catch powerup with paddle
        if (
          pup.y + 10 >= pad.y &&
          pup.y - 10 <= pad.y + pad.height &&
          pup.x >= pad.x &&
          pup.x <= pad.x + pad.width
        ) {
          sound.playPowerup();
          if (pup.type === 'wide') {
            pad.targetWidth = 140;
            setTimeout(() => {
              pad.targetWidth = 90;
            }, 10000);
          } else if (pup.type === 'multiball') {
            const curBall = balls[0] || { x: pad.x + pad.width / 2, y: pad.y - 10, radius: 6 };
            balls.push(
              { x: curBall.x, y: curBall.y, vx: -3.5, vy: -4, radius: 6 },
              { x: curBall.x, y: curBall.y, vx: 3.5, vy: -4, radius: 6 }
            );
          } else if (pup.type === 'laser') {
            pad.hasLaser = true;
            pad.laserTimer = 450; // ~7.5 seconds
          } else if (pup.type === 'life') {
            setLives((l) => Math.min(5, l + 1));
          }
          powerUps.splice(i, 1);
        } else if (pup.y > cHeight) {
          powerUps.splice(i, 1);
        }
      }

      // Update Balls
      for (let bIndex = balls.length - 1; bIndex >= 0; bIndex--) {
        const ball = balls[bIndex];
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Left / Right Wall bounce
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx);
          sound.playPaddleBounce(-40);
        } else if (ball.x + ball.radius >= cWidth) {
          ball.x = cWidth - ball.radius;
          ball.vx = -Math.abs(ball.vx);
          sound.playPaddleBounce(-40);
        }

        // Ceiling bounce
        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy);
          sound.playPaddleBounce(-40);
        }

        // Paddle Collision & Dynamic Angle Deflection
        if (
          ball.y + ball.radius >= pad.y &&
          ball.y - ball.radius <= pad.y + pad.height &&
          ball.x >= pad.x - ball.radius &&
          ball.x <= pad.x + pad.width + ball.radius &&
          ball.vy > 0
        ) {
          // Calculate offset from paddle center (-1 to 1)
          const hitOffset = (ball.x - (pad.x + pad.width / 2)) / (pad.width / 2);
          const maxAngle = (60 * Math.PI) / 180;
          const bounceAngle = hitOffset * maxAngle;
          const currentSpeed = Math.min(8.5, Math.hypot(ball.vx, ball.vy) + 0.05);

          ball.vx = currentSpeed * Math.sin(bounceAngle);
          ball.vy = -Math.abs(currentSpeed * Math.cos(bounceAngle));
          ball.y = pad.y - ball.radius;
          sound.playPaddleBounce(60);
        }

        // Brick Collisions
        for (let i = bricks.length - 1; i >= 0; i--) {
          const brk = bricks[i];
          if (
            ball.x + ball.radius > brk.x &&
            ball.x - ball.radius < brk.x + brk.width &&
            ball.y + ball.radius > brk.y &&
            ball.y - ball.radius < brk.y + brk.height
          ) {
            // Determine impact side
            const prevX = ball.x - ball.vx;
            const prevY = ball.y - ball.vy;

            if (prevX + ball.radius <= brk.x || prevX - ball.radius >= brk.x + brk.width) {
              ball.vx = -ball.vx;
            } else {
              ball.vy = -ball.vy;
            }

            brk.hits -= 1;
            sound.playBrickBounce();

            if (brk.hits <= 0) {
              destroyBrick(i);
            }
            break;
          }
        }

        // Ball fell off bottom
        if (ball.y - ball.radius > cHeight) {
          balls.splice(bIndex, 1);
        }
      }

      // Check if all balls lost
      if (balls.length === 0) {
        sound.playGameOver();
        setLives((l) => {
          const nextL = l - 1;
          if (nextL <= 0) {
            setIsGameOver(true);
            setIsPlaying(false);
          } else {
            // Respawn fresh ball
            ballsRef.current = [
              {
                x: pad.x + pad.width / 2,
                y: pad.y - 12,
                vx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
                vy: -4.5,
                radius: 6,
              },
            ];
          }
          return nextL;
        });
      }

      // Particles
      for (let pIdx = particles.length - 1; pIdx >= 0; pIdx--) {
        const pt = particles[pIdx];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 1;
        if (pt.life <= 0) {
          particles.splice(pIdx, 1);
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isPaused, isGameOver, isLevelClear, highScore]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Deep Space arcade canvas
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, width, height);

    // Subtle star field
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    [
      { x: 30, y: 40 }, { x: 120, y: 180 }, { x: 280, y: 70 }, { x: 420, y: 150 },
      { x: 480, y: 320 }, { x: 90, y: 380 }, { x: 340, y: 410 }
    ].forEach((s) => {
      ctx.fillRect(s.x, s.y, 2, 2);
    });

    // Draw Bricks
    const bricks = bricksRef.current;
    bricks.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = b.isExplosive ? 10 : 3;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.width, b.height, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Bevel highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(b.x + 2, b.y + 2, b.width - 4, 3);

      if (b.isExplosive) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TNT', b.x + b.width / 2, b.y + 14);
      } else if (b.powerUp) {
        // Small icon indicator
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw Power-ups falling
    const powerUps = powerUpsRef.current;
    powerUps.forEach((pup) => {
      ctx.fillStyle = pup.color;
      ctx.shadowColor = pup.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(pup.x - 12, pup.y - 6, 24, 12, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      const label = pup.type === 'multiball' ? '3x' : pup.type === 'laser' ? 'LZ' : pup.type === 'wide' ? 'W' : '+1';
      ctx.fillText(label, pup.x, pup.y + 3);
    });

    // Draw Laser Bullets
    const lasers = lasersRef.current;
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 6;
    lasers.forEach((lz) => {
      ctx.fillRect(lz.x, lz.y, 3, 10);
    });
    ctx.shadowBlur = 0;

    // Draw Particles
    const particles = particlesRef.current;
    particles.forEach((pt) => {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 3, 3);
    });

    // Draw Paddle
    const pad = paddleRef.current;
    const padColor = pad.hasLaser ? '#f43f5e' : '#38bdf8';
    ctx.fillStyle = padColor;
    ctx.shadowColor = padColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(pad.x, pad.y, pad.width, pad.height, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Paddle Center Grip
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pad.x + pad.width / 2 - 10, pad.y + 3, 20, 6);

    // Laser Cannons if equipped
    if (pad.hasLaser) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(pad.x + 6, pad.y - 4, 4, 4);
      ctx.fillRect(pad.x + pad.width - 10, pad.y - 4, 4, 4);
    }

    // Draw Balls
    const balls = ballsRef.current;
    balls.forEach((ball) => {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Top Header Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-zinc-900/70 border border-zinc-800 rounded-xl mb-4 text-sm font-mono">
        <div className="flex items-center gap-3 text-zinc-300">
          <div>
            <span className="text-zinc-500 mr-1.5">Score</span>
            <span className="text-lg font-bold text-rose-400 tabular-nums">{score}</span>
          </div>
          <span className="text-zinc-700" aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-500 mr-1.5">Best</span>
            <span className="font-semibold text-amber-400 tabular-nums">{highScore}</span>
          </div>
          <span className="text-zinc-700" aria-hidden="true">·</span>
          <div>
            <span className="text-zinc-500 mr-1.5">Stage</span>
            <span className="tabular-nums text-zinc-200">{level}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Laser Status */}
          {paddleRef.current.hasLaser && (
            <div className="flex items-center gap-1 text-xs text-rose-400 animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-rose-400" />
              <span>LASER ARMED</span>
            </div>
          )}

          {/* Lives Counter */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-3.5 h-3.5 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-zinc-800'}`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              if (isPlaying && !isGameOver && !isLevelClear) setIsPaused((p) => !p);
            }}
            disabled={!isPlaying || isGameOver || isLevelClear}
            className="px-2.5 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40"
          >
            {isPaused ? 'Resume' : 'Pause (P)'}
          </button>
        </div>
      </div>

      {/* Main Playing Area */}
      <div className="relative w-full max-w-[520px] aspect-[52/48] rounded-2xl overflow-hidden border-2 border-zinc-800 bg-[#060913] shadow-2xl">
        <canvas
          ref={canvasRef}
          width={520}
          height={480}
          onMouseMove={handleMouseMove}
          className="w-full h-full block cursor-crosshair"
          onClick={() => {
            if (!isPlaying || isGameOver) resetGame(true);
            else if (isLevelClear) nextLevel();
            else fireLasers();
          }}
        />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && !isLevelClear && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3">
              <Play className="w-6 h-6 text-rose-400 fill-rose-400 ml-0.5" />
            </div>
            <h3 className="font-mono text-xl font-bold text-white mb-1">BOUNCE BALL (BRICK BREAKER)</h3>
            <p className="text-xs text-zinc-400 max-w-sm mb-5">
              Deflect bouncing spheres with angle precision, trigger explosive TNT combos, and catch falling Laser / Multi-ball powerups!
            </p>
            <button
              onClick={() => resetGame(true)}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-mono font-bold text-sm rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              START GAME (SPACE)
            </button>
            <span className="text-[11px] text-zinc-500 font-mono mt-3">
              Move Mouse or ← → to steer · Space / Click to shoot Lasers
            </span>
          </div>
        )}

        {/* Level Clear Overlay */}
        {isLevelClear && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <span className="text-xs font-mono tracking-widest text-emerald-400 mb-1">STAGE CLEARED</span>
            <h3 className="font-mono text-2xl font-bold text-white mb-2">SECTOR SECURED!</h3>
            <div className="text-zinc-400 text-xs font-mono mb-5">
              <span>Score: <strong className="text-rose-400 text-sm">{score}</strong></span>
            </div>
            <button
              onClick={nextLevel}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-sm rounded-lg shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>NEXT STAGE</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <span className="text-xs font-mono tracking-widest text-rose-500 mb-1">ALL BALLS LOST</span>
            <h3 className="font-mono text-2xl font-bold text-white mb-2">GAME OVER</h3>
            <div className="text-zinc-400 text-xs font-mono mb-5 flex items-center gap-3">
              <span>Final Score: <strong className="text-rose-400 text-sm">{score}</strong></span>
              <span>·</span>
              <span>Best: <strong className="text-amber-400 text-sm">{highScore}</strong></span>
            </div>
            <button
              onClick={() => resetGame(true)}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-mono font-bold text-sm rounded-lg shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>
          </div>
        )}
      </div>

      {/* On-screen controls */}
      <VirtualGamepad
        onDirection={(dir) => {
          const pad = paddleRef.current;
          if (dir === 'LEFT') pad.x = Math.max(0, pad.x - 35);
          if (dir === 'RIGHT') pad.x = Math.min(520 - pad.width, pad.x + 35);
        }}
        onActionA={fireLasers}
        actionALabel="LASER / SHOOT"
        onTogglePause={() => {
          if (isPlaying && !isGameOver && !isLevelClear) setIsPaused((p) => !p);
        }}
        isPaused={isPaused}
        onRestart={() => resetGame(true)}
      />
    </div>
  );
};
