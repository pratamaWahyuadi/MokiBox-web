"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Avatar from "@/components/common/Avatar.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import { ApiError } from "@/lib/apiError.js";
import { profileHref } from "@/lib/paths.js";

/**
 * Section komentar lengkap: fetch list, tree view (reply indent),
 * input + optimistic post. Dipakai oleh CommentDrawer (mobile/panel)
 * dan halaman Detail Video.
 *
 * Props:
 * - videoId: string
 * - onCommentAdded: (videoId, delta) => void — bump comments_count di parent
 */
export default function CommentSection({ videoId, onCommentAdded }) {
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [input, setInput] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const inputRef = useRef(null);

  const fetchComments = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getComments(videoId, { limit: 50 });
      setComments(res?.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const tree = useMemo(() => buildCommentTree(comments), [comments]);

  const handlePost = async (e) => {
    e?.preventDefault?.();
    const content = input.trim();
    if (!content || !videoId || posting) return;
    setPosting(true);
    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      video_id: videoId,
      user_id: "__me",
      parent_id: replyTo?.id || null,
      content,
      created_at: new Date().toISOString(),
      user: {
        id: "__me",
        username: "you",
        display_name: "You",
        avatar_url: null,
        is_private: false,
      },
      __optimistic: true,
    };
    setComments((prev) => [optimistic, ...prev]);
    setInput("");
    setReplyTo(null);
    try {
      const res = replyTo
        ? await api.replyComment(replyTo.id, content)
        : await api.createComment(videoId, content);
      const created = res?.data;
      if (created) {
        setComments((prev) => prev.map((c) => (c.id === tempId ? created : c)));
      }
      if (typeof onCommentAdded === "function") onCommentAdded(videoId, 1);
    } catch (err) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setInput(content);
      setError(err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading && comments.length === 0 ? (
          <div className="flex justify-center py-12">
            <Spinner size={20} />
          </div>
        ) : null}

        {error && comments.length === 0 && !loading ? (
          <div className="text-center text-xs text-moki-accent mt-6">
            <p>{error instanceof ApiError ? `[${error.code}] ${error.message}` : "Gagal memuat."}</p>
            <button type="button" onClick={fetchComments} className="mt-2 underline">
              Coba lagi
            </button>
          </div>
        ) : null}

        {!loading && !error && comments.length === 0 ? (
          <p className="text-center text-sm text-moki-mute mt-12">
            Belum ada komentar. Jadi yang pertama!
          </p>
        ) : null}

        {tree.map((node) => (
          <CommentNode
            key={node.id}
            node={node}
            onReply={(n) => {
              setReplyTo(n);
              inputRef.current?.focus();
            }}
            onOpenProfile={(username) => router.push(profileHref(username))}
          />
        ))}
      </div>

      <form
        onSubmit={handlePost}
        className="border-t border-moki-line px-3 py-2 flex items-center gap-2"
      >
        <Avatar size={32} alt="You" />
        <div className="flex-1">
          {replyTo ? (
            <div className="text-[11px] text-moki-mute mb-1 flex items-center gap-1">
              Membalas <span className="font-semibold">@{replyTo.user.username}</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-1 underline text-moki-accent"
              >
                batal
              </button>
            </div>
          ) : null}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={1000}
            placeholder={replyTo ? `Balas @${replyTo.user.username}…` : "Tulis komentar…"}
            className="w-full bg-moki-bg border border-moki-line rounded-full px-3 py-2 text-sm text-moki-text placeholder:text-moki-mute focus:outline-none focus:border-moki-accent"
          />
        </div>
        <button
          type="submit"
          disabled={posting || !input.trim()}
          className="w-10 h-10 rounded-full bg-moki-accent text-moki-bg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
          aria-label="Kirim komentar"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function buildCommentTree(list) {
  const byId = new Map();
  const roots = [];
  for (const c of list) byId.set(c.id, { ...c, replies: [] });
  for (const c of byId.values()) {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id).replies.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

function CommentNode({ node, onReply, onOpenProfile }) {
  const goProfile = (e) => {
    e?.stopPropagation?.();
    if (node.user.id !== "__me") onOpenProfile(node.user.username);
  };
  return (
    <div className="py-2">
      <div className="flex gap-3">
        <button type="button" onClick={goProfile} aria-label={`Profil @${node.user.username}`}>
          <Avatar src={node.user.avatar_url} alt={node.user.display_name} size={32} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <button
              type="button"
              onClick={goProfile}
              className="text-sm font-semibold truncate hover:underline"
            >
              {node.user.display_name}
            </button>
            <span className="text-[11px] text-moki-mute">@{node.user.username}</span>
            <span className="text-[11px] text-moki-mute">· {formatRelative(node.created_at)}</span>
          </div>
          <p className="text-sm mt-0.5 break-words whitespace-pre-wrap">{node.content}</p>
          <button
            type="button"
            onClick={() => onReply(node)}
            className="text-[11px] text-moki-mute mt-1 hover:text-moki-text"
          >
            Balas
          </button>
        </div>
      </div>

      {node.replies && node.replies.length > 0 ? (
        <div className="ml-11 mt-1 border-l border-moki-line/60 pl-3">
          {node.replies.map((r) => (
            <CommentNode key={r.id} node={r} onReply={onReply} onOpenProfile={onOpenProfile} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatRelative(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}d`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}j`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}h`;
  if (day < 30) return `${Math.floor(day / 7)}mgu`;
  return `${Math.floor(day / 30)}bln`;
}
