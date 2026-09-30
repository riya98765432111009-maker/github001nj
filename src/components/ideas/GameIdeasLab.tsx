import React, { useState } from 'react';
import {
  Sparkles,
  Gamepad2,
  Code2,
  Sliders,
  CheckCircle2,
  Copy,
  Lightbulb,
  Cpu,
  Layers,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface GameIdea {
  id: string;
  title: string;
  genre: 'Reflex' | 'Puzzle' | 'Physics' | 'Strategy';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  pitch: string;
  whyBrowser: string;
  coreLoop: string[];
  techStack: string;
  modernTwist: string;
}

const CLASSIC_IDEAS: GameIdea[] = [
  {
    id: 'space-invaders',
    title: 'Space Invaders / Galaga Fleet',
    genre: 'Reflex',
    difficulty: 'Beginner',
    pitch: 'Defend Earth against descending ranks of alien marchers that speed up as their numbers decrease.',
    whyBrowser: 'Perfect for canvas 2D rendering. Matrix-based fleet grid with simple bullet ray-casting.',
    coreLoop: [
      'Fleet moves in a zigzag grid, stepping down upon touching screen edges',
      'Player moves horizontally behind destructible defense bunkers',
      'Enemy tempo and music pitch accelerate exponentially as fewer invaders remain',
    ],
    techStack: 'HTML5 2D Canvas, Sprite bounding box collision, Web Audio noise generator',
    modernTwist: 'Add temporary gravitational black holes or bullet ricochet mechanics against ceiling.',
  },
  {
    id: 'pac-chomper',
    title: 'Pac-Dot Maze Runner',
    genre: 'Strategy',
    difficulty: 'Intermediate',
    pitch: 'Navigate a tight maze, devour glowing dots, and outmaneuver four ghosts with distinct artificial intelligence personalities.',
    whyBrowser: 'Tile-based navigation (28x36 grid) is exceptionally lightweight and performs at 120 FPS anywhere.',
    coreLoop: [
      'Tile array determines walls, corridors, intersections, and dots',
      'Ghost AI: Blinky targets player directly; Pinky targets 4 tiles ahead; Inky ambushes; Clyde wanders',
      'Energizer pellet turns ghosts vulnerable for a timed score multiplier rush',
    ],
    techStack: 'Tile grid array, Manhattan distance AI targeting, corner buffer queue',
    modernTwist: 'Procedurally generated roguelike mazes with consumable teleportation scrolls.',
  },
  {
    id: 'minesweeper',
    title: 'Tactical Minesweeper',
    genre: 'Puzzle',
    difficulty: 'Beginner',
    pitch: 'Deduce hidden explosives in a minefield using numerical proximity clues and precise flagging.',
    whyBrowser: 'Can be rendered with pure React components or a single canvas with instant zero-overhead state.',
    coreLoop: [
      'Recursive flood-fill reveal for 0-mine cells',
      'Constraint satisfaction deduction without guessing on smart seeds',
      'Flag toggling with timer speedrun leaderboards',
    ],
    techStack: '2D matrix, Breadth-First-Search (BFS) flood fill, right-click flag listener',
    modernTwist: 'Hexagonal mine grids or rotating 3D isometric cube faces.',
  },
  {
    id: 'lunar-lander',
    title: 'Lunar Lander / Vector Thrust',
    genre: 'Physics',
    difficulty: 'Intermediate',
    pitch: 'Pilot a fragile spacecraft using delicate directional thrust and limited fuel to touch down smoothly on rugged terrain.',
    whyBrowser: 'Delivers pure physics gratification with vectors, gravity, and angular momentum.',
    coreLoop: [
      'Continuous downward gravity vector applied to ship velocity',
      'Thruster consumes fuel to add velocity in current rotation angle',
      'Safe landing requires landing gear parallel to flat terrain with velocity < threshold',
    ],
    techStack: 'Euler integration physics, Midpoint displacement terrain generator, Vector lines',
    modernTwist: 'Dynamic planetary gravity fields with asteroid debris swarms.',
  },
  {
    id: 'frogger',
    title: 'Frogger Highway & River Crossing',
    genre: 'Reflex',
    difficulty: 'Beginner',
    pitch: 'Guide travelers across a lethal multi-lane highway and treacherous river of moving logs and crocodiles.',
    whyBrowser: 'Classic lane-based coordinate system is ideal for clean, deterministic browser gameplay.',
    coreLoop: [
      'Each row is an independent conveyor belt with distinct speed and direction',
      'Player snaps discretely in 4 cardinal directions',
      'River mechanics require sticking to moving log platforms while avoiding water',
    ],
    techStack: 'Lane array loop, AABB axis-aligned bounding box collision, discrete step grid',
    modernTwist: 'Lanes speed up or change direction based on rhythm / music beats.',
  },
  {
    id: 'flappy-impulse',
    title: 'Flappy Gravity Jumper',
    genre: 'Reflex',
    difficulty: 'Beginner',
    pitch: 'Tap to flap upwards against ruthless gravity, slipping through narrow pipe apertures.',
    whyBrowser: 'Extremely viral 1-button accessibility; operates flawlessly on mobile touch screens.',
    coreLoop: [
      'Downward gravity constant constantly increases Y velocity',
      'Single tap applies instantaneous negative Y impulse and tilts sprite upwards',
      'Obstacle pipes scroll left with randomized gap altitudes',
    ],
    techStack: 'Single-variable physics, circle-to-box collision detection, parallax backgrounds',
    modernTwist: 'Dual-bird mode where left click controls Bird 1 and right click controls Bird 2.',
  },
  {
    id: 'number-2048',
    title: '2048 Number Merge',
    genre: 'Puzzle',
    difficulty: 'Beginner',
    pitch: 'Slide tiles on a 4x4 grid; identical numbers combine into their sum, striving towards tile 2048.',
    whyBrowser: 'Pure state machine delight. CSS transform animations feel tactile and silky smooth.',
    coreLoop: [
      'Swipe/arrow collapses row or column vectors in chosen direction',
      'Adjacent matching numbers merge into single doubled value',
      'Random 2 or 4 spawns in open matrix cell after every valid slide',
    ],
    techStack: '4x4 Number Array, CSS transition transforms, touch swipe gestures',
    modernTwist: 'Fibonacci sequence numbers or RPG combat elements attached to merged numbers.',
  },
  {
    id: 'asteroids',
    title: 'Asteroids Vector Drift',
    genre: 'Physics',
    difficulty: 'Intermediate',
    pitch: 'Rotate and thrust in 360-degree space, pulverizing space boulders into smaller, faster fragments.',
    whyBrowser: 'Toroidal wrap-around physics on HTML5 canvas is effortless and visually mesmerizing.',
    coreLoop: [
      'Ship possesses rotational angle, friction decay, and velocity vectors',
      'Passing off screen edge wraps ship to opposite coordinate',
      'Shooting large asteroid spawns two medium fragments; medium spawns two fast small ones',
    ],
    techStack: 'Trigonometric rotation (Math.cos/sin), Circle-polygon collision, Vector lines',
    modernTwist: 'Laser beam reflection off magnetic forcefields and collectible upgrade cores.',
  },
  {
    id: 'sokoban',
    title: 'Sokoban Warehouse Pusher',
    genre: 'Puzzle',
    difficulty: 'Intermediate',
    pitch: 'Push heavy storage crates onto designated target storage goals without trapping boxes in dead corners.',
    whyBrowser: 'Turn-based puzzle with instantaneous undo stack; ideal for brain-teasing sessions.',
    coreLoop: [
      'Player can push one box forward if space behind it is unoccupied',
      'Deadlock detection warns when box is permanently trapped against orthogonal walls',
      'Full history stack allows unlimited undo (Ctrl+Z)',
    ],
    techStack: '2D Tile maps, State immutable history stack, ASCII level parser',
    modernTwist: 'Portals, ice sliding floors, or lasers that activate when crates depress pressure plates.',
  },
  {
    id: 'pong-duel',
    title: 'Pong Curve Master',
    genre: 'Reflex',
    difficulty: 'Beginner',
    pitch: 'The original 1972 digital table tennis rally with English spin mechanics and smart AI paddle.',
    whyBrowser: 'Takes under 100 lines of code; lowest entry barrier for game development exploration.',
    coreLoop: [
      'Ball travels between left and right player goals',
      'Paddle impact calculates angle based on offset from center',
      'Paddle movement during impact imparts "spin" or curve to trajectory',
    ],
    techStack: 'Canvas 2D, Lerp AI opponent tracking, audio beep oscillations',
    modernTwist: 'Curved circular arena, multi-ball madness, or magnetic gravity paddles.',
  },
  {
    id: 'tower-defense',
    title: 'Micro Tower Defense',
    genre: 'Strategy',
    difficulty: 'Advanced',
    pitch: 'Construct specialized laser, freeze, and artillery towers along a winding path to halt invading creep waves.',
    whyBrowser: 'Deep strategy loop with upgrade economies and visual particle pyrotechnics.',
    coreLoop: [
      'Enemies follow waypoint path towards player fortress',
      'Towers calculate target within radius and fire projectiles on cooldown',
      'Gold earned from defeated creeps funds tower upgrades and range expansions',
    ],
    techStack: 'Distance calculation, cooldown timers, particle systems, pathfinding arrays',
    modernTwist: 'Elemental tower combinations (e.g., Water + Electricity creates chain shock).',
  },
  {
    id: 'whack-a-mole',
    title: 'Neon Reaction Tap',
    genre: 'Reflex',
    difficulty: 'Beginner',
    pitch: 'Test lightning reflexes as targets pop up from holes for fleeting fractions of a second.',
    whyBrowser: 'Exceptional for touch screens and mobile web browsers with haptic or audio feedback.',
    coreLoop: [
      'Holes randomly pop up targets with randomized lifetimes',
      'Clicking target awards points and spawns particle explosion',
      'Penalty bombs masquerade as targets to punish reckless spamming',
    ],
    techStack: 'Timeout state scheduler, SVG burst animations, local leaderboard storage',
    modernTwist: 'Rhythm matching where moles pop in sync with a retro synth track.',
  },
];

export const GameIdeasLab: React.FC = () => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [activeIdea, setActiveIdea] = useState<GameIdea>(CLASSIC_IDEAS[0]);

  // Concept Generator state
  const [selectedMechanic, setSelectedMechanic] = useState<string>('Inverted Gravity');
  const [selectedTheme, setSelectedTheme] = useState<string>('Neon Synthwave 80s');
  const [selectedTwist, setSelectedTwist] = useState<string>('Time Slowdown on Near Miss');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Filtered ideas list
  const filteredIdeas =
    selectedGenre === 'All'
      ? CLASSIC_IDEAS
      : CLASSIC_IDEAS.filter((item) => item.genre === selectedGenre);

  // Generate customized game blueprint
  const generatedTitle = `${selectedMechanic.split(' ')[0]} ${selectedTheme.split(' ')[0]} Odyssey`;
  const generatedPitch = `A fast-paced browser arcade game set in a ${selectedTheme.toLowerCase()} universe where players master ${selectedMechanic.toLowerCase()} alongside ${selectedTwist.toLowerCase()}!`;

  const copyBlueprint = () => {
    const text = `
// Game Concept: ${generatedTitle}
// Theme: ${selectedTheme}
// Core Mechanic: ${selectedMechanic}
// Special Twist: ${selectedTwist}

interface GameState {
  score: number;
  player: { x: number; y: number; vx: number; vy: number; state: string };
  gravityScale: number; // For ${selectedMechanic}
  timeScale: number;    // For ${selectedTwist}
}

function updateGame(delta: number, state: GameState) {
  // 1. Apply customized mechanic
  state.player.vy += 0.5 * state.gravityScale * state.timeScale;
  state.player.x += state.player.vx * state.timeScale;
  state.player.y += state.player.vy * state.timeScale;

  // 2. Near miss detection trigger
  // checkNearMiss(state);
}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Editorial Title Section */}
      <div className="border-b border-zinc-800 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
          Classic Browser Games Architecture & Ideas Lab
        </h2>
        <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
          Browser canvas games thrive on elegance: deterministic math, crisp responsive loops, and immediate player feedback. Explore 12+ time-tested game archetypes, study their engineering blueprints, or mix and match core mechanics to craft your own browser title.
        </p>
      </div>

      {/* Genre Filter Tabs - Functional Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
          {['All', 'Reflex', 'Physics', 'Puzzle', 'Strategy'].map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
                selectedGenre === genre
                  ? 'bg-zinc-800 text-purple-400 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-zinc-500">
          Showing {filteredIdeas.length} game blueprints
        </div>
      </div>

      {/* Main Split: Left Sidebar List, Right Deep Dive Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Game Archetype Cards */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredIdeas.map((idea) => {
            const isSelected = activeIdea.id === idea.id;
            return (
              <div
                key={idea.id}
                onClick={() => setActiveIdea(idea)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-purple-950/30 border-purple-500/60 shadow-md ring-1 ring-purple-500/40'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm text-zinc-100">
                    {idea.title}
                  </h3>
                  {/* Clean unboxed metadata with dot separator */}
                  <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 shrink-0">
                    <span>{idea.genre}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        idea.difficulty === 'Beginner'
                          ? 'text-emerald-400'
                          : idea.difficulty === 'Intermediate'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }
                    >
                      {idea.difficulty}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {idea.pitch}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Side: Deep Dive Blueprint & Technical Specs */}
        <div className="lg:col-span-7 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-zinc-800/80 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h3 className="text-xl font-bold font-mono text-white">
                {activeIdea.title}
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <span>Genre: <strong className="text-purple-400">{activeIdea.genre}</strong></span>
                <span>·</span>
                <span>Complexity: <strong className="text-zinc-200">{activeIdea.difficulty}</strong></span>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed mt-2">
              {activeIdea.pitch}
            </p>
          </div>

          {/* Why it works so well in the browser */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-purple-400">
              <Lightbulb className="w-4 h-4" />
              <span>Browser Advantage</span>
            </div>
            <p className="text-xs text-zinc-300 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80 leading-relaxed">
              {activeIdea.whyBrowser}
            </p>
          </div>

          {/* Core Loop Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
              <Cpu className="w-4 h-4" />
              <span>Core Game Loop</span>
            </div>
            <ul className="space-y-2 text-xs text-zinc-300">
              {activeIdea.coreLoop.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono font-bold mt-0.5">{idx + 1}.</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Technology & Modern Twist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 bg-zinc-950/50 rounded-xl border border-zinc-800">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Data Structures & Math
              </span>
              <p className="text-xs font-mono text-cyan-300 leading-relaxed">
                {activeIdea.techStack}
              </p>
            </div>
            <div className="p-3.5 bg-zinc-950/50 rounded-xl border border-zinc-800">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Modern Gameplay Twist
              </span>
              <p className="text-xs text-amber-300 leading-relaxed">
                {activeIdea.modernTwist}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Interactive Arcade Concept Mixer & Blueprint Generator */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-mono uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Game Ideator</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Arcade Concept Mixer & Architecture Generator
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Combine mechanics, art directions, and gameplay hooks to generate ready-to-build browser game design documents.
          </p>
        </div>

        {/* Mixer Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Core Mechanic */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-300 block">
              1. Core Mechanic
            </label>
            <select
              value={selectedMechanic}
              onChange={(e) => setSelectedMechanic(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 text-xs font-mono text-zinc-200 rounded-lg p-2.5 focus:border-purple-500 focus:outline-none"
            >
              <option value="Inverted Gravity">Inverted Gravity (Ceiling Walking)</option>
              <option value="Chain Reactions">Chain Explosions & Dominoes</option>
              <option value="Shrinking Arena">Shrinking Boundary / Ring of Fire</option>
              <option value="Dual Paddle Control">Dual Asymmetric Paddle Control</option>
              <option value="Rewind Time">3-Second Time Rewind</option>
              <option value="Color Polarity">Color Polarity Phase Shifting</option>
            </select>
          </div>

          {/* 2. Visual Theme */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-300 block">
              2. Visual Aesthetic
            </label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 text-xs font-mono text-zinc-200 rounded-lg p-2.5 focus:border-purple-500 focus:outline-none"
            >
              <option value="Neon Synthwave 80s">Neon Synthwave 80s</option>
              <option value="Monochrome GameBoy Green">Monochrome GameBoy 4-Shade</option>
              <option value="Cyberpunk Terminal Amber">Cyberpunk Terminal Amber</option>
              <option value="Solarpunk Botanical">Solarpunk Organic Botanical</option>
              <option value="Minimalist Blueprint Vector">Minimalist Blueprint Vector</option>
            </select>
          </div>

          {/* 3. Special Twist */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-300 block">
              3. Gameplay Hook / Twist
            </label>
            <select
              value={selectedTwist}
              onChange={(e) => setSelectedTwist(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 text-xs font-mono text-zinc-200 rounded-lg p-2.5 focus:border-purple-500 focus:outline-none"
            >
              <option value="Time Slowdown on Near Miss">Time Slowdown on Near Misses</option>
              <option value="One Bullet Magazine">Single Bullet (Must Retrieve After Firing)</option>
              <option value="Pacifist Score Bonus">Pacifist Bonus (Never Kill Any Enemy)</option>
              <option value="Blind Spot Radar">Fog of War / Echo-location Radar</option>
              <option value="Roguelike Card Upgrades">3-Choice Card Upgrades per Wave</option>
            </select>
          </div>
        </div>

        {/* Generated Output Card */}
        <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-purple-400 tracking-wider uppercase block">
                Generated Game Concept
              </span>
              <h4 className="text-lg font-bold font-mono text-white mt-0.5">
                {generatedTitle}
              </h4>
            </div>
            <button
              onClick={copyBlueprint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-950/50 hover:bg-purple-900/60 text-xs font-mono text-purple-300 active:scale-95 transition-all cursor-pointer"
            >
              {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Blueprint Copied!' : 'Copy Code Blueprint'}</span>
            </button>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            {generatedPitch}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-zinc-900/80 rounded border border-zinc-800/80">
              <span className="text-zinc-500 block text-[10px]">RENDER METHOD</span>
              <span className="text-zinc-200">HTML5 Canvas 2D Context</span>
            </div>
            <div className="p-2.5 bg-zinc-900/80 rounded border border-zinc-800/80">
              <span className="text-zinc-500 block text-[10px]">TIME COMPLEXITY</span>
              <span className="text-zinc-200">O(N) Particle & Entity Pass</span>
            </div>
            <div className="p-2.5 bg-zinc-900/80 rounded border border-zinc-800/80">
              <span className="text-zinc-500 block text-[10px]">AUDIO PALETTE</span>
              <span className="text-zinc-200">Web Audio API Synth Oscillators</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
