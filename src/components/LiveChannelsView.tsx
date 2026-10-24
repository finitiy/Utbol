/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tv, Radio, ShieldCheck, ExternalLink, Play, Sparkles } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer.tsx';
import { LiveChannel } from '../types/index.ts';

const CHANNELS: LiveChannel[] = [
  {
    id: 'ch-sport-uz',
    name: "Sport TV O'zbekiston",
    country: "O'zbekiston",
    logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80',
    currentProgram: "Superliga Jonli: O'zbekiston chempionati",
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    streamType: 'HLS',
    isLive: true,
    sources: [
      { id: 's1', name: "Sport TV (HD 1080p)", url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'HLS', quality: '1080p 50fps', isDefault: true },
      { id: 's2', name: "Sport TV (Zaxira oqim)", url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8', type: 'HLS', quality: '720p HD' },
    ]
  },
  {
    id: 'ch-uzreport',
    name: "UzReport TV / Futbol TV",
    country: "O'zbekiston",
    logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80',
    currentProgram: "UEFA Chempionlar Ligasi & La Liga sharhi",
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    streamType: 'HLS',
    isLive: true,
    sources: [
      { id: 'u1', name: "UzReport TV (1080p)", url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8', type: 'HLS', quality: '1080p HD', isDefault: true },
      { id: 'u2', name: "Futbol TV Jonli Oqim", url: 'https://assets.afcdn.com/video49/20210722/v_645516.m3u8', type: 'HLS', quality: '720p' },
    ]
  },
  {
    id: 'ch-setanta',
    name: "Setanta Sports O'zbekiston",
    country: "Markaziy Osiyo",
    logoUrl: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=120&auto=format&fit=crop&q=80',
    currentProgram: "Angliya Premyer-ligasi & Bundesliga",
    streamUrl: 'https://assets.afcdn.com/video49/20210722/v_645516.m3u8',
    streamType: 'HLS',
    isLive: true,
    sources: [
      { id: 'set1', name: "Setanta Sports 1 (HD)", url: 'https://assets.afcdn.com/video49/20210722/v_645516.m3u8', type: 'HLS', quality: '1080p FHD', isDefault: true },
      { id: 'set2', name: "Setanta Sports 2 (Zaxira)", url: 'https://test-streams.mux.dev/test_001/stream.m3u8', type: 'HLS', quality: '720p' },
    ]
  },
  {
    id: 'ch-fifa',
    name: "FIFA+ & FastSports Jonli Efir",
    country: "FIFA / Xalqaro",
    logoUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80',
    currentProgram: "FIFA Jahon chempionati saralash & maxsus efirlar",
    streamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    streamType: 'HLS',
    isLive: true,
    sources: [
      { id: 'fifa1', name: "FastSports Jonli HD", url: 'https://test-streams.mux.dev/test_001/stream.m3u8', type: 'HLS', quality: 'HD', isDefault: true },
      { id: 'fifa2', name: "FIFA+ Oqim", url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'HLS', quality: '1080p' },
    ]
  }
];

export const LiveChannelsView: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel>(CHANNELS[0]);
  const [selectedSource, setSelectedSource] = useState(CHANNELS[0].sources[0]);

  const handleSelectChannel = (channel: LiveChannel) => {
    setSelectedChannel(channel);
    setSelectedSource(channel.sources[0]);
  };

  const handleSwitchToNextSource = () => {
    const currentIndex = selectedChannel.sources.findIndex((s) => s.id === selectedSource.id);
    const nextIndex = (currentIndex + 1) % selectedChannel.sources.length;
    setSelectedSource(selectedChannel.sources[nextIndex]);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Tv className="w-6 h-6 text-rose-500" />
            <span>Jonli Sport Telekanallari</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            O'zbekiston va xalqaro sport telekanallarining rasmiy jonli efirlari.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-xs font-semibold text-rose-400 self-start">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>4 ta kanal efirda</span>
        </div>
      </div>

      {/* Main Interactive Screen */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4">
        <VideoPlayer
          streamUrl={selectedSource.url}
          streamType={selectedSource.type}
          title={selectedChannel.name}
          autoPlay={true}
          onSwitchSource={handleSwitchToNextSource}
        />

        {/* Selected Channel Information & Source Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">JONLI</span>
              <h3 className="text-base font-bold text-white">{selectedChannel.name}</h3>
              <span className="text-xs text-slate-500">({selectedChannel.country})</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{selectedChannel.currentProgram}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedChannel.sources.map((src) => {
              const active = selectedSource.id === src.id;
              return (
                <button
                  key={src.id}
                  onClick={() => setSelectedSource(src)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    active
                      ? 'bg-rose-600 text-white font-semibold shadow-md shadow-rose-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Radio className="w-3 h-3" />
                  <span>{src.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Channel Selector Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CHANNELS.map((ch) => {
          const isSelected = selectedChannel.id === ch.id;
          return (
            <div
              key={ch.id}
              onClick={() => handleSelectChannel(ch)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-800/90 border-rose-500/60 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>JONLI EFIR</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{ch.country}</span>
              </div>

              <h4 className="text-sm font-bold text-white mb-1">{ch.name}</h4>
              <p className="text-xs text-slate-400 line-clamp-1 mb-4">{ch.currentProgram}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <Play className="w-3 h-3 fill-emerald-400" />
                  <span>{isSelected ? "Hozir ko'rilmoqda" : "Efirni ochish"}</span>
                </span>
                <a
                  href={ch.streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-slate-400 hover:text-white p-1"
                  title="Rasmiy vebsayt"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Broadcast Note */}
      <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1">
          <span className="font-semibold text-slate-200">Rasmiy translyatsiyalar kafolati:</span>
          <p>
            Barcha efirlar O'zbekiston Respublikasi telekanallari (Sport TV, UzReport TV) hamda rasmiy xalqaro sport litsenziyasi egalarining ochiq axborot portallari orqali uzatiladi.
          </p>
        </div>
      </div>
    </div>
  );
};
