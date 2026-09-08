import { UserTeam, TeamTactics, Player } from './index';

export type TournamentStatus =
  | 'DRAFT'
  | 'REGISTRATION'
  | 'LOCKED'
  | 'GROUP_STAGE'
  | 'KNOCKOUT'
  | 'FINISHED'
  | 'REWARDING'
  | 'COMPLETED';

export type TournamentFormat = 'ROUND_ROBIN' | 'GROUP_KNOCKOUT';

export type TournamentStage =
  | 'ROUND_ROBIN'
  | 'GROUP'
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'THIRD_PLACE'
  | 'FINAL';

export interface TournamentDefinition {
  tournamentId: string;
  nameJa: string;
  nameEn: string;
  isTrial: boolean;
  edition: number;
  status: TournamentStatus;
  registrationStartMs: number;
  registrationEndMs: number;
  matchStartMs: number;
  matchEndMs: number;
  format: TournamentFormat;
  minParticipants: number;
  entryCount: number;
  rewards: {
    rank1: { type: string; count: number; labelJa: string };
    rank2: { type: string; count: number; labelJa: string };
    rank3: { type: string; count: number; labelJa: string };
  };
}

export interface TournamentEntry {
  tournamentId: string;
  userId: string;
  displayName: string;
  entryStatus:
    | 'ENTERED'
    | 'CONFIRMED'
    | 'QUALIFIED'
    | 'ELIMINATED'
    | 'CHAMPION'
    | 'RUNNER_UP'
    | 'THIRD_PLACE';
  enteredAt: number;
  teamSnapshot: UserTeam;
  tacticsSnapshot: TeamTactics;
  defensiveSquadSnapshot?: UserTeam;
  teamOvr: number;
  tacticsModifiedCount?: number;
}

export interface TournamentGroup {
  groupId: string;
  groupNameJa: string;
  groupNameEn: string;
  participantUserIds: string[];
}

export interface TournamentStanding {
  tournamentId: string;
  groupId?: string;
  userId: string;
  displayName: string;
  teamName: string;
  teamOvr: number;
  rank: number;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  isQualified: boolean; // Top 2 advance to knockout
}

export type GoalPatternType =
  | 'CROSS'
  | 'THROUGH_PASS'
  | 'MIDDLE_SHOT'
  | 'COUNTER'
  | 'CENTRAL_BREAKTHROUGH'
  | 'LOOSE_BALL'
  | 'CORNER_KICK'
  | 'FREE_KICK';

export interface TournamentMatchEvent {
  minute: number;
  type: 'goal' | 'tactic' | 'chance' | 'whistle' | 'card' | 'penalty';
  textJa: string;
  textEn?: string;
  scorerName?: string;
  scorerTeam?: 'HOME' | 'AWAY';
  goalPattern?: GoalPatternType;
}

export interface TournamentMatch {
  matchId: string;
  tournamentId: string;
  stage: TournamentStage;
  stageNameJa: string;
  groupId?: string;
  round: number;
  homeUserId: string;
  homeDisplayName: string;
  awayUserId: string;
  awayDisplayName: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  winnerUserId?: string;
  homeTactics: TeamTactics;
  awayTactics: TeamTactics;
  homeTeamSnapshot: UserTeam;
  awayTeamSnapshot: UserTeam;
  status: 'SCHEDULED' | 'PLAYING' | 'COMPLETED';
  createdAt: number;
  completedAt?: number;
  events: TournamentMatchEvent[];
  tacticalAnalysisJa?: string;
  tacticalAnalysisEn?: string;
}

export interface TournamentKnockoutBracket {
  quarterFinals: TournamentMatch[];
  semiFinals: TournamentMatch[];
  thirdPlaceMatch?: TournamentMatch;
  finalMatch?: TournamentMatch;
  champion?: TournamentEntry;
  runnerUp?: TournamentEntry;
  thirdPlaceWinner?: TournamentEntry;
}

export interface TournamentRewardGrant {
  rewardId: string;
  tournamentId: string;
  userId: string;
  rank: 1 | 2 | 3;
  rewardType: string;
  amount: number;
  grantedAt: number;
  isClaimed: boolean;
  claimedAt?: number;
}

export interface TournamentState {
  definition: TournamentDefinition;
  entries: TournamentEntry[];
  groups: TournamentGroup[];
  standings: TournamentStanding[];
  matches: TournamentMatch[];
  knockoutBracket?: TournamentKnockoutBracket;
  rewards: TournamentRewardGrant[];
  currentServerTimeMs: number;
}
