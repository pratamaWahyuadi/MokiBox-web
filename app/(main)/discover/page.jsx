"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Play, Compass } from "lucide-react";
import api from "@/lib/api";
import { profileHref, videoHref } from "@/lib/paths.js";
import Avatar from "@/components/common/Avatar.jsx";
import Button from "@/components/common/Button.jsx";
import SearchInput from "@/components/common/SearchInput.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import ErrorState from "@/components/common/ErrorState.jsx";
import { useAuthStore } from "@/stores/useAuthStore";

const TRENDING = ["Kucing Lucu", "Resep Harian", "Skate", "DIY", "Comedy", "Sunset", "Mahal"];

/**
 * Halaman Temukan — search akun & video dengan debounce.
 * Query dideep-link via `?q=...`.
 */
function DiscoverInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUserId = useAuthStore((s) => s.currentUserId);

  const q = searchParams.get("q") || "";
  const [tab, setTab] = useState("akun");
  const [users, setUsers] = useState(null);
  const [videos, setVideos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSearch = useCallback(
    async (query) => {
      const needle = (query || "").trim();
      if (!needle) {
        setUsers(null);
        setVideos(null);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [u, v] = await Promise.all([api.searchUsers(needle), api.searchVideos(needle)]);
        setUsers(u?.data || []);
        setVideos(v?.data || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    runSearch(q);
  }, [q, runSearch]);

  const setQuery = (next) => {
    router.replace(`/discover${next ? `?q=${encodeURIComponent(next)}` : ""}`);
  };

  return (
    <div className="h-full overflow-y-auto bg-moki-bg text-moki-text">
      <div className="sticky top-0 z-10 bg-moki-bg/95 backdrop-blur border-b border-moki-line">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <SearchInput
            value={q}
            onDebouncedChange={setQuery}
            placeholder="Cari akun atau video…"
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-20">
        {!q ? (
          <div className="pt-8">
            <h2 className="text-sm font-semibold text-moki-mute mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4" /> Trending
            </h2>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  className="px-4 py-2 rounded-full border border-moki-line bg-moki-surface text-sm text-moki-text hover:bg-moki-bg transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex border-b border-moki-line mt-2">
              <TabBtn active={tab === "akun"} onClick={() => setTab("akun")} label="Akun" />
              <TabBtn active={tab === "video"} onClick={() => setTab("video")} label="Video" />
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size={24} />
              </div>
            ) : error ? (
              <ErrorState error={error} onRetry={() => runSearch(q)} title="Gagal mencari" />
            ) : (
              <>
                {tab === "akun" ? (
                  <UserResults
                    users={users || []}
                    q={q}
                    currentUserId={currentUserId}
                    onOpen={(u) => router.push(profileHref(u.username))}
                  />
                ) : (
                  <VideoResults
                    videos={videos || []}
                    q={q}
                    onOpen={(v) => router.push(videoHref(v.user.username, v.id))}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-moki-bg">
          <Spinner size={24} />
        </div>
      }
    >
      <DiscoverInner />
    </Suspense>
  );
}

function TabBtn({ active, onClick, label }) {
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

function NoResults({ q }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-moki-mute">
      <Compass className="w-10 h-10 mb-3 opacity-60" />
      <p className="text-sm">Tidak ada hasil untuk “{q}”.</p>
      <p className="text-xs mt-1">Coba kata kunci lain.</p>
    </div>
  );
}

function UserResults({ users, q, currentUserId, onOpen }) {
  if (!users.length) return <NoResults q={q} />;
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>
          <div className="flex items-center gap-3 py-3 border-b border-moki-line/60">
            <button type="button" onClick={() => onOpen(u)} aria-label={`Profil @${u.username}`}>
              <Avatar src={u.avatar_url} alt={u.display_name} size={44} />
            </button>
            <button
              type="button"
              onClick={() => onOpen(u)}
              className="flex-1 min-w-0 text-left"
            >
              <div className="text-sm font-semibold truncate">{u.display_name}</div>
              <div className="text-xs text-moki-mute">@{u.username}</div>
            </button>
            {u.id !== currentUserId ? <FollowButton userId={u.id} /> : null}
          </div>
        </li>
      ))}
    </ul>
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
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button size="sm" variant={following ? "outline" : "primary"} onClick={toggle} disabled={busy}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}

function VideoResults({ videos, q, onOpen }) {
  if (!videos.length) return <NoResults q={q} />;
  return (
    <ul>
      {videos.map((v) => (
        <li key={v.id}>
          <button
            type="button"
            onClick={() => onOpen(v)}
            className="w-full flex items-center gap-3 py-3 border-b border-moki-line/60 text-left hover:bg-moki-surface/50 px-1 rounded"
          >
            <span className="relative w-16 h-20 rounded overflow-hidden bg-moki-surface shrink-0">
              {v.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail_url} alt={v.title || "thumbnail"} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-moki-mute">
                  <Play className="w-4 h-4" />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold line-clamp-2">{v.title || "(tanpa judul)"}</span>
              <span className="block text-xs text-moki-mute mt-1">@{v.user.username}</span>
              <span className="block text-xs text-moki-mute">{formatCount(v.likes_count)} suka</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function formatCount(n) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
