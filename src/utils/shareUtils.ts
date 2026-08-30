import { Language, UserTeam, Player, FORMATIONS, FormationType } from '../types';
import { getLocalizedPlayerName } from './translations';
import { ALL_PLAYERS } from '../data/playerDatabase';

export const DEFAULT_X_CHAR_LIMIT = 280; // Standard X (Twitter) character limit for free tier
export const STORAGE_KEY_X_CHAR_LIMIT = 'footballDraft_xCharLimit';

export interface ShareDataResult {
  title: string;
  summaryText: string;
  fullMessage: string;
  xShareText: string;
  xShareUrl: string;
  lineShareUrl: string;
  facebookShareUrl: string;
  url: string;
  xCharCount: number;
  xCharLimit: number;
  isWithinXLimit: boolean;
}

/**
 * Calculates the weighted character length according to X (Twitter) counting rules:
 * - ASCII characters / standard single-byte characters: 1 weight (0.5 in 280 scale -> count = 1 character out of 280)
 * - CJK / Fullwidth / Emoji: 2 weight (1 full character in 140 scale -> 2 units in 280 scale)
 * Note: When testing X character limit (280 units total):
 * Single-byte character = 1 unit.
 * Double-byte / CJK / Emoji = 2 units.
 * URLs = 23 units (t.co conversion).
 */
export function calculateXWeightedLength(text: string): number {
  let count = 0;
  // Replace URLs with placeholder of 23 characters for Twitter counting accuracy if present
  const urlRegex = /https?:\/\/[^\s]+/g;
  const textWithoutUrls = text.replace(urlRegex, '');
  const urls = text.match(urlRegex) || [];
  
  count += urls.length * 23;

  for (const char of textWithoutUrls) {
    const code = char.codePointAt(0) || 0;
    // Standard ASCII range (0x0000 - 0x007F) and Latin-1 supplement symbols (0x0080 - 0x00FF)
    if (code <= 0x00ff) {
      count += 1;
    } else {
      // CJK, Emoji, Fullwidth count as 2 units in the 280 max character pool
      count += 2;
    }
  }

  return count;
}

/**
 * Helper to shorten player names cleanly if needed:
 * e.g., "クリスティアーノ・ロナウド" -> "C.ロナウド" or "ロナウド"
 * e.g., "Cristiano Ronaldo" -> "C. Ronaldo"
 * e.g., "Kevin De Bruyne" -> "De Bruyne"
 */
export function shortenPlayerName(name: string, lang: Language): string {
  if (!name) return '';

  if (lang === 'ja') {
    // For Japanese names with middle dot "・" (e.g. クリスティアーノ・ロナウド -> C.ロナウド / ロナウド)
    if (name.includes('・')) {
      const parts = name.split('・');
      if (parts.length >= 2) {
        // Return last part (surname / known name)
        return parts[parts.length - 1];
      }
    }
    // If name is long without dot
    if (name.length > 8) {
      return name.slice(0, 7) + '..';
    }
    return name;
  }

  // Western / Spanish / English names
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    const firstInitial = parts[0][0] + '.';
    const lastName = parts.slice(1).join(' ');
    if (lastName.length <= 10) {
      return `${firstInitial} ${lastName}`;
    }
    return lastName;
  }

  return name;
}

export interface GroupedRawPlayers {
  gk: Player[];
  df: Player[];
  mf: Player[];
  fw: Player[];
}

export function getGroupedSquadPlayers(team: UserTeam): GroupedRawPlayers {
  const gk: Player[] = [];
  const df: Player[] = [];
  const mf: Player[] = [];
  const fw: Player[] = [];

  const presetBase: Exclude<FormationType, 'CUSTOM'> =
    team.formation === 'CUSTOM' ? '4-3-3' : (team.formation as Exclude<FormationType, 'CUSTOM'>) || '4-3-3';
  const baseSlots = FORMATIONS[presetBase]?.slots || FORMATIONS['4-3-3'].slots;

  const playersById = new Map<string, Player>();
  for (const p of team.players) {
    playersById.set(p.playerId, p);
  }

  const assignedPlayers = new Set<string>();

  for (const slot of baseSlots) {
    const pId = team.playerSlots?.[slot.id];
    if (pId && playersById.has(pId)) {
      const p = playersById.get(pId)!;
      assignedPlayers.add(p.playerId);
      if (slot.pos === 'GK') gk.push(p);
      else if (slot.pos === 'DF') df.push(p);
      else if (slot.pos === 'MF') mf.push(p);
      else fw.push(p);
    }
  }

  for (const p of team.players) {
    if (!assignedPlayers.has(p.playerId)) {
      if (p.position === 'GK') gk.push(p);
      else if (p.position === 'DF') df.push(p);
      else if (p.position === 'MF') mf.push(p);
      else fw.push(p);
    }
  }

  return { gk, df, mf, fw };
}

/**
 * Builds the compact, high-priority X share post text fitting strictly within charLimit.
 * Structure requested by user:
 * ⚽ FOOTBALL DRAFT
 * 自分だけのベストイレブン完成🔥
 * 
 * GK: ○○
 * DF: ○○ / ○○ / ○○ / ○○
 * MF: ○○ / ○○ / ○○
 * FW: ○○ / ○○ / ○○
 * 
 * あなたもFOOTBALL DRAFTで作ってみよう！
 * 
 * #FOOTBALLDRAFT
 */
export function buildXShareText(
  team: UserTeam,
  language: Language,
  charLimit: number = DEFAULT_X_CHAR_LIMIT
): string {
  const grouped = getGroupedSquadPlayers(team);

  // Localized texts
  let title = '⚽ FOOTBALL DRAFT';
  let tagline = '自分だけのベストイレブン完成🔥';
  let cta = 'あなたもFOOTBALL DRAFTで作ってみよう！';
  let hashtag = '#FOOTBALLDRAFT';

  if (language === 'en') {
    title = '⚽ FOOTBALL DRAFT';
    tagline = 'My Ultimate Best XI is ready!🔥';
    cta = 'Build your own Dream Team on FOOTBALL DRAFT!';
    hashtag = '#FOOTBALLDRAFT';
  } else if (language === 'es') {
    title = '⚽ FOOTBALL DRAFT';
    tagline = '¡Mi Once Ideal completado!🔥';
    cta = '¡Crea tu propio equipo en FOOTBALL DRAFT!';
    hashtag = '#FOOTBALLDRAFT';
  }

  // Helper to construct post given a formatter for player names
  const renderPost = (
    nameFormatter: (p: Player) => string,
    includeCta: boolean = true,
    includeTagline: boolean = true
  ): string => {
    const formatList = (players: Player[]) =>
      players.map((p) => nameFormatter(p)).join(' / ');

    const lines: string[] = [title];
    if (includeTagline) {
      lines.push(tagline);
    }
    lines.push('');

    if (grouped.gk.length > 0) lines.push(`GK: ${formatList(grouped.gk)}`);
    if (grouped.df.length > 0) lines.push(`DF: ${formatList(grouped.df)}`);
    if (grouped.mf.length > 0) lines.push(`MF: ${formatList(grouped.mf)}`);
    if (grouped.fw.length > 0) lines.push(`FW: ${formatList(grouped.fw)}`);

    lines.push('');
    if (includeCta) {
      lines.push(cta);
      lines.push('');
    }
    lines.push(hashtag);

    return lines.join('\n');
  };

  // 1. Attempt standard full localized names
  const standardNameFormatter = (p: Player) => {
    const dbPlayer = ALL_PLAYERS.find((dp) => dp.playerId === p.playerId) || p;
    return getLocalizedPlayerName(dbPlayer, language);
  };

  let candidate = renderPost(standardNameFormatter, true, true);
  if (calculateXWeightedLength(candidate) <= charLimit) {
    return candidate;
  }

  // 2. Attempt shortened player names (e.g. Cristiano Ronaldo -> C. Ronaldo, クリスティアーノ・ロナウド -> ロナウド)
  const shortenedNameFormatter = (p: Player) => {
    const dbPlayer = ALL_PLAYERS.find((dp) => dp.playerId === p.playerId) || p;
    const fullName = getLocalizedPlayerName(dbPlayer, language);
    return shortenPlayerName(fullName, language);
  };

  candidate = renderPost(shortenedNameFormatter, true, true);
  if (calculateXWeightedLength(candidate) <= charLimit) {
    return candidate;
  }

  // 3. If still over limit, simplify CTA
  candidate = renderPost(shortenedNameFormatter, false, true);
  if (calculateXWeightedLength(candidate) <= charLimit) {
    return candidate;
  }

  // 4. If still over limit, minimal layout
  candidate = renderPost(shortenedNameFormatter, false, false);
  if (calculateXWeightedLength(candidate) <= charLimit) {
    return candidate;
  }

  // 5. Ultimate fallback: aggressive truncation of individual names
  const ultraShortFormatter = (p: Player) => {
    const dbPlayer = ALL_PLAYERS.find((dp) => dp.playerId === p.playerId) || p;
    const fullName = getLocalizedPlayerName(dbPlayer, language);
    const short = shortenPlayerName(fullName, language);
    return short.length > 5 ? short.slice(0, 5) : short;
  };

  return renderPost(ultraShortFormatter, false, false);
}

/**
 * Generate full share data for all platforms, guaranteeing X share fits within char limit.
 */
export function generateShareData(
  team: UserTeam,
  language: Language,
  customAppUrl?: string,
  xCharLimit: number = DEFAULT_X_CHAR_LIMIT
): ShareDataResult {
  const currentUrl = customAppUrl || (typeof window !== 'undefined' ? window.location.href : 'https://football-draft.app');
  const avgRating =
    team.players.length > 0
      ? Math.round(team.players.reduce((acc, p) => acc + p.rating, 0) / team.players.length)
      : 0;

  // Build the dedicated concise text for X (Twitter)
  const xShareText = buildXShareText(team, language, xCharLimit);
  const xCharCount = calculateXWeightedLength(xShareText);
  const isWithinXLimit = xCharCount <= xCharLimit;

  // Full detailed message for other apps (LINE, Notes, Clipboard, etc.)
  const grouped = getGroupedSquadPlayers(team);
  const formatListWithDetails = (players: Player[]) => {
    return players
      .map((p) => {
        const dbPlayer = ALL_PLAYERS.find((dp) => dp.playerId === p.playerId) || p;
        const name = getLocalizedPlayerName(dbPlayer, language);
        return `${name} (${p.rating})`;
      })
      .join(' / ');
  };

  let title = '⚽ FOOTBALL DRAFT';
  let tagline = '自分だけのベストイレブン完成🔥';
  let cta = 'あなたもFOOTBALL DRAFTで作ってみよう！';
  let hashtag = '#FOOTBALLDRAFT';

  if (language === 'en') {
    tagline = 'My Ultimate Best XI is ready!🔥';
    cta = 'Build your own Dream Team on FOOTBALL DRAFT!';
  } else if (language === 'es') {
    tagline = '¡Mi Once Ideal completado!🔥';
    cta = '¡Crea tu propio equipo en FOOTBALL DRAFT!';
  }

  const fullMessage = [
    title,
    tagline,
    `🏆 ${team.name || `TEAM ${team.teamNumber}`} (OVR: ${avgRating})`,
    '',
    grouped.gk.length > 0 ? `🧤 GK: ${formatListWithDetails(grouped.gk)}` : '',
    grouped.df.length > 0 ? `🛡️ DF: ${formatListWithDetails(grouped.df)}` : '',
    grouped.mf.length > 0 ? `⚔️ MF: ${formatListWithDetails(grouped.mf)}` : '',
    grouped.fw.length > 0 ? `⚡ FW: ${formatListWithDetails(grouped.fw)}` : '',
    '',
    cta,
    '',
    hashtag,
  ]
    .filter(Boolean)
    .join('\n');

  const summaryText = `${title} - ${team.name || `TEAM ${team.teamNumber}`} (OVR: ${avgRating})`;

  // X Share URL (Twitter intent uses pure tweet text formatted specifically for X)
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    xShareText
  )}`;

  const lineShareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(
    `${xShareText}\n\n${currentUrl}`
  )}`;

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    currentUrl
  )}&quote=${encodeURIComponent(xShareText)}`;

  return {
    title,
    summaryText,
    fullMessage,
    xShareText,
    xShareUrl,
    lineShareUrl,
    facebookShareUrl,
    url: currentUrl,
    xCharCount,
    xCharLimit,
    isWithinXLimit,
  };
}
