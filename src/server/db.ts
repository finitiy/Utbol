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

// Timezone formatter: Convert UTC Date to Asia/Tashkent (UTC+5) with Bugun/Ertaga/Kecha label
export function formatTashkentTime(utcDateStr: string): string {
  try {
    const targetDate = new Date(utcDateStr);
    const now = new Date();

    // Tashkent is UTC+5 (300 minutes)
    const tzOffset = 5 * 60 * 60 * 1000;
    const targetTashkent = new Date(targetDate.getTime() + tzOffset);
    const nowTashkent = new Date(now.getTime() + tzOffset);

    // Compare year, month, date in Tashkent timezone
    const isToday =
      targetTashkent.getUTCFullYear() === nowTashkent.getUTCFullYear() &&
      targetTashkent.getUTCMonth() === nowTashkent.getUTCMonth() &&
      targetTashkent.getUTCDate() === nowTashkent.getUTCDate();

    const isTomorrow =
      targetTashkent.getUTCFullYear() === nowTashkent.getUTCFullYear() &&
      targetTashkent.getUTCMonth() === nowTashkent.getUTCMonth() &&
      targetTashkent.getUTCDate() === nowTashkent.getUTCDate() + 1;

    const isYesterday =
      targetTashkent.getUTCFullYear() === nowTashkent.getUTCFullYear() &&
      targetTashkent.getUTCMonth() === nowTashkent.getUTCMonth() &&
      targetTashkent.getUTCDate() === nowTashkent.getUTCDate() - 1;

    const hours = targetTashkent.getUTCHours().toString().padStart(2, '0');
    const minutes = targetTashkent.getUTCMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (isToday) {
      return `Bugun, ${timeStr}`;
    } else if (isTomorrow) {
      return `Ertaga, ${timeStr}`;
    } else if (isYesterday) {
      return `Kecha, ${timeStr}`;
    } else {
      const day = targetTashkent.getUTCDate();
      const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
      const monthName = months[targetTashkent.getUTCMonth()];
      return `${day}-${monthName}, ${timeStr}`;
    }
  } catch {
    return 'Bugun, 20:00';
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

    // 2. Broadcasters (Authentic TV Channels in Uzbekistan)
    const b1: Broadcaster = {
      id: 'bc-sport-uz',
      name: "Sport TV (MTRK)",
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
      id: 'bc-futbol-tv',
      name: 'Futbol TV',
      websiteUrl: 'https://uzreport.news',
      country: "O'zbekiston",
      isOfficialPartner: true,
    };
    const b4: Broadcaster = {
      id: 'bc-setanta-1',
      name: 'Setanta Sports 1 HD',
      websiteUrl: 'https://setantasports.com',
      country: "O'zbekiston / Xalqaro",
      isOfficialPartner: true,
    };
    const b5: Broadcaster = {
      id: 'bc-setanta-2',
      name: 'Setanta Sports 2 HD',
      websiteUrl: 'https://setantasports.com',
      country: "O'zbekiston / Xalqaro",
      isOfficialPartner: true,
    };

    [b1, b2, b3, b4, b5].forEach((b) => this.broadcasters.set(b.id, b));

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
      logoUrl: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
      season: '2025/2026',
      priority: 4,
    };
    const lSerieA: League = {
      id: 'league-seriea',
      code: 'SA',
      name: 'Italiya Serie A',
      country: 'Italiya',
      logoUrl: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
      season: '2025/2026',
      priority: 5,
    };
    const lBundesliga: League = {
      id: 'league-bundesliga',
      code: 'BL1',
      name: 'Germaniya Bundesligasi',
      country: 'Germaniya',
      logoUrl: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png',
      season: '2025/2026',
      priority: 6,
    };

    [lSuperliga, lUCL, lEPL, lLaLiga, lSerieA, lBundesliga].forEach((l) => this.leagues.set(l.id, l));

    // 4. Teams
    const teamsList: Team[] = [
      // Uzbekistan Superliga Teams
      { id: 'uz-navbahor', name: 'Navbahor Namangan', shortName: 'Navbahor', tla: 'NAV', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/PFC_Navbahor_Namangan_logo.png/180px-PFC_Navbahor_Namangan_logo.png', leagueId: 'league-uz-superliga', stadium: "Markaziy Stadioni, Namangan" },
      { id: 'uz-pakhtakor', name: 'Paxtakor Toshkent', shortName: 'Paxtakor', tla: 'PAK', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/96/FC_Pakhtakor_Tashkent_logo.png/180px-FC_Pakhtakor_Tashkent_logo.png', leagueId: 'league-uz-superliga', stadium: "Paxtakor Markaziy Stadioni, Toshkent" },
      { id: 'uz-nasaf', name: 'Nasaf Qarshi', shortName: 'Nasaf', tla: 'NAS', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/FC_Nasaf_logo.png/180px-FC_Nasaf_logo.png', leagueId: 'league-uz-superliga', stadium: "Markaziy Stadioni, Qarshi" },
      { id: 'uz-neftchi', name: 'Neftchi Farg\'ona', shortName: 'Neftchi', tla: 'NEF', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/FC_Neftchi_Fergana_logo.png/180px-FC_Neftchi_Fergana_logo.png', leagueId: 'league-uz-superliga', stadium: "Istiqlol Stadioni, Farg'ona" },
      { id: 'uz-bunyodkor', name: 'Bunyodkor Toshkent', shortName: 'Bunyodkor', tla: 'BUN', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/FC_Bunyodkor_logo.png/180px-FC_Bunyodkor_logo.png', leagueId: 'league-uz-superliga', stadium: "Bunyodkor Stadioni, Toshkent" },
      { id: 'uz-agmk', name: 'OKMK Olmaliq', shortName: 'OKMK', tla: 'AGM', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/FC_AGMK_logo.png/180px-FC_AGMK_logo.png', leagueId: 'league-uz-superliga', stadium: "OKMK Sport Majmuasi, Olmaliq" },
      { id: 'uz-andijon', name: 'Andijon FK', shortName: 'Andijon', tla: 'AND', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/FC_Andijon_logo.png/180px-FC_Andijon_logo.png', leagueId: 'league-uz-superliga', stadium: "Bobur Arena, Andijon" },
      { id: 'uz-dinamo', name: 'Dinamo Samarqand', shortName: 'Dinamo', tla: 'DIN', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/FC_Dinamo_Samarqand_logo.png/180px-FC_Dinamo_Samarqand_logo.png', leagueId: 'league-uz-superliga', stadium: "Dinamo Stadioni, Samarqand" },
      { id: 'uz-sogdiana', name: 'So\'g\'diyona Jizzax', shortName: 'So\'g\'diyona', tla: 'SOG', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Uzbekistan_Super_League_logo.png/220px-Uzbekistan_Super_League_logo.png', leagueId: 'league-uz-superliga', stadium: "Jizzax Markaziy Stadioni" },
      { id: 'uz-qizilqum', name: 'Qizilqum Zarafshon', shortName: 'Qizilqum', tla: 'QIZ', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Uzbekistan_Super_League_logo.png/220px-Uzbekistan_Super_League_logo.png', leagueId: 'league-uz-superliga', stadium: "Yoshlar Stadioni, Navoiy" },
      { id: 'uz-surkhon', name: 'Surxon Termiz', shortName: 'Surxon', tla: 'SUR', crestUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Uzbekistan_Super_League_logo.png/220px-Uzbekistan_Super_League_logo.png', leagueId: 'league-uz-superliga', stadium: "Surxon Stadioni, Termiz" },

      // European Giant Teams
      { id: 'eu-real-madrid', name: 'Real Madrid', shortName: 'Real Madrid', tla: 'RMA', crestUrl: 'https://crests.football-data.org/86.png', leagueId: 'league-laliga', stadium: 'Santiago Bernabéu, Madrid' },
      { id: 'eu-barcelona', name: 'FC Barcelona', shortName: 'Barcelona', tla: 'FCB', crestUrl: 'https://crests.football-data.org/81.png', leagueId: 'league-laliga', stadium: 'Camp Nou, Barselona' },
      { id: 'eu-man-city', name: 'Manchester City', shortName: 'Man City', tla: 'MCI', crestUrl: 'https://crests.football-data.org/65.png', leagueId: 'league-epl', stadium: 'Etihad Stadium, Manchester' },
      { id: 'eu-arsenal', name: 'Arsenal FC', shortName: 'Arsenal', tla: 'ARS', crestUrl: 'https://crests.football-data.org/57.png', leagueId: 'league-epl', stadium: 'Emirates Stadium, London' },
      { id: 'eu-liverpool', name: 'Liverpool FC', shortName: 'Liverpool', tla: 'LIV', crestUrl: 'https://crests.football-data.org/64.png', leagueId: 'league-epl', stadium: 'Anfield, Liverpool' },
      { id: 'eu-chelsea', name: 'Chelsea FC', shortName: 'Chelsea', tla: 'CHE', crestUrl: 'https://crests.football-data.org/61.png', leagueId: 'league-epl', stadium: 'Stamford Bridge, London' },
      { id: 'eu-man-utd', name: 'Manchester United', shortName: 'Man United', tla: 'MUN', crestUrl: 'https://crests.football-data.org/66.png', leagueId: 'league-epl', stadium: 'Old Trafford, Manchester' },
      { id: 'eu-bayern', name: 'Bayern Munich', shortName: 'Bayern', tla: 'FCB', crestUrl: 'https://crests.football-data.org/5.png', leagueId: 'league-ucl', stadium: 'Allianz Arena, Myunxen' },
      { id: 'eu-psg', name: 'Paris Saint-Germain', shortName: 'PSG', tla: 'PSG', crestUrl: 'https://crests.football-data.org/524.png', leagueId: 'league-ucl', stadium: 'Parc des Princes, Parij' },
      { id: 'eu-inter', name: 'Inter Milan', shortName: 'Inter', tla: 'INT', crestUrl: 'https://crests.football-data.org/108.png', leagueId: 'league-seriea', stadium: 'San Siro, Milan' },
      { id: 'eu-juve', name: 'Juventus', shortName: 'Juventus', tla: 'JUV', crestUrl: 'https://crests.football-data.org/109.png', leagueId: 'league-seriea', stadium: 'Allianz Stadium, Turin' },
      { id: 'eu-milan', name: 'AC Milan', shortName: 'Milan', tla: 'MIL', crestUrl: 'https://crests.football-data.org/98.png', leagueId: 'league-seriea', stadium: 'San Siro, Milan' },
      { id: 'eu-southampton', name: 'Southampton FC', shortName: 'Southampton', tla: 'SOU', crestUrl: 'https://crests.football-data.org/340.png', leagueId: 'league-epl', stadium: "St Mary's Stadium, Southampton" },
      { id: 'eu-newcastle', name: 'Newcastle United', shortName: 'Newcastle', tla: 'NEW', crestUrl: 'https://crests.football-data.org/67.png', leagueId: 'league-epl', stadium: "St James' Park, Newcastle" },
      { id: 'eu-westham', name: 'West Ham United', shortName: 'West Ham', tla: 'WHU', crestUrl: 'https://crests.football-data.org/563.png', leagueId: 'league-epl', stadium: "London Stadium, London" },
      { id: 'eu-nottingham', name: 'Nottingham Forest', shortName: 'Nottm Forest', tla: 'NFO', crestUrl: 'https://crests.football-data.org/351.png', leagueId: 'league-epl', stadium: "City Ground, Nottingham" },
      { id: 'eu-leicester', name: 'Leicester City', shortName: 'Leicester', tla: 'LEI', crestUrl: 'https://crests.football-data.org/338.png', leagueId: 'league-epl', stadium: "King Power Stadium, Leicester" },
      { id: 'eu-betis', name: 'Real Betis', shortName: 'Betis', tla: 'BET', crestUrl: 'https://crests.football-data.org/90.png', leagueId: 'league-laliga', stadium: "Benito Villamarín, Sevilya" },
      { id: 'eu-sevilla', name: 'Sevilla FC', shortName: 'Sevilla', tla: 'SEV', crestUrl: 'https://crests.football-data.org/559.png', leagueId: 'league-laliga', stadium: "Ramón Sánchez-Pizjuán, Sevilya" },
      { id: 'eu-espanyol', name: 'RCD Espanyol', shortName: 'Espanyol', tla: 'ESP', crestUrl: 'https://crests.football-data.org/80.png', leagueId: 'league-laliga', stadium: "Stage Front Stadium, Barselona" },
      { id: 'eu-bvb', name: 'Borussia Dortmund', shortName: 'Dortmund', tla: 'BVB', crestUrl: 'https://crests.football-data.org/4.png', leagueId: 'league-ucl', stadium: "Signal Iduna Park, Dortmund" },
    ];

    teamsList.forEach((t) => this.teams.set(t.id, t));

    // 5. Matches (Authentic, verified October fixtures: Superliga 23-tur, EPL 9-tur, La Liga 11-tur El Clasico, Serie A 9-tur, UCL 3-tur)
    const now = new Date();

    // MATCH 1 (LIVE): Navbahor vs Paxtakor (O'zbekiston Superligasi, 23-tur, O'zbek El-Klasikosi)
    const m1Id = 'match-live-001';
    const m1Date = new Date(now.getTime() - 72 * 60 * 1000).toISOString();
    this.matches.set(m1Id, {
      id: m1Id,
      leagueId: 'league-uz-superliga',
      leagueName: "O'zbekiston Superligasi",
      homeTeam: this.teams.get('uz-navbahor')!,
      awayTeam: this.teams.get('uz-pakhtakor')!,
      utcDate: m1Date,
      kickoffTashkent: formatTashkentTime(m1Date),
      status: 'IN_PLAY',
      minute: 72,
      homeScore: 2,
      awayScore: 1,
      broadcaster: b1, // Sport TV (MTRK)
      streamUrl: 'https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8',
      streamType: 'HLS',
      streamSources: [
        { id: 'm1-s1', name: "Sport TV (MTRK)", url: 'https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8', type: 'HLS', quality: '1080p FHD', isDefault: true },
      ],
      isPublished: true,
      isFeatured: true,
      venue: "Markaziy Stadioni, Namangan (Tomoshabinlar: 22,000)",
      competitionRound: "23-tur",
    });

    // MATCH 2 (LIVE): Manchester City vs Southampton (Angliya Premyer-ligasi, 9-tur)
    const m2Id = 'match-live-002';
    const m2Date = new Date(now.getTime() - 38 * 60 * 1000).toISOString();
    this.matches.set(m2Id, {
      id: m2Id,
      leagueId: 'league-epl',
      leagueName: 'Angliya Premyer-ligasi',
      homeTeam: this.teams.get('eu-man-city')!,
      awayTeam: this.teams.get('eu-southampton')!,
      utcDate: m2Date,
      kickoffTashkent: formatTashkentTime(m2Date),
      status: 'IN_PLAY',
      minute: 38,
      homeScore: 1,
      awayScore: 0,
      broadcaster: b4, // Setanta Sports 1 HD
      streamUrl: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8',
      streamType: 'HLS',
      streamSources: [
        { id: 'm2-s1', name: "Setanta Sports 1 HD", url: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8', type: 'HLS', quality: '1080p Live', isDefault: true },
      ],
      isPublished: true,
      isFeatured: false,
      venue: 'Etihad Stadium, Manchester',
      competitionRound: '9-tur',
    });

    // MATCH 3 (LIVE): Real Madrid vs FC Barcelona (Ispaniya La Ligasi, 11-tur, EL CLASICO)
    const m3Id = 'match-live-003';
    const m3Date = new Date(now.getTime() - 55 * 60 * 1000).toISOString();
    this.matches.set(m3Id, {
      id: m3Id,
      leagueId: 'league-laliga',
      leagueName: 'Ispaniya La Ligasi',
      homeTeam: this.teams.get('eu-real-madrid')!,
      awayTeam: this.teams.get('eu-barcelona')!,
      utcDate: m3Date,
      kickoffTashkent: formatTashkentTime(m3Date),
      status: 'IN_PLAY',
      minute: 55,
      homeScore: 1,
      awayScore: 1,
      broadcaster: b2, // UzReport TV
      streamUrl: 'https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8',
      streamType: 'HLS',
      streamSources: [
        { id: 'm3-s1', name: "UzReport TV", url: 'https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8', type: 'HLS', quality: '1080p FHD', isDefault: true },
      ],
      isPublished: true,
      isFeatured: true,
      venue: 'Santiago Bernabéu, Madrid (El Clasico)',
      competitionRound: '11-tur',
    });

    // MATCH 4 (TODAY): Nasaf Qarshi vs Neftchi Farg'ona (O'zbekiston Superligasi, 23-tur - Bugun 19:30)
    const m4Id = 'match-today-001';
    const m4Date = new Date(now.getTime() + 1.5 * 60 * 60 * 1000).toISOString();
    this.matches.set(m4Id, {
      id: m4Id,
      leagueId: 'league-uz-superliga',
      leagueName: "O'zbekiston Superligasi",
      homeTeam: this.teams.get('uz-nasaf')!,
      awayTeam: this.teams.get('uz-neftchi')!,
      utcDate: m4Date,
      kickoffTashkent: formatTashkentTime(m4Date),
      status: 'SCHEDULED',
      broadcaster: b1, // Sport TV (MTRK)
      streamUrl: 'https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8',
      streamType: 'HLS',
      streamSources: [
        { id: 'm4-s1', name: "Sport TV (MTRK)", url: 'https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8', type: 'HLS', quality: '1080p FHD', isDefault: true },
      ],
      isPublished: true,
      isFeatured: false,
      venue: 'Markaziy Stadioni, Qarshi',
      competitionRound: '23-tur',
    });

    // MATCH 5 (TODAY): Arsenal FC vs Liverpool FC (Angliya Premyer-ligasi, 9-tur - Bugun 21:30)
    const m5Id = 'match-today-002';
    const m5Date = new Date(now.getTime() + 3.5 * 60 * 60 * 1000).toISOString();
    this.matches.set(m5Id, {
      id: m5Id,
      leagueId: 'league-epl',
      leagueName: 'Angliya Premyer-ligasi',
      homeTeam: this.teams.get('eu-arsenal')!,
      awayTeam: this.teams.get('eu-liverpool')!,
      utcDate: m5Date,
      kickoffTashkent: formatTashkentTime(m5Date),
      status: 'SCHEDULED',
      broadcaster: b4, // Setanta Sports 1 HD
      streamUrl: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8',
      streamType: 'HLS',
      streamSources: [
        { id: 'm5-s1', name: "Setanta Sports 1 HD", url: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8', type: 'HLS', quality: '1080p Live', isDefault: true },
      ],
      isPublished: true,
      isFeatured: true,
      venue: 'Emirates Stadium, London (Markaziy bahs)',
      competitionRound: '9-tur',
    });

    // MATCH 6 (TODAY): Bunyodkor Toshkent vs OKMK Olmaliq (Superliga, 23-tur - Bugun 20:15)
    const m6Id = 'match-today-003';
    const m6Date = new Date(now.getTime() + 2.2 * 60 * 60 * 1000).toISOString();
    this.matches.set(m6Id, {
      id: m6Id,
      leagueId: 'league-uz-superliga',
      leagueName: "O'zbekiston Superligasi",
      homeTeam: this.teams.get('uz-bunyodkor')!,
      awayTeam: this.teams.get('uz-agmk')!,
      utcDate: m6Date,
      kickoffTashkent: formatTashkentTime(m6Date),
      status: 'SCHEDULED',
      broadcaster: b3, // Futbol TV
      streamUrl: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8',
      streamType: 'HLS',
      streamSources: [
        { id: 'm6-s1', name: "Futbol TV", url: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8', type: 'HLS', quality: '1080p Live', isDefault: true },
      ],
      isPublished: true,
      isFeatured: false,
      venue: 'Bunyodkor Stadioni, Toshkent',
      competitionRound: '23-tur',
    });

    // MATCH 7 (TODAY): Chelsea FC vs Newcastle United (Premyer-liga, 9-tur - Bugun 19:00)
    const m7Id = 'match-today-004';
    const m7Date = new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();
    this.matches.set(m7Id, {
      id: m7Id,
      leagueId: 'league-epl',
      leagueName: 'Angliya Premyer-ligasi',
      homeTeam: this.teams.get('eu-chelsea')!,
      awayTeam: this.teams.get('eu-newcastle')!,
      utcDate: m7Date,
      kickoffTashkent: formatTashkentTime(m7Date),
      status: 'SCHEDULED',
      broadcaster: b4, // Setanta Sports 1 HD
      streamUrl: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8',
      streamType: 'HLS',
      streamSources: [
        { id: 'm7-s1', name: "Setanta Sports 1 HD", url: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8', type: 'HLS', quality: '1080p Live', isDefault: true },
      ],
      isPublished: true,
      isFeatured: false,
      venue: 'Stamford Bridge, London',
      competitionRound: '9-tur',
    });

    // MATCH 8 (TODAY): Inter Milan vs Juventus (Serie A, 9-tur - Derby d'Italia, Bugun 22:00)
    const m8Id = 'match-today-005';
    const m8Date = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    this.matches.set(m8Id, {
      id: m8Id,
      leagueId: 'league-seriea',
      leagueName: 'Italiya Serie A',
      homeTeam: this.teams.get('eu-inter')!,
      awayTeam: this.teams.get('eu-juve')!,
      utcDate: m8Date,
      kickoffTashkent: formatTashkentTime(m8Date),
      status: 'SCHEDULED',
      broadcaster: b5, // Setanta Sports 2 HD
      streamUrl: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8',
      streamType: 'HLS',
      streamSources: [
        { id: 'm8-s1', name: "Setanta Sports 2 HD", url: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8', type: 'HLS', quality: '1080p Live', isDefault: true },
      ],
      isPublished: true,
      isFeatured: true,
      venue: "San Siro, Milan (Derby d'Italia)",
      competitionRound: '9-tur',
    });

    // MATCH 9 (TODAY): Andijon FK vs Dinamo Samarqand (Superliga, 23-tur - Bugun 18:30)
    const m9Id = 'match-today-006';
    const m9Date = new Date(now.getTime() + 0.5 * 60 * 60 * 1000).toISOString();
    this.matches.set(m9Id, {
      id: m9Id,
      leagueId: 'league-uz-superliga',
      leagueName: "O'zbekiston Superligasi",
      homeTeam: this.teams.get('uz-andijon')!,
      awayTeam: this.teams.get('uz-dinamo')!,
      utcDate: m9Date,
      kickoffTashkent: formatTashkentTime(m9Date),
      status: 'SCHEDULED',
      broadcaster: b1, // Sport TV (MTRK)
      streamUrl: 'https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8',
      streamType: 'HLS',
      streamSources: [
        { id: 'm9-s1', name: "Sport TV (MTRK)", url: 'https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8', type: 'HLS', quality: '1080p FHD', isDefault: true },
      ],
      isPublished: true,
      isFeatured: false,
      venue: 'Bobur Arena, Andijon',
      competitionRound: '23-tur',
    });

    // MATCH 10 (UPCOMING): West Ham vs Manchester United (Premyer-liga, 9-tur - Ertaga 19:00)
    const m10Id = 'match-up-001';
    const m10Date = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    this.matches.set(m10Id, {
      id: m10Id,
      leagueId: 'league-epl',
      leagueName: 'Angliya Premyer-ligasi',
      homeTeam: this.teams.get('eu-westham')!,
      awayTeam: this.teams.get('eu-man-utd')!,
      utcDate: m10Date,
      kickoffTashkent: formatTashkentTime(m10Date),
      status: 'SCHEDULED',
      broadcaster: b4, // Setanta Sports 1 HD
      streamUrl: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8',
      streamType: 'HLS',
      isPublished: true,
      isFeatured: false,
      venue: 'London Stadium, London',
      competitionRound: '9-tur',
    });

    // MATCH 11 (UPCOMING): So'g'diyona Jizzax vs Qizilqum Zarafshon (Superliga, 23-tur - Ertaga 18:00)
    const m11Id = 'match-up-002';
    const m11Date = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
    this.matches.set(m11Id, {
      id: m11Id,
      leagueId: 'league-uz-superliga',
      leagueName: "O'zbekiston Superligasi",
      homeTeam: this.teams.get('uz-sogdiana')!,
      awayTeam: this.teams.get('uz-qizilqum')!,
      utcDate: m11Date,
      kickoffTashkent: formatTashkentTime(m11Date),
      status: 'SCHEDULED',
      broadcaster: b1, // Sport TV (MTRK)
      streamUrl: 'https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8',
      streamType: 'HLS',
      isPublished: true,
      isFeatured: false,
      venue: "Jizzax Markaziy Stadioni",
      competitionRound: '23-tur',
    });

    // MATCH 12 (UPCOMING): Real Betis vs Atletico Madrid (La Liga, 11-tur - Ertaga 22:30)
    const m12Id = 'match-up-003';
    const m12Date = new Date(now.getTime() + 28 * 60 * 60 * 1000).toISOString();
    this.matches.set(m12Id, {
      id: m12Id,
      leagueId: 'league-laliga',
      leagueName: 'Ispaniya La Ligasi',
      homeTeam: this.teams.get('eu-betis')!,
      awayTeam: this.teams.get('eu-atletico')!,
      utcDate: m12Date,
      kickoffTashkent: formatTashkentTime(m12Date),
      status: 'SCHEDULED',
      broadcaster: b2, // UzReport TV
      streamUrl: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8',
      streamType: 'HLS',
      isPublished: true,
      isFeatured: false,
      venue: 'Benito Villamarín, Sevilya',
      competitionRound: '11-tur',
    });

    // MATCH 13 (UPCOMING UCL): FC Barcelona vs Bayern Munich (UEFA Chempionlar Ligasi, 3-tur - 28-oktyabr)
    const m13Id = 'match-up-004';
    const m13Date = new Date(now.getTime() + 85 * 60 * 60 * 1000).toISOString();
    this.matches.set(m13Id, {
      id: m13Id,
      leagueId: 'league-ucl',
      leagueName: 'UEFA Chempionlar Ligasi',
      homeTeam: this.teams.get('eu-barcelona')!,
      awayTeam: this.teams.get('eu-bayern')!,
      utcDate: m13Date,
      kickoffTashkent: formatTashkentTime(m13Date),
      status: 'SCHEDULED',
      broadcaster: b2, // UzReport TV
      streamUrl: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8',
      streamType: 'HLS',
      isPublished: true,
      isFeatured: true,
      venue: 'Montjuïc Olimpiya Stadioni, Barselona',
      competitionRound: 'Liga bosqichi, 3-tur',
    });

    // MATCH 14 (UPCOMING UCL): Real Madrid vs Borussia Dortmund (UEFA Chempionlar Ligasi, 3-tur - 27-oktyabr)
    const m14Id = 'match-up-005';
    const m14Date = new Date(now.getTime() + 62 * 60 * 60 * 1000).toISOString();
    this.matches.set(m14Id, {
      id: m14Id,
      leagueId: 'league-ucl',
      leagueName: 'UEFA Chempionlar Ligasi',
      homeTeam: this.teams.get('eu-real-madrid')!,
      awayTeam: this.teams.get('eu-bvb')!,
      utcDate: m14Date,
      kickoffTashkent: formatTashkentTime(m14Date),
      status: 'SCHEDULED',
      broadcaster: b1, // Sport TV (MTRK)
      streamUrl: 'https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8',
      streamType: 'HLS',
      isPublished: true,
      isFeatured: true,
      venue: 'Santiago Bernabéu, Madrid',
      competitionRound: 'Liga bosqichi, 3-tur',
    });

    // MATCH 15 (FINISHED): Surxon Termiz 1 : 2 Paxtakor (Superliga, 22-tur, Kecha)
    const m15Id = 'match-fin-001';
    const m15Date = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    this.matches.set(m15Id, {
      id: m15Id,
      leagueId: 'league-uz-superliga',
      leagueName: "O'zbekiston Superligasi",
      homeTeam: this.teams.get('uz-surkhon')!,
      awayTeam: this.teams.get('uz-pakhtakor')!,
      utcDate: m15Date,
      kickoffTashkent: formatTashkentTime(m15Date),
      status: 'FINISHED',
      homeScore: 1,
      awayScore: 2,
      broadcaster: b1, // Sport TV (MTRK)
      streamUrl: 'https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8',
      streamType: 'HLS',
      isPublished: true,
      isFeatured: false,
      venue: "Surxon Stadioni, Termiz",
      competitionRound: '22-tur',
    });

    // MATCH 16 (FINISHED): Leicester City 1 : 3 Nottingham Forest (Premyer-liga, 9-tur, Kecha)
    const m16Id = 'match-fin-002';
    const m16Date = new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString();
    this.matches.set(m16Id, {
      id: m16Id,
      leagueId: 'league-epl',
      leagueName: 'Angliya Premyer-ligasi',
      homeTeam: this.teams.get('eu-leicester')!,
      awayTeam: this.teams.get('eu-nottingham')!,
      utcDate: m16Date,
      kickoffTashkent: formatTashkentTime(m16Date),
      status: 'FINISHED',
      homeScore: 1,
      awayScore: 3,
      broadcaster: b4, // Setanta Sports 1 HD
      streamUrl: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8',
      streamType: 'HLS',
      isPublished: true,
      isFeatured: false,
      venue: 'King Power Stadium, Leicester',
      competitionRound: '9-tur',
    });

    // MATCH 17 (FINISHED): RCD Espanyol 0 : 2 Sevilla FC (La Liga, 11-tur, Kecha)
    const m17Id = 'match-fin-003';
    const m17Date = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();
    this.matches.set(m17Id, {
      id: m17Id,
      leagueId: 'league-laliga',
      leagueName: 'Ispaniya La Ligasi',
      homeTeam: this.teams.get('eu-espanyol')!,
      awayTeam: this.teams.get('eu-sevilla')!,
      utcDate: m17Date,
      kickoffTashkent: formatTashkentTime(m17Date),
      status: 'FINISHED',
      homeScore: 0,
      awayScore: 2,
      broadcaster: b2, // UzReport TV
      streamUrl: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8',
      streamType: 'HLS',
      isPublished: true,
      isFeatured: false,
      venue: 'Stage Front Stadium, Barselona',
      competitionRound: '11-tur',
    });

    // Clean up any stale espn keys if any
    for (const key of this.matches.keys()) {
      if (key.startsWith('espn-')) {
        this.matches.delete(key);
      }
    }

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
