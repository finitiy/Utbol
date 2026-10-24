/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match, StandingItem } from '../types/index.ts';
import { formatTashkentTime, db } from './db.ts';

export interface FootballDataProvider {
  name: string;
  isAvailable(): boolean;
  getMatches(): Promise<Match[]>;
  getStandings(leagueCode: string): Promise<StandingItem[]>;
  syncWithDatabase(): Promise<{ syncedCount: number; status: string }>;
}

/**
 * Football-Data.org API Provider implementation
 * Free tier covers: Premier League (PL), Champions League (CL), Primera Division (PD), Serie A (SA), etc.
 * Free tier rate limit: 10 calls per minute.
 */
export class FootballDataOrgProvider implements FootballDataProvider {
  public name = 'football-data.org (v4)';
  private apiKey: string;
  private cache: { matches: Match[]; timestamp: number } | null = null;
  private cacheDurationMs = 60 * 1000; // 60 seconds caching for rate-limit protection

  constructor() {
    this.apiKey = process.env.FOOTBALL_API_KEY || '';
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'YOUR_FOOTBALL_DATA_ORG_API_KEY');
  }

  public async getMatches(): Promise<Match[]> {
    // Check in-memory cache
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheDurationMs) {
      return this.cache.matches;
    }

    if (!this.isAvailable()) {
      // Graceful fallback to verified database entries (Superliga + UCL + EPL)
      return Array.from(db.matches.values());
    }

    try {
      const response = await fetch('https://api.football-data.org/v4/matches', {
        headers: {
          'X-Auth-Token': this.apiKey,
        },
      });

      if (!response.ok) {
        console.warn(`football-data.org API returned ${response.status}. Using cached/fallback store.`);
        return Array.from(db.matches.values());
      }

      const data = await response.json();
      const matches: Match[] = (data.matches || []).map((m: any) => {
        const utcDateStr = m.utcDate;
        const tashkentTime = formatTashkentTime(utcDateStr);

        return {
          id: `fdo-${m.id}`,
          externalId: m.id.toString(),
          leagueId: `league-${(m.competition?.code || 'GEN').toLowerCase()}`,
          leagueName: m.competition?.name || 'Xalqaro Chempionat',
          homeTeam: {
            id: `team-${m.homeTeam?.id || Math.random()}`,
            name: m.homeTeam?.name || 'Home Team',
            shortName: m.homeTeam?.shortName || m.homeTeam?.name || 'Home',
            tla: m.homeTeam?.tla || '',
            crestUrl: m.homeTeam?.crest || 'https://crests.football-data.org/PL.png',
            leagueId: `league-${(m.competition?.code || 'GEN').toLowerCase()}`,
          },
          awayTeam: {
            id: `team-${m.awayTeam?.id || Math.random()}`,
            name: m.awayTeam?.name || 'Away Team',
            shortName: m.awayTeam?.shortName || m.awayTeam?.name || 'Away',
            tla: m.awayTeam?.tla || '',
            crestUrl: m.awayTeam?.crest || 'https://crests.football-data.org/PL.png',
            leagueId: `league-${(m.competition?.code || 'GEN').toLowerCase()}`,
          },
          utcDate: utcDateStr,
          kickoffTashkent: tashkentTime,
          status: m.status === 'IN_PLAY' || m.status === 'PAUSED' ? 'IN_PLAY' : m.status === 'FINISHED' ? 'FINISHED' : 'SCHEDULED',
          minute: m.minute || (m.status === 'IN_PLAY' ? 45 : undefined),
          homeScore: m.score?.fullTime?.home ?? (m.status === 'IN_PLAY' ? 0 : undefined),
          awayScore: m.score?.fullTime?.away ?? (m.status === 'IN_PLAY' ? 0 : undefined),
          venue: m.venue || 'Asosiy Stadion',
          competitionRound: m.matchday ? `${m.matchday}-tur` : undefined,
          isPublished: true,
          broadcaster: {
            id: 'bc-official',
            name: 'Sport TV / UzReport / Setanta',
            websiteUrl: 'https://mtrk.uz/uz/tv/sport',
            country: "O'zbekiston",
            isOfficialPartner: true,
          },
        };
      });

      this.cache = { matches, timestamp: Date.now() };
      return matches;
    } catch (err) {
      console.error('Error fetching from football-data.org:', err);
      return Array.from(db.matches.values());
    }
  }

  public async getStandings(leagueCode: string): Promise<StandingItem[]> {
    if (leagueCode === 'UZ_SL' || leagueCode === 'league-uz-superliga') {
      return db.getSuperligaStandings();
    }

    if (!this.isAvailable()) {
      return db.getSuperligaStandings();
    }

    try {
      const response = await fetch(`https://api.football-data.org/v4/competitions/${leagueCode}/standings`, {
        headers: { 'X-Auth-Token': this.apiKey },
      });

      if (!response.ok) {
        return db.getSuperligaStandings();
      }

      const data = await response.json();
      const table = data.standings?.[0]?.table || [];
      return table.map((item: any) => ({
        position: item.position,
        team: {
          id: `team-${item.team.id}`,
          name: item.team.name,
          shortName: item.team.shortName || item.team.name,
          tla: item.team.tla || '',
          crestUrl: item.team.crest,
          leagueId: leagueCode,
        },
        playedGames: item.playedGames,
        won: item.won,
        draw: item.draw,
        lost: item.lost,
        points: item.points,
        goalsFor: item.goalsFor,
        goalsAgainst: item.goalsAgainst,
        goalDifference: item.goalDifference,
      }));
    } catch {
      return db.getSuperligaStandings();
    }
  }

  public async syncWithDatabase(): Promise<{ syncedCount: number; status: string }> {
    const freshMatches = await this.getMatches();
    let count = 0;
    freshMatches.forEach((m) => {
      db.matches.set(m.id, m);
      count++;
    });

    db.addAuditLog('system', 'Football Data API', 'SYNC', `${count} ta o'yin ma'lumotlari yangilandi`);
    return { syncedCount: count, status: 'Muvaffaqiyatli sinxronlashtirildi' };
  }
}

export const footballProvider = new FootballDataOrgProvider();
