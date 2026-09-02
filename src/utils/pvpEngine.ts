import {
  UserTeam,
  BetaUserProfile,
  BetaMatchRecord,
  BetaMatchEvent,
  BetaStandingEntry,
  TeamTactics,
  AttackTactics,
  DefenseTactics,
  Player,
} from '../types';
import { getPersistentUserId, getSavedUserHandle } from './supabasePvP';
import { getPlayerHeight } from '../data/playerHeights';
import { getSeasonNumberForTimestamp } from './seasonEngine';

export const STORAGE_KEY_PVP_USER = 'FOOTBALL_DRAFT_PVP_USER_v113';
export const STORAGE_KEY_PVP_MATCH_HISTORY = 'FOOTBALL_DRAFT_PVP_HISTORY_v113';
export const STORAGE_KEY_PVP_COMMUNITY_USERS = 'FOOTBALL_DRAFT_PVP_COMMUNITY_USERS_v113';
export const STORAGE_KEY_DEFENSE_SQUAD_ID = 'FOOTBALL_DRAFT_DEFENSE_SQUAD_ID_v113';

export const DEFAULT_TACTICS: TeamTactics = {
  attackTactic: 'POSSESSION',
  defenseTactic: 'MID_BLOCK',
  attackDirection: 'BALANCED',
  pressIntensity: 'BALANCED',
};

// Community users registry
export const INITIAL_COMMUNITY_USERS: BetaUserProfile[] = [];

const LEGACY_CPU_USER_IDS = new Set(['usr_tikitaka_king', 'usr_galactico_ace', 'usr_samurai_legend']);
const LEGACY_CPU_USERNAMES = new Set(['tikitakamaster', 'galacticoking', 'samuraiblue93']);

/**
 * Get current configured defense squad ID
 */
export function getDefenseSquadId(teams?: UserTeam[]): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DEFENSE_SQUAD_ID);
    if (saved && teams && teams.some((t) => t.teamId === saved)) {
      return saved;
    }
  } catch (e) {
    console.error('Failed to load defense squad id', e);
  }
  return teams && teams.length > 0 ? teams[0].teamId : '';
}

/**
 * Set and persist defense squad
 */
export function setDefenseSquad(
  squadId: string,
  teams: UserTeam[],
  tactics?: TeamTactics
): { success: boolean; team?: UserTeam } {
  try {
    const targetTeam = teams.find((t) => t.teamId === squadId);
    if (!targetTeam) return { success: false };

    localStorage.setItem(STORAGE_KEY_DEFENSE_SQUAD_ID, squadId);

    const currentUser = getCurrentUserProfile(targetTeam, teams);
    const updatedProfile: BetaUserProfile = {
      ...currentUser,
      team: targetTeam,
      defenseSquadId: squadId,
      tactics: tactics || currentUser.tactics || DEFAULT_TACTICS,
      updatedAt: Date.now(),
    };

    saveRegisteredUser(updatedProfile);
    return { success: true, team: targetTeam };
  } catch (e) {
    console.error('Failed to set defense squad', e);
    return { success: false };
  }
}

/**
 * Load all registered real users from local storage
 */
export function getRegisteredUsers(): BetaUserProfile[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PVP_COMMUNITY_USERS);
    if (saved) {
      const parsed: BetaUserProfile[] = JSON.parse(saved);
      const cleanUsers = parsed.filter(
        (u) =>
          u &&
          u.userId &&
          !LEGACY_CPU_USER_IDS.has(u.userId) &&
          !LEGACY_CPU_USERNAMES.has((u.username || '').toLowerCase().trim())
      );
      return cleanUsers;
    }
  } catch (e) {
    console.error('Failed to load community users', e);
  }
  return [];
}

/**
 * Save user profile to community registry
 */
export function saveRegisteredUser(profile: BetaUserProfile): { success: boolean; error?: string } {
  const users = getRegisteredUsers();
  const trimmed = profile.username.trim();

  if (!trimmed || trimmed.length < 3) {
    return { success: false, error: 'ユーザーネームは3文字以上で入力してください。' };
  }

  const updatedUsers = users.filter((u) => u.userId !== profile.userId);
  updatedUsers.push({ ...profile, username: trimmed, updatedAt: Date.now() });

  try {
    localStorage.setItem(STORAGE_KEY_PVP_COMMUNITY_USERS, JSON.stringify(updatedUsers));
    localStorage.setItem(STORAGE_KEY_PVP_USER, JSON.stringify({ ...profile, username: trimmed }));
    return { success: true };
  } catch (e) {
    console.error('Failed to save user profile', e);
    return { success: false, error: '保存に失敗しました。' };
  }
}

/**
 * Get current user's saved profile
 */
export function getCurrentUserProfile(
  activeTeam?: UserTeam | null,
  teams?: UserTeam[]
): BetaUserProfile {
  const persistentId = getPersistentUserId();
  const savedHandle = getSavedUserHandle();

  try {
    const saved = localStorage.getItem(STORAGE_KEY_PVP_USER);
    const defSquadId = getDefenseSquadId(teams);
    const defenseTeam =
      teams && defSquadId
        ? teams.find((t) => t.teamId === defSquadId) || activeTeam
        : activeTeam;

    if (saved) {
      const parsed: BetaUserProfile = JSON.parse(saved);
      return {
        ...parsed,
        userId: parsed.userId || persistentId,
        username: parsed.username || savedHandle,
        team: defenseTeam || parsed.team,
        defenseSquadId: defSquadId || parsed.defenseSquadId,
        tactics: parsed.tactics || DEFAULT_TACTICS,
      };
    }
  } catch (e) {
    console.error('Failed to load current user profile', e);
  }

  return {
    userId: persistentId,
    username: savedHandle,
    team: activeTeam,
    defenseSquadId: activeTeam?.teamId,
    tactics: DEFAULT_TACTICS,
    updatedAt: Date.now(),
  };
}

/**
 * Match History Management
 */
export function getMyMatchHistory(): BetaMatchRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PVP_MATCH_HISTORY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load match history', e);
  }
  return [];
}

export function saveMyMatchRecord(record: BetaMatchRecord): void {
  const history = getMyMatchHistory();
  const updated = [record, ...history.filter((m) => m.id !== record.id)];
  try {
    localStorage.setItem(STORAGE_KEY_PVP_MATCH_HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save match record', e);
  }
}

/**
 * Calculate Standings for a specific season and match type, merging registered users and matches
 */
export function computeWeeklyStandings(
  allUsers: BetaUserProfile[],
  currentUser: BetaUserProfile,
  allSeasonMatches: BetaMatchRecord[],
  targetSeason: number,
  matchTypeFilter: 'ALL' | 'OVR' | 'TACTICAL' = 'ALL'
): BetaStandingEntry[] {
  const allUsersMap = new Map<string, BetaStandingEntry>();

  // Ensure current user is in the list
  const combinedUsers = [...allUsers];
  if (!combinedUsers.some((u) => u.userId === currentUser.userId)) {
    combinedUsers.push(currentUser);
  }

  // Filter matches for the specific season and match type
  const seasonMatches = allSeasonMatches.filter((m) => {
    const sNum = m.season || getSeasonNumberForTimestamp(m.timestamp);
    const matchesSeason = sNum === targetSeason;
    const matchesType = matchTypeFilter === 'ALL' || m.matchType === matchTypeFilter;
    return matchesSeason && matchesType;
  });

  // Seed every registered user
  combinedUsers.forEach((u) => {
    if (!u || !u.username) return;
    const teamOvr = u.team?.players?.length
      ? Math.round(u.team.players.reduce((s, p) => s + p.rating, 0) / u.team.players.length)
      : 85;

    allUsersMap.set(u.userId, {
      userId: u.userId,
      username: u.username,
      teamName: u.team?.name || 'Best XI',
      teamOvr,
      points: 0,
      goalDifference: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      matchesCount: 0,
      recent10Matches: [],
      season: targetSeason,
    });
  });

  // Aggregate stats from matches
  seasonMatches.forEach((m) => {
    // Challenger Entry
    const cEntry = allUsersMap.get(m.challengerUserId) || {
      userId: m.challengerUserId,
      username: m.challengerUsername,
      teamName: m.challengerTeamName || 'Best XI',
      teamOvr: m.challengerOvr || 85,
      points: 0,
      goalDifference: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      matchesCount: 0,
      recent10Matches: [],
      season: targetSeason,
    };

    cEntry.matchesCount += 1;
    cEntry.goalsFor += m.challengerScore;
    cEntry.goalsAgainst += m.opponentScore;
    cEntry.goalDifference = cEntry.goalsFor - cEntry.goalsAgainst;
    cEntry.recent10Matches.unshift(m);

    if (m.challengerScore > m.opponentScore) {
      cEntry.wins += 1;
      cEntry.points += 3;
    } else if (m.challengerScore === m.opponentScore) {
      cEntry.draws += 1;
      cEntry.points += 1;
    } else {
      cEntry.losses += 1;
    }
    allUsersMap.set(m.challengerUserId, cEntry);

    // Opponent Entry
    const oEntry = allUsersMap.get(m.opponentUserId) || {
      userId: m.opponentUserId,
      username: m.opponentUsername,
      teamName: m.opponentTeamName || 'Opponent XI',
      teamOvr: m.opponentOvr || 85,
      points: 0,
      goalDifference: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      matchesCount: 0,
      recent10Matches: [],
      season: targetSeason,
    };

    oEntry.matchesCount += 1;
    oEntry.goalsFor += m.opponentScore;
    oEntry.goalsAgainst += m.challengerScore;
    oEntry.goalDifference = oEntry.goalsFor - oEntry.goalsAgainst;

    if (m.opponentScore > m.challengerScore) {
      oEntry.wins += 1;
      oEntry.points += 3;
    } else if (m.opponentScore === m.challengerScore) {
      oEntry.draws += 1;
      oEntry.points += 1;
    } else {
      oEntry.losses += 1;
    }
    allUsersMap.set(m.opponentUserId, oEntry);
  });

  const list = Array.from(allUsersMap.values());

  // Sort by:
  // 1. Points DESC
  // 2. Goal Difference DESC
  // 3. Goals For DESC
  // 4. Team OVR DESC
  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return b.teamOvr - a.teamOvr;
  });

  return list.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

/**
 * TACTICAL COUNTER EVALUATION ENGINE
 * Calculates detailed tactical synergy, counter advantages, player height & attributes
 */
export function evaluateTacticalAdvantage(
  userTac: TeamTactics,
  oppTac: TeamTactics,
  userSquad?: UserTeam | null,
  oppSquad?: UserTeam | null
): {
  userAdvantage: number;
  explanationJa: string;
  explanationEn: string;
  isCrossGame?: boolean;
  aerialAdvantage?: number;
} {
  let adv = 0;
  let reasonJa = '戦術バランスは互角です。互いに陣形を保ちながら隙を窺っています。';
  let reasonEn = 'Tactical balance is neutral. Both managers are feeling each other out.';
  let isCross = false;
  let aerialAdv = 0;

  const uAtk = userTac.attackTactic;
  const oDef = oppTac.defenseTactic;
  const uDef = userTac.defenseTactic;
  const oAtk = oppTac.attackTactic;

  const userPlayers = userSquad?.players || [];
  const oppPlayers = oppSquad?.players || [];

  // ── 1. CROSS GAME (クロスゲー) & HEIGHT / AERIAL EVALUATION ──
  if (uAtk === 'CROSS_GAME') {
    isCross = true;
    
    // Find target strikers
    const targetStrikers = userPlayers.filter((p) =>
      ['FW', 'ST', 'CF'].includes(p.subPosition || p.position)
    );
    const bestTarget = targetStrikers.sort((a, b) => {
      const hA = getPlayerHeight(a);
      const hB = getPlayerHeight(b);
      const phyA = a.stats?.physical || a.rating;
      const phyB = b.stats?.physical || b.rating;
      return hB * 0.6 + phyB * 0.4 - (hA * 0.6 + phyA * 0.4);
    })[0];

    const targetHeight = bestTarget ? getPlayerHeight(bestTarget) : 182;
    const targetPhysical = bestTarget?.stats?.physical || bestTarget?.rating || 82;

    // Find crossers (Wingers, Fullbacks, Side Midfielders)
    const crossers = userPlayers.filter((p) =>
      ['LWG', 'RWG', 'LMF', 'RMF', 'LB', 'RB', 'LWB', 'RWB', 'LM', 'RM', 'LW', 'RW'].includes(
        p.subPosition || p.position
      )
    );
    const bestCrosser = crossers.sort(
      (a, b) => (b.stats?.passing || b.rating) - (a.stats?.passing || a.rating)
    )[0];
    const crossQuality = bestCrosser?.stats?.passing || bestCrosser?.rating || 80;

    // Find opponent Center Backs for aerial contest
    const oppCBs = oppPlayers.filter((p) =>
      ['CB', 'DF'].includes(p.subPosition || p.position)
    );
    const oppAvgCBHeight = oppCBs.length
      ? Math.round(oppCBs.reduce((s, p) => s + getPlayerHeight(p), 0) / oppCBs.length)
      : 185;
    const oppAvgCBPhysical = oppCBs.length
      ? Math.round(oppCBs.reduce((s, p) => s + (p.stats?.physical || p.rating), 0) / oppCBs.length)
      : 82;

    // Aerial height difference advantage
    const heightDiff = targetHeight - oppAvgCBHeight; // e.g. 202 - 185 = +17cm
    const physicalDiff = targetPhysical - oppAvgCBPhysical;

    aerialAdv = heightDiff * 0.015 + physicalDiff * 0.008 + (crossQuality >= 85 ? 0.12 : 0.04);

    if (oDef === 'CENTRAL_CONTAIN') {
      adv += 0.45 + aerialAdv;
      reasonJa = targetHeight >= 195
        ? `相手の中央封鎖を完璧に回避！ 身長${targetHeight}cmの${bestTarget?.nameJa || '巨漢FW'}が圧倒的空中戦でゴール前を完全制圧！`
        : '相手の中央密集の死角を突き、サイドからの高精度クロス連打で相手ゴール前を圧倒！';
      reasonEn = `Cross Game exploits central contain! Aerial threat by ${bestTarget?.nameEn || 'FW'} (${targetHeight}cm) dominates the box!`;
    } else if (oDef === 'WIDE_CONTAIN') {
      adv -= 0.28;
      reasonJa = '相手のサイド封鎖守備がクロスの供給源を徹底マークし、クロス攻撃を厳しく遮断。';
      reasonEn = 'Opponent wide contain effectively suffocates the flank crosses.';
    } else if (oDef === 'HIGH_PRESS' || oDef === 'GEGENPRESSING' || oDef === 'FRONT_PRESS') {
      adv += 0.3 + aerialAdv;
      reasonJa = `相手の前線プレスをロングサイドチェンジで一気に無力化！ ${bestTarget?.nameJa || 'ターゲットマン'}（身長${targetHeight}cm）のハイタワーヘッド炸裂！`;
      reasonEn = 'Press-breaking long balls to wide channels unlock devastating aerial deliveries!';
    } else if (oDef === 'LOW_BLOCK' || oDef === 'ZONE_DEFENSE') {
      adv += 0.25 + aerialAdv;
      reasonJa = `相手の密集ローブロック守備の上空から、${bestTarget?.nameJa || 'ターゲットマン'}が圧倒的な高さ（${targetHeight}cm）で競り勝つ！`;
      reasonEn = `Target man aerial supremacy (${targetHeight}cm) crushes opponent low defensive block!`;
    } else {
      adv += 0.22 + aerialAdv;
      reasonJa = `サイドからの高速クロスが中央の${bestTarget?.nameJa || 'ストライカー'}（${targetHeight}cm）を捉え、決定機を量産！`;
      reasonEn = `Fast driven crosses find target forward (${targetHeight}cm) consistently.`;
    }
  }
  // ── 2. OTHER ATTACK TACTICAL MATCHUPS ──
  else if ((uAtk === 'COUNTER' || uAtk === 'LONG_COUNTER' || uAtk === 'QUICK_ATTACK') && (oDef === 'HIGH_PRESS' || oDef === 'GEGENPRESSING' || oDef === 'FRONT_PRESS')) {
    adv += 0.42;
    reasonJa = '相手の前線プレスの背後広大なスペースへ、電光石火のカウンターが完全に突き刺さる！';
    reasonEn = 'Lightning fast counter attack exploits the vacant space behind opponent aggressive press!';
  } else if (uAtk === 'THROUGH_PASS' && (oDef === 'HIGH_PRESS' || oDef === 'FRONT_PRESS')) {
    adv += 0.38;
    reasonJa = '前がかりな相手守備ラインの裏へ鋭いスルーパスが通り、決定的一対一を演出！';
    reasonEn = 'Incisive through balls split the opponent high line cleanly.';
  } else if ((uAtk === 'POSSESSION' || uAtk === 'BUILD_UP' || uAtk === 'SHORT_PASS') && oDef === 'LOW_BLOCK') {
    adv -= 0.25;
    reasonJa = '相手の強固なローブロックにパス回しを外へ追いやられ、決定打を欠く展開。';
    reasonEn = 'Opponent compact low block frustrates possession rhythm.';
  } else if ((uAtk === 'POSSESSION' || uAtk === 'BUILD_UP') && oDef === 'MID_BLOCK') {
    adv += 0.22;
    reasonJa = '落ち着いたポゼッションとパスワークで中盤の主導権を確実に支配。';
    reasonEn = 'Controlled possession maintains dominance through the midfield.';
  } else if ((uAtk === 'WIDE_ATTACK' || uAtk === 'WIDE_SPREAD') && oDef === 'CENTRAL_CONTAIN') {
    adv += 0.35;
    reasonJa = '中央を固める相手に対してワイドにピッチを広く使い、サイドアタックを展開！';
    reasonEn = 'Wide attack takes full advantage of opponent central narrowness.';
  } else if (uAtk === 'CENTRAL_ATTACK' && oDef === 'WIDE_CONTAIN') {
    adv += 0.32;
    reasonJa = 'サイド警戒の相手の隙を突き、中央コンビネーションで中央突破に成功！';
    reasonEn = 'Central penetration breaks through opponent wide defensive shape.';
  } else if (uAtk === 'LONG_BALL' && (oDef === 'HIGH_PRESS' || oDef === 'GEGENPRESSING')) {
    adv += 0.3;
    reasonJa = 'ロングボールで相手のハイプレスを一気に無力化し、前線へ素早く展開！';
    reasonEn = 'Long ball bypasses opponent high pressing lines completely.';
  } else if (uAtk === 'HIGH_SPEED_ATTACK' && oDef === 'RETREAT') {
    adv -= 0.2;
    reasonJa = '相手のリトリート守備陣形に速攻の勢いを吸収される。';
    reasonEn = 'Opponent disciplined retreat absorbs early speed.';
  }

  // ── 3. DEFENSE TACTICAL COUNTER EVALUATION ──
  if ((uDef === 'HIGH_PRESS' || uDef === 'GEGENPRESSING') && (oAtk === 'BUILD_UP' || oAtk === 'SHORT_PASS' || oAtk === 'POSSESSION')) {
    adv += 0.3;
    reasonJa += ' また、こちらの激しいゲーゲンプレスが相手の組み立てをことごとく寸断！';
    reasonEn += ' Furthermore, high pressing suffocates opponent short build-up.';
  } else if (uDef === 'COUNTER_PREVENT' && (oAtk === 'COUNTER' || oAtk === 'LONG_COUNTER' || oAtk === 'QUICK_ATTACK')) {
    adv += 0.32;
    reasonJa += ' さらにカウンター対策の守備配置が相手の速攻を未然に遮断！';
    reasonEn += ' Furthermore, counter-prevention structure completely stifles opponent breaks.';
  } else if (uDef === 'MAN_MARK' && (oAtk === 'CENTRAL_ATTACK' || oAtk === 'SHORT_PASS')) {
    adv += 0.26;
    reasonJa += ' 密着マンマークが相手キーマンの自由を完全に奪っています！';
    reasonEn += ' Strict man-marking eliminates opponent playmaker time on the ball.';
  } else if (uDef === 'WIDE_CONTAIN' && (oAtk === 'CROSS_GAME' || oAtk === 'WIDE_ATTACK')) {
    adv += 0.3;
    reasonJa += ' サイド封鎖の守備陣形が相手のクロスとサイドアタックを的確にブロック！';
    reasonEn += ' Wide containment walls off opponent flanking crosses.';
  }

  return {
    userAdvantage: adv,
    explanationJa: reasonJa,
    explanationEn: reasonEn,
    isCrossGame: isCross,
    aerialAdvantage: aerialAdv,
  };
}

/**
 * SIMULATE OVR MATCH (Pure OVR Dominance)
 * Rule: Higher OVR team wins based strictly on OVR gap. No tactical inversions.
 */
export function simulateOVRMatch(
  challenger: BetaUserProfile,
  opponent: BetaUserProfile,
  challengerPlayingSquad?: UserTeam,
  matchCategory?: 'REALTIME' | 'ASYNC'
): {
  record: BetaMatchRecord;
  events: BetaMatchEvent[];
} {
  const activeChallengerTeam = challengerPlayingSquad || challenger.team;
  const activeOpponentTeam = opponent.team;

  const challengerPlayers = activeChallengerTeam?.players || [];
  const opponentPlayers = activeOpponentTeam?.players || [];

  const cOvr = challengerPlayers.length
    ? Math.round(challengerPlayers.reduce((s, p) => s + p.rating, 0) / challengerPlayers.length)
    : 85;
  const oOvr = opponentPlayers.length
    ? Math.round(opponentPlayers.reduce((s, p) => s + p.rating, 0) / opponentPlayers.length)
    : 85;

  const diff = cOvr - oOvr; // Positive means challenger has higher OVR

  let cScore = 0;
  let oScore = 0;

  // STRICT OVR-BASED DETERMINATION
  if (diff >= 5) {
    // Huge gap: Challenger decisive win
    cScore = 3 + Math.floor(Math.random() * 2);
    oScore = Math.random() < 0.3 ? 1 : 0;
  } else if (diff >= 3) {
    // Clear gap: Challenger win 95%, draw 5%
    if (Math.random() < 0.95) {
      cScore = 2 + Math.floor(Math.random() * 2);
      oScore = Math.floor(Math.random() * (cScore - 1));
    } else {
      cScore = 1;
      oScore = 1;
    }
  } else if (diff >= 1) {
    // Small gap: Challenger favored (75% win, 20% draw, 5% loss)
    const roll = Math.random();
    if (roll < 0.75) {
      cScore = 2 + Math.floor(Math.random() * 2);
      oScore = cScore - 1;
    } else if (roll < 0.95) {
      cScore = 1;
      oScore = 1;
    } else {
      cScore = 0;
      oScore = 1;
    }
  } else if (diff === 0) {
    // Equal OVR: 50-50 battle
    const roll = Math.random();
    if (roll < 0.4) {
      cScore = 1;
      oScore = 0;
    } else if (roll < 0.7) {
      cScore = 1;
      oScore = 1;
    } else {
      cScore = 0;
      oScore = 1;
    }
  } else if (diff <= -5) {
    // Huge gap: Opponent decisive win
    oScore = 3 + Math.floor(Math.random() * 2);
    cScore = Math.random() < 0.3 ? 1 : 0;
  } else if (diff <= -3) {
    // Clear gap: Opponent win 95%, draw 5%
    if (Math.random() < 0.95) {
      oScore = 2 + Math.floor(Math.random() * 2);
      cScore = Math.floor(Math.random() * (oScore - 1));
    } else {
      cScore = 1;
      oScore = 1;
    }
  } else {
    // diff is -1 or -2: Opponent favored (75% win, 20% draw, 5% loss)
    const roll = Math.random();
    if (roll < 0.75) {
      oScore = 2 + Math.floor(Math.random() * 2);
      cScore = oScore - 1;
    } else if (roll < 0.95) {
      cScore = 1;
      oScore = 1;
    } else {
      cScore = 1;
      oScore = 0;
    }
  }

  const cStar = challengerPlayers[0]?.nameJa || 'エース';
  const oStar = opponentPlayers[0]?.nameJa || 'エース';

  const events: BetaMatchEvent[] = [
    {
      minute: 1,
      type: 'whistle',
      textJa: `主審のホイッスルでOVR総合値マッチがキックオフ！ (OVR ${cOvr} ${challenger.username} vs OVR ${oOvr} ${opponent.username})`,
      textEn: `Kickoff! OVR Match begins (OVR ${cOvr} vs OVR ${oOvr})`,
      textEs: `¡Comienza el Partido de OVR! (OVR ${cOvr} vs OVR ${oOvr})`,
    },
    {
      minute: 16,
      type: 'chance',
      textJa: diff > 0
        ? `高いチーム総合値(OVR ${cOvr})を誇る${challenger.username}が序盤から主導権を掌握！`
        : diff < 0
        ? `圧倒的総合値(OVR ${oOvr})の${opponent.username}が猛攻を仕掛ける！`
        : '両チーム互角の総合値で一進一退の攻防が続く！',
      textEn: 'Early tactical and physical pressure unfolds on the pitch.',
      textEs: 'Presión intensa en los primeros minutos de juego.',
    },
  ];

  if (cScore > 0) {
    events.push({
      minute: 32,
      type: 'goal',
      isChallengerGoal: true,
      textJa: `⚽ GOOOAL!! ${challenger.username}がチーム力の差を見せつけ先制！ ${cStar}が突き刺す！`,
      textEn: `⚽ GOAL!! ${cStar} opens the scoring for ${challenger.username}!`,
      textEs: `⚽ ¡¡GOLAZO!! ¡${cStar} anota para ${challenger.username}!`,
    });
  }

  if (oScore > 0) {
    events.push({
      minute: 58,
      type: 'goal',
      isOpponentGoal: true,
      textJa: `⚽ GOAL! ${opponent.username}の${oStar}がゴールをこじ開ける！`,
      textEn: `⚽ GOAL! ${oStar} scores for ${opponent.username}!`,
      textEs: `⚽ ¡GOL! ¡${oStar} anota para ${opponent.username}!`,
    });
  }

  if (cScore > 1) {
    events.push({
      minute: 82,
      type: 'goal',
      isChallengerGoal: true,
      textJa: `⚽ GOAL!! ${challenger.username}がダメ押しの追加点！`,
      textEn: `⚽ GOAL!! Decisive finish extends the lead!`,
      textEs: `⚽ ¡¡GOL!! ¡Gol decisivo para sentenciar!`,
    });
  }

  events.push({
    minute: 90,
    type: 'whistle',
    textJa: `試合終了！ 総合値マッチ結果: ${cScore} - ${oScore} (OVR ${cOvr} vs ${oOvr})`,
    textEn: `Full Time! Final Score: ${cScore} - ${oScore}`,
    textEs: `¡Final del partido! Marcador: ${cScore} - ${oScore}`,
  });

  const result: 'WIN' | 'DRAW' | 'LOSS' =
    cScore > oScore ? 'WIN' : cScore === oScore ? 'DRAW' : 'LOSS';
  const points: 3 | 1 | 0 = result === 'WIN' ? 3 : result === 'DRAW' ? 1 : 0;
  const currentSeason = getSeasonNumberForTimestamp(Date.now());

  const record: BetaMatchRecord = {
    id: 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    challengerUserId: challenger.userId,
    challengerUsername: challenger.username || 'You',
    opponentUserId: opponent.userId,
    opponentUsername: opponent.username,
    matchType: 'OVR',
    matchCategory: matchCategory || (opponent.isOnline ? 'REALTIME' : 'ASYNC'),
    season: currentSeason,
    challengerScore: cScore,
    opponentScore: oScore,
    result,
    points,
    challengerOvr: cOvr,
    opponentOvr: oOvr,
    challengerTeamName: activeChallengerTeam?.name || 'My Best XI',
    opponentTeamName: activeOpponentTeam?.name || 'Opponent Best XI',
    timestamp: Date.now(),
    events,
    fullTimeScore: [cScore, oScore],
    challengerTactics: challenger.tactics,
    opponentTactics: opponent.tactics,
  };

  return { record, events };
}

/**
 * SIMULATE TACTICAL MATCH HALF (Tactics & Synergy over OVR)
 * Rule: Lower OVR can definitely beat Higher OVR through tactical synergy & counters!
 */
export function simulateTacticalMatchHalf(
  half: 1 | 2,
  challenger: BetaUserProfile,
  opponent: BetaUserProfile,
  currentScore: [number, number],
  activeTactics: TeamTactics,
  challengerPlayingSquad?: UserTeam
): {
  halfScore: [number, number];
  events: BetaMatchEvent[];
  tacticalAdvantage: {
    userAdvantage: number;
    explanationJa: string;
    explanationEn: string;
    isCrossGame?: boolean;
    aerialAdvantage?: number;
  };
} {
  const activeChallengerTeam = challengerPlayingSquad || challenger.team;
  const activeOpponentTeam = opponent.team;

  const tacticalEval = evaluateTacticalAdvantage(
    activeTactics,
    opponent.tactics,
    activeChallengerTeam,
    activeOpponentTeam
  );

  const cPlayers = activeChallengerTeam?.players || [];
  const oPlayers = activeOpponentTeam?.players || [];

  const cOvr = cPlayers.length
    ? Math.round(cPlayers.reduce((s, p) => s + p.rating, 0) / cPlayers.length)
    : 85;
  const oOvr = oPlayers.length
    ? Math.round(oPlayers.reduce((s, p) => s + p.rating, 0) / oPlayers.length)
    : 85;

  // Tactical advantage is the primary driver (+/- 0.60), OVR difference is secondary (0.015)
  const effectiveAdv = tacticalEval.userAdvantage + (cOvr - oOvr) * 0.015;

  let newCScore = currentScore[0];
  let newOScore = currentScore[1];

  const events: BetaMatchEvent[] = [];
  const startMin = half === 1 ? 1 : 46;
  const endMin = half === 1 ? 45 : 90;

  events.push({
    minute: startMin,
    type: 'tactic',
    textJa: `${half === 1 ? '前半' : '後半'}キックオフ！ 戦術 [${activeTactics.attackTactic} × ${activeTactics.defenseTactic}] を展開。`,
    textEn: `${half === 1 ? '1st Half' : '2nd Half'} starts! Deploying [${activeTactics.attackTactic} / ${activeTactics.defenseTactic}].`,
    textEs: `¡Comienza el ${half === 1 ? '1er' : '2do'} tiempo! [${activeTactics.attackTactic} / ${activeTactics.defenseTactic}].`,
  });

  // Tactical encounter minute
  events.push({
    minute: half === 1 ? 20 : 65,
    type: 'tactic',
    textJa: tacticalEval.explanationJa,
    textEn: tacticalEval.explanationEn,
    textEs: tacticalEval.explanationEn,
  });

  // Goal calculation heavily weighted by tactical advantage
  const roll = Math.random();
  const challengerGoalThreshold = 0.5 - effectiveAdv * 0.6; // If adv = +0.5, threshold = 0.2 -> 80% chance
  const opponentGoalThreshold = 0.7 + effectiveAdv * 0.4;

  if (roll > challengerGoalThreshold) {
    newCScore += 1;
    const isCross = tacticalEval.isCrossGame;
    const targetPlayer = cPlayers.find((p) => ['FW', 'ST', 'CF'].includes(p.subPosition || p.position)) || cPlayers[0];
    const scorerName = targetPlayer?.nameJa || challenger.username;
    const scorerHeight = targetPlayer ? getPlayerHeight(targetPlayer) : 185;

    events.push({
      minute: half === 1 ? 36 : 76,
      type: 'goal',
      isChallengerGoal: true,
      textJa: isCross
        ? `⚽ GOOOAL!! サイドからの高精度クロスに${scorerName}（身長${scorerHeight}cm）が打点の高いヘディングで合わせゴールネットを揺らす！`
        : `⚽ GOAL!! 戦術通りの美しい連係から${scorerName}が鮮やかにゴール！`,
      textEn: isCross
        ? `⚽ GOAL!! ${scorerName} (${scorerHeight}cm) connects with a towering header!`
        : `⚽ GOAL!! Clinical tactical buildup leads to a fine goal!`,
      textEs: `⚽ ¡¡GOLAZO!! ¡Gol de excelente factura táctica!`,
    });
  } else if (roll < (1 - opponentGoalThreshold)) {
    newOScore += 1;
    events.push({
      minute: half === 1 ? 40 : 80,
      type: 'goal',
      isOpponentGoal: true,
      textJa: `⚽ GOAL! 相手の戦術的プレッシャーから隙を突かれ失点！`,
      textEn: `⚽ GOAL! Opponent capitalizes on a tactical counter!`,
      textEs: `⚽ ¡GOL! ¡El rival aprovecha un error táctico!`,
    });
  }

  events.push({
    minute: endMin,
    type: 'whistle',
    textJa: `${half === 1 ? '前半終了' : '試合終了'}！ スコア: ${newCScore} - ${newOScore}`,
    textEn: `${half === 1 ? 'Half Time' : 'Full Time'}! Score: ${newCScore} - ${newOScore}`,
    textEs: `${half === 1 ? 'Descanso' : 'Final'}! Marcador: ${newCScore} - ${newOScore}`,
  });

  return {
    halfScore: [newCScore, newOScore],
    events,
    tacticalAdvantage: tacticalEval,
  };
}
