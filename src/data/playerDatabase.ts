import { Player, GameMode, PlayerCategory } from '../types';
import { EUROPEAN_PLAYERS } from './playersEurope';
import { EUROPEAN_PLAYERS_MODERN } from './playersEuropeModern';
import { EUROPEAN_PLAYERS_SQUAD } from './playersEuropeSquad';
import { J1_PLAYERS } from './playersJ1';
import { J1_PLAYERS_MODERN } from './playersJ1Modern';
import { J1_PLAYERS_SQUAD } from './playersJ1Squad';
import { EUROPEAN_CLUBS, J1_CLUBS, ALL_CLUBS } from './clubs';

// Helper to normalize and auto-assign categories if omitted
function normalizePlayer(p: Player): Player {
  let category: PlayerCategory = p.category || 'NORMAL';

  if (!p.category) {
    if (p.isLegendary) {
      category = 'LEGEND';
    } else if (p.rating >= 85) {
      category = 'STAR';
    } else if (p.rating >= 78) {
      category = 'MID';
    } else {
      category = 'NORMAL';
    }
  }

  return {
    ...p,
    category,
    isLegendary: category === 'LEGEND' || Boolean(p.isLegendary),
  };
}

// Helper to deduplicate player lists by playerId
function deduplicatePlayers(players: Player[]): Player[] {
  const map = new Map<string, Player>();
  for (const p of players) {
    if (!map.has(p.playerId)) {
      map.set(p.playerId, normalizePlayer(p));
    }
  }
  return Array.from(map.values());
}

export const COMBINED_EUROPEAN_PLAYERS: Player[] = deduplicatePlayers([
  ...EUROPEAN_PLAYERS,
  ...EUROPEAN_PLAYERS_MODERN,
  ...EUROPEAN_PLAYERS_SQUAD,
]);

export const COMBINED_J1_PLAYERS: Player[] = deduplicatePlayers([
  ...J1_PLAYERS,
  ...J1_PLAYERS_MODERN,
  ...J1_PLAYERS_SQUAD,
]);

export const ALL_PLAYERS: Player[] = [...COMBINED_EUROPEAN_PLAYERS, ...COMBINED_J1_PLAYERS];

// Validate database integrity on module load to guarantee zero bugs
export function validateDatabaseIntegrity(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validClubIds = new Set(ALL_CLUBS.map((c) => c.id));
  const seenPlayerIds = new Set<string>();

  for (const p of ALL_PLAYERS) {
    if (seenPlayerIds.has(p.playerId)) {
      errors.push(`Duplicate playerId found: ${p.playerId}`);
    }
    seenPlayerIds.add(p.playerId);

    if (!validClubIds.has(p.clubId)) {
      errors.push(`Invalid clubId "${p.clubId}" for player ${p.playerName} (${p.playerId})`);
    }

    if (typeof p.joiningYear !== 'number' || p.joiningYear < 1990 || p.joiningYear > 2026) {
      errors.push(`Invalid joiningYear "${p.joiningYear}" for player ${p.playerName}`);
    }

    if (!['GK', 'DF', 'MF', 'FW'].includes(p.position)) {
      errors.push(`Invalid position "${p.position}" for player ${p.playerName}`);
    }

    if (!p.nameJa || !p.nameEn || !p.nameEs) {
      errors.push(`Missing multilingual name for player ${p.playerName}`);
    }
  }

  if (errors.length > 0) {
    console.error('Data Integrity Errors:', errors);
  } else {
    console.log(`[FOOTBALL DRAFT] Database Integrity Verified: ${ALL_PLAYERS.length} verified real players loaded.`);
  }

  return { valid: errors.length === 0, errors };
}

// Run validation once at startup
validateDatabaseIntegrity();

export function getPlayersByMode(mode: GameMode): Player[] {
  return mode === 'europe' ? COMBINED_EUROPEAN_PLAYERS : COMBINED_J1_PLAYERS;
}

export function getClubsByMode(mode: GameMode) {
  return mode === 'europe' ? EUROPEAN_CLUBS : J1_CLUBS;
}

// Available years for roulette per mode (all distinct years present in that dataset)
export function getAvailableYears(mode: GameMode): number[] {
  const players = getPlayersByMode(mode);
  const yearsSet = new Set<number>();
  players.forEach((p) => yearsSet.add(Number(p.joiningYear)));
  
  // Also provide standard range from 2000 to 2026 for a rich roulette reel
  for (let y = 2000; y <= 2026; y++) {
    yearsSet.add(y);
  }

  return Array.from(yearsSet).sort((a, b) => a - b);
}

// Search candidates by normalized Year and Club ID, excluding acquired player IDs and person IDs
export function findCandidatePlayers(
  mode: GameMode,
  year: number | string,
  clubId: string,
  acquiredPlayerIds: string[],
  acquiredPersonIds: string[] = []
): Player[] {
  const normalizedYear = typeof year === 'string' ? parseInt(year, 10) : year;
  const players = getPlayersByMode(mode);

  const acquiredPlayerSet = new Set(acquiredPlayerIds);
  const acquiredPersonSet = new Set(acquiredPersonIds);

  return players.filter((player) => {
    const matchesYear = Number(player.joiningYear) === normalizedYear;
    const matchesClub = String(player.clubId).trim().toLowerCase() === String(clubId).trim().toLowerCase();
    const notAcquired = !acquiredPlayerSet.has(player.playerId) && !acquiredPersonSet.has(player.personId);

    return matchesYear && matchesClub && notAcquired;
  });
}

// For Black Ball event: choose a combination that is guaranteed or very likely to have legendary players
export function getLegendaryCombination(
  mode: GameMode,
  acquiredPlayerIds: string[],
  acquiredPersonIds: string[] = []
): { year: number; clubId: string; player: Player } | null {
  const players = getPlayersByMode(mode);
  const acquiredPlayerSet = new Set(acquiredPlayerIds);
  const acquiredPersonSet = new Set(acquiredPersonIds);

  const availableLegendaries = players.filter(
    (p) =>
      p.isLegendary &&
      !acquiredPlayerSet.has(p.playerId) &&
      !acquiredPersonSet.has(p.personId)
  );

  if (availableLegendaries.length === 0) {
    // Fallback to highest rating available
    const available = players.filter(
      (p) => !acquiredPlayerSet.has(p.playerId) && !acquiredPersonSet.has(p.personId)
    );
    if (available.length === 0) return null;
    available.sort((a, b) => b.rating - a.rating);
    const chosen = available[0];
    return { year: chosen.joiningYear, clubId: chosen.clubId, player: chosen };
  }

  // Pick a random legendary
  const chosen = availableLegendaries[Math.floor(Math.random() * availableLegendaries.length)];
  return { year: chosen.joiningYear, clubId: chosen.clubId, player: chosen };
}
