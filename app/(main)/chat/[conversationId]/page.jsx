"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import api from "@/lib/api";
import Avatar from "@/components/common/Avatar.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import ErrorState from "@/components/common/ErrorState.jsx";
import { useAuthStore } from "@/stores/useAuthStore";
import { profileHref } from "@/lib/paths.js";

/**
 * Detail percakapan — bubble incoming/outgoing, auto-scroll ke bawah,
 * input kirim pesan.
 */
export default function ConversationPage({ params }) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const conversationId = params?.conversationId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const load = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMessages(conversationId);
      setData({ conversation: res?.conversation, messages: res?.data || [] });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [data?.messages?.length, loading]);

  const send = async (e) => {
    e?.preventDefault?.();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await api.sendMessage(conversationId, content);
      setData((d) => ({ ...d, messages: [...d.messages, res.data] }));
    } catch (err) {
      setError(err);
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const peer = data?.conversation?.user;

  return (
    <div className="h-full flex flex-col bg-moki-bg text-moki-text">
      <header className="sticky top-0 z-10 bg-moki-bg/95 backdrop-blur border-b border-moki-line px-3 py-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-moki-surface"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {peer ? (
          <button
            type="button"
            onClick={() => router.push(profileHref(peer.username))}
            className="flex items-center gap-2 min-w-0"
          >
            <Avatar src={peer.avatar_url} alt={peer.display_name} size={32} />
            <span className="text-sm font-semibold truncate">{peer.display_name}</span>
          </button>
        ) : (
          <span className="text-sm font-semibold">Percakapan</span>
        )}
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} />
          </div>
        ) : error && !data ? (
          <ErrorState error={error} onRetry={load} title="Gagal memuat pesan" />
        ) : (
          <ul className="flex flex-col gap-2">
            {data?.messages?.map((m) => {
              const mine = m.sender_id === currentUserId;
              return (
                <li
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                      mine
                        ? "bg-moki-accent text-moki-bg rounded-br-sm"
                        : "bg-moki-surface text-moki-text rounded-bl-sm"
                    }`}
                  >
                    <p className="break-words whitespace-pre-wrap">{m.content}</p>
                    <span
                      className={`block text-[10px] mt-0.5 ${
                        mine ? "text-moki-bg/70" : "text-moki-mute"
                      }`}
                    >
                      {formatTime(m.created_at)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form
        onSubmit={send}
        className="border-t border-moki-line px-3 py-2 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          placeholder="Tulis pesan…"
          className="flex-1 bg-moki-surface border border-moki-line rounded-full px-3 py-2 text-sm text-moki-text placeholder:text-moki-mute focus:outline-none focus:border-moki-accent"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="w-10 h-10 rounded-full bg-moki-accent text-moki-bg flex items-center justify-center disabled:opacity-50 hover:brightness-110"
          aria-label="Kirim pesan"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function formatTime(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
