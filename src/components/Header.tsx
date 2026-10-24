/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from '../types/index.ts';
import { Shield, User as UserIcon, Send, Smartphone } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenTelegram: () => void;
  onOpenAndroidGuide: () => void;
  isTelegramWebApp: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenAuth,
  onOpenAdmin,
  onOpenTelegram,
  onOpenAndroidGuide,
  isTelegramWebApp,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.telegramId === '7853449314';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark & emblem */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <img
                src="/src/assets/images/futbol_live_logo_1792839249424.jpg"
                alt="Futbol Live Uzbekistan"
                className="w-9 h-9 rounded-lg object-cover ring-1 ring-emerald-500/30"
              />
              <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                Futbol Live <span className="text-emerald-400">UZ</span>
              </span>
            </button>
            {isTelegramWebApp && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-sky-950/80 text-sky-400 border border-sky-800/60 rounded">
                Telegram Mini App
              </span>
            )}
          </div>

          {/* Zone 2: 4-5 clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => onSelectTab('home')}
              className={`whitespace-nowrap transition-colors ${
                currentTab === 'home' ? 'text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Bosh sahifa
            </button>
            <button
              onClick={() => onSelectTab('live')}
              className={`whitespace-nowrap transition-colors ${
                currentTab === 'live' ? 'text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Jonli efirlar
            </button>
            <button
              onClick={() => onSelectTab('channels')}
              className={`whitespace-nowrap transition-colors ${
                currentTab === 'channels' ? 'text-rose-400 font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Telekanallar
            </button>
            <button
              onClick={() => onSelectTab('matches')}
              className={`whitespace-nowrap transition-colors ${
                currentTab === 'matches' ? 'text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              O'yinlar taqvimi
            </button>
            <button
              onClick={() => onSelectTab('standings')}
              className={`whitespace-nowrap transition-colors ${
                currentTab === 'standings' ? 'text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Chempionatlar
            </button>
            <button
              onClick={() => onSelectTab('favorites')}
              className={`whitespace-nowrap transition-colors ${
                currentTab === 'favorites' ? 'text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Sevimlilar
            </button>
          </nav>

          {/* Zone 3: Primary Action & Context Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Android setup guide button */}
            <button
              onClick={onOpenAndroidGuide}
              title="Android qo'llanma"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors whitespace-nowrap"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Android Qo'llanma</span>
            </button>

            {/* Telegram Bot Modal Trigger */}
            <button
              onClick={onOpenTelegram}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-300 bg-sky-950/60 border border-sky-800/60 rounded-lg hover:bg-sky-900/60 transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Telegram Bot</span>
            </button>

            {/* Admin Dashboard shortcut if authorized */}
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 border border-amber-800/60 rounded-lg hover:bg-amber-900/60 transition-colors whitespace-nowrap"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin Panel</span>
              </button>
            )}

            {/* User Account / Login Button */}
            {currentUser ? (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{currentUser.username}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap font-semibold shadow-sm shadow-emerald-500/20"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Kirish</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
