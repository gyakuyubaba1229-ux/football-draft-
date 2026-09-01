import { Player, FormationSlotConfig } from '../types';
import { EFootballPosition, VERIFIED_PLAYER_POSITIONS, SUB_POSITION_COMPATIBILITY } from '../data/playerPositions';

/**
 * Maps (x, y) coordinates on the pitch to an authentic eFootball position.
 * x: 0 (left) to 100 (right)
 * y: 0 (opponent goal/top) to 100 (own goal/bottom)
 */
export function getEFootballPositionFromCoords(x: number, y: number): EFootballPosition {
  // 1. Goalkeeper Area (Bottom Center)
  if (y >= 80 && x >= 28 && x <= 72) {
    return 'GK';
  }

  // 2. Defensive Line (y >= 64)
  if (y >= 64) {
    if (x <= 25) return 'LB';
    if (x >= 75) return 'RB';
    return 'CB';
  }

  // 3. Deep Midfield / Wingback Zone (54 <= y < 64)
  if (y >= 54) {
    if (x <= 22) return 'LWB';
    if (x >= 78) return 'RWB';
    if (x <= 34) return 'DMF';
    if (x >= 66) return 'DMF';
    return 'DMF';
  }

  // 4. Central / Midfield Line (42 <= y < 54)
  if (y >= 42) {
    if (x <= 25) return 'LMF';
    if (x >= 75) return 'RMF';
    if (y <= 46 && x >= 36 && x <= 64) return 'AMF';
    return 'CMF';
  }

  // 5. Attacking Midfield / Wingers (26 <= y < 42)
  if (y >= 26) {
    if (x <= 26) return y >= 34 ? 'LMF' : 'LWG';
    if (x >= 74) return y >= 34 ? 'RMF' : 'RWG';
    if (y <= 32 && x >= 36 && x <= 64) return 'SS';
    return 'AMF';
  }

  // 6. Forward / Striker Zone (y < 26)
  if (x <= 28) return 'LWG';
  if (x >= 72) return 'RWG';
  if (y >= 18 && (x <= 38 || x >= 62)) return 'SS';
  return 'CF';
}

/**
 * Maps a preset slot role string (e.g. 'ST', 'CAM', 'CDM', 'LW') to eFootball standard notation.
 */
export function normalizeRoleToEFootball(role: string): EFootballPosition {
  const upper = (role || '').toUpperCase().trim();
  switch (upper) {
    case 'GK':
      return 'GK';
    case 'CB':
      return 'CB';
    case 'LB':
      return 'LB';
    case 'RB':
      return 'RB';
    case 'LWB':
      return 'LWB';
    case 'RWB':
      return 'RWB';
    case 'CDM':
    case 'DMF':
      return 'DMF';
    case 'CM':
    case 'CMF':
      return 'CMF';
    case 'LM':
    case 'LMF':
      return 'LMF';
    case 'RM':
    case 'RMF':
      return 'RMF';
    case 'CAM':
    case 'LAM':
    case 'RAM':
    case 'AMF':
      return 'AMF';
    case 'LW':
    case 'LWG':
      return 'LWG';
    case 'RW':
    case 'RWG':
      return 'RWG';
    case 'SS':
      return 'SS';
    case 'ST':
    case 'CF':
      return 'CF';
    default:
      return 'CMF';
  }
}

/**
 * Returns the set of verified playable positions for a player based on official records.
 */
export function getVerifiedPositionsForPlayer(player: Player): EFootballPosition[] {
  if (!player) return ['CMF'];

  // 1. Direct personId lookup
  if (player.personId && VERIFIED_PLAYER_POSITIONS[player.personId]) {
    return VERIFIED_PLAYER_POSITIONS[player.personId];
  }

  // 2. Direct playerId lookup
  if (player.playerId && VERIFIED_PLAYER_POSITIONS[player.playerId]) {
    return VERIFIED_PLAYER_POSITIONS[player.playerId];
  }

  // 3. Fallback based on verified subPosition
  const subPos = (player.subPosition || player.position || '').toUpperCase();
  if (SUB_POSITION_COMPATIBILITY[subPos]) {
    return SUB_POSITION_COMPATIBILITY[subPos];
  }

  // 4. Main position fallback
  if (player.position === 'GK') return ['GK'];
  if (player.position === 'DF') return ['CB', 'LB', 'RB'];
  if (player.position === 'MF') return ['CMF', 'DMF', 'AMF'];
  if (player.position === 'FW') return ['CF', 'LWG', 'RWG', 'SS'];

  return ['CMF'];
}

/**
 * Evaluates how suitable a position is for a player and calculates the resulting OVR.
 * - Suitable (Player played this position in real life): Full OVR maintained.
 * - Unsuitable: Realistic tactical OVR penalty applied (-6).
 */
export function evaluatePlayerAtPosition(
  player: Player,
  targetPosition: EFootballPosition
): {
  displayedPosition: EFootballPosition;
  isSuitable: boolean;
  effectiveRating: number;
  ratingDelta: number;
} {
  const verifiedList = getVerifiedPositionsForPlayer(player);
  const isSuitable = verifiedList.includes(targetPosition);

  if (isSuitable) {
    return {
      displayedPosition: targetPosition,
      isSuitable: true,
      effectiveRating: player.rating,
      ratingDelta: 0,
    };
  }

  // Position is unverified / out of position -> Slight penalty
  // If GK placed outfield or outfield in GK -> larger penalty (-10)
  // Otherwise standard realistic penalty (-5)
  let penalty = 5;
  if (player.position === 'GK' && targetPosition !== 'GK') {
    penalty = 10;
  } else if (player.position !== 'GK' && targetPosition === 'GK') {
    penalty = 12;
  } else if (
    (player.position === 'FW' && ['CB', 'LB', 'RB'].includes(targetPosition)) ||
    (player.position === 'DF' && ['CF', 'LWG', 'RWG'].includes(targetPosition))
  ) {
    penalty = 7;
  }

  const effectiveRating = Math.max(40, player.rating - penalty);

  return {
    displayedPosition: targetPosition,
    isSuitable: false,
    effectiveRating,
    ratingDelta: -penalty,
  };
}
