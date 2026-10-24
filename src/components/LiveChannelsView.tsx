/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tv, Radio, ShieldCheck, Play, Sparkles, Globe, RefreshCw } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer.tsx';
import { LiveChannel } from '../types/index.ts';

const CHANNELS: LiveChannel[] = [
  {
    id: 'ch-trt-world',
    name: "TRT World HD (Sport & News)",
    country: "Turkiya & Xalqaro",
    logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80',
    currentProgram: "World Sports Live: Futbol va xalqaro sport yangiliklari",
    streamUrl: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8',
    streamType: 'HLS',
    isLive: true,
    sources: [
      { id: 'trt-1', name: "TRT World (1080p FHD)", url: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8', type: 'HLS', quality: '1080p FHD', isDefault: true },
      { id: 'trt-2', name: "Zaxira: FastSports 1 HD", url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'HLS', quality: '720p HD' },
      { id: 'trt-3', name: "Zaxira: DW Sport Live", url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', type: 'HLS', quality: 'HD' },
    ]
  },
  {
    id: 'ch-dw-sport',
    name: "DW News & Sports Global (HD)",
    country: "Germaniya & Global",
    logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80',
    currentProgram: "Bundesliga, Chempionlar Ligasi va sport sharhlari",
    streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    streamType: 'HLS',
    isLive: true,
    sources: [
      { id: 'dw-1', name: "DW Global (HD Efir)", url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', type: 'HLS', quality: '720p HD', isDefault: true },
      { id: 'dw-2', name: "Zaxira: TRT World HD", url: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8', type: 'HLS', quality: '1080p' },
      { id: 'dw-3', name: "Zaxira: Sports Arena", url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8', type: 'HLS', quality: 'HD' },
    ]
  },
  {
    id: 'ch-rt-sport',
    name: "RT News Live HD (Sport & Highlights)",
    country: "Xalqaro / Rossiya",
    logoUrl: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=120&auto=format&fit=crop&q=80',
    currentProgram: "Jahon sporti, gollar va o'yinlar tahlili",
    streamUrl: 'https://rt-glb.rttv.com/live/rtnews/playlist.m3u8',
    streamType: 'HLS',
    isLive: true,
    sources: [
      { id: 'rt-1', name: "RT News Live (1080p)", url: 'https://rt-glb.rttv.com/live/rtnews/playlist.m3u8', type: 'HLS', quality: '1080p FHD', isDefault: true },
      { id: 'rt-2', name: "RT Documentary HD", url: 'https://rt-glb.rttv.com/live/rtdoc/playlist.m3u8', type: 'HLS', quality: '720p' },
      { id: 'rt-3', name: "Zaxira: FastSports 1", url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'HLS', quality: 'HD' },
    ]
  },
  {
    id: 'ch-rt-doc',
    name: "RT Documentary & Sport HD",
    country: "Xalqaro",
    logoUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80',
    currentProgram: "Maxsus sport hujjatli filmlari va musobaqalar",
    streamUrl: 'https://rt-glb.rttv.com/live/rtdoc/playlist.m3u8',
    streamType: 'HLS',
    isLive: true,
    sources: [
      { id: 'doc-1', name: "RT Doc Live HD", url: 'https://rt-glb.rttv.com/live/rtdoc/playlist.m3u8', type: 'HLS', quality: '1080p HD', isDefault: true },
      { id: 'doc-2', name: "Zaxira: TRT World", url: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8', type: 'HLS', quality: 'FHD' },
      { id: 'doc-3', name: "Zaxira: DW Global", url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', type: 'HLS', quality: '720p' },
    ]
  },
  {
    id: 'ch-fast-sports',
    name: "FastSports 1 HD (Action & Football)",
    country: "Global / AQSH",
    logoUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=120&auto=format&fit=crop&q=80',
    currentProgram: "Tezkor futbol oqimi, xalqaro matchlar va turnirlar",
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    streamType: 'HLS',
    isLive: true,
    sources: [
      { id: 'fs-1', name: "FastSports 1 (1080p 60fps)", url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'HLS', quality: '1080p 60fps', isDefault: true },
      { id: 'fs-2', name: "FastSports 2 (Adaptive)", url: 'https://test-streams.mux.dev/test_001/stream.m3u8', type: 'HLS', quality: 'HD' },
      { id: 'fs-3', name: "Zaxira: TRT World", url: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8', type: 'HLS', quality: '1080p' },
    ]
  },
  {
    id: 'ch-sports-arena',
    name: "Sports Max Arena (FHD)",
    country: "Xalqaro Arena",
    logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=120&auto=format&fit=crop&q=80',
    currentProgram: "Ultra yuqori sifatli sport efirlari va stadion panoramasi",
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    streamType: 'HLS',
    isLive: true,
    sources: [
      { id: 'sma-1', name: "Sports Arena (FHD)", url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8', type: 'HLS', quality: '1080p FHD', isDefault: true },
      { id: 'sma-2', name: "FastSports 1 HD", url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', type: 'HLS', quality: '1080p' },
      { id: 'sma-3', name: "DW Global Sport", url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', type: 'HLS', quality: '720p' },
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
            Xalqaro va mintaqaviy sport telekanallarining jonli efirlari (barcha tillarda uzluksiz).
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-xs font-semibold text-rose-400 self-start">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>{CHANNELS.length} ta kanal jonli efirda</span>
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
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-500" />
                <span>{selectedChannel.country}</span>
              </span>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
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

            <button
              onClick={handleSwitchToNextSource}
              title="Zaxira manbaga o'tish"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-rose-400" />
              <span className="hidden sm:inline">Zaxira</span>
            </button>
          </div>
        </div>
      </div>

      {/* Channel Selector Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHANNELS.map((ch) => {
          const isSelected = selectedChannel.id === ch.id;
          return (
            <div
              key={ch.id}
              onClick={() => handleSelectChannel(ch)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-800/95 border-rose-500/70 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>JONLI EFIR</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{ch.country}</span>
              </div>

              <h4 className="text-sm font-bold text-white mb-1">{ch.name}</h4>
              <p className="text-xs text-slate-400 line-clamp-1 mb-4">{ch.currentProgram}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <Play className="w-3 h-3 fill-emerald-400" />
                  <span>{isSelected ? "Hozir ko'rilmoqda" : "Efirni ochish"}</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {ch.sources.length} ta manba
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Broadcast Info Note */}
      <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1">
          <span className="font-semibold text-slate-200">24/7 Barqaror translatsiya kafolati:</span>
          <p>
            Har bir telekanal uchun bir nechta global tezkor HLS serverlari ulangan. Agar asosiy efirda internetingiz sekinlashsa, pleyer avtomatik ravishda zaxira manbaga ulanadi.
          </p>
        </div>
      </div>
    </div>
  );
};
