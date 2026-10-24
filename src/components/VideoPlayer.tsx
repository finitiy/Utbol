/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  AlertCircle,
  Radio,
  Layers,
  Sparkles
} from 'lucide-react';
import { StreamType } from '../types/index.ts';

interface VideoPlayerProps {
  streamUrl: string;
  streamType?: StreamType;
  title: string;
  poster?: string;
  autoPlay?: boolean;
  onSwitchSource?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  streamType = 'HLS',
  title,
  poster,
  autoPlay = true,
  onSwitchSource,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true); // Start muted for compliant autoplay
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userInteracted, setUserInteracted] = useState<boolean>(false);

  // Helper: detect if URL is YouTube
  const getYouTubeEmbedUrl = (url: string): string | null => {
    try {
      if (url.includes('youtube.com/embed/')) return url;
      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|live\/))([a-zA-Z0-9_-]{11})/);
      if (ytMatch && ytMatch[1]) {
        return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
      }
    } catch {
      // not a valid url
    }
    return null;
  };

  const isYouTube = Boolean(getYouTubeEmbedUrl(streamUrl));
  const youtubeUrl = getYouTubeEmbedUrl(streamUrl);
  const isMp4 = streamUrl.endsWith('.mp4') || streamUrl.includes('.mp4');
  const isHls = !isMp4 && !isYouTube && (streamType === 'HLS' || streamUrl.endsWith('.m3u8') || streamUrl.includes('.m3u8'));
  const isEmbed = (streamType === 'EMBED' || isYouTube) && !isHls && !isMp4;

  useEffect(() => {
    setError(null);
    setLoading(true);

    if (isEmbed) {
      setLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Clean previous HLS instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Set mobile webview compliant attributes imperatively
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.defaultMuted = true;
    video.muted = isMuted;

    const startPlayback = () => {
      setLoading(false);
      if (autoPlay) {
        video.muted = true;
        setIsMuted(true);
        video.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Autoplay restricted by browser, waiting for user tap:', err);
            setIsPlaying(false);
          });
      }
    };

    // 1. Direct MP4 video
    if (isMp4) {
      video.src = streamUrl;
      video.load();
      video.onloadeddata = startPlayback;
      video.onerror = () => {
        setError("Ushbu video oqimi yuklanmadi. Boshqa manbani tanlang.");
        setLoading(false);
      };
      return;
    }

    // 2. HLS Video Stream
    const isAppleDevice = typeof navigator !== 'undefined' && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);

    if (isAppleDevice && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Prioritize native HLS on iOS Safari/Telegram WebApp for hardware acceleration & smooth playback
      video.src = streamUrl;
      video.load();
      video.onloadedmetadata = startPlayback;
      video.onerror = () => {
        console.warn('Native iOS HLS error, switching source or retrying');
        if (onSwitchSource) {
          onSwitchSource();
        } else {
          setError("Ushbu efir manbasi ochilmadi. Boshqa manbaga o'ting.");
          setLoading(false);
        }
      };
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        startPlayback();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.warn('Fatal HLS stream error:', data);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              if (onSwitchSource) {
                // Auto switch to backup source
                onSwitchSource();
              } else {
                setError("Ushbu efir manbasi ayni damda faol emas. Boshqa manbani tanlang.");
                setLoading(false);
              }
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.load();
      video.onloadedmetadata = startPlayback;
      video.onerror = () => {
        setError("Ushbu efir manbasi ochilmadi. Boshqa manbaga o'ting.");
        setLoading(false);
      };
    } else {
      setError("Brauzeringiz ushbu video formatini to'liq qo'llab-quvvatlamaydi.");
      setLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, streamType, autoPlay, isHls, isMp4, isEmbed]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    setUserInteracted(true);

    if (video.paused) {
      // Unmute on explicit user tap
      video.muted = false;
      setIsMuted(false);
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // If browser policy prevents unmuted playback without prior interaction, fallback to muted
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    if (hlsRef.current) {
      hlsRef.current.loadSource(streamUrl);
      hlsRef.current.startLoad();
    } else if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center group select-none"
    >
      {/* 1. YouTube or Direct Embed Player */}
      {isEmbed && youtubeUrl ? (
        <iframe
          src={youtubeUrl}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : isEmbed && !youtubeUrl ? (
        <iframe
          src={streamUrl}
          title={title}
          className="w-full h-full border-0 bg-black"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      ) : (
        /* 2. Native / HLS HTML5 Video Player */
        <>
          <video
            ref={videoRef}
            poster={poster}
            playsInline
            muted={isMuted}
            crossOrigin="anonymous"
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Top Live Overlay Badge */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none">
            <div className="px-2.5 py-1 bg-rose-600 text-white rounded-md text-[11px] font-bold tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-600/30">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>JONLI EFIR</span>
            </div>
            <div className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-md text-[11px] font-semibold text-slate-200">
              HD 1080p
            </div>
          </div>

          {/* Loading Spinner */}
          {loading && !error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs gap-3">
              <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-300">Jonli efirga ulanmoqda...</p>
            </div>
          )}

          {/* Big Center Play Button (Essential for mobile Telegram WebApp interaction) */}
          {!isPlaying && !loading && !error && (
            <div 
              onClick={togglePlay}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs cursor-pointer transition-all hover:bg-black/30"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-600/60 hover:scale-110 active:scale-95 transition-transform mb-3">
                <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-0.5" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
                Jonli efirni boshlash (Bosing)
              </span>
            </div>
          )}

          {/* Error & Source Switch View (Strictly in-app, no external browser link) */}
          {error && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/95 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <p className="text-sm font-semibold text-white">{error}</p>
              <p className="text-xs text-slate-400 max-w-md">
                Efir oqimida uzilish bo'lishi mumkin. Quyidagi tugmalar orqali boshqa zaxira manbaga o'ting yoki qayta urinib ko'ring.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Qayta urinish</span>
                </button>

                {onSwitchSource && (
                  <button
                    onClick={onSwitchSource}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-rose-600/20 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Boshqa zaxira manba</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bottom Custom Video Controls Bar */}
          {!error && (
            <div className="absolute bottom-0 inset-x-0 z-20 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between opacity-95 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-1.5 text-white hover:text-rose-400 transition-colors cursor-pointer"
                  title={isPlaying ? "To'xtatish" : "Ijro etish"}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                </button>

                <button
                  onClick={toggleMute}
                  className="p-1.5 text-white hover:text-rose-400 transition-colors cursor-pointer"
                  title={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-amber-400" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-300">
                  <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                  <span>Jonli translatsiya</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px] sm:max-w-xs">
                  {title}
                </span>

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 text-white hover:text-rose-400 transition-colors cursor-pointer"
                  title="To'liq ekran"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
