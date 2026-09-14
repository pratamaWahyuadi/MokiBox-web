"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import CommentSection from "@/components/feed/CommentSection.jsx";

/**
 * Drawer komentar — slide-up dari bawah (mobile), panel kanan (desktop).
 * Konten komentar (list + input) dirender oleh CommentSection.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - videoId: string | null
 * - onCommentAdded: (videoId, delta) => void — bump comments_count di feed
 */
export default function CommentDrawer({ open, onClose, videoId, onCommentAdded }) {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !videoId) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="
          absolute left-0 right-0 bottom-0 h-[80vh]
          md:left-auto md:right-0 md:top-0 md:bottom-0 md:w-[420px] md:h-auto
          bg-moki-surface border-t md:border-t-0 md:border-l border-moki-line
          rounded-t-2xl md:rounded-none
          flex flex-col
          shadow-xl
        "
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-moki-line">
          <h2 className="text-sm font-semibold">Komentar</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-moki-bg/60 flex items-center justify-center text-moki-mute"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 min-h-0">
          <CommentSection key={videoId} videoId={videoId} onCommentAdded={onCommentAdded} />
        </div>
      </div>
    </div>
  );
}
