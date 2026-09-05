import { Player, FormationType, MainPosition, FORMATIONS, FormationSlotConfig } from '../types';
import { canPlayerPlayAtPosition, normalizeRoleToEFootball } from './positionEngine';

export const PRESET_FORMATIONS: Exclude<FormationType, 'CUSTOM'>[] = [
  '4-3-3',
  '4-4-2',
  '4-2-3-1',
  '4-3-1-2',
  '4-3-2-1',
  '4-1-4-1',
  '4-2-2-2',
  '4-4-1-1',
  '3-4-3',
  '3-5-2',
  '3-4-2-1',
  '3-4-1-2',
  '5-3-2',
  '5-4-1',
  '5-2-3',
  '4-2-4',
  '4-1-2-3',
  '4-3-3 False 9',
];

/**
 * 自由配置（customPositionsが存在するか）に応じて表示用フォーメーション名を返却します。
 * - 選手を1人でも自由に移動した場合: "カスタムフォーメーション"
 * - 移動していない通常配置の場合: 選択されたフォーメーション名（例: "4-3-3"）
 */
export function getDisplayFormationName(
  formation?: string,
  customPositions?: Record<string, any> | null
): string {
  if (customPositions && Object.keys(customPositions).length > 0) {
    return 'カスタムフォーメーション';
  }
  if (formation === 'CUSTOM') {
    return 'カスタムフォーメーション';
  }
  return formation || '4-3-3';
}

/**
 * チームオブジェクトから表示用フォーメーション名を取得します。
 */
export function getTeamFormationDisplayName(
  team?: { formation?: string; customPositions?: Record<string, any> | null } | null
): string {
  if (!team) return '4-3-3';
  return getDisplayFormationName(team.formation, team.customPositions);
}

/**
 * Identify the best matching base preset for a set of slot IDs.
 */
export function detectBasePresetFromSlots(slotIds: string[]): Exclude<FormationType, 'CUSTOM'> {
  const slotSet = new Set(slotIds);
  let bestPreset: Exclude<FormationType, 'CUSTOM'> = '4-3-3';
  let maxMatches = -1;

  for (const preset of PRESET_FORMATIONS) {
    const presetSlots = FORMATIONS[preset].slots;
    let matches = 0;
    for (const s of presetSlots) {
      if (slotSet.has(s.id)) matches++;
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestPreset = preset;
    }
  }

  return bestPreset;
}

/**
 * Score how well a player matches a given formation slot.
 * Higher score means better suitability.
 */
function calculatePositionSuitability(player: Player, slot: FormationSlotConfig): number {
  const ePos = normalizeRoleToEFootball(slot.role);
  const legalCheck = canPlayerPlayAtPosition(player, ePos);
  if (!legalCheck.allowed) {
    return -9999;
  }

  let score = 0;

  // 1. Exact main position match
  if (player.position === slot.pos) {
    score += 50;
  }

  // 2. Sub-position or role exact match
  const subPos = player.subPosition || player.position;
  if (subPos === slot.role) {
    score += 40;
  } else {
    // Specific role affinities
    if (slot.role === 'GK' && player.position === 'GK') score += 100;
    if (slot.role === 'ST' && ['ST', 'CF'].includes(subPos)) score += 30;
    if (slot.role === 'LW' && ['LW', 'LM'].includes(subPos)) score += 30;
    if (slot.role === 'RW' && ['RW', 'RM'].includes(subPos)) score += 30;
    if (['LAM', 'CAM', 'RAM'].includes(slot.role) && ['CAM', 'CM', 'LW', 'RW', 'CF'].includes(subPos)) score += 25;
    if (['CDM', 'CM'].includes(slot.role) && ['CDM', 'CM'].includes(subPos)) score += 25;
    if (['LB', 'LWB'].includes(slot.role) && ['LB', 'LWB', 'LM'].includes(subPos)) score += 30;
    if (['RB', 'RWB'].includes(slot.role) && ['RB', 'RWB', 'RM'].includes(subPos)) score += 30;
    if (slot.role === 'CB' && ['CB'].includes(subPos)) score += 35;
  }

  return score;
}

/**
 * Remap player slots when changing formations or ensuring full alignment.
 * Guarantees that EVERY player in `players` is assigned to an active slot in `targetFormation`.
 */
export function remapPlayerSlots(
  players: Player[],
  currentSlots: Record<string, string>,
  targetFormation: FormationType,
  currentFormation?: FormationType
): Record<string, string> {
  if (!players || players.length === 0) return {};

  const targetPreset: Exclude<FormationType, 'CUSTOM'> =
    targetFormation === 'CUSTOM'
      ? (currentFormation && currentFormation !== 'CUSTOM'
          ? currentFormation
          : detectBasePresetFromSlots(Object.keys(currentSlots)))
      : targetFormation;

  const targetSlots = FORMATIONS[targetPreset]?.slots || FORMATIONS['4-3-3'].slots;
  const playerMap = new Map<string, Player>();
  for (const p of players) {
    playerMap.set(p.playerId, p);
  }

  const newSlots: Record<string, string> = {};
  const assignedPlayerIds = new Set<string>();
  const availableSlots = [...targetSlots];

  // Pass 1: Retain existing user slot assignments if slot exists in target formation and player is valid
  for (let i = availableSlots.length - 1; i >= 0; i--) {
    const slot = availableSlots[i];
    const prevPlayerId = currentSlots[slot.id];
    if (prevPlayerId && playerMap.has(prevPlayerId) && !assignedPlayerIds.has(prevPlayerId)) {
      newSlots[slot.id] = prevPlayerId;
      assignedPlayerIds.add(prevPlayerId);
      availableSlots.splice(i, 1);
    }
  }

  // Pass 2: If GK slot is still unassigned and an unassigned GK player exists, assign GK to that slot
  const gkSlotIdx = availableSlots.findIndex((s) => s.pos === 'GK' || s.role === 'GK');
  const unassignedGk = players.find((p) => p.position === 'GK' && !assignedPlayerIds.has(p.playerId));
  if (gkSlotIdx !== -1 && unassignedGk) {
    const gkSlot = availableSlots.splice(gkSlotIdx, 1)[0];
    newSlots[gkSlot.id] = unassignedGk.playerId;
    assignedPlayerIds.add(unassignedGk.playerId);
  }

  // List of remaining unassigned players
  const unassignedPlayers = players.filter((p) => !assignedPlayerIds.has(p.playerId));

  // Pass 3: Best-fit matching for remaining players into remaining slots
  while (unassignedPlayers.length > 0 && availableSlots.length > 0) {
    let bestPlayerIdx = -1;
    let bestSlotIdx = -1;
    let highestScore = -Infinity;

    for (let pIdx = 0; pIdx < unassignedPlayers.length; pIdx++) {
      const p = unassignedPlayers[pIdx];
      for (let sIdx = 0; sIdx < availableSlots.length; sIdx++) {
        const slot = availableSlots[sIdx];
        if (p.position === 'GK' && slot.pos !== 'GK') continue;
        if (p.position !== 'GK' && slot.pos === 'GK') continue;

        const score = calculatePositionSuitability(p, slot);
        if (score > highestScore) {
          highestScore = score;
          bestPlayerIdx = pIdx;
          bestSlotIdx = sIdx;
        }
      }
    }

    if (bestPlayerIdx === -1 || bestSlotIdx === -1) {
      bestPlayerIdx = 0;
      bestSlotIdx = 0;
    }

    const assignedPlayer = unassignedPlayers.splice(bestPlayerIdx, 1)[0];
    const assignedSlot = availableSlots.splice(bestSlotIdx, 1)[0];

    newSlots[assignedSlot.id] = assignedPlayer.playerId;
    assignedPlayerIds.add(assignedPlayer.playerId);
  }

  return newSlots;
}

/**
 * Assign a newly drafted player into an optimal open slot.
 */
export function autoAssignSlot(
  player: Player,
  currentSlots: Record<string, string>,
  currentFormation: FormationType
): Record<string, string> {
  const basePreset: Exclude<FormationType, 'CUSTOM'> =
    currentFormation === 'CUSTOM'
      ? detectBasePresetFromSlots(Object.keys(currentSlots))
      : currentFormation;

  const formationSlots = FORMATIONS[basePreset]?.slots || FORMATIONS['4-3-3'].slots;
  const assignedIds = new Set(Object.values(currentSlots));

  // 1. Try matching exact role or position with legality check
  let emptySlot = formationSlots.find((s) => {
    if (currentSlots[s.id] && assignedIds.has(currentSlots[s.id])) return false;
    const ePos = normalizeRoleToEFootball(s.role);
    if (!canPlayerPlayAtPosition(player, ePos).allowed) return false;

    if (player.position === 'GK' && s.role === 'GK') return true;
    if (player.position === 'DF' && ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(s.role)) return true;
    if (player.position === 'MF' && ['CM', 'CDM', 'CAM', 'LM', 'RM', 'LAM', 'RAM'].includes(s.role)) return true;
    if (player.position === 'FW' && ['ST', 'CF', 'LW', 'RW'].includes(s.role)) return true;
    return false;
  });

  // 2. If no role-matched slot is empty, take any available empty slot that is strictly legally allowed
  if (!emptySlot) {
    emptySlot = formationSlots.find((s) => {
      if (currentSlots[s.id] && assignedIds.has(currentSlots[s.id])) return false;
      const ePos = normalizeRoleToEFootball(s.role);
      return canPlayerPlayAtPosition(player, ePos).allowed;
    });
  }

  if (emptySlot) {
    return { ...currentSlots, [emptySlot.id]: player.playerId };
  }

  return currentSlots;
}
