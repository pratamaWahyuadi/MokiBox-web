"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Music2 } from "lucide-react";
import api from "@/lib/api";
import { usePlayerStore } from "@/stores/usePlayerStore";
import VideoPlayer from "@/components/feed/VideoPlayer.jsx";
import VideoActions from "@/components/feed/VideoActions.jsx";
import CommentDrawer from "@/components/feed/CommentDrawer.jsx";
import ErrorState from "@/components/common/ErrorState.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import { ApiError } from "@/lib/apiError.js";

/**
 * Feed FYP — vertical scroll-snap, infinite scroll cursor-based.
 * Item: VideoPlayer + overlay aksi (like, komentar, bookmark, share) + caption + musik.
 */
export default function Feed() {
  const [videos, setVideos] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const sentinelRef = useRef(null);
  const lockUntilRef = useRef(0);

  const isMuted = usePlayerStore((s) => s.isMuted);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const [commentVideoId, setCommentVideoId] = useState(null);

  const loadMore = useCallback(
    async ({ reset = false } = {}) => {
      if (loading) return;
      if (!reset && !hasMore) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.getHomeFeed({ cursor: reset ? null : cursor });
        const next = res?.data || [];
        const nextCursor = res?.pagination?.next_cursor ?? null;
        setVideos((prev) => (reset ? next : [...prev, ...next]));
        setCursor(nextCursor);
        setHasMore(Boolean(nextCursor));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [cursor, hasMore, loading]
  );

  useEffect(() => {
    loadMore({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    const onIntersect = (entries) => {
      if (Date.now() < lockUntilRef.current) return;
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length > 0) {
        const idxAttr = visible[0].target.getAttribute("data-feed-index");
        const idx = idxAttr ? Number(idxAttr) : 0;
        setActiveIndex((prev) => {
          if (prev === idx) return prev;
          lockUntilRef.current = Date.now() + 450;
          return idx;
        });
      }
    };

    const observer = new IntersectionObserver(onIntersect, {
      root: container,
      threshold: [0.5, 0.85],
    });

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [videos.length]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { root: containerRef.current || null, rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const onToggleLike = async (videoId, currentlyLiked) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? {
              ...v,
              liked_by_me: !currentlyLiked,
              likes_count: v.likes_count + (currentlyLiked ? -1 : 1),
            }
          : v
      )
    );
    try {
      if (currentlyLiked) {
        await api.unlikeVideo(videoId);
      } else {
        await api.likeVideo(videoId);
      }
    } catch (err) {
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? {
                ...v,
                liked_by_me: currentlyLiked,
                likes_count: v.likes_count + (currentlyLiked ? 1 : -1),
              }
            : v
        )
      );
      if (!(err instanceof ApiError)) throw err;
    }
  };

  const onTrackView = useCallback((videoId) => {
    api.trackView(videoId).catch(() => {});
  }, []);

  if (initialLoading) {
    return <FeedSkeleton />;
  }

  if (error && videos.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-moki-bg">
        <ErrorState error={error} onRetry={() => loadMore({ reset: true })} />
      </div>
    );
  }

  if (!loading && videos.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-moki-bg"
      >
        {videos.map((v, idx) => (
          <FeedItem
            key={v.id}
            index={idx}
            elRef={(el) => {
              itemRefs.current[idx] = el;
            }}
            video={v}
            isActive={idx === activeIndex}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onToggleLike={() => onToggleLike(v.id, v.liked_by_me)}
            onOpenComments={() => setCommentVideoId(v.id)}
            onTrackView={onTrackView}
          />
        ))}

        {hasMore ? (
          <div
            ref={sentinelRef}
            className="snap-start w-full flex items-center justify-center py-6 text-moki-mute text-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner size={16} />
                <span>Memuat…</span>
              </span>
            ) : (
              <span className="opacity-0">load more</span>
            )}
          </div>
        ) : (
          <div className="snap-start w-full flex items-center justify-center py-10 text-moki-mute text-xs">
            Kamu sudah sampai bawah
          </div>
        )}

        {error && videos.length > 0 ? (
          <div className="px-4 py-4 text-center text-xs text-moki-accent">
            <p>Gagal memuat video lain.</p>
            <button type="button" onClick={() => loadMore()} className="mt-2 underline">
              Retry
            </button>
          </div>
        ) : null}
      </div>

      <CommentDrawer
        videoId={commentVideoId}
        open={Boolean(commentVideoId)}
        onClose={() => setCommentVideoId(null)}
        onCommentAdded={(vid, delta) => {
          setVideos((prev) =>
            prev.map((v) =>
              v.id === vid
                ? { ...v, comments_count: Math.max(0, v.comments_count + delta) }
                : v
            )
          );
        }}
      />
    </>
  );
}

function FeedItem({
  video,
  isActive,
  isMuted,
  onToggleMute,
  onToggleLike,
  onOpenComments,
  onTrackView,
  elRef,
  index,
}) {
  return (
    <section
      ref={elRef}
      data-feed-index={index}
      className="relative snap-start feed-snap-item h-full w-full"
    >
      <VideoPlayer
        video={video}
        isActive={isActive}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onPlayStart={onTrackView}
      />

      <VideoActions video={video} onToggleLike={onToggleLike} onOpenComments={onOpenComments} />
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div className="h-full w-full bg-moki-bg flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-moki-line border-t-moki-accent animate-spin" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full w-full bg-moki-bg flex flex-col items-center justify-center px-6 text-center text-moki-mute">
      <Music2 className="w-10 h-10 mb-3 opacity-60" />
      <p className="text-sm">Belum ada video di FYP-mu.</p>
      <p className="text-xs mt-1">Coba follow akun lain agar feed lebih rame.</p>
    </div>
  );
}
