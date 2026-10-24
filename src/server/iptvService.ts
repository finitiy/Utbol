/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IptvChannel {
  id: string;
  name: string;
  logo: string;
  category: 'O\'zbekiston' | 'Rossiya' | 'Xalqaro' | 'Ommabop';
  groupTitle?: string;
  url: string;
  quality?: string;
  country?: string;
}

// High-priority verified partner channels in Uzbekistan
const PINNED_CHANNELS: IptvChannel[] = [
  {
    id: 'ch-sport-uz',
    name: "Sport TV (MTRK)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Sport_TV_Uzbekistan.png/320px-Sport_TV_Uzbekistan.png",
    category: "Ommabop",
    groupTitle: "O'zbekiston Milliy",
    url: "https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8",
    quality: "1080p FHD",
    country: "O'zbekiston",
  },
  {
    id: 'ch-uzreport',
    name: "UzReport TV HD",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/UZREPORT_TV_logo.png/320px-UZREPORT_TV_logo.png",
    category: "Ommabop",
    groupTitle: "La Liga & UCL",
    url: "https://streamtv.as3sport.online:3394/hybrid/play.m3u8",
    quality: "1080p Live",
    country: "O'zbekiston",
  },
  {
    id: 'ch-futbol-tv',
    name: "Futbol TV",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Futbol_TV_logo.png/320px-Futbol_TV_logo.png",
    category: "Ommabop",
    groupTitle: "Superliga & Kubok",
    url: "https://rmtv.akamaized.net/hls/live/2043153/rmtv-es-web/master.m3u8",
    quality: "1080p HD",
    country: "O'zbekiston",
  },
  {
    id: 'ch-setanta-1',
    name: "Setanta Sports 1 HD",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Setanta_Sports_Logo.png/320px-Setanta_Sports_Logo.png",
    category: "Ommabop",
    groupTitle: "Premyer-liga & A Seriya",
    url: "https://africa24.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8",
    quality: "1080p 50fps",
    country: "Xalqaro",
  },
  {
    id: 'ch-setanta-2',
    name: "Setanta Sports 2 HD",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Setanta_Sports_Logo.png/320px-Setanta_Sports_Logo.png",
    category: "Ommabop",
    groupTitle: "Bundesliga, F1 & UFC",
    url: "https://streamtv.as3sport.online:3394/hybrid/play.m3u8",
    quality: "1080p HD",
    country: "Xalqaro",
  },
  {
    id: 'ch-fifa-plus',
    name: "FIFA+ Football Arena",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80",
    category: "Ommabop",
    groupTitle: "FIFA Rasmiy Oqim",
    url: "https://jmp2.uk/plu-660c29b5aec9680008f5b4a4.m3u8",
    quality: "720p HD",
    country: "Xalqaro",
  },
];

class IptvService {
  private channels: IptvChannel[] = [...PINNED_CHANNELS];
  private lastFetchedAt: number = 0;
  private isFetching: boolean = false;
  private readonly CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

  constructor() {
    this.refreshFeeds().catch((err) => {
      console.warn('Initial IPTV feeds fetch warning:', err.message);
    });
  }

  private parseM3U(content: string, defaultCategory: IptvChannel['category'], defaultCountry: string): IptvChannel[] {
    const lines = content.split('\n');
    const result: IptvChannel[] = [];
    const defaultLogo = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const commaIdx = line.lastIndexOf(',');
        const name = commaIdx !== -1 ? line.substring(commaIdx + 1).trim() : 'Telekanal';
        const logoMatch = line.match(/tvg-logo=\"([^\"]+)\"/);
        const logo = logoMatch ? logoMatch[1] : defaultLogo;
        const groupMatch = line.match(/group-title=\"([^\"]+)\"/);
        const groupTitle = groupMatch ? groupMatch[1] : 'Sport';

        const nextLine = (lines[i + 1] || '').trim();
        if (nextLine.startsWith('http')) {
          // Detect resolution from name e.g. (1080p), (720p)
          const qualityMatch = name.match(/\((\d+p)\)/i);
          const quality = qualityMatch ? qualityMatch[1] : 'HD';

          result.push({
            id: `iptv-${defaultCategory.toLowerCase()}-${result.length + 1}`,
            name: name.replace(/\s*\(\d+p\)/gi, '').trim(),
            logo,
            category: defaultCategory,
            groupTitle,
            url: nextLine,
            quality,
            country: defaultCountry,
          });
        }
      }
    }
    return result;
  }

  public async refreshFeeds(force = false): Promise<void> {
    const now = Date.now();
    if (!force && this.channels.length > PINNED_CHANNELS.length && (now - this.lastFetchedAt) < this.CACHE_TTL_MS) {
      return;
    }

    if (this.isFetching) return;
    this.isFetching = true;

    try {
      console.log('[IPTV] Fetching latest M3U playlists from iptv-org...');

      const [uzRes, sportsRes, ruRes] = await Promise.allSettled([
        fetch('https://iptv-org.github.io/iptv/countries/uz.m3u'),
        fetch('https://iptv-org.github.io/iptv/categories/sports.m3u'),
        fetch('https://iptv-org.github.io/iptv/countries/ru.m3u'),
      ]);

      let uzChannels: IptvChannel[] = [];
      if (uzRes.status === 'fulfilled' && uzRes.value.ok) {
        const uzText = await uzRes.value.text();
        uzChannels = this.parseM3U(uzText, "O'zbekiston", "O'zbekiston");
      }

      let sportsChannels: IptvChannel[] = [];
      if (sportsRes.status === 'fulfilled' && sportsRes.value.ok) {
        const sportsText = await sportsRes.value.text();
        // Limit sports channels to top 150 to keep response fast and clean
        sportsChannels = this.parseM3U(sportsText, 'Xalqaro', 'Xalqaro').slice(0, 150);
      }

      let ruChannels: IptvChannel[] = [];
      if (ruRes.status === 'fulfilled' && ruRes.value.ok) {
        const ruText = await ruRes.value.text();
        const allRu = this.parseM3U(ruText, 'Rossiya', 'Rossiya');
        // Filter sports, match tv, and khl channels
        ruChannels = allRu.filter((c) =>
          /match|спорт|sport|khl|кхл|футбол|боец|арена/i.test(c.name)
        );
      }

      // Merge pinned + uz + ru sports + global sports
      this.channels = [
        ...PINNED_CHANNELS,
        ...uzChannels,
        ...ruChannels,
        ...sportsChannels,
      ];

      this.lastFetchedAt = Date.now();
      console.log(`[IPTV] Successfully loaded ${this.channels.length} channels from iptv-org.`);
    } catch (err: any) {
      console.error('[IPTV] Error refreshing feeds:', err.message);
    } finally {
      this.isFetching = false;
    }
  }

  public getChannels(params?: { category?: string; query?: string }): { channels: IptvChannel[]; total: number } {
    let result = [...this.channels];

    if (params?.category && params.category !== 'ALL') {
      result = result.filter((c) => c.category === params.category);
    }

    if (params?.query && params.query.trim()) {
      const q = params.query.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.groupTitle?.toLowerCase().includes(q) ||
          c.country?.toLowerCase().includes(q)
      );
    }

    return {
      channels: result,
      total: result.length,
    };
  }
}

export const iptvService = new IptvService();
