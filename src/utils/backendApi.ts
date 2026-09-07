import { GiftBoxItem, RewardTicketType, BetaStandingEntry } from '../types';
import {
  getStoredUserTickets,
  saveUserTickets,
  getStoredPresents,
  saveAllPresents,
  ensureApologyGiftDistributed,
  claimPresentBoxItem,
  consumeUserTicket,
} from './rewardScoutEngine';

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

/**
 * Fetch authoritative server ranking phase and schedule status
 */
export async function fetchServerRankingStatus(): Promise<ServerRankingStatus | null> {
  try {
    const res = await fetch('/api/ranking/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // network fallback handled gracefully
  }
  return null;
}

/**
 * Trigger server-side reward calculation & distribution for finalized week
 * Idempotently assigns rewards to top 3
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
 * Fetch present box items for user (combining server authority and local storage)
 */
export async function fetchUserPresents(userId: string): Promise<GiftBoxItem[]> {
  try {
    const res = await fetch(`/api/presents/user/${userId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.presents)) {
        // Also sync to local storage for instant offline availability
        saveAllPresents(data.presents);
        return data.presents;
      }
    }
  } catch (e) {
    // fallback to local storage
  }

  // Local fallback: ensures apology gift is always present
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
        saveUserTickets(data.userTickets);
        const refreshedPresents = await fetchUserPresents(userId);
        return {
          success: true,
          claimedItem: data.claimedItem,
          updatedPresents: refreshedPresents,
          updatedTickets: data.userTickets,
        };
      }
    }
  } catch (e) {
    console.warn('Backend claim error, using local fallback:', e);
  }

  // Safe local claim fallback
  return claimPresentBoxItem(presentId, userId);
}

/**
 * Consume ticket on scout
 */
export async function consumeScoutTicket(
  userId: string,
  ticketType: RewardTicketType
): Promise<{ success: boolean; remainingTickets: number; updatedTickets: Record<RewardTicketType, number> }> {
  try {
    const res = await fetch('/api/scout/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ticketType }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        saveUserTickets(data.userTickets);
        return {
          success: true,
          remainingTickets: data.remainingTickets,
          updatedTickets: data.userTickets,
        };
      }
    }
  } catch (e) {
    console.warn('Backend consume error, using local fallback:', e);
  }

  // Safe local consume fallback
  const ok = consumeUserTicket(ticketType);
  const currentTickets = getStoredUserTickets();
  return {
    success: ok,
    remainingTickets: currentTickets[ticketType] || 0,
    updatedTickets: currentTickets,
  };
}
