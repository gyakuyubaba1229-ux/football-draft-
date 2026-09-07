import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Server-side database / storage in memory with persistence simulation
interface ServerPresentItem {
  id: string; // key: `${week_id}_${user_id}_${reward_type}`
  weekId?: string;
  userId: string;
  title: string;
  description: string;
  rewardType: string;
  amount: number;
  isClaimed: boolean;
  claimedAt?: number;
  createdAt: number;
  rank?: number;
}

const serverPresentsDatabase: Map<string, ServerPresentItem> = new Map();
const distributedRewardKeys: Set<string> = new Set();
const userTicketsDatabase: Map<string, Record<string, number>> = new Map();

// Weekly Season Timing Helpers (JST UTC+9)
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Season 1 special window (2026-09-06 00:00:00 JST to 2026-09-12 23:59:59.999 JST)
const SEASON_1_START_MS = Date.UTC(2026, 8, 5, 15, 0, 0);
const SEASON_1_END_MS = Date.UTC(2026, 8, 12, 14, 59, 59, 999);
const SEASON_2_START_MS = SEASON_1_END_MS + 1; // 2026-09-13 00:00:00 JST
const SEASON_2_END_MS = Date.UTC(2026, 8, 20, 14, 59, 59, 999);

function getCurrentJSTDate(nowMs: number = Date.now()): Date {
  return new Date(nowMs + JST_OFFSET_MS);
}

function getWeekSeasonInfo(timestamp: number = Date.now()): {
  weekId: string;
  seasonNumber: number;
  phase: 'ACTIVE' | 'AGGREGATING' | 'FINALIZED';
  phaseTextJa: string;
  phaseTextEn: string;
  matchAcceptanceOpen: boolean;
  startMs: number;
  endMs: number;
  aggregationEndMs: number;
} {
  let seasonNum = 1;
  let startMs = SEASON_1_START_MS;
  let endMs = SEASON_1_END_MS;

  if (timestamp <= SEASON_1_END_MS) {
    seasonNum = 1;
    startMs = SEASON_1_START_MS;
    endMs = SEASON_1_END_MS;
  } else if (timestamp <= SEASON_2_END_MS) {
    seasonNum = 2;
    startMs = SEASON_2_START_MS;
    endMs = SEASON_2_END_MS;
  } else {
    const diff = timestamp - (SEASON_2_END_MS + 1);
    const weeksAfter = Math.floor(diff / ONE_WEEK_MS);
    seasonNum = 3 + weeksAfter;
    startMs = (SEASON_2_END_MS + 1) + weeksAfter * ONE_WEEK_MS;
    endMs = startMs + ONE_WEEK_MS - 1;
  }

  // Aggregation window: exactly 1 hour following phase end (24:00〜25:00 JST = 00:00〜01:00 JST next day)
  const aggregationEndMs = endMs + 60 * 60 * 1000;
  const weekId = `WEEK_${seasonNum}`;

  let phase: 'ACTIVE' | 'AGGREGATING' | 'FINALIZED' = 'ACTIVE';
  let phaseTextJa = '対戦受付中';
  let phaseTextEn = 'Active Matches';
  let matchAcceptanceOpen = true;

  if (timestamp > endMs && timestamp <= aggregationEndMs) {
    phase = 'AGGREGATING';
    phaseTextJa = 'ランキング集計中（24:00〜25:00）';
    phaseTextEn = 'Aggregating Rankings';
    matchAcceptanceOpen = false;
  } else if (timestamp > aggregationEndMs) {
    phase = 'FINALIZED';
    phaseTextJa = '第' + seasonNum + '回 確定';
    phaseTextEn = 'Finalized';
    matchAcceptanceOpen = false;
  }

  return {
    weekId,
    seasonNumber: seasonNum,
    phase,
    phaseTextJa,
    phaseTextEn,
    matchAcceptanceOpen,
    startMs,
    endMs,
    aggregationEndMs,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '1.3.0', timestamp: Date.now() });
  });

  // 2. Ranking Phase & Schedule Status (Server Authority)
  app.get('/api/ranking/status', (req, res) => {
    const info = getWeekSeasonInfo(Date.now());
    res.json({
      success: true,
      ...info,
      serverTimeMs: Date.now(),
    });
  });

  // 3. Server-side Reward Distribution Endpoint (Idempotent & Secure)
  // Evaluates standings and awards Top 1, 2, and 3 users once aggregation ends (25:00 / 01:00 JST)
  app.post('/api/ranking/distribute-rewards', (req, res) => {
    try {
      const { weekId, standings } = req.body;
      if (!weekId || !Array.isArray(standings)) {
        return res.status(400).json({ error: 'Invalid weekId or standings' });
      }

      const info = getWeekSeasonInfo(Date.now());
      // Must be at or past aggregation period or explicit trigger
      const top3 = standings.slice(0, 3);
      const rewardsDistributed: any[] = [];

      // Rank 1: Legend Guaranteed Scout x1
      if (top3[0]) {
        const u1 = top3[0];
        const key1 = `${weekId}_${u1.userId}_legend_guaranteed`;
        if (!distributedRewardKeys.has(key1)) {
          distributedRewardKeys.add(key1);
          const present1: ServerPresentItem = {
            id: key1,
            weekId,
            userId: u1.userId,
            title: `【週間ランキング第1位】報酬獲得！`,
            description: `週間ランキング1位達成おめでとうございます！「レジェンド確定スカウト ×1」をお贈りします。`,
            rewardType: 'legend_guaranteed',
            amount: 1,
            isClaimed: false,
            createdAt: Date.now(),
            rank: 1,
          };
          serverPresentsDatabase.set(key1, present1);
          rewardsDistributed.push(present1);
        }
      }

      // Rank 2: Purple Guaranteed Scout x1
      if (top3[1]) {
        const u2 = top3[1];
        const key2 = `${weekId}_${u2.userId}_purple_guaranteed`;
        if (!distributedRewardKeys.has(key2)) {
          distributedRewardKeys.add(key2);
          const present2: ServerPresentItem = {
            id: key2,
            weekId,
            userId: u2.userId,
            title: `【週間ランキング第2位】報酬獲得！`,
            description: `週間ランキング2位入賞！「紫確定スカウト ×1」をお贈りします。`,
            rewardType: 'purple_guaranteed',
            amount: 1,
            isClaimed: false,
            createdAt: Date.now(),
            rank: 2,
          };
          serverPresentsDatabase.set(key2, present2);
          rewardsDistributed.push(present2);
        }
      }

      // Rank 3: Legend / Purple 50% Scout x1
      if (top3[2]) {
        const u3 = top3[2];
        const key3 = `${weekId}_${u3.userId}_legend_purple_50`;
        if (!distributedRewardKeys.has(key3)) {
          distributedRewardKeys.add(key3);
          const present3: ServerPresentItem = {
            id: key3,
            weekId,
            userId: u3.userId,
            title: `【週間ランキング第3位】報酬獲得！`,
            description: `週間ランキング3位入賞！「レジェンド・紫50%スカウト ×1」をお贈りします。`,
            rewardType: 'legend_purple_50',
            amount: 1,
            isClaimed: false,
            createdAt: Date.now(),
            rank: 3,
          };
          serverPresentsDatabase.set(key3, present3);
          rewardsDistributed.push(present3);
        }
      }

      res.json({
        success: true,
        weekId,
        distributedCount: rewardsDistributed.length,
        rewards: rewardsDistributed,
      });
    } catch (e: any) {
      console.error('Error distributing rewards:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // 4. Present Box API: Fetch presents for user (including one-time apology gift)
  app.get('/api/presents/user/:userId', (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Ensure apology gift (legend_20 x1) exists for all users
    const apologyKey = `apology_gift_${userId}_legend20`;
    if (!distributedRewardKeys.has(apologyKey)) {
      distributedRewardKeys.add(apologyKey);
      serverPresentsDatabase.set(apologyKey, {
        id: apologyKey,
        userId,
        title: '【運営からのお詫び】特別スカウト配布',
        description: '大型アップデートに伴うお詫びとして「レジェンド20%スカウト ×1」をお贈りします。',
        rewardType: 'legend_20',
        amount: 1,
        isClaimed: false,
        createdAt: Date.now(),
      });
    }

    const presents: ServerPresentItem[] = [];
    serverPresentsDatabase.forEach((p) => {
      if (p.userId === userId) presents.push(p);
    });

    // Sort unclaimed first, newest first
    presents.sort((a, b) => {
      if (a.isClaimed !== b.isClaimed) return a.isClaimed ? 1 : -1;
      return b.createdAt - a.createdAt;
    });

    res.json({ success: true, presents });
  });

  // 5. Present Box API: Claim reward
  app.post('/api/presents/claim', (req, res) => {
    const { userId, presentId } = req.body;
    if (!userId || !presentId) return res.status(400).json({ error: 'Missing userId or presentId' });

    const item = serverPresentsDatabase.get(presentId);
    if (!item) {
      return res.status(404).json({ error: 'Present not found' });
    }
    if (item.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (item.isClaimed) {
      return res.status(400).json({ error: 'Already claimed' });
    }

    item.isClaimed = true;
    item.claimedAt = Date.now();

    // Credit ticket to user inventory
    const userTickets = userTicketsDatabase.get(userId) || {
      legend_20: 0,
      legend_50: 0,
      legend_guaranteed: 0,
      purple_20: 0,
      purple_50: 0,
      purple_guaranteed: 0,
      legend_purple_guaranteed: 0,
      legend_purple_50: 0,
    };
    userTickets[item.rewardType] = (userTickets[item.rewardType] || 0) + item.amount;
    userTicketsDatabase.set(userId, userTickets);

    res.json({
      success: true,
      claimedItem: item,
      userTickets,
    });
  });

  // 6. Reward Scout API: Verify and consume ticket
  app.post('/api/scout/consume', (req, res) => {
    const { userId, ticketType } = req.body;
    if (!userId || !ticketType) return res.status(400).json({ error: 'Missing userId or ticketType' });

    const userTickets = userTicketsDatabase.get(userId) || {
      legend_20: 0,
      legend_50: 0,
      legend_guaranteed: 0,
      purple_20: 0,
      purple_50: 0,
      purple_guaranteed: 0,
      legend_purple_guaranteed: 0,
      legend_purple_50: 0,
    };

    if (!userTickets[ticketType] || userTickets[ticketType] <= 0) {
      return res.status(400).json({ error: 'No tickets available for this scout' });
    }

    // Safely decrement ticket
    userTickets[ticketType] -= 1;
    userTicketsDatabase.set(userId, userTickets);

    res.json({
      success: true,
      ticketType,
      remainingTickets: userTickets[ticketType],
      userTickets,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (v1.3.0)`);
  });
}

startServer();
