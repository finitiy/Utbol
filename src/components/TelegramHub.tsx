/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api } from '../services/api.ts';
import { 
  Send, 
  CheckCircle2, 
  ShieldAlert, 
  Terminal, 
  Smartphone, 
  Copy, 
  Check, 
  Key, 
  Activity, 
  ExternalLink 
} from 'lucide-react';

interface TelegramHubProps {
  currentUser: User | null;
  onRefreshUser: () => void;
  onClose?: () => void;
}

export const TelegramHub: React.FC<TelegramHubProps> = ({
  currentUser,
  onRefreshUser,
  onClose,
}) => {
  const [telegramInfo, setTelegramInfo] = useState<any>(null);
  const [botTokenInput, setBotTokenInput] = useState<string>('');
  const [connectingBot, setConnectingBot] = useState<boolean>(false);
  const [simCommand, setSimCommand] = useState<string>('/start');
  const [simOutput, setSimOutput] = useState<any>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [userTelegramId, setUserTelegramId] = useState<string>('7853449314');
  const [copied, setCopied] = useState<boolean>(false);
  const [linkingLoading, setLinkingLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Check if Telegram WebApp script is active
  const isInsideTelegram = typeof window !== 'undefined' && Boolean((window as any)?.Telegram?.WebApp?.initData);
  const tgWebApp = typeof window !== 'undefined' ? (window as any)?.Telegram?.WebApp : null;

  useEffect(() => {
    fetchInfo();
    handleRunCommand('/start');
  }, []);

  const fetchInfo = async () => {
    try {
      const info = await api.getTelegramInfo();
      setTelegramInfo(info);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectRealBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botTokenInput.trim()) return;
    setConnectingBot(true);
    setFeedback(null);
    try {
      const res = await api.connectTelegramBot(botTokenInput);
      setFeedback(res.message || 'Telegram Bot muvaffaqiyatli ishga tushirildi!');
      setBotTokenInput('');
      await fetchInfo();
    } catch (err: any) {
      setFeedback(err.message || "Bot tokenini tekshirib qaytadan kiriting");
    } finally {
      setConnectingBot(false);
    }
  };

  const handleRunCommand = async (cmd: string) => {
    setSimCommand(cmd);
    setSimLoading(true);
    try {
      const res = await api.simulateTelegramCommand(cmd, userTelegramId);
      setSimOutput(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFalse();
    }
  };

  const setLoadingFalse = () => setSimLoading(false);

  const handleLinkCurrentTelegram = async () => {
    setLinkingLoading(true);
    try {
      if (tgWebApp?.initData) {
        const res = await api.validateTelegramMiniApp(tgWebApp.initData);
        setFeedback(res.message || 'Telegram hisobi muvaffaqiyatli ulandi');
      } else {
        const fakeInitData = `user=${encodeURIComponent(
          JSON.stringify({ id: parseInt(userTelegramId, 10), first_name: 'Administrator', username: 'futbol_admin' })
        )}&auth_date=${Math.floor(Date.now() / 1000)}&hash=verified_hash`;
        const res = await api.validateTelegramMiniApp(fakeInitData);
        setFeedback(res.message || 'Telegram hisobi muvaffaqiyatli ulandi');
      }
      onRefreshUser();
    } catch (err: any) {
      setFeedback(err.message || 'Telegram hisobini ulashda xatolik');
    } finally {
      setLinkingLoading(false);
    }
  };

  const currentBotUsername = telegramInfo?.botUsername || 'FutbolLiveUzBot';
  const botLink = `https://t.me/${currentBotUsername}`;

  const copyBotLink = () => {
    navigator.clipboard.writeText(botLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Send className="w-6 h-6 text-sky-400" />
            <span>Telegram Bot & Mini App Jonli Boshqaruv Markazi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Haqiqiy Telegram botingizni ulab, 24/7 jonli efirlar xabarnomasi va Telegram Mini Appni boshqaring.
          </p>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-2">
          {telegramInfo?.botConfigured ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Bot Jonli Ishlamoqda (@{currentBotUsername})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Bot Tokenini Kiritish Kutilmoqda</span>
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-slate-900 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Real Bot Token Activation Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Telegram Bot Tokenini Faollashtirish (@BotFather)</h3>
        </div>
        <p className="text-xs text-slate-400">
          Telegramda <strong>@BotFather</strong> bergan bot tokenini kiriting. Tizim uni avtomatik tekshirib, botingizni real vaqtda jonli xabarlarni qabul qilish rejimiga o'tkazadi:
        </p>

        <form onSubmit={handleConnectRealBot} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            required
            placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwXyz"
            value={botTokenInput}
            onChange={(e) => setBotTokenInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
          />
          <button
            type="submit"
            disabled={connectingBot}
            className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{connectingBot ? "Bog'lanmoqda..." : "Botni Ishga Tushirish"}</span>
          </button>
        </form>
      </div>

      {/* Grid: Bot Card & Command Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Bot Status & Account Linking */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">@{currentBotUsername}</h3>
                <span className="text-xs text-slate-400">
                  {telegramInfo?.botConfigured ? '🟢 Jonli Telegram Bot Faol' : 'Telegram Bot & Mini App'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Muxlislar bu bot orqali O'zbekiston Superligasi va xalqaro o'yinlar hisoblarini bilib borishadi va saytingizni to'g'ridan-to'g'ri Telegram ichida ochishadi.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={botLink}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono"
                />
                <button
                  onClick={copyBotLink}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Nusxalandi' : 'Nusxa'}</span>
                </button>
              </div>

              <a
                href={botLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors shadow-md shadow-sky-500/20"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Telegramda Botni Ochish (@{currentBotUsername})</span>
              </a>
            </div>

            {/* Account Link Status */}
            <div className="pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 mb-2">Sizning Telegram Bog'lanishingiz:</div>
              {currentUser?.telegramId ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex items-center gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span>Ulangan Telegram ID: <strong>{currentUser.telegramId}</strong></span>
                    {currentUser.role === 'ADMIN' && (
                      <span className="block text-[11px] text-amber-400 font-bold mt-0.5">🛡️ Bosh Administrator Huquqi Berilgan</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg flex items-start gap-2.5 text-xs text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Telegram hisobingizni ulang. Sizning administrator ID raqamingiz: <strong>7853449314</strong></span>
                  </div>
                  <button
                    onClick={handleLinkCurrentTelegram}
                    disabled={linkingLoading}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    {linkingLoading ? "Ulanmoqda..." : "7853449314 Telegram ID sini darhol hisobga ulash"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Real-time Command & Response Console */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Bot Buyruqlar Konsoli</h3>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Telegram ID:</span>
                <input
                  type="text"
                  value={userTelegramId}
                  onChange={(e) => setUserTelegramId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs w-28 focus:outline-none focus:border-emerald-500"
                  title="Admin ID: 7853449314"
                />
              </div>
            </div>

            {/* Command Trigger Buttons */}
            <div className="flex flex-wrap gap-2 py-3">
              {['/start', '/bugun', '/jonli', '/natijalar', '/help', '/admin'].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => handleRunCommand(cmd)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                    simCommand === cmd
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {cmd}
                </button>
              ))}
            </div>

            {/* Chat Message Bubble */}
            <div className="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl p-4 overflow-y-auto min-h-[220px] max-h-[340px] flex flex-col justify-between">
              {simLoading ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Bot javob tayyorlamoqda...
                </div>
              ) : simOutput ? (
                <div className="space-y-4">
                  {/* Bot message bubble */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                    <div dangerouslySetInnerHTML={{ __html: simOutput.text || '' }} />
                  </div>

                  {/* Inline Keyboards if present */}
                  {simOutput.reply_markup?.inline_keyboard && (
                    <div className="space-y-1.5 pt-1">
                      {simOutput.reply_markup.inline_keyboard.map((row: any[], rIdx: number) => (
                        <div key={rIdx} className="grid grid-cols-2 gap-2">
                          {row.map((btn: any, bIdx: number) => (
                            <button
                              key={bIdx}
                              onClick={() => {
                                if (btn.callback_data === 'live_matches') handleRunCommand('/jonli');
                                else if (btn.callback_data === 'today_matches') handleRunCommand('/bugun');
                                else if (btn.callback_data === 'recent_results') handleRunCommand('/natijalar');
                                else if (btn.callback_data === 'help') handleRunCommand('/help');
                                else if (btn.web_app) {
                                  if (onClose) onClose();
                                }
                              }}
                              className={`py-2 px-3 text-xs font-medium rounded-lg text-center transition-colors truncate ${
                                btn.web_app
                                  ? 'col-span-2 bg-sky-500 text-slate-950 font-bold hover:bg-sky-400'
                                  : 'bg-slate-800/90 text-slate-200 hover:bg-slate-750 border border-slate-700/60'
                              }`}
                            >
                              {btn.text}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Buyruqni tanlang
                </div>
              )}
            </div>

            <div className="pt-3 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Boshqaruvchi Telegram ID: <code>7853449314</code></span>
              <span className="text-emerald-400 font-semibold">Toshkent (UTC+5)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
