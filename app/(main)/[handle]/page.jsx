"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Share2, Play, Lock, Pencil, Video } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { parseHandle, profileHref } from "@/lib/paths.js";
import Avatar from "@/components/common/Avatar.jsx";
import Button from "@/components/common/Button.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import ErrorState from "@/components/common/ErrorState.jsx";
import { ApiError } from "@/lib/apiError.js";

/**
 * Halaman Profil — /@username.
 * Header sticky, profile header, tabs Videos/Liked (liked hanya untuk owner),
 * grid video 3 kolom dengan infinite scroll cursor-based.
 */
export default function ProfilePage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUserId = useAuthStore((s) => s.currentUserId);

  const handle = parseHandle(params?.handle);
  const tab = searchParams.get("tab") === "liked" ? "liked" : "videos";

  const [user, setUser] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [videos, setVideos] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videosError, setVideosError] = useState(null);
  const [totalLikes, setTotalLikes] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const isOwner = Boolean(user && currentUserId && user.id === currentUserId);

  const fetchProfile = useCallback(async () => {
    if (!handle) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const res = await api.getUserByIdOrUsername(handle);
      setUser(res?.data || null);
    } catch (err) {
      setProfileError(err);
      setUser(null);
    } finally {
      setProfileLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const loadVideos = useCallback(
    async ({ reset = false } = {}) => {
      if (!user?.id || loadingVideos) return;
      if (!reset && !hasMore) return;
      setLoadingVideos(true);
      setVideosError(null);
      try {
        const res =
          tab === "liked"
            ? await api.getUserLikedVideos(user.id, { cursor: reset ? null : cursor })
            : await api.getUserVideos(user.id, { cursor: reset ? null : cursor });
        const next = res?.data || [];
        const nextCursor = res?.pagination?.next_cursor ?? null;
        setVideos((prev) => (reset ? next : [...prev, ...next]));
        setCursor(nextCursor);
        setHasMore(Boolean(nextCursor));
      } catch (err) {
        setVideosError(err);
        if (reset) setVideos([]);
      } finally {
        setLoadingVideos(false);
      }
    },
    [user?.id, tab, cursor, hasMore, loadingVideos]
  );

  useEffect(() => {
    if (!user?.id) return;
    if (tab === "liked" && !isOwner) return;
    loadVideos({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, tab, isOwner]);

  useEffect(() => {
    if (!isOwner) return;
    let alive = true;
    api
      .getUserVideos(currentUserId, { limit: 50 })
      .then((res) => {
        if (!alive) return;
        const sum = (res?.data || []).reduce((acc, v) => acc + (v.likes_count || 0), 0);
        setTotalLikes(sum);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isOwner, currentUserId]);

  const switchTab = (next) => {
    const q = next === "liked" ? "?tab=liked" : "";
    router.replace(`${profileHref(user.username)}${q}`);
  };

  const handleToggleFollow = async () => {
    if (!user) return;
    const wasFollowing = Boolean(user.is_following);
    setUser((u) => ({
      ...u,
      is_following: !wasFollowing,
      follower_count: Math.max(0, (u.follower_count || 0) + (wasFollowing ? -1 : 1)),
    }));
    try {
      if (wasFollowing) {
        await api.unfollowUser(user.id);
      } else {
        await api.followUser(user.id);
      }
    } catch (err) {
      setUser((u) => ({
        ...u,
        is_following: wasFollowing,
        follower_count: Math.max(0, (u.follower_count || 0) + (wasFollowing ? 1 : -1)),
      }));
      if (!(err instanceof ApiError)) throw err;
    }
  };

  const handleShare = async () => {
    if (!user) return;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${profileHref(user.username)}`
        : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `@${user.username} di MokiBox`, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      // user cancel
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 1600);
  };

  if (profileLoading) return <ProfileSkeleton />;

  if (profileError || !user) {
    return <NotFoundState onBack={() => router.push("/home")} />;
  }

  return (
    <div className="h-full overflow-y-auto bg-moki-bg text-moki-text">
      <header className="sticky top-0 z-20 bg-moki-bg/95 backdrop-blur border-b border-moki-line">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 h-12">
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-moki-surface"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <h1 className="text-sm font-semibold truncate">@{user.username}</h1>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-moki-surface"
            aria-label="Bagikan profil"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 pt-6 pb-4 flex flex-col items-center text-center">
        <Avatar src={user.avatar_url} alt={user.display_name} size={96} />
        <h2 className="mt-3 text-lg font-bold flex items-center gap-1.5">
          {user.display_name}
          {user.is_private ? <Lock className="w-4 h-4 text-moki-mute" aria-label="Akun private" /> : null}
        </h2>
        <p className="text-sm text-moki-mute">@{user.username}</p>
        {user.bio ? <p className="mt-2 text-sm max-w-sm">{user.bio}</p> : null}

        <div className="mt-4 flex items-center gap-6 text-sm">
          <Stat label="Following" value={user.following_count ?? 0} />
          <Stat label="Followers" value={user.follower_count ?? 0} />
          <Stat label="Likes" value={isOwner ? totalLikes : user.total_likes ?? 0} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          {isOwner ? (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="w-4 h-4" />
              Edit profil
            </Button>
          ) : (
            <Button
              variant={user.is_following ? "outline" : "primary"}
              onClick={handleToggleFollow}
            >
              {user.is_following ? "Following" : "Follow"}
            </Button>
          )}
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </section>

      <div className="sticky top-12 z-10 bg-moki-bg/95 backdrop-blur border-b border-moki-line">
        <div className="max-w-3xl mx-auto flex">
          <TabButton active={tab === "videos"} onClick={() => switchTab("videos")} label="Videos" />
          {isOwner ? (
            <TabButton active={tab === "liked"} onClick={() => switchTab("liked")} label="Liked" />
          ) : null}
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-1 py-1 pb-20">
        {videosError && videos.length === 0 ? (
          <ErrorState
            error={videosError}
            onRetry={() => loadVideos({ reset: true })}
            title="Gagal memuat video"
          />
        ) : !loadingVideos && videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-moki-mute">
            <Video className="w-10 h-10 mb-3 opacity-60" />
            <p className="text-sm">
              {tab === "liked" ? "Belum ada video yang disukai." : "Belum ada video."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-1">
            {videos.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => router.push(`${profileHref(user.username)}/video/${v.id}`)}
                className="relative aspect-[3/4] bg-moki-surface overflow-hidden group"
                aria-label={v.title || `Video ${v.id}`}
              >
                {v.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnail_url}
                    alt={v.title || "thumbnail"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-moki-mute">
                    <Video className="w-6 h-6" />
                  </div>
                )}
                <span className="absolute bottom-1 left-1 flex items-center gap-1 text-[11px] text-white font-semibold drop-shadow">
                  <Play className="w-3 h-3 fill-white" />
                  {formatCount(v.views_count)}
                </span>
              </button>
            ))}
          </div>
        )}

        {loadingVideos ? (
          <div className="flex justify-center py-6 text-moki-mute">
            <Spinner size={20} />
          </div>
        ) : hasMore && videos.length > 0 ? (
          <div className="flex justify-center py-6">
            <button
              type="button"
              onClick={() => loadMoreClick()}
              className="text-sm text-moki-mute hover:text-moki-text underline"
            >
              Muat lebih
            </button>
          </div>
        ) : null}
      </section>

      {shareToast ? (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-moki-surface border border-moki-line text-moki-text text-xs px-3 py-2 rounded-lg shadow-lg z-50">
          Link profil disalin
        </div>
      ) : null}

      {editOpen && isOwner ? (
        <EditProfileModal
          user={user}
          onClose={() => setEditOpen(false)}
          onSaved={(next) => setUser((u) => ({ ...u, ...next }))}
        />
      ) : null}
    </div>
  );

  function loadMoreClick() {
    loadVideos();
  }
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <div className="font-bold">{formatCount(value)}</div>
      <div className="text-xs text-moki-mute">{label}</div>
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition ${
        active
          ? "text-moki-text border-moki-accent"
          : "text-moki-mute border-transparent hover:text-moki-text"
      }`}
    >
      {label}
    </button>
  );
}

function formatCount(n) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function ProfileSkeleton() {
  return (
    <div className="h-full overflow-y-auto bg-moki-bg">
      <div className="max-w-3xl mx-auto px-4 pt-20 flex flex-col items-center animate-pulse">
        <div className="w-24 h-24 rounded-full bg-moki-surface" />
        <div className="w-40 h-5 rounded bg-moki-surface mt-4" />
        <div className="w-24 h-4 rounded bg-moki-surface mt-2" />
        <div className="w-56 h-8 rounded-full bg-moki-surface mt-4" />
        <div className="grid grid-cols-3 md:grid-cols-4 gap-1 mt-8 w-full">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-moki-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotFoundState({ onBack }) {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-moki-bg text-center px-6">
      <Lock className="w-10 h-10 text-moki-mute mb-3" />
      <p className="text-sm font-semibold text-moki-text">User tidak ditemukan</p>
      <p className="text-xs text-moki-mute mt-1">
        Akun mungkin telah dihapus, dinonaktifkan, atau private.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-4 px-4 py-2 rounded-full bg-moki-accent text-moki-bg text-sm font-semibold hover:brightness-110"
      >
        Kembali ke Beranda
      </button>
    </div>
  );
}

function EditProfileModal({ user, onClose, onSaved }) {
  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [isPrivate, setIsPrivate] = useState(Boolean(user.is_private));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const payload = {
      display_name: displayName.trim(),
      bio: bio.trim(),
      is_private: isPrivate,
    };
    try {
      const res = await api.updateMe(payload);
      onSaved(res?.data || payload);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? `[${err.code}] ${err.message}` : "Gagal menyimpan."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Edit profil"
    >
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-moki-surface border border-moki-line rounded-2xl p-5 shadow-xl"
      >
        <h2 className="text-base font-bold mb-4">Edit profil</h2>

        <label className="block text-xs text-moki-mute mb-1">Nama tampilan</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          className="w-full bg-moki-bg border border-moki-line rounded-lg px-3 py-2 text-sm text-moki-text focus:outline-none focus:border-moki-accent"
        />

        <label className="block text-xs text-moki-mute mt-3 mb-1">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full bg-moki-bg border border-moki-line rounded-lg px-3 py-2 text-sm text-moki-text focus:outline-none focus:border-moki-accent resize-none"
        />

        <label className="mt-3 flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="accent-moki-accent"
          />
          Akun private
        </label>

        {error ? <p className="mt-3 text-xs text-moki-accent">{error}</p> : null}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={saving}>
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
