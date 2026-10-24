/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Tv, Calendar, Trophy, User as UserIcon } from 'lucide-react';

interface BottomTabBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
  liveMatchesCount: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  isLoggedIn,
  liveMatchesCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 h-16 px-2">
      <div className="grid grid-cols-5 items-center h-full">
        {/* Tab 1: Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] ${
            currentTab === 'home' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Bosh sahifa</span>
        </button>

        {/* Tab 2: Live */}
        <button
          onClick={() => onSelectTab('live')}
          className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] ${
            currentTab === 'live' ? 'text-rose-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Tv className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Jonli</span>
          {liveMatchesCount > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        {/* Tab 3: Matches */}
        <button
          onClick={() => onSelectTab('matches')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] ${
            currentTab === 'matches' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">O'yinlar</span>
        </button>

        {/* Tab 4: Standings */}
        <button
          onClick={() => onSelectTab('standings')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] ${
            currentTab === 'standings' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Turnir</span>
        </button>

        {/* Tab 5: Profile */}
        <button
          onClick={onOpenAuth}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] ${
            isLoggedIn ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">{isLoggedIn ? 'Profil' : 'Kirish'}</span>
        </button>
      </div>
    </nav>
  );
};
