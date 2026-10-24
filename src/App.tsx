/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Match, League, User } from './types/index.ts';
import { api } from './services/api.ts';
import { Header } from './components/Header.tsx';
import { HeroSpotlight } from './components/HeroSpotlight.tsx';
import { MatchCard } from './components/MatchCard.tsx';
import { MatchStreamModal } from './components/MatchStreamModal.tsx';
import { StandingsView } from './components/StandingsView.tsx';
import { TelegramHub } from './components/TelegramHub.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AndroidSetupModal } from './components/AndroidSetupModal.tsx';
import { BottomTabBar } from './components/BottomTabBar.tsx';
import { 
  Search, 
  Flame, 
  Calendar, 
  Tv, 
  Trophy, 
  Star, 
  ShieldCheck, 
  RefreshCw,
  Send,
  Smartphone
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Modals
  const [selectedMatchForStream, setSelectedMatchForStream] = useState<Match | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState<boolean>(false);
  const [isAndroidGuideOpen, setIsAndroidGuideOpen] = useState<boolean>(false);

  // Telegram WebApp detection
  const isTelegramWebApp = typeof window !== 'undefined' && Boolean((window as any)?.Telegram?.WebApp?.initData);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setLoading(true);
    let resolvedUser: User | null = null;

    try {
      // 1. Check if running inside Telegram Mini App
      const tg = (window as any)?.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();

        // If tg.initData exists, validate on server
        if (tg.initData) {
          try {
            const authRes = await api.validateTelegramMiniApp(tg.initData);
            if (authRes?.user) {
              resolvedUser = authRes.user;
              setCurrentUser(authRes.user);
            }
          } catch (err) {
            console.warn('initData validation fallback:', err);
          }
        }

        // If not resolved yet, check initDataUnsafe.user for instant 1-click login
        if (!resolvedUser && tg.initDataUnsafe?.user) {
          try {
            const u = tg.initDataUnsafe.user;
            const quickRes = await api.telegramQuickLogin({
              telegramId: u.id.toString(),
              username: u.username || u.first_name,
              firstName: u.first_name,
            });
            if (quickRes?.user) {
              resolvedUser = quickRes.user;
              setCurrentUser(quickRes.user);
            }
          } catch (err) {
            console.warn('Telegram quick login error:', err);
          }
        }
      }

      // 2. If not logged in from Telegram, check stored session token
      if (!resolvedUser) {
        const me = await api.getMe();
        if (me?.user) {
          resolvedUser = me.user;
          setCurrentUser(me.user);
        } else {
          // If first visit and not logged in, prompt registration / login modal immediately
          setIsAuthOpen(true);
        }
      }

      // 3. Fetch matches and leagues
      await reloadMatches();
      const leaguesData = await api.getLeagues();
      setLeagues(leaguesData.leagues || []);
    } catch (err) {
      console.error('App init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const reloadMatches = async () => {
    try {
      const data = await api.getMatches();
      setMatches(data.matches || []);
    } catch (err) {
      console.error('Error reloading matches:', err);
    }
  };

  const handleToggleFavorite = async (teamId: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const res = await api.toggleFavorite(teamId);
      setCurrentUser({
        ...currentUser,
        favoriteTeamIds: res.favoriteTeamIds,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered matches
  const filteredMatches = matches.filter((m) => {
    if (currentTab === 'live' && m.status !== 'IN_PLAY') return false;
    if (currentTab === 'favorites') {
      const favs = currentUser?.favoriteTeamIds || [];
      if (!favs.includes(m.homeTeam.id) && !favs.includes(m.awayTeam.id)) return false;
    }
    if (statusFilter === 'LIVE' && m.status !== 'IN_PLAY') return false;
    if (statusFilter === 'SCHEDULED' && m.status !== 'SCHEDULED') return false;
    if (statusFilter === 'FINISHED' && m.status !== 'FINISHED') return false;
    if (selectedLeagueId !== 'ALL' && m.leagueId !== selectedLeagueId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.homeTeam.name} ${m.awayTeam.name} ${m.leagueName} ${m.venue || ''}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const featuredMatch = matches.find((m) => m.isFeatured) || matches[0] || null;
  const liveCount = matches.filter((m) => m.status === 'IN_PLAY').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-10">
      {/* 1. Header (Top Bar Contract) */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'admin') setIsAdminOpen(true);
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenTelegram={() => setIsTelegramOpen(true)}
        onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
        isTelegramWebApp={isTelegramWebApp}
      />

      {/* 2. Announcement Banner (Clean hairline surface) */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-emerald-400">⚡ Rasmiy Efirlar:</span>
            <span className="truncate">O'zbekiston Superligasi va Yevropa chempionatlari Toshkent vaqti (UTC+5) bilan</span>
          </div>
          <button
            onClick={() => setIsAndroidGuideOpen(true)}
            className="hidden sm:inline-flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors shrink-0 ml-4 font-medium"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android qo'llanma</span>
          </button>
        </div>
      </div>

      {/* 3. Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* VIEW 1: STANDINGS */}
        {currentTab === 'standings' ? (
          <StandingsView leagues={leagues} />
        ) : (
          <>
            {/* Hero Spotlight (Rendered on Home or Live) */}
            {currentTab === 'home' && (
              <HeroSpotlight
                featuredMatch={featuredMatch}
                onWatchMatch={(m) => setSelectedMatchForStream(m)}
                onOpenTelegram={() => setIsTelegramOpen(true)}
              />
            )}

            {/* Match Feed Controls */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    {currentTab === 'live' ? (
                      <>
                        <Tv className="w-6 h-6 text-rose-400" />
                        <span>Jonli Efirdagi O'yinlar</span>
                      </>
                    ) : currentTab === 'favorites' ? (
                      <>
                        <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                        <span>Sevimli Jamoalaringiz Uchrashuvlari</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-6 h-6 text-emerald-400" />
                        <span>O'yinlar Jadvali va Jonli Hisoblar</span>
                      </>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Barcha natijalar va translyatsiya havolalari real vaqt rejimida yangilanadi.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Jamoa yoki liga nomi..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Status Segmented Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {[
                  { id: 'ALL', label: 'Barchasi', count: matches.length },
                  { id: 'LIVE', label: '🔴 Jonli efirda', count: liveCount },
                  { id: 'SCHEDULED', label: 'Bugun & Kelgusi', count: matches.filter(m => m.status === 'SCHEDULED').length },
                  { id: 'FINISHED', label: 'Yakunlangan', count: matches.filter(m => m.status === 'FINISHED').length },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStatusFilter(s.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                      statusFilter === s.id
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-sm font-semibold'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-900'
                    }`}
                  >
                    <span>{s.label}</span>
                    <span className="text-[11px] font-mono text-slate-500">({s.count})</span>
                  </button>
                ))}
              </div>

              {/* League Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
                <button
                  onClick={() => setSelectedLeagueId('ALL')}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                    selectedLeagueId === 'ALL'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Barcha Ligalar
                </button>
                {leagues.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => setSelectedLeagueId(league.id)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                      selectedLeagueId === league.id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {league.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Matches Grid */}
            {loading ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                O'yinlar ma'lumotlari yuklanmoqda...
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-3">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">Tanlangan parametrlar bo'yicha o'yinlar topilmadi</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Boshqa liga yoki sana filtrini tanlab ko'ring yoki barcha o'yinlarni ko'rish uchun filtrlarni tiklang.
                </p>
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setSelectedLeagueId('ALL');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  Barcha o'yinlarni ko'rsatish
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isFavorite={Boolean(currentUser?.favoriteTeamIds?.includes(match.homeTeam.id))}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectMatch={(m) => setSelectedMatchForStream(m)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/src/assets/images/futbol_live_logo_1792839249424.jpg"
                alt="Logo"
                className="w-6 h-6 rounded"
              />
              <span className="font-bold text-white text-sm">Futbol Live Uzbekistan</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
              <span>Rasmiy media hamkorlar:</span>
              <span className="text-slate-300">Sport TV (MTRK)</span>
              <span>·</span>
              <span className="text-slate-300">UzReport TV</span>
              <span>·</span>
              <span className="text-slate-300">Setanta Sports</span>
            </div>
          </div>
          <div className="border-t border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <div>© 2026 Futbol Live Uzbekistan. Barcha huquqlar himoyalangan.</div>
            <div>Boshlanish vaqtlari: Toshkent vaqti (UTC+5)</div>
          </div>
        </div>
      </footer>

      {/* 5. Mobile Bottom Tab Bar */}
      <BottomTabBar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenAuth={() => setIsAuthOpen(true)}
        isLoggedIn={Boolean(currentUser)}
        liveMatchesCount={liveCount}
      />

      {/* 6. Modals */}
      {selectedMatchForStream && (
        <MatchStreamModal
          match={selectedMatchForStream}
          onClose={() => setSelectedMatchForStream(null)}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          currentUser={currentUser}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            reloadMatches();
          }}
          onLogoutSuccess={() => setCurrentUser(null)}
        />
      )}

      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl my-8">
            <button
              onClick={() => setIsAdminOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white text-lg font-bold p-2"
            >
              ✕
            </button>
            <AdminDashboard
              currentUser={currentUser}
              matches={matches}
              leagues={leagues}
              teams={[]}
              onRefreshMatches={reloadMatches}
              onClose={() => setIsAdminOpen(false)}
            />
          </div>
        </div>
      )}

      {isTelegramOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl my-8">
            <button
              onClick={() => setIsTelegramOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white text-lg font-bold p-2"
            >
              ✕
            </button>
            <TelegramHub
              currentUser={currentUser}
              onRefreshUser={async () => {
                const me = await api.getMe();
                if (me?.user) setCurrentUser(me.user);
              }}
              onClose={() => setIsTelegramOpen(false)}
            />
          </div>
        </div>
      )}

      {isAndroidGuideOpen && (
        <AndroidSetupModal onClose={() => setIsAndroidGuideOpen(false)} />
      )}
    </div>
  );
}
