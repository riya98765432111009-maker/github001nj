/**
 * Shared types for RetroVault classic browser games
 */

export type GameId = 'snake' | 'tetris' | 'mario' | 'bounce' | 'ideas';

export interface GameInfo {
  id: GameId;
  title: string;
  subtitle: string;
  year: string;
  genre: string;
  image: string;
  description: string;
  controlsSummary: string;
}

export interface HighScoreRecord {
  snake: number;
  tetris: number;
  mario: number;
  bounce: number;
}

export type GameState = 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';
