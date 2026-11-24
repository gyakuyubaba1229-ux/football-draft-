import { Player, PlayerCategory, Language } from '../types';
import type { DraftRevealTier } from '../components/BlackBallAnimation';

/**
 * Unified formal rarity tier across Draw -> Reveal Animation -> Card Display.
 * Never infers Black Ball / Golden / Purple purely from raw OVR or player name!
 */
export type UnifiedRarity =
  | 'purple'
  | 'golden'
  | 'black'
  | 'star'
  | 'mid'
  | 'young'
  | 'normal';

export type GachaStagingEvent = 'blackball' | 'purple' | 'normal';

export const DRAFT_STAGING_PROBABILITIES = {
  BLACK_BALL: 0.018, // 1.8% (OVR 100+ stars only)
  PURPLE: 0.030,     // 3.0% (Purple active superstars)
  NORMAL: 0.952,     // 95.2% (Normal staging)
} as const;

/**
 * Single mutually exclusive per-spin draw roll.
 * Black Ball (1.8%) and Purple (3.0%) NEVER trigger simultaneously; remainder is Normal (95.2%).
 */
export function rollDraftStagingEvent(rand: number = Math.random()): GachaStagingEvent {
  if (rand < DRAFT_STAGING_PROBABILITIES.BLACK_BALL) {
    return 'blackball';
  }
  if (rand < DRAFT_STAGING_PROBABILITIES.BLACK_BALL + DRAFT_STAGING_PROBABILITIES.PURPLE) {
    return 'purple';
  }
  return 'normal';
}

const RARITY_PRIORITY: Record<UnifiedRarity, number> = {
  purple: 7,
  golden: 6,
  black: 5,
  star: 4,
  young: 3,
  mid: 2,
  normal: 1,
};

/**
 * Resolves the single authoritative rarity for any Player object.
 * Priority strictly uses formal card classification flags (never raw OVR >= 90 -> Black Ball).
 */
export function resolvePlayerRarity(
  player: Player,
  lockedOverride?: UnifiedRarity | null
): UnifiedRarity {
  // Check formal special card identifiers first
  const specialFlag = player.specialType || player.special_type;

  if (specialFlag === 'purple' || player.playerId.startsWith('purple_') || player.category === 'PURPLE_ACTIVE') {
    return 'purple';
  }

  if (specialFlag === 'golden' || player.playerId.startsWith('bd_special_')) {
    return 'golden';
  }

  if (specialFlag === 'black' || Boolean(player.isLegendary) || player.category === 'LEGEND') {
    return 'black';
  }

  // If caller locked a non-special rarity override, honor it only when consistent (not promoting non-black to black)
  if (
    lockedOverride &&
    lockedOverride !== 'purple' &&
    lockedOverride !== 'golden' &&
    lockedOverride !== 'black'
  ) {
    return lockedOverride;
  }

  if (player.category === 'YOUNG') return 'young';
  if (player.category === 'STAR' || player.rating >= 85) return 'star';
  if (player.category === 'MID' || player.rating >= 78) return 'mid';

  return 'normal';
}

/**
 * Maps unified player rarity to the exact reveal staging tier.
 * Guarantees non-Black-Ball players NEVER trigger Black Ball / Golden / Purple animations.
 */
export function rarityToRevealTier(rarity: UnifiedRarity): DraftRevealTier {
  switch (rarity) {
    case 'purple':
    case 'golden':
      return 'supreme';
    case 'black':
      return 'ultra';
    case 'star':
      return 'high';
    case 'young':
    case 'mid':
    case 'normal':
    default:
      return 'normal';
  }
}

/**
 * Maps unified rarity back to PlayerCategory for consistent card badge rendering.
 */
export function rarityToPlayerCategory(rarity: UnifiedRarity, originalCategory?: PlayerCategory): PlayerCategory {
  switch (rarity) {
    case 'purple':
      return 'PURPLE_ACTIVE';
    case 'golden':
    case 'black':
      return 'LEGEND';
    case 'star':
      return 'STAR';
    case 'young':
      return 'YOUNG';
    case 'mid':
      return originalCategory === 'VETERAN' ? 'VETERAN' : 'MID';
    case 'normal':
    default:
      return originalCategory === 'VETERAN' ? 'VETERAN' : 'NORMAL';
  }
}

/**
 * Picks the highest-rarity lead candidate from a list so reveal staging matches the top card shown.
 */
export function selectLeadCandidateByRarity(candidates: Player[]): {
  leadPlayer: Player | null;
  rarity: UnifiedRarity;
  tier: DraftRevealTier;
} {
  if (!candidates || candidates.length === 0) {
    return { leadPlayer: null, rarity: 'normal', tier: 'normal' };
  }

  const sorted = [...candidates].sort((a, b) => {
    const rA = RARITY_PRIORITY[resolvePlayerRarity(a)];
    const rB = RARITY_PRIORITY[resolvePlayerRarity(b)];
    if (rA !== rB) return rB - rA;
    return (b.rating || 0) - (a.rating || 0);
  });

  const leadPlayer = sorted[0];
  const rarity = resolvePlayerRarity(leadPlayer);
  return {
    leadPlayer,
    rarity,
    tier: rarityToRevealTier(rarity),
  };
}

export function getRarityDisplayLabel(rarity: UnifiedRarity, lang: Language): string {
  switch (rarity) {
    case 'purple':
      return lang === 'ja' ? '紫演出特枠 (PURPLE SPECIAL)' : lang === 'es' ? 'ESPECIAL MORADO' : 'PURPLE SPECIAL';
    case 'golden':
      return lang === 'ja' ? 'ゴールデンレジェンド' : lang === 'es' ? 'LEYENDA DORADA' : 'GOLDEN LEGEND';
    case 'black':
      return lang === 'ja' ? '黒玉 / レジェンド' : lang === 'es' ? 'BALÓN NEGRO / LEYENDA' : 'BLACK BALL / LEGEND';
    case 'star':
      return lang === 'ja' ? 'スター選手' : lang === 'es' ? 'ESTRELLA' : 'STAR PLAYER';
    case 'young':
      return lang === 'ja' ? '若手有望株' : lang === 'es' ? 'JOVEN PROMESA' : 'YOUNG TALENT';
    case 'mid':
      return lang === 'ja' ? '主力選手' : lang === 'es' ? 'CONSOLIDADO' : 'KEY PLAYER';
    case 'normal':
    default:
      return lang === 'ja' ? '通常選手' : lang === 'es' ? 'PLANTILLA' : 'STANDARD';
  }
}
