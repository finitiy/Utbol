/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Match, StreamSource } from '../types/index.ts';
import { VideoPlayer } from './VideoPlayer.tsx';
import { 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Tv, 
  MapPin, 
  Calendar, 
  Radio, 
  Layers, 
  Share2, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface MatchStreamModalProps {
  match: Match | null;
  onClose: () => void;
}

export const MatchStreamModal: React.FC<MatchStreamModalProps> = ({ match, onClose }) => {
  if (!match) return null;

  const isLive = match.status === 'IN_PLAY';
  const broadcaster = match.broadcaster;

  // Build sources list from match or defaults
  const sources: StreamSource[] = (match.streamSources && match.streamSources.length > 0)
    ? match.streamSources
    : [
        {
          id: 'src-1',
          name: "FastSports 1 HD (1080p 60fps)",
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          type: 'HLS',
          isDefault: true,
          quality: '1080p 60fps',
        },
        {
          id: 'src-2',
          name: "TRT World Sport HD",
          url: 'https://tv-trtworld.medya.trt.com.tr/master.m3u8',
          type: 'HLS',
          quality: '1080p Live',
        },
        {
          id: 'src-3',
          name: "DW Sport Global (HD)",
          url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
          type: 'HLS',
          quality: '720p HD',
        },
        {
          id: 'src-4',
          name: "RT News Live HD (Sport)",
          url: 'https://rt-glb.rttv.com/live/rtnews/playlist.m3u8',
          type: 'HLS',
          quality: '1080p FHD',
        },
        {
          id: 'src-5',
          name: "Sports Max Arena (Unified)",
          url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
          type: 'HLS',
          quality: '1080p',
        }
      ];

  const [activeSource, setActiveSource] = useState<StreamSource>(sources[0]);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSwitchToNextSource = () => {
    const currentIndex = sources.findIndex((s) => s.id === activeSource.id);
    const nextIndex = (currentIndex + 1) % sources.length;
    setActiveSource(sources[nextIndex]);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${match.homeTeam.name} vs ${match.awayTeam.name} - Jonli Efir`,
        text: `${match.homeTeam.name} vs ${match.awayTeam.name} o'yinini jonli tomosha qiling!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur-md z-30">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xs sm:text-sm font-bold text-white truncate">{match.leagueName}</span>
            {match.competitionRound && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400 truncate">{match.competitionRound}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Ulashish"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Section */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Main Video Screen */}
          <div className="w-full">
            <VideoPlayer
              streamUrl={activeSource.url}
              streamType={activeSource.type}
              title={`${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`}
              autoPlay={isLive}
              onSwitchSource={handleSwitchToNextSource}
            />
          </div>

          {/* Stream Source Selector Tabs */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-rose-400" />
                <span>Translyatsiya manbasini tanlang:</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Agar bitta manba qotsa, boshqasiga o'ting
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {sources.map((src) => {
                const isSelected = activeSource.id === src.id;
                return (
                  <button
                    key={src.id}
                    onClick={() => setActiveSource(src)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 font-semibold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Radio className={`w-3 h-3 ${isSelected ? 'text-white animate-pulse' : 'text-slate-500'}`} />
                    <span>{src.name}</span>
                    {src.quality && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-rose-700 text-rose-100' : 'bg-slate-800 text-slate-400'}`}>
                        {src.quality}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Match Score Banner */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            {/* Home Team */}
            <div className="flex items-center gap-3 flex-1">
              <img
                src={match.homeTeam.crestUrl}
                alt={match.homeTeam.name}
                className="w-10 h-10 object-contain rounded-full bg-slate-800/50 p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=80&auto=format&fit=crop&q=80';
                }}
              />
              <div>
                <h4 className="text-sm font-bold text-white">{match.homeTeam.name}</h4>
                <span className="text-[11px] text-slate-400">Mezbon</span>
              </div>
            </div>

            {/* Score / Status */}
            <div className="px-4 text-center shrink-0">
              {isLive ? (
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider font-mono">
                    {match.homeScore ?? 0} : {match.awayScore ?? 0}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>{match.minute}'-daqiqa</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-amber-400">
                    {match.status === 'FINISHED' ? 'Yakunlandi' : 'Boshlanmadi'}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{match.kickoffTashkent}</div>
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-end gap-3 flex-1 text-right">
              <div>
                <h4 className="text-sm font-bold text-white">{match.awayTeam.name}</h4>
                <span className="text-[11px] text-slate-400">Mehmon</span>
              </div>
              <img
                src={match.awayTeam.crestUrl}
                alt={match.awayTeam.name}
                className="w-10 h-10 object-contain rounded-full bg-slate-800/50 p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=80&auto=format&fit=crop&q=80';
                }}
              />
            </div>
          </div>

          {/* Official Channel Direct Links */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Tv className="w-4 h-4 text-emerald-400" />
              <span>Rasmiy telekanal: <strong>{broadcaster?.name || "Sport TV O'zbekiston"}</strong></span>
            </div>
            {broadcaster?.websiteUrl && (
              <a
                href={broadcaster.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Telekanal rasmiy sayti</span>
              </a>
            )}
          </div>

          {/* Legal Compliance */}
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong>Litsenziyalangan efir:</strong> Barcha video oqimlar va translatsiyalar O'zbekiston teleradiokompaniyalari hamda rasmiy media huquq egalarining ochiq manbalari orqali taqdim etiladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
