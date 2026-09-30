import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Trophy, Heart, Flag, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';
import { VirtualGamepad } from '../VirtualGamepad';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  isBig: boolean;
  invincibleTimer: number;
  animFrame: number;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'brick' | 'question' | 'empty' | 'pipe';
  contains?: 'coin' | 'mushroom';
  bumpOffsetY?: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  isAlive: boolean;
  squishTimer: number;
}

interface CoinItem {
  x: number;
  y: number;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

const LEVEL_WIDTH = 2800;
const LEVEL_HEIGHT = 420;
const GRAVITY = 0.52;

export const MiniMarioGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('retrovault_hs_mario') || '0', 10);
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isStageClear, setIsStageClear] = useState<boolean>(false);

  // Keyboard input states
  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean }>({
    left: false,
    right: false,
    jump: false,
  });

  // Game entities in ref for high performance 60fps loop
  const playerRef = useRef<Player>({
    x: 80,
    y: 280,
    vx: 0,
    vy: 0,
    width: 22,
    height: 28,
    isGrounded: true,
    facing: 'right',
    isBig: false,
    invincibleTimer: 0,
    animFrame: 0,
  });

  const blocksRef = useRef<Block[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const coinsRef = useRef<CoinItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cameraXRef = useRef<number>(0);

  // Initialize level geometry
  const buildLevel = useCallback(() => {
    const blocks: Block[] = [];
    const enemies: Enemy[] = [];
    const coinItems: CoinItem[] = [];

    // Continuous Ground Floor with a couple pits
    const groundLevelY = 360;
    // Ground segment 1: 0 -> 700
    blocks.push({ x: 0, y: groundLevelY, width: 720, height: 60, type: 'ground' });
    // Pit between 720 and 800
    // Ground segment 2: 800 -> 1600
    blocks.push({ x: 800, y: groundLevelY, width: 840, height: 60, type: 'ground' });
    // Pit between 1640 and 1720
    // Ground segment 3: 1720 -> LEVEL_WIDTH
    blocks.push({ x: 1720, y: groundLevelY, width: LEVEL_WIDTH - 1720, height: 60, type: 'ground' });

    // Pipes
    blocks.push({ x: 300, y: groundLevelY - 45, width: 44, height: 45, type: 'pipe' });
    blocks.push({ x: 580, y: groundLevelY - 65, width: 44, height: 65, type: 'pipe' });
    blocks.push({ x: 1100, y: groundLevelY - 55, width: 44, height: 55, type: 'pipe' });
    blocks.push({ x: 1450, y: groundLevelY - 75, width: 44, height: 75, type: 'pipe' });
    blocks.push({ x: 2050, y: groundLevelY - 60, width: 44, height: 60, type: 'pipe' });

    // Question and Brick Blocks Row 1 (around x: 160-260)
    blocks.push({ x: 160, y: 260, width: 28, height: 28, type: 'question', contains: 'coin' });
    blocks.push({ x: 188, y: 260, width: 28, height: 28, type: 'brick' });
    blocks.push({ x: 216, y: 260, width: 28, height: 28, type: 'question', contains: 'mushroom' });
    blocks.push({ x: 244, y: 260, width: 28, height: 28, type: 'brick' });
    blocks.push({ x: 272, y: 260, width: 28, height: 28, type: 'question', contains: 'coin' });

    // Floating platforms over the first pit area
    blocks.push({ x: 680, y: 250, width: 28, height: 28, type: 'brick' });
    blocks.push({ x: 740, y: 230, width: 28, height: 28, type: 'question', contains: 'coin' });
    blocks.push({ x: 800, y: 250, width: 28, height: 28, type: 'brick' });

    // Staircase blocks
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j <= i; j++) {
        blocks.push({ x: 1250 + i * 28, y: groundLevelY - (j + 1) * 28, width: 28, height: 28, type: 'brick' });
      }
    }

    // High Coin platforms (1780-1950)
    blocks.push({ x: 1800, y: 240, width: 28, height: 28, type: 'brick' });
    blocks.push({ x: 1828, y: 240, width: 28, height: 28, type: 'question', contains: 'coin' });
    blocks.push({ x: 1856, y: 240, width: 28, height: 28, type: 'question', contains: 'coin' });
    blocks.push({ x: 1884, y: 240, width: 28, height: 28, type: 'brick' });

    // Final Staircase to Flagpole
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j <= i; j++) {
        blocks.push({ x: 2300 + i * 28, y: groundLevelY - (j + 1) * 28, width: 28, height: 28, type: 'brick' });
      }
    }

    // Enemies (Goombas)
    enemies.push({ x: 420, y: groundLevelY - 24, vx: -1.0, width: 24, height: 24, isAlive: true, squishTimer: 0 });
    enemies.push({ x: 480, y: groundLevelY - 24, vx: -1.0, width: 24, height: 24, isAlive: true, squishTimer: 0 });
    enemies.push({ x: 920, y: groundLevelY - 24, vx: -1.1, width: 24, height: 24, isAlive: true, squishTimer: 0 });
    enemies.push({ x: 1350, y: groundLevelY - 24, vx: 1.0, width: 24, height: 24, isAlive: true, squishTimer: 0 });
    enemies.push({ x: 1950, y: groundLevelY - 24, vx: -1.2, width: 24, height: 24, isAlive: true, squishTimer: 0 });
    enemies.push({ x: 2180, y: groundLevelY - 24, vx: -1.0, width: 24, height: 24, isAlive: true, squishTimer: 0 });

    // Floating coins in curves
    const coinSpawns = [
      { x: 380, y: 310 }, { x: 410, y: 290 }, { x: 440, y: 290 }, { x: 470, y: 310 },
      { x: 740, y: 190 },
      { x: 980, y: 320 }, { x: 1010, y: 320 }, { x: 1040, y: 320 },
      { x: 1800, y: 200 }, { x: 1828, y: 200 }, { x: 1856, y: 200 }, { x: 1884, y: 200 },
    ];
    coinSpawns.forEach((p) => coinItems.push({ x: p.x, y: p.y, collected: false }));

    blocksRef.current = blocks;
    enemiesRef.current = enemies;
    coinsRef.current = coinItems;
    particlesRef.current = [];
    cameraXRef.current = 0;
  }, []);

  const resetGame = () => {
    playerRef.current = {
      x: 80,
      y: 280,
      vx: 0,
      vy: 0,
      width: 22,
      height: 28,
      isGrounded: true,
      facing: 'right',
      isBig: false,
      invincibleTimer: 0,
      animFrame: 0,
    };
    buildLevel();
    setScore(0);
    setCoins(0);
    setLives(3);
    setTimeLeft(300);
    setIsGameOver(false);
    setIsStageClear(false);
    setIsPaused(false);
    setIsPlaying(true);
    sound.playPowerup();
  };

  const respawnPlayer = () => {
    playerRef.current.x = Math.max(80, cameraXRef.current + 40);
    playerRef.current.y = 200;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.invincibleTimer = 90; // brief flash immunity
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysRef.current.jump = true;
      }
      if (e.key === 'p' || e.key === 'P') {
        setIsPaused((prev) => !prev);
      }
      if ((e.key === ' ' || e.key === 'Enter') && (!isPlaying || isGameOver || isStageClear)) {
        resetGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysRef.current.jump = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isGameOver, isStageClear]);

  // Level countdown timer
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver || isStageClear) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          sound.playGameOver();
          setIsGameOver(true);
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isPaused, isGameOver, isStageClear]);

  // Main 60 FPS Physics & Game Loop
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver || isStageClear) return;

    let animId: number;

    const gameLoop = () => {
      const p = playerRef.current;
      const keys = keysRef.current;
      const blocks = blocksRef.current;
      const enemies = enemiesRef.current;
      const coinsList = coinsRef.current;
      const particles = particlesRef.current;

      // Invincibility countdown
      if (p.invincibleTimer > 0) {
        p.invincibleTimer -= 1;
      }

      // Horizontal physics & friction
      const moveSpeed = 3.6;
      if (keys.left) {
        p.vx = -moveSpeed;
        p.facing = 'left';
        p.animFrame += 0.2;
      } else if (keys.right) {
        p.vx = moveSpeed;
        p.facing = 'right';
        p.animFrame += 0.2;
      } else {
        p.vx *= 0.78; // ground friction
        if (Math.abs(p.vx) < 0.1) p.vx = 0;
      }

      // Jump mechanics
      if (keys.jump && p.isGrounded) {
        p.vy = -11.5;
        p.isGrounded = false;
        sound.playJump();
      }

      // Apply gravity
      p.vy += GRAVITY;
      if (p.vy > 12) p.vy = 12; // terminal velocity

      // Predict next position
      p.x += p.vx;

      // Horizontal Block Collisions
      for (const b of blocks) {
        if (
          p.x + p.width > b.x &&
          p.x < b.x + b.width &&
          p.y + p.height > b.y &&
          p.y < b.y + b.height
        ) {
          if (p.vx > 0) {
            p.x = b.x - p.width;
          } else if (p.vx < 0) {
            p.x = b.x + b.width;
          }
          p.vx = 0;
        }
      }

      // Prevent moving backwards past camera
      if (p.x < cameraXRef.current) {
        p.x = cameraXRef.current;
        p.vx = 0;
      }

      // Vertical position & collisions
      p.y += p.vy;
      p.isGrounded = false;

      for (const b of blocks) {
        if (
          p.x + p.width > b.x &&
          p.x < b.x + b.width &&
          p.y + p.height > b.y &&
          p.y < b.y + b.height
        ) {
          // Falling onto top of block
          if (p.vy > 0 && p.y + p.height - p.vy <= b.y + 4) {
            p.y = b.y - p.height;
            p.vy = 0;
            p.isGrounded = true;
          }
          // Hitting block from underneath
          else if (p.vy < 0 && p.y - p.vy >= b.y + b.height - 4) {
            p.y = b.y + b.height;
            p.vy = 0;

            // Trigger block action!
            if (b.type === 'question') {
              b.type = 'empty';
              b.bumpOffsetY = -8;
              if (b.contains === 'coin') {
                sound.playCoin();
                setCoins((c) => c + 1);
                setScore((s) => s + 100);
                // Sparkle particles
                for (let i = 0; i < 6; i++) {
                  particles.push({
                    x: b.x + 14,
                    y: b.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 5 - 2,
                    color: '#facc15',
                    life: 25,
                  });
                }
              } else if (b.contains === 'mushroom') {
                sound.playPowerup();
                p.isBig = true;
                p.height = 36;
                p.y -= 8;
                setScore((s) => s + 500);
              }
            } else if (b.type === 'brick') {
              b.bumpOffsetY = -6;
              sound.playHit();
              // Brick smash particles
              for (let i = 0; i < 4; i++) {
                particles.push({
                  x: b.x + 14,
                  y: b.y + 14,
                  vx: (Math.random() - 0.5) * 6,
                  vy: -Math.random() * 4 - 2,
                  color: '#b45309',
                  life: 20,
                });
              }
            }
          }
        }
      }

      // Recover block bump animations
      for (const b of blocks) {
        if (b.bumpOffsetY && b.bumpOffsetY < 0) {
          b.bumpOffsetY += 1.5;
          if (b.bumpOffsetY >= 0) b.bumpOffsetY = 0;
        }
      }

      // Check falling into pit
      if (p.y > LEVEL_HEIGHT) {
        sound.playGameOver();
        setLives((l) => {
          const nextLives = l - 1;
          if (nextLives <= 0) {
            setIsGameOver(true);
            setIsPlaying(false);
          } else {
            respawnPlayer();
          }
          return nextLives;
        });
      }

      // Coins collection
      for (const c of coinsList) {
        if (!c.collected && Math.abs(p.x + p.width / 2 - c.x) < 18 && Math.abs(p.y + p.height / 2 - c.y) < 22) {
          c.collected = true;
          sound.playCoin();
          setCoins((co) => co + 1);
          setScore((s) => s + 50);
        }
      }

      // Enemy logic
      for (const e of enemies) {
        if (!e.isAlive) {
          if (e.squishTimer > 0) e.squishTimer -= 1;
          continue;
        }

        e.x += e.vx;

        // Enemy reverse on block obstacle or pipe
        for (const b of blocks) {
          if (
            b.type === 'pipe' &&
            e.x + e.width > b.x &&
            e.x < b.x + b.width &&
            e.y + e.height > b.y &&
            e.y < b.y + b.height
          ) {
            e.vx = -e.vx;
            e.x += e.vx * 2;
          }
        }

        // Enemy player collision
        if (
          p.x + p.width > e.x &&
          p.x < e.x + e.width &&
          p.y + p.height > e.y &&
          p.y < e.y + e.height
        ) {
          // Jumping on top of enemy
          if (p.vy > 0 && p.y + p.height - p.vy <= e.y + 10) {
            e.isAlive = false;
            e.squishTimer = 25;
            p.vy = -8.5; // bounce off
            sound.playHit();
            setScore((s) => s + 200);
          }
          // Player hit from side
          else if (p.invincibleTimer === 0) {
            if (p.isBig) {
              p.isBig = false;
              p.height = 28;
              p.invincibleTimer = 60;
              sound.playBeep(240, 0.1, 'sawtooth');
            } else {
              sound.playHit();
              setLives((l) => {
                const nextLives = l - 1;
                if (nextLives <= 0) {
                  setIsGameOver(true);
                  setIsPlaying(false);
                } else {
                  respawnPlayer();
                }
                return nextLives;
              });
            }
          }
        }
      }

      // Particles update
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.3; // particle gravity
        pt.life -= 1;
        if (pt.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // Check Flagpole Victory at x: 2500
      if (p.x >= 2500 && !isStageClear) {
        sound.playPowerup();
        setIsStageClear(true);
        setIsPlaying(false);
        const stageBonus = timeLeft * 10 + 1000;
        setScore((s) => {
          const finalScore = s + stageBonus;
          if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem('retrovault_hs_mario', finalScore.toString());
          }
          return finalScore;
        });
      }

      // Smooth camera follow player
      const targetCamX = Math.max(0, Math.min(LEVEL_WIDTH - 640, p.x - 220));
      cameraXRef.current += (targetCamX - cameraXRef.current) * 0.1;

      // Trigger next frame
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isPaused, isGameOver, isStageClear, timeLeft, highScore]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const camX = cameraXRef.current;

    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#38bdf8');
    skyGradient.addColorStop(1, '#93c5fd');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Parallax background hills & clouds
    ctx.save();
    ctx.translate(-camX * 0.25, 0);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    [
      { x: 120, y: 70, w: 90 }, { x: 380, y: 50, w: 120 }, { x: 700, y: 80, w: 100 },
      { x: 1100, y: 60, w: 140 }, { x: 1500, y: 90, w: 90 }, { x: 1900, y: 50, w: 110 }
    ].forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 22, 0, Math.PI * 2);
      ctx.arc(c.x + 25, c.y - 10, 28, 0, Math.PI * 2);
      ctx.arc(c.x + 55, c.y, 20, 0, Math.PI * 2);
      ctx.fill();
    });

    // Background emerald hills
    ctx.fillStyle = '#4ade80';
    [
      { x: 100, y: 360, r: 140 }, { x: 450, y: 360, r: 170 }, { x: 900, y: 360, r: 150 },
      { x: 1350, y: 360, r: 180 }, { x: 1850, y: 360, r: 160 }
    ].forEach((h) => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, Math.PI, 0);
      ctx.fill();
    });
    ctx.restore();

    // Main world translation
    ctx.save();
    ctx.translate(-camX, 0);

    // Draw Blocks & Terrain
    const blocks = blocksRef.current;
    blocks.forEach((b) => {
      const bump = b.bumpOffsetY || 0;
      const by = b.y + bump;

      if (b.type === 'ground') {
        // Ground brick soil
        ctx.fillStyle = '#16a34a'; // Grass top
        ctx.fillRect(b.x, by, b.width, 10);
        ctx.fillStyle = '#b45309'; // Dirt bottom
        ctx.fillRect(b.x, by + 10, b.width, b.height - 10);

        // Brick soil pattern
        ctx.fillStyle = '#92400e';
        for (let gx = b.x; gx < b.x + b.width; gx += 20) {
          ctx.fillRect(gx + 2, by + 16, 16, 6);
          ctx.fillRect(gx + 12, by + 26, 16, 6);
        }
      } else if (b.type === 'brick') {
        // Brick block
        ctx.fillStyle = '#b45309';
        ctx.fillRect(b.x, by, b.width, b.height);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x + 1, by + 1, b.width - 2, b.height - 2);
        // Brick cleft
        ctx.fillStyle = '#78350f';
        ctx.fillRect(b.x, by + b.height / 2, b.width, 2);
        ctx.fillRect(b.x + b.width / 2, by, 2, b.height / 2);
      } else if (b.type === 'question') {
        // Glowing Mystery Question Block
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(b.x, by, b.width, b.height);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x + 1, by + 1, b.width - 2, b.height - 2);

        // Corner studs
        ctx.fillStyle = '#78350f';
        ctx.fillRect(b.x + 2, by + 2, 3, 3);
        ctx.fillRect(b.x + b.width - 5, by + 2, 3, 3);
        ctx.fillRect(b.x + 2, by + b.height - 5, 3, 3);
        ctx.fillRect(b.x + b.width - 5, by + b.height - 5, 3, 3);

        // Bold '?' character
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('?', b.x + b.width / 2, by + 19);
      } else if (b.type === 'empty') {
        // Spent brown block
        ctx.fillStyle = '#78716c';
        ctx.fillRect(b.x, by, b.width, b.height);
        ctx.strokeStyle = '#44403c';
        ctx.strokeRect(b.x + 1, by + 1, b.width - 2, b.height - 2);
      } else if (b.type === 'pipe') {
        // Green Warp Pipe
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(b.x, by, b.width, b.height);
        // Pipe collar rim
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(b.x - 3, by, b.width + 6, 14);
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x - 3, by, b.width + 6, 14);
        // Pipe highlight
        ctx.fillStyle = '#86efac';
        ctx.fillRect(b.x + 4, by, 5, b.height);
      }
    });

    // Draw Floating Coins
    const coinsList = coinsRef.current;
    coinsList.forEach((c) => {
      if (!c.collected) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, 7, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(c.x - 2, c.y - 5, 4, 10);
      }
    });

    // Draw Flagpole & Castle at End
    const poleX = 2500;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(poleX, 100, 6, 260); // pole
    ctx.fillStyle = '#eab308'; // pole ball topper
    ctx.beginPath();
    ctx.arc(poleX + 3, 98, 8, 0, Math.PI * 2);
    ctx.fill();

    // Flag
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(poleX + 6, 106);
    ctx.lineTo(poleX + 46, 126);
    ctx.lineTo(poleX + 6, 146);
    ctx.fill();

    // End Castle
    ctx.fillStyle = '#64748b';
    ctx.fillRect(2560, 240, 100, 120);
    // Battlements
    ctx.fillRect(2560, 220, 24, 20);
    ctx.fillRect(2598, 220, 24, 20);
    ctx.fillRect(2636, 220, 24, 20);
    // Castle Doorway
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2595, 290, 30, 70);

    // Draw Enemies (Goombas)
    const enemies = enemiesRef.current;
    enemies.forEach((e) => {
      if (!e.isAlive && e.squishTimer <= 0) return;

      if (!e.isAlive) {
        // Squished Goomba
        ctx.fillStyle = '#78350f';
        ctx.fillRect(e.x, e.y + 14, e.width, 10);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(e.x + 4, e.y + 16, 4, 3);
        ctx.fillRect(e.x + 14, e.y + 16, 4, 3);
      } else {
        // Walking Goomba
        ctx.fillStyle = '#92400e'; // Brown dome head
        ctx.beginPath();
        ctx.arc(e.x + e.width / 2, e.y + 10, 12, Math.PI, 0);
        ctx.lineTo(e.x + e.width, e.y + 18);
        ctx.lineTo(e.x, e.y + 18);
        ctx.fill();

        // Cream stem
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(e.x + 4, e.y + 16, 16, 8);

        // Angry eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(e.x + 5, e.y + 8, 4, 6);
        ctx.fillRect(e.x + 14, e.y + 8, 4, 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(e.x + 7, e.y + 10, 2, 4);
        ctx.fillRect(e.x + 14, e.y + 10, 2, 4);
      }
    });

    // Draw Particles
    const particles = particlesRef.current;
    particles.forEach((pt) => {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, 4, 4);
    });

    // Draw Mini Mario Player
    const p = playerRef.current;
    if (p.invincibleTimer % 4 < 2) {
      const px = p.x;
      const py = p.y;

      // Cap & Shirt (Red)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px + (p.facing === 'right' ? 4 : 2), py, 14, 8); // hat
      ctx.fillRect(px + 4, py + 12, 14, 10); // shirt

      // Overalls (Blue)
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(px + 4, py + 18, 14, 10);

      // Face skin
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px + (p.facing === 'right' ? 6 : 4), py + 6, 10, 7);

      // Mustache
      ctx.fillStyle = '#451a03';
      ctx.fillRect(px + (p.facing === 'right' ? 10 : 4), py + 10, 6, 3);

      // Shoes (Brown)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + 2, py + p.height - 4, 8, 4);
      ctx.fillRect(px + 12, py + p.height - 4, 8, 4);
    }

    ctx.restore();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Top Header Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-zinc-900/70 border border-zinc-800 rounded-xl mb-4 text-sm font-mono">
        <div className="flex items-center gap-3 text-zinc-300">
          <div>
            <span className="text-zinc-500 mr-1.5">Score</span>
            <span className="text-lg font-bold text-amber-400 tabular-nums">{score}</span>
          </div>
          <span className="text-zinc-700" aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-500 mr-1.5">Best</span>
            <span className="font-semibold text-amber-400 tabular-nums">{highScore}</span>
          </div>
          <span className="text-zinc-700" aria-hidden="true">·</span>
          <div className="flex items-center gap-1">
            <span className="text-amber-400 font-bold">🪙</span>
            <span className="tabular-nums font-semibold text-zinc-100">{coins}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Lives Counter */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-zinc-700'}`}
              />
            ))}
          </div>

          {/* Time Remaining */}
          <div className="text-xs font-mono text-zinc-400">
            <span>Time </span>
            <span className={`font-bold tabular-nums ${timeLeft < 60 ? 'text-rose-400' : 'text-zinc-200'}`}>
              {timeLeft}
            </span>
          </div>

          <button
            onClick={() => {
              if (isPlaying && !isGameOver && !isStageClear) setIsPaused((p) => !p);
            }}
            disabled={!isPlaying || isGameOver || isStageClear}
            className="px-2.5 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40"
          >
            {isPaused ? 'Resume' : 'Pause (P)'}
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative w-full max-w-[640px] aspect-[16/10] rounded-2xl overflow-hidden border-2 border-zinc-800 bg-[#38bdf8] shadow-2xl">
        <canvas
          ref={canvasRef}
          width={640}
          height={400}
          className="w-full h-full block cursor-pointer"
          onClick={() => {
            if (!isPlaying || isGameOver || isStageClear) resetGame();
          }}
        />

        {/* Start Overlay */}
        {!isPlaying && !isGameOver && !isStageClear && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
              <Play className="w-6 h-6 text-amber-400 fill-amber-400 ml-0.5" />
            </div>
            <h3 className="font-mono text-xl font-bold text-white mb-1">MINI MARIO RUNNER</h3>
            <p className="text-xs text-zinc-400 max-w-sm mb-5">
              Sprint across platforms, punch mystery ? blocks for coins & mushrooms, stomp Goombas, and slide down the victory flagpole!
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-sm rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              START GAME (SPACE)
            </button>
            <span className="text-[11px] text-zinc-500 font-mono mt-3">
              A / D or ← → = Run · Space / W / ↑ = Jump
            </span>
          </div>
        )}

        {/* Pause Overlay */}
        {isPlaying && isPaused && (
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

        {/* Stage Clear Victory Overlay */}
        {isStageClear && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs tracking-widest mb-1">
              <Flag className="w-4 h-4" />
              <span>STAGE COMPLETE</span>
            </div>
            <h3 className="font-mono text-2xl font-bold text-white mb-2">COURSE CLEAR!</h3>
            <div className="text-zinc-400 text-xs font-mono mb-5 flex items-center gap-3">
              <span>Final Score: <strong className="text-amber-400 text-sm">{score}</strong></span>
              <span>·</span>
              <span>Coins: <strong className="text-yellow-300">{coins}</strong></span>
            </div>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-sm rounded-lg shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <span className="text-xs font-mono tracking-widest text-rose-500 mb-1">ALL LIVES LOST</span>
            <h3 className="font-mono text-2xl font-bold text-white mb-2">GAME OVER</h3>
            <div className="text-zinc-400 text-xs font-mono mb-5 flex items-center gap-3">
              <span>Final Score: <strong className="text-amber-400 text-sm">{score}</strong></span>
              <span>·</span>
              <span>Coins: <strong className="text-yellow-300">{coins}</strong></span>
            </div>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-sm rounded-lg shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>TRY AGAIN</span>
            </button>
          </div>
        )}
      </div>

      {/* On-screen controls */}
      <VirtualGamepad
        onDirection={(dir) => {
          if (dir === 'LEFT') {
            keysRef.current.left = true;
            setTimeout(() => {
              keysRef.current.left = false;
            }, 120);
          }
          if (dir === 'RIGHT') {
            keysRef.current.right = true;
            setTimeout(() => {
              keysRef.current.right = false;
            }, 120);
          }
          if (dir === 'UP') {
            keysRef.current.jump = true;
            setTimeout(() => {
              keysRef.current.jump = false;
            }, 120);
          }
        }}
        onActionA={() => {
          keysRef.current.jump = true;
          setTimeout(() => {
            keysRef.current.jump = false;
          }, 150);
        }}
        actionALabel="JUMP"
        onTogglePause={() => {
          if (isPlaying && !isGameOver && !isStageClear) setIsPaused((p) => !p);
        }}
        isPaused={isPaused}
        onRestart={resetGame}
      />
    </div>
  );
};
