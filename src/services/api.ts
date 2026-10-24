/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Match,
  MatchStatus,
  League,
  StandingItem,
  Team,
  User,
  AuditLogItem,
  SystemSettings,
  StreamSource,
  StreamType,
} from '../types/index.ts';

// -------------------------------------------------------------
// 1. FOOTBALL-DATA.ORG RAW API TYPES & CONSTANTS
// -------------------------------------------------------------

export const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';
export const FOOTBALL_DATA_PROXY_URL = '/api/football-data/v4';

export interface FootballDataArea {
  id: number;
  name: string;
  code?: string;
  flag?: string;
}

export interface FootballDataCompetition {
  id: number;
  name: string;
  code: string;
  type?: string;
  emblem?: string;
  area?: FootballDataArea;
  currentSeason?: {
    id?: number;
    startDate?: string;
    endDate?: string;
    currentMatchday?: number;
    winner?: any;
  };
}

export interface FootballDataTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
  address?: string;
  website?: string;
  founded?: number;
  clubColors?: string;
  venue?: string;
}

export interface FootballDataScore {
  winner?: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration?: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
  fullTime?: { home: number | null; away: number | null };
  halfTime?: { home: number | null; away: number | null };
  extraTime?: { home: number | null; away: number | null };
  penalties?: { home: number | null; away: number | null };
}

export interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number;
  stage?: string;
  group?: string | null;
  lastUpdated?: string;
  minute?: number;
  venue?: string;
  competition: {
    id: number;
    name: string;
    code?: string;
    emblem?: string;
    area?: FootballDataArea;
  };
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score: FootballDataScore;
}

export interface FootballDataTableEntry {
  position: number;
  team: {
    id: number;
    name: string;
    shortName?: string;
    tla?: string;
    crest?: string;
  };
  playedGames: number;
  form?: string;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface FootballDataStandingsResponse {
  competition: FootballDataCompetition;
  season?: any;
  standings?: Array<{
    stage: string;
    type: string;
    group?: string | null;
    table: FootballDataTableEntry[];
  }>;
}

// -------------------------------------------------------------
// 2. MODEL MAPPERS & UTILITY FUNCTIONS
// -------------------------------------------------------------

/**
 * Format UTC ISO string to Tashkent (UTC+5) localized string
 */
export function formatTashkentTime(utcDateStr: string): string {
  try {
    const date = new Date(utcDateStr);
    if (isNaN(date.getTime())) return utcDateStr;

    // Tashkent is UTC+5 (Asia/Tashkent)
    const optionsDate: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Tashkent',
      month: 'short',
      day: 'numeric',
    };
    const optionsTime: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Tashkent',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    const dateFormatted = new Intl.DateTimeFormat('uz-UZ', optionsDate).format(date);
    const timeFormatted = new Intl.DateTimeFormat('uz-UZ', optionsTime).format(date);

    // Check if match is today or tomorrow in Tashkent time
    const now = new Date();
    const todayInTashkent = new Intl.DateTimeFormat('uz-UZ', optionsDate).format(now);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowInTashkent = new Intl.DateTimeFormat('uz-UZ', optionsDate).format(tomorrow);

    if (dateFormatted === todayInTashkent) {
      return `Bugun, ${timeFormatted}`;
    } else if (dateFormatted === tomorrowInTashkent) {
      return `Ertaga, ${timeFormatted}`;
    }

    return `${dateFormatted}, ${timeFormatted}`;
  } catch {
    return utcDateStr;
  }
}

/**
 * Map Football-Data.org match status to internal MatchStatus
 */
export function mapFootballDataStatus(status: string): MatchStatus {
  const s = (status || '').toUpperCase().trim();
  switch (s) {
    case 'IN_PLAY':
    case 'LIVE':
    case 'IN_PROGRESS':
    case 'FIRST_HALF':
    case 'SECOND_HALF':
    case 'EXTRA_TIME':
    case 'PENALTY_SHOOTOUT':
      return 'IN_PLAY';
    case 'PAUSED':
    case 'HALFTIME':
    case 'HT':
    case 'BREAK':
      return 'PAUSED';
    case 'FINISHED':
    case 'FT':
    case 'AET':
    case 'AP':
    case 'AWARDED':
      return 'FINISHED';
    case 'SCHEDULED':
    case 'TIMED':
    case 'POSTPONED':
    case 'CANCELLED':
    case 'SUSPENDED':
    default:
      return 'SCHEDULED';
  }
}

/**
 * Standard stream sources for any football match
 */
export function generateStreamSources(_matchTitle: string): StreamSource[] {
  return [
    {
      id: 'stream-sport-uz',
      name: "Sport TV (O'zbekiston)",
      quality: '1080p 50fps',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      type: 'HLS' as StreamType,
      isDefault: true,
    },
    {
      id: 'stream-uzreport',
      name: "UzReport TV Jonli Efir",
      quality: '720p HD',
      url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      type: 'HLS' as StreamType,
    },
    {
      id: 'stream-setanta',
      name: 'Setanta Sports 1 UZ',
      quality: '1080p FHD',
      url: 'https://assets.afcdn.com/video49/20210722/v_645516.m3u8',
      type: 'HLS' as StreamType,
    },
    {
      id: 'stream-fast-sports',
      name: 'Fast Sports HD',
      quality: '1080p 60fps',
      url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
      type: 'HLS' as StreamType,
    },
  ];
}

/**
 * Map raw Football-Data.org Match object into the UI Match model
 */
export function mapFootballDataMatchToModel(fdMatch: FootballDataMatch): Match {
  const status = mapFootballDataStatus(fdMatch.status);

  // Extract score
  let homeScore: number | undefined = undefined;
  let awayScore: number | undefined = undefined;

  if (fdMatch.score?.fullTime?.home !== null && fdMatch.score?.fullTime?.home !== undefined) {
    homeScore = fdMatch.score.fullTime.home;
    awayScore = fdMatch.score.fullTime.away ?? 0;
  } else if (status === 'IN_PLAY' || status === 'PAUSED' || status === 'FINISHED') {
    homeScore = fdMatch.score?.halfTime?.home ?? 0;
    awayScore = fdMatch.score?.halfTime?.away ?? 0;
  }

  // Calculate or parse minute
  let minute: number | undefined = fdMatch.minute;
  if (minute === undefined && status === 'IN_PLAY') {
    try {
      const matchStart = new Date(fdMatch.utcDate).getTime();
      const elapsed = Math.floor((Date.now() - matchStart) / (60 * 1000));
      minute = Math.min(Math.max(1, elapsed), 90);
    } catch {
      minute = 45;
    }
  } else if (status === 'PAUSED') {
    minute = 45;
  } else if (status === 'FINISHED') {
    minute = 90;
  }

  const leagueCode = fdMatch.competition?.code || 'CL';
  const leagueId = `league-${leagueCode.toLowerCase()}`;
  const leagueName = fdMatch.competition?.name || 'Futbol Uchrashuvi';

  const homeTeam: Team = {
    id: `fdo-team-${fdMatch.homeTeam?.id || Math.random()}`,
    name: fdMatch.homeTeam?.name || 'Mezbon Jamoa',
    shortName: fdMatch.homeTeam?.shortName || fdMatch.homeTeam?.tla || fdMatch.homeTeam?.name || 'Mezbon',
    crestUrl:
      fdMatch.homeTeam?.crest ||
      `https://crests.football-data.org/${fdMatch.homeTeam?.id}.png` ||
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=128&q=80',
    tla: fdMatch.homeTeam?.tla || (fdMatch.homeTeam?.shortName || 'HOM').slice(0, 3).toUpperCase(),
    leagueId,
  };

  const awayTeam: Team = {
    id: `fdo-team-${fdMatch.awayTeam?.id || Math.random()}`,
    name: fdMatch.awayTeam?.name || 'Mehmon Jamoa',
    shortName: fdMatch.awayTeam?.shortName || fdMatch.awayTeam?.tla || fdMatch.awayTeam?.name || 'Mehmon',
    crestUrl:
      fdMatch.awayTeam?.crest ||
      `https://crests.football-data.org/${fdMatch.awayTeam?.id}.png` ||
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=128&q=80',
    tla: fdMatch.awayTeam?.tla || (fdMatch.awayTeam?.shortName || 'AWY').slice(0, 3).toUpperCase(),
    leagueId,
  };

  const matchTitle = `${homeTeam.name} vs ${awayTeam.name}`;
  const streamSources = generateStreamSources(matchTitle);

  return {
    id: `fdo-${fdMatch.id}`,
    externalId: String(fdMatch.id),
    leagueId,
    leagueName,
    homeTeam,
    awayTeam,
    utcDate: fdMatch.utcDate,
    kickoffTashkent: formatTashkentTime(fdMatch.utcDate),
    status,
    minute,
    homeScore,
    awayScore,
    venue: fdMatch.venue || `${homeTeam.name} stadioni`,
    competitionRound: fdMatch.matchday ? `${fdMatch.matchday}-tur` : fdMatch.stage,
    broadcaster: {
      id: 'bc-sport-uz',
      name: "Sport TV O'zbekiston",
      websiteUrl: 'https://mtrk.uz/uz/tv/sport/',
      country: "O'zbekiston",
      isOfficialPartner: true,
    },
    streamUrl: streamSources[0].url,
    streamType: 'EXTERNAL' as StreamType,
    streamSources,
    isPublished: true,
    isFeatured: status === 'IN_PLAY' || fdMatch.competition?.code === 'CL' || fdMatch.competition?.code === 'PL',
  };
}

/**
 * Map raw Football-Data.org Competition object into the UI League model
 */
export function mapFootballDataLeagueToModel(fdComp: FootballDataCompetition, index = 0): League {
  const code = fdComp.code || `COMP_${fdComp.id}`;
  return {
    id: `league-${code.toLowerCase()}`,
    name: fdComp.name,
    code: code,
    logoUrl: fdComp.emblem || `https://crests.football-data.org/${code}.png`,
    country: fdComp.area?.name || "Xalqaro",
    season: '2025/2026',
    priority: index + 1,
  };
}

/**
 * Map raw Football-Data.org Standing Table Entry to UI StandingItem model
 */
export function mapFootballDataStandingToModel(entry: FootballDataTableEntry, leagueId?: string | number): StandingItem {
  return {
    position: entry.position,
    team: {
      id: String(entry.team.id),
      name: entry.team.name,
      crestUrl: entry.team.crest || `https://crests.football-data.org/${entry.team.id}.png`,
      shortName: entry.team.shortName || entry.team.name,
      tla: entry.team.tla || entry.team.name.slice(0, 3).toUpperCase(),
      leagueId: typeof leagueId === 'string' ? leagueId : 'league-general',
    },
    playedGames: entry.playedGames || 0,
    won: entry.won || 0,
    draw: entry.draw || 0,
    lost: entry.lost || 0,
    points: entry.points || 0,
    goalsFor: entry.goalsFor || 0,
    goalsAgainst: entry.goalsAgainst || 0,
    goalDifference: entry.goalDifference ?? ((entry.goalsFor || 0) - (entry.goalsAgainst || 0)),
  };
}

// -------------------------------------------------------------
// 3. AUTH & STORAGE
// -------------------------------------------------------------

const TOKEN_KEY = 'futbol_live_token';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

function getHeaders(): HeadersInit {
  const token = authStorage.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// -------------------------------------------------------------
// 4. API CLIENT WITH ACTUAL FETCH CALLS & ERROR HANDLING
// -------------------------------------------------------------

export const api = {
  // -----------------------------------------------------------
  // Matches: Real Fetch Calls to Sports API & Server with Fallback
  // -----------------------------------------------------------

  /**
   * Fetch all football matches with filtering and mapping to UI Match models
   */
  async getMatches(params?: {
    status?: string;
    leagueId?: string;
    search?: string;
    refresh?: boolean;
    directApi?: boolean;
  }): Promise<{ matches: Match[]; total: number }> {
    try {
      // 1. If directApi requested or client has an API key, try Football-Data.org directly / via proxy
      const directKey = (import.meta as any).env?.VITE_FOOTBALL_DATA_API_KEY;

      if (params?.directApi && directKey) {
        try {
          const directRes = await fetch(`${FOOTBALL_DATA_BASE_URL}/matches`, {
            headers: {
              'X-Auth-Token': directKey,
            },
          });
          if (directRes.ok) {
            const raw = await directRes.json();
            if (Array.isArray(raw.matches)) {
              let mapped = raw.matches.map(mapFootballDataMatchToModel);

              if (params?.status && params.status !== 'ALL') {
                mapped = mapped.filter((m: Match) => m.status === params.status);
              }
              if (params?.leagueId && params.leagueId !== 'ALL') {
                mapped = mapped.filter((m: Match) => m.leagueId === params.leagueId);
              }
              if (params?.search) {
                const q = params.search.toLowerCase();
                mapped = mapped.filter(
                  (m: Match) =>
                    m.homeTeam.name.toLowerCase().includes(q) ||
                    m.awayTeam.name.toLowerCase().includes(q) ||
                    m.leagueName.toLowerCase().includes(q)
                );
              }
              return { matches: mapped, total: mapped.length };
            }
          }
        } catch (directErr) {
          console.warn('Direct Football-Data.org fetch fallback to server:', directErr);
        }
      }

      // 2. Default & reliable real-time provider endpoint (synced with Football-Data.org & ESPN)
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.leagueId) query.set('leagueId', params.leagueId);
      if (params?.search) query.set('search', params.search);
      if (params?.refresh) query.set('refresh', 'true');

      const res = await fetch(`/api/matches?${query.toString()}`, { headers: getHeaders() });
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("So'rovlar soni cheklandi (Rate limit). Biroz kuting.");
        }
        throw new Error(`O'yinlarni yuklashda xatolik yuz berdi (${res.status})`);
      }

      const data = await res.json();
      return {
        matches: Array.isArray(data.matches) ? data.matches : [],
        total: data.total ?? (Array.isArray(data.matches) ? data.matches.length : 0),
      };
    } catch (err: any) {
      console.error('getMatches error:', err);
      throw new Error(err?.message || "O'yinlar ro'yxatini yuklab bo'lmadi");
    }
  },

  /**
   * Fetch single match details
   */
  async getMatch(id: string): Promise<{ match: Match }> {
    try {
      // If external ID, can also try football-data proxy
      if (id.startsWith('fdo-')) {
        const rawId = id.replace('fdo-', '');
        try {
          const directRes = await fetch(`${FOOTBALL_DATA_PROXY_URL}/matches/${rawId}`, {
            headers: getHeaders(),
          });
          if (directRes.ok) {
            const rawMatch = await directRes.json();
            if (rawMatch && rawMatch.id) {
              return { match: mapFootballDataMatchToModel(rawMatch) };
            }
          }
        } catch {
          // Fall through to server endpoint
        }
      }

      const res = await fetch(`/api/matches/${id}`, { headers: getHeaders() });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Uchrashuv topilmadi");
        throw new Error(`Uchrashuv ma'lumotlarini yuklashda xatolik (${res.status})`);
      }

      return (await res.json()) as { match: Match };
    } catch (err: any) {
      console.error('getMatch error:', err);
      throw new Error(err?.message || "Uchrashuv ma'lumotlarini yuklab bo'lmadi");
    }
  },

  /**
   * Fetch currently live matches (status IN_PLAY)
   */
  async getLiveMatches(): Promise<{ liveMatches: Match[]; count: number }> {
    try {
      const res = await fetch('/api/matches/live', { headers: getHeaders() });
      if (!res.ok) {
        throw new Error(`Jonli o'yinlarni yuklashda xatolik (${res.status})`);
      }
      const data = await res.json();
      return {
        liveMatches: Array.isArray(data.liveMatches) ? data.liveMatches : [],
        count: data.count ?? (Array.isArray(data.liveMatches) ? data.liveMatches.length : 0),
      };
    } catch (err: any) {
      console.error('getLiveMatches error:', err);
      return { liveMatches: [], count: 0 };
    }
  },

  /**
   * Trigger immediate real-time sync with sports data provider
   */
  async triggerLiveSync(): Promise<{ syncedCount?: number; liveCount?: number; status?: string; message?: string }> {
    try {
      const res = await fetch('/api/sync/live', {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Jonli sinxronlashda xatolik (${res.status})`);
      }
      return await res.json();
    } catch (err: any) {
      console.warn('triggerLiveSync warning:', err);
      return { status: 'warning', message: err?.message || 'Sinxronlash amalga oshmadi' };
    }
  },

  /**
   * Fetch leagues list mapped to UI League model
   */
  async getLeagues(): Promise<{ leagues: League[] }> {
    try {
      // Try local/synced leagues endpoint first
      const res = await fetch('/api/leagues', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.leagues) && data.leagues.length > 0) {
          return { leagues: data.leagues };
        }
      }

      // Fallback: fetch directly from Football-Data competitions proxy
      const proxyRes = await fetch(`${FOOTBALL_DATA_PROXY_URL}/competitions`, { headers: getHeaders() });
      if (proxyRes.ok) {
        const raw = await proxyRes.json();
        if (Array.isArray(raw.competitions)) {
          const mapped = raw.competitions.map((c: FootballDataCompetition, idx: number) =>
            mapFootballDataLeagueToModel(c, idx)
          );
          return { leagues: mapped };
        }
      }

      throw new Error("Ligalarni yuklashda xatolik yuz berdi");
    } catch (err: any) {
      console.error('getLeagues error:', err);
      throw new Error(err?.message || "Ligalarni yuklab bo'lmadi");
    }
  },

  /**
   * Fetch competition standings mapped to UI StandingItem model
   */
  async getStandings(leagueCode: string): Promise<{ standings: StandingItem[] }> {
    try {
      // 1. Fetch from server endpoint which handles ESPN & Football-Data.org aggregation
      const res = await fetch(`/api/standings/${encodeURIComponent(leagueCode)}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.standings) && data.standings.length > 0) {
          return { standings: data.standings };
        }
      }

      // 2. Direct fallback to Football-Data.org standings proxy
      const proxyRes = await fetch(`${FOOTBALL_DATA_PROXY_URL}/competitions/${encodeURIComponent(leagueCode)}/standings`, {
        headers: getHeaders(),
      });
      if (proxyRes.ok) {
        const raw: FootballDataStandingsResponse = await proxyRes.json();
        const totalTable = raw.standings?.find((s) => s.type === 'TOTAL')?.table || raw.standings?.[0]?.table;
        if (Array.isArray(totalTable)) {
          return { standings: totalTable.map(mapFootballDataStandingToModel) };
        }
      }

      return { standings: [] };
    } catch (err: any) {
      console.error(`getStandings for ${leagueCode} error:`, err);
      throw new Error(err?.message || "Turnir jadvalini yuklab bo'lmadi");
    }
  },

  /**
   * Fetch teams list
   */
  async getTeams(): Promise<{ teams: Team[] }> {
    try {
      const res = await fetch('/api/teams', { headers: getHeaders() });
      if (!res.ok) throw new Error("Jamoalarni yuklashda xatolik");
      return (await res.json()) as { teams: Team[] };
    } catch (err: any) {
      console.error('getTeams error:', err);
      throw new Error(err?.message || "Jamoalarni yuklab bo'lmadi");
    }
  },

  /**
   * Toggle favorite team
   */
  async toggleFavorite(teamId: string) {
    const res = await fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ teamId }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Sevimlilarni o'zgartirishda xatolik");
    return result as { favoriteTeamIds: string[]; action: 'added' | 'removed'; message: string };
  },

  // -----------------------------------------------------------
  // Auth Endpoints
  // -----------------------------------------------------------

  async register(data: { email: string; username: string; password: string }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Ro'yxatdan o'tishda xatolik");
    if (result.token) authStorage.setToken(result.token);
    return result;
  },

  async verifyEmail(email: string, code: string) {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Tasdiqlashda xatolik');
    return result;
  },

  async login(data: { identifier: string; password: string }) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Kirishda xatolik');
    if (result.token) authStorage.setToken(result.token);
    return result;
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getHeaders(),
      });
    } finally {
      authStorage.removeToken();
    }
  },

  async getMe(): Promise<{ user: User } | null> {
    const token = authStorage.getToken();
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', { headers: getHeaders() });
      if (!res.ok) {
        authStorage.removeToken();
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  },

  async validateTelegramMiniApp(initData: string) {
    const res = await fetch('/api/auth/telegram/validate-miniapp', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ initData }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Telegram orqali kirishda xatolik');
    if (result.token) authStorage.setToken(result.token);
    return result;
  },

  async telegramQuickLogin(data: { telegramId: string; username?: string; firstName?: string }) {
    const res = await fetch('/api/auth/telegram/quick-login', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Telegram orqali kirishda xatolik');
    if (result.token) authStorage.setToken(result.token);
    return result;
  },

  // -----------------------------------------------------------
  // Telegram Bot integration
  // -----------------------------------------------------------

  async getTelegramInfo() {
    const res = await fetch('/api/telegram/info');
    return await res.json();
  },

  async connectTelegramBot(token: string) {
    const res = await fetch('/api/telegram/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Telegram botni ulashda xatolik');
    return result;
  },

  async simulateTelegramCommand(command: string, telegramId?: string) {
    const res = await fetch('/api/telegram/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, telegramId }),
    });
    return await res.json();
  },

  // -----------------------------------------------------------
  // Admin Management Endpoints
  // -----------------------------------------------------------

  async getAdminMetrics() {
    const res = await fetch('/api/admin/metrics', { headers: getHeaders() });
    if (!res.ok) throw new Error('Admin statistikasini yuklashda xatolik');
    return (await res.json()).metrics;
  },

  async getAdminUsers(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`/api/admin/users${query}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Foydalanuvchilarni yuklashda xatolik');
    return (await res.json()).users as User[];
  },

  async setUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Holatni yangilashda xatolik");
    return result;
  },

  async createMatch(matchData: any) {
    const res = await fetch('/api/admin/matches', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(matchData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "O'yin qo'shishda xatolik");
    return result.match as Match;
  },

  async updateMatch(id: string, matchData: any) {
    const res = await fetch(`/api/admin/matches/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(matchData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "O'yinni yangilashda xatolik");
    return result.match as Match;
  },

  async deleteMatch(id: string) {
    const res = await fetch(`/api/admin/matches/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "O'chirishda xatolik");
    return result;
  },

  async broadcastTelegram(message: string) {
    const res = await fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Xabarnoma yuborishda xatolik');
    return result;
  },

  async getAuditLogs() {
    const res = await fetch('/api/admin/audit-logs', { headers: getHeaders() });
    if (!res.ok) throw new Error('Audit jurnallarini yuklashda xatolik');
    return (await res.json()).auditLogs as AuditLogItem[];
  },

  async getSettings() {
    const res = await fetch('/api/admin/settings', { headers: getHeaders() });
    if (!res.ok) throw new Error('Sozlamalarni yuklashda xatolik');
    return (await res.json()).settings as SystemSettings;
  },

  async updateSettings(settings: Partial<SystemSettings>) {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Sozlamalarni saqlashda xatolik');
    return result.settings as SystemSettings;
  },

  async syncFootballData() {
    const res = await fetch('/api/admin/sync-football', {
      method: 'POST',
      headers: getHeaders(),
    });
    return await res.json();
  },
};
