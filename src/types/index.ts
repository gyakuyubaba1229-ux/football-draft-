export type Language = 'ja' | 'en' | 'es';

export type GameMode = 'europe' | 'j1' | 'active';

export type MainPosition = 'GK' | 'DF' | 'MF' | 'FW';

export type SubPosition = 
  | 'GK' 
  | 'CB' | 'LB' | 'RB' | 'LWB' | 'RWB'
  | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM'
  | 'LW' | 'RW' | 'CF' | 'ST';

export interface Club {
  id: string;
  name: string;
  nameJa: string;
  nameEn: string;
  nameEs: string;
  shortName: string;
  league: GameMode;
  primaryColor: string;
  secondaryColor: string;
  country: string;
  countryFlag: string;
  badgeSymbol: string;
}

export type PlayerCategory = 'YOUNG' | 'MID' | 'VETERAN' | 'STAR' | 'LEGEND' | 'NORMAL';

export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface Player {
  playerId: string;       // Unique ID for this entry (e.g. 'ronaldo_manutd_2003')
  personId: string;       // Person ID to prevent duplicate person drafting (e.g. 'c_ronaldo')
  playerName: string;     // Primary display name (e.g. 'Cristiano Ronaldo')
  nameJa: string;         // 'クリスティアーノ・ロナウド'
  nameEn: string;         // 'Cristiano Ronaldo'
  nameEs: string;         // 'Cristiano Ronaldo'
  clubId: string;         // 'man_united'
  clubName: string;       // 'Manchester United'
  joiningYear: number;    // 2003
  position: MainPosition; // 'FW'
  subPosition: SubPosition; // 'LW'
  nationality: string;    // 'Portugal'
  nationalityJa: string;  // 'ポルトガル'
  nationalityEn: string;  // 'Portugal'
  nationalityEs: string;  // 'Portugal'
  nationalityFlag: string;// '🇵🇹'
  rating: number;         // 60-99 (Calculated/assigned specific to joiningYear)
  ratingByYear?: Record<number, number>; // Specific era-based OVR map
  category?: PlayerCategory; // 'YOUNG' | 'MID' | 'VETERAN' | 'STAR' | 'LEGEND' | 'NORMAL'
  isLegendary?: boolean;  // Star / Legend player
  stats: PlayerStats;
}

export type FormationType = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1' | '3-4-3' | '5-3-2' | 'CUSTOM';

export interface CustomPlayerPosition {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
}

export interface FormationSlotConfig {
  id: string;
  role: string;
  pos: MainPosition;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
}

export interface FormationConfig {
  name: string;
  slots: FormationSlotConfig[];
}

export const FORMATIONS: Record<Exclude<FormationType, 'CUSTOM'>, FormationConfig> = {
  '4-3-3': {
    name: '4-3-3 Attack',
    slots: [
      { id: 'gk', role: 'GK', pos: 'GK', x: 50, y: 88 },
      { id: 'lb', role: 'LB', pos: 'DF', x: 18, y: 72 },
      { id: 'cb1', role: 'CB', pos: 'DF', x: 38, y: 74 },
      { id: 'cb2', role: 'CB', pos: 'DF', x: 62, y: 74 },
      { id: 'rb', role: 'RB', pos: 'DF', x: 82, y: 72 },
      { id: 'cm1', role: 'CM', pos: 'MF', x: 30, y: 48 },
      { id: 'cdm', role: 'CDM', pos: 'MF', x: 50, y: 56 },
      { id: 'cm2', role: 'CM', pos: 'MF', x: 70, y: 48 },
      { id: 'lw', role: 'LW', pos: 'FW', x: 20, y: 22 },
      { id: 'st', role: 'ST', pos: 'FW', x: 50, y: 16 },
      { id: 'rw', role: 'RW', pos: 'FW', x: 80, y: 22 },
    ],
  },
  '4-4-2': {
    name: '4-4-2 Classic',
    slots: [
      { id: 'gk', role: 'GK', pos: 'GK', x: 50, y: 88 },
      { id: 'lb', role: 'LB', pos: 'DF', x: 18, y: 72 },
      { id: 'cb1', role: 'CB', pos: 'DF', x: 38, y: 74 },
      { id: 'cb2', role: 'CB', pos: 'DF', x: 62, y: 74 },
      { id: 'rb', role: 'RB', pos: 'DF', x: 82, y: 72 },
      { id: 'lm', role: 'LM', pos: 'MF', x: 18, y: 46 },
      { id: 'cm1', role: 'CM', pos: 'MF', x: 38, y: 50 },
      { id: 'cm2', role: 'CM', pos: 'MF', x: 62, y: 50 },
      { id: 'rm', role: 'RM', pos: 'MF', x: 82, y: 46 },
      { id: 'st1', role: 'ST', pos: 'FW', x: 36, y: 20 },
      { id: 'st2', role: 'ST', pos: 'FW', x: 64, y: 20 },
    ],
  },
  '3-5-2': {
    name: '3-5-2 Wing Play',
    slots: [
      { id: 'gk', role: 'GK', pos: 'GK', x: 50, y: 88 },
      { id: 'cb1', role: 'CB', pos: 'DF', x: 26, y: 74 },
      { id: 'cb2', role: 'CB', pos: 'DF', x: 50, y: 76 },
      { id: 'cb3', role: 'CB', pos: 'DF', x: 74, y: 74 },
      { id: 'lm', role: 'LWB', pos: 'MF', x: 14, y: 50 },
      { id: 'cm1', role: 'CM', pos: 'MF', x: 36, y: 52 },
      { id: 'cam', role: 'CAM', pos: 'MF', x: 50, y: 38 },
      { id: 'cm2', role: 'CM', pos: 'MF', x: 64, y: 52 },
      { id: 'rm', role: 'RWB', pos: 'MF', x: 86, y: 50 },
      { id: 'st1', role: 'ST', pos: 'FW', x: 36, y: 18 },
      { id: 'st2', role: 'ST', pos: 'FW', x: 64, y: 18 },
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1 Modern',
    slots: [
      { id: 'gk', role: 'GK', pos: 'GK', x: 50, y: 88 },
      { id: 'lb', role: 'LB', pos: 'DF', x: 18, y: 72 },
      { id: 'cb1', role: 'CB', pos: 'DF', x: 38, y: 74 },
      { id: 'cb2', role: 'CB', pos: 'DF', x: 62, y: 74 },
      { id: 'rb', role: 'RB', pos: 'DF', x: 82, y: 72 },
      { id: 'cdm1', role: 'CDM', pos: 'MF', x: 36, y: 58 },
      { id: 'cdm2', role: 'CDM', pos: 'MF', x: 64, y: 58 },
      { id: 'lam', role: 'LAM', pos: 'MF', x: 24, y: 36 },
      { id: 'cam', role: 'CAM', pos: 'MF', x: 50, y: 34 },
      { id: 'ram', role: 'RAM', pos: 'MF', x: 76, y: 36 },
      { id: 'st', role: 'ST', pos: 'FW', x: 50, y: 16 },
    ],
  },
  '3-4-3': {
    name: '3-4-3 Wide Attack',
    slots: [
      { id: 'gk', role: 'GK', pos: 'GK', x: 50, y: 88 },
      { id: 'cb1', role: 'CB', pos: 'DF', x: 26, y: 74 },
      { id: 'cb2', role: 'CB', pos: 'DF', x: 50, y: 76 },
      { id: 'cb3', role: 'CB', pos: 'DF', x: 74, y: 74 },
      { id: 'lm', role: 'LM', pos: 'MF', x: 16, y: 50 },
      { id: 'cm1', role: 'CM', pos: 'MF', x: 38, y: 52 },
      { id: 'cm2', role: 'CM', pos: 'MF', x: 62, y: 52 },
      { id: 'rm', role: 'RM', pos: 'MF', x: 84, y: 50 },
      { id: 'lw', role: 'LW', pos: 'FW', x: 22, y: 22 },
      { id: 'st', role: 'ST', pos: 'FW', x: 50, y: 16 },
      { id: 'rw', role: 'RW', pos: 'FW', x: 78, y: 22 },
    ],
  },
  '5-3-2': {
    name: '5-3-2 Solid Wall',
    slots: [
      { id: 'gk', role: 'GK', pos: 'GK', x: 50, y: 88 },
      { id: 'lwb', role: 'LWB', pos: 'DF', x: 14, y: 68 },
      { id: 'cb1', role: 'CB', pos: 'DF', x: 32, y: 76 },
      { id: 'cb2', role: 'CB', pos: 'DF', x: 50, y: 77 },
      { id: 'cb3', role: 'CB', pos: 'DF', x: 68, y: 76 },
      { id: 'rwb', role: 'RWB', pos: 'DF', x: 86, y: 68 },
      { id: 'cm1', role: 'CM', pos: 'MF', x: 30, y: 48 },
      { id: 'cdm', role: 'CDM', pos: 'MF', x: 50, y: 54 },
      { id: 'cm2', role: 'CM', pos: 'MF', x: 70, y: 48 },
      { id: 'st1', role: 'ST', pos: 'FW', x: 36, y: 20 },
      { id: 'st2', role: 'ST', pos: 'FW', x: 64, y: 20 },
    ],
  },
};

export interface DraftHistoryEntry {
  id: string;
  playerId: string;
  playerName: string;
  nameJa?: string;
  nameEn?: string;
  nameEs?: string;
  clubId: string;
  clubName: string;
  clubNameJa?: string;
  clubNameEn?: string;
  clubNameEs?: string;
  joiningYear: number;
  position: MainPosition;
  subPosition?: SubPosition;
  nationality?: string;
  nationalityJa?: string;
  nationalityEn?: string;
  nationalityEs?: string;
  nationalityFlag?: string;
  rating: number;
  category?: PlayerCategory;
  isLegendary: boolean;
  timestamp: number;
  mode: GameMode;
  teamId?: string;
  teamNumber?: number;
  teamName?: string;
}

export interface UserTeam {
  teamId: string;
  teamNumber: number;
  name: string; // e.g. "TEAM 1"
  mode: GameMode;
  players: Player[]; // max 11
  formation: FormationType;
  playerSlots: Record<string, string>; // slotId -> playerId
  customPositions: Record<string, CustomPlayerPosition>;
  isCompleted: boolean;
  createdAt: number;
  completedAt?: number;
}

export type BlackBallSpinType = 
  | 'none' 
  | 'normal-blackball' 
  | 'lightning-blackball' 
  | 'golden-ballon-dor'
  | 'golden-lightning-ballon-dor';

export type DraftStagingRarity = 'normal' | 'blackball' | 'golden';

export interface PositionCounts {
  GK: number;
  DF: number;
  MF: number;
  FW: number;
  total: number;
}

// ── BETA PVP & TACTICS TYPES ──

export type AttackTactics =
  | 'POSSESSION'       // ポゼッション
  | 'SHORT_PASS'        // ショートパス
  | 'DIRECT_PLAY'       // ダイレクトプレー
  | 'COUNTER'           // カウンター
  | 'LONG_BALL'         // ロングボール
  | 'WIDE_ATTACK'       // サイド攻撃
  | 'CENTRAL_ATTACK';   // 中央突破

export type DefenseTactics =
  | 'HIGH_PRESS'        // ハイプレス
  | 'MID_BLOCK'         // ミドルブロック
  | 'LOW_BLOCK'         // ローブロック
  | 'HIGH_LINE'         // ハイライン
  | 'DEFENSIVE_FOCUS';  // 守備重視

export interface TeamTactics {
  attackTactic: AttackTactics;
  defenseTactic: DefenseTactics;
  attackDirection: 'WIDE' | 'CENTRAL' | 'BALANCED';
  pressIntensity: 'AGGRESSIVE' | 'CONSERVATIVE' | 'BALANCED';
}

export interface BetaUserProfile {
  userId: string;
  username: string;
  team: UserTeam | null;
  tactics: TeamTactics;
  defenseSquadId?: string;
  updatedAt: number;
}

export interface BetaMatchEvent {
  minute: number;
  textJa: string;
  textEn: string;
  textEs: string;
  type: 'goal' | 'chance' | 'tactic' | 'defense' | 'whistle';
  isChallengerGoal?: boolean;
  isOpponentGoal?: boolean;
}

export interface BetaMatchRecord {
  id: string;
  challengerUserId: string;
  challengerUsername: string;
  opponentUserId: string;
  opponentUsername: string;
  matchType: 'OVR' | 'TACTICAL';
  challengerScore: number;
  opponentScore: number;
  result: 'WIN' | 'DRAW' | 'LOSS';
  points: 3 | 1 | 0;
  challengerOvr: number;
  opponentOvr: number;
  challengerTeamName: string;
  opponentTeamName: string;
  timestamp: number;
  events: BetaMatchEvent[];
  halfTimeScore?: [number, number];
  fullTimeScore: [number, number];
  challengerTactics?: TeamTactics;
  opponentTactics?: TeamTactics;
}

export interface BetaStandingEntry {
  userId: string;
  username: string;
  teamName: string;
  teamOvr: number;
  points: number;
  goalDifference: number;
  goalsFor: number;
  goalsAgainst: number;
  wins: number;
  draws: number;
  losses: number;
  matchesCount: number;
  recent10Matches: BetaMatchRecord[];
  rank?: number;
}

export interface CurrentDraftState {
  activeTeamId: string;
  mode: GameMode;
  selectedYear: number | null;
  selectedClub: Club | null;
  candidatePlayers: Player[];
  isSpinning: boolean;
  hasCurrentDraft: boolean;
  skipsRemaining: number;
  blackBallSpinType: BlackBallSpinType;
  blackBallStage: 'spinning-normal' | 'lightning-striking' | 'blackball-spinning' | 'golden-rain' | 'revealed';
  isBlackBallResult: boolean;
  isGoldenResult?: boolean;
}



