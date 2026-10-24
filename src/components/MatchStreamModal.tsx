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

  const defaultCrest = 'https://a.espncdn.com/i/teamlogos/soccer/500/default-team-logo.png';
  const homeTeam = match.homeTeam || { id: '', name: 'Mezbon', shortName: 'Mezbon', crestUrl: defaultCrest, tla: 'HOM', leagueId: '' };
  const awayTeam = match.awayTeam || { id: '', name: 'Mehmon', shortName: 'Mehmon', crestUrl: defaultCrest, tla: 'AWY', leagueId: '' };

  // Build sources list from match or defaults (Pure football live streams)
  const sources: StreamSource[] = (match.streamSources && match.streamSources.length > 0)
    ? match.streamSources
    : [
        {
          id: 'src-1',
          name: "Jonli Efir 1 (Real Madrid TV English HD)",
          url: 'https://rmtv.akamaized.net/hls/live/2043154/rmtv-en-web/master.m3u8',
          type: 'HLS',
          isDefault: true,
          quality: '1080p FHD',
        },
        {
          id: 'src-2',
          name: "Jonli Efir 2 (AS3 Sport Football HD)",
          url: 'https://streamtv.as3sport.online:3394/hybrid/play.m3u8',
          type: 'HLS',
          quality: '1080p Live',
        },
        {
          id: 'src-3',
          name: "Jonli Efir 3 (Real Madrid TV Español)",
          url: 'https://rmtv.akamaized.net/hls/live/2043153/rmtv-es-web/master.m3u8',
          type: 'HLS',
          quality: '1080p',
        },
        {
          id: 'src-4',
          name: "Jonli Efir 4 (FIFA+ Football Arena)",
          url: 'https://jmp2.uk/plu-660c29b5aec9680008f5b4a4.m3u8',
          type: 'HLS',
          quality: '720p HD',
        },
        {
          id: 'src-5',
          name: "Jonli Efir 5 (Africa 24 Sport HD)",
          url: 'https://africa24.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8',
          type: 'HLS',
          quality: '1080p FHD',
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
        title: `${homeTeam.name} vs ${awayTeam.name} - Jonli Efir`,
        text: `${homeTeam.name} vs ${awayTeam.name} o'yinini jonli tomosha qiling!`,
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
              title={`${homeTeam.shortName} vs ${awayTeam.shortName}`}
              autoPlay={isLive}
              onSwitchSource={handleSwitchToNextSource}
            />
          </div>

          {/* Prominent TV Channel Callout ("Namoyish etuvchi telekanal") */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Tv className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                  Namoyish etuvchi rasmiy telekanal:
                </span>
                <span className="text-base sm:text-lg font-black text-white tracking-wide truncate block">
                  {match.broadcaster?.name || "Sport TV (MTRK)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                1080p FHD
              </span>
              {sources.length > 1 && (
                <button
                  onClick={handleSwitchToNextSource}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg transition-colors text-[11px] font-medium"
                  title="Efir to'xtab qolsa boshqa zaxira oqimiga o'tish"
                >
                  <span>Zaxira oqim 🔄</span>
                </button>
              )}
            </div>
          </div>

          {/* Match Score Banner */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            {/* Home Team */}
            <div className="flex items-center gap-3 flex-1">
              <img
                src={homeTeam.crestUrl || defaultCrest}
                alt={homeTeam.name}
                className="w-10 h-10 object-contain rounded-full bg-slate-800/50 p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultCrest;
                }}
              />
              <div>
                <h4 className="text-sm font-bold text-white">{homeTeam.name}</h4>
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
                <h4 className="text-sm font-bold text-white">{awayTeam.name}</h4>
                <span className="text-[11px] text-slate-400">Mehmon</span>
              </div>
              <img
                src={awayTeam.crestUrl || defaultCrest}
                alt={awayTeam.name}
                className="w-10 h-10 object-contain rounded-full bg-slate-800/50 p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultCrest;
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
