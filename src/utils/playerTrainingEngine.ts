import { Player, PlayerStats, UserTeam } from '../types';
import { EFootballPosition } from '../data/playerPositions';
import { getVerifiedPositionsForPlayer } from './positionEngine';

export const MAX_PLAYER_LEVEL = 10;
export const MIN_PLAYER_LEVEL = 1;
export const CHIPS_PER_LEVEL = 5;
export const MAX_AWAKENING_LEVEL = 7;

// 1-indexed via [level - 1]: Level 1 gives +0 OVR, Level 10 guarantees +5 OVR
export const LEVEL_OVR_BONUS: readonly number[] = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5];

export const ALL_EFOOTBALL_POSITIONS: readonly EFootballPosition[] = [
  'GK',
  'CB',
  'LB',
  'RB',
  'LWB',
  'RWB',
  'DMF',
  'CMF',
  'LMF',
  'RMF',
  'AMF',
  'LWG',
  'RWG',
  'SS',
  'CF',
];

export interface PersistedPlayerTrainingState {
  playerId: string;
  baseRating: number;
  baseStats: PlayerStats;
  level: number;
  awakeningLevel: number;
  addedPositions: EFootballPosition[];
  updatedAt: number;
}

export function clampPlayerLevel(level?: number): number {
  const n = typeof level === 'number' && Number.isFinite(level) ? Math.floor(level) : MIN_PLAYER_LEVEL;
  return Math.max(MIN_PLAYER_LEVEL, Math.min(MAX_PLAYER_LEVEL, n));
}

export function clampAwakeningLevel(awakeningLevel?: number): number {
  const n = typeof awakeningLevel === 'number' && Number.isFinite(awakeningLevel) ? Math.floor(awakeningLevel) : 0;
  return Math.max(0, Math.min(MAX_AWAKENING_LEVEL, n));
}

export function getOvrBonusForLevel(level?: number): number {
  const clamped = clampPlayerLevel(level);
  return LEVEL_OVR_BONUS[clamped - 1] ?? 0;
}

export function getStatBonusForLevel(level?: number): number {
  const clamped = clampPlayerLevel(level);
  if (clamped <= 1) return 0;
  // Smooth +0 to +5 stat growth across Lv.1..Lv.10
  return LEVEL_OVR_BONUS[clamped - 1] ?? 0;
}

export function ensurePlayerTrainingDefaults(player: Player): Player {
  const level = clampPlayerLevel(player.level);
  const awakeningLevel = clampAwakeningLevel(player.awakeningLevel);
  const baseRating =
    typeof player.baseRating === 'number' && Number.isFinite(player.baseRating)
      ? player.baseRating
      : Math.max(40, player.rating - getOvrBonusForLevel(level));
  const baseStats: PlayerStats = player.baseStats
    ? { ...player.baseStats }
    : { ...player.stats };
  const addedPositions = Array.isArray(player.addedPositions)
    ? Array.from(new Set(player.addedPositions))
    : [];

  const bonus = getOvrBonusForLevel(level);
  const statBonus = getStatBonusForLevel(level);

  const computedStats: PlayerStats = {
    pace: Math.min(109, baseStats.pace + statBonus),
    shooting: Math.min(109, baseStats.shooting + statBonus),
    passing: Math.min(109, baseStats.passing + statBonus),
    dribbling: Math.min(109, baseStats.dribbling + statBonus),
    defending: Math.min(109, baseStats.defending + statBonus),
    physical: Math.min(109, baseStats.physical + statBonus),
  };

  return {
    ...player,
    baseRating,
    baseStats,
    level,
    awakeningLevel,
    addedPositions,
    rating: baseRating + bonus,
    stats: computedStats,
  };
}

export function canTrainPlayerLevel(
  player: Player,
  chipBalance: number
): { allowed: boolean; reasonJa: string; reasonEn: string } {
  const normalized = ensurePlayerTrainingDefaults(player);
  const currentLevel = normalized.level ?? 1;

  if (currentLevel >= MAX_PLAYER_LEVEL) {
    return {
      allowed: false,
      reasonJa: `すでに最大レベル（Lv.${MAX_PLAYER_LEVEL}）に到達しています。`,
      reasonEn: `Already at maximum level (Lv.${MAX_PLAYER_LEVEL}).`,
    };
  }

  if (chipBalance < CHIPS_PER_LEVEL) {
    return {
      allowed: false,
      reasonJa: `トレーニングチップが不足しています（必要: ${CHIPS_PER_LEVEL}枚 / 所持: ${chipBalance}枚）。`,
      reasonEn: `Insufficient Training Chips (need ${CHIPS_PER_LEVEL}, owned ${chipBalance}).`,
    };
  }

  return {
    allowed: true,
    reasonJa: `Lv.${currentLevel} → Lv.${currentLevel + 1} へ育成可能`,
    reasonEn: `Ready to train from Lv.${currentLevel} to Lv.${currentLevel + 1}.`,
  };
}

export function applyTrainingChipToPlayer(player: Player): Player {
  const normalized = ensurePlayerTrainingDefaults(player);
  const currentLevel = clampPlayerLevel(normalized.level);
  if (currentLevel >= MAX_PLAYER_LEVEL) {
    return normalized;
  }
  const nextLevel = currentLevel + 1;
  return ensurePlayerTrainingDefaults({
    ...normalized,
    level: nextLevel,
  });
}

export function canAwakenPlayer(
  player: Player,
  ticketBalance: number
): { allowed: boolean; reasonJa: string; reasonEn: string } {
  const normalized = ensurePlayerTrainingDefaults(player);
  const level = normalized.level ?? 1;
  const awakening = normalized.awakeningLevel ?? 0;

  if (level < MAX_PLAYER_LEVEL) {
    return {
      allowed: false,
      reasonJa: `覚醒はLv.${MAX_PLAYER_LEVEL}の選手のみ実行できます（現在 Lv.${level}）。`,
      reasonEn: `Awakening requires Lv.${MAX_PLAYER_LEVEL} (currently Lv.${level}).`,
    };
  }

  if (awakening >= MAX_AWAKENING_LEVEL) {
    return {
      allowed: false,
      reasonJa: `すでに最大覚醒段階（覚醒 Lv.${MAX_AWAKENING_LEVEL}）に到達しています。`,
      reasonEn: `Already at maximum awakening (Lv.${MAX_AWAKENING_LEVEL}).`,
    };
  }

  if (ticketBalance < 1) {
    return {
      allowed: false,
      reasonJa: '覚醒チケットを所持していません。',
      reasonEn: 'You do not own any Awakening Tickets.',
    };
  }

  return {
    allowed: true,
    reasonJa: `覚醒 Lv.${awakening} → Lv.${awakening + 1} へ覚醒可能`,
    reasonEn: `Ready to awaken from Lv.${awakening} to Lv.${awakening + 1}.`,
  };
}

export function applyAwakeningToPlayer(player: Player): Player {
  const normalized = ensurePlayerTrainingDefaults(player);
  const level = clampPlayerLevel(normalized.level);
  const awakening = clampAwakeningLevel(normalized.awakeningLevel);
  if (level < MAX_PLAYER_LEVEL || awakening >= MAX_AWAKENING_LEVEL) {
    return normalized;
  }
  // Awakening strictly increments awakeningLevel without altering OVR or stats
  return ensurePlayerTrainingDefaults({
    ...normalized,
    awakeningLevel: awakening + 1,
  });
}

export function getEligiblePositionPlusOptions(player: Player): EFootballPosition[] {
  if (!player) return [];
  // GK cannot gain outfield positions; outfield players cannot gain GK
  if (player.position === 'GK') {
    return [];
  }
  const currentVerified = new Set(getVerifiedPositionsForPlayer(player));
  return ALL_EFOOTBALL_POSITIONS.filter((pos) => pos !== 'GK' && !currentVerified.has(pos));
}

export function canApplyPositionPlus(
  player: Player,
  targetPosition: EFootballPosition,
  itemBalance: number
): { allowed: boolean; reasonJa: string; reasonEn: string } {
  if (!player) {
    return { allowed: false, reasonJa: '選手が選択されていません。', reasonEn: 'No player selected.' };
  }
  if (itemBalance < 1) {
    return {
      allowed: false,
      reasonJa: 'ポジションplusを所持していません。',
      reasonEn: 'No Position Plus items available.',
    };
  }
  if (player.position === 'GK') {
    return {
      allowed: false,
      reasonJa: 'GK選手にはGK以外の適正ポジションを追加できません。',
      reasonEn: 'Outfield positions cannot be added to a Goalkeeper.',
    };
  }
  if (targetPosition === 'GK') {
    return {
      allowed: false,
      reasonJa: 'フィールドプレイヤーにGK適正を追加することはできません。',
      reasonEn: 'GK position cannot be added to an outfield player.',
    };
  }
  if (!ALL_EFOOTBALL_POSITIONS.includes(targetPosition)) {
    return {
      allowed: false,
      reasonJa: '無効なポジションが指定されました。',
      reasonEn: 'Invalid target position.',
    };
  }
  const verified = getVerifiedPositionsForPlayer(player);
  if (verified.includes(targetPosition)) {
    return {
      allowed: false,
      reasonJa: `この選手はすでに ${targetPosition} の適正を持っています。`,
      reasonEn: `This player already has ${targetPosition} proficiency.`,
    };
  }

  return {
    allowed: true,
    reasonJa: `${targetPosition} 適正を追加可能`,
    reasonEn: `Eligible to add ${targetPosition} proficiency.`,
  };
}

export function applyPositionPlusToPlayer(
  player: Player,
  targetPosition: EFootballPosition
): Player {
  const normalized = ensurePlayerTrainingDefaults(player);
  const existingAdded = Array.isArray(normalized.addedPositions)
    ? [...normalized.addedPositions]
    : [];
  if (!existingAdded.includes(targetPosition)) {
    existingAdded.push(targetPosition);
  }
  // Preserves player.position and player.subPosition cleanly
  return ensurePlayerTrainingDefaults({
    ...normalized,
    addedPositions: existingAdded,
  });
}

export function extractPersistedPlayerState(player: Player): PersistedPlayerTrainingState {
  const normalized = ensurePlayerTrainingDefaults(player);
  return {
    playerId: normalized.playerId,
    baseRating: normalized.baseRating ?? normalized.rating,
    baseStats: normalized.baseStats ?? { ...normalized.stats },
    level: normalized.level ?? 1,
    awakeningLevel: normalized.awakeningLevel ?? 0,
    addedPositions: (normalized.addedPositions || []) as EFootballPosition[],
    updatedAt: Date.now(),
  };
}

export function mergePlayerWithPersistedState(
  player: Player,
  state?: PersistedPlayerTrainingState | null
): Player {
  if (!state) return ensurePlayerTrainingDefaults(player);
  const existingLevel = player.level ?? 1;
  const existingAwakening = player.awakeningLevel ?? 0;
  const mergedLevel = Math.max(existingLevel, clampPlayerLevel(state.level));
  const mergedAwakening = Math.max(existingAwakening, clampAwakeningLevel(state.awakeningLevel));
  const mergedAdded = Array.from(
    new Set([
      ...(Array.isArray(player.addedPositions) ? player.addedPositions : []),
      ...(Array.isArray(state.addedPositions) ? state.addedPositions : []),
    ])
  );

  return ensurePlayerTrainingDefaults({
    ...player,
    baseRating: state.baseRating ?? player.baseRating ?? player.rating,
    baseStats: state.baseStats ?? player.baseStats ?? player.stats,
    level: mergedLevel,
    awakeningLevel: mergedAwakening,
    addedPositions: mergedAdded,
  });
}

export function applyStateMapToTeams(
  teams: UserTeam[],
  stateMap: Record<string, PersistedPlayerTrainingState>
): UserTeam[] {
  if (!stateMap || Object.keys(stateMap).length === 0) {
    return teams;
  }
  return teams.map((team) => ({
    ...team,
    players: team.players.map((p) => mergePlayerWithPersistedState(p, stateMap[p.playerId])),
  }));
}

export function updatePlayerAcrossTeams(teams: UserTeam[], updatedPlayer: Player): UserTeam[] {
  const normalized = ensurePlayerTrainingDefaults(updatedPlayer);
  return teams.map((team) => {
    const hasPlayer = team.players.some((p) => p.playerId === normalized.playerId);
    if (!hasPlayer) return team;
    return {
      ...team,
      players: team.players.map((p) => (p.playerId === normalized.playerId ? normalized : p)),
    };
  });
}
