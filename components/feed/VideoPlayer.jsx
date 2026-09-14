"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Loader2, Play } from "lucide-react";
import { usePlayerStore } from "@/stores/usePlayerStore";

/**
 * @typedef {import("@/mocks/videos.js").VideoObject} VideoObject
 *
 * VideoPlayer — HTML5 + hls.js (Safari native fallback).
 * - Autoplay hanya saat isActive === true (di-trigger oleh Feed via IntersectionObserver).
 * - Mute/unmute global lewat usePlayerStore, sync ke prop isMuted (Feed yang toggle).
 * - Tap area video toggle play/pause.
 * - Progress bar tipis di bawah, clickable untuk seek.
 * - Loading spinner selama waiting/buffering.
 * - Track view sekali per video per mount via callback onPlayStart.
 *
 * Props:
 * - video: VideoObject
 * - isActive: boolean
 * - isMuted: boolean (dari store, dikontrol parent)
 * - onToggleMute: () => void
 * - onPlayStart: (videoId) => void
 */
export default function VideoPlayer({
  video,
  isActive,
  isMuted,
  onToggleMute,
  onPlayStart,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const trackedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  const src = video?.hls_playlist_url || null;
  const poster = video?.thumbnail_url || null;

  // attach HLS source (client only)
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const el = videoRef.current;
    if (!el || !src) return undefined;

    let hls;
    const isSafari = el.canPlayType("application/vnd.apple.mpegurl");
    if (isSafari) {
      el.src = src;
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          el.src = src;
          return;
        }
        hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(el);
        hls.on(Hls.Events.ERROR, (_evt, data) => {
          if (data?.fatal) {
            setError("Gagal memuat video.");
          }
        });
        hlsRef.current = hls;
      });
    }

    return () => {
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (e) {
          // ignore
        }
        hlsRef.current = null;
      }
    };
  }, [src]);

  // sync muted state
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = Boolean(isMuted);
  }, [isMuted]);

  // play/pause based on isActive
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      const p = el.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          setIsPlaying(false);
        });
      }
    } else {
      el.pause();
      el.currentTime = 0;
      trackedRef.current = false;
      setIsPlaying(false);
      setProgress(0);
    }
  }, [isActive]);

  const onLoadedMetadata = () => {
    const el = videoRef.current;
    if (el) setDuration(el.duration || 0);
    setIsLoading(false);
  };

  const onTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    setProgress(el.currentTime / el.duration);
  };

  const onWaiting = () => setIsLoading(true);
  const onPlaying = () => {
    setIsLoading(false);
    setIsPlaying(true);
    if (!trackedRef.current && video?.id) {
      trackedRef.current = true;
      if (typeof onPlayStart === "function") onPlayStart(video.id);
    }
  };
  const onPause = () => setIsPlaying(false);
  const onEnded = () => {
    setIsPlaying(false);
    const el = videoRef.current;
    if (el) el.currentTime = 0;
  };

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      el.pause();
    }
  }, []);

  const onProgressClick = (e) => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    el.currentTime = ratio * el.duration;
    setProgress(ratio);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-black select-none"
      onClick={togglePlay}
      role="button"
      aria-label={isPlaying ? "Pause video" : "Play video"}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        loop
        muted={isMuted}
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onWaiting={onWaiting}
        onPlaying={onPlaying}
        onPause={onPause}
        onEnded={onEnded}
      />

      {isLoading && !error ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-moki-bg/60 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        </div>
      ) : null}

      {!isPlaying && !isLoading && !error ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-moki-bg/50 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="text-sm text-white/80 bg-moki-bg/60 px-3 py-2 rounded-lg">{error}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (typeof onToggleMute === "function") onToggleMute();
        }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-moki-bg/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-moki-bg/70 transition z-10"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer z-10"
        onClick={onProgressClick}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label="Seek video"
      >
        <div
          className="h-full bg-moki-accent"
          style={{ width: `${Math.min(Math.max(progress * 100, 0), 100)}%` }}
        />
      </div>

      {duration > 0 ? (
        <span className="absolute bottom-3 left-3 text-xs text-white/80 font-mono pointer-events-none">
          {formatTime((1 - progress) * duration)}
        </span>
      ) : null}
    </div>
  );
}

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}