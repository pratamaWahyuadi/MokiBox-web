"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Heart, MessageCircle, UserPlus, X, CheckCheck } from "lucide-react";
import api from "@/lib/api";
import { profileHref, videoHref } from "@/lib/paths.js";
import Avatar from "@/components/common/Avatar.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import ErrorState from "@/components/common/ErrorState.jsx";
import Button from "@/components/common/Button.jsx";

const TYPE_ICON = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
};

const TYPE_TEXT = {
  like: "menyukai video kamu",
  comment: "mengomentari video kamu",
  follow: "mulai mengikuti kamu",
};

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "like", label: "Suka" },
  { key: "comment", label: "Komentar" },
  { key: "follow", label: "Follow" },
];

/**
 * Drawer notifikasi — dipicu dari header /chat. Backdrop + panel kanan
 * dengan list, filter, tandai semua dibaca.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onChanged: () => void — optional, dipanggil setelah mark-all
 */
export default function NotificationDrawer({ open, onClose, onChanged }) {
  const router = useRouter();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.getNotifications({ limit: 50 });
      setItems(res?.data || []);
    } catch (err) {
      setError(err);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const markAll = async () => {
    if (marking) return;
    setMarking(true);
    const prev = items;
    setItems((list) => (list || []).map((n) => ({ ...n, is_read: true })));
    try {
      await api.markAllNotificationsRead();
      if (typeof onChanged === "function") onChanged();
    } catch (err) {
      setItems(prev);
    } finally {
      setMarking(false);
    }
  };

  const openNotification = (n) => {
    onClose();
    const username = n.payload?.username;
    if ((n.type === "like" || n.type === "comment") && n.payload?.video_id && username) {
      router.push(videoHref(username, n.payload.video_id));
    } else if (username) {
      router.push(profileHref(username));
    }
  };

  if (!open) return null;

  const filtered = (items || []).filter((n) => filter === "all" || n.type === filter);
  const unreadCount = (items || []).filter((n) => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="
          absolute right-0 top-0 bottom-0 w-full sm:w-[420px]
          bg-moki-surface border-l border-moki-line
          flex flex-col shadow-xl
        "
        role="dialog"
        aria-modal="true"
        aria-label="Notifikasi"
      >
        <header className="px-4 py-3 border-b border-moki-line flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifikasi
          </h2>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={markAll}
              loading={marking}
              disabled={!unreadCount}
            >
              <CheckCheck className="w-4 h-4" />
              Tandai dibaca
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-moki-bg/60 flex items-center justify-center text-moki-mute"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="px-3 py-2 border-b border-moki-line flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition ${
                filter === f.key
                  ? "bg-moki-bg text-moki-text border-moki-accent"
                  : "text-moki-mute border-moki-line hover:text-moki-text"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {items === null && !error ? (
            <div className="flex justify-center py-16">
              <Spinner size={20} />
            </div>
          ) : error ? (
            <ErrorState error={error} onRetry={load} title="Gagal memuat notifikasi" />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-moki-mute">
              <Bell className="w-10 h-10 mb-3 opacity-60" />
              <p className="text-sm">Belum ada notifikasi.</p>
            </div>
          ) : (
            <ul>
              {filtered.map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell;
                const username = n.payload?.username || "user";
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-moki-line/60 hover:bg-moki-bg ${
                        n.is_read ? "" : "bg-moki-bg/60"
                      }`}
                    >
                      <span className="relative shrink-0">
                        <Avatar alt={username} size={40} />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-moki-accent text-moki-bg flex items-center justify-center">
                          <Icon className="w-2.5 h-2.5" />
                        </span>
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="text-sm">
                          <span className="font-semibold">{username}</span>{" "}
                          {TYPE_TEXT[n.type] || ""}
                        </span>
                        {n.payload?.comment_preview ? (
                          <span className="block text-xs text-moki-mute truncate mt-0.5">
                            “{n.payload.comment_preview}”
                          </span>
                        ) : null}
                        <span className="block text-[11px] text-moki-mute mt-1">
                          {formatRelative(n.created_at)}
                        </span>
                      </span>
                      {!n.is_read ? (
                        <span
                          className="w-2 h-2 rounded-full bg-moki-accent mt-2"
                          aria-label="Belum dibaca"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelative(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min}m lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}j lalu`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}h lalu`;
  return `${Math.floor(day / 7)}mgu lalu`;
}
