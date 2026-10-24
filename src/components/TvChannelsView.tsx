/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer.tsx';
import { 
  Tv, 
  Radio, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  ExternalLink, 
  Share2, 
  Plus, 
  AlertCircle 
} from 'lucide-react';

export interface TvChannel {
  id: string;
  name: string;
  logoUrl?: string;
  category: 'O\'zbekiston' | 'Xalqaro' | 'Sport' | 'Boshqa';
  description: string;
  url: string;
  quality: string;
  isPopular?: boolean;
}

const DEFAULT_CHANNELS: TvChannel[] = [
  {
    id: 'ch-sport-uz',
    name: "Sport TV (MTRK)",
    category: "O'zbekiston",
    description: "O'zbekiston Superligasi, O'zbekiston Kubogi, OChL va milliy chempionatlar jonli efiri",
    url: "https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8",
    quality: "1080p FHD",
    isPopular: true,
  },
  {
    id: 'ch-uzreport',
    name: "UzReport TV HD",
    category: "O'zbekiston",
    description: "Ispaniya La Ligasi, UEFA Chempionlar Ligasi, Yevro-2024 va tahliliy ko'rsatuvlar",
    url: "https://streamtv.as3sport.online:3394/hybrid/play.m3u8",
    quality: "1080p HD",
    isPopular: true,
  },
  {
    id: 'ch-futbol-tv',
    name: "Futbol TV",
    category: "O'zbekiston",
    description: "Superliga o'yinlari, Angliya Kubogi, sharhlar va futbol olamidagi eng so'nggi yangiliklar",
    url: "https://rmtv.akamaized.net/hls/live/2043153/rmtv-es-web/master.m3u8",
    quality: "1080p HD",
    isPopular: true,
  },
  {
    id: 'ch-setanta-1',
    name: "Setanta Sports 1 HD",
    category: "Xalqaro",
    description: "Angliya Premyer-ligasi (APL), Italiya A Seriyasi, Germaniya Bundesligasi to'liq jonli efirlari",
    url: "https://africa24.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8",
    quality: "1080p 50fps",
    isPopular: true,
  },
  {
    id: 'ch-setanta-2',
    name: "Setanta Sports 2 HD",
    category: "Xalqaro",
    description: "Fransiya Liga 1, Formula 1, UFC janglari va xalqaro sport musobaqalari",
    url: "https://streamtv.as3sport.online:3394/hybrid/play.m3u8",
    quality: "1080p Live",
    isPopular: false,
  },
  {
    id: 'ch-fifa-plus',
    name: "FIFA+ Football Arena",
    category: "Xalqaro",
    description: "FIFA rasmiy kanali: Jahon chempionatlari, yoshlar turnirlari va futbol afsonalari",
    url: "https://jmp2.uk/plu-660c29b5aec9680008f5b4a4.m3u8",
    quality: "720p HD",
    isPopular: false,
  },
  {
    id: 'ch-mux-test',
    name: "MUX Sports Ultra HD",
    category: "Sport",
    description: "Multi-bitrate yuqori tezlikdagi test sport translyatsiyasi oqimi",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    quality: "1080p 60fps",
    isPopular: false,
  },
];

export const TvChannelsView: React.FC = () => {
  const [channels, setChannels] = useState<TvChannel[]>(DEFAULT_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<TvChannel>(DEFAULT_CHANNELS[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Custom Stream URL test input
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [showAddCustom, setShowAddCustom] = useState<boolean>(false);

  // Load from /channels.json if available
  useEffect(() => {
    fetch('/channels.json')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const merged: TvChannel[] = data.map((item: any, idx: number) => ({
            id: item.id || `ch-json-${idx}`,
            name: item.name || 'Telekanal',
            category: (item.category as any) || "O'zbekiston",
            description: item.description || "Sport va futbol musobaqalarining rasmiy jonli efiri",
            url: item.url,
            quality: item.quality || "1080p HD",
            isPopular: idx < 3,
          }));
          setChannels(merged);
          setSelectedChannel(merged[0]);
        }
      })
      .catch(() => {
        // Fallback to default channels list
      });
  }, []);

  const filteredChannels = channels.filter((ch) => {
    if (selectedCategory !== 'ALL' && ch.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return ch.name.toLowerCase().includes(q) || ch.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handlePlayChannel = (channel: TvChannel) => {
    setSelectedChannel(channel);
    // Smooth scroll to player on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const newChannel: TvChannel = {
      id: `custom-${Date.now()}`,
      name: customName.trim() || `Maxsus Efir (${channels.length + 1})`,
      category: 'Sport',
      description: "Foydalanuvchi tomonidan qo'shilgan .m3u8 IPTV oqimi",
      url: customUrl.trim(),
      quality: "Auto / Direct",
      isPopular: true,
    };

    setChannels([newChannel, ...channels]);
    setSelectedChannel(newChannel);
    setCustomUrl('');
    setCustomName('');
    setShowAddCustom(false);
  };

  const handleShareWebApp = () => {
    const webAppUrl = `${window.location.origin}/player.html?url=${encodeURIComponent(selectedChannel.url)}&name=${encodeURIComponent(selectedChannel.name)}`;
    if (navigator.share) {
      navigator.share({
        title: `${selectedChannel.name} - Futbol Live UZ`,
        text: `${selectedChannel.name} kanalini jonli efirda tomosha qiling!`,
        url: webAppUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(webAppUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Tv className="w-6 h-6" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Jonli Telekanallar & IPTV
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Sport TV, UzReport TV, Futbol TV va xalqaro sport kanallarining to'g'ridan-to'g'ri .m3u8 efirlari.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 rounded-xl hover:bg-emerald-900/60 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Havola (.m3u8) qo'shish</span>
          </button>

          <button
            onClick={handleShareWebApp}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Telegram WebApp havolasini nusxalash"
          >
            <Share2 className="w-4 h-4 text-sky-400" />
            <span>{copiedLink ? "Nusxalandi! ✓" : "Ulashish"}</span>
          </button>
        </div>
      </div>

      {/* 2. Custom Stream Link Input Modal / Dropdown */}
      {showAddCustom && (
        <form onSubmit={handleAddCustomStream} className="p-4 sm:p-5 bg-slate-900/90 border border-emerald-500/40 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>O'z IPTV oqimingizni (.m3u8) sinab ko'ring</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Yopish ✕
            </button>
          </div>
          <p className="text-xs text-slate-400">
            GitHub (iptv-org) yoki boshqa manbalardan olingan har qanday HLS (.m3u8) havolani kiriting:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Kanal nomi (masalan: Match TV)"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="url"
              required
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://.../stream.m3u8"
              className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddCustom(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              Oqimni ishga tushirish ▶
            </button>
          </div>
        </form>
      )}

      {/* 3. Main Live Player Section */}
      <div className="space-y-3">
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          <VideoPlayer
            streamUrl={selectedChannel.url}
            streamType="HLS"
            title={selectedChannel.name}
            autoPlay={true}
          />
        </div>

        {/* Current Playing Channel Bar */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white truncate">{selectedChannel.name}</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">
                  JONLI EFIR
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">{selectedChannel.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-950 text-emerald-400 border border-slate-800 rounded-lg">
              {selectedChannel.quality}
            </span>
            <a
              href={`/player.html?url=${encodeURIComponent(selectedChannel.url)}&name=${encodeURIComponent(selectedChannel.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              <span>Alohida oynada</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'Barcha Kanallar' },
            { id: "O'zbekiston", label: "🇺🇿 O'zbekiston" },
            { id: 'Xalqaro', label: '🌍 Xalqaro Sport' },
            { id: 'Sport', label: '⚽️ Futbol & Arena' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-colors font-medium cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kanal qidirish..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* 5. IPTV Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChannels.map((channel) => {
          const isCurrent = selectedChannel.id === channel.id;
          return (
            <div
              key={channel.id}
              onClick={() => handlePlayChannel(channel)}
              className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 ${
                isCurrent
                  ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700/60'
                    }`}>
                      <Tv className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                        {channel.name}
                      </h4>
                      <span className="text-[11px] text-slate-400">{channel.category}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-950 text-slate-300 border border-slate-800 rounded">
                    {channel.quality}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {channel.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-semibold">Oqim faol</span>
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 group-hover:bg-emerald-500 group-hover:text-slate-950'
                }`}>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isCurrent ? "O'ynalmoqda" : "Efirni ko'rish"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
