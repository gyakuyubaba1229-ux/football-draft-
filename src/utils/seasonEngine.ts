/**
 * Weekly Season Engine (JST UTC+9)
 * Season 1: 2026/09/02 (Wed) 00:00:00 JST 〜 2026/09/06 (Sun) 23:59:59 JST
 * Season 2: 2026/09/07 (Mon) 00:00:00 JST 〜 2026/09/13 (Sun) 23:59:59 JST
 * Subsequent seasons: Every Monday 00:00:00 JST 〜 Sunday 23:59:59 JST
 */
import { Language } from '../types';

export interface SeasonInfo {
  seasonNumber: number;
  seasonLabel: string;
  seasonNameJa: string;
  seasonNameEn: string;
  startDate: Date;
  endDate: Date;
  startDateMs: number;
  endDateMs: number;
  formattedRange: string;
  remainingTimeTextJa: string;
  remainingTimeTextEn: string;
  remainingSeconds: number;
  isActive: boolean;
}

// JST Offset in milliseconds: +9 hours
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// Season 1 Start in JST (2026-09-02 00:00:00 JST = 2026-09-01 15:00:00 UTC)
export const SEASON_1_START_MS = Date.UTC(2026, 8, 1, 15, 0, 0); // 2026-09-02 00:00:00 JST

// Season 1 End in JST (2026-09-06 23:59:59.999 JST = 2026-09-06 14:59:59.999 UTC)
export const SEASON_1_END_MS = Date.UTC(2026, 8, 6, 14, 59, 59, 999);

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Returns current timestamp converted to JST Date object
 */
export function getNowJST(baseTimestamp: number = Date.now()): Date {
  return new Date(baseTimestamp + JST_OFFSET_MS);
}

/**
 * Determine which season a given UTC timestamp belongs to
 */
export function getSeasonNumberForTimestamp(timestamp: number): number {
  if (timestamp < SEASON_1_START_MS) {
    return 1;
  }
  if (timestamp <= SEASON_1_END_MS) {
    return 1;
  }
  
  // From Season 2 onwards
  const diffAfterS1 = timestamp - (SEASON_1_END_MS + 1);
  const weeksAfter = Math.floor(diffAfterS1 / ONE_WEEK_MS);
  return 2 + Math.max(0, weeksAfter);
}

/**
 * Get the exact time range for any season number
 */
export function getSeasonRange(seasonNum: number): { startMs: number; endMs: number } {
  if (seasonNum <= 1) {
    return {
      startMs: SEASON_1_START_MS,
      endMs: SEASON_1_END_MS,
    };
  }
  
  const offsetWeeks = seasonNum - 2;
  const startMs = SEASON_1_END_MS + 1 + offsetWeeks * ONE_WEEK_MS;
  const endMs = startMs + ONE_WEEK_MS - 1;
  
  return { startMs, endMs };
}

/**
 * Format date in JST for display (e.g. 2026/09/02)
 */
function formatJSTDate(utcMs: number, includeDayOfWeek = false): string {
  const d = new Date(utcMs + JST_OFFSET_MS);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const date = String(d.getUTCDate()).padStart(2, '0');
  
  if (!includeDayOfWeek) {
    return `${year}/${month}/${date}`;
  }
  
  const daysJa = ['日', '月', '火', '水', '木', '金', '土'];
  const dayName = daysJa[d.getUTCDay()];
  return `${year}/${month}/${date}(${dayName})`;
}

/**
 * Get detailed information about the active season or a specific season
 */
export function getSeasonInfo(seasonNum?: number, currentTimestamp: number = Date.now()): SeasonInfo {
  const activeSeasonNumber = getSeasonNumberForTimestamp(currentTimestamp);
  const targetSeason = typeof seasonNum === 'number' && seasonNum > 0 ? seasonNum : activeSeasonNumber;
  
  const { startMs, endMs } = getSeasonRange(targetSeason);
  const startDate = new Date(startMs);
  const endDate = new Date(endMs);
  
  const startFormatted = formatJSTDate(startMs, true);
  const endFormatted = formatJSTDate(endMs, true);
  const formattedRange = `${startFormatted} 00:00 〜 ${endFormatted} 23:59 (JST)`;
  
  // Remaining time calculation
  const remainingMs = Math.max(0, endMs - currentTimestamp);
  const remainingSeconds = Math.floor(remainingMs / 1000);
  
  const days = Math.floor(remainingSeconds / 86400);
  const hours = Math.floor((remainingSeconds % 86400) / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  
  let remainingTimeTextJa = '';
  let remainingTimeTextEn = '';
  
  if (remainingSeconds <= 0) {
    remainingTimeTextJa = 'シーズン終了';
    remainingTimeTextEn = 'Season Ended';
  } else if (days > 0) {
    remainingTimeTextJa = `残り ${days}日 ${hours}時間 ${minutes}分`;
    remainingTimeTextEn = `${days}d ${hours}h ${minutes}m left`;
  } else if (hours > 0) {
    remainingTimeTextJa = `残り ${hours}時間 ${minutes}分 ${seconds}秒`;
    remainingTimeTextEn = `${hours}h ${minutes}m ${seconds}s left`;
  } else {
    remainingTimeTextJa = `残り ${minutes}分 ${seconds}秒`;
    remainingTimeTextEn = `${minutes}m ${seconds}s left`;
  }

  return {
    seasonNumber: targetSeason,
    seasonLabel: `MATCH SEASON ${targetSeason}`,
    seasonNameJa: `週間ランキング 第${targetSeason}シーズン`,
    seasonNameEn: `Weekly Season ${targetSeason}`,
    startDate,
    endDate,
    startDateMs: startMs,
    endDateMs: endMs,
    formattedRange,
    remainingTimeTextJa,
    remainingTimeTextEn,
    remainingSeconds,
    isActive: targetSeason === activeSeasonNumber,
  };
}

export function getCurrentSeasonInfo(currentTimestamp: number = Date.now()): SeasonInfo {
  return getSeasonInfo(undefined, currentTimestamp);
}

/**
 * Format season period nicely
 */
export function formatSeasonPeriod(seasonNum: number, lang: Language = 'ja'): string {
  const info = getSeasonInfo(seasonNum);
  return info.formattedRange;
}

/**
 * Get list of available seasons up to current
 */
export function getAvailableSeasons(currentTimestamp: number = Date.now()): SeasonInfo[] {
  const currentSeasonNum = getSeasonNumberForTimestamp(currentTimestamp);
  const list: SeasonInfo[] = [];
  
  for (let s = currentSeasonNum; s >= 1; s--) {
    list.push(getSeasonInfo(s, currentTimestamp));
  }
  
  return list;
}

export function getHistoricalSeasons(currentTimestamp: number = Date.now()): SeasonInfo[] {
  return getAvailableSeasons(currentTimestamp);
}
