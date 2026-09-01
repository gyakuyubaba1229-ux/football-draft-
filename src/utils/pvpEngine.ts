import {
  UserTeam,
  BetaUserProfile,
  BetaMatchRecord,
  BetaMatchEvent,
  BetaStandingEntry,
  TeamTactics,
  AttackTactics,
  DefenseTactics,
} from '../types';

export const STORAGE_KEY_PVP_USER = 'FOOTBALL_DRAFT_PVP_USER_v110';
export const STORAGE_KEY_PVP_MATCH_HISTORY = 'FOOTBALL_DRAFT_PVP_HISTORY_v110';
export const STORAGE_KEY_PVP_COMMUNITY_USERS = 'FOOTBALL_DRAFT_PVP_COMMUNITY_USERS_v110';
export const STORAGE_KEY_DEFENSE_SQUAD_ID = 'FOOTBALL_DRAFT_DEFENSE_SQUAD_ID_v110';

export const DEFAULT_TACTICS: TeamTactics = {
  attackTactic: 'POSSESSION',
  defenseTactic: 'MID_BLOCK',
  attackDirection: 'BALANCED',
  pressIntensity: 'BALANCED',
};

// Community users registry (Starts empty for public launch - populated solely by real players)
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
 * Set and persist defense squad (and synchronize to community profile)
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
 * Load all registered real users (filtering out any legacy CPU records)
 */
export function getRegisteredUsers(): BetaUserProfile[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PVP_COMMUNITY_USERS);
    if (saved) {
      const parsed: BetaUserProfile[] = JSON.parse(saved);
      // Filter out legacy CPU users
      const cleanUsers = parsed.filter(
        (u) =>
          u &&
          u.userId &&
          !LEGACY_CPU_USER_IDS.has(u.userId) &&
          !LEGACY_CPU_USERNAMES.has((u.username || '').toLowerCase().trim())
      );
      if (cleanUsers.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY_PVP_COMMUNITY_USERS, JSON.stringify(cleanUsers));
      }
      return cleanUsers;
    }
  } catch (e) {
    console.error('Failed to load community users', e);
  }
  return [];
}

/**
 * Save user profile to community registry (enforcing unique usernames)
 */
export function saveRegisteredUser(profile: BetaUserProfile): { success: boolean; error?: string } {
  const users = getRegisteredUsers();
  const trimmed = profile.username.trim();

  if (!trimmed || trimmed.length < 3) {
    return { success: false, error: 'ユーザーネームは3文字以上で入力してください。' };
  }

  // Check username uniqueness
  const duplicate = users.find(
    (u) => u.userId !== profile.userId && u.username.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return { success: false, error: `ユーザーネーム「${trimmed}」は既に使用されています。` };
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
 * Get current user's saved profile (prioritizing defense squad if configured)
 */
export function getCurrentUserProfile(
  activeTeam: UserTeam | null,
  teams?: UserTeam[]
): BetaUserProfile {
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
        team: defenseTeam || parsed.team,
        defenseSquadId: defSquadId || parsed.defenseSquadId,
        tactics: parsed.tactics || DEFAULT_TACTICS,
      };
    }
  } catch (e) {
    console.error('Failed to load current user profile', e);
  }

  const randomId = 'usr_' + Math.random().toString(36).substring(2, 9);
  return {
    userId: randomId,
    username: '',
    team: activeTeam,
    defenseSquadId: activeTeam?.teamId,
    tactics: DEFAULT_TACTICS,
    updatedAt: Date.now(),
  };
}

/**
 * Search registered real users by username (case-insensitive substring or exact)
 */
export function searchUsersByUsername(query: string, currentUserId: string): BetaUserProfile[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const users = getRegisteredUsers();
  return users.filter(
    (u) => u.userId !== currentUserId && u.username.toLowerCase().includes(q)
  );
}

/**
 * Match History Management (Strictly for matches initiated by user)
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
  // Prepend newest match
  const updated = [record, ...history].slice(0, 50);
  try {
    localStorage.setItem(STORAGE_KEY_PVP_MATCH_HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save match record', e);
  }
}

/**
 * Calculate Past 10 Matches Standings
 * Points: Win = 3pt, Draw = 1pt, Loss = 0pt
 */
export function computePast10Standings(
  currentUser: BetaUserProfile,
  matchHistory: BetaMatchRecord[]
): BetaStandingEntry[] {
  const users = getRegisteredUsers();
  const allUsersMap = new Map<string, BetaStandingEntry>();

  // Initialize current user entry
  const userRecent10 = matchHistory.slice(0, 10);
  let userPts = 0;
  let userGf = 0;
  let userGa = 0;
  let userW = 0;
  let userD = 0;
  let userL = 0;

  userRecent10.forEach((m) => {
    userPts += m.points;
    userGf += m.challengerScore;
    userGa += m.opponentScore;
    if (m.result === 'WIN') userW++;
    else if (m.result === 'DRAW') userD++;
    else userL++;
  });

  const teamOvr = currentUser.team?.players?.length
    ? Math.round(
        currentUser.team.players.reduce((s, p) => s + p.rating, 0) /
          currentUser.team.players.length
      )
    : 85;

  allUsersMap.set(currentUser.userId, {
    userId: currentUser.userId,
    username: currentUser.username || 'You (Player)',
    teamName: currentUser.team?.name || 'My Best XI',
    teamOvr,
    points: userPts,
    goalDifference: userGf - userGa,
    goalsFor: userGf,
    goalsAgainst: userGa,
    wins: userW,
    draws: userD,
    losses: userL,
    matchesCount: userRecent10.length,
    recent10Matches: userRecent10,
  });

  // Populate real community entries
  users.forEach((u) => {
    if (u.userId === currentUser.userId || !u.username) return;
    const ovr = u.team?.players?.length
      ? Math.round(u.team.players.reduce((s, p) => s + p.rating, 0) / u.team.players.length)
      : 85;

    // Check actual matches played against or by this user in recorded history
    const directMatches = matchHistory.filter(
      (m) => m.opponentUserId === u.userId || m.challengerUserId === u.userId
    );

    let commPts = 0;
    let commGf = 0;
    let commGa = 0;
    let commW = 0;
    let commD = 0;
    let commL = 0;

    directMatches.slice(0, 10).forEach((m) => {
      const isOpp = m.opponentUserId === u.userId;
      const myScore = isOpp ? m.opponentScore : m.challengerScore;
      const oppScore = isOpp ? m.challengerScore : m.opponentScore;
      commGf += myScore;
      commGa += oppScore;
      if (myScore > oppScore) {
        commW++;
        commPts += 3;
      } else if (myScore === oppScore) {
        commD++;
        commPts += 1;
      } else {
        commL++;
      }
    });

    allUsersMap.set(u.userId, {
      userId: u.userId,
      username: u.username,
      teamName: u.team?.name || 'Best XI',
      teamOvr: ovr,
      points: commPts,
      goalDifference: commGf - commGa,
      goalsFor: commGf,
      goalsAgainst: commGa,
      wins: commW,
      draws: commD,
      losses: commL,
      matchesCount: directMatches.length,
      recent10Matches: [],
    });
  });

  const list = Array.from(allUsersMap.values());
  // Sort by Points DESC -> Goal Difference DESC -> Goals For DESC
  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return list.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
}

/**
 * TACTICAL COUNTER EVALUATION ENGINE
 * Evaluates tactical synergy / counter advantages
 */
export function evaluateTacticalAdvantage(
  userTac: TeamTactics,
  oppTac: TeamTactics
): { userAdvantage: number; explanationJa: string; explanationEn: string } {
  let adv = 0;
  let reasonJa = '戦術バランスは互角です。';
  let reasonEn = 'Tactical balance is neutral.';

  // Possession vs Low Block
  if (userTac.attackTactic === 'POSSESSION' && oppTac.defenseTactic === 'LOW_BLOCK') {
    adv -= 0.15;
    reasonJa = '相手のローブロック守備がこちらのポゼッションを巧みに封じています。';
    reasonEn = 'Opponent low block effectively stifles your possession rhythm.';
  } else if (userTac.attackTactic === 'COUNTER' && oppTac.defenseTactic === 'HIGH_LINE') {
    adv += 0.25;
    reasonJa = '相手のハイライン背後をカウンター戦術で完璧に突いています！';
    reasonEn = 'Counter attack exploits opponent high defensive line brilliantly!';
  } else if (userTac.attackTactic === 'DIRECT_PLAY' && oppTac.defenseTactic === 'HIGH_PRESS') {
    adv += 0.2;
    reasonJa = '相手のハイプレスをダイレクトプレーで回避し好機を創出！';
    reasonEn = 'Direct play bypasses opponent high press effectively!';
  } else if (userTac.defenseTactic === 'HIGH_PRESS' && oppTac.attackTactic === 'SHORT_PASS') {
    adv += 0.2;
    reasonJa = 'ハイプレスが相手のショートパス組み立てを分断しています！';
    reasonEn = 'High press disrupts opponent short passing build-up!';
  } else if (userTac.attackTactic === 'WIDE_ATTACK' && oppTac.attackDirection === 'CENTRAL') {
    adv += 0.15;
    reasonJa = 'ワイド攻撃でサイドの数的優位を活用できています。';
    reasonEn = 'Wide attack takes advantage of superior wing width.';
  }

  return { userAdvantage: adv, explanationJa: reasonJa, explanationEn: reasonEn };
}

/**
 * SIMULATE OVR MATCH (30s Digest)
 */
export function simulateOVRMatch(
  challenger: BetaUserProfile,
  opponent: BetaUserProfile,
  challengerPlayingSquad?: UserTeam
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

  const diff = cOvr - oOvr;
  const winProb = 0.45 + diff * 0.04;

  const rand = Math.random();
  let cScore = 0;
  let oScore = 0;

  if (rand < winProb) {
    cScore = Math.floor(Math.random() * 3) + 1;
    oScore = Math.floor(Math.random() * cScore);
  } else if (rand < winProb + 0.25) {
    cScore = Math.floor(Math.random() * 3);
    oScore = cScore;
  } else {
    oScore = Math.floor(Math.random() * 3) + 1;
    cScore = Math.floor(Math.random() * oScore);
  }

  // Generate real event commentary
  const cStar = challengerPlayers[0]?.nameJa || 'エース';
  const oStar = opponentPlayers[0]?.nameJa || 'エース';

  const events: BetaMatchEvent[] = [
    {
      minute: 1,
      type: 'whistle',
      textJa: `主審のホイッスルで総合値マッチがキックオフ！ (${challenger.username} [${activeChallengerTeam?.name || 'My Squad'}] vs ${opponent.username} [${activeOpponentTeam?.name || 'Defense Squad'}])`,
      textEn: `Kickoff! OVR Match begins (${challenger.username} vs ${opponent.username})`,
      textEs: `¡Comienza el Partido de OVR! (${challenger.username} vs ${opponent.username})`,
    },
    {
      minute: 18,
      type: 'chance',
      textJa: `${challenger.username}の${cStar}が鋭いドリブルで中央を突破！決定機を迎える！`,
      textEn: `${cStar} creates a brilliant chance through the center!`,
      textEs: `¡${cStar} genera una gran ocasión por el centro!`,
    },
  ];

  if (cScore > 0) {
    events.push({
      minute: 34,
      type: 'goal',
      isChallengerGoal: true,
      textJa: `⚽ GOOOAL!! ${challenger.username}が先制！ ${cStar}の見事なシュートがゴールネットを揺らす！`,
      textEn: `⚽ GOAL!! ${cStar} scores a sensational opener for ${challenger.username}!`,
      textEs: `⚽ ¡¡GOLAZO!! ${cStar} anota el primer tanto para ${challenger.username}!`,
    });
  }

  if (oScore > 0) {
    events.push({
      minute: 62,
      type: 'goal',
      isOpponentGoal: true,
      textJa: `⚽ GOAL! ${opponent.username}の${oStar}が同点弾を叩き込む！`,
      textEn: `⚽ GOAL! ${oStar} equalizes for ${opponent.username}!`,
      textEs: `⚽ ¡GOL! ¡${oStar} empata para ${opponent.username}!`,
    });
  }

  if (cScore > 1) {
    events.push({
      minute: 85,
      type: 'goal',
      isChallengerGoal: true,
      textJa: `⚽ GOAL!! 試合終盤、${challenger.username}が劇的な追加点！スタジアムが大歓声に包まれる！`,
      textEn: `⚽ GOAL!! Dramatic late finish seals the lead for ${challenger.username}!`,
      textEs: `⚽ ¡¡GOL!! ¡Gol decisivo en los minutos finales para ${challenger.username}!`,
    });
  }

  events.push({
    minute: 90,
    type: 'whistle',
    textJa: `試合終了のホイッスル！ 最終スコア: ${cScore} - ${oScore}`,
    textEn: `Full Time! Final Score: ${cScore} - ${oScore}`,
    textEs: `¡Final del partido! Marcador final: ${cScore} - ${oScore}`,
  });

  const result: 'WIN' | 'DRAW' | 'LOSS' =
    cScore > oScore ? 'WIN' : cScore === oScore ? 'DRAW' : 'LOSS';
  const points: 3 | 1 | 0 = result === 'WIN' ? 3 : result === 'DRAW' ? 1 : 0;

  const record: BetaMatchRecord = {
    id: 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    challengerUserId: challenger.userId,
    challengerUsername: challenger.username || 'You',
    opponentUserId: opponent.userId,
    opponentUsername: opponent.username,
    matchType: 'OVR',
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
 * SIMULATE TACTICAL MATCH HALF (40s Halves)
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
  tacticalAdvantage: { userAdvantage: number; explanationJa: string; explanationEn: string };
} {
  const tacticalEval = evaluateTacticalAdvantage(activeTactics, opponent.tactics);
  const activeChallengerTeam = challengerPlayingSquad || challenger.team;
  const activeOpponentTeam = opponent.team;

  const cPlayers = activeChallengerTeam?.players || [];
  const oPlayers = activeOpponentTeam?.players || [];

  const cOvr = cPlayers.length
    ? Math.round(cPlayers.reduce((s, p) => s + p.rating, 0) / cPlayers.length)
    : 85;
  const oOvr = oPlayers.length
    ? Math.round(oPlayers.reduce((s, p) => s + p.rating, 0) / oPlayers.length)
    : 85;

  const effectiveAdv = (cOvr - oOvr) * 0.03 + tacticalEval.userAdvantage;
  let newCScore = currentScore[0];
  let newOScore = currentScore[1];

  const events: BetaMatchEvent[] = [];
  const startMin = half === 1 ? 1 : 46;
  const endMin = half === 1 ? 45 : 90;

  events.push({
    minute: startMin,
    type: 'tactic',
    textJa: `${half === 1 ? '前半' : '後半'}キックオフ！ 戦術 [${activeTactics.attackTactic} / ${activeTactics.defenseTactic}] を展開。`,
    textEn: `${half === 1 ? '1st Half' : '2nd Half'} starts! Deploying [${activeTactics.attackTactic} / ${activeTactics.defenseTactic}].`,
    textEs: `¡Comienza el ${half === 1 ? '1er' : '2do'} tiempo! Desplegando [${activeTactics.attackTactic} / ${activeTactics.defenseTactic}].`,
  });

  // Tactical encounter minute
  events.push({
    minute: half === 1 ? 22 : 65,
    type: 'tactic',
    textJa: tacticalEval.explanationJa,
    textEn: tacticalEval.explanationEn,
    textEs: tacticalEval.explanationEn,
  });

  // Chance of goal based on tactics
  const goalRoll = Math.random() + effectiveAdv * 0.5;
  if (goalRoll > 0.65) {
    newCScore += 1;
    events.push({
      minute: half === 1 ? 38 : 78,
      type: 'goal',
      isChallengerGoal: true,
      textJa: `⚽ GOAL!! 戦術通りの美しい連係から先制ゴール！ (${challenger.username})`,
      textEn: `⚽ GOAL!! Perfect tactical execution results in a clinical finish!`,
      textEs: `⚽ ¡¡GOLAZO!! ¡Ejecución táctica impecable para abrir el marcador!`,
    });
  } else if (goalRoll < 0.25) {
    newOScore += 1;
    events.push({
      minute: half === 1 ? 41 : 82,
      type: 'goal',
      isOpponentGoal: true,
      textJa: `⚽ GOAL! 相手の鋭いカウンターに守備網を破られ失点！ (${opponent.username})`,
      textEn: `⚽ GOAL! Opponent strikes on a sharp counter attack!`,
      textEs: `⚽ ¡GOL! ¡El rival aprovecha un contragolpe fulminante!`,
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
