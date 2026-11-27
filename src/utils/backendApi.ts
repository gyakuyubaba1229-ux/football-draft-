import {
  GiftBoxItem,
  RewardTicketType,
  BetaStandingEntry,
  UserInventoryCounts,
  TimedTicketLot,
  LoginBonusState,
  OwnedManagerRecord,
  ItemUsageLogEntry,
  Player,
} from '../types';
import { EFootballPosition } from '../data/playerPositions';
import {
  getStoredUserTickets,
  saveUserTickets,
  saveAllPresents,
  ensureApologyGiftDistributed,
  claimPresentBoxItem,
  claimAllPresentBoxItems,
  consumeUserTicket,
} from './rewardScoutEngine';
import {
  createEmptyInventoryCounts,
  getStoredNonScoutInventory,
  saveNonScoutInventory,
  getStoredOwnedManagers,
  saveOwnedManagers,
  getStoredTimedLots,
  saveTimedLots,
  getStoredUsageLogs,
  saveUsageLogs,
} from './itemBoxEngine';
import {
  PersistedPlayerTrainingState,
  applyTrainingChipToPlayer,
  applyAwakeningToPlayer,
  applyPositionPlusToPlayer,
  extractPersistedPlayerState,
} from './playerTrainingEngine';
import { applyLoginBonusClaim, createInitialLoginBonusState, getJstDateKey } from './loginBonusEngine';
import { getVerifiedPositionsForPlayer } from './positionEngine';

export interface ServerRankingStatus {
  success: boolean;
  weekId: string;
  seasonNumber: number;
  phase: 'ACTIVE' | 'AGGREGATING' | 'FINALIZED';
  phaseTextJa: string;
  phaseTextEn: string;
  matchAcceptanceOpen: boolean;
  startMs: number;
  endMs: number;
  aggregationEndMs: number;
  serverTimeMs: number;
}

export interface ServerUserProgressPayload {
  userId: string;
  inventory: UserInventoryCounts;
  timedLots: TimedTicketLot[];
  loginBonus: LoginBonusState;
  ownedManagers: OwnedManagerRecord[];
  playerStates: Record<string, PersistedPlayerTrainingState>;
  usageLogs: ItemUsageLogEntry[];
  updatedAt: number;
}

const LS_PROGRESS_PREFIX = 'FOOTBALL_DRAFT_USER_PROGRESS_V160_';

function syncProgressToLocalStorage(progress: ServerUserProgressPayload): void {
  try {
    localStorage.setItem(`${LS_PROGRESS_PREFIX}${progress.userId}`, JSON.stringify(progress));
    const scoutTickets: Record<RewardTicketType, number> = {
      normal_ticket: progress.inventory.normal_ticket || 0,
      legend_10: progress.inventory.legend_10 || 0,
      legend_20: progress.inventory.legend_20 || 0,
      legend_50: progress.inventory.legend_50 || 0,
      legend_guaranteed: progress.inventory.legend_guaranteed || 0,
      purple_20: progress.inventory.purple_20 || 0,
      purple_50: progress.inventory.purple_50 || 0,
      purple_guaranteed: progress.inventory.purple_guaranteed || 0,
      legend_purple_50: progress.inventory.legend_purple_50 || 0,
      legend_purple_guaranteed: progress.inventory.legend_purple_guaranteed || 0,
      japan_star_guaranteed: progress.inventory.japan_star_guaranteed || 0,
      japan_legend_50: progress.inventory.japan_legend_50 || 0,
      japan_legend_guaranteed: progress.inventory.japan_legend_guaranteed || 0,
    };
    saveUserTickets(scoutTickets);
    saveNonScoutInventory({
      training_chip: progress.inventory.training_chip || 0,
      awakening_ticket: progress.inventory.awakening_ticket || 0,
      manager_select_ticket: progress.inventory.manager_select_ticket || 0,
      position_plus: progress.inventory.position_plus || 0,
    });
    saveTimedLots(progress.timedLots || []);
    saveOwnedManagers(progress.ownedManagers || []);
    saveUsageLogs(progress.usageLogs || []);
  } catch (e) {
    console.warn('Failed to mirror progress locally:', e);
  }
}

export function getCachedUserProgress(userId: string): ServerUserProgressPayload {
  try {
    const raw = localStorage.getItem(`${LS_PROGRESS_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as ServerUserProgressPayload;
      return {
        ...parsed,
        inventory: { ...createEmptyInventoryCounts(), ...(parsed.inventory || {}) },
        timedLots: parsed.timedLots || [],
        loginBonus: parsed.loginBonus || createInitialLoginBonusState(),
        ownedManagers: parsed.ownedManagers || [],
        playerStates: parsed.playerStates || {},
        usageLogs: parsed.usageLogs || [],
      };
    }
  } catch {
    // ignore parse error
  }
  const tickets = getStoredUserTickets();
  const nonScout = getStoredNonScoutInventory();
  return {
    userId,
    inventory: {
      ...createEmptyInventoryCounts(),
      ...tickets,
      training_chip: nonScout.training_chip || 0,
      awakening_ticket: nonScout.awakening_ticket || 0,
      manager_select_ticket: nonScout.manager_select_ticket || 0,
      position_plus: nonScout.position_plus || 0,
    },
    timedLots: getStoredTimedLots(),
    loginBonus: createInitialLoginBonusState(),
    ownedManagers: getStoredOwnedManagers(),
    playerStates: {},
    usageLogs: getStoredUsageLogs(userId),
    updatedAt: Date.now(),
  };
}

/**
 * Fetch authoritative server ranking phase and schedule status
 */
export async function fetchServerRankingStatus(): Promise<ServerRankingStatus | null> {
  try {
    const res = await fetch('/api/ranking/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // network fallback handled gracefully
  }
  return null;
}

/**
 * Trigger server-side reward calculation & distribution for finalized week
 */
export async function triggerServerRewardDistribution(
  weekId: string,
  standings: BetaStandingEntry[]
): Promise<boolean> {
  try {
    const res = await fetch('/api/ranking/distribute-rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekId, standings }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.success;
    }
  } catch (e) {
    console.warn('Backend reward distribution call error:', e);
  }
  return false;
}

/**
 * Fetch present box items for user
 */
export async function fetchUserPresents(userId: string): Promise<GiftBoxItem[]> {
  try {
    const res = await fetch(`/api/presents/user/${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.presents)) {
        saveAllPresents(data.presents);
        return data.presents;
      }
    }
  } catch {
    // fallback to local storage
  }
  return ensureApologyGiftDistributed(userId);
}

/**
 * Claim present from present box
 */
export async function claimPresent(
  userId: string,
  presentId: string
): Promise<{
  success: boolean;
  claimedItem?: GiftBoxItem;
  updatedPresents: GiftBoxItem[];
  updatedTickets: Record<RewardTicketType, number>;
  progress?: ServerUserProgressPayload;
}> {
  try {
    const res = await fetch('/api/presents/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, presentId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        if (data.progress) {
          syncProgressToLocalStorage(data.progress);
        } else if (data.userTickets) {
          saveUserTickets(data.userTickets);
        }
        const refreshedPresents = await fetchUserPresents(userId);
        return {
          success: true,
          claimedItem: data.claimedItem,
          updatedPresents: refreshedPresents,
          updatedTickets: data.userTickets,
          progress: data.progress,
        };
      }
    }
  } catch (e) {
    console.warn('Backend claim error, using local fallback:', e);
  }

  return claimPresentBoxItem(presentId, userId);
}

/**
 * Claim all unclaimed non-expired presents at once
 */
export async function claimAllPresents(userId: string): Promise<{
  success: boolean;
  claimedCount: number;
  updatedPresents: GiftBoxItem[];
  updatedTickets: Record<RewardTicketType, number>;
  progress?: ServerUserProgressPayload;
}> {
  try {
    const res = await fetch('/api/presents/claim-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        if (data.progress) {
          syncProgressToLocalStorage(data.progress);
        }
        if (Array.isArray(data.updatedPresents)) {
          saveAllPresents(data.updatedPresents);
        }
        return {
          success: true,
          claimedCount: data.claimedCount || 0,
          updatedPresents: data.updatedPresents || [],
          updatedTickets: data.userTickets || getStoredUserTickets(),
          progress: data.progress,
        };
      }
    }
  } catch (e) {
    console.warn('Backend claim-all error, using local fallback:', e);
  }

  return claimAllPresentBoxItems(userId);
}

/**
 * Consume ticket on scout (enforces timed lot expiry on server)
 */
export async function consumeScoutTicket(
  userId: string,
  ticketType: RewardTicketType
): Promise<{
  success: boolean;
  remainingTickets: number;
  updatedTickets: Record<RewardTicketType, number>;
  progress?: ServerUserProgressPayload;
  error?: string;
}> {
  try {
    const res = await fetch('/api/scout/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ticketType }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      if (data.progress) {
        syncProgressToLocalStorage(data.progress);
      } else if (data.userTickets) {
        saveUserTickets(data.userTickets);
      }
      return {
        success: true,
        remainingTickets: data.remainingTickets,
        updatedTickets: data.userTickets,
        progress: data.progress,
      };
    }
    if (res.status === 400) {
      return {
        success: false,
        remainingTickets: 0,
        updatedTickets: getStoredUserTickets(),
        error: data.error || 'No active tickets available',
      };
    }
  } catch (e) {
    console.warn('Backend consume error, using local fallback:', e);
  }

  const ok = consumeUserTicket(ticketType);
  const currentTickets = getStoredUserTickets();
  return {
    success: ok,
    remainingTickets: currentTickets[ticketType] || 0,
    updatedTickets: currentTickets,
  };
}

/**
 * Fetch full Ver.1.6.0 authoritative progress (inventory, lots, login bonus, owned managers, player states, usage logs)
 */
export async function fetchUserProgress(userId: string): Promise<{
  progress: ServerUserProgressPayload;
  todayJst: string;
  serverTimeMs: number;
}> {
  try {
    const res = await fetch(`/api/progress/${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.progress) {
        syncProgressToLocalStorage(data.progress);
        return {
          progress: data.progress,
          todayJst: data.todayJst || getJstDateKey(),
          serverTimeMs: data.serverTimeMs || Date.now(),
        };
      }
    }
  } catch {
    // offline fallback
  }
  return {
    progress: getCachedUserProgress(userId),
    todayJst: getJstDateKey(),
    serverTimeMs: Date.now(),
  };
}

/**
 * Claim today's JST Login Bonus (server-authoritative)
 */
export async function claimLoginBonus(userId: string): Promise<{
  success: boolean;
  claimedDay?: number;
  rewards?: { rewardType: string; amount: number; expiresAt?: number }[];
  progress: ServerUserProgressPayload;
  error?: string;
}> {
  try {
    const res = await fetch('/api/progress/claim-login-bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.progress) {
      syncProgressToLocalStorage(data.progress);
      return {
        success: true,
        claimedDay: data.claimedDay,
        rewards: data.rewards,
        progress: data.progress,
      };
    }
    if (res.status === 400 && data.progress) {
      syncProgressToLocalStorage(data.progress);
      return {
        success: false,
        progress: data.progress,
        error: data.error || 'ALREADY_CLAIMED_TODAY',
      };
    }
  } catch (e) {
    console.warn('Login bonus API error, applying local fallback:', e);
  }

  // Local fallback
  const cached = getCachedUserProgress(userId);
  const now = Date.now();
  const res = applyLoginBonusClaim(cached.loginBonus, now);
  if (!res.success || !res.rewards) {
    return { success: false, progress: cached, error: res.error || 'ALREADY_CLAIMED_TODAY' };
  }
  for (const r of res.rewards) {
    cached.inventory[r.rewardType] = (cached.inventory[r.rewardType] || 0) + r.amount;
    if (r.expiresAt) {
      cached.timedLots.push({
        id: `lot_local_${now}_${Math.random().toString(36).slice(2, 7)}`,
        ticketType: r.rewardType as RewardTicketType,
        initialAmount: r.amount,
        remaining: r.amount,
        grantedAt: now,
        expiresAt: r.expiresAt,
        source: `login_bonus_day_${res.claimedDay}`,
      });
    }
  }
  cached.loginBonus = res.nextState;
  cached.updatedAt = now;
  syncProgressToLocalStorage(cached);
  return {
    success: true,
    claimedDay: res.claimedDay,
    rewards: res.rewards,
    progress: cached,
  };
}

/**
 * Consume 5 Training Chips to level up a player (+1 Level, up to Lv.10 = +5 OVR)
 */
export async function trainPlayerWithChip(
  userId: string,
  player: Player
): Promise<{
  success: boolean;
  updatedPlayer?: Player;
  progress?: ServerUserProgressPayload;
  error?: string;
}> {
  try {
    const res = await fetch('/api/items/train-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, player }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.progress) {
      syncProgressToLocalStorage(data.progress);
      const updated = applyTrainingChipToPlayer(player);
      return { success: true, updatedPlayer: updated, progress: data.progress };
    }
    return { success: false, error: data.error || 'Failed to train player' };
  } catch {
    const cached = getCachedUserProgress(userId);
    if ((cached.inventory.training_chip || 0) < 5) {
      return { success: false, error: 'Insufficient Training Chips' };
    }
    const updated = applyTrainingChipToPlayer(player);
    cached.inventory.training_chip -= 5;
    cached.playerStates[player.playerId] = extractPersistedPlayerState(updated);
    syncProgressToLocalStorage(cached);
    return { success: true, updatedPlayer: updated, progress: cached };
  }
}

/**
 * Consume 1 Awakening Ticket on a Lv.10 player (max 7)
 */
export async function awakenPlayerWithTicket(
  userId: string,
  player: Player
): Promise<{
  success: boolean;
  updatedPlayer?: Player;
  progress?: ServerUserProgressPayload;
  error?: string;
}> {
  try {
    const res = await fetch('/api/items/awaken-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, player }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.progress) {
      syncProgressToLocalStorage(data.progress);
      const updated = applyAwakeningToPlayer(player);
      return { success: true, updatedPlayer: updated, progress: data.progress };
    }
    return { success: false, error: data.error || 'Failed to awaken player' };
  } catch {
    const cached = getCachedUserProgress(userId);
    if ((cached.inventory.awakening_ticket || 0) < 1) {
      return { success: false, error: 'Insufficient Awakening Tickets' };
    }
    const updated = applyAwakeningToPlayer(player);
    cached.inventory.awakening_ticket -= 1;
    cached.playerStates[player.playerId] = extractPersistedPlayerState(updated);
    syncProgressToLocalStorage(cached);
    return { success: true, updatedPlayer: updated, progress: cached };
  }
}

/**
 * Consume 1 Position Plus to grant 1 valid non-duplicate eFootball position
 */
export async function addPositionPlusToPlayer(
  userId: string,
  player: Player,
  targetPosition: EFootballPosition
): Promise<{
  success: boolean;
  updatedPlayer?: Player;
  progress?: ServerUserProgressPayload;
  error?: string;
}> {
  const currentVerifiedPositions = getVerifiedPositionsForPlayer(player);
  try {
    const res = await fetch('/api/items/add-position', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, player, targetPosition, currentVerifiedPositions }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.progress) {
      syncProgressToLocalStorage(data.progress);
      const updated = applyPositionPlusToPlayer(player, targetPosition);
      return { success: true, updatedPlayer: updated, progress: data.progress };
    }
    return { success: false, error: data.error || 'Failed to add position' };
  } catch {
    const cached = getCachedUserProgress(userId);
    if ((cached.inventory.position_plus || 0) < 1) {
      return { success: false, error: 'No Position Plus available' };
    }
    const updated = applyPositionPlusToPlayer(player, targetPosition);
    cached.inventory.position_plus -= 1;
    cached.playerStates[player.playerId] = extractPersistedPlayerState(updated);
    syncProgressToLocalStorage(cached);
    return { success: true, updatedPlayer: updated, progress: cached };
  }
}

/**
 * Consume 1 Manager Select Ticket and grant selected manager
 */
export async function selectManagerWithTicket(
  userId: string,
  managerId: string,
  managerName: string
): Promise<{
  success: boolean;
  alreadyOwned?: boolean;
  ownedManagers?: OwnedManagerRecord[];
  progress?: ServerUserProgressPayload;
  error?: string;
}> {
  try {
    const res = await fetch('/api/items/select-manager', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, managerId, managerName }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.progress) {
      syncProgressToLocalStorage(data.progress);
      return {
        success: true,
        alreadyOwned: data.alreadyOwned,
        ownedManagers: data.ownedManagers,
        progress: data.progress,
      };
    }
    return { success: false, error: data.error || 'Failed to select manager' };
  } catch {
    const cached = getCachedUserProgress(userId);
    if ((cached.inventory.manager_select_ticket || 0) < 1) {
      return { success: false, error: 'No Manager Select Ticket available' };
    }
    const alreadyOwned = cached.ownedManagers.some((m) => m.managerId === managerId);
    cached.inventory.manager_select_ticket -= 1;
    if (!alreadyOwned) {
      cached.ownedManagers.push({
        managerId,
        acquiredAt: Date.now(),
        source: 'manager_select_ticket',
      });
    }
    syncProgressToLocalStorage(cached);
    return {
      success: true,
      alreadyOwned,
      ownedManagers: cached.ownedManagers,
      progress: cached,
    };
  }
}

/**
 * Record manager recruited via the 1-per-game Manager Draft Gacha
 */
export async function recordDraftedManager(
  userId: string,
  managerId: string
): Promise<void> {
  try {
    const res = await fetch('/api/managers/record-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, managerId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.progress) syncProgressToLocalStorage(data.progress);
    }
  } catch {
    const cached = getCachedUserProgress(userId);
    if (!cached.ownedManagers.some((m) => m.managerId === managerId)) {
      cached.ownedManagers.push({
        managerId,
        acquiredAt: Date.now(),
        source: 'draft_gacha',
      });
      syncProgressToLocalStorage(cached);
    }
  }
}
