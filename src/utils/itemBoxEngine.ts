import {
  InventoryItemType,
  ItemBoxCategory,
  ItemUsageLogEntry,
  OwnedManagerRecord,
  TimedTicketLot,
  UserInventoryCounts,
  UserTeam,
} from '../types';
import { REWARD_SCOUT_DEFINITIONS } from './rewardScoutEngine';
import { CHIPS_PER_LEVEL, MAX_AWAKENING_LEVEL, MAX_PLAYER_LEVEL } from './playerTrainingEngine';

export interface ItemCatalogEntry {
  type: InventoryItemType;
  category: ItemBoxCategory;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  descriptionEn: string;
  usageHintJa: string;
  usageHintEn: string;
  accentColor: string;
  badgeText: string;
  iconKey: string;
}

export const ALL_INVENTORY_ITEM_TYPES: readonly InventoryItemType[] = [
  'training_chip',
  'awakening_ticket',
  'normal_ticket',
  'legend_10',
  'legend_20',
  'legend_50',
  'legend_70',
  'legend_guaranteed',
  'purple_20',
  'purple_50',
  'purple_guaranteed',
  'legend_purple_50',
  'legend_purple_guaranteed',
  'japan_star_guaranteed',
  'japan_legend_50',
  'japan_legend_guaranteed',
  'manager_select_ticket',
  'position_plus',
];

export function createEmptyInventoryCounts(): UserInventoryCounts {
  return {
    training_chip: 0,
    awakening_ticket: 0,
    normal_ticket: 0,
    legend_10: 0,
    legend_20: 0,
    legend_50: 0,
    legend_70: 0,
    legend_guaranteed: 0,
    purple_20: 0,
    purple_50: 0,
    purple_guaranteed: 0,
    legend_purple_50: 0,
    legend_purple_guaranteed: 0,
    japan_star_guaranteed: 0,
    japan_legend_50: 0,
    japan_legend_guaranteed: 0,
    manager_select_ticket: 0,
    position_plus: 0,
  };
}

export const ITEM_BOX_CATEGORY_LABELS: Record<
  ItemBoxCategory,
  { labelJa: string; labelEn: string; shortJa: string }
> = {
  training: { labelJa: '1. 育成アイテム', labelEn: '1. Training Items', shortJa: '育成' },
  scout: { labelJa: '2. スカウトチケット', labelEn: '2. Scout Tickets', shortJa: 'スカウト' },
  manager: { labelJa: '3. 監督関連', labelEn: '3. Managers', shortJa: '監督' },
  position: { labelJa: '4. ポジション関連', labelEn: '4. Positions', shortJa: 'ポジション' },
  other: { labelJa: '5. その他', labelEn: '5. Other', shortJa: 'その他' },
};

export const ITEM_CATALOG: Record<InventoryItemType, ItemCatalogEntry> = {
  training_chip: {
    type: 'training_chip',
    category: 'training',
    nameJa: 'トレーニングチップ',
    nameEn: 'Training Chip',
    descriptionJa:
      '選手育成に使用する専用アイテム。3個消費で対象選手のレベルを+1（最大Lv.10）上げ、Lv.10到達時にOVRが初期値から+5上昇します。',
    descriptionEn:
      'Use 3 Training Chips to raise a player level by +1 (max Lv.10). At Lv.10, OVR increases by +5 from base.',
    usageHintJa: 'MY TEAM所属選手に対して3個単位で使用します。',
    usageHintEn: 'Consume 3 chips on a player in MY TEAM.',
    accentColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    badgeText: '育成',
    iconKey: 'Cpu',
  },
  awakening_ticket: {
    type: 'awakening_ticket',
    category: 'training',
    nameJa: '覚醒チケット',
    nameEn: 'Awakening Ticket',
    descriptionJa:
      'Lv.10に到達した選手のみに使用可能。1枚消費するごとに覚醒段階が+1（最大7段階）上昇し、特別な覚醒ランクが付与されます。',
    descriptionEn:
      'Usable only on Lv.10 players. Consumes 1 ticket to raise Awakening Level by +1 (max 7) without altering OVR.',
    usageHintJa: 'Lv.10到達済み & 覚醒Lv.7未満の選手のみ対象です。',
    usageHintEn: 'Requires a Lv.10 player below Awakening Lv.7.',
    accentColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
    badgeText: '覚醒',
    iconKey: 'Sparkles',
  },
  normal_ticket: {
    type: 'normal_ticket',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.normal_ticket.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.normal_ticket.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.normal_ticket.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.normal_ticket.descriptionEn,
    usageHintJa: '専用ノーマル枠スカウトから1名を獲得できます。',
    usageHintEn: 'Draw strictly from Normal-category players.',
    accentColor: REWARD_SCOUT_DEFINITIONS.normal_ticket.badgeColor,
    badgeText: 'NORMAL',
    iconKey: 'Ticket',
  },
  legend_10: {
    type: 'legend_10',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.legend_10.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.legend_10.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.legend_10.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.legend_10.descriptionEn,
    usageHintJa: '報酬スカウト画面から1枚消費して抽選を実行します。',
    usageHintEn: 'Redeem in Reward Scout for a 10% Legend draw.',
    accentColor: REWARD_SCOUT_DEFINITIONS.legend_10.badgeColor,
    badgeText: '10%',
    iconKey: 'Star',
  },
  legend_20: {
    type: 'legend_20',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.legend_20.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.legend_20.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.legend_20.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.legend_20.descriptionEn,
    usageHintJa: '報酬スカウト画面から1枚消費して抽選を実行します。',
    usageHintEn: 'Redeem in Reward Scout for a 20% Legend draw.',
    accentColor: REWARD_SCOUT_DEFINITIONS.legend_20.badgeColor,
    badgeText: '20%',
    iconKey: 'Gift',
  },
  legend_50: {
    type: 'legend_50',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.legend_50.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.legend_50.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.legend_50.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.legend_50.descriptionEn,
    usageHintJa: '報酬スカウト画面から1枚消費して抽選を実行します。',
    usageHintEn: 'Redeem in Reward Scout for a 50% Legend draw.',
    accentColor: REWARD_SCOUT_DEFINITIONS.legend_50.badgeColor,
    badgeText: '50%',
    iconKey: 'Star',
  },
  legend_70: {
    type: 'legend_70',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.legend_70.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.legend_70.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.legend_70.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.legend_70.descriptionEn,
    usageHintJa: '報酬スカウト画面から1枚消費して抽選を実行します。',
    usageHintEn: 'Redeem in Reward Scout for a 70% Legend draw.',
    accentColor: REWARD_SCOUT_DEFINITIONS.legend_70.badgeColor,
    badgeText: '70%',
    iconKey: 'Crown',
  },
  legend_guaranteed: {
    type: 'legend_guaranteed',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.legend_guaranteed.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.legend_guaranteed.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.legend_guaranteed.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.legend_guaranteed.descriptionEn,
    usageHintJa: 'レジェンド選手確定スカウトを実行します。',
    usageHintEn: 'Guaranteed Legend draw.',
    accentColor: REWARD_SCOUT_DEFINITIONS.legend_guaranteed.badgeColor,
    badgeText: '確定',
    iconKey: 'Crown',
  },
  purple_20: {
    type: 'purple_20',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.purple_20.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.purple_20.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.purple_20.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.purple_20.descriptionEn,
    usageHintJa: '報酬スカウト画面から抽選を実行します。',
    usageHintEn: 'Redeem in Reward Scout for a 20% Purple draw.',
    accentColor: REWARD_SCOUT_DEFINITIONS.purple_20.badgeColor,
    badgeText: '紫20%',
    iconKey: 'Sparkles',
  },
  purple_50: {
    type: 'purple_50',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.purple_50.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.purple_50.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.purple_50.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.purple_50.descriptionEn,
    usageHintJa: '報酬スカウト画面から抽選を実行します。',
    usageHintEn: 'Redeem in Reward Scout for a 50% Purple draw.',
    accentColor: REWARD_SCOUT_DEFINITIONS.purple_50.badgeColor,
    badgeText: '紫50%',
    iconKey: 'Flame',
  },
  purple_guaranteed: {
    type: 'purple_guaranteed',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.purple_guaranteed.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.purple_guaranteed.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.purple_guaranteed.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.purple_guaranteed.descriptionEn,
    usageHintJa: '紫確定スカウトを実行します。',
    usageHintEn: 'Guaranteed Purple Active Superstar draw.',
    accentColor: REWARD_SCOUT_DEFINITIONS.purple_guaranteed.badgeColor,
    badgeText: '紫確定',
    iconKey: 'Sparkles',
  },
  legend_purple_50: {
    type: 'legend_purple_50',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.legend_purple_50.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.legend_purple_50.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.legend_purple_50.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.legend_purple_50.descriptionEn,
    usageHintJa: '報酬スカウト画面から抽選を実行します。',
    usageHintEn: 'Redeem for 50% Legend/Purple draw.',
    accentColor: REWARD_SCOUT_DEFINITIONS.legend_purple_50.badgeColor,
    badgeText: 'L/紫50%',
    iconKey: 'Zap',
  },
  legend_purple_guaranteed: {
    type: 'legend_purple_guaranteed',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.legend_purple_guaranteed.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.legend_purple_guaranteed.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.legend_purple_guaranteed.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.legend_purple_guaranteed.descriptionEn,
    usageHintJa: 'レジェンド・紫確定スカウトを実行します。',
    usageHintEn: 'Guaranteed Legend or Purple draw.',
    accentColor: REWARD_SCOUT_DEFINITIONS.legend_purple_guaranteed.badgeColor,
    badgeText: 'L/紫確定',
    iconKey: 'Award',
  },
  japan_star_guaranteed: {
    type: 'japan_star_guaranteed',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.japan_star_guaranteed.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.japan_star_guaranteed.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.japan_star_guaranteed.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.japan_star_guaranteed.descriptionEn,
    usageHintJa: '現日本代表スター確定スカウトを実行します。',
    usageHintEn: 'Guaranteed Japan NT Star draw.',
    accentColor: REWARD_SCOUT_DEFINITIONS.japan_star_guaranteed.badgeColor,
    badgeText: 'SAMURAI',
    iconKey: 'Flag',
  },
  japan_legend_50: {
    type: 'japan_legend_50',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.japan_legend_50.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.japan_legend_50.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.japan_legend_50.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.japan_legend_50.descriptionEn,
    usageHintJa: '50%で日本国籍のレジェンド選手が登場します。',
    usageHintEn: '50% chance to summon a Japanese Legend.',
    accentColor: REWARD_SCOUT_DEFINITIONS.japan_legend_50.badgeColor,
    badgeText: '日本L50%',
    iconKey: 'Award',
  },
  japan_legend_guaranteed: {
    type: 'japan_legend_guaranteed',
    category: 'scout',
    nameJa: REWARD_SCOUT_DEFINITIONS.japan_legend_guaranteed.nameJa,
    nameEn: REWARD_SCOUT_DEFINITIONS.japan_legend_guaranteed.nameEn,
    descriptionJa: REWARD_SCOUT_DEFINITIONS.japan_legend_guaranteed.descriptionJa,
    descriptionEn: REWARD_SCOUT_DEFINITIONS.japan_legend_guaranteed.descriptionEn,
    usageHintJa: '日本国籍のレジェンド選手のみが確定登場します。',
    usageHintEn: 'Guaranteed Japanese Legend draw.',
    accentColor: REWARD_SCOUT_DEFINITIONS.japan_legend_guaranteed.badgeColor,
    badgeText: '日本L確定',
    iconKey: 'Crown',
  },
  manager_select_ticket: {
    type: 'manager_select_ticket',
    category: 'manager',
    nameJa: '監督選択スカウト',
    nameEn: 'Manager Select Ticket',
    descriptionJa:
      '監督一覧から好きな監督を1名選んで獲得できます。通常の1ゲーム1回限定の監督ドラフトガチャとは別枠で管理されます。',
    descriptionEn:
      'Choose 1 preferred manager directly from the Manager Database without affecting the 1-per-game Manager Draft gacha limit.',
    usageHintJa: '監督選択画面を開き、好きな監督を1名獲得します。',
    usageHintEn: 'Open Manager Select to recruit 1 manager.',
    accentColor: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
    badgeText: '監督',
    iconKey: 'Briefcase',
  },
  position_plus: {
    type: 'position_plus',
    category: 'position',
    nameJa: 'ポジションplus',
    nameEn: 'Position Plus',
    descriptionJa:
      '任意の選手（GKを除く）にまだ所持していない適正ポジションを1つ追加します。MY TEAM配置時のOVRペナルティを解消できます。',
    descriptionEn:
      'Grant 1 additional natural eFootball position (non-duplicate) to an outfield player, removing placement OVR penalties.',
    usageHintJa: 'MY TEAM所属のフィールド選手と追加ポジションを選びます。',
    usageHintEn: 'Select an outfield player and an eligible new position.',
    accentColor: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
    badgeText: '+POS',
    iconKey: 'Compass',
  },
};

export function isScoutTicketType(itemType: InventoryItemType): boolean {
  return ITEM_CATALOG[itemType]?.category === 'scout';
}

export function evaluateItemUsability(
  itemType: InventoryItemType,
  ownedCount: number,
  teams: UserTeam[],
  options?: { isExpiredOnly?: boolean }
): { usable: boolean; reasonJa: string; reasonEn: string } {
  if (ownedCount <= 0) {
    return {
      usable: false,
      reasonJa: options?.isExpiredOnly ? '有効期限切れのため使用できません' : '所持数 0 のため使用できません',
      reasonEn: options?.isExpiredOnly ? 'Expired item cannot be used' : 'You own 0 of this item',
    };
  }

  const allDraftedPlayers = teams.flatMap((t) => t.players || []);

  if (itemType === 'training_chip') {
    if (ownedCount < CHIPS_PER_LEVEL) {
      return {
        usable: false,
        reasonJa: `トレーニングチップが${CHIPS_PER_LEVEL}個以上必要です（現在 ${ownedCount}個）`,
        reasonEn: `Need at least ${CHIPS_PER_LEVEL} Training Chips (currently ${ownedCount})`,
      };
    }
    const hasTrainable = allDraftedPlayers.some((p) => (p.level ?? 1) < MAX_PLAYER_LEVEL);
    if (!hasTrainable) {
      return {
        usable: false,
        reasonJa: '育成可能な選手（Lv.10未満のMY TEAM所属選手）がいません',
        reasonEn: 'No players below Lv.10 in MY TEAM',
      };
    }
    return { usable: true, reasonJa: '使用可能', reasonEn: 'Available' };
  }

  if (itemType === 'awakening_ticket') {
    const hasAwakenable = allDraftedPlayers.some(
      (p) => (p.level ?? 1) === MAX_PLAYER_LEVEL && (p.awakeningLevel ?? 0) < MAX_AWAKENING_LEVEL
    );
    if (!hasAwakenable) {
      return {
        usable: false,
        reasonJa: 'Lv.10到達済み＆覚醒Lv.7未満の選手がMY TEAMにいません',
        reasonEn: 'No Lv.10 players below Awakening Lv.7 in MY TEAM',
      };
    }
    return { usable: true, reasonJa: '使用可能', reasonEn: 'Available' };
  }

  if (itemType === 'position_plus') {
    const hasOutfielder = allDraftedPlayers.some((p) => p.position !== 'GK');
    if (!hasOutfielder) {
      return {
        usable: false,
        reasonJa: 'ポジションを追加できるフィールド選手がMY TEAMにいません',
        reasonEn: 'No outfield players in MY TEAM',
      };
    }
    return { usable: true, reasonJa: '使用可能', reasonEn: 'Available' };
  }

  return { usable: true, reasonJa: '使用可能', reasonEn: 'Available' };
}

export function formatRemainingTime(expiresAt?: number, nowMs: number = Date.now()): string | null {
  if (!expiresAt) return null;
  const diff = expiresAt - nowMs;
  if (diff <= 0) return '期限切れ';
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `あと${days}日${hours}時間`;
  const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  return `あと${hours}時間${mins}分`;
}

// Local Cache Helpers
const LS_NON_SCOUT_INVENTORY = 'FOOTBALL_DRAFT_NON_SCOUT_INVENTORY_V160';
const LS_USAGE_LOGS = 'FOOTBALL_DRAFT_ITEM_USAGE_LOGS_V160';
const LS_OWNED_MANAGERS = 'FOOTBALL_DRAFT_OWNED_MANAGERS_V160';
const LS_TIMED_LOTS = 'FOOTBALL_DRAFT_TIMED_TICKET_LOTS_V160';

export function getStoredNonScoutInventory(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_NON_SCOUT_INVENTORY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveNonScoutInventory(inv: Record<string, number>): void {
  try {
    localStorage.setItem(LS_NON_SCOUT_INVENTORY, JSON.stringify(inv));
  } catch (e) {
    console.warn('Failed to save non-scout inventory:', e);
  }
}

export function getStoredUsageLogs(userId?: string): ItemUsageLogEntry[] {
  try {
    const raw = localStorage.getItem(LS_USAGE_LOGS);
    const parsed: ItemUsageLogEntry[] = raw ? JSON.parse(raw) : [];
    return userId ? parsed.filter((l) => l.userId === userId) : parsed;
  } catch {
    return [];
  }
}

export function saveUsageLogs(logs: ItemUsageLogEntry[]): void {
  try {
    localStorage.setItem(LS_USAGE_LOGS, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.warn('Failed to save usage logs:', e);
  }
}

export function getStoredOwnedManagers(): OwnedManagerRecord[] {
  try {
    const raw = localStorage.getItem(LS_OWNED_MANAGERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOwnedManagers(list: OwnedManagerRecord[]): void {
  try {
    localStorage.setItem(LS_OWNED_MANAGERS, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save owned managers:', e);
  }
}

export function getStoredTimedLots(): TimedTicketLot[] {
  try {
    const raw = localStorage.getItem(LS_TIMED_LOTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTimedLots(lots: TimedTicketLot[]): void {
  try {
    localStorage.setItem(LS_TIMED_LOTS, JSON.stringify(lots));
  } catch (e) {
    console.warn('Failed to save timed ticket lots:', e);
  }
}
