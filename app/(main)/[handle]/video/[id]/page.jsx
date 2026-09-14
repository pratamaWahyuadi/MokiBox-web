"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Music2 } from "lucide-react";
import api from "@/lib/api";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { parseHandle, profileHref } from "@/lib/paths.js";
import VideoPlayer from "@/components/feed/VideoPlayer.jsx";
import VideoActions from "@/components/feed/VideoActions.jsx";
import CommentSection from "@/components/feed/CommentSection.jsx";
import CommentDrawer from "@/components/feed/CommentDrawer.jsx";
import Avatar from "@/components/common/Avatar.jsx";
import Button from "@/components/common/Button.jsx";
import ErrorState from "@/components/common/ErrorState.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import { ApiError } from "@/lib/apiError.js";

/**
 * Halaman Detail Video — /@username/video/:id.
 * Mobile: fullscreen player + overlay aksi + CommentDrawer.
 * Desktop (>=md): 2 kolom — player kiri, panel info + komentar kanan.
 */
export default function VideoDetailPage({ params }) {
  const router = useRouter();
  const handle = parseHandle(params?.handle);
  const videoId = params?.id;

  const isMuted = usePlayerStore((s) => s.isMuted);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchVideo = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getVideoById(videoId);
      setVideo(res?.data || null);
    } catch (err) {
      setError(err);
      setVideo(null);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const onTrackView = useCallback((id) => {
    api.trackView(id).catch(() => {});
  }, []);

  const onToggleLike = async () => {
    if (!video) return;
    const wasLiked = video.liked_by_me;
    setVideo((v) => ({
      ...v,
      liked_by_me: !wasLiked,
      likes_count: v.likes_count + (wasLiked ? -1 : 1),
    }));
    try {
      if (wasLiked) {
        await api.unlikeVideo(video.id);
      } else {
        await api.likeVideo(video.id);
      }
    } catch (err) {
      setVideo((v) => ({
        ...v,
        liked_by_me: wasLiked,
        likes_count: v.likes_count + (wasLiked ? 1 : -1),
      }));
      if (!(err instanceof ApiError)) throw err;
    }
  };

  const bumpComments = useCallback((id, delta) => {
    setVideo((v) =>
      v && v.id === id
        ? { ...v, comments_count: Math.max(0, v.comments_count + delta) }
        : v
    );
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full bg-moki-bg flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="h-full w-full bg-moki-bg flex flex-col items-center justify-center px-6 text-center">
        <ErrorState
          error={error}
          onRetry={fetchVideo}
          title={error instanceof ApiError && error.code === "NOT_FOUND" ? "Video tidak ditemukan" : "Gagal memuat video"}
        />
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="text-sm text-moki-mute hover:text-moki-text underline mt-1"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const goProfile = () => router.push(profileHref(video.user.username));

  return (
    <div className="h-full w-full bg-moki-bg">
      <div className="md:hidden relative h-full w-full">
        <VideoPlayer
          video={video}
          isActive
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onPlayStart={onTrackView}
        />
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute top-3 left-3 z-20 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <VideoActions
          video={video}
          onToggleLike={onToggleLike}
          onOpenComments={() => setDrawerOpen(true)}
        />
        <CommentDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          videoId={video.id}
          onCommentAdded={bumpComments}
        />
      </div>

      <div className="hidden md:flex h-full">
        <div className="flex-1 flex items-center justify-center p-6 min-w-0">
          <div className="relative h-full max-h-[90vh] aspect-[9/16] rounded-xl overflow-hidden shadow-xl">
            <VideoPlayer
              video={video}
              isActive
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onPlayStart={onTrackView}
            />
          </div>
        </div>

        <aside className="w-[420px] border-l border-moki-line flex flex-col bg-moki-bg">
          <header className="flex items-center gap-3 px-4 py-3 border-b border-moki-line">
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-moki-surface"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold">Video</span>
          </header>

          <div className="px-4 py-3 border-b border-moki-line">
            <div className="flex items-start gap-3">
              <button type="button" onClick={goProfile} aria-label={`Profil @${video.user.username}`}>
                <Avatar src={video.user.avatar_url} alt={video.user.display_name} size={44} />
              </button>
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={goProfile}
                  className="text-sm font-semibold hover:underline"
                >
                  {video.user.display_name}
                </button>
                <p className="text-xs text-moki-mute">@{video.user.username}</p>
                {video.title ? <p className="text-sm mt-2">{video.title}</p> : null}
                {video.description ? (
                  <p className="text-xs text-moki-mute mt-1 whitespace-pre-wrap">
                    {video.description}
                  </p>
                ) : null}
                <div className="mt-2 flex items-center gap-2 text-xs text-moki-mute">
                  <Music2 className="w-3.5 h-3.5" />
                  <span className="truncate">original sound — {video.user.display_name}</span>
                </div>
              </div>
              {!video.is_owner ? <FollowButton userId={video.user.id} /> : null}
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <CommentSection videoId={video.id} onCommentAdded={bumpComments} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function FollowButton({ userId }) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const was = following;
    setFollowing(!was);
    try {
      if (was) {
        await api.unfollowUser(userId);
      } else {
        await api.followUser(userId);
      }
    } catch (err) {
      setFollowing(was);
      if (!(err instanceof ApiError)) throw err;
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={following ? "outline" : "primary"}
      onClick={toggle}
      disabled={busy}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
