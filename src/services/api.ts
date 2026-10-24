/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match, League, StandingItem, Team, User, AuditLogItem, SystemSettings } from '../types/index.ts';

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

export const api = {
  // Auth
  async register(data: { email: string; username: string; password: string }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Ro\'yxatdan o\'tishda xatolik');
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

  // Matches
  async getMatches(params?: { status?: string; leagueId?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.leagueId) query.set('leagueId', params.leagueId);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`/api/matches?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('O\'yinlarni yuklashda xatolik');
    return (await res.json()) as { matches: Match[]; total: number };
  },

  async getMatch(id: string) {
    const res = await fetch(`/api/matches/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('O\'yin topilmadi');
    return (await res.json()) as { match: Match };
  },

  async getLeagues() {
    const res = await fetch('/api/leagues', { headers: getHeaders() });
    if (!res.ok) throw new Error('Ligalarni yuklashda xatolik');
    return (await res.json()) as { leagues: League[] };
  },

  async getStandings(leagueCode: string) {
    const res = await fetch(`/api/standings/${leagueCode}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Turnir jadvalini yuklashda xatolik');
    return (await res.json()) as { standings: StandingItem[] };
  },

  async getTeams() {
    const res = await fetch('/api/teams', { headers: getHeaders() });
    if (!res.ok) throw new Error('Jamoalarni yuklashda xatolik');
    return (await res.json()) as { teams: Team[] };
  },

  async toggleFavorite(teamId: string) {
    const res = await fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ teamId }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Sevimlilarni o\'zgartirishda xatolik');
    return result as { favoriteTeamIds: string[]; action: 'added' | 'removed'; message: string };
  },

  // Telegram status, connect & command runner
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
    if (!res.ok) throw new Error(result.error || "Telegram botni ulashda xatolik");
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

  // Admin
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
    if (!res.ok) throw new Error(result.error || 'Holatni yangilashda xatolik');
    return result;
  },

  async createMatch(matchData: any) {
    const res = await fetch('/api/admin/matches', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(matchData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'O\'yin qo\'shishda xatolik');
    return result.match as Match;
  },

  async updateMatch(id: string, matchData: any) {
    const res = await fetch(`/api/admin/matches/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(matchData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'O\'yinni yangilashda xatolik');
    return result.match as Match;
  },

  async deleteMatch(id: string) {
    const res = await fetch(`/api/admin/matches/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'O\'chirishda xatolik');
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
