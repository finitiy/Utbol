/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Match } from '../types/index.ts';
import { X, ExternalLink, ShieldCheck, Tv, MapPin, Calendar, Clock } from 'lucide-react';

interface MatchStreamModalProps {
  match: Match | null;
  onClose: () => void;
}

export const MatchStreamModal: React.FC<MatchStreamModalProps> = ({ match, onClose }) => {
  if (!match) return null;

  const isLive = match.status === 'IN_PLAY';
  const hasStream = Boolean(match.streamUrl);
  const broadcaster = match.broadcaster;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{match.leagueName}</span>
            {match.competitionRound && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">{match.competitionRound}</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player / Broadcaster Container */}
        <div className="p-6 space-y-6">
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center text-center p-6">
            {isLive ? (
              <div className="space-y-4 max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>JONLI EFIR ({match.minute}'-daqiqa)</span>
                </div>

                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  {match.homeTeam.name} {match.homeScore ?? 0} : {match.awayScore ?? 0} {match.awayTeam.name}
                </div>

                <p className="text-xs text-slate-400">
                  Ushbu uchrashuv O'zbekiston hududida <strong>{broadcaster?.name || "Rasmiy telekanal"}</strong> orqali eksklyuziv translyatsiya qilinmoqda.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  {broadcaster?.websiteUrl && (
                    <a
                      href={broadcaster.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{broadcaster.name} rasmiy saytida ko'rish</span>
                    </a>
                  )}

                  {match.streamUrl && (
                    <a
                      href={match.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      <span>To'g'ridan-to'g'ri pleyer</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-w-md">
                <Tv className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-lg font-bold text-white">
                  {match.status === 'FINISHED' ? 'Uchrashuv yakunlandi' : 'Uchrashuv hali boshlanmadi'}
                </h4>
                <p className="text-xs text-slate-400">
                  {match.status === 'FINISHED'
                    ? `Yakuniy hisob: ${match.homeScore ?? 0} : ${match.awayScore ?? 0}. Uchrashuv sharhlari va gollar video lavhalari tez orada taqdim etiladi.`
                    : `Boshlanish vaqti Toshkent vaqti bilan ${match.kickoffTashkent}. Efir rasmiy teleradiokompaniyalar orqali uzatiladi.`}
                </p>
                {broadcaster?.websiteUrl && (
                  <a
                    href={broadcaster.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors mt-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{broadcaster.name} telekanaliga o'tish</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Legal Compliance Banner (Requirement 7) */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-200">Litsenziyalangan translyatsiya kafolati:</span>
              <p>
                Futbol Live Uzbekistan faqat rasmiy litsenziyaga ega mahalliy va xalqaro media hamkorlar (O'zbekiston MTRK "Sport TV", "UzReport TV", "Setanta Sports") ochiq havolalarini taqdim etadi. Noqonuniy piratik strimlar yoki mualliflik huquqini buzuvchi manbalar joylashtirilmaydi.
              </p>
            </div>
          </div>

          {/* Match Details Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Vaqt (Toshkent UTC+5)</span>
              </div>
              <div className="font-semibold text-slate-200">{match.kickoffTashkent}</div>
            </div>

            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Stadion</span>
              </div>
              <div className="font-semibold text-slate-200 truncate">{match.venue || "Markaziy Arena"}</div>
            </div>

            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Tv className="w-3.5 h-3.5" />
                <span>Telekanal</span>
              </div>
              <div className="font-semibold text-emerald-400 truncate">{broadcaster?.name || "Sport TV"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
