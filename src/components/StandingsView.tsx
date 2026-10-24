/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { League, StandingItem } from '../types/index.ts';
import { api } from '../services/api.ts';
import { Trophy } from 'lucide-react';

interface StandingsViewProps {
  leagues: League[];
}

export const StandingsView: React.FC<StandingsViewProps> = ({ leagues }) => {
  const [selectedLeagueCode, setSelectedLeagueCode] = useState<string>('UZ_SL');
  const [standings, setStandings] = useState<StandingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadStandings() {
      setLoading(true);
      try {
        const data = await api.getStandings(selectedLeagueCode);
        setStandings(data.standings || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStandings();
  }, [selectedLeagueCode]);

  return (
    <div className="space-y-6">
      {/* Title & League Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-400" />
            <span>Turnir Jadvali va Chempionatlar</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Mavsum: 2025/2026. Barcha ochkolar va to'plar nisbati rasmiy protokollar asosida hisoblanadi.
          </p>
        </div>

        {/* League Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          {leagues.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedLeagueCode(l.code)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedLeagueCode === l.code
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Standings Table Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            Jadval ma'lumotlari yuklanmoqda...
          </div>
        ) : standings.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            Ushbu liga uchun jadval ma'lumotlari tez orada yangilanadi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3 w-12 text-center">#</th>
                  <th scope="col" className="px-4 py-3">Jamoa</th>
                  <th scope="col" className="px-3 py-3 text-center">O'</th>
                  <th scope="col" className="px-3 py-3 text-center">G'</th>
                  <th scope="col" className="px-3 py-3 text-center">D</th>
                  <th scope="col" className="px-3 py-3 text-center">M</th>
                  <th scope="col" className="px-3 py-3 text-center hidden sm:table-cell">To'plar</th>
                  <th scope="col" className="px-3 py-3 text-center hidden sm:table-cell">Farq</th>
                  <th scope="col" className="px-4 py-3 text-center font-bold text-white">Ochko</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {standings.map((item) => (
                  <tr
                    key={item.team.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-center font-mono tabular-nums">
                      <span
                        className={`inline-block w-6 h-6 leading-6 rounded-full text-xs font-semibold ${
                          item.position <= 3
                            ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-slate-800 p-0.5 flex items-center justify-center shrink-0">
                          <img
                            src={item.team.crestUrl}
                            alt={item.team.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <span className="font-semibold text-white truncate">{item.team.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-mono tabular-nums text-slate-300">{item.playedGames}</td>
                    <td className="px-3 py-3 text-center font-mono tabular-nums text-emerald-400">{item.won}</td>
                    <td className="px-3 py-3 text-center font-mono tabular-nums text-slate-400">{item.draw}</td>
                    <td className="px-3 py-3 text-center font-mono tabular-nums text-rose-400">{item.lost}</td>
                    <td className="px-3 py-3 text-center font-mono tabular-nums text-slate-400 hidden sm:table-cell">
                      {item.goalsFor}:{item.goalsAgainst}
                    </td>
                    <td className="px-3 py-3 text-center font-mono tabular-nums text-slate-400 hidden sm:table-cell">
                      {item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference}
                    </td>
                    <td className="px-4 py-3 text-center font-mono tabular-nums font-bold text-white text-base">
                      {item.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
