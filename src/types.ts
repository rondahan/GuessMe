export interface Player {
  id: string;
  name: string;
  character: string; // Assigned character title
  guessedCorrectly: boolean | null; // null = pending, true = won, false = lost
  hasGuessed: boolean;
  avatarSeed: string;
  isCreator: boolean;
}

export interface Room {
  id: string; // The 4 uppercase letter code
  code: string;
  categoryName: string;
  categoryId: string;
  status: 'lobby' | 'active' | 'summary';
  creatorId: string;
  activePlayerIndex: number;
  timeLeft: number;
  isTimerRunning: boolean;
  turnDuration: number;
  turnCount: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  items: string[];
}

export type GamePhase = 'setup' | 'distribution' | 'active' | 'summary';

export interface TurnLog {
  id: string;
  playerName: string;
  targetCharacter: string;
  result: 'yes' | 'no' | 'neutral';
  timestamp: string;
}

