/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Match } from '../types/index.ts';
import { Play, Tv, MapPin, Send } from 'lucide-react';

interface HeroSpotlightProps {
  featuredMatch: Match | null;
  onWatchMatch: (match: Match) => void;
  onOpenTelegram: () => void;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  featuredMatch,
  onWatchMatch,
  onOpenTelegram,
}) => {
  if (!featuredMatch) return null;

  const isLive = featuredMatch.status === 'IN_PLAY';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
      {/* Background Stadium Backdrop with Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/futbol_hero_stadium_1792839249545.jpg"
          alt="Stadium Atmosphere"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
      </div>

      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        {/* Unboxed Metadata Kicker (Zero-pill discipline) */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-4 font-medium">
          <span className="text-emerald-400 font-semibold">{featuredMatch.leagueName}</span>
          <span aria-hidden="true">·</span>
          <span>{featuredMatch.competitionRound || 'Markaziy Uchrashuv'}</span>
          <span aria-hidden="true">·</span>
          <span>Toshkent vaqti: {featuredMatch.kickoffTashkent}</span>
          {isLive && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-rose-400 font-semibold tracking-wide">JONLI EFIR ({featuredMatch.minute}'-daqiqa)</span>
            </>
          )}
        </div>

        {/* Teams and Score Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-4">
          <div className="lg:col-span-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-950/60 p-6 rounded-xl border border-slate-800/80 backdrop-blur-sm">
            {/* Home Team */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3 flex-1">
              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center">
                <img
                  src={featuredMatch.homeTeam.crestUrl}
                  alt={featuredMatch.homeTeam.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {featuredMatch.homeTeam.name}
                </h3>
                <span className="text-xs text-slate-400">Mezbon</span>
              </div>
            </div>

            {/* Score & Match Status */}
            <div className="flex flex-col items-center justify-center px-4 py-2 shrink-0">
              {isLive ? (
                <div className="flex items-center gap-3">
                  <span className="text-4xl sm:text-5xl font-black text-white font-mono tabular-nums">
                    {featuredMatch.homeScore ?? 0}
                  </span>
                  <span className="text-2xl text-slate-500 font-bold">:</span>
                  <span className="text-4xl sm:text-5xl font-black text-white font-mono tabular-nums">
                    {featuredMatch.awayScore ?? 0}
                  </span>
                </div>
              ) : featuredMatch.status === 'FINISHED' ? (
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-slate-300 font-mono tabular-nums">
                    {featuredMatch.homeScore ?? 0}
                  </span>
                  <span className="text-xl text-slate-600">:</span>
                  <span className="text-3xl sm:text-4xl font-black text-slate-300 font-mono tabular-nums">
                    {featuredMatch.awayScore ?? 0}
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Boshlanish vaqti</div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
                    {featuredMatch.kickoffTashkent.split(',')[0]}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-400 mt-2 font-medium">
                {isLive ? `${featuredMatch.minute}-daqiqa ketmoqda` : featuredMatch.status === 'FINISHED' ? 'O\'yin yakunlandi' : 'Kutilmoqda'}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center sm:items-end text-center sm:text-right gap-3 flex-1">
              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center">
                <img
                  src={featuredMatch.awayTeam.crestUrl}
                  alt={featuredMatch.awayTeam.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {featuredMatch.awayTeam.name}
                </h3>
                <span className="text-xs text-slate-400">Mehmon</span>
              </div>
            </div>
          </div>

          {/* Action and Venue Info */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {/* Prominent TV Channel Banner */}
            <div className="flex items-center gap-3 p-3 bg-slate-950/90 rounded-xl border border-emerald-500/30 shadow-lg">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Tv className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Namoyish etuvchi telekanal:
                </span>
                <span className="text-sm sm:text-base font-extrabold text-white tracking-wide truncate block">
                  {featuredMatch.broadcaster?.name || "Sport TV (MTRK)"}
                </span>
              </div>
            </div>

            {featuredMatch.venue && (
              <div className="flex items-center gap-2 text-xs text-slate-300 px-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{featuredMatch.venue}</span>
              </div>
            )}

            {/* Primary Watch Action */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => onWatchMatch(featuredMatch)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-950 bg-emerald-400 rounded-xl hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{isLive ? 'Jonli efirni tomosha qilish' : 'Efir tafsilotlari'}</span>
              </button>

              <button
                onClick={onOpenTelegram}
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all"
                title="Telegram botida eslatma o'rnatish"
              >
                <Send className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Eslatma olish</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
