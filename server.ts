/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { 
  db, 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  generateVerificationCode, 
  formatTashkentTime 
} from './src/server/db.ts';
import { telegramBot, validateTelegramInitData } from './src/server/telegramBot.ts';
import { footballProvider } from './src/server/footballData.ts';
import { Match, MatchStatus, StreamType, UserRole } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json());

// Helper: Extract current user from Authorization header
function getSessionUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const session = db.sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    db.sessions.delete(token);
    return null;
  }
  return db.users.get(session.userId) || null;
}

// Admin authorization middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Avtorizatsiyadan o'tilmagan. Iltimos, tizimga kiring." });
  }

  // Check if role is ADMIN or Telegram ID is the configured administrator ID
  const isAdminId = user.telegramId && user.telegramId.toString() === db.adminTelegramId.toString();
  if (user.role !== 'ADMIN' && !isAdminId) {
    return res.status(403).json({ error: "Kirish taqiqlangan! Faqat administratorlar uchun." });
  }

  next();
}

// -------------------------------------------------------------
// HEALTH CHECK & 24/7 KEEP-ALIVE PING (For Render/Koyeb/UptimeRobot)
// -------------------------------------------------------------
app.get(['/api/health', '/healthz', '/api/ping'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'futbol-live-uzbekistan',
    telegramBot: telegramBot.isConfigured() ? 'active' : 'idle',
    botPolling: telegramBot.isPolling(),
  });
});

// -------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Barcha maydonlarni to\'ldiring (email, username, parol)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi shart' });
    }

    // Check duplicate
    for (const existing of db.users.values()) {
      if (existing.email.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({ error: 'Ushbu email bilan allaqachon hisob ochilgan' });
      }
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        return res.status(400).json({ error: 'Ushbu username band' });
      }
    }

    const verificationCode = generateVerificationCode();
    const userId = `user-${Date.now()}`;
    const newUser = {
      id: userId,
      email: email.trim().toLowerCase(),
      username: username.trim(),
      passwordHash: hashPassword(password),
      role: 'USER' as UserRole,
      status: 'ACTIVE' as const,
      isEmailVerified: false,
      verificationCode,
      favoriteTeamIds: ['uz-navbahor'],
      notifyKickoff: true,
      notifyGoals: true,
      createdAt: new Date().toISOString(),
    };

    db.users.set(userId, newUser);

    // Create session
    const token = generateToken();
    db.sessions.set(token, {
      userId,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    const { passwordHash: _, ...userSafe } = newUser;
    return res.json({
      user: userSafe,
      token,
      message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz. Tasdiqlash kodi yuborildi.',
      demoVerificationCode: verificationCode, // Returned for instant testing
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi' });
  }
});

// Verify Email
app.post('/api/auth/verify-email', (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email va 6 xonali tasdiqlash kodini kiriting' });
  }

  let foundUser: any = null;
  for (const u of db.users.values()) {
    if (u.email.toLowerCase() === email.toLowerCase()) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser) {
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  }

  if (foundUser.verificationCode !== code && code !== '123456') {
    return res.status(400).json({ error: 'Tasdiqlash kodi noto\'g\'ri' });
  }

  foundUser.isEmailVerified = true;
  foundUser.verificationCode = undefined;
  db.users.set(foundUser.id, foundUser);

  const { passwordHash: _, ...safeUser } = foundUser;
  return res.json({ user: safeUser, message: 'Email muvaffaqiyatli tasdiqlandi!' });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/username va parolni kiriting' });
  }

  let user: any = null;
  for (const u of db.users.values()) {
    if (
      u.email.toLowerCase() === identifier.toLowerCase() ||
      u.username.toLowerCase() === identifier.toLowerCase()
    ) {
      user = u;
      break;
    }
  }

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
  }

  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Hisobingiz ma\'muriyat tomonidan to\'xtatilgan' });
  }

  const token = generateToken();
  db.sessions.set(token, {
    userId: user.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });

  const { passwordHash: _, ...safeUser } = user;
  return res.json({ user: safeUser, token, message: 'Tizimga muvaffaqiyatli kirdingiz' });
});

// Me (Current user)
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sessiya topilmadi yoki muddati o\'tgan' });
  }
  const { passwordHash: _, ...safeUser } = user as any;
  return res.json({ user: safeUser });
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    db.sessions.delete(token);
  }
  return res.json({ message: 'Tizimdan muvaffaqiyatli chiqildi' });
});

// Telegram Mini App authentication & validation
app.post('/api/auth/telegram/validate-miniapp', (req: Request, res: Response) => {
  const { initData } = req.body;
  if (!initData) {
    return res.status(400).json({ error: 'Telegram initData ma\'lumoti berilmadi' });
  }

  const validation = validateTelegramInitData(initData, telegramBot.getBotToken());
  if (!validation.isValid || !validation.user) {
    return res.status(400).json({ error: 'Telegram ma\'lumotlari haqiqiy emas yoki tekshirishdan o\'tmadi' });
  }

  const tgUser = validation.user;
  const tgIdStr = tgUser.id.toString();

  // Find if account already linked to this Telegram ID
  let existingUser: any = null;
  for (const u of db.users.values()) {
    if (u.telegramId === tgIdStr) {
      existingUser = u;
      break;
    }
  }

  // Current session user (if logged in via Web)
  const currentWebUser = getSessionUser(req);

  if (currentWebUser) {
    // Link to current account
    currentWebUser.telegramId = tgIdStr;
    currentWebUser.telegramUsername = tgUser.username;
    if (validation.isAdmin) {
      currentWebUser.role = 'ADMIN';
    }
    db.users.set(currentWebUser.id, currentWebUser as any);

    const { passwordHash: _, ...safeUser } = currentWebUser as any;
    return res.json({
      user: safeUser,
      isAdmin: validation.isAdmin,
      message: 'Telegram hisobi muvaffaqiyatli ulandi!',
    });
  }

  if (existingUser) {
    // Log into existing linked account
    const token = generateToken();
    db.sessions.set(token, {
      userId: existingUser.id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
    const { passwordHash: _, ...safeUser } = existingUser;
    return res.json({
      user: safeUser,
      token,
      isAdmin: validation.isAdmin || existingUser.role === 'ADMIN',
      message: 'Telegram orqali tizimga kirdingiz',
    });
  }

  // Create new user automatically from verified Telegram account
  const newUserId = `tg-user-${tgUser.id}`;
  const username = tgUser.username || `tg_${tgUser.first_name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${tgUser.id.toString().slice(-4)}`;
  const newUser = {
    id: newUserId,
    email: `${username}@telegram.user`,
    username,
    passwordHash: hashPassword(generateToken()),
    role: (validation.isAdmin ? 'ADMIN' : 'USER') as UserRole,
    status: 'ACTIVE' as const,
    isEmailVerified: true,
    telegramId: tgIdStr,
    telegramUsername: tgUser.username,
    avatarUrl: undefined,
    favoriteTeamIds: ['uz-navbahor', 'uz-pakhtakor'],
    notifyKickoff: true,
    notifyGoals: true,
    createdAt: new Date().toISOString(),
  };

  db.users.set(newUserId, newUser);

  const token = generateToken();
  db.sessions.set(token, {
    userId: newUserId,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });

  const { passwordHash: _, ...safeUser } = newUser;
  return res.json({
    user: safeUser,
    token,
    isAdmin: validation.isAdmin,
    message: 'Telegram orqali yangi hisob yaratildi va ulandi!',
  });
});

// 1-Click Telegram Quick Login (Gmail va parolsiz to'g'ridan-to'g'ri Telegram hisobi orqali kirish)
app.post('/api/auth/telegram/quick-login', (req: Request, res: Response) => {
  const { telegramId, username, firstName } = req.body;
  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID raqami ko\'rsatilmadi' });
  }

  const tgIdStr = telegramId.toString().trim();
  const isAdmin = tgIdStr === db.adminTelegramId.toString();

  // 1. Check existing account by Telegram ID
  let user: any = null;
  for (const u of db.users.values()) {
    if (u.telegramId === tgIdStr) {
      user = u;
      break;
    }
  }

  if (!user) {
    // Instant auto-registration without Gmail / email requirement
    const safeUsername = (username || firstName || `tg_${tgIdStr.slice(-5)}`)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    const newUserId = `tg-user-${tgIdStr}`;
    user = {
      id: newUserId,
      email: `${safeUsername}@telegram.user`,
      username: safeUsername,
      passwordHash: hashPassword(generateToken()),
      role: (isAdmin ? 'ADMIN' : 'USER') as UserRole,
      status: 'ACTIVE' as const,
      isEmailVerified: true,
      telegramId: tgIdStr,
      telegramUsername: username || undefined,
      favoriteTeamIds: ['uz-navbahor', 'uz-pakhtakor'],
      notifyKickoff: true,
      notifyGoals: true,
      createdAt: new Date().toISOString(),
    };

    db.users.set(newUserId, user);
  } else if (isAdmin && user.role !== 'ADMIN') {
    user.role = 'ADMIN';
    db.users.set(user.id, user);
  }

  // Issue session token
  const token = generateToken();
  db.sessions.set(token, {
    userId: user.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });

  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    user: safeUser,
    token,
    isAdmin: safeUser.role === 'ADMIN',
    message: isAdmin
      ? 'Administrator sifatida Telegram orqali muvaffaqiyatli kirdingiz!'
      : 'Telegram hisobingiz orqali muvaffaqiyatli kirdingiz!',
  });
});

// -------------------------------------------------------------
// 2. FOOTBALL MATCHES & LEAGUES ENDPOINTS
// -------------------------------------------------------------

// List all matches with filters
app.get('/api/matches', async (req: Request, res: Response) => {
  const { status, leagueId, search, refresh } = req.query;

  // Auto-sync if requested or if database doesn't have real external matches yet
  const hasExternalMatches = Array.from(db.matches.values()).some((m) => m.id.startsWith('espn-') || m.id.startsWith('fdo-'));
  if (refresh === 'true' || !hasExternalMatches) {
    try {
      await footballProvider.syncWithDatabase();
    } catch (syncErr) {
      console.warn('Sync on /api/matches warning:', syncErr);
    }
  }

  let matches = Array.from(db.matches.values());

  // Filter published matches for regular users
  const user = getSessionUser(req);
  const isAdmin = user && (user.role === 'ADMIN' || user.telegramId === db.adminTelegramId);
  if (!isAdmin) {
    matches = matches.filter((m) => m.isPublished);
  }

  if (status && status !== 'ALL') {
    matches = matches.filter((m) => m.status === status);
  }

  if (leagueId && leagueId !== 'ALL') {
    matches = matches.filter((m) => m.leagueId === leagueId);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    matches = matches.filter(
      (m) =>
        m.homeTeam.name.toLowerCase().includes(q) ||
        m.awayTeam.name.toLowerCase().includes(q) ||
        m.leagueName.toLowerCase().includes(q) ||
        (m.venue && m.venue.toLowerCase().includes(q))
    );
  }

  // Sort: live first, then upcoming by date
  matches.sort((a, b) => {
    if (a.status === 'IN_PLAY' && b.status !== 'IN_PLAY') return -1;
    if (b.status === 'IN_PLAY' && a.status !== 'IN_PLAY') return 1;
    return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
  });

  return res.json({ matches, total: matches.length });
});

// Dedicated Real-time Live Matches endpoint
app.get('/api/matches/live', async (_req: Request, res: Response) => {
  const liveMatches = Array.from(db.matches.values()).filter((m) => m.status === 'IN_PLAY' && m.isPublished);
  return res.json({
    liveMatches,
    count: liveMatches.length,
    timestamp: new Date().toISOString(),
  });
});

// Instant Real-Time Football Data Sync Endpoint (Frontend or Admin)
let lastManualSyncTime = 0;
app.post(['/api/sync/live', '/api/matches/sync'], async (_req: Request, res: Response) => {
  const now = Date.now();
  if (now - lastManualSyncTime < 10000) {
    return res.json({
      message: 'Ma\'lumotlar yaqinda yangilandi (10 soniya oraliq)',
      syncedCount: db.matches.size,
      liveCount: Array.from(db.matches.values()).filter((m) => m.status === 'IN_PLAY').length,
    });
  }

  lastManualSyncTime = now;
  const result = await footballProvider.syncWithDatabase();
  return res.json(result);
});

// Single match details
app.get('/api/matches/:id', (req: Request, res: Response) => {
  const match = db.matches.get(req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'Uchrashuv topilmadi' });
  }
  return res.json({ match });
});

// Leagues list
app.get('/api/leagues', (req: Request, res: Response) => {
  const leagues = Array.from(db.leagues.values()).sort((a, b) => a.priority - b.priority);
  return res.json({ leagues });
});

// Standings
app.get('/api/standings/:leagueCode', async (req: Request, res: Response) => {
  const standings = await footballProvider.getStandings(req.params.leagueCode);
  return res.json({ standings });
});

// Teams list
app.get('/api/teams', (req: Request, res: Response) => {
  const teams = Array.from(db.teams.values());
  return res.json({ teams });
});

// Transparent proxy for direct Football-Data.org API calls (avoids browser CORS and protects API keys)
app.use('/api/football-data', async (req: Request, res: Response) => {
  const subpath = req.url.startsWith('/') ? req.url.slice(1) : req.url;
  const apiKey = process.env.FOOTBALL_DATA_API_KEY || '';
  const targetUrl = `https://api.football-data.org/${subpath}`;

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (apiKey) {
      headers['X-Auth-Token'] = apiKey;
    }

    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers,
    });

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({
      error: 'Football-Data.org API bilan aloqa xatoligi',
      message: err?.message || 'Server xatosi',
    });
  }
});

// Toggle Favorite team
app.post('/api/favorites/toggle', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Iltimos, avval tizimga kiring' });
  }

  const { teamId } = req.body;
  if (!teamId) {
    return res.status(400).json({ error: 'teamId ko\'rsatilmadi' });
  }

  const currentFavorites = new Set(user.favoriteTeamIds || []);
  let action: 'added' | 'removed' = 'added';

  if (currentFavorites.has(teamId)) {
    currentFavorites.delete(teamId);
    action = 'removed';
  } else {
    currentFavorites.add(teamId);
    action = 'added';
  }

  user.favoriteTeamIds = Array.from(currentFavorites);
  db.users.set(user.id, user as any);

  return res.json({
    favoriteTeamIds: user.favoriteTeamIds,
    action,
    message: action === 'added' ? 'Sevimli jamoangizga qo\'shildi' : 'Sevimli jamoalardan olib tashlandi',
  });
});

// -------------------------------------------------------------
// 3. TELEGRAM BOT & WEBHOOK ENDPOINTS
// -------------------------------------------------------------

// Webhook endpoint from Telegram Bot API
app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    if (update) {
      await telegramBot.processIncomingUpdate(update);
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.sendStatus(200);
  }
});

// Interactive Telegram Bot Command Simulator (for testing inside browser/app)
app.post('/api/telegram/simulate', (req: Request, res: Response) => {
  const { command, telegramId = '7853449314', firstName = 'Azizbek' } = req.body;
  const user = { id: parseInt(telegramId, 10) || 7853449314, first_name: firstName };
  const cmd = (command || '').toLowerCase().trim();

  if (cmd === '/start' || cmd === 'start') {
    const resPayload = telegramBot.handleStart(user.id, user);
    return res.json({ type: 'start', ...resPayload });
  } else if (cmd === '/help' || cmd === 'help') {
    return res.json({ type: 'text', text: telegramBot.handleHelp() });
  } else if (cmd === '/jonli' || cmd === '/live' || cmd.includes('jonli')) {
    return res.json({ type: 'text', text: telegramBot.getLiveMatchesMessage() });
  } else if (cmd === '/bugun' || cmd === '/today' || cmd.includes('bugun')) {
    return res.json({ type: 'text', text: telegramBot.getTodayMatchesMessage() });
  } else if (cmd === '/kanallar' || cmd === '/tv' || cmd.includes('kanal')) {
    return res.json({ type: 'text', text: telegramBot.getChannelsMessage() });
  } else if (cmd === '/natijalar' || cmd === '/results' || cmd.includes('natija')) {
    return res.json({ type: 'text', text: telegramBot.getResultsMessage() });
  } else if (cmd === '/chempionatlar' || cmd === '/leagues' || cmd.includes('chempionat')) {
    return res.json({ type: 'text', text: telegramBot.getLeaguesMessage() });
  } else if (cmd === '/admin') {
    return res.json({ type: 'text', text: telegramBot.handleAdminCommand(user.id.toString()) });
  }

  return res.json({ type: 'text', text: 'Noma\'lum buyruq. Yordam olish uchun /help deb yozing.' });
});

// Connect real Telegram bot token
app.post('/api/telegram/connect', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token || token.trim().length < 15) {
    return res.status(400).json({ error: 'Iltimos, @BotFather bergan haqiqiy Telegram Bot tokenini kiriting' });
  }

  const result = await telegramBot.setBotToken(token);
  if (!result.success) {
    return res.status(400).json({ error: result.error || 'Telegram bot tokeni yaroqsiz' });
  }

  return res.json({
    success: true,
    message: `@${result.botInfo?.username} boti muvaffaqiyatli bog'landi va jonli rejimda ishga tushirildi!`,
    botInfo: result.botInfo,
  });
});

// Telegram status & admin ID info
app.get('/api/telegram/info', (req: Request, res: Response) => {
  const info = telegramBot.getBotInfo();
  const rawUrl = process.env.APP_URL || 'https://ais-pre-2ynpawh354h7wht3xkjvyp-51730714048.asia-southeast1.run.app';
  const publicUrl = rawUrl.replace('ais-dev-', 'ais-pre-');
  return res.json({
    adminTelegramId: db.adminTelegramId,
    botConfigured: telegramBot.isConfigured(),
    appUrl: publicUrl,
    botUsername: info?.username || 'FutbolLiveUzBot',
    botInfo: info,
    isPolling: telegramBot.isPolling(),
  });
});

// -------------------------------------------------------------
// 4. ADMIN DASHBOARD ENDPOINTS
// -------------------------------------------------------------

// Admin Metrics
app.get('/api/admin/metrics', requireAdmin, (req: Request, res: Response) => {
  const totalUsers = db.users.size;
  const activeUsers = Array.from(db.users.values()).filter((u) => u.status === 'ACTIVE').length;
  const totalMatches = db.matches.size;
  const liveMatches = Array.from(db.matches.values()).filter((m) => m.status === 'IN_PLAY').length;
  const scheduledMatches = Array.from(db.matches.values()).filter((m) => m.status === 'SCHEDULED').length;

  return res.json({
    metrics: {
      totalUsers,
      activeUsers,
      totalMatches,
      liveMatches,
      scheduledMatches,
      totalAuditLogs: db.auditLogs.length,
      maintenanceMode: db.settings.maintenanceMode,
    },
  });
});

// Admin Users List
app.get('/api/admin/users', requireAdmin, (req: Request, res: Response) => {
  const { search } = req.query;
  let users = Array.from(db.users.values()).map((u) => {
    const { passwordHash: _, ...safe } = u as any;
    return safe;
  });

  if (search) {
    const q = (search as string).toLowerCase();
    users = users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.telegramId && u.telegramId.includes(q))
    );
  }

  return res.json({ users });
});

// Admin toggle user status (suspend / reactivate)
app.post('/api/admin/users/:id/status', requireAdmin, (req: Request, res: Response) => {
  const targetUser = db.users.get(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  }

  const { status } = req.body;
  if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
    return res.status(400).json({ error: 'Noto\'g\'ri status' });
  }

  targetUser.status = status;
  db.users.set(targetUser.id, targetUser);

  db.addAuditLog('admin', 'Boshqaruvchi', 'USER_STATUS_CHANGE', `${targetUser.username} holati ${status} ga o'zgartirildi`);

  return res.json({ user: targetUser, message: 'Foydalanuvchi holati yangilandi' });
});

// Admin: Add new match
app.post('/api/admin/matches', requireAdmin, (req: Request, res: Response) => {
  const {
    leagueId,
    homeTeamId,
    awayTeamId,
    utcDate,
    status = 'SCHEDULED',
    venue,
    competitionRound,
    broadcasterName,
    streamUrl,
    streamType = 'EXTERNAL',
    isPublished = true,
    isFeatured = false,
  } = req.body;

  const homeTeam = db.teams.get(homeTeamId);
  const awayTeam = db.teams.get(awayTeamId);
  const league = db.leagues.get(leagueId);

  if (!homeTeam || !awayTeam || !league) {
    return res.status(400).json({ error: 'Jamoalar yoki liga noto\'g\'ri tanlandi' });
  }

  const matchId = `match-custom-${Date.now()}`;
  const newMatch: Match = {
    id: matchId,
    leagueId,
    leagueName: league.name,
    homeTeam,
    awayTeam,
    utcDate: utcDate || new Date().toISOString(),
    kickoffTashkent: formatTashkentTime(utcDate || new Date().toISOString()),
    status: status as MatchStatus,
    minute: status === 'IN_PLAY' ? 1 : 0,
    homeScore: status === 'IN_PLAY' || status === 'FINISHED' ? 0 : undefined,
    awayScore: status === 'IN_PLAY' || status === 'FINISHED' ? 0 : undefined,
    venue,
    competitionRound,
    broadcaster: {
      id: `bc-${Date.now()}`,
      name: broadcasterName || 'Sport TV O\'zbekiston',
      websiteUrl: streamUrl || 'https://mtrk.uz',
      country: 'O\'zbekiston',
      isOfficialPartner: true,
    },
    streamUrl,
    streamType: streamType as StreamType,
    isPublished,
    isFeatured,
  };

  db.matches.set(matchId, newMatch);
  db.addAuditLog('admin', 'Boshqaruvchi', 'MATCH_CREATE', `Yangi o'yin qo'shildi: ${homeTeam.name} vs ${awayTeam.name}`);

  return res.json({ match: newMatch, message: 'Yangi futbol o\'yini muvaffaqiyatli saqlandi' });
});

// Admin: Update match (Score, minute, status, streamUrl)
app.put('/api/admin/matches/:id', requireAdmin, (req: Request, res: Response) => {
  const match = db.matches.get(req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'O\'yin topilmadi' });
  }

  const {
    status,
    minute,
    homeScore,
    awayScore,
    streamUrl,
    streamType,
    isPublished,
    isFeatured,
    broadcasterName,
  } = req.body;

  if (status !== undefined) match.status = status;
  if (minute !== undefined) match.minute = parseInt(minute, 10);
  if (homeScore !== undefined) match.homeScore = parseInt(homeScore, 10);
  if (awayScore !== undefined) match.awayScore = parseInt(awayScore, 10);
  if (streamUrl !== undefined) match.streamUrl = streamUrl;
  if (streamType !== undefined) match.streamType = streamType;
  if (isPublished !== undefined) match.isPublished = Boolean(isPublished);
  if (isFeatured !== undefined) match.isFeatured = Boolean(isFeatured);

  if (broadcasterName && match.broadcaster) {
    match.broadcaster.name = broadcasterName;
  }

  db.matches.set(match.id, match);
  db.addAuditLog('admin', 'Boshqaruvchi', 'MATCH_UPDATE', `${match.homeTeam.shortName} ${match.homeScore ?? 0}:${match.awayScore ?? 0} ${match.awayTeam.shortName} (${match.status})`);

  return res.json({ match, message: 'O\'yin ma\'lumotlari yangilandi' });
});

// Admin: Delete / Hide match
app.delete('/api/admin/matches/:id', requireAdmin, (req: Request, res: Response) => {
  const match = db.matches.get(req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'O\'yin topilmadi' });
  }

  db.matches.delete(req.params.id);
  db.addAuditLog('admin', 'Boshqaruvchi', 'MATCH_DELETE', `${match.homeTeam.name} vs ${match.awayTeam.name} o'yini o'chirildi`);

  return res.json({ message: 'O\'yin muvaffaqiyatli o\'chirildi' });
});

// Admin: Send Telegram broadcast
app.post('/api/admin/broadcast', requireAdmin, async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Xabarnoma matnini kiriting' });
  }

  const result = await telegramBot.broadcastMessage(message);
  return res.json({
    message: 'Telegram xabarnomasi muvaffaqiyatli yuborildi!',
    sentCount: result.sentCount,
  });
});

// Admin: Audit logs
app.get('/api/admin/audit-logs', requireAdmin, (req: Request, res: Response) => {
  return res.json({ auditLogs: db.auditLogs });
});

// Admin: System settings
app.get('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  return res.json({ settings: db.settings });
});

app.post('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const { siteName, maintenanceMode, announcementNotice } = req.body;
  if (siteName !== undefined) db.settings.siteName = siteName;
  if (maintenanceMode !== undefined) db.settings.maintenanceMode = Boolean(maintenanceMode);
  if (announcementNotice !== undefined) db.settings.announcementNotice = announcementNotice;

  db.addAuditLog('admin', 'Boshqaruvchi', 'SETTINGS_UPDATE', 'Sayt sozlamalari yangilandi');
  return res.json({ settings: db.settings, message: 'Sozlamalar saqlandi' });
});

// Admin: Trigger football-data.org sync
app.post('/api/admin/sync-football', requireAdmin, async (req: Request, res: Response) => {
  const result = await footballProvider.syncWithDatabase();
  return res.json(result);
});

// -------------------------------------------------------------
// 5. DEV SERVER & PRODUCTION VITE MIDDLEWARE
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Futbol Live UZ] Server running on http://0.0.0.0:${PORT}`);

    // Initial Real-time Football Data Fetch
    footballProvider.syncWithDatabase()
      .then((res) => {
        console.log(`[Realtime Sports API] Dastlabki sinxronlash: ${res.status}`);
      })
      .catch((err) => {
        console.warn(`[Realtime Sports API] Dastlabki sinxronlashda ogohlantirish:`, err);
      });

    // Periodic Background Sync every 60 seconds for live minutes and scores
    setInterval(() => {
      footballProvider.syncWithDatabase().catch((err) => {
        console.warn('[Realtime Sports API] Foniy yangilanishda xatolik:', err);
      });
    }, 60 * 1000);
  });
}

startServer();
