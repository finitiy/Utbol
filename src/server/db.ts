/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { 
  User, 
  League, 
  Team, 
  Match, 
  Broadcaster, 
  AuditLogItem, 
  SystemSettings, 
  StandingItem 
} from '../types/index.ts';

// Password Security utilities using standard Node crypto PBKDF2 (SHA-512)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, originalHash] = combinedHash.split(':');
    if (!salt || !originalHash) return false;
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

// Generate random session token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate 6-digit email verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Timezone formatter: Convert UTC Date to Asia/Tashkent (UTC+5)
export function formatTashkentTime(utcDateStr: string): string {
  try {
    const date = new Date(utcDateStr);
    return new Intl.DateTimeFormat('uz-UZ', {
      timeZone: 'Asia/Tashkent',
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return '20:00, Bugun';
  }
}

// In-Memory Database store with pre-seeded Uzbekistan & International football data
class DatabaseStore {
  public users: Map<string, User & { passwordHash: string; verificationCode?: string }> = new Map();
  public sessions: Map<string, { userId: string; expiresAt: number }> = new Map();
  public leagues: Map<string, League> = new Map();
  public teams: Map<string, Team> = new Map();
  public matches: Map<string, Match> = new Map();
  public broadcasters: Map<string, Broadcaster> = new Map();
  public favorites: Map<string, Set<string>> = new Map(); // userId -> Set of teamIds
  public auditLogs: AuditLogItem[] = [];
  public settings: SystemSettings = {
    siteName: 'Futbol Live Uzbekistan',
    maintenanceMode: false,
    announcementNotice: 'Futbol Live Uzbekistan — O\'zbekiston Superligasi va Yevropa chempionatlarining barcha rasmiy jonli efirlari!',
    telegramBotActive: true,
    footballDataAutoSync: true,
  };
  public adminTelegramId: string = process.env.ADMIN_TELEGRAM_ID || '7853449314';

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Initial Administrator User (Email and Telegram)
    const adminId = 'admin-user-001';
    this.users.set(adminId, {
      id: adminId,
      email: 'admin@futballive.uz',
      username: 'admin',
      passwordHash: hashPassword('Admin12345!'),
      role: 'ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      telegramId: this.adminTelegramId,
      telegramUsername: 'futbol_admin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      favoriteTeamIds: ['uz-navbahor', 'eu-real-madrid'],
      notifyKickoff: true,
      notifyGoals: true,
      createdAt: new Date().toISOString(),
    });

    // Regular test user
    const sampleUserId = 'user-test-001';
    this.users.set(sampleUserId, {
      id: sampleUserId,
      email: 'muxlis@futballive.uz',
      username: 'muxlis_uz',
      passwordHash: hashPassword('Muxlis2026!'),
      role: 'USER',
      status: 'ACTIVE',
      isEmailVerified: true,
      telegramId: undefined,
      favoriteTeamIds: ['uz-pakhtakor'],
      notifyKickoff: true,
      notifyGoals: true,
      createdAt: new Date().toISOString(),
    });

    // 2. Broadcasters
    const b1: Broadcaster = {
      id: 'bc-sport-uz',
      name: "Sport TV O'zbekiston (MTRK)",
      websiteUrl: 'https://mtrk.uz/uz/tv/sport',
      country: "O'zbekiston",
      isOfficialPartner: true,
    };
    const b2: Broadcaster = {
      id: 'bc-uzreport',
      name: 'UzReport TV',
      websiteUrl: 'https://uzreport.news',
      country: "O'zbekiston",
      isOfficialPartner: true,
    };
    const b3: Broadcaster = {
      id: 'bc-setanta',
      name: 'Setanta Sports O\'zbekiston',
      websiteUrl: 'https://setantasports.com',
      country: 'Xalqaro / Markaziy Osiyo',
      isOfficialPartner: true,
    };
    const b4: Broadcaster = {
      id: 'bc-foreign',
      name: 'FastSports / Official Stream',
      websiteUrl: 'https://www.uefa.com',
      country: 'UEFA',
      isOfficialPartner: true,
    };

    [b1, b2, b3, b4].forEach((b) => this.broadcasters.set(b.id, b));

    // 3. Leagues
    const lSuperliga: League = {
      id: 'league-uz-superliga',
      code: 'UZ_SL',
      name: "O'zbekiston Superligasi",
      country: "O'zbekiston",
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Uzbekistan_Super_League_logo.png/220px-Uzbekistan_Super_League_logo.png',
      season: '2025/2026',
      priority: 1,
    };
    const lUCL: League = {
      id: 'league-ucl',
      code: 'CL',
      name: 'UEFA Chempionlar Ligasi',
      country: 'Yevropa',
      logoUrl: 'https://crests.football-data.org/CL.png',
      season: '2025/2026',
      priority: 2,
    };
    const lEPL: League = {
      id: 'league-epl',
      code: 'PL',
      name: 'Angliya Premyer-ligasi',
      country: 'Angliya',
      logoUrl: 'https://crests.football-data.org/PL.png',
      season: '2025/2026',
      priority: 3,
    };
    const lLaLiga: League = {
      id: 'league-laliga',
      code: 'PD',
      name: 'Ispaniya La Ligasi',
      country: 'Ispaniya',
      logoUrl: 'https://crests.football-data.org/PD.png',
      season: '2025/2026',
      priority: 4,
    };

    [lSuperliga, lUCL, lEPL, lLaLiga].forEach((l) => this.leagues.set(l.id, l));

    // 4. Teams
    const teamsList: Team[] = [
      // Uzbekistan Superliga
      { id: 'uz-navbahor', name: 'Navbahor Namangan', shortName: 'Navbahor', tla: 'NAV', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/PFC_Navbahor_Namangan_logo.png/180px-PFC_Navbahor_Namangan_logo.png', leagueId: 'league-uz-superliga', stadium: "Markaziy Stadioni, Namangan" },
      { id: 'uz-pakhtakor', name: 'Paxtakor Toshkent', shortName: 'Paxtakor', tla: 'PAK', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/96/FC_Pakhtakor_Tashkent_logo.png/180px-FC_Pakhtakor_Tashkent_logo.png', leagueId: 'league-uz-superliga', stadium: "Paxtakor Markaziy Stadioni, Toshkent" },
      { id: 'uz-nasaf', name: 'Nasaf Qarshi', shortName: 'Nasaf', tla: 'NAS', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/FC_Nasaf_logo.png/180px-FC_Nasaf_logo.png', leagueId: 'league-uz-superliga', stadium: "Markaziy Stadioni, Qarshi" },
      { id: 'uz-neftchi', name: 'Neftchi Farg\'ona', shortName: 'Neftchi', tla: 'NEF', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/FC_Neftchi_Fergana_logo.png/180px-FC_Neftchi_Fergana_logo.png', leagueId: 'league-uz-superliga', stadium: "Istiqlol Stadioni, Farg'ona" },
      { id: 'uz-bunyodkor', name: 'Bunyodkor Toshkent', shortName: 'Bunyodkor', tla: 'BUN', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/FC_Bunyodkor_logo.png/180px-FC_Bunyodkor_logo.png', leagueId: 'league-uz-superliga', stadium: "Bunyodkor Stadioni, Toshkent" },
      { id: 'uz-agmk', name: 'OKMK Olmaliq', shortName: 'OKMK', tla: 'AGM', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/FC_AGMK_logo.png/180px-FC_AGMK_logo.png', leagueId: 'league-uz-superliga', stadium: "OKMK Sport Majmuasi, Olmaliq" },
      { id: 'uz-andijon', name: 'Andijon FK', shortName: 'Andijon', tla: 'AND', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/FC_Andijon_logo.png/180px-FC_Andijon_logo.png', leagueId: 'league-uz-superliga', stadium: "Bobur Arena, Andijon" },
      { id: 'uz-dinamo', name: 'Dinamo Samarqand', shortName: 'Dinamo', tla: 'DIN', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/FC_Dinamo_Samarqand_logo.png/180px-FC_Dinamo_Samarqand_logo.png', leagueId: 'league-uz-superliga', stadium: "Dinamo Stadioni, Samarqand" },

      // European Teams
      { id: 'eu-real-madrid', name: 'Real Madrid', shortName: 'Real Madrid', tla: 'RMA', crestUrl: 'https://crests.football-data.org/86.png', leagueId: 'league-laliga', stadium: 'Santiago Bernabéu, Madrid' },
      { id: 'eu-barcelona', name: 'FC Barcelona', shortName: 'Barcelona', tla: 'FCB', crestUrl: 'https://crests.football-data.org/81.png', leagueId: 'league-laliga', stadium: 'Camp Nou, Barselona' },
      { id: 'eu-man-city', name: 'Manchester City', shortName: 'Man City', tla: 'MCI', crestUrl: 'https://crests.football-data.org/65.png', leagueId: 'league-epl', stadium: 'Etihad Stadium, Manchester' },
      { id: 'eu-arsenal', name: 'Arsenal FC', shortName: 'Arsenal', tla: 'ARS', crestUrl: 'https://crests.football-data.org/57.png', leagueId: 'league-epl', stadium: 'Emirates Stadium, London' },
      { id: 'eu-liverpool', name: 'Liverpool FC', shortName: 'Liverpool', tla: 'LIV', crestUrl: 'https://crests.football-data.org/64.png', leagueId: 'league-epl', stadium: 'Anfield, Liverpool' },
      { id: 'eu-bayern', name: 'Bayern Munich', shortName: 'Bayern', tla: 'FCB', crestUrl: 'https://crests.football-data.org/5.png', leagueId: 'league-ucl', stadium: 'Allianz Arena, Myunxen' },
      { id: 'eu-psg', name: 'Paris Saint-Germain', shortName: 'PSG', tla: 'PSG', crestUrl: 'https://crests.football-data.org/524.png', leagueId: 'league-ucl', stadium: 'Parc des Princes, Parij' },
    ];

    teamsList.forEach((t) => this.teams.set(t.id, t));

    // 5. Matches (Live, Upcoming, Finished)
    const now = new Date();
    
    // Live match 1: Navbahor vs Paxtakor (O'zbek El Klasikosi)
    const m1Id = 'match-live-001';
    const m1Date = new Date(now.getTime() - 65 * 60 * 1000).toISOString();
    this.matches.set(m1Id, {
      id: m1Id,
      leagueId: 'league-uz-superliga',
      leagueName: "O'zbekiston Superligasi",
      homeTeam: this.teams.get('uz-navbahor')!,
      awayTeam: this.teams.get('uz-pakhtakor')!,
      utcDate: m1Date,
      kickoffTashkent: formatTashkentTime(m1Date),
      status: 'IN_PLAY',
      minute: 68,
      homeScore: 2,
      awayScore: 1,
      broadcaster: b1,
      streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      streamType: 'HLS',
      isPublished: true,
      isFeatured: true,
      venue: "Markaziy Stadioni, Namangan (Tomoshabinlar: 22,000)",
      competitionRound: "22-tur",
    });

    // Live match 2: Real Madrid vs Manchester City (UCL)
    const m2Id = 'match-live-002';
    const m2Date = new Date(now.getTime() - 35 * 60 * 1000).toISOString();
    this.matches.set(m2Id, {
      id: m2Id,
      leagueId: 'league-ucl',
      leagueName: 'UEFA Chempionlar Ligasi',
      homeTeam: this.teams.get('eu-real-madrid')!,
      awayTeam: this.teams.get('eu-man-city')!,
      utcDate: m2Date,
      kickoffTashkent: formatTashkentTime(m2Date),
      status: 'IN_PLAY',
      minute: 37,
      homeScore: 1,
      awayScore: 1,
      broadcaster: b2,
      streamUrl: 'https://uzreport.news',
      streamType: 'EXTERNAL',
      isPublished: true,
      isFeatured: true,
      venue: 'Santiago Bernabéu, Madrid',
      competitionRound: '1/4 Final, Birinchi bahs',
    });

    // Upcoming Match 1: Nasaf vs Neftchi (Bugun oqshom)
    const m3Id = 'match-up-001';
    const m3Date = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    this.matches.set(m3Id, {
      id: m3Id,
      leagueId: 'league-uz-superliga',
      leagueName: "O'zbekiston Superligasi",
      homeTeam: this.teams.get('uz-nasaf')!,
      awayTeam: this.teams.get('uz-neftchi')!,
      utcDate: m3Date,
      kickoffTashkent: formatTashkentTime(m3Date),
      status: 'SCHEDULED',
      broadcaster: b1,
      streamUrl: 'https://mtrk.uz/uz/tv/sport',
      streamType: 'EXTERNAL',
      isPublished: true,
      isFeatured: false,
      venue: 'Markaziy Stadioni, Qarshi',
      competitionRound: '22-tur',
    });

    // Upcoming Match 2: Arsenal vs Liverpool (Premyer-liga)
    const m4Id = 'match-up-002';
    const m4Date = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    this.matches.set(m4Id, {
      id: m4Id,
      leagueId: 'league-epl',
      leagueName: 'Angliya Premyer-ligasi',
      homeTeam: this.teams.get('eu-arsenal')!,
      awayTeam: this.teams.get('eu-liverpool')!,
      utcDate: m4Date,
      kickoffTashkent: formatTashkentTime(m4Date),
      status: 'SCHEDULED',
      broadcaster: b3,
      streamUrl: 'https://setantasports.com',
      streamType: 'EXTERNAL',
      isPublished: true,
      isFeatured: true,
      venue: 'Emirates Stadium, London',
      competitionRound: '29-tur',
    });

    // Upcoming Match 3: FC Barcelona vs Bayern Munich (Ertaga)
    const m5Id = 'match-up-003';
    const m5Date = new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString();
    this.matches.set(m5Id, {
      id: m5Id,
      leagueId: 'league-ucl',
      leagueName: 'UEFA Chempionlar Ligasi',
      homeTeam: this.teams.get('eu-barcelona')!,
      awayTeam: this.teams.get('eu-bayern')!,
      utcDate: m5Date,
      kickoffTashkent: formatTashkentTime(m5Date),
      status: 'SCHEDULED',
      broadcaster: b2,
      streamUrl: 'https://uzreport.news',
      streamType: 'EXTERNAL',
      isPublished: true,
      isFeatured: false,
      venue: 'Camp Nou, Barselona',
      competitionRound: '1/4 Final',
    });

    // Finished Match: Bunyodkor vs Dinamo Samarqand
    const m6Id = 'match-fin-001';
    const m6Date = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    this.matches.set(m6Id, {
      id: m6Id,
      leagueId: 'league-uz-superliga',
      leagueName: "O'zbekiston Superligasi",
      homeTeam: this.teams.get('uz-bunyodkor')!,
      awayTeam: this.teams.get('uz-dinamo')!,
      utcDate: m6Date,
      kickoffTashkent: formatTashkentTime(m6Date),
      status: 'FINISHED',
      homeScore: 1,
      awayScore: 2,
      broadcaster: b1,
      streamUrl: 'https://mtrk.uz/uz/tv/sport',
      streamType: 'EXTERNAL',
      isPublished: true,
      isFeatured: false,
      venue: 'Bunyodkor Stadioni, Toshkent',
      competitionRound: '21-tur',
    });

    // 6. Initial Audit Log
    this.auditLogs.push({
      id: 'log-001',
      adminId: 'system',
      adminName: 'Tizim Boshqaruvchisi',
      action: 'BOOTSTRAP',
      details: 'Futbol Live Uzbekistan tizimi muvaffaqiyatli ishga tushirildi. Superliga va UCL o\'yinlari bazaga kiritildi.',
      timestamp: new Date().toISOString(),
    });
  }

  // Standings generator for Superliga
  public getSuperligaStandings(): StandingItem[] {
    const teams = [
      { id: 'uz-nasaf', name: 'Nasaf Qarshi', p: 52, w: 15, d: 7, l: 2, gf: 38, ga: 15 },
      { id: 'uz-navbahor', name: 'Navbahor Namangan', p: 48, w: 14, d: 6, l: 4, gf: 40, ga: 19 },
      { id: 'uz-pakhtakor', name: 'Paxtakor Toshkent', p: 47, w: 14, d: 5, l: 5, gf: 42, ga: 22 },
      { id: 'uz-neftchi', name: 'Neftchi Farg\'ona', p: 43, w: 12, d: 7, l: 5, gf: 33, ga: 20 },
      { id: 'uz-agmk', name: 'OKMK Olmaliq', p: 39, w: 11, d: 6, l: 7, gf: 35, ga: 28 },
      { id: 'uz-andijon', name: 'Andijon FK', p: 33, w: 9, d: 6, l: 9, gf: 31, ga: 32 },
      { id: 'uz-dinamo', name: 'Dinamo Samarqand', p: 29, w: 8, d: 5, l: 11, gf: 27, ga: 33 },
      { id: 'uz-bunyodkor', name: 'Bunyodkor Toshkent', p: 25, w: 6, d: 7, l: 11, gf: 24, ga: 36 },
    ];

    return teams.map((t, idx) => {
      const fullTeam = this.teams.get(t.id) || {
        id: t.id,
        name: t.name,
        shortName: t.name,
        tla: t.id.slice(3, 6).toUpperCase(),
        crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Uzbekistan_Super_League_logo.png/220px-Uzbekistan_Super_League_logo.png',
        leagueId: 'league-uz-superliga',
      };

      return {
        position: idx + 1,
        team: fullTeam,
        playedGames: t.w + t.d + t.l,
        won: t.w,
        draw: t.d,
        lost: t.l,
        points: t.p,
        goalsFor: t.gf,
        goalsAgainst: t.ga,
        goalDifference: t.gf - t.ga,
      };
    });
  }

  // Audit logger
  public addAuditLog(adminId: string, adminName: string, action: string, details: string) {
    const entry: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      adminId,
      adminName,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
    return entry;
  }
}

export const db = new DatabaseStore();
