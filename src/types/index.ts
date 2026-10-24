/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MatchStatus = 'SCHEDULED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';

export type StreamType = 'HLS' | 'EMBED' | 'EXTERNAL';

export interface Broadcaster {
  id: string;
  name: string;
  logoUrl?: string;
  websiteUrl: string;
  country: string;
  isOfficialPartner: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  tla: string;
  crestUrl: string;
  leagueId: string;
  stadium?: string;
}

export interface League {
  id: string;
  code: string;
  name: string;
  country: string;
  logoUrl: string;
  season: string;
  priority: number;
}

export interface Match {
  id: string;
  externalId?: string;
  leagueId: string;
  leagueName: string;
  homeTeam: Team;
  awayTeam: Team;
  utcDate: string; // ISO 8601
  kickoffTashkent: string; // e.g. "20:00, 24-Okt"
  status: MatchStatus;
  minute?: number;
  homeScore?: number;
  awayScore?: number;
  broadcaster?: Broadcaster;
  streamUrl?: string;
  streamType?: StreamType;
  isPublished: boolean;
  isFeatured?: boolean;
  venue?: string;
  competitionRound?: string;
  highlightsUrl?: string;
}

export interface StandingItem {
  position: number;
  team: Team;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  telegramId?: string;
  telegramUsername?: string;
  avatarUrl?: string;
  favoriteTeamIds: string[];
  notifyKickoff: boolean;
  notifyGoals: boolean;
  createdAt: string;
}

export interface TelegramAuthPayload {
  initData: string;
}

export interface AuditLogItem {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  siteName: string;
  maintenanceMode: boolean;
  announcementNotice: string;
  telegramBotActive: boolean;
  footballDataAutoSync: boolean;
}
