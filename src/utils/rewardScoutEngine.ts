import {
  Player,
  RewardTicketType,
  GiftBoxItem,
  PastWeeklyRankingHistory,
  BetaStandingEntry,
  MainPosition,
  InventoryItemType,
} from '../types';
import { PURPLE_ACTIVE_PLAYERS, isPurpleCard } from '../data/purpleActivePlayers';
import { EUROPEAN_PLAYERS } from '../data/playersEurope';
import { SPECIAL_BALLON_DOR_PLAYERS } from '../data/legendaryEraDatabase';
import { ALL_PLAYERS } from '../data/playerDatabase';
import { NATIONAL_ERA_PLAYERS, getCurrentJapanStarPool } from '../data/nationalEraDatabase';
import { J1_LEGENDS_EXPANDED } from '../data/playersLegendsJ1';

export type PresentBoxItem = GiftBoxItem;
export type UserRewardTickets = Record<RewardTicketType, number>;
export type ScoutTicketType = RewardTicketType;

export function getTotalTicketsCount(tickets: Record<RewardTicketType, number>): number {
  return Object.values(tickets).reduce((sum, c) => sum + (c || 0), 0);
}

export interface RewardScoutDefinition {
  type: RewardTicketType;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  descriptionEn: string;
  candidateCount: number;
  guaranteedType?: 'legend' | 'purple' | 'both' | 'japan_star' | 'normal' | 'japan_legend' | 'japan_legend_50';
  legendChance: number; // 0 - 1
  purpleChance: number; // 0 - 1
  badgeColor: string;
  accentGradient: string;
  iconName: string;
}

export const REWARD_SCOUT_DEFINITIONS: Record<RewardTicketType, RewardScoutDefinition> = {
  legend_guaranteed: {
    type: 'legend_guaranteed',
    nameJa: 'レジェンド確定スカウト',
    nameEn: 'Legend Guaranteed Scout',
    descriptionJa: '歴史に名を刻むレジェンド選手のみが5名登場。1名を選択してMY TEAMへ追加可能！',
    descriptionEn: '5 legendary icons appear. Pick 1 to add directly to your MY TEAM!',
    candidateCount: 5,
    guaranteedType: 'legend',
    legendChance: 1.0,
    purpleChance: 0.0,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    accentGradient: 'from-amber-500/30 via-yellow-600/20 to-amber-900/40',
    iconName: 'Crown',
  },
  purple_guaranteed: {
    type: 'purple_guaranteed',
    nameJa: '紫確定スカウト',
    nameEn: 'Purple Guaranteed Scout',
    descriptionJa: '世界最高峰の現役スーパースター（OVR 98〜101）のみが5名登場。1名を選択してMY TEAMへ！',
    descriptionEn: '5 world-class modern superstars (OVR 98-101) appear. Pick 1 for your MY TEAM!',
    candidateCount: 5,
    guaranteedType: 'purple',
    legendChance: 0.0,
    purpleChance: 1.0,
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    accentGradient: 'from-purple-600/30 via-fuchsia-600/20 to-purple-950/40',
    iconName: 'Sparkles',
  },
  legend_purple_guaranteed: {
    type: 'legend_purple_guaranteed',
    nameJa: 'レジェンド・紫確定ガチャチケット',
    nameEn: 'Legend / Purple Guaranteed Ticket',
    descriptionJa: '歴史的レジェンドまたは紫演出現役選手のみが5名登場。究極の候補から1名を選択！',
    descriptionEn: '5 elite candidates (Legends or Purple superstars). Pick 1 to reinforce your squad!',
    candidateCount: 5,
    guaranteedType: 'both',
    legendChance: 0.5,
    purpleChance: 0.5,
    badgeColor: 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-yellow-200 border-amber-400/40',
    accentGradient: 'from-amber-600/30 via-purple-700/20 to-stone-900/40',
    iconName: 'Award',
  },
  legend_purple_50: {
    type: 'legend_purple_50',
    nameJa: 'レジェンド・紫50%スカウト',
    nameEn: 'Legend / Purple 50% Scout',
    descriptionJa: '50%の確率でレジェンドまたは紫演出スターが出現！3名の候補から1名を選択。',
    descriptionEn: '50% chance for Legend or Purple superstar staging! Select 1 from 3 candidates.',
    candidateCount: 3,
    legendChance: 0.25,
    purpleChance: 0.25,
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    accentGradient: 'from-indigo-600/30 via-purple-600/20 to-slate-900/40',
    iconName: 'Zap',
  },
  legend_70: {
    type: 'legend_70',
    nameJa: 'レジェンド70%ガチャ',
    nameEn: 'Legend 70% Scout',
    descriptionJa: '70%の確率でレジェンド選手が出現する超激アツ特別スカウト！3名の候補から1名を選択。',
    descriptionEn: '70% chance to trigger a Legendary staging! Choose 1 of 3 candidates.',
    candidateCount: 3,
    legendChance: 0.7,
    purpleChance: 0.0,
    badgeColor: 'bg-amber-400/20 text-amber-200 border-amber-400/50',
    accentGradient: 'from-amber-500/35 via-yellow-600/25 to-stone-900/40',
    iconName: 'Crown',
  },
  legend_50: {
    type: 'legend_50',
    nameJa: 'レジェンド50%スカウト',
    nameEn: 'Legend 50% Scout',
    descriptionJa: '50%の確率でレジェンド選手が出現する高確率スカウト！3名の候補から1名を選択。',
    descriptionEn: '50% chance to trigger a Legendary staging! Choose 1 of 3 candidates.',
    candidateCount: 3,
    legendChance: 0.5,
    purpleChance: 0.0,
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    accentGradient: 'from-yellow-600/30 via-amber-700/20 to-stone-900/40',
    iconName: 'Star',
  },
  legend_20: {
    type: 'legend_20',
    nameJa: 'レジェンド20%スカウト',
    nameEn: 'Legend 20% Scout',
    descriptionJa: '20%の確率でレジェンド選手が出現する特別スカウト！全プレイヤーお詫び配布対象。',
    descriptionEn: '20% chance to summon a Legend! All players receive 1 as an apology gift.',
    candidateCount: 3,
    legendChance: 0.2,
    purpleChance: 0.0,
    badgeColor: 'bg-amber-600/20 text-amber-300 border-amber-600/40',
    accentGradient: 'from-amber-700/30 via-stone-800/40 to-stone-900/40',
    iconName: 'Gift',
  },
  purple_50: {
    type: 'purple_50',
    nameJa: '紫50%スカウト',
    nameEn: 'Purple 50% Scout',
    descriptionJa: '50%の確率で紫演出（OVR 98〜101現役スター）が出現！3名の候補から選択。',
    descriptionEn: '50% chance to summon Purple Active Superstars! Pick 1 of 3 candidates.',
    candidateCount: 3,
    legendChance: 0.0,
    purpleChance: 0.5,
    badgeColor: 'bg-purple-600/20 text-purple-300 border-purple-600/40',
    accentGradient: 'from-purple-700/30 via-fuchsia-900/30 to-slate-900/40',
    iconName: 'Flame',
  },
  purple_20: {
    type: 'purple_20',
    nameJa: '紫20%スカウト',
    nameEn: 'Purple 20% Scout',
    descriptionJa: '20%の確率で紫演出（現役スーパースター）が出現！3名の候補から選択。',
    descriptionEn: '20% chance to summon Purple Active Superstars! Pick 1 of 3 candidates.',
    candidateCount: 3,
    legendChance: 0.0,
    purpleChance: 0.2,
    badgeColor: 'bg-fuchsia-600/20 text-fuchsia-300 border-fuchsia-600/40',
    accentGradient: 'from-fuchsia-700/30 via-purple-900/30 to-slate-900/40',
    iconName: 'Sparkle',
  },
  japan_star_guaranteed: {
    type: 'japan_star_guaranteed',
    nameJa: 'スター日本人選手確定ガチャチケット',
    nameEn: 'Japan NT Star Guaranteed Ticket',
    descriptionJa: '現日本代表のスター日本人選手のみが確定で1名登場！専用の特別枠からスカウトしてMY TEAMへ。',
    descriptionEn: 'Guaranteed 1 current SAMURAI BLUE Star player! Drawn from the dedicated Japan NT Star pool.',
    candidateCount: 1,
    guaranteedType: 'japan_star',
    legendChance: 0.0,
    purpleChance: 0.0,
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    accentGradient: 'from-sky-600/30 via-blue-700/20 to-slate-900/40',
    iconName: 'Flag',
  },
  normal_ticket: {
    type: 'normal_ticket',
    nameJa: 'ノーマルチケット',
    nameEn: 'Normal Ticket',
    descriptionJa: 'ノーマル選手のみが抽選対象になる専用スカウト。3名のノーマル選手から1名を獲得できます。',
    descriptionEn: 'Normal-category players only (strictly excludes Star, Purple, Legend, and Black Ball players).',
    candidateCount: 3,
    guaranteedType: 'normal',
    legendChance: 0.0,
    purpleChance: 0.0,
    badgeColor: 'bg-slate-500/20 text-slate-200 border-slate-400/40',
    accentGradient: 'from-slate-600/30 via-slate-800/30 to-slate-950/50',
    iconName: 'Ticket',
  },
  legend_10: {
    type: 'legend_10',
    nameJa: 'レジェンド10%スカウト',
    nameEn: 'Legend 10% Scout',
    descriptionJa: '10%の確率でレジェンド選手が出現するスカウト！3名の候補から1名を選択してMY TEAMへ。',
    descriptionEn: '10% chance to summon a Legend! Choose 1 of 3 candidates for your MY TEAM.',
    candidateCount: 3,
    legendChance: 0.1,
    purpleChance: 0.0,
    badgeColor: 'bg-amber-700/20 text-amber-200 border-amber-500/40',
    accentGradient: 'from-amber-800/30 via-stone-800/30 to-stone-950/50',
    iconName: 'Star',
  },
  japan_legend_50: {
    type: 'japan_legend_50',
    nameJa: '日本人レジェンド50%スカウト',
    nameEn: 'Japan Legend 50% Scout',
    descriptionJa: '50%の確率で日本国籍のレジェンド選手のみが登場する特別スカウト！3名の候補から1名を選択。',
    descriptionEn: '50% chance to draw exclusively from verified Japanese Legends! Pick 1 of 3 candidates.',
    candidateCount: 3,
    guaranteedType: 'japan_legend_50',
    legendChance: 0.5,
    purpleChance: 0.0,
    badgeColor: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
    accentGradient: 'from-rose-700/30 via-amber-700/20 to-slate-950/50',
    iconName: 'Award',
  },
  japan_legend_guaranteed: {
    type: 'japan_legend_guaranteed',
    nameJa: '日本人レジェンド確定スカウト',
    nameEn: 'Japan Legend Guaranteed Scout',
    descriptionJa: '日本国籍のレジェンド選手のみが確定で3名登場！日本サッカー史を彩ったレジェンドから1名を獲得！',
    descriptionEn: 'Guaranteed 3 verified Japanese Legends! Pick 1 to add directly to MY TEAM.',
    candidateCount: 3,
    guaranteedType: 'japan_legend',
    legendChance: 1.0,
    purpleChance: 0.0,
    badgeColor: 'bg-gradient-to-r from-rose-500/25 to-amber-500/25 text-amber-200 border-rose-400/50',
    accentGradient: 'from-rose-600/30 via-amber-600/25 to-slate-950/50',
    iconName: 'Crown',
  },
};

// Storage Keys
const LOCAL_STORAGE_USER_TICKETS = 'FOOTBALL_DRAFT_USER_TICKETS_V130';
const LOCAL_STORAGE_PRESENT_BOX = 'FOOTBALL_DRAFT_PRESENT_BOX_V130';
const LOCAL_STORAGE_APOLOGY_CLAIMED = 'FOOTBALL_DRAFT_APOLOGY_GIFT_CLAIMED_V130';
const LOCAL_STORAGE_V150_MEMORIAL_SENT_PREFIX = 'FOOTBALL_DRAFT_V150_MEMORIAL_SENT_';
const LOCAL_STORAGE_MORIYASU_GIFT_SENT_PREFIX = 'FOOTBALL_DRAFT_MORIYASU_GIFT_SENT_';
const LOCAL_STORAGE_V160_APOLOGY_SENT_PREFIX = 'FOOTBALL_DRAFT_V160_APOLOGY_SENT_';
const LOCAL_STORAGE_V160_CAMPAIGN_SENT_PREFIX = 'FOOTBALL_DRAFT_V160_CAMPAIGN_SENT_';
const LOCAL_STORAGE_PAST_RANKINGS = 'FOOTBALL_DRAFT_PAST_WEEKLY_RANKINGS_V130';

/**
 * Get all legend candidate pool (distinct person IDs)
 */
export function getAllLegendPool(): Player[] {
  const map = new Map<string, Player>();
  for (const p of SPECIAL_BALLON_DOR_PLAYERS) {
    const pId = p.personId || p.playerId;
    if (!map.has(pId)) map.set(pId, p);
  }
  for (const p of ALL_PLAYERS) {
    if (p.isLegendary || p.category === 'LEGEND') {
      const pId = p.personId || p.playerId;
      if (!map.has(pId)) map.set(pId, p);
    }
  }
  for (const p of EUROPEAN_PLAYERS) {
    if (p.isLegendary) {
      const pId = p.personId || p.playerId;
      if (!map.has(pId)) map.set(pId, p);
    }
  }
  return Array.from(map.values());
}

/**
 * Get all purple candidate pool
 */
export function getAllPurplePool(): Player[] {
  return [...PURPLE_ACTIVE_PLAYERS];
}

/**
 * Strict Normal-only pool for normal_ticket:
 * ONLY category === 'NORMAL', non-legend, non-purple, rating < 100, non-bd_special.
 */
export function getNormalOnlyPool(): Player[] {
  const map = new Map<string, Player>();
  for (const p of ALL_PLAYERS) {
    if (
      p.category === 'NORMAL' &&
      !p.isLegendary &&
      !isPurpleCard(p) &&
      p.rating < 100 &&
      !p.playerId.startsWith('bd_special_')
    ) {
      const pId = p.personId || p.playerId;
      if (!map.has(pId)) map.set(pId, p);
    }
  }
  return Array.from(map.values());
}

const ACTIVE_NON_LEGEND_JP_IDS = new Set([
  'k_mitoma',
  'j_ito',
  'yuya_osako',
  'mitoma_kawa_2020',
  'ito_junya_kashiwa_2016',
  'osako_vissel_2021',
]);

function canonicalJapanesePersonName(player: Player): string {
  return (player.nameJa || player.playerName || '')
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\s+/g, '')
    .replace(/﨑/g, '崎')
    .trim();
}

/**
 * Strictly verified Japanese Legends pool:
 * - Japanese nationality ONLY (excludes all foreign legends)
 * - Genuine Legends ONLY (excludes active non-legends such as Mitoma, Junya Ito, Yuya Osako)
 * - Deduplicated across J1 & National Era entries, preferring the higher-OVR card
 */
export function getJapaneseLegendPool(): Player[] {
  const combined = [...ALL_PLAYERS, ...J1_LEGENDS_EXPANDED, ...NATIONAL_ERA_PLAYERS];
  const byName = new Map<string, Player>();

  for (const p of combined) {
    const isJapanese =
      p.nationality === 'Japan' ||
      p.nationality === '日本' ||
      p.nationalityJa === '日本' ||
      p.nationalityEn === 'Japan' ||
      p.nationalityFlag === '🇯🇵';
    const isLegend = Boolean(p.isLegendary) || p.category === 'LEGEND';
    if (!isJapanese || !isLegend) continue;
    if (isPurpleCard(p)) continue;
    if (ACTIVE_NON_LEGEND_JP_IDS.has(p.personId || '') || ACTIVE_NON_LEGEND_JP_IDS.has(p.playerId)) {
      continue;
    }

    const canonName = canonicalJapanesePersonName(p) || p.personId || p.playerId;
    const existing = byName.get(canonName);
    if (!existing || p.rating > existing.rating) {
      byName.set(canonName, p);
    }
  }

  return Array.from(byName.values());
}

/**
 * Generate candidate players for a specific scout type
 * Strictly enforces no duplicate person IDs within the same candidate set!
 */
export function generateScoutCandidates(
  ticketType: RewardTicketType,
  disallowedPositions: MainPosition[] = [],
  excludePersonIds: string[] = []
): {
  candidates: Player[];
  stagingType: 'gold' | 'purple' | 'normal' | 'japan_star' | 'japan_legend';
} {
  const def = REWARD_SCOUT_DEFINITIONS[ticketType];
  const count = def.candidateCount;
  const rand = Math.random();
  const disallowedSet = new Set<MainPosition>(disallowedPositions);
  const excludedPersonSet = new Set(excludePersonIds.map((id) => id.toLowerCase()));

  let stagingType: 'gold' | 'purple' | 'normal' | 'japan_star' | 'japan_legend' = 'normal';
  if (def.guaranteedType === 'japan_star') {
    stagingType = 'japan_star';
  } else if (def.guaranteedType === 'japan_legend') {
    stagingType = 'japan_legend';
  } else if (def.guaranteedType === 'japan_legend_50') {
    stagingType = rand < 0.5 ? 'japan_legend' : 'normal';
  } else if (def.guaranteedType === 'normal') {
    stagingType = 'normal';
  } else if (def.guaranteedType === 'legend') {
    stagingType = 'gold';
  } else if (def.guaranteedType === 'purple') {
    stagingType = 'purple';
  } else if (def.guaranteedType === 'both') {
    stagingType = rand < 0.5 ? 'gold' : 'purple';
  } else {
    // Probability based (legend_10, legend_20, legend_50, purple_20, purple_50, legend_purple_50)
    if (rand < def.legendChance) {
      stagingType = 'gold';
    } else if (rand < def.legendChance + def.purpleChance) {
      stagingType = 'purple';
    } else {
      stagingType = 'normal';
    }
  }

  const legendPool = getAllLegendPool().filter((p) => !disallowedSet.has(p.position));
  const purplePool = getAllPurplePool().filter((p) => !disallowedSet.has(p.position));
  const strictNormalOnlyPool = getNormalOnlyPool().filter((p) => !disallowedSet.has(p.position));
  const standardRewardNormalPool = ALL_PLAYERS.filter(
    (p) => !disallowedSet.has(p.position) && !p.isLegendary && p.rating >= 85 && p.rating < 100 && !isPurpleCard(p)
  );
  const japanLegendPool = getJapaneseLegendPool().filter((p) => !disallowedSet.has(p.position));

  const selectedCandidates: Player[] = [];
  const selectedPersonIds = new Set<string>();

  function addCandidateFromPool(pool: Player[]): boolean {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    for (const player of shuffled) {
      const personKey = (player.personId || player.playerName).toLowerCase();
      if (!selectedPersonIds.has(personKey)) {
        selectedPersonIds.add(personKey);
        selectedCandidates.push(player);
        return true;
      }
    }
    return false;
  }

  // Generate candidates based on determined staging
  if (stagingType === 'japan_star') {
    const rawJapanPool = getCurrentJapanStarPool();
    const posAllowedPool = rawJapanPool.filter((p) => !disallowedSet.has(p.position));
    const basePool = posAllowedPool.length > 0 ? posAllowedPool : rawJapanPool;
    const nonDuplicatePool = basePool.filter(
      (p) => !excludedPersonSet.has((p.personId || p.playerName).toLowerCase())
    );
    const drawPool = nonDuplicatePool.length > 0 ? nonDuplicatePool : basePool;
    addCandidateFromPool(drawPool);
  } else if (stagingType === 'japan_legend') {
    const fallbackPool = japanLegendPool.length >= count ? japanLegendPool : getJapaneseLegendPool();
    while (selectedCandidates.length < count) {
      if (!addCandidateFromPool(fallbackPool)) break;
    }
  } else if (stagingType === 'gold') {
    while (selectedCandidates.length < count) {
      if (!addCandidateFromPool(legendPool)) break;
    }
  } else if (stagingType === 'purple') {
    // Diversify positions: try selecting from GK, DF, MF, FW
    const gk = purplePool.filter((p) => p.position === 'GK');
    const df = purplePool.filter((p) => p.position === 'DF');
    const mf = purplePool.filter((p) => p.position === 'MF');
    const fw = purplePool.filter((p) => p.position === 'FW');

    // Add diverse candidates
    if (count === 3) {
      // Pick 3 from distinct positions
      const pools = [fw, mf, df, gk].sort(() => 0.5 - Math.random());
      for (const p of pools) {
        if (selectedCandidates.length < 3) {
          addCandidateFromPool(p);
        }
      }
    } else {
      // Pick 5
      addCandidateFromPool(fw);
      addCandidateFromPool(mf);
      addCandidateFromPool(df);
      addCandidateFromPool(gk);
    }
    // Fill remaining
    while (selectedCandidates.length < count) {
      if (!addCandidateFromPool(purplePool)) break;
    }
    // If GK-only limit resulted in fewer purple GKs or none, fallback safely while strictly keeping Legend/Purple guarantee
    if (selectedCandidates.length === 0) {
      while (selectedCandidates.length < count) {
        if (!addCandidateFromPool(legendPool)) break;
      }
      stagingType = 'gold';
    }
  } else {
    // Normal staging: normal_ticket uses strictly NORMAL category only!
    const targetNormalPool =
      ticketType === 'normal_ticket'
        ? (strictNormalOnlyPool.length >= count ? strictNormalOnlyPool : getNormalOnlyPool())
        : standardRewardNormalPool;
    while (selectedCandidates.length < count) {
      if (!addCandidateFromPool(targetNormalPool)) break;
    }
  }

  return {
    candidates: selectedCandidates,
    stagingType,
  };
}

/**
 * User Ticket Inventory state management
 */
export function getStoredUserTickets(): Record<RewardTicketType, number> {
  const defaultInventory: Record<RewardTicketType, number> = {
    normal_ticket: 0,
    legend_10: 0,
    legend_20: 0,
    legend_50: 0,
    legend_70: 0,
    legend_guaranteed: 0,
    purple_20: 0,
    purple_50: 0,
    purple_guaranteed: 0,
    legend_purple_guaranteed: 0,
    legend_purple_50: 0,
    japan_star_guaranteed: 0,
    japan_legend_50: 0,
    japan_legend_guaranteed: 0,
  };

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_TICKETS);
    if (!raw) return defaultInventory;
    const parsed = JSON.parse(raw);
    return { ...defaultInventory, ...parsed };
  } catch {
    return defaultInventory;
  }
}

export function saveUserTickets(tickets: Record<RewardTicketType, number>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_USER_TICKETS, JSON.stringify(tickets));
  } catch (e) {
    console.warn('Failed to save user tickets:', e);
  }
}

export function addTicketToUser(type: RewardTicketType, count: number = 1): Record<RewardTicketType, number> {
  const current = getStoredUserTickets();
  const updated = {
    ...current,
    [type]: (current[type] || 0) + count,
  };
  saveUserTickets(updated);
  return updated;
}

export function consumeUserTicket(type: RewardTicketType): boolean {
  const current = getStoredUserTickets();
  if (!current[type] || current[type] <= 0) {
    return false;
  }
  const updated = {
    ...current,
    [type]: current[type] - 1,
  };
  saveUserTickets(updated);
  return true;
}

export const consumeScoutTicket = consumeUserTicket;

/**
 * Present Box state management
 */
export function getStoredPresents(userId: string): GiftBoxItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRESENT_BOX);
    if (!raw) return [];
    const all: GiftBoxItem[] = JSON.parse(raw);
    return all.filter((item) => item.userId === userId);
  } catch {
    return [];
  }
}

export function saveAllPresents(presents: GiftBoxItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PRESENT_BOX, JSON.stringify(presents));
  } catch (e) {
    console.warn('Failed to save presents:', e);
  }
}

export const APOLOGY_V131_EXPIRES_AT = new Date('2026-09-30T23:59:59+09:00').getTime();

/**
 * Ensure the apology gifts (Legend 20% Scout and 1.3.1 Legend Guaranteed Scout) are distributed to present box
 */
export function ensureApologyGiftDistributed(userId: string): GiftBoxItem[] {
  try {
    const allPresentsRaw = localStorage.getItem(LOCAL_STORAGE_PRESENT_BOX);
    const allPresents: GiftBoxItem[] = allPresentsRaw ? JSON.parse(allPresentsRaw) : [];
    let updated = false;
    
    // 1. Check if 1.3.0 apology gift already exists for this user
    const apologyId = `apology_gift_${userId}_legend20`;
    const exists = allPresents.some((p) => p.id === apologyId || (p.userId === userId && p.rewardType === 'legend_20' && p.title.includes('お詫び')));
    
    if (!exists) {
      const apologyGift: GiftBoxItem = {
        id: apologyId,
        userId,
        title: '【運営からのお詫び】特別スカウト配布',
        description: 'アップデートに伴うお詫びとして「レジェンド20%スカウト ×1」をお送りいたします。',
        rewardType: 'legend_20',
        amount: 1,
        isClaimed: false,
        createdAt: Date.now(),
      };
      allPresents.unshift(apologyGift);
      updated = true;
    }

    // 2. Check if 1.3.1 Legend Guaranteed apology gift exists for this user
    const apologyV131Id = `apology_v131_legend_guaranteed_${userId}`;
    const existsV131 = allPresents.some((p) => p.id === apologyV131Id);

    if (!existsV131) {
      const apologyV131Gift: GiftBoxItem = {
        id: apologyV131Id,
        userId,
        title: '【1.3.1修正お詫び】レジェンド確定スカウト',
        description: '1.3.1修正アップデートのお詫びとして「レジェンド確定スカウト ×1」をお送りいたします。（有効期限: 2026年9月30日 23:59 JSTまで）',
        rewardType: 'legend_guaranteed',
        amount: 1,
        isClaimed: false,
        createdAt: Date.now(),
        expiresAt: APOLOGY_V131_EXPIRES_AT,
      };
      allPresents.unshift(apologyV131Gift);
      updated = true;
    }

    // 3. Check if Ver.1.5.0 Memorial Gift has already been distributed to this user (idempotent: existing & new users)
    const v150GiftId = `v150_memorial_gift_${userId}`;
    const v150SentFlagKey = `${LOCAL_STORAGE_V150_MEMORIAL_SENT_PREFIX}${userId}`;
    const v150FlagAlreadySent =
      typeof localStorage !== 'undefined' && localStorage.getItem(v150SentFlagKey) === '1';
    const existsV150 =
      v150FlagAlreadySent ||
      allPresents.some(
        (p) =>
          p.id === v150GiftId ||
          (p.userId === userId && p.title === 'Ver.1.5.0 アップデート記念')
      );

    if (!existsV150) {
      const v150Gift: GiftBoxItem = {
        id: v150GiftId,
        userId,
        title: 'Ver.1.5.0 アップデート記念',
        description: '1.5.0大型アップデートを記念して、特別なガチャチケットをプレゼント！',
        rewardType: 'legend_purple_guaranteed',
        amount: 2,
        isClaimed: false,
        createdAt: Date.now(),
      };
      allPresents.unshift(v150Gift);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(v150SentFlagKey, '1');
      }
      updated = true;
    }

    // 4. Check if Moriyasu Coach Gratitude Gift has already been distributed to this user (idempotent)
    const moriyasuGiftId = `moriyasu_thanks_japan_star_${userId}`;
    const moriyasuSentFlagKey = `${LOCAL_STORAGE_MORIYASU_GIFT_SENT_PREFIX}${userId}`;
    const moriyasuFlagAlreadySent =
      typeof localStorage !== 'undefined' && localStorage.getItem(moriyasuSentFlagKey) === '1';
    const existsMoriyasu =
      moriyasuFlagAlreadySent ||
      allPresents.some(
        (p) =>
          p.id === moriyasuGiftId ||
          (p.userId === userId && p.title === '今までありがとう森保監督！')
      );

    if (!existsMoriyasu) {
      const moriyasuGift: GiftBoxItem = {
        id: moriyasuGiftId,
        userId,
        title: '今までありがとう森保監督！',
        description:
          'これまで日本代表を率いてきた森保監督への感謝を込めて、特別なガチャチケットをプレゼント！',
        rewardType: 'japan_star_guaranteed',
        amount: 1,
        isClaimed: false,
        createdAt: Date.now(),
      };
      allPresents.unshift(moriyasuGift);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(moriyasuSentFlagKey, '1');
      }
      updated = true;
    }

    // 5. Ver.1.6.0 Apology Gift for Undo Removal (idempotent per user)
    const v160ApologyId = `v160_apology_undo_removed_${userId}`;
    const v160ApologyFlagKey = `${LOCAL_STORAGE_V160_APOLOGY_SENT_PREFIX}${userId}`;
    const v160ApologySent =
      typeof localStorage !== 'undefined' && localStorage.getItem(v160ApologyFlagKey) === '1';
    const existsV160Apology =
      v160ApologySent ||
      allPresents.some(
        (p) =>
          p.id === v160ApologyId ||
          (p.userId === userId && p.title === '選択を取り消す機能の削除のお詫び')
      );

    if (!existsV160Apology) {
      const v160ApologyGift: GiftBoxItem = {
        id: v160ApologyId,
        userId,
        title: '選択を取り消す機能の削除のお詫び',
        description:
          'ドラフトの選択取り消し機能の削除に伴うお詫びとして、レジェンド確定ガチャチケットをプレゼントいたします。',
        rewardType: 'legend_guaranteed',
        amount: 1,
        isClaimed: false,
        createdAt: Date.now(),
      };
      allPresents.unshift(v160ApologyGift);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(v160ApologyFlagKey, '1');
      }
      updated = true;
    }

    // 6. Ver.1.6.0 Training Chip & Awakening Ticket Campaign Gift (idempotent per user)
    const v160CampaignId = `v160_training_campaign_${userId}`;
    const v160CampaignFlagKey = `${LOCAL_STORAGE_V160_CAMPAIGN_SENT_PREFIX}${userId}`;
    const v160CampaignSent =
      typeof localStorage !== 'undefined' && localStorage.getItem(v160CampaignFlagKey) === '1';
    const existsV160Campaign =
      v160CampaignSent ||
      allPresents.some(
        (p) =>
          p.id === v160CampaignId ||
          (p.userId === userId && p.title === 'トレーニングチップ＆覚醒チケット実装キャンペーン')
      );

    if (!existsV160Campaign) {
      const v160CampaignGift: GiftBoxItem = {
        id: v160CampaignId,
        userId,
        title: 'トレーニングチップ＆覚醒チケット実装キャンペーン',
        description:
          '新しい選手育成システムの実装を記念して、特別な育成アイテムをプレゼント！',
        rewardType: 'training_chip',
        amount: 10,
        rewards: [
          { rewardType: 'training_chip', amount: 10 },
          { rewardType: 'awakening_ticket', amount: 10 },
        ],
        isClaimed: false,
        createdAt: Date.now(),
      };
      allPresents.unshift(v160CampaignGift);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(v160CampaignFlagKey, '1');
      }
      updated = true;
    }

    // 7. Ver.1.6.1 Present Box Bug Apology Gift (idempotent per user)
    const v161ApologyId = `v161_present_bug_apology_${userId}`;
    const v161ApologyFlagKey = `FOOTBALL_DRAFT_V161_PRESENT_APOLOGY_SENT_${userId}`;
    const v161ApologySent =
      typeof localStorage !== 'undefined' && localStorage.getItem(v161ApologyFlagKey) === '1';
    const existsV161Apology =
      v161ApologySent ||
      allPresents.some(
        (p) =>
          p.id === v161ApologyId ||
          (p.userId === userId && p.title === 'プレゼントBOX不具合のお詫び')
      );

    if (!existsV161Apology) {
      const v161ApologyGift: GiftBoxItem = {
        id: v161ApologyId,
        userId,
        title: 'プレゼントBOX不具合のお詫び',
        description:
          'プレゼントBOX受取不具合のお詫びとして、「レジェンド50%ガチャ ×1」「トレーニングチップ ×20」「覚醒チケット ×3」をお送りいたします。',
        rewardType: 'legend_50',
        amount: 1,
        rewards: [
          { rewardType: 'legend_50', amount: 1 },
          { rewardType: 'training_chip', amount: 20 },
          { rewardType: 'awakening_ticket', amount: 3 },
        ],
        isClaimed: false,
        createdAt: Date.now(),
      };
      allPresents.unshift(v161ApologyGift);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(v161ApologyFlagKey, '1');
      }
      updated = true;
    }

    if (updated) {
      saveAllPresents(allPresents);
    }
    
    return allPresents.filter((item) => item.userId === userId);
  } catch (e) {
    console.warn('Error checking apology gift:', e);
    return [];
  }
}

export const ensureSystemGiftsDistributed = ensureApologyGiftDistributed;

const SCOUT_TICKET_TYPE_SET = new Set<string>(Object.keys(REWARD_SCOUT_DEFINITIONS));

function buildOrUpdateLocalProgressMirror(
  userId: string,
  grants: { rewardType: InventoryItemType; amount: number; title: string; expiresAt?: number }[],
  nowMs: number = Date.now()
): any {
  try {
    const key = `FOOTBALL_DRAFT_USER_PROGRESS_V160_${userId}`;
    const raw = localStorage.getItem(key);
    const parsed = raw
      ? JSON.parse(raw)
      : {
          userId,
          inventory: {},
          timedLots: [],
          loginBonus: {
            currentDay: 1,
            claimedDaysInCycle: [],
            lastClaimedJstDate: null,
            totalClaims: 0,
            cycleCount: 1,
          },
          ownedManagers: [],
          playerStates: {},
          usageLogs: [],
          updatedAt: nowMs,
        };
    parsed.inventory = parsed.inventory || {};
    parsed.timedLots = Array.isArray(parsed.timedLots) ? parsed.timedLots : [];
    parsed.usageLogs = Array.isArray(parsed.usageLogs) ? parsed.usageLogs : [];

    for (const g of grants) {
      parsed.inventory[g.rewardType] = (parsed.inventory[g.rewardType] || 0) + g.amount;
      if (g.expiresAt) {
        parsed.timedLots.push({
          id: `lot_${nowMs}_${Math.random().toString(36).slice(2, 8)}`,
          ticketType: g.rewardType,
          initialAmount: g.amount,
          remaining: g.amount,
          grantedAt: nowMs,
          expiresAt: g.expiresAt,
          source: 'present_local_fallback',
        });
      }
      parsed.usageLogs.unshift({
        id: `log_${nowMs}_${Math.random().toString(36).slice(2, 8)}`,
        userId,
        itemType: g.rewardType,
        action: 'claim_present',
        amount: g.amount,
        detailJa: `プレゼント「${g.title}」から獲得`,
        detailEn: `Claimed from present: ${g.title}`,
        timestamp: nowMs,
      });
    }
    parsed.usageLogs = parsed.usageLogs.slice(0, 150);
    parsed.updatedAt = nowMs;
    localStorage.setItem(key, JSON.stringify(parsed));
    return parsed;
  } catch {
    return undefined;
  }
}

function grantInventoryEntryLocally(rewardType: InventoryItemType, amount: number): void {
  if (SCOUT_TICKET_TYPE_SET.has(rewardType)) {
    addTicketToUser(rewardType as RewardTicketType, amount);
  } else {
    try {
      const raw = localStorage.getItem('FOOTBALL_DRAFT_NON_SCOUT_INVENTORY_V160');
      const current = raw ? JSON.parse(raw) : {};
      current[rewardType] = (current[rewardType] || 0) + amount;
      localStorage.setItem('FOOTBALL_DRAFT_NON_SCOUT_INVENTORY_V160', JSON.stringify(current));
    } catch (e) {
      console.warn('Failed to save non-scout reward locally:', e);
    }
  }
}

/**
 * Claim a gift from the present box
 * Returns updated list of presents
 */
export function claimPresentBoxItem(
  presentId: string,
  userId: string,
  fallbackPresents?: GiftBoxItem[]
): {
  success: boolean;
  claimedItem?: GiftBoxItem;
  updatedPresents: GiftBoxItem[];
  updatedTickets: Record<RewardTicketType, number>;
  progress?: any;
  error?: string;
} {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRESENT_BOX);
    const allPresents: GiftBoxItem[] = raw ? JSON.parse(raw) : [];
    if (Array.isArray(fallbackPresents)) {
      for (const fp of fallbackPresents) {
        if (fp && fp.userId === userId && !allPresents.some((p) => p.id === fp.id)) {
          allPresents.push({ ...fp });
        }
      }
    }
    const target = allPresents.find((p) => p.id === presentId && p.userId === userId);

    if (!target) {
      return {
        success: false,
        updatedPresents: allPresents.filter((p) => p.userId === userId),
        updatedTickets: getStoredUserTickets(),
        error: '対象のプレゼントが見つかりませんでした。',
      };
    }

    if (target.isClaimed) {
      return {
        success: false,
        updatedPresents: allPresents.filter((p) => p.userId === userId),
        updatedTickets: getStoredUserTickets(),
        error: 'このプレゼントはすでに受取済みです。',
      };
    }

    const now = Date.now();
    // Check expiration
    if (target.expiresAt && now > target.expiresAt) {
      console.warn('Item is expired and cannot be claimed:', target.id);
      return {
        success: false,
        updatedPresents: allPresents.filter((p) => p.userId === userId),
        updatedTickets: getStoredUserTickets(),
        error: '有効期限が切れているため受け取れません。',
      };
    }

    // Mark claimed
    target.isClaimed = true;
    target.claimedAt = now;
    saveAllPresents(allPresents);

    const grants: { rewardType: InventoryItemType; amount: number; title: string; expiresAt?: number }[] = [];
    const rewardsList =
      Array.isArray(target.rewards) && target.rewards.length > 0
        ? target.rewards
        : [{ rewardType: target.rewardType, amount: target.amount || 1 }];

    for (const r of rewardsList) {
      const amt = r.amount || 1;
      const expiresAt = r.expiresInDays ? now + r.expiresInDays * 24 * 60 * 60 * 1000 : undefined;
      grantInventoryEntryLocally(r.rewardType, amt);
      grants.push({ rewardType: r.rewardType, amount: amt, title: target.title, expiresAt });
    }

    const progress = buildOrUpdateLocalProgressMirror(userId, grants, now);

    return {
      success: true,
      claimedItem: target,
      updatedPresents: allPresents.filter((p) => p.userId === userId),
      updatedTickets: getStoredUserTickets(),
      progress,
    };
  } catch (e) {
    console.warn('Error claiming present:', e);
    return {
      success: false,
      updatedPresents: getStoredPresents(userId),
      updatedTickets: getStoredUserTickets(),
      error: 'プレゼントの受け取り処理でエラーが発生しました。',
    };
  }
}

/**
 * Claim all unclaimed gifts in the present box at once
 */
export function claimAllPresentBoxItems(
  userId: string,
  fallbackPresents?: GiftBoxItem[]
): {
  success: boolean;
  claimedCount: number;
  updatedPresents: GiftBoxItem[];
  updatedTickets: Record<RewardTicketType, number>;
  progress?: any;
  error?: string;
} {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRESENT_BOX);
    const allPresents: GiftBoxItem[] = raw ? JSON.parse(raw) : [];
    if (Array.isArray(fallbackPresents)) {
      for (const fp of fallbackPresents) {
        if (fp && fp.userId === userId && !allPresents.some((p) => p.id === fp.id)) {
          allPresents.push({ ...fp });
        }
      }
    }
    const now = Date.now();
    let claimedCount = 0;
    const grants: { rewardType: InventoryItemType; amount: number; title: string; expiresAt?: number }[] = [];

    for (const item of allPresents) {
      if (item.userId === userId && !item.isClaimed) {
        // Skip expired
        if (item.expiresAt && now > item.expiresAt) {
          continue;
        }
        item.isClaimed = true;
        item.claimedAt = now;
        const rewardsList =
          Array.isArray(item.rewards) && item.rewards.length > 0
            ? item.rewards
            : [{ rewardType: item.rewardType, amount: item.amount || 1 }];
        for (const r of rewardsList) {
          const amt = r.amount || 1;
          const expiresAt = r.expiresInDays ? now + r.expiresInDays * 24 * 60 * 60 * 1000 : undefined;
          grantInventoryEntryLocally(r.rewardType, amt);
          grants.push({ rewardType: r.rewardType, amount: amt, title: item.title, expiresAt });
        }
        claimedCount++;
      }
    }

    let progress: any;
    if (claimedCount > 0) {
      saveAllPresents(allPresents);
      progress = buildOrUpdateLocalProgressMirror(userId, grants, now);
    }

    return {
      success: true,
      claimedCount,
      updatedPresents: allPresents.filter((p) => p.userId === userId),
      updatedTickets: getStoredUserTickets(),
      progress,
    };
  } catch (e) {
    console.warn('Error claiming all presents:', e);
    return {
      success: false,
      claimedCount: 0,
      updatedPresents: getStoredPresents(userId),
      updatedTickets: getStoredUserTickets(),
      error: '一括受取処理でエラーが発生しました。',
    };
  }
}

/**
 * Past Weekly Rankings History
 */
export function getStoredPastRankings(): PastWeeklyRankingHistory[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PAST_RANKINGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePastRankings(history: PastWeeklyRankingHistory[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PAST_RANKINGS, JSON.stringify(history));
  } catch (e) {
    console.warn('Failed to save past rankings:', e);
  }
}

const LOCAL_STORAGE_DISTRIBUTED_WEEKS = 'FOOTBALL_DRAFT_DISTRIBUTED_WEEKS_V130';

export function getDistributedWeeks(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DISTRIBUTED_WEEKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markWeekAsDistributed(weekId: string): void {
  try {
    const list = getDistributedWeeks();
    if (!list.includes(weekId)) {
      list.push(weekId);
      localStorage.setItem(LOCAL_STORAGE_DISTRIBUTED_WEEKS, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to mark week as distributed:', e);
  }
}

/**
 * Server/Client Authoritative Weekly Ranking Reward Distribution
 * Rules:
 * - 1st place: Legend Guaranteed Scout x1
 * - 2nd place: Purple Guaranteed Scout x1
 * - 3rd place: Legend / Purple 50% Scout x1
 * - Strictly 1 recipient per rank tier (no duplicates, no 4th+)
 * - Strictly no double-distribution for the same week_id
 */
export function distributeWeeklyRewardsForWeek(
  weekId: string,
  seasonNum: number,
  standings: BetaStandingEntry[]
): {
  success: boolean;
  distributed: boolean;
  recipients: {
    rank: 1 | 2 | 3;
    userId: string;
    username: string;
    rewardType: RewardTicketType;
    rewardLabel: string;
  }[];
} {
  const distributedWeeks = getDistributedWeeks();
  if (distributedWeeks.includes(weekId)) {
    return { success: true, distributed: false, recipients: [] };
  }

  if (!standings || standings.length === 0) {
    return { success: true, distributed: false, recipients: [] };
  }

  const allPresentsRaw = localStorage.getItem(LOCAL_STORAGE_PRESENT_BOX);
  const allPresents: GiftBoxItem[] = allPresentsRaw ? JSON.parse(allPresentsRaw) : [];

  const recipients: {
    rank: 1 | 2 | 3;
    userId: string;
    username: string;
    rewardType: RewardTicketType;
    rewardLabel: string;
  }[] = [];

  const tierRewards: { rank: 1 | 2 | 3; type: RewardTicketType; label: string }[] = [
    { rank: 1, type: 'legend_guaranteed', label: 'レジェンド確定スカウト' },
    { rank: 2, type: 'purple_guaranteed', label: '紫確定スカウト' },
    { rank: 3, type: 'legend_purple_50', label: 'レジェンド・紫50%スカウト' },
  ];

  for (const tier of tierRewards) {
    const entry = standings[tier.rank - 1];
    if (entry && entry.userId) {
      recipients.push({
        rank: tier.rank,
        userId: entry.userId,
        username: entry.username,
        rewardType: tier.type,
        rewardLabel: tier.label,
      });

      // Create gift item
      const giftItem: GiftBoxItem = {
        id: `ranking_reward_${weekId}_rank${tier.rank}_${entry.userId}`,
        weekId,
        userId: entry.userId,
        title: `【第${seasonNum}週ランキング確定報酬】第${tier.rank}位`,
        description: `週間ランキング（${weekId}）にて第${tier.rank}位を獲得されました！おめでとうございます！`,
        rewardType: tier.type,
        amount: 1,
        isClaimed: false,
        createdAt: Date.now(),
        rank: tier.rank,
      };

      // Add to front of presents list
      allPresents.unshift(giftItem);
    }
  }

  saveAllPresents(allPresents);
  markWeekAsDistributed(weekId);

  // Archive to past rankings
  try {
    const pastRankings = getStoredPastRankings();
    if (!pastRankings.some((p) => p.weekId === weekId)) {
      pastRankings.unshift({
        weekId,
        weekLabel: `WEEK ${seasonNum} (${weekId})`,
        startDateMs: Date.now() - 7 * 24 * 60 * 60 * 1000,
        endDateMs: Date.now(),
        standings: standings.slice(0, 50),
        finalizedAt: Date.now(),
        rewardRecipients: recipients,
      });
      savePastRankings(pastRankings);
    }
  } catch (e) {
    console.warn('Failed to archive past rankings:', e);
  }

  return {
    success: true,
    distributed: true,
    recipients,
  };
}

