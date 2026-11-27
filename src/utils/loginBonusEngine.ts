import {
  InventoryItemType,
  LoginBonusDayDefinition,
  LoginBonusState,
} from '../types';

export const TOTAL_LOGIN_BONUS_DAYS = 15;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const LOGIN_BONUS_SCHEDULE: LoginBonusDayDefinition[] = [
  {
    day: 1,
    rewards: [{ rewardType: 'training_chip', amount: 3 }],
    labelJa: 'トレーニングチップ ×3',
    labelEn: 'Training Chip ×3',
  },
  {
    day: 2,
    rewards: [{ rewardType: 'awakening_ticket', amount: 1 }],
    labelJa: '覚醒チケット ×1',
    labelEn: 'Awakening Ticket ×1',
  },
  {
    day: 3,
    rewards: [{ rewardType: 'purple_20', amount: 1 }],
    labelJa: '紫20%ガチャ ×1',
    labelEn: 'Purple 20% Scout ×1',
  },
  {
    day: 4,
    rewards: [{ rewardType: 'training_chip', amount: 3 }],
    labelJa: 'トレーニングチップ ×3',
    labelEn: 'Training Chip ×3',
  },
  {
    day: 5,
    rewards: [{ rewardType: 'japan_legend_50', amount: 1 }],
    labelJa: 'レジェンド日本人50%ガチャ ×1',
    labelEn: 'Japan Legend 50% Scout ×1',
  },
  {
    day: 6,
    rewards: [{ rewardType: 'training_chip', amount: 6 }],
    labelJa: 'トレーニングチップ ×6',
    labelEn: 'Training Chip ×6',
  },
  {
    day: 7,
    rewards: [{ rewardType: 'awakening_ticket', amount: 2 }],
    labelJa: '覚醒チケット ×2',
    labelEn: 'Awakening Ticket ×2',
  },
  {
    day: 8,
    rewards: [{ rewardType: 'legend_50', amount: 3 }],
    labelJa: 'レジェンド50%ガチャ ×3',
    labelEn: 'Legend 50% Scout ×3',
  },
  {
    day: 9,
    rewards: [{ rewardType: 'purple_50', amount: 3 }],
    labelJa: '紫50%ガチャ ×3',
    labelEn: 'Purple 50% Scout ×3',
  },
  {
    day: 10,
    rewards: [{ rewardType: 'awakening_ticket', amount: 3 }],
    labelJa: '覚醒チケット ×3',
    labelEn: 'Awakening Ticket ×3',
  },
  {
    day: 11,
    rewards: [{ rewardType: 'training_chip', amount: 12 }],
    labelJa: 'トレーニングチップ ×12',
    labelEn: 'Training Chip ×12',
  },
  {
    day: 12,
    rewards: [{ rewardType: 'position_plus', amount: 1 }],
    labelJa: 'ポジションplus ×1',
    labelEn: 'Position Plus ×1',
  },
  {
    day: 13,
    rewards: [{ rewardType: 'legend_70', amount: 1 }],
    labelJa: 'レジェンド70%ガチャ ×1',
    labelEn: 'Legend 70% Scout ×1',
  },
  {
    day: 14,
    rewards: [{ rewardType: 'training_chip', amount: 5 }],
    labelJa: 'トレーニングチップ ×5',
    labelEn: 'Training Chip ×5',
  },
  {
    day: 15,
    rewards: [{ rewardType: 'legend_purple_guaranteed', amount: 1, expiresInDays: 10 }],
    labelJa: 'レジェンド・紫確定ガチャ ×1',
    labelEn: 'Legend/Purple Guaranteed ×1',
    expiryNoteJa: '受取から10日間有効',
    expiryNoteEn: 'Expires 10 days after claim',
  },
];

/**
 * Returns YYYY-MM-DD in Asia/Tokyo (JST, UTC+9).
 */
export function getJstDateKey(timestampMs: number = Date.now()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date(timestampMs));
  } catch {
    const jstMs = timestampMs + 9 * 60 * 60 * 1000;
    return new Date(jstMs).toISOString().slice(0, 10);
  }
}

export function getMsUntilNextJstMidnight(nowMs: number = Date.now()): number {
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(nowMs + jstOffset);
  const nextMidnightJstUtc = Date.UTC(
    jstNow.getUTCFullYear(),
    jstNow.getUTCMonth(),
    jstNow.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.max(0, nextMidnightJstUtc - jstOffset - nowMs);
}

export function formatCountdownJa(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function createInitialLoginBonusState(): LoginBonusState {
  return {
    currentDay: 1,
    claimedDaysInCycle: [],
    lastClaimedJstDate: null,
    totalClaims: 0,
    cycleCount: 1,
  };
}

export function canClaimLoginBonusToday(
  state: LoginBonusState,
  nowMs: number = Date.now()
): boolean {
  const todayJst = getJstDateKey(nowMs);
  return state.lastClaimedJstDate !== todayJst;
}

export function getRewardDefinitionForDay(day: number): LoginBonusDayDefinition {
  const idx = Math.max(0, Math.min(TOTAL_LOGIN_BONUS_DAYS - 1, Math.floor(day) - 1));
  return LOGIN_BONUS_SCHEDULE[idx];
}

export function computeExpiryTimestamp(expiresInDays?: number, nowMs: number = Date.now()): number | undefined {
  if (!expiresInDays || expiresInDays <= 0) return undefined;
  return nowMs + expiresInDays * ONE_DAY_MS;
}

/**
 * Pure state transition for claiming today's login bonus.
 * Guarantees:
 * - Only 1 claim per JST calendar date
 * - Missed days do NOT advance/skip days
 * - Day 15 claim resets cleanly to Day 1 on next day's cycle
 */
export function applyLoginBonusClaim(
  state: LoginBonusState,
  nowMs: number = Date.now()
): {
  success: boolean;
  claimedDay?: number;
  rewards?: { rewardType: InventoryItemType; amount: number; expiresAt?: number }[];
  nextState: LoginBonusState;
  error?: string;
} {
  const todayJst = getJstDateKey(nowMs);
  if (state.lastClaimedJstDate === todayJst) {
    return {
      success: false,
      nextState: state,
      error: 'ALREADY_CLAIMED_TODAY',
    };
  }

  // If the previous cycle finished all 15 days, start cleanly at Day 1 for the new cycle
  let activeDay = state.currentDay;
  let claimedInCycle = [...(state.claimedDaysInCycle || [])];
  let cycleCount = state.cycleCount || 1;

  if (claimedInCycle.length >= TOTAL_LOGIN_BONUS_DAYS || activeDay > TOTAL_LOGIN_BONUS_DAYS || activeDay < 1) {
    activeDay = 1;
    claimedInCycle = [];
    cycleCount += 1;
  }

  const dayDef = getRewardDefinitionForDay(activeDay);
  const rewards = dayDef.rewards.map((r) => ({
    rewardType: r.rewardType,
    amount: r.amount,
    expiresAt: computeExpiryTimestamp(r.expiresInDays, nowMs),
  }));

  const updatedClaimed = Array.from(new Set([...claimedInCycle, activeDay])).sort((a, b) => a - b);
  const completedCycle = activeDay >= TOTAL_LOGIN_BONUS_DAYS;

  const nextState: LoginBonusState = {
    currentDay: completedCycle ? 1 : activeDay + 1,
    claimedDaysInCycle: completedCycle ? [] : updatedClaimed,
    lastClaimedJstDate: todayJst,
    lastClaimedAt: nowMs,
    totalClaims: (state.totalClaims || 0) + 1,
    cycleCount: completedCycle ? cycleCount + 1 : cycleCount,
  };

  return {
    success: true,
    claimedDay: activeDay,
    rewards,
    nextState,
  };
}
