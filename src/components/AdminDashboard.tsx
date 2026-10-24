/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Match, User, AuditLogItem, SystemSettings, League, Team } from '../types/index.ts';
import { api } from '../services/api.ts';
import { 
  Shield, 
  Users, 
  Tv, 
  Plus, 
  Send, 
  Settings as SettingsIcon, 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Search
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User | null;
  matches: Match[];
  leagues: League[];
  teams: Team[];
  onRefreshMatches: () => void;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  matches,
  leagues,
  teams,
  onRefreshMatches,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'MATCHES' | 'USERS' | 'BROADCAST' | 'AUDIT' | 'SETTINGS'>('METRICS');
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Match edit modal state
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);

  // New Match Form State
  const [newMatchForm, setNewMatchForm] = useState({
    leagueId: leagues[0]?.id || 'league-uz-superliga',
    homeTeamId: teams[0]?.id || 'uz-navbahor',
    awayTeamId: teams[1]?.id || 'uz-pakhtakor',
    utcDate: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    venue: 'Markaziy Arena',
    competitionRound: '23-tur',
    broadcasterName: 'Sport TV O\'zbekiston',
    streamUrl: 'https://mtrk.uz/uz/tv/sport',
    streamType: 'EXTERNAL',
  });

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadAllAdminData();
  }, [activeTab]);

  const loadAllAdminData = async () => {
    try {
      if (activeTab === 'METRICS') {
        const m = await api.getAdminMetrics();
        setMetrics(m);
      } else if (activeTab === 'USERS') {
        const u = await api.getAdminUsers(userSearch);
        setUsersList(u);
      } else if (activeTab === 'AUDIT') {
        const logs = await api.getAuditLogs();
        setAuditLogs(logs);
      } else if (activeTab === 'SETTINGS') {
        const s = await api.getSettings();
        setSettings(s);
      }
    } catch (err: any) {
      console.error(err);
      setStatusFeedback(err.message || 'Xatolik yuz berdi');
    }
  };

  // Toggle user suspension
  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg = user.status === 'ACTIVE' 
      ? `${user.username} foydalanuvchisini bloklashni xohlaysizmi?`
      : `${user.username} hisobini qayta faollashtirilsinmi?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.setUserStatus(user.id, newStatus);
      setStatusFeedback(`${user.username} holati muvaffaqiyatli o'zgartirildi.`);
      const updated = await api.getAdminUsers(userSearch);
      setUsersList(updated);
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  // Save New Match
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMatch(newMatchForm);
      setIsAddMatchOpen(false);
      setStatusFeedback('Yangi o\'yin muvaffaqiyatli saqlandi!');
      onRefreshMatches();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  // Update Existing Match (e.g. Live score, minute, status)
  const handleUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    try {
      await api.updateMatch(editingMatch.id, {
        status: editingMatch.status,
        minute: editingMatch.minute,
        homeScore: editingMatch.homeScore,
        awayScore: editingMatch.awayScore,
        streamUrl: editingMatch.streamUrl,
        streamType: editingMatch.streamType,
        isPublished: editingMatch.isPublished,
        isFeatured: editingMatch.isFeatured,
        broadcasterName: editingMatch.broadcaster?.name,
      });
      setEditingMatch(null);
      setStatusFeedback('O\'yin hisobi va holati yangilandi!');
      onRefreshMatches();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  // Delete Match
  const handleDeleteMatch = async (id: string, name: string) => {
    if (!window.confirm(`${name} uchrashuvini o'chirib tashlashni tasdiqlaysizmi?`)) return;
    try {
      await api.deleteMatch(id);
      setStatusFeedback('O\'yin o\'chirildi.');
      onRefreshMatches();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Send Telegram Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setBroadcastSending(true);
    try {
      const res = await api.broadcastTelegram(broadcastMessage);
      setStatusFeedback(`${res.sentCount} ta foydalanuvchiga xabarnoma jo'natildi!`);
      setBroadcastMessage('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBroadcastSending(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateSettings(settings);
      setStatusFeedback('Tizim sozlamalari muvaffaqiyatli saqlandi.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <span>Futbol Live UZ — Administrator Paneli</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Boshqaruvchi Telegram ID: <code>{currentUser?.telegramId || '7853449314'}</code> · Rol: Administrator
          </p>
        </div>

        {/* Sync Button */}
        <button
          onClick={async () => {
            await api.syncFootballData();
            onRefreshMatches();
            loadAllAdminData();
            setStatusFeedback('Football-Data.org API orqali ma\'lumotlar sinxronlandi.');
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-medium text-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>API Sinxronizatsiya</span>
        </button>
      </div>

      {statusFeedback && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <span>{statusFeedback}</span>
          <button onClick={() => setStatusFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('METRICS')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'METRICS' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Umumiy Statistika
        </button>
        <button
          onClick={() => setActiveTab('MATCHES')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'MATCHES' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          O'yinlar Boshqaruvi ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'USERS' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Foydalanuvchilar
        </button>
        <button
          onClick={() => setActiveTab('BROADCAST')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'BROADCAST' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Telegram Xabarnoma
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'AUDIT' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Audit Jurnali
        </button>
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'SETTINGS' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Sozlamalar
        </button>
      </div>

      {/* TAB 1: METRICS */}
      {activeTab === 'METRICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Jami Foydalanuvchilar</span>
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                {metrics?.totalUsers || 2}
              </div>
              <span className="text-[11px] text-emerald-400">Faol: {metrics?.activeUsers || 2}</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-rose-400" />
                <span>Hozir Jonli Efirda</span>
              </span>
              <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tabular-nums">
                {metrics?.liveMatches ?? 2}
              </div>
              <span className="text-[11px] text-slate-400">Jonli hisob yangilanmoqda</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Jami O'yinlar Bazasi</span>
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                {metrics?.totalMatches || matches.length}
              </div>
              <span className="text-[11px] text-slate-400">Superliga + UCL + EPL</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Tizim Holati</span>
              </span>
              <div className="text-lg font-bold text-white mt-1">
                {metrics?.maintenanceMode ? '⚠️ Texnik Rejim' : '✅ 100% Onlayn'}
              </div>
              <span className="text-[11px] text-slate-400">Asia/Tashkent (UTC+5)</span>
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-white">Xavfsizlik va Ruxsatlar Holati</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Barcha o'yinlar, foydalanuvchilar va translyatsiya havolalari faqat server tomonida ruxsat berilgan <strong>7853449314</strong> Telegram ID yoki ADMIN roli orqali boshqariladi. Foydalanuvchi interfeysidagi hech qanday so'rov server tekshiruvisiz o'zgartirilmaydi.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: MATCHES MANAGEMENT */}
      {activeTab === 'MATCHES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Barcha O'yinlar Jadvali</h3>
            <button
              onClick={() => setIsAddMatchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi O'yin Qo'shish</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Uchrashuv</th>
                  <th className="px-3 py-3">Liga</th>
                  <th className="px-3 py-3">Holat & Hisob</th>
                  <th className="px-3 py-3">Vaqt (Toshkent)</th>
                  <th className="px-3 py-3">Telekanal / Efir</th>
                  <th className="px-3 py-3">Ko'rsatish</th>
                  <th className="px-4 py-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {matches.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-white">
                      {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                    </td>
                    <td className="px-3 py-3 text-slate-300 truncate max-w-[120px]">{m.leagueName}</td>
                    <td className="px-3 py-3 font-mono">
                      {m.status === 'IN_PLAY' ? (
                        <span className="text-rose-400 font-bold">🔴 JONLI ({m.homeScore ?? 0}:{m.awayScore ?? 0}, {m.minute}')</span>
                      ) : m.status === 'FINISHED' ? (
                        <span className="text-slate-300">Tugadi ({m.homeScore ?? 0}:{m.awayScore ?? 0})</span>
                      ) : (
                        <span className="text-slate-400">Kutilmoqda</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-emerald-400 font-mono">{m.kickoffTashkent}</td>
                    <td className="px-3 py-3 text-slate-300 truncate max-w-[140px]">
                      {m.broadcaster?.name || 'MTRK Sport TV'}
                    </td>
                    <td className="px-3 py-3">
                      {m.isPublished ? (
                        <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                          <Eye className="w-3 h-3" /> Faol
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                          <EyeOff className="w-3 h-3" /> Yashirin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => setEditingMatch(m)}
                        className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(m.id, `${m.homeTeam.name} vs ${m.awayTeam.name}`)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USERS MANAGEMENT */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">Ro'yxatdan o'tgan foydalanuvchilar</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Email, username yoki TG ID..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  api.getAdminUsers(e.target.value).then(setUsersList);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Foydalanuvchi</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Telegram ID</th>
                  <th className="px-3 py-3">Rol</th>
                  <th className="px-3 py-3">Holat</th>
                  <th className="px-4 py-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-white">{u.username}</td>
                    <td className="px-3 py-3 text-slate-300">{u.email}</td>
                    <td className="px-3 py-3 font-mono text-slate-400">
                      {u.telegramId || '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${
                            u.status === 'ACTIVE'
                              ? 'bg-rose-950/80 text-rose-300 hover:bg-rose-900'
                              : 'bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Bloklash' : 'Faollashtirish'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TELEGRAM BROADCAST */}
      {activeTab === 'BROADCAST' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Telegram Ommaviy Xabarnoma Yuborish</h3>
          </div>
          <p className="text-xs text-slate-400">
            Ushbu xabar barcha botga ulangan foydalanuvchilarga to'g'ridan-to'g'ri yetkaziladi. HTML teglari (<b>qalin</b>, <i>kursiv</i>, &lt;code&gt;) qo'llab-quvvatlanadi.
          </p>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <textarea
              required
              rows={5}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="⚡ DIQQAT: Bugun 20:00 da O'zbekiston El-Klasikosi: Navbahor vs Paxtakor uchrashuvi jonli efirda! Tomosha qilish uchun Web Appni oching..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-sans"
            />

            <button
              type="submit"
              disabled={broadcastSending}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-sky-500/20"
            >
              <Send className="w-4 h-4" />
              <span>{broadcastSending ? "Jo'natilmoqda..." : "Xabarnomani tarqatish"}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Administrator Harakatlari Jurnali (Audit)</h3>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="font-semibold text-amber-400">{log.action}</span>
                  <span className="font-mono">{new Date(log.timestamp).toLocaleString('uz-UZ')}</span>
                </div>
                <div className="text-slate-200">{log.details}</div>
                <div className="text-[10px] text-slate-500">Ijrochi: {log.adminName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'SETTINGS' && settings && (
        <div className="space-y-6 max-w-xl">
          {/* Bot Token Live Setup */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-400" />
              <span>Telegram Bot Integratsiyasi (Real-Time Long Polling)</span>
            </h3>
            <p className="text-xs text-slate-400">
              @BotFather bergan bot tokenini kiriting. Tizim Telegram API orqali botni tekshirib, botingizga yozilgan xabarlarni qabul qilishni boshlaydi.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                id="admin-bot-token"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwXyz"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={async () => {
                  const input = document.getElementById('admin-bot-token') as HTMLInputElement;
                  if (!input?.value) return;
                  try {
                    const res = await api.connectTelegramBot(input.value);
                    setStatusFeedback(res.message);
                    input.value = '';
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs"
              >
                Ulash va Faollashtirish
              </button>
            </div>
            <div className="text-[11px] text-slate-400">
              Boshqaruvchi Telegram ID: <code>7853449314</code>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-emerald-400" />
              <span>Sayt Asosiy Sozlamalari</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Platforma Nomi</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Bosh sahifa E'lon matni</label>
              <input
                type="text"
                value={settings.announcementNotice}
                onChange={(e) => setSettings({ ...settings, announcementNotice: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="maint"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <label htmlFor="maint" className="text-xs text-slate-300">
                Texnik ta'mirlash rejimi (Maintenance Mode)
              </label>
            </div>

            <button
              type="submit"
              className="mt-4 px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs"
            >
              Sozlamalarni saqlash
            </button>
          </form>
        </div>
      )}

      {/* MODAL: ADD NEW MATCH */}
      {isAddMatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Yangi O'yin Kiritish</h3>
            <form onSubmit={handleCreateMatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Turnir / Liga</label>
                <select
                  value={newMatchForm.leagueId}
                  onChange={(e) => setNewMatchForm({ ...newMatchForm, leagueId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  {leagues.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Mezbon Jamoa</label>
                  <select
                    value={newMatchForm.homeTeamId}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, homeTeamId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Mehmon Jamoa</label>
                  <select
                    value={newMatchForm.awayTeamId}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, awayTeamId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Tur / Bosqich</label>
                  <input
                    type="text"
                    value={newMatchForm.competitionRound}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, competitionRound: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Stadion</label>
                  <input
                    type="text"
                    value={newMatchForm.venue}
                    onChange={(e) => setNewMatchForm({ ...newMatchForm, venue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Rasmiy Telekanal Nomi</label>
                <input
                  type="text"
                  value={newMatchForm.broadcasterName}
                  onChange={(e) => setNewMatchForm({ ...newMatchForm, broadcasterName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Rasmiy Efir / Vebsayt Havolasi</label>
                <input
                  type="url"
                  value={newMatchForm.streamUrl}
                  onChange={(e) => setNewMatchForm({ ...newMatchForm, streamUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddMatchOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-400 text-slate-950 font-bold rounded-lg hover:bg-emerald-300"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MATCH (SCORE, MINUTE, LIVE STATUS) */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              O'yinni Tahrirlash: {editingMatch.homeTeam.shortName} vs {editingMatch.awayTeam.shortName}
            </h3>

            <form onSubmit={handleUpdateMatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">O'yin Holati</label>
                <select
                  value={editingMatch.status}
                  onChange={(e) => setEditingMatch({ ...editingMatch, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  <option value="SCHEDULED">Rejalashtirilgan (SCHEDULED)</option>
                  <option value="IN_PLAY">🔴 Jonli Efirda (IN_PLAY)</option>
                  <option value="FINISHED">✅ Yakunlandi (FINISHED)</option>
                  <option value="POSTPONED">Qoldirildi (POSTPONED)</option>
                  <option value="CANCELLED">Bekor qilindi (CANCELLED)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Daqiqa</label>
                  <input
                    type="number"
                    value={editingMatch.minute || 0}
                    onChange={(e) => setEditingMatch({ ...editingMatch, minute: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Mezbon gol</label>
                  <input
                    type="number"
                    value={editingMatch.homeScore ?? 0}
                    onChange={(e) => setEditingMatch({ ...editingMatch, homeScore: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Mehmon gol</label>
                  <input
                    type="number"
                    value={editingMatch.awayScore ?? 0}
                    onChange={(e) => setEditingMatch({ ...editingMatch, awayScore: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Rasmiy Efir URL</label>
                <input
                  type="url"
                  value={editingMatch.streamUrl || ''}
                  onChange={(e) => setEditingMatch({ ...editingMatch, streamUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingMatch.isPublished}
                    onChange={(e) => setEditingMatch({ ...editingMatch, isPublished: e.target.checked })}
                    className="rounded accent-emerald-500"
                  />
                  <span className="text-slate-300">Foydalanuvchilarga ko'rinsin</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-lg hover:bg-amber-300"
                >
                  Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
