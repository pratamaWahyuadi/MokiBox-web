"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Bell } from "lucide-react";
import api from "@/lib/api";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import Avatar from "@/components/common/Avatar.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import ErrorState from "@/components/common/ErrorState.jsx";
import NotificationDrawer from "@/components/notif/NotificationDrawer.jsx";

/**
 * Halaman Chat (sebelumnya Inbox) — list percakapan + tombol Bell di header
 * untuk membuka drawer notifikasi.
 */
export default function ChatPage() {
  const router = useRouter();
  const [convs, setConvs] = useState(null);
  const [error, setError] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = useUnreadNotifications();

  const load = async () => {
    setError(null);
    try {
      const res = await api.getConversations();
      setConvs(res?.data || []);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-moki-bg text-moki-text">
      <header className="sticky top-0 z-10 bg-moki-bg/95 backdrop-blur border-b border-moki-line px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-bold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" /> Chat
        </h1>
        <button
          type="button"
          onClick={() => setNotifOpen(true)}
          className="relative w-9 h-9 rounded-full flex items-center justify-center text-moki-text hover:bg-moki-surface"
          aria-label={`Notifikasi${unread ? ` (${unread} belum dibaca)` : ""}`}
        >
          <Bell className="w-5 h-5" />
          {unread > 0 ? (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-moki-accent border-2 border-moki-bg" />
          ) : null}
        </button>
      </header>

      <div className="max-w-2xl mx-auto">
        {convs === null && !error ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} />
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={load} title="Gagal memuat chat" />
        ) : convs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-moki-mute">
            <MessageCircle className="w-10 h-10 mb-3 opacity-60" />
            <p className="text-sm">Belum ada percakapan.</p>
          </div>
        ) : (
          <ul>
            {convs.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/chat/${c.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-moki-line/60 hover:bg-moki-surface text-left"
                >
                  <Avatar src={c.user.avatar_url} alt={c.user.display_name} size={44} />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">
                        {c.user.display_name}
                      </span>
                      <span className="text-[11px] text-moki-mute">
                        {formatRelative(c.updated_at)}
                      </span>
                    </span>
                    <span className="block text-xs text-moki-mute truncate">
                      {c.last_message?.sender_id !== c.user.id ? "Kamu: " : ""}
                      {c.last_message?.content}
                    </span>
                  </span>
                  {c.unread_count > 0 ? (
                    <span className="w-5 h-5 rounded-full bg-moki-accent text-moki-bg text-[10px] font-bold flex items-center justify-center">
                      {c.unread_count}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <NotificationDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onChanged={load}
      />
    </div>
  );
}

function formatRelative(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "baru";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}j`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}h`;
  return `${Math.floor(day / 7)}mgu`;
}
