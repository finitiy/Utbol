/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types/index.ts';
import { api } from '../services/api.ts';
import { 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Send, 
  Key, 
  Sparkles,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface AuthModalProps {
  currentUser: User | null;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  onLogoutSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  onClose,
  onAuthSuccess,
  onLogoutSuccess,
}) => {
  const [authMethod, setAuthMethod] = useState<'TELEGRAM' | 'EMAIL'>('TELEGRAM');
  const [telegramId, setTelegramId] = useState('7853449314');
  const [telegramUsername, setTelegramUsername] = useState('futbol_admin');

  // Email form state
  const [emailMode, setEmailMode] = useState<'LOGIN' | 'REGISTER' | 'VERIFY'>('LOGIN');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check if inside Telegram WebApp
  const isInsideTelegram = typeof window !== 'undefined' && Boolean((window as any)?.Telegram?.WebApp?.initData);
  const tgUser = typeof window !== 'undefined' ? (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user : null;

  // 1-Click Telegram Quick Login (No Gmail, No Password!)
  const handleTelegramQuickLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isInsideTelegram && (window as any)?.Telegram?.WebApp?.initData) {
        // Real Telegram Mini App authentication
        const res = await api.validateTelegramMiniApp((window as any).Telegram.WebApp.initData);
        if (res.user) {
          onAuthSuccess(res.user);
          setSuccessMsg(res.message || 'Telegram orqali tizimga kirdingiz');
          setTimeout(() => onClose(), 800);
        }
      } else {
        // Direct Telegram ID login (Instant registration/login without Gmail!)
        const targetId = tgUser?.id?.toString() || telegramId.trim();
        const targetUsername = tgUser?.username || telegramUsername.trim();
        const targetName = tgUser?.first_name || 'Muxlis';

        const res = await api.telegramQuickLogin({
          telegramId: targetId,
          username: targetUsername,
          firstName: targetName,
        });

        if (res.user) {
          onAuthSuccess(res.user);
          setSuccessMsg(res.message || 'Telegram orqali muvaffaqiyatli kirdingiz!');
          setTimeout(() => onClose(), 800);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Telegram orqali kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Optional: Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ identifier: email, password });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Optional: Email Register
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.register({ email, username, password });
      setDemoCodeHint(res.demoVerificationCode || '123456');
      setVerificationCode(res.demoVerificationCode || '');
      setEmailMode('VERIFY');
      setSuccessMsg('Hisob yaratildi! Tasdiqlash kodini kiriting.');
      if (res.user) onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Ro\'yxatdan o\'tishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Optional: Verify Email
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyEmail(email, verificationCode);
      setSuccessMsg(res.message);
      if (res.user) onAuthSuccess(res.user);
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setError(err.message || 'Kod noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    setLoading(true);
    try {
      await api.logout();
      onLogoutSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          /* Profile & Active Session View */
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xl">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{currentUser.username}</span>
                  {currentUser.role === 'ADMIN' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      ADMIN
                    </span>
                  )}
                </h3>
                <span className="text-xs text-slate-400">
                  {currentUser.telegramId ? `Telegram ID: ${currentUser.telegramId}` : currentUser.email}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Hisob Faol va Tasdiqlangan</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Statistics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Telegram Bog'lanishi</span>
                <span className="font-semibold text-slate-200">
                  {currentUser.telegramId ? `ID: ${currentUser.telegramId}` : 'Mavjud emas'}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Sevimli Klublar</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {currentUser.favoriteTeamIds?.length || 0} ta jamoa
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800/80 rounded-xl text-xs font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Hisobdan chiqish</span>
            </button>
          </div>
        ) : (
          /* Authentication Form */
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white">Kirish va Ro'yxatdan O'tish</h3>
              <p className="text-xs text-slate-400 mt-1">
                Gmail shart emas! Telegram orqali 1 soniyada parolsiz va xavfsiz kiring.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* PRIMARY OPTION: 1-CLICK TELEGRAM LOGIN */}
            <div className="p-4 bg-slate-950 border border-sky-500/30 rounded-2xl space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                  <Send className="w-4 h-4" />
                  <span>Tezkor Telegram Kirish (Tavsiya etiladi)</span>
                </div>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-semibold">
                  1-bosishda
                </span>
              </div>

              {isInsideTelegram ? (
                <p className="text-xs text-slate-300">
                  Telegram ilovasi aniqlandi ({tgUser?.first_name || 'Foydalanuvchi'}). Tugmani bosib hisobingizga kiring.
                </p>
              ) : (
                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-400">
                    Sizning Telegram ID raqamingiz:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={telegramId}
                      onChange={(e) => setTelegramId(e.target.value)}
                      placeholder="Masalan: 7853449314"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Boshqaruvchi admin ID: <code>7853449314</code> (avtomatik Admin huquqi beriladi)
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleTelegramQuickLogin}
                disabled={loading}
                className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Send className="w-4 h-4 fill-slate-950" />
                <span>
                  {loading
                    ? "Kirilmoqda..."
                    : isInsideTelegram
                    ? "Telegram bilan davom etish"
                    : "Telegram orqali 1 bosishda kirish"}
                </span>
              </button>
            </div>

            {/* SECONDARY / OPTIONAL: CLASSIC EMAIL LOGIN */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAuthMethod(authMethod === 'EMAIL' ? 'TELEGRAM' : 'EMAIL')}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
              >
                <span>Yoki an'anaviy Email orqali (Ixtiyoriy)</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${authMethod === 'EMAIL' ? 'rotate-180' : ''}`} />
              </button>

              {authMethod === 'EMAIL' && (
                <div className="mt-4 space-y-4 pt-2 border-t border-slate-800/60">
                  {emailMode !== 'VERIFY' && (
                    <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setEmailMode('LOGIN')}
                        className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          emailMode === 'LOGIN' ? 'bg-slate-800 text-white' : 'text-slate-400'
                        }`}
                      >
                        Email Kirish
                      </button>
                      <button
                        onClick={() => setEmailMode('REGISTER')}
                        className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          emailMode === 'REGISTER' ? 'bg-slate-800 text-white' : 'text-slate-400'
                        }`}
                      >
                        Email Ro'yxatdan o'tish
                      </button>
                    </div>
                  )}

                  {emailMode === 'LOGIN' && (
                    <form onSubmit={handleEmailLogin} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@futballive.uz"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Parol"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
                      >
                        Email orqali kirish
                      </button>
                    </form>
                  )}

                  {emailMode === 'REGISTER' && (
                    <form onSubmit={handleEmailRegister} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Foydalanuvchi nomi"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="muxlis@mail.uz"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Parol (kamida 6 ta belgi)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
                      >
                        Email orqali yaratish
                      </button>
                    </form>
                  )}

                  {emailMode === 'VERIFY' && (
                    <form onSubmit={handleVerify} className="space-y-3">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="123456"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 text-center text-base font-mono text-emerald-400 focus:outline-none"
                      />
                      {demoCodeHint && (
                        <div className="text-[11px] text-center text-slate-400">
                          Tasdiqlash kodi: <code className="text-emerald-400 font-bold">{demoCodeHint}</code>
                        </div>
                      )}
                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
                      >
                        Kodni tasdiqlash
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
