/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Match } from '../types/index.ts';
import { Star, Tv, ChevronRight } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  isFavorite: boolean;
  onToggleFavorite: (teamId: string) => void;
  onSelectMatch: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  isFavorite,
  onToggleFavorite,
  onSelectMatch,
}) => {
  const isLive = match.status === 'IN_PLAY';
  const isFinished = match.status === 'FINISHED';

  const defaultCrest = 'https://a.espncdn.com/i/teamlogos/soccer/500/default-team-logo.png';
  const homeTeam = match.homeTeam || { id: '', name: 'Mezbon', shortName: 'Mezbon', crestUrl: defaultCrest, tla: 'HOM', leagueId: '' };
  const awayTeam = match.awayTeam || { id: '', name: 'Mehmon', shortName: 'Mehmon', crestUrl: defaultCrest, tla: 'AWY', leagueId: '' };

  return (
    <div
      onClick={() => onSelectMatch(match)}
      className="group relative cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all duration-200 hover:shadow-xl"
    >
      {/* Top Card Kicker: League & Time */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-slate-300 truncate">{match.leagueName}</span>
          {match.competitionRound && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400 text-[11px] truncate">{match.competitionRound}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 text-rose-400 font-semibold tracking-wide text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>JONLI {match.minute}'</span>
            </span>
          ) : isFinished ? (
            <span className="text-slate-400 text-xs font-medium">Tugadi</span>
          ) : (
            <span className="text-emerald-400 font-mono text-xs font-medium">{match.kickoffTashkent}</span>
          )}

          {/* Favorite Toggle Star */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (homeTeam.id) {
                onToggleFavorite(homeTeam.id);
              }
            }}
            className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
            title="Sevimli jamoalarga qo'shish"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Teams and Scores Matrix */}
      <div className="space-y-3 py-1">
        {/* Home Team Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700/60 p-1 flex items-center justify-center shrink-0">
              <img
                src={homeTeam.crestUrl || defaultCrest}
                alt={homeTeam.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultCrest;
                }}
              />
            </div>
            <span className="text-sm font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
              {homeTeam.name}
            </span>
          </div>

          <div className="text-right shrink-0">
            {isLive || isFinished ? (
              <span className="text-base font-bold font-mono text-white tabular-nums px-2 py-0.5 rounded bg-slate-800/80">
                {match.homeScore ?? 0}
              </span>
            ) : (
              <span className="text-xs text-slate-500">-</span>
            )}
          </div>
        </div>

        {/* Away Team Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700/60 p-1 flex items-center justify-center shrink-0">
              <img
                src={awayTeam.crestUrl || defaultCrest}
                alt={awayTeam.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultCrest;
                }}
              />
            </div>
            <span className="text-sm font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
              {awayTeam.name}
            </span>
          </div>

          <div className="text-right shrink-0">
            {isLive || isFinished ? (
              <span className="text-base font-bold font-mono text-white tabular-nums px-2 py-0.5 rounded bg-slate-800/80">
                {match.awayScore ?? 0}
              </span>
            ) : (
              <span className="text-xs text-slate-500">-</span>
            )}
          </div>
        </div>
      </div>

      {/* Prominent TV Channel Banner ("Qaysi kanalda namoyish etiladi") */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-700/80 text-slate-200 font-bold text-xs truncate shadow-inner">
          <Tv className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400 font-normal">Kanal:</span>
          <span className="text-emerald-300 font-bold tracking-wide truncate">
            {match.broadcaster?.name || "Sport TV (MTRK)"}
          </span>
        </div>

        <div className="flex items-center gap-1 font-medium group-hover:translate-x-0.5 transition-transform shrink-0">
          <span className={isLive ? "text-rose-400 font-bold flex items-center gap-1 text-xs" : "text-emerald-400 font-semibold text-xs"}>
            {isLive ? "▶ Jonli efir" : "Efir tafsiloti"}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </div>
  );
};
