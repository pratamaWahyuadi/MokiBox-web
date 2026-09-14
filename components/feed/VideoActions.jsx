"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Bookmark, Share2, Music2, Plus } from "lucide-react";
import Avatar from "@/components/common/Avatar.jsx";
import { profileHref } from "@/lib/paths.js";

/**
 * Action overlay ala TikTok — avatar+follow, like, komentar, bookmark, share
 * di sisi kanan, plus caption + username + musik di bawah kiri.
 * Dipakai di Feed item dan halaman Detail Video (mobile).
 *
 * Props:
 * - video: VideoObject
 * - onToggleLike: () => void
 * - onOpenComments: () => void
 */
export default function VideoActions({ video, onToggleLike, onOpenComments }) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const goProfile = (e) => {
    e?.stopPropagation?.();
    router.push(profileHref(video.user.username));
  };

  const handleShare = async (e) => {
    e?.stopPropagation?.();
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${profileHref(video.user.username)}/video/${video.id}`
        : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: video.title || "MokiBox video", url: shareUrl });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (err) {
      // user cancel
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 1600);
  };

  return (
    <>
      <div className="absolute right-3 bottom-20 z-10 flex flex-col items-center gap-5 select-none">
        <div className="flex flex-col items-center">
          <div className="relative">
            <button type="button" onClick={goProfile} aria-label={`Profil @${video.user.username}`}>
              <Avatar src={video.user.avatar_url} alt={video.user.display_name} size={48} />
            </button>
            {!video.is_owner ? (
              <span
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-moki-accent text-white flex items-center justify-center pointer-events-none"
                aria-hidden="true"
              >
                <Plus className="w-3 h-3" />
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={goProfile}
            className="mt-2 text-xs text-white/90 font-semibold max-w-[80px] truncate hover:underline"
          >
            @{video.user.username}
          </button>
        </div>

        <ActionButton
          count={video.likes_count}
          label="Like"
          onClick={onToggleLike}
          icon={<LikeIcon liked={video.liked_by_me} />}
        />
        <ActionButton
          count={video.comments_count}
          label="Komentar"
          onClick={onOpenComments}
          icon={<MessageCircle className="w-7 h-7 text-white" />}
        />
        <ActionButton
          label="Bookmark"
          onClick={() => setBookmarked((b) => !b)}
          icon={
            <Bookmark
              className={`w-7 h-7 ${bookmarked ? "fill-moki-ink text-moki-ink" : "text-white"}`}
            />
          }
        />
        <ActionButton
          label="Share"
          onClick={handleShare}
          icon={<Share2 className="w-7 h-7 text-white" />}
        />
      </div>

      <div className="absolute left-3 right-20 bottom-4 z-10 text-white pointer-events-none">
        <button
          type="button"
          onClick={goProfile}
          className="font-semibold text-sm pointer-events-auto hover:underline"
        >
          @{video.user.username}
        </button>
        {video.title ? (
          <p className="text-sm mt-1 line-clamp-2 pointer-events-auto">{video.title}</p>
        ) : null}
        {video.description ? (
          <p className="text-xs mt-1 text-white/80 line-clamp-2 pointer-events-auto">
            {video.description}
          </p>
        ) : null}
        <div className="mt-3 flex items-center gap-2 text-xs text-white/80 pointer-events-auto">
          <Music2 className="w-3.5 h-3.5" />
          <span className="truncate max-w-[200px]">
            original sound — {video.user.display_name}
          </span>
        </div>
      </div>

      {shareToast ? (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-moki-bg/80 text-white text-xs px-3 py-2 rounded-lg z-20">
          Link disalin
        </div>
      ) : null}
    </>
  );
}

function ActionButton({ icon, label, onClick, count }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (typeof onClick === "function") onClick();
      }}
      className="flex flex-col items-center gap-1 text-white"
      aria-label={label}
    >
      {icon}
      {typeof count === "number" ? (
        <span className="text-[11px] font-semibold">{formatCount(count)}</span>
      ) : null}
    </button>
  );
}

function formatCount(n) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function LikeIcon({ liked }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    if (!liked) {
      setAnimate(false);
      return undefined;
    }
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 360);
    return () => clearTimeout(t);
  }, [liked]);
  return (
    <Heart
      className={`w-7 h-7 transition-transform duration-200 ${
        liked
          ? `fill-moki-accent text-moki-accent scale-110 ${animate ? "animate-like-pop" : ""}`
          : "text-white active:scale-90"
      }`}
    />
  );
}
