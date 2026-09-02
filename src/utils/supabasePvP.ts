import { supabase } from './supabase';
import {
  BetaUserProfile,
  BetaMatchRecord,
  UserTeam,
  TeamTactics,
} from '../types';
import { DEFAULT_TACTICS } from './pvpEngine';

const PRESENCE_CHANNEL_NAME = 'pvp_global_presence';
const DATA_SYNC_CHANNEL_NAME = 'pvp_data_sync';
const LOCAL_STORAGE_REAL_USERS = 'FOOTBALL_DRAFT_PVP_REAL_USERS_V1';
const LOCAL_STORAGE_CURRENT_USER_ID = 'FOOTBALL_DRAFT_PVP_USER_ID_V1';
const LOCAL_STORAGE_CURRENT_HANDLE = 'FOOTBALL_DRAFT_PVP_CURRENT_HANDLE_V1';
const LOCAL_STORAGE_SAVED_MATCHES = 'FOOTBALL_DRAFT_PVP_SAVED_MATCHES_V1';

// In-memory cache of online presence tracked via Supabase Realtime
let onlinePresenceUsers: Map<string, BetaUserProfile> = new Map();
let presenceChannel: any = null;
let syncChannel: any = null;
let heartbeatTimer: any = null;
let onOnlineUsersCallback: ((users: BetaUserProfile[]) => void) | null = null;
let onMatchInviteCallback: ((invite: any) => void) | null = null;

/**
 * Get or create a persistent user ID for this browser
 */
export function getPersistentUserId(): string {
  try {
    let id = localStorage.getItem(LOCAL_STORAGE_CURRENT_USER_ID);
    if (!id) {
      id = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_ID, id);
    }
    return id;
  } catch {
    return 'usr_' + Date.now().toString(36);
  }
}

/**
 * Get saved handle from localStorage
 */
export function getSavedUserHandle(): string {
  try {
    return localStorage.getItem(LOCAL_STORAGE_CURRENT_HANDLE) || '';
  } catch {
    return '';
  }
}

/**
 * Save handle to localStorage
 */
export function setSavedUserHandle(handle: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CURRENT_HANDLE, handle);
  } catch (e) {
    console.warn('Failed to save handle to storage', e);
  }
}

/**
 * Read cached real users from local storage
 */
function getCachedRealUsers(): BetaUserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REAL_USERS);
    if (raw) {
      const list: BetaUserProfile[] = JSON.parse(raw);
      return list.filter((u) => u && u.userId && u.username);
    }
  } catch (e) {
    console.warn('Failed to read cached real users', e);
  }
  return [];
}

/**
 * Persist cached real users
 */
function saveCachedRealUsers(users: BetaUserProfile[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_REAL_USERS, JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to cache real users', e);
  }
}

/**
 * Update a user in our local real users cache
 */
function updateCachedUser(user: BetaUserProfile): void {
  const current = getCachedRealUsers().filter((u) => u.userId !== user.userId);
  current.push(user);
  saveCachedRealUsers(current);
}

/**
 * Initialize Supabase Realtime Channels for PvP (Presence + Data Sync)
 */
export function initSupabasePvP(
  currentUser: BetaUserProfile,
  onOnlineChange?: (onlineUsers: BetaUserProfile[]) => void,
  onMatchInvite?: (invite: any) => void
) {
  if (onOnlineChange) onOnlineUsersCallback = onOnlineChange;
  if (onMatchInvite) onMatchInviteCallback = onMatchInvite;

  try {
    if (presenceChannel) {
      presenceChannel.unsubscribe();
    }
    if (syncChannel) {
      syncChannel.unsubscribe();
    }

    // 1. Setup Presence Channel
    presenceChannel = supabase.channel(PRESENCE_CHANNEL_NAME, {
      config: {
        presence: {
          key: currentUser.userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineMap = new Map<string, BetaUserProfile>();

        Object.keys(state).forEach((key) => {
          const presences = state[key];
          if (presences && presences.length > 0) {
            const p = presences[0] as any;
            if (p && p.userId && p.username && p.userId !== currentUser.userId) {
              const profile: BetaUserProfile = {
                userId: p.userId,
                username: p.username,
                team: p.team || null,
                tactics: p.tactics || DEFAULT_TACTICS,
                defenseSquadId: p.defenseSquadId,
                updatedAt: p.updatedAt || Date.now(),
                isOnline: true,
                lastSeen: Date.now(),
              };
              onlineMap.set(p.userId, profile);
              updateCachedUser(profile);
            }
          }
        });

        onlinePresenceUsers = onlineMap;
        if (onOnlineUsersCallback) {
          onOnlineUsersCallback(Array.from(onlineMap.values()));
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        if (newPresences && newPresences.length > 0) {
          const p = newPresences[0];
          if (p && p.userId && p.username && p.userId !== currentUser.userId) {
            const profile: BetaUserProfile = {
              userId: p.userId,
              username: p.username,
              team: p.team || null,
              tactics: p.tactics || DEFAULT_TACTICS,
              defenseSquadId: p.defenseSquadId,
              updatedAt: p.updatedAt || Date.now(),
              isOnline: true,
              lastSeen: Date.now(),
            };
            onlinePresenceUsers.set(p.userId, profile);
            updateCachedUser(profile);
            if (onOnlineUsersCallback) {
              onOnlineUsersCallback(Array.from(onlinePresenceUsers.values()));
            }
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key }: any) => {
        if (key && onlinePresenceUsers.has(key)) {
          onlinePresenceUsers.delete(key);
          if (onOnlineUsersCallback) {
            onOnlineUsersCallback(Array.from(onlinePresenceUsers.values()));
          }
        }
      });

    presenceChannel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED' && currentUser.username) {
        await presenceChannel.track({
          userId: currentUser.userId,
          username: currentUser.username,
          team: currentUser.team,
          tactics: currentUser.tactics,
          defenseSquadId: currentUser.defenseSquadId,
          updatedAt: Date.now(),
          lastSeen: Date.now(),
        });
      }
    });

    // 2. Setup Data Sync Channel (Broadcasts updates between all clients)
    syncChannel = supabase.channel(DATA_SYNC_CHANNEL_NAME);
    syncChannel
      .on('broadcast', { event: 'USER_REGISTERED' }, ({ payload }: any) => {
        if (payload && payload.userId && payload.username) {
          updateCachedUser(payload);
        }
      })
      .on('broadcast', { event: 'BEST_XI_SAVED' }, ({ payload }: any) => {
        if (payload && payload.userId && payload.username) {
          updateCachedUser(payload);
        }
      })
      .on('broadcast', { event: 'MATCH_INVITE' }, ({ payload }: any) => {
        if (payload && payload.targetUserId === currentUser.userId) {
          if (onMatchInviteCallback) {
            onMatchInviteCallback(payload);
          }
        }
      });

    syncChannel.subscribe();

    // 3. Heartbeat timer (every 25 seconds)
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      sendHeartbeat(currentUser);
    }, 25000);
  } catch (err) {
    console.warn('Supabase Realtime initialization warning:', err);
  }
}

/**
 * Send heartbeat to keep presence and database last_seen active
 */
export async function sendHeartbeat(currentUser: BetaUserProfile) {
  if (!currentUser || !currentUser.username) return;

  // Update presence
  if (presenceChannel) {
    try {
      presenceChannel.track({
        userId: currentUser.userId,
        username: currentUser.username,
        team: currentUser.team,
        tactics: currentUser.tactics,
        defenseSquadId: currentUser.defenseSquadId,
        updatedAt: Date.now(),
        lastSeen: Date.now(),
      });
    } catch (e) {
      console.warn('Heartbeat track error', e);
    }
  }

  // Update Supabase DB table if available
  try {
    await supabase
      .from('users')
      .update({
        is_online: true,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', currentUser.userId);
  } catch (e) {
    // Graceful
  }
}

/**
 * Check if a username is already taken by another user
 */
export async function isUsernameTaken(
  username: string,
  currentUserId: string
): Promise<boolean> {
  const clean = username.trim().toLowerCase();
  if (!clean) return false;

  // Check local cache
  const cached = getCachedRealUsers();
  const foundInCache = cached.some(
    (u) => u.userId !== currentUserId && u.username.toLowerCase() === clean
  );
  if (foundInCache) return true;

  // Check Supabase DB table
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, username')
      .neq('user_id', currentUserId)
      .ilike('username', clean)
      .limit(1);

    if (!error && data && data.length > 0) {
      return true;
    }
  } catch (e) {
    console.warn('DB check username error', e);
  }

  return false;
}

/**
 * Register or update user profile in Supabase
 */
export async function registerOrUpdateUserInSupabase(
  profile: BetaUserProfile
): Promise<{ success: boolean; error?: string }> {
  const trimmed = profile.username.trim();
  if (!trimmed || trimmed.length < 3) {
    return {
      success: false,
      error: 'ユーザーネームは3文字以上で入力してください。',
    };
  }

  // Check uniqueness
  const taken = await isUsernameTaken(trimmed, profile.userId);
  if (taken) {
    return {
      success: false,
      error: `ユーザーネーム「${trimmed}」は既に使用されています。別の名前をお試しください。`,
    };
  }

  const updatedProfile: BetaUserProfile = {
    ...profile,
    username: trimmed,
    updatedAt: Date.now(),
    isOnline: true,
    lastSeen: Date.now(),
  };

  // 1. Save handle locally
  setSavedUserHandle(trimmed);
  updateCachedUser(updatedProfile);

  // 2. Track in Supabase Realtime presence
  if (presenceChannel) {
    try {
      await presenceChannel.track({
        userId: updatedProfile.userId,
        username: updatedProfile.username,
        team: updatedProfile.team,
        tactics: updatedProfile.tactics,
        defenseSquadId: updatedProfile.defenseSquadId,
        updatedAt: Date.now(),
        lastSeen: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to track in presence', e);
    }
  }

  // 3. Broadcast to all clients via Supabase sync channel
  if (syncChannel) {
    try {
      syncChannel.send({
        type: 'broadcast',
        event: 'USER_REGISTERED',
        payload: updatedProfile,
      });
    } catch (e) {
      console.warn('Failed to broadcast user registration', e);
    }
  }

  // 4. Upsert into Supabase DB table
  try {
    const teamOvr = updatedProfile.team?.players?.length
      ? Math.round(
          updatedProfile.team.players.reduce((s, p) => s + p.rating, 0) /
            updatedProfile.team.players.length
        )
      : 85;

    const { error } = await supabase.from('users').upsert(
      {
        user_id: updatedProfile.userId,
        username: updatedProfile.username,
        team_name: updatedProfile.team?.name || 'Best XI',
        formation: updatedProfile.team?.formation || '4-3-3',
        ovr: teamOvr,
        best_xi: updatedProfile.team,
        tactics: updatedProfile.tactics,
        is_online: true,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.warn('Supabase DB users upsert note:', error.message);
    }
  } catch (e) {
    console.warn('Supabase DB insert warning:', e);
  }

  return { success: true };
}

/**
 * Save Best XI Team and Tactics to Supabase
 */
export async function saveBestXIToSupabase(
  profile: BetaUserProfile,
  team: UserTeam,
  tactics?: TeamTactics
): Promise<{ success: boolean; error?: string }> {
  const updatedProfile: BetaUserProfile = {
    ...profile,
    team,
    tactics: tactics || profile.tactics || DEFAULT_TACTICS,
    defenseSquadId: team.teamId,
    updatedAt: Date.now(),
  };

  updateCachedUser(updatedProfile);

  // Broadcast to other clients
  if (syncChannel) {
    try {
      syncChannel.send({
        type: 'broadcast',
        event: 'BEST_XI_SAVED',
        payload: updatedProfile,
      });
    } catch (e) {
      console.warn('Broadcast best xi error', e);
    }
  }

  // Update presence
  if (presenceChannel) {
    try {
      presenceChannel.track({
        userId: updatedProfile.userId,
        username: updatedProfile.username,
        team: updatedProfile.team,
        tactics: updatedProfile.tactics,
        defenseSquadId: updatedProfile.defenseSquadId,
        updatedAt: Date.now(),
        lastSeen: Date.now(),
      });
    } catch (e) {
      console.warn('Presence track error', e);
    }
  }

  // Save to Supabase DB table
  try {
    const teamOvr = team.players?.length
      ? Math.round(team.players.reduce((s, p) => s + p.rating, 0) / team.players.length)
      : 85;

    await supabase.from('users').upsert(
      {
        user_id: updatedProfile.userId,
        username: updatedProfile.username,
        team_name: team.name,
        formation: team.formation,
        ovr: teamOvr,
        best_xi: team,
        tactics: updatedProfile.tactics,
        is_online: true,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch (e) {
    console.warn('Supabase DB best_xi upsert note:', e);
  }

  return { success: true };
}

/**
 * Fetch list of currently online players from Supabase (excluding self)
 */
export async function fetchOnlineUsersFromSupabase(
  currentUserId: string
): Promise<BetaUserProfile[]> {
  const onlineMap = new Map<string, BetaUserProfile>();

  // 1. First add from Realtime presence state
  onlinePresenceUsers.forEach((user, id) => {
    if (id !== currentUserId && user.username) {
      onlineMap.set(id, { ...user, isOnline: true });
    }
  });

  // 2. Also query Supabase DB for users active within last 2 minutes
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('user_id', currentUserId)
      .gt('last_seen', twoMinutesAgo);

    if (!error && data) {
      data.forEach((row: any) => {
        if (row.username && row.user_id !== currentUserId) {
          const profile: BetaUserProfile = {
            userId: row.user_id,
            username: row.username,
            team: row.best_xi || null,
            tactics: row.tactics || DEFAULT_TACTICS,
            defenseSquadId: row.best_xi?.teamId,
            updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
            isOnline: true,
            lastSeen: row.last_seen ? new Date(row.last_seen).getTime() : Date.now(),
          };
          onlineMap.set(row.user_id, profile);
          updateCachedUser(profile);
        }
      });
    }
  } catch (e) {
    console.warn('Fetch online users DB note:', e);
  }

  return Array.from(onlineMap.values());
}

/**
 * Fetch all registered real users from Supabase
 */
export async function fetchAllRegisteredUsersFromSupabase(
  currentUserId: string
): Promise<BetaUserProfile[]> {
  const usersMap = new Map<string, BetaUserProfile>();

  // 1. Add cached users
  getCachedRealUsers().forEach((u) => {
    if (u.userId !== currentUserId && u.username) {
      const isOnline = onlinePresenceUsers.has(u.userId);
      usersMap.set(u.userId, { ...u, isOnline });
    }
  });

  // 2. Add online presence users
  onlinePresenceUsers.forEach((u, id) => {
    if (id !== currentUserId && u.username) {
      usersMap.set(id, { ...u, isOnline: true });
    }
  });

  // 3. Query Supabase DB
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('user_id', currentUserId)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      data.forEach((row: any) => {
        if (row.username && row.user_id !== currentUserId) {
          const lastSeenMs = row.last_seen ? new Date(row.last_seen).getTime() : 0;
          const isRecentlyOnline = Date.now() - lastSeenMs < 2 * 60 * 1000;
          const isOnline = onlinePresenceUsers.has(row.user_id) || isRecentlyOnline;

          const profile: BetaUserProfile = {
            userId: row.user_id,
            username: row.username,
            team: row.best_xi || null,
            tactics: row.tactics || DEFAULT_TACTICS,
            defenseSquadId: row.best_xi?.teamId,
            updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
            isOnline,
            lastSeen: lastSeenMs,
          };
          usersMap.set(row.user_id, profile);
          updateCachedUser(profile);
        }
      });
    }
  } catch (e) {
    console.warn('Fetch all registered users DB note:', e);
  }

  return Array.from(usersMap.values());
}

/**
 * Search real registered users from Supabase by handle substring (Case-Insensitive)
 */
export async function searchUsersFromSupabase(
  query: string,
  currentUserId: string
): Promise<BetaUserProfile[]> {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const resultMap = new Map<string, BetaUserProfile>();

  // 1. Search cached real users
  getCachedRealUsers().forEach((u) => {
    if (u.userId !== currentUserId && u.username && u.username.toLowerCase().includes(clean)) {
      const isOnline = onlinePresenceUsers.has(u.userId);
      resultMap.set(u.userId, { ...u, isOnline });
    }
  });

  // 2. Search online presence
  onlinePresenceUsers.forEach((u, id) => {
    if (id !== currentUserId && u.username && u.username.toLowerCase().includes(clean)) {
      resultMap.set(id, { ...u, isOnline: true });
    }
  });

  // 3. Search Supabase DB
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('user_id', currentUserId)
      .ilike('username', `%${clean}%`)
      .limit(20);

    if (!error && data) {
      data.forEach((row: any) => {
        if (row.username && row.user_id !== currentUserId) {
          const lastSeenMs = row.last_seen ? new Date(row.last_seen).getTime() : 0;
          const isRecentlyOnline = Date.now() - lastSeenMs < 2 * 60 * 1000;
          const isOnline = onlinePresenceUsers.has(row.user_id) || isRecentlyOnline;

          const profile: BetaUserProfile = {
            userId: row.user_id,
            username: row.username,
            team: row.best_xi || null,
            tactics: row.tactics || DEFAULT_TACTICS,
            defenseSquadId: row.best_xi?.teamId,
            updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
            isOnline,
            lastSeen: lastSeenMs,
          };
          resultMap.set(row.user_id, profile);
          updateCachedUser(profile);
        }
      });
    }
  } catch (e) {
    console.warn('Search users DB note:', e);
  }

  return Array.from(resultMap.values());
}

/**
 * Fetch opponent's saved Best XI team from Supabase
 */
export async function fetchOpponentBestXIFromSupabase(
  opponentUserId: string
): Promise<UserTeam | null> {
  // Check online presence first
  const pres = onlinePresenceUsers.get(opponentUserId);
  if (pres && pres.team) return pres.team;

  // Check local cache
  const cached = getCachedRealUsers().find((u) => u.userId === opponentUserId);
  if (cached && cached.team) return cached.team;

  // Query Supabase DB
  try {
    const { data, error } = await supabase
      .from('users')
      .select('best_xi, team_name, formation, ovr')
      .eq('user_id', opponentUserId)
      .single();

    if (!error && data && data.best_xi) {
      return data.best_xi as UserTeam;
    }
  } catch (e) {
    console.warn('Fetch opponent best_xi note:', e);
  }

  return null;
}

/**
 * Save completed match record to Supabase
 */
export async function saveMatchRecordToSupabase(
  record: BetaMatchRecord
): Promise<void> {
  // 1. Save locally
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_MATCHES);
    const list: BetaMatchRecord[] = raw ? JSON.parse(raw) : [];
    const updated = [record, ...list.filter((m) => m.id !== record.id)].slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_SAVED_MATCHES, JSON.stringify(updated));
  } catch (e) {
    console.warn('Local save match error', e);
  }

  // 2. Broadcast match completion to real-time clients
  if (syncChannel) {
    try {
      syncChannel.send({
        type: 'broadcast',
        event: 'MATCH_COMPLETED',
        payload: {
          matchId: record.id,
          challengerUserId: record.challengerUserId,
          challengerUsername: record.challengerUsername,
          opponentUserId: record.opponentUserId,
          opponentUsername: record.opponentUsername,
          challengerScore: record.challengerScore,
          opponentScore: record.opponentScore,
          result: record.result,
        },
      });
    } catch (e) {
      console.warn('Broadcast match completed error', e);
    }
  }

  // 3. Save to Supabase DB matches table
  try {
    await supabase.from('matches').insert({
      match_id: record.id,
      challenger_id: record.challengerUserId,
      challenger_handle: record.challengerUsername,
      opponent_id: record.opponentUserId,
      opponent_handle: record.opponentUsername,
      challenger_team: {
        teamName: record.challengerTeamName,
        ovr: record.challengerOvr,
        tactics: record.challengerTactics,
      },
      opponent_team: {
        teamName: record.opponentTeamName,
        ovr: record.opponentOvr,
        tactics: record.opponentTactics,
      },
      challenger_score: record.challengerScore,
      opponent_score: record.opponentScore,
      match_type: record.matchCategory || (record.matchType === 'OVR' ? 'OVR' : 'TACTICAL'),
      result: record.result,
      status: 'COMPLETED',
      created_at: new Date(record.timestamp).toISOString(),
      details: {
        events: record.events,
        fullTimeScore: record.fullTimeScore,
        halfTimeScore: record.halfTimeScore,
      },
    });
  } catch (e) {
    console.warn('Supabase DB matches insert note:', e);
  }
}

/**
 * Fetch match history from Supabase for current user
 */
export async function fetchMatchHistoryFromSupabase(
  currentUserId: string
): Promise<BetaMatchRecord[]> {
  const matchesMap = new Map<string, BetaMatchRecord>();

  // 1. Load local matches
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_MATCHES);
    if (raw) {
      const list: BetaMatchRecord[] = JSON.parse(raw);
      list.forEach((m) => {
        if (m.challengerUserId === currentUserId || m.opponentUserId === currentUserId) {
          matchesMap.set(m.id, m);
        }
      });
    }
  } catch (e) {
    console.warn('Local load match error', e);
  }

  // 2. Query Supabase DB
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`challenger_id.eq.${currentUserId},opponent_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      data.forEach((row: any) => {
        const isChallenger = row.challenger_id === currentUserId;
        const myScore = isChallenger ? row.challenger_score : row.opponent_score;
        const oppScore = isChallenger ? row.opponent_score : row.challenger_score;

        let result: 'WIN' | 'DRAW' | 'LOSS' = 'DRAW';
        if (myScore > oppScore) result = 'WIN';
        else if (myScore < oppScore) result = 'LOSS';

        const record: BetaMatchRecord = {
          id: row.match_id || 'm_' + row.id,
          challengerUserId: row.challenger_id,
          challengerUsername: row.challenger_handle || 'Player',
          opponentUserId: row.opponent_id,
          opponentUsername: row.opponent_handle || 'Opponent',
          matchType: row.match_type === 'TACTICAL' ? 'TACTICAL' : 'OVR',
          matchCategory: row.match_type === 'REALTIME' ? 'REALTIME' : 'ASYNC',
          challengerScore: row.challenger_score,
          opponentScore: row.opponent_score,
          result,
          points: result === 'WIN' ? 3 : result === 'DRAW' ? 1 : 0,
          challengerOvr: row.challenger_team?.ovr || 85,
          opponentOvr: row.opponent_team?.ovr || 85,
          challengerTeamName: row.challenger_team?.teamName || 'Best XI',
          opponentTeamName: row.opponent_team?.teamName || 'Opponent Best XI',
          timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
          events: row.details?.events || [],
          fullTimeScore: [row.challenger_score, row.opponent_score],
          halfTimeScore: row.details?.halfTimeScore,
          challengerTactics: row.challenger_team?.tactics,
          opponentTactics: row.opponent_team?.tactics,
        };
        matchesMap.set(record.id, record);
      });
    }
  } catch (e) {
    console.warn('Fetch match history DB note:', e);
  }

  const list = Array.from(matchesMap.values());
  list.sort((a, b) => b.timestamp - a.timestamp);
  return list;
}
