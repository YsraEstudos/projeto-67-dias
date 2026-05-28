export const CENTRAL_FOLDER_ID = '67-days';
export const CENTRAL_FOLDER_NAME = '67 Days';

export const GAME_STATUSES = ['PLAYING', 'COMPLETED', 'WISHLIST', 'ABANDONED', 'PAUSED'] as const;
export type GameStatus = typeof GAME_STATUSES[number];

// Configuração centralizada de labels e cores para status de games
export const GAME_STATUS_CONFIG: Record<GameStatus, { label: string; color: string }> = {
  PLAYING: { label: 'Jogando', color: 'purple' },
  COMPLETED: { label: 'Zerado', color: 'emerald' },
  WISHLIST: { label: 'Desejado', color: 'blue' },
  ABANDONED: { label: 'Dropado', color: 'red' },
  PAUSED: { label: 'Pausado', color: 'amber' },
};

export const getGameStatusLabel = (status: GameStatus): string =>
  GAME_STATUS_CONFIG[status]?.label ?? status;

export interface GameFolder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  isProtected?: boolean;  // Pastas protegidas não podem ser excluídas
}

export interface GameMission {
  id: string;
  title: string;
  isCompleted: boolean;
  reward?: string; // XP or Text reward
}

export interface GameLog {
  id: string;
  date: string;
  hoursPlayed: number;
}

export interface GameStory {
  id: string;
  content: string;               // Original text
  translatedContent?: string;    // Translated text
  imageUrl?: string;             // Story image URL
  imageStoragePath?: string;     // Firebase Storage path for uploaded images
  arc?: string;                  // Game arc (e.g., "Capítulo 1", "Arco do Vulcão")
  originalLanguage?: string;     // Original language code or label
  translatedLanguage?: string;   // Translated language code or label
  createdAt: number;
  updatedAt: number;
}

export interface Game {
  id: string;
  title: string;
  platform: string; // PC, PS5, Switch, etc.
  status: GameStatus;
  rating?: number; // 0-5 stars
  coverUrl?: string;

  folderId?: string; // Optional folder assignment

  // Time Tracking
  hoursPlayed: number;
  totalHoursEstimate?: number; // How long to beat?

  missions: GameMission[];
  history: GameLog[];
  stories?: GameStory[]; // Sistema de Histórias

  notes?: string;

  // Sistema de resenhas
  review?: string;         // Texto da resenha
  reviewPending?: boolean; // Marcar para escrever resenha depois

  createdAt: number;
  updatedAt: number;
}
