import { UserTeam, TeamTactics, FormationType, CustomPlayerPosition } from '../types';
import { DEFAULT_TACTICS } from './pvpEngine';

export const STORAGE_KEY_TACTICAL_DEFENSE_SQUAD = 'football_draft_tactical_defense_squad';
export const STORAGE_KEY_OVR_DEFENSE_SQUAD = 'football_draft_ovr_defense_squad';
export const STORAGE_KEY_TACTICAL_DEFENSE_TACTICS = 'football_draft_tactical_defense_tactics';

/**
 * Deep clone a UserTeam to prevent accidental mutations
 */
export function cloneUserTeam(team: UserTeam, newIdPrefix?: string): UserTeam {
  return {
    teamId: newIdPrefix ? `${newIdPrefix}_${Date.now()}` : team.teamId,
    name: team.name,
    teamNumber: team.teamNumber,
    mode: team.mode || 'europe',
    players: team.players ? JSON.parse(JSON.stringify(team.players)) : [],
    formation: team.formation || '4-3-3',
    playerSlots: team.playerSlots ? { ...team.playerSlots } : {},
    customPositions: team.customPositions ? JSON.parse(JSON.stringify(team.customPositions)) : {},
    isCompleted: team.isCompleted ?? true,
    isLocked: team.isLocked ?? false,
    createdAt: team.createdAt || Date.now(),
    completedAt: team.completedAt || Date.now(),
  };
}

/**
 * Get the saved Tactical Defense Squad. If not present, creates one from the fallback team.
 */
export function getTacticalDefenseSquad(fallbackTeam?: UserTeam, teams?: UserTeam[]): UserTeam | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TACTICAL_DEFENSE_SQUAD);
    if (saved) {
      const parsed = JSON.parse(saved) as UserTeam;
      if (parsed && parsed.players && parsed.players.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load tactical defense squad', err);
  }

  const candidate = fallbackTeam || (teams && teams.find((t) => t.players && t.players.length === 11)) || (teams && teams[0]);
  if (candidate) {
    const cloned = cloneUserTeam(candidate, 'tactical_def');
    cloned.name = '戦術対戦 守備スカッド';
    return cloned;
  }
  return null;
}

/**
 * Save Tactical Defense Squad to persistent storage
 */
export function saveTacticalDefenseSquad(squad: UserTeam): boolean {
  try {
    const toSave: UserTeam = {
      ...squad,
      name: squad.name || '戦術対戦 守備スカッド',
    };
    localStorage.setItem(STORAGE_KEY_TACTICAL_DEFENSE_SQUAD, JSON.stringify(toSave));
    return true;
  } catch (err) {
    console.error('Failed to save tactical defense squad', err);
    return false;
  }
}

/**
 * Get the saved Tactical Defense Tactics
 */
export function getTacticalDefenseTactics(): TeamTactics {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TACTICAL_DEFENSE_TACTICS);
    if (saved) {
      return JSON.parse(saved) as TeamTactics;
    }
  } catch (err) {
    console.error('Failed to load tactical defense tactics', err);
  }
  return DEFAULT_TACTICS;
}

/**
 * Save Tactical Defense Tactics to persistent storage
 */
export function saveTacticalDefenseTactics(tactics: TeamTactics): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_TACTICAL_DEFENSE_TACTICS, JSON.stringify(tactics));
    return true;
  } catch (err) {
    console.error('Failed to save tactical defense tactics', err);
    return false;
  }
}

/**
 * Get the saved OVR Defense Squad. If not present, creates one from the fallback team.
 */
export function getOVRDefenseSquad(fallbackTeam?: UserTeam, teams?: UserTeam[]): UserTeam | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_OVR_DEFENSE_SQUAD);
    if (saved) {
      const parsed = JSON.parse(saved) as UserTeam;
      if (parsed && parsed.players && parsed.players.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load OVR defense squad', err);
  }

  const candidate = fallbackTeam || (teams && teams.find((t) => t.players && t.players.length === 11)) || (teams && teams[0]);
  if (candidate) {
    const cloned = cloneUserTeam(candidate, 'ovr_def');
    cloned.name = 'OVR対戦 守備スカッド';
    return cloned;
  }
  return null;
}

/**
 * Save OVR Defense Squad to persistent storage
 */
export function saveOVRDefenseSquad(squad: UserTeam): boolean {
  try {
    const toSave: UserTeam = {
      ...squad,
      name: squad.name || 'OVR対戦 守備スカッド',
    };
    localStorage.setItem(STORAGE_KEY_OVR_DEFENSE_SQUAD, JSON.stringify(toSave));
    return true;
  } catch (err) {
    console.error('Failed to save OVR defense squad', err);
    return false;
  }
}
